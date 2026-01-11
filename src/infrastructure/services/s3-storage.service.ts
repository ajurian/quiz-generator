import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { uuidToSlug } from "@/domain";
import type {
  IS3StorageService,
  FileUploadRequest,
  PresignedUploadUrl,
  IIdGenerator,
} from "@/application";

/**
 * S3 Storage Service Configuration
 */
export interface S3StorageServiceConfig {
  /** S3 access key ID */
  accessKeyId: string;
  /** S3 secret access key */
  secretAccessKey: string;
  /** S3 endpoint (R2 endpoint URL) */
  endpoint: string;
  /** S3 bucket name */
  bucketName: string;
}

/**
 * Presigned URL expiration time in seconds (15 minutes)
 */
const PRESIGNED_PUT_URL_EXPIRES_IN = 15 * 60;

/**
 * Default GET URL expiration time in seconds (1 hour)
 */
const DEFAULT_GET_URL_EXPIRES_IN = 60 * 60;

/**
 * S3 Storage Service using AWS S3 SDK
 *
 * Implements the IS3StorageService port using Cloudflare R2 via S3-compatible API.
 * Files are stored with the key format: {userId}/{quizSlug}/{uuidv7-base64url}
 */
export class S3StorageService implements IS3StorageService {
  private readonly client: S3Client;
  private readonly bucketName: string;
  private readonly idGenerator: IIdGenerator;

  constructor(config: S3StorageServiceConfig, idGenerator: IIdGenerator) {
    if (!config.accessKeyId) {
      throw new Error("S3_ACCESS_KEY_ID environment variable is required");
    }
    if (!config.secretAccessKey) {
      throw new Error("S3_SECRET_ACCESS_KEY environment variable is required");
    }
    if (!config.endpoint) {
      throw new Error("S3_ENDPOINT environment variable is required");
    }
    if (!config.bucketName) {
      throw new Error("S3_BUCKET_NAME environment variable is required");
    }

    this.client = new S3Client({
      region: "auto",
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: process.env.NODE_ENV === "development",
    });
    this.bucketName = config.bucketName;
    this.idGenerator = idGenerator;
  }

  /**
   * Generates presigned PUT URLs for client-side file uploads
   * Key format: {userId}/{quizSlug}/{uuidv7-base64url}
   */
  async generatePresignedPutUrls(
    files: FileUploadRequest[],
    userId: string,
    quizSlug: string
  ): Promise<PresignedUploadUrl[]> {
    const presignedUrls = await Promise.all(
      files.map(async (file) => {
        // Generate unique file ID using UUIDv7 converted to base64url slug
        const fileId = this.idGenerator.generate();
        const fileSlug = uuidToSlug(fileId);
        const key = `${userId}/${quizSlug}/${fileSlug}`;

        const command = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          ContentType: file.mimeType,
          ContentLength: file.sizeBytes,
        });

        const presignedUrl = await getSignedUrl(this.client, command, {
          expiresIn: PRESIGNED_PUT_URL_EXPIRES_IN,
        });

        return {
          filename: file.filename,
          key,
          presignedUrl,
        };
      })
    );

    return presignedUrls;
  }

  /**
   * Generates a presigned GET URL for file download
   */
  async generatePresignedGetUrl(
    key: string,
    expiresInSeconds: number = DEFAULT_GET_URL_EXPIRES_IN
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return getSignedUrl(this.client, command, {
      expiresIn: expiresInSeconds,
    });
  }

  /**
   * Gets an object's content from S3
   */
  async getObject(
    key: string
  ): Promise<{ content: Uint8Array; contentType: string }> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const response = await this.client.send(command);

    if (!response.Body) {
      throw new Error(`Object not found: ${key}`);
    }

    const content = await response.Body.transformToByteArray();
    const contentType = response.ContentType ?? "application/octet-stream";

    return { content, contentType };
  }

  /**
   * Deletes objects from S3
   */
  async deleteObjects(keys: string[]): Promise<void> {
    if (keys.length === 0) {
      return;
    }

    // S3 DeleteObjects can delete up to 1000 objects at once
    const batchSize = 1000;
    for (let i = 0; i < keys.length; i += batchSize) {
      const batch = keys.slice(i, i + batchSize);
      const command = new DeleteObjectsCommand({
        Bucket: this.bucketName,
        Delete: {
          Objects: batch.map((key) => ({ Key: key })),
          Quiet: true,
        },
      });

      try {
        await this.client.send(command);
      } catch (error) {
        console.warn(`Failed to delete objects batch starting at ${i}:`, error);
      }
    }
  }
}
