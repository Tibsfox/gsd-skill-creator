# Assembly Language: Concepts and Microarchitecture

A dense technical reference covering the foundational concepts that every assembly
language programmer must understand -- from the stored-program model through modern
microarchitectural attacks and mitigations.

---

## 1. The Stored-Program Concept

### Von Neumann Architecture (1945)

John von Neumann's 1945 "First Draft of a Report on the EDVAC" described the
architecture that dominates computing to this day: **instructions and data reside
in the same memory**. Before this, machines like ENIAC were programmed by physically
rewiring patch cables. The stored-program concept meant that a program was just
another sequence of bytes in memory -- modifiable, copyable, and loadable like any
other data.

The von Neumann architecture has five components:

- **Memory** -- stores both instructions and data as binary words
- **Control Unit (CU)** -- fetches instructions from memory, decodes them, sequences execution
- **Arithmetic Logic Unit (ALU)** -- performs computation (add, subtract, AND, OR, shift)
- **Input** -- receives data from the outside world
- **Output** -- sends results to the outside world

The CU and ALU together form the **Central Processing Unit (CPU)**. The memory is
addressed linearly. The **Program Counter (PC)** -- called `RIP` on x86-64, `PC` on
ARM -- holds the address of the next instruction to fetch.

The von Neumann bottleneck: because instructions and data share the same memory bus,
the CPU cannot fetch an instruction and read/write data simultaneously. This single
bus becomes a throughput bottleneck. Every modern high-performance CPU works around
this with split caches (see below).

### Harvard Architecture

The Harvard architecture uses **physically separate memories and buses** for
instructions and data. The original Harvard Mark I (1944) had this design. Today,
Harvard architecture appears in:

- **Microcontrollers** -- AVR (Arduino), PIC, many DSPs store program in flash and
  data in SRAM, with separate address spaces
- **Cache architecture in modern x86/ARM** -- the L1 cache is split into L1I
  (instruction) and L1D (data), creating a "Modified Harvard" architecture at the
  cache level while maintaining a unified address space at the main memory level

This split eliminates the von Neumann bottleneck at the cache level: the CPU can
fetch instructions from L1I and load/store data from L1D simultaneously.

### The Fetch-Decode-Execute Cycle

Every CPU, regardless of architecture, executes this fundamental loop:

1. **Fetch** -- Read the instruction at the address in the program counter from memory.
   Increment the PC to point to the next instruction.
2. **Decode** -- Determine what operation the instruction specifies. Identify source
   and destination operands. For variable-length ISAs (x86), determine the instruction
   length.
3. **Execute** -- Perform the operation: arithmetic, logic, memory access, branch, etc.
   Write results to the destination (register or memory). If the instruction is a
   taken branch, update the PC to the branch target.

In a simple unpipelined CPU, each instruction completes all three phases before the
next begins. Modern CPUs overlap these phases across multiple instructions
(pipelining) and execute multiple instructions per cycle (superscalar).

---

## 2. Machine Code vs. Assembly

### Machine Code

Machine code is the raw binary encoding that the CPU executes directly. Each
instruction is a sequence of bytes whose bit fields encode the operation, operands,
addressing mode, and other parameters.

Example -- x86-64 machine code for `add rax, rbx`:

```
48 01 D8
```

- `48` -- REX prefix (REX.W = 1, indicating 64-bit operand size)
- `01` -- opcode for ADD r/m64, r64
- `D8` -- ModR/M byte (mod=11 reg=011 r/m=000 => reg RBX, r/m RAX)

Machine code is what the processor sees. It is architecture-specific, dense, and
essentially unreadable by humans.

### Assembly Language

Assembly language provides **human-readable mnemonics** that map (almost) 1:1 to
machine code instructions:

```asm
add     rax, rbx        ; RAX = RAX + RBX
mov     rcx, [rdi+8]    ; load 8 bytes from address RDI+8 into RCX
jnz     .loop           ; jump to .loop if Zero Flag is not set
```

Key elements of assembly language:

- **Mnemonics** -- `add`, `mov`, `jnz`, `call`, `ret`, `push`, `pop`
- **Operands** -- registers (`rax`), immediates (`42`), memory references (`[rdi+8]`)
- **Labels** -- symbolic names for addresses (`.loop`, `main`, `_start`)
- **Directives** -- instructions to the assembler, not the CPU (`.section`, `.global`,
  `.byte`, `.align`)
- **Comments** -- `;` in Intel syntax, `//` or `/* */` in some ARM assemblers

### The Assembler

The **assembler** (NASM, GAS, MASM, LLVM's integrated assembler) translates assembly
source into machine code object files. The process involves:

1. **Lexing and parsing** -- tokenize mnemonics, operands, labels
2. **Symbol resolution** -- assign addresses to labels (may require two passes for
   forward references)
3. **Instruction encoding** -- select the correct opcode and encoding for each
   mnemonic + operand combination
4. **Relocation entries** -- emit metadata so the linker can fix up addresses that
   depend on final layout

### Labels, Macros, and Pseudo-Instructions

**Labels** are symbolic names that resolve to memory addresses during assembly:

```asm
_start:                 ; label at the program entry point
    mov     rdi, msg    ; msg is a label in .data section
    call    print
    jmp     _start      ; backward reference
```

**Macros** are assembler-level text substitutions that generate multiple instructions:

```asm
%macro push_callee_saved 0
    push    rbx
    push    rbp
    push    r12
    push    r13
    push    r14
    push    r15
%endmacro
```

**Pseudo-instructions** are assembler conveniences that expand to one or more real
instructions. ARM examples: `LDR X0, =0xDEADBEEF` (loads a constant that may not fit
in a single immediate field -- the assembler places it in a literal pool and generates
a PC-relative load). RISC-V: `li a0, 0x12345678` expands to `lui` + `addi`.

---

## 3. Instruction Set Architecture (ISA)

### The Contract

The ISA is the **contract between hardware and software**. It defines what a
correct implementation must do, without specifying how. Two CPUs implementing the
same ISA (e.g., an Intel Core i9 and an AMD Ryzen 9 both implementing x86-64) must
produce identical results for the same instruction stream, even though their internal
microarchitectures differ radically.

### What the Programmer Sees

| Component | Description |
|---|---|
| **Registers** | Named storage locations inside the CPU. x86-64: 16 GPRs (RAX-R15), RIP, RFLAGS, 16 XMM/YMM/ZMM. ARM64: 31 GPRs (X0-X30), SP, PC, NZCV. RISC-V: 32 GPRs (x0-x31), PC. |
| **Instructions** | The operations available: arithmetic, logic, data movement, control flow, system. CISC (x86) has 1000+ instructions. RISC (ARM, RISC-V) has a smaller base set (~200-300). |
| **Addressing modes** | How operands specify their locations: register direct, immediate, base+offset, base+index*scale+offset (x86), PC-relative. |
| **Data types** | Byte (8), word (16), doubleword (32), quadword (64), scalar float, packed SIMD vectors. |
| **Memory model** | Byte-addressable, little-endian (x86), alignment requirements, memory ordering guarantees (TSO for x86, weakly ordered for ARM). |
| **Privilege levels** | Ring 0-3 (x86), EL0-EL3 (ARM64), M/S/U modes (RISC-V). Controls access to system resources. |

### What the Programmer Does NOT See

The ISA deliberately hides implementation details:

- Pipeline depth and structure
- Cache sizes, associativity, and replacement policies
- Out-of-order execution engine internals
- Branch predictor design
- Prefetcher heuristics
- Execution port assignments
- Physical register file size

This separation allows hardware designers to improve performance generation over
generation without breaking existing software.

### x86-64 General-Purpose Register Map

```
 63                              31              15       7      0
+---------------------------------------------------------------+
|                             RAX                                | Accumulator
+-------------------------------+-------------------------------+
                                |             EAX               |
                                +---------------+---------------+
                                                |      AX       |
                                                +-------+-------+
                                                | AH    | AL    |
+---------------------------------------------------------------+
|                             RBX                                | Base
+---------------------------------------------------------------+
|                             RCX                                | Counter
+---------------------------------------------------------------+
|                             RDX                                | Data
+---------------------------------------------------------------+
|                             RSI                                | Source Index
+---------------------------------------------------------------+
|                             RDI                                | Destination Index
+---------------------------------------------------------------+
|                             RBP                                | Base Pointer
+---------------------------------------------------------------+
|                             RSP                                | Stack Pointer
+---------------------------------------------------------------+
|                             R8                                 | General Purpose
+---------------------------------------------------------------+
|                             R9                                 | General Purpose
+---------------------------------------------------------------+
|                             R10                                | General Purpose
+---------------------------------------------------------------+
|                             R11                                | General Purpose
+---------------------------------------------------------------+
|                             R12                                | General Purpose
+---------------------------------------------------------------+
|                             R13                                | General Purpose
+---------------------------------------------------------------+
|                             R14                                | General Purpose
+---------------------------------------------------------------+
|                             R15                                | General Purpose
+---------------------------------------------------------------+
|                             RIP                                | Instruction Pointer
+---------------------------------------------------------------+
|                            RFLAGS                              | Flags Register
+---------------------------------------------------------------+
```

Special-purpose registers: `CS`, `DS`, `SS`, `ES`, `FS`, `GS` (segment registers --
`FS` and `GS` are used for TLS in modern OSes). `CR0`-`CR4` (control registers,
ring 0 only). `MSR`s (Model-Specific Registers, accessed via `rdmsr`/`wrmsr`).

---

## 4. The CPU Pipeline

### Classic 5-Stage Pipeline

```
Cycle:     1    2    3    4    5    6    7    8    9
         +----+----+----+----+----+
Instr 1: | IF | ID | EX | MA | WB |
         +----+----+----+----+----+
              +----+----+----+----+----+
Instr 2:      | IF | ID | EX | MA | WB |
              +----+----+----+----+----+
                   +----+----+----+----+----+
Instr 3:           | IF | ID | EX | MA | WB |
                   +----+----+----+----+----+
                        +----+----+----+----+----+
Instr 4:                | IF | ID | EX | MA | WB |
                        +----+----+----+----+----+
                             +----+----+----+----+----+
Instr 5:                     | IF | ID | EX | MA | WB |
                             +----+----+----+----+----+

IF = Instruction Fetch    ID = Instruction Decode    EX = Execute
MA = Memory Access        WB = Write Back
```

**Stage descriptions:**

1. **IF (Instruction Fetch)** -- Read the instruction from the I-cache at the address
   in the PC. Increment the PC (or redirect it if a branch was predicted taken).
2. **ID (Instruction Decode)** -- Decode the instruction, read source registers from
   the register file, sign-extend immediates, determine the operation.
3. **EX (Execute)** -- Perform the ALU operation, compute effective addresses for
   loads/stores, evaluate branch conditions.
4. **MA (Memory Access)** -- For loads: read from D-cache. For stores: write to
   D-cache. Other instructions pass through this stage as a no-op.
5. **WB (Write Back)** -- Write the result to the destination register in the
   register file.

### Why Pipelining Works

Without pipelining, each instruction takes 5 cycles. With a 5-stage pipeline,
throughput reaches 1 instruction per cycle (IPC = 1) in the ideal case -- a 5x
improvement. The **latency** of each instruction is still 5 cycles, but
**throughput** increases because stages overlap.

### Pipeline Hazards

Hazards are situations that prevent the next instruction from executing in the next
cycle.

**Data Hazards** arise from dependencies between instructions:

- **RAW (Read After Write)** -- True dependency. Instruction B reads a register that
  instruction A writes. B must wait for A's result.
  ```asm
  add  rax, rbx    ; writes RAX in WB (cycle 5)
  sub  rcx, rax    ; reads RAX in ID (cycle 3) -- but RAX isn't written yet!
  ```
- **WAR (Write After Read)** -- Anti-dependency. Instruction B writes a register that
  instruction A reads. In an in-order pipeline this is not a hazard (A reads before B
  writes), but it matters in out-of-order execution.
- **WAW (Write After Write)** -- Output dependency. Two instructions write the same
  register. The second write must happen after the first.

**Control Hazards** arise from branches:

```asm
cmp     rax, 0
jz      .skip       ; Is this taken or not? We won't know until EX stage
add     rbx, 1      ; Already fetched -- but should we execute it?
.skip:
```

The branch condition is resolved in the EX stage, but we've already fetched/decoded
the next instruction. If the branch is taken, those instructions must be flushed.

**Structural Hazards** arise when two instructions need the same hardware resource in
the same cycle (e.g., a single-ported memory that can't serve both a fetch and a
data access simultaneously).

### Solutions

- **Forwarding (Bypassing)** -- The result of the EX stage is forwarded directly to
  the EX input of the next instruction, bypassing the WB stage. This eliminates most
  RAW hazards for ALU instructions.
- **Stalling (Pipeline Bubble)** -- Insert a no-op cycle when forwarding can't resolve
  a hazard (e.g., a load followed immediately by a use of the loaded value -- the
  "load-use hazard").
- **Branch Prediction** -- Guess the outcome of branches before they're resolved. If
  the guess is correct, no penalty. If wrong, flush the pipeline and restart from the
  correct path. (See Section 6.)

---

## 5. Superscalar and Out-of-Order Execution

### Multiple Execution Units

Modern CPUs have multiple execution units (also called functional units or execution
ports):

- **Integer ALUs** (addition, subtraction, bitwise logic, shifts)
- **Integer multiplier/divider**
- **FPU / SIMD units** (floating-point, SSE, AVX, NEON)
- **Load units** (read from cache)
- **Store address + store data units** (write to cache)
- **Branch unit** (evaluate and resolve branches)

A **superscalar** CPU issues multiple instructions per clock cycle to these units in
parallel. Intel's Golden Cove (Alder Lake P-core) can dispatch up to 6 micro-ops per
cycle across 12 execution ports. AMD's Zen 4 dispatches up to 6 per cycle across 13
ports.

### Tomasulo's Algorithm (1967)

Robert Tomasulo invented this algorithm for the IBM System/360 Model 91 to enable
out-of-order execution. The key innovations:

1. **Reservation Stations** -- Each execution unit has a small buffer (reservation
   station) that holds instructions waiting for their operands. When an operand is
   produced, it is broadcast on a **Common Data Bus (CDB)** and captured by all
   reservation stations waiting for it.
2. **Register Renaming** -- Eliminates WAR and WAW hazards by mapping **architectural
   registers** (the 16 GPRs the programmer sees) to a larger set of **physical
   registers** (288 in Golden Cove, 224 in Zen 4). Two instructions writing RAX can
   write to different physical registers, removing the output dependency.

### The Modern Out-of-Order Engine

```
 +-------------------+    +------------------+    +-------------------+
 |   Front End       | => | Out-of-Order     | => |   Back End        |
 |   (In-Order)      |    | Execution Core   |    |   (In-Order)      |
 +-------------------+    +------------------+    +-------------------+
 | Fetch             |    | Rename/Allocate  |    | Retire / Commit   |
 | Predecode         |    | Reservation Stn  |    | Reorder Buffer    |
 | Decode            |    | Execution Units  |    | Store Buffer      |
 | Micro-op Queue    |    | Result Broadcast |    | Write Combine     |
 +-------------------+    +------------------+    +-------------------+
```

**In-order front end:**
- Fetch instruction bytes from the I-cache
- Decode x86 instructions into fixed-width **micro-ops (uops)**. Complex CISC
  instructions may produce multiple uops (e.g., `push rbx` decodes to a store + RSP
  decrement). Simple instructions are 1 uop.
- Feed decoded uops into the **micro-op queue** (also called the Instruction
  Decode Queue, IDQ)

**Out-of-order core:**
- **Rename/Allocate** -- Map architectural registers to physical registers. Allocate
  entries in the **Reorder Buffer (ROB)**. The ROB tracks every in-flight instruction
  in program order, even though they execute out of order.
- **Dispatch to Reservation Stations** -- Each uop waits in a reservation station
  until all its source operands are ready.
- **Issue and Execute** -- When operands are ready, the uop issues to an execution
  unit. Results are written to physical registers and broadcast to dependent uops.

**In-order retirement:**
- The ROB retires (commits) instructions **in program order**. This ensures that
  exceptions, interrupts, and branch mispredictions can be handled precisely:
  discard everything after the faulting/mispredicted instruction, because it hasn't
  been committed yet.
- Store Buffer entries are committed to the cache upon retirement.

### Speculative Execution

The CPU **speculatively** executes instructions beyond unresolved branches, assuming
the branch predictor is correct. If correct: the speculated instructions retire
normally. If wrong: all speculated results are discarded (squashed), and the pipeline
restarts from the correct path.

This speculation is essential for performance but, as discovered in 2018, creates
security vulnerabilities (see Section 12).

---

## 6. Branch Prediction

### Why It Matters

A modern x86 CPU has a pipeline depth of 15-25 stages. A branch misprediction
flushes the entire pipeline, wasting 15-20 cycles of work. Given that roughly 1 in 5
instructions is a branch, even small improvements in prediction accuracy yield large
performance gains.

### Static Prediction

Simple heuristics used when no dynamic history is available:

- **Backward branches predicted taken** -- loops typically iterate multiple times
- **Forward branches predicted not-taken** -- error handling and early-exit paths are
  uncommon
- **BTFNT (Backward Taken, Forward Not-Taken)** -- a common static scheme

### Dynamic Prediction

**BHT (Branch History Table)** -- A table indexed by the lower bits of the branch
address. Each entry is a 2-bit saturating counter:

```
    00: Strongly Not Taken
    01: Weakly Not Taken
    10: Weakly Taken
    11: Strongly Taken
```

A branch must mispredict twice in a row to reverse its prediction. This handles
loop branches well (they're consistently taken until the final iteration).

**BTB (Branch Target Buffer)** -- A cache that maps branch addresses to their target
addresses. When a branch is predicted taken, the BTB supplies the target address so
the fetch unit can redirect immediately, without waiting for decode.

### Two-Level Adaptive Predictors

Correlate branch outcomes with the **history of recent branches**:

- **Global History Register (GHR)** -- a shift register recording the taken/not-taken
  outcome of the last N branches (N = 12-64 bits)
- **Pattern History Table (PHT)** -- indexed by XOR of GHR and branch address, each
  entry is a 2-bit counter

This captures patterns like "if A is taken, B is usually not taken."

### TAGE (TAgged GEometric History Length)

The state-of-the-art predictor used in modern Intel and AMD CPUs. TAGE uses
**multiple tables**, each indexed by a different history length that grows
geometrically (e.g., 5, 10, 20, 40, 80, 160 branches of history). Each table entry
is **tagged** so collisions can be detected. The prediction comes from the table with
the longest matching history.

TAGE achieves **97-99% accuracy** on typical workloads.

### Misprediction Cost

```
Pipeline flush on misprediction:
  Golden Cove (Intel):    ~15-17 cycles
  Zen 4 (AMD):            ~13-15 cycles
  Firestorm (Apple M1):   ~14 cycles
  Cortex-X3 (ARM):        ~11-13 cycles
```

At 5 GHz, a 15-cycle misprediction penalty wastes 3 nanoseconds -- time that could
have retired ~90 uops. This is why branchless code (CMOV, conditional select,
predication) is sometimes faster despite doing more work.

---

## 7. Memory Hierarchy

### The Hierarchy

```
                        +------------------+
                        |    Registers     |  ~0 cycles, ~1 KB
                        +--------+---------+
                                 |
                        +--------v---------+
                        |    L1 Cache      |  ~4-5 cycles, 32-80 KB
                        |  (split I+D)     |
                        +--------+---------+
                                 |
                        +--------v---------+
                        |    L2 Cache      |  ~12-14 cycles, 256 KB - 2 MB
                        |   (unified)      |
                        +--------+---------+
                                 |
                        +--------v---------+
                        |    L3 Cache      |  ~30-50 cycles, 4 - 128 MB
                        |   (shared)       |
                        +--------+---------+
                                 |
                        +--------v---------+
                        |   Main Memory    |  ~100-200+ cycles, 4 - 512 GB
                        |    (DRAM)        |
                        +--------+---------+
                                 |
                        +--------v---------+
                        |   Storage        |  ~10K-10M cycles, TB-PB
                        |  (NVMe/SSD/HDD)  |
                        +------------------+
```

### Cache Hierarchy Latency Table

| Level | Typical Size | Latency (cycles) | Latency (ns @ 5 GHz) | Bandwidth |
|-------|-------------|-------------------|----------------------|-----------|
| L1D | 32-80 KB | 4-5 | ~1 ns | ~500 GB/s |
| L1I | 32-64 KB | 4-5 | ~1 ns | (fetch width) |
| L2 | 256 KB - 2 MB | 12-14 | ~2.5 ns | ~200 GB/s |
| L3 (slice) | 2-4 MB/core | 30-50 | ~8 ns | ~100 GB/s |
| L3 (full) | 8-128 MB | 35-55 | ~10 ns | (shared ring/mesh) |
| DRAM | 8-512 GB | 100-200+ | ~40-80 ns | ~50-80 GB/s |
| NVMe SSD | 1-8 TB | ~50,000 | ~10 us | ~7 GB/s |
| HDD | 1-20 TB | ~10,000,000 | ~5 ms | ~200 MB/s |

### Cache Lines

The unit of transfer between cache levels is the **cache line** -- 64 bytes on x86
and modern ARM. When the CPU requests a single byte from memory, the entire 64-byte
line containing that byte is fetched. This exploits **spatial locality**: nearby
addresses are likely to be accessed soon.

### Set-Associative Caches

A cache with `S` sets and `W` ways (W-way set-associative) has `S * W` cache lines
total. An address maps to exactly one set (determined by its middle bits), but can
occupy any of the W ways within that set.

- **Direct-mapped (W=1)** -- simple but high conflict miss rate
- **2-way, 4-way, 8-way** -- progressively fewer conflicts, more comparator hardware
- **Fully associative (W=total lines)** -- any line can go anywhere, expensive, used
  only for small structures (TLB)
- **L1 is typically 8-12 way**, L2 is 8-16 way, L3 is 12-16 way

### Cache Coherence: MESI Protocol

In multicore systems, each core has private L1/L2 caches. The **MESI protocol**
ensures all cores see a consistent view of memory:

- **Modified (M)** -- this cache has the only valid copy; it's been written and differs
  from main memory
- **Exclusive (E)** -- this cache has the only copy, but it matches main memory
- **Shared (S)** -- this cache has a copy; other caches may also have copies; all
  match memory
- **Invalid (I)** -- this cache line is not valid

When core A writes to a line that core B has in Shared state, A's line transitions
to Modified and B's line is invalidated. This invalidation traffic is the cost of
cache coherence and is why false sharing (two cores writing to different variables in
the same cache line) is devastating for performance.

### TLB (Translation Lookaside Buffer)

The TLB is a small, fully associative cache that stores recent virtual-to-physical
address translations. A TLB miss requires a **page table walk** -- traversing the
multi-level page table in memory, costing hundreds of cycles.

Typical TLB sizes:
- L1 DTLB: 64-96 entries (4 KB pages), 32 entries (2 MB pages)
- L1 ITLB: 64-256 entries
- L2 STLB (unified): 1,024-2,048 entries

---

## 8. Virtual Memory

### Page Tables

Virtual memory maps the **virtual address space** each process sees to **physical
addresses** in DRAM. The mapping unit is a **page** -- typically 4 KB.

A **page table** is a data structure in memory that holds the mapping. Modern CPUs use
**multi-level page tables** to avoid allocating entries for unmapped regions:

x86-64 uses a 4-level page table (5-level with LA57):

```
Virtual Address (48 bits used, 64-bit canonical form):
+--------+--------+--------+--------+--------+
| PML4   | PDPT   | PD     | PT     | Offset |
| 9 bits | 9 bits | 9 bits | 9 bits | 12 bits|
+--------+--------+--------+--------+--------+

CR3 -> PML4 Table -> PDPT Table -> PD Table -> PT Table -> Physical Page
```

Each level is a table of 512 entries (2^9), each entry 8 bytes. Page table entries
contain:

- Physical address of the next-level table (or the final physical page)
- Present bit, read/write permissions, user/supervisor, NX (No-Execute)
- Accessed and Dirty bits (used by the OS for page replacement)

### Page Sizes

| Page Size | Offset Bits | Levels Traversed | Use Case |
|-----------|------------|-------------------|----------|
| 4 KB | 12 | 4 | Default, general use |
| 2 MB (hugepage) | 21 | 3 | Databases, VMs, large allocations |
| 1 GB (gigapage) | 30 | 2 | Very large working sets, HPC |

Hugepages reduce TLB pressure: a single 2 MB TLB entry covers 512x the address range
of a 4 KB entry.

### Page Faults

A page fault occurs when the CPU accesses a virtual address that has no valid physical
mapping. The CPU raises an exception (vector 14 on x86), and the OS page fault
handler:

1. Determines the faulting address (from `CR2` on x86)
2. Checks if the access is valid (within a mapped VMA)
3. Allocates a physical page, updates the page table, and returns to the faulting
   instruction (which re-executes successfully)

Page faults also handle **demand paging** (loading pages from disk on first access),
**copy-on-write** (COW after `fork()`), and **memory-mapped files**.

### Address Space Layout

```
High addresses (0x7FFF_FFFF_FFFF on x86-64)
+------------------------------+
|        Kernel Space          |  (mapped but inaccessible from userspace)
+------------------------------+  0xFFFF_8000_0000_0000 (canonical high half)
|                              |
|     [unmapped gap]           |  (non-canonical addresses -- trap on access)
|                              |
+------------------------------+  0x0000_7FFF_FFFF_FFFF (canonical low half)
|        Stack                 |  grows DOWN (toward lower addresses)
|          |                   |
|          v                   |
|                              |
|          ^                   |
|          |                   |
|        Heap                  |  grows UP (via brk/mmap)
+------------------------------+
|        BSS                   |  uninitialized global/static data (zero-filled)
+------------------------------+
|        Data                  |  initialized global/static data
+------------------------------+
|        Text (Code)           |  read-only + execute, program instructions
+------------------------------+
Low addresses (0x0000_0000_0000)
```

### ASLR (Address Space Layout Randomization)

ASLR randomizes the base addresses of the stack, heap, libraries, and sometimes
the executable itself (PIE -- Position-Independent Executable). This makes return-
oriented programming (ROP) and other code-reuse attacks harder because the attacker
cannot predict where code and data are located.

On Linux, ASLR provides:
- 28 bits of entropy for the mmap base (shared libraries)
- 22 bits of entropy for the stack
- 16+ bits of entropy for the heap

---

## 9. Interrupts and Exceptions

### Taxonomy

**Interrupts** are asynchronous events from external hardware:

- **Timer interrupt** -- periodic tick from the APIC timer or HPET, drives the OS
  scheduler
- **I/O interrupts** -- disk controller, network card, USB, GPU signal completion
- **IPI (Inter-Processor Interrupt)** -- one core signals another (TLB shootdown,
  reschedule)

**Software interrupts** are synchronous, deliberately triggered by instructions:

- `int 0x80` (legacy Linux system call on x86-32)
- `syscall` / `sysret` (fast system call on x86-64)
- `svc` (Supervisor Call on ARM64, used for system calls)

**Exceptions** are synchronous events triggered by instruction execution:

- **Faults** -- recoverable, re-execute the faulting instruction after handling
  (page fault, #GP)
- **Traps** -- reported after the instruction completes (breakpoint `int 3`,
  debug trap)
- **Aborts** -- unrecoverable (machine check, double fault)

### x86 Interrupt Descriptor Table (IDT)

The IDT is an array of 256 gate descriptors, one per interrupt/exception vector:

| Vector | Name | Type |
|--------|------|------|
| 0 | #DE -- Divide Error | Fault |
| 1 | #DB -- Debug | Fault/Trap |
| 3 | #BP -- Breakpoint | Trap |
| 6 | #UD -- Invalid Opcode | Fault |
| 8 | #DF -- Double Fault | Abort |
| 13 | #GP -- General Protection | Fault |
| 14 | #PF -- Page Fault | Fault |
| 18 | #MC -- Machine Check | Abort |
| 32-255 | User-defined (IRQs, IPIs) | Interrupt |

Each gate descriptor contains: handler address (ISR entry point), code segment
selector, DPL (Descriptor Privilege Level), IST (Interrupt Stack Table) index.

### ARM Exception Levels

ARM64 uses four Exception Levels (EL0-EL3):

- **EL0** -- Application (user space)
- **EL1** -- OS Kernel (handles SVC, IRQ, page faults)
- **EL2** -- Hypervisor (handles HVC, manages VMs)
- **EL3** -- Secure Monitor (handles SMC, TrustZone transitions)

Exceptions cause a transition to a higher EL. Each EL has its own vector table
(VBAR_ELn register) with entries for Synchronous, IRQ, FIQ, and SError exceptions.

### Register State Save/Restore

When an interrupt or exception occurs, the CPU saves minimal state (on x86: RIP,
CS, RFLAGS, RSP, SS are pushed to the kernel stack). The interrupt handler must
save and restore any additional registers it uses. On return (`iretq` on x86,
`eret` on ARM), the saved state is restored and execution resumes.

---

## 10. Floating-Point

### IEEE 754

The IEEE 754 standard (1985, revised 2008, 2019) defines floating-point number
representation and arithmetic. Assembly programmers must understand the binary
format:

```
Single precision (32-bit / float):
+---+----------+-----------------------+
| S |  Exp (8) |   Mantissa (23)       |
+---+----------+-----------------------+
 31  30      23  22                    0

Double precision (64-bit / double):
+---+-------------+--------------------------------------------+
| S |  Exp (11)   |          Mantissa (52)                     |
+---+-------------+--------------------------------------------+
 63  62         52  51                                         0

Value = (-1)^S * 2^(Exp - Bias) * 1.Mantissa
Bias: 127 (single), 1023 (double)
```

Special values:

| Exponent | Mantissa | Meaning |
|----------|----------|---------|
| 0 | 0 | +/- Zero |
| 0 | non-zero | Denormal (subnormal) |
| all 1s | 0 | +/- Infinity |
| all 1s | non-zero | NaN (signaling or quiet) |

### x87 FPU (Legacy)

The x87 FPU uses a **stack-based** architecture with eight 80-bit extended-precision
registers (ST(0)-ST(7)). Instructions operate on the top of stack:

```asm
fld     qword [rdi]      ; push double from memory onto FP stack
fld     qword [rdi+8]    ; push another
fmulp                     ; ST(1) = ST(0) * ST(1), pop
fstp    qword [rsi]       ; pop result to memory
```

The x87 is legacy. Modern code uses SSE/AVX for both scalar and packed floating-point.

### SSE/AVX Floating-Point

SSE introduced 128-bit XMM registers (XMM0-XMM15). AVX extended them to 256-bit
YMM registers. AVX-512 extended to 512-bit ZMM registers.

Scalar operations use the low element of an XMM register:

```asm
movsd   xmm0, [rdi]          ; load double into low 64 bits of XMM0
mulsd   xmm0, [rdi+8]        ; multiply by another double
addsd   xmm0, xmm1           ; add scalar double from XMM1
```

Packed operations process multiple values simultaneously (SIMD):

```asm
vmovapd ymm0, [rdi]          ; load 4 doubles (256 bits)
vmulpd  ymm0, ymm0, [rsi]    ; multiply 4 doubles in parallel
vaddpd  ymm0, ymm0, ymm1     ; add 4 doubles in parallel
```

### Denormals, NaN, and Rounding

**Denormals** (subnormals) are very small numbers near zero. They have exponent = 0
and preserve gradual underflow. Processing denormals is 10-100x slower on most
microarchitectures because they take a microcode assist. The `MXCSR` register has
FTZ (Flush to Zero) and DAZ (Denormals Are Zero) bits that disable denormals for
performance at the cost of precision.

**NaN propagation**: any operation involving NaN produces NaN. `0.0 / 0.0 = NaN`.
`sqrt(-1.0) = NaN`. NaN != NaN (this is why `x != x` is a NaN check in C).

**Rounding modes** (set in MXCSR): Round to Nearest Even (default), Round toward +Inf,
Round toward -Inf, Round toward Zero. The rounding mode affects every FP operation.
Assembly programmers must be aware of the current rounding mode and that
`ldmxcsr`/`stmxcsr` control it.

### Why Floating-Point Is Hard in Assembly

- No implicit conversions -- you must use `cvtsi2sd`, `cvtsd2si`, `cvtss2sd`, etc.
- Comparing floats requires `ucomisd`/`ucomiss` (unordered compare, sets FLAGS
  differently than integer compare -- PF is set for NaN)
- ABI differences: x86-64 SysV passes FP args in XMM0-XMM7, returns in XMM0
- Register pressure: only 16 XMM/YMM registers (32 with AVX-512)
- MXCSR state is thread-local but can be modified by library calls

---

## 11. Atomic Operations and Memory Barriers

### Why Atomics Exist

Modern CPUs have store buffers, write-combining buffers, and caches that reorder
memory operations for performance. On a weakly ordered architecture (ARM, RISC-V),
the hardware is free to reorder loads and stores as long as the program appears
correct to a **single thread**. But other threads may observe stores in a different
order than they were issued.

Atomic operations and memory barriers are the assembly-level primitives that restore
ordering guarantees for concurrent code.

### x86 Atomic Operations

x86 provides the `LOCK` prefix, which makes the following instruction atomic with
respect to all cores:

```asm
lock add    [counter], 1         ; atomic increment
lock xadd   [counter], eax      ; atomic fetch-and-add (old value in EAX)
lock cmpxchg [ptr], rbx          ; atomic compare-and-swap
                                 ;   if [ptr] == RAX: [ptr] = RBX, ZF=1
                                 ;   else: RAX = [ptr], ZF=0
lock bts    [bitmap], 5          ; atomic bit test-and-set
```

x86 has a relatively strong memory model (**Total Store Order, TSO**):
- Loads are not reordered with other loads
- Stores are not reordered with other stores
- Loads are not reordered with older stores **to the same address**
- But a load **can** be reordered before an older store to a **different** address
  (store-buffer forwarding)

This means x86 rarely needs explicit fences -- but `MFENCE` is still needed for
certain patterns (e.g., Dekker's algorithm, SeqCst stores).

### ARM64 Atomic Operations

ARM64 is **weakly ordered** -- loads and stores can be freely reordered unless
explicit barriers are used. ARM provides two approaches:

**Exclusive load/store (LL/SC pattern):**
```asm
retry:
    ldxr    w0, [x1]           ; exclusive load (marks cache line)
    add     w0, w0, #1         ; modify
    stxr    w2, w0, [x1]       ; exclusive store (succeeds only if no
                               ;   intervening write to the cache line)
    cbnz    w2, retry          ; retry if store failed
```

**LSE atomics (ARMv8.1):**
```asm
    ldadd   w0, w0, [x1]      ; atomic fetch-and-add
    cas     w0, w1, [x2]       ; compare-and-swap
    swp     w0, w0, [x1]      ; atomic swap
```

ARM64 acquire/release variants: `ldaxr` (load-acquire exclusive), `stlxr`
(store-release exclusive), `ldar` (load-acquire), `stlr` (store-release).

### RISC-V Atomic Operations

RISC-V provides both LL/SC (`lr.w`/`sc.w`, `lr.d`/`sc.d`) and AMO (Atomic Memory
Operations: `amoadd`, `amoswap`, `amoand`, `amoor`, `amomax`, `amomin`).

```asm
retry:
    lr.d    t0, (a0)           ; load-reserved
    addi    t0, t0, 1          ; modify
    sc.d    t1, t0, (a0)       ; store-conditional
    bnez    t1, retry          ; retry if failed
```

### Memory Fences

| Architecture | Fence Instruction | Semantics |
|-------------|-------------------|-----------|
| x86-64 | `mfence` | Full fence (all loads and stores complete before continuing) |
| x86-64 | `sfence` | Store fence (all stores complete) |
| x86-64 | `lfence` | Load fence (all loads complete; also serializes execution) |
| ARM64 | `dmb ish` | Data Memory Barrier (inner shareable -- all cores) |
| ARM64 | `dsb ish` | Data Synchronization Barrier (waits for completion) |
| ARM64 | `isb` | Instruction Synchronization Barrier (flushes pipeline) |
| RISC-V | `fence rw, rw` | Full fence (configurable: r=read, w=write) |
| RISC-V | `fence.tso` | TSO fence (weaker, sufficient for acquire/release) |

### Why Barriers Are Needed

Without barriers on ARM64, this pattern is broken:

```asm
; Thread 1:                    ; Thread 2:
str     w0, [x_data]          ldr     w1, [x_flag]    ; may see 1
str     w1, [x_flag]          ldr     w0, [x_data]    ; but see OLD data!
```

ARM is allowed to reorder the two stores (Thread 1) and the two loads (Thread 2).
Fix:

```asm
; Thread 1:                    ; Thread 2:
str     w0, [x_data]          ldar    w1, [x_flag]    ; load-acquire
stlr    w1, [x_flag]          ldr     w0, [x_data]    ; ordered after acquire
; store-release                ; sees new data if flag == 1
```

---

## 12. Spectre and Meltdown

### Background (January 2018)

In January 2018, researchers disclosed two classes of speculative execution
side-channel attacks that affected virtually every modern high-performance CPU:

- **Meltdown (CVE-2017-5754)** -- Allows a user-space process to read kernel memory.
  Exploits the fact that speculative loads bypass permission checks, and the
  speculatively loaded data leaves traces in the cache (measurable via timing).
  Primarily affected Intel CPUs (and some ARM Cortex-A75).

- **Spectre (CVE-2017-5753, CVE-2017-5715)** -- Allows an attacker to trick a victim
  into speculatively executing code that leaks the victim's secrets through cache
  side channels. Affects virtually all CPUs with branch prediction.

### Spectre Variant 1: Bounds Check Bypass

```c
// Vulnerable C code (compiles to vulnerable assembly):
if (x < array1_size) {           // branch predicted taken
    y = array2[array1[x] * 256]; // speculatively executed with
}                                // attacker-controlled x out of bounds
```

The speculative load `array1[x]` reads beyond the array boundary. The result is used
to index `array2`, bringing a specific cache line into the cache. After the branch
misprediction is detected and the speculative state is rolled back, the cache state
persists. The attacker measures access times to `array2` to determine which line was
loaded, thereby learning the value of the out-of-bounds byte.

### Spectre Variant 2: Branch Target Injection

The attacker mistrains the **indirect branch predictor** (BTB) to redirect
speculative execution to a gadget of the attacker's choosing within the victim's
address space. The gadget speculatively leaks data through a cache side channel.

### Meltdown

```asm
; Simplified Meltdown attack:
mov     rax, [kernel_address]     ; faults (ring 3 reading ring 0)
                                  ; but speculatively executes before fault
shl     rax, 12                   ; use the speculatively read byte
mov     rbx, [probe_array + rax]  ; bring a cache line into cache based
                                  ; on the kernel byte value
; After the fault is handled, measure probe_array timing to recover the byte
```

### Mitigations

| Mitigation | Attack | Mechanism | Performance Impact |
|-----------|--------|-----------|-------------------|
| **KPTI** (Kernel Page Table Isolation) | Meltdown | Unmap kernel pages from user page tables; switch page tables on syscall entry/exit | 1-5% for most workloads, up to 30% for syscall-heavy |
| **Retpoline** | Spectre V2 | Replace indirect branches with a return trampoline that traps speculation in an infinite loop | 5-10% for indirect-branch-heavy code |
| **IBRS** (Indirect Branch Restricted Speculation) | Spectre V2 | Microcode update: indirect branches don't use predictions from prior privilege levels | 2-8% |
| **STIBP** (Single Thread Indirect Branch Predictors) | Spectre V2 (SMT) | Prevent sibling hyperthread from poisoning branch predictors | Variable |
| **SSBD** (Speculative Store Bypass Disable) | Spectre V4 | Disable speculative store bypass (store forwarding) | 2-8% |
| **MDS mitigations** | MDS variants | Flush microarchitectural buffers on context switch | 1-5% |

### Impact on CPU Design

Post-2018, CPU designers have fundamentally changed their approach:

- Intel's Golden Cove and later include hardware mitigations for Spectre/Meltdown
  (no performance penalty for KPTI, hardware IBRS)
- ARM added FEAT_CSV2 (Cache Speculation Variant 2) restricting branch predictor
  use across privilege boundaries
- RISC-V specified the `Zifencei` extension for instruction fence semantics
- New speculative execution attacks continue to be discovered (Spectre-BHB, Retbleed,
  Downfall, Inception, SLAM), driving ongoing design changes

For assembly programmers, the key takeaway: speculative execution is not transparent.
Security-sensitive code (cryptographic implementations, sandboxes, JIT compilers) must
consider speculative side channels. Tools like `lfence` (speculation barrier) and
careful code patterns are necessary.

---

## 13. Modern Microarchitectures

### Intel

**Golden Cove (Alder Lake P-cores, 12th Gen, 2021):**
- 6-wide decode (with micro-op cache supplying up to 8/cycle)
- 12 execution ports, 512-entry ROB
- 48 KB L1D (12-way), 32 KB L1I (8-way), 1.25 MB L2 (10-way)
- Up to 5.2 GHz, Intel 7 process

**Gracemont (Alder Lake E-cores):**
- 4-wide decode, 8 execution ports, 256-entry ROB
- Designed for efficiency: ~40% less area than a P-core
- No AVX-512 support
- Based on Tremont lineage (Atom heritage)

**Raptor Cove (Raptor Lake, 13th/14th Gen):**
- Enhanced Golden Cove with larger caches and higher clocks
- Up to 6.0 GHz (with Thermal Velocity Boost)

**Redwood Cove (Meteor Lake, 2023):**
- First Intel chiplet (tile) design with separate compute and SoC tiles
- New branch predictor, improved prefetcher

**Lion Cove (Arrow Lake, 2024):**
- 8-wide decode, further ROB expansion
- Cluster-based scheduling

### AMD

**Zen 4 (Ryzen 7000, EPYC Genoa, 2022):**
- 6-wide decode, 4-wide dispatch to 13 execution ports
- 320-entry ROB, up to 6 uops/cycle
- 32 KB L1D (8-way), 32 KB L1I (8-way), 1 MB L2 (8-way)
- AVX-512 (double-pumped: 256-bit physical units, 2 cycles for 512-bit)
- TSMC 5nm, up to 5.7 GHz

**Zen 5 (Ryzen 9000, EPYC Turin, 2024):**
- 8-wide decode, wider scheduling
- 448-entry ROB
- Full-width 512-bit AVX-512 execution (no double-pumping)
- 48 KB L1D, improved branch predictor
- TSMC 4nm / 3nm

### Apple Silicon

**Firestorm / Icestorm (M1, 2020):**
- Firestorm (P-core): 8-wide decode, ~630-entry ROB, 192 KB L1I, 128 KB L1D
- Icestorm (E-core): 4-wide decode, more area-efficient
- Unified memory architecture (CPU + GPU share LPDDR memory pool)
- 16 MB shared L2 (P-core cluster), no traditional L3

**Avalanche / Blizzard (M2, 2022):**
- Enhanced Firestorm successor with improved branch prediction and FP throughput
- 24 MB L2 (P-core cluster), up to 3.5 GHz

**M3, M4 (2023-2024):**
- TSMC 3nm, hardware ray tracing in GPU
- M4: ~25% faster single-thread than M3, wider issue width in P-cores
- Apple does not publish detailed microarchitectural specs, but reverse engineering
  (Dougall Johnson's work, Chips and Cheese) has revealed enormous ROBs and very
  wide execution

### ARM Cortex

**Cortex-A78 (2020):** 4-wide, 8 execution ports, 160-entry ROB. The workhorse of
many Android flagships.

**Cortex-A710 (2021):** ARMv9 variant of A78 with MTE (Memory Tagging Extension)
and SVE2 support.

**Cortex-X3 (2022):** 6-wide decode, 12 execution ports, 320-entry ROB. ARM's
"performance at any cost" core, rivaling Apple's P-cores.

**Cortex-X4 (2023):** Further widened to compete with Apple Silicon. Larger ROB,
improved branch prediction.

### Qualcomm Oryon (2023)

Qualcomm's custom core (derived from Nuvia acquisition):
- 8-wide decode
- 600+ entry ROB (among the largest in the industry)
- 192 KB L1I, 96 KB L1D
- First appeared in Snapdragon X Elite for laptops
- Competitive with Apple M3 in single-thread performance

### Microarchitecture Comparison

| Feature | Golden Cove | Zen 4 | Firestorm (M1) | Cortex-X3 | Oryon |
|---------|------------|-------|----------------|-----------|-------|
| Decode width | 6 | 6 | 8 | 6 | 8 |
| Exec ports | 12 | 13 | ~16 (est.) | 12 | ~16 (est.) |
| ROB entries | 512 | 320 | ~630 | 320 | ~600 |
| L1D | 48 KB | 32 KB | 128 KB | 64 KB | 96 KB |
| L1I | 32 KB | 32 KB | 192 KB | 64 KB | 192 KB |
| L2 | 1.25 MB | 1 MB | 16 MB (shared) | 512 KB-1 MB | 12 MB (shared) |
| Max freq | ~5.2 GHz | ~5.7 GHz | ~3.2 GHz | ~3.3 GHz | ~3.8 GHz |

---

## 14. Endianness

### Byte Ordering

**Big-endian** stores the **most significant byte** at the lowest memory address:

```
Value: 0x12345678
Address:  +0   +1   +2   +3
Data:     12   34   56   78
```

**Little-endian** stores the **least significant byte** at the lowest memory address:

```
Value: 0x12345678
Address:  +0   +1   +2   +3
Data:     78   56   34   12
```

### Architecture Defaults

| Architecture | Default Endianness | Notes |
|-------------|-------------------|-------|
| x86 / x86-64 | Little-endian | Always. Cannot be changed. |
| ARM / ARM64 | Little-endian | Default. Bi-endian (SETEND, SCTLR.EE) but LE is universal in practice. |
| RISC-V | Little-endian | Spec allows BE, but all implementations are LE. |
| MIPS | Bi-endian | Configurable at reset. Linux MIPS is typically LE (mipsel). |
| SPARC | Big-endian | Traditional. SPARCv9 supports bi-endian. |
| PowerPC | Big-endian | Traditional. POWER8+ support LE mode (used by IBM POWER Linux). |
| IBM z/Architecture | Big-endian | Always. Mainframe heritage. |
| Network byte order | Big-endian | TCP/IP headers are defined as big-endian. |

### Why Endianness Matters in Assembly

1. **Byte-level memory access** -- Loading a 32-bit value and then accessing individual
   bytes gives different results on LE vs BE:
   ```asm
   ; x86 (little-endian)
   mov     eax, 0x12345678
   mov     [buf], eax
   movzx   ecx, byte [buf]     ; ECX = 0x78 (LSB at lowest address)
   ```

2. **Network protocols** -- TCP/IP uses big-endian. x86 assembly must use `bswap` to
   convert between host (LE) and network (BE) byte order:
   ```asm
   bswap   eax                  ; reverse byte order of EAX
   ; EAX was 0x78563412, now 0x12345678
   ```

3. **File formats** -- Some formats specify big-endian (JPEG, PNG, Java class files),
   others little-endian (BMP, WAV, ELF on x86). Assembly code that parses binary
   formats must account for endianness.

4. **Cross-platform data exchange** -- Serializing a struct on an x86 machine and
   deserializing on a SPARC (or vice versa) will produce garbage unless endianness
   conversion is performed.

ARM64 provides `REV` (reverse bytes in register) and `REV16`/`REV32` for endianness
conversion. RISC-V lacks a dedicated byte-swap instruction in the base ISA but the
Zbb extension adds `rev8`.

---

## 15. ABI (Application Binary Interface)

### What the ABI Defines

The ABI is the **contract between compiled code** -- it ensures that separately
compiled translation units (object files, shared libraries) can call each other's
functions correctly. It defines:

1. **Register usage** -- Which registers are caller-saved (volatile) and callee-saved
   (non-volatile).
2. **Calling convention** -- How arguments are passed (registers, then stack), how
   return values are delivered, stack alignment requirements.
3. **Stack frame layout** -- Red zone, frame pointer usage, alignment.
4. **Data type sizes and alignment** -- `sizeof(long)`, struct padding, alignment of
   SIMD types.
5. **Name mangling** -- How C++ symbol names are encoded in object files.
6. **Exception handling** -- DWARF `.eh_frame` tables for stack unwinding.
7. **TLS (Thread-Local Storage)** -- How `__thread` / `thread_local` variables are
   accessed (typically via `FS` or `GS` segment on x86-64, TPIDR_EL0 on ARM64).

### System V AMD64 ABI (Linux, macOS, BSDs)

**Integer argument registers (in order):** `RDI`, `RSI`, `RDX`, `RCX`, `R8`, `R9`

**Floating-point argument registers:** `XMM0`-`XMM7`

**Return values:** `RAX` (integer, up to 64 bits), `RDX:RAX` (128-bit integer),
`XMM0` (float/double), `XMM1:XMM0` (two floats or complex)

**Caller-saved (volatile):** `RAX`, `RCX`, `RDX`, `RSI`, `RDI`, `R8`-`R11`,
`XMM0`-`XMM15`, `RFLAGS`

**Callee-saved (non-volatile):** `RBX`, `RBP`, `R12`-`R15`

**Stack alignment:** 16-byte aligned before `CALL` (so RSP mod 16 == 8 upon function
entry, due to the return address push)

**Red zone:** 128 bytes below RSP that leaf functions can use without adjusting RSP.
Allows small leaf functions to avoid the `sub rsp`/`add rsp` pair.

Example function in assembly (SysV AMD64):

```asm
; int64_t add_three(int64_t a, int64_t b, int64_t c)
; a = RDI, b = RSI, c = RDX
add_three:
    lea     rax, [rdi + rsi]      ; RAX = a + b
    add     rax, rdx              ; RAX = a + b + c
    ret                           ; return value in RAX
```

### Windows x64 ABI

Different from SysV:

**Integer argument registers:** `RCX`, `RDX`, `R8`, `R9` (only 4 registers, not 6)

**Shadow space:** Caller allocates 32 bytes on the stack (4 * 8) even if all args
fit in registers. Callee may spill register args to this space.

**No red zone.** Leaf functions must still adjust RSP if they use the stack.

**Callee-saved:** `RBX`, `RBP`, `RDI`, `RSI`, `R12`-`R15`, `XMM6`-`XMM15`

Note: `RDI` and `RSI` are callee-saved on Windows but caller-saved on SysV. This is
a common source of bugs when porting assembly between platforms.

### ARM64 AAPCS64 (ARM Architecture Procedure Call Standard)

**Integer argument registers:** `X0`-`X7` (8 registers)

**Floating-point argument registers:** `V0`-`V7` (NEON/FP registers)

**Return values:** `X0` (integer, up to 64 bits), `X0`+`X1` (128-bit),
`V0` (float/double)

**Callee-saved:** `X19`-`X28`, `X29` (frame pointer), `X30` (link register, but
pushed/popped around calls), `V8`-`V15` (lower 64 bits only)

**Caller-saved:** `X0`-`X18`, `X30` (content), `V0`-`V7`, `V16`-`V31`

**Stack alignment:** 16-byte aligned at all times. SP must be 16-byte aligned for
any load/store using SP as base.

### RISC-V Calling Convention

**Integer argument registers:** `a0`-`a7` (x10-x17)

**Floating-point argument registers:** `fa0`-`fa7` (f10-f17)

**Return values:** `a0`-`a1` (integer), `fa0`-`fa1` (float)

**Callee-saved:** `s0`-`s11` (x8-x9, x18-x27), `fs0`-`fs11`

**Stack alignment:** 16-byte

### ABI Comparison Table

| Property | SysV AMD64 | Windows x64 | AAPCS64 | RISC-V |
|----------|-----------|-------------|---------|--------|
| Integer arg regs | 6 (RDI..R9) | 4 (RCX..R9) | 8 (X0..X7) | 8 (a0..a7) |
| FP arg regs | 8 (XMM0..7) | 4 (XMM0..3) | 8 (V0..V7) | 8 (fa0..fa7) |
| Callee-saved GPRs | 6 | 8 | 10 | 12 |
| Stack alignment | 16 | 16 | 16 | 16 |
| Red zone | 128 bytes | None | None | None |
| Shadow space | None | 32 bytes | None | None |
| Frame pointer | Optional | Optional | X29 (FP) | s0 (FP) |

### Why ABIs Make C the Lingua Franca

Every language that wants to call into shared libraries or be called from other
languages must conform to the platform ABI -- and the platform ABI is defined in
terms of C's type system and calling conventions. This is why:

- Python's `ctypes` and `cffi` call C functions
- Rust's `extern "C"` uses the C ABI
- Go's `cgo` bridges through C calling conventions
- Java's `JNI` is a C interface
- Every OS system call interface is defined in terms of the C ABI

Assembly language operates at the ABI level directly. Every `call` instruction you
write must respect the ABI, or your code will corrupt registers, misalign the stack,
and crash in mysterious ways that only manifest under specific optimization levels or
with specific callee implementations.

---

## Summary

These fifteen topics form the conceptual foundation for serious assembly programming.
The stored-program concept and fetch-decode-execute cycle explain why assembly exists.
The ISA defines the programmer's contract with the hardware. Pipelining, superscalar
execution, and branch prediction explain why instruction ordering matters for
performance. The memory hierarchy and virtual memory system explain why data layout
dominates real-world performance. Interrupts, floating-point, and atomics are the
hard operational corners where assembly is irreplaceable. Spectre and Meltdown
demonstrate that microarchitectural details, supposedly hidden by the ISA abstraction,
can leak through side channels with security consequences. Modern microarchitectures
show how the same ISA contract is fulfilled by wildly different implementations.
Endianness and ABIs are the practical mechanics of making assembly code interoperate
with the rest of the software stack.

Understanding these concepts transforms assembly from "writing instructions" into
understanding how the machine actually works -- which is the point of learning
assembly in the first place.

---

*PNW Research Series -- Assembly Language*
*Tibsfox Research, 2026*

---

## Study Guide — Concepts and Microarchitecture

### Prerequisites

- Finish the architectures.md file first — you need the ISA
  vocabulary.
- A chip whose microarchitecture is documented. Intel and AMD both
  publish microarchitecture reference manuals; Apple Silicon is
  partially reverse-engineered; Raspberry Pi (Cortex-A72/A76) has
  full Arm documentation.

### Key concepts

1. **Pipelining.** Instructions flow through fetch → decode →
   execute → writeback stages, overlapped. A 5-stage pipeline
   works on 5 instructions simultaneously at different stages.
2. **Out-of-order execution.** Modern CPUs re-order instructions
   to hide memory latency. They maintain the *illusion* of
   sequential execution through a reorder buffer and commit
   in-order.
3. **Branch prediction.** The CPU guesses which way a conditional
   branch will go and starts executing speculatively. A mispredict
   costs 10-20 cycles of wasted work.
4. **Caches.** L1 (per-core), L2, L3 (shared). Each level is
   larger and slower than the one above. A miss to main memory
   costs 200+ cycles.
5. **Speculative execution and Spectre.** The 2018 Spectre and
   Meltdown attacks exploited speculative execution to leak data
   across protection boundaries. This is a microarchitecture-level
   security story, and it reshaped CPU design in ways that are
   still working their way through the industry.

---

## Programming Examples

### Example 1 — Measure branch mispredict cost

```c
// Compile with: gcc -O2 branch.c -o branch
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

int main(void) {
    int n = 1 << 24, *a = malloc(n * sizeof(int));
    for (int i = 0; i < n; i++) a[i] = rand() % 256;
    // Uncomment to sort:
    // qsort(a, n, sizeof(int), /*...*/);
    long sum = 0;
    clock_t t = clock();
    for (int i = 0; i < n; i++)
        if (a[i] >= 128) sum += a[i];
    printf("sum=%ld  time=%.3fs\n",
           sum, (double)(clock() - t) / CLOCKS_PER_SEC);
}
```

Run with unsorted and sorted input. Sorted is 3-5x faster because
the branch predictor gets it right every time once it passes the
threshold. Unsorted is a worst case for the predictor.

---

## DIY & TRY

### DIY 1 — Use `perf` to inspect your code

`perf stat -e cache-misses,branch-misses ./your-program`. Run on
any binary. The numbers you see are the microarchitecture
talking.

### DIY 2 — Read Agner Fog's tables

Agner Fog publishes instruction-latency and throughput tables for
every major x86 microarchitecture at `agner.org/optimize`. Pick
one CPU and one hot loop from your code; look up the latencies and
compute expected throughput. Compare to actual.

### TRY — Write a Spectre proof-of-concept

Spectre v1 POC code is public. Read one. Understand it line by
line. You will develop the clearest possible picture of what
speculative execution actually means.

---

## Related College Departments (microarchitecture)

- [**engineering**](../../../.college/departments/engineering/DEPARTMENT.md)
  — microarchitecture is hardware engineering meets software.
- [**mathematics**](../../../.college/departments/mathematics/DEPARTMENT.md)
  — cache behavior, branch prediction, and queueing models are
  applied probability and combinatorics.
