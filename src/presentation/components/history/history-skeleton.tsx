import {
  Card,
  CardContent,
  CardHeader,
} from "@/presentation/components/ui/card";
import { Skeleton } from "@/presentation/components/ui/skeleton";

export function HistorySkeleton() {
  return (
    <div className="min-h-screen bg-muted/20 py-8">
      <div className="container max-w-4xl mx-auto px-4">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
