> Following v1.49.881 — _EgressContext singleton chip: src/intelligence/ipc.ts (Track 5 CLOSE)_, v1.49.882 is the **fifteenth and final ship of the v868-v882 follow-on campaign** — the **campaign-close verify-overdue forecast scan tool**. New tool at `tools/calibratable/verify-overdue-scan.mjs` enumerates CalibratableThreshold members and flags those past the 10-ship verify-axis trigger per #10428 meta-cadence discipline. Converts the verify-axis trigger guidance from prose into a deterministic runtime check.

# v1.49.882 — Verify-overdue forecast scan tool (campaign CLOSE)

**Shipped:** 2026-05-28

Campaign close. **15/15 ships of v868-v882 campaign delivered clean.** The verify-overdue scan tool generalizes #10428's verify-axis trigger guidance into a runtime check operators can invoke ad-hoc (and that the next codify ship can integrate into pre-tag-gate per the precedent v869 set for the cross-audit tool).

## What shipped

- **NEW** `tools/calibratable/verify-overdue-scan.mjs` (~210 LOC):
  - Enumerates 7 CalibratableThreshold members from `src/bounded-learning/types.ts`.
  - Hand-curated `THRESHOLDS_MANIFEST` with per-threshold `wired_first_caller_ship` + `integration_test_ship` + notes.
  - Computes ship-count delta between wire-ship and current package.json version (or between wire-ship and integration-test-ship).
  - Reports per-threshold status: COVERED / PENDING-TEST / OVERDUE-NO-TEST / OVERDUE-TEST-LATE / UNWIRED.
  - Human-readable output by default; `--json` for machine consumption.
  - Exit 0 if no thresholds overdue; exit 1 if any.
- **NEW** `tests/calibratable/verify-overdue-scan.test.ts` (3 cases) — verifies clean run + JSON structure + per-entry shape.

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| `tests/calibratable/verify-overdue-scan.test.ts` | NEW; +3 cases | Verifies tool runs clean against current manifest + emits structured JSON + per-threshold fields valid |

`node tools/calibratable/verify-overdue-scan.mjs` at v882 reports: **5 COVERED + 2 UNWIRED + 0 overdue.** All wired thresholds within 10-ship verify-axis budget.

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — **100 consecutive ships at 1.178**; widest pressure margin record extended by 1).
Counter-cadence count UNCHANGED at 6. Manifest 23 / Lessons 85 / Wired thresholds 5 of 7 (UNCHANGED).
**KNOWN_UNWIRED Process: 0** (UNCHANGED — closed v875). **KNOWN_UNWIRED Egress: 0** (UNCHANGED — closed v881).
UNCODIFIED: 39 ≤ 41 (UNCHANGED).

## Campaign summary (v868-v882, 15 ships)

| Phase | Ships | Outcome |
|---|---|---|
| Codify (v868) | 1 | Promoted #10444; refined #10443 (continuous-verification mode). |
| Gate-integrate (v869) | 1 | Wired cross-audit tool as pre-tag-gate step 18/18. |
| Track 4 — Process chips (v870-v875) | 6 | KNOWN_UNWIRED Process 6→0. 5 distinct wire shapes. |
| Track 5 — Egress chips (v876-v881) | 6 | KNOWN_UNWIRED Egress 6→0. 5 distinct wire shapes (1 NEW: module-singleton). |
| Verify-scan (v882) | 1 | Tool enumerating CalibratableThreshold verify-axis status. |

**Both chokepoints (Process + Egress) fully wired across `src/`. NASA degree 1.178 across 100 consecutive ships (record extended by ~15 in this campaign).**

## Promotion-eligible candidates accumulated for next codify

1. **Module-singleton variant** (NEW; 1 instance v881). Promotion at 2nd instance.
2. **Spawn-site count as primary predictor** (refinement of #10444). 2 instances (v872 + v875).
3. **#10427 multi-catch helper** (~30 instances). Decisively codification-ready.
4. **Router-with-conditional-bypass** (refinement of #10444). 2 instances (v864 + v880).
5. **Shared-helper hoist with sub-variants** (refinement of #10444). 5+ distinct variants observed.
6. **Audit target accuracy: execFile vs shell-exec**. 2 instances.

Substantial codify backlog ready for a follow-up codify ship (~v883-885 window per #10428 cadence).

## What this ship is not

- Not a NASA degree advance (still 1.178; now 100 consecutive ships).
- Not a new discipline domain (manifest 23 entries).
- Not a counter-cadence ship.
- Not a chip wire (no KNOWN_UNWIRED change).

## Verification

- `node tools/calibratable/verify-overdue-scan.mjs` → 5 COVERED, 2 UNWIRED, 0 overdue (exit 0).
- `node tools/calibratable/verify-overdue-scan.mjs --json` → structured JSON, clean=true.
- `npx vitest run tests/calibratable/verify-overdue-scan.test.ts` → 3/3 PASS.
- `bash tools/pre-tag-gate.sh` → 18/18 PASS.

## Forward path post-v882

**Campaign closed.** Open items:

- **NASA 1.179 forward-cadence** — 100 consecutive ships at 1.178 entering v882 close. Strong default for next session.
- **Post-campaign codify ship** — ~6 promotion-eligible candidates accumulated; promote at next codify ship per #10428 cadence (~v883-887 window).
- **pre-tag-gate integration of verify-overdue-scan** — promotes the new tool to an automatic gate (precedent: v869's promotion of v857 cross-audit tool to step 18/18). 1-2 ship effort.
- **T2.1 v1.50 unblock-or-archive decision** (operator-bounded).
