# ISA & Bus Architecture Specification

> **Domain:** GSD Ecosystem Alignment
> **Module:** 4 -- Instruction Set Architecture, Five-Layer Stack, Register Mapping
> **Through-line:** *The ISA is the contract between intent and execution. Above the bridge, the world speaks in natural language, workflow phases, and skill patterns. Below the bridge, the world speaks in register assignments, bus protocols, and copper list execution. The ISA is the translation layer -- the assembly language of AI orchestration -- and like every good ISA, it must be honest: fully specified, completely documented, and implementable on real hardware.*

---

## Table of Contents

1. [The Five-Layer Stack](#1-the-five-layer-stack)
2. [Level 5: Human Intent](#2-level-5-human-intent)
3. [Level 4: GSD Workflow Orchestration](#3-level-4-gsd-workflow-orchestration)
4. [Level 3: GSD Assembly Language](#4-level-3-gsd-assembly-language)
5. [The Bridge: Level 3 to Level 2](#5-the-bridge-level-3-to-level-2)
6. [Level 2: GSD Machine Language](#6-level-2-gsd-machine-language)
7. [Level 1: Bus Protocol](#7-level-1-bus-protocol)
8. [Register Mapping Across Architectures](#8-register-mapping-across-architectures)
9. [Instruction Encoding Format](#9-instruction-encoding-format)
10. [FPGA Synthesis Pipeline](#10-fpga-synthesis-pipeline)
11. [Copper List Execution Model](#11-copper-list-execution-model)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. The Five-Layer Stack

GSD's ISA defines a five-layer abstraction stack. The same five layers appear in both directions -- upward into AI orchestration, and downward into real hardware. The ISA is the bridge between the two stacks [1].

```
UPWARD (AI orchestration):              DOWNWARD (real hardware):
  Level 5: Natural language intent        Level 1: Physical bus (I2C/SPI/UART/GPIO)
  Level 4: GSD workflow (phases)          Level 2: Machine language (opcodes)
  Level 3: GSD Assembly (mnemonics)       Level 3: Assembly language (mnemonics)
  ====== THE ISA BRIDGE ======            Level 4: High-level language (C/Rust)
  Level 2: GSD Machine Language           Level 5: Application (program)
  Level 1: Bus Protocol (filesystem)

The symmetry is intentional. The upward stack mirrors the downward
stack because both solve the same problem: translating intent into
execution through layers of increasing specificity.
```

The key insight: the ISA serves both directions. A GSD Assembly instruction like `LOAD SK, #react-patterns` can be compiled downward into a bus operation (load a skill file from disk) or interpreted upward into a workflow action (apply the react-patterns skill to the current context) [1].

> **Related:** [Wire Harness](03-control-surface-wire-harness.md), [GPU Silicon](06-gpu-silicon-execution.md)

---

## 2. Level 5: Human Intent

Level 5 is the natural language layer. The human types a sentence -- "Build me a React dashboard with WebSocket updates" -- and the system must extract structured intent from unstructured text [1].

**Intent Extraction Process:**
1. Natural language parsed for domain signals (React, WebSocket, dashboard)
2. Domain signals matched against skill registry patterns
3. Workflow phase identified (is this new-project? execute? debug?)
4. Confidence score computed for the overall classification

**Level 5 Output Format:**
```
{
  intent: "build-project",
  domain: ["react", "websocket", "dashboard"],
  phase: "new-project",
  confidence: 0.94,
  skills_matched: ["react-patterns", "websocket-integration", "dashboard-layout"],
  adapter_candidates: ["frontend-adapter", "fullstack-adapter"]
}
```

Level 5 is the most ambiguous layer. Human language is inherently imprecise, and the system must handle that ambiguity gracefully. The confidence score propagates downward -- low confidence at Level 5 triggers conservative behavior at all lower levels [1].

---

## 3. Level 4: GSD Workflow Orchestration

Level 4 translates intent into the GSD workflow phases: `new-project -> research -> requirements -> plan -> execute` [1].

**Phase Mapping:**

| Intent Type | GSD Phase | Output |
|------------|-----------|--------|
| New capability request | new-project | PROJECT.md, REQUIREMENTS.md |
| Investigation/analysis | research | Research modules, source index |
| Specification writing | requirements | REQUIREMENTS.md, test plan |
| Task decomposition | plan | Wave plan, task assignments |
| Code production | execute | Source files, tests, commits |
| Bug investigation | debug | Root cause analysis, fix plan |
| Document update | docs | Updated documentation |

**Level 4 Output Format:**
```
{
  phase: "execute",
  wave_plan: {
    wave_0: { tasks: ["foundation"], mode: "sequential" },
    wave_1: { tasks: ["track-a", "track-b", "track-c"], mode: "parallel" },
    wave_2: { tasks: ["synthesis"], mode: "sequential" },
    wave_3: { tasks: ["publication", "verification"], mode: "sequential" }
  },
  chipset: {
    agnus: { model: "opus", role: "flight" },
    denise: { model: "sonnet", role: "craft", count: 3 },
    paula: { model: "haiku", role: "log" }
  }
}
```

---

## 4. Level 3: GSD Assembly Language

Level 3 is the GSD Assembly language -- the mnemonic representation of orchestrator instructions. This is the level where human-readable intent meets machine-executable operations [1].

**Core Instruction Set:**

| Mnemonic | Operands | Description |
|----------|----------|-------------|
| LOAD | register, source | Load a resource (skill, adapter, config) into register |
| STORE | register, destination | Store register contents to persistent storage |
| EXEC | register, phase | Execute the phase specified by register contents |
| ROUTE | bus, target | Route a signal to a bus target (GPU, network, filesystem) |
| GATE | condition, handler | Conditional branch -- if condition, invoke handler |
| WAIT | signal | Block until signal received on bus |
| EMIT | signal, data | Emit a signal on the bus with payload |
| SWAP | adapter_from, adapter_to | Hot-swap LoRA adapter in VRAM |
| SYNC | source | Synchronize state with external source (DoltHub, Git) |
| HALT | reason | Suspend execution with reason code |

**Example Program (skill loading and execution):**
```
; Load react-patterns skill and execute against current project
LOAD    SK, #react-patterns       ; SK register = skill file
GATE    SK.valid?, :error         ; check skill loaded correctly
LOAD    BG, #token-budget         ; BG register = remaining budget
GATE    BG > 10000, :budget-low   ; ensure sufficient budget
EXEC    PC, #execute-phase        ; begin execution phase
ROUTE   GPU, #frontend-adapter    ; route to GPU with frontend LoRA
WAIT    COMPLETE                  ; block until execution completes
EMIT    TELEMETRY, PC.result      ; emit results to dashboard
STORE   R0, #output               ; store output to filesystem
HALT    DONE                      ; clean halt
```

---

## 5. The Bridge: Level 3 to Level 2

The bridge between Level 3 (Assembly) and Level 2 (Machine Language) is the assembler. It translates mnemonic instructions into binary-encoded operations that the bus protocol can execute [1].

```
THE ASSEMBLER BRIDGE
================================================================

  Level 3 (Assembly):
    LOAD SK, #react-patterns
    EXEC PC, #execute-phase
    ROUTE GPU, #frontend-adapter

         | ASSEMBLER |
         v           v

  Level 2 (Machine Language):
    0x2A01 0x0010 0x00F3    ; LOAD(0x2A) SK(0x01) react-patterns(0x00F3)
    0x4003 0x0020 0x0001    ; EXEC(0x40) PC(0x03) execute-phase(0x0001)
    0x6005 0x0040 0x0012    ; ROUTE(0x60) GPU(0x05) frontend-adapter(0x0012)
```

The assembler maintains a symbol table mapping human-readable names to addresses. Skill names, phase IDs, and adapter IDs are all resolved at assembly time, producing fixed addresses in the machine language output.

---

## 6. Level 2: GSD Machine Language

Level 2 is the binary encoding of GSD instructions. Each instruction is a fixed-width 48-bit word (6 bytes) [1]:

**Instruction Format:**
```
INSTRUCTION ENCODING (48-bit word)
================================================================

  Bits 47-40:  Opcode       (8 bits, 256 possible instructions)
  Bits 39-36:  Destination  (4 bits, 16 registers)
  Bits 35-32:  Source       (4 bits, 16 registers)
  Bits 31-16:  Operand A    (16 bits, immediate value or address)
  Bits 15-0:   Operand B    (16 bits, immediate value or address)
```

**Opcode Table (partial):**

| Opcode | Mnemonic | Format |
|--------|----------|--------|
| 0x2A | LOAD | LOAD dst, src |
| 0x2B | STORE | STORE src, dst |
| 0x40 | EXEC | EXEC reg, phase |
| 0x60 | ROUTE | ROUTE bus, target |
| 0x70 | GATE | GATE cond, handler |
| 0x80 | WAIT | WAIT signal |
| 0x81 | EMIT | EMIT signal, data |
| 0x90 | SWAP | SWAP from, to |
| 0xA0 | SYNC | SYNC source |
| 0xFF | HALT | HALT reason |

---

## 7. Level 1: Bus Protocol

Level 1 is the physical execution layer -- the bus protocol that translates machine language operations into actual system operations (filesystem reads, GPU commands, network requests) [1].

**Bus Operations:**

| Machine Op | Bus Operation | Physical Action |
|-----------|--------------|-----------------|
| LOAD (skill) | Filesystem read | Read `.claude/skills/*.md`, parse YAML frontmatter |
| LOAD (adapter) | VRAM transfer | Load LoRA weights from RAM to GPU VRAM |
| STORE (output) | Filesystem write | Write result to project directory |
| EXEC (phase) | Process spawn | Start Claude session via tmux, inject phase context |
| ROUTE (GPU) | CUDA kernel | Invoke inference with specified adapter |
| ROUTE (network) | HTTP request | API call to cloud provider |
| GATE (condition) | Register compare | Compare register values, branch accordingly |
| WAIT (signal) | GPIO poll | Poll GPIO interrupt bus for specified signal |
| EMIT (signal) | GPIO assert | Assert signal on GPIO bus with payload |
| SWAP (adapter) | VRAM management | Evict cold adapter, load hot adapter |

---

## 8. Register Mapping Across Architectures

GSD's register file maps to real hardware ISAs. This mapping enables the same GSD program to be conceptualized in terms of any familiar architecture [1]:

| GSD Register | Purpose | ARM A64 | RISC-V | x86-64 | 68000 |
|-------------|---------|---------|--------|--------|-------|
| R0-R7 | General purpose | X0-X7 | x10-x17 | RAX-R15 | D0-D7 |
| SK (skill) | Current skill | X8 (IP) | x8 (s0) | RBX | A0 |
| BG (budget) | Token budget | X9 | x9 (s1) | RCX | A1 |
| PC | Program counter | PC | pc | RIP | PC |
| SP | Stack pointer | SP | sp (x2) | RSP | SP (A7) |
| FL (flags) | Status flags | NZCV | (no flags) | RFLAGS | SR |
| IO | I/O register | MMIO | MMIO | I/O ports | Custom |
| GPU | GPU target | - | - | - | - |
| NET | Network target | - | - | - | - |
| CTX | Context register | - | - | - | - |

The register mapping is not coincidental -- it reflects the universal pattern of ISA design. Every architecture needs general-purpose registers, a program counter, a stack pointer, and status flags. GSD adds domain-specific registers (SK for skill, BG for budget, CTX for context) that have no hardware equivalent because they represent AI-specific state [1].

---

## 9. Instruction Encoding Format

The complete encoding format with addressing modes:

| Mode | Syntax | Encoding | Description |
|------|--------|----------|-------------|
| Immediate | `#value` | Operand = literal value | Load a constant |
| Register | `Rn` | Operand = register ID | Use register contents |
| Direct | `@address` | Operand = memory address | Read from filesystem path |
| Indirect | `[Rn]` | Operand = register holding address | Read from path in register |
| Indexed | `[Rn + offset]` | Operand = register + displacement | Read from path with offset |

**Addressing Mode Examples:**
```
LOAD SK, #react-patterns       ; Immediate: load literal skill name
LOAD SK, R0                    ; Register: load skill named by R0
LOAD SK, @/skills/react.md     ; Direct: load from filesystem path
LOAD SK, [R1]                  ; Indirect: load from path in R1
LOAD SK, [R1 + 0x10]          ; Indexed: load from path + offset
```

---

## 10. FPGA Synthesis Pipeline

The FPGA synthesis pipeline converts natural language intent into a compiled chipset configuration. Six stages, each with defined input/output contracts [1]:

| Step | Stage | Input | Output |
|------|-------|-------|--------|
| 1 | ELABORATION | Natural language intent | Parsed intent; identified functional blocks; CLB pattern matches |
| 2 | SYNTHESIS | Parsed intent + skill registry | Skill LUT selection; agent CLB instances; routing equations |
| 3 | TECHNOLOGY MAPPING | Skill list + available models | Available model-skill assignments; registry vs. cloud routing; constraint targets |
| 4 | PLACE AND ROUTE | Agent assignments + constraints | Agent slot assignments; bus routing table; timing verification |
| 5 | BITSTREAM GENERATION | Routing table + assignments | chipset.yaml; chipset.lock; bus routing tables; simulation config |
| 6 | SIMULATION | chipset.yaml + mock workload | Dry-run results; routing verification; budget utilization estimate; timing report |

```
FPGA SYNTHESIS PIPELINE
================================================================

  "Build me a React dashboard" (natural language)
       |
  [1. ELABORATION]
       | Parsed: {domain: react, type: build, scope: dashboard}
       v
  [2. SYNTHESIS]
       | Skills: react-patterns, websocket-integration
       | Agents: 1 flight + 3 craft + 1 log
       v
  [3. TECHNOLOGY MAPPING]
       | Opus -> flight, Sonnet -> craft, Haiku -> log
       | GPU: frontend-adapter (local) or cloud fallback
       v
  [4. PLACE AND ROUTE]
       | Wave 0: foundation (sequential)
       | Wave 1: 3 parallel tracks
       | Wave 2: synthesis (sequential)
       v
  [5. BITSTREAM]
       | chipset.yaml generated
       | chipset.lock frozen
       | Bus routing tables computed
       v
  [6. SIMULATION]
       | Dry-run: routing verified
       | Budget: ~45K tokens estimated
       | Timing: ~2 hours wall clock
       v
  DEPLOY (or adjust and re-synthesize)
```

The pipeline maps directly to real FPGA synthesis (Xilinx Vivado, Intel Quartus) where the same six stages convert HDL to bitstream [5]. The analogy is structural, not metaphorical -- each stage performs the same category of work.

---

## 11. Copper List Execution Model

The copper list is the execution primitive -- a sequence of instructions that runs autonomously once composed. The name comes from the Amiga Copper, a coprocessor that executed instruction lists synchronized to the video beam [2].

**Copper List Properties:**
- **Autonomous execution:** Once composed, the copper list runs without CPU intervention
- **Position-triggered:** Instructions execute at specific positions (beam position on Amiga, phase boundary in GSD)
- **Cheap to compose:** Writing a copper list costs much less than executing its contents
- **Reusable:** The same copper list can execute multiple times without recomposition

**GSD Copper List Example:**
```
; Copper list for Wave 1, Track A
; Triggers: wave_1_start
; Runs: autonomously until wave_1_complete

COPPER_START wave_1_track_a
  LOAD    SK, #yegge-analysis        ; Load domain skill
  EXEC    PC, #research-phase        ; Execute research
  WAIT    COMPLETE                   ; Wait for completion
  GATE    PC.quality > 0.8, :pass    ; Quality gate
  EMIT    TELEMETRY, PC.result       ; Report to dashboard
  STORE   R0, #module-1-output       ; Persist output
COPPER_END

; The CPU (Claude) composes this list in seconds.
; The coprocessor (agent) executes it in hours.
; The intelligence is in the composition.
```

The copper list model explains why planning is the hard part and execution is (relatively) easy. The CPU's job is to compose good lists. The coprocessor's job is to execute them faithfully. When the list is well-composed, execution is deterministic. When the list is poorly composed, no amount of coprocessor power can compensate [2].

> **ALIGNED:** The copper list principle -- "the intelligence is in the composition" -- is the same principle that makes GSD wave plans effective. The plan is the copper list. The agents are the copper processor.

---

## 12. ISA Alignment Verification

The ISA is aligned when every level of the stack correctly translates to every adjacent level. Verification matrix:

| Interface | Upward Translation | Downward Translation | Verified |
|-----------|-------------------|---------------------|----------|
| L5 -> L4 | Intent to workflow phase | N/A (top of stack) | Section 2-3 |
| L4 -> L3 | Workflow to assembly instructions | Assembly to workflow status | Section 3-4 |
| L3 -> L2 | Assembly to machine code | Machine code disassembly | Section 5-6 |
| L2 -> L1 | Machine code to bus operations | Bus results to registers | Section 6-7 |

**Alignment Gaps:**

1. **L5->L4 confidence propagation:** When Level 5 intent classification has low confidence, Level 4 should generate more conservative wave plans (fewer parallel tracks, more HITL gates). This propagation rule is not yet formally specified.

2. **L1 error recovery:** When a Level 1 bus operation fails (filesystem error, CUDA OOM), the error must propagate upward through all levels. The current ISA defines HALT but not graduated error signals.

3. **Cross-level optimization:** An optimizer that can see multiple levels simultaneously could eliminate redundant operations (e.g., a LOAD followed by an immediate STORE to the same address). No such optimizer is defined.

**Proposed Error Signal Set:**
```
ERROR SIGNAL ENCODING
================================================================

  0x00: NO_ERROR            Clean execution
  0x01: RECOVERABLE_WARN    Level 1 operation succeeded with warnings
  0x02: RECOVERABLE_FAIL    Level 1 operation failed, retry possible
  0x03: UNRECOVERABLE       Level 1 operation failed, no retry
  0x04: BUDGET_EXCEEDED     Token budget exhausted
  0x05: CONTEXT_OVERFLOW    Context window exceeded
  0x06: ADAPTER_FAIL        LoRA adapter load/swap failed
  0x07: SAFETY_HALT         Safety boundary violated
  0xFF: SYSTEM_HALT         Unrecoverable system error
```

---

## 13. The ISA as Alignment Tool

The ISA is itself an alignment tool. By specifying the exact translation between every level of the stack, it makes misalignment *detectable*. If a Level 4 workflow produces a Level 3 instruction sequence that cannot be assembled into valid Level 2 machine code, the assembler catches the misalignment at synthesis time, not at runtime.

This is the same principle that makes type systems valuable in programming languages: errors caught at compile time are cheaper than errors caught at runtime. The ISA is a type system for orchestration intent.

```
ALIGNMENT DETECTION THROUGH ISA
================================================================

  Level 5: "Deploy this to production"
  Level 4: GSD workflow selects execute-phase
  Level 3: EXEC PC, #execute-phase
            ROUTE NET, #production-server    <-- ALIGNMENT CHECK
            GATE SAFETY.approved?, :halt     <-- Safety gate
  Level 2: Assembler validates all instructions
            ROUTE NET requires SAFETY.approved = true
            --> If not approved, assembler refuses to emit L2 code
            --> Misalignment caught at synthesis, not deployment
```

> **Related:** [Intent Router](05-intent-to-adapter-routing.md), [Wire Harness](03-control-surface-wire-harness.md)

---

## 14. Cross-References

- **Module 1 (Yegge Ecosystem):** Ecosystem state informs ISA design (Gas Town roles as register targets)
- **Module 2 (Gas City Bridge):** chipset.yaml produced by FPGA synthesis pipeline
- **Module 3 (Wire Harness):** Bus signal types implement Level 1 of this ISA stack
- **Module 5 (Intent Router):** Intent classification feeds Level 5 of this stack
- **Module 6 (GPU Silicon):** GPU execution implements Level 1 ROUTE operations
- **K8S:** Container orchestration ISA patterns
- **MGU:** Mathematical foundations of register mapping and encoding theory
- **ACE:** Agent execution patterns that implement copper list operations
- **COK:** Convergence analysis for pipeline stage verification

---

## 15. Sources

1. GSD Project Knowledge: gsd-instruction-set-architecture-vision.md. Five-layer stack, register assignments, encoding format.
2. Amiga Hardware Reference Manual, 3rd Edition. Addison-Wesley, 1991. Copper coprocessor architecture, instruction list format.
3. GSD Project Knowledge: gsd-chipset-architecture-vision.md. FPGA synthesis pipeline, chipset.yaml specification.
4. ARM Architecture Reference Manual (ARMv8-A). Register mapping, addressing modes.
5. Xilinx Vivado Design Suite User Guide (UG910). FPGA synthesis pipeline stages.
6. RISC-V Unprivileged ISA Specification, v20191213. Register conventions, instruction encoding.
7. Intel 64 and IA-32 Architectures Software Developer's Manual. x86-64 register set, addressing modes.
8. Motorola MC68000 Family Programmer's Reference Manual. 68000 register set, addressing modes.
9. GSD Project Knowledge: gsd-silicon-layer-spec.md. GPU execution layer interface.
10. GSD Project Knowledge: gsd-os-desktop-vision.md. Blueprint Editor integration with ISA.
11. Patterson, David A. and Hennessy, John L. *Computer Organization and Design.* 6th ed., Morgan Kaufmann, 2020. ISA design principles.
12. Intel Quartus Prime User Guide: Design Compilation. FPGA synthesis stages (analogy validation).
13. Chisel/FIRRTL documentation: agile hardware design, HDL to RTL compilation.
14. GSD Project Knowledge: skill-creator-wasteland-integration-analysis.md. ISA requirements from Wasteland protocol.
15. MIPS R4000 Architecture Manual. Pipeline stage design patterns (historical reference).
16. CUDA Toolkit Documentation: kernel launch, device memory management (Level 1 GPU operations).
