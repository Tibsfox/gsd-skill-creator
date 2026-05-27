# v1.49.820 — First Chip: `git/core/branch-manager` ProcessContext Wiring

**Released:** 2026-05-27
**Type:** First-chip migration (#10414 + #10432 application; v812 first-chip pattern)
**Predecessor:** v1.49.819 — Batch Chip: aminet Family ProcessContext Wiring
**Engine state:** UNCHANGED (NASA degree sustains at 1.178; counter-cadence count UNCHANGED at 6)
**Wedge:** `src/git/core/branch-manager.ts` is one of 4 git/core sibling files on the process KNOWN_UNWIRED allowlist. Wire this one to establish the family-specific shape; the remaining 3 are a future batch target.

## Summary

First-chip pattern (v812): wire ONE file to establish the family-specific spawn-pattern, leave the rest for a follow-up batch. After v819's 5-file batch demonstrated the shape works for siblings, v820 picks the largest git/core file (357 LOC, 10 internal call sites) and wires it.

`branch-manager.ts` has a clean structure: 4 public functions all use the same internal helper `execGit(cmd, args, cwd)`. Threading `ctx?` is straightforward: helper gets the ensure call + ctx parameter; public functions accept `ctx?` and pass it down.

## What changed

`src/git/core/branch-manager.ts`:

- **Imports:** add `import { ensureProcessAllowed, type ProcessContext } from '../../security/process-context.js';`
- **Constant:** add `const PROCESS_SOURCE = 'git/core/branch-manager';`
- **Internal helper `execGit`:**
  - Signature: `execGit(cmd, args, cwd)` → `execGit(cmd, args, cwd, ctx?: ProcessContext)`
  - Insert `ensureProcessAllowed(ctx, PROCESS_SOURCE, 'exec-file', cmd, args)` BEFORE the spawn (outside try/catch per #10427).
- **Public functions** (4 total):
  - `createBranch(repoPath, name, options?)` → add `ctx?: ProcessContext` as 4th param; pass `ctx` to 4 internal `execGit` calls.
  - `listBranches(repoPath)` → add `ctx?`; pass to 2 internal calls + the `listWorktrees(repoPath, ctx)` call.
  - `listWorktrees(repoPath)` → add `ctx?`; pass to 1 internal call.
  - `removeBranch(repoPath, name, options?)` → add `ctx?: ProcessContext` as 4th param; pass to 4 internal calls.

`src/security/process-context-audit.test.ts`:

- Remove `'src/git/core/branch-manager.ts'` from `KNOWN_UNWIRED`.
- Add 2-line comment naming v820 first-chip closure + future-batch trajectory.

`.planning/PROJECT.md`:

- Pre-bump refresh `Latest shipped release` v818 → v819.

## Deliverables

| Path | Change | Notes |
|---|---|---|
| `src/git/core/branch-manager.ts` | MODIFIED | +14 LOC (imports + const + helper-ctx + 4-function ctx params + 10 callsite ctx passes). 359 → 374 lines. |
| `src/security/process-context-audit.test.ts` | MODIFIED | -1 LOC + 2-line comment. |
| `.planning/PROJECT.md` | MODIFIED | Pre-bump refresh. |
| `docs/release-notes/v1.49.820/` | NEW | 5 files: README + 4 chapter files. |

## Lessons applied

| # | Lesson | Application |
|---|---|---|
| #10412 | Recon-first per file | Read `branch-manager.ts` (357 LOC) + sibling-file headers (`repo-manager`, `state-machine`, `sync-manager`) + chokepoint definition. Mapped 4 public functions × ~2-3 execGit calls per function = 10 internal call sites. ~5 min recon before any code change. |
| #10414 | Optional `ctx?` parameter pattern | THE central application. 4 public functions + 1 internal helper threaded. Zero call-site churn for external consumers. |
| #10416 | Tolerant-generator / lightest wire | Resisted: batching all 4 git/core sibs in this ship (operator's chain plan said "first chip" not "batch chip"); pre-emptively threading a typed `GitCommand` union (the chokepoint's existing string-pattern allowlist handles this). Chose: first-chip only — establish the shape, leave the 3 remaining for a future ship. |
| #10422 | Verdict-pattern surface separation | Chokepoint definition + wired call site are separate decision surfaces. PROCESS_SOURCE local; no cross-file state. |
| #10427 | Failure-mode contracts | `ensureProcessAllowed` hoisted INSIDE the helper (`execGit`) but BEFORE the spawn — denial propagates via the helper's Promise rejection chain to public-function callers. Standard load-bearing-propagation shape. |
| #10432 | KNOWN_UNWIRED ledger discipline | Allowlist 32 → 31. Inline 2-line comment in the allowlist names the v820 first-chip + future-batch trajectory. The ledger asymptotes per the codified discipline. |

## What this ship is not

- Not a NASA degree advance.
- Not a behavior change for existing callers.
- Not a closure of the git/core family — 3 of 4 remain.
- Not a new chokepoint.
- Not a substrate ship.

## Verification

- `npx tsc --noEmit` → clean.
- `npx vitest run src/git/core/ src/security/process-context-audit.test.ts` → 2077 PASS / 0 fail.
- Pre-tag-gate (full): expected 17/17 PASS.

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — 38 consecutive ships at 1.178). Counter-cadence count UNCHANGED at 6.

Migration-debt-ledger consume-axis ship; does not tick counter-cadence per #10430.

## Forward path

v821-822 = T2.2 Discipline-coverage gate WARN → BLOCK (2 ships per audit sizing). v823 = T1.3 ObservationBridge wire. Then the chain closes.

The git/core 3-file batch (repo-manager, state-machine, sync-manager) is a future ship beyond this chain — would bring process KNOWN_UNWIRED 31 → 28 if batched.
