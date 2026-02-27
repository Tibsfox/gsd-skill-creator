# Physical Infrastructure Chipset -- Usage Guide

## Overview

The Physical Infrastructure Engineering Pack chipset wires six agents into a coordinated multi-agent system for designing water cooling, power distribution, thermal management, and related physical infrastructure systems.

**Agents:** 6 (2 Opus, 4 Sonnet)
**Topology:** Router (architect-agent as entry point)
**Teams:** 3 pre-configured topologies for different engagement types
**Triggers:** 3 file-change patterns for automatic routing
**Safety:** Mandatory -- Safety Warden is in every team and cannot be removed

## Quick Start

```
# Full design review (thorough, sequential gate review)
/physical-infrastructure:design-review "Cool 10 racks at 40kW each in a new data center"

# Rapid prototype (fast exploratory design)
/physical-infrastructure:rapid-prototype "What size pipe do I need for 400kW cooling?"

# Construction package (complete engineering documentation)
/physical-infrastructure:construction-package "Generate complete construction docs for our cooling system design"
```

All three workflows include mandatory safety review. The safety class is determined from your request context (residential, commercial, industrial, or data-center) and cannot be downgraded.

## Teams

### design-review (Pipeline)

**When to use:** Thorough design reviews, code-compliance checks, before committing to a final design.

**Steps:**
1. **Architect** -- Decomposes the request and identifies all subsystems
2. **Calculator** -- Performs all domain calculations with unit tracking
3. **Safety Warden** -- Reviews all calculations against safety thresholds (MANDATORY GATE)
4. **Draftsman** -- Generates blueprints from approved calculations

**Safety class default:** Determined from request context

**Typical duration:** 4 agent invocations, ~60-90 seconds

**Important:** If the Safety Warden finds critical or blocking issues in industrial/data-center designs, the pipeline halts at step 3. No blueprints are generated until the user acknowledges the safety findings.

### rapid-prototype (Leader-Worker)

**When to use:** Exploring design options, quick feasibility checks, comparing design alternatives.

**Steps:**
1. **Architect** leads -- defines the design space and constraints
2. **Calculator** + **Simulator** run in parallel -- quick validation and simulation setup
3. **Safety Warden** gates all outputs before the user sees results

**Safety class default:** Determined from request context (never downgraded for speed)

**Typical duration:** 3 invocations (parallel workers), ~30-45 seconds

**Important:** Speed comes from parallel calculator+simulator execution, not from skipping safety review. The Safety Warden reviews every output even in rapid-prototype mode.

### construction-package (Pipeline)

**When to use:** Final design is approved, ready for contractor submission, need complete engineering documentation.

**Steps:**
1. **Architect** -- Finalizes system specification and subsystem breakdown
2. **Calculator** -- Completes all calculations with full unit tracking
3. **Safety Warden** -- Comprehensive safety review across all domains (MANDATORY GATE)
4. **Draftsman** -- Generates full drawing set and construction documents
5. **Simulator** -- Generates simulation inputs for all subsystems (OpenFOAM, ngspice, artifacts)
6. **Renderer** -- Generates Blender visualization and presentation materials (optional)

**Output:** Complete engineering package including:
- Calculations with unit tracking and safety margins
- P&ID, SLD, floor plan, and isometric drawings
- Bill of materials with line-item specifications
- Installation sequences with prerequisite tracking
- Pre-commissioning checklists
- Simulation input files
- 3D visualization (optional)

**Typical duration:** 6 invocations, ~90-120 seconds

## File Change Triggers

The chipset monitors file changes and automatically routes them to the appropriate specialist agent.

| Pattern | Agent | What Happens |
|---------|-------|--------------|
| `*.pid` | draftsman-agent | When you edit a P&ID file, draftsman reviews and updates the drawing |
| `*.sld` | draftsman-agent | When you edit a single-line diagram, draftsman reviews and updates it |
| `*.calc` | calculator-agent | When you edit a calculation file, calculator re-verifies all calculations |

Triggers fire on file save. The triggered agent performs its review and produces updated output. All triggered outputs still pass through the Safety Warden before reaching the user.

## Token Budgets

| Agent | Model | Budget | Rationale |
|-------|-------|--------|-----------|
| architect-agent | Opus | 32K | Complex multi-domain constraint satisfaction and system decomposition |
| safety-warden | Opus | 32K | Comprehensive safety analysis requiring cross-domain reasoning |
| calculator-agent | Sonnet | 16K | Domain calculations with unit tracking and validation |
| draftsman-agent | Sonnet | 16K | Blueprint generation, BOM, and construction document production |
| simulator-agent | Sonnet | 16K | Simulation template generation for OpenFOAM, ngspice, React artifacts |
| renderer-agent | Sonnet | 16K | Blender script generation and ffmpeg media assembly |

**Budget scope:** Per-invocation, not total. The chipset manages scheduling to stay within limits. Opus agents get 32K to allow complex multi-step reasoning. Sonnet agents get 16K which is adequate for domain-specific skill work.

## Safety Architecture

The chipset enforces the following safety constraints. These are not configurable.

1. **Safety Warden is in every team.** Every team topology includes `safety-warden` in its `required_members` list. This cannot be changed by editing the team definition.

2. **Removing safety-warden raises a configuration error.** Any team definition that does not include `safety-warden` in `required_members` is invalid. The chipset rejects it.

3. **Safety mode is set by safetyClass, not user preference.** The operational mode (annotate, gate, redirect) is determined automatically from the `safetyClass` field on the infrastructure request. Users cannot select or override the mode.

4. **PE disclaimer appears on every output.** Every output from every team topology includes the Professional Engineer disclaimer. It cannot be removed, abbreviated, or suppressed.

5. **Safety class cannot be downgraded.** Once a design starts at industrial/data-center safety class, it cannot be switched to residential/commercial. The `downgrade_safety_class: forbidden` rule enforces this.

## Adding Custom Triggers

To add project-specific file-change triggers, add entries to the `triggers` section of `chipset.yaml`:

```yaml
triggers:
  # ... existing triggers ...
  - pattern: "*.hvac"
    agent: calculator-agent
    description: HVAC specification changes route to calculator for thermal verification
    action: verify_hvac_calculations
```

**Rules for custom triggers:**
- Each trigger must route to an existing agent defined in the `agents` section
- Trigger actions should describe what the agent does when the file changes
- All triggered outputs still pass through the Safety Warden
- Custom triggers do not bypass any safety constraints

## Configuration Reference

The full chipset configuration is in `skills/physical-infrastructure/chipset.yaml`. Key sections:

| Section | Purpose |
|---------|---------|
| `topology` | Top-level topology type (router) |
| `router` | Entry point and default agent configuration |
| `agents` | All six agent definitions with model and token budget |
| `triggers` | File-change routing rules |
| `teams` | Pre-configured team topologies |
| `safety` | Non-negotiable safety enforcement rules |
