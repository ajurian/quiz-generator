import { Link } from "@tanstack/react-router";
import { Button } from "@/presentation/components/ui/button";
import { Sparkles } from "lucide-react";

export function DashboardHeader() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your quizzes and track progress
        </p>
      </div>
      <Button asChild className="glow-primary">
        <Link to="/quiz/new">
          <Sparkles className="mr-2 h-4 w-4" />
          Create Quiz
        </Link>
      </Button>
    </div>
  );
}
