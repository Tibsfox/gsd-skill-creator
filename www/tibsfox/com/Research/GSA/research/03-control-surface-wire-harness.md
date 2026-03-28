# GSD-OS Control Surface Wire Harness

> **Domain:** GSD Ecosystem Alignment
> **Module:** 3 -- Bus Signal Specification & Control Surface Architecture
> **Through-line:** *A wire harness is a specification of what connects to what, at what bandwidth, with what priority. The GSD-OS control surface -- Blueprint Editor, Dashboard, Paula I/O, Boot Sequence, Skill Registry -- is the backplane of the orchestrator. Every signal on the bus has a purpose. Every priority level has a latency budget. The wire harness is the hardware reference manual for the GSD-OS backplane.*

---

## Table of Contents

1. [The Backplane Metaphor](#1-the-backplane-metaphor)
2. [Control Surface Components](#2-control-surface-components)
3. [Bus Signal Types and Priority](#3-bus-signal-types-and-priority)
4. [Blueprint Editor (Workbench)](#4-blueprint-editor-workbench)
5. [Dashboard (Oscilloscope)](#5-dashboard-oscilloscope)
6. [Paula I/O (tmux Session Layer)](#6-paula-io-tmux-session-layer)
7. [Boot Sequence (CRT Shader)](#7-boot-sequence-crt-shader)
8. [Skill Registry](#8-skill-registry)
9. [VRAM Budget Architecture](#9-vram-budget-architecture)
10. [Interrupt Vector Table](#10-interrupt-vector-table)
11. [Bandwidth Allocation and Latency Budgets](#11-bandwidth-allocation-and-latency-budgets)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. The Backplane Metaphor

In the Amiga, the backplane was the passive circuit board that connected all chips to the system bus. Agnus arbitrated. Denise drew pixels. Paula mixed audio and handled I/O. The 68000 computed. Every chip communicated through signals on the bus, and every signal had a defined priority, timing, and bandwidth allocation [1].

The GSD-OS control surface is the same architecture applied to an AI orchestrator. The Blueprint Editor is the workbench where chipset configurations are assembled. The Dashboard is the oscilloscope that displays real-time telemetry. Paula I/O is the tmux session layer connecting Claude sessions to the bus. The Boot Sequence initializes the chipset. The Skill Registry provides pattern-matched skill loading with cache policy.

```
GSD-OS CONTROL SURFACE BACKPLANE
================================================================

  +-----------+    +-----------+    +-----------+    +-----------+
  | Blueprint |    | Dashboard |    | Paula I/O |    | Boot Seq  |
  | Editor    |    | (Scope)   |    | (tmux)    |    | (CRT)     |
  +-----+-----+    +-----+-----+    +-----+-----+    +-----+-----+
        |                |                |                |
  ======|================|================|================|======
                     SYSTEM BUS (backplane)
  ======|================|================|================|======
        |                |                |                |
  +-----+-----+    +-----+-----+    +-----+-----+    +-----+-----+
  | Agnus     |    | Denise    |    | Paula     |    | 68000     |
  | (orch)    |    | (render)  |    | (I/O)     |    | (compute) |
  +-----------+    +-----------+    +-----------+    +-----------+
                                                          |
                                                    +-----+-----+
                                                    | Skill     |
                                                    | Registry  |
                                                    +-----------+
```

The wire harness specifies every signal on this bus.

> **Related:** [ISA & Bus](04-isa-bus-architecture.md), [Gas City Bridge](02-gas-city-chipset-bridge.md)

---

## 2. Control Surface Components

| Surface | Chipset Role | Bus Interface | Direction |
|---------|-------------|---------------|-----------|
| Blueprint Editor (Workbench) | Denise | Output: WebGL render pipeline; Input: user manipulation events | Bidirectional |
| Dashboard (Oscilloscope) | Denise + Paula | Read-only telemetry bus; 200ms refresh cycle | Read-only |
| Paula I/O (tmux session) | Paula | Bidirectional: stdin/stdout to Claude sessions, GPIO interrupt bus | Bidirectional |
| Boot Sequence (CRT shader) | Denise | One-time initialization bus; reads chipset.yaml, emits CHIPSET_INIT events | Write-once |
| Skill Registry | Agnus | Read: pattern queries; Write: skill updates; Cache: 5-min TTL | Read/Write |

Each surface connects to the backplane through a defined bus interface. The interface specifies signal direction, bandwidth requirements, and timing constraints.

---

## 3. Bus Signal Types and Priority

The GSD-OS bus defines seven signal types, ordered by priority from highest (preemptive) to lowest (deferrable):

| Signal Type | Priority | Latency Budget | Preempts | Description |
|------------|----------|---------------|----------|-------------|
| INTERRUPT (HITL gate) | 0 (highest) | immediate | All signals | Human-in-the-loop gate; suspends all bus activity |
| SAFETY_BLOCK | 1 | 10ms | All except INTERRUPT | Safety warden halt; staging layer gate triggered |
| CONTEXT_CRITICAL | 2 | 50ms | Priorities 3-6 | Context window at CRITICAL threshold (>90%) |
| ADAPTER_SWAP | 3 | 100ms hot / 500ms cold | Priorities 4-6 | LoRA hot-swap or cold-load from VRAM/RAM |
| CONTEXT_WARNING | 4 | 200ms | Priorities 5-6 | Context window at WARNING threshold (>80%) |
| SKILL_UPDATE | 5 | 1s | Priority 6 only | New skill applied to registry |
| TELEMETRY | 6 (lowest) | 200ms cycle | None | Dashboard refresh, OTEL metrics emit |

The priority system uses strict preemption: a higher-priority signal always interrupts a lower-priority operation. This mirrors the Amiga's interrupt system where Copper DMA preempted Blitter DMA, which preempted CPU access [1].

> **SAFETY WARNING:** The INTERRUPT (HITL gate) signal has the highest possible priority. When a human triggers a HITL gate, ALL bus activity suspends immediately. This is the "big red button" -- it exists because there are decisions that only humans should make, and the system must guarantee that it can always stop and wait for human input.

---

## 4. Blueprint Editor (Workbench)

The Blueprint Editor is the primary user interface for chipset configuration. Named after the Amiga Workbench, it provides a visual workbench for assembling and modifying chipset.yaml files [2].

**Output Bus (WebGL render pipeline):**
- Renders the chipset topology as an interactive graph
- Updates at 60fps during user manipulation (drag, resize, connect)
- Shader-based rendering for the CRT aesthetic
- WebGL context managed by Denise (display chip)

**Input Bus (user manipulation events):**
- Mouse/touch events for component placement
- Keyboard events for direct YAML editing
- Validation events (schema check on every change)
- Connection events (linking components on the bus)

**Bus Protocol:**
```
BLUEPRINT EDITOR BUS PROTOCOL
================================================================

  User Event --> [Input Decoder] --> [Chipset Validator] --> [State Update]
                                           |
                                    [Schema Error?]
                                     |           |
                                    yes          no
                                     |           |
                              [Error Overlay]  [Render Update]
                                              |
                                        [WebGL Pipeline]
                                              |
                                        [Display Output]
```

---

## 5. Dashboard (Oscilloscope)

The Dashboard provides real-time observability into the running chipset. Named after an oscilloscope, it displays telemetry signals as they flow across the bus [2].

**Telemetry Bus (read-only, 200ms refresh):**
- Token consumption rate (tokens/second per chip)
- Context window utilization (% per active session)
- Wave progress (completed/total tasks per wave)
- Bus signal frequency (events/second per signal type)
- VRAM utilization (MB per adapter, total budget)

**Display Channels:**

| Channel | Source | Refresh | Format |
|---------|--------|---------|--------|
| Token Rate | Agnus (budget) | 200ms | Sparkline, tok/s |
| Context % | Paula (I/O) | 200ms | Gauge, percentage |
| Wave Progress | Agnus (scheduler) | 1s | Progress bar |
| Bus Activity | All chips | 200ms | Event histogram |
| VRAM Budget | Paula (GPU) | 1s | Stacked bar, MB |
| Escalation | Paula (patrol) | Immediate | Alert badge |

The Dashboard never writes to the bus. It is purely observational -- a design decision that prevents monitoring from affecting the system it monitors.

---

## 6. Paula I/O (tmux Session Layer)

Paula manages the I/O layer connecting Claude sessions to the GSD-OS bus. In the Amiga, Paula handled serial, parallel, and audio I/O. In GSD-OS, Paula handles stdin/stdout to Claude sessions via tmux [2].

**Session Management:**
- Each Claude session runs in a tmux pane
- Paula multiplexes stdin/stdout across multiple concurrent sessions
- GPIO interrupt bus carries escalation events from sessions to the bus

**Bidirectional Bus:**
```
PAULA I/O SESSION LAYER
================================================================

  Claude Session 1 ──┐
  Claude Session 2 ──┤──> [Paula Multiplexer] ──> System Bus
  Claude Session 3 ──┤       |        |
  Claude Session N ──┘    [stdin]   [stdout]
                            |        |
                    [Command In]  [Result Out]
                            |        |
                    [GPIO Interrupt Bus]
                            |
                    [Escalation Events]
                            |
                    [Trust Tier Engine]
```

**GPIO Interrupt Mapping:**

| GPIO Pin | Signal | Source | Priority |
|----------|--------|--------|----------|
| GPIO-0 | SESSION_START | tmux pane created | TELEMETRY (6) |
| GPIO-1 | SESSION_END | tmux pane destroyed | TELEMETRY (6) |
| GPIO-2 | CONTEXT_WARN | Context >80% | CONTEXT_WARNING (4) |
| GPIO-3 | CONTEXT_CRIT | Context >90% | CONTEXT_CRITICAL (2) |
| GPIO-4 | TASK_COMPLETE | Wave task finished | SKILL_UPDATE (5) |
| GPIO-5 | ESCALATION | Trust tier event | SAFETY_BLOCK (1) |
| GPIO-6 | HITL_REQUEST | Human input needed | INTERRUPT (0) |
| GPIO-7 | ADAPTER_LOAD | LoRA swap needed | ADAPTER_SWAP (3) |

---

## 7. Boot Sequence (CRT Shader)

The Boot Sequence initializes the chipset from chipset.yaml. Named after the Amiga's boot process (with the CRT shader providing the visual aesthetic), it is a one-time write operation that reads configuration and emits initialization events [2].

**Boot Process:**

1. **CHIPSET_INIT:** Read chipset.yaml, validate schema, resolve model assignments
2. **BUS_INIT:** Initialize bus routing table, set priority levels, allocate bandwidth
3. **CHIP_INIT:** Initialize each chip component (Agnus, Denise, Paula, 68000, Gary)
4. **REGISTRY_INIT:** Load skill registry, populate cache, verify pattern matches
5. **SESSION_INIT:** Start tmux sessions, connect Paula I/O, establish GPIO mappings
6. **ADAPTER_INIT:** Load hot LoRA adapters into VRAM, verify budget constraints
7. **READY:** Emit CHIPSET_READY signal, enable bus activity

```
BOOT SEQUENCE TIMING
================================================================

  T+0ms     CHIPSET_INIT     Read YAML, validate schema
  T+50ms    BUS_INIT         Routing table, priorities
  T+100ms   CHIP_INIT        Component initialization
  T+200ms   REGISTRY_INIT    Skill loading, cache warm
  T+500ms   SESSION_INIT     tmux panes, Paula I/O
  T+1000ms  ADAPTER_INIT     LoRA VRAM loading
  T+1500ms  READY            Bus enabled, system live

  Total boot time: ~1.5 seconds (reference platform)
```

The CRT shader renders the boot sequence visually -- each stage displayed as a line on a retro terminal, phosphor glow fading in as components come online.

---

## 8. Skill Registry

The Skill Registry provides pattern-matched skill loading with a 5-minute TTL cache [3].

**Read Bus (pattern queries):**
- Context-activated skills match against current file patterns, task descriptions, and workflow state
- Query latency target: <50ms from cache, <500ms from cold registry scan
- Results ordered by relevance score (pattern match quality * recency * frequency)

**Write Bus (skill updates):**
- New skills registered via `.claude/skills/` directory scan
- Skill updates propagated to all active sessions via SKILL_UPDATE signal
- Write operations gated by SAFETY_BLOCK (skills must pass security hygiene check)

**Cache Bus (5-min TTL):**
- Frequently-accessed skills cached in memory
- Cache invalidated on skill file modification (filesystem watch)
- Cache warmth reported to Dashboard telemetry

---

## 9. VRAM Budget Architecture

The RTX 4060 Ti 8GB reference platform defines the VRAM budget for the GPU silicon layer [4]:

| Resource | Budget | Notes |
|----------|--------|-------|
| Base model (Q4_K_M 7B) | 4,500 MB | Qwen3-8B or Llama 3.1-8B; persistent |
| KV cache (quantized fp8) | 2,000 MB | 128k+ context via Ollama/llama.cpp |
| Hot LoRA adapters (3-4) | 200 MB | Resident in VRAM; sub-100ms swap |
| CUDA overhead / buffers | 500 MB | Runtime headroom |
| Cold LoRA adapters (20-30) | 1,000 MB | System RAM; ~500ms cold-load |
| QLoRA training workspace | 8,000 MB | System RAM; distillation buffer |

> **SAFETY WARNING:** The VRAM budget ceiling is ABSOLUTE: base model + hot adapters + KV cache must not exceed 7,700MB. The remaining 300MB is reserved for CUDA runtime overhead. Exceeding this limit causes OOM kills that terminate inference mid-generation.

**Budget Arithmetic:**
```
VRAM BUDGET (RTX 4060 Ti 8GB = 8,192 MB)
================================================================

  Base model:           4,500 MB  (55.0%)
  KV cache:             2,000 MB  (24.4%)
  Hot LoRA adapters:      200 MB  ( 2.4%)
  CUDA overhead:          500 MB  ( 6.1%)
  ────────────────────────────────────────
  Total VRAM:           7,200 MB  (87.9%)
  Headroom:               992 MB  (12.1%)

  System RAM (60 GB available):
  Cold adapters:        1,000 MB
  QLoRA workspace:      8,000 MB
  OS + applications:   ~51,000 MB
```

---

## 10. Interrupt Vector Table

The interrupt vector table maps each signal type to its handler and priority:

| Vector | Signal | Handler | Priority | Mask |
|--------|--------|---------|----------|------|
| 0x00 | INTERRUPT (HITL) | `hitl_gate_handler` | 0 | Non-maskable |
| 0x01 | SAFETY_BLOCK | `safety_warden_halt` | 1 | Non-maskable |
| 0x02 | CONTEXT_CRITICAL | `context_emergency_gc` | 2 | Maskable by 0-1 |
| 0x03 | ADAPTER_SWAP | `lora_swap_handler` | 3 | Maskable by 0-2 |
| 0x04 | CONTEXT_WARNING | `context_warning_notify` | 4 | Maskable by 0-3 |
| 0x05 | SKILL_UPDATE | `registry_refresh` | 5 | Maskable by 0-4 |
| 0x06 | TELEMETRY | `dashboard_refresh` | 6 | Maskable by 0-5 |

Non-maskable interrupts (HITL and SAFETY_BLOCK) cannot be suppressed by any other signal. They always execute immediately.

```
INTERRUPT PRIORITY CHAIN
================================================================

  HITL Gate (NMI) ─────────────────────────────────> STOP ALL
       |
  SAFETY Block (NMI) ────────────────────────────-> HALT + GATE
       |
  Context Critical ───────────────────────────────-> GC + COMPRESS
       |
  Adapter Swap ───────────────────────────────────-> VRAM MANAGE
       |
  Context Warning ────────────────────────────────-> NOTIFY
       |
  Skill Update ───────────────────────────────────-> CACHE REFRESH
       |
  Telemetry ──────────────────────────────────────-> DASHBOARD
```

---

## 11. Bandwidth Allocation and Latency Budgets

| Bus Segment | Bandwidth | Latency | Duty Cycle |
|-------------|-----------|---------|------------|
| WebGL render pipeline | 60 fps | 16.6ms frame budget | Continuous during editing |
| Telemetry refresh | 5 Hz | 200ms cycle | Continuous during execution |
| Skill registry query | On-demand | 50ms cached / 500ms cold | Burst during FPGA synthesis |
| Paula I/O multiplex | Per-session | <10ms stdin relay | Continuous during sessions |
| GPIO interrupt delivery | Event-driven | <1ms from trigger | Intermittent |
| Boot sequence | One-time | 1.5s total | Boot only |
| VRAM management | On-demand | 100ms hot / 500ms cold | Intermittent during swaps |

The total bus bandwidth is not a fixed number because most segments are event-driven or on-demand. The continuous segments (WebGL rendering and telemetry) consume the majority of sustained bandwidth. GPIO interrupt delivery has the tightest latency budget (<1ms) because it carries safety-critical signals.

---

## 12. Wire Harness Completeness Verification

The wire harness is complete when every signal that can flow between control surface components is defined. Verification matrix:

| Source | Destination | Signal Type | Defined? |
|--------|------------|-------------|----------|
| Blueprint Editor | Chipset Validator | Schema change event | Yes (Section 4) |
| Chipset Validator | Blueprint Editor | Validation result | Yes (Section 4) |
| Dashboard | All chips | Telemetry query | Yes (Section 5) |
| All chips | Dashboard | Telemetry response | Yes (Section 5) |
| Paula I/O | Claude sessions | stdin relay | Yes (Section 6) |
| Claude sessions | Paula I/O | stdout relay | Yes (Section 6) |
| Boot Sequence | All chips | CHIPSET_INIT | Yes (Section 7) |
| Skill Registry | Active sessions | SKILL_UPDATE | Yes (Section 8) |
| GPU adapter | Bus | ADAPTER_SWAP | Yes (Section 3) |
| Safety warden | Bus | SAFETY_BLOCK | Yes (Section 3) |
| Human | Bus | INTERRUPT (HITL) | Yes (Section 3) |
| Context monitor | Bus | CONTEXT_CRITICAL | Yes (Section 3) |
| Context monitor | Bus | CONTEXT_WARNING | Yes (Section 3) |

**Completeness Status:** All 13 signal paths defined. No orphan signals (signals with no handler). No orphan handlers (handlers with no signal source).

---

## 13. Alignment with Gastown Escalation

The wire harness priority system maps structurally to Gastown's Trust Tier Escalation Engine (Module 1, Section 3):

| GSD Bus Signal | Priority | Gastown Equivalent | Escalation Level |
|---------------|----------|--------------------|-----------------|
| INTERRUPT | 0 | Mayor override | N/A (human) |
| SAFETY_BLOCK | 1 | Deacon critical alert | block |
| CONTEXT_CRITICAL | 2 | Resource exhaustion | critical |
| ADAPTER_SWAP | 3 | Polecat re-dispatch | N/A (internal) |
| CONTEXT_WARNING | 4 | Budget warning | warn |
| SKILL_UPDATE | 5 | Config change | N/A (routine) |
| TELEMETRY | 6 | Witness observation | N/A (passive) |

This mapping enables interoperability: a Gastown escalation event at severity "block" maps to a SAFETY_BLOCK signal on the GSD bus, triggering the same response chain. A shared severity taxonomy would formalize this mapping into a protocol both systems can rely on.

```
ESCALATION-TO-BUS SIGNAL TRANSLATION
================================================================

  Gastown Escalation Engine          GSD Bus
  +-----------------------+         +-------------------+
  | severity: "block"     | ------> | SAFETY_BLOCK (1)  |
  | severity: "critical"  | ------> | CONTEXT_CRIT (2)  |
  | severity: "warn"      | ------> | CONTEXT_WARN (4)  |
  +-----------------------+         +-------------------+

  Translation is mechanical: severity string -> priority integer
  No information is lost in translation.
```

> **ALIGNED:** The GSD bus priority system and Gastown escalation severity system are structurally isomorphic. A formal bridge between them is a low-risk, high-value alignment contribution.

---

## 14. Cross-References

- **Module 1 (Yegge Ecosystem):** Escalation severity levels map to bus signal priority
- **Module 2 (Gas City Bridge):** Gas City topologies expressed through this bus architecture
- **Module 4 (ISA & Bus):** ISA register definitions flow through these bus signals
- **Module 5 (Intent Router):** ADAPTER_SWAP signal triggers LoRA routing decisions
- **Module 6 (GPU Silicon):** VRAM budget constraints enforced by this bus
- **ACE:** Agent collaboration patterns define bus traffic patterns
- **PMG:** Project management signal flow maps to bus signal routing
- **GSD2:** Core GSD ecosystem bus architecture origin

---

## 15. Sources

1. Amiga Hardware Reference Manual, 3rd Edition. Addison-Wesley, 1991. Bus arbitration and DMA priority architecture.
2. GSD Project Knowledge: gsd-os-desktop-vision.md. Control surface architecture, Blueprint Editor, Dashboard, CRT shader specification.
3. GSD Project Knowledge: gsd-chipset-architecture-vision.md. Skill registry, cache policy, FPGA synthesis pipeline.
4. GSD Project Knowledge: gsd-silicon-layer-spec.md. VRAM budget architecture, RTX 4060 Ti reference platform.
5. NVIDIA CUDA Programming Guide. Memory management, OOM handling, VRAM allocation patterns.
6. Ollama documentation: llama.cpp integration, quantized model loading, KV cache management.
7. tmux documentation: session management, pane multiplexing, send-keys interface.
8. WebGL 2.0 specification: render pipeline, frame budget, shader compilation.
9. OTEL (OpenTelemetry) specification: metrics collection, trace propagation, log correlation.
10. VictoriaMetrics documentation: time-series storage, query language, alerting.
11. GSD Project Knowledge: gsd-instruction-set-architecture-vision.md. Bus protocol layers.
12. RISC-V Privileged Specification: interrupt priority and masking architecture (analogy reference).
13. ARM GIC (Generic Interrupt Controller) specification: priority-based interrupt handling (analogy reference).
14. Motorola 68000 Programmer's Reference Manual: interrupt vector table format (naming convention source).
15. GSD upstream intelligence pack v1.43: bus telemetry baseline.
16. Tauri v2 documentation: WebView bridge, IPC between Rust backend and Vite frontend.
17. Vite v6 documentation: HMR protocol, development server architecture.
