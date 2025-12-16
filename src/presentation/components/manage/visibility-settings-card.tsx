import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/presentation/components/ui/select";
import { QuizVisibility } from "@/domain";
import { Lock, Link2, Globe } from "lucide-react";

interface VisibilitySettingsCardProps {
  visibility: QuizVisibility;
  onVisibilityChange: (visibility: QuizVisibility) => void;
  isPending: boolean;
}

export function VisibilitySettingsCard({
  visibility,
  onVisibilityChange,
  isPending,
}: VisibilitySettingsCardProps) {
  const getVisibilityIcon = (v: QuizVisibility) => {
    switch (v) {
      case QuizVisibility.PRIVATE:
        return <Lock className="h-4 w-4" />;
      case QuizVisibility.UNLISTED:
        return <Link2 className="h-4 w-4" />;
      case QuizVisibility.PUBLIC:
        return <Globe className="h-4 w-4" />;
    }
  };

  const getVisibilityDescription = (v: QuizVisibility) => {
    switch (v) {
      case QuizVisibility.PRIVATE:
        return "Only you can access this quiz";
      case QuizVisibility.UNLISTED:
        return "Anyone with the link can access";
      case QuizVisibility.PUBLIC:
        return "Discoverable by everyone";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          {getVisibilityIcon(visibility)}
          Visibility
        </CardTitle>
        <CardDescription>Control who can access this quiz</CardDescription>
      </CardHeader>
      <CardContent>
        <Select
          value={visibility}
          onValueChange={(value) => onVisibilityChange(value as QuizVisibility)}
          disabled={isPending}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={QuizVisibility.PRIVATE}>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Private
              </div>
            </SelectItem>
            <SelectItem value={QuizVisibility.UNLISTED}>
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                Unlisted
              </div>
            </SelectItem>
            <SelectItem value={QuizVisibility.PUBLIC}>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Public
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground mt-2">
          {getVisibilityDescription(visibility)}
        </p>
      </CardContent>
    </Card>
  );
}
