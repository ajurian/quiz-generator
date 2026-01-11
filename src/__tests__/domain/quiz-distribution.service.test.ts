import { describe, expect, it } from "bun:test";
import {
  QuizDistributionService,
  type QuizDistribution,
} from "@/domain/services/quiz-distribution.service";

describe("QuizDistributionService", () => {
  describe("encode", () => {
    it("should encode a valid distribution", () => {
      const distribution: QuizDistribution = {
        directQuestion: 5,
        twoStatementCompound: 3,
        contextual: 2,
      };

      const encoded = QuizDistributionService.encode(distribution);

      // Expected: 5 | (3 << 8) | (2 << 16) = 5 | 768 | 131072 = 131845
      expect(encoded).toBe(131845);
    });

    it("should encode zeros correctly", () => {
      const distribution: QuizDistribution = {
        directQuestion: 1, // At least 1 for validity
        twoStatementCompound: 0,
        contextual: 0,
      };

      const encoded = QuizDistributionService.encode(distribution);
      expect(encoded).toBe(1);
    });

    it("should encode maximum values correctly", () => {
      const distribution: QuizDistribution = {
        directQuestion: 255,
        twoStatementCompound: 255,
        contextual: 255,
      };

      const encoded = QuizDistributionService.encode(distribution);
      // Expected: 255 | (255 << 8) | (255 << 16) = 255 | 65280 | 16711680 = 16777215
      expect(encoded).toBe(16777215);
    });

    it("should encode edge cases", () => {
      // Only directQuestion
      expect(
        QuizDistributionService.encode({
          directQuestion: 10,
          twoStatementCompound: 0,
          contextual: 0,
        })
      ).toBe(10);

      // Only twoStatementCompound
      expect(
        QuizDistributionService.encode({
          directQuestion: 0,
          twoStatementCompound: 10,
          contextual: 0,
        })
      ).toBe(10 << 8);

      // Only contextual
      expect(
        QuizDistributionService.encode({
          directQuestion: 0,
          twoStatementCompound: 0,
          contextual: 10,
        })
      ).toBe(10 << 16);
    });

    it("should throw for negative values", () => {
      expect(() =>
        QuizDistributionService.encode({
          directQuestion: -1,
          twoStatementCompound: 0,
          contextual: 0,
        })
      ).toThrow("Invalid distribution");
    });

    it("should throw for values exceeding 255", () => {
      expect(() =>
        QuizDistributionService.encode({
          directQuestion: 256,
          twoStatementCompound: 0,
          contextual: 0,
        })
      ).toThrow("Invalid distribution");
    });

    it("should throw for non-integer values", () => {
      expect(() =>
        QuizDistributionService.encode({
          directQuestion: 5.5,
          twoStatementCompound: 0,
          contextual: 0,
        })
      ).toThrow("Invalid distribution");
    });

    it("should throw for zero total questions", () => {
      expect(() =>
        QuizDistributionService.encode({
          directQuestion: 0,
          twoStatementCompound: 0,
          contextual: 0,
        })
      ).toThrow("Invalid distribution");
    });
  });

  describe("decode", () => {
    it("should decode an encoded distribution", () => {
      const original: QuizDistribution = {
        directQuestion: 5,
        twoStatementCompound: 3,
        contextual: 2,
      };

      const encoded = QuizDistributionService.encode(original);
      const decoded = QuizDistributionService.decode(encoded);

      expect(decoded).toEqual(original);
    });

    it("should decode zero correctly", () => {
      const decoded = QuizDistributionService.decode(0);

      expect(decoded).toEqual({
        directQuestion: 0,
        twoStatementCompound: 0,
        contextual: 0,
      });
    });

    it("should decode maximum values correctly", () => {
      const decoded = QuizDistributionService.decode(16777215);

      expect(decoded).toEqual({
        directQuestion: 255,
        twoStatementCompound: 255,
        contextual: 255,
      });
    });

    it("should decode individual bits correctly", () => {
      // Only bits 0-7
      expect(QuizDistributionService.decode(100)).toEqual({
        directQuestion: 100,
        twoStatementCompound: 0,
        contextual: 0,
      });

      // Only bits 8-15
      expect(QuizDistributionService.decode(100 << 8)).toEqual({
        directQuestion: 0,
        twoStatementCompound: 100,
        contextual: 0,
      });

      // Only bits 16-23
      expect(QuizDistributionService.decode(100 << 16)).toEqual({
        directQuestion: 0,
        twoStatementCompound: 0,
        contextual: 100,
      });
    });
  });

  describe("encode/decode roundtrip", () => {
    it("should maintain data integrity through encode/decode cycle", () => {
      const testCases: QuizDistribution[] = [
        { directQuestion: 1, twoStatementCompound: 0, contextual: 0 },
        { directQuestion: 0, twoStatementCompound: 1, contextual: 0 },
        { directQuestion: 0, twoStatementCompound: 0, contextual: 1 },
        { directQuestion: 10, twoStatementCompound: 20, contextual: 30 },
        { directQuestion: 100, twoStatementCompound: 100, contextual: 100 },
        { directQuestion: 255, twoStatementCompound: 255, contextual: 255 },
        { directQuestion: 1, twoStatementCompound: 128, contextual: 255 },
      ];

      for (const original of testCases) {
        const encoded = QuizDistributionService.encode(original);
        const decoded = QuizDistributionService.decode(encoded);
        expect(decoded).toEqual(original);
      }
    });
  });

  describe("validate", () => {
    it("should return true for valid distributions", () => {
      expect(
        QuizDistributionService.validate({
          directQuestion: 5,
          twoStatementCompound: 3,
          contextual: 2,
        })
      ).toBe(true);

      expect(
        QuizDistributionService.validate({
          directQuestion: 255,
          twoStatementCompound: 255,
          contextual: 255,
        })
      ).toBe(true);

      expect(
        QuizDistributionService.validate({
          directQuestion: 1,
          twoStatementCompound: 0,
          contextual: 0,
        })
      ).toBe(true);
    });

    it("should return false for negative values", () => {
      expect(
        QuizDistributionService.validate({
          directQuestion: -1,
          twoStatementCompound: 0,
          contextual: 0,
        })
      ).toBe(false);
    });

    it("should return false for values exceeding 255", () => {
      expect(
        QuizDistributionService.validate({
          directQuestion: 256,
          twoStatementCompound: 0,
          contextual: 0,
        })
      ).toBe(false);
    });

    it("should return false for non-integer values", () => {
      expect(
        QuizDistributionService.validate({
          directQuestion: 5.5,
          twoStatementCompound: 0,
          contextual: 0,
        })
      ).toBe(false);
    });

    it("should return false for zero total questions", () => {
      expect(
        QuizDistributionService.validate({
          directQuestion: 0,
          twoStatementCompound: 0,
          contextual: 0,
        })
      ).toBe(false);
    });
  });

  describe("getTotalFromDistribution", () => {
    it("should calculate total correctly", () => {
      expect(
        QuizDistributionService.getTotalFromDistribution({
          directQuestion: 5,
          twoStatementCompound: 3,
          contextual: 2,
        })
      ).toBe(10);

      expect(
        QuizDistributionService.getTotalFromDistribution({
          directQuestion: 0,
          twoStatementCompound: 0,
          contextual: 0,
        })
      ).toBe(0);

      expect(
        QuizDistributionService.getTotalFromDistribution({
          directQuestion: 255,
          twoStatementCompound: 255,
          contextual: 255,
        })
      ).toBe(765);
    });
  });

  describe("getTotalQuestions", () => {
    it("should calculate total from encoded value", () => {
      const distribution: QuizDistribution = {
        directQuestion: 5,
        twoStatementCompound: 3,
        contextual: 2,
      };
      const encoded = QuizDistributionService.encode(distribution);

      expect(QuizDistributionService.getTotalQuestions(encoded)).toBe(10);
    });

    it("should return 0 for encoded 0", () => {
      expect(QuizDistributionService.getTotalQuestions(0)).toBe(0);
    });
  });

  describe("createEmpty", () => {
    it("should create distribution with all zeros", () => {
      const empty = QuizDistributionService.createEmpty();

      expect(empty).toEqual({
        directQuestion: 0,
        twoStatementCompound: 0,
        contextual: 0,
      });
    });
  });

  describe("createBalanced", () => {
    it("should create balanced distribution for divisible by 3", () => {
      const balanced = QuizDistributionService.createBalanced(30);

      expect(balanced).toEqual({
        directQuestion: 10,
        twoStatementCompound: 10,
        contextual: 10,
      });
    });

    it("should give remainder to directQuestion", () => {
      const balanced = QuizDistributionService.createBalanced(10);

      // 10 / 3 = 3 with remainder 1
      expect(balanced).toEqual({
        directQuestion: 4, // 3 + 1
        twoStatementCompound: 3,
        contextual: 3,
      });
    });

    it("should handle remainder of 2", () => {
      const balanced = QuizDistributionService.createBalanced(11);

      // 11 / 3 = 3 with remainder 2
      expect(balanced).toEqual({
        directQuestion: 5, // 3 + 2
        twoStatementCompound: 3,
        contextual: 3,
      });
    });

    it("should handle minimum total of 1", () => {
      const balanced = QuizDistributionService.createBalanced(1);

      expect(balanced).toEqual({
        directQuestion: 1,
        twoStatementCompound: 0,
        contextual: 0,
      });
    });

    it("should throw for zero total", () => {
      expect(() => QuizDistributionService.createBalanced(0)).toThrow(
        "Total must be between 1 and 765"
      );
    });

    it("should throw for negative total", () => {
      expect(() => QuizDistributionService.createBalanced(-1)).toThrow(
        "Total must be between 1 and 765"
      );
    });

    it("should throw for total exceeding maximum", () => {
      expect(() => QuizDistributionService.createBalanced(766)).toThrow(
        "Total must be between 1 and 765"
      );
    });

    it("should handle maximum valid total", () => {
      const balanced = QuizDistributionService.createBalanced(765);

      expect(balanced).toEqual({
        directQuestion: 255,
        twoStatementCompound: 255,
        contextual: 255,
      });
    });
  });

  describe("getMaxCount", () => {
    it("should return 255", () => {
      expect(QuizDistributionService.getMaxCount()).toBe(255);
    });
  });
});
