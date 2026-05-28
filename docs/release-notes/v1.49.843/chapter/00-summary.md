
# v1.49.843 — ProcessContext Mesh Family Batch Chip

**Released:** 2026-05-27

## Why this ship

3rd ship of the new operational-debt cluster. Smaller batch chip than v842 (2 files vs 3) wiring the mesh family for ProcessContext. Continues the established batch-chip cadence: identify a coherent group of related KNOWN_UNWIRED entries, wire them together in one ship, remove the corresponding allowlist entries.

Both files (`src/mesh/mesh-worktree.ts` + `src/mesh/proxy-committer.ts`) use a dependency-injection executor pattern (`gitExecutor?: GitExecutor` factory parameter). This is a different wire shape than the terminal family v842 — instead of wrapping spawn/exec directly, we wrap the factory's default executor by passing ctx through the factory and capturing it in the executor's closure.

## The 2 wires

### `src/mesh/mesh-worktree.ts` — `createMeshWorktreeManager(gitExecutor?, ctx?)`

Adds optional `ctx?: ProcessContext` as the 2nd factory parameter. The default executor (used when no `gitExecutor` is injected) tokenizes the cmd string into executable + argv, calls `ensureProcessAllowed(ctx, 'mesh/mesh-worktree', 'exec-sync', exe, argv)`, then delegates to `execSync(cmd, {encoding: 'utf8'})`. Injected executors are NOT wrapped — caller-injected security is the caller's responsibility.

### `src/mesh/proxy-committer.ts` — `createProxyCommitter(gitExecutor?, worktreeManager?, ctx?)`

Adds optional `ctx?: ProcessContext` as the 3rd factory parameter. Same tokenize-and-allow pattern as mesh-worktree. The factory passes ctx to `createMeshWorktreeManager(executor, ctx)` so both files' default executors share a single security context.

## Surface delta

- 2 source files modified (both factories + their default executors)
- 1 audit-test file modified (2 KNOWN_UNWIRED entries removed)
- 0 new tests (audit-test count internal; full suite unchanged)
- 5 release-notes files (this + README + 3 chapters)

## Manifest state

| Field | Before | After |
|---|---|---|
| Manifest entries (discipline domains) | 23 | 23 |
| Lessons in manifest (unique) | 78 | 78 |
| Open lesson candidate backlog | 0 | 0 |
| Tentative observations carried forward | ~12-14 | ~12-14 (+1 NEW: DI-executor+tokenized-argv wire shape now at 3 instances) |

## Engine state

NASA degree at **1.178** (UNCHANGED — **61 consecutive ships at 1.178**; was 60 entering this ship). New widest-pressure-margin record.
Counter-cadence count UNCHANGED at 6.
**KNOWN_UNWIRED Process: 18 → 16 (-2 this ship; -5 cumulative across v842 + v843).**
KNOWN_UNWIRED Egress UNCHANGED at 11.
Wired calibratable thresholds: 5 of 7 (UNCHANGED).
UNCODIFIED count: 39 ≤ ceiling 41 (UNCHANGED).
