import type { IAttemptRepository } from "../../ports";
import { ValidationError } from "../../errors";

/**
 * Input for ClaimAnonymousAttemptsUseCase
 */
export interface ClaimAnonymousAttemptsInput {
  userId: string;
  attemptIds: string[];
}

/**
 * Output for ClaimAnonymousAttemptsUseCase
 */
export interface ClaimAnonymousAttemptsOutput {
  claimedCount: number;
}

/**
 * Dependencies for ClaimAnonymousAttemptsUseCase
 */
export interface ClaimAnonymousAttemptsUseCaseDeps {
  attemptRepository: IAttemptRepository;
}

/**
 * Use case for claiming anonymous quiz attempts after user authentication.
 *
 * When an unauthenticated user takes quizzes, their attempts are stored with userId=null.
 * After they sign in or register, this use case assigns those attempts to their account
 * using a single optimized batch query.
 */
export class ClaimAnonymousAttemptsUseCase {
  constructor(private readonly deps: ClaimAnonymousAttemptsUseCaseDeps) {}

  async execute(
    input: ClaimAnonymousAttemptsInput,
  ): Promise<ClaimAnonymousAttemptsOutput> {
    // 1. Validate input
    if (!input.userId || typeof input.userId !== "string") {
      throw new ValidationError("User ID is required", {
        userId: ["User ID is required"],
      });
    }

    if (!Array.isArray(input.attemptIds) || input.attemptIds.length === 0) {
      return { claimedCount: 0 };
    }

    // Filter out any invalid IDs
    const validIds = input.attemptIds.filter(
      (id) => typeof id === "string" && id.length > 0,
    );

    if (validIds.length === 0) {
      return { claimedCount: 0 };
    }

    // 2. Claim attempts in a single batch operation
    const claimedCount =
      await this.deps.attemptRepository.claimAnonymousAttempts(
        validIds,
        input.userId,
      );

    return { claimedCount };
  }
}
