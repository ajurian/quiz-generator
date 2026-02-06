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
 * Error patterns for detection in raw error messages
 */
const ERROR_PATTERNS = {
  quota: ["quota", "rate limit", "too many requests", "429"],
  timeout: ["timeout", "timed out", "deadline", "etimeout"],
  file: ["file", "upload", "multipart", "form data"],
  parse: ["parse", "json", "syntax", "unexpected token"],
  network: ["network", "econnreset", "econnrefused", "fetch failed", "socket"],
  unavailable: [
    "unavailable",
    "503",
    "service temporarily",
    "overloaded",
    "maintenance",
  ],
} as const;

/**
 * Detects error type from an error message string
 */
function detectErrorType(message: string): keyof typeof ERROR_PATTERNS | null {
  const lowerMessage = message.toLowerCase();

  for (const [type, patterns] of Object.entries(ERROR_PATTERNS)) {
    if (patterns.some((pattern) => lowerMessage.includes(pattern))) {
      return type as keyof typeof ERROR_PATTERNS;
    }
  }

  return null;
}

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
  SERVICE_UNAVAILABLE:
    "The service is temporarily unavailable. Please try again in a few minutes.",
};

/**
 * Context-specific error messages for better UX
 */
const CONTEXT_MESSAGES: Record<string, Record<string, string>> = {
  quiz: {
    NOT_FOUND: "This quiz doesn't exist or has been deleted.",
    FORBIDDEN: "You don't have access to this quiz.",
    EXTERNAL_SERVICE_ERROR: "Failed to generate quiz. Please try again.",
    SERVICE_UNAVAILABLE:
      "Quiz service is temporarily unavailable. Please try again in a few minutes.",
  },
  attempt: {
    NOT_FOUND: "This attempt could not be found.",
    FORBIDDEN: "You don't have access to this attempt.",
    SERVICE_UNAVAILABLE:
      "Unable to process your attempt right now. Please try again shortly.",
  },
  visibility: {
    FORBIDDEN: "Only the quiz owner can change visibility settings.",
  },
  generation: {
    QUOTA_EXCEEDED:
      "AI generation limit reached. Please try again in a few minutes.",
    EXTERNAL_SERVICE_ERROR: "Quiz generation failed. Please try again.",
    SERVICE_UNAVAILABLE:
      "AI service is temporarily unavailable. Please try again in a few minutes.",
  },
  auth: {
    UNAUTHORIZED: "Invalid email or password.",
    VALIDATION_ERROR: "Please check your credentials and try again.",
    SERVICE_UNAVAILABLE:
      "Authentication service is temporarily unavailable. Please try again shortly.",
  },
};

/**
 * User-friendly messages for generation failure events
 * Maps error types detected from raw messages to user-friendly descriptions
 */
const GENERATION_ERROR_MESSAGES = {
  quota: "AI service is busy. Please try again in a few minutes.",
  timeout: "Generation took too long. Please try with smaller files.",
  file: "There was a problem with your files. Please try uploading again.",
  parse: "AI response was invalid. Please try again.",
  network:
    "Connection issue occurred. Please check your network and try again.",
  unavailable: "AI service is temporarily unavailable. Please try again later.",
  fallback: "Quiz generation failed. Please try again.",
} as const;

/**
 * Translates an error into a user-friendly message
 *
 * @param error - The error to translate
 * @param context - Optional context for more specific messages (e.g., 'quiz', 'attempt')
 * @returns User-friendly error message
 */
export function getUserFriendlyMessage(
  error: unknown,
  context?: keyof typeof CONTEXT_MESSAGES,
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

  // Handle Error instances with message pattern detection
  if (error instanceof Error) {
    const errorType = detectErrorType(error.message);
    if (errorType === "unavailable") {
      return context && CONTEXT_MESSAGES[context]?.SERVICE_UNAVAILABLE
        ? CONTEXT_MESSAGES[context].SERVICE_UNAVAILABLE!
        : USER_FRIENDLY_MESSAGES.SERVICE_UNAVAILABLE!;
    }
    if (errorType === "network") {
      return "Connection issue occurred. Please check your network and try again.";
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
  eventErrorMessage: string | undefined,
): string {
  const fallbackMessage = GENERATION_ERROR_MESSAGES.fallback;

  if (!eventErrorMessage) {
    return fallbackMessage;
  }

  const errorType = detectErrorType(eventErrorMessage);

  if (errorType && errorType in GENERATION_ERROR_MESSAGES) {
    return GENERATION_ERROR_MESSAGES[
      errorType as keyof typeof GENERATION_ERROR_MESSAGES
    ];
  }

  return fallbackMessage;
}

/**
 * Translates auth-related error messages to user-friendly format
 * Used for sign-in/sign-up flows where errors come from auth library
 *
 * @param errorMessage - The error message from auth library
 * @param defaultMessage - Default message if no match found
 * @returns User-friendly error message
 */
export function getAuthErrorMessage(
  errorMessage: string | undefined,
  defaultMessage: string,
): string {
  if (!errorMessage) {
    return defaultMessage;
  }

  const lowerMessage = errorMessage.toLowerCase();

  // Common auth error patterns
  if (
    lowerMessage.includes("invalid") ||
    lowerMessage.includes("incorrect") ||
    lowerMessage.includes("wrong")
  ) {
    return "Invalid email or password.";
  }

  if (
    lowerMessage.includes("exist") ||
    lowerMessage.includes("duplicate") ||
    lowerMessage.includes("already")
  ) {
    return "An account with this email already exists.";
  }

  if (lowerMessage.includes("expired")) {
    return "Your session has expired. Please sign in again.";
  }

  // Check for service unavailability
  const errorType = detectErrorType(errorMessage);
  if (errorType === "unavailable" || errorType === "network") {
    return (
      CONTEXT_MESSAGES.auth?.SERVICE_UNAVAILABLE ??
      USER_FRIENDLY_MESSAGES.SERVICE_UNAVAILABLE!
    );
  }

  return defaultMessage;
}
