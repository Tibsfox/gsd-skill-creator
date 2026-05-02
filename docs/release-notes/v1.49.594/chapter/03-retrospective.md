# v1.49.594 Retrospective

## Carryover lessons applied (from v1.49.593)

- **#10213 (artifact-suite enforcement):** APPLIED at W2-NASA build. The 13-file canonical suite mandate from the W2-prompt template held — Apollo 11 NASA 1.75 shipped with 13 files / 5/5 categories at first build, no inline-recovery cycles. Pattern continues to preempt drift.
- **#10215 (mid-build 401 recovery):** NOT TRIGGERED at v1.49.594 — Apollo 11 W2-NASA build completed in single agent run (~56 min wall-clock) without authentication interruption. Continuation-dispatch pattern remains available for future incidents.
- **#10216 (Wave 2 token-cheaper):** CONFIRMED at Wave 2b — 8 packs synthesized at ~31K total words (vs Wave 2a 44K words; Wave 2b ran slightly more terse). Synthesis-batch milestone token economics held within envelope.
- **#10217 (pack-tag schema):** CARRY-FORWARD partial. Pack-08 closed at v1.49.594 W0.3 (8 papers fetched with `pack-08-quantum-mechanics` tag). Pack-15 inconsistency remains: 6 records use `pack-15` short-form vs proposed `pack-15-probability-statistics` long-form. Schema reconciliation deferred to v1.49.595+.

## Carryover candidates emitted as numbered Lessons (v1.49.594)

- **#10221 dev/main sync discipline** — emitted at this ship as numbered Lesson; first-instance test APPLIED at every main-merge boundary (target 0-commit drift at close)
- **#10222 card-population cross-link enforcement** — emitted at this ship as numbered Lesson; structural fix landed pre-open via `tools/depth-audit.mjs` cross-link submetric + W2-prompt template enumeration mandate

## v1.49.594 process observations

### What went well

1. **W0 fold-in concentration via pre-open work:** T2.1 (#10222) was completed BEFORE the milestone formally opened (commit `dcadc4c65`). This pattern eliminated W0 dispatch overhead at v1.49.594 — instead of "open milestone → schedule fix → execute → soak observe", the fix was already live + tested + FTP-synced. Recommend continued pre-open completion of structural fixes when carry-forward queue includes "DONE" items.
2. **Apollo 11 dossier brief-error catching at depth:** 12 brief errors documented (4 HIGH / 6 MED / 2 LOW) — exceeds typical Apollo brief-error count (~10 avg per Lesson #10186). The iconic-mission factor produces more pop-history confusion to correct. BE-01 (1201/1202 RR-not-LR), BE-03 (B/W not color TV), BE-04 (ALR-100 vs RR distinction) are the load-bearing corrections.
3. **Cross-link enumeration mandate enforces itself:** W2-NASA Apollo 11 build hit 13/13 cross-link coverage at first run (not requiring inline-recovery). The W2-prompt template change at v1.49.594 W0 immediately produced compliance — forward-action structural fixes preempt their own incidents (#10208 pattern continues).

### What needs attention

4. **W1bc rate-limit interruption at Batch D:** The W1bc TRS Wave 2b synthesis fork hit Anthropic per-account rate limit during Batch D dispatch (packs 15 + 16 dispatched but failed). Recovered by main-context fresh-dispatch (~10 min after rate limit). 6 of 8 packs completed in fork; 2 packs completed via main-context recovery dispatch. Wall-clock impact: ~15 min added to W1bc total. Lesson #10223 candidate: when fork hits rate limit, main-context dispatch is the recovery path (forks don't have their own quota separate from main).
5. **Wave 2b synthesis runs 30% terser than Wave 2a:** Pack 09-14 came in at 2,900-4,000 words each vs Wave 2a target 5,000-6,000 (packs 15+16 hit the target after main-context fresh dispatch). Possible cause: fork-managed dispatch produces shallower synthesis than direct dispatch. Lesson #10224 candidate: Wave-N synthesis token-floor sets at the dispatch model (fork = lower floor; direct = higher floor); future Wave dispatches consider direct over fork for depth.
6. **MUS+ELC at 81% line ratio:** Both tracks landed at 81% lines / 80-86% bytes vs predecessor v1.74. Below 95% PASS threshold; below 95% lines threshold for composite-pass to activate. Marginal but not FAIL. Lesson #10225 candidate: when MUS or ELC predecessor was unusually deep (v1.74 MUS hit 121% lines / 136% bytes vs v1.73), the next milestone's natural sizing produces apparent regression. Solution: consider composite-pass `lines ≥ 95% * predecessor` substitution with `lines ≥ 95% * 5-milestone-trailing-median` to dampen single-milestone outliers.
7. **Composite-pass first soak observation:** NASA WARN→PASS (lines 99% qualifies for composite-pass; bytes 80% relaxed via composite). MUS+ELC stay WARN (lines 81% < 95% threshold; composite-pass not eligible). T2.4 first-soak data: composite-pass DOES help density-variance cases (NASA at v1.49.594) but does NOT help below-threshold-lines cases (MUS+ELC at v1.49.594). v1.49.595 second soak will confirm pattern.

## Carry-forward to v1.49.595+

- Pack-09/10/11/12/13 priority Wave-1.5 fetches (5 packs need pack-tagged records similar to pack-08 v1.49.594 closure)
- Pack-tag schema reconciliation (#10217 partial; long-form vs short-form unification)
- Composite-pass second soak + default-flip consideration at v1.49.596
- Cross-link strict-mode cutover at v1.49.595+ (`--cross-link-strict` in pre-tag-gate.sh)
- Lesson #10223 (rate-limit recovery via main-context dispatch) tracking
- Lesson #10224 (fork vs direct dispatch synthesis depth) tracking
- Lesson #10225 (composite-pass trailing-median refinement) consideration
