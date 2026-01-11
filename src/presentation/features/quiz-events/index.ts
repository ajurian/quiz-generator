/**
 * Quiz Events Feature Module
 *
 * Exports the SSE handler for quiz generation events.
 * Routes should import from here.
 */

export {
  authenticateRequest,
  createQuizEventsStream,
  handleQuizEventsRequest,
} from "./sse-handler";

export type { SSEHandlerOptions, AuthResult, AuthFailure } from "./sse-handler";
