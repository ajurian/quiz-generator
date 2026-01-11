import { describe, expect, it, beforeEach, mock } from "bun:test";
import {
  DeleteQuizUseCase,
  type DeleteQuizUseCaseDeps,
  type DeleteQuizInput,
} from "@/application/features/quiz/delete-quiz.use-case";
import { Quiz, Question, QuestionType, QuizVisibility } from "@/domain";
import type {
  IQuizRepository,
  IQuestionRepository,
  ISourceMaterialRepository,
  IS3StorageService,
} from "@/application/ports";
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from "@/application/errors";

describe("DeleteQuizUseCase", () => {
  let useCase: DeleteQuizUseCase;
  let mockQuizRepository: IQuizRepository;
  let mockQuestionRepository: IQuestionRepository;
  let mockSourceMaterialRepository: ISourceMaterialRepository;
  let mockS3Storage: IS3StorageService;

  const QUIZ_ID = "019b2194-72a0-7000-a712-5e5bc5c313c1";
  const OWNER_ID = "018e3f5e-5f2a-7c2b-b3a4-9f8d6c4b2a10";
  const OTHER_USER_ID = "019b2194-72a0-7000-a712-5e5bc5c313c0";
  const NON_EXISTENT_QUIZ_ID = "019b2194-72a0-7000-a712-5e5bc5c313d0";

  const createMockQuiz = (userId = OWNER_ID): Quiz => {
    return Quiz.create({
      id: QUIZ_ID,
      userId,
      title: "Test Quiz",
      distribution: {
        directQuestion: 5,
        twoStatementCompound: 3,
        contextual: 2,
      },
      visibility: QuizVisibility.PRIVATE,
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

    mockQuestionRepository = {
      createBulk: mock(async (questions: Question[]) => questions),
      findByQuizId: mock(async () => []),
      deleteByQuizId: mock(async () => {}),
    };

    mockSourceMaterialRepository = {
      createBulk: mock(async (materials) => materials),
      findByQuizId: mock(async () => []),
      deleteByQuizId: mock(async () => {}),
    };

    mockS3Storage = {
      generatePresignedPutUrls: mock(async () => []),
      generatePresignedGetUrl: mock(async () => ""),
      getObject: mock(async () => ({
        content: new Uint8Array(),
        contentType: "application/octet-stream",
      })),
      deleteObjects: mock(async () => {}),
    };

    useCase = new DeleteQuizUseCase({
      quizRepository: mockQuizRepository,
      questionRepository: mockQuestionRepository,
      sourceMaterialRepository: mockSourceMaterialRepository,
      s3Storage: mockS3Storage,
    });
  });

  describe("successful execution", () => {
    it("should delete quiz when owner requests", async () => {
      const input: DeleteQuizInput = {
        quizId: QUIZ_ID,
        userId: OWNER_ID,
      };

      await useCase.execute(input);

      expect(mockQuizRepository.delete).toHaveBeenCalledWith(QUIZ_ID);
    });

    it("should verify ownership before deletion", async () => {
      const input: DeleteQuizInput = {
        quizId: QUIZ_ID,
        userId: OWNER_ID,
      };

      await useCase.execute(input);

      expect(mockQuizRepository.findById).toHaveBeenCalledWith(QUIZ_ID);
    });
  });

  describe("access control", () => {
    it("should throw ForbiddenError when non-owner tries to delete", async () => {
      const input: DeleteQuizInput = {
        quizId: QUIZ_ID,
        userId: OTHER_USER_ID,
      };

      await expect(useCase.execute(input)).rejects.toThrow(ForbiddenError);
    });

    it("should not delete quiz when forbidden", async () => {
      const input: DeleteQuizInput = {
        quizId: QUIZ_ID,
        userId: OTHER_USER_ID,
      };

      await expect(useCase.execute(input)).rejects.toThrow();
      expect(mockQuizRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should throw NotFoundError when quiz does not exist", async () => {
      const input: DeleteQuizInput = {
        quizId: NON_EXISTENT_QUIZ_ID,
        userId: OWNER_ID,
      };

      await expect(useCase.execute(input)).rejects.toThrow(NotFoundError);
    });

    it("should throw ValidationError for empty quizId", async () => {
      const input: DeleteQuizInput = {
        quizId: "",
        userId: OWNER_ID,
      };

      await expect(useCase.execute(input)).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError for empty userId", async () => {
      const input: DeleteQuizInput = {
        quizId: QUIZ_ID,
        userId: "",
      };

      await expect(useCase.execute(input)).rejects.toThrow(ValidationError);
    });
  });
});
