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
  // v1.49.892: src/dacp/bus/scanner.ts chipped (two-site hoisted-check, #10448 sub-variant; both scanForBundles + scanPriorityDirWithBundles gate independently). 12 → 11.
  // v1.49.896: src/skill-workflows/workflow-run-store.ts chipped (hoist-at-top, N=1 readAll() site; class-stored ctx mirrors v890 calibration-adjustment-store pattern; append() out-of-scope per LoaderContext read-side design). 11 → 10.
  // v1.49.897: src/discovery/scan-state-store.ts chipped (hoist-at-top, N=1 load() site; class-stored ctx — THIRD instance of class-stored hoist-at-top sub-variant alongside v890+v896 → PROMOTES sub-variant; addExclude/removeExclude derived methods each emit 1 audit via transitive load(); save() out-of-scope per LoaderContext read-side design). 10 → 9.
  // v1.49.900: src/orchestrator/lifecycle/artifact-scanner.ts chipped (hoist-at-top, N=1 readdir site; module-function form per #10448 base sub-variant; ctx?: LoaderContext as optional 3rd param — non-breaking to lifecycle-coordinator.ts:91 production caller). 9 → 8.
  // v1.49.902: src/orchestrator/state/state-reader.ts chipped (class-multi-method consolidated public-entry gate; N=3 internal fs-op surfaces — access + 4× readFileSafe + readdir — all scoped under this.planningDir; one gate at public read() covers all internals via transitive call. NEW 1-instance sub-variant candidate for #10448; sibling of #10455 class-stored hoist-at-top for the N=1 case. 5 production callers in session.ts + orchestrator.ts use single-arg constructor — non-breaking via optional 2nd ctx param. Audit emission: 1 record per public read() call — 4th #10456 variant). 8 → 7.
  // v1.49.903: src/cli/commands/keystore.ts chipped (NEW sync-existsSync wire shape; N=2 distinct existsSync sites in resolveKeystoreBin — KEYSTORE_BIN env override + candidate-loop. Sync two-site hoisted-check sub-variant of #10448; sibling of v892 dacp/bus/scanner.ts async two-site hoisted-check. loaderCtx threads independently from ProcessContext (already wired @ v861) — sibling chokepoints stay separate per #10449. Audit emission: 1 record per existsSync call). 7 → 6.
  // v1.49.904: src/events/skill-event-store.ts chipped (class-instance multi-site read-side wire; extension of #10455 class-stored hoist-at-top to N=3 read methods. 3 read methods gate independently — readAll, consume (top, above writeQueue), markExpired (top, above writeQueue). getPending calls readAll transitively. emit is write-side and out-of-scope per #10457. Audit emission: 1 per read-side call; 4 audits under {readAll + getPending + consume + markExpired} sequence = 5th #10456 variant). 6 → 5.
  // v1.49.905: src/atlas/spatial/pmtiles-reader.ts chipped (module-function two-site hoisted-check with MIXED sync+async ops; NEW sub-variant of #10448. validatePMTilesMagic gates sync readFileSync at top; fetchTileViaPMTiles gates async open (via cached NodeFileSource) at top + transitively triggers validatePMTilesMagic's gate. fetchTileForCoord passes ctx through. NodeFileSource itself unchanged — gate at the orchestrator covers its first-call open(). Audit emission: 1 per validatePMTilesMagic call; 2 per fetchTileViaPMTiles call (own + transitive validate)). 5 → 4.
  // v1.49.906: src/aminet/emulated-scanner.ts chipped (module-function multi-site mixed-chokepoint wire; 3 sync sites across 2 module functions + sibling-chokepoint coexistence with ProcessContext v861. loadKnownGoodHashes gates 2 sites on same path (existsSync + readFileSync, preserves audit-count signal: 1 audit = missing, 2 audits = read). runEmulatedScan gates 1 site (fsUaePath existsSync) alongside its existing ProcessContext for execFile — sibling chokepoints stay separate per #10449. 7th #10456 audit-variant: variable-count by file existence). 4 → 3.
  // v1.49.907: src/memory/file-store.ts chipped (class-multi-method consolidated-gate; SECOND instance of v902 sub-variant — PROMOTES toward 3-instance. N=5 public read methods (list, count, has, get, query) each gate on this.memoryDir scope; transitive private fs ops (listMdFiles, readRecord, findFileById) inherit the gate. Write-side methods (store, remove, ensureDir) out-of-scope per #10457. 8th #10456 variant: 4 audits under {list + count + has + query} = exact N read-side count). 3 → 2.
  // v1.49.908: src/memory/conversation-store.ts chipped (class-multi-method consolidated-gate; THIRD INSTANCE of v902 sub-variant — PROMOTES sub-variant to ESTABLISHED at 3-instance per #10448 catalog discipline. 3 pure read methods (search, listSessions, getStats) gate on this.storePath scope; mixed-mode ingestSessionLog gates on its logPath param BEFORE the readFile (read-then-write per #10457; subsequent ingestTurn loop is write-side out-of-scope). Write-only methods (ingestTurn, endSession) out-of-scope. 9th #10456 variant: 3 audits under {search + listSessions + getStats}). 2 → 1.
  // Sort: alphabetical-by-path (preserves git-blame discipline; LOC band
  // documented inline for chip-picking via #10445).
  'src/intelligence/kb/store.ts',                            // 1399 LOC (largest; may warrant Role: marker review before wire)
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
