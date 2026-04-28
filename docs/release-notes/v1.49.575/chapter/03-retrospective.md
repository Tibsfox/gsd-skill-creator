# Retrospective — v1.49.575

## What Worked

- **Parallel fleet dispatch (Wave 1) generalized cleanly from 2 to 3 fleets.** The Wave 1 plan dispatched three background subagent fleets (Track A 14 papers / Track B 19 papers / Track C 21 papers) in parallel from the main context. The pattern that v1.49.572 and v1.49.574 established (engine-uses-subagents memory; main context stays lean) extended cleanly. Each track produced its own audit log, ADR set, and per-track bibliography contributions that merged without conflict. Wall-clock bounded by the slowest fleet (Track C); compression ratio ~3:1 vs sequential.
- **T1-only tier-split discipline carrying forward.** v1.49.572 established the tier-gated Half B pattern. v1.49.575 doubled down: 7 ADOPT modules ship as T1; HB-08..HB-12 (5 reviewed candidates) defer to backlog at milestone-open. The discipline kept the milestone deliverable. Without it, the temptation to absorb 12 reviewed candidates in one milestone would have either blown the wall-clock budget or shipped 12 substrates at lower quality each.
- **Convergent-discovery as keystone narrative.** The convergent-discovery report was the strongest piece of writing in the mission. Naming four anchors and walking the architectural rhyme turned the milestone into something publishable independently of the substrate that landed. The 4,558-word report would stand on its own as a position paper.
- **CAPCOM HARD GATE pattern matured into a copy-paste-with-customization template.** By Phase 812 the four primitives (`isCapcomAuthorized` / `isActivationTriggered` / `emitCapcomGate` / `defaultCapcomMarkerPath`) are the same shape across HB-03, HB-04, HB-07. Three CAPCOM HARD GATES landed; all three pass. The trigger-vs-auth separation works.
- **HB-04 × HB-07 composition discovered in Wave 1, formalized in Wave 2, shipped in Phase 812.** The architecturally most interesting finding of the milestone surfaced naturally through the wave structure. Track A's HB-04 ADR work surfaced the Evolution-extension shape; the convergent-discovery report formalized it; Phase 812 shipped it as load-bearing Half B integration. The wave structure did real work beyond paper-shuffling.

## What Could Be Better

- **Intake .tex preamble brokenness (warning).** The supplied 123KB intake .tex had pre-existing preamble issues that broke the first xelatex pass during Phase 804. The diagnosis (missing biblatex package config, conflicting font-fallback declarations) and the manual fix added ~1.5 hours wall-clock. Not a regression — brokenness inherited from how the intake was generated. But every milestone that takes externally-generated LaTeX as a starting point will re-pay the same debugging cost until we standardize on a known-good preamble at the mission-package generator level.
- **M6 paper count discrepancy (note).** A header in some intake materials says "M6 = 13 papers"; the bibliography in the same intake lists 14 entries under M6's section. We preserved 14 throughout — the bibliography was source-of-truth and 14 ADRs landed. The discrepancy is harmless at the artifact level but it's a useful tell: the intake-generation pipeline does not cross-check headers against bibliography. v1.49.576+ ticket should add a cross-check.
- **Pre-existing math-foundations test failures (carry-forward).** Two failures in `src/mathematical-foundations/__tests__/integration.test.ts` continued to trip throughout. Per prior STATE memory ("deferred to follow-up") they are explicitly out-of-scope for v1.49.575. The fix is likely a 1-line update to the live-config sub-block iterator that skips the `_comment` metadata key.
- **HB-06 ambiguity-lint sensitivity (note).** Calibration ships with zero false positives on 46 in-tree skills. Tightening could surface true positives but risks FP regression; v1.49.576+ work item.
- **CAPCOM gate utilities not yet extracted (deferred).** Three uses in v1.49.575 means the abstraction is grounded but a fourth use is needed before extracting `src/safety/capcom-gate-utils/`. The natural fourth is HB-11 Black-Box Skill Stealing threat model when DoltHub federated economy lands.

## Lessons Learned

# v1.49.575 — Retrospective

**Milestone:** CS25–26 Sweep → GSD Integration
**Closed:** 2026-04-25
**Phases:** 18 (796–813)
**Test delta:** +331 from baseline 27,556 → 27,887
