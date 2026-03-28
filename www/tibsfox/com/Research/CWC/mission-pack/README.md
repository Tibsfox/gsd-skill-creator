# Cooking with Claude — Mission Package

**Date:** 2026-03-01 | **Status:** Ready for GSD orchestrator

## Contents

| File | Description |
|------|-------------|
| `00-vision-cooking-with-claude.md` | Vision guide — the Rosetta Core, College Structure, Calibration Engine, and flagship cooking skill pack |
| `01-milestone-spec.md` | Milestone specification — 12 deliverables, architecture, interfaces, safety boundaries |
| `02-wave-execution-plan.md` | Wave plan — 18 tasks, 5 waves, 3 parallel tracks |
| `03-04-panel-calibration-specs.md` | Component specs: Panel Interface (6 panels) and Calibration Engine |
| `05-cooking-fundamentals-research.md` | Research reference: food science, thermodynamics, nutrition, technique, safety, baking, home economics |
| `06-rosetta-core-spec.md` | Component spec: Concept Registry, Panel Router, Expression Renderer, Core Engine — **Opus** |
| `07-college-structure-spec.md` | Component spec: Department framework, Mathematics Department seed, College Loader |
| `09-test-plan.md` | Test plan: 86 tests, 14 safety-critical, verification matrix |

## How to Use

1. Point GSD's `new-project` at `00-vision-cooking-with-claude.md`
2. Skip research phase — `05-cooking-fundamentals-research.md` IS the research
3. Feed mission docs in wave order per `02-wave-execution-plan.md`
4. Each component spec is self-contained — agents need only their assigned spec

## Execution Summary

| Metric | Value |
|--------|-------|
| Total tasks | 18 |
| Parallel tracks | 3 (max) |
| Sequential depth | 5 waves |
| Opus / Sonnet / Haiku split | 35% / 60% / 5% |
| Estimated context windows | ~14-18 |
| Estimated sessions | ~7-9 |
| Estimated wall time | ~8-10 hours |
| Total tests | 86 (14 safety-critical) |
| Target coverage | 85%+ |

## Key Design Decisions

- **Rosetta Core IS skill-creator** — The translation engine isn't a feature; it's the identity. Every operation passes through concept identification and panel-appropriate expression
- **Code IS curriculum** — Exploring department source code teaches the subject matter. No separation between tool and textbook
- **Calibration is universal** — Observe→Compare→Adjust→Record applies identically from oven temperature to compiler flags, parameterized by domain science
- **Safety boundaries are absolute** — The Safety Warden enforces food safety temperatures and allergen warnings that NO calibration can override
- **Heritage panels are pedagogical** — Lisp teaches homoiconicity (code as data), Pascal teaches structured thinking, Fortran teaches scientific computing heritage
- **Progressive disclosure manages tokens** — Summary (<3K) always loaded, Active (<12K) on demand, Deep (50K+) on explicit request
- **Cooking as proof of concept** — Everyone cooks; everyone understands getting better with a partner. The cooking department proves the entire architecture with something tangible and universal
- **Fox food** — The system builds itself: cooking department is built using Rosetta Core and College Structure, proving the architecture by using it

## Architecture At a Glance

```
User: "My cookies came out flat"
  ↓
Rosetta Core → identifies: baking science concepts
  ↓
Panel Router → selects: natural language + optional Python (baker's math)
  ↓
Calibration Engine:
  OBSERVE: flat, thin cookies
  COMPARE: expected chewy, thick
  ADJUST: reduce butter ratio (-10%), chill dough (30min)
         [science: fat viscosity at temperature, gluten development]
  RECORD: user preference saved for next session
  ↓
Safety Warden: ✓ no safety concerns (oven temp within safe range)
  ↓
Response: calibrated advice, grounded in food science,
          adapted to this user's equipment and history
```

## The Three Pillars

| Pillar | What It Is | What It Proves |
|--------|-----------|---------------|
| **Rosetta Core** | Multi-language, multi-domain concept translation engine | One concept, many expressions — the engine that IS skill-creator |
| **College Structure** | Knowledge organized as explorable code departments | Code IS curriculum — exploring source code teaches the subject |
| **Calibration Engine** | Universal Observe→Compare→Adjust→Record feedback loop | Everything improves over time — same pattern from ovens to compilers |

---

*"The user sees a friendly colleague. The engine sees math."*
