// Database Schema Exports
// This module exports all Drizzle ORM schema definitions

export {
  quizzes,
  quizzesRelations,
  type InsertQuiz,
  type SelectQuiz,
} from "./quiz.schema";

export {
  questions,
  questionsRelations,
  type InsertQuestion,
  type SelectQuestion,
} from "./question.schema";
