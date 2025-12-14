import { describe, expect, it } from "bun:test";
import { toQuestionResponseDTO } from "../../application/dtos/question.dto";
import { Question, QuestionType } from "../../domain";

describe("Question DTOs", () => {
  describe("toQuestionResponseDTO", () => {
    const createMockQuestion = (): Question => {
      return Question.create({
        id: "question-123",
        quizId: "quiz-123",
        questionText: "What is the capital of France?",
        questionType: QuestionType.SINGLE_BEST_ANSWER,
        options: [
          {
            index: "A",
            text: "Paris",
            explanation: "Paris is the capital of France",
            isCorrect: true,
          },
          {
            index: "B",
            text: "London",
            explanation: "London is the capital of UK",
            isCorrect: false,
          },
          {
            index: "C",
            text: "Berlin",
            explanation: "Berlin is the capital of Germany",
            isCorrect: false,
          },
          {
            index: "D",
            text: "Madrid",
            explanation: "Madrid is the capital of Spain",
            isCorrect: false,
          },
        ],
        orderIndex: 0,
      });
    };

    it("should transform Question to QuestionResponseDTO", () => {
      const question = createMockQuestion();
      const dto = toQuestionResponseDTO(question);

      expect(dto.id).toBe("question-123");
      expect(dto.quizId).toBe("quiz-123");
      expect(dto.questionText).toBe("What is the capital of France?");
      expect(dto.questionType).toBe(QuestionType.SINGLE_BEST_ANSWER);
      expect(dto.orderIndex).toBe(0);
    });

    it("should include all options with correct structure", () => {
      const question = createMockQuestion();
      const dto = toQuestionResponseDTO(question);

      expect(dto.options).toHaveLength(4);
      expect(dto.options[0]).toEqual({
        index: "A",
        text: "Paris",
        explanation: "Paris is the capital of France",
        isCorrect: true,
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
      const questionTypes = [
        QuestionType.SINGLE_BEST_ANSWER,
        QuestionType.TWO_STATEMENTS,
        QuestionType.CONTEXTUAL,
      ];

      questionTypes.forEach((type) => {
        const question = Question.create({
          id: "question-123",
          quizId: "quiz-123",
          questionText: "Test question",
          questionType: type,
          options: [
            {
              index: "A",
              text: "Option A",
              explanation: "Explanation",
              isCorrect: true,
            },
            {
              index: "B",
              text: "Option B",
              explanation: "Explanation",
              isCorrect: false,
            },
            {
              index: "C",
              text: "Option C",
              explanation: "Explanation",
              isCorrect: false,
            },
            {
              index: "D",
              text: "Option D",
              explanation: "Explanation",
              isCorrect: false,
            },
          ],
          orderIndex: 0,
        });

        const dto = toQuestionResponseDTO(question);
        expect(dto.questionType).toBe(type);
      });
    });
  });
});
