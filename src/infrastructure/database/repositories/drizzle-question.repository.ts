import { eq, asc } from "drizzle-orm";
import type { IQuestionRepository } from "@/application";
import { Question } from "@/domain";
import type { DrizzleDatabase } from "../connection";
import { questions } from "../schema";

/**
 * Drizzle ORM implementation of the Question Repository
 *
 * This adapter implements the IQuestionRepository port using Drizzle ORM
 * to interact with the PostgreSQL database.
 */
export class DrizzleQuestionRepository implements IQuestionRepository {
  constructor(private readonly db: DrizzleDatabase) {}

  /**
   * Creates multiple questions in bulk
   * Used when generating questions for a quiz
   */
  async createBulk(questionEntities: Question[]): Promise<Question[]> {
    if (questionEntities.length === 0) {
      return [];
    }

    const values = questionEntities.map((q) => ({
      id: q.id,
      quizId: q.quizId,
      orderIndex: q.orderIndex,
      type: q.type,
      stem: q.stem,
      options: q.options.map((opt) => opt.toPlain()),
      correctExplanation: q.correctExplanation,
      sourceQuote: q.sourceQuote,
      reference: q.reference,
    }));

    const inserted = await this.db.insert(questions).values(values).returning();

    return inserted.map((row) => this.mapToDomain(row));
  }

  /**
   * Finds all questions belonging to a specific quiz
   * Questions are returned sorted by orderIndex
   */
  async findByQuizId(quizId: string): Promise<Question[]> {
    const results = await this.db
      .select()
      .from(questions)
      .where(eq(questions.quizId, quizId))
      .orderBy(asc(questions.orderIndex));

    return results.map((row) => this.mapToDomain(row));
  }

  /**
   * Deletes all questions for a specific quiz
   * Note: This is typically handled by cascade delete on the database level
   */
  async deleteByQuizId(quizId: string): Promise<void> {
    await this.db.delete(questions).where(eq(questions.quizId, quizId));
  }

  /**
   * Maps a database row to a Question domain entity
   */
  private mapToDomain(row: typeof questions.$inferSelect): Question {
    return Question.fromPlain({
      id: row.id,
      quizId: row.quizId,
      orderIndex: row.orderIndex,
      type: row.type,
      stem: row.stem,
      options: row.options,
      correctExplanation: row.correctExplanation,
      sourceQuote: row.sourceQuote,
      reference: row.reference,
    });
  }
}
