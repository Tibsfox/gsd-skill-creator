
# v1.49.843 — Retrospective

**Wall-clock:** ~15 min from v842 ship-close to release-notes draft. Faster than v842 because the DI-executor pattern is even tighter than the spawn-call pattern.

## What went as expected

- **Both mesh files share an identical DI-executor + tokenize-and-execSync pattern.** Wiring them together as a batch was natural — one wire shape, two applications.
- **The tokenize-cmd-string pattern is a direct copy from v825 git/core/repo-manager.ts.** No new pattern derivation; just apply the established shape.
- **Sharing ctx between proxy-committer and mesh-worktree was clean.** `createProxyCommitter` calls `createMeshWorktreeManager(executor, ctx)` — both factories' default executors see the same ProcessContext.
- **Audit-test allowlist removal + grep finding the wires worked first try.** The audit greps src/ for `node:child_process` and verifies `ensureProcessAllowed` appears in the same file. Both wires registered correctly.

## What I noticed

- **vitest resolver gotcha caught on first build.** Initial implementation used `require('../security/process-context.js')` inside the function body (matching the original execSync require pattern). This worked for tsc but FAILED at vitest test-time because vitest's resolver doesn't handle bare require with .js extension for .ts files cleanly. Fix: move ensureProcessAllowed import to top-of-file ES import (matching v825 pattern). The execSync require() can stay inside because node:* paths are special-cased by vitest.
- **DI-executor wire is now at 3 instances** (v825 git/core/repo-manager.ts + v843 mesh-worktree.ts + v843 proxy-committer.ts). Could be promoted to a #10433 refinement at a future codify ship. Forward-flag: 3 instances across 2 distinct families crosses the 2-instance threshold.
- **The default-executor-not-injected-executor scoping is consistent.** Per established convention, the security context applies only when the user DIDN'T override the executor. Injected executors are presumed test-mode or caller-managed.
- **Wire cost was 7-9 LOC per file.** Same band as v842 terminal family.

## What surprised me

- **The initial require-path bug was caught by test, not by build.** tsc compiled cleanly because `require()` is just typed as `(string) => any`. Vitest failed at runtime when the require call actually tried to resolve. Lesson: for ESM/TS hybrid surfaces, prefer top-level imports over function-body require.
- **The mesh family was completed in under 20 min total.** Smaller than v842 (45-60 min budget; came in at 20). The DI-executor pattern is more concise than the spawn-call pattern because the wire happens in ONE place (the factory's default executor) rather than at each spawn site.
- **No regression in mesh-worktree or proxy-committer tests.** The factory parameter is purely additive (3rd positional optional); existing callsites pass nothing for ctx and get the same behavior as before.

## Risk that didn't materialize

- **No build regression on the 2nd attempt.** Top-of-file ES imports resolved cleanly.
- **No test count change.** The audit-test removes 2 KNOWN_UNWIRED entries; entries don't drive test count.
- **No interaction with injected-executor test mocks.** Tests inject their own mocks; security check happens only on default executor.

## Carried forward (post-v843)

NEW this ship:

- **DI-executor + tokenized-argv wire shape** — 3rd instance with this ship (v825 first; v843 mesh-worktree + proxy-committer makes 2 + 3). Threshold crossed; eligible for codification as a #10433 refinement on next codify ship. Pattern: factory takes optional ctx, default executor tokenizes cmd, ensureProcessAllowed with tokens[0]+tokens.slice(1), then execSync. Only wraps default executor, not injected ones.

Inherited from v840 + v841 + v842 (unchanged):
- Re-throw ProcessContextDenied from CLI swallow-catch (v820 + v842; 2 instances).
- All other single-instance observations.
- #10433 LOC-band-by-callsite-count refinement: now **6 instances** counting v843's 2 files (v825 + v827 + v828 + v839 + v842 + v843×2). Sustained ESTABLISHED.

Carried forward but DEFERRED at v840:
- Verification/integration-only ships axis (2 instances; needs canonical-doc).
- Bidirectional enforcement completeness (1-2 instances; needs 3rd instance).

## Process retrospective

- **3 ships in <2 hours wall-clock for the operational-debt cluster so far.** v841 (40 min) + v842 (20 min) + v843 (15 min) = ~75 min. The chip + drift-fix cadence is well-tuned at this scale.
- **The require-vs-import gotcha is worth documenting in CLAUDE.md as a chip-author note.** For mesh-style DI-executor wires, use top-of-file ES imports. For spawn-call wires (v842 terminal pattern), either works since the file likely already imports child_process at top.
- **Verification/integration-only canonical-doc decision is next.** That's task 4 of 5. Different shape — no code, no audit; just authoring a discipline doc or extending an existing one.
- **NASA 1.179 pressure margin is now 61 consecutive ships** — well past 50, getting close to 70. Per the v840 next-session list, NASA 1.179 is the strong-default but the operator chose to work through the operational-debt list first.
