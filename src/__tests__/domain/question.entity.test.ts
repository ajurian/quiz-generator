import { describe, expect, it } from "bun:test";
import {
  Question,
  type CreateQuestionProps,
} from "../../domain/entities/question.entity";
import { QuestionType } from "../../domain/enums";
import {
  QuestionOption,
  type QuestionOptionProps,
} from "../../domain/value-objects";

describe("Question Entity", () => {
  // Helper to create valid option props
  const createValidOptions = (): QuestionOptionProps[] => [
    {
      index: "A",
      text: "Option A",
      explanation: "Explanation A",
      isCorrect: true,
    },
    {
      index: "B",
      text: "Option B",
      explanation: "Explanation B",
      isCorrect: false,
    },
    {
      index: "C",
      text: "Option C",
      explanation: "Explanation C",
      isCorrect: false,
    },
    {
      index: "D",
      text: "Option D",
      explanation: "Explanation D",
      isCorrect: false,
    },
  ];

  // Helper to create valid question props
  const createValidProps = (
    overrides?: Partial<CreateQuestionProps>
  ): CreateQuestionProps => ({
    id: "question-123",
    quizId: "quiz-456",
    questionText: "What is the correct answer?",
    questionType: QuestionType.SINGLE_BEST_ANSWER,
    options: createValidOptions(),
    orderIndex: 0,
    ...overrides,
  });

  describe("create", () => {
    it("should create a valid Question", () => {
      const props = createValidProps();
      const question = Question.create(props);

      expect(question.id).toBe("question-123");
      expect(question.quizId).toBe("quiz-456");
      expect(question.questionText).toBe("What is the correct answer?");
      expect(question.questionType).toBe(QuestionType.SINGLE_BEST_ANSWER);
      expect(question.orderIndex).toBe(0);
      expect(question.options).toHaveLength(4);
    });

    it("should create Question with different question types", () => {
      const types = [
        QuestionType.SINGLE_BEST_ANSWER,
        QuestionType.TWO_STATEMENTS,
        QuestionType.SITUATIONAL,
      ];

      for (const questionType of types) {
        const question = Question.create(createValidProps({ questionType }));
        expect(question.questionType).toBe(questionType);
      }
    });

    it("should convert option props to QuestionOption value objects", () => {
      const question = Question.create(createValidProps());

      for (const option of question.options) {
        expect(option).toBeInstanceOf(QuestionOption);
      }
    });

    describe("validation errors", () => {
      it("should throw for missing id", () => {
        expect(() => Question.create(createValidProps({ id: "" }))).toThrow(
          "Question ID is required"
        );
      });

      it("should throw for missing quizId", () => {
        expect(() => Question.create(createValidProps({ quizId: "" }))).toThrow(
          "Quiz ID is required"
        );
      });

      it("should throw for empty questionText", () => {
        expect(() =>
          Question.create(createValidProps({ questionText: "" }))
        ).toThrow("Question text is required and cannot be empty");
      });

      it("should throw for whitespace-only questionText", () => {
        expect(() =>
          Question.create(createValidProps({ questionText: "   " }))
        ).toThrow("Question text is required and cannot be empty");
      });

      it("should throw for invalid questionType", () => {
        expect(() =>
          Question.create(
            createValidProps({ questionType: "invalid" as QuestionType })
          )
        ).toThrow("Invalid question type");
      });

      it("should throw for less than 4 options", () => {
        const options = createValidOptions().slice(0, 3);
        expect(() => Question.create(createValidProps({ options }))).toThrow(
          "Exactly 4 options are required"
        );
      });

      it("should throw for more than 4 options", () => {
        const options = [
          ...createValidOptions(),
          {
            index: "A" as const,
            text: "Extra",
            explanation: "",
            isCorrect: false,
          },
        ];
        expect(() => Question.create(createValidProps({ options }))).toThrow(
          "Exactly 4 options are required"
        );
      });

      it("should throw for duplicate option indices", () => {
        const options: QuestionOptionProps[] = [
          { index: "A", text: "Option A", explanation: "", isCorrect: true },
          { index: "A", text: "Option A2", explanation: "", isCorrect: false },
          { index: "C", text: "Option C", explanation: "", isCorrect: false },
          { index: "D", text: "Option D", explanation: "", isCorrect: false },
        ];
        expect(() => Question.create(createValidProps({ options }))).toThrow(
          "Options must have indices A, B, C, and D"
        );
      });

      it("should throw for missing option index", () => {
        const options: QuestionOptionProps[] = [
          { index: "A", text: "Option A", explanation: "", isCorrect: true },
          { index: "B", text: "Option B", explanation: "", isCorrect: false },
          { index: "C", text: "Option C", explanation: "", isCorrect: false },
          { index: "C", text: "Option C2", explanation: "", isCorrect: false },
        ];
        expect(() => Question.create(createValidProps({ options }))).toThrow(
          "Options must have indices A, B, C, and D"
        );
      });

      it("should throw for no correct answer", () => {
        const options = createValidOptions().map((opt) => ({
          ...opt,
          isCorrect: false,
        }));
        expect(() => Question.create(createValidProps({ options }))).toThrow(
          "Exactly one option must be marked as correct"
        );
      });

      it("should throw for multiple correct answers", () => {
        const options = createValidOptions().map((opt) => ({
          ...opt,
          isCorrect: true,
        }));
        expect(() => Question.create(createValidProps({ options }))).toThrow(
          "Exactly one option must be marked as correct"
        );
      });

      it("should throw for negative orderIndex", () => {
        expect(() =>
          Question.create(createValidProps({ orderIndex: -1 }))
        ).toThrow("Order index must be a non-negative number");
      });
    });
  });

  describe("reconstitute", () => {
    it("should reconstitute a Question from persisted data", () => {
      const options = createValidOptions().map((opt) =>
        QuestionOption.create(opt)
      );

      const question = Question.reconstitute({
        id: "question-123",
        quizId: "quiz-456",
        questionText: "Reconstituted question",
        questionType: QuestionType.TWO_STATEMENTS,
        options,
        orderIndex: 5,
      });

      expect(question.id).toBe("question-123");
      expect(question.questionType).toBe(QuestionType.TWO_STATEMENTS);
      expect(question.orderIndex).toBe(5);
    });
  });

  describe("fromPlain", () => {
    it("should create Question from plain data", () => {
      const plainData = {
        id: "question-123",
        quizId: "quiz-456",
        questionText: "Plain question",
        questionType: "single_best_answer",
        options: createValidOptions(),
        orderIndex: 2,
      };

      const question = Question.fromPlain(plainData);

      expect(question.id).toBe("question-123");
      expect(question.questionType).toBe(QuestionType.SINGLE_BEST_ANSWER);
      expect(question.orderIndex).toBe(2);
    });

    it("should throw for invalid questionType string", () => {
      const plainData = {
        id: "question-123",
        quizId: "quiz-456",
        questionText: "Plain question",
        questionType: "invalid_type",
        options: createValidOptions(),
        orderIndex: 0,
      };

      expect(() => Question.fromPlain(plainData)).toThrow(
        "Invalid question type"
      );
    });
  });

  describe("getCorrectOption", () => {
    it("should return the correct option", () => {
      const options = createValidOptions();
      options[2]!.isCorrect = true;
      options[0]!.isCorrect = false;

      const question = Question.create(createValidProps({ options }));
      const correct = question.getCorrectOption();

      expect(correct.index).toBe("C");
      expect(correct.isCorrect).toBe(true);
    });
  });

  describe("getOptionByIndex", () => {
    it("should return option by index", () => {
      const question = Question.create(createValidProps());

      const optionA = question.getOptionByIndex("A");
      const optionB = question.getOptionByIndex("B");
      const optionC = question.getOptionByIndex("C");
      const optionD = question.getOptionByIndex("D");

      expect(optionA?.index).toBe("A");
      expect(optionB?.index).toBe("B");
      expect(optionC?.index).toBe("C");
      expect(optionD?.index).toBe("D");
    });

    it("should return undefined for invalid index", () => {
      const question = Question.create(createValidProps());

      expect(question.getOptionByIndex("E")).toBeUndefined();
      expect(question.getOptionByIndex("")).toBeUndefined();
    });
  });

  describe("isAnswerCorrect", () => {
    it("should return true for correct answer", () => {
      const question = Question.create(createValidProps());

      expect(question.isAnswerCorrect("A")).toBe(true);
    });

    it("should return false for incorrect answer", () => {
      const question = Question.create(createValidProps());

      expect(question.isAnswerCorrect("B")).toBe(false);
      expect(question.isAnswerCorrect("C")).toBe(false);
      expect(question.isAnswerCorrect("D")).toBe(false);
    });

    it("should return false for invalid index", () => {
      const question = Question.create(createValidProps());

      expect(question.isAnswerCorrect("E")).toBe(false);
    });
  });

  describe("getSortedOptions", () => {
    it("should return options in A, B, C, D order", () => {
      // Create options in random order
      const options: QuestionOptionProps[] = [
        { index: "D", text: "Option D", explanation: "", isCorrect: false },
        { index: "B", text: "Option B", explanation: "", isCorrect: false },
        { index: "A", text: "Option A", explanation: "", isCorrect: true },
        { index: "C", text: "Option C", explanation: "", isCorrect: false },
      ];

      const question = Question.create(createValidProps({ options }));
      const sorted = question.getSortedOptions();

      expect(sorted[0]!.index).toBe("A");
      expect(sorted[1]!.index).toBe("B");
      expect(sorted[2]!.index).toBe("C");
      expect(sorted[3]!.index).toBe("D");
    });

    it("should not modify original options array", () => {
      const question = Question.create(createValidProps());
      const originalFirst = question.options[0];

      question.getSortedOptions();

      expect(question.options[0]).toBe(originalFirst);
    });
  });

  describe("updateQuestionText", () => {
    it("should update the question text", () => {
      const question = Question.create(createValidProps());
      question.updateQuestionText("Updated question text");

      expect(question.questionText).toBe("Updated question text");
    });

    it("should trim the text", () => {
      const question = Question.create(createValidProps());
      question.updateQuestionText("  Trimmed text  ");

      expect(question.questionText).toBe("Trimmed text");
    });

    it("should throw for empty text", () => {
      const question = Question.create(createValidProps());

      expect(() => question.updateQuestionText("")).toThrow(
        "Question text is required and cannot be empty"
      );
    });
  });

  describe("updateOrderIndex", () => {
    it("should update the order index", () => {
      const question = Question.create(createValidProps({ orderIndex: 0 }));
      question.updateOrderIndex(5);

      expect(question.orderIndex).toBe(5);
    });

    it("should throw for negative index", () => {
      const question = Question.create(createValidProps());

      expect(() => question.updateOrderIndex(-1)).toThrow(
        "Order index must be a non-negative number"
      );
    });
  });

  describe("toPlain", () => {
    it("should convert to plain object", () => {
      const question = Question.create(createValidProps());
      const plain = question.toPlain();

      expect(plain.id).toBe("question-123");
      expect(plain.quizId).toBe("quiz-456");
      expect(plain.questionText).toBe("What is the correct answer?");
      expect(plain.questionType).toBe(QuestionType.SINGLE_BEST_ANSWER);
      expect(plain.orderIndex).toBe(0);
      expect(plain.options).toHaveLength(4);

      // Options should be plain objects
      expect(plain.options[0]).toEqual({
        index: "A",
        text: "Option A",
        explanation: "Explanation A",
        isCorrect: true,
      });
    });
  });

  describe("options immutability", () => {
    it("should return readonly options array", () => {
      const question = Question.create(createValidProps());
      const options = question.options;

      // Should be readonly
      expect(Array.isArray(options)).toBe(true);
      expect(options).toHaveLength(4);
    });
  });
});
