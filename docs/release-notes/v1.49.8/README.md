# v1.49.8 — Cooking With Claude

**Shipped:** 2026-03-01
**Phases:** 11 | **Plans:** 45 | **Commits:** 89
**Files Changed:** 207 (+24,541 lines) | **New Code:** 17,964 LOC TypeScript in `.college/`
**Tests:** 650 new (19,853 total passing) | **Coverage:** 94.78% statement

## Summary

The flagship proof-of-concept milestone that established three architectural pillars: Rosetta Core (translation engine), College Structure (knowledge as explorable code), and Calibration Engine (universal feedback loop). Built a complete Cooking Department with 7 wings grounded in peer-reviewed food science, a Mathematics Department seeded from "The Space Between", and 9 language panels spanning systems, heritage, and frontier families. The system foxfooded itself — GSD workflow mapped to Rosetta Core, development mapped to Calibration, project organization mapped to College Structure.

## Key Features

### Rosetta Core Translation Engine
- 9 language panels: Python, C++, Java (systems); Perl, ALGOL, Lisp, Pascal, Fortran (heritage); Unison (frontier)
- Each panel teaches something unique about programming paradigms
- Panel-to-engine routing via chipset adapter

### College Structure
- Progressive disclosure: summary (<3K tokens always) -> active (<12K on demand) -> deep (50K+ on request)
- Department/wing/concept hierarchy with try-sessions and cross-reference resolution
- Token budget enforcement: 2-5% ceiling for panel loading

### Calibration Engine
- Universal Observe -> Compare -> Adjust -> Record feedback loop
- Domain-pluggable models with bounded 20% adjustment per step
- Delta persistence and profile synthesis

### Cooking Department (7 wings)
- Food Science, Thermodynamics, Nutrition, Technique, Baking Science, Food Safety, Home Economics
- 30+ concepts grounded in peer-reviewed science
- Safety Warden with three enforcement modes (annotate/gate/redirect)
- Absolute temperature floors: poultry 165F, ground meat 160F, whole cuts 145F

### Mathematics Department
- Seeded from "The Space Between" with 7 concepts positioned on the Complex Plane of Experience

### Integration Bridge
- Observation pipeline connecting all three pillars
- Token budget enforcement (2-5% ceiling)
- Chipset adapter for panel-to-engine routing

## Design Decisions

- **Rosetta Core IS skill-creator identity**: The translation engine isn't a feature — it's what skill-creator IS
- **Code IS curriculum**: Exploring department source code teaches the subject matter
- **Cooking as flagship proof**: Universal, tangible, demonstrates all three pillars
- **Skip research phase**: The cooking fundamentals document IS the research (saved ~2 hours)
- **Progressive disclosure 3-tier**: Keeps token budget within 2-5% even with deep content
- **Safety boundaries absolute**: Food safety temps that calibration cannot override
- **Wave execution with parallelism**: 5 waves, up to 3 parallel tracks — completed in ~2 hours wall time

## Retrospective

### What Worked
- **Three architectural pillars validated in a single milestone.** Rosetta Core (translation), College Structure (knowledge), and Calibration Engine (feedback) all shipped together, with the Cooking Department proving all three work in concert. 650 new tests at 94.78% coverage confirms the integration is real.
- **"Skip research" pattern saved ~2 hours.** The cooking fundamentals document IS the research -- no separate research phase needed when the teaching reference is the primary source. This pattern would be reused in v1.49.9.
- **Progressive disclosure (3-tier token budget) solves the context window problem.** Summary (<3K tokens) -> active (<12K on demand) -> deep (50K+ on request) keeps token budget within 2-5% ceiling even with rich content. This is the key architectural insight for scaling College departments.
- **Safety Warden with absolute temperature floors.** Poultry 165F, ground meat 160F, whole cuts 145F -- calibration cannot override these. The pattern of "calibratable defaults with non-negotiable safety boundaries" is reusable across every domain.

### What Could Be Better
- **17,964 LOC in `.college/` is a large surface area for a proof-of-concept.** The 7 wings are thorough but the volume raises questions about maintenance burden as more departments are added.
- **The foxfooding claim (GSD mapped to Rosetta Core, development mapped to Calibration) is architectural assertion, not tested integration.** The mapping is conceptually clean but not enforced by code.

## Lessons Learned

1. **Cooking is the ideal proof-of-concept domain.** Universal knowledge, tangible outcomes, hard safety boundaries (food safety temps), and progressive skill building -- it exercises every feature of the College Structure.
2. **The "teaching reference IS the research" pattern eliminates a full project phase.** When the source material is already structured for education, a separate research phase is redundant overhead.
3. **Token budget enforcement at the architecture level (2-5% ceiling) is essential for LLM-integrated education.** Without progressive disclosure, any rich educational content will blow the context window.
4. **89 commits across 45 plans in ~2 hours demonstrates wave execution with parallelism at scale.** 5 waves with up to 3 parallel tracks is the throughput ceiling for a single session.
