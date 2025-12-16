import {
  createFileRoute,
  Outlet,
  Link,
  redirect,
} from "@tanstack/react-router";
import { Button } from "@/presentation/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/presentation/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/presentation/components/ui/dropdown-menu";
import { Brain, Home, LogOut, Settings, User, Sparkles } from "lucide-react";
import { signOut } from "@/presentation/lib/auth-client";
import { ThemeToggle } from "@/presentation/components/shared/theme-toggle";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: ({ context }) => {
    if (!context.session?.user) {
      throw redirect({ to: "/auth/signin" as "/" });
    }
    return { user: context.session.user };
  },
  component: DashboardLayout,
});

function DashboardLayout() {
  const { user } = Route.useRouteContext();

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : (user.email?.slice(0, 2).toUpperCase() ?? "U");

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Dashboard Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg">
        <div className="flex h-16 w-full items-center justify-between px-4 md:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Brain className="h-4 w-4" />
              </div>
              <span className="font-semibold tracking-tight">
                Quiz Generator
              </span>
            </Link>
            <nav className="hidden md:flex items-center">
              <Link
                to="/dashboard"
                activeProps={{ className: "text-foreground bg-muted" }}
                inactiveProps={{
                  className:
                    "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                }}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
              >
                <Home className="h-4 w-4" />
                Dashboard
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Button asChild size="sm" className="glow-primary">
              <Link to="/quiz/new">
                <Sparkles className="mr-2 h-4 w-4" />
                New Quiz
              </Link>
            </Button>

            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full ring-2 ring-border hover:ring-primary/50 transition-all"
                >
                  <Avatar className="h-9 w-9">
                    {user.image && (
                      <AvatarImage src={user.image} alt={user.name ?? ""} />
                    )}
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.name ?? "User"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="w-full px-4 py-8 md:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
