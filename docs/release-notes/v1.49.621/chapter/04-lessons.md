# v1.49.621 — Forward Lessons

Lessons emitted at v1.49.621 close. Each is candidate for the lessons-tracker
and reusable across future missions.

## Lessons emitted

1. **Cartridge composition algebra is implementable in <500 lines.** `src/scribe/cartridge-composition/compose-chipset.ts` (184 lines) + `merge-citations.ts` (665 lines) = 849 total; the categorical-sum primitive itself is <200 lines. Future foundational chipsets should aim for similar economy.

2. **T2 / T3 / T5 substrate decisions compose without renames.** Wave 1 Components 03 + 05 + 06 all consumed Component 00 frozen consts directly; **zero substrate-decision drift** across 9 components. The Component 00 / `src/scribe/types/` module is the single source-of-truth that all downstream consumers import from.

3. **SCRIBE namespace conformance is machine-checkable, not just a narrative claim.** Components 04 + 09 namespace-uri-stable test certify in CI that `https://tibsfox.com/Research/SCRIBE/ns#` appears verbatim in the foundational chipset manifest, in the validate-namespace.ts script (symbolically only), and in the `metadata-namespace.ts` source-of-truth declaration (exactly once, runtime form). Silent drift fails CI.

4. **47 capabilities decomposable into 10 components fits the Fleet activation profile.** Single-Opus C09 close-out + Sonnet/Haiku/Opus mixed body of work. Future missions of similar scope (~40-50 caps) can use the same 9 + 1 component split.

5. **"Foundational chipset as thin shell" is the correct discipline.** Compose cartridges by reference; don't duplicate member content. C01 honored this by keeping all source content in `examples/cartridges/<member>/` and the foundational chipset's `manifest.json` at 688 bytes (just the composes declaration + namespace URI + role).

6. **Counter-cadence milestone pattern (v1.49.585 + v1.49.621 = 2 of 2).** Operational-substrate milestones shipped without advancing NASA degree are a viable cadence variant. Use again when substrate IS the work. Predecessor degree closes the previous degree-advancing cycle; counter-cadence follows; next degree-advancing milestone resumes after.

7. **INLINE SERIAL parent-author pattern formalized.** For missions where recursive `Agent` spawning fails at the runtime layer, parent-agent inline-author with sub-agent body returning text-content-only is the fallback. flight-ops author-the-briefing-not-dispatch is the corollary. Adopted across all 4 waves of this mission.

8. **flight-ops audit-then-author for Wave 4 saves cycles.** WAVE-4-AUDIT BEFORE C09 dispatch verified ship-readiness; the C09 briefing duplicated load-bearing content inline (no chase-one-level-deep). C09 began with zero blockers because all 3 advisories were pre-resolved.

9. **Sub-agent harness blocks REPORT.md writes.** Convoy-lead agents could not write final REPORT files; parent agent landed from returned content. Workaround used Waves 1-3. Long-term improvement: structured-output return shape so convoy-lead agents can return REPORT body as structured field rather than a Write side-effect.

10. **Pre-existing-failure investigation belongs in the pre-dispatch audit.** WAVE-4-AUDIT discovered the migrations.test.ts skip-set was already in working tree, passing 105/105 — not "reverted out-of-band" as the operator brief had claimed. One audit step replaced a deferred follow-on milestone of work (would have been "author proper unified-chipset format for the 5 SCRIBE example cartridges").

11. **Substrate-conformance tests as "canaries in the substrate."** 5 mandatory-pass tests guard the most load-bearing invariants (SQL ↔ TS parity, namespace URI stability, composition graph DAG, citation schema versioning, SVGO BLOCKER opt-outs). They are cheap to author (~70 lines each) and catch the failure modes that would otherwise drift silently for milestones.

12. **Test count tunable from convoy-cost model.** ~16% of fleet token ceiling for 9 components + 1 verification = ~2× under-budget vs. the 5M projected. Future mission specs should tune downward; over-budgeting is safe but signals model-of-fleet-cost is too conservative.

13. **Public deployment via dedicated tool mode.** `npm run ftp-sync:scribe` (added by Component 08 to `tools/ftp-sync.mjs`) is the canonical way to deploy SCRIBE-shaped subsets. Future research-output public deployments should follow the same target-mode pattern rather than authoring per-deployment shell scripts.

14. **CAP-019 reclassification (deferred → runtime-shipped) is allowed.** When a "deferred" capability turns out to be tractable within the milestone scope, reclassify openly in the deployment evidence + VERIFICATION-MATRIX. Do not silently extend scope; the matrix carries the rationale for reviewers.
