import type {
  IQuizRepository,
  ISourceMaterialRepository,
  IS3StorageService,
} from "../../ports";
import { NotFoundError, ForbiddenError, ValidationError } from "../../errors";
import { QuizVisibility } from "@/domain";
import z from "zod/v3";

/**
 * Input validation schema for getting a source material presigned GET URL
 */
export const getSourceMaterialUrlInputSchema = z.object({
  quizId: z.string().uuid("Invalid quiz ID"),
  reference: z.number().int().min(0, "Reference index must be non-negative"),
  userId: z.string().uuid("Invalid user ID").nullable().optional(),
});

/**
 * Input type for GetSourceMaterialUrlUseCase
 */
export type GetSourceMaterialUrlInput = z.infer<
  typeof getSourceMaterialUrlInputSchema
>;

/**
 * Output type for GetSourceMaterialUrlUseCase
 */
export interface GetSourceMaterialUrlOutput {
  /** Presigned GET URL for the source material PDF */
  url: string;
  /** Title of the source material */
  title: string;
}

/**
 * Dependencies for GetSourceMaterialUrlUseCase
 */
export interface GetSourceMaterialUrlUseCaseDeps {
  quizRepository: IQuizRepository;
  sourceMaterialRepository: ISourceMaterialRepository;
  s3Storage: IS3StorageService;
}

/**
 * Use case for getting a presigned GET URL for a quiz's source material
 *
 * Flow:
 * 1. Validate input
 * 2. Fetch quiz and verify access permissions
 * 3. Find source material by quiz ID and reference index
 * 4. Generate presigned GET URL
 * 5. Return URL and title
 */
export class GetSourceMaterialUrlUseCase {
  constructor(private readonly deps: GetSourceMaterialUrlUseCaseDeps) {}

  async execute(
    input: GetSourceMaterialUrlInput,
  ): Promise<GetSourceMaterialUrlOutput> {
    // 1. Validate input
    const validationResult = getSourceMaterialUrlInputSchema.safeParse(input);
    if (!validationResult.success) {
      const errors: Record<string, string[]> = {};
      validationResult.error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(issue.message);
      });
      throw new ValidationError(
        "Invalid input for source material URL",
        errors,
      );
    }

    const { quizId, reference, userId } = validationResult.data;

    // 2. Fetch quiz and check access permissions
    const quiz = await this.deps.quizRepository.findById(quizId);
    if (!quiz) {
      throw new NotFoundError("Quiz", quizId);
    }

    const effectiveUserId = userId ?? null;

    if (!quiz.canBeAccessedBy(effectiveUserId ?? "")) {
      if (quiz.visibility === QuizVisibility.PRIVATE) {
        throw new NotFoundError("Quiz", quizId);
      }
      throw new ForbiddenError(
        "You do not have permission to access this quiz",
      );
    }

    // 3. Find source material by quiz ID and reference index
    const sourceMaterials =
      await this.deps.sourceMaterialRepository.findByQuizId(quizId);

    const material = sourceMaterials.find(
      (sm) => sm.quizReferenceIndex === reference,
    );

    if (!material) {
      throw new NotFoundError(
        "Source material",
        `quiz=${quizId}, reference=${reference}`,
      );
    }

    // 4. Generate presigned GET URL (1 hour default expiry)
    const url = await this.deps.s3Storage.generatePresignedGetUrl(
      material.fileKey,
    );

    // 5. Return URL and title
    return {
      url,
      title: material.title,
    };
  }
}
