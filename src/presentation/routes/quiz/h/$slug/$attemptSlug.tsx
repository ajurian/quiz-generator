import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "@/presentation/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/card";
import { Badge } from "@/presentation/components/ui/badge";
import { Skeleton } from "@/presentation/components/ui/skeleton";
import { attemptDetailQueryOptions } from "@/presentation/queries";
import { AttemptStatus } from "@/domain";
import {
  Clock,
  Play,
  Trophy,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Lightbulb,
} from "lucide-react";

export const Route = createFileRoute("/quiz/h/$slug/$attemptSlug")({
  loader: async ({ params, context }) => {
    const userId = context.session?.user?.id ?? null;
    const result = await context.queryClient.ensureQueryData(
      attemptDetailQueryOptions(params.slug, params.attemptSlug, userId)
    );

    // Redirect in-progress attempts to the take quiz page
    if (result.attempt.status === AttemptStatus.IN_PROGRESS) {
      throw redirect({ to: "/quiz/a/$slug", params: { slug: params.slug } });
    }

    return { userId };
  },
  pendingComponent: AttemptDetailSkeleton,
  component: AttemptDetailPage,
});

function AttemptDetailSkeleton() {
  return (
    <div className="min-h-screen bg-muted/20 py-8">
      <div className="container max-w-4xl mx-auto px-4">
        <Skeleton className="h-8 w-64 mb-6" />
        <Card className="mb-6">
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
        </Card>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="py-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function AttemptDetailPage() {
  const { slug, attemptSlug } = Route.useParams();
  const { userId } = Route.useLoaderData();
  const { data } = useSuspenseQuery(
    attemptDetailQueryOptions(slug, attemptSlug, userId)
  );
  const { quiz, attempt, questions } = data;

  // Note: In-progress attempts are redirected to /quiz/a/$slug in the loader

  return (
    <div className="min-h-screen bg-muted/20 py-8">
      <div className="container max-w-4xl mx-auto px-4">
        {/* Back Link */}
        <Link
          to="/quiz/h/$slug"
          params={{ slug }}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Attempts
        </Link>

        {/* Summary Card */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">{quiz.title}</CardTitle>
                <CardDescription>
                  Attempt on {new Date(attempt.startedAt).toLocaleDateString()}{" "}
                  at {new Date(attempt.startedAt).toLocaleTimeString()}
                </CardDescription>
              </div>
              <Badge
                variant="default"
                className="bg-green-500/10 text-green-500"
              >
                Completed
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-lg bg-muted/50">
                <Trophy className="h-5 w-5 mx-auto mb-2 text-yellow-500" />
                <div className="text-2xl font-bold">
                  {attempt.score !== null
                    ? `${attempt.score.toFixed(0)}%`
                    : "N/A"}
                </div>
                <div className="text-xs text-muted-foreground">Score</div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <Clock className="h-5 w-5 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold">
                  {attempt.formattedDuration ?? "N/A"}
                </div>
                <div className="text-xs text-muted-foreground">Duration</div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <CheckCircle2 className="h-5 w-5 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold">{questions.length}</div>
                <div className="text-xs text-muted-foreground">Questions</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions Review */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Questions Review</h2>
            <Button asChild>
              <Link to="/quiz/a/$slug" params={{ slug }}>
                <Play className="h-4 w-4 mr-2" />
                Try Again
              </Link>
            </Button>
          </div>

          {questions.map((question, index) => {
            const userAnswer = attempt.answers[question.id];
            const correctOption = question.options.find((o) => o.isCorrect);
            const userWasCorrect = userAnswer === correctOption?.index;

            return (
              <Card key={question.id}>
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">Question {index + 1}</Badge>
                    <Badge variant="outline" className="capitalize">
                      {question.questionType.replace(/_/g, " ")}
                    </Badge>
                    {userAnswer && (
                      <Badge
                        variant={userWasCorrect ? "default" : "destructive"}
                        className={
                          userWasCorrect
                            ? "bg-green-500/10 text-green-500"
                            : "bg-red-500/10 text-red-500"
                        }
                      >
                        {userWasCorrect ? "Correct" : "Incorrect"}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-base leading-relaxed">
                    {question.questionText}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Options */}
                  <div className="space-y-2">
                    {question.options.map((option) => {
                      const isCorrect = option.isCorrect;
                      const isUserAnswer = userAnswer === option.index;
                      const isWrongUserAnswer = isUserAnswer && !isCorrect;

                      return (
                        <div
                          key={option.index}
                          className={`p-3 rounded-lg border ${
                            isCorrect
                              ? "border-green-500 bg-green-500/5"
                              : isWrongUserAnswer
                                ? "border-red-500 bg-red-500/5"
                                : "border-border"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                                isCorrect
                                  ? "bg-green-500 text-white"
                                  : isWrongUserAnswer
                                    ? "bg-red-500 text-white"
                                    : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {option.index}
                            </span>
                            <div className="flex-1">
                              <span
                                className={
                                  isCorrect || isUserAnswer ? "font-medium" : ""
                                }
                              >
                                {option.text}
                              </span>
                              {isCorrect && (
                                <CheckCircle2 className="inline h-4 w-4 ml-2 text-green-500" />
                              )}
                              {isWrongUserAnswer && (
                                <XCircle className="inline h-4 w-4 ml-2 text-red-500" />
                              )}
                              {isUserAnswer && (
                                <span className="ml-2 text-xs text-muted-foreground">
                                  (Your answer)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation for correct answer */}
                  {correctOption?.explanation && (
                    <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="h-4 w-4 mt-0.5 text-blue-500 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-medium text-blue-500 mb-1">
                            Explanation
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {correctOption.explanation}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
