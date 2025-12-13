/**
 * Enum representing the different types of quiz questions.
 *
 * - SINGLE_BEST_ANSWER: A question with one correct answer from multiple choices
 * - TWO_STATEMENTS: A question based on evaluating two statements
 * - SITUATIONAL: A scenario-based question testing judgment
 */
export enum QuestionType {
  SINGLE_BEST_ANSWER = "single_best_answer",
  TWO_STATEMENTS = "two_statements",
  SITUATIONAL = "situational",
}

/**
 * Type guard to check if a value is a valid QuestionType
 */
export function isQuestionType(value: unknown): value is QuestionType {
  return (
    typeof value === "string" &&
    Object.values(QuestionType).includes(value as QuestionType)
  );
}

/**
 * Get the display name for a question type
 */
export function getQuestionTypeDisplayName(type: QuestionType): string {
  const displayNames: Record<QuestionType, string> = {
    [QuestionType.SINGLE_BEST_ANSWER]: "Single Best Answer",
    [QuestionType.TWO_STATEMENTS]: "Two Statements",
    [QuestionType.SITUATIONAL]: "Situational",
  };
  return displayNames[type];
}
