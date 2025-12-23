import type { IQuizRepository, IAttemptRepository } from "../ports";
import {
  toAttemptResponseDTO,
  toQuizResponseDTO,
  type AttemptResponseDTO,
  type QuizResponseDTO,
} from "../dtos";
import { ValidationError } from "../errors";

/**
 * Input for GetUserAttemptHistoryUseCase
 */
export interface GetUserAttemptHistoryInput {
  userId: string;
}

/**
 * Single item in the attempt history (quiz + latest attempt)
 */
export interface AttemptHistoryItemDTO {
  quiz: QuizResponseDTO;
  latestAttempt: AttemptResponseDTO;
}

/**
 * Output for GetUserAttemptHistoryUseCase
 */
export interface GetUserAttemptHistoryOutput {
  items: AttemptHistoryItemDTO[];
  totalQuizzesAttempted: number;
}

/**
 * Dependencies for GetUserAttemptHistoryUseCase
 */
export interface GetUserAttemptHistoryUseCaseDeps {
  quizRepository: IQuizRepository;
  attemptRepository: IAttemptRepository;
}

/**
 * Use case for getting a user's attempt history across all quizzes
 *
 * Returns the latest attempt for each quiz the user has attempted,
 * along with quiz information for display in the dashboard.
 *
 * Flow:
 * 1. Validate input
 * 2. Get latest attempt per quiz for user
 * 3. Fetch quiz details for each attempt
 * 4. Return combined data
 */
export class GetUserAttemptHistoryUseCase {
  constructor(private readonly deps: GetUserAttemptHistoryUseCaseDeps) {}

  async execute(
    input: GetUserAttemptHistoryInput
  ): Promise<GetUserAttemptHistoryOutput> {
    // 1. Validate input
    if (!input.userId || typeof input.userId !== "string") {
      throw new ValidationError("User ID is required", {
        userId: ["User ID is required"],
      });
    }

    // 2. Get latest attempt per quiz for user
    const latestAttempts =
      await this.deps.attemptRepository.findLatestAttemptPerQuizByUser(
        input.userId
      );

    if (latestAttempts.length === 0) {
      return {
        items: [],
        totalQuizzesAttempted: 0,
      };
    }

    // 3. Fetch quiz details for each attempt
    const quizIds = latestAttempts.map((item) => item.quizId);
    const quizzes = await this.deps.quizRepository.findByIds(quizIds);

    // Create a map for quick lookup
    const quizMap = new Map(quizzes.map((q) => [q.id, q]));

    // 4. Build response items (only include attempts with valid quizzes)
    const items: AttemptHistoryItemDTO[] = [];

    for (const { attempt, quizId } of latestAttempts) {
      const quiz = quizMap.get(quizId);
      if (quiz) {
        items.push({
          quiz: toQuizResponseDTO(quiz.toPlain()),
          latestAttempt: toAttemptResponseDTO(attempt.toPlain()),
        });
      }
    }

    return {
      items,
      totalQuizzesAttempted: items.length,
    };
  }
}
