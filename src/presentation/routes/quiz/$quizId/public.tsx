import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/card";
import { Badge } from "@/presentation/components/ui/badge";
import { Skeleton } from "@/presentation/components/ui/skeleton";
import { quizPublicQueryOptions } from "@/presentation/queries/quiz.queries";
import { QuestionCard } from "@/presentation/components/quiz/question-card";
import { Brain, Calendar, FileText } from "lucide-react";
import { useState } from "react";
import { Button } from "@/presentation/components/ui/button";

export const Route = createFileRoute("/quiz/$quizId/public")({
  loader: ({ context: { queryClient }, params: { quizId } }) =>
    queryClient.ensureQueryData(quizPublicQueryOptions(quizId)),
  pendingComponent: PublicQuizSkeleton,
  errorComponent: PublicQuizError,
  component: PublicQuizPage,
});

function PublicQuizSkeleton() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container max-w-4xl py-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-48" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

function PublicQuizError() {
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Quiz Not Found</CardTitle>
          <CardDescription>
            This quiz doesn't exist or is not publicly available.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

function PublicQuizPage() {
  const { quizId } = Route.useParams();
  const { data: response } = useSuspenseQuery(quizPublicQueryOptions(quizId));
  const quiz = response.quiz;
  const [showAnswers, setShowAnswers] = useState(false);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            <span className="font-bold">Quiz Generator</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-4xl py-8 space-y-6">
        {/* Quiz Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">{quiz.title}</h1>
            <Badge>Public Quiz</Badge>
          </div>
          <p className="text-muted-foreground flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Created {formatDate(quiz.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              {quiz.totalQuestions} questions
            </span>
          </p>
        </div>

        {/* Quiz Info */}
        <Card>
          <CardHeader>
            <CardTitle>Question Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Single Best Answer</p>
                <p className="text-2xl font-bold">
                  {quiz.distribution.singleBestAnswer}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Two Statements</p>
                <p className="text-2xl font-bold">
                  {quiz.distribution.twoStatements}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Contextual</p>
                <p className="text-2xl font-bold">
                  {quiz.distribution.contextual}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Toggle Answers */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => setShowAnswers(!showAnswers)}
          >
            {showAnswers ? "Hide Answers" : "Show Answers"}
          </Button>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {response.questions.map((question, index) => (
            <QuestionCard
              key={question.id}
              question={question}
              index={index + 1}
              showAnswer={showAnswers}
            />
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background mt-12">
        <div className="container py-6">
          <p className="text-sm text-muted-foreground text-center">
            Created with Quiz Generator - Powered by Google Gemini AI
          </p>
        </div>
      </footer>
    </div>
  );
}
