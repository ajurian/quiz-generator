import { GoogleGenAI } from "@google/genai";
import type { IFileStorageService, FileMetadata } from "../../application";

/**
 * File Storage Service using Google Gemini Files API
 *
 * Implements the IFileStorageService port using Gemini's file upload API.
 * Files uploaded through this service can be used with Gemini models for
 * multimodal content generation.
 */
export class FileStorageService implements IFileStorageService {
  private readonly client: GoogleGenAI;
  private readonly uploadedFiles: Map<string, FileMetadata> = new Map();

  constructor(apiKey?: string) {
    const key = apiKey ?? process.env.GOOGLE_AI_API_KEY;
    if (!key) {
      throw new Error("GOOGLE_AI_API_KEY environment variable is required");
    }
    this.client = new GoogleGenAI({ apiKey: key });
  }

  /**
   * Uploads files to Google Gemini Files API
   * @param files Array of files to upload
   * @returns Metadata for each uploaded file including URIs
   */
  async uploadFiles(files: File[]): Promise<FileMetadata[]> {
    const uploadPromises = files.map((file) => this.uploadSingleFile(file));
    const results = await Promise.all(uploadPromises);
    return results;
  }

  /**
   * Gets the URI for accessing a stored file
   * @param fileId The file identifier
   * @returns URI string for the file
   */
  async getFileUri(fileId: string): Promise<string> {
    const cached = this.uploadedFiles.get(fileId);
    if (cached) {
      return cached.uri;
    }

    // Try to retrieve file info from Gemini API
    const file = await this.client.files.get({ name: fileId });
    if (!file.uri) {
      throw new Error(`File ${fileId} not found or has no URI`);
    }
    return file.uri;
  }

  /**
   * Deletes files from storage
   * @param fileIds Array of file identifiers to delete
   */
  async deleteFiles(fileIds: string[]): Promise<void> {
    const deletePromises = fileIds.map(async (fileId) => {
      try {
        await this.client.files.delete({ name: fileId });
        this.uploadedFiles.delete(fileId);
      } catch (error) {
        // Log but don't throw - file might already be deleted
        console.warn(`Failed to delete file ${fileId}:`, error);
      }
    });
    await Promise.all(deletePromises);
  }

  /**
   * Uploads a single file to Gemini API
   */
  private async uploadSingleFile(file: File): Promise<FileMetadata> {
    // Convert File to Blob for upload
    const blob = new Blob([await file.arrayBuffer()], { type: file.type });

    const response = await this.client.files.upload({
      file: blob,
      config: {
        displayName: file.name,
        mimeType: file.type,
      },
    });

    if (!response.name || !response.uri) {
      throw new Error(`Failed to upload file: ${file.name}`);
    }

    const metadata: FileMetadata = {
      id: response.name,
      name: file.name,
      mimeType: file.type,
      uri: response.uri,
      sizeBytes: file.size,
    };

    // Cache the file metadata
    this.uploadedFiles.set(response.name, metadata);

    return metadata;
  }

  /**
   * Waits for a file to finish processing
   * Some files require processing before they can be used
   */
  async waitForProcessing(fileId: string, maxWaitMs = 60000): Promise<void> {
    const startTime = Date.now();
    const pollInterval = 2000;

    while (Date.now() - startTime < maxWaitMs) {
      const file = await this.client.files.get({ name: fileId });

      if (file.state === "ACTIVE") {
        return;
      }

      if (file.state === "FAILED") {
        throw new Error(`File processing failed for ${fileId}`);
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Timeout waiting for file ${fileId} to process`);
  }
}
