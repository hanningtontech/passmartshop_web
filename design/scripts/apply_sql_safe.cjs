#!/usr/bin/env node
const fs = require('fs');
const { URL } = require('url');
const mysql = require('mysql2/promise');

async function main() {
  const sqlPath = `${__dirname}/../drizzle/0001_sudden_invaders.sql`;
  if (!process.env.DATABASE_URL) {
    console.error("Please set DATABASE_URL env var (mysql://user:pass@host:port/db)");
    process.exit(1);
  }

  const dbUrl = new URL(process.env.DATABASE_URL);
  const host = dbUrl.hostname;
  const port = Number(dbUrl.port || 3306);
  const user = decodeURIComponent(dbUrl.username);
  const password = decodeURIComponent(dbUrl.password || '');
  const database = dbUrl.pathname.replace(/^\//, '');

  const raw = fs.readFileSync(sqlPath, 'utf8');
  // Split on the explicit marker used in the file
  const parts = raw.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean);

  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
    ssl: { rejectUnauthorized: true },
    multipleStatements: true,
  });

  try {
    for (const part of parts) {
      const safe = part.replace(/CREATE TABLE\s+`/ig, 'CREATE TABLE IF NOT EXISTS `');
      const stmt = safe.trim();
      if (!stmt) continue;
      console.log('Executing statement snippet...');
      try {
        await conn.query(stmt);
        console.log('OK');
      } catch (err) {
        console.warn('Statement failed (continuing):', err.message || err);
      }
    }
    console.log('Done applying SQL (safe mode).');
  } finally {
    await conn.end();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

