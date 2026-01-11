import { createDatabaseConnection } from "@/infrastructure";
import { sourceMaterials } from "@/infrastructure/database";
import { sql } from "drizzle-orm";

await createDatabaseConnection(process.env.DATABASE_URL!)
  .update(sourceMaterials)
  .set({
    quizReferenceIndex: sql`${sourceMaterials.quizReferenceIndex} - 1`,
  });
