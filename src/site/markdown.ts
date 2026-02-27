import type { TocEntry } from './types';

/** Process markdown to HTML with custom extensions. */
export function processMarkdown(_markdown: string): { html: string; toc: TocEntry[] } {
  throw new Error('Not implemented');
}

/** Reset citation counter between pages. */
export function resetCitationCounter(): void {
  // stub
}

/** Get the current citation key-to-number mapping. */
export function getCitationMap(): Map<string, number> {
  return new Map();
}
