# Retrospective

## Carryover lessons applied (from v1.49.589 and earlier)

**Lesson #10191 (W1 multi-agent dispatch quota discipline) — APPLIED CLEANLY.** v1.49.589 emitted the rule: ≤2 concurrent Sonnet agents, ≥3-min spacing, <150K aggregate tokens per batch, first-dispatched priority. v1.49.590 W1 was solo (W1a Apollo 7 dossier alone, ~80K tokens, ~14 min wall-clock); W2-NASA was solo (~80K, ~40 min); W2-MUS+ELC was parallel-of-2 after NASA completed. Zero quota errors observed across the entire pipeline. The discipline that emerged from v1.49.589's failure is now soaked across two milestones (#10193 reproduction).

**Lesson #10192 (Sonnet 13K-word W1a dossier target) — APPLIED CLEANLY.** v1.49.590 W1a dossier delivered 12,033 words across 4 tracks with 11 brief errors caught (target 8-12; +1 vs v1.49.589's 10). Brief-error catch rate continues the linear scaling: more verifiable detail surface area → more G0 catches. **BE-2 HIGH** was a load-bearing catch — mission brief had AGC IC tech wrong (claimed Sylvania DTL replacing Philco RTL; actual is Fairchild RTL throughout). Without W1 brief-error discipline, v1.49.590 ELC content would have shipped factually wrong.

**Lesson #10193 (W2 serial-then-parallel discipline) — REPRODUCED at second milestone.** v1.49.589 was the first milestone to apply the full W2 discipline successfully; v1.49.590 reproduces the result. NASA solo first (40 min, 25 files, 96% lines / 80% bytes WARN borderline acceptable), then MUS+ELC parallel after. Pattern is now SOAKED across two consecutive milestones; can be hardened from RECOMMENDED to MANDATORY in the W2-build-agent-prompt.md template at v1.49.591.

**Lesson #10185 (W2 build-agent dispatch template) — APPLIED.** Template at `.planning/missions/template-files/W2-build-agent-prompt.md` invoked for all 3 W2 dispatches. Output token discipline (incremental Edit ops for files >100 lines; single Write only for new files <800 lines) followed throughout — zero silent-truncation incidents observed.

**Lesson #10178 (W1 brief-error catch discipline) — APPLIED CLEANLY.** 11 brief errors caught at G0; user accepted all corrections; W2 build agents were instructed to apply corrections consistently across all artifacts. BE-2 HIGH (Fairchild RTL vs Sylvania DTL) propagated correctly to ELC chapter content.

**Lesson #10168 (counter-cadence cleanup-mission cadence ~30 milestones) — STILL DEFERRED.** Counter-cadence cleanup-mission #2 ETA ~v1.49.615. v1.49.590 was a forward-cadence ship; no cleanup-mission scope.

## What worked at v1.49.590

1. **Three-track-plus-TRS pattern soaked at 4 instances.** v1.49.587 first used the pattern (Mariner 6/7 + 2 Track-2 fold-ins + TRS Wave 0); v1.49.588 second (Apollo 5 + Track-2 deferred-item + TRS Wave 1a); v1.49.589 third (Apollo 6 + 4 Track-2 + TRS Wave 1b partial); v1.49.590 fourth (Apollo 7 + 3 Track-2 + TRS Wave 1b retry + 1c). Pattern is now an established cadence rather than an experimental shape.

2. **Track 2 fold-in cleanly closes 3 lesson candidates.** #10194 inline-recovery doc, #10195 FTP sync tool promotion, #10196 gh CLI workaround — all 3 deferred from v1.49.589 §6 closed in v1.49.590 W0 with ~60 min Opus-inline wall-clock. New `tools/ftp-sync.mjs` (18 vitest assertions) + `npm run ftp-sync` + CLAUDE.md ship-pipeline section expansions. Zero new HARD RULES introduced (all 3 items were doc-or-tool work, not invariant changes).

3. **W1a brief-error catch caught BE-2 HIGH.** Mission-brief said "Sylvania DTL replacing Philco RTL" for AGC Block II → Block I transition; W1a research established both Block I + Block II used Fairchild RTL family (μL 914 single-NOR → μL 9915 dual-NOR). Without G0 catch, ELC chapter would have shipped a load-bearing factual error. Mission-brief was corrected at G0; W2-ELC built correctly.

4. **MUS structural-anchor methodology — mid-mission cultural-anchor pattern.** Electric Ladyland (1968-10-16) lands 5 days into Apollo 7's 11-day mission. This joins v1.49.589's same-day Bookends/MLK/Apollo-6 anchor as a recurring SPS pattern: temporal-coincidence between MUS release date and NASA mission date is structurally generative. Establishes a methodology for future MUS selection at first-pass: "is there an album released within ±7 days of mission window?" Failing that, use structural-anchor pairing as primary criterion.

## What needs attention at v1.49.591

1. **Three-track-plus-TRS pattern formalization.** At 4 instances, the pattern deserves codification — wave-plan template, prompt scaffolding, expected file counts. Pattern is currently encoded in mission-brief structure but not extracted.

2. **Depth-audit hardening to BLOCKER (per T2.3 design intent).** v1.49.589 + v1.49.590 are the 2-milestone soak window; v1.49.591 is when depth-audit step 6 should harden from WARNING-only to FAIL-BLOCKER. Update `tools/pre-tag-gate.sh` accordingly.

3. **W2-build-agent-prompt.md MANDATORY upgrade.** Template currently RECOMMENDED; at v1.49.591 (3rd consecutive successful application), upgrade to MANDATORY with override `SC_W2_DISPATCH_OVERRIDE=1` for emergency.

4. **TRS M0 progress.** v1.49.590 dispatched 7 TRS packs (Wave 1b retry + Wave 1c). Continue Wave 1d (packs 13-16) at v1.49.591; Wave 1e (packs 17-22) at v1.49.592; M0 Wave 2 synthesis begins v1.49.593.

5. **MUS + ELC depth recovery.** At v1.49.589, MUS + ELC depth dropped to 78-89% predecessor due to inline-recovery. v1.49.590 W2-MUS + W2-ELC dispatched as Sonnet (not inline) to recover 95%+ depth. Outcome TBD pending W2 completion at time of retrospective draft.

## Lessons NOT applied (still deferred)

- **SPS catalog 056-066 backfill** — inherited from v1.49.586+; not addressed at v1.49.590. Forward to ~v1.49.615 cleanup mission.
- **Forest-sim simulation.js aggregator merge** — recurring counter-cadence item; per-mission canonical blocks v1.64-v1.71 exist but not merged into the aggregator. ETA ~v1.49.615.
- **NASA gold-standard depth re-baseline.** v1.49.590 NASA index.html landed at 96% lines / 80% bytes — borderline WARN at the bytes axis. v1.49.591 should investigate whether the v1.70 baseline itself is anomalously dense (Apollo 6 had three primary anomalies = naturally higher word count) or whether the depth thresholds need adjustment.
