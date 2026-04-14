---
name: debate-team
type: team
category: communication
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-11
first_path: examples/teams/communication/debate-team/README.md
description: Focused argumentation and debate team for constructing, evaluating, and stress-testing persuasive arguments. Douglass coaches delivery, Wollstonecraft maps argument structure and detects fallacies, King optimizes audience connection and rhetorical power, and Freire ensures the argument respects all participants and surfaces power dynamics. Use for debate preparation, argument construction, rhetorical analysis of persuasive texts, or any task where the primary goal is building or evaluating the strength of an argument.
superseded_by: null
---
# Debate Team

Focused argumentation team for constructing, evaluating, and stress-testing persuasive arguments. Pairs the department's argument specialist (Wollstonecraft) with the delivery coach (Douglass), the audience connection expert (King), and the power-aware pedagogue (Freire).

## When to use this team

- **Debate preparation** -- constructing arguments and rebuttals for formal or informal debate.
- **Argument construction** -- building a persuasive case on a topic with evidence, warrants, and counterargument handling.
- **Rhetorical analysis** -- breaking down a persuasive text, speech, or campaign to understand why it works or fails.
- **Stress-testing** -- subjecting an argument to adversarial examination before it faces a real audience.
- **Persuasive speech preparation** -- when the speech's primary function is to convince, not inform.
- **Op-ed, brief, or proposal writing** -- when the written product must be argumentatively rigorous.

## When NOT to use this team

- **Media analysis** without a persuasion focus -- use `media-analysis-team`.
- **Interpersonal communication** or conversational dynamics -- use `tannen` directly or the workshop team.
- **Pure delivery coaching** with no argumentative component -- use `douglass` directly.
- **Multi-domain research** spanning all six communication domains -- use `communication-workshop-team`.

## Composition

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Delivery coach** | `douglass` | Speech delivery, advocacy, oral persuasion | Opus |
| **Argument architect** | `wollstonecraft` | Argument mapping, fallacy detection, persuasive writing | Sonnet |
| **Audience strategist** | `king` | Audience connection, rhetorical structure, emotional architecture | Opus |
| **Power analyst / Pedagogue** | `freire` | Power dynamics, ethical persuasion, dialogical engagement | Sonnet |

Two Opus agents (Douglass, King) handle the tasks requiring deep rhetorical reasoning. Two Sonnet agents (Wollstonecraft, Freire) handle the analytically systematic tasks.

## Orchestration flow

```
Input: topic/text + user level + optional audience description
        |
        v
+---------------------------+
| Aristotle-C (Opus)        |  Phase 0: Classification and dispatch
| Routes to debate-team     |
+---------------------------+
        |
        +--------+--------+--------+
        |        |        |        |
        v        v        v        v
  Wollstonecraft Douglass  King    Freire
  (argument)     (delivery)(audience)(ethics)
        |        |        |        |
    Phase 1: Parallel analysis
    - Wollstonecraft maps the argument structure
    - Douglass assesses delivery opportunities
    - King designs audience connection strategy
    - Freire evaluates power dynamics and ethical stance
        |        |        |        |
        +--------+--------+--------+
                     |
                     v
          +---------------------------+
          | Aristotle-C (Opus)        |  Phase 2: Synthesis
          | Merge into unified        |  - Argument skeleton from Wollstonecraft
          | debate brief              |  - Delivery notes from Douglass
          +---------------------------+  - Audience strategy from King
                     |                   - Ethical guardrails from Freire
                     v
              Final debate brief
              + CommunicationSession Grove record
```

## Synthesis rules

### Rule 1 -- Argument first, delivery second

Wollstonecraft's argument structure is the skeleton. Douglass's delivery notes and King's audience strategy are layered on top. A beautiful delivery of a bad argument is still a bad argument.

### Rule 2 -- King adapts the argument to the audience

Wollstonecraft builds the logically strongest argument. King identifies which elements of that argument will resonate most with the specific audience and recommends the ordering, emphasis, and framing.

### Rule 3 -- Freire's ethical check is non-negotiable

If Freire identifies an ethical concern (e.g., the argument exploits a power asymmetry, uses fear without factual basis, or suppresses legitimate counterarguments), the team does not proceed until the concern is addressed. Ethical persuasion is a constraint, not an option.

### Rule 4 -- Counterargument preparation is mandatory

No debate brief is complete without anticipation of the strongest opposing arguments and prepared rebuttals. Wollstonecraft generates these; King assesses which counterarguments the audience is most likely to find compelling.

## Output contract

### Primary output: Debate brief

A structured document containing:

1. **Thesis.** Clear statement of the position being argued.
2. **Argument map.** Toulmin-structured arguments with claim, grounds, warrant, backing, qualifier, and rebuttal for each point.
3. **Audience strategy.** Which arguments to lead with, which emotional connections to build, which shared values to invoke.
4. **Delivery notes.** Specific coaching on pace, pause, gesture, and vocal variety for key moments.
5. **Counterargument preparation.** The three strongest opposing arguments with prepared rebuttals.
6. **Ethical assessment.** Confirmation that the argument meets the ethical persuasion standard.

### Grove records

- **ArgumentMap** from Wollstonecraft
- **SpeechDraft** from King (if mode involves oral delivery)
- **CommunicationAnalysis** from Douglass and Freire
- **CommunicationSession** linking all work products

## Configuration

```yaml
name: debate-team
members:
  - delivery: douglass
  - argument: wollstonecraft
  - audience: king
  - ethics: freire

parallel: true
timeout_minutes: 10
```

## Invocation

```
# Debate preparation
> debate-team: Prepare me for a debate on universal basic income. I'm arguing
  in favor. Audience: economics students. Level: advanced.

# Argument stress-test
> debate-team: Stress-test this argument for a city council presentation on
  zoning reform. [attached text]. Find every weakness.

# Persuasive speech construction
> debate-team: Build a 7-minute persuasive speech arguing that public libraries
  are essential infrastructure. Audience: budget committee.

# Op-ed review
> debate-team: Evaluate and strengthen this op-ed about climate policy.
  [attached text]. Level: graduate.
```
