import { Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/card";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { Calendar, ChevronRight, FileText, Share2, Globe } from "lucide-react";

interface QuizCardProps {
  quiz: {
    id: string;
    title: string;
    createdAt: string;
    totalQuestions: number;
    isPublic: boolean;
  };
}

export function QuizCard({ quiz }: QuizCardProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card className="group relative overflow-hidden transition-all hover:border-primary/30 hover:shadow-lg">
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      
      <CardHeader className="relative pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="truncate text-lg font-semibold tracking-tight">
              {quiz.title}
            </CardTitle>
            <CardDescription className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(quiz.createdAt)}
            </CardDescription>
          </div>
          {quiz.isPublic && (
            <Badge 
              variant="secondary" 
              className="flex-shrink-0 gap-1 bg-primary/10 text-primary hover:bg-primary/15"
            >
              <Globe className="h-3 w-3" />
              Public
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
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
            asChild
          >
            <Link to="/dashboard/quiz/$quizId" params={{ quizId: quiz.id }}>
              View
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
