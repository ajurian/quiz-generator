import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts a string to a URL-friendly slug
 * @param text - The text to slugify
 * @returns A lowercase, hyphenated string safe for URLs
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove non-word chars (except spaces and hyphens)
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Cleans incomplete JSON from a streaming response.
 *
 * When streaming JSON from an LLM, you may receive truncated output mid-parse.
 * This function:
 * 1. Identifies incomplete elements inside arrays and removes them
 * 2. Removes trailing commas and broken literals
 * 3. Closes any remaining open structures
 *
 * @param jsonStr - The potentially incomplete JSON string
 * @returns A valid JSON string that can be safely parsed
 */
export function cleanJson(jsonStr: string): string {
  if (!jsonStr) return "{}";

  // 1. Build a stack of open structures with their start indices
  const stack: Array<{ char: string; index: number }> = [];
  let inString = false;
  let isEscaped = false;
  let stringStart = -1;

  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i];
    if (inString) {
      if (char === "\\" && !isEscaped) {
        isEscaped = true;
      } else if (char === '"' && !isEscaped) {
        inString = false;
        stringStart = -1;
      } else {
        isEscaped = false;
      }
    } else {
      if (char === '"') {
        inString = true;
        stringStart = i;
      } else if (char === "{" || char === "[") {
        stack.push({ char, index: i });
      } else if (char === "}" || char === "]") {
        if (stack.length) stack.pop();
      }
    }
  }

  let cutIndex = jsonStr.length;
  let foundCut = false;

  // 2. Identify where to cut
  // We look for the *shallowest* open container that is inside an array.
  // Example: [ { "a": { ...
  // Stack has: [ (root), { (outer), { (inner)
  // We want to cut at '{ (outer)' because it is the direct child of '['.
  for (let i = 1; i < stack.length; i++) {
    const parent = stack[i - 1];
    const current = stack[i];

    if (parent === undefined || current === undefined) continue;

    if (parent.char === "[") {
      // Found an open item inside an array. This item is incomplete.
      cutIndex = current.index;
      foundCut = true;
      break; // Stop at the highest level to remove the whole element
    }
  }

  // 3. If no container cut found, check if we are in a string inside an array
  if (!foundCut && inString) {
    // Check immediate parent of the string
    const parent = stack.length > 0 ? stack[stack.length - 1] : null;
    if (parent && parent.char === "[") {
      cutIndex = stringStart;
      foundCut = true;
    }
  }

  // Apply the cut
  let result = jsonStr.substring(0, cutIndex);

  // 4. Clean up the tail (broken literals, trailing commas)
  result = result.trim();

  if (result.endsWith(",")) {
    result = result.slice(0, -1);
  }

  // If we ended with a key but no value (e.g. {"key":), add null
  if (result.endsWith(":")) {
    result += "null";
  }

  // Handle broken literals (e.g., "tru", "fa", "12.")
  // We only check this if we are NOT at a closing bracket or quote
  if (!result.endsWith("}") && !result.endsWith("]") && !result.endsWith('"')) {
    const match = result.match(/([a-zA-Z0-9\.\-]+)$/);
    if (match && match[1]) {
      const token = match[1];
      // If it's not a valid number/literal, and we assume it's garbage or cut-off
      const isValid = /^(true|false|null|-?\d+(\.\d+)?([eE][+-]?\d+)?)$/.test(
        token
      );
      if (!isValid) {
        result = result.slice(0, -token.length);

        // Re-clean after removing token
        result = result.trim();
        if (result.endsWith(",")) result = result.slice(0, -1);
        if (result.endsWith(":")) result += "null";
      }
    }
  }

  // 5. Close remaining open structures
  // We need to rebuild a simple stack for the *pruned* result to know what to close
  const closeStack: string[] = [];
  inString = false;
  isEscaped = false;

  for (let i = 0; i < result.length; i++) {
    const char = result[i];
    if (inString) {
      if (char === "\\" && !isEscaped) isEscaped = true;
      else if (char === '"' && !isEscaped) inString = false;
      else isEscaped = false;
    } else {
      if (char === '"') inString = true;
      else if (char === "{") closeStack.push("}");
      else if (char === "[") closeStack.push("]");
      else if (char === "}" || char === "]") {
        if (closeStack.length) closeStack.pop();
      }
    }
  }

  // Append closing characters
  while (closeStack.length) {
    result += closeStack.pop();
  }

  return result;
}
