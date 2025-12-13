// Application Layer - Application Business Rules
// This layer contains use-case specific business logic and orchestrates data flow.

// Ports (Interfaces)
export type {
  // Repository Interfaces
  IQuizRepository,
  IQuestionRepository,
  PaginationParams,
  PaginatedResult,
  // Service Interfaces
  IAIQuizGenerator,
  GenerateQuizParams,
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
