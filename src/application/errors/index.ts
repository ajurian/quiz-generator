/**
 * Base class for application-level errors
 */
export abstract class ApplicationError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error thrown when a resource is not found
 */
export class NotFoundError extends ApplicationError {
  readonly code = "NOT_FOUND";
  readonly statusCode = 404;

  constructor(resource: string, identifier?: string) {
    super(
      identifier
        ? `${resource} with identifier '${identifier}' was not found`
        : `${resource} was not found`
    );
  }
}

/**
 * Error thrown when user is not authorized to perform an action
 */
export class UnauthorizedError extends ApplicationError {
  readonly code = "UNAUTHORIZED";
  readonly statusCode = 401;

  constructor(message = "Authentication required") {
    super(message);
  }
}

/**
 * Error thrown when user doesn't have permission to access a resource
 */
export class ForbiddenError extends ApplicationError {
  readonly code = "FORBIDDEN";
  readonly statusCode = 403;

  constructor(message = "You do not have permission to access this resource") {
    super(message);
  }
}

/**
 * Error thrown when input validation fails
 */
export class ValidationError extends ApplicationError {
  readonly code = "VALIDATION_ERROR";
  readonly statusCode = 400;
  readonly errors: Record<string, string[]>;

  constructor(message: string, errors: Record<string, string[]> = {}) {
    super(message);
    this.errors = errors;
  }
}

/**
 * Error thrown when AI quota is exceeded
 */
export class QuotaExceededError extends ApplicationError {
  readonly code = "QUOTA_EXCEEDED";
  readonly statusCode = 429;

  constructor(service: string) {
    super(`${service} quota exceeded. Please try again later.`);
  }
}

/**
 * Error thrown when an external service fails
 */
export class ExternalServiceError extends ApplicationError {
  readonly code = "EXTERNAL_SERVICE_ERROR";
  readonly statusCode = 502;

  constructor(service: string, originalError?: Error) {
    super(
      `External service '${service}' failed${
        originalError ? `: ${originalError.message}` : ""
      }`
    );
  }
}
