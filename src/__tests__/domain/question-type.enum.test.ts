import { describe, expect, it } from "bun:test";
import {
  QuestionType,
  isQuestionType,
  getQuestionTypeDisplayName,
} from "../../domain/enums/question-type.enum";

describe("QuestionType Enum", () => {
  describe("enum values", () => {
    it("should have DIRECT_QUESTION with correct value", () => {
      expect(QuestionType.DIRECT_QUESTION).toBe(
        "direct_question" as QuestionType
      );
    });

    it("should have TWO_STATEMENT_COMPOUND with correct value", () => {
      expect(QuestionType.TWO_STATEMENT_COMPOUND).toBe(
        "two_statement_compound" as QuestionType
      );
    });

    it("should have CONTEXTUAL with correct value", () => {
      expect(QuestionType.CONTEXTUAL).toBe("contextual" as QuestionType);
    });

    it("should have exactly 3 question types", () => {
      const values = Object.values(QuestionType);
      expect(values).toHaveLength(3);
    });
  });

  describe("isQuestionType", () => {
    it("should return true for valid QuestionType values", () => {
      expect(isQuestionType("direct_question")).toBe(true);
      expect(isQuestionType("two_statement_compound")).toBe(true);
      expect(isQuestionType("contextual")).toBe(true);
    });

    it("should return false for invalid string values", () => {
      expect(isQuestionType("invalid")).toBe(false);
      expect(isQuestionType("DIRECT_QUESTION")).toBe(false);
      expect(isQuestionType("")).toBe(false);
    });

    it("should return false for non-string values", () => {
      expect(isQuestionType(null)).toBe(false);
      expect(isQuestionType(undefined)).toBe(false);
      expect(isQuestionType(123)).toBe(false);
      expect(isQuestionType({})).toBe(false);
      expect(isQuestionType([])).toBe(false);
    });
  });

  describe("getQuestionTypeDisplayName", () => {
    it("should return correct display name for DIRECT_QUESTION", () => {
      expect(getQuestionTypeDisplayName(QuestionType.DIRECT_QUESTION)).toBe(
        "Direct Question"
      );
    });

    it("should return correct display name for TWO_STATEMENT_COMPOUND", () => {
      expect(
        getQuestionTypeDisplayName(QuestionType.TWO_STATEMENT_COMPOUND)
      ).toBe("Two-Statement Compound");
    });

    it("should return correct display name for CONTEXTUAL", () => {
      expect(getQuestionTypeDisplayName(QuestionType.CONTEXTUAL)).toBe(
        "Contextual"
      );
    });
  });
});
