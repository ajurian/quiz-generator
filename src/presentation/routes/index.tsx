import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/presentation/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/card";
import { Badge } from "@/presentation/components/ui/badge";
import {
  Brain,
  FileText,
  Share2,
  Sparkles,
  Zap,
  Shield,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="min-h-screen bg-hero-gradient">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto">
          <nav className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Brain className="h-5 w-5" />
              </div>
              <span className="text-lg font-semibold tracking-tight">
                Quiz Generator
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm">
                  Dashboard
                </Button>
              </Link>
              <Button asChild size="sm" className="glow-primary">
                <Link to="/dashboard/quiz/new">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Create Quiz
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <section className="relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-grid opacity-40" />
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />

          <div className="container relative mx-auto px-4 py-24 md:py-32 lg:py-40">
            <div className="mx-auto max-w-3xl text-center">
              <Badge
                variant="secondary"
                className="mb-6 px-4 py-1.5 text-sm font-medium"
              >
                <Zap className="mr-1.5 h-3.5 w-3.5 text-primary" />
                Powered by Google Gemini AI
              </Badge>

              <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                Create AI-Powered Quizzes{" "}
                <span className="text-primary">in Seconds</span>
              </h1>

              <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl">
                Upload your study materials and let AI generate comprehensive,
                professional quizzes. Perfect for educators, students, and
                training teams.
              </p>

              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button size="lg" className="glow-primary px-8" asChild>
                  <Link to="/dashboard/quiz/new">
                    <Sparkles className="mr-2 h-5 w-5" />
                    Get Started Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/dashboard">View Dashboard</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="border-t bg-muted/30 py-20 md:py-28">
          <div className="container mx-auto px-4">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                How It Works
              </h2>
              <p className="text-lg text-muted-foreground">
                Three simple steps to create professional quizzes from any
                content
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3 md:gap-8">
              <Card className="group relative overflow-hidden border-border/50 bg-card-gradient transition-all hover:border-primary/30 hover:shadow-lg">
                <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  1
                </div>
                <CardHeader className="pb-4">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <FileText className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">Upload Materials</CardTitle>
                  <CardDescription className="text-base">
                    Drag and drop your PDFs, documents, or text files. Our AI
                    analyzes content thoroughly.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="group relative overflow-hidden border-border/50 bg-card-gradient transition-all hover:border-primary/30 hover:shadow-lg">
                <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  2
                </div>
                <CardHeader className="pb-4">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">AI Generation</CardTitle>
                  <CardDescription className="text-base">
                    Gemini AI creates high-quality questions with multiple
                    formats and detailed explanations.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="group relative overflow-hidden border-border/50 bg-card-gradient transition-all hover:border-primary/30 hover:shadow-lg">
                <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  3
                </div>
                <CardHeader className="pb-4">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Share2 className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">Share & Use</CardTitle>
                  <CardDescription className="text-base">
                    Share quizzes with a public link. Perfect for classrooms,
                    teams, and study groups.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Question Types Section */}
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <Badge variant="outline" className="mb-4">
                <Shield className="mr-1.5 h-3.5 w-3.5" />
                Multiple Formats
              </Badge>
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                Supported Question Types
              </h2>
              <p className="text-lg text-muted-foreground">
                Generate diverse question formats to test knowledge effectively
              </p>
            </div>

            <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-3">
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <CardContent className="pt-6">
                  <div className="mb-3 text-2xl">📝</div>
                  <h3 className="mb-2 font-semibold">Single Best Answer</h3>
                  <p className="text-sm text-muted-foreground">
                    Classic multiple choice with one correct answer and detailed
                    explanations
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <CardContent className="pt-6">
                  <div className="mb-3 text-2xl">⚖️</div>
                  <h3 className="mb-2 font-semibold">Two Statements</h3>
                  <p className="text-sm text-muted-foreground">
                    Evaluate correctness of two related statements for deeper
                    understanding
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <CardContent className="pt-6">
                  <div className="mb-3 text-2xl">🎯</div>
                  <h3 className="mb-2 font-semibold">Contextual</h3>
                  <p className="text-sm text-muted-foreground">
                    Scenario-based questions testing practical application of
                    knowledge
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t bg-muted/30 py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight">
                Ready to Create Your First Quiz?
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                Join thousands of educators and teams using AI to create better
                assessments.
              </p>
              <Button size="lg" className="glow-primary px-8" asChild>
                <Link to="/dashboard/quiz/new">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Start Creating Now
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Brain className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">Quiz Generator</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Quiz Generator. Powered by Google Gemini AI.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
