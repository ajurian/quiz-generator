// Application Layer - Application Business Rules
// This layer contains use-case specific business logic and orchestrates data flow.

// Ports (Interfaces)
export type {
  // Repository Interfaces
  IQuizRepository,
  IQuestionRepository,
  IAttemptRepository,
  PaginationParams,
  PaginatedResult,
  // Service Interfaces
  IAIQuizGenerator,
  GenerateQuizParams,
  GeneratedQuestionData,
  FileMetadata,
  IFileStorageService,
  ICacheService,
  IIdGenerator,
} from "./ports";

// DTOs
export {
  // Quiz DTOs
  createQuizInputSchema,
  quizResponseSchema,
  distributionSchema,
  visibilitySchema,
  updateQuizVisibilitySchema,
  toQuizResponseDTO,
  type CreateQuizInput,
  type QuizResponseDTO,
  // Question DTOs
  questionOptionSchema,
  questionResponseSchema,
  toQuestionResponseDTO,
  type QuestionResponseDTO,
  // Pagination DTOs
  paginationInputSchema,
  createPaginatedResponseSchema,
  type PaginationInput,
  type PaginatedResponseDTO,
  // Attempt DTOs
  attemptStatusSchema,
  startAttemptInputSchema,
  submitAttemptInputSchema,
  attemptResponseSchema,
  getUserAttemptsInputSchema,
  getAttemptBySlugInputSchema,
  toAttemptResponseDTO,
  createAttemptSummary,
  type StartAttemptInput,
  type SubmitAttemptInput,
  type AttemptResponseDTO,
  type GetUserAttemptsInput,
  type GetAttemptBySlugInput,
  type AttemptSummaryDTO,
} from "./dtos";

// Use Cases
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
  StartAttemptUseCase,
  ForceStartAttemptUseCase,
  type StartAttemptInput as StartAttemptUseCaseInput,
  type StartAttemptOutput,
  type StartAttemptUseCaseDeps,
  type ForceStartAttemptInput,
  SubmitAttemptUseCase,
  type SubmitAttemptInput as SubmitAttemptUseCaseInput,
  type SubmitAttemptOutput,
  type SubmitAttemptUseCaseDeps,
  GetUserAttemptsUseCase,
  type GetUserAttemptsInput as GetUserAttemptsUseCaseInput,
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
} from "./use-cases";

// Errors
export {
  ApplicationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  QuotaExceededError,
  ExternalServiceError,
} from "./errors";
