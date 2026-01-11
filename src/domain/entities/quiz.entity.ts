import {
  QuizDistributionService,
  type QuizDistribution,
} from "../services/quiz-distribution.service";
import { QuizVisibility } from "../enums/quiz-visibility.enum";
import { QuizStatus } from "../enums/quiz-status.enum";
import { InvariantViolationError, InvalidOperationError } from "../errors";
import { uuidToSlug } from "../value-objects/slug.vo";

/**
 * Properties required to create a Quiz entity
 */
export interface QuizProps {
  id: string;
  userId: string;
  title: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
  visibility: QuizVisibility;
  questionDistribution: number;
  status: QuizStatus;
  errorMessage: string | null;
}

/**
 * Properties for creating a new Quiz (without computed fields)
 */
export interface CreateQuizProps {
  id: string;
  userId: string;
  title: string;
  distribution: QuizDistribution;
  visibility?: QuizVisibility;
  status?: QuizStatus;
}

/**
 * Quiz Entity
 *
 * Represents a quiz containing multiple questions.
 * The question distribution is stored as a bit-packed 32-bit integer.
 *
 * Visibility levels:
 * - PRIVATE: Only owner can view/attempt
 * - UNLISTED: Anyone with the link can view/attempt; not listed in public directories
 * - PUBLIC: Discoverable in app directories; anyone can view/attempt
 */
export class Quiz {
  private readonly _id: string;
  private readonly _userId: string;
  private readonly _slug: string;
  private _title: string;
  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private _visibility: QuizVisibility;
  private _questionDistribution: number;
  private _status: QuizStatus;
  private _errorMessage: string | null;

  private constructor(props: QuizProps) {
    this._id = props.id;
    this._userId = props.userId;
    this._slug = props.slug;
    this._title = props.title;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    this._visibility = props.visibility;
    this._questionDistribution = props.questionDistribution;
    this._status = props.status;
    this._errorMessage = props.errorMessage;
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

    // Generate slug from UUID (deterministic)
    const slug = uuidToSlug(props.id);

    return new Quiz({
      id: props.id,
      userId: props.userId,
      title: props.title,
      slug,
      createdAt: now,
      updatedAt: now,
      visibility: props.visibility ?? QuizVisibility.PRIVATE,
      questionDistribution: encodedDistribution,
      status: props.status ?? QuizStatus.GENERATING,
      errorMessage: null,
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
      throw new InvariantViolationError("Quiz ID is required", "id");
    }

    if (!props.userId || typeof props.userId !== "string") {
      throw new InvariantViolationError("User ID is required", "userId");
    }

    if (
      !props.title ||
      typeof props.title !== "string" ||
      props.title.trim().length === 0
    ) {
      throw new InvariantViolationError(
        "Quiz title is required and cannot be empty",
        "title"
      );
    }

    if (props.title.length > 255) {
      throw new InvariantViolationError(
        "Quiz title cannot exceed 255 characters",
        "title"
      );
    }

    if (!QuizDistributionService.validate(props.distribution)) {
      throw new InvariantViolationError(
        "Invalid question distribution",
        "distribution"
      );
    }

    if (
      props.visibility !== undefined &&
      !Object.values(QuizVisibility).includes(props.visibility)
    ) {
      throw new InvariantViolationError(
        "Invalid visibility value",
        "visibility"
      );
    }
  }

  /**
   * Validates properties for reconstituting a Quiz.
   * Enforces full invariants including distribution encoding validity.
   */
  private static validateProps(props: QuizProps): void {
    if (!props.id || typeof props.id !== "string") {
      throw new InvariantViolationError("Quiz ID is required", "id");
    }

    if (!props.userId || typeof props.userId !== "string") {
      throw new InvariantViolationError("User ID is required", "userId");
    }

    if (
      !props.title ||
      typeof props.title !== "string" ||
      props.title.trim().length === 0
    ) {
      throw new InvariantViolationError(
        "Quiz title is required and cannot be empty",
        "title"
      );
    }

    if (!props.slug || typeof props.slug !== "string") {
      throw new InvariantViolationError("Quiz slug is required", "slug");
    }

    if (
      !(props.createdAt instanceof Date) ||
      isNaN(props.createdAt.getTime())
    ) {
      throw new InvariantViolationError(
        "Valid createdAt date is required",
        "createdAt"
      );
    }

    if (
      !(props.updatedAt instanceof Date) ||
      isNaN(props.updatedAt.getTime())
    ) {
      throw new InvariantViolationError(
        "Valid updatedAt date is required",
        "updatedAt"
      );
    }

    if (!Object.values(QuizVisibility).includes(props.visibility)) {
      throw new InvariantViolationError(
        "visibility must be a valid QuizVisibility value",
        "visibility"
      );
    }

    if (
      typeof props.questionDistribution !== "number" ||
      !Number.isInteger(props.questionDistribution)
    ) {
      throw new InvariantViolationError(
        "questionDistribution must be an integer",
        "questionDistribution"
      );
    }

    // Validate the encoded distribution can be decoded to a valid distribution
    const decoded = QuizDistributionService.decode(props.questionDistribution);
    if (!QuizDistributionService.validate(decoded)) {
      throw new InvariantViolationError(
        "questionDistribution contains invalid encoded values",
        "questionDistribution"
      );
    }

    if (!Object.values(QuizStatus).includes(props.status)) {
      throw new InvariantViolationError(
        "status must be a valid QuizStatus value",
        "status"
      );
    }

    if (props.errorMessage !== null && typeof props.errorMessage !== "string") {
      throw new InvariantViolationError(
        "errorMessage must be a string or null",
        "errorMessage"
      );
    }
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get userId(): string {
    return this._userId;
  }

  get slug(): string {
    return this._slug;
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

  get status(): QuizStatus {
    return this._status;
  }

  get errorMessage(): string | null {
    return this._errorMessage;
  }

  get visibility(): QuizVisibility {
    return this._visibility;
  }

  /**
   * @deprecated Use visibility instead. This getter is for backward compatibility.
   */
  get isPublic(): boolean {
    return this._visibility === QuizVisibility.PUBLIC;
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
      throw new InvariantViolationError(
        "Quiz title is required and cannot be empty",
        "title"
      );
    }

    if (title.length > 255) {
      throw new InvariantViolationError(
        "Quiz title cannot exceed 255 characters",
        "title"
      );
    }

    this._title = title.trim();
    this._updatedAt = new Date();
  }

  /**
   * Sets the quiz visibility
   */
  public setVisibility(visibility: QuizVisibility): void {
    if (!Object.values(QuizVisibility).includes(visibility)) {
      throw new InvariantViolationError(
        "Invalid visibility value",
        "visibility"
      );
    }
    this._visibility = visibility;
    this._updatedAt = new Date();
  }

  /**
   * Makes the quiz public for sharing
   */
  public makePublic(): void {
    this._visibility = QuizVisibility.PUBLIC;
    this._updatedAt = new Date();
  }

  /**
   * Makes the quiz private
   */
  public makePrivate(): void {
    this._visibility = QuizVisibility.PRIVATE;
    this._updatedAt = new Date();
  }

  /**
   * Makes the quiz unlisted (accessible via link only)
   */
  public makeUnlisted(): void {
    this._visibility = QuizVisibility.UNLISTED;
    this._updatedAt = new Date();
  }

  /**
   * Updates the question distribution
   */
  public updateDistribution(distribution: QuizDistribution): void {
    if (!QuizDistributionService.validate(distribution)) {
      throw new InvariantViolationError(
        "Invalid question distribution",
        "distribution"
      );
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
   * Checks if a user can access this quiz based on visibility rules
   *
   * Access rules:
   * - PRIVATE: Only owner can view/attempt
   * - UNLISTED: Anyone with the link can view/attempt
   * - PUBLIC: Anyone can view/attempt
   */
  public canBeAccessedBy(userId: string | null): boolean {
    switch (this._visibility) {
      case QuizVisibility.PUBLIC:
      case QuizVisibility.UNLISTED:
        return true;
      case QuizVisibility.PRIVATE:
        return userId !== null && this.isOwnedBy(userId);
      default:
        return false;
    }
  }

  /**
   * Checks if this quiz should be listed in public directories
   */
  public isDiscoverable(): boolean {
    return this._visibility === QuizVisibility.PUBLIC;
  }

  /**
   * Checks if the quiz is currently being generated
   */
  public isGenerating(): boolean {
    return this._status === QuizStatus.GENERATING;
  }

  /**
   * Checks if the quiz is ready
   */
  public isReady(): boolean {
    return this._status === QuizStatus.READY;
  }

  /**
   * Checks if the quiz generation failed
   */
  public hasFailed(): boolean {
    return this._status === QuizStatus.FAILED;
  }

  /**
   * Marks the quiz as ready (generation completed successfully)
   */
  public markAsReady(): void {
    this._status = QuizStatus.READY;
    this._errorMessage = null;
    this._updatedAt = new Date();
  }

  /**
   * Marks the quiz as failed with an error message
   */
  public markAsFailed(errorMessage: string): void {
    if (!errorMessage || errorMessage.trim().length === 0) {
      throw new InvariantViolationError(
        "Error message is required when marking quiz as failed",
        "errorMessage"
      );
    }
    this._status = QuizStatus.FAILED;
    this._errorMessage = errorMessage;
    this._updatedAt = new Date();
  }

  /**
   * Converts the entity to a plain object for persistence
   */
  public toPlain(): QuizProps {
    return {
      id: this._id,
      userId: this._userId,
      title: this._title,
      slug: this._slug,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      visibility: this._visibility,
      questionDistribution: this._questionDistribution,
      status: this._status,
      errorMessage: this._errorMessage,
    };
  }
}
