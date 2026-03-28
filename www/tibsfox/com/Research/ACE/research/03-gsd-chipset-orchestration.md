# GSD Chipset -- Multi-Agent Orchestration

> **Domain:** Compute Engine Layer 3
> **Module:** 3 -- The Orchestration Layer
> **Through-line:** *The original Amiga had a 68000 CPU with three custom chips, and together they produced something that no single chip could have achieved.* The GSD chipset maps this same principle to multi-agent orchestration: specialized execution paths, faithfully iterated, produce outcomes that general-purpose brute force cannot. The art is in the bus architecture -- the connections between the chips determine the quality of the system.

---

## Table of Contents

1. [The Amiga Principle](#1-the-amiga-principle)
2. [Agnus / Denise / Paula / 68000 Mapping](#2-agnus-denise-paula-68000-mapping)
3. [The Filesystem Bus Protocol (GSD ISA)](#3-the-filesystem-bus-protocol-gsd-isa)
4. [Bus Signal Specification](#4-bus-signal-specification)
5. [DACP -- Deterministic Agent Communication Protocol](#5-dacp----deterministic-agent-communication-protocol)
6. [Skill Promotion Pipeline](#6-skill-promotion-pipeline)
7. [Bus Arbitration and DMA Channels](#7-bus-arbitration-and-dma-channels)
8. [Team-of-Teams Topology](#8-team-of-teams-topology)
9. [Budget Control and Token DMA](#9-budget-control-and-token-dma)
10. [The Safety Warden Pattern](#10-the-safety-warden-pattern)
11. [Claude Code Sub-Agent Bridge](#11-claude-code-sub-agent-bridge)
12. [Phase Signals and Wave Boundaries](#12-phase-signals-and-wave-boundaries)
13. [Cross-References](#13-cross-references)
14. [Sources](#14-sources)

---

## 1. The Amiga Principle

The Amiga Principle, stated for compute engines [1]:

A compute engine achieves maximum leverage not when every component is powerful, but when every component is *specialized* -- and when the bus architecture between them is clean enough that specialization multiplies rather than adds. The art is in the connections, not in the nodes. The meaning lives in the spaces between.

This is not an architectural preference. It is an engineering theorem demonstrated by forty years of computing history. The original Amiga (1985) outperformed machines with 10x the raw processing power because Jay Miner's team designed four chips that worked in concert rather than competing for resources [2].

```
THE AMIGA PRINCIPLE -- ORIGINAL vs. GSD
================================================================

  ORIGINAL AMIGA (1985)              GSD COMPUTE ENGINE (2026)
  ┌─────────────┐                    ┌─────────────┐
  │ 68000 CPU   │ General compute    │ Claude API  │ Master loop
  │ 7.16 MHz    │                    │ Opus/Sonnet │
  └──────┬──────┘                    └──────┬──────┘
         │                                  │
  ┌──────┴──────┐                    ┌──────┴──────┐
  │ Agnus       │ DMA + memory       │ Skill-Crtr  │ DMA + budget
  │ Chip RAM    │                    │ Token DMA   │
  └──────┬──────┘                    └──────┬──────┘
         │                                  │
  ┌──────┴──────┐                    ┌──────┴──────┐
  │ Denise      │ Display engine     │ WebGL       │ Shader render
  │ Bitplanes   │                    │ CUDA        │
  └──────┬──────┘                    └──────┬──────┘
         │                                  │
  ┌──────┴──────┐                    ┌──────┴──────┐
  │ Paula       │ Audio + I/O        │ tmux + GPIO │ Hooks + MCP
  │ 4-channel   │                    │ I/O bridge  │
  └─────────────┘                    └─────────────┘
```

---

## 2. Agnus / Denise / Paula / 68000 Mapping

From the GSD ISA specification [3], the chip roles map precisely to GSD orchestration components:

| Chip | Original Role | GSD Role | Claude Code Parallel |
|------|--------------|----------|---------------------|
| 68000 | General CPU | Claude API | Master loop orchestrator [M1] |
| Agnus | DMA + memory | Skill-creator + budget | Sub-agent spawning + token DMA |
| Denise | Display engine | WebGL shaders | Artifact rendering, CUDA output |
| Paula | Audio + I/O | tmux session + GPIO | Hooks + MCP servers [M1] |

### 68000-Class Nodes

The 68000 is the general-purpose intelligence that connects the specialized coprocessors into a coherent system. In GSD, this is Claude Code running the master loop [M1]. It does not try to do everything -- it delegates specialized work to the other chips and coordinates the results.

### Agnus-Class Nodes

Agnus controls memory access and DMA. In GSD, Agnus manages:
- **Token budget allocation:** How many tokens each agent and wave receives
- **Sub-agent spawning:** DMA-style direct transfer of work to child agents [M1]
- **Skill-creator orchestration:** The primary coordination engine
- **Cache TTL management:** Ensuring the 5-minute cache window is exploited [4]

### Denise-Class Nodes

Denise handles display and visualization. In GSD, Denise manages:
- **WebGL shader rendering:** Visual output from CUDA computations [M4]
- **Architecture diagrams:** Domain maps, dependency graphs, timing charts
- **GPU-heavy inference:** Denise-class mesh nodes run the dual RTX 5090s [M5]

### Paula-Class Nodes

Paula handles audio and I/O. In GSD, Paula manages:
- **MCP server bridges:** External API gateway [M1]
- **Hook execution:** Deterministic lifecycle automation
- **Storage I/O:** File system operations on the ISA bus
- **tmux session management:** Terminal multiplexing for parallel agent views

---

## 3. The Filesystem Bus Protocol (GSD ISA)

The GSD ecosystem uses the filesystem as its primary message bus [3]. The ISA formalizes this into three bus types:

```
GSD FILESYSTEM BUS ARCHITECTURE
================================================================

  CONTROL BUS                ADDRESS BUS              DATA BUS
  ┌──────────────┐          ┌──────────────┐         ┌──────────────┐
  │ .planning/   │          │ Agent IDs    │         │ Artifacts    │
  │ console/     │          │ Skill refs   │         │ Configs      │
  │ inbox/       │          │ File paths   │         │ Observation  │
  │              │          │              │         │ records      │
  │ Opcodes:     │          │ Addressing:  │         │              │
  │ - PHASE_GO   │          │ - /agent/id  │         │ .planning/   │
  │ - WAVE_DONE  │          │ - /skill/ref │         │ console/     │
  │ - BUDGET_CHK │          │ - /path/file │         │ outbox/      │
  └──────────────┘          └──────────────┘         └──────────────┘
```

### Why Filesystem-as-Bus

The filesystem provides properties that purpose-built message buses struggle to achieve [3]:

1. **Persistence:** Messages survive process crashes, unlike in-memory queues
2. **Inspectability:** Any developer can `ls` the bus state with standard tools
3. **Versioning:** Git provides automatic history for every bus transaction
4. **Concurrency:** The OS kernel handles file system locking
5. **Portability:** Works on every operating system without additional dependencies

The tradeoff is latency: file I/O is slower than shared memory or RPC. For GSD's use case (agent coordination at second-scale granularity), this latency is irrelevant.

---

## 4. Bus Signal Specification

Bus signals map to filesystem operations [3]:

| Signal | Operation | Filesystem Action |
|--------|-----------|-------------------|
| WRITE | Create/update | Write file to path |
| READ | Read | Read file from path |
| ACK | Acknowledge | Move file to `acknowledged/` |
| IRQ | Interrupt request | Create file in `notifications/` |
| DMA | Direct transfer | Copy artifact bypassing main bus |
| RESET | Clear pipeline | Delete all files in pipeline state |
| NMI | Non-maskable interrupt | Create file in `urgent/` (safety) |

### Signal Timing

```
BUS SIGNAL TIMING DIAGRAM
================================================================

  Agent A         Control Bus         Agent B
  ────────────────────────────────────────────
  WRITE ──────>  inbox/task.yaml
                                      READ ──>
                 outbox/result.json  <────── WRITE
  READ ────────>
  ACK ─────────> acknowledged/
                                      IRQ ───> notifications/
  (human)
  NMI ─────────> urgent/safety.yaml
  ────────────────────────────────────────────
```

---

## 5. DACP -- Deterministic Agent Communication Protocol

DACP (v1.49) shifts agent-to-agent handoffs from ambiguous markdown to structured three-part bundles [5]:

### Bundle Structure

```
DACP BUNDLE FORMAT
================================================================

  {
    "intent": {
      "completed": "Analyzed CUDA memory hierarchy",
      "needs_next": "Cross-reference with mesh NVLink topology",
      "wave": "1B",
      "agent": "CRAFT-GPU"
    },
    "data": {
      "memory_hierarchy": {
        "registers": { "latency_cycles": 1, "scope": "per_thread" },
        "shared_memory": { "latency_cycles": "5-10", "scope": "per_block" },
        "global_memory": { "latency_cycles": "400-600", "scope": "per_gpu" }
      },
      "optimization_rules": [
        "Minimize global memory access",
        "Maximize shared memory reuse",
        "Coalesce memory access patterns"
      ]
    },
    "code": {
      "kernel_example": "// __global__ void matmul(...) { ... }",
      "test_harness": "// nvcc -o test test.cu && ./test",
      "artifacts": ["memory_model.md", "kernel_patterns.cu"]
    }
  }
```

### Three-Part Design Rationale

1. **Intent:** What the sending agent accomplished and what it needs next. This enables the receiving agent to understand context without re-reading source documents.
2. **Data:** Structured payload (JSON/YAML, not prose). Machine-parseable, schema-validated, unambiguous.
3. **Code:** Executable artifacts, not descriptions of artifacts. The receiving agent can run the code immediately.

### Claude Code Mapping

In Claude Code terms: DACP bundles map directly to the sub-agent result structure [M1]. The lead agent receives DACP-formatted results from spawned sub-agents and can route them without markdown parsing.

> **Related:** [Claude Code -- Agentic Architecture](01-claude-code-agentic-architecture.md) for how sub-agent spawning and result collection implements DACP at the runtime level.

---

## 6. Skill Promotion Pipeline

The skill promotion pipeline is the Amiga Principle in motion: proven patterns move from expensive general execution to cheap specialized execution [1]:

```
SKILL PROMOTION PIPELINE
================================================================

  Stage 1          Stage 2        Stage 3        Stage 4        Stage 5
  Observation  ->  Pattern    ->  Skill      ->  Adapter    ->  Compiled
  (session #N)     (5+ repeat)    (SKILL.md)     (LoRA .st)     (GPU shader)

  Cost:    0        low           medium          high             highest
  Speed:   slow     slow          fast            very fast        native
  Model:   Claude   Claude        Claude/Local    Local            Hardware
  Fidelity: --      observed      specified       trained          silicon
```

### Stage Details

**Stage 1 -- Observation:** The Rosetta Core's calibration engine [M2] notices that an agent repeatedly performs the same type of task. No action taken; only recording.

**Stage 2 -- Pattern Recognition:** After 5+ observations of the same pattern, the system recognizes a candidate skill. The pattern is documented with input/output examples.

**Stage 3 -- Skill Codification:** The pattern is formalized as a SKILL.md file with activation triggers, execution steps, and validation criteria. The skill can be invoked by name.

**Stage 4 -- Adapter Training:** For high-frequency skills, a LoRA adapter is trained on the skill's input/output pairs. The adapter produces `.safetensors` files that can run on local GPU hardware [M4].

**Stage 5 -- Compiled Shader:** The most performance-critical skills are compiled to GPU shaders (PTX bytecode via NVCC or NVVM IR) that execute at hardware speed [M4].

> **Related:** [CUDA Silicon Layer](04-cuda-silicon-layer.md) for the technical details of Stages 4 and 5, including LoRA adapter compilation and cuTile tile programming.

---

## 7. Bus Arbitration and DMA Channels

When multiple agents contend for the same bus resource (e.g., writing to the same configuration file), the GSD ISA provides arbitration rules [3]:

### Priority Levels

| Priority | Agent Class | Rule |
|----------|------------|------|
| 0 (highest) | Safety Warden | Can write `urgent/` and halt any agent |
| 1 | 68000 / FLIGHT | Master coordination has priority over all except safety |
| 2 | Agnus / BUDGET | Resource management takes priority over execution |
| 3 | EXEC agents | Production agents run at normal priority |
| 4 | LOG / RETRO | Audit and retrospective run at lowest priority |

### DMA Channels

DMA (Direct Memory Access) bypasses the main bus for high-bandwidth transfers [3]:

- **Skill DMA:** Transferring compiled skill artifacts directly from Agnus to Denise without passing through the 68000 routing
- **Artifact DMA:** Large file transfers (trained adapters, shader binaries) bypass the control bus
- **Cache DMA:** Pre-loading frequently-accessed documents into agent context without explicit READ operations

```
DMA CHANNEL ARCHITECTURE
================================================================

  Normal path (through bus):
  Agnus ──> Control Bus ──> 68000 ──> Data Bus ──> Denise

  DMA path (direct):
  Agnus ──────────────────────────────────────────> Denise
  (bypasses 68000 routing, direct artifact transfer)
```

---

## 8. Team-of-Teams Topology

GSD organizes agents into teams that mirror the Amiga chip specialization [6]:

### Topology Structure

```
TEAM-OF-TEAMS TOPOLOGY
================================================================

  FLIGHT TEAM (command)
  ├── FLIGHT (orchestrator)
  ├── PLAN (wave decomposition)
  └── CAPCOM (human interface)

  EXECUTION TEAM A (Claude Code + Rosetta)
  ├── EXEC-A (producer)
  ├── CRAFT-CODE (architect)
  └── SCOUT (researcher)

  EXECUTION TEAM B (Chipset + CUDA)
  ├── EXEC-B (producer)
  └── CRAFT-GPU (specialist)

  EXECUTION TEAM C (Mesh + Docs)
  ├── EXEC-C (producer)
  └── CRAFT-KNUTH (scholar)

  SUPPORT TEAM
  ├── VERIFY (accuracy)
  ├── INTEG (integration)
  ├── BUDGET (resources)
  ├── SURGEON (health)
  └── LOG (audit)

  SAFETY TEAM
  └── SECURE (boundaries)
```

### Team Communication Rules

1. **Intra-team:** Direct DACP bundles, no routing required
2. **Inter-team:** Routed through FLIGHT or INTEG agents
3. **Safety overrides:** SECURE can address any agent directly (NMI signal)
4. **Human channel:** Only CAPCOM communicates with the human operator

---

## 9. Budget Control and Token DMA

The BUDGET agent (Haiku-class, Agnus role) enforces token ceilings [4]:

### Budget Allocation

| Model | Budget Ceiling | Rationale |
|-------|---------------|-----------|
| Opus | 30% of total | Expensive; reserved for judgment-heavy tasks |
| Sonnet | 60% of total | Primary execution model; best cost/capability ratio |
| Haiku | 10% of total | Scaffolding, logging, budget tracking |

### Token DMA

Token DMA is the mechanism by which Agnus allocates tokens to agents without requiring FLIGHT approval for each allocation [4]:

```
TOKEN DMA FLOW
================================================================

  BUDGET (Agnus) maintains token ledger:
  ┌────────────────────────────────┐
  │ Total budget: 343K tokens      │
  │                                │
  │ Wave 0: 8K  (Haiku)    ████   │
  │ Wave 1: 235K (mixed)   █████  │
  │ Wave 2: 65K  (Opus)    ████   │
  │ Wave 3: 35K  (Sonnet)  ███    │
  │                                │
  │ Opus ceiling: 30% = 103K      │
  │ Opus spent:   47K             │
  │ Opus remaining: 56K           │
  └────────────────────────────────┘
```

When a CRAFT agent (Opus) completes a task under budget, the surplus is released back to the pool. When an agent approaches its ceiling, BUDGET signals TOPO to consider restructuring the team to shift load to a different model class.

---

## 10. The Safety Warden Pattern

The SECURE agent implements defense-in-depth for the multi-agent system [7]:

### Monitoring Rules

| Rule | Action | Trigger |
|------|--------|---------|
| Out-of-scope write | HALT agent | Agent writes to path outside its assigned scope |
| Budget overrun | WARN + throttle | Agent approaches 90% of allocated tokens |
| Safety boundary | NMI + HALT | Agent attempts to modify protected file |
| Content drift | FLAG for review | Agent output diverges from assigned module topic |
| Credential exposure | BLOCK + alert | Agent output contains potential secrets or PII |

### NMI (Non-Maskable Interrupt)

The safety warden can issue NMI signals that cannot be ignored by any agent [3]. An NMI creates a file in `urgent/` that all agents must check before their next tool invocation. This is the filesystem equivalent of a hardware non-maskable interrupt.

> **SAFETY WARNING:** The safety warden is a necessary but not sufficient protection. Like all monitoring systems, it can only detect patterns it has been configured to recognize. Novel failure modes require human oversight at wave boundaries (CAPCOM gates).

---

## 11. Claude Code Sub-Agent Bridge

The bridge between GSD's chipset model and Claude Code's sub-agent system [M1]:

| GSD Concept | Claude Code Implementation |
|-------------|---------------------------|
| Agnus DMA | `Task.create()` with parallel flag |
| Denise render | Sub-agent writing to artifact directory |
| Paula I/O | MCP server calls from sub-agent |
| 68000 routing | Lead agent's master loop dispatch |
| ISA bus | Filesystem read/write through tools |
| DACP bundle | Sub-agent return value (JSON) |
| Phase signal | Git branch merge + state file update |
| NMI | Ctrl+C interrupt propagation |

### Bridge Protocol

1. GSD FLIGHT agent translates wave plan into Claude Code sub-agent spawn commands
2. Each sub-agent receives its DACP bundle as initial context
3. Sub-agents write results to the ISA bus (filesystem)
4. FLIGHT agent collects results and routes inter-team handoffs
5. BUDGET agent monitors token consumption via API usage tracking

---

## 12. Phase Signals and Wave Boundaries

Wave execution follows a strict phase discipline [6]:

```
WAVE PHASE PROTOCOL
================================================================

  PHASE_READY    ──> All agents for wave N loaded and configured
  PHASE_GO       ──> Execution begins; agents proceed with assigned tasks
  PHASE_SYNC     ──> Mid-wave synchronization point (optional)
  PHASE_COMPLETE ──> All agents for wave N have reported completion
  PHASE_VERIFY   ──> Verification pass on wave N outputs
  PHASE_GATE     ──> Human approval gate (CAPCOM)
  PHASE_ADVANCE  ──> Proceed to wave N+1
```

### Phase Signal Implementation

Phase signals are files written to the control bus [3]:

- `PHASE_GO.yaml` contains the wave number, assigned agents, and timeout
- `PHASE_COMPLETE.yaml` is written by FLIGHT when all agent results are collected
- `PHASE_GATE.yaml` triggers CAPCOM to present results for human approval
- `PHASE_ADVANCE.yaml` is written by CAPCOM after human approval, unlocking the next wave

The frog chorus protocol [M5] extends this to multi-node mesh clusters where phase coherence must be maintained across physical machines.

---

## 13. Cross-References

> **Related:** [Claude Code -- Agentic Architecture](01-claude-code-agentic-architecture.md) -- The 68000 role maps to Claude Code's master loop; Agnus maps to sub-agent spawning; Paula maps to hooks and MCP.

> **Related:** [Rosetta Core -- Translation Engine](02-rosetta-core-translation-engine.md) -- The skill promotion pipeline (Section 6) takes Rosetta Core observations as input.

> **Related:** [CUDA Silicon Layer](04-cuda-silicon-layer.md) -- Stages 4 and 5 of the skill promotion pipeline produce LoRA adapters and compiled GPU shaders.

> **Related:** [Mesh & Phase Synchronization](05-mesh-phase-synchronization.md) -- The Agnus/Denise/Paula/68000 node taxonomy from Section 2 becomes the physical node types in the 10-node mesh cluster.

> **Related:** [Fractal Documentation Fidelity](06-fractal-documentation-fidelity.md) -- The fidelity pass is triggered as a pre-Wave 3 gate in the phase protocol (Section 12).

**Cross-project references:**
- **GSD2** (GSD Architecture): The canonical specification of the chipset model
- **SGL** (Signal & Light): DSP signal chain as a concrete chipset application
- **CMH** (Computational Mesh): Mesh topology for distributed chipset execution
- **SFC** (Skill Factory): Implements the skill promotion pipeline
- **MPC** (Math Co-Processor): Denise-class GPU computation via MCP
- **SYS** (Systems Administration): Infrastructure where chipset nodes are deployed
- **K8S** (Kubernetes): Container orchestration for node management
- **GPO** (GPU Operations): CUDA kernel execution on Denise-class nodes

---

## 14. Sources

1. Tibsfox. *gsd-amiga-vision-architectural-leverage.md*. GSD Project Knowledge, 2025.
2. Miner, J. et al. "Amiga Custom Chip Architecture." Commodore Engineering, 1985.
3. Tibsfox. *gsd-instruction-set-architecture-vision.md*. GSD Project Knowledge, 2025-2026.
4. Tibsfox. *gsd-chipset-architecture-vision.md*. GSD Project Knowledge, 2025-2026.
5. Tibsfox. *DACP v1.49 Protocol Specification*. GSD Project Knowledge, 2026.
6. Tibsfox. *gsd-silicon-layer-spec.md*. GSD Project Knowledge, February 2026.
7. Tibsfox. *gsd-security-hygiene-skill.md*. GSD Project Knowledge, 2025.
8. Anthropic. *Claude Code Sub-agents and Parallelism*. https://code.claude.ai/docs/en/sub-agents, 2026.
9. Anthropic. *Claude Code Overview*. https://code.claude.ai/docs/en/overview, 2025.
10. Patterson, D. and Hennessy, J. *Computer Organization and Design: The Hardware/Software Interface*. Morgan Kaufmann, 2020.
11. Bagnall, B. *Commodore: A Company on the Edge*. Variant Press, 2010.
12. Tibsfox. *gsd-os-desktop-vision.md*. GSD Project Knowledge, 2025.
13. IEEE. "Token Bucket Algorithm for Rate Limiting." IEEE 802.1Qav, 2009.
14. Tibsfox. *gsd-upstream-intelligence-pack-v1_43.md*. GSD Project Knowledge, 2025.
15. Lamport, L. "Time, Clocks, and the Ordering of Events in a Distributed System." *Communications of the ACM*, 1978.
