import { useEffect, useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { quizKeys } from "@/presentation/queries";
import {
  QuizGenerationCompletedEvent,
  QuizGenerationEvent,
  QuizGenerationFailedEvent,
  QuizGenerationProcessingEvent,
} from "@/domain";

/**
 * Hook options for quiz event subscription
 */
export interface UseQuizEventsOptions {
  /**
   * The user ID to subscribe to events for
   */
  userId: string;
  /**
   * Whether the subscription is enabled
   * @default true
   */
  enabled?: boolean;
  /**
   * Callback when a progress event is received
   */
  onProcessing?: (event: QuizGenerationProcessingEvent) => void;
  /**
   * Callback when a quiz is ready
   */
  onCompleted?: (event: QuizGenerationCompletedEvent) => void;
  /**
   * Callback when a quiz generation fails
   */
  onFailed?: (event: QuizGenerationFailedEvent) => void;
  /**
   * Callback when connection state changes
   */
  onConnectionChange?: (connected: boolean) => void;
}

/**
 * Quiz event subscription state
 */
export interface UseQuizEventsState {
  /**
   * Whether the SSE connection is active
   */
  isConnected: boolean;
  /**
   * The last event received
   */
  lastEvent: QuizGenerationEvent | null;
  /**
   * Map of quiz IDs to their generation progress
   */
  generatingQuizzes: Map<string, QuizGenerationEvent>;
}

/**
 * Hook for subscribing to real-time quiz generation events via SSE
 *
 * This hook connects to the /api/quiz-events SSE endpoint and listens
 * for quiz generation progress, completion, and failure events.
 *
 * @example
 * ```tsx
 * const { isConnected, generatingQuizzes } = useQuizEvents({
 *   userId: user.id,
 *   onReady: (event) => {
 *     toast.success(`Quiz "${event.quizSlug}" is ready!`);
 *     queryClient.invalidateQueries({ queryKey: quizKeys.list(userId) });
 *   },
 *   onFailed: (event) => {
 *     toast.error(`Quiz generation failed: ${event.errorMessage}`);
 *   },
 * });
 * ```
 */
export function useQuizEvents(
  options: UseQuizEventsOptions
): UseQuizEventsState {
  const {
    userId,
    enabled = true,
    onProcessing,
    onCompleted,
    onFailed,
    onConnectionChange,
  } = options;

  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<QuizGenerationEvent | null>(null);
  const [generatingQuizzes, setGeneratingQuizzes] = useState<
    Map<string, QuizGenerationEvent>
  >(new Map());

  // Store callbacks in refs to avoid re-subscribing on every render
  const callbacksRef = useRef({
    onProcessing,
    onCompleted,
    onFailed,
    onConnectionChange,
  });
  callbacksRef.current = {
    onProcessing,
    onCompleted,
    onFailed,
    onConnectionChange,
  };
  /**
   * Handles incoming quiz events
   */
  const handleEvent = useCallback(
    (event: QuizGenerationEvent) => {
      setLastEvent(event);

      switch (event.type) {
        case "quiz.generation.processing":
          // Update generating quizzes map
          setGeneratingQuizzes((prev) => {
            const next = new Map(prev);
            console.log(next.entries());
            next.set(event.quizId, event);
            return next;
          });
          callbacksRef.current.onProcessing?.(event);
          break;

        case "quiz.generation.completed":
          console.log("useQuizEvents - completed event received:", event);
          // Remove from generating quizzes
          setGeneratingQuizzes((prev) => {
            const next = new Map(prev);
            next.delete(event.quizId);
            return next;
          });
          // Invalidate quiz list to refresh data
          queryClient.invalidateQueries({
            queryKey: quizKeys.list(userId),
          });
          callbacksRef.current.onCompleted?.(event);
          break;

        case "quiz.generation.failed":
          // Remove from generating quizzes
          setGeneratingQuizzes((prev) => {
            const next = new Map(prev);
            next.delete(event.quizId);
            return next;
          });
          // Invalidate quiz list to refresh data
          queryClient.invalidateQueries({
            queryKey: quizKeys.list(userId),
          });
          callbacksRef.current.onFailed?.(event);
          break;
      }
    },
    [queryClient, userId]
  );

  useEffect(() => {
    if (!enabled || !userId) {
      return;
    }

    // Reconnection interval: 4 minutes 45 seconds
    const RECONNECT_INTERVAL_MS = 4 * 60 * 1000 + 45 * 1000; // 285000ms

    const createEventSource = () => {
      // Close existing connection if any
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      // Create EventSource connection
      const eventSource = new EventSource("/api/quiz-events");
      eventSourceRef.current = eventSource;

      // Handle connection open
      eventSource.onopen = () => {
        setIsConnected(true);
        callbacksRef.current.onConnectionChange?.(true);
      };

      // Handle connection error
      eventSource.onerror = (error) => {
        console.error("[useQuizEvents] SSE error:", error);
        setIsConnected(false);
        callbacksRef.current.onConnectionChange?.(false);
      };

      // Handle connected event
      eventSource.addEventListener("connected", (e) => {
        const data = JSON.parse((e as MessageEvent).data);
        console.log("[useQuizEvents] Connected for user:", data.userId);
      });

      // Handle processing events (progress updates)
      eventSource.addEventListener("quiz.generation.processing", (e) => {
        try {
          const event = JSON.parse(
            (e as MessageEvent).data
          ) as QuizGenerationProcessingEvent;
          console.log("Questions Generated:", event.questionsGenerated);
          handleEvent(event);
        } catch (error) {
          console.error(
            "[useQuizEvents] Failed to parse processing event:",
            error
          );
        }
      });

      // Handle completed events
      eventSource.addEventListener("quiz.generation.completed", (e) => {
        try {
          const event = JSON.parse(
            (e as MessageEvent).data
          ) as QuizGenerationEvent;
          handleEvent(event);
        } catch (error) {
          console.error(
            "[useQuizEvents] Failed to parse completed event:",
            error
          );
        }
      });

      // Handle failed events
      eventSource.addEventListener("quiz.generation.failed", (e) => {
        try {
          const event = JSON.parse(
            (e as MessageEvent).data
          ) as QuizGenerationEvent;
          handleEvent(event);
        } catch (error) {
          console.error("[useQuizEvents] Failed to parse failed event:", error);
        }
      });

      return eventSource;
    };

    // Initial connection
    createEventSource();

    // Set up periodic reconnection every 4 minutes 45 seconds
    const reconnectInterval = setInterval(() => {
      console.log("[useQuizEvents] Forcing reconnection...");
      createEventSource();
    }, RECONNECT_INTERVAL_MS);

    // Cleanup on unmount
    return () => {
      clearInterval(reconnectInterval);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsConnected(false);
    };
  }, [enabled, userId, handleEvent]);

  return {
    isConnected,
    lastEvent,
    generatingQuizzes,
  };
}

/**
 * Simple hook for checking if any quizzes are currently generating
 */
export function useIsGenerating(userId: string): boolean {
  const { generatingQuizzes } = useQuizEvents({ userId });
  return generatingQuizzes.size > 0;
}
