import type { Redis } from "@upstash/redis";
import type {
  ICacheService,
  IQuizGenerationEventPublisher,
} from "@/application";
import type { QuizGenerationEvent } from "@/domain";

/** TTL for cached events: 1 hour */
const EVENT_CACHE_TTL_SECONDS = 60 * 60;

/**
 * Cache key pattern for user's quiz generation events
 * Format: quiz-events:{userId}
 */
function getEventsCacheKey(userId: string): string {
  return `quiz-events:${userId}`;
}

export class RedisQuizGenerationEventPublisher implements IQuizGenerationEventPublisher {
  constructor(
    private readonly redis: Redis,
    private readonly cache: ICacheService
  ) {}

  async publish(event: QuizGenerationEvent): Promise<void> {
    // 1. Publish via Redis pub/sub for real-time delivery
    await this.redis.publish(event.userId, event);

    // 2. Cache the event for state recovery on page refresh
    // All event types are cached with 1-hour TTL
    const cacheKey = getEventsCacheKey(event.userId);
    await this.cache.hset(
      cacheKey,
      event.quizId,
      event,
      EVENT_CACHE_TTL_SECONDS
    );
  }
}
