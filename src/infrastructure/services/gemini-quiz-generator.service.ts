import { createPartFromUri, GoogleGenAI, Type } from "@google/genai";
import type {
  IAIQuizGenerator,
  GenerateQuizParams,
  GeneratedQuestionData,
  FileMetadata,
} from "../../application";
import { GeminiModel, QuestionType, type OptionIndex } from "../../domain";

/**
 * Zod-like schema for structured output validation
 * Defines the expected JSON structure from Gemini API
 */
const questionSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      questionText: {
        type: Type.STRING,
        description: "The question text",
      },
      questionType: {
        type: Type.STRING,
        enum: [
          QuestionType.SINGLE_BEST_ANSWER,
          QuestionType.TWO_STATEMENTS,
          QuestionType.CONTEXTUAL,
        ],
        description: "The type of question",
      },
      options: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            index: {
              type: Type.STRING,
              enum: ["A", "B", "C", "D"],
              description: "Option letter",
            },
            text: {
              type: Type.STRING,
              description: "Option text",
            },
            explanation: {
              type: Type.STRING,
              description:
                "Explanation for why this option is correct or incorrect",
            },
            isCorrect: {
              type: Type.BOOLEAN,
              description: "Whether this is the correct answer",
            },
          },
          required: ["index", "text", "explanation", "isCorrect"],
        },
      },
      orderIndex: {
        type: Type.NUMBER,
        description: "The order of the question (0-based)",
      },
    },
    required: ["questionText", "questionType", "options", "orderIndex"],
  },
};

/**
 * Error class for quota exceeded errors
 */
export class QuotaExceededError extends Error {
  constructor(model: GeminiModel) {
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
  private readonly primaryModel = GeminiModel.FLASH_2_5;
  private readonly fallbackModel = GeminiModel.FLASH_2_5_LITE;

  constructor(apiKey?: string) {
    const key = apiKey ?? process.env.GOOGLE_AI_API_KEY;
    if (!key) {
      throw new Error("GOOGLE_AI_API_KEY environment variable is required");
    }
    this.client = new GoogleGenAI({ apiKey: key });
  }

  /**
   * Generates quiz questions from uploaded files using AI
   * Implements fallback logic: tries primary model first, falls back to lite on quota error
   */
  async generateQuestions(
    params: GenerateQuizParams
  ): Promise<GeneratedQuestionData[]> {
    try {
      return await this.generateWithModel(
        params.model ?? this.primaryModel,
        params
      );
    } catch (error) {
      if (this.isQuotaError(error)) {
        console.warn(
          `Quota exceeded for ${this.primaryModel}, falling back to ${this.fallbackModel}`
        );
        return await this.generateWithModel(this.fallbackModel, params);
      }
      throw error;
    }
  }

  /**
   * Validates if the specified model has available quota
   * Makes a minimal request to check availability
   */
  async validateQuota(model: GeminiModel): Promise<boolean> {
    try {
      const response = await this.client.models.generateContent({
        model,
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
    const fileContents = files.map((file: FileMetadata) =>
      createPartFromUri(file.uri, file.mimeType)
    );

    const response = await this.client.models.generateContent({
      model,
      contents: [{ text: prompt }, ...fileContents],
      config: {
        responseMimeType: "application/json",
        responseSchema: questionSchema,
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
   * Builds the prompt for question generation
   */
  private buildPrompt(distribution: {
    singleBestAnswer: number;
    twoStatements: number;
    contextual: number;
  }): string {
    const totalQuestions =
      distribution.singleBestAnswer +
      distribution.twoStatements +
      distribution.contextual;

    const lazyNumbering = (start: number, count: number) => {
      return count > 1 ? `${start}-${start + count - 1}` : `${start}`;
    };

    return [
      "**Role**: You are a source-grounded MCQ item writer and post-answer feedback author.",
      `> Generate **${totalQuestions}** multiple-choice questions strictly from the provided handouts`,
      "## Non-negotiable rules (MUST / MUST NOT)",
      "- **MUST** use only information in the handouts.",
      "- **MUST NOT** invent facts, examples, definitions, or terminology not present in the handouts.",
      "- **MUST NOT** mention, cite, or refer to the handouts in the stems/options.",
      "- **MUST** write each item in MCQ format with **4 options (A, B, C, D)** and **exactly one** correct answer.",
      "- **MUST** avoid cues: keep options parallel in grammar/length/style; **avoid giveaway words and inconsistent specificity**.",
      "- **MUST** balance answer keys approximately across A-D and **avoid obvious patterns** (no long runs).",
      "- **MUST NOT** rephrase/paraphrase from the handouts.",
      "- **MUST** provide rationales for **A, B, C, D**.",
      "- Rationales **MUST** be concise and grounded in the handouts.",
      "- Rationales **MUST NOT** state correctness; **just explain why**.",
      "- Rationales **MUST** be independent of each other (no cross-references).",
      "## Item type distribution",
      distribution.singleBestAnswer > 0
        ? `> ${lazyNumbering(
            1,
            distribution.singleBestAnswer
          )}) **Single-Best Answer**`
        : "",
      distribution.twoStatements > 0
        ? `> ${lazyNumbering(
            distribution.singleBestAnswer + 1,
            distribution.twoStatements
          )}) **Two-Statement Compound True/False** Question format: \`{{first_statement}};{{second_statement}}\` (A-'Only the first statement is true', B-'Only the second statement is true', C-'Both statements are true', D-'Neither statement is true')`
        : "",
      distribution.contextual > 0
        ? `> ${lazyNumbering(
            distribution.singleBestAnswer + distribution.twoStatements + 1,
            distribution.contextual
          )}) **Contextual** (include only necessary scenario, case details, data, or short story required to answer the question)`
        : "",
      ,
    ].join("\n");
  }

  /**
   * Validates and transforms the parsed response
   */
  private validateAndTransform(
    data: GeneratedQuestionData[]
  ): GeneratedQuestionData[] {
    return data.map((q: GeneratedQuestionData, index: number) => ({
      questionText: q.questionText,
      questionType: q.questionType as QuestionType,
      options: q.options.map(
        (opt: GeneratedQuestionData["options"][number]) => ({
          index: opt.index as OptionIndex,
          text: opt.text,
          explanation: opt.explanation,
          isCorrect: opt.isCorrect,
        })
      ),
      orderIndex: q.orderIndex ?? index,
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
