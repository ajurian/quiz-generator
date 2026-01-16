/**
 * Quiz Generation Feature Module
 *
 * Exports the orchestration functions for quiz generation.
 * Routes and server-functions should import from here.
 */

export { createQuizRecord, continueQuizGeneration } from "./orchestrator";

export type {
  QuizGenerationInput,
  QuizGenerationResult,
  QuizData,
} from "./orchestrator";

export type { SourceMaterialData, UploadedFileMetadata } from "./types";
