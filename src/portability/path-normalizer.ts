/**
 * Path directory prefixes that should have their backslashes normalized.
 * These are the standard skill content directories per agentskills.io spec.
 */
const PATH_PREFIXES = ['references', 'scripts', 'assets'] as const;

/**
 * Regex matching path-like patterns starting with known directory prefixes.
 * Captures: references\file.md, scripts\build.sh, assets\sub\image.png
 * Also matches forward slashes (for mixed-slash paths like references\sub/file.md).
 *
 * The pattern stops at whitespace or closing paren (for markdown links).
 */
const PATH_PATTERN = new RegExp(
  `(${PATH_PREFIXES.join('|')})[\\\\\/][^\\s)]*`,
  'g',
);

/**
 * Normalize paths in skill content to use forward slashes.
 * Targets: references/, scripts/, assets/ path patterns.
 * Does NOT modify non-path backslashes (e.g., regex patterns).
 */
export function normalizePaths(content: string): string {
  return content.replace(PATH_PATTERN, (match) => {
    return match.replace(/\\/g, '/');
  });
}

/**
 * Normalize path-like values within metadata objects.
 * Returns metadata unchanged (placeholder for future use).
 */
export function normalizeMetadataPaths<T extends Record<string, unknown>>(metadata: T): T {
  return metadata;
}
