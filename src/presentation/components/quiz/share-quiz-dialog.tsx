import React from "react";
import { Button } from "@/presentation/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/presentation/components/ui/dialog";
import { QuizVisibility } from "@/domain";
import { Share2, Globe, Link2, Lock, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface ShareQuizDialogProps {
  quizSlug: string;
  currentVisibility: QuizVisibility;
  onVisibilityChange: (visibility: QuizVisibility) => void;
  isPending: boolean;
  baseUrl?: string;
}

export function ShareQuizDialog({
  quizSlug,
  currentVisibility,
  onVisibilityChange,
  isPending,
  baseUrl = typeof window !== "undefined" ? window.location.origin : "",
}: ShareQuizDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const shareLink =
    currentVisibility !== QuizVisibility.PRIVATE
      ? `${baseUrl}/quiz/a/${quizSlug}`
      : null;

  const handleCopy = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleVisibilityChange = (visibility: QuizVisibility) => {
    onVisibilityChange(visibility);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => e.stopPropagation()}
          className="gap-1.5"
        >
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Share Quiz</DialogTitle>
          <DialogDescription>
            Set visibility and share this quiz with others
          </DialogDescription>
        </DialogHeader>

        {/* Visibility Options */}
        <div className="space-y-2 py-4">
          <p className="text-sm font-medium text-muted-foreground mb-3">
            Visibility
          </p>
          <VisibilityOption
            visibility={QuizVisibility.PRIVATE}
            currentVisibility={currentVisibility}
            onSelect={handleVisibilityChange}
            isPending={isPending}
            icon={<Lock className="h-4 w-4" />}
            title="Private"
            description="Only you can access"
          />
          <VisibilityOption
            visibility={QuizVisibility.UNLISTED}
            currentVisibility={currentVisibility}
            onSelect={handleVisibilityChange}
            isPending={isPending}
            icon={<Link2 className="h-4 w-4" />}
            title="Unlisted"
            description="Anyone with the link"
          />
          <VisibilityOption
            visibility={QuizVisibility.PUBLIC}
            currentVisibility={currentVisibility}
            onSelect={handleVisibilityChange}
            isPending={isPending}
            icon={<Globe className="h-4 w-4" />}
            title="Public"
            description="Discoverable by everyone"
          />
        </div>

        {/* Share Link Section */}
        {shareLink && (
          <div className="border-t pt-4 overflow-hidden">
            <p className="text-sm font-medium mb-2">Share Link</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-md bg-muted px-3 py-2 text-sm truncate">
                {shareLink}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="flex-shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        {currentVisibility === QuizVisibility.PRIVATE && (
          <p className="text-sm text-muted-foreground border-t pt-4">
            Change visibility to unlisted or public to get a shareable link.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface VisibilityOptionProps {
  visibility: QuizVisibility;
  currentVisibility: QuizVisibility;
  onSelect: (visibility: QuizVisibility) => void;
  isPending: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
}

function VisibilityOption({
  visibility,
  currentVisibility,
  onSelect,
  isPending,
  icon,
  title,
  description,
}: VisibilityOptionProps) {
  const isSelected = currentVisibility === visibility;

  return (
    <button
      type="button"
      onClick={() => onSelect(visibility)}
      disabled={isPending}
      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/30 hover:bg-muted/50"
      } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-md ${
          isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
        }`}
      >
        {icon}
      </div>
      <div className="flex-1">
        <p
          className={`text-sm font-medium ${isSelected ? "text-primary" : ""}`}
        >
          {title}
        </p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {isSelected && (
        <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
      )}
    </button>
  );
}
