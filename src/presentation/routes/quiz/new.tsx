import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/card";
import {
  QuizForm,
  type QuizFormData,
} from "@/presentation/components/quiz/quiz-form";
import {
  getPresignedUploadUrls,
  startQuizGeneration,
} from "@/presentation/server-functions";
import { quizKeys } from "@/presentation/queries";
import { slugify } from "@/lib/utils";
import { getUserFriendlyMessage } from "@/presentation/lib";

/**
 * Uploads a file to S3 using a presigned URL
 */
async function uploadToS3(file: File, presignedUrl: string): Promise<void> {
  const response = await fetch(presignedUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to upload ${file.name}: ${response.statusText}`);
  }
}

export const Route = createFileRoute("/quiz/new")({
  beforeLoad: ({ context }) => {
    if (!context.session?.user) {
      throw redirect({ to: "/auth/signin" });
    }
  },
  component: NewQuizPage,
});

function NewQuizPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session } = Route.useRouteContext();
  const user = session!.user;

  const createMutation = useMutation({
    mutationFn: async (formData: QuizFormData) => {
      // Show immediate feedback to user
      toast.success("Starting quiz generation...", {
        description: "Uploading your files. Please wait.",
      });

      // Generate slug from title for R2 key path
      const quizSlug = slugify(formData.title);

      // 1. Get presigned upload URLs
      const presignedUrls = await getPresignedUploadUrls({
        data: {
          userId: user.id,
          quizSlug,
          files: formData.files.map((file) => ({
            filename: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
          })),
        },
      });

      // 2. Upload files to R2 in parallel
      await Promise.all(
        formData.files.map((file, index) =>
          uploadToS3(file, presignedUrls[index]!.presignedUrl)
        )
      );

      // 3. Start quiz generation
      const result = await startQuizGeneration({
        data: {
          userId: user.id,
          title: formData.title,
          distribution: formData.distribution,
          visibility: formData.visibility,
          files: presignedUrls.map((url, index) => ({
            filename: formData.files[index]!.name,
            key: url.key,
            mimeType: formData.files[index]!.type,
            sizeBytes: formData.files[index]!.size,
          })),
        },
      });

      return result;
    },
    onSuccess: () => {
      toast.success("Quiz generation started!", {
        description:
          "AI is generating your questions. Check your dashboard for progress.",
        duration: 5000,
      });
      queryClient.invalidateQueries({ queryKey: quizKeys.list(user.id) });
      // Redirect to dashboard after quiz is created
      navigate({ to: "/dashboard" });
    },
    onError: (error) => {
      toast.error(getUserFriendlyMessage(error, "quiz"));
    },
  });

  const handleSubmit = (data: QuizFormData) => {
    createMutation.mutate(data);
  };

  return (
    <div className="container max-w-3xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-display font-bold tracking-tight">
          Create New Quiz
        </h1>
        <p className="text-muted-foreground">
          Upload your study materials and let AI generate questions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quiz Details</CardTitle>
          <CardDescription>
            Configure your quiz settings and upload files for AI processing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QuizForm
            onSubmit={handleSubmit}
            isSubmitting={createMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
