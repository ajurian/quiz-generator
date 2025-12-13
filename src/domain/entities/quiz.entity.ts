import {
  QuizDistributionService,
  type QuizDistribution,
} from "../services/quiz-distribution.service";

/**
 * Properties required to create a Quiz entity
 */
export interface QuizProps {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  questionDistribution: number;
}

/**
 * Properties for creating a new Quiz (without computed fields)
 */
export interface CreateQuizProps {
  id: string;
  userId: string;
  title: string;
  distribution: QuizDistribution;
  isPublic?: boolean;
}

/**
 * Quiz Entity
 *
 * Represents a quiz containing multiple questions.
 * The question distribution is stored as a bit-packed 32-bit integer.
 */
export class Quiz {
  private readonly _id: string;
  private readonly _userId: string;
  private _title: string;
  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private _isPublic: boolean;
  private _questionDistribution: number;

  private constructor(props: QuizProps) {
    this._id = props.id;
    this._userId = props.userId;
    this._title = props.title;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    this._isPublic = props.isPublic;
    this._questionDistribution = props.questionDistribution;
  }

  /**
   * Creates a new Quiz entity
   * @throws {Error} if validation fails
   */
  public static create(props: CreateQuizProps): Quiz {
    Quiz.validateCreateProps(props);

    const now = new Date();
    const encodedDistribution = QuizDistributionService.encode(
      props.distribution
    );

    return new Quiz({
      id: props.id,
      userId: props.userId,
      title: props.title,
      createdAt: now,
      updatedAt: now,
      isPublic: props.isPublic ?? false,
      questionDistribution: encodedDistribution,
    });
  }

  /**
   * Reconstitutes a Quiz entity from persisted data
   * @throws {Error} if validation fails
   */
  public static reconstitute(props: QuizProps): Quiz {
    Quiz.validateProps(props);
    return new Quiz(props);
  }

  /**
   * Validates properties for creating a new Quiz
   */
  private static validateCreateProps(props: CreateQuizProps): void {
    if (!props.id || typeof props.id !== "string") {
      throw new Error("Quiz ID is required");
    }

    if (!props.userId || typeof props.userId !== "string") {
      throw new Error("User ID is required");
    }

    if (
      !props.title ||
      typeof props.title !== "string" ||
      props.title.trim().length === 0
    ) {
      throw new Error("Quiz title is required and cannot be empty");
    }

    if (props.title.length > 255) {
      throw new Error("Quiz title cannot exceed 255 characters");
    }

    if (!QuizDistributionService.validate(props.distribution)) {
      throw new Error("Invalid question distribution");
    }
  }

  /**
   * Validates properties for reconstituting a Quiz
   */
  private static validateProps(props: QuizProps): void {
    if (!props.id || typeof props.id !== "string") {
      throw new Error("Quiz ID is required");
    }

    if (!props.userId || typeof props.userId !== "string") {
      throw new Error("User ID is required");
    }

    if (!props.title || typeof props.title !== "string") {
      throw new Error("Quiz title is required");
    }

    if (
      !(props.createdAt instanceof Date) ||
      isNaN(props.createdAt.getTime())
    ) {
      throw new Error("Valid createdAt date is required");
    }

    if (
      !(props.updatedAt instanceof Date) ||
      isNaN(props.updatedAt.getTime())
    ) {
      throw new Error("Valid updatedAt date is required");
    }

    if (typeof props.isPublic !== "boolean") {
      throw new Error("isPublic must be a boolean");
    }

    if (typeof props.questionDistribution !== "number") {
      throw new Error("questionDistribution must be a number");
    }
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get userId(): string {
    return this._userId;
  }

  get title(): string {
    return this._title;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get isPublic(): boolean {
    return this._isPublic;
  }

  get questionDistribution(): number {
    return this._questionDistribution;
  }

  /**
   * Gets the decoded question distribution
   */
  get distribution(): QuizDistribution {
    return QuizDistributionService.decode(this._questionDistribution);
  }

  /**
   * Computed property: total number of questions
   */
  get totalQuestions(): number {
    return QuizDistributionService.getTotalQuestions(
      this._questionDistribution
    );
  }

  // Business Methods

  /**
   * Updates the quiz title
   */
  public updateTitle(title: string): void {
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      throw new Error("Quiz title is required and cannot be empty");
    }

    if (title.length > 255) {
      throw new Error("Quiz title cannot exceed 255 characters");
    }

    this._title = title.trim();
    this._updatedAt = new Date();
  }

  /**
   * Makes the quiz public for sharing
   */
  public makePublic(): void {
    this._isPublic = true;
    this._updatedAt = new Date();
  }

  /**
   * Makes the quiz private
   */
  public makePrivate(): void {
    this._isPublic = false;
    this._updatedAt = new Date();
  }

  /**
   * Toggles the public/private status
   */
  public toggleVisibility(): boolean {
    this._isPublic = !this._isPublic;
    this._updatedAt = new Date();
    return this._isPublic;
  }

  /**
   * Updates the question distribution
   */
  public updateDistribution(distribution: QuizDistribution): void {
    if (!QuizDistributionService.validate(distribution)) {
      throw new Error("Invalid question distribution");
    }

    this._questionDistribution = QuizDistributionService.encode(distribution);
    this._updatedAt = new Date();
  }

  /**
   * Checks if the user owns this quiz
   */
  public isOwnedBy(userId: string): boolean {
    return this._userId === userId;
  }

  /**
   * Checks if a user can access this quiz
   */
  public canBeAccessedBy(userId: string | null): boolean {
    if (this._isPublic) {
      return true;
    }
    return userId !== null && this.isOwnedBy(userId);
  }

  /**
   * Converts the entity to a plain object for persistence
   */
  public toPlain(): QuizProps {
    return {
      id: this._id,
      userId: this._userId,
      title: this._title,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      isPublic: this._isPublic,
      questionDistribution: this._questionDistribution,
    };
  }
}
