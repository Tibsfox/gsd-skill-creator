# Claude Code Authoring Surface & Best Practices — Current Reference (July 2026)

**Dimension C/features, stage 1.** A snapshot of the *upstream* Claude Code
authoring surface as documented on `code.claude.com/docs` and
`platform.claude.com/docs` in July 2026, built so the sibling code-review
dimensions can measure gsd-skill-creator's `docs/OFFICIAL-FORMAT.md`, its
`skill-creator`/cartridge validators, and its generated skills/agents against
what the harness *actually* accepts today. This is a reference, not a findings
report (`findings: []`). Drift the repo should care about is called out in
**Notes → Repo-relevant drift**.

Sources are official docs unless noted. Version gates like `{v2.1.196}` are the
minimum Claude Code version a feature requires (per the doc's `min-version`
annotations).

---

## Summary

The authoring surface has consolidated and grown materially since early 2026:

- **Skills are the unifying primitive.** Custom slash **commands have merged
  into skills** — `.claude/commands/deploy.md` and
  `.claude/skills/deploy/SKILL.md` both create `/deploy`. Legacy `commands/`
  files still work; skills are the recommended form (they add a supporting-file
  directory, invocation control, forked-subagent execution, and dynamic context
  injection). Skills follow the **agentskills.io open standard**; Claude Code
  extends it.
- **Frontmatter has expanded well past name/description/allowed-tools.** New/now-documented
  fields: `when_to_use`, `disable-model-invocation`, `user-invocable`,
  `disallowed-tools`, `argument-hint`, `arguments`, `effort`, `context: fork`,
  `agent`, plus per-component `hooks`. Skill descriptions are governed by a
  **1,536-character *listing* truncation** (`description` + `when_to_use`
  combined), not a hard 1,024 validation cap.
- **Subagents** gained many fields (`skills` preload, `permissionMode`,
  `disallowedTools`, `isolation: worktree`, `memory`, `maxTurns`, `effort`,
  `background`, `color`, `mcpServers`, `hooks`). `tools`/`model` semantics are
  stable: `tools` is a comma-separated string (or omitted = inherit all);
  `model` defaults to `inherit`.
- **Hooks** are dramatically larger: ~30 events (well beyond the classic
  PreToolUse/PostToolUse/SessionStart/Stop set), 5 handler *types*
  (`command`, `http`, `mcp_tool`, `prompt`, `agent`), an `if:` permission-rule
  filter, and per-event structured decision output.
- **Plugins & marketplaces are GA.** A plugin is a directory with a
  `.claude-plugin/plugin.json` manifest bundling `skills/`, `agents/`,
  `hooks/`, `.mcp.json`, `.lsp.json`, `monitors/`, `bin/`, `settings.json`.
  Anthropic runs two public marketplaces (`claude-plugins-official`,
  `claude-community`). Plugin skills are namespaced `plugin:skill`.
- **settings.json** grew a large key surface (permissions allow/deny/ask, env,
  hooks, model, outputStyle, MCP allow/deny, `skillOverrides`,
  `disableBundledSkills`, managed-policy keys, etc.) with a 5-level precedence
  chain and workspace-trust gating on project permission grants.
- **MCP** supports stdio / HTTP (a.k.a. `streamable-http`) / SSE (deprecated) /
  ws transports, three scopes (local/project/user), and `.mcp.json` /
  `claude mcp add` / `add-json` configuration. Tools are named
  `mcp__<server>__<tool>`.

---

## 1. Agent Skills — `SKILL.md`

**Locations & precedence.** Enterprise → personal (`~/.claude/skills/`) →
project (`.claude/skills/`) → bundled. A same-named skill at a higher level
overrides a lower one and can override a **bundled** skill (e.g. a project
`code-review` replaces the built-in `/code-review`). Plugin skills use a
`plugin-name:skill-name` namespace so they never collide. A skill and a
same-named `.claude/commands/` file: the skill wins.

**Structure.** A skill is a directory `<name>/SKILL.md`. The **directory name**
becomes the invocation (`/name`), *not* the frontmatter `name` (the one
exception is a plugin-root `SKILL.md`, where frontmatter `name` sets the command
because there is no directory to take it from). Supporting files live beside
`SKILL.md` and load only when referenced — this is progressive disclosure: the
description is always in context, the body loads on invocation, and deep
reference files cost nothing until read.

**Frontmatter reference (current):**

| Field | Req | Notes |
|---|---|---|
| `name` | opt | Display label in listings. Does **not** set the command (except plugin-root). |
| `description` | recommended | What it does + when to use it. If omitted, first paragraph of the body is used. |
| `when_to_use` | no | Extra trigger phrases/examples. **Appended to `description`; both count toward the 1,536-char listing truncation.** |
| `argument-hint` | no | Autocomplete hint, e.g. `[issue-number]` or `[filename] [format]`. |
| `arguments` | no | Named-argument list; `$name` placeholders map by position. |
| `disable-model-invocation` | no | `true` = only the user can invoke (`/name`); Claude can't auto-load, it's not preloaded into subagents, and (as of v2.1.196) a scheduled task won't fire it. Default `false`. |
| `user-invocable` | no | `false` = hidden from `/` menu (Claude-only background knowledge). Default `true`. |
| `allowed-tools` | no | Pre-approves listed tools while active. **Grants, does not restrict** — other tools remain callable, permissions still apply. Accepts space- **or** comma-separated string, **or** a YAML list. |
| `disallowed-tools` | no | Removes tools from the pool while active; clears on the next user message. |
| `effort` | no | `low`/`medium`/`high`/`xhigh`/`max`; overrides session effort. |
| `context` | no | `fork` = run the skill body as a forked subagent prompt (no conversation history). |
| `agent` | no | With `context: fork`, which subagent runs it (`Explore`, `Plan`, `general-purpose`, or a custom agent). Default `general-purpose`. |
| `hooks` | no | Per-skill hooks, scoped to the skill's lifetime (see §3). |

**Invocation-control matrix (from the docs):**

| Frontmatter | User can invoke | Claude can invoke | Description in context |
|---|---|---|---|
| default | Yes | Yes | Yes (full body on invoke) |
| `disable-model-invocation: true` | Yes | No | **No** (full body loads only when user invokes) |
| `user-invocable: false` | No | Yes | Yes (full body on invoke) |

**Dynamic context injection.** A `` !`command` `` line at the start of a line
(or after whitespace) is executed and replaced with its output *before* Claude
sees the skill (e.g. `` !`git diff HEAD` ``). `!` mid-token (`KEY=!`cmd``) is
left literal.

**Placeholders in skill bodies / `allowed-tools`:** `$ARGUMENTS`, positional
`$1`/`$name`, `${CLAUDE_EFFORT}`, `${CLAUDE_SKILL_DIR}` (the skill's own dir —
use for bundled scripts), `${CLAUDE_PROJECT_DIR}` (v2.1.196+, resolves in both
body and `allowed-tools` so a `Bash(${CLAUDE_PROJECT_DIR}/scripts/lint.sh *)`
rule matches).

**Skill stacking.** Typing one skill expands it plus up to five more stacked
after it; expansion stops at the first token that isn't an inline user-invocable
skill (a `context: fork` skill or `/loop`-style arg ends the run).

**Re-invocation dedup (v2.1.202+):** re-invoking a skill whose rendered content
is identical to a copy already in context adds a short "already loaded" note
instead of a second full copy; differing renders (changed args / new dynamic
output) append again.

**`skillOverrides` setting** lets you flip a skill's visibility from
`settings.local.json` without editing its `SKILL.md` (the `/skills` menu writes
it; Space cycles states).

---

## 2. Subagents — `.claude/agents/*.md`

**Locations.** Project `.claude/agents/` (checked in; discovered by walking up
from cwd, nearest wins on `name` collisions, v2.1.178+) and user
`~/.claude/agents/`. Both scanned recursively (subfolders allowed; identity is
the `name` field only). `--add-dir` folders' `.claude/agents/` also load.
Managed subagents (admin) take precedence. Files hot-reload within seconds.

**`/agents` wizard removed (v2.1.198):** running `/agents` now just points you
to ask Claude or edit `.claude/agents/` directly. Files/fields/locations
unchanged.

**Built-in subagents:** `Explore`, `Plan`, `general-purpose`. As of v2.1.198
`Explore` inherits the session model (Claude-API-capped at Opus) rather than
always Haiku; define a user/project `Explore` with `model: haiku` to force
cheap exploration. `Explore`/`Plan` skip CLAUDE.md and git status at startup.

**Frontmatter (only `name` + `description` required):**

| Field | Notes |
|---|---|
| `name` | Identity + invocation. |
| `description` | Drives delegation. "Use proactively…" phrasing encourages auto-delegation. |
| `tools` | **Comma-separated string** (`Read, Grep, Glob`). Omitted = inherit all tools. Allowlist. |
| `disallowedTools` | Denylist, removed from inherited/specified set. |
| `model` | `sonnet`/`opus`/`haiku`/`fable`/full-id (`claude-opus-4-8`)/`inherit`. **Defaults to `inherit`.** |
| `permissionMode` | `default`/`acceptEdits`/`auto`/`dontAsk`/`bypassPermissions`/`plan` (+ `manual` alias v2.1.200+). |
| `skills` | Skills to **preload full content** into the subagent at startup (not just descriptions). It can still invoke unlisted skills via the Skill tool. |
| `mcpServers`, `hooks` | Per-agent MCP/hooks (ignored for **plugin** subagents for security). |
| `isolation: worktree` | Give the subagent an isolated worktree copy of the repo. |
| `memory`, `maxTurns`, `initialPrompt`, `effort`, `background`, `color` | Additional controls (also settable via the `--agents` JSON flag). |

The markdown **body is the subagent's system prompt** (it does *not* get the
full Claude Code system prompt — only body + basic env). Model resolution order:
`CLAUDE_CODE_SUBAGENT_MODEL` env → per-invocation param → frontmatter `model`
(then default `inherit`); all checked against org `availableModels`. As of
v2.1.198 subagents inherit the session's extended-thinking setting.

**Skills ↔ subagents (two directions):** a skill with `context: fork` becomes a
subagent's prompt; a subagent with a `skills:` field uses skills as preloaded
reference material. Subagent definitions are also reusable as **agent-team**
teammate types.

Tools unavailable to subagents regardless of `tools`: UI/session-bound ones
(e.g. `ExitPlanMode` unless `permissionMode: plan`).

---

## 3. Hooks

Configured in settings files (`~/.claude/settings.json`, `.claude/settings.json`,
`.claude/settings.local.json`, managed policy), in **plugin `hooks/hooks.json`**,
or in **skill/agent frontmatter** (scoped to component lifetime; `once: true`
supported; `Stop` auto-converts to `SubagentStop` for subagents). `/hooks`
browses active hooks. `"disableAllHooks": true` turns them off (managed policy
can't be overridden by user/project).

**Events (grouped; the classic four are a small subset now):**

- **Session:** `SessionStart` (matchers `startup`/`resume`/`clear`/`compact`),
  `Setup` (init/maintenance, CI), `SessionEnd`.
- **Per-turn:** `UserPromptSubmit`, `UserPromptExpansion`, `Stop`,
  `StopFailure`.
- **Tool execution:** `PreToolUse`, `PostToolUse`, `PostToolUseFailure`,
  `PostToolBatch`, `PermissionRequest`, `PermissionDenied`.
- **Context:** `PreCompact`, `PostCompact`, `InstructionsLoaded`.
- **Subagent/team/task:** `SubagentStart`, `SubagentStop`, `TeammateIdle`,
  `TaskCreated`, `TaskCompleted`.
- **File/env:** `FileChanged`, `CwdChanged`, `ConfigChange`.
- **Worktree:** `WorktreeCreate`, `WorktreeRemove`.
- **UI/MCP:** `Notification`, `MessageDisplay`, `Elicitation`,
  `ElicitationResult`.

**Settings schema:**

```json
{
  "hooks": {
    "PreToolUse": [
      { "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "…", "args": [], "if": "Bash(git *)",
            "timeout": 600, "statusMessage": "…", "once": false } ] } ]
  },
  "disableAllHooks": false
}
```

**Matcher evaluation:** `*`/`""`/omitted = all; only `[A-Za-z0-9_\- ,|]` = exact
string/list (`Bash`, `Edit|Write`, `code-reviewer`); anything else = unanchored
JS regex (`^Notebook`, `mcp__memory__.*`). Comma lists need v2.1.191+; bare
hyphen exact-match needs v2.1.195+ (else `code-reviewer` is a regex).

**Handler types:** `command` (exec form when `args` set, shell form otherwise;
`shell: bash|powershell`; `async`/`asyncRewake`), `http` (POSTs hook JSON,
`headers` + `allowedEnvVars`), `mcp_tool` (`server`+`tool`+`input` with
`${…}` substitution), `prompt` (single-turn model yes/no, `$ARGUMENTS`), `agent`
(spawns a Read/Grep/Glob subagent; experimental). Common field `if:` is a
permission-rule filter (`Bash(git *)`, `Edit(*.ts)`), tool-events only, fails
open.

**Control:** exit `0` = success (stdout JSON parsed); exit `2` = blocking error
(stderr fed to Claude); other = non-blocking. JSON output has universal fields
(`continue`, `stopReason`, `suppressOutput`, `systemMessage`,
`terminalSequence`) plus `hookSpecificOutput`. `PreToolUse` uses
`permissionDecision: allow|deny|ask|defer` + `permissionDecisionReason` +
`updatedInput` + `additionalContext`. Post/Stop/etc. use top-level
`decision: "block"` + `reason`. `SessionStart`/`SubagentStart` inject
`additionalContext`. Command hooks get `$CLAUDE_PROJECT_DIR`,
`$CLAUDE_PLUGIN_ROOT`, `$CLAUDE_ENV_FILE`, `$CLAUDE_EFFORT`, etc.

---

## 4. Plugins & Marketplaces

**Plugin = a directory** with a `.claude-plugin/plugin.json` manifest.

```json
{ "name": "my-plugin", "description": "…", "version": "1.0.0",
  "author": { "name": "…" } }
```

- `name` — unique id + **skill namespace** (`/my-plugin:hello`).
- `version` — optional; if set, users update only on bump; if omitted with a git
  source, the commit SHA is the version (every commit = new version).
- optional `homepage`, `repository`, `license`, `author`.

**Directory layout (all at plugin root, NOT inside `.claude-plugin/`):**
`skills/<name>/SKILL.md`, `commands/*.md` (legacy flat form),
`agents/*.md`, `hooks/hooks.json`, `.mcp.json`, `.lsp.json`,
`monitors/monitors.json`, `bin/` (added to Bash `PATH` while enabled),
`settings.json` (only `agent` + `subagentStatusLine` keys honored — `agent`
can make a plugin agent the *main thread*). A single-skill plugin may put
`SKILL.md` at the plugin root (frontmatter `name` sets the command).

**Dev/test:** `claude --plugin-dir ./p` (also `.zip`, v2.1.128+), `--plugin-url`
for hosted zips, `/reload-plugins` to hot-reload, `claude plugin init <name>`
scaffolds a **skills-directory plugin** that auto-loads as `name@skills-dir`.
`claude plugin validate` runs the same check the marketplace review uses.

**Marketplaces:** a marketplace is a repo with
`.claude-plugin/marketplace.json`. Anthropic runs `claude-plugins-official`
(curated; auto-registered on first interactive launch) and `claude-community`
(`/plugin marketplace add anthropics/claude-plugins-community`, install as
`@claude-community`). Plugin subagents ignore `hooks`/`mcpServers`/
`permissionMode` for security. Project/user `.claude/agents/` override
same-named plugin agents.

---

## 5. settings.json / settings.local.json

**Precedence (high→low):** managed policy → CLI args → `.claude/settings.local.json`
(gitignored, personal) → `.claude/settings.json` (team, committed) →
`~/.claude/settings.json` (user). Permission/array values **merge** across
scopes; scalars are overridden. **Project `settings.json` permission `allow`
rules require workspace trust; `settings.local.json` does not.**

**Permissions:** `permissions.allow` / `.deny` / `.ask` arrays of
`Tool(resource)` patterns — `Bash(npm run test *)`, `Read(~/.zshrc)`,
`Write(./src/**)`, `Read(./.env*)`. `*` = one segment, `**` = recursive.
`allowed-tools` in a skill/agent only *grants*; hard blocks come from
`permissions.deny`.

**Notable top-level keys:** `model`, `outputStyle`, `env`, `hooks`, `agent`
(main-thread subagent), `advisorModel`, `effortLevel`, `alwaysThinkingEnabled`,
`autoMemoryEnabled`/`autoMemoryDirectory`, `includeGitInstructions`,
`disableBundledSkills`, `disableWorkflows`, `disableArtifact`,
`fileCheckpointingEnabled`, `cleanupPeriodDays`, `attribution`,
`skillOverrides`, MCP keys (`enableAllProjectMcpServers`,
`enabledMcpjsonServers`, `disabledMcpjsonServers`, `allowedMcpServers`/
`deniedMcpServers`/`allowManagedMcpServersOnly`), plus managed-policy keys
(`allowManagedPermissionRulesOnly`, `allowManagedHooksOnly`,
`strictKnownMarketplaces`, `requiredMinimumVersion`). Schema URL:
`https://json.schemastore.org/claude-code-settings.json`.

---

## 6. MCP servers

**Config surfaces:** `.mcp.json` (project, shared), `~/.claude.json` (user),
`claude mcp add` / `claude mcp add-json`. **Scopes** via `--scope`: `local`
(default, you-only this project; old name `project`), `project` (shared via
`.mcp.json`), `user` (all your projects; old name `global`).

**Transports & entry schema:**
- **stdio** (default): `{ "command": "...", "args": [...], "env": {...} }`.
  `claude mcp add … -- <cmd> [args]` (everything after `--` runs the server).
  An entry with **no `type` is read as stdio**; a `url` with no `type` is a
  hard error (v2.1.202 message: add `"type": "http"`).
- **http** (recommended remote; `type` accepts `streamable-http` alias):
  `{ "type": "http", "url": "...", "headers": {...}, "headersHelper": "...",
  "timeout": ..., "alwaysLoad": ... }`. `claude mcp add --transport http`.
- **sse** (deprecated): `type: "sse"`, same shape.
- **ws**: `type: "ws"`, header-only auth, configured only via `.mcp.json` /
  `add-json` (`--transport` doesn't accept `ws`).

**Tool naming:** `mcp__<server>__<tool>` (e.g. `mcp__memory__create_entities`);
matchable in hooks by regex (`mcp__memory__.*`). Project `.mcp.json` servers
need workspace trust before `enableAllProjectMcpServers`/`enabledMcpjsonServers`
take effect. Per-server `timeout` (ms) in the entry; idle-abort at 5 min for
remote transports (`CLAUDE_CODE_MCP_TOOL_IDLE_TIMEOUT`). Stdio servers receive
`CLAUDE_PROJECT_DIR` in their env.

---

## 7. Output styles, CLAUDE.md / memory, slash commands

- **Output styles:** selected via the `outputStyle` setting (e.g.
  `"Explanatory"`) or `/output-style`; changes the system prompt. Applies on
  restart. `disableBundledSkills`/`disableWorkflows` gate shipped behavior.
- **Memory / CLAUDE.md hierarchy (high→low):** managed policy, managed drop-ins,
  **project memory** (`./CLAUDE.md`), project rules (`.claude/rules/*.md`),
  user memory (`~/.claude/CLAUDE.md`), user rules, local project memory
  (`CLAUDE.local.md`), auto memory. Loaded automatically each session.
- **Imports:** `@path/to/file` at the top of a CLAUDE.md pulls that file in
  (relative or absolute, e.g. `@docs/api.md`, `@~/.claude/x.md`, `@AGENTS.md`).
  `.claude/rules/*.md` load as topic-scoped context. `/memory` shows which
  files are loaded. Auto memory (`autoMemoryEnabled`) is a separate,
  lowest-precedence learned store.
- **Slash commands = skills** (see §1). Built-ins reachable via the Skill tool
  include `/init`, `/review`, `/security-review`; `/compact` etc. are not.

---

## New-function / capability opportunities

*(For the synthesis stage — surfaced, not scored here. These are places the
current upstream surface exposes capability the repo's generators/validators do
not yet emit or check.)*

1. **`when_to_use` frontmatter is unused by the generators.** Upstream now
   treats `description` + `when_to_use` as one 1,536-char listing budget and
   documents `when_to_use` as the *place to put trigger phrases*. The repo packs
   all triggers into `description` (and truncates them — the prior audit's P6).
   Emitting a separate `when_to_use` block would be more idiomatic and dodge the
   truncation-of-triggers defect at the source.
2. **`argument-hint` / `arguments` never emitted.** Command-style skills
   (`/gsd:*`, `sc:*`, `wrap:*`) take arguments but ship no `argument-hint`, so
   autocomplete gives users nothing. Cheap authoring win the validator could
   even require for `disable-model-invocation: true` skills.
3. **`context: fork` + `agent:` is a native replacement for some bespoke
   orchestration.** Skills that today instruct "spawn a subagent and…" can
   declare `context: fork` / `agent: Explore` and let the harness run the body
   as a subagent — worth surfacing in cartridge-forge guidance.
4. **`disallowed-tools` (skill) / `disallowedTools` (agent) for autonomous
   loops.** The security-hygiene story is currently allow-only; `disallowed-tools`
   gives a positive way to strip e.g. `AskUserQuestion` from a background skill.
5. **Plugin packaging path exists but the repo ships via `install.cjs`.** The
   default core (`project-claude/`) maps almost 1:1 onto a plugin layout
   (`skills/`, `agents/`, `hooks/hooks.json`, `settings.json`). Packaging it as
   a real plugin + a `.claude-plugin/marketplace.json` would make the whole core
   installable via `/plugin` and versioned, replacing the copy-into-`.claude/`
   drift problem the prior audit flagged.
6. **`isolation: worktree` for the sc-dev-team / fleet-mission agents** — native
   worktree isolation now exists in subagent frontmatter, obviating some of the
   manual worktree scripting in the orchestration chipsets.

---

## Notes

### Repo-relevant drift (hand to the sibling `OFFICIAL-FORMAT.md` / validator reviewers)

- **Description length: `1-1024` (repo) vs `1,536` listing truncation
  (upstream).** `docs/OFFICIAL-FORMAT.md:64` documents `description (1-1024
  chars)`, and the prior artifact audit corrected finding C4 to the "real bound
  is 1-1024." Current official docs do **not** state a 1,024 hard cap — they say
  the **combined `description` + `when_to_use` is truncated at 1,536 characters
  in the skill listing** to save context. The `1-1024` figure is the
  agentskills.io open-standard / older bound; treat it as a *conservative
  authoring guideline*, but note the repo's stated "real bound" is now stale vs
  upstream. (This is informational; do not re-fix C4 — just flag the number.)
- **`allowed-tools` accepts a YAML list too.** `OFFICIAL-FORMAT.md:67` says
  "Comma-separated list" and the ecosystem audit's C2 correctly bans YAML-array
  `tools:` **for subagents**. But for **skills**, upstream now explicitly accepts
  "space- or comma-separated string, **or a YAML list**" for `allowed-tools`.
  The comma-separated-string rule remains correct/safest for *agent* `tools:`;
  don't over-generalize the ban to skill `allowed-tools` YAML lists.
- **`when_to_use` field is missing from `OFFICIAL-FORMAT.md`.** The repo's
  frontmatter table (lines 64-67) omits `when_to_use`, `argument-hint`,
  `arguments`, `disallowed-tools`, `context`, `agent`, `effort`, `hooks` — the
  format doc is a subset of the current surface.
- **Custom commands → skills merge** is not reflected: the repo maintains a
  separate `.claude/commands/` mental model; upstream now treats them as one.

### Method / provenance

Fetched July 2026 from official docs: `code.claude.com/docs/en/{skills,
sub-agents, hooks, plugins, settings, mcp, memory}`. Full page captures saved in
this session's tool-results. Version gates (`v2.1.x`) transcribed from the docs'
`min-version` annotations; the repo runs against whatever CLI the operator has,
so a validator that hard-codes an older surface will under- or over-reject.

**Sources:**
- [Extend Claude with skills](https://code.claude.com/docs/en/skills)
- [Create custom subagents](https://code.claude.com/docs/en/sub-agents)
- [Hooks reference](https://code.claude.com/docs/en/hooks)
- [Create plugins](https://code.claude.com/docs/en/plugins)
- [settings.json reference](https://code.claude.com/docs/en/settings)
- [Connect Claude Code to tools via MCP](https://code.claude.com/docs/en/mcp)
- [How Claude remembers your project (memory)](https://code.claude.com/docs/en/memory)
- [Agent Skills open standard](https://agentskills.io)
