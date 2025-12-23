import { createFileRoute, redirect } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { userAttemptsQueryOptions } from "@/presentation/queries";
import {
  HistorySkeleton,
  HistoryHeader,
  HistoryStatsGrid,
  AttemptsList,
} from "@/presentation/components/history";

export const Route = createFileRoute("/quiz/h/$slug/")({
  beforeLoad: ({ context }) => {
    if (!context.session?.user) {
      throw redirect({ to: "/auth/signin" });
    }
  },
  loader: async ({ params, context }) => {
    const userId = context.session!.user.id;
    await context.queryClient.ensureQueryData(
      userAttemptsQueryOptions(params.slug, userId)
    );
    return { userId };
  },
  pendingComponent: HistorySkeleton,
  component: HistoryPage,
});

function HistoryPage() {
  const { slug } = Route.useParams();
  const { userId } = Route.useLoaderData();
  const { data } = useSuspenseQuery(userAttemptsQueryOptions(slug, userId));
  const { quiz, attempts, summary } = data;

  return (
    <div className="min-h-screen bg-muted/20 py-8">
      <div className="container max-w-4xl mx-auto px-4">
        <HistoryHeader quizTitle={quiz.title} />
        <HistoryStatsGrid
          summary={summary}
          totalQuestions={quiz.totalQuestions}
        />
        <AttemptsList quizSlug={slug} attempts={attempts} />
      </div>
    </div>
  );
}
