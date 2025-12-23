import { describe, expect, it, beforeEach, mock, spyOn } from "bun:test";
import {
  GeminiQuizGeneratorService,
  QuotaExceededError,
} from "../../infrastructure/services/gemini-quiz-generator.service";
import { GeminiModel, QuestionType } from "../../domain";
import type { GenerateQuizParams, FileMetadata } from "../../application";

// Mock the @google/genai module
const mockGenerateContent = mock(() => Promise.resolve({ text: "[]" }));
const mockGoogleGenAI = mock(() => ({
  models: {
    generateContent: mockGenerateContent,
  },
}));

describe("GeminiQuizGeneratorService", () => {
  let service: GeminiQuizGeneratorService;
  const testApiKey = "test-api-key";

  const createMockFiles = (): FileMetadata[] => [
    {
      id: "file-1",
      name: "study-material.pdf",
      mimeType: "application/pdf",
      uri: "gs://bucket/study-material.pdf",
      sizeBytes: 1024,
    },
  ];

  const createValidParams = (): GenerateQuizParams => ({
    files: createMockFiles(),
    distribution: {
      directQuestion: 3,
      twoStatementCompound: 2,
      contextual: 1,
    },
    model: GeminiModel.FLASH_2_5,
  });

  const createMockGeneratedQuestions = () => [
    {
      orderIndex: 0,
      type: QuestionType.DIRECT_QUESTION,
      stem: "What is the primary function of mitochondria?",
      options: [
        {
          index: "A",
          text: "Energy production",
          explanation: "Correct - ATP synthesis",
          isCorrect: true,
        },
        {
          index: "B",
          text: "Protein synthesis",
          explanation: "Incorrect - ribosomes do this",
          isCorrect: false,
        },
        {
          index: "C",
          text: "DNA replication",
          explanation: "Incorrect - nucleus handles this",
          isCorrect: false,
        },
        {
          index: "D",
          text: "Cell division",
          explanation: "Incorrect - centrosomes do this",
          isCorrect: false,
        },
      ],
    },
  ];

  beforeEach(() => {
    mockGenerateContent.mockReset();
  });

  describe("generateQuestions", () => {
    it("should generate questions with correct structure", async () => {
      const service = new GeminiQuizGeneratorService(testApiKey);
      const params = createValidParams();
      const mockQuestions = createMockGeneratedQuestions();

      // Mock the private method by spying on the client
      const generateWithModelSpy = spyOn(
        service as unknown as { generateWithModel: () => Promise<unknown> },
        "generateWithModel" as never
      ).mockResolvedValue(mockQuestions);

      const result = await service.generateQuestions(params);

      expect(result).toHaveLength(1);
      expect(result[0]!.stem).toBe(
        "What is the primary function of mitochondria?"
      );
      expect(result[0]!.type).toBe(QuestionType.DIRECT_QUESTION);
      expect(result[0]!.options).toHaveLength(4);
    });

    it("should fallback to lite model on quota error", async () => {
      const service = new GeminiQuizGeneratorService(testApiKey);
      const params = createValidParams();
      const mockQuestions = createMockGeneratedQuestions();

      let callCount = 0;
      // @ts-expect-error - accessing private method for testing
      const originalMethod = service.generateWithModel.bind(service);
      // @ts-expect-error - mocking private method
      service.generateWithModel = async (...args: unknown[]) => {
        callCount++;
        if (callCount === 1) {
          throw new Error("Quota exceeded for gemini-2.5-flash");
        }
        return mockQuestions;
      };

      const result = await service.generateQuestions(params);

      expect(callCount).toBe(2);
      expect(result).toHaveLength(1);
    });

    it("should throw non-quota errors", async () => {
      const service = new GeminiQuizGeneratorService(testApiKey);
      const params = createValidParams();

      // @ts-expect-error - mocking private method
      service.generateWithModel = async () => {
        throw new Error("Network error");
      };

      await expect(service.generateQuestions(params)).rejects.toThrow(
        "Network error"
      );
    });
  });

  describe("validateQuota", () => {
    it("should return true when quota is available", async () => {
      const service = new GeminiQuizGeneratorService(testApiKey);

      // Mock the client's generateContent
      (
        service as unknown as {
          client: { models: { generateContent: () => Promise<unknown> } };
        }
      ).client = {
        models: {
          generateContent: mock(() => Promise.resolve({ text: "ok" })),
        },
      } as unknown as typeof service extends { client: infer C } ? C : never;

      const result = await service.validateQuota(GeminiModel.FLASH_2_5);

      expect(result).toBe(true);
    });

    it("should return false when quota is exceeded", async () => {
      const service = new GeminiQuizGeneratorService(testApiKey);

      (
        service as unknown as {
          client: { models: { generateContent: () => Promise<unknown> } };
        }
      ).client = {
        models: {
          generateContent: mock(() =>
            Promise.reject(new Error("Quota exceeded"))
          ),
        },
      } as unknown as typeof service extends { client: infer C } ? C : never;

      const result = await service.validateQuota(GeminiModel.FLASH_2_5);

      expect(result).toBe(false);
    });

    it("should throw non-quota errors", async () => {
      const service = new GeminiQuizGeneratorService(testApiKey);

      (
        service as unknown as {
          client: { models: { generateContent: () => Promise<unknown> } };
        }
      ).client = {
        models: {
          generateContent: mock(() =>
            Promise.reject(new Error("Invalid API key"))
          ),
        },
      } as unknown as typeof service extends { client: infer C } ? C : never;

      await expect(
        service.validateQuota(GeminiModel.FLASH_2_5)
      ).rejects.toThrow("Invalid API key");
    });
  });

  describe("isQuotaError", () => {
    it("should detect quota-related error messages", () => {
      const service = new GeminiQuizGeneratorService(testApiKey);
      const isQuotaError = (
        service as unknown as { isQuotaError: (error: unknown) => boolean }
      ).isQuotaError;

      expect(isQuotaError.call(service, new Error("Quota exceeded"))).toBe(
        true
      );
      expect(isQuotaError.call(service, new Error("Rate limit reached"))).toBe(
        true
      );
      expect(isQuotaError.call(service, new Error("Resource exhausted"))).toBe(
        true
      );
      expect(
        isQuotaError.call(service, new Error("Error 429: Too many requests"))
      ).toBe(true);
    });

    it("should not detect non-quota errors", () => {
      const service = new GeminiQuizGeneratorService(testApiKey);
      const isQuotaError = (
        service as unknown as { isQuotaError: (error: unknown) => boolean }
      ).isQuotaError;

      expect(isQuotaError.call(service, new Error("Network error"))).toBe(
        false
      );
      expect(isQuotaError.call(service, new Error("Invalid API key"))).toBe(
        false
      );
      expect(isQuotaError.call(service, new Error("Server error"))).toBe(false);
    });
  });
});

describe("QuotaExceededError", () => {
  it("should have correct name and message", () => {
    const error = new QuotaExceededError(GeminiModel.FLASH_2_5);

    expect(error.name).toBe("QuotaExceededError");
    expect(error.message).toBe("Quota exceeded for model: gemini-2.5-flash");
  });
});
