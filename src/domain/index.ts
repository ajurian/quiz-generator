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
} from "./enums";

// Value Objects
export {
  QuestionOption,
  type QuestionOptionProps,
  type OptionIndex,
  VALID_OPTION_INDICES,
  isValidOptionIndex,
} from "./value-objects";

// Entities
export {
  Quiz,
  type QuizProps,
  type CreateQuizProps,
  Question,
  type QuestionProps,
  type CreateQuestionProps,
} from "./entities";

// Domain Services
export { QuizDistributionService, type QuizDistribution } from "./services";
