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
