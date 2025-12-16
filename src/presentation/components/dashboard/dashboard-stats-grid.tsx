import { StatsWidget } from "./stats-widget";
import { FileText, BookOpen, Share2, TrendingUp } from "lucide-react";

export interface DashboardStats {
  totalQuizzes: number;
  totalQuestions: number;
  sharedQuizzes: number;
  recentQuizzes: number;
}

interface DashboardStatsGridProps {
  stats: DashboardStats;
}

export function DashboardStatsGrid({ stats }: DashboardStatsGridProps) {
  return (
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
        title="Shared Quizzes"
        value={stats.sharedQuizzes}
        icon={Share2}
        description="Public or unlisted"
      />
      <StatsWidget
        title="This Week"
        value={stats.recentQuizzes}
        icon={TrendingUp}
        description="Quizzes created recently"
      />
    </div>
  );
}

export function calculateDashboardStats(
  quizzes: Array<{
    totalQuestions: number;
    visibility: string;
    createdAt: string;
  }>
): DashboardStats {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  return {
    totalQuizzes: quizzes.length,
    totalQuestions: quizzes.reduce((acc, q) => acc + q.totalQuestions, 0),
    sharedQuizzes: quizzes.filter((q) => q.visibility !== "private").length,
    recentQuizzes: quizzes.filter((q) => new Date(q.createdAt) > weekAgo)
      .length,
  };
}
