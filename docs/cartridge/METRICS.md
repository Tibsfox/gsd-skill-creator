# Metrics

*What `skill-creator cartridge metrics` reports and how to read it.*

Metrics are **static** (computed from the cartridge file, not from runtime
usage). They describe the shape of a cartridge, not its quality.

## JSON Shape

```bash
skill-creator cartridge metrics path/to/cartridge.yaml --json
```

Emits:

```jsonc
{
  "id": "foo-department",
  "name": "Foo Department",
  "version": "1.0.0",
  "chipsetCount": 4,
  "chipsetKinds": ["college", "department", "evaluation", "grove"],
  "skillCount": 12,
  "agentCount": 5,
  "teamCount": 2,
  "groveRecordTypeCount": 5
}
```

## Field Meanings

| Field                  | Source                                        |
|------------------------|-----------------------------------------------|
| `id` / `name` / `version` | cartridge header                          |
| `chipsetCount`         | length of `chipsets:`                         |
| `chipsetKinds`         | unique kinds, sorted lexicographically        |
| `skillCount`           | total skills across all department chipsets   |
| `agentCount`           | total agents across all department chipsets   |
| `teamCount`            | total teams across all department chipsets    |
| `groveRecordTypeCount` | record types declared in the grove chipset    |

## Reading the Numbers

**Healthy department cartridge:** 4 chipsets (department + grove +
evaluation + college), 5+ skills, 3+ agents, 1+ teams,
4+ grove record types.

**Content-only cartridge** (e.g. Space Between): 1-2 chipsets of
`content` + maybe `grove`, 0 skills / agents / teams.

**Coprocessor cartridge:** 1-2 chipsets, 0 skills, 0 agents, 0 teams —
coprocessors expose pure functions, not orchestration surface.

**Forge cartridge:** 6 skills, 5 agents, 3 teams, 5 grove record types.

## What Metrics Don't Tell You

- **Trigger accuracy** — measured by `cartridge eval`, not `metrics`.
- **Benchmark coverage** — evaluation gate territory.
- **Dedup collisions** — reported by `cartridge dedup`.
- **Runtime activation** — that lives in the activation-metrics skill of
  the forge cartridge, not in this CLI.

Metrics are deliberately dumb. They count shape. Everything else belongs
to a different tool.

## Scripting

All metrics output is stable JSON under `--json`. Pipe into `jq` freely:

```bash
skill-creator cartridge metrics path/to/cart.yaml --json \
  | jq '.skillCount'
```

No side effects. Safe in CI.
