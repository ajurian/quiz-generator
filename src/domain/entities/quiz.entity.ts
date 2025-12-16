import {
  QuizDistributionService,
  type QuizDistribution,
} from "../services/quiz-distribution.service";
import { QuizVisibility } from "../enums/quiz-visibility.enum";
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

  private constructor(props: QuizProps) {
    this._id = props.id;
    this._userId = props.userId;
    this._slug = props.slug;
    this._title = props.title;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    this._visibility = props.visibility;
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

    if (
      props.visibility !== undefined &&
      !Object.values(QuizVisibility).includes(props.visibility)
    ) {
      throw new Error("Invalid visibility value");
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

    if (!props.slug || typeof props.slug !== "string") {
      throw new Error("Quiz slug is required");
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

    if (!Object.values(QuizVisibility).includes(props.visibility)) {
      throw new Error("visibility must be a valid QuizVisibility value");
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
      throw new Error("Quiz title is required and cannot be empty");
    }

    if (title.length > 255) {
      throw new Error("Quiz title cannot exceed 255 characters");
    }

    this._title = title.trim();
    this._updatedAt = new Date();
  }

  /**
   * Sets the quiz visibility
   */
  public setVisibility(visibility: QuizVisibility): void {
    if (!Object.values(QuizVisibility).includes(visibility)) {
      throw new Error("Invalid visibility value");
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
    };
  }
}
