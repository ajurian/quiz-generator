// Repository Interfaces (Ports)
export type {
  IQuizRepository,
  IQuestionRepository,
  IAttemptRepository,
  PaginationParams,
  PaginatedResult,
} from "./repositories";

// Service Interfaces (Ports)
export type {
  IAIQuizGenerator,
  GenerateQuizParams,
  GeneratedQuestionData,
  FileMetadata,
  IFileStorageService,
  ICacheService,
  IIdGenerator,
} from "./services";
