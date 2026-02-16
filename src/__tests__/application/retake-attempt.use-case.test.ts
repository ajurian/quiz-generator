import { describe, expect, it, beforeEach, mock } from "bun:test";
import {
  RetakeAttemptUseCase,
  type RetakeAttemptUseCaseDeps,
  type RetakeAttemptInput,
} from "@/application/features/attempt/retake-attempt.use-case";
import { QuizAttempt, AttemptStatus, Question, QuestionType } from "@/domain";
import type {
  IAttemptRepository,
  IQuestionRepository,
  IQuizRepository,
  IIdGenerator,
} from "@/application/ports";
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from "@/application/errors";
import { Quiz, QuizStatus, QuizVisibility } from "@/domain";

describe("RetakeAttemptUseCase", () => {
  let useCase: RetakeAttemptUseCase;
  let mockAttemptRepository: IAttemptRepository;
  let mockQuizRepository: IQuizRepository;
  let mockQuestionRepository: IQuestionRepository;
  let mockIdGenerator: IIdGenerator;

  const SOURCE_ATTEMPT_ID = "019b2194-72a0-7000-a712-5e5bc5c313c0";
  const NEW_ATTEMPT_ID = "019b2194-72a0-7000-a712-5e5bc5c313d0";
  const QUIZ_ID = "019b2194-72a0-7000-a712-5e5bc5c313c1";
  const QUIZ_SLUG = "AZshk0egcAAKcS5bxcMTwQ";
  const USER_ID = "018e3f5e-5f2a-7c2b-b3a4-9f8d6c4b2a10";
  const QUESTION_ID_1 = "019b2194-72a0-7000-a712-5e5bc5c313c2";
  const QUESTION_ID_2 = "019b2194-72a0-7000-a712-5e5bc5c313c3";
  const QUESTION_ID_3 = "019b2194-72a0-7000-a712-5e5bc5c313c4";

  const createValidInput = (): RetakeAttemptInput => ({
    sourceAttemptId: SOURCE_ATTEMPT_ID,
    quizSlug: QUIZ_SLUG,
    userId: USER_ID,
  });

  const createSubmittedAttempt = (
    answers: Record<string, string> = {
      [QUESTION_ID_1]: "A", // correct
      [QUESTION_ID_2]: "B", // wrong (correct is C)
      [QUESTION_ID_3]: "D", // wrong (correct is A)
    },
  ): QuizAttempt => {
    return QuizAttempt.reconstitute({
      id: SOURCE_ATTEMPT_ID,
      slug: "source-slug-test-12345",
      quizId: QUIZ_ID,
      userId: USER_ID,
      status: AttemptStatus.SUBMITTED,
      score: 33.33,
      durationMs: 60000,
      startedAt: new Date(Date.now() - 60000),
      submittedAt: new Date(),
      answers,
      parentAttemptId: null,
      lockedQuestionIds: [],
    });
  };

  const createInProgressAttempt = (): QuizAttempt => {
    return QuizAttempt.reconstitute({
      id: SOURCE_ATTEMPT_ID,
      slug: "source-slug-test-12345",
      quizId: QUIZ_ID,
      userId: USER_ID,
      status: AttemptStatus.IN_PROGRESS,
      score: null,
      durationMs: null,
      startedAt: new Date(),
      submittedAt: null,
      answers: {},
      parentAttemptId: null,
      lockedQuestionIds: [],
    });
  };

  const createQuiz = (): Quiz => {
    return Quiz.reconstitute({
      id: QUIZ_ID,
      slug: QUIZ_SLUG,
      userId: USER_ID,
      title: "Test Quiz",
      questionDistribution: 3, // encode({directQuestion:3, twoStatementCompound:0, contextual:0})
      visibility: QuizVisibility.PUBLIC,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: QuizStatus.READY,
      errorMessage: null,
    });
  };

  const createQuestions = (): Question[] => {
    return [
      Question.create({
        id: QUESTION_ID_1,
        quizId: QUIZ_ID,
        orderIndex: 0,
        type: QuestionType.DIRECT_QUESTION,
        stem: "Question 1",
        options: [
          { index: "A", text: "Option A", isCorrect: true },
          { index: "B", text: "Option B", isCorrect: false },
          { index: "C", text: "Option C", isCorrect: false },
          { index: "D", text: "Option D", isCorrect: false },
        ],
        correctExplanation: "A is correct",
        sourceQuotes: [],
        reference: 0,
      }),
      Question.create({
        id: QUESTION_ID_2,
        quizId: QUIZ_ID,
        orderIndex: 1,
        type: QuestionType.DIRECT_QUESTION,
        stem: "Question 2",
        options: [
          { index: "A", text: "Option A", isCorrect: false },
          { index: "B", text: "Option B", isCorrect: false },
          { index: "C", text: "Option C", isCorrect: true },
          { index: "D", text: "Option D", isCorrect: false },
        ],
        correctExplanation: "C is correct",
        sourceQuotes: [],
        reference: 0,
      }),
      Question.create({
        id: QUESTION_ID_3,
        quizId: QUIZ_ID,
        orderIndex: 2,
        type: QuestionType.DIRECT_QUESTION,
        stem: "Question 3",
        options: [
          { index: "A", text: "Option A", isCorrect: true },
          { index: "B", text: "Option B", isCorrect: false },
          { index: "C", text: "Option C", isCorrect: false },
          { index: "D", text: "Option D", isCorrect: false },
        ],
        correctExplanation: "A is correct",
        sourceQuotes: [],
        reference: 0,
      }),
    ];
  };

  beforeEach(() => {
    mockAttemptRepository = {
      create: mock((attempt: QuizAttempt) => Promise.resolve(attempt)),
      findById: mock(() => Promise.resolve(createSubmittedAttempt())),
      findBySlug: mock(() => Promise.resolve(null)),
      findByQuizAndUser: mock(() => Promise.resolve([])),
      findLatestAttemptPerQuizByUser: mock(() => Promise.resolve([])),
      findByQuizId: mock((_quizId, pagination) =>
        Promise.resolve({
          data: [],
          total: 0,
          page: pagination.page,
          limit: pagination.limit,
          totalPages: 0,
        }),
      ),
      findByUserId: mock((_userId, pagination) =>
        Promise.resolve({
          data: [],
          total: 0,
          page: pagination.page,
          limit: pagination.limit,
          totalPages: 0,
        }),
      ),
      findLastAttemptByQuizAndUser: mock(() => Promise.resolve(null)),
      countByQuizAndUser: mock(() => Promise.resolve(0)),
      update: mock((attempt: QuizAttempt) => Promise.resolve(attempt)),
      delete: mock(() => Promise.resolve()),
      exists: mock(() => Promise.resolve(true)),
      findInProgressByQuizAndUser: mock(() => Promise.resolve(null)),
      claimAnonymousAttempts: mock(() => Promise.resolve(0)),
    };

    mockQuizRepository = {
      create: mock(() => Promise.resolve(createQuiz())),
      findById: mock(() => Promise.resolve(createQuiz())),
      findBySlug: mock(() => Promise.resolve(createQuiz())),
      findByUserId: mock((_userId, pagination) =>
        Promise.resolve({
          data: [],
          total: 0,
          page: pagination.page,
          limit: pagination.limit,
          totalPages: 0,
        }),
      ),
      findPublic: mock((pagination) =>
        Promise.resolve({
          data: [],
          total: 0,
          page: pagination.page,
          limit: pagination.limit,
          totalPages: 0,
        }),
      ),
      update: mock(() => Promise.resolve(createQuiz())),
      delete: mock(() => Promise.resolve()),
      exists: mock(() => Promise.resolve(true)),
      findByIds: mock(() => Promise.resolve([])),
      slugExists: mock(() => Promise.resolve(false)),
    };

    mockQuestionRepository = {
      createBulk: mock(() => Promise.resolve(createQuestions())),
      findByQuizId: mock(() => Promise.resolve(createQuestions())),
      deleteByQuizId: mock(() => Promise.resolve()),
    };

    mockIdGenerator = {
      generate: mock(() => NEW_ATTEMPT_ID),
    };

    const deps: RetakeAttemptUseCaseDeps = {
      attemptRepository: mockAttemptRepository,
      quizRepository: mockQuizRepository,
      questionRepository: mockQuestionRepository,
      idGenerator: mockIdGenerator,
    };

    useCase = new RetakeAttemptUseCase(deps);
  });

  describe("successful retake", () => {
    it("should create new attempt with only correct answers pre-filled", async () => {
      const input = createValidInput();

      const result = await useCase.execute(input);

      expect(result.attempt).toBeDefined();
      expect(result.attempt.status).toBe(AttemptStatus.IN_PROGRESS);
      expect(result.attempt.parentAttemptId).toBe(SOURCE_ATTEMPT_ID);
      expect(result.isResumed).toBe(false);

      // Only Q1 was answered correctly (A), Q2 and Q3 were wrong
      expect(result.attempt.answers).toEqual({
        [QUESTION_ID_1]: "A",
      });
    });

    it("should resume existing in-progress retake instead of creating a new one", async () => {
      const existingRetake = QuizAttempt.reconstitute({
        id: NEW_ATTEMPT_ID,
        slug: "existing-retake-slug12",
        quizId: QUIZ_ID,
        userId: USER_ID,
        status: AttemptStatus.IN_PROGRESS,
        score: null,
        durationMs: null,
        startedAt: new Date(),
        submittedAt: null,
        answers: { [QUESTION_ID_1]: "A" },
        parentAttemptId: SOURCE_ATTEMPT_ID,
        lockedQuestionIds: [QUESTION_ID_1],
      });
      mockAttemptRepository.findInProgressByQuizAndUser = mock(() =>
        Promise.resolve(existingRetake),
      );

      const input = createValidInput();
      const result = await useCase.execute(input);

      expect(result.isResumed).toBe(true);
      expect(result.attempt.id).toBe(NEW_ATTEMPT_ID);
      expect(result.attempt.parentAttemptId).toBe(SOURCE_ATTEMPT_ID);
      // Should NOT create a new attempt
      expect(mockAttemptRepository.create).not.toHaveBeenCalled();
      // Should NOT generate a new ID
      expect(mockIdGenerator.generate).not.toHaveBeenCalled();
    });

    it("should not check for existing retake when user is anonymous", async () => {
      const anonymousAttempt = QuizAttempt.reconstitute({
        id: SOURCE_ATTEMPT_ID,
        slug: "source-slug-test-12345",
        quizId: QUIZ_ID,
        userId: null,
        status: AttemptStatus.SUBMITTED,
        score: 33.33,
        durationMs: 60000,
        startedAt: new Date(Date.now() - 60000),
        submittedAt: new Date(),
        answers: {
          [QUESTION_ID_1]: "A",
          [QUESTION_ID_2]: "B",
          [QUESTION_ID_3]: "D",
        },
        parentAttemptId: null,
        lockedQuestionIds: [],
      });
      mockAttemptRepository.findById = mock(() =>
        Promise.resolve(anonymousAttempt),
      );

      const input = createValidInput();
      input.userId = null;

      const result = await useCase.execute(input);

      expect(result.isResumed).toBe(false);
      // findInProgressByQuizAndUser should not be called for anonymous users
      expect(
        mockAttemptRepository.findInProgressByQuizAndUser,
      ).not.toHaveBeenCalled();
      expect(mockAttemptRepository.create).toHaveBeenCalledTimes(1);
    });

    it("should set lockedQuestionIds for correct answers", async () => {
      const input = createValidInput();

      const result = await useCase.execute(input);

      expect(result.attempt.lockedQuestionIds).toEqual([QUESTION_ID_1]);
    });

    it("should create new attempt via repository", async () => {
      const input = createValidInput();

      await useCase.execute(input);

      expect(mockAttemptRepository.create).toHaveBeenCalledTimes(1);
      const createMock = mockAttemptRepository.create as ReturnType<
        typeof mock
      >;
      const createdAttempt = createMock.mock.calls[0]![0] as QuizAttempt;
      expect(createdAttempt.id).toBe(NEW_ATTEMPT_ID);
      expect(createdAttempt.quizId).toBe(QUIZ_ID);
      expect(createdAttempt.userId).toBe(USER_ID);
    });

    it("should generate new ID for the retake attempt", async () => {
      const input = createValidInput();

      await useCase.execute(input);

      expect(mockIdGenerator.generate).toHaveBeenCalledTimes(1);
    });

    it("should have new attempt ID different from source", async () => {
      const input = createValidInput();

      const result = await useCase.execute(input);

      expect(result.attempt.id).toBe(NEW_ATTEMPT_ID);
      expect(result.attempt.id).not.toBe(SOURCE_ATTEMPT_ID);
    });
  });

  describe("edge cases", () => {
    it("should handle all answers correct (all pre-filled, all locked)", async () => {
      const allCorrectAnswers = {
        [QUESTION_ID_1]: "A", // correct
        [QUESTION_ID_2]: "C", // correct
        [QUESTION_ID_3]: "A", // correct
      };
      mockAttemptRepository.findById = mock(() =>
        Promise.resolve(createSubmittedAttempt(allCorrectAnswers)),
      );

      const result = await useCase.execute(createValidInput());

      expect(result.attempt.answers).toEqual(allCorrectAnswers);
      expect(result.attempt.lockedQuestionIds).toEqual([
        QUESTION_ID_1,
        QUESTION_ID_2,
        QUESTION_ID_3,
      ]);
    });

    it("should handle all answers wrong (empty answers, no locked)", async () => {
      const allWrongAnswers = {
        [QUESTION_ID_1]: "B", // wrong
        [QUESTION_ID_2]: "A", // wrong
        [QUESTION_ID_3]: "D", // wrong
      };
      mockAttemptRepository.findById = mock(() =>
        Promise.resolve(createSubmittedAttempt(allWrongAnswers)),
      );

      const result = await useCase.execute(createValidInput());

      expect(result.attempt.answers).toEqual({});
      expect(result.attempt.lockedQuestionIds).toEqual([]);
    });

    it("should treat unanswered questions as wrong (not carried over)", async () => {
      // Only Q1 answered (correct), Q2 and Q3 unanswered
      const partialAnswers = {
        [QUESTION_ID_1]: "A", // correct
      };
      mockAttemptRepository.findById = mock(() =>
        Promise.resolve(createSubmittedAttempt(partialAnswers)),
      );

      const result = await useCase.execute(createValidInput());

      expect(result.attempt.answers).toEqual({
        [QUESTION_ID_1]: "A",
      });
      expect(result.attempt.lockedQuestionIds).toEqual([QUESTION_ID_1]);
    });

    it("should set score to null on the new retake attempt", async () => {
      const result = await useCase.execute(createValidInput());

      expect(result.attempt.score).toBeNull();
    });

    it("should set status to IN_PROGRESS on the new retake attempt", async () => {
      const result = await useCase.execute(createValidInput());

      expect(result.attempt.status).toBe(AttemptStatus.IN_PROGRESS);
    });
  });

  describe("validation errors", () => {
    it("should throw ValidationError when sourceAttemptId is missing", async () => {
      const input = createValidInput();
      input.sourceAttemptId = "";

      await expect(useCase.execute(input)).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError when quizSlug is missing", async () => {
      const input = createValidInput();
      input.quizSlug = "";

      await expect(useCase.execute(input)).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError when source attempt is from a different quiz", async () => {
      const differentQuizAttempt = QuizAttempt.reconstitute({
        id: SOURCE_ATTEMPT_ID,
        slug: "source-slug-test-12345",
        quizId: "019b2194-72a0-7000-a712-999999999999", // different quiz
        userId: USER_ID,
        status: AttemptStatus.SUBMITTED,
        score: 50,
        durationMs: 60000,
        startedAt: new Date(Date.now() - 60000),
        submittedAt: new Date(),
        answers: { [QUESTION_ID_1]: "A" },
        parentAttemptId: null,
        lockedQuestionIds: [],
      });
      mockAttemptRepository.findById = mock(() =>
        Promise.resolve(differentQuizAttempt),
      );

      await expect(useCase.execute(createValidInput())).rejects.toThrow(
        ValidationError,
      );
    });
  });

  describe("not found errors", () => {
    it("should throw NotFoundError when source attempt does not exist", async () => {
      mockAttemptRepository.findById = mock(() => Promise.resolve(null));

      await expect(useCase.execute(createValidInput())).rejects.toThrow(
        NotFoundError,
      );
    });

    it("should throw NotFoundError when quiz does not exist", async () => {
      mockQuizRepository.findBySlug = mock(() => Promise.resolve(null));

      await expect(useCase.execute(createValidInput())).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("forbidden errors", () => {
    it("should throw ForbiddenError when source attempt is not SUBMITTED", async () => {
      mockAttemptRepository.findById = mock(() =>
        Promise.resolve(createInProgressAttempt()),
      );

      await expect(useCase.execute(createValidInput())).rejects.toThrow(
        ForbiddenError,
      );
    });

    it("should throw ForbiddenError when user does not own the source attempt", async () => {
      const otherUserAttempt = QuizAttempt.reconstitute({
        id: SOURCE_ATTEMPT_ID,
        slug: "source-slug-test-12345",
        quizId: QUIZ_ID,
        userId: "019b2194-72a0-7000-a712-different0001",
        status: AttemptStatus.SUBMITTED,
        score: 50,
        durationMs: 60000,
        startedAt: new Date(Date.now() - 60000),
        submittedAt: new Date(),
        answers: { [QUESTION_ID_1]: "A" },
        parentAttemptId: null,
        lockedQuestionIds: [],
      });
      mockAttemptRepository.findById = mock(() =>
        Promise.resolve(otherUserAttempt),
      );

      await expect(useCase.execute(createValidInput())).rejects.toThrow(
        ForbiddenError,
      );
    });

    it("should allow anonymous user to retake anonymous attempt", async () => {
      const anonymousAttempt = QuizAttempt.reconstitute({
        id: SOURCE_ATTEMPT_ID,
        slug: "source-slug-test-12345",
        quizId: QUIZ_ID,
        userId: null,
        status: AttemptStatus.SUBMITTED,
        score: 50,
        durationMs: 60000,
        startedAt: new Date(Date.now() - 60000),
        submittedAt: new Date(),
        answers: { [QUESTION_ID_1]: "A" },
        parentAttemptId: null,
        lockedQuestionIds: [],
      });
      mockAttemptRepository.findById = mock(() =>
        Promise.resolve(anonymousAttempt),
      );

      const input = createValidInput();
      input.userId = null;

      const result = await useCase.execute(input);
      expect(result.attempt).toBeDefined();
    });
  });
});
