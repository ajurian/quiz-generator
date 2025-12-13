import type { Question } from "../../../domain";

/**
 * Repository interface for Question entity persistence
 * This is a port in hexagonal architecture - implementations are in Infrastructure layer
 */
export interface IQuestionRepository {
  /**
   * Creates multiple questions in bulk
   * Used when generating questions for a quiz
   */
  createBulk(questions: Question[]): Promise<Question[]>;

  /**
   * Finds all questions belonging to a specific quiz
   * Questions are returned sorted by orderIndex
   */
  findByQuizId(quizId: string): Promise<Question[]>;

  /**
   * Deletes all questions for a specific quiz
   * This is typically handled by cascade delete, but explicit method for flexibility
   */
  deleteByQuizId(quizId: string): Promise<void>;
}
