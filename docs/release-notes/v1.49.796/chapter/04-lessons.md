# 04 — Lessons Learned: v1.49.796 T1.1 Ship 2

## 0 candidates emitted; 0 promoted to ESTABLISHED

v796 is a clean extension within v795's scaffolding. No new design choices surfaced; no new traps caught; no lesson candidate emitted. The v795 candidate (#10425) is NOT promoted this ship — see promotion-path discussion below.

## Disciplines reinforced (no new IDs)

- **#10412 (Recon-first as default)** — 9th consecutive application since v784 codification. Read ship-1's full source surface + tests + CLI command + the schema + the live config BEFORE writing any code. Recon confirmed (a) the architecture is already threshold-agnostic at the primitive layer, (b) only `SUPPORTED_THRESHOLDS` hardcodes the whitelist, (c) the schema's `cooldown_days ∈ [1, 365]` constraint already matches `ABSOLUTE_FLOOR = 1` in the primitive. ~10 min recon → ~20 min implementation.
- **#10422 (Verdict-pattern surface separation)** — 6th forward application. The 4-line edit to `SUPPORTED_THRESHOLDS` is the entire production-code delta. Surface separation between primitive (no change) / CLI whitelist (one array edit) / docstring (three small refreshes) / tests (one new describe block in three files) means each surface evolves independently.
- **#10423 (Lightest wire that satisfies the verdict)** — 6th forward application. Resisted three temptations: (a) bundling the `FlagLookup` extract (still deferred), (b) generalizing `ABSOLUTE_FLOOR` to a per-threshold registry (the single value `1` works for both wired thresholds), (c) extracting a per-threshold semantic-direction registry (two thresholds with identical semantic mapping don't need a registry — the same accept→decrease / dismiss→increase works for both).
- **#10424 (newly ESTABLISHED at v794) — Adoption-refresh AFTER bump-version.** Applied: T14 step 11 ordering correctly places adoption-refresh after bump-version. Third consecutive ship under the active gate.

## #10425 promotion path discussion (NOT promoted this ship)

The v795 retrospective set the promotion path:

> Promotion to ESTABLISHED on either (a) second-instance forward-shadow at a future bounded-learning ship that re-applies the pattern, OR (b) codification at the next discipline-coverage codification ship.

v796 does NOT count as a second-instance forward-shadow. The two-one-sided-Bonferroni primitive was baked into `runCalibrationLoop` at v795; v796 inherits it implicitly without re-deriving or re-applying the choice. A second-instance forward-shadow would require independently encountering the same trap in a new context (e.g. authoring a separate calibration loop for a different observation source where the binary-domain limitation would re-emerge if the author didn't already know about #10425).

Status: **#10425 remains as MEDIUM-severity candidate at v796 close.** Promotion to ESTABLISHED still awaits either (a) a second-instance forward-shadow, or (b) the next codification ship. The expected codification home (per v795 retro): extend the Static-analysis tool authoring discipline OR start a new Bounded-learning discipline if more lessons accumulate.

## Meta-observation: scaffolding-payoff validation

v795 retrospective predicted ships 2-6 would land in 30-45 min each based on the primitive + CLI scaffolding existing after ship 1. v796 landed in ~30 min — at the lower bound of the prediction. One data point doesn't make a pattern, but it does VALIDATE the architectural choice from ship 1 (complete-vertical-for-one-threshold + threshold-agnostic-primitive). The next 1-2 ships will firm up whether sub-30-min is reliable or whether ships 3-6 hit complications (e.g. ship 3's `token_budget.warn_at_percent` may force an observation-source architectural choice, pushing wall-clock higher).

This meta-observation may itself become a future lesson candidate IF the prediction continues to hold across ships 3-6 (validating the "complete vertical + threshold-agnostic primitive" as a discipline for similar future multi-threshold calibration work). For now it's an embedded note for the next ship's retrospective to reference.

## Cross-discipline observation: extension-ship cadence

v796 establishes the empirical extension-ship wall-clock baseline at ~30 min when the underlying vertical is already in place. Compare:

- New verticals (v795 ship 1): ~75 min wall-clock (math primitive + module scaffolding + CLI + tests + writer).
- Extensions within an existing vertical (v796 ship 2): ~30 min wall-clock (whitelist edit + docstring refresh + tests).
- Counter-cadence cleanup ships: ~variable per scope.
- Adoption-refresh / static-analysis tool ships (v791-v794): typically 30-60 min depending on whether a gate is new.

The 2.5× speed differential between v795 ship 1 and v796 ship 2 is the architectural payoff visible in wall-clock terms. This is a data point for future planning: when a multi-threshold / multi-instance feature is on the audit roadmap, prefer the "complete vertical for ONE instance + extension ships for the rest" pattern over "wire all instances in one ship."

## Discipline-coverage status post-ship

Manifest entries: 15 → 15 (no new domain)
Manifest lessons: 65 → 65 (no new formal ID; #10425 still candidate)
Codified-vs-uncodified gap: 1 (unchanged — #10425 still the only uncodified candidate)

## Forward backlog (post-v796)

| ID | Severity | Apply | Source |
|---|---|---|---|
| #10425 candidate | MEDIUM | Two-sided e-processes on bounded binary observations are insensitive to unanimous direction; use Bonferroni-combined one-sided instead. | v795 design |
