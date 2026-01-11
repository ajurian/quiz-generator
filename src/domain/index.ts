// Domain Layer - Enterprise Business Rules
// This layer contains business logic and is completely independent of external concerns.

// Errors
export {
  DomainError,
  InvariantViolationError,
  EntityNotFoundError,
  InvalidOperationError,
  InvalidValueError,
  isDomainError,
  isInvariantViolationError,
} from "./errors";

// Events
export type {
  DomainEvent,
  QuestionPreview,
  QuizGenerationProcessingEvent,
  QuizGenerationCompletedEvent,
  QuizGenerationFailedEvent,
  QuizGenerationEvent,
} from "./events";
export { QuizGenerationEvents } from "./events";

// Enums
export {
  QuestionType,
  isQuestionType,
  getQuestionTypeDisplayName,
  QuizVisibility,
  isQuizVisibility,
  getQuizVisibilityDisplayName,
  getQuizVisibilityDescription,
  AttemptStatus,
  isAttemptStatus,
  getAttemptStatusDisplayName,
  QuizStatus,
  isQuizStatus,
  getQuizStatusDisplayName,
  getQuizStatusDescription,
} from "./enums";

// GeminiModel is deprecated - use AIModel from @/application instead
// Re-exported here temporarily for backward compatibility during migration
export { GeminiModel, isGeminiModel, getGeminiModelDisplayName } from "./enums";

// Value Objects
export {
  QuestionOption,
  type QuestionOptionProps,
  type OptionIndex,
  VALID_OPTION_INDICES,
  isValidOptionIndex,
  Slug,
  uuidToSlug,
  slugToUuid,
  isValidSlug,
} from "./value-objects";

// Entities
export {
  Quiz,
  type QuizProps,
  type CreateQuizProps,
  Question,
  type QuestionProps,
  type CreateQuestionProps,
  QuizAttempt,
  type QuizAttemptProps,
  type CreateQuizAttemptProps,
  SourceMaterial,
  type SourceMaterialProps,
  type CreateSourceMaterialProps,
} from "./entities";

// Domain Services
export { QuizDistributionService, type QuizDistribution } from "./services";
