// Presentation Layer Hooks
// Custom React hooks for the presentation layer

export {
  useQuizEvents,
  useIsGenerating,
  type UseQuizEventsOptions,
  type UseQuizEventsState,
} from "./use-quiz-events";

export { useIsMobile } from "./use-mobile";

export {
  useLocalAnswerStorage,
  getLocalAnswers,
  addAnonymousAttempt,
  getAnonymousAttemptIds,
  clearAnonymousAttempts,
  markLocalAnswersSubmitted,
} from "./use-local-answer-storage";

export { useAnswerPersistence } from "./use-answer-persistence";

export { useClaimAnonymousAttempts } from "./use-claim-anonymous-attempts";
