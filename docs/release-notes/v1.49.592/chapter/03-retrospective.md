# v1.49.592 Retrospective — Carry-Forward Lessons Applied + New Lessons

## Carry-forward lessons applied this milestone

### #10197 — Three-track-plus-TRS established cadence
**Applied:** 6th instance of the pattern; wall-clock and token budget tracked at ~3.5hr / ~640K Sonnet aggregate (within established envelope). Pattern continues to demonstrate stability + cross-substrate transferability + token-budget predictability.

### #10198 — Mid-mission temporal-coincidence as MUS structural primitive (narrow-window fallback)
**Applied:** MUS 1.73 (CSN debut, 1969-05-29; ~77 days post-launch) is OUTSIDE the narrow ±7-day window. Per #10198 fallback, structural-pair primacy was applied: the three-veterans-form-new-ensemble parallel to three-veteran-crew-flies-first-complete-Apollo-stack carries the cross-track linkage without temporal coincidence. Domain 10 origination (Supergroup / Cross-Pollination Debut) emerges cleanly.

### #10199 — W1 brief-error catch discipline is load-bearing
**Applied:** W1a Sonnet dossier caught 10 brief errors; 2 HIGH severity (BE-1 AGS-digital-not-analog; BE-2 EVA-46min-not-37min); 1 MED (BE-6 Apollo 9 introduced new S-II pogo). All applied to W2 build agent prompts; corrections propagated through all 17 NASA + 10 MUS + 10 ELC build files.

### #10200 — TRS pack-fetch ≥10-min spacing for ≤2 concurrent
**Applied:** Wave 1e dispatched as 3 batches of 2 (17+18 / 19+20 / 21+22) with ≥10-min cooldowns. Zero arXiv 429s. Zero quota collisions. WebSearch+WebFetch primary path.

### #10202 — Two-soak-then-harden discipline
**Applied:** Depth-audit BLOCKER hardening (v1.49.591 T2.2) had its first ship-pipeline use this milestone. Step 6 fired clean (1 PASS / 2 WARN / 0 FAIL/MISSING); pre-tag-gate exit 0 confirmed.

### #10203 — W2-prompt canonical-section regex propagation
**Applied this milestone (T2.1).** The 7 NASA canonical regexes now enumerated verbatim in `template-files/W2-build-agent-prompt.md`. **Result: NASA 1.73 W2-NASA agent landed 7/7 canonical sections WITHOUT inline-recovery cycles** (vs v1.49.591 NASA 1.72 which needed 4 inline-recovery edits to restore canonical names). The forward-action fix worked exactly as designed.

### #10205 candidate — inline-recovery via main-context Opus for canonical-section drift
**NOT triggered this milestone** (NASA 1.73 hit 7/7 sections without inline-recovery). Pattern remains in reserve.

## New lessons emerging at this milestone

See `04-lessons.md` for full text. Summary:

- **#10207** — depth-audit composite-signal evaluation (option (a) over moving-baseline option (c)): when lines ≥ 95% AND sections meet threshold, relax bytes threshold to 0.75. Cleanly resolves v1.71/v1.72/v1.73 false-WARN cases. Recommended deferred implementation to v1.49.593 with `--composite-pass` flag.

- **#10208** — W2-prompt regex propagation IS the right fix shape; the 4-Edit inline-recovery cycle from v1.49.591 vanished entirely at v1.49.592. Forward-action fixes can preempt their own future-incidents.

- **#10209** — sibling depth-ratios diverge legitimately when subject density differs (LM AGS digital-computer narrative is genuinely more concise than S-IVB J-2 mechanical-engineering narrative; ELC 1.73 86% lines is appropriate).

- **#10210** — W1a brief-error catch + W2 build-agent inline correction is a 2-stage error-correction pipeline that catches both factual errors (BE-1, BE-2) AND framing errors (BE-6 expanding scope of Saturn V pogo narrative beyond original brief).

## Process observations

- **W2-NASA wall-clock 37 min** vs estimated 35 min — within plan
- **W2-MUS + W2-ELC parallel: 18.3 + 20.0 min** — within plan
- **TRS Wave 1e total: ~20 min wall-clock** (3 batches × ~5 min + 2 cooldowns × 10 min) — within plan
- **Depth-audit verdict: 1 PASS + 2 WARN + 0 FAIL** — improvement over v1.49.591 (1 WARN borderline at NASA bytes); cleaner signal at v1.49.592
- **W1a + G0 round-trip:** 17 min dossier + 3 min user adjudication; all G0 picks accepted at recommended option
