import { createPartFromUri, GoogleGenAI, Type } from "@google/genai";
import type {
  IAIQuizGenerator,
  GenerateQuizParams,
  StreamGenerateQuizParams,
  GeneratedQuestionData,
  FileMetadata,
} from "@/application";
import { AIModel } from "@/application";
import {
  GeminiModel,
  QuestionType,
  type OptionIndex,
  type QuestionPreview,
} from "@/domain";
import z from "zod/v3";
import zodToJsonSchema from "zod-to-json-schema";
import { parse as parsePartialJson } from "partial-json";

/**
 * Maps Application-layer AIModel to vendor-specific GeminiModel identifiers.
 * This keeps vendor details in the Infrastructure layer.
 */
function mapAIModelToGeminiModel(model: AIModel): GeminiModel {
  switch (model) {
    case AIModel.PREVIEW:
      return GeminiModel.FLASH_3_0;
    case AIModel.PRIMARY:
      return GeminiModel.FLASH_2_5;
    case AIModel.LITE:
      return GeminiModel.FLASH_2_5_LITE;
    default:
      return GeminiModel.FLASH_2_5;
  }
}

/**
 * Zod schema for structured output validation
 * Defines the expected JSON structure from Gemini API
 */
const questionSchema = z.array(
  z.object({
    orderIndex: z
      .number()
      .int()
      .nonnegative()
      .describe("The question's position in the quiz (0-based)."),
    type: z
      .enum(["direct_question", "two_statement_compound", "contextual"])
      .describe("The MCQ variant type."),
    stem: z.string().describe("The prompt/lead-in."),

    options: z
      .array(
        z.object({
          index: z.enum(["A", "B", "C", "D"]),
          text: z.string().describe("Option text shown to me."),
          isCorrect: z.boolean().describe("Whether this option is correct."),
          errorRationale: z
            .string()
            .optional()
            .describe(
              "**REQUIRED IF** this option is incorrect, otherwise **OMIT**. " +
                "Feedback for this incorrect option. **Independent Clause/s**"
            ),
        })
      )
      .length(4),

    correctExplanation: z
      .string()
      .describe("Why the correct answer is correct."),
    sourceQuote: z
      .string()
      .describe(
        "**Verbatim** evidence from the source material; " +
          "word-for-word copy of the sentence in the source material that supports the claim in 'correctExplanation'."
      ),
    reference: z
      .number()
      .int()
      .nonnegative()
      .describe(
        "The exact source material reference where the 'sourceQuote' originated."
      ),
  })
);

/**
 * Error class for quota exceeded errors
 */
export class QuotaExceededError extends Error {
  constructor(model: string) {
    super(`Quota exceeded for model: ${model}`);
    this.name = "QuotaExceededError";
  }
}

/**
 * Gemini AI Quiz Generator Service
 *
 * Implements the IAIQuizGenerator port using Google Gemini API.
 * Features automatic fallback from primary model to lite model on quota errors.
 */
export class GeminiQuizGeneratorService implements IAIQuizGenerator {
  private readonly client: GoogleGenAI;
  private readonly primaryGeminiModel = GeminiModel.FLASH_3_0;
  private readonly fallbackGeminiModel = GeminiModel.FLASH_2_5;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("fGOOGLE_AI_API_KEY environment variable is required");
    }
    this.client = new GoogleGenAI({ apiKey });
  }

  /**
   * Generates quiz questions from uploaded files using AI
   * Implements fallback logic: tries primary model first, falls back to lite on quota error
   */
  async generateQuestions(
    params: GenerateQuizParams
  ): Promise<GeneratedQuestionData[]> {
    const geminiModel = mapAIModelToGeminiModel(params.model);
    try {
      return await this.generateWithModel(geminiModel, params);
    } catch (error) {
      if (this.isQuotaError(error)) {
        console.warn(
          `Quota exceeded for ${geminiModel}, falling back to ${this.fallbackGeminiModel}`
        );
        return await this.generateWithModel(this.fallbackGeminiModel, params);
      }
      throw error;
    }
  }

  /**
   * Generates quiz questions with streaming progress updates
   * Implements fallback logic: tries primary model first, falls back to lite on quota error
   */
  async generateQuestionsStream(
    params: StreamGenerateQuizParams
  ): Promise<GeneratedQuestionData[]> {
    const geminiModel = mapAIModelToGeminiModel(params.model);
    try {
      return await this.generateWithModelStream(geminiModel, params);
    } catch (error) {
      if (this.isQuotaError(error)) {
        console.warn(
          `Quota exceeded for ${geminiModel}, falling back to ${this.fallbackGeminiModel}`
        );
        return await this.generateWithModelStream(
          this.fallbackGeminiModel,
          params
        );
      }
      throw error;
    }
  }

  /**
   * Validates if the specified model has available quota
   * Makes a minimal request to check availability
   */
  async validateQuota(model: AIModel): Promise<boolean> {
    const geminiModel = mapAIModelToGeminiModel(model);
    try {
      const response = await this.client.models.generateContent({
        model: geminiModel,
        contents: "Hello",
        config: {
          maxOutputTokens: 1,
        },
      });
      return !!response;
    } catch (error) {
      if (this.isQuotaError(error)) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Generates questions using a specific model
   */
  private async generateWithModel(
    model: GeminiModel,
    params: GenerateQuizParams
  ): Promise<GeneratedQuestionData[]> {
    const { files, distribution } = params;

    const prompt = this.buildPrompt(distribution);
    const fileContents = files.flatMap((file: FileMetadata, idx: number) => [
      { text: `[Source Material Ref: ${idx}]` },
      createPartFromUri(file.uri!, file.mimeType!),
    ]);

    console.log(await this.client.models.list());

    const response = await this.client.models.generateContent({
      model,
      contents: [{ text: prompt }, ...fileContents],
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: zodToJsonSchema(questionSchema),
        systemInstruction: [
          "You are an expert source-grounded MCQ item writer.",
          "Your generic goal is to create high-quality multiple-choice questions strictly based on the provided source materials.",
          "**Strict Rules**:",
          "1. **No Hallucinations**: You must ONLY use facts present in the provided source materials. If a fact is not in the text, do not use it.",
          "2. **Verbatim Quotes**: The 'sourceQuote' field must be an EXACT copy-paste of a sentence from the material. Do not paraphrase.",
          '3. **Tricky Distractors**: Wrong options (distractors) should be plausible to a novice but clearly wrong to an expert. Avoid "silly" options.',
          "4. **Reference Integrity**: When citing the 'reference', use the exact filename provided in the '[Source Material Ref: ...]' labels.",
          "5. **Balanced Answer Key**: Distribute correct answers evenly among options A, B, C, and D across the entire set of questions.",
          "6. **Original Wording**: Use original wording faithful to the source materials. Do not copy large chunks verbatim except for 'sourceQuote'.",
          "7. **No Source Mentions**: You must not mention/cite/refer to source materials in the question stems, options, or feedbacks. e.g., do not say '... according to the text ...', '... according to the material ...', '... according to the document ...', '... based on the text ...', '... based on the material ...', '... based on the document ...', etc. ",
          "8. **Single Line Source Quote**: The 'sourceQuote' must only have one line and can have multiple sentences.",
          "9. **Consistent Phrasing**: Use identical transition phrases across ALL feedbacks. Choose ONE phrase pattern and use it everywhere.",
          '10. **No Cross-References**: No cross-references between options ("Unlike B...", "Option C...")',
          "11. **Emphasis**: You MAY add emphasis for key terms using **bold**, *italics*, and `code` formatting, but use sparingly. Do NOT use bold emphasis in question stems and option texts.",
        ].join("\n"),
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from Gemini API");
    }

    const parsed = JSON.parse(text) as GeneratedQuestionData[];
    return this.validateAndTransform(parsed);
  }

  /**
   * Generates questions using a specific model with streaming
   * Parses JSON progressively and calls onProgress callback
   */
  private async generateWithModelStream(
    model: GeminiModel,
    params: StreamGenerateQuizParams
  ): Promise<GeneratedQuestionData[]> {
    const { files, distribution, onProgress } = params;

    const prompt = this.buildPrompt(distribution);
    const fileContents = files.flatMap((file: FileMetadata, idx: number) => [
      { text: `[Source Material Ref: ${idx}]` },
      createPartFromUri(file.uri!, file.mimeType!),
    ]);

    const systemInstruction = [
      "You are an expert source-grounded MCQ item writer.",
      "Your generic goal is to create high-quality multiple-choice questions strictly based on the provided source materials.",
      "**Strict Rules**:",
      "1. **No Hallucinations**: You must ONLY use facts present in the provided source materials. If a fact is not in the text, do not use it.",
      "2. **Verbatim Quotes**: The 'sourceQuote' field must be an EXACT copy-paste of a sentence from the material. Do not paraphrase.",
      '3. **Tricky Distractors**: Wrong options (distractors) should be plausible to a novice but clearly wrong to an expert. Avoid "silly" options.',
      "4. **Reference Integrity**: When citing the 'reference', use the exact filename provided in the '[Source Material Ref: ...]' labels.",
      "5. **Balanced Answer Key**: Distribute correct answers evenly among options A, B, C, and D across the entire set of questions.",
      "6. **Original Wording**: Use original wording faithful to the source materials. Do not copy large chunks verbatim except for 'sourceQuote'.",
      "7. **No Source Mentions**: You must not mention/cite/refer to source materials in the question stems, options, or feedbacks. e.g., do not say '... according to the text ...', '... according to the material ...', '... according to the document ...', '... based on the text ...', '... based on the material ...', '... based on the document ...', etc. ",
      "8. **Single Line Source Quote**: The 'sourceQuote' must only have one line and can have multiple sentences.",
      "9. **Consistent Phrasing**: Use identical transition phrases across ALL feedbacks. Choose ONE phrase pattern and use it everywhere.",
      '10. **No Cross-References**: No cross-references between options ("Unlike B...", "Option C...")',
      "11. **Emphasis**: You MAY add emphasis for key terms using **bold**, *italics*, and `code` formatting, but use sparingly. Do NOT use bold emphasis in question stems and option texts.",
    ].join("\n");

    console.log("Generating...");

    // Use streaming API
    const stream = await this.client.models.generateContentStream({
      model,
      contents: [{ text: prompt }, ...fileContents],
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: zodToJsonSchema(questionSchema),
        systemInstruction,
      },
    });

    let fullText = "";
    let lastParsedCount = 0;

    // Process the stream
    for await (const chunk of stream) {
      const chunkText = chunk.text ?? "";
      fullText += chunkText;

      // Try to parse complete questions from the accumulated text
      if (onProgress) {
        const parsedQuestions = this.tryParsePartialQuestions(fullText);
        if (parsedQuestions.length > lastParsedCount) {
          lastParsedCount = parsedQuestions.length;
          const previews: QuestionPreview[] = parsedQuestions.map((q) => ({
            orderIndex: q.orderIndex,
            type: q.type,
            stem: q.stem,
          }));
          onProgress({
            questionsGenerated: parsedQuestions.length,
            questions: previews,
          });
        }
      }
    }

    if (!fullText) {
      throw new Error("Empty response from Gemini API");
    }

    const parsed = JSON.parse(fullText) as GeneratedQuestionData[];
    return this.validateAndTransform(parsed);
  }

  /**
   * Attempts to parse complete question objects from partial JSON
   * Returns only fully parsed questions (excludes incomplete last element)
   */
  private tryParsePartialQuestions(text: string): GeneratedQuestionData[] {
    try {
      // Try to parse as complete JSON array first
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return [];
    } catch {
      // JSON is incomplete, use partial-json parser
      try {
        const parsed = parsePartialJson(text);
        if (!Array.isArray(parsed) || parsed.length === 0) {
          return [];
        }

        // Check if the last element is complete by verifying required fields
        const completeQuestions: GeneratedQuestionData[] = [];
        for (const q of parsed) {
          if (this.isCompleteQuestion(q)) {
            completeQuestions.push(q);
          }
        }

        return completeQuestions;
      } catch {
        return [];
      }
    }
  }

  /**
   * Checks if a parsed question object has all required fields
   */
  private isCompleteQuestion(q: unknown): q is GeneratedQuestionData {
    if (!q || typeof q !== "object") return false;
    const obj = q as Record<string, unknown>;
    return (
      typeof obj.orderIndex === "number" &&
      typeof obj.type === "string" &&
      typeof obj.stem === "string" &&
      Array.isArray(obj.options) &&
      obj.options.length === 4 &&
      typeof obj.correctExplanation === "string" &&
      typeof obj.sourceQuote === "string" &&
      typeof obj.reference === "number"
    );
  }

  /**
   * Builds the prompt for question generation
   */
  private buildPrompt(distribution: {
    directQuestion: number;
    twoStatementCompound: number;
    contextual: number;
  }): string {
    const totalQuestions =
      distribution.directQuestion +
      distribution.twoStatementCompound +
      distribution.contextual;

    const lazyNumbering = (start: number, count: number) => {
      return count > 1 ? `Q${start}-Q${start + count - 1}` : `Q${start}`;
    };

    const hasDirectQuestion = distribution.directQuestion > 0;
    const hasTwoStatementCompound = distribution.twoStatementCompound > 0;
    const hasContextual = distribution.contextual > 0;

    const directQuestionLazyNumber = lazyNumbering(
      1,
      distribution.directQuestion
    );
    const twoStatementCompoundLazyNumber = lazyNumbering(
      1 + distribution.directQuestion,
      distribution.twoStatementCompound
    );
    const contextualLazyNumber = lazyNumbering(
      1 + distribution.directQuestion + distribution.twoStatementCompound,
      distribution.contextual
    );

    const prompt = `
Your specific goal is to create ${totalQuestions} questions distributed as follows.

---
${
  hasDirectQuestion
    ? `
## Direct Question (${directQuestionLazyNumber})
Standard MCQ item.

---\n`
    : ""
}${
      hasTwoStatementCompound
        ? `
## Two-Statement Compound (${twoStatementCompoundLazyNumber})

### Statement Requirements
- One declarative sentence, one main idea each
- Must be unequivocally T/F based on HANDOUTS
- Avoid vague wording, double negatives
- No labels (e.g., "Statement 1", "first statement")

### Options (FIXED TEXT — do not paraphrase)
\`\`\`
A) Only Statement 1 is true.
B) Only Statement 2 is true.
C) Both statements are true.
D) Neither statement is true.
\`\`\`

---\n`
        : ""
    }${
      hasContextual
        ? `
## Contextual (${contextualLazyNumber})

### Requirements
- Scenario details (roles, numbers, constraints) MUST be from HANDOUTS
- Include ONLY details needed to answer
- Remove decorative backstory/names
- Provide all facts in stem
- Keep options short and homogeneous

---\n`
        : ""
    }`;

    return prompt.trim();
  }

  /**
   * Validates and transforms the parsed response
   */
  private validateAndTransform(
    data: GeneratedQuestionData[]
  ): GeneratedQuestionData[] {
    return data.map((q: GeneratedQuestionData, index: number) => ({
      orderIndex: q.orderIndex ?? index,
      type: q.type as QuestionType,
      stem: q.stem,
      options: q.options.map(
        (opt: GeneratedQuestionData["options"][number]) => ({
          index: opt.index as OptionIndex,
          text: opt.text,
          isCorrect: opt.isCorrect,
          errorRationale: opt.errorRationale,
        })
      ),
      correctExplanation: q.correctExplanation,
      sourceQuote: q.sourceQuote,
      reference: q.reference,
    }));
  }

  /**
   * Checks if an error is a quota exceeded error
   */
  private isQuotaError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes("quota") ||
        message.includes("rate limit") ||
        message.includes("resource exhausted") ||
        message.includes("429")
      );
    }
    return false;
  }
}
