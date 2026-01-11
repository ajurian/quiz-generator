import { v7 as randomUUIDv7 } from "uuid";
import type { IIdGenerator } from "@/application";

/**
 * UUID v7 ID Generator Service
 *
 * Implements the IIdGenerator port using Bun's randomUUIDv7 function.
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
