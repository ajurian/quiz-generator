import { Button } from "@/presentation/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/presentation/components/ui/dialog";
import { Play, RotateCcw, Clock } from "lucide-react";

interface ResumeAttemptDialogProps {
  open: boolean;
  onContinue: () => void;
  onStartOver: () => void;
  isResetting: boolean;
  answeredCount: number;
  totalQuestions: number;
}

/**
 * Dialog shown when user has an in-progress attempt
 * Offers two options: Continue (resume) or Start Over (reset answers)
 */
export function ResumeAttemptDialog({
  open,
  onContinue,
  onStartOver,
  isResetting,
  answeredCount,
  totalQuestions,
}: ResumeAttemptDialogProps) {
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Clock className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">
            Resume your attempt?
          </DialogTitle>
          <DialogDescription className="text-center">
            You have an attempt in progress with {answeredCount} of{" "}
            {totalQuestions} questions answered. Continue where you left off or
            start over?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={onStartOver}
            disabled={isResetting}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            {isResetting ? (
              <>
                <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                Resetting...
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4 mr-2" />
                Start over
              </>
            )}
          </Button>
          <Button
            onClick={onContinue}
            disabled={isResetting}
            className="w-full sm:w-auto order-1 sm:order-2"
          >
            <Play className="h-4 w-4 mr-2" />
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
