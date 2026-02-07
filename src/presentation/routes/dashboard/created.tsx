import { QuizVisibility } from "@/domain";
import {
  QuizList,
  DashboardSkeleton,
} from "@/presentation/components/dashboard";
import { useQuizEvents } from "@/presentation/hooks";
import {
  getGenerationFailureMessage,
  getUserFriendlyMessage,
} from "@/presentation/lib";
import {
  cachedQuizEventsQueryOptions,
  quizKeys,
  quizListQueryOptions,
} from "@/presentation/queries";
import { updateQuizVisibility } from "@/presentation/server-functions";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { Tabs, TabsList, TabsTrigger } from "@/presentation/components/ui/tabs";
import { Badge } from "@/presentation/components/ui/badge";
import { FileText } from "lucide-react";

const searchSchema = z.object({
  visibility: z.enum(["all", "private", "unlisted", "public"]).optional(),
});

export const Route = createFileRoute("/dashboard/created")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ visibility: search.visibility }),
  loader: async ({ context, deps }) => {
    const user = context.session?.user;
    if (!user) {
      throw redirect({ to: "/auth/signin" });
    }

    const visibility =
      deps.visibility && deps.visibility !== "all"
        ? (deps.visibility as QuizVisibility)
        : undefined;

    await Promise.all([
      context.queryClient.ensureQueryData(
        quizListQueryOptions(user.id, visibility),
      ),
      context.queryClient.ensureQueryData(
        cachedQuizEventsQueryOptions(user.id),
      ),
    ]);
  },
  pendingComponent: DashboardSkeleton,
  component: CreatedQuizzesPage,
});

function CreatedQuizzesPage() {
  const { session } = Route.useRouteContext();
  const user = session!.user;
  const { visibility } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const visibilityFilter =
    visibility && visibility !== "all"
      ? (visibility as QuizVisibility)
      : undefined;

  const { data: response } = useSuspenseQuery(
    quizListQueryOptions(user.id, visibilityFilter),
  );
  const { data: cachedEvents } = useSuspenseQuery(
    cachedQuizEventsQueryOptions(user.id),
  );
  const quizzes = response.data;

  // Subscribe to real-time quiz generation events
  const { generatingQuizzes, failedQuizzes } = useQuizEvents({
    userId: user.id,
    initialEvents: cachedEvents,
    onCompleted: (event) => {
      queryClient.invalidateQueries({ queryKey: quizKeys.lists() });
      toast.success(`Quiz "${event.quizTitle}" is ready!`, {
        description: "You can now take the quiz.",
        action: {
          label: "View",
          onClick: () => {
            window.location.href = `/quiz/m/${event.quizSlug}`;
          },
        },
      });
    },
    onFailed: (event) => {
      queryClient.invalidateQueries({ queryKey: quizKeys.lists() });
      toast.error("Quiz generation failed", {
        description: getGenerationFailureMessage(event.errorMessage),
      });
    },
  });

  const visibilityMutation = useMutation({
    mutationFn: async ({
      quizId,
      visibility,
    }: {
      quizId: string;
      visibility: QuizVisibility;
    }) => {
      return updateQuizVisibility({
        data: { quizId, userId: user.id, visibility },
      });
    },
    onSuccess: (result) => {
      toast.success(result.message);
      // Invalidate all quiz lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: quizKeys.lists() });
    },
    onError: (error) => {
      toast.error("Failed to update visibility", {
        description: getUserFriendlyMessage(error, "visibility"),
      });
    },
  });

  const handleVisibilityChange = (
    quizId: string,
    visibility: QuizVisibility,
  ) => {
    visibilityMutation.mutate({ quizId, visibility });
  };

  const handleTabChange = (value: string) => {
    navigate({
      to: "/dashboard/created",
      search: value === "all" ? {} : { visibility: value as typeof visibility },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-display font-bold tracking-tight">
              Created Quizzes
            </h1>
            <Badge variant="secondary" className="text-sm">
              {quizzes.length} {quizzes.length === 1 ? "quiz" : "quizzes"}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            View and manage all your created quizzes
          </p>
        </div>

        {/* Visibility Filter Tabs */}
        <Tabs
          value={visibility ?? "all"}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="private">Private</TabsTrigger>
            <TabsTrigger value="unlisted">Unlisted</TabsTrigger>
            <TabsTrigger value="public">Public</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Quiz List */}
      <QuizList
        quizzes={quizzes}
        generatingQuizzes={generatingQuizzes}
        failedQuizzes={failedQuizzes}
        onVisibilityChange={handleVisibilityChange}
        isPendingVisibility={visibilityMutation.isPending}
      />
    </div>
  );
}
