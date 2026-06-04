# Deploying PERICO ERP (Supabase + Vercel)

This gets PERICO live on the internet with a cloud PostgreSQL database.
Total time: ~20 minutes. You do the account steps; the code is already ready.

---

## 1. Create the database (Supabase)

1. Go to **https://supabase.com** → sign up (free).
2. Click **New project**.
   - Name: `perico`
   - Database password: **choose a strong one and save it** — you'll need it.
   - Region: **Southeast Asia (Singapore)** — closest to Bangladesh.
3. Wait ~2 minutes for it to provision.
4. Go to **Project Settings → Database → Connection string → "URI"**.
   You'll see two you need:
   - **Transaction pooler** (port **6543**) → this is your `DATABASE_URL`
   - **Direct connection** (port **5432**) → this is your `DIRECT_URL`
   Replace `[YOUR-PASSWORD]` in each with the password from step 2.

---

## 2. Push the schema + seed data to Supabase

On your PC, create a `.env` file (copy `.env.example`) and paste both URLs:

```
DATABASE_URL="postgresql://...pooler...:6543/postgres"
DIRECT_URL="postgresql://...:5432/postgres"
AUTH_SECRET="<the long random string Claude generated for you>"
```

Then run (these create the tables and seed demo data):

```bash
npm run db:push
npm run db:seed
```

> The app login after seeding is **mehedinas69@gmail.com / password123**.
> For a clean production start with no demo data, skip `db:seed` and just
> sign up a fresh business at `/signup`.

---

## 3. Deploy the app (Vercel)

1. Go to **https://vercel.com** → sign up with your **GitHub** account.
2. Click **Add New → Project** → import `mehedinassah/erp-website`.
3. Before clicking Deploy, open **Environment Variables** and add:

   | Name           | Value                                            |
   |----------------|--------------------------------------------------|
   | `DATABASE_URL` | the pooled (6543) connection string              |
   | `DIRECT_URL`   | the direct (5432) connection string              |
   | `AUTH_SECRET`  | the long random string                           |

4. Click **Deploy**. First build takes ~2–3 minutes.
5. When it finishes you get a live URL like `https://erco-website.vercel.app`.

That URL is your live SaaS. Any business can visit it and sign up at `/signup`.

---

## Notes

- **Connection pooling**: the app uses the pooler (6543) because Vercel runs
  serverless functions — many short-lived connections. The direct URL (5432)
  is only for CLI schema pushes/seeds.
- **Secrets**: `.env` is gitignored and never committed. Production secrets
  live only in Vercel's dashboard.
- **Custom domain**: once you have a `.com`/`.com.bd`, add it in
  Vercel → Project → Settings → Domains.
- **Redeploys**: every `git push` to `main` auto-deploys.
