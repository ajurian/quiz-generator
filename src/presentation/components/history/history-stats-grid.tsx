import { Card, CardContent } from "@/presentation/components/ui/card";
import { Trophy, TrendingUp, Play, Calendar } from "lucide-react";

interface AttemptSummary {
  bestScore: number | null;
  averageScore: number | null;
  totalAttempts: number;
}

interface HistoryStatsGridProps {
  summary: AttemptSummary;
  totalQuestions: number;
}

export function HistoryStatsGrid({
  summary,
  totalQuestions,
}: HistoryStatsGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <StatCard
        icon={<Trophy className="h-4 w-4 text-yellow-500" />}
        label="Best Score"
        value={
          summary.bestScore !== null ? `${summary.bestScore.toFixed(0)}%` : "--"
        }
      />
      <StatCard
        icon={<TrendingUp className="h-4 w-4 text-blue-500" />}
        label="Average"
        value={
          summary.averageScore !== null
            ? `${summary.averageScore.toFixed(0)}%`
            : "--"
        }
      />
      <StatCard
        icon={<Play className="h-4 w-4 text-green-500" />}
        label="Attempts"
        value={summary.totalAttempts.toString()}
      />
      <StatCard
        icon={<Calendar className="h-4 w-4 text-purple-500" />}
        label="Questions"
        value={totalQuestions.toString()}
      />
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
            {icon}
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {label}
          </span>
        </div>
        <div className="text-2xl font-display font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
