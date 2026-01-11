import type { IAttemptRepository } from "../../ports";
import { toAttemptResponseDTO, type AttemptResponseDTO } from "../../dtos";
import { NotFoundError, ForbiddenError, ValidationError } from "../../errors";
import { uuidToSlug } from "@/domain";

/**
 * Input for AutosaveAnswerUseCase
 */
export interface AutosaveAnswerInput {
  attemptId: string;
  userId: string | null;
  questionId: string;
  optionIndex: string;
}

/**
 * Output for AutosaveAnswerUseCase
 */
export interface AutosaveAnswerOutput {
  attempt: AttemptResponseDTO;
}

/**
 * Dependencies for AutosaveAnswerUseCase
 */
export interface AutosaveAnswerUseCaseDeps {
  attemptRepository: IAttemptRepository;
}

/**
 * Use case for autosaving a single answer during quiz taking
 *
 * This is designed to be called frequently (on each answer change)
 * and should be idempotent per question.
 */
export class AutosaveAnswerUseCase {
  constructor(private readonly deps: AutosaveAnswerUseCaseDeps) {}

  async execute(input: AutosaveAnswerInput): Promise<AutosaveAnswerOutput> {
    // 1. Validate input
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

    if (!input.optionIndex) {
      throw new ValidationError("Option index is required", {
        optionIndex: ["Option index is required"],
      });
    }

    // 2. Find attempt
    const attempt = await this.deps.attemptRepository.findById(input.attemptId);
    if (!attempt) {
      throw new NotFoundError("Attempt", input.attemptId);
    }

    // 3. Check ownership
    if (!attempt.isOwnedBy(input.userId)) {
      throw new ForbiddenError("You can only update your own attempts");
    }

    // 4. Check if attempt is still in progress
    if (!attempt.isInProgress) {
      throw new ForbiddenError("Cannot update a submitted attempt");
    }

    // 5. Update the answer (idempotent - same answer overwrites)
    attempt.updateAnswer(input.questionId, input.optionIndex);

    // 6. Persist the updated attempt
    const updatedAttempt = await this.deps.attemptRepository.update(attempt);

    return {
      attempt: toAttemptResponseDTO(updatedAttempt.toPlain()),
    };
  }
}
