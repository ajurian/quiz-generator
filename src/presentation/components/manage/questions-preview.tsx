import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/card";
import { Badge } from "@/presentation/components/ui/badge";
import { CheckCircle2, Lightbulb } from "lucide-react";

interface QuestionOption {
  index: string;
  text: string;
  explanation: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  type: string;
  stem: string;
  options: QuestionOption[];
}

interface QuestionsPreviewProps {
  questions: Question[];
}

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

interface QuestionPreviewCardProps {
  question: Question;
  index: number;
}

function QuestionPreviewCard({ question, index }: QuestionPreviewCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary">Q{index + 1}</Badge>
          <Badge variant="outline" className="capitalize">
            {question.type.replace(/_/g, " ")}
          </Badge>
        </div>
        <CardTitle className="text-base whitespace-pre-wrap leading-relaxed">
          {question.stem}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {question.options.map((option) => (
            <OptionPreview key={option.index} option={option} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface OptionPreviewProps {
  option: QuestionOption;
}

function OptionPreview({ option }: OptionPreviewProps) {
  // Regex identifies:
  // 1. **bold** -> (\*\*.*?\*\*)
  // 2. *italic* -> (\*.*?\*)
  // 3. `code`   -> (`.*?`)
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
  const explanationParts = option.explanation.split(regex);

  return (
    <div
      className={`p-2.5 rounded-md border text-sm ${
        option.isCorrect
          ? "border-emerald-500 bg-emerald-500/5"
          : "border-border bg-muted/30"
      }`}
    >
      <div className="flex items-start gap-2">
        <span
          className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${
            option.isCorrect
              ? "bg-emerald-500 text-white"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {option.index}
        </span>
        <div className="flex-1">
          <span className={option.isCorrect ? "font-medium" : ""}>
            {option.text}
          </span>
          {option.isCorrect && (
            <CheckCircle2 className="inline h-4 w-4 ml-2 text-emerald-500 flex-shrink-0" />
          )}
          {option.explanation && (
            <div className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
              <Lightbulb className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-blue-500" />
              <span>
                {explanationParts.map((part, index) => {
                  if (part.startsWith("**") && part.endsWith("**")) {
                    return <strong key={index}>{part.slice(2, -2)}</strong>;
                  }
                  if (part.startsWith("*") && part.endsWith("*")) {
                    return <em key={index}>{part.slice(1, -1)}</em>;
                  }
                  if (part.startsWith("`") && part.endsWith("`")) {
                    return (
                      <code
                        key={index}
                        className="bg-muted relative inline whitespace-pre-wrap wrap-anywhere rounded px-[0.3em] py-[0.1em] font-mono font-semibold"
                      >
                        {part.slice(1, -1)}
                      </code>
                    );
                  }
                  return part;
                })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
