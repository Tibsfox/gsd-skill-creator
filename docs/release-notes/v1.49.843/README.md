> Following v1.49.842 — _ProcessContext terminal family batch chip (3 files)_, v1.49.843 is the **ProcessContext mesh family batch chip**. Wires 2 KNOWN_UNWIRED entries (`src/mesh/mesh-worktree.ts` + `src/mesh/proxy-committer.ts`) via the DI-executor + tokenized argv pattern (matches v825 git/core wire). KNOWN_UNWIRED Process: **18 → 16** (-2).

# v1.49.843 — ProcessContext Mesh Family Batch Chip

**Shipped:** 2026-05-27

Smaller batch chip than v842 (2 files vs 3) wiring the mesh family for ProcessContext. Both files use a dependency-injection executor pattern (`gitExecutor?: GitExecutor` factory parameter); the factory default-executor calls `execSync` with arbitrary git command strings. Wire site: tokenize the cmd string, extract executable + argv, call `ensureProcessAllowed` before delegating to execSync.

## What shipped

### Wires

- **MODIFIED** `src/mesh/mesh-worktree.ts` — `createMeshWorktreeManager(gitExecutor?, ctx?)`. Adds optional `ctx?: ProcessContext` to the factory. Default executor tokenizes `cmd.trim().split(/\s+/)`, extracts `tokens[0]` as executable + `tokens.slice(1)` as argv, calls `ensureProcessAllowed(ctx, 'mesh/mesh-worktree', 'exec-sync', exe, argv)` before `execSync`. Same shape as v825 `src/git/core/repo-manager.ts`. Injected executors are NOT wrapped — security is the caller's responsibility when injecting.
- **MODIFIED** `src/mesh/proxy-committer.ts` — `createProxyCommitter(gitExecutor?, worktreeManager?, ctx?)`. Adds optional `ctx?: ProcessContext` to the factory. Same tokenize-and-allow pattern. Passes ctx to `createMeshWorktreeManager(executor, ctx)` so both executors share a single security context.

### KNOWN_UNWIRED allowlist updates

- **MODIFIED** `src/security/process-context-audit.test.ts`:
  - Removed `'src/mesh/mesh-worktree.ts'` (with inline comment).
  - Removed `'src/mesh/proxy-committer.ts'` (with inline comment).

KNOWN_UNWIRED Process: **18 → 16** (-2 this ship; -5 cumulative across v842 + v843).

## Wire details

### The DI-executor pattern + tokenized argv

Both files expose a factory that takes an optional `gitExecutor?: GitExecutor` parameter for testability. Tests inject mock executors; production code uses the default which shells out to git. The wire extends this pattern by adding `ctx?: ProcessContext` as a 2nd (mesh-worktree) or 3rd (proxy-committer) optional factory parameter. The default executor captures ctx in its closure and calls `ensureProcessAllowed` before `execSync`.

The tokenization step (`cmd.trim().split(/\s+/)`) extracts the executable name + argv vector. This is the same approach v825 `git/core/repo-manager.ts` uses for its tokenized git invocations. ProcessContext's `allowList` checks the first token (the executable), which for these mesh executors is always `git`. The argv vector is recorded in the audit sink for downstream telemetry.

Per the established pattern, the wire wraps ONLY the default executor — not injected executors. When a test or production caller passes a custom `gitExecutor`, ProcessContext is bypassed (the test executor is presumed to be safe; the production-injected executor must wrap itself).

### Top-level vs require()-inside-function imports

The original code used `require('node:child_process')` inside the default executor (probably to defer the import). The wire moves to standard ES imports at the top of file for both `ensureProcessAllowed` + `ProcessContext` because vitest's resolver doesn't handle bare `require('./...js')` paths cleanly. The execSync require() stays inside the function for backward compatibility (it's still callable from vitest's ESM environment via the dynamic require shim).

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| `src/security/process-context-audit.test.ts` | 2,050 (test-internal) | -2 KNOWN_UNWIRED entries; audit greps src/ and finds the new wires |
| `src/mesh/mesh-worktree.test.ts` | 19 | UNCHANGED (ctx optional; existing tests still pass) |
| `src/mesh/proxy-committer.test.ts` | 22 | UNCHANGED (same) |

Full suite at ship time: 35,261 PASS / 45 skipped / 7 todo / 0 fail.

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — **61 consecutive ships at 1.178**; was 60 entering this ship — new record).
Counter-cadence count UNCHANGED at 6.

Manifest entries: **23 → 23** (UNCHANGED).
Lessons in manifest (unique): **78 → 78** (UNCHANGED).
Wired calibratable thresholds: **5 of 7** (UNCHANGED).
**KNOWN_UNWIRED Process: 18 → 16 (-2).** Egress: **11** (UNCHANGED).
UNCODIFIED: **39 ≤ ceiling 41** (UNCHANGED).

## Why this ship

3rd ship of the new operational-debt cluster (v841 drift-recalibration → v842 terminal family → v843 mesh family). Continues the established batch-chip cadence. The mesh family was the smallest remaining named batch in the v840 candidates list (2 entries); closing it brings KNOWN_UNWIRED Process to 16.

The DI-executor wire shape (factory-takes-ctx + closure-captures-ctx + tokenize-cmd) is reusable for the remaining KNOWN_UNWIRED entries that also use DI executors. Future singleton chips that follow this pattern will be near-zero wire cost.

## Tentative observations carried forward

NEW this ship (1; below threshold):

- **DI-executor + tokenized-argv wire shape** — when a factory exposes `gitExecutor?: GitExecutor` for testability AND the default executor takes a free-form cmd string, the wire pattern is: (a) add ctx? to factory, (b) tokenize cmd, (c) ensureProcessAllowed with tokens[0] + tokens.slice(1), (d) execSync as before. Instances: v825 `git/core/repo-manager.ts` (1st) + v843 mesh family × 2 files (this ship). 3 total instances across 2 distinct families. Could be promoted at next codify ship as a #10433 refinement.

Inherited (unchanged):
- Re-throw ProcessContextDenied from CLI swallow-catch (v820 + v842; 2 instances).
- Recent-vs-baseline-recent comparison pattern (v841; 1 instance).
- Drift-check noise as scoring-system feedback loop (v841; 1 instance).
- Codify-ship-as-recon-consolidator pattern (v840; 1 instance).
- Deferral-by-classification-ambiguity (v840; 1 instance).
- All other single-instance observations.

Carried forward but DEFERRED at v840:
- Verification/integration-only ships axis (2 instances v829 + v832).
- Bidirectional enforcement completeness (1-2 instances v838 + v836).

## Pickup

v1.49.843 SHIPPED. Next per the v840 candidates list: verification/integration-only canonical-doc decision (operator-bounded).

| Engine pulse | Value |
|---|---|
| NASA degree | 1.178 (61 consecutive ships — new record) |
| Counter-cadence | 6 |
| Manifest entries | 23 |
| Unique lessons in manifest | 78 |
| UNCODIFIED | 39 ≤ 41 |
| KNOWN_UNWIRED Process | **16 (-2 this ship; -5 cumulative)** |
| KNOWN_UNWIRED Egress | 11 |
| Wired calib thresholds | 5 / 7 |
| Drift-check alerts | 0 major, 1 informational warning |
