import React from "react";
import { Button } from "@/presentation/components/ui/button";
import { Lightbulb, ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import { FormattedText } from "@/presentation/lib";
import { PdfViewerDrawer } from "./pdf-viewer-drawer";

// ============================================================================
// Types
// ============================================================================

export interface CorrectExplanationOption {
  index: string;
  text: string;
  isCorrect: boolean;
  errorRationale?: string;
}

export interface CorrectExplanationProps {
  correctOption: CorrectExplanationOption;
  correctExplanation: string;
  sourceQuotes: string[];
  sourceTitle?: string;
  /** Quiz ID — needed to fetch the source material PDF URL */
  quizId: string;
  /** 0-based reference index — identifies which source material the question references */
  reference: number;
  /** User ID for access control when fetching presigned URLs */
  userId?: string | null;
}

// ============================================================================
// Constants
// ============================================================================

const RATIONALE_TRUNCATE_LENGTH = 200;

// ============================================================================
// Component
// ============================================================================

export function CorrectExplanation({
  correctOption,
  correctExplanation,
  sourceQuotes,
  sourceTitle,
  quizId,
  reference,
  userId,
}: CorrectExplanationProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [pdfViewerOpen, setPdfViewerOpen] = React.useState(false);
  const [selectedQuote, setSelectedQuote] = React.useState("");

  const isLong =
    correctExplanation && correctExplanation.length > RATIONALE_TRUNCATE_LENGTH;

  const displayText =
    isLong && !isExpanded
      ? `${correctExplanation.slice(0, RATIONALE_TRUNCATE_LENGTH)}...`
      : correctExplanation;

  const handleQuoteClick = (quote: string) => {
    setSelectedQuote(quote);
    setPdfViewerOpen(true);
  };

  return (
    <>
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
            {sourceQuotes.length > 0 && (
              <div className="mt-3 pt-3 border-t border-blue-500/20">
                <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                  <span>
                    {sourceTitle ? `Source: ${sourceTitle}` : "Source"}
                  </span>
                </div>
                <div className="space-y-2">
                  {sourceQuotes.map((quote, index) => (
                    <blockquote
                      key={index}
                      onClick={() => handleQuoteClick(quote)}
                      className="text-xs text-muted-foreground italic border-l-2 border-blue-500/30 pl-2 cursor-pointer hover:bg-blue-500/10 rounded-r transition-colors flex items-start justify-between gap-2"
                      title="Click to view in source"
                    >
                      <span>
                        "<FormattedText text={quote} />"
                      </span>
                      <BookOpen className="h-3 w-3 mt-0.5 shrink-0 text-blue-500/60" />
                    </blockquote>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <PdfViewerDrawer
        open={pdfViewerOpen}
        onOpenChange={setPdfViewerOpen}
        quizId={quizId}
        reference={reference}
        searchQuery={selectedQuote}
        userId={userId}
        sourceTitle={sourceTitle}
      />
    </>
  );
}
