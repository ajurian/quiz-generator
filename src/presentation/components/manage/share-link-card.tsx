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
  const relativePath = `/quiz/a/${slug}`;

  // Construct full URL only when copying (client-side action)
  const handleCopyLink = async () => {
    const fullUrl = `${window.location.origin}${relativePath}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Copy failed", {
        description:
          "Unable to copy link. Please try selecting and copying manually.",
      });
    }
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
          <code className="flex-1 w-0 px-3 py-2 bg-muted rounded-md text-sm truncate">
            {relativePath}
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
