import type { IQuizRepository, IAttemptRepository } from "../ports";
import {
  toAttemptResponseDTO,
  toQuizResponseDTO,
  createAttemptSummary,
  type AttemptResponseDTO,
  type AttemptSummaryDTO,
  type QuizResponseDTO,
} from "../dtos";
import { NotFoundError, ForbiddenError, ValidationError } from "../errors";
import { isValidSlug } from "../../domain";

/**
 * Input for GetUserAttemptsUseCase
 */
export interface GetUserAttemptsInput {
  quizSlug: string;
  userId: string;
}

/**
 * Output for GetUserAttemptsUseCase
 */
export interface GetUserAttemptsOutput {
  quiz: QuizResponseDTO;
  attempts: AttemptResponseDTO[];
  summary: AttemptSummaryDTO;
}

/**
 * Dependencies for GetUserAttemptsUseCase
 */
export interface GetUserAttemptsUseCaseDeps {
  quizRepository: IQuizRepository;
  attemptRepository: IAttemptRepository;
}

/**
 * Use case for getting a user's attempts on a specific quiz
 *
 * Route: /quiz/h/{quiz_slug} - History list
 *
 * Flow:
 * 1. Validate input
 * 2. Find quiz by slug
 * 3. Check access permissions
 * 4. Fetch user's attempts
 * 5. Calculate summary statistics
 */
export class GetUserAttemptsUseCase {
  constructor(private readonly deps: GetUserAttemptsUseCaseDeps) {}

  async execute(
    input: GetUserAttemptsInput,
    baseUrl?: string
  ): Promise<GetUserAttemptsOutput> {
    // 1. Validate input
    if (!input.quizSlug || !isValidSlug(input.quizSlug)) {
      throw new ValidationError("Invalid quiz slug", {
        quizSlug: ["Valid quiz slug is required"],
      });
    }

    if (!input.userId || typeof input.userId !== "string") {
      throw new ValidationError("User ID is required", {
        userId: ["User ID is required"],
      });
    }

    // 2. Find quiz by slug
    const quiz = await this.deps.quizRepository.findBySlug(input.quizSlug);
    if (!quiz) {
      throw new NotFoundError("Quiz", input.quizSlug);
    }

    // 3. Check access permissions
    if (!quiz.canBeAccessedBy(input.userId)) {
      throw new NotFoundError("Quiz", input.quizSlug);
    }

    // 4. Fetch user's attempts
    const attempts = await this.deps.attemptRepository.findByQuizAndUser(
      quiz.id,
      input.userId
    );

    const attemptDTOs = attempts.map((a) => toAttemptResponseDTO(a.toPlain()));

    // 5. Calculate summary statistics
    const summary = createAttemptSummary(attemptDTOs);

    return {
      quiz: toQuizResponseDTO(quiz.toPlain(), baseUrl),
      attempts: attemptDTOs,
      summary,
    };
  }
}
