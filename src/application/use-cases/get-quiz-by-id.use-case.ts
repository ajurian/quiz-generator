import type { IQuizRepository, IQuestionRepository } from "../ports";
import {
  toQuizResponseDTO,
  toQuestionResponseDTO,
  type QuizResponseDTO,
  type QuestionResponseDTO,
} from "../dtos";
import { NotFoundError, ForbiddenError, ValidationError } from "../errors";
import { QuizVisibility, isValidSlug } from "../../domain";

/**
 * Input for GetQuizByIdUseCase
 */
export interface GetQuizByIdInput {
  quizId?: string;
  quizSlug?: string;
  userId?: string | null; // Optional for public/unlisted quizzes
}

/**
 * Output for GetQuizByIdUseCase
 */
export interface GetQuizByIdOutput {
  quiz: QuizResponseDTO;
  questions: QuestionResponseDTO[];
  isOwner: boolean;
}

/**
 * Dependencies for GetQuizByIdUseCase
 */
export interface GetQuizByIdUseCaseDeps {
  quizRepository: IQuizRepository;
  questionRepository: IQuestionRepository;
}

/**
 * Use case for getting a quiz by ID or slug with access control
 *
 * Access rules by visibility:
 * - PRIVATE: Only owner can view/attempt (return 404 for non-owners to avoid existence leak)
 * - UNLISTED: Anyone with the link can view/attempt
 * - PUBLIC: Anyone can view/attempt
 *
 * Flow:
 * 1. Validate input
 * 2. Find quiz by ID or slug
 * 3. Check access permissions
 * 4. Fetch questions
 * 5. Transform to response DTOs
 */
export class GetQuizByIdUseCase {
  constructor(private readonly deps: GetQuizByIdUseCaseDeps) {}

  async execute(
    input: GetQuizByIdInput,
    baseUrl?: string
  ): Promise<GetQuizByIdOutput> {
    // 1. Validate input - need either quizId or quizSlug
    if (!input.quizId && !input.quizSlug) {
      throw new ValidationError("Quiz ID or slug is required", {
        quizId: ["Either Quiz ID or slug is required"],
      });
    }

    if (input.quizId && typeof input.quizId !== "string") {
      throw new ValidationError("Quiz ID must be a string", {
        quizId: ["Quiz ID must be a string"],
      });
    }

    if (input.quizSlug && !isValidSlug(input.quizSlug)) {
      throw new ValidationError("Invalid quiz slug format", {
        quizSlug: ["Invalid quiz slug format"],
      });
    }

    // 2. Find quiz by ID or slug
    let quiz;
    if (input.quizSlug) {
      quiz = await this.deps.quizRepository.findBySlug(input.quizSlug);
    } else {
      quiz = await this.deps.quizRepository.findById(input.quizId!);
    }

    if (!quiz) {
      const identifier = input.quizSlug ?? input.quizId!;
      throw new NotFoundError("Quiz", identifier);
    }

    // 3. Check access permissions based on visibility
    const userId = input.userId ?? null;
    const isOwner = quiz.isOwnedBy(userId ?? "");

    if (!quiz.canBeAccessedBy(userId)) {
      // For private quizzes, return 404 to non-owners to avoid existence leak
      if (quiz.visibility === QuizVisibility.PRIVATE) {
        throw new NotFoundError("Quiz", input.quizSlug ?? input.quizId!);
      }
      throw new ForbiddenError(
        "You do not have permission to access this quiz"
      );
    }

    // 4. Fetch questions
    const questions = await this.deps.questionRepository.findByQuizId(quiz.id);

    // 5. Transform to response DTOs
    return {
      quiz: toQuizResponseDTO(quiz.toPlain(), baseUrl),
      questions: questions.map((q) => toQuestionResponseDTO(q.toPlain())),
      isOwner,
    };
  }
}
