import type { ContentPage, SearchEntry } from './types';

/**
 * Strip markdown syntax from raw text, leaving only plain words.
 * Removes: headings (#), links [text](url), images ![](url), emphasis,
 * inline code, fenced code blocks, blockquotes, and horizontal rules.
 */
export function stripMarkdownSyntax(md: string): string {
  let text = md;

  // Remove fenced code blocks (``` ... ```)
  text = text.replace(/```[\s\S]*?```/g, '');

  // Remove inline code
  text = text.replace(/`([^`]+)`/g, '$1');

  // Remove images ![alt](url)
  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1');

  // Remove links [text](url) → keep text
  text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');

  // Remove heading markers
  text = text.replace(/^#{1,6}\s+/gm, '');

  // Remove bold/italic markers
  text = text.replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1');
  text = text.replace(/_{1,3}([^_]+)_{1,3}/g, '$1');

  // Remove blockquote markers
  text = text.replace(/^>\s*/gm, '');

  // Remove horizontal rules
  text = text.replace(/^[-*_]{3,}\s*$/gm, '');

  // Collapse whitespace
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

/**
 * Extract the first N words from plain text.
 */
function firstNWords(text: string, n: number): string {
  const words = text.split(/\s+/).filter(Boolean);
  return words.slice(0, n).join(' ');
}

/**
 * Build a search index from processed content pages.
 * Excludes draft pages. Uses compressed keys for minimal JSON size.
 */
export function buildSearchIndex(pages: ContentPage[]): SearchEntry[] {
  return pages
    .filter((p) => !p.frontmatter.draft)
    .map((page) => {
      const desc = page.frontmatter.description ?? '';
      const truncatedDesc = desc.length > 160 ? desc.slice(0, 160) : desc;
      const plainText = stripMarkdownSyntax(page.rawMarkdown);
      const excerpt = firstNWords(plainText, 200);

      return {
        t: page.frontmatter.title,
        d: truncatedDesc,
        u: page.url,
        g: page.frontmatter.tags ?? [],
        x: excerpt,
      };
    });
}
