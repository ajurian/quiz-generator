import type { IAttemptRepository } from "../../ports";
import { toAttemptResponseDTO, type AttemptResponseDTO } from "../../dtos";
import { NotFoundError, ForbiddenError, ValidationError } from "../../errors";

/**
 * Input for RemoveAnswerUseCase
 */
export interface RemoveAnswerInput {
  attemptId: string;
  userId: string | null;
  questionId: string;
}

/**
 * Output for RemoveAnswerUseCase
 */
export interface RemoveAnswerOutput {
  attempt: AttemptResponseDTO;
}

/**
 * Dependencies for RemoveAnswerUseCase
 */
export interface RemoveAnswerUseCaseDeps {
  attemptRepository: IAttemptRepository;
}

/**
 * Use case for removing a single saved answer during quiz taking.
 *
 * This enables "Try Again" flows where users can clear a checked wrong answer
 * and answer the same question again.
 */
export class RemoveAnswerUseCase {
  constructor(private readonly deps: RemoveAnswerUseCaseDeps) {}

  async execute(input: RemoveAnswerInput): Promise<RemoveAnswerOutput> {
    if (!input.attemptId) {
      throw new ValidationError("Attempt ID is required", {
        attemptId: ["Attempt ID is required"],
      });
    }

    if (!input.questionId) {
      throw new ValidationError("Question ID is required", {
        questionId: ["Question ID is required"],
      });
    }

    const attempt = await this.deps.attemptRepository.findById(input.attemptId);
    if (!attempt) {
      throw new NotFoundError("Attempt", input.attemptId);
    }

    if (!attempt.isOwnedBy(input.userId)) {
      throw new ForbiddenError("You can only update your own attempts");
    }

    if (!attempt.isInProgress) {
      throw new ForbiddenError("Cannot update a submitted attempt");
    }

    attempt.removeAnswer(input.questionId);

    const updatedAttempt = await this.deps.attemptRepository.update(attempt);

    return {
      attempt: toAttemptResponseDTO(updatedAttempt.toPlain()),
    };
  }
}
