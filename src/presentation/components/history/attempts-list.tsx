import { useMemo } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/presentation/components/ui/button";
import { Card, CardContent } from "@/presentation/components/ui/card";
import { Badge } from "@/presentation/components/ui/badge";
import {
  Clock,
  Calendar,
  Eye,
  Play,
  RotateCcw,
  CornerDownRight,
} from "lucide-react";
import { retakeAttempt } from "@/presentation/server-functions";
import { attemptKeys } from "@/presentation/queries";
import { getUserFriendlyMessage, buildAttemptTree } from "@/presentation/lib";
import type { AttemptFlat, AttemptTreeNode } from "@/presentation/lib";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Attempt {
  id: string;
  slug: string;
  status: string;
  score: number | null;
  startedAt: string;
  formattedDuration: string | null;
  parentAttemptId: string | null;
}

interface AttemptsListProps {
  quizSlug: string;
  attempts: Attempt[];
  userId: string | null;
}

export function AttemptsList({
  quizSlug,
  attempts,
  userId,
}: AttemptsListProps) {
  const tree = useMemo(() => buildAttemptTree(attempts), [attempts]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">All Attempts</h2>
        <Button asChild>
          <Link
            to="/quiz/a/$slug"
            params={{ slug: quizSlug }}
            state={{ restart: true }}
          >
            <Play className="h-4 w-4 mr-2" />
            {attempts.length === 0 ? "Take" : "Try Again"}
          </Link>
        </Button>
      </div>

      {attempts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No attempts yet. Take the quiz to see your results here!
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tree.map((node) => (
            <AttemptTreeBranch
              key={node.attempt.id}
              node={node}
              quizSlug={quizSlug}
              userId={userId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tree branch renderer (recursive) ────────────────────────────────────

interface AttemptTreeBranchProps {
  node: AttemptTreeNode;
  quizSlug: string;
  userId: string | null;
}

function AttemptTreeBranch({ node, quizSlug, userId }: AttemptTreeBranchProps) {
  const isChild = node.depth > 0;

  return (
    <div className={cn(isChild && "ml-6 border-l-2 border-muted pl-4")}>
      <AttemptCard
        attempt={node.attempt}
        quizSlug={quizSlug}
        label={node.label}
        depth={node.depth}
        userId={userId}
        childNodes={node.children}
      />
      {node.children.length > 0 && (
        <div className="mt-2 space-y-2">
          {node.children.map((child) => (
            <AttemptTreeBranch
              key={child.attempt.id}
              node={child}
              quizSlug={quizSlug}
              userId={userId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Attempt card ────────────────────────────────────────────────────────

interface AttemptCardProps {
  attempt: AttemptFlat;
  quizSlug: string;
  label: string;
  depth: number;
  userId: string | null;
  childNodes: AttemptTreeNode[];
}

function AttemptCard({
  attempt,
  quizSlug,
  label,
  depth,
  userId,
  childNodes,
}: AttemptCardProps) {
  const isInProgress = attempt.status === "in_progress";
  const hasWrongAnswers =
    !isInProgress && attempt.score !== null && attempt.score < 100;
  const isRetake = depth > 0;
  const router = useRouter();
  const queryClient = useQueryClient();

  // Check if this attempt already has an in-progress retake child
  const inProgressChild = childNodes.find(
    (c) => c.attempt.status === "in_progress",
  );

  const retakeMutation = useMutation({
    mutationFn: async () => {
      return retakeAttempt({
        data: {
          sourceAttemptId: attempt.id,
          quizSlug,
          userId,
        },
      });
    },
    onSuccess: (result) => {
      toast.success(
        result.isResumed
          ? "Continuing previous retake"
          : "Retake started — answer the questions you got wrong!",
      );
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: attemptKeys.list(quizSlug, userId),
        });
      }
      router.navigate({
        to: "/quiz/a/$slug",
        params: { slug: quizSlug },
        search: { parent: attempt.id },
        state: { resume: true },
      });
    },
    onError: (error) => {
      toast.error("Failed to start retake", {
        description: getUserFriendlyMessage(error, "attempt"),
      });
    },
  });

  return (
    <Card
      className={cn(
        "hover:shadow-md transition-shadow",
        isRetake && "border-dashed",
      )}
    >
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full font-medium text-sm",
                isRetake ? "bg-muted/60" : "bg-muted",
              )}
            >
              {isRetake && (
                <CornerDownRight className="h-3 w-3 mr-0.5 opacity-60" />
              )}
              {label}
            </div>
            <div>
              <div className="flex items-center gap-2">
                {isInProgress ? (
                  <Badge
                    variant="outline"
                    className="border-yellow-500 text-yellow-500"
                  >
                    In Progress
                  </Badge>
                ) : (
                  <Badge
                    variant="default"
                    className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                  >
                    Completed
                  </Badge>
                )}
                {isRetake && (
                  <Badge variant="secondary" className="text-xs">
                    Retake
                  </Badge>
                )}
                {attempt.score !== null && (
                  <span className="font-semibold">
                    {attempt.score.toFixed(0)}%
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(attempt.startedAt).toLocaleDateString()}
                </span>
                {attempt.formattedDuration && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {attempt.formattedDuration}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasWrongAnswers && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (inProgressChild) {
                    if (userId) {
                      queryClient.invalidateQueries({
                        queryKey: attemptKeys.list(quizSlug, userId),
                      });
                    }
                    router.navigate({
                      to: "/quiz/a/$slug",
                      params: { slug: quizSlug },
                      search: { parent: attempt.id },
                      state: { resume: true },
                    });
                  } else {
                    retakeMutation.mutate();
                  }
                }}
                disabled={retakeMutation.isPending}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {retakeMutation.isPending
                  ? "Starting..."
                  : inProgressChild
                    ? "Continue Retake"
                    : "Retake"}
              </Button>
            )}
            <Button variant="ghost" size="sm" asChild>
              {isInProgress ? (
                <Link
                  to="/quiz/a/$slug"
                  params={{ slug: quizSlug }}
                  search={
                    attempt.parentAttemptId
                      ? { parent: attempt.parentAttemptId }
                      : undefined
                  }
                  state={(prev) => ({ ...prev, resume: true })}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Continue
                </Link>
              ) : (
                <Link
                  to="/quiz/h/$slug/$attemptSlug"
                  params={{ slug: quizSlug, attemptSlug: attempt.slug }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Review
                </Link>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
