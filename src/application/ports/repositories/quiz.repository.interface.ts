import type { Quiz } from "../../../domain";

/**
 * Pagination parameters for list queries
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Paginated result with metadata
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Repository interface for Quiz entity persistence
 * This is a port in hexagonal architecture - implementations are in Infrastructure layer
 */
export interface IQuizRepository {
  /**
   * Creates a new quiz in the database
   */
  create(quiz: Quiz): Promise<Quiz>;

  /**
   * Finds a quiz by its unique identifier
   * @returns Quiz if found, null otherwise
   */
  findById(id: string): Promise<Quiz | null>;

  /**
   * Finds a quiz by its URL-safe slug
   * @returns Quiz if found, null otherwise
   */
  findBySlug(slug: string): Promise<Quiz | null>;

  /**
   * Finds all quizzes owned by a specific user with pagination
   */
  findByUserId(
    userId: string,
    pagination: PaginationParams
  ): Promise<PaginatedResult<Quiz>>;

  /**
   * Finds all public quizzes with pagination (for discovery)
   */
  findPublic(pagination: PaginationParams): Promise<PaginatedResult<Quiz>>;

  /**
   * Updates an existing quiz
   * @returns Updated quiz
   */
  update(quiz: Quiz): Promise<Quiz>;

  /**
   * Deletes a quiz by its identifier
   */
  delete(id: string): Promise<void>;

  /**
   * Checks if a quiz exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Checks if a slug exists (for uniqueness validation)
   */
  slugExists(slug: string): Promise<boolean>;
}
