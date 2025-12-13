/**
 * Enum representing the available Google Gemini AI models.
 *
 * - FLASH_2_5: Primary model with higher quality output
 * - FLASH_2_5_LITE: Fallback model with lower quota requirements
 */
export enum GeminiModel {
  FLASH_2_5 = "gemini-2.5-flash",
  FLASH_2_5_LITE = "gemini-2.5-flash-lite",
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
    [GeminiModel.FLASH_2_5]: "Gemini 2.5 Flash",
    [GeminiModel.FLASH_2_5_LITE]: "Gemini 2.5 Flash Lite",
  };
  return displayNames[model];
}
