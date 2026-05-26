import { realpathSync } from 'node:fs';
import { resolve as pathResolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Returns true when the current module was invoked directly as a Node entrypoint.
 *
 * `process.argv[1]` keeps the symlink path when the script runs via a symlink
 * (npm global bin, npm link, pnpm store hardlinks, monorepo bin shims).
 * `fileURLToPath(import.meta.url)` always returns the realpath. A naive
 * equality check between the two fails for every symlinked invocation and
 * silently no-ops the script. Compare against `realpathSync(argv[1])` instead,
 * with a `pathResolve` fallback if realpath throws (e.g. argv[1] vanished
 * mid-spawn, or argv[1] is `-` for stdin scripts).
 *
 * Callers pass their own `import.meta.url`. `argv` defaults to `process.argv`
 * but can be injected for unit tests.
 */
export function isCliEntrypoint(
  importMetaUrl: string,
  argv: readonly string[] = process.argv,
): boolean {
  const invoked = argv[1];
  if (!invoked) return false;
  const here = fileURLToPath(importMetaUrl);
  try {
    return here === realpathSync(invoked);
  } catch {
    return here === pathResolve(invoked);
  }
}
