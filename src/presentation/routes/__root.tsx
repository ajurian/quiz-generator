/// <reference types="vite/client" />
import { Toaster } from "@/presentation/components/ui/sonner";
import {
  getServerSession,
  type ServerSession,
} from "@/presentation/server-functions";
import globalsCss from "@/presentation/styles/globals.css?url";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ThemeProvider } from "next-themes";
import React from "react";

interface RouterContext {
  queryClient: QueryClient;
  session: ServerSession | null;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async () => {
    const session = await getServerSession();
    return { session };
  },
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Quiz Generator - AI-Powered Quiz Creation",
      },
      {
        name: "description",
        content:
          "Create, manage, and share AI-generated quizzes using Google Gemini API",
      },
    ],
    links: [
      { rel: "stylesheet", href: globalsCss },
      // { rel: "stylesheet", href: pdfViewerCss },
      // { rel: "stylesheet", href: pdfAnnotationLayerCss },
      // { rel: "stylesheet", href: pdfTextLayerCss },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
        <TanStackRouterDevtools position="bottom-right" />
        <ReactQueryDevtools buttonPosition="bottom-left" />
        <Scripts />
      </body>
    </html>
  );
}
