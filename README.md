# RONG — Inventory & Stock Management ERP

A production-grade inventory ERP for a Dhaka clothing brand. Manage the full
catalogue (with size × colour variants), control stock across warehouses, raise
purchase orders, and fulfil sales with automatic stock deduction and printable
BDT invoices — all behind a role-based login.

> **RONG** (রং — “colour”) is a placeholder brand name.
---

## 📖 User guides

- [How to record your first sale](docs/how-to-record-your-first-sale.md) — POS checkout and full invoicing, step by step.

## ✨ Features

- **Dashboard** — live KPIs (30-day revenue, units in stock, active products,
  low-stock alerts), a sales-trend area chart, top-categories bar chart,
  low-stock watchlist, and recent orders.
- **Products & variants** — every product carries a size × colour variant
  matrix with its own SKU and barcode; create, edit, archive, search, filter,
  and paginate.
- **Stock control** — per-variant, per-warehouse stock levels; record
  receipts / sales / transfers / corrections; low-stock filtering; a live
  movement feed. All changes are audited as `StockMovement` rows.
- **Purchasing** — supplier directory plus purchase orders with line items;
  **receiving** a PO increments stock and logs movements automatically.
- **Sales & invoices** — customers, sales orders with **live stock checks and
  automatic deduction**, discounts, and a clean **printable invoice**.
- **Auth & roles** — Admin / Manager / Staff with route protection and
  role-gated actions (e.g. only Admin/Manager manage the catalogue & purchasing).
- **Design** — fashion-luxury editorial system: warm black + gold on stone,
  Playfair Display + Inter, tasteful motion that respects `prefers-reduced-motion`,
  full **light/dark** mode, and responsive from 375px up.

## 🧱 Tech stack

| Layer    | Choice |
|----------|--------|
| Framework | Next.js 16 (App Router, Server Components, Server Actions) |
| Language  | TypeScript |
| Styling   | Tailwind CSS v4 (CSS-first theme) + bespoke component library |
| UI        | Radix primitives, lucide-react icons, Framer Motion-ready |
| Charts    | Recharts |
| Database  | Prisma 7 + SQLite (dev) · **PostgreSQL-ready** |
| Auth      | bcryptjs + signed JWT session (jose), edge proxy guard |

---

## 🚀 Getting started

> Requires **Node 18.18+** (tested on Node 22).

```bash
# 1. Install dependencies (also generates the Prisma client via postinstall)
npm install

# 2. Create the database schema + seed realistic demo data
npm run db:push
npm run db:seed

# 3. Run the dev server
npm run dev
```


### First login (seeded admin)

| Role  | Email                    | Password      |
|-------|--------------------------|---------------|
| Admin | `mehedinas69@gmail.com`  | `password123` |

Change this password after first login. Managers and Staff are then created by
the admin in-app at **Settings → Users & access** — assign any email + password
+ role, and that person logs in with exactly those credentials.

---

## 📜 Scripts

| Script | What it does |
|--------|--------------|
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run db:push` | Apply the Prisma schema to the database |
| `npm run db:seed` | Seed demo data (clears existing data first) |
| `npm run db:reset` | Force-reset the schema and re-seed |
| `npm run db:studio` | Open Prisma Studio to browse data |

---

## 🐘 Switching to PostgreSQL

The schema is written to make this a small change:

1. In `prisma/schema.prisma`, set the datasource provider:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. In `src/lib/prisma.ts`, swap the SQLite adapter for the Postgres adapter:
   ```ts
   import { PrismaPg } from "@prisma/adapter-pg"; // npm i @prisma/adapter-pg pg
   const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
   ```
   (also update `prisma/seed.ts`, which uses the same adapter)
3. Point `DATABASE_URL` in `.env` at your Postgres instance, then
   `npm run db:push && npm run db:seed`.

All money is stored as integer **BDT taka**, and statuses/roles are validated
string fields (so the model is portable across databases).

---

## 🗂️ Project structure

```
prisma/
  schema.prisma        # data model (12 models)
  seed.ts              # realistic Dhaka clothing demo data
src/
  app/
    login/             # auth screen + server action
    (app)/             # protected app (shell layout + all modules)
      page.tsx         # dashboard
      products/  stock/  purchases/  suppliers/  sales/  customers/
  components/
    ui/                # bespoke primitives (button, card, table, badge…)
    app/               # shell, forms, stat cards, nav
    charts/            # recharts wrappers
  lib/                 # prisma client, auth/session, validation, formatting
  proxy.ts             # route protection (Next 16 "proxy" = middleware)
```

---

## 🔐 Production notes

- Set a strong `AUTH_SECRET` in the environment before deploying.
- Sessions are httpOnly JWT cookies (7-day expiry), `secure` in production.
- Run behind HTTPS; the proxy guard redirects unauthenticated traffic to `/login`.
