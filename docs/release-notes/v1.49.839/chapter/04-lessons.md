# v1.49.839 — Lessons

## New lesson candidates: none

v839 is a clean wire ship. No new observations rose to candidate status.

## Forward-test of existing lessons

### #10433 — LOC-band-by-callsite-count refinement

**Status:** RESPECTED + INSTANCE-COUNT INCREMENTED. v839 is the 4th instance (after v825 + v827 + v828). The wire's LOC-band falls cleanly on the lower end: 1 LOC × 2 callsites (internal-helper pattern). The discipline's three-instance ESTABLISHED status from the v824 codify ship sustains.

### #10427 — Failure-mode contracts

**Status:** RESPECTED. The new wire is the canonical forensic-vs-load-bearing pattern in action:
- Forensic surface (does not propagate): `execFileAsync` failures (git unavailable, exec timeout). Try/catch swallows.
- Load-bearing surface (must propagate): `ProcessContextDenied` from `ensureProcessAllowed`. Hoisted OUTSIDE the try/catch.

The JSDoc on `hasRecentGitActivity` documents this decision directly. Future readers of the code see the contract without having to look up the lesson number.

### #10434 — Cross-cutting observability+enforcement surface (KNOWN_UNWIRED ledger discipline)

**Status:** RESPECTED + RATCHETED. KNOWN_UNWIRED Process: 22 → 21 (one fewer entry). The discipline's "ratchet downward" property is sustained. The v838-installed inverse-check fires + passes at v839 ship time (no stale entries).

### #10416 — Lightest wire

**Status:** RESPECTED. 18 LOC code change for a complete wire (+ JSDoc + audit-test comment + KNOWN_UNWIRED removal). No refactor of unrelated code; no abstraction.

### #10422 — Ledger-driven work

**Status:** RESPECTED. Per-file recon:
1. Read v812's `intelligence/analyzer/git.ts` as template (mentioned in the file's own header doc).
2. Read `stalled.ts` to confirm the internal-helper pattern (`hasRecentGitActivity` wraps `execFileAsync`).
3. Read callers (`aggregator.ts` invokes `detectStalledMissions(kb, projectId, snapshotId)`; the new `ctx?` param defaults to undefined → legacy permissive; no caller update needed).
4. Read `process-context-audit.test.ts` to find the KNOWN_UNWIRED line + the comment block convention.
5. Implement + run tests; verify both audit forward + inverse checks PASS.

## Status of v838 lesson candidates

- **Bidirectional enforcement completeness** (1-2 instances): UNCHANGED.
- **Audit-inverse-check enhancement closed at v838:** v839 is the first ship where the v838 inverse-check operates. Confirmed working (no stale entries detected).

## Status of v837 lesson candidates

- **Polarity convention** (1 instance: v803 vs v837): UNCHANGED.

## Status of v836 lesson candidates

- **Two-layer closure generalization (#10431 sub-pattern)** (2 instances): UNCHANGED.
- **Auto-run-on-import as a hidden bootstrap-time tax** (1 instance): UNCHANGED.

## Status of v834-835 lesson candidates

- **Stale-entry cleanup chip pattern** (1 instance: v834): UNCHANGED.
- **Scaffold ship pattern** (1 instance: v835): UNCHANGED.
- **Paired arc** (1 arc): UNCHANGED. v836 + v837 + v838 + v839 form a SEQUENCE, not a paired arc — different shape.
- **Type-registered vs observation-source-wired vs runtime-wired** (1 forward-flag): UNCHANGED.
- **Audit-inverse-check enhancement** (CLOSED v838).

## Codify ship eligibility at v839 close

| Observation | Instances | Codify-eligible? |
|---|---|---|
| Two-layer closure generalization (#10431 sub-pattern) | 2 or 3 (v813 + v836 + [v838?]) | YES |
| Bidirectional enforcement completeness | 1-2 | DEFERRED (depends on classification) |
| Substrate-consumer hook PAIR pattern | 2 (v830 + v832) | YES (carryover) |
| `onPredictions` substrate-consumer wire | 2 (v810 + v826) | YES (carryover) |
| #10433 LOC-band-by-callsite-count refinement | 4 (v825 + v827 + v828 + v839) | YES (already ESTABLISHED at v824) |
| Verification/integration-only ships | 2 (v829 + v832) | YES (carryover) |

**5+ eligible patterns** at v839 close — same as v838. Codify cadence: 6 ships past last codify (v833) — within 7-10 ship floor. v840+ codify ship would pick up at least 3-4 of these.
