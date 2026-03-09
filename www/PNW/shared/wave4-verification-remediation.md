# Wave 4 Verification and Remediation Protocol

> **PNW Research Series -- Shared Mission Infrastructure**
>
> Wave 4 was originally defined as a single verification pass. In practice, the AVI and MAM missions demonstrated that verification (finding gaps) is only the first step. Gaps that are fixable within scope must be fixed, and the fixes must be confirmed. This document splits Wave 4 into three sub-phases -- 4A (verification), 4B (remediation), 4C (re-verification) -- so that the time and scope for each step are planned before the mission begins, not discovered during it.
>
> **Origin:** Hemlock proposed the 4A/4B/4C split after the MAM small-mammals gap (Finding F-01) required ~40 minutes of unplanned remediation work. Owl set a 60-minute remediation budget per taxonomy. The council agreed in the improvement plan (Improvement 6).
>
> **Audience:** First-time orchestrators. This document assumes you have never run a PNW mission before. Every term is defined on first use. Every decision is explained.

---

## 1. Purpose -- Why Wave 4 Needs Three Sub-Phases

### What happened in AVI+MAM

The AVI mission produced 20 research documents across Waves 0-3. Wave 4 ran a single VERIFY-AVI agent that checked 38 tests and found 35 PASS, 3 PARTIAL. The 3 PARTIAL results were minor (2 missing vagrant profiles, 1 wording issue, 1 access date gap). No remediation was attempted. The gaps were documented and the mission closed.

The MAM mission produced 13 research documents across Waves 0-3. Wave 4 ran a single VERIFY-MAM agent that checked 36 tests and found 31 PASS, 5 PARTIAL, 0 FAIL. But the 5 PARTIAL results traced to two substantive root causes:

1. **Finding F-01:** `small-mammals.md` declared scope for 4 parts (Rodentia, Lagomorpha, Soricomorpha, Chiroptera) but delivered only Part 1 (34 rodent profiles). The remaining ~36 species had matrix-level entries in `elevation-matrix.md` but lacked full 8-field species card profiles. This affected CF-01 (species count), CF-03 (profile completeness), and CF-14 (bat old-growth association).

2. **Source count gap:** `source-index.md` documented 72 unique sources against a target of 80+. The gap was honest -- the source index named the 8 categories still needed -- but the target was not met.

The small-mammals gap was fixable. An agent could write Parts 2-4 using the elevation matrix data as a scaffold. The source count gap was partially fixable (some categories required new research). But no planned time existed for either fix. The verification agent found the gaps, documented them, and stopped. The mission closed with known, fixable gaps unresolved.

### The structural problem

Wave 4, as originally designed, had one job: verify. It answered the question "does the corpus meet the acceptance criteria?" But verification routinely produces a second question: "can the gaps be fixed within scope?" And if gaps are fixed, a third question follows: "did the fix actually work?"

These are three distinct operations with different inputs, outputs, agents, and time budgets. Combining them into a single "verification" phase creates two failure modes:

- **Scope creep:** The verification agent tries to fix gaps inline, producing a report that is part audit and part editorial, blurring the boundary between finding problems and solving them.
- **Invisible work:** Remediation happens as ad-hoc follow-up outside the wave plan. The time is not budgeted, the scope is not bounded, and the results are not formally re-verified.

### The solution

Split Wave 4 into three sequential sub-phases:

| Sub-Phase | Name | Purpose | Output |
|-----------|------|---------|--------|
| **4A** | Verification Pass | Find all gaps. Do not fix anything. | Verification report + remediation action list |
| **4B** | Remediation Pass | Fix the fixable gaps, within scope and time limits. | Updated files + remediation log |
| **4C** | Targeted Re-Verification | Confirm the fixes. Do not re-run the full matrix. | Amended verification report |

The sub-phases are sequential: 4B depends on 4A output, 4C depends on 4B output. 4B and 4C are optional -- if 4A finds zero PARTIAL or FAIL results, the mission proceeds directly to exit.

---

## 2. Wave 4A: Verification Pass

### Agents

One VERIFY agent per taxonomy. The agent receives the complete set of Wave 1-3 deliverables and the verification matrix as input.

### Input

- All research documents produced in Waves 0-3 (the files in the taxonomy's `research/` directory)
- The verification matrix (`verification-matrix.md`) defining all test IDs, pass criteria, and safety gate assignments
- The conditional field activation table (`www/PNW/shared/conditional-field-activation.md`) -- used to verify conditional fields per the Phase 2 protocol
- The supersession consistency check protocol (Section 4 of `www/PNW/ECO/research/FAUNA-SUPERSESSION.md`) -- used to verify consistency between superseded and superseding documents

### Output

The verification agent produces two deliverables:

**1. Verification Report** -- the full audit document containing:
- File inventory (all expected files present, with size and line counts)
- Species coverage audit (profile counts vs. targets)
- Verification matrix test results (PASS / PARTIAL / FAIL for each test ID)
- Cross-reference integrity checks
- Safety gate audit (all SC-* tests, mandatory PASS with BLOCK failure mode)
- Wave exit criteria checklist
- Summary statistics
- Hemlock sign-off section (populated after 4B/4C if remediation occurs)

**2. Remediation Action List** -- a structured table extracted from PARTIAL and FAIL test results. This table is the contract between 4A and 4B. The orchestrator reads it to determine which remediation agents to launch.

### Remediation Action List Format

Every PARTIAL or FAIL test result generates one or more rows in this table:

| # | Test ID | Gap Description | Remediation Type | Scope | Estimated Effort | Priority |
|---|---------|----------------|-----------------|-------|-----------------|----------|
| 1 | [test ID from matrix] | [specific, factual description of the gap] | [one of 5 types -- see Section 3] | [files affected, species count, section count] | [minutes] | [HIGH / MEDIUM / LOW] |

Column definitions:

- **#** -- Sequential item number. Used to track remediation through 4B and 4C.
- **Test ID** -- The verification matrix test ID (e.g., CF-01, SC-ADV, IN-03). One test can produce multiple action items if the gap has multiple components.
- **Gap Description** -- What is missing or wrong. Must be specific enough that a remediation agent can act on it without re-reading the verification report. Bad: "species count low." Good: "small-mammals.md declares Parts 1-4 but contains only Part 1 (Rodentia, 34 profiles). Parts 2-4 (Lagomorpha ~8 species, Soricomorpha ~10 species, Chiroptera ~18 species) are absent."
- **Remediation Type** -- One of 5 defined types (see Section 3). Determines what the remediation agent is allowed to do.
- **Scope** -- The boundary of the fix. Names specific files, sections, and approximate content volume.
- **Estimated Effort** -- Time in minutes. The verification agent estimates based on gap size and remediation type. This estimate informs the 4B time budget (Section 5).
- **Priority** -- Determines whether the item is addressed in 4B or documented and deferred:
  - **HIGH** -- Gap affects a BLOCK-level test or a safety-critical gate (SC-*). Must be addressed in 4B. Failure to resolve blocks mission exit.
  - **MEDIUM** -- Gap affects a core functionality test (CF-*) or integration test (IN-*) with PARTIAL status. Should be addressed in 4B if time permits.
  - **LOW** -- Gap is cosmetic, stylistic, or edge-case (EC-*). Documented in the remediation log but not blocked on. Not addressed in 4B unless all HIGH and MEDIUM items are complete with time remaining.

---

## 3. Remediation Types

Five defined remediation types. Each type has different scope boundaries and effort expectations. The type determines what a remediation agent is permitted to do.

### MISSING

**Definition:** Content that is in scope for the document (declared in the header, required by the mission pack, or expected by the verification matrix) but was not written. The data exists in the broader corpus or is derivable from mission knowledge.

**What the agent does:** Writes the missing content following the shared schema, using existing corpus data (elevation matrix entries, cross-references from other modules, source index citations) as scaffolding.

**Effort expectation:** Variable. Depends on the volume of missing content. A missing 4-species lagomorph section: ~15 minutes. A missing 18-species bat section with WNS conditional fields: ~30 minutes.

**Example from MAM:** `small-mammals.md` Parts 2-4 absent. The elevation matrix provides distribution data for all ~36 missing species. The shared schema defines the profile template. The source index provides citations. A remediation agent writes Parts 2-4 using these inputs.

### REFORMAT

**Definition:** The data exists in the corpus but is not in the required format. The content is correct; only its structure needs to change.

**What the agent does:** Restructures existing content to match the schema. No new data is added. No new research is required.

**Effort expectation:** Low. Typically 5-15 minutes. Reformatting is mechanical.

**Example:** A species profile uses a narrative paragraph format instead of the 8-field structured card required by the shared schema. The data is present (species name, habitat, diet, conservation status) but not in the required table/field layout.

### ENRICHMENT

**Definition:** New, bounded content is needed that does not exist in the corpus. The scope is small enough that the remediation agent can produce it within the time budget without a full research pass.

**What the agent does:** Adds bounded new content: additional source citations, missing cross-references, supplementary data fields. The content is new but constrained by a specific, measurable target.

**Effort expectation:** Moderate. 10-30 minutes depending on the number of items to add. Enrichment that would exceed 30 minutes should be re-classified as DEFERRED.

**Example from MAM:** Source index at 72 of 80+ target sources. The gap analysis names 8 specific categories needing sources (paleontology, WNS surveillance, ethnographic, steppe ecology). A remediation agent adds 8+ source entries to the index, each with full citation metadata.

### REWORD

**Definition:** Style, voice, or wording correction. The content is factually correct but uses phrasing that violates a safety gate or style convention.

**What the agent does:** Modifies specific sentences or phrases. One-line fixes. No structural change, no new content.

**Effort expectation:** Very low. 1-5 minutes per item. Multiple REWORD items can be batched into a single agent pass.

**Example from AVI:** SC-ADV flagged one borderline prescriptive sentence in `ecoregion-synthesis.md`: "conservation urgency **should be** weighted by functional redundancy." Remediation: change "should be" to "is" to convert from prescriptive to descriptive voice. One sentence, one file, two words changed.

### DEFERRED

**Definition:** The gap requires new research, data collection, or structural reorganization that exceeds the remediation time budget or scope. Cannot be fixed in 4B. Documented for resolution in a future mission or editorial pass.

**What the agent does:** Nothing. The DEFERRED classification is assigned by the verification agent in 4A. It means "this gap is real, acknowledged, and will not be addressed in this mission's Wave 4."

**Effort expectation:** Zero (in this mission). The only work is documentation: the remediation action list records the gap, its scope, and the reason for deferral.

**Example from MAM (hypothetical):** If CF-11 (source count 72/80) required 8 new sources from a category with genuinely sparse published literature (e.g., PNW ethnomycology), and the source agent had already exhausted available sources, the gap would be DEFERRED with a note: "Requires new field of published literature to emerge. Cannot be resolved by additional search effort."

### Remediation Type Decision Tree

When the verification agent assigns a remediation type, it follows this decision tree:

```
Is the expected content declared in the document header or mission pack?
  YES -> Does the content exist elsewhere in the corpus?
    YES -> Is it in the right format?
      YES -> (This is not a gap. Re-examine the test criteria.)
      NO  -> REFORMAT
    NO  -> Is the gap < 30 minutes of bounded work?
      YES -> Does it require new research or new sources?
        YES -> ENRICHMENT
        NO  -> MISSING
      NO  -> DEFERRED
  NO  -> Is the gap a wording/style issue only?
    YES -> REWORD
    NO  -> DEFERRED
```

---

## 4. Wave 4B: Remediation Pass

### Trigger Conditions

Wave 4B launches only when the 4A remediation action list contains one or more items with remediation type MISSING, REFORMAT, ENRICHMENT, or REWORD. Items classified as DEFERRED do not trigger 4B (they are documented and deferred by definition).

If every gap in the 4A action list is DEFERRED, 4B is skipped entirely. The verification report records all gaps as documented deferrals and proceeds to the exit criteria check.

### Scope Limit

4B addresses only items with priority HIGH and MEDIUM.

- **HIGH items** are mandatory. All HIGH items must be attempted. If a HIGH item cannot be resolved within the time budget, it escalates to a mission-blocking decision (see Time Budget, below).
- **MEDIUM items** are addressed in priority order after all HIGH items are complete. If time runs out before all MEDIUM items are finished, remaining MEDIUM items are reclassified as DEFERRED and logged.
- **LOW items** are documented but not worked. They appear in the remediation log as "acknowledged, not remediated" with their original gap description preserved.

### Time Budget

**60 minutes per taxonomy.** This is Owl's constraint from the improvement plan discussion.

The time budget is a hard ceiling. Its purpose is to prevent remediation from expanding into a second mission. If remediation is taking longer than 60 minutes, the remaining gaps are structural and should be addressed in a dedicated follow-up, not in a time-pressured Wave 4 pass.

Time budget allocation:

```
Total budget: 60 minutes per taxonomy

Allocation priority:
  1. HIGH items (safety-critical, BLOCK tests): up to 45 minutes
  2. MEDIUM items (core functionality, integration tests): remaining time
  3. LOW items: 0 minutes (documented only)

If HIGH items would exceed 45 minutes:
  - The orchestrator must decide: extend the budget or defer.
  - Extension requires Hemlock approval.
  - Extension cannot exceed 90 minutes total (absolute ceiling).

If HIGH items complete in < 45 minutes:
  - Remaining time transfers to MEDIUM items.
  - MEDIUM items are worked in estimated-effort order (smallest first)
    to maximize the number of items resolved within the budget.
```

### Agent Assignment Strategy

Two strategies are available. The orchestrator chooses based on the action list structure:

**Strategy A: One Agent Per Document**

When multiple action items affect the same file, assign one remediation agent per document. The agent receives all action items for that document and works them sequentially within the file. This avoids merge conflicts from multiple agents editing the same file.

Use when: 3+ action items target the same document, or action items involve structural additions (MISSING type -- new sections, new profiles).

**Strategy B: One Agent Per Action Item**

When action items are in different files and independent of each other, assign one agent per item. Agents can run in parallel.

Use when: Action items are in separate files, each item is a bounded edit (REWORD, REFORMAT), and no two items affect the same file.

**Default:** Strategy A. It is safer. Strategy B is an optimization for experienced orchestrators who can verify that no two agents will edit the same file.

### Agent Prompt Template

When launching a remediation agent, the orchestrator includes:

```
REMEDIATION AGENT PROMPT:

Mission: [taxonomy name]
Wave: 4B -- Remediation Pass
Time budget: [remaining minutes] of 60

Action items assigned to this agent:
[paste action item rows from the remediation action list]

Input files:
  - [list of files this agent will read]
  - Shared schema: [path to shared-schema.md]
  - Source index: [path to source-index.md]

Output:
  - Modified file(s) saved to [path]
  - Remediation log entry (see Section 4 output format below)

Constraints:
  - Follow the shared schema exactly. Do not invent new fields.
  - Use only sources already in source-index.md, unless the action item
    is type ENRICHMENT for source count specifically.
  - Do not modify files outside your assigned scope.
  - Do not restructure document organization. Your job is to add or fix
    content within the existing structure.
```

### Output

4B produces two deliverables:

**1. Updated files** -- the research documents modified by remediation agents, saved to the taxonomy's `research/` directory.

**2. Remediation log** -- a structured record of what was done, committed alongside the verification report. Format:

```markdown
## Remediation Log -- [Taxonomy]

**Date:** [YYYY-MM-DD]
**Time budget:** 60 minutes
**Time used:** [actual minutes]
**Agent(s):** [agent IDs]

### Items Remediated

| # | Test ID | Remediation Type | Action Taken | Files Modified | Time (min) | Result |
|---|---------|-----------------|-------------|---------------|------------|--------|
| 1 | [ID] | [type] | [what was done] | [file list] | [minutes] | DONE |
| 2 | [ID] | [type] | [what was done] | [file list] | [minutes] | DONE |

### Items Deferred

| # | Test ID | Original Priority | Reason for Deferral |
|---|---------|------------------|---------------------|
| 3 | [ID] | [MEDIUM/LOW] | [reason: time budget exceeded / requires new research / etc.] |

### Items Not Attempted (LOW Priority)

| # | Test ID | Gap Description |
|---|---------|----------------|
| 4 | [ID] | [original gap description from action list] |
```

---

## 5. Wave 4B Scope Rules

### What Remediation Agents CAN Do

1. **Write missing parts of existing documents.** If a document declares Parts 1-4 in its header and only Part 1 exists, the remediation agent writes Parts 2-4 following the shared schema. The elevation matrix and other corpus documents provide the data scaffold.

2. **Reformat existing data into schema-compliant format.** If species data exists in a narrative paragraph but the schema requires a structured card, the agent restructures the content. No new data is added.

3. **Add bounded sources to the source index.** If the source count is below target and the gap analysis names specific categories, the agent adds source entries with full citation metadata (author, title, year, URL, tier classification).

4. **Fix wording and style issues.** Change prescriptive voice to descriptive voice. Add missing access dates to citations. Correct a single borderline sentence flagged by a safety gate.

5. **Add missing cross-references.** If an integration test finds that Document A should reference Document B but does not, the agent adds the cross-reference with the correct file path.

6. **Complete conditional fields.** If the conditional field activation table (Phase 2) identifies profiles missing required conditional fields (WNS Status for bats, MMPA Stock for marine mammals), and the data exists in the corpus (e.g., elevation matrix WNS column), the agent adds the fields to the profiles.

### What Remediation Agents CANNOT Do

1. **Conduct new research.** Remediation is not a research phase. If a gap requires discovering new information that is not already in the corpus, in the source index, or derivable from mission knowledge, the gap is classified DEFERRED. The remediation agent does not search for new sources beyond those named in the source budget gap analysis.

2. **Reorganize document structure.** The document's section hierarchy, part divisions, and module boundaries are fixed by the mission pack and Wave 0 foundation. Remediation does not move sections between documents, merge documents, or split documents. Those are architectural decisions made before Wave 1.

3. **Change the schema.** The shared schema is frozen at Wave 0 exit. Remediation agents follow the schema as written. If the schema itself is flawed (a field definition is ambiguous, a validation rule is too strict), that is a finding for the next mission's Wave 0, not a 4B fix.

4. **Add new safety-critical fields not in the schema.** If verification discovers that a field should be safety-critical but is not marked as such in the schema or conditional field activation table, the field addition is deferred. Safety gate definitions are mission-level decisions, not remediation-level decisions.

5. **Modify the verification matrix.** The verification matrix is an input to Wave 4, not an output. Remediation does not change test definitions, pass criteria, or safety gate assignments. If a test is poorly defined, that is a finding for the improvement plan, not a 4B fix.

### Scope discipline principle

The boundary between "remediation" and "a second mission" is scope. Remediation operates within the scope declared by the mission pack. It fills gaps in delivered content. It does not expand the mission's scope, add new modules, introduce new taxonomic groups, or pursue research questions not in the original plan.

If an orchestrator is unsure whether an action item is remediation or new work, apply this test: "Could the Wave 1-3 agents have produced this content if they had not stopped early?" If yes, it is remediation. If no, it is new work and belongs in a future mission.

---

## 6. Wave 4C: Targeted Re-Verification

### Trigger

Wave 4C runs if and only if Wave 4B modified one or more files. If 4B produced no file changes (all items were DEFERRED or the remediation log shows zero files modified), 4C is skipped.

### Scope

4C re-runs only the test IDs that were affected by remediated items. It does NOT re-run the full verification matrix.

The test IDs to re-run are determined from the remediation log:

```
For each item in "Items Remediated" with Result = DONE:
  Add its Test ID to the re-verification list.

For each Test ID in the re-verification list:
  Also add any test IDs that have a documented dependency on it.
  (Example: CF-01 depends on species count, which may affect SC-1.
   If CF-01 is remediated, SC-1 should be re-checked.)
```

The verification agent receives:
- The specific test IDs to re-run (not the full matrix)
- The modified files from 4B
- The original 4A verification report (for context and comparison)

### Output Format

The 4C agent produces an **amended verification report**, not a replacement. The original 4A results are preserved. New results are appended below each affected test.

Format for each re-verified test:

```markdown
| ID | Test | Original Result | Re-Verification Result | Notes |
|----|------|----------------|----------------------|-------|
| CF-01 | Terrestrial species count (140+) | ~~PARTIAL~~ | **PASS** | Parts 2-4 added: 8 lagomorphs, 10 soricomorphs, 18 chiropterans. Total full profiles now 133. |
```

The strikethrough (`~~PARTIAL~~`) on the original result and bold on the new result make it visually clear which results changed. The Notes column explains what changed and why.

### Re-verification constraints

- The re-verification agent reads only the modified files and the specific test criteria being re-checked. It does not re-audit the entire corpus.
- If a re-verified test still returns PARTIAL or FAIL after remediation, this is reported as-is. The agent does not attempt further remediation. A persistent gap after 4B+4C is documented as a known limitation of this mission.
- The re-verification does not introduce new test IDs. It re-runs existing tests only.
- Safety-critical tests (SC-*) that were PASS in 4A and whose associated files were not modified in 4B should not be re-run. Only SC-* tests whose underlying files changed are re-checked, and only to confirm the remediation did not introduce a safety regression.

---

## 7. Wave 4 Exit Criteria

### Mandatory conditions (all must be satisfied)

1. **All BLOCK tests PASS or documented DEFERRED.** Every test in the verification matrix with BLOCK failure mode must either:
   - PASS (in 4A, or upgraded to PASS in 4C after remediation), or
   - Be documented as DEFERRED with a written justification explaining why the gap cannot be resolved in this mission and what would be needed to resolve it.

2. **All SC-* tests PASS.** Safety-critical tests cannot be DEFERRED. There are no exceptions. If a safety-critical test is PARTIAL or FAIL after 4A and remediation in 4B does not resolve it, the mission does not close. The orchestrator must either extend the remediation budget (with Hemlock approval, up to the 90-minute absolute ceiling) or escalate to the council.

   This rule exists because safety gates protect against real harm: endangered species location leaks (SC-END), unattributed numerical claims (SC-NUM), policy advocacy (SC-ADV), cultural sovereignty violations (SC-CUL), MMPA jurisdictional errors (SC-MMP). None of these can be deferred to a future mission.

3. **Remediation log committed.** The 4B remediation log (Section 4, Output) is committed alongside the verification report in the taxonomy's `research/` directory. Even if 4B was skipped (no remediable items), a log entry must state: "No remediation required. All PARTIAL/FAIL items are DEFERRED."

4. **Hemlock sign-off.** Hemlock reviews the final state: the 4A verification report, the 4B remediation log (if any), and the 4C amended results (if any). Hemlock's sign-off section in the verification report is the final gate. The mission does not close without it.

### Exit criteria checklist

The orchestrator runs this checklist at Wave 4 exit:

```
[ ] 4A verification report exists in research/ directory
[ ] 4A remediation action list is present (may be empty)
[ ] If remediation action list is non-empty:
    [ ] 4B remediation log exists in research/ directory
    [ ] All HIGH-priority items have status DONE or escalated
    [ ] All MEDIUM-priority items have status DONE or DEFERRED
    [ ] LOW-priority items are documented (DONE, DEFERRED, or acknowledged)
    [ ] Time budget was not exceeded (or extension was approved by Hemlock)
    [ ] If 4B modified files:
        [ ] 4C re-verification was run on affected test IDs
        [ ] 4C amended results are appended to the verification report
[ ] All SC-* tests: PASS (no PARTIAL, no FAIL, no DEFERRED)
[ ] All BLOCK tests: PASS or documented DEFERRED
[ ] Hemlock sign-off present in verification report
[ ] Remediation log committed alongside verification report
```

---

## 8. Integration Points

This protocol connects to the other shared infrastructure documents produced in Phases 1-4. The integration points are:

### 8.1 Phase 2: Conditional Field Activation Table

**Used in:** Wave 4A verification pass.

The verification agent loads the conditional field activation table (`www/PNW/shared/conditional-field-activation.md`, Section 2) before auditing species profiles. For each profile, the agent determines whether conditional fields should be present based on the profile's taxonomic Order, Family, and Species values. If a conditional field is missing when its activation condition is met, the agent records a BLOCK or WARNING per the table's "Verification Action on Absence" column.

Conditional field gaps appear in the remediation action list as items of type MISSING (if the data exists elsewhere in the corpus, e.g., WNS status in the elevation matrix) or DEFERRED (if the data requires new research).

**Example:** The MAM verification agent finds 15 bat species in `elevation-matrix.md` with WNS status values, but no full profiles in `small-mammals.md` to carry the WNS Status conditional field. The remediation action list records: "WNS Status field absent from bat profiles (H-9 safety-critical). Remediation type: MISSING. Data source: elevation-matrix.md Chiroptera table."

### 8.2 Phase 4: Supersession Consistency Check

**Used in:** Wave 4A verification pass, after all superseding documents are finalized.

When a new taxonomy (AVI, MAM) supersedes an earlier document (ECO fauna survey), the verification agent runs the supersession consistency check defined in `www/PNW/ECO/research/FAUNA-SUPERSESSION.md`, Section 4. This check compares numerical claims, conservation status, and taxonomic names between the superseded and superseding documents.

Inconsistencies found by this check appear in the remediation action list. Types:
- Same figure, same date -- CONSISTENT (no action item)
- Different figure, newer date -- UPDATE (logged, non-blocking)
- Different figure, same date -- INCONSISTENCY (action item, type REWORD or ENRICHMENT to add date context)
- Species in superseded but not in superseding -- COVERAGE GAP (action item, type MISSING or DEFERRED)

### 8.3 Phase 3: Wave Exit Scope Check

**Used in:** Wave 4B remediation pass, to validate remediated files.

After a remediation agent writes missing content (e.g., Parts 2-4 of `small-mammals.md`), the orchestrator runs the wave exit scope check (`www/PNW/shared/wave-exit-scope-check.md`) on the remediated file. This confirms that the remediation agent actually delivered the content it was assigned:

- **Part-based matcher:** If the document declares Parts 1-4, verify that `## Part 2`, `## Part 3`, `## Part 4` headings now exist.
- **Count-based matcher:** If the document targets ~100 species, verify that the actual species count meets the 80% threshold.
- **Coverage-based matcher:** If the document covers "all 11 ecoregion bands," verify that all 11 band identifiers appear.

The scope check on remediated files prevents the same gap from recurring: the original Wave 1 agent delivered an incomplete document, and the scope check ensures the remediation agent does not repeat the same shortfall.

### 8.4 Phase 1a: Document Size Estimation

**Indirect integration.** The document size estimation guide (`www/PNW/shared/document-size-estimation.md`) is a Wave 0 tool that prevents some remediation needs from arising in the first place. If a survey document is pre-identified as exceeding the 32,000 token limit and split before Wave 1, the "Parts 2-4 missing" class of gap should not occur. However, size estimation does not prevent all gaps (source count shortfalls, wording issues, cross-reference gaps), so Wave 4B remediation remains necessary even with perfect Wave 0 planning.

### 8.5 Phase 1b: Source Budget Template

**Indirect integration.** The source budget template (`www/PNW/shared/source-budget-template.md`) sets category-level source targets at Wave 0. If the source index agent meets its per-category minimums, the CF-11 type gap (72 of 80+ sources) should not occur. But if it does, the source budget gap analysis (Section 3 of the template) provides the specific topics needed, which the 4B remediation agent uses to add the missing sources.

---

## 9. Worked Example: The MAM Verification-Remediation Cycle

This section walks through the MAM mission's Wave 4 as it would have played out under the 4A/4B/4C protocol. The events described below actually happened; the protocol structure is applied retroactively to show how it organizes the work.

### 9.1 Wave 4A: VERIFY-MAM Finds the Gaps

The VERIFY-MAM agent runs the full 36-test verification matrix against the 13 MAM research documents. It produces the verification report with 31 PASS, 5 PARTIAL, 0 FAIL.

The verification agent extracts the 5 PARTIAL results into the remediation action list:

| # | Test ID | Gap Description | Remediation Type | Scope | Estimated Effort | Priority |
|---|---------|----------------|-----------------|-------|-----------------|----------|
| 1 | CF-01 | Terrestrial species count: 66 full profiles, target 140+. Root cause: small-mammals.md Parts 2-4 (Lagomorpha ~8 spp, Soricomorpha ~10 spp, Chiroptera ~18 spp) absent. | MISSING | 1 file (small-mammals.md), ~36 species profiles | 40 min | HIGH (affects CF-03, CF-14) |
| 2 | CF-03 | Profile completeness: ~36 species lack full 8-field profiles. Same root cause as #1. | MISSING | Same scope as #1 (resolved by same remediation) | 0 min (resolved by #1) | HIGH (dependent on #1) |
| 3 | CF-14 | Bat old-growth association: bat profiles lack roost requirement data (snag diameter, decay stage). Same root cause as #1 -- bat profiles absent. | MISSING | Same scope as #1 (resolved by same remediation) | 0 min (resolved by #1) | HIGH (dependent on #1) |
| 4 | CF-11 | Source count: 72 unique sources, target 80+. Gap in paleontology (2-3 sources), WNS surveillance (2 sources), ethnographic (1-2 sources), steppe ecology (1-2 sources). | ENRICHMENT | 1 file (source-index.md), 8+ new source entries across 4 categories | 20 min | MEDIUM |
| 5 | CF-02 | Marine species count: 27 full profiles, target 35+. Shortfall in pinniped/vagrant coverage. | DEFERRED | Would require new profiles for rare vagrants not in current corpus scope. | -- | LOW |

**Key observations:**

- Items 1, 2, and 3 share a root cause (Finding F-01). The remediation agent for item 1 resolves all three. Items 2 and 3 have 0-minute effort because they are dependent on item 1.
- Item 4 is ENRICHMENT, not MISSING. The source index already identifies the gap categories. The remediation agent adds sources, not profiles.
- Item 5 is DEFERRED. The marine species shortfall (27 of 35+) cannot be closed by reformatting existing data. It would require writing profiles for vagrant marine mammals not currently in scope. This is new research, not remediation.

### 9.2 Wave 4B: Remediation Agent Writes Parts 2-4

The orchestrator reads the action list. It identifies:
- 3 HIGH items (all resolved by one remediation pass on small-mammals.md)
- 1 MEDIUM item (source-index.md enrichment)
- 1 LOW item (documented, not worked)

Time budget: 60 minutes.

**Agent REMEDIATE-MAM-SM** receives:
- Action items #1, #2, #3
- Input files: small-mammals.md (current), elevation-matrix.md (scaffold data), shared-schema.md (profile template), source-index.md (citations)
- Constraint: write Parts 2-4 of small-mammals.md. Follow shared schema. Include WNS Status, WNS Risk Tier, and WNS Notes fields for all Chiroptera profiles per the conditional field activation table.

The agent writes:
- Part 2: Lagomorpha (8 species -- American pika, snowshoe hare, pygmy rabbit, mountain cottontail, eastern cottontail, black-tailed jackrabbit, white-tailed jackrabbit, brush rabbit)
- Part 3: Soricomorpha/Eulipotyphla (10 species -- 7 shrews, 2 moles, 1 shrew-mole)
- Part 4: Chiroptera (18 species -- all with WNS Status conditional fields populated from elevation-matrix.md WNS column)

Time used: 40 minutes.

**Agent REMEDIATE-MAM-SRC** receives (if time permits):
- Action item #4
- Input files: source-index.md (current), gap analysis from source-index.md Section "Sources Still Needed"
- Constraint: add 8+ sources to reach the 80+ target. Fill the named category gaps.

Time remaining: 20 minutes. The orchestrator launches this agent with the remaining budget.

The agent adds 8 new sources. However, it reaches only 7 in the available time (3 paleontology, 2 WNS surveillance, 1 ethnographic, 1 steppe ecology). The 8th source (a second ethnographic source) is not found within the time window.

Time used: 20 minutes. Budget exhausted.

**Remediation log produced:**

| # | Test ID | Remediation Type | Action Taken | Files Modified | Time (min) | Result |
|---|---------|-----------------|-------------|---------------|------------|--------|
| 1 | CF-01 | MISSING | Wrote small-mammals.md Parts 2-4: 36 species profiles with full schema fields | small-mammals.md | 40 | DONE |
| 2 | CF-03 | MISSING | Resolved by #1 -- all 36 new profiles include 8 mandatory fields | small-mammals.md | 0 | DONE |
| 3 | CF-14 | MISSING | Resolved by #1 -- all 18 bat profiles include WNS Status, roost requirements | small-mammals.md | 0 | DONE |
| 4 | CF-11 | ENRICHMENT | Added 7 sources to source-index.md (79 total, target 80+) | source-index.md | 20 | PARTIAL |

Items deferred:

| # | Test ID | Original Priority | Reason for Deferral |
|---|---------|------------------|---------------------|
| 5 | CF-02 | LOW | Marine species shortfall requires new vagrant profiles not in corpus scope |
| 4 | CF-11 | MEDIUM (partially done) | 79 of 80+ sources achieved. 1 ethnographic source outstanding. Time budget exhausted. |

### 9.3 Wave 4C: Re-Verification of Affected Tests

4B modified two files: `small-mammals.md` and `source-index.md`. The re-verification agent receives the test IDs to re-run:

- CF-01 (terrestrial species count) -- small-mammals.md modified
- CF-03 (profile completeness) -- small-mammals.md modified
- CF-14 (bat old-growth association) -- small-mammals.md modified
- CF-11 (bibliography size) -- source-index.md modified

The agent re-runs these four tests only. Results:

| ID | Test | Original Result | Re-Verification Result | Notes |
|----|------|----------------|----------------------|-------|
| CF-01 | Terrestrial species count (140+) | ~~PARTIAL~~ (66 full profiles) | **PASS** | Now 102 full profiles (66 original + 36 from Parts 2-4). With elevation matrix entries, 133 terrestrial species documented. |
| CF-03 | Profile completeness (8 fields) | ~~PARTIAL~~ (~36 species lacked profiles) | **PASS** | All 102 full profiles include all 8 mandatory fields. Chiroptera profiles include WNS conditional fields. |
| CF-14 | Bat old-growth association | ~~PARTIAL~~ (bat profiles absent) | **PASS** | 18 bat profiles with roost requirements (snag diameter, decay stage, height preferences) and WNS Status fields. |
| CF-11 | Bibliography size (80+) | ~~PARTIAL~~ (72 sources) | **PARTIAL** | Now 79 sources. 1 short of 80+ target. Remaining gap: 1 ethnographic source. Reclassified as DEFERRED. |

**Updated test summary after 4C:**

| Test Group | Total | PASS (original) | PASS (after 4C) | PARTIAL | DEFERRED |
|-----------|-------|-----------------|-----------------|---------|----------|
| Safety-Critical (SC-*) | 9 | 9 | 9 | 0 | 0 |
| Core Functionality (CF-*) | 14 | 9 | 12 | 1 (CF-11) | 1 (CF-02) |
| Integration (IN-*) | 8 | 8 | 8 | 0 | 0 |
| Edge Cases (EC-*) | 5 | 5 | 5 | 0 | 0 |
| **Total** | **36** | **31** | **34** | **1** | **1** |

Pass rate improved from 86% (31/36) to 94% (34/36). The 1 remaining PARTIAL (CF-11, source count 79/80) is non-blocking. The 1 DEFERRED (CF-02, marine species count) is documented with justification. All 9 safety-critical gates remain PASS. Hemlock signs off.

### 9.4 What the Protocol Changed

Without the 4A/4B/4C structure, the MAM mission closed at 31/36 (86%) with 5 known PARTIAL results and no planned remediation. With the structure:

- 3 PARTIAL results upgraded to PASS (CF-01, CF-03, CF-14)
- 1 PARTIAL result partially improved (CF-11: 72 to 79 sources)
- 1 PARTIAL result documented as DEFERRED with justification (CF-02)
- Total time: ~90 minutes (30 min verification + 60 min remediation, within the 90-minute absolute ceiling with Hemlock approval for the extended budget)
- The work was planned, scoped, time-bounded, and formally re-verified

The infrastructure made the remediation visible, bounded, and verifiable. That is what infrastructure does.

---

*Phase 5 -- Wave 4 Verification and Remediation Protocol*
*PNW Research Series -- Shared Mission Infrastructure*
*Author: Lex (execution discipline muse, near the real axis)*
*The infrastructure before the mission. Always.*
