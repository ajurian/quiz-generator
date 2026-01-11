import type { SourceMaterial } from "@/domain";

/**
 * Repository interface for SourceMaterial entity persistence
 * This is a port in hexagonal architecture - implementations are in Infrastructure layer
 */
export interface ISourceMaterialRepository {
  /**
   * Creates multiple source materials in bulk
   * Used when storing uploaded files for a quiz
   */
  createBulk(sourceMaterials: SourceMaterial[]): Promise<SourceMaterial[]>;

  /**
   * Finds all source materials belonging to a specific quiz
   */
  findByQuizId(quizId: string): Promise<SourceMaterial[]>;

  /**
   * Deletes all source materials for a specific quiz
   * Note: This is typically handled by CASCADE delete on the quiz
   */
  deleteByQuizId(quizId: string): Promise<void>;
}
