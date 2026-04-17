# v1.39 — GSD-OS Bootstrap & READY Prompt

**Released:** 2026-02-26
**Scope:** feature milestone — transform GSD-OS from an empty Tauri desktop shell into a living development environment with IPC foundation, Rust SSE API client, terminal-styled CLI chat, idempotent bootstrap, 5-level magic verbosity, dependency-ordered service launcher, staging intake hygiene pipeline, self-improvement lifecycle, and port-based integration wiring culminating in the READY. prompt
**Branch:** dev → main
**Tag:** v1.39 (2026-02-26T11:23:46-08:00) — "GSD-OS Bootstrap & READY Prompt"
**Predecessor:** v1.38 — SSH Agent Security
**Successor:** v1.40 — sc:learn Dogfood Mission
**Classification:** feature — first end-to-end bring-up of GSD-OS as an interactive development environment
**Phases:** 375–383 (9 phases) · **Plans:** 18 · **Requirements:** 80 · **Tests:** 517
**Commits:** `74fee7537..028d86eea` (37 commits) · **Files changed (tip window):** 18 · **LOC:** ~16.7K
**Verification:** 80/80 requirements landed · 517 tests across the 9-phase window · port-based integration harness green · READY. prompt reachable from cold bootstrap · full regression clean (16,273 tests across prior milestones)

## Summary

**The desktop shell became a development environment through IPC, services, and intake — not through adding features.** v1.38 landed the SSH-agent security substrate that made GSD-OS safe to connect to. v1.39 is the release that made it alive. Nine phases — 375 through 383 — turned an empty Tauri webview into a cold-bootable system with a living event bus, a Rust SSE client wired to Anthropic's Messages API, a terminal-styled chat surface that renders streaming deltas, an idempotent bootstrap script that promises "you can't break it," a five-level magic verbosity system controlling visibility of twenty-nine event types, a service launcher that resolves a seven-node dependency graph via Kahn's topological sort, a filesystem-watcher staging pipeline with a sanitization stage, a self-improvement lifecycle that classifies its own changelog, and a final integration phase (383) that wired the whole pipeline together through port-based dependency injection. At the end of that pipeline sits the READY. prompt — the single piece of terminal output that signals the system is cold-booted, services are online, LEDs are green, and the user can type.

**IPC parity between TypeScript and Rust held the whole release upright.** Phase 375 landed 29 event types with Zod schemas on the TypeScript side and serde structs on the Rust side, plus a JSON round-trip test enforcing parity so that neither side could drift from the other without failing CI. Nine Tauri command stubs with matching desktop IPC wrappers followed, along with the `.planning/` directory scaffold that every later phase needed for persistence. 120 tests landed in that phase alone — more than any other phase in the release — because the event bus is the artifact every subsequent phase either produces or consumes. Without cross-language parity on the event types, the Rust SSE parser from Phase 376 couldn't send deltas that the Phase 377 CLI Chat could render; the Phase 380 service launcher couldn't broadcast state-change events that the Phase 383 LED bridge could route to the taskbar. Getting the 29-event contract right at Phase 375 is what made the other eight phases composable.

**The Rust SSE client treated credentials as structurally compartmentalized, not policy-compartmentalized.** Phase 376's Anthropic Messages API client lived in Rust specifically so credential material never entered the webview process. Secure key management spanned three storage paths — environment variables, OS keychains (GNOME Keyring on Linux, macOS Keychain on Darwin), and an encrypted file fallback — with the selection logic inheriting from v1.38's zero-knowledge proxy architecture. The SSE streaming parser handled the usual failure modes (malformed events, mid-stream disconnection, chunked JSON boundaries) plus 429-compliant exponential backoff retry and persistent conversation history. The payoff is the Phase 377 CLI chat: a terminal-styled webview surface that renders tokens from the Rust stream without ever holding an API key, showing the READY. prompt only after the bootstrap flow completes.

**"You can't break it" was an engineering claim, not a marketing line.** Phase 378's bootstrap.sh shipped with three deliberate constraints: no sudo (the script never requires elevated privileges), no rm (the script never deletes anything, even to "clean up"), and magic-level output (the same 5-level verbosity system used in chat, applied to shell output). Platform-aware prerequisite detection checks for tmux, node, git, and rust before proceeding, and the 7-section SKILL.md at the repository root documents the dependency graph, bring-up sequence, and error-recovery procedure so that a cold reboot produces a deterministic, reviewable trace rather than a silent blue screen. The idempotency claim — re-running bootstrap.sh on a partially-booted system finishes the boot rather than restarting it — is tested by the integration harness in Phase 383 as part of the full bootstrap flow.

**Five-level magic verbosity and a seven-service dependency graph structured the rest.** Phase 379's magic system defines five levels — L1 Full Magic (pure output, no machinery), L2 Normal, L3 Default (the persistent default at runtime), L4 Verbose, L5 No Magic (every event visible) — and a visibility map controlling which of the 29 IPC event types appear at each level. Chat passthrough is unconditional at all levels; only the surrounding machinery toggles. A settings recalibrate panel provides live preview so the user sees each level's output without restarting. Phase 380 then landed the 7-service launcher — tmux, claude, file_watcher, dashboard, console, staging, terminal — with Kahn's topological sort resolving the dependency DAG, 5-second health checks (3 missed = Degraded, 5 missed = Failed), an LED state machine mapping service state to taskbar color, and a graceful shutdown sequence (SIGTERM, then 10-second wait, then SIGKILL). The two phases together are the operating system's runtime: magic decides what the user sees, the launcher decides what runs.

**Staging intake treated incoming work as an attack surface.** Phase 381's filesystem watcher detects new artifacts dropped into `.planning/staging/`, performs an atomic move-to-processing that prevents mid-write reads, and runs a hygiene pipeline covering YAML code execution (blocked), path traversal (rejected), and zip extraction (sandboxed). Artifacts that pass hygiene are routed to the orchestrator's inbox via JSON notification; artifacts that fail are routed to quarantine with the failure reason logged. A debrief collector then computes calibration ratios — how often did the sanitizer false-positive, how often did the orchestrator override quarantine — which feeds directly into Phase 382's self-improvement lifecycle. The pattern inherits v1.35's STRANGER-tier mindset for `sc:learn`: incoming content that modifies the system's behavior is a classic privilege-escalation vector, and sanitization happens before the content reaches any subsystem that could act on it.

**The self-improvement lifecycle turned the system into its own retrospective author.** Phase 382's RETROSPECTIVE.md template generator, changelog watcher, calibration-delta computer, observation harvester, and prioritized action-item generator made GSD-OS aware of its own evolution. The changelog watch classifies each observed change into LEVERAGE (expand this pattern), PLAN (schedule follow-up), or WATCH (monitor but don't act), and the calibration delta tracks how well the system's predictions matched observed reality across sessions. Action items are generated with priority rankings derived from deltas plus hit counts, so that the next session inherits a working list rather than a green field. The feedback loop here is the thing that makes GSD-OS adaptive: every session produces retrospective signal, every retrospective updates the action queue, and every new session starts with the queue's top item already in hand.

**Integration phase 383 wired the pipeline with port-based dependency injection.** The last phase in the release — the smallest by test count at 36, but architecturally the keystone — connected everything the prior phases built. ChatPipeline routes API deltas through the MagicFilter to the ChatRenderer, satisfying INTEG-01. LedBridge translates service-state-change events into LED panel updates, satisfying INTEG-02. StagingBridge forwards intake-complete events to the orchestrator inbox, satisfying INTEG-03. BootstrapFlow orchestrates fresh directory → services online → all LEDs green → READY prompt through the dependency-ordered launcher, satisfying INTEG-04. ErrorRecoveryManager detects killed services, surfaces the error in CLI Chat, guides recovery via `/restart` commands, and restores LEDs on success, satisfying INTEG-06. PersistenceManager handles magic-level defaults (3 per MAGIC-09) and conversation history across restarts, satisfying INTEG-05 and INTEG-07. Every bridge exposes a `handleEvent()` entry point for direct-test invocation plus `start()`/`destroy()` for Tauri listener lifecycle. Because the bridges take injected port interfaces rather than reaching into globals, the 36 integration tests run without spawning real API clients, real service processes, or a real Tauri runtime. The cost of this decision shows up in the size of Phase 383 relative to what it delivers — thin code but load-bearing — and the benefit shows up in every subsequent release that ships a new bridge without the integration harness growing proportionally.

The release closes the long-open question of how a Tauri webview becomes an operating system. The answer — a typed IPC event contract, a credential-compartmentalized Rust client, a terminal-styled chat surface, an idempotent bootstrap, magic-level output control, a dependency-ordered service launcher, a hygiene-sanitized intake pipeline, a self-observing retrospective generator, and a keystone integration phase wiring it all together — is the answer GSD-OS runs on for the rest of the project. Every subsequent release that touches chat rendering, service lifecycle, magic verbosity, staging ingestion, or retrospective generation is downstream of v1.39. The retrospective section honestly flags the costs: eight disparate subsystems glued by a single integration phase, platform-specific code paths for the keychain integration, and an integration phase whose 36 tests are thin relative to the nine-phase surface they cover. Those are follow-ups for the v1.40 dogfood mission and the v1.41–v1.44 hardening arc.

## Key Features

| Area | What Shipped |
|------|--------------|
| IPC foundation (Phase 375) | 29 event types with Zod + serde JSON parity between TypeScript and Rust; 9 Tauri command stubs with desktop IPC wrappers; `.planning/` directory scaffold; 120 tests (commits `74fee7537`, `dd28e49f8`, `e64bb22c7`, `5e7b584ad`) |
| Rust API client (Phase 376) | Rust SSE streaming parser for Anthropic Messages API; secure key management across env/keychain/encrypted-file; exponential backoff retry with 429 compliance; conversation history persistence; 38 tests (commits `68b5c30b0`, `f79a510d0`, `5b1e69303`, `f38c6ebe3`) |
| CLI chat (Phase 377) | Terminal-styled webview chat with READY. prompt sequence; streaming render from IPC deltas; command history (up arrow) with auto-scroll and manual override; LED status panel; XSS prevention via `textContent` only; 72 tests (commits `e27ab25e8`, `f922d6b72`, `bee5b942a`, `1ad292e5b`) |
| Bootstrap system (Phase 378) | Idempotent `bootstrap.sh` with no sudo, no rm, magic-level output; platform-aware prerequisite detection (tmux, node, git, rust); 7-section `SKILL.md` documenting dependency graph, bring-up sequence, and error recovery; "you can't break it" idempotency guarantee; 42 tests (commits `c82a94791`, `4ed3c55e1`, `fe0c13edd`, `aa118b01d`) |
| Magic verbosity system (Phase 379) | 5-level verbosity control (L1 Full Magic → L5 No Magic) with event visibility map over 29 IPC event types; chat passthrough at all levels; JSON persistence of user selection; settings recalibrate panel with live preview; 74 tests (commits `f6f675793`, `42a72f819`, `3c0686f89`, `9c691fda0`) |
| Service launcher (Phase 380) | 7-service dependency graph (tmux, claude, file_watcher, dashboard, console, staging, terminal) resolved via Kahn's topological sort; ordered startup with dependency validation; 5-second health checks with 3/5-miss thresholds for Degraded/Failed; LED state machine mapping service state to taskbar color; graceful shutdown via SIGTERM → 10s wait → SIGKILL; 51 tests (commits `b86030c69`, `3adf0d4b5`, `511d155ac`, `ec2fc8b99`) |
| Staging intake (Phase 381) | Filesystem watcher over `.planning/staging/` with atomic move-to-processing; hygiene pipeline covering YAML code execution, path traversal, and zip extraction; quarantine routing for rejected artifacts; orchestrator JSON notification on accept; debrief collector computing calibration ratios; 50 tests (commits `830ecc0b2`, `f463335f3`, `699acd6ef`, `ab524eba3`) |
| Self-improvement lifecycle (Phase 382) | `RETROSPECTIVE.md` template generator; changelog watch with LEVERAGE/PLAN/WATCH classification; calibration-delta computation; observation harvester; prioritized action-item generator; 34 tests (commits `152be46a3`, `a68838b26`, `c151d7a92`, `fb7119e08`) |
| Integration & wiring (Phase 383) | ChatPipeline (API → Magic → Chat, INTEG-01); LedBridge (service state → LED panel, INTEG-02); StagingBridge (intake → inbox, INTEG-03); BootstrapFlow (fresh dirs → services online → LEDs green → READY., INTEG-04); ErrorRecoveryManager (detect → recover → restore, INTEG-06); PersistenceManager (magic default 3 + conversation history, INTEG-05/INTEG-07); port-based dependency injection; 36 tests (commits `1e41a1f0c`, `f46746486`, `44a58f47c`, `b1be314c8`) |
| Version roll (Phase 383 tip) | `package.json`, `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock`, `src-tauri/tauri.conf.json` bumped to 1.39.0 (commit `028d86eea`) |
| Test footprint | 517 tests across 9 phases — 120 IPC + 38 API + 72 CLI chat + 42 bootstrap + 74 magic + 51 launcher + 50 staging + 34 self-improvement + 36 integration |
| Requirement footprint | 80 requirements closed across 18 plans; INTEG-01 through INTEG-08 cover the cross-phase integration contracts |
| READY. prompt | The single piece of terminal output that signals the full bring-up completed — fresh directories created, services dependency-ordered online, all LEDs green, bootstrap idempotent, user can type |

## Retrospective

### What Worked

- **7-service dependency graph with Kahn's topological sort.** The service launcher doesn't just start services — it resolves dependencies, validates the graph, and starts services in the correct order. Five-second health checks with 3/5-miss thresholds for Degraded/Failed states give real-time visibility into a running system, and the LED state machine makes the status mechanically observable from the taskbar.
- **Magic verbosity system with 5 levels and 29 event types.** The visibility map controlling which of the 29 IPC event types appear at each magic level means the same system serves both the debugging developer (L5, everything visible) and the end user (L1, only essential output). Chat passthrough at all levels is the right default — the conversation is never hidden, only the machinery around it.
- **"You can't break it" bootstrap guarantee.** Idempotent `bootstrap.sh` with no sudo and no rm, plus platform-aware prerequisite detection, makes first-run safe. The 7-section `SKILL.md` with dependency graph, bring-up sequence, and error recovery turns the bootstrap into documentation, not just a script, and the idempotency claim is verified by the Phase 383 integration harness rather than asserted in prose.
- **Self-improvement lifecycle with LEVERAGE/PLAN/WATCH classification.** The changelog watch that classifies changes into actionable categories, plus calibration-delta computation and prioritized action items, makes the system aware of its own evolution. This is the feedback loop that makes GSD-OS adaptive rather than merely configurable.
- **Port-based dependency injection across the integration phase.** Phase 383's bridges take injected port interfaces rather than reaching into globals, which means the 36 integration tests run without spawning real API clients, real service processes, or a real Tauri runtime. Every future bridge inherits the same test affordance.
- **Cross-language IPC parity as a CI-enforced invariant.** 29 event types with Zod schemas on the TypeScript side and serde structs on the Rust side, plus a JSON round-trip test, means neither side can drift from the other without failing CI. Every later phase in the release composed on top of that contract without needing to renegotiate it.

### What Could Be Better

- **517 tests across 9 phases with 8 disparate subsystems.** IPC, API client, CLI chat, bootstrap, magic verbosity, service launcher, staging intake, and self-improvement lifecycle are architecturally distinct. The integration wiring (Phase 383, 36 tests) that connects them all is the thinnest phase relative to its importance — the ratio of integration tests to subsystem surface is the lowest in the release.
- **Rust SSE streaming parser and GNOME Keyring / macOS Keychain integration add platform-specific complexity.** The API client's secure key management spanning env vars, OS keychains, and encrypted files creates multiple code paths that need platform-specific testing, and CI runs on Linux only — the macOS Keychain path is exercised locally and trusted by analogy.
- **The magic-verbosity default at L3 is an educated guess.** MAGIC-09 pins the persistent default to level 3, but no runtime observation exists yet to validate that choice; it could be an over- or under-share for a typical session, and v1.40's dogfooding will produce the first calibration evidence.
- **No cross-release UX baseline for the READY. prompt latency.** The integration harness proves the prompt appears after services are ordered-online and LEDs are green, but does not yet measure cold-boot wall-clock to READY. as a release-over-release benchmark.
- **`sc:learn`-class intake hygiene is present but not dogfooded against adversarial corpora.** Phase 381's hygiene pipeline blocks YAML code execution, path traversal, and malicious zip extraction at the API level, but has not yet been exercised against a curated corpus of real-world hostile inputs the way v1.35's SAFE-08 exercised sanitization for the mathematical ingestion pipeline.

## Lessons Learned

- **A desktop shell becomes a development environment through IPC plus services plus intake — not through adding features.** The 29 event types, 7-service launcher, and staging intake pipeline transform GSD-OS from a display surface into a living system where components communicate, start in order, and process incoming work. Ship the plumbing first; features without plumbing are demos.
- **Topological sort for service startup is essential, not clever.** Dependencies between services are a DAG. Starting them in arbitrary order creates race conditions that will eventually corrupt a boot. Kahn's sort is the correct algorithm for this exact problem; rolling a custom ordering would have drifted into reinvented-graph-theory without adding value.
- **Port-based dependency injection enables integration testing without running real services.** The 36 integration tests in Phase 383 use injected ports, which means the wiring between subsystems can be tested without spawning actual API clients or service launchers. Write the bridge against a port interface once, and every bridge that follows inherits the harness for free.
- **Magic verbosity must be a first-class system, not an afterthought.** Building the 5-level visibility map into the IPC foundation from the start means every new event type automatically inherits verbosity behavior. Adding verbosity control later would have required retrofitting all 29 event types plus every consumer. L3 as the persistent default is itself a design assertion that needs calibration evidence, not a shrug.
- **Credential compartmentalization is a runtime layout, not a policy.** Putting the API client in Rust means credential material lives in a different process surface than the webview. Even under a prompt-injection attack against the chat, the keys are not reachable because they are structurally absent from the webview's address space. Policy-only compartmentalization ("please don't log the key") is not a security boundary; process topology is.
- **Idempotent bootstrap without sudo and without rm is a safety claim, not a limitation.** Cold-boot scripts that demand elevated privileges or delete files to "clean up" are failure amplifiers when they mis-fire. The `bootstrap.sh` constraint — no sudo, no rm, magic-level output — means the worst outcome of a mis-run is a no-op, not a corrupted workspace.
- **Cross-language parity belongs in CI, not in the docs.** The 29 IPC event types ship with a JSON round-trip test enforcing TypeScript-Rust parity so neither side can drift without failing the build. Documenting "keep these in sync" would have lasted one refactor; a test that fails on drift survives every refactor.
- **The last integration phase is the smallest and the most load-bearing.** Phase 383 shipped 36 tests — the fewest in the release — but connects every prior subsystem. The thin-code-on-top-of-broad-substrate shape is what the READY. prompt needs: a small amount of wiring that only works because the eight phases beneath it negotiated the right contracts.
- **Self-improvement lifecycles need a structured vocabulary.** LEVERAGE / PLAN / WATCH is not three arbitrary labels; each one prescribes a different next action — expand the pattern, schedule a follow-up phase, or keep watching without acting. Without structured labels, retrospective output collapses into "things to maybe do someday," which no subsequent session can prioritize against.
- **The READY. prompt is the real acceptance test.** Individual phases ship individual tests, but the release is acceptance-tested by whether the prompt appears from cold bootstrap — fresh directories, services dependency-ordered online, LEDs green, prompt reachable, keyboard live. That integration assertion is the one the 517 tests collectively answer.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.21](../v1.21/) | GSD-OS Desktop Foundation — Tauri v2 shell, WebGL CRT engine, PTY terminal, Workbench desktop; the platform v1.39 brings up |
| [v1.24](../v1.24/) | GSD Conformance Audit — 336-checkpoint matrix that framed "IPC event parity as CI invariant" before v1.39 operationalized it |
| [v1.28](../v1.28/) | GSD Den Operations — filesystem message bus whose JSON-notification pattern Phase 381's staging intake inherits |
| [v1.30](../v1.30/) | Vision-to-Mission Pipeline — Zod-first, stage-based design pattern that Phase 375's 29 event types adopt for the IPC contract |
| [v1.31](../v1.31/) | GSD-OS MCP Integration — MCP Host Manager and Gateway Server that Phase 376's Rust client coexists with |
| [v1.33](../v1.33/) | GSD OpenStack Cloud Platform — 19-skill, 31-agent cloud platform whose service-launcher patterns v1.39 generalizes |
| [v1.34](../v1.34/) | Documentation Ecosystem Refinement — canonical `docs/` source that Phase 378's 7-section SKILL.md template plugs into |
| [v1.35](../v1.35/) | Mathematical Foundations Engine — STRANGER-tier sanitization pattern (SAFE-08) that v1.39's staging hygiene pipeline inherits |
| [v1.36](../v1.36/) | Citation Management — precedes v1.39 in the v1.3x knowledge-subsystem arc; downstream consumer of v1.39's IPC event bus |
| [v1.37](../v1.37/) | Complex Plane Learning Framework — migration-system pattern Phase 382's changelog watch generalizes |
| [v1.38](../v1.38/) | SSH Agent Security — immediate predecessor; zero-knowledge credential proxy that Phase 376's Rust client layer sits on top of |
| [v1.40](../v1.40/) | sc:learn Dogfood Mission — immediate successor; first release to exercise v1.39's staging intake against real documents |
| [v1.41](../v1.41/) | Hardening release that closed platform-specific keychain testing gap flagged in v1.39's retrospective |
| [v1.42](../v1.42/) | Test-infrastructure release that landed the per-phase test census pattern v1.39's retrospective gestured at |
| [v1.44](../v1.44/) | Release that extended port-based dependency injection to additional bridges following v1.39's INTEG-01..08 pattern |
| [v1.45](../v1.45/) | Release that added READY. cold-boot wall-clock benchmarking to the integration harness |
| [v1.49](../v1.49/) | Mega-release that consolidated post-v1.39 implementation work; IPC event bus re-exposed through the unified cartridge pipeline |
| `desktop/src/pipeline/bootstrap-flow.ts` | Phase 383 BootstrapFlow orchestrator — fresh directory → services online → all LEDs green → READY prompt (commit `b1be314c8`) |
| `desktop/src/pipeline/chat-pipeline.ts` | Phase 383 ChatPipeline — API deltas through MagicFilter to ChatRenderer, INTEG-01 (commit `f46746486`) |
| `desktop/src/pipeline/error-recovery.ts` | Phase 383 ErrorRecoveryManager — killed-service detection, `/restart` guidance, LED restoration, INTEG-06 (commit `b1be314c8`) |
| `desktop/src/pipeline/led-bridge.ts` | Phase 383 LedBridge — service-state events to taskbar LED panel, INTEG-02 (commit `f46746486`) |
| `desktop/src/pipeline/staging-bridge.ts` | Phase 383 StagingBridge — intake-complete to orchestrator inbox, INTEG-03 (commit `f46746486`) |
| `desktop/src/pipeline/persistence-manager.ts` | Phase 383 PersistenceManager — magic-level default 3 and conversation history, INTEG-05/INTEG-07 (commit `b1be314c8`) |
| `tests/integration/bootstrap-flow.test.ts` | Full cold-bootstrap integration test (commit `44a58f47c`) |
| `tests/integration/pipeline-wiring.test.ts` | API → Magic → Chat wiring, magic-filter blocking, cleanup (commit `1e41a1f0c`) |
| `tests/integration/led-wiring.test.ts` | Service-state to LED panel mapping with color lookup and initial load (commit `1e41a1f0c`) |
| `tests/integration/staging-wiring.test.ts` | Intake-to-inbox notification, quarantine alerts, status polling (commit `1e41a1f0c`) |
| `tests/integration/error-recovery.test.ts` | Failure detection, `/restart` recovery, LED restoration, non-recoverable guidance (commit `44a58f47c`) |
| `tests/integration/persistence.test.ts` | Magic-level live change, conversation history across restart, config persistence, defaults (commit `44a58f47c`) |
| `docs/release-notes/v1.39/chapter/03-retrospective.md` | Chapter retrospective with the full What Worked / What Could Be Better inventory |
| `docs/release-notes/v1.39/chapter/04-lessons.md` | Lessons chapter with the extracted lessons and applied-or-investigate status |
| `docs/release-notes/v1.39/chapter/00-summary.md` | Summary chapter pointing to this README |
| `.planning/MILESTONES.md` | Canonical milestone detail referenced from the v1.39 tag message |

## Engine Position

v1.39 sits at the center of the v1.3x GSD-OS build-out arc. v1.21 landed the Tauri v2 shell, WebGL CRT engine, PTY terminal, and Workbench desktop — the empty surface on which the OS would run. v1.27 through v1.33 added knowledge packs, brainstorm sessions, MCP integration, and the OpenStack-style multi-agent platform — substrate. v1.34 refined the documentation ecosystem. v1.35 made the mathematical foundation typed and reversible. v1.36 added citation management. v1.37 introduced the complex-plane learning framework. v1.38 landed the SSH-agent security substrate that made the shell safe to connect to. v1.39 is the release that turned the Tauri webview into an operating system: the cold-bootable system with a living event bus, a credential-compartmentalized API client, a terminal-styled chat surface, a "you can't break it" bootstrap, magic-level output control, a dependency-ordered service launcher, a hygiene-sanitized intake pipeline, a self-observing retrospective generator, and the integration phase wiring them all together through the READY. prompt. Every subsequent release that touches chat rendering, service lifecycle, magic verbosity, staging ingestion, or retrospective generation is downstream of v1.39's design choices. In the longer project arc running against the 360-degree Seattle engine in parallel, v1.39 is the release that made the engine's day-to-day operating environment real: the thing the user actually sits in front of.

## Cumulative Statistics

- **Phases landed at tip:** 383 (v1.39 covers 375–383, 9 phases)
- **Plans completed in window:** 18
- **Commits in window:** 37
- **Requirements closed:** 80/80
- **Tests added to suite:** 517 across the 9-phase window
- **Source LOC:** ~16.7K
- **IPC event types:** 29 (TypeScript Zod + Rust serde, JSON round-trip parity in CI)
- **Tauri command stubs:** 9 with matching desktop IPC wrappers
- **Magic verbosity levels:** 5 (L1 Full Magic → L5 No Magic) with persistent default at L3
- **Services in launcher dependency graph:** 7 (tmux, claude, file_watcher, dashboard, console, staging, terminal)
- **Health-check cadence:** 5-second interval, 3 missed → Degraded, 5 missed → Failed
- **Shutdown sequence:** SIGTERM → 10-second grace → SIGKILL
- **Staging hygiene classes blocked:** YAML code execution, path traversal, zip-bomb extraction
- **Self-improvement action-item labels:** LEVERAGE / PLAN / WATCH
- **Integration contracts:** INTEG-01 through INTEG-08
- **Regression envelope:** 16,273 tests across prior milestones clean at tip
- **Release-tip files changed:** 18 (bootstrap flow + 5 pipeline modules + 6 integration tests + 4 version files + `main.ts` + `pipeline/index.ts`)

## Files

- `desktop/src/main.ts` — webview entrypoint wiring ChatPipeline, LedBridge, StagingBridge, BootstrapFlow, ErrorRecoveryManager, and PersistenceManager through their port interfaces (commits `f46746486`, `b1be314c8`)
- `desktop/src/pipeline/bootstrap-flow.ts` — 188-line BootstrapFlow orchestrator: fresh directory → services online → LEDs green → READY. prompt; idempotent re-run detection per INTEG-08 (commit `b1be314c8`)
- `desktop/src/pipeline/chat-pipeline.ts` — 166-line ChatPipeline: API deltas through MagicFilter to ChatRenderer, INTEG-01 (commit `f46746486`)
- `desktop/src/pipeline/error-recovery.ts` — 142-line ErrorRecoveryManager: killed-service detection, CLI-Chat error surface, `/restart` recovery, LED restoration, non-recoverable routing to `bootstrap.sh`; INTEG-06 (commit `b1be314c8`)
- `desktop/src/pipeline/led-bridge.ts` — 105-line LedBridge: service state-change events to taskbar LED panel with color mapping and initial-load handling, INTEG-02 (commit `f46746486`)
- `desktop/src/pipeline/persistence-manager.ts` — 113-line PersistenceManager: magic-level persistence (default 3 per MAGIC-09) and conversation history across restarts; INTEG-05, INTEG-07 (commit `b1be314c8`)
- `desktop/src/pipeline/staging-bridge.ts` — 109-line StagingBridge: intake-complete events to orchestrator inbox with quarantine-alert routing and status polling, INTEG-03 (commit `f46746486`)
- `desktop/src/pipeline/index.ts` — barrel export for the six pipeline modules with lifecycle hooks (commits `f46746486`, `b1be314c8`)
- `tests/integration/bootstrap-flow.test.ts` — 309-line, 7-case cold-bootstrap harness: service dependency ordering, stage progression, API-key gate, failure handling, idempotency (commit `44a58f47c`)
- `tests/integration/error-recovery.test.ts` — 210-line, 6-case harness: failure detection, `/restart` command, LED restoration, non-recoverable guidance, simultaneous failures (commit `44a58f47c`)
- `tests/integration/persistence.test.ts` — 165-line, 6-case harness: mid-session magic-level change, config persistence, conversation history across restart, defaults (commit `44a58f47c`)
- `tests/integration/pipeline-wiring.test.ts` — 164-line harness: API → Magic → Chat flow, magic-filter blocking, cleanup (commit `1e41a1f0c`)
- `tests/integration/led-wiring.test.ts` — 147-line harness: service-state-to-LED-panel mapping, color lookup, initial load (commit `1e41a1f0c`)
- `tests/integration/staging-wiring.test.ts` — 104-line harness: intake-to-inbox notification, quarantine alerts, status polling (commit `1e41a1f0c`)
- `package.json` — version bump to 1.39.0 (commit `028d86eea`)
- `src-tauri/Cargo.toml` + `src-tauri/Cargo.lock` — crate-side version bump to 1.39.0 with dependency lock update (commit `028d86eea`)
- `src-tauri/tauri.conf.json` — Tauri manifest version bump to 1.39.0 (commit `028d86eea`)
- `docs/release-notes/v1.39/chapter/00-summary.md` — summary chapter pointing to this README
- `docs/release-notes/v1.39/chapter/03-retrospective.md` — full What Worked / What Could Be Better inventory
- `docs/release-notes/v1.39/chapter/04-lessons.md` — six extracted lessons with applied-or-investigate status

---

_Parse confidence: 1.00 — authored from `git show --no-patch v1.39`, `git log v1.38..v1.39` (37 commits), the Phase 375–383 commit shortstats, and chapter files under `docs/release-notes/v1.39/chapter/`._
