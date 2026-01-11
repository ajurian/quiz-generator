/**
 * Domain Events Index
 *
 * This module exports all domain events.
 * Domain events represent significant occurrences in the business domain.
 */

export type {
  DomainEvent,
  QuestionPreview,
  QuizGenerationBaseEvent,
  QuizGenerationProcessingEvent,
  QuizGenerationCompletedEvent,
  QuizGenerationFailedEvent,
  QuizGenerationEvent,
} from "./quiz-generation.events";

export { QuizGenerationEvents } from "./quiz-generation.events";
