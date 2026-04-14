# Machine Language and Machine Code

> PNW Research Series -- Computer Science Cluster
> Project: MLC (Machine Language and Machine Code)
> The raw binary layer below assembly language

---

## 1. What Machine Code IS

Machine code is the actual binary data that a processor's instruction decoder
reads, interprets, and executes. It is not text. It is not mnemonics. It is a
sequence of voltage-level-representable bit patterns stored in memory, fetched
by the CPU, and consumed by the decode unit of the pipeline.

When we say a program "runs," what we mean at the lowest level is: the CPU's
program counter points to an address, the fetch unit reads bytes from that
address, the decode unit recognizes a bit pattern as a specific operation, and
the execution units carry it out. Then the program counter advances (or
branches), and the cycle repeats. This is machine code in action.

### Assembly Language Is Not Machine Code

Assembly language is a human-readable textual representation of machine code.
The mnemonic `ADD R1, R2, R3` is assembly. The bit pattern
`0000 0000 0100 0011 0000 1000 0011 0011` (hex `0x00430833`) is the machine
code. An assembler translates the former into the latter. A disassembler does
the reverse. But the CPU never sees the text -- it sees only the bits.

This distinction matters because:

- One assembly mnemonic may map to multiple machine code encodings (x86's `MOV`
  has dozens of opcode variants depending on operand types and sizes).
- One machine code byte sequence may disassemble differently depending on where
  you start decoding (this is exploited in security research -- see Section 14).
- Pseudo-instructions in assembly (`LI`, `NOP` in MIPS, `MOV` with large
  immediates in ARM) have no single corresponding machine instruction -- the
  assembler expands them into one or more real instructions.

### The Interface Between Software and Silicon

Machine code is the contract between software and hardware. The Instruction Set
Architecture (ISA) defines this contract: what bit patterns exist, what each
one does, what state they modify (registers, flags, memory), and what side
effects they have. Everything above the ISA -- compilers, interpreters,
operating systems, applications -- exists to produce or manage machine code.
Everything below the ISA -- microarchitecture, transistors, silicon -- exists
to execute it.

```
  Source code (C, Rust, Python...)
          |
      Compiler / Interpreter
          |
      Machine code  <--- THE BOUNDARY
          |
      CPU decode logic
          |
      Micro-operations (in CISC) or direct execution (in RISC)
          |
      Transistor-level switching
```

### A Concrete Example

Consider the x86-64 instruction to add the value 42 to the `EAX` register:

```
Assembly:    add eax, 0x2A
Machine code (hex): 83 C0 2A
Machine code (binary): 10000011 11000000 00101010
```

Byte breakdown:
- `83` = opcode for "ALU operation with sign-extended 8-bit immediate"
- `C0` = ModR/M byte: mod=11 (register), reg=000 (opcode extension for ADD),
  r/m=000 (EAX)
- `2A` = immediate value 42

This three-byte sequence is what sits in memory. The CPU fetches it, recognizes
`83` as an ALU-immediate operation, reads the ModR/M byte to determine the
specific operation (ADD) and destination (EAX), reads the immediate (42), and
performs the addition.

---

## 2. The Stored-Program Concept (1945)

### Before Stored Programs: Hardwired Machines

The earliest electronic computers were not programmed with machine code stored
in memory. They were configured by physically rewiring their circuits.

**Colossus** (1943-44, Bletchley Park): Built by Tommy Flowers to break the
Lorenz cipher. Programmed by setting switches and plugging cables on a patch
panel. Each new cryptanalysis task required physical reconfiguration. Colossus
was special-purpose: it could only perform the specific class of computations
it was wired for.

**ENIAC** (1945-46, University of Pennsylvania): Designed by John Mauchly and
J. Presper Eckert. 17,468 vacuum tubes, 30 tons, 150 kilowatts. Programmed by
setting switches and connecting cables among its 40 panels. Changing a program
could take days. ENIAC was general-purpose in principle but the programming
model was hardwired -- the program was in the physical configuration, not in
the data memory.

### Von Neumann's First Draft (1945)

In June 1945, John von Neumann wrote the "First Draft of a Report on the
EDVAC" (Electronic Discrete Variable Automatic Computer). This 101-page
document described a computer architecture where:

1. **Instructions and data share the same memory.** A program is stored in the
   same address space as the data it operates on.
2. **The program counter determines which memory location contains the next
   instruction.** Sequential execution is the default; branch instructions
   modify the counter.
3. **Instructions are encoded as numbers.** They can be read, written, and
   modified like any other data.

This is the **stored-program concept**, and it is the foundation of essentially
all modern computing. The key insight: **a program is just another kind of
data.** It can be loaded from storage, copied, modified, and replaced -- all
without physically rewiring anything.

### Attribution and Controversy

The ideas in the EDVAC report drew on contributions from Eckert and Mauchly
(who had already been thinking about stored programs for ENIAC's successor)
and from the broader team. Von Neumann's name appeared as sole author because
he wrote the document, but the intellectual contributions were collaborative.
Eckert and Mauchly felt their contributions were insufficiently credited. The
term "von Neumann architecture" persists despite this controversy.

Alan Turing independently developed stored-program concepts. His 1936 paper on
the Universal Turing Machine described a machine that reads its instructions
from the same tape as its data -- the theoretical precursor. His ACE (Automatic
Computing Engine) design at the National Physical Laboratory (1945-46) was a
detailed stored-program computer design.

Konrad Zuse's Z3 (1941, Berlin) is sometimes cited as the first programmable
computer, but it read its program from punched film, not from shared memory
with data. It was not a stored-program machine.

### Why It Matters for Machine Code

The stored-program concept created machine code as we know it. Before it,
there was no "machine code" -- there were switch settings and cable
configurations. After it, programs became sequences of encoded instructions
sitting in addressable memory, fetched and executed by the CPU. Machine code
became a tangible, inspectable, modifiable artifact.

---

## 3. Early Machine Code

### Manchester Baby (SSEM) -- June 21, 1948

The Small-Scale Experimental Machine (SSEM), built at the University of
Manchester by Frederic Williams, Tom Kilburn, and Geoff Tootill, was the
**first machine to run a stored program from electronic memory**.

On June 21, 1948, it executed a program written by Tom Kilburn to find the
highest proper divisor of 2^18 (262,144). The program was 17 instructions
long. The machine had:

- 32-bit word length
- 32 words of memory (Williams tube CRT storage)
- 7 instructions: JMP, JRP (relative jump), LDN (load negative), STO (store),
  SUB, CMP (skip if negative), STOP

The instruction format was 32 bits wide:

```
Bits 0-4:   Address (5 bits, addressing 32 words)
Bits 5-12:  Unused
Bits 13-15: Opcode (3 bits, 8 possible instructions, 7 used)
Bits 16-31: Unused
```

This was hand-coded binary, entered by setting bits on the CRT display using
switches. There was no assembler, no loader, no operating system. The
programmer thought in raw bit patterns.

### EDSAC -- May 6, 1949

The Electronic Delay Storage Automatic Calculator, built by Maurice Wilkes at
the University of Cambridge, was the first practical stored-program computer
(as opposed to the SSEM, which was an experimental proof of concept). EDSAC
ran its first program on May 6, 1949: a table of squares.

EDSAC had a 17-bit instruction format:

```
Bits 0-4:   Opcode (5 bits)
Bit 5:      Unused
Bits 6-16:  Address (11 bits, addressing up to 1024 words) [CHECK]
```

Wilkes' team developed "initial orders" -- a bootstrap program stored on a
read-only set of uniselectors (telephone switches) that could load programs
from paper tape. This was the first bootstrap loader.

EDSAC programmers used a rudimentary letter-code system: each instruction was
written as a letter (corresponding to the opcode) followed by a number
(the address). For example, `A 100` meant "add the value at address 100 to
the accumulator." This was the earliest form of assembly language, but the
programmer was still thinking in terms of the machine's actual instruction
encoding.

### Programming by Hand: Binary and Octal

Early programmers wrote machine code directly. They used:

- **Binary**: The raw bit patterns themselves. Used on machines like the SSEM
  where input was literal bit-setting.
- **Octal**: Base-8 notation, where each octal digit represents 3 bits. Used
  extensively on PDP-8, PDP-10, and other DEC machines. The PDP-8's 12-bit
  word maps neatly to 4 octal digits.
- **Hexadecimal**: Base-16 notation, where each hex digit represents 4 bits.
  Became standard with 8-bit byte machines (IBM System/360 and successors).

Example -- the same byte in all three:

```
Binary:      10110101
Octal:       265
Hexadecimal: B5
```

### Input Media

- **Toggle switches**: Literally flipping switches to set bit patterns, one
  word at a time. Used on front panels of PDP-11, Altair 8800, etc.
- **Paper tape**: Holes punched in a strip of paper. Each row of holes
  represents one character or part of a word. Used on EDSAC, early
  minicomputers.
- **Punch cards**: Hollerith cards with 80 columns, 12 rows. Each column
  encodes one character. Used extensively from the 1950s through the 1970s.
  IBM's 704, 709, 7090, and System/360 series all used punch cards as a primary
  input medium.
- **Magnetic tape and drum**: For program storage and loading on larger
  machines.

### The Transition to Assemblers

The drudgery and error-proneness of hand-coding binary led to the development
of assemblers in the early 1950s:

- Wilkes, Wheeler, and Gill's "initial orders" for EDSAC (1949) -- the first
  bootstrap/assembler
- Nathaniel Rochester's assembler for the IBM 701 (1954)
- The term "assembler" itself dates to the early 1950s

Once assemblers existed, programmers stopped writing raw binary (mostly). But
the machine code produced by the assembler was identical to what they would
have written by hand -- the assembler was just a more reliable translator.

---

## 4. Instruction Encoding Formats

Machine code is structured data. Each instruction is a bit pattern divided into
**fields** that specify what operation to perform and what data to operate on.
The way these fields are arranged is the **encoding format**.

### Field Types

- **Opcode**: Identifies the operation (ADD, SUB, LOAD, STORE, BRANCH, etc.).
- **Register specifiers**: Identify which registers to use (source, destination).
  A 5-bit field can address 32 registers; a 4-bit field addresses 16.
- **Immediate values**: Constants encoded directly in the instruction.
- **Address fields**: Memory addresses or offsets.
- **Condition codes / predicate bits**: Specify conditions for conditional
  execution.
- **Mode bits**: Select addressing modes, operand sizes, etc.
- **Function code (funct)**: Further specifies the operation within an opcode
  class.

### Fixed-Width Encoding

In a fixed-width ISA, every instruction is the same number of bits. This
simplifies fetch and decode because the CPU always knows how many bytes to
read for the next instruction.

**ARM A32 (32-bit ARM)**: Every instruction is exactly 32 bits (4 bytes).

```
31  28 27 26 25 24       21 20 19    16 15    12 11              0
[cond] [0  0] [I] [opcode ] [S] [ Rn  ] [ Rd  ] [   operand2   ]
```

- Bits 31-28: Condition field (4 bits). Every ARM instruction is conditionally
  executed. `1110` = always execute (AL). `0000` = execute if equal (EQ).
- Bits 27-26: Instruction class identifier.
- Bit 25: Immediate flag (1 = operand2 is an immediate, 0 = register).
- Bits 24-21: Opcode (4 bits: ADD=0100, SUB=0010, MOV=1101, CMP=1010, etc.).
- Bit 20: Set-condition-codes flag.
- Bits 19-16: First source register (Rn).
- Bits 15-12: Destination register (Rd).
- Bits 11-0: Flexible second operand (immediate or register with shift).

Example: `ADD R3, R1, R2` (add R1 and R2, store in R3):

```
Hex:    E0813002
Binary: 1110 00 0 0100 0 0001 0011 000000000010
         AL     I=0 ADD S=0 Rn=R1 Rd=R3  Rm=R2
```

**RISC-V**: Every base instruction is exactly 32 bits, divided into six
encoding types:

```
R-type: [funct7  | rs2  | rs1  | funct3 | rd   | opcode]
        [31   25 |24 20 |19 15 |14   12 |11  7 | 6   0 ]

I-type: [imm[11:0]      | rs1  | funct3 | rd   | opcode]
        [31          20 |19 15 |14   12 |11  7 | 6   0 ]

S-type: [imm[11:5] | rs2  | rs1  | funct3 | imm[4:0] | opcode]
        [31     25 |24 20 |19 15 |14   12 |11      7 | 6   0 ]

B-type: [imm[12|10:5] | rs2  | rs1  | funct3 | imm[4:1|11] | opcode]
        [31        25 |24 20 |19 15 |14   12 |11         7 | 6   0 ]

U-type: [imm[31:12]                          | rd   | opcode]
        [31                              12  |11  7 | 6   0 ]

J-type: [imm[20|10:1|11|19:12]               | rd   | opcode]
        [31                              12  |11  7 | 6   0 ]
```

The opcode field is always bits 6-0. The `funct3` field (bits 14-12) and
`funct7` field (bits 31-25) further specify the operation. For example, the
opcode `0110011` means "register-register ALU operation" (R-type), and funct3
+ funct7 distinguish ADD (`funct3=000, funct7=0000000`) from SUB
(`funct3=000, funct7=0100000`).

Example: `ADD x3, x1, x2` in RISC-V:

```
funct7=0000000 rs2=00010 rs1=00001 funct3=000 rd=00011 opcode=0110011
Binary: 0000000 00010 00001 000 00011 0110011
Hex:    0x002081B3
```

### Variable-Width Encoding

In a variable-width ISA, instructions can be different lengths. This allows
for compact encoding of common operations and richer encoding of complex ones,
at the cost of more complex decode logic.

**x86/x86-64**: Instructions range from 1 to 15 bytes. The encoding is
notoriously complex, a product of 45+ years of backward-compatible extensions:

```
[Legacy prefixes] [REX/VEX/EVEX prefix] [Opcode] [ModR/M] [SIB] [Displacement] [Immediate]
  0-4 bytes          0-4 bytes          1-3 bytes  0-1     0-1    0-4 bytes      0-8 bytes
```

**Legacy prefixes** (0-4 bytes): Operand size override (66h), address size
override (67h), segment overrides (26h, 2Eh, 36h, 3Eh, 64h, 65h), LOCK (F0h),
REP/REPNE (F2h, F3h).

**REX prefix** (x86-64 only, 1 byte, 40h-4Fh): Extends register addressing
from 8 to 16 registers. Bits: 0100WRXB, where W=64-bit operand, R=extends
ModR/M reg, X=extends SIB index, B=extends ModR/M r/m or SIB base.

**Opcode** (1-3 bytes): Primary opcode (1 byte), or escape sequences: `0F` +
1 byte (two-byte opcode), `0F 38` + 1 byte (three-byte opcode), `0F 3A` + 1
byte (three-byte opcode). VEX/EVEX prefixes absorb the escape bytes.

**ModR/M byte** (1 byte): Encodes addressing mode and register operands.

```
Bits 7-6: Mod (addressing mode: 00=indirect, 01=disp8, 10=disp32, 11=register)
Bits 5-3: Reg (register operand or opcode extension)
Bits 2-0: R/M (register or memory operand)
```

**SIB byte** (Scale-Index-Base, 1 byte): Used when ModR/M specifies SIB
addressing (R/M=100 with Mod != 11).

```
Bits 7-6: Scale (00=*1, 01=*2, 10=*4, 11=*8)
Bits 5-3: Index register
Bits 2-0: Base register
```

Example: `MOV EAX, [RBX + RCX*4 + 0x10]`

```
Hex: 8B 44 8B 10
  8B       = opcode for MOV r32, r/m32
  44       = ModR/M: Mod=01 (disp8), Reg=000 (EAX), R/M=100 (SIB follows)
  8B       = SIB: Scale=10 (*4), Index=001 (RCX), Base=011 (RBX)
  10       = displacement: 0x10 (16)
```

### Thumb and Thumb-2 (ARM)

ARM introduced Thumb mode (1995) with 16-bit instructions for code density,
and Thumb-2 (ARMv6T2, 2003) which mixes 16-bit and 32-bit instructions.
ARM64 (AArch64) returned to fixed 32-bit encoding but with a redesigned,
cleaner instruction set.

---

## 5. Opcode Tables

An opcode table is the mapping from bit patterns to operations. It is the
Rosetta Stone of an ISA -- the definitive reference for what each instruction
encoding means.

### x86 Opcode Maps

The x86 opcode space is organized into multiple maps:

**Primary opcode map (1-byte)**: 256 entries (00h-FFh). Examples:

| Hex  | Instruction         | Description                        |
|------|--------------------|------------------------------------|
| 00   | ADD r/m8, r8       | Add byte register to r/m           |
| 01   | ADD r/m32, r32     | Add dword register to r/m          |
| 50+r | PUSH r32           | Push register (50=EAX...57=EDI)    |
| 58+r | POP r32            | Pop register (58=EAX...5F=EDI)     |
| 89   | MOV r/m32, r32     | Move register to r/m               |
| 8B   | MOV r32, r/m32     | Move r/m to register               |
| 90   | NOP                | No operation (actually XCHG EAX,EAX)|
| B8+r | MOV r32, imm32     | Move immediate to register         |
| C3   | RET                | Return from procedure              |
| CC   | INT 3              | Breakpoint interrupt               |
| E8   | CALL rel32         | Call with 32-bit relative offset   |
| E9   | JMP rel32          | Jump with 32-bit relative offset   |
| EB   | JMP rel8           | Jump with 8-bit relative offset    |
| FF/2 | CALL r/m32         | Indirect call                      |

**Two-byte opcode map (0Fh escape)**: Instructions prefixed with 0Fh.

| Hex    | Instruction      | Description                        |
|--------|------------------|------------------------------------|
| 0F 05  | SYSCALL          | System call (x86-64)               |
| 0F 1F  | NOP r/m          | Multi-byte NOP (hint)              |
| 0F 31  | RDTSC            | Read time-stamp counter            |
| 0F 84  | JE rel32         | Jump if equal (conditional)        |
| 0F AF  | IMUL r32, r/m32  | Signed multiply                    |
| 0F B6  | MOVZX r32, r/m8  | Move with zero-extend              |

**Three-byte maps (0F38h, 0F3Ah)**: SSE4, AES-NI, and other extensions.

### ARM A32 Opcode Decoding

ARM decoding is hierarchical:

1. **Condition field** (bits 31-28): 15 conditions + "unconditional" (1111).
2. **Instruction class** (bits 27-25):
   - 000 = Data processing / multiply / extra load-store
   - 001 = Data processing immediate
   - 010 = Load/store immediate offset
   - 011 = Load/store register offset
   - 100 = Load/store multiple
   - 101 = Branch
   - 110 = Coprocessor load/store
   - 111 = Coprocessor data processing / SWI
3. **Further decoding** within each class using remaining bits.

### RISC-V Opcode Decoding

RISC-V uses a systematic layered approach:

**Base opcode** (bits 6-0): Major instruction groups.

| Bits 6-0   | Name     | Type   | Description              |
|-----------|----------|--------|--------------------------|
| 0110111   | LUI      | U-type | Load upper immediate     |
| 0010111   | AUIPC    | U-type | Add upper imm to PC      |
| 1101111   | JAL      | J-type | Jump and link             |
| 1100111   | JALR     | I-type | Jump and link register    |
| 1100011   | BRANCH   | B-type | Conditional branches      |
| 0000011   | LOAD     | I-type | Load from memory          |
| 0100011   | STORE    | S-type | Store to memory           |
| 0010011   | OP-IMM   | I-type | ALU immediate operations  |
| 0110011   | OP       | R-type | ALU register operations   |

**funct3** (bits 14-12): Sub-operation within opcode group. For OP-IMM:
- 000 = ADDI, 010 = SLTI, 011 = SLTIU, 100 = XORI, 110 = ORI, 111 = ANDI

**funct7** (bits 31-25): Further disambiguation for R-type. Distinguishes
ADD (0000000) from SUB (0100000), SRL from SRA, etc.

---

## 6. Magic Numbers and File Format Signatures

Operating systems and tools identify binary file types by **magic numbers** --
specific byte sequences at known offsets, usually the start of the file.

### Executable Format Signatures

| Format  | Magic bytes (hex)        | ASCII (if readable) | Platform        |
|---------|--------------------------|---------------------|-----------------|
| ELF     | 7F 45 4C 46             | .ELF                | Linux, BSD, etc |
| Mach-O  | FE ED FA CE             | (none)              | macOS (32-bit)  |
| Mach-O  | FE ED FA CF             | (none)              | macOS (64-bit)  |
| Mach-O  | CA FE BA BE             | (none)              | macOS (universal/fat) |
| PE/COFF | 4D 5A                   | MZ                  | Windows         |
| Java    | CA FE BA BE             | (none)              | JVM class files |
| Wasm    | 00 61 73 6D             | .asm                | WebAssembly     |
| a.out   | 01 07                   | (none)              | Historic Unix   |
| DEX     | 64 65 78 0A 30 33 35 00 | dex.035.            | Android         |
| COM     | (no magic -- raw code)  | N/A                 | DOS .COM files  |

Note the collision: Mach-O universal binary and Java class files both use
`CA FE BA BE`. The OS disambiguates by context (file extension, loader type).

### ELF Header In Detail

The ELF (Executable and Linkable Format) header begins with a 16-byte
identification block:

```
Offset  Size  Field         Value
0x00    4     Magic         7F 45 4C 46 (.ELF)
0x04    1     Class         01=32-bit, 02=64-bit
0x05    1     Endianness    01=little, 02=big
0x06    1     Version       01 (current)
0x07    1     OS/ABI        00=System V, 03=Linux, etc.
0x08    8     Padding       00 00 00 00 00 00 00 00
0x10    2     Type          01=relocatable, 02=executable, 03=shared, 04=core
0x12    2     Machine       03=x86, 3E=x86-64, B7=ARM64, F3=RISC-V
```

### PE Header (Windows)

Windows executables start with the DOS "MZ" header (after Mark Zbikowski, the
DOS developer who designed the format). The actual PE signature is at the
offset specified by the `e_lfanew` field at offset 0x3C in the DOS header:

```
Offset 0x00: 4D 5A        (MZ -- DOS header)
Offset 0x3C: pointer to PE signature
PE signature: 50 45 00 00  (PE\0\0)
```

The DOS header exists for backward compatibility -- if you run a modern Windows
executable under DOS, the DOS stub prints "This program cannot be run in DOS
mode" and exits.

### The CAFEBABE Story

`CA FE BA BE` was chosen by James Gosling for the Java class file format. The
story, as told by Patrick Naughton [CHECK], is that the team frequented a cafe
called St. Michael's Alley in Palo Alto (later called Cafe Dead, associated
with the Grateful Dead). "CAFE BABE" was a playful hex-readable value.
`CA FE D0 0D` ("cafe dood") is used as a secondary signature for Java
serialization files [CHECK].

---

## 7. Microcode

### What Microcode Is

In Complex Instruction Set Computing (CISC) architectures -- primarily x86 --
the machine code instructions that the programmer sees are not directly
executed by the hardware. Instead, each machine instruction is decoded into one
or more **micro-operations** (uops or micro-ops) that the execution units
actually carry out.

Microcode is the firmware that controls this translation. It sits in a ROM or
writable control store inside the CPU and maps complex machine instructions to
sequences of simpler micro-operations.

### Why Microcode Exists

Consider the x86 `REP MOVSB` instruction (repeat move string byte). This
single instruction can copy an arbitrary number of bytes from one memory
location to another. Implementing this directly in hardware logic for all edge
cases would be enormously complex. Instead, the microcode sequencer expands it
into a loop of simpler memory read and write micro-operations.

Other examples of microcoded x86 instructions:
- `CPUID` -- returns processor identification data
- `WRMSR`/`RDMSR` -- write/read model-specific registers
- `XSAVE`/`XRSTOR` -- save/restore extended processor state
- `ENTER`/`LEAVE` -- stack frame setup/teardown (ENTER is notoriously slow
  because its microcode is complex)
- Most x87 FPU instructions (FSIN, FCOS, etc.)

### Microcode vs. Hardwired Decode

In modern x86 processors (Intel Core series, AMD Zen series), **most common
instructions are decoded directly by hardware** into 1-4 uops without
consulting the microcode ROM. Only complex or rarely-used instructions invoke
the microcode sequencer. This hybrid approach gets the speed benefit of
hardwired decode for the common case while retaining microcode flexibility for
the complex cases.

Typical uop counts for common x86 instructions (approximate, varies by
microarchitecture):

| Instruction       | Typical uop count |
|-------------------|-------------------|
| ADD reg, reg      | 1                 |
| MOV reg, [mem]    | 1 (fused micro-op)|
| PUSH reg          | 1 (macro-fused)   |
| CALL rel32        | 2-3               |
| DIV               | 10-90+ (varies with operand size) |
| CPUID             | ~100+             |
| REP MOVSB         | variable (microcoded loop) |

### Microcode Updates

Intel and AMD ship microcode updates that modify the behavior of the CPU's
instruction decoder. These updates are loaded by the BIOS/UEFI firmware at boot
time or by the operating system early in the boot process.

On Linux, microcode updates are in `/lib/firmware/intel-ucode/` or
`/lib/firmware/amd-ucode/`. The `intel-microcode` or `amd64-microcode` packages
provide them. The kernel's early initramfs loads them before the rest of the
system starts.

Microcode updates became widely known after the **Spectre** and **Meltdown**
vulnerabilities (January 2018). The mitigations required changes to how the CPU
handles speculative execution, and many of these changes were delivered as
microcode updates. For example:
- Microcode updates added the `IBRS` (Indirect Branch Restricted Speculation)
  and `STIBP` (Single Thread Indirect Branch Predictors) features.
- The `VERW` instruction's microcode was modified to also flush
  microarchitectural buffers (MDS mitigation).

### RISC and Microcode

Most RISC architectures (ARM, RISC-V, MIPS, SPARC) do **not** use microcode.
Their instructions are simple enough to be decoded directly by hardware logic.
Each instruction maps to a fixed set of control signals that drive the
execution units. This is one of the defining characteristics of RISC: the
instruction set is designed to be directly implementable in hardware without
microcode.

However, there are exceptions. Some ARM implementations use limited microcode
for complex operations. And the boundary is blurry -- modern x86 processors'
"direct decode" path for simple instructions is functionally similar to RISC
hardwired decode.

---

## 8. Object Files and Executables

Machine code does not exist in isolation. It is packaged in structured file
formats that contain not just the code but also metadata needed by linkers,
loaders, and debuggers.

### File Types

| Extension          | Type                     | Contains                          |
|--------------------|--------------------------|-----------------------------------|
| .o / .obj          | Object file (relocatable)| Machine code + relocation info     |
| .exe (Windows)     | Executable               | Machine code + load info           |
| (no extension, Linux) | ELF executable        | Machine code + load info           |
| .so / .dll / .dylib | Shared library          | Machine code + export tables       |
| .a / .lib          | Static library (archive) | Collection of .o files             |

### Sections in an Object File

Machine code lives in **sections** within the object file:

- **`.text`**: Executable machine code. This is where the compiled instructions
  go. Read-only, executable.
- **`.data`**: Initialized global/static variables. Read-write, not executable.
- **`.bss`**: Uninitialized global/static variables. Takes no space in the file
  (just a size declaration). Zeroed at load time.
- **`.rodata`**: Read-only data (string literals, constants). Read-only, not
  executable.
- **`.symtab`**: Symbol table. Maps names to addresses (functions, globals).
- **`.strtab`**: String table. Stores the actual symbol name strings.
- **`.rel.text`** / **`.rela.text`**: Relocation entries for the .text section.
  Tell the linker which bytes in the machine code need to be patched with
  final addresses.
- **`.debug_info`**, **`.debug_line`**, etc.: DWARF debugging information.

### Relocation

When a compiler generates machine code for a single source file, it does not
know the final addresses of functions and variables defined in other files.
It emits **relocation entries** that say "at offset X in the .text section,
there is a reference to symbol Y that needs to be patched."

Example: if `foo.c` calls `bar()` defined in `bar.c`:

```
; In foo.o's .text section:
E8 00 00 00 00    ; CALL with placeholder address (00000000)

; In foo.o's .rela.text:
Offset: 0x01 (byte after the E8 opcode)
Symbol: bar
Type:   R_X86_64_PC32 (PC-relative 32-bit relocation)
Addend: -4 (account for the 4 bytes of the offset itself)
```

The linker resolves `bar` to its final address and patches the `00 00 00 00`
with the correct relative offset.

### The Linker's Job

The linker (`ld`, `lld`, `gold`, `link.exe`):

1. Reads all input object files and libraries.
2. Resolves symbols: matches references to definitions.
3. Merges sections: all `.text` sections become one `.text` segment, etc.
4. Applies relocations: patches machine code with final addresses.
5. Writes the output executable or shared library.

The result is a self-contained binary where all internal references are
resolved. External references to shared libraries remain as dynamic relocations,
resolved at load time by the dynamic linker.

---

## 9. The Binary-to-Execution Pipeline

How does machine code get from a file on disk into the CPU?

### Step 1: Invocation

The user (or another program) requests execution: `./myprogram` on the command
line, `execve()` system call, or double-clicking an icon.

### Step 2: Kernel Identifies the Format

The kernel reads the first bytes of the file to identify its format:
- `7F 45 4C 46` -> ELF loader
- `23 21` (`#!`) -> Script interpreter (reads the shebang line)
- Other formats handled by `binfmt_misc` on Linux

### Step 3: ELF Loading (Linux)

The kernel's ELF loader (`fs/binfmt_elf.c` in the Linux source):

1. Reads the ELF header to find the program header table.
2. Iterates through `PT_LOAD` segments, mapping each into the process's virtual
   address space using `mmap()`.
3. Sets memory protections: `.text` gets read+execute, `.data` gets
   read+write, `.rodata` gets read-only.
4. If the binary is dynamically linked, reads the `PT_INTERP` segment to find
   the dynamic linker path (typically `/lib64/ld-linux-x86-64.so.2`).
5. Maps the dynamic linker into memory and transfers control to it.

### Step 4: Dynamic Linking

The dynamic linker (`ld.so` / `ld-linux.so`):

1. Reads the `PT_DYNAMIC` segment to find the list of needed shared libraries.
2. Loads each shared library (recursively loading their dependencies).
3. Performs **relocations**: patches addresses in the GOT (Global Offset Table)
   and resolves PLT (Procedure Linkage Table) entries.
4. Runs initialization functions (`__init` sections, C++ global constructors).
5. Transfers control to the program's entry point.

Lazy binding (default on most systems): PLT entries are not resolved until
first called. The first call goes through the PLT stub, which calls the dynamic
linker to resolve the symbol, patches the GOT entry, and then jumps to the
resolved address. Subsequent calls go directly through the patched GOT entry.

### Step 5: Entry Point

Control reaches the program's entry point (the `e_entry` field in the ELF
header). This is typically NOT `main()`. It is `_start` (provided by the C
runtime, e.g., `crt0.o`), which:

1. Sets up the stack frame.
2. Calls `__libc_start_main()`.
3. Which calls `main(argc, argv, envp)`.
4. When `main()` returns, calls `exit()`.

### Step 6: CPU Execution

The CPU's instruction pointer (RIP on x86-64, PC on ARM) now points to the
first instruction at `_start`. The fetch-decode-execute cycle begins:

1. **Fetch**: The instruction fetch unit reads bytes from the address in the
   instruction pointer. On modern CPUs, this happens through the instruction
   cache (L1I).
2. **Decode**: The decode unit interprets the byte pattern as an instruction.
   On x86, this is complex (variable-length, microcode). On ARM/RISC-V, it is
   simpler (fixed-width).
3. **Execute**: The instruction is dispatched to the appropriate execution unit
   (ALU, FPU, load/store unit, branch unit).
4. **Retire**: Results are committed to the architectural state (registers,
   memory) in program order.

On a modern superscalar out-of-order processor, multiple instructions are in
flight simultaneously at different pipeline stages. But from the programmer's
perspective (the ISA level), instructions execute one at a time in order.

---

## 10. Endianness at the Machine Code Level

### What Endianness Is

Endianness determines how multi-byte values are stored in memory -- which byte
goes at the lowest address.

**Little-endian**: Least significant byte first (lowest address).
**Big-endian**: Most significant byte first (lowest address).

Consider the 32-bit value `0x12345678` stored at address `0x1000`:

```
Little-endian (x86, ARM default, RISC-V):
Address:  0x1000  0x1001  0x1002  0x1003
Value:      78      56      34      12

Big-endian (network byte order, SPARC, Motorola 68k):
Address:  0x1000  0x1001  0x1002  0x1003
Value:      12      34      56      78
```

### How Endianness Affects Machine Code

**Immediate values in instructions**: On x86 (little-endian), the instruction
`MOV EAX, 0x12345678` is encoded as:

```
B8 78 56 34 12
```

The opcode `B8` is followed by the immediate value `0x12345678` stored in
little-endian order: `78 56 34 12`. A hex dump of the machine code shows the
bytes "reversed" relative to how we write the number.

**Displacement and offset fields**: Same rule. The instruction `JMP +0x100`
on x86:

```
E9 00 01 00 00    (32-bit relative offset 0x00000100 in little-endian)
```

**Opcode bytes themselves**: Endianness does NOT affect single-byte values or
the order of opcode bytes. The opcode `0F 84` (JE on x86) is always `0F` at
the lower address and `84` at the higher address, regardless of endianness.
Endianness only affects multi-byte data values, not the instruction stream
structure.

### Bi-Endian Architectures

Some architectures support both byte orders:

- **ARM**: Bi-endian. Can operate in little-endian (LE, the default and most
  common) or big-endian (BE) mode. Controlled by the CPSR.E bit (ARMv6+) or
  the SCTLR.EE bit. Modern ARM (ARMv8/AArch64) is little-endian by default;
  big-endian is possible but rare.
- **MIPS**: Bi-endian. MIPS cores can be configured for either endianness.
  Common in networking (big-endian) and consumer devices (little-endian).
- **PowerPC**: Originally big-endian. POWER8/9 (IBM) added little-endian
  support; Linux on POWER runs little-endian by default since POWER8.
- **RISC-V**: Little-endian in the base specification. Big-endian is not part
  of the ratified base ISA.

### Network Byte Order

Network protocols (TCP/IP) use big-endian byte order ("network byte order").
This is why socket programming requires `htonl()` / `ntohl()` (host-to-network-
long / network-to-host-long) conversion functions. On a big-endian machine,
these are no-ops. On a little-endian machine (x86), they perform byte swapping.

The x86 `BSWAP` instruction (opcode `0F C8+r`) exists specifically for
efficient byte-order swapping.

---

## 11. Position-Independent Code (PIC)

### The Problem

Early programs were linked to run at fixed memory addresses. The linker would
resolve all addresses at link time, and the loader would place the program at
exactly those addresses. This worked for standalone executables but fails for:

- **Shared libraries**: Multiple programs use the same library, but each
  program has a different memory layout. The library cannot be hardcoded to one
  address.
- **Address Space Layout Randomization (ASLR)**: A security technique that
  loads programs and libraries at random addresses to thwart exploitation.

### Position-Independent Code

PIC is machine code that works correctly regardless of where it is loaded in
memory. It uses only **relative** addressing -- all code and data references
are expressed as offsets from the current instruction pointer, not as absolute
addresses.

### x86-64: RIP-Relative Addressing

x86-64 introduced RIP-relative addressing as a first-class addressing mode.
Any instruction that accesses memory can use the current instruction pointer
(RIP) as a base:

```
; Access a global variable 'counter':
; Non-PIC (absolute):  MOV EAX, [0x601000]      -- hardcoded address
; PIC (RIP-relative):  MOV EAX, [RIP + offset]  -- relative to current IP

; Machine code for RIP-relative MOV:
8B 05 XX XX XX XX    (ModR/M byte 05 signals RIP-relative addressing)
```

The `XX XX XX XX` is a signed 32-bit offset from the end of the instruction to
the target address. The linker/loader calculates this offset.

### ARM64: ADRP + ADD / LDR

ARM64 uses the `ADRP` instruction to form a PC-relative page address and
a follow-up `ADD` or `LDR` to add the page offset:

```
ADRP X0, symbol@PAGE       ; X0 = PC-aligned-to-4K + (page offset of symbol)
ADD  X0, X0, symbol@PAGEOFF ; X0 = exact address of symbol
LDR  W1, [X0]              ; W1 = value at symbol
```

`ADRP` forms a 4KB-aligned address within a +/-4GB range of the PC. The 21-bit
immediate (split across the instruction) is shifted left by 12 to form a page
offset. Combined with a 12-bit `ADD` offset, this covers any address within a
4GB range around the PC.

### GOT and PLT

For shared libraries, even PIC code needs to access global variables and call
functions that might be in other shared libraries. Two data structures enable
this:

**GOT (Global Offset Table)**: A table of pointers in the data section. Each
entry holds the absolute address of an external symbol. PIC code accesses
external symbols indirectly through the GOT:

```
; Access external variable 'errno':
MOV RAX, [RIP + errno@GOTPCREL]  ; Load errno's address from GOT
MOV EAX, [RAX]                    ; Load the value of errno
```

The dynamic linker fills in the GOT entries at load time.

**PLT (Procedure Linkage Table)**: A set of small code stubs in the text
section. Each PLT entry handles lazy binding for one external function:

```
; PLT entry for printf:
printf@PLT:
    JMP [printf@GOTPLT]     ; Jump through GOT entry
    PUSH relocation_index    ; If GOT not yet resolved, push index
    JMP PLT0                 ; Call dynamic linker to resolve
```

On first call, the GOT entry points back to the PUSH instruction, triggering
resolution. After resolution, the GOT entry points directly to the real
`printf`, and subsequent calls bypass the resolver entirely.

### ASLR and PIE

A **Position-Independent Executable (PIE)** is an executable compiled entirely
as PIC. Modern Linux distributions compile all executables as PIE by default
(`gcc -pie`). Combined with ASLR, the kernel loads the executable at a random
base address on each run, making exploitation significantly harder.

---

## 12. Self-Modifying Code

### The Concept

Self-modifying code is a program that alters its own machine code instructions
during execution. Because of the stored-program concept (instructions are data
in memory), this is architecturally possible: a program can write new byte
patterns over its existing instructions.

### Historical Uses

- **Early computers**: Used to modify instruction addresses in loops because
  early machines lacked index registers. The program would literally increment
  the address field of a LOAD instruction each iteration.
- **Overlays**: Before virtual memory, programs modified themselves to load
  different code sections into the same memory area.
- **Optimization**: The DEC PDP-10's `XCT` instruction executed the word at a
  given address as an instruction, enabling dynamic instruction construction.
- **Copy protection**: Software protection schemes would decrypt or deobfuscate
  their own code at runtime. The executable on disk was encrypted; the
  decryption routine would write the real machine code into memory before
  executing it.

### Modern Legitimate Forms

**JIT Compilation**: Just-In-Time compilers (V8 for JavaScript, HotSpot for
Java, LuaJIT, .NET RyuJIT) generate machine code at runtime. The runtime
allocates executable memory, writes machine code bytes into it, and jumps to
the generated code. This is the most important modern form of self-modifying
code.

On Linux, the sequence is:
```c
void *mem = mmap(NULL, size, PROT_READ | PROT_WRITE,
                 MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
// Write machine code bytes into mem
mprotect(mem, size, PROT_READ | PROT_EXEC);  // W^X: make executable, remove write
// Jump to mem
```

**Dynamic binary translation**: QEMU translates guest machine code to host
machine code at runtime. Apple's Rosetta 2 translates x86-64 to ARM64.

**Runtime code patching**: The Linux kernel patches its own code at boot time
based on detected CPU features (alternatives framework). For example, it might
replace a generic spinlock implementation with a CPU-specific optimized version.

### Cache Coherence Issues

Self-modifying code creates a fundamental hardware challenge: the instruction
cache (I-cache) and data cache (D-cache) may hold different views of the same
memory.

When a program writes new machine code to memory, the write goes through the
D-cache. But the I-cache may still hold the old instructions. On x86, the
hardware maintains coherence between I-cache and D-cache automatically (at a
performance cost). On ARM and other architectures, the software must explicitly
manage this:

```arm
; ARM cache maintenance for self-modifying code:
DC CVAU, Xn       ; Clean data cache to point of unification
DSB ISH            ; Data synchronization barrier
IC IVAU, Xn        ; Invalidate instruction cache
DSB ISH            ; Ensure completion
ISB                ; Instruction synchronization barrier (flush pipeline)
```

Failure to do this on ARM results in the CPU executing stale instructions from
the I-cache -- a subtle and difficult-to-debug failure.

### Harvard Architecture Complications

True Harvard architecture machines (where instruction and data memories are
physically separate) cannot support self-modifying code at all -- there is no
way for data writes to affect instruction memory. Most modern "Harvard"
architectures are actually **modified Harvard**: they have separate I-cache and
D-cache (for performance) but share a unified main memory (enabling
self-modifying code with proper cache management).

---

## 13. Binary Analysis

Binary analysis is the art and science of understanding machine code without
(necessarily) having the source code.

### Static Analysis

Examining the binary without executing it:

**Disassembly** converts machine code bytes back to assembly mnemonics.

- **Linear sweep**: Start at the beginning, decode each instruction, advance
  by its length, repeat. Simple but fails on data embedded in code.
- **Recursive descent**: Start at known entry points, follow control flow.
  Better at distinguishing code from data but can miss code reachable only
  through indirect jumps.

Major tools:

- **IDA Pro** (Hex-Rays): The industry standard since the 1990s. Commercial.
  Supports 50+ processor architectures. The Hex-Rays decompiler produces C-like
  pseudocode from machine code.
- **Ghidra** (NSA, open-sourced 2019): Free, Java-based, comparable to IDA for
  many tasks. Includes a decompiler. Supports scripting in Java and Python.
- **Binary Ninja** (Vector 35): Modern, developer-friendly. Multiple levels of
  intermediate representation (Lifted IL, Low Level IL, Medium Level IL, High
  Level IL).
- **radare2 / Cutter**: Open-source reverse engineering framework with CLI
  (radare2) and GUI (Cutter) interfaces.
- **objdump** (GNU binutils): Basic but ubiquitous. `objdump -d` disassembles
  a binary. `objdump -x` shows all headers.
- **capstone**: Lightweight, multi-architecture disassembly library. Used as
  a component in many other tools.

### Dynamic Analysis

Running the binary and observing its behavior:

- **GDB** (GNU Debugger): Step through machine code instruction by instruction.
  Set breakpoints on specific addresses. Examine registers and memory.
  `layout asm` shows the disassembly view.
- **strace**: Traces system calls. Shows every interaction between the program
  and the kernel.
- **ltrace**: Traces shared library calls.
- **Valgrind**: Memory error detector (Memcheck), cache profiler (Cachegrind),
  call-graph profiler (Callgrind), heap profiler (Massif). Works by dynamic
  binary instrumentation -- translates the program's machine code into
  instrumented code that runs on a synthetic CPU.
- **DynamoRIO**: Dynamic binary instrumentation framework. Allows custom
  analysis tools to be inserted into the instruction stream at runtime.
- **Intel Pin**: Similar to DynamoRIO, Intel's dynamic binary instrumentation
  tool.
- **perf**: Linux performance profiling. Samples the program counter at regular
  intervals (or on hardware events) to build execution profiles at the
  instruction level.

### Symbolic Execution

Exploring all possible execution paths by treating inputs as symbolic variables:

- **angr** (UC Santa Barbara): Python framework for symbolic execution,
  constraint solving, and binary analysis. Can find inputs that reach specific
  code paths.
- **KLEE** (based on LLVM): Operates on LLVM bitcode rather than machine code.
  Generates test inputs that achieve high code coverage.
- **Manticore** (Trail of Bits): Symbolic execution for EVM (Ethereum) and x86
  binaries.

### Fuzzing

Bombarding the binary with semi-random inputs to find crashes (which indicate
bugs, often exploitable):

- **AFL / AFL++**: Coverage-guided fuzzing. Instruments the binary (at compile
  time or via QEMU/binary rewriting) to track which code paths are hit. Mutates
  inputs to explore new paths. AFL++ is the actively maintained community fork.
- **libFuzzer**: LLVM's in-process fuzzer. Requires source code (compile-time
  instrumentation) but very efficient.
- **honggfuzz**: Google's fuzzer. Supports hardware-based feedback (Intel PT,
  Intel BTS).

---

## 14. Machine Code in Security

Machine code is both the weapon and the target in software security.

### Shellcode

Shellcode is handcrafted machine code designed to be injected into a running
process (typically via a buffer overflow) to perform an attacker-chosen action,
traditionally spawning a shell.

Classic x86-64 Linux shellcode to call `execve("/bin/sh", NULL, NULL)`:

```
; 27 bytes
48 31 F6                ; xor rsi, rsi        (argv = NULL)
56                      ; push rsi             (null terminator)
48 BF 2F 62 69 6E      ; movabs rdi, "/bin/sh" (as 64-bit integer)
2F 73 68 00
57                      ; push rdi
48 89 E7                ; mov rdi, rsp         (pointer to "/bin/sh" on stack)
48 31 D2                ; xor rdx, rdx         (envp = NULL)
48 31 C0                ; xor rax, rax
B0 3B                   ; mov al, 59           (syscall number for execve)
0F 05                   ; syscall
```

Constraints on shellcode:
- Often cannot contain null bytes (0x00) because the injection vector is
  `strcpy()` or similar, which terminates on null.
- Must be position-independent (the attacker does not know exactly where in
  memory the shellcode will land).
- Must be small (buffer space is limited).

### NOP Sleds

A NOP sled is a sequence of single-byte NOP instructions (`90` on x86) placed
before shellcode. If the attacker can only approximately predict where
execution will land, the NOP sled provides a "runway" -- execution slides
through the NOPs until it reaches the actual shellcode.

```
90 90 90 90 90 90 90 90 ... [shellcode]
```

Other "NOP-equivalent" instructions can be used to evade signature detection:
`XCHG EAX, EAX` (also encoded as `90`), multi-byte NOPs (`0F 1F 00`,
`0F 1F 40 00`, etc.), or any instruction that does not change meaningful state.

### Return-Oriented Programming (ROP)

ROP exploits don't inject new machine code at all. Instead, they chain together
existing fragments of machine code ("gadgets") already present in the process's
memory (in libc, the executable itself, etc.). Each gadget ends with a `RET`
instruction (`C3`), which pops the next address from the stack and jumps to it.

By carefully crafting the stack, the attacker chains gadgets to perform
arbitrary operations:

```
Stack layout (addresses point to existing code):
[addr of: POP RDI; RET]
[value for RDI: address of "/bin/sh"]
[addr of: POP RSI; RET]
[0x0000000000000000]
[addr of: POP RDX; RET]
[0x0000000000000000]
[addr of: syscall; RET]
```

ROP defeats the W^X (Write XOR Execute) protection because it does not require
executable writable memory -- it reuses existing executable code. It also
defeats simple stack canaries because the overflow can be crafted to preserve
the canary.

### Unintended Instructions

On x86, because instructions are variable-length, starting disassembly at
different byte offsets produces different instructions. Attackers exploit this:
a sequence that is part of one instruction when decoded normally becomes a
useful gadget when decoded starting at an offset.

Example: the bytes `48 89 E5 C3` normally decode as:

```
48 89 E5    MOV RBP, RSP
C3          RET
```

But starting at offset 1: `89 E5 C3` decodes as:

```
89 E5       MOV EBP, ESP
C3          RET
```

And starting at offset 2: `E5 C3` decodes as:

```
E5 C3       IN EAX, 0xC3    (reads I/O port 0xC3)
```

This property of variable-length encoding creates a vast hidden instruction
set within any x86 binary. ROP gadget finders (ROPgadget, ropper) scan for
these unintended instruction sequences.

### Polymorphic and Metamorphic Code

**Polymorphic code** encrypts its payload and prepends a different decryption
stub each time it propagates. The encrypted body looks different on each copy,
defeating signature-based detection. The decryption stub is also mutated
(register renaming, instruction reordering, junk insertion) to avoid detection.

**Metamorphic code** rewrites its entire body (not just a decryption stub) each
time it propagates. It uses techniques like:
- Instruction substitution: `ADD EAX, 1` -> `SUB EAX, -1` -> `INC EAX`
- Register reassignment: Use different registers for the same computation
- Code transposition: Reorder independent instructions
- Junk code insertion: Add instructions that have no net effect

### Packing and Unpacking

**Packers** compress or encrypt an executable. The packed executable contains a
small unpacking stub plus the compressed/encrypted original. At runtime, the
stub decompresses/decrypts the original into memory and jumps to it.

Common packers: UPX (legitimate compression), Themida/WinLicense (commercial
protection), custom packers used by malware. Analysts must unpack the binary
before they can analyze the actual machine code.

### Code Signing and Integrity

Modern operating systems verify machine code integrity:
- **Windows Authenticode**: Digital signatures on PE executables.
- **macOS code signing**: Mandatory since macOS 10.15 Catalina for notarized
  apps. Uses `codesign` and Apple's signing infrastructure.
- **Linux**: dm-verity for boot-time integrity. IMA (Integrity Measurement
  Architecture) for runtime verification. Individual binary signing is less
  common but growing.
- **Secure Boot**: UEFI verifies that the bootloader's machine code is signed
  before executing it.

---

## 15. The Relationship Between Machine Code and Everything Above

### Machine Code as Universal Output

Every high-level programming language, every compiler, every runtime -- their
ultimate purpose is to produce or execute machine code. The entire software
stack exists in service of this goal:

```
Python source
    -> Python bytecode (intermediate, NOT machine code)
    -> CPython interpreter (which IS machine code) executes bytecodes
    -> Some bytecodes trigger C library calls (which ARE machine code)

JavaScript source
    -> V8 parses and compiles to Ignition bytecode
    -> TurboFan optimizing compiler emits x86-64 or ARM64 machine code
    -> The CPU runs that machine code directly

Rust source
    -> LLVM IR (intermediate representation)
    -> LLVM backend emits machine code for the target architecture
    -> Linker produces an executable containing that machine code
    -> The CPU runs it
```

### Compilers: The Machine Code Factories

A compiler's backend is a machine code generator. Its job:

1. **Instruction selection**: Map abstract operations to concrete machine
   instructions. A high-level "add two integers" might become `ADD`,
   `LEA`, or an immediate add, depending on the operands and context.
2. **Register allocation**: Assign abstract virtual registers to physical
   machine registers. The x86-64 has 16 general-purpose registers; ARM64
   has 31. If a function needs more simultaneously live values than there
   are registers, some must be "spilled" to memory (using STORE/LOAD
   instructions).
3. **Instruction scheduling**: Order instructions to maximize throughput
   and minimize pipeline stalls. Modern CPUs can execute multiple
   instructions per cycle, but only if there are no data dependencies.
4. **Machine code emission**: Encode each instruction as its binary bit
   pattern and write it to the output file.

### JIT Compilers: Runtime Machine Code

JIT compilers blur the line between "compile time" and "run time." They
observe which code paths are hot (frequently executed), compile those paths
to optimized machine code, and redirect execution to the new code. This
means machine code is being generated as the program runs.

Notable JIT compilers:
- **V8 TurboFan** (JavaScript): Generates highly optimized x86-64 and ARM64
  machine code for hot JavaScript functions.
- **HotSpot C2** (Java): Compiles Java bytecode to machine code after profiling.
- **LuaJIT**: One of the fastest JIT compilers ever built. Emits machine code
  for x86, x86-64, ARM, and other targets.
- **.NET RyuJIT**: Compiles CIL (Common Intermediate Language) to machine code.
- **PyPy**: JIT compiler for Python. Applies tracing JIT to generate machine
  code for hot loops.

### Interpreters: The Slow Path Through Machine Code

Even "interpreted" languages execute machine code -- the machine code of the
interpreter itself. When CPython executes a Python bytecode like
`BINARY_ADD`, what actually runs is the C code (compiled to machine code)
inside CPython's evaluation loop that implements addition. The Python bytecode
is data consumed by the interpreter's machine code.

This is why JIT compilation provides such dramatic speedups: it eliminates the
overhead of the interpreter's dispatch loop and generates machine code that
directly performs the desired computation.

### The CPU's Perspective

From the CPU's perspective, there is no distinction between:
- Machine code from a C compiler
- Machine code from a JIT compiler
- Machine code from an assembler
- Machine code written by hand
- Machine code generated by malware

It is all just bit patterns at addresses. The CPU fetches, decodes, and
executes. It does not know or care about the provenance of the instructions.
This fundamental property -- that the CPU is an indiscriminate machine code
executor -- is both the foundation of general-purpose computing and the root of
most security challenges.

### Machine Code's Permanence

Higher-level languages come and go. Programming paradigms shift. But machine
code endures because it is defined by the hardware, and hardware maintains
backward compatibility for decades. An x86 binary compiled in 1985 for the
80386 will still run on a 2026 Intel or AMD processor. The machine code
interface is the most stable and enduring contract in computing.

This stability exists because breaking it would break every existing binary.
Intel added 64-bit mode (x86-64) as an extension, not a replacement. ARM added
AArch64 alongside the existing 32-bit mode. New instructions are added, but
old ones are never removed. The machine code contract, once made, is permanent.

---

## Appendix A: Quick Reference -- Instruction Sizes

| Architecture | Instruction width      | Notes                           |
|-------------|------------------------|---------------------------------|
| x86-16      | 1-10 bytes (approx)    | Variable, simpler than x86-32   |
| x86-32      | 1-15 bytes             | Variable, complex encoding      |
| x86-64      | 1-15 bytes             | Variable, REX/VEX/EVEX prefixes |
| ARM A32     | 32 bits (4 bytes)      | Fixed                          |
| ARM Thumb   | 16 bits (2 bytes)      | Fixed, reduced instruction set  |
| ARM Thumb-2 | 16 or 32 bits          | Mixed                          |
| AArch64     | 32 bits (4 bytes)      | Fixed, clean redesign           |
| MIPS32      | 32 bits (4 bytes)      | Fixed                          |
| MIPS16e     | 16 bits (2 bytes)      | Compressed, like Thumb          |
| RISC-V RV32I| 32 bits (4 bytes)      | Fixed base                     |
| RISC-V C ext| 16 bits (2 bytes)      | Compressed extension            |
| SPARC       | 32 bits (4 bytes)      | Fixed                          |
| Power ISA   | 32 bits (4 bytes)      | Fixed                          |
| z/Arch      | 2, 4, or 6 bytes       | Variable, three widths          |
| Itanium     | 128 bits (16 bytes)    | 3x41-bit instructions + 5-bit template |
| PDP-11      | 16-48 bits             | Variable (16-bit base + operands)|
| 6502        | 1-3 bytes              | Variable                       |
| Z80         | 1-4 bytes              | Variable, prefix bytes          |
| 68000       | 2-10 bytes             | Variable, 16-bit aligned        |
| AVR         | 16 or 32 bits          | Mostly 16-bit                  |

## Appendix B: Common x86 Machine Code Byte Patterns

These are byte patterns that any binary analyst learns to recognize on sight:

```
CC              INT 3 (breakpoint -- debuggers insert this)
90              NOP (actually XCHG EAX, EAX)
C3              RET (return near)
C2 XX XX        RET imm16 (return and pop XX XX bytes)
CB              RETF (return far)
55              PUSH RBP (function prologue)
48 89 E5        MOV RBP, RSP (function prologue)
5D              POP RBP (function epilogue)
E8 XX XX XX XX  CALL rel32
E9 XX XX XX XX  JMP rel32
EB XX           JMP rel8 (short jump)
74 XX           JE/JZ rel8
75 XX           JNE/JNZ rel8
0F 05           SYSCALL (x86-64)
0F 34           SYSENTER (x86-32)
CD 80           INT 0x80 (Linux x86-32 system call)
F4              HLT (halt -- privileged)
0F 0B           UD2 (undefined instruction -- used as a guaranteed trap)
48 C7 C0 ...    MOV RAX, imm32 (64-bit mode, sign-extended)
48 31 C0        XOR RAX, RAX (set RAX to zero -- common idiom)
```

## Appendix C: How to Examine Machine Code

### On Linux

```bash
# Disassemble an ELF binary
objdump -d -M intel ./myprogram

# Show all sections and headers
readelf -a ./myprogram

# Show raw hex + disassembly of .text section
objdump -s -j .text ./myprogram

# Disassemble raw bytes (no file format)
echo -ne '\x55\x48\x89\xe5\x48\x31\xc0\x5d\xc3' | \
    objdump -D -b binary -m i386:x86-64 -M intel /dev/stdin

# GDB: step through machine code
gdb ./myprogram
(gdb) break main
(gdb) run
(gdb) layout asm
(gdb) stepi          # step one machine instruction
(gdb) info registers # show all register values
(gdb) x/10i $rip     # disassemble 10 instructions at current IP

# Show dynamic library dependencies
ldd ./myprogram

# Trace system calls
strace ./myprogram

# Show ELF program headers (what the loader sees)
readelf -l ./myprogram
```

### On macOS

```bash
# Disassemble a Mach-O binary
otool -tv ./myprogram

# Show load commands (similar to ELF program headers)
otool -l ./myprogram

# Show shared library dependencies
otool -L ./myprogram

# Disassemble using llvm-objdump (if installed via LLVM/Homebrew)
llvm-objdump -d --x86-asm-syntax=intel ./myprogram
```

### On Windows

```powershell
# Using dumpbin (from Visual Studio)
dumpbin /disasm myprogram.exe
dumpbin /headers myprogram.exe
dumpbin /dependents myprogram.exe

# Using WinDbg
windbg myprogram.exe
# Then: u main (unassemble at main), t (trace/step), r (registers)
```

---

## Appendix D: Historical Timeline

| Year | Event |
|------|-------|
| 1936 | Turing publishes "On Computable Numbers" -- universal machine concept |
| 1941 | Zuse Z3 -- programmable but program on external film |
| 1943 | Colossus Mk 1 at Bletchley Park -- hardwired, switchable |
| 1945 | Von Neumann "First Draft of a Report on the EDVAC" |
| 1945 | ENIAC operational -- programmed by rewiring |
| 1948 | Manchester Baby (SSEM) -- first stored-program execution (June 21) |
| 1949 | EDSAC -- first practical stored-program computer (May 6) |
| 1949 | EDVAC operational |
| 1951 | UNIVAC I -- first commercial computer |
| 1952 | IBM 701 -- IBM's first commercial scientific computer |
| 1954 | Nathaniel Rochester's assembler for IBM 701 |
| 1957 | FORTRAN compiler (IBM 704) -- first high-level language compiler |
| 1964 | IBM System/360 -- standardized ISA across a product line |
| 1971 | Intel 4004 -- first commercial microprocessor (4-bit, 46 instructions) |
| 1974 | Intel 8080 -- 8-bit, foundation for CP/M and early micros |
| 1976 | Zilog Z80 -- backward-compatible 8080 extension |
| 1978 | Intel 8086 -- 16-bit, foundation of x86 |
| 1979 | Motorola 68000 -- 32-bit internals, 16-bit bus |
| 1985 | Intel 80386 -- 32-bit x86, paging, protected mode |
| 1985 | ARM1 -- first ARM processor (Acorn RISC Machine) |
| 1989 | MIPS R4000 -- 64-bit RISC |
| 1993 | Intel Pentium -- superscalar x86, dual pipeline |
| 1995 | ARM Thumb mode -- 16-bit compressed instructions |
| 1997 | Intel Pentium II -- out-of-order execution via uops (P6 microarchitecture) |
| 2003 | AMD Opteron / AMD64 -- 64-bit extension to x86 |
| 2004 | Intel EM64T (adopts AMD64 as x86-64) |
| 2011 | ARM Cortex-A15 -- first ARMv7 with LPAE |
| 2013 | ARMv8 / AArch64 -- 64-bit ARM, clean ISA redesign |
| 2018 | Spectre/Meltdown -- microarchitectural attacks, microcode patches |
| 2019 | RISC-V ratified base ISA (RV32I, RV64I) |
| 2020 | Apple M1 -- ARM64 desktop/laptop, Rosetta 2 x86-64 translation |
| 2024 | RISC-V adoption grows: Android, automotive, embedded, server [CHECK] |

---

*Machine code is where all abstraction ends. It is the final form of every
program, the raw instruction of silicon. No matter how many layers of language,
framework, runtime, and operating system stand above it, every computation
ultimately reduces to a CPU fetching a bit pattern from memory and executing it.
Understanding machine code is understanding what computers actually do.*

---

> PNW Research Series | Computer Science Cluster | MLC
> Part of the 287-project corpus
> Companion projects: ASM (Assembly Language), C, C++, Rust, Go, Java, JavaScript, Python

---

## Study Guide — Machine Code History & Theory

### Key moments

- **1937 Turing.** Universal machine, defines computation.
- **1945 EDVAC.** Stored-program concept. Von Neumann.
- **1947 Williams tube.** First working stored-program
  machine.
- **1964 IBM 360.** Family-compatible ISA.
- **1980s RISC.** Simplicity enables speed.
- **2010s RISC-V.** Open ISA.

## DIY — Read Turing 1937

*On Computable Numbers*. Long. Worth it. The universal
machine section is the foundation.

## DIY — Read von Neumann 1945

*First Draft of a Report on the EDVAC*. The 101-page
document that defined the stored-program computer.

## TRY — Boot an emulated PDP-11

SIMH runs PDP-11 with Unix v6. Boot it. Type `cc hello.c`.
You are now using the environment where Unix was born.

## Related College Departments

- [**history**](../../../.college/departments/history/DEPARTMENT.md)
- [**mathematics**](../../../.college/departments/mathematics/DEPARTMENT.md)
