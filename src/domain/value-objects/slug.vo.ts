import { InvalidValueError } from "../errors";

/**
 * Slug Value Object
 *
 * Provides utilities for converting between UUIDs and URL-safe base64 slugs.
 * Slugs are deterministic, compact, non-guessable identifiers derived from UUIDs.
 *
 * Format: base64url encoding of raw 16-byte UUID (no padding, URL-safe)
 * - Uses URL-safe alphabet: A-Z, a-z, 0-9, -, _
 * - Always 22 characters long (128 bits / 6 bits per char = 22 chars, rounded up)
 * - No padding characters (=)
 */

/**
 * Standard base64 alphabet to URL-safe base64 alphabet mapping
 */
const BASE64_TO_BASE64URL: Record<string, string> = {
  "+": "-",
  "/": "_",
};

const BASE64URL_TO_BASE64: Record<string, string> = {
  "-": "+",
  _: "/",
};

/**
 * Converts a UUID string to a URL-safe base64 slug
 *
 * @param uuid - UUID string in standard format (with or without hyphens)
 * @returns URL-safe base64 encoded slug (22 characters)
 * @throws Error if the UUID is invalid
 *
 * @example
 * uuidToSlug("550e8400-e29b-41d4-a716-446655440000")
 * // Returns: "VQ6EAOKbQdSnFkRmVUQAAA"
 */
export function uuidToSlug(uuid: string): string {
  // Remove hyphens and validate
  const hex = uuid.replace(/-/g, "");

  if (!/^[0-9a-f]{32}$/i.test(hex)) {
    throw new InvalidValueError("UUID", `Invalid UUID format: ${uuid}`);
  }

  // Convert hex string to bytes
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }

  // Convert to base64
  let base64: string;
  if (typeof Buffer !== "undefined") {
    // Node.js / Bun environment
    base64 = Buffer.from(bytes).toString("base64");
  } else {
    // Browser environment
    base64 = btoa(String.fromCharCode(...bytes));
  }

  // Convert to URL-safe base64 and remove padding
  const base64url = base64
    .replace(/[+/]/g, (char) => BASE64_TO_BASE64URL[char] ?? char)
    .replace(/=+$/, "");

  return base64url;
}

/**
 * Converts a URL-safe base64 slug back to a UUID string
 *
 * @param slug - URL-safe base64 encoded slug (22 characters)
 * @returns UUID string in standard format (with hyphens)
 * @throws Error if the slug is invalid
 *
 * @example
 * slugToUuid("VQ6EAOKbQdSnFkRmVUQAAA")
 * // Returns: "550e8400-e29b-41d4-a716-446655440000"
 */
export function slugToUuid(slug: string): string {
  if (!/^[A-Za-z0-9_-]{22}$/.test(slug)) {
    throw new InvalidValueError("Slug", `Invalid slug format: ${slug}`);
  }

  // Convert from URL-safe base64 to standard base64 with padding
  const base64 =
    slug.replace(/[-_]/g, (char) => BASE64URL_TO_BASE64[char] ?? char) + "==";

  // Decode base64 to bytes
  let bytes: Uint8Array;
  if (typeof Buffer !== "undefined") {
    // Node.js / Bun environment
    bytes = new Uint8Array(Buffer.from(base64, "base64"));
  } else {
    // Browser environment
    const binaryString = atob(base64);
    bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
  }

  if (bytes.length !== 16) {
    throw new InvalidValueError(
      "Slug",
      `Invalid slug: decoded to ${bytes.length} bytes instead of 16`
    );
  }

  // Convert bytes to hex string
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Format as UUID with hyphens
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Validates if a string is a valid slug format
 *
 * @param slug - String to validate
 * @returns true if the string is a valid base64url slug
 */
export function isValidSlug(slug: string): boolean {
  return /^[A-Za-z0-9_-]{22}$/.test(slug);
}

/**
 * Slug Value Object class for type-safe slug handling
 */
export class Slug {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  /**
   * Creates a Slug from a base64url string
   * @throws {InvalidValueError} if the slug is invalid
   */
  public static fromString(slug: string): Slug {
    if (!isValidSlug(slug)) {
      throw new InvalidValueError("Slug", `Invalid slug format: ${slug}`);
    }
    return new Slug(slug);
  }

  /**
   * Creates a Slug from a UUID
   * @throws Error if the UUID is invalid
   */
  public static fromUuid(uuid: string): Slug {
    const slug = uuidToSlug(uuid);
    return new Slug(slug);
  }

  /**
   * Gets the slug string value
   */
  get value(): string {
    return this._value;
  }

  /**
   * Converts the slug back to a UUID
   */
  public toUuid(): string {
    return slugToUuid(this._value);
  }

  /**
   * String representation
   */
  public toString(): string {
    return this._value;
  }

  /**
   * Equality check
   */
  public equals(other: Slug): boolean {
    return this._value === other._value;
  }
}
