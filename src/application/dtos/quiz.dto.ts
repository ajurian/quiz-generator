import { z } from "zod";
import { QuizDistributionService } from "../../domain";

/**
 * Validation schema for question distribution
 */
export const distributionSchema = z
  .object({
    singleBestAnswer: z.number().int().min(0).max(255),
    twoStatements: z.number().int().min(0).max(255),
    contextual: z.number().int().min(0).max(255),
  })
  .refine(
    (data) => data.singleBestAnswer + data.twoStatements + data.contextual > 0,
    {
      message: "Total questions must be greater than 0",
    }
  );

/**
 * Schema for creating a new quiz
 */
export const createQuizInputSchema = z.object({
  userId: z.uuidv7(),
  title: z.string().min(1).max(255),
  distribution: distributionSchema,
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
  title: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  totalQuestions: z.number().int().min(0),
  isPublic: z.boolean(),
  shareLink: z.string().optional(),
  distribution: distributionSchema,
});

/**
 * Output DTO for quiz responses
 */
export type QuizResponseDTO = z.infer<typeof quizResponseSchema>;

/**
 * Helper function to transform Quiz entity to QuizResponseDTO
 */
export function toQuizResponseDTO(
  quiz: {
    id: string;
    title: string;
    createdAt: Date;
    updatedAt: Date;
    isPublic: boolean;
    questionDistribution: number;
  },
  baseUrl?: string
): QuizResponseDTO {
  const distribution = QuizDistributionService.decode(
    quiz.questionDistribution
  );
  const totalQuestions = QuizDistributionService.getTotalQuestions(
    quiz.questionDistribution
  );

  return {
    id: quiz.id,
    title: quiz.title,
    createdAt: quiz.createdAt.toISOString(),
    updatedAt: quiz.updatedAt.toISOString(),
    totalQuestions,
    isPublic: quiz.isPublic,
    shareLink:
      quiz.isPublic && baseUrl
        ? `${baseUrl}/quiz/${quiz.id}/public`
        : undefined,
    distribution,
  };
}
