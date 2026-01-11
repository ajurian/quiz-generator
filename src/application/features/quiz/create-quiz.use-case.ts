import { Quiz, Question, QuizDistribution } from "@/domain";
import type {
  IQuizRepository,
  IQuestionRepository,
  IAIQuizGenerator,
  IFileStorageService,
  IIdGenerator,
  FileMetadata,
  GeneratedQuestionData,
} from "../../ports";
import {
  createQuizInputSchema,
  type CreateQuizInput,
  toQuizResponseDTO,
  type QuizResponseDTO,
} from "../../dtos";
import {
  ValidationError,
  ExternalServiceError,
  QuotaExceededError,
} from "../../errors";
import { QuizGenerationPolicy } from "../generation/policy";

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

  async execute(input: CreateQuizUseCaseInput): Promise<QuizResponseDTO> {
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
        orderIndex: index,
        type: q.type,
        stem: q.stem,
        options: q.options.map((opt) => ({
          index: opt.index as "A" | "B" | "C" | "D",
          text: opt.text,
          isCorrect: opt.isCorrect,
          errorRationale: opt.errorRationale,
        })),
        correctExplanation: q.correctExplanation,
        sourceQuote: q.sourceQuote,
        reference: q.reference,
      })
    );

    // 6. Persist to database
    const savedQuiz = await this.deps.quizRepository.create(quiz);
    await this.deps.questionRepository.createBulk(questions);

    // 7. Return response DTO
    return toQuizResponseDTO(savedQuiz.toPlain());
  }

  /**
   * Generates questions using QuizGenerationPolicy for model fallback
   */
  private async generateQuestionsWithFallback(
    files: FileMetadata[],
    distribution: QuizDistribution
  ): Promise<GeneratedQuestionData[]> {
    const policy = QuizGenerationPolicy.forSync();

    try {
      const result = await policy.executeWithFallback((model) =>
        this.deps.aiGenerator.generateQuestions({
          files,
          distribution,
          model,
        })
      );
      return result.data;
    } catch (error) {
      if (policy.isQuotaError(error)) {
        throw new QuotaExceededError("AI Quiz Generator");
      }
      throw new ExternalServiceError(
        "AI Quiz Generator",
        error instanceof Error ? error : undefined
      );
    }
  }
}
