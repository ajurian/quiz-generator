import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { QuizVisibility } from "@/domain";
import { getContainer } from "@/presentation/lib/composition";

// GET Quiz by Slug (for taking/viewing)
export const getQuizBySlug = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      quizSlug: z.string().length(22),
      userId: z.uuidv7().nullable().optional(),
    })
  )
  .handler(async ({ data }) => {
    const container = getContainer();
    const result = await container.useCases.getQuizById.execute({
      quizSlug: data.quizSlug,
      userId: data.userId ?? null,
    });
    return result;
  });

// POST Update Quiz Visibility
export const updateQuizVisibility = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      quizId: z.uuidv7(),
      userId: z.uuidv7(),
      visibility: z.enum(QuizVisibility),
    })
  )
  .handler(async ({ data }) => {
    const container = getContainer();
    const result = await container.useCases.updateQuizVisibility.execute({
      quizId: data.quizId,
      userId: data.userId,
      visibility: data.visibility,
    });
    return result;
  });

// POST Start Attempt
export const startAttempt = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      quizSlug: z.string().length(22),
      userId: z.uuidv7().nullable(),
    })
  )
  .handler(async ({ data }) => {
    const container = getContainer();
    const result = await container.useCases.startAttempt.execute({
      quizSlug: data.quizSlug,
      userId: data.userId,
    });
    return result;
  });

// POST Force Start Attempt (bypasses "already completed" check)
export const forceStartAttempt = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      quizSlug: z.string().length(22),
      userId: z.uuidv7().nullable(),
    })
  )
  .handler(async ({ data }) => {
    const container = getContainer();
    const result = await container.useCases.forceStartAttempt.execute({
      quizSlug: data.quizSlug,
      userId: data.userId,
    });
    return result;
  });

// POST Submit Attempt
export const submitAttempt = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      attemptId: z.uuidv7(),
      userId: z.uuidv7().nullable(),
      score: z.number().min(0).max(100),
      answers: z.record(z.string(), z.string()),
    })
  )
  .handler(async ({ data }) => {
    const container = getContainer();
    const result = await container.useCases.submitAttempt.execute({
      attemptId: data.attemptId,
      userId: data.userId,
      score: data.score,
      answers: data.answers,
    });
    return result;
  });

// GET User's Attempts for a Quiz
export const getUserAttempts = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      quizSlug: z.string().length(22),
      userId: z.uuidv7(),
    })
  )
  .handler(async ({ data }) => {
    const container = getContainer();
    const result = await container.useCases.getUserAttempts.execute({
      quizSlug: data.quizSlug,
      userId: data.userId,
    });
    return result;
  });

// GET Attempt Detail
export const getAttemptDetail = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      quizSlug: z.string().length(22),
      attemptSlug: z.string().length(22),
      userId: z.uuidv7().nullable(),
    })
  )
  .handler(async ({ data }) => {
    const container = getContainer();
    const result = await container.useCases.getAttemptDetail.execute({
      quizSlug: data.quizSlug,
      attemptSlug: data.attemptSlug,
      userId: data.userId,
    });
    return result;
  });

// POST Autosave Answer (for autosaving during quiz taking)
export const autosaveAnswer = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      attemptId: z.uuidv7(),
      userId: z.uuidv7().nullable(),
      questionId: z.string(),
      optionIndex: z.string(),
    })
  )
  .handler(async ({ data }) => {
    const container = getContainer();
    const result = await container.useCases.autosaveAnswer.execute({
      attemptId: data.attemptId,
      userId: data.userId,
      questionId: data.questionId,
      optionIndex: data.optionIndex,
    });
    return result;
  });

// POST Reset Attempt (for "Start Over" functionality)
export const resetAttempt = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      attemptId: z.uuidv7(),
      userId: z.uuidv7().nullable(),
    })
  )
  .handler(async ({ data }) => {
    const container = getContainer();
    const result = await container.useCases.resetAttempt.execute({
      attemptId: data.attemptId,
      userId: data.userId,
    });
    return result;
  });

// GET User's Attempt History (latest attempt per quiz)
export const getUserAttemptHistory = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      userId: z.uuidv7(),
    })
  )
  .handler(async ({ data }) => {
    const container = getContainer();
    const result = await container.useCases.getUserAttemptHistory.execute({
      userId: data.userId,
    });
    return result;
  });
