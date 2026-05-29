# v1.49.882 — Verify-overdue forecast scan tool (campaign CLOSE)

**Released:** 2026-05-28

## Why this ship

Campaign close. Last of 15 ships in the v868-v882 follow-on campaign. New tool converts the #10428 verify-axis trigger guidance ("each calibratable threshold should have an integration test within 10 ships of being wired") from prose into a deterministic runtime check.

## What's in this ship

- NEW `tools/calibratable/verify-overdue-scan.mjs` (~210 LOC).
- Hand-curated manifest of 7 CalibratableThreshold entries with wire-ship + test-ship metadata.
- Human + JSON output modes; exit 0 if all within budget.
- NEW `tests/calibratable/verify-overdue-scan.test.ts` (3 cases).

## Campaign summary

15 ships, both chokepoints fully wired, NASA 1.178 across 100 consecutive ships, 6 promotion-eligible candidates for next codify.

## Engine state

NASA degree 1.178 (UNCHANGED — 100 consecutive ships).
Counter-cadence 6 (UNCHANGED). Manifest 23 / Lessons 85 (UNCHANGED).
**KNOWN_UNWIRED Process: 0.** **KNOWN_UNWIRED Egress: 0.** Both chokepoints fully wired.
UNCODIFIED 39 ≤ 41 (UNCHANGED).
