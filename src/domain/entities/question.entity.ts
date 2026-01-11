import { QuestionType } from "../enums";
import { InvariantViolationError } from "../errors";
import {
  QuestionOption,
  type QuestionOptionProps,
  VALID_OPTION_INDICES,
} from "../value-objects";

/**
 * Properties required to create a Question entity
 */
export interface QuestionProps {
  id: string;
  quizId: string;
  orderIndex: number;
  type: QuestionType;
  stem: string;
  options: QuestionOption[];
  correctExplanation: string;
  sourceQuote: string;
  reference: number;
}

/**
 * Properties for creating a new Question (with plain option objects)
 */
export interface CreateQuestionProps {
  id: string;
  quizId: string;
  orderIndex: number;
  type: QuestionType;
  stem: string;
  options: QuestionOptionProps[];
  correctExplanation: string;
  sourceQuote: string;
  reference: number;
}

/**
 * Question Entity
 *
 * Represents a single question within a quiz.
 * Contains the stem, type, answer options, and ordering information.
 */
export class Question {
  private readonly _id: string;
  private readonly _quizId: string;
  private _orderIndex: number;
  private _type: QuestionType;
  private _stem: string;
  private _options: QuestionOption[];
  private _correctExplanation: string;
  private _sourceQuote: string;
  private _reference: number;

  private constructor(props: QuestionProps) {
    this._id = props.id;
    this._quizId = props.quizId;
    this._orderIndex = props.orderIndex;
    this._type = props.type;
    this._stem = props.stem;
    this._options = props.options;
    this._correctExplanation = props.correctExplanation;
    this._sourceQuote = props.sourceQuote;
    this._reference = props.reference;
  }

  /**
   * Creates a new Question entity
   * @throws {InvariantViolationError} if validation fails
   */
  public static create(props: CreateQuestionProps): Question {
    Question.validateCreateProps(props);

    const options = props.options.map((opt) => QuestionOption.create(opt));

    return new Question({
      id: props.id,
      quizId: props.quizId,
      orderIndex: props.orderIndex,
      type: props.type,
      stem: props.stem,
      options,
      correctExplanation: props.correctExplanation,
      sourceQuote: props.sourceQuote,
      reference: props.reference,
    });
  }

  /**
   * Reconstitutes a Question entity from persisted data
   * @throws {InvariantViolationError} if validation fails
   */
  public static reconstitute(props: QuestionProps): Question {
    Question.validateProps(props);
    return new Question(props);
  }

  /**
   * Reconstitutes a Question from plain data (e.g., from database)
   * @throws {InvariantViolationError} if validation fails
   */
  public static fromPlain(data: {
    id: string;
    quizId: string;
    orderIndex: number;
    type: string;
    stem: string;
    options: unknown[];
    correctExplanation: string;
    sourceQuote: string;
    reference: number;
  }): Question {
    if (!Object.values(QuestionType).includes(data.type as QuestionType)) {
      throw new InvariantViolationError(
        `Invalid question type: ${data.type}`,
        "type"
      );
    }

    const options = data.options.map((opt) => QuestionOption.fromPlain(opt));

    return Question.reconstitute({
      id: data.id,
      quizId: data.quizId,
      orderIndex: data.orderIndex,
      type: data.type as QuestionType,
      stem: data.stem,
      options,
      correctExplanation: data.correctExplanation,
      sourceQuote: data.sourceQuote,
      reference: data.reference,
    });
  }

  /**
   * Validates properties for creating a new Question
   */
  private static validateCreateProps(props: CreateQuestionProps): void {
    if (!props.id || typeof props.id !== "string") {
      throw new InvariantViolationError("Question ID is required", "id");
    }

    if (!props.quizId || typeof props.quizId !== "string") {
      throw new InvariantViolationError("Quiz ID is required", "quizId");
    }

    if (
      !props.stem ||
      typeof props.stem !== "string" ||
      props.stem.trim().length === 0
    ) {
      throw new InvariantViolationError(
        "Stem is required and cannot be empty",
        "stem"
      );
    }

    if (!Object.values(QuestionType).includes(props.type)) {
      throw new InvariantViolationError(
        `Invalid question type: ${props.type}`,
        "type"
      );
    }

    if (!Array.isArray(props.options) || props.options.length !== 4) {
      throw new InvariantViolationError(
        "Exactly 4 options are required",
        "options"
      );
    }

    // Validate options have correct indices (A, B, C, D each exactly once)
    const indices = props.options.map((opt) => opt.index);
    const hasAllIndices = VALID_OPTION_INDICES.every((idx) =>
      indices.includes(idx)
    );
    if (!hasAllIndices) {
      throw new InvariantViolationError(
        "Options must have indices A, B, C, and D",
        "options"
      );
    }

    // Validate exactly one correct answer
    const correctCount = props.options.filter((opt) => opt.isCorrect).length;
    if (correctCount !== 1) {
      throw new InvariantViolationError(
        "Exactly one option must be marked as correct",
        "options"
      );
    }

    if (
      typeof props.orderIndex !== "number" ||
      props.orderIndex < 0 ||
      !Number.isInteger(props.orderIndex)
    ) {
      throw new InvariantViolationError(
        "Order index must be a non-negative integer",
        "orderIndex"
      );
    }

    if (typeof props.correctExplanation !== "string") {
      throw new InvariantViolationError(
        "Correct explanation must be a string",
        "correctExplanation"
      );
    }

    if (typeof props.sourceQuote !== "string") {
      throw new InvariantViolationError(
        "Source quote must be a string",
        "sourceQuote"
      );
    }

    if (
      typeof props.reference !== "number" ||
      !Number.isInteger(props.reference) ||
      props.reference < 0
    ) {
      throw new InvariantViolationError(
        "Reference must be a non-negative integer",
        "reference"
      );
    }
  }

  /**
   * Validates properties for reconstituting a Question.
   * Enforces the same invariants as creation to prevent invalid persisted state.
   */
  private static validateProps(props: QuestionProps): void {
    if (!props.id || typeof props.id !== "string") {
      throw new InvariantViolationError("Question ID is required", "id");
    }

    if (!props.quizId || typeof props.quizId !== "string") {
      throw new InvariantViolationError("Quiz ID is required", "quizId");
    }

    if (
      !props.stem ||
      typeof props.stem !== "string" ||
      props.stem.trim().length === 0
    ) {
      throw new InvariantViolationError(
        "Stem is required and cannot be empty",
        "stem"
      );
    }

    if (!Object.values(QuestionType).includes(props.type)) {
      throw new InvariantViolationError(
        `Invalid question type: ${props.type}`,
        "type"
      );
    }

    if (!Array.isArray(props.options) || props.options.length !== 4) {
      throw new InvariantViolationError(
        "Exactly 4 options are required",
        "options"
      );
    }

    // Validate options have correct indices (A, B, C, D each exactly once)
    const indices = props.options.map((opt) => opt.index);
    const uniqueIndices = new Set(indices);
    const hasAllIndices = VALID_OPTION_INDICES.every((idx) =>
      uniqueIndices.has(idx)
    );
    if (uniqueIndices.size !== 4 || !hasAllIndices) {
      throw new InvariantViolationError(
        "Options must have indices A, B, C, and D exactly once",
        "options"
      );
    }

    // Validate exactly one correct answer
    const correctCount = props.options.filter((opt) => opt.isCorrect).length;
    if (correctCount !== 1) {
      throw new InvariantViolationError(
        "Exactly one option must be marked as correct",
        "options"
      );
    }

    if (
      typeof props.orderIndex !== "number" ||
      props.orderIndex < 0 ||
      !Number.isInteger(props.orderIndex)
    ) {
      throw new InvariantViolationError(
        "Order index must be a non-negative integer",
        "orderIndex"
      );
    }

    if (typeof props.correctExplanation !== "string") {
      throw new InvariantViolationError(
        "Correct explanation must be a string",
        "correctExplanation"
      );
    }

    if (typeof props.sourceQuote !== "string") {
      throw new InvariantViolationError(
        "Source quote must be a string",
        "sourceQuote"
      );
    }

    if (
      typeof props.reference !== "number" ||
      !Number.isInteger(props.reference) ||
      props.reference < 0
    ) {
      throw new InvariantViolationError(
        "Reference must be a non-negative integer",
        "reference"
      );
    }
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get quizId(): string {
    return this._quizId;
  }

  get stem(): string {
    return this._stem;
  }

  get type(): QuestionType {
    return this._type;
  }

  get options(): readonly QuestionOption[] {
    return this._options;
  }

  get orderIndex(): number {
    return this._orderIndex;
  }

  get correctExplanation(): string {
    return this._correctExplanation;
  }

  get sourceQuote(): string {
    return this._sourceQuote;
  }

  get reference(): number {
    return this._reference;
  }

  // Business Methods

  /**
   * Gets the correct option for this question
   */
  public getCorrectOption(): QuestionOption {
    const correct = this._options.find((opt) => opt.isCorrect);
    if (!correct) {
      throw new Error("No correct option found");
    }
    return correct;
  }

  /**
   * Gets an option by its index
   */
  public getOptionByIndex(index: string): QuestionOption | undefined {
    return this._options.find((opt) => opt.index === index);
  }

  /**
   * Checks if a given answer is correct
   */
  public isAnswerCorrect(answerIndex: string): boolean {
    const option = this.getOptionByIndex(answerIndex);
    return option?.isCorrect ?? false;
  }

  /**
   * Gets options in sorted order (A, B, C, D)
   */
  public getSortedOptions(): QuestionOption[] {
    return [...this._options].sort((a, b) => a.index.localeCompare(b.index));
  }

  /**
   * Updates the stem
   */
  public updateStem(text: string): void {
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      throw new InvariantViolationError(
        "Stem is required and cannot be empty",
        "stem"
      );
    }
    this._stem = text.trim();
  }

  /**
   * Updates the order index
   */
  public updateOrderIndex(index: number): void {
    if (typeof index !== "number" || index < 0 || !Number.isInteger(index)) {
      throw new InvariantViolationError(
        "Order index must be a non-negative integer",
        "orderIndex"
      );
    }
    this._orderIndex = index;
  }

  /**
   * Converts the entity to a plain object for persistence
   */
  public toPlain(): {
    id: string;
    quizId: string;
    orderIndex: number;
    type: QuestionType;
    stem: string;
    options: QuestionOptionProps[];
    correctExplanation: string;
    sourceQuote: string;
    reference: number;
  } {
    return {
      id: this._id,
      quizId: this._quizId,
      orderIndex: this._orderIndex,
      type: this._type,
      stem: this._stem,
      options: this._options.map((opt) => opt.toPlain()),
      correctExplanation: this._correctExplanation,
      sourceQuote: this._sourceQuote,
      reference: this._reference,
    };
  }
}
