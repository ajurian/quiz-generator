import { Quiz, Question, GeminiModel } from "../../domain";
import type {
  IQuizRepository,
  IQuestionRepository,
  IAIQuizGenerator,
  IFileStorageService,
  IIdGenerator,
  FileMetadata,
  GeneratedQuestionData,
} from "../ports";
import {
  createQuizInputSchema,
  type CreateQuizInput,
  toQuizResponseDTO,
  type QuizResponseDTO,
} from "../dtos";
import {
  ValidationError,
  ExternalServiceError,
  QuotaExceededError,
} from "../errors";

/**
 * Input for CreateQuizUseCase including files
 */
export interface CreateQuizUseCaseInput extends CreateQuizInput {
  files: File[];
}

/**
 * Dependencies for CreateQuizUseCase
 */
export interface CreateQuizUseCaseDeps {
  quizRepository: IQuizRepository;
  questionRepository: IQuestionRepository;
  aiGenerator: IAIQuizGenerator;
  fileStorage: IFileStorageService;
  idGenerator: IIdGenerator;
}

/**
 * Use case for creating a new quiz with AI-generated questions
 *
 * Flow:
 * 1. Validate input
 * 2. Upload files to storage
 * 3. Generate questions using AI (with fallback)
 * 4. Create Quiz entity
 * 5. Create Question entities
 * 6. Persist to database
 * 7. Return QuizResponseDTO
 */
export class CreateQuizUseCase {
  constructor(private readonly deps: CreateQuizUseCaseDeps) {}

  async execute(
    input: CreateQuizUseCaseInput,
    baseUrl?: string
  ): Promise<QuizResponseDTO> {
    // 1. Validate input
    const validationResult = createQuizInputSchema.safeParse(input);
    if (!validationResult.success) {
      const errors: Record<string, string[]> = {};
      validationResult.error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(issue.message);
      });
      throw new ValidationError("Invalid quiz input", errors);
    }

    // Validate files
    if (!input.files || input.files.length === 0) {
      throw new ValidationError("At least one file is required", {
        files: ["At least one file is required"],
      });
    }

    // 2. Upload files to storage
    let uploadedFiles: FileMetadata[];
    try {
      uploadedFiles = await this.deps.fileStorage.uploadFiles(input.files);
    } catch (error) {
      throw new ExternalServiceError(
        "File Storage",
        error instanceof Error ? error : undefined
      );
    }

    // 3. Generate questions using AI with fallback
    let generatedQuestions: GeneratedQuestionData[];
    try {
      generatedQuestions = await this.generateQuestionsWithFallback(
        uploadedFiles,
        input.distribution
      );
    } catch (error) {
      // Clean up uploaded files on failure
      await this.deps.fileStorage
        .deleteFiles(uploadedFiles.map((f) => f.id))
        .catch(() => {});
      throw error;
    }

    // 4. Create Quiz entity
    const quizId = this.deps.idGenerator.generate();
    const quiz = Quiz.create({
      id: quizId,
      userId: input.userId,
      title: input.title,
      distribution: input.distribution,
    });

    // 5. Create Question entities
    const questions = generatedQuestions.map((q, index) =>
      Question.create({
        id: this.deps.idGenerator.generate(),
        quizId,
        questionText: q.questionText,
        questionType: q.questionType,
        options: q.options.map((opt) => ({
          index: opt.index as "A" | "B" | "C" | "D",
          text: opt.text,
          explanation: opt.explanation,
          isCorrect: opt.isCorrect,
        })),
        orderIndex: index,
      })
    );

    // 6. Persist to database
    const savedQuiz = await this.deps.quizRepository.create(quiz);
    await this.deps.questionRepository.createBulk(questions);

    // 7. Return response DTO
    return toQuizResponseDTO(savedQuiz.toPlain(), baseUrl);
  }

  /**
   * Generates questions using primary model with fallback to lite model
   */
  private async generateQuestionsWithFallback(
    files: FileMetadata[],
    distribution: CreateQuizInput["distribution"]
  ): Promise<GeneratedQuestionData[]> {
    const primaryModel = GeminiModel.FLASH_2_5;
    const fallbackModel = GeminiModel.FLASH_2_5_LITE;

    try {
      // Try primary model first
      return await this.deps.aiGenerator.generateQuestions({
        files,
        distribution,
        model: primaryModel,
      });
    } catch (error) {
      // Check if it's a quota error
      if (this.isQuotaError(error)) {
        // Try fallback model
        try {
          return await this.deps.aiGenerator.generateQuestions({
            files,
            distribution,
            model: fallbackModel,
          });
        } catch (fallbackError) {
          if (this.isQuotaError(fallbackError)) {
            throw new QuotaExceededError("AI Quiz Generator");
          }
          throw new ExternalServiceError(
            "AI Quiz Generator",
            fallbackError instanceof Error ? fallbackError : undefined
          );
        }
      }
      throw new ExternalServiceError(
        "AI Quiz Generator",
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Checks if an error is a quota exceeded error
   */
  private isQuotaError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes("quota") ||
        message.includes("rate limit") ||
        message.includes("429")
      );
    }
    return false;
  }
}
