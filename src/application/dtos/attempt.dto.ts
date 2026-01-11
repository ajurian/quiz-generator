import { z } from "zod";
import { AttemptStatus } from "@/domain";

/**
 * Validation schema for attempt status
 */
export const attemptStatusSchema = z.enum(AttemptStatus);

/**
 * Schema for starting a new quiz attempt
 */
export const startAttemptInputSchema = z.object({
  quizId: z.uuidv7(),
  userId: z.uuidv7().nullable(),
});

/**
 * Input DTO for StartAttemptUseCase
 */
export type StartAttemptInput = z.infer<typeof startAttemptInputSchema>;

/**
 * Schema for submitting a quiz attempt
 */
export const submitAttemptInputSchema = z.object({
  attemptId: z.uuidv7(),
  userId: z.uuidv7().nullable(),
  score: z.number().min(0).max(100),
  answers: z.record(z.string(), z.string()),
});

/**
 * Input DTO for SubmitAttemptUseCase
 */
export type SubmitAttemptInput = z.infer<typeof submitAttemptInputSchema>;

/**
 * Schema for attempt response
 */
export const attemptResponseSchema = z.object({
  id: z.uuidv7(),
  slug: z.string().length(22),
  quizId: z.uuidv7(),
  userId: z.uuidv7().nullable(),
  status: attemptStatusSchema,
  score: z.number().nullable(),
  durationMs: z.number().nullable(),
  formattedDuration: z.string().nullable(),
  startedAt: z.string().datetime(),
  submittedAt: z.string().datetime().nullable(),
  answers: z.record(z.string(), z.string()),
});

/**
 * Output DTO for attempt responses
 */
export type AttemptResponseDTO = z.infer<typeof attemptResponseSchema>;

/**
 * Helper function to transform QuizAttempt entity to AttemptResponseDTO
 */
export function toAttemptResponseDTO(attempt: {
  id: string;
  slug: string;
  quizId: string;
  userId: string | null;
  status: AttemptStatus;
  score: number | null;
  durationMs: number | null;
  startedAt: Date;
  submittedAt: Date | null;
  answers: Record<string, string>;
}): AttemptResponseDTO {
  // Calculate formatted duration
  let formattedDuration: string | null = null;
  if (attempt.durationMs !== null) {
    const totalSeconds = Math.floor(attempt.durationMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    formattedDuration =
      minutes === 0 ? `${seconds}s` : `${minutes}m ${seconds}s`;
  }

  return {
    id: attempt.id,
    slug: attempt.slug,
    quizId: attempt.quizId,
    userId: attempt.userId,
    status: attempt.status,
    score: attempt.score,
    durationMs: attempt.durationMs,
    formattedDuration,
    startedAt: attempt.startedAt.toISOString(),
    submittedAt: attempt.submittedAt?.toISOString() ?? null,
    answers: attempt.answers,
  };
}

/**
 * Schema for getting user attempts for a quiz
 */
export const getUserAttemptsInputSchema = z.object({
  quizSlug: z.string().length(22),
  userId: z.uuidv7(),
});

/**
 * Input DTO for GetUserAttemptsUseCase
 */
export type GetUserAttemptsInput = z.infer<typeof getUserAttemptsInputSchema>;

/**
 * Schema for getting an attempt by slug
 */
export const getAttemptBySlugInputSchema = z.object({
  quizSlug: z.string().length(22),
  attemptSlug: z.string().length(22),
  userId: z.uuidv7().nullable(),
});

/**
 * Input DTO for GetAttemptBySlugUseCase
 */
export type GetAttemptBySlugInput = z.infer<typeof getAttemptBySlugInputSchema>;

/**
 * Summary of user's attempts on a quiz
 */
export interface AttemptSummaryDTO {
  totalAttempts: number;
  lastAttempt: AttemptResponseDTO | null;
  bestScore: number | null;
  averageScore: number | null;
}

/**
 * Helper function to create attempt summary
 */
export function createAttemptSummary(
  attempts: AttemptResponseDTO[]
): AttemptSummaryDTO {
  const submittedAttempts = attempts.filter(
    (a) => a.status === AttemptStatus.SUBMITTED
  );

  const scores = submittedAttempts
    .map((a) => a.score)
    .filter((s): s is number => s !== null);

  return {
    totalAttempts: submittedAttempts.length,
    lastAttempt: attempts.length > 0 ? attempts[0]! : null,
    bestScore: scores.length > 0 ? Math.max(...scores) : null,
    averageScore:
      scores.length > 0
        ? Math.round(
            (scores.reduce((a, b) => a + b, 0) / scores.length) * 100
          ) / 100
        : null,
  };
}
