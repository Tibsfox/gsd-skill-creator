# v1.49.838 — Audit Inverse-Check (Stale-Entry Detector)

**Released:** 2026-05-27

## What shipped

Closes the v834-flagged unidirectional asymmetry in the chokepoint audit tests. `KNOWN_UNWIRED` entries that have been silently wired (file calls `ensure*Allowed()` but allowlist entry is stale) now fail the audit deterministically.

- **MODIFIED** `src/security/process-context-audit.test.ts` (+1 `it` block, ~25 LOC): inverse-check asserts no `KNOWN_UNWIRED` entry calls `ensureProcessAllowed`.
- **MODIFIED** `src/security/egress-context-audit.test.ts` (+1 `it` block, ~25 LOC): same pattern for `ensureEgressAllowed`.
- **NOT MODIFIED** `src/security/loader-context-audit.test.ts` — no `KNOWN_UNWIRED` set; inverse-check N/A.

## Why this ship

v834's case study (`intelligence/analyzer/git.ts` was wired at v812 but allowlist entry stayed for 22 ships) is now caught deterministically by the gate. The audit was previously unidirectional (catches missing wires; silently allows stale entries). v838 makes it bidirectional.

Forward-flagged in v834's release notes AND in `docs/known-unwired-ledger-discipline.md` (the v814 discipline doc explicitly said "inverse check is a future enhancement").

## Engine state

NASA 1.178 (**56 consecutive** — widest pressure margin record again). Counter-cadence 6. Manifest 23 / lessons 77. UNCODIFIED 39 ≤ 41. KNOWN_UNWIRED Process 22 / Egress 11 (UNCHANGED; both inverse-checks confirm clean state).

## Tests

+2 net tests (35,257 → 35,259). All audit-test runs PASS (4118 across the 3 files).

## Predecessor

v837 (lowConfidenceThreshold observation source wired) — second of the 4-ship sequence. v838 is third.
