# 04 — Lessons Learned: v1.49.798 T1.1 Ship 4

## 1 candidate emitted (#10426); 0 promoted to ESTABLISHED

v798 is the first non-trivial wedge in the T1.1 chained session — and the first ship to emit a new lesson candidate since v795. The candidate addresses cross-class abstraction extraction timing.

## Disciplines reinforced (no new IDs)

- **#10412 (Recon-first as default)** — 11th consecutive application since v784 codification. Read the token-budget enforcement surface, schema, and config-types BEFORE writing any v798 code. Recon surfaced: (a) `token_budget.warn_at_percent` is for skill-loading context-window enforcement; (b) no existing telemetry captures operator response to warn events; (c) schema validates `warn_at_percent ∈ [1, 100]` with default 4. ~10 min recon → ~30-40 min implementation.
- **#10422 (Verdict-pattern surface separation)** — 8th forward application. The registry extraction (new file, new module boundary) is genuinely a new surface — kept separate from the CLI command file. CLI's delta beyond the SUPPORTED_THRESHOLDS array is 3 lines (replace inline loader with `loadObservationsForThreshold`).
- **#10423 (Lightest wire that satisfies the verdict)** — 8th forward application, tested at the second-instance boundary. The lightest *technical* wire was option (A) — reuse the suggestions source for token_budget. Rejected because it's semantically dishonest. The discipline applies to UNNECESSARY surface, not NECESSARY surface; the per-class registry is necessary at this point in evolution. The judgment call between "necessary" and "unnecessary" is the discipline's substance.
- **#10424 (ESTABLISHED at v794) — Adoption-refresh AFTER bump-version.** Applied: T14 step 11 ordering correctly places adoption-refresh after bump-version. Fifth consecutive ship under the active gate.

## New lesson candidate (#10426)

**ID:** #10426 candidate
**Severity:** MEDIUM
**Source:** v1.49.798 architectural-choice design (option C selected over A/B)

**Statement:**

When a primitive accumulates instances across multiple classes (e.g., threshold classes with different observation sources), extract the per-class registry at the SECOND class instance, not the third. The second-class instance is the discipline-correct extraction point.

**Why:**

- Extracting at the FIRST class instance is premature: you don't yet know what's varying.
- Extracting at the THIRD class instance means the SECOND class shipped using a temporary wrong-source measure, accumulating semantic confusion in documentation that has to be unwound later.
- At the SECOND class instance, you know exactly what's varying (here: `sourceId` string + `loader` function + `wired` boolean), and the abstraction shape is determined by 2 concrete instances rather than speculation.

**How to apply:**

When adding a feature that crosses a class boundary the codebase hasn't seen before, ask:

1. Is this a one-off, or the start of a pattern? (Recon answers this.)
2. If a pattern, extract the abstraction NOW — don't defer to instance 3+.
3. If genuinely a one-off, treat it as such and don't speculate.

The discipline lives next to #10422-#10423 (surface separation + lightest wire) but addresses a different question: those disciplines tell you HOW MUCH surface to add; #10426 tells you WHEN to extract the abstraction across that surface.

**Promotion path:**

Either:
- **(a) Second-instance forward-shadow** — another cross-class registry extraction surfaces in a future ship (e.g. extending an enum-typed family to a new variant where per-variant config needs to dispatch).
- **(b) Codification at next discipline-coverage codification ship** as a fresh discipline note alongside #10422-#10423. Likely the more probable path — cross-class registry extractions don't happen often in any single codebase, so the second-instance forward-shadow might not surface for many ships.

## #10425 promotion path discussion (NOT promoted this ship)

v798's observation-sources design does inherit the two-one-sided-Bonferroni primitive — the per-class loaders all produce observations in [-1, 1], consistent with the primitive. But this is implicit inheritance, not independent re-derivation. v798 does NOT count as a second-instance forward-shadow for #10425.

Status: **#10425 remains as MEDIUM-severity candidate at v798 close.** Same promotion criteria as before.

## Meta-observation: chained-session prediction-tracking

v797 retro proposed a tentative hypothesis: "chained-session extension-ship speed-up — wall-clock for v797 was meaningfully lower than v796 even though v796 was already the architectural-payoff data point."

v798 partially complicates this hypothesis: wall-clock landed at the predicted ~45-60 min (NOT below). The chained-session warmth tailwind exists but is partially offset by the architectural-choice tax for non-trivial wedges. Updated framing for the v799-v801 retros:

- Pure extensions in same observation-source class (v796, v797): chained-session warmth + architectural payoff combine, ships land below prediction.
- Non-trivial wedges that introduce new surface (v798): chained-session warmth helps but is offset by recon + design tax, ships land at prediction.
- New surface ships (v795, v799 if it lands the audit log module): chained-session warmth helps, but new-module overhead dominates, ships land closer to new-vertical baseline.

This is a tentative observation; v799-v801 will firm it up.

## Cross-discipline observation: four-ship cadence baseline

After four ships in the same vertical:

- New vertical (v795 ship 1): ~75 min wall-clock.
- First same-class extension (v796 ship 2, cold-start): ~30 min wall-clock.
- Second same-class extension (v797 ship 3, chained): ~15-20 min wall-clock.
- First cross-class extension + new module (v798 ship 4, chained): ~45-60 min wall-clock.

Four data points are still few, but the shape is emerging:

- Same-class extensions trend toward zero overhead.
- Cross-class extensions carry a fixed architectural-choice + new-module tax (~30 min) on top of the extension work.

This pattern informs v799-v801 estimates:

- v799 (audit log, new module): expect ~45-60 min (new module dominates).
- v800 (--watch mode, no new module, modifies CLI command): expect ~30-45 min (same-class addition but introduces fs.watch + debounce surface).
- v801 (/sc:status integration, modifies a different existing command): expect ~30-45 min (cross-command but no new abstraction).

## Discipline-coverage status post-ship

Manifest entries: 15 → 15 (no new domain — #10426 candidate not yet codified)
Manifest lessons: 65 → 65 (no new formal ID; #10425 + #10426 both still candidates)
Codified-vs-uncodified gap: 1 → 2 (#10426 candidate adds to backlog)

## Forward backlog (post-v798)

| ID | Severity | Apply | Source |
|---|---|---|---|
| #10425 candidate | MEDIUM | Two-sided e-processes on bounded binary observations are insensitive to unanimous direction; use Bonferroni-combined one-sided instead. | v795 design |
| #10426 candidate | MEDIUM | Extract per-class registries at the SECOND class instance, not the third. | v798 architectural-choice |
