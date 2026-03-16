#!/usr/bin/env node
const { URL } = require('url');
const mysql = require('mysql2/promise');

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
    password: decodeURIComponent(dbUrl.password || ''),
    database: dbUrl.pathname.replace(/^\//, ''),
    ssl: { rejectUnauthorized: true },
  });
  const [rows] = await conn.query("SELECT id, orderNumber, customerEmail, total, paymentStatus, createdAt FROM orders ORDER BY createdAt DESC LIMIT 5;");
  console.log(rows);
  await conn.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

