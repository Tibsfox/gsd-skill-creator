/**
 * Markdown-aware word counter for skill generation.
 * Phase 406 Plan 01 -- counts prose words, excluding code blocks and formatting.
 */

/**
 * Count words in a markdown string, stripping formatting and excluding
 * fenced code block content.
 *
 * Rules:
 * - Fenced code blocks (``` ... ```) are entirely excluded
 * - Markdown formatting is stripped: headings (#), bold (**), italic (*),
 *   inline code (`), links, images
 * - Remaining text is split on whitespace; empty tokens are filtered out
 */
export function countWords(markdown: string): number {
  // 1. Remove fenced code blocks (```...```)
  let text = markdown.replace(/```[\s\S]*?```/g, '');

  // 2. Remove images ![alt](url)
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, '');

  // 3. Remove links but keep link text [text](url) -> text
  text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');

  // 4. Remove heading markers
  text = text.replace(/^#{1,6}\s+/gm, '');

  // 5. Remove bold/italic markers (**, __, *, _)
  text = text.replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1');
  text = text.replace(/_{1,2}([^_]+)_{1,2}/g, '$1');

  // 6. Remove inline code backticks but keep content
  text = text.replace(/`([^`]*)`/g, '$1');

  // 7. Remove horizontal rules
  text = text.replace(/^[-*_]{3,}\s*$/gm, '');

  // 8. Remove blockquote markers
  text = text.replace(/^>\s+/gm, '');

  // 9. Remove list markers
  text = text.replace(/^[\s]*[-*+]\s+/gm, '');
  text = text.replace(/^[\s]*\d+\.\s+/gm, '');

  // 10. Remove HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // 11. Split on whitespace and count non-empty tokens
  const words = text.split(/\s+/).filter(w => w.length > 0);

  return words.length;
}
