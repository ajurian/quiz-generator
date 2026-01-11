import { describe, expect, it } from "bun:test";
import {
  ApplicationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  QuotaExceededError,
  ExternalServiceError,
} from "@/application/errors";

describe("Application Errors", () => {
  describe("NotFoundError", () => {
    it("should create error with resource name and id", () => {
      const error = new NotFoundError("Quiz", "quiz-123");

      expect(error.message).toBe(
        "Quiz with identifier 'quiz-123' was not found"
      );
      expect(error.code).toBe("NOT_FOUND");
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe("NotFoundError");
    });

    it("should be instance of ApplicationError", () => {
      const error = new NotFoundError("Quiz", "123");

      expect(error).toBeInstanceOf(ApplicationError);
    });

    it("should create error without id", () => {
      const error = new NotFoundError("Resource");

      expect(error.message).toBe("Resource was not found");
    });
  });

  describe("UnauthorizedError", () => {
    it("should create error with default message", () => {
      const error = new UnauthorizedError();

      expect(error.message).toBe("Authentication required");
      expect(error.code).toBe("UNAUTHORIZED");
      expect(error.statusCode).toBe(401);
      expect(error.name).toBe("UnauthorizedError");
    });

    it("should create error with custom message", () => {
      const error = new UnauthorizedError("Invalid token");

      expect(error.message).toBe("Invalid token");
    });

    it("should be instance of ApplicationError", () => {
      const error = new UnauthorizedError();

      expect(error).toBeInstanceOf(ApplicationError);
    });
  });

  describe("ForbiddenError", () => {
    it("should create error with default message", () => {
      const error = new ForbiddenError();

      expect(error.message).toBe(
        "You do not have permission to access this resource"
      );
      expect(error.code).toBe("FORBIDDEN");
      expect(error.statusCode).toBe(403);
      expect(error.name).toBe("ForbiddenError");
    });

    it("should create error with custom message", () => {
      const error = new ForbiddenError("You do not have permission");

      expect(error.message).toBe("You do not have permission");
    });

    it("should be instance of ApplicationError", () => {
      const error = new ForbiddenError();

      expect(error).toBeInstanceOf(ApplicationError);
    });
  });

  describe("ValidationError", () => {
    it("should create error with message and field errors", () => {
      const error = new ValidationError("Validation failed", {
        title: ["Title is required"],
      });

      expect(error.message).toBe("Validation failed");
      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe("ValidationError");
      expect(error.errors).toEqual({ title: ["Title is required"] });
    });

    it("should create error with multiple field errors", () => {
      const error = new ValidationError("Validation failed", {
        title: ["Title is required"],
        userId: ["User ID is invalid"],
      });

      expect(error.errors.title).toEqual(["Title is required"]);
      expect(error.errors.userId).toEqual(["User ID is invalid"]);
    });

    it("should be instance of ApplicationError", () => {
      const error = new ValidationError("Validation failed");

      expect(error).toBeInstanceOf(ApplicationError);
    });
  });

  describe("QuotaExceededError", () => {
    it("should create error with service name", () => {
      const error = new QuotaExceededError("AI API");

      expect(error.message).toBe(
        "AI API quota exceeded. Please try again later."
      );
      expect(error.code).toBe("QUOTA_EXCEEDED");
      expect(error.statusCode).toBe(429);
      expect(error.name).toBe("QuotaExceededError");
    });

    it("should be instance of ApplicationError", () => {
      const error = new QuotaExceededError("Test");

      expect(error).toBeInstanceOf(ApplicationError);
    });
  });

  describe("ExternalServiceError", () => {
    it("should create error with service name", () => {
      const error = new ExternalServiceError("AI Service");

      expect(error.message).toBe("External service 'AI Service' failed");
      expect(error.code).toBe("EXTERNAL_SERVICE_ERROR");
      expect(error.statusCode).toBe(502);
      expect(error.name).toBe("ExternalServiceError");
    });

    it("should create error with original error", () => {
      const originalError = new Error("Connection refused");
      const error = new ExternalServiceError("Database", originalError);

      expect(error.message).toBe(
        "External service 'Database' failed: Connection refused"
      );
    });

    it("should be instance of ApplicationError", () => {
      const error = new ExternalServiceError("Test");

      expect(error).toBeInstanceOf(ApplicationError);
    });
  });

  describe("Error inheritance chain", () => {
    it("all errors should inherit from ApplicationError", () => {
      const errors = [
        new NotFoundError("Resource", "123"),
        new UnauthorizedError(),
        new ForbiddenError(),
        new ValidationError("Validation failed"),
        new QuotaExceededError("Service"),
        new ExternalServiceError("Service"),
      ];

      errors.forEach((error) => {
        expect(error).toBeInstanceOf(ApplicationError);
        expect(error).toBeInstanceOf(Error);
      });
    });

    it("each error type should have unique code", () => {
      const codes = [
        new NotFoundError("Resource", "123").code,
        new UnauthorizedError().code,
        new ForbiddenError().code,
        new ValidationError("Validation failed").code,
        new QuotaExceededError("Service").code,
        new ExternalServiceError("Service").code,
      ];

      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(codes.length);
    });

    it("each error type should have appropriate status code", () => {
      expect(new NotFoundError("Resource").statusCode).toBe(404);
      expect(new UnauthorizedError().statusCode).toBe(401);
      expect(new ForbiddenError().statusCode).toBe(403);
      expect(new ValidationError("Validation failed").statusCode).toBe(400);
      expect(new QuotaExceededError("Service").statusCode).toBe(429);
      expect(new ExternalServiceError("Service").statusCode).toBe(502);
    });
  });
});
