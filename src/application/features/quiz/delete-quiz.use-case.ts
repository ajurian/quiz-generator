import type {
  IQuizRepository,
  IQuestionRepository,
  ISourceMaterialRepository,
  IS3StorageService,
} from "../../ports";
import { NotFoundError, ForbiddenError, ValidationError } from "../../errors";

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
  sourceMaterialRepository: ISourceMaterialRepository;
  s3Storage: IS3StorageService;
}

/**
 * Use case for deleting a quiz
 *
 * Flow:
 * 1. Validate input
 * 2. Find quiz by ID
 * 3. Verify ownership
 * 4. Get source materials to find R2 keys
 * 5. Delete R2 files
 * 6. Delete quiz (cascade deletes questions and source_materials)
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

    // 4. Get source materials to find S3 keys
    const sourceMaterials =
      await this.deps.sourceMaterialRepository.findByQuizId(input.quizId);
    const fileKeys = sourceMaterials.map((sm) => sm.fileKey);

    // 5. Delete S3 files (best effort, don't fail if this fails)
    if (fileKeys.length > 0) {
      try {
        await this.deps.s3Storage.deleteObjects(fileKeys);
      } catch (error) {
        console.warn("Failed to delete S3 files:", error);
        // Continue with quiz deletion even if S3 deletion fails
      }
    }

    // 6. Delete quiz (questions and source_materials are deleted via cascade)
    await this.deps.quizRepository.delete(input.quizId);
  }
}
