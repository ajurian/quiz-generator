import React from "react";

interface PdfViewerProps {
  fileURL: string;
  searchQuery?: string;
}

export default React.memo(
  function PdfViewer({ fileURL, searchQuery }: PdfViewerProps) {
    const fileParams = new URLSearchParams({ file: fileURL });
    const searchParams = new URLSearchParams({
      search: `"${searchQuery}"`,
      phrase: "true",
    });
    const viewerURL = `/pdfjs/web/viewer.html?${fileParams.toString()}#${searchParams.toString()}`;

    return (
      <div className="w-full h-screen">
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
  }
);
