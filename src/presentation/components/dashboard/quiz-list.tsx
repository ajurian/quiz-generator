import { Link } from "@tanstack/react-router";
import { Button } from "@/presentation/components/ui/button";
import { Card, CardContent } from "@/presentation/components/ui/card";
import { Badge } from "@/presentation/components/ui/badge";
import { QuizCard } from "@/presentation/components/dashboard/quiz-card";
import { FileText, Sparkles } from "lucide-react";
import type { QuizResponseDTO } from "@/application";
import type { QuizVisibility } from "@/domain";

interface QuizListProps {
  quizzes: QuizResponseDTO[];
  onVisibilityChange: (quizId: string, visibility: QuizVisibility) => void;
  isPendingVisibility: boolean;
}

export function QuizList({
  quizzes,
  onVisibilityChange,
  isPendingVisibility,
}: QuizListProps) {
  return (
    <div>
      <div className="mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-display font-semibold tracking-tight">
              Created
            </h2>
            <Badge variant="secondary" className="text-sm">
              {quizzes.length} {quizzes.length === 1 ? "quiz" : "quizzes"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            View and manage all your created quizzes
          </p>
        </div>
      </div>

      {quizzes.length === 0 ? (
        <EmptyQuizList />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              onVisibilityChange={onVisibilityChange}
              isPendingVisibility={isPendingVisibility}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyQuizList() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">No quizzes yet</h3>
        <p className="mb-6 max-w-sm text-center text-muted-foreground">
          Create your first AI-powered quiz by uploading your study materials
        </p>
        <Button asChild className="glow-primary">
          <Link to="/quiz/new">
            <Sparkles className="mr-2 h-4 w-4" />
            Create Your First Quiz
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
