import {
  pgTable,
  uuid,
  text,
  integer,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { quizzes } from "./quiz.schema";
import { QuestionType, type QuestionOptionProps } from "@/domain";

export const questionTypeEnum = pgEnum("question_type", [
  QuestionType.DIRECT_QUESTION,
  QuestionType.TWO_STATEMENT_COMPOUND,
  QuestionType.CONTEXTUAL,
]);

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

  /** Display order within the quiz */
  orderIndex: integer("order_index").notNull(),

  /** Type of question (direct_question, two_statement_compound, contextual) */
  type: questionTypeEnum("type").notNull(),

  /** The stem of the question */
  stem: text("stem").notNull(),

  /** Answer options stored as JSONB array */
  options: jsonb("options").$type<QuestionOptionProps[]>().notNull(),

  /** Explanation for the correct answer */
  correctExplanation: text("correct_explanation").notNull(),

  /** Verbatim evidence from the source material */
  sourceQuote: text("source_quote").notNull(),

  /** Exact source material reference */
  reference: integer("reference").notNull(),
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
