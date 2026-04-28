# Lessons — v1.49.568

9 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Concept panels benefit from an ~350-char-per-panel first-draft target**
   Plan 01's over-length Rule 1 trim was the tuition; Plans 02+ adopted the target and shipped clean. CONCEPT-AUTHORING.md now codifies the 200-500 char range.
   _⚙ Status: `investigate` · lesson #9877_

2. **`featureFlags.<name>` default-off is the right posture**
   for extensions to live simulation code — zero risk to existing behavior, explicit opt-in preserves auditability. Both Phase 681 flags ship off; dual-flag-on 100-step run is NaN-free.
   _⚙ Status: `investigate` · lesson #9878_

3. **Pandoc + MathJax + section-map YAML**
   is a workable research-publication spine — Phase 680's `scripts/publish/` demonstrates that the Drift milestone can use the same pipeline verbatim.
   _⚙ Status: `investigate` · lesson #9879_

4. **Pragmatic plans beat exhaustive plans for tightly-scoped phases**
   Phases 680, 681, 682, 683 each closed in a single gsd-executor spawn because the milestone-package's 02-test-plan.md + 00-milestone-spec.md provided the constraints directly. For phases with 10+ plans (like 679), the full discuss/plan cycle still pays off.
   _⚙ Status: `investigate` · lesson #9880_

5. **First-draft panel-length overshoot (warning).**
   Phase 679 Plan 01 (Mathematics) panels were drafted over the 200-500 char ceiling on first pass and required Rule 1 trim before first commit. Lesson carried forward to Plans 02-08 successfully (335-397 chars on first pass), and `CONCEPT-AUTHORING.md` now codifies the range — but the first-pass overshoot is worth naming to future authors.
   _⚙ Status: `investigate` · lesson #9974_

6. **REQ NLF-05 satisfied PARTIAL on byte-parity.**
   The reproduction-run requirement was satisfied (pipeline correct), but hand-authored pages exceed the byte-similar threshold. The pipeline correctly reproduces the section-map → pandoc → indexed HTML transformation, but originals had author-specific tweaks the pipeline doesn't replay verbatim. Acceptable per spec; documented for future repro audits.
   _⚙ Status: `investigate` · lesson #9975_

7. **Köhler 10 nm CCN bound mis-estimated on first pass (note).**
   Phase 681 Plan 01 originally bounded the 10 nm CCN at 0.020; Köhler `Sc ∝ r_dry^(-3/2)` gives `Sc ≈ 0.025` at 10 nm. Widened to 0.030 mid-plan. Physics-correct fix; bound now matches the analytical limit.
   _⚙ Status: `investigate` · lesson #9976_

8. **Forest-sim package.json type=commonjs scope (note).**
   Phase 681 Plan 01 added `www/tibsfox/com/Research/forest/package.json` with `{"type":"commonjs"}` because the root package is `type=module`. Scoped the UMD `require()` path for Node-side consumers. Kept simple; no downstream impact, but worth flagging — future `www/` JS modules should expect to need a per-directory package.json scope marker if they target Node.
   _⚙ Status: `investigate` · lesson #9977_

9. **dev-only branch discipline held but waiting on merge gate.**
   Per 2026-04-22 user directive, all work landed on dev; no push to main during this milestone. v1.49.561 (Living Sensoria) and v1.49.568 (this milestone) both queue for human-authorized merge to main, in that order. Merge cadence is the user's call.
   _⚙ Status: `investigate` · lesson #9978_
