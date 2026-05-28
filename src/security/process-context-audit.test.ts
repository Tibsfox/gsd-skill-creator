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
  // src/chipset/blitter/executor.ts wired v1.49.859 — singleton chip.
  // Optional ctx?: ProcessContext threaded through executeOffloadOp +
  // OffloadExecutor.execute; ensureProcessAllowed hoisted OUTSIDE the
  // Promise constructor with synchronous temp-dir cleanup on denial per
  // #10427. Interpreter (bash/node/python3) + [scriptPath] argv exposed
  // to the audit; spawned process inherits the security context contract.
  'src/chipset/harness-integrity.ts',
  // src/cli/commands/keystore.ts wired v1.49.861 — singleton chip.
  // Optional ctx?: ProcessContext threaded through keystoreCommand +
  // shellOut; ensureProcessAllowed hoisted OUTSIDE the Promise constructor
  // in shellOut. The child.on('error') handler catches ENOENT but NOT
  // security denials — those are load-bearing per #10427 and propagate
  // synchronously through the async-function throw machinery.
  // src/cli/commands/pic2html.ts wired v1.49.872 — Track 4 chip #3
  // (third-smallest LOC of remaining 4 KNOWN_UNWIRED Process entries:
  // 311 LOC pre-wire). ctx?: ProcessContext threaded through pic2html()
  // as 3rd param + loadImage() as 2nd param; hoist-at-top wire shape
  // (#10444 catalog — N=1 spawn site, single ensureProcessAllowed). The
  // shell-exec wraps python3 -c <script>; target='sh' argv=['-c',
  // 'python3 -c "..."']. Refactored python script into a local const
  // (pythonScript) so the hoist + the spawn reference the same string
  // for audit fidelity. ProcessContextDenied propagates through the
  // try/finally (finally only handles tmpfile cleanup; security errors
  // never reach finally because hoist fires before try).
  // src/cli/commands/terminal.ts wired v1.49.842 — terminal family batch chip
  // (3 files; wired together with terminal/launcher.ts + terminal/session.ts).
  // ctx?: ProcessContext threaded through handleStart; ensureProcessAllowed
  // called before spawn; ProcessContextDenied re-thrown from the swallow-
  // everything CLI catch per #10427.
  // src/dashboard/collectors/git-collector.ts wired v1.49.853 — singleton chip.
  // Optional ctx?: ProcessContext threaded through collectGitMetrics as a
  // second positional parameter (after options); ensureProcessAllowed hoisted
  // OUTSIDE the fault-tolerant try/catch per #10427. Forensic accessory
  // semantics preserved (not-a-repo / git-unavailable continues to return
  // empty result silently); ProcessContextDenied propagates.
  // dogfood family fully wired at v1.49.827 batch chip (extractor + pydmd
  // install/health-check + install/venv-manager) — all 3 use internal-helper
  // or hoisted-check pattern per #10433; wire cost ~14-26 LOC each.
  // src/drift/cli.ts wired v1.49.858 — singleton chip.
  // Optional ctx?: ProcessContext threaded through driftCommand as a
  // second positional parameter (after args); ensureProcessAllowed hoisted
  // OUTSIDE the spawnSync call. No swallowing try/catch around the spawn —
  // ProcessContextDenied propagates naturally to the CLI dispatcher.
  // git/core family fully wired:
  //   v1.49.820 first-chip (branch-manager);
  //   v1.49.825 batch chip (repo-manager + state-machine + sync-manager) —
  //   all 3 use internal-helper pattern (#10433); wire cost ~14-18 LOC each.
  // src/git/gates/pre-flight.ts wired v1.49.873 — Track 4 chip #4
  // (363 LOC pre-wire). ctx?: ProcessContext threaded as 2nd param
  // through preFlightMerge + preFlightPR; module-internal-helper pattern
  // (variant of #10433) — exec() helper at module scope takes ctx? as
  // 3rd param, propagated to isClean + buildDiffSummary + the two
  // exported preflight functions. exec(command, cwd, ctx) → op='exec-
  // sync' target='sh' argv=['-c', command]. ProcessContextDenied
  // re-thrown from 11 swallow-everything catches across preFlightMerge
  // (~7) + preFlightPR (~4) per #10427. Tests verify denial + audit
  // threading.
  // src/git/workflows/contribute.ts wired v1.49.871 — Track 4 chip #2
  // (second-smallest LOC of remaining 5 KNOWN_UNWIRED Process entries:
  // 183 LOC pre-wire). ctx?: ProcessContext threaded through contribute()
  // as 4th param; closure-capture pattern (#10444 wire-shape catalog) —
  // module-level exec() helper refactored into a closure inside
  // contribute() that captures ctx. Single ensureProcessAllowed at the
  // closure's top protects ~12 spawn sites (git fetch/rebase/checkout/
  // merge/push, gh pr create, which gh, rebase --abort). exec semantics:
  // op='exec-sync' target='sh' argv=['-c', command]. ProcessContextDenied
  // re-thrown from 4 swallow-everything catches (sync recovery + merge
  // wrap + push wrap + gh-availability wrap) per #10427.
  // src/intelligence/analyzer/findings/stalled.ts wired v1.49.839 —
  // optional ctx?: ProcessContext threaded through hasRecentGitActivity +
  // detectStalledMissions; ensureProcessAllowed hoisted outside the
  // best-effort-silent try/catch per #10427. Forensic surface semantics
  // preserved; load-bearing security denials propagate to the caller.
  // src/intelligence/analyzer/git.ts removed v1.49.834 stale-entry cleanup —
  // file already called ensureProcessAllowed (hoisted outside catch per
  // #10427) since v1.49.806; grandfathered allowlist entry was silently
  // double-protected (audit short-circuits on KNOWN_UNWIRED.has before
  // checking the actual wire). First stale-entry chip; closes asymmetry
  // noted in v1.49.806 forward-observation that audit is unidirectional.
  // src/intelligence/provenance/linker.ts wired v1.49.860 — singleton chip.
  // Internal-helper pattern per #10433: ctx? threaded through git() helper
  // (4 call sites) + resolveMissionCommits + ProvenanceLinker.run.
  // ensureProcessAllowed called at the top of the git() helper before
  // spawnSync; ProcessContextDenied propagates naturally (no swallowing
  // catch around the spawn). The helper-internal hoist is preferred over
  // per-call-site hoist when N>1 call sites share the helper (DRY).
  // src/learn/acquirer.ts wired v1.49.874 — Track 4 chip #5 (509 LOC
  // pre-wire). New safeExecFile() module-internal helper (#10433) wraps
  // ensureProcessAllowed + execFileSync. ctx?: ProcessContext threaded
  // through acquireSource (3rd param) + 6 internal helpers
  // (acquireLocalFile + acquireArchive + acquireGitHub + acquireUrl +
  // extractPdfText + extractDocxText + extractEpubText). 9 spawn sites
  // refactored from execFileSync to safeExecFile. Each spawn records
  // op='exec-file' + target=<actual binary: unzip/tar/git/curl/
  // pdftotext> + actual argv — better security visibility than the
  // shell-exec target='sh' pattern from v870-v873. ProcessContextDenied
  // re-thrown from 3 result-wrapping catches (pdftotext fallback, docx
  // extraction, epub extraction) per #10427.
  // src/learning/version-manager.ts wired v1.49.870 — Track 4 chip #1
  // (smallest LOC of remaining 6 KNOWN_UNWIRED Process entries: 177 LOC).
  // ctx?: ProcessContext threaded through constructor (third param after
  // skillsDir + workDir); internal-helper pattern (#10433) — single
  // ensureProcessAllowed at the top of the private git() helper before
  // execAsync. The full command string passes as argv[1] to /bin/sh -c;
  // the audit records op='exec' + target='sh' + argv=['-c', command].
  // ProcessContextDenied re-thrown from getHistory/getVersionContent/
  // rollback/compareVersions/getCurrentHash swallow-everything catches
  // per #10427 (security denials are load-bearing). 14/14 tests pass
  // including 3 new ProcessContext wire test cases.
  // src/mesh/mesh-worktree.ts wired v1.49.843 — mesh family batch chip
  // (2 files; wired together with proxy-committer.ts).
  // Optional ctx?: ProcessContext threaded through createMeshWorktreeManager;
  // default GitExecutor wraps execSync with ensureProcessAllowed per #10433.
  // src/mesh/proxy-committer.ts wired v1.49.843 — mesh family batch chip.
  // Same shape — ctx? threaded through createProxyCommitter; passes ctx to
  // createMeshWorktreeManager so both executors share one security context.
  // src/orchestrator/extension/extension-detector.ts wired v1.49.850 —
  // singleton chip. Optional ctx?: ProcessContext threaded through
  // detectExtension as a second parameter (after overrides); ensureProcessAllowed
  // hoisted INSIDE the no-override branch (Strategy 1) BEFORE the try per
  // #10427. Forensic accessory semantics preserved (CLI-not-installed falls
  // through to Strategy 2 silently); ProcessContextDenied propagates.
  // src/retro/changelog-watch.ts wired v1.49.849 — singleton chip.
  // Optional ctx?: ProcessContext threaded through detectVersion +
  // runChangelogWatch opts; ensureProcessAllowed hoisted OUTSIDE the
  // best-effort-silent try/catch per #10427. Forensic accessory semantics
  // preserved (CLI-not-installed continues to return 'unknown' silently);
  // load-bearing security denials propagate via ProcessContextDenied throw.
  // src/scan-arxiv/bridge.ts stale-import cleanup v1.49.852 — execFileSync
  // was imported but never called; removing the dead import takes the file
  // out of audit scope cleanly. Second stale-entry chip (cf. v1.49.834
  // intelligence/analyzer/git.ts which was a different stale-entry shape:
  // wired-but-still-in-allowlist; this one is import-without-use). Confirms
  // the v1.49.806 forward-observation that audit unidirectionality leaves
  // both stale-shape variants undetected by the runtime check.
  // src/scan-arxiv/ranker.ts wired v1.49.862 — singleton chip.
  // Optional ctx?: ProcessContext threaded through RankerOptions →
  // buildDefaultJudge → buildCliJudge → JudgeFn closure. ensureProcessAllowed
  // hoisted inside the JudgeFn closure BEFORE the Promise constructor that
  // wraps spawn('claude', args). Target 'claude' + argv array exposed to the
  // audit; ProcessContextDenied propagates through JudgeFn's await per #10427.
  // scribe/netlist-renderer family fully wired at v1.49.828 batch chip
  // (available + netlistsvg-driver + yosys-driver) — all 3 use the
  // internal-helper pattern (#10433) with hoisted check (#10427) for
  // spawn-based subprocess invocation; wire cost ~14-16 LOC each.
  // src/skill/version-backfill.ts wired v1.49.851 — singleton chip.
  // Optional ctx?: ProcessContext threaded through gitLastModifiedDate
  // (second positional param); ensureProcessAllowed hoisted OUTSIDE the
  // best-effort-silent try/catch per #10427. Forensic accessory semantics
  // preserved (git-unavailable / untracked-file continues to return null
  // silently); ProcessContextDenied propagates.
  // src/terminal/launcher.ts wired v1.49.842 — terminal family batch chip.
  // Optional ctx?: ProcessContext threaded through LaunchOptions; the
  // ensureProcessAllowed call sits naturally outside any catch (the spawn
  // surface has no swallowing try/catch around the spawn itself).
  // src/terminal/session.ts wired v1.49.842 — terminal family batch chip.
  // ensureProcessAllowed hoisted OUTSIDE the tmux-unavailable try/catch
  // per #10427; ProcessContextDenied propagates while tmux-not-installed
  // still returns [] silently.
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
