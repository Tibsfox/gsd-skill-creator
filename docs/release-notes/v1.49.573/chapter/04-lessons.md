# Lessons — v1.49.573

14 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Closed:**
   2026-04-24 on `dev` (status `ready_for_review`; human merge to `main` remains gated)
   _⚙ Status: `investigate` · lesson #9904_

2. **Phases shipped:**
   24 (755 → 778)
   _⚙ Status: `investigate` · lesson #9905_

3. **Waves:**
   11 (W0 → W11)
   _⚙ Status: `investigate` · lesson #9906_

4. **Tests delivered:**
   +712** over the published v1.49.572 baseline (26,699 → 27,411). Itemized to 11 new test clusters: **+576** (4.11× the ≥140 itemized floor; 5.76× the ≥100 milestone floor in CI-equivalent conditions); **+136** additional tests run locally where `www/tibsfox/com/Research/` assets are present. Aggregate raw delta **7.12× the ≥100 floor**.
   _⚙ Status: `investigate` · lesson #9907_

5. **Regressions attributable to v1.49.573:**
   0
   _⚙ Status: `investigate` · lesson #9908_

6. **Pre-existing failures (carried forward, NOT v1.49.573's):**
   2 in `src/mathematical-foundations/__tests__/integration.test.ts`
   _⚙ Status: `investigate` · lesson #9909_

7. **CAPCOM gates:**
   16 of 16 PASS / AUTHORIZED — G0–G14 all PASS · G15 Final AUTHORIZED — including 4 HARD preservation gates (G10/G11/G12/G13) + 1 HARD composition gate (G14) + 1 Safety Warden BLOCK (G7)
   _⚙ Status: `investigate` · lesson #9910_

8. **Duration:**
   single-session autonomous execution between CAPCOM gate boundaries (user authorization 2026-04-24)
   _⚙ Status: `investigate` · lesson #9911_

9. **Model mix:**
   Opus for research-paper phases (M1–M7), W2 synthesis, hard-gate audits, retrospective, dedication; Sonnet for scaffold / module substrate / W9 integration / regression report / README / manifest / archive work; Haiku for W0 foundation
---
   _⚙ Status: `investigate` · lesson #9912_

10. **Cross-module path drift at W1 entry (3 of 7 agents).**
   Three Wave-1 agents (M2, M6, M7) wrote their first-pass `.tex` files to `work/modules/` instead of `work/templates/`. The drift was semantic -- the agents interpreted "module file" as belonging in a `modules/` directory rather than the explicitly-pinned `work/templates/`. Caught and consolidated at W2 entry; no work was lost; cost ~10 minutes of consolidation each.
   _⚙ Status: `investigate` · lesson #10022_

11. **tsc duplicate `classifyLevel` warnings during T2.**
   During the T2 build (Phase 769-772 parallel), `npx tsc --noEmit` produced transient duplicate-symbol warnings for the `classifyLevel` function (used in T2a Experience Compression and surface-imported by T2b for prediction prior weighting). Cleared on T2a completion. Avoidable with prior coordination.
   _⚙ Status: `investigate` · lesson #10023_

12. **The 2 pre-existing math-foundations failures were inherited from v1.49.572.**
   `src/mathematical-foundations/__tests__/integration.test.ts` carries 2 failures from v1.49.572 baseline (live-config flag-state checks). Surfaced at every Phase 769-778 run as a noisy "2 failed" line that agents had to repeatedly diagnose-as-pre-existing. Honest fix would have been a Phase-769.1 cleanup.
   _⚙ Status: `investigate` · lesson #10024_

13. **Skilldex convergence was older than realised.**
   Skilldex (`eess26_2604.16911`) IS the ZFC compliance auditor we'd been planning to build for ~6 milestones (since v1.49.566 or so). Convergent discovery as direct architectural validation, not just citation: the paper landed in our research window and the methodology we'd been independently iterating toward came back to us in peer-reviewed form.
   _⚙ Status: `investigate` · lesson #10025_

14. **Wave 1 floors under-specified what good work looks like.**
   Floors are floors. The seven module agents averaged 2-7x target test counts -- not because the agents were over-engineered, but because each methodology has a natural test surface that the floor under-specified. Lesson: floors should be set by methodology surface, not by uniform sub-target heuristics.
   _⚙ Status: `investigate` · lesson #10026_
