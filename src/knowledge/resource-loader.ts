/**
 * Resource catalog markdown parser.
 *
 * Parses resource documents into structured ResourceCatalog objects by
 * splitting on ## headings and extracting markdown links within each
 * section. Links are categorized by section heading and also flattened
 * into an allLinks array for convenience.
 *
 * @module resource-loader
 */

import { readFile } from 'node:fs/promises';

// ============================================================================
// Types
// ============================================================================

/**
 * A single resource link extracted from markdown.
 */
export interface ResourceLink {
  title: string;
  url: string;
  description: string | null;
}

/**
 * Categorized collection of resource links.
 *
 * Categories are keyed by ## heading text. allLinks is a flat array
 * of every link across all categories.
 */
export interface ResourceCatalog {
  categories: Map<string, ResourceLink[]>;
  allLinks: ResourceLink[];
}

// ============================================================================
// Link extraction regex
// ============================================================================

/**
 * Matches markdown links: [title](url) optional-description
 * Captures: 1=title, 2=url, 3=rest-of-line (description)
 */
const LINK_REGEX = /\[([^\]]+)\]\(([^)]+)\)(.*)/g;

// ============================================================================
// parseResources
// ============================================================================

/**
 * Parse a resource catalog markdown document.
 *
 * Splits on ## headings, extracts markdown links from each section,
 * and groups them by category. Sections without links get an empty
 * array in the categories map.
 *
 * @param markdown - Raw markdown content of the resource document
 * @returns ResourceCatalog with categorized and flattened links
 */
export function parseResources(markdown: string): ResourceCatalog {
  const catalog: ResourceCatalog = {
    categories: new Map(),
    allLinks: [],
  };

  if (!markdown.trim()) {
    return catalog;
  }

  // Split by ## headings
  const parts = markdown.split(/\n## /);

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    const newlineIdx = part.indexOf('\n');

    let heading: string;
    let content: string;

    if (newlineIdx === -1) {
      heading = part.trim();
      content = '';
    } else {
      heading = part.substring(0, newlineIdx).trim();
      content = part.substring(newlineIdx + 1);
    }

    // Extract links from this section
    const links: ResourceLink[] = [];
    let match: RegExpExecArray | null;

    // Reset regex state
    LINK_REGEX.lastIndex = 0;

    while ((match = LINK_REGEX.exec(content)) !== null) {
      const description = match[3].trim() || null;
      const link: ResourceLink = {
        title: match[1],
        url: match[2],
        description,
      };
      links.push(link);
      catalog.allLinks.push(link);
    }

    catalog.categories.set(heading, links);
  }

  return catalog;
}

// ============================================================================
// parseResourcesFile
// ============================================================================

/**
 * Read a resource catalog markdown file from disk and parse its contents.
 *
 * @param filePath - Absolute or relative path to the resources file
 * @returns ResourceCatalog with categorized and flattened links
 */
export async function parseResourcesFile(filePath: string): Promise<ResourceCatalog> {
  const content = await readFile(filePath, 'utf-8');
  return parseResources(content);
}
