import type {
  IS3StorageService,
  FileUploadRequest,
  PresignedUploadUrl,
} from "../../ports";
import { ValidationError } from "../../errors";
import z from "zod/v3";

/**
 * Input validation schema for getting presigned upload URLs
 */
export const getPresignedUploadUrlsInputSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  quizSlug: z.string().min(1, "Quiz slug is required"),
  files: z
    .array(
      z.object({
        filename: z.string().min(1, "Filename is required"),
        mimeType: z.string().min(1, "MIME type is required"),
        sizeBytes: z.number().int().positive("File size must be positive"),
      })
    )
    .min(1, "At least one file is required")
    .max(10, "Maximum 10 files allowed"),
});

/**
 * Input type for GetPresignedUploadUrlsUseCase
 */
export type GetPresignedUploadUrlsInput = z.infer<
  typeof getPresignedUploadUrlsInputSchema
>;

/**
 * Output type for GetPresignedUploadUrlsUseCase
 */
export type GetPresignedUploadUrlsOutput = PresignedUploadUrl[];

/**
 * Dependencies for GetPresignedUploadUrlsUseCase
 */
export interface GetPresignedUploadUrlsUseCaseDeps {
  s3Storage: IS3StorageService;
}

/**
 * Use case for generating presigned URLs for client-side file uploads to R2
 *
 * Flow:
 * 1. Validate input
 * 2. Generate presigned PUT URLs for each file
 * 3. Return URLs with R2 object keys
 */
export class GetPresignedUploadUrlsUseCase {
  constructor(private readonly deps: GetPresignedUploadUrlsUseCaseDeps) {}

  async execute(
    input: GetPresignedUploadUrlsInput
  ): Promise<GetPresignedUploadUrlsOutput> {
    // 1. Validate input
    const validationResult = getPresignedUploadUrlsInputSchema.safeParse(input);
    if (!validationResult.success) {
      const errors: Record<string, string[]> = {};
      validationResult.error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(issue.message);
      });
      throw new ValidationError("Invalid input for presigned URLs", errors);
    }

    const { userId, quizSlug, files } = validationResult.data;

    // 2. Generate presigned PUT URLs
    const fileRequests: FileUploadRequest[] = files.map((file) => ({
      filename: file.filename,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
    }));

    const presignedUrls = await this.deps.s3Storage.generatePresignedPutUrls(
      fileRequests,
      userId,
      quizSlug
    );

    // 3. Return URLs with keys
    return presignedUrls;
  }
}
