import { randomUUIDv7 } from "bun";
import type { IIdGenerator } from "../../application";

/**
 * UUID v4 ID Generator Service
 *
 * Implements the IIdGenerator port using crypto.randomUUID()
 * which is available in modern JavaScript environments including Bun.
 */
export class UuidIdGenerator implements IIdGenerator {
  /**
   * Generates a new unique identifier (UUID v4)
   * @returns A unique string identifier
   */
  generate(): string {
    return randomUUIDv7();
  }
}
