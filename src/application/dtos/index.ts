// Quiz DTOs
export {
  createQuizInputSchema,
  quizResponseSchema,
  quizDistributionSchema,
  visibilitySchema,
  updateQuizVisibilitySchema,
  toQuizResponseDTO,
  type CreateQuizInput,
  type QuizResponseDTO,
  type UpdateQuizVisibilityInput,
} from "./quiz.dto";

// Question DTOs
export {
  questionOptionSchema,
  questionResponseSchema,
  toQuestionResponseDTO,
  type QuestionResponseDTO,
} from "./question.dto";

// Pagination DTOs
export {
  paginationInputSchema,
  createPaginatedResponseSchema,
  type PaginationInput,
  type PaginatedResponseDTO,
} from "./pagination.dto";

// Attempt DTOs
export {
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
} from "./attempt.dto";
