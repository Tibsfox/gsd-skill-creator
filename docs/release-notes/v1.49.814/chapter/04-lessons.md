# v1.49.814 — Lessons

## Newly promoted lessons (2)

### #10431 — Two-layer closure for procedure-rooted drift

**Rule:** When a drift class originates from operator-discretion procedure
(multi-step sequence the operator must remember to execute correctly),
complete closure requires BOTH a source eliminator (deterministic tool
replacing the operator-discretion step + post-condition check) AND a
detector gate (structural check catching bypass). Either layer alone is
insufficient.

**Provenance:** v807+v813 STATE.md drift closure case study, originally
flagged as tentative observation in v806 ("STATE.md normalizer drift
recurrence — v807 closed the regression-detector part; post-T14-reset class
remains under observation").

**Severity:** MEDIUM. Applies at every counter-cadence ship targeting a
procedure-rooted drift class. Skipping the discipline produces partial
closures that are easy to mistake for complete closures.

**Anchor:** `docs/two-layer-closure-discipline.md` (new this ship; ~170 lines).

### #10432 — KNOWN_UNWIRED allowlists as migration-debt ledger

**Rule:** When a chokepoint or cross-cutting audit-test is introduced into a
mature codebase, it MUST grandfather existing call sites via a named
allowlist in the audit-test itself. The allowlist is debt-not-exemption;
chips ratchet it toward zero. Per-ship release notes record
`<surface> KNOWN_UNWIRED N → N-K`. The audit-test is itself an observability
surface — the allowlist count is the migration progress metric.

**Provenance:** v806 introduction (16 egress + 38 process initial entries) +
v809 first egress chip (16 → 15) + v811 batch egress chip (15 → 11) + v812
first process chip (38 → 37). Four well-separated instances by chain close.

**Severity:** LOW. Applies at every cross-cutting audit-test introduction
+ every chip ship. Skipping the discipline produces ad-hoc grandfathering
mechanisms that drift from the established pattern.

**Anchor:** `docs/known-unwired-ledger-discipline.md` (new this ship; ~170 lines).

## Lessons applied (no others promoted this ship)

| # | Lesson | Application |
|---|---|---|
| #10412 | Recon-first per file | Read the 4 carry-forward + chain tentative observations + 20 existing disciplines.json entries + 2 sample `docs/*-discipline.md` files BEFORE writing the 2 new docs. Recon caught: (a) v813 STATE.md closure is the load-bearing case study for #10431; (b) v806/v809/v811/v812 are 4 well-separated KNOWN_UNWIRED instances supporting #10432; (c) existing discipline docs have a consistent shape worth mirroring. |
| #10414 | Gate-not-vigilance | Both new disciplines apply gate-not-vigilance at structural levels: #10431 at the procedure-class level (replace operator-discretion with deterministic tool), #10432 at the audit-progress-visibility level (allowlist count is the deterministic debt counter). |
| #10416 | Tolerant-generator / lightest wire | Resisted: promoting all 8 carry-forward observations (premature for the 6 with <2 instances); writing a meta-discipline on tentative-observation promotion (no 2nd case study yet); refactoring 20 existing disciplines to cross-reference new ones (no concrete cross-ref need). Chose: 2 new docs + 2 manifest entries + 1 CLAUDE.md regenerate. |
| #10428 | Meta-cadence — codify axis | THE central application. This ship is the codify-axis investment after 9 ships since v805 (within the ~7-10-ship spacing). The 5-1-1 alternation micro-cadence emerged from the v810-814 chain (3 forward + 1 counter-cadence + 1 codify) without explicit planning — the discipline is robust to chain-shape variation. |
| #10430 | 5-1-1 alternation | Cycle complete: v810 + v811 + v812 (3 forward) + v813 (1 counter-cadence) + v814 (1 codify) = exactly 5-1-1. The chain's wall-clock distribution (~25-45 min per ship across the 5) confirms the discipline holds within a single session window. |

## Tentative observations carried forward (~6 — 2 promoted this ship + ~6 new from chain merged or below-threshold)

### Carried forward from v807-809 handoff (unchanged)

| ID | Severity | Status |
|---|---|---|
| (tentative) watch-loop tear-down race | NOTE | carry forward (1 instance) |
| (tentative) chained-session architectural-tax break-even | NOTE | carry forward (1 chain) |
| (tentative) registry-abstraction cross-chain payoff | NOTE | carry forward (supporting #10426) |
| (tentative v804) 6th-mode-flag refactor trigger | NOTE | carry forward (1 trajectory) |
| (tentative v805) codification-ship pattern at 4 instances | NOTE | carry forward (4→5 instances; promote at 5th — this ship makes it 5; **eligible for promotion in next codify ship**) |
| (tentative v806) Chokepoint pattern at 3 instances | NOTE | carry forward (re-evaluate at 4th — v812 made it 4 if you count first-chip-per-chokepoint; eligible for re-evaluation) |
| (tentative v807) STATE.md normalizer drift recurrence | NOTE | **PROMOTED this ship as #10431** |
| (tentative v807) KNOWN_UNWIRED allowlist as migration-debt ledger | NOTE | **PROMOTED this ship as #10432** |

### New observations from this chain (carried forward; below-threshold)

| Source | Observation | Status |
|---|---|---|
| v810 | Recon doc name-drift across ~1 day | carry forward (1 instance) |
| v810 | Two-layer default-off contract structurally cleaner than one-layer | carry forward (1 instance) |
| v811 | Post-infrastructure chip cadence ~2× faster than substrate-introducing | carry forward (~2 data points; promote at 3rd) |
| v811 | Block-comment consolidation when N-of-N siblings wired | carry forward (1 instance) |
| v812 | Audit-test KNOWN_UNWIRED unidirectional enforcement shape | **action item: future audit enhancement (not a promotion candidate)** |
| v812 | `instanceof *ContextDenied` check pattern at 2 instances | covered by #10426 + #10432 (not a separate promotion) |
| v813 | `node_modules` symlink pattern for tmpdir-isolated CLI tests | carry forward (1 instance) |

### Cross-promotion candidates surfaced at this ship's audit

| Carry-forward observation | Status |
|---|---|
| **codification-ship pattern at 4 instances** (now 5 after this ship) | **Eligible for promotion in next codify ship per v805 threshold** |
| **Chokepoint pattern at 3 instances** (now 4 if first-chip-per-chokepoint counted) | **Eligible for re-evaluation in next codify ship** |

Both of these were flagged in earlier handoffs as "promote at N+1 instance." This ship satisfies the N+1 threshold for both. Out of scope this ship per #10416 (would be promoting 4 lessons total = too large for one codification ship; better split across 2 codify ships per #10428's spacing).

## Cross-references

- #10412 + #10428 → recon-first sized this codify ship at 2 promotions (not 8 carry-forward × promote-all)
- #10414 + #10431 → two-layer closure is gate-not-vigilance for procedure-rooted drift specifically
- #10416 + #10428 → codify-axis ship resists multi-promotion temptation per spacing discipline
- #10422 + #10432 → KNOWN_UNWIRED is verdict-pattern surface separation: enforcement (audit-test) separate from decision (per-chip operator judgment)
- #10426 + #10432 → KNOWN_UNWIRED was itself a 3-instance pattern at v806 (LoaderContext + EgressContext + ProcessContext), motivating its #10432 codification
- #10427 + #10431 → both layers of two-layer closure must specify their failure modes loudly
- #10428 + #10430 → meta-cadence + 5-1-1 alternation cycle complete this chain

## What this ship illustrates about the codify-axis cadence

The chain produced its own codification evidence as a side-effect of the consume-axis ships. This is the meta-pattern that #10428 anticipates:
- Codify ships convert past consume-axis evidence into discipline
- Consume-axis ships generate new evidence for future codify
- The 5-1-1 alternation per #10430 ensures both axes get cadence

If a future chain produces fewer-than-expected codification candidates, this is signal that the consume-axis ships were too narrow OR that the carry-forward observations weren't being maintained between ships. The carry-forward count (currently ~8-10) is a useful tripwire: if it drops to 0, codify ships have nothing to do; if it climbs above ~15, codify ships are overdue.
