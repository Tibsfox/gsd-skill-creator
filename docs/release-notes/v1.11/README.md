# v1.11 — GSD Integration Layer

**Released:** 2026-02-12
**Scope:** non-invasive integration connecting skill-creator's adaptive learning loop to GSD's workflow lifecycle
**Branch:** dev → main
**Tag:** v1.11 (2026-02-12T08:08:07-08:00) — "GSD Integration Layer"
**Predecessor:** v1.10 — Security Hardening
**Successor:** v1.12 — GSD Planning Docs Dashboard
**Classification:** integration release — wrappers, hooks, slash commands, passive monitors
**Phases:** 82–87 (6 phases) · **Plans:** 16 · **Requirements:** 40
**Stats:** 32 commits · 42 files changed · 8,587 LOC added · 298 tests
**Verification:** idempotent installer · `--uninstall` reverses integration · `<100 ms` post-commit hook · graceful degradation on every wrapper

## Summary

**v1.11 is the first release where skill-creator and GSD meet without either side reaching into the other.** Every prior version treated skill-creator as a standalone adaptive-learning system and GSD as a standalone project-management workflow; v1.11 adds the connective tissue — a config file, an install script, a git hook, six slash commands, four wrapper commands, and a passive monitor — and does it all without modifying a single GSD command or agent. The architectural contract is explicit: if skill-creator breaks, GSD continues working normally. The integration can only be neutral or positive; it cannot be negative. That one-way coupling is the load-bearing design decision of the release, and it shapes every other choice in phases 82 through 87.

**`.planning/skill-creator.json` is the integration's single source of truth.** Phase 82 shipped a Zod-validated config file with per-feature boolean toggles (`suggestions_enabled`, `auto_load_enabled`, `monitoring_enabled`, `observation_enabled`), token-budget bounds, observation retention limits, and an opt-out model where missing keys default to safe, conservative values. The CLI grew a `skill-creator config validate` subcommand and a `config show` subcommand so operators can inspect the live config without grepping. Shipping the config as a first-class artifact — validated on every read, with sensible defaults and a versioned schema — means every subsequent integration feature has a stable place to live. Later releases that add toggles (monitoring scan cadence, hook verbosity, digest retention) inherit the Zod validation and the opt-out philosophy by construction.

**The install script became the integration's deployable contract.** Phase 83 extended `project-claude/install.cjs` to deploy eight new artifacts atomically: three stub slash commands (`sc:start`, `sc:status`, `sc:suggest`), three stub wrapper commands (`wrap:execute`, `wrap:verify`, `wrap:plan`), a POSIX post-commit hook, and an observer agent — all routed through the existing manifest so the installer's idempotency guarantees apply uniformly. A new `--uninstall` flag removes every deployed artifact in reverse order while preserving `.planning/patterns/` observation data, which operators need for audit even after integration is removed. Post-install validation then reports the status of each component so failures are visible, not silent. The installer is the reason integration can be reversible; the reason it can be reversible is that every install action is idempotent and every uninstall action is selective.

**The POSIX post-commit git hook shipped at <100 ms with zero network calls.** Phase 84 landed a shell hook (not Node, not Python — POSIX shell, so it runs everywhere git runs) that captures commit SHA, message subject, author, timestamp, and current phase number (extracted from `STATE.md`) into `sessions.jsonl`. The performance budget matters because hooks that slow down commits get disabled by frustrated users; the hook that gets kept is the hook that doesn't cost anything. Graceful degradation is built in: if `.planning/patterns/` is missing, the hook exits 0 without writing. If `STATE.md` is malformed, the hook writes what it has and moves on. A broken hook should never break a commit, so this hook never does.

**Six `/sc:` slash commands turned the observation pipeline from invisible to interactive.** Phase 85 landed `/sc:start` (warm-start session briefing with GSD position, recent history, pending suggestions, active skills, token budget), `/sc:status` (per-skill token breakdown and total budget usage), `/sc:suggest` (interactive accept/dismiss/defer review of pending skill suggestions), `/sc:observe` (current session observation snapshot), `/sc:digest` (learning digest from `sessions.jsonl` — patterns, activation history, phase trends), and `/sc:wrap` (meta-command explaining the four wrapper commands). Each command follows a shared structural pattern — same frontmatter shape, same step numbering, same error-handling contract — which is why the test suite validates them with structural assertions rather than full end-to-end execution. The command surface is wide (six commands here plus four wrappers = ten total); that breadth is the release's most honest trade-off and is called out explicitly in the retrospective.

**Four `/wrap:` wrapper commands bracketed every GSD lifecycle transition.** Phase 86 shipped `/wrap:plan` (load planning skills before `/gsd-plan-phase`), `/wrap:execute` (load skills before, record observations after `/gsd-execute-phase`), `/wrap:verify` (load skills before, record observations after `/gsd-verify-work`), and `/wrap:phase` (smart router that detects phase state and delegates to the appropriate wrapper). The wrapper contract is strict: the wrapper prepares context, delegates to the underlying GSD command, records observations, and returns. If skill loading fails, the wrapper logs and continues — the GSD command runs normally. This is the "integration can never make things worse" guarantee made operational. The smart-router in `/wrap:phase` reads `STATE.md` and picks the right wrapper automatically, which means operators who don't want to memorize four wrapper names can use one.

**Passive monitoring landed as the integration's listening ear.** Phase 87 shipped three detectors over shared artifacts — `plan-summary-differ.ts` (structural diff of `PLAN.md` vs `SUMMARY.md` for completed phases, classifying scope changes as `on_track` / `expanded` / `contracted` / `shifted`), `state-transition-detector.ts` (parses `STATE.md` and emits `phase_complete` / `phase_started` / `blocker_added` / `blocker_resolved` / `status_change` events), and `roadmap-differ.ts` (structural diff of `ROADMAP.md` across snapshots for additions, removals, reordering, and status transitions). A `scanner.ts` orchestrator coordinates the three detectors with error isolation (one detector failing does not block the others), persists results via `observation-writer.ts` (appends JSONL with enforced `type: "scan"` and `source: "scan"` provenance), and is triggered on-demand by the slash and wrapper commands. Scan-on-demand rather than background polling means idle sessions consume zero resources — the monitor listens only when asked.

**298 tests across six phases is the test density the integration deserves.** Integration code touches two systems, so it is the highest-risk code in the codebase. The test count breaks down by phase: 72 tests for config + installer (phases 82–83), 13 for the git hook (phase 84), 63 for slash commands (phase 85), 83 for wrappers (phase 86), and 67 for passive monitoring (phase 87). Structural validation tests run against every slash and wrapper command file to enforce the shared frontmatter shape, step numbering, and error-handling contract — a cheap way to catch drift across ten commands. The monitoring tests are conventional unit tests against parsers and differs. Integration tests cover the post-commit hook against a fixture repository. Every phase shipped with a `test(...):` commit landing before the `feat(...):` commit that implemented the behavior, which is TDD-as-discipline rather than TDD-as-ritual.

**The release philosophy is "mediation, not modification."** v1.11 is not a GSD feature release and not a skill-creator feature release — it is an integration release, and integration is mediation. The config mediates between skill-creator and GSD settings. The installer mediates between user intent and deployed artifacts. The git hook mediates between git's commit-event output and skill-creator's observation input. The slash commands mediate between operator questions and system state. The wrapper commands mediate between GSD lifecycle events and skill-creator's adaptive loop. The passive monitor mediates between shared artifacts (`STATE.md`, `ROADMAP.md`, `PLAN.md`, `SUMMARY.md`) and the observation store. Mediation means no forked copies of GSD, no patched GSD commands, no runtime monkey-patching — just adapters at the seams. The v1.10 hardened substrate (safe YAML, checksummed JSONL, path validation) is the foundation these adapters sit on; everything v1.11 writes is written through v1.10's safety gates.

## Key Features

| Area | What Shipped |
|------|--------------|
| Integration config (Phase 82) | `.planning/skill-creator.json` with Zod schema, per-feature toggles, token-budget bounds, observation retention, opt-out defaults |
| Integration config (Phase 82) | `skill-creator config validate` + `config show` CLI subcommands for inspection and verification |
| Install script (Phase 83) | Idempotent deployment of 8 integration artifacts (3 `/sc:` stubs, 3 `/wrap:` stubs, git hook, observer agent) via existing manifest |
| Install script (Phase 83) | `--uninstall` flag with selective component removal; preserves `.planning/patterns/` observation data |
| Install script (Phase 83) | Post-install validation reports status of each component so failures are visible, not silent |
| Post-commit hook (Phase 84) | POSIX shell hook — `<100 ms` execution, zero network calls, graceful degradation on missing `.planning/patterns/` or malformed `STATE.md` |
| Post-commit hook (Phase 84) | Captures SHA, subject, author, timestamp, and current phase number into `sessions.jsonl` |
| Slash commands (Phase 85) | `/sc:start` warm-start briefing (GSD position, recent history, pending suggestions, active skills, token budget) |
| Slash commands (Phase 85) | `/sc:status` + `/sc:suggest` + `/sc:observe` + `/sc:digest` + `/sc:wrap` — per-skill token usage, interactive suggestion review, session snapshot, learning digest, meta-help |
| Wrapper commands (Phase 86) | `/wrap:plan`, `/wrap:execute`, `/wrap:verify` — bracket GSD lifecycle transitions with skill loading before and observation capture after |
| Wrapper commands (Phase 86) | `/wrap:phase` smart router reads `STATE.md` and delegates to the appropriate child wrapper |
| Wrapper commands (Phase 86) | Graceful-degradation contract: if skill loading fails, the GSD command runs normally; the wrapper logs and continues |
| Passive monitoring (Phase 87) | `plan-summary-differ.ts` — structural diff of `PLAN.md` vs `SUMMARY.md`, scope classification: `on_track` / `expanded` / `contracted` / `shifted` |
| Passive monitoring (Phase 87) | `state-transition-detector.ts` — parses `STATE.md`, emits `phase_complete` / `phase_started` / `blocker_added` / `blocker_resolved` / `status_change` |
| Passive monitoring (Phase 87) | `roadmap-differ.ts` — structural diff of `ROADMAP.md` (phase additions, removals, reordering, status transitions) |
| Passive monitoring (Phase 87) | `scanner.ts` orchestrator with error isolation + `observation-writer.ts` with enforced `type: "scan"` / `source: "scan"` provenance (MON-04) |
| Test coverage | 298 tests across 6 phases (72 + 13 + 63 + 83 + 67); structural validators for all 10 slash/wrapper commands |

## Retrospective

### What Worked

- **Non-invasive integration is the correct architectural choice.** Wrapper commands, git hooks, passive monitoring, and slash commands connect skill-creator to GSD without modifying any GSD command or agent. If skill-creator breaks, GSD continues working normally. This asymmetry — skill-creator can depend on GSD, GSD does not depend on skill-creator — is a property that took six phases to achieve and is cheap to maintain thereafter.
- **Idempotent install script with `--uninstall` makes integration reversible.** The installer can be run many times without clobbering user modifications, and uninstall preserves observation data for audit. Reversibility is a trust contract: operators who can remove the integration cleanly will install it more willingly.
- **298 tests across 6 phases is justified density for integration code.** Integration code touches two systems, so its defect cost is doubled. Structural-validator tests for the ten slash/wrapper commands caught format drift cheaply; conventional unit tests covered the parsers and differs; integration tests covered the post-commit hook against a fixture repository.
- **Post-commit hook at <100 ms with zero network calls shows operational discipline.** Hooks that slow down commits get disabled. The performance constraint ensures the hook stays enabled, which means the observation pipeline gets fed. A fast hook that writes nothing new is better than a slow hook that writes everything.
- **TDD-as-discipline across all six phases.** Every `feat(...)` commit was preceded by a `test(...)` commit; the git log for v1.11 reads as a chain of failing-tests-then-passing-implementations. The test suite grew 298 tests in a release that shipped 8,587 LOC, which is one test per ~29 lines — a dense ratio appropriate for integration surface.

### What Could Be Better

- **Six `/sc:` commands plus four `/wrap:` commands is a wide surface.** `/sc:start`, `/sc:status`, `/sc:suggest`, `/sc:observe`, `/sc:digest`, `/sc:wrap`, `/wrap:execute`, `/wrap:verify`, `/wrap:plan`, `/wrap:phase` — ten new commands in one release. A single entry point with subcommands would be more discoverable. This was called out at release time and later addressed in v1.42's consolidation work.
- **Plan-vs-summary diffing assumes consistent plan formatting.** If `PLAN.md` and `SUMMARY.md` use different heading structures or different `files_modified` conventions, the diff produces false positives. The release shipped a `scope change` classifier that is only as reliable as the input artifacts; the v1.12 dashboard work later imposed the structural consistency the differ needs.
- **The integration surface spans three languages and four artifact types.** TypeScript for the monitoring library, POSIX shell for the git hook, Markdown-with-frontmatter for the slash/wrapper commands, JSON for the config. Each interface is the right tool for its niche, but an operator debugging an end-to-end flow has to read three syntaxes. This is a realistic cost of "mediation, not modification" and was accepted by the team as preferable to collapsing layers for uniformity.
- **Observation cardinality is not yet bounded at the scanner layer.** Every slash and wrapper invocation triggers a scan, which appends to `sessions.jsonl`. On a busy session the file grows quickly. v1.10's `purge` CLI is the operator's escape valve, but an inline rate limit or debouncer at the scanner would be cleaner. Flagged for a subsequent release.

## Lessons Learned

1. **Graceful degradation is the integration contract.** If skill loading fails, the wrapped GSD command runs normally. This makes the integration strictly neutral-or-positive and gives operators permission to enable it without fear of regression in their primary workflow.
2. **Scan-on-demand beats background polling for passive monitoring.** Triggering scans from slash and wrapper commands rather than a daemon means idle sessions consume zero resources and active sessions pay proportional cost. Background polling would have been simpler to implement but more expensive to run.
3. **Shared artifacts are the cheapest integration point.** `STATE.md`, `ROADMAP.md`, `PLAN.md`, `SUMMARY.md` are all documents both systems already read. Detecting state changes by diffing artifacts skips the need for new IPC, pub/sub, or event buses. Two systems can agree on a file without agreeing on anything else.
4. **Idempotent install + selective uninstall is the minimum bar for optional integrations.** Optional means removable. Removable means the operator needs confidence that removing it leaves the project in a known-good state. Idempotency on install and selectivity on uninstall together give that confidence.
5. **Performance budgets on hooks are enforcement, not optimization.** A git hook at `<100 ms` gets kept; a git hook at `>500 ms` gets disabled by the first user whose commit feels slow. The budget is what protects the hook from being rejected in the field.
6. **TDD cadence per-phase produces auditable history.** Every phase's `test(...)` commit before its `feat(...)` commit means the git log itself is the test plan. A reviewer can step through commits in order and see each test land red before the implementation lands it green. This is cheaper documentation than a separate test design doc.
7. **Structural validation catches command-file drift at test speed.** Ten slash/wrapper commands share frontmatter shape, step numbering, and error-handling boilerplate. A structural-assertion test against each file catches drift in milliseconds — no need for end-to-end execution, no test fixtures required. For file-based interfaces, structural tests are the right tool.
8. **Mediation over modification scales.** Once the seam is defined (config, hook, slash, wrapper, monitor), new capabilities plug into the seam rather than patching the core. v1.11's five seam types became templates for every subsequent integration in the project. Defining the seams well at v1.11 bought architectural savings at every release after.
9. **Wide command surfaces are honest signals that consolidation is owed.** Shipping ten new commands in one release is a retrospective liability; pretending it is not a liability compounds it. Calling it out in the release notes and scheduling the consolidation for a later milestone (v1.42) is how discipline around command surface grows over time.
10. **Provenance fields on observation records are cheap insurance.** `type: "scan"` and `source: "scan"` on every scanner-written JSONL record mean downstream queries can filter confidently. Adding the provenance fields costs nothing at write time and saves every future consumer from guessing the origin of a record.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.0](../v1.0/) | Root of the adaptive loop this release integrates; `.planning/patterns/` JSONL primitive is what the post-commit hook appends to |
| [v1.5](../v1.5/) | Pattern discovery — the observation records fed by v1.11's hook and monitor are the input to v1.5's detection |
| [v1.7](../v1.7/) | GSD Master Orchestration Agent — the lifecycle events the `/wrap:` commands bracket are exposed by v1.7's orchestrator |
| [v1.8](../v1.8/) | Capability-aware planning — `/wrap:plan` loads the capability-aware context v1.8 introduced |
| [v1.8.1](../v1.8.1/) | Audit baseline — every integration artifact follows the v1.8.1 path-validation conventions |
| [v1.10](../v1.10/) | Predecessor — the hardened substrate (safe YAML, checksummed JSONL, path validation) that every v1.11 write passes through |
| [v1.12](../v1.12/) | Successor — GSD Planning Docs Dashboard consumes the observation records v1.11 produces; imposed the structural consistency the differ depends on |
| [v1.13](../v1.13/) | Session Lifecycle & Workflow Coprocessor — directly extends v1.11's `/wrap:phase` smart router |
| [v1.17](../v1.17/) | Staging Layer — uses the same observation-writer pattern for approval-queue records |
| [v1.24](../v1.24/) | GSD Conformance Audit — validates the integration contract v1.11 established across the full project |
| [v1.25](../v1.25/) | Ecosystem Integration — 20-node DAG extends v1.11's seam model to cross-system dependencies |
| [v1.31](../v1.31/) | GSD-OS MCP Integration — applies v1.11's mediation pattern at the MCP boundary |
| [v1.42](../v1.42/) | Addressed the "wide command surface" finding from v1.11's retrospective |
| `.planning/skill-creator.json` | Integration config — single source of truth introduced in this release |
| `.planning/patterns/sessions.jsonl` | Observation store written by post-commit hook and passive scanner |
| `.planning/MILESTONES.md` | Canonical v1.11 phase-by-phase detail (phases 82–87, 16 plans, 40 requirements) |

## Engine Position

v1.11 is the point at which skill-creator stopped being a neighbor to GSD and became a coprocessor for it. Every subsequent milestone in the v1.x line that touches workflow — v1.12's dashboard, v1.13's session-lifecycle work, v1.17's staging layer, v1.20's dashboard assembly, v1.24's conformance audit, v1.25's ecosystem DAG, v1.28's den operations, v1.31's MCP integration, v1.33's OpenStack platform, v1.38's SSH agent sandbox, v1.39's GSD-OS bootstrap — assumes the v1.11 integration seam. The five seam types (config, installer, hook, slash command, wrapper command) became templates the project applied at every later system boundary. Most importantly, the "mediation, not modification" principle — that integration should adapt at the edges rather than patch the core — became a project-wide architectural norm from v1.11 forward. The test-density ratio (one test per ~29 LOC) also set the expectation that integration code is high-risk code and deserves disproportionate coverage. Every release after v1.11 inherits both the seams and the standard.

## Files

- `.planning/skill-creator.json` — integration config (new in this release); Zod-validated, per-feature toggles, opt-out defaults
- `src/integration/config/` — Zod schema + reader + barrel exports (phase 82)
- `src/integration/monitoring/` — passive monitoring library: `plan-summary-differ.ts` (355 lines), `state-transition-detector.ts` (231 lines), `roadmap-differ.ts` (179 lines), `scanner.ts` (288 lines), `observation-writer.ts` (76 lines), `types.ts` (184 lines), `index.ts` barrel (35 lines)
- `src/integration/monitoring/*.test.ts` — 67 monitoring tests (plan-summary, state transitions, roadmap diff, scanner orchestration)
- `project-claude/commands/sc/start.md` + `status.md` + `suggest.md` + `observe.md` + `digest.md` + `wrap.md` — six `/sc:` slash commands (phase 85)
- `project-claude/commands/wrap/execute.md` + `verify.md` + `plan.md` + `phase.md` — four `/wrap:` wrapper commands (phase 86)
- `project-claude/hooks/post-commit` — POSIX shell hook, `<100 ms`, zero network (phase 84)
- `project-claude/install.cjs` — extended installer with idempotent deployment, `--uninstall`, post-install validation (phase 83)
- `.planning/patterns/sessions.jsonl` — observation store written by post-commit hook and passive scanner
- `.planning/MILESTONES.md` — canonical v1.11 phase-by-phase detail (phases 82–87, 16 plans, 40 requirements)
- Across phases 82–87: 32 commits, 42 files, 8,587 LOC added, 298 tests
