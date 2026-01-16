import { describe, expect, it } from "bun:test";
import {
  QuizGenerationEvents,
  type QuizGenerationProcessingEvent,
  type QuizGenerationCompletedEvent,
  type QuizGenerationFailedEvent,
  type QuestionPreview,
} from "@/domain/events/quiz-generation.events";

describe("QuizGenerationEvents", () => {
  const QUIZ_ID = "019b2194-72a0-7000-a712-5e5bc5c313c1";
  const QUIZ_SLUG = "AZshGnKgBwCnElXrxcMTwQ";
  const USER_ID = "018e3f5e-5f2a-7c2b-b3a4-9f8d6c4b2a10";

  describe("processing", () => {
    it("should create a processing event with correct type", () => {
      const lastQuestion: QuestionPreview = {
        orderIndex: 0,
        type: "direct_question",
        stem: "What is X?",
      };

      const event = QuizGenerationEvents.processing({
        quizId: QUIZ_ID,
        quizSlug: QUIZ_SLUG,
        userId: USER_ID,
        questionsGenerated: 1,
        lastQuestion,
        totalQuestions: 1,
      });

      expect(event.type).toBe("quiz.generation.processing");
      expect(event.quizId).toBe(QUIZ_ID);
      expect(event.quizSlug).toBe(QUIZ_SLUG);
      expect(event.userId).toBe(USER_ID);
      expect(event.questionsGenerated).toBe(1);
      expect(event.lastQuestion).toEqual(lastQuestion);
    });

    it("should include timestamp", () => {
      const before = new Date();

      const event = QuizGenerationEvents.processing({
        quizId: QUIZ_ID,
        quizSlug: QUIZ_SLUG,
        userId: USER_ID,
        questionsGenerated: 5,
        lastQuestion: null,
        totalQuestions: 0,
      });

      const after = new Date();

      expect(event.timestamp).toBeInstanceOf(Date);
      expect(event.timestamp.getTime()).toBeGreaterThanOrEqual(
        before.getTime()
      );
      expect(event.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it("should handle last question being the latest generated", () => {
      const lastQuestion: QuestionPreview = {
        orderIndex: 2,
        type: "contextual",
        stem: "Question 3",
      };

      const event = QuizGenerationEvents.processing({
        quizId: QUIZ_ID,
        quizSlug: QUIZ_SLUG,
        userId: USER_ID,
        questionsGenerated: 3,
        lastQuestion,
        totalQuestions: 3,
      });

      expect(event.questionsGenerated).toBe(3);
      expect(event.lastQuestion).not.toBeNull();
      expect(event.lastQuestion!.orderIndex).toBe(2);
      expect(event.lastQuestion!.type).toBe("contextual");
      expect(event.lastQuestion!.stem).toBe("Question 3");
    });
  });

  describe("completed", () => {
    it("should create a completed event with correct type", () => {
      const event = QuizGenerationEvents.completed({
        quizId: QUIZ_ID,
        quizSlug: QUIZ_SLUG,
        userId: USER_ID,
      });

      expect(event.type).toBe("quiz.generation.completed");
      expect(event.quizId).toBe(QUIZ_ID);
      expect(event.quizSlug).toBe(QUIZ_SLUG);
      expect(event.userId).toBe(USER_ID);
    });

    it("should include timestamp", () => {
      const before = new Date();

      const event = QuizGenerationEvents.completed({
        quizId: QUIZ_ID,
        quizSlug: QUIZ_SLUG,
        userId: USER_ID,
      });

      const after = new Date();

      expect(event.timestamp).toBeInstanceOf(Date);
      expect(event.timestamp.getTime()).toBeGreaterThanOrEqual(
        before.getTime()
      );
      expect(event.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe("failed", () => {
    it("should create a failed event with correct type and error message", () => {
      const errorMessage = "AI service unavailable";

      const event = QuizGenerationEvents.failed({
        quizId: QUIZ_ID,
        quizSlug: QUIZ_SLUG,
        userId: USER_ID,
        errorMessage,
      });

      expect(event.type).toBe("quiz.generation.failed");
      expect(event.quizId).toBe(QUIZ_ID);
      expect(event.quizSlug).toBe(QUIZ_SLUG);
      expect(event.userId).toBe(USER_ID);
      expect(event.errorMessage).toBe(errorMessage);
    });

    it("should include timestamp", () => {
      const before = new Date();

      const event = QuizGenerationEvents.failed({
        quizId: QUIZ_ID,
        quizSlug: QUIZ_SLUG,
        userId: USER_ID,
        errorMessage: "Error",
      });

      const after = new Date();

      expect(event.timestamp).toBeInstanceOf(Date);
      expect(event.timestamp.getTime()).toBeGreaterThanOrEqual(
        before.getTime()
      );
      expect(event.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it("should handle long error messages", () => {
      const longErrorMessage = "A".repeat(1000);

      const event = QuizGenerationEvents.failed({
        quizId: QUIZ_ID,
        quizSlug: QUIZ_SLUG,
        userId: USER_ID,
        errorMessage: longErrorMessage,
      });

      expect(event.errorMessage).toBe(longErrorMessage);
      expect(event.errorMessage.length).toBe(1000);
    });
  });

  describe("type narrowing", () => {
    it("should allow type narrowing based on event type", () => {
      const processingEvent = QuizGenerationEvents.processing({
        quizId: QUIZ_ID,
        quizSlug: QUIZ_SLUG,
        userId: USER_ID,
        questionsGenerated: 1,
        lastQuestion: null,
        totalQuestions: 1,
      });

      const completedEvent = QuizGenerationEvents.completed({
        quizId: QUIZ_ID,
        quizSlug: QUIZ_SLUG,
        userId: USER_ID,
      });

      const failedEvent = QuizGenerationEvents.failed({
        quizId: QUIZ_ID,
        quizSlug: QUIZ_SLUG,
        userId: USER_ID,
        errorMessage: "Error",
      });

      // Type guard function
      const isProcessingEvent = (event: {
        type: string;
      }): event is QuizGenerationProcessingEvent =>
        event.type === "quiz.generation.processing";

      const isCompletedEvent = (event: {
        type: string;
      }): event is QuizGenerationCompletedEvent =>
        event.type === "quiz.generation.completed";

      const isFailedEvent = (event: {
        type: string;
      }): event is QuizGenerationFailedEvent =>
        event.type === "quiz.generation.failed";

      expect(isProcessingEvent(processingEvent)).toBe(true);
      expect(isProcessingEvent(completedEvent)).toBe(false);
      expect(isProcessingEvent(failedEvent)).toBe(false);

      expect(isCompletedEvent(processingEvent)).toBe(false);
      expect(isCompletedEvent(completedEvent)).toBe(true);
      expect(isCompletedEvent(failedEvent)).toBe(false);

      expect(isFailedEvent(processingEvent)).toBe(false);
      expect(isFailedEvent(completedEvent)).toBe(false);
      expect(isFailedEvent(failedEvent)).toBe(true);
    });
  });
});
