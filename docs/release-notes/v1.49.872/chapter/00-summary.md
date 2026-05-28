# v1.49.872 — ProcessContext singleton chip: `src/cli/commands/pic2html.ts`

**Released:** 2026-05-28

## Why this ship

Track 4 chip #3. Size-ascending picks pic2html (311 LOC) after v871's contribute.ts (183 LOC). First chip in the mid-LOC band (#10444 catalog predicts hoist-at-top, hoist-outside-Promise, or closure-capture); pic2html chose hoist-at-top because it has only N=1 spawn site.

## What's in this ship

- **Wire shape:** hoist-at-top (#10444 catalog canonical for N=1 spawn site).
- **#10427 application:** none needed — no swallow-everything catch around the spawn; ProcessContextDenied propagates naturally.
- **New per-file test surface:** 2 cases using fake-PNG fixture pattern; first test file for pic2html.

## Engine state

NASA degree 1.178 (UNCHANGED — 90 consecutive ships).
Counter-cadence count 6 (UNCHANGED).
Manifest entries 23 (UNCHANGED). Lessons 85 (UNCHANGED).
KNOWN_UNWIRED Process: 4 → 3. Egress: 6 (UNCHANGED).
Wired calibratable thresholds: 5 of 7 (UNCHANGED).
UNCODIFIED 39 ≤ 41 (UNCHANGED).
