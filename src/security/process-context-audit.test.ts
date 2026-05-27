/**
 * ProcessContext chokepoint audit.
 *
 * Greps every `src/**\/*.ts` file (excluding tests + fixtures) and rejects
 * any file that:
 *
 *   - imports from `node:child_process` or `child_process` (static import,
 *     lazy `require()`, or dynamic `await import()`), AND
 *   - does NOT call `ensureProcessAllowed(` at least once, AND
 *   - does NOT carry an explicit `Role: NOT a process caller` header doc, AND
 *   - is NOT in the `KNOWN_UNWIRED` allowlist (existing child-process callers
 *     grandfathered at v1.49.806 — operators chip this list down ship-by-ship
 *     by wiring each module with `ctx?: ProcessContext`).
 *
 * Excludes `process-context.ts` (the interface itself).
 *
 * This test is the runtime enforcement layer for the Tier-E security
 * chokepoint shipped in v1.49.806. Adding a new spawn/exec caller without
 * threading `ProcessContext` AND not in the allowlist will fail this test
 * at CI / pre-tag-gate.
 *
 * Operators wiring a `KNOWN_UNWIRED` entry: thread `ctx?: ProcessContext`
 * through the call site, call `ensureProcessAllowed(ctx, source, op,
 * command, argv)` BEFORE the spawn/exec, and remove the file from
 * `KNOWN_UNWIRED` below.
 *
 * @module security/process-context-audit.test
 */

import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const ROOT = resolve(__dirname, '..', '..');
const SRC = resolve(__dirname, '..', '..', 'src');

/**
 * Child-process callers not yet wired through the ProcessContext chokepoint.
 * Grandfathered at v1.49.806. Chip this list down ship-by-ship.
 */
const KNOWN_UNWIRED: ReadonlySet<string> = new Set([
  // aminet family wired at v1.49.819 batch chip (5 files: emulated-scanner,
  // emulator-launch, lha-extractor, lzx-extractor, tool-validator).
  'src/chipset/blitter/executor.ts',
  'src/chipset/harness-integrity.ts',
  'src/cli/commands/keystore.ts',
  'src/cli/commands/pic2html.ts',
  'src/cli/commands/terminal.ts',
  'src/dashboard/collectors/git-collector.ts',
  // dogfood family fully wired at v1.49.827 batch chip (extractor + pydmd
  // install/health-check + install/venv-manager) — all 3 use internal-helper
  // or hoisted-check pattern per #10433; wire cost ~14-26 LOC each.
  'src/drift/cli.ts',
  // git/core family fully wired:
  //   v1.49.820 first-chip (branch-manager);
  //   v1.49.825 batch chip (repo-manager + state-machine + sync-manager) —
  //   all 3 use internal-helper pattern (#10433); wire cost ~14-18 LOC each.
  'src/git/gates/pre-flight.ts',
  'src/git/workflows/contribute.ts',
  'src/intelligence/analyzer/findings/stalled.ts',
  // src/intelligence/analyzer/git.ts removed v1.49.834 stale-entry cleanup —
  // file already called ensureProcessAllowed (hoisted outside catch per
  // #10427) since v1.49.806; grandfathered allowlist entry was silently
  // double-protected (audit short-circuits on KNOWN_UNWIRED.has before
  // checking the actual wire). First stale-entry chip; closes asymmetry
  // noted in v1.49.806 forward-observation that audit is unidirectional.
  'src/intelligence/provenance/linker.ts',
  'src/learn/acquirer.ts',
  'src/learning/version-manager.ts',
  'src/mesh/mesh-worktree.ts',
  'src/mesh/proxy-committer.ts',
  'src/orchestrator/extension/extension-detector.ts',
  'src/retro/changelog-watch.ts',
  'src/scan-arxiv/bridge.ts',
  'src/scan-arxiv/ranker.ts',
  // scribe/netlist-renderer family fully wired at v1.49.828 batch chip
  // (available + netlistsvg-driver + yosys-driver) — all 3 use the
  // internal-helper pattern (#10433) with hoisted check (#10427) for
  // spawn-based subprocess invocation; wire cost ~14-16 LOC each.
  'src/skill/version-backfill.ts',
  'src/terminal/launcher.ts',
  'src/terminal/session.ts',
]);

/** Walk `src/` and return absolute paths matching `*.ts`. */
function findTsFiles(): string[] {
  const out: string[] = [];
  const stack = [SRC];
  while (stack.length > 0) {
    const dir = stack.pop()!;
    const entries = readdirSync(dir);
    for (const name of entries) {
      const full = join(dir, name);
      const st = statSync(full);
      if (st.isDirectory()) {
        if (name === '__tests__' || name === '__fixtures__' || name === 'node_modules') {
          continue;
        }
        stack.push(full);
        continue;
      }
      if (!st.isFile()) continue;
      if (!name.endsWith('.ts')) continue;
      if (name.endsWith('.test.ts') || name.endsWith('.test.tsx')) continue;
      if (name.endsWith('.d.ts')) continue;
      // Skip the chokepoint definition itself.
      if (full === join(SRC, 'security', 'process-context.ts')) continue;
      out.push(full);
    }
  }
  return out.sort();
}

/** Inspection results for one file. */
interface Inspection {
  path: string;
  importsChildProcess: boolean;
  callsEnsureProcessAllowed: boolean;
  hasRoleBoundary: boolean;
}

// Matches static import, lazy require(), or dynamic await import().
const CHILD_PROCESS_IMPORT_REGEX =
  /(?:from\s+['"](?:node:)?child_process['"]|require\(\s*['"](?:node:)?child_process['"]\s*\)|import\(\s*['"](?:node:)?child_process['"]\s*\))/;
const ENSURE_PROCESS_ALLOWED_REGEX = /\bensureProcessAllowed\s*\(/;
const ROLE_BOUNDARY_REGEX = /Role:\s*NOT\s+a\s+process\s+caller/i;

function inspect(absPath: string): Inspection {
  const content = readFileSync(absPath, 'utf8');
  return {
    path: relative(ROOT, absPath),
    importsChildProcess: CHILD_PROCESS_IMPORT_REGEX.test(content),
    callsEnsureProcessAllowed: ENSURE_PROCESS_ALLOWED_REGEX.test(content),
    hasRoleBoundary: ROLE_BOUNDARY_REGEX.test(content),
  };
}

describe('ProcessContext chokepoint audit', () => {
  const files = findTsFiles();

  it('discovers a non-empty set of src files (sanity check)', () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it.each(files.map((f) => [relative(ROOT, f), f]))(
    'enforces chokepoint on %s',
    (label, absPath) => {
      const result = inspect(absPath);

      // Files without child_process imports are out of scope.
      if (!result.importsChildProcess) {
        return;
      }

      // Files in KNOWN_UNWIRED are grandfathered at v1.49.806 — track-don't-fail.
      if (KNOWN_UNWIRED.has(label)) {
        return;
      }

      // Files importing child_process MUST either route through
      // ensureProcessAllowed or declare themselves explicitly outside.
      const ok = result.callsEnsureProcessAllowed || result.hasRoleBoundary;

      if (!ok) {
        throw new Error(
          `${result.path}: imports child_process but does not call ensureProcessAllowed() ` +
            `and has no "Role: NOT a process caller" header doc, and is not in ` +
            `the KNOWN_UNWIRED allowlist in src/security/process-context-audit.test.ts. ` +
            `Either thread ProcessContext through the caller, add a header doc ` +
            `explaining the exemption, or add the file to KNOWN_UNWIRED with a ` +
            `comment explaining why.`,
        );
      }
    },
  );

  it('rejects files that simultaneously claim to be a caller and a non-caller', () => {
    for (const f of files) {
      const r = inspect(f);
      if (r.callsEnsureProcessAllowed && r.hasRoleBoundary) {
        throw new Error(
          `${r.path}: contradicts itself — calls ensureProcessAllowed() but also ` +
            `claims "Role: NOT a process caller". Remove one of the two.`,
        );
      }
    }
  });

  it('KNOWN_UNWIRED entries actually exist and import child_process', () => {
    for (const path of KNOWN_UNWIRED) {
      const abs = join(ROOT, path);
      const exists = (() => {
        try {
          return statSync(abs).isFile();
        } catch {
          return false;
        }
      })();
      if (!exists) {
        throw new Error(
          `KNOWN_UNWIRED entry ${path} does not exist. Remove it from the ` +
            `allowlist (the file was renamed, moved, or deleted).`,
        );
      }
      const content = readFileSync(abs, 'utf8');
      if (!CHILD_PROCESS_IMPORT_REGEX.test(content)) {
        throw new Error(
          `KNOWN_UNWIRED entry ${path} no longer imports child_process. ` +
            `Remove it from the allowlist.`,
        );
      }
    }
  });

  // v1.49.838 — inverse-check (stale-entry detector). Closes the
  // unidirectional asymmetry that v834 surfaced manually: a file can be
  // wired (calls ensureProcessAllowed) but still carry a stale KNOWN_UNWIRED
  // entry indefinitely without test failure. v812 missed the allowlist edit
  // when wiring intelligence/analyzer/git.ts; the off-by-one propagated
  // through 22 subsequent ships before v834 caught it manually.
  //
  // This inverse-check fires on the NEXT ship after a stale entry is
  // introduced, replacing the per-ship recon discipline with a deterministic
  // gate.
  it('KNOWN_UNWIRED entries do NOT call ensureProcessAllowed (stale-entry detector)', () => {
    const stale: string[] = [];
    for (const path of KNOWN_UNWIRED) {
      const abs = join(ROOT, path);
      const content = readFileSync(abs, 'utf8');
      if (ENSURE_PROCESS_ALLOWED_REGEX.test(content)) {
        stale.push(path);
      }
    }
    if (stale.length > 0) {
      throw new Error(
        `${stale.length} KNOWN_UNWIRED entr${stale.length === 1 ? 'y calls' : 'ies call'} ` +
          `ensureProcessAllowed() — the file${stale.length === 1 ? '' : 's'} ${stale.length === 1 ? 'is' : 'are'} ` +
          `wired but the allowlist ${stale.length === 1 ? 'entry is' : 'entries are'} stale. Remove from ` +
          `KNOWN_UNWIRED:\n  ${stale.join('\n  ')}`,
      );
    }
  });
});
