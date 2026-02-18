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
                "Feedback for this incorrect option. **Independent Clause/s**",
            ),
        }),
      )
      .length(4),

    correctExplanation: z
      .string()
      .describe("Why the correct answer is correct."),
    sourceQuotes: z
      .array(z.string())
      .describe(
        "**Verbatim** evidence from the source material; " +
          "word-for-word copies of sentences in the source material that support the claim in 'correctExplanation'.",
      ),
    reference: z
      .number()
      .int()
      .nonnegative()
      .describe(
        "The exact source material reference where the 'sourceQuotes' originated (0-based index).",
      ),
  }),
);

/**
 * Reason for AI generation failure
 */
export type AIGenerationErrorReason =
  | "quota"
  | "timeout"
  | "unavailable"
  | "unknown";

/**
 * Error class for AI generation failures
 * Includes a reason field to distinguish between quota, timeout, and other errors
 */
export class AIGenerationError extends Error {
  public readonly reason: AIGenerationErrorReason;
  public readonly model: string;

  constructor(
    model: string,
    reason: AIGenerationErrorReason,
    originalMessage?: string,
  ) {
    const reasonMessages: Record<AIGenerationErrorReason, string> = {
      quota: "Quota exceeded",
      timeout: "Request timed out (DEADLINE_EXCEEDED)",
      unavailable: "Service unavailable (503)",
      unknown: "Generation failed",
    };
    const message = `${reasonMessages[reason]} for model: ${model}${originalMessage ? ` - ${originalMessage}` : ""}`;
    super(message);
    this.name = "AIGenerationError";
    this.reason = reason;
    this.model = model;
  }
}

/**
 * Gemini AI Quiz Generator Service
 *
 * Implements the IAIQuizGenerator port using Google Gemini API.
 * Throws AIGenerationError on quota or timeout errors for application-layer handling.
 */
export class GeminiQuizGeneratorService implements IAIQuizGenerator {
  private readonly client: GoogleGenAI;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("GOOGLE_AI_API_KEY environment variable is required");
    }
    this.client = new GoogleGenAI({ apiKey });
  }

  /**
   * Generates quiz questions from uploaded files using AI
   * Throws AIGenerationError on quota or timeout errors
   */
  async generateQuestions(
    params: GenerateQuizParams,
  ): Promise<GeneratedQuestionData[]> {
    const geminiModel = mapAIModelToGeminiModel(params.model);
    return await this.generateWithModel(geminiModel, params);
  }

  /**
   * Generates quiz questions with streaming progress updates
   * Throws AIGenerationError on quota or timeout errors
   */
  async generateQuestionsStream(
    params: StreamGenerateQuizParams,
  ): Promise<GeneratedQuestionData[]> {
    const geminiModel = mapAIModelToGeminiModel(params.model);
    return await this.generateWithModelStream(geminiModel, params);
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
      const errorReason = this.detectErrorReason(error);
      if (errorReason === "quota" || errorReason === "timeout") {
        return false;
      }
      throw error;
    }
  }

  /**
   * Generates questions using a specific model
   * Throws AIGenerationError on quota or timeout errors
   */
  private async generateWithModel(
    model: GeminiModel,
    params: GenerateQuizParams,
  ): Promise<GeneratedQuestionData[]> {
    const { files, distribution } = params;

    const prompt = this.buildPrompt(distribution);
    const fileContents = files.flatMap((file: FileMetadata, idx: number) => [
      { text: `[Source Material Ref: ${idx}]` },
      createPartFromUri(file.uri!, file.mimeType!),
    ]);

    let response;
    try {
      response = await this.client.models.generateContent({
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
            "2. **Verbatim Quotes**: The 'sourceQuotes' field must contain EXACT copy-paste sentences from the material. Do not paraphrase.",
            '3. **Tricky Distractors**: Wrong options (distractors) should be plausible to a novice but clearly wrong to an expert. Avoid "silly" options.',
            "4. **Reference Integrity**: When citing the 'reference', use the exact filename provided in the '[Source Material Ref: ...]' labels.",
            "5. **Balanced Answer Key**: Distribute correct answers evenly among options A, B, C, and D across the entire set of questions.",
            "6. **Original Wording**: Use original wording faithful to the source materials. Do not copy large chunks verbatim except for 'sourceQuotes'.",
            "7. **No Source Mentions**: You must not mention/cite/refer to source materials in the question stems, options, or feedbacks. e.g., do not say '... according to the text ...', '... according to the material ...', '... according to the document ...', '... based on the text ...', '... based on the material ...', '... based on the document ...', etc. ",
            "8. **Source Quotes Array**: Each entry in 'sourceQuotes' must be a single verbatim sentence from the source material.",
            "9. **Consistent Phrasing**: Use identical transition phrases across ALL feedbacks. Choose ONE phrase pattern and use it everywhere.",
            '10. **No Cross-References**: No cross-references between options ("Unlike B...", "Option C...")',
            "11. **Emphasis**: You MAY add emphasis for key terms using **bold**, *italics*, and `code` formatting, but use sparingly. Do NOT use bold emphasis in question stems and option texts.",
          ].join("\n"),
        },
      });
    } catch (error) {
      this.handleGenerationError(error, model);
    }

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
    params: StreamGenerateQuizParams,
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
      "2. **Verbatim Quotes**: The 'sourceQuotes' field must contain EXACT copy-paste sentences from the material. Do not paraphrase.",
      '3. **Tricky Distractors**: Wrong options (distractors) should be plausible to a novice but clearly wrong to an expert. Avoid "silly" options.',
      "4. **Reference Integrity**: When citing the 'reference', use the exact filename provided in the '[Source Material Ref: ...]' labels.",
      "5. **Balanced Answer Key**: Distribute correct answers evenly among options A, B, C, and D across the entire set of questions.",
      "6. **Original Wording**: Use original wording faithful to the source materials. Do not copy large chunks verbatim except for 'sourceQuotes'.",
      "7. **No Source Mentions**: You must not mention/cite/refer to source materials in the question stems, options, or feedbacks. e.g., do not say '... according to the text ...', '... according to the material ...', '... according to the document ...', '... based on the text ...', '... based on the material ...', '... based on the document ...', etc. ",
      "8. **Source Quotes Array**: Each entry in 'sourceQuotes' must be a single verbatim sentence from the source material.",
      "9. **Consistent Phrasing**: Use identical transition phrases across ALL feedbacks. Choose ONE phrase pattern and use it everywhere.",
      '10. **No Cross-References**: No cross-references between options ("Unlike B...", "Option C...")',
      "11. **Emphasis**: You MAY add emphasis for key terms using **bold**, *italics*, and `code` formatting, but use sparingly. Do NOT use bold emphasis in question stems and option texts.",
    ].join("\n");

    console.log("Generating...");

    // Use streaming API
    let stream;
    try {
      stream = await this.client.models.generateContentStream({
        model,
        contents: [{ text: prompt }, ...fileContents],
        config: {
          responseMimeType: "application/json",
          responseJsonSchema: zodToJsonSchema(questionSchema),
          systemInstruction,
        },
      });
    } catch (error) {
      this.handleGenerationError(error, model);
    }

    let fullText = "";
    let lastParsedCount = 0;

    // Process the stream
    try {
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
    } catch (error) {
      this.handleGenerationError(error, model);
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
      Array.isArray(obj.sourceQuotes) &&
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
      distribution.directQuestion,
    );
    const twoStatementCompoundLazyNumber = lazyNumbering(
      1 + distribution.directQuestion,
      distribution.twoStatementCompound,
    );
    const contextualLazyNumber = lazyNumbering(
      1 + distribution.directQuestion + distribution.twoStatementCompound,
      distribution.contextual,
    );

    const prompt = `
Your specific goal is to create ${totalQuestions} questions distributed as follows.
(\`orderIndex\` should start at 0 for the first question, and end at ${totalQuestions - 1} for the last question.)

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


### Stem (Format)
The stem MUST present BOTH statements together as follows (separated by \`\\n\`):
\`\`\`
{
  ...
  "stem": "Statement 1: [Statement 1 text].\\nStatement 2: [Statement 2 text].",
  ...
}
\`\`\`

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
    data: GeneratedQuestionData[],
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
        }),
      ),
      correctExplanation: q.correctExplanation,
      sourceQuotes: q.sourceQuotes,
      reference: q.reference,
    }));
  }

  /**
   * Detects the type of error from the Gemini API response
   * Uses HTTP status codes from ApiError when available for reliable detection
   * @returns The error reason: 'quota', 'timeout', 'unavailable', or 'unknown'
   */
  private detectErrorReason(error: unknown): AIGenerationErrorReason {
    if (!(error instanceof Error)) {
      return "unknown";
    }

    // Check for status code on ApiError (from @google/genai SDK)
    // The SDK throws ApiError with a 'status' property containing HTTP status code
    const status = (error as { status?: number }).status;

    if (status !== undefined) {
      // 429: RESOURCE_EXHAUSTED - Rate limit/quota exceeded
      if (status === 429) {
        return "quota";
      }

      // 504: DEADLINE_EXCEEDED - Request timed out
      if (status === 504) {
        return "timeout";
      }

      // 503: UNAVAILABLE - Service temporarily overloaded or down
      if (status === 503) {
        return "unavailable";
      }
    }

    // Check error name for SDK-specific error types
    // APIConnectionTimeoutError is thrown for client-side timeouts
    if (error.name === "APIConnectionTimeoutError") {
      return "timeout";
    }

    // RateLimitError is thrown for 429 responses
    if (error.name === "RateLimitError") {
      return "quota";
    }

    // Fallback: check message for common patterns (legacy/edge cases)
    const message = error.message.toLowerCase();

    if (
      message.includes("quota") ||
      message.includes("rate limit") ||
      message.includes("resource_exhausted") ||
      message.includes("resource exhausted")
    ) {
      return "quota";
    }

    if (
      message.includes("deadline_exceeded") ||
      message.includes("deadline exceeded") ||
      message.includes("timeout") ||
      message.includes("timed out")
    ) {
      return "timeout";
    }

    if (message.includes("unavailable")) {
      return "unavailable";
    }

    return "unknown";
  }

  /**
   * Handles generation errors by throwing AIGenerationError for known error types
   * @throws AIGenerationError for quota or timeout errors
   * @throws The original error for unknown error types
   */
  private handleGenerationError(error: unknown, model: GeminiModel): never {
    const reason = this.detectErrorReason(error);
    const originalMessage = error instanceof Error ? error.message : undefined;

    if (
      reason === "quota" ||
      reason === "timeout" ||
      reason === "unavailable"
    ) {
      throw new AIGenerationError(model, reason, originalMessage);
    }

    // Re-throw unknown errors as-is
    throw error;
  }
}
