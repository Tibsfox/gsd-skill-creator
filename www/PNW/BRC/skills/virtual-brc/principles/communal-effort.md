# Communal Effort — Multi-Agent Topology

**Principle:** Our community values creative cooperation and collaboration. We strive to produce, promote and protect social networks, public spaces, works of art, and methods of communication that support such interaction.
**GSD Guideline:** Multi-Agent Topology
**Domain:** virtual-brc/principles
**Safety Classification:** RECOMMENDED

## Pattern

No tree in an old-growth forest operates alone. The western red cedar shares
carbon through mycorrhizal networks with struggling hemlock saplings. Nurse logs
host dozens of species simultaneously. Canopy gaps created by one tree's fall
become regeneration opportunities for the entire stand. The forest is a commune
of interlocking dependencies — and so is the virtual playa.

In the GSD skill system, no skill works alone. Every skill declares its camp
affiliation and collaboration surface: the set of interfaces it exposes, the
messages it can receive, and the skills it can compose with. This is not optional
metadata — it is a structural requirement. A skill without a declared collaboration
surface is like a tent pitched in the middle of the playa with no doors: technically
present but functionally isolated. The system enforces that every published skill
includes at least one collaboration interface.

The Multi-Agent Topology pattern organizes skills into camps (co-located clusters
that share infrastructure), villages (camps that share theme or purpose), and
city-wide services (infrastructure available to all). Agents are assigned to camps
at instantiation and inherit that camp's shared context layer. Cross-camp
collaboration happens through declared message interfaces, not through shared
mutable state. The topology is explicit, inspectable, and deterministic — you can
map the city's collaboration graph at any moment and see exactly which skills are
talking to which.

## Testable Behaviors

1. Every published skill definition includes a non-empty `collaboration_surface` field declaring at least one interface.
2. Skills declare a `camp_affiliation` field that links them to a named camp in the topology registry.
3. Cross-camp communication occurs exclusively through declared message interfaces, never through shared mutable state.
4. The topology registry can produce a complete collaboration graph showing all active skill-to-skill connections.
5. A skill that attempts to publish without a collaboration surface is rejected by the submission validator.

## Dependencies

- `radical-self-reliance` — Agents are autonomous first; communal effort is additive, not a prerequisite
- `gifting` — Skills shared unconditionally compose more freely across camp boundaries
- `civic-responsibility` — Infrastructure agents provide the shared services that camps rely on

## PNW Metaphor

Like the mycorrhizal mat beneath a Pacific Northwest old-growth stand, the
collaboration surface connects every skill to its neighbors through invisible but
load-bearing channels. No tree is an island — and no skill ships without declaring
who it talks to.
