import { eq, desc, and, count, isNull, sql } from "drizzle-orm";
import type {
  IAttemptRepository,
  PaginationParams,
  PaginatedResult,
} from "../../../application";
import { QuizAttempt, AttemptStatus } from "../../../domain";
import type { DrizzleDatabase } from "../connection";
import { quizAttempts } from "../schema";

/**
 * Drizzle ORM implementation of the Attempt Repository
 *
 * This adapter implements the IAttemptRepository port using Drizzle ORM
 * to interact with the PostgreSQL database.
 */
export class DrizzleAttemptRepository implements IAttemptRepository {
  constructor(private readonly db: DrizzleDatabase) {}

  /**
   * Creates a new attempt in the database
   */
  async create(attempt: QuizAttempt): Promise<QuizAttempt> {
    const plain = attempt.toPlain();
    const [inserted] = await this.db
      .insert(quizAttempts)
      .values({
        id: plain.id,
        slug: plain.slug,
        quizId: plain.quizId,
        userId: plain.userId,
        status: plain.status,
        score: plain.score,
        durationMs: plain.durationMs,
        startedAt: plain.startedAt,
        submittedAt: plain.submittedAt,
        answers: plain.answers,
      })
      .returning();

    if (!inserted) {
      throw new Error("Failed to insert attempt");
    }

    return this.mapToDomain(inserted);
  }

  /**
   * Finds an attempt by its unique identifier
   */
  async findById(id: string): Promise<QuizAttempt | null> {
    const [result] = await this.db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.id, id))
      .limit(1);

    if (!result) {
      return null;
    }

    return this.mapToDomain(result);
  }

  /**
   * Finds an attempt by its URL-safe slug
   */
  async findBySlug(slug: string): Promise<QuizAttempt | null> {
    const [result] = await this.db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.slug, slug))
      .limit(1);

    if (!result) {
      return null;
    }

    return this.mapToDomain(result);
  }

  /**
   * Finds all attempts for a specific quiz by a specific user
   * Ordered by startedAt DESC (most recent first)
   */
  async findByQuizAndUser(
    quizId: string,
    userId: string
  ): Promise<QuizAttempt[]> {
    const results = await this.db
      .select()
      .from(quizAttempts)
      .where(
        and(eq(quizAttempts.quizId, quizId), eq(quizAttempts.userId, userId))
      )
      .orderBy(desc(quizAttempts.startedAt));

    return results.map((row) => this.mapToDomain(row));
  }

  /**
   * Finds all attempts for a specific quiz with pagination
   */
  async findByQuizId(
    quizId: string,
    pagination: PaginationParams
  ): Promise<PaginatedResult<QuizAttempt>> {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    // Get total count
    const [countResult] = await this.db
      .select({ total: count() })
      .from(quizAttempts)
      .where(eq(quizAttempts.quizId, quizId));

    const total = countResult?.total ?? 0;

    // Get paginated results
    const results = await this.db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.quizId, quizId))
      .orderBy(desc(quizAttempts.startedAt))
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
   * Finds all attempts by a specific user with pagination
   */
  async findByUserId(
    userId: string,
    pagination: PaginationParams
  ): Promise<PaginatedResult<QuizAttempt>> {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    // Get total count
    const [countResult] = await this.db
      .select({ total: count() })
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, userId));

    const total = countResult?.total ?? 0;

    // Get paginated results
    const results = await this.db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, userId))
      .orderBy(desc(quizAttempts.startedAt))
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
   * Gets the last submitted attempt for a user on a quiz
   */
  async findLastAttemptByQuizAndUser(
    quizId: string,
    userId: string
  ): Promise<QuizAttempt | null> {
    const [result] = await this.db
      .select()
      .from(quizAttempts)
      .where(
        and(
          eq(quizAttempts.quizId, quizId),
          eq(quizAttempts.userId, userId),
          eq(quizAttempts.status, AttemptStatus.SUBMITTED)
        )
      )
      .orderBy(desc(quizAttempts.submittedAt))
      .limit(1);

    if (!result) {
      return null;
    }

    return this.mapToDomain(result);
  }

  /**
   * Finds in-progress attempt for a user on a quiz
   */
  async findInProgressByQuizAndUser(
    quizId: string,
    userId: string
  ): Promise<QuizAttempt | null> {
    const [result] = await this.db
      .select()
      .from(quizAttempts)
      .where(
        and(
          eq(quizAttempts.quizId, quizId),
          eq(quizAttempts.userId, userId),
          eq(quizAttempts.status, AttemptStatus.IN_PROGRESS)
        )
      )
      .limit(1);

    if (!result) {
      return null;
    }

    return this.mapToDomain(result);
  }

  /**
   * Counts the number of attempts by a user on a specific quiz
   */
  async countByQuizAndUser(quizId: string, userId: string): Promise<number> {
    const [result] = await this.db
      .select({ total: count() })
      .from(quizAttempts)
      .where(
        and(eq(quizAttempts.quizId, quizId), eq(quizAttempts.userId, userId))
      );

    return result?.total ?? 0;
  }

  /**
   * Updates an existing attempt
   */
  async update(attempt: QuizAttempt): Promise<QuizAttempt> {
    const plain = attempt.toPlain();
    const [updated] = await this.db
      .update(quizAttempts)
      .set({
        status: plain.status,
        score: plain.score,
        durationMs: plain.durationMs,
        submittedAt: plain.submittedAt,
        answers: plain.answers,
      })
      .where(eq(quizAttempts.id, plain.id))
      .returning();

    if (!updated) {
      throw new Error(`Attempt with id ${plain.id} not found`);
    }

    return this.mapToDomain(updated);
  }

  /**
   * Deletes an attempt by its identifier
   */
  async delete(id: string): Promise<void> {
    await this.db.delete(quizAttempts).where(eq(quizAttempts.id, id));
  }

  /**
   * Checks if an attempt exists
   */
  async exists(id: string): Promise<boolean> {
    const [result] = await this.db
      .select({ id: quizAttempts.id })
      .from(quizAttempts)
      .where(eq(quizAttempts.id, id))
      .limit(1);

    return !!result;
  }

  /**
   * Finds the latest attempt for each quiz a user has attempted
   * Uses a window function to get the most recent attempt per quiz
   */
  async findLatestAttemptPerQuizByUser(
    userId: string
  ): Promise<{ attempt: QuizAttempt; quizId: string }[]> {
    // Use a subquery with ROW_NUMBER() to get the latest attempt per quiz
    const latestAttemptsSubquery = this.db
      .select({
        id: quizAttempts.id,
        rowNum:
          sql<number>`ROW_NUMBER() OVER (PARTITION BY ${quizAttempts.quizId} ORDER BY ${quizAttempts.startedAt} DESC)`.as(
            "row_num"
          ),
      })
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, userId))
      .as("latest_attempts");

    const results = await this.db
      .select()
      .from(quizAttempts)
      .innerJoin(
        latestAttemptsSubquery,
        and(
          eq(quizAttempts.id, latestAttemptsSubquery.id),
          eq(latestAttemptsSubquery.rowNum, 1)
        )
      )
      .orderBy(desc(quizAttempts.startedAt));

    return results.map((row) => ({
      attempt: this.mapToDomain(row.quiz_attempts),
      quizId: row.quiz_attempts.quizId,
    }));
  }

  /**
   * Maps a database row to a QuizAttempt domain entity
   */
  private mapToDomain(row: typeof quizAttempts.$inferSelect): QuizAttempt {
    return QuizAttempt.reconstitute({
      id: row.id,
      slug: row.slug,
      quizId: row.quizId,
      userId: row.userId,
      status: row.status as AttemptStatus,
      score: row.score,
      durationMs: row.durationMs,
      startedAt: row.startedAt,
      submittedAt: row.submittedAt,
      answers: (row.answers as Record<string, string>) ?? {},
    });
  }
}
