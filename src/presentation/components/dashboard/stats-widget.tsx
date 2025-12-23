import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsWidgetProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "primary";
}

export function StatsWidget({
  title,
  value,
  icon: Icon,
  description,
  trend,
  variant = "default",
}: StatsWidgetProps) {
  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md",
        variant === "primary" &&
          "border-primary/20 bg-gradient-to-br from-primary/5 to-transparent"
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            variant === "primary"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-display font-bold tracking-tight">
          {value}
        </div>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <p
            className={cn(
              "mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
              trend.isPositive
                ? "bg-success/10 text-success"
                : "bg-destructive/10 text-destructive"
            )}
          >
            {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}% from last
            week
          </p>
        )}
      </CardContent>
    </Card>
  );
}
