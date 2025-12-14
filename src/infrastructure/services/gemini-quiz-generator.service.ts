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
      "**Role**: You are a Quiz Generator.",
      `> **${totalQuestions} Questions**`,
      "- Generate a quiz about the given handouts.",
      "- The question should strictly be in multiple choice format.",
      "- **Do not reference the handouts** as it is redundant.",
      "- **Do not invent** any additional information not present in the handouts.",
      "- Each question must have **4 options (A, B, C, D)** with exactly one correct answer.",
      "- **Do not give off any clues** about which option is correct in the question phrasing.",
      "- **Do not have obvious patterns** in the correct answers.",
      "- Provide **uniform distribution of answer keys** (A, B, C, D) across the entire quiz.",
      "- **Do not rephrase** questions and options.",
      "- For each option, **provide a concise explanation** of why it is correct or incorrect.",
      "- For explanation, **do not state whether the option is correct or incorrect**. Just explain why.",
      "- The questions should be distributed into the following:",
      distribution.singleBestAnswer > 0
        ? `> ${lazyNumbering(
            1,
            distribution.singleBestAnswer
          )}) **Single-Best Answer**: Pick one correct option from fixed alternatives.`
        : "",
      distribution.twoStatements > 0
        ? `> ${lazyNumbering(
            distribution.singleBestAnswer + 1,
            distribution.twoStatements
          )}) **Two-Statement Compound True/False**: Judge each of two statements as true/false, then select the option that matches the truth pattern (A-'Only the first statement is true', B-'Only the second statement is true', C-'Both statements are true', D-'Neither statement is true').`
        : "",
      distribution.contextual > 0
        ? `> ${lazyNumbering(
            distribution.singleBestAnswer + distribution.twoStatements + 1,
            distribution.contextual
          )}) **Contextual*: Read the provided background (scenario, case details, data, or short story) and use it as the basis for selecting the best answer.`
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
