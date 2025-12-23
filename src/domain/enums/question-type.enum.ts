/**
 * Enum representing the different types of quiz questions.
 *
 * - DIRECT_QUESTION: A simple question or list-selection task identifying a single correct answer
 * - TWO_STATEMENT_COMPOUND: A logic-based task evaluating the truth or relationship of two specific statements
 * - CONTEXTUAL: A situational task requiring the analysis of a provided scenario or case study
 */
export enum QuestionType {
  DIRECT_QUESTION = "direct_question",
  TWO_STATEMENT_COMPOUND = "two_statement_compound",
  CONTEXTUAL = "contextual",
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
    [QuestionType.DIRECT_QUESTION]: "Direct Question",
    [QuestionType.TWO_STATEMENT_COMPOUND]: "Two-Statement Compound",
    [QuestionType.CONTEXTUAL]: "Contextual",
  };
  return displayNames[type];
}
