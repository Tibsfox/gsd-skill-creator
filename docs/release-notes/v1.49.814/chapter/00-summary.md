# v1.49.814 — Codification Ship: Promote #10431 + #10432

**Released:** 2026-05-27
**Type:** codification ship (operational-debt promotion; pure documentation + manifest)
**Predecessor:** v1.49.813 — Post-T14-reset STATE.md Drift Closure: Atomic Writer Tool
**Engine state:** UNCHANGED (NASA degree sustains at 1.178); counter-cadence count UNCHANGED at 6
**Wedge:** apply #10428 meta-cadence codify-axis to the 8 carry-forward + ~8 new tentative observations from the v810-814 chain; promote those with clear evidence to ESTABLISHED status with canonical docs and manifest entries.

## Summary

Final ship of the v810-814 chain. Codification ship per #10428's ~7-10-ship codify-axis spacing trigger (last codification ship was v805, 9 ships ago).

Reviewed the 8 tentative observations carried forward in the v807-809 handoff + ~8 new observations flagged across this chain. Applied promotion criteria:
- **Number of instances** (need ≥2 well-separated instances)
- **Pattern clarity** (clear shape, not a one-off circumstance)
- **Forward applicability** (lesson would guide future ship decisions)
- **Distinction from existing lessons** (not already covered by an established lesson)

Two observations met the bar:

1. **STATE.md normalizer drift recurrence** (carry-forward from v806) → promoted to **#10431 — Two-layer closure for procedure-rooted drift**. The pattern is bigger than the specific STATE.md case: any procedure-rooted drift class requires both a source eliminator (deterministic tool replacing the operator-discretion step) and a detector gate (structural check catching bypass). The v807 + v813 ships are the case study.

2. **`KNOWN_UNWIRED` allowlist as migration-debt ledger** (carry-forward from v806; observed at v809, v811, v812 chip ships) → promoted to **#10432 — KNOWN_UNWIRED allowlists as migration-debt ledger**. Pattern is at 4 well-separated instances (introduction + 3 chip ships); applies to future cross-cutting audit-tests introduced on mature codebases.

The 8 new observations flagged across this chain (recon doc name-drift, two-layer default-off contract, etc.) either:
- Had only 1 instance (below threshold)
- Were already covered by an existing lesson (e.g., instanceof check pattern at 2 → already #10426 territory)
- Were observation-style rather than rule-style (e.g., post-infrastructure chip cadence ~2× faster)

So they carry forward unchanged or get folded into the existing manifest entries.

## Deliverables

| Path | Change | Notes |
|---|---|---|
| `docs/two-layer-closure-discipline.md` | NEW | ~170 lines. Rule + case study + when/how to apply + anti-patterns + cross-refs + forward observations. |
| `docs/known-unwired-ledger-discipline.md` | NEW | ~170 lines. Rule + case study + when/how to apply + anti-patterns + cross-refs + forward observations. |
| `tools/render-claude-md/disciplines.json` | MODIFIED | +2 entries (20 → 22). |
| `CLAUDE.md` | MODIFIED | Regenerated via `npm run render:claude-md`. Operative-disciplines section now lists 22. |

## Lessons applied (no new lesson IDs promoted via lesson-applied; #10431 + #10432 are the promotions)

| Lesson | Application |
|---|---|
| #10412 (recon-first) | Read the 4 carry-forward + chain tentative observations + the existing 20 disciplines.json entries + the docs/lessons/*-discipline.md format BEFORE writing the 2 new docs. Recon caught: (a) the v813 STATE.md closure is the load-bearing case study for #10431; (b) the v806 KNOWN_UNWIRED introduction + v809/v811/v812 chip ships are 4 well-separated instances supporting #10432; (c) the existing discipline docs follow a consistent shape (Rule + Case study + When/How + Anti-patterns + Cross-references + Forward observations) — mirror it. |
| #10414 (gate-not-vigilance) | The new #10431 discipline is gate-not-vigilance applied at the procedure level. The new #10432 discipline is gate-not-vigilance applied to the migration-progress visibility (the allowlist count IS the debt counter). |
| #10416 (lightest wire) | Resisted: promoting all 8 carry-forward observations (premature for the 6 with <2 instances); writing a meta-discipline ("how to promote tentative observations") that doesn't yet have 2 case studies; refactoring the existing 20 disciplines.json entries to cross-reference the 2 new ones (no concrete cross-ref need yet — the new docs link the existing lessons). Chose: 2 new docs + 2 manifest entries + 1 CLAUDE.md regenerate. |
| #10428 (meta-cadence — codify axis) | THE central application. This ship is the codify-axis investment after 9 ships since v805 (last codify ship). Per #10428's ~7-10-ship spacing, the cadence-overdue check fired this ship, and the operator NAMED the codify axis as the proposed counter-cadence target. The micro-cadence per #10430 was: 3 forward (v810 + v811 + v812) + 1 counter-cadence (v813) + 1 codification (this ship). |
| #10430 (5-1-1 alternation) | The v810-814 chain shape IS the 5-1-1 alternation in action. This ship is the +1 codify part of the cycle. |

## What this ship is not

- Not a NASA degree advance.
- Not a chokepoint chip or substrate-consumer wire.
- Not a refactor of the existing 20 disciplines (they remain unchanged).
- Not a backfill of past retrospectives. The 2 new lessons take effect going forward; past retrospectives are not annotated.

## Verification

- `npm run render:claude-md` → CLAUDE.md updated cleanly.
- `npm run build` → PASS (no source code touched).
- `bash tools/pre-tag-gate.sh` → all 17 steps PASS.
- `node tools/render-claude-md.mjs` → confirms the JSON manifest parses cleanly.

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — 32 consecutive ships at 1.178). Counter-cadence count UNCHANGED at 6 (codification ships are not counter-cadence per #10430's tri-cycle: 5 forward + 1 counter-cadence + 1 codify).

Manifest entries: **20 → 22** (+2: Two-layer closure for procedure-rooted drift; KNOWN_UNWIRED allowlists as migration-debt ledger).
Open lesson candidate backlog: **0** (UNCHANGED).
Tentative observations carried forward: ~6-8 (depending on whether the 8 new this-chain observations are tallied separately or merged with the carry-forward set).

## Chain closure summary

| Ship | Type | Wedge | Wall-clock |
|---|---|---|---|
| v1.49.810 | substrate-consumer wire | T1.3 Option A: gnn-predictor into copper activation | ~35 min |
| v1.49.811 | batch chip | 4 sibling registry adapters (cargo + conda + pypi + rubygems) | ~25 min |
| v1.49.812 | first chip (new family) | intelligence/analyzer/git.ts through ProcessContext | ~30 min |
| v1.49.813 | counter-cadence | Atomic-writer tool (state-md-set-shipped.mjs); STATE.md drift class structurally closed | ~40 min |
| **v1.49.814** | **codification** | **Promote #10431 + #10432; +2 manifest entries; regenerate CLAUDE.md** | **~45 min** |

Chain cumulative wall-clock at v814 close: ~175 min (~3 hours).

## Forward path

- **Batch chip aminet family ProcessContext** (5 files) — apply v811 batch pattern to ProcessContext.
- **NASA 1.179 forward-cadence** — 32 consecutive at 1.178; most visible open item.
- **PROJECT.md hand-edit drift atomic-writer** (~30 min) — apply #10431 to a 2nd procedure-rooted drift class.
- **T1.3 Ship 2 = Option B** — ObservationBridge wire (next T1.3 phase).
- **First git/core ProcessContext chip** — 4-entry family.
