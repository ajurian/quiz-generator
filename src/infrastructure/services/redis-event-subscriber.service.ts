import { Redis } from "@upstash/redis";
import type { IQuizGenerationEventSubscriber } from "@/application";
import { QuizGenerationEvent } from "@/domain";

export class RedisQuizGenerationEventSubscriber implements IQuizGenerationEventSubscriber {
  constructor(private readonly redis: Redis) {}

  async subscribe(
    userId: string,
    onEvent: (event: QuizGenerationEvent) => void
  ): Promise<() => Promise<void>> {
    const subscription = this.redis.subscribe<QuizGenerationEvent>(userId);

    subscription.on("subscribe", () =>
      console.log(`Subscribed to Redis channel '${userId}'`)
    );

    subscription.on("message", ({ message }) => {
      console.log("Received Redis message:", message);
      onEvent(message);
    });

    // Log errors so we can diagnose stream/decode failures
    subscription.on("error", (error) => {
      console.error(`Redis subscription error for channel '${userId}':`, error);
    });

    // Return a cleanup function that:
    // 1. Closes over `subscription` so it won't be GC'd while the SSE connection is alive
    // 2. Properly binds the unsubscribe call
    return async () => {
      console.log(`Unsubscribing from Redis channel '${userId}'`);
      await subscription.unsubscribe();
    };
  }
}
