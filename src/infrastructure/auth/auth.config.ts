import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../database";
import { authSchema } from "./auth.schema";
import type { Redis } from "@upstash/redis";

/**
 * Better Auth Configuration Options
 */
export interface AuthConfigOptions {
  /** Upstash Redis instance for session caching */
  redis?: Redis;
  /** Base URL for the application */
  baseURL?: string;
  /** Secret key for signing tokens */
  secret?: string;
}

/**
 * Creates and configures the Better Auth instance
 *
 * @param options Configuration options for auth
 * @returns Configured Better Auth instance
 */
export function createAuth(options: AuthConfigOptions = {}) {
  const secret = options.secret ?? process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET environment variable is required");
  }

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: authSchema,
      usePlural: true,
    }),

    advanced: {
      database: {
        generateId: () => crypto.randomUUID(),
      },
    },

    secret,
    baseURL: options.baseURL,

    // Session configuration
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // Update session every 1 day
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60, // Cache cookie for 5 minutes
      },
    },

    // Secondary storage for session caching (Upstash Redis)
    secondaryStorage: options.redis
      ? {
          get: async (key: string) => {
            const value = await options.redis!.get(key);
            return value as string | null;
          },
          set: async (key: string, value: string, ttl?: number) => {
            if (ttl) {
              await options.redis!.setex(key, ttl, value);
            } else {
              await options.redis!.set(key, value);
            }
          },
          delete: async (key: string) => {
            await options.redis!.del(key);
          },
        }
      : undefined,

    // Email and password authentication
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false, // Can be enabled in production
    },

    // Social login providers
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
      microsoft: {
        clientId: process.env.MICROSOFT_CLIENT_ID!,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      },
    },
  });
}

/**
 * Type for the configured auth instance
 */
export type Auth = ReturnType<typeof createAuth>;

/**
 * Default auth instance (can be overridden in tests)
 */
let authInstance: Auth | null = null;

/**
 * Gets or creates the default auth instance
 */
export function getAuth(): Auth {
  if (!authInstance) {
    authInstance = createAuth();
  }
  return authInstance;
}

/**
 * Sets a custom auth instance (useful for testing)
 */
export function setAuth(auth: Auth): void {
  authInstance = auth;
}

/**
 * Resets the auth instance (useful for testing)
 */
export function resetAuth(): void {
  authInstance = null;
}
