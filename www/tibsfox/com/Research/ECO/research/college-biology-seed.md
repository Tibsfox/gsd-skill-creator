# PNW Living Systems: College Biology Department Seed Data

> **Phase 632 — Wave 3: Engineering & Integration**
>
> Seed data for the College Structure biology department, cross-referenced with the mathematics department (population dynamics, fractal geometry) and Heritage Skills (ethnobotany, TEK). This document defines the explorable code structure for `/.college/departments/biology/`.

---

## 1. Department Definition

```
Department: Biology
ID: biology
Panel: Natural Sciences
Description: >
  Pacific Northwest ecosystem biology organized through the PNW Living Systems
  Taxonomy. 189 species across 8 elevation bands, 17 habitats, and 13 ecological
  roles — from Tahoma's summit to the Salish Sea floor.
```

## 2. Concept Groups (5 groups, 25 concepts)

### Group 1: Elevation Ecology (`concepts/elevation-ecology/`)

| Concept | File | Cross-Refs |
|---------|------|------------|
| Elevation bands and life zones | `elevation-bands.ts` | math: elevation-gradient engine |
| Treeline dynamics | `treeline-dynamics.ts` | math: population-dynamics engine |
| Orographic precipitation | `orographic-precipitation.ts` | math: elevation-gradient engine |
| Alpine adaptation strategies | `alpine-adaptations.ts` | — |
| Marine depth zonation | `marine-zonation.ts` | — |

### Group 2: Species Interactions (`concepts/species-interactions/`)

| Concept | File | Cross-Refs |
|---------|------|------------|
| Predator-prey dynamics | `predator-prey.ts` | math: Lotka-Volterra (population-dynamics) |
| Trophic cascades | `trophic-cascades.ts` | math: population-dynamics engine |
| Mycorrhizal networks | `mycorrhizal-networks.ts` | math: fractal-geometry engine (L-systems) |
| Symbiosis and mutualism | `symbiosis.ts` | — |
| Keystone species | `keystone-species.ts` | — |

### Group 3: Conservation Biology (`concepts/conservation/`)

| Concept | File | Cross-Refs |
|---------|------|------------|
| ESA framework and listings | `esa-framework.ts` | — |
| Salmon lifecycle and decline | `salmon-lifecycle.ts` | math: population-dynamics, watershed-topology |
| Old-growth forest ecology | `old-growth-ecology.ts` | — |
| Marine conservation (orca, otter) | `marine-conservation.ts` | math: population-dynamics engine |
| Climate-driven range shifts | `range-shifts.ts` | math: elevation-gradient engine |

### Group 4: Ecosystem Processes (`concepts/ecosystem-processes/`)

| Concept | File | Cross-Refs |
|---------|------|------------|
| Nutrient cycling (salmon pathway) | `nutrient-cycling.ts` | math: watershed-topology engine |
| Watershed hydrology | `watershed-hydrology.ts` | math: watershed-topology engine |
| Fire ecology and succession | `fire-ecology.ts` | heritage: Kalapuya fire management |
| Decomposition and soil building | `decomposition.ts` | — |
| Carbon sequestration (old-growth) | `carbon-sequestration.ts` | — |

### Group 5: Ethnobiology (`concepts/ethnobiology/`)

| Concept | File | Cross-Refs |
|---------|------|------------|
| Traditional Ecological Knowledge | `tek-overview.ts` | heritage: OCAP/CARE/UNDRIP |
| Ethnobotany (cedar, camas, wapato) | `ethnobotany.ts` | heritage: Coast Salish, Kalapuya |
| Fisheries co-management | `fisheries-comanagement.ts` | heritage: Boldt Decision, treaty rights |
| Cultural burning practices | `cultural-burning.ts` | heritage: Kalapuya, fire ecology |
| Clam gardens and marine TEK | `marine-tek.ts` | heritage: Coast Salish, Makah |

## 3. Try Sessions (3 starter sessions)

### Session 1: `first-field-guide.json`
**Title:** Build a PNW Field Guide
**Difficulty:** Introductory
**Concept path:** elevation-ecology → species-interactions → keystone-species
**Task:** Given an elevation (e.g., 3,500 ft), identify the elevation band, list 5 species you'd encounter, and describe one ecological interaction between them.
**Math cross-ref:** Use elevation-gradient engine to compute Minecraft Y level.

### Session 2: `salmon-nutrient-trace.json`
**Title:** Trace a Salmon's Nutrients
**Difficulty:** Intermediate
**Concept path:** ecosystem-processes/nutrient-cycling → species-interactions/keystone-species → conservation/salmon-lifecycle
**Task:** Follow a Chinook salmon from ocean to spawning stream. At each stage, identify: species encountered, nutrients transferred, and the next link in the chain. Calculate total marine-derived nitrogen delivered.
**Math cross-ref:** population-dynamics engine (salmon population model), watershed-topology engine (migration route).

### Session 3: `orca-recovery-model.json`
**Title:** Can We Save the Orcas?
**Difficulty:** Advanced
**Concept path:** conservation/marine-conservation → species-interactions/predator-prey → ecosystem-processes/nutrient-cycling
**Task:** Model Southern Resident orca recovery as a function of Chinook salmon abundance. Identify the 3 biggest levers for increasing Chinook runs and simulate population trajectories over 50 years.
**Math cross-ref:** population-dynamics engine (Lotka-Volterra), watershed-topology (dam removal scenarios).
**Heritage cross-ref:** Treaty fishing rights, First Salmon Ceremony.

## 4. Calibration Model

```typescript
// .college/calibration/models/biology.ts
export const biologyCalibration = {
  department: 'biology',
  baselineQuestions: [
    { q: 'Name the 8 PNW elevation bands from summit to seafloor', tier: 'recall' },
    { q: 'Explain why salmon are called a keystone species', tier: 'understand' },
    { q: 'Describe the mycorrhizal network and name 3 participating species', tier: 'apply' },
    { q: 'Model the effect of dam removal on salmon populations', tier: 'analyze' },
    { q: 'Design a conservation plan for Southern Resident orcas', tier: 'synthesize' },
  ],
  taxonomySource: 'www/tibsfox/com/Research/ECO/research/',
  chipsetRef: 'pnw-ecosystem.chipset.yaml',
  mathCrossRefs: ['population-dynamics', 'elevation-gradient', 'watershed-topology', 'fractal-geometry'],
  heritageCrossRefs: ['OCAP', 'CARE', 'UNDRIP', 'Boldt-Decision', 'First-Salmon-Ceremony'],
};
```

## 5. Cross-Reference Map

| Biology Concept | Math Department | Heritage Skills |
|----------------|-----------------|-----------------|
| Elevation bands | elevation-gradient engine | Seasonal rounds (alpine → lowland) |
| Predator-prey | Lotka-Volterra (population-dynamics) | Wolf/elk cultural significance |
| Mycorrhizal networks | L-systems (fractal-geometry) | Agarikon spiritual use |
| Salmon lifecycle | population-dynamics + watershed-topology | First Salmon Ceremony, treaty rights |
| Fire ecology | — | Kalapuya cultural burning |
| Treeline dynamics | elevation-gradient (lapse rates) | Alpine gathering traditions |
| Watershed hydrology | watershed-topology (flow accumulation) | Stream management practices |
| Conservation (ESA) | population-dynamics (viability) | Co-management, Boldt Decision |

## 6. Verification

| Test ID | Description | Status |
|---------|-------------|--------|
| INT-3 | College seed data structured | PASS |
| INT-3 | 5 concept groups with 25 concepts | PASS |
| INT-3 | Math department cross-references | PASS (8 connections) |
| INT-3 | Heritage Skills cross-references | PASS (8 connections) |
| INT-3 | 3 try sessions with difficulty progression | PASS |
| INT-3 | Calibration model defined | PASS |

**Phase 632 result: PASS — Biology department seed data complete.**
