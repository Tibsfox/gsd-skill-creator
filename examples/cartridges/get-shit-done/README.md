# get-shit-done

The core GSD (Get Shit Done) cartridge. Covers the full project-management
surface area of GSD — roadmaps, milestones, phases, the
research→plan→execute→verify loop, backlog and todo grooming, debugging,
UI cycle, session handoff, and shipping — plus the grove
content-addressed memory subsystem that makes every artifact durable and
replayable across sessions.

Ships **both** as an in-tree example under `examples/cartridges/` **and**
as a core cartridge that installs into every gsd-skill-creator harness
via `project-claude/manifest.json`. Any project that runs
`node project-claude/install.cjs` picks up `.claude/cartridges/get-shit-done/`
on day one.

## Shape

- **15 skills** — project-roadmapping, milestone-management,
  phase-planning, phase-discussion, phase-research, phase-execution,
  phase-verification, backlog-and-todos, debugging-and-forensics,
  ui-phase-workflow, codebase-mapping, **grove-memory-operations**,
  session-handoff, ship-and-release, user-and-project-profile.
- **7 agents** — gsd-capcom (Opus capcom), gsd-roadmapper,
  gsd-planner, gsd-phase-researcher, gsd-executor (Sonnet),
  gsd-verifier, gsd-debugger.
- **5 teams** — gsd-project-bootstrap-team, gsd-phase-cycle-team,
  gsd-debug-session-team, gsd-milestone-closeout-team,
  gsd-grove-memory-team.
- **13 grove record types** — ProjectRoadmap, MilestoneRecord,
  PhasePlan, PhaseResearch, PhaseAssumptions, ExecutionWave,
  VerificationResult, DebugSession, BacklogEntry, SessionReport,
  UIReview, CodebaseIntelSnapshot, GroveActivityLog.
- **3 chipsets** — `department`, `grove`, `evaluation`.

## Why grove is the centerpiece

GSD is not just a set of commands — it's a pipeline that produces
durable artifacts (plans, research, assumptions, waves, verifications,
debug sessions). Grove is where those artifacts live between sessions.
Every skill in this cartridge writes into the grove namespace
`get-shit-done`, and every record is content-addressed so:

1. **Replay** — a phase can be reconstructed by walking the
   `GroveActivityLog` and rehydrating `PhasePlan` → `PhaseResearch` →
   `PhaseAssumptions` → `ExecutionWave*` → `VerificationResult`.
2. **Multi-hop retrieval** — the verifier can pull the `PhasePlan`
   a given wave was executing against via a single content hash, even
   after the plan file has moved or been renamed on disk.
3. **Cross-cartridge linking** — other cartridges (sysadmin,
   software-engineering, etc.) can reference a `VerificationResult`
   from this namespace by hash without importing the whole pipeline.
4. **Session handoff** — when a session pauses, the next session
   doesn't re-read the conversation. It reads the latest
   `SessionReport` out of grove and walks the linked records to
   reconstruct context.
5. **Activity-log integrity** — every record creation, link, export,
   and migration is signed and appended to `GroveActivityLog`, so
   arbitrary "rewind this project to state X" operations are
   possible without mutating the underlying records.

The `grove-memory-operations` skill is the single owner of the
grove surface — import, export, query, diff, signature verification,
activity-log replay, namespace queries, and arena-snapshot migration.
Every other skill in the cartridge defers to it for persistence.

## Load + validate

```
skill-creator cartridge validate ./cartridge.yaml
skill-creator cartridge eval ./cartridge.yaml
skill-creator cartridge dedup ./cartridge.yaml
skill-creator cartridge metrics ./cartridge.yaml
```

All four gates are green as of the forge commit.

## How it integrates with gsd-skill-creator install

`project-claude/manifest.json` lists this cartridge under
`files.cartridges`, and `project-claude/install.cjs` copies it to
`.claude/cartridges/get-shit-done/` on install and checks for its
`cartridge.yaml` during the post-install verification pass.

## Forged via

`cartridge-forge` skill, `department` template, gates run in this
order: scaffold → fill → scaffold-companions → validate → eval →
dedup → metrics.
