# Integration Review — 2026-07-06 (Dimension A: integration)

Scope: how gsd-skill-creator plugs into Claude Code and gsd-core. Files read:
`project-claude/install.cjs`, `project-claude/manifest.json`,
`project-claude/settings.json`, `project-claude/settings-hooks.json`,
`src/cli/commands/gsd-init.ts`, `src/mcp/**` (server, gateway, agent-bridge,
security, content-validator), `src/mcp-defense/cascade/**`, `src/hooks/**`,
`src/integration/**`, `src/initialization/dependency-checker.ts`,
`src/runtime-hal/**`, `INSTALL.md`. This review is read-only; nothing was modified
except this document.

All content-level skill/agent/team/chipset/cartridge findings were already handled
by `docs/audits/2026-07-06-artifact-ecosystem-review.md` and are not re-reported.
This pass is strictly about installer/hook/MCP/init **code and system behavior**.

## Summary

The integration surface is broad and mostly functional, but the **install/uninstall
layer has diverged into two parallel implementations** that share one
`project-claude/manifest.json` yet are each incomplete in complementary ways.
`project-claude/install.cjs` (the `gsd-skill-creator` bin, the one CLAUDE.md tells
you to run) does a complete *install* (auto-discovery + cartridges) but a
hardcoded, drastically incomplete *uninstall* that never cleans
`.claude/settings.json` — leaving orphaned hook registrations that point at
just-deleted hook scripts and break the host project on the next session.
`src/cli/commands/gsd-init.ts` (`skill-creator gsd-init`) is the mirror image: a
correct, manifest-driven, settings-aware *uninstall* but an *install* that skips
auto-discovery and all four cartridges. Separately, the flagship "automatic session
observation" hooks (`dist/hooks/session-start.js` / `session-end.js` → the
SessionObserver adaptive-learning pipeline) are neither installed by either
installer nor correctly documented — `INSTALL.md` and the modules' own headers
use an invalid Claude Code hook schema, so following the docs wires nothing. Large
built-and-tested surfaces (the MCP **gateway** HTTP server + agent-bridge, and the
purpose-built **CASCADE** MCP prompt-injection defense) are exported but never
launched or invoked from any entry point. `runtime-hal` is a static registry with
no consumer. Headline fixes: unify the two installers behind one manifest-driven
engine with a parity test, wire (and correctly document) the observation hooks, and
either surface or explicitly park the gateway/CASCADE/runtime-hal capabilities.

## Findings

### INT-1 (HIGH) — `install.cjs --uninstall` orphans `.claude/settings.json`, leaving hooks that point at deleted scripts

- **Location:** `project-claude/install.cjs:945-1031` (`uninstallIntegration`), vs
  `install.cjs:1146-1158` (install merges `settings.json` + `settings-hooks.json`).
- **Problem:** Install merges hook registrations into `.claude/settings.json` via
  `installSettings` for both the `settings` and `settingsHooks` manifest entries
  (SessionStart→`session-state.cjs`, PreToolUse Bash→`validate-commit.cjs`,
  PostToolUse→`phase-boundary-check.cjs`, plus `self-mod-guard.js`,
  `git-add-blocker.js`, `gsd-config-guard.js`). `uninstallIntegration()` removes a
  hardcoded list of dirs/files (including the three `.cjs` hook scripts) **but never
  touches `.claude/settings.json`**. After `npx gsd-skill-creator --uninstall`, the
  host's settings.json still registers `node .claude/hooks/session-state.cjs` (and
  the other two), whose files are now gone. Claude Code then invokes a non-existent
  script on every SessionStart / Bash / Write / Edit → a hook error on every matching
  tool call. The correct implementation already exists in `gsd-init.ts:876-962`
  ("Remove merged hooks from settings.json"), proving this is an omission, not a
  design choice.
- **Recommendation:** Port the `gsd-init.ts:876-962` settings-cleanup block into
  `install.cjs` uninstall (collect our commands from `settings.json` +
  `settings-hooks.json`, filter matching groups out of target `settings.hooks`,
  drop emptied events / empty `hooks`). Better: have `install.cjs --uninstall`
  delegate to the shared engine (see INT-2).
- **Effort:** S
- **Verify:** In a scratch repo, `install.cjs` (install), confirm settings.json has
  the 3 registrations, then `install.cjs --uninstall`, and assert settings.json no
  longer references `session-state.cjs`/`validate-commit.cjs`/`phase-boundary-check.cjs`.

### INT-2 (HIGH) — Two divergent installers share one manifest; each is incomplete in complementary ways

- **Location:** `project-claude/install.cjs` (bin `gsd-skill-creator`, documented in
  `CLAUDE.md`) vs `src/cli/commands/gsd-init.ts` (`skill-creator gsd-init` / `gi`,
  dispatched at `src/cli/dispatch.ts:299`). Both read the same
  `project-claude/manifest.json` (`gsd-init.ts:117` `resolveSourceDir`).
- **Problem:** The two code paths are not equivalent:
  - `install.cjs` **install** runs `installAutoDiscover` (agents/skills/`*.cjs`/`*.sh`
    hook auto-discovery, `install.cjs:1109-1115`) **and** installs the 4 cartridges
    (`install.cjs:1161-1167`).
  - `gsd-init.ts` **install** (`gsd-init.ts:1078-1132`) installs only
    standalone/skills/hookScripts/claudeMd/extensions/settings — **no auto-discovery
    and no cartridge install** (grep for `autoDiscover`/`cartridge` in gsd-init.ts:
    zero hits). So `skill-creator gsd-init` produces an install missing all four
    cartridges (`get-shit-done`, `gsd-skill-creator`, `release-engine`,
    `housekeeping`) plus any agent/skill/hook file not explicitly enumerated in the
    manifest — and `gsd-init`'s own `validateInstallation` (`gsd-init.ts:649-752`)
    doesn't even check for cartridges, so the gap is silent.
  - Conversely, `gsd-init.ts` **uninstall** is manifest-driven and settings-aware
    (complete), while `install.cjs` uninstall is a hardcoded partial list (INT-1/INT-3).
  A user who installs with one tool and uninstalls with the other — or relies on
  either alone — gets an inconsistent, partially-broken result.
- **Recommendation:** Collapse to a single manifest-driven install/uninstall engine.
  Simplest: make `install.cjs` the one engine and have `gsd-init` shell out to it (or
  vice-versa: port auto-discovery + cartridge install into `gsd-init` and delete the
  `.cjs`). Add a **parity test** that runs install→uninstall via *each* entry point in
  a temp dir and asserts an identical, empty end-state (no leftover `.claude/` files,
  clean settings.json).
- **Effort:** M
- **Verify:** New test: for each of `{install.cjs, gsd-init}`, install into a temp
  project, snapshot the file tree + settings.json, uninstall, assert the delta is
  empty; and assert both installers produce the *same* post-install tree.

### INT-3 (MEDIUM) — `install.cjs` uninstall leaves ~30 hooks, ~15 skills, most agents/commands/extensions on disk

- **Location:** `project-claude/install.cjs:949-971` (hardcoded `integrationTargets`).
- **Problem:** Uninstall enumerates 10 dirs + 7 files (3 agents, 3 `.cjs` hooks,
  `skill-creator.json`) + the git hook. But install writes far more: all 12
  `manifest.hookScripts` + every auto-discovered `*.cjs`/`*.sh` hook (e.g.
  `self-mod-guard.js`, `git-add-blocker.js`, `gsd-config-guard.js`,
  `pre-compact-snapshot.cjs`, `worktree-*`, `tool-tracker.sh`,
  `observe-tool-trace.cjs`), ~13 standalone skills (`commit-style`, `cartridge-forge`,
  `code-review`, `context-handoff`, `decision-framework`, `gsd-preflight`,
  `gsd-guide`, `gsd-trace`, `test-generator`, `typescript-patterns`, `api-design`,
  `env-setup`, …), `gsd-orchestrator` + example agents, the `.claude/commands/*.md`
  files, the two injected extension blocks in `gsd-executor.md`/`gsd-planner.md`, and
  `CLAUDE.md`. None are removed. Notably, `self-mod-guard.js` and `git-add-blocker.js`
  keep firing after the user believes they uninstalled. This hardcoded list is
  structurally guaranteed to drift from the manifest.
- **Recommendation:** Derive the uninstall set from the manifest (as `gsd-init.ts`
  does) and, ideally, from an install ledger written at install time (record every
  target path actually written), so uninstall removes exactly what install wrote —
  including auto-discovered files. Strip extension markers rather than only listing
  two of them.
- **Effort:** M (subsumed by INT-2 if installers are unified)
- **Verify:** `install.cjs` install then `--uninstall --dry-run`; assert the removal
  list covers every manifest target + auto-discovered hook, and that a follow-up
  filesystem scan of `.claude/` shows no skill-creator artifacts remaining.

### INT-4 (MEDIUM) — Core session-observation hooks are unregistered and documented with an invalid Claude Code hook schema

- **Location:** `INSTALL.md:224-231`; header comments in
  `src/hooks/session-start.ts:8-15` and `src/hooks/session-end.ts:8-15`;
  `src/hooks/session-end.ts` (→ `dist/hooks/session-end.js`).
- **Problem:** `src/hooks/session-start.ts`/`session-end.ts` are the bridge between a
  live Claude Code session and `SessionObserver` — i.e., the adaptive-learning
  pipeline (transcript → patterns → suggestions) that is this project's headline
  value. They are **not installed by either installer** (settings.json wires
  `session-state.cjs`, `gsd-save-work-state.js`, `gsd-snapshot-session.js`, but never
  `session-start.js`/`session-end.js`), and `INSTALL.md` plus the modules' own
  headers tell users to register them as:
  ```json
  { "hooks": { "session_start": "node .../dist/hooks/session-start.js" } }
  ```
  That schema is invalid for current Claude Code: the event key is `SessionStart`
  (PascalCase), and the value must be an array of matcher groups
  (`[{ "hooks": [{ "type": "command", "command": "..." }] }]`), exactly as the
  project's own `settings.json` uses. A user who follows INSTALL.md produces a
  settings file Claude Code silently ignores, so "automatic session observation"
  never fires.
- **Recommendation:** Decide the intended path. Either (a) wire these two hooks via
  the manifest/settings with the correct `SessionStart`/`SessionEnd` array schema and
  fix INSTALL.md + the module headers, or (b) if `observe-tool-trace.cjs` +
  `tools/session-retro/observe.mjs` are the real observation path and these two
  modules are superseded, delete them and remove the INSTALL.md section. Do not leave
  a documented-but-broken integration for the flagship feature.
- **Effort:** S (fix docs + schema) / M (wire into installer)
- **Verify:** Register the corrected snippet in a scratch `.claude/settings.json`,
  start/end a session, and confirm `SessionObserver` writes to `.planning/patterns/`.

### INT-5 (MEDIUM) — MCP gateway + agent-bridge servers are fully built but have no launcher

- **Location:** `src/mcp/gateway/**` (server, `create-gateway-server.ts`, `auth.ts`,
  `token-manager.ts`, `tools/*`, `resources/*`, `prompts/*`), `src/mcp/agent-bridge/**`
  (scout/verify servers), exported from `src/mcp/index.ts:20-57`.
- **Problem:** Only the 4-tool **stdio** server (`createMcpServer`/`startMcpServer`,
  `src/mcp/server.ts`) is reachable, via `skill-creator mcp-server`
  (`src/cli/dispatch.ts:198`). `startGateway` and `createScoutServer`/`createVerifyServer`
  are referenced only inside `src/mcp/` itself (index re-exports + internal wiring) —
  no CLI command, no `bin`, no `tools/` script starts them. The gateway is a
  substantial, tested surface: Streamable-HTTP transport, bearer-token auth with
  scopes, and ~8 tool modules (skill/agent/chipset/workflow/memory/project/arena)
  plus resources and prompts — none of it launchable by an end user today.
- **Recommendation:** Add a `mcp-gateway` (or `gateway`) CLI command that calls
  `startGateway` with token/scope config, and document it; or, if the gateway is
  deliberately parked pending a decision, add a one-line status note in
  `src/mcp/gateway/index.ts` (and the roadmap) so it isn't mistaken for a live,
  reachable feature.
- **Effort:** M (wire a CLI command) / S (document the park)
- **Verify:** `skill-creator mcp-gateway --port …` starts and responds to an
  authenticated `tools/list`; add an integration test that boots it and lists tools.

### INT-6 (MEDIUM) — CASCADE MCP prompt-injection defense is shipped and flag-declared but never invoked by the MCP server it protects

- **Location:** `src/mcp-defense/cascade/**` (`runCascade`/`runCascadeSync`,
  `index.ts`); flag declared at `src/convergent/settings.ts:27,35,116`
  (`cascadeMcpDefense: false`).
- **Problem:** CASCADE is a purpose-built three-tier defense for MCP tool-poisoning /
  prompt injection (from arXiv:2604.17125). `runCascade` is invoked nowhere outside
  the module's own tests (`grep` for `runCascade` outside `src/mcp-defense/`: none).
  The MCP entry points that actually accept untrusted content — `install_skill` in
  `src/mcp/server.ts:141`, and the gateway tool handlers — never call it. The
  `cascadeMcpDefense` flag exists only as a settings field; no code branches on it to
  run the detector. So the defense is dormant even when a user would want it on.
- **Recommendation:** Wire `runCascade` behind the `cascadeMcpDefense` flag at the MCP
  ingress (at minimum around `install_skill` source content and gateway tool inputs),
  or, if it is intentionally staged for a later phase, note that explicitly next to
  the flag so it is not read as active protection.
- **Effort:** M
- **Verify:** Enable `cascadeMcpDefense`, feed a known attack pattern
  (`KNOWN_ATTACK_PATTERNS`) through the MCP install path, and assert it is rejected /
  audited.

### INT-7 (LOW) — `runtime-hal` registry has no consumer; the advertised multi-runtime skill oversells the code

- **Location:** `src/runtime-hal/runtimes.ts` + `index.ts`; only comment references in
  `src/orchestration/draft-verify-router.ts:24,46` (no import).
- **Problem:** `runtime-hal` is a static 15-runtime registry with a drift test
  (`getRuntimeCount`) but only `claude-code` marked `'implemented'` and **no runtime
  code that imports or dispatches on it** — the sole references are doc comments about
  "tier names." Meanwhile the `runtime-hal` skill advertises live multi-runtime
  detection, startup injection, and GUPP enforcement across Claude Code / Codex /
  Gemini / Cursor. Per the C6 scope note in `runtimes.ts:1-14` this is deliberately
  "registration only," but the gap between the skill's promise and the code is an
  alignment risk (a user expects behavior that isn't there).
- **Recommendation:** Either keep as-is but reword the `runtime-hal` skill to say
  "registry / registration-only; adapters deferred," or begin wiring an actual runtime
  detector that consumes `SUPPORTED_RUNTIMES`/`RUNTIME_STATUS`. At minimum, keep the
  skill claim and the code status in sync.
- **Effort:** S
- **Verify:** Read the reworded skill against `RUNTIME_STATUS`; confirm no skill claims
  a capability the code doesn't provide.

### INT-8 (LOW) — Settings-merge is command-only and never removes stale groups; plus dead code in `install.cjs`

- **Location:** `project-claude/install.cjs:611-614` (empty
  `if (!targetSettings[event]) { }` block) and `:624-632`; same dedupe logic in
  `src/cli/commands/gsd-init.ts:450-456`.
- **Problem:** (a) `install.cjs:611-614` is a dead no-op block (leftover). (b) The
  hook merge dedupes purely on the command string and only ever *appends* groups. If a
  hook's `matcher` changes between versions (same command, new matcher), the merge
  sees the command already present, skips re-registration, and leaves the stale
  matcher group — so matcher/event changes never propagate on re-install and old
  registrations accumulate. There is no "update existing group" or "remove superseded"
  path.
- **Recommendation:** Remove the dead block. Key the merge on `(event, matcher,
  command)` and, on `--force`, replace our previously-installed groups wholesale (e.g.
  tag installed groups with a marker or reconcile against the source file) so upgrades
  are clean.
- **Effort:** S
- **Verify:** Change a matcher in `settings-hooks.json`, re-run install with `--force`,
  and assert the target has exactly the new matcher (no stale duplicate).

### INT-9 (LOW) — `hook-validator.ts` / `hook-error-boundary.ts` have no consumers

- **Location:** `src/hooks/hook-validator.ts`, `src/hooks/hook-error-boundary.ts`
  (compiled to `dist/hooks/`), imported by nothing outside their own tests.
- **Problem:** These look like intended safety wrappers (validate hook definitions /
  bound hook errors) but no installed hook script or CLI path imports them, so hook
  scripts run unwrapped. Either they are dead code or an unrealized safety layer.
- **Recommendation:** If they encode desired guarantees, wire them into the hook
  runtime (e.g. wrap the `.cjs`/`.js` hook bodies); otherwise remove them to reduce
  the dead surface.
- **Effort:** S
- **Verify:** `grep` for imports; decide wire-or-delete; if wired, a hook that throws
  is caught by the boundary rather than crashing the tool call.

## New-function / capability opportunities

- **Install ledger + single engine (from INT-1/2/3).** Write a
  `.claude/.skill-creator-install.json` manifest of every path written at install
  time; uninstall consumes it for exact, auto-discovery-aware removal. This is the
  durable fix that makes install/uninstall parity a property rather than a
  hand-maintained list, and lets a future `--upgrade` diff old vs new cleanly.
- **`claude mcp add` self-registration.** Neither installer registers the working
  stdio MCP server (`skill-creator mcp-server`) with Claude Code — users must hand-edit
  their MCP client config (`mcp-server.ts` help text says so). An opt-in
  `skill-creator gsd-init --with-mcp` that writes a `.mcp.json` entry (or runs
  `claude mcp add`) would close the last mile of Claude Code integration.
- **Surface the gateway (INT-5).** A documented `mcp-gateway` command would unlock the
  already-built HTTP/auth/tools/resources/prompts surface — the richest integration in
  the repo — for remote/multi-client use.
- **Turn CASCADE on at MCP ingress (INT-6).** Wiring the shipped defense behind its
  existing flag would give the MCP surface real tool-poisoning protection with no new
  research code.

## Notes

- `src/initialization/dependency-checker.ts` is small and correct: it soft-checks
  `@huggingface/transformers` and degrades to heuristics. No issue; only optional deps
  are checked, which is appropriate.
- The `mcp-server` stdio server (`src/mcp/server.ts`) is a clean, thin adapter with
  correct stdout/stderr discipline (never `console.log`); its 4 tools delegate to real
  stores. No defects found there.
- `.claude/` is gitignored and has drifted from `project-claude/` (e.g. `.claude/hooks/`
  contains `gsd-context-monitor.js`, `gsd-workflow-guard.js`, `gsd-update-banner.js`,
  `gsd-read-injection-scanner.js`, `task-completed-gate.sh`, `teammate-idle-gate.sh`
  that do not exist in `project-claude/hooks/`). This is expected per the prior audit
  (source of truth is `project-claude/`), but it means the *installed* hook set a
  developer runs locally is broader than what any consumer gets — worth keeping in mind
  when reasoning about hook behavior. Not scored as a finding here since it is
  local-only drift already documented.
- `install.cjs` auto-discovery correctly covers `*.cjs`/`*.sh` hooks (so
  `tool-tracker.sh` / `observe-tool-trace.cjs`, referenced by `settings.json` but not
  in `manifest.hookScripts`, still get installed). But `.js` hooks are *not*
  auto-discovered (pattern is `*.cjs`/`*.sh` only) and must be hand-added to
  `manifest.standalone[]` — a new `.js` hook silently won't install. Low-grade
  fragility, documented in the manifest comment; folded into the INT-2 "unify the
  engine" recommendation rather than scored separately.
