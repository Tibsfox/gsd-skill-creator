# Cartridge Forge

The forge that makes cartridges. Dogfoods the unified Cartridge + Chipset
model by shipping as a cartridge itself.

**Category:** B (no college chipset — this is a tool, not a discipline).
**Trust:** system.

## What you get

- **6 skills** covering the full cartridge lifecycle: scaffold, validate,
  eval, fork, migrate, distill.
- **5 agents** (3 opus + 2 sonnet) organized as a router-topology
  department with `forge-architect` as capcom.
- **3 teams** for common flows: design, migration, review.
- **5 Grove record types** for persistent lineage: ForgeBuildSession,
  CartridgeDecision, ValidationOutcome, ForkLineage, MigrationRecord.
- **27 benchmark cases** for trigger accuracy (target >=85%).

## Load it

```
skill-creator cartridge load examples/cartridges/cartridge-forge/cartridge.yaml
skill-creator cartridge validate examples/cartridges/cartridge-forge/cartridge.yaml
skill-creator cartridge eval examples/cartridges/cartridge-forge/cartridge.yaml
```

## Files

```
cartridge-forge/
  cartridge.yaml                  -- top-level cartridge
  chipsets/
    department.yaml               -- 6 skills, 5 agents, 3 teams
    grove.yaml                    -- 5 record types
    metrics.yaml                  -- activation tracking + benchmark config
    evaluation.yaml               -- pre_deploy gates + benchmark thresholds
  skills/                         -- 6 skill prompts
  agents/                         -- 5 agent prompts
  teams/                          -- 3 team specs
  benchmarks/
    trigger-accuracy.yaml         -- 27 trigger-accuracy test cases
```

## Dogfood contract

The forge must eval itself successfully. `skill-creator cartridge eval`
against `cartridge.yaml` must return zero failures before this cartridge
is considered shippable. The self-eval test at
`src/cartridge/__tests__/dogfood.test.ts` enforces this as a CI gate.
