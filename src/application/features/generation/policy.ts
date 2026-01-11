import { AIModel } from "../../types";
import type { FileMetadata, GeneratedQuestionData } from "../../ports";
import type { QuizDistribution, QuestionPreview } from "@/domain";

/**
 * Result of a model fallback operation
 */
export interface ModelFallbackResult<T> {
  /** The result data */
  data: T;
  /** Which model was used (after any fallbacks) */
  modelUsed: AIModel;
  /** Whether a fallback occurred */
  didFallback: boolean;
}

/**
 * Configuration for model fallback behavior
 */
export interface ModelFallbackConfig {
  /** Primary model to try first */
  primaryModel: AIModel;
  /** Fallback model if primary fails with quota error */
  fallbackModel: AIModel;
}

/**
 * Interface for the AI generation operation - allows policy to be injected with different generators
 */
export interface AIGenerationOperation<T> {
  (model: AIModel): Promise<T>;
}

/**
 * QuizGenerationPolicy encapsulates the model selection and fallback logic
 * for AI quiz generation. This separates the policy concern from use-case orchestration.
 *
 * Default behavior:
 * - For streaming generation: PREVIEW → PRIMARY fallback
 * - For sync generation: PRIMARY → LITE fallback
 *
 * Fallback triggers on quota/rate-limit errors (429, "quota", "rate limit").
 */
export class QuizGenerationPolicy {
  /**
   * Default config for streaming generation (workflow-based)
   * Uses PREVIEW as primary since it's the latest/experimental model
   */
  static readonly STREAMING_CONFIG: ModelFallbackConfig = {
    primaryModel: AIModel.PREVIEW,
    fallbackModel: AIModel.PRIMARY,
  };

  /**
   * Default config for synchronous generation (legacy/direct)
   * Uses PRIMARY as primary since it's the stable model
   */
  static readonly SYNC_CONFIG: ModelFallbackConfig = {
    primaryModel: AIModel.PRIMARY,
    fallbackModel: AIModel.LITE,
  };

  private readonly config: ModelFallbackConfig;

  constructor(config: ModelFallbackConfig = QuizGenerationPolicy.SYNC_CONFIG) {
    this.config = config;
  }

  /**
   * Factory for streaming generation policy
   */
  static forStreaming(): QuizGenerationPolicy {
    return new QuizGenerationPolicy(QuizGenerationPolicy.STREAMING_CONFIG);
  }

  /**
   * Factory for synchronous generation policy
   */
  static forSync(): QuizGenerationPolicy {
    return new QuizGenerationPolicy(QuizGenerationPolicy.SYNC_CONFIG);
  }

  /**
   * Execute an AI generation operation with automatic fallback on quota errors
   *
   * @param operation - The generation operation to execute (receives model as parameter)
   * @returns Result with data, model used, and fallback indicator
   * @throws The original error if not a quota error, or fallback error if both fail
   */
  async executeWithFallback<T>(
    operation: AIGenerationOperation<T>
  ): Promise<ModelFallbackResult<T>> {
    try {
      const data = await operation(this.config.primaryModel);
      return {
        data,
        modelUsed: this.config.primaryModel,
        didFallback: false,
      };
    } catch (error) {
      if (this.isQuotaError(error)) {
        // Try fallback model
        const data = await operation(this.config.fallbackModel);
        return {
          data,
          modelUsed: this.config.fallbackModel,
          didFallback: true,
        };
      }
      throw error;
    }
  }

  /**
   * Get the primary model for this policy
   */
  get primaryModel(): AIModel {
    return this.config.primaryModel;
  }

  /**
   * Get the fallback model for this policy
   */
  get fallbackModel(): AIModel {
    return this.config.fallbackModel;
  }

  /**
   * Checks if an error is a quota/rate-limit error that should trigger fallback
   */
  isQuotaError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes("quota") ||
        message.includes("rate limit") ||
        message.includes("429")
      );
    }
    return false;
  }
}
