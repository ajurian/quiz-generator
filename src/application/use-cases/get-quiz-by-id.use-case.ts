import type { IQuizRepository, IQuestionRepository } from "../ports";
import {
  toQuizResponseDTO,
  toQuestionResponseDTO,
  type QuizResponseDTO,
  type QuestionResponseDTO,
} from "../dtos";
import { NotFoundError, ForbiddenError, ValidationError } from "../errors";

/**
 * Input for GetQuizByIdUseCase
 */
export interface GetQuizByIdInput {
  quizId: string;
  userId?: string | null; // Optional for public quizzes
}

/**
 * Output for GetQuizByIdUseCase
 */
export interface GetQuizByIdOutput {
  quiz: QuizResponseDTO;
  questions: QuestionResponseDTO[];
}

/**
 * Dependencies for GetQuizByIdUseCase
 */
export interface GetQuizByIdUseCaseDeps {
  quizRepository: IQuizRepository;
  questionRepository: IQuestionRepository;
}

/**
 * Use case for getting a quiz by ID with access control
 *
 * Flow:
 * 1. Validate input
 * 2. Find quiz by ID
 * 3. Check access permissions
 * 4. Fetch questions
 * 5. Transform to response DTOs
 */
export class GetQuizByIdUseCase {
  constructor(private readonly deps: GetQuizByIdUseCaseDeps) {}

  async execute(
    input: GetQuizByIdInput,
    baseUrl?: string
  ): Promise<GetQuizByIdOutput> {
    // 1. Validate input
    if (!input.quizId || typeof input.quizId !== "string") {
      throw new ValidationError("Quiz ID is required", {
        quizId: ["Quiz ID is required"],
      });
    }

    // 2. Find quiz by ID
    const quiz = await this.deps.quizRepository.findById(input.quizId);
    if (!quiz) {
      throw new NotFoundError("Quiz", input.quizId);
    }

    // 3. Check access permissions
    if (!quiz.canBeAccessedBy(input.userId ?? null)) {
      throw new ForbiddenError(
        "You do not have permission to access this quiz"
      );
    }

    // 4. Fetch questions
    const questions = await this.deps.questionRepository.findByQuizId(
      input.quizId
    );

    // 5. Transform to response DTOs
    return {
      quiz: toQuizResponseDTO(quiz.toPlain(), baseUrl),
      questions: questions.map((q) => toQuestionResponseDTO(q.toPlain())),
    };
  }
}
