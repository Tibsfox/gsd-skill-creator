# Packs

Self-contained knowledge and content packs. Each pack is a bundle of
skills, agents, curriculum, tests, and supporting material that can be
installed or referenced as a unit.

## Available Packs

| Pack | Location | Description |
|------|----------|-------------|
| heritage-skills | `packs/heritage-skills/` | Cultural heritage, oral history, canonical works, safety wardens, badge engine. 6 skills, 5 agents, 4 evaluation gates, tradition-aware routing. |
| electronics | `packs/electronics/` (pending move from `src/electronics-pack/`) | Electronics engineering with circuit simulation, schematic capture, component libraries, and safety/simulator subsystems. |

## Pack Shape

A pack typically contains some or all of:

- `README.md` — pack overview and usage
- `chipset.yaml` — skill-creator chipset descriptor wiring skills, agents, gates
- `skill-*.md` / `agent-*.md` — individual skill and agent definitions
- `modules/` — runnable TypeScript / Python / Rust modules
- `tests/` — test suites (unit + integration + scenario)
- `safety/` — guardrails, policies, wardens
- `shared/` — cross-cutting types and utilities

## Packs vs. Examples vs. Chipsets

- `packs/` — runnable, self-contained bundles with their own tests
- `examples/chipsets/` — declarative chipset catalog entries (YAML + README)
- `examples/skills/`, `examples/agents/`, `examples/teams/` — individual
  library artifacts

A pack may have a parallel entry in `examples/chipsets/` that points back
to `packs/` as the runnable home.

## Navigation

- [Root README](../README.md)
- [Documentation](../docs/)
- [Examples library](../examples/)
