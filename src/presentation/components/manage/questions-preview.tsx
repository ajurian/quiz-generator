import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/card";
import { Badge } from "@/presentation/components/ui/badge";
import { cn } from "@/lib/utils";
import { Lightbulb, Check } from "lucide-react";
import { FormattedText } from "@/presentation/lib";
import { CorrectExplanation } from "@/presentation/components/shared/correct-explanation";

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
  sourceQuotes: string[];
  reference: number;
  /** Title of the source material this question references */
  sourceTitle?: string;
}

interface QuestionsPreviewProps {
  questions: Question[];
  /** Quiz ID — needed to fetch source material PDF URLs */
  quizId: string;
  /** User ID for access control when fetching source material URLs */
  userId?: string | null;
}

// ============================================================================
// Constants
// ============================================================================

const QUESTION_TYPE_LABELS: Record<string, string> = {
  direct_question: "Direct Question",
  two_statement_compound: "Two-Statement Compound",
  contextual: "Contextual",
};

// ============================================================================
// Main Component
// ============================================================================

export function QuestionsPreview({
  questions,
  quizId,
  userId,
}: QuestionsPreviewProps) {
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
            quizId={quizId}
            userId={userId}
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
  quizId: string;
  userId?: string | null;
}

function QuestionPreviewCard({
  question,
  index,
  quizId,
  userId,
}: QuestionPreviewCardProps) {
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
            sourceQuotes={question.sourceQuotes}
            sourceTitle={question.sourceTitle}
            quizId={quizId}
            reference={question.reference}
            userId={userId}
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
          : "border-border bg-muted/30",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium",
            option.isCorrect
              ? "bg-emerald-500 text-white"
              : "bg-muted text-muted-foreground",
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
