# MySQL & migration setup – step by step

**ECONNREFUSED** means nothing is listening on `localhost:3306`. Follow these steps in order.

---

## Step 1: Install or start MySQL

### Option A – MySQL is already installed

1. Open **Services** (Win + R → `services.msc` → Enter).
2. Find **MySQL** or **MySQL80** (or similar).
3. Right‑click → **Start**. Status should be “Running”.

### Option B – Install MySQL

1. Download MySQL Installer: https://dev.mysql.com/downloads/installer/
2. Run it and choose **MySQL Server**.
3. Set a **root password** (e.g. `passmartshop`) and remember it.
4. Complete the install and start the MySQL service (or start it from Services as in Option A).

### Option C – XAMPP

1. Install XAMPP: https://www.apachefriends.org/
2. Open **XAMPP Control Panel** → start **MySQL**.

---

## Step 2: Create database and user (optional)

If the database or user does not exist yet:

1. Open **Command Prompt** or **PowerShell** and run:
   ```powershell
   mysql -u root -p
   ```
   Enter your MySQL root password when asked.

2. In the MySQL prompt, run (change `passmartshop` if you use another password):

   ```sql
   CREATE DATABASE IF NOT EXISTS passmartshop;
   -- Optional: create a dedicated user
   -- CREATE USER IF NOT EXISTS 'passmartshop'@'localhost' IDENTIFIED BY 'passmartshop';
   -- GRANT ALL ON passmartshop.* TO 'passmartshop'@'localhost';
   -- FLUSH PRIVILEGES;
   EXIT;
   ```

---

## Step 3: Apply the migration

You can do this in one of two ways.

### Option A – Run migration with Drizzle (recommended if DB is running)

1. In `design\.env`, set your real MySQL password (same as in Step 2):

   ```env
   DATABASE_URL=mysql://root:YOUR_MYSQL_PASSWORD@localhost:3306/passmartshop
   ```

   Example if password is `passmartshop`:

   ```env
   DATABASE_URL=mysql://root:passmartshop@localhost:3306/passmartshop
   ```

2. In PowerShell, from the `design` folder:

   ```powershell
   cd "c:\Users\Hannie\OneDrive\Documents\passmartshop_web\design"
   pnpm run db:migrate
   ```

   If it runs without errors, the migration is applied.

### Option B – Run SQL by hand (no Drizzle connection needed)

1. Open **MySQL Workbench** (or any MySQL client) and connect as `root` with your password.
2. Select the database:
   ```sql
   USE passmartshop;
   ```
3. Open the file  
   `c:\Users\Hannie\OneDrive\Documents\passmartshop_web\design\drizzle\APPLY_PAYMENT_COLUMNS_MANUAL.sql`  
   and run its contents (or copy‑paste into a query tab and execute).

   If a column already exists, you’ll get an error for that line only; the rest will still run. You can ignore “Duplicate column” errors.

---

## Step 4: Check that the app can connect

1. In `design\.env`, ensure you have (with your real password):

   ```env
   DATABASE_URL=mysql://root:YOUR_PASSWORD@localhost:3306/passmartshop
   ```

2. Start your app (e.g. `pnpm run dev`).
3. Place an order from the storefront. If it succeeds, MySQL and the migration are set up correctly.

---

## Quick reference

| Step | What to do |
|------|------------|
| 1 | Start MySQL (Services / XAMPP / Installer). |
| 2 | Create DB: `mysql -u root -p` → `CREATE DATABASE IF NOT EXISTS passmartshop;` → `EXIT;` |
| 3a | Set `DATABASE_URL` in `design\.env`, then run `pnpm run db:migrate` in `design`. |
| 3b | Or run `design\drizzle\APPLY_PAYMENT_COLUMNS_MANUAL.sql` in MySQL Workbench. |
| 4 | Start app and place an order to verify. |

**Username:** `root` (or a user you created).  
**Password:** the one you set for MySQL.  
**Database:** `passmartshop`.  
**Port:** `3306` (default).
