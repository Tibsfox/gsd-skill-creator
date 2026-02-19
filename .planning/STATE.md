# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-19)

**Core value:** Skills, agents, and teams must match official Claude Code patterns — and the GSD ecosystem must provide spatial, visual, and operational tools that make complex system design tangible.
**Current focus:** Phase 235 — Partial-Build Compatibility Matrix

## Current Position

Milestone: v1.25 — GSD Ecosystem Integration
Phase: 235 (5 of 5) — Partial-Build Compatibility Matrix
Plan: 3 of 3 in current phase
Status: Phase 235 complete — all plans done, milestone ready for completion
Last activity: 2026-02-19 — Plan 235-03 complete (3-tier capability probe protocol with JSON schema and per-component marker paths)

Progress: [####################] 100%

## Performance Metrics

**Velocity:**
- Total plans completed: 14
- Average duration: 4.4m
- Total execution time: 1.03 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 231 | 3 | 14m | 4.6m |
| 232 | 3 | 13m | 4.3m |
| 233 | 2 | 8m | 4.0m |
| 234 | 3 | 15m | 5.0m |
| 235 | 3 | 12m | 4.0m |

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: 5 phases matching 5 deliverables, sequential execution (each builds on prior)
- [Roadmap]: Phase numbering starts at 231 (continuing from v1.24 phase 230)
- [Roadmap]: Analytical/documentation milestone only — no new code implementation
- [231-01]: Excluded 2 non-vision docs (industry report, screenshot description) from DAG
- [231-01]: Classified amiga-leverage and info-design as Core layer (design philosophy governing architecture)
- [231-01]: AGC ISA (educational) is separate from GSD ISA (aspirational workflow engine)
- [231-02]: 58% hard-blocks edges (higher than research predicted) reflects genuinely deep dependency chains
- [231-02]: skill-creator is most depended-on node (9 incoming edges); gsd-os is most dependent (8 outgoing)
- [231-02]: Zero cycles found -- all 5 potential mutual references resolved as unidirectional
- [231-03]: Critical path is skill-creator -> chipset -> gsd-os -> bbs-pack -> creative-suite (4 hops)
- [231-03]: 3 parallel tracks (Platform Core, Infrastructure, Observability) can all proceed simultaneously
- [231-03]: M1 recommended next: chipset + dashboard-console + lcp (maximum downstream unblocking)
- [231-03]: wetty-tmux excluded from all milestones (permanently deferred, architectural supersession)
- [232-01]: 250ms base debounce (reduced from existing 500ms) because two-tier design adds subscriber delay on top
- [232-01]: Hybrid watch strategy -- single recursive in practice, per-consumer budget accounting conceptually
- [232-01]: WebviewBridge as subscriber -- Tauri event emission is one of 6 subscribers, not core transport
- [232-01]: All subscribers use skip-on-lag (best-effort notifications, no guaranteed delivery)
- [232-01]: Watch budget ~1,020 watches (25% of 4,096 target) with scaling analysis to 8,000+ dirs
- [232-02]: Console msg-* IDs pass through to EventEnvelope (no UUID conversion, schema min 1 char)
- [232-02]: Console sources use 'broadcast' interim until AGENT_OR_SPECIAL_PATTERN regex extended for subsystem:component
- [232-02]: Staging retains human-meaningful filenames with companion .meta.json (not timestamp-prefixed)
- [232-02]: Filename type kebab-case distinct from envelope type SCREAMING_SNAKE_CASE
- [232-03]: WebviewBridge 250ms additional debounce preserves current 500ms total during migration
- [232-03]: Event name transition fs:changed -> fs:dispatched with optional dual-emission period
- [232-03]: PollWatcher 2000ms interval balances latency vs CPU overhead in degraded mode
- [232-03]: 60-second recovery check interval for automatic inotify restoration
- [232-03]: WARN log level for polling fallback (degraded but functional, not broken)
- [232-03]: fanotify rejected -- 9-factor analysis, inotify wins on 5, ties on 2; Linux 5.13+ still insufficient
- [233-01]: zod declared ecosystem-standard: all TypeScript layers MAY use it (cross-cutting schema validation)
- [233-01]: @modelcontextprotocol/sdk classified as Middleware (protocol SDK, not native toolchain)
- [233-01]: @huggingface/transformers passes native-compilation check (WASM is platform-portable, not node-gyp)
- [233-01]: gray-matter/js-yaml not duplication (different capability levels: frontmatter extraction vs raw YAML)
- [233-01]: Core layer rule applies to architectural role, not entire src/ directory
- [233-02]: ESLint no-restricted-imports over eslint-plugin-boundaries (simpler, sufficient for 2-boundary enforcement)
- [233-02]: All Rust modules already private in lib.rs -- tightening targets items within modules, not declarations
- [233-02]: Exception process exactly 4 steps with 90-day review cycle (lightweight for solo dev + Claude)
- [233-02]: Zero current exceptions -- all deps conform via ecosystem-standard clause for zod
- [234-01]: Zod + Vitest over Pact: 5 reasons (HTTP-focus, broker overhead, MQ mismatch, schema duplication, same-process)
- [234-01]: .contract.test.ts in __tests__/ not separate __contracts__/ directory
- [234-01]: expect.schemaMatching deferred: not in Vitest 4.0.18 stable, use .parse() directly
- [234-01]: Console adapter uses 'broadcast' as interim source until AGENT_OR_SPECIAL_PATTERN regex extended
- [234-02]: Producer-side schema ownership with consumer-adapter exception for dual-export boundaries
- [234-02]: 60-day staleness for critical-path boundaries (Console, Staging, AMIGA, Orchestrator)
- [234-02]: 90-day staleness for standard boundaries (Copper, SessionEventBridge, Collectors, Skill)
- [234-02]: 4 re-verification triggers: schema change, Zod major bump, milestone completion, new subscriber
- [234-03]: _fixture_meta field leverages .passthrough() for provenance tracking without schema modification
- [234-03]: Fixtures are append-only (never deleted) -- old fixtures become regression tests
- [234-03]: 3 audit exceptions: watcher.rs (permanent), dashboard/refresh.ts (pending migration), test files (permanent)
- [234-03]: Audit automation via shell script with non-zero exit on unexpected findings
- [235-03]: Detection tiers are cumulative (3 subsumes 2 subsumes 1), not alternatives
- [235-03]: agc-learning is not a DAG node; AGC lives under gsd-isa; amiga-workbench is the 16th internal node
- [235-03]: Tier 3 probe implementation via EventDispatcher subscriber registration (no separate mechanism)
- [235-03]: Aspirational vs absent: aspirational = known + planned; absent = not present in this build

### Key Context

- 28 milestones shipped (v1.0-v1.24 + v1.8.1 patch), 230 phases, 625 plans, ~278k LOC
- v1.24 conformance audit: 336 checkpoints, all resolved (211 pass + 125 amended)
- 9,355 tests passing, TypeScript clean
- Known-issues list: 99 deferred items in 8 groups for future milestones
- v1.25 is analytical/documentation — produces specs and plans, not implementation code

### Pending Todos

None.

### Blockers/Concerns

- ~~Before Phase 232: 30-min code review of `src-tauri/src/watcher.rs` and `src/console/types.ts` vs. silicon layer EventDispatcher design~~ (resolved in 232-RESEARCH.md)
- ~~Before Phase 235: Full read of known-issues.md to categorize all 99 deferred items~~ (resolved in 235-01 known-issues cross-reference)

## Session Continuity

Last session: 2026-02-19
Stopped at: Completed 235-03-PLAN.md (3-tier capability probe protocol with JSON schema and per-component marker paths) — Phase 235 complete, all v1.25 phases done
Resume file: None
