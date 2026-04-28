# Lessons — v1.49.575

9 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Milestone:**
   CS25–26 Sweep → GSD Integration
   _⚙ Status: `investigate` · lesson #10027_

2. **Closed:**
   2026-04-25
   _⚙ Status: `investigate` · lesson #10028_

3. **Phases:**
   18 (796–813)
   _⚙ Status: `investigate` · lesson #10029_

4. **Test delta:**
   +331 from baseline 27,556 → 27,887
   _⚙ Status: `investigate` · lesson #10030_

5. **Intake .tex preamble brokenness (warning).**
   The supplied 123KB intake .tex had pre-existing preamble issues that broke the first xelatex pass during Phase 804. The diagnosis (missing biblatex package config, conflicting font-fallback declarations) and the manual fix added ~1.5 hours wall-clock. Not a regression — brokenness inherited from how the intake was generated. But every milestone that takes externally-generated LaTeX as a starting point will re-pay the same debugging cost until we standardize on a known-good preamble at the mission-package generator level.
   _⚙ Status: `investigate` · lesson #10031_

6. **M6 paper count discrepancy (note).**
   A header in some intake materials says "M6 = 13 papers"; the bibliography in the same intake lists 14 entries under M6's section. We preserved 14 throughout — the bibliography was source-of-truth and 14 ADRs landed. The discrepancy is harmless at the artifact level but it's a useful tell: the intake-generation pipeline does not cross-check headers against bibliography. v1.49.576+ ticket should add a cross-check.
   _⚙ Status: `investigate` · lesson #10032_

7. **Pre-existing math-foundations test failures (carry-forward).**
   Two failures in `src/mathematical-foundations/__tests__/integration.test.ts` continued to trip throughout. Per prior STATE memory ("deferred to follow-up") they are explicitly out-of-scope for v1.49.575. The fix is likely a 1-line update to the live-config sub-block iterator that skips the `_comment` metadata key.
   _⚙ Status: `investigate` · lesson #10033_

8. **HB-06 ambiguity-lint sensitivity (note).**
   Calibration ships with zero false positives on 46 in-tree skills. Tightening could surface true positives but risks FP regression; v1.49.576+ work item.
   _⚙ Status: `investigate` · lesson #10034_

9. **CAPCOM gate utilities not yet extracted (deferred).**
   Three uses in v1.49.575 means the abstraction is grounded but a fourth use is needed before extracting `src/safety/capcom-gate-utils/`. The natural fourth is HB-11 Black-Box Skill Stealing threat model when DoltHub federated economy lands.
   _⚙ Status: `investigate` · lesson #10035_
