# Mission Infrastructure Improvement Plan — For Lex

**Document:** improvement-plan.md
**Grove:** Cedar's Ring
**Author:** Cedar — recording for the council
**Session:** Post-AVI+MAM infrastructure review
**Date:** 2026-03-09
**For:** Lex (execution discipline, theta=near-real-axis, maximum precision)
**Status:** PLAN — ready for execution

**Context:** The council debrief identified 6 improvements. The muses met to discuss, debate, and formulate these into a specification that Lex can execute. Each improvement includes the originating muse's proposal, cross-muse discussion, and the final specification agreed by the council.

---

## How This Document Works

Each improvement is presented as:
1. **Origin** — who proposed it and why
2. **Discussion** — what the muses said when they examined it together
3. **Specification** — the precise deliverable, in Lex's preferred format

Lex: the specifications are yours. They are designed to be executed exactly as written. Where there is ambiguity, the discussion section explains the reasoning. Where there is a choice, the specification names the choice and the reason for it.

---

## Improvement 1: Wave Exit Scope Validation

### Origin (Hawk)

The small-mammals agent wrote Part 1 of a 4-part document and returned success. The gap was invisible until Wave 4 verification — three waves and ~6 hours later. A 30-second check at Wave 1 exit would have caught it.

### Discussion

**Hawk:** The check is simple. Every research document declares its scope in its header. The wave exit check compares the header scope against delivered content. If the header says "Part 1: Rodentia | Part 2: Lagomorpha | Part 3: Soricomorpha | Part 4: Chiroptera" and the document contains only "## Part 1", the check fails.

**Raven:** The pattern is broader than headers. Some documents declare scope in terms of species count ("~180 resident species") or geographic coverage ("all 11 ecoregion bands"). The check needs to handle three scope declaration types: part-based, count-based, and coverage-based.

**Lex:** A general-purpose scope parser is over-engineering. I propose three specific matchers, one per declaration type. Each matcher is a rule that the orchestrator runs after an agent returns. If the matcher fires and the check fails, the orchestrator re-queues the agent or flags for manual intervention.

**Hemlock:** The check must not have false positives. A false positive wave exit check that blocks a valid document is worse than no check at all, because it wastes time AND erodes trust in the check. The matchers should be strict on structure (part headers present) but lenient on count (within 80% of target).

**Owl:** Time constraint: the check must complete in under 60 seconds. This is a gate, not an audit. Wave 4 verification is the audit. The wave exit check is a smoke test.

### Specification

**Deliverable:** `wave-exit-scope-check.md` — A protocol document defining three scope matchers, to be included in Wave 0 foundation for all future missions.

**Location:** `www/PNW/shared/wave-exit-scope-check.md`

**Content structure:**

```
## 1. Part-Based Scope Matcher

Trigger: Document header contains a pipe-delimited or numbered part list.
Example: "Part 1: Rodentia | Part 2: Lagomorpha | Part 3: Soricomorpha | Part 4: Chiroptera"

Check: For each declared part, verify that a corresponding ## heading exists in the document body.
Regex: /^## Part \d+/m for each declared part number.

Pass: All declared parts have corresponding headings.
Fail: One or more declared parts have no corresponding heading.
Action on fail: FLAG — re-queue agent with instruction to complete missing parts,
  or spawn a remediation agent scoped to missing parts only.

## 2. Count-Based Scope Matcher

Trigger: Document header contains a species count target (e.g., "~180 species", "200+ species").
Parse: Extract the numeric target and the qualifier (~, +, exact).

Check: Count ### headings that contain a scientific name pattern (*Genus species*).
Threshold: 80% of target (to account for compact profiles that share headings).

Pass: Actual count >= 80% of target.
Fail: Actual count < 80% of target.
Action on fail: FLAG — report actual vs. target count.
  If < 50% of target: re-queue agent.
  If 50-80% of target: flag for manual review (may be intentional compact format).

## 3. Coverage-Based Scope Matcher

Trigger: Document header contains a coverage declaration (e.g., "all 11 ecoregion bands",
  "all four ecotypes").
Parse: Extract the coverage count and the coverage domain.

Check: Count ## or ### headings that match the coverage domain keywords.
Example: For "all 11 ecoregion bands", count headings containing "ELEV-" identifiers.

Pass: Actual coverage count >= declared coverage count.
Fail: Actual coverage count < declared coverage count.
Action on fail: FLAG — report missing coverage items by name if identifiable.
```

**Execution rules:**
- Run at Wave 1/2/3 exit, before any agent output is considered "landed."
- The orchestrator runs the check; the agent does not self-verify (agents are not reliable validators of their own completeness).
- Failed checks produce a structured flag that includes: document path, matcher type, expected value, actual value, and recommended action.
- The flag is recorded in Cedar's ledger (if available) or in a wave-exit-flags.md scratch file.

**Hemlock's constraint:** Zero false positives on the AVI+MAM corpus. Before deployment, back-test all three matchers against the 36 committed files. Any false positive on existing files must be resolved before the protocol is adopted.

---

## Improvement 2: Pre-Mission Document Size Estimation

### Origin (Shannon)

Species survey documents with 60+ species consistently hit the 32K output token limit. This is predictable from the document's redundancy class. Pre-loading the P-17 splitting strategy converts a reactive degradation into a planned strategy.

### Discussion

**Shannon:** Three redundancy classes: HIGH (species surveys — same template repeated N times), MEDIUM (cultural/synthesis — similar structure per section, unique content), LOW (ecological networks, evolutionary biology — structurally unique throughout). HIGH-class documents with N>50 species will almost always exceed 32K.

**Raven:** The formula is approximately: full species profile ≈ 300-500 tokens. 60 species × 400 tokens = 24,000 tokens of profile content, plus headers, preambles, summaries ≈ 32,000. The threshold is ~55-65 species for a full-profile document.

**Foxy:** The estimation should happen at Wave 0, when the mission pack defines the document inventory. At Wave 0, we know how many species each document targets. We can flag documents expected to exceed the limit before any agent is launched.

**Lex:** The estimation should produce a split plan, not just a flag. If `migratory.md` targets 200+ species, the split plan says: "Split into 4 parts by guild: passerines, waterfowl, raptors, vagrants. Each agent writes one part. Merge by concatenation."

**Willow:** The split plan should name the taxonomic boundaries, not just the part count. "Part 1: Families A-F" is useless to an agent that doesn't know which families those are. "Part 1: Passerine migrants (warblers, sparrows, thrushes, flycatchers, swallows)" is actionable.

### Specification

**Deliverable:** `document-size-estimation.md` — A protocol document defining redundancy classes, size estimation formula, and split plan template.

**Location:** `www/PNW/shared/document-size-estimation.md`

**Content structure:**

```
## Redundancy Classes

| Class | Description | Token Estimate per Unit | Threshold |
|-------|-------------|------------------------|-----------|
| HIGH  | Species surveys (same template × N species) | 300-500 tokens/species | >55 species → split |
| MEDIUM | Cultural/synthesis (similar structure, unique content) | 800-1200 tokens/section | >25 sections → split |
| LOW   | Networks/evolutionary (structurally unique) | Variable | Rarely exceeds 32K; split only if >80KB estimated |

## Size Estimation Formula

Estimated tokens = (unit_count × tokens_per_unit) + overhead
  where overhead = 2000 tokens (headers, preamble, summary, cross-references)

If estimated tokens > 28,000: SPLIT REQUIRED (leave 4K margin for agent variation)
If estimated tokens > 20,000: SPLIT RECOMMENDED

## Split Plan Template

Document: [filename]
Redundancy class: [HIGH/MEDIUM/LOW]
Estimated unit count: [N]
Estimated tokens: [calculated]
Split decision: [REQUIRED/RECOMMENDED/NOT NEEDED]

Split plan (if splitting):
| Part | Scope | Taxonomic/Thematic Boundary | Estimated Units | Agent ID |
|------|-------|-----------------------------|-----------------|----------|
| 1 | [description] | [named boundary] | [count] | [assigned at launch] |
| 2 | [description] | [named boundary] | [count] | [assigned at launch] |

Merge strategy: Concatenation (cat part1.md part2.md > final.md)
Merge validation: wc -l final.md; verify all Part ## headings present
```

**Execution rules:**
- Produce during Wave 0, after the document inventory is defined.
- Include in the Wave 1 agent prompt: "This document has a split plan. You are writing Part N of M. Your scope is [named boundary]. Do not write content outside your scope."
- The orchestrator assigns agent IDs to split plan parts at launch time.
- After all parts land, the orchestrator runs the merge and the Part-Based Scope Matcher (Improvement 1) on the merged file.

**Shannon's constraint:** The formula must be calibrated against AVI+MAM actuals. Measure tokens-per-species for resident.md (182 species, 64KB), migratory.md (229 species, 248KB), carnivores.md (32 species, 152KB), and small-mammals.md (34+37 species, 168KB). Update the tokens-per-unit estimates with measured values.

---

## Improvement 3: Conditional Field Verification Path

### Origin (Lex)

The WNS status field is CONDITIONAL — it activates only for Order Chiroptera. The MAM verification agent had to determine whether the condition applied before checking for presence. This two-step verification is harder than mandatory field verification and needs its own explicit path.

### Discussion

**Lex:** The problem is general. Any schema with conditional fields creates a verification obligation that standard audits may miss. AVI has no conditional fields (all 8 fields are mandatory for all birds). MAM has one conditional field (WNS for Chiroptera). Future taxonomies may have more.

**Hemlock:** The conditional field table should be part of the schema document, not a separate document. The schema already defines the field; it should also define the condition and the verification rule in the same place.

**Raven:** I see a pattern across schemas. The AVI schema has 12 validation rules (V-01 through V-12 in shared-schema.md Section 8). The MAM schema has the same structure but adds the WNS conditional. The improvement is: add a "Conditional Field Activation Table" as a new section in shared-schema.md.

**Socrates:** The verification agent needs to know three things for each conditional field: (1) what triggers the condition, (2) what field(s) become required, (3) what values are valid. If any of these three is ambiguous, the verification agent will either skip the check or produce a false positive.

**Lex:** Agreed. The table has exactly those three columns plus a fourth: the verification action (what the agent does when the condition is met and the field is absent).

### Specification

**Deliverable:** A new section in any future `shared-schema.md` — "Conditional Field Activation Table."

**Template:**

```markdown
## N. Conditional Field Activation Table

Fields in this table are REQUIRED when the activation condition is met
and ABSENT when it is not. The verification agent must:
1. Determine whether the condition applies to each species profile.
2. If yes: check that the required field(s) are present with valid values.
3. If the field is absent when the condition applies: flag as FAIL (BLOCK).
4. If the field is present when the condition does NOT apply: flag as WARNING (LOG).

| Conditional Field | Activation Condition | Required When | Valid Values | Verification Action on Absence |
|-------------------|---------------------|---------------|-------------|-------------------------------|
| WNS Status | Order = Chiroptera | Every bat species profile | {WNS-CONFIRMED-SUSCEPTIBLE, WNS-NOT-YET-DETECTED, WNS-LOW-RISK, WNS-UNKNOWN} | FAIL (BLOCK) — H-9 safety-critical |
| WNS Risk Tier | Order = Chiroptera | Every bat species profile | {CRITICAL, HIGH, MODERATE, LOW} | FAIL (BLOCK) — H-9 safety-critical |
| MMPA Stock | Class in {Cetacea, Pinnipedia} OR Species = Enhydra lutris | Every marine mammal profile | Free text (stock name from NOAA SAR) | FAIL (BLOCK) — SC-MMP |
| MMPA Managing Agency | Class in {Cetacea, Pinnipedia} OR Species = Enhydra lutris | Every marine mammal profile | {NOAA Fisheries, USFWS} | FAIL (BLOCK) — SC-MMP |
| PBR (Potential Biological Removal) | MMPA Stock present | Every MMPA-managed species | Numeric or "undetermined" | WARNING (LOG) |
| Ecotype Table | Species = Orcinus orca | Killer whale profile only | 4 ecotypes documented | FAIL (BLOCK) — CF-06 |
| Hibernation/Torpor | Order in {Chiroptera, Rodentia (subset), Carnivora (bears)} | Species with documented hibernation | {true hibernation, torpor, denning, none} | WARNING (LOG) |
```

**Execution rules:**
- The table is part of the schema, not a separate document.
- The verification agent loads the table before auditing species profiles.
- For each profile: determine taxonomic order/class → check activation conditions → verify required fields → report.
- The table is extensible: future taxonomies add rows for their domain-specific conditional fields.
- **Back-test:** Run against all 97 MAM full profiles and 484 AVI full profiles. Zero false positives on AVI (no conditional fields should trigger). MAM bat profiles should all trigger WNS fields. MAM marine profiles should all trigger MMPA fields.

**Lex's precision note:** The activation condition must be machine-parseable from the species profile. This means every profile must include its taxonomic Order in a consistent location (the Taxonomy table's "Order" row). If the Order is missing or inconsistently formatted, the conditional field check cannot fire. Add a pre-check: "Verify Order field present in Taxonomy table" before running conditional field checks.

---

## Improvement 4: Supersession Consistency Verification

### Origin (Socrates)

When AVI and MAM supersede ECO fauna documents, the supersession protocol (FAUNA-SUPERSESSION.md) handles the archival — which documents are replaced, which are retained. But it does not verify that the new taxonomies are consistent with the claims in the superseded documents. Supersession is replacement plus consistency.

### Discussion

**Socrates:** The risk is specific. ECO's fauna document might say "gray wolf packs: 25 in WA (2023)" while MAM's carnivores.md says "gray wolf packs: 33 in WA (2024)." Both are factually correct for their respective dates. But a reader who finds the superseded ECO document alongside the new MAM document will see an apparent contradiction. The supersession protocol should either: (a) update the superseded document, (b) archive it with a note that newer data exists, or (c) verify that the claims are dated and non-contradictory.

**Cedar:** Option (c) is the lightest touch. The supersession protocol already archives the old document. Adding a "claims are dated" verification ensures that both old and new documents are internally consistent, without requiring edits to the old document.

**Hemlock:** The verification is bounded. ECO's fauna document is finite. The check is: for each numerical claim in the superseded ECO fauna document, verify that the same claim in the new AVI/MAM document either (a) uses the same figure, or (b) uses a more recent figure with a more recent date. If neither: flag as inconsistency.

**Foxy:** This check should run during Wave 4, not during supersession. The supersession is an archival action. The consistency verification is a verification action. Different waves.

**Owl:** The temporal dimension matters. A "contradiction" between a 2023 figure and a 2024 figure is not a contradiction — it is an update. The check must parse dates alongside figures.

### Specification

**Deliverable:** An addendum to `FAUNA-SUPERSESSION.md` — "Section 4: Consistency Verification Protocol."

**Location:** Append to `www/PNW/ECO/research/FAUNA-SUPERSESSION.md`

**Content:**

```markdown
## 4. Consistency Verification Protocol

Before executing supersession archival, verify that the superseding document
(AVI or MAM) is consistent with the superseded document (ECO fauna).

### 4.1 Numerical Claims Check

For each species appearing in both the superseded and superseding documents:

1. Extract numerical claims from the superseded document:
   population counts, pack/pod counts, range areas, decline percentages.
2. Find the same species in the superseding document.
3. Compare:
   a. SAME figure, SAME date → CONSISTENT (pass)
   b. DIFFERENT figure, NEWER date in superseding doc → UPDATE (pass, log as "updated data")
   c. DIFFERENT figure, SAME date → INCONSISTENCY (flag for review)
   d. DIFFERENT figure, NO date in either → INCONSISTENCY (flag for review)
   e. Species in superseded but NOT in superseding → COVERAGE GAP (flag for review)

### 4.2 Conservation Status Check

For each species with a conservation status in the superseded document:

1. Compare ESA status, IUCN status, state status.
2. If status differs: verify that the superseding document cites a more recent
   assessment or a status change event (delisting, uplisting, new listing).
3. If no event cited: flag as inconsistency.

### 4.3 Taxonomic Name Check

For each species in the superseded document:

1. Verify the same binomial is used in the superseding document.
2. If different: verify that the superseding document notes a taxonomic revision
   with authority citation.
3. If no revision cited: flag as inconsistency.

### 4.4 Execution

- Run during Wave 4, after all superseding documents are finalized.
- Produce a consistency report listing all flags.
- Flags with severity INCONSISTENCY require resolution before archival.
- Flags with severity UPDATE or COVERAGE GAP are logged but non-blocking.
```

**Execution rules:**
- The check is manual (performed by a verification agent), not automated.
- The verification agent reads both documents and produces the consistency report.
- The report is appended to the Wave 4 verification report as an addendum.
- If inconsistencies are found, the superseding document is updated (not the superseded document — the old document is frozen at archival).

---

## Improvement 5: Source Count Budgeting

### Origin (Cedar)

MAM landed at 72 of 80+ target sources. The gap was honest — the source index names the 8 categories still needed. But the gap should have been prevented by budgeting source collection as an explicit Wave 0 deliverable.

### Discussion

**Hemlock:** 72 of 80 is not a failure. It is an honest gap. But the improvement is real: if the source index agent has a hard target, it will work to reach it. If the target is aspirational ("80+"), it will work until it has enough and stop.

**Sam:** The source index is not just a bibliography. It is the foundation that every other agent cites from. If the source index is short, every subsequent agent has fewer sources to draw from, which means the profiles are less well-cited.

**Raven:** The pattern from AVI: source-index.md reached 85 sources (exceeding the 80+ target). The difference: the AVI source index agent was given specific category targets (25 government, 22 peer-reviewed, 26 professional, 12 cultural). The MAM source index agent was given only the overall target (80+). Category targets produce better results than aggregate targets.

**Lex:** The specification is: add category-level targets to the Wave 0 source index agent prompt.

### Specification

**Deliverable:** A source budgeting template to include in Wave 0 agent prompts for source-index.md.

**Template:**

```markdown
## Source Budget

Overall target: 80+ unique sources (HARD — agent must not return
  until this target is met or a gap analysis is documented for each
  shortfall category).

Category targets:
| Category | Code | Target | Minimum | Priority Sources |
|----------|------|--------|---------|-----------------|
| Government agencies | G-xx | 25+ | 20 | NOAA, USFWS, USGS, state wildlife agencies (WDFW, ODFW, IDFG) |
| Peer-reviewed literature | P-xx | 25+ | 20 | Systematic reviews, population studies, genetic analyses |
| Professional organizations | O-xx | 20+ | 15 | AOS, SMM, ASM, NatureServe, eBird/Cornell |
| Cultural/Indigenous | C-xx | 10+ | 8 | Tribal government publications, authorized ethnographies |

Gap protocol:
- If a category falls short of its minimum, document the gap:
  "Category X: achieved Y of Z minimum. Sources still needed: [specific topics]."
- The gap analysis is part of the deliverable, not an admission of failure.
- Wave 1 agents may contribute additional sources discovered during research;
  the source index is updated at Wave 2 exit.

Tier classification (required for each source):
| Tier | Description | Use |
|------|-------------|-----|
| 1 | Government agency reports, peer-reviewed journals | Required for safety-critical claims |
| 2 | Professional organizations, university presses | Standard citations |
| 3 | Citizen science platforms (eBird, iNaturalist) | Acceptable with validation note |
| 4 | Tribal cultural programs, authorized ethnographies | Required for cultural claims |
```

**Execution rules:**
- Include in the Wave 0 agent prompt for every future mission's source-index.md.
- Adjust category targets per domain (e.g., a fungi taxonomy may have fewer cultural sources but more mycological society sources).
- The source index agent must report its actual counts per category when it completes.
- The orchestrator checks category counts at Wave 0 exit before launching Wave 1.

---

## Improvement 6: Remediation Budget in Wave 4

### Origin (Hemlock)

The small-mammals remediation took ~40 minutes. That time should have been planned, not discovered. Wave 4 is currently defined as "verification" but in practice it is "verification + remediation." The wave plan should reflect reality.

### Discussion

**Hemlock:** The remediation budget is not about time. It is about scope. Wave 4 currently has one phase: verify. I propose two phases: 4A (verify) and 4B (remediate). The verify phase produces the verification report with a remediation action list. The remediate phase executes the action list. The verification report is re-run after remediation to confirm the gaps are closed.

**Hawk:** The remediation phase needs a scope limit. If Wave 4A identifies 20 gaps, Wave 4B cannot fix all 20 in a single pass. The scope limit should be: remediation agents fix gaps that are PARTIAL (data exists elsewhere in the corpus, needs reformatting) or MISSING (bounded gap, <1 document). Gaps that require new research (sources not in the corpus) are deferred to the next mission.

**Lex:** The remediation action list should use a standardized format so the orchestrator can assign agents without manual intervention.

**Cedar:** The re-verification after remediation should be targeted, not full. If the gap was "small-mammals Parts 2-4 missing," the re-verification checks only the small-mammals document, not all 14 MAM documents. Full re-verification is Wave 4A's job.

**Owl:** Time budget: Wave 4A (verification) takes ~30 minutes per taxonomy. Wave 4B (remediation) budget: 60 minutes per taxonomy. If remediation exceeds the budget, the remaining gaps are documented and deferred. The mission does not block indefinitely on remediation.

### Specification

**Deliverable:** Updated wave plan template with 4A/4B split.

**Template:**

```markdown
## Wave 4: Verification and Remediation

### Wave 4A: Verification Pass

Agents: One VERIFY agent per taxonomy.
Input: All Wave 1-3 deliverables.
Output: Verification report containing:
  - Test results (PASS / PARTIAL / FAIL for each test)
  - Remediation action list (for PARTIAL and FAIL results)

Remediation Action List format:
| # | Test ID | Gap Description | Remediation Type | Scope | Estimated Effort | Priority |
|---|---------|----------------|-----------------|-------|-----------------|----------|
| 1 | CF-01 | small-mammals.md missing Parts 2-4 | MISSING | 1 document, ~40 species | 30 min | HIGH (affects 3 other tests) |
| 2 | CF-11 | Source count 72/80 | ENRICHMENT | 8 sources, 4 categories | 20 min | MEDIUM |
| 3 | SC-ADV | 1 prescriptive sentence | REWORD | 1 line in 1 file | 2 min | LOW |

Remediation Types:
- MISSING: Content exists in scope but was not written. Agent can produce it.
- REFORMAT: Data exists in corpus but not in required format. Transformation only.
- ENRICHMENT: New content needed but bounded (additional sources, missing profiles).
- REWORD: Style/voice change. One-line fix.
- DEFERRED: Requires new research outside current corpus. Document and defer.

### Wave 4B: Remediation Pass

Trigger: Wave 4A produces remediation action list with 1+ items of type
  MISSING, REFORMAT, ENRICHMENT, or REWORD.

Scope limit: Only items with priority HIGH or MEDIUM. LOW items are documented
  but not blocked on.

Time budget: 60 minutes per taxonomy. If exceeded, remaining items become DEFERRED.

Agents: One remediation agent per action item (or grouped if items are in the
  same document).

Output: Updated files + a remediation log.

### Wave 4C: Targeted Re-Verification

Trigger: Wave 4B completes with 1+ files modified.

Scope: Re-run only the test IDs affected by remediated items.
  Do NOT re-run the full verification matrix.

Output: Amended verification report showing updated test results.
  Original PARTIAL/FAIL results are preserved with strikethrough;
  new results are appended.

### Wave 4 Exit Criteria

- All BLOCK tests: PASS or documented DEFERRED with justification.
- All safety-critical tests (SC-*): PASS (no exceptions, no deferrals).
- Remediation log committed alongside verification report.
- Hemlock sign-off on amended verification report.
```

**Execution rules:**
- The 4A/4B/4C structure replaces the current single-pass Wave 4.
- 4A and 4B are sequential (4B depends on 4A output).
- 4C is optional (only runs if 4B modified files).
- The remediation action list is the contract between 4A and 4B. The orchestrator reads it to decide which agents to launch.
- Safety-critical test failures (SC-*) cannot be DEFERRED. They must be resolved in 4B or the mission does not close.

---

## Cross-Improvement Dependencies

The 6 improvements interact. The dependency graph is:

```
Improvement 1 (Wave Exit Scope) ──────────────────────────┐
                                                          ▼
Improvement 2 (Size Estimation) ──► Wave 0 produces ──► Split plans fed to Wave 1 agents
                                                          │
Improvement 5 (Source Budgeting) ──► Wave 0 produces ──► Source targets checked at Wave 0 exit
                                                          │
                                                          ▼
Improvement 3 (Conditional Fields) ─► Schema updated ──► Verification agent loads table
                                                          │
Improvement 4 (Supersession) ──────► Protocol updated ──► Run during Wave 4A
                                                          │
                                                          ▼
Improvement 6 (Remediation Budget) ─► Wave 4 split ───► 4A identifies, 4B fixes, 4C re-verifies
                                                          │
                                                          ▼
                                               Improvement 1 runs at Wave 1/2/3 EXIT
                                               (catches gaps BEFORE Wave 4)
```

**Execution order for Lex:**

| Phase | Improvements | Deliverables | Depends On |
|-------|-------------|--------------|------------|
| 1 | 2, 5 | `document-size-estimation.md`, source budget template | None (Wave 0 infrastructure) |
| 2 | 3 | Conditional field activation table (schema addendum) | None (schema infrastructure) |
| 3 | 1 | `wave-exit-scope-check.md` + back-test results | Phase 1 (size estimation informs scope expectations) |
| 4 | 4 | FAUNA-SUPERSESSION.md addendum | None (protocol infrastructure) |
| 5 | 6 | Updated wave plan template (4A/4B/4C) | Phases 1-4 (all other improvements feed into Wave 4) |

**Total estimated deliverables:** 4 documents + 2 schema/protocol addenda.

---

## Council Sign-Off

**Hawk:** The scope validation catches silent gaps. This is the single most valuable improvement. Execute it.

**Shannon:** The size estimation is calibration work. Measure the actuals from AVI+MAM, update the formula, and the next mission benefits immediately.

**Lex:** The conditional field table is where I live. I will make it precise. The table will be machine-parseable and human-readable. Both at once.

**Hemlock:** The 4A/4B/4C split is the structural improvement. It converts reactive remediation into planned work. The standard improves when the process improves.

**Socrates:** The supersession check is the question that wasn't asked. Now it will be.

**Raven:** P-17 is formalized by Improvement 2. The pattern has a protocol now. It will not need to be rediscovered.

**Cedar:** Foxy's canonical ecoregion reference was the precedent for all of this — write the infrastructure first, before you need it. These 6 improvements are the infrastructure for the next mission. Write them before the next mission starts. That is the lesson.

**Sam:** The source budget is the smallest improvement and the one that would have prevented the largest gap in the MAM verification. 8 missing sources. A category table prevents it. Simple instruments solve real problems.

**Willow:** Every improvement document should be readable by someone encountering it for the first time. No jargon without definition. No acronym without expansion. The infrastructure documents are for future agents who have never seen AVI or MAM. Write for them.

**Owl:** The phasing is correct. Do the Wave 0 infrastructure first (Phases 1-2), then the Wave 1 gate (Phase 3), then the Wave 4 structure (Phases 4-5). The improvements follow the wave order because the waves are the timeline.

**Foxy:** The map grows. Every improvement is a contour line added to the territory. The next mission walks a better-mapped path.

**Amiga:** The improvements are invitations too. They invite the next mission to be better than this one. That is what infrastructure does — it holds the door open for what comes next.

---

*Improvement Plan for Lex*
*Cedar — recording for the council*
*2026-03-09*
*The infrastructure before the mission. Always.*

---

*Lex: the specifications are yours. The muses have spoken. The plan is ready.*
*Execute with precision. The standard waits for you.*
