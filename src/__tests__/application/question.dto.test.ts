import { describe, expect, it } from "bun:test";
import { toQuestionResponseDTO } from "@/application/dtos/question.dto";
import { Question, QuestionType } from "@/domain";

describe("Question DTOs", () => {
  describe("toQuestionResponseDTO", () => {
    const createMockQuestion = (): Question => {
      return Question.create({
        id: "question-123",
        quizId: "quiz-123",
        orderIndex: 0,
        type: QuestionType.DIRECT_QUESTION,
        stem: "What is the capital of France?",
        options: [
          {
            index: "A",
            text: "Paris",
            isCorrect: true,
          },
          {
            index: "B",
            text: "London",
            isCorrect: false,
            errorRationale: "London is the capital of UK",
          },
          {
            index: "C",
            text: "Berlin",
            isCorrect: false,
            errorRationale: "Berlin is the capital of Germany",
          },
          {
            index: "D",
            text: "Madrid",
            isCorrect: false,
            errorRationale: "Madrid is the capital of Spain",
          },
        ],
        correctExplanation: "Paris is the capital of France",
        sourceQuote: "Paris is the capital city of France.",
        reference: 0,
      });
    };

    it("should transform Question to QuestionResponseDTO", () => {
      const question = createMockQuestion();
      const dto = toQuestionResponseDTO(question);

      expect(dto.id).toBe("question-123");
      expect(dto.quizId).toBe("quiz-123");
      expect(dto.stem).toBe("What is the capital of France?");
      expect(dto.type).toBe(QuestionType.DIRECT_QUESTION);
      expect(dto.orderIndex).toBe(0);
    });

    it("should include all options with correct structure", () => {
      const question = createMockQuestion();
      const dto = toQuestionResponseDTO(question);

      expect(dto.options).toHaveLength(4);
      expect(dto.options[0]).toEqual({
        index: "A",
        text: "Paris",
        isCorrect: true,
        errorRationale: undefined,
      });
    });

    it("should preserve option order", () => {
      const question = createMockQuestion();
      const dto = toQuestionResponseDTO(question);

      expect(dto.options[0]!.index).toBe("A");
      expect(dto.options[1]!.index).toBe("B");
      expect(dto.options[2]!.index).toBe("C");
      expect(dto.options[3]!.index).toBe("D");
    });

    it("should correctly map all question types", () => {
      const types = [
        QuestionType.DIRECT_QUESTION,
        QuestionType.TWO_STATEMENT_COMPOUND,
        QuestionType.CONTEXTUAL,
      ];

      types.forEach((type) => {
        const question = Question.create({
          id: "question-123",
          quizId: "quiz-123",
          orderIndex: 0,
          type: type,
          stem: "Test question",
          options: [
            {
              index: "A",
              text: "Option A",
              isCorrect: true,
            },
            {
              index: "B",
              text: "Option B",
              isCorrect: false,
              errorRationale: "Rationale",
            },
            {
              index: "C",
              text: "Option C",
              isCorrect: false,
              errorRationale: "Rationale",
            },
            {
              index: "D",
              text: "Option D",
              isCorrect: false,
              errorRationale: "Rationale",
            },
          ],
          correctExplanation: "Correct explanation",
          sourceQuote: "Source quote",
          reference: 0,
        });

        const dto = toQuestionResponseDTO(question);
        expect(dto.type).toBe(type);
      });
    });
  });
});
