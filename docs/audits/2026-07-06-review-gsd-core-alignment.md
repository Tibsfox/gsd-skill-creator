# gsd-core Alignment Gap Analysis (Dimension B, stage 2)

**Date:** 2026-07-06
**Reviewer:** senior-reviewer subagent
**Upstream reference:** `docs/audits/2026-07-06-review-gsd-core-surface.md` (@opengsd/gsd-core `1.7.0-rc.3`, `next` branch)
**Scope:** OUR GSD-facing surface — `.claude/get-shit-done/`, `project-claude/commands/gsd/`, `project-claude/skills/gsd-*`, `src/orchestrator/`, `src/orchestration/`, `docs/INTEGRATION.md`, `docs/missions/platform-alignment/`, `examples/skills/workflow/ecosystem-alignment`.
**Constraint:** READ-ONLY. No source modified except this report.

---

## Summary

gsd-skill-creator co-manages projects with gsd-core through three seams: (1) a **vendored slice** at `.claude/get-shit-done/` (VERSION `1.0.0`, an old file-granular workflow decomposition), (2) a **shipped cartridge** `examples/cartridges/get-shit-done` + `project-claude` installer, and (3) a **TypeScript orchestrator** (`src/orchestrator/`) that discovers and reads a GSD install on disk. All three are pinned to a **pre-rename, pre-capability generation of GSD**. Upstream has since (a) renamed the npm package from `get-shit-done`/`get-shit-done-cc` to **`@opengsd/gsd-core`**, (b) jumped to **1.7.0-rc.3**, (c) introduced the **capabilities/** overlay system as the canonical first-party extension path, (d) published a formal **host-integration SDK** (ADR-1239, 8-axis handshake / `PROTOCOL_VERSION`), and (e) reshaped the command set (ns-* routers, `capture`, `surface`, `onboard`, `next`, `mempalace-*`).

The good news: the **platform-alignment hook mission is substantially executed** — compaction (`pre-compact-snapshot.cjs`/`post-compact-recovery.cjs`), `external-change-tracker.cjs`, `worktree-init/cleanup`, `permission-recovery.cjs`, `notification-logger.cjs`, `gsd-context-monitor.js`, `gsd-prompt-guard.js`, `gsd-read-injection-scanner.js` are all on disk. So hook-parity is NOT a gap and is not re-reported here.

The alignment gaps that remain are: **version + package-name skew** (bootstrap instructions point at a package that no longer exists), a **discovery detector hardcoded to a directory name that a modern gsd-core install may not produce** (silent co-management disable), **no version-compatibility gate**, a **config validator whose closed enums reject valid modern config**, **stale command-routing tables**, and the **architectural choice to extend by file-copy rather than a `role:feature` capability overlay**. None are catastrophic today because the repo carries its own vendored copy, but every one of them breaks the moment a user pairs this tool with a current upstream gsd-core.

---

## Findings

### B1 — HIGH — Vendored GSD is 7 minor versions + a package rename behind upstream
- **Location:** `.claude/get-shit-done/VERSION` (`1.0.0`); upstream `@opengsd/gsd-core` = `1.7.0-rc.3`.
- **Problem:** The vendored slice is a fork of a **pre-rename** GSD. Its `workflows/` uses the old file-granular decomposition (`add-phase.md`, `execute-plan.md`, `plant-seed.md`, `list-phase-assumptions.md`, `new-workspace.md`…) with **no** `ns-*` routers, no `capture`, no `surface`, no `config` command, no `graphify` command, no `mempalace-*`, no `onboard`, no `next`. There is no record anywhere in the repo pinning which upstream commit this `1.0.0` corresponds to, so drift is unauditable.
- **Recommendation:** Decide the vendoring contract explicitly: either (a) re-vendor against a known `@opengsd/gsd-core` tag and record the source SHA in a `PROVENANCE` file next to `VERSION`, or (b) stop vendoring workflow bodies and depend on the host-installed gsd-core, keeping only the thin orchestrator. Add a CI check that fails when `VERSION` drifts > N minors from the pinned upstream.
- **Effort:** M (decision + provenance file) → L (if re-vendoring the full workflow tree).
- **Verify:** `cat .claude/get-shit-done/VERSION` shows a real upstream version + a `PROVENANCE` file names the source tag/SHA.

### B2 — HIGH — Bootstrap + version-check instructions reference the dead package name
- **Location:** `project-claude/install.cjs:1052` (`console.error('Or install GSD first: npx get-shit-done-cc --claude --global')`); `examples/skills/workflow/ecosystem-alignment/SKILL.md:23,30` (`GSD upstream (get-shit-done)`, `npm list get-shit-done`).
- **Problem:** Upstream is now published as **`@opengsd/gsd-core`** with bins `gsd-core`/`gsd-tools` and bootstrap `npx @opengsd/gsd-core@latest`. `get-shit-done-cc` and `get-shit-done` are stale. A user who follows the printed instruction installs nothing (or an unrelated/abandoned package), and the ecosystem-alignment skill's `npm list get-shit-done` will always report "not installed" even when a current gsd-core is present → false alignment signal.
- **Recommendation:** Update the install fallback string to `npx @opengsd/gsd-core@latest` and the ecosystem-alignment check to `npm list @opengsd/gsd-core` (plus `gsd-core --version` / `gsd-tools` presence). Keep the old name as a secondary probe for back-compat.
- **Effort:** S.
- **Verify:** `grep -rn "get-shit-done-cc\|npm list get-shit-done" project-claude examples` returns nothing; the ecosystem-alignment skill detects a real `@opengsd/gsd-core` install.

### B3 — HIGH — GSD-install detector is hardcoded to the `get-shit-done/VERSION` path a modern install may not create
- **Location:** `src/orchestrator/discovery/discovery-service.ts:44,55,161,174` (`join(base, 'get-shit-done', 'VERSION')`).
- **Problem:** `detectGsdInstallation()` decides "GSD is installed" **solely** by the existence of `<base>/get-shit-done/VERSION`. Modern gsd-core "ships a Claude Code plugin (`.claude-plugin/`)" and projects artifacts via `installRuntimeArtifacts` (surface doc §6a/§9); its install layout is capability/ledger-based (`.gsd-capabilities.json`, `.gsd-profile`, `.gsd-surface.json`) and is **not guaranteed to drop a `get-shit-done/VERSION` file**. If a user has a current gsd-core but no legacy `get-shit-done/` dir, `detectGsdInstallation` returns `null`, `createDiscoveryService` returns `null`, and **every downstream co-management feature silently no-ops** — the orchestrator concludes GSD is absent while the user is actively running it.
- **Recommendation:** Broaden detection to a probe list: `get-shit-done/VERSION` (legacy) → `.claude-plugin/` marker → `.gsd-capabilities.json`/`.gsd-profile` ledgers → `gsd-tools`/`gsd-core` bin on PATH. Return the first hit and record which layout matched so callers can adapt.
- **Effort:** M.
- **Verify:** Point `detectGsdInstallation` at a fixture dir containing only `.gsd-capabilities.json` (no `get-shit-done/`) and confirm it detects rather than returning null.

### B4 — MEDIUM — Discovery reads VERSION but performs no compatibility / drift gate
- **Location:** `src/orchestrator/discovery/discovery-service.ts:readVersion()` (~line 174) — value is surfaced in `DiscoveryResult.version` and used only for mtime cache invalidation.
- **Problem:** A `1.0.0` install and a `1.7.0-rc.3` install are treated identically. There is no supported-range assertion, no "your gsd-core is newer/older than this tool expects" warning, and no coupling to upstream's compatibility handles (`engines.gsd` semver, `PROTOCOL_VERSION`). Any breaking upstream change (command rename, config-key rename) manifests as silent mis-parsing rather than an actionable warning.
- **Recommendation:** Add a `SUPPORTED_GSD_RANGE` semver constant to the orchestrator, compare `DiscoveryResult.version` against it in `discover()`, and emit a `DiscoveryWarning` (`type: 'version-mismatch'`) when out of range. Pin against `engines.gsd`/`PROTOCOL_VERSION` per surface-doc §11.
- **Effort:** M.
- **Verify:** Feed a `VERSION` of `1.7.0-rc.3` into a fixture with `SUPPORTED_GSD_RANGE=^1.0.0` and assert a version-mismatch warning appears in `service.warnings`.

### B5 — MEDIUM — Discovery is blind to the capabilities/, hooks/, and ns-* surfaces
- **Location:** `src/orchestrator/discovery/discovery-service.ts` — only `discoverCommands()`, `discoverAgents()`, `discoverTeams()` exist.
- **Problem:** The orchestrator enumerates commands/agents/teams only. It cannot see `capabilities/<id>/capability.json` (the primary upstream extension surface, surface-doc §6), the hook registry (`managed-hooks-registry.cjs` + `hooks.json`), or the ns-* namespace routers. So a downstream feature that wanted to reason about "which capabilities are active / which gates are set" has no data path. It also means our discovery under-counts a modern install (67–71 commands + 34 agents + 35 capabilities are invisible beyond the command list).
- **Recommendation:** Add a `discoverCapabilities()` that reads `.gsd-capabilities.json` ledger + `capabilities/*/capability.json` envelopes (role/tier/enabled/active), and expose it on `DiscoveryResult`. Even a read-only inventory is valuable for the ecosystem-alignment skill and for gsd-preflight.
- **Effort:** M.
- **Verify:** Run discovery against a fixture with a `capabilities/audit/capability.json` and assert it appears in the result.

### B6 — HIGH (architectural) — We extend gsd-core by file-copy, not by a `role:feature` capability overlay
- **Location:** `project-claude/manifest.json` + `project-claude/install.cjs` (copies `.claude/commands/gsd/`, `.claude/agents/gsd-*.md`, cartridge trees); `examples/cartridges/get-shit-done/cartridge.yaml` (version `0.1.0`).
- **Problem:** Surface-doc §11 + closing notes call this out as "the single biggest architectural divergence": the **canonical** extension path is now a `capabilities/<id>/capability.json` (`role: feature`) declaring owned skills/agents/steps/contributions/gates/hooks + federated config keys, installed via `gsd capability install <source>` with a consent + integrity/trust model and reserved-prefix enforcement. Our tool instead ships parallel copies of GSD command/agent files and merges them via a bespoke installer. Consequences: (a) no integrity/consent/trust story, (b) no tier-monotonicity / config-key-exclusivity guarantees, (c) our re-vended files drift from upstream independently, (d) we cannot participate in `gsd capability list/outdated/update`. Note reserved prefixes `gsd-`/`gsd-core-`/`anthropic-` are blocked for third-party overlays, so a skill-creator capability would need its own id namespace.
- **Recommendation:** Prototype a `role: feature` capability overlay (id e.g. `skill-creator-learning`) that declares the adaptive-learning skills/agents/hooks + `agent_skills` injections, and evaluate installing via `gsd capability install` instead of raw file-copy. Even if full migration is deferred, document the divergence and the migration path in `docs/INTEGRATION.md` (which currently predates capabilities entirely).
- **Effort:** XL (full migration) / M (spike + decision doc).
- **Verify:** A `capability.json` validates against the upstream envelope schema and `gsd capability list` shows it as an overlay.

### B7 — MEDIUM — Host-integration SDK (ADR-1239) not consumed; our extension probe is bespoke and static
- **Location:** `src/orchestrator/extension/extension-detector.ts` + `types.ts` — a CLI/dist probe returning a fixed feature bag `{semanticClassification, enhancedDiscovery, enhancedLifecycle, customSkillCreation}` all hardcoded `true`.
- **Problem:** Upstream now publishes `src/host-integration-sdk.cts` — a versioned `PROTOCOL_VERSION` handshake with 8 negotiated axes (embeddingMode, commandSurface, dispatch, modelMode, hookBus, stateIO, transport, runtime), `profileOf`, `negotiateHostCapabilities`, `degradationFor`, and 5 fail-closed adapters (surface-doc §9). Our detector negotiates nothing, degrades nothing, and hardcodes all features on regardless of what the host/gsd-core actually supports — the opposite of the fail-closed contract. If gsd-core ever gates a feature behind protocol negotiation, we would assume it present.
- **Recommendation:** Where the two tools embed each other, adopt (or at minimum read) the host-integration handshake: pin a `PROTOCOL_VERSION`, and replace the all-`true` feature bag with values derived from a negotiation (or an explicit "unknown → degrade" default) rather than optimistic constants.
- **Effort:** L.
- **Verify:** `extension-detector` returns a feature flag as `false`/degraded when the negotiated axis is absent, instead of always `true`.

### B8 — MEDIUM — Installed command set is 4 commands behind upstream (missing onboard/next/mempalace-*)
- **Location:** `.claude/commands/gsd/` (67 files) vs upstream 71 (surface-doc §2).
- **Problem:** The installed slice is missing **`onboard`** (brownfield adoption bootstrap — the recommended entry point for existing repos), **`next`** (the "what should I do next" router), and **`mempalace-capture`/`mempalace-recall`** (the memory-palace capability). The vendored `.claude/get-shit-done/workflows/` is even older (missing `ns-*`, `capture`, `surface`, `config`, `graphify` as well). Users adopting this tool on an existing codebase have no `onboard` path, and any doc/skill that references `mempalace`/`next` dead-ends.
- **Recommendation:** Re-sync the re-vended command set against the upstream 71-command inventory (surface-doc §2), or explicitly document which upstream commands we intentionally omit and why (e.g., mempalace deferred). At minimum restore `onboard` and `next`.
- **Effort:** M.
- **Verify:** `ls .claude/commands/gsd | wc -l` reconciles to the intended inventory; `onboard.md`/`next.md` present or documented-as-omitted.

### B9 — MEDIUM — gsd-workflow routing table teaches command names that don't exist in the modern surface
- **Location:** `project-claude/skills/gsd-workflow/references/command-routing.md:20,21,43,44,45` (routes to `/gsd:research-phase`, `/gsd:list-phase-assumptions`, `/gsd:add-todo`, `/gsd:insert-phase`, `/gsd:remove-phase`).
- **Problem:** These are **old-decomposition** command names. Modern gsd-core folds them into `phase` (CRUD: add/insert/remove), `capture` (was add-todo), and `explore`/`plan-phase` (research is inside planning; there is no `research-phase` command in the upstream 71-command set or in `.claude/commands/gsd/`). The routing skill therefore directs users to slash commands that will not resolve against a current install.
- **Recommendation:** Regenerate the routing table from the actual installed `.claude/commands/gsd/*` stems (or upstream §2). Map: research → `explore`/`plan-phase`; add/insert/remove-phase → `phase`; add-todo → `capture`.
- **Effort:** S.
- **Verify:** Every `/gsd:<cmd>` referenced in `command-routing.md` has a matching file in `.claude/commands/gsd/`.

### B10 — MEDIUM — Co-management config validator's closed enums reject valid modern gsd-core config
- **Location:** `src/orchestrator/state/config-validator.ts:112-122` (`path: 'depth'` validValues `['quick','standard','comprehensive']`; `path: 'model_profile'` validValues `['quality','balanced','budget']`).
- **Problem:** Drift vs surface-doc §8: (a) upstream has no `depth` key — it uses **`granularity`** (`coarse`|`standard`|`fine`) and **`effort`** (`minimal`…`max`); our validator validates a key that no longer exists and misses the two that do. (b) `model_profile` upstream accepts **five** values `quality|balanced|budget|adaptive|inherit`; our validator only whitelists three, so a legitimate `model_profile: adaptive` (or `inherit`) in a modern `.planning/config.json` is flagged as a hard **error** by our co-management path. This turns a valid upstream config into a false failure.
- **Recommendation:** Re-derive the validator's field descriptors from the upstream config schema (§8): add `granularity`/`effort`, extend `model_profile` to the 5-value set, and either drop `depth` or map it as a legacy alias. Consider generating these enums from a shared schema module rather than hand-listing.
- **Effort:** S–M.
- **Verify:** `validateConfig({ model_profile: 'adaptive', granularity: 'fine' })` returns no errors.

### B11 — LOW — Vendored `gsd-tools.cjs` is a divergent fork missing upstream command families
- **Location:** `.claude/get-shit-done/bin/gsd-tools.cjs` (dispatch families enumerated) vs upstream §7.
- **Problem:** Our vendored `gsd-tools` lacks upstream families **`capability`** (`state`/`set`), **`smart-entry`**, **`mempalace`**, and the `template` types differ; it also carries bespoke families upstream lacks (`generate-claude-md`, `gap-analysis`, `profile-*`, `docs-init`, `intel`). This is expected for a fork but means any code (ours or a host's) that shells out to a host-installed `gsd-tools` expecting the modern surface will mismatch — e.g., `gsd-tools capability state` fails against our vendored binary.
- **Recommendation:** If the orchestrator ever shells to `gsd-tools`, target the host-installed binary (discovered via B3) rather than the vendored fork, and feature-detect subcommands. Document the fork delta.
- **Effort:** M.
- **Verify:** No code path invokes `.claude/get-shit-done/bin/gsd-tools.cjs` for a subcommand that only exists upstream.

### B12 — LOW — Orchestrator test fixtures pinned to `gsd-v1.15` (stale)
- **Location:** `src/orchestrator/__fixtures__/fixture-loader.ts:19,22,32` (default `'gsd-v1.15'`); `SNAPSHOT-INFO.md` (GSD v1.15.0, 27 commands, 2026-02-08).
- **Problem:** Discovery/state tests validate against a v1.15 snapshot (27 commands / 4 agents). This gives false confidence that discovery "works" while the real target moved to 1.7.0-rc.3 with a different layout (B3) and 71 commands / 34 agents / 35 capabilities. The fixture cannot exercise capability discovery (B5) or the plugin install layout.
- **Recommendation:** Add a `gsd-v1.7` fixture (per SNAPSHOT-INFO "Updating" steps) that includes a `.gsd-capabilities.json` + `capabilities/` sample and the modern command stems; bump the fixture-loader default once B3/B5 land.
- **Effort:** M.
- **Verify:** A `gsd-v1.7` fixture dir exists and discovery/compat tests run against it.

---

## New-function / capability opportunities

1. **Ship a `role:feature` capability overlay for the learning layer (B6).** The cleanest long-term alignment: package skill-creator's adaptive-learning skills/agents/hooks/`agent_skills` injections as a `capability.json` under a non-reserved id, installable via `gsd capability install`. Buys integrity/consent/trust, tier-monotonicity, config-key federation, and participation in `gsd capability list/outdated/update` — replacing the bespoke `project-claude` file-copy merge.
2. **A live gsd-core alignment probe (extends `ecosystem-alignment`).** Replace the stale `npm list get-shit-done` step with: detect `@opengsd/gsd-core` version, diff installed `.claude/commands/gsd/` stems vs the upstream inventory, list active capabilities from the ledger, and assert `PROTOCOL_VERSION`/`engines.gsd` compatibility. Emit an actionable drift report. This is exactly what this skill claims to do but currently checks the wrong package.
3. **Mempalace bridge.** Upstream added a `mempalace` capability + `mempalace-capture`/`-recall` commands + `gsd-mempalace-curator` agent. We already run a homegrown session-retrospective/observatory (`tools/session-retro/`). Evaluate mapping our retro events onto mempalace so cross-session memory is shared with gsd-core rather than parallel.
4. **Adopt the host-integration handshake in `extension-detector` (B7).** Turn the static all-`true` feature bag into a negotiated, fail-closed capability set keyed on `PROTOCOL_VERSION`.

---

## Notes

- **Not gaps (already aligned):** the platform-alignment hook mission (`docs/missions/platform-alignment/`) is substantially executed — compaction/filechanged/worktree/permission/notification/context-monitor/prompt-guard/read-injection hooks are all present in `.claude/hooks/` and `project-claude/hooks/`. Hook parity is therefore NOT reported as a gap.
- **Scope discipline:** the prior artifact-ecosystem review (`docs/audits/2026-07-06-artifact-ecosystem-review.md`) already covered skill/agent/team/chipset/cartridge CONTENT (frontmatter, tools arrays, hardcoded paths, phantom refs). This report deliberately confines itself to **gsd-core alignment/co-management CODE and control surfaces** and does not re-litigate content findings.
- **Severity calibration:** B1/B2/B3/B6 are HIGH because each breaks the moment the tool is paired with a *current* upstream gsd-core, even though the repo's own vendored copy masks the breakage today. The masking is itself the risk: co-management silently degrades rather than failing loudly.
- **Upstream is RC:** `@opengsd/gsd-core 1.7.0-rc.3` on `next` — the surface can still move before 1.7.0 final (surface-doc closing note). Re-verify `package.json` version + `.changeset/` before treating any single upstream item as stable, especially the capability envelope schema (B6) and config keys (B10).
