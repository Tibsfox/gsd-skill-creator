> Following v1.49.869 — _Pre-tag-gate Integration: Cross-Audit Tool as Step 18/18 (Deterministic Gate)_, v1.49.870 is the **third ship of the v868-v882 follow-on campaign** and the **first chip of Track 4** (Process singleton chips ×6, size-ascending). Wires `src/learning/version-manager.ts` (177 LOC — smallest of the 6 remaining Process KNOWN_UNWIRED entries) via the **internal-helper pattern** (#10433): `ctx?: ProcessContext` constructor parameter, single `ensureProcessAllowed` at the top of the private `git()` helper. `ProcessContextDenied` re-thrown from 4 swallow-everything catches per #10427.

# v1.49.870 — ProcessContext singleton chip: `src/learning/version-manager.ts` (Track 4 chip #1)

**Shipped:** 2026-05-28

First chip of Track 4 (Process singleton chips ×6). Size-ascending order picks the smallest LOC entry first per the v1.49.868-codified #10444 discipline. The new step 18/18 cross-audit gate (wired v869) runs at pre-tag-gate as automatic continuous-verification.

## What shipped

- **MODIFIED** `src/learning/version-manager.ts` (177 LOC):
  - Added `import { ensureProcessAllowed, ProcessContextDenied, type ProcessContext }` from `../security/process-context.js`.
  - Added private `ctx?: ProcessContext` class field.
  - Constructor accepts optional `ctx` as third param (after `skillsDir`, `workDir`); preserves all existing call sites (legacy permissive when undefined).
  - The private `git()` helper hoists `ensureProcessAllowed(this.ctx, 'learning/version-manager', 'exec', 'sh', ['-c', command])` BEFORE `execAsync(command, ...)`. Internal-helper pattern (#10433) — single check protects all 7 call sites (`getHistory`, `getVersionContent`, `rollback` × 4, `compareVersions`, `getCurrentHash`).
  - Re-throws `ProcessContextDenied` from 4 swallow-everything `catch` blocks (`getHistory`, `getVersionContent`, `rollback`, `compareVersions`, `getCurrentHash`) per Lesson #10427 (security denials are load-bearing). The fault-tolerant semantics (untracked-skill returns `[]`; rollback returns `{success: false}`) preserved for non-security errors.
- **MODIFIED** `src/learning/version-manager.test.ts`:
  - Added `import { type ProcessContext, ProcessContextDenied, NULL_PROCESS_AUDIT_SINK }` from `../security/process-context.js`.
  - Added new `describe('ProcessContext wire (v1.49.870)')` block with 3 test cases: constructor preserves default callers; ctx audit sink records when threaded (source + target match expected); empty allow-list denies and `ProcessContextDenied` propagates from `getHistory`.
- **MODIFIED** `src/security/process-context-audit.test.ts`:
  - Removed `'src/learning/version-manager.ts'` from `KNOWN_UNWIRED` (was line 102; entry was bare 'src/learning/version-manager.ts' between learn/acquirer.ts and mesh/mesh-worktree.ts comments).
  - Added v1.49.870 block comment documenting the wire (constructor ctx? + internal-helper hoist + #10427 re-throw + test coverage).
  - KNOWN_UNWIRED Process: **6 → 5**.

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| `src/learning/version-manager.test.ts` | +3 cases (14/14 PASS) | Wire verification: default-permissive + audit threading + denial propagation |
| `src/security/process-context-audit.test.ts` | 2051 PASS (no count change) | Allowlist count drops 6 → 5; inverse-audit invariants preserved |

`node tools/security/check-stale-known-unwired.mjs` reports `ProcessContext (KNOWN_UNWIRED: 5) clean` (was 6).

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — **88 consecutive ships at 1.178**; was 87 entering this ship).
Counter-cadence count UNCHANGED at 6.

Manifest entries: **23 → 23** (UNCHANGED — chip wires apply existing #10433 pattern).
Lessons in manifest (unique): **85 → 85** (UNCHANGED).
Wired calibratable thresholds: **5 of 7** (UNCHANGED).
**KNOWN_UNWIRED Process: 6 → 5** (-1, -17%). Egress: **6** (UNCHANGED).
UNCODIFIED: **39 ≤ ceiling 41** (UNCHANGED).
Operational axes: **4** (UNCHANGED; chips are codify-axis consumption per #10428).

## What this ship is not

- Not a NASA degree advance (still 1.178; now 88 consecutive ships).
- Not a new discipline domain (manifest stays at 23 entries).
- Not a counter-cadence ship (counter-cadence count unchanged at 6).
- Not a doc-only ship (the wire is in `src/`; the cross-audit gate runs at pre-tag-gate).

## Wire shape: internal-helper (#10433 application)

The `git()` helper wraps 7 different git commands. The internal-helper pattern means a single `ensureProcessAllowed` at the helper site protects all 7 callers — DRY at the security boundary. The full shell command string is passed as `argv[1]` (`['-c', command]`) so the audit record captures `op='exec'` + `target='sh'` + the actual command in argv. This is the canonical wire for files where N>1 spawn sites share an internal helper.

Per #10427, the swallow-everything catches in 4 service methods were updated to re-throw `ProcessContextDenied` before falling through to their existing recovery branches. Security denials are load-bearing; non-security errors retain the original fault-tolerant semantics.

## Verification

- `npx vitest run src/learning/version-manager.test.ts` → 14/14 PASS (11 existing + 3 new).
- `npx vitest run src/security/process-context-audit.test.ts` → 2051 PASS.
- `node tools/security/check-stale-known-unwired.mjs` → exit 0; ProcessContext entryCount 5 (was 6); EgressContext entryCount 6 (UNCHANGED).
- `npm run build` → PASS.
- `bash tools/pre-tag-gate.sh` → 18/18 PASS (step 18 KNOWN_UNWIRED stale-entry cross-audit clean post-wire).

## Forward path post-v870

Remaining v868-v882 campaign:
- **v1.49.871** — Process chip #2: `src/git/workflows/contribute.ts` (183 LOC).
- v1.49.872-875 — Process chips #3-#6: pic2html (311) → gates/pre-flight (363) → learn/acquirer (509) → harness-integrity (1440).
- v1.49.876-881 — Egress chips ×6 (size-ascending).
- v1.49.882 — Verify-overdue forecast scan tool.

Other open items (carry-forward):
- NASA 1.179 forward-cadence — 88 consecutive ships at 1.178 entering v870 (89 at close); pressure margin record extended by 3 across the campaign.
- T2.1 v1.50 unblock-or-archive decision (operator-bounded).
