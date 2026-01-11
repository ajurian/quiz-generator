import type { Redis } from "@upstash/redis";
import type { IQuizGenerationEventPublisher } from "@/application";
import type { QuizGenerationEvent } from "@/domain";

export class RedisQuizGenerationEventPublisher implements IQuizGenerationEventPublisher {
  constructor(private readonly redis: Redis) {}

  async publish(event: QuizGenerationEvent): Promise<void> {
    await this.redis.publish(event.userId, event);
  }
}
