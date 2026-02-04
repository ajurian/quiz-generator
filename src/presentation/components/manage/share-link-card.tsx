import { useState, useEffect } from "react";
import { Button } from "@/presentation/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/card";
import { QuizVisibility } from "@/domain";
import { Share2, Copy, Lock } from "lucide-react";
import { toast } from "sonner";

interface ShareLinkCardProps {
  slug: string;
  visibility: QuizVisibility;
}

export function ShareLinkCard({ slug, visibility }: ShareLinkCardProps) {
  // Use relative path initially to match server render, then update to full URL on client
  const relativePath = `/quiz/a/${slug}`;
  const [shareUrl, setShareUrl] = useState(relativePath);

  useEffect(() => {
    setShareUrl(`${window.location.origin}${relativePath}`);
  }, [relativePath]);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied to clipboard!");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Share Link
        </CardTitle>
        <CardDescription>Share this quiz with others</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm truncate">
            {shareUrl}
          </code>
          <Button variant="outline" size="icon" onClick={handleCopyLink}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        {visibility === QuizVisibility.PRIVATE && (
          <p className="text-sm text-yellow-500 mt-2 flex items-center gap-1">
            <Lock className="h-3 w-3" />
            Link won't work while quiz is private
          </p>
        )}
      </CardContent>
    </Card>
  );
}
