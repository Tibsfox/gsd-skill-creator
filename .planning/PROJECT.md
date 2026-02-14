# GSD Skill Creator

## What This Is

A self-evolving skill ecosystem for Claude Code that observes usage patterns, suggests skill creation, composes related skills into purpose-built agents, and automatically promotes deterministic operations to context-bypassing scripts. It provides the learning and evolution layer alongside GSD (Get Shit Done), transforming it from a static workflow engine into a self-improving one through a six-step loop: observe, detect, suggest, apply, learn, compose — with an integrated promotion pipeline that progresses operations from conversational through skill to compiled execution. Includes a unified development dashboard with live planning docs, real-time metrics, an embedded browser terminal, and a bidirectional console for uploading vision documents, configuring milestone settings, and answering structured planning questions via filesystem message bus. A staging layer sits between human ideation and machine execution — scanning content for security hygiene, analyzing resource needs, checking derived knowledge integrity, and managing a queue for parallel execution with pre-wired skills and topology recommendations. Skills are distributable across platforms via MCP protocol and portable agentskills.io format.

## Core Value

Skills, agents, and teams must match official Claude Code patterns so they work correctly when loaded by Claude Code.

## Requirements

### Validated

<!-- Shipped and confirmed valuable across v1.0-v1.15. -->

- Pattern observation and session monitoring (v1.0)
- Skill suggestion when patterns repeat 3+ times (v1.0)
- Skill creation guided workflow with YAML frontmatter validation (v1.0)
- Auto-loading skills based on context with token budgets 2-5% (v1.0)
- Learning loop with bounded refinements (≥3 corrections, 7-day cooldown, ≤20% change) (v1.0)
- Agent composition from co-activation (5+ over 7+ days) (v1.0)
- Semantic conflict detection between skills (v1.1)
- Activation likelihood scoring with configurable thresholds (v1.1)
- Local embeddings via HuggingFace transformers (v1.1)
- Activation simulation with synthetic sessions (v1.2)
- Threshold calibration with F1/MCC optimization (v1.2)
- Test infrastructure with automated test cases (v1.2)
- Official Claude Code skill format documentation (v1.3)
- Multi-agent teams: leader-worker, pipeline, swarm topologies (v1.4)
- Team storage, validation, and CLI commands (v1.4)
- Session log scanning with incremental watermarks (v1.5)
- Tool sequence n-gram extraction and DBSCAN clustering (v1.5)
- Draft skill generation from discovered patterns (v1.5)
- 34 cross-domain example skills, agents, and teams (v1.6)
- GSD orchestrator: dynamic discovery, intent classification, lifecycle coordination (v1.7)
- Skill workflows with dependency tracking and crash recovery (v1.7)
- Skill roles with behavioral constraints and tool scoping (v1.7)
- Work bundles with progress tracking (v1.7)
- Inter-skill events with emit/listen activation chains (v1.7)
- Composable skill pipeline with pluggable stages (v1.8)
- Per-agent token budget profiles with priority tiers (v1.8)
- Capability manifests and phase declarations (v1.8)
- Cache-aware skill ordering with cacheTier metadata (v1.8)
- Research compression with staleness detection (v1.8)
- Parallelization advisor for wave-based execution (v1.8)
- ✓ Spec-aligned generation: $ARGUMENTS, !command, context:fork, dual-format allowed-tools — v1.9
- ✓ Progressive disclosure: auto-decompose >2000 word skills into SKILL.md + references/ + scripts/ — v1.9
- ✓ Cross-platform portability: --portable and --platform flags for 5 targets — v1.9
- ✓ Evaluator-optimizer: precision/recall/F1, A/B evaluation, health dashboard — v1.9
- ✓ MCP distribution: publish/install commands, MCP server with 4 tools — v1.9
- ✓ Enhanced topologies: Router, Map-Reduce, inter-team communication, cost estimation — v1.9
- ✓ Session continuity: save/restore/handoff, warm-start, cross-session promotion — v1.9
- ✓ Agentic RAG: adaptive routing, corrective refinement, cross-project discovery — v1.9
- ✓ Path traversal prevention with defense-in-depth (validateSafeName + assertSafePath) — v1.10
- ✓ YAML safe deserialization rejecting dangerous tags with Zod schema validation — v1.10
- ✓ JSONL integrity: checksums, schema validation, rate limiting, anomaly detection, compaction, purge — v1.10
- ✓ Discovery safety: secret redaction, allowlist/blocklist, structural-only filtering, dangerous command deny list — v1.10
- ✓ Learning safety: cumulative drift tracking (60% threshold), contradiction detection, audit CLI — v1.10
- ✓ Team message sanitization against prompt injection with content-length limits — v1.10
- ✓ Config range validation with security-aware field registry and CLI — v1.10
- ✓ Inheritance chain validation: depth limits, circular dependency detection, impact analysis CLI — v1.10
- ✓ File integrity monitoring, audit logging, concurrency locks, operation cooldowns — v1.10
- ✓ Hook error boundaries, safety validation, orchestrator confirmation gates — v1.10
- ✓ SECURITY.md threat model and GitHub Actions CI with npm audit — v1.10
- ✓ Integration config with per-feature toggles for controlling integration behavior — v1.11
- ✓ Enhanced install script with idempotent setup, git hooks, and uninstall support — v1.11
- ✓ Post-commit git hook for passive session observation without Claude involvement — v1.11
- ✓ Session start command with warm-start briefing (GSD state + skill-creator status) — v1.11
- ✓ skill-creator slash commands: status, suggest, observe, digest — v1.11
- ✓ Wrapper commands for GSD phases with skill loading and observation capture — v1.11
- ✓ Passive `.planning/` artifact monitoring with plan vs summary diffing — v1.11
- ✓ Markdown-to-HTML dashboard generator parsing `.planning/` artifacts into 5 pages — v1.12
- ✓ Individual artifact pages (requirements, roadmap, milestones, state) with cross-navigation — v1.12
- ✓ JSON-LD structured data (Schema.org) and Open Graph meta tags on all pages — v1.12
- ✓ Incremental builds with SHA-256 content hashing and build manifest — v1.12
- ✓ Auto-refresh with scroll preservation and visual indicator for live sessions — v1.12
- ✓ GSD slash command (`/gsd-dashboard`) with generate/watch/clean subcommands — v1.12
- ✓ Live session pulse: active session card, commit feed, message/tool counters — v1.12.1
- ✓ Phase velocity analytics: wall time, commits, LOC delta, TDD cycle timing per phase — v1.12.1
- ✓ Planning accuracy scores: plan-vs-summary scope classification, emergent work ratio — v1.12.1
- ✓ Git-derived metrics: commit type distribution, file hotspots, phase boundary detection — v1.12.1
- ✓ Historical trends: milestone comparison table, velocity curves, learning system health — v1.12.1
- ✓ Variable sample rates: hot metrics (1-2s), warm metrics (5-10s), cold metrics (on-change) — v1.12.1
- ✓ Message stack for async command queuing with priority levels (push/pop/poke/drain) — v1.13
- ✓ Session lifecycle management via tmux (start/list/watch/pause/resume/stop/save) — v1.13
- ✓ Recording & playback with metrics, markers, and 4 replay modes — v1.13
- ✓ Copper List workflow coprocessor (WAIT/MOVE/SKIP synced to GSD lifecycle events) — v1.13
- ✓ Blitter bulk operation engine (script promotion for context-bypassing execution) — v1.13
- ✓ Team-as-chip framework (Agnus/Denise/Paula/Gary with message ports and signals) — v1.13
- ✓ Exec kernel with prioritized scheduling and signal-based coordination — v1.13
- ✓ Copper List learning from observation data — v1.13
- ✓ Tool execution capture with input-output pairing and SHA-256 content hashes — v1.14
- ✓ Determinism analysis with three-tier classification and configurable thresholds — v1.14
- ✓ Promotion detection with composite scoring (determinism, frequency, token savings) — v1.14
- ✓ Script generation with tool-to-bash mapping, dry-run validation, and Blitter conformance — v1.14
- ✓ Promotion gatekeeping with F1/accuracy/MCC thresholds and auditable decision trail — v1.14
- ✓ Post-promotion drift monitoring with automatic demotion on output divergence — v1.14
- ✓ Blitter feedback bridge flowing completion signals to learning cycle — v1.14
- ✓ Full lineage tracking with bidirectional provenance querying across pipeline stages — v1.14
- ✓ Dashboard collectors for pipeline status, determinism scores, and lineage views — v1.14
- ✓ Terminal config schema with Zod validation wired into integration config — v1.15
- ✓ Wetty process launcher with configurable port, base path, and graceful shutdown — v1.15
- ✓ HTTP health check with native fetch and AbortSignal.timeout() — v1.15
- ✓ Terminal process manager with start/stop/status/restart lifecycle — v1.15
- ✓ tmux session binding with auto-detect and compound attach-or-create command — v1.15
- ✓ Dashboard terminal panel with themed iframe, offline fallback, and JS availability probe — v1.15
- ✓ Terminal integration glue wiring config reader to panel renderer — v1.15
- ✓ DashboardService with generation, file watching, and AbortController lifecycle — v1.15
- ✓ DevEnvironmentManager composing terminal + dashboard via Promise.allSettled — v1.15
- ✓ Filesystem message bus with Zod-validated JSON envelopes and inbox/outbox directional routing — v1.16
- ✓ HTTP helper endpoint for browser→filesystem writes with path traversal prevention — v1.16
- ✓ Upload zone with drag-and-drop markdown ingestion and document metadata extraction — v1.16
- ✓ Milestone configuration panel with 7-section Zod schema and form renderer — v1.16
- ✓ GSD skill for inbox checking at session-start, phase-boundary, and post-verification — v1.16
- ✓ Question-response system with 5 interactive card types and timeout fallback — v1.16
- ✓ Hot-configurable settings with optimistic updates and pending-sync indicators — v1.16
- ✓ Console dashboard page with activity timeline, status display, and clipboard fallback — v1.16
- ✓ Staging foundation with 5-state filesystem pipeline and structured metadata — v1.17
- ✓ Hygiene pattern engine detecting embedded instructions, hidden content, and YAML config safety — v1.17
- ✓ Trust-aware hygiene reporting with familiarity tiers and trust decay — v1.17
- ✓ Smart intake flow with clarity assessment, step tracking, and crash recovery — v1.17
- ✓ Resource analysis with vision analyzer, skill matching, topology recommendation, and budget estimation — v1.17
- ✓ Derived knowledge checking with provenance tracking, scope drift, and copying detection — v1.17
- ✓ Staging queue with 7-state machine, audit log, and cross-queue optimization — v1.17
- ✓ Queue pipelining with pre-wiring, retroactive audit, and dashboard panel — v1.17
- ✓ CSS design system with domain colors, signal colors, typography, spacing tokens, and 5 status states — v1.18
- ✓ Persistent gantry status strip with agent circles, phase fractions, budget bar on all pages — v1.18
- ✓ Shape/color entity system with 6 SVG shapes, 6 domain colors, and collapsible legend — v1.18
- ✓ Subway-map topology view with SVG renderer, bezier edges, 12-node collapse, and click-to-detail — v1.18
- ✓ Activity feed with shape/color indicators, 8-entry max, tab toggle to terminal view — v1.18
- ✓ Budget gauge with domain-colored stacked bar and silicon panel with diamond adapters — v1.18
- ✓ Domain-prefixed identifier encoding with backward compatibility and SKILL.md metadata — v1.18
- ✓ Three-speed information layering (glance/scan/read) across all dashboard components — v1.18
- ✓ LoadingProjection type with tier-based simulation separating installed from loadable — v1.19
- ✓ CumulativeBudgetResult with installedTotal/loadableTotal and dual-view display — v1.19
- ✓ CLI status redesign with "Installed Skills" and "Loading Projection" two-section layout — v1.19
- ✓ JSON output mode (--json) with structured installed and projection data — v1.19
- ✓ Dashboard budget gauge with deferred tooltip, over-budget clamped rendering, red outline — v1.19
- ✓ Configurable per-profile cumulative budgets in integration config with env var fallback — v1.19
- ✓ Budget history dual-dimension tracking with graceful old-snapshot migration — v1.19
- ✓ Unified CSS pipeline wiring 18 component style modules with design system token compliance — v1.20
- ✓ Topology data collector reading real skill/agent/team files with domain inference — v1.20
- ✓ Activity feed collector transforming git commits and session observations into FeedEntry[] — v1.20
- ✓ Budget-silicon collector bridging budget results and config to gauge/panel renderers — v1.20
- ✓ Staging queue collector reading queue-state.json for dashboard panel visualization — v1.20
- ✓ Console page assembly with settings, activity, questions, and submit flow as 6th generated page — v1.20

### Active

<!-- Next milestone — see REQUIREMENTS.md when created -->

### Out of Scope

- Full-stack web application — Dashboard and terminal are local dev tools, not a deployed app
- Real-time collaboration — Single-user tool
- Cloud-hosted skill registry — Local filesystem + optional MCP server; existing marketplaces serve this need
- Breaking changes to existing skill format — Additive only, backward compatible
- Non-Claude-Code agent frameworks — Focus on Claude Code ecosystem, portability is export-only
- LLM API calls for query routing — Latency, cost, external dependency for every skill search
- Platform-specific skill content — Agent Skills standard is universal; only frontmatter varies by platform
- ML-based detection — v1 uses pattern matching and heuristics; ML adds complexity without proven need
- Automated remediation — v1 flags and suggests; auto-fix requires high confidence not yet established
- Cross-project staging — v1 is project-scoped; cross-project adds significant coordination complexity

## Current State

## Current State

v1.20 shipped. 24 milestones shipped (v1.0-v1.20 + v1.8.1 patch), 157 phases, 449 plans, ~195k LOC TypeScript. All dashboard components are now wired into the generator pipeline with unified CSS and real data pipelines. Generator produces 6 pages (index, requirements, roadmap, milestones, state, console). Topology renders real skill/agent/team data. Activity feed shows git commits and session observations. Budget gauge and silicon panel display real budget data. Staging queue panel visualizes queue state. Console page provides settings, activity timeline, question cards, and submit flow.

## Context

- Built with TypeScript, Vitest for testing, Zod for validation
- ~192,000 LOC across 23 milestones (v1.0-v1.19 + v1.8.1)
- Uses HuggingFace transformers for local embeddings (all-MiniLM-L6-v2)
- Natural.js for Bayes classification in orchestrator
- @modelcontextprotocol/sdk for MCP server
- modern-tar for skill packaging
- simple-statistics for A/B evaluation t-tests
- Agent Skills specification (agentskills.io) is the portable format standard
- Skills work across Claude Code, OpenAI Codex CLI, Cursor, GitHub Copilot, Gemini CLI
- 7 team topologies supported: leader-worker, pipeline, swarm, custom, router, map-reduce
- Pre-existing tech debt: orchestrator fixture tests (path resolution), disclosure integration test (type cast), test-runner BatchSimulator mock, manifest.test.ts compilation warnings (7 missing contentHash)

## Constraints

- **Backward compatibility**: All new features must not break existing skill format (additive extensions only)
- **Token efficiency**: Generated skills must respect progressive disclosure — under 5,000 words in SKILL.md
- **Local-first**: No mandatory cloud dependencies; MCP integration is optional
- **Test-driven**: TDD with RED-GREEN cycle; all new features require comprehensive tests
- **Claude Code native**: All skills must be valid Agent Skills standard files

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Extension fields under metadata.extensions.gsd-skill-creator | Namespaced to avoid conflicts with standard fields | ✓ Good |
| Bounded learning (≥3 corrections, 7-day cooldown, ≤20% change) | Prevents runaway refinements | ✓ Good |
| Local embeddings over API calls | No network dependency, faster inference | ✓ Good |
| JSONL append-only observation storage | Simple, crash-safe, streamable | ✓ Good |
| Pluggable pipeline stages over monolithic loading | Extensible, composable architecture | ✓ Good |
| Token budget 2-5% of context | Prevents skill bloat from undermining context management | ✓ Good |
| TDD with RED-GREEN cycle for all plans | Catches regressions early, enables confident refactoring | ✓ Good |
| Allowlist (pick) over blocklist (strip) for portable export | More robust against new extension fields | ✓ Good |
| z.preprocess for dual-format allowed-tools | Cleaner than z.union for same output type (always string[]) | ✓ Good |
| Visited-set DFS for circular reference detection | Simpler than Kahn's for file reference graphs | ✓ Good |
| Kahn's BFS for inter-team deadlock detection | Better cycle reporting for team dependency graphs | ✓ Good |
| Node.js zlib over modern-tar gzip encoder | Avoids web-to-node stream conversion issues | ✓ Good |
| Adaptive RAG defaults to TF-IDF for moderate queries | Faster path preferred when semantic routing uncertain | ✓ Good |
| Corrective RAG max 3 iterations with 5% diminishing returns | Prevents infinite loops on small corpora | ✓ Good |
| Static keyword map for GSD reference injection | Zero runtime overhead vs dynamic discovery | ✓ Good |
| Content safety: standard tier local, strict tier remote | Proportional security based on trust level | ✓ Good |
| RetrievalConfig opt-in (disabled by default) | No behavior change for existing users | ✓ Good |
| Extract-to-temp then copy for skill installation | Never writes directly to final destination (safety) | ✓ Good |
| Multi-check over regex for path traversal | Clarity over cleverness in security code | ✓ Good |
| Separator-boundary check in assertSafePath | Prevents partial prefix collisions (e.g., /skills vs /skills-backup) | ✓ Good |
| Wrap gray-matter (not raw js-yaml) for YAML safety | Consistency with 30+ existing import sites | ✓ Good |
| Discriminated union result type for safe parse | Ergonomic error handling without try/catch | ✓ Good |
| Checksum over data field only (not entire envelope) | Isolates integrity to payload, envelope metadata can evolve | ✓ Good |
| Manual type checks over Zod for JSONL envelope | Minimal import overhead for hot-path validation | ✓ Good |
| Blocklist always wins over allowlist for discovery | Security-first: explicit deny cannot be overridden | ✓ Good |
| npm audit --audit-level=high (not moderate) for CI | Avoids alert fatigue on local development tool | ✓ Good |
| Promise.race timeout for hook error boundaries | Never blocks Claude Code session on hook bugs | ✓ Good |
| O_EXCL atomic file creation for locks | Race-free lock acquisition without advisory locking | ✓ Good |

| gsd-stack as bash script in this project | Tight integration with skill-creator, no separate repo overhead | ✓ Good |
| Amiga chipset model for agent architecture | Proven model for specialized coprocessors coordinated by lightweight kernel | ✓ Good |
| Non-invasive integration (no GSD modifications) | GSD is separate project; all integration through skill-creator surfaces | ✓ Good |
| Opt-out model for integration toggles (all default true) | Users disable features, not enable them — maximum value with minimal config | ✓ Good |
| POSIX shell + jq for post-commit hook (no Node.js) | Zero-overhead, portable, <100ms execution | ✓ Good |
| Scan-on-demand over file watcher daemon | Simpler, no background processes, sufficient for v1 | ✓ Good |
| Slash commands as markdown instruction files (not TypeScript) | Claude reads markdown naturally; no build step needed for commands | ✓ Good |
| Wrapper commands delegate to GSD (don't reimplement) | Single source of truth for GSD behavior; wrappers add value, not complexity | ✓ Good |
| Regex-based YAML parsing (no yaml library for monitoring) | Avoids dependency for predictable GSD frontmatter formats | ✓ Good |
| scan-state.json for cross-session state tracking | Simple JSON file enables transition detection between sessions | ✓ Good |
| Sequential pairing with tool_use_id fallback for transcript parsing | Covers both ordered and out-of-order transcripts | ✓ Good |
| Partial pairs stored with null output (not discarded) | Enables downstream CAPT-04 analysis of incomplete executions | ✓ Good |
| Variance formula (unique-1)/(total-1) for determinism | Maps extremes correctly: 0.0=all same, 1.0=all different | ✓ Good |
| Composite weights: determinism 0.4, frequency 0.35, token savings 0.25 | Determinism highest for correctness priority | ✓ Good |
| Tool-to-bash mapping (Read→cat, Bash→passthrough, Write→heredoc) | Natural shell equivalents for deterministic replay | ✓ Good |
| Calibration gates only when both threshold AND report provided | Graceful fallback when calibration data unavailable | ✓ Good |
| Dual-strategy tracing for lineage (outputs-contain + inputs-list) | Robust artifact linking across pipeline stages | ✓ Good |
| Dashboard collectors return plain data objects (no rendering) | Decoupled from presentation, testable in isolation | ✓ Good |
| Non-detached child_process.spawn for Wetty | Dies with parent process, avoids orphans | ✓ Good |
| Native fetch with AbortSignal.timeout() for health check | No external HTTP libs, Node 22+ built-in | ✓ Good |
| Compound tmux command (attach ∥ new) for session binding | Single command handles both existing and new sessions | ✓ Good |
| Constructor injection for DashboardService generator | Simpler than vi.mock, matches project DI pattern | ✓ Good |
| Promise.allSettled for DevEnvironmentManager concurrency | One service failure never blocks the other | ✓ Good |
| AbortController for file watcher lifecycle | Clean cancellation without leaked handles | ✓ Good |
| Separate html/styles in TerminalHtmlResult | Generator injects CSS in `<style>` and HTML in body at different locations | ✓ Good |
| Filesystem message bus over WebSockets | No daemon, no server dependency, survives process restarts | ✓ Good |
| handleRequest returns boolean for route passthrough | Composable routing without Express dependency | ✓ Good |
| Subdirectory allowlist via Set for helper endpoint | Explicit, no regex bypass risk for filesystem writes | ✓ Good |
| Dynamic import with try/catch for helper router | Graceful degradation when dist/ not compiled | ✓ Good |
| Event delegation for question card interactions | Cards rendered dynamically, single listener handles all | ✓ Good |
| HOT_SETTINGS Set with dotted paths | Clear runtime vs restart-required distinction | ✓ Good |
| Clipboard fallback wrapping window.fetch | Transparent degradation when helper endpoint unreachable | ✓ Good |
| 5-state staging filesystem (inbox/checking/attention/ready/aside) | Clear document lifecycle with human decision points | ✓ Good |
| 11 built-in hygiene patterns across 3 categories | Covers major security patterns without ML complexity | ✓ Good |
| Four-tier trust model (Home/Neighborhood/Town/Stranger) | Proportional scrutiny based on content familiarity | ✓ Good |
| Critical patterns never auto-approve | Safety-first: YAML code execution, path traversal always surface | ✓ Good |
| Word-level Jaccard for similarity checks | Deterministic, no embeddings needed for staging analysis | ✓ Good |
| Score-based topology recommender with 5 scoring functions | Transparent reasoning, preference-ordered tiebreak | ✓ Good |
| Kahn's topological sort for critical path in decomposition | Proven algorithm, handles DAG dependencies correctly | ✓ Good |
| QueueManager as factory function (not class) | Simpler API, composable with DI interfaces | ✓ Good |
| Eager async load via IIFE promise in createQueueManager | Sync methods work after any async call without explicit init | ✓ Good |
| SVG dependency lines with client-side positioning | No server-side layout needed, responsive to DOM changes | ✓ Good |
| Google Fonts @import with system font fallbacks | Progressive enhancement for typography | ✓ Good |
| Unicode shape chars for activity feed entities | No SVG needed for inline text context, simpler rendering | ✓ Good |
| Column layout for topology (teams 0.15, agents 0.5, skills 0.85) | Left-to-right team→agent→skill flow matches mental model | ✓ Good |
| CSS-only details/summary for legend collapsibility | No JavaScript needed per REQ-TC-01 | ✓ Good |
| Domain-prefixed identifiers (F-1, B-1.api, T-1:rcp) | Topology-encoding enables visual recognition at a glance | ✓ Good |
| Alphabetical tie-breaking for domain inference | Deterministic results when multiple domains score equally | ✓ Good |
| resolveIdentifier tries agent→skill→adapter order | Most common to least common for early resolution | ✓ Good |
| Character-based simulation (not tokens) for projectLoading() | Synchronous operation, no API calls, matches char-based BudgetStage | ✓ Good |
| Separate criticalUsed/standardUsed counters in projection | Mirrors BudgetStage dual-budget logic correctly | ✓ Good |
| installedTotal aliases totalChars for backward compat | Existing consumers unchanged, additive extension | ✓ Good |
| budgetColorCode returns string code (not colored text) | Caller controls color application (picocolors etc.) | ✓ Good |
| getBudgetProfile('gsd-executor') as default projection profile | Most common agent type, sensible default | ✓ Good |
| Config > env var > default priority for cumulative budget | Config-first with backward-compatible env var fallback | ✓ Good |
| Profile budget lookup strips gsd- prefix | Config uses short names (executor, planner) for readability | ✓ Good |
| Old BudgetSnapshot migration defaults to totalChars | Graceful upgrade path, no data loss on old snapshots | ✓ Good |

---
*Last updated: 2026-02-14 after v1.20 milestone shipped*
