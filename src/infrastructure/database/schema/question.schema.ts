import { pgTable, uuid, text, integer, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { quizzes } from "./quiz.schema";
import type { QuestionOptionProps } from "../../../domain";

/**
 * Questions table schema
 *
 * Stores individual quiz questions with their options stored as JSONB.
 * Questions are linked to a quiz and ordered by orderIndex.
 */
export const questions = pgTable("questions", {
  /** Unique identifier for the question (UUID) */
  id: uuid("id").primaryKey(),

  /** Reference to the parent quiz (cascade delete enabled) */
  quizId: uuid("quiz_id")
    .notNull()
    .references(() => quizzes.id, { onDelete: "cascade" }),

  /** The question text content */
  questionText: text("question_text").notNull(),

  /** Type of question (single_best_answer, two_statements, contextual) */
  questionType: text("question_type").notNull(),

  /** Answer options stored as JSONB array */
  options: jsonb("options").$type<QuestionOptionProps[]>().notNull(),

  /** Display order within the quiz */
  orderIndex: integer("order_index").notNull(),
});

/**
 * Question relations
 * Defines the relationship between questions and their parent quiz
 */
export const questionsRelations = relations(questions, ({ one }) => ({
  quiz: one(quizzes, {
    fields: [questions.quizId],
    references: [quizzes.id],
  }),
}));

/**
 * Type for inserting a new question
 */
export type InsertQuestion = typeof questions.$inferInsert;

/**
 * Type for selecting a question from the database
 */
export type SelectQuestion = typeof questions.$inferSelect;
