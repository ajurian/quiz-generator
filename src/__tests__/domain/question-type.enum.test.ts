import { describe, expect, it } from "bun:test";
import {
  QuestionType,
  isQuestionType,
  getQuestionTypeDisplayName,
} from "../../domain/enums/question-type.enum";

describe("QuestionType Enum", () => {
  describe("enum values", () => {
    it("should have SINGLE_BEST_ANSWER with correct value", () => {
      expect(QuestionType.SINGLE_BEST_ANSWER).toBe(
        "single_best_answer" as QuestionType
      );
    });

    it("should have TWO_STATEMENTS with correct value", () => {
      expect(QuestionType.TWO_STATEMENTS).toBe(
        "two_statements" as QuestionType
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
      expect(isQuestionType("single_best_answer")).toBe(true);
      expect(isQuestionType("two_statements")).toBe(true);
      expect(isQuestionType("contextual")).toBe(true);
    });

    it("should return false for invalid string values", () => {
      expect(isQuestionType("invalid")).toBe(false);
      expect(isQuestionType("SINGLE_BEST_ANSWER")).toBe(false);
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
    it("should return correct display name for SINGLE_BEST_ANSWER", () => {
      expect(getQuestionTypeDisplayName(QuestionType.SINGLE_BEST_ANSWER)).toBe(
        "Single Best Answer"
      );
    });

    it("should return correct display name for TWO_STATEMENTS", () => {
      expect(getQuestionTypeDisplayName(QuestionType.TWO_STATEMENTS)).toBe(
        "Two Statements"
      );
    });

    it("should return correct display name for CONTEXTUAL", () => {
      expect(getQuestionTypeDisplayName(QuestionType.CONTEXTUAL)).toBe(
        "Contextual"
      );
    });
  });
});
