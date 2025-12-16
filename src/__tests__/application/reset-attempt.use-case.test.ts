import { describe, expect, it, beforeEach, mock } from "bun:test";
import {
  ResetAttemptUseCase,
  type ResetAttemptUseCaseDeps,
  type ResetAttemptInput,
} from "../../application/use-cases/reset-attempt.use-case";
import { QuizAttempt, AttemptStatus } from "../../domain";
import type { IAttemptRepository } from "../../application/ports";
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from "../../application/errors";

describe("ResetAttemptUseCase", () => {
  let useCase: ResetAttemptUseCase;
  let mockAttemptRepository: IAttemptRepository;

  const ATTEMPT_ID = "019b2194-72a0-7000-a712-5e5bc5c313c0";
  const QUIZ_ID = "019b2194-72a0-7000-a712-5e5bc5c313c1";
  const USER_ID = "018e3f5e-5f2a-7c2b-b3a4-9f8d6c4b2a10";
  const QUESTION_ID_1 = "019b2194-72a0-7000-a712-5e5bc5c313c2";
  const QUESTION_ID_2 = "019b2194-72a0-7000-a712-5e5bc5c313c3";

  const createValidInput = (): ResetAttemptInput => ({
    attemptId: ATTEMPT_ID,
    userId: USER_ID,
  });

  const createInProgressAttemptWithAnswers = (): QuizAttempt => {
    return QuizAttempt.reconstitute({
      id: ATTEMPT_ID,
      slug: "test-slug",
      quizId: QUIZ_ID,
      userId: USER_ID,
      status: AttemptStatus.IN_PROGRESS,
      score: null,
      durationMs: null,
      startedAt: new Date(),
      submittedAt: null,
      answers: {
        [QUESTION_ID_1]: "A",
        [QUESTION_ID_2]: "B",
      },
    });
  };

  const createInProgressAttemptWithoutAnswers = (): QuizAttempt => {
    return QuizAttempt.reconstitute({
      id: ATTEMPT_ID,
      slug: "test-slug",
      quizId: QUIZ_ID,
      userId: USER_ID,
      status: AttemptStatus.IN_PROGRESS,
      score: null,
      durationMs: null,
      startedAt: new Date(),
      submittedAt: null,
      answers: {},
    });
  };

  const createSubmittedAttempt = (): QuizAttempt => {
    return QuizAttempt.reconstitute({
      id: ATTEMPT_ID,
      slug: "test-slug",
      quizId: QUIZ_ID,
      userId: USER_ID,
      status: AttemptStatus.SUBMITTED,
      score: 80,
      durationMs: 60000,
      startedAt: new Date(Date.now() - 60000),
      submittedAt: new Date(),
      answers: {
        [QUESTION_ID_1]: "A",
        [QUESTION_ID_2]: "C",
      },
    });
  };

  beforeEach(() => {
    mockAttemptRepository = {
      create: mock(() => Promise.resolve(createInProgressAttemptWithAnswers())),
      findById: mock(() =>
        Promise.resolve(createInProgressAttemptWithAnswers())
      ),
      findBySlug: mock(() => Promise.resolve(null)),
      findByQuizAndUser: mock(() => Promise.resolve([])),
      findByQuizId: mock((_quizId, pagination) =>
        Promise.resolve({
          data: [],
          total: 0,
          page: pagination.page,
          limit: pagination.limit,
          totalPages: 0,
        })
      ),
      findByUserId: mock((_userId, pagination) =>
        Promise.resolve({
          data: [],
          total: 0,
          page: pagination.page,
          limit: pagination.limit,
          totalPages: 0,
        })
      ),
      findLastAttemptByQuizAndUser: mock(() => Promise.resolve(null)),
      countByQuizAndUser: mock(() => Promise.resolve(0)),
      update: mock((attempt: QuizAttempt) => Promise.resolve(attempt)),
      delete: mock(() => Promise.resolve()),
      exists: mock(() => Promise.resolve(true)),
      findInProgressByQuizAndUser: mock(() => Promise.resolve(null)),
    };

    const deps: ResetAttemptUseCaseDeps = {
      attemptRepository: mockAttemptRepository,
    };

    useCase = new ResetAttemptUseCase(deps);
  });

  describe("successful reset", () => {
    it("should reset all answers for in-progress attempt", async () => {
      const input = createValidInput();
      const attempt = createInProgressAttemptWithAnswers();
      mockAttemptRepository.findById = mock(() => Promise.resolve(attempt));

      const result = await useCase.execute(input);

      expect(result.attempt).toBeDefined();
      expect(result.attempt.id).toBe(ATTEMPT_ID);
      expect(mockAttemptRepository.update).toHaveBeenCalled();

      // Verify the attempt was updated with empty answers
      const updateMock = mockAttemptRepository.update as ReturnType<
        typeof mock
      >;
      expect(updateMock).toHaveBeenCalledTimes(1);
      const updatedAttempt = updateMock.mock.calls[0]![0] as QuizAttempt;
      expect(Object.keys(updatedAttempt.answers).length).toBe(0);
    });

    it("should work even if attempt has no answers", async () => {
      const input = createValidInput();
      const attempt = createInProgressAttemptWithoutAnswers();
      mockAttemptRepository.findById = mock(() => Promise.resolve(attempt));

      const result = await useCase.execute(input);

      expect(result.attempt).toBeDefined();
      expect(mockAttemptRepository.update).toHaveBeenCalled();
    });

    it("should preserve attempt metadata after reset", async () => {
      const input = createValidInput();
      const attempt = createInProgressAttemptWithAnswers();
      mockAttemptRepository.findById = mock(() => Promise.resolve(attempt));

      const result = await useCase.execute(input);

      expect(result.attempt.quizId).toBe(QUIZ_ID);
      expect(result.attempt.userId).toBe(USER_ID);
      expect(result.attempt.status).toBe(AttemptStatus.IN_PROGRESS);
    });
  });

  describe("validation errors", () => {
    it("should throw ValidationError when attemptId is missing", async () => {
      const input = createValidInput();
      input.attemptId = "";

      await expect(useCase.execute(input)).rejects.toThrow(ValidationError);
    });
  });

  describe("not found errors", () => {
    it("should throw NotFoundError when attempt does not exist", async () => {
      const input = createValidInput();
      mockAttemptRepository.findById = mock(() => Promise.resolve(null));

      await expect(useCase.execute(input)).rejects.toThrow(NotFoundError);
    });
  });

  describe("forbidden errors", () => {
    it("should throw ForbiddenError when user does not own attempt", async () => {
      const input = createValidInput();
      input.userId = "different-user-id";
      const attempt = createInProgressAttemptWithAnswers();
      mockAttemptRepository.findById = mock(() => Promise.resolve(attempt));

      await expect(useCase.execute(input)).rejects.toThrow(ForbiddenError);
    });

    it("should throw ForbiddenError when attempt is already submitted", async () => {
      const input = createValidInput();
      const attempt = createSubmittedAttempt();
      mockAttemptRepository.findById = mock(() => Promise.resolve(attempt));

      await expect(useCase.execute(input)).rejects.toThrow(ForbiddenError);
    });

    it("should throw ForbiddenError for null userId trying to reset owned attempt", async () => {
      const input = createValidInput();
      input.userId = null;
      const attempt = createInProgressAttemptWithAnswers();
      mockAttemptRepository.findById = mock(() => Promise.resolve(attempt));

      await expect(useCase.execute(input)).rejects.toThrow(ForbiddenError);
    });
  });

  describe("idempotency", () => {
    it("should be idempotent when resetting already empty attempt", async () => {
      const input = createValidInput();
      const attempt = createInProgressAttemptWithoutAnswers();
      mockAttemptRepository.findById = mock(() => Promise.resolve(attempt));

      const result = await useCase.execute(input);

      expect(result.attempt).toBeDefined();
      expect(mockAttemptRepository.update).toHaveBeenCalled();
    });
  });
});
