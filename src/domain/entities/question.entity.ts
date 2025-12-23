import { QuestionType } from "../enums";
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

  private constructor(props: QuestionProps) {
    this._id = props.id;
    this._quizId = props.quizId;
    this._orderIndex = props.orderIndex;
    this._type = props.type;
    this._stem = props.stem;
    this._options = props.options;
  }

  /**
   * Creates a new Question entity
   * @throws {Error} if validation fails
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
    });
  }

  /**
   * Reconstitutes a Question entity from persisted data
   * @throws {Error} if validation fails
   */
  public static reconstitute(props: QuestionProps): Question {
    Question.validateProps(props);
    return new Question(props);
  }

  /**
   * Reconstitutes a Question from plain data (e.g., from database)
   */
  public static fromPlain(data: {
    id: string;
    quizId: string;
    orderIndex: number;
    type: string;
    stem: string;
    options: unknown[];
  }): Question {
    if (!Object.values(QuestionType).includes(data.type as QuestionType)) {
      throw new Error(`Invalid question type: ${data.type}`);
    }

    const options = data.options.map((opt) => QuestionOption.fromPlain(opt));

    return Question.reconstitute({
      id: data.id,
      quizId: data.quizId,
      orderIndex: data.orderIndex,
      type: data.type as QuestionType,
      stem: data.stem,
      options,
    });
  }

  /**
   * Validates properties for creating a new Question
   */
  private static validateCreateProps(props: CreateQuestionProps): void {
    if (!props.id || typeof props.id !== "string") {
      throw new Error("Question ID is required");
    }

    if (!props.quizId || typeof props.quizId !== "string") {
      throw new Error("Quiz ID is required");
    }

    if (
      !props.stem ||
      typeof props.stem !== "string" ||
      props.stem.trim().length === 0
    ) {
      throw new Error("Stem is required and cannot be empty");
    }

    if (!Object.values(QuestionType).includes(props.type)) {
      throw new Error(`Invalid question type: ${props.type}`);
    }

    if (!Array.isArray(props.options) || props.options.length !== 4) {
      throw new Error("Exactly 4 options are required");
    }

    // Validate options have correct indices
    const indices = props.options.map((opt) => opt.index);
    const hasAllIndices = VALID_OPTION_INDICES.every((idx) =>
      indices.includes(idx)
    );
    if (!hasAllIndices) {
      throw new Error("Options must have indices A, B, C, and D");
    }

    // Validate exactly one correct answer
    const correctCount = props.options.filter((opt) => opt.isCorrect).length;
    if (correctCount !== 1) {
      throw new Error("Exactly one option must be marked as correct");
    }

    if (typeof props.orderIndex !== "number" || props.orderIndex < 0) {
      throw new Error("Order index must be a non-negative number");
    }
  }

  /**
   * Validates properties for reconstituting a Question
   */
  private static validateProps(props: QuestionProps): void {
    if (!props.id || typeof props.id !== "string") {
      throw new Error("Question ID is required");
    }

    if (!props.quizId || typeof props.quizId !== "string") {
      throw new Error("Quiz ID is required");
    }

    if (!props.stem || typeof props.stem !== "string") {
      throw new Error("Stem is required");
    }

    if (!Object.values(QuestionType).includes(props.type)) {
      throw new Error(`Invalid question type: ${props.type}`);
    }

    if (!Array.isArray(props.options) || props.options.length !== 4) {
      throw new Error("Exactly 4 options are required");
    }

    if (typeof props.orderIndex !== "number") {
      throw new Error("Order index must be a number");
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
  public updatestem(text: string): void {
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      throw new Error("Stem is required and cannot be empty");
    }
    this._stem = text.trim();
  }

  /**
   * Updates the order index
   */
  public updateOrderIndex(index: number): void {
    if (typeof index !== "number" || index < 0) {
      throw new Error("Order index must be a non-negative number");
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
  } {
    return {
      id: this._id,
      quizId: this._quizId,
      orderIndex: this._orderIndex,
      type: this._type,
      stem: this._stem,
      options: this._options.map((opt) => opt.toPlain()),
    };
  }
}
