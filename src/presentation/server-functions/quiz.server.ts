import { quizDistributionSchema } from "@/application";
import { QuizVisibility } from "@/domain";
import { getContainer } from "@/presentation/lib/composition";
import { createServerFn } from "@tanstack/react-start";
import { waitUntil } from "@vercel/functions";
import { z } from "zod";
import { continueQuizGeneration, createQuizRecord } from "../features";

// Validation schemas
const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
});

// GET User's Quizzes
export const getUserQuizzes = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      userId: z.uuidv7(),
      pagination: paginationSchema.optional(),
    })
  )
  .handler(async ({ data }) => {
    const container = getContainer();
    const result = await container.useCases.getUserQuizzes.execute({
      userId: data.userId,
      pagination: data.pagination,
    });
    return result;
  });

// GET Quiz by ID
export const getQuizById = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      quizId: z.uuidv7(),
      userId: z.uuidv7().nullable().optional(),
    })
  )
  .handler(async ({ data }) => {
    const container = getContainer();
    const result = await container.useCases.getQuizById.execute({
      quizId: data.quizId,
      userId: data.userId,
    });
    return result;
  });

// Serializable file schema for RPC transport
const serializableFileSchema = z.object({
  name: z.string(),
  type: z.string(),
  size: z.number(),
  base64: z.string(),
});

export type SerializableFile = z.infer<typeof serializableFileSchema>;

/**
 * Converts a serializable file back to a File object on the server
 */
function reconstructFile(serializable: SerializableFile): File {
  const binaryString = atob(serializable.base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new File([bytes], serializable.name, { type: serializable.type });
}

// POST Create Quiz
export const createQuiz = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      userId: z.uuidv7(),
      title: z.string().min(1).max(255),
      distribution: quizDistributionSchema,
      visibility: z
        .enum(QuizVisibility)
        .optional()
        .default(QuizVisibility.PRIVATE),
      files: z.array(serializableFileSchema),
    })
  )
  .handler(async ({ data }) => {
    const container = getContainer();

    // Reconstruct File objects from serializable data
    const files = data.files.map(reconstructFile);

    const result = await container.useCases.createQuiz.execute({
      userId: data.userId,
      title: data.title,
      distribution: data.distribution,
      visibility: data.visibility,
      files,
    });
    return result;
  });

// POST Share Quiz (toggle public visibility)
export const shareQuiz = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      quizId: z.uuidv7(),
      userId: z.uuidv7(),
    })
  )
  .handler(async ({ data }) => {
    const container = getContainer();
    const result = await container.useCases.shareQuiz.execute({
      quizId: data.quizId,
      userId: data.userId,
    });
    return result;
  });

// POST Delete Quiz
export const deleteQuiz = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      quizId: z.uuidv7(),
      userId: z.uuidv7(),
    })
  )
  .handler(async ({ data }) => {
    const container = getContainer();
    await container.useCases.deleteQuiz.execute({
      quizId: data.quizId,
      userId: data.userId,
    });
    return { success: true };
  });

// File info schema for presigned URL generation
const fileInfoSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
});

export type FileInfo = z.infer<typeof fileInfoSchema>;

// POST Get Presigned Upload URLs
export const getPresignedUploadUrls = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      userId: z.uuidv7(),
      quizSlug: z.string().min(1).max(255),
      files: z.array(fileInfoSchema).min(1).max(10),
    })
  )
  .handler(async ({ data }) => {
    const container = getContainer();
    const result = await container.useCases.getPresignedUploadUrls.execute({
      userId: data.userId,
      quizSlug: data.quizSlug,
      files: data.files,
    });
    return result;
  });

// POST Start Quiz Generation (triggers Upstash Workflow for background generation in production,
// or executes directly in development)
export const startQuizGeneration = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      userId: z.uuidv7(),
      title: z.string().min(1).max(255),
      distribution: quizDistributionSchema,
      visibility: z
        .enum(QuizVisibility)
        .optional()
        .default(QuizVisibility.PRIVATE),
      files: z.array(
        z.object({
          filename: z.string().min(1),
          key: z.string().min(1),
          mimeType: z.string().min(1),
          sizeBytes: z.number().int().positive(),
        })
      ),
    })
  )
  .handler(async ({ data }) => {
    console.log("[Development] Creating quiz record...");

    // Step 1: Create quiz record immediately so it appears in dashboard
    const quizData = await createQuizRecord({
      userId: data.userId,
      title: data.title,
      distribution: data.distribution,
      visibility: data.visibility,
      files: data.files,
    });

    // Fire-and-forget: Continue generation in background
    waitUntil(
      continueQuizGeneration(quizData, {
        userId: data.userId,
        title: data.title,
        distribution: data.distribution,
        visibility: data.visibility,
        files: data.files,
      })
    );

    // Return immediately so client can redirect to dashboard
    return {
      quizId: quizData.id,
      quizSlug: quizData.slug,
    };
  });
