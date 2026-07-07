# Claude Code Best-Practices Conformance Audit — 2026-07-06

**Dimension C/bestpractices (stage 2).** Measures gsd-skill-creator's format
specs, shipped default artifacts, settings, and linters against the July-2026
upstream Claude Code authoring surface captured in
`docs/audits/2026-07-06-review-cc-features-reference.md`. Read-only; verified
against source. Does **not** re-report anything already fixed in
`docs/audits/2026-07-06-artifact-ecosystem-review.md` (Co-Authored trailer,
array `tools:`, hardcoded paths, phantom command refs, the C4 description-number
dispute, etc.).

## Summary

The default core is functionally solid and the artifact-content debt is already
paid down, but the repo's *packaging and format specs* trail the current
upstream surface in a few concrete, verifiable ways. The single biggest adoption
gap is that the whole default core still ships by copying files into `.claude/`
via `install.cjs` even though plugins + marketplaces are now GA and
`project-claude/` already maps almost 1:1 onto a plugin layout. Two smaller
defects are live: the shipped `project-claude/settings.json` registers a
hook on a **non-existent event name** (`SubagentSpawn`) so that telemetry silently
never fires, and the skill validator **hard-rejects** descriptions over 1024
characters, a bound upstream no longer enforces. The format docs
(`OFFICIAL-FORMAT.md`, `SKILL-FORMAT.md`) and the `when_to_use` field are the
main documentation/feature lags. None of these are data-corrupting, but several
cause either dead behavior or wrongful rejection of upstream-valid artifacts.

## Findings

### CC-1 — Default core has no plugin/marketplace packaging path (ships via copy-into-.claude)
- **Severity:** high · **Category:** new-function · **Effort:** L
- **Location:** `project-claude/` (whole tree) + `project-claude/install.cjs`; no `.claude-plugin/plugin.json` or `marketplace.json` anywhere in the repo (verified: `grep -rln 'claude-plugin\|marketplace.json' src tools project-claude` returns only the audit docs).
- **Problem:** The reference (§4, opportunity #5) documents plugins + two Anthropic marketplaces as GA. `project-claude/` already contains exactly the plugin layout — `skills/`, `agents/`, `commands/`, `hooks/` (+ a `settings.json`) — yet the delivery mechanism is `node project-claude/install.cjs` copying into a gitignored `.claude/`. That copy model is the direct cause of the "`project-claude/` and local `.claude/` have already drifted" problem the ecosystem audit called out (its Scope note), and it means the core is not `/plugin`-installable, not versioned per-bump, and not discoverable through a marketplace. This is a tool whose entire premise is authoring skills/agents/cartridges — not shipping *itself* as a plugin is a conspicuous best-practice gap.
- **Recommendation:** Add a `.claude-plugin/plugin.json` (`name`, `version`, `description`, `author`) plus a repo-level `.claude-plugin/marketplace.json` that lists the core as a plugin, restructuring/symlinking so `skills/ agents/ commands/ hooks/hooks.json` sit at a plugin root. Keep `install.cjs` for legacy, but make `/plugin marketplace add <this-repo>` the recommended path. Bonus: expose `skill-creator export --plugin` so authored cartridges emit installable plugins (the `src/portability/portable-exporter.ts` already has a platform-adapter seam and currently knows nothing about plugins).
- **Verify:** `claude plugin validate .` passes; `claude --plugin-dir .` loads the core skills namespaced; `/plugin` lists it.

### CC-2 — Shipped settings register a hook on the non-existent event `SubagentSpawn`
- **Severity:** high · **Category:** bug · **Effort:** S
- **Location:** `project-claude/settings.json:103` (`"SubagentSpawn"` block); installed `.claude/settings.json:346` carries it too, *alongside* a separate `SubagentStart` block at `:313`.
- **Problem:** The reference hook catalog (§3) lists `SubagentStart`/`SubagentStop` — there is no `SubagentSpawn` event. The source `project-claude/settings.json` registers `tool-tracker.sh` under `SubagentSpawn` only. The installed tree has both `SubagentStart` (added at some later fix) and the stale `SubagentSpawn`, which proves the intended event is `SubagentStart`. As shipped from source, the subagent-spawn telemetry hook **never fires** — Claude Code ignores the unknown key. This is dead observability that the OGA-034 telemetry design (surfaced in `graphify-out`) assumes is live.
- **Recommendation:** Rename the `SubagentSpawn` block to `SubagentStart` in `project-claude/settings.json` (and drop the duplicate once installed trees re-sync). Optionally add a settings-lint step that checks hook event names against a known-events allowlist.
- **Verify:** After edit, `SubagentSpawn` appears nowhere in `project-claude/`; spawn a subagent and confirm `tool-tracker.sh` writes a trace line.

### CC-3 — Skill validator hard-rejects descriptions over 1024 chars (upstream no longer caps there)
- **Severity:** high · **Category:** alignment · **Effort:** M
- **Location:** `src/validation/skill-validation.ts:416` (`.max(1024, 'Description must be 1024 characters or less')`) and `:495` (`z.string().max(1024)` in `SkillMetadataSchema`); `validateSkillInput` **throws** on violation (`:463`).
- **Problem:** The reference (Notes → Repo-relevant drift) states current official docs do **not** state a 1024 hard cap — the real behavior is a **1,536-char listing truncation of `description` + `when_to_use` combined**. Our validator throws on a 1025-char description that Claude Code accepts and merely truncates in the listing. Because `create`/`update` route through `validateSkillInput`, the tool refuses to author or ingest an upstream-valid skill. (This is distinct from the ecosystem audit's C4, which corrected an *invented 250-char cap in a skill body*; that finding said the bound "is 1-1024" as a conservative guideline — but the guideline is now baked into code as a *hard throw*, which is the defect here.)
- **Recommendation:** Either (a) raise the hard cap to 1536 and validate the `description`+`when_to_use` *combined* length, or (b) keep 1024 as a *warning* (advisory) and only hard-fail above 1536. Preferred: track the combined listing budget so authors get the real signal. Keep the `.passthrough()` behavior — unknown fields already survive, good.
- **Verify:** `validateSkillInput({name:'x', description:'a'.repeat(1200)})` no longer throws; a 1600-char combined description+when_to_use warns/fails per chosen policy. `skill-frontmatter-doctor.mjs:112` carries the same stale `1-1024` bound — update in lockstep.

### CC-4 — `when_to_use` is unsupported end-to-end (type, validator, generators, docs)
- **Severity:** medium · **Category:** gap · **Effort:** M
- **Location:** absent from `src/types/skill.ts` (`SkillMetadata`, lines 18-33), `src/validation/skill-validation.ts` `SkillInputSchema` (fields list `:411-450`), `src/detection/skill-generator.ts`, `src/discovery/skill-drafter.ts`, `docs/OFFICIAL-FORMAT.md`, `docs/SKILL-FORMAT.md`; `grep -rln when_to_use project-claude examples` returns nothing.
- **Problem:** The reference makes `when_to_use` the idiomatic home for trigger phrases (appended to `description`, counts toward the 1,536-char listing budget). Its absence is the *root cause* of the recurring "triggers packed into `description` and truncated" defect class the ecosystem audit fixed piecemeal (its P6 + the whole `skill-frontmatter-doctor` motivation). Because the schema `.passthrough()`es, an author *can* write `when_to_use` and it survives, but nothing emits it, validates its combined budget, or documents it — so the tool keeps steering triggers into `description`.
- **Recommendation:** Add `when_to_use?: string` to `SkillMetadata` and `SkillInputSchema`; have `skill-generator`/`skill-drafter` emit trigger phrases into `when_to_use` instead of appending to `description`; document it in both format docs; teach `skill-frontmatter-doctor` to prefer `when_to_use` for triggers and to sum the two toward 1536.
- **Verify:** Generate a skill from a multi-trigger draft → triggers land in `when_to_use`, `description` stays a clean capability statement; validator sums both against 1536.

### CC-5 — `OFFICIAL-FORMAT.md` / `SKILL-FORMAT.md` are a stale subset of the current surface
- **Severity:** medium · **Category:** best-practice · **Effort:** M
- **Location:** `docs/OFFICIAL-FORMAT.md:61-72` (skill field table), `:219-229` (agent field table), `:68` (skill `model` enum); `docs/SKILL-FORMAT.md:85-96` (official-field table).
- **Problem:** Measured against the reference (§1-§4), the format docs omit a large slice of the documented surface:
  - **Skill fields missing:** `when_to_use`, `disallowed-tools`, `effort`, `arguments` (only `argument-hint` is listed). No mention of the 1,536-char listing truncation, of dynamic context injection (`` !`cmd` ``), or of `${CLAUDE_PROJECT_DIR}`/`${CLAUDE_SKILL_DIR}` placeholders.
  - **Agent fields missing:** `isolation: worktree`, `memory`, `maxTurns`, `mcpServers`, `background`, `effort`, `initialPrompt`; the `skills:` note doesn't say it *preloads full content*; `model` enum (`:225`) lists `sonnet/opus/haiku/inherit` but omits `fable` and full model-ids, and doesn't state the default is `inherit`.
  - **Structural model missing:** the "custom **commands merged into skills**" consolidation — the repo still teaches a separate `.claude/commands/` mental model (INTEGRATION.md, manifest `commands/*`), never noting a skill and same-named command now resolve to one `/name` with the skill winning.
  - **No hooks event catalog** (~30 events) and **no plugin/marketplace section** at all.
  - `SKILL-FORMAT.md:89` "official fields" table likewise omits `when_to_use`, `effort`, `disallowed-tools`, `context`/`agent`.
- **Recommendation:** Bring both docs up to the reference: add the missing fields with the "grants-not-restricts" note for `allowed-tools`, the 1,536 listing note, the commands-merged-into-skills paragraph, a hooks-events appendix (or link), and a plugins section. Cite the reference doc as the provenance.
- **Verify:** Diff the doc's field tables against the reference §1/§2 tables — no documented field is absent without a deliberate "intentionally omitted" note.

### CC-6 — 60+ app `feature_flags` are stored inside the Claude Code `settings.json`
- **Severity:** low · **Category:** tech-debt · **Effort:** M
- **Location:** `project-claude/settings.json:190-235` (`feature_flags` block); read by `src/drift/*.ts` (e.g. `task-drift-monitor.ts:20`, `context-entropy.ts:31`, `temporal-retrieval.ts:20`) which resolve flags out of `.claude/settings.json`.
- **Problem:** `.claude/settings.json` is the Claude Code harness config file with a published schema (`json.schemastore.org/claude-code-settings.json`). `feature_flags` and `statusLine`-adjacent app state are not schema keys; today CC ignores unknown keys, but the reference documents tightening managed-policy knobs (`requiredMinimumVersion`, `allowManagedPermissionRulesOnly`, `strictKnownMarketplaces`) and a `disableAllHooks`/validation trajectory. Coupling 60+ app flags to the harness file is fragile, and it bloats the very file that `gsd-config-guard.js` hard-blocks Claude from editing — meaning flag changes must bypass the guard.
- **Recommendation:** Relocate app feature flags to a dedicated app config (e.g. `.gsd/feature-flags.json` or `gsd-skill-creator.config.json`) and point `src/drift/*` at it; keep `.claude/settings.json` limited to hooks/permissions/statusLine/model. Document the move.
- **Verify:** `src/drift/*` tests still resolve flags from the new path; `.claude/settings.json` contains only CC-schema keys.

### CC-7 — `INTEGRATION.md` documents hooks with `.sh` names that ship as `.cjs`
- **Severity:** low · **Category:** gap · **Effort:** S
- **Location:** `docs/INTEGRATION.md:85-87` (`session-state.sh`, `validate-commit.sh`, `phase-boundary-check.sh`), `:101` and `:125` ("Create a shell script … `your-hook.sh`", "Run `bash .claude/hooks/your-hook.sh`").
- **Problem:** The actual shipped hooks are Node `.cjs` files (`project-claude/hooks/session-state.cjs`, `validate-commit.cjs`, `phase-boundary-check.cjs`), registered as `node .claude/hooks/*.cjs` in `settings*.json`. The doc's troubleshooting step tells a user to `bash .claude/hooks/session-state.sh`, which does not exist — actively misleading. Also the "add a hook" recipe implies shell-only.
- **Recommendation:** Update the three hook names to `.cjs`, fix the `bash …` troubleshooting invocation to `node …`, and note hooks may be `.cjs`/`.js`/`.sh`.
- **Verify:** Every hook filename in INTEGRATION.md resolves under `project-claude/hooks/`.

### CC-8 — Command-style skills take arguments but emit no `argument-hint`/`arguments` (autocomplete blind)
- **Severity:** low · **Category:** improvement · **Effort:** S
- **Location:** `src/detection/skill-generator.ts:66-71` only sets `argument-hint` when it detects a literal `$ARGUMENTS`; the shipped `sc:*`, `wrap:*` command/skill families and most `commands/gsd/*` provide none (`grep -rln argument-hint project-claude` → only `commands/gsd/plan-review-convergence.md`).
- **Problem:** Reference opportunity #2: argument-taking commands ship without `argument-hint`, so `/`-autocomplete gives users nothing, and the newer named-`arguments` field is never emitted. This is a cheap authoring win the validator could even *require* for `disable-model-invocation: true` skills that consume positional args.
- **Recommendation:** Broaden `skill-generator` to infer `argument-hint` from `$1`/`$name`/`$ARGUMENTS` usage in the body and support the `arguments:` named list; add an advisory `skill-frontmatter-doctor` check ("user-invocable skill references `$1` but declares no argument-hint").
- **Verify:** Regenerate an `sc:*` command that reads `$1` → frontmatter gains an `argument-hint`.

## New-function / capability opportunities

1. **Plugin/marketplace export (CC-1 elevated).** Beyond packaging the core, a
   `skill-creator export --plugin <cartridge>` that emits
   `.claude-plugin/plugin.json` + layout would let every authored cartridge ship
   as an installable, versioned plugin — the natural next rung above the current
   copy-install model, and a direct fit for `src/portability/`.
2. **`context: fork` + `agent:` as native orchestration in cartridge-forge.**
   Skills that today instruct "spawn a subagent and…" can declare `context: fork`
   / `agent: Explore` and let the harness run the body as a subagent. Surface
   this in cartridge-forge guidance and let the generator emit it.
3. **`isolation: worktree` for sc-dev-team / fleet-mission agents.** Native
   subagent worktree isolation now exists and can replace the bespoke
   `worktree-init.cjs`/`worktree-cleanup.sh` scripting in the orchestration
   chipsets.
4. **`disallowed-tools` (skill) for background/autonomous loops.** The
   security-hygiene story is allow-only; a positive `disallowed-tools` on
   background skills (e.g. strip `AskUserQuestion`) is now first-class and
   unsupported in `SkillMetadata`.
5. **Settings/hooks lint tool.** A small `tools/settings-lint.mjs` that validates
   hook event names against the known-events list and flags non-schema top-level
   keys would have caught CC-2 and CC-6 mechanically.

## Notes

- The Zod skill schema uses `.passthrough()` (`skill-validation.ts:451`), so
  unknown upstream fields (`when_to_use`, `disallowed-tools`, `effort`) are
  *preserved* rather than rejected — good. The only hard-reject risk is the
  `description.max(1024)` throw (CC-3). Agent-side `disallowedTools` is already
  supported (`src/types/agent.ts:145`, `agent-validation.ts:74`).
- Do **not** re-litigate the ecosystem audit's R2 (gsd-* agents omitting `model:`
  is the intended GSD model-profile convention, not a defect) — I did not flag it.
- The `.claude/settings.json` in the working tree has heavy duplication
  (multiple `self-mod-guard`/`git-add-blocker` registrations, both `SubagentStart`
  and `SubagentSpawn`). That is *install-merge drift* in the gitignored local
  tree, not a source defect; the source of truth is
  `project-claude/settings.json` + `settings-hooks.json`. Only CC-2 (the
  `SubagentSpawn` name in the source) is a shipped defect.
- Method: read against `docs/audits/2026-07-06-review-cc-features-reference.md`;
  every claim verified by reading `project-claude/`, `src/validation/`,
  `src/types/`, `src/detection/`, and the format docs, plus targeted greps.
