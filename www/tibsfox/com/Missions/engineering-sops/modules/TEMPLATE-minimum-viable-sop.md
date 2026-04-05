# TEMPLATE: Minimum Viable SOP for GSD Skill Development

**Module:** Template | **Track:** Wave 3 (Publication) | **Role:** EXEC_B  
**Mission:** Engineering the Process — Standard Operating Procedures  
**Date:** 2026-04-05 | **Status:** Complete  
**Dependencies:** M1 (SOP Anatomy), M5 (GSD Implementation)

---

## Abstract

A minimum viable SOP (MV-SOP) is the smallest document that is still a document — not a checklist, not a README, not a SKILL.md. It covers all eight canonical sections, is executable by someone other than its author, and produces auditable evidence. Anything less is informal guidance. Anything more is overhead until the procedure has proven its worth.

This template is pre-configured for GSD skill development. It is validated against three production skills: `vision-to-mission`, `research-engine`, and `done-retirement`. The SKILL.md ↔ SOP crosswalk at the end converts between formats in both directions.

---

## Part 1: The Template

Copy from the horizontal rule below. Replace every `[bracketed placeholder]` before the document is used. Do not delete any section heading; if a section is not applicable, write "N/A — [reason]" rather than removing it.

---

---

# [SOP Title — imperative mood, action + object + context]

**SOP ID:** [XXX-NNN]  
**Version:** [M.m.p]  
**Effective Date:** [YYYY-MM-DD]  
**Review Date:** [YYYY-MM-DD + 6 months for new skills; + 12 months for stable skills]  
**Owner:** [Role or name of the person accountable for this SOP]  
**Approval:** [Role or name of the person who authorizes execution]

---

## 1.0 Purpose

[1–2 sentences. Name the artifact produced, the environment or system affected, and the operational guarantee this procedure provides. Do not explain how the procedure works here. A reader should know within 10 seconds whether this is the right document.]

---

## 2.0 Scope

**Applies to:** [Who executes this? What systems, tools, or codebases are involved? Under what conditions?]

**Does NOT apply to:** [Explicit exclusions. Name at least one adjacent procedure this is often confused with. State the governing document for excluded cases.]

---

## 3.0 References

| Ref | Document / Tool | Relationship |
|-----|----------------|--------------|
| R1 | [SKILL.md or upstream SOP] | Precondition — must complete before this procedure |
| R2 | [Downstream SOP or handoff target] | Postcondition — this procedure feeds into it |
| R3 | [Tool, schema, or standard] | Informational — consulted during execution |

---

## 4.0 Definitions

| Term | Definition |
|------|-----------|
| [Term 1] | [Definition. Include the context in which this term is used if it differs from general use.] |
| [Term 2] | [Definition] |
| [Acronym] | [Expansion + one-sentence meaning] |

*Minimum: define any term from the Gastown vocabulary (bead, polecat, convoy, hook, mayor, witness, refinery, chipset, CAPCOM) used in this SOP.*

---

## 5.0 Roles and Responsibilities

| Role | What They Do | RACI |
|------|-------------|------|
| [Skill Author] | Writes and updates the SKILL.md; owns the quality gates in Section 7 | R |
| [Reviewer / CAPCOM] | Reviews output against success criteria; approves or rejects | A |
| [Executor / Polecat] | Runs the procedure; follows steps exactly; reports deviations | C |
| [Observer / Witness] | Receives completion notification; records audit trail | I |

*RACI key: R = Responsible (does the work), A = Accountable (answers for the result), C = Consulted (provides input), I = Informed (notified of outcome).*

---

## 6.0 Procedure

### 6.1 Prerequisites

All conditions below must be true before Step 1 begins. If any condition is false, do not proceed — resolve the condition and restart.

- [ ] [Upstream SOP / skill / artifact] has completed and its output is accessible at [path or state location]
- [ ] [Tool / dependency] is installed and verified: `[verification command]`
- [ ] [Permissions / credentials / branch state] are in the expected state: `[check command]`
- [ ] [Known-bad state condition] does NOT exist: `[check command]`

### 6.2 Steps

Each step follows the **When / Perform / Until** pattern. Steps are numbered. If a step produces a file or state change, the path or state key is stated explicitly. If a step has a decision branch, both branches are documented.

1. **When** all prerequisites in 6.1 are satisfied, **perform** [action] **until** [measurable result — file exists, tests pass, state transitions to X, command exits 0].

2. **When** Step 1 is complete, **perform** [action]. Expected output: `[example or path]`.

3. **When** Step 2 is complete, **perform** [action with the constraint or parameter that makes this step specific]. Do not [common mistake that voids the next step].

4. **When** Step 3 is complete, **perform** the quality check in Section 7.0. If it passes, continue. If it fails, see Section 6.3.

5. **When** quality checks pass, **perform** [commit / push / notify action] **until** [terminal state — branch pushed, notification delivered, state file updated].

*Add or remove steps as needed. The minimum viable procedure has at least 3 steps and at most 12. More than 12 steps indicates the SOP should be split into two documents (see the Single-Responsibility Test in Part 2).*

### 6.3 Error Handling

| Condition | Recovery |
|-----------|----------|
| **If** [Step N fails because X], **then** [recovery action — retry, escalate, or revert to state Y]. Do not proceed to Step N+1 until resolved. |
| **If** [irreversibility boundary is reached and a downstream error occurs], **then** the work is safe — log the failure, notify [role], and continue with the remaining steps. |
| **If** [the procedure cannot be completed and work has not yet been committed], **then** set status to `in_progress`, notify [role], and close without prejudice. |

---

## 7.0 Quality Checks

Run these checks at Step 4 of the procedure. All items must pass before the procedure proceeds to completion.

- [ ] [Primary output file / artifact] exists at `[path]` and is non-empty
- [ ] [Test suite or verification command] exits 0: `[command]`
- [ ] [Content requirement — e.g., all 8 SOP sections present, description field ≤ 250 chars] is satisfied
- [ ] [Integration requirement — downstream skill / system can parse or consume the output] is satisfied
- [ ] [No regression] — [check that confirms nothing previously passing has broken]

*Minimum: at least 3 checks. Maximum: 10. More than 10 checks indicates the quality criteria are not well-prioritized.*

---

## 8.0 Records and Success Criteria

**Success looks like:** [One sentence describing the observable terminal state. What exists or what is true when this procedure has been executed correctly?]

**Records produced:**

| Record | Path / Location | Retention |
|--------|----------------|-----------|
| [Primary output artifact] | `[path]` | [Until superseded / N versions / permanent] |
| [Completion notification or state update] | [mail channel / state file / git log] | [Audit requirement] |
| [Test run log or quality check result] | [Where captured] | [Until next execution or permanent] |

**Audit artifacts:** [What can an auditor examine to verify this procedure was followed? Minimum: the commit that introduced the output file, the test run result, and the completion notification if applicable.]

---

**Change Log:**

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0.0 | [YYYY-MM-DD] | [Author] | Initial release |

---

---

## Part 2: Template Usage Guide

### How to Fill Each Section

**Header block.** Fill every field before the document is shared. SOP ID follows the pattern `[DOMAIN]-[NNN]` where DOMAIN is a 3-letter code for the skill area (e.g., SKL for skill development, REL for release, CHG for change control). Version uses semantic versioning with explicit rules in the Definitions section.

**Section 1.0 — Purpose.** Write one sentence first. If you cannot state the purpose in one sentence, the SOP's boundary is not yet clear — resolve that before proceeding. The sentence must name: (1) what artifact or outcome this produces, (2) what system or process it operates on, and (3) what guarantee it provides. The second sentence, if needed, states who benefits and why that matters.

**Section 2.0 — Scope.** Write the exclusions first. It is easier to identify what a procedure does not cover than to enumerate everything it does cover. The exclusion list prevents scope creep and guides operators who are unsure which SOP applies. At least one exclusion must name a specific adjacent procedure or skill.

**Section 3.0 — References.** Include version numbers wherever possible. A reference without a version is a soft dependency — the document may change without notice and invalidate this SOP. Mark the relationship type (precondition, postcondition, informational) because executors need to know which references must be consulted before step 1 versus during execution.

**Section 4.0 — Definitions.** Define every term a new executor would need to look up. In the GSD ecosystem, assume a reader with general software engineering background but no Gastown vocabulary. Bead, polecat, convoy, hook, mayor, witness, refinery, chipset, and CAPCOM are all non-obvious and must be defined if used.

**Section 5.0 — Roles and Responsibilities.** Use the RACI matrix even for procedures executed by a single agent. The Accountable cell is the most important: it names who answers if the procedure produces wrong results. The Informed cell prevents the common failure mode where work completes without anyone downstream knowing it happened.

**Section 6.0 — Procedure.** Write for the first-time executor, not the expert. The self-containment test: delete every other document and hand the executor this SOP. If they cannot execute it correctly on the first attempt, the procedure has implicit dependencies. Add those dependencies as prerequisites or inline them as context in the relevant steps.

Use the **When / Perform / Until** step structure. "When" states the entry condition (what must be true before this step begins). "Perform" states the action (verb + object + constraint). "Until" states the exit condition (what observable outcome proves the step is complete). Steps without exit conditions are ambiguous — the executor cannot know when to proceed.

**Section 7.0 — Quality Checks.** Quality checks are objective, not subjective. Replace "looks correct" with a verification command. Replace "seems complete" with a file count, word count, or schema validation. Every check must be executable without judgment.

**Section 8.0 — Records and Success Criteria.** The success criteria sentence is the most important thing an auditor reads. Write it as an observable terminal state: "Skill file `SKILL.md` exists at the designated path, all tests pass, and the completion notification has been delivered to the mayor." Then list the records that prove that state was reached.

---

### What "Good Enough" Looks Like Per Section

| Section | Minimum Acceptable | Not Acceptable |
|---------|-------------------|----------------|
| 1.0 Purpose | 1 sentence naming artifact, system, and guarantee | "Describes the process for doing X" |
| 2.0 Scope | Inclusions + at least 1 named exclusion | Inclusions only |
| 3.0 References | At least 1 upstream and 1 downstream reference with relationship type | "See relevant documentation" |
| 4.0 Definitions | All Gastown terms defined | Undefined domain-specific vocabulary |
| 5.0 Roles | RACI with at least R and A filled | "The developer does this" |
| 6.0 Procedure | 3+ When/Perform/Until steps with error handling | Numbered prose without entry/exit conditions |
| 7.0 Quality Checks | 3+ objective, command-verifiable checks | "Verify the output looks right" |
| 8.0 Records | Success criteria sentence + records table | Implied by the procedure completing |

---

### Common Mistakes Per Section

**Purpose:** Writing a process description instead of a purpose statement. If your Purpose section contains the word "steps," "process," "first you," or "then," it is a procedure section in disguise. Move that content to Section 6.

**Scope:** Listing only what is in scope. Operators encountering ambiguous cases need explicit exclusions to know which document governs their situation. An SOP with no exclusions will accrete scope over time as operators apply it to adjacent cases.

**References:** Omitting version numbers and relationship types. A reference list that says "see the done-retirement skill" is incomplete. The SOP should specify which version of done-retirement it was written against and whether that skill must complete before this one begins.

**Definitions:** Defining common terms and skipping domain-specific ones. Define the terms a new team member would not know, not the terms found in any dictionary. In GSD context, "bead" needs a definition; "file" does not.

**Roles:** Skipping the RACI because "it's obvious." Obvious roles become disputed roles when something goes wrong. Write the RACI before an incident forces the question.

**Procedure:** Writing steps that contain decisions without documenting both branches. If a step contains "if," document the else. If an operator can make a judgment call, document what information governs that judgment.

**Quality Checks:** Including checks that require judgment ("verify the skill description is accurate"). Replace with an objective criterion ("verify the description field is ≤ 250 characters and begins with an action verb").

**Records:** Listing records without specifying where they are stored and how long they are retained. A record with no location is not auditable.

---

### When to Split One SOP into Two (Single-Responsibility Test)

An SOP has a single responsibility if and only if its Purpose section can be stated in one sentence without conjunctions. If the Purpose requires "and" or "or" to describe two distinct outcomes, the SOP has two responsibilities and should be split.

Apply these tests:

1. **The "and" test.** Can you split the Purpose sentence at "and" and get two coherent purpose statements? If yes, split the SOP.

2. **The roles test.** Does the RACI have two different Responsible parties for different steps? If yes, each Responsible party likely owns a separate procedure.

3. **The frequency test.** Are different parts of the procedure executed at different frequencies (some steps run hourly, others run on release)? If yes, the high-frequency path and low-frequency path should be separate SOPs.

4. **The reversibility test.** Does the procedure contain an irreversibility boundary (like done-retirement's push step) after which it continues into cleanup and notification? The steps before the boundary and the steps after it can be separate SOPs, with the second SOP triggered by the completion of the first.

5. **The word count test.** If the procedure section (6.0) exceeds 800 words, the SOP is likely describing two or more procedures. This is a signal, not a rule — review for dual responsibility before splitting.

---

### Version Bump Rules

GSD skill SOPs follow semantic versioning aligned with the SKILL.md version field:

| Change Type | Version Bump | Examples |
|-------------|-------------|----------|
| New step added or step significantly restructured | **Minor** (1.0.0 → 1.1.0) | New prerequisite, new error handling branch, new quality check |
| Step wording clarified, typo fixed, example updated | **Patch** (1.0.0 → 1.0.1) | Clarified ambiguous phrase, corrected command, added example |
| SOP scope changed, roles redefined, procedure incompatibly changed | **Major** (1.0.0 → 2.0.0) | New accountability model, removed steps, changed irreversibility boundary |
| SOP retired and replaced by a different document | **Major + deprecation notice** | Successor SOP named in records section |

The Review Date field governs periodic review. A patch bump resets the Review Date by the original period (6 or 12 months). A major bump requires a new review cycle starting from the effective date.

---

## Part 3: Validation Against Three GSD Skills

The following validates the MV-SOP template by filling it for three production skills. Each validation shows an abbreviated completed template, identifies what mapped cleanly versus required adaptation, and closes with a recommendation.

---

### Validation 1: vision-to-mission

**Abbreviated SOP:**

---

**SOP ID:** SKL-001  
**Version:** 1.0.0  
**Effective Date:** 2026-04-05  
**Review Date:** 2026-10-05  
**Owner:** Skill Author  
**Approval:** CAPCOM / Mission Flight Director

**1.0 Purpose.** This procedure transforms a user's builder vision — described in conversation — into a complete GSD-ready mission package (milestone spec, component specs, wave plan, test plan, and README) ready for handoff to Claude Code and the GSD orchestrator.

**2.0 Scope.**  
Applies to: Any request to decompose a described system into wave-based executable tasks; requests to structure a vision for GSD; requests to create a mission package or milestone spec.  
Does NOT apply to: Research document production (governed by `research-mission-generator`); single-file documentation tasks; vision docs where the goal is to understand rather than to build.

**3.0 References.**

| Ref | Document | Relationship |
|-----|---------|--------------|
| R1 | `references/vision-archetypes.md` | Informational — read before drafting vision doc |
| R2 | `references/mission-templates.md` | Informational — templates for every output file |
| R3 | `research-mission-generator` SKILL.md | Postcondition exclusion — governs research output |

**4.0 Definitions.**

| Term | Definition |
|------|-----------|
| Mission package | The folder of markdown files produced by this skill: vision doc, milestone spec, component specs, wave plan, test plan, README |
| Archetype | One of 6 structural patterns (Educational Pack, Infrastructure Component, etc.) that classifies the vision and shapes the output |
| Wave | A parallel execution group within the mission plan; Wave 0 is always shared types; Wave N-1 builds; Wave N integrates |
| Chipset | The crew configuration YAML that specifies which agents execute which components at what model tier |
| Self-containment test | Verification that a component spec can be handed to an agent without any other files and result in correct execution |

**5.0 Roles and Responsibilities.**

| Role | What They Do | RACI |
|------|-------------|------|
| FLIGHT / Skill Executor | Executes all 10 steps of the procedure | R |
| User / Mission Director | Provides the vision; approves the delivered package | A |
| Downstream Claude Code Agent | Receives component specs; executes builds | I |

**6.0 Procedure.** [Steps 1–10 as defined in SKILL.md with When/Perform/Until framing applied]  
Prerequisites: User has described a buildable system in conversation. Domain does not require Full pipeline research unless safety or cultural sensitivity signals are detected.

**7.0 Quality Checks.**
- [ ] Vision doc passes all 8 quality gates (narrative, problem statement, one-interaction-arc sentence, ASCII diagram, chipset YAML, success criteria 8–12, no function signatures, through-line present)
- [ ] Every component spec passes the self-containment test
- [ ] Test plan has ≥ 2 tests per success criterion
- [ ] Output folder contains all files in the Step 9 manifest
- [ ] Zip file created and copied to outputs directory

**8.0 Records.** Success looks like: the mission package folder exists at the designated path, all quality gates pass, and the zip file has been delivered to the user. Records: mission folder (permanent, versioned by milestone name), quality gate checklist results (per-execution).

---

**Gap analysis — vision-to-mission:**

| SOP Section | Template Coverage | Notes |
|-------------|:-----------------:|-------|
| 1.0 Purpose | Full | `description:` field maps directly; one-sentence core is present |
| 2.0 Scope | Full | Pipeline Speed Detection table + "not researchers' output" exclusion maps well |
| 3.0 References | Full | `references/` directory is a direct structural match |
| 4.0 Definitions | Requires effort | Archetype table implies definitions but no formal section; template forces this into the open |
| 5.0 Roles | Requires effort | 30/60/10 model assignment handles the executor tier but lacks an Accountable party |
| 6.0 Procedure | Full | 10 numbered steps with clear structure; When/Perform/Until requires reframing existing prose |
| 7.0 Quality Checks | Full | "Vision doc quality gates" checklist maps directly |
| 8.0 Records | Requires effort | File manifest defines what exists but no explicit success criteria sentence |

**Recommendation.** Add a `## Success Criteria` subsection to the SKILL.md that states in one sentence what the completed output looks like. Add a formal `## Definitions` section covering the 6 archetype names and key Gastown terms. These two additions would make vision-to-mission a 8/8 SOP-complete skill.

---

### Validation 2: research-engine

**Abbreviated SOP:**

---

**SOP ID:** SKL-002  
**Version:** 1.0.0  
**Effective Date:** 2026-04-05  
**Review Date:** 2026-10-05  
**Owner:** Skill Author  
**Approval:** CAPCOM

**1.0 Purpose.** This procedure executes an autonomous research pipeline from a user-supplied topic to a structured document series with HTML and PDF output, formatted for publication to the project's research series.

**2.0 Scope.**  
Applies to: Deep research requests that will produce 4 or more structured documents; investigation or analysis tasks with multi-document output; topics requiring parallel research across multiple investigation tracks.  
Does NOT apply to: Single-document research tasks; vision-to-mission research references (governed by the Full pipeline in `vision-to-mission`); data queries that can be answered in a single agent turn.

**3.0 References.**

| Ref | Document | Relationship |
|-----|---------|--------------|
| R1 | `template.tex` | Informational — LaTeX template for PDF output |
| R2 | `html-template.html` | Informational — HTML template for reading output |
| R3 | `build.sh` | Informational — automated pandoc build script |
| R4 | `series.js` | Postcondition — project code must be added here on completion |

**4.0 Definitions.**

| Term | Definition |
|------|-----------|
| Investigation track | One research direction within the decomposed topic; maps 1:1 to one output document |
| Project code | The 3–4 letter identifier for the research project added to `series.js` (e.g., HEL, OOPS, OPEN) |
| Knowledge graph | `knowledge-nodes.json` — cross-reference structure linking entities across documents |
| Fact-check pass | An explicit review step confirming every claim has a citation or stated inference chain |

**5.0 Roles and Responsibilities.**

| Role | What They Do | RACI |
|------|-------------|------|
| Research Executor | Runs all 6 pipeline stages; owns document quality | R |
| User / Requester | Supplies topic and approves published output | A |
| Research Agents (2–6) | Execute parallel investigation tracks in Stage 2 | C |

**6.0 Procedure.** [6 pipeline stages: Decompose → Parallel Research → Aggregate → Structure → Build → Publish]  
Prerequisites: Topic is defined and scoped to 4–12 investigation tracks. Build infrastructure (`template.tex`, `html-template.html`, `build.sh`) exists at the project level.

**7.0 Quality Checks.**
- [ ] Every document meets the 1,500-word minimum
- [ ] Every claim has evidence or an explicit reasoning chain
- [ ] Cross-references between documents are bidirectional
- [ ] Fact-check pass complete (reviewer sign-off documented)
- [ ] Three output formats exist: markdown source, HTML, PDF

**8.0 Records.** Success looks like: the document series is published to the project's research index with all formats present, the project code is in `series.js`, and the GitHub release and FTP sync are complete. Records: published document set (permanent), `knowledge-nodes.json` (permanent), `retrospective.md` (permanent).

---

**Gap analysis — research-engine:**

| SOP Section | Template Coverage | Notes |
|-------------|:-----------------:|-------|
| 1.0 Purpose | Full | Short `description:` field maps cleanly; performance evidence ("Proven at HEL") is a bonus |
| 2.0 Scope | Partial | Activation trigger exists; no "Does NOT apply to" section. Template forced explicit exclusions |
| 3.0 References | Partial | Build tooling referenced; no upstream/downstream procedural references |
| 4.0 Definitions | Partial | Project codes section defines naming convention; broader vocabulary was missing |
| 5.0 Roles | Missing in SKILL.md | Template forced role decomposition: executor, approver, parallel research agents |
| 6.0 Procedure | Full | 6-stage pipeline maps directly to When/Perform/Until structure |
| 7.0 Quality Checks | Full | Quality Standards section maps directly |
| 8.0 Records | Partial | Output file set defined in Stage 4; no success criteria sentence |

**Recommendation.** The research-engine skill's most significant structural gap is Roles and Responsibilities — it was written for a single executor model and the multi-agent Stage 2 is undocumented as a role assignment. Add a `## Crew Configuration` section specifying how many research agents to launch, at what model tier, and under what coordination pattern. Also add an explicit `## When NOT to Use` section. These two additions address the triggering accuracy risk and the role ambiguity that the template surfaces.

---

### Validation 3: done-retirement

**Abbreviated SOP:**

---

**SOP ID:** SKL-003  
**Version:** 1.0.0  
**Effective Date:** 2026-04-05  
**Review Date:** 2026-10-05  
**Owner:** Polecat Executor / Gastown Chipset Maintainer  
**Approval:** Mayor Coordinator

**1.0 Purpose.** This procedure retires a completed polecat work item by validating the work, committing and pushing the branch to the shared repository, submitting a merge request to the refinery queue, notifying the convoy and mayor, cleaning up the local workspace, and terminating the agent.

**2.0 Scope.**  
Applies to: Any polecat that has completed its assigned work item (bead) and is ready to retire; hook status transitions to `completed`; work item status transitions to `done`; convoy progress tracking on batch completions.  
Does NOT apply to: Merging branches (governed by `refinery-merge`); re-assigning incomplete work (governed by `mayor-coordinator`); force-retiring work that has not met acceptance criteria.

**3.0 References.**

| Ref | Document | Relationship |
|-----|---------|--------------|
| R1 | `polecat-worker` SKILL.md | Precondition — polecat must complete work before invoking done-retirement |
| R2 | `refinery-merge` SKILL.md | Postcondition — done-retirement feeds MR into refinery queue |
| R3 | `mayor-coordinator` SKILL.md | Postcondition — done-retirement notifies mayor on completion |
| R4 | `references/gastown-origin.md` | Informational — derivation from Gastown `done.go` |

**4.0 Definitions.**

| Term | Definition |
|------|-----------|
| Bead | A discrete work item in the Gastown system; has an ID, assignee, status, and acceptance criteria |
| Polecat | A worker agent in the Gastown system that executes a single bead |
| Hook | The polecat's work assignment record in `.chipset/state/hooks/`; transitions from active to empty on retirement |
| Mayor | The coordinator agent that assigns work and receives completion notifications |
| Witness | The observer agent that maintains the audit trail for the convoy |
| Convoy | A batch dispatch grouping multiple beads under a single progress tracking ID |
| Refinery | The merge queue processor that rebase-test-merges polecat branches to main |
| Irreversibility boundary | The point at Stage 3 (Push) after which the retirement cannot be undone |

**5.0 Roles and Responsibilities.**

| Role | What They Do | RACI |
|------|-------------|------|
| Polecat | Invokes the retirement pipeline when work is complete | R |
| Mayor | Receives completion notification; can retry failed post-push stages | A |
| Refinery | Processes the MR submitted at Stage 4 | C |
| Witness | Receives retirement notification; records audit trail | I |

**6.0 Procedure.** [7 stages: Validate → Commit → Push (IRREVERSIBLE) → Submit → Notify → Cleanup → Terminate]  
Prerequisites: Work item exists with status `in_progress`. Polecat hook is `active`. Acceptance criteria are met (validated in Stage 1). Working branch has no uncommitted changes (ensured in Stage 2).

**7.0 Quality Checks.**  
Stage 1 (Validate) is entirely a quality check:
- [ ] Bead exists and status is `in_progress`
- [ ] Hook is active and assigned to this polecat
- [ ] Polecat is the designated assignee
- [ ] Acceptance criteria for the bead are met

**8.0 Records.** Success looks like: the polecat's branch exists in the shared repository (`polecat/{beadId}`), the work item status is `done`, the MR record exists in `state/merge-queue/`, the mayor and witness have received completion notifications, the workspace has been cleaned up, and the agent is terminated. Records: remote branch (permanent until merge), MR state record (until merged), durable mail messages (until acknowledged), work item status file (until archived).

---

**Gap analysis — done-retirement:**

| SOP Section | Template Coverage | Notes |
|-------------|:-----------------:|-------|
| 1.0 Purpose | Full | Hardware analogy in body text adds depth; `description:` field maps cleanly |
| 2.0 Scope | Full | Activation Triggers + "What Done Retirement Does NOT Do" is the most SOP-complete scope in the set |
| 3.0 References | Full | Integration table (8 skills) + `references/gastown-origin.md` maps directly |
| 4.0 Definitions | Full | Domain vocabulary (bead, polecat, convoy, hook, mayor, witness, refinery) defined through consistent use |
| 5.0 Roles | Full | Communication Protocol table maps directly to RACI; polecat/mayor/witness/refinery chain is explicit |
| 6.0 Procedure | Full | 7-stage pipeline with TypeScript code examples is the most detailed procedure in the set |
| 7.0 Quality Checks | Full | Stage 1 (Validate) is an explicit quality gate before irreversibility |
| 8.0 Records | Partial | "Done Means Gone" principle implies success criteria; template forces explicit success criteria statement |

**Recommendation.** The done-retirement skill is 7/8 SOP-complete. Add a single `## Success Criteria` sentence at the end of the skill body. Given that the skill explicitly models the irreversibility boundary and the audit trail, this sentence would simply formalize what the "Done Means Gone" section already implies. Effort: one sentence. Impact: 8/8 SOP coverage, audit-ready without interpretation.

---

## Part 4: SKILL.md ↔ SOP Crosswalk

### Path A: "I have a SKILL.md and need an SOP"

Use when: a skill is being promoted to an auditable procedure; a regulated process requires a formal SOP; the skill is executed by operators who are not the author.

```
SKILL.md field / section          →    SOP section to populate
─────────────────────────────────────────────────────────────────
description: front-matter         →    1.0 Purpose
  (first sentence = purpose;           (extract the artifact, system,
  triggers = scope inclusions)          and guarantee; keep to 1-2 sentences)

When to Use / Activation Triggers →    2.0 Scope → "Applies to"

When NOT to Use (if present)      →    2.0 Scope → "Does NOT apply to"
  (if absent: write one; at least       (add at minimum 1 adjacent skill
  one exclusion is required)            as an explicit exclusion)

references/ subdirectory          →    3.0 References
  (one row per file;                    (classify each as precondition,
  add version if known)                  postcondition, or informational)

Domain vocabulary in body text    →    4.0 Definitions
  (scan for Gastown terms;              (one row per term; definition
  scan for acronyms)                     should be standalone)

Chipset config / model assignment →    5.0 Roles and Responsibilities
  (Opus = Accountable/high-judgment;    (map Opus → A, Sonnet/Haiku → R/C;
  activation profiles = executor tier)   add a human Informed party)

Primary Workflow / pipeline steps →    6.0 Procedure (6.2 Steps)
  (reframe each stage as                (When [entry condition],
  When/Perform/Until)                    Perform [action],
                                         Until [exit condition])

Quality Checks / Quality Gates    →    7.0 Quality Checks
  (make each check command-              (add the verification command
  verifiable if it is not already)       for any subjective checks)

Deliverable specification /       →    8.0 Records and Success Criteria
  output file manifest                  (write one success criteria sentence;
  (implicit success often needs          list records with path and retention)
   to become explicit)
```

**Time estimate:** 45–90 minutes for a well-structured SKILL.md. Most time is spent on Section 2.0 exclusions (if the skill has none), Section 4.0 definitions (if vocabulary is undefined), and Section 8.0 success criteria (always requires writing from scratch).

---

### Path B: "I have an SOP and need a SKILL.md"

Use when: a human-executable SOP is being automated; an existing regulated procedure is being adapted for agentic execution; a formal procedure needs a skill trigger.

```
SOP section                       →    SKILL.md field / section
─────────────────────────────────────────────────────────────────
1.0 Purpose                       →    description: front-matter
  (compress to ≤ 250 characters;        (must fit in 250 chars;
  imperative mood;                       action verb first;
  name what triggers the skill)          include trigger phrases)

2.0 Scope → Applies to            →    ## Activation Triggers
  (convert inclusions to                (list as bullet conditions;
  trigger conditions)                    each is a "this skill activates when")

2.0 Scope → Does NOT apply to     →    ## When NOT to Use
  (convert exclusions to                (list as bullet conditions;
  anti-trigger conditions)               each is a "do not use this skill when")

3.0 References                    →    references/ subdirectory
  (one file per reference;              (create the directory;
  precondition refs go first)            name files after their purpose)

4.0 Definitions                   →    Inline definitions in skill body
  (integrate at first use;              (GSD skills define by use rather than
  add a Glossary section                 in a table — either is acceptable)
  for long vocabulary sets)

5.0 Roles → R (Responsible)       →    Model assignment
  (R = the executor tier;               (R = Sonnet or Haiku;
   A = the reviewer tier)                A = Opus for judgment-heavy work)

6.0 Procedure (6.2 Steps)         →    ## Primary Workflow (or ## Pipeline)
  (convert When/Perform/Until           (numbered steps; preserve entry/exit
  to numbered pipeline stages)          conditions as stage prerequisites)

6.3 Error Handling                →    ## Error Handling
  (preserve the if/then structure;      (one row per condition;
  note irreversibility boundaries)       mark irreversible points explicitly)

7.0 Quality Checks                →    ## Quality Checks (or ## Quality Gates)
  (preserve as checklist items;         (checkbox format for pre-delivery
  commands map directly)                 verification)

8.0 Records / Success Criteria    →    Deliverable specification
  (success criteria sentence            (file manifest; terminal state
  → terminal state description;          description; implicit in pipeline
  records → output file manifest)        completion if well-specified)
```

**Time estimate:** 30–60 minutes for a well-structured SOP. The main compression challenge is the `description:` field — the 250-character limit often forces choosing the most discriminating trigger phrases rather than capturing all of the Purpose section. Prioritize trigger accuracy over completeness in the description field; put the full purpose in the skill body.

---

### Quick-Reference Summary

| If you start with | And need | Use | Key constraint |
|-------------------|----------|-----|----------------|
| SKILL.md | Formal SOP | Path A | Write exclusions + success criteria from scratch |
| SOP | SKILL.md | Path B | Compress Purpose to 250 chars; lose no trigger accuracy |
| Neither | Both | Template first, then Path B | Fill template → extract SKILL.md front-matter |
| Neither | SKILL.md only | Use existing SKILL.md archetypes | Skip SOP entirely if audit is not required |

The template and the SKILL.md format are dual representations of the same information architecture. Neither is primary. The SOP is the human-auditable form; the SKILL.md is the agent-executable form. A mature skill has both.

---

## References

- M1 — SOP Anatomy and Structure (this mission)
- M5 — GSD-Specific SOP Implementation (this mission)
- ISO/IEC/IEEE 15289:2017 — Content of life-cycle information items
- TRACTIAN — Standard Operating Procedure: Full Implementation Guide (2026)
- `vision-to-mission` SKILL.md — `.claude/skills/vision-to-mission/SKILL.md`
- `research-engine` SKILL.md — `.claude/skills/research-engine/SKILL.md`
- `done-retirement` SKILL.md — `.claude/skills/done-retirement/SKILL.md`
- `schema.json` — `.planning/` engineering-sops mission schema (source of truth for canonical section definitions and `skill_md_mapping`)
