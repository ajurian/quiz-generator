import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/card";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Check,
  X,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Loader2,
  ArrowRight,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

export interface QuestionOption {
  index: string;
  text: string;
  explanation: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  orderIndex: number;
  type: string;
  stem: string;
  options: QuestionOption[];
}

/**
 * State machine for the QuestionCard:
 * - `selecting`: User can select/change options, primary CTA is "Check answer"
 * - `checked`: Answer has been evaluated, shows feedback, CTA is "Next" or "Submit"
 * - `review`: Read-only review mode (used on history page)
 */
export type QuestionCardState = "selecting" | "checked" | "review";

interface QuestionCardBaseProps {
  question: Question;
  /** 1-based question number */
  questionNumber: number;
}

interface QuestionCardSelectingProps extends QuestionCardBaseProps {
  state: "selecting";
  selectedAnswer: string | undefined;
  onSelectAnswer: (optionIndex: string) => void;
  onCheckAnswer: () => void;
  isChecking?: boolean;
  isLastQuestion?: boolean;
}

interface QuestionCardCheckedProps extends QuestionCardBaseProps {
  state: "checked";
  selectedAnswer: string;
  isLastQuestion: boolean;
  onNext: () => void;
  isSubmitting?: boolean;
}

interface QuestionCardReviewProps extends QuestionCardBaseProps {
  state: "review";
  selectedAnswer: string;
}

export type QuestionCardProps =
  | QuestionCardSelectingProps
  | QuestionCardCheckedProps
  | QuestionCardReviewProps;

// ============================================================================
// Constants
// ============================================================================

const QUESTION_TYPE_LABELS: Record<string, string> = {
  direct_question: "Direct Question",
  two_statement_compound: "Two-Statement Compound",
  contextual: "Contextual",
};

const RATIONALE_TRUNCATE_LENGTH = 200;

// ============================================================================
// Main Component
// ============================================================================

export function QuestionCard(props: QuestionCardProps) {
  const { question, questionNumber, state, selectedAnswer } = props;

  const selectedOption = question.options.find(
    (o) => o.index === selectedAnswer
  );
  const correctOption = question.options.find((o) => o.isCorrect);
  const showFeedback = state === "checked" || state === "review";

  // Determine correctness for feedback
  const isCorrect =
    showFeedback && selectedOption?.index === correctOption?.index;

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary">Question {questionNumber}</Badge>
          <Badge variant="outline" className="capitalize">
            {QUESTION_TYPE_LABELS[question.type] ||
              question.type.replace(/_/g, " ")}
          </Badge>
          {showFeedback && selectedAnswer && (
            <CorrectnessBadge isCorrect={isCorrect} />
          )}
        </div>
        <CardTitle className="text-lg leading-relaxed">
          {question.stem}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Options */}
        <div className="space-y-3">
          {question.options.map((option) => (
            <OptionItem
              key={option.index}
              option={option}
              selectedAnswer={selectedAnswer}
              showFeedback={showFeedback}
              isInteractive={state === "selecting"}
              onSelect={
                state === "selecting"
                  ? () => props.onSelectAnswer(option.index)
                  : undefined
              }
            />
          ))}
        </div>

        {/* Rationale (shown after checking or in review) */}
        {showFeedback && selectedOption?.explanation && (
          <RationaleSection
            explanation={selectedOption.explanation}
            isCorrect={isCorrect}
          />
        )}

        {/* Primary CTA */}
        {state === "selecting" && (
          <div className="pt-2 flex w-full">
            <Button
              onClick={props.onCheckAnswer}
              disabled={!props.selectedAnswer || props.isChecking}
              className="w-full sm:w-auto sm:ml-auto"
              size="lg"
            >
              {props.isChecking ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                "Check answer"
              )}
            </Button>
          </div>
        )}

        {state === "checked" && (
          <div className="pt-2 flex w-full">
            <Button
              onClick={props.onNext}
              disabled={props.isSubmitting}
              className="w-full sm:w-auto sm:ml-auto"
              size="lg"
            >
              {props.isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submiting...
                </>
              ) : props.isLastQuestion ? (
                "Submit"
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

interface CorrectnessBadgeProps {
  isCorrect: boolean;
}

function CorrectnessBadge({ isCorrect }: CorrectnessBadgeProps) {
  return (
    <Badge
      variant={isCorrect ? "default" : "destructive"}
      className={cn(
        isCorrect
          ? "bg-emerald-500/10 text-success-foreground dark:text-emerald-400"
          : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
      )}
    >
      {isCorrect ? (
        <>
          <Check className="h-3 w-3 mr-1" />
          Correct
        </>
      ) : (
        <>
          <X className="h-3 w-3 mr-1" />
          Incorrect
        </>
      )}
    </Badge>
  );
}

interface OptionItemProps {
  option: QuestionOption;
  selectedAnswer: string | undefined;
  showFeedback: boolean;
  isInteractive: boolean;
  onSelect?: () => void;
}

function OptionItem({
  option,
  selectedAnswer,
  showFeedback,
  isInteractive,
  onSelect,
}: OptionItemProps) {
  const isSelected = selectedAnswer === option.index;
  const isCorrect = option.isCorrect;
  const isWrongSelection = isSelected && !isCorrect;

  // Determine styling based on state
  const getOptionClasses = () => {
    if (showFeedback) {
      if (isCorrect) {
        return "border-emerald-500 bg-emerald-500/5";
      }
      if (isWrongSelection) {
        return "border-rose-500 bg-rose-500/5";
      }
      return "border-border opacity-60";
    }

    // Selecting state
    if (isSelected) {
      return "border-primary bg-primary/5 ring-2 ring-primary";
    }

    if (isInteractive) {
      return "border-border hover:border-primary/50 hover:bg-muted/50 cursor-pointer";
    }

    return "border-border";
  };

  const getIndicatorClasses = () => {
    if (showFeedback) {
      if (isCorrect) {
        return "bg-emerald-500 text-white";
      }
      if (isWrongSelection) {
        return "bg-rose-500 text-white";
      }
      return "bg-muted text-muted-foreground";
    }

    if (isSelected) {
      return "bg-primary text-primary-foreground";
    }

    return "bg-muted text-muted-foreground";
  };

  const renderIndicatorContent = () => {
    if (showFeedback && isCorrect) {
      return <Check className="h-4 w-4" />;
    }
    if (showFeedback && isWrongSelection) {
      return <X className="h-4 w-4" />;
    }
    return option.index;
  };

  const Component = isInteractive ? "button" : "div";

  return (
    <Component
      type={isInteractive ? "button" : undefined}
      onClick={isInteractive ? onSelect : undefined}
      className={cn(
        "w-full text-left p-4 rounded-lg border transition-all",
        getOptionClasses()
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium",
            getIndicatorClasses()
          )}
        >
          {renderIndicatorContent()}
        </span>
        <div className="flex-1 pt-0.5">
          <span
            className={cn(
              showFeedback && (isCorrect || isSelected) && "font-medium"
            )}
          >
            {option.text}
          </span>
          {showFeedback && isSelected && (
            <span className="ml-2 text-xs text-muted-foreground">
              (Your answer)
            </span>
          )}
        </div>
      </div>
    </Component>
  );
}

interface RationaleSectionProps {
  explanation: string;
  isCorrect: boolean;
}

function RationaleSection({ explanation, isCorrect }: RationaleSectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const isLong = explanation.length > RATIONALE_TRUNCATE_LENGTH;

  const displayText =
    isLong && !isExpanded
      ? `${explanation.slice(0, RATIONALE_TRUNCATE_LENGTH)}...`
      : explanation;

  return (
    <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
      <div className="flex items-start gap-2">
        <Lightbulb className="h-4 w-4 mt-0.5 text-blue-500 flex-shrink-0" />
        <div className="flex-1">
          <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
            Why is your answer {isCorrect ? "correct" : "incorrect"}?
          </div>
          <div className="text-sm text-muted-foreground">{displayText}</div>
          {isLong && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 h-auto p-0 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <>
                  Show less
                  <ChevronUp className="h-3 w-3 ml-1" />
                </>
              ) : (
                <>
                  Show more
                  <ChevronDown className="h-3 w-3 ml-1" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
