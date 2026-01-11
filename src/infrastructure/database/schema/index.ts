// Database Schema Exports
// This module exports all Drizzle ORM schema definitions

export {
  quizVisibilityEnum,
  quizStatusEnum,
  quizzes,
  quizzesRelations,
  type InsertQuiz,
  type SelectQuiz,
} from "./quiz.schema";

export {
  questionTypeEnum,
  questions,
  questionsRelations,
  type InsertQuestion,
  type SelectQuestion,
} from "./question.schema";

export {
  quizAttemptStatusEnum,
  quizAttempts,
  quizAttemptsRelations,
  type InsertQuizAttempt,
  type SelectQuizAttempt,
} from "./quiz-attempt.schema";

export {
  sourceMaterials,
  sourceMaterialsRelations,
  type InsertSourceMaterial,
  type SelectSourceMaterial,
} from "./source-material.schema";
