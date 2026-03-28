# Production Ops Playbook — Component Specification

**Milestone:** PNW Millwork Co-op Network
**Wave:** 1 | **Track:** A
**Model Assignment:** Sonnet
**Estimated Tokens:** ~24K
**Dependencies:** 00-shared-types.md (BOMLineItem schema), 01-anchor-node.md (Node North equipment list)
**Produces:** components/03-production-model.md — complete CNC millwork production ops playbook

---

## Objective

Reconstruct the Synsor Corporation production methodology as a documented, implementable playbook for BOM-first CNC architectural millwork manufacturing. Done looks like a document a new shop foreman can hand to their first CNC operator and first project manager on day one, and they can run a production floor from it.

## Context

Synsor's documented methodology (from a 16-year employee): engineered mechanical, electrical, case goods, and architectural millwork; lean manufacturing; BOM-based production engineering; product development through project management, bills of material, and manufacturing engineering. Their clients (Starbucks, Alaska Airlines, Charlotte Russe) required identical-unit rollouts at scale — 50 to 500 identical fixtures per project.

The Architectural Woodwork Institute (AWI) Quality Standards Illustrated is the spec baseline. Custom Grade is the standard for most commercial millwork; Premium Grade for luxury hotel lobbies and flagship retail. The production playbook must be built to AWI Custom at minimum.

The BOM is the central artifact: it is the translation layer between a client's scope of work and the shop floor. Every workflow step flows from BOM generation.

## Technical Specification

### Required Outputs
1. **SOW-to-BOM workflow** — step-by-step: client SOW intake → engineering review → BOM generation → BOM approval → production release
2. **CNC programming workflow** — BOM line items → CAD/CAM software → CNC program → dry-run verification → production run
3. **Material procurement workflow** — BOM-driven purchase orders, lead time management, JIT delivery scheduling
4. **Production scheduling** — pull scheduling (no work orders without confirmed material), visual management board, queue management
5. **Finish room protocol** — color match specification, spray sequence, VOC monitoring, CARB compliance, batch consistency for identical-unit rollouts
6. **AWI inspection protocol** — grade checklist for Custom and Premium; reject/rework threshold; documentation
7. **Multi-node production protocol** — how to split a single 200-unit order across Node North and a second node while maintaining spec consistency

### Key Design Decisions
- **Pull, not push:** No material is ordered without a confirmed SOW. No unit goes to production without confirmed material.
- **BOM version control:** Every BOM change is versioned. Production runs only against approved BOM version.
- **Finish room is the quality gate:** The finish room is where identical units can diverge. Batch production (all units for one color/finish in one run) is the mitigation.

## Implementation Steps

1. Write SOW intake to BOM generation workflow (include BOMLineItem schema reference from 00-shared-types.md)
2. Write CNC programming workflow with software recommendations
3. Write material procurement and JIT scheduling workflow
4. Write finish room protocol with AWI compliance checkpoints
5. Write multi-node production split protocol
6. Write AWI inspection checklist for Custom and Premium grades
7. Write lean manufacturing principles section (5S, pull scheduling, visual management)

## Safety Boundaries
| Constraint | Boundary Type |
|-----------|---------------|
| Finish room: OSHA 29 CFR 1910.94 ventilation requirements documented | ABSOLUTE |
| AWI grade: no units ship below the contracted AWI grade | ABSOLUTE |
| FSC material: BOM must flag FSC-required items; non-FSC material cannot substitute | GATE |
