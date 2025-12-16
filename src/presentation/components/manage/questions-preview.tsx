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
  questionText: string;
  questionType: string;
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
            {question.questionType.replace(/_/g, " ")}
          </Badge>
        </div>
        <CardTitle className="text-base leading-relaxed">
          {question.questionText}
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
  return (
    <div
      className={`p-2.5 rounded-md border text-sm ${
        option.isCorrect
          ? "border-green-500 bg-green-500/5"
          : "border-border bg-muted/30"
      }`}
    >
      <div className="flex items-start gap-2">
        <span
          className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${
            option.isCorrect
              ? "bg-green-500 text-white"
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
            <CheckCircle2 className="inline h-4 w-4 ml-2 text-green-500 flex-shrink-0" />
          )}
          {option.explanation && (
            <div className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
              <Lightbulb className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-blue-500" />
              <span>{option.explanation}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
