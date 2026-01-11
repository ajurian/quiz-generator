import { InvariantViolationError } from "../errors";

/**
 * Properties required to reconstitute a SourceMaterial entity
 */
export interface SourceMaterialProps {
  id: string;
  quizId: string;
  title: string;
  fileKey: string;
  mimeType: string;
  sizeBytes: number;
  /** 0-based reference index within the quiz, used by questions to reference source */
  quizReferenceIndex: number;
  createdAt: Date;
}

/**
 * Properties for creating a new SourceMaterial
 */
export interface CreateSourceMaterialProps {
  id: string;
  quizId: string;
  title: string;
  fileKey: string;
  mimeType: string;
  sizeBytes: number;
  /** 0-based reference index within the quiz, used by questions to reference source */
  quizReferenceIndex: number;
}

/**
 * SourceMaterial Entity
 *
 * Represents a study material file uploaded for quiz generation.
 * Files are stored in R2 with the key format: {userId}/{quizSlug}/{uuidv7-base64url}
 */
export class SourceMaterial {
  private readonly _id: string;
  private readonly _quizId: string;
  private readonly _title: string;
  private readonly _fileKey: string;
  private readonly _mimeType: string;
  private readonly _sizeBytes: number;
  private readonly _quizReferenceIndex: number;
  private readonly _createdAt: Date;

  private constructor(props: SourceMaterialProps) {
    this._id = props.id;
    this._quizId = props.quizId;
    this._title = props.title;
    this._fileKey = props.fileKey;
    this._mimeType = props.mimeType;
    this._sizeBytes = props.sizeBytes;
    this._quizReferenceIndex = props.quizReferenceIndex;
    this._createdAt = props.createdAt;
  }

  /**
   * Creates a new SourceMaterial entity
   * @throws {Error} if validation fails
   */
  public static create(props: CreateSourceMaterialProps): SourceMaterial {
    SourceMaterial.validateCreateProps(props);

    return new SourceMaterial({
      id: props.id,
      quizId: props.quizId,
      title: props.title,
      fileKey: props.fileKey,
      mimeType: props.mimeType,
      sizeBytes: props.sizeBytes,
      quizReferenceIndex: props.quizReferenceIndex,
      createdAt: new Date(),
    });
  }

  /**
   * Reconstitutes a SourceMaterial entity from persisted data
   * @throws {Error} if validation fails
   */
  public static reconstitute(props: SourceMaterialProps): SourceMaterial {
    SourceMaterial.validateProps(props);
    return new SourceMaterial(props);
  }

  /**
   * Validates properties for creating a new SourceMaterial
   */
  private static validateCreateProps(props: CreateSourceMaterialProps): void {
    if (!props.id || typeof props.id !== "string") {
      throw new InvariantViolationError("SourceMaterial ID is required", "id");
    }

    if (!props.quizId || typeof props.quizId !== "string") {
      throw new InvariantViolationError("Quiz ID is required", "quizId");
    }

    if (
      !props.title ||
      typeof props.title !== "string" ||
      props.title.trim().length === 0
    ) {
      throw new InvariantViolationError(
        "SourceMaterial title is required and cannot be empty",
        "title"
      );
    }

    if (props.title.length > 255) {
      throw new InvariantViolationError(
        "SourceMaterial title cannot exceed 255 characters",
        "title"
      );
    }

    if (
      !props.fileKey ||
      typeof props.fileKey !== "string" ||
      props.fileKey.trim().length === 0
    ) {
      throw new InvariantViolationError(
        "File key is required and cannot be empty",
        "fileKey"
      );
    }

    if (
      !props.mimeType ||
      typeof props.mimeType !== "string" ||
      props.mimeType.trim().length === 0
    ) {
      throw new InvariantViolationError(
        "MIME type is required and cannot be empty",
        "mimeType"
      );
    }

    if (typeof props.sizeBytes !== "number" || props.sizeBytes < 0) {
      throw new InvariantViolationError(
        "Size in bytes must be a non-negative number",
        "sizeBytes"
      );
    }

    if (
      typeof props.quizReferenceIndex !== "number" ||
      props.quizReferenceIndex < 0 ||
      !Number.isInteger(props.quizReferenceIndex)
    ) {
      throw new InvariantViolationError(
        "Quiz reference index must be a non-negative integer (0-based)",
        "quizReferenceIndex"
      );
    }
  }

  /**
   * Validates properties for reconstituting a SourceMaterial
   */
  private static validateProps(props: SourceMaterialProps): void {
    SourceMaterial.validateCreateProps(props);

    if (
      !(props.createdAt instanceof Date) ||
      isNaN(props.createdAt.getTime())
    ) {
      throw new InvariantViolationError(
        "Valid createdAt date is required",
        "createdAt"
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

  get title(): string {
    return this._title;
  }

  get fileKey(): string {
    return this._fileKey;
  }

  get mimeType(): string {
    return this._mimeType;
  }

  get sizeBytes(): number {
    return this._sizeBytes;
  }

  get quizReferenceIndex(): number {
    return this._quizReferenceIndex;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  /**
   * Converts the entity to a plain object for persistence
   */
  public toPlain(): SourceMaterialProps {
    return {
      id: this._id,
      quizId: this._quizId,
      title: this._title,
      fileKey: this._fileKey,
      mimeType: this._mimeType,
      sizeBytes: this._sizeBytes,
      quizReferenceIndex: this._quizReferenceIndex,
      createdAt: this._createdAt,
    };
  }
}
