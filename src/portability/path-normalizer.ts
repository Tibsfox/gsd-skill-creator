/**
 * Normalize paths in skill content to use forward slashes.
 * Targets: references/, scripts/, assets/ path patterns.
 * Does NOT modify non-path backslashes (e.g., regex patterns).
 */
export function normalizePaths(_content: string): string {
  throw new Error('Not implemented');
}

/**
 * Normalize path-like values within metadata objects.
 * Currently a no-op placeholder for future use.
 */
export function normalizeMetadataPaths<T extends Record<string, unknown>>(metadata: T): T {
  throw new Error('Not implemented');
}
