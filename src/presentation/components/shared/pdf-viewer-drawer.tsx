import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/presentation/components/ui/sheet";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/presentation/components/ui/drawer";
import { Loader2, FileText } from "lucide-react";
import { useIsMobile } from "@/presentation/hooks";
import { sourceMaterialUrlQueryOptions } from "@/presentation/queries";
import PdfViewer from "./pdf-viewer";

// ============================================================================
// Types
// ============================================================================

interface PdfViewerDrawerProps {
  /** Whether the drawer is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** The quiz ID to fetch the source material for */
  quizId: string;
  /** The 0-based reference index of the source material */
  reference: number;
  /** The search query to highlight in the PDF viewer */
  searchQuery: string;
  /** The user ID for access control */
  userId?: string | null;
  /** Optional source title to display in the header */
  sourceTitle?: string;
}

// ============================================================================
// Main Component
// ============================================================================

export function PdfViewerDrawer({
  open,
  onOpenChange,
  quizId,
  reference,
  searchQuery,
  userId,
  sourceTitle,
}: PdfViewerDrawerProps) {
  const isMobile = useIsMobile();

  // Only fetch when drawer is open
  const { data, isLoading, isError, error } = useQuery({
    ...sourceMaterialUrlQueryOptions(quizId, reference, userId),
    enabled: open,
  });

  const title = data?.title ?? sourceTitle ?? "Source Material";

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 shrink-0" />
              <span className="truncate">{title}</span>
            </DrawerTitle>
            <DrawerDescription className="sr-only">
              PDF viewer for source material
            </DrawerDescription>
          </DrawerHeader>
          <PdfViewerBody
            fileURL={data?.url}
            searchQuery={searchQuery}
            isLoading={isLoading}
            isError={isError}
            error={error}
          />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[55vw] lg:max-w-[50vw] p-0 flex flex-col"
      >
        <SheetHeader className="px-4 pt-4 pb-2 border-b shrink-0">
          <SheetTitle className="flex items-center gap-2 text-sm pr-6">
            <FileText className="h-4 w-4 shrink-0" />
            <span className="truncate">{title}</span>
          </SheetTitle>
          <SheetDescription className="sr-only">
            PDF viewer for source material
          </SheetDescription>
        </SheetHeader>
        <PdfViewerBody
          fileURL={data?.url}
          searchQuery={searchQuery}
          isLoading={isLoading}
          isError={isError}
          error={error}
        />
      </SheetContent>
    </Sheet>
  );
}

// ============================================================================
// Internal Components
// ============================================================================

interface PdfViewerBodyProps {
  fileURL?: string;
  searchQuery: string;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

function PdfViewerBody({
  fileURL,
  searchQuery,
  isLoading,
  isError,
  error,
}: PdfViewerBodyProps) {
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-75">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-sm">Loading source material...</span>
        </div>
      </div>
    );
  }

  if (isError || !fileURL) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-75">
        <div className="flex flex-col items-center gap-3 text-muted-foreground text-center px-4">
          <FileText className="h-8 w-8" />
          <span className="text-sm">
            {error?.message ?? "Failed to load source material"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0">
      <PdfViewer fileURL={fileURL} searchQuery={searchQuery} />
    </div>
  );
}
