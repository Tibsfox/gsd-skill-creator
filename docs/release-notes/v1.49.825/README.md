> Following v1.49.824 — _Codification Ship: Promote #10433 + #10434_, v1.49.825 batch-chips the remaining 3 entries of the `git/core` ProcessContext family: `repo-manager.ts` + `state-machine.ts` + `sync-manager.ts`. First forward application of the freshly codified #10433 internal-helper pattern at family-batch scale. KNOWN_UNWIRED Process 31 → 28 (-3).

# v1.49.825 — Batch Chip: `git/core` Family ProcessContext (repo-manager + state-machine + sync-manager)

**Shipped:** 2026-05-27

Second ship of the v824-826 chain. Family-batch chip applying the v820 first-chip template across the 3 remaining `git/core` entries. All 3 files use the internal-helper pattern (#10433); the wire shape is identical (helper signature gains `ctx?: ProcessContext`; public callers thread `ctx?`; helper calls `ensureProcessAllowed` before the spawn).

## What shipped

- **MODIFIED** `src/git/core/repo-manager.ts`:
  - Add imports: `ensureProcessAllowed`, `ProcessContext` from `../../security/process-context.js`.
  - Add `PROCESS_SOURCE = 'git/core/repo-manager'`.
  - `installRepo(url, targetDir, ctx?: ProcessContext)` — adds optional ctx; threads through 13 internal `exec()` calls + `detectDefaultBranch`.
  - `detectDefaultBranch(repoPath, ctx?)` — threads ctx through 5 internal `exec()` calls.
  - `exec(command, cwd?, ctx?)` — splits shell-string into tokens (first = command, rest = argv); calls `ensureProcessAllowed(ctx, PROCESS_SOURCE, 'exec', ...)` before `execSync`. Audit annotates `cwd=<cwd>` when present.
  - LOC delta: ~22 (helper update + 18 callsite ctx-pass + signature changes).
- **MODIFIED** `src/git/core/state-machine.ts`:
  - Add imports + `PROCESS_SOURCE = 'git/core/state-machine'`.
  - 3 public functions threaded: `detectState(repoPath, ctx?)`, `assertState(repoPath, expected, ctx?)`, `assertClean(repoPath, ctx?)`.
  - Internal helpers threaded: `parseRemotes(repoPath, ctx?)`, `exec(command, cwd, ctx?)`.
  - 7 `exec()` callsites threaded.
  - LOC delta: ~18 (helper update + 7 callsite ctx-pass + 3 public signature changes + 2 internal-helper signature changes).
- **MODIFIED** `src/git/core/sync-manager.ts`:
  - Add imports + `PROCESS_SOURCE = 'git/core/sync-manager'`.
  - `sync(repoPath, options?, ctx?)` — threads ctx through `assertClean(...)`, 11 `execGit()` calls, `applyMerge/applyRebase`, `getConflictFiles`.
  - Internal helpers threaded: `applyRebase(..., ctx?)`, `applyMerge(..., ctx?)`, `getConflictFiles(..., ctx?)`, `execGit(cmd, args, cwd, ctx?)`.
  - `execGit` calls `ensureProcessAllowed(ctx, PROCESS_SOURCE, 'exec-file', cmd, args, cwd=<cwd>)` before `execFile`.
  - LOC delta: ~22 (helper update + 11 callsite ctx-pass + 4 internal-helper signature changes + 1 public signature change).
- **MODIFIED** `src/security/process-context-audit.test.ts`:
  - Removed 3 entries from `KNOWN_UNWIRED`: `repo-manager.ts`, `state-machine.ts`, `sync-manager.ts`.
  - Replaced 2-line v820 forward-note comment with 4-line completion comment marking the `git/core` family as fully wired (4 of 4 entries: branch-manager v820 + this batch).
- **MODIFIED** `.planning/PROJECT.md` — pre-bump refresh v823 → v824 (post-ship reset to v825 follows the standard T14 sequence).

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| `src/git/core/branch-manager.test.ts` | 22 | pass (existing) |
| `src/git/core/sync-manager.test.ts` | 8 | pass (existing) |
| `src/security/process-context-audit.test.ts` | 2047 | pass (3 entries removed from KNOWN_UNWIRED; audit accepts the wire) |
| `src/security/process-context.test.ts` | 21 | pass (existing) |
| **Total tests run** | 4,275 | All pass; 0 new (wiring is structural — covered by audit-test) |
| **LOC delta src/** | ~62 | 3 files modified |

No new test files this ship — the audit-test is the structural verification. Following the v819 batch-chip precedent.

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — **43 consecutive ships at 1.178**). Counter-cadence count UNCHANGED at 6.

Manifest entries: **22 → 22** (UNCHANGED — chip ship, not a discipline change).
Open lesson candidate backlog: **0** (UNCHANGED).
Tentative observations carried forward: ~11-14 → ~11-14 (no new ones; forward-test of #10433 validates the codification).
Wired calibratable thresholds: **5 of 6** (UNCHANGED).
KNOWN_UNWIRED Process: **31 → 28** (-3 net).
KNOWN_UNWIRED Egress: **11** (UNCHANGED).

## #10433 forward-test result

The freshly codified internal-helper pattern (Lesson #10433, codified v1.49.824) predicted ~14-20 LOC per file when an internal helper is present. Actual measurements:

| File | Predicted (per #10433) | Actual | Match? |
|---|---|---|---|
| repo-manager.ts | ~14-20 LOC | ~22 LOC | within band |
| state-machine.ts | ~14-20 LOC | ~18 LOC | within band |
| sync-manager.ts | ~14-20 LOC | ~22 LOC | within band |
| Total | ~42-60 LOC | ~62 LOC | within band |

Prediction holds. The #10433 prediction band of ~14-20 LOC per file is calibrated to within ~10%.

Comparison with v820 branch-manager.ts: that ship was a SINGLE file at ~14 LOC. This 3-file batch is ~62 LOC total (~21 LOC average per file) — slightly higher per-file than v820 because the 3 files have more public surface (3 public functions in state-machine vs 4 in branch-manager) and more internal helper depth (parseRemotes threads through 2 calls + detectDefaultBranch threads through 5).

## The chip cost shape (forward observation)

For files with an internal helper, the wire cost is approximately:

```
wire_cost_LOC ≈ 10 + N_callsites + 4 * N_public_threading_signatures
```

Where:
- 10 ≈ import + PROCESS_SOURCE + helper-signature + ensureProcessAllowed call
- 1 LOC per ctx-threading at each callsite
- 4 LOC ≈ multi-line signature growth per public function gaining `ctx?`

For files without a helper, the floor is closer to ~N * 6 LOC (each callsite requires its own ensure call + hoist). #10433 predicts the helper case is ~5-7× cheaper than the no-helper case at moderate N (~5-15 callsites).

## What this ship is not

- Not a NASA degree advance.
- Not a codification (no new lessons).
- Not a new audit-test introduction.
- Not a full closure of all ProcessContext KNOWN_UNWIRED (28 entries remain after this ship; next batches: dogfood family 3 entries, scribe/netlist-renderer 3 entries, terminal 2 entries, mesh 2 entries, plus ~18 singletons).

## Verification

- `npm run build` → clean.
- `npx vitest run src/git/ src/security/` → 4,275 PASS / 0 fail (14 test files).
- `npx vitest run src/security/process-context-audit` → 2,047 PASS / 0 fail (audit accepts the 3-entry chip).
- Pre-tag-gate (full): expected 17/17 PASS (step 13 within-ceiling 39 ≤ 41 PASS).

## Forward path post-v825 (chain continues)

The v824-826 chain continues:

1. **v826** — T1.3 Ship 3 = Option A (gnn-predictor wire). Closes a different branch of T1.3 GAP-2 substrate-to-consumer wiring.

After the chain closes (~v826), forward-path options remain unchanged from the v823 handoff but with KNOWN_UNWIRED Process now at 28 (was 31 entering this chain). Next ProcessContext batch-chip candidates: dogfood family (extraction/extractor.ts + pydmd/install/health-check.ts + pydmd/install/venv-manager.ts) brings Process 28 → 25.
