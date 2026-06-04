# Agent Adoption Verdicts

**Created:** v1.49.975 (Ship 2.3 of the 2026-06-03 core-functions audit plan — *"agent adoption scan + retire dormant agents"*).
**Companion observability surface:** `tools/agent-adoption-scan.mjs` + `tools/agent-adoption-scan.allowlist.json` + `docs/AGENT-ADOPTION-BASELINE.json`.

This is the **decision surface** for the agent tier — the per-agent disposition (LIVING / ALLOWLISTED-with-class / RETIRED), kept separate from the scanner's observability surface. It is the agent-tier sibling of `docs/SHELFWARE-VERDICTS.md`.

## How an agent is classified

`tools/agent-adoption-scan.mjs` enumerates the source-of-truth agents (`project-claude/agents/*.md`, 48) and greps the installed dispatch corpus (GSD workflows + templates, slash-commands, skills, teams) for whole-token mentions of each agent id:

- **living** — ≥1 scripted dispatch site (a workflow/command/skill/team file names the agent).
- **test-only** — sites exist but only in test/fixture files.
- **dormant** — zero scripted dispatch sites.

### Why "dormant" is not "retire"

On Claude Code an agent is dispatched two ways, and the scanner can only see the first:

1. **Scripted** — a file names the agent (`subagent_type="gsd-executor"`, an Agent-definitions table, a team `config.json`). This is what the scan greps.
2. **Description-dispatched** — the model invokes the agent by matching its `description` frontmatter (e.g. *"Invoke when unsure which GSD command to run"*). These agents have **no scripted site by design**.

So a zero-site result is **not** proof of dormancy. This is the agent-tier analog of the `src/` scanner's blind spot for modules consumed via dynamic `require()` / shell CLI (which is why `settings`, `initialization`, `retro` are allowlisted there). The 2026-06-03 audit plan proposed relocating `gsd-orchestrator`, `doc-linter`, `codebase-navigator`, and `changelog-generator` to `examples/` as *"frozen/vestigial"* — the Ship 2.3 recon **refuted that**: all four are description-dispatched and **load-bearing**, and relocating them would break `render-claude-md.mjs` classifyAgents (pre-tag-gate step 7), drift `INVENTORY-MANIFEST.json`, and make `install.cjs` exit 1 on the standalone manifest entries.

## Current snapshot (v1.49.975)

**48 source agents — 41 living · 0 test-only · 7 dormant.** All 7 dormant agents are allowlisted (the `--dormant-threshold 1` gate passes). There are **0 un-allowlisted dormant agents** — i.e. no genuine retire-without-disposition shelfware.

## Per-agent verdicts — the 7 dormant agents

| Agent | Class | Verdict | Basis |
|-------|-------|---------|-------|
| `gsd-orchestrator` | description-dispatched | **KEEP** | GSD master intent-router; backed by `src/orchestrator/` + the `skill-creator orchestrator` CLI; standalone manifest install. Model-invoked by description. |
| `doc-linter` | description-dispatched | **KEEP** | Model-invoked documentation-audit review subagent; `agents.json` generic-infra category member; named exception in `check-scaffolder-residue.mjs`. |
| `codebase-navigator` | description-dispatched | **KEEP** | Model-invoked read-only architecture-analysis review subagent; generic-infra category member. |
| `changelog-generator` | description-dispatched | **KEEP** | Model-invoked changelog review subagent; generic-infra category member. |
| `pipeline-reconciler` | script-twin | **KEEP** | The work runs as `tools/release-history/pipeline-reconciler.mjs` (`refresh.mjs` step `reconcile`, required). The `.md` is the spec twin; the agent is intentionally not dispatched. |
| `quality-drift-watcher` | script-twin | **KEEP** | The work runs as `tools/release-history/quality-drift-check.mjs` (`refresh.mjs` step `drift-check`, required). Spec twin; intentionally not dispatched. |
| `gsd-intel-updater` | orphan | **PARK (dated gate)** | Coherent purpose (writes `.planning/intel/`) but no consumer wires it. Parked, not retired (operator decision, Ship 2.3). **Retire-or-resume review by 2027-06-04**: if still unwired, relocate to `examples/agents/deprecated/`. |

## D1 boundary (UC-lab agents stay)

The 9 UC-lab / Observatory agents — `capcom`, `flight-ops`, `lab-director`, `watchdog`, `uc-brainstorm-engine`, `uc-perf-analyst`, `uc-proof-engineer`, `uc-retro-analyst`, `uc-skill-forger` — are **living-via-spawn-site**: they are named in the `team-control` and `uc-observatory` SKILL.md files (both installed and `project-claude/` copies). They surface as living, not dormant, and need no allowlist entry — exactly as D1 requires (*"keep fully parked, untouched … the 9 are source-of-truth + spawned"*). If a future change deletes one of those spawn sites, the agent will correctly drop to dormant and the gate will surface it.

The 3 `v1.50a-*` classroom agents (`student`/`support`/`teacher`) are **out of adoption scope**: they are local-only paused-experiment artifacts (not in `project-claude/agents/`, not git-tracked), already tracked as `is_paused` by `tools/render-claude-md/agents.json`. The scanner scopes to the source-of-truth set, so they are neither scanned nor flagged.

## Running the scan

```
node tools/agent-adoption-scan.mjs                      # markdown report
node tools/agent-adoption-scan.mjs --json               # machine-readable
node tools/agent-adoption-scan.mjs --dormant-threshold 1 # gate: non-allowlisted dormant -> exit 1
```

The committed `docs/AGENT-ADOPTION-BASELINE.json` is a point-in-time snapshot; `tests/integration/agent-adoption-allowlist-parity.test.ts` pins the invariant that **every dormant agent in the baseline is allowlisted** (no silent agent-tier shelfware) and that this verdict doc + the allowlist stay in sync.
