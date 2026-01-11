import { useNavigate } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/card";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import {
  Calendar,
  FileText,
  Globe,
  Link2,
  Play,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { QuizVisibility, QuizStatus } from "@/domain";
import { ShareQuizDialog } from "../quiz/share-quiz-dialog";
import { getGenerationFailureMessage } from "@/presentation/lib";

interface QuizCardProps {
  quiz: {
    id: string;
    slug: string;
    title: string;
    status: QuizStatus;
    createdAt: string;
    totalQuestions: number;
    visibility: QuizVisibility;
    errorMessage?: string;
  };
  /** Real-time progress data (questions generated so far) */
  generatingProgress?: {
    questionsGenerated: number;
    totalQuestions: number;
  };
  onVisibilityChange: (quizId: string, visibility: QuizVisibility) => void;
  isPendingVisibility: boolean;
}

export function QuizCard({
  quiz,
  generatingProgress,
  onVisibilityChange,
  isPendingVisibility,
}: QuizCardProps) {
  const navigate = useNavigate();

  const isGenerating = quiz.status === QuizStatus.GENERATING;
  const isFailed = quiz.status === QuizStatus.FAILED;
  const isReady = quiz.status === QuizStatus.READY;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleCardClick = () => {
    if (isGenerating || isFailed) return;
    console.log("?");
    navigate({ to: "/quiz/m/$slug", params: { slug: quiz.slug } });
  };

  const handleTakeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isGenerating || isFailed) return;
    navigate({ to: "/quiz/a/$slug", params: { slug: quiz.slug } });
  };

  const handleVisibilityChange = (visibility: QuizVisibility) => {
    onVisibilityChange(quiz.id, visibility);
  };

  return (
    <Card
      className={`group relative overflow-hidden transition-all ${
        isGenerating
          ? "border-primary/50 bg-primary/5"
          : isFailed
            ? "border-destructive/50 bg-destructive/5 cursor-not-allowed"
            : "cursor-pointer hover:border-primary/30 hover:shadow-lg"
      }`}
      onClick={handleCardClick}
    >
      {/* Generating animation overlay */}
      {isGenerating && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 animate-pulse" />
      )}

      {/* Subtle gradient overlay on hover (only for ready quizzes) */}
      {isReady && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      )}

      <CardHeader className="relative pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="truncate text-lg font-display font-semibold tracking-tight">
              {quiz.title}
            </CardTitle>
            <CardDescription className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(quiz.createdAt)}
            </CardDescription>
          </div>

          {/* Status badges */}
          {isGenerating && (
            <Badge
              variant="secondary"
              className="flex-shrink-0 gap-1.5 bg-primary/20 text-primary animate-pulse"
            >
              <Loader2 className="h-3 w-3 animate-spin" />
              Generating
            </Badge>
          )}
          {isFailed && (
            <Badge variant="destructive" className="flex-shrink-0 gap-1">
              <AlertCircle className="h-3 w-3" />
              Failed
            </Badge>
          )}
          {isReady && quiz.visibility !== QuizVisibility.PRIVATE && (
            <Badge
              variant="secondary"
              className="flex-shrink-0 gap-1 bg-primary/10 text-primary hover:bg-primary/15"
            >
              {quiz.visibility === QuizVisibility.PUBLIC ? (
                <>
                  <Globe className="h-3 w-3" />
                  Public
                </>
              ) : (
                <>
                  <Link2 className="h-3 w-3" />
                  Unlisted
                </>
              )}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                isGenerating
                  ? "bg-primary/20"
                  : isFailed
                    ? "bg-destructive/20"
                    : "bg-muted"
              }`}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
              ) : isFailed ? (
                <AlertCircle className="h-4 w-4 text-destructive" />
              ) : (
                <FileText className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div className="flex flex-col">
              <span
                className={`text-sm font-medium ${isFailed ? "text-destructive" : "text-muted-foreground"}`}
              >
                {isGenerating
                  ? generatingProgress
                    ? `${generatingProgress.questionsGenerated}/${generatingProgress.totalQuestions} generated`
                    : "Starting generation..."
                  : isFailed
                    ? "Generation failed"
                    : `${quiz.totalQuestions} questions`}
              </span>
              {isFailed && quiz.errorMessage && (
                <span className="text-xs text-muted-foreground line-clamp-1 max-w-[180px]">
                  {getGenerationFailureMessage(quiz.errorMessage)}
                </span>
              )}
            </div>
          </div>

          {/* Actions - only show for ready quizzes */}
          {isReady && (
            <div className="flex items-center gap-1">
              <ShareQuizDialog
                quizSlug={quiz.slug}
                currentVisibility={quiz.visibility}
                onVisibilityChange={handleVisibilityChange}
                isPending={isPendingVisibility}
              />
              <Button size="sm" onClick={handleTakeClick} className="gap-1.5">
                <Play className="h-4 w-4" />
                Take
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
