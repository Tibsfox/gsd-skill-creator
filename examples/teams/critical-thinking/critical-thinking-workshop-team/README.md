---
name: critical-thinking-workshop-team
type: team
category: critical-thinking
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/critical-thinking/critical-thinking-workshop-team/README.md
description: Focused argument reconstruction and evaluation team. Elder leads with structural analysis and elements of reasoning, Tversky checks the inferences for bias-driven distortion, Kahneman-ct diagnoses whether the reasoning is System 1 or System 2 and whether that fits the task, and Lipman translates the result into a level-appropriate explanation. Use for deep focused analysis of a single argument, editorial, study claim, or policy position. Not for ill-structured problems, creative generation, or routine drills.
superseded_by: null
---
# Critical Thinking Workshop Team

A focused four-agent team for deep argument analysis and evaluation. Elder leads; Tversky checks for bias; Kahneman-ct diagnoses cognitive mode; Lipman explains the result. This team mirrors the `proof-workshop-team` pattern: a focused-expertise team optimized for a specific class of problem rather than broad investigation.

## When to use this team

- **Deep analysis of a single argument** — op-eds, studies, position papers, policy briefs.
- **Claim evaluation with bias check** — is this claim valid in form and unbiased in inference?
- **Study critique** — both structural and dual-process analysis of a research paper's reasoning.
- **Training analyses** — showing learners how structural and psychological lenses combine.
- **Preparing a rebuttal** — steel-manning the opposition before pushing back.

## When NOT to use this team

- **Ill-structured problems** where the question itself is unclear — use `critical-thinking-analysis-team` with Dewey-ct.
- **Pure creative generation** — use `de-bono` directly or `critical-thinking-analysis-team`.
- **Routine bias checks** on a simple judgment — use `tversky` directly.
- **Multi-lens audits** spanning many dimensions — use `critical-thinking-analysis-team`.
- **Practice drills** on foundational techniques — use `critical-thinking-practice-team`.

## Composition

Four agents, run mostly sequentially with one parallel verification step:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Lead / Structural analyst** | `elder` | Argument reconstruction, elements of reasoning, validity and soundness | Opus |
| **Bias diagnostician** | `tversky` | Heuristics and biases detection, probability correction | Opus |
| **Mode diagnostician** | `kahneman-ct` | System 1 / System 2 diagnosis, mode-task match | Sonnet |
| **Pedagogy / Readability** | `lipman` | Level-appropriate explanation, Socratic framing | Sonnet |

Two Opus agents (Elder, Tversky) because structural reconstruction and bias diagnosis require deep reasoning. Two Sonnet agents (Kahneman-ct, Lipman) because their tasks are well-bounded.

## Orchestration flow

```
Input: argument/claim + optional context + mode (reconstruct/diagnose/evaluate)
        |
        v
+---------------------------+
| Elder (Opus)              |  Phase 1: Reconstruct
| Lead / Structural analyst |          - parse argument structure
+---------------------------+          - surface hidden premises
        |                              - identify logical form
        |                              - test validity
        v
+---------------------------+
| Elder (Opus)               |  Phase 2: Elements analysis
| Elements of reasoning     |          - apply 8 elements
+---------------------------+          - identify weak elements
        |                              - check universal standards
        |
        +------- parallel --------+
        |                         |
        v                         v
+------------------+   +------------------+
| Tversky (Opus)   |   | Kahneman-ct (S)  |  Phase 3: Check
| Bias diagnosis   |   | Mode diagnosis   |          (parallel)
| - which bias?    |   | - System 1 or 2? |
| - where?         |   | - appropriate?   |
| - severity?      |   | - shift needed?  |
| - correction?    |   |                  |
+------------------+   +------------------+
        |                         |
        +------------+------------+
                     |
                     v
+---------------------------+
| Elder (Opus)              |  Phase 4: Integrate
| Incorporate findings      |          - combine structural +
+---------------------------+            bias + mode lenses
                     |                 - produce final diagnosis
                     v
+---------------------------+
| Lipman (Sonnet)           |  Phase 5: Explain
| Level-appropriate output  |          - translate to user level
+---------------------------+          - add Socratic questions
                     |                 - suggest related exercises
                     v
              CriticalThinkingAnalysis + CriticalThinkingReview
              + CriticalThinkingExplanation Grove records
```

## Phase details

### Phase 1 — Reconstruction (Elder)

Elder parses the argument's surface form and reconstructs it in standard form: numbered premises, explicit conclusion, named logical form where applicable. Hidden premises are surfaced and marked. The output of this phase is a clean structural representation.

### Phase 2 — Elements Analysis (Elder)

Elder applies the eight elements of reasoning (purpose, question, information, concepts, assumptions, inferences, implications, point of view) to the reconstruction. This produces a structural diagnosis that identifies which elements are weak or problematic.

### Phase 3 — Parallel Checks (Tversky + Kahneman-ct)

Two independent checks run in parallel:

**Tversky (bias diagnosis):**
- Identifies which cognitive biases (if any) are active in the inferences
- Locates bias indicators to specific premises or transitions
- Applies probability corrections where numerical judgments are involved
- Reports: biases found, severity, suggested corrections

**Kahneman-ct (mode diagnosis):**
- Identifies whether the reasoning is System 1 or System 2 output
- Assesses whether that mode is appropriate for the task and stakes
- Recommends mode shifts if needed
- Reports: active mode, appropriateness, recommended protocol

### Phase 4 — Integration (Elder)

Elder combines structural, bias, and mode findings into a unified diagnosis:
- If Tversky found bias, fold the bias into the structural finding
- If Kahneman-ct diagnosed System 1 inappropriate, note the mode recommendation
- Produce the final CriticalThinkingAnalysis record

### Phase 5 — Explanation (Lipman)

Lipman takes the finalized analysis and produces a level-appropriate explanation:
- Adapted to the user's level (novice through advanced)
- Framed with concrete examples
- Includes Socratic follow-up questions
- Suggests related exercises for practice

## Input contract

The team accepts:

1. **Argument or claim** (required). The text to be analyzed.
2. **Context** (required). What is the argument being used for? Background, stakes, author.
3. **Mode** (required). One of:
   - `reconstruct` -- build the structural representation only
   - `diagnose` -- identify problems (structure + bias + mode)
   - `evaluate` -- full analysis with verdict on validity and soundness
4. **User level** (optional). One of: `novice`, `developing`, `proficient`, `advanced`.

## Output contract

### Mode: evaluate (default)

Three Grove records:

**CriticalThinkingAnalysis** (from Elder):
```yaml
type: CriticalThinkingAnalysis
original_text: <source>
reconstruction: <standard form>
elements_analysis: <8 elements>
validity: <valid/invalid>
soundness: <sound/unsound/unknown>
structural_issues: [...]
concept_ids: [...]
agent: elder
```

**CriticalThinkingReview** (from Tversky + Kahneman-ct, merged by Elder):
```yaml
type: CriticalThinkingReview
bias_findings: [...]
mode_diagnosis: <System 1 / System 2 / mixed>
mode_appropriateness: <appropriate / inappropriate>
corrections: [...]
agent: elder
```

**CriticalThinkingExplanation** (from Lipman):
```yaml
type: CriticalThinkingExplanation
target_level: <level>
explanation_body: <walkthrough>
worked_example: <optional>
follow_up_questions: [...]
concept_ids: [...]
agent: lipman
```

### Mode: reconstruct

Only the CriticalThinkingAnalysis record is produced.

### Mode: diagnose

Both CriticalThinkingAnalysis and CriticalThinkingReview, but without a full evaluation verdict.

## Escalation paths

### Bias found in structural inference (Tversky)

If Tversky finds that the inference from premises to conclusion is bias-driven, the argument may still be valid in form but unsound in practice. The team reports this as "valid form, biased inference" and recommends disconfirmation work.

### Mode mismatch (Kahneman-ct)

If Kahneman-ct diagnoses that the reasoning was System 1 where System 2 was needed, the team reports this and provides the slow-thinking protocol. The user can re-engage with the argument using System 2 and submit the revised reasoning.

### Elder cannot reconstruct

If the argument resists reconstruction entirely, Elder halts per the failure honesty protocol. The team reports "not reconstructible as an argument" and recommends escalation to `critical-thinking-analysis-team` with Dewey-ct for problem framing.

### From other teams

- **From analysis-team:** When a full multi-lens audit reveals that the core issue is a single argument, delegate the focused analysis here.
- **From practice-team:** When a practice drill encounters a genuinely complex argument that exceeds drill scope, escalate here.

## Token / time cost

Approximate cost per analysis:

- **Elder** — 3 Opus invocations (reconstruct, elements, integrate), ~60-90K tokens total
- **Tversky** — 1 Opus invocation (bias check), ~25-40K tokens
- **Kahneman-ct** — 1 Sonnet invocation (mode diagnosis), ~15-25K tokens
- **Lipman** — 1 Sonnet invocation (explanation), ~15-25K tokens
- **Total** — 115-180K tokens, 3-8 minutes wall-clock

Lighter than `critical-thinking-analysis-team` because only four agents are involved and the workflow is more sequential.

## Configuration

```yaml
name: critical-thinking-workshop-team
lead: elder
bias_diagnostician: tversky
mode_diagnostician: kahneman-ct
pedagogy: lipman

# Kahneman-ct may be skipped for pure written-argument analysis
skip_mode_diagnosis: false

# Level auto-detect if not specified
user_level: auto
```

## Invocation

```
# Full evaluation
> critical-thinking-workshop-team: Evaluate this op-ed on minimum wage.
  Context: published in a major newspaper. Mode: evaluate. Level: proficient.

# Reconstruction only
> critical-thinking-workshop-team: Reconstruct this tangled argument into
  standard form. [attached text]. Mode: reconstruct. Level: developing.

# Diagnosis without verdict
> critical-thinking-workshop-team: What's wrong with this reasoning?
  [attached text]. Mode: diagnose. Level: advanced.

# Training use
> critical-thinking-workshop-team: Analyze this sample argument and produce
  teaching notes for developing-level students. [attached sample].
  Mode: evaluate. Level: developing.

# Follow-up from analysis-team
> critical-thinking-workshop-team: Analysis team identified the core problem
  as a single argument's validity. Deep-dive here. Mode: evaluate.
```

## Limitations

- The team analyzes the argument as given. It does not fact-check claims against external sources.
- Bias diagnosis is limited to the documented heuristics-and-biases catalog; novel or domain-specific biases may not be caught.
- Mode diagnosis is most reliable for verbal/written reasoning; judgments that are primarily nonverbal (intuitive pattern recognition in experts) are harder to diagnose from text.
- The team does not produce formal verification suitable for automated theorem proving. The analysis is rigorous natural-language analysis.
- If Elder and Tversky disagree on whether an inference is structurally valid but bias-driven, the team reports both findings honestly rather than forcing reconciliation.
