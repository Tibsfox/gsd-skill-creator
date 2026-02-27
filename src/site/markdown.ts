import { Marked, Renderer } from 'marked';
import type { TocEntry } from './types.js';
import { extractToc } from './utils/toc.js';

/* ---- Citation state (module-level, reset between pages) ---- */

let citationMap = new Map<string, number>();
let citationCounter = 0;

/** Reset citation counter between pages. */
export function resetCitationCounter(): void {
  citationMap = new Map<string, number>();
  citationCounter = 0;
}

/** Get the current citation key-to-number mapping. */
export function getCitationMap(): Map<string, number> {
  return new Map(citationMap);
}

/* ---- Citation pre-processing ---- */

/** Single citation pattern: [@key] */
const SINGLE_CITE_RE = /\[@([a-zA-Z0-9_-]+)\]/g;

/** Multiple citation pattern: [@a; @b; ...] */
const MULTI_CITE_RE = /\[(@[a-zA-Z0-9_-]+(?:;\s*@[a-zA-Z0-9_-]+)+)\]/g;

function getCitationNumber(key: string): number {
  const existing = citationMap.get(key);
  if (existing !== undefined) return existing;
  citationCounter += 1;
  citationMap.set(key, citationCounter);
  return citationCounter;
}

function renderCitationLink(key: string): string {
  const num = getCitationNumber(key);
  return `<sup class="cite"><a href="/bibliography/#${key}">[${num}]</a></sup>`;
}

/**
 * Pre-process citation syntax before markdown rendering.
 * Handles both single [@key] and multiple [@a; @b] forms.
 */
function preprocessCitations(markdown: string): string {
  // Process multi-citations first (to avoid single-citation regex consuming parts)
  let result = markdown.replace(MULTI_CITE_RE, (_match, group: string) => {
    const keys = group
      .split(';')
      .map((k: string) => k.trim().replace(/^@/, ''));
    const links = keys.map((key: string) => {
      const num = getCitationNumber(key);
      return `<a href="/bibliography/#${key}">[${num}]</a>`;
    });
    return `<sup class="cite">${links.join(', ')}</sup>`;
  });

  // Process single citations
  result = result.replace(SINGLE_CITE_RE, (_match, key: string) => {
    return renderCitationLink(key);
  });

  return result;
}

/* ---- Heading ID slugifier ---- */

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
}

/* ---- Custom marked renderer ---- */

function createRenderer(): Renderer {
  const renderer = new Renderer();

  // Headings with slugified IDs
  renderer.heading = function ({ text, depth }: { text: string; depth: number }): string {
    const id = slugifyHeading(text);
    return `<h${depth} id="${id}">${text}</h${depth}>\n`;
  };

  // External links get target=_blank
  renderer.link = function ({ href, text }: { href: string; text: string }): string {
    const isExternal =
      href.startsWith('http://') || href.startsWith('https://');
    if (isExternal) {
      return `<a href="${href}" target="_blank" rel="noopener">${text}</a>`;
    }
    return `<a href="${href}">${text}</a>`;
  };

  return renderer;
}

/* ---- Main processor ---- */

/**
 * Process markdown to HTML with custom extensions:
 * - Heading IDs (slugified)
 * - Citation syntax ([@key] and [@a; @b])
 * - External link markers (target=_blank, rel=noopener)
 * - Code blocks with language class
 * - TOC extraction
 */
export function processMarkdown(markdown: string): { html: string; toc: TocEntry[] } {
  if (!markdown || markdown.trim() === '') {
    return { html: '', toc: [] };
  }

  // Pre-process citations before markdown rendering
  const preprocessed = preprocessCitations(markdown);

  // Create a fresh marked instance with our custom renderer
  const instance = new Marked();
  instance.use({ renderer: createRenderer() });

  // Render synchronously
  const html = instance.parse(preprocessed) as string;

  // Extract TOC from the rendered HTML
  const toc = extractToc(html);

  return { html: html.trim(), toc };
}
