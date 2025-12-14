import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client);

async function main() {
  try {
    // Run migrations from your migrations folder
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("✅ Migrations applied successfully");
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  } finally {
    // await client.end({ timeout: 5 });
  }
}

main();
