import type {
  IQuizRepository,
  IAttemptRepository,
  IQuestionRepository,
  ISourceMaterialRepository,
} from "../../ports";
import {
  toAttemptResponseDTO,
  toQuizResponseDTO,
  toQuestionResponseDTO,
  type AttemptResponseDTO,
  type QuizResponseDTO,
  type QuestionResponseDTO,
} from "../../dtos";
import { NotFoundError, ForbiddenError, ValidationError } from "../../errors";
import { isValidSlug } from "@/domain";

/**
 * Input for GetAttemptDetailUseCase
 */
export interface GetAttemptDetailInput {
  quizSlug: string;
  attemptSlug: string;
  userId: string | null;
}

/**
 * Output for GetAttemptDetailUseCase
 */
export interface GetAttemptDetailOutput {
  quiz: QuizResponseDTO;
  attempt: AttemptResponseDTO;
  questions: QuestionResponseDTO[];
  isOwner: boolean;
}

/**
 * Dependencies for GetAttemptDetailUseCase
 */
export interface GetAttemptDetailUseCaseDeps {
  quizRepository: IQuizRepository;
  attemptRepository: IAttemptRepository;
  questionRepository: IQuestionRepository;
  sourceMaterialRepository: ISourceMaterialRepository;
}

/**
 * Use case for getting attempt details (review screen)
 *
 * Route: /quiz/h/{quiz_slug}/{attempt_slug} - History detail
 *
 * Flow:
 * 1. Validate input
 * 2. Find quiz by slug
 * 3. Find attempt by slug
 * 4. Verify attempt belongs to quiz
 * 5. Check ownership/access
 * 6. Fetch questions
 */
export class GetAttemptDetailUseCase {
  constructor(private readonly deps: GetAttemptDetailUseCaseDeps) {}

  async execute(input: GetAttemptDetailInput): Promise<GetAttemptDetailOutput> {
    // 1. Validate input
    if (!input.quizSlug || !isValidSlug(input.quizSlug)) {
      throw new ValidationError("Invalid quiz slug", {
        quizSlug: ["Valid quiz slug is required"],
      });
    }

    if (!input.attemptSlug || !isValidSlug(input.attemptSlug)) {
      throw new ValidationError("Invalid attempt slug", {
        attemptSlug: ["Valid attempt slug is required"],
      });
    }

    // 2. Find quiz by slug
    const quiz = await this.deps.quizRepository.findBySlug(input.quizSlug);
    if (!quiz) {
      throw new NotFoundError("Quiz", input.quizSlug);
    }

    // 3. Find attempt by slug
    const attempt = await this.deps.attemptRepository.findBySlug(
      input.attemptSlug
    );
    if (!attempt) {
      throw new NotFoundError("Attempt", input.attemptSlug);
    }

    // 4. Verify attempt belongs to quiz
    if (attempt.quizId !== quiz.id) {
      throw new NotFoundError("Attempt", input.attemptSlug);
    }

    // 5. Check ownership/access
    const isOwner = attempt.isOwnedBy(input.userId);
    const isQuizOwner = quiz.isOwnedBy(input.userId ?? "");

    // Users can view their own attempts, quiz owners can view all attempts
    if (!isOwner && !isQuizOwner) {
      throw new ForbiddenError(
        "You do not have permission to view this attempt"
      );
    }

    // 6. Fetch questions and source materials
    const [questions, sourceMaterials] = await Promise.all([
      this.deps.questionRepository.findByQuizId(quiz.id),
      this.deps.sourceMaterialRepository.findByQuizId(quiz.id),
    ]);

    // Create a map from quizReferenceIndex to source material title
    const referenceTitleMap = new Map<number, string>();
    for (const material of sourceMaterials) {
      referenceTitleMap.set(material.quizReferenceIndex, material.title);
    }

    return {
      quiz: toQuizResponseDTO(quiz.toPlain()),
      attempt: toAttemptResponseDTO(attempt.toPlain()),
      questions: questions.map((q) =>
        toQuestionResponseDTO(q.toPlain(), referenceTitleMap.get(q.reference))
      ),
      isOwner,
    };
  }
}
