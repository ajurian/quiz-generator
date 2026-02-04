import { describe, expect, it, beforeEach, mock, spyOn } from "bun:test";
import {
  GeminiQuizGeneratorService,
  AIGenerationError,
} from "../../infrastructure/services/gemini-quiz-generator.service";
import { QuestionType } from "@/domain";
import { AIModel } from "@/application";
import type { GenerateQuizParams, FileMetadata } from "@/application";

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
    model: AIModel.PRIMARY,
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
          isCorrect: true,
        },
        {
          index: "B",
          text: "Protein synthesis",
          isCorrect: false,
          errorRationale: "Incorrect - ribosomes do this",
        },
        {
          index: "C",
          text: "DNA replication",
          isCorrect: false,
          errorRationale: "Incorrect - nucleus handles this",
        },
        {
          index: "D",
          text: "Cell division",
          isCorrect: false,
          errorRationale: "Incorrect - centrosomes do this",
        },
      ],
      correctExplanation: "Mitochondria are responsible for ATP synthesis",
      sourceQuotes: ["The mitochondria is the powerhouse of the cell."],
      reference: 0,
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
        "generateWithModel" as never,
      ).mockResolvedValue(mockQuestions);

      const result = await service.generateQuestions(params);

      expect(result).toHaveLength(1);
      expect(result[0]!.stem).toBe(
        "What is the primary function of mitochondria?",
      );
      expect(result[0]!.type).toBe(QuestionType.DIRECT_QUESTION);
      expect(result[0]!.options).toHaveLength(4);
    });

    it("should throw AIGenerationError with quota reason on quota error", async () => {
      const service = new GeminiQuizGeneratorService(testApiKey);
      const params = createValidParams();

      // Mock the client to throw quota error
      (
        service as unknown as {
          client: { models: { generateContent: () => Promise<unknown> } };
        }
      ).client.models.generateContent = () => {
        throw new Error("Quota exceeded for gemini-2.5-flash");
      };

      try {
        await service.generateQuestions(params);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AIGenerationError);
        expect((error as AIGenerationError).reason).toBe("quota");
        expect((error as AIGenerationError).model).toBe("gemini-2.5-flash");
      }
    });

    it("should throw AIGenerationError with timeout reason on deadline exceeded", async () => {
      const service = new GeminiQuizGeneratorService(testApiKey);
      const params = createValidParams();

      // Mock the client to throw deadline exceeded error
      (
        service as unknown as {
          client: { models: { generateContent: () => Promise<unknown> } };
        }
      ).client.models.generateContent = () => {
        throw new Error("DEADLINE_EXCEEDED: Request timed out");
      };

      try {
        await service.generateQuestions(params);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AIGenerationError);
        expect((error as AIGenerationError).reason).toBe("timeout");
        expect((error as AIGenerationError).model).toBe("gemini-2.5-flash");
      }
    });

    it("should throw non-quota errors", async () => {
      const service = new GeminiQuizGeneratorService(testApiKey);
      const params = createValidParams();

      // @ts-expect-error - mocking private method
      service.generateWithModel = async () => {
        throw new Error("Network error");
      };

      await expect(service.generateQuestions(params)).rejects.toThrow(
        "Network error",
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

      const result = await service.validateQuota(AIModel.PRIMARY);

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
            Promise.reject(new Error("Quota exceeded")),
          ),
        },
      } as unknown as typeof service extends { client: infer C } ? C : never;

      const result = await service.validateQuota(AIModel.PRIMARY);

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
            Promise.reject(new Error("Invalid API key")),
          ),
        },
      } as unknown as typeof service extends { client: infer C } ? C : never;

      await expect(service.validateQuota(AIModel.PRIMARY)).rejects.toThrow(
        "Invalid API key",
      );
    });
  });

  describe("detectErrorReason", () => {
    it("should detect quota-related error messages", () => {
      const service = new GeminiQuizGeneratorService(testApiKey);
      const detectErrorReason = (
        service as unknown as { detectErrorReason: (error: unknown) => string }
      ).detectErrorReason;

      expect(detectErrorReason.call(service, new Error("Quota exceeded"))).toBe(
        "quota",
      );
      expect(
        detectErrorReason.call(service, new Error("Rate limit reached")),
      ).toBe("quota");
      expect(
        detectErrorReason.call(service, new Error("Resource exhausted")),
      ).toBe("quota");
      expect(
        detectErrorReason.call(
          service,
          new Error("Error 429: Too many requests"),
        ),
      ).toBe("quota");
    });

    it("should detect timeout-related error messages", () => {
      const service = new GeminiQuizGeneratorService(testApiKey);
      const detectErrorReason = (
        service as unknown as { detectErrorReason: (error: unknown) => string }
      ).detectErrorReason;

      expect(
        detectErrorReason.call(service, new Error("DEADLINE_EXCEEDED")),
      ).toBe("timeout");
      expect(
        detectErrorReason.call(service, new Error("Deadline exceeded")),
      ).toBe("timeout");
      expect(
        detectErrorReason.call(
          service,
          new Error("Error 504: Gateway timeout"),
        ),
      ).toBe("timeout");
      expect(
        detectErrorReason.call(service, new Error("Request timeout")),
      ).toBe("timeout");
      expect(
        detectErrorReason.call(service, new Error("Connection timed out")),
      ).toBe("timeout");
    });

    it("should detect unavailable-related error messages", () => {
      const service = new GeminiQuizGeneratorService(testApiKey);
      const detectErrorReason = (
        service as unknown as { detectErrorReason: (error: unknown) => string }
      ).detectErrorReason;

      expect(
        detectErrorReason.call(
          service,
          new Error("Error 503: Service Unavailable"),
        ),
      ).toBe("unavailable");
      expect(
        detectErrorReason.call(service, new Error("Service unavailable")),
      ).toBe("unavailable");
      expect(
        detectErrorReason.call(
          service,
          new Error("The server is currently unavailable"),
        ),
      ).toBe("unavailable");
    });

    it("should return unknown for non-quota/timeout/unavailable errors", () => {
      const service = new GeminiQuizGeneratorService(testApiKey);
      const detectErrorReason = (
        service as unknown as { detectErrorReason: (error: unknown) => string }
      ).detectErrorReason;

      expect(detectErrorReason.call(service, new Error("Network error"))).toBe(
        "unknown",
      );
      expect(
        detectErrorReason.call(service, new Error("Invalid API key")),
      ).toBe("unknown");
      expect(detectErrorReason.call(service, new Error("Server error"))).toBe(
        "unknown",
      );
    });
  });
});

describe("AIGenerationError", () => {
  it("should have correct name and message for quota errors", () => {
    const error = new AIGenerationError("gemini-2.5-flash", "quota");

    expect(error.name).toBe("AIGenerationError");
    expect(error.reason).toBe("quota");
    expect(error.model).toBe("gemini-2.5-flash");
    expect(error.message).toBe("Quota exceeded for model: gemini-2.5-flash");
  });

  it("should have correct name and message for timeout errors", () => {
    const error = new AIGenerationError("gemini-2.5-flash", "timeout");

    expect(error.name).toBe("AIGenerationError");
    expect(error.reason).toBe("timeout");
    expect(error.model).toBe("gemini-2.5-flash");
    expect(error.message).toBe(
      "Request timed out (DEADLINE_EXCEEDED) for model: gemini-2.5-flash",
    );
  });

  it("should have correct name and message for unavailable errors", () => {
    const error = new AIGenerationError("gemini-2.5-flash", "unavailable");

    expect(error.name).toBe("AIGenerationError");
    expect(error.reason).toBe("unavailable");
    expect(error.model).toBe("gemini-2.5-flash");
    expect(error.message).toBe(
      "Service unavailable (503) for model: gemini-2.5-flash",
    );
  });

  it("should include original message when provided", () => {
    const error = new AIGenerationError(
      "gemini-2.5-flash",
      "quota",
      "Original error details",
    );

    expect(error.message).toBe(
      "Quota exceeded for model: gemini-2.5-flash - Original error details",
    );
  });
});
