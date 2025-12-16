import { describe, expect, it } from "bun:test";
import {
  attemptStatusSchema,
  startAttemptInputSchema,
  submitAttemptInputSchema,
  attemptResponseSchema,
  toAttemptResponseDTO,
  getUserAttemptsInputSchema,
  getAttemptBySlugInputSchema,
  createAttemptSummary,
  type AttemptResponseDTO,
} from "../../application/dtos/attempt.dto";
import { AttemptStatus } from "../../domain";

describe("Attempt DTOs", () => {
  const VALID_UUID = "019b2194-72a0-7000-a712-5e5bc5c313c1";
  const VALID_SLUG = "AZshk0egcAAKcS5bxcMT";

  describe("attemptStatusSchema", () => {
    it("should accept valid status values", () => {
      expect(attemptStatusSchema.parse("in_progress")).toBe(
        AttemptStatus.IN_PROGRESS
      );
      expect(attemptStatusSchema.parse("submitted")).toBe(
        AttemptStatus.SUBMITTED
      );
    });

    it("should reject invalid status", () => {
      expect(() => attemptStatusSchema.parse("invalid")).toThrow();
      expect(() => attemptStatusSchema.parse("pending")).toThrow();
    });
  });

  describe("startAttemptInputSchema", () => {
    it("should validate correct input", () => {
      const input = {
        quizId: VALID_UUID,
        userId: VALID_UUID,
      };
      expect(() => startAttemptInputSchema.parse(input)).not.toThrow();
    });

    it("should accept null userId", () => {
      const input = {
        quizId: VALID_UUID,
        userId: null,
      };
      expect(() => startAttemptInputSchema.parse(input)).not.toThrow();
    });

    it("should reject invalid quizId", () => {
      const input = {
        quizId: "invalid",
        userId: VALID_UUID,
      };
      expect(() => startAttemptInputSchema.parse(input)).toThrow();
    });
  });

  describe("submitAttemptInputSchema", () => {
    it("should validate correct input with answers", () => {
      const input = {
        attemptId: VALID_UUID,
        userId: VALID_UUID,
        score: 85,
        answers: { q1: "A", q2: "C" },
      };
      expect(() => submitAttemptInputSchema.parse(input)).not.toThrow();
    });

    it("should accept empty answers object", () => {
      const input = {
        attemptId: VALID_UUID,
        userId: VALID_UUID,
        score: 0,
        answers: {},
      };
      const result = submitAttemptInputSchema.parse(input);
      expect(result.answers).toEqual({});
    });

    it("should accept null userId", () => {
      const input = {
        attemptId: VALID_UUID,
        userId: null,
        score: 50,
        answers: { q1: "A" },
      };
      expect(() => submitAttemptInputSchema.parse(input)).not.toThrow();
    });

    it("should reject score below 0", () => {
      const input = {
        attemptId: VALID_UUID,
        userId: VALID_UUID,
        score: -5,
        answers: {},
      };
      expect(() => submitAttemptInputSchema.parse(input)).toThrow();
    });

    it("should reject score above 100", () => {
      const input = {
        attemptId: VALID_UUID,
        userId: VALID_UUID,
        score: 105,
        answers: {},
      };
      expect(() => submitAttemptInputSchema.parse(input)).toThrow();
    });

    it("should reject missing answers field", () => {
      const input = {
        attemptId: VALID_UUID,
        userId: VALID_UUID,
        score: 80,
      };
      expect(() => submitAttemptInputSchema.parse(input)).toThrow();
    });

    it("should accept answers with various questionId formats", () => {
      const input = {
        attemptId: VALID_UUID,
        userId: VALID_UUID,
        score: 80,
        answers: {
          [VALID_UUID]: "A",
          "question-123": "B",
          q1: "C",
        },
      };
      expect(() => submitAttemptInputSchema.parse(input)).not.toThrow();
    });
  });

  describe("attemptResponseSchema", () => {
    const validResponse = {
      id: VALID_UUID,
      slug: "AZshk0egcAAKcS5bxcMTwQ",
      quizId: VALID_UUID,
      userId: VALID_UUID,
      status: AttemptStatus.SUBMITTED,
      score: 85,
      durationMs: 120000,
      formattedDuration: "2m 0s",
      startedAt: "2024-01-01T10:00:00.000Z",
      submittedAt: "2024-01-01T10:02:00.000Z",
      answers: { q1: "A", q2: "B" },
    };

    it("should validate correct response", () => {
      expect(() => attemptResponseSchema.parse(validResponse)).not.toThrow();
    });

    it("should accept null values for nullable fields", () => {
      const response = {
        ...validResponse,
        userId: null,
        score: null,
        durationMs: null,
        formattedDuration: null,
        submittedAt: null,
      };
      expect(() => attemptResponseSchema.parse(response)).not.toThrow();
    });

    it("should require answers field", () => {
      const { answers, ...responseWithoutAnswers } = validResponse;
      expect(() =>
        attemptResponseSchema.parse(responseWithoutAnswers)
      ).toThrow();
    });

    it("should validate slug length", () => {
      const response = {
        ...validResponse,
        slug: "short",
      };
      expect(() => attemptResponseSchema.parse(response)).toThrow();
    });
  });

  describe("toAttemptResponseDTO", () => {
    it("should transform attempt to DTO with answers", () => {
      const attempt = {
        id: VALID_UUID,
        slug: "AZshk0egcAAKcS5bxcMTwQ",
        quizId: VALID_UUID,
        userId: VALID_UUID,
        status: AttemptStatus.SUBMITTED,
        score: 85,
        durationMs: 120000,
        startedAt: new Date("2024-01-01T10:00:00Z"),
        submittedAt: new Date("2024-01-01T10:02:00Z"),
        answers: { q1: "A", q2: "C" },
      };

      const dto = toAttemptResponseDTO(attempt);

      expect(dto.id).toBe(VALID_UUID);
      expect(dto.answers).toEqual({ q1: "A", q2: "C" });
      expect(dto.score).toBe(85);
      expect(dto.status).toBe(AttemptStatus.SUBMITTED);
    });

    it("should format duration in seconds only", () => {
      const attempt = {
        id: VALID_UUID,
        slug: "AZshk0egcAAKcS5bxcMTwQ",
        quizId: VALID_UUID,
        userId: VALID_UUID,
        status: AttemptStatus.SUBMITTED,
        score: 80,
        durationMs: 45000,
        startedAt: new Date("2024-01-01T10:00:00Z"),
        submittedAt: new Date("2024-01-01T10:00:45Z"),
        answers: {},
      };

      const dto = toAttemptResponseDTO(attempt);

      expect(dto.formattedDuration).toBe("45s");
    });

    it("should format duration with minutes and seconds", () => {
      const attempt = {
        id: VALID_UUID,
        slug: "AZshk0egcAAKcS5bxcMTwQ",
        quizId: VALID_UUID,
        userId: VALID_UUID,
        status: AttemptStatus.SUBMITTED,
        score: 80,
        durationMs: 125000,
        startedAt: new Date("2024-01-01T10:00:00Z"),
        submittedAt: new Date("2024-01-01T10:02:05Z"),
        answers: {},
      };

      const dto = toAttemptResponseDTO(attempt);

      expect(dto.formattedDuration).toBe("2m 5s");
    });

    it("should return null formattedDuration when durationMs is null", () => {
      const attempt = {
        id: VALID_UUID,
        slug: "AZshk0egcAAKcS5bxcMTwQ",
        quizId: VALID_UUID,
        userId: VALID_UUID,
        status: AttemptStatus.IN_PROGRESS,
        score: null,
        durationMs: null,
        startedAt: new Date("2024-01-01T10:00:00Z"),
        submittedAt: null,
        answers: { q1: "A" },
      };

      const dto = toAttemptResponseDTO(attempt);

      expect(dto.formattedDuration).toBeNull();
    });

    it("should convert dates to ISO strings", () => {
      const attempt = {
        id: VALID_UUID,
        slug: "AZshk0egcAAKcS5bxcMTwQ",
        quizId: VALID_UUID,
        userId: null,
        status: AttemptStatus.SUBMITTED,
        score: 100,
        durationMs: 60000,
        startedAt: new Date("2024-01-01T10:00:00Z"),
        submittedAt: new Date("2024-01-01T10:01:00Z"),
        answers: {},
      };

      const dto = toAttemptResponseDTO(attempt);

      expect(dto.startedAt).toBe("2024-01-01T10:00:00.000Z");
      expect(dto.submittedAt).toBe("2024-01-01T10:01:00.000Z");
    });
  });

  describe("getUserAttemptsInputSchema", () => {
    it("should validate correct input", () => {
      const input = {
        quizSlug: "AZshk0egcAAKcS5bxcMTwQ",
        userId: VALID_UUID,
      };
      expect(() => getUserAttemptsInputSchema.parse(input)).not.toThrow();
    });

    it("should reject invalid slug length", () => {
      const input = {
        quizSlug: "short",
        userId: VALID_UUID,
      };
      expect(() => getUserAttemptsInputSchema.parse(input)).toThrow();
    });
  });

  describe("getAttemptBySlugInputSchema", () => {
    it("should validate correct input", () => {
      const input = {
        quizSlug: "AZshk0egcAAKcS5bxcMTwQ",
        attemptSlug: "BYtik1fhcBBLdT6cydNUxR",
        userId: VALID_UUID,
      };
      expect(() => getAttemptBySlugInputSchema.parse(input)).not.toThrow();
    });

    it("should accept null userId", () => {
      const input = {
        quizSlug: "AZshk0egcAAKcS5bxcMTwQ",
        attemptSlug: "BYtik1fhcBBLdT6cydNUxR",
        userId: null,
      };
      expect(() => getAttemptBySlugInputSchema.parse(input)).not.toThrow();
    });
  });

  describe("createAttemptSummary", () => {
    const createMockAttemptDTO = (
      overrides: Partial<AttemptResponseDTO>
    ): AttemptResponseDTO => ({
      id: VALID_UUID,
      slug: "AZshk0egcAAKcS5bxcMTwQ",
      quizId: VALID_UUID,
      userId: VALID_UUID,
      status: AttemptStatus.SUBMITTED,
      score: 80,
      durationMs: 60000,
      formattedDuration: "1m 0s",
      startedAt: "2024-01-01T10:00:00.000Z",
      submittedAt: "2024-01-01T10:01:00.000Z",
      answers: {},
      ...overrides,
    });

    it("should calculate summary for submitted attempts", () => {
      const attempts = [
        createMockAttemptDTO({ score: 90 }),
        createMockAttemptDTO({ score: 80 }),
        createMockAttemptDTO({ score: 70 }),
      ];

      const summary = createAttemptSummary(attempts);

      expect(summary.totalAttempts).toBe(3);
      expect(summary.bestScore).toBe(90);
      expect(summary.averageScore).toBe(80);
      expect(summary.lastAttempt).toBe(attempts[0]!);
    });

    it("should exclude in-progress attempts from stats", () => {
      const attempts = [
        createMockAttemptDTO({
          status: AttemptStatus.IN_PROGRESS,
          score: null,
        }),
        createMockAttemptDTO({ score: 80 }),
        createMockAttemptDTO({ score: 60 }),
      ];

      const summary = createAttemptSummary(attempts);

      expect(summary.totalAttempts).toBe(2);
      expect(summary.bestScore).toBe(80);
      expect(summary.averageScore).toBe(70);
    });

    it("should return null scores for empty attempts", () => {
      const summary = createAttemptSummary([]);

      expect(summary.totalAttempts).toBe(0);
      expect(summary.bestScore).toBeNull();
      expect(summary.averageScore).toBeNull();
      expect(summary.lastAttempt).toBeNull();
    });

    it("should handle single attempt", () => {
      const attempts = [createMockAttemptDTO({ score: 75 })];

      const summary = createAttemptSummary(attempts);

      expect(summary.totalAttempts).toBe(1);
      expect(summary.bestScore).toBe(75);
      expect(summary.averageScore).toBe(75);
    });

    it("should round average score to 2 decimal places", () => {
      const attempts = [
        createMockAttemptDTO({ score: 85 }),
        createMockAttemptDTO({ score: 75 }),
        createMockAttemptDTO({ score: 80 }),
      ];

      const summary = createAttemptSummary(attempts);

      expect(summary.averageScore).toBe(80);
    });

    it("should include lastAttempt even if in-progress", () => {
      const attempts = [
        createMockAttemptDTO({
          status: AttemptStatus.IN_PROGRESS,
          score: null,
        }),
      ];

      const summary = createAttemptSummary(attempts);

      expect(summary.lastAttempt).toBe(attempts[0]!);
      expect(summary.totalAttempts).toBe(0); // In-progress doesn't count
    });
  });
});
