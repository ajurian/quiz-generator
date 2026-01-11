import React from "react";

/**
 * Parses inline markdown formatting (bold, italic, code) and returns React elements.
 * Supports:
 * - **bold** or __bold__
 * - *italic* or _italic_
 * - `code`
 *
 * Note: Bold patterns are checked before italic to prevent conflicts.
 */
export function parseInlineMarkdown(text: string): React.ReactNode[] {
  // Regex identifies:
  // 1. **bold** -> (\*\*.*?\*\*)
  // 2. __bold__ -> (__.*?__)
  // 3. *italic* -> (\*[^*]+?\*)
  // 4. _italic_ -> (_[^_]+?_)
  // 5. `code`   -> (`[^`]+?`)
  const regex = /(\*\*[^*]+?\*\*|__[^_]+?__|`[^`]+?`|\*[^*]+?\*|_[^_]+?_)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    // Bold: **text** or __text__
    if (
      (part.startsWith("**") && part.endsWith("**")) ||
      (part.startsWith("__") && part.endsWith("__"))
    ) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    // Italic: *text* or _text_
    if (
      (part.startsWith("*") && part.endsWith("*")) ||
      (part.startsWith("_") && part.endsWith("_"))
    ) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    // Code: `text`
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          className="bg-muted relative inline whitespace-pre-wrap break-words rounded px-[0.3em] py-[0.1em] font-mono text-[0.85em] font-medium"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    // Plain text
    return part;
  });
}

interface FormattedTextProps {
  text: string;
  className?: string;
}

/**
 * Component that renders text with inline markdown formatting (bold, italic, code).
 */
export function FormattedText({ text, className }: FormattedTextProps) {
  return <span className={className}>{parseInlineMarkdown(text)}</span>;
}
