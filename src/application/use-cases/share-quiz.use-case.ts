import type { IQuizRepository } from "../ports";
import { toQuizResponseDTO, type QuizResponseDTO } from "../dtos";
import { NotFoundError, ForbiddenError, ValidationError } from "../errors";
import { QuizVisibility } from "../../domain";

/**
 * Input for ShareQuizUseCase
 */
export interface ShareQuizInput {
  quizId: string;
  userId: string;
  visibility?: QuizVisibility;
}

/**
 * Output for ShareQuizUseCase
 */
export interface ShareQuizOutput {
  quiz: QuizResponseDTO;
  shareLink: string;
}

/**
 * Dependencies for ShareQuizUseCase
 */
export interface ShareQuizUseCaseDeps {
  quizRepository: IQuizRepository;
}

/**
 * Use case for sharing a quiz by setting visibility
 *
 * Flow:
 * 1. Validate input
 * 2. Find quiz by ID
 * 3. Verify ownership
 * 4. Set visibility (defaults to UNLISTED for sharing)
 * 5. Persist changes
 * 6. Generate share link
 */
export class ShareQuizUseCase {
  constructor(private readonly deps: ShareQuizUseCaseDeps) {}

  async execute(
    input: ShareQuizInput,
    baseUrl: string
  ): Promise<ShareQuizOutput> {
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

    if (!baseUrl || typeof baseUrl !== "string") {
      throw new ValidationError(
        "Base URL is required for generating share links",
        {
          baseUrl: ["Base URL is required"],
        }
      );
    }

    // 2. Find quiz by ID
    const quiz = await this.deps.quizRepository.findById(input.quizId);
    if (!quiz) {
      throw new NotFoundError("Quiz", input.quizId);
    }

    // 3. Verify ownership
    if (!quiz.isOwnedBy(input.userId)) {
      throw new ForbiddenError("You can only share quizzes that you own");
    }

    // 4. Set visibility (defaults to UNLISTED for sharing)
    const targetVisibility = input.visibility ?? QuizVisibility.UNLISTED;
    if (quiz.visibility !== targetVisibility) {
      quiz.setVisibility(targetVisibility);
    }

    // 5. Persist changes
    const updatedQuiz = await this.deps.quizRepository.update(quiz);

    // 6. Generate share link using the quiz slug
    const shareLink = `${baseUrl}/quiz/a/${quiz.slug}`;

    return {
      quiz: toQuizResponseDTO(updatedQuiz.toPlain(), baseUrl),
      shareLink,
    };
  }
}
