# 04 — Lessons Learned: v1.49.797 T1.1 Ship 3

## 0 candidates emitted; 0 promoted to ESTABLISHED

v797 is a clean extension within v795's scaffolding. No new design choices surfaced; no new traps caught; no lesson candidate emitted. The v795 candidate (#10425) is NOT promoted this ship — identical inheritance pattern to v796.

## Disciplines reinforced (no new IDs)

- **#10412 (Recon-first as default)** — 10th consecutive application since v784 codification. Read v796 source + test surface BEFORE writing any v797 code. Recon confirmed the v796 pattern is reproducible verbatim. ~5 min recon → ~10-15 min implementation.
- **#10422 (Verdict-pattern surface separation)** — 7th forward application. The 4-line edit to `SUPPORTED_THRESHOLDS` is the entire production-code delta. Surface separation between primitive (no change) / CLI whitelist (one array edit) / docstring (three small refreshes) / tests (one new describe block in three files) means each surface evolves independently.
- **#10423 (Lightest wire that satisfies the verdict)** — 7th forward application. Resisted four temptations: (a) bundling the `FlagLookup` extract (still deferred — 4 copies now), (b) generalizing `ABSOLUTE_FLOOR` to a per-threshold registry, (c) extracting a per-threshold semantic-direction registry (three identical mappings still don't justify it), (d) introducing inverted-direction support for `auto_dismiss_after_days` (kept the identical mapping per the v796 retro's "semantic stretch is identical" framing).
- **#10424 (ESTABLISHED at v794) — Adoption-refresh AFTER bump-version.** Applied: T14 step 11 ordering correctly places adoption-refresh after bump-version. Fourth consecutive ship under the active gate.

## #10425 promotion path discussion (NOT promoted this ship)

v797 does NOT count as a second-instance forward-shadow. Like v796, v797 inherits the two-one-sided-Bonferroni primitive implicitly from v795 without independently re-deriving the choice. A second-instance forward-shadow would require independently encountering the same trap in a new context — likely v798's `token_budget.warn_at_percent` if its observation-source has different domain characteristics that force re-evaluation of the e-process design.

Status: **#10425 remains as MEDIUM-severity candidate at v797 close.** Promotion to ESTABLISHED still awaits either (a) a second-instance forward-shadow, or (b) the next codification ship.

## Meta-observation: chained-session extension cadence

v797 was authored immediately after v796 in the same chained session. Wall-clock for v797 was meaningfully lower than v796 (~15-20 min vs ~30 min) even though v796 was already the architectural-payoff data point. Hypothesis: session-context warmth amplifies architectural payoff because the templates (test patterns, docstring conventions, release-notes structure) are still hot in working context.

This is a tentative observation, not a lesson candidate. It will firm up across v798-v801 if the speed-up continues. If it does, the pattern is worth codifying as a discipline observation: "chained extensions in a single session land faster than sequential extensions across cold-start sessions, by ~30-50% wall-clock."

## Cross-discipline observation: triple-ship cadence baseline

After three ships in the same vertical:

- New vertical (v795 ship 1): ~75 min wall-clock.
- First extension (v796 ship 2, cold-start session): ~30 min wall-clock.
- Second extension (v797 ship 3, chained session): ~15-20 min wall-clock.

If chained-session speed-up is real, the cadence formula is approximately:

```
T(N) ≈ T(1) * (0.4 - 0.07 * (N-1))   for N=1..3, chained-session extensions only
```

But three data points are too few for confident extrapolation. v798-v801 will provide four more. Particularly informative: v798 moves to a new observation-source class — does the architectural payoff hold when the wedge is non-trivial?

## Discipline-coverage status post-ship

Manifest entries: 15 → 15 (no new domain)
Manifest lessons: 65 → 65 (no new formal ID; #10425 still candidate)
Codified-vs-uncodified gap: 1 (unchanged — #10425 still the only uncodified candidate)

## Forward backlog (post-v797)

| ID | Severity | Apply | Source |
|---|---|---|---|
| #10425 candidate | MEDIUM | Two-sided e-processes on bounded binary observations are insensitive to unanimous direction; use Bonferroni-combined one-sided instead. | v795 design |
