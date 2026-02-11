// Server Functions Exports
// These functions can be called from route loaders and components

export {
  getUserQuizzes,
  getPublicQuizzes,
  getQuizById,
  shareQuiz,
  deleteQuiz,
  getPresignedUploadUrls,
  getSourceMaterialUrl,
  startQuizGeneration,
  getCachedQuizEvents,
  type FileInfo,
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
  getUserAttemptHistory,
} from "./attempt.server";

export { getServerSession, type ServerSession } from "./auth.server";
