> Following v1.49.870 — _ProcessContext singleton chip: `src/learning/version-manager.ts` (Track 4 chip #1)_, v1.49.871 is the **fourth ship of the v868-v882 follow-on campaign** and **Track 4 chip #2** (Process singleton chips ×6, size-ascending). Wires `src/git/workflows/contribute.ts` (183 LOC) via the **closure-capture wire shape**: refactors the module-level `exec()` helper into a closure captured inside `contribute()` that captures `ctx?` from the outer scope. Single `ensureProcessAllowed` at the closure top protects ~12 spawn sites; `ProcessContextDenied` re-thrown from 4 swallow-everything catches per #10427.

# v1.49.871 — ProcessContext singleton chip: `src/git/workflows/contribute.ts` (Track 4 chip #2)

**Shipped:** 2026-05-28

Second chip of Track 4. Size-ascending order picks `src/git/workflows/contribute.ts` (183 LOC) as the next entry after v870's version-manager (177 LOC). The new step 18/18 cross-audit gate (wired v869) runs at pre-tag-gate as automatic continuous-verification.

## What shipped

- **MODIFIED** `src/git/workflows/contribute.ts` (183 LOC pre-wire):
  - Added `import { ensureProcessAllowed, ProcessContextDenied, type ProcessContext }` from `../../security/process-context.js`.
  - Removed module-level `function exec(command, cwd)` helper.
  - Added `ctx?: ProcessContext` as 4th parameter to `contribute()`.
  - Inlined the `exec()` helper as a closure inside `contribute()` that captures `ctx?` from the outer scope; single `ensureProcessAllowed(ctx, 'git/workflows/contribute', 'exec-sync', 'sh', ['-c', command])` at closure top protects all ~12 spawn sites (`git fetch upstream`, `git rebase upstream/main`, `git rebase --abort`, `git checkout main`, `git merge --no-ff dev`, `git checkout dev`, `which gh`, `git push origin main`, `gh pr create ...`).
  - Re-throws `ProcessContextDenied` from 4 swallow-everything `catch` blocks (sync recovery, merge wrap, gh push wrap, gh-availability wrap) per Lesson #10427. Fault-tolerant semantics preserved for non-security errors.
- **MODIFIED** `src/git/workflows/contribute.test.ts`:
  - Added imports for `ProcessContext`, `ProcessContextDenied`, `NULL_PROCESS_AUDIT_SINK`.
  - Added new `describe('ProcessContext wire (v1.49.871)')` block with 3 test cases: default-undefined preserves legacy permissive; audit sink records `source='git/workflows/contribute'` + `target='sh'` + `argv[0]='-c'` for every exec invocation; empty allow-list denies → `ProcessContextDenied` propagates from `contribute()`.
- **MODIFIED** `src/security/process-context-audit.test.ts`:
  - Removed `'src/git/workflows/contribute.ts'` from `KNOWN_UNWIRED` (was line 82).
  - Added v1.49.871 block comment documenting the closure-capture wire (4th-param ctx, refactor from module-level helper to closure, 12 spawn-site protection, 4 re-throw catches).
  - KNOWN_UNWIRED Process: **5 → 4**.

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| `src/git/workflows/contribute.test.ts` | +3 cases (10/10 PASS) | Wire verification: default-permissive + audit threading + denial propagation |
| `src/security/process-context-audit.test.ts` | 2051 PASS (no count change) | Allowlist count drops 5 → 4; inverse-audit invariants preserved |

`node tools/security/check-stale-known-unwired.mjs` reports `ProcessContext (KNOWN_UNWIRED: 4) clean` (was 5).

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — **89 consecutive ships at 1.178**).
Counter-cadence count UNCHANGED at 6.

Manifest entries: **23** (UNCHANGED). Lessons in manifest: **85** (UNCHANGED). Wired calibratable thresholds: **5 of 7** (UNCHANGED).
**KNOWN_UNWIRED Process: 5 → 4** (-1). Egress: **6** (UNCHANGED).
UNCODIFIED: **39 ≤ ceiling 41** (UNCHANGED). Operational axes: **4** (UNCHANGED).

## Wire shape: closure-capture (refactor from module-level helper)

The file's pre-existing structure had a free `exec()` helper at module scope. The closure-capture variant of the internal-helper pattern (#10433) refactors this helper into a closure inside `contribute()` so it can capture the optional `ctx?` parameter without needing to thread it through every call site. Single `ensureProcessAllowed` at the closure's top protects all ~12 spawn sites — DRY at the security boundary while keeping the helper's call surface unchanged.

The wire-shape catalog from v868's #10444 codification predicted closure-capture would emerge in the mid-LOC band; v871 confirms this at 183 LOC (right at the small-to-mid boundary). The structural shape predicted by file size held this time (vs v870 where pre-existing helper bias surfaced).

Per #10427, the 4 swallow-everything catches in the sync recovery / merge wrap / push wrap / gh-availability wrap blocks were updated to re-throw `ProcessContextDenied` before falling through to fault-tolerant recovery. Security denials are load-bearing; non-security errors retain original semantics.

## What this ship is not

- Not a NASA degree advance (still 1.178; now 89 consecutive ships).
- Not a new discipline domain (manifest stays at 23 entries).
- Not a counter-cadence ship (counter-cadence count unchanged at 6).

## Verification

- `npx vitest run src/git/workflows/contribute.test.ts` → 10/10 PASS (7 existing + 3 new).
- `npx vitest run src/security/process-context-audit.test.ts` → 2051 PASS.
- `node tools/security/check-stale-known-unwired.mjs` → exit 0; ProcessContext entryCount 4 (was 5); EgressContext entryCount 6 (UNCHANGED).
- `npm run build` → PASS.
- `bash tools/pre-tag-gate.sh` → 18/18 PASS (step 18 cross-audit clean post-wire).

## Forward path post-v871

Remaining v868-v882 campaign:
- **v1.49.872** — Process chip #3: `src/cli/commands/pic2html.ts` (311 LOC).
- v1.49.873-875 — Process chips #4-#6: gates/pre-flight (363) → learn/acquirer (509) → harness-integrity (1440).
- v1.49.876-881 — Egress chips ×6 (size-ascending).
- v1.49.882 — Verify-overdue forecast scan tool.

Other open items: NASA 1.179 forward-cadence (89 → 90 consecutive ships at 1.178); T2.1 v1.50 unblock-or-archive decision.
