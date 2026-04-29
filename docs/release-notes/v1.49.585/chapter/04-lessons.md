# 04 — Lessons Learned: v1.49.585 Forward Lessons

## 7 forward lessons emitted (#10168–#10174)

These lessons are added to the cumulative lessons-learned database for application by future milestones.

### Process / cadence lessons (apply to ship-pipeline architecture)

**Lesson #10168 — Counter-cadence cleanup-mission pattern is operationally productive every ~30 forward milestones.**
Severity: HIGH. Periodically pausing forward-cadence ship velocity to convert accumulated social-rule debt into deterministic gates pays back at every subsequent forward ship. Cost: ~5-7 hours wall-clock per cleanup sprint when the source vision is a same-day codebase audit (`.planning/codebase/CONCERNS.md`-shaped output). Payback: lower friction on every subsequent forward ship + meta-tested confidence boost. Recommended trigger: when a CONCERNS-style audit surfaces ≥3 categories of social-rule debt OR when a single category has a documented violation history. Forward cadence target: ~v1.49.615 (next cleanup-mission window). Pattern is registered as a NEW operational-cadence thread (not a §6.6 process variant); cadence-thread state will be tracked at counter-cadence ship times.

**Lesson #10169 — Gate-not-vigilance discipline.**
Severity: HIGH. When a social rule has been violated even once historically (e.g., v1.49.577-580 missing release-notes; accidental .planning commits in earlier milestones; agent-source drift between `.claude/agents/` and `project-claude/agents/`), the cost of converting it to a deterministic gate is paid back at the first re-violation. v1.49.585 proved the principle during its OWN execution: C01 self-mod-guard fired ≥7× during W1-W3, surfacing real false-positives that prose-only guidance would never have caught. Apply: when reviewing post-incident retrospectives, default to converting the offending rule into a gate rather than re-emphasizing the prose-version of the rule.

**Lesson #10170 — Meta-test strategy at ship time.**
Severity: HIGH. Run the newly-installed gates against the milestone's own release-notes / push / chapters during the ship pipeline. The system gating itself is the strongest signal that the gate is real; if the meta-test passes, the gate is integrated. Apply at every cleanup-mission's W4 ship: completeness gate against own release-notes; idempotent-write check against own chapters; pre-push BLOCK simulation + pre-push ALLOW on clean state. Pattern transfers to forward-cadence milestones that introduce gate-style invariants.

### Operational-discipline lessons (apply to mission-execution practice)

**Lesson #10171 — Architectural correction mid-mission: codebase-mapper outputs are starting points, not source-of-truth.**
Severity: MEDIUM. The CONCERNS audit's framing of `/media/foxy/ai/GSD/dev-tools/artemis-ii/` as a "sibling DEV-TOOLS PROJECT" was wrong; verification mid-session via `git worktree list` showed it's a git worktree of gsd-skill-creator's `artemis-ii` branch. The user pointed out the actual canonical .env lives at the project root. Apply: when a mission package contains filesystem-shape claims (e.g., "X is a sibling project", "Y lives at path Z", "the canonical .env is at W"), verify mid-mission against `git worktree list` / `git remote -v` / `git config --get` / `ls -la` before locking spec into final form. Treat audit outputs as starting points, not ground truth.

**Lesson #10172 — Scope-expansion mid-mission produces better outcome than scope-as-specified.**
Severity: MEDIUM. C08 was originally specced as "env-var override + fail-fast" (option B); user pivoted to "full deprecation" (option C) when reality contradicted the assumption that artemis-ii was a sibling-project. The result is a wrapper 30 lines shorter and structurally simpler. Lesson: when reality contradicts a spec, ask the user for direction rather than mechanically execute the original. The right move is to surface the discovery, present the fork in the road, and let the user decide. Pattern composes with #10158 (mid-flight fact corrections applied by main context).

### Hook + harness lessons (apply to hook authoring)

**Lesson #10173 — Hook self-tests must use `env -i` for full sterility.**
Severity: LOW. v1.49.585 hooks installed live in the harness during their own milestone execution; the C01 self-test then inappropriately inherited the parent shell's `SC_SELF_MOD=1` env when set. Future hook self-tests should always run under `env -i ...` for fully-sterile invocation, not just `env -u VAR`. Cosmetic for v1.49.585 (the live BLOCK events ≥7× prove the hook is functional at runtime); v1.49.586+ tweak. Apply: in any future hook self-test that gates on env-var presence, default to `env -i` invocation rather than depending on the parent shell's env not having that var set.

**Lesson #10174 — `.claude/settings.json` is correctly gsd-config-guard-protected; new hook registrations route through `project-claude/`.**
Severity: LOW. Edits to `.claude/settings.json` from Claude tool calls are BLOCKed by an existing pre-v1.49.585 hook (intentional). The right path for new hook registrations is via `project-claude/settings-hooks.json` + `node project-claude/install.cjs` (which spawns outside the hook layer and runs under `SC_INSTALL_CALLER=project-claude` allowlist). v1.49.585 added two hooks (C01 self-mod-guard + C02 git-add-blocker) via this route cleanly. Apply: future hook additions should follow the same pattern — author hook + register in `project-claude/settings-hooks.json` + run installer; never attempt direct edits to `.claude/settings.json`.

## Lessons-learned database state

- **Total lessons emitted to date:** 10174 (cumulative since corpus inception)
- **Lessons emitted this milestone:** 7 (#10168–#10174)
- **Lessons applied at v1.49.585 (from v1.49.584 lesson-set #10156-#10167):** 5 (#10156 combined-phase, #10158 mid-flight corrections, #10159 cross-track scorer specs → C06, #10160 MUS Phase C deliverables → C07, #10163 partial)
- **Open lessons watchlist (apply at next opportunity):** #10168 (counter-cadence cleanup pattern reuse at ~v1.49.615), #10169 (gate-not-vigilance: surface gate-able social rules in post-incident retros), #10170 (meta-test strategy: any future gate-introducing milestone), #10173 (env-i sterility refactor for v1.49.586+ hook self-tests).
