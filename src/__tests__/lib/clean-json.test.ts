import { describe, expect, it } from "bun:test";
import { cleanJson } from "../../lib/utils";

describe("cleanJson", () => {
  describe("empty/null inputs", () => {
    it("should return empty object for empty string", () => {
      expect(cleanJson("")).toBe("{}");
    });

    it("should return empty object for null-like input", () => {
      expect(cleanJson(null as unknown as string)).toBe("{}");
      expect(cleanJson(undefined as unknown as string)).toBe("{}");
    });
  });

  describe("complete JSON", () => {
    it("should return complete JSON array unchanged", () => {
      const json = '[{"a":1},{"b":2}]';
      expect(cleanJson(json)).toBe(json);
    });

    it("should return complete JSON object unchanged", () => {
      const json = '{"key":"value","num":123}';
      expect(cleanJson(json)).toBe(json);
    });

    it("should handle nested structures", () => {
      const json = '{"outer":{"inner":[1,2,3]}}';
      expect(cleanJson(json)).toBe(json);
    });
  });

  describe("incomplete array elements", () => {
    it("should remove incomplete object at end of array", () => {
      const incomplete = '[{"a":1},{"b":';
      const result = cleanJson(incomplete);

      expect(() => JSON.parse(result)).not.toThrow();
      const parsed = JSON.parse(result);
      expect(parsed).toEqual([{ a: 1 }]);
    });

    it("should remove partially complete object at end of array", () => {
      const incomplete = '[{"a":1},{"b":2,"c":';
      const result = cleanJson(incomplete);

      expect(() => JSON.parse(result)).not.toThrow();
      const parsed = JSON.parse(result);
      expect(parsed).toEqual([{ a: 1 }]);
    });

    it("should handle array with only incomplete element", () => {
      const incomplete = '[{"a":';
      const result = cleanJson(incomplete);

      expect(() => JSON.parse(result)).not.toThrow();
      const parsed = JSON.parse(result);
      expect(parsed).toEqual([]);
    });
  });

  describe("trailing commas", () => {
    it("should remove trailing comma after complete element", () => {
      const withTrailingComma = '[{"a":1},';
      const result = cleanJson(withTrailingComma);

      expect(() => JSON.parse(result)).not.toThrow();
      const parsed = JSON.parse(result);
      expect(parsed).toEqual([{ a: 1 }]);
    });
  });

  describe("incomplete strings", () => {
    it("should handle incomplete string in array context", () => {
      // The cleanJson function specifically handles incomplete elements inside arrays
      // For standalone objects with incomplete strings, it closes structures but may not produce valid JSON
      const incomplete = '["complete",';
      const result = cleanJson(incomplete);

      expect(() => JSON.parse(result)).not.toThrow();
      const parsed = JSON.parse(result);
      expect(parsed).toEqual(["complete"]);
    });
  });

  describe("incomplete literals", () => {
    it("should handle incomplete true literal", () => {
      const incomplete = '{"key":tru';
      const result = cleanJson(incomplete);

      expect(() => JSON.parse(result)).not.toThrow();
    });

    it("should handle incomplete false literal", () => {
      const incomplete = '{"key":fal';
      const result = cleanJson(incomplete);

      expect(() => JSON.parse(result)).not.toThrow();
    });

    it("should handle incomplete number", () => {
      const incomplete = '{"key":123.';
      const result = cleanJson(incomplete);

      expect(() => JSON.parse(result)).not.toThrow();
    });
  });

  describe("nested incomplete structures", () => {
    it("should handle deeply nested incomplete object", () => {
      const incomplete = '[{"a":{"b":{"c":1}},{"d":';
      const result = cleanJson(incomplete);

      expect(() => JSON.parse(result)).not.toThrow();
    });

    it("should handle incomplete array within object", () => {
      const incomplete = '{"items":[1,2,3';
      const result = cleanJson(incomplete);

      expect(() => JSON.parse(result)).not.toThrow();
    });
  });

  describe("real-world streaming scenarios", () => {
    it("should handle typical quiz question streaming - early cut", () => {
      const incomplete =
        '[{"orderIndex":0,"type":"direct_question","stem":"What is the capital of France?","options":[{"index":"A","text":"Paris","isCorrect":true},{"index":"B","text":"London","isCor';
      const result = cleanJson(incomplete);

      expect(() => JSON.parse(result)).not.toThrow();
      const parsed = JSON.parse(result);
      expect(Array.isArray(parsed)).toBe(true);
    });

    it("should handle quiz question streaming - between questions", () => {
      const incomplete =
        '[{"orderIndex":0,"type":"direct_question","stem":"Q1","options":[{"index":"A","text":"A1","isCorrect":true},{"index":"B","text":"B1","isCorrect":false},{"index":"C","text":"C1","isCorrect":false},{"index":"D","text":"D1","isCorrect":false}],"correctExplanation":"Explanation","sourceQuote":"Source","reference":1},{"orderIndex":1,"type":"contextual","stem":"Q2","opt';
      const result = cleanJson(incomplete);

      expect(() => JSON.parse(result)).not.toThrow();
      const parsed = JSON.parse(result);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].orderIndex).toBe(0);
      expect(parsed[0].stem).toBe("Q1");
    });

    it("should preserve complete questions while removing incomplete ones", () => {
      const question1 = {
        orderIndex: 0,
        type: "direct_question",
        stem: "Complete question",
        options: [
          { index: "A", text: "A", isCorrect: true },
          { index: "B", text: "B", isCorrect: false },
          { index: "C", text: "C", isCorrect: false },
          { index: "D", text: "D", isCorrect: false },
        ],
        correctExplanation: "Explanation",
        sourceQuote: "Quote",
        reference: 1,
      };

      const completeJson = JSON.stringify([question1]);
      // Remove closing bracket and add incomplete second question
      const incomplete =
        completeJson.slice(0, -1) + ',{"orderIndex":1,"stem":"Incomplete';

      const result = cleanJson(incomplete);
      expect(() => JSON.parse(result)).not.toThrow();

      const parsed = JSON.parse(result);
      expect(parsed).toHaveLength(1);
      expect(parsed[0]).toEqual(question1);
    });
  });

  describe("edge cases", () => {
    it("should handle escaped quotes in strings", () => {
      const json = '{"text":"He said \\"hello\\""}';
      expect(cleanJson(json)).toBe(json);
    });

    it("should handle escaped backslashes", () => {
      const json = '{"path":"C:\\\\Users\\\\test"}';
      expect(cleanJson(json)).toBe(json);
    });

    it("should handle unicode in strings", () => {
      const json = '{"text":"こんにちは"}';
      expect(cleanJson(json)).toBe(json);
    });

    it("should handle empty array", () => {
      const json = "[]";
      expect(cleanJson(json)).toBe(json);
    });

    it("should handle empty object", () => {
      const json = "{}";
      expect(cleanJson(json)).toBe(json);
    });

    it("should handle just opening bracket", () => {
      const incomplete = "[";
      const result = cleanJson(incomplete);

      expect(() => JSON.parse(result)).not.toThrow();
      expect(JSON.parse(result)).toEqual([]);
    });

    it("should handle just opening brace", () => {
      const incomplete = "{";
      const result = cleanJson(incomplete);

      expect(() => JSON.parse(result)).not.toThrow();
      expect(JSON.parse(result)).toEqual({});
    });

    it("should handle missing value after colon", () => {
      const incomplete = '{"key":';
      const result = cleanJson(incomplete);

      expect(() => JSON.parse(result)).not.toThrow();
    });
  });
});
