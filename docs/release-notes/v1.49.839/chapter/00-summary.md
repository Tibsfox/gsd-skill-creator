# v1.49.839 — ProcessContext Singleton Chip: `intelligence/analyzer/findings/stalled.ts`

**Released:** 2026-05-27

## What shipped

Closes the 4-ship operational-debt session by wiring `src/intelligence/analyzer/findings/stalled.ts` through the ProcessContext chokepoint. Canonical forensic-surface wire shape per Lesson #10427:

- **MODIFIED** `src/intelligence/analyzer/findings/stalled.ts` (~18 LOC): adds optional `ctx?: ProcessContext` parameter; hoists `ensureProcessAllowed` OUTSIDE the swallow-everything try/catch around `execFile` (load-bearing security denials propagate; forensic-surface git-availability errors stay silently swallowed).
- **MODIFIED** `src/security/process-context-audit.test.ts`: removes the file from `KNOWN_UNWIRED` (-1).

## Why this ship

Singleton chip from the v834-835 handoff's "next obvious chip targets" list. The wire follows v812's pattern for `intelligence/analyzer/git.ts` exactly. Internal-helper pattern (#10433) applies: `hasRecentGitActivity` already wraps the side-effecting `execFileAsync`, so threading `ctx?` through the helper is 1 LOC × 2 callsites.

## Engine state

NASA 1.178 (**57 consecutive** — widest pressure margin record again). Counter-cadence 6. Manifest 23 / lessons 77. UNCODIFIED 39 ≤ 41.

KNOWN_UNWIRED Process: **22 → 21**. Egress: 11 (UNCHANGED).

## Tests

Existing 4 stalled tests + 2050 process-context audit-test enumeration: all PASS. Full suite 35,259 (UNCHANGED — wire ship, no new tests).

## Predecessor

v838 (audit inverse-check). Final ship of the 4-ship session (publish-investigation → fallbackProvider wire → audit-inverse-check → ProcessContext chip).
