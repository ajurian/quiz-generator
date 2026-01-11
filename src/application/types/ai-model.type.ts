/**
 * Application-layer AI model selection.
 *
 * This abstracts the AI model choice from the domain.
 * The Infrastructure layer maps these to vendor-specific model identifiers.
 *
 * Capabilities:
 * - PRIMARY: High-quality output, standard quotas
 * - LITE: Lower quota requirements, faster responses, suitable for fallback
 * - PREVIEW: Experimental features, may have different behavior
 */
export enum AIModel {
  /** Primary model with higher quality output */
  PRIMARY = "primary",
  /** Fallback model with lower quota requirements */
  LITE = "lite",
  /** Preview/experimental model */
  PREVIEW = "preview",
}

/**
 * Type guard to check if a value is a valid AIModel
 */
export function isAIModel(value: unknown): value is AIModel {
  return (
    typeof value === "string" &&
    Object.values(AIModel).includes(value as AIModel)
  );
}

/**
 * Get the display name for an AI model
 */
export function getAIModelDisplayName(model: AIModel): string {
  const displayNames: Record<AIModel, string> = {
    [AIModel.PRIMARY]: "Standard",
    [AIModel.LITE]: "Fast",
    [AIModel.PREVIEW]: "Preview",
  };
  return displayNames[model];
}

/**
 * Default AI model to use when none is specified
 */
export const DEFAULT_AI_MODEL = AIModel.PRIMARY;
