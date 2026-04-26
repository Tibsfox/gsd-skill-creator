# v1.49.575 -- CS25-26 Sweep → GSD Integration

**Shipped:** 2026-04-25
**Commits:** 16
**Files changed:** Half A 10 phases (796-805) + Half B 7 modules (806-812) + closing wave (813)
**Phases:** 18 (796-813)
**Plans:** 4 (W0 Foundation → W1 Tracks A+B+C parallel → W2 Synthesis → W3 Publication+Verify) + Half B
**Branch:** dev
**Tag:** v1.49.575
**Tests:** 27,887 passing (vs v1.49.574 baseline 27,556 → +331; 4.1× over the ≥80 floor; 3.3× over the ≥100 stretch)
**Regressions:** 0 net new attributable to v1.49.575
**Pre-existing failures:** 2 (in `src/mathematical-foundations/__tests__/integration.test.ts` — v1.49.572 baseline, NOT v1.49.575)
**CAPCOM HARD GATES:** 3 passed (HB-03 STD calibration, HB-04 W/E/E roles, HB-07 AEL bandit)
**Papers:** 54 priority + 1 anchor = 55 ADRs across 6 modules
**Modules:** M1=4 / M2=10 / M3=8 / M4=11 / M5=8 / M6=14
**Requirements:** 19 (CS25-01..CS25-19)
**Half A PDF:** `docs/release-notes/v1.49.575/cs25_gsd_mission.pdf` — 129 pages, 3-pass XeLaTeX clean
**Bibliography:** `docs/release-notes/v1.49.575/cs25-26-sweep.bib` — 55 biblatex-clean entries

## The fox finds the trail by recognizing the seams the deer made walking it

> The lesson is not that we built it first. The lesson is that the
> patterns are recoverable from outside, by people who never spoke to us,
> who saw the same problem and named it the same way. The fox finds the
> trail by recognizing the seams the deer made walking it. The seams were
> always there. The fox just looks where the path is.

## Summary

Where v1.49.574 asked "what does the kernel-design literature say about
the chipset metaphor?", v1.49.575 asks the more uncomfortable question:
**what does the published CS25–26 literature say about the architectural
decisions GSD has been making since v1.0?** The signal carries the
convergent-discovery validation pattern for the third milestone running.

- **CONVERGENT-DISCOVERY THIRD MILESTONE.** Four anchor papers from the CS25–26 sweep arrive at GSD's load-bearing primitives by independent paths. None cite the GSD ecosystem. None could have — the timing rules it out. The signal is no longer interesting because it's surprising; it's interesting because it's stable. Three milestones in, it is a property of the design space rather than a coincidence.
- **DESIGN-DISCIPLINE LEVEL CALIBRATION.** The published derivations and GSD's field-grown conventions are not formally equivalent. They share a discipline of identifying the minimum coordinating primitive a system needs and replacing the cluster of approximate mechanisms with one carefully-chosen one. We are not claiming we built it first. We are claiming the patterns are recoverable from outside.
- **TIER-1 ONLY HALF B SHIPS SEVEN MODULES.** Seven ADOPT-decision substrate modules ship as T1 (HB-01 through HB-07); five reviewed candidates (HB-08 through HB-12) defer to backlog at milestone-open. The T1 / T2 / T3 tier-split discipline kept the milestone deliverable. Without it, the temptation to absorb 12 reviewed candidates in one milestone would have either blown the wall-clock budget or shipped 12 substrates at lower quality each. Both halves built in parallel.
- **CAPCOM HARD GATE PATTERN MATURED.** The trigger-vs-auth separation matured through the chain v1.49.574 → HB-03 → HB-04 → HB-07. By Phase 812 the pattern was a copy-paste-with-customization template; the four primitives (`isCapcomAuthorized` / `isActivationTriggered` / `emitCapcomGate` / `defaultCapcomMarkerPath`) are the same shape across all three modules. Three CAPCOM HARD GATES landed and all three pass. Each independently authorizes; each fails closed by default.
- **HB-04 × HB-07 KEYSTONE COMPOSITION.** The most architecturally interesting finding of the milestone: HB-04 (Last Harness Worker / Evaluator / Evolution roles) supplies the per-episode adversarial check; HB-07 (AEL fast/slow bandit) supplies the cross-episode reflection-bandit. They compose, they don't collide. The natural composition is HB-07 implementing `EvolutionExtensionPoint` inside HB-04's Evolution role. Both authorizations independently required (the double-gate semantic). Phase 813's `compose-hb04-hb07.test.ts` verifies all four authorization quadrants; only (T,T) accepts a bandit-source proposal.
- **PARALLEL FLEET DISPATCH GENERALIZES.** Wave 1 dispatched three background subagent fleets (Track A: M1+M2 / Track B: M3+M4 / Track C: M5+M6) in parallel from the main context. Wall-clock was bounded by the slowest fleet (Track C, 21 papers) rather than the sum. Compression ratio relative to sequential execution was approximately 3:1 — the same numerical relationship v1.49.574's Half A achieved with its Track A+B parallelism. The pattern generalizes from 2 to 3 fleets without coordination cost growth.

## Half A — Deep research deliverable

The supplied 4-wave plan executed verbatim:

| Wave | Shape | Output |
|---|---|---|
| W0 Foundation | sequential, ~80k tokens | ADR template + 55-entry bibliography skeleton + citation index |
| W1 Track A research | M1+M2, 14 papers, ~240k tokens | ADRs covering historical lineage + skill-authoring substrate |
| W1 Track B research | M3+M4, 19 papers, ~240k tokens | ADRs covering safety / evaluation / harness designs |
| W1 Track C research | M5+M6, 21 papers, ~240k tokens | ADRs covering retrieval / orchestration / federated economy |
| W2 Synthesis | sequential, Opus-heavy, ~230k tokens | cross-module matrix (81 connections, 9 cross-cuts), convergent-discovery report (4 anchors, 4,558 words), GSD architectural impact analysis (4,329 words / 12 subsystems / 19 dispositions), 12 integration specs HB-01..HB-12 |
| W3 Publication + verification | sequential, ~210k tokens | 129-page mission PDF (3-pass clean), biblatex-clean bib, CLAUDE.md / SKILL.md draft diffs, safety harness updates doc, 57-row verification matrix, index landing page |

**Convergent-discovery anchors:**

| arXiv ID | Title | Mirrors GSD primitive |
|---|---|---|
| `2604.21910` | Skills-as-md | three-tier vision-to-mission / research-mission-generator / skill-creator pipeline |
| `2604.21744` | GROUNDINGmd | CLAUDE.md Hard Constraints + Convention Parameters / Safety Warden BLOCK |
| `2604.20874` | Root Theorem of Context Engineering | bounded-tape framing — formal foundation of CAPCOM gating, fresh-context verification, accumulate–compress–rewrite–shed milestone retrospective lifecycle |
| `2604.21003` | Last Harness | external description of skill-creator — Worker / Evaluator / Evolution role split adoptable as HB-04 |

## Half B — Tier-1 only, 7 ADOPT-decision modules

All modules default-off via `.claude/gsd-skill-creator.json` `cs25-26-sweep`
block. Activating any flag is a deliberate operator decision; HB-03,
HB-04, and HB-07 additionally require CAPCOM hard-preservation sign-off.

| ID | Path | Tests | Source | CAPCOM HARD |
|---|---|---|---|---|
| HB-01 Tool Attention | `src/orchestration/tool-attention/` | 49 | `2604.21816` | — |
| HB-02 AgentDoG schema | `src/safety/agentdog/` | 48 | `2601.18491` | — |
| HB-03 STD calibration | `src/safety/std-calibration/` | 44 | `2604.20911` | **YES** |
| HB-04 W/E/E roles | `src/skill-creator/roles/` | 47 | `2604.21003` | **YES** |
| HB-05 Five-Principle linter | `src/cartridge/linter/structural-completeness.ts` | 47 | `2604.21090` | — |
| HB-06 Ambiguity linter | `src/cartridge/linter/ambiguity.ts` | 25 | `2604.21505` | — |
| HB-07 AEL bandit | `src/skill-creator/auto-load/` | 47 | `2604.21725` | **YES** |
| Phase 813 integration | `src/__tests__/cs25-26-sweep-integration/` | 24 (+1 todo) | this milestone | — |

User guides for each Half B module live under
`docs/release-notes/v1.49.575/user-guides/`.

### Part A: Convergent Discovery Research

Full deep research covering the four anchor papers as published external
calibration of GSD's load-bearing primitives, the cross-module synthesis
that names the rhymes, and the convergent-discovery framing that turns
four independent peer-reviewed works into the third successive milestone
of design-discipline-level validation:

- **SKILLS-AS-MD ANCHOR (`2604.21910`):** Garner et al. publish the three-tier separation of LLM intent extraction (semantic) / deterministic transformation (gate-able) / domain-expert authoring (markdown). Same separation as vision-to-mission / research-mission-generator / skill-creator. Different vocabulary, same structural commitment. Foundation of HB-04's adoption decision.
- **GROUNDINGMD ANCHOR (`2604.21744`):** Published independent rediscovery of the CLAUDE.md + Safety Warden BLOCK pattern. Names the Hard Constraints (refusable) / Convention Parameters (typed-overridable) two-class taxonomy that the existing pattern had been doing without a name. Same structural defence against prompt-injection. Different framing.
- **ROOT THEOREM ANCHOR (`2604.20874`):** Formal foundation (two axioms, five derived consequences) for treating the agent's working context as a bounded lossy channel. Justifies CAPCOM gating on fidelity thresholds rather than capacity, fresh-context-subagent verification, and the accumulate–compress–rewrite–shed milestone retrospective lifecycle. The 20% / 3-correction / 7-day cooldown bounded-learning caps are anchored on C1 (monotone decay independent of nominal window size).
- **LAST HARNESS ANCHOR (`2604.21003`):** External description of skill-creator including the Worker / Evaluator / Evolution role split that HB-04 ships. The W/E/E paper names what the existing six-step loop already does. Says nothing about cross-episode policy update — that is out-of-scope for it. The shape is recoverable from outside.
- **CROSS-MODULE MATRIX (81 connections, 9 cross-cuts):** Wave 2 synthesis produced an explicit dependency / overlap matrix linking the 55 ADRs across modules M1-M6. The 9 cross-cuts identify themes that recur across modules — from CAPCOM gating to bandit-shaped policy update to the W/E/E role separation. The matrix is the substrate the Half B integration specs HB-01..HB-12 are built on.
- **CONVERGENT-DISCOVERY REPORT (4,558 words):** Naming four anchors and walking the architectural rhyme between published derivation and GSD's grown convention turned the milestone into something publishable independently of the substrate that landed. Would stand on its own as a position paper.
- **ARCHITECTURAL IMPACT ANALYSIS (4,329 words / 12 subsystems / 19 dispositions):** Wave 2's second synthesis output enumerates each GSD subsystem touched by the sweep, classifies the disposition (ADOPT / ADAPT / DEFER / REJECT / WATCH), and gives a one-paragraph rationale. The 19-disposition output is the input the Half B implementation work consumes.
- **129-PAGE MISSION PDF (3-pass XeLaTeX clean):** The W3 publication deliverable — `cs25_gsd_mission.pdf` — combines all 6 modules, the 55-entry bibliography, the cross-module matrix, the convergent-discovery report, and the architectural impact analysis into one citable artifact. Bibliography is biblatex-clean; the .tex preamble fix added approximately 1.5 hours to Phase 804 wall-clock but is a one-time cost per intake-generation pipeline.

### Part B: Substrate Implementation

Full deep implementation covering the seven Half B substrate modules as
default-off ADOPT-decision shipping artifacts plus the closing-wave
integration shape that ties HB-04 and HB-07 into a load-bearing
double-gate composition:

- **HB-01 TOOL ATTENTION (49 tests, `2604.21816`):** Quantifies the MCP Tax at 10k–60k tokens per turn and gives the orchestration layer a measured baseline for tool-context budget management. ISO score / gate / load / budget contract at `src/orchestration/tool-attention/`. Disabled-result sentinel pinned in flag-off byte-identical fixture.
- **HB-02 AGENTDOG SCHEMA (48 tests, `2601.18491`):** Where / how / what diagnostic taxonomy adopted as a typed schema at `src/safety/agentdog/`. Provides the safety substrate's structural envelope for failure classification. `AGENTDOG_DISABLED_RESULT` sentinel verified byte-identical when flag off.
- **HB-03 STD CALIBRATION (44 tests, `2604.20911`, **CAPCOM HARD GATE**):** Generalizes the marker-file CAPCOM pattern from v1.49.574's HB-04 of the megakernel substrate to the safety-harness layer. Trigger marker `.planning/safety/std-calibration.trigger`; auth marker `.planning/safety/std-calibration.capcom`. Engagement requires non-empty contents in CAPCOM marker; trigger presence does not authorize. PASS in Phase 813 fixture.
- **HB-04 W/E/E ROLES (47 tests, `2604.21003`, **CAPCOM HARD GATE**):** Worker / Evaluator / Evolution role split shipping at `src/skill-creator/roles/`. Adds the conservative-default policy: flag-on + no-auth degrades to single-role rather than refusing entirely. Provides the `EvolutionExtensionPoint` that HB-07 plugs into. Trigger marker `.planning/skill-creator/weler-roles.trigger`; auth marker `.planning/skill-creator/weler-roles.capcom`. PASS in Phase 813 fixture.
- **HB-05 FIVE-PRINCIPLE LINTER (47 tests, `2604.21090`):** Structural-completeness linter at `src/cartridge/linter/structural-completeness.ts`. Promotion-gate non-blocking when off; pure linter regardless of flag. Substrate input the future DryRUN test-synthesis path (deferred HB-09) would close gaps in.
- **HB-06 AMBIGUITY LINTER (25 tests, `2604.21505`):** Cartridge ambiguity-detection linter at `src/cartridge/linter/ambiguity.ts`. Calibration ships with zero false positives on 46 in-tree skills. Tightening for true positives is a v1.49.576+ work item; current calibration prioritizes FP avoidance.
- **HB-07 AEL BANDIT (47 tests, `2604.21725`, **CAPCOM HARD GATE**):** Adaptive Episodic Learning fast/slow bandit at `src/skill-creator/auto-load/`. Adds the double-gate semantic: a bandit-source policy update requires two independent authorizations (HB-04 role-split-activation gate + HB-07 engagement-CAPCOM gate). Trigger `.planning/skill-creator/ael-bandit.trigger`; auth `.planning/skill-creator/ael-bandit.capcom`. PASS in Phase 813 fixture.
- **PHASE 813 CLOSING-WAVE INTEGRATION (24 tests + 1 todo):** `src/__tests__/cs25-26-sweep-integration/` includes `compose-hb04-hb07.test.ts` (verifies all four authorization quadrants; only (T,T) accepts a bandit-source proposal), `flag-off-aggregate-byte-identical.test.ts` (asserts byte-identical aggregate output across all 7 flags off vs no-block baseline), and CAPCOM HARD GATE summary fixture. The closing-wave shape — 4 integration tests + regression report + 7 user guides + README + retrospective — is reusable for v1.49.576+ closing waves.

### Retrospective

The convergent-discovery framing carried over from v1.49.573 + v1.49.574
and tightened. Three milestones in, we can call the validation a property
of the design space rather than a coincidence.

#### What Worked

- **Parallel fleet dispatch (Wave 1) generalized cleanly from 2 to 3 fleets.** The Wave 1 plan dispatched three background subagent fleets (Track A 14 papers / Track B 19 papers / Track C 21 papers) in parallel from the main context. The pattern that v1.49.572 and v1.49.574 established (engine-uses-subagents memory; main context stays lean) extended cleanly. Each track produced its own audit log, ADR set, and per-track bibliography contributions that merged without conflict. Wall-clock bounded by the slowest fleet (Track C); compression ratio ~3:1 vs sequential.
- **T1-only tier-split discipline carrying forward.** v1.49.572 established the tier-gated Half B pattern. v1.49.575 doubled down: 7 ADOPT modules ship as T1; HB-08..HB-12 (5 reviewed candidates) defer to backlog at milestone-open. The discipline kept the milestone deliverable. Without it, the temptation to absorb 12 reviewed candidates in one milestone would have either blown the wall-clock budget or shipped 12 substrates at lower quality each.
- **Convergent-discovery as keystone narrative.** The convergent-discovery report was the strongest piece of writing in the mission. Naming four anchors and walking the architectural rhyme turned the milestone into something publishable independently of the substrate that landed. The 4,558-word report would stand on its own as a position paper.
- **CAPCOM HARD GATE pattern matured into a copy-paste-with-customization template.** By Phase 812 the four primitives (`isCapcomAuthorized` / `isActivationTriggered` / `emitCapcomGate` / `defaultCapcomMarkerPath`) are the same shape across HB-03, HB-04, HB-07. Three CAPCOM HARD GATES landed; all three pass. The trigger-vs-auth separation works.
- **HB-04 × HB-07 composition discovered in Wave 1, formalized in Wave 2, shipped in Phase 812.** The architecturally most interesting finding of the milestone surfaced naturally through the wave structure. Track A's HB-04 ADR work surfaced the Evolution-extension shape; the convergent-discovery report formalized it; Phase 812 shipped it as load-bearing Half B integration. The wave structure did real work beyond paper-shuffling.

#### What Could Be Better

- **Intake .tex preamble brokenness (warning).** The supplied 123KB intake .tex had pre-existing preamble issues that broke the first xelatex pass during Phase 804. The diagnosis (missing biblatex package config, conflicting font-fallback declarations) and the manual fix added ~1.5 hours wall-clock. Not a regression — brokenness inherited from how the intake was generated. But every milestone that takes externally-generated LaTeX as a starting point will re-pay the same debugging cost until we standardize on a known-good preamble at the mission-package generator level.
- **M6 paper count discrepancy (note).** A header in some intake materials says "M6 = 13 papers"; the bibliography in the same intake lists 14 entries under M6's section. We preserved 14 throughout — the bibliography was source-of-truth and 14 ADRs landed. The discrepancy is harmless at the artifact level but it's a useful tell: the intake-generation pipeline does not cross-check headers against bibliography. v1.49.576+ ticket should add a cross-check.
- **Pre-existing math-foundations test failures (carry-forward).** Two failures in `src/mathematical-foundations/__tests__/integration.test.ts` continued to trip throughout. Per prior STATE memory ("deferred to follow-up") they are explicitly out-of-scope for v1.49.575. The fix is likely a 1-line update to the live-config sub-block iterator that skips the `_comment` metadata key.
- **HB-06 ambiguity-lint sensitivity (note).** Calibration ships with zero false positives on 46 in-tree skills. Tightening could surface true positives but risks FP regression; v1.49.576+ work item.
- **CAPCOM gate utilities not yet extracted (deferred).** Three uses in v1.49.575 means the abstraction is grounded but a fourth use is needed before extracting `src/safety/capcom-gate-utils/`. The natural fourth is HB-11 Black-Box Skill Stealing threat model when DoltHub federated economy lands.

### Lessons Learned

1. **Convergent discovery is now a property of the design space, not a coincidence.** Three milestones in (v1.49.573 + v1.49.574 + v1.49.575), patterns from independent peer-reviewed work keep matching GSD's field-grown conventions. Continue the framing: name anchors, walk the rhyme, do not over-claim formal equivalence. Design-discipline level is the right calibration.
2. **Tier-split discipline (T1 / T2 / T3) is what makes Half B deliverable.** Resist the temptation to ship every reviewed candidate in one milestone. Backlog deferral keeps the deferred candidates as visible work products, not forgotten ones. Each deferral gets a stated promotion trigger; review at next milestone-open.
3. **CAPCOM HARD GATE = trigger-vs-auth separation, conservative default.** Two distinct marker files: trigger ("I asked") vs auth ("it's authorized"). Conservative-default policy: flag-on + no-auth degrades gracefully (HB-04: single-role; HB-07: refuses without erroring) rather than refusing entirely or silently engaging.
4. **Double-gate semantic is the right shape for composed CAPCOM modules.** When two CAPCOM-gated modules compose (HB-04 + HB-07), require both authorizations independently. The four-quadrant test (auth × auth ∈ {T,F}²) is the load-bearing fixture; only (T,T) accepts.
5. **Engine-uses-subagents pattern generalizes from 2 to 3 parallel fleets.** Compression ratio ~3:1 holds at 3 fleets without coordination cost growth. Audit-log-per-track discipline keeps the main context lean. Pattern is reusable for future deep-research milestones with module count ≥ 3.
6. **The closing-wave shape is reusable.** 4 integration tests + regression report + 7 user guides + README + retrospective, all per-spec. v1.49.576+ closing waves should template against this shape.
7. **Externally-generated LaTeX intake re-pays a preamble-debugging tax every milestone.** Standardize on a known-good preamble at the mission-package generator level; until then, budget ~1.5 hours per milestone for preamble fixes.
8. **Intake-generation pipelines need header / bibliography cross-checks.** The M6 "13 vs 14" discrepancy is a pipeline tell. Cross-check headers against bibliography to catch it at intake-time, not at synthesis-time.
9. **Pre-existing test failures should be triaged, not absorbed into milestone scope.** The two math-foundations failures are inherited from v1.49.572 and explicitly out-of-scope for v1.49.575. Document them in REGRESSION.md, name the fix shape, defer to a v1.49.576+ ticket.
10. **CAPCOM gate utilities extraction waits for a fourth use.** Three diverse uses (HB-03 safety / HB-04 skill-creator roles / HB-07 skill-creator auto-load) plus one stress test = grounded abstraction. Do not extract on three; wait for the fourth (likely HB-11 when DoltHub federated economy lands).

### Cross-References

| Connection | Significance |
|---|---|
| **arXiv:2604.21910 Skills-as-md** | **CONVERGENT-DISCOVERY ANCHOR.** Three-tier vision-to-mission / research-mission-generator / skill-creator pipeline published independently as the three-tier semantic / deterministic / authoring separation. |
| **arXiv:2604.21744 GROUNDINGmd** | **CONVERGENT-DISCOVERY ANCHOR.** CLAUDE.md Hard Constraints + Convention Parameters / Safety Warden BLOCK published independently as the two-class taxonomy. |
| **arXiv:2604.20874 Root Theorem of Context Engineering** | **CONVERGENT-DISCOVERY ANCHOR.** Bounded-tape framing as derived consequence of two axioms; formal foundation of CAPCOM gating, fresh-context verification, accumulate–compress–rewrite–shed lifecycle. |
| **arXiv:2604.21003 Last Harness** | **CONVERGENT-DISCOVERY ANCHOR.** External description of skill-creator including Worker / Evaluator / Evolution role split that HB-04 ships. |
| **arXiv:2604.21816 Tool Attention** | **HB-01 SOURCE.** Quantifies MCP Tax at 10k–60k tokens per turn; gives orchestration the measured baseline. |
| **arXiv:2601.18491 AgentDoG** | **HB-02 SOURCE.** Where / how / what diagnostic taxonomy adopted as typed schema. |
| **arXiv:2604.20911 STD calibration** | **HB-03 SOURCE.** Generalizes marker-file CAPCOM pattern to safety-harness layer. |
| **arXiv:2604.21090 Five-Principle linter** | **HB-05 SOURCE.** Structural-completeness lint substrate. |
| **arXiv:2604.21505 Ambiguity linter** | **HB-06 SOURCE.** Cartridge ambiguity detection. |
| **arXiv:2604.21725 AEL bandit** | **HB-07 SOURCE.** Adaptive Episodic Learning fast/slow bandit; double-gate composition with HB-04. |
| **v1.49.570** | **PRIOR MILESTONE.** Foundation milestone in the v1.49.5xx convergent-discovery thread. |
| **v1.49.571** | **PRIOR MILESTONE.** Last main-merged tip; v1.49.572 + v1.49.573 + v1.49.574 + v1.49.575 queue together for human-authorized merge. |
| **v1.49.572** | **PRIOR MILESTONE.** Mathematical-foundations milestone; established tier-gated Half B pattern; pre-existing live-config test failures inherit from here. |
| **v1.49.573** | **PRIOR MILESTONE.** First convergent-discovery milestone; seven anchors across heterogeneous prior work. |
| **v1.49.574** | **PRIOR MILESTONE.** Second convergent-discovery milestone; SIGReg ↔ counter-based megakernel rhyme; introduced marker-file CAPCOM pattern at megakernel HB-04 that v1.49.575 HB-03 generalizes. |
| **`docs/release-notes/v1.49.575/cs25_gsd_mission.pdf`** | **MISSION PDF.** 129 pages, 3-pass XeLaTeX clean, biblatex-clean bibliography. |
| **`docs/release-notes/v1.49.575/cs25-26-sweep.bib`** | **BIBLIOGRAPHY.** 55 biblatex-clean entries. |
| **`docs/release-notes/v1.49.575/verification-matrix.md`** | **VERIFICATION MATRIX.** 57-row evidence ledger. |
| **`docs/release-notes/v1.49.575/REGRESSION.md`** | **REGRESSION REPORT.** Full Phase 813 regression narrative. |
| **`docs/release-notes/v1.49.575/RETROSPECTIVE.md`** | **RETROSPECTIVE.** Per-wave wall-clock + composition findings + forward citations. |
| **`docs/release-notes/v1.49.575/safety-harness-updates.md`** | **SAFETY HARNESS UPDATES.** Substrate updates documented for downstream review. |
| **`docs/release-notes/v1.49.575/CLAUDE-md.diff`** | **CLAUDE.md DRAFT DIFF.** External-citations section update for the four anchors. |
| **`docs/release-notes/v1.49.575/SKILL-md-additions.diff`** | **SKILL.md DRAFT DIFF.** SKILL.md additions for the four anchors. |
| **`docs/release-notes/v1.49.575/user-guides/tool-attention.md`** | **HB-01 USER GUIDE.** |
| **`docs/release-notes/v1.49.575/user-guides/agentdog-schema.md`** | **HB-02 USER GUIDE.** |
| **`docs/release-notes/v1.49.575/user-guides/std-calibration.md`** | **HB-03 USER GUIDE.** |
| **`docs/release-notes/v1.49.575/user-guides/weler-roles.md`** | **HB-04 USER GUIDE.** |
| **`docs/release-notes/v1.49.575/user-guides/structural-completeness-lint.md`** | **HB-05 USER GUIDE.** |
| **`docs/release-notes/v1.49.575/user-guides/ambiguity-lint.md`** | **HB-06 USER GUIDE.** |
| **`docs/release-notes/v1.49.575/user-guides/ael-bandit.md`** | **HB-07 USER GUIDE.** |
| **`.planning/missions/cs25-26-sweep/work/synthesis/convergent-discovery.md`** | **CONVERGENT-DISCOVERY REPORT.** 4,558-word position-paper-grade synthesis. |
| **`.planning/missions/cs25-26-sweep/work/synthesis/impact.md`** | **ARCHITECTURAL IMPACT ANALYSIS.** 4,329 words / 12 subsystems / 19 dispositions. |

### Test Coverage Progression

| Milestone | Tests Passing | Net Delta | Cumulative since v1.49.570 |
|---|---|---|---|
| v1.49.570 baseline | (prior) | — | — |
| v1.49.573 close | 27,411 | (prior) | — |
| v1.49.574 close (baseline for 575) | 27,556 | +145 from 573 | — |
| v1.49.575 close | **27,887** | **+331** | +331 in this milestone |
| Floor target | ≥+80 | met **4.1×** over | — |
| Stretch target | ≥+100 | met **3.3×** over | — |

Per-HB-module breakdown (Half B implementation tests): HB-01=49, HB-02=48,
HB-03=44, HB-04=47, HB-05=47, HB-06=25, HB-07=47, Phase 813
integration=24 (+1 todo). Sum = 331.

### Backlog deferred (HB-08..HB-12 — v1.49.576+)

- **HB-08** AGS/RPS chipset divergence metrics — `2604.21255`. Promote when chipset measurement work surfaces a need to quantify per-chipset drift.
- **HB-09** DryRUN test-synthesis path for skill validation — `2604.21598`. Promote when HB-05's structural-completeness linter starts producing false negatives at sufficient rate.
- **HB-10** IRAP 5-round elicitation cap for vision-to-mission — `2604.21380`. Promote when vision-to-mission elicitation friction exceeds 5-round threshold.
- **HB-11** Black-Box Skill Stealing threat model for DoltHub federated economy — `2604.21829`. Promote when DoltHub federated skill economy lands.
- **HB-12** FSFM 4-class forgetting taxonomy for bounded-learning policy — `2604.20300`. Promote when bounded-learning policy is ready for a formalized forgetting-taxonomy upgrade.

### Convergent-discovery validation

Four independent peer-reviewed works arrive at GSD's load-bearing patterns
from four problem domains. The signal is at the **design-discipline
level**, not at the theorem level — the published derivations and GSD's
field-grown conventions are not formally equivalent. They share a
discipline of identifying the minimum coordinating primitive a system
needs and replacing the cluster of approximate mechanisms with one
carefully-chosen one.

The pattern is now the keystone narrative across three consecutive
milestones:

- **v1.49.573** — seven convergent-discovery anchors across heterogeneous prior work.
- **v1.49.574** — SIGReg ↔ counter-based megakernel rhyme.
- **v1.49.575** — four CS25–26 anchors arriving at the same Skills-as-md / GROUNDINGmd / Root-Theorem / Last-Harness primitives.

### Infrastructure

- **Mission PDF:** `docs/release-notes/v1.49.575/cs25_gsd_mission.pdf` (129 pages, 3-pass XeLaTeX clean)
- **Bibliography:** `docs/release-notes/v1.49.575/cs25-26-sweep.bib` (55 biblatex-clean entries)
- **Integration specs:** `.planning/missions/cs25-26-sweep/work/synthesis/specs/` (HB-01 .. HB-12 + README)
- **ADRs:** `.planning/missions/cs25-26-sweep/work/modules/{M1..M6}/`
- **Convergent-discovery report:** `.planning/missions/cs25-26-sweep/work/synthesis/convergent-discovery.md` (4,558 words)
- **Architectural impact analysis:** `.planning/missions/cs25-26-sweep/work/synthesis/impact.md` (4,329 words / 12 subsystems / 19 dispositions)
- **Verification matrix:** `docs/release-notes/v1.49.575/verification-matrix.{md,csv}` (57 rows)
- **Regression report:** `docs/release-notes/v1.49.575/REGRESSION.md`
- **Retrospective:** `docs/release-notes/v1.49.575/RETROSPECTIVE.md`
- **User guides:** `docs/release-notes/v1.49.575/user-guides/` (7 files: HB-01 through HB-07)
- **Safety harness updates:** `docs/release-notes/v1.49.575/safety-harness-updates.md`
- **CLAUDE.md draft diff:** `docs/release-notes/v1.49.575/CLAUDE-md.diff`
- **SKILL.md draft diff:** `docs/release-notes/v1.49.575/SKILL-md-additions.diff`
- **Index landing page:** `docs/release-notes/v1.49.575/index.html`

## Dedications

This milestone closes with thanks to:

- **Anthropic Claude Opus 4.7** — the sweep reviewer that filtered 930 CS25–26 candidate papers down to the 54 priority works that became this mission.
- **Garner et al.** — *Skills-as-md* authors (`2604.21910`); the published derivation of the three-tier authoring pipeline.
- **GROUNDINGmd authors** (`2604.21744`) — for naming the Hard Constraints / Convention Parameters split that the CLAUDE.md + Safety Warden BLOCK pattern had been doing without a name.
- **Root Theorem author** (`2604.20874`) — for the formal foundation that turned bounded-tape framing from an empirical convention into a derived consequence of two axioms.
- **Last Harness authors** (`2604.21003`) — for the external description of skill-creator, including the Worker / Evaluator / Evolution role split that HB-04 ships.
- **Tool Attention authors** (`2604.21816`) — for quantifying the MCP Tax at 10k–60k tokens per turn and giving HB-01 its measured baseline.
- **AgentDoG authors** (`2601.18491`) — for the where / how / what diagnostic taxonomy that HB-02 adopts.

## Branch state

- `dev` working branch: tip after milestone-close commit.
- `main`: at v1.49.571 merge tip; v1.49.572 + v1.49.573 + v1.49.574 + v1.49.575 queue together for human-authorized merge.
- `v1.50` branch: deferred per 2026-04-13 directive.
