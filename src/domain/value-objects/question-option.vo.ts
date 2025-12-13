/**
 * Valid option indices for quiz questions
 */
export type OptionIndex = "A" | "B" | "C" | "D";

/**
 * All valid option indices
 */
export const VALID_OPTION_INDICES: readonly OptionIndex[] = [
  "A",
  "B",
  "C",
  "D",
] as const;

/**
 * Type guard to check if a value is a valid OptionIndex
 */
export function isValidOptionIndex(value: unknown): value is OptionIndex {
  return (
    typeof value === "string" &&
    VALID_OPTION_INDICES.includes(value as OptionIndex)
  );
}

/**
 * Properties required to create a QuestionOption
 */
export interface QuestionOptionProps {
  index: OptionIndex;
  text: string;
  explanation: string;
  isCorrect: boolean;
}

/**
 * QuestionOption Value Object
 *
 * Represents a single answer option for a quiz question.
 * Value objects are immutable and compared by their values rather than identity.
 */
export class QuestionOption {
  private readonly _index: OptionIndex;
  private readonly _text: string;
  private readonly _explanation: string;
  private readonly _isCorrect: boolean;

  private constructor(props: QuestionOptionProps) {
    this._index = props.index;
    this._text = props.text;
    this._explanation = props.explanation;
    this._isCorrect = props.isCorrect;
  }

  /**
   * Creates a new QuestionOption with validation
   * @throws {Error} if validation fails
   */
  public static create(props: QuestionOptionProps): QuestionOption {
    QuestionOption.validate(props);
    return new QuestionOption(props);
  }

  /**
   * Creates a QuestionOption from a plain object (e.g., from JSON)
   * @throws {Error} if validation fails
   */
  public static fromPlain(obj: unknown): QuestionOption {
    if (!QuestionOption.isPlainQuestionOption(obj)) {
      throw new Error("Invalid QuestionOption structure");
    }
    return QuestionOption.create(obj);
  }

  /**
   * Type guard to check if an object has the correct QuestionOption structure
   */
  private static isPlainQuestionOption(
    obj: unknown
  ): obj is QuestionOptionProps {
    if (typeof obj !== "object" || obj === null) {
      return false;
    }
    const option = obj as Record<string, unknown>;
    return (
      isValidOptionIndex(option.index) &&
      typeof option.text === "string" &&
      typeof option.explanation === "string" &&
      typeof option.isCorrect === "boolean"
    );
  }

  /**
   * Validates QuestionOption properties
   * @throws {Error} if validation fails
   */
  private static validate(props: QuestionOptionProps): void {
    if (!isValidOptionIndex(props.index)) {
      throw new Error(
        `Invalid option index: ${
          props.index
        }. Must be one of: ${VALID_OPTION_INDICES.join(", ")}`
      );
    }

    if (typeof props.text !== "string" || props.text.trim().length === 0) {
      throw new Error("Option text is required and cannot be empty");
    }

    if (typeof props.explanation !== "string") {
      throw new Error("Option explanation must be a string");
    }

    if (typeof props.isCorrect !== "boolean") {
      throw new Error("Option isCorrect must be a boolean");
    }
  }

  // Getters (immutability)
  get index(): OptionIndex {
    return this._index;
  }

  get text(): string {
    return this._text;
  }

  get explanation(): string {
    return this._explanation;
  }

  get isCorrect(): boolean {
    return this._isCorrect;
  }

  /**
   * Compares two QuestionOptions for equality
   */
  public equals(other: QuestionOption): boolean {
    return (
      this._index === other._index &&
      this._text === other._text &&
      this._explanation === other._explanation &&
      this._isCorrect === other._isCorrect
    );
  }

  /**
   * Creates a copy of this QuestionOption with optional property overrides
   */
  public copyWith(props: Partial<QuestionOptionProps>): QuestionOption {
    return QuestionOption.create({
      index: props.index ?? this._index,
      text: props.text ?? this._text,
      explanation: props.explanation ?? this._explanation,
      isCorrect: props.isCorrect ?? this._isCorrect,
    });
  }

  /**
   * Converts the QuestionOption to a plain object
   */
  public toPlain(): QuestionOptionProps {
    return {
      index: this._index,
      text: this._text,
      explanation: this._explanation,
      isCorrect: this._isCorrect,
    };
  }
}
