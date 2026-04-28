# 04 — Lessons Learned: v1.49.584 Forward Lessons

## 12 forward lessons emitted (#10156–#10167)

These lessons are added to the cumulative lessons-learned database for application by future milestones.

### Process lessons (apply to ship-pipeline architecture)

**Lesson #10156 — Combined three-phase milestone is operationally productive when phases share substrate.**
Severity: HIGH. Combines polish + citation triage + forward-build in a single ship. Net efficiency: ~50% scope multiplier for ~30% pipeline overhead. Recommended pattern when prior milestone surfaces (a) polish-debt items, (b) citation-debt items, (c) natural forward-cadence subject. Applicable across NASA / MUS / ELC ship cadence.

**Lesson #10157 — V-flag citation triage frequently surfaces fact corrections.**
Severity: HIGH. ~36% of carried V-flags revealed substantive factual errors at v1.49.584. Future V-flag triage sprints should plan agent budget for both citation-lookup AND citation-correction work. Apply when triaging ≥10 V-flags at once.

**Lesson #10158 — Mid-flight fact corrections should be applied by main context, not queued to finishing agents.**
Severity: MEDIUM. SendMessage queueing risks delivery-after-agent-completion. Apply correction inline in main context when discovered mid-flight; never depend on a finishing agent to apply a fact correction queued during its wrap-up.

**Lesson #10159 — Cross-track scorer specs should be cross-checked for inconsistencies.**
Severity: LOW. MUS vs ELC Pedagogical Takeaway regex inconsistency caused scorer-iteration overhead. Future scorer-spec audits should verify regex/criterion consistency across MUS + ELC + future scorer tracks.

**Lesson #10160 — Concept-registry .ts files for new MUS subject-specs must be authored alongside subject-spec.json.**
Severity: MEDIUM. MUS scorer criterion 8 (concept-registry entry) requires `.college/departments/music/concepts/<domain>/<id>.ts`. Build agent prompt template needs explicit Phase C deliverable for MUS concept-registry. Apply: update `wrap:execute` MUS-track wrapper to include concept-registry authoring step.

**Lesson #10163 — `flight-hardware-mapping.csv` back-fill is a standard Phase D step.**
Severity: LOW. Benign-warning state in ELC scorer is an early-warning signal. Phase D checklist should include flight-hardware-mapping.csv append-row as standard, not on-discovery.

### Architectural lessons (apply to thread-state management)

**Lesson #10161 — GRACEFUL-ATTRITION is the operational complement of PERSISTENT-CONSTELLATION-LISTENER.**
Severity: HIGH. PCL = sustained mode; GA = attritional mode. Multi-platform multi-decade missions require both. Future degrees framing multi-platform multi-decade systems should explicitly braid both threads. Watchlist: when introducing a new multi-platform-or-multi-decade subject, check both PCL and GA thread states for extension opportunities.

**Lesson #10162 — MUS Pass-1 closure unblocks Pass-2 backfill or Pass-3 frontier work.**
Severity: HIGH. v1.66 closes MUS Pass-1. Forward MUS subject-picks should default to Pass-2 backfill (advancing Domain target counts beyond Pass-1 minimums) or Pass-3 frontier (entirely new domain primitives). Apply: track Pass-1/Pass-2/Pass-3 state in mus-domain-coverage.json or similar.

### Domain-specific lessons (apply to subject selection)

**Lesson #10164 — Inner-heliosphere vantage (~0.75 AU) opens a new mission-design category.**
Severity: MEDIUM. Pioneer 9 corpus-opens inner-heliosphere category. Watchlist for forward NASA degrees: Helios 1+2, Mariner 10, Parker Solar Probe.

**Lesson #10165 — Form-as-multiplicity-coordination is a substrate-independent organizational principle.**
Severity: HIGH. v1.66 demonstrates the primitive across three substrates (orchestral choirs, marmot colony, spacecraft constellation). Future degrees with the Form domain in play should look for this primitive shape in cross-track triads.

**Lesson #10166 — Inner-heliosphere TID environment is engineering-distinct.**
Severity: MEDIUM. Cumulative TID dose at ~0.75 AU is materially higher than at ~1.0 AU over the same duration. ELC subjects framing modern inner-heliosphere rad-hard process families should explicitly anchor on this distinction.

**Lesson #10167 — Endemic species (single-region) pair structurally well with constellation-closing missions.**
Severity: LOW. Pattern observation. Future SPS picks for "constellation-closing" or "category-closing" NASA missions should consider endemic species (Olympic Marmot, San Joaquin Kit Fox, Vancouver Island Marmot, etc.) as natural pairings.

## Lessons-learned database state

- **Total lessons emitted to date:** 10167 (cumulative since corpus inception)
- **Lessons emitted this milestone:** 12 (#10156-#10167)
- **Lessons applied at v1.49.584:** 5 (from v1.49.583 lesson-set #10142-#10155)
- **Open lessons watchlist (apply at next opportunity):** #10156 (combined-phase pattern reuse), #10157 (V-flag fact-correction expectation), #10160 (concept-registry MUS deliverable), #10161 (PCL+GA dual-thread braiding), #10165 (form-as-multiplicity-coordination cross-track recognition)
