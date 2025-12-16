import { describe, expect, it, beforeEach, mock } from "bun:test";
import {
  AutosaveAnswerUseCase,
  type AutosaveAnswerUseCaseDeps,
  type AutosaveAnswerInput,
} from "../../application/use-cases/autosave-answer.use-case";
import { QuizAttempt, AttemptStatus } from "../../domain";
import type { IAttemptRepository } from "../../application/ports";
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from "../../application/errors";

describe("AutosaveAnswerUseCase", () => {
  let useCase: AutosaveAnswerUseCase;
  let mockAttemptRepository: IAttemptRepository;

  const ATTEMPT_ID = "019b2194-72a0-7000-a712-5e5bc5c313c0";
  const QUIZ_ID = "019b2194-72a0-7000-a712-5e5bc5c313c1";
  const USER_ID = "018e3f5e-5f2a-7c2b-b3a4-9f8d6c4b2a10";
  const QUESTION_ID = "019b2194-72a0-7000-a712-5e5bc5c313c2";

  const createValidInput = (): AutosaveAnswerInput => ({
    attemptId: ATTEMPT_ID,
    userId: USER_ID,
    questionId: QUESTION_ID,
    optionIndex: "A",
  });

  const createInProgressAttempt = (
    answers: Record<string, string> = {}
  ): QuizAttempt => {
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
      answers,
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
      answers: { [QUESTION_ID]: "B" },
    });
  };

  beforeEach(() => {
    mockAttemptRepository = {
      create: mock(() => Promise.resolve(createInProgressAttempt())),
      findById: mock(() => Promise.resolve(createInProgressAttempt())),
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

    const deps: AutosaveAnswerUseCaseDeps = {
      attemptRepository: mockAttemptRepository,
    };

    useCase = new AutosaveAnswerUseCase(deps);
  });

  describe("successful autosave", () => {
    it("should save answer for in-progress attempt", async () => {
      const input = createValidInput();
      const attempt = createInProgressAttempt();
      mockAttemptRepository.findById = mock(() => Promise.resolve(attempt));

      const result = await useCase.execute(input);

      expect(result.attempt).toBeDefined();
      expect(result.attempt.id).toBe(ATTEMPT_ID);
      expect(mockAttemptRepository.update).toHaveBeenCalled();
    });

    it("should update existing answer for same question", async () => {
      const input = createValidInput();
      input.optionIndex = "C";
      const attempt = createInProgressAttempt({ [QUESTION_ID]: "A" });
      mockAttemptRepository.findById = mock(() => Promise.resolve(attempt));

      const result = await useCase.execute(input);

      expect(result.attempt).toBeDefined();
      expect(mockAttemptRepository.update).toHaveBeenCalled();
    });

    it("should preserve other answers when adding new one", async () => {
      const OTHER_QUESTION_ID = "other-question-id";
      const input = createValidInput();
      const attempt = createInProgressAttempt({ [OTHER_QUESTION_ID]: "B" });
      mockAttemptRepository.findById = mock(() => Promise.resolve(attempt));

      await useCase.execute(input);

      const updateMock = mockAttemptRepository.update as ReturnType<
        typeof mock
      >;
      expect(updateMock).toHaveBeenCalledTimes(1);
      const updatedAttempt = updateMock.mock.calls[0]![0] as QuizAttempt;
      expect(updatedAttempt.answers[OTHER_QUESTION_ID]).toBe("B");
      expect(updatedAttempt.answers[QUESTION_ID]).toBe("A");
    });
  });

  describe("validation errors", () => {
    it("should throw ValidationError when attemptId is missing", async () => {
      const input = createValidInput();
      input.attemptId = "";

      await expect(useCase.execute(input)).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError when questionId is missing", async () => {
      const input = createValidInput();
      input.questionId = "";

      await expect(useCase.execute(input)).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError when optionIndex is missing", async () => {
      const input = createValidInput();
      input.optionIndex = "";

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
      const attempt = createInProgressAttempt();
      mockAttemptRepository.findById = mock(() => Promise.resolve(attempt));

      await expect(useCase.execute(input)).rejects.toThrow(ForbiddenError);
    });

    it("should throw ForbiddenError when attempt is already submitted", async () => {
      const input = createValidInput();
      const attempt = createSubmittedAttempt();
      mockAttemptRepository.findById = mock(() => Promise.resolve(attempt));

      await expect(useCase.execute(input)).rejects.toThrow(ForbiddenError);
    });

    it("should throw ForbiddenError for null userId trying to update owned attempt", async () => {
      const input = createValidInput();
      input.userId = null;
      const attempt = createInProgressAttempt();
      mockAttemptRepository.findById = mock(() => Promise.resolve(attempt));

      await expect(useCase.execute(input)).rejects.toThrow(ForbiddenError);
    });
  });

  describe("idempotency", () => {
    it("should be idempotent when saving same answer twice", async () => {
      const input = createValidInput();
      const attempt = createInProgressAttempt({ [QUESTION_ID]: "A" });
      mockAttemptRepository.findById = mock(() => Promise.resolve(attempt));

      // Should not throw, just overwrites with same value
      const result = await useCase.execute(input);

      expect(result.attempt).toBeDefined();
      expect(mockAttemptRepository.update).toHaveBeenCalled();
    });
  });
});
