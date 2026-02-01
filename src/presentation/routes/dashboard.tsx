import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppNavbar } from "@/presentation/components/shared";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: ({ context, location }) => {
    if (!context.session?.user) {
      throw redirect({
        to: "/auth/signin",
        search: { redirect: location.pathname },
      });
    }
  },
  component: DashboardLayout,
});

function DashboardLayout() {
  const { session } = Route.useRouteContext();
  const user = session!.user;

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Dashboard Header */}
      <AppNavbar user={user} variant="dashboard" />

      {/* Dashboard Content */}
      <main className="w-full px-4 py-8 md:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
