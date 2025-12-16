import type { IAttemptRepository } from "../ports";
import { toAttemptResponseDTO, type AttemptResponseDTO } from "../dtos";
import { NotFoundError, ForbiddenError, ValidationError } from "../errors";

/**
 * Input for SubmitAttemptUseCase
 */
export interface SubmitAttemptInput {
  attemptId: string;
  userId: string | null;
  score: number;
  /** User's selected answers (questionId -> optionId) */
  answers: Record<string, string>;
}

/**
 * Output for SubmitAttemptUseCase
 */
export interface SubmitAttemptOutput {
  attempt: AttemptResponseDTO;
}

/**
 * Dependencies for SubmitAttemptUseCase
 */
export interface SubmitAttemptUseCaseDeps {
  attemptRepository: IAttemptRepository;
}

/**
 * Use case for submitting a quiz attempt
 *
 * Flow:
 * 1. Validate input
 * 2. Find attempt by ID
 * 3. Verify ownership
 * 4. Submit attempt with score
 * 5. Persist changes
 */
export class SubmitAttemptUseCase {
  constructor(private readonly deps: SubmitAttemptUseCaseDeps) {}

  async execute(input: SubmitAttemptInput): Promise<SubmitAttemptOutput> {
    // 1. Validate input
    if (!input.attemptId || typeof input.attemptId !== "string") {
      throw new ValidationError("Attempt ID is required", {
        attemptId: ["Attempt ID is required"],
      });
    }

    if (
      typeof input.score !== "number" ||
      input.score < 0 ||
      input.score > 100
    ) {
      throw new ValidationError("Invalid score", {
        score: ["Score must be a number between 0 and 100"],
      });
    }

    // 2. Find attempt by ID
    const attempt = await this.deps.attemptRepository.findById(input.attemptId);
    if (!attempt) {
      throw new NotFoundError("Attempt", input.attemptId);
    }

    // 3. Verify ownership
    if (attempt.userId !== null && attempt.userId !== input.userId) {
      throw new ForbiddenError("You can only submit your own attempts");
    }

    // Handle anonymous attempts - only allow if no userId was set originally
    if (attempt.userId === null && input.userId !== null) {
      throw new ForbiddenError("Cannot claim anonymous attempt");
    }

    // 4. Submit attempt with score and answers
    try {
      attempt.submit(input.score, input.answers);
    } catch (error) {
      if (error instanceof Error) {
        throw new ValidationError(error.message, {
          attempt: [error.message],
        });
      }
      throw error;
    }

    // 5. Persist changes
    const updatedAttempt = await this.deps.attemptRepository.update(attempt);

    return {
      attempt: toAttemptResponseDTO(updatedAttempt.toPlain()),
    };
  }
}
