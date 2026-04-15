# GSD Skill Creator

The dogfood cartridge for `gsd-skill-creator` itself — the playbook
the project uses to author its own skills, agents, teams, chipsets,
and cartridges, and to operate its grove content-addressed memory
subsystem.

This cartridge is deliberately self-referential. Every capability it
describes is a capability it was built with. The cartridge that
teaches the tool how to build cartridges was built by the tool.

Slug: `gsd-skill-creator`
Trust: `system`
Template: `department`

## What is in here

- **14 skills** across six domains: authoring, validation, grove,
  testing, publishing, integration
- **5 agents** in a router topology: an Opus capcom, an Opus grove
  specialist, and three Sonnet workhorses
- **4 teams**: skill-authoring, grove-operations, cartridge-forge,
  publish-release
- **7 grove record types** capturing the durable artifacts this
  cartridge produces (authored skills/agents, forged cartridges,
  import manifests, migration logs, eval results, publish events)
- **4 pre-deploy evaluation gates** that must be green before ship

## Why grove gets top billing

Grove is the content-addressed memory subsystem at the heart of
gsd-skill-creator. Flat filesystem skills are the on-ramp; grove is
where they live after import. The cartridge gives grove five full
skills:

| Skill | What it covers |
|---|---|
| `grove-memory-import` | Filesystem → arena.json, via `tools/import-filesystem-skills.ts`, with source selection, exclusion rules (wasteland/, muses/), and dedup on unique name binding |
| `grove-record-modeling` | Designing grove record types and namespaces — the schemas durable artifacts live in |
| `grove-query-retrieval` | Single-hop lookup, `SkillView` / `SignatureView` projections, `ActivityLog` reads, and the multi-hop patterns exercised by `multi-hop-retrieval.test.ts` |
| `grove-migration` | Format-version migrations, tier classification, `SkillDiff`-driven incrementals, JSON↔ArenaSet path |
| `grove-export-snapshot` | Writing `.grove/arena.json`, serializing `SkillCodebase` projections, producing `GroveNamespace` manifests for handoff |

The `grove-keeper` agent is Opus-class on purpose — grove decisions
(record-type design, namespace layout, migration planning) are
load-bearing across the whole project and worth the reasoning budget.

## Authoring domains

- **`authoring`** — writing skills, agents, teams, chipsets, and
  cartridges from scratch. The `cartridge-forge` loop lives here.
- **`validation`** — the four forge gates (validate, eval, dedup,
  metrics) plus validation-debt bookkeeping.
- **`grove`** — everything described above.
- **`testing`** — vitest discipline for skills/cartridges, publish
  gating, `skipIf(CI)` for fixture-heavy tests.
- **`publishing`** — version sync across `package.json`, `Cargo.toml`,
  `tauri.conf.json`; release notes; the skill-creator binary (future
  `skill-center`); install wiring.
- **`integration`** — `.claude/settings.json`, hooks (PreToolUse,
  SessionStart, UserPromptSubmit), `.claude/commands/gsd/`, the
  `project-claude/install.cjs` flow, harness-integrity invariants.

## Agents

- `skill-creator-capcom` (Opus, `is_capcom: true`) — shape decisions,
  scoping, routing
- `grove-keeper` (Opus) — grove subsystem authority
- `skill-forger` (Sonnet) — writes SKILL.md / agent / team files
- `cartridge-smith` (Sonnet) — drives the forge loop and gates
- `publish-engineer` (Sonnet) — releases, version sync, harness wiring

## Teams

- `skill-authoring-team` — capcom + forger + smith for a new
  individual artifact
- `grove-operations-team` — grove-keeper + forger + capcom for any
  grove-touching work
- `cartridge-forge-team` — all five agents, for end-to-end cartridge
  forging
- `publish-release-team` — publish-engineer + smith + capcom for
  cuts and version bumps

## Forge gates

```
skill-creator cartridge validate ./cartridge.yaml --json
skill-creator cartridge eval     ./cartridge.yaml
skill-creator cartridge dedup    ./cartridge.yaml
skill-creator cartridge metrics  ./cartridge.yaml
```

All four are required green before a commit. If the installed
`skill-creator` binary predates the `cartridge` subcommand, invoke
from source:

```
npx tsx src/cli.ts cartridge <subcommand> …
```

## Where this cartridge lives

- **Source of truth:** `examples/cartridges/gsd-skill-creator/`
- **Installed location:** copied into project-local `.claude/`
  configuration by `node project-claude/install.cjs` so every
  `gsd-skill-creator` installation carries it
- **Grove binding:** registered in `tools/import-filesystem-skills.ts`
  so its skills/agents/teams land in the arena snapshot on import

The cartridge is both reference documentation and runtime
capability. It is the first cartridge any new contributor should
read, and the first cartridge that breaks should any core authoring
surface regress.

## Provenance

Forged via the `cartridge-forge` skill from the `department` template
on 2026-04-14. Research grounded in:

- `docs/cartridge/FORGING-GUIDE.md`
- `docs/cartridge/CARTRIDGE-SPEC.md`
- `docs/GROVE-FORMAT.md`
- `src/cartridge/types.ts`
- `src/memory/grove-format.ts`
