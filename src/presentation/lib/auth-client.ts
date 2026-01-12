import { createAuthClient } from "better-auth/react";

/**
 * Better Auth React client
 * Provides hooks for authentication in React components
 */
export const authClient = createAuthClient({
  baseURL: `${import.meta.env.DEV ? "http" : "https"}://${import.meta.env.VITE_VERCEL_URL}`,
});

/**
 * Export individual hooks and utilities from the auth client
 */
export const { signIn, signUp, signOut, useSession, getSession } = authClient;
