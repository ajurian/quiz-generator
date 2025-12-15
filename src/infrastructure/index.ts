// Infrastructure Layer
// Frameworks & Drivers - Contains implementations of interfaces defined in Application layer

// Database
export {
  createDatabaseConnection,
  type DrizzleDatabase,
  // Schema
  quizzes,
  quizzesRelations,
  questions,
  questionsRelations,
  type InsertQuiz,
  type SelectQuiz,
  type InsertQuestion,
  type SelectQuestion,
  // Repositories
  DrizzleQuizRepository,
  DrizzleQuestionRepository,
} from "./database";

// Services
export {
  GeminiQuizGeneratorService,
  QuotaExceededError,
  FileStorageService,
  RedisCacheService,
  UuidIdGenerator,
} from "./services";

// Auth
export {
  createAuth,
  getAuth,
  setAuth,
  resetAuth,
  type Auth,
  type AuthConfigOptions,
  authSchema,
  users,
  sessions,
  accounts,
  verifications,
  type SelectUser,
  type InsertUser,
  type SelectSession,
  type InsertSession,
  type SelectAccount,
  type InsertAccount,
} from "./auth";

// Dependency Injection
export {
  createAppContainer,
  getContainer,
  setContainer,
  resetContainer,
  type AppContainer,
  type ContainerConfig,
  type Repositories,
  type Services,
  type UseCases,
} from "./di";
