import { useState } from "react";
import { Button } from "@/presentation/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/presentation/components/ui/dialog";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { toast } from "sonner";
import { Share2, Copy, Check, Globe, Lock } from "lucide-react";

interface ShareLinkGeneratorProps {
  quizId: string;
  isPublic: boolean;
  onToggleShare: () => void;
  isLoading?: boolean;
}

export function ShareLinkGenerator({
  quizId,
  isPublic,
  onToggleShare,
  isLoading = false,
}: ShareLinkGeneratorProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const shareUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/quiz/${quizId}/public`
    : `/quiz/${quizId}/public`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Quiz</DialogTitle>
          <DialogDescription>
            {isPublic
              ? "This quiz is publicly accessible. Anyone with the link can view it."
              : "Make this quiz public to share it with others."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Visibility Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              {isPublic ? (
                <Globe className="h-5 w-5 text-green-500" />
              ) : (
                <Lock className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">
                  {isPublic ? "Public" : "Private"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isPublic
                    ? "Anyone can view this quiz"
                    : "Only you can view this quiz"}
                </p>
              </div>
            </div>
            <Button
              variant={isPublic ? "destructive" : "default"}
              size="sm"
              onClick={onToggleShare}
              disabled={isLoading}
            >
              {isLoading
                ? "Updating..."
                : isPublic
                ? "Make Private"
                : "Make Public"}
            </Button>
          </div>

          {/* Share Link */}
          {isPublic && (
            <div className="space-y-2">
              <Label htmlFor="share-link">Share Link</Label>
              <div className="flex gap-2">
                <Input
                  id="share-link"
                  value={shareUrl}
                  readOnly
                  className="flex-1"
                />
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={copyToClipboard}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
