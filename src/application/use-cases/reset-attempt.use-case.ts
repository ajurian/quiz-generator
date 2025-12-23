import type { IAttemptRepository } from "../ports";
import { toAttemptResponseDTO, type AttemptResponseDTO } from "../dtos";
import { NotFoundError, ForbiddenError, ValidationError } from "../errors";

/**
 * Input for ResetAttemptUseCase
 */
export interface ResetAttemptInput {
  attemptId: string;
  userId: string | null;
}

/**
 * Output for ResetAttemptUseCase
 */
export interface ResetAttemptOutput {
  attempt: AttemptResponseDTO;
}

/**
 * Dependencies for ResetAttemptUseCase
 */
export interface ResetAttemptUseCaseDeps {
  attemptRepository: IAttemptRepository;
}

/**
 * Use case for resetting an in-progress attempt (Start Over)
 *
 * This clears all answers and resets the timer, treating it as a fresh start
 * while keeping the same attempt ID. Used when user chooses "Start Over" instead of "Continue".
 */
export class ResetAttemptUseCase {
  constructor(private readonly deps: ResetAttemptUseCaseDeps) {}

  async execute(input: ResetAttemptInput): Promise<ResetAttemptOutput> {
    // 1. Validate input
    if (!input.attemptId) {
      throw new ValidationError("Attempt ID is required", {
        attemptId: ["Attempt ID is required"],
      });
    }

    // 2. Find attempt
    const attempt = await this.deps.attemptRepository.findById(input.attemptId);
    if (!attempt) {
      throw new NotFoundError("Attempt", input.attemptId);
    }

    // 3. Check ownership
    if (!attempt.isOwnedBy(input.userId)) {
      throw new ForbiddenError("You can only reset your own attempts");
    }

    // 4. Check if attempt is still in progress
    if (!attempt.isInProgress) {
      throw new ForbiddenError("Cannot reset a submitted attempt");
    }

    // 5. Fully reset the attempt (answers, timer, and all state)
    attempt.reset();

    // 6. Persist the updated attempt
    const updatedAttempt = await this.deps.attemptRepository.update(attempt);

    return {
      attempt: toAttemptResponseDTO(updatedAttempt.toPlain()),
    };
  }
}
