import React from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/presentation/components/ui/button";
import { Card, CardContent } from "@/presentation/components/ui/card";
import { Badge } from "@/presentation/components/ui/badge";
import { Progress } from "@/presentation/components/ui/progress";
import { cn } from "@/lib/utils";
import { Upload, File, X, FileText, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/presentation/components/ui/alert";

export interface UploadedFile {
  file: File;
  id: string;
  progress: number;
  status: "pending" | "uploading" | "complete" | "error";
  error?: string;
}

interface FileUploaderProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  acceptedTypes?: string[];
  disabled?: boolean;
}

const DEFAULT_ACCEPTED_TYPES = [
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const DEFAULT_MAX_SIZE = 4 * 1024 * 1024; // 4MB

export function FileUploader({
  files,
  onFilesChange,
  maxFiles = 20,
  maxSize = DEFAULT_MAX_SIZE,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  disabled = false,
}: FileUploaderProps) {
  const [error, setError] = React.useState<string | null>(null);

  const onDrop = React.useCallback(
    (acceptedFiles: File[], rejectedFiles: unknown[]) => {
      setError(null);

      if (rejectedFiles.length > 0) {
        setError("Some files were rejected. Please check file type and size.");
        return;
      }

      if (files.length + acceptedFiles.length > maxFiles) {
        setError(`Maximum ${maxFiles} files allowed`);
        return;
      }

      const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
        file,
        id: crypto.randomUUID(),
        progress: 0,
        status: "pending" as const,
      }));

      onFilesChange([...files, ...newFiles]);
    },
    [files, maxFiles, onFilesChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize,
    maxFiles: maxFiles - files.length,
    disabled: disabled || files.length >= maxFiles,
  });

  const removeFile = (id: string) => {
    onFilesChange(files.filter((f) => f.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string) => {
    if (type.includes("pdf"))
      return <FileText className="h-5 w-5 text-rose-500" />;
    return <File className="h-5 w-5 text-blue-500" />;
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
        {isDragActive ? (
          <p className="text-primary font-medium">Drop files here...</p>
        ) : (
          <>
            <p className="font-medium mb-1">
              Drag & drop files here, or click to select
            </p>
            <p className="text-sm text-muted-foreground">
              PDF, DOC, DOCX, or TXT files up to {formatFileSize(maxSize)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {files.length}/{maxFiles} files selected
            </p>
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((uploadedFile) => (
            <Card key={uploadedFile.id}>
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  {getFileIcon(uploadedFile.file.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {uploadedFile.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(uploadedFile.file.size)}
                    </p>
                    {uploadedFile.status === "uploading" && (
                      <Progress
                        value={uploadedFile.progress}
                        className="h-1 mt-2"
                      />
                    )}
                    {uploadedFile.status === "error" && (
                      <p className="text-xs text-destructive mt-1">
                        {uploadedFile.error || "Upload failed"}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {uploadedFile.status === "complete" && (
                      <Badge variant="secondary" className="text-emerald-600">
                        Ready
                      </Badge>
                    )}
                    {uploadedFile.status === "uploading" && (
                      <Badge variant="secondary">Uploading...</Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeFile(uploadedFile.id)}
                      disabled={disabled}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
