import { describe, expect, it } from "bun:test";
import { paginationInputSchema } from "@/application/dtos/pagination.dto";

describe("Pagination DTOs", () => {
  describe("paginationInputSchema", () => {
    it("should validate valid pagination input", () => {
      const result = paginationInputSchema.safeParse({
        page: 1,
        limit: 10,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(10);
      }
    });

    it("should use default values when not provided", () => {
      const result = paginationInputSchema.safeParse({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(10);
      }
    });

    it("should reject page less than 1", () => {
      const result = paginationInputSchema.safeParse({
        page: 0,
        limit: 10,
      });

      expect(result.success).toBe(false);
    });

    it("should reject negative page", () => {
      const result = paginationInputSchema.safeParse({
        page: -1,
        limit: 10,
      });

      expect(result.success).toBe(false);
    });

    it("should reject limit less than 1", () => {
      const result = paginationInputSchema.safeParse({
        page: 1,
        limit: 0,
      });

      expect(result.success).toBe(false);
    });

    it("should reject limit greater than 100", () => {
      const result = paginationInputSchema.safeParse({
        page: 1,
        limit: 101,
      });

      expect(result.success).toBe(false);
    });

    it("should accept maximum valid limit", () => {
      const result = paginationInputSchema.safeParse({
        page: 1,
        limit: 100,
      });

      expect(result.success).toBe(true);
    });

    it("should reject non-integer page", () => {
      const result = paginationInputSchema.safeParse({
        page: 1.5,
        limit: 10,
      });

      expect(result.success).toBe(false);
    });

    it("should reject non-integer limit", () => {
      const result = paginationInputSchema.safeParse({
        page: 1,
        limit: 10.5,
      });

      expect(result.success).toBe(false);
    });

    it("should allow partial input with only page", () => {
      const result = paginationInputSchema.safeParse({
        page: 5,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(5);
        expect(result.data.limit).toBe(10);
      }
    });

    it("should allow partial input with only limit", () => {
      const result = paginationInputSchema.safeParse({
        limit: 50,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(50);
      }
    });
  });
});
