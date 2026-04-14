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
