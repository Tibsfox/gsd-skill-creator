import type { TocEntry } from '../types.js';

/** Regex to match opening heading tags h1-h6 and their content. */
const HEADING_RE = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;

/** Regex to strip HTML tags from heading content. */
const STRIP_TAGS_RE = /<[^>]+>/g;

/**
 * Slugify text for use as an HTML id attribute.
 *
 * Lowercase, replace spaces/non-alphanum with hyphens,
 * collapse runs, trim leading/trailing hyphens.
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Extract a table of contents from an HTML string.
 *
 * Parses `<h1>` through `<h6>` tags, generates slugified IDs,
 * and handles duplicate headings by appending `-1`, `-2`, etc.
 */
export function extractToc(html: string): TocEntry[] {
  const entries: TocEntry[] = [];
  const idCounts = new Map<string, number>();

  let match: RegExpExecArray | null;
  // Reset regex state
  HEADING_RE.lastIndex = 0;

  while ((match = HEADING_RE.exec(html)) !== null) {
    const level = parseInt(match[1], 10);
    const rawContent = match[2];

    // Strip nested HTML tags to get plain text
    const text = rawContent.replace(STRIP_TAGS_RE, '').trim();

    // Generate unique ID
    let id = slugify(text);
    const count = idCounts.get(id) ?? 0;
    if (count > 0) {
      id = `${id}-${count}`;
    }
    idCounts.set(slugify(text), count + 1);

    entries.push({ level, text, id });
  }

  return entries;
}
