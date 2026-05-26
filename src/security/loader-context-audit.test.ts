/**
 * LoaderContext chokepoint audit.
 *
 * Greps every file matching `src/**\/*loader*.ts` (which also catches
 * `*downloader*` via the glob's substring match) and rejects any file
 * that:
 *
 *   - imports `node:fs` or `node:fs/promises`, AND
 *   - does NOT call `ensureAllowed(` at least once, AND
 *   - does NOT carry an explicit `Role: NOT a disk loader` header doc.
 *
 * Excludes `loader-context.ts` (the interface itself), test files, and
 * fixture loaders.
 *
 * This test is the runtime enforcement layer for the Tier-E security
 * chokepoint shipped in v1.49.782. Adding a new disk-loader without
 * threading `LoaderContext` will fail this test at CI / pre-tag-gate.
 *
 * @module security/loader-context-audit.test
 */

import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const ROOT = resolve(__dirname, '..', '..');
const SRC = resolve(__dirname, '..', '..', 'src');

/** Walk `src/` and return absolute paths matching `*loader*.ts`. */
function findLoaderFiles(): string[] {
  const out: string[] = [];
  const stack = [SRC];
  while (stack.length > 0) {
    const dir = stack.pop()!;
    const entries = readdirSync(dir);
    for (const name of entries) {
      const full = join(dir, name);
      const st = statSync(full);
      if (st.isDirectory()) {
        // Skip test directories and fixture directories
        if (name === '__tests__' || name === '__fixtures__' || name === 'node_modules') {
          continue;
        }
        stack.push(full);
        continue;
      }
      if (!st.isFile()) continue;
      if (!name.includes('loader')) continue;
      if (name.endsWith('.test.ts') || name.endsWith('.test.tsx')) continue;
      // Skip the chokepoint definition itself.
      if (full === join(SRC, 'security', 'loader-context.ts')) continue;
      out.push(full);
    }
  }
  return out.sort();
}

/** Inspection results for one file. */
interface Inspection {
  path: string;
  importsFs: boolean;
  callsEnsureAllowed: boolean;
  hasRoleBoundary: boolean;
}

const FS_IMPORT_REGEX = /from\s+['"]node:fs(?:\/promises)?['"]/;
const ENSURE_ALLOWED_REGEX = /\bensureAllowed\s*\(/;
const ROLE_BOUNDARY_REGEX = /Role:\s*NOT\s+a\s+disk\s+loader/i;

function inspect(absPath: string): Inspection {
  const content = readFileSync(absPath, 'utf8');
  return {
    path: relative(ROOT, absPath),
    importsFs: FS_IMPORT_REGEX.test(content),
    callsEnsureAllowed: ENSURE_ALLOWED_REGEX.test(content),
    hasRoleBoundary: ROLE_BOUNDARY_REGEX.test(content),
  };
}

describe('LoaderContext chokepoint audit', () => {
  const files = findLoaderFiles();

  it('discovers a non-empty set of loader files (sanity check)', () => {
    expect(files.length).toBeGreaterThan(5);
  });

  it.each(files.map((f) => [relative(ROOT, f), f]))(
    'enforces chokepoint on %s',
    (_label, absPath) => {
      const result = inspect(absPath);

      // Files without fs imports are out of scope — they don't touch disk.
      if (!result.importsFs) {
        return;
      }

      // Files with fs imports MUST either route through ensureAllowed or
      // declare themselves explicitly outside the chokepoint.
      const ok = result.callsEnsureAllowed || result.hasRoleBoundary;

      if (!ok) {
        throw new Error(
          `${result.path}: imports node:fs but does not call ensureAllowed() ` +
            `and has no "Role: NOT a disk loader" header doc. ` +
            `Either thread LoaderContext through the loader, or add a ` +
            `header doc explaining why this module is intentionally outside ` +
            `the chokepoint.`,
        );
      }
    },
  );

  it('rejects files that simultaneously claim to be a loader and a non-loader', () => {
    for (const f of files) {
      const r = inspect(f);
      if (r.callsEnsureAllowed && r.hasRoleBoundary) {
        throw new Error(
          `${r.path}: contradicts itself — calls ensureAllowed() but also ` +
            `claims "Role: NOT a disk loader". Remove one of the two.`,
        );
      }
    }
  });
});
