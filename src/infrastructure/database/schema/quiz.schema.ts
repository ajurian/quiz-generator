import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { questions } from "./question.schema";
import { users } from "../../auth/auth.schema";

/**
 * Quizzes table schema
 *
 * Stores quiz metadata including the bit-packed question distribution.
 * Each quiz belongs to a user and can have multiple questions.
 */
export const quizzes = pgTable("quizzes", {
  /** Unique identifier for the quiz (UUID v4) */
  id: uuid("id").primaryKey().defaultRandom(),

  /** Reference to the user who created the quiz */
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  /** Display title of the quiz */
  title: text("title").notNull(),

  /**
   * Bit-packed question distribution (int32)
   * - Bits 0-7: Single Best Answer count (0-255)
   * - Bits 8-15: Two Statements count (0-255)
   * - Bits 16-23: Contextual count (0-255)
   */
  questionDistribution: integer("question_distribution").notNull(),

  /** Whether the quiz is publicly accessible */
  isPublic: boolean("is_public").default(false).notNull(),

  /** Timestamp when the quiz was created */
  createdAt: timestamp("created_at").defaultNow().notNull(),

  /** Timestamp when the quiz was last updated */
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Quiz relations
 * Defines the relationship between quizzes, questions, and users
 */
export const quizzesRelations = relations(quizzes, ({ many, one }) => ({
  questions: many(questions),
  user: one(users, {
    fields: [quizzes.userId],
    references: [users.id],
  }),
}));

/**
 * Type for inserting a new quiz
 */
export type InsertQuiz = typeof quizzes.$inferInsert;

/**
 * Type for selecting a quiz from the database
 */
export type SelectQuiz = typeof quizzes.$inferSelect;
