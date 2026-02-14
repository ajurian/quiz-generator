import { pgTable, uuid, varchar, primaryKey, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { quizAttempts } from "./quiz-attempt.schema";
import { questions } from "./question.schema";

/**
 * Quiz Attempt Answers table schema
 *
 * Stores individual answers for each question in a quiz attempt.
 * Replaces the previous JSONB `answers` column on `quiz_attempts`.
 * Each row represents a single answer: which option index the user selected
 * for a given question within a given attempt.
 */
export const quizAttemptAnswers = pgTable(
  "quiz_attempt_answers",
  {
    /** Reference to the parent quiz attempt */
    quizAttemptId: uuid("quiz_attempt_id")
      .notNull()
      .references(() => quizAttempts.id, { onDelete: "cascade" }),

    /** Reference to the question being answered */
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),

    /** The user's selected answer (option index as string) */
    answer: varchar("answer", { length: 255 }).notNull(),
  },
  (table) => [
    // Composite primary key: one answer per question per attempt
    primaryKey({ columns: [table.quizAttemptId, table.questionId] }),

    // Index for loading all answers for an attempt
    index("quiz_attempt_answers_attempt_idx").on(table.quizAttemptId),
  ],
);

/**
 * Quiz Attempt Answer relations
 * Defines relationships to the parent attempt and question
 */
export const quizAttemptAnswersRelations = relations(
  quizAttemptAnswers,
  ({ one }) => ({
    attempt: one(quizAttempts, {
      fields: [quizAttemptAnswers.quizAttemptId],
      references: [quizAttempts.id],
    }),
    question: one(questions, {
      fields: [quizAttemptAnswers.questionId],
      references: [questions.id],
    }),
  }),
);

/**
 * Type for inserting a new quiz attempt answer
 */
export type InsertQuizAttemptAnswer = typeof quizAttemptAnswers.$inferInsert;

/**
 * Type for selecting a quiz attempt answer from the database
 */
export type SelectQuizAttemptAnswer = typeof quizAttemptAnswers.$inferSelect;
