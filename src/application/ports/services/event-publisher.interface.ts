import type { QuizGenerationEvent } from "@/domain";

/**
 * Event Publisher Interface for Quiz Generation Events
 *
 * This port defines how the application layer publishes domain events.
 * Implementations in the infrastructure layer handle the actual delivery
 * mechanism (Redis pub/sub, WebSocket, etc.)
 */
export interface IQuizGenerationEventPublisher {
  /**
   * Publishes a quiz generation event to subscribers
   * @param event - The domain event to publish
   */
  publish(event: QuizGenerationEvent): Promise<void>;
}

/**
 * Event Subscriber Interface for Quiz Generation Events
 *
 * This port defines how the application layer subscribes to domain events.
 * Implementations in the infrastructure layer handle the actual subscription
 * mechanism (Redis pub/sub, WebSocket, etc.)
 */
export interface IQuizGenerationEventSubscriber {
  /**
   * Subscribes to quiz generation events for a specific user
   * @param userId - The user ID to subscribe to events for
   * @param onEvent - Callback invoked when an event is received
   * @returns A function to unsubscribe
   */
  subscribe(
    userId: string,
    onEvent: (event: QuizGenerationEvent) => void
  ): Promise<() => Promise<void>>;
}
