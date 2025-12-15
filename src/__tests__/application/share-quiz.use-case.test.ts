import { describe, expect, it, beforeEach, mock } from "bun:test";
import {
  ShareQuizUseCase,
  type ShareQuizUseCaseDeps,
  type ShareQuizInput,
} from "../../application/use-cases/share-quiz.use-case";
import { Quiz } from "../../domain";
import type { IQuizRepository } from "../../application/ports";
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from "../../application/errors";

describe("ShareQuizUseCase", () => {
  let useCase: ShareQuizUseCase;
  let mockQuizRepository: IQuizRepository;

  const QUIZ_ID = "019b2194-72a0-7000-a712-5e5bc5c313c1";
  const OWNER_ID = "018e3f5e-5f2a-7c2b-b3a4-9f8d6c4b2a10";
  const OTHER_USER_ID = "019b2194-72a0-7000-a712-5e5bc5c313c0";
  const NON_EXISTENT_QUIZ_ID = "019b2194-72a0-7000-a712-5e5bc5c313d0";

  const createMockQuiz = (isPublic = false, userId = OWNER_ID): Quiz => {
    return Quiz.create({
      id: QUIZ_ID,
      userId,
      title: "Test Quiz",
      distribution: { singleBestAnswer: 5, twoStatements: 3, contextual: 2 },
      isPublic,
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
    };

    useCase = new ShareQuizUseCase({
      quizRepository: mockQuizRepository,
    });
  });

  describe("successful execution", () => {
    it("should make quiz public and return share link", async () => {
      const input: ShareQuizInput = {
        quizId: QUIZ_ID,
        userId: OWNER_ID,
      };

      const result = await useCase.execute(input, "https://example.com");

      expect(result.quiz.isPublic).toBe(true);
      expect(result.shareLink).toBe(
        `https://example.com/quiz/${QUIZ_ID}/public`
      );
    });

    it("should call update on repository", async () => {
      const input: ShareQuizInput = {
        quizId: QUIZ_ID,
        userId: OWNER_ID,
      };

      await useCase.execute(input, "https://example.com");

      expect(mockQuizRepository.update).toHaveBeenCalledTimes(1);
    });

    it("should not change already public quiz", async () => {
      mockQuizRepository.findById = mock(async () => createMockQuiz(true));

      const input: ShareQuizInput = {
        quizId: QUIZ_ID,
        userId: OWNER_ID,
      };

      const result = await useCase.execute(input, "https://example.com");

      expect(result.quiz.isPublic).toBe(true);
    });

    it("should return correct share link format", async () => {
      const input: ShareQuizInput = {
        quizId: QUIZ_ID,
        userId: OWNER_ID,
      };

      const result = await useCase.execute(input, "https://my-app.example.com");

      expect(result.shareLink).toBe(
        `https://my-app.example.com/quiz/${QUIZ_ID}/public`
      );
    });
  });

  describe("access control", () => {
    it("should throw ForbiddenError when non-owner tries to share", async () => {
      const input: ShareQuizInput = {
        quizId: QUIZ_ID,
        userId: OTHER_USER_ID,
      };

      await expect(
        useCase.execute(input, "https://example.com")
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("error handling", () => {
    it("should throw NotFoundError when quiz does not exist", async () => {
      const input: ShareQuizInput = {
        quizId: NON_EXISTENT_QUIZ_ID,
        userId: OWNER_ID,
      };

      await expect(
        useCase.execute(input, "https://example.com")
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw ValidationError for empty quizId", async () => {
      const input: ShareQuizInput = {
        quizId: "",
        userId: OWNER_ID,
      };

      await expect(
        useCase.execute(input, "https://example.com")
      ).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError for empty userId", async () => {
      const input: ShareQuizInput = {
        quizId: QUIZ_ID,
        userId: "",
      };

      await expect(
        useCase.execute(input, "https://example.com")
      ).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError for empty baseUrl", async () => {
      const input: ShareQuizInput = {
        quizId: QUIZ_ID,
        userId: OWNER_ID,
      };

      await expect(useCase.execute(input, "")).rejects.toThrow(ValidationError);
    });
  });
});
