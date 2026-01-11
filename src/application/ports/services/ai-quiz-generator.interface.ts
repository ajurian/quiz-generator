import type {
  QuestionType,
  QuizDistribution,
  OptionIndex,
  QuestionPreview,
} from "@/domain";
import type { AIModel } from "../../types";

/**
 * Metadata for an uploaded file
 */
export interface FileMetadata {
  id: string;
  name: string;
  mimeType: string;
  uri: string;
  sizeBytes: number;
}

/**
 * Parameters for generating quiz questions
 */
export interface GenerateQuizParams {
  files: FileMetadata[];
  distribution: QuizDistribution;
  model: AIModel;
}

/**
 * Callback for streaming progress updates
 */
export interface StreamingProgressCallback {
  (progress: {
    questionsGenerated: number;
    questions: QuestionPreview[];
  }): void;
}

/**
 * Parameters for streaming quiz question generation
 */
export interface StreamGenerateQuizParams extends GenerateQuizParams {
  /** Callback invoked as questions are progressively generated */
  onProgress?: StreamingProgressCallback;
}

/**
 * Generated question data from AI (plain object, not entity)
 */
export interface GeneratedQuestionData {
  orderIndex: number;
  type: QuestionType;
  stem: string;
  options: {
    index: OptionIndex;
    text: string;
    isCorrect: boolean;
    errorRationale?: string;
  }[];
  correctExplanation: string;
  sourceQuote: string;
  reference: number;
}

/**
 * Service interface for AI-based quiz generation
 * This is a port - implementation uses Google Gemini API
 */
export interface IAIQuizGenerator {
  /**
   * Generates quiz questions from uploaded files using AI
   * @param params Generation parameters including files and distribution
   * @returns Array of generated question data (plain objects, not entities)
   */
  generateQuestions(
    params: GenerateQuizParams
  ): Promise<GeneratedQuestionData[]>;

  /**
   * Generates quiz questions with streaming progress updates
   * @param params Generation parameters including files, distribution, and progress callback
   * @returns Array of generated question data (plain objects, not entities)
   */
  generateQuestionsStream(
    params: StreamGenerateQuizParams
  ): Promise<GeneratedQuestionData[]>;

  /**
   * Validates if the specified model has available quota
   * @param model The AI model to check
   * @returns true if quota is available
   */
  validateQuota(model: AIModel): Promise<boolean>;
}
