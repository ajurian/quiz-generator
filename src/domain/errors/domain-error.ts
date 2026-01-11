/**
 * Base error class for all domain-layer errors.
 * Provides structured error handling with error codes for consistent Application-layer mapping.
 */
export abstract class DomainError extends Error {
  public readonly code: string;
  public readonly timestamp: Date;

  constructor(code: string, message: string) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.timestamp = new Date();

    // Maintains proper stack trace for where error was thrown (V8 engines)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Returns a plain object representation for logging/serialization
   */
  public toPlain(): { code: string; message: string; name: string } {
    return {
      code: this.code,
      message: this.message,
      name: this.name,
    };
  }
}

/**
 * Error thrown when a domain invariant is violated.
 * Use for validation failures during entity creation or reconstitution.
 */
export class InvariantViolationError extends DomainError {
  public readonly field?: string;

  constructor(message: string, field?: string) {
    super("INVARIANT_VIOLATION", field ? `${field}: ${message}` : message);
    this.field = field;
  }
}

/**
 * Error thrown when an entity is not found.
 */
export class EntityNotFoundError extends DomainError {
  public readonly entityType: string;
  public readonly entityId: string;

  constructor(entityType: string, entityId: string) {
    super("ENTITY_NOT_FOUND", `${entityType} with ID '${entityId}' not found`);
    this.entityType = entityType;
    this.entityId = entityId;
  }
}

/**
 * Error thrown when an operation is not allowed in the current state.
 */
export class InvalidOperationError extends DomainError {
  constructor(message: string) {
    super("INVALID_OPERATION", message);
  }
}

/**
 * Error thrown when a value object receives invalid input.
 */
export class InvalidValueError extends DomainError {
  public readonly valueType: string;

  constructor(valueType: string, message: string) {
    super("INVALID_VALUE", `Invalid ${valueType}: ${message}`);
    this.valueType = valueType;
  }
}

/**
 * Type guard to check if an error is a DomainError
 */
export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError;
}

/**
 * Type guard to check if an error is an InvariantViolationError
 */
export function isInvariantViolationError(
  error: unknown
): error is InvariantViolationError {
  return error instanceof InvariantViolationError;
}
