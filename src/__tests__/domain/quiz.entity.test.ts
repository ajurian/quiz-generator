import { describe, expect, it, beforeEach, mock } from "bun:test";
import { Quiz, type CreateQuizProps } from "../../domain/entities/quiz.entity";
import {
  QuizDistributionService,
  type QuizDistribution,
} from "../../domain/services/quiz-distribution.service";

describe("Quiz Entity", () => {
  // Helper to create valid props
  const createValidProps = (
    overrides?: Partial<CreateQuizProps>
  ): CreateQuizProps => ({
    id: "quiz-123",
    userId: "user-456",
    title: "Test Quiz",
    distribution: {
      singleBestAnswer: 5,
      twoStatements: 3,
      contextual: 2,
    },
    isPublic: false,
    ...overrides,
  });

  describe("create", () => {
    it("should create a valid Quiz", () => {
      const props = createValidProps();
      const quiz = Quiz.create(props);

      expect(quiz.id).toBe("quiz-123");
      expect(quiz.userId).toBe("user-456");
      expect(quiz.title).toBe("Test Quiz");
      expect(quiz.isPublic).toBe(false);
      expect(quiz.createdAt).toBeInstanceOf(Date);
      expect(quiz.updatedAt).toBeInstanceOf(Date);
    });

    it("should set isPublic to false by default", () => {
      const props = createValidProps();
      delete (props as any).isPublic;
      const quiz = Quiz.create(props);

      expect(quiz.isPublic).toBe(false);
    });

    it("should set isPublic to true when specified", () => {
      const quiz = Quiz.create(createValidProps({ isPublic: true }));
      expect(quiz.isPublic).toBe(true);
    });

    it("should encode distribution correctly", () => {
      const distribution: QuizDistribution = {
        singleBestAnswer: 10,
        twoStatements: 5,
        contextual: 3,
      };
      const quiz = Quiz.create(createValidProps({ distribution }));

      expect(quiz.distribution).toEqual(distribution);
    });

    describe("validation errors", () => {
      it("should throw for missing id", () => {
        expect(() => Quiz.create(createValidProps({ id: "" }))).toThrow(
          "Quiz ID is required"
        );
      });

      it("should throw for missing userId", () => {
        expect(() => Quiz.create(createValidProps({ userId: "" }))).toThrow(
          "User ID is required"
        );
      });

      it("should throw for empty title", () => {
        expect(() => Quiz.create(createValidProps({ title: "" }))).toThrow(
          "Quiz title is required and cannot be empty"
        );
      });

      it("should throw for whitespace-only title", () => {
        expect(() => Quiz.create(createValidProps({ title: "   " }))).toThrow(
          "Quiz title is required and cannot be empty"
        );
      });

      it("should throw for title exceeding 255 characters", () => {
        const longTitle = "a".repeat(256);
        expect(() =>
          Quiz.create(createValidProps({ title: longTitle }))
        ).toThrow("Quiz title cannot exceed 255 characters");
      });

      it("should throw for invalid distribution", () => {
        expect(() =>
          Quiz.create(
            createValidProps({
              distribution: {
                singleBestAnswer: -1,
                twoStatements: 0,
                contextual: 0,
              },
            })
          )
        ).toThrow("Invalid question distribution");
      });

      it("should throw for zero total questions", () => {
        expect(() =>
          Quiz.create(
            createValidProps({
              distribution: {
                singleBestAnswer: 0,
                twoStatements: 0,
                contextual: 0,
              },
            })
          )
        ).toThrow("Invalid question distribution");
      });
    });
  });

  describe("reconstitute", () => {
    it("should reconstitute a Quiz from persisted data", () => {
      const createdAt = new Date("2024-01-01");
      const updatedAt = new Date("2024-01-02");
      const encodedDistribution = QuizDistributionService.encode({
        singleBestAnswer: 5,
        twoStatements: 3,
        contextual: 2,
      });

      const quiz = Quiz.reconstitute({
        id: "quiz-123",
        userId: "018e3f5e-5f2a-7c2b-b3a4-9f8d6c4b2a10",
        title: "Reconstituted Quiz",
        createdAt,
        updatedAt,
        isPublic: true,
        questionDistribution: encodedDistribution,
      });

      expect(quiz.id).toBe("quiz-123");
      expect(quiz.userId).toBe("018e3f5e-5f2a-7c2b-b3a4-9f8d6c4b2a10");
      expect(quiz.title).toBe("Reconstituted Quiz");
      expect(quiz.createdAt).toBe(createdAt);
      expect(quiz.updatedAt).toBe(updatedAt);
      expect(quiz.isPublic).toBe(true);
      expect(quiz.questionDistribution).toBe(encodedDistribution);
    });

    it("should throw for invalid dates", () => {
      expect(() =>
        Quiz.reconstitute({
          id: "quiz-123",
          userId: "018e3f5e-5f2a-7c2b-b3a4-9f8d6c4b2a10",
          title: "Test",
          createdAt: new Date("invalid"),
          updatedAt: new Date(),
          isPublic: false,
          questionDistribution: 1,
        })
      ).toThrow("Valid createdAt date is required");
    });
  });

  describe("totalQuestions", () => {
    it("should compute total questions correctly", () => {
      const quiz = Quiz.create(
        createValidProps({
          distribution: {
            singleBestAnswer: 10,
            twoStatements: 5,
            contextual: 3,
          },
        })
      );

      expect(quiz.totalQuestions).toBe(18);
    });

    it("should handle edge case with all zeros after reconstitution", () => {
      const quiz = Quiz.reconstitute({
        id: "quiz-123",
        userId: "user-456",
        title: "Test",
        createdAt: new Date(),
        updatedAt: new Date(),
        isPublic: false,
        questionDistribution: 0,
      });

      expect(quiz.totalQuestions).toBe(0);
    });
  });

  describe("distribution", () => {
    it("should decode distribution correctly", () => {
      const distribution: QuizDistribution = {
        singleBestAnswer: 15,
        twoStatements: 10,
        contextual: 5,
      };
      const quiz = Quiz.create(createValidProps({ distribution }));

      expect(quiz.distribution).toEqual(distribution);
    });
  });

  describe("updateTitle", () => {
    it("should update the title", () => {
      const quiz = Quiz.create(createValidProps({ title: "Original Title" }));
      const originalUpdatedAt = quiz.updatedAt;

      // Wait a bit to ensure timestamp changes
      quiz.updateTitle("New Title");

      expect(quiz.title).toBe("New Title");
      expect(quiz.updatedAt.getTime()).toBeGreaterThanOrEqual(
        originalUpdatedAt.getTime()
      );
    });

    it("should trim the title", () => {
      const quiz = Quiz.create(createValidProps());
      quiz.updateTitle("  Trimmed Title  ");

      expect(quiz.title).toBe("Trimmed Title");
    });

    it("should throw for empty title", () => {
      const quiz = Quiz.create(createValidProps());

      expect(() => quiz.updateTitle("")).toThrow(
        "Quiz title is required and cannot be empty"
      );
    });

    it("should throw for title exceeding 255 characters", () => {
      const quiz = Quiz.create(createValidProps());

      expect(() => quiz.updateTitle("a".repeat(256))).toThrow(
        "Quiz title cannot exceed 255 characters"
      );
    });
  });

  describe("visibility methods", () => {
    describe("makePublic", () => {
      it("should make the quiz public", () => {
        const quiz = Quiz.create(createValidProps({ isPublic: false }));
        quiz.makePublic();

        expect(quiz.isPublic).toBe(true);
      });

      it("should update updatedAt timestamp", () => {
        const quiz = Quiz.create(createValidProps({ isPublic: false }));
        const originalUpdatedAt = quiz.updatedAt;

        quiz.makePublic();

        expect(quiz.updatedAt.getTime()).toBeGreaterThanOrEqual(
          originalUpdatedAt.getTime()
        );
      });
    });

    describe("makePrivate", () => {
      it("should make the quiz private", () => {
        const quiz = Quiz.create(createValidProps({ isPublic: true }));
        quiz.makePrivate();

        expect(quiz.isPublic).toBe(false);
      });
    });

    describe("toggleVisibility", () => {
      it("should toggle from private to public and return new state", () => {
        const quiz = Quiz.create(createValidProps({ isPublic: false }));
        const result = quiz.toggleVisibility();

        expect(result).toBe(true);
        expect(quiz.isPublic).toBe(true);
      });

      it("should toggle from public to private and return new state", () => {
        const quiz = Quiz.create(createValidProps({ isPublic: true }));
        const result = quiz.toggleVisibility();

        expect(result).toBe(false);
        expect(quiz.isPublic).toBe(false);
      });
    });
  });

  describe("updateDistribution", () => {
    it("should update the distribution", () => {
      const quiz = Quiz.create(createValidProps());
      const newDistribution: QuizDistribution = {
        singleBestAnswer: 20,
        twoStatements: 15,
        contextual: 10,
      };

      quiz.updateDistribution(newDistribution);

      expect(quiz.distribution).toEqual(newDistribution);
      expect(quiz.totalQuestions).toBe(45);
    });

    it("should throw for invalid distribution", () => {
      const quiz = Quiz.create(createValidProps());

      expect(() =>
        quiz.updateDistribution({
          singleBestAnswer: -1,
          twoStatements: 0,
          contextual: 0,
        })
      ).toThrow("Invalid question distribution");
    });
  });

  describe("isOwnedBy", () => {
    it("should return true for the owner", () => {
      const ownerId = "018e3f5e-5f2a-7c2b-b3a4-9f8d6c4b2a10";
      const quiz = Quiz.create(createValidProps({ userId: ownerId }));

      expect(quiz.isOwnedBy(ownerId)).toBe(true);
    });

    it("should return false for non-owner", () => {
      const ownerId = "018e3f5e-5f2a-7c2b-b3a4-9f8d6c4b2a10";
      const otherUserId = "019b2194-72a0-7000-a712-5e5bc5c313c0";
      const quiz = Quiz.create(createValidProps({ userId: ownerId }));

      expect(quiz.isOwnedBy(otherUserId)).toBe(false);
    });
  });

  describe("canBeAccessedBy", () => {
    it("should return true for public quiz with any user", () => {
      const otherUserId = "019b2194-72a0-7000-a712-5e5bc5c313c0";
      const quiz = Quiz.create(
        createValidProps({
          isPublic: true,
          userId: "018e3f5e-5f2a-7c2b-b3a4-9f8d6c4b2a10",
        })
      );

      expect(quiz.canBeAccessedBy(otherUserId)).toBe(true);
      expect(quiz.canBeAccessedBy(null)).toBe(true);
    });

    it("should return true for private quiz with owner", () => {
      const ownerId = "018e3f5e-5f2a-7c2b-b3a4-9f8d6c4b2a10";
      const quiz = Quiz.create(
        createValidProps({ isPublic: false, userId: ownerId })
      );

      expect(quiz.canBeAccessedBy(ownerId)).toBe(true);
    });

    it("should return false for private quiz with non-owner", () => {
      const otherUserId = "019b2194-72a0-7000-a712-5e5bc5c313c0";
      const quiz = Quiz.create(
        createValidProps({
          isPublic: false,
          userId: "018e3f5e-5f2a-7c2b-b3a4-9f8d6c4b2a10",
        })
      );

      expect(quiz.canBeAccessedBy(otherUserId)).toBe(false);
    });

    it("should return false for private quiz with null user", () => {
      const quiz = Quiz.create(
        createValidProps({
          isPublic: false,
          userId: "018e3f5e-5f2a-7c2b-b3a4-9f8d6c4b2a10",
        })
      );

      expect(quiz.canBeAccessedBy(null)).toBe(false);
    });
  });

  describe("toPlain", () => {
    it("should convert to plain object", () => {
      const quiz = Quiz.create(createValidProps());
      const plain = quiz.toPlain();

      expect(plain.id).toBe("quiz-123");
      expect(plain.userId).toBe("user-456");
      expect(plain.title).toBe("Test Quiz");
      expect(plain.isPublic).toBe(false);
      expect(plain.createdAt).toBeInstanceOf(Date);
      expect(plain.updatedAt).toBeInstanceOf(Date);
      expect(typeof plain.questionDistribution).toBe("number");
    });
  });
});
