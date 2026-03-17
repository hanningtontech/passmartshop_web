#!/usr/bin/env node
const { URL } = require("url");
const mysql = require("mysql2/promise");

const REQUIRED_COLUMNS = [
  {
    name: "paymentMethod",
    sql: "ALTER TABLE `orders` ADD COLUMN `paymentMethod` varchar(32) NULL",
  },
  {
    name: "mpesaTransactionCode",
    sql: "ALTER TABLE `orders` ADD COLUMN `mpesaTransactionCode` varchar(64) NULL",
  },
  {
    name: "paymentStatus",
    sql: "ALTER TABLE `orders` ADD COLUMN `paymentStatus` enum('pending','awaiting_verification','completed','failed','refunded') NULL DEFAULT 'pending'",
  },
  {
    name: "notes",
    sql: "ALTER TABLE `orders` ADD COLUMN `notes` text NULL",
  },
];

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("Please set DATABASE_URL");
    process.exit(1);
  }

  const dbUrl = new URL(process.env.DATABASE_URL);
  const conn = await mysql.createConnection({
    host: dbUrl.hostname,
    port: Number(dbUrl.port || 3306),
    user: decodeURIComponent(dbUrl.username),
    password: decodeURIComponent(dbUrl.password || ""),
    database: dbUrl.pathname.replace(/^\//, ""),
    ssl: { rejectUnauthorized: true },
  });

  try {
    const [rows] = await conn.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders';"
    );
    const existing = new Set(rows.map((r) => r.COLUMN_NAME));

    const missing = REQUIRED_COLUMNS.filter((c) => !existing.has(c.name));
    if (missing.length === 0) {
      console.log("OK: orders table already has required columns.");
      return;
    }

    console.log("Missing columns:", missing.map((m) => m.name).join(", "));
    for (const col of missing) {
      console.log("Applying:", col.sql);
      await conn.query(col.sql);
      console.log("OK:", col.name);
    }

    console.log("Done.");
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

