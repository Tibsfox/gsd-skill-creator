# Radical Inclusion — Open Skill Access

**Principle:** Anyone may be a part of Burning Man. We welcome and respect the stranger. No prerequisites can be placed on participation in our community.
**GSD Guideline:** Open Skill Access
**Domain:** virtual-brc/principles
**Safety Classification:** RECOMMENDED

## Pattern

In a living forest, no species is turned away at the canopy edge. Nurse logs accept
any seed that lands on them — hemlock, cedar, huckleberry — without checking
credentials. The forest grows richer precisely because it does not gatekeep. Radical
Inclusion translates directly into the GSD skill system as Open Skill Access: there
are no prerequisite gates on skill discovery. Any rig, regardless of its current
trust level, agent history, or stamp count, may browse the full wanted-board and
attempt any item posted there at Level 1.

This does not mean every attempt succeeds. A sapling that germinates on bare granite
will struggle, but it is never prevented from trying. The system publishes all
available skills in the discovery index without filtering by rig capability. When a
rig attempts a skill beyond its current capacity, the system provides the attempt
scaffolding (Level 1 context, safety boundaries) rather than a locked door. Failure
is a valid outcome; exclusion from attempt is not.

The implementation boundary is clear: discovery and attempt are open; promotion
through trust levels still requires demonstrated competence. The gate lives at
promotion, never at entry. This mirrors how the playa welcomes everyone through the
Greeter Station, but art installations still have structural safety reviews before
they burn.

## Testable Behaviors

1. A newly instantiated rig with zero stamps can query the skill discovery index and receive the complete list of available skills without filtering.
2. No skill definition in the registry contains a `prerequisites` field that blocks Level 1 attempt initiation.
3. The wanted-board API returns identical skill listings regardless of the requesting rig's trust score, stamp count, or agent role.
4. When a rig attempts a skill above its demonstrated capacity, the system returns attempt scaffolding (not an access-denied error).
5. Skill search results are never ranked or filtered by rig-specific privilege levels.

## Dependencies

- `civic-responsibility` — Safety Warden enforces boundaries during execution, not at discovery
- `participation` — Execution-first model ensures attempt is the entry point
- `gifting` — Skills are shared unconditionally, reinforcing open access

## PNW Metaphor

Like the mycorrhizal network beneath an old-growth forest floor, the skill discovery
layer connects every participant to every resource without toll gates. A Doug fir
seedling three days old has the same access to the fungal commons as a 500-year
ancient — the network does not discriminate by age or stature.
