import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * Neon PostgreSQL database connection
 * This creates a connection pool to the database
 */
const client = neon(process.env.DATABASE_URL!);

/**
 * Drizzle ORM instance configured with our schema
 * This is the main database interface used throughout the application
 */
export const db = drizzle({ client, schema });

/**
 * Type for the Drizzle database instance
 */
export type DrizzleDatabase = typeof db;

/**
 * Creates a new database connection with optional custom URL
 * Useful for testing or connecting to different databases
 */
export function createDatabaseConnection(
  databaseUrl?: string
): DrizzleDatabase {
  const connectionUrl = databaseUrl ?? process.env.DATABASE_URL;
  if (!connectionUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }
  const client = neon(connectionUrl);
  return drizzle({ client, schema });
}
