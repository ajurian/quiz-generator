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
 * Input for GetPublicQuizzesUseCase
 */
export interface GetPublicQuizzesInput {
  pagination?: Partial<PaginationInput>;
  search?: string;
}

/**
 * Dependencies for GetPublicQuizzesUseCase
 */
export interface GetPublicQuizzesUseCaseDeps {
  quizRepository: IQuizRepository;
}

/**
 * Use case for getting all public quizzes for discovery
 *
 * Flow:
 * 1. Validate input
 * 2. Query repository with pagination and optional search filter
 * 3. Transform to response DTOs
 */
export class GetPublicQuizzesUseCase {
  constructor(private readonly deps: GetPublicQuizzesUseCaseDeps) {}

  async execute(
    input: GetPublicQuizzesInput,
  ): Promise<PaginatedResponseDTO<QuizResponseDTO>> {
    // 1. Validate and apply default pagination
    const paginationResult = paginationInputSchema.safeParse(
      input.pagination ?? {},
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

    // Validate search if provided
    const search = input.search?.trim();
    if (search !== undefined && search.length > 200) {
      throw new ValidationError("Search query is too long", {
        search: ["Search query must be 200 characters or less"],
      });
    }

    // 2. Query repository with optional search filter
    const result = await this.deps.quizRepository.findPublic(
      {
        page: pagination.page,
        limit: pagination.limit,
      },
      search ? { search } : undefined,
    );

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
