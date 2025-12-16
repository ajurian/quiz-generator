import { describe, expect, it, beforeEach, mock, spyOn } from "bun:test";
import { DrizzleQuizRepository } from "../../infrastructure/database/repositories/drizzle-quiz.repository";
import { Quiz, QuizDistributionService, QuizVisibility } from "../../domain";
import type { DrizzleDatabase } from "../../infrastructure/database/connection";

describe("DrizzleQuizRepository", () => {
  let repository: DrizzleQuizRepository;
  let mockDb: DrizzleDatabase;

  // Valid UUIDs for testing (slug generation requires valid UUID format)
  const QUIZ_ID = "019b2194-72a0-7000-a712-5e5bc5c313c1";
  const USER_ID = "018e3f5e-5f2a-7c2b-b3a4-9f8d6c4b2a10";

  // Helper to create a valid Quiz entity
  const createTestQuiz = (
    overrides: Partial<{
      id: string;
      userId: string;
      title: string;
      visibility: QuizVisibility;
    }> = {}
  ): Quiz => {
    return Quiz.create({
      id: overrides.id ?? QUIZ_ID,
      userId: overrides.userId ?? USER_ID,
      title: overrides.title ?? "Test Quiz",
      distribution: {
        singleBestAnswer: 5,
        twoStatements: 3,
        contextual: 2,
      },
      visibility: overrides.visibility ?? QuizVisibility.PRIVATE,
    });
  };

  // Helper to create a mock database row
  const createMockDbRow = (quiz: Quiz) => ({
    id: quiz.id,
    slug: quiz.slug,
    userId: quiz.userId,
    title: quiz.title,
    questionDistribution: quiz.questionDistribution,
    visibility: quiz.visibility,
    createdAt: quiz.createdAt,
    updatedAt: quiz.updatedAt,
  });

  beforeEach(() => {
    // Create mock database with chainable query builder
    const createChainableMock = (returnValue: unknown) => {
      const chain: Record<string, unknown> = {};
      chain.select = mock(() => chain);
      chain.from = mock(() => chain);
      chain.where = mock(() => chain);
      chain.orderBy = mock(() => chain);
      chain.limit = mock(() => chain);
      chain.offset = mock(() => Promise.resolve(returnValue));
      chain.insert = mock(() => chain);
      chain.values = mock(() => chain);
      chain.returning = mock(() => Promise.resolve(returnValue));
      chain.update = mock(() => chain);
      chain.set = mock(() => chain);
      chain.delete = mock(() => chain);
      return chain;
    };

    mockDb = createChainableMock([]) as unknown as DrizzleDatabase;
    repository = new DrizzleQuizRepository(mockDb);
  });

  describe("create", () => {
    it("should insert a quiz and return the created entity", async () => {
      const quiz = createTestQuiz();
      const dbRow = createMockDbRow(quiz);

      // Setup mock to return the inserted row
      const mockChain = {
        values: mock(() => ({
          returning: mock(() => Promise.resolve([dbRow])),
        })),
      };
      mockDb.insert = mock(
        () => mockChain as unknown
      ) as unknown as DrizzleDatabase["insert"];

      const result = await repository.create(quiz);

      expect(result).toBeInstanceOf(Quiz);
      expect(result.id).toBe(quiz.id);
      expect(result.title).toBe(quiz.title);
      expect(result.userId).toBe(quiz.userId);
    });

    it("should throw an error when insert fails", async () => {
      const quiz = createTestQuiz();

      // Setup mock to return empty array (insert failed)
      const mockChain = {
        values: mock(() => ({ returning: mock(() => Promise.resolve([])) })),
      };
      mockDb.insert = mock(
        () => mockChain as unknown
      ) as unknown as DrizzleDatabase["insert"];

      await expect(repository.create(quiz)).rejects.toThrow(
        "Failed to insert quiz"
      );
    });
  });

  describe("findById", () => {
    it("should return a quiz when found", async () => {
      const quiz = createTestQuiz({ id: QUIZ_ID });
      const dbRow = createMockDbRow(quiz);

      const mockChain = {
        from: mock(() => ({
          where: mock(() => ({
            limit: mock(() => Promise.resolve([dbRow])),
          })),
        })),
      };
      mockDb.select = mock(
        () => mockChain as unknown
      ) as unknown as DrizzleDatabase["select"];

      const result = await repository.findById(QUIZ_ID);

      expect(result).toBeInstanceOf(Quiz);
      expect(result?.id).toBe(QUIZ_ID);
    });

    it("should return null when quiz is not found", async () => {
      const mockChain = {
        from: mock(() => ({
          where: mock(() => ({
            limit: mock(() => Promise.resolve([])),
          })),
        })),
      };
      mockDb.select = mock(
        () => mockChain as unknown
      ) as unknown as DrizzleDatabase["select"];

      const result = await repository.findById("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("findByUserId", () => {
    it("should return paginated quizzes for a user", async () => {
      const QUIZ_ID_1 = "019b2194-72a0-7001-a712-5e5bc5c31311";
      const QUIZ_ID_2 = "019b2194-72a0-7002-a712-5e5bc5c31312";
      const quiz1 = createTestQuiz({
        id: QUIZ_ID_1,
        userId: USER_ID,
      });
      const quiz2 = createTestQuiz({
        id: QUIZ_ID_2,
        userId: USER_ID,
      });
      const dbRows = [createMockDbRow(quiz1), createMockDbRow(quiz2)];

      // Mock count query
      const countChain = {
        from: mock(() => ({
          where: mock(() => Promise.resolve([{ total: 5 }])),
        })),
      };

      // Mock data query
      const dataChain = {
        from: mock(() => ({
          where: mock(() => ({
            orderBy: mock(() => ({
              limit: mock(() => ({
                offset: mock(() => Promise.resolve(dbRows)),
              })),
            })),
          })),
        })),
      };

      let callCount = 0;
      mockDb.select = mock(() => {
        callCount++;
        return (callCount === 1 ? countChain : dataChain) as unknown;
      }) as unknown as DrizzleDatabase["select"];

      const result = await repository.findByUserId(USER_ID, {
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(5);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it("should calculate correct totalPages", async () => {
      const countChain = {
        from: mock(() => ({
          where: mock(() => Promise.resolve([{ total: 25 }])),
        })),
      };

      const dataChain = {
        from: mock(() => ({
          where: mock(() => ({
            orderBy: mock(() => ({
              limit: mock(() => ({
                offset: mock(() => Promise.resolve([])),
              })),
            })),
          })),
        })),
      };

      let callCount = 0;
      mockDb.select = mock(() => {
        callCount++;
        return (callCount === 1 ? countChain : dataChain) as unknown;
      }) as unknown as DrizzleDatabase["select"];

      const result = await repository.findByUserId(USER_ID, {
        page: 1,
        limit: 10,
      });

      expect(result.totalPages).toBe(3); // 25 / 10 = 2.5, ceil = 3
    });
  });

  describe("update", () => {
    it("should update a quiz and return the updated entity", async () => {
      const quiz = createTestQuiz();
      const dbRow = createMockDbRow(quiz);

      const mockChain = {
        set: mock(() => ({
          where: mock(() => ({
            returning: mock(() => Promise.resolve([dbRow])),
          })),
        })),
      };
      mockDb.update = mock(
        () => mockChain as unknown
      ) as unknown as DrizzleDatabase["update"];

      const result = await repository.update(quiz);

      expect(result).toBeInstanceOf(Quiz);
      expect(result.id).toBe(quiz.id);
    });

    it("should throw an error when quiz not found", async () => {
      const quiz = createTestQuiz();

      const mockChain = {
        set: mock(() => ({
          where: mock(() => ({
            returning: mock(() => Promise.resolve([])),
          })),
        })),
      };
      mockDb.update = mock(
        () => mockChain as unknown
      ) as unknown as DrizzleDatabase["update"];

      await expect(repository.update(quiz)).rejects.toThrow(
        `Quiz with id ${quiz.id} not found`
      );
    });
  });

  describe("delete", () => {
    it("should delete a quiz without throwing", async () => {
      const mockChain = {
        where: mock(() => Promise.resolve()),
      };
      mockDb.delete = mock(
        () => mockChain as unknown
      ) as unknown as DrizzleDatabase["delete"];

      await expect(repository.delete("quiz-123")).resolves.toBeUndefined();
    });
  });

  describe("exists", () => {
    it("should return true when quiz exists", async () => {
      const mockChain = {
        from: mock(() => ({
          where: mock(() => ({
            limit: mock(() => Promise.resolve([{ id: "quiz-123" }])),
          })),
        })),
      };
      mockDb.select = mock(
        () => mockChain as unknown
      ) as unknown as DrizzleDatabase["select"];

      const result = await repository.exists("quiz-123");

      expect(result).toBe(true);
    });

    it("should return false when quiz does not exist", async () => {
      const mockChain = {
        from: mock(() => ({
          where: mock(() => ({
            limit: mock(() => Promise.resolve([])),
          })),
        })),
      };
      mockDb.select = mock(
        () => mockChain as unknown
      ) as unknown as DrizzleDatabase["select"];

      const result = await repository.exists("non-existent");

      expect(result).toBe(false);
    });
  });
});
