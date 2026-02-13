import { Card, CardContent } from "@/presentation/components/ui/card";
import { History } from "lucide-react";
import { AttemptHistoryCard } from "./attempt-history-card";
import type { AttemptHistoryItemDTO } from "@/application";

interface AttemptHistorySectionProps {
  items: AttemptHistoryItemDTO[];
}

export function AttemptHistorySection({ items }: AttemptHistorySectionProps) {
  return (
    <div>
      {items.length === 0 ? (
        <EmptyAttemptHistory />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <AttemptHistoryCard key={item.latestAttempt.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyAttemptHistory() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
          <History className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">No attempts yet</h3>
        <p className="max-w-sm text-center text-muted-foreground">
          Start taking quizzes to see your attempt history here
        </p>
      </CardContent>
    </Card>
  );
}
