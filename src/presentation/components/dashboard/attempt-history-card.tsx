import { Link, useNavigate } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/card";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { Calendar, Clock, Play, Trophy } from "lucide-react";
import type { AttemptHistoryItemDTO } from "@/application";
import { AttemptStatus } from "@/domain";

interface AttemptHistoryCardProps {
  item: AttemptHistoryItemDTO;
}

export function AttemptHistoryCard({ item }: AttemptHistoryCardProps) {
  const { quiz, latestAttempt } = item;
  const navigate = useNavigate();

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isSubmitted = latestAttempt.status === AttemptStatus.SUBMITTED;

  const handleCardClick = () => {
    navigate({ to: "/quiz/h/$slug", params: { slug: quiz.slug } });
  };

  const handleTryAgainClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate({
      to: "/quiz/a/$slug",
      params: { slug: quiz.slug },
    });
  };

  const handleContinueClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate({ to: "/quiz/a/$slug", params: { slug: quiz.slug } });
  };

  return (
    <Card
      className="group relative cursor-pointer overflow-hidden transition-all hover:border-primary/30 hover:shadow-lg"
      onClick={handleCardClick}
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      <CardHeader className="relative pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="truncate text-lg font-display font-semibold tracking-tight">
              {quiz.title}
            </CardTitle>
            <CardDescription className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(latestAttempt.startedAt)}
            </CardDescription>
          </div>
          {isSubmitted && latestAttempt.score !== null && (
            <Badge
              variant="secondary"
              className={`flex-shrink-0 gap-1 ${
                latestAttempt.score >= 70
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : latestAttempt.score >= 50
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
              }`}
            >
              <Trophy className="h-3 w-3" />
              {latestAttempt.score}%
            </Badge>
          )}
          {!isSubmitted && (
            <Badge
              variant="secondary"
              className="flex-shrink-0 gap-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
            >
              <Clock className="h-3 w-3" />
              In Progress
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {isSubmitted && latestAttempt.formattedDuration && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {latestAttempt.formattedDuration}
              </span>
            )}
            <span>{quiz.totalQuestions} questions</span>
          </div>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={isSubmitted ? handleTryAgainClick : handleContinueClick}
          >
            <Play className="h-4 w-4" />
            {isSubmitted ? "Try Again" : "Continue"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
