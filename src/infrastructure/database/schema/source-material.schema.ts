import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { quizzes } from "./quiz.schema";

/**
 * Source Materials table schema
 *
 * Stores study material files uploaded for quiz generation.
 * Files are stored in R2 with key format: {userId}/{quizSlug}/{uuidv7-base64url}
 */
export const sourceMaterials = pgTable("source_materials", {
  /** Unique identifier for the source material (UUID v7) */
  id: uuid("id").primaryKey(),

  /** Reference to the parent quiz (cascade delete enabled) */
  quizId: uuid("quiz_id")
    .notNull()
    .references(() => quizzes.id, { onDelete: "cascade" }),

  /** Original filename of the uploaded file */
  title: varchar("title", { length: 255 }).notNull(),

  /** R2 object key for the file */
  fileKey: text("file_key").notNull(),

  /** MIME type of the file */
  mimeType: varchar("mime_type", { length: 127 }).notNull(),

  /** File size in bytes */
  sizeBytes: integer("size_bytes").notNull(),

  /** 1-based reference index within the quiz, used by questions to reference source */
  quizReferenceIndex: integer("quiz_reference_index").notNull(),

  /** Timestamp when the source material was created */
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Source Material relations
 * Defines the relationship between source materials and their parent quiz
 */
export const sourceMaterialsRelations = relations(
  sourceMaterials,
  ({ one }) => ({
    quiz: one(quizzes, {
      fields: [sourceMaterials.quizId],
      references: [quizzes.id],
    }),
  })
);

/**
 * Type for inserting a new source material
 */
export type InsertSourceMaterial = typeof sourceMaterials.$inferInsert;

/**
 * Type for selecting a source material from the database
 */
export type SelectSourceMaterial = typeof sourceMaterials.$inferSelect;
