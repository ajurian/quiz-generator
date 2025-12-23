import { describe, expect, it, beforeEach, mock } from "bun:test";
import { DrizzleQuestionRepository } from "../../infrastructure/database/repositories/drizzle-question.repository";
import { Question, QuestionType } from "../../domain";
import type { DrizzleDatabase } from "../../infrastructure/database/connection";
import type { QuestionOptionProps } from "../../domain";

describe("DrizzleQuestionRepository", () => {
  let repository: DrizzleQuestionRepository;
  let mockDb: DrizzleDatabase;

  // Helper to create valid options
  const createValidOptions = (): QuestionOptionProps[] => [
    {
      index: "A",
      text: "Option A",
      explanation: "Explanation A",
      isCorrect: true,
    },
    {
      index: "B",
      text: "Option B",
      explanation: "Explanation B",
      isCorrect: false,
    },
    {
      index: "C",
      text: "Option C",
      explanation: "Explanation C",
      isCorrect: false,
    },
    {
      index: "D",
      text: "Option D",
      explanation: "Explanation D",
      isCorrect: false,
    },
  ];

  // Helper to create a valid Question entity
  const createTestQuestion = (
    overrides: Partial<{
      id: string;
      quizId: string;
      orderIndex: number;
      stem: string;
    }> = {}
  ): Question => {
    return Question.create({
      id: overrides.id ?? "question-123",
      quizId: overrides.quizId ?? "quiz-456",
      stem: overrides.stem ?? "What is the answer?",
      type: QuestionType.DIRECT_QUESTION,
      options: createValidOptions(),
      orderIndex: overrides.orderIndex ?? 0,
    });
  };

  // Helper to create a mock database row
  const createMockDbRow = (question: Question) => ({
    id: question.id,
    quizId: question.quizId,
    orderIndex: question.orderIndex,
    type: question.type,
    stem: question.stem,
    options: question.options.map((opt) => opt.toPlain()),
  });

  beforeEach(() => {
    // Create mock database
    mockDb = {} as DrizzleDatabase;
    repository = new DrizzleQuestionRepository(mockDb);
  });

  describe("createBulk", () => {
    it("should return empty array when given empty array", async () => {
      const result = await repository.createBulk([]);

      expect(result).toEqual([]);
    });

    it("should insert multiple questions and return created entities", async () => {
      const questions = [
        createTestQuestion({ id: "q-1", orderIndex: 0 }),
        createTestQuestion({ id: "q-2", orderIndex: 1 }),
        createTestQuestion({ id: "q-3", orderIndex: 2 }),
      ];
      const dbRows = questions.map((q) => createMockDbRow(q));

      const mockChain = {
        values: mock(() => ({
          returning: mock(() => Promise.resolve(dbRows)),
        })),
      };
      mockDb.insert = mock(
        () => mockChain as unknown
      ) as unknown as DrizzleDatabase["insert"];

      const result = await repository.createBulk(questions);

      expect(result).toHaveLength(3);
      expect(result[0]).toBeInstanceOf(Question);
      expect(result[0]!.id).toBe("q-1");
      expect(result[1]!.id).toBe("q-2");
      expect(result[2]!.id).toBe("q-3");
    });

    it("should correctly serialize options to plain objects", async () => {
      const question = createTestQuestion();
      const dbRow = createMockDbRow(question);

      let capturedValues: unknown;
      const mockChain = {
        values: mock((vals: unknown) => {
          capturedValues = vals;
          return { returning: mock(() => Promise.resolve([dbRow])) };
        }),
      };
      mockDb.insert = mock(
        () => mockChain as unknown
      ) as unknown as DrizzleDatabase["insert"];

      await repository.createBulk([question]);

      expect(capturedValues).toBeDefined();
      const values = capturedValues as Array<{ options: unknown[] }>;
      expect(values[0]!.options).toHaveLength(4);
      expect(values[0]!.options[0]).toEqual({
        index: "A",
        text: "Option A",
        explanation: "Explanation A",
        isCorrect: true,
      });
    });
  });

  describe("findByQuizId", () => {
    it("should return questions sorted by orderIndex", async () => {
      const questions = [
        createTestQuestion({ id: "q-1", orderIndex: 0 }),
        createTestQuestion({ id: "q-2", orderIndex: 1 }),
        createTestQuestion({ id: "q-3", orderIndex: 2 }),
      ];
      const dbRows = questions.map((q) => createMockDbRow(q));

      const mockChain = {
        from: mock(() => ({
          where: mock(() => ({
            orderBy: mock(() => Promise.resolve(dbRows)),
          })),
        })),
      };
      mockDb.select = mock(
        () => mockChain as unknown
      ) as unknown as DrizzleDatabase["select"];

      const result = await repository.findByQuizId("quiz-456");

      expect(result).toHaveLength(3);
      expect(result[0]!.orderIndex).toBe(0);
      expect(result[1]!.orderIndex).toBe(1);
      expect(result[2]!.orderIndex).toBe(2);
    });

    it("should return empty array when no questions found", async () => {
      const mockChain = {
        from: mock(() => ({
          where: mock(() => ({
            orderBy: mock(() => Promise.resolve([])),
          })),
        })),
      };
      mockDb.select = mock(
        () => mockChain as unknown
      ) as unknown as DrizzleDatabase["select"];

      const result = await repository.findByQuizId("empty-quiz");

      expect(result).toEqual([]);
    });

    it("should correctly deserialize options from database", async () => {
      const question = createTestQuestion();
      const dbRow = createMockDbRow(question);

      const mockChain = {
        from: mock(() => ({
          where: mock(() => ({
            orderBy: mock(() => Promise.resolve([dbRow])),
          })),
        })),
      };
      mockDb.select = mock(
        () => mockChain as unknown
      ) as unknown as DrizzleDatabase["select"];

      const result = await repository.findByQuizId("quiz-456");

      expect(result[0]!.options).toHaveLength(4);
      expect(result[0]!.options[0]!.index).toBe("A");
      expect(result[0]!.options[0]!.isCorrect).toBe(true);
    });
  });

  describe("deleteByQuizId", () => {
    it("should delete all questions for a quiz", async () => {
      const whereMock = mock(() => Promise.resolve());
      const mockChain = {
        where: whereMock,
      };
      mockDb.delete = mock(
        () => mockChain as unknown
      ) as unknown as DrizzleDatabase["delete"];

      await repository.deleteByQuizId("quiz-123");

      expect(mockDb.delete).toHaveBeenCalled();
      expect(whereMock).toHaveBeenCalled();
    });
  });
});
