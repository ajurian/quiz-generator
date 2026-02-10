import { createFileRoute } from "@tanstack/react-router";

/**
 * PDF Proxy API route handler
 *
 * Proxies PDF file requests to avoid cross-origin issues with PDF.js viewer.
 * PDF.js requires the file origin to match the viewer's origin, so this
 * endpoint fetches the PDF from the remote URL and serves it from the same origin.
 *
 * Usage: /api/pdf?url=<encoded-pdf-url>
 */
export const Route = createFileRoute("/api/pdf")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const { searchParams } = new URL(request.url);
        const url = searchParams.get("url");

        if (!url) {
          return new Response(
            JSON.stringify({ error: "Missing 'url' query parameter" }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }

        try {
          new URL(url);
        } catch {
          return new Response(
            JSON.stringify({ error: "Invalid URL provided" }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }

        try {
          const response = await fetch(url);

          if (!response.ok) {
            return new Response(
              JSON.stringify({
                error: `Failed to fetch PDF: ${response.status} ${response.statusText}`,
              }),
              {
                status: response.status,
                headers: { "Content-Type": "application/json" },
              },
            );
          }

          const contentType =
            response.headers.get("Content-Type") ?? "application/pdf";
          const contentLength = response.headers.get("Content-Length");

          const headers = new Headers({
            "Content-Type": contentType,
            "Cache-Control": "private, max-age=3600",
          });

          if (contentLength) {
            headers.set("Content-Length", contentLength);
          }

          return new Response(response.body, {
            status: 200,
            headers,
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          return new Response(
            JSON.stringify({ error: `Failed to proxy PDF: ${message}` }),
            { status: 502, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
