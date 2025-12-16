import { queryOptions } from "@tanstack/react-query";
import {
  getQuizBySlug,
  getUserAttempts,
  getAttemptDetail,
} from "@/presentation/server-functions/attempt.server";

/**
 * Centralized query key factory for consistent cache management.
 * All query keys and invalidations should use this factory.
 */
export const attemptKeys = {
  all: ["attempts"] as const,
  lists: () => [...attemptKeys.all, "list"] as const,
  list: (quizSlug: string, userId: string) =>
    [...attemptKeys.lists(), quizSlug, userId] as const,
  details: () => [...attemptKeys.all, "detail"] as const,
  detail: (quizSlug: string, attemptSlug: string) =>
    [...attemptKeys.details(), quizSlug, attemptSlug] as const,
} as const;

/**
 * Query options for fetching a user's attempts for a specific quiz
 * @param quizSlug - The quiz's public slug
 * @param userId - The authenticated user's ID
 */
export function userAttemptsQueryOptions(quizSlug: string, userId: string) {
  return queryOptions({
    queryKey: attemptKeys.list(quizSlug, userId),
    queryFn: () => getUserAttempts({ data: { quizSlug, userId } }),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!userId,
  });
}

/**
 * Query options for fetching a specific attempt's detail
 * @param quizSlug - The quiz's public slug
 * @param attemptSlug - The attempt's public slug
 * @param userId - The user ID (optional)
 */
export function attemptDetailQueryOptions(
  quizSlug: string,
  attemptSlug: string,
  userId: string | null = null
) {
  return queryOptions({
    queryKey: attemptKeys.detail(quizSlug, attemptSlug),
    queryFn: () =>
      getAttemptDetail({ data: { quizSlug, attemptSlug, userId } }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
