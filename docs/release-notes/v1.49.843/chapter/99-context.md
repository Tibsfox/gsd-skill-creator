
# v1.49.843 — Context

## Provenance

3rd ship of the new operational-debt cluster (v841 → v842 → v843). Mesh family batch chip per v840 next-session candidates list:

> **Mesh family batch** (2 entries with injected-executor pattern; needs separate planning).

Actual wall-clock ~15 min (no separate planning needed — DI-executor wire shape was already established at v825).

## What this ship adds

```
src/mesh/mesh-worktree.ts                          [MODIFIED: +7 LOC for ctx? + ensureProcessAllowed in default executor]
src/mesh/proxy-committer.ts                        [MODIFIED: +9 LOC for ctx? + ensureProcessAllowed + ctx threading to mesh-worktree]
src/security/process-context-audit.test.ts         [MODIFIED: -2 KNOWN_UNWIRED entries + inline comments]
docs/release-notes/v1.49.843/                      [NEW: README + 4 chapters]
.planning/PROJECT.md                               [MODIFIED: pre-bump refresh]
```

## Recon trail

1. **Read predecessor handoff** (v840 next-session candidates list). Mesh family explicitly named as 2-entry batch with injected-executor pattern.
2. **Inspect both files** to confirm pattern shape — both use `gitExecutor?: GitExecutor` injection point + default executor that calls execSync.
3. **Reference v825 git/core/repo-manager.ts** as the canonical DI-executor + tokenized-argv wire example.
4. **Implement both factories**: add `ctx?: ProcessContext` as last optional positional parameter; default executor tokenizes cmd, calls ensureProcessAllowed, delegates to execSync.
5. **First-try test failure** — vitest can't resolve `require('../security/process-context.js')` cleanly for .ts files. Fix: move ensureProcessAllowed to top-of-file ES import (matching v825 convention).
6. **Re-test** — all mesh tests pass; audit-test passes; build clean.
7. **Author release notes** — 5 files (README + 4 chapters).

## Wire decisions in detail

### Why DI-executor wire shape

Both files expose a factory pattern with optional injected executor for testability:
```ts
export function createMeshWorktreeManager(gitExecutor?: GitExecutor): MeshWorktreeManager
export function createProxyCommitter(gitExecutor?, worktreeManager?): ProxyCommitter
```

The DI pattern is in-place specifically for test mocking — tests inject controlled executors; production uses the default that shells out to real git. Adding `ctx?: ProcessContext` as the next optional parameter is the natural extension: the factory now also accepts an optional security context, used by the default executor.

### Why only the default executor is wrapped

Injected executors are caller-supplied. For tests, they're mocks that don't actually spawn anything. For production custom-executors (e.g. a future remote-git-over-HTTP executor), the caller takes responsibility for their own security. Wrapping the default-only is the principled boundary: ProcessContext applies WHEN AND ONLY WHEN the factory creates the executor.

### Why ProxyCommitter shares ctx with MeshWorktreeManager

`createProxyCommitter` internally calls `createMeshWorktreeManager(executor, ctx)` when no worktreeManager is provided. Both factories' default executors should see the same ctx so the audit sink gets all events under one security context. The 3rd parameter to createProxyCommitter and the 2nd parameter to createMeshWorktreeManager bind to the same ctx.

### Why tokenize cmd instead of pass it whole

ProcessContext's `allowList` checks executable name against patterns. The cmd parameter to execSync is a free-form shell command (e.g. `"git worktree add /path branch"`); we tokenize on whitespace to extract `"git"` (executable) + `["worktree", "add", "/path", "branch"]` (argv). The allowList sees the executable; argv goes into the audit record for telemetry. Same approach as v825 repo-manager.ts.

## Verification trail

| Step | Result |
|---|---|
| `npm run build` | PASS |
| `npx vitest run src/mesh/` | PASS (all 36 mesh tests; mesh-worktree 19 + proxy-committer 22 + others) |
| `npx vitest run src/security/process-context-audit.test.ts` | PASS (2,050 tests; 2 KNOWN_UNWIRED entries removed without breaking) |
| `npx vitest run src/security/process-context.test.ts` | PASS (21 tests) |
| `bash tools/pre-tag-gate.sh` | (pending T14 step 1) |

## What was deferred

- **Codification of DI-executor wire shape.** 3 instances now (v825 + v843×2), crossing the 2-instance threshold per #10426. Defer to next codify ship (~v847-850) per the meta-cadence — codify ships consolidate; v843 is a chip.
- **Threading ctx through ProxyCommitter / MeshWorktreeManager methods.** Currently ctx applies only at factory time (captured in closure). If a future caller needs per-method ctx (different security contexts for different operations), the methods can accept their own ctx. Not needed for current call sites.

## T14 ship sequence (operator-only authorization)

Per Lesson #10191 + #10184 + #10197. Canonical sequence at `docs/T14-SHIP-SEQUENCE.md`.

Milestone-specific notes:
- 3-file batch chip ship — 2 source files + 1 audit-test allowlist update.
- No new lessons promoted; no manifest changes.
- v836 preservation gate continues to fire (7th time at v843's T14 publish step expected).

## Forward path post-v843

1. **Verification/integration-only canonical-doc decision** — next per the v840 candidates list. Operator-bounded; author the missing canonical-doc home OR extend `docs/meta-cadence-discipline.md`. v844.
2. **Production caller of predict path** — activates v837's auto-emit wire. Substantive feature work. v845.
3. **NASA 1.179 forward-cadence** — still STRONG-DEFAULT (61 consecutive ships at 1.178 — record-widest pressure margin).
4. **Next codify ship (~v847-850)** — pickup candidates: DI-executor wire shape (this ship's 3rd instance crossed threshold), verification/integration-only ships axis (v840 deferred), bidirectional enforcement completeness (v840 deferred), re-throw ProcessContextDenied from CLI swallow-catch (v820 + v842).

## References

- Predecessor: v1.49.842 (`docs/release-notes/v1.49.842/`)
- Predecessor handoff: `.planning/HANDOFF-2026-05-27-v1.49.840-codify-ship-closed.md`
- v825 reference wire (canonical DI-executor + tokenized-argv): `src/git/core/repo-manager.ts`
- ProcessContext chokepoint: `src/security/process-context.ts`
- Audit-test: `src/security/process-context-audit.test.ts`
- Internal-helper pattern (#10433): `docs/architecture-retrofit-patterns.md`
- KNOWN_UNWIRED ledger discipline: `docs/known-unwired-ledger-discipline.md`
- Security chokepoints catalog: `docs/security-chokepoints.md`
