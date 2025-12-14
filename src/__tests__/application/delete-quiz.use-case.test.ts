import { describe, expect, it, beforeEach, mock } from "bun:test";
import {
  DeleteQuizUseCase,
  type DeleteQuizUseCaseDeps,
  type DeleteQuizInput,
} from "../../application/use-cases/delete-quiz.use-case";
import { Quiz, Question, QuestionType } from "../../domain";
import type {
  IQuizRepository,
  IQuestionRepository,
} from "../../application/ports";
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from "../../application/errors";

describe("DeleteQuizUseCase", () => {
  let useCase: DeleteQuizUseCase;
  let mockQuizRepository: IQuizRepository;
  let mockQuestionRepository: IQuestionRepository;

  const createMockQuiz = (userId = "owner-123"): Quiz => {
    return Quiz.create({
      id: "quiz-123",
      userId,
      title: "Test Quiz",
      distribution: { singleBestAnswer: 5, twoStatements: 3, contextual: 2 },
      isPublic: false,
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

    mockQuestionRepository = {
      createBulk: mock(async (questions: Question[]) => questions),
      findByQuizId: mock(async () => []),
      deleteByQuizId: mock(async () => {}),
    };

    useCase = new DeleteQuizUseCase({
      quizRepository: mockQuizRepository,
      questionRepository: mockQuestionRepository,
    });
  });

  describe("successful execution", () => {
    it("should delete quiz when owner requests", async () => {
      const input: DeleteQuizInput = {
        quizId: "quiz-123",
        userId: "owner-123",
      };

      await useCase.execute(input);

      expect(mockQuizRepository.delete).toHaveBeenCalledWith("quiz-123");
    });

    it("should verify ownership before deletion", async () => {
      const input: DeleteQuizInput = {
        quizId: "quiz-123",
        userId: "owner-123",
      };

      await useCase.execute(input);

      expect(mockQuizRepository.findById).toHaveBeenCalledWith("quiz-123");
    });
  });

  describe("access control", () => {
    it("should throw ForbiddenError when non-owner tries to delete", async () => {
      const input: DeleteQuizInput = {
        quizId: "quiz-123",
        userId: "other-user-456",
      };

      await expect(useCase.execute(input)).rejects.toThrow(ForbiddenError);
    });

    it("should not delete quiz when forbidden", async () => {
      const input: DeleteQuizInput = {
        quizId: "quiz-123",
        userId: "other-user-456",
      };

      await expect(useCase.execute(input)).rejects.toThrow();
      expect(mockQuizRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should throw NotFoundError when quiz does not exist", async () => {
      const input: DeleteQuizInput = {
        quizId: "non-existent-quiz",
        userId: "user-123",
      };

      await expect(useCase.execute(input)).rejects.toThrow(NotFoundError);
    });

    it("should throw ValidationError for empty quizId", async () => {
      const input: DeleteQuizInput = {
        quizId: "",
        userId: "user-123",
      };

      await expect(useCase.execute(input)).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError for empty userId", async () => {
      const input: DeleteQuizInput = {
        quizId: "quiz-123",
        userId: "",
      };

      await expect(useCase.execute(input)).rejects.toThrow(ValidationError);
    });
  });
});
