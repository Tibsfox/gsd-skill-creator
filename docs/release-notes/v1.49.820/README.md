> Following v1.49.819 — _Batch Chip: aminet Family ProcessContext Wiring_, v1.49.820 closes the 5th item in the v816-822 chain. First-chip migration of `src/git/core/branch-manager.ts` through the v806 ProcessContext chokepoint. Establishes the family-specific shape for a future 3-file batch (repo-manager, state-machine, sync-manager). KNOWN_UNWIRED Process **32 → 31**.

# v1.49.820 — First Chip: `git/core/branch-manager` ProcessContext Wiring

**Shipped:** 2026-05-27

Fifth ship of the v816-822 chain. First-chip migration per v812 pattern — wire ONE file to establish the family-specific shape, leave the remaining 3 (`repo-manager`, `state-machine`, `sync-manager`) for a future batch ship per v819's batch pattern.

`branch-manager.ts` is the largest of the 4 git/core files (357 lines, 10 internal `execGit` call sites across 4 public functions). Threading `ctx?: ProcessContext` through the internal helper means each public function gets a `ctx?` parameter and passes it down; the helper inserts the `ensureProcessAllowed` call before each spawn.

## What shipped

- **MODIFIED** `src/git/core/branch-manager.ts`:
  - Add `import { ensureProcessAllowed, type ProcessContext } from '../../security/process-context.js';`
  - Add `const PROCESS_SOURCE = 'git/core/branch-manager';`
  - Modify internal `execGit(cmd, args, cwd)` → `execGit(cmd, args, cwd, ctx?)` + insert `ensureProcessAllowed` BEFORE the spawn (outside try/catch per #10427).
  - Thread `ctx?` through 4 public functions: `createBranch`, `listBranches`, `listWorktrees`, `removeBranch`.
  - Update all 10 internal `execGit` call sites to pass `ctx`.
- **MODIFIED** `src/security/process-context-audit.test.ts` — remove `'src/git/core/branch-manager.ts'` from `KNOWN_UNWIRED`; add 2-line comment naming the v820 first-chip closure + future-batch trajectory.
- **MODIFIED** `.planning/PROJECT.md` — pre-bump refresh `Latest shipped release` v818 → v819.

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| `branch-manager.test.ts` | 22 (unchanged) | All existing callers pass `ctx = undefined`; byte-equivalent |
| process-context audit | 2047 (unchanged) | KNOWN_UNWIRED shrunk 32 → 31 |
| **Total added** | **+0** | Wiring is byte-equivalent for existing callers |

## KNOWN_UNWIRED ledger update

| Pre-v820 | Post-v820 | Delta |
|---|---|---|
| Process: **32** | **31** | -1 (git/core/branch-manager) |
| Egress: **11** | **11** | UNCHANGED |

After v820, the git/core family has 1 of 4 wired + 3 remaining (repo-manager, state-machine, sync-manager). A future batch chip can apply the v819 5-file pattern to these 3 + bring process KNOWN_UNWIRED 31 → 28.

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — 38 consecutive ships at 1.178). Counter-cadence count UNCHANGED at 6.

Manifest entries: **22 → 22** (UNCHANGED — chip migration, not a new discipline).
Open lesson candidate backlog: **0** (UNCHANGED).
Tentative observations carried forward: ~10-12 → ~10-12.

## Lessons applied

| # | Lesson | Application |
|---|---|---|
| #10412 | Recon-first per file | Read `branch-manager.ts` (357 lines) + `execGit` helper structure + sibling file headers (~5 min) before any code change. Surfaced: 4 public functions × ~2-3 execGit calls each = 10 internal call sites. |
| #10414 | Optional `ctx?` parameter | THE central application. 4 public functions + 1 internal helper all thread `ctx?: ProcessContext`. Zero call-site churn for existing public-API consumers. |
| #10416 | Tolerant-generator / lightest wire | Resisted: pre-emptively wiring all 4 git/core siblings in this ship (could be future batch); defining `defaultGitProcessContext()` factory. Chose: first-chip only — establish the shape, batch later. |
| #10422 | Verdict-pattern surface separation | The wired call site is one observability surface; the chokepoint definition is the shared decision surface. PROCESS_SOURCE is local. |
| #10427 | Failure-mode contracts | `ensureProcessAllowed` hoisted at the helper level — propagation reaches all callers via the Promise rejection. Standard load-bearing-propagation shape. |
| #10432 | KNOWN_UNWIRED ledger discipline | Allowlist 32 → 31; inline comment names v820 first-chip + future-batch trajectory. |

## What this ship is not

- Not a NASA degree advance.
- Not a behavior change for existing callers.
- Not a closure of the git/core family — 3 of 4 remain (future batch target).
- Not a new chokepoint definition.

## Forward path

v821-822 (next in chain) = T2.2 Discipline-coverage gate WARN → BLOCK (2 ships from v784 audit). Then v823 ObservationBridge wire closes the chain.

The git/core 3-file batch (repo-manager, state-machine, sync-manager) is a future ship; not in the v816-822 chain.
