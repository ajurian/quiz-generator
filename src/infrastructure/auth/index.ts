// Auth Module Exports
// This module exports Better Auth configuration and schema

export {
  createAuth,
  setAuth,
  getTestAuth,
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
