import type { FileMetadata } from "./ai-quiz-generator.interface";

/**
 * Service interface for file storage operations
 * This is a port - implementation uses Google Gemini Files API
 */
export interface IFileStorageService {
  /**
   * Uploads files to storage
   * @param files Array of files to upload
   * @returns Metadata for each uploaded file including URIs
   */
  uploadFiles(files: File[]): Promise<FileMetadata[]>;

  /**
   * Gets the URI for accessing a stored file
   * @param fileId The file identifier
   * @returns URI string for the file
   */
  getFileUri(fileId: string): Promise<string>;

  /**
   * Deletes files from storage
   * @param fileIds Array of file identifiers to delete
   */
  deleteFiles(fileIds: string[]): Promise<void>;
}
