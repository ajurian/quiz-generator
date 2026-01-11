import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { DrizzleDatabase } from "../database";
import { authSchema } from "./auth.schema";
import { Redis } from "@upstash/redis";
import { IIdGenerator } from "@/application";

/**
 * Better Auth Configuration Options
 */
export interface AuthConfigOptions {
  /** Id Generator for auth database */
  idGenerator: IIdGenerator;
  /** Secret key for signing tokens */
  secret: string;
  /** Base URL for the application */
  baseURL: string;
  /** Primary Database instance */
  db: DrizzleDatabase;
  /** Upstash Redis instance for session caching */
  redis: Redis;
  googleClient: { id: string; secret: string };
  microsoftClient: { id: string; secret: string };
}

/**
 * Creates and configures the Better Auth instance
 *
 * @param options Configuration options for auth
 * @returns Configured Better Auth instance
 */
export function createAuth(options: AuthConfigOptions) {
  if (!options.secret) {
    throw new Error("BETTER_AUTH_SECRET environment variable is required");
  }

  return betterAuth({
    database: drizzleAdapter(options.db, {
      provider: "pg",
      schema: authSchema,
      usePlural: true,
    }),

    advanced: {
      database: {
        generateId: () => options.idGenerator.generate(),
      },
    },

    secret: options.secret,
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
    secondaryStorage: {
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
    },

    // Email and password authentication
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false, // Can be enabled in production
    },

    // Social login providers
    socialProviders: {
      google: {
        clientId: options.googleClient.id,
        clientSecret: options.googleClient.secret!,
      },
      microsoft: {
        clientId: options.microsoftClient.id!,
        clientSecret: options.microsoftClient.secret!,
      },
    },
  });
}

/**
 * Type for the configured auth instance
 */
export type Auth = ReturnType<typeof createAuth>;

/**
 * Auth instance for testing purposes
 * In production, auth is obtained from the container (getContainer().auth)
 */
let testAuthInstance: Auth | null = null;

/**
 * Sets a custom auth instance (useful for testing)
 */
export function setAuth(auth: Auth): void {
  testAuthInstance = auth;
}

/**
 * Gets the test auth instance if set
 * @internal For testing only - use getContainer().auth in production
 */
export function getTestAuth(): Auth | null {
  return testAuthInstance;
}

/**
 * Resets the auth instance (useful for testing)
 */
export function resetAuth(): void {
  testAuthInstance = null;
}
