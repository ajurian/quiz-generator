import { describe, expect, it } from "bun:test";
import {
  createQuizInputSchema,
  distributionSchema,
  toQuizResponseDTO,
} from "../../application/dtos/quiz.dto";
import { Quiz } from "../../domain";

describe("Quiz DTOs", () => {
  describe("distributionSchema", () => {
    it("should validate valid distribution", () => {
      const result = distributionSchema.safeParse({
        singleBestAnswer: 5,
        twoStatements: 3,
        contextual: 2,
      });

      expect(result.success).toBe(true);
    });

    it("should reject negative numbers", () => {
      const result = distributionSchema.safeParse({
        singleBestAnswer: -1,
        twoStatements: 3,
        contextual: 2,
      });

      expect(result.success).toBe(false);
    });

    it("should reject non-integer numbers", () => {
      const result = distributionSchema.safeParse({
        singleBestAnswer: 5.5,
        twoStatements: 3,
        contextual: 2,
      });

      expect(result.success).toBe(false);
    });

    it("should reject values exceeding maximum (255)", () => {
      const result = distributionSchema.safeParse({
        singleBestAnswer: 256,
        twoStatements: 3,
        contextual: 2,
      });

      expect(result.success).toBe(false);
    });

    it("should reject zero total questions", () => {
      const result = distributionSchema.safeParse({
        singleBestAnswer: 0,
        twoStatements: 0,
        contextual: 0,
      });

      expect(result.success).toBe(false);
    });
  });

  describe("createQuizInputSchema", () => {
    it("should validate valid input", () => {
      const result = createQuizInputSchema.safeParse({
        userId: "018e3f5e-5f2a-7c2b-b3a4-9f8d6c4b2a10",
        title: "Test Quiz",
        distribution: {
          singleBestAnswer: 5,
          twoStatements: 3,
          contextual: 2,
        },
      });
      console.log(result.error);

      expect(result.success).toBe(true);
    });

    it("should reject empty userId", () => {
      const result = createQuizInputSchema.safeParse({
        userId: "",
        title: "Test Quiz",
        distribution: { singleBestAnswer: 5, twoStatements: 3, contextual: 2 },
      });

      expect(result.success).toBe(false);
    });

    it("should reject empty title", () => {
      const result = createQuizInputSchema.safeParse({
        userId: "018e3f5e-5f2a-7c2b-b3a4-9f8d6c4b2a10",
        title: "",
        distribution: { singleBestAnswer: 5, twoStatements: 3, contextual: 2 },
      });

      expect(result.success).toBe(false);
    });

    it("should reject title exceeding 255 characters", () => {
      const result = createQuizInputSchema.safeParse({
        userId: "018e3f5e-5f2a-7c2b-b3a4-9f8d6c4b2a10",
        title: "a".repeat(256),
        distribution: { singleBestAnswer: 5, twoStatements: 3, contextual: 2 },
      });

      expect(result.success).toBe(false);
    });
  });

  describe("toQuizResponseDTO", () => {
    const createMockQuiz = (isPublic = false): Quiz => {
      return Quiz.create({
        id: "quiz-123",
        userId: "018e3f5e-5f2a-7c2b-b3a4-9f8d6c4b2a10",
        title: "Test Quiz",
        distribution: { singleBestAnswer: 5, twoStatements: 3, contextual: 2 },
        isPublic,
      });
    };

    it("should transform Quiz to QuizResponseDTO", () => {
      const quiz = createMockQuiz();
      const dto = toQuizResponseDTO(quiz);

      expect(dto.id).toBe("quiz-123");
      expect(dto.title).toBe("Test Quiz");
      expect(dto.isPublic).toBe(false);
      expect(dto.totalQuestions).toBe(10);
      expect(dto.distribution).toEqual({
        singleBestAnswer: 5,
        twoStatements: 3,
        contextual: 2,
      });
      expect(typeof dto.createdAt).toBe("string");
      expect(typeof dto.updatedAt).toBe("string");
    });

    it("should include share link when baseUrl provided and quiz is public", () => {
      const quiz = createMockQuiz(true);
      const dto = toQuizResponseDTO(quiz, "https://example.com");

      expect(dto.shareLink).toBe("https://example.com/quiz/quiz-123/public");
    });

    it("should not include share link for private quiz", () => {
      const quiz = createMockQuiz(false);
      const dto = toQuizResponseDTO(quiz, "https://example.com");

      expect(dto.shareLink).toBeUndefined();
    });

    it("should not include share link when baseUrl not provided", () => {
      const quiz = createMockQuiz(true);
      const dto = toQuizResponseDTO(quiz);

      expect(dto.shareLink).toBeUndefined();
    });
  });
});
