import { describe, expect, it } from "bun:test";
import {
  QuizDistributionService,
  type QuizDistribution,
} from "../../domain/services/quiz-distribution.service";

describe("QuizDistributionService", () => {
  describe("encode", () => {
    it("should encode a valid distribution", () => {
      const distribution: QuizDistribution = {
        singleBestAnswer: 5,
        twoStatements: 3,
        contextual: 2,
      };

      const encoded = QuizDistributionService.encode(distribution);

      // Expected: 5 | (3 << 8) | (2 << 16) = 5 | 768 | 131072 = 131845
      expect(encoded).toBe(131845);
    });

    it("should encode zeros correctly", () => {
      const distribution: QuizDistribution = {
        singleBestAnswer: 1, // At least 1 for validity
        twoStatements: 0,
        contextual: 0,
      };

      const encoded = QuizDistributionService.encode(distribution);
      expect(encoded).toBe(1);
    });

    it("should encode maximum values correctly", () => {
      const distribution: QuizDistribution = {
        singleBestAnswer: 255,
        twoStatements: 255,
        contextual: 255,
      };

      const encoded = QuizDistributionService.encode(distribution);
      // Expected: 255 | (255 << 8) | (255 << 16) = 255 | 65280 | 16711680 = 16777215
      expect(encoded).toBe(16777215);
    });

    it("should encode edge cases", () => {
      // Only singleBestAnswer
      expect(
        QuizDistributionService.encode({
          singleBestAnswer: 10,
          twoStatements: 0,
          contextual: 0,
        })
      ).toBe(10);

      // Only twoStatements
      expect(
        QuizDistributionService.encode({
          singleBestAnswer: 0,
          twoStatements: 10,
          contextual: 0,
        })
      ).toBe(10 << 8);

      // Only contextual
      expect(
        QuizDistributionService.encode({
          singleBestAnswer: 0,
          twoStatements: 0,
          contextual: 10,
        })
      ).toBe(10 << 16);
    });

    it("should throw for negative values", () => {
      expect(() =>
        QuizDistributionService.encode({
          singleBestAnswer: -1,
          twoStatements: 0,
          contextual: 0,
        })
      ).toThrow("Invalid distribution");
    });

    it("should throw for values exceeding 255", () => {
      expect(() =>
        QuizDistributionService.encode({
          singleBestAnswer: 256,
          twoStatements: 0,
          contextual: 0,
        })
      ).toThrow("Invalid distribution");
    });

    it("should throw for non-integer values", () => {
      expect(() =>
        QuizDistributionService.encode({
          singleBestAnswer: 5.5,
          twoStatements: 0,
          contextual: 0,
        })
      ).toThrow("Invalid distribution");
    });

    it("should throw for zero total questions", () => {
      expect(() =>
        QuizDistributionService.encode({
          singleBestAnswer: 0,
          twoStatements: 0,
          contextual: 0,
        })
      ).toThrow("Invalid distribution");
    });
  });

  describe("decode", () => {
    it("should decode an encoded distribution", () => {
      const original: QuizDistribution = {
        singleBestAnswer: 5,
        twoStatements: 3,
        contextual: 2,
      };

      const encoded = QuizDistributionService.encode(original);
      const decoded = QuizDistributionService.decode(encoded);

      expect(decoded).toEqual(original);
    });

    it("should decode zero correctly", () => {
      const decoded = QuizDistributionService.decode(0);

      expect(decoded).toEqual({
        singleBestAnswer: 0,
        twoStatements: 0,
        contextual: 0,
      });
    });

    it("should decode maximum values correctly", () => {
      const decoded = QuizDistributionService.decode(16777215);

      expect(decoded).toEqual({
        singleBestAnswer: 255,
        twoStatements: 255,
        contextual: 255,
      });
    });

    it("should decode individual bits correctly", () => {
      // Only bits 0-7
      expect(QuizDistributionService.decode(100)).toEqual({
        singleBestAnswer: 100,
        twoStatements: 0,
        contextual: 0,
      });

      // Only bits 8-15
      expect(QuizDistributionService.decode(100 << 8)).toEqual({
        singleBestAnswer: 0,
        twoStatements: 100,
        contextual: 0,
      });

      // Only bits 16-23
      expect(QuizDistributionService.decode(100 << 16)).toEqual({
        singleBestAnswer: 0,
        twoStatements: 0,
        contextual: 100,
      });
    });
  });

  describe("encode/decode roundtrip", () => {
    it("should maintain data integrity through encode/decode cycle", () => {
      const testCases: QuizDistribution[] = [
        { singleBestAnswer: 1, twoStatements: 0, contextual: 0 },
        { singleBestAnswer: 0, twoStatements: 1, contextual: 0 },
        { singleBestAnswer: 0, twoStatements: 0, contextual: 1 },
        { singleBestAnswer: 10, twoStatements: 20, contextual: 30 },
        { singleBestAnswer: 100, twoStatements: 100, contextual: 100 },
        { singleBestAnswer: 255, twoStatements: 255, contextual: 255 },
        { singleBestAnswer: 1, twoStatements: 128, contextual: 255 },
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
          singleBestAnswer: 5,
          twoStatements: 3,
          contextual: 2,
        })
      ).toBe(true);

      expect(
        QuizDistributionService.validate({
          singleBestAnswer: 255,
          twoStatements: 255,
          contextual: 255,
        })
      ).toBe(true);

      expect(
        QuizDistributionService.validate({
          singleBestAnswer: 1,
          twoStatements: 0,
          contextual: 0,
        })
      ).toBe(true);
    });

    it("should return false for negative values", () => {
      expect(
        QuizDistributionService.validate({
          singleBestAnswer: -1,
          twoStatements: 0,
          contextual: 0,
        })
      ).toBe(false);
    });

    it("should return false for values exceeding 255", () => {
      expect(
        QuizDistributionService.validate({
          singleBestAnswer: 256,
          twoStatements: 0,
          contextual: 0,
        })
      ).toBe(false);
    });

    it("should return false for non-integer values", () => {
      expect(
        QuizDistributionService.validate({
          singleBestAnswer: 5.5,
          twoStatements: 0,
          contextual: 0,
        })
      ).toBe(false);
    });

    it("should return false for zero total questions", () => {
      expect(
        QuizDistributionService.validate({
          singleBestAnswer: 0,
          twoStatements: 0,
          contextual: 0,
        })
      ).toBe(false);
    });
  });

  describe("getTotalFromDistribution", () => {
    it("should calculate total correctly", () => {
      expect(
        QuizDistributionService.getTotalFromDistribution({
          singleBestAnswer: 5,
          twoStatements: 3,
          contextual: 2,
        })
      ).toBe(10);

      expect(
        QuizDistributionService.getTotalFromDistribution({
          singleBestAnswer: 0,
          twoStatements: 0,
          contextual: 0,
        })
      ).toBe(0);

      expect(
        QuizDistributionService.getTotalFromDistribution({
          singleBestAnswer: 255,
          twoStatements: 255,
          contextual: 255,
        })
      ).toBe(765);
    });
  });

  describe("getTotalQuestions", () => {
    it("should calculate total from encoded value", () => {
      const distribution: QuizDistribution = {
        singleBestAnswer: 5,
        twoStatements: 3,
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
        singleBestAnswer: 0,
        twoStatements: 0,
        contextual: 0,
      });
    });
  });

  describe("createBalanced", () => {
    it("should create balanced distribution for divisible by 3", () => {
      const balanced = QuizDistributionService.createBalanced(30);

      expect(balanced).toEqual({
        singleBestAnswer: 10,
        twoStatements: 10,
        contextual: 10,
      });
    });

    it("should give remainder to singleBestAnswer", () => {
      const balanced = QuizDistributionService.createBalanced(10);

      // 10 / 3 = 3 with remainder 1
      expect(balanced).toEqual({
        singleBestAnswer: 4, // 3 + 1
        twoStatements: 3,
        contextual: 3,
      });
    });

    it("should handle remainder of 2", () => {
      const balanced = QuizDistributionService.createBalanced(11);

      // 11 / 3 = 3 with remainder 2
      expect(balanced).toEqual({
        singleBestAnswer: 5, // 3 + 2
        twoStatements: 3,
        contextual: 3,
      });
    });

    it("should handle minimum total of 1", () => {
      const balanced = QuizDistributionService.createBalanced(1);

      expect(balanced).toEqual({
        singleBestAnswer: 1,
        twoStatements: 0,
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
        singleBestAnswer: 255,
        twoStatements: 255,
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
