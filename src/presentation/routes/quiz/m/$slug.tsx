import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { updateQuizVisibility } from "@/presentation/server-functions";
import { quizBySlugQueryOptions, quizKeys } from "@/presentation/queries";
import { QuizVisibility } from "@/domain";
import { toast } from "sonner";
import {
  ManageQuizSkeleton,
  ManageQuizHeader,
  VisibilitySettingsCard,
  ShareLinkCard,
  QuizActionsCard,
  QuestionsPreview,
} from "@/presentation/components/manage";

export const Route = createFileRoute("/quiz/m/$slug")({
  beforeLoad: ({ context }) => {
    if (!context.session?.user) {
      throw redirect({ to: "/auth/signin" });
    }
  },
  loader: async ({ params, context }) => {
    const userId = context.session!.user.id;
    const result = await context.queryClient.ensureQueryData(
      quizBySlugQueryOptions(params.slug, userId)
    );

    if (!result.isOwner) {
      throw redirect({ to: "/dashboard" });
    }

    return { userId };
  },
  pendingComponent: ManageQuizSkeleton,
  component: ManagePage,
});

function ManagePage() {
  const { slug } = Route.useParams();
  const { session } = Route.useRouteContext();
  const { userId } = Route.useLoaderData();
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(quizBySlugQueryOptions(slug, userId));

  const visibilityMutation = useMutation({
    mutationFn: async (newVisibility: QuizVisibility) => {
      return updateQuizVisibility({
        data: {
          quizId: data.quiz.id,
          userId: session!.user.id,
          visibility: newVisibility,
        },
      });
    },
    onSuccess: (result) => {
      toast.success(result.message);
      // Invalidate both the detail query and the user's list query
      queryClient.invalidateQueries({ queryKey: quizKeys.bySlug(slug) });
      queryClient.invalidateQueries({ queryKey: quizKeys.list(userId) });
    },
    onError: (error) => {
      toast.error("Failed to update visibility", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });

  return (
    <div className="min-h-screen bg-muted/20 py-8">
      <div className="container max-w-4xl mx-auto px-4">
        <ManageQuizHeader
          title={data.quiz.title}
          totalQuestions={data.quiz.totalQuestions}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <VisibilitySettingsCard
            visibility={data.quiz.visibility}
            onVisibilityChange={(v) => visibilityMutation.mutate(v)}
            isPending={visibilityMutation.isPending}
          />
          <ShareLinkCard slug={slug} visibility={data.quiz.visibility} />
        </div>

        <QuizActionsCard slug={slug} />
        <QuestionsPreview questions={data.questions} />
      </div>
    </div>
  );
}
