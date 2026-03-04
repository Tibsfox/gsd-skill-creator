# Chain Link: v1.39 Orchestrator Pipeline

**Chain position:** 42 of 50
**Milestone:** v1.50.55
**Type:** REVIEW
**Score:** 4.50/5.0

---

## Score Trend

```
Pos  Ver      Score  Δ      Commits  Files
 35  v1.31    4.41   -0.09       31   103
 36  v1.32    4.53   +0.12       46    64
 37  v1.33    4.28   -0.25       64   138
 38  v1.34    3.94   -0.34       16   124
 39  v1.35    4.50   +0.56       81   107
 40  v1.36+37 4.44   -0.06       53   115
 41  v1.38    4.56   +0.12       39    69
 42  v1.39    4.50   -0.06       37   129
rolling: 4.395 | chain: 4.288 | floor: 3.32 | ceiling: 4.56
```

## What Was Built

A complete orchestrator pipeline spanning 9 phases (375-383) across Rust backend, TypeScript frontend, and shell scripts. The system wires the full application stack: IPC type parity, SSE streaming API client, CLI chat UI, magic level filtering, service lifecycle management with topological startup ordering, staging intake with hygiene/quarantine pipeline, self-improvement retrospective engine, and integration wiring that connects API through Magic Filter to Chat renderer with LED panel state visualization. 37 commits, 129 files, +17,130 lines. Zero fix commits.

### IPC Event Types + Tauri Commands (Phases 375, 4 commits)

- **TS/Rust type parity (ipc/types.ts + ipc/types.rs):** Shared event payload types — `ChatDeltaPayload`, `ChatErrorPayload`, `ServiceStateChangePayload`, `MagicLevelPayload` — with matching field names across both languages. Ensures compile-time type safety on both sides of the IPC bridge.
- **Tauri command signatures (commands/ipc.rs):** Desktop IPC wrappers for service state queries, chat message sending, magic level control. Injectable port interfaces on the TS side (`IpcCommandsPort`) for test isolation without Tauri runtime.
- **IPC event listener wrappers (ipc/events.ts):** Typed listener factories (`onChatDelta`, `onChatError`, `onServiceStateChange`, `onMagicLevelChanged`) returning unsubscribe functions for lifecycle management.

### SSE Streaming Client + Keystore (Phase 376, 4 commits)

- **SSE parser (streaming.rs, 380 lines):** Converts raw Server-Sent Event byte streams into typed `SseEvent` variants (MessageStart, ContentBlockDelta, MessageDelta, MessageStop, Ping, Unknown). Resilience invariant: malformed events produce `SseEvent::Unknown` — the stream never crashes. `process_sse_stream` accumulates deltas into a complete `MessageResponse`.
- **Stream-to-IPC bridge (stream_response):** Async function reading reqwest response body, splitting on double-newline boundaries, parsing each chunk, emitting Tauri IPC events (`chat:start`, `chat:delta`, `chat:usage`, `chat:complete`) as deltas arrive. Real-time streaming to the webview.
- **KeyStore (keystore.rs):** Wraps `security::keystore` with credential loading priority (env → OS keychain → encrypted file). `get_key()` is `pub(crate)` — key material never leaves the Rust process. Debug impl omits key value. `SecretString` zeroes memory on drop.
- **API client (client.rs):** TLS-enforced HTTPS-only connections. Retry with exponential backoff. Conversation history persistence.

### CLI Chat Components (Phase 377, 4 commits)

- **CliChat (CliChat.ts):** Main chat container component. Manages StreamingText display and ChatInput. Shows READY prompt with version banner on bootstrap completion.
- **ChatInput (ChatInput.ts):** Input field with enable/disable state control. Delegates to parent on submit.
- **StreamingText (StreamingText.ts):** Renders real-time text deltas into a pre-formatted container.
- **Chat subsystem (chat/):** History manager with message list, scroll controller with auto-scroll and manual override detection, error display with recoverable/non-recoverable distinction, LED panel component showing 7 service indicators, XSS sanitizer stripping dangerous HTML from chat content.

### Bootstrap + Prerequisites (Phase 378, 4 commits)

- **bootstrap.sh:** Entry point script checking prerequisites, scaffolding `.planning/` directories, and launching the desktop application.
- **check-prerequisites.sh:** Verifies required tools (node, npm, cargo, git) with version checks and per-platform install guidance.
- **Bootstrap SKILL.md:** Comprehensive guide with 7 required sections covering prerequisites, scaffold, services, API key, verification, troubleshooting, and LED status interpretation.

### Magic Level System (Phase 379, 4 commits)

- **Level definitions (magic/types.ts):** 5 magic levels (1=Minimal through 5=Full Diagnostic) with event visibility mapping. Each level controls which IPC event types are rendered in the chat UI.
- **Filter engine (magic/filter.ts):** `MagicFilter` class implementing `shouldRender(eventType)` against the current level's visibility set. Clean O(1) set lookup.
- **Persistence (magic/persistence.ts):** Save/load magic level via IPC to Rust backend config. Default level 3 per MAGIC-09 when config missing.
- **Recalibrate panel (magic/recalibrate-panel.ts):** Settings UI for live magic level switching with preview of which event types become visible/hidden.

### Service Lifecycle (Phase 380, 4 commits)

- **Service registry (registry.rs, 237 lines):** Static graph of 7 services (Tmux, ClaudeCode, FileWatcher, Dashboard, Console, Staging, Terminal) with dependency edges, health check types, LED positions, and optional flags. PR #24 (@PatrickRobotham) attribution: Tmux marked optional, FileWatcher deps corrected from `[Tmux]` to `[]`.
- **Kahn's algorithm (topological_order):** BFS topological sort with deterministic output (alphabetic tie-breaking within same level). Cycle detection panics (impossible with static graph but validated). `validate_dependencies()` checks self-loops, missing references, and cycles.
- **ServiceLauncher (launcher.rs, 207 lines):** Dependency-checked startup — service cannot start unless all non-optional dependencies are Online. `ServiceEventEmitter` trait for IPC event emission, decoupled via DI. Optional service graceful degradation: failed optional deps are skipped, not blocking.
- **HealthMonitor (health.rs, 203 lines):** Tracks consecutive failure counts per service. Tiered evaluation: 0 failures = Online, 3+ = Degraded, 5+ = Failed. Async `run_health_loop` with `tokio::select!` for shutdown-signal-aware interval checking.
- **LED state machine (led.rs, 69 lines):** Maps `ServiceState` to `LedColor` — Offline→Red, Starting→Amber, Online→Green, Degraded→AmberBlink, Failed→RedBlink. Proper FSM with 5 states and blinking semantics.
- **ShutdownManager (shutdown.rs, 186 lines):** Reverse topological shutdown ordering. SIGTERM→wait(10s)→SIGKILL sequencing. Race-condition handling: "No such process" treated as success (process exited between check and signal).

### Staging Pipeline (Phase 381, 4 commits)

- **Intake watcher (intake.rs, 389 lines):** 6-stage pipeline: validate format → move to processing → extract zip (with path traversal prevention) → hygiene check → security scan → route to processed/quarantine. Safety invariant: "NO code is EVER executed from intake files" documented at module level. Atomic file moves with cross-device fallback.
- **HygieneChecker (hygiene.rs, 116 lines):** Compiled regex patterns for 3 threat categories: YAML code execution tags (`!!python/object`, etc.) → quarantine, path traversal (`../`, URL-encoded variants) → quarantine, embedded instruction patterns (prompt injection) → advisory only. Two public methods only (`check`, `check_file`).
- **OrchestratorNotifier (notify.rs, 259 lines):** Writes JSON notifications to `inbox/pending/` with structured payloads — content type, location, hygiene status, estimated scope, priority, action type. RFC 3339 timestamps via manual epoch-to-date computation.
- **DebriefCollector (debrief.rs, 295 lines):** Gathers mission metrics from STATE.md and ROADMAP.md. `CalibrationData` with accuracy ratio computation (0.0 on zero-estimate to avoid division by zero). Writes debrief JSON to mission directory.

### Self-Improvement Lifecycle (Phase 382, 4 commits)

- **Retrospective template generator:** Pure function rendering structured RETROSPECTIVE.md from metrics, changelog analysis, calibration deltas, observations, and action items. Sections: header, summary, metrics table, feature alignment, went well/didn't/lessons, observations, calibration updates, action items.
- **Changelog watch:** Monitors Claude Code releases for feature alignment opportunities.
- **Calibration delta (calibration-delta.ts):** Computes estimated-vs-actual ratios with direction classification (over/under/accurate with ±10% tolerance). `safeRatio` handles zero-estimated edge cases (Infinity for actual>0, 1.0 for both-zero).
- **Observation harvester:** Collects skill-creator observations from execution sessions for retrospective inclusion.
- **Action generator:** Produces prioritized action items from calibration deltas and observations.

### Integration Wiring (Phase 383, 5 commits)

- **ChatPipeline (chat-pipeline.ts, 167 lines):** Wires IPC events through MagicFilter to ChatRenderer. Port-based architecture: `ChatRendererPort` and `MagicFilterPort` interfaces enable testing without Tauri runtime. `handleEvent()` routes chat:start/delta/complete/error/retry events. `destroy()` unsubscribes all listeners.
- **LedBridge (led-bridge.ts, 106 lines):** Bridges service state change IPC events to LED panel. Separate `handleStateChange()` for test-direct invocation vs `start()` for Tauri listener wiring.
- **StagingBridge (staging-bridge.ts):** Connects staging intake events to the orchestrator notification pipeline.
- **BootstrapFlow (bootstrap-flow.ts, 209 lines):** Orchestrates complete bootstrap-to-READY sequence. Starts 7 services in dependency order, handles API key provisioning (with async promise resolution for user input), updates LED panel progressively, shows READY prompt. Idempotent: detects already-running services and skips.
- **ErrorRecoveryManager (error-recovery.ts, 143 lines):** Detects service failures, updates LED, shows recovery guidance. Supports `/restart <service>` commands for recoverable failures. Tracks failed services map for state management.
- **PersistenceManager (persistence-manager.ts, 114 lines):** Manages magic level state and conversation history across restarts. Default magic level 3 per MAGIC-09.

## Dimension Scores

| Dimension | Score | Notes |
| --- | --- | --- |
| Architecture | 4.5 | Service graph with Kahn's topological sort, port-based DI throughout, FSM state machine, clean separation of concerns |
| Code Quality | 4.0 | `timestamp_now()` duplicated across notify.rs/debrief.rs, `todo!()` in intake watcher, `unsafe set_var` in keystore. Clean elsewhere |
| Testing | 5.0 | 18/37 commits are test-first. Perfect RED-GREEN ordering within each plan. Wave parallelism causes interleaving across plans but TDD discipline within each plan is absolute |
| Security | 4.5 | KeyStore pub(crate) restriction, XSS sanitizer, path traversal prevention in zip extraction, YAML exec tag detection, prompt injection advisory, quarantine routing |
| Documentation | 4.0 | Module-level safety invariant blocks (intake.rs, hygiene.rs). PR #24 attribution. Version annotations (v1.49.7). Some modules lighter on docs (retro/) |
| Integration | 4.0 | Full stack wired: API→Magic→Chat→LED. But `todo!()` in intake watcher and health monitor stub (always returns healthy) indicate incomplete integration |
| P6 Composition | 5.0 | 4 distinct multi-stage pipelines: bootstrap→service→health→LED, SSE→parse→delta→IPC→magic→chat→sanitize, file→validate→extract→hygiene→scan→route→notify, metrics→calibration→harvest→generate |
| P11 Forward-only | 5.0 | 0/37 fix commits. Zero rework. Cleanest P11 score in the chain |
| **Composite** | **4.50** | |

## Pattern Assessment

### P6 (Composition) — STRONGEST

This milestone showcases P6 at peak strength. Four distinct multi-stage pipelines, each 5+ stages deep, all using port-based dependency injection for testability:

1. **Bootstrap pipeline** (8 stages): Prerequisites → scaffold → for-each-service(check deps → LED amber → start → LED green) → API key → READY
2. **Chat streaming pipeline** (7 stages): SSE bytes → parse event → typed variant → IPC emit → magic filter → renderer → XSS sanitize
3. **Staging intake pipeline** (6 stages): validate format → move to processing → extract zip → hygiene check → security scan → route (processed/quarantine)
4. **Self-improvement pipeline** (5 stages): milestone metrics → calibration delta → observation harvest → action generation → retrospective template

The port-based DI is the unifying architectural pattern: `ChatRendererPort`, `LedPanelPort`, `MagicFilterPort`, `IpcCommandsPort`, `ServiceEventEmitter`, `PersistenceConfig`. Every bridge is testable without its runtime dependency.

### P11 (Forward-only) — PERFECT

Zero fix commits. 18 test commits, 18 feat commits, 1 chore. The test-first discipline is so consistent that the only "rework" visible is the planned RED→GREEN cycle of TDD itself. This is the first milestone in the chain with an absolute zero fix count.

### P14 (Interface Contract Design) — STRONG

The port interfaces are the ICD pattern applied systematically. `ChatRendererPort` defines exactly what the chat pipeline needs from its renderer. `LedPanelPort` defines what the bridge needs from the LED component. `ServiceEventEmitter` defines what the launcher needs from IPC. Each interface is narrow, focused, and testable.

## Key Findings

**1. Kahn's Algorithm is Real Computer Science**

The topological sort in `registry.rs` isn't a simplification — it's Kahn's BFS algorithm with proper in-degree tracking, deterministic tie-breaking (alphabetic sort within same level), and cycle detection. The `validate_dependencies()` function checks three invariants: no self-loops, all dependency IDs exist in graph, and no cycles. This is textbook graph theory applied correctly.

**2. SSE Parser Resilience Design**

The `Unknown` variant in `SseEvent` is a deliberate architectural choice: malformed events from the Anthropic API are captured as data, not crashes. `parse_sse_event` returns `Ok(SseEvent::Unknown(...))` instead of `Err(...)` for unrecognized formats. The stream continues processing without interruption. This is the "make illegal states representable but non-fatal" pattern.

**3. The Hygiene Pipeline Has Real Security Value**

The intake hygiene checker detects 3 threat categories with appropriate severity routing:
- YAML code execution tags (`!!python/object`, `!!ruby/object`, etc.) → quarantine
- Path traversal (`../`, `..\`, URL-encoded variants) → quarantine
- Prompt injection patterns (ignore previous instructions, your system prompt) → advisory only

The advisory-vs-quarantine distinction is correct: prompt injection in content files is suspicious but not dangerous by itself (the content is never executed), while YAML exec tags and path traversal can cause damage during processing.

**4. Timestamp Duplication Signals Missing Utility Layer**

`timestamp_now()` is copy-pasted between `notify.rs` and `debrief.rs`. Both implement manual epoch-to-date conversion with leap year logic. This is the classic "no shared utility" smell — the `chrono` crate would handle this, or a single `staging::util::timestamp_now()` function. Minor but indicates the module boundaries were drawn without considering shared helpers.

**5. Graceful Shutdown Sequence is Production Quality**

The `ShutdownManager` implements the correct POSIX shutdown sequence: SIGTERM (polite request) → poll with 100ms intervals → SIGKILL after 10s timeout. The race condition between "process exits after check but before kill" is handled by treating "No such process" errors as success. Reverse topological ordering ensures dependents shut down before their dependencies.

## Historical Context

v1.39 is the first milestone to build the complete application wiring — from API client to chat UI to service lifecycle. Previous milestones built the individual subsystems (security in v1.38, dashboard in v1.32, terminal in v1.31). This milestone connects them into a functioning orchestrator pipeline.

The 9 phases (375-383) follow the pattern established in v1.38's 8 phases (367-374): high phase count per version, each phase focused on a single subsystem. The wave-parallel TDD execution produces interleaved test/feat commits across plans while maintaining strict RED-GREEN ordering within each plan.

The zero fix commit count (P11 = 0/37) is the cleanest forward-only score in the chain. For context: v1.35 had 3/81 (3.7%), v1.38 had 0/39 (0%), and now v1.39 has 0/37 (0%). The trend suggests the planning and TDD discipline are stabilizing at zero-rework levels.

## Score Justification

4.50 reflects genuinely excellent orchestrator architecture (topological sort, FSM, port-based DI, 4 multi-stage pipelines) with minor but real quality deductions: duplicated timestamp utility, `todo!()` stub in intake watcher, health monitor stub always returning healthy, and `unsafe` env var mutation in keystore. The perfect P11 and P6 scores (both 5.0) are earned — zero rework and 4 distinct pipelines represent the best forward-only composition discipline in the chain. Stays below the 4.56 ceiling because the integration stubs indicate the wiring isn't fully complete, unlike v1.38's fully-connected security system.
