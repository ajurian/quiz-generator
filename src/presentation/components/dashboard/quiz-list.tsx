import { Link } from "@tanstack/react-router";
import { Button } from "@/presentation/components/ui/button";
import { Card, CardContent } from "@/presentation/components/ui/card";
import { QuizCard } from "@/presentation/components/dashboard/quiz-card";
import { FileText, Sparkles } from "lucide-react";
import type { QuizResponseDTO } from "@/application";
import type {
  QuizGenerationEvent,
  QuizGenerationFailedEvent,
  QuizVisibility,
  QuizStatus,
} from "@/domain";
import { QuizStatus as QuizStatusEnum } from "@/domain";

interface QuizListProps {
  quizzes: QuizResponseDTO[];
  /** Map of quiz IDs to their real-time generation progress */
  generatingQuizzes?: Map<string, QuizGenerationEvent>;
  /** Map of quiz IDs to their failed events (from Redis cache) */
  failedQuizzes?: Map<string, QuizGenerationFailedEvent>;
  onVisibilityChange: (quizId: string, visibility: QuizVisibility) => void;
  isPendingVisibility: boolean;
}

/**
 * Converts a failed event to a quiz-like object for rendering
 */
function failedEventToQuiz(event: QuizGenerationFailedEvent): QuizResponseDTO {
  return {
    id: event.quizId,
    slug: event.quizSlug,
    title: event.quizTitle,
    status: QuizStatusEnum.FAILED as QuizStatus,
    createdAt: event.timestamp.toString(),
    updatedAt: event.timestamp.toString(),
    totalQuestions: 0,
    visibility: "private" as QuizVisibility,
    distribution: { directQuestion: 0, twoStatementCompound: 0, contextual: 0 },
    errorMessage: event.errorMessage,
  };
}

export function QuizList({
  quizzes,
  generatingQuizzes,
  failedQuizzes,
  onVisibilityChange,
  isPendingVisibility,
}: QuizListProps) {
  // Merge failed quizzes from cache with database quizzes
  // Failed quizzes that aren't in the database list are shown from cache
  const quizIds = new Set(quizzes.map((q) => q.id));
  const cachedFailedQuizzes = failedQuizzes
    ? Array.from(failedQuizzes.values())
        .filter((event) => !quizIds.has(event.quizId))
        .map(failedEventToQuiz)
    : [];

  // Combine: cached failed quizzes first (most recent failures), then database quizzes
  const allQuizzes = [...quizzes, ...cachedFailedQuizzes];

  return (
    <div>
      {allQuizzes.length === 0 ? (
        <EmptyQuizList />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {allQuizzes.map((quiz) => {
            const progress = generatingQuizzes?.get(quiz.id);
            // Only show progress for processing events
            const isProcessing =
              progress?.type === "quiz.generation.processing";
            return (
              <QuizCard
                key={quiz.id}
                quiz={quiz}
                generatingProgress={
                  isProcessing
                    ? {
                        questionsGenerated: progress.questionsGenerated ?? 0,
                        totalQuestions: progress.totalQuestions ?? 0,
                      }
                    : undefined
                }
                onVisibilityChange={onVisibilityChange}
                isPendingVisibility={isPendingVisibility}
              />
            );
          })}
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
