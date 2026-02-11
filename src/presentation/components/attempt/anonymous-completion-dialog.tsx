import React from "react";
import { Link } from "@tanstack/react-router";
import { LogIn, Trophy, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/presentation/components/ui/dialog";
import { Button } from "@/presentation/components/ui/button";

interface AnonymousCompletionDialogProps {
  open: boolean;
  quizTitle: string;
  score: number;
  /** Current path to redirect back after auth */
  currentPath: string;
}

/**
 * Dialog shown to anonymous users after they submit a quiz.
 *
 * Displays their score and encourages sign-in/sign-up to persist
 * their attempt history.
 */
export function AnonymousCompletionDialog({
  open,
  quizTitle,
  score,
  currentPath,
}: AnonymousCompletionDialogProps) {
  const redirectParam = encodeURIComponent(currentPath);

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Trophy className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle>Quiz Completed!</DialogTitle>
          <DialogDescription>
            You scored{" "}
            <span className="font-semibold text-foreground">
              {score.toFixed(0)}%
            </span>{" "}
            on <span className="font-medium">{quizTitle}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/50 p-4 text-sm text-muted-foreground space-y-1.5">
          <p className="font-medium text-foreground">
            Sign in to unlock these benefits:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Save this attempt to your history</li>
            <li>Review your answers anytime</li>
            <li>Track your progress across quizzes</li>
          </ul>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button asChild className="w-full">
            <Link to="/auth/signin" search={{ redirect: redirectParam }}>
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link to="/auth/signup" search={{ redirect: redirectParam }}>
              <UserPlus className="mr-2 h-4 w-4" />
              Create Account
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
