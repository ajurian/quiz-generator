import { AttemptStatus } from "../enums/attempt-status.enum";
import { InvariantViolationError, InvalidOperationError } from "../errors";
import { uuidToSlug } from "../value-objects/slug.vo";

/**
 * Properties required to create a QuizAttempt entity
 */
export interface QuizAttemptProps {
  id: string;
  slug: string;
  quizId: string;
  userId: string | null; // null for anonymous attempts
  status: AttemptStatus;
  score: number | null;
  durationMs: number | null;
  startedAt: Date;
  submittedAt: Date | null;
  /** User's selected answers (questionId -> optionId) */
  answers: Record<string, string>;
}

/**
 * Properties for creating a new QuizAttempt
 */
export interface CreateQuizAttemptProps {
  id: string;
  quizId: string;
  userId: string | null;
  /** Initial answers (empty by default, used when resuming) */
  answers?: Record<string, string>;
}

/**
 * QuizAttempt Entity
 *
 * Represents a user's attempt at completing a quiz.
 * Tracks the status, score, and duration of the attempt.
 * Every attempt is recorded - creators can view questions in /quiz/m/{slug}.
 *
 * Status:
 * - IN_PROGRESS: User has started but not submitted
 * - SUBMITTED: User has completed and submitted
 */
export class QuizAttempt {
  private readonly _id: string;
  private readonly _slug: string;
  private readonly _quizId: string;
  private readonly _userId: string | null;
  private _status: AttemptStatus;
  private _score: number | null;
  private _durationMs: number | null;
  private _startedAt: Date;
  private _submittedAt: Date | null;
  private _answers: Record<string, string>;

  private constructor(props: QuizAttemptProps) {
    this._id = props.id;
    this._slug = props.slug;
    this._quizId = props.quizId;
    this._userId = props.userId;
    this._status = props.status;
    this._score = props.score;
    this._durationMs = props.durationMs;
    this._startedAt = props.startedAt;
    this._submittedAt = props.submittedAt;
    this._answers = props.answers;
  }

  /**
   * Creates a new QuizAttempt entity
   * @throws {Error} if validation fails
   */
  public static create(props: CreateQuizAttemptProps): QuizAttempt {
    QuizAttempt.validateCreateProps(props);

    const slug = uuidToSlug(props.id);

    return new QuizAttempt({
      id: props.id,
      slug,
      quizId: props.quizId,
      userId: props.userId,
      status: AttemptStatus.IN_PROGRESS,
      score: null,
      durationMs: null,
      startedAt: new Date(),
      submittedAt: null,
      answers: props.answers ?? {},
    });
  }

  /**
   * Reconstitutes a QuizAttempt entity from persisted data
   * @throws {Error} if validation fails
   */
  public static reconstitute(props: QuizAttemptProps): QuizAttempt {
    QuizAttempt.validateProps(props);
    return new QuizAttempt(props);
  }

  /**
   * Validates properties for creating a new QuizAttempt
   */
  private static validateCreateProps(props: CreateQuizAttemptProps): void {
    if (!props.id || typeof props.id !== "string") {
      throw new InvariantViolationError("Attempt ID is required", "id");
    }

    if (!props.quizId || typeof props.quizId !== "string") {
      throw new InvariantViolationError("Quiz ID is required", "quizId");
    }

    if (props.userId !== null && typeof props.userId !== "string") {
      throw new InvariantViolationError(
        "User ID must be a string or null",
        "userId"
      );
    }
  }

  /**
   * Validates properties for reconstituting a QuizAttempt.
   * Enforces full invariants including answers structure validation.
   */
  private static validateProps(props: QuizAttemptProps): void {
    if (!props.id || typeof props.id !== "string") {
      throw new InvariantViolationError("Attempt ID is required", "id");
    }

    if (!props.slug || typeof props.slug !== "string") {
      throw new InvariantViolationError("Attempt slug is required", "slug");
    }

    if (!props.quizId || typeof props.quizId !== "string") {
      throw new InvariantViolationError("Quiz ID is required", "quizId");
    }

    if (props.userId !== null && typeof props.userId !== "string") {
      throw new InvariantViolationError(
        "User ID must be a string or null",
        "userId"
      );
    }

    if (!Object.values(AttemptStatus).includes(props.status)) {
      throw new InvariantViolationError(
        "status must be a valid AttemptStatus value",
        "status"
      );
    }

    if (
      props.score !== null &&
      (typeof props.score !== "number" || props.score < 0)
    ) {
      throw new InvariantViolationError(
        "Score must be a non-negative number or null",
        "score"
      );
    }

    if (
      props.durationMs !== null &&
      (typeof props.durationMs !== "number" || props.durationMs < 0)
    ) {
      throw new InvariantViolationError(
        "Duration must be a non-negative number or null",
        "durationMs"
      );
    }

    if (
      !(props.startedAt instanceof Date) ||
      isNaN(props.startedAt.getTime())
    ) {
      throw new InvariantViolationError(
        "Valid startedAt date is required",
        "startedAt"
      );
    }

    if (
      props.submittedAt !== null &&
      (!(props.submittedAt instanceof Date) ||
        isNaN(props.submittedAt.getTime()))
    ) {
      throw new InvariantViolationError(
        "submittedAt must be a valid date or null",
        "submittedAt"
      );
    }

    if (
      props.answers === null ||
      typeof props.answers !== "object" ||
      Array.isArray(props.answers)
    ) {
      throw new InvariantViolationError("Answers must be an object", "answers");
    }

    // Validate answers structure: all values must be strings (option indices)
    for (const [questionId, optionIndex] of Object.entries(props.answers)) {
      if (typeof questionId !== "string" || typeof optionIndex !== "string") {
        throw new InvariantViolationError(
          "Answers must be a Record<string, string> (questionId -> optionIndex)",
          "answers"
        );
      }
    }
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get slug(): string {
    return this._slug;
  }

  get quizId(): string {
    return this._quizId;
  }

  get userId(): string | null {
    return this._userId;
  }

  get status(): AttemptStatus {
    return this._status;
  }

  get score(): number | null {
    return this._score;
  }

  get durationMs(): number | null {
    return this._durationMs;
  }

  get startedAt(): Date {
    return this._startedAt;
  }

  get submittedAt(): Date | null {
    return this._submittedAt;
  }

  get answers(): Record<string, string> {
    return { ...this._answers };
  }

  // Computed Properties

  /**
   * Checks if this attempt is in progress
   */
  get isInProgress(): boolean {
    return this._status === AttemptStatus.IN_PROGRESS;
  }

  /**
   * Checks if this attempt has been submitted
   */
  get isSubmitted(): boolean {
    return this._status === AttemptStatus.SUBMITTED;
  }

  /**
   * Gets the duration in a human-readable format
   */
  get formattedDuration(): string | null {
    if (this._durationMs === null) return null;

    const totalSeconds = Math.floor(this._durationMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes === 0) {
      return `${seconds}s`;
    }
    return `${minutes}m ${seconds}s`;
  }

  // Business Methods

  /**
   * Submits the attempt with a score and answers
   * @throws {InvalidOperationError} if already submitted
   */
  public submit(score: number, answers: Record<string, string>): void {
    if (this._status === AttemptStatus.SUBMITTED) {
      throw new InvalidOperationError("Attempt has already been submitted");
    }

    if (typeof score !== "number" || score < 0) {
      throw new InvariantViolationError(
        "Score must be a non-negative number",
        "score"
      );
    }

    const now = new Date();
    this._status = AttemptStatus.SUBMITTED;
    this._score = score;
    this._answers = { ...answers };
    this._submittedAt = now;
    this._durationMs = now.getTime() - this._startedAt.getTime();
  }

  /**
   * Updates the answers for an in-progress attempt
   * @throws {InvalidOperationError} if already submitted
   */
  public updateAnswers(answers: Record<string, string>): void {
    if (this._status === AttemptStatus.SUBMITTED) {
      throw new InvalidOperationError(
        "Cannot update answers on submitted attempt"
      );
    }
    this._answers = { ...answers };
  }

  /**
   * Updates a single answer for autosave functionality
   * @throws {InvalidOperationError} if already submitted
   */
  public updateAnswer(questionId: string, optionIndex: string): void {
    if (this._status === AttemptStatus.SUBMITTED) {
      throw new InvalidOperationError(
        "Cannot update answers on submitted attempt"
      );
    }
    this._answers = { ...this._answers, [questionId]: optionIndex };
  }

  /**
   * Resets all answers for 'Start Over' functionality
   * Keeps the same attempt but clears all answers
   * @throws {InvalidOperationError} if already submitted
   * @deprecated Use reset() instead which also resets the timer
   */
  public resetAnswers(): void {
    if (this._status === AttemptStatus.SUBMITTED) {
      throw new InvalidOperationError(
        "Cannot reset answers on submitted attempt"
      );
    }
    this._answers = {};
  }

  /**
   * Fully resets the attempt for 'Start Over' functionality
   * Keeps the same attempt ID but clears all answers and resets the timer.
   * This is equivalent to creating a new attempt but reusing the same ID.
   * @throws {InvalidOperationError} if already submitted
   */
  public reset(): void {
    if (this._status === AttemptStatus.SUBMITTED) {
      throw new InvalidOperationError("Cannot reset a submitted attempt");
    }
    this._answers = {};
    this._startedAt = new Date();
    this._status = AttemptStatus.IN_PROGRESS;
    this._score = null;
    this._durationMs = null;
    this._submittedAt = null;
  }

  /**
   * Checks if a user owns this attempt
   */
  public isOwnedBy(userId: string | null): boolean {
    if (this._userId === null || userId === null) {
      return false;
    }
    return this._userId === userId;
  }

  /**
   * Checks if this attempt should be included in statistics
   * All submitted attempts count for stats
   */
  public countsForStats(): boolean {
    return this._status === AttemptStatus.SUBMITTED;
  }

  /**
   * Converts the entity to a plain object for persistence
   */
  public toPlain(): QuizAttemptProps {
    return {
      id: this._id,
      slug: this._slug,
      quizId: this._quizId,
      userId: this._userId,
      status: this._status,
      score: this._score,
      durationMs: this._durationMs,
      startedAt: this._startedAt,
      submittedAt: this._submittedAt,
      answers: { ...this._answers },
    };
  }
}
