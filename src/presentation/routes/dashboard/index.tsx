import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  quizListQueryOptions,
  quizKeys,
  userAttemptHistoryQueryOptions,
} from "@/presentation/queries";
import {
  DashboardSkeleton,
  DashboardHeader,
  DashboardStatsGrid,
  QuizList,
  AttemptHistorySection,
  calculateDashboardStats,
} from "@/presentation/components/dashboard";
import { updateQuizVisibility } from "@/presentation/server-functions";
import { QuizVisibility } from "@/domain";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/")({
  loader: async ({ context }) => {
    const user = context.session?.user;
    if (!user) {
      throw redirect({ to: "/auth/signin" });
    }

    await Promise.all([
      context.queryClient.ensureQueryData(quizListQueryOptions(user.id)),
      context.queryClient.ensureQueryData(
        userAttemptHistoryQueryOptions(user.id)
      ),
    ]);
  },
  pendingComponent: DashboardSkeleton,
  component: DashboardIndex,
});

function DashboardIndex() {
  const { session } = Route.useRouteContext();
  const user = session!.user;
  const queryClient = useQueryClient();
  const { data: response } = useSuspenseQuery(quizListQueryOptions(user.id));
  const { data: attemptHistory } = useSuspenseQuery(
    userAttemptHistoryQueryOptions(user.id)
  );
  const quizzes = response.data;
  const stats = calculateDashboardStats(quizzes);

  const visibilityMutation = useMutation({
    mutationFn: async ({
      quizId,
      visibility,
    }: {
      quizId: string;
      visibility: QuizVisibility;
    }) => {
      return updateQuizVisibility({
        data: { quizId, userId: user.id, visibility },
      });
    },
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: quizKeys.list(user.id) });
    },
    onError: (error) => {
      toast.error("Failed to update visibility", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });

  const handleVisibilityChange = (
    quizId: string,
    visibility: QuizVisibility
  ) => {
    visibilityMutation.mutate({ quizId, visibility });
  };

  return (
    <div className="space-y-8">
      <DashboardHeader />
      <DashboardStatsGrid stats={stats} />
      <QuizList
        quizzes={quizzes}
        onVisibilityChange={handleVisibilityChange}
        isPendingVisibility={visibilityMutation.isPending}
      />
      <AttemptHistorySection items={attemptHistory.items} />
    </div>
  );
}
