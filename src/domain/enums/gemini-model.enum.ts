/**
 * Enum representing the available Google Gemini AI models.
 *
 * - FLASH_STABLE: Current stable Flash model
 * - FLASH_STABLE_LITE: Stable lite model with lower quota requirements
 */
export enum GeminiModel {
  FLASH_STABLE = "gemini-3.5-flash",
  FLASH_STABLE_LITE = "gemini-3.1-flash-lite",
}

/**
 * Type guard to check if a value is a valid GeminiModel
 */
export function isGeminiModel(value: unknown): value is GeminiModel {
  return (
    typeof value === "string" &&
    Object.values(GeminiModel).includes(value as GeminiModel)
  );
}

/**
 * Get the display name for a Gemini model
 */
export function getGeminiModelDisplayName(model: GeminiModel): string {
  const displayNames: Record<GeminiModel, string> = {
    [GeminiModel.FLASH_STABLE]: "Gemini 3.5 Flash",
    [GeminiModel.FLASH_STABLE_LITE]: "Gemini 3.1 Flash Lite",
  };
  return displayNames[model];
}
