import { describe, expect, it } from "bun:test";
import { UuidIdGenerator } from "../../infrastructure/services/uuid-id-generator.service";

describe("UuidIdGenerator", () => {
  describe("generate", () => {
    it("should return a valid UUID v4 string", () => {
      const generator = new UuidIdGenerator();

      const id = generator.generate();

      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidV4Regex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      expect(id).toMatch(uuidV4Regex);
    });

    it("should generate unique IDs on each call", () => {
      const generator = new UuidIdGenerator();

      const ids = new Set<string>();
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        ids.add(generator.generate());
      }

      expect(ids.size).toBe(iterations);
    });

    it("should return a string of correct length", () => {
      const generator = new UuidIdGenerator();

      const id = generator.generate();

      // UUID format: 8-4-4-4-12 = 36 characters including hyphens
      expect(id.length).toBe(36);
    });

    it("should have the correct version digit (4)", () => {
      const generator = new UuidIdGenerator();

      const id = generator.generate();

      // The 13th character (index 14 after hyphen) should be '4' for UUID v4
      expect(id.charAt(14)).toBe("4");
    });

    it("should have correct variant bits", () => {
      const generator = new UuidIdGenerator();

      const id = generator.generate();

      // The 17th character (index 19 after hyphens) should be 8, 9, a, or b
      const variantChar = id.charAt(19).toLowerCase();
      expect(["8", "9", "a", "b"]).toContain(variantChar);
    });

    it("should be usable as a database primary key", () => {
      const generator = new UuidIdGenerator();

      const id = generator.generate();

      // Ensure no special characters that might cause issues
      expect(id).not.toContain(" ");
      expect(id).not.toContain("'");
      expect(id).not.toContain('"');
      expect(id).not.toContain(";");

      // Only contains valid hex characters and hyphens
      expect(id).toMatch(/^[0-9a-f-]+$/i);
    });
  });
});
