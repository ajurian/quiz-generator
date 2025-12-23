import { describe, expect, it, beforeEach, mock } from "bun:test";
import {
  CreateQuizUseCase,
  type CreateQuizUseCaseDeps,
  type CreateQuizUseCaseInput,
} from "../../application/use-cases/create-quiz.use-case";
import {
  Quiz,
  Question,
  QuestionType,
  GeminiModel,
  QuizVisibility,
} from "../../domain";
import type {
  IQuizRepository,
  IQuestionRepository,
  IAIQuizGenerator,
  IFileStorageService,
  IIdGenerator,
  FileMetadata,
} from "../../application/ports";
import {
  ValidationError,
  ExternalServiceError,
  QuotaExceededError,
} from "../../application/errors";
import { randomUUIDv7 } from "bun";

describe("CreateQuizUseCase", () => {
  let useCase: CreateQuizUseCase;
  let mockQuizRepository: IQuizRepository;
  let mockQuestionRepository: IQuestionRepository;
  let mockAiGenerator: IAIQuizGenerator;
  let mockFileStorage: IFileStorageService;
  let mockIdGenerator: IIdGenerator;

  const FILE_ID = "019b2194-72a0-7000-a712-5e5bc5c313c0";
  const QUIZ_ID = "019b2194-72a0-7000-a712-5e5bc5c313c1";
  const QUESTION_ID = "019b2194-72a0-7000-a712-5e5bc5c313c2";

  const createValidInput = (): CreateQuizUseCaseInput => ({
    userId: "018e3f5e-5f2a-7c2b-b3a4-9f8d6c4b2a10",
    title: "Test Quiz",
    distribution: {
      directQuestion: 5,
      twoStatementCompound: 3,
      contextual: 2,
    },
    visibility: QuizVisibility.PRIVATE,
    files: [new File(["content"], "test.pdf", { type: "application/pdf" })],
  });

  const createMockFileMetadata = (): FileMetadata[] => [
    {
      id: FILE_ID,
      name: "test.pdf",
      mimeType: "application/pdf",
      uri: "gs://bucket/test.pdf",
      sizeBytes: 1024,
    },
  ];

  const createMockGeneratedQuestions = () => [
    {
      orderIndex: 0,
      type: QuestionType.DIRECT_QUESTION,
      stem: "What is the capital of France?",
      options: [
        {
          index: "A" as const,
          text: "Paris",
          explanation: "Paris is the capital of France",
          isCorrect: true,
        },
        {
          index: "B" as const,
          text: "London",
          explanation: "London is the capital of UK",
          isCorrect: false,
        },
        {
          index: "C" as const,
          text: "Berlin",
          explanation: "Berlin is the capital of Germany",
          isCorrect: false,
        },
        {
          index: "D" as const,
          text: "Madrid",
          explanation: "Madrid is the capital of Spain",
          isCorrect: false,
        },
      ],
    },
  ];

  beforeEach(() => {
    mockIdGenerator = {
      generate: (() => {
        const ids = [QUIZ_ID, QUESTION_ID];
        return () => ids.shift() ?? randomUUIDv7();
      })(),
    };

    mockQuizRepository = {
      create: mock(async (quiz: Quiz) => quiz),
      findById: mock(async () => null),
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

    mockAiGenerator = {
      generateQuestions: mock(async () => createMockGeneratedQuestions()),
      validateQuota: mock(async () => true),
    };

    mockFileStorage = {
      uploadFiles: mock(async () => createMockFileMetadata()),
      getFileUri: mock(async () => "gs://bucket/file"),
      deleteFiles: mock(async () => {}),
    };

    useCase = new CreateQuizUseCase({
      quizRepository: mockQuizRepository,
      questionRepository: mockQuestionRepository,
      aiGenerator: mockAiGenerator,
      fileStorage: mockFileStorage,
      idGenerator: mockIdGenerator,
    });
  });

  describe("successful execution", () => {
    it("should create a quiz with AI-generated questions", async () => {
      const input = createValidInput();
      const result = await useCase.execute(input);

      expect(result.id).toBe(QUIZ_ID);
      expect(result.title).toBe("Test Quiz");
      expect(result.visibility).toBe(QuizVisibility.PRIVATE);
      expect(result.totalQuestions).toBe(10);
      expect(result.distribution).toEqual({
        directQuestion: 5,
        twoStatementCompound: 3,
        contextual: 2,
      });
    });

    it("should upload files before generating questions", async () => {
      const input = createValidInput();
      await useCase.execute(input);

      expect(mockFileStorage.uploadFiles).toHaveBeenCalledTimes(1);
    });

    it("should generate questions using AI", async () => {
      const input = createValidInput();
      await useCase.execute(input);

      expect(mockAiGenerator.generateQuestions).toHaveBeenCalledTimes(1);
      expect(mockAiGenerator.generateQuestions).toHaveBeenCalledWith({
        files: createMockFileMetadata(),
        distribution: input.distribution,
        model: GeminiModel.FLASH_2_5,
      });
    });

    it("should persist quiz and questions to repository", async () => {
      const input = createValidInput();
      await useCase.execute(input);

      expect(mockQuizRepository.create).toHaveBeenCalledTimes(1);
      expect(mockQuestionRepository.createBulk).toHaveBeenCalledTimes(1);
    });

    // Note: share links are now derived client-side; API returns only slug.
  });

  describe("validation errors", () => {
    it("should throw ValidationError for empty title", async () => {
      const input = createValidInput();
      input.title = "";

      await expect(useCase.execute(input)).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError for missing userId", async () => {
      const input = createValidInput();
      input.userId = "";

      await expect(useCase.execute(input)).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError for zero total questions", async () => {
      const input = createValidInput();
      input.distribution = {
        directQuestion: 0,
        twoStatementCompound: 0,
        contextual: 0,
      };

      await expect(useCase.execute(input)).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError for missing files", async () => {
      const input = createValidInput();
      input.files = [];

      await expect(useCase.execute(input)).rejects.toThrow(ValidationError);
    });
  });

  describe("AI fallback behavior", () => {
    it("should fallback to lite model when primary model quota is exceeded", async () => {
      let callCount = 0;
      mockAiGenerator.generateQuestions = mock(async (params) => {
        callCount++;
        if (callCount === 1) {
          throw new Error("quota exceeded");
        }
        return createMockGeneratedQuestions();
      });

      const input = createValidInput();
      const result = await useCase.execute(input);

      expect(result.id).toBeDefined();
      expect(mockAiGenerator.generateQuestions).toHaveBeenCalledTimes(2);
    });

    it("should throw QuotaExceededError when both models exceed quota", async () => {
      mockAiGenerator.generateQuestions = mock(async () => {
        throw new Error("quota exceeded");
      });

      const input = createValidInput();

      await expect(useCase.execute(input)).rejects.toThrow(QuotaExceededError);
    });

    it("should throw ExternalServiceError for non-quota AI errors", async () => {
      mockAiGenerator.generateQuestions = mock(async () => {
        throw new Error("Internal server error");
      });

      const input = createValidInput();

      await expect(useCase.execute(input)).rejects.toThrow(
        ExternalServiceError
      );
    });
  });

  describe("file storage errors", () => {
    it("should throw ExternalServiceError when file upload fails", async () => {
      mockFileStorage.uploadFiles = mock(async () => {
        throw new Error("Upload failed");
      });

      const input = createValidInput();

      await expect(useCase.execute(input)).rejects.toThrow(
        ExternalServiceError
      );
    });

    it("should clean up uploaded files when AI generation fails", async () => {
      mockAiGenerator.generateQuestions = mock(async () => {
        throw new Error("AI failed");
      });

      const input = createValidInput();

      await expect(useCase.execute(input)).rejects.toThrow();
      expect(mockFileStorage.deleteFiles).toHaveBeenCalledTimes(1);
    });
  });
});
