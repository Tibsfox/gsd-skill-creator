# Agent Teams — Dormant Disposition (D2)

**Status:** dormant on the dev line, paused pending a team-execution runtime.
**Decided:** 2026-06-03 (audit decision-gate **D2**), executed v1.49.971 (2026-06-04).
**Source:** `.planning/IMPLEMENTATION-PLAN-2026-06-03.md` § "Decision-gate resolutions" → D2.

## What "dormant" means here

The agent-teams primitive can **create, validate, inspect, and manage** team
configs, but it has **no execution runtime** on the dev line:

- There is no `team run` / `team execute` verb. `team spawn` is a **readiness
  checker** — it resolves member agents and reports found/missing; it does not
  launch anything.
- `TeamCreate` / `TeammateTool` / `SendMessage` are harness-side MCP tools, not
  source code on any branch (including the parked v1.50 fork) — so there is no
  in-repo path from "team config" to "running agents."
- The multi-agent coordination the project actually uses (GSD wave-parallel
  `execute-phase`, and the `Workflow`/`Agent` fan-out) is **plain subagent
  dispatch in the workflows**, not the team primitive.

This is a **pause, not a retirement.** The CLI is validated, tested code and the
team schema is a real, reusable contract. It is preserved intact for a future
runtime; nothing is deleted.

## What still works (unchanged)

The validated CLI surface stays fully supported:

```bash
skill-creator team create     # author a new team config (interactive wizard)
skill-creator team list       # list discovered teams
skill-creator team validate   # schema / topology / tool-overlap / role checks
skill-creator team estimate   # cost / token estimate for a team config
skill-creator team status     # status of a team config
skill-creator team spawn      # readiness CHECK only (see note below)
```

## What changed at v1.49.971

1. **The 4 demo teams are no longer installed.** Their `project-claude/manifest.json`
   standalone install entries were removed and the `project-claude/teams/` source
   directory was deleted, so a fresh `node project-claude/install.cjs` no longer
   populates `.claude/teams/` with teams that look runnable but have no runtime.
   The teams remain as **reference examples** in the (de-hardcoded, v1.49.970)
   `examples/teams/` catalog:
   - `examples/teams/code/code-review-team/`
   - `examples/teams/migration/doc-generation-team/`
   - `examples/teams/migration/gsd-research-team/`
   - `examples/teams/ops/gsd-debug-team/`
   Each carries a "dormant — reference only" banner.
2. **`team spawn` no longer scaffolds agent files.** The interactive
   `offerInteractiveFix` path (which wrote stub agent `.md` files directly into
   `.claude/agents/` via `fs.writeFileSync`, bypassing the Write/Edit self-mod
   guard) was removed. `team spawn` now validates and **reports** missing member
   agents only — it never writes. This closes a self-modification foot-gun: an
   unsolicited write triggered by what is documented as a readiness *check*.

### Note on `team create` scaffolding (intentionally left)

`team create` (the `team-wizard`) can still scaffold member agent files, because
that is an **explicit, solicited** user action (the user is creating a team and
its agents on purpose) — distinct from `team spawn`, where the write was an
unsolicited side effect of a check. The D2 scope (per the settled decision and
scope-discipline lesson #10409) is the `team spawn` foot-gun specifically. If a
future ship hardens `team create` too, do it deliberately as its own change.

## Resume condition (generic — not version-pinned)

Revisit this disposition when a **team-execution runtime** lands — e.g. a
`team run` / dispatch verb that maps a team config onto the `Workflow`/`Agent`
fan-out primitive, or a harness-native team runner. At that point: re-enable the
demo-team installs (restore the `manifest.json` entries from this commit), unify
the two team schema dialects (simple `name/role/tools/model` vs. rich
`leadAgentId` + members), and resolve the unresolved member `agentId`s the audit
flagged (`gsd-debug-team` 4/4, `gsd-research-team` 4/5).

The resume trigger is deliberately **capability-based, not v1.50-specific** — a
team runtime could arrive on the dev line independently of the parked v1.50 fork.

## Review gate

**Retire-or-resume review by 2027-06-04** (≈1 year). If no team-execution
runtime has landed and the demo teams have not been revived by then, downgrade
this from "paused pending a runtime" to a retirement decision (delete the CLI
surface or fold it into examples-only). This dated gate exists so the dormancy
does not silently calcify the way the `upstream` / `upstream-intelligence`
allowlist entries did (allowlisted v787, still pending ~180 ships later).

## Enforcement

The dormancy invariants are pinned by `tests/integration/agent-teams-dormant.test.ts`:
- `project-claude/manifest.json` installs zero teams into `.claude/teams/`.
- `project-claude/teams/` no longer ships the 4 demo team sources.
- `team-spawn.ts` neither imports `writeTeamAgentFiles` nor defines
  `offerInteractiveFix` (the scaffold path is gone).
- The 4 `examples/teams/` demo READMEs carry the dormancy banner.
