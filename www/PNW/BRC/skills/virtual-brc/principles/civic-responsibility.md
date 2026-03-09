# Civic Responsibility — Safety Warden Pattern

**Principle:** We value civil society. Community members who organize events should assume responsibility for public welfare and endeavor to communicate civic responsibilities to participants. They must also assume responsibility for conducting events in accordance with local, state and federal laws.
**GSD Guideline:** Safety Warden Pattern
**Domain:** virtual-brc/principles
**Safety Classification:** MANDATORY-PASS

## Pattern

In a Pacific Northwest forest, certain organisms are non-negotiable infrastructure.
Remove the salmon and the riparian nitrogen cycle collapses. Remove the mycorrhizal
fungi and seedling survival drops by orders of magnitude. These are not optional
participants — they are structural keystones. The forest cannot function without them,
and no amount of individual tree vigor compensates for their absence.

Civic Responsibility is the keystone principle of Virtual Black Rock City. It
manifests as the Safety Warden Pattern: a set of infrastructure agents — Gate,
Rangers, Medical — that are mandatory-pass gates in every execution pipeline. These
agents cannot be bypassed, disabled, or demoted by any rig, any skill, or any
configuration override. They are hard-wired into the execution path at the
architectural level, not the configuration level.

The Gate agent validates that every skill entering the execution pipeline meets
structural safety requirements before it runs. The Ranger agent monitors execution
in progress and can halt a skill mid-run if it violates behavioral safety
boundaries. The Medical agent handles failure recovery — ensuring that a crashed
skill does not leave the system in a corrupted state. These three agents form the
civic infrastructure of the playa. They are funded by the system (always
instantiated, always running), staffed by deterministic validators (not
probabilistic heuristics), and accountable to the safety specification (not to any
individual rig's preferences).

## Testable Behaviors

1. The Gate agent runs before every skill execution and returns PASS/FAIL; a FAIL result blocks execution with no override mechanism.
2. The Ranger agent can halt a running skill mid-execution when a behavioral safety violation is detected.
3. The Medical agent activates on any skill crash and restores system state to pre-execution baseline within bounded time.
4. No configuration parameter, rig preference, or trust level can disable, skip, or demote any Safety Warden agent.
5. Safety Warden agents are instantiated at system startup and remain running for the entire session lifecycle.
6. Warden decisions are logged immutably and are auditable by any rig in the system.

## Dependencies

- `radical-self-expression` — Warden defines the boundary inside which free expression operates
- `leaving-no-trace` — Medical agent ensures failed skills leave no corrupted state behind
- `communal-effort` — Infrastructure agents are shared civic resources, not camp-private

## PNW Metaphor

Like the salmon that are non-negotiable keystones of the riparian ecosystem — remove
them and the forest starves — the Safety Warden agents are structural infrastructure
that the entire playa depends on. No configuration can remove a keystone species. No
rig can vote out the salmon.
