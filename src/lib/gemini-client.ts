import { BodyInit } from "bun";
import fs from "node:fs";
import path from "node:path";

// --- Types ---

export interface GeminiConfig {
  apiKey: string;
  baseUrl?: string;
}

export type FileInput = string | Blob | Buffer;

export interface FileUploadParams {
  file: FileInput;
  displayName?: string;
  mimeType?: string;
}

export interface GenerateContentParams {
  model: string;
  contents: Content[];
  systemInstruction?: string;
  generationConfig?: GenerationConfig;
}

export interface Content {
  role: "user" | "model";
  parts: Part[];
}

// Updated Part definition to support "thought" for reasoning models
export type Part =
  | { text: string; thought?: boolean } // Standard text part
  | { thought: true; text: string } // Explicit thought part
  | { fileData: { mimeType: string; fileUri: string } }
  | { functionCall: { name: string; args: object } }
  | { functionResponse: { name: string; response: object } };

export interface GenerationConfig {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  responseMimeType?: string;
  _responseJsonSchema?: any;
}

export interface UploadedFile {
  name: string;
  displayName: string;
  mimeType: string;
  sizeBytes: string;
  uri: string;
  state: string;
}

// --- Response Types ---

export interface GenerateContentResponse {
  candidates?: Candidate[];
  promptFeedback?: PromptFeedback;
  usageMetadata?: UsageMetadata;
}

export interface Candidate {
  content: Content;
  finishReason?: FinishReason;
  index?: number;
  safetyRatings?: SafetyRating[];
  citationMetadata?: CitationMetadata;
  tokenCount?: number;
}

export interface CitationMetadata {
  citationSources: CitationSource[];
}

export interface CitationSource {
  startIndex?: number;
  endIndex?: number;
  uri?: string;
  license?: string;
}

export interface SafetyRating {
  category: HarmCategory;
  probability: HarmProbability;
  blocked?: boolean;
}

export interface PromptFeedback {
  blockReason?: string;
  safetyRatings?: SafetyRating[];
}

export interface UsageMetadata {
  thoughtsTokenCount: number;
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
}

export type FinishReason =
  | "FINISH_REASON_UNSPECIFIED"
  | "STOP"
  | "MAX_TOKENS"
  | "SAFETY"
  | "RECITATION"
  | "OTHER"
  | "BLOCKLIST"
  | "PROHIBITED_CONTENT"
  | "SPII"
  | "MALFORMED_FUNCTION_CALL";

export type HarmCategory =
  | "HARM_CATEGORY_HATE_SPEECH"
  | "HARM_CATEGORY_SEXUALLY_EXPLICIT"
  | "HARM_CATEGORY_HARASSMENT"
  | "HARM_CATEGORY_DANGEROUS_CONTENT";

export type HarmProbability =
  | "HARM_PROBABILITY_UNSPECIFIED"
  | "NEGLIGIBLE"
  | "LOW"
  | "MEDIUM"
  | "HIGH";

// --- SDK Implementation ---

export class GeminiClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: GeminiConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl =
      config.baseUrl || "https://generativelanguage.googleapis.com";
  }

  async uploadFile(params: FileUploadParams): Promise<UploadedFile> {
    const { content, size, mimeType, displayName } =
      this.processFileInput(params);

    const startUrl = `${this.baseUrl}/upload/v1beta/files?key=${this.apiKey}`;
    const startHeaders = {
      "X-Goog-Upload-Protocol": "resumable",
      "X-Goog-Upload-Command": "start",
      "X-Goog-Upload-Header-Content-Length": size.toString(),
      "X-Goog-Upload-Header-Content-Type": mimeType,
      "Content-Type": "application/json",
    };

    const startRes = await fetch(startUrl, {
      method: "POST",
      headers: startHeaders,
      body: JSON.stringify({ file: { display_name: displayName } }),
    });

    if (!startRes.ok) {
      throw new Error(
        `Failed to start upload session: ${startRes.statusText} - ${await startRes.text()}`
      );
    }

    const uploadUrl = startRes.headers.get("x-goog-upload-url");
    if (!uploadUrl) {
      throw new Error("No upload URL received from resumable session start.");
    }

    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Content-Length": size.toString(),
        "X-Goog-Upload-Offset": "0",
        "X-Goog-Upload-Command": "upload, finalize",
      },
      // @ts-ignore - duplex is required for streams in Node.js/Bun fetch
      duplex: "half",
      body: content as any,
    });

    if (!uploadRes.ok) {
      throw new Error(
        `File upload failed: ${uploadRes.statusText} - ${await uploadRes.text()}`
      );
    }

    const result = (await uploadRes.json()) as { file: UploadedFile };
    return result.file;
  }

  private processFileInput(params: FileUploadParams) {
    let content: BodyInit;
    let size: number;
    let mimeType = params.mimeType || "application/octet-stream";
    let displayName = params.displayName || "uploaded-file";

    if (typeof params.file === "string") {
      const stats = fs.statSync(params.file);
      size = stats.size;
      content = fs.createReadStream(params.file) as unknown as BodyInit;
      displayName = params.displayName || path.basename(params.file);
    } else if (params.file instanceof Blob) {
      size = params.file.size;
      content = params.file;
      if (!params.mimeType && params.file.type) {
        mimeType = params.file.type;
      }
    } else if (Buffer.isBuffer(params.file)) {
      size = params.file.length;
      content = params.file as unknown as BodyInit;
    } else {
      throw new Error(
        "Invalid file type. Must be file path (string), Blob, or Buffer."
      );
    }

    return { content, size, mimeType, displayName };
  }

  async generateContent(
    params: GenerateContentParams
  ): Promise<GenerateContentResponse> {
    const url = `${this.baseUrl}/v1beta/models/${params.model}:generateContent?key=${this.apiKey}`;
    const body = this.prepareBody(params);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(
        `GenerateContent failed: ${res.statusText} - ${await res.text()}`
      );
    }

    return (await res.json()) as GenerateContentResponse;
  }

  async *streamGenerateContent(
    params: GenerateContentParams
  ): AsyncGenerator<GenerateContentResponse, void, unknown> {
    const url = `${this.baseUrl}/v1beta/models/${params.model}:streamGenerateContent?key=${this.apiKey}&alt=sse`;
    const body = this.prepareBody(params);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok || !res.body) {
      throw new Error(
        `StreamGenerateContent failed: ${res.statusText} - ${await res.text()}`
      );
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const jsonStr = line.slice(6).trim();
          if (!jsonStr || jsonStr === "[DONE]") continue;

          try {
            const chunk = JSON.parse(jsonStr) as GenerateContentResponse;
            yield chunk;
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }
  }

  private prepareBody(params: GenerateContentParams): any {
    const body: any = {
      contents: params.contents,
      generationConfig: params.generationConfig,
    };
    if (params.systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: params.systemInstruction }],
      };
    }
    return body;
  }
}
