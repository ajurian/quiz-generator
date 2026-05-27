import { describe, expect, it } from "bun:test";
import {
  GeminiModel,
  isGeminiModel,
  getGeminiModelDisplayName,
} from "@/domain/enums/gemini-model.enum";

describe("GeminiModel Enum", () => {
  describe("enum values", () => {
    it("should have FLASH_STABLE with correct value", () => {
      expect(GeminiModel.FLASH_STABLE).toBe("gemini-3.5-flash" as GeminiModel);
    });

    it("should have FLASH_STABLE_LITE with correct value", () => {
      expect(GeminiModel.FLASH_STABLE_LITE).toBe(
        "gemini-3.1-flash-lite" as GeminiModel,
      );
    });

    it("should have exactly 2 model types", () => {
      const values = Object.values(GeminiModel);
      expect(values).toHaveLength(2);
    });
  });

  describe("isGeminiModel", () => {
    it("should return true for valid GeminiModel values", () => {
      expect(isGeminiModel("gemini-3.5-flash")).toBe(true);
      expect(isGeminiModel("gemini-3.1-flash-lite")).toBe(true);
    });

    it("should return false for invalid string values", () => {
      expect(isGeminiModel("invalid")).toBe(false);
      expect(isGeminiModel("FLASH_STABLE")).toBe(false);
      expect(isGeminiModel("gemini-1.5-pro")).toBe(false);
      expect(isGeminiModel("")).toBe(false);
    });

    it("should return false for non-string values", () => {
      expect(isGeminiModel(null)).toBe(false);
      expect(isGeminiModel(undefined)).toBe(false);
      expect(isGeminiModel(123)).toBe(false);
      expect(isGeminiModel({})).toBe(false);
      expect(isGeminiModel([])).toBe(false);
    });
  });

  describe("getGeminiModelDisplayName", () => {
    it("should return correct display name for FLASH_STABLE", () => {
      expect(getGeminiModelDisplayName(GeminiModel.FLASH_STABLE)).toBe(
        "Gemini 3.5 Flash",
      );
    });

    it("should return correct display name for FLASH_STABLE_LITE", () => {
      expect(getGeminiModelDisplayName(GeminiModel.FLASH_STABLE_LITE)).toBe(
        "Gemini 3.1 Flash Lite",
      );
    });
  });
});
