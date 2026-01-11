import { createFileRoute } from "@tanstack/react-router";
import { handleQuizEventsRequest } from "@/presentation/features/quiz-events";

/**
 * SSE API endpoint for quiz generation events
 *
 * This endpoint provides Server-Sent Events for real-time quiz generation updates.
 * Clients connect via EventSource and receive events as they are published.
 *
 * Authentication is required - the user ID is extracted from the session.
 *
 * Events:
 * - quiz.progress: Quiz generation progress (questions being generated)
 * - quiz.status: Quiz status change (ready or failed)
 * - ping: Keep-alive ping every 30 seconds
 *
 * The route delegates to the quiz-events feature handler for all logic.
 */
export const Route = createFileRoute("/api/quiz-events/")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        return handleQuizEventsRequest(request);
      },
    },
  },
});
