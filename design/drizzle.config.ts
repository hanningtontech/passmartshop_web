import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const dbUrl = new URL(process.env.DATABASE_URL!);

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    host: dbUrl.hostname,
    port: Number(dbUrl.port || "3306"),
    user: dbUrl.username,
    password: dbUrl.password,
    database: dbUrl.pathname.replace(/^\//, ""),
    ssl: {
      rejectUnauthorized: true,
    },
  },
});
