import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit Configuration
 *
 * This configuration is used by Drizzle Kit for migrations and schema management.
 * Run `bunx drizzle-kit generate` to generate migrations.
 * Run `bunx drizzle-kit migrate` to apply migrations.
 * Run `bunx drizzle-kit studio` to open Drizzle Studio.
 */
export default defineConfig({
  schema: [
    "./src/infrastructure/database/schema/index.ts",
    "./src/infrastructure/auth/auth.schema.ts",
  ],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
