import { randomUUIDv7 } from "bun";
import type { IIdGenerator } from "../../application";

/**
 * UUID v7 ID Generator Service
 *
 * Implements the IIdGenerator port using Bun's randomUUIDv7 function,
 * which is available in modern JavaScript environments including Bun.
 */
export class UuidIdGenerator implements IIdGenerator {
  /**
   * Generates a new unique identifier (UUID v7)
   * @returns A unique string identifier
   */
  generate(): string {
    return randomUUIDv7();
  }
}
