import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getContainer } from "@/infrastructure/di";
import { QuizVisibility } from "@/domain";
import { quizDistributionSchema } from "@/application";

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
    const result = await container.useCases.getUserQuizzes.execute(
      {
        userId: data.userId,
        pagination: data.pagination,
      },
      container.baseUrl
    );
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
    const result = await container.useCases.getQuizById.execute(
      {
        quizId: data.quizId,
        userId: data.userId,
      },
      container.baseUrl
    );
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

    const result = await container.useCases.createQuiz.execute(
      {
        userId: data.userId,
        title: data.title,
        distribution: data.distribution,
        visibility: data.visibility,
        files,
      },
      container.baseUrl
    );
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
    const result = await container.useCases.shareQuiz.execute(
      {
        quizId: data.quizId,
        userId: data.userId,
      },
      container.baseUrl
    );
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
