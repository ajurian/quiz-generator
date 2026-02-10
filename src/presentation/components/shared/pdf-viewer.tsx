import React from "react";

interface PdfViewerProps {
  fileURL: string;
  searchQuery?: string;
}

/**
 * Persistent PDF viewer component.
 *
 * - Only reloads the iframe when `fileURL` changes.
 * - When only `searchQuery` changes, dispatches a find command via the
 *   PDF.js `eventBus` so the search updates instantly without reloading.
 */
export default React.memo(
  function PdfViewer({ fileURL, searchQuery }: PdfViewerProps) {
    const iframeRef = React.useRef<HTMLIFrameElement>(null);
    const loadedUrlRef = React.useRef<string | null>(null);
    const prevSearchRef = React.useRef<string | undefined>(searchQuery);

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const proxyUrl = `${origin}/api/pdf?url=${encodeURIComponent(fileURL)}`;

    // Build the full viewer URL (used only for initial load / fileURL change)
    const viewerURL = React.useMemo(() => {
      const fileParams = new URLSearchParams({ file: proxyUrl });
      const hashParams = new URLSearchParams({
        search: `"${searchQuery}"`,
        phrase: "true",
      });
      return `/pdfjs/web/viewer.html?${fileParams.toString()}#${hashParams.toString()}`;
      // Only rebuild when fileURL changes — search updates are handled imperatively
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [proxyUrl]);

    // Imperatively update the search query via PDF.js eventBus when it changes
    React.useEffect(() => {
      if (prevSearchRef.current === searchQuery) return;
      prevSearchRef.current = searchQuery;

      const iframe = iframeRef.current;
      if (!iframe || loadedUrlRef.current !== fileURL) return;

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pdfApp = (iframe.contentWindow as any)?.PDFViewerApplication;
        if (pdfApp?.eventBus) {
          pdfApp.eventBus.dispatch("find", {
            source: iframe.contentWindow,
            type: "",
            query: searchQuery ?? "",
            phraseSearch: true,
            caseSensitive: false,
            highlightAll: true,
            findPrevious: false,
          });
        }
      } catch {
        // Cross-origin or viewer not ready — silently ignore
      }
    }, [searchQuery, fileURL]);

    // Track when the iframe finishes loading so we know the PDF is ready
    const handleLoad = React.useCallback(() => {
      loadedUrlRef.current = fileURL;
    }, [fileURL]);

    return (
      <div className="w-full h-full">
        <iframe
          ref={iframeRef}
          src={viewerURL}
          onLoad={handleLoad}
          title="PDF Viewer"
          className="w-full h-full border-none"
        />
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Only trigger a full re-render (iframe src change) when fileURL changes.
    // searchQuery changes are handled imperatively via useEffect.
    return prevProps.fileURL === nextProps.fileURL;
  },
);
