/**
 * Quiz Visibility Enum
 *
 * Defines the visibility levels for quizzes:
 * - PRIVATE: Only owner can view/attempt
 * - UNLISTED: Anyone with the link can view/attempt; not listed in public directories
 * - PUBLIC: Discoverable in app directories; anyone can view/attempt
 */
export enum QuizVisibility {
  PRIVATE = "private",
  UNLISTED = "unlisted",
  PUBLIC = "public",
}

/**
 * Type guard to check if a value is a valid QuizVisibility
 */
export function isQuizVisibility(value: unknown): value is QuizVisibility {
  return (
    typeof value === "string" &&
    Object.values(QuizVisibility).includes(value as QuizVisibility)
  );
}

/**
 * Get display name for a QuizVisibility value
 */
export function getQuizVisibilityDisplayName(
  visibility: QuizVisibility
): string {
  const displayNames: Record<QuizVisibility, string> = {
    [QuizVisibility.PRIVATE]: "Private",
    [QuizVisibility.UNLISTED]: "Unlisted",
    [QuizVisibility.PUBLIC]: "Public",
  };
  return displayNames[visibility];
}

/**
 * Get description for a QuizVisibility value
 */
export function getQuizVisibilityDescription(
  visibility: QuizVisibility
): string {
  const descriptions: Record<QuizVisibility, string> = {
    [QuizVisibility.PRIVATE]: "Only you can view and attempt this quiz",
    [QuizVisibility.UNLISTED]: "Anyone with the link can access this quiz",
    [QuizVisibility.PUBLIC]: "This quiz is discoverable in public directories",
  };
  return descriptions[visibility];
}
