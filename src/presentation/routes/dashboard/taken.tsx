import {
  AttemptHistorySection,
  DashboardSkeleton,
} from "@/presentation/components/dashboard";
import { userAttemptHistoryQueryOptions } from "@/presentation/queries";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Badge } from "@/presentation/components/ui/badge";
import { History } from "lucide-react";

export const Route = createFileRoute("/dashboard/taken")({
  loader: async ({ context, location }) => {
    const user = context.session?.user;
    if (!user) {
      throw redirect({
        to: "/auth/signin",
        search: { redirect: location.pathname },
      });
    }

    await context.queryClient.ensureQueryData(
      userAttemptHistoryQueryOptions(user.id),
    );
  },
  pendingComponent: DashboardSkeleton,
  component: TakenQuizzesPage,
});

function TakenQuizzesPage() {
  const { session } = Route.useRouteContext();
  const user = session!.user;
  const { data: attemptHistory } = useSuspenseQuery(
    userAttemptHistoryQueryOptions(user.id),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <History className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-display font-bold tracking-tight">
            Attempt History
          </h1>
          <Badge variant="secondary" className="text-sm">
            {attemptHistory.items.length}{" "}
            {attemptHistory.items.length === 1 ? "quiz" : "quizzes"}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Quizzes you've attempted recently
        </p>
      </div>

      {/* Attempt History List */}
      <AttemptHistorySection items={attemptHistory.items} />
    </div>
  );
}
