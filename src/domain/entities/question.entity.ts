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
  questionText: string;
  questionType: QuestionType;
  options: QuestionOption[];
  orderIndex: number;
}

/**
 * Properties for creating a new Question (with plain option objects)
 */
export interface CreateQuestionProps {
  id: string;
  quizId: string;
  questionText: string;
  questionType: QuestionType;
  options: QuestionOptionProps[];
  orderIndex: number;
}

/**
 * Question Entity
 *
 * Represents a single question within a quiz.
 * Contains the question text, type, answer options, and ordering information.
 */
export class Question {
  private readonly _id: string;
  private readonly _quizId: string;
  private _questionText: string;
  private _questionType: QuestionType;
  private _options: QuestionOption[];
  private _orderIndex: number;

  private constructor(props: QuestionProps) {
    this._id = props.id;
    this._quizId = props.quizId;
    this._questionText = props.questionText;
    this._questionType = props.questionType;
    this._options = props.options;
    this._orderIndex = props.orderIndex;
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
      questionText: props.questionText,
      questionType: props.questionType,
      options,
      orderIndex: props.orderIndex,
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
    questionText: string;
    questionType: string;
    options: unknown[];
    orderIndex: number;
  }): Question {
    if (
      !Object.values(QuestionType).includes(data.questionType as QuestionType)
    ) {
      throw new Error(`Invalid question type: ${data.questionType}`);
    }

    const options = data.options.map((opt) => QuestionOption.fromPlain(opt));

    return Question.reconstitute({
      id: data.id,
      quizId: data.quizId,
      questionText: data.questionText,
      questionType: data.questionType as QuestionType,
      options,
      orderIndex: data.orderIndex,
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
      !props.questionText ||
      typeof props.questionText !== "string" ||
      props.questionText.trim().length === 0
    ) {
      throw new Error("Question text is required and cannot be empty");
    }

    if (!Object.values(QuestionType).includes(props.questionType)) {
      throw new Error(`Invalid question type: ${props.questionType}`);
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

    if (!props.questionText || typeof props.questionText !== "string") {
      throw new Error("Question text is required");
    }

    if (!Object.values(QuestionType).includes(props.questionType)) {
      throw new Error(`Invalid question type: ${props.questionType}`);
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

  get questionText(): string {
    return this._questionText;
  }

  get questionType(): QuestionType {
    return this._questionType;
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
   * Updates the question text
   */
  public updateQuestionText(text: string): void {
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      throw new Error("Question text is required and cannot be empty");
    }
    this._questionText = text.trim();
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
    questionText: string;
    questionType: QuestionType;
    options: QuestionOptionProps[];
    orderIndex: number;
  } {
    return {
      id: this._id,
      quizId: this._quizId,
      questionText: this._questionText,
      questionType: this._questionType,
      options: this._options.map((opt) => opt.toPlain()),
      orderIndex: this._orderIndex,
    };
  }
}
