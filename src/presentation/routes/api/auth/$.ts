import { getAuth } from "@/presentation/lib/composition";
import { createFileRoute } from "@tanstack/react-router";

/**
 * Better Auth API route handler
 * Handles all auth requests at /api/auth/*
 */
export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const auth = getAuth();
        return auth.handler(request);
      },
      POST: async ({ request }: { request: Request }) => {
        const auth = getAuth();
        return auth.handler(request);
      },
    },
  },
});
