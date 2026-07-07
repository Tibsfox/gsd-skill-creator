# Upstream Reference — open-gsd/gsd-core surface (captured 2026-07-06)

**Purpose:** A current (July 2026) snapshot of the upstream **@opengsd/gsd-core** project
surface, captured from the `next` branch, so a downstream agent can diff **gsd-skill-creator**
(the adaptive-learning layer that *extends* gsd-core) against it. This is a **capture-only**
stage — no findings, no recommendations. Every item below was fetched from
`github.com/open-gsd/gsd-core@next` (GitHub raw + contents API) or the package manifest.

> Reminder for the downstream diff agent: gsd-skill-creator ≠ gsd-core. gsd-core is the
> upstream phase-loop PM engine (`/gsd:*` commands, gsd-* agents, phase artifacts). Our tool
> adds the learning/skill/agent/team/chipset/cartridge authoring layer on top and re-vends
> a filtered/renamed slice of gsd-core commands via `project-claude/`. Anything below is
> **upstream**, not ours.

---

## 0. Identity & version

| Field | Value |
|-------|-------|
| Package | `@opengsd/gsd-core` |
| Version (`next` branch `package.json`) | **1.7.0-rc.3** |
| Description | "GSD Core is a meta-prompting, context engineering, and spec-driven development system for AI coding agents." |
| License | MIT |
| `type` | (ESM; ships `.cjs`/`.cts` interop) |
| `main` | `.opencode/plugins/gsd-core.js` |
| Engines | `node >=22.0.0`, `npm >=10.0.0` |
| Runtime deps | `@anthropic-ai/claude-agent-sdk ^0.2.84`, `ws ^8.21.0` (very lean) |
| Dev deps of note | `@stryker-mutator/core ^9.6.1` (mutation testing), `fast-check ^4.8.0` (property tests), `typescript ^6.0.3`, `eslint 9`, `c8`, `js-yaml`, custom `eslint-rules/` + `eslint-plugin-no-only-tests` |

**Bin surface (4 executables):**
- `gsd-core` → `bin/install.js` (the installer)
- `gsd-tools` → `gsd-core/bin/gsd-tools.cjs` (the deterministic CLI — see §7)
- `gsd_run` → `gsd-core/bin/gsd_run`
- `gsd-mcp-server` → `bin/gsd-mcp-server.js` (MCP server entry)

**Install / bootstrap:** `npx @opengsd/gsd-core@latest`, then `/gsd-new-project` (greenfield)
or `/gsd-onboard` (brownfield). Ships a Claude Code plugin (`.claude-plugin/`) and an
OpenCode plugin (`.opencode/plugins/gsd-core.js`).

**Supported host runtimes (16):** claude, codex, cursor, cline, opencode, windsurf, trae,
copilot, hermes, kilo, augment, qwen, kimi, zcode, codebuddy, antigravity. (See §6 matrix.)

---

## 1. The phase loop (architecture)

Five-step repeating cycle per milestone, each step running in **fresh-context subagents**
to fight context degradation while keeping the main session lean:

1. **Discuss** — capture implementation decisions
2. **Plan** — research + decompose work into wave-parallel plans
3. **Execute** — run plans in parallel waves in clean ~200k-token contexts
4. **Verify** — test + diagnose before completion
5. **Ship** — create PR, archive phase

State/memory is carried between sessions by structured artifacts: **STATE.md**, **CONTEXT.md**,
ROADMAP.md, PLAN.md, SUMMARY.md, VERIFICATION.md, UAT.md, plus `.planning/config.json`.

---

## 2. Command set — `commands/gsd/*` (71 commands)

Exact file stems on `next` (each `<name>.md` → invoked as `/gsd-<name>` or `/gsd:<name>`):

```
add-tests            ai-integration-phase  audit-fix            audit-milestone
audit-uat            autonomous            capture              cleanup
code-review          complete-milestone    config               debug
discuss-phase        docs-update           eval-review          execute-phase
explore              extract-learnings     fast                 forensics
graphify             health                help                 import
inbox                ingest-docs           manager              map-codebase
mempalace-capture    mempalace-recall      milestone-summary    mvp-phase
new-milestone        new-project           next                 ns-context
ns-ideate            ns-manage             ns-project           ns-review
ns-workflow          onboard               pause-work           phase
plan-phase           plan-review-convergence  pr-branch         profile-user
progress             quick                 resume-work          review-backlog
review               secure-phase          settings             ship
sketch               spec-phase            spike                stats
surface              thread                ui-phase             ui-review
ultraplan-phase      undo                  update               validate-phase
verify-work          workspace             workstreams
```

**Delta vs. what our tool re-vends** (for the downstream diff — not yet a finding):
Commands present upstream that are **NOT** in the skill list our repo surfaces include
**`mempalace-capture`, `mempalace-recall`, `next`**. The `ns-*` namespace routers, `surface`,
`ultraplan-phase`, `workspace`, `workstreams`, `thread`, `graphify` are all present in both.
Our SKILL list also carries GSD skills upstream lacks a command for (e.g. `gsd-dev-preferences`,
`gsd-ns-*` are present both sides). Downstream agent should treat this table as the canonical
upstream command inventory when computing drift.

---

## 3. Agent types — `agents/*` (34 agents)

```
gsd-advisor-researcher    gsd-ai-researcher         gsd-assumptions-analyzer
gsd-code-fixer            gsd-code-reviewer         gsd-codebase-mapper
gsd-debug-session-manager gsd-debugger              gsd-doc-classifier
gsd-doc-synthesizer       gsd-doc-verifier          gsd-doc-writer
gsd-domain-researcher     gsd-eval-auditor          gsd-eval-planner
gsd-executor             gsd-framework-selector     gsd-integration-checker
gsd-intel-updater        gsd-mempalace-curator      gsd-nyquist-auditor
gsd-pattern-mapper       gsd-phase-researcher       gsd-plan-checker
gsd-planner              gsd-project-researcher     gsd-research-synthesizer
gsd-roadmapper           gsd-security-auditor       gsd-ui-auditor
gsd-ui-checker           gsd-ui-researcher          gsd-user-profiler
gsd-verifier
```

Note: `resolve-model` in gsd-tools recognizes a **12-agent** model-resolution roster
(planner, executor, phase-researcher, project-researcher, research-synthesizer, verifier,
plan-checker, integration-checker, roadmapper, debugger, codebase-mapper, nyquist-auditor).
Other agents (ui-*, doc-*, eval-*, mempalace-curator, intel-updater, code-*, framework-selector,
user-profiler, advisor-researcher, ai-researcher, assumptions-analyzer, domain-researcher,
pattern-mapper, security-auditor, debug-session-manager) resolve via profile/tier convention.

---

## 4. Skills — `skills/*` (71 skill dirs)

One skill directory per command (naming `gsd-<command>`), 1:1 with §2 (71 each). This is
the "commands are skills" model: each `commands/gsd/<x>.md` has a companion
`skills/gsd-<x>/SKILL.md`. Includes `gsd-mempalace-capture`, `gsd-mempalace-recall`,
`gsd-next`, and the six `gsd-ns-*` namespace routers.

---

## 5. Hooks — `hooks/*`

Deterministic hook scripts + registry (mix of `.js`, `.sh`, `.cjs`):

```
gsd-check-update-worker.js   gsd-check-update.js        gsd-config-reload.js
gsd-context-monitor.js       gsd-cursor-post-tool.js    gsd-cursor-session-start.js
gsd-ensure-canonical-path.js gsd-graphify-update.sh     gsd-phase-boundary.sh
gsd-prompt-guard.js          gsd-read-guard.js          gsd-read-injection-scanner.js
gsd-session-state.sh         gsd-statusline.js          gsd-update-banner.js
gsd-validate-commit.sh       gsd-workflow-guard.js      gsd-worktree-path-guard.js
hooks.json                   managed-hooks-registry.cjs lib/ (subdir)
```

Key ones for downstream comparison: `gsd-validate-commit.sh` (commit-convention gate),
`gsd-workflow-guard.js` (phase-flow guard), `gsd-read-injection-scanner.js` +
`gsd-read-guard.js` + `gsd-prompt-guard.js` (prompt-injection / read-injection defense),
`gsd-context-monitor.js` (context-window meter), `gsd-worktree-path-guard.js` +
`gsd-ensure-canonical-path.js` (worktree/path safety), `gsd-phase-boundary.sh`
(phase-boundary state), `managed-hooks-registry.cjs` + `hooks.json` (declarative hook
registry). Host-specific: `gsd-cursor-*` hooks for Cursor.

---

## 6. Capabilities — `capabilities/*` (the extension/plugin substrate)

**This is the most important surface for a downstream extender.** gsd-core is organized as a
capability registry: 35 capability folders, split into **feature** capabilities and
**runtime** capabilities.

### 6a. Capability manifest format (`docs/reference/capability-manifest.md`)
- Each capability lives at `capabilities/<id>/capability.json` (exactly one manifest; `id`
  must equal the folder name in **kebab-case**). Overlay roots for third-party:
  `~/.gsd/capabilities/<id>/` (global) or `.gsd/capabilities/<id>/` (project).
- Schema-validated JSON. **Envelope (mandatory):** `id`, `role`, `version`, `title`,
  `description`, `tier`, `requires`. **Optional:** `engines` (incl. `engines.gsd` semver
  range), `runtimeCompat`, `author`, `license`, `keywords`, …
- `role` is the discriminator: **`"feature"`** or **`"runtime"`**.
  - **Feature** body declares: owned **skills**/**agents** (globally-unique stem ids),
    **steps** (loop-extension units ordered by `produces`/`consumes`), **contributions**
    (prompt fragments injected into agent roles at named points), **gates** (conditional
    blockers), **hooks** (lifecycle callbacks; script paths confined to `[A-Za-z0-9._/-]`),
    and federated **config keys** (each capability contributes keys absent from central schema).
  - **Runtime** body describes how GSD projects artifacts onto a host CLI via the **8-axis
    vocabulary** (see §6d).
- **Build-time invariants:** acyclic `requires`, **tier-monotonicity** (a `core` capability
  cannot require `standard`/`full`), config-key exclusivity, path confinement, host `engines.gsd`
  satisfaction. **Reserved id prefixes blocked for third-party:** `gsd-`, `gsd-core-`, `anthropic-`.

### 6b. Feature capabilities (19; tiers `full`/`standard`)
Full (17): `ai-integration`, `assumption-delta`, `audit`, `claude-orchestration`,
`code-review`, `drift`, `external-job`, `graphify`, `intel`, `mempalace`, `nyquist`,
`pattern-mapper`, `profile-pipeline`, `schema-gate`, `security`, `tdd`, `ui`.
Standard (2): `gap-analysis`, `research`.

### 6c. Runtime capabilities (16; tier `core`)
`antigravity`, `augment`, `claude`, `cline`, `codebuddy`, `codex`, `copilot`, `cursor`,
`hermes`, `kilo`, `kimi`, `opencode`, `qwen`, `trae`, `windsurf`, `zcode`.

(The `capabilities/` folder listing on disk also shows sub-dirs matching these ids plus
per-domain feature dirs: ai-integration, antigravity, assumption-delta, audit, augment,
claude-orchestration, claude, cline, code-review, codebuddy, codex, copilot, cursor, drift,
external-job, gap-analysis, graphify, hermes, intel, kilo, kimi, mempalace, nyquist, opencode,
pattern-mapper, profile-pipeline, qwen, research, schema-gate, security, tdd, trae, ui,
windsurf, zcode.)

### 6d. `capability` CLI / `gsd capability` command (third-party registration path)
Subcommands: **`install`** (resolves a source spec → versioned bundle, verifies SHA/integrity,
discloses executable surfaces — hooks/command-modules/MCP servers — obtains consent, needs
`--yes` for executable capabilities; `--scope global|project`, `--integrity sha512-<hash>`,
`--shared-file`), **`update`** (atomic stage-then-swap; `--all`; registry sources not yet
updatable), **`remove`** (deletes ledger-listed files, strips marker-isolated fragments;
first-party cannot be removed; `--purge-data`), **`list`** (JSON: first-party + overlays,
`status` active/incompatible/inactive + scope), **`outdated`** (remote peeks; pinned sources
never outdated), **`disable`/`enable`** (first-party only; aliases of `set --off`/`--on`),
**`set`** (writes activation `--on`/`--off` + `--gate <key>=<bool>`, validated against declared
config keys; rejects third-party), **`trust list`** / **`trust revoke`** (consent records at
`$GSD_HOME/.gsd/consent.json`).

**Source specs:** Git URL (`...#v1.2.0`, `#sha:<commit>` pin), `npm:@org/pkg@^1.0.0`
(installed `--ignore-scripts`), tarball URL, local path, `name@registry` (reserved / not yet
implemented).
**Install layout / ledger:** global `$GSD_HOME/.gsd/capabilities/<id>/` (ledger
`$GSD_HOME/.gsd-capabilities.json`); project `<root>/.gsd/capabilities/<id>/` (ledger
`<root>/.gsd-capabilities.json`). Ledger records version, source, integrity hash, owned files,
shared-file edits; reconciliation sweeps clean crash orphans.
**Trust model:** project-scope overlays require a machine-local **consent record**
(`~/.gsd/consent.json`) to activate — a forged in-repo ledger activates nothing.
`capabilities.strict_known_registries` (project config) gates permitted source forms.
Note the `gsd-tools` variant: `capability state` and `capability set <id> [--on|--off]
[--gate k=bool] [--config-dir] [--runtime] [--scope global|project] [--raw]`.

---

## 7. CLI tool surface — `gsd-tools` (`gsd-core/bin/gsd-tools.cjs`)

Invocation: `node gsd-tools.cjs <command> [args] [--raw] [--cwd <path>] [--ws <name>]`.
Global flags: `--raw` (machine output), `--cwd` (override working dir for sandboxed subagents),
`--ws <name>` (workstream context → `.planning/workstreams/<name>`). Large payloads (>~50KB)
spill to a temp file and return an `@file:/tmp/gsd-init-XXXXX.json` pointer. API keys are
**masked** (`****<last-4>`) in output but stored plaintext in `.planning/config.json`. ~20
domain lib modules under `gsd-core/bin/lib/`.

Command families (exact subcommands):
- **state** — `load`, `json`, `update <field> <value>`, `get [section]`, `patch --f v …`,
  `advance-plan`, `record-metric`, `update-progress`, `add-decision`, `add-blocker`,
  `resolve-blocker`, `record-session`, `begin-phase`, `signal-waiting`, `signal-resume`;
  plus `state-snapshot` (full structured parse).
- **smart-entry** — `[--json]` (read-only route recommender).
- **phase** — `find-phase`, `phase next-decimal`, `phase add`, `phase insert`, `phase remove`,
  `phase complete`, `phase uat-passed [--require-verification]`, `phase-plan-index`,
  `phases list [--type planned|executed|all] [--phase N] [--include-archived]`.
- **roadmap** — `get-phase`, `analyze`, `update-plan-progress <N>`.
- **config** — `config-ensure-section`, `config-set <key> <value>`, `config-get <key>`,
  `config-set-model-profile <profile>`.
- **capability** — `state`, `set` (see §6d).
- **query** — `teams-status [--active]`, `eval.score --covered --total --infra …`.
- **resolve-model** — `resolve-model <agent-name>` (12-agent roster).
- **verify** — `verify-summary`, `verify plan-structure`, `verify phase-completeness`,
  `verify references`, `verify commits`, `verify artifacts`, `verify key-links`.
- **validate** — `validate consistency`, `validate health [--repair]`, `validate context [--json]`.
- **template** — `template select <type>`, `template fill <type> …` (types: summary/plan/verification).
- **frontmatter** — `get`, `set`, `merge`, `validate --schema plan|summary|verification`.
- **scaffold** — `context`, `uat`, `verification`, `phase-dir`.
- **init** (compound context loaders) — `execute-phase`, `plan-phase`, `new-project`,
  `new-milestone`, `onboard [--fast][--text]`, `quick`, `resume`, `verify-work`, `phase-op`,
  `todos`, `milestone-op`, `map-codebase`, `progress`.
- **milestone / requirements** — `milestone complete <version> [--name][--no-archive-phases]`,
  `requirements mark-complete <ids>`.
- **agent-skills** — `agent-skills <agent-type> [--json]` (emit XML/JSON skill block).
- **skill-manifest** — `[--output <path>]` (generate skill manifest cache).
- **utility** — `generate-slug`, `current-timestamp`, `list-todos`, `list-seeds`,
  `verify-path-exists`, `history-digest`, `summary-extract`, `stats`, `progress`,
  `todo complete`, `audit-uat`, `audit-open`, `from-gsd2 [--path][--force][--dry-run]`,
  `commit <msg> [--files][--amend][--no-verify][--respect-staged]`,
  `websearch <query> [--limit][--freshness]`.
- **worktree** — `base-check`, `set-baseref`, `record-agent …`.
- **graphify** — `build`, `query <term>`, `status`, `diff`, `snapshot [name]`.

Capability resolution composes install profile (`.gsd-profile`), runtime surface
(`.gsd-surface.json`), and config gates (`.planning/config.json` `workflow.*`) → per-capability
`enabled`/`active` state.

---

## 8. Config file format — `.planning/config.json`

Created by `/gsd-new-project`, edited via `/gsd-settings` / `/gsd-config` or
`gsd-tools config-set`. Key namespaces (exact keys):

- **Execution:** `mode` (`interactive`|`yolo`), `granularity` (`coarse`|`standard`|`fine`).
- **Model:** `model_profile` (`quality`|`balanced`|`budget`|`adaptive`|`inherit`),
  `model_overrides.<agent>`, `models.<phase_type>`, `dynamic_routing` (+`tier_models`),
  `effort` (`minimal`…`max`), `fast_mode`.
- **Planning/context:** `planning.commit_docs` (def true), `planning.search_gitignored`
  (def false), `planning.sub_repos[]`, `context`, `context_window` (def 200000).
- **Workflow toggles (absent = enabled pattern):** `workflow.research`, `workflow.plan_check`,
  `workflow.verifier`, `workflow.auto_advance` (def false), `workflow.ui_phase`,
  `workflow.node_repair`, `workflow.code_review`, `workflow.tdd_mode` (def false),
  `workflow.use_worktrees` (def true), `workflow.skip_discuss` (def false),
  `workflow.text_mode` (def false), `workflow.security_enforcement` (def true),
  `workflow.post_planning_gaps` (def true), `workflow.security_asvs_level` (1–3),
  `workflow.security_block_on`.
- **Search/external:** `brave_search`, `firecrawl`, `exa_search`, `tavily_search`,
  `ref_search`, `perplexity`, `jina` (accept `true`/`false`/`null` or an API-key string).
- **Git:** `git.branching_strategy` (`none`|`phase`|`milestone`), `git.base_branch` (def main),
  `git.create_tag` (def true), `git.phase_branch_template`.
- **Code quality:** `code_quality.fallow.enabled`, `.scope` (`phase`|`repo`),
  `.profile` (`minimal`|`standard`|`strict`).
- **Security:** `security.injection_blocking` (def false).
- **Features:** `features.thinking_partner`, `features.global_learnings`, `intel.enabled`,
  `graphify.enabled`, `mempalace.enabled`.
- **Agent skills injection:** `agent_skills` (skill files mapped by agent type),
  `agent_skills_security.trusted_global_roots` (allowlist for symlinked global skills).
- **Review:** `review.models.<cli>`, `review.default_reviewers`, `review.reviewer_instances`,
  `review.max_prompt_tokens`.
- **Gates/safety:** `gates.*` (confirm-project/phases/roadmap/plan…),
  `safety.always_confirm_destructive` (def true), `safety.always_confirm_external_services`
  (def true).
- **Parallelization:** `parallelization.enabled` (def true), `.plan_level` (def true),
  `.max_concurrent_agents` (def 3), `.min_plans_for_parallel` (def 2).
- **Capabilities:** `capabilities.strict_known_registries`, `capabilities.auto_update` (def false).
- **Misc:** `plan_review.source_grounding` (def true), `ship.pr_body_sections`,
  `hooks.context_warnings` (def true), `statusline.context_position` (`end`|`front`).

Other runtime state files referenced: `.gsd-profile` (install profile), `.gsd-surface.json`
(runtime surface), `.gsd-capabilities.json` (capability ledger), `$GSD_HOME/.gsd/consent.json`
(third-party consent), STATE.md / CONTEXT.md (session memory).

---

## 9. Host-integration interface (ADR-1239) — the formal extension contract

Published SDK surface: **`src/host-integration-sdk.cts`**. A versioned handshake lets external
hosts embed GSD orchestration. Rule: every declared axis value must come from the host's
authoritative docs; unknown → `undocumented` sentinel → engine **fail-closed** degradation.

- **`PROTOCOL_VERSION`** — positive integer governing the negotiated capability set.
- **8 negotiated axes:** `embeddingMode` (imperative|declarative), `commandSurface`
  (slash-file|slash-programmatic|slash-toml|palette|prose-only), `dispatch` (struct:
  namedDispatch, nested, maxDepth, background, subagentToolkit, backgroundDispatch),
  `modelMode` (active|passive), `hookBus` (host|engine|none), `stateIO`
  (filesystem|sandboxed-storage|session-log-append), `transport` (mcp|native-extension),
  `runtime` (node|bun|sandboxed-web|python|go|rust|electron|other).
- **Functions:** `profileOf(axes)` → programmatic-cli|declarative-cli|ide|null;
  `negotiateHostCapabilities()`; `handleHandshakeRequest()`/`buildHandshakeRequest()`
  (JSON-safe wire forms); `degradationFor(point, axes)` over six points
  (command, dispatch, model, hooks, state, artifact);
  `hookEventSurfaceFor(hookEvents)` (dialects: claude, gemini, opencode-subset);
  `shouldFlattenDispatch()`.
- **5 engine adapters** `{ kind, runtime, install, uninstall }`: `createDeclarativeAdapter`,
  `createImperativeAdapter`, `createModelAdapter`, `createHookBus`, `createStateIO`. All
  fail-closed; install/uninstall delegate to `installRuntimeArtifacts` (byte-identical,
  golden-install-parity tested).
- **3 reference profiles:** programmatic-cli, declarative-cli, ide.

### 9a. Host capability matrix highlights (16 hosts)
- Runtimes: Node (claude, codex, cursor, cline, opencode, augment, qwen, copilot, kilo, trae),
  Python (hermes, kimi), Bun (opencode, kilo), Go (antigravity), Electron (zcode); copilot
  CLI + windsurf undocumented.
- Embedding: imperative = claude, opencode, cursor, cline, hermes, kilo, kimi, trae;
  declarative = codex, augment, codebuddy, copilot, zcode, windsurf, antigravity.
- Command surface: all `slash-file` except hermes (`slash-programmatic`).
- Model control: active = hermes, opencode, cline, kilo; passive = all others.
- Dispatch nesting maxDepth examples: claude 5, codex 1(config), cursor 2, cline 1, kilo -1
  (permission-gated), qwen/kimi/codebuddy/copilot 1; several undocumented.
- Transport: **MCP universal across all 16 hosts.**

---

## 10. Documentation / reference map (`docs/`)

Top-level docs: AGENTS.md, ARCHITECTURE.md, BETA.md, CANARY.md, CLI-TOOLS.md, COMMANDS.md,
CONFIGURATION.md, FEATURES.md, INVENTORY.md (+ INVENTORY-MANIFEST.json), USER-GUIDE.md,
TESTING-SUITES.md, VERSIONING.md, branch-protection.md, branching.md, context-monitor.md,
installer-migrations.md, issue-driven-orchestration.md, json-errors.md,
ship-pr-body-sections.md, workflow-discuss-mode.md.
Subdirs: `adr/`, `agents/`, `contributing/`, `design/`, `discussions/`, `explanation/`,
`how-to/`, `prd/`, `proposals/`, `reference/`, `research/`, `security/`, `skills/`,
`superpowers/`, `tutorials/`, plus localized docs (ja-JP, ko-KR, pt-BR, zh-CN).
`docs/reference/` (the machine-contract docs): capability-manifest.md, capability-matrix.md,
context-md.md, gate-predicates.md, gsd-capability-command.md, host-integration-capability-matrix.md,
host-integration-interface.md, long-running-operations.md, plan-md.md, planning-artifacts.md,
review-verification-capabilities.md, skill-mapping-matrix.md, state-md.md.

Repo top-level of note beyond the above: `bin/`, `src/`, `tests/`, `scripts/`, `eslint-rules/`,
`assets/`, `pi/`, `vscode/`, `.claude-plugin/`, `.opencode/`, `.githooks/`, `.changeset/`
(Changesets release flow; version currently in RC).

---

## 11. Documented integration / extension points for external tools like ours

For the downstream diff, the seams gsd-core officially exposes to an extender are:
1. **Capability overlays** (§6) — the *first-class* extension mechanism: drop a
   `capability.json` (`role: feature`) declaring skills/agents/steps/contributions/gates/hooks
   + federated config keys, install via `gsd capability install <source>` at project/global
   scope with a consent + integrity/trust model. Reserved prefixes `gsd-`/`gsd-core-`/`anthropic-`.
2. **Host-integration SDK** (§9, `src/host-integration-sdk.cts`) — for embedding the engine in
   a new host runtime via the 8-axis handshake + 5 adapters.
3. **`agent_skills` config injection** (§8) — map custom skill files per agent type, gated by
   `agent_skills_security.trusted_global_roots`.
4. **`gsd-tools` CLI** (§7) — the deterministic, `--raw`/JSON-emitting programmatic surface a
   wrapper can shell out to (state, phase, config, capability, verify, init, graphify, …).
5. **Hook registry** (§5, `managed-hooks-registry.cjs` + `hooks.json`) — declarative host hooks.
6. **MCP server** (`gsd-mcp-server`) + universal MCP transport (§9a) — resource/tool exposure.
7. **Changesets/versioning** (`VERSIONING.md`, `.changeset/`) — `PROTOCOL_VERSION` and
   `engines.gsd` semver are the compatibility handles a downstream tool should pin against.

---

## Notes for the downstream diff agent
- Version to pin against for July 2026: **@opengsd/gsd-core 1.7.0-rc.3** on `next`. It is in
  **release-candidate**, so the surface can still move before 1.7.0 final — recheck
  `package.json` version + `.changeset/` before treating any single item as stable.
- The **canonical extension path is capabilities** (`capability.json`), not ad-hoc file drops.
  If our tool currently extends gsd-core by copying/renaming command+agent files through
  `project-claude/` rather than by shipping a `role:feature` capability overlay, that is the
  single biggest architectural divergence to evaluate downstream (capture-only here — no
  finding raised).
- 71 commands / 34 agents / 71 skills / 35 capabilities / 4 bins / 18 hook scripts is the
  upstream headcount to diff our re-vended slice against.
- Reserved id prefixes (`gsd-`, `gsd-core-`, `anthropic-`) are blocked for third-party
  capabilities — relevant if our tool ever publishes an overlay.
