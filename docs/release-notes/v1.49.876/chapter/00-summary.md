# v1.49.876 — EgressContext singleton chip: `src/aminet/package-fetcher.ts`

**Released:** 2026-05-28

## Why this ship

Track 5 chip #1. Opens the Egress chip cluster after Track 4 close. Size-ascending picks package-fetcher.ts (177 LOC). Wire shape: two-site hoisted-check — same shape as v867 fork-finder. Two fetch sites (lha + readme) → two hoists.

## What's in this ship

- Wire shape: two-site hoisted-check (#10444 catalog).
- #10427: 1 re-throw in mirror-aggregation catch + 1 hoist-outside-result-wrapping catch in fetchReadme.
- 3 new test cases verifying ctx threading + denial + audit recording.

## Engine state

NASA degree 1.178 (UNCHANGED — 94 consecutive ships).
Counter-cadence 6 (UNCHANGED). Manifest 23 / Lessons 85 (UNCHANGED).
**KNOWN_UNWIRED Egress: 6 → 5.** Process: 0 (UNCHANGED — Track 4 close).
UNCODIFIED 39 ≤ 41 (UNCHANGED).
