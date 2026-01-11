import { describe, expect, it, beforeEach, mock } from "bun:test";
import { FileStorageService } from "../../infrastructure/services/file-storage.service";
import type { FileMetadata } from "@/application";

describe("FileStorageService", () => {
  const testApiKey = "test-api-key";

  describe("uploadFiles", () => {
    it("should upload multiple files and return metadata", async () => {
      const service = new FileStorageService(testApiKey);

      // Mock the client
      const mockUpload = mock(() =>
        Promise.resolve({
          name: "files/abc123",
          uri: "gs://bucket/files/abc123",
        })
      );

      (
        service as unknown as {
          client: { files: { upload: typeof mockUpload } };
        }
      ).client = {
        files: { upload: mockUpload },
      } as unknown as typeof service extends { client: infer C } ? C : never;

      const files = [
        new File(["content1"], "file1.pdf", { type: "application/pdf" }),
        new File(["content2"], "file2.txt", { type: "text/plain" }),
      ];

      const result = await service.uploadFiles(files);

      expect(result).toHaveLength(2);
      expect(mockUpload).toHaveBeenCalledTimes(2);
    });

    it("should return correct metadata structure", async () => {
      const service = new FileStorageService(testApiKey);

      const mockUpload = mock(() =>
        Promise.resolve({
          name: "files/test-id",
          uri: "gs://bucket/files/test-id",
        })
      );

      (
        service as unknown as {
          client: { files: { upload: typeof mockUpload } };
        }
      ).client = {
        files: { upload: mockUpload },
      } as unknown as typeof service extends { client: infer C } ? C : never;

      const file = new File(["test content"], "test.pdf", {
        type: "application/pdf",
      });
      const result = await service.uploadFiles([file]);

      expect(result[0]).toMatchObject({
        id: "files/test-id",
        name: "test.pdf",
        mimeType: "application/pdf",
        uri: "gs://bucket/files/test-id",
      });
      expect(result[0]!.sizeBytes).toBeGreaterThan(0);
    });

    it("should throw error when upload fails", async () => {
      const service = new FileStorageService(testApiKey);

      const mockUpload = mock(() =>
        Promise.resolve({
          name: undefined,
          uri: undefined,
        })
      );

      (
        service as unknown as {
          client: { files: { upload: typeof mockUpload } };
        }
      ).client = {
        files: { upload: mockUpload },
      } as unknown as typeof service extends { client: infer C } ? C : never;

      const file = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });

      await expect(service.uploadFiles([file])).rejects.toThrow(
        "Failed to upload file: test.pdf"
      );
    });
  });

  describe("getFileUri", () => {
    it("should return cached URI if available", async () => {
      const service = new FileStorageService(testApiKey);

      // Manually add to cache
      const uploadedFiles = (
        service as unknown as { uploadedFiles: Map<string, FileMetadata> }
      ).uploadedFiles;
      uploadedFiles.set("cached-file", {
        id: "cached-file",
        name: "test.pdf",
        mimeType: "application/pdf",
        uri: "gs://bucket/cached-file",
        sizeBytes: 1024,
      });

      const result = await service.getFileUri("cached-file");

      expect(result).toBe("gs://bucket/cached-file");
    });

    it("should fetch from API if not cached", async () => {
      const service = new FileStorageService(testApiKey);

      const mockGet = mock(() =>
        Promise.resolve({
          uri: "gs://bucket/remote-file",
        })
      );

      (
        service as unknown as { client: { files: { get: typeof mockGet } } }
      ).client = {
        files: { get: mockGet },
      } as unknown as typeof service extends { client: infer C } ? C : never;

      const result = await service.getFileUri("remote-file");

      expect(result).toBe("gs://bucket/remote-file");
      expect(mockGet).toHaveBeenCalledWith({ name: "remote-file" });
    });

    it("should throw error when file not found", async () => {
      const service = new FileStorageService(testApiKey);

      const mockGet = mock(() =>
        Promise.resolve({
          uri: undefined,
        })
      );

      (
        service as unknown as { client: { files: { get: typeof mockGet } } }
      ).client = {
        files: { get: mockGet },
      } as unknown as typeof service extends { client: infer C } ? C : never;

      await expect(service.getFileUri("missing-file")).rejects.toThrow(
        "File missing-file not found or has no URI"
      );
    });
  });

  describe("deleteFiles", () => {
    it("should delete multiple files", async () => {
      const service = new FileStorageService(testApiKey);

      const mockDelete = mock(() => Promise.resolve());

      (
        service as unknown as {
          client: { files: { delete: typeof mockDelete } };
        }
      ).client = {
        files: { delete: mockDelete },
      } as unknown as typeof service extends { client: infer C } ? C : never;

      await service.deleteFiles(["file-1", "file-2", "file-3"]);

      expect(mockDelete).toHaveBeenCalledTimes(3);
    });

    it("should remove from cache after deletion", async () => {
      const service = new FileStorageService(testApiKey);

      const uploadedFiles = (
        service as unknown as { uploadedFiles: Map<string, FileMetadata> }
      ).uploadedFiles;
      uploadedFiles.set("to-delete", {
        id: "to-delete",
        name: "test.pdf",
        mimeType: "application/pdf",
        uri: "gs://bucket/to-delete",
        sizeBytes: 1024,
      });

      const mockDelete = mock(() => Promise.resolve());

      (
        service as unknown as {
          client: { files: { delete: typeof mockDelete } };
        }
      ).client = {
        files: { delete: mockDelete },
      } as unknown as typeof service extends { client: infer C } ? C : never;

      await service.deleteFiles(["to-delete"]);

      expect(uploadedFiles.has("to-delete")).toBe(false);
    });

    it("should not throw when deletion fails", async () => {
      const service = new FileStorageService(testApiKey);

      const mockDelete = mock(() => Promise.reject(new Error("Not found")));

      (
        service as unknown as {
          client: { files: { delete: typeof mockDelete } };
        }
      ).client = {
        files: { delete: mockDelete },
      } as unknown as typeof service extends { client: infer C } ? C : never;

      // Should not throw
      await expect(
        service.deleteFiles(["non-existent"])
      ).resolves.toBeUndefined();
    });
  });

  describe("waitForProcessing", () => {
    it("should resolve immediately when file is ACTIVE", async () => {
      const service = new FileStorageService(testApiKey);

      const mockGet = mock(() =>
        Promise.resolve({
          state: "ACTIVE",
        })
      );

      (
        service as unknown as { client: { files: { get: typeof mockGet } } }
      ).client = {
        files: { get: mockGet },
      } as unknown as typeof service extends { client: infer C } ? C : never;

      await expect(
        service.waitForProcessing("file-id")
      ).resolves.toBeUndefined();
      expect(mockGet).toHaveBeenCalledTimes(1);
    });

    it("should throw when file processing fails", async () => {
      const service = new FileStorageService(testApiKey);

      const mockGet = mock(() =>
        Promise.resolve({
          state: "FAILED",
        })
      );

      (
        service as unknown as { client: { files: { get: typeof mockGet } } }
      ).client = {
        files: { get: mockGet },
      } as unknown as typeof service extends { client: infer C } ? C : never;

      await expect(service.waitForProcessing("file-id")).rejects.toThrow(
        "File processing failed for file-id"
      );
    });

    it("should poll until file is ACTIVE", async () => {
      const service = new FileStorageService(testApiKey);

      let callCount = 0;
      const mockGet = mock(() => {
        callCount++;
        return Promise.resolve({
          state: callCount < 3 ? "PROCESSING" : "ACTIVE",
        });
      });

      (
        service as unknown as { client: { files: { get: typeof mockGet } } }
      ).client = {
        files: { get: mockGet },
      } as unknown as typeof service extends { client: infer C } ? C : never;

      await service.waitForProcessing("file-id", 10000);

      expect(callCount).toBe(3);
    });
  });
});
