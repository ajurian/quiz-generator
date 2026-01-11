import { describe, expect, it, beforeEach, mock } from "bun:test";
import {
  ShareQuizUseCase,
  type ShareQuizUseCaseDeps,
  type ShareQuizInput,
} from "@/application/features/quiz/share-quiz.use-case";
import { Quiz, QuizVisibility } from "@/domain";
import type { IQuizRepository } from "@/application/ports";
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from "@/application/errors";

describe("ShareQuizUseCase", () => {
  let useCase: ShareQuizUseCase;
  let mockQuizRepository: IQuizRepository;

  const QUIZ_ID = "019b2194-72a0-7000-a712-5e5bc5c313c1";
  const OWNER_ID = "018e3f5e-5f2a-7c2b-b3a4-9f8d6c4b2a10";
  const OTHER_USER_ID = "019b2194-72a0-7000-a712-5e5bc5c313c0";
  const NON_EXISTENT_QUIZ_ID = "019b2194-72a0-7000-a712-5e5bc5c313d0";

  const createMockQuiz = (
    visibility = QuizVisibility.PRIVATE,
    userId = OWNER_ID
  ): Quiz => {
    return Quiz.create({
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

    useCase = new ShareQuizUseCase({
      quizRepository: mockQuizRepository,
    });
  });

  describe("successful execution", () => {
    it("should make quiz unlisted and return slug", async () => {
      const input: ShareQuizInput = {
        quizId: QUIZ_ID,
        userId: OWNER_ID,
      };

      const result = await useCase.execute(input);

      // ShareQuiz defaults to UNLISTED visibility
      expect(result.quiz.visibility).toBe(QuizVisibility.UNLISTED);
      // API returns only slug
      expect(result.slug).toMatch(/^[A-Za-z0-9_-]{22}$/);
    });

    it("should call update on repository", async () => {
      const input: ShareQuizInput = {
        quizId: QUIZ_ID,
        userId: OWNER_ID,
      };

      await useCase.execute(input);

      expect(mockQuizRepository.update).toHaveBeenCalledTimes(1);
    });

    it("should not change visibility if already at target visibility", async () => {
      // Mock a quiz that's already UNLISTED (the default share visibility)
      mockQuizRepository.findById = mock(async () =>
        createMockQuiz(QuizVisibility.UNLISTED)
      );

      const input: ShareQuizInput = {
        quizId: QUIZ_ID,
        userId: OWNER_ID,
      };

      const result = await useCase.execute(input);

      // Already unlisted quiz stays unlisted
      expect(result.quiz.visibility).toBe(QuizVisibility.UNLISTED);
    });

    it("should return correct slug format", async () => {
      const input: ShareQuizInput = {
        quizId: QUIZ_ID,
        userId: OWNER_ID,
      };

      const result = await useCase.execute(input);

      expect(result.slug).toMatch(/^[A-Za-z0-9_-]{22}$/);
    });
  });

  describe("access control", () => {
    it("should throw ForbiddenError when non-owner tries to share", async () => {
      const input: ShareQuizInput = {
        quizId: QUIZ_ID,
        userId: OTHER_USER_ID,
      };

      await expect(useCase.execute(input)).rejects.toThrow(ForbiddenError);
    });
  });

  describe("error handling", () => {
    it("should throw NotFoundError when quiz does not exist", async () => {
      const input: ShareQuizInput = {
        quizId: NON_EXISTENT_QUIZ_ID,
        userId: OWNER_ID,
      };

      await expect(useCase.execute(input)).rejects.toThrow(NotFoundError);
    });

    it("should throw ValidationError for empty quizId", async () => {
      const input: ShareQuizInput = {
        quizId: "",
        userId: OWNER_ID,
      };

      await expect(useCase.execute(input)).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError for empty userId", async () => {
      const input: ShareQuizInput = {
        quizId: QUIZ_ID,
        userId: "",
      };

      await expect(useCase.execute(input)).rejects.toThrow(ValidationError);
    });
  });
});
