import type {
  QuestionType,
  QuizDistribution,
  GeminiModel,
  OptionIndex,
} from "../../../domain";

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
  model: GeminiModel;
}

/**
 * Generated question data from AI (plain object, not entity)
 */
export interface GeneratedQuestionData {
  questionText: string;
  questionType: QuestionType;
  options: {
    index: OptionIndex;
    text: string;
    explanation: string;
    isCorrect: boolean;
  }[];
  orderIndex: number;
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
   * Validates if the specified model has available quota
   * @param model The Gemini model to check
   * @returns true if quota is available
   */
  validateQuota(model: GeminiModel): Promise<boolean>;
}
