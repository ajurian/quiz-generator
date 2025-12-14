// Auth Module Exports
// This module exports Better Auth configuration and schema

export {
  createAuth,
  getAuth,
  setAuth,
  resetAuth,
  type Auth,
  type AuthConfigOptions,
} from "./auth.config";

export {
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
} from "./auth.schema";
