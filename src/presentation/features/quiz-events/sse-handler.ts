/**
 * Quiz Events SSE Handler
 *
 * This module encapsulates the Server-Sent Events logic for quiz generation updates.
 * The route file delegates to this handler, keeping routes thin.
 *
 * Responsibilities:
 * - Create SSE stream with proper headers
 * - Manage subscription lifecycle (subscribe, ping, unsubscribe)
 * - Handle connection cleanup on client disconnect
 */

import { getAuth, getServices } from "@/presentation/lib/composition";
import type { QuizGenerationEvent } from "@/domain";

/**
 * Options for creating an SSE handler
 */
export interface SSEHandlerOptions {
  /** Keep-alive ping interval in milliseconds (default: 30000) */
  pingIntervalMs?: number;
}

/**
 * Result of authentication check
 */
export interface AuthResult {
  authenticated: true;
  userId: string;
}

export interface AuthFailure {
  authenticated: false;
  response: Response;
}

/**
 * Authenticates the request and extracts the user ID
 */
export async function authenticateRequest(
  request: Request
): Promise<AuthResult | AuthFailure> {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user?.id) {
    return {
      authenticated: false,
      response: new Response("Unauthorized", { status: 401 }),
    };
  }

  return {
    authenticated: true,
    userId: session.user.id,
  };
}

/**
 * Creates an SSE Response stream for quiz generation events
 *
 * @param userId - The authenticated user's ID
 * @param options - Optional configuration
 * @returns Response with SSE stream
 */
export function createQuizEventsStream(
  userId: string,
  options: SSEHandlerOptions = {}
): Response {
  const { pingIntervalMs = 30_000 } = options;
  const { eventSubscriber } = getServices();
  const encoder = new TextEncoder();

  let unsubscribe: (() => Promise<void>) | undefined = undefined;
  let pingInterval: ReturnType<typeof setInterval> | undefined = undefined;

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection event
      controller.enqueue(
        encoder.encode(
          `event: connected\ndata: ${JSON.stringify({ userId })}\n\n`
        )
      );

      // Keep-alive ping to prevent intermediaries from closing idle connections
      pingInterval = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(
              `event: ping\ndata: ${JSON.stringify({ timestamp: Date.now() })}\n\n`
            )
          );
        } catch {
          // Controller may be closed; clear interval
          if (pingInterval) clearInterval(pingInterval);
        }
      }, pingIntervalMs);

      try {
        unsubscribe = await eventSubscriber.subscribe(
          userId,
          (event: QuizGenerationEvent) => {
            if (event.type === "quiz.generation.processing") {
              console.log("SSE - sending processing event:", event);
            }
            if (event.type === "quiz.generation.completed") {
              console.log("SSE - sending completed event:", event);
            }
            controller.enqueue(
              encoder.encode(
                `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`
              )
            );
          }
        );
      } catch (error) {
        console.log("SSE - subscription error:", error);
        if (pingInterval) clearInterval(pingInterval);
        controller.close();
      }
    },
    cancel() {
      console.log("SSE - connection closed by client");
      if (pingInterval) clearInterval(pingInterval);
      unsubscribe?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

/**
 * Handles the full SSE request flow: authenticate + create stream
 *
 * This is a convenience function that combines authentication and stream creation.
 * Use this in the route handler for a one-liner.
 */
export async function handleQuizEventsRequest(
  request: Request,
  options: SSEHandlerOptions = {}
): Promise<Response> {
  const authResult = await authenticateRequest(request);

  if (!authResult.authenticated) {
    return authResult.response;
  }

  return createQuizEventsStream(authResult.userId, options);
}
