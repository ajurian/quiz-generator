import type { IQuizRepository } from "../../ports";
import {
  paginationInputSchema,
  type PaginationInput,
  toQuizResponseDTO,
  type QuizResponseDTO,
  type PaginatedResponseDTO,
} from "../../dtos";
import { ValidationError } from "../../errors";

/**
 * Input for GetUserQuizzesUseCase
 */
export interface GetUserQuizzesInput {
  userId: string;
  pagination?: Partial<PaginationInput>;
}

/**
 * Dependencies for GetUserQuizzesUseCase
 */
export interface GetUserQuizzesUseCaseDeps {
  quizRepository: IQuizRepository;
}

/**
 * Use case for getting all quizzes owned by a user
 *
 * Flow:
 * 1. Validate input
 * 2. Query repository with pagination
 * 3. Transform to response DTOs
 */
export class GetUserQuizzesUseCase {
  constructor(private readonly deps: GetUserQuizzesUseCaseDeps) {}

  async execute(
    input: GetUserQuizzesInput
  ): Promise<PaginatedResponseDTO<QuizResponseDTO>> {
    // 1. Validate input
    if (!input.userId || typeof input.userId !== "string") {
      throw new ValidationError("User ID is required", {
        userId: ["User ID is required"],
      });
    }

    // Validate and apply default pagination
    const paginationResult = paginationInputSchema.safeParse(
      input.pagination ?? {}
    );
    if (!paginationResult.success) {
      const errors: Record<string, string[]> = {};
      paginationResult.error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(issue.message);
      });
      throw new ValidationError("Invalid pagination parameters", errors);
    }

    const pagination = paginationResult.data;

    // 2. Query repository
    const result = await this.deps.quizRepository.findByUserId(input.userId, {
      page: pagination.page,
      limit: pagination.limit,
    });

    // 3. Transform to response DTOs
    return {
      data: result.data.map((quiz) => toQuizResponseDTO(quiz.toPlain())),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }
}
