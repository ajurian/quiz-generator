import { z } from "zod";
import { QuizDistributionService, QuizVisibility, QuizStatus } from "@/domain";

/**
 * Validation schema for question distribution
 */
export const quizDistributionSchema = z
  .object({
    directQuestion: z.number().int().min(0).max(255),
    twoStatementCompound: z.number().int().min(0).max(255),
    contextual: z.number().int().min(0).max(255),
  })
  .refine(
    (data) =>
      data.directQuestion + data.twoStatementCompound + data.contextual > 0,
    {
      message: "Total questions must be greater than 0",
    }
  );

/**
 * Validation schema for quiz visibility
 */
export const visibilitySchema = z.enum(QuizVisibility);

/**
 * Validation schema for quiz status
 */
export const statusSchema = z.enum(QuizStatus);

/**
 * Schema for creating a new quiz
 */
export const createQuizInputSchema = z.object({
  userId: z.uuidv7(),
  title: z.string().min(1).max(255),
  distribution: quizDistributionSchema,
  visibility: visibilitySchema.optional().default(QuizVisibility.PRIVATE),
});

/**
 * Input DTO for CreateQuizUseCase
 */
export type CreateQuizInput = z.infer<typeof createQuizInputSchema>;

/**
 * Schema for quiz response
 */
export const quizResponseSchema = z.object({
  id: z.uuidv7(),
  slug: z.string().length(22),
  title: z.string(),
  status: statusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  totalQuestions: z.number().int().min(0),
  visibility: visibilitySchema,
  distribution: quizDistributionSchema,
  errorMessage: z.string().optional(),
});

/**
 * Output DTO for quiz responses
 */
export type QuizResponseDTO = z.infer<typeof quizResponseSchema>;

/**
 * Helper function to transform Quiz entity to QuizResponseDTO
 */
export function toQuizResponseDTO(quiz: {
  id: string;
  slug: string;
  title: string;
  status: QuizStatus;
  createdAt: Date;
  updatedAt: Date;
  visibility: QuizVisibility;
  questionDistribution: number;
  errorMessage?: string | null;
}): QuizResponseDTO {
  const distribution = QuizDistributionService.decode(
    quiz.questionDistribution
  );
  const totalQuestions = QuizDistributionService.getTotalQuestions(
    quiz.questionDistribution
  );

  return {
    id: quiz.id,
    slug: quiz.slug,
    title: quiz.title,
    status: quiz.status,
    createdAt: quiz.createdAt.toISOString(),
    updatedAt: quiz.updatedAt.toISOString(),
    totalQuestions,
    visibility: quiz.visibility,
    distribution,
    errorMessage: quiz.errorMessage ?? undefined,
  };
}

/**
 * Schema for updating quiz visibility
 */
export const updateQuizVisibilitySchema = z.object({
  quizId: z.uuidv7(),
  userId: z.uuidv7(),
  visibility: visibilitySchema,
});

/**
 * Input DTO for updating quiz visibility
 */
export type UpdateQuizVisibilityInput = z.infer<
  typeof updateQuizVisibilitySchema
>;
