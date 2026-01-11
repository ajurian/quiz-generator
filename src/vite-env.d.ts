/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Server-side environment types (process.env)
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV?: "development" | "staging" | "production";
    VERCEL_URL?: string;
    VITE_APP_URL?: string;
    DATABASE_URL?: string;
    UPSTASH_REDIS_REST_URL?: string;
    UPSTASH_REDIS_REST_TOKEN?: string;
    S3_ACCESS_KEY_ID?: string;
    S3_SECRET_ACCESS_KEY?: string;
    S3_ENDPOINT?: string;
    S3_BUCKET_NAME?: string;
    GOOGLE_AI_API_KEY?: string;
    BETTER_AUTH_SECRET?: string;
    BETTER_AUTH_URL?: string;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    MICROSOFT_CLIENT_ID?: string;
    MICROSOFT_CLIENT_SECRET?: string;
    MIGRATIONS_PATH?: string;
  }
}
