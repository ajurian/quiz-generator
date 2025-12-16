import { describe, expect, it, beforeEach, mock } from "bun:test";
import {
  SubmitAttemptUseCase,
  type SubmitAttemptUseCaseDeps,
  type SubmitAttemptInput,
} from "../../application/use-cases/submit-attempt.use-case";
import { QuizAttempt, AttemptStatus } from "../../domain";
import type { IAttemptRepository } from "../../application/ports";
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from "../../application/errors";

describe("SubmitAttemptUseCase", () => {
  let useCase: SubmitAttemptUseCase;
  let mockAttemptRepository: IAttemptRepository;

  const ATTEMPT_ID = "019b2194-72a0-7000-a712-5e5bc5c313c1";
  const QUIZ_ID = "019b2194-72a0-7000-a712-5e5bc5c313c2";
  const USER_ID = "018e3f5e-5f2a-7c2b-b3a4-9f8d6c4b2a10";
  const OTHER_USER_ID = "019b2194-72a0-7000-a712-5e5bc5c313c0";
  const NON_EXISTENT_ATTEMPT_ID = "019b2194-72a0-7000-a712-5e5bc5c313d0";

  const createMockAttempt = (
    userId: string | null = USER_ID,
    status: AttemptStatus = AttemptStatus.IN_PROGRESS
  ): QuizAttempt => {
    if (status === AttemptStatus.SUBMITTED) {
      return QuizAttempt.reconstitute({
        id: ATTEMPT_ID,
        slug: "AZshk0egcAAKcS5bxcMTwQ",
        quizId: QUIZ_ID,
        userId,
        status: AttemptStatus.SUBMITTED,
        score: 80,
        durationMs: 60000,
        startedAt: new Date("2024-01-01T10:00:00Z"),
        submittedAt: new Date("2024-01-01T10:01:00Z"),
        answers: { q1: "A" },
      });
    }
    return QuizAttempt.create({
      id: ATTEMPT_ID,
      quizId: QUIZ_ID,
      userId,
    });
  };

  beforeEach(() => {
    mockAttemptRepository = {
      create: mock(async (attempt: QuizAttempt) => attempt),
      findById: mock(async (id: string) => {
        if (id === ATTEMPT_ID) {
          return createMockAttempt();
        }
        return null;
      }),
      findBySlug: mock(async () => null),
      findByQuizAndUser: mock(async () => []),
      findByQuizId: mock(async () => ({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      })),
      findByUserId: mock(async () => ({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      })),
      findLastAttemptByQuizAndUser: mock(async () => null),
      countByQuizAndUser: mock(async () => 0),
      update: mock(async (attempt: QuizAttempt) => attempt),
      delete: mock(async () => {}),
      exists: mock(async () => false),
      findInProgressByQuizAndUser: mock(async () => null),
    };

    useCase = new SubmitAttemptUseCase({
      attemptRepository: mockAttemptRepository,
    });
  });

  describe("successful execution", () => {
    it("should submit attempt with score and answers", async () => {
      const input: SubmitAttemptInput = {
        attemptId: ATTEMPT_ID,
        userId: USER_ID,
        score: 85,
        answers: { q1: "A", q2: "C", q3: "B" },
      };

      const result = await useCase.execute(input);

      expect(result.attempt.status).toBe(AttemptStatus.SUBMITTED);
      expect(result.attempt.score).toBe(85);
      expect(result.attempt.answers).toEqual({ q1: "A", q2: "C", q3: "B" });
    });

    it("should call update on repository", async () => {
      const input: SubmitAttemptInput = {
        attemptId: ATTEMPT_ID,
        userId: USER_ID,
        score: 75,
        answers: { q1: "B" },
      };

      await useCase.execute(input);

      expect(mockAttemptRepository.update).toHaveBeenCalledTimes(1);
    });

    it("should submit with zero score", async () => {
      const input: SubmitAttemptInput = {
        attemptId: ATTEMPT_ID,
        userId: USER_ID,
        score: 0,
        answers: { q1: "X" },
      };

      const result = await useCase.execute(input);

      expect(result.attempt.score).toBe(0);
      expect(result.attempt.status).toBe(AttemptStatus.SUBMITTED);
    });

    it("should submit with perfect score", async () => {
      const input: SubmitAttemptInput = {
        attemptId: ATTEMPT_ID,
        userId: USER_ID,
        score: 100,
        answers: { q1: "A", q2: "B", q3: "C" },
      };

      const result = await useCase.execute(input);

      expect(result.attempt.score).toBe(100);
    });

    it("should submit with empty answers", async () => {
      const input: SubmitAttemptInput = {
        attemptId: ATTEMPT_ID,
        userId: USER_ID,
        score: 0,
        answers: {},
      };

      const result = await useCase.execute(input);

      expect(result.attempt.answers).toEqual({});
    });

    it("should return formatted duration after submission", async () => {
      const input: SubmitAttemptInput = {
        attemptId: ATTEMPT_ID,
        userId: USER_ID,
        score: 80,
        answers: { q1: "A" },
      };

      const result = await useCase.execute(input);

      // Duration should be calculated
      expect(result.attempt.durationMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe("access control", () => {
    it("should throw ForbiddenError when non-owner tries to submit", async () => {
      const input: SubmitAttemptInput = {
        attemptId: ATTEMPT_ID,
        userId: OTHER_USER_ID,
        score: 80,
        answers: { q1: "A" },
      };

      await expect(useCase.execute(input)).rejects.toThrow(ForbiddenError);
      await expect(useCase.execute(input)).rejects.toThrow(
        "You can only submit your own attempts"
      );
    });

    it("should throw ForbiddenError when trying to claim anonymous attempt", async () => {
      mockAttemptRepository.findById = mock(async () =>
        createMockAttempt(null)
      );

      const input: SubmitAttemptInput = {
        attemptId: ATTEMPT_ID,
        userId: USER_ID, // Trying to claim with a userId
        score: 80,
        answers: { q1: "A" },
      };

      await expect(useCase.execute(input)).rejects.toThrow(ForbiddenError);
      await expect(useCase.execute(input)).rejects.toThrow(
        "Cannot claim anonymous attempt"
      );
    });

    it("should allow anonymous submission when attempt was started anonymously", async () => {
      mockAttemptRepository.findById = mock(async () =>
        createMockAttempt(null)
      );

      const input: SubmitAttemptInput = {
        attemptId: ATTEMPT_ID,
        userId: null,
        score: 80,
        answers: { q1: "A" },
      };

      const result = await useCase.execute(input);

      expect(result.attempt.status).toBe(AttemptStatus.SUBMITTED);
      expect(result.attempt.userId).toBeNull();
    });
  });

  describe("error handling", () => {
    it("should throw NotFoundError when attempt does not exist", async () => {
      const input: SubmitAttemptInput = {
        attemptId: NON_EXISTENT_ATTEMPT_ID,
        userId: USER_ID,
        score: 80,
        answers: { q1: "A" },
      };

      await expect(useCase.execute(input)).rejects.toThrow(NotFoundError);
    });

    it("should throw ValidationError for missing attemptId", async () => {
      const input: SubmitAttemptInput = {
        attemptId: "",
        userId: USER_ID,
        score: 80,
        answers: { q1: "A" },
      };

      await expect(useCase.execute(input)).rejects.toThrow(ValidationError);
      await expect(useCase.execute(input)).rejects.toThrow(
        "Attempt ID is required"
      );
    });

    it("should throw ValidationError for negative score", async () => {
      const input: SubmitAttemptInput = {
        attemptId: ATTEMPT_ID,
        userId: USER_ID,
        score: -10,
        answers: { q1: "A" },
      };

      await expect(useCase.execute(input)).rejects.toThrow(ValidationError);
      await expect(useCase.execute(input)).rejects.toThrow("Invalid score");
    });

    it("should throw ValidationError for score over 100", async () => {
      const input: SubmitAttemptInput = {
        attemptId: ATTEMPT_ID,
        userId: USER_ID,
        score: 105,
        answers: { q1: "A" },
      };

      await expect(useCase.execute(input)).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError when attempting to submit already submitted attempt", async () => {
      mockAttemptRepository.findById = mock(async () =>
        createMockAttempt(USER_ID, AttemptStatus.SUBMITTED)
      );

      const input: SubmitAttemptInput = {
        attemptId: ATTEMPT_ID,
        userId: USER_ID,
        score: 90,
        answers: { q1: "A" },
      };

      await expect(useCase.execute(input)).rejects.toThrow(ValidationError);
      await expect(useCase.execute(input)).rejects.toThrow(
        "Attempt has already been submitted"
      );
    });
  });
});
