import { z } from "zod";
import { QuestionType } from "../../domain";

/**
 * Schema for question option
 */
export const questionOptionSchema = z.object({
  index: z.enum(["A", "B", "C", "D"]),
  text: z.string().min(1),
  explanation: z.string(),
  isCorrect: z.boolean(),
});

/**
 * Schema for question response
 */
export const questionResponseSchema = z.object({
  id: z.uuidv7(),
  quizId: z.uuidv7(),
  orderIndex: z.number().int().min(0),
  type: z.enum(QuestionType),
  stem: z.string(),
  options: z.array(questionOptionSchema).length(4),
});

/**
 * Output DTO for question responses
 */
export type QuestionResponseDTO = z.infer<typeof questionResponseSchema>;

/**
 * Helper function to transform Question entity to QuestionResponseDTO
 */
export function toQuestionResponseDTO(question: {
  id: string;
  quizId: string;
  orderIndex: number;
  type: QuestionType;
  stem: string;
  options: readonly {
    index: string;
    text: string;
    explanation: string;
    isCorrect: boolean;
  }[];
}): QuestionResponseDTO {
  return {
    id: question.id,
    quizId: question.quizId,
    orderIndex: question.orderIndex,
    type: question.type,
    stem: question.stem,
    options: question.options.map((opt) => ({
      index: opt.index as "A" | "B" | "C" | "D",
      text: opt.text,
      explanation: opt.explanation,
      isCorrect: opt.isCorrect,
    })),
  };
}
