import { describe, expect, it, mock, beforeEach } from "bun:test";
import type { Redis } from "@upstash/redis";
import { RedisQuizGenerationEventPublisher } from "../../infrastructure/services/redis-event-publisher.service";
import {
  QuizGenerationEvents,
  type QuizGenerationEvent,
} from "@/domain/events/quiz-generation.events";
import type { ICacheService } from "@/application";

describe("RedisEventPublisher", () => {
  let publisher: RedisQuizGenerationEventPublisher;
  let mockRedis: Redis;
  let mockCache: ICacheService;
  let publishedMessages: Array<{ channel: string; event: QuizGenerationEvent }>;
  let cachedEvents: Array<{
    key: string;
    field: string;
    value: unknown;
    ttl?: number;
  }>;

  const QUIZ_ID = "019b2194-72a0-7000-a712-5e5bc5c313c1";
  const QUIZ_SLUG = "AZshGnKgBwCnElXrxcMTwQ";
  const USER_ID = "018e3f5e-5f2a-7c2b-b3a4-9f8d6c4b2a10";

  beforeEach(() => {
    publishedMessages = [];
    cachedEvents = [];

    mockRedis = {
      publish: mock(async (channel: string, event: QuizGenerationEvent) => {
        publishedMessages.push({ channel, event });
        return 1;
      }),
    } as unknown as Redis;

    mockCache = {
      hset: mock(
        async (key: string, field: string, value: unknown, ttl?: number) => {
          cachedEvents.push({ key, field, value, ttl });
        }
      ),
      hget: mock(async () => null),
      hgetall: mock(async () => null),
      hdel: mock(async () => {}),
      expire: mock(async () => {}),
      get: mock(async () => null),
      set: mock(async () => {}),
      delete: mock(async () => {}),
      invalidate: mock(async () => {}),
    } as unknown as ICacheService;

    publisher = new RedisQuizGenerationEventPublisher(mockRedis, mockCache);
  });

  describe("publish", () => {
    describe("processing events", () => {
      it("should publish processing event to user channel", async () => {
        const event = QuizGenerationEvents.processing({
          quizId: QUIZ_ID,
          quizSlug: QUIZ_SLUG,
          userId: USER_ID,
          questionsGenerated: 3,
          totalQuestions: 10,
          lastQuestion: {
            orderIndex: 2,
            type: "two_statement_compound",
            stem: "Q3",
          },
        });

        await publisher.publish(event);

        expect(publishedMessages).toHaveLength(1);
        expect(publishedMessages[0]!.channel).toBe(USER_ID);
      });

      it("should cache processing event with TTL", async () => {
        const event = QuizGenerationEvents.processing({
          quizId: QUIZ_ID,
          quizSlug: QUIZ_SLUG,
          userId: USER_ID,
          questionsGenerated: 3,
          totalQuestions: 10,
          lastQuestion: { orderIndex: 2, type: "contextual", stem: "Q3" },
        });

        await publisher.publish(event);

        expect(cachedEvents).toHaveLength(1);
        expect(cachedEvents[0]!.key).toBe(`quiz-events:${USER_ID}`);
        expect(cachedEvents[0]!.field).toBe(QUIZ_ID);
        expect(cachedEvents[0]!.ttl).toBe(3600); // 1 hour
      });

      it("should include all event data", async () => {
        const lastQuestion = {
          orderIndex: 0,
          type: "direct_question",
          stem: "What is X?",
        };

        const event = QuizGenerationEvents.processing({
          quizId: QUIZ_ID,
          quizSlug: QUIZ_SLUG,
          userId: USER_ID,
          questionsGenerated: 1,
          totalQuestions: 5,
          lastQuestion,
        });

        await publisher.publish(event);

        const published = publishedMessages[0]!.event;

        expect(published.quizId).toBe(QUIZ_ID);
        expect(published.quizSlug).toBe(QUIZ_SLUG);
        expect(published.userId).toBe(USER_ID);
        expect(published.type).toBe("quiz.generation.processing");
        expect(published.timestamp).toBeInstanceOf(Date);
        if (published.type === "quiz.generation.processing") {
          expect(published.questionsGenerated).toBe(1);
          expect(published.totalQuestions).toBe(5);
          expect(published.lastQuestion).toEqual(lastQuestion);
        }
      });

      it("should include timestamp as Date", async () => {
        const event = QuizGenerationEvents.processing({
          quizId: QUIZ_ID,
          quizSlug: QUIZ_SLUG,
          userId: USER_ID,
          questionsGenerated: 0,
          totalQuestions: 10,
          lastQuestion: null,
        });

        await publisher.publish(event);

        const published = publishedMessages[0]!.event;
        expect(published.timestamp).toBeInstanceOf(Date);
      });
    });

    describe("completed events", () => {
      it("should publish completed event to user channel", async () => {
        const event = QuizGenerationEvents.completed({
          quizId: QUIZ_ID,
          quizSlug: QUIZ_SLUG,
          userId: USER_ID,
        });

        await publisher.publish(event);

        expect(publishedMessages).toHaveLength(1);
        expect(publishedMessages[0]!.channel).toBe(USER_ID);
      });

      it("should include all completed event data", async () => {
        const event = QuizGenerationEvents.completed({
          quizId: QUIZ_ID,
          quizSlug: QUIZ_SLUG,
          userId: USER_ID,
        });

        await publisher.publish(event);

        const published = publishedMessages[0]!.event;

        expect(published.quizId).toBe(QUIZ_ID);
        expect(published.quizSlug).toBe(QUIZ_SLUG);
        expect(published.userId).toBe(USER_ID);
        expect(published.type).toBe("quiz.generation.completed");
        expect(published.timestamp).toBeInstanceOf(Date);
      });
    });

    describe("failed events", () => {
      it("should publish failed event to user channel", async () => {
        const event = QuizGenerationEvents.failed({
          quizId: QUIZ_ID,
          quizSlug: QUIZ_SLUG,
          userId: USER_ID,
          errorMessage: "Generation failed",
        });

        await publisher.publish(event);

        expect(publishedMessages).toHaveLength(1);
        expect(publishedMessages[0]!.channel).toBe(USER_ID);
      });

      it("should include error message in failed event", async () => {
        const errorMessage = "AI service quota exceeded";

        const event = QuizGenerationEvents.failed({
          quizId: QUIZ_ID,
          quizSlug: QUIZ_SLUG,
          userId: USER_ID,
          errorMessage,
        });

        await publisher.publish(event);

        const published = publishedMessages[0]!.event;

        expect(published.quizId).toBe(QUIZ_ID);
        expect(published.quizSlug).toBe(QUIZ_SLUG);
        expect(published.userId).toBe(USER_ID);
        expect(published.type).toBe("quiz.generation.failed");
        if (published.type === "quiz.generation.failed") {
          expect(published.errorMessage).toBe(errorMessage);
        }
        expect(published.timestamp).toBeInstanceOf(Date);
      });
    });

    describe("channel routing", () => {
      it("should use userId as channel for all events", async () => {
        const user1Id = "user-1";
        const user2Id = "user-2";

        await publisher.publish(
          QuizGenerationEvents.processing({
            quizId: QUIZ_ID,
            quizSlug: QUIZ_SLUG,
            userId: user1Id,
            questionsGenerated: 1,
            totalQuestions: 5,
            lastQuestion: null,
          })
        );

        await publisher.publish(
          QuizGenerationEvents.completed({
            quizId: QUIZ_ID,
            quizSlug: QUIZ_SLUG,
            userId: user2Id,
          })
        );

        expect(publishedMessages[0]!.channel).toBe(user1Id);
        expect(publishedMessages[1]!.channel).toBe(user2Id);
      });

      it("should route all event types to userId channel", async () => {
        await publisher.publish(
          QuizGenerationEvents.processing({
            quizId: QUIZ_ID,
            quizSlug: QUIZ_SLUG,
            userId: USER_ID,
            questionsGenerated: 1,
            totalQuestions: 5,
            lastQuestion: null,
          })
        );

        await publisher.publish(
          QuizGenerationEvents.completed({
            quizId: QUIZ_ID,
            quizSlug: QUIZ_SLUG,
            userId: USER_ID,
          })
        );

        await publisher.publish(
          QuizGenerationEvents.failed({
            quizId: QUIZ_ID,
            quizSlug: QUIZ_SLUG,
            userId: USER_ID,
            errorMessage: "Error",
          })
        );

        expect(publishedMessages[0]!.channel).toBe(USER_ID);
        expect(publishedMessages[1]!.channel).toBe(USER_ID);
        expect(publishedMessages[2]!.channel).toBe(USER_ID);
      });
    });
  });
});
