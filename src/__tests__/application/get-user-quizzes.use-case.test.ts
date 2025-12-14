import { describe, expect, it, beforeEach, mock } from "bun:test";
import {
  GetUserQuizzesUseCase,
  type GetUserQuizzesUseCaseDeps,
  type GetUserQuizzesInput,
} from "../../application/use-cases/get-user-quizzes.use-case";
import { Quiz } from "../../domain";
import type { IQuizRepository, PaginatedResult } from "../../application/ports";
import { ValidationError } from "../../application/errors";

describe("GetUserQuizzesUseCase", () => {
  let useCase: GetUserQuizzesUseCase;
  let mockQuizRepository: IQuizRepository;

  const createMockQuiz = (id: string, userId: string, title: string): Quiz => {
    return Quiz.create({
      id,
      userId,
      title,
      distribution: { singleBestAnswer: 5, twoStatements: 3, contextual: 2 },
      isPublic: false,
    });
  };

  beforeEach(() => {
    mockQuizRepository = {
      create: mock(async (quiz: Quiz) => quiz),
      findById: mock(async () => null),
      findByUserId: mock(async (userId: string, pagination) => {
        const quizzes = [
          createMockQuiz("quiz-1", userId, "Quiz 1"),
          createMockQuiz("quiz-2", userId, "Quiz 2"),
        ];
        return {
          data: quizzes,
          total: 2,
          page: pagination.page,
          limit: pagination.limit,
          totalPages: 1,
        } as PaginatedResult<Quiz>;
      }),
      update: mock(async (quiz: Quiz) => quiz),
      delete: mock(async () => {}),
      exists: mock(async () => false),
    };

    useCase = new GetUserQuizzesUseCase({
      quizRepository: mockQuizRepository,
    });
  });

  describe("successful execution", () => {
    it("should return paginated quizzes for a user", async () => {
      const input: GetUserQuizzesInput = {
        userId: "user-123",
      };

      const result = await useCase.execute(input);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it("should use default pagination when not provided", async () => {
      const input: GetUserQuizzesInput = {
        userId: "user-123",
      };

      await useCase.execute(input);

      expect(mockQuizRepository.findByUserId).toHaveBeenCalledWith("user-123", {
        page: 1,
        limit: 10,
      });
    });

    it("should use custom pagination when provided", async () => {
      const input: GetUserQuizzesInput = {
        userId: "user-123",
        pagination: { page: 2, limit: 20 },
      };

      await useCase.execute(input);

      expect(mockQuizRepository.findByUserId).toHaveBeenCalledWith("user-123", {
        page: 2,
        limit: 20,
      });
    });

    it("should transform quizzes to response DTOs", async () => {
      const input: GetUserQuizzesInput = {
        userId: "user-123",
      };

      const result = await useCase.execute(input);

      expect(result.data[0]).toHaveProperty("id");
      expect(result.data[0]).toHaveProperty("title");
      expect(result.data[0]).toHaveProperty("createdAt");
      expect(result.data[0]).toHaveProperty("totalQuestions");
      expect(result.data[0]).toHaveProperty("isPublic");
      expect(result.data[0]).toHaveProperty("distribution");
    });

    it("should include share links when baseUrl is provided and quiz is public", async () => {
      // Modify mock to return a public quiz
      mockQuizRepository.findByUserId = mock(
        async (userId: string, pagination) => {
          const quiz = Quiz.create({
            id: "quiz-1",
            userId,
            title: "Public Quiz",
            distribution: {
              singleBestAnswer: 5,
              twoStatements: 3,
              contextual: 2,
            },
            isPublic: true,
          });
          return {
            data: [quiz],
            total: 1,
            page: pagination.page,
            limit: pagination.limit,
            totalPages: 1,
          } as PaginatedResult<Quiz>;
        }
      );

      const input: GetUserQuizzesInput = {
        userId: "user-123",
      };

      const result = await useCase.execute(input, "https://example.com");

      expect(result.data[0]!.shareLink).toBe(
        "https://example.com/quiz/quiz-1/public"
      );
    });
  });

  describe("validation errors", () => {
    it("should throw ValidationError for missing userId", async () => {
      const input: GetUserQuizzesInput = {
        userId: "",
      };

      await expect(useCase.execute(input)).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError for invalid page number", async () => {
      const input: GetUserQuizzesInput = {
        userId: "user-123",
        pagination: { page: 0, limit: 10 },
      };

      await expect(useCase.execute(input)).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError for limit exceeding 100", async () => {
      const input: GetUserQuizzesInput = {
        userId: "user-123",
        pagination: { page: 1, limit: 101 },
      };

      await expect(useCase.execute(input)).rejects.toThrow(ValidationError);
    });
  });

  describe("empty results", () => {
    it("should return empty array when user has no quizzes", async () => {
      mockQuizRepository.findByUserId = mock(
        async (userId: string, pagination) => ({
          data: [],
          total: 0,
          page: pagination.page,
          limit: pagination.limit,
          totalPages: 0,
        })
      );

      const input: GetUserQuizzesInput = {
        userId: "user-with-no-quizzes",
      };

      const result = await useCase.execute(input);

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });
  });
});
