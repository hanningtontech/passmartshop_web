# Taking MySQL (Orders DB) Live

This guide covers moving from **local MySQL** (or running the DB only in PowerShell) to a **hosted MySQL** so the orders server works in production (e.g. passmart.com).

---

## 1. What “live” means

- **Before:** You run the server locally with `DATABASE_URL` in `.env` and maybe run migrations from PowerShell.
- **After:** You use a **hosted MySQL** (cloud). The **production backend** (e.g. Cloud Run, Railway, VPS) has `DATABASE_URL` set to that host. Orders from the live site are stored there; no local DB required.

---

## 2. Choose a hosted MySQL

Use any **MySQL-compatible** host. Examples:

| Provider        | Notes |
|----------------|-------|
| **TiDB Cloud**  | MySQL-compatible; you may already have a cluster (see `.manus` db queries). |
| **PlanetScale** | MySQL, serverless; free tier available. |
| **Railway**     | MySQL add-on; easy if you deploy the app on Railway. |
| **AWS RDS**     | MySQL or MariaDB. |
| **Other**       | Any host that gives you a connection string like `mysql://user:password@host:port/database`. |

Create a database and get the **connection URL**.

---

## 3. Format of `DATABASE_URL`

Use a single URL in this form:

```text
mysql://USER:PASSWORD@HOST:PORT/DATABASE_NAME
```

- **USER** / **PASSWORD**: DB user and password (avoid special characters that need encoding in URLs).
- **HOST** / **PORT**: From your provider (e.g. `gateway01.region.prod.aws.tidbcloud.com`, port often `4000` for TiDB or `3306` for MySQL).
- **DATABASE_NAME**: The database you created.

Example (TiDB Cloud style):

```text
mysql://user123:yourPassword@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/passmartshop
```

Some providers give a **pre-built URL** in the dashboard; use that as `DATABASE_URL`.

---

## 4. Run migrations against the live DB (PowerShell)

From your machine, run migrations **once** (or when you add new schema) so the hosted DB has all tables (users, orders, orderItems, etc.).

1. Open PowerShell and go to the **design** folder:

   ```powershell
   cd "c:\Users\Hannie\OneDrive\Documents\Trailer blazer Projects\passmartshop_web\design"
   ```

2. Set `DATABASE_URL` to the **live** URL (replace with your real URL):

   ```powershell
   $env:DATABASE_URL = "mysql://USER:PASSWORD@HOST:PORT/DATABASE_NAME"
   ```

3. Install deps if needed, then run migrations:

   ```powershell
   pnpm install
   pnpm db:migrate
   ```

4. If you use a **`.env`** file in `design/` instead of setting the variable in the session, put the same URL there:

   ```env
   DATABASE_URL=mysql://USER:PASSWORD@HOST:PORT/DATABASE_NAME
   ```

   Then run:

   ```powershell
   pnpm db:migrate
   ```

After this, the live database has the correct schema (orders, orderItems, users, etc.).

---

## 5. Set `DATABASE_URL` on the production server

Wherever the **Node/Express backend** runs in production (e.g. **Google Cloud Run**, **Railway**, **VPS**), set **environment variables** for that service:

- **`DATABASE_URL`** – the same MySQL URL you used for migrations.
- Other server vars you already use: **`JWT_SECRET`**, **`OWNER_OPEN_ID`**, **`OAUTH_SERVER_URL`**, **`BUILT_IN_FORGE_API_URL`**, **`BUILT_IN_FORGE_API_KEY`**, etc. (see `design/server/_core/env.ts` and BACKBLAZE_B2_HOSTING_GUIDE.md).

The backend reads `process.env.DATABASE_URL` in `design/server/db.ts`; no code change is needed, only the env in production.

---

## 6. Checklist – MySQL live

- [ ] Hosted MySQL created and **connection URL** obtained.
- [ ] **Migrations** run once against that URL (e.g. from PowerShell: `$env:DATABASE_URL = "..."` then `pnpm db:migrate` in `design/`).
- [ ] **Production backend** has `DATABASE_URL` set to the same URL (and other server env vars set).
- [ ] Optional: Remove or avoid using a local MySQL for production; the live site uses only the hosted DB.

After this, orders from the live site are stored in your hosted MySQL; you are no longer dependent on a local DB for production.
