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
import { Calendar, FileText, Globe, Link2, Play } from "lucide-react";
import { QuizVisibility } from "@/domain";
import { ShareQuizDialog } from "../quiz/share-quiz-dialog";

interface QuizCardProps {
  quiz: {
    id: string;
    slug: string;
    title: string;
    createdAt: string;
    totalQuestions: number;
    visibility: QuizVisibility;
  };
  onVisibilityChange: (quizId: string, visibility: QuizVisibility) => void;
  isPendingVisibility: boolean;
}

export function QuizCard({
  quiz,
  onVisibilityChange,
  isPendingVisibility,
}: QuizCardProps) {
  const navigate = useNavigate();

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleCardClick = () => {
    navigate({ to: "/quiz/m/$slug", params: { slug: quiz.slug } });
  };

  const handleTakeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate({ to: "/quiz/a/$slug", params: { slug: quiz.slug } });
  };

  const handleVisibilityChange = (visibility: QuizVisibility) => {
    onVisibilityChange(quiz.id, visibility);
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
              {formatDate(quiz.createdAt)}
            </CardDescription>
          </div>
          {quiz.visibility !== QuizVisibility.PRIVATE && (
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
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {quiz.totalQuestions} questions
            </span>
          </div>
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
        </div>
      </CardContent>
    </Card>
  );
}
