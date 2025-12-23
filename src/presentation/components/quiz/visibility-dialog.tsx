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
import { Share2, Globe, Link2, Lock } from "lucide-react";

interface VisibilityDialogProps {
  currentVisibility: QuizVisibility;
  onVisibilityChange: (visibility: QuizVisibility) => void;
  isPending: boolean;
}

export function VisibilityDialog({
  currentVisibility,
  onVisibilityChange,
  isPending,
}: VisibilityDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quiz Visibility</DialogTitle>
          <DialogDescription>
            Control who can access this quiz
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          <VisibilityOption
            visibility={QuizVisibility.PRIVATE}
            currentVisibility={currentVisibility}
            onSelect={onVisibilityChange}
            isPending={isPending}
            icon={<Lock className="h-4 w-4" />}
            title="Private"
            description="Only you can view"
          />
          <VisibilityOption
            visibility={QuizVisibility.UNLISTED}
            currentVisibility={currentVisibility}
            onSelect={onVisibilityChange}
            isPending={isPending}
            icon={<Link2 className="h-4 w-4" />}
            title="Unlisted"
            description="Anyone with link can access"
          />
          <VisibilityOption
            visibility={QuizVisibility.PUBLIC}
            currentVisibility={currentVisibility}
            onSelect={onVisibilityChange}
            isPending={isPending}
            icon={<Globe className="h-4 w-4" />}
            title="Public"
            description="Discoverable by everyone"
          />
        </div>
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
    <Button
      variant={isSelected ? "default" : "outline"}
      className="w-full justify-start gap-2"
      onClick={() => onSelect(visibility)}
      disabled={isPending}
    >
      {icon}
      <div className="text-left">
        <p className="font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </Button>
  );
}
