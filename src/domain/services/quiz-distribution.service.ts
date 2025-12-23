/**
 * Represents the distribution of questions by type
 */
export interface QuizDistribution {
  directQuestion: number;
  twoStatementCompound: number;
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
  DIRECT_QUESTION: 0, // Bits 0-7
  TWO_STATEMENT_COMPOUND: 8, // Bits 8-15
  CONTEXTUAL: 16, // Bits 16-23
} as const;

/**
 * QuizDistributionService
 *
 * Domain service responsible for encoding and decoding question distributions.
 * Uses bit-packing to store three 8-bit values in a single 32-bit integer.
 *
 * Bit layout (32-bit integer):
 * - Bits 0-7:   Direct Question count (0-255)
 * - Bits 8-15:  Two-Statement Compound count (0-255)
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
      (distribution.directQuestion << BIT_POSITIONS.DIRECT_QUESTION) |
      (distribution.twoStatementCompound <<
        BIT_POSITIONS.TWO_STATEMENT_COMPOUND) |
      (distribution.contextual << BIT_POSITIONS.CONTEXTUAL)
    );
  }

  /**
   * Decodes a bit-packed integer into a distribution object
   */
  public static decode(encoded: number): QuizDistribution {
    // Use unsigned right shift (>>>) to handle potential signed bit issues
    return {
      directQuestion: (encoded >>> BIT_POSITIONS.DIRECT_QUESTION) & 0xff,
      twoStatementCompound:
        (encoded >>> BIT_POSITIONS.TWO_STATEMENT_COMPOUND) & 0xff,
      contextual: (encoded >>> BIT_POSITIONS.CONTEXTUAL) & 0xff,
    };
  }

  /**
   * Validates a distribution object
   */
  public static validate(distribution: QuizDistribution): boolean {
    return (
      this.isValidCount(distribution.directQuestion) &&
      this.isValidCount(distribution.twoStatementCompound) &&
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
      distribution.directQuestion +
      distribution.twoStatementCompound +
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
      directQuestion: 0,
      twoStatementCompound: 0,
      contextual: 0,
    };
  }

  /**
   * Creates a distribution with equal counts for each type
   * @param total Total number of questions (will be divided evenly, remainder goes to directQuestion)
   */
  public static createBalanced(total: number): QuizDistribution {
    if (total <= 0 || total > MAX_COUNT * 3) {
      throw new Error(`Total must be between 1 and ${MAX_COUNT * 3}`);
    }

    const baseCount = Math.floor(total / 3);
    const remainder = total % 3;

    return {
      directQuestion: baseCount + remainder, // Give extra questions to direct question
      twoStatementCompound: baseCount,
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
