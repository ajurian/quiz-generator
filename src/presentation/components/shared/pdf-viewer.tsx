import React from "react";

interface PdfViewerProps {
  fileURL: string;
  searchQuery?: string;
}

export default React.memo(
  function PdfViewer({ fileURL, searchQuery }: PdfViewerProps) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const proxyUrl = `${origin}/api/pdf?url=${encodeURIComponent(fileURL)}`;
    const fileParams = new URLSearchParams({ file: proxyUrl });
    const searchParams = new URLSearchParams({
      search: `"${searchQuery}"`,
      phrase: "true",
    });
    const viewerURL = `/pdfjs/web/viewer.html?${fileParams.toString()}#${searchParams.toString()}`;

    return (
      <div className="w-full h-full">
        <iframe
          src={viewerURL}
          title="PDF Viewer"
          className="w-full h-full border-none"
        />
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.fileURL === nextProps.fileURL &&
      prevProps.searchQuery === nextProps.searchQuery
    );
  },
);
