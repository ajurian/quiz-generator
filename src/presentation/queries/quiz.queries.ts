import { queryOptions } from "@tanstack/react-query";
import {
  getUserQuizzes,
  getQuizById,
  getCachedQuizEvents,
} from "@/presentation/server-functions/quiz.server";
import { getQuizBySlug } from "@/presentation/server-functions/attempt.server";

/**
 * Centralized query key factory for consistent cache management.
 * All query keys and invalidations should use this factory.
 */
export const quizKeys = {
  all: ["quizzes"] as const,
  lists: () => [...quizKeys.all, "list"] as const,
  list: (userId: string) => [...quizKeys.lists(), userId] as const,
  details: () => [...quizKeys.all, "detail"] as const,
  detail: (quizId: string) => [...quizKeys.details(), quizId] as const,
  bySlug: (slug: string) => [...quizKeys.all, "slug", slug] as const,
  generatingEvents: (userId: string) =>
    [...quizKeys.all, "generating-events", userId] as const,
} as const;

/**
 * Query options for fetching the user's quiz list
 * @param userId - The authenticated user's ID
 */
export function quizListQueryOptions(userId: string) {
  return queryOptions({
    queryKey: quizKeys.list(userId),
    queryFn: () => getUserQuizzes({ data: { userId } }),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!userId,
  });
}

/**
 * Query options for fetching a single quiz by ID
 * @param quizId - The quiz ID to fetch
 * @param userId - The authenticated user's ID (optional for ownership check)
 */
export function quizDetailQueryOptions(quizId: string, userId?: string | null) {
  return queryOptions({
    queryKey: quizKeys.detail(quizId),
    queryFn: () => getQuizById({ data: { quizId, userId } }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Query options for fetching a quiz by slug (for taking/managing)
 * @param quizSlug - The quiz's public slug
 * @param userId - The user ID (optional, for ownership check)
 */
export function quizBySlugQueryOptions(
  quizSlug: string,
  userId?: string | null
) {
  return queryOptions({
    queryKey: quizKeys.bySlug(quizSlug),
    queryFn: () => getQuizBySlug({ data: { quizSlug, userId } }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Query options for fetching cached quiz generation events
 * Used to hydrate the generating quizzes state on page load/refresh
 * @param userId - The authenticated user's ID
 */
export function cachedQuizEventsQueryOptions(userId: string) {
  return queryOptions({
    queryKey: quizKeys.generatingEvents(userId),
    queryFn: () => getCachedQuizEvents({ data: { userId } }),
    staleTime: 0, // Always refetch on mount to get latest state
    gcTime: 1000 * 60, // Keep in cache for 1 minute
    enabled: !!userId,
  });
}
