/**
 * Represents the distribution of questions by type
 */
export interface QuizDistribution {
  singleBestAnswer: number;
  twoStatements: number;
  contextual: number;
}

/**
 * Maximum value for each distribution count (8 bits = 0-255)
 */
const MAX_COUNT = 255;

/**
 * Bit positions for each question type in the packed integer
 */
const BIT_POSITIONS = {
  SINGLE_BEST_ANSWER: 0, // Bits 0-7
  TWO_STATEMENTS: 8, // Bits 8-15
  CONTEXTUAL: 16, // Bits 16-23
} as const;

/**
 * QuizDistributionService
 *
 * Domain service responsible for encoding and decoding question distributions.
 * Uses bit-packing to store three 8-bit values in a single 32-bit integer.
 *
 * Bit layout (32-bit integer):
 * - Bits 0-7:   Single Best Answer count (0-255)
 * - Bits 8-15:  Two Statements count (0-255)
 * - Bits 16-23: Contextual count (0-255)
 * - Bits 24-31: Reserved (unused)
 */
export class QuizDistributionService {
  /**
   * Encodes a distribution object into a bit-packed integer
   * @throws {Error} if any count is invalid
   */
  public static encode(distribution: QuizDistribution): number {
    if (!this.validate(distribution)) {
      throw new Error(
        "Invalid distribution: counts must be integers between 0 and 255"
      );
    }

    return (
      (distribution.singleBestAnswer << BIT_POSITIONS.SINGLE_BEST_ANSWER) |
      (distribution.twoStatements << BIT_POSITIONS.TWO_STATEMENTS) |
      (distribution.contextual << BIT_POSITIONS.CONTEXTUAL)
    );
  }

  /**
   * Decodes a bit-packed integer into a distribution object
   */
  public static decode(encoded: number): QuizDistribution {
    // Use unsigned right shift (>>>) to handle potential signed bit issues
    return {
      singleBestAnswer: (encoded >>> BIT_POSITIONS.SINGLE_BEST_ANSWER) & 0xff,
      twoStatements: (encoded >>> BIT_POSITIONS.TWO_STATEMENTS) & 0xff,
      contextual: (encoded >>> BIT_POSITIONS.CONTEXTUAL) & 0xff,
    };
  }

  /**
   * Validates a distribution object
   */
  public static validate(distribution: QuizDistribution): boolean {
    return (
      this.isValidCount(distribution.singleBestAnswer) &&
      this.isValidCount(distribution.twoStatements) &&
      this.isValidCount(distribution.contextual) &&
      this.getTotalFromDistribution(distribution) > 0
    );
  }

  /**
   * Checks if a count value is valid (integer between 0 and 255)
   */
  private static isValidCount(count: number): boolean {
    return (
      typeof count === "number" &&
      Number.isInteger(count) &&
      count >= 0 &&
      count <= MAX_COUNT
    );
  }

  /**
   * Gets the total number of questions from a distribution object
   */
  public static getTotalFromDistribution(
    distribution: QuizDistribution
  ): number {
    return (
      distribution.singleBestAnswer +
      distribution.twoStatements +
      distribution.contextual
    );
  }

  /**
   * Gets the total number of questions from an encoded integer
   */
  public static getTotalQuestions(encoded: number): number {
    const distribution = this.decode(encoded);
    return this.getTotalFromDistribution(distribution);
  }

  /**
   * Creates an empty distribution (all zeros)
   */
  public static createEmpty(): QuizDistribution {
    return {
      singleBestAnswer: 0,
      twoStatements: 0,
      contextual: 0,
    };
  }

  /**
   * Creates a distribution with equal counts for each type
   * @param total Total number of questions (will be divided evenly, remainder goes to singleBestAnswer)
   */
  public static createBalanced(total: number): QuizDistribution {
    if (total <= 0 || total > MAX_COUNT * 3) {
      throw new Error(`Total must be between 1 and ${MAX_COUNT * 3}`);
    }

    const baseCount = Math.floor(total / 3);
    const remainder = total % 3;

    return {
      singleBestAnswer: baseCount + remainder, // Give extra questions to single best answer
      twoStatements: baseCount,
      contextual: baseCount,
    };
  }

  /**
   * Gets the maximum allowed count for any single question type
   */
  public static getMaxCount(): number {
    return MAX_COUNT;
  }
}
