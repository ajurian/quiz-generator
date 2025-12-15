import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * Type for the Drizzle database instance
 */
export type DrizzleDatabase = ReturnType<
  typeof drizzle<typeof schema, ReturnType<typeof neon<false, false>>>
>;

/**
 * Creates a new database connection with optional custom URL
 * Useful for testing or connecting to different databases
 */
export function createDatabaseConnection(databaseUrl: string): DrizzleDatabase {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }
  const client = neon(databaseUrl);
  return drizzle({ client, schema });
}

/**
 * Default database instance
 */
let databaseInstance: DrizzleDatabase | null = null;

/**
 * Gets or creates the singleton database instance
 */
export function getDatabase(databaseUrl?: string): DrizzleDatabase {
  if (!databaseInstance) {
    databaseInstance = createDatabaseConnection(
      databaseUrl ?? process.env.DATABASE_URL!
    );
  }
  return databaseInstance;
}
