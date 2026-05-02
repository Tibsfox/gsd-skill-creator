# v1.49.593 Retrospective — Carry-Forward Lessons Applied + New Lessons

## Carry-forward lessons applied this milestone

### #10208 — Forward-action fixes can preempt their own future-incidents
**Applied this milestone (T2.1+T2.2).** v1.49.591 lesson #10203 (W2-prompt canonical-regex propagation) collapsed inline-recovery overhead from ~10 min to zero at v1.49.592. v1.49.593 applied the same pattern: artifact-suite drift was caught by user 2026-05-01 (v1.71/v1.72/v1.73 shipped at 13/4/4 artifacts vs 13-file gold). Two structural fixes landed AT v1.49.593 W0:
- W2-prompt template grew 111→154 lines (artifact-suite enumeration; mandatory at v1.49.593+)
- depth-audit.mjs gained artifact-count + 5-category check (BLOCKER mode; PASS=≥10 files / 5/5 categories)

**Result at v1.49.593 W2:** NASA 1.74 W2-NASA hit 7/7 canonical sections AND 13 artifacts / 5/5 categories WITHOUT inline-recovery cycles. The 30+ minutes of post-ship artifact-suite remediation that would otherwise be needed at v1.49.594+ is preempted by structural-fix-shipped-this-milestone.

### #10209 — Sibling depth-ratios diverge legitimately when subject density differs
**Applied at depth-audit.** v1.49.593 W2 produced PASS=2 / WARN=1 (ELC bytes 91% — CSS difference, not content thinness). Composite-pass clears all 3 to PASS, validating the option (a) recommendation from v1.49.592 W0.3. Forward action: composite-pass should be DEFAULT at v1.49.594+ once 2 milestones of soak data confirm no false-PASS regressions.

### #10210 — Two-stage error-correction pipeline (W1a + W2)
**Applied throughout.** W1a Apollo 10 dossier caught 10 brief errors (1 HIGH BE-5: max separation 628 km not 14-100 km; 4 MED; 5 LOW). All 5 highest-severity corrections propagated through 35+ build files (NASA + MUS + ELC) with zero post-build correction needed at depth-audit.

### #10197 — Three-track-plus-TRS established cadence
**Applied:** 7th instance of the pattern. Wall-clock and token-budget tracked at ~5.5 hours / ~750K Sonnet aggregate (within established envelope). Pattern continues to demonstrate stability + cross-substrate transferability + token-budget predictability.

### #10198 — Mid-mission temporal-coincidence as MUS structural primitive
**Applied:** MUS 1.74 = The Who Tommy (UK 1969-05-23 = 5 days post-launch; US 1969-05-19 = 1 day post-launch). SOLE candidate within ±7-day narrow window per the lesson. Strongest temporal-coincidence anchor among any v1.49.59X milestone so far.

### #10200 — TRS pack-fetch ≥10-min spacing for ≤2 concurrent
**Applied:** Wave 2a synthesis dispatched as 4 batches of 2 (01+02 / 03+04 / 05+06 / 07+08) with ≥10-min cooldowns. Zero quota collisions at the synthesis layer (no web research needed; only master.json reads).

### #10199 — W1 brief-error catch discipline is load-bearing
**Applied:** 10 brief errors caught + 5 propagated. BE-5 HIGH (628 km vs 14-100 km) was load-bearing for ELC RR narrative depth.

## New lessons emerging at this milestone

See `04-lessons.md` for full text. Summary:

- **#10213 — Artifact-suite enforcement (USER-FLAGGED 2026-05-01).** Three milestones (v1.71/v1.72/v1.73) shipped with thin or absent NASA artifact suites; root cause was W2-prompt template gap + W2-NASA dispatch made artifacts "optional" + no depth-audit hook. Fix: enumerate the 13-file canonical suite in the W2-prompt template (parallel to canonical-regex propagation #10203) + add depth-audit artifact-count check. Result: v1.74 ships at 13 / 5/5 categories without remediation.

- **#10214 — Sonnet quota at ~04:08 PDT cadence anchor.** Two consecutive milestone dispatches (v1.49.592 + v1.49.593) hit quota at approximately the same wall-clock time. Discipline: avoid multiple Sonnet dispatches in the 03:00-05:00 PDT window if quota margin is uncertain. Inline-Opus recovery is functional fallback (v1.49.593 W0.2d v1.73 artifacts = 5 files inline-Opus authored after quota hit; v1.49.593 W2-NASA continuation pattern handled mid-build 401).

- **#10215 — Mid-build 401 auth interruption pattern.** When a Sonnet subagent dies mid-build with auth failure, the existing partial output is salvageable. Discipline: re-run depth-audit on partial state to identify what landed; dispatch a CONTINUATION agent that explicitly preserves existing files and only authors the missing ones. Saves token + wall-clock vs full re-run.

- **#10216 — Wave 2 synthesis vs Wave 1 fetching is a token-cheaper substrate.** Wave 1 fetching consumed ~75K tokens per pack (web research) vs Wave 2 synthesis at ~30-50K per pack (master.json reads only). Wave 2 also has zero rate-limit risk (no arXiv / WebSearch external dependencies). Forward planning: prefer synthesis-batch milestones when quota margin is uncertain.

- **#10217 — Pack-tag inconsistency in master.json (Wave 1 hangover).** Pack-08 quantum-mechanics has ZERO `pack`-tagged records; pack-05 + pack-06 + pack-07 have records cross-tagged via `pack_assignments` array vs `pack` field. 8 priority Wave-1.5 papers identified for pack-08; broader Wave-1.5 audit needed to reconcile pack-tag schema.

## Process observations

- **W2-NASA wall-clock 31 min total** (8 min initial dispatch ended in 401 + 23 min continuation dispatch); v1.49.592 baseline was 37 min. Mid-build 401 recovery added <5 min wall-clock overhead.
- **W2-MUS + W2-ELC parallel: 23 + 18 min** — within plan.
- **TRS Wave 2a total: ~5 min × 4 batches + 30 min cooldowns = ~50 min wall-clock** — synthesis pattern is faster than Wave 1 fetching at same batch count.
- **Depth-audit verdict: PASS=2 / WARN=1 / FAIL=0** — improvement over v1.49.592 (PASS=1 / WARN=2). Composite-pass would clear all 3 to PASS.
- **W1a + G0 round-trip:** 14 min dossier + 3 min user adjudication. All G0 picks accepted at recommended option.
- **Artifact remediation v1.71/v1.72/v1.73:** 30 min wall-clock combined (2 parallel batches + 1 inline-Opus when quota hit). Net: 23 new files (v1.72 +7 / v1.73 +5 / v1.71 +0 file but 2× HTML upgrades 40→171 lines).
