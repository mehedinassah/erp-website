// Finds "phantom" sales orders: FULFILLED orders that still carry a `total`
// (so they count as dashboard revenue) but have zero line items — so they
// contribute no units, COGS, or category. These are produced by the OLD
// deleteProduct behaviour, which removed a product's SOItem rows but left the
// SalesOrder behind. (Fixed going forward: products with history now archive
// instead of hard-deleting.)
//
// Report-only by default. To actually delete the phantom orders, pass --delete:
//   node scripts/find-orphan-orders.cjs           # report
//   node scripts/find-orphan-orders.cjs --delete  # report + remove them
//
// Uses DATABASE_URL from your environment (.env). Point it at the LIVE database
// whose numbers you want to fix.

require("dotenv/config");
const { Client } = require("pg");

const doDelete = process.argv.includes("--delete");

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const { rows } = await client.query(`
      SELECT so.id, so."orderNumber", so."tenantId", so.total, so."orderDate", so.status
      FROM "SalesOrder" so
      LEFT JOIN "SOItem" it ON it."salesOrderId" = so.id
      WHERE so.status = 'FULFILLED'
      GROUP BY so.id
      HAVING COUNT(it.id) = 0
      ORDER BY so."orderDate" DESC
    `);

    if (rows.length === 0) {
      console.log("No phantom orders found — every fulfilled order has line items. ✅");
      return;
    }

    const totalRevenue = rows.reduce((s, r) => s + Number(r.total), 0);
    console.log(`Found ${rows.length} phantom fulfilled order(s) with no line items.`);
    console.log(`They account for ${totalRevenue.toLocaleString()} in phantom revenue.\n`);
    for (const r of rows) {
      console.log(`  ${r.orderNumber}  total=${r.total}  date=${r.orderDate.toISOString().slice(0, 10)}  tenant=${r.tenantId}`);
    }

    if (!doDelete) {
      console.log("\nReport only. Re-run with --delete to remove these orders and clean the dashboard.");
      return;
    }

    const ids = rows.map((r) => r.id);
    const res = await client.query(`DELETE FROM "SalesOrder" WHERE id = ANY($1::text[])`, [ids]);
    console.log(`\nDeleted ${res.rowCount} phantom order(s). Dashboard revenue/margin/units are now consistent.`);
  } finally {
    await client.end();
  }
})().catch((e) => {
  console.error("Failed:", e.message);
  process.exit(1);
});
