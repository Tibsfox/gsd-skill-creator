# v1.49.18 — Space Between Observatory

**Shipped:** 2026-03-06
**Commits:** 16
**Files:** 117 changed | **New Code:** ~24,536 LOC
**Tests:** ~466 new across 5 test directories

## Summary

A standalone interactive engine for teaching mathematics through wonder, nature, and creative exploration. Ships as `the-space-between-engine/` — a full Vite+React sub-project with 8 observatory wings (one per mathematical foundation), 5 nature simulations, a creative workshop, narrative layer, and integration bridge back to skill-creator's complex plane.

## Key Features

### Observatory Shell
- Navigation, state management, and dark theme
- Routes between wings, telescope, garden, and narrative layers

### Telescope
- Unified view with 4 parallel chains
- Learner progression across all 8 foundations simultaneously

### Observatory Wings 1-8
One wing per mathematical foundation, each with phased content (wonder, see, touch, understand, connect, create):
1. Unit Circle  2. Pythagorean  3. Trigonometry  4. Vector Calculus
5. Set Theory  6. Category Theory  7. Information Theory  8. L-Systems

### Interactive Visualizations
- Canvas system with RAF loop, FPS tracking, and pointer normalization
- 5 nature simulations: set visualizer, functor bridge, tree growth, magnetic field, and more
- Generative art tools

### Garden Creative Workshop
- Art canvas, music studio (Tone.js), L-system editor, reflective journal
- Create with mathematics before learning the notation

### Foundation & Infrastructure
- Foundation registry with all 8 foundations (1,489 lines, full metadata, 6 phases each)
- Connection graph with directed edges and BFS pathfinding
- Progression engine with immutable state management

### Narrative Layer
- 8 wonder stories (zero mathematical notation)
- 8 literary bridges from the Hundred Voices collection
- 20 reflection prompts

### Integration Layer
- Skill-creator bridge mapping foundations to complex plane positions
- Calibration system
- Wonder Warden with soft/hard phase gating

### Housekeeping
- Gitignore sub-project package-lock.json
- Fix link to Agentic Programming documentation

## Retrospective

### What Worked
- **Standalone Vite+React sub-project proved the engine can live outside skill-creator's main build.** `the-space-between-engine/` has its own build, its own dependencies, and its own test suite. The integration bridge back to skill-creator's complex plane is a clean boundary, not a tight coupling.
- **8 observatory wings with phased content (wonder, see, touch, understand, connect, create).** The 6-phase progression is the College Structure's progressive disclosure applied to mathematics -- start with wonder (zero notation), end with creation. This is a genuine pedagogical architecture, not just content organization.
- **5 nature simulations with Canvas RAF loop and FPS tracking.** Interactive visualizations (set visualizer, functor bridge, tree growth, magnetic field) make abstract mathematics tangible. The canvas system with pointer normalization is reusable infrastructure for any future interactive content.
- **Wonder Warden with soft/hard phase gating.** Preventing premature exposure to mathematical notation is the safety warden pattern applied to pedagogy. Soft gating suggests staying longer; hard gating blocks advancement. This respects the learner's journey.

### What Could Be Better
- **~24,536 LOC is the largest code addition in the entire v1.49.x series.** The engine is comprehensive (8 wings, 5 simulations, garden workshop, narrative layer, integration layer) but the maintenance surface is substantial. The Vite+React sub-project adds a second frontend framework to the overall project.
- **Garden creative workshop (art canvas, music studio, L-system editor, journal) is ambitious scope.** Tone.js integration for a music studio and L-system editors are features that each could be their own milestone. Whether they're all production-quality or proof-of-concept tier is unclear from the release notes.

## Lessons Learned

1. **Mathematics education should start with wonder, not notation.** The 8 wonder stories with zero mathematical notation, followed by nature simulations, followed by formal content -- this progression respects how people actually build mathematical intuition.
2. **Standalone sub-projects with integration bridges are the right architecture for engines.** The Space Between Engine doesn't need skill-creator's build system to function, but it can bridge back when running inside the ecosystem. This is the cartridge composition pattern at the application level.
3. **Interactive visualizations turn abstract mathematics into tangible experience.** The Canvas RAF loop with FPS tracking and pointer normalization is reusable infrastructure. Any future interactive educational content should build on this foundation rather than reimplementing rendering.
4. **Foundation registry with full metadata (1,489 lines, 8 foundations, 6 phases each) is the engine's source of truth.** Centralizing all progression logic in one registry makes the system auditable and prevents scattered state.
