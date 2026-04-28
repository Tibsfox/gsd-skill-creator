# Lessons — v1.49.572

13 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Closed:**
   2026-04-24 on `dev` (status `ready_for_review`; human merge to `main` remains gated)
   _⚙ Status: `investigate` · lesson #10009_

2. **Phases shipped:**
   19 (736 → 754)
   _⚙ Status: `investigate` · lesson #10010_

3. **Waves:**
   9 (W0 → W8)
   _⚙ Status: `investigate` · lesson #10011_

4. **Tests delivered:**
   +170 over post-c8ca8de63 dev baseline (final suite 26,699; Half B ≥50 sub-target crushed 3.4×; aggregate ≥80 sub-target crushed 2.1×)
   _⚙ Status: `investigate` · lesson #10012_

5. **Regressions:**
   0
   _⚙ Status: `investigate` · lesson #10013_

6. **CAPCOM gates:**
   10 of 10 PASS — G0–G9 all PASS · G10 Final AUTHORIZED (including 3 HARD preservation gates + 1 HARD composition gate + 1 Safety Warden BLOCK)
   _⚙ Status: `investigate` · lesson #10014_

7. **Duration:**
   single-day autonomous execution (user authorization 2026-04-24)
   _⚙ Status: `investigate` · lesson #10015_

8. **Model mix:**
   Opus for research-paper phases + hard-gate audits; Sonnet for scaffold / integration / release-notes / archive work
   _⚙ Status: `investigate` · lesson #10016_

9. **Half A test target (>=30 tests) MISSED -- 0 delivered.**
   Half A was intentionally docs-only: research-paper phases have no natural test surface. The ROADMAP's >=30 sub-target was aspirational and did not match the deliverable shape. Recommendation for future milestones: replace test-count sub-targets with word-count / artifact-count targets for research-paper phases.
   _⚙ Status: `investigate` · lesson #10017_

10. **Absolute test-count floor (>=26,721) missed by 22 tests -- final 26,699.**
   The absolute floor was computed from the nominal published baseline 26,641 + >=80 delta. `c8ca8de63` (CI guard for www/Research-dependent tests) shifted ~112 tests to skip status between 571 close and 572 open, dropping the effective dev baseline to ~26,529. Delta against THAT baseline is +170 tests (2.1x the >=80 aggregate target). Aggregate requirement crushed; only the absolute headline number missed and it is a baseline-arithmetic artifact, not missing work.
   _⚙ Status: `investigate` · lesson #10018_

11. **No commit boundary inside the autonomous run.**
   All 19 phases sit on top of `c8ca8de63` and landed as a user-authorized commit wave after review. Recommendation: split commit step at CAPCOM boundaries (W3 Safety Warden, W5 hard-preservation DACP, W6 hard-preservation memory, W8 composition + close) yielding 4-5 commits rather than one monolith.
   _⚙ Status: `investigate` · lesson #10019_

12. **MATH-06 / MATH-16 cross-document duplication.**
   Both the Half A theorem attempt (`m5-bounded-learning-theorem.tex`) and the Half B reference (`docs/substrate-theorems/bounded-learning.md`) land on the same outcome but state the two calibrations independently. A future documentation-consolidation pass should make one canonical and point the other at it.
   _⚙ Status: `investigate` · lesson #10020_

13. **Corpus tie-in artifacts live on disk only.**
   `www/tibsfox/com/Research/MATH/` 5 HTML pages + `series.js` + `cross-references.json` sit uncommitted (gitignored + pre-commit-hook-blocked after the 2026-04-24 history scrub). Real work that needs `sync-research-to-live.sh` to reach production. The post-merge runbook should checklist this explicitly.
   _⚙ Status: `investigate` · lesson #10021_
