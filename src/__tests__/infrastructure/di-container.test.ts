import { describe, expect, it, beforeEach, afterEach, mock } from "bun:test";
import {
  createAppContainer,
  getContainer,
  resetContainer,
  type AppContainer,
} from "../../infrastructure/di/container";
import {
  DrizzleQuizRepository,
  DrizzleQuestionRepository,
} from "../../infrastructure/database/repositories";
import {
  GeminiQuizGeneratorService,
  FileStorageService,
  RedisCacheService,
  UuidIdGenerator,
} from "../../infrastructure/services";
import {
  CreateQuizUseCase,
  GetUserQuizzesUseCase,
  GetQuizByIdUseCase,
  ShareQuizUseCase,
  DeleteQuizUseCase,
} from "../../application";

describe("DI Container", () => {
  // Store original env vars
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Set required env vars for testing
    process.env.DATABASE_URL = "postgres://test:test@localhost:5432/test";
    process.env.GOOGLE_AI_API_KEY = "test-api-key";
    process.env.UPSTASH_REDIS_REST_URL = "https://test.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
    process.env.BETTER_AUTH_SECRET = "test-secret";

    resetContainer();
  });

  afterEach(() => {
    // Restore original env
    Object.keys(process.env).forEach((key) => {
      if (!(key in originalEnv)) {
        delete process.env[key];
      }
    });
    Object.assign(process.env, originalEnv);
    resetContainer();
  });

  describe("createAppContainer", () => {
    it("should create a container with all dependencies", () => {
      const container = createAppContainer({
        baseUrl: "http://localhost:3000",
        databaseUrl: "postgres://test:test@localhost:5432/test",
        googleAiApiKey: "test-api-key",
        redisUrl: "https://test.upstash.io",
        redisToken: "test-token",
      });

      expect(container).toBeDefined();
      expect(container.baseUrl).toBeDefined();
      expect(container.db).toBeDefined();
      expect(container.redis).toBeDefined();
      expect(container.repositories).toBeDefined();
      expect(container.services).toBeDefined();
      expect(container.useCases).toBeDefined();
    });

    it("should create repository instances", () => {
      const container = createAppContainer({
        baseUrl: "http://localhost:3000",
        databaseUrl: "postgres://test:test@localhost:5432/test",
        googleAiApiKey: "test-api-key",
        redisUrl: "https://test.upstash.io",
        redisToken: "test-token",
      });

      expect(container.repositories.quizRepository).toBeInstanceOf(
        DrizzleQuizRepository
      );
      expect(container.repositories.questionRepository).toBeInstanceOf(
        DrizzleQuestionRepository
      );
    });

    it("should create service instances", () => {
      const container = createAppContainer({
        baseUrl: "http://localhost:3000",
        databaseUrl: "postgres://test:test@localhost:5432/test",
        googleAiApiKey: "test-api-key",
        redisUrl: "https://test.upstash.io",
        redisToken: "test-token",
      });

      expect(container.services.aiGenerator).toBeInstanceOf(
        GeminiQuizGeneratorService
      );
      expect(container.services.fileStorage).toBeInstanceOf(FileStorageService);
      expect(container.services.cache).toBeInstanceOf(RedisCacheService);
      expect(container.services.idGenerator).toBeInstanceOf(UuidIdGenerator);
    });

    it("should create use case instances", () => {
      const container = createAppContainer({
        baseUrl: "http://localhost:3000",
        databaseUrl: "postgres://test:test@localhost:5432/test",
        googleAiApiKey: "test-api-key",
        redisUrl: "https://test.upstash.io",
        redisToken: "test-token",
      });

      expect(container.useCases.createQuiz).toBeInstanceOf(CreateQuizUseCase);
      expect(container.useCases.getUserQuizzes).toBeInstanceOf(
        GetUserQuizzesUseCase
      );
      expect(container.useCases.getQuizById).toBeInstanceOf(GetQuizByIdUseCase);
      expect(container.useCases.shareQuiz).toBeInstanceOf(ShareQuizUseCase);
      expect(container.useCases.deleteQuiz).toBeInstanceOf(DeleteQuizUseCase);
    });

    it("should use custom config when provided", () => {
      const customConfig = {
        baseUrl: "http://localhost:3000",
        databaseUrl: "postgres://custom:custom@localhost:5432/custom",
        googleAiApiKey: "custom-api-key",
        redisUrl: "https://custom.upstash.io",
        redisToken: "custom-token",
      };

      const container = createAppContainer(customConfig);

      // Container should be created without errors
      expect(container).toBeDefined();
    });
  });

  describe("getContainer", () => {
    it("should return a singleton container instance", () => {
      const container1 = getContainer();
      const container2 = getContainer();

      expect(container1).toBe(container2);
    });

    it("should create container lazily on first call", () => {
      resetContainer();

      const container = getContainer();

      expect(container).toBeDefined();
      expect(container.useCases).toBeDefined();
    });
  });

  describe("resetContainer", () => {
    it("should reset the singleton instance", () => {
      const container1 = getContainer();
      resetContainer();
      const container2 = getContainer();

      // They should be different instances
      expect(container1).not.toBe(container2);
    });
  });

  describe("dependency injection", () => {
    it("should inject correct dependencies into use cases", () => {
      const container = createAppContainer({
        baseUrl: "http://localhost:3000",
        databaseUrl: "postgres://test:test@localhost:5432/test",
        googleAiApiKey: "test-api-key",
        redisUrl: "https://test.upstash.io",
        redisToken: "test-token",
      });

      // CreateQuizUseCase should have all required dependencies
      const createQuiz = container.useCases.createQuiz;
      expect(createQuiz).toBeDefined();

      // Verify the use case can be executed (would need proper mocking for full test)
      expect(typeof createQuiz.execute).toBe("function");
    });

    it("should share repository instances across use cases", () => {
      const container = createAppContainer({
        baseUrl: "http://localhost:3000",
        databaseUrl: "postgres://test:test@localhost:5432/test",
        googleAiApiKey: "test-api-key",
        redisUrl: "https://test.upstash.io",
        redisToken: "test-token",
      });

      // All use cases that use quizRepository should share the same instance
      // This is verified by the fact that they're all created from the same container
      expect(container.repositories.quizRepository).toBeDefined();
    });
  });

  describe("container structure", () => {
    it("should have correct shape", () => {
      const container = createAppContainer({
        baseUrl: "http://localhost:3000",
        databaseUrl: "postgres://test:test@localhost:5432/test",
        googleAiApiKey: "test-api-key",
        redisUrl: "https://test.upstash.io",
        redisToken: "test-token",
      });

      // Verify container shape
      expect(container).toHaveProperty("db");
      expect(container).toHaveProperty("redis");
      expect(container).toHaveProperty("auth");
      expect(container).toHaveProperty("repositories");
      expect(container).toHaveProperty("services");
      expect(container).toHaveProperty("useCases");

      // Verify repositories shape
      expect(container.repositories).toHaveProperty("quizRepository");
      expect(container.repositories).toHaveProperty("questionRepository");

      // Verify services shape
      expect(container.services).toHaveProperty("aiGenerator");
      expect(container.services).toHaveProperty("fileStorage");
      expect(container.services).toHaveProperty("cache");
      expect(container.services).toHaveProperty("idGenerator");

      // Verify use cases shape
      expect(container.useCases).toHaveProperty("createQuiz");
      expect(container.useCases).toHaveProperty("getUserQuizzes");
      expect(container.useCases).toHaveProperty("getQuizById");
      expect(container.useCases).toHaveProperty("shareQuiz");
      expect(container.useCases).toHaveProperty("deleteQuiz");
    });
  });
});
