import { createFileRoute, Outlet } from "@tanstack/react-router";

/**
 * Quiz route layout
 * Parent route for all quiz-related pages
 */
export const Route = createFileRoute("/quiz")({
  component: QuizLayout,
});

function QuizLayout() {
  return <Outlet />;
}
