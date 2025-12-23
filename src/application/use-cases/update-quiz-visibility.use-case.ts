import type { IQuizRepository } from "../ports";
import { toQuizResponseDTO, type QuizResponseDTO } from "../dtos";
import { NotFoundError, ForbiddenError, ValidationError } from "../errors";
import { QuizVisibility, isQuizVisibility } from "../../domain";

/**
 * Input for UpdateQuizVisibilityUseCase
 */
export interface UpdateQuizVisibilityInput {
  quizId: string;
  userId: string;
  visibility: QuizVisibility;
}

/**
 * Output for UpdateQuizVisibilityUseCase
 */
export interface UpdateQuizVisibilityOutput {
  quiz: QuizResponseDTO;
  message: string;
}

/**
 * Dependencies for UpdateQuizVisibilityUseCase
 */
export interface UpdateQuizVisibilityUseCaseDeps {
  quizRepository: IQuizRepository;
}

/**
 * Use case for updating quiz visibility
 *
 * Flow:
 * 1. Validate input
 * 2. Find quiz by ID
 * 3. Verify ownership
 * 4. Update visibility
 * 5. Persist changes
 * 6. Return result with appropriate message
 */
export class UpdateQuizVisibilityUseCase {
  constructor(private readonly deps: UpdateQuizVisibilityUseCaseDeps) {}

  async execute(
    input: UpdateQuizVisibilityInput
  ): Promise<UpdateQuizVisibilityOutput> {
    // 1. Validate input
    if (!input.quizId || typeof input.quizId !== "string") {
      throw new ValidationError("Quiz ID is required", {
        quizId: ["Quiz ID is required"],
      });
    }

    if (!input.userId || typeof input.userId !== "string") {
      throw new ValidationError("User ID is required", {
        userId: ["User ID is required"],
      });
    }

    if (!isQuizVisibility(input.visibility)) {
      throw new ValidationError("Invalid visibility value", {
        visibility: ["Visibility must be 'private', 'unlisted', or 'public'"],
      });
    }

    // 2. Find quiz by ID
    const quiz = await this.deps.quizRepository.findById(input.quizId);
    if (!quiz) {
      throw new NotFoundError("Quiz", input.quizId);
    }

    // 3. Verify ownership
    if (!quiz.isOwnedBy(input.userId)) {
      throw new ForbiddenError(
        "You can only change visibility for quizzes that you own"
      );
    }

    // 4. Update visibility
    const previousVisibility = quiz.visibility;
    quiz.setVisibility(input.visibility);

    // 5. Persist changes
    const updatedQuiz = await this.deps.quizRepository.update(quiz);

    // 6. Return result with appropriate message
    const message = this.getVisibilityChangeMessage(
      previousVisibility,
      input.visibility
    );

    return {
      quiz: toQuizResponseDTO(updatedQuiz.toPlain()),
      message,
    };
  }

  private getVisibilityChangeMessage(
    from: QuizVisibility,
    to: QuizVisibility
  ): string {
    if (from === to) {
      return `Quiz visibility is already set to ${to}`;
    }

    switch (to) {
      case QuizVisibility.PRIVATE:
        return "Quiz is now private. Only you can view and attempt it.";
      case QuizVisibility.UNLISTED:
        return "Quiz is now unlisted. Anyone with the link can access it.";
      case QuizVisibility.PUBLIC:
        return "Quiz is now public and discoverable in directories.";
      default:
        return "Quiz visibility has been updated.";
    }
  }
}
