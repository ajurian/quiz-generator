import { z } from "zod";
import { QuestionType } from "../../domain";

/**
 * Schema for question option
 */
export const questionOptionSchema = z.object({
  index: z.enum(["A", "B", "C", "D"]),
  text: z.string().min(1, "Option text is required"),
  explanation: z.string(),
  isCorrect: z.boolean(),
});

/**
 * Schema for question response
 */
export const questionResponseSchema = z.object({
  id: z.string().uuid(),
  quizId: z.string().uuid(),
  questionText: z.string(),
  questionType: z.nativeEnum(QuestionType),
  options: z.array(questionOptionSchema).length(4),
  orderIndex: z.number().int().min(0),
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
  questionText: string;
  questionType: QuestionType;
  options: readonly {
    index: string;
    text: string;
    explanation: string;
    isCorrect: boolean;
  }[];
  orderIndex: number;
}): QuestionResponseDTO {
  return {
    id: question.id,
    quizId: question.quizId,
    questionText: question.questionText,
    questionType: question.questionType,
    options: question.options.map((opt) => ({
      index: opt.index as "A" | "B" | "C" | "D",
      text: opt.text,
      explanation: opt.explanation,
      isCorrect: opt.isCorrect,
    })),
    orderIndex: question.orderIndex,
  };
}
