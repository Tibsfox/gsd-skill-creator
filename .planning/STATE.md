# State

## Current Position

Milestone: v1.19 — Budget Display Overhaul
Phase: 149-budget-inventory-model (in progress)
Plan: 149-02 complete, next 149-03
Status: Executing phase 149
Last activity: 2026-02-14 — Completed 149-02 (extended CumulativeBudgetResult with inventory and projection)

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-14 after v1.19 milestone start)

**Core value:** Skills, agents, and teams must match official Claude Code patterns so they work correctly when loaded by Claude Code
**Current focus:** v1.19 Budget Display Overhaul — separating installed inventory from loading projection

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
- Dynamic import with try/catch for helper router (graceful degradation when dist/ not compiled)
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
- scanContent uses spread-concat of all three scanner results (intentionally simple composition)
- Barrel uses type-only exports for HygieneCategory, HygieneSeverity, HygienePattern, HygieneFinding
- Integration test verifies custom patterns work through barrel API (addPattern + scanContent)
- TOOL_PURPOSE_MAP with 5 tool categories (Bash/Write/WebFetch/WebSearch/NotebookEdit) and keyword-based matching
- Tools not in TOOL_PURPOSE_MAP treated as safe (never flagged) -- forward-compatible for new safe tools
- scopeKeywords checked alongside purpose string for additional scope coherence matching surface
- riskLevel computed as highest severity among findings using ordered SEVERITY_ORDER array
- Four-tier trust model: home > neighborhood > town > stranger with strict priority ordering
- isProjectLocal/isUserLocal boolean overrides take priority over origin string for home/neighborhood
- CRITICAL_PATTERN_IDS as ReadonlySet<string> for O(1) lookup and immutability
- Parent in ProvenanceNode means upstream input (first resolvable input in chain), not downstream consumer
- Conservative default: unknown/empty provenance chains inherit 'stranger' tier
- Cycle prevention via visited Set in recursive provenance trace
- Trust progression based on approval count: 1=session, 2=7-day, 3=30-day, 4+=90-day
- Critical patterns locked at session level forever regardless of approval count
- approve and suppress both call trustStore.approve (UI distinction only, same trust mechanics)
- Session-level entries have null expiresAt (caller manages session lifecycle externally)
- pruneExpired skips session entries (no expiresAt to compare against)
- Common word filtering via 60+ entry Set for scope extraction (stop words, verbs, generic heading words)
- File glob extraction strips wildcards, extensions, and leading dots to get meaningful stems
- Drift ratio rounded to 2 decimal places for consistent severity thresholds
- Severity-to-importance mapping: critical->critical, high->warning, medium->notice, low/info->info
- FILTERED_TIERS as ReadonlySet for O(1) home/neighborhood tier lookup
- Category-specific suggestion strings as const record keyed by HygieneCategory
- Coherence findings always isCritical=false (never auto-approve blockers)
- Summary counts computed from surfaced findings only (not pre-filter total)
- Severity threshold >= 0.2 (not > 0.2) for warning in pattern fidelity (includes boundary)
- Fuzzy stem matching via commonPrefixLength >= 4 chars for pattern fidelity evidence overlap
- Evidence overlap threshold 0.3 (30% of section tokens must appear in evidence corpus)
- Word-level Jaccard similarity for coherence and copying checks (deterministic, no embeddings)
- Population stdDev (N not N-1) for length outlier detection in training coherence
- Sliding window with match merging for verbatim copying detection (50-char minimum)
- Sentence-level best-match averaging for overall similarity in copying detector
- Non-critical finding selection for pipeline integration test (critical patterns locked at session, coherence findings as fallback)
- checkDerived aggregates all sub-checkers; passed=true only when no critical/warning findings
- Optional checks (trainingPairs, referenceTexts) skipped when input not provided
- Barrel follows hygiene/derived pattern: type-only + value exports
- Structure-aware confused threshold: documents with headings route to gaps not confused even with few words
- Allow up to 2 missing key areas for clear routing (focused technical docs may not use all 4 keyword sets)
- HEADING_RE constant for DRY heading detection in clarity assessor
- ATTENTION_RISKS ReadonlySet for O(1) critical/warning lookup in orchestrator
- DI interface typed with inline moveDocument options (MoveDocumentOptions not exported from state-machine)
- Placeholder ClarityAssessment for paused hygiene flow (route=confused, confidence=0)
- Step executors extracted as private functions for testability and readability
- buildResult helper centralizes route-to-message mapping and needsConfirmation logic
- Content read from checking dir first, inbox fallback for resume (document may have moved)
- Intake-flow barrel follows hygiene/derived pattern: type-only exports for interfaces, value exports for functions/constants
- Orchestrator must record 'staged' step before 'hygiene' (step tracker enforces sequential ordering)
- 15 resource analysis types (DomainRequirement through ResourceManifest) with 5 const arrays
- TopologyType subset of TEAM_TOPOLOGIES (single, pipeline, map-reduce, router, hybrid) -- excludes Claude Code team concepts
- Pure function analyzeVision() with pattern-matching extraction (no I/O, deterministic)
- Section-based document parsing with heading detection for requirement category assignment
- 30+ known external dependency patterns (databases, services, APIs, libraries) with type classification
- Word-level Jaccard overlap with stop word filtering and category keyword boost (+0.2) for skill matching
- Four-tier skill match classification: ready (>=0.5), recommended (>=0.3), flagged (>=0.1), missing (<0.1)
- Project scope takes priority over user scope for duplicate skill names via deduplication
- Score-based topology recommender with 5 scoring functions and preference-ordered tiebreak
- Hybrid cap raised to 1.5 to exceed pipeline's 1.0 for truly complex mixed work
- Map-reduce independence boost guarded by requirements.length > 0 (prevents false scoring on empty analysis)
- Confidence: winner score / total, penalized 0.05 per ambiguity marker, floor 0.3
- Budget allocation via complexity-based utilization targets (low=40%, medium=55%, high=70%, critical=80%) with 7-category proportional normalization
- Minimum 5% safety margin enforced regardless of utilization target and category proportions
- Skill-loading scales at 5% base + 2% per matched skill capped at 20%
- Same-category requirements inferred as sequential dependencies (later depends on earlier)
- Foundation/setup/infrastructure category requirements become dependency roots for all other tasks
- Critical path computed via Kahn's topological sort with dynamic programming longest path
- Max parallelism as widest anti-chain in dependency DAG via level assignment
- ManifestDeps DI interface composes all 5 sub-analyzers for testability
- HITL predictions from ambiguity markers (decision checkpoints) and high/critical complexity (review checkpoints)
- Queue priority: critical=1, high=2, medium=3, low=4; duration = reqCount * complexity multiplier
- Barrel follows hygiene/derived pattern: type-only exports for interfaces, value exports for functions/constants
- IntakeBridgeDeps DI interface mirrors orchestrator confirmIntake signature for bridge testability
- Manifest persisted as {filename}.manifest.json in ready directory alongside document and metadata
- Content read from ready directory post-confirmIntake (document already moved there by confirm flow)
- 'queued' recorded as final INTAKE_FLOW_STEPS step after manifest generation
- Staging barrel re-exports complete resource analysis API (15 types, 5 constants, 6 functions, bridge)
- QueueState is a 7-value union distinct from 5-value StagingState (uploaded|checking|needs-attention|ready|queued|executing|set-aside)
- executing is terminal queue state (no transitions out)
- set-aside accessible from all non-terminal queue states
- Module-level dirEnsuredCache with Map keyed by basePath for multi-project audit logger safety
- _resetDirCache exported for test isolation of audit logger
- Forward keywords (requires, depends on, needs, after, prerequisite) produce edge from mentioner to target
- Reverse keywords (blocks, enables, provides for) produce edge from target to mentioner
- Explicit dependency confidence 0.8-0.85; implicit 0.3-0.6 with cap
- Deduplication: explicit edges win over implicit for same directed pair
- Implicit shared deps: confidence = 0.3 + 0.1 * count, capped at 0.6
- Implicit category overlap: Jaccard > 0.3 threshold, confidence = overlap * 0.6, capped at 0.6
- DependencyEdge defined locally in optimization-analyzer (dependency-detector not yet available at import time)
- Tag batching requires both Jaccard >= 0.4 AND >= 2 shared tags to prevent false positives
- Greedy maximal independent set for parallel lane detection (sufficient for queue sizes)
- Shared setup merges multiple signals per pair into single suggestion with highest confidence
- Eager async load via IIFE promise in createQueueManager (sync methods read from populated map after any async call)
- Queue state persisted to queue-state.json (separate from queue.jsonl audit log)
- QueueManager is a plain object from factory function (not a class)
- Queue barrel follows hygiene/derived/resource pattern: type-only + value exports
- Staging barrel re-exports complete queue API (9 types, 3 constants, 6 functions)
- Staging barrel re-exports pre-wiring and retroactive audit APIs (8 types, 4 values)
- Integration tests validate pre-wiring, retroactive audit, and dashboard panel composition through barrel API
- Single topology assigns all non-missing skills to one executor agent
- Pipeline/hybrid use round-robin distribution across stage-N agents
- Map-reduce: coordinator gets first skill, workers split remainder
- Router agent gets no skills; handler agents split all skills
- Missing skills become gap strings, not PreWiredSkill entries
- ELIGIBLE_STATES as ReadonlySet<QueueState> for O(1) lookup and type safety in retroactive audit
- Precautionary severity (max across patterns) when no content available or no content matches
- Regex cloned in patternMatchesContent to avoid shared state with global flag
- 7 QueueStates mapped to 4 kanban columns: uploaded+checking->incoming, needs-attention->attention, ready+queued+executing->ready, set-aside->aside
- SVG dependency lines use data-from/data-to attributes with client-side getBoundingClientRect positioning
- Per-state badge colors: blue(uploaded), yellow(checking), orange(needs-attention), green(ready), teal(queued), purple(executing), gray(set-aside)
- Google Fonts @import used for Inter and JetBrains Mono with system font fallback stacks (progressive enhancement)
- Renderer test updated to allow font import URLs (strip Google Fonts @import before checking for external URLs)
- Weight hierarchy uses font-weight only (no font-size) so primary/secondary differ by boldness at same size
- Case discipline: .case-label is defensive text-transform:none; .case-interrupt is uppercase with letter-spacing
- Gantry cell ordering: status, agent, phase, budget (importance hierarchy)
- Active status keywords: executing, active, running, building (case-insensitive matching)
- Budget color thresholds: green <80%, orange 80-95%, red >95%
- Post-render gantry injection via html.replace('</header>') pattern (same as refresh script)
- Token metric detection via keyword matching on metric keys (token, budget, context)
- 24x24 viewBox for all entity SVG shapes with configurable render size (default 16px)
- Domain color CSS custom properties (--domain-*) with hex fallbacks for standalone rendering
- Self-closing SVG shape elements with inline fill attribute for domain color
- CSS-only <details>/<summary> for legend collapsibility (no JS, REQ-TC-01)
- Shipped milestones get green fill (#3fb950) via inline style override; in-progress use infrastructure purple
- Panel header shapes at size 14 for compact headers
- Budget gauge scan-label hidden via opacity:0 with CSS-only hover reveal (no JS)
- Budget gauge headroom uses opacity:0.3 on --text-dim for subtle gray fill
- Budget gauge min-width:2px on segments prevents invisible slivers at very small percentages
- Silicon panel progressive enhancement gate: null=empty string, false=disabled msg, true=full panel
- Silicon panel STATE_STYLES constant maps all 5 adapter states to CSS class + diamond color
- Silicon panel uses Unicode U+25C6 (black diamond) for adapter indicator shape
- Test helper 'enabled' in overrides check instead of ?? to handle null correctly (nullish coalescing treats null as nullish)
- Unicode shape chars for activity feed entity types: agent=circle, skill=square, team=hexagon, phase=chevron, adapter=diamond, plan=dot
- 6 domain color CSS classes (.af-domain-{domain}) with custom property fallbacks for activity feed
- occurredAt used for sort only in activity feed, never rendered (REQ-AF-06)
- EVENT_ENTITY_MAP record for session event-to-entityType mapping (10 event types to 6 entity types)
- DESCRIPTION_TEMPLATES record with template functions for human-readable activity descriptions
- Vanilla JS IIFE with event delegation on .activity-tab-panel for tab toggle (REQ-TC-01)
- Activity tab visible by default, terminal hidden via inline style display:none
- 6 topology shape builders as typed record: circle (agent), rect (skill), hexagon (team), chevron (phase), diamond (adapter), dot (plan)
- Cubic bezier paths for topology edges with horizontal control point offset for smooth curves
- 12-node collapse with active-first sorting and type-priority ranking (team>agent>skill>phase>adapter>plan)
- CSS-only stroke-dashoffset animation for active edge pulse (tp-pulse keyframes)
- Column layout for topology: teams 0.15, agents 0.5, skills 0.85 (normalized 0-1)
- Even vertical distribution via (i+1)/(count+1) spacing within columns
- Topology panel conditional on TopologySource availability in generator (graceful skip when no data)
- Detail panel slide-in animation via @keyframes tp-slide-in with vanilla JS event delegation
- Alphabetical tie-breaking for inferDomain when multiple domains score equally
- DOMAIN_PREFIX_MAP[domain] for clean prefix lookup in SuggestionManager (not ternary chain)
- Agent ID '-0' as unassigned agent prefix for skills without a parent agent
- Consonant extraction for abbreviation generation in suggestMigration (skip vowels when >= 3 consonants)
- Keyword hit ratio for migration confidence with 0.1 minimum floor
- resolveIdentifier tries agent first, then skill, then adapter (most specific last)
- skillId added to Suggestion interface and SuggestionStore transition options for identifier persistence
- Character-based simulation (not tokens) for projectLoading() synchronous operation without API calls
- Separate criticalUsed and standardUsed counters mirroring BudgetStage dual-budget logic
- Skills not listed in any profile tier default to standard (matching getTierForSkill behavior)
- installedTotal aliases totalChars for backward compat (existing consumers unchanged)
- loadableTotal defaults to totalChars when no profile provided (backward compat assumes everything loads)
- formatBudgetDisplay uses nullish coalescing fallback for installedTotal/loadableTotal (handles pre-extension result objects)
- Dual-view display only triggers when installedTotal !== loadableTotal (single-view otherwise)
- Progress bar uses loadableTotal in dual-view (what actually loads matters more than what's installed)

### Architecture Notes
- Dashboard module: src/dashboard/ (parser, renderer, generator, structured-data, incremental, refresh, collectors, metrics, terminal-panel, terminal-integration, upload-zone, config-form, submit-flow, question-card, question-poller, console-page, console-settings, console-activity, staging-queue-panel, entity-shapes, entity-legend, gantry-panel, gantry-data, budget-gauge, silicon-panel, activity-feed, activity-tab-toggle, topology-renderer, topology-data, topology-integration)
- Terminal module: src/terminal/ (launcher, health, process-manager, session, types, index)
- Launcher module: src/launcher/ (dashboard-service, dev-environment, types, index)
- Console module: src/console/ (message types/schemas, reader, writer, message-handler, status-writer, helper endpoint, bridge-logger, question-schema, question-responder, check-inbox integration tests)
- Scripts module: scripts/console/ (check-inbox.sh, write-question.sh, write-status.sh, validate-config.sh)
- gsd-stack session management: bash scripts with tmux integration (v1.13)
- v1.14 promotion pipeline: src/pipeline/ + src/dashboard/collectors/
- 22 milestones shipped, 148 phases, 430 plans, ~190k LOC
- Filesystem message bus at .planning/console/ (inbox/outbox/config/uploads/logs)
- Helper endpoint wired into serve-dashboard.mjs via dynamic import (browser->filesystem bridge)
- No WebSockets -- dashboard polls outbox at 2-3s intervals
- Staging module at src/staging/ (types, schema, directory, intake, state-machine, index)
- Staging hygiene submodule at src/staging/hygiene/ (types, patterns, scanner-config, scanner-embedded, scanner-hidden, scanner, scope-coherence, trust-types, familiarity, trust-store, finding-actions, report, index)
- Staging derived submodule at src/staging/derived/ (types, provenance, scope-drift, pattern-fidelity, training-coherence, copying-detector, checker, index)
- Staging intake-flow submodule at src/staging/intake-flow/ (types, clarity-assessor, step-types, step-tracker, orchestrator, index)
- Staging resource submodule at src/staging/resource/ (types, analyzer, skill-matcher, topology, budget, decomposer, manifest, intake-bridge, index)
- Staging queue submodule at src/staging/queue/ (types, state-machine, audit-logger, dependency-detector, optimization-analyzer, manager, pre-wiring, retroactive-audit, index)
- Staging filesystem at .planning/staging/ (inbox, checking, attention, ready, aside, queue.jsonl)
- Identifiers module at src/identifiers/ (types, generator, compat, metadata, index)

### Todos
- (none)

### Blockers
- (none)

## Performance Metrics

| Metric | Value |
|--------|-------|
| Total milestones | 22 shipped (v1.0-v1.18 + v1.8.1 patch) |
| Total phases | 148 complete |
| Total plans | 431 complete |
| Total LOC | ~190k TypeScript |

## Session Continuity

Last: 2026-02-14 — Completed 149-02 extended CumulativeBudgetResult
Stopped at: Completed 149-02-PLAN.md
Next action: Execute 149-03 (next plan in phase 149)
Context: 149-02 extended CumulativeBudgetResult with installedTotal/loadableTotal/projection. 72 tests passing. checkCumulative accepts optional BudgetProfile for loading projection. formatBudgetDisplay shows dual-view when totals differ.

---
*Last updated: 2026-02-14 (149-02 complete)*
