/**
 * @deprecated Import from `@/application/features` instead.
 * This file provides backwards compatibility re-exports.
 */

// Quiz feature
export {
  CreateQuizUseCase,
  type CreateQuizUseCaseInput,
  type CreateQuizUseCaseDeps,
  GetUserQuizzesUseCase,
  type GetUserQuizzesInput,
  type GetUserQuizzesUseCaseDeps,
  GetQuizByIdUseCase,
  type GetQuizByIdInput,
  type GetQuizByIdOutput,
  type GetQuizByIdUseCaseDeps,
  ShareQuizUseCase,
  type ShareQuizInput,
  type ShareQuizOutput,
  type ShareQuizUseCaseDeps,
  DeleteQuizUseCase,
  type DeleteQuizInput,
  type DeleteQuizUseCaseDeps,
  UpdateQuizVisibilityUseCase,
  type UpdateQuizVisibilityInput,
  type UpdateQuizVisibilityOutput,
  type UpdateQuizVisibilityUseCaseDeps,
} from "../features/quiz";

// Attempt feature
export {
  StartAttemptUseCase,
  ForceStartAttemptUseCase,
  type StartAttemptInput,
  type StartAttemptOutput,
  type StartAttemptUseCaseDeps,
  type ForceStartAttemptInput,
  SubmitAttemptUseCase,
  type SubmitAttemptOutput,
  type SubmitAttemptUseCaseDeps,
  GetUserAttemptsUseCase,
  type GetUserAttemptsInput,
  type GetUserAttemptsOutput,
  type GetUserAttemptsUseCaseDeps,
  GetAttemptDetailUseCase,
  type GetAttemptDetailInput,
  type GetAttemptDetailOutput,
  type GetAttemptDetailUseCaseDeps,
  AutosaveAnswerUseCase,
  type AutosaveAnswerInput,
  type AutosaveAnswerOutput,
  type AutosaveAnswerUseCaseDeps,
  ResetAttemptUseCase,
  type ResetAttemptInput,
  type ResetAttemptOutput,
  type ResetAttemptUseCaseDeps,
  GetUserAttemptHistoryUseCase,
  type GetUserAttemptHistoryInput,
  type GetUserAttemptHistoryOutput,
  type AttemptHistoryItemDTO,
  type GetUserAttemptHistoryUseCaseDeps,
} from "../features/attempt";

// Generation feature
// Note: Quiz generation use cases have been moved to Upstash Workflow
// See: src/presentation/routes/api/generate-quiz/index.ts
export {
  QuizGenerationPolicy,
  type ModelFallbackResult,
} from "../features/generation";

// Files feature
export {
  GetPresignedUploadUrlsUseCase,
  getPresignedUploadUrlsInputSchema,
  type GetPresignedUploadUrlsInput,
  type GetPresignedUploadUrlsOutput,
  type GetPresignedUploadUrlsUseCaseDeps,
} from "../features/files";
