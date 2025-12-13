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

  const createMockQuiz = (isPublic = false, userId = "owner-123"): Quiz => {
    return Quiz.create({
      id: "quiz-123",
      userId,
      title: "Test Quiz",
      distribution: { singleBestAnswer: 5, twoStatements: 3, situational: 2 },
      isPublic,
    });
  };

  beforeEach(() => {
    mockQuizRepository = {
      create: mock(async (quiz: Quiz) => quiz),
      findById: mock(async (id: string) => {
        if (id === "quiz-123") {
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
        quizId: "quiz-123",
        userId: "owner-123",
      };

      const result = await useCase.execute(input, "https://example.com");

      expect(result.quiz.isPublic).toBe(true);
      expect(result.shareLink).toBe("https://example.com/quiz/quiz-123/public");
    });

    it("should call update on repository", async () => {
      const input: ShareQuizInput = {
        quizId: "quiz-123",
        userId: "owner-123",
      };

      await useCase.execute(input, "https://example.com");

      expect(mockQuizRepository.update).toHaveBeenCalledTimes(1);
    });

    it("should not change already public quiz", async () => {
      mockQuizRepository.findById = mock(async () => createMockQuiz(true));

      const input: ShareQuizInput = {
        quizId: "quiz-123",
        userId: "owner-123",
      };

      const result = await useCase.execute(input, "https://example.com");

      expect(result.quiz.isPublic).toBe(true);
    });

    it("should return correct share link format", async () => {
      const input: ShareQuizInput = {
        quizId: "quiz-123",
        userId: "owner-123",
      };

      const result = await useCase.execute(input, "https://my-app.example.com");

      expect(result.shareLink).toBe(
        "https://my-app.example.com/quiz/quiz-123/public"
      );
    });
  });

  describe("access control", () => {
    it("should throw ForbiddenError when non-owner tries to share", async () => {
      const input: ShareQuizInput = {
        quizId: "quiz-123",
        userId: "other-user-456",
      };

      await expect(
        useCase.execute(input, "https://example.com")
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("error handling", () => {
    it("should throw NotFoundError when quiz does not exist", async () => {
      const input: ShareQuizInput = {
        quizId: "non-existent-quiz",
        userId: "user-123",
      };

      await expect(
        useCase.execute(input, "https://example.com")
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw ValidationError for empty quizId", async () => {
      const input: ShareQuizInput = {
        quizId: "",
        userId: "user-123",
      };

      await expect(
        useCase.execute(input, "https://example.com")
      ).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError for empty userId", async () => {
      const input: ShareQuizInput = {
        quizId: "quiz-123",
        userId: "",
      };

      await expect(
        useCase.execute(input, "https://example.com")
      ).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError for empty baseUrl", async () => {
      const input: ShareQuizInput = {
        quizId: "quiz-123",
        userId: "owner-123",
      };

      await expect(useCase.execute(input, "")).rejects.toThrow(ValidationError);
    });
  });
});
