# v1.49.878 — EgressContext singleton chip: `src/chips/anthropic-chip.ts`

**Released:** 2026-05-28

## Why this ship

Track 5 chip #3. Size-ascending picks anthropic-chip.ts (247 LOC). First class-based Egress wire: ctx stored on instance; chat() + health() each hoist at their respective fetches.

## What's in this ship

- Wire shape: class-instance two-site hoisted-check.
- #10427: 1 re-throw (health() result-wrapping catch).
- +3 test cases verifying denial + audit threading + permissive behavior.

## Engine state

NASA degree 1.178 (UNCHANGED — 96 consecutive ships).
Counter-cadence 6, Manifest 23, Lessons 85 (UNCHANGED).
**KNOWN_UNWIRED Egress: 4 → 3.** Process: 0 (UNCHANGED).
UNCODIFIED 39 ≤ 41 (UNCHANGED).
