import {
  calculateDashboardStats,
  DashboardHeader,
  DashboardSkeleton,
  DashboardStatsGrid,
} from "@/presentation/components/dashboard";
import {
  cachedQuizEventsQueryOptions,
  quizListQueryOptions,
  userAttemptHistoryQueryOptions,
} from "@/presentation/queries";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/card";
import { Button } from "@/presentation/components/ui/button";
import { FileText, History, Compass, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/dashboard/")({
  loader: async ({ context }) => {
    const user = context.session?.user;
    if (!user) {
      throw redirect({ to: "/auth/signin" });
    }

    await Promise.all([
      context.queryClient.ensureQueryData(quizListQueryOptions(user.id)),
      context.queryClient.ensureQueryData(
        userAttemptHistoryQueryOptions(user.id),
      ),
      context.queryClient.ensureQueryData(
        cachedQuizEventsQueryOptions(user.id),
      ),
    ]);
  },
  pendingComponent: DashboardSkeleton,
  component: DashboardIndex,
});

function DashboardIndex() {
  const { session } = Route.useRouteContext();
  const user = session!.user;
  const { data: response } = useSuspenseQuery(quizListQueryOptions(user.id));
  const { data: attemptHistory } = useSuspenseQuery(
    userAttemptHistoryQueryOptions(user.id),
  );
  const quizzes = response.data;
  const stats = calculateDashboardStats(quizzes);

  return (
    <div className="space-y-8">
      <DashboardHeader />
      <DashboardStatsGrid stats={stats} />

      {/* Quick Links Section */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="group relative overflow-hidden transition-all hover:border-primary/30 hover:shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Created Quizzes</CardTitle>
                <CardDescription>
                  {quizzes.length} {quizzes.length === 1 ? "quiz" : "quizzes"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              View and manage all your created quizzes with visibility controls.
            </p>
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link to="/dashboard/created">
                View Created
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden transition-all hover:border-primary/30 hover:shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <History className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Attempt History</CardTitle>
                <CardDescription>
                  {attemptHistory.items.length}{" "}
                  {attemptHistory.items.length === 1 ? "quiz" : "quizzes"} taken
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Review your quiz attempts and track your progress over time.
            </p>
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link to="/dashboard/taken">
                View History
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden transition-all hover:border-primary/30 hover:shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Compass className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Explore Quizzes</CardTitle>
                <CardDescription>Discover public quizzes</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Browse and take quizzes shared by the community.
            </p>
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link to="/explore">
                Explore
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
