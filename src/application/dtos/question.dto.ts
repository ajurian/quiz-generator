import { z } from "zod";
import { QuestionType } from "@/domain";

/**
 * Schema for question option
 */
export const questionOptionSchema = z.object({
  index: z.enum(["A", "B", "C", "D"]),
  text: z.string().min(1),
  isCorrect: z.boolean(),
  errorRationale: z.string().optional(),
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
  correctExplanation: z.string(),
  sourceQuote: z.string(),
  reference: z.number().int().min(0),
  /** Title of the source material this question references */
  sourceTitle: z.string().optional(),
});

/**
 * Output DTO for question responses
 */
export type QuestionResponseDTO = z.infer<typeof questionResponseSchema>;

/**
 * Helper function to transform Question entity to QuestionResponseDTO
 * @param question - The question entity or plain object
 * @param sourceTitle - Optional title of the source material (resolved from reference index)
 */
export function toQuestionResponseDTO(
  question: {
    id: string;
    quizId: string;
    orderIndex: number;
    type: QuestionType;
    stem: string;
    options: readonly {
      index: string;
      text: string;
      isCorrect: boolean;
      errorRationale?: string;
    }[];
    correctExplanation: string;
    sourceQuote: string;
    reference: number;
  },
  sourceTitle?: string
): QuestionResponseDTO {
  return {
    id: question.id,
    quizId: question.quizId,
    orderIndex: question.orderIndex,
    type: question.type,
    stem: question.stem,
    options: question.options.map((opt) => ({
      index: opt.index as "A" | "B" | "C" | "D",
      text: opt.text,
      isCorrect: opt.isCorrect,
      errorRationale: opt.errorRationale,
    })),
    correctExplanation: question.correctExplanation,
    sourceQuote: question.sourceQuote,
    reference: question.reference,
    sourceTitle,
  };
}
