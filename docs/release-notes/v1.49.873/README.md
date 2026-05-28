> Following v1.49.872 — _ProcessContext singleton chip: src/cli/commands/pic2html.ts (Track 4 chip #3)_, v1.49.873 is the **sixth ship of the v868-v882 follow-on campaign** and **Track 4 chip #4** (Process singleton chips ×6, size-ascending). Wires `src/git/gates/pre-flight.ts` (363 LOC) via the **module-internal-helper wire shape**: `ctx?: ProcessContext` threaded through `exec()` helper at module scope, propagated to `isClean` + `buildDiffSummary` + the two exported preflight functions (`preFlightMerge`, `preFlightPR`). `ProcessContextDenied` re-thrown from 11 swallow-everything catches per #10427.

# v1.49.873 — ProcessContext singleton chip: `src/git/gates/pre-flight.ts` (Track 4 chip #4)

**Shipped:** 2026-05-28

Fourth chip of Track 4. Size-ascending picks pre-flight.ts (363 LOC) after v872's pic2html (311 LOC). The new step 18/18 cross-audit gate (wired v869) runs at pre-tag-gate as automatic continuous-verification.

## What shipped

- **MODIFIED** `src/git/gates/pre-flight.ts` (363 LOC pre-wire):
  - Added imports for `ensureProcessAllowed`, `ProcessContextDenied`, `ProcessContext`.
  - Threaded `ctx?: ProcessContext` through `exec()` (3rd param), `isClean()` (2nd param), `buildDiffSummary()` (3rd param), `preFlightMerge()` (2nd param exported), `preFlightPR()` (2nd param exported).
  - The `exec()` helper hoists `ensureProcessAllowed(ctx, 'git/gates/pre-flight', 'exec-sync', 'sh', ['-c', command])` BEFORE `execSync`. Module-internal-helper variant of #10433 — single check protects ~12 spawn sites across both exported functions.
  - Re-throws `ProcessContextDenied` from 11 swallow-everything catches across `buildDiffSummary` (3), `preFlightMerge` (5+finally), `preFlightPR` (3+nested) per Lesson #10427. Fault-tolerant semantics preserved for non-security errors (commits-ahead defaults to 0; large-file detection falls through to numstat).
- **MODIFIED** `src/git/gates/pre-flight.test.ts`:
  - Added imports for `ProcessContext`, `ProcessContextDenied`, `NULL_PROCESS_AUDIT_SINK`.
  - Added new `describe('pre-flight ProcessContext wire (v1.49.873)')` block with 4 test cases: default-undefined preserves behavior; audit sink records source/target for every exec; preFlightMerge throws ProcessContextDenied on denial; preFlightPR throws ProcessContextDenied on denial.
- **MODIFIED** `src/security/process-context-audit.test.ts`:
  - Removed `'src/git/gates/pre-flight.ts'` from `KNOWN_UNWIRED` (was line 91).
  - Added v1.49.873 block comment documenting the module-internal-helper wire (ctx? threaded through 5 functions; 11 catches re-throw security denials; 12 spawn sites protected by single hoist).
  - KNOWN_UNWIRED Process: **3 → 2**.

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| `src/git/gates/pre-flight.test.ts` | +4 cases (15/15 PASS) | Wire verification across both exported functions |
| `src/security/process-context-audit.test.ts` | 2051 PASS (no count change) | Allowlist count drops 3 → 2; inverse-audit invariants preserved |

`node tools/security/check-stale-known-unwired.mjs` reports `ProcessContext (KNOWN_UNWIRED: 2) clean` (was 3).

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — **91 consecutive ships at 1.178**).
Counter-cadence count UNCHANGED at 6. Manifest 23 / Lessons 85 / Wired thresholds 5 of 7 (UNCHANGED).
**KNOWN_UNWIRED Process: 3 → 2** (-1). Egress: 6 (UNCHANGED).
UNCODIFIED: 39 ≤ 41 (UNCHANGED).

## Wire shape: module-internal-helper (variant of #10433)

363-LOC file with N≈12 spawn sites + 2 exported functions sharing a `exec()` helper. Threading `ctx?` through the helper (added as 3rd param) protects all spawn sites with a single ensureProcessAllowed. The helper stays at module scope (not refactored to closure as v871 did) because TWO exported functions need to share it — closure-capture would require duplication.

The 11-catch #10427 application is the largest single-ship application of the re-throw discipline yet (v870 had 5, v871 had 4). Strengthens the v870-v871 multi-method-re-throw observation; promotion-eligible at next codify.

## What this ship is not

- Not a NASA degree advance (still 1.178; now 91 consecutive ships).
- Not a new discipline domain (manifest 23 entries).
- Not a counter-cadence ship.

## Verification

- `npx vitest run src/git/gates/pre-flight.test.ts` → 15/15 PASS.
- `npx vitest run src/security/process-context-audit.test.ts` → 2051 PASS.
- `node tools/security/check-stale-known-unwired.mjs` → ProcessContext entryCount 2 (was 3); Egress 6 (UNCHANGED).
- `npm run build` → PASS.
- `bash tools/pre-tag-gate.sh` → 18/18 PASS.

## Forward path post-v873

Remaining v868-v882 campaign:
- **v1.49.874** — Process chip #5: `src/learn/acquirer.ts` (509 LOC).
- v1.49.875 — Process chip #6: `src/chipset/harness-integrity.ts` (1440 LOC; largest, Track 4 close).
- v1.49.876-881 — Egress chips ×6.
- v1.49.882 — Verify-overdue forecast scan tool.
