import { Link } from "@tanstack/react-router";
import { Button } from "@/presentation/components/ui/button";
import { Badge } from "@/presentation/components/ui/badge";
import { QuizVisibility } from "@/domain";
import { ArrowLeft, Calendar, Globe, Link2, Lock } from "lucide-react";

interface QuizDetailHeaderProps {
  title: string;
  visibility: QuizVisibility;
  createdAt: string;
  actions?: React.ReactNode;
}

export function QuizDetailHeader({
  title,
  visibility,
  createdAt,
  actions,
}: QuizDetailHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/dashboard">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <VisibilityBadge visibility={visibility} />
          </div>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <Calendar className="h-4 w-4" />
            Created {formatDate(createdAt)}
          </p>
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function VisibilityBadge({
  visibility,
}: {
  visibility: QuizVisibility;
}) {
  switch (visibility) {
    case QuizVisibility.PUBLIC:
      return (
        <Badge className="gap-1 bg-green-100 text-green-700 hover:bg-green-200">
          <Globe className="h-3 w-3" />
          Public
        </Badge>
      );
    case QuizVisibility.UNLISTED:
      return (
        <Badge className="gap-1 bg-blue-100 text-blue-700 hover:bg-blue-200">
          <Link2 className="h-3 w-3" />
          Unlisted
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="gap-1">
          <Lock className="h-3 w-3" />
          Private
        </Badge>
      );
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
