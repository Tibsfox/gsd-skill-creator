# v1.49.834 — ProcessContext Stale-Entry Cleanup (`intelligence/analyzer/git.ts`)

**Released:** 2026-05-27

## What shipped

First **stale-entry cleanup chip** in the ProcessContext family. Removes `src/intelligence/analyzer/git.ts` from `KNOWN_UNWIRED` in `src/security/process-context-audit.test.ts`. File was fully wired at v1.49.812 (calls `ensureProcessAllowed` hoisted outside the swallow-catch per #10427); v812 missed the allowlist edit, leaving a silent double-protected entry for ~22 milestones.

KNOWN_UNWIRED Process: **23 → 22** (actual count; aligns with the count-claim that's been quoted in release notes since v828).

## Why this ship

Recon for the post-v833 ProcessContext singleton chip surfaced an anomaly: `git.ts` is listed in `KNOWN_UNWIRED` but already calls `ensureProcessAllowed`. The audit short-circuits on `KNOWN_UNWIRED.has(label)` before checking the actual wire, so the entry was silently grandfathered with an already-satisfied wire.

`docs/known-unwired-ledger-discipline.md` predicted this exact failure mode at v814:

> a wired file can carry a stale KNOWN_UNWIRED entry indefinitely without test failure. … Flagged at v812 retrospective. Not urgent — the per-ship release-notes discipline catches it manually at chip cadence.

v834 is that catch.

## Surface delta

- 1 MODIFIED file: `src/security/process-context-audit.test.ts` (1 line removed + 7-line comment added)
- 1 MODIFIED file: `.planning/PROJECT.md` (pre-bump refresh)
- 0 NEW files
- 0 NEW tests
- 0 src/ source-code changes (allowlist edit is in a test file)

## Manifest state

| Field | Before | After |
|---|---|---|
| Manifest entries | 23 | 23 (UNCHANGED) |
| Lessons in manifest | 77 | 77 (UNCHANGED) |
| UNCODIFIED lessons | 39 | 39 (UNCHANGED) |
| KNOWN_UNWIRED Process | 23 (actual) | 22 (actual) |
| KNOWN_UNWIRED Egress | 11 | 11 (UNCHANGED) |
| Tests | 35,235+ | 35,235+ (UNCHANGED) |

## Engine state

NASA degree at **1.178** (UNCHANGED — **52 consecutive ships at 1.178**, new widest pressure margin record).
Counter-cadence count UNCHANGED at 6.
Wired calibratable thresholds: 6 of 6 (UNCHANGED).

## Forward path

Pairs thematically with v1.49.835 lowConfidenceThreshold calibration scaffold (next ship this session): both close silent gaps that the audit/calibration framework didn't enforce. NASA 1.179 forward-cadence remains the strongest-default forward path; this ship doesn't unblock or change that.
