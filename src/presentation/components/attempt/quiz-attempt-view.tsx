import React from "react";
import { useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/presentation/components/ui/badge";
import { Cloud, CloudOff, HardDrive, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { submitAttempt } from "@/presentation/server-functions";
import { attemptKeys } from "@/presentation/queries";
import { getUserFriendlyMessage } from "@/presentation/lib";
import {
  useAnswerPersistence,
  addAnonymousAttempt,
  markLocalAnswersSubmitted,
} from "@/presentation/hooks";
import {
  QuestionCard,
  type Question,
} from "@/presentation/components/quiz/question-card";
import { AnonymousCompletionDialog } from "./anonymous-completion-dialog";

interface Quiz {
  id: string;
  slug: string;
  title: string;
  totalQuestions: number;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * State for each question in the sequential flow:
 * - `selecting`: User is selecting an answer
 * - `checked`: User has checked the answer and received feedback
 */
type QuestionState = "selecting" | "checked";

interface QuizAttemptViewProps {
  quiz: Quiz;
  questions: Question[];
  attemptId: string;
  userId: string | null;
  /** Initial answers (for resuming in-progress attempts) */
  initialAnswers?: Record<string, string>;
  /** Initial checked question IDs (for resuming anonymous attempts from localStorage) */
  initialCheckedQuestions?: string[];
  /** Question IDs whose answers are locked (from retake - correct answers carried over) */
  lockedQuestionIds?: string[];
}

/**
 * Creates a stable string key from questions and answers for comparison.
 * This prevents useEffect loops when props have same content but new references.
 */
function useStableKey(
  questions: Question[],
  initialAnswers: Record<string, string>,
): string {
  return React.useMemo(() => {
    const questionIds = questions.map((q) => q.id).join(",");
    const answerEntries = Object.entries(initialAnswers)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join(",");
    return `${questionIds}|${answerEntries}`;
  }, [questions, initialAnswers]);
}

export function QuizAttemptView({
  quiz,
  questions,
  attemptId,
  userId,
  initialAnswers = {},
  initialCheckedQuestions = [],
  lockedQuestionIds = [],
}: QuizAttemptViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const lockedSet = React.useMemo(
    () => new Set(lockedQuestionIds),
    [lockedQuestionIds],
  );

  // In retake mode, filter out locked (correct) questions — user only sees wrong ones
  const isRetakeMode = lockedQuestionIds.length > 0;
  const visibleQuestions = React.useMemo(
    () =>
      isRetakeMode ? questions.filter((q) => !lockedSet.has(q.id)) : questions,
    [questions, lockedSet, isRetakeMode],
  );

  // Calculate starting index based on initial answers (for resuming)
  const getStartingIndex = React.useCallback(() => {
    // Find the first question that hasn't been answered
    const firstUnanswered = visibleQuestions.findIndex(
      (q) => !initialAnswers[q.id],
    );
    return firstUnanswered === -1
      ? visibleQuestions.length - 1
      : firstUnanswered;
  }, [visibleQuestions, initialAnswers]);

  const getInitialQuestionState = React.useCallback(
    (startIdx: number): QuestionState => {
      const question = visibleQuestions[startIdx];
      if (!question) return "selecting";
      return initialAnswers[question.id] ? "checked" : "selecting";
    },
    [visibleQuestions, initialAnswers],
  );

  const [currentIndex, setCurrentIndex] = React.useState(getStartingIndex);
  const [answers, setAnswers] =
    React.useState<Record<string, string>>(initialAnswers);
  // Track which questions have been checked (locked)
  // Merge keys from initialAnswers and initialCheckedQuestions for anonymous resume
  const [checkedQuestions, setCheckedQuestions] = React.useState<Set<string>>(
    () => {
      const keys = new Set(Object.keys(initialAnswers));
      for (const qId of initialCheckedQuestions) keys.add(qId);
      return keys;
    },
  );
  // Current question state: selecting or checked
  const [questionState, setQuestionState] = React.useState<QuestionState>(() =>
    getInitialQuestionState(getStartingIndex()),
  );
  // Temporary selection for current question (before checking)
  const [currentSelection, setCurrentSelection] = React.useState<
    string | undefined
  >(undefined);
  const [isChecking, setIsChecking] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  // Anonymous completion state: holds score when anonymous user finishes
  const [anonymousResult, setAnonymousResult] = React.useState<{
    score: number;
  } | null>(null);
  const [isTryingAgain, setIsTryingAgain] = React.useState(false);

  const { saveStatus, saveAnswer, removeAnswer, clearAnswers, isLocal } =
    useAnswerPersistence(attemptId, userId, quiz.slug);

  // Create a stable key to detect actual content changes (not just reference changes)
  const stableKey = useStableKey(questions, initialAnswers);
  // Track previous key to detect real changes
  const prevKeyRef = React.useRef(stableKey);
  const isInitialMount = React.useRef(true);

  const currentQuestion = visibleQuestions[currentIndex];
  const isLastQuestion = currentIndex === visibleQuestions.length - 1;
  const completedCount = checkedQuestions.size;

  // Handle option selection (before checking)
  const handleSelectAnswer = (optionIndex: string) => {
    if (questionState === "selecting") {
      setCurrentSelection(optionIndex);
    }
  };

  // Handle checking the answer
  const handleCheckAnswer = async () => {
    if (!currentSelection || !currentQuestion) return;

    setIsChecking(true);
    try {
      // Save the answer to the server
      await saveAnswer(currentQuestion.id, currentSelection);

      // Update local state
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: currentSelection,
      }));
      setCheckedQuestions((prev) => new Set(prev).add(currentQuestion.id));
      setQuestionState("checked");
    } catch (error) {
      toast.error("Failed to save answer", {
        description: getUserFriendlyMessage(error, "attempt"),
      });
    } finally {
      setIsChecking(false);
    }
  };

  // Handle moving to next question
  const handleNext = () => {
    if (isLastQuestion) {
      handleFinish();
    } else {
      setCurrentIndex((i) => i + 1);
      setQuestionState("selecting");
      setCurrentSelection(undefined);
    }
  };

  const handleTryAgain = async () => {
    if (!currentQuestion) return;

    setIsTryingAgain(true);
    try {
      await removeAnswer(currentQuestion.id);

      setAnswers((prev) => {
        const next = { ...prev };
        delete next[currentQuestion.id];
        return next;
      });
      setCheckedQuestions((prev) => {
        const next = new Set(prev);
        next.delete(currentQuestion.id);
        return next;
      });
      setQuestionState("selecting");
      setCurrentSelection(undefined);
    } catch (error) {
      toast.error("Failed to retry question", {
        description: getUserFriendlyMessage(error, "attempt"),
      });
    } finally {
      setIsTryingAgain(false);
    }
  };

  // Handle finishing the quiz
  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      // Calculate score
      let correctCount = 0;
      for (const question of questions) {
        const selectedOption = answers[question.id];
        const correctOption = question.options.find((o) => o.isCorrect);
        if (
          selectedOption &&
          correctOption &&
          selectedOption === correctOption.index
        ) {
          correctCount++;
        }
      }
      const score = (correctCount / questions.length) * 100;

      // Submit the attempt
      const attemptResult = await submitAttempt({
        data: { attemptId, userId, score, answers },
      });

      if (userId) {
        // Authenticated user: normal flow
        toast.success("Quiz completed!", {
          description: `You scored ${score.toFixed(0)}%`,
        });

        clearAnswers();

        queryClient.invalidateQueries({
          queryKey: attemptKeys.list(quiz.slug, userId),
        });

        router.navigate({
          to: "/quiz/h/$slug/$attemptSlug",
          params: {
            slug: quiz.slug,
            attemptSlug: attemptResult.attempt.slug,
          },
        });
      } else {
        // Anonymous user: keep localStorage, track attempt, show dialog
        addAnonymousAttempt(attemptId, quiz.slug);
        markLocalAnswersSubmitted(quiz.slug, attemptId);
        setAnonymousResult({ score });
      }
    } catch (error) {
      toast.error("Failed to submit quiz", {
        description: getUserFriendlyMessage(error, "attempt"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset state when questions or initialAnswers actually change (content-based comparison)
  // Using stableKey prevents loops when props have new references but same content
  React.useEffect(() => {
    // Skip effect on initial mount (state is already initialized correctly)
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Only reset if the content actually changed
    if (prevKeyRef.current === stableKey) {
      return;
    }
    prevKeyRef.current = stableKey;

    const startIdx = getStartingIndex();
    setCurrentIndex(startIdx);
    setAnswers(initialAnswers);
    setCheckedQuestions(new Set(Object.keys(initialAnswers)));
    setQuestionState(getInitialQuestionState(startIdx));
    setCurrentSelection(undefined);
  }, [stableKey, getStartingIndex, getInitialQuestionState, initialAnswers]);

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-muted/20 py-8">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <p>No questions available for this quiz.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 py-8">
      <div className="container max-w-4xl mx-auto px-4">
        <ProgressHeader
          title={quiz.title}
          completedCount={completedCount}
          totalQuestions={visibleQuestions.length}
          currentIndex={currentIndex}
          saveStatus={saveStatus}
          isLocal={isLocal}
          isRetakeMode={isRetakeMode}
        />

        {questionState === "selecting" ? (
          <QuestionCard
            question={currentQuestion}
            questionNumber={currentIndex + 1}
            state="selecting"
            selectedAnswer={currentSelection}
            onSelectAnswer={handleSelectAnswer}
            onCheckAnswer={handleCheckAnswer}
            isChecking={isChecking}
            isLastQuestion={isLastQuestion}
            quizId={quiz.id}
            userId={userId}
          />
        ) : (
          <QuestionCard
            question={currentQuestion}
            questionNumber={currentIndex + 1}
            state="checked"
            selectedAnswer={answers[currentQuestion.id] ?? ""}
            isLastQuestion={isLastQuestion}
            onNext={handleNext}
            onTryAgain={handleTryAgain}
            isTryingAgain={isTryingAgain}
            isSubmitting={isSubmitting}
            quizId={quiz.id}
            userId={userId}
          />
        )}
      </div>

      {/* Anonymous completion dialog */}
      {anonymousResult && (
        <AnonymousCompletionDialog
          open
          quizTitle={quiz.title}
          score={anonymousResult.score}
          currentPath={`/quiz/a/${quiz.slug}`}
        />
      )}
    </div>
  );
}

interface ProgressHeaderProps {
  title: string;
  completedCount: number;
  totalQuestions: number;
  currentIndex: number;
  saveStatus: SaveStatus;
  isLocal: boolean;
  isRetakeMode?: boolean;
}

function ProgressHeader({
  title,
  completedCount,
  totalQuestions,
  currentIndex,
  saveStatus,
  isLocal,
  isRetakeMode = false,
}: ProgressHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-display font-semibold">{title}</h1>
        <div className="flex items-center gap-3">
          <SaveStatusIndicator status={saveStatus} isLocal={isLocal} />
          <Badge variant="outline">
            Question {currentIndex + 1} of {totalQuestions}
          </Badge>
        </div>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-primary transition-all"
          style={{
            width: `${(currentIndex / totalQuestions) * 100}%`,
          }}
        />
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="h-3 w-3" />
        <span>
          {isRetakeMode
            ? "Retake mode — correct answers from your previous attempt are locked."
            : "Answers lock after you check."}
        </span>
      </div>
    </div>
  );
}

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  isLocal: boolean;
}

function SaveStatusIndicator({ status, isLocal }: SaveStatusIndicatorProps) {
  if (status === "idle") return null;

  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
      {status === "saving" && (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Saving...</span>
        </>
      )}
      {status === "saved" && isLocal && (
        <>
          <HardDrive className="h-3.5 w-3.5 text-emerald-600" />
          <span className="text-emerald-600">Saved locally</span>
        </>
      )}
      {status === "saved" && !isLocal && (
        <>
          <Cloud className="h-3.5 w-3.5 text-emerald-600" />
          <span className="text-emerald-600">Saved</span>
        </>
      )}
      {status === "error" && (
        <>
          <CloudOff className="h-3.5 w-3.5 text-rose-600" />
          <span className="text-rose-600">Save failed</span>
        </>
      )}
    </div>
  );
}
