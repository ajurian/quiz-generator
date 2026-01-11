import { eq } from "drizzle-orm";
import type { ISourceMaterialRepository } from "@/application";
import { SourceMaterial } from "@/domain";
import type { DrizzleDatabase } from "../connection";
import { sourceMaterials } from "../schema";

/**
 * Drizzle ORM implementation of the SourceMaterial Repository
 *
 * This adapter implements the ISourceMaterialRepository port using Drizzle ORM
 * to interact with the PostgreSQL database.
 */
export class DrizzleSourceMaterialRepository implements ISourceMaterialRepository {
  constructor(private readonly db: DrizzleDatabase) {}

  /**
   * Creates multiple source materials in bulk
   * Used when storing uploaded files for a quiz
   */
  async createBulk(
    sourceMaterialEntities: SourceMaterial[]
  ): Promise<SourceMaterial[]> {
    if (sourceMaterialEntities.length === 0) {
      return [];
    }

    const values = sourceMaterialEntities.map((sm) => ({
      id: sm.id,
      quizId: sm.quizId,
      title: sm.title,
      fileKey: sm.fileKey,
      mimeType: sm.mimeType,
      sizeBytes: sm.sizeBytes,
      quizReferenceIndex: sm.quizReferenceIndex,
    }));

    const inserted = await this.db
      .insert(sourceMaterials)
      .values(values)
      .returning();

    return inserted.map((row) => this.mapToDomain(row));
  }

  /**
   * Finds all source materials belonging to a specific quiz
   */
  async findByQuizId(quizId: string): Promise<SourceMaterial[]> {
    const results = await this.db
      .select()
      .from(sourceMaterials)
      .where(eq(sourceMaterials.quizId, quizId));

    return results.map((row) => this.mapToDomain(row));
  }

  /**
   * Deletes all source materials for a specific quiz
   * Note: This is typically handled by cascade delete on the database level
   */
  async deleteByQuizId(quizId: string): Promise<void> {
    await this.db
      .delete(sourceMaterials)
      .where(eq(sourceMaterials.quizId, quizId));
  }

  /**
   * Maps a database row to a SourceMaterial domain entity
   */
  private mapToDomain(
    row: typeof sourceMaterials.$inferSelect
  ): SourceMaterial {
    return SourceMaterial.reconstitute({
      id: row.id,
      quizId: row.quizId,
      title: row.title,
      fileKey: row.fileKey,
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
      quizReferenceIndex: row.quizReferenceIndex,
      createdAt: row.createdAt,
    });
  }
}
