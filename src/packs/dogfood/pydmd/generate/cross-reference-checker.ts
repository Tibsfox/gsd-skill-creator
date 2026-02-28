/**
 * Cross-reference checker for generated skill output.
 * Validates that all internal markdown links resolve to known output files.
 */

import type { ReferenceSet } from './reference-builder.js';
import type { ScriptSet } from './script-generator.js';

/** Result of cross-reference validation. */
export interface CrossRefResult {
  /** Links that do not resolve to any known output file. */
  brokenLinks: string[];
  /** Links that resolve correctly. */
  validLinks: string[];
  /** Non-fatal issues (e.g., suspicious but not broken links). */
  warnings: string[];
}

/** Map of known output file paths to their content existence. */
const KNOWN_PATHS: Record<string, (refs: ReferenceSet, scripts: ScriptSet) => boolean> = {
  'references/algorithm-variants.md': (refs) => refs.algorithmVariants.length > 0,
  'references/mathematical-foundations.md': (refs) => refs.mathematicalFoundations.length > 0,
  'references/api-reference.md': (refs) => refs.apiReference.length > 0,
  'references/complex-plane-connections.md': (refs) => refs.complexPlaneConnections.length > 0,
  'scripts/quick-dmd.py': (_refs, scripts) => scripts.quickDmd.length > 0,
  'scripts/compare-variants.py': (_refs, scripts) => scripts.compareVariants.length > 0,
  'scripts/visualize-modes.py': (_refs, scripts) => scripts.visualizeModes.length > 0,
};

/** Regex to extract markdown links: [text](path) */
const LINK_REGEX = /\[([^\]]*)\]\(([^)]+)\)/g;

/**
 * Check all internal cross-references in the generated skill output.
 * Validates that every markdown link [text](path) points to a known output file.
 *
 * @param skillMd - The generated SKILL.md content
 * @param references - The generated reference documents
 * @param scripts - The generated Python scripts
 * @returns Validation result with broken links, valid links, and warnings
 */
export function checkCrossReferences(
  skillMd: string,
  references: ReferenceSet,
  scripts: ScriptSet,
): CrossRefResult {
  const brokenLinks: string[] = [];
  const validLinks: string[] = [];
  const warnings: string[] = [];

  // Collect all documents to scan
  const documents: { name: string; content: string }[] = [
    { name: 'SKILL.md', content: skillMd },
    { name: 'references/algorithm-variants.md', content: references.algorithmVariants },
    { name: 'references/mathematical-foundations.md', content: references.mathematicalFoundations },
    { name: 'references/api-reference.md', content: references.apiReference },
    { name: 'references/complex-plane-connections.md', content: references.complexPlaneConnections },
  ];

  for (const doc of documents) {
    const links = extractLinks(doc.content);

    for (const link of links) {
      // Skip external links (http/https) and anchors
      if (link.path.startsWith('http://') || link.path.startsWith('https://')) {
        continue;
      }
      if (link.path.startsWith('#')) {
        continue;
      }
      // Skip back-to-SKILL.md links from reference docs (relative parent traversal)
      if (link.path === '../SKILL.md') {
        validLinks.push(`${doc.name} -> ${link.path}`);
        continue;
      }

      // Resolve relative paths from the document's perspective
      const resolvedPath = resolvePath(doc.name, link.path);

      if (isKnownPath(resolvedPath, references, scripts)) {
        validLinks.push(`${doc.name} -> ${resolvedPath}`);
      } else {
        brokenLinks.push(resolvedPath);
      }
    }
  }

  return { brokenLinks, validLinks, warnings };
}

/** Extract all markdown links from content. */
function extractLinks(content: string): { text: string; path: string }[] {
  const links: { text: string; path: string }[] = [];
  let match: RegExpExecArray | null;

  // Reset regex state
  const regex = new RegExp(LINK_REGEX.source, LINK_REGEX.flags);

  while ((match = regex.exec(content)) !== null) {
    links.push({ text: match[1], path: match[2] });
  }

  return links;
}

/** Resolve a relative path from a source document. */
function resolvePath(sourceDoc: string, linkPath: string): string {
  // If the link is already a known root-relative path, return as-is
  if (KNOWN_PATHS[linkPath] !== undefined) {
    return linkPath;
  }

  // For documents in subdirectories (e.g., references/foo.md linking to ../scripts/bar.py),
  // resolve relative to the source document's directory
  const sourceDir = sourceDoc.includes('/') ? sourceDoc.substring(0, sourceDoc.lastIndexOf('/')) : '';

  if (linkPath.startsWith('../')) {
    // Parent traversal from a subdirectory
    const stripped = linkPath.replace(/^\.\.\//, '');
    // If source is in a subdirectory, parent goes to root
    if (sourceDir) {
      return stripped;
    }
    return linkPath;
  }

  // Relative link from root document (SKILL.md)
  return linkPath;
}

/** Check if a resolved path matches a known output file. */
function isKnownPath(path: string, references: ReferenceSet, scripts: ScriptSet): boolean {
  const checker = KNOWN_PATHS[path];
  if (checker) {
    return checker(references, scripts);
  }
  return false;
}
