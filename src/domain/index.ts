// Domain Layer - Enterprise Business Rules
// This layer contains business logic and is completely independent of external concerns.

// Enums
export {
  QuestionType,
  isQuestionType,
  getQuestionTypeDisplayName,
  GeminiModel,
  isGeminiModel,
  getGeminiModelDisplayName,
  QuizVisibility,
  isQuizVisibility,
  getQuizVisibilityDisplayName,
  getQuizVisibilityDescription,
  AttemptStatus,
  isAttemptStatus,
  getAttemptStatusDisplayName,
} from "./enums";

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
} from "./entities";

// Domain Services
export { QuizDistributionService, type QuizDistribution } from "./services";
