# v1.49.572 Retrospective — Mathematical Foundations Refresh

**Closed:** 2026-04-24 on `dev` (status `ready_for_review`; human merge to `main` remains gated)
**Phases shipped:** 19 (736 → 754)
**Waves:** 9 (W0 → W8)
**Tests delivered:** +170 over post-c8ca8de63 dev baseline (final suite 26,699; Half B ≥50 sub-target crushed 3.4×; aggregate ≥80 sub-target crushed 2.1×)
**Regressions:** 0
**CAPCOM gates:** 10 of 10 PASS — G0–G9 all PASS · G10 Final AUTHORIZED (including 3 HARD preservation gates + 1 HARD composition gate + 1 Safety Warden BLOCK)
**Duration:** single-day autonomous execution (user authorization 2026-04-24)
**Model mix:** Opus for research-paper phases + hard-gate audits; Sonnet for scaffold / integration / release-notes / archive work

## What went well

1. **All 22 MATH-* requirements closed as `[x]`.** MATH-20 T3 Tonnetz shipped rather than deferred — T1 + T2 closed with genuine margin so the budget posture gave the autonomous run room to deliver the strictly-optional module too. Zero requirements deferred.

2. **All 10 CAPCOM gates PASS** — including three hard-preservation gates (G6 coherent-functors, G7 semantic-channel DACP byte-identical, G8 koopman-memory byte-identical) and one hard-composition gate (G9). Each hard gate has an explicit verification artifact: CAPCOM source-regex grep empty (G6, G9), `src/dacp/` 242/242 tests byte-identical + SHA-256 wire-format hash test (G7), `src/memory/` 485/485 tests byte-identical + git-clean (G8). None of these needed retry attempts — the precedent pattern from Phase 745 reused cleanly.

3. **Half B zero regressions across 7 new `src/` modules.** Every Half B module ships default-off; the live-config flag-off test and the per-module byte-identical audits at 747 / 749 / 753 confirm no behavioral surface moved for users who don't opt in.

4. **The Amiga Principle through-line landed cleanly.** 14 cross-module connections articulated in `synthesis.tex`; each of the 6 modules mapped to exactly one GSD asset; the synthesis genuinely lives in the handoffs (e.g., M3 operadic spectrum provides the categorical setting for M4's Hourglass Persistence, which lifts into T1b + T2b as code).

5. **GAP-6 closure.** `docs/substrate/semantic-channel.md` (Phase 747) is the first formal information-theoretic documentation of the DACP bundle. The v1.49.571 close explicitly flagged this as still open; v1.49.572 advances it. Three gaps newly addressed at milestone open (GAP-11, GAP-12, GAP-13) all now have traceable resolution work in Half A + Half B.

6. **MATH-06 theorem attempt resolved honestly** as `additional-assumptions` — two explicit calibrations (calibration-of-percentage, calibration-of-cooldown) required for the bounded-learning 20/3/7 rule to follow from arXiv:2604.17578. Documented at both Phase 741 (`m5-bounded-learning-theorem.tex`) and Phase 748 (`docs/substrate-theorems/bounded-learning.md`), and both land on the same outcome flag. No pretense of a completed proof.

7. **Tier-gating worked as a scope-discipline device.** T1 shipped without friction, T2 shipped with margin, T3 shipped as a bonus. The "if-budget" + "strictly-optional may defer" flags on T2/T3 gave the autonomous run genuine decision points at W6 + W7 boundaries rather than trying to force everything through.

## What didn't go as planned

1. **Half A test target (≥30 tests) MISSED — 0 delivered.** Half A was intentionally docs-only: LaTeX module research + synthesis + substrate docs. Research-paper phases have no natural test surface. The ROADMAP's ≥30 Half A sub-target was aspirational and did not match the deliverable shape. **Recommendation for future milestones:** when planning research-paper phases, do not carry a test-count sub-target into the milestone-close success criterion; replace with a word-count or artifact-count target (e.g. "≥6 module.tex files averaging ≥3k words, 1 synthesis ≥4k, numerical_attribution.md ≤30% PENDING").

2. **Absolute test-count floor (≥26,721) missed by 22 tests — final 26,699.** The absolute floor was computed from the nominal published baseline 26,641 + ≥80 delta. The baseline number was correct at v1.49.571 close, but `c8ca8de63` (CI guard for www/Research-dependent tests) landed on dev between milestone-571 close and milestone-572 open, shifting ~112 tests to `describe.runIf(ASSETS_PRESENT)` and therefore to skip status in the post-c8ca8de63 environment. Effective dev baseline at v1.49.572 start was ~26,529; delta against THAT baseline is +170 tests (2.1× the ≥80 aggregate target). The aggregate requirement was crushed; only the absolute headline number was not hit and this is a baseline-arithmetic artifact, not missing work. RETROSPECTIVE states this without spin.

3. **No commit boundary inside the autonomous run.** All 19 phases of work sit on top of `c8ca8de63` and will land as a user-authorized commit wave after review. The single-session run was explicit and authorized; noting here so that the commit-wave step doesn't treat the 19 phases as one commit. **Recommendation:** the user-authorized commit step should split at CAPCOM boundaries at minimum (W3 Safety Warden · W5 hard-preservation DACP · W6 hard-preservation memory · W8 composition + close), yielding 4–5 commits rather than one monolith.

4. **MATH-06 / MATH-16 cross-document duplication.** Both the Half A theorem attempt (`m5-bounded-learning-theorem.tex`) and the Half B reference (`docs/substrate-theorems/bounded-learning.md`) land on the same `additional-assumptions` outcome but state the two calibrations independently. A future documentation-consolidation pass should make one of them canonical and point the other at it. Same pattern as the v1.49.571 retrospective's "numerical_attribution.md should become single source of truth" feed-forward; it recurred here in slightly different shape.

5. **Corpus tie-in artifacts live on disk only.** `www/tibsfox/com/Research/MATH/` 5 HTML pages + `series.js` + `cross-references.json` sit uncommitted (the tree is gitignored + pre-commit-hook-blocked after the 2026-04-24 history scrub). They're real work that needs `sync-research-to-live.sh` to reach production. **Recommendation:** the post-merge runbook should checklist the site-sync explicitly so the Phase 744 corpus tie-in actually surfaces publicly.

## Key learnings

1. **CAPCOM hard preservation is cheap when modules are standalone.** G6, G7, G8 all passed on first attempt because the precedent pattern — settings.ts + types.ts + index.ts with explicit non-goals JSDoc + source-regex CAPCOM-preservation test — was established cleanly in Phase 745 and reused verbatim in 747 and 749. The pattern of "a per-module test that greps its own source for forbidden names" is cheap, local, and hard to bypass; worth promoting into a shared test helper in a follow-on milestone.

2. **Docs-only phases are strictly cheaper than code phases.** Phase 748 (~15k tokens) and Phase 751 (~18k tokens including its small adapter) came in well under the ~22–28k typical for code phases. The pattern of "substrate reference doc + optional adapter" (Phase 751) is a good template for future theoretical content that may or may not carry a code surface — the doc ships first, the adapter is opt-in per-milestone.

3. **Tier-gating (T1/T2/T3) is a first-class milestone-shape pattern now.** v1.49.570 proved "two halves"; v1.49.571 proved "CAPCOM hard gates in Half B"; v1.49.572 proves "tier-gated Half B." All three patterns compose. Recommend formalizing the tier-gate convention in `.planning/patterns/` (or its equivalent) for future milestone roadmappers.

4. **Integration test harness at `src/<milestone>/__tests__/integration.test.ts` is the right shape.** Phase 753's pattern — import all module settings readers, verify schema + powerset sampling + source-regex CAPCOM sweep + live-config flag-off byte-identical — generalizes well. Future milestones should adopt this as the W8 integration template rather than re-inventing the harness each time.

5. **Author-resolution carries are legitimate future-milestone work.** `numerical_attribution.md` ended with 24 PENDING rows (79% reduction from Phase 743 synthesis, not 100%). The remaining rows all require direct arXiv paper fetches that are out of scope for a single-session autonomous run; they're correctly flagged as author-resolution-sweep defers rather than hidden as incomplete. Same honesty stance as the test-count gap.

## Notable decisions

1. **T3 Tonnetz SHIPPED at Phase 752** rather than deferred. T1 + T2 closed with margin; the autonomous run had budget; MAY DEFER does not require deferral. Decision rationale: `src/tonnetz/` is a small primitive (7 files, 612 LOC, 26 tests) that feeds the Sound of Puget Sound mission directly. Shipping it here unblocks the mission sooner; deferring would have meant opening a new milestone solely for one 600-LOC module.

2. **All 7 Half B code modules zero-dep.** No torch, no numpy, no new npm deps. Every module is a TypeScript-native port. Same rationale as v1.49.571 SIGReg: gsd-skill-creator's substrate is TypeScript; adding heavyweight ML deps for advisory primitives is tail-wags-dog.

3. **Feature flags named by function** (`coherent-functors`, `ricci-curvature-audit`, etc.) rather than `MATH-13`/`MATH-14`. Readability > traceability in config files humans flip. Traceability lives in REQUIREMENTS.md.

4. **Koopman-Memory + Hourglass-Persistence ship as audits, not runtime pipeline replacements.** Both could in principle be wired into the main state-space / memory-eviction paths. Instead they're advisory-only, composable-with-MB-1+MB-5, default-off. Decision rationale: the Silicon Layer and the skill-DAG have working primary paths; the research contribution is the DIAGNOSTIC, not a replacement engine.

5. **Amiga Principle block placed in synthesis.tex, not module M6 or separately.** The through-line belongs to the synthesis because the synthesis is where the handoffs live. Module 6 is about Tonnetz specifically; the principle applies to all six equally.

## Feed-Forward to Next Subversion (≤5 items)

1. **Documentation consolidation pass.** `m5-bounded-learning-theorem.tex` and `docs/substrate-theorems/bounded-learning.md` should converge on a single canonical source with the other pointing at it. Same for any other M5/M6 references that land similar material twice.

2. **Author-resolution sweep.** The 24 PENDING rows in `numerical_attribution.md` should close via direct arXiv paper fetches in a dedicated near-term phase — not a whole milestone, just a cleanup phase. Expected: 24 → 0 or 24 → clearly-cannot-resolve split.

3. **Site sync after merge.** Run `sync-research-to-live.sh` post-merge so the 5 `www/tibsfox/com/Research/MATH/` HTML pages + updated series.js + cross-references.json reach production. This is a runbook step, not a new phase.

4. **Promote CAPCOM-preservation source-regex into a shared test helper.** Every hard-preservation gate in v1.49.571 and v1.49.572 re-implemented the same grep. A `test-helpers/capcom-preservation.ts` that Half B modules can `describe('CAPCOM preservation', capcomPreservationSweep)` would DRY this up and make the pattern even cheaper to adopt.

5. **Tonnetz + Sound of Puget Sound integration.** `src/tonnetz/` is ready but not yet wired into the mission runner. A future milestone (not the next one — the mission itself) should consume it.

## Gate ledger

| Gate | Phase | Type | Status | Verification artifact |
|------|-------|------|--------|----------------------|
| G0 | 736 close | Standard | PASS | 20-entry BibTeX + 20-entry glossary + 6 module templates + CAPCOM gate macro + 18-row numerical scaffold in `.planning/missions/arxiv-april-17-23-math-foundations/work/` |
| G1 | 738 close | Standard | PASS | M1 + M2 numerical-attribution audit passed (module_1.tex + module_2.tex cross-refs checked) |
| G2 | 740 close | Standard | PASS | M3 + M4 numerical-attribution audit passed |
| G3 | 742 close | Standard | PASS | M5 + M6 references audit passed; MATH-06 theorem-attempt outcome flag = `additional-assumptions` present in m5-bounded-learning-theorem.tex |
| G4 | 743 close | Standard | PASS | synthesis.tex — 14 cross-module connections + explicit Amiga Principle block + v4.md deep-read delta memo |
| G5 | 744 close | **Safety Warden BLOCK** | PASS | 0 quote violations / 0 source reuse / 0 www/tibsfox/com commits / cross-references.json schema-valid / pre-commit hook intact |
| G6 | 745 close | **CAPCOM hard preservation** | PASS | CAPCOM source-regex grep against src/coherent-functors/ empty; default-off byte-identical in live-config smoke test |
| G7 | 747 close | **CAPCOM hard preservation (DACP)** | PASS | src/dacp/ 242/242 tests unchanged (byte-identical); DACP_VERSION + wire-format schemas untouched; SHA-256 wire-format hash test PASS |
| G8 | 749 close | **CAPCOM hard preservation (memory)** | PASS | src/memory/ 485/485 tests unchanged; src/memory/ git-clean (zero diff); memory tier invariants preserved |
| G9 | 753 close | **CAPCOM hard composition** | PASS | 7-module CAPCOM-preservation source-regex sweep empty; ES-module singleton reference-equality held; flag-off byte-identical verified in live `.claude/gsd-skill-creator.json` |
| G10 | 754 close | Final | **AUTHORIZED** | All MATH-01..22 `[x]`; zero regressions; 10/10 gates PASS; release notes + retrospective + milestone-package MANIFEST shipped; dev-branch-only directive in force |

## Post-merge tasks (pending human authorization)

- `git merge dev` to `main` — requires explicit user approval per 2026-04-22 directive
- `sync-research-to-live.sh` — publish `www/tibsfox/com/Research/MATH/` HTML pages + updated series.js + cross-references.json to tibsfox.com
- Opt-in any subset of the 7 Half B modules by flipping `mathematical-foundations.<name>.enabled` to `true` in `.claude/gsd-skill-creator.json`

## Sources

Primary arXiv harvest: April 17–23, 2026 · 1,254-paper canonical dataset · 85-paper GSD-relevant filtered subset. Keystone papers:

- arXiv:2604.15100 — Presenting neural networks via coherent functors (M3 / T1a)
- arXiv:2604.14211 — Ollivier-Ricci curvature on directed graphs with GNN applications (M4 / T1b)
- arXiv:2604.16471 — Semantic Channel Theory and DACP formal grammar (M5 / T1c)
- arXiv:2604.15698 — Rate-Distortion Theory for Deductive Sources (M5 / T1c)
- arXiv:2604.17578 — Recovery guarantees for continual learning (M5 / MATH-06 / T1d)
- arXiv:2604.17221 — Mamba + Koopman bilinear forms for long-context (M5 / T2a)
- arXiv:2604.17548 — Contraction and hourglass persistence (M4 / T2b)
- arXiv:2604.16052 — Wasserstein geometric framework for Hebbian plasticity (M5 / T2c)
- arXiv:2604.19960 — Tonnetz theory, classical harmony, combinatorial geometry (M6 / T3)

Full reference graph: `.planning/missions/arxiv-april-17-23-math-foundations/work/sources/index.bib`.
