import type { QuizAttempt } from "@/domain";
import type {
  PaginationParams,
  PaginatedResult,
} from "./quiz.repository.interface";

/**
 * Repository interface for QuizAttempt entity persistence
 * This is a port in hexagonal architecture - implementations are in Infrastructure layer
 */
export interface IAttemptRepository {
  /**
   * Creates a new attempt in the database
   */
  create(attempt: QuizAttempt): Promise<QuizAttempt>;

  /**
   * Finds an attempt by its unique identifier
   * @returns Attempt if found, null otherwise
   */
  findById(id: string): Promise<QuizAttempt | null>;

  /**
   * Finds an attempt by its slug
   * @returns Attempt if found, null otherwise
   */
  findBySlug(slug: string): Promise<QuizAttempt | null>;

  /**
   * Finds all attempts for a specific quiz by a specific user
   * Ordered by submittedAt DESC (most recent first)
   */
  findByQuizAndUser(quizId: string, userId: string): Promise<QuizAttempt[]>;

  /**
   * Finds all attempts for a specific quiz with pagination
   * Ordered by submittedAt DESC
   */
  findByQuizId(
    quizId: string,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<QuizAttempt>>;

  /**
   * Finds all attempts by a specific user with pagination
   * Ordered by startedAt DESC
   */
  findByUserId(
    userId: string,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<QuizAttempt>>;

  /**
   * Gets the last submitted attempt for a user on a quiz
   */
  findLastAttemptByQuizAndUser(
    quizId: string,
    userId: string,
  ): Promise<QuizAttempt | null>;

  /**
   * Counts the number of attempts by a user on a specific quiz
   */
  countByQuizAndUser(quizId: string, userId: string): Promise<number>;

  /**
   * Updates an existing attempt
   * @returns Updated attempt
   */
  update(attempt: QuizAttempt): Promise<QuizAttempt>;

  /**
   * Deletes an attempt by its identifier
   */
  delete(id: string): Promise<void>;

  /**
   * Checks if an attempt exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Finds an in-progress attempt for a user on a quiz.
   *
   * @param parentAttemptId - When omitted, only root attempts (parentAttemptId IS NULL) are matched.
   *                          When provided, only children whose parentAttemptId equals this value are matched.
   */
  findInProgressByQuizAndUser(
    quizId: string,
    userId: string,
    parentAttemptId?: string,
  ): Promise<QuizAttempt | null>;

  /**
   * Finds the latest attempt for each quiz a user has attempted
   * Returns an array of objects containing attempt and quiz info
   * Ordered by attempt startedAt DESC (most recent first)
   */
  findLatestAttemptPerQuizByUser(
    userId: string,
  ): Promise<{ attempt: QuizAttempt; quizId: string }[]>;

  /**
   * Claims multiple anonymous attempts for an authenticated user in a single batch.
   * Only updates attempts where userId is currently NULL.
   * @returns The number of attempts successfully claimed.
   */
  claimAnonymousAttempts(attemptIds: string[], userId: string): Promise<number>;
}
