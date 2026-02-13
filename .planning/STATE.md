# State

## Current Position

Milestone: v1.17 — Staging Layer
Phase: 135 — Hygiene Pattern Engine (in progress)
Plan: 135-03 complete
Status: Executing phase 135
Last activity: 2026-02-13 — Completed 135-03 (YAML config safety scanner)

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-13 after v1.17 started)

**Core value:** Skills, agents, and teams must match official Claude Code patterns so they work correctly when loaded by Claude Code
**Current focus:** v1.17 Staging Layer — smart intake, security hygiene, resource analysis, derived knowledge, queue pipelining

## Accumulated Context

### Config
- Mode: yolo
- Depth: comprehensive
- Model profile: quality (opus executors)
- Parallelization: enabled
- commit_docs: false

### Key Decisions
- ALL_STAGING_DIRS explicitly lists 5 subdirs (root created implicitly by recursive mkdir; queue.jsonl managed by queue module)
- StagingMetadata uses index signature [key: string]: unknown for future extensibility (INTAKE-02 incremental build)
- Used z.string().regex(/^\//) for base_path validation (reliable across Zod versions)
- auth_mode uses z.enum(['none']) for forward-extensibility to ['none', 'token']
- No changes needed to reader.ts -- safeParse automatically includes terminal section
- Non-detached spawn for Wetty (dies with parent, avoids orphans)
- Native fetch with AbortSignal.timeout() for health check (no external HTTP libs)
- Compound tmux command (attach || new) for Wetty --command flag
- Constructor injection for DashboardService generator function
- Promise.allSettled for DevEnvironmentManager concurrent operations
- AbortController for file watcher lifecycle in DashboardService
- id regex ^msg-\d{8}-\d{3,}$ for envelope ids (3+ digit seq for growth)
- z.record(z.string(), z.unknown()) for message payload (any object shape)
- Promise.all for parallel console directory creation
- jq required as runtime dependency for bash JSON parsing in check-inbox.sh
- Malformed JSON files moved to acknowledged/ to prevent infinite retry loops
- set -euo pipefail for strict bash error handling in scripts
- Embedded client-side extractMetadata mirrors server-side extractDocumentMetadata for isomorphic parsing
- SVG icon for upload zone (not emoji) for accessibility and theme consistency
- color-mix() CSS function for drag-active background tint
- Mock IncomingMessage/ServerResponse for helper tests (no real HTTP server needed)
- CORS * since localhost-only is a server-level concern, not router concern
- handleRequest returns boolean for route passthrough composability
- Subdirectory allowlist via Set (inbox/pending, config, uploads) -- explicit, no regex bypass risk
- Explicit section-level defaults in Zod schema (not empty objects) to ensure nested defaults apply correctly
- mergeDefaults() function for shallow+nested merge of partial config overrides in form renderer
- appendFile for JSONL concurrent safety (atomic for small writes, one line per entry)
- Cached mkdir (dirEnsured flag) to avoid redundant filesystem calls after first logger write
- safeLog wrapper swallows logger errors to prevent HTTP 500 from audit logging
- Component composition via function calls for submit flow (renderUploadZone + renderConfigForm inlined)
- setInterval polling at 500ms for submit readiness check (avoids cross-component event coupling)
- Two-stage fetch pattern: config write first, milestone-submit message only on config success
- Skill references scripts by relative path (scripts/console/*.sh) for project portability
- Content quality enforced at <5000 words and 3+ sections via test suite
- jq --argjson for progress field ensures numeric type in JSON output (write-status.sh)
- Timestamp colons replaced with hyphens in question filenames for filesystem safety
- validate-config.sh checks only milestone.name and milestone.submitted_at as required fields
- Pure function dispatch for message handler (no side effects, no filesystem)
- Discriminated union MessageAction type for structured return values
- StatusWriter overwrites current.json each time (always reflects current state)
- Boolean(payload.hot) defaults to false when hot flag not specified in config-update
- Type aliases inferred from schema via z.infer indexed access (not separate type definitions) for QuestionSchema
- TimeoutFallback extracted via NonNullable<Question['timeout']>['fallback'] for DRY type inference
- Options structurally optional in schema -- renderer enforces semantic requirement for choice/multi-select
- Binary and confirmation types render direct action buttons (no separate submit button)
- Choice, multi-select, text types include submit button in actions bar
- Urgency conveyed via left border color (dim/accent/orange/red) with critical background tint
- Timeout formatted as Xm Ys for >= 60s, Xs for < 60s
- Event delegation on document.click for question card interactions (cards rendered dynamically)
- Urgency escalation ladder: low->high, medium->critical, high->critical, critical->critical (ceiling)
- submitQuestionResponse globally accessible via window for external integration
- Force-tracked dist/ compiled files (console-page.js, question-card.js, question-poller.js) since generator.js imports them
- Console status reads outbox/status/current.json at generation time with graceful ENOENT handling
- QuestionPoller basePath derived from planningDir by stripping .planning/ suffix
- Settings and activity sections render as placeholders for plans 02 and 03 to replace
- HOT_SETTINGS Set with 17 dotted paths for runtime-changeable settings
- Non-hot settings disabled with title tooltip 'Requires session restart to take effect'
- Event delegation on .console-settings-panel for change events
- Config-update envelope posts to helper endpoint with hot:true flag and inbox/pending subdirectory
- Pending-sync indicator via .setting-pending class with CSS animation
- Force-tracked dist/dashboard/console-settings.js (matching existing dist/ pattern)
- classifyLogEntry dispatches on error status first, then filename patterns, then subdirectory, then fallback to config-write
- Relative time formatting with optional now parameter for deterministic testing
- Maximum 50 activity entries displayed (newest first after reverse-chronological sort)
- Clipboard fallback wraps window.fetch to intercept failed POSTs to /api/console/message
- Toast notification auto-dismisses after 3 seconds with fade-out animation
- Persistent offline banner before .console-settings-panel when helper unreachable
- Force-tracked dist/dashboard/console-activity.js (matching existing dist/ pattern)
- Dynamic import('./dist/console/helper.js') with try/catch for graceful degradation when dist/ not compiled
- Helper router passthrough placed after /api/regenerate but before static file serving for correct priority
- Integration test creates minimal HTTP server mirroring serve-dashboard.mjs handler flow (not importing .mjs directly)
- Promise.all for parallel document and metadata writes in stageDocument (independent files)
- No filename sanitization in stageDocument (internal API; caller handles path traversal)
- Metadata validated through StagingMetadataSchema.parse before writing (catches bugs at write time)
- rename() for document move, write+unlink for metadata (same filesystem guarantees atomic rename; metadata needs status update)
- Re-validate metadata through StagingMetadataSchema after status update (ensures integrity after mutation)
- Barrel imports from intake.ts without stub (plan 02 completed before plan 03 barrel creation)
- 11 built-in hygiene patterns across 3 categories (4 embedded-instructions, 3 hidden-content, 4 config-safety)
- Detect functions for complex patterns (zero-width chars, base64, YAML merge bombs); regex for simple matching
- Registry uses mutable array with immutable reference copy for reset
- Regex cloned with global flag for per-match finding generation in scanners
- Detect functions take priority over regex when pattern has both
- Line number computed from newline count before match offset (1-based)
- Scanner functions delegate to registry patterns via getPatterns(category) -- scanners are thin, patterns carry the logic
- Both scanners (embedded, hidden) share identical structure: fetch patterns, iterate, delegate to detect or regex

### Architecture Notes
- Dashboard module: src/dashboard/ (parser, renderer, generator, structured-data, incremental, refresh, collectors, metrics, terminal-panel, terminal-integration, upload-zone, config-form, submit-flow, question-card, question-poller, console-page, console-settings, console-activity)
- Terminal module: src/terminal/ (launcher, health, process-manager, session, types, index)
- Launcher module: src/launcher/ (dashboard-service, dev-environment, types, index)
- Console module: src/console/ (message types/schemas, reader, writer, message-handler, status-writer, helper endpoint, bridge-logger, question-schema, question-responder, check-inbox integration tests)
- Scripts module: scripts/console/ (check-inbox.sh, write-question.sh, write-status.sh, validate-config.sh)
- gsd-stack session management: bash scripts with tmux integration (v1.13)
- v1.14 promotion pipeline: src/pipeline/ + src/dashboard/collectors/
- 20 milestones shipped, 133 phases, 380 plans, ~159k LOC
- Filesystem message bus at .planning/console/ (inbox/outbox/config/uploads/logs)
- Helper endpoint wired into serve-dashboard.mjs via dynamic import (browser->filesystem bridge)
- No WebSockets -- dashboard polls outbox at 2-3s intervals
- Staging module at src/staging/ (types, schema, directory, intake, state-machine, index)
- Staging hygiene submodule at src/staging/hygiene/ (types, patterns, scanner-config, scanner-embedded, scanner-hidden)
- Staging filesystem at .planning/staging/ (inbox, checking, attention, ready, aside, queue.jsonl)

### Todos
- (none)

### Blockers
- (none)

## Performance Metrics

| Metric | Value |
|--------|-------|
| Total milestones | 20 shipped (v1.0-v1.16 + v1.8.1 patch) |
| Total phases | 134 complete |
| Total plans | 385 complete |
| Total LOC | ~159k TypeScript |

## Session Continuity

Last: 2026-02-13 — Completed 135-03-PLAN.md
Stopped at: Plan 135-03 complete (YAML config safety scanner)
Next action: Execute remaining 135 plans
Context: v1.17 Staging Layer. Phase 135 in progress. src/staging/hygiene/ has types, patterns, scanner-config, scanner-embedded. 48 hygiene tests passing (17 new from 135-03).

---
*Last updated: 2026-02-13 (135-03 complete)*
