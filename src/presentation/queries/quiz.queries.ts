import { queryOptions } from "@tanstack/react-query";
import {
  getUserQuizzes,
  getQuizById,
} from "@/presentation/server-functions/quiz.server";

/**
 * Query options for fetching the user's quiz list
 * @param userId - The authenticated user's ID
 */
export function quizListQueryOptions(userId: string) {
  return queryOptions({
    queryKey: ["quizzes", userId],
    queryFn: () => getUserQuizzes({ data: { userId } }),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!userId,
  });
}

/**
 * Query options for fetching a single quiz with details
 * @param quizId - The quiz ID to fetch
 * @param userId - The authenticated user's ID (optional for ownership check)
 */
export function quizDetailQueryOptions(quizId: string, userId?: string | null) {
  return queryOptions({
    queryKey: ["quizzes", quizId, userId],
    queryFn: () => getQuizById({ data: { quizId, userId } }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Query options for fetching a public quiz
 */
export function quizPublicQueryOptions(quizId: string) {
  return queryOptions({
    queryKey: ["quizzes", quizId, "public"],
    queryFn: () => getQuizById({ data: { quizId, userId: null } }),
    staleTime: 1000 * 60 * 10, // 10 minutes for public quizzes
  });
}
