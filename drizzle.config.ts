import "dotenv/config";

import { defineConfig } from "drizzle-kit";
const {
  DATABASE_HOST,
  DATABASE_PORT,
  DATABASE_USER,
  DATABASE_PASSWORD,
  DATABASE_NAME,
  DATABASE_SSL,
} = process.env;

const password = DATABASE_PASSWORD ? `:${DATABASE_PASSWORD}` : "";
const sslMode = DATABASE_SSL || "disable";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/lib/server/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: `postgresql://${DATABASE_USER!}${password}@${DATABASE_HOST!}:${DATABASE_PORT || 5432}/${DATABASE_NAME!}?sslmode=${sslMode}`,
  },
});
