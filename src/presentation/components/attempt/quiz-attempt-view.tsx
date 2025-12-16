import React from "react";
import { useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/card";
import { ArrowRight, Cloud, CloudOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { autosaveAnswer } from "@/presentation/server-functions";
import { attemptKeys } from "@/presentation/queries";

interface QuestionOption {
  index: string;
  text: string;
  explanation: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  questionText: string;
  questionType: string;
  options: QuestionOption[];
  orderIndex: number;
}

interface Quiz {
  id: string;
  slug: string;
  title: string;
  totalQuestions: number;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface QuizAttemptViewProps {
  quiz: Quiz;
  questions: Question[];
  attemptId: string;
  userId: string | null;
  /** Initial answers (for resuming in-progress attempts) */
  initialAnswers?: Record<string, string>;
}

/**
 * Custom hook for debounced autosave functionality
 */
function useAutosave(
  attemptId: string,
  userId: string | null,
  debounceMs: number = 500
) {
  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>("idle");
  const pendingRef = React.useRef<{
    questionId: string;
    optionIndex: string;
  } | null>(null);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = React.useRef(false);

  const processSave = React.useCallback(async () => {
    if (!pendingRef.current || isSavingRef.current) return;

    const { questionId, optionIndex } = pendingRef.current;
    pendingRef.current = null;
    isSavingRef.current = true;
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
      // Reset to idle after a short delay to show "saved" state
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      console.error("Autosave failed:", error);
      setSaveStatus("error");
      // Retry logic: re-queue the failed save
      pendingRef.current = { questionId, optionIndex };
      setTimeout(() => {
        if (pendingRef.current) {
          processSave();
        }
      }, 3000); // Retry after 3 seconds
    } finally {
      isSavingRef.current = false;
    }
  }, [attemptId, userId]);

  const saveAnswer = React.useCallback(
    (questionId: string, optionIndex: string) => {
      // Update pending save
      pendingRef.current = { questionId, optionIndex };

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new debounced timeout
      timeoutRef.current = setTimeout(() => {
        processSave();
      }, debounceMs);
    },
    [debounceMs, processSave]
  );

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

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
  const [currentIndex, setCurrentIndex] = React.useState(() =>
    // Jump to first unanswered question
    questions.findIndex((q) => !initialAnswers[q.id])
  );
  const [answers, setAnswers] =
    React.useState<Record<string, string>>(initialAnswers);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const { saveStatus, saveAnswer } = useAutosave(attemptId, userId);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const answeredCount = Object.keys(answers).length;

  const handleAnswer = (questionId: string, optionIndex: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
    // Trigger autosave with debounce
    saveAnswer(questionId, optionIndex);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
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

      const { submitAttempt } = await import("@/presentation/server-functions");
      await submitAttempt({ data: { attemptId, userId, score, answers } });

      toast.success("Quiz submitted!", {
        description: `You scored ${score.toFixed(0)}%`,
      });

      // Invalidate attempt history cache so the history page shows updated data
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: attemptKeys.list(quiz.slug, userId),
        });
      }

      router.navigate({
        to: "/quiz/h/$slug",
        params: { slug: quiz.slug },
      });
    } catch (error) {
      toast.error("Failed to submit quiz", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  React.useEffect(() => {
    setCurrentIndex(() =>
      // Jump to first unanswered question
      questions.findIndex((q) => !initialAnswers[q.id])
    );
    setAnswers(initialAnswers);
  }, [questions, initialAnswers]);

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
          answeredCount={answeredCount}
          totalQuestions={questions.length}
          currentIndex={currentIndex}
          saveStatus={saveStatus}
        />

        <QuestionDisplay
          question={currentQuestion}
          currentIndex={currentIndex}
          selectedAnswer={answers[currentQuestion.id]}
          onAnswer={handleAnswer}
        />

        <QuestionNavigation
          currentIndex={currentIndex}
          totalQuestions={questions.length}
          answers={answers}
          questions={questions}
          isLastQuestion={isLastQuestion}
          isSubmitting={isSubmitting}
          answeredCount={answeredCount}
          onPrevious={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          onNext={() =>
            setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))
          }
          onJumpTo={setCurrentIndex}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}

interface ProgressHeaderProps {
  title: string;
  answeredCount: number;
  totalQuestions: number;
  currentIndex: number;
  saveStatus: SaveStatus;
}

function ProgressHeader({
  title,
  answeredCount,
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
            {answeredCount} / {totalQuestions} answered
          </Badge>
        </div>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
        />
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

interface QuestionDisplayProps {
  question: Question;
  currentIndex: number;
  selectedAnswer: string | undefined;
  onAnswer: (questionId: string, optionIndex: string) => void;
}

function QuestionDisplay({
  question,
  currentIndex,
  selectedAnswer,
  onAnswer,
}: QuestionDisplayProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary">Question {currentIndex + 1}</Badge>
          <Badge variant="outline" className="capitalize">
            {question.questionType.replace(/_/g, " ")}
          </Badge>
        </div>
        <CardTitle className="text-lg leading-relaxed">
          {question.questionText}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {question.options.map((option) => (
            <OptionButton
              key={option.index}
              option={option}
              isSelected={selectedAnswer === option.index}
              onClick={() => onAnswer(question.id, option.index)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface OptionButtonProps {
  option: QuestionOption;
  isSelected: boolean;
  onClick: () => void;
}

function OptionButton({ option, isSelected, onClick }: OptionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-lg border transition-all ${
        isSelected
          ? "border-primary bg-primary/5 ring-2 ring-primary"
          : "border-border hover:border-primary/50 hover:bg-muted/50"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium ${
            isSelected
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {option.index}
        </span>
        <span className="pt-0.5">{option.text}</span>
      </div>
    </button>
  );
}

interface QuestionNavigationProps {
  currentIndex: number;
  totalQuestions: number;
  answers: Record<string, string>;
  questions: Question[];
  isLastQuestion: boolean;
  isSubmitting: boolean;
  answeredCount: number;
  onPrevious: () => void;
  onNext: () => void;
  onJumpTo: (index: number) => void;
  onSubmit: () => void;
}

function QuestionNavigation({
  currentIndex,
  totalQuestions,
  answers,
  questions,
  isLastQuestion,
  isSubmitting,
  answeredCount,
  onPrevious,
  onNext,
  onJumpTo,
  onSubmit,
}: QuestionNavigationProps) {
  return (
    <div className="flex items-center justify-between">
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={currentIndex === 0}
      >
        Previous
      </Button>

      <div className="flex gap-2">
        {totalQuestions <= 20 && (
          <div className="hidden sm:flex items-center gap-1">
            {questions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => onJumpTo(i)}
                className={`w-3 h-3 rounded-full transition-all ${
                  i === currentIndex
                    ? "bg-primary scale-125"
                    : answers[q.id]
                      ? "bg-primary/60"
                      : "bg-muted"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {isLastQuestion ? (
        <Button
          onClick={onSubmit}
          disabled={isSubmitting || answeredCount < totalQuestions}
        >
          {isSubmitting ? "Submitting..." : "Submit Quiz"}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      ) : (
        <Button onClick={onNext}>
          Next
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      )}
    </div>
  );
}
