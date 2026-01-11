/**
 * User-friendly error message utilities
 *
 * This module translates technical/internal errors into user-friendly messages.
 * The translation happens at the presentation layer to maintain Clean Architecture.
 *
 * Application layer errors contain detailed messages for logging/debugging,
 * while this module provides appropriate messages for end users.
 */

import { ApplicationError } from "@/application";

/**
 * Default user-friendly messages for each error code
 */
const USER_FRIENDLY_MESSAGES: Record<string, string> = {
  NOT_FOUND: "The requested item could not be found.",
  UNAUTHORIZED: "Please sign in to continue.",
  FORBIDDEN: "You don't have permission to do this.",
  VALIDATION_ERROR: "Please check your input and try again.",
  QUOTA_EXCEEDED:
    "Our AI service is currently busy. Please try again in a few minutes.",
  EXTERNAL_SERVICE_ERROR: "Something went wrong. Please try again later.",
};

/**
 * Context-specific error messages for better UX
 */
const CONTEXT_MESSAGES: Record<string, Record<string, string>> = {
  quiz: {
    NOT_FOUND: "This quiz doesn't exist or has been deleted.",
    FORBIDDEN: "You don't have access to this quiz.",
    EXTERNAL_SERVICE_ERROR: "Failed to generate quiz. Please try again.",
  },
  attempt: {
    NOT_FOUND: "This attempt could not be found.",
    FORBIDDEN: "You don't have access to this attempt.",
  },
  visibility: {
    FORBIDDEN: "Only the quiz owner can change visibility settings.",
  },
  generation: {
    QUOTA_EXCEEDED:
      "AI generation limit reached. Please try again in a few minutes.",
    EXTERNAL_SERVICE_ERROR: "Quiz generation failed. Please try again.",
  },
};

/**
 * Translates an error into a user-friendly message
 *
 * @param error - The error to translate
 * @param context - Optional context for more specific messages (e.g., 'quiz', 'attempt')
 * @returns User-friendly error message
 */
export function getUserFriendlyMessage(
  error: unknown,
  context?: keyof typeof CONTEXT_MESSAGES
): string {
  // Handle ApplicationError instances
  if (error instanceof ApplicationError) {
    // Check for context-specific message first
    if (context && CONTEXT_MESSAGES[context]?.[error.code]) {
      return CONTEXT_MESSAGES[context][error.code]!;
    }

    // Fall back to default message for the error code
    if (USER_FRIENDLY_MESSAGES[error.code]) {
      return USER_FRIENDLY_MESSAGES[error.code]!;
    }
  }

  // Generic fallback for unknown errors
  return "Something went wrong. Please try again.";
}

/**
 * Gets a user-friendly description for toast notifications
 * Returns undefined if no additional description is needed
 *
 * @param error - The error to get description for
 * @returns Optional description string
 */
export function getErrorDescription(error: unknown): string | undefined {
  // For validation errors, we might want to show field-specific info
  // But we don't expose internal details
  return undefined;
}

/**
 * Translates quiz generation failure event messages
 * These come from the SSE events, not ApplicationError
 *
 * @param eventErrorMessage - The error message from the event
 * @returns User-friendly error message
 */
export function getGenerationFailureMessage(
  eventErrorMessage: string | undefined
): string {
  if (!eventErrorMessage) {
    return "Quiz generation failed. Please try again.";
  }

  // Map known internal error patterns to user-friendly messages
  const lowerMessage = eventErrorMessage.toLowerCase();

  if (lowerMessage.includes("quota") || lowerMessage.includes("rate limit")) {
    return "AI service is busy. Please try again in a few minutes.";
  }

  if (lowerMessage.includes("timeout") || lowerMessage.includes("timed out")) {
    return "Generation took too long. Please try with smaller files.";
  }

  if (lowerMessage.includes("file") || lowerMessage.includes("upload")) {
    return "There was a problem with your files. Please try uploading again.";
  }

  if (lowerMessage.includes("parse") || lowerMessage.includes("json")) {
    return "AI response was invalid. Please try again.";
  }

  // Default user-friendly message
  return "Quiz generation failed. Please try again.";
}
