# Radical Self-Reliance — Agent Autonomy

**Principle:** Burning Man encourages the individual to discover, exercise and rely on their inner resources.
**GSD Guideline:** Agent Autonomy
**Domain:** virtual-brc/principles
**Safety Classification:** RECOMMENDED

## Pattern

A Douglas fir standing at the edge of a clearcut has no canopy neighbors to buffer
the wind. It must thicken its own trunk, deepen its own roots, and produce its own
wind-resistant crown architecture. It cannot borrow structural integrity from trees
that are no longer there. This is Radical Self-Reliance in the forest — and it maps
directly to Agent Autonomy in the GSD skill system.

Each agent carries its own context. No agent depends on an external service, a shared
singleton, or another agent's runtime state for its core execution path. When an
agent is instantiated to execute a skill, it receives a self-contained context
bundle: the skill definition, the relevant trust state, the safety boundaries, and
the execution parameters. If the network drops, if the orchestrator stalls, if peer
agents crash — the agent can still complete its immediate task or fail gracefully with
a clear error state. There is no implicit dependency on ambient infrastructure.

This does not mean agents work in isolation — Communal Effort handles collaboration.
But collaboration is opt-in and additive, never a prerequisite for basic function.
An agent on the playa must be able to survive a dust storm alone before it joins a
camp. The self-reliance boundary is drawn at core execution: an agent's ability to
start, execute, and report a result must never depend on another agent's liveness.

## Testable Behaviors

1. An agent instantiated with a valid context bundle can complete skill execution with all network connections severed.
2. No agent's constructor or initialization path includes a synchronous call to another agent's runtime state.
3. Agent context bundles are self-contained: they include all parameters, boundaries, and trust state needed for execution.
4. When a peer agent becomes unreachable, the executing agent continues its task and logs the disconnection rather than blocking.
5. Agent shutdown produces a complete execution report regardless of orchestrator availability.

## Dependencies

- `communal-effort` — Collaboration layer sits above the autonomy boundary; agents are self-reliant first, collaborative second
- `participation` — Execution-first model ensures agents activate on their own initiative
- `immediacy` — Cache-optimized activation means agents do not wait for external warm-up

## PNW Metaphor

Like a solitary Douglas fir on a coastal headland, each agent develops its own root
system and wind-hardened crown before joining the canopy. The forest is stronger for
it — trees that can stand alone create a stand that can weather any storm.
