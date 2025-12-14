import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
  createQuiz,
  type SerializableFile,
} from "@/presentation/server-functions";

/**
 * Converts a File to a serializable format for RPC transport
 */
async function fileToSerializable(file: File): Promise<SerializableFile> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  const base64 = btoa(binary);

  return {
    name: file.name,
    type: file.type,
    size: file.size,
    base64,
  };
}

export const Route = createFileRoute("/dashboard/quiz/new")({
  component: NewQuizPage,
});

function NewQuizPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = Route.useRouteContext();

  const createMutation = useMutation({
    mutationFn: async (formData: QuizFormData) => {
      // Convert files to serializable format
      const serializableFiles = await Promise.all(
        formData.files.map(fileToSerializable)
      );

      return createQuiz({
        data: {
          userId: user.id,
          title: formData.title,
          distribution: formData.distribution,
          files: serializableFiles,
        },
      });
    },
    onSuccess: (quiz) => {
      toast.success("Quiz created successfully!");
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
      navigate({ to: "/dashboard/quiz/$quizId", params: { quizId: quiz.id } });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to create quiz"
      );
    },
  });

  const handleSubmit = (data: QuizFormData) => {
    createMutation.mutate(data);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Create New Quiz</h1>
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
