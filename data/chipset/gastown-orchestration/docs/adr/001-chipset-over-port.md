# ADR-001: Chipset Definition Over Code Port

**Status:** Accepted
**Date:** 2026-03-05
**Deciders:** Project maintainers
**Relates to:** gastown-orchestration.yaml, vision guide

## Context

Steve Yegge's [Gastown](https://github.com/steveyegge/gastown) is a production multi-agent orchestration system written in Go -- 75,000+ lines, 3,600+ commits, built in 17 days. It coordinates 20-30 agents simultaneously through a Mayor/Witness/Polecat/Refinery topology with GUPP propulsion, filesystem-backed state, and a runtime HAL.

GSD's skill-creator framework provides chipset-based architecture for declaring agent topologies, skills, and communication channels. The chipset metaphor maps hardware concepts (Northbridge, ALU, DMA, IRQ) to software orchestration patterns.

The question: how should GSD absorb Gastown's production-tested multi-agent coordination patterns?

Three options were considered:

1. **Port Gastown's Go code to TypeScript** -- Rewrite the Go implementation in TypeScript within the GSD codebase
2. **Fork and adapt Gastown** -- Fork the repository and modify it to integrate with GSD
3. **Absorb patterns as a chipset definition** -- Map Gastown's architecture to a declarative YAML chipset that skill-creator can load

## Decision

Absorb Gastown's patterns as a chipset definition (`gastown-orchestration.yaml`), not as ported code.

## Rationale

**Porting is high cost, low value.** Gastown's 75k lines of Go solve problems GSD doesn't have (tmux session management, Dolt database backend, Go CLI scaffolding). Porting that code would introduce unnecessary complexity and maintenance burden. The valuable part is the architecture, not the implementation.

**Forking creates divergence.** A fork ties GSD to Gastown's release cadence, Go toolchain, and design decisions. The two projects have different goals (Gastown: immediate production use; GSD: principled architecture with adaptive learning). A fork would eventually diverge into an unmaintainable state.

**A chipset definition captures the architecture.** Gastown's Agent roles, communication channels, dispatch pipeline, and GUPP enforcement are structural patterns that map directly to the chipset metaphor. A YAML definition captures these patterns declaratively, allowing skill-creator to load, validate, customize, and evolve them independently of Gastown's implementation.

**Chipset definitions are evolvable.** Once expressed as a chipset, the patterns enter skill-creator's observation-detection-suggestion loop. The system can learn which configurations work, propose optimizations, and generate new skills -- something impossible with ported code.

**Gastown's community benefits.** By documenting the mapping (glossary, ADRs, user guide), GSD makes Gastown's architectural insights accessible to a broader audience through a different lens. This is contribution through cartography, not competition through reimplementation.

## Consequences

### Positive

- GSD gains Gastown's multi-agent coordination patterns without inheriting its implementation debt
- The chipset definition is a stable artifact that survives upstream Gastown changes
- Skill-creator can validate, customize, and evolve the chipset through its standard pipeline
- Documentation serves as a bridge between the two communities
- Token budget stays controlled (chipset fits within 10k token allocation)

### Negative

- Some Gastown features that depend on Go-specific implementation details (tmux injection, Dolt queries) cannot be expressed as chipset patterns and are excluded
- The chipset is a model of Gastown's architecture, not a running system -- runtime behavior requires GSD's own execution layer
- Upstream Gastown changes are not automatically reflected; the chipset definition requires manual updates to absorb new patterns

### Neutral

- Gastown's MIT license permits this approach without restriction
- Both projects remain independent with no coupling
