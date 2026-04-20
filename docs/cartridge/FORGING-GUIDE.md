# Forging Guide

*From seed idea to shipped cartridge, using the `skill-creator cartridge`
CLI.*

This walkthrough takes a topic (physics), scaffolds a department cartridge
for it, iterates, validates, and forks.

## 1. Scaffold

```bash
skill-creator cartridge scaffold department ./my-cartridges/physics physics-department
```

This creates `./my-cartridges/physics/` with:

- `cartridge.yaml` — cartridge header + chipset list
- `chipsets/department.yaml` — one starter skill + one starter agent
- `chipsets/grove.yaml` — default record types
- `chipsets/evaluation.yaml` — schema + affinity + domain gates
- `skills/placeholder-skill.md`
- `agents/placeholder-agent.md`

Every scaffolded cartridge round-trips through `load` → `validate` with
zero errors out of the box.

### Available templates

| Template | What it produces |
|---|---|
| `department` | Skills + agents + teams for a topical domain + a grove + evaluation chipset. Most common template. |
| `content` | Deep-map + story arc + voice. Used for essays and vocabulary bundles. |
| `coprocessor` | Pure-function tooling chipset (math-coprocessor pattern). |
| `graphics` | `kind: graphics` rendering pipeline — WebGL 2 + GLSL ES 3.00 by default, plus two scaffolded shader files under `shaders/`. See `examples/cartridges/gfx-reference/` for the fleshed-out reference. |

### Graphics recipe

```bash
skill-creator cartridge scaffold graphics ./my-cartridges/my-gfx my-gfx
```

Produces a 4-file skeleton:

- `cartridge.yaml` — `kind: graphics`, `api: webgl2`, `api_version: "2.0"`,
  `shader_language: glsl-es`, `shader_language_version: "3.00"`, two
  shader stages wired to the scaffolded files.
- `README.md` — per-API variant recipes (WebGL 2 default, OpenGL 4.6,
  Vulkan 1.4, OpenGL ES 3.2) and pointers to the GFX research series.
- `shaders/basic.vert.glsl` — GLSL ES 3.00 vertex shader.
- `shaders/basic.frag.glsl` — GLSL ES 3.00 fragment shader with a UV
  gradient.

Validate + eval pass immediately: the `all_graphics_sources_declare_stage`
gate confirms both source files reference stages listed in
`shader_stages[]`.

## 2. Load

```bash
skill-creator cartridge load ./my-cartridges/physics/cartridge.yaml
```

Prints id, version, trust, and chipset kinds. Add `--json` for
machine-readable output.

## 3. Validate

```bash
skill-creator cartridge validate ./my-cartridges/physics/cartridge.yaml --json
```

Exit code `0` = valid, `1` = validation failure, `2` = usage error. JSON
output carries `{valid, errors[], warnings[]}`.

## 4. Metrics

```bash
skill-creator cartridge metrics ./my-cartridges/physics/cartridge.yaml
```

Prints chipset count, kind list, skill/agent/team counts, grove record
type count. `--json` for scripts.

## 5. Eval

```bash
skill-creator cartridge eval ./my-cartridges/physics/cartridge.yaml
```

Runs the evaluation chipset's gates (schema validity, affinity
completeness, domain coverage, benchmark trigger accuracy). Exit code `0`
if no gates fail, `1` otherwise.

## 6. Dedup

```bash
skill-creator cartridge dedup ./my-cartridges/physics/cartridge.yaml
```

Reports unique skill/agent counts and any key collisions across chipsets.
A cartridge with `collisions: []` is structurally clean.

## 7. Fork

```bash
skill-creator cartridge fork \
  ./my-cartridges/physics/cartridge.yaml \
  physics-advanced \
  --out ./my-cartridges/physics-advanced.yaml
```

Produces a new cartridge with `id: physics-advanced` and
`provenance.forkOf: physics-department`. The original is untouched.

## Iteration Loop

The forge is designed for tight loops:

```
scaffold → edit skills/agents → validate → eval → dedup → commit
```

Every command in the loop is idempotent, JSON-capable, and composes with
shell pipelines. `eval` is the gate: if it exits non-zero, the cartridge
is not ready to ship.

## Help

```bash
skill-creator cartridge --help
```

Lists all seven subcommands. Use on its own or as a refresher mid-session.
