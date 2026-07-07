import { resolve, sep } from 'path';

// ============================================================================
// Path Safety Utilities
// ============================================================================
// Defense-in-depth layer for preventing path traversal attacks.
// Used by all storage layers (SkillStore, AgentGenerator, TeamStore).

/**
 * Custom error for path traversal violations.
 */
export class PathTraversalError extends Error {
  override name = 'PathTraversalError' as const;

  constructor(message: string) {
    super(message);
  }
}

/**
 * Result of safe name validation.
 */
export interface SafeNameResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate that a name is safe for use as a filesystem path component.
 *
 * This is a DEFENSE-IN-DEPTH layer on top of existing regex name validation.
 * It catches path traversal sequences, path separators, null bytes, and
 * filesystem special entries with explicit error messages.
 *
 * @param name - The name to validate
 * @returns Validation result with optional error message
 */
export function validateSafeName(name: string): SafeNameResult {
  // Empty check
  if (name === '') {
    return { valid: false, error: 'Name is empty' };
  }

  // Null byte check (no regex can catch this reliably)
  if (name.includes('\0')) {
    return { valid: false, error: 'Name contains null byte' };
  }

  // Path traversal: check for ".." anywhere in the name
  // Covers: "..", "../", "..\", "foo/../bar", standalone ".."
  if (name === '..' || name.includes('../') || name.includes('..\\') || name.startsWith('..')) {
    return { valid: false, error: 'Name contains path traversal sequence: ..' };
  }

  // Path separators
  if (name.includes('/')) {
    return { valid: false, error: 'Name contains path separator: /' };
  }

  if (name.includes('\\')) {
    return { valid: false, error: 'Name contains path separator: \\' };
  }

  // Filesystem special entry: single dot (current directory)
  if (name === '.') {
    return { valid: false, error: 'Name is a filesystem special entry' };
  }

  return { valid: true };
}

/**
 * Verify that a resolved absolute path stays within the expected base directory.
 *
 * Both paths are resolved to absolute before comparison. Uses trailing
 * separator check to prevent partial prefix matches (e.g., "/foo/bar"
 * should not match "/foo/barbaz").
 *
 * @param resolvedPath - The path to check
 * @param baseDir - The expected base directory
 * @throws PathTraversalError if path escapes the base directory
 */
export function assertSafePath(resolvedPath: string, baseDir: string): void {
  const absPath = resolve(resolvedPath);
  const absBase = resolve(baseDir);

  // Exact match is allowed (the base directory itself)
  if (absPath === absBase) {
    return;
  }

  // Path must start with base + separator to prevent prefix collision
  const basePrefixWithSep = absBase + sep;
  if (!absPath.startsWith(basePrefixWithSep)) {
    throw new PathTraversalError(
      `Path escapes base directory: "${absPath}" is not within "${absBase}"`,
    );
  }
}

/**
 * Verify that a resolved absolute path stays within ANY of a set of allowed
 * roots. This is the multi-root form of {@link assertSafePath}: a path is safe
 * if it is contained by (or equal to) at least one root. Use it when legitimate
 * references may cross into sibling trees under a shared ancestor (e.g. a
 * cartridge that references chipsets in a sibling directory of the project),
 * while still blocking absolute paths and traversal outside every allowed root.
 *
 * @param resolvedPath - The path to check
 * @param roots - The allowed root directories (at least one must contain it)
 * @throws PathTraversalError if the path escapes every allowed root
 */
export function assertWithinRoots(resolvedPath: string, roots: string[]): void {
  const absPath = resolve(resolvedPath);
  for (const root of roots) {
    const absRoot = resolve(root);
    if (absPath === absRoot || absPath.startsWith(absRoot + sep)) {
      return;
    }
  }
  throw new PathTraversalError(
    `Path escapes allowed roots: "${absPath}" is not within any of [${roots
      .map((r) => resolve(r))
      .join(', ')}]`,
  );
}
