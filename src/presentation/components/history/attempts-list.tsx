import { Link } from "@tanstack/react-router";
import { Button } from "@/presentation/components/ui/button";
import { Card, CardContent } from "@/presentation/components/ui/card";
import { Badge } from "@/presentation/components/ui/badge";
import { Clock, Calendar, Eye, Play } from "lucide-react";

interface Attempt {
  id: string;
  slug: string;
  status: string;
  score: number | null;
  startedAt: string;
  formattedDuration: string | null;
}

interface AttemptsListProps {
  quizSlug: string;
  attempts: Attempt[];
}

export function AttemptsList({ quizSlug, attempts }: AttemptsListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">All Attempts</h2>
        <Button asChild>
          <Link to="/quiz/a/$slug" params={{ slug: quizSlug }}>
            <Play className="h-4 w-4 mr-2" />
            Take Again
          </Link>
        </Button>
      </div>

      {attempts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No attempts yet. Take the quiz to see your results here!
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {attempts.map((attempt, index) => (
            <AttemptCard
              key={attempt.id}
              attempt={attempt}
              quizSlug={quizSlug}
              attemptNumber={attempts.length - index}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface AttemptCardProps {
  attempt: Attempt;
  quizSlug: string;
  attemptNumber: number;
}

function AttemptCard({ attempt, quizSlug, attemptNumber }: AttemptCardProps) {
  const isInProgress = attempt.status === "in_progress";

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted font-medium">
              #{attemptNumber}
            </div>
            <div>
              <div className="flex items-center gap-2">
                {isInProgress ? (
                  <Badge
                    variant="outline"
                    className="border-amber-500 text-amber-500"
                  >
                    In Progress
                  </Badge>
                ) : (
                  <Badge
                    variant="default"
                    className="bg-green-500/10 text-green-500 hover:bg-green-500/20"
                  >
                    Completed
                  </Badge>
                )}
                {attempt.score !== null && (
                  <span className="font-semibold">
                    {attempt.score.toFixed(0)}%
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(attempt.startedAt).toLocaleDateString()}
                </span>
                {attempt.formattedDuration && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {attempt.formattedDuration}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" asChild>
            {isInProgress ? (
              <Link to="/quiz/a/$slug" params={{ slug: quizSlug }}>
                <Play className="h-4 w-4 mr-2" />
                Continue
              </Link>
            ) : (
              <Link
                to="/quiz/h/$slug/$attemptSlug"
                params={{ slug: quizSlug, attemptSlug: attempt.slug }}
              >
                <Eye className="h-4 w-4 mr-2" />
                Review
              </Link>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
