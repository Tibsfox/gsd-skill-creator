# Cooking with Claude — Milestone Specification

**Date:** March 1, 2026
**Vision Document:** 00-vision-cooking-with-claude.md
**Research Reference:** 05-cooking-fundamentals-research.md, 06-rosetta-core-spec.md, 07-college-structure-spec.md
**Estimated Execution:** ~14-18 context windows across ~7-9 sessions

---

## Mission Objective

Implement the Rosetta Core translation engine as skill-creator's fundamental identity, the College Structure as its knowledge organization model, and the Calibration Engine as its feedback loop — then prove all three with a flagship Cooking with Claude skill pack grounded in food science, thermodynamics, nutrition, and technique. Done looks like: a user says "my cookies came out flat" and the system applies baking science to diagnose the problem, adjusts for the user's specific equipment and history, records the calibration delta, and does all of this through the same engine that could equally translate a mathematical concept into Python or explain a circuit in VHDL.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    SKILL-CREATOR                         │
│                                                          │
│  ┌──────────────────────────────────────────────┐       │
│  │              ROSETTA CORE                     │       │
│  │  ┌──────────┐  ┌──────────┐  ┌───────────┐  │       │
│  │  │ Concept  │→│ Panel    │→│Expression │  │       │
│  │  │ Registry │  │ Router   │  │ Renderer  │  │       │
│  │  └──────────┘  └──────────┘  └───────────┘  │       │
│  │        ↑              ↕              ↓        │       │
│  │  ┌──────────┐  ┌──────────┐  ┌───────────┐  │       │
│  │  │Calibrate │←│ Feedback │←│  Output   │  │       │
│  │  │ Engine   │  │ Ingress  │  │ Channel   │  │       │
│  │  └──────────┘  └──────────┘  └───────────┘  │       │
│  └──────────────────────────────────────────────┘       │
│        ↕                    ↕                             │
│  ┌──────────┐        ┌──────────┐                       │
│  │ COLLEGE  │        │ Existing │                       │
│  │ Structure│        │ Pipeline │                       │
│  │ (Depts)  │        │ (Observe,│                       │
│  │          │        │  Detect, │                       │
│  │ Math     │        │  Suggest)│                       │
│  │ Culinary │        │          │                       │
│  └──────────┘        └──────────┘                       │
└─────────────────────────────────────────────────────────┘
```

### System Layers

1. **Rosetta Core** — The translation engine. Maintains concept identity, routes to appropriate panels, renders expressions, processes feedback through the calibration loop.
2. **College Structure** — Knowledge organization. Departments contain concepts, panels, calibration rules, try-sessions, and references. Explorable as code.
3. **Calibration Engine** — The universal feedback loop. Observe→Compare→Adjust→Record, parameterized by domain-specific science models.
4. **Cooking Department** — The flagship. Seven wings of culinary knowledge, each with calibration models, encoded as explorable College code.
5. **Integration Layer** — Bridges Rosetta Core to skill-creator's existing observation pipeline, token budget management, and chipset configuration.

## Deliverables

| # | Deliverable | Acceptance Criteria | Component Spec |
|---|------------|-------------------|----------------|
| 1 | Rosetta Core engine | Translates concepts across 3+ panels; panel router selects appropriate expression based on context | 06-rosetta-core-spec.md |
| 2 | Concept Registry | Stores canonical concept definitions with panel mappings; supports dependency resolution | 06-rosetta-core-spec.md |
| 3 | Panel Interface | Standard interface for language panels; initial panels: Python, C++, Java | 03-panel-interface.md |
| 4 | Heritage Panel Set | Lisp, Pascal, Fortran panels demonstrating pedagogical value of heritage languages | 03-panel-interface.md |
| 5 | College Structure framework | Department/wing/concept hierarchy; progressive disclosure loading; explorable code | 07-college-structure-spec.md |
| 6 | Mathematics Department | Seeded from "The Space Between"; concepts mapped to all active panels | 07-college-structure-spec.md |
| 7 | Calibration Engine | Universal Observe→Compare→Adjust→Record loop; domain model interface | 04-calibration-engine.md |
| 8 | Cooking Department | Seven wings: food science, thermodynamics, nutrition, technique, baking, safety, home economics | 05-cooking-department.md |
| 9 | Cooking Calibration Models | Domain-specific models for temperature, timing, seasoning, texture feedback | 04-calibration-engine.md |
| 10 | Safety Warden (Culinary) | Absolute food safety boundaries — temperature, allergen, storage | 05-cooking-department.md |
| 11 | Integration bridge | Rosetta Core ↔ skill-creator observation pipeline, token budget, chipset | 08-integration.md |
| 12 | Test suite | 85%+ coverage; safety-critical tests mandatory pass; calibration accuracy tests | 09-test-plan.md |

## Component Breakdown

| Component | Spec Document | Dependencies | Model | Est. Tokens |
|-----------|--------------|-------------|-------|-------------|
| Rosetta Core engine | 06-rosetta-core-spec.md | Shared types (Wave 0) | Opus | ~25K |
| Concept Registry | 06-rosetta-core-spec.md | Rosetta Core types | Sonnet | ~15K |
| Panel Interface + systems panels | 03-panel-interface.md | Concept Registry | Sonnet | ~20K |
| Heritage panels (Lisp, Pascal, Fortran) | 03-panel-interface.md | Panel Interface | Opus | ~20K |
| College Structure framework | 07-college-structure-spec.md | Rosetta Core, Panel Interface | Sonnet | ~20K |
| Mathematics Department seed | 07-college-structure-spec.md | College framework, "The Space Between" | Opus | ~25K |
| Calibration Engine | 04-calibration-engine.md | Rosetta Core types | Opus | ~20K |
| Cooking Department (7 wings) | 05-cooking-department.md | College framework, Calibration Engine | Sonnet | ~35K |
| Cooking Calibration Models | 04-calibration-engine.md | Calibration Engine, Food Science wing | Opus | ~15K |
| Safety Warden (Culinary) | 05-cooking-department.md | Cooking Department | Sonnet | ~10K |
| Integration bridge | 08-integration.md | All above | Sonnet | ~15K |
| Test suite | 09-test-plan.md | All above | Sonnet | ~15K |

### Model Assignment Rationale

**Opus (35%):** Rosetta Core engine design (the architectural heart — judgment-heavy decisions about concept identity, translation semantics, and panel routing), Heritage panel implementations (requires deep understanding of language paradigms and pedagogical value), Mathematics Department seeding (translating "The Space Between" into computational architecture), Calibration Engine design (the feedback loop that makes everything improve — requires understanding domain science models), Cooking Calibration Models (domain-specific science behind adjustments)

**Sonnet (60%):** Concept Registry (structured data management), Panel Interface and systems panels (well-defined APIs), College Structure framework (directory and loading architecture), Cooking Department wings (content generation from research), Safety Warden (rule-based boundaries), Integration bridge (connecting established interfaces), Test suite (verification)

**Haiku (5%):** Type stubs, directory scaffolding, configuration templates

## Cross-Component Interfaces

### Shared Types

```typescript
// Built in Wave 0 before parallel work begins

interface RosettaConcept {
  id: string;                          // Canonical concept identifier
  name: string;                        // Human-readable name
  domain: string;                      // Department/domain identifier
  description: string;                 // Canonical description
  panels: Map<PanelId, PanelExpression>; // Panel-specific expressions
  relationships: ConceptRelationship[]; // Dependencies, analogies, cross-refs
  calibration?: CalibrationProfile;     // Domain-specific calibration data
  complexPlanePosition?: ComplexPosition; // Position on the Complex Plane of Experience
}

interface PanelExpression {
  panelId: PanelId;                    // Which panel (python, cpp, lisp, etc.)
  code?: string;                       // Code expression
  explanation?: string;                // Natural language explanation
  examples?: string[];                 // Usage examples
  pedagogicalNotes?: string;           // What exploring this teaches
}

interface CalibrationDelta {
  observedResult: string;              // What happened
  expectedResult: string;              // What was intended
  adjustment: Record<string, number>;  // Parameter changes
  confidence: number;                  // 0-1 confidence in adjustment
  domainModel: string;                 // Which science model was applied
  timestamp: Date;
}

interface CollegeDepartment {
  id: string;
  name: string;
  wings: DepartmentWing[];
  concepts: RosettaConcept[];
  calibrationModels: CalibrationModel[];
  trySessions: TrySession[];
  tokenBudget: TokenBudgetConfig;
}

type PanelId = 'python' | 'cpp' | 'java' | 'lisp' | 'pascal' | 'fortran' | 'vhdl' | 'natural';

interface CalibrationModel {
  domain: string;
  parameters: string[];                // What can be adjusted
  science: string;                     // Underlying scientific model
  safetyBoundaries: SafetyBoundary[];  // Absolute limits
}

interface SafetyBoundary {
  parameter: string;
  limit: number | string;
  type: 'absolute' | 'warning';       // Absolute = never override; warning = flag
  reason: string;
}
```

### Filesystem Contracts

```
.college/
├── rosetta-core/
│   ├── engine.ts                # Core translation logic
│   ├── concept-registry.ts      # Concept storage and lookup
│   ├── panel-router.ts          # Panel selection logic
│   └── expression-renderer.ts   # Output formatting
├── calibration/
│   ├── engine.ts                # Universal calibration loop
│   ├── models/                  # Domain-specific models
│   │   ├── cooking.ts
│   │   └── mathematics.ts
│   └── delta-store.ts           # Calibration history persistence
├── departments/
│   ├── mathematics/
│   │   ├── DEPARTMENT.md
│   │   ├── concepts/
│   │   ├── panels/
│   │   ├── calibration/
│   │   ├── try-sessions/
│   │   └── references/
│   └── culinary-arts/
│       ├── DEPARTMENT.md
│       ├── concepts/
│       │   ├── food-science/
│       │   ├── thermodynamics/
│       │   ├── nutrition/
│       │   ├── technique/
│       │   ├── baking-science/
│       │   ├── safety/
│       │   └── home-economics/
│       ├── panels/
│       ├── calibration/
│       ├── try-sessions/
│       └── references/
├── panels/
│   ├── panel-interface.ts       # Standard panel contract
│   ├── python-panel.ts
│   ├── cpp-panel.ts
│   ├── java-panel.ts
│   ├── lisp-panel.ts
│   ├── pascal-panel.ts
│   └── fortran-panel.ts
└── integration/
    ├── observation-bridge.ts    # → skill-creator observation pipeline
    ├── token-budget-adapter.ts  # → skill-creator token budget
    └── chipset-adapter.ts       # → chipset configuration
```

## Safety & Boundary Conditions

1. **Food safety boundaries are absolute.** The Calibration Engine may adjust cooking temperature, timing, and technique — but never below safe minimums. Poultry internal temperature (165°F/74°C), ground meat (160°F/71°C), and safe storage temperatures (below 40°F/4°C) are enforced by the Safety Warden and cannot be overridden by calibration.

2. **Allergen warnings are non-negotiable.** When ingredient substitution or recipe modification is suggested, allergen implications are always flagged. The system does not assume allergen status from user history — it asks.

3. **Calibration bounds follow skill-creator's existing constraints.** The 20% maximum content change rule applies to calibration adjustments. No single calibration step changes parameters by more than 20%.

4. **Medical and dietary claims stay within evidence.** No claim about nutritional or health benefits that exceeds peer-reviewed evidence. Appropriate caveats always included.

5. **Heritage language panels respect copyright.** All code examples are original implementations, not copied from Rosetta Code or other sources.

## Pre-Computed Knowledge

| Tier | Size | Loading Strategy |
|------|------|-----------------|
| Summary (dept overviews, panel list, safety rules) | ~3K | Always loaded |
| Active (current wing concepts, calibration models) | ~12K | On demand per wing |
| Reference (full food science, heritage language pedagogy) | ~50K+ | Deep dives only |
