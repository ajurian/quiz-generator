import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useState, useEffect, useMemo } from "react";
import { publicQuizzesQueryOptions } from "@/presentation/queries";
import { QuizCard } from "@/presentation/components/dashboard";
import { Input } from "@/presentation/components/ui/input";
import { Button } from "@/presentation/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/presentation/components/ui/card";
import { Badge } from "@/presentation/components/ui/badge";
import { Skeleton } from "@/presentation/components/ui/skeleton";
import {
  Brain,
  Compass,
  Search,
  Loader2,
  Globe,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ThemeToggle } from "@/presentation/components/shared/theme-toggle";

const searchSchema = z.object({
  q: z.string().optional(),
});

export const Route = createFileRoute("/explore")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ search: search.q }),
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData(
      publicQuizzesQueryOptions(deps.search),
    );
  },
  pendingComponent: ExploreSkeleton,
  component: ExplorePage,
});

function ExploreSkeleton() {
  return (
    <div className="min-h-screen bg-muted/20">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg">
        <div className="flex h-16 w-full items-center justify-between px-4 md:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Brain className="h-4 w-4" />
            </div>
            <span className="font-display font-semibold tracking-tight">
              Quiz Generator
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>
      </header>
      <main className="w-full px-4 py-8 md:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-5 w-72" />
            </div>
            <Skeleton className="h-10 w-full md:w-80" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-12 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function ExplorePage() {
  const { q: searchQuery } = Route.useSearch();
  const navigate = useNavigate();
  const { session } = Route.useRouteContext();

  // Local state for the search input (for debouncing)
  const [searchInput, setSearchInput] = useState(searchQuery ?? "");
  const [isSearching, setIsSearching] = useState(false);

  const { data: response } = useSuspenseQuery(
    publicQuizzesQueryOptions(searchQuery),
  );
  const quizzes = response.data;

  // Debounce search input (300ms)
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      const trimmedSearch = searchInput.trim();
      navigate({
        to: "/explore",
        search: trimmedSearch ? { q: trimmedSearch } : {},
        replace: true,
      });
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, navigate]);

  // Sync search input with URL when navigating back/forward
  useEffect(() => {
    setSearchInput(searchQuery ?? "");
  }, [searchQuery]);

  // Determine empty state message
  const emptyStateContent = useMemo(() => {
    if (searchQuery) {
      return {
        icon: <Search className="h-8 w-8 text-muted-foreground" />,
        title: "No quizzes found",
        description: `No quizzes match "${searchQuery}". Try a different search term.`,
      };
    }
    return {
      icon: <Globe className="h-8 w-8 text-muted-foreground" />,
      title: "No public quizzes yet",
      description:
        "Be the first to share a quiz with the community! Create a quiz and set it to public visibility.",
    };
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg">
        <div className="flex h-16 w-full items-center justify-between px-4 md:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Brain className="h-4 w-4" />
              </div>
              <span className="font-display font-semibold tracking-tight">
                Quiz Generator
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {session?.user ? (
              <Button asChild variant="outline" size="sm">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link to="/auth/signin">Sign In</Link>
              </Button>
            )}
            <Button asChild size="sm" className="glow-primary">
              <Link to="/quiz/new">
                <Sparkles className="mr-2 h-4 w-4" />
                Create Quiz
              </Link>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-4 py-8 md:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Compass className="h-5 w-5 text-primary" />
                <h1 className="text-2xl font-display font-bold tracking-tight">
                  Explore Quizzes
                </h1>
                <Badge variant="secondary" className="text-sm">
                  {quizzes.length} {quizzes.length === 1 ? "quiz" : "quizzes"}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Discover and take quizzes shared by the community
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search quizzes..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 pr-9"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Quiz Grid */}
          {quizzes.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                  {emptyStateContent.icon}
                </div>
                <h3 className="mb-2 text-lg font-semibold">
                  {emptyStateContent.title}
                </h3>
                <p className="mb-6 max-w-sm text-center text-muted-foreground">
                  {emptyStateContent.description}
                </p>
                {!searchQuery && (
                  <Button asChild className="glow-primary">
                    <Link to="/quiz/new">
                      <Sparkles className="mr-2 h-4 w-4" />
                      Create a Quiz
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {quizzes.map((quiz) => (
                <QuizCard key={quiz.id} quiz={quiz} mode="explore" />
              ))}
            </div>
          )}

          {/* Pagination placeholder - can be added later */}
          {response.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <p className="text-sm text-muted-foreground">
                Showing {quizzes.length} of {response.total} quizzes
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
