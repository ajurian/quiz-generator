import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

interface HistoryHeaderProps {
  quizTitle: string;
  backLink?: string;
}

export function HistoryHeader({
  quizTitle,
  backLink = "/dashboard",
}: HistoryHeaderProps) {
  return (
    <>
      <Link
        to={backLink}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">{quizTitle}</h1>
        <p className="text-muted-foreground">
          Your attempt history for this quiz
        </p>
      </div>
    </>
  );
}
