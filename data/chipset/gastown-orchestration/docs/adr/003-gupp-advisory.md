# ADR-003: GUPP as Advisory in GSD

**Status:** Accepted
**Date:** 2026-03-05
**Deciders:** Project maintainers
**Relates to:** gupp-propulsion skill, evaluation gates, GSD orchestrator phase lifecycle

## Context

Gastown's GUPP (Gas Town Universal Propulsion Principle) is the system's core enforcement mechanism. It states that when work is placed on an agent's hook, the agent must begin immediately -- "physics over politeness." In practice, GUPP is implemented through aggressive prompt injection that fights LLM assistant training:

```
Work is on your hook. After announcing your role, begin IMMEDIATELY.
This is physics, not politeness. Gas Town is a steam engine - you are a piston.
Every moment you wait is a moment the engine stalls.
```

Gastown supplements GUPP with three fallback mechanisms:
1. **Deacon heartbeat** -- periodic "Do Your Job" nudges to detect stalls
2. **Boot watchdog** -- restarts agents that become unresponsive
3. **Witness monitoring** -- observes polecat health and escalates issues

The question: should GSD implement GUPP as a hard enforcement mechanism (like Gastown) or as an advisory pattern?

## Decision

GUPP is advisory in GSD. The GSD orchestrator's phase gates take precedence over GUPP propulsion signals.

## Rationale

**GSD already solves the control flow problem structurally.** Gastown needs GUPP because its agents run in open-ended contexts where the LLM's default behavior (wait for user input) conflicts with autonomous execution. GSD's orchestrator manages control flow through structured workflows: vision documents become requirements, requirements become mission breakdowns, missions become wave plans, wave plans become tasks, and tasks are dispatched to executor subagents with explicit instructions. The agent does not need to decide whether to act -- the orchestrator tells it what to do and when.

**Prompt-based enforcement is fragile.** Gastown's own documentation acknowledges that GUPP fights the model's training distribution. The Deacon/Boot/Witness supervision stack exists specifically to handle cases where GUPP fails. This is engineering around a reliability problem rather than solving it. GSD's phase-gate architecture eliminates the problem by design: agents execute within bounded tasks, not open-ended sessions.

**Advisory GUPP preserves the useful pattern.** The GUPP pattern is valuable as a skill-creator learnable behavior: when an agent receives work, it should begin promptly without unnecessary preamble. As an advisory skill, GUPP influences agent behavior (shorter preambles, faster start, less confirmation-seeking) without overriding the orchestrator's control flow. This gives GSD the responsiveness benefit without the reliability risk.

**Phase gates are the authority boundary.** In GSD, the orchestrator decides when work begins and ends. Phase transitions, checkpoint pauses, and verification steps are the system's control points. Allowing GUPP to override phase gates would undermine the structured workflow that makes GSD reliable. The orchestrator is the interrupt controller; GUPP is a priority hint, not a non-maskable interrupt.

**Skill-creator can optimize GUPP per runtime.** As an advisory skill, GUPP enforcement can be tuned by skill-creator's observation loop. If Claude Code agents respond well to minimal prompting (they do, within GSD's structured context), skill-creator can reduce GUPP weight. If a different runtime needs stronger prompting, skill-creator can increase it. This adaptive approach is impossible with hard-coded enforcement.

## Consequences

### Positive

- GSD maintains its structured workflow guarantees (phase gates always honored)
- GUPP's responsiveness benefits are preserved as a tunable skill
- No need for the Deacon/Boot/Witness supervision stack to handle GUPP failures
- Skill-creator can learn optimal GUPP intensity per runtime and per task type
- Simpler architecture: the orchestrator is the single source of truth for control flow

### Negative

- GSD agents may be slightly slower to start work than Gastown agents in scenarios where GUPP enforcement would help (open-ended tasks without clear structure)
- The full Gastown GUPP experience is not replicated -- teams familiar with Gastown's "physics over politeness" may find GSD less aggressive

### Neutral

- The `gupp-propulsion` skill is still declared as a required skill in the chipset manifest (weight 0.18) -- it influences agent behavior, it just doesn't override the orchestrator
- The evaluation gate `gupp_response_time` (threshold: 30s, action: warn) is retained as a monitoring signal, not an enforcement mechanism
- Future work may introduce a "hot path" mode where GUPP enforcement is stronger for latency-sensitive workloads, but this is not in scope for v1.0
