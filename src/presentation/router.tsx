import React from "react";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { QueryClient } from "@tanstack/react-query";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { Link } from "@tanstack/react-router";
import { Button } from "@/presentation/components/ui/button";

function DefaultNotFound() {
  return (
    <div className="min-h-screen bg-muted/20 py-8">
      <div className="container max-w-2xl mx-auto px-4">
        <div className="rounded-lg border bg-card p-6 text-center space-y-3">
          <h1 className="text-xl font-semibold">Page not found</h1>
          <p className="text-sm text-muted-foreground">
            The page you’re looking for doesn’t exist, or the link is invalid.
          </p>
          <div className="pt-2">
            <Button asChild>
              <Link to="/">Go home</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function getRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 1,
      },
    },
  });

  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: "intent",
    // defaultNotFoundComponent: DefaultNotFound,
    context: {
      queryClient,
      session: null,
    },
  });

  setupRouterSsrQueryIntegration({
    router,
    queryClient,
  });

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
