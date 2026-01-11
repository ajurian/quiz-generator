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
import { Lightbulb, Check, ChevronDown, ChevronUp } from "lucide-react";
import { FormattedText } from "@/presentation/lib";

// ============================================================================
// Types
// ============================================================================

interface QuestionOption {
  index: string;
  text: string;
  isCorrect: boolean;
  errorRationale?: string;
}

interface Question {
  id: string;
  type: string;
  stem: string;
  options: QuestionOption[];
  correctExplanation: string;
  sourceQuote: string;
  reference: number;
  /** Title of the source material this question references */
  sourceTitle?: string;
}

interface QuestionsPreviewProps {
  questions: Question[];
}

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

export function QuestionsPreview({ questions }: QuestionsPreviewProps) {
  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold mb-4">
        Questions & Answers Preview
      </h2>
      <div className="space-y-4">
        {questions.map((question, index) => (
          <QuestionPreviewCard
            key={question.id}
            question={question}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Question Card
// ============================================================================

interface QuestionPreviewCardProps {
  question: Question;
  index: number;
}

function QuestionPreviewCard({ question, index }: QuestionPreviewCardProps) {
  const correctOption = question.options.find((o) => o.isCorrect);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary">Question {index + 1}</Badge>
          <Badge variant="outline" className="capitalize">
            {QUESTION_TYPE_LABELS[question.type] ||
              question.type.replace(/_/g, " ")}
          </Badge>
        </div>
        <CardTitle className="text-lg whitespace-pre-wrap leading-relaxed">
          <FormattedText text={question.stem} />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Options */}
        <div className="space-y-3">
          {question.options.map((option) => (
            <OptionPreview key={option.index} option={option} />
          ))}
        </div>

        {/* Explanation Section */}
        {question.correctExplanation && correctOption && (
          <CorrectExplanation
            correctOption={correctOption}
            correctExplanation={question.correctExplanation}
            sourceQuote={question.sourceQuote}
            sourceTitle={question.sourceTitle}
          />
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Option Preview
// ============================================================================

interface OptionPreviewProps {
  option: QuestionOption;
}

function OptionPreview({ option }: OptionPreviewProps) {
  return (
    <div
      className={cn(
        "p-4 rounded-lg border transition-all",
        option.isCorrect
          ? "border-emerald-500 bg-emerald-500/5"
          : "border-border bg-muted/30"
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium",
            option.isCorrect
              ? "bg-emerald-500 text-white"
              : "bg-muted text-muted-foreground"
          )}
        >
          {option.index}
        </span>
        <div className="flex-1 pt-0.5">
          <div className="flex items-start justify-between gap-2">
            <span className={option.isCorrect ? "font-medium" : ""}>
              <FormattedText text={option.text} />
            </span>
            {option.isCorrect && (
              <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            )}
          </div>
          {option.errorRationale && (
            <div className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
              <Lightbulb className="h-3.5 w-3.5 mt-0.5 shrink-0 text-blue-500" />
              <FormattedText text={option.errorRationale} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Correct Explanation (matches question-card.tsx)
// ============================================================================

interface CorrectExplanationProps {
  correctOption: QuestionOption;
  correctExplanation: string;
  sourceQuote: string;
  sourceTitle?: string;
}

function CorrectExplanation({
  correctOption,
  correctExplanation,
  sourceQuote,
  sourceTitle,
}: CorrectExplanationProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isCopied, setIsCopied] = React.useState(false);
  const isLong =
    correctExplanation && correctExplanation.length > RATIONALE_TRUNCATE_LENGTH;

  const displayText =
    isLong && !isExpanded
      ? `${correctExplanation.slice(0, RATIONALE_TRUNCATE_LENGTH)}...`
      : correctExplanation;

  const handleCopyQuote = async () => {
    try {
      await navigator.clipboard.writeText(sourceQuote);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = sourceQuote;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
      <div className="flex items-start gap-2">
        <Lightbulb className="h-4 w-4 mt-0.5 text-blue-500 shrink-0" />
        <div className="flex-1">
          <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
            Why is option {correctOption.index} correct?
          </div>
          <div className="text-sm text-muted-foreground">
            <FormattedText text={displayText} />
          </div>
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
          {sourceQuote && (
            <div className="mt-3 pt-3 border-t border-blue-500/20">
              <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1 flex items-center justify-between">
                <span>{sourceTitle ? `Source: ${sourceTitle}` : "Source"}</span>
                {isCopied && (
                  <span className="text-emerald-500 flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Copied!
                  </span>
                )}
              </div>
              <blockquote
                onClick={handleCopyQuote}
                className="text-xs text-muted-foreground italic border-l-2 border-blue-500/30 pl-2 cursor-pointer hover:bg-blue-500/10 rounded-r transition-colors"
                title="Click to copy"
              >
                "<FormattedText text={sourceQuote} />"
              </blockquote>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
