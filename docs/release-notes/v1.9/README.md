# v1.9 — Ecosystem Alignment & Advanced Orchestration

**Released:** 2026-02-12
**Scope:** spec alignment + advanced orchestration — 9 phases (62-70), 37 plans, 49 requirements, ~20k LOC
**Branch:** dev → main
**Tag:** v1.9 (2026-02-12T02:22:12-08:00) — "Ecosystem Alignment & Advanced Orchestration"
**Predecessor:** v1.8.1 — Audit Remediation
**Successor:** v1.10 — Security Hardening
**Classification:** milestone — ecosystem-scale feature release
**Verification:** 5,317+/5,432 tests passing · strict TypeScript · skill format round-trippable with upstream Claude Code tooling · agentskills.io portable export validated

## Summary

**v1.9 was the largest single release in the project's history up to that point.** Nine sequential phases (62-70), 37 plans, and 49 requirements landed in one milestone. The scope spans spec-level frontmatter compatibility, automatic progressive disclosure of large skills, cross-platform portability to four non-Claude targets, evaluator/optimizer tooling with statistical testing, MCP-based distribution, two new team topologies, session continuity, agentic retrieval-augmented generation, and a handful of quality-of-life improvements. Each phase could have been its own release; v1.9 compressed them into one milestone because each extension depended on the shape established by the others. Spec alignment had to land before portability could strip extension fields meaningfully. MCP distribution had to land before `install` could bootstrap skills from remote URLs. The evaluator-optimizer had to land before the quality dashboard could aggregate per-skill metrics. The density is justified by the interlocking nature of the work, but the lesson — documented in the retrospective — is that a release this dense is hard to communicate and hard to audit even when every individual phase was sound.

**Spec alignment (Phase 62) closed the gap with upstream Claude Code frontmatter.** The official Claude Code skill spec had drifted ahead of v1.8's implementation in several ways: `$ARGUMENTS` parameterization with `argument-hint` descriptions, `!command` preprocessing syntax for injecting live shell output into skill bodies, `context: fork` auto-detection for research and analysis workflows, dual-format `allowed-tools` parsing that accepted both array and space-delimited string forms, and optional `license` / `compatibility` fields in the YAML frontmatter. v1.9 implemented all of them. The interesting security fix inside this phase was preventing shell injection when `$ARGUMENTS` appears inside a `!command` context — without the sanitization path, a malicious argument could escape into the shell invocation. The mitigation landed at v1.9 and is one of the standing reasons v1.10 follows immediately as a security-hardening release; the class of vulnerability that phase 62 closed was worth a dedicated follow-up audit across the rest of the command surface.

**Progressive disclosure (Phase 63) solved the large-skill loading problem.** Skills exceeding 2,000 words blow past the session token budget, which meant v1.8 users were hand-splitting long skills into a top-level file with a `references/` sidecar directory. v1.9 automated the split. A skill longer than the threshold is auto-decomposed into `SKILL.md` (the short behavioural core), `references/*.md` (narrative content), and `scripts/*` (deterministic operations extracted into executable form). Circular reference detection runs via visited-set DFS during the decomposition so a reference that transitively cites back to the entry skill is caught at authoring time rather than at load time. The disclosure-aware token-budget calculator understands that only `SKILL.md` counts against the session budget — references are loaded on demand — so a 5,000-word skill can live inside a 2,000-word budget without truncation. Every skill generated after v1.9 inherits this behaviour automatically.

**Cross-platform portability (Phase 64) made skills a genuine interchange format.** The `skill-creator export --portable` flag strips every `metadata.extensions.gsd-skill-creator.*` field from a skill so the result validates against the agentskills.io portable-skill schema. The `--platform <target>` flag generates platform-specific variants for Claude Code, Cursor, Codex CLI, GitHub Copilot, and Gemini CLI. Each platform has its own frontmatter conventions, file layout, and activation trigger format; the exporter knows them all and emits the right shape. This is the phase that demonstrates the skill format is not a proprietary one — v1.9 proved skills authored in gsd-skill-creator can run unmodified (after a single export pass) on four non-Anthropic platforms. Vendor lock-in is a design choice the project declined to make.

**Evaluator-optimizer (Phase 65) brought statistical rigour to skill tuning.** `skill-creator test` now simulates activations against a corpus of test queries and reports precision, recall, and F1 per skill. `skill-creator quality` aggregates those metrics into a per-skill health dashboard with token-budget headroom and trend data. The A/B evaluation path runs two skill variants against the same test set, does a t-test on the activation-success distributions, and tells the author whether the observed difference is statistically significant — so small regressions caused by noise don't look like progress. Post-activation success tracking (user corrections, overrides, feedback) feeds back into the metrics so the evaluator sees real-world outcomes, not just simulated ones.

**MCP distribution (Phase 66) bridged local skills and network-accessible tools.** The `skill-creator mcp-server` command exposes skills over the Model Context Protocol stdio transport, with four tools: `list_skills`, `search_skills`, `read_skill`, and `install_skill`. Any MCP-compatible host (Claude Desktop, Cursor, Zed, a custom agent) can discover and load skills from the local skill library without filesystem access. Packaging is symmetric: `skill-creator publish` tars a skill (or bundle) into a `.tar.gz` envelope carrying the format version, and `skill-creator install` unpacks from either a local file or a remote URL. Remote installation is how v1.9 closes the loop on ecosystem alignment — a skill published on one machine can be consumed on another with a single CLI command.

**Enhanced topologies (Phase 67) extended the v1.4 team model without replacing it.** v1.4 introduced leader-worker, pipeline, and swarm topologies. v1.9 added Router — which classifies incoming work via routing rules and dispatches to specialists — and Map-Reduce — which splits work, fans out to parallel workers, and consolidates the results. These are the two patterns the original three didn't cover: classification-then-dispatch and fan-out-then-consolidate. Inter-team communication added deadlock detection with circular-wait prevention, which is a real concern once teams can call other teams. The `skill-creator team estimate <team>` command projects token usage and dollar cost across a team's tool usage so operators can budget before launching a multi-agent run. The detection logic for circular waits is conservative: it walks the team dependency graph at estimate time and refuses to launch a configuration that contains a cycle.

**Session continuity and agentic RAG (Phases 68 and 69) extended the learning loop across sessions.** `skill-creator session save/restore/handoff` serializes session state into a snapshot file that a later session (or a different user) can restore. Warm-start context generation reads the snapshot plus the project `STATE.md` and assembles a compact briefing that puts the new session on the same page as the old one — no context re-derivation from tool logs. Ephemeral observations that appear 2+ times across sessions are promoted to persistent state, which is the minimum viable evidence bar for "this is a real pattern, not noise." The agentic-RAG path adds adaptive routing (simple queries go to TF-IDF, complex queries go to embeddings), corrective iterations with a hard cap of 3 and a diminishing-returns check to avoid runaway search, and `skill-creator search --all` that discovers across user-scope, project-scope, and plugin directories in a single query.

**Quality-of-life (Phase 70) is the seam where v1.9 hands off to v1.10.** Four small but load-bearing additions: a description-quality validator that enforces the "capability + Use when..." pattern so descriptions are actionable rather than marketing copy, an enhanced `skill-creator status` with budget breakdown and trend over time, the new `skill-creator graph` command that outputs Mermaid diagrams of skill relationships (inheritance edges, co-activation clusters, standalone nodes), and automatic GSD command-reference injection into generated skills when a `.claude/commands/gsd/` directory is detected. The last item is the bridge between skill authoring and project workflow: skills generated inside a GSD-managed project now automatically carry forward the right workflow links without the author doing anything extra.

## Key Features

| Area | What Shipped |
|------|--------------|
| Spec alignment | `$ARGUMENTS` parameterization with `argument-hint` descriptions; `!command` preprocessing; `context: fork` auto-detection; dual-format `allowed-tools` parsing (Phase 62) |
| Spec alignment | Shell injection prevention for `$ARGUMENTS` inside `!command` context; `license` + `compatibility` frontmatter fields (Phase 62) |
| Progressive disclosure | Auto-decomposition of skills > 2,000 words into `SKILL.md` + `references/` + `scripts/` with disclosure-aware budget calculation (Phase 63) |
| Progressive disclosure | Visited-set DFS cycle detection across reference graphs catches circular citations at authoring time (Phase 63) |
| Portability | `skill-creator export --portable` strips `metadata.extensions.*` for agentskills.io compliance (Phase 64) |
| Portability | `--platform` exporters for Claude Code, Cursor, Codex CLI, GitHub Copilot, and Gemini CLI (Phase 64) |
| Evaluator-optimizer | `skill-creator test` precision/recall/F1 from simulated activations; `skill-creator quality` health dashboard (Phase 65) |
| Evaluator-optimizer | A/B evaluation with t-test significance; post-activation success tracking feeds back into metrics (Phase 65) |
| MCP distribution | `skill-creator mcp-server` exposes 4 MCP tools over stdio; `publish` / `install` with `.tar.gz` format-version envelope (Phase 66) |
| Topologies | Router and Map-Reduce team topologies; inter-team deadlock detection; `team estimate` for token/cost projection (Phase 67) |
| Session continuity | `session save/restore/handoff` snapshots; warm-start context generator; 2+ session promotion threshold for ephemeral observations (Phase 68) |
| Agentic RAG | Adaptive routing (TF-IDF vs embeddings); corrective iterations (max 3 with diminishing-returns check); `search --all` scope (Phase 69) |
| Quality of life | Description quality validator enforcing "capability + Use when..." pattern; `skill-creator status` budget breakdown + trend; Mermaid graph renderer via `skill-creator graph` (`src/composition/graph-renderer.ts`) (Phase 70) |
| Quality of life | `src/detection/gsd-reference-injector.ts` — automatic GSD command-reference injection when `.claude/commands/gsd/` is detected (Phase 70) |
| Verification | 5,317+/5,432 tests passing; strict TypeScript clean; vitest timeout raised to 10 s to accommodate embedding model init; embeddings mocked to stabilise CI |

## Retrospective

### What Worked

- **Cross-platform portability proved skills are not vendor-locked.** Five target platforms (Claude Code, Cursor, Codex CLI, GitHub Copilot, Gemini CLI) consume the same skill source after a single `--portable` or `--platform` export pass. The `metadata.extensions` namespace design from v1.0 finally paid off here — stripping extension fields produced a valid portable skill without any other transformation.
- **Progressive disclosure with auto-decomposition at 2,000 words solved the large-skill problem cleanly.** Before v1.9, authors manually split long skills into `SKILL.md` + `references/`; after v1.9, the system does it. Disclosure-aware token budgeting means a 5,000-word skill can live inside a 2,000-word session budget without truncation.
- **MCP distribution via `skill-creator mcp-server` bridges local skills and network-accessible tools.** Four MCP tools (`list_skills`, `search_skills`, `read_skill`, `install_skill`) make skills discoverable and installable without filesystem access, which is exactly the shape an MCP host needs.
- **Router and Map-Reduce topologies extended the v1.4 team model meaningfully.** The original three (leader-worker, pipeline, swarm) didn't cover classification-then-dispatch or fan-out-then-consolidate. v1.9 added both without disturbing the existing three — teams are additive, not mutually exclusive.
- **Statistical rigour in the evaluator-optimizer avoids chasing noise.** Running t-tests on A/B activation-success distributions means small observed differences that are actually within variance don't get mistaken for real improvements. The evaluator tells the author "this change is statistically indistinguishable from baseline" when that's the truth.

### What Could Be Better

- **9 phases, 37 plans, and 49 requirements made v1.9 the densest release yet.** Spec alignment, progressive disclosure, portability, evaluator-optimizer, MCP, enhanced topologies, session continuity, agentic RAG, and quality-of-life are arguably 3-4 separate releases compressed into one. Readers of the release notes have a harder time grasping the scope, and reviewers have a harder time auditing the combined surface area.
- **Agentic RAG with corrective iterations (max 3) and a diminishing-returns check added complexity to the search path.** Simple searches now have a multi-iteration fallback that's harder to debug when results are unexpected. The cap and the termination check were added precisely because unbounded corrective search is a footgun, but the fallback itself still adds surface area.
- **Deadlock detection for inter-team communication signals the team model is approaching distributed-systems complexity.** Circular-wait prevention is a real concern once teams can call other teams, but the fact that it's needed at all means team coordination is getting harder to reason about. Future versions should consider whether the model wants to stay this general or whether some team patterns should be retired.
- **Shell injection prevention for `$ARGUMENTS` inside `!command` context should have been in the v1.8 design.** The fact that it was caught inside Phase 62 — rather than in the audit that produced v1.8.1 — means the audit's command-surface pass missed a class of vulnerability. v1.10 picks up where this didn't go far enough.

## Lessons Learned

1. **Shell injection prevention for `$ARGUMENTS` in `!command` context is a security requirement, not a feature.** The v1.10 security hardening release follows immediately, but this specific fix couldn't wait for v1.10's full audit pass. Any command-surface that interpolates user input into a shell invocation needs a sanitization pass at the interpolation point; relying on downstream components to quote correctly is not a strategy.
2. **Ephemeral observation promotion (2+ sessions becomes persistent) is the right learning threshold.** One occurrence is noise; two occurrences across sessions is signal. This is the minimum viable evidence bar and it avoids promoting one-off experiments into permanent state.
3. **Mermaid diagrams of skill relationships make the system legible.** As the skill graph grows beyond what a reader can hold in their head, `skill-creator graph` is how they rebuild the mental model. Visualization is part of tooling, not a nice-to-have.
4. **A/B evaluation with t-test significance prevents premature optimization.** Without statistical rigour, small observed differences would drive changes that are actually within noise. The t-test is the seatbelt that keeps the tuning loop honest.
5. **Progressive disclosure belongs in tooling, not in skill authors' heads.** Before v1.9, authors had to remember to split long skills. After v1.9, the tool does it. Shifting the load-bearing discipline from the human to the tool is a quiet but recurring pattern in this project's improvements.
6. **Cross-platform export validates the v1.0 namespacing decision.** v1.0 put all project-specific fields under `metadata.extensions.gsd-skill-creator` rather than at the skill root. v1.9 Phase 64 could implement `--portable` as a one-line "strip that namespace" operation. Good namespacing at v1.0 paid its dividend nine versions later.
7. **Inter-team deadlock detection is cheap to add, expensive to skip.** Once teams can call other teams, a cycle is possible; once a cycle is possible, it will eventually be written. Walking the dependency graph at estimate time catches the bug before runtime where recovery is harder. This is the same shape as the v1.0 `extends:` circular-dependency check — adding safety early is always cheaper than retrofitting it.
8. **MCP is the right transport for skill distribution.** MCP stdio is the common denominator across MCP-compatible hosts. Exposing skills over MCP rather than over HTTP or a custom protocol means every MCP host automatically becomes a skill consumer. Picking the interop protocol that already exists beats inventing a new one.
9. **Density is a cost, not a feature.** Shipping nine phases in one milestone felt productive at the time but made auditing and communication harder. Future milestones should keep the phase count under a bound (4-5 feels right) unless the phases are genuinely coupled. The interlock argument has to be real, not convenient.
10. **Quality-of-life phases belong at the end of a milestone, not the start.** Phase 70 is the grab-bag of description validator, status improvements, graph renderer, and GSD injection. Putting that grab-bag last worked — by phase 70 the heavy features had stabilised and the QoL pass could target real friction that showed up during earlier-phase development.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.8.1](../v1.8.1/) | Predecessor — adversarial audit remediation cleaned the codebase that v1.9 then extended across 9 phases |
| [v1.8](../v1.8/) | Grandpredecessor — capability-aware planning and token-efficiency work whose token accounting powered v1.9's disclosure-aware budgeting |
| [v1.10](../v1.10/) | Successor — security hardening release that picks up the command-surface audit Phase 62's shell-injection fix exposed |
| [v1.7](../v1.7/) | GSD Master Orchestration Agent — the GSD command-reference injection in Phase 70 extends v1.7's GSD integration into generated skills |
| [v1.4](../v1.4/) | Agent Teams — Phase 67's Router + Map-Reduce topologies extend v1.4's original three (leader-worker, pipeline, swarm) |
| [v1.1](../v1.1/) | Semantic Conflict Detection — the embeddings mock landed in v1.9 (via v1.8.1's carry-forward) solves the 5-second cold-start introduced in v1.1 |
| [v1.0](../v1.0/) | Zero-point — the `metadata.extensions.gsd-skill-creator` namespace from v1.0 is what makes Phase 64's `--portable` export work as a one-line strip |
| [v1.44](../v1.44/) | Later release where two v1.9 lessons (ephemeral-promotion threshold, Mermaid graph legibility) were re-applied in follow-on work |
| [v1.25](../v1.25/) | Ecosystem Integration — the 20-node dependency DAG lands on top of v1.9's portable + MCP foundation |
| `src/cli/commands/graph.ts` | Phase 70 Mermaid graph command entry point |
| `src/composition/graph-renderer.ts` | Phase 70 renderer that emits Mermaid `graph TD` syntax for inheritance chains and co-activation clusters |
| `src/detection/gsd-reference-injector.ts` | Phase 70 GSD command-reference injector — appends "Related GSD Commands" section to generated skills when `.claude/commands/gsd/` is detected |
| `src/storage/budget-history.ts` | Phase 70 JSONL budget history store (365-entry retention, trend analysis) backing `skill-creator status` |
| `src/cli/commands/status.ts` | Phase 70 enhanced status command with budget bar, per-skill breakdown, headroom, trend |
| `agentskills.io` | Upstream portable-skill schema that Phase 64 `--portable` export targets |

## Engine Position

v1.9 is the ecosystem-alignment inflection point in the project's timeline. Everything before v1.9 treated skills as a local artifact — a file in `.claude/skills/` that the running Claude Code session could find. Everything after v1.9 treats skills as a network-addressable, cross-platform, statistically-evaluable artifact that can be authored locally, validated by simulation, published over MCP, installed from a URL, and consumed by four non-Anthropic hosts. That shift is the load-bearing change. Every later milestone that distributes skills (v1.25 ecosystem integration, v1.27 knowledge packs, v1.31 GSD-OS MCP integration, v1.46 upstream intelligence) builds on the MCP transport, the progressive-disclosure decomposition, the portable export, and the evaluator-optimizer metrics v1.9 introduced. v1.9 is also the release that set the density ceiling — nine phases in one milestone was the point where the team learned that denser wasn't better, and every subsequent milestone consciously narrowed scope.

## Files

- `src/cli.ts` — routes for the new `graph`, `status`, `test`, `quality`, `publish`, `install`, `mcp-server`, `session`, `export` commands
- `src/cli/commands/graph.ts` + `src/cli/commands/graph.test.ts` — Phase 70 Mermaid graph CLI entry point
- `src/cli/commands/status.ts` + `src/cli/commands/status.test.ts` — Phase 70 enhanced status with budget breakdown, trend, per-skill table
- `src/cli/commands/discover.ts` — Phase 70 discover flow updated to resolve GSD installation once before the draft loop
- `src/composition/graph-renderer.ts` — Phase 70 Mermaid renderer (inheritance chains, co-activation subgraphs, standalone nodes)
- `src/detection/gsd-reference-injector.ts` + `src/detection/index.ts` — Phase 70 GSD command-reference injector wired into the skill-body generator
- `src/detection/skill-generator.ts` — `gsdInstalled` flag threaded through `generateBody`
- `src/discovery/skill-drafter.ts` — `gsdInstalled` threaded into `generateSkillDraft`
- `src/storage/budget-history.ts` — JSONL budget history store (365-entry retention, trend analysis)
- `CHANGELOG.md` + `README.md` + `package.json` + `package-lock.json` — v1.9.0 release metadata (49 requirements, 9 new capabilities added to the "What It Does" table)
