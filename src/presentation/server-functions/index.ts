// Server Functions Exports
// These functions can be called from route loaders and components

export {
  getUserQuizzes,
  getQuizById,
  createQuiz,
  shareQuiz,
  deleteQuiz,
  type SerializableFile,
} from "./quiz.server";

export {
  getQuizBySlug,
  updateQuizVisibility,
  startAttempt,
  forceStartAttempt,
  submitAttempt,
  getUserAttempts,
  getAttemptDetail,
  autosaveAnswer,
  resetAttempt,
} from "./attempt.server";

export { getServerSession, type ServerSession } from "./auth.server";
