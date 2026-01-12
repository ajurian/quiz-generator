import { createAuth, createDatabaseConnection } from "@/infrastructure";
import { UuidIdGenerator } from "@/infrastructure/services";
import { Redis } from "@upstash/redis";

export const auth = createAuth({
  idGenerator: new UuidIdGenerator(),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: "http://localhost:3000",
  db: createDatabaseConnection(process.env.DATABASE_URL!),
  redis: new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  }),
  googleClient: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  },
  microsoftClient: {
    clientId: process.env.MICROSOFT_CLIENT_ID!,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
  },
});
