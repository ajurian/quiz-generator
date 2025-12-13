import type { IQuizRepository, IQuestionRepository } from "../ports";
import { NotFoundError, ForbiddenError, ValidationError } from "../errors";

/**
 * Input for DeleteQuizUseCase
 */
export interface DeleteQuizInput {
  quizId: string;
  userId: string;
}

/**
 * Dependencies for DeleteQuizUseCase
 */
export interface DeleteQuizUseCaseDeps {
  quizRepository: IQuizRepository;
  questionRepository: IQuestionRepository;
}

/**
 * Use case for deleting a quiz
 *
 * Flow:
 * 1. Validate input
 * 2. Find quiz by ID
 * 3. Verify ownership
 * 4. Delete questions (if not handled by cascade)
 * 5. Delete quiz
 */
export class DeleteQuizUseCase {
  constructor(private readonly deps: DeleteQuizUseCaseDeps) {}

  async execute(input: DeleteQuizInput): Promise<void> {
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

    // 2. Find quiz by ID
    const quiz = await this.deps.quizRepository.findById(input.quizId);
    if (!quiz) {
      throw new NotFoundError("Quiz", input.quizId);
    }

    // 3. Verify ownership
    if (!quiz.isOwnedBy(input.userId)) {
      throw new ForbiddenError("You can only delete quizzes that you own");
    }

    // 4. Delete quiz (questions are deleted via cascade)
    await this.deps.quizRepository.delete(input.quizId);
  }
}
