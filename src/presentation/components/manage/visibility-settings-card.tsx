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

const VISIBILITY_OPTIONS = {
  [QuizVisibility.PRIVATE]: {
    label: "Private",
    description: "Only you can access this quiz",
    icon: <Lock className="h-4 w-4" />,
  },
  [QuizVisibility.UNLISTED]: {
    label: "Unlisted",
    description: "Anyone with the link can access",
    icon: <Link2 className="h-4 w-4" />,
  },
  [QuizVisibility.PUBLIC]: {
    label: "Public",
    description: "Discoverable by everyone",
    icon: <Globe className="h-4 w-4" />,
  },
} as const;

export function VisibilitySettingsCard({
  visibility,
  onVisibilityChange,
  isPending,
}: VisibilitySettingsCardProps) {
  const currentOption = VISIBILITY_OPTIONS[visibility];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          {currentOption.icon}
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
            <SelectValue>
              <div className="flex items-center gap-2">
                {currentOption.icon}
                {currentOption.label}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(VISIBILITY_OPTIONS).map(([value, option]) => (
              <SelectItem key={value} value={value}>
                <div className="flex items-center gap-2">
                  {option.icon}
                  {option.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground mt-2">
          {currentOption.description}
        </p>
      </CardContent>
    </Card>
  );
}
