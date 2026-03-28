# Chipset Architecture

> **Domain:** gsd-skill-creator
> **Module:** 3 -- Copper, Blitter, Gastown, AMIGA
> **Through-line:** *The Amiga hardware metaphor is not decoration. Copper schedules DMA operations, Blitter handles bulk data moves, Gastown coordinates multi-agent orchestration, and the AMIGA 5-team governance model manages concurrent execution streams.*

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Key Source Files](#2-key-source-files)
3. [Design Decisions](#3-design-decisions)
4. [Implementation Details](#4-implementation-details)
5. [Test Coverage](#5-test-coverage)
6. [Documentation Requirements](#6-documentation-requirements)
7. [Cross-References](#7-cross-references)
8. [Sources](#8-sources)

---

## 1. Architecture Overview

Chipset Architecture represents a core subsystem of the gsd-skill-creator ecosystem. This module documents the architecture, key source files, design decisions, and documentation requirements for producing a complete documentation web that makes every design decision traceable.

The goal is to ensure that any contributor, AI agent, or future maintainer can enter at any file and follow trails outward until the entire architecture makes sense.

---

## 2. Key Source Files

The primary source files for this subsystem are located in the TypeScript source tree. Each file has a specific role in the overall lifecycle and communicates with other subsystems through well-defined interfaces.

Key patterns include:
- **Single responsibility** -- each file handles exactly one aspect of the lifecycle
- **Clean interfaces** -- communication between subsystems uses typed contracts
- **Testable isolation** -- dependencies are injectable for unit testing
- **Documentation hooks** -- @module, @see, @milestone, @safety tags provide traceability

---

## 3. Design Decisions

Every design decision in this subsystem has a lineage traceable to a specific milestone, conversation, or architectural principle. The documentation web mission makes these decisions visible through inline commentary and cross-reference files.

Key decisions to document include:
- Why specific data structures were chosen over alternatives
- Performance tradeoffs and their empirical basis
- Safety boundaries and their policy origins
- Mathematical foundations linking to The Space Between

---

## 4. Implementation Details

The implementation follows patterns established across the gsd-skill-creator codebase:

- TypeScript with strict mode enabled
- Zod schemas for runtime validation
- JSONL for append-only event logs
- Filesystem-based communication between agents
- Atomic write patterns (.complete markers) for crash recovery

---

## 5. Test Coverage

Testing follows the RED-GREEN-REFACTOR cycle with Vitest:

- Unit tests for each exported function
- Integration tests for subsystem interactions
- Safety-critical tests (BLOCK level) for boundary enforcement
- Edge case tests for error conditions and recovery paths

---

## 6. Documentation Requirements

This module requires the following documentation artifacts:

- JSDoc with @module, @see, @milestone, @mathematical, @safety tags
- College department cross-reference file
- Navigator index entries in all four lookup dimensions
- GENEALOGY.md entry tracing the subsystem through its milestone history

---

## 7. Cross-References

> **Related:** See other modules in this series for connected subsystem documentation.

---

## 8. Sources

1. gsd-skill-creator source code -- github.com/Tibsfox/gsd-skill-creator (dev branch)
2. The Space Between -- tibsfox.com/media/The_Space_Between.pdf
3. CHANGELOG.md -- milestone history and design decisions
4. docs/ -- existing architecture documentation (158+ files)
