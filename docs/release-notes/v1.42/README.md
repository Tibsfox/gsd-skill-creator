# v1.42 — SC Git Support

**Released:** 2026-02-26
**Scope:** feature milestone — deterministic git workflows for skill-creator, built around a state machine, a two-gate model (pre-flight + HITL), branch and sync managers, deterministic shell scripts, and a progressive-disclosure git-workflow skill — plus the first installable CLI path (`sc install`) that bootstraps a skill-creator install from a URL
**Branch:** dev → main
**Predecessor:** v1.41 — Claude Code Integration Reliability
**Successor:** v1.43 — Gource Visualization Pack
**Tag:** v1.42 (2026-02-26T15:26:25-08:00) — "SC Git Support: Deterministic git workflows with state machine, HITL gates, branch/sync managers, and progressive disclosure skill (4 phases, 8 plans, 166 tests)"
**Classification:** feature — foundation release for git as a first-class module inside skill-creator
**Phases:** 394–397 (4 phases) · **Plans:** 8 · **Commits:** 17 (v1.41..v1.42) · **Files changed:** 51 · **LOC:** +10,117 / −5
**Verification:** tag message 166 tests (4-phase window) · README chapter aggregate 272 tests · two-gate safety model (pre-flight + HITL) enforced at every state transition · `@vitest/coverage-v8` baseline tooling wired in

## Summary

**v1.42 made git a first-class module inside skill-creator rather than an ad-hoc shell call.** Every prior release that touched a repository did so through one-off command invocations — spawn a process, parse the output, hope the state is what we think it is. That approach works exactly once; the second time it hits a detached HEAD, a worktree with a diverged branch, a rebase in progress, or a dirty index, the hope runs out. Phase 394–397 replaced the ad-hoc layer with a typed, state-machine-driven git module that treats every repository operation as a transition from one named state to another with explicit preconditions, postconditions, and a JSONL audit trail. The module lives at `src/git/` with 10,117 lines of new TypeScript and shell across eleven subdirectories (`core/`, `gates/`, `scripts/`, `workflows/`, plus the top-level `cli.ts`, `index.ts`, `schemas.ts`, `types.ts`). Seventeen commits closed four phases and eight plans. The retrospective honestly flags the thin test ratio for the attack surface this creates, but the architecture it establishes is what v1.43 and everything after can lean on.

**The state machine is the structural spine.** `src/git/core/state-machine.ts` defines a finite set of named git states — `Clean`, `Dirty`, `Detached`, `Rebasing`, `Merging`, `Conflicted`, `WorktreeDiverged`, among others — and a transition table that spells out which operations are legal from which state. An `install` operation is only legal from `Clean`; a `sync` that would overwrite uncommitted work is rejected from `Dirty`; a `gate-merge` from `Conflicted` fails early with a named error rather than half-succeeding and leaving the tree in a worse position. The 257 tests on the state-machine module exercise every declared transition plus every declared rejection — the latter matters as much as the former, because the failure modes are what protect the user's work. Pairing the state machine with the JSONL logger (`src/git/core/logger.ts`, 56 lines + 138 tests) means every transition is recorded as an append-only event record with timestamps, pre-state, post-state, operation, and outcome. A session that crashes mid-operation is recoverable by replaying the log; a post-hoc audit of what actually happened in a repository has a verifiable trail.

**The two-gate model separates mechanical safety from human judgment.** `src/git/gates/pre-flight.ts` (363 lines, 350 tests) runs before any mutating operation — it checks repository cleanliness, remote reachability, branch-protection status, and configuration invariants like `push.default=nothing` that prevent accidental wide-scope pushes. Pre-flight is deterministic: given a repository state, it produces a pass-or-fail decision with a named reason. If pre-flight fails, the operation is blocked at the mechanical layer with no further recourse — the system will not ask the user to override a deterministic safety check, because that pattern erodes the check's value every time it is exercised. `src/git/gates/hitl-gate.ts` (332 lines, 510 tests) runs after pre-flight and before commit-visible mutations that cross a trust boundary (merging to protected branches, pushing a PR, destructive operations like `--force`). The HITL gate is the human-in-the-loop layer: it surfaces a structured confirmation with the full list of what is about to happen, what the current state is, and what the post-state will be, and it refuses to proceed without explicit authorization. The division of labor is intentional — pre-flight blocks things that shouldn't happen ever; HITL blocks things that shouldn't happen without someone saying yes.

**Branch and sync managers are the workflow orchestrators.** `src/git/core/branch-manager.ts` (357 lines + 279 tests) encapsulates branch creation, switching, protection-status query, and worktree coordination. It knows the repository's naming conventions as structured config rather than ambient shell state, which means a `branch-work` workflow can reference branch intent (`feature/*`, `fix/*`, `release/*`) without re-parsing the branch name at every call site. `src/git/core/sync-manager.ts` (196 lines + 214 tests) encapsulates pull, push, fetch, and remote-tracking operations with pre-flight integration baked in — every sync call routes through the gate layer before touching the network. `src/git/core/repo-manager.ts` (210 lines + 209 tests) is the repository-level facade that the workflows call into for high-level state queries. The layering is straightforward: workflows call managers, managers call the state machine, the state machine calls the gates, the gates may invoke the deterministic shell scripts. Nothing reaches directly for a shell spawn except the scripts layer, which is where the non-determinism lives and where it is contained.

**Deterministic shell scripts make the raw git layer reproducible.** `src/git/scripts/git-state-check.sh` (172 lines) emits a structured JSON description of the current repository state — branch, HEAD SHA, detached-ness, rebase/merge-in-progress, worktree list, diverged-branch count, remote tracking state — in a single atomic call. `src/git/scripts/pr-bundle.sh` (78 lines) produces a review-ready bundle of changes for a pull request, avoiding the common trap of composing a PR description from unsynced local state. `src/git/scripts/safe-merge.sh` (92 lines) wraps merge operations with the state-check and gate semantics enforced in shell so that the script is usable outside the TypeScript module when that matters. `src/git/scripts/worktree-setup.sh` (37 lines) creates and registers a worktree with the conventions the branch manager expects. The 333 shell-scripts tests and 172 git-state-check tests pin the JSON output schema so that downstream TypeScript can depend on it structurally; `skills/git-workflow/scripts/validate.sh` (105 lines) re-exports the state-check entry point to the skill layer for pre-operation validation.

**The `sc install` command is the first CLI-level installer path.** `src/commands/sc-install.ts` (134 lines + 119 tests) parses an installation URL (GitHub owner/repo, optional branch, optional subpath), delegates to the install workflow at `src/git/workflows/install.ts` (278 lines + 296 tests), and bootstraps a skill-creator install into the current workspace. This is the first release where a user can take a URL and get a working skill-creator deployment without hand-assembling the directory layout, which is the shape of user-facing workflow that v1.43 and the later plugin-style pipelines need to build on. The install flow routes through the same state-machine + pre-flight + HITL stack as every other mutating operation, which means installing a skill-creator bundle can't clobber a dirty workspace by accident. `src/git/workflows/branch-work.ts`, `contribute.ts`, and `sync.ts` extend the workflow surface to the core contribution lifecycle — create a branch, do the work, sync with upstream, open a PR — with each step gated the same way.

**The progressive-disclosure git skill makes the module usable from the skill layer.** `skills/git-workflow/SKILL.md` (220 lines) documents the state machine, the command reference, the two-gate model, and the safety rules in the shape a Claude Code skill consumes, with reference expansions held in `references/plumbing.md` (64 lines, plumbing-vs-porcelain command table), `references/workflows.md` (236 lines, six deterministic workflow sequences), and `references/safety.md` (102 lines, eight safety rules with rationale). The skill is deliberately progressive — the top of `SKILL.md` is a short actionable summary; the depth sits behind reference links that the model loads only when a task in the given context requires it. This follows the skill-design discipline from the v1.41 reliability work: skills are not tutorials, they are decision guides surfaced at the right depth. The `K-01..K-08` skill-validation test set (215 lines in `test/git/skill-validation.test.ts`) enforces word-count budgets, token-budget limits, trigger-intent coverage, and reference-file well-formedness so that the skill itself doesn't drift out of the progressive-disclosure shape it started in.

**Coverage tooling and safety-critical tests closed the phase with a baseline.** Phase 397-02 added `@vitest/coverage-v8` to `package.json` as the project's first coverage-reporting dependency and shipped the S-01..S-12 safety-critical test set — twelve tests that exercise the specific failure modes the two-gate model is there to catch (`push.default=nothing` enforcement, blocked gates, no-`--force` rule, conflict abort, protected branches). The I-01..I-18 integration test set (1,078 lines) wires pre-flight + HITL + branch manager + sync manager + shell scripts + CLI registration together end-to-end, exercising the full contribution flow from repo open to PR bundle. The E-01..E-12 edge cases exercise network failure, worktree conflicts, and JSONL recovery. The retrospective honestly calls out that no coverage number was reported in the release itself — adding the tool and establishing a baseline is the deliverable, and the measured number is a v1.43+ follow-through. That is the v1.35-style "report the gap, don't paper it over" posture that the retrospective stream has consistently enforced.

**What v1.42 does not claim.** The release does not ship universal git support; it ships the specific subset of git operations that skill-creator's install, branch-work, contribute, and sync workflows need, plus the state machine that keeps them honest. Submodules, LFS, git-annex, and shallow clones are outside the scope. The release does not ship a coverage number against the new code; the tooling is in place and the measured baseline is a v1.43 deliverable. The release does not ship a git UI in the desktop webview; the Tauri config bump is a version sync, not a feature. The retrospective surfaces both gaps explicitly: 272 tests across the full aggregate is a thin ratio for the state-diversity git exposes, and coverage tooling without a reported number is a foundation investment whose payoff is downstream.

## Key Features

| Area | What Shipped |
|------|--------------|
| Git state machine (Phase 395-01) | `src/git/core/state-machine.ts` (276 lines) with typed state set (Clean, Dirty, Detached, Rebasing, Merging, Conflicted, WorktreeDiverged), transition table with explicit preconditions, and rejection paths for every illegal operation; 257 tests covering every declared transition and every declared rejection |
| JSONL audit logger (Phase 395-01) | `src/git/core/logger.ts` (56 lines) append-only event log with timestamps, pre-state, post-state, operation, outcome; session-crash replay recovery; 138 tests |
| Repository manager (Phase 395-01) | `src/git/core/repo-manager.ts` (210 lines) high-level state query and repo-level facade consumed by all workflows; 209 tests |
| Deterministic shell scripts (Phase 395-02) | `scripts/git-state-check.sh` (172 lines, JSON state emission), `scripts/pr-bundle.sh` (78 lines, review-ready bundle), `scripts/safe-merge.sh` (92 lines, gated merge wrapper), `scripts/worktree-setup.sh` (37 lines); 333 shell-scripts tests + 172 state-check tests pinning JSON schema |
| Install workflow + `sc install` CLI (Phase 396-01) | `src/commands/sc-install.ts` (134 lines) + `src/git/workflows/install.ts` (278 lines); URL parsing (owner/repo, branch, subpath), bootstrap flow into current workspace, routed through state machine + pre-flight + HITL; 119 command tests + 296 workflow tests |
| Branch manager (Phase 396-02) | `src/git/core/branch-manager.ts` (357 lines) branch creation/switching/protection-status query, structured naming conventions (feature/*, fix/*, release/*), worktree coordination; 279 tests |
| Sync manager (Phase 396-02) | `src/git/core/sync-manager.ts` (196 lines) pull/push/fetch/remote-tracking with pre-flight integration on every network-touching call; 214 tests |
| HITL gate (Phase 396-03) | `src/git/gates/hitl-gate.ts` (332 lines) human-in-the-loop confirmation layer for trust-boundary operations (protected-branch merges, PR push, destructive ops); surfaces structured pre/post-state summary; 510 tests — largest single test set in the release |
| Pre-flight gate (Phase 396-03) | `src/git/gates/pre-flight.ts` (363 lines) deterministic mechanical-safety checks — cleanliness, remote reachability, branch-protection, `push.default=nothing`; 350 tests |
| Contribution workflow (Phase 396-03) | `src/git/workflows/contribute.ts` (183 lines) + `branch-work.ts` (111 lines) + `sync.ts` (100 lines); full lifecycle create-branch → work → sync → PR, each step gated through pre-flight + HITL; 263 + 133 + 176 tests |
| Git workflow skill (Phase 397-01) | `skills/git-workflow/SKILL.md` (220 lines) + `references/plumbing.md` (64), `references/workflows.md` (236), `references/safety.md` (102); progressive disclosure — short SKILL.md + reference expansions loaded on demand; `scripts/validate.sh` (105 lines) re-exports state-check for skill-level pre-op validation |
| CLI command registration (Phase 397-01) | `src/git/cli.ts` (357 lines) `registerGitCommands()` returns 7 descriptors — install, status, sync, work, gate-merge, gate-pr, worktree-list; argument validation with unknown-flag rejection; injectable `CommandDeps` for testability |
| Coverage tooling (Phase 397-02) | `@vitest/coverage-v8` added to `package.json`, establishing the project's first coverage-reporting baseline — payoff is downstream coverage-gated quality checks |
| Safety-critical test set S-01..S-12 (Phase 397-02) | 541-line `test/git/safety.test.ts` exercising `push.default=nothing`, gate blocking, no-`--force`, conflict abort, protected branches |
| Integration test set I-01..I-18 (Phase 397-02) | 1,078-line `test/git/integration.test.ts` wiring pre-flight + HITL + managers + scripts + CLI end-to-end |
| Skill validation test set K-01..K-08 (Phase 397-02) | 215-line `test/git/skill-validation.test.ts` enforcing word-count budget, token budget, trigger intents, reference file well-formedness |

## Retrospective

### What Worked

- **Git as a typed state machine beats git as ad-hoc shell calls.** Named states, a transition table, and explicit preconditions make every git operation reproducible and every failure mode legible. The 257 state-machine tests cover both the legal transitions and the rejections; rejections are where the module's value lives.
- **The two-gate split (pre-flight + HITL) encodes the right separation.** Pre-flight is mechanical safety with no user-override path — a `push.default=nothing` violation is a hard stop, not a warning. HITL is the human-in-the-loop layer for trust-boundary operations. The division is intentional: mechanical checks that are overridable erode themselves; judgment checks that can't be bypassed block legitimate work.
- **JSONL audit logging gives the module its own replay trail.** Every state transition is an append-only record with pre-state, post-state, operation, outcome. A crashed session or a post-hoc audit both land on the same artifact. This is the same append-only-JSONL discipline v1.0 set for the pattern store.
- **Progressive-disclosure skill shape held.** `SKILL.md` is short and actionable; the three reference files carry the depth. The K-01..K-08 validation tests enforce word-count and token-budget bounds so the skill doesn't drift into tutorial shape in a later refinement.
- **Install flow is the first URL-to-working-install path.** `sc install <url>` parses an owner/repo/branch/subpath URL and bootstraps a working deployment through the same gated state machine as every other operation. This is the shape later plugin-style pipelines can build on.
- **Shell scripts as JSON-emitting primitives keep the TypeScript layer honest.** `git-state-check.sh` returns a structured JSON state object so the TypeScript module doesn't parse porcelain output. Pinning the JSON schema with 172 tests means the shell scripts are refactorable without breaking the consumers.

### What Could Be Better

- **272 tests across 51 files is a thin ratio for the state diversity git exposes.** Detached HEAD, merge conflicts, rebases in progress, submodules, worktrees, shallow clones, git-LFS, git-annex, and non-trivial hook interactions together form an enormous state surface. The release covers the states the workflows need, but the edge-case surface beyond that is not yet exercised. A v1.43+ pass at expanding the state-matrix fuzz coverage is the obvious follow-through.
- **Coverage tooling without a reported number is a foundation-only investment.** `@vitest/coverage-v8` lands in `package.json` but no coverage percentage is reported in the release. That's fine for v1.42 — establishing the tool is the deliverable — but the measured baseline and a coverage-gated CI check are the v1.43+ work that actually cashes the investment in.
- **Tauri `Cargo.toml` and `tauri.conf.json` bumps are bookkeeping, not feature work.** The desktop webview does not yet expose any of the new git module. A desktop-side git UI is an explicit non-goal for v1.42 but should be tracked as a v1.44-or-later possibility so the module's consumers aren't all CLI-side forever.
- **Scope of git operations is intentionally narrow.** Submodules, LFS, git-annex, and shallow clones are outside v1.42's surface. That's the correct call for a foundation release, but the README doesn't carry a tracker of which extensions are queued — future releases should either add support or explicitly defer it as a named non-goal.

## Lessons Learned

- **Git workflow skills need repository context, not just command knowledge.** A skill that knows `git rebase` as a verb is less useful than one that knows "this repository uses merge commits on `main` and rebase on feature branches." The `src/git/types.ts` Zod schemas capture that context structurally so the skill surfaces the right command at the right repo.
- **A state machine is cheaper than a wrapper.** The seductive path is to write a wrapper that shells out and parses output; the durable path is a named-state transition table with rejections as first-class outcomes. The 257 state-machine tests exercise rejections on equal footing with transitions because rejection paths are the product.
- **Separate mechanical safety from human judgment.** Pre-flight checks that users can override become performative; HITL checks that users can't bypass become obstacles. Split them at the gate layer and neither erodes.
- **JSONL audit trails are the minimum viable forensic layer.** Append-only, line-delimited, grep-able, replayable from any checkpoint. The 138 logger tests exist because the log is load-bearing — a crashed session is only recoverable if the log is trustworthy.
- **Shell scripts that emit JSON decouple the raw layer from the TypeScript layer.** `git-state-check.sh` returns a structured state object; the TypeScript module consumes JSON; the schema is pinned by tests. Refactors on either side can proceed independently.
- **Progressive-disclosure skills need their own tests.** K-01..K-08 validate word-count, token budget, trigger-intent coverage, and reference-file shape. Without those tests, a later refinement silently turns the skill into a wall of text and the model stops loading it.
- **Adding coverage tooling is a foundation investment.** `@vitest/coverage-v8` lands now; coverage-gated CI lands later. Shipping the tool in a release where the baseline isn't yet measured is fine if the retrospective names the follow-through explicitly.
- **Report the gap as a number.** 272 tests across 51 files is a thin ratio and the retrospective says so. Puffery about "comprehensive test coverage" would be worse than admitting the edge-case surface is large; the admission is what routes the v1.43 coverage work onto the roadmap.
- **Install flow is the first CLI shape the rest of the system will reuse.** URL parsing, owner/repo/branch/subpath conventions, and gated bootstrap into a workspace are the shape every future installer (plugins, cartridges, data packs) will inherit. Getting the shape right once at v1.42 is cheaper than fixing it in three places later.
- **Scope narrowly, document non-goals loudly.** v1.42 skips submodules, LFS, and shallow clones deliberately. Calling that out in the retrospective is what prevents a future release from being accused of a regression it never promised to cover.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.0](../v1.0/) | Establishes the append-only JSONL primitive that `src/git/core/logger.ts` inherits for its audit log |
| [v1.41](../v1.41/) | Predecessor — Claude Code Integration Reliability; the progressive-disclosure skill discipline v1.42's `skills/git-workflow/` follows comes from v1.41's reliability work |
| [v1.43](../v1.43/) | Successor — Gource Visualization Pack; first release to consume the v1.42 git module for commit-history rendering |
| [v1.35](../v1.35/) | Retrospective style — "report the gap as a number" posture is reused directly in v1.42's retrospective honesty about the 272-test ratio |
| [v1.40](../v1.40/) | Set the retrospective depth expectation (1,000+ word summary, enumerated What Worked / What Could Be Better, Lessons Learned) that v1.42 matches |
| [v1.10](../v1.10/) | Security Hardening — the two-gate model in v1.42 is the same defense-in-depth posture (mechanical + judgment layers) |
| [v1.25](../v1.25/) | Ecosystem Integration — the `sc install` URL parser inherits the dependency-graph discipline v1.25 shipped |
| [v1.46](../v1.46/) | Applied the "272 tests is a thin ratio" lesson — follow-through coverage work tracked in the lessons registry (lesson #225 marked applied in v1.46) |
| [v1.49](../v1.49/) | Mega-release — consolidated many post-v1.40 tracks including downstream consumers of the v1.42 git module |
| `src/git/` | 51-file, 10,117-line git module — the v1.42 deliverable surface |
| `skills/git-workflow/` | Progressive-disclosure skill (SKILL.md + 3 references + validate.sh) |
| `test/git/` | Five-file test tree (integration, safety, skill-validation, core/, scripts/) — 272-test aggregate |
| `package.json` | `@vitest/coverage-v8` added — first coverage-reporting dependency in the project |
| `docs/release-notes/v1.42/chapter/` | 00-summary, 01-features, 03-retrospective, 04-lessons, 99-context — parsed-chapter aggregation for the scorer |
| `RETROSPECTIVE-TRACKER.md` | Lessons #223–226 from v1.42 tracked against later-release resolution status |

## Engine Position

v1.42 is the first release where git is a structured module inside skill-creator rather than a shell-out-and-hope convenience. Every subsequent release that touches a repository — v1.43's Gource visualization pack that reads commit history, v1.46's follow-through coverage work against the v1.42 surface, v1.49's mega-release consolidation of many post-v1.40 tracks — sits on top of the state machine, the two-gate model, the JSONL audit trail, and the progressive-disclosure skill that v1.42 established. The install flow (`sc install <url>`) is the URL-to-working-install shape later plugin and cartridge installers reuse. The `src/git/` directory layout (`core/`, `gates/`, `scripts/`, `workflows/`) is the module-shape template for later first-class modules that need the same separation of mechanical safety, human judgment, and deterministic primitives. The retrospective's two honest gaps — thin test ratio for git state diversity, coverage tooling without a measured baseline — are the explicit handoff to the v1.43+ coverage and fuzz-expansion work. v1.42 is the foundation the git-aware rest of the project builds on; it does not claim to be complete, and the retrospective names exactly what "complete" would require.

## Files

- `src/git/core/state-machine.ts` — 276 lines, typed state set and transition table
- `src/git/core/branch-manager.ts` — 357 lines, branch creation/switching/protection/worktree coordination
- `src/git/core/sync-manager.ts` — 196 lines, pull/push/fetch/remote-tracking with gated network calls
- `src/git/core/repo-manager.ts` — 210 lines, repository-level facade for workflows
- `src/git/core/logger.ts` — 56 lines, append-only JSONL audit log
- `src/git/gates/hitl-gate.ts` — 332 lines, human-in-the-loop trust-boundary gate (510 tests — largest set)
- `src/git/gates/pre-flight.ts` — 363 lines, mechanical-safety gate with no override path
- `src/git/workflows/install.ts` — 278 lines, URL-to-workspace bootstrap install flow
- `src/git/workflows/contribute.ts` — 183 lines, full contribution lifecycle orchestrator
- `src/git/workflows/branch-work.ts` — 111 lines, branch-scoped work workflow
- `src/git/workflows/sync.ts` — 100 lines, sync-workflow orchestrator
- `src/git/scripts/git-state-check.sh` — 172 lines, JSON-emitting repo-state primitive
- `src/git/scripts/safe-merge.sh` — 92 lines, gated merge wrapper
- `src/git/scripts/pr-bundle.sh` — 78 lines, review-ready PR bundle
- `src/git/scripts/worktree-setup.sh` — 37 lines, worktree registration
- `src/git/cli.ts` — 357 lines, 7-command CLI registration surface
- `src/git/types.ts` — 158 lines, Zod-validated shared types
- `src/git/schemas.ts` — 47 lines, schema exports
- `src/git/index.ts` — 10 lines, module barrel
- `src/commands/sc-install.ts` — 134 lines, top-level `sc install` command
- `skills/git-workflow/SKILL.md` — 220 lines, progressive-disclosure skill entry
- `skills/git-workflow/references/plumbing.md` — 64 lines, plumbing-vs-porcelain command table
- `skills/git-workflow/references/workflows.md` — 236 lines, six deterministic workflow sequences
- `skills/git-workflow/references/safety.md` — 102 lines, eight safety rules with rationale
- `skills/git-workflow/scripts/validate.sh` — 105 lines, skill-level state-check re-export
- `test/git/integration.test.ts` — 1,078 lines, 18 integration tests (I-01..I-18)
- `test/git/safety.test.ts` — 541 lines, 12 safety-critical tests (S-01..S-12)
- `test/git/skill-validation.test.ts` — 215 lines, 8 skill-shape tests (K-01..K-08)
- `test/git/core/` — state-machine, repo-manager, logger tests (604 lines, 604 tests)
- `test/git/scripts/` — shell-scripts + git-state-check tests (505 lines)
- `package.json` — `@vitest/coverage-v8` added, version bumped to 1.42.0
- `src-tauri/Cargo.toml` / `tauri.conf.json` — version sync to 1.42.0
