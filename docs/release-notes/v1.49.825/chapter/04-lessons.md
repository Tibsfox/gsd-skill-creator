# v1.49.825 — Lessons

## New lesson candidates (0)

No new lesson candidates opened this ship. Chip ships applying an existing pattern (#10433) typically don't generate new candidates unless the pattern's shape needs refinement. The 3-file batch matched #10433's prediction band cleanly; no anomalies surfaced.

## Forward-test of existing lessons

### #10433 — Internal-helper pattern for `ctx?` threading

**Status:** CALIBRATED. The codification at v824 predicted ~14-20 LOC per file with internal helper. Actual measurements:

- repo-manager.ts: ~22 LOC (16 callsites — slightly above band)
- state-machine.ts: ~18 LOC (7 callsites — within band)
- sync-manager.ts: ~22 LOC (11 callsites — slightly above band)

Forward observation: the ~14-20 LOC prediction was anchored at v820's branch-manager.ts (10 callsites). Files with more callsites trend slightly higher (~22 LOC at 11-16 callsites). The pattern's wall-clock cost is sub-linear in callsite count because most of the per-callsite cost is just adding `, ctx` to a function call.

Refinement candidate (1 instance): The LOC band could be calibrated by callsite count:
- 5-10 callsites → ~14-18 LOC
- 10-15 callsites → ~18-22 LOC
- 15+ callsites → ~22-26 LOC

Defer codification of this refinement until 1-2 more files validate it. Below 2-instance threshold per #10426.

### #10432 — KNOWN_UNWIRED ledger discipline

**Status:** REAFFIRMED. The 3-file batch chip ratchets `KNOWN_UNWIRED` Process: 31 → 28. Per-ship release-notes record `KNOWN_UNWIRED N → N-K` (here: 31 → 28). The v811 block-comment consolidation observation (consolidate per-family comment when N-of-N siblings are wired) was applied — the v820 forward-note "remaining 3: repo-manager, state-machine, sync-manager — future batch" is replaced with a 4-line completion comment marking the `git/core` family as fully wired (4 of 4 entries).

### #10434 — Ratchet-ledger pattern (KNOWN_UNWIRED generalization)

**Status:** ORTHOGONAL — not exercised this ship. The chokepoint KNOWN_UNWIRED is the pattern's original instance (chokepoint context). The v821 discipline-coverage ceiling is the generalized instance. This ship operates on the original instance only.

### #10427 — Failure-mode contracts (load-bearing chokepoint denials)

**Status:** PATTERN-COMPLIANT. All 3 files hoist `ensureProcessAllowed` at the FUNCTION ROOT of the internal helper (not inside try/catch). The one near-trap was sync-manager's `getConflictFiles`: the function itself has a try/catch that swallows on error, but the `execGit` call within `getConflictFiles` is at the function root, so the chokepoint denial would propagate cleanly.

## Tentative observations carried forward

- LOC-band-by-callsite-count refinement for #10433 (1 instance, defer until 2nd).
- `git/core` family closure at exactly the v820-predicted 4-entry size (1 instance of an "audit grep predicted family size correctly" observation; defer).
- 3-file batch wall-clock approximately equals 1-file ship wall-clock for v820 (~25-30 min) when files are structurally homogeneous (1 instance; defer).

## Cadence observation

This is a consume-axis ship (chips KNOWN_UNWIRED) immediately following a calibrate-axis ship (v824 codification). The v824 → v825 transition validates the codification by APPLYING it; the LOC prediction holds; the pattern is now load-bearing forward.

Per #10428 meta-cadence, consume-axis ships are at the upper end of their cadence (≤6 ships from substrate to first non-test caller — chokepoints have been in 3 ships across v820, v819, v825, all consuming). This is within the cadence rule.
