import React from "react";
import {
  createFileRoute,
  useLocation,
  useRouter,
} from "@tanstack/react-router";
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
import PdfViewer from "@/presentation/components/attempt/pdf-viewer";
import { getUserFriendlyMessage } from "@/presentation/lib";

export const Route = createFileRoute("/quiz/a/$slug")({
  loader: async ({ params, context }) => {
    const userId = context.session?.user?.id ?? null;

    // Start attempt is a mutation-like operation, called in loader for UX
    const result = await startAttempt({
      data: { quizSlug: params.slug, userId },
    });

    // Use cached quiz details
    const quizDetails = await context.queryClient.ensureQueryData(
      quizBySlugQueryOptions(params.slug, userId)
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

  // Track whether user has made a choice on resume dialog
  const isInProgressAttempt =
    !attemptResult.isNewAttempt && !attemptResult.existingAttemptSummary;
  const hasAnswers = Object.keys(attemptResult.attempt.answers).length > 0;

  const { resume } = useLocation({
    select: (s) => ({
      resume: s.state.resume,
    }),
  });

  // Show dialog only if in-progress with existing answers
  const [showResumeDialog, setShowResumeDialog] = React.useState(
    isInProgressAttempt && hasAnswers && !resume
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
      router.navigate({
        to: "/quiz/a/$slug",
        params: { slug },
        replace: true,
      });
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
      setShowResumeDialog(false);
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
    resetAttemptMutation.mutate();
  };

  React.useEffect(() => {
    setShowResumeDialog(isInProgressAttempt && hasAnswers && !resume);
  }, [isInProgressAttempt, hasAnswers, resume]);

  // New attempt - show the quiz immediately
  if (attemptResult.isNewAttempt) {
    return (
      <QuizAttemptView
        quiz={quizDetails.quiz}
        questions={quizDetails.questions}
        attemptId={attemptResult.attempt.id}
        userId={session?.user?.id ?? null}
      />
    );
  }

  // Existing submitted attempts - show completion screen
  if (attemptResult.existingAttemptSummary) {
    return (
      <ExistingAttemptCard
        slug={slug}
        summary={attemptResult.existingAttemptSummary}
        onStartNewAttempt={() => forceStartMutation.mutate()}
        isStarting={forceStartMutation.isPending}
      />
    );
  }

  // In-progress attempt - show dialog if has answers, otherwise show quiz
  return (
    <>
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
      />
    </>
  );
}
