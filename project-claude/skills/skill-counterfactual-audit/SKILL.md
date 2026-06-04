---
name: skill-counterfactual-audit
description: >
  Audit a skill by running a paired probe — the same task once with the
  skill loaded and once without — segment both traces into goal-directed
  phases, align phases, and emit a SIP report (surface anchoring,
  template copy, excess planning, task recovery, off-task artifact).
  Use whenever a skill is created, modified, or proposed for retirement.
  Pass-rate is BLIND to most skill effects: CTA (arxiv 2605.11946v1)
  shows a single skill can produce 522 measurable behavioural changes
  across 49 tasks while pass-rate moves only +0.3%. Triggers: "audit
  this skill", "is this skill helping", "retire skill", "before shipping
  skill", "behavioural impact of skill X", or any skill review event.
user-invocable: true
version: 1.0.0
format: 2025-10-02
triggers:
  - "audit this skill"
  - "is this skill helping"
  - "behavioural impact of skill"
  - "retire this skill"
  - "before shipping a skill"
updated: 2026-05-16
status: ACTIVE
source: arxiv 2605.11946v1 (Counterfactual Trace Audit / CTA)
---

# Skill Counterfactual Audit

## Why

When you ship a skill, pass-rate is the easy metric — and it's *blind* to almost everything that matters. CTA (arxiv 2605.11946v1) shows a single skill can produce **522 measurable behavioural changes** across 49 tasks while pass-rate moves only **+0.3%**. The interesting effects (surface anchoring on the skill's vocabulary, template copy without adaptation, excess planning loops, recovery from off-task drift, generation of off-task artifacts) live entirely below pass-rate.

The remedy is a paired-trace audit: run the same probe task twice, with and without the skill, and *compare the behaviours directly* rather than the headline metric.

## How

For each skill under audit:

1. **Curate a probe-task bank** (3-5 small tasks per skill domain). Each task should have:
   - A clear goal (a single instruction)
   - An expected category of behaviour
   - A "phase decomposition" (rough segmentation rules)
2. **Run paired** — same prompt, same task, run A *with* skill loaded, run B *without*.
3. **Segment each trace** — phases like {plan, retrieve, edit, verify, fix-loop, summary}.
4. **Align phases** — match B phases to A phases; mark new/dropped/displaced phases.
5. **Classify SIP (Skill Influence Pattern)** — for each aligned phase, label the effect:
   - **surface-anchoring** — A copies vocabulary/structure from the skill itself
   - **template-copy** — A reproduces a skill template literally without adaptation
   - **excess-planning** — A adds extra planning steps absent in B
   - **task-recovery** — A recovers from drift that B falls into
   - **off-task-artifact** — A produces artifacts unrelated to the goal
6. **Emit report** to `.planning/patterns/skill-audits/<skill>-<timestamp>.md` with phase comparison table + SIP distribution + retire/refine/keep recommendation.

## Recommendation rule of thumb

| Dominant SIP | Verdict |
|---|---|
| task-recovery + correct artifacts | **keep** (genuine value) |
| surface-anchoring with no task-recovery | **refine** (skill is leaking style, not capability) |
| template-copy on most tasks | **refine** (lower template specificity) |
| off-task-artifact on >25% of probes | **retire** (skill is causing distraction) |
| excess-planning with no completion delta | **refine** (skill adds ceremony) |

## When to skip

- The skill is a workflow guide that doesn't directly shape output (e.g., `loop`, `schedule`) — audit dominant SIPs would always be "task-recovery" trivially.
- No probe-task bank exists for the domain (build one first; defer audit).
- The skill was just created and has no historical baseline. Run the audit when the skill has been active for ≥3 sessions.

## Integration

- `done-retirement` — required gate before retiring a skill.
- `gsd-cleanup` — sweeps audits on a milestone-close cadence.
- Companion to `simplify`, `code-review` — those audit code; this audits skill behaviour.

## Cross-references

- Rosetta concept #9 (Execution-Grounded Selection) — paired-trace audit is the skill-domain instantiation
- College: `agent-systems / integration-evaluation / agent-paired-trace-audit`
- Related skills: `skill-integration` (manages the skill lifecycle that this audits)
