# v1.4 — Agent Teams

**Released:** 2026-02-05
**Scope:** multi-agent team coordination — team schema, topology rules, validation pipeline, CLI surface, GSD templates, and the `.claude/teams/` storage layer as the composition tier above individual skills and agents
**Branch:** dev → main
**Tag:** v1.4 (2026-02-05T20:43:08-08:00) — "Agent Teams"
**Predecessor:** v1.3 — Documentation Overhaul
**Successor:** v1.5 — Pattern Discovery
**Classification:** milestone — team coordination tier on top of the v1.0 loop
**Phases:** 10-29 (bundled via `Merge dev: v1.1-v1.4`) · **Teams-specific phases:** 24-29 (6 phases) · **Plans:** 18 · **Requirements:** 22
**Commits:** `86e241177..5a2f2d3d8` (96 commits in `v1.2..v1.4`, 88 non-merge) — 44 of them are team-scoped (`feat|test|docs(2[4-9]-*)`)
**Files changed:** 50 files (`v1.2..v1.4`) · **Insertions:** 20,600 · **Deletions:** 41
**Verification:** per-component `.test.ts` coverage for TeamStore, TeamAgentGenerator, team-validator, team-wizard, templates, gsd-templates, team-validate CLI · semantic validation + topology rules + agent resolution + cycle detection + tool overlap + skill conflicts + role coherence · non-interactive wizard tests · v1.1/v1.2 feature parity audit

## Summary

**v1.4 is the composition tier on top of the v1.0 loop.** v1.0 defined the 6-step Observe → Detect → Suggest → Apply → Learn → Compose cycle and shipped skill inheritance with cycle checks; v1.1 added semantic conflict detection and activation scoring around the Apply step; v1.2 added the test / simulate / calibrate stack that turned skill quality into a measurement; v1.3 paid down the documentation debt that accumulated across v1.0-v1.2. Neither of the four earlier releases shipped a way to say _these skills and agents work together as a unit_. v1.4 closes that gap. Six phases (24, 25, 26, 27, 28, 29) built the full team infrastructure: team types + Zod schemas (24), the TeamStore + TeamAgentGenerator + creation wizard (25), a five-stage validator covering semantic rules + topology + agent resolution + cycle detection + tool overlap + skill conflicts + role coherence (26), the five-command CLI surface `team create / list / validate / spawn / status` (27), the GSD research + debugging team template generators (28), and the user-facing documentation that ties teams back into the existing GSD workflow (29). The tag-message summary calls it "Agent Teams" and the six-phase structure is exactly what shipped.

**Three topologies — leader-worker, pipeline, swarm — cover the coordination design space without over-committing.** The topology field on `TeamConfig` is the load-bearing type decision of v1.4. `leader-worker` assigns one lead member and N workers; the lead receives the task, delegates subtasks, and synthesizes. `pipeline` orders members into sequential stages, with each stage consuming the previous stage's output. `swarm` lets members collaborate without a fixed lead, suitable for brainstorm-style problems where the answer emerges from parallel exploration. Later versions (v1.9 adds router and map-reduce) grow the set, but the three shipped at v1.4 cover the coordination shapes that actually recur in practice: directed work (leader-worker), sequential transformation (pipeline), and emergent collaboration (swarm). Shipping three topologies rather than one (which would under-commit) or six (which would over-commit before observation data exists) is a v1.0-style bounded-scope design decision applied to multi-agent composition.

**Team validation is a five-stage pipeline, not a single schema check.** Phase 26 built `validateTeamFull` as an orchestrator that composes independent validators: semantic validation + topology rules (26.1), agent resolution + cycle detection + tool overlap (26.2), skill conflict detection + role coherence (26.3), and a final integration orchestrator (26.4). Each validator has its own test file (`team-validator.test.ts` in `src/teams/`, `team-validation.test.ts` in `src/validation/`, and the test-driven commits at `35ab77ea4`, `c1cb07e31`, `64142cc40`, `1502c02e1`). Failure modes surface at creation time rather than at spawn time, which keeps runtime blast radius small — a team with incompatible capabilities or a circular leader-worker graph fails `team validate` before it ever gets to `team spawn`. Severity grouping (error / warning / info) in the CLI output means non-fatal issues like tool-overlap redundancy can ship while fatal issues like cycle detection cannot.

**The `.claude/teams/` storage layer mirrors the v1.0 skill/agent pattern, so every existing tool keeps working.** v1.0 put skills at `.claude/skills/` and agents at `.claude/agents/`. v1.4 adds `.claude/teams/{teamName}/config.json` at project scope and `~/.claude/teams/{teamName}/config.json` at user scope — the same two-scope pattern v1.0 established for skills, with the same precedence rules. The `TeamStore` class at `src/teams/team-store.ts` follows the `SkillStore` design: create, read, update, delete, list, with path safety checks via `validateSafeName` and `assertSafePath` to prevent traversal. Agent files that a team references continue to live in `.claude/agents/` at project scope; a known Claude Code bug (GitHub #11205) means user-level agents may not always be discovered, and `getAgentsBasePath()` pins agent storage to project scope to sidestep the issue. Teams are a new type in the schema but not a new place on disk — they share the `.claude/` root with skills and agents.

**The team-creation wizard ships interactive and non-interactive modes from day one.** Phase 25.3 built `teamCreationWizard` as an `@clack/prompts` session that walks the user through topology selection, member assignment, and capability declaration. The same entry point also exports `nonInteractiveCreate`, which takes flags (name, pattern) and produces the config without any prompts. `skill-creator team create --name foo --pattern leader-worker` is the CI path; `skill-creator team create` is the author path. This mirrors v1.2's `test generate` / `calibrate --preview` split and v1.1's LLM-optional / heuristic-always design: every author-facing workflow has a scriptable equivalent, and no workflow forces interactive input into CI. The wizard test suite (`test(25-03): add non-interactive wizard tests`, commit `125bdb853`) exercises the scriptable path exhaustively so CI never stalls on a prompt the user cannot answer.

**Two GSD templates — research and debugging — ship as reference team patterns.** Phase 28 built the template generators that produce ready-to-use team configs for the two workflows that recur most in the GSD loop. `createResearchTeam()` returns a leader-worker team with one synthesizer lead (`gsd-research-synthesizer`) and four dimension-specific researchers (`gsd-researcher-stack`, `gsd-researcher-features`, `gsd-researcher-architecture`, `gsd-researcher-pitfalls`). `createDebuggingTeam()` returns a leader-worker team with one debug lead (`gsd-debug-lead`) and three adversarial investigators (`gsd-debugger-alpha`, `gsd-debugger-beta`, `gsd-debugger-gamma`). Both templates are pure functions with no I/O — they return `TemplateResult` objects that compose cleanly with the standard generator from `templates.ts`. The `GSD_RESEARCH_AGENT_IDS` and `GSD_DEBUG_AGENT_IDS` const arrays freeze the agent namespace so later work can reference them by name rather than by position. The templates are the first team configs the ecosystem will see, which makes them load-bearing pedagogy as well as runtime artifacts.

**The tag bundled v1.1, v1.2, v1.3, and v1.4 into a single merge, and the release-notes boundary reflects that.** The merge commit at `080ff90fa` is titled `Merge dev: v1.1-v1.4 (Agent Teams, CLI, Calibration, Simulation, Templates)` and lands every feature from phases 10 through 29 into main in one step. The `v1.2..v1.4` range contains 96 commits (88 non-merge) across 50 files and 20,600 insertions — but 44 of those commits are in the team-scoped phase groups (`2[4-9]-*`) and another 44 are in the phases-10-through-23 groups that shipped alongside. The release-history engine treats v1.4 as the "agent teams" line of the v1.1-v1.4 bundled release; the v1.1, v1.2, and v1.3 release notes cover the conflict detection, testing, and documentation slices of the same bundle. Reading v1.4's scope without that context understates what shipped; reading it with the context shows that v1.4 is the headline feature of a four-version merge-to-main, not a narrow patch.

**Documentation in Phase 29 ties teams back into the GSD workflow so the feature is reachable, not just present.** Phase 29 shipped eight documentation commits: CLI docs and cheat sheet (`c5f1df24b`), Teams Module documentation + public exports list (`4cd2df4c3` + `b6bb012d4`), architecture updates to `README.md` and `storage.md` (`ac35fc934`) and `layers.md` (`82bfb7abd`), an end-to-end creation tutorial (`96bf3f9ec`), GETTING-STARTED.md + WORKFLOWS.md + TROUBLESHOOTING.md updates (`150316035`, `9c358a038`, `ec09e46e6`), a new Skills-vs-Agents-vs-Teams comparison guide (`ae2412f61`), and the main README update that announces v1.4 (`521e2b2d6`). A user who reads GETTING-STARTED.md, clicks through to the comparison guide, then lands on the tutorial can create a working team without touching the source tree. This is the v1.3 discipline carried forward: every shipped feature ships with the documentation path that makes it discoverable.

## Key Features

| Component | What Shipped |
|-----------|--------------|
| Team types (`src/types/team.ts`) | `TeamConfig`, `TeamMember`, `TeamTask` type definitions with topology enum (leader-worker \| pipeline \| swarm) and tool catalog constants (Phase 24.1) |
| Team validation schemas (`src/validation/team-validation.ts`) | Zod schemas for team config, member, task, and topology validation; test suite at `team-validation.test.ts` (Phase 24.2) |
| TeamStore (`src/teams/team-store.ts`) | Scope-aware (project / user) config CRUD at `.claude/teams/{name}/config.json` and `~/.claude/teams/{name}/config.json` with path-traversal safety checks (Phase 25.2) |
| TeamAgentGenerator (`src/teams/team-agent-generator.ts`) | Generates `.claude/agents/*.md` files for team members, pinned to project scope due to Claude Code bug #11205 (Phase 25.2) |
| Standard templates (`src/teams/templates.ts`) | Template generators for the three topologies (leader-worker, pipeline, swarm) with `LEADER_TOOLS` and `WORKER_TOOLS` tool constants (Phase 25.1) |
| Team creation wizard (`src/teams/team-wizard.ts`) | `teamCreationWizard` interactive `@clack/prompts` session plus `nonInteractiveCreate` scriptable entry point (Phase 25.3) |
| Semantic validation + topology rules (`src/teams/team-validator.ts`) | Topology-specific rules: leader-worker requires exactly one lead, pipeline requires ordered stages, swarm allows any member count (Phase 26.1) |
| Agent resolution + cycle detection + tool overlap | Each team member's referenced agent must exist on disk; leader-worker graphs must be acyclic; tool overlap surfaces redundant grants as warnings (Phase 26.2) |
| Skill conflict detection + role coherence | Cross-member skill inheritance is checked for conflicts (reuses v1.1's ConflictDetector); role strings are validated against topology expectations (Phase 26.3) |
| `validateTeamFull` orchestrator | Single entry point composing all five validation stages with severity-grouped output (error / warning / info) (Phase 26.4) |
| `team create` CLI (`src/cli/commands/team-create.ts`) | Interactive wizard fallback + flag-driven (`--name`, `--pattern`) non-interactive path (Phase 27.1) |
| `team list` CLI (`src/cli/commands/team-list.ts`) | Multi-scope discovery listing project-scoped and user-scoped teams with scope prefix (Phase 27.1) |
| `team validate` CLI (`src/cli/commands/team-validate.ts`) | Severity-grouped report from `validateTeamFull` with exit-1-on-error for CI (Phase 27.2) |
| `team spawn` CLI (`src/cli/commands/team-spawn.ts`) | Readiness check + actionable fix suggestions before attempting to run the team (Phase 27.3) |
| `team status` CLI (`src/cli/commands/team-status.ts`) | Config display + validation summary + member resolution status (Phase 27.3) |
| `team` / `tm` namespace dispatch in CLI router | Both long and short names route to the same command set with help text integration (`src/cli.ts`, Phase 27.4) |
| GSD research team template (`src/teams/gsd-templates.ts`) | `createResearchTeam` — synthesizer lead + 4 dimension-specific researchers (stack / features / architecture / pitfalls) (Phase 28.1) |
| GSD debugging team template | `createDebuggingTeam` — coordinator lead + 3 adversarial investigators (alpha / beta / gamma) (Phase 28.1) |
| GSD Teams conversion guide (`docs/GSD-TEAMS.md`) | Walkthrough for migrating ad-hoc GSD workflows onto the team API (Phase 28.2) |
| Teams module documentation (`docs/API.md`, `docs/architecture/layers.md`, `docs/architecture/storage.md`) | Full public-API docs + layer documentation + storage format documentation for the teams module (Phase 29.1 - 29.3) |
| End-to-end team creation tutorial (`docs/tutorials/team-creation.md`) | Hands-on walkthrough from `team create` through `team spawn` (Phase 29.4) |
| GETTING-STARTED / WORKFLOWS / TROUBLESHOOTING updates | Team references in the entry-point docs and a new Team Issues section in TROUBLESHOOTING.md (Phase 29.5 - 29.6) |

## Retrospective

### What Worked

- **Three topologies cover the coordination design space without over-committing.** Leader-worker for directed work, pipeline for sequential stages, swarm for emergent collaboration. Later versions (v1.9) add router and map-reduce, but the three shipped at v1.4 cover the shapes that actually recur in practice, and the enum is open for extension without breaking existing teams.
- **Team schema reuses the v1.0 YAML-frontmatter pattern.** Skills, agents, and teams all live under `.claude/` with the same two-scope (project / user) precedence rules. Every tool that already walked `.claude/skills/` needed minimal change to also walk `.claude/teams/`. Adding a new composition tier did not require a new storage primitive.
- **Validation pipeline is five independent validators composed by a single orchestrator.** Semantic rules + topology rules + agent resolution + cycle detection + tool overlap + skill conflicts + role coherence each ship as standalone functions with standalone tests. `validateTeamFull` composes them and returns a severity-grouped report; test-driven commits landed each validator incrementally (`35ab77ea4`, `c1cb07e31`, `64142cc40`, `1502c02e1`) rather than as one monolithic pass.
- **Interactive and non-interactive wizards ship together.** `teamCreationWizard` for authors and `nonInteractiveCreate` for CI come out of the same entry point and the non-interactive path has its own test file (`team-wizard.test.ts` plus the dedicated non-interactive test commit at `125bdb853`). No team-creation workflow forces a prompt into a script.
- **GSD templates ship as reference patterns, not abstractions.** `createResearchTeam` and `createDebuggingTeam` are concrete team configs for the two workflows the GSD loop sees most often. Every later team the ecosystem builds can start from a template rather than from an empty `TeamConfig`, which keeps the grain size uniform.
- **CLI namespace supports both `team` and `tm`.** The dispatcher (`6b40dcf60`) wires both names at the same cost and the help output reflects both. Users who typed `tm` from muscle memory (the git-style two-letter habit) get the same commands as users who typed the full word.
- **44 team-specific commits out of 96 in the `v1.2..v1.4` range.** The team scope is roughly half of what shipped between v1.2 and v1.4; the other half is the phases-10-through-23 content (conflict detection + testing + calibration + docs) that shipped in the same merge. The separation between team-scoped work and adjacent work is visible from `git log` alone.

### What Could Be Better

- **GSD workflow templates for team-based execution are speculative at this point.** Without real team usage data, the research and debugging templates are designed from first principles rather than observed patterns. The v1.0 Learn step hasn't had time to generate the evidence that would inform template design, so the two templates may need revision once real teams produce real patterns.
- **The v1.1-v1.4 merge-to-main bundle obscures what v1.4 alone shipped.** The `080ff90fa` merge commit bundles phases 10-29 into a single merge; v1.4's tag points at a merge of main into main (`5a2f2d3d8`). Anyone trying to read just v1.4 by tag has to walk back through the merge graph to find the team-scoped commits specifically. Later releases tightened the per-version merge discipline, but v1.4 inherits a blurry boundary.
- **Team validation depends on agent files existing on disk at validation time.** The agent-resolution stage of `validateTeamFull` reads `.claude/agents/` directly. A team config that references an agent which will be created later fails validation with no way to distinguish "typo" from "pending generation." A future release should add a `--deferred` flag or a dry-run resolution mode.
- **No cross-scope resolution for team members.** A project-scoped team cannot reference a user-scoped agent even though skills already support cross-scope precedence. The `TeamAgentGenerator` pins agent output to project scope (due to Claude Code bug #11205) but team _members_ still cannot transparently resolve across scopes. A future release will unify the scope-resolution path that skills and teams share.
- **Tool overlap surfaces as a warning, not a deduplication action.** When two team members grant the same tool, the validator flags it but does not propose the config rewrite. A later version could offer `team validate --fix` that deduplicates overlapping tool grants automatically, the same way the v1.1 `RewriteSuggester` proposes skill-level rewrites.
- **The LLM-optional path from v1.1 / v1.2 does not yet extend to team creation.** The wizard is pure `@clack/prompts`; there is no `team create --llm` that proposes a topology and members from a natural-language description. The design space is there (v1.1's dynamic-import pattern, v1.2's LLMTestGenerator) but the team surface does not yet use it.

## Lessons Learned

1. **Member capability declarations are the contract surface for team composition.** Without explicit capabilities on every `TeamMember`, the system would have to infer capabilities from skill content, which is fragile. The capability list is the canonical hand-off between the author (who knows what each member should do) and the validator (which has to check that the team is well-formed). This lesson was flagged as applied in v1.8's Capability-Aware Planning, which operationalizes member capabilities for role matching in planning.
2. **CLI lifecycle operations establish teams as first-class entities.** `team create`, `team list`, `team validate`, `team spawn`, and `team status` give teams the same lifecycle surface skills and agents have had since v1.0. Teams are not just configuration files — they have creation, validation, and execution semantics, which means they can be tested, versioned, and evolved like any other first-class artifact.
3. **Validate at creation time, not at runtime.** A team with incompatible member capabilities or circular leader-worker dependencies should fail `team validate` the moment it is written, not crash the first time `team spawn` runs. The `validateTeamFull` orchestrator is the gate that keeps runtime blast radius small; any validator that only fires at spawn time is a validator that lets broken teams ship.
4. **Compose validators; do not fuse them.** Five independent validators (semantic + topology, agent resolution + cycle + tool overlap, skill conflict + role coherence) compose into `validateTeamFull` cleanly because each one takes the same input type and returns the same result type. Fusing them into a single pass would save a few function calls and lose all of the test isolation. The v1.2 lesson ("F1 chooses the operating point; MCC verifies the model") applies here too: each validator answers one question, and the orchestrator aggregates.
5. **Three topologies is the right v1.4 number.** One topology under-commits (it forces every team to look the same). Six topologies over-commits (speculation ahead of observation data). Three topologies — directed, sequential, emergent — cover the shapes that actually recur. Every subsequent version that adds a topology (v1.9 adds router and map-reduce) is adding to the three, not replacing them.
6. **Leader-worker + pipeline + swarm map cleanly to existing software patterns.** Leader-worker is the foreman pattern (one planner, N executors). Pipeline is the Unix pipe (stdin → stage → stage → stdout). Swarm is the map-reduce without a reducer (parallel explorers, merge-by-convention). Mapping new concepts to shapes the reader already knows is the v1.3 documentation discipline applied to type design: if the name evokes the shape, the docs write themselves.
7. **Storage layout is a compatibility constraint, not a design detail.** Putting teams at `.claude/teams/` rather than a new root (`.claude-teams/`, `.skills/teams/`) keeps every existing `.claude/` walker working. Every tool that listed skills or agents now also lists teams for free. The five-word decision ("reuse `.claude/` as the root") saved the ecosystem a migration that would have rippled through every integration.
8. **Templates are pedagogy as much as runtime.** `createResearchTeam` and `createDebuggingTeam` are the first team configs the ecosystem sees. If they are well-shaped, every subsequent team mimics their shape; if they are ad-hoc, every subsequent team is ad-hoc. Shipping both GSD templates at v1.4 (rather than "we'll add templates in v1.5") means the team format has canonical examples from day one.
9. **Bundle merges lose per-version release-note resolution.** The `v1.1-v1.4` bundled merge means v1.4's tag does not give a clean `v1.3..v1.4` delta — the range is polluted with v1.1, v1.2, and v1.3 work. Later releases moved to per-version merges so the release-history corpus stays auditable. The lesson is small (the merge strategy) and the impact is real (every release-history scorer has to special-case v1.4).
10. **Claude Code bug #11205 is a storage-pinning event.** User-level agents in `~/.claude/agents/` may not always be discovered by Claude Code. v1.4 responded by pinning `getAgentsBasePath()` to project scope in `TeamAgentGenerator`, documenting the workaround in CHANGELOG's Known Issues section (`ec1180fef`), and noting it in TROUBLESHOOTING.md. When an upstream bug changes the feasible design space, the release notes should name the bug and record the workaround so later releases can retire it cleanly.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.0](../v1.0/) | Foundation — 6-step Observe → Detect → Suggest → Apply → Learn → Compose loop; v1.4's Compose step is now backed by the teams tier |
| [v1.1](../v1.1/) | Semantic Conflict Detection — v1.4's skill conflict validator reuses v1.1's ConflictDetector at the team level |
| [v1.2](../v1.2/) | Test Infrastructure — bundled into the same merge as v1.4 (phases 14-18 in the `v1.2..v1.4` range) |
| [v1.3](../v1.3/) | Documentation Overhaul — bundled into the same merge as v1.4; v1.4's Phase 29 continues the documentation discipline v1.3 established |
| [v1.5](../v1.5/) | Successor — Pattern Discovery; deepens the Observe → Detect pipeline that would inform future team templates |
| [v1.7](../v1.7/) | GSD Master Orchestration Agent — orchestrator sits on top of the teams tier v1.4 shipped |
| [v1.8](../v1.8/) | Capability-Aware Planning — operationalizes team-member capability declarations for role matching; lesson #1 applied here |
| [v1.9](../v1.9/) | Ecosystem Alignment & Advanced Orchestration — adds router and map-reduce topologies to the v1.4 triad |
| [v1.25](../v1.25/) | Ecosystem Integration — 20-node dependency DAG includes the teams module as a load-bearing node |
| [v1.32](../v1.32/) | Brainstorm Session Support — 8 specialized agents and 5 pathways built on the teams substrate |
| [v1.33](../v1.33/) | GSD OpenStack Cloud Platform — 3 crew configurations (31 agents) delivered as teams |
| [v1.49](../v1.49/) | Mega-release — teams API still load-bearing; research and debugging templates still shipped |
| `src/teams/` | TeamStore, TeamAgentGenerator, team-wizard, team-validator, templates, gsd-templates and their tests |
| `src/cli/commands/team-*.ts` | team-create / team-list / team-validate / team-spawn / team-status CLI handlers |
| `src/validation/team-validation.ts` + `.test.ts` | Zod schemas for team config, member, task, topology |
| `src/types/team.ts` | `TeamConfig`, `TeamMember`, `TeamTask`, topology enum, tool catalog |
| `.claude/teams/` and `~/.claude/teams/` | Team storage paths at project and user scope |
| `docs/GSD-TEAMS.md` | GSD Teams conversion guide |
| `docs/tutorials/team-creation.md` | End-to-end team creation tutorial |
| `docs/COMPARISON.md` | Skills vs Agents vs Teams comparison guide |
| `docs/architecture/layers.md` + `storage.md` | Architecture docs updated with teams module and storage format |
| GitHub issue #11205 | Claude Code user-agent discovery bug; workaround documented in `getAgentsBasePath()` |
| `.planning/MILESTONES.md` | Canonical v1.4 milestone detail |

## Engine Position

v1.4 is the composition tier in the v1.x line. v1.0 defined the 6-step loop and shipped skill inheritance with cycle checks at the skill level. v1.1 layered conflict detection and activation scoring around the Apply step. v1.2 layered testing and calibration around the same Apply step. v1.3 paid down the documentation debt from v1.0-v1.2. v1.4 opened a new tier entirely: teams — configurations of skills and agents that coordinate toward a shared task. Every release from v1.7 (GSD Master Orchestration Agent) through v1.9 (router and map-reduce topologies) through v1.33 (OpenStack crew configurations with 31 agents) through v1.49 (which still uses the team API for multi-agent workflows) sits on top of the tier v1.4 shipped. The `.claude/teams/` directory is still the canonical team storage path at v1.49. The three topologies have been extended (v1.9 added two more) but not replaced. The `validateTeamFull` orchestrator still gates every team-creation workflow in the ecosystem. In the v1.x line, v1.4 is the release where the system stopped being a collection of skills and started being a way to compose coordinated workflows — and every subsequent multi-agent release inherits the composition tier.

## Files

- `src/types/team.ts` — `TeamConfig`, `TeamMember`, `TeamTask`, topology enum, tool constants (Phase 24.1)
- `src/validation/team-validation.ts` + `.test.ts` — Zod schemas for team config, member, task, topology (Phase 24.2)
- `src/teams/team-store.ts` + `.test.ts` — scope-aware config CRUD at `.claude/teams/{name}/config.json` with path-traversal safety (Phase 25.2)
- `src/teams/team-agent-generator.ts` + `.test.ts` — generates `.claude/agents/*.md` files for team members, project-scope pinned due to bug #11205 (Phase 25.2)
- `src/teams/templates.ts` + `.test.ts` — template generators for leader-worker / pipeline / swarm with `LEADER_TOOLS` / `WORKER_TOOLS` tool constants (Phase 25.1)
- `src/teams/team-wizard.ts` + `.test.ts` — `teamCreationWizard` interactive flow + `nonInteractiveCreate` scriptable entry point (Phase 25.3)
- `src/teams/team-validator.ts` + `.test.ts` — five-stage validator (semantic + topology, agent resolution, cycle detection, tool overlap, skill conflicts, role coherence) with `validateTeamFull` orchestrator (Phase 26.1 - 26.4)
- `src/teams/gsd-templates.ts` + `.test.ts` — `createResearchTeam` (synthesizer + 4 researchers) and `createDebuggingTeam` (lead + 3 investigators) generators with frozen `GSD_RESEARCH_AGENT_IDS` / `GSD_DEBUG_AGENT_IDS` arrays (Phase 28.1)
- `src/teams/index.ts` — teams module barrel export (Phase 25.4)
- `src/cli/commands/team-create.ts` — interactive + flag-driven team creation CLI (Phase 27.1)
- `src/cli/commands/team-list.ts` — multi-scope team discovery CLI (Phase 27.1)
- `src/cli/commands/team-validate.ts` + `.test.ts` — severity-grouped validation CLI with CI exit codes (Phase 27.2)
- `src/cli/commands/team-spawn.ts` — readiness-check team execution CLI with actionable fix suggestions (Phase 27.3)
- `src/cli/commands/team-status.ts` — team config + validation summary CLI (Phase 27.3)
- `src/cli.ts` — `team` / `tm` namespace dispatch and help text (Phase 27.4)
- `docs/GSD-TEAMS.md` — GSD Teams conversion guide (Phase 28.2)
- `docs/tutorials/team-creation.md` — end-to-end team creation tutorial (Phase 29.4)
- `docs/COMPARISON.md` — Skills vs Agents vs Teams comparison guide (Phase 29.5)
- `docs/API.md`, `docs/CLI.md`, `docs/architecture/layers.md`, `docs/architecture/storage.md` — teams module documentation (Phase 29.1 - 29.3)
- `docs/GETTING-STARTED.md`, `docs/WORKFLOWS.md`, `docs/TROUBLESHOOTING.md` — team references added to entry-point docs and Team Issues troubleshooting section (Phase 29.5 - 29.6)
- `CHANGELOG.md` — v1.1.0, v1.2.0, Unreleased sections with Migration Guide + Known Issues (bug #11205) (Phase 19.2 - 19.3)
- `.planning/MILESTONES.md` — canonical v1.4 milestone detail

---

_v1.4 shipped 2026-02-05 as the Agent Teams milestone on top of the v1.0 loop, bundled into the `v1.1-v1.4` merge-to-main at `080ff90fa`. Team-scoped phases 24-29 delivered types, storage, validation, CLI, GSD templates, and documentation; 44 of the 96 commits in the `v1.2..v1.4` range carry the team scope. Three topologies (leader-worker, pipeline, swarm) covered the coordination design space at v1.4; later versions extended the set without replacing it. Tag message: "Agent Teams." The composition tier installed by v1.4 remains load-bearing at v1.49._
