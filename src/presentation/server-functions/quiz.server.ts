import { quizDistributionSchema } from "@/application";
import { QuizGenerationEvent, QuizVisibility } from "@/domain";
import { getContainer } from "@/presentation/lib/composition";
import { createServerFn } from "@tanstack/react-start";
import { waitUntil } from "@vercel/functions";
import { z } from "zod";
import { continueQuizGeneration, createQuizRecord } from "../features";

/**
 * Cache key pattern for user's quiz generation events
 * Format: quiz-events:{userId}
 */
function getEventsCacheKey(userId: string): string {
  return `quiz-events:${userId}`;
}

// Validation schemas
const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
});

const visibilitySchema = z.enum(QuizVisibility).optional();

// GET User's Quizzes
export const getUserQuizzes = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      userId: z.uuidv7(),
      pagination: paginationSchema.optional(),
      visibility: visibilitySchema,
    }),
  )
  .handler(async ({ data }) => {
    const container = getContainer();
    const result = await container.useCases.getUserQuizzes.execute({
      userId: data.userId,
      pagination: data.pagination,
      visibility: data.visibility,
    });
    return result;
  });

// GET Public Quizzes (for explore page - no auth required)
export const getPublicQuizzes = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      pagination: paginationSchema.optional(),
      search: z.string().max(200).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const container = getContainer();
    const result = await container.useCases.getPublicQuizzes.execute({
      pagination: data.pagination,
      search: data.search,
    });
    return result;
  });

// GET Quiz by ID
export const getQuizById = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      quizId: z.uuidv7(),
      userId: z.uuidv7().nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const container = getContainer();
    const result = await container.useCases.getQuizById.execute({
      quizId: data.quizId,
      userId: data.userId,
    });
    return result;
  });

// POST Share Quiz (toggle public visibility)
export const shareQuiz = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      quizId: z.uuidv7(),
      userId: z.uuidv7(),
    }),
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
    }),
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
    }),
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

// POST Start Quiz Generation (triggers background generation workflow)
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
        }),
      ),
    }),
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
    // Wrap in .catch() to prevent unhandled rejection from crashing the server
    // Error handling (cleanup, failure event) is already done inside continueQuizGeneration
    waitUntil(
      continueQuizGeneration(quizData, {
        userId: data.userId,
        title: data.title,
        distribution: data.distribution,
        visibility: data.visibility,
        files: data.files,
      }).catch((error) => {
        // Error already handled in continueQuizGeneration, just log for visibility
        console.error(
          "[QuizGeneration] Background task failed:",
          error.message,
        );
      }),
    );

    // Return immediately so client can redirect to dashboard
    return {
      quizId: quizData.id,
      quizSlug: quizData.slug,
    };
  });

// GET Cached Quiz Generation Events (for hydration on page load/refresh)
export const getCachedQuizEvents = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      userId: z.uuidv7(),
    }),
  )
  .handler(async ({ data }) => {
    const container = getContainer();
    const cacheKey = getEventsCacheKey(data.userId);

    const cachedEvents =
      await container.services.cache.hgetall<QuizGenerationEvent>(cacheKey);

    // Return as array of events (or empty array if no cached events)
    if (!cachedEvents) {
      return [];
    }

    return Object.values(cachedEvents);
  });
