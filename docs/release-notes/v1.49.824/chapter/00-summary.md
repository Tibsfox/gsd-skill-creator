# v1.49.824 — Codification Ship: Promote #10433 + #10434

**Released:** 2026-05-27

## Why this ship

Codification ship per #10428 meta-cadence (~7-10 forward ships per codify cadence). Last codify ship was v1.49.814; this is 10 ships later — at the upper bound of the cadence. The v816-823 chain accumulated ~13-16 tentative observations; this ship promotes 2 of them (the strongest, at 2-instance threshold per #10426).

## The 2 lessons

### #10433 — Internal-helper pattern for `ctx?` threading

When a file already wraps the side-effecting op (spawn, fetch, read) in an internal helper, threading `ctx?: <Context>` through the helper costs `1 LOC + helper-update`. Files without a helper need N `ensure*Allowed` hoists at N call sites.

Evidence: v1.49.809 wired `src/intelligence/analyzer/git.ts` (via `execGit` helper); v1.49.820 wired `src/git/core/branch-manager.ts` (via its own `execGit` helper). Same shape, same LOC delta (~14 LOC) across 2 instances.

Codified into `docs/security-chokepoints.md` as a new section between "How to migrate" and "Anti-patterns". Includes batch-chip planning implications.

### #10434 — Ratchet-ledger pattern (KNOWN_UNWIRED generalization)

The KNOWN_UNWIRED shape — a named, visible, ratcheted ledger of out-of-conformance entries that an enforcement gate consults — is NOT chokepoint-specific. The same structural pattern (current-state count, ceiling threshold, per-ship ratchet, default-BLOCK with opt-out) works for any cross-cutting observability+enforcement surface.

Evidence: v1.49.806 introduced the chokepoint KNOWN_UNWIRED pattern (38 process + 16 egress entries). v1.49.821 + v1.49.822 introduced the discipline-coverage ceiling — same shape applied to per-discipline UNCODIFIED counts (current 39, ceiling 41, default-BLOCK with `SC_DISCIPLINE_COVERAGE_CEILING` env opt-out).

Codified into `docs/known-unwired-ledger-discipline.md` as a new "Generalization beyond chokepoints" section under "Forward observations". Includes side-by-side comparison table + when-to-reach + anti-generalization cases.

## Surface delta

- 2 canonical-doc extensions (security-chokepoints.md + known-unwired-ledger-discipline.md)
- 2 manifest entry extensions in disciplines.json (Security chokepoints + KNOWN_UNWIRED)
- CLAUDE.md regenerated
- 0 source-code changes
- 0 new tests

## Manifest state

| Field | Before | After |
|---|---|---|
| Manifest entries (discipline domains) | 22 | 22 |
| Lessons in manifest | 75 | 77 |
| Open lesson candidate backlog | 0 | 0 |
| Tentative observations carried forward | ~13-16 | ~11-14 |

## Engine state

NASA degree at **1.178** (UNCHANGED — 42 consecutive ships at 1.178; was 41 entering this ship).
Counter-cadence count UNCHANGED at 6.
KNOWN_UNWIRED Process UNCHANGED at 31 (v825 chips it).
KNOWN_UNWIRED Egress UNCHANGED at 11.
Wired calibratable thresholds: 5 of 6 (UNCHANGED).
