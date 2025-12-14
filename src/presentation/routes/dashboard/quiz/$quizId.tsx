import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  useSuspenseQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/presentation/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/card";
import { Badge } from "@/presentation/components/ui/badge";
import { Separator } from "@/presentation/components/ui/separator";
import { Skeleton } from "@/presentation/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/presentation/components/ui/dialog";
import { quizDetailQueryOptions } from "@/presentation/queries/quiz.queries";
import { deleteQuiz, shareQuiz } from "@/presentation/server-functions";
import { QuestionCard } from "@/presentation/components/quiz/question-card";
import { ShareLinkGenerator } from "@/presentation/components/shared/share-link-generator";
import {
  ArrowLeft,
  Share2,
  Trash2,
  Eye,
  Calendar,
  FileText,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/dashboard/quiz/$quizId")({
  loader: ({ context: { queryClient, user }, params: { quizId } }) =>
    queryClient.ensureQueryData(quizDetailQueryOptions(quizId, user.id)),
  pendingComponent: QuizDetailSkeleton,
  component: QuizDetailPage,
});

function QuizDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-8 w-64" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function QuizDetailPage() {
  const { quizId } = Route.useParams();
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: response } = useSuspenseQuery(
    quizDetailQueryOptions(quizId, user.id)
  );
  const quiz = response.quiz;

  const deleteMutation = useMutation({
    mutationFn: () => deleteQuiz({ data: { quizId, userId: user.id } }),
    onSuccess: () => {
      toast.success("Quiz deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
      navigate({ to: "/dashboard" });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete quiz"
      );
    },
  });

  const shareMutation = useMutation({
    mutationFn: () => shareQuiz({ data: { quizId, userId: user.id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes", quizId] });
      toast.success(
        quiz.isPublic ? "Quiz is now private" : "Quiz is now public!"
      );
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to share quiz"
      );
    },
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">
                {quiz.title}
              </h1>
              {quiz.isPublic && <Badge>Public</Badge>}
            </div>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <Calendar className="h-4 w-4" />
              Created {formatDate(quiz.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {quiz.isPublic && (
            <Button variant="outline" size="sm" asChild>
              <Link to="/quiz/$quizId/public" params={{ quizId }}>
                <Eye className="mr-2 h-4 w-4" />
                View Public
              </Link>
            </Button>
          )}

          <ShareLinkGenerator
            quizId={quizId}
            isPublic={quiz.isPublic}
            onToggleShare={() => shareMutation.mutate()}
            isLoading={shareMutation.isPending}
          />

          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Quiz</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete "{quiz.title}"? This action
                  cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quiz Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Quiz Overview
          </CardTitle>
          <CardDescription>
            {quiz.totalQuestions} questions in this quiz
          </CardDescription>
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
              <p className="text-muted-foreground">Situational</p>
              <p className="text-2xl font-bold">
                {quiz.distribution.situational}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Questions</h2>
        <div className="space-y-4">
          {response.questions.map((question, index) => (
            <QuestionCard
              key={question.id}
              question={question}
              index={index + 1}
              showAnswer
            />
          ))}
        </div>
      </div>
    </div>
  );
}
