// Quiz DTOs
export {
  createQuizInputSchema,
  quizResponseSchema,
  distributionSchema,
  toQuizResponseDTO,
  type CreateQuizInput,
  type QuizResponseDTO,
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
