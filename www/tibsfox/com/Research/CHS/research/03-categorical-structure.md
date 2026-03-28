# Categorical Structure -- Compositionality as Design Grammar

## Overview

Category theory is the mathematics of composition. Developed by Samuel Eilenberg and Saunders Mac Lane in 1945, it provides a language for describing how things combine while preserving structure. Applied to interface design, it offers formal tools for ensuring that components composed at any scale remain coherent.

## Core Concepts

### Categories

A category consists of:
- **Objects:** The things (UI states, components, design tokens)
- **Morphisms:** The arrows between things (transitions, transformations, mappings)
- **Composition:** Morphisms compose: if f: A -> B and g: B -> C, then g . f: A -> C
- **Identity:** Every object has an identity morphism (do nothing, stay in current state)

### Functors

A functor is a structure-preserving map between categories. In UI terms:
- A design system is a functor from the category of design tokens to the category of rendered pixels
- A theme is a natural transformation between two such functors (same structure, different colors)

### Natural Transformations

A natural transformation maps between functors while preserving commutativity. In design terms: a refactor that changes implementation without changing behavior -- the squares commute.

## Applied Category Theory (ACT)

Fong and Spivak's "An Invitation to Applied Category Theory" (2019) and the NIST SP-1249 workshop series have established ACT as a practical engineering discipline.

### Key ACT Constructs for Design

| ACT Concept | Design Interpretation |
|---|---|
| Object | Component state, page, view |
| Morphism | User action, transition, API call |
| Functor | Design system, rendering pipeline |
| Natural transformation | Theme switch, responsive breakpoint |
| Pullback | Component composition without conflict |
| Pushout | Component merge with conflict resolution |
| Monad | State management (Redux is a monad) |

## Compositionality Rules

From the ACT framework, we derive six compositionality rules for interface design:

1. **Associativity:** Component nesting must be order-independent -- (A inside B) inside C = A inside (B inside C)
2. **Identity:** Every component has a "do nothing" state that preserves the interface
3. **Closure:** Composing two well-formed components always yields a well-formed component
4. **Functoriality:** Applying a theme must preserve all structural relationships between components
5. **Naturality:** Switching between themes must commute with all component transitions
6. **Universality:** Shared patterns should factor through a universal component (DRY as a categorical property)

## Design Tokens as Types

Design tokens -- the atomic values of a design system (colors, spacing, typography) -- function as categorical types:

- A color token is a morphism from the category of semantic intentions to the category of RGB values
- A spacing token is a morphism from the category of layout relationships to the category of pixel measurements
- Tokens compose: `primary-button-background` = `primary-color` . `button-background` . `interactive-state`

This typing ensures that no component can be assigned an invalid style: the type system prevents it.

## Cross-References

> **Related:** [Order From Chaos](04-order-from-chaos.md) for complexity theory, [Agentic Interface](05-agentic-interface.md) for machine-readable design tokens, [Synthesis](06-synthesis.md) for the unified framework.
