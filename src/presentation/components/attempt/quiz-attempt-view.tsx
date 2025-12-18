import React from "react";
import { useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/presentation/components/ui/badge";
import { Cloud, CloudOff, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { autosaveAnswer, submitAttempt } from "@/presentation/server-functions";
import { attemptKeys } from "@/presentation/queries";
import {
  QuestionCard,
  type Question,
} from "@/presentation/components/quiz/question-card";

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
}

/**
 * Hook for saving answer when user checks it (no debouncing)
 */
function useSaveAnswer(attemptId: string, userId: string | null) {
  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>("idle");

  const saveAnswer = React.useCallback(
    async (questionId: string, optionIndex: string) => {
      setSaveStatus("saving");
      try {
        await autosaveAnswer({
          data: {
            attemptId,
            userId,
            questionId,
            optionIndex,
          },
        });
        setSaveStatus("saved");
        // Reset to idle after showing "saved" state
        setTimeout(() => setSaveStatus("idle"), 3000);
      } catch (error) {
        console.error("Save failed:", error);
        setSaveStatus("error");
        // Reset to idle after showing error
        setTimeout(() => setSaveStatus("idle"), 5000);
        throw error; // Re-throw to handle in the caller
      }
    },
    [attemptId, userId]
  );

  return { saveStatus, saveAnswer };
}

export function QuizAttemptView({
  quiz,
  questions,
  attemptId,
  userId,
  initialAnswers = {},
}: QuizAttemptViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Calculate starting index based on initial answers (for resuming)
  const getStartingIndex = React.useCallback(() => {
    // Find the first question that hasn't been answered
    const firstUnanswered = questions.findIndex((q) => !initialAnswers[q.id]);
    return firstUnanswered === -1 ? questions.length - 1 : firstUnanswered;
  }, [questions, initialAnswers]);

  const getInitialQuestionState = React.useCallback(
    (startIdx: number): QuestionState => {
      const question = questions[startIdx];
      if (!question) return "selecting";
      return initialAnswers[question.id] ? "checked" : "selecting";
    },
    [questions, initialAnswers]
  );

  const [currentIndex, setCurrentIndex] = React.useState(getStartingIndex);
  const [answers, setAnswers] =
    React.useState<Record<string, string>>(initialAnswers);
  // Track which questions have been checked (locked)
  const [checkedQuestions, setCheckedQuestions] = React.useState<Set<string>>(
    () => new Set(Object.keys(initialAnswers))
  );
  // Current question state: selecting or checked
  const [questionState, setQuestionState] = React.useState<QuestionState>(() =>
    getInitialQuestionState(getStartingIndex())
  );
  // Temporary selection for current question (before checking)
  const [currentSelection, setCurrentSelection] = React.useState<
    string | undefined
  >(undefined);
  const [isChecking, setIsChecking] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const { saveStatus, saveAnswer } = useSaveAnswer(attemptId, userId);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
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
    } catch {
      toast.error("Failed to save answer. Please try again.");
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

      toast.success("Quiz completed!", {
        description: `You scored ${score.toFixed(0)}%`,
      });

      // Invalidate attempt history cache
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: attemptKeys.list(quiz.slug, userId),
        });
      }

      // Navigate to the attempt result page
      router.navigate({
        to: "/quiz/h/$slug/$attemptSlug",
        params: {
          slug: quiz.slug,
          attemptSlug: attemptResult.attempt.slug,
        },
      });
    } catch (error) {
      toast.error("Failed to submit quiz", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset state when questions or initialAnswers change
  React.useEffect(() => {
    const startIdx = getStartingIndex();
    setCurrentIndex(startIdx);
    setAnswers(initialAnswers);
    setCheckedQuestions(new Set(Object.keys(initialAnswers)));
    setQuestionState(getInitialQuestionState(startIdx));
    setCurrentSelection(undefined);
  }, [questions, initialAnswers, getStartingIndex, getInitialQuestionState]);

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
          totalQuestions={questions.length}
          currentIndex={currentIndex}
          saveStatus={saveStatus}
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
          />
        ) : (
          <QuestionCard
            question={currentQuestion}
            questionNumber={currentIndex + 1}
            state="checked"
            selectedAnswer={answers[currentQuestion.id] ?? ""}
            isLastQuestion={isLastQuestion}
            onNext={handleNext}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
}

interface ProgressHeaderProps {
  title: string;
  completedCount: number;
  totalQuestions: number;
  currentIndex: number;
  saveStatus: SaveStatus;
}

function ProgressHeader({
  title,
  completedCount,
  totalQuestions,
  currentIndex,
  saveStatus,
}: ProgressHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-semibold">{title}</h1>
        <div className="flex items-center gap-3">
          <SaveStatusIndicator status={saveStatus} />
          <Badge variant="outline">
            Question {currentIndex + 1} of {totalQuestions}
          </Badge>
        </div>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${(completedCount / totalQuestions) * 100}%` }}
        />
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="h-3 w-3" />
        <span>Answers lock after you check.</span>
      </div>
    </div>
  );
}

interface SaveStatusIndicatorProps {
  status: SaveStatus;
}

function SaveStatusIndicator({ status }: SaveStatusIndicatorProps) {
  if (status === "idle") return null;

  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
      {status === "saving" && (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Saving...</span>
        </>
      )}
      {status === "saved" && (
        <>
          <Cloud className="h-3.5 w-3.5 text-green-600" />
          <span className="text-green-600">Saved</span>
        </>
      )}
      {status === "error" && (
        <>
          <CloudOff className="h-3.5 w-3.5 text-destructive" />
          <span className="text-destructive">Save failed</span>
        </>
      )}
    </div>
  );
}
