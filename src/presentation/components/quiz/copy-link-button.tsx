import React from "react";
import { Button } from "@/presentation/components/ui/button";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface CopyLinkButtonProps {
  shareLink: string | null | undefined;
}

export function CopyLinkButton({ shareLink }: CopyLinkButtonProps) {
  const [copied, setCopied] = React.useState(false);

  if (!shareLink) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleCopy}>
      {copied ? (
        <Check className="mr-2 h-4 w-4" />
      ) : (
        <Copy className="mr-2 h-4 w-4" />
      )}
      {copied ? "Copied!" : "Copy Link"}
    </Button>
  );
}
