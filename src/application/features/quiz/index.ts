// Quiz feature - manages quiz CRUD operations
export {
  GetUserQuizzesUseCase,
  type GetUserQuizzesInput,
  type GetUserQuizzesUseCaseDeps,
} from "./get-user-quizzes.use-case";

export {
  GetPublicQuizzesUseCase,
  type GetPublicQuizzesInput,
  type GetPublicQuizzesUseCaseDeps,
} from "./get-public-quizzes.use-case";

export {
  GetQuizByIdUseCase,
  type GetQuizByIdInput,
  type GetQuizByIdOutput,
  type GetQuizByIdUseCaseDeps,
} from "./get-quiz-by-id.use-case";

export {
  ShareQuizUseCase,
  type ShareQuizInput,
  type ShareQuizOutput,
  type ShareQuizUseCaseDeps,
} from "./share-quiz.use-case";

export {
  DeleteQuizUseCase,
  type DeleteQuizInput,
  type DeleteQuizUseCaseDeps,
} from "./delete-quiz.use-case";

export {
  UpdateQuizVisibilityUseCase,
  type UpdateQuizVisibilityInput,
  type UpdateQuizVisibilityOutput,
  type UpdateQuizVisibilityUseCaseDeps,
} from "./update-quiz-visibility.use-case";
