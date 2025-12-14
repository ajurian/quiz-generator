import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/card";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, X, Eye, EyeOff } from "lucide-react";
import type { QuestionType } from "@/domain/enums/question-type.enum";

interface QuestionOption {
  index: "A" | "B" | "C" | "D";
  text: string;
  explanation: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  questionText: string;
  questionType: QuestionType | string;
  options: QuestionOption[];
  orderIndex: number;
}

interface QuestionCardProps {
  question: Question;
  index: number;
  showAnswer?: boolean;
  onAnswer?: (optionIndex: string) => void;
  selectedAnswer?: string;
  isReview?: boolean;
}

const QUESTION_TYPE_LABELS: Record<string, string> = {
  single_best_answer: "Single Best Answer",
  two_statements: "Two Statements",
  contextual: "Contextual",
};

export function QuestionCard({
  question,
  index,
  showAnswer = false,
  onAnswer,
  selectedAnswer,
  isReview = false,
}: QuestionCardProps) {
  const [localShowAnswer, setLocalShowAnswer] = useState(showAnswer);
  const correctOption = question.options.find((o) => o.isCorrect);

  const getOptionClassName = (option: QuestionOption) => {
    const isSelected = selectedAnswer === option.index;
    const reveal = localShowAnswer || isReview;

    if (!reveal && !isSelected) {
      return "border-muted hover:border-primary/50 cursor-pointer";
    }

    if (reveal && option.isCorrect) {
      return "border-green-500 bg-green-50 dark:bg-green-950/20";
    }

    if (reveal && isSelected && !option.isCorrect) {
      return "border-red-500 bg-red-50 dark:bg-red-950/20";
    }

    if (isSelected) {
      return "border-primary bg-primary/5";
    }

    return "border-muted";
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono">
              Q{index}
            </Badge>
            <Badge variant="secondary">
              {QUESTION_TYPE_LABELS[question.questionType] ||
                question.questionType}
            </Badge>
          </div>
          {!isReview && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocalShowAnswer(!localShowAnswer)}
            >
              {localShowAnswer ? (
                <>
                  <EyeOff className="mr-1 h-4 w-4" />
                  Hide
                </>
              ) : (
                <>
                  <Eye className="mr-1 h-4 w-4" />
                  Show
                </>
              )}
            </Button>
          )}
        </div>
        <CardTitle className="text-base font-medium leading-relaxed mt-2">
          {question.questionText}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Options */}
        {question.options.map((option) => (
          <div
            key={option.index}
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg border transition-colors",
              getOptionClassName(option),
              onAnswer && "cursor-pointer"
            )}
            onClick={() => onAnswer?.(option.index)}
          >
            <span
              className={cn(
                "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium",
                localShowAnswer && option.isCorrect
                  ? "bg-green-500 text-white"
                  : localShowAnswer && selectedAnswer === option.index
                    ? "bg-red-500 text-white"
                    : "bg-muted"
              )}
            >
              {localShowAnswer && option.isCorrect ? (
                <Check className="h-4 w-4" />
              ) : localShowAnswer && selectedAnswer === option.index ? (
                <X className="h-4 w-4" />
              ) : (
                option.index
              )}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm">{option.text}</p>
              {localShowAnswer && option.explanation && (
                <p className="text-xs text-muted-foreground mt-2 italic">
                  {option.explanation}
                </p>
              )}
            </div>
          </div>
        ))}

        {/* Correct Answer Summary */}
        {localShowAnswer && correctOption && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium text-green-600 dark:text-green-400">
              Correct Answer: {correctOption.index}
            </p>
            {correctOption.explanation && (
              <p className="text-sm text-muted-foreground mt-1">
                {correctOption.explanation}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
