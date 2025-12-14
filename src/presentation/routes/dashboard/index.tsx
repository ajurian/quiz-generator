import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "@/presentation/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/card";
import { Badge } from "@/presentation/components/ui/badge";
import { Skeleton } from "@/presentation/components/ui/skeleton";
import { quizListQueryOptions } from "@/presentation/queries/quiz.queries";
import {
  FileText,
  Plus,
  Clock,
  Share2,
  BookOpen,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { StatsWidget } from "@/presentation/components/dashboard/stats-widget";
import { QuizCard } from "@/presentation/components/quiz/quiz-card";

export const Route = createFileRoute("/dashboard/")({
  loader: ({ context: { queryClient, user } }) =>
    queryClient.ensureQueryData(quizListQueryOptions(user.id)),
  pendingComponent: DashboardSkeleton,
  component: DashboardIndex,
});

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Skeleton */}
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Quiz List Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function DashboardIndex() {
  const { user } = Route.useRouteContext();
  const { data: response } = useSuspenseQuery(quizListQueryOptions(user.id));
  const quizzes = response.data;

  const stats = {
    totalQuizzes: quizzes.length,
    totalQuestions: quizzes.reduce((acc, q) => acc + q.totalQuestions, 0),
    publicQuizzes: quizzes.filter((q) => q.isPublic).length,
    recentQuizzes: quizzes.filter((q) => {
      const date = new Date(q.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date > weekAgo;
    }).length,
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your quizzes and track progress
          </p>
        </div>
        <Button asChild className="glow-primary">
          <Link to="/dashboard/quiz/new">
            <Sparkles className="mr-2 h-4 w-4" />
            Create Quiz
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsWidget
          title="Total Quizzes"
          value={stats.totalQuizzes}
          icon={FileText}
          description="All created quizzes"
          variant="primary"
        />
        <StatsWidget
          title="Total Questions"
          value={stats.totalQuestions}
          icon={BookOpen}
          description="Across all quizzes"
        />
        <StatsWidget
          title="Public Quizzes"
          value={stats.publicQuizzes}
          icon={Share2}
          description="Shared with others"
        />
        <StatsWidget
          title="This Week"
          value={stats.recentQuizzes}
          icon={TrendingUp}
          description="Quizzes created recently"
        />
      </div>

      {/* Quiz List */}
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Your Quizzes
            </h2>
            <p className="text-sm text-muted-foreground">
              View and manage all your created quizzes
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            {quizzes.length} {quizzes.length === 1 ? "quiz" : "quizzes"}
          </Badge>
        </div>

        {quizzes.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">No quizzes yet</h3>
              <p className="mb-6 max-w-sm text-center text-muted-foreground">
                Create your first AI-powered quiz by uploading your study
                materials
              </p>
              <Button asChild className="glow-primary">
                <Link to="/dashboard/quiz/new">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Create Your First Quiz
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quizzes.map((quiz) => (
              <QuizCard key={quiz.id} quiz={quiz} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
