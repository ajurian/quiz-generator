/**
 * Runtime Configuration Module
 *
 * Centralizes all environment variable access and validation.
 * This is the ONLY place in infrastructure that reads process.env directly.
 * All other modules receive config via dependency injection.
 */

/**
 * Application runtime configuration
 */
export interface RuntimeConfig {
  /** Base URL for the application */
  baseUrl: string;

  /** Database configuration */
  database: {
    url: string;
  };

  /** Redis configuration */
  redis: {
    url: string;
    token: string;
  };

  /** Google AI / Gemini configuration */
  googleAi: {
    apiKey: string;
  };

  /** S3-compatible storage configuration */
  s3: {
    endpoint: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
  };

  /** OAuth provider configuration */
  oauth: {
    google: {
      clientId: string;
      clientSecret: string;
    };
    microsoft: {
      clientId: string;
      clientSecret: string;
    };
  };

  /** Auth configuration */
  auth: {
    secret: string;
  };
}

/**
 * Validates that a required environment variable is set
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Gets an optional environment variable with a default value
 */
function optionalEnv(name: string, defaultValue: string): string {
  return process.env[name] ?? defaultValue;
}

/**
 * Cached config instance (singleton per process for Node serverless)
 */
let cachedConfig: RuntimeConfig | null = null;

/**
 * Loads and validates runtime configuration from environment variables.
 *
 * Config is cached as a singleton since env vars don't change at runtime.
 * This is safe for Node serverless (Lambda/Vercel) where the process persists
 * across warm invocations.
 *
 * @param forceReload Force reload config (useful for testing)
 * @returns Validated runtime configuration
 */
export function getRuntimeConfig(forceReload = false): RuntimeConfig {
  if (cachedConfig && !forceReload) {
    return cachedConfig;
  }

  cachedConfig = {
    baseUrl: requireEnv("VERCEL_URL") || requireEnv("VITE_APP_URL"),

    database: {
      url: requireEnv("DATABASE_URL"),
    },

    redis: {
      url: requireEnv("UPSTASH_REDIS_REST_URL"),
      token: requireEnv("UPSTASH_REDIS_REST_TOKEN"),
    },

    googleAi: {
      apiKey: requireEnv("GOOGLE_AI_API_KEY"),
    },

    s3: {
      endpoint: requireEnv("S3_ENDPOINT"),
      accessKeyId: requireEnv("S3_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("S3_SECRET_ACCESS_KEY"),
      bucketName: requireEnv("S3_BUCKET_NAME"),
    },

    oauth: {
      google: {
        clientId: optionalEnv("GOOGLE_CLIENT_ID", ""),
        clientSecret: optionalEnv("GOOGLE_CLIENT_SECRET", ""),
      },
      microsoft: {
        clientId: optionalEnv("MICROSOFT_CLIENT_ID", ""),
        clientSecret: optionalEnv("MICROSOFT_CLIENT_SECRET", ""),
      },
    },

    auth: {
      secret: requireEnv("BETTER_AUTH_SECRET"),
    },
  };

  return cachedConfig;
}

/**
 * Resets the cached config (useful for testing)
 */
export function resetRuntimeConfig(): void {
  cachedConfig = null;
}
