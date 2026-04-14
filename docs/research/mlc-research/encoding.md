# Machine Language and Machine Code: Instruction Encoding

> PNW Research Series -- Computer Science Cluster
> Topic: ISA Encoding Formats, Bit-Level Anatomy, and Decoding
> Date: 2026-04-08

---

## Table of Contents

1. [x86-64 Instruction Encoding](#1-x86-64-instruction-encoding)
2. [Worked x86-64 Encoding Examples](#2-worked-x86-64-encoding-examples)
3. [ARM64 (AArch64) Encoding](#3-arm64-aarch64-encoding)
4. [Worked ARM64 Encoding Examples](#4-worked-arm64-encoding-examples)
5. [RISC-V Encoding](#5-risc-v-encoding)
6. [Worked RISC-V Encoding Examples](#6-worked-risc-v-encoding-examples)
7. [Variable-Length vs Fixed-Length](#7-variable-length-vs-fixed-length)
8. [The ModR/M and SIB Bytes](#8-the-modrm-and-sib-bytes)
9. [Prefixes](#9-prefixes)
10. [Immediate Encoding](#10-immediate-encoding)
11. [Branch and Jump Encoding](#11-branch-and-jump-encoding)
12. [NOP Encoding](#12-nop-encoding)
13. [Decoding](#13-decoding)
14. [Disassembly Challenges](#14-disassembly-challenges)

---

## 1. x86-64 Instruction Encoding

The x86-64 instruction set architecture has the most complex encoding of any
mainstream ISA. An instruction can be anywhere from 1 to 15 bytes long. The
maximum of 15 bytes is enforced by hardware -- any instruction that would
exceed this length generates an undefined opcode exception (#UD).

### General Instruction Format

```
+----------+--------+--------+---------+-----+--------------+-----------+
| Legacy   | REX /  | Opcode | ModR/M  | SIB | Displacement | Immediate |
| Prefixes | VEX /  | 1-3 B  | 0-1 B   | 0-1 | 0/1/2/4 B    | 0/1/2/4/  |
| 0-4 B    | EVEX   |        |         | B   |              | 8 B       |
+----------+--------+--------+---------+-----+--------------+-----------+
```

Every field is optional except the opcode. The CPU must parse from left to
right, consuming bytes and building up state, to determine where one
instruction ends and the next begins.

### Legacy Prefixes (0-4 bytes)

Legacy prefixes are single-byte values that precede the opcode. Up to four
groups exist, and at most one prefix from each group may be present:

| Group | Prefix | Hex    | Effect                                  |
|-------|--------|--------|-----------------------------------------|
| 1     | LOCK   | `F0`   | Atomic memory access (bus lock)         |
| 1     | REPNE  | `F2`   | Repeat string op while not equal / SSE  |
| 1     | REP    | `F3`   | Repeat string op while equal / SSE      |
| 2     | CS     | `2E`   | CS segment override / branch not taken  |
| 2     | SS     | `36`   | SS segment override                     |
| 2     | DS     | `3E`   | DS segment override / branch taken      |
| 2     | ES     | `26`   | ES segment override                     |
| 2     | FS     | `64`   | FS segment override (TLS on Linux)      |
| 2     | GS     | `65`   | GS segment override (TLS on Windows)    |
| 3     | OpSize | `66`   | Operand size override (32->16 or SSE)   |
| 4     | AdSize | `67`   | Address size override (64->32)          |

In 64-bit mode, the segment override prefixes for CS, DS, ES, and SS are
ignored for addressing but are repurposed as branch hints by some CPUs.
The `F2` and `F3` prefixes are also overloaded: they select SSE/SSE2
instruction variants when combined with certain opcodes (e.g., `F3 0F 10`
is `MOVSS` while `0F 10` is `MOVUPS`).

### REX Prefix (0 or 1 byte, 64-bit mode only)

The REX prefix extends register addressing from 8 to 16 registers and
enables 64-bit operand sizes. Its format:

```
Bits:  7 6 5 4 3 2 1 0
       0 1 0 0 W R X B
       \_____/ | | | |
       Fixed   | | | +-- Extension of ModR/M r/m or SIB base
       0100    | | +---- Extension of SIB index
               | +------ Extension of ModR/M reg field
               +-------- 0 = default operand size
                         1 = 64-bit operand size
```

The REX prefix occupies the range `0x40` through `0x4F`:

```
REX    = 0x40  (W=0, R=0, X=0, B=0) -- enables r8-r15 access
REX.W  = 0x48  (W=1, R=0, X=0, B=0) -- 64-bit operand size
REX.WR = 0x4C  (W=1, R=1, X=0, B=0) -- 64-bit + extended reg
REX.WB = 0x49  (W=1, R=0, X=0, B=1) -- 64-bit + extended r/m
```

The W bit is critical: without it, most operations default to 32-bit even
in 64-bit mode. For example, `mov eax, ebx` needs no REX, but `mov rax, rbx`
requires `REX.W` (0x48).

### Opcode (1, 2, or 3 bytes)

The opcode encodes the operation. Three formats exist:

- **1-byte**: `90` (NOP), `55` (PUSH RBP), `C3` (RET)
- **2-byte**: `0F` escape byte + second byte. Examples: `0F 05` (SYSCALL),
  `0F AF` (IMUL r, r/m)
- **3-byte**: `0F 38` or `0F 3A` escape + third byte. Examples:
  `0F 38 F0` (MOVBE), `0F 3A 0F` (PALIGNR)

Some opcodes embed a register in the low 3 bits. For example, the `PUSH`
family uses opcodes `50`-`57` for registers RAX through RDI:

```
50 = PUSH RAX    54 = PUSH RSP
51 = PUSH RCX    55 = PUSH RBP
52 = PUSH RDX    56 = PUSH RSI
53 = PUSH RBX    57 = PUSH RDI
```

To push R8-R15, add a REX.B prefix: `41 50` = PUSH R8, `41 57` = PUSH R15.

### ModR/M Byte (0 or 1 byte)

Present when the instruction uses register or memory operands specified
via the ModR/M encoding. Structure:

```
Bits:  7 6   5 4 3   2 1 0
       mod   reg/    r/m
             opcode
```

- **mod** (2 bits): addressing mode
  - `00` = memory, no displacement (except special cases)
  - `01` = memory + 8-bit displacement
  - `10` = memory + 32-bit displacement
  - `11` = register-to-register
- **reg** (3 bits): register operand or opcode extension
- **r/m** (3 bits): register or memory operand

When mod != 11 and r/m = 100 (binary), a SIB byte follows.
When mod = 00 and r/m = 101, a 32-bit RIP-relative displacement follows
(in 64-bit mode).

### SIB Byte (0 or 1 byte)

The Scale-Index-Base byte encodes complex memory addressing:

```
Bits:  7 6   5 4 3   2 1 0
       scale index   base
```

Effective address = base + (index * scale) + displacement

- **scale**: `00`=1, `01`=2, `10`=4, `11`=8
- **index**: register used as index (RSP/R12 encoding means "no index")
- **base**: base register (RBP/R13 encoding with mod=00 means "no base,
  disp32 only")

Example: `[rax + rcx*4 + 0x10]` uses SIB with base=RAX, index=RCX, scale=4,
plus an 8-bit displacement of 0x10.

### Displacement (0, 1, 2, or 4 bytes)

The displacement is a signed integer added to the effective address. Its
size depends on the mod field and the address size:

- mod=01: 1-byte displacement (sign-extended to 64 bits)
- mod=10: 4-byte displacement (sign-extended to 64 bits)
- Special case: mod=00, r/m=101 in 64-bit mode: 4-byte RIP-relative offset

### Immediate (0, 1, 2, 4, or 8 bytes)

Constants embedded in the instruction stream. The size depends on the
opcode and operand size prefix. Only `MOV` to a 64-bit register supports
an 8-byte immediate (opcode `B8`+rd with REX.W).

### VEX Prefix (2 or 3 bytes)

The VEX (Vector Extensions) prefix replaces the REX prefix and legacy
prefixes for AVX instructions.

**2-byte VEX** (`C5`):
```
Byte 0: C5
Byte 1: R vvvv L pp
         |  |   | |
         |  |   | +-- implied prefix: 00=none, 01=66, 10=F3, 11=F2
         |  |   +---- vector length: 0=128-bit, 1=256-bit
         |  +-------- complement of source register (~vvvv)
         +----------- complement of REX.R
```

**3-byte VEX** (`C4`):
```
Byte 0: C4
Byte 1: R X B mmmmm
Byte 2: W vvvv L pp
```

The `mmmmm` field encodes the opcode map (replacing 0F, 0F38, 0F3A escape
bytes). The 3-byte form is needed when REX.X, REX.B, REX.W, or opcode maps
beyond 0F are required.

### EVEX Prefix (4 bytes)

The EVEX prefix extends VEX for AVX-512:

```
Byte 0: 62
Byte 1: R X B R' 0 0 m m
Byte 2: W v v v v 1 p p
Byte 3: z L' L b V' a a a
```

New fields: opmask register (aaa), zeroing vs merging (z), broadcast (b),
extended vector length (L'L = 128/256/512), and R' for a 5th register
encoding bit.

---

## 2. Worked x86-64 Encoding Examples

### Example 1: `mov rax, 42`

This is a MOV with a 64-bit register destination and an immediate source.

```
Instruction: mov rax, 42
Encoding:    48 B8 2A 00 00 00 00 00 00 00
             |  |  |________________________|
             |  |  64-bit immediate (42 = 0x2A)
             |  Opcode: B8+rd (MOV r64, imm64), rd=0 (RAX)
             REX.W prefix (W=1 for 64-bit operand)

REX byte breakdown:  0x48 = 0100 1000
                            0100 = REX marker
                               1 = W (64-bit operand size)
                                0 = R (no reg extension)
                                 0 = X (no index extension)
                                  0 = B (no r/m extension, RAX = 0)

Immediate: 42 decimal = 0x000000000000002A (little-endian: 2A 00 00 00 00 00 00 00)
```

Note: This is the only x86-64 instruction format that accepts a full 8-byte
immediate. More commonly, `mov rax, 42` is optimized by the assembler to
`mov eax, 42` (`B8 2A 00 00 00`) because writing to EAX zero-extends into
RAX, saving 5 bytes.

### Example 2: `add eax, ebx`

Register-to-register ADD with 32-bit operands.

```
Instruction: add eax, ebx
Encoding:    01 D8
             |  |
             |  ModR/M byte
             Opcode: 01 (ADD r/m32, r32)

ModR/M breakdown: 0xD8 = 1101 1000
                         11 = mod (register-to-register)
                          011 = reg (EBX = 3)
                             000 = r/m (EAX = 0)

Direction: opcode 01 means reg is the source, r/m is the destination.
Result: ADD EAX, EBX  (EAX = EAX + EBX)
```

No REX prefix needed because both registers are in the base set (0-7) and
the operand size is 32-bit (default in 64-bit mode).

### Example 3: `push rbp`

Single-byte instruction with register encoded in the opcode.

```
Instruction: push rbp
Encoding:    55
             |
             Opcode: 50+rd (PUSH r64), rd=5 (RBP)

Binary: 0101 0101
        0101 0 = opcode base (PUSH)
             101 = register number 5 = RBP

Register encoding (low 3 bits):
  000 = RAX/R8    100 = RSP/R12
  001 = RCX/R9    101 = RBP/R13
  010 = RDX/R10   110 = RSI/R14
  011 = RBX/R11   111 = RDI/R15
```

No REX prefix is needed: PUSH in 64-bit mode defaults to 64-bit operand
size. This is one of the exceptions where the default is 64-bit rather
than 32-bit.

### Example 4: `ret`

Return from procedure. No operands.

```
Instruction: ret
Encoding:    C3

Binary: 1100 0011

This is a "near return" -- pops RIP from the stack.
C2 xx xx would be "ret imm16" (pop RIP, then add imm16 to RSP).
CB is "far return" (pops RIP and CS).
```

### Example 5: `nop`

The canonical no-operation.

```
Instruction: nop
Encoding:    90

Binary: 1001 0000

Historical note: 0x90 is actually XCHG EAX, EAX. In 64-bit mode, the CPU
treats 0x90 specially as a true NOP (it does NOT zero-extend EAX to RAX as
a regular XCHG EAX, EAX would).

If you encode XCHG EAX, EAX via ModR/M (87 C0), it IS a real exchange
and DOES zero-extend, unlike 0x90.
```

### Example 6: `syscall`

System call instruction (64-bit mode).

```
Instruction: syscall
Encoding:    0F 05

Byte 0: 0F = two-byte opcode escape
Byte 1: 05 = SYSCALL

Binary: 0000 1111  0000 0101

This transfers control to the kernel at the address stored in the
IA32_LSTAR MSR. The kernel syscall number is passed in RAX.
```

### Example 7: `mov [rsp+0x10], rdi` (Memory write with SIB)

```
Instruction: mov [rsp+0x10], rdi
Encoding:    48 89 7C 24 10
             |  |  |  |  |
             |  |  |  |  8-bit displacement (0x10)
             |  |  |  SIB byte
             |  |  ModR/M byte
             |  Opcode: 89 (MOV r/m64, r64)
             REX.W (64-bit operand)

ModR/M: 0x7C = 0111 1100
               01 = mod (memory + 8-bit displacement)
                111 = reg (RDI = 7)
                   100 = r/m (SIB follows)

SIB: 0x24 = 0010 0100
            00 = scale (1)
              100 = index (none -- RSP encoding means no index)
                 100 = base (RSP = 4)

Effective address: RSP + 0x10
```

RSP as a base register always requires a SIB byte. This is because r/m=100
(which would be RSP) is the SIB escape code in the ModR/M byte.

---

## 3. ARM64 (AArch64) Encoding

ARM64 uses fixed-width 32-bit instructions, aligned to 4-byte boundaries.
Every instruction is exactly 4 bytes. This is a radical simplification
compared to x86-64.

### General Encoding Structure

```
Bits:  31 30 29 28 27 26 25 24 23 22 21 20 ... 4 3 2 1 0
       |           |  |  |  |  |
       |           op0 (bits 28:25) -- major instruction group
       |
       sf/opc (varies by instruction class)
```

The `op0` field (bits 28:25) determines the major instruction group:

| op0     | Instruction Group                            |
|---------|----------------------------------------------|
| `x00x`  | Reserved / unallocated                       |
| `100x`  | Data processing -- immediate                 |
| `101x`  | Branches, exception generation, system        |
| `x1x0`  | Loads and stores                             |
| `x101`  | Data processing -- register                  |
| `0111`  | Data processing -- SIMD and floating-point   |
| `1111`  | Data processing -- SIMD and floating-point   |

### Data Processing -- Immediate

These instructions have a constant encoded within them.

```
31  30 29  28 27 26 25 24 23  22 ... 5  4 ... 0
sf  opc    1  0  0  op2      <--- immediate --->  Rd
```

- **sf** (bit 31): 0 = 32-bit (W registers), 1 = 64-bit (X registers)
- **opc** (bits 30:29): sub-operation
- **op2** (bits 25:23): selects immediate class

Sub-classes include:
- PC-relative addressing (ADR, ADRP)
- Add/subtract immediate
- Logical immediate
- Move wide immediate (MOVZ, MOVK, MOVN)
- Bitfield operations
- Extract

### Data Processing -- Register

```
31  30 29  28  27 26 25  24 23 22 21  20...16  15...10  9...5  4...0
sf  op  S   1   1  op2   op3          Rm       op4      Rn     Rd
```

Register-to-register operations including add, subtract, logical, shift,
multiply, and divide.

### Loads and Stores

ARM64 loads and stores have several addressing modes encoded in different
sub-formats:

```
31 30  29 28 27 26 25 24 23 22  21 ... 10  9...5  4...0
size   1  1  1  V  0  opc      imm12      Rn     Rt      (unsigned offset)
size   1  1  1  V  0  opc  0   imm9  idx  Rn     Rt      (pre/post-index)
```

- **size** (bits 31:30): 00=byte, 01=halfword, 10=word, 11=doubleword
- **V** (bit 26): 0=integer, 1=SIMD/FP register
- **opc** (bits 23:22): load vs store, sign extension

### Branches

Unconditional branches:

```
31  30 ... 26  25 ... 0
op  0  0  1  0  1  imm26
```

- **op** (bit 31): 0 = B (branch), 1 = BL (branch with link / call)
- **imm26**: signed 26-bit offset, shifted left 2 (4-byte aligned)

Conditional branches:

```
31 ... 25  24  23 ... 5  4  3 ... 0
0101010    o1  imm19     o0  cond
```

- **imm19**: signed 19-bit offset, shifted left 2
- **cond**: condition code (EQ=0000, NE=0001, CS=0010, CC=0011, etc.)

### Condition Codes

ARM64 conditional branches encode the condition in bits 3:0:

| Code | Mnemonic | Meaning                  | Flags          |
|------|----------|--------------------------|----------------|
| 0000 | EQ       | Equal                    | Z=1            |
| 0001 | NE       | Not equal                | Z=0            |
| 0010 | CS/HS    | Carry set / unsigned >=  | C=1            |
| 0011 | CC/LO    | Carry clear / unsigned < | C=0            |
| 0100 | MI       | Minus / negative         | N=1            |
| 0101 | PL       | Plus / positive or zero  | N=0            |
| 0110 | VS       | Overflow                 | V=1            |
| 0111 | VC       | No overflow              | V=0            |
| 1000 | HI       | Unsigned higher          | C=1 AND Z=0    |
| 1001 | LS       | Unsigned lower or same   | C=0 OR Z=1     |
| 1010 | GE       | Signed >=                | N=V            |
| 1011 | LT       | Signed <                 | N!=V           |
| 1100 | GT       | Signed >                 | Z=0 AND N=V    |
| 1101 | LE       | Signed <=                | Z=1 OR N!=V    |
| 1110 | AL       | Always                   | (any)          |
| 1111 | NV       | Never (reserved)         | (any)          |

### System Instructions

System instructions (MSR, MRS, SVC, HVC, SMC) are encoded in the branch
group:

```
SVC: 1101 0100 000 imm16 000 01
HVC: 1101 0100 000 imm16 000 10
SMC: 1101 0100 000 imm16 000 11
```

---

## 4. Worked ARM64 Encoding Examples

### Example 1: `mov x0, #42`

MOV with a wide immediate is actually the MOVZ instruction (move with zero).

```
Instruction: mov x0, #42
Actual:      movz x0, #42, lsl #0
Encoding:    0xD2800540

Binary: 1101 0010 1000 0000 0000 0101 0100 0000

Bit fields:
  31    = 1     (sf: 64-bit, X register)
  30:29 = 10    (opc: MOVZ)
  28:23 = 100101 (fixed for move wide immediate)
  22:21 = 00    (hw: shift amount = 0, meaning LSL #0)
  20:5  = 0000000000101010 (imm16 = 42 = 0x002A)
  4:0   = 00000 (Rd = X0)

Hex breakdown:
  D2 = 1101 0010 (sf=1, opc=10, fixed=100101, hw_hi=0)
  80 = 1000 0000 (hw_lo=0, imm16 upper bits = 0000 0000)
  05 = 0000 0101 (imm16 middle: 00 + 00010101 partial)
  40 = 0100 0000 (imm16 lower + Rd=00000)

Verification: imm16 bits 20:5 = 0000 0000 0010 1010 = 42
              Rd bits 4:0 = 00000 = X0
```

For values larger than 16 bits, ARM64 requires multiple instructions.
For example, loading 0xDEADBEEF into X0:

```
movz x0, #0xBEEF             ; X0 = 0x000000000000BEEF
movk x0, #0xDEAD, lsl #16   ; X0 = 0x00000000DEADBEEF
```

### Example 2: `add x0, x1, x2`

Three-register ADD operation.

```
Instruction: add x0, x1, x2
Encoding:    0x8B020020

Binary: 1000 1011 0000 0010 0000 0000 0010 0000

Bit fields:
  31    = 1      (sf: 64-bit)
  30    = 0      (op: ADD, not SUB)
  29    = 0      (S: do not set flags)
  28:24 = 01011  (fixed for add/sub shifted register)
  23:22 = 00     (shift type: LSL)
  21    = 0      (reserved)
  20:16 = 00010  (Rm = X2)
  15:10 = 000000 (imm6: shift amount = 0)
  9:5   = 00001  (Rn = X1)
  4:0   = 00000  (Rd = X0)

Hex breakdown:
  8B = 1000 1011 (sf=1, op=0, S=0, fixed=01011)
  02 = 0000 0010 (shift=00, 0, Rm=00010)
  00 = 0000 0000 (imm6=000000, Rn hi bits)
  20 = 0010 0000 (Rn=00001, Rd=00000)
```

Compare with `adds x0, x1, x2` (set flags): bit 29 flips to 1, giving
encoding `0xAB020020`.

### Example 3: `b label` (PC-relative branch)

Assume the label is 256 bytes ahead (offset = +256).

```
Instruction: b .+256
Encoding:    0x14000040

Binary: 0001 0100 0000 0000 0000 0000 0100 0000

Bit fields:
  31    = 0      (op: B, not BL)
  30:26 = 00101  (fixed for unconditional branch)
  25:0  = 00 0000 0000 0000 0000 0100 0000  (imm26)

The imm26 value is the offset divided by 4 (since all instructions are
4-byte aligned):
  256 / 4 = 64 = 0x40

Actual PC offset = imm26 * 4 = 64 * 4 = 256 bytes forward.

Range: imm26 is signed, so range is:
  -(2^25) * 4  to  +(2^25 - 1) * 4
  = -134,217,728  to  +134,217,724
  = approximately +/- 128 MB
```

### Example 4: `svc #0` (Supervisor Call)

Used for Linux system calls on ARM64.

```
Instruction: svc #0
Encoding:    0xD4000001

Binary: 1101 0100 0000 0000 0000 0000 0000 0001

Bit fields:
  31:24 = 11010100  (fixed for exception generation)
  23:21 = 000       (opc: SVC)
  20:5  = 0000000000000000  (imm16 = 0)
  4:2   = 000       (op2: fixed)
  1:0   = 01        (LL: 01 = SVC)

For the Linux kernel, the syscall number is in X8 and SVC #0 traps
to EL1 (kernel mode). The imm16 field is available to the kernel via
ESR_EL1 but Linux conventionally uses 0.
```

### Example 5: `ldr x0, [x1, #8]` (Load with offset)

```
Instruction: ldr x0, [x1, #8]
Encoding:    0xF9400420

Binary: 1111 1001 0100 0000 0000 0100 0010 0000

Bit fields:
  31:30 = 11     (size: 64-bit / doubleword)
  29:27 = 111    (fixed for load/store)
  26    = 0      (V: integer register, not SIMD)
  25:24 = 01     (fixed)
  23:22 = 01     (opc: LDR 64-bit)
  21:10 = 000000000001 (imm12 = 1, scaled by 8 = offset 8)
  9:5   = 00001  (Rn = X1)
  4:0   = 00000  (Rt = X0)

The imm12 is scaled by the access size (8 bytes for 64-bit),
so imm12=1 means offset = 1 * 8 = 8 bytes.
```

---

## 5. RISC-V Encoding

RISC-V uses a clean, orthogonal encoding with exactly six instruction
formats. The base integer ISA (RV32I/RV64I) uses 32-bit instructions.
The C (Compressed) extension adds 16-bit instructions.

### The Six Base Formats

All share bits 6:0 as the opcode field.

**R-type (Register-Register):**
```
31      25 24  20 19  15 14  12 11   7 6     0
| funct7  |  rs2 |  rs1 |funct3|  rd  |opcode|
  7 bits    5      5      3      5      7
```

**I-type (Immediate):**
```
31          20 19  15 14  12 11   7 6     0
|  imm[11:0] |  rs1 |funct3|  rd  |opcode|
   12 bits     5      3      5      7
```

**S-type (Store):**
```
31      25 24  20 19  15 14  12 11   7 6     0
|imm[11:5]|  rs2 |  rs1 |funct3|imm[4:0]|opcode|
  7 bits    5      5      3      5         7
```

**B-type (Branch):**
```
31     30   25 24  20 19  15 14  12 11    8 7   6     0
|imm[12]|imm[10:5]|rs2|  rs1 |funct3|imm[4:1]|imm[11]|opcode|
  1       6        5    5      3      4        1       7
```

**U-type (Upper Immediate):**
```
31              12 11   7 6     0
|   imm[31:12]   |  rd  |opcode|
     20 bits       5      7
```

**J-type (Jump):**
```
31     30      21 20   19      12 11   7 6     0
|imm[20]|imm[10:1]|imm[11]|imm[19:12]|  rd  |opcode|
  1       10        1       8           5      7
```

### Opcode Map (bits 6:0)

| Opcode    | Hex    | Format | Instructions           |
|-----------|--------|--------|------------------------|
| `0110011` | `0x33` | R      | ADD, SUB, AND, OR, XOR, SLL, SRL, SRA, SLT, SLTU |
| `0010011` | `0x13` | I      | ADDI, ANDI, ORI, XORI, SLTI, SLTIU, SLLI, SRLI, SRAI |
| `0000011` | `0x03` | I      | LB, LH, LW, LBU, LHU, LD |
| `0100011` | `0x23` | S      | SB, SH, SW, SD        |
| `1100011` | `0x63` | B      | BEQ, BNE, BLT, BGE, BLTU, BGEU |
| `0110111` | `0x37` | U      | LUI                    |
| `0010111` | `0x17` | U      | AUIPC                  |
| `1101111` | `0x6F` | J      | JAL                    |
| `1100111` | `0x67` | I      | JALR                   |
| `1110011` | `0x73` | I      | ECALL, EBREAK, CSR*    |

### The Immediate Scramble

RISC-V immediates are deliberately scrambled across the instruction word
to keep the hardware sign-extension logic simple (bit 31 is always the
sign bit of the immediate) and to maximize overlap of bit positions
across formats:

```
Format   Immediate bits in instruction:
I-type:  inst[31:20]                        -> imm[11:0]
S-type:  inst[31:25] | inst[11:7]           -> imm[11:5] | imm[4:0]
B-type:  inst[31] | inst[7] | inst[30:25] | inst[11:8] | 0
         -> imm[12] | imm[11] | imm[10:5] | imm[4:1] | 0
J-type:  inst[31] | inst[19:12] | inst[20] | inst[30:21] | 0
         -> imm[20] | imm[19:12] | imm[11] | imm[10:1] | 0
```

The sign bit is always at instruction bit 31 for all formats. This means
the sign-extension hardware is trivial: just replicate bit 31.

### C Extension (Compressed Instructions)

The C extension provides 16-bit versions of common instructions. A 16-bit
instruction is identified by having bits 1:0 != 11:

```
Bits 1:0:
  00 = compressed instruction (quadrant 0)
  01 = compressed instruction (quadrant 1)
  10 = compressed instruction (quadrant 2)
  11 = 32-bit instruction (or wider)
```

This is elegant: the instruction length is determined entirely by the
first two bits. Hardware can identify instruction boundaries trivially.

Examples of compressed instructions:
- `C.ADD rd, rs2` (16-bit) replaces `ADD rd, rd, rs2` (32-bit)
- `C.LW rd', offset(rs1')` (16-bit) replaces `LW` (32-bit)
- `C.J offset` (16-bit) replaces `JAL x0, offset` (32-bit)

Compressed instructions use a restricted register set (x8-x15 only for
some formats) and limited immediate ranges.

---

## 6. Worked RISC-V Encoding Examples

### Example 1: `add x1, x2, x3` (R-type)

```
Instruction: add x1, x2, x3
Format:      R-type
Encoding:    0x003100B3

Binary: 0000 000 00011 00010 000 00001 0110011

Field breakdown:
  funct7 = 0000000 (ADD, not SUB which is 0100000)
  rs2    = 00011   (x3)
  rs1    = 00010   (x2)
  funct3 = 000     (ADD/SUB)
  rd     = 00001   (x1)
  opcode = 0110011 (OP = register-register arithmetic)

Hex: 00 31 00 B3 (little-endian stored as B3 00 31 00)

Verification:
  0000000 | 00011 | 00010 | 000 | 00001 | 0110011
  = 0000 0000 0011 0001 0000 0000 1011 0011
  = 0x003100B3
```

To get SUB, only funct7 changes: `sub x1, x2, x3` = `0x403100B3`.

### Example 2: `addi x1, x2, 10` (I-type)

```
Instruction: addi x1, x2, 10
Format:      I-type
Encoding:    0x00A10093

Binary: 0000 0000 1010 00010 000 00001 0010011

Field breakdown:
  imm[11:0] = 000000001010  (10 decimal)
  rs1       = 00010         (x2)
  funct3    = 000           (ADDI)
  rd        = 00001         (x1)
  opcode    = 0010011       (OP-IMM = immediate arithmetic)

Hex layout:
  0000 0000 1010 | 00010 | 000 | 00001 | 0010011
  = 0000 0000 1010 0001 0000 0000 1001 0011
  = 0x00A10093

Negative immediate example: addi x1, x2, -10
  imm[11:0] = 111111110110 (two's complement of 10)
  Encoding:  0xFF610093
```

### Example 3: `beq x1, x2, offset` (B-type)

Assume we want to branch 40 bytes forward if x1 == x2.

```
Instruction: beq x1, x2, 40
Format:      B-type
Encoding:    0x02208463

Target offset = 40 bytes. B-type immediate encodes offset with bit 0
implicitly 0 (2-byte alignment for C extension compatibility).

Immediate bits of 40:
  40 = 0b 0 0 000010 1000 0
       imm[12] imm[11] imm[10:5] imm[4:1] imm[0](implicit)

  40 in binary: 101000
  Shifted right 1: we encode 40/2 = 20? No -- the immediate IS the byte
  offset, but bit 0 is always 0 and not stored.

  40 = 0b 0_0_000010_1000_0
  imm[12]    = 0
  imm[11]    = 0
  imm[10:5]  = 000010
  imm[4:1]   = 0100
  (imm[0]    = 0, not stored)

Instruction layout:
  imm[12] | imm[10:5] | rs2   | rs1   | funct3 | imm[4:1] | imm[11] | opcode
  0       | 000010    | 00010 | 00001 | 000    | 0100     | 0       | 1100011

  = 0_000010_00010_00001_000_0100_0_1100011
  = 0000 0100 0010 0000 1000 0100 0110 0011
  = 0x02208463

Sign extension: if the offset were negative (branch backward), bit 31
of the instruction (imm[12]) would be 1, and the CPU sign-extends from
bit 12 to fill the upper bits of the target address calculation.
```

### Example 4: `lui x5, 0xDEADB` (U-type)

```
Instruction: lui x5, 0xDEADB
Format:      U-type
Encoding:    0xDEADB2B7

Binary layout:
  imm[31:12] = 1101 1110 1010 1101 1011  (0xDEADB)
  rd         = 00101                      (x5)
  opcode     = 0110111                    (LUI)

  = 1101 1110 1010 1101 1011 00101 0110111
  = 0xDEADB2B7

Result: x5 = 0xFFFFFFFDEADB000 (sign-extended from bit 31 on RV64)

To load 0xDEADBEEF into x5:
  lui  x5, 0xDEADC      ; x5 = 0xDEADC000 (note: +1 because ADDI will subtract)
  addi x5, x5, -273     ; x5 = 0xDEADC000 + (-0x111) -- wait, let's be precise:

Actually: 0xBEEF = 48879. Since ADDI sign-extends 12 bits:
  0xEEF = -273 (sign bit set). So we need LUI to load 0xDEADC (one more than
  0xDEADB) and ADDI with 0xEEF:
  lui  x5, 0xDEADC      ; x5 = 0xDEADC000
  addi x5, x5, -0x111   ; 0xEEF sign-extends to -0x111 = -273
                         ; x5 = 0xDEADC000 - 0x111 -- this doesn't work cleanly.

The correct approach: 0xDEADBEEF
  Upper 20 bits: 0xDEADB, lower 12 bits: 0xEEF
  Since 0xEEF has bit 11 set (negative in sign-extended 12-bit), add 1 to upper:
  lui  x5, 0xDEADC      ; x5 = 0xDEADC000
  addi x5, x5, 0xFFFFFEEF ; but ADDI takes 12-bit signed...

  0xEEF = 3823. As signed 12-bit: 0xEEF = -273 (since 0xEEF > 0x7FF).
  lui  x5, 0xDEADC      ; x5 = 0xDEADC000
  addi x5, x5, -273     ; x5 = 0xDEADC000 - 273 = 0xDEADBEEF

  Verify: 0xDEADC000 - 0x111 = 0xDEADBEEF. Yes: 0xC000 - 0x0111 = 0xBEEF.
```

---

## 7. Variable-Length vs Fixed-Length

### Why x86 Uses Variable-Length Encoding

The x86 ISA has accumulated 45+ years of backward compatibility. The
original 8086 (1978) used 1-6 byte instructions. Each generation added
new instructions and addressing modes, requiring new prefixes and escape
bytes:

```
Timeline of x86 instruction growth:
  8086  (1978): 1-6 bytes, ~100 instructions
  386   (1985): + 0x66/0x67 prefixes, 32-bit mode
  SSE   (1999): + 0F prefix overloading, 128-bit SIMD
  x86-64(2003): + REX prefix (0x40-0x4F), 64-bit mode
  AVX   (2011): + VEX prefix (C4/C5), 256-bit SIMD
  AVX-512(2016): + EVEX prefix (62), 512-bit SIMD, opmask
```

The result: instructions range from 1 byte (`NOP` = 0x90) to 15 bytes.
Average instruction length in typical code is approximately 3.8-4.2 bytes.

**Advantages of variable-length:**
- Higher code density (common instructions are short)
- Backward compatibility (old binaries run unmodified)
- Rich addressing modes encoded compactly

**Disadvantages:**
- Decode is enormously complex
- Instruction boundaries are ambiguous (must parse serially from a known start)
- Branch target prediction interacts badly with variable-length
- Speculative execution must handle length mispredictions

### Why ARM64 and RISC-V Use Fixed-Length

ARM64 made a clean break from the variable-length Thumb/ARM32 encoding.
Every instruction is exactly 32 bits.

```
ARM64 instruction fetch:
  PC -> [always aligned to 4 bytes]
  Fetch 4 bytes -> exactly one instruction
  Decode immediately, no length ambiguity
```

**Advantages of fixed-length:**
- Trivial instruction boundary detection
- Parallel decode of multiple instructions
- Simplified branch target calculation (always 4-byte aligned)
- Smaller, simpler decode logic

**Disadvantages:**
- Lower code density (even simple ops take 4 bytes)
- Limited immediate range (12-16 bits typical, vs x86's 32-bit)
- Loading large constants requires multiple instructions

### The Numbers

```
Code density comparison (bytes per "semantic operation"):

  ISA          Average instruction length    Typical binary size
  x86-64       ~4.0 bytes                    1.00x (baseline)
  ARM64        4.0 bytes (fixed)             1.05-1.15x
  RISC-V       4.0 bytes (fixed)             1.10-1.25x
  RISC-V + C   ~3.2 bytes (mixed 16/32)     0.95-1.05x
  Thumb-2      ~3.2 bytes (mixed 16/32)     0.90-1.00x
```

RISC-V's C extension brings code density close to x86-64 while maintaining
the simplicity benefits of fixed-length for 32-bit instructions.

### Decode Width Implications

Modern out-of-order CPUs decode 4-6 instructions per cycle. For fixed-length
ISAs, this is straightforward: fetch 16-24 bytes, split into 4-6 instructions
at fixed boundaries.

For x86-64, instruction boundaries must be discovered:

```
x86-64 decode pipeline (simplified):
  1. Fetch 16 bytes from instruction cache
  2. Pre-decode: scan for instruction boundaries (complex FSM)
  3. Mark instruction starts (may find 3-6 instructions)
  4. Route to 4-6 decoders
  5. Complex decoder handles instructions with multiple uops
  6. Simple decoders handle 1-uop instructions

ARM64 decode pipeline (simplified):
  1. Fetch 16 bytes from instruction cache
  2. Split into 4 instructions (trivial: bytes 0-3, 4-7, 8-11, 12-15)
  3. Route all 4 to decoders in parallel
```

The x86 pre-decode stage consumes significant die area and power. Intel's
instruction length decoder is one of the most complex pieces of logic in
the entire CPU.

---

## 8. The ModR/M and SIB Bytes

### ModR/M Byte Deep Dive

The ModR/M byte is the primary addressing mode specifier in x86-64. It
encodes how the instruction's operands are specified.

```
Bit layout:
  7 6 | 5 4 3 | 2 1 0
  mod | reg    | r/m

Full ModR/M table (64-bit mode, no REX):

mod=00 (memory, no displacement unless special):
  r/m=000: [RAX]         r/m=100: [SIB]
  r/m=001: [RCX]         r/m=101: [RIP+disp32]
  r/m=010: [RDX]         r/m=110: [RSI]
  r/m=011: [RBX]         r/m=111: [RDI]

mod=01 (memory + disp8):
  r/m=000: [RAX+disp8]   r/m=100: [SIB+disp8]
  r/m=001: [RCX+disp8]   r/m=101: [RBP+disp8]
  r/m=010: [RDX+disp8]   r/m=110: [RSI+disp8]
  r/m=011: [RBX+disp8]   r/m=111: [RDI+disp8]

mod=10 (memory + disp32):
  r/m=000: [RAX+disp32]  r/m=100: [SIB+disp32]
  r/m=001: [RCX+disp32]  r/m=101: [RBP+disp32]
  r/m=010: [RDX+disp32]  r/m=110: [RSI+disp32]
  r/m=011: [RBX+disp32]  r/m=111: [RDI+disp32]

mod=11 (register):
  r/m selects the register directly.
  r/m=000: RAX/EAX/AX/AL   r/m=100: RSP/ESP/SP/AH
  r/m=001: RCX/ECX/CX/CL   r/m=101: RBP/EBP/BP/CH
  r/m=010: RDX/EDX/DX/DL   r/m=110: RSI/ESI/SI/DH
  r/m=011: RBX/EBX/BX/BL   r/m=111: RDI/EDI/DI/BH
```

Special cases in mod=00:
- **r/m=100**: SIB byte follows (cannot directly encode [RSP])
- **r/m=101**: RIP-relative addressing with 32-bit displacement
  (in 64-bit mode; was [disp32] in 32-bit mode)

### The reg Field as Opcode Extension

For some instructions, the reg field does not specify a register but extends
the opcode. These are "group" instructions:

```
Example: Group 1 (0x80-0x83) immediate arithmetic:

reg field | Operation
----------|----------
000       | ADD
001       | OR
010       | ADC
011       | SBB
100       | AND
101       | SUB
110       | XOR
111       | CMP

So: 83 C0 05 means:
  Opcode: 83 (group 1, r/m32, imm8, sign-extended)
  ModR/M: C0 = 11 000 000
    mod=11 (register), reg=000 (ADD), r/m=000 (EAX)
  Immediate: 05
  Result: ADD EAX, 5

And: 83 E8 05 means:
  ModR/M: E8 = 11 101 000
    mod=11, reg=101 (SUB), r/m=000 (EAX)
  Result: SUB EAX, 5
```

### SIB Byte Deep Dive

The SIB byte provides scaled-index-base addressing:

```
Effective Address = base + (index * scale) + displacement

Bit layout:
  7 6 | 5 4 3 | 2 1 0
  ss  | index  | base

Scale (ss):
  00 = *1     01 = *2     10 = *4     11 = *8

Index register encoding:
  000=RAX  001=RCX  010=RDX  011=RBX
  100=none 101=RBP  110=RSI  111=RDI
  (index=100 means "no index register")

Base register encoding:
  000=RAX  001=RCX  010=RDX  011=RBX
  100=RSP  101=*    110=RSI  111=RDI
  (* base=101: depends on mod: mod=00 means disp32 only; mod=01/10 means RBP+disp)
```

### Worked SIB Example

Encoding `mov eax, [rbx + rcx*4 + 0x100]`:

```
Instruction: mov eax, [rbx + rcx*4 + 0x100]
Encoding:    8B 84 8B 00 01 00 00

Opcode:  8B (MOV r32, r/m32)
ModR/M:  84 = 10 000 100
         mod=10 (memory + disp32)
         reg=000 (EAX)
         r/m=100 (SIB follows)
SIB:     8B = 10 001 011
         scale=10 (*4)
         index=001 (RCX)
         base=011 (RBX)
Disp32:  00 01 00 00 (little-endian = 0x00000100 = 256)

Effective address: RBX + RCX*4 + 256
```

### The Special Cases

These encodings are the bane of x86 decoder implementers:

```
1. [RSP]-based addressing ALWAYS needs SIB:
   r/m=100 is hijacked as "SIB follows" escape.
   To encode [RSP], use SIB with index=none, base=RSP:
   ModR/M = xx 000 100, SIB = 00 100 100

2. [RBP] with no displacement needs mod=01 + disp8=0:
   mod=00, r/m=101 means RIP-relative, NOT [RBP].
   To get [RBP+0], use mod=01, r/m=101, disp8=00.

3. SIB with base=RBP and mod=00 means disp32 only (no base register):
   [index*scale + disp32]

4. SIB with index=RSP means "no index":
   You cannot use RSP as an index register in SIB addressing.
```

---

## 9. Prefixes

### Legacy Prefix Groups

x86-64 instructions can have up to 4 legacy prefixes, one from each group.
Order within the prefix sequence does not matter to the CPU, but conventions
exist.

**Group 1 -- Lock and Repeat:**

```
F0: LOCK -- ensures atomic read-modify-write on memory
    Example: F0 01 18  =  lock add [rax], ebx
    Only valid with specific instructions (ADD, SUB, AND, OR, XOR,
    NOT, NEG, INC, DEC, BTC, BTS, BTR, XCHG, CMPXCHG, XADD).
    Invalid use generates #UD.

F2: REPNE/REPNZ -- repeat string operation while ZF=0
    Example: F2 AE  =  repne scasb  (scan string for AL)
    Also used as SSE prefix: F2 0F 10 = MOVSD (scalar double)

F3: REP/REPE/REPZ -- repeat string operation while ZF=1
    Example: F3 A4  =  rep movsb  (fast memory copy)
    Also used as SSE prefix: F3 0F 10 = MOVSS (scalar single)
```

**Group 2 -- Segment Overrides:**

```
2E: CS segment override (mostly ignored in 64-bit mode)
36: SS segment override (mostly ignored in 64-bit mode)
3E: DS segment override (mostly ignored in 64-bit mode)
26: ES segment override (mostly ignored in 64-bit mode)
64: FS segment override (ACTIVE: used for TLS on Linux)
65: GS segment override (ACTIVE: used for TLS on Windows, kernel per-CPU on Linux)

Example: 64 8B 04 25 00 00 00 00  =  mov eax, fs:[0]
(accesses thread-local storage base on Linux)
```

**Group 3 -- Operand Size Override:**

```
66: Toggles operand size between 32-bit and 16-bit (in 64-bit mode).
    Example: 66 89 C3  =  mov bx, ax  (16-bit move)
    Without: 89 C3     =  mov ebx, eax (32-bit move)

    Also used as mandatory prefix for SSE2:
    66 0F 6F = MOVDQA (aligned 128-bit move)
```

**Group 4 -- Address Size Override:**

```
67: Toggles address size from 64-bit to 32-bit (in 64-bit mode).
    Example: 67 8B 00  =  mov eax, [eax]  (32-bit address)
    Without: 8B 00     =  mov eax, [rax]  (64-bit address)
    Rarely used in 64-bit code. Truncates the effective address to 32 bits.
```

### REX Prefix Details

```
Range: 0x40 - 0x4F (16 possible values)

Encoding: 0100 WRXB

Common REX values and their meaning:
  40 = REX       (no extensions, but enables access to SIL, DIL, SPL, BPL)
  41 = REX.B     (extend r/m or base register to r8-r15)
  42 = REX.X     (extend SIB index to r8-r15)
  44 = REX.R     (extend reg field to r8-r15)
  48 = REX.W     (64-bit operand size)
  49 = REX.WB    (64-bit + extended r/m)
  4C = REX.WR    (64-bit + extended reg)
  4D = REX.WRB   (64-bit + both extensions)
  4F = REX.WRXB  (all extensions active)

Important interaction: REX eliminates access to AH, CH, DH, BH.
With any REX prefix present:
  reg=100 encodes SPL (not AH)
  reg=101 encodes BPL (not CH)
  reg=110 encodes SIL (not DH)
  reg=111 encodes DIL (not BH)
```

### VEX Prefix

VEX replaces both legacy prefixes and REX for AVX instructions:

```
2-byte VEX (C5):
  Byte 0: C5
  Byte 1: R vvvv L pp
           | ^^^^  | ^^
           |  |    |  +-- 00=none, 01=66, 10=F3, 11=F2
           |  |    +----- 0=128-bit (XMM), 1=256-bit (YMM)
           |  +---------- source register (~vvvv, inverted)
           +------------- ~REX.R

3-byte VEX (C4):
  Byte 0: C4
  Byte 1: R X B mmmmm
           | | |  ^^^^^
           | | |  +---- opcode map: 00001=0F, 00010=0F38, 00011=0F3A
           | | +------- ~REX.B
           | +--------- ~REX.X
           +----------- ~REX.R
  Byte 2: W vvvv L pp

Example: VADDPS ymm0, ymm1, ymm2
  VEX.256.0F (3-byte: C4 E1 74)
  Opcode: 58
  ModR/M: C2 (mod=11, reg=ymm0, r/m=ymm2)
  Full: C4 E1 74 58 C2

  C4 = 3-byte VEX start
  E1 = 1110 0001: R=1(~0), X=1(~0), B=1(~0), mmmmm=00001(0F)
  74 = 0111 0100: W=0, vvvv=1110(~ymm1=~0001), L=1(256-bit), pp=00(none)
  58 = ADDPS opcode
  C2 = 11 000 010: mod=11, reg=ymm0, r/m=ymm2
```

### EVEX Prefix

EVEX extends VEX for AVX-512, adding opmask registers, zeroing, and
512-bit vectors:

```
Byte 0: 62 (EVEX marker)
Byte 1: R X B R' 0 0 m m
Byte 2: W v v v v 1 p p
Byte 3: z L' L b V' a a a

New fields:
  R' (bit 4 of byte 1): 5th bit for reg encoding (32 SIMD registers)
  V' (bit 3 of byte 3): 5th bit for vvvv (32 SIMD registers)
  aaa (bits 2:0 of byte 3): opmask register k0-k7
  z (bit 7 of byte 3): 0=merge masking, 1=zero masking
  b (bit 4 of byte 3): embedded broadcast (e.g., {1to16})
  L'L (bits 6:5 of byte 3): 00=128, 01=256, 10=512

Example: VADDPS zmm0 {k1}{z}, zmm1, zmm2
  EVEX.512.0F.W0 with k1 and zeroing
  62 F1 74 C9 58 C2

  62 = EVEX
  F1 = 1111 0001: R=1, X=1, B=1, R'=1, 00, mm=01(0F)
  74 = 0111 0100: W=0, vvvv=1110(~zmm1), 1, pp=00
  C9 = 1100 1001: z=1, L'L=10(512), b=0, V'=1, aaa=001(k1)
  58 = ADDPS
  C2 = 11 000 010 (zmm0, zmm2)
```

---

## 10. Immediate Encoding

### x86-64 Immediates

x86-64 supports multiple immediate sizes, determined by the opcode and
operand size:

```
Size     Example instruction              Hex encoding
1 byte   add al, 5                        04 05
1 byte   add eax, 5   (sign-extended)     83 C0 05
2 bytes  add ax, 0x1234                   66 05 34 12
4 bytes  add eax, 0x12345678             05 78 56 34 12
4 bytes  add rax, 0x12345678 (sign-ext)  48 05 78 56 34 12
8 bytes  mov rax, 0x123456789ABCDEF0     48 B8 F0 DE BC 9A 78 56 34 12
```

Key rules:
1. Only MOV-to-register (opcode B8+rd with REX.W) supports 8-byte immediates.
2. All other 64-bit operations sign-extend a 4-byte immediate to 8 bytes.
3. The `83` opcode group sign-extends an 8-bit immediate for all arithmetic.
4. Little-endian byte order: the least significant byte comes first.

**Sign extension example:**

```
add rax, -1

Encoding: 48 83 C0 FF

The immediate 0xFF is sign-extended:
  8-bit:  0xFF           = -1
  64-bit: 0xFFFFFFFFFFFFFFFF = -1

This is why "add rax, -1" is only 4 bytes, not 11 bytes.
If the immediate were 0x7F (positive, fits in signed byte): no issue.
If the immediate is 0x80 to 0xFF: negative when sign-extended.
If the immediate is 0x100 or larger: must use 4-byte immediate form.
```

### ARM64 Immediates

ARM64 has severely limited immediate ranges because every instruction is
exactly 32 bits. Different instruction classes have different immediate
formats:

**Add/Subtract immediate:** 12-bit unsigned, optionally shifted left by 12.

```
ADD X0, X1, #0xFFF       ; imm12 = 0xFFF, shift = 0
ADD X0, X1, #0xFFF000    ; imm12 = 0xFFF, shift = 1 (LSL #12)
ADD X0, X1, #0x1000      ; INVALID -- 0x1000 needs shift=1 but then imm12 = 1
                          ; Actually this works: imm12=1, shift=1 -> 1 << 12 = 0x1000
```

**Logical immediate:** A 13-bit encoding (N:immr:imms) that represents a
bitmask. This can encode many useful patterns:

```
AND X0, X1, #0xFF        ; N=0, immr=0, imms=7  -> 8 ones
AND X0, X1, #0xFF00FF    ; Repeating pattern via rotation
AND X0, X1, #0x5555...5  ; Alternating bits

The logical immediate encoding can represent any value that consists of
a repeating pattern of a power-of-2-width bitmask rotated by any amount.
This covers a surprisingly large set of useful constants.

Values that CANNOT be encoded as logical immediates:
  0x0 (all zeros) -- always invalid
  0xFFFFFFFFFFFFFFFF (all ones) -- always invalid
  0x12345678 -- arbitrary values
```

**Move wide immediate:** MOVZ/MOVN/MOVK use a 16-bit immediate that can
be shifted to one of four 16-bit positions:

```
Loading 0xDEADBEEFCAFEBABE into X0:
  movz x0, #0xBABE             ; X0 = 0x000000000000BABE
  movk x0, #0xCAFE, lsl #16   ; X0 = 0x00000000CAFEBABE
  movk x0, #0xBEEF, lsl #32   ; X0 = 0x0000BEEFCAFEBABE
  movk x0, #0xDEAD, lsl #48   ; X0 = 0xDEADBEEFCAFEBABE

Four instructions (16 bytes) to load a 64-bit constant.
Compare with x86-64: one 10-byte instruction (REX + MOV + imm64).
```

**PC-relative addressing:** ADRP uses a 21-bit immediate (imm_hi:imm_lo)
shifted left by 12, giving a +/- 4 GB range at page granularity:

```
ADRP X0, target   ; X0 = PC[63:12]:zeros + (imm21 << 12)
ADD  X0, X0, #:lo12:target  ; X0 += lower 12 bits of target
```

### RISC-V Immediates

RISC-V splits immediates across instruction formats:

```
I-type: 12-bit signed immediate (range -2048 to +2047)
  addi x1, x0, 42     ; imm = 42 (0x02A)
  addi x1, x0, -1     ; imm = 0xFFF (sign-extended to -1)

U-type: 20-bit upper immediate (bits 31:12 of result)
  lui x1, 0x12345     ; x1 = 0x12345000

Combined LUI + ADDI for full 32-bit constants:
  lui  x1, 0x12345    ; x1 = 0x12345000
  addi x1, x1, 0x678  ; x1 = 0x12345678

  BUT: if imm12 bit 11 is set (negative sign-extended):
  To load 0x12345800:
    0x800 as signed 12-bit = -2048
    So: lui x1, 0x12346; addi x1, x1, -2048
    0x12346000 + (-2048) = 0x12346000 - 0x800 = 0x12345800

For 64-bit constants on RV64, up to 8 instructions may be needed.
The pseudo-instruction "li" handles this automatically.
```

---

## 11. Branch and Jump Encoding

### x86-64 Branches

x86-64 provides two forms of conditional/unconditional jumps:

**Short jump (2 bytes):** opcode + 8-bit signed offset.

```
EB xx       = JMP rel8    (unconditional, +/- 127 bytes)
74 xx       = JE/JZ rel8  (jump if equal)
75 xx       = JNE/JNZ rel8

Example: JMP .+5  (skip 5 bytes forward)
  EB 03   (offset is from NEXT instruction, so 3 to skip 3 more bytes)

Offset is relative to the address of the NEXT instruction:
  target = address_of_next_instruction + sign_extend(rel8)
```

**Near jump (5 or 6 bytes):** opcode + 32-bit signed offset.

```
E9 xx xx xx xx          = JMP rel32  (unconditional, +/- 2 GB)
0F 84 xx xx xx xx       = JE rel32   (conditional, +/- 2 GB)
0F 85 xx xx xx xx       = JNE rel32

Example: JMP .+0x1000  (4096 bytes forward)
  E9 FB 0F 00 00

  Offset calculation: target - (address_of_jmp + 5)
  If JMP is at 0x1000 and target is 0x2000:
    rel32 = 0x2000 - (0x1000 + 5) = 0x0FFB
    Encoding: E9 FB 0F 00 00
```

**Indirect jumps:**

```
FF 25 xx xx xx xx       = JMP [rip+disp32]  (jump through pointer)
FF E0                   = JMP RAX           (jump to address in RAX)
```

**Call instruction:**

```
E8 xx xx xx xx          = CALL rel32 (push return address, jump)
FF 15 xx xx xx xx       = CALL [rip+disp32] (indirect call through pointer)
FF D0                   = CALL RAX
```

### ARM64 Branches

**Unconditional branch (B/BL):**

```
B:  opcode 000101, 26-bit signed offset (shifted left 2)
BL: opcode 100101, 26-bit signed offset (shifted left 2)

Range: +/- 128 MB (2^25 * 4 = 134,217,728 bytes)

Example: BL func  (func is 1024 bytes ahead)
  Offset = 1024 / 4 = 256 = 0x100
  Encoding: 94000100
    1001 01 | 00 0000 0000 0000 0001 0000 0000
    op=1(BL) | imm26 = 256
```

**Conditional branch (B.cond):**

```
Format: 0101 0100 imm19 0 cond

Range: +/- 1 MB (2^18 * 4 = 1,048,576 bytes)

Example: B.EQ .+64
  Offset = 64 / 4 = 16
  imm19 = 0000 0000 0000 0010 000
  cond = 0000 (EQ)
  Encoding: 54000200
    0101 0100 | 0000 0000 0000 0010 000 | 0 | 0000
```

**Compare and branch (CBZ/CBNZ):**

```
Format: sf 011 010 x imm19 Rt

CBZ X0, .+128
  sf=1 (64-bit), op=0 (CBZ), imm19 = 128/4 = 32 = 0x20, Rt = 0
  Encoding: B4000400

Range: +/- 1 MB
```

**Test and branch (TBZ/TBNZ):**

```
Format: b5 011 011 x b40 imm14 Rt

TBZ X0, #3, .+64
  Tests bit 3 of X0, branches if zero
  b5=0, op=0, b40=00011, imm14 = 64/4 = 16, Rt = 0
  Range: +/- 32 KB (2^13 * 4 = 32,768 bytes)
```

### RISC-V Branches

**B-type (conditional branch):**

```
Format: imm[12|10:5] rs2 rs1 funct3 imm[4:1|11] opcode

BEQ:  funct3=000    BNE:  funct3=001
BLT:  funct3=100    BGE:  funct3=101
BLTU: funct3=110    BGEU: funct3=111

Range: +/- 4 KB (13-bit signed offset, bit 0 always 0)

Example: BEQ x1, x2, +40
  imm = 40 = 0b 0_0_000010_1000_0
  Encoded: 02208463 (see worked example in section 6)
```

**J-type (unconditional jump):**

```
JAL rd, offset

Range: +/- 1 MB (21-bit signed offset, bit 0 always 0)

JAL ra, +1024
  offset = 1024 = 0x400
  imm bits: imm[20]=0, imm[10:1]=10_0000_0000, imm[11]=0, imm[19:12]=00000000
  rd = x1 (ra)
  Encoding: 400000EF

  Verification:
  0 | 1000000000 | 0 | 00000000 | 00001 | 1101111
  imm[20]=0  imm[10:1]  imm[11]  imm[19:12]  rd=1  JAL
```

**JALR (I-type, register-indirect jump):**

```
JALR rd, rs1, offset

Range: any address (rs1 + 12-bit signed offset)
Used for function returns: JALR x0, x1, 0  (jump to address in x1)
```

### Branch Range Comparison

```
ISA       Short branch        Long branch           Indirect
x86-64    +/- 127 B (2 B)    +/- 2 GB (5-6 B)     unlimited (2-6 B)
ARM64     +/- 1 MB (4 B)     +/- 128 MB (4 B)     unlimited (4 B)
RISC-V    +/- 4 KB (4 B)     +/- 1 MB (4 B)       unlimited (4 B)

For targets beyond the direct branch range:
  ARM64: ADRP + BR (8 bytes for any 64-bit target)
  RISC-V: AUIPC + JALR (8 bytes for +/- 2 GB)
  x86-64: already handles +/- 2 GB directly
```

---

## 12. NOP Encoding

### x86-64 NOPs

**Single-byte NOP:**

```
90 = NOP

This is architecturally XCHG EAX, EAX but is special-cased by the CPU
to be a true no-operation (no register write, no flag modification).

Binary: 1001 0000

Historical: on 8086, XCHG AX, AX was the cheapest way to do nothing.
It became the canonical NOP. In 64-bit mode, the CPU explicitly
recognizes 0x90 as NOP and does NOT zero-extend EAX into RAX (which
a real XCHG EAX, EAX would do).
```

**Multi-byte NOPs (for alignment):**

Intel defines recommended multi-byte NOP sequences using the `0F 1F` opcode
family. These execute as a single NOP regardless of length:

```
Length  Encoding                              Description
1       90                                    NOP
2       66 90                                 66 NOP (operand size prefix + NOP)
3       0F 1F 00                              NOP DWORD [RAX]
4       0F 1F 40 00                           NOP DWORD [RAX+0]
5       0F 1F 44 00 00                        NOP DWORD [RAX+RAX*1+0]
6       66 0F 1F 44 00 00                     NOP WORD  [RAX+RAX*1+0]
7       0F 1F 80 00 00 00 00                  NOP DWORD [RAX+0x0]
8       0F 1F 84 00 00 00 00 00              NOP DWORD [RAX+RAX*1+0x0]
9       66 0F 1F 84 00 00 00 00 00           NOP WORD  [RAX+RAX*1+0x0]
10      66 66 0F 1F 84 00 00 00 00 00        Two 66 prefixes + 8-byte NOP
11      66 66 66 0F 1F 84 00 00 00 00 00     Three 66 prefixes + 8-byte NOP
...up to 15 bytes maximum.
```

These multi-byte NOPs are used for:
- **Loop alignment**: Aligning hot loop headers to 16 or 32 byte boundaries
- **Function alignment**: Padding between functions
- **Hot patching**: Reserving space for runtime code modification

**Why alignment matters:**

```
Modern x86 CPUs fetch instructions in 16-byte or 32-byte blocks aligned
to those boundaries. If a hot loop starts at offset 0x...F (end of a
fetch block), the first iteration pays a penalty:

  Unaligned:                  Aligned:
  addr  instruction           addr  instruction
  0x0F  loop_start:           0x10  loop_start:       <-- 16-byte aligned
  0x12    add rax, rbx        0x13    add rax, rbx
  0x15    cmp rax, rcx        0x16    cmp rax, rcx
  0x18    jne loop_start      0x19    jne loop_start

  Fetch block [0x00-0x0F] gets only 1 byte of loop_start.
  Fetch block [0x10-0x1F] gets the rest.
  vs.
  Fetch block [0x10-0x1F] gets the entire loop header.
```

### ARM64 NOP

```
NOP: 0xD503201F

Binary: 1101 0101 0000 0011 0010 0000 0001 1111

Bit fields:
  31:22 = 1101010100  (system instruction class)
  21:12 = 0000110010  (hint instruction subclass)
  11:5  = 0000000     (CRm:op2 = 0000:000 = NOP hint)
  4:0   = 11111       (Rt = XZR, the zero register)

ARM64 NOP is part of the HINT instruction family:
  NOP   = HINT #0  = D503201F
  YIELD = HINT #1  = D503203F
  WFE   = HINT #2  = D503205F
  WFI   = HINT #3  = D503207F
  SEV   = HINT #4  = D503209F
```

Since ARM64 instructions are always 4 bytes, alignment padding always
uses exact multiples of 4-byte NOPs. There is no need for variable-length
NOP sequences.

### RISC-V NOP

```
NOP: 0x00000013

Binary: 0000 0000 0000 00000 000 00000 0010011

This is: ADDI x0, x0, 0

Since x0 is hardwired to zero in RISC-V, ADDI x0, x0, 0 is
architecturally guaranteed to be a no-op. The assembler recognizes
"nop" as a pseudo-instruction and emits this encoding.

With the C extension, a 16-bit NOP is also available:
  C.NOP: 0x0001  (ADDI x0, x0, 0 in compressed form)
  Binary: 0000 0000 0000 0001
```

### NOP Sleds in Security

NOP sleds are sequences of NOP instructions used in exploit payloads:

```
Classic x86 NOP sled:
  90 90 90 90 90 90 90 90 90 90 ... [shellcode]

The attacker does not need to know the exact address of the shellcode.
Jumping anywhere in the NOP sled slides execution forward to the shellcode.

Modern mitigations:
  - NX bit (W^X): stack/heap pages are non-executable
  - ASLR: randomizes memory layout
  - Stack canaries: detect buffer overflow before return
  - CFI (Control Flow Integrity): validates indirect branch targets

NOP sled detection:
  IDS/IPS systems look for long runs of 0x90 bytes.
  Evasion: use other single-byte "NOP-equivalent" instructions:
    40-4F (REX prefixes, harmless if followed by valid instruction)
    Sequences like 87 C0 (XCHG EAX, EAX via ModR/M)
    Multi-byte NOPs (0F 1F ...)
```

---

## 13. Decoding

### x86-64 Decode Complexity

The x86-64 instruction decoder is one of the most complex pieces of logic
in a modern CPU. The fundamental problem: instruction boundaries are
ambiguous until you parse from a known starting point.

**The decode state machine:**

```
State 0: Start
  Read byte. Is it a legacy prefix (F0,F2,F3,2E,36,3E,26,64,65,66,67)?
    Yes -> record prefix, stay in State 0
    No  -> go to State 1

State 1: Check for REX/VEX/EVEX
  Is byte 0x40-0x4F? -> REX prefix, go to State 2
  Is byte 0xC4?      -> 3-byte VEX, read 2 more bytes, go to State 2
  Is byte 0xC5?      -> 2-byte VEX, read 1 more byte, go to State 2
  Is byte 0x62?      -> EVEX, read 3 more bytes, go to State 2
  Otherwise           -> this IS the opcode byte, go to State 2

State 2: Opcode
  Read opcode byte(s).
  Is it 0x0F? -> escape: read next byte for 2-byte opcode
    Is second byte 0x38 or 0x3A? -> read third byte for 3-byte opcode
  Look up opcode in decode table to determine:
    - Does this instruction have a ModR/M byte?
    - What is the immediate size?
    - Is the reg field an opcode extension?

State 3: ModR/M (if present)
  Parse mod, reg, r/m fields.
  Does r/m=100 and mod!=11? -> SIB byte follows (State 4)
  Does mod=01? -> 1-byte displacement follows
  Does mod=10? -> 4-byte displacement follows
  Does mod=00 and r/m=101? -> 4-byte displacement follows (RIP-relative)

State 4: SIB (if present)
  Parse scale, index, base fields.
  Does base=101 and mod=00? -> 4-byte displacement follows

State 5: Displacement (if any)

State 6: Immediate (if any, size determined by opcode + prefix state)

State 7: Instruction complete. Emit decoded micro-ops.
```

This state machine must run in a single cycle for the decode stage to not
become a bottleneck. Modern Intel CPUs use a "pre-decode" stage that marks
instruction boundaries in the L1 instruction cache, plus a decoded-uop
cache (DSB, Decoded Stream Buffer) that stores previously decoded
instructions.

### ARM64 Decode

ARM64 decoding is trivially parallel:

```
Fetch 16 bytes -> 4 instructions, boundaries at bytes 0, 4, 8, 12.

For each instruction:
  1. Read bits 28:25 (op0) to determine instruction group
  2. Within each group, read class-specific fields
  3. Done. No variable-length parsing, no prefix accumulation.

ARM64 decoders can process 4-8 instructions per cycle with minimal logic.
```

### RISC-V Decode

Base RV32/RV64 decoding is similar to ARM64 in simplicity. With the
C extension, instructions can be 16 or 32 bits:

```
Read bits 1:0 of the next instruction:
  != 11 -> 16-bit compressed instruction
  == 11 -> 32-bit instruction

This is a single 2-bit comparison, vastly simpler than x86-64's
multi-state prefix parsing.

For 32-bit instructions:
  bits 6:0 = opcode (7 bits, fully determines the format)
  Format-specific fields are always in the same bit positions.
```

### Decode Width on Modern Processors

```
Processor              Decode width    Uop cache?    Notes
Intel Alder Lake       6 wide          Yes (4K uops) Complex decoder + 5 simple
AMD Zen 4              4 wide          Yes (6.75K)   4 symmetric decoders
Apple M2 (Firestorm)   8 wide          No            Fixed-width ARM64
Qualcomm Oryon         8 wide          No            Fixed-width ARM64
SiFive P670            3 wide          No            RISC-V + C extension

x86 processors invest enormous transistor budgets in decode:
  - Instruction length decoding (pre-decode)
  - Micro-op cache (avoids re-decoding hot code)
  - Macro-op fusion (combine CMP+JCC into single uop)
  - Stack engine (handle PUSH/POP without full decode)
```

### Micro-op Translation (x86-64)

Modern x86-64 CPUs do not execute x86 instructions directly. They translate
(decode) each instruction into one or more micro-operations (uops):

```
Instruction              Uops (approximate, varies by microarchitecture)
NOP                      0 (eliminated in rename)
MOV reg, reg             0 (register rename, zero-latency)
ADD reg, reg             1
ADD reg, [mem]           2 (load + add, may fuse)
PUSH reg                 1 (micro-fused: store address + store data)
DIV r64                  ~30-90 (microcoded)
REP MOVSB                microcoded (variable, depends on count)
CPUID                    ~100+ (microcoded, serializing)

Simple instructions (1 uop) can be decoded by any decoder.
Complex instructions (2+ uops) need the complex decoder or microcode ROM.
Typically 1 complex decoder + 3-5 simple decoders per cycle.
```

---

## 14. Disassembly Challenges

### Linear Sweep

Linear sweep starts at the beginning of a code section and decodes
instructions sequentially:

```
Algorithm:
  pc = section_start
  while pc < section_end:
    instruction = decode(pc)
    emit(instruction)
    pc += instruction.length

Example (correct):
  Address  Bytes           Disassembly
  0x1000   55              push rbp
  0x1001   48 89 E5        mov rbp, rsp
  0x1004   89 7D FC        mov [rbp-4], edi
  0x1007   C3              ret
```

**Problem: data embedded in code.**

```
  Address  Bytes           Linear sweep says:     Actually:
  0x1000   EB 04           jmp 0x1006             jmp 0x1006
  0x1002   DE AD BE EF     fimulp st(5)           DATA: 0xDEADBEEF
  0x1006   55              push rbp               push rbp

Linear sweep tries to decode 0xDEADBEEF as instructions, producing
garbage. It may also desynchronize: if the data bytes decode to a
different-length instruction than the actual data, subsequent "real"
instructions will be decoded at the wrong offset.
```

### Recursive Descent

Recursive descent follows control flow to find code:

```
Algorithm:
  worklist = {entry_point}
  visited = {}
  while worklist not empty:
    pc = worklist.pop()
    if pc in visited: continue
    while true:
      instruction = decode(pc)
      visited.add(pc)
      emit(instruction)
      if instruction is unconditional_jump:
        worklist.add(instruction.target)
        break
      if instruction is conditional_branch:
        worklist.add(instruction.target)  // taken path
        worklist.add(pc + instruction.length)  // fall-through
      if instruction is return or halt:
        break
      pc += instruction.length
```

**Advantage:** Does not try to decode data as code.
**Disadvantage:** Misses code that is only reached via indirect jumps
(function pointers, virtual dispatch, jump tables).

### The Halting Problem and Disassembly

Perfect disassembly of arbitrary binaries is provably impossible. It
reduces to the halting problem:

```
To perfectly disassemble a binary, you must know:
  1. Which bytes are code vs data
  2. All possible execution paths (including indirect)
  3. Whether dead code should be disassembled

Problem 1: Is address X code or data?
  Consider: if (always_false) { code_at_X(); }
  The code at X is syntactically valid but never executes.
  Is it "code"? A static disassembler cannot resolve this
  without solving the halting problem for the condition.

Problem 2: Where does JMP RAX go?
  RAX could be any value depending on program state.
  Resolving all possible targets requires whole-program analysis
  or runtime tracing.
```

### Overlapping Instructions (x86-64)

x86-64's variable-length encoding allows a peculiar trick: the same bytes
can be part of two different valid instruction sequences depending on
where you start decoding:

```
Address  Bytes           Stream A (start at 0x1000):
0x1000   EB 01           jmp 0x1003
0x1002   05 B8 01 00     add eax, 0x0001B8 (never reached)
0x1006   00 00           add [rax], al
...

Address  Bytes           Stream B (start at 0x1003):
0x1003   B8 01 00 00 00  mov eax, 1
0x1008   ...

The byte at 0x1003 (B8) is the second byte of the ADD instruction in
Stream A, but the first byte of a MOV instruction in Stream B.
After the JMP, execution follows Stream B.
```

This is exploited in:
- **Code obfuscation**: Deliberately crafted overlapping instruction streams
  confuse disassemblers.
- **Return-oriented programming (ROP)**: Finding "gadgets" by starting
  decode at non-instruction-aligned offsets.

```
ROP gadget example:
  Intended code at 0x4000: 48 89 5C 24 08 C3
  Disassembly:             mov [rsp+8], rbx; ret

  Starting at 0x4003:      24 08 C3
  Disassembly:             and al, 8; ret

  The sequence "and al, 8; ret" is a valid gadget even though it was
  never intentionally written. It exists as a side effect of the x86
  variable-length encoding.
```

This is impossible on ARM64 and RISC-V because instructions are always
aligned to 4-byte (or 2-byte for C extension) boundaries. There are no
"unintended" instruction sequences hiding at misaligned offsets.

### Obfuscation Techniques

**Opaque predicates:**

```
; Always true, but hard to prove statically:
mov eax, [some_global]    ; load runtime value
imul eax, eax             ; x^2
and eax, 1                ; x^2 mod 2
jz  real_code             ; always taken (x^2 is always even for even x,
                          ;   but also for odd x: (2k+1)^2 = 4k^2+4k+1,
                          ;   and 1 mod 2 = 1... wait, this is wrong)

; Better opaque predicate: y*(y+1) is always even
mov eax, [some_global]
lea ecx, [eax+1]
imul eax, ecx             ; eax = y*(y+1)
test eax, 1
jz  real_code             ; always taken
db  0xE8                  ; fake CALL opcode to confuse disassembler
```

**Anti-disassembly with junk bytes:**

```
  0x1000: EB 01           jmp 0x1003
  0x1002: E8              junk byte (looks like start of CALL)
  0x1003: 55              push rbp

Linear sweep sees:
  0x1000: EB 01           jmp 0x1003
  0x1002: E8 55 48 89 E5  call 0x48891A38  (WRONG -- consumed real code)
  0x1007: ...             (desynchronized)

Recursive descent correctly follows the JMP and decodes from 0x1003.
```

**Self-modifying code:**

```
; Code that rewrites itself at runtime:
mov byte [patch_target], 0x90    ; overwrite with NOP
patch_target:
  int3                            ; breakpoint (will become NOP)
  mov eax, 42                     ; this instruction runs normally

A static disassembler sees INT3 at patch_target.
At runtime, it has been patched to NOP.
```

**Indirect jump tables (switch statements):**

```
; Compiled switch statement:
  cmp eax, 4
  ja  default_case
  lea rcx, [rip + jump_table]
  movsxd rax, [rcx + rax*4]
  add rax, rcx
  jmp rax                         ; indirect jump -- where does this go?

jump_table:
  dd case0 - jump_table
  dd case1 - jump_table
  dd case2 - jump_table
  dd case3 - jump_table
  dd case4 - jump_table

A disassembler must recognize this pattern and parse the jump table
to find all case targets. Different compilers emit different patterns.
```

### Disassembler Strategies in Practice

Modern disassemblers use heuristic combinations:

```
1. Start with recursive descent from known entry points
2. Use symbol table and relocation info to find more entry points
3. Scan for function prologues (push rbp; mov rbp, rsp on x86)
4. Use exception handling tables (.eh_frame) to find function boundaries
5. Pattern-match compiler-specific code generation idioms
6. Apply data-flow analysis to resolve indirect branches
7. Mark remaining bytes as "unknown" rather than guessing

Tools: IDA Pro, Ghidra, Binary Ninja, radare2, objdump
Each makes different tradeoff decisions in the face of ambiguity.
```

### Fixed-Length ISA Advantage

ARM64 and RISC-V largely avoid these problems:

```
ARM64:
  - Every instruction boundary is at a 4-byte aligned address
  - No overlapping instructions are possible
  - Linear sweep works perfectly for code sections
  - Data in code sections is the only remaining challenge
    (but literal pools are typically placed after branches)

RISC-V:
  - Base ISA: same as ARM64, all 4-byte aligned
  - With C extension: 2 or 4 byte instructions, but boundaries
    are determined by bits 1:0 of each instruction
  - Still much simpler than x86-64

The simplicity tax: ARM64 and RISC-V binaries are slightly larger,
but the decode simplicity pays dividends in CPU design, power
consumption, and analysis tool reliability.
```

---

## Quick Reference: Hex Cheat Sheet

```
x86-64 Common Encodings:
  90              NOP
  CC              INT3 (debugger breakpoint)
  C3              RET (near return)
  55              PUSH RBP
  5D              POP RBP
  48 89 E5        MOV RBP, RSP
  48 83 EC xx     SUB RSP, imm8
  E8 xx xx xx xx  CALL rel32
  E9 xx xx xx xx  JMP rel32
  EB xx           JMP rel8
  0F 05           SYSCALL
  0F 1F 00        3-byte NOP
  F3 0F 1E FA     ENDBR64 (CET indirect branch tracking)

ARM64 Common Encodings:
  D503201F        NOP
  D65F03C0        RET
  D4000001        SVC #0
  A9BF7BFD        STP X29, X30, [SP, #-16]!  (function prologue)
  D10043FF        SUB SP, SP, #16

RISC-V Common Encodings:
  00000013        NOP (ADDI x0, x0, 0)
  00008067        RET (JALR x0, x1, 0)
  00000073        ECALL
  00100073        EBREAK
```

---

## Summary

Instruction encoding is where architecture meets silicon. The choices made
at the encoding level ripple through every layer of the system:

- **x86-64** optimizes for backward compatibility and code density at the
  cost of decode complexity. Its variable-length, prefix-heavy encoding
  requires enormous hardware investment to decode efficiently.

- **ARM64** chose a clean 32-bit fixed-width format that simplifies
  hardware at the cost of immediate range and code density. The result is
  power-efficient, high-throughput decode.

- **RISC-V** designed its encoding from first principles with a focus on
  simplicity and extensibility. The six base formats are orthogonal and
  easy to decode. The C extension recovers code density.

The encoding format determines:
- How fast instructions can be fetched and decoded
- How much silicon area the decoder requires
- How much power the decode stage consumes
- How effective branch prediction can be
- How reliable disassembly and security analysis are
- How dense the compiled code is

There is no universally "best" encoding. Each represents a different point
in the design space, shaped by its historical context and target use case.

---

## Study Guide — Instruction Encoding

### Key concepts

1. **Fixed vs variable length.** RISC-V, ARM32, MIPS are
   fixed 32-bit. x86 is 1-15 bytes. Thumb-2 and RV-C are
   compressed variants.
2. **Opcode tables.** The main decoder demultiplexes the
   opcode field to a unit.
3. **Immediate encoding.** How constants are packed into
   instructions. RISC-V has 5 immediate formats; x86 has
   several.
4. **Addressing modes.** Register, register+offset,
   PC-relative, memory indirect.

---

## Programming Examples

### Example 1 — Disassemble a RISC-V instruction by hand

```
0x00c58533

Binary: 0000_0000_1100_0101_1000_0101_0011_0011
        imm/funct7 rs2  rs1  f3  rd   opcode
        0000000    01100 01011 000 01010 0110011
        rs2=x12 rs1=x11 rd=x10 f3=000 opcode=0110011 (OP)
        add x10, x11, x12
```

### Example 2 — Use `llvm-mc`

```bash
echo 'add x10, x11, x12' | llvm-mc -triple=riscv64 -show-encoding
```

---

## DIY & TRY

### DIY 1 — Build an instruction decoder

Write a Python script that takes a 4-byte RISC-V
instruction and prints its assembly. Cover at least 10
instructions.

### TRY — Compare x86 and RISC-V encoding density

Compile the same C function for x86-64 and RISC-V. Compare
sizes. x86 usually wins on density; RISC-V wins on
simplicity.

## Related College Departments

- [**engineering**](../../../.college/departments/engineering/DEPARTMENT.md)
