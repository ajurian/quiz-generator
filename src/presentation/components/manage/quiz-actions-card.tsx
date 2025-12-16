import { Link } from "@tanstack/react-router";
import { Button } from "@/presentation/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/card";
import { Play, Eye } from "lucide-react";

interface QuizActionsCardProps {
  slug: string;
}

export function QuizActionsCard({ slug }: QuizActionsCardProps) {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg">Actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/quiz/a/$slug" params={{ slug }}>
            <Play className="h-4 w-4 mr-2" />
            Take Quiz
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/quiz/h/$slug" params={{ slug }}>
            <Eye className="h-4 w-4 mr-2" />
            View Attempts
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
