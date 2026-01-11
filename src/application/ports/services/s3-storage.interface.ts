/**
 * File upload request for generating presigned URLs
 */
export interface FileUploadRequest {
  /** Original filename */
  filename: string;
  /** MIME type of the file */
  mimeType: string;
  /** File size in bytes */
  sizeBytes: number;
}

/**
 * Presigned URL response for client-side upload
 */
export interface PresignedUploadUrl {
  /** Original filename */
  filename: string;
  /** S3 object key (path in bucket) */
  key: string;
  /** Presigned PUT URL for uploading */
  presignedUrl: string;
}

/**
 * Service interface for S3-compatible object storage operations
 * This is a port - implementation uses AWS S3 SDK for Cloudflare R2
 *
 * Key format: {userId}/{quizSlug}/{uuidv7-base64url}
 */
export interface IS3StorageService {
  /**
   * Generates presigned PUT URLs for client-side file uploads
   * @param files Array of file metadata for which to generate URLs
   * @param userId User ID for the key prefix
   * @param quizSlug Quiz slug for the key prefix
   * @returns Array of presigned URL objects with keys
   */
  generatePresignedPutUrls(
    files: FileUploadRequest[],
    userId: string,
    quizSlug: string
  ): Promise<PresignedUploadUrl[]>;

  /**
   * Generates a presigned GET URL for file download
   * @param key S3 object key
   * @param expiresInSeconds URL expiration time (default: 3600)
   * @returns Presigned GET URL
   */
  generatePresignedGetUrl(
    key: string,
    expiresInSeconds?: number
  ): Promise<string>;

  /**
   * Gets an object's content from S3
   * @param key S3 object key
   * @returns Object content as a Uint8Array and content type
   */
  getObject(key: string): Promise<{ content: Uint8Array; contentType: string }>;

  /**
   * Deletes objects from S3
   * @param keys Array of S3 object keys to delete
   */
  deleteObjects(keys: string[]): Promise<void>;
}
