# v1.13 — Session Lifecycle & Workflow Coprocessor

**Released:** 2026-02-12
**Scope:** dual-track milestone — bash `gsd-stack` session infrastructure + TypeScript `chipset` coprocessor architecture, converging at a `project-claude` integration layer
**Branch:** dev → main
**Tag:** v1.13 (2026-02-12T17:38:41-08:00) — "Session Lifecycle & Workflow Coprocessor"
**Predecessor:** v1.12.1 — Live Metrics Dashboard
**Successor:** v1.14 — Promotion Pipeline
**Classification:** dual-track feature release — bash infra + TypeScript chipset + integration bridge
**Phases:** 101–114 (14 phases) · **Plans:** 35 · **Requirements:** 39
**Stats:** 71 commits · 55+ files in final integration wave · 9,461 insertions / 2,086 deletions in the merge window
**Tests:** 541 bash (gsd-stack) + 516 TypeScript (chipset) + 12 end-to-end integration = 1,069 total
**Verification:** every `/wrap:*` and `/sc:*` command structurally validated · Zod schemas guard integration config · POSIX post-commit hook idempotent · heartbeat-aware `pop` respects pause state

## Summary

**v1.13 is the largest phase span in the project's first half: fourteen phases, thirty-five plans, thirty-nine requirements, seventy-one commits, and 1,069 tests across three languages and two architectures.** Where v1.10 was the security pause, v1.11 the GSD integration layer, and v1.12/v1.12.1 the live-metrics dashboard, v1.13 asked a different question: what does it take to make a Claude Code session a first-class, long-lived, resumable, replayable entity — and what does it take to dispatch work inside that session as if it were an Amiga with a custom chipset? The answer was two tracks developed in parallel. The `gsd-stack` track (phases 101–107) is pure bash, built around tmux, with a message queue, session lifecycle commands, and a recording/playback system. The `chipset` track (phases 108–113) is TypeScript, modeled explicitly on the Amiga custom chipset, with a Pipeline list format (WAIT/MOVE/SKIP), an offload engine for deterministic script execution, a prioritized Exec kernel, and four named coprocessor teams — Agnus, Denise, Paula, Gary. Phase 114 was the convergence: StackBridge, SessionEventBridge, and PopStackAwareness wire the two tracks together so that recording events feed Pipeline learning and lifecycle state drives WAIT resolution. The final five commits in the tag window (`1d328caa0` through `5d2d088189`) are the `project-claude` integration layer itself — install manifest entries, the POSIX post-commit hook, Zod-validated integration config, plan-summary / roadmap / state-transition differs, and the slash-command surface that turns skill-creator into something a GSD project can opt into with a single install script.

**Two architectures, each assigned to the language that suits it.** Bash owns tmux, process lifecycle, signal handling, and file-system audit — the places where shell scripting has thirty years of tested idioms and no TypeScript abstraction improves on `send-keys`, `kill -INT`, or `tail -f`. TypeScript owns the Pipeline list schema, the Zod validators, the Exec kernel's priority calculus, and the observation-to-list learning pipeline — the places where type safety and structured data matter more than latency. The decision to keep the two tracks in their native languages rather than porting either to the other is the design choice that made fourteen phases tractable. Each track could be tested, reviewed, and shipped against its own conventions; the integration layer at phase 114 is the only place the two worlds had to agree on a contract, and the contract is narrow: lifecycle events as strings, recording events as JSON lines, pause state as a meta-file flag.

**The Amiga chipset metaphor (Agnus, Denise, Paula, Gary) is not decoration — it is the coordination model.** The Amiga custom chips separated concerns so decisively that the 7-MHz 68000 could drive a multitasking, animated, sound-producing desktop in 1985 that PCs did not match for half a decade. The same separation maps cleanly onto multi-agent LLM orchestration: Agnus is context management (STATE.md, observations, lifecycle events), Denise is output rendering (dashboards, reports, visualizations), Paula is I/O (git, filesystem, external tools), and Gary is glue — coordination, message routing, signal distribution. Four coprocessors with explicit lanes, FIFO message ports with reply-based ownership semantics, a 32-bit signal system for lightweight wake/sleep coordination, and a budget channel for per-team token allocation. Naming them after real hardware makes the architecture memorable for the reader and disciplined for the author; "Paula handles I/O" is a contract that future code can honor or violate, and the violation is visible.

**Pipeline lists (WAIT/MOVE/SKIP) are a small DSL that earns its complexity by being compiled, not interpreted.** WAIT blocks on a GSD lifecycle event — `phase-start`, `phase-planned`, `tests-passing`, and their kin. MOVE activates a target (skill, script, or team) in one of four modes: `sprite` (~200 tokens, lightweight), `full` (full skill activation), `blitter` (offload to a child process via the phase-109 Offload Engine), or `async` (fire-and-forget). SKIP evaluates a condition against filesystem state or runtime variables. The Pipeline Executor (phase 110) pre-compiles lists during planning and loads them automatically during execution, so the DSL is a build-time artifact, not a runtime interpreter. This is the Amiga Copper list applied to agent coordination: a declarative schedule that waits for hardware events (in our case, GSD lifecycle events) and triggers video-beam-synchronized operations (in our case, agent activations). Sprites, Copper, and Blitter were all Amiga primitives that gave 1985 hardware the throughput of machines built five years later; the same economy of mechanism is the goal here.

**The Exec kernel encodes a resource-allocation policy as executable percentages.** Prioritized round-robin: 60% phase-critical, 15% workflow, 10% background, 10% pattern detection. Eighteen typed message protocols define the legal shapes of inter-team communication. Per-team token budgets guarantee minimums and support a burst mode (BLITHOG — the Amiga reference is `BLTHOG`, the Blitter DMA-hog bit, which gave the Blitter exclusive memory access during large operations). These specific numbers are design decisions, not optimization knobs. The 60/15/10/10 split says phase-critical work is the job and the other three categories get what is left; tuning them would change the character of the system, not just its throughput. The burst mode says that occasionally a team needs all the budget and that request is legitimate if it is rare. The kernel makes the policy legible to anyone reading the code — no hidden scheduler heuristics, no priority inversions masked by queue magic.

**Recording and playback turn sessions into reproducible artifacts.** `gsd-stack record` captures terminal output, message-queue events, and filesystem changes to `stream.jsonl` as a timestamped event log. `gsd-stack mark` inserts named markers during recording — a shell-visible analogue of log-level-higher-than-INFO. `gsd-stack play` supports four replay modes, each serving a distinct workflow: `analyze` produces a timeline for retrospectives, `step` is interactive for debugging, `run` is benchmark-style for performance measurement, and `feed` converts a recording into a playbook for replay-as-input. The 14-metric computation engine with `--compare` gives side-by-side diffs between recordings — a feature dense enough that most sessions will not need it, but valuable precisely when a regression needs to be located. Together with `session save` snapshots (meta, STATE.md, pending stack, terminal context) and `session resume`'s three-path logic (warm-start paused / recover stalled / seed from saved), recording makes sessions auditable artifacts rather than ephemeral shell sessions lost when the tmux window closes.

**The `project-claude` integration layer is how v1.13 reaches real GSD projects.** The final commits in the release window ship a `node project-claude/install.cjs` installer that writes a `manifest.json`-driven set of agents, slash commands, wrapper commands, and a POSIX post-commit hook into any target repo's `.claude/` tree. The slash commands fall into two families: `/sc:*` (start, status, observe, suggest, wrap, digest) wraps skill-creator's observation lifecycle into named commands the user can invoke; `/wrap:*` (plan, execute, verify, phase) wraps the GSD workflow commands with skill-loading pre-steps and observation-capture post-steps. The `/wrap:phase` smart router inspects phase state and delegates to the correct sub-wrapper. The post-commit hook auto-captures a session observation after every commit, feeding the pattern store at `.planning/patterns/` without requiring explicit invocation. An integration config at `.skill-creator-integration.json` (read by `src/integration/config/reader.ts`, validated by the Zod schema in `schema.ts`) controls opt-in/opt-out, retention, and hook behavior. The `--uninstall` flag allows selective component removal so opt-out is reversible.

**Monitoring differs turn ambient project drift into observation events.** `src/integration/monitoring/` ships four differs that run on `scan` triggers: `plan-summary-differ.ts` (354 lines) detects changes in per-plan STATE summaries, `roadmap-differ.ts` (179 lines) tracks ROADMAP.md structural drift, `state-transition-detector.ts` (230 lines) watches phase-state transitions, and `observation-writer.ts` writes the resulting events into the pattern store. The `scanner.ts` orchestrator (288 lines) coordinates the differs, and the `scan` triggers are wired into both slash commands and wrapper commands so monitoring runs opportunistically whenever the user is already interacting with the GSD surface. This is the v1.0 observation loop applied to project state rather than tool-sequence state — the same mechanism, a different signal.

**The test distribution tells the coordination story.** 541 bash tests live under the gsd-stack track, 516 TypeScript tests under the chipset track, 12 end-to-end tests across 25 files validate the bridges. The test count per track is proportional to the track's surface area — bash has more user-visible commands (push/peek/pop/clear/poke/drain/session/list/watch/pause/resume/stop/save/record/mark/play/metrics), so it has more tests; TypeScript has a deeper internal architecture (schema, parser, executor, kernel, learning, teams), so its tests cover layered correctness rather than user-facing command shapes. The integration tests are few but load-bearing: they are the places where assumptions from both worlds collide, and they are the reason `PopStackAwareness` (the bridge that makes `pop` respect pause state, touch heartbeat, and log markers into the current recording) was the last thing to ship rather than the first.

**Fourteen phases is an acknowledgment, not a boast.** The largest phase count of any release to date reflects a real scope decision: gsd-stack and chipset could have shipped as v1.13a and v1.13b, and the 7-and-7 cadence of the two tracks was explicit enough to support that split. They were kept together because phase 114's convergence was the point — sessions feeding learning, lifecycle driving Pipeline — and splitting the release would have deferred the bridge into a vaporware v1.14 feature. The retrospective calls out the scope honestly: fourteen phases is a lot; the Pipeline DSL is another abstraction layer users must learn; the 14-metric engine is feature-dense. Those are real debts. The payoff is that by shipping the convergence in the same release that shipped the primitives, v1.13 becomes the substrate that v1.14's Promotion Pipeline, v1.15's Live Dashboard Terminal, v1.17's Staging Layer, and the later `/sc:*` ergonomics work all build on without a "v1.13 integration checkpoint" chapter in every one of them.

## Key Features

| Area | What Shipped |
|------|--------------|
| gsd-stack Core (Phase 101) | `gsd-stack` CLI with directory bootstrapping, environment configuration, `history.jsonl` logging, `status` / `log` subcommands; auto-creates `.claude/stack/{pending,done,sessions,recordings,saves}` |
| Message Stack (Phase 102) | `push` (urgent/normal/low priority, YAML frontmatter, stdin), `peek` (FIFO/LIFO inspection), `pop` (consume pending→done, audit-preserving), `clear` (bulk pending→done with count) |
| Advanced Operations (Phase 103) | `poke` (direct tmux send-keys bypassing the queue); `drain` (headless batch mode, sequential pop-and-execute via `claude -p --continue`) |
| Session Lifecycle (Phases 104–105) | `session` (managed tmux start, meta.json, heartbeat process), `list` (live state detection: active/stalled/paused/stopped/saved), `watch` (read-only tmux attach), `pause` (Ctrl+C + meta update + auto-save), `resume` (three-path: warm-start / recover-stalled / seed-from-saved), `stop` (graceful + final stats), `save` (snapshot: meta + STATE.md + pending stack + terminal context) |
| Recording System (Phases 106–107) | `record` (background capture of terminal + stack events + file changes to `stream.jsonl`), `mark` (named markers during recording), `play` (4 modes: `analyze` timeline / `step` interactive / `run` benchmark / `feed` playbooks), `metrics` (14-metric engine with `--compare` side-by-side diffs) |
| Pipeline List Format (Phase 108) | WAIT/MOVE/SKIP instruction types, Zod schemas, YAML parser; WAIT syncs to GSD lifecycle events (phase-start, phase-planned, tests-passing, etc.); MOVE target + activation mode (sprite/full/blitter/async); pre-compilation during planning, auto-loading during execution |
| Offload Engine (Phase 109) | Script promotion from skill metadata for deterministic ops; child-process execution with timeout + output capture; completion signals propagate for downstream Pipeline sync |
| Pipeline Executor (Phase 110) | Lifecycle sync bridge (events resolve WAIT); activation dispatch (sprite ~200 tokens, full, blitter offload, async); SKIP evaluation against FS state + runtime variables |
| Team-as-Chip Framework (Phase 111) | Four chips: **Agnus** (context/STATE/observations), **Denise** (output rendering), **Paula** (git + FS + external I/O), **Gary** (glue/routing); FIFO message ports with reply-based ownership; 32-bit signal system for wake/sleep; per-team budget channel |
| Exec Kernel (Phase 112) | Prioritized round-robin scheduler (60% phase-critical / 15% workflow / 10% background / 10% pattern detection); 18 typed message protocols; per-team token budgets with guaranteed minimums + burst mode (BLITHOG, after BLTHOG) |
| Pipeline Learning (Phase 113) | Observation-to-list compiler with confidence scoring; Jaccard feedback engine for accuracy tracking + refinement; versioned library with best-match retrieval indexed by workflow type |
| Integration Bridges (Phase 114) | **StackBridge** (recording events → Pipeline learning); **SessionEventBridge** (lifecycle → Pipeline WAIT targets); **PopStackAwareness** (`pop` respects pause, touches heartbeat, logs markers) — `src/chipset/integration/` |
| project-claude Integration Layer | `project-claude/install.cjs` (350 lines) + `manifest.json`-driven install; integration config at `.skill-creator-integration.json` with Zod schema (`src/integration/config/`); `--uninstall` with selective component removal |
| Slash Commands (`/sc:*`, `/wrap:*`) | `/sc:start`, `/sc:status`, `/sc:observe`, `/sc:suggest`, `/sc:wrap`, `/sc:digest`; `/wrap:plan`, `/wrap:execute`, `/wrap:verify`, `/wrap:phase` (smart router); structural validation tests for all |
| Post-Commit Observation Hook | POSIX `project-claude/hooks/post-commit` + integration tests; idempotent; captures session observation to pattern store after every commit |
| Monitoring Differs | `plan-summary-differ`, `roadmap-differ`, `state-transition-detector`, `observation-writer`, `scanner` orchestrator (`src/integration/monitoring/`); wired into `/sc:*` and `/wrap:*` as scan triggers |
| CLI Integration Config | `src/cli/commands/integration-config.ts` with `validate` and `show` subcommands for the integration config |
| Test Coverage | 541 bash + 516 TypeScript + 12 end-to-end integration = 1,069 total (largest test population at release time) |

## Retrospective

### What Worked

- **The dual-track architecture (bash gsd-stack + TypeScript chipset) assigns each language to its strength.** Bash handles session management, tmux interaction, and process lifecycle where shell scripting excels. TypeScript handles the Amiga-inspired coprocessor architecture where type safety and structured data matter. The split let each track ship on its own conventions and met only at the integration contract.
- **The Amiga chipset metaphor (Agnus/Denise/Paula/Gary) maps cleanly to agent coordination domains.** Context management, output rendering, I/O operations, and bus coordination are the four fundamental concerns of multi-agent systems. Naming them after Amiga chips makes the architecture memorable for readers and disciplined for authors; a violation of Paula's I/O lane is visible.
- **541 bash tests + 516 TypeScript tests + 12 integration tests = 1,069 total tests — the most heavily tested release to date at v1.13.** The two-track complexity and the bridge layer justify the count; the integration tests are few but load-bearing because they are the places where assumptions from both sides collide.
- **Four replay modes (analyze, step, run, feed) make recordings useful for different purposes.** Analysis for retrospectives, stepping for debugging, run for benchmarking, feed for playbook replay. Each mode serves a distinct workflow and none of them is reached by the others.
- **Ship the convergence, not just the primitives.** Phase 114's bridges (StackBridge, SessionEventBridge, PopStackAwareness) were in the same release that shipped the primitives they connect. Splitting the release would have deferred the bridge into a vaporware successor; keeping it together is what makes v1.13 a substrate rather than a pair of libraries.
- **The `project-claude` installer is a single opt-in surface for consumers.** `node project-claude/install.cjs` writes a manifest-driven set of agents, commands, and hooks into any target project with a reversible `--uninstall`. Downstream projects do not need to learn the internals — they get the slash commands and the hook by running the script.

### What Could Be Better

- **14 phases is the largest phase count in any release to date.** The dual-track architecture explains part of this (7 phases per track + integration), but the scope suggests that gsd-stack and chipset could have been separate releases had the convergence been deferred.
- **Pipeline list format with WAIT/MOVE/SKIP instructions introduces a new DSL.** Users now need to learn a custom instruction format on top of YAML frontmatter, Markdown skills, and CLI commands. The instruction set is well-designed, but it is another layer of abstraction that competes with the user's budget for project-specific concepts.
- **The 14-metric computation engine in the recording system is feature-dense.** Fourteen metrics with display and `--compare` for side-by-side diffs is powerful but may be more granularity than most sessions need; many users will only ever look at three or four of them.
- **BLITHOG burst mode is a global override on the budget policy.** A team holding BLITHOG exclusive budget is doing so at the expense of every other team's guaranteed minimum for the duration of the burst. The mechanism is deliberate and mirrors the Amiga Blitter's DMA-hog behavior, but it is also a foot-gun if triggered carelessly; observability for burst-mode duration and frequency did not ship in this release.
- **The slash-command surface (`/sc:*` and `/wrap:*`) doubled in a single release.** Six `/sc:*` commands and four `/wrap:*` commands landed together; the conceptual split between skill-creator's observation lifecycle and the GSD workflow wrappers is correct, but ten new commands at once is a lot of new muscle memory.

## Lessons Learned

1. **Session lifecycle is infrastructure, not a feature.** `start`, `pause`, `resume`, `stop`, `save`, `list`, `watch` — these operations make sessions first-class entities with lifecycle management. Without them, sessions are ephemeral and unreproducible, and a project has no way to ask "what was I working on yesterday" without human memory.
2. **Integration bridges are the hardest code to write.** The twelve end-to-end tests exist because the bridge between bash process lifecycle and TypeScript Pipeline execution is where assumptions from both sides collide. StackBridge, SessionEventBridge, and PopStackAwareness each encode a small treaty between the two worlds, and each treaty has to survive process death, partial writes, and out-of-order events.
3. **The Exec kernel's prioritized round-robin (60% phase-critical, 15% workflow, 10% background, 10% pattern detection) encodes policy as code.** The percentages are design decisions about what matters most during execution. Tuning them would change the character of the system, not just its throughput; they are assertions, not knobs.
4. **Observation-to-list compilation with Jaccard feedback closes the learning loop for Pipeline execution.** The system observes execution patterns, compiles them into Pipeline lists, tracks accuracy with Jaccard scores, and refines. This is the v1.0 learning loop (Observe → Detect → Suggest → Apply → Learn → Compose) applied to execution scheduling rather than tool sequence — same mechanism, different signal.
5. **Assign each language to its strength; do not port for uniformity.** Bash and TypeScript coexist in v1.13 because each is better at its half. Forcing one language for both tracks would have meant either writing tmux glue in TypeScript (a poor fit) or writing the Pipeline executor in bash (worse). The narrow integration contract is cheaper than the uniformity tax.
6. **A custom DSL earns its complexity only if it is compiled, not interpreted.** WAIT/MOVE/SKIP Pipeline lists are pre-compiled during planning and auto-loaded during execution; they are a build-time artifact, not a runtime interpreter. If they had been parsed on the hot path, their complexity would have leaked into every activation; as a compiled artifact, they are a data format.
7. **The Amiga chipset metaphor was a real engineering tool, not marketing.** Agnus/Denise/Paula/Gary gave each coprocessor team a named lane with a known responsibility. The metaphor survived fourteen phases because it kept being useful — every time a new signal needed routing, the answer to "which chip owns this" was obvious. Metaphors that make design decisions easier earn their keep.
8. **Ship the integration in the same release as the primitives.** Splitting v1.13 into a primitives release and a separate convergence release would have deferred the bridge into a vaporware successor. Shipping phase 114 together with phases 101–113 is what turned two libraries into one substrate; the cost was fourteen phases in one release, and that cost was worth paying.
9. **Installers make consumer adoption visible.** The `project-claude/install.cjs` script with a `manifest.json` and a `--uninstall` flag is the external surface of v1.13. Consumers do not need to read the phase-111 team code to get value; they run the installer and get the commands. The same applies to any library: if adoption requires reading the source, adoption will be thin.
10. **Ten new slash commands at once stretches the user's muscle memory.** `/sc:start`, `/sc:status`, `/sc:observe`, `/sc:suggest`, `/sc:wrap`, `/sc:digest`, `/wrap:plan`, `/wrap:execute`, `/wrap:verify`, `/wrap:phase` are correct as a conceptual set, but shipping them in one release makes the first month of use a vocabulary-building exercise. Progressive disclosure — landing them across two or three releases — would have smoothed the on-ramp.
11. **Observability for the burst-mode escape hatch belongs with the escape hatch.** BLITHOG shipped without explicit dashboards for burst-mode duration, frequency, or per-team budget exhaustion. Every override mechanism should ship with the telemetry that lets an operator tell whether the mechanism is being used as designed or as a hack. This is a follow-on debt for later releases.
12. **The observation loop generalizes beyond tool sequences.** The v1.0 loop was designed for tool-sequence observation; v1.13's monitoring differs apply the same loop to ROADMAP drift, plan-summary changes, and phase-state transitions. Any signal that can be differenced can feed the observation loop — the loop is the invariant, the signal is the variable.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.0](../v1.0/) | Root learning loop (Observe → Detect → Suggest → Apply → Learn → Compose); v1.13's Pipeline Learning is the same loop applied to execution scheduling |
| [v1.5](../v1.5/) | Pattern Discovery — the pattern store that v1.13's post-commit hook and monitoring differs write into |
| [v1.7](../v1.7/) | GSD Master Orchestration Agent — v1.13's `/wrap:*` commands wrap the workflow surface v1.7 established |
| [v1.8](../v1.8/) | Capability-Aware Planning — v1.13's Pipeline list MOVE targets extend the capability model |
| [v1.10](../v1.10/) | Security Hardening substrate — v1.13 inherits safe YAML, JSONL checksums, and prompt-injection sanitization for inter-team messages |
| [v1.11](../v1.11/) | GSD Integration Layer — predecessor that v1.13's `project-claude` installer extends with commands + hooks |
| [v1.12](../v1.12/) | GSD Planning Docs Dashboard — sibling surface that the monitoring differs complement |
| [v1.12.1](../v1.12.1/) | Immediate predecessor — Live Metrics Dashboard; v1.13 adds the recording/metrics engine that the dashboard could eventually render |
| [v1.14](../v1.14/) | Successor — Promotion Pipeline; builds on v1.13's Pipeline list format |
| [v1.15](../v1.15/) | Live Dashboard Terminal — surfaces the recording/metrics data v1.13 captures |
| [v1.17](../v1.17/) | Staging Layer — consumes the scan/differ infrastructure landed here |
| [v1.32](../v1.32/) | Brainstorm Session Support — first downstream consumer of the session-as-entity model; cited as "applied" for lesson #1 |
| [v1.41](../v1.41/) | Claude Code Integration Reliability — hardens the integration-bridge layer lesson #2 called out |
| [v1.42](../v1.42/) | Downstream consumer of the Exec kernel priority policy (lesson #3 "applied") |
| [v1.44](../v1.44/) | Downstream consumer of the Pipeline learning + metrics work (lessons #4 and #7 "applied") |
| `src/chipset/` | Chipset track code — Pipeline list, executor, Exec kernel, team framework |
| `src/chipset/integration/` | Phase-114 bridges — `stack-bridge.ts`, `session-events.ts`, `pop-stack-awareness.ts` |
| `src/integration/config/` | Zod-validated integration config (types, schema, reader) for `.skill-creator-integration.json` |
| `src/integration/monitoring/` | Plan-summary, roadmap, and state-transition differs + scanner orchestrator |
| `project-claude/install.cjs` | Installer for downstream GSD projects; manifest-driven, reversible via `--uninstall` |
| `project-claude/hooks/post-commit` | POSIX post-commit hook for auto-observation |
| `project-claude/commands/sc/` + `project-claude/commands/wrap/` | `/sc:*` and `/wrap:*` command definitions |
| `.planning/MILESTONES.md` | Canonical v1.13 phase-by-phase detail (phases 101–114) |

## Engine Position

v1.13 is the project's substrate release for session lifecycle and workflow coprocessing. Where v1.0 set the learning loop, v1.5 gave pattern discovery its home, v1.7 installed the orchestration agent, and v1.10 hardened the input/output/state surfaces, v1.13 answered the dual question of session persistence and agent coordination. Every subsequent release assumes that sessions have a `start`, `pause`, `resume`, `stop`, `save`, and `list` surface; that lifecycle events can be WAITed on; that skill/script/team targets can be MOVEd in sprite, full, blitter, or async mode; that four named coprocessors (Agnus, Denise, Paula, Gary) own context, render, I/O, and glue respectively; that a prioritized Exec kernel allocates token budget with a 60/15/10/10 policy; and that observations compile back into Pipeline lists through a Jaccard-scored feedback engine. v1.14's Promotion Pipeline builds on the list format. v1.15's Live Dashboard Terminal surfaces the metrics recorder. v1.17's Staging Layer runs over the scan/differ infrastructure. v1.32's Brainstorm Session Support is the first release to treat sessions as first-class entities with lifecycle, directly downstream of lesson #1. v1.41's Claude Code Integration Reliability hardens the bridge layer lesson #2 warned about. The `/sc:*` and `/wrap:*` slash-command vocabulary landed here is the user-facing surface that later ergonomics work refines but does not replace. v1.13 is where the project stopped being a library of skills and became an operating environment for sessions.

## Files

- `src/chipset/index.ts` — chipset track barrel export
- `src/chipset/integration/stack-bridge.ts` — recording events → Pipeline learning (phase 114-01)
- `src/chipset/integration/session-events.ts` — lifecycle events → Pipeline WAIT targets (phase 114-01)
- `src/chipset/integration/pop-stack-awareness.ts` — `pop` respects pause, touches heartbeat, logs markers (phase 114-02)
- `src/chipset/integration/index.ts` — integration barrel export (phase 114-03)
- `src/integration/config/types.ts` + `schema.ts` + `schema.test.ts` — Zod schema for integration config (phase 82-01)
- `src/integration/config/reader.ts` + `reader.test.ts` — config reader with validation (phase 82-02)
- `src/cli/commands/integration-config.ts` + `.test.ts` — `validate` / `show` CLI subcommands (phase 82-03)
- `src/integration/monitoring/observation-writer.ts` + `.test.ts` — pattern-store writer (phase 87-01)
- `src/integration/monitoring/plan-summary-differ.ts` + `.test.ts` (355 lines) — plan summary drift detection (phase 87-01)
- `src/integration/monitoring/roadmap-differ.ts` + `.test.ts` (179 lines) — ROADMAP structural drift (phase 87-02)
- `src/integration/monitoring/state-transition-detector.ts` + `.test.ts` (231 lines) — phase-state transitions (phase 87-02)
- `src/integration/monitoring/scanner.ts` + `.test.ts` (288 lines) — scan orchestrator (phase 87-03)
- `src/integration/monitoring/types.ts` — monitoring type definitions (184 lines)
- `project-claude/install.cjs` (350+ lines) — manifest-driven installer with `--uninstall` (phases 83-02, 83-03)
- `project-claude/manifest.json` — install manifest (phase 83-01)
- `project-claude/hooks/post-commit` + `.test.ts` — POSIX post-commit hook for auto-observation (phase 84-01, 84-02)
- `project-claude/agents/observer.md` — observer agent definition (phase 83-01)
- `project-claude/commands/sc/{start,status,observe,suggest,wrap,digest}.md` + tests — `/sc:*` slash commands (phases 85-01, 85-02, 85-03)
- `project-claude/commands/wrap/{plan,execute,verify,phase}.md` + router tests — `/wrap:*` wrapper commands (phases 86-01, 86-02)
- `tests/chipset/integration/end-to-end.test.ts` — 12 cross-track integration tests (phase 114-03)
- `docs/` — 14 refreshed documents (AGENT-GENERATION, AGENT-TEAMS, BOUNDED-LEARNING, CONFIGURATION, CORE-CONCEPTS, DEVELOPMENT, FEATURES, FILE-STRUCTURE, HOW-IT-WORKS, PATTERN-DISCOVERY, REQUIREMENTS, SKILL-FORMAT, TOKEN-BUDGET) — slim README extraction
- `README.md` — slim top-level README after `fdace7a5c` docs refactor
- `.planning/MILESTONES.md` — canonical phase-101-through-114 detail

---

## Version History (preserved from original release notes)

The v1.x line leading up to and following v1.13, summarized for archival continuity.

| Version | Summary |
|---------|---------|
| **v1.14** | Promotion Pipeline |
| **v1.13** | Session Lifecycle & Workflow Coprocessor |
| **v1.12.1** | Live Metrics Dashboard |
| **v1.12** | GSD Planning Docs Dashboard |
| **v1.11** | GSD Integration Layer |
| **v1.10** | Security Hardening |
| **v1.9** | Ecosystem Alignment & Advanced Orchestration |
| **v1.8.1** | Audit Remediation (Patch) |
| **v1.8** | Capability-Aware Planning + Token Efficiency |
| **v1.7** | GSD Master Orchestration Agent |
| **v1.6** | Cross-Domain Examples |
| **v1.5** | Pattern Discovery |
| **v1.4** | Agent Teams |
| **v1.3** | Documentation Overhaul |
| **v1.2** | Test Infrastructure |
| **v1.1** | Semantic Conflict Detection |
| **v1.0** | Core Skill Management |
