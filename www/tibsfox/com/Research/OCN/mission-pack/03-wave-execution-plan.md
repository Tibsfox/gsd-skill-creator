# Open Compute Node — Wave Execution Plan

**Date:** 2026-02-28
**Milestone Spec:** 02-milestone-spec.md
**Total Tasks:** 28 | **Waves:** 5 | **Max Parallel Tracks:** 3

---

## Wave 0: Foundation (Sequential — Must Complete First)

**Purpose:** Establish shared types, dimensional constraints, and interface contracts that all downstream waves consume.
**Cache Strategy:** Wave 0 completes within 5-minute TTL window; all Wave 1 agents load from cache.

| Task | Description | Model | Est. Tokens | Output |
|------|-------------|-------|-------------|--------|
| 0.1 | Define shared dimensional types (container inner dims, zone boundaries, penetration coords) | Sonnet | 5K | `types/dimensions.md` |
| 0.2 | Define interface contracts (power↔cooling, cooling↔compute, compute↔community) | Sonnet | 5K | `types/interfaces.md` |
| 0.3 | Define safety disclaimer template and PE review requirements | Haiku | 2K | `types/safety-template.md` |

**Gate:** Types compile (all referenced dimensions are consistent). Interface contracts are bidirectionally complete.

---

## Wave 1: Physical Subsystems (3 Parallel Tracks)

**Purpose:** Design the three independent physical subsystems. Each track has its own domain expertise and produces specifications that Wave 2 integrates.
**Cache Strategy:** All three tracks load Wave 0 outputs from cache. Tracks produce independently.

### Track A: Container Structure

| Task | Description | Model | Est. Tokens | Output |
|------|-------------|-------|-------------|--------|
| 1A.1 | Container modification specification (reinforcements, insulation, penetrations) | Opus | 15K | `specs/container-mods.md` |
| 1A.2 | Internal zone layout (entry, power, compute, cooling zones with dimensions) | Opus | 12K | `specs/zone-layout.md` |
| 1A.3 | Rack mounting specification (floor reinforcement, bolt patterns, seismic bracing) | Sonnet | 8K | `specs/rack-mounting.md` |

### Track B: Power Systems

| Task | Description | Model | Est. Tokens | Output |
|------|-------------|-------|-------------|--------|
| 1B.1 | Solar array sizing and site layout | Opus | 12K | `specs/solar-system.md` |
| 1B.2 | Battery storage specification (BESS container design) | Sonnet | 10K | `specs/battery-storage.md` |
| 1B.3 | Wind supplementation specification | Sonnet | 6K | `specs/wind-system.md` |
| 1B.4 | Power distribution architecture (DC bus, converters, bus bar) | Opus | 15K | `specs/power-distribution.md` |

### Track C: Cooling & Water

| Task | Description | Model | Est. Tokens | Output |
|------|-------------|-------|-------------|--------|
| 1C.1 | Liquid cooling loop design (CDU, manifolds, cold plates) | Opus | 15K | `specs/cooling-loop.md` |
| 1C.2 | Water filtration system specification (5-stage) | Opus | 12K | `specs/water-filtration.md` |
| 1C.3 | Waste management system (55-gallon drum, manifests, logistics) | Sonnet | 6K | `specs/waste-management.md` |

**Gate:** Each track passes internal consistency check. Weight budget summed across all three tracks stays within ISO container payload limit.

---

## Wave 2: Integration Systems (2 Parallel Tracks)

**Purpose:** Design systems that depend on the physical subsystem specifications from Wave 1.
**Dependencies:** Wave 1 (all tracks) complete.
**Cache Strategy:** Load Wave 0 types + Wave 1 outputs from relevant tracks.

### Track D: Compute & Network

| Task | Description | Model | Est. Tokens | Output |
|------|-------------|-------|-------------|--------|
| 2D.1 | GB200 NVL72 rack integration (power, cooling, mounting per rack specs) | Sonnet | 12K | `specs/gpu-rack-integration.md` |
| 2D.2 | Network architecture (fiber intake, ToR switches, rack connectivity, management) | Sonnet | 8K | `specs/network-architecture.md` |
| 2D.3 | Environmental control system (fire suppression, leak detection, HVAC assist) | Sonnet | 8K | `specs/environmental-control.md` |

### Track E: Deployment & Community

| Task | Description | Model | Est. Tokens | Output |
|------|-------------|-------|-------------|--------|
| 2E.1 | US rail corridor mapping (top 20 candidate sites with scoring) | Opus | 15K | `specs/rail-corridor-map.md` |
| 2E.2 | Site preparation specification (foundation, external connections) | Sonnet | 10K | `specs/site-preparation.md` |
| 2E.3 | Community compute allocation architecture | Sonnet | 8K | `specs/community-compute.md` |
| 2E.4 | Mural art program guidelines | Haiku | 4K | `specs/mural-program.md` |

**Gate:** Compute specifications consume power/cooling budgets correctly. Site requirements are achievable at ≥10 of the 20 candidate sites.

---

## Wave 3: Blueprints & Documentation (Sequential with Parallel Sub-tasks)

**Purpose:** Produce the final LaTeX blueprint package, BOM, and integrated specification.
**Dependencies:** Waves 1 and 2 complete.
**Cache Strategy:** This wave has the heaviest context load. Use knowledge tiering: summary (~5K per subsystem) for overview agents, full spec for drawing agents.

| Task | Description | Model | Est. Tokens | Output |
|------|-------------|-------|-------------|--------|
| 3.1 | LaTeX container structure drawings (plan view, elevation, section) | Opus | 20K | `blueprints/container-structure.tex` |
| 3.2 | LaTeX power single-line diagram | Opus | 15K | `blueprints/power-sld.tex` |
| 3.3 | LaTeX cooling P&ID (piping & instrumentation diagram) | Opus | 15K | `blueprints/cooling-pid.tex` |
| 3.4 | LaTeX rack layout drawings | Sonnet | 10K | `blueprints/rack-layout.tex` |
| 3.5 | Bill of Materials compilation | Sonnet | 12K | `blueprints/bom.tex` |
| 3.6 | Integrated specification document (all subsystems, PE disclaimers) | Opus | 25K | `blueprints/integrated-spec.tex` |

**Gate:** All LaTeX compiles. BOM totals are within budget constraints. PE disclaimers present on every page.

---

## Wave 4: Verification & Package (Sequential)

**Purpose:** Run the test plan, compile final deliverables, produce the mission package.
**Dependencies:** Wave 3 complete.

| Task | Description | Model | Est. Tokens | Output |
|------|-------------|-------|-------------|--------|
| 4.1 | Execute test plan (11-test-plan.md) | Sonnet | 15K | `verification/test-results.md` |
| 4.2 | Compile final PDF package (all LaTeX → PDF) | Haiku | 5K | `output/open-compute-node-v1.0.pdf` |
| 4.3 | Generate mission completion report | Sonnet | 8K | `output/mission-report.md` |

**Gate:** All mandatory-pass safety tests pass. All LaTeX compiles to PDF. Package is self-contained.

---

## Execution Summary

| Wave | Tasks | Parallel Tracks | Model Split | Est. Tokens |
|------|-------|----------------|-------------|-------------|
| 0 | 3 | 1 (sequential) | Sonnet/Haiku | 12K |
| 1 | 10 | 3 (A/B/C) | 4 Opus, 5 Sonnet, 0 Haiku | 111K |
| 2 | 7 | 2 (D/E) | 1 Opus, 5 Sonnet, 1 Haiku | 65K |
| 3 | 6 | 1 (sequential w/ parallelizable sub-tasks) | 4 Opus, 2 Sonnet | 97K |
| 4 | 3 | 1 (sequential) | 1 Sonnet, 1 Haiku, 1 Sonnet | 28K |
| **Total** | **29** | | **9 Opus / 15 Sonnet / 3 Haiku** | **~313K** |

**Opus usage: 31%** — Used for judgment-heavy tasks: structural engineering, power system design, cooling loop design, LaTeX blueprints, integrated specification.

**Cache Optimization Opportunities:**
- Wave 0 → Wave 1: All three tracks share the same foundation (types + interfaces)
- Wave 1 Track B tasks 1B.1 and 1B.2 can be burst-produced to share solar sizing context
- Wave 3 LaTeX tasks can share a common document preamble/style file
- Wave 4 verification loads summaries of all specs, not full specs

---

## Critical Path

```
Wave 0 (Foundation) → Wave 1 Track A (Structure) → Wave 2 Track D (Compute)
                   → Wave 1 Track B (Power)     → Wave 2 Track E (Deploy)  → Wave 3 (Blueprints)
                   → Wave 1 Track C (Cooling)    ─────────────────────────→ → Wave 4 (Verify)
```

The critical path runs through Wave 0 → Wave 1 (longest track, likely Track B with 4 tasks) → Wave 2 → Wave 3 → Wave 4.

**Estimated wall time:** 16-24 hours (assuming ~2 hours per session, 8-12 sessions).
