import type { QuizVisibility, QuizDistribution } from "@/domain";

/**
 * Input for quiz generation orchestration
 */
export interface QuizGenerationInput {
  userId: string;
  title: string;
  distribution: {
    directQuestion: number;
    twoStatementCompound: number;
    contextual: number;
  };
  visibility: QuizVisibility;
  files: Array<{
    key: string;
    filename: string;
    mimeType: string;
    sizeBytes: number;
  }>;
}

/**
 * Result of quiz generation
 */
export interface QuizGenerationResult {
  quizSlug: string;
  quizId: string;
  questionCount: number;
}

/**
 * Serializable quiz data for workflow steps
 */
export interface QuizData {
  id: string;
  userId: string;
  slug: string;
  title: string;
  distribution: QuizDistribution;
  visibility: QuizVisibility;
  status: string;
}

/**
 * Serializable source material data
 */
export interface SourceMaterialData {
  id: string;
  quizId: string;
  title: string;
  fileKey: string;
  mimeType: string;
  sizeBytes: number;
  quizReferenceIndex: number;
}

/**
 * Uploaded file metadata from Gemini
 */
export interface UploadedFileMetadata {
  id: string;
  name: string;
  mimeType: string;
  uri: string;
  sizeBytes: number;
}
