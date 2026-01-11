// Infrastructure Layer
// Frameworks & Drivers - Contains implementations of interfaces defined in Application layer
//
// IMPORTANT: This barrel export is intentionally minimal.
// Presentation layer should NOT import from here directly.
// Use @/presentation/lib/composition instead.
//
// These exports exist primarily for:
// - Testing (mocking/stubbing implementations)
// - Infrastructure-internal composition

// Config
export {
  getRuntimeConfig,
  resetRuntimeConfig,
  type RuntimeConfig,
} from "./config";

// Dependency Injection (the composition root)
export {
  createAppContainer,
  getContainer,
  setContainer,
  resetContainer,
  type AppContainer,
  type Repositories,
  type Services,
  type UseCases,
} from "./di";

// Auth (for testing utilities)
export {
  createAuth,
  setAuth,
  getTestAuth,
  resetAuth,
  type Auth,
  type AuthConfigOptions,
} from "./auth";

// Database types and connection (for migrations and testing)
export {
  createDatabaseConnection,
  getDatabase,
  type DrizzleDatabase,
} from "./database";

// Schema exports (for migrations tooling)
export {
  quizzes,
  quizzesRelations,
  questions,
  questionsRelations,
  quizAttempts,
  quizAttemptsRelations,
  sourceMaterials,
  sourceMaterialsRelations,
} from "./database";

// Auth schema (for migrations tooling)
export { authSchema, users, sessions, accounts, verifications } from "./auth";
