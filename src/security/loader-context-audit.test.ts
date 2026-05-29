/**
 * LoaderContext chokepoint audit.
 *
 * Greps every file matching `src/**\/*{loader,reader,scanner,walker,store}*.ts`
 * (extended at v1.49.885 from the original `*loader*.ts` glob — opens the
 * KNOWN_UNWIRED ratchet-ledger for the third Tier-E chokepoint surface) and
 * rejects any file that:
 *
 *   - imports `node:fs` or `node:fs/promises`, AND
 *   - does NOT call `ensureAllowed(` at least once, AND
 *   - does NOT carry an explicit `Role: NOT a disk loader` header doc, AND
 *   - is NOT in the `KNOWN_UNWIRED` allowlist (existing fs callers
 *     grandfathered at v1.49.885 — operators chip this list down ship-by-ship
 *     by wiring each module with `ctx?: LoaderContext`).
 *
 * Excludes `loader-context.ts` (the interface itself), test files, and
 * fixture loaders.
 *
 * This test is the runtime enforcement layer for the Tier-E security
 * chokepoint shipped in v1.49.782, extended to a broader name-pattern at
 * v1.49.885. Sibling chokepoints: ProcessContext (v1.49.806; KNOWN_UNWIRED
 * 0 since v875), EgressContext (v1.49.806; KNOWN_UNWIRED 0 since v881).
 *
 * Operators wiring a `KNOWN_UNWIRED` entry: thread `ctx?: LoaderContext`
 * through the call site, call `ensureAllowed(ctx, path, op)` BEFORE the fs
 * call, and remove the file from `KNOWN_UNWIRED` below. Pick wire shape
 * from the catalog at #10448 / #10444 / #10445 / #10447 based on spawn-site
 * count and file structure.
 *
 * @module security/loader-context-audit.test
 */

import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const ROOT = resolve(__dirname, '..', '..');
const SRC = resolve(__dirname, '..', '..', 'src');

/**
 * fs callers not yet wired through the LoaderContext chokepoint.
 * Grandfathered at v1.49.885. Chip this list down ship-by-ship.
 *
 * Initial allowlist captured at v885 via:
 *   find src -name "*.ts" \( -iname "*loader*" -o -iname "*reader*" \
 *     -o -iname "*scanner*" -o -iname "*walker*" -o -iname "*store*" \) \
 *     | filter to fs-importers not already calling ensureAllowed and \
 *     not marked "Role: NOT a disk loader"
 *
 * Wire-shape catalog (#10448 sub-variants): hoist-at-top, two-site-hoisted,
 * class-instance two-site, internal-helper-method, module-internal-helper,
 * + module-singleton (1-instance carry-forward per v883 #10448).
 *
 * Sort by ascending LOC (#10444) when picking the next chip — file size
 * correlates with N (spawn-site count, #10445) but is not a perfect proxy.
 */
const KNOWN_UNWIRED: ReadonlySet<string> = new Set([
  // Initial allowlist v1.49.885 — 15 entries.
  // v1.49.887: src/console/reader.ts chipped (hoist-at-top, N=1). 15 → 14.
  // v1.49.889: src/intelligence/atlas-indexer/file-walker.ts chipped (hoist-at-top, N=1 entry point). 14 → 13.
  // v1.49.890: src/eval/calibration-adjustment-store.ts chipped (read-side gated at load(); save() out-of-scope per LoaderContext read-side design). 13 → 12.
  // Sort: alphabetical-by-path (preserves git-blame discipline; LOC band
  // documented inline for chip-picking via #10445).
  'src/aminet/emulated-scanner.ts',                          // 287 LOC
  'src/atlas/spatial/pmtiles-reader.ts',                     // 262 LOC
  'src/cli/commands/keystore.ts',                            // 179 LOC (already ProcessContext-wired @ v861; LoaderContext-wire is a separate concern)
  'src/dacp/bus/scanner.ts',                                 // 174 LOC
  'src/discovery/scan-state-store.ts',                       // 176 LOC
  'src/events/skill-event-store.ts',                         // 222 LOC
  'src/intelligence/kb/store.ts',                            // 1399 LOC (largest; may warrant Role: marker review before wire)
  'src/memory/conversation-store.ts',                        // 531 LOC
  'src/memory/file-store.ts',                                // 516 LOC
  'src/orchestrator/lifecycle/artifact-scanner.ts',          // 176 LOC
  'src/orchestrator/state/state-reader.ts',                  // 190 LOC
  'src/skill-workflows/workflow-run-store.ts',               // 138 LOC
]);

/** Name patterns that bring a file into LoaderContext audit scope. */
const NAME_PATTERN_REGEX = /(?:loader|reader|scanner|walker|store)/;

/** Walk `src/` and return absolute paths matching the name pattern. */
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
      if (!NAME_PATTERN_REGEX.test(name)) continue;
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

  it('discovers a non-empty set of loader-pattern files (sanity check)', () => {
    expect(files.length).toBeGreaterThan(5);
  });

  it.each(files.map((f) => [relative(ROOT, f), f]))(
    'enforces chokepoint on %s',
    (label, absPath) => {
      const result = inspect(absPath);

      // Files without fs imports are out of scope — they don't touch disk.
      if (!result.importsFs) {
        return;
      }

      // Files in KNOWN_UNWIRED are grandfathered at v1.49.885 —
      // track-don't-fail. Chip this list down ship-by-ship.
      if (KNOWN_UNWIRED.has(label)) {
        return;
      }

      // Files with fs imports MUST either route through ensureAllowed or
      // declare themselves explicitly outside the chokepoint.
      const ok = result.callsEnsureAllowed || result.hasRoleBoundary;

      if (!ok) {
        throw new Error(
          `${result.path}: imports node:fs but does not call ensureAllowed() ` +
            `and has no "Role: NOT a disk loader" header doc, and is not in ` +
            `the KNOWN_UNWIRED allowlist in src/security/loader-context-audit.test.ts. ` +
            `Either thread LoaderContext through the loader, add a header doc ` +
            `explaining why this module is intentionally outside the chokepoint, ` +
            `or add the file to KNOWN_UNWIRED with a chip-down note.`,
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

  // v1.49.885 ratchet-ledger tests (mirror v1.49.806 process + egress shape):
  // KNOWN_UNWIRED entries must continue to exist + still import fs (Shape A
  // stale-entry detector A: file removed or import dropped invalidates the
  // entry; force operator to remove from allowlist).

  it('KNOWN_UNWIRED entries actually exist and import node:fs', () => {
    for (const path of KNOWN_UNWIRED) {
      const abs = resolve(ROOT, path);
      let exists = false;
      try {
        const st = statSync(abs);
        exists = st.isFile();
      } catch {
        exists = false;
      }
      if (!exists) {
        throw new Error(
          `KNOWN_UNWIRED entry ${path} does not exist. Remove it from the ` +
            `allowlist in src/security/loader-context-audit.test.ts.`,
        );
      }
      const content = readFileSync(abs, 'utf8');
      if (!FS_IMPORT_REGEX.test(content)) {
        throw new Error(
          `KNOWN_UNWIRED entry ${path} no longer imports node:fs. ` +
            `Remove it from the allowlist (the chokepoint surface is gone).`,
        );
      }
    }
  });

  // Stale-entry detector: files that have been wired (call ensureAllowed)
  // but still carry a stale KNOWN_UNWIRED entry. Mirrors the inverse-check
  // pattern from process-context-audit.test.ts + egress-context-audit.test.ts.
  // Closes Shape A asymmetry per #10443.

  it('KNOWN_UNWIRED entries do NOT call ensureAllowed (stale-entry detector)', () => {
    const stale: string[] = [];
    for (const path of KNOWN_UNWIRED) {
      const abs = resolve(ROOT, path);
      let content: string;
      try {
        content = readFileSync(abs, 'utf8');
      } catch {
        continue; // existence check above will catch this
      }
      if (ENSURE_ALLOWED_REGEX.test(content)) {
        stale.push(path);
      }
    }
    if (stale.length > 0) {
      throw new Error(
        `${stale.length} KNOWN_UNWIRED entr${stale.length === 1 ? 'y calls' : 'ies call'} ` +
          `ensureAllowed but remain${stale.length === 1 ? 's' : ''} in the allowlist. ` +
          `Remove the wired entr${stale.length === 1 ? 'y' : 'ies'}:\n  ${stale.join('\n  ')}`,
      );
    }
  });
});
