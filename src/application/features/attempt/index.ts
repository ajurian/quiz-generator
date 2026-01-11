// Attempt feature - manages quiz attempt lifecycle
export {
  StartAttemptUseCase,
  ForceStartAttemptUseCase,
  type StartAttemptInput,
  type StartAttemptOutput,
  type StartAttemptUseCaseDeps,
  type ForceStartAttemptInput,
} from "./start-attempt.use-case";

export {
  SubmitAttemptUseCase,
  type SubmitAttemptOutput,
  type SubmitAttemptUseCaseDeps,
} from "./submit-attempt.use-case";

export {
  GetUserAttemptsUseCase,
  type GetUserAttemptsInput,
  type GetUserAttemptsOutput,
  type GetUserAttemptsUseCaseDeps,
} from "./get-user-attempts.use-case";

export {
  GetAttemptDetailUseCase,
  type GetAttemptDetailInput,
  type GetAttemptDetailOutput,
  type GetAttemptDetailUseCaseDeps,
} from "./get-attempt-detail.use-case";

export {
  AutosaveAnswerUseCase,
  type AutosaveAnswerInput,
  type AutosaveAnswerOutput,
  type AutosaveAnswerUseCaseDeps,
} from "./autosave-answer.use-case";

export {
  ResetAttemptUseCase,
  type ResetAttemptInput,
  type ResetAttemptOutput,
  type ResetAttemptUseCaseDeps,
} from "./reset-attempt.use-case";

export {
  GetUserAttemptHistoryUseCase,
  type GetUserAttemptHistoryInput,
  type GetUserAttemptHistoryOutput,
  type AttemptHistoryItemDTO,
  type GetUserAttemptHistoryUseCaseDeps,
} from "./get-user-attempt-history.use-case";
