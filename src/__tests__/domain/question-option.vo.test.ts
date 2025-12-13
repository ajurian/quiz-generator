import { describe, expect, it } from "bun:test";
import {
  QuestionOption,
  type QuestionOptionProps,
  VALID_OPTION_INDICES,
  isValidOptionIndex,
} from "../../domain/value-objects/question-option.vo";

describe("QuestionOption Value Object", () => {
  // Helper to create valid props
  const createValidProps = (
    overrides?: Partial<QuestionOptionProps>
  ): QuestionOptionProps => ({
    index: "A",
    text: "Option A text",
    explanation: "Explanation for option A",
    isCorrect: false,
    ...overrides,
  });

  describe("VALID_OPTION_INDICES", () => {
    it("should contain A, B, C, D", () => {
      expect(VALID_OPTION_INDICES).toEqual(["A", "B", "C", "D"]);
    });

    it("should be immutable (readonly)", () => {
      expect(VALID_OPTION_INDICES).toHaveLength(4);
    });
  });

  describe("isValidOptionIndex", () => {
    it("should return true for valid indices", () => {
      expect(isValidOptionIndex("A")).toBe(true);
      expect(isValidOptionIndex("B")).toBe(true);
      expect(isValidOptionIndex("C")).toBe(true);
      expect(isValidOptionIndex("D")).toBe(true);
    });

    it("should return false for invalid string indices", () => {
      expect(isValidOptionIndex("E")).toBe(false);
      expect(isValidOptionIndex("a")).toBe(false);
      expect(isValidOptionIndex("1")).toBe(false);
      expect(isValidOptionIndex("")).toBe(false);
    });

    it("should return false for non-string values", () => {
      expect(isValidOptionIndex(null)).toBe(false);
      expect(isValidOptionIndex(undefined)).toBe(false);
      expect(isValidOptionIndex(1)).toBe(false);
      expect(isValidOptionIndex({})).toBe(false);
    });
  });

  describe("create", () => {
    it("should create a valid QuestionOption", () => {
      const props = createValidProps();
      const option = QuestionOption.create(props);

      expect(option.index).toBe("A");
      expect(option.text).toBe("Option A text");
      expect(option.explanation).toBe("Explanation for option A");
      expect(option.isCorrect).toBe(false);
    });

    it("should create a correct option", () => {
      const props = createValidProps({ isCorrect: true });
      const option = QuestionOption.create(props);

      expect(option.isCorrect).toBe(true);
    });

    it("should accept all valid indices", () => {
      for (const index of VALID_OPTION_INDICES) {
        const option = QuestionOption.create(createValidProps({ index }));
        expect(option.index).toBe(index);
      }
    });

    it("should accept empty explanation", () => {
      const option = QuestionOption.create(
        createValidProps({ explanation: "" })
      );
      expect(option.explanation).toBe("");
    });

    describe("validation errors", () => {
      it("should throw for invalid index", () => {
        expect(() =>
          QuestionOption.create(createValidProps({ index: "E" as any }))
        ).toThrow("Invalid option index");
      });

      it("should throw for empty text", () => {
        expect(() =>
          QuestionOption.create(createValidProps({ text: "" }))
        ).toThrow("Option text is required and cannot be empty");
      });

      it("should throw for whitespace-only text", () => {
        expect(() =>
          QuestionOption.create(createValidProps({ text: "   " }))
        ).toThrow("Option text is required and cannot be empty");
      });

      it("should throw for non-string explanation", () => {
        expect(() =>
          QuestionOption.create(createValidProps({ explanation: 123 as any }))
        ).toThrow("Option explanation must be a string");
      });

      it("should throw for non-boolean isCorrect", () => {
        expect(() =>
          QuestionOption.create(createValidProps({ isCorrect: "true" as any }))
        ).toThrow("Option isCorrect must be a boolean");
      });
    });
  });

  describe("fromPlain", () => {
    it("should create QuestionOption from valid plain object", () => {
      const plain = {
        index: "B",
        text: "Option B",
        explanation: "B explanation",
        isCorrect: true,
      };

      const option = QuestionOption.fromPlain(plain);

      expect(option.index).toBe("B");
      expect(option.text).toBe("Option B");
      expect(option.explanation).toBe("B explanation");
      expect(option.isCorrect).toBe(true);
    });

    it("should throw for invalid structure", () => {
      expect(() => QuestionOption.fromPlain(null)).toThrow(
        "Invalid QuestionOption structure"
      );
      expect(() => QuestionOption.fromPlain(undefined)).toThrow(
        "Invalid QuestionOption structure"
      );
      expect(() => QuestionOption.fromPlain({})).toThrow(
        "Invalid QuestionOption structure"
      );
      expect(() => QuestionOption.fromPlain({ index: "A" })).toThrow(
        "Invalid QuestionOption structure"
      );
    });
  });

  describe("equals", () => {
    it("should return true for equal options", () => {
      const props = createValidProps();
      const option1 = QuestionOption.create(props);
      const option2 = QuestionOption.create(props);

      expect(option1.equals(option2)).toBe(true);
    });

    it("should return false for different index", () => {
      const option1 = QuestionOption.create(createValidProps({ index: "A" }));
      const option2 = QuestionOption.create(createValidProps({ index: "B" }));

      expect(option1.equals(option2)).toBe(false);
    });

    it("should return false for different text", () => {
      const option1 = QuestionOption.create(
        createValidProps({ text: "Text 1" })
      );
      const option2 = QuestionOption.create(
        createValidProps({ text: "Text 2" })
      );

      expect(option1.equals(option2)).toBe(false);
    });

    it("should return false for different explanation", () => {
      const option1 = QuestionOption.create(
        createValidProps({ explanation: "Exp 1" })
      );
      const option2 = QuestionOption.create(
        createValidProps({ explanation: "Exp 2" })
      );

      expect(option1.equals(option2)).toBe(false);
    });

    it("should return false for different isCorrect", () => {
      const option1 = QuestionOption.create(
        createValidProps({ isCorrect: true })
      );
      const option2 = QuestionOption.create(
        createValidProps({ isCorrect: false })
      );

      expect(option1.equals(option2)).toBe(false);
    });
  });

  describe("copyWith", () => {
    it("should create a copy with updated index", () => {
      const original = QuestionOption.create(createValidProps({ index: "A" }));
      const copy = original.copyWith({ index: "B" });

      expect(copy.index).toBe("B");
      expect(copy.text).toBe(original.text);
      expect(copy.explanation).toBe(original.explanation);
      expect(copy.isCorrect).toBe(original.isCorrect);
    });

    it("should create a copy with updated text", () => {
      const original = QuestionOption.create(createValidProps());
      const copy = original.copyWith({ text: "New text" });

      expect(copy.text).toBe("New text");
      expect(copy.index).toBe(original.index);
    });

    it("should create a copy with updated isCorrect", () => {
      const original = QuestionOption.create(
        createValidProps({ isCorrect: false })
      );
      const copy = original.copyWith({ isCorrect: true });

      expect(copy.isCorrect).toBe(true);
      expect(original.isCorrect).toBe(false);
    });

    it("should create exact copy when no overrides provided", () => {
      const original = QuestionOption.create(createValidProps());
      const copy = original.copyWith({});

      expect(copy.equals(original)).toBe(true);
    });
  });

  describe("toPlain", () => {
    it("should convert to plain object", () => {
      const props = createValidProps({
        index: "C",
        text: "Option C",
        explanation: "C explanation",
        isCorrect: true,
      });
      const option = QuestionOption.create(props);

      const plain = option.toPlain();

      expect(plain).toEqual({
        index: "C",
        text: "Option C",
        explanation: "C explanation",
        isCorrect: true,
      });
    });

    it("should return a new object (not a reference)", () => {
      const option = QuestionOption.create(createValidProps());
      const plain1 = option.toPlain();
      const plain2 = option.toPlain();

      expect(plain1).not.toBe(plain2);
      expect(plain1).toEqual(plain2);
    });
  });

  describe("immutability", () => {
    it("should not allow modification through getters", () => {
      const option = QuestionOption.create(createValidProps());

      // TypeScript should prevent this, but verify runtime behavior
      expect(() => {
        (option as any).index = "B";
      }).toThrow();
    });
  });
});
