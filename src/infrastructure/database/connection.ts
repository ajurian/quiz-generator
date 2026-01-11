import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
// import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
// import postgres from "postgres";
import * as schema from "./schema";

/**
 * Type for the Drizzle database instance
 */
export type DrizzleDatabase = ReturnType<
  typeof drizzleNeon<typeof schema, ReturnType<typeof neon<false, false>>>
>;

/**
 * Creates a new database connection
 * - Development: Uses postgres-js (TCP) for local Docker database
 * - Production: Uses Neon HTTP driver (stateless)
 */
export function createDatabaseConnection(databaseUrl: string): DrizzleDatabase {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  // // Use postgres-js for local development (Docker PostgreSQL)
  // if (
  //   process.env.NODE_ENV === "development" ||
  //   databaseUrl.includes("localhost") ||
  //   databaseUrl.includes("127.0.0.1")
  // ) {
  //   return drizzlePostgres({
  //     client: postgres(databaseUrl, {
  //       max: 1, // Single connection per request context
  //       idle_timeout: 0, // Close immediately after use
  //       connect_timeout: 10,
  //     }),
  //     schema,
  //   });
  // }

  // Use Neon HTTP driver for production (stateless)
  return drizzleNeon({
    client: neon(databaseUrl),
    schema,
  });
}

/**
 * Gets a database connection
 * Creates a fresh connection each time to avoid Workers I/O context issues
 */
export function getDatabase(databaseUrl?: string): DrizzleDatabase {
  return createDatabaseConnection(databaseUrl ?? process.env.DATABASE_URL!);
}
