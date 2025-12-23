import { eq, desc, count, inArray } from "drizzle-orm";
import type {
  IQuizRepository,
  PaginationParams,
  PaginatedResult,
} from "../../../application";
import { Quiz, QuizVisibility } from "../../../domain";
import type { DrizzleDatabase } from "../connection";
import { quizzes } from "../schema";

/**
 * Drizzle ORM implementation of the Quiz Repository
 *
 * This adapter implements the IQuizRepository port using Drizzle ORM
 * to interact with the PostgreSQL database.
 */
export class DrizzleQuizRepository implements IQuizRepository {
  constructor(private readonly db: DrizzleDatabase) {}

  /**
   * Creates a new quiz in the database
   */
  async create(quiz: Quiz): Promise<Quiz> {
    const [inserted] = await this.db
      .insert(quizzes)
      .values({
        id: quiz.id,
        slug: quiz.slug,
        userId: quiz.userId,
        title: quiz.title,
        questionDistribution: quiz.questionDistribution,
        visibility: quiz.visibility,
        createdAt: quiz.createdAt,
        updatedAt: quiz.updatedAt,
      })
      .returning();

    if (!inserted) {
      throw new Error("Failed to insert quiz");
    }

    return this.mapToDomain(inserted);
  }

  /**
   * Finds a quiz by its unique identifier
   */
  async findById(id: string): Promise<Quiz | null> {
    const [result] = await this.db
      .select()
      .from(quizzes)
      .where(eq(quizzes.id, id))
      .limit(1);

    if (!result) {
      return null;
    }

    return this.mapToDomain(result);
  }

  /**
   * Finds a quiz by its URL-safe slug
   */
  async findBySlug(slug: string): Promise<Quiz | null> {
    const [result] = await this.db
      .select()
      .from(quizzes)
      .where(eq(quizzes.slug, slug))
      .limit(1);

    if (!result) {
      return null;
    }

    return this.mapToDomain(result);
  }

  /**
   * Finds multiple quizzes by their identifiers
   */
  async findByIds(ids: string[]): Promise<Quiz[]> {
    if (ids.length === 0) {
      return [];
    }

    const results = await this.db
      .select()
      .from(quizzes)
      .where(inArray(quizzes.id, ids));

    return results.map((row) => this.mapToDomain(row));
  }

  /**
   * Finds all quizzes owned by a specific user with pagination
   */
  async findByUserId(
    userId: string,
    pagination: PaginationParams
  ): Promise<PaginatedResult<Quiz>> {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    // Get total count
    const [countResult] = await this.db
      .select({ total: count() })
      .from(quizzes)
      .where(eq(quizzes.userId, userId));

    const total = countResult?.total ?? 0;

    // Get paginated results
    const results = await this.db
      .select()
      .from(quizzes)
      .where(eq(quizzes.userId, userId))
      .orderBy(desc(quizzes.createdAt))
      .limit(limit)
      .offset(offset);

    const data = results.map((row) => this.mapToDomain(row));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Finds all public quizzes with pagination (for discovery)
   */
  async findPublic(
    pagination: PaginationParams
  ): Promise<PaginatedResult<Quiz>> {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    // Get total count of public quizzes
    const [countResult] = await this.db
      .select({ total: count() })
      .from(quizzes)
      .where(eq(quizzes.visibility, QuizVisibility.PUBLIC));

    const total = countResult?.total ?? 0;

    // Get paginated results
    const results = await this.db
      .select()
      .from(quizzes)
      .where(eq(quizzes.visibility, QuizVisibility.PUBLIC))
      .orderBy(desc(quizzes.createdAt))
      .limit(limit)
      .offset(offset);

    const data = results.map((row) => this.mapToDomain(row));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Updates an existing quiz
   */
  async update(quiz: Quiz): Promise<Quiz> {
    const [updated] = await this.db
      .update(quizzes)
      .set({
        title: quiz.title,
        visibility: quiz.visibility,
        questionDistribution: quiz.questionDistribution,
        updatedAt: quiz.updatedAt,
      })
      .where(eq(quizzes.id, quiz.id))
      .returning();

    if (!updated) {
      throw new Error(`Quiz with id ${quiz.id} not found`);
    }

    return this.mapToDomain(updated);
  }

  /**
   * Deletes a quiz by its identifier
   */
  async delete(id: string): Promise<void> {
    await this.db.delete(quizzes).where(eq(quizzes.id, id));
  }

  /**
   * Checks if a quiz exists
   */
  async exists(id: string): Promise<boolean> {
    const [result] = await this.db
      .select({ id: quizzes.id })
      .from(quizzes)
      .where(eq(quizzes.id, id))
      .limit(1);

    return !!result;
  }

  /**
   * Checks if a slug exists (for uniqueness validation)
   */
  async slugExists(slug: string): Promise<boolean> {
    const [result] = await this.db
      .select({ slug: quizzes.slug })
      .from(quizzes)
      .where(eq(quizzes.slug, slug))
      .limit(1);

    return !!result;
  }

  /**
   * Maps a database row to a Quiz domain entity
   */
  private mapToDomain(row: typeof quizzes.$inferSelect): Quiz {
    return Quiz.reconstitute({
      id: row.id,
      slug: row.slug,
      userId: row.userId,
      title: row.title,
      questionDistribution: row.questionDistribution,
      visibility: row.visibility as QuizVisibility,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
