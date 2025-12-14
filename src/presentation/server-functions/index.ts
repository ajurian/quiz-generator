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

export { getServerSession, type ServerSession } from "./auth.server";
