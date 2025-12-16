import {
  pgTable,
  uuid,
  varchar,
  real,
  integer,
  timestamp,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { quizzes } from "./quiz.schema";
import { users } from "../../auth/auth.schema";

/**
 * Quiz Attempts table schema
 *
 * Stores user attempts at completing quizzes.
 * Every attempt is recorded (no preview mode).
 * Tracks status, score, and duration.
 */
export const quizAttempts = pgTable(
  "quiz_attempts",
  {
    /** Unique identifier for the attempt (UUID v7) */
    id: uuid("id").primaryKey(),

    /** URL-safe slug derived from UUID (22 chars, base64url) */
    slug: varchar("slug", { length: 22 }).notNull().unique(),

    /** Reference to the quiz being attempted */
    quizId: uuid("quiz_id")
      .notNull()
      .references(() => quizzes.id, { onDelete: "cascade" }),

    /** Reference to the user making the attempt (nullable for anonymous) */
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),

    /** Attempt status: in_progress or submitted */
    status: varchar("status", { length: 20 }).default("in_progress").notNull(),

    /** Score achieved (0-100, null if not submitted) */
    score: real("score"),

    /** Duration in milliseconds (calculated on submission) */
    durationMs: integer("duration_ms"),

    /** When the attempt was started */
    startedAt: timestamp("started_at").defaultNow().notNull(),

    /** When the attempt was submitted (null if in progress) */
    submittedAt: timestamp("submitted_at"),

    /** User's selected answers (questionId -> optionId) */
    answers: jsonb("answers")
      .$type<Record<string, string>>()
      .default({})
      .notNull(),
  },
  (table) => [
    // Index for finding attempts by quiz and user
    index("quiz_attempts_quiz_user_idx").on(table.quizId, table.userId),
    // Index for finding submitted attempts ordered by date
    index("quiz_attempts_quiz_user_submitted_idx").on(
      table.quizId,
      table.userId,
      table.submittedAt
    ),
  ]
);

/**
 * Quiz Attempt relations
 * Defines the relationship between attempts, quizzes, and users
 */
export const quizAttemptsRelations = relations(quizAttempts, ({ one }) => ({
  quiz: one(quizzes, {
    fields: [quizAttempts.quizId],
    references: [quizzes.id],
  }),
  user: one(users, {
    fields: [quizAttempts.userId],
    references: [users.id],
  }),
}));

/**
 * Type for inserting a new quiz attempt
 */
export type InsertQuizAttempt = typeof quizAttempts.$inferInsert;

/**
 * Type for selecting a quiz attempt from the database
 */
export type SelectQuizAttempt = typeof quizAttempts.$inferSelect;
