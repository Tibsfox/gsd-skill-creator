# Machine Language and Machine Code

## PNW Research Series -- Computation Cluster

*From transistor switching to speculative execution: the complete path a bit pattern*
*travels from memory through silicon to observable effect.*

---

## 1. The Fetch-Decode-Execute Cycle

Every processor ever built -- from the Intel 4004 to the Apple M4 -- runs one
fundamental loop. It is the heartbeat of computation.

### The Basic Cycle

```
    +--------------------------------------------------+
    |                                                  |
    v                                                  |
+--------+    +--------+    +---------+    +--------+  |
| FETCH  |--->| DECODE |--->| EXECUTE |--->| UPDATE |--+
+--------+    +--------+    +---------+    +--------+
    |              |              |              |
 Read bytes    Determine     Perform the     Advance
 from memory   opcode and    operation:      instruction
 at the        operands:     ALU, memory,    pointer to
 instruction   what op?      branch, I/O     next instr.
 pointer       what regs?
               what imm?
```

**Fetch.** The CPU reads one or more bytes from memory at the address held in the
instruction pointer (IP on x86, PC on ARM/RISC-V). The number of bytes read
depends on the ISA. RISC-V and ARM A64 use fixed 4-byte instructions. x86 uses
variable-length instructions from 1 to 15 bytes, which makes fetching and
decoding significantly harder.

The fetch unit does not just read one instruction. It reads an entire cache line
(typically 64 bytes) and feeds it into a buffer. On x86, this buffer feeds a
pre-decode stage that identifies instruction boundaries -- a non-trivial problem
when instructions vary from 1 to 15 bytes.

**Decode.** The instruction bytes are parsed to determine: (1) the operation
(opcode), (2) the source operands (registers, immediates, memory addresses), and
(3) the destination (where the result goes). On RISC architectures, decoding is
simple because the instruction format is regular -- the opcode, register fields,
and immediate fields are always in the same bit positions. On x86, decoding is a
multi-stage process that handles prefixes, escape bytes (0F, VEX, EVEX), ModR/M
bytes, SIB bytes, and displacement/immediate fields.

Modern x86 CPUs (since the Pentium Pro in 1995) decode complex x86 instructions
into one or more micro-operations (uops). A simple `add rax, rbx` decodes to one
uop. A `push rax` decodes to two uops (one for the store, one for decrementing
rsp). A `rep movsb` can decode to hundreds of uops. The uops are what actually
flow through the rest of the pipeline.

**Execute.** The decoded operation is sent to the appropriate functional unit: the
ALU for arithmetic and logic, the AGU (address generation unit) for memory
address calculation, the branch unit for branches, the load/store unit for memory
access. The functional unit performs the operation and produces a result.

**Update.** The instruction pointer is advanced to the next instruction. For
sequential instructions, this is simply IP + instruction_length. For taken
branches, the IP is set to the branch target. For exceptions and interrupts, the
IP is saved and replaced with the handler address.

### The Cycle on Modern Hardware

On a modern out-of-order superscalar processor, the cycle is still present but
profoundly transformed:

- **Fetch** reads 16-32 bytes per cycle, potentially multiple instructions.
- **Decode** processes 4-6 instructions per cycle (Intel) or 6-8 (Apple M-series).
- **Execute** happens out of program order, with 8-12 execution units running in
  parallel.
- **Update** (retirement/commit) happens in program order, 4-8 instructions per
  cycle.

The fundamental abstraction holds: the programmer sees sequential
fetch-decode-execute. The hardware maintains this illusion while executing
massively out of order underneath.

### Concrete Example: x86-64

Consider the instruction `48 01 D8` -- this is `add rax, rbx` in machine code.

1. **Fetch**: The bytes `48 01 D8` are read from memory at address RIP.
2. **Decode**: `48` is the REX.W prefix (64-bit operand size). `01` is the ADD
   opcode (add r/m64, r64). `D8` is the ModR/M byte: mod=11 (register), reg=011
   (rbx), r/m=000 (rax). Result: ADD RAX, RBX.
3. **Execute**: The ALU adds the contents of RAX and RBX. Flags are set: CF
   (carry), ZF (zero), SF (sign), OF (overflow).
4. **Update**: RAX receives the sum. RIP advances by 3 (the instruction length).

---

## 2. From Bits to Transistors

### The Physical Bit

A bit in a computer is a voltage level. In modern CMOS logic:

- **Logic 1**: voltage near VDD (e.g., 0.7V in a modern process)
- **Logic 0**: voltage near ground (0V)
- **Threshold**: approximately VDD/2

A transistor is a voltage-controlled switch. NMOS transistors conduct when the
gate is high. PMOS transistors conduct when the gate is low. Every logic gate is
built from combinations of NMOS and PMOS transistors.

### Logic Gates

The fundamental gates and their transistor counts:

| Gate | Function      | CMOS Transistors | Truth Table Summary           |
|------|---------------|------------------|-------------------------------|
| NOT  | Inversion     | 2                | 0->1, 1->0                   |
| NAND | NOT(A AND B)  | 4                | Only 0 when both inputs are 1 |
| NOR  | NOT(A OR B)   | 4                | Only 1 when both inputs are 0 |
| AND  | A AND B       | 6 (NAND + NOT)   | 1 only when both inputs are 1 |
| OR   | A OR B        | 6 (NOR + NOT)    | 0 only when both inputs are 0 |
| XOR  | A != B        | 8-12             | 1 when inputs differ          |

NAND and NOR are the natural gates of CMOS -- they require only 4 transistors
each. AND and OR require an extra inverter stage. This is why real hardware is
built from NAND/NOR first, then optimized.

NAND is functionally complete: any Boolean function can be built from NAND gates
alone. This is the theoretical foundation of digital design. In practice, standard
cell libraries provide optimized versions of common gates (AOI, OAI, muxes) as
single cells.

### Combinational Logic

Combinational circuits have no memory -- their output depends only on the current
inputs, not on any previous state.

**Multiplexer (MUX).** Selects one of N inputs based on a select signal. A 2:1
mux is the hardware equivalent of an if-else. A 32:1 mux selects one of 32
registers in a register file read port. Built from AND-OR logic or pass-transistor
logic.

**Decoder.** Converts an N-bit binary number into one of 2^N output lines. A 5-bit
decoder activates one of 32 lines -- used to select a register in a 32-register
file. The instruction decoder in the control unit is a much larger version of
this concept.

**Arithmetic Logic Unit (ALU).** The core computational unit. Takes two operands
and an operation selector, produces a result and status flags. Covered in detail
in Section 3.

### Sequential Logic

Sequential circuits have memory -- their output depends on both current inputs
and previous state. The fundamental building block is the flip-flop.

**SR Latch.** Two cross-coupled NOR (or NAND) gates. Has two stable states. The
simplest memory element, but has a forbidden input combination.

**D Flip-Flop.** Captures the input value D on the rising edge of the clock
signal and holds it until the next rising edge. This is the fundamental storage
element. One bit of a register is one D flip-flop. A 64-bit register is 64 D
flip-flops in parallel. A register file with 32 64-bit registers is 2,048 D
flip-flops, plus read/write port logic.

**The Clock Signal.** A square wave that synchronizes all sequential logic.
Modern CPUs run at 3-6 GHz, meaning the clock period is 167-333 picoseconds.
Every flip-flop in the entire chip samples its input at the same clock edge
(ideally -- clock distribution is a major engineering challenge called clock skew).

The clock defines the granularity of time in the CPU. Nothing happens "between"
clock edges. All state changes occur at clock edges. This is what makes digital
logic deterministic despite being built from analog components.

### How an Adder Works

Addition is the most fundamental ALU operation. Every other arithmetic operation
can be built from addition (subtraction is addition with two's complement,
multiplication is repeated addition and shifting).

**Half Adder.** Adds two 1-bit numbers. Produces a sum and a carry.

```
  A ---+-->[XOR]---> Sum
       |
  B ---+-->[AND]---> Carry
```

- Sum = A XOR B
- Carry = A AND B

**Full Adder.** Adds two 1-bit numbers plus a carry-in. This is the building
block of multi-bit addition.

- Sum = A XOR B XOR Cin
- Cout = (A AND B) OR (Cin AND (A XOR B))

**Ripple Carry Adder.** Chain N full adders together, connecting each carry-out
to the next carry-in. Simple but slow: the carry must "ripple" through all N
stages. For a 64-bit add, the worst case is 64 gate delays for the carry chain.
At 5 GHz, one gate delay is approximately 30-50ps, so 64 delays would be
2-3ns -- far too slow for a single-cycle operation.

**Carry Lookahead Adder.** Computes all carries in parallel using generate (G)
and propagate (P) signals:

- G_i = A_i AND B_i (bit position i generates a carry regardless of carry-in)
- P_i = A_i XOR B_i (bit position i propagates an incoming carry)

The carry for each position can be computed in O(log N) gate delays instead of
O(N). A 64-bit carry lookahead adder computes the result in approximately 6 gate
delays -- fast enough for single-cycle operation at multi-GHz frequencies.

Modern ALUs use variations of carry lookahead (Kogge-Stone, Brent-Kung,
Han-Carlson) that trade off between gate delay, area, and wiring complexity.
These are prefix adders -- they compute all carries as a parallel prefix
computation on the generate and propagate signals.

---

## 3. The ALU

The Arithmetic Logic Unit is where computation physically happens. It is a purely
combinational circuit -- no state, no clock dependency for its core logic (though
its inputs come from clocked registers and its outputs are captured by clocked
registers).

### ALU Block Diagram

```
          N bits          N bits
            |               |
            v               v
       +----+----+    +----+----+
       | Operand |    | Operand |
       |    A    |    |    B    |
       +----+----+    +----+----+
            |               |
            v               v
       +----+---------------+----+
       |                         |
       |     ALU Core            |<--- Operation Select
       |                         |     (3-4 bits)
       |  +-----+  +-----+      |
       |  | ADD/ |  | AND/|      |
       |  | SUB  |  | OR/ |      |
       |  |      |  | XOR |      |
       |  +--+---+  +--+--+      |
       |     |         |         |
       |  +--v---------v--+      |
       |  |   Result MUX  |<--- Op Select
       |  +-------+-------+      |
       |          |              |
       +----------+--------------+
                  |
            +-----+-----+
            |           |
            v           v
       +----+----+ +----+----+
       | Result  | |  Flags  |
       | (N bits)| | C Z N V |
       +---------+ +---------+
```

### Operations

The operation select input (typically 3-4 bits) chooses among:

**Arithmetic operations:**
- **ADD**: A + B. Uses the carry lookahead adder.
- **SUB**: A + (~B) + 1. Subtraction is addition with the two's complement of B.
  The adder inverts B and sets carry-in to 1. Same hardware as ADD.
- **ADC**: A + B + carry_flag. Add with carry, for multi-precision arithmetic.
- **SBB**: A - B - borrow. Subtract with borrow.

**Logical operations:**
- **AND**: Bitwise AND. Each output bit is the AND of the corresponding input bits.
- **OR**: Bitwise OR. Each output bit is the OR of the corresponding input bits.
- **XOR**: Bitwise XOR. Each output bit is the XOR of the corresponding input bits.
- **NOT**: Bitwise complement of A (B is ignored or used as mask).

**Shift operations** (sometimes in a separate barrel shifter unit):
- **SHL/SLL**: Shift left logical. Fills with zeros.
- **SHR/SRL**: Shift right logical. Fills with zeros.
- **SAR/SRA**: Shift right arithmetic. Fills with the sign bit (preserves sign).
- **ROL/ROR**: Rotate left/right.

### The Flags Register

After every ALU operation, four status flags are computed:

- **Carry (C)**: Set if the operation produced a carry out of the most significant
  bit. For unsigned arithmetic, carry means overflow.
- **Zero (Z)**: Set if the result is exactly zero (all bits are 0). Computed as
  the NOR of all result bits.
- **Negative/Sign (N/S)**: Set to the most significant bit of the result. In
  two's complement, this indicates a negative number.
- **Overflow (V/O)**: Set if signed overflow occurred. Computed as the XOR of
  the carry into and out of the most significant bit. Overflow means the result
  has the wrong sign.

### Condition Codes

Branch instructions test combinations of these flags. This is how high-level
comparisons become machine code:

| Condition | Flags Tested       | Meaning (after CMP A, B)  |
|-----------|--------------------|---------------------------|
| EQ        | Z = 1              | A == B                    |
| NE        | Z = 0              | A != B                    |
| LT (signed)| N != V           | A < B (signed)            |
| GE (signed)| N == V           | A >= B (signed)           |
| LE (signed)| Z=1 OR N!=V      | A <= B (signed)           |
| GT (signed)| Z=0 AND N==V     | A > B (signed)            |
| LO (unsigned)| C = 0          | A < B (unsigned)          |
| HS (unsigned)| C = 1          | A >= B (unsigned)         |

A CMP instruction is simply a SUB that discards the result but keeps the flags.
The flags encode the relationship between the operands. The subsequent conditional
branch reads the flags to decide whether to branch.

This is one of the most elegant aspects of machine code design: comparison and
branching are decoupled. You can compute flags with CMP, TEST, ADD, SUB, or any
arithmetic instruction, then branch on them later. The flags register is the
communication channel between the ALU and the branch unit.

### ALU Width and Multiple Units

A modern superscalar CPU has multiple ALUs. Intel's Golden Cove (Alder Lake) core
has:

- 4 integer ALUs (simple add/sub/logic)
- 1 integer multiply/divide unit
- 2 branch execution units
- 3 512-bit SIMD ALUs (each can do 8 x 64-bit adds per cycle)
- 2 load units, 2 store-address units, 1 store-data unit

This means the CPU can perform multiple ALU operations simultaneously on different
data, all in a single clock cycle. The scheduler decides which operations go to
which units.

---

## 4. The Control Unit

The control unit is the conductor of the CPU orchestra. It reads the opcode from
the decoded instruction and generates the control signals that tell every other
component what to do in each clock cycle.

### Control Signals

For a simple single-cycle CPU, the control signals include:

- **RegWrite**: Whether to write to the register file.
- **ALUSrc**: Whether the second ALU input comes from a register or an immediate.
- **ALUOp**: Which operation the ALU should perform (2-4 bits).
- **MemRead / MemWrite**: Whether to read from or write to memory.
- **MemToReg**: Whether the register write data comes from the ALU or from memory.
- **Branch**: Whether this is a branch instruction.
- **Jump**: Whether this is an unconditional jump.

For a real CPU, there are hundreds of control signals governing execution unit
selection, bypass paths, exception handling, privilege transitions, and more.

### Hardwired Control (RISC)

In a RISC processor (ARM, RISC-V, MIPS), the control unit is a combinational
logic circuit. The opcode bits directly drive a truth table implemented as gates.

For RISC-V, the 7-bit opcode field uniquely determines the instruction type
(R-type, I-type, S-type, B-type, U-type, J-type). Each type has a fixed format,
so the control signals can be derived from the opcode alone with straightforward
combinational logic -- a PLA (Programmable Logic Array) or equivalent.

Hardwired control is fast (one gate delay to generate all signals) but inflexible.
If the ISA changes, the silicon must change.

### Microcoded Control (CISC)

In a CISC processor (x86), many instructions are too complex for single-cycle
execution. A `rep movsb` (repeat move string byte) might copy thousands of bytes.
A `div` (division) takes dozens of cycles. These cannot be handled by a simple
truth table.

The solution is microcode: a ROM inside the CPU that contains sequences of
micro-instructions (uops). Each micro-instruction is a simple operation that
takes one cycle. Complex x86 instructions are decoded into sequences of uops by
consulting the microcode ROM.

The microcode sequencer maintains a micro-program counter (uPC) that steps
through the micro-instruction sequence for the current macro-instruction. Each
micro-instruction specifies the control signals for one cycle.

Modern x86 CPUs use a hybrid approach:
- Simple instructions (add, mov, cmp, jmp) are decoded directly by hardware into
  1-2 uops. This is the fast path.
- Complex instructions (div, rep string ops, legacy x87 FP) are decoded via
  microcode ROM into longer uop sequences. This is the slow path.

The MSROM (Microcode Sequencer ROM) on a modern Intel CPU contains thousands of
micro-instruction entries. It is field-updatable: Intel ships microcode updates
through BIOS and OS patches, which is how they patched Spectre and Meltdown
mitigations into existing CPUs.

### The x86 Instruction Decoder: The Most Complex Decoder

The x86 decoder must handle:

- **Variable-length instructions** (1-15 bytes)
- **Legacy prefixes** (up to 4, changing operand size, address size, segment, lock)
- **REX/VEX/EVEX prefixes** (extending register encoding, vector length)
- **Escape bytes** (0F for two-byte opcodes, 0F 38/0F 3A for three-byte)
- **ModR/M byte** (specifies register/memory operand encoding)
- **SIB byte** (Scale-Index-Base for complex addressing modes)
- **Displacement** (1, 2, or 4 bytes)
- **Immediate** (1, 2, 4, or 8 bytes)

Intel's decoder has a dedicated pre-decode stage that marks instruction
boundaries (length decoding) before the main decode stage. The pre-decode unit
processes 16 bytes per cycle and marks where each instruction starts and ends.
This is one of the most complex pieces of combinational logic in the entire chip.

The main decoder on Intel has one "complex" decoder (handles instructions that
decode to 1-4 uops, or invokes MSROM) and three "simple" decoders (handle
instructions that decode to exactly 1 uop). Zen 4 (AMD) has four decoders, all
capable of complex decode.

Additionally, modern x86 CPUs cache decoded uops in a uop cache (DSB on Intel,
Op Cache on AMD) so that hot loops bypass the decoder entirely. The uop cache can
deliver 6-8 uops per cycle, faster than the decode pipeline.

---

## 5. Registers as the Fastest Memory

### The Register File

A register is an array of flip-flops that stores one word of data (32 or 64
bits). The register file is the collection of all architectural registers,
implemented as a multi-ported SRAM structure.

Access time: **zero cycles** (with forwarding). When an instruction in the
execute stage produces a result, that result can be forwarded directly to a
dependent instruction in the same cycle via bypass networks. Without forwarding,
register read takes 1 cycle (the register file read stage).

The register file has:
- **Read ports**: allow multiple instructions to read register values
  simultaneously. A CPU that issues 6 uops per cycle might need 12 read ports
  (2 source operands each).
- **Write ports**: allow multiple instructions to write results simultaneously.
  Typically 4-6 write ports.

The number of ports is critical. Each port adds wires and transistors. An N-port
register file with R registers of W bits requires O(N * R * W) transistors and
the wire routing becomes quadratically harder with ports. This is one reason
register files are kept small.

### Architectural vs. Physical Registers

**Architectural registers** are what the programmer sees and what the ISA defines:

| ISA       | General-Purpose Regs | Width  | Other Key Registers        |
|-----------|---------------------|--------|----------------------------|
| x86-64    | 16 (rax-r15)        | 64-bit | rip, rflags, 32 AVX-512    |
| ARM A64   | 31 (x0-x30)         | 64-bit | sp, pc, 32 SIMD/FP (v0-v31)|
| RISC-V    | 32 (x0-x31)         | 32/64  | pc (x0 hardwired to 0)    |

**Physical registers** are the actual hardware registers in the CPU, and there
are far more of them:

- Intel Golden Cove: 280+ physical integer registers, 332+ physical vector
  registers
- AMD Zen 4: 224 physical integer registers, 192 physical vector registers

The extra physical registers exist for **register renaming**, which eliminates
false dependencies.

### Register Renaming

Consider this code:

```asm
add rax, rbx      ; (1) rax = rax + rbx
mov rcx, rax      ; (2) rcx = rax        -- true dependency on (1)
add rax, rdx      ; (3) rax = rax + rdx  -- WAW dependency on (1)
mov rsi, rax      ; (4) rsi = rax        -- true dependency on (3)
```

Instructions (1) and (3) both write to `rax`. This is a WAW (Write After Write)
dependency -- not a real data dependency, just a name collision. Instruction (3)
must wait for (1) to complete if we only have one physical `rax`. But with
register renaming:

```
add P17, P5        ; (1) P17 = P5 + P3    [rax -> P17]
mov P18, P17       ; (2) P18 = P17        [rcx -> P18]
add P19, P17       ; (3) P19 = P17 + P7   [rax -> P19]  -- no conflict!
mov P20, P19       ; (4) P20 = P19        [rsi -> P20]
```

Each write to an architectural register is assigned a new physical register. Now
(3) does not conflict with (1) -- they write to different physical registers.
Instructions (1) and (3) can execute simultaneously if their inputs are ready.

The **Register Alias Table (RAT)** maps architectural registers to physical
registers. It is updated at the rename/allocate stage and consulted at every
instruction decode. The RAT is one of the most performance-critical structures
in the CPU -- it must be accessed every cycle for every instruction being renamed.

When an instruction retires (commits), the old physical register that was
previously mapped to the same architectural register is freed and returned to the
free list for reuse.

---

## 6. Memory Hierarchy from the Machine Code Perspective

Every `load` and `store` instruction in machine code interacts with the memory
hierarchy. The programmer writes `mov rax, [rbx+rcx*8]` and sees a single
operation. The hardware sees a complex sequence of cache lookups, potential misses,
and bus transactions.

### Latency at Each Level

| Level    | Typical Size   | Latency (cycles) | Latency (ns)  | Bandwidth      |
|----------|---------------|-------------------|---------------|----------------|
| Register | 1-2 KB        | 0 (forwarded)     | 0             | unlimited      |
| L1 Cache | 32-48 KB      | 4-5               | ~1            | 2 loads/cycle  |
| L2 Cache | 256 KB - 2 MB | 12-14             | ~3            | 64 B/cycle     |
| L3 Cache | 4-64 MB       | 30-50             | ~10           | 32 B/cycle     |
| DRAM     | 8-128 GB      | 150-300           | ~50-100       | 25-50 GB/s     |
| NVMe SSD | 256 GB - 8 TB | 10K-50K           | ~5,000-25,000 | 3-7 GB/s       |

Each level is approximately 3-10x slower and 10-1000x larger than the previous
level. This is the memory wall: the gap between CPU speed and memory speed has
grown exponentially since the 1980s.

### Cache Lines

Memory is cached in fixed-size blocks called cache lines, almost universally 64
bytes on modern x86 and ARM CPUs. When the CPU loads a single byte, the entire
64-byte cache line containing that byte is fetched from the next level of the
hierarchy. This exploits spatial locality: if you access byte N, you will likely
soon access bytes near N.

A cache line at address 0x1000 contains bytes 0x1000-0x103F. Addresses are
aligned to cache line boundaries by masking the low 6 bits.

### How a Load Instruction Works

When the CPU executes `mov rax, [address]`:

1. The AGU (Address Generation Unit) computes the effective address.
2. The address is sent to the L1 data cache (L1d).
3. The L1d checks its tags: does it have a cache line for this address?
   - **L1 hit**: The data is returned in 4-5 cycles. The load is complete.
   - **L1 miss**: The request is forwarded to L2.
4. L2 checks its tags (12-14 cycles).
   - **L2 hit**: The cache line is returned to L1 and the CPU.
   - **L2 miss**: The request goes to L3.
5. L3 checks its tags (30-50 cycles). On multi-core CPUs, the L3 is shared and
   must also check if another core has the line (MESI/MOESI coherence protocol).
6. **L3 miss**: The request goes to DRAM. The memory controller issues a read
   command to the DRAM DIMMs. After 50-100ns, the data arrives.

The total latency for a DRAM access can be 200+ cycles. During this time, the
out-of-order engine continues executing independent instructions that do not
depend on the load result.

### Prefetch Instructions

Machine code can hint to the hardware that data will be needed soon:

```asm
; x86 prefetch instructions
prefetcht0 [rax+64]     ; Prefetch into L1, L2, and L3
prefetcht1 [rax+128]    ; Prefetch into L2 and L3
prefetcht2 [rax+192]    ; Prefetch into L3
prefetchnta [rax+256]   ; Prefetch non-temporal (bypass L2/L3, into L1)
```

Software prefetching is tricky to use effectively. Prefetch too early and the
data is evicted before use. Prefetch too late and the load still stalls. Modern
CPUs have sophisticated hardware prefetchers that detect stride patterns and
stream patterns automatically, making software prefetch less necessary than it
was in the Pentium 4 era.

### Memory-Mapped I/O

On x86 and ARM, hardware devices are accessed through memory addresses. Writing
to a specific physical address does not write to DRAM -- it sends data to a
device. The PCI BAR (Base Address Register) maps device registers into the
physical address space. Device driver machine code uses `mov` instructions to
read/write device registers, with the MMU ensuring that the addresses map to the
device's MMIO range rather than to DRAM.

These accesses are marked uncacheable in the page tables to prevent the cache
from hiding device state changes.

---

## 7. The Instruction Pipeline in Detail

Pipelining is the single most important performance technique in CPU design. It
allows the CPU to work on multiple instructions simultaneously, like an assembly
line in a factory.

### A Simple 5-Stage Pipeline

```
Clock   1    2    3    4    5    6    7    8    9
       +----+----+----+----+----+
Instr1 | IF | ID | EX | MEM| WB |
       +----+----+----+----+----+
            +----+----+----+----+----+
Instr2      | IF | ID | EX | MEM| WB |
            +----+----+----+----+----+
                 +----+----+----+----+----+
Instr3           | IF | ID | EX | MEM| WB |
                 +----+----+----+----+----+
                      +----+----+----+----+----+
Instr4                | IF | ID | EX | MEM| WB |
                      +----+----+----+----+----+
                           +----+----+----+----+----+
Instr5                     | IF | ID | EX | MEM| WB |
                           +----+----+----+----+----+

IF = Instruction Fetch
ID = Instruction Decode / Register Read
EX = Execute (ALU operation)
MEM = Memory Access (load/store)
WB = Write Back (write result to register file)
```

Without pipelining, each instruction takes 5 cycles. With pipelining, after the
pipeline is full, one instruction completes every cycle -- a 5x throughput
improvement. The latency of each individual instruction is still 5 cycles, but
the throughput is 1 instruction per cycle.

### Modern x86 Pipeline (Approximate)

A modern Intel Core pipeline has approximately 15-20 stages:

1. **Branch Predict** -- Predict next fetch address using BTB, PHT, TAGE.
2. **Fetch 1** -- Send predicted address to instruction cache.
3. **Fetch 2** -- Receive cache line from L1i cache.
4. **Pre-decode** -- Mark instruction boundaries in the fetched bytes.
5. **Instruction Queue** -- Buffer pre-decoded bytes.
6. **Decode 1** -- Decode x86 instructions into uops (4-6 decoders).
7. **Decode 2** -- Complete complex instruction decode, uop cache lookup.
8. **Allocate** -- Assign physical registers, reorder buffer entries.
9. **Rename** -- Map architectural registers to physical registers via RAT.
10. **Schedule/Dispatch** -- Place uops in the reservation station (scheduler).
11. **Issue** -- When operands are ready, send uop to execution unit.
12. **Execute 1** -- ALU/AGU/branch computation.
13. **Execute 2** -- Multi-cycle operations (multiply, complex shifts).
14. **Writeback** -- Write result to physical register, broadcast on bypass net.
15. **Retire 1** -- Check if oldest instructions in ROB can commit.
16. **Retire 2** -- Update architectural state, free old physical registers.

ARM A-series (Cortex-A78, etc.) pipelines are similar in depth (11-13 stages)
but simpler in the decode stages because ARM instructions have fixed length and
regular encoding.

### Pipeline Hazards

**Data hazards** occur when an instruction depends on the result of a previous
instruction still in the pipeline. Solutions: forwarding/bypassing (results are
sent directly from the execute stage back to dependent instructions, without
waiting for writeback) and stalling (inserting a bubble if forwarding is not
sufficient, e.g., a load followed immediately by a dependent use).

**Control hazards** occur at branches. The pipeline has fetched instructions
after the branch, but does not yet know if the branch is taken. Solutions: branch
prediction (guess the direction), delayed branches (MIPS -- the instruction after
the branch always executes), speculative execution (execute the predicted path,
discard if wrong).

**Structural hazards** occur when two instructions need the same hardware
resource simultaneously (e.g., two instructions both need the single multiplier).
Solutions: add more functional units, or stall one instruction.

### Pipeline Stalls and Bubbles

When a hazard cannot be resolved by forwarding, the pipeline inserts a "bubble"
-- an empty cycle where no useful work is done. A bubble propagates forward
through the pipeline like a gap on an assembly line.

A branch misprediction on a 15-stage pipeline flushes approximately 15 cycles of
speculative work. At 5 GHz, that is 3 nanoseconds -- an eternity in CPU time.
This is why branch prediction accuracy matters enormously: even 95% accuracy
means a 5% misprediction rate, and each mispredict costs 15+ cycles.

---

## 8. Out-of-Order Execution from the Machine Code Perspective

Out-of-order (OoO) execution is the key technique that allows modern CPUs to
extract instruction-level parallelism (ILP) from sequential machine code. The
programmer writes sequential instructions. The hardware finds and exploits
parallelism automatically.

### The Reorder Buffer (ROB)

The ROB is a circular buffer that holds all in-flight instructions in program
order. Each entry contains:

- The instruction (uop)
- Its destination physical register
- Whether it has completed execution
- Any exception information

Instructions enter the ROB in program order at the allocate/rename stage.
Instructions execute out of order (whenever their operands are ready). But
instructions retire (commit) from the ROB strictly in program order.

Modern ROBs are large: Intel Golden Cove has a 512-entry ROB. This means up to
512 instructions can be in-flight simultaneously -- some executing, some waiting
for operands, some completed but not yet retired.

### The Scheduler (Reservation Station)

The scheduler holds uops that have been renamed but not yet executed. Each entry
tracks whether each source operand is ready. When all operands for a uop are
ready, it is eligible for issue to an execution unit.

The scheduler examines all entries every cycle and issues the oldest ready uops
to available execution units. This is a complex priority-based selection circuit
that must operate in a single clock cycle.

Intel Golden Cove has a 97-entry scheduler. AMD Zen 4 has a larger combined
scheduler.

### Why It Is Invisible to the Programmer

The hardware maintains the illusion of sequential execution through:

1. **In-order retirement**: Results are committed to architectural state in
   program order. If instruction 5 completes before instruction 3, the result
   of instruction 5 sits in the ROB until instructions 3 and 4 have also
   completed and retired.
2. **Precise exceptions**: If instruction 3 faults, the architectural state
   reflects all instructions before 3 having completed and none after 3. All
   speculative results from instructions 4, 5, etc. are discarded.
3. **Memory ordering**: Stores are held in a store buffer and committed to cache
   in program order, even if the store instructions executed out of order.

This means the machine code programmer can reason about sequential execution and
get correct results, while the hardware rearranges execution for performance.
The only observable effect of OoO execution is speed.

(Except for Spectre -- see Section 10.)

---

## 9. Branch Prediction from the Machine Code Perspective

Approximately 20% of all instructions in typical code are branches. At 5 GHz
with a 15-stage pipeline, the CPU must predict the target of every branch before
it is even decoded. A misprediction costs 15-20 cycles. If 20% of instructions
are branches and 5% are mispredicted, the pipeline is flushed once every 100
instructions -- a major performance loss.

### The Branch Target Buffer (BTB)

The BTB is a cache indexed by the instruction pointer. It stores the target
address of previously taken branches. When the fetch unit reads an address, it
simultaneously checks the BTB. If there is a BTB hit, the CPU immediately
redirects fetch to the predicted target -- potentially before the instruction
has even been decoded.

The BTB must be large enough to capture the working set of branches. Modern BTBs
hold 4,000-12,000 entries (Intel) and are organized as set-associative caches.

### The Pattern History Table (PHT) and Direction Prediction

The BTB predicts where a branch goes. The PHT predicts whether a branch is taken
or not taken. This is a 1-bit decision for each conditional branch.

**2-bit saturating counter**: The classic predictor. Each branch has a 2-bit
counter (strongly not taken, weakly not taken, weakly taken, strongly taken).
The counter increments on taken, decrements on not taken. The branch is predicted
taken if the counter is >= 2. This handles the common case of a loop branch
(taken many times, not taken once at loop exit) with only one misprediction per
loop.

**Correlating predictors**: The direction of one branch often depends on the
direction of preceding branches. A (m,n) correlating predictor uses the last m
branch outcomes (the global history) to index into one of 2^m separate tables,
each with 2^n-bit counters.

### TAGE: Tagged Geometric History Length

Modern CPUs use TAGE (TAgged GEometric history length) predictors, first
described by Andre Seznec. TAGE uses multiple tables indexed by different history
lengths (in a geometric series: 2, 4, 8, 16, 32, 64, 128, ...). Each table entry
is tagged to reduce aliasing.

When predicting a branch, all tables are consulted. The prediction comes from the
table with the longest matching history. This captures both short patterns (inner
loops) and long patterns (correlated sequences across function calls).

TAGE achieves >96% accuracy on typical workloads. The Apple M-series and Intel
Golden Cove reportedly use TAGE-derived predictors.

### Indirect Branch Prediction

Indirect branches (`jmp [rax]`, `call [vtable+offset]`) have variable targets.
The Indirect Target Array (ITA) or equivalent structure predicts indirect branch
targets using context (path history + branch address).

Virtual function calls in C++ and JavaScript dispatch are dominated by indirect
branches. Accurate indirect branch prediction is critical for object-oriented
code performance.

### Return Address Prediction

The Return Stack Buffer (RSB) is a hardware stack that predicts the return
address for `ret` instructions. When a `call` is executed, the return address is
pushed onto the RSB. When a `ret` is executed, the predicted return address is
popped from the RSB. Since calls and returns are typically well-paired, the RSB
is nearly perfect -- mispredict rates below 0.1%.

RSB underflows (when returns exceed calls due to context switches or exceptions)
can cause mispredictions and were part of the Retbleed vulnerability class.

---

## 10. Speculative Execution

Speculative execution is the logical consequence of branch prediction: if the
CPU predicts that a branch will be taken, it does not merely redirect fetch -- it
actually executes the predicted path, modifying physical registers, performing
loads, and computing results.

### How Speculation Works

1. The branch predictor makes a prediction (taken/not-taken, target address).
2. The fetch unit redirects to the predicted path.
3. Instructions on the predicted path are decoded, renamed, scheduled, and
   executed -- just like any other instructions.
4. Results are written to physical registers but NOT committed to architectural
   state. They remain in the ROB marked as "speculative."
5. When the branch instruction reaches the execution stage and the actual
   direction is computed:
   - **Correct prediction**: The speculative instructions are promoted to
     non-speculative. They retire normally.
   - **Incorrect prediction**: All speculative instructions after the branch are
     flushed from the pipeline. Their physical registers are freed. The fetch unit
     redirects to the correct path. The pipeline refills from the correct path.

### The Cost of Misprediction

A pipeline flush on a modern CPU discards 15-20 stages of work. On a wide
superscalar CPU issuing 6 uops per cycle, this can be 90-120 uops of wasted
work. At 5 GHz, recovery takes 3-4 nanoseconds.

Branch-heavy code with unpredictable branches (e.g., binary search comparisons,
hash table probes on random data) suffers heavily from mispredictions.
Branchless programming techniques (CMOV, predicated instructions on ARM, bitwise
tricks) can eliminate branches at the cost of always computing both paths.

### Spectre: When Speculation Breaks the Abstraction

The fundamental assumption of speculative execution is that speculative
instructions are invisible -- they are rolled back as if they never happened.
This assumption is incorrect.

Speculative instructions leave microarchitectural side effects that survive
rollback:

- **Cache state**: A speculative load brings data into the cache. Even after
  the speculative load is rolled back, the data remains in the cache. A
  subsequent access to the same address will be faster (cache hit vs. miss).
  This timing difference is measurable.

The Spectre attack exploits this:

1. Train the branch predictor to predict a specific direction.
2. Feed an input that causes a misprediction.
3. During the misprediction window, speculative execution accesses memory
   indexed by a secret value (e.g., `array[secret * 4096]`).
4. After rollback, measure which cache lines are hot. The hot cache line reveals
   the secret value.

This is a fundamental tension: speculative execution is essential for
performance, but it creates a covert timing channel that violates process
isolation. Mitigations (retpoline, IBRS, STIBP, Spectre v2 firmware patches)
add overhead, and the vulnerability class remains open for new variants.

Spectre demonstrated that the machine code abstraction -- sequential execution
with precise exceptions -- is an approximation, not a guarantee, at the
microarchitectural level.

---

## 11. Virtual Address Translation

Every memory address that appears in machine code is a virtual address. The CPU
never sends a virtual address directly to DRAM. Instead, the Memory Management
Unit (MMU) translates virtual addresses to physical addresses.

### Virtual Address Translation Diagram

```
 Machine Code: mov rax, [0x00007FFF_DEADBEEF]
                              |
                              v
                   Virtual Address (48 bits on x86-64)
                              |
                   +----------+----------+
                   |                     |
                   v                     v
              +----+-----+         +----+-----+
              |   TLB    |         | Page     |
              |  Lookup  |         | Table    |
              +----+-----+         | Walk     |
                   |               | (on TLB  |
              TLB Hit?             |  miss)   |
              /       \            +----+-----+
           Yes         No              |
            |           +--------------+
            v                          v
       +----+-----+           +--------+-------+
       | Physical |           | Walk page      |
       | Address  |           | table levels:  |
       | (from    |           | PML4 -> PDPT   |
       | TLB      |           | -> PD -> PT    |
       | entry)   |           | -> Physical    |
       +----+-----+           +--------+-------+
            |                          |
            v                          v
       +----+--------------------------+----+
       |        Physical Address             |
       |        (sent to L1 cache)           |
       +-------------------------------------+
```

### Page Tables (x86-64)

x86-64 uses a 4-level page table (5-level with LA57 extension):

| Level | Name                 | Bits Translated | Table Entries |
|-------|---------------------|-----------------|---------------|
| 4     | PML4 (Page Map L4)  | Bits 47:39      | 512           |
| 3     | PDPT (Page Dir Ptr) | Bits 38:30      | 512           |
| 2     | PD (Page Directory) | Bits 29:21      | 512           |
| 1     | PT (Page Table)     | Bits 20:12      | 512           |
| 0     | Page Offset         | Bits 11:0       | 4096 bytes    |

Each table entry is 8 bytes and contains:
- The physical address of the next-level table (or the final physical page frame)
- Permission bits: Present, Read/Write, User/Supervisor, No-Execute
- Status bits: Accessed, Dirty
- Caching control: PCD (Page Cache Disable), PWT (Page Write-Through)

A single virtual-to-physical translation requires 4 memory accesses (one per
level). At ~100ns per DRAM access, an uncached page table walk costs ~400ns.
This is why the TLB exists.

### The TLB (Translation Lookaside Buffer)

The TLB caches recent virtual-to-physical translations. Modern TLBs:

| Level   | Entries (typical)  | Hit Latency |
|---------|--------------------|-------------|
| L1 DTLB | 64-96 entries     | 1 cycle     |
| L1 ITLB | 64-128 entries    | 1 cycle     |
| L2 TLB  | 1,024-2,048       | 7-8 cycles  |

A TLB hit adds zero extra latency to a memory access (the TLB lookup happens in
parallel with the L1 cache tag check -- this is called VIPT: Virtually Indexed,
Physically Tagged). A TLB miss triggers a hardware page table walk on x86
(the MMU walks the page table automatically) or a software TLB miss handler on
some other architectures (MIPS, older SPARC).

### Page Faults

If the page table walk finds a "not present" page table entry, the MMU raises a
page fault exception. The CPU saves state and jumps to the OS page fault handler
(ISR 14 on x86). The handler determines why the page is not present:

- **Demand paging**: The page exists on disk (swap). The OS reads it from disk
  into a physical frame, updates the page table, and restarts the instruction.
- **Lazy allocation**: The page was allocated (mmap) but never touched. The OS
  allocates a physical frame, zeros it, maps it, and restarts.
- **Copy-on-write**: After fork(), parent and child share read-only pages. A
  write to a COW page faults. The OS copies the page, gives the writing process
  its own copy, and restarts.
- **Invalid access**: The address is not mapped. The OS delivers SIGSEGV to the
  process.

### Huge Pages

Standard 4 KB pages mean a 1 GB working set requires 262,144 page table entries
and TLB entries. With huge pages (2 MB on x86, or 1 GB), the same working set
requires only 512 entries (2 MB pages) or 1 entry (1 GB page). HPC and database
workloads routinely use huge pages to reduce TLB pressure.

The machine code does not change -- the same `mov` instruction works with any
page size. The page size is configured in the page tables by the OS.

---

## 12. Interrupts at the Machine Code Level

An interrupt is an asynchronous event that diverts the CPU from its current
instruction stream to an interrupt handler. At the machine code level, the
entire interrupt mechanism is defined precisely.

### Types of Interrupts

**Hardware interrupts** (external): A device (keyboard, NIC, disk controller, 
timer) signals the CPU via an interrupt line. The APIC (Advanced Programmable
Interrupt Controller) receives the signal and sends it to the CPU. The CPU
checks for pending interrupts between instructions (or at certain points within
long instructions). If interrupts are enabled (IF flag set on x86), the CPU
takes the interrupt.

**Software interrupts / exceptions** (internal):
- **Faults**: Occur before the instruction completes (e.g., page fault, division
  by zero). The saved instruction pointer points to the faulting instruction, so
  it can be restarted.
- **Traps**: Occur after the instruction completes (e.g., `int 3` breakpoint,
  single-step trap). The saved IP points to the next instruction.
- **Aborts**: Unrecoverable errors (e.g., double fault, machine check). The
  system typically cannot continue.

### The Interrupt Descriptor Table (IDT) on x86-64

The IDT is an array of 256 gate descriptors, each pointing to an interrupt
handler. The CPU finds the IDT using the IDTR register (loaded by `lidt`).

When interrupt N fires:

1. **Save state**: The CPU pushes onto the kernel stack (found via the TSS):
   - SS and RSP of the interrupted context (if privilege change)
   - RFLAGS
   - CS and RIP of the interrupted instruction
   - Error code (for some exceptions)
2. **Lookup handler**: Read entry N from the IDT. Extract the handler's CS:RIP
   and DPL (Descriptor Privilege Level).
3. **Privilege transition**: If the interrupt came from user mode (CPL 3) and
   the handler is in kernel mode (DPL 0), switch to the kernel stack defined
   in the TSS.
4. **Jump**: Set CS:RIP to the handler address. Clear IF (disable further
   interrupts, for interrupt gates).

### The Handler Machine Code

A typical interrupt handler in machine code:

```asm
; Entry point (CPU has already pushed SS, RSP, RFLAGS, CS, RIP, error_code)
handler_page_fault:
    push rax                ; Save caller-saved registers
    push rcx
    push rdx
    push rsi
    push rdi
    push r8
    push r9
    push r10
    push r11
    
    mov rdi, [rsp+72]       ; error_code as first argument (C calling convention)
    mov rsi, cr2            ; faulting address (stored in CR2 by hardware)
    call do_page_fault      ; Call C handler
    
    pop r11                 ; Restore registers
    pop r10
    pop r9
    pop r8
    pop rdi
    pop rsi
    pop rdx
    pop rcx
    pop rax
    add rsp, 8              ; Pop error code
    iretq                   ; Return from interrupt (restores RIP, CS, RFLAGS, RSP, SS)
```

The `iretq` instruction atomically restores the saved state and returns to the
interrupted context. On ARM64, the equivalent is `eret` (Exception Return), which
restores PC, PSTATE, and EL (Exception Level).

### Interrupt Latency

The time from when an interrupt fires to when the first instruction of the
handler executes. On modern x86, this is approximately 200-1000 cycles, dominated
by:

- Pipeline flush (15-20 cycles)
- Microcode assist for state save (~50-100 cycles)
- Stack switch and IDT lookup (~20 cycles)
- Handler code fetch and decode (~20 cycles)

Real-time systems measure and bound interrupt latency carefully. Linux with
PREEMPT_RT achieves worst-case interrupt latency of ~5-50 microseconds. Bare
metal or RTOS can achieve <1 microsecond.

---

## 13. System Calls as Machine Code

A system call is the controlled entry point from user space into the kernel. It
is the mechanism by which machine code running at user privilege requests services
from the OS.

### The syscall Instruction (x86-64)

Before `syscall`, x86 used `int 0x80` (slow, goes through full IDT lookup and
stack switch). AMD introduced `syscall`/`sysret` for fast system calls. Intel
had `sysenter`/`sysexit`. Modern x86-64 uses `syscall` universally.

The `syscall` instruction:

1. Saves RIP into RCX (the return address).
2. Saves RFLAGS into R11.
3. Loads RIP from the IA32_LSTAR MSR (set by the kernel at boot to point to the
   syscall entry point).
4. Loads CS and SS from the IA32_STAR MSR (kernel code/data segments).
5. Masks RFLAGS with IA32_FMASK MSR (clears IF to disable interrupts).
6. Sets CPL to 0 (kernel mode).

This is extremely fast -- no memory access, no IDT lookup, no stack switch (the
kernel must switch stacks itself in the handler). The total overhead of the
`syscall` instruction itself is approximately 20-30 cycles.

### Syscall Calling Convention (Linux x86-64)

```asm
; System call: write(1, "hello\n", 6)
mov rax, 1          ; syscall number: SYS_write (1)
mov rdi, 1          ; fd: stdout (1)
lea rsi, [msg]      ; buf: address of string
mov rdx, 6          ; count: 6 bytes
syscall             ; invoke kernel
; rax now contains the return value (bytes written, or -errno)
```

The kernel's syscall handler:

```asm
entry_SYSCALL_64:
    swapgs                  ; Switch to kernel GS base (per-CPU data)
    mov [gs:scratch], rsp   ; Save user RSP
    mov rsp, [gs:kstack]    ; Switch to kernel stack
    push rcx                ; Save user RIP
    push r11                ; Save user RFLAGS
    ; ... save remaining registers ...
    
    cmp rax, NR_syscalls    ; Validate syscall number
    jae bad_syscall
    call [sys_call_table + rax*8]   ; Dispatch to handler
    
    ; ... restore registers ...
    pop r11
    pop rcx
    swapgs
    sysretq                 ; Return to user mode (restores RIP from RCX, RFLAGS from R11)
```

### ARM64 System Calls

ARM64 uses the `svc #0` instruction (Supervisor Call):

```asm
; System call: write(1, "hello\n", 6) on ARM64 Linux
mov x8, #64         ; syscall number: SYS_write (64 on ARM64)
mov x0, #1          ; fd: stdout
adr x1, msg         ; buf
mov x2, #6          ; count
svc #0              ; invoke kernel
; x0 contains the return value
```

The `svc` instruction triggers a Synchronous Exception to EL1 (Exception Level
1, the kernel). The CPU saves PSTATE to SPSR_EL1 and the return address to
ELR_EL1, then jumps to the exception vector for synchronous exceptions at EL1.

### RISC-V System Calls

RISC-V uses `ecall` (Environment Call):

```asm
; System call: write(1, "hello\n", 6) on RISC-V Linux
li a7, 64           ; syscall number
li a0, 1            ; fd
la a1, msg          ; buf
li a2, 6            ; count
ecall               ; invoke kernel
; a0 contains the return value
```

The `ecall` instruction raises an environment-call exception. The `scause` CSR
records the cause, `sepc` records the return address, and the CPU jumps to the
trap vector in `stvec`.

### VDSO: Avoiding the Kernel Entirely

Some "system calls" do not actually enter the kernel. Linux's VDSO (Virtual
Dynamic Shared Object) is a kernel-provided shared library mapped into every
process. It contains optimized implementations of `clock_gettime`,
`gettimeofday`, and `getcpu` that read kernel-maintained data in user space
without a privilege transition. The machine code calls a normal function -- no
`syscall` instruction at all.

---

## 14. JIT Compilation: Generating Machine Code at Runtime

A JIT (Just-In-Time) compiler translates source code or bytecode into native
machine code at runtime. The CPU then fetches and executes these freshly-written
bytes exactly as it would execute any other machine code.

### The JIT Pipeline

1. **Source/Bytecode input**: JavaScript source text, Java bytecodes, .NET IL,
   Lua bytecodes, WebAssembly binary.
2. **Profiling**: An interpreter runs the code first, collecting type information
   and execution counts. "Hot" functions (executed frequently) are candidates for
   JIT compilation.
3. **Compilation**: The JIT compiler translates the hot function into native
   machine code. This includes register allocation, instruction selection,
   optimization (inlining, dead code elimination, loop unrolling).
4. **Code emission**: The compiler writes raw machine code bytes into a buffer.
5. **Memory protection**: The buffer is marked executable via `mmap` with
   `PROT_READ | PROT_EXEC` (and `PROT_WRITE` removed for W^X security).
6. **Patching**: The interpreter's dispatch table or call sites are updated to
   point to the new machine code.
7. **Execution**: The CPU fetches and executes the JIT-compiled code.

### V8 (JavaScript)

V8 has a multi-tier architecture:

- **Sparkplug**: A fast non-optimizing compiler that translates bytecode to
  machine code almost 1:1. Minimal compilation time, moderate code quality.
- **Maglev**: A mid-tier optimizing compiler. Uses feedback from Sparkplug
  execution. Performs inlining and simple optimizations.
- **Turbofan**: The full optimizing compiler. Performs speculative optimization
  based on type feedback. Produces highly optimized machine code.

V8's speculative optimization is particularly interesting from a machine code
perspective. If profiling shows that a variable `x` is always a small integer
(SMI), Turbofan emits machine code that assumes `x` is an SMI:

```asm
; Optimized: x + 1 where x is assumed to be a SMI (tagged integer)
mov rax, [rbp-0x10]     ; Load x
test rax, 0x1           ; Check SMI tag (low bit = 0 for SMI)
jnz deoptimize          ; If not SMI, deoptimize (bail out to interpreter)
add rax, 2              ; Add 1 (SMIs are shifted left by 1, so +1 = +2)
jo  deoptimize          ; If overflow, deoptimize
mov [rbp-0x18], rax     ; Store result
```

If the type assumption is ever violated, the code jumps to a "deoptimization"
stub that reconstructs the interpreter state and falls back to unoptimized
execution. The JIT-compiled machine code is discarded.

### HotSpot (Java)

HotSpot uses two compilers:

- **C1 (Client)**: Fast compilation, moderate optimization. Used for warm-up.
- **C2 (Server)**: Slow compilation, aggressive optimization. Used for hot code.

C2 generates machine code that is competitive with static C++ compilers for
numerical workloads. It performs loop unrolling, vectorization (auto-SIMD),
escape analysis (stack-allocating heap objects), and lock elision.

### LuaJIT

LuaJIT is notable for its trace-based JIT. Instead of compiling functions, it
records traces -- linear sequences of instructions along a hot path, including
through function calls. The trace is compiled to extremely tight machine code
with minimal overhead.

LuaJIT's emitter is a hand-written x86/x64/ARM code generator (DynASM) that
produces machine code with minimal abstraction overhead. For numerical loops,
LuaJIT approaches the performance of hand-written C.

### Memory Allocation for JIT Code

JIT compilers must allocate memory that is both writable (to emit code) and
executable (for the CPU to run it). On POSIX systems:

```c
// Allocate writable memory
void *buf = mmap(NULL, size, PROT_READ | PROT_WRITE,
                 MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);

// Write machine code bytes
buf[0] = 0x48; buf[1] = 0x89; buf[2] = 0xf8;  // mov rax, rdi
buf[3] = 0x48; buf[4] = 0x01; buf[5] = 0xf0;  // add rax, rsi
buf[6] = 0xc3;                                  // ret

// Make executable (and remove write permission: W^X)
mprotect(buf, size, PROT_READ | PROT_EXEC);

// Execute
int (*fn)(int, int) = (int (*)(int, int))buf;
int result = fn(3, 4);  // result = 7
```

On Apple Silicon (macOS), the `MAP_JIT` flag and `pthread_jit_write_protect_np()`
are required due to hardware W^X enforcement.

### Self-Modifying Code Considerations

JIT-generated code creates challenges for the CPU:

- **I-cache coherence**: On x86, the hardware maintains coherence between
  D-cache writes (where the JIT writes code) and I-cache reads (where the CPU
  fetches instructions). On ARM, explicit cache maintenance is required
  (`DC CVAU` to flush to point of unification, `IC IVAU` to invalidate I-cache).
- **Branch prediction pollution**: Newly emitted code has no branch prediction
  history. The first executions of JIT code suffer higher misprediction rates
  until the predictor learns.

---

## 15. Machine Code Verification

Can you verify that a piece of machine code is "safe"? In general, no. But there
are practical approaches that work within constrained systems.

### The Fundamental Problem

The Halting Problem (Turing 1936) proves that no general algorithm can determine
whether an arbitrary program terminates. Extensions of this result show that
essentially any non-trivial semantic property of programs is undecidable (Rice's
theorem).

For machine code specifically:
- You cannot determine if machine code accesses only valid memory.
- You cannot determine if machine code ever divides by zero.
- You cannot determine if machine code terminates.
- You cannot determine if machine code obeys any particular safety policy.

These are undecidable in the general case. Verification of arbitrary native
machine code is a fundamentally impossible task.

### JVM Bytecode Verification

Java's approach: do not verify machine code. Instead, verify a higher-level
bytecode (JVM bytecodes) that has enough structure to be verifiable, then compile
to machine code.

The JVM bytecode verifier checks, for every method:

1. **Type safety**: Every operation receives operands of the correct type. The
   verifier performs abstract interpretation, tracking the type of every stack
   slot and local variable at every program point.
2. **Stack discipline**: The operand stack has the same depth and types at every
   point regardless of which control flow path reached that point.
3. **Access control**: The bytecode only accesses fields and methods it has
   permission to access (public, private, protected, package).
4. **Memory safety**: No array access without bounds checks (the JVM inserts
   them). No raw pointer arithmetic.
5. **Control flow**: All jumps target valid instruction boundaries. No jumping
   into the middle of an instruction.

If verification passes, the bytecodes are guaranteed to be type-safe. The JIT
compiler can then generate machine code that omits many safety checks (e.g., null
checks can be replaced with signal handlers for segfaults, type checks can be
elided when the verifier proves the types).

### WebAssembly Validation

WebAssembly (Wasm) is designed from the ground up for fast validation:

- **Structured control flow**: No arbitrary gotos. Blocks, loops, and if-else
  are structured. This makes control flow analysis trivial.
- **Operand stack typing**: Like JVM, but simpler. The stack effect of every
  instruction is statically known.
- **Linear memory**: Memory is a flat byte array with bounds-checked access.
  No pointer arithmetic outside the linear memory.
- **No ambient authority**: Wasm modules can only call functions explicitly
  imported by the host. No system calls, no file access, no network unless
  the host provides it.

Wasm validation is a single-pass algorithm that runs in O(n) time. It
guarantees:
- No type errors at runtime.
- No out-of-bounds memory access (the hardware or software traps it).
- No undefined behavior.
- Termination of validation (not of execution -- the Halting Problem still
  applies to the program itself, but the validator always terminates).

The validated Wasm is then compiled to native machine code by the engine (V8,
SpiderMonkey, Wasmtime, Wasmer). The generated machine code inherits the safety
properties of the Wasm bytecode: memory accesses include bounds checks (or rely
on guard pages), indirect calls are validated against the expected type
signature.

### Native Code Sandboxing: NaCl and SFI

Google's Native Client (NaCl) took a different approach: verify native x86
machine code directly, using Software Fault Isolation (SFI). The key constraints:

- Code must be aligned to 32-byte bundles. No instruction crosses a bundle
  boundary.
- Indirect jumps must target bundle boundaries (mask the low 5 bits).
- Memory accesses must be sandboxed (masked to the sandbox region).
- Certain instructions are forbidden (syscall, int, privileged instructions).

The NaCl validator is a linear-time scan of the machine code that checks these
structural properties. It works because the constraints are syntactic, not
semantic -- you can verify them by looking at the instruction bytes without
reasoning about program behavior.

NaCl was deprecated in favor of WebAssembly, which provides the same safety
guarantees with better portability and simpler verification.

### Proof-Carrying Code

Proof-Carrying Code (PCC), proposed by George Necula in 1997, attaches a formal
proof of safety to machine code. The code consumer checks the proof (which is
fast and mechanical) rather than analyzing the code itself. The proof certifies
that the code satisfies a safety policy (e.g., memory safety, type safety).

PCC has been demonstrated academically but has not seen wide deployment. The
complexity of generating proofs for optimized machine code is high, and the
safety policies must be precisely formalized.

### Practical Reality

In practice, the industry has converged on a layered approach:

1. **Untrusted code runs in a sandbox** (browser, JVM, Wasm runtime, container).
2. **The sandbox verifies a bytecode** (JVM bytecodes, Wasm, .NET IL) that is
   structured enough to be verifiable.
3. **The verified bytecode is compiled to native machine code** by a trusted
   compiler (JIT or AOT).
4. **The native machine code runs directly on hardware** with hardware-enforced
   isolation (page tables, rings/exception levels, SMEP/SMAP).
5. **The OS kernel is the trusted computing base** -- its machine code is not
   verified by any higher authority. Kernel bugs are catastrophic.

The unsatisfying truth: the machine code actually running on your CPU is not
verified. It is trusted because it was generated by a chain of trusted tools
(compiler, linker, OS loader, JIT) from verified higher-level representations.
The chain of trust extends from the source code (which humans can audit) through
the compiler (which we trust) to the machine code (which we hope is correct).

Formal verification of compilers (CompCert for C, CakeML for ML) provides a
mathematically rigorous link: if the source program is correct, the generated
machine code is correct. But formally verified compilers are the exception, not
the norm.

---

## Synthesis: The Complete Path

A single `add rax, [rbx+rcx*8]` instruction in x86-64 machine code (bytes:
`48 03 04 CB`) traverses the following path:

1. **Branch predictor** predicts the next fetch address (sequential, since this
   is not a branch).
2. **Fetch unit** reads bytes from the L1i cache (or uop cache).
3. **Pre-decode** identifies the instruction boundaries: REX prefix `48`, opcode
   `03`, ModR/M `04`, SIB `CB`.
4. **Decode** produces two uops: one for the address generation (rbx + rcx*8),
   one for the add.
5. **Rename** assigns physical registers: maps architectural rax to a new
   physical register P47.
6. **Scheduler** waits for rbx and rcx values to be available, then dispatches
   the AGU uop.
7. **AGU** computes the effective address: value(rbx) + value(rcx) * 8.
8. **TLB** translates the virtual address to physical.
9. **L1d cache** looks up the physical address. If hit, returns 8 bytes in 4
   cycles.
10. **ALU** adds the loaded value to the value of rax. Sets RFLAGS.
11. **Writeback** stores the result in physical register P47.
12. **Retire** commits P47 as the new value of architectural rax.

The instruction's machine code is 4 bytes. The hardware that executes it
contains billions of transistors. The abstraction -- "add a memory value to
rax" -- hides a staggering amount of complexity. And yet the abstraction holds:
the programmer sees exactly the behavior specified in the Intel manual, as if
the instruction executed in a single atomic step.

This is the achievement of machine code design: a stable interface between
software and silicon that has persisted for decades while the hardware underneath
has been revolutionized beyond recognition.

---

## References and Further Reading

- Intel 64 and IA-32 Architectures Software Developer's Manual, Volumes 1-4
- ARM Architecture Reference Manual (ARMv8-A, DDI 0487)
- RISC-V Instruction Set Manual, Volume I (Unprivileged) and Volume II (Privileged)
- Hennessy & Patterson, "Computer Architecture: A Quantitative Approach" (6th ed.)
- Patterson & Hennessy, "Computer Organization and Design: RISC-V Edition"
- Agner Fog, "Microarchitecture of Intel, AMD and VIA CPUs" (agner.org)
- Agner Fog, "Instruction Tables" and "Optimizing Assembly" (agner.org)
- Kocher et al., "Spectre Attacks: Exploiting Speculative Execution" (2018)
- Lipp et al., "Meltdown: Reading Kernel Memory from User Space" (2018)
- Seznec, "A New Case for the TAGE Branch Predictor" (2011)
- Necula, "Proof-Carrying Code" (POPL 1997)
- Haas et al., "Bringing the Web up to Speed with WebAssembly" (PLDI 2017)
- Leroy, "Formal Verification of a Realistic Compiler" (CACM 2009, CompCert)

---

*PNW Research Series -- Computation Cluster*
*Machine Language and Machine Code*
*Generated 2026-04-08*

---

## Study Guide — Machine Code Execution

### Key concepts

1. **Fetch-decode-execute cycle.** The classic three-step
   loop. Modern CPUs pipeline and parallelize it, but the
   abstract model is still this.
2. **Pipelining.** Overlap execution stages.
3. **Out-of-order execution.** Reorder to hide memory latency.
4. **Speculative execution.** Predict and run ahead.
5. **Traps and interrupts.** The CPU yields control to the
   OS.

## DIY — Single-step a program

Write a "hello world" in assembly. Run under `gdb`. Use
`si` (stepi) to execute one instruction at a time. Watch
the registers change.

## DIY — Trigger an exception

Write a program that dereferences a null pointer. Watch
how the CPU traps and the OS signals your process.

## TRY — Implement a simple simulator

Write a 3-instruction (LOAD, ADD, STORE) simulator in
Python. This is the minimum you need to understand
execution.

## Related College Departments

- [**engineering**](../../../.college/departments/engineering/DEPARTMENT.md)
