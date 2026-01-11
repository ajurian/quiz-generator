import { createAuth, createDatabaseConnection } from "@/infrastructure";
import { UuidIdGenerator } from "@/infrastructure/services";
import { Redis } from "@upstash/redis";

export const auth = createAuth({
  idGenerator: new UuidIdGenerator(),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.VITE_APP_URL!,
  db: createDatabaseConnection(process.env.DATABASE_URL!),
  redis: new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  }),
  googleClient: {
    id: process.env.GOOGLE_CLIENT_ID!,
    secret: process.env.GOOGLE_CLIENT_SECRET!,
  },
  microsoftClient: {
    id: process.env.MICROSOFT_CLIENT_ID!,
    secret: process.env.MICROSOFT_CLIENT_SECRET!,
  },
});
