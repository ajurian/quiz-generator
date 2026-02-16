import React from "react";
import {
  createFileRoute,
  Link,
  useLocation,
  useRouter,
} from "@tanstack/react-router";
import { z } from "zod";
import { Brain } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  startAttempt,
  forceStartAttempt,
  resetAttempt,
} from "@/presentation/server-functions";
import { quizBySlugQueryOptions, attemptKeys } from "@/presentation/queries";
import { toast } from "sonner";
import {
  AttemptQuizSkeleton,
  ExistingAttemptCard,
  QuizAttemptView,
  ResumeAttemptDialog,
} from "@/presentation/components/attempt";
import { getUserFriendlyMessage } from "@/presentation/lib";
import { getLocalAnswers } from "@/presentation/hooks";

const searchSchema = z.object({
  parent: z.string().optional(),
});

export const Route = createFileRoute("/quiz/a/$slug")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ parent: search.parent }),
  loader: async ({ params, context, deps }) => {
    const userId = context.session?.user?.id ?? null;

    // Start attempt is a mutation-like operation, called in loader for UX
    const result = await startAttempt({
      data: {
        quizSlug: params.slug,
        userId,
        parentAttemptId: deps.parent,
      },
    });

    // Use cached quiz details
    const quizDetails = await context.queryClient.ensureQueryData(
      quizBySlugQueryOptions(params.slug, userId),
    );

    return { attemptResult: result, quizDetails, userId };
  },
  pendingComponent: AttemptQuizSkeleton,
  component: AttemptQuizPage,
});

function AttemptQuizPage() {
  const { slug } = Route.useParams();
  const { session } = Route.useRouteContext();
  const { attemptResult, quizDetails, userId } = Route.useLoaderData();
  const router = useRouter();
  const queryClient = useQueryClient();

  // For anonymous users, check localStorage for saved answers
  const localData = React.useMemo(
    () => (userId === null ? getLocalAnswers(slug) : null),
    [userId, slug],
  );
  const localAnswers = localData?.answers ?? {};
  const localCheckedQuestions = localData?.checkedQuestions ?? [];
  const hasLocalAnswers = Object.keys(localAnswers).length > 0;

  // Track whether user has made a choice on resume dialog
  const isInProgressAttempt =
    !attemptResult.isNewAttempt && !attemptResult.existingAttemptSummary;
  const hasServerAnswers =
    Object.keys(attemptResult.attempt.answers).length > 0;
  const hasAnswers = hasServerAnswers || hasLocalAnswers;

  const { resume } = useLocation({
    select: (s) => ({
      resume: s.state.resume,
    }),
  });

  // Show dialog if in-progress with existing answers (server or local)
  const [showResumeDialog, setShowResumeDialog] = React.useState(
    (isInProgressAttempt && hasAnswers && !resume) ||
      (attemptResult.isNewAttempt &&
        hasLocalAnswers &&
        userId === null &&
        !resume),
  );

  const forceStartMutation = useMutation({
    mutationFn: async () => {
      return forceStartAttempt({
        data: {
          quizSlug: slug,
          userId: session?.user?.id ?? null,
        },
      });
    },
    onSuccess: () => {
      toast.success("New attempt started!");
      // Invalidate user's attempt history for this quiz if logged in
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: attemptKeys.list(slug, userId),
        });
      }
      router.invalidate();
    },
    onError: (error) => {
      toast.error("Failed to start attempt", {
        description: getUserFriendlyMessage(error, "attempt"),
      });
    },
  });

  const resetAttemptMutation = useMutation({
    mutationFn: async () => {
      return resetAttempt({
        data: {
          attemptId: attemptResult.attempt.id,
          userId: session?.user?.id ?? null,
        },
      });
    },
    onSuccess: async () => {
      toast.success("Starting fresh!");
      router.invalidate();
    },
    onError: (error) => {
      toast.error("Failed to reset attempt", {
        description: getUserFriendlyMessage(error, "attempt"),
      });
    },
  });

  const handleContinue = () => {
    setShowResumeDialog(false);
  };

  const handleStartOver = () => {
    // For anonymous users, clear localStorage instead of calling server reset
    if (userId === null) {
      try {
        localStorage.removeItem(`quiz-answers:${slug}`);
      } catch {
        // Ignore cleanup errors
      }
      toast.success("Starting fresh!");
      router.invalidate();
      return;
    }
    resetAttemptMutation.mutate();
  };

  React.useEffect(() => {
    setShowResumeDialog(
      (isInProgressAttempt && hasAnswers && !resume) ||
        (attemptResult.isNewAttempt &&
          hasLocalAnswers &&
          userId === null &&
          !resume),
    );
  }, [
    isInProgressAttempt,
    hasAnswers,
    hasLocalAnswers,
    resume,
    attemptResult.isNewAttempt,
    userId,
  ]);

  const quizGemLogo = (
    <div className="bg-muted/20 pt-4">
      <div className="container max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Brain className="h-4 w-4" />
          </div>
          <span className="font-display font-semibold tracking-tight">
            QuizGem
          </span>
        </Link>
      </div>
    </div>
  );

  // New attempt - show the quiz immediately (with local answers for anonymous resume)
  if (attemptResult.isNewAttempt) {
    return (
      <>
        {quizGemLogo}
        {hasLocalAnswers && userId === null && (
          <ResumeAttemptDialog
            open={showResumeDialog}
            onContinue={handleContinue}
            onStartOver={handleStartOver}
            isResetting={false}
            answeredCount={Object.keys(localAnswers).length}
            totalQuestions={quizDetails.questions.length}
          />
        )}
        <QuizAttemptView
          quiz={quizDetails.quiz}
          questions={quizDetails.questions}
          attemptId={attemptResult.attempt.id}
          userId={session?.user?.id ?? null}
          initialAnswers={
            hasLocalAnswers && userId === null ? localAnswers : undefined
          }
          initialCheckedQuestions={
            hasLocalAnswers && userId === null
              ? localCheckedQuestions
              : undefined
          }
          lockedQuestionIds={attemptResult.attempt.lockedQuestionIds}
        />
      </>
    );
  }

  // Existing submitted attempts - show completion screen
  if (attemptResult.existingAttemptSummary) {
    return (
      <>
        {quizGemLogo}
        <ExistingAttemptCard
          slug={slug}
          summary={attemptResult.existingAttemptSummary}
          onStartNewAttempt={() => forceStartMutation.mutate()}
          isStarting={forceStartMutation.isPending}
        />
      </>
    );
  }

  // In-progress attempt - show dialog if has answers, otherwise show quiz
  return (
    <>
      {quizGemLogo}
      <ResumeAttemptDialog
        open={showResumeDialog}
        onContinue={handleContinue}
        onStartOver={handleStartOver}
        isResetting={resetAttemptMutation.isPending}
        answeredCount={Object.keys(attemptResult.attempt.answers).length}
        totalQuestions={quizDetails.questions.length}
      />
      <QuizAttemptView
        quiz={quizDetails.quiz}
        questions={quizDetails.questions}
        attemptId={attemptResult.attempt.id}
        userId={session?.user?.id ?? null}
        initialAnswers={attemptResult.attempt.answers}
        initialCheckedQuestions={Object.keys(attemptResult.attempt.answers)}
        lockedQuestionIds={attemptResult.attempt.lockedQuestionIds}
      />
    </>
  );
}
