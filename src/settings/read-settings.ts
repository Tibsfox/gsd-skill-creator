// Shared settings-reader for gsd-skill-creator opt-in flags.
//
// The `.claude/settings.json` file is validated by the Claude Code harness
// against a strict JSON schema that rejects unknown top-level keys. To avoid
// collisions, gsd-skill-creator opt-in flags live in a dedicated sibling file
// `.claude/gsd-skill-creator.json` with the same SHAPE under the top-level
// `gsd-skill-creator` key.
//
// Readers MUST check the dedicated file first, then fall back to the harness
// settings.json for backward compatibility with older deployments that stored
// flags in the shared file. Both paths are tried; the first successful parse
// that yields a value for the requested key wins.
//
// Safety: every reader returns `false` (opt-out) on any IO or parse error.

import { readFileSync } from 'node:fs';

const DEFAULT_PROJECT_PATHS = [
  '.claude/gsd-skill-creator.json',
  '.claude/settings.json',
];

/**
 * Load the `gsd-skill-creator` scope from the first file that parses cleanly.
 * Returns `null` if no file yields a valid object at that key.
 */
export function loadGsdScope(
  candidatePaths: readonly string[] = DEFAULT_PROJECT_PATHS,
): Record<string, unknown> | null {
  for (const path of candidatePaths) {
    try {
      const raw = readFileSync(path, 'utf8');
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const scope = parsed['gsd-skill-creator'];
      if (scope && typeof scope === 'object') {
        return scope as Record<string, unknown>;
      }
    } catch {
      // File missing or malformed — try the next candidate.
    }
  }
  return null;
}

/**
 * Follow a dotted key path within the gsd-skill-creator scope and return the
 * final value. Example: `readNested(["sensoria", "lyapunov", "enabled"])`.
 *
 * Returns `undefined` when any intermediate is missing. Callers decide the
 * safe default (typically `false` for boolean flags).
 */
export function readNested(
  keyPath: readonly string[],
  candidatePaths?: readonly string[],
): unknown {
  const scope = loadGsdScope(candidatePaths);
  if (!scope) return undefined;
  let cursor: unknown = scope;
  for (const key of keyPath) {
    if (!cursor || typeof cursor !== 'object') return undefined;
    cursor = (cursor as Record<string, unknown>)[key];
  }
  return cursor;
}

/**
 * Read a boolean opt-in flag at a dotted path. Returns `false` on any error
 * or non-`true` value — matches the "opt-in-only, safe default off" policy.
 */
export function readBooleanFlag(
  keyPath: readonly string[],
  candidatePaths?: readonly string[],
): boolean {
  return readNested(keyPath, candidatePaths) === true;
}

/**
 * Read a numeric tuning value at a dotted path. Returns the provided
 * `defaultValue` on absence or type mismatch.
 */
export function readNumber(
  keyPath: readonly string[],
  defaultValue: number,
  candidatePaths?: readonly string[],
): number {
  const v = readNested(keyPath, candidatePaths);
  return typeof v === 'number' && Number.isFinite(v) ? v : defaultValue;
}
