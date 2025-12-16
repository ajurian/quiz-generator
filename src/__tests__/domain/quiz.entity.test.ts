import { describe, expect, it, beforeEach, mock } from "bun:test";
import { Quiz, type CreateQuizProps } from "../../domain/entities/quiz.entity";
import {
  QuizDistributionService,
  type QuizDistribution,
} from "../../domain/services/quiz-distribution.service";
import { QuizVisibility } from "../../domain";

describe("Quiz Entity", () => {
  // Valid UUIDs for testing (slug generation requires valid UUID format)
  const QUIZ_ID = "019b2194-72a0-7000-a712-5e5bc5c313c1";
  const USER_ID = "018e3f5e-5f2a-7c2b-b3a4-9f8d6c4b2a10";
  const OTHER_USER_ID = "019b2194-72a0-7000-a712-5e5bc5c313c0";

  // Helper to create valid props
  const createValidProps = (
    overrides?: Partial<CreateQuizProps>
  ): CreateQuizProps => ({
    id: QUIZ_ID,
    userId: USER_ID,
    title: "Test Quiz",
    distribution: {
      singleBestAnswer: 5,
      twoStatements: 3,
      contextual: 2,
    },
    visibility: QuizVisibility.PRIVATE,
    ...overrides,
  });

  describe("create", () => {
    it("should create a valid Quiz", () => {
      const props = createValidProps();
      const quiz = Quiz.create(props);

      expect(quiz.id).toBe(QUIZ_ID);
      expect(quiz.userId).toBe(USER_ID);
      expect(quiz.title).toBe("Test Quiz");
      expect(quiz.visibility).toBe(QuizVisibility.PRIVATE);
      expect(quiz.createdAt).toBeInstanceOf(Date);
      expect(quiz.updatedAt).toBeInstanceOf(Date);
    });

    it("should set visibility to PRIVATE by default", () => {
      const props = createValidProps();
      delete (props as any).visibility;
      const quiz = Quiz.create(props);

      expect(quiz.visibility).toBe(QuizVisibility.PRIVATE);
    });

    it("should set visibility to PUBLIC when specified", () => {
      const quiz = Quiz.create(
        createValidProps({ visibility: QuizVisibility.PUBLIC })
      );
      expect(quiz.visibility).toBe(QuizVisibility.PUBLIC);
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
        id: QUIZ_ID,
        slug: "AZshlHKgcACnEl5bxcMTwQ",
        userId: USER_ID,
        title: "Reconstituted Quiz",
        createdAt,
        updatedAt,
        visibility: QuizVisibility.PUBLIC,
        questionDistribution: encodedDistribution,
      });

      expect(quiz.id).toBe(QUIZ_ID);
      expect(quiz.slug).toBe("AZshlHKgcACnEl5bxcMTwQ");
      expect(quiz.userId).toBe(USER_ID);
      expect(quiz.title).toBe("Reconstituted Quiz");
      expect(quiz.createdAt).toBe(createdAt);
      expect(quiz.updatedAt).toBe(updatedAt);
      expect(quiz.visibility).toBe(QuizVisibility.PUBLIC);
      expect(quiz.questionDistribution).toBe(encodedDistribution);
    });

    it("should throw for invalid dates", () => {
      expect(() =>
        Quiz.reconstitute({
          id: QUIZ_ID,
          slug: "AZshlHKgcACnEl5bxcMTwQ",
          userId: USER_ID,
          title: "Test",
          createdAt: new Date("invalid"),
          updatedAt: new Date(),
          visibility: QuizVisibility.PRIVATE,
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
        id: QUIZ_ID,
        slug: "AZshlHKgcACnEl5bxcMTwQ",
        userId: USER_ID,
        title: "Test",
        createdAt: new Date(),
        updatedAt: new Date(),
        visibility: QuizVisibility.PRIVATE,
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
    describe("setVisibility", () => {
      it("should set the quiz to public", () => {
        const quiz = Quiz.create(
          createValidProps({ visibility: QuizVisibility.PRIVATE })
        );
        quiz.setVisibility(QuizVisibility.PUBLIC);

        expect(quiz.visibility).toBe(QuizVisibility.PUBLIC);
      });

      it("should set the quiz to unlisted", () => {
        const quiz = Quiz.create(
          createValidProps({ visibility: QuizVisibility.PRIVATE })
        );
        quiz.setVisibility(QuizVisibility.UNLISTED);

        expect(quiz.visibility).toBe(QuizVisibility.UNLISTED);
      });

      it("should set the quiz to private", () => {
        const quiz = Quiz.create(
          createValidProps({ visibility: QuizVisibility.PUBLIC })
        );
        quiz.setVisibility(QuizVisibility.PRIVATE);

        expect(quiz.visibility).toBe(QuizVisibility.PRIVATE);
      });

      it("should update updatedAt timestamp", () => {
        const quiz = Quiz.create(
          createValidProps({ visibility: QuizVisibility.PRIVATE })
        );
        const originalUpdatedAt = quiz.updatedAt;

        quiz.setVisibility(QuizVisibility.PUBLIC);

        expect(quiz.updatedAt.getTime()).toBeGreaterThanOrEqual(
          originalUpdatedAt.getTime()
        );
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
          visibility: QuizVisibility.PUBLIC,
          userId: "018e3f5e-5f2a-7c2b-b3a4-9f8d6c4b2a10",
        })
      );

      expect(quiz.canBeAccessedBy(otherUserId)).toBe(true);
      expect(quiz.canBeAccessedBy(null)).toBe(true);
    });

    it("should return true for unlisted quiz with any user", () => {
      const otherUserId = "019b2194-72a0-7000-a712-5e5bc5c313c0";
      const quiz = Quiz.create(
        createValidProps({
          visibility: QuizVisibility.UNLISTED,
          userId: "018e3f5e-5f2a-7c2b-b3a4-9f8d6c4b2a10",
        })
      );

      expect(quiz.canBeAccessedBy(otherUserId)).toBe(true);
      expect(quiz.canBeAccessedBy(null)).toBe(true);
    });

    it("should return true for private quiz with owner", () => {
      const ownerId = "018e3f5e-5f2a-7c2b-b3a4-9f8d6c4b2a10";
      const quiz = Quiz.create(
        createValidProps({
          visibility: QuizVisibility.PRIVATE,
          userId: ownerId,
        })
      );

      expect(quiz.canBeAccessedBy(ownerId)).toBe(true);
    });

    it("should return false for private quiz with non-owner", () => {
      const otherUserId = "019b2194-72a0-7000-a712-5e5bc5c313c0";
      const quiz = Quiz.create(
        createValidProps({
          visibility: QuizVisibility.PRIVATE,
          userId: "018e3f5e-5f2a-7c2b-b3a4-9f8d6c4b2a10",
        })
      );

      expect(quiz.canBeAccessedBy(otherUserId)).toBe(false);
    });

    it("should return false for private quiz with null user", () => {
      const quiz = Quiz.create(
        createValidProps({
          visibility: QuizVisibility.PRIVATE,
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

      expect(plain.id).toBe(QUIZ_ID);
      expect(plain.userId).toBe(USER_ID);
      expect(plain.title).toBe("Test Quiz");
      expect(plain.visibility).toBe(QuizVisibility.PRIVATE);
      expect(plain.createdAt).toBeInstanceOf(Date);
      expect(plain.updatedAt).toBeInstanceOf(Date);
      expect(typeof plain.questionDistribution).toBe("number");
    });
  });
});
