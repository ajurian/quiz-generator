import { Link } from "@tanstack/react-router";
import { Badge } from "@/presentation/components/ui/badge";
import { ArrowLeft } from "lucide-react";

interface ManageQuizHeaderProps {
  title: string;
  totalQuestions: number;
}

export function ManageQuizHeader({
  title,
  totalQuestions,
}: ManageQuizHeaderProps) {
  return (
    <>
      <Link
        to="/dashboard"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">{title}</h1>
          <p className="text-muted-foreground">
            Manage your quiz settings and view answers
          </p>
        </div>
        <Badge variant="outline" className="capitalize">
          {totalQuestions} questions
        </Badge>
      </div>
    </>
  );
}
