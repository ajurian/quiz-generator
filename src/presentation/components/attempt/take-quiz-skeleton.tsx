import {
  Card,
  CardContent,
  CardHeader,
} from "@/presentation/components/ui/card";
import { Skeleton } from "@/presentation/components/ui/skeleton";

export function AttemptQuizSkeleton() {
  return (
    <div className="min-h-screen bg-muted/20 py-8">
      <div className="container max-w-4xl mx-auto px-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
