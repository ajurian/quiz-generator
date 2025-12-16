import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/card";
import { FileText } from "lucide-react";

interface QuizDistribution {
  singleBestAnswer: number;
  twoStatements: number;
  contextual: number;
}

interface QuizOverviewCardProps {
  totalQuestions: number;
  distribution: QuizDistribution;
}

export function QuizOverviewCard({
  totalQuestions,
  distribution,
}: QuizOverviewCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Quiz Overview
        </CardTitle>
        <CardDescription>
          {totalQuestions} questions in this quiz
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Single Best Answer</p>
            <p className="text-2xl font-bold">
              {distribution.singleBestAnswer}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Two Statements</p>
            <p className="text-2xl font-bold">{distribution.twoStatements}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Contextual</p>
            <p className="text-2xl font-bold">{distribution.contextual}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
