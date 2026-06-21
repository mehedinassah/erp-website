import nodemailer from "nodemailer";

// Email via Gmail SMTP — no custom domain required.
// Set these env vars (Vercel + local .env):
//   SMTP_USER = your-gmail@gmail.com
//   SMTP_PASS = 16-char Gmail App Password (Google Account → Security → App passwords)
// Emails are sent "from" SMTP_USER.

export function emailConfigured() {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

let transporter: nodemailer.Transporter | null = null;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

export async function sendEmail(opts: { to: string; subject: string; html: string; text?: string }) {
  if (!emailConfigured()) throw new Error("Email is not configured (SMTP_USER / SMTP_PASS missing).");
  await getTransporter().sendMail({
    from: `PERICO ERP <${process.env.SMTP_USER}>`,
    to: opts.to,
    subject: opts.subject,
    text: opts.text ?? opts.html.replace(/<[^>]+>/g, " "),
    html: opts.html,
  });
}

/** Send low-stock alert email to the tenant admin. Fire-and-forget — never throws. */
export async function sendLowStockAlert(opts: {
  to: string;
  businessName: string;
  alerts: { label: string; sku: string; qty: number; threshold: number }[];
}) {
  if (!emailConfigured() || opts.alerts.length === 0) return;
  const rows = opts.alerts
    .map(
      (a) =>
        `<tr><td style="padding:6px 12px;border-bottom:1px solid #e7e2da">${a.label}</td>
         <td style="padding:6px 12px;border-bottom:1px solid #e7e2da;color:#78716c">${a.sku}</td>
         <td style="padding:6px 12px;border-bottom:1px solid #e7e2da;text-align:right;font-weight:600;color:#b91c1c">${a.qty}</td>
         <td style="padding:6px 12px;border-bottom:1px solid #e7e2da;text-align:right;color:#78716c">${a.threshold}</td></tr>`,
    )
    .join("");
  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:auto;padding:24px;color:#1c1917">
    <h2 style="margin:0 0 4px;font-size:20px">⚠️ Low stock alert — ${opts.businessName}</h2>
    <p style="color:#78716c;font-size:14px;margin:0 0 20px">${opts.alerts.length} variant${opts.alerts.length > 1 ? "s are" : " is"} at or below the reorder threshold.</p>
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead>
        <tr style="background:#f5ecd8">
          <th style="padding:8px 12px;text-align:left">Item</th>
          <th style="padding:8px 12px;text-align:left">SKU</th>
          <th style="padding:8px 12px;text-align:right">In stock</th>
          <th style="padding:8px 12px;text-align:right">Threshold</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="color:#78716c;font-size:12px;margin:20px 0 0">Log in to PERICO to review and reorder stock.</p>
  </div>`;
  try {
    await getTransporter().sendMail({
      from: `PERICO ERP <${process.env.SMTP_USER}>`,
      to: opts.to,
      subject: `⚠️ Low stock alert — ${opts.alerts.length} item${opts.alerts.length > 1 ? "s" : ""} need restocking`,
      text: opts.alerts.map((a) => `${a.label} (${a.sku}): ${a.qty} in stock (threshold: ${a.threshold})`).join("\n"),
      html,
    });
  } catch {
    // Best-effort — never crash the main operation
  }
}

/** Branded password-reset email. */
export function resetEmailHtml(name: string, link: string) {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:auto;padding:24px;color:#1c1917">
    <h2 style="margin:0 0 4px;font-size:20px">Reset your PERICO password</h2>
    <p style="color:#78716c;font-size:14px;margin:0 0 20px">Hi ${name || "there"}, we received a request to reset your password.</p>
    <a href="${link}" style="display:inline-block;background:#a16207;color:#fff;text-decoration:none;padding:11px 22px;border-radius:8px;font-weight:600;font-size:14px">Reset password</a>
    <p style="color:#78716c;font-size:12px;margin:20px 0 0">This link expires in 1 hour and can be used once. If you didn't request this, you can safely ignore this email.</p>
    <p style="color:#a8a29e;font-size:12px;margin:12px 0 0;word-break:break-all">Or paste this link: ${link}</p>
  </div>`;
}
