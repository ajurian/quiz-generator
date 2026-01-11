import type {
  IQuizRepository,
  IAttemptRepository,
  IIdGenerator,
} from "../../ports";
import {
  toAttemptResponseDTO,
  type AttemptResponseDTO,
  type AttemptSummaryDTO,
  createAttemptSummary,
} from "../../dtos";
import { NotFoundError, ForbiddenError, ValidationError } from "../../errors";
import { QuizAttempt } from "@/domain";

/**
 * Input for StartAttemptUseCase
 */
export interface StartAttemptInput {
  quizSlug: string;
  userId: string | null;
}

/**
 * Output for StartAttemptUseCase
 */
export interface StartAttemptOutput {
  attempt: AttemptResponseDTO;
  isNewAttempt: boolean;
  existingAttemptSummary?: AttemptSummaryDTO;
}

/**
 * Dependencies for StartAttemptUseCase
 */
export interface StartAttemptUseCaseDeps {
  quizRepository: IQuizRepository;
  attemptRepository: IAttemptRepository;
  idGenerator: IIdGenerator;
}

/**
 * Use case for starting a quiz attempt
 *
 * Flow:
 * 1. Validate input
 * 2. Find quiz by slug
 * 3. Check access permissions
 * 4. Check for existing in-progress attempt
 * 5. Check for existing submitted attempts (show summary if any)
 * 6. Create new attempt
 */
export class StartAttemptUseCase {
  constructor(private readonly deps: StartAttemptUseCaseDeps) {}

  async execute(input: StartAttemptInput): Promise<StartAttemptOutput> {
    // 1. Validate input
    if (!input.quizSlug || typeof input.quizSlug !== "string") {
      throw new ValidationError("Quiz slug is required", {
        quizSlug: ["Quiz slug is required"],
      });
    }

    // 2. Find quiz by slug
    const quiz = await this.deps.quizRepository.findBySlug(input.quizSlug);
    if (!quiz) {
      throw new NotFoundError("Quiz", input.quizSlug);
    }

    // 3. Check access permissions
    if (!quiz.canBeAccessedBy(input.userId)) {
      // Return 404 for private quizzes to avoid existence leak
      throw new NotFoundError("Quiz", input.quizSlug);
    }

    // 4. Check for existing in-progress attempt (resume it)
    if (input.userId) {
      const inProgressAttempt =
        await this.deps.attemptRepository.findInProgressByQuizAndUser(
          quiz.id,
          input.userId
        );

      if (inProgressAttempt) {
        return {
          attempt: toAttemptResponseDTO(inProgressAttempt.toPlain()),
          isNewAttempt: false,
        };
      }
    }

    // 5. Check for existing submitted attempts
    if (input.userId) {
      const existingAttempts =
        await this.deps.attemptRepository.findByQuizAndUser(
          quiz.id,
          input.userId
        );

      if (existingAttempts.length > 0) {
        const attemptDTOs = existingAttempts.map((a) =>
          toAttemptResponseDTO(a.toPlain())
        );
        const summary = createAttemptSummary(attemptDTOs);

        // If there are existing attempts, return summary (UI will show "already completed" screen)
        // The UI should call ForceStartAttemptUseCase to create a new attempt
        return {
          attempt: attemptDTOs[0]!, // Latest attempt
          isNewAttempt: false,
          existingAttemptSummary: summary,
        };
      }
    }

    // 6. Create new attempt
    const attemptId = this.deps.idGenerator.generate();
    const attempt = QuizAttempt.create({
      id: attemptId,
      quizId: quiz.id,
      userId: input.userId,
    });

    const savedAttempt = await this.deps.attemptRepository.create(attempt);

    return {
      attempt: toAttemptResponseDTO(savedAttempt.toPlain()),
      isNewAttempt: true,
    };
  }
}

/**
 * Force start a new attempt (bypasses the "already completed" check)
 */
export interface ForceStartAttemptInput {
  quizSlug: string;
  userId: string | null;
}

export class ForceStartAttemptUseCase {
  constructor(private readonly deps: StartAttemptUseCaseDeps) {}

  async execute(input: ForceStartAttemptInput): Promise<AttemptResponseDTO> {
    // 1. Validate input
    if (!input.quizSlug || typeof input.quizSlug !== "string") {
      throw new ValidationError("Quiz slug is required", {
        quizSlug: ["Quiz slug is required"],
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

    // 4. Create new attempt (force, no existing check)
    const attemptId = this.deps.idGenerator.generate();
    const attempt = QuizAttempt.create({
      id: attemptId,
      quizId: quiz.id,
      userId: input.userId,
    });

    const savedAttempt = await this.deps.attemptRepository.create(attempt);

    return toAttemptResponseDTO(savedAttempt.toPlain());
  }
}
