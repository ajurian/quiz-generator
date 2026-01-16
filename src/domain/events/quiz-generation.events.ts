/**
 * Domain Events for Quiz Generation
 *
 * These events represent significant occurrences in the quiz generation domain.
 * They are defined in the domain layer and can be consumed by any outer layer.
 */

/**
 * Base interface for all domain events
 */
export interface DomainEvent {
  /** Unique identifier for the event type */
  readonly type: string;
  /** When the event occurred */
  readonly timestamp: Date;
}

/**
 * Partial question data for processing updates
 * Contains only the essential fields to show generation processing
 */
export interface QuestionPreview {
  orderIndex: number;
  type: string;
  stem: string;
}

/**
 * Group and User ID is included in all events for scoping
 */
export interface QuizGenerationBaseEvent extends DomainEvent {
  readonly userId: string;
  readonly quizId: string;
  readonly quizSlug: string;
}

/**
 * Event emitted when quiz generation processing updates
 * This is published progressively as questions are generated via streaming
 */
export interface QuizGenerationProcessingEvent extends QuizGenerationBaseEvent {
  readonly type: `quiz.generation.processing`;
  readonly questionsGenerated: number;
  readonly totalQuestions: number;
  /** The most recently generated question (for real-time UI updates) */
  readonly lastQuestion: QuestionPreview | null;
}

/**
 * Event emitted when quiz generation completes successfully
 */
export interface QuizGenerationCompletedEvent extends QuizGenerationBaseEvent {
  readonly type: `quiz.generation.completed`;
}

/**
 * Event emitted when quiz generation fails
 */
export interface QuizGenerationFailedEvent extends QuizGenerationBaseEvent {
  readonly type: `quiz.generation.failed`;
  readonly errorMessage: string;
}

/**
 * Union type of all quiz generation events
 */
export type QuizGenerationEvent =
  | QuizGenerationProcessingEvent
  | QuizGenerationCompletedEvent
  | QuizGenerationFailedEvent;

/**
 * Factory functions for creating domain events
 */
export const QuizGenerationEvents = {
  /**
   * Creates a processing event during quiz generation
   */
  processing(params: {
    quizId: string;
    quizSlug: string;
    userId: string;
    questionsGenerated: number;
    totalQuestions: number;
    lastQuestion: QuestionPreview | null;
  }): QuizGenerationProcessingEvent {
    return {
      type: `quiz.generation.processing`,
      timestamp: new Date(),
      ...params,
    };
  },

  /**
   * Creates a completion event when quiz generation succeeds
   */
  completed(params: {
    quizId: string;
    quizSlug: string;
    userId: string;
  }): QuizGenerationCompletedEvent {
    return {
      type: `quiz.generation.completed`,
      timestamp: new Date(),
      ...params,
    };
  },

  /**
   * Creates a failure event when quiz generation fails
   */
  failed(params: {
    quizId: string;
    quizSlug: string;
    userId: string;
    errorMessage: string;
  }): QuizGenerationFailedEvent {
    return {
      type: `quiz.generation.failed`,
      timestamp: new Date(),
      ...params,
    };
  },
} as const;
