# Leaving No Trace — LNT Cleanup Agent

**Principle:** Our community respects the environment. We are committed to leaving no physical trace of our activities wherever we gather. We clean up after ourselves and endeavor, whenever possible, to leave such places in a better state than when we found them.
**GSD Guideline:** LNT Cleanup Agent
**Domain:** virtual-brc/principles
**Safety Classification:** MANDATORY-PASS

## Pattern

Every autumn, the bigleaf maples of the Pacific Northwest drop their leaves. By
spring, the forest floor has processed them completely — fungi, bacteria, and
invertebrates have broken every leaf down to soil nutrients. Nothing is left behind.
No plastic wrapper persists for centuries. No abandoned structure rusts in place. The
forest's cleanup cycle is total, and it runs on a schedule that the ecosystem
enforces, not one that individual trees opt into.

Leaving No Trace is the second MANDATORY-PASS principle in Virtual Black Rock City.
It manifests as the LNT Cleanup Agent: a system-level process that ensures deprecated
skills are fully dereferenced. When a skill is marked for deprecation, the LNT agent
traces every reference — every camp affiliation, every collaboration surface
connection, every cached artifact — and removes them. Orphaned dependencies are
identified and cleaned. Stale cache entries are purged. The playa is restored to its
pre-skill state as if the skill had never existed.

This is not garbage collection in the traditional sense. Garbage collection reclaims
memory; LNT reclaims architectural surface. A deprecated skill that leaves behind a
dangling reference in another skill's collaboration surface is a MOOP violation
(Matter Out Of Place). The LNT agent treats dangling references, orphaned configs,
and stale caches with the same severity as the playa restoration crew treats
abandoned rebar in the desert — it is a hard failure, not a warning.

## Testable Behaviors

1. When a skill is deprecated, the LNT agent removes all references to it from every collaboration surface in the topology registry within one cleanup cycle.
2. No orphaned dependency remains in the dependency graph after the LNT agent completes a cleanup pass.
3. Cache entries associated with a deprecated skill are purged within one TTL cycle (5 minutes maximum).
4. The LNT agent produces a cleanup manifest listing every artifact removed, auditable by any rig.
5. A deprecated skill that leaves any dangling reference triggers a MOOP violation — a hard error, not a warning.
6. Post-cleanup, the system state is indistinguishable from a state where the deprecated skill was never registered.

## Dependencies

- `civic-responsibility` — LNT is enforced by the same mandatory-pass infrastructure as Safety Warden
- `decommodification` — No metrics survive deprecation; stamp records for deprecated skills are archived, not displayed
- `communal-effort` — Cleanup must traverse the full collaboration topology to find all references

## PNW Metaphor

Like the fungal decomposers that reduce every fallen giant back to soil within a
decade — leaving no trace of trunk or branch, only renewed fertility — the LNT agent
ensures the playa returns to baseline after every skill's lifecycle ends. The forest
floor remembers everything and hoards nothing.
