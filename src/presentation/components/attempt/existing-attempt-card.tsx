import { Link } from "@tanstack/react-router";
import { Button } from "@/presentation/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/card";
import {
  Clock,
  History,
  Eye,
  Trophy,
  Play,
  RefreshCcw,
  CheckCircle2,
} from "lucide-react";

interface AttemptSummary {
  totalAttempts: number;
  bestScore: number | null;
  averageScore: number | null;
  lastAttempt: {
    slug: string;
    score: number | null;
    formattedDuration: string | null;
    submittedAt: string | null;
    startedAt: string;
  } | null;
}

interface ExistingAttemptCardProps {
  slug: string;
  summary: AttemptSummary;
  onStartNewAttempt: () => void;
  isStarting: boolean;
}

export function ExistingAttemptCard({
  slug,
  summary,
  onStartNewAttempt,
  isStarting,
}: ExistingAttemptCardProps) {
  const lastAttempt = summary.lastAttempt;

  return (
    <div className="min-h-screen bg-muted/20 py-8">
      <div className="container max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-display">
              You've completed this quiz
            </CardTitle>
            <CardDescription>
              You have {summary.totalAttempts} previous attempt
              {summary.totalAttempts !== 1 ? "s" : ""} on this quiz
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {lastAttempt && <LastAttemptSummary attempt={lastAttempt} />}
            {summary.bestScore !== null && (
              <ScoresSummary
                bestScore={summary.bestScore}
                averageScore={summary.averageScore}
              />
            )}
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-3 pt-6">
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link to="/quiz/h/$slug" params={{ slug }}>
                <History className="h-4 w-4 mr-2" />
                View All Attempts
              </Link>
            </Button>
            {lastAttempt && (
              <Button variant="outline" asChild className="w-full sm:w-auto">
                <Link
                  to="/quiz/h/$slug/$attemptSlug"
                  params={{ slug, attemptSlug: lastAttempt.slug }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Review Last Attempt
                </Link>
              </Button>
            )}
            <Button
              onClick={onStartNewAttempt}
              disabled={isStarting}
              className="w-full sm:w-auto"
            >
              {isStarting ? (
                <>
                  <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Try Again
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

interface LastAttemptSummaryProps {
  attempt: NonNullable<AttemptSummary["lastAttempt"]>;
}

function LastAttemptSummary({ attempt }: LastAttemptSummaryProps) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <h3 className="font-medium text-sm text-muted-foreground">
        Last Attempt
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-500" />
          <span className="text-sm">
            Score: <strong>{attempt.score?.toFixed(0) ?? "--"}%</strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            Time: {attempt.formattedDuration ?? "--"}
          </span>
        </div>
      </div>
      <div className="text-xs text-muted-foreground">
        Completed{" "}
        {new Date(
          attempt.submittedAt ?? attempt.startedAt
        ).toLocaleDateString()}
      </div>
    </div>
  );
}

interface ScoresSummaryProps {
  bestScore: number;
  averageScore: number | null;
}

function ScoresSummary({ bestScore, averageScore }: ScoresSummaryProps) {
  return (
    <div className="grid grid-cols-2 gap-4 text-center">
      <div className="rounded-lg border bg-card p-3">
        <div className="text-2xl font-display font-bold text-primary">
          {bestScore.toFixed(0)}%
        </div>
        <div className="text-xs text-muted-foreground">Best Score</div>
      </div>
      <div className="rounded-lg border bg-card p-3">
        <div className="text-2xl font-display font-bold">
          {averageScore?.toFixed(0) ?? "--"}%
        </div>
        <div className="text-xs text-muted-foreground">Average</div>
      </div>
    </div>
  );
}
