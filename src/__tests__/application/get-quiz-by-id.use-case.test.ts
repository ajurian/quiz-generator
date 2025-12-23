import { describe, expect, it, beforeEach, mock } from "bun:test";
import {
  GetQuizByIdUseCase,
  type GetQuizByIdUseCaseDeps,
  type GetQuizByIdInput,
} from "../../application/use-cases/get-quiz-by-id.use-case";
import {
  Quiz,
  Question,
  QuestionType,
  QuestionOption,
  QuizVisibility,
} from "../../domain";
import type {
  IQuizRepository,
  IQuestionRepository,
} from "../../application/ports";
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from "../../application/errors";

describe("GetQuizByIdUseCase", () => {
  let useCase: GetQuizByIdUseCase;
  let mockQuizRepository: IQuizRepository;
  let mockQuestionRepository: IQuestionRepository;

  const QUIZ_ID = "019b2194-72a0-7000-a712-5e5bc5c313c1";
  const OWNER_ID = "018e3f5e-5f2a-7c2b-b3a4-9f8d6c4b2a10";
  const OTHER_USER_ID = "019b2194-72a0-7000-a712-5e5bc5c313c0";
  const NON_EXISTENT_QUIZ_ID = "019b2194-72a0-7000-a712-5e5bc5c313d0";
  const QUESTION_ID = "019b2194-72a0-7000-a712-5e5bc5c313c2";

  const createMockQuiz = (
    visibility = QuizVisibility.PRIVATE,
    userId = OWNER_ID
  ): Quiz => {
    const quiz = Quiz.create({
      id: QUIZ_ID,
      userId,
      title: "Test Quiz",
      distribution: {
        directQuestion: 5,
        twoStatementCompound: 3,
        contextual: 2,
      },
      visibility,
    });
    return quiz;
  };

  const createMockQuestions = (quizId: string): Question[] => {
    return [
      Question.create({
        id: QUESTION_ID,
        quizId,
        orderIndex: 0,
        type: QuestionType.DIRECT_QUESTION,
        stem: "What is 2+2?",
        options: [
          { index: "A", text: "3", explanation: "Incorrect", isCorrect: false },
          { index: "B", text: "4", explanation: "Correct", isCorrect: true },
          { index: "C", text: "5", explanation: "Incorrect", isCorrect: false },
          { index: "D", text: "6", explanation: "Incorrect", isCorrect: false },
        ],
      }),
    ];
  };

  beforeEach(() => {
    mockQuizRepository = {
      create: mock(async (quiz: Quiz) => quiz),
      findById: mock(async (id: string) => {
        if (id === QUIZ_ID) {
          return createMockQuiz();
        }
        return null;
      }),
      findByUserId: mock(async () => ({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      })),
      update: mock(async (quiz: Quiz) => quiz),
      delete: mock(async () => {}),
      exists: mock(async () => false),
      findBySlug: mock(async () => null),
      findPublic: mock(async () => ({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      })),
      slugExists: mock(async () => false),
      findByIds: mock(async () => []),
    };

    mockQuestionRepository = {
      createBulk: mock(async (questions: Question[]) => questions),
      findByQuizId: mock(async (quizId: string) => createMockQuestions(quizId)),
      deleteByQuizId: mock(async () => {}),
    };

    useCase = new GetQuizByIdUseCase({
      quizRepository: mockQuizRepository,
      questionRepository: mockQuestionRepository,
    });
  });

  describe("successful execution", () => {
    it("should return quiz with questions when owner accesses", async () => {
      const input: GetQuizByIdInput = {
        quizId: QUIZ_ID,
        userId: OWNER_ID,
      };

      const result = await useCase.execute(input);

      expect(result.quiz.id).toBe(QUIZ_ID);
      expect(result.quiz.title).toBe("Test Quiz");
      expect(result.questions).toHaveLength(1);
      expect(result.questions[0]!.stem).toBe("What is 2+2?");
    });

    it("should return public quiz without authentication", async () => {
      mockQuizRepository.findById = mock(async () =>
        createMockQuiz(QuizVisibility.PUBLIC)
      );

      const input: GetQuizByIdInput = {
        quizId: QUIZ_ID,
        userId: null,
      };

      const result = await useCase.execute(input);

      expect(result.quiz.id).toBe(QUIZ_ID);
      expect(result.quiz.visibility).toBe(QuizVisibility.PUBLIC);
    });

    it("should return public quiz to any user", async () => {
      mockQuizRepository.findById = mock(async () =>
        createMockQuiz(QuizVisibility.PUBLIC)
      );

      const input: GetQuizByIdInput = {
        quizId: QUIZ_ID,
        userId: OTHER_USER_ID,
      };

      const result = await useCase.execute(input);

      expect(result.quiz.id).toBe(QUIZ_ID);
    });

    it("should transform questions to response DTOs", async () => {
      const input: GetQuizByIdInput = {
        quizId: QUIZ_ID,
        userId: OWNER_ID,
      };

      const result = await useCase.execute(input);

      expect(result.questions[0]).toHaveProperty("id");
      expect(result.questions[0]).toHaveProperty("quizId");
      expect(result.questions[0]).toHaveProperty("stem");
      expect(result.questions[0]).toHaveProperty("type");
      expect(result.questions[0]).toHaveProperty("options");
      expect(result.questions[0]).toHaveProperty("orderIndex");
    });

    it("should include share link for public quiz with baseUrl", async () => {
      mockQuizRepository.findById = mock(async () =>
        createMockQuiz(QuizVisibility.PUBLIC)
      );

      const input: GetQuizByIdInput = {
        quizId: QUIZ_ID,
        userId: OWNER_ID,
      };

      const result = await useCase.execute(input, "https://example.com");

      // Share link uses slug format: /quiz/a/{slug}
      expect(result.quiz.shareLink).toMatch(
        /^https:\/\/example\.com\/quiz\/a\/[A-Za-z0-9_-]{22}$/
      );
    });
  });

  describe("access control", () => {
    it("should throw NotFoundError when non-owner accesses private quiz (prevents existence leak)", async () => {
      const input: GetQuizByIdInput = {
        quizId: QUIZ_ID,
        userId: OTHER_USER_ID,
      };

      // NotFoundError is returned instead of ForbiddenError to prevent leaking quiz existence
      await expect(useCase.execute(input)).rejects.toThrow(NotFoundError);
    });

    it("should throw NotFoundError when unauthenticated user accesses private quiz (prevents existence leak)", async () => {
      const input: GetQuizByIdInput = {
        quizId: QUIZ_ID,
        userId: null,
      };

      // NotFoundError is returned instead of ForbiddenError to prevent leaking quiz existence
      await expect(useCase.execute(input)).rejects.toThrow(NotFoundError);
    });
  });

  describe("error handling", () => {
    it("should throw NotFoundError when quiz does not exist", async () => {
      const input: GetQuizByIdInput = {
        quizId: NON_EXISTENT_QUIZ_ID,
        userId: OWNER_ID,
      };

      await expect(useCase.execute(input)).rejects.toThrow(NotFoundError);
    });

    it("should throw ValidationError for empty quizId", async () => {
      const input: GetQuizByIdInput = {
        quizId: "",
        userId: OWNER_ID,
      };

      await expect(useCase.execute(input)).rejects.toThrow(ValidationError);
    });
  });
});
