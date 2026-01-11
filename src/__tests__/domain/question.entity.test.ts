import { describe, expect, it } from "bun:test";
import {
  Question,
  type CreateQuestionProps,
} from "@/domain/entities/question.entity";
import { QuestionType } from "@/domain/enums";
import {
  QuestionOption,
  type QuestionOptionProps,
} from "@/domain/value-objects";

describe("Question Entity", () => {
  // Helper to create valid option props
  const createValidOptions = (): QuestionOptionProps[] => [
    {
      index: "A",
      text: "Option A",
      isCorrect: true,
      errorRationale: undefined,
    },
    {
      index: "B",
      text: "Option B",
      isCorrect: false,
      errorRationale: "Rationale B",
    },
    {
      index: "C",
      text: "Option C",
      isCorrect: false,
      errorRationale: "Rationale C",
    },
    {
      index: "D",
      text: "Option D",
      isCorrect: false,
      errorRationale: "Rationale D",
    },
  ];

  // Helper to create valid question props
  const createValidProps = (
    overrides?: Partial<CreateQuestionProps>
  ): CreateQuestionProps => ({
    id: "question-123",
    quizId: "quiz-456",
    orderIndex: 0,
    type: QuestionType.DIRECT_QUESTION,
    stem: "What is the correct answer?",
    options: createValidOptions(),
    correctExplanation: "This is the correct explanation.",
    sourceQuote: "Source quote from the material.",
    reference: 0,
    ...overrides,
  });

  describe("create", () => {
    it("should create a valid Question", () => {
      const props = createValidProps();
      const question = Question.create(props);

      expect(question.id).toBe("question-123");
      expect(question.quizId).toBe("quiz-456");
      expect(question.stem).toBe("What is the correct answer?");
      expect(question.type).toBe(QuestionType.DIRECT_QUESTION);
      expect(question.orderIndex).toBe(0);
      expect(question.options).toHaveLength(4);
    });

    it("should create Question with different question types", () => {
      const types = [
        QuestionType.DIRECT_QUESTION,
        QuestionType.TWO_STATEMENT_COMPOUND,
        QuestionType.CONTEXTUAL,
      ];

      for (const type of types) {
        const question = Question.create(createValidProps({ type }));
        expect(question.type).toBe(type);
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

      it("should throw for empty stem", () => {
        expect(() => Question.create(createValidProps({ stem: "" }))).toThrow(
          "Stem is required and cannot be empty"
        );
      });

      it("should throw for whitespace-only stem", () => {
        expect(() =>
          Question.create(createValidProps({ stem: "   " }))
        ).toThrow("Stem is required and cannot be empty");
      });

      it("should throw for invalid type", () => {
        expect(() =>
          Question.create(createValidProps({ type: "invalid" as QuestionType }))
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
            isCorrect: false,
            errorRationale: "Extra rationale",
          },
        ];
        expect(() => Question.create(createValidProps({ options }))).toThrow(
          "Exactly 4 options are required"
        );
      });

      it("should throw for duplicate option indices", () => {
        const options: QuestionOptionProps[] = [
          { index: "A", text: "Option A", isCorrect: true },
          {
            index: "A",
            text: "Option A2",
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
        ];
        expect(() => Question.create(createValidProps({ options }))).toThrow(
          "Options must have indices A, B, C, and D"
        );
      });

      it("should throw for missing option index", () => {
        const options: QuestionOptionProps[] = [
          { index: "A", text: "Option A", isCorrect: true },
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
            index: "C",
            text: "Option C2",
            isCorrect: false,
            errorRationale: "Rationale",
          },
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
        ).toThrow("Order index must be a non-negative integer");
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
        orderIndex: 5,
        type: QuestionType.TWO_STATEMENT_COMPOUND,
        stem: "Reconstituted question",
        options,
        correctExplanation: "Correct explanation",
        sourceQuote: "Source quote",
        reference: 0,
      });

      expect(question.id).toBe("question-123");
      expect(question.type).toBe(QuestionType.TWO_STATEMENT_COMPOUND);
      expect(question.orderIndex).toBe(5);
      expect(question.correctExplanation).toBe("Correct explanation");
      expect(question.sourceQuote).toBe("Source quote");
      expect(question.reference).toBe(0);
    });
  });

  describe("fromPlain", () => {
    it("should create Question from plain data", () => {
      const plainData = {
        id: "question-123",
        quizId: "quiz-456",
        orderIndex: 2,
        type: "direct_question",
        stem: "Plain question",
        options: createValidOptions(),
        correctExplanation: "Correct explanation",
        sourceQuote: "Source quote",
        reference: 0,
      };

      const question = Question.fromPlain(plainData);

      expect(question.id).toBe("question-123");
      expect(question.type).toBe(QuestionType.DIRECT_QUESTION);
      expect(question.orderIndex).toBe(2);
      expect(question.correctExplanation).toBe("Correct explanation");
      expect(question.sourceQuote).toBe("Source quote");
      expect(question.reference).toBe(0);
    });

    it("should throw for invalid type string", () => {
      const plainData = {
        id: "question-123",
        quizId: "quiz-456",
        orderIndex: 0,
        type: "invalid_type",
        stem: "Plain question",
        options: createValidOptions(),
        correctExplanation: "Correct explanation",
        sourceQuote: "Source quote",
        reference: 0,
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
        {
          index: "D",
          text: "Option D",
          isCorrect: false,
          errorRationale: "Rationale",
        },
        {
          index: "B",
          text: "Option B",
          isCorrect: false,
          errorRationale: "Rationale",
        },
        { index: "A", text: "Option A", isCorrect: true },
        {
          index: "C",
          text: "Option C",
          isCorrect: false,
          errorRationale: "Rationale",
        },
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

  describe("updateStem", () => {
    it("should update the stem", () => {
      const question = Question.create(createValidProps());
      question.updateStem("Updated stem");

      expect(question.stem).toBe("Updated stem");
    });

    it("should trim the text", () => {
      const question = Question.create(createValidProps());
      question.updateStem("  Trimmed text  ");

      expect(question.stem).toBe("Trimmed text");
    });

    it("should throw for empty text", () => {
      const question = Question.create(createValidProps());

      expect(() => question.updateStem("")).toThrow(
        "Stem is required and cannot be empty"
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
        "Order index must be a non-negative integer"
      );
    });
  });

  describe("toPlain", () => {
    it("should convert to plain object", () => {
      const question = Question.create(createValidProps());
      const plain = question.toPlain();

      expect(plain.id).toBe("question-123");
      expect(plain.quizId).toBe("quiz-456");
      expect(plain.stem).toBe("What is the correct answer?");
      expect(plain.type).toBe(QuestionType.DIRECT_QUESTION);
      expect(plain.orderIndex).toBe(0);
      expect(plain.options).toHaveLength(4);
      expect(plain.correctExplanation).toBe("This is the correct explanation.");
      expect(plain.sourceQuote).toBe("Source quote from the material.");
      expect(plain.reference).toBe(0);

      // Options should be plain objects
      expect(plain.options[0]).toEqual({
        index: "A",
        text: "Option A",
        isCorrect: true,
        errorRationale: undefined,
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
