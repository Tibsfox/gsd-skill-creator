# Assembly Language: Architectures, Instructions, and Machine Interface

> PNW Research Series -- Computation Cluster
> April 2026

---

## 1. x86-64 (AMD64) Architecture

The x86-64 architecture, also called AMD64 or Intel 64, extends the 32-bit x86 ISA to
64-bit. AMD published the original specification in 2000; Intel adopted a compatible
implementation (EM64T, later Intel 64) in 2004. Nearly every desktop, laptop, and server
CPU today implements this ISA.

### 1.1 Register File

Sixteen 64-bit general-purpose registers:

| 64-bit | 32-bit | 16-bit | 8-bit high | 8-bit low | Traditional role |
|--------|--------|--------|------------|-----------|-----------------|
| rax    | eax    | ax     | ah         | al        | Accumulator     |
| rbx    | ebx    | bx     | bh         | bl        | Base            |
| rcx    | ecx    | cx     | ch         | cl        | Counter         |
| rdx    | edx    | dx     | dh         | dl        | Data            |
| rsi    | esi    | si     | --         | sil       | Source index    |
| rdi    | edi    | di     | --         | dil       | Destination index |
| rbp    | ebp    | bp     | --         | bpl       | Base pointer    |
| rsp    | esp    | sp     | --         | spl       | Stack pointer   |
| r8     | r8d    | r8w    | --         | r8b       | (new in x86-64) |
| r9     | r9d    | r9w    | --         | r9b       | (new in x86-64) |
| r10    | r10d   | r10w   | --         | r10b      | (new in x86-64) |
| r11    | r11d   | r11w   | --         | r11b      | (new in x86-64) |
| r12    | r12d   | r12w   | --         | r12b      | (new in x86-64) |
| r13    | r13d   | r13w   | --         | r13b      | (new in x86-64) |
| r14    | r14d   | r14w   | --         | r14b      | (new in x86-64) |
| r15    | r15d   | r15w   | --         | r15b      | (new in x86-64) |

**rip** -- the 64-bit instruction pointer. Not directly writable; modified implicitly
by control flow instructions. RIP-relative addressing is the primary mode for
position-independent code.

**rflags** -- 64-bit flags register. Key flags: CF (carry), ZF (zero), SF (sign),
OF (overflow), PF (parity), DF (direction). The upper 32 bits are reserved.

**Segment registers** -- cs, ds, es, fs, gs, ss. In 64-bit long mode, ds/es/ss bases
are forced to zero. fs and gs retain nonzero bases for thread-local storage (Linux
uses fs for TLS; Windows uses gs).

### 1.2 Operating Modes

- **Long mode (64-bit mode):** Full 64-bit virtual addresses, 16 GPRs, RIP-relative
  addressing. This is the native mode for 64-bit operating systems.
- **Compatibility mode:** A sub-mode of long mode allowing 32-bit and 16-bit user-space
  code to run unmodified under a 64-bit kernel. The OS switches per code segment.
- **Legacy mode:** The processor behaves as a 32-bit x86 CPU. Used when a 32-bit OS is
  booted. Includes real mode (16-bit, no paging) and protected mode (32-bit, paging).

### 1.3 Operand Sizes and the REX Prefix

In 64-bit mode, the default operand size is 32 bits. To operate on 64-bit values, the
assembler emits a REX prefix byte (0x40-0x4F). The REX.W bit selects 64-bit operand
size. REX.R, REX.X, and REX.B extend the ModR/M, SIB index, and SIB base fields
respectively, enabling access to r8-r15.

```
REX prefix byte layout (bits 7-0):
  0100 W R X B
       |  | | +-- extends ModR/M r/m, SIB base, or opcode reg
       |  | +---- extends SIB index
       |  +------ extends ModR/M reg
       +--------- 1 = 64-bit operand size
```

Writing to a 32-bit register (e.g., `mov eax, 1`) implicitly zero-extends into the
full 64-bit register. Writing to 8-bit or 16-bit sub-registers does NOT zero-extend
(legacy behavior preserved for compatibility).

### 1.4 Memory Addressing Modes

x86-64 supports complex addressing with the ModR/M and SIB (Scale-Index-Base) bytes:

| Mode | Syntax (Intel) | Effective address |
|------|---------------|-------------------|
| Immediate | `mov rax, 42` | operand is the constant |
| Register | `mov rax, rbx` | value is in the register |
| Direct (absolute) | `mov rax, [0x401000]` | fixed memory address |
| RIP-relative | `mov rax, [rel msg]` | rip + signed 32-bit disp |
| Register indirect | `mov rax, [rbx]` | address in register |
| Base + displacement | `mov rax, [rbp - 8]` | base + signed offset |
| Base + index | `mov rax, [rbx + rcx]` | sum of two registers |
| Base + index*scale + disp | `mov rax, [rbx + rcx*8 + 16]` | full SIB form |

The scale factor can be 1, 2, 4, or 8. This is encoded in the SIB byte's scale field
(2 bits). RIP-relative addressing is new in x86-64 and is the standard for
position-independent code (PIC) on Linux and macOS.

---

## 2. x86-64 Instruction Categories

### 2.1 Data Movement

```asm
; Intel syntax (NASM style)
mov     rax, rbx            ; register to register
mov     rax, [rdi]          ; load from memory
mov     [rdi], rax          ; store to memory
mov     rax, 0xDEADBEEF     ; immediate to register
movzx   rax, byte [rdi]    ; zero-extending load (8->64)
movsx   rax, dword [rdi]   ; sign-extending load (32->64)
lea     rax, [rbx + rcx*4] ; load effective address (no memory access)
xchg    rax, rbx            ; atomic swap of two registers
push    rax                 ; decrement rsp, store rax at [rsp]
pop     rbx                 ; load [rsp] into rbx, increment rsp
```

`lea` computes an address but does not dereference it. It is commonly used for
arithmetic: `lea rax, [rdi + rdi*2]` computes `rdi * 3` without a multiply instruction.

`cmov` (conditional move) avoids branches: `cmovz rax, rbx` moves rbx into rax only if
ZF is set. There are variants for every condition code (cmovz, cmovnz, cmovl, cmovge,
etc.).

### 2.2 Arithmetic

```asm
add     rax, rbx            ; rax = rax + rbx, sets CF/OF/ZF/SF
sub     rax, 16             ; rax = rax - 16
inc     rcx                 ; rcx++, does NOT affect CF
dec     rcx                 ; rcx--, does NOT affect CF
neg     rax                 ; rax = -rax (two's complement negate)
mul     rbx                 ; unsigned: rdx:rax = rax * rbx
imul    rax, rbx            ; signed: rax = rax * rbx (truncated to 64 bits)
imul    rax, rbx, 10        ; signed: rax = rbx * 10 (three-operand form)
div     rcx                 ; unsigned: rax = rdx:rax / rcx, rdx = remainder
idiv    rcx                 ; signed division, same operand layout
```

**mul/div use implicit operands:** the 128-bit dividend/product lives in rdx:rax.
There is no way to change this; it is hardwired into the encoding.

### 2.3 Logic and Bit Manipulation

```asm
and     rax, 0xFF           ; bitwise AND, isolate low byte
or      rax, rbx            ; bitwise OR
xor     rax, rax            ; fastest way to zero a register (3 bytes, no imm)
not     rax                 ; bitwise NOT (one's complement)
shl     rax, 4              ; logical shift left by 4 (multiply by 16)
shr     rax, 1              ; logical shift right by 1 (unsigned divide by 2)
sar     rax, cl             ; arithmetic shift right by cl (preserves sign)
rol     rax, 1              ; rotate left
ror     rax, 1              ; rotate right
bt      rax, 5              ; bit test: CF = bit 5 of rax
bts     rax, 5              ; bit test and set
btr     rax, 5              ; bit test and reset
bsf     rcx, rax            ; bit scan forward (find lowest set bit)
bsr     rcx, rax            ; bit scan reverse (find highest set bit)
popcnt  rax, rbx            ; population count (number of set bits)
lzcnt   rax, rbx            ; leading zero count
tzcnt   rax, rbx            ; trailing zero count
```

### 2.4 Comparison and Testing

```asm
cmp     rax, rbx            ; computes rax - rbx, sets flags, discards result
test    rax, rax            ; computes rax AND rax, sets flags (check for zero)
test    rax, 1              ; check if bit 0 is set (odd/even test)
```

`cmp` followed by a conditional jump is the fundamental branching pattern. `test` is
preferred for zero-checks because it avoids subtraction.

### 2.5 Control Flow

```asm
jmp     .label              ; unconditional jump
je      .label              ; jump if equal (ZF=1)
jne     .label              ; jump if not equal (ZF=0)
jl      .label              ; jump if less (signed: SF!=OF)
jge     .label              ; jump if greater or equal (signed: SF=OF)
jb      .label              ; jump if below (unsigned: CF=1)
jae     .label              ; jump if above or equal (unsigned: CF=0)
jg      .label              ; jump if greater (signed: ZF=0 and SF=OF)
jle     .label              ; jump if less or equal (signed: ZF=1 or SF!=OF)
ja      .label              ; jump if above (unsigned: CF=0 and ZF=0)
jbe     .label              ; jump if below or equal (unsigned: CF=1 or ZF=1)
call    function            ; push return address, jump to function
ret                         ; pop return address, jump to it
loop    .label              ; decrement rcx, jump if rcx != 0
```

Near jumps use a signed 32-bit displacement (up to +/-2 GB). Short jumps use a signed
8-bit displacement (+/-127 bytes). `call` pushes rip onto the stack; `ret` pops it.

### 2.6 String Operations

The string instructions operate on memory pointed to by rsi (source) and rdi
(destination), with rcx as the count when using a `rep` prefix:

```asm
; Copy rcx bytes from [rsi] to [rdi]
cld                         ; clear direction flag (forward)
mov     rcx, 256
rep movsb                   ; repeat movsb rcx times

; Fill rcx bytes at [rdi] with al
mov     al, 0
mov     rcx, 4096
rep stosb                   ; memset equivalent

; Find byte al in [rdi], up to rcx bytes
mov     al, 0x0A            ; newline
mov     rcx, 1024
repne scasb                 ; scan until match or rcx=0

; Compare rcx bytes between [rsi] and [rdi]
mov     rcx, 64
repe cmpsb                  ; compare while equal
```

String instructions can operate on bytes (b), words (w), doublewords (d), or quadwords
(q): movsb, movsw, movsd, movsq.

### 2.7 Stack Frame Management

```asm
; Function prologue
push    rbp                 ; save caller's frame pointer
mov     rbp, rsp            ; establish new frame
sub     rsp, 32             ; allocate 32 bytes of local space

; ... function body ...

; Function epilogue
mov     rsp, rbp            ; deallocate locals
pop     rbp                 ; restore caller's frame
ret

; Equivalent using ENTER/LEAVE (slower, rarely used)
enter   32, 0               ; push rbp, mov rbp rsp, sub rsp 32
; ... function body ...
leave                       ; mov rsp rbp, pop rbp
ret
```

---

## 3. x86-64 Calling Conventions

### 3.1 System V AMD64 ABI (Linux, macOS, FreeBSD)

This is the standard calling convention on Unix-like systems.

**Integer/pointer argument registers (in order):**
rdi, rsi, rdx, rcx, r8, r9. Additional arguments go on the stack right-to-left.

**Floating-point argument registers:**
xmm0 through xmm7 (SSE registers). Additional float args go on the stack.

**Return value:** rax (integer/pointer), rdx (second return value for 128-bit),
xmm0/xmm1 (floating-point).

**Caller-saved (volatile):** rax, rcx, rdx, rsi, rdi, r8, r9, r10, r11, xmm0-xmm15.
The caller must save these before a call if it needs them after.

**Callee-saved (non-volatile):** rbx, rbp, r12, r13, r14, r15. The callee must
preserve these across the call.

**Stack alignment:** The stack must be 16-byte aligned immediately before `call`. Since
`call` pushes an 8-byte return address, rsp is 16-byte aligned at function entry minus
8 bytes. The callee's prologue typically pushes rbp (another 8 bytes), restoring
alignment.

**Red zone:** On System V, the 128 bytes below rsp are reserved and will not be
clobbered by signal handlers or interrupts. Leaf functions can use this space without
adjusting rsp.

```asm
; int add_three(int a, int b, int c)
; a = edi, b = esi, c = edx
; Returns a + b + c in eax
global add_three
add_three:
    lea     eax, [edi + esi]    ; eax = a + b
    add     eax, edx            ; eax += c
    ret                         ; return value in eax

; Calling add_three(10, 20, 30)
    mov     edi, 10
    mov     esi, 20
    mov     edx, 30
    call    add_three
    ; result is now in eax
```

### 3.2 Windows x64 Calling Convention

**Integer/pointer argument registers (in order):** rcx, rdx, r8, r9. Note the
different order from System V. Additional arguments on the stack.

**Floating-point arguments:** xmm0, xmm1, xmm2, xmm3 (only 4, vs System V's 8).

**Shadow space:** The caller must always allocate 32 bytes (4 x 8-byte slots) on the
stack above the return address, even if the function takes fewer than 4 arguments. The
callee may use this space to spill registers.

**No red zone.** Interrupt handlers and the OS may clobber anything below rsp.

**Callee-saved:** rbx, rbp, rdi, rsi, r12-r15, xmm6-xmm15. Note that rdi and rsi are
callee-saved on Windows (they are caller-saved on System V).

```asm
; Windows x64: int sum(int a, int b)
; a = ecx, b = edx
global sum
sum:
    lea     eax, [ecx + edx]
    ret

; Calling sum(10, 20) on Windows
    sub     rsp, 40             ; 32 shadow + 8 alignment
    mov     ecx, 10
    mov     edx, 20
    call    sum
    add     rsp, 40
```

### 3.3 Complete Function Example (System V)

```asm
; int64_t dot_product(const int64_t *a, const int64_t *b, size_t n)
; rdi = a, rsi = b, rdx = n
; Returns sum of a[i]*b[i] in rax
global dot_product
dot_product:
    push    rbx                 ; save callee-saved register
    xor     rax, rax            ; accumulator = 0
    test    rdx, rdx            ; if n == 0
    jz      .done
    mov     rcx, rdx            ; rcx = loop counter
.loop:
    mov     rbx, [rdi]          ; rbx = *a
    imul    rbx, [rsi]          ; rbx *= *b
    add     rax, rbx            ; accumulator += rbx
    add     rdi, 8              ; a++
    add     rsi, 8              ; b++
    dec     rcx
    jnz     .loop
.done:
    pop     rbx                 ; restore callee-saved
    ret
```

---

## 4. x86-64 SIMD Extensions

### 4.1 SSE (Streaming SIMD Extensions)

SSE provides 16 registers (xmm0-xmm15), each 128 bits wide. They can hold:
- 4 x 32-bit single-precision floats (ps = packed single)
- 2 x 64-bit double-precision floats (pd = packed double)
- 16 x 8-bit, 8 x 16-bit, 4 x 32-bit, or 2 x 64-bit integers

```asm
; SSE: Add four floats in parallel
; float result[4]; result[i] = a[i] + b[i]
movaps  xmm0, [rdi]            ; load 4 floats from a (aligned)
addps   xmm0, [rsi]            ; add 4 floats from b
movaps  [rdx], xmm0            ; store result

; SSE: Dot product of two 4-float vectors
movaps  xmm0, [rdi]            ; load a[0..3]
mulps   xmm0, [rsi]            ; element-wise multiply
haddps  xmm0, xmm0             ; horizontal add pairs
haddps  xmm0, xmm0             ; sum all four
; scalar result now in xmm0[0]

; SSE2: Packed double operations
movapd  xmm0, [rdi]            ; load 2 doubles (aligned, 16-byte)
mulpd   xmm0, [rsi]            ; multiply 2 doubles
movapd  [rdx], xmm0            ; store 2 doubles

; Scalar SSE operations (single element, not packed)
movss   xmm0, [rdi]            ; load one float
addss   xmm0, [rsi]            ; add one float
sqrtss  xmm1, xmm0             ; square root of one float
```

Key SSE instruction suffixes:
- `ps` = packed single (4 x float32)
- `pd` = packed double (2 x float64)
- `ss` = scalar single (1 x float32)
- `sd` = scalar double (1 x float64)

### 4.2 AVX (Advanced Vector Extensions)

AVX doubles the vector width to 256 bits using ymm0-ymm15 registers. Each ymm register
is the lower half of the corresponding xmm register extended upward. AVX uses a
three-operand, non-destructive encoding (VEX prefix):

```asm
; AVX: Add eight floats (256-bit)
vmovaps ymm0, [rdi]            ; load 8 floats
vaddps  ymm2, ymm0, [rsi]     ; ymm2 = ymm0 + mem (non-destructive)
vmovaps [rdx], ymm2            ; store 8 floats

; AVX: Fused multiply-add (FMA3)
vmovaps ymm0, [rdi]
vmovaps ymm1, [rsi]
vmovaps ymm2, [rdx]
vfmadd231ps ymm2, ymm0, ymm1  ; ymm2 = ymm0*ymm1 + ymm2

; AVX2: Integer operations on 256-bit vectors
vmovdqa ymm0, [rdi]            ; load 32 bytes (8 x int32)
vpaddd  ymm2, ymm0, [rsi]     ; add 8 integers
vpmulld ymm3, ymm0, ymm1      ; multiply 8 integers (low 32 bits)
```

The `v` prefix indicates VEX-encoded (AVX) instructions. Legacy SSE instructions
without the `v` prefix merge with the upper 128 bits; VEX-encoded instructions
zero-extend, avoiding false dependencies.

### 4.3 AVX-512

AVX-512 extends to 512-bit registers (zmm0-zmm31, 32 registers in 64-bit mode) and
introduces 8 opmask registers (k0-k7) for predicated execution:

```asm
; AVX-512: Add 16 floats with masking
vmovaps zmm0, [rdi]
vaddps  zmm2{k1}, zmm0, [rsi]  ; add only lanes where k1 bits are set
                                ; other lanes retain zmm2's old value

; AVX-512: Gather (indexed load)
; Load floats from base address rdi at offsets in zmm1 (int32 indices)
vgatherdps zmm0{k1}, [rdi + zmm1*4]

; AVX-512: Scatter (indexed store)
vscatterdps [rdi + zmm1*4]{k1}, zmm0
```

### 4.4 C Intrinsics Mapping

Compilers expose SIMD via intrinsics (C functions that map 1:1 to instructions):

```c
#include <immintrin.h>

// SSE: add 4 floats
__m128 a = _mm_load_ps(ptr_a);
__m128 b = _mm_load_ps(ptr_b);
__m128 c = _mm_add_ps(a, b);
_mm_store_ps(ptr_c, c);

// AVX: multiply 8 floats
__m256 x = _mm256_load_ps(ptr_x);
__m256 y = _mm256_load_ps(ptr_y);
__m256 z = _mm256_mul_ps(x, y);

// AVX-512: fused multiply-add 16 floats
__m512 p = _mm512_load_ps(ptr_p);
__m512 q = _mm512_load_ps(ptr_q);
__m512 r = _mm512_load_ps(ptr_r);
__m512 s = _mm512_fmadd_ps(p, q, r);  // s = p*q + r
```

---

## 5. ARM (AArch64 / ARM64) Architecture

AArch64, introduced with ARMv8-A (2011, first silicon 2013), is a clean 64-bit
architecture. It is not a simple extension of ARM32 -- it is a fresh design that
discards much of the legacy complexity (conditional execution on every instruction,
barrel-shifted second operand on all data processing, etc.).

### 5.1 Register File

**31 general-purpose registers:** x0-x30 (64-bit) or w0-w30 (32-bit view of the lower
half). Writing to w-registers zero-extends into the full x-register.

- **x0-x7:** argument/result registers
- **x8:** indirect result location register
- **x9-x15:** caller-saved temporaries
- **x16-x17:** intra-procedure-call scratch (linker veneers)
- **x18:** platform register (reserved on some OSes, e.g. macOS)
- **x19-x28:** callee-saved registers
- **x29 (fp):** frame pointer
- **x30 (lr):** link register (return address, set by `bl`)

**sp:** dedicated stack pointer (not one of x0-x30). Must be 16-byte aligned for
memory accesses.

**pc:** program counter. Not directly accessible as a GPR (unlike ARM32 where r15 was
the PC). Modified only by branch instructions.

**PSTATE:** process state containing condition flags (N, Z, C, V), interrupt masks,
execution state bits. Not a single addressable register; accessed via `mrs`/`msr`.

**xzr/wzr:** a zero register. Reads as zero, writes are discarded. Encoded as register
31 (same encoding as sp -- context determines which is meant).

### 5.2 Fixed-Width Instructions

Every AArch64 instruction is exactly 32 bits (4 bytes). This simplifies instruction
fetch and decode compared to x86's variable-length encoding (1-15 bytes). The tradeoff
is code density: x86 can encode common operations in fewer bytes.

Instructions are naturally aligned to 4-byte boundaries. The PC always points to an
aligned address.

### 5.3 Load/Store Architecture

AArch64 is a strict load/store architecture: arithmetic and logic instructions operate
only on registers, never directly on memory. Data must be explicitly loaded from memory
into registers, processed, and stored back. This is fundamentally different from x86,
where `add [rdi], rax` performs a read-modify-write in a single instruction.

### 5.4 Condition Codes and Predication

AArch64 removed the per-instruction conditional execution that was a hallmark of ARM32
(where every instruction could be conditionally executed with a suffix like ADDEQ,
SUBNE). Instead, AArch64 provides:

- Conditional branches: `b.eq`, `b.ne`, `b.lt`, `b.ge`, etc.
- Conditional select: `csel x0, x1, x2, eq` (x0 = x1 if eq, else x2)
- Conditional compare: `ccmp x0, x1, #0, eq` (compare only if eq)
- Conditional increment/negate/invert: `cinc`, `cneg`, `cinv`

These are more powerful building blocks than ARM32's universal predication and generate
better code on modern superscalar cores.

---

## 6. ARM64 Instructions

### 6.1 Data Processing

```asm
// Arithmetic
add     x0, x1, x2              // x0 = x1 + x2
adds    x0, x1, x2              // same but sets condition flags
sub     x0, x1, #16             // x0 = x1 - 16
subs    x0, x1, x2              // subtract and set flags (like cmp)
mul     x0, x1, x2              // x0 = x1 * x2 (low 64 bits)
madd    x0, x1, x2, x3          // x0 = x1*x2 + x3 (multiply-accumulate)
msub    x0, x1, x2, x3          // x0 = x3 - x1*x2
smulh   x0, x1, x2              // signed multiply high (upper 64 of 128-bit result)
umulh   x0, x1, x2              // unsigned multiply high
sdiv    x0, x1, x2              // signed divide
udiv    x0, x1, x2              // unsigned divide
neg     x0, x1                  // x0 = -x1

// Logical
and     x0, x1, x2
orr     x0, x1, x2              // OR (note: "orr" not "or")
eor     x0, x1, x2              // exclusive OR
bic     x0, x1, x2              // bit clear: x0 = x1 AND NOT x2
orn     x0, x1, x2              // OR NOT
mvn     x0, x1                  // bitwise NOT

// Shifts
lsl     x0, x1, #4              // logical shift left
lsr     x0, x1, #1              // logical shift right
asr     x0, x1, #3              // arithmetic shift right
ror     x0, x1, #8              // rotate right

// Bit manipulation
clz     x0, x1                  // count leading zeros
cls     x0, x1                  // count leading sign bits
rbit    x0, x1                  // reverse bits
rev     x0, x1                  // reverse bytes (endian swap)
```

### 6.2 Memory Access

```asm
// Basic load/store
ldr     x0, [x1]                // load 64-bit from [x1]
str     x0, [x1]                // store 64-bit to [x1]
ldrb    w0, [x1]                // load byte, zero-extend to 32 bits
ldrh    w0, [x1]                // load halfword (16-bit)
ldrsb   x0, [x1]                // load byte, sign-extend to 64 bits
ldrsh   x0, [x1]                // load halfword, sign-extend
ldrsw   x0, [x1]                // load word, sign-extend to 64 bits

// Addressing modes
ldr     x0, [x1, #8]            // base + unsigned offset
ldr     x0, [x1, x2]            // base + register offset
ldr     x0, [x1, x2, lsl #3]   // base + shifted register (x2 << 3)
ldr     x0, [x1, #8]!           // pre-index: x1 += 8 first, then load
ldr     x0, [x1], #8            // post-index: load, then x1 += 8

// Load/store pair (two registers at once)
ldp     x0, x1, [sp]            // load x0 from [sp], x1 from [sp+8]
stp     x29, x30, [sp, #-16]!   // push frame pointer and link register

// PC-relative (for globals, literals)
adrp    x0, mydata              // load page address of mydata (4K aligned)
add     x0, x0, :lo12:mydata   // add page offset
ldr     x1, [x0]                // load the value
```

### 6.3 Branches

```asm
b       label                    // unconditional branch
bl      function                 // branch with link (call): lr = return addr
br      x0                      // branch to address in register
blr     x0                      // branch-link to register (indirect call)
ret                              // return to address in lr (x30)

// Conditional branches
b.eq    label                    // branch if equal (Z=1)
b.ne    label                    // branch if not equal (Z=0)
b.lt    label                    // branch if less than (signed: N!=V)
b.ge    label                    // branch if greater or equal (signed: N==V)
b.lo    label                    // branch if lower (unsigned: C=0)
b.hs    label                    // branch if higher or same (unsigned: C=1)
b.gt    label                    // branch if greater than (signed: Z=0 && N==V)
b.le    label                    // branch if less or equal (signed: Z=1 || N!=V)

// Compare and branch (no prior cmp needed)
cbz     x0, label                // branch if x0 == 0
cbnz    x0, label                // branch if x0 != 0
tbz     x0, #5, label           // branch if bit 5 of x0 is zero
tbnz    x0, #5, label           // branch if bit 5 of x0 is nonzero
```

### 6.4 System Instructions

```asm
svc     #0                       // supervisor call (system call to kernel)
mrs     x0, NZCV                 // read system register to GPR
msr     NZCV, x0                 // write GPR to system register
nop                              // no operation
wfe                              // wait for event (power saving in spin loops)
wfi                              // wait for interrupt
sev                              // send event (wake cores in WFE)

// Memory barriers
dmb     ish                      // data memory barrier (inner shareable)
dsb     ish                      // data synchronization barrier
isb                              // instruction synchronization barrier
```

---

## 7. ARM64 Calling Convention (AAPCS64)

The ARM Architecture Procedure Call Standard for AArch64:

**Integer/pointer arguments:** x0-x7 (first 8 arguments). Additional arguments on
the stack.

**Floating-point/SIMD arguments:** v0-v7 (NEON registers, also called d0-d7 for
doubles, s0-s7 for floats).

**Return values:** x0/x1 (integer), v0/v1 (floating-point).

**Caller-saved:** x0-x18, v0-v7, v16-v31.

**Callee-saved:** x19-x28, v8-v15 (only the low 64 bits d8-d15 are callee-saved).

**Frame pointer:** x29 (fp). Required by the AAPCS64 for stack unwinding.

**Link register:** x30 (lr). Set by `bl`, used by `ret`.

**Stack alignment:** sp must be 16-byte aligned at all times for memory operations.

```asm
// int64_t sum_array(const int64_t *arr, size_t n)
// x0 = arr, x1 = n
// Returns sum in x0
    .global sum_array
sum_array:
    stp     x29, x30, [sp, #-16]!   // save frame pointer and link register
    mov     x29, sp                   // establish frame
    mov     x2, #0                    // accumulator = 0
    cbz     x1, .Ldone                // if n == 0, return 0
.Lloop:
    ldr     x3, [x0], #8             // x3 = *arr++  (post-index)
    add     x2, x2, x3               // accumulator += x3
    subs    x1, x1, #1               // n-- and set flags
    b.ne    .Lloop                    // loop if n != 0
.Ldone:
    mov     x0, x2                    // return value in x0
    ldp     x29, x30, [sp], #16      // restore fp and lr
    ret
```

---

## 8. ARM NEON and SVE

### 8.1 NEON (Advanced SIMD)

NEON provides 32 128-bit vector registers v0-v31. Each register can be viewed as:
- 16 x 8-bit (v0.16b)
- 8 x 16-bit (v0.8h)
- 4 x 32-bit (v0.4s)
- 2 x 64-bit (v0.2d)
- 4 x float32 (v0.4s)
- 2 x float64 (v0.2d)

```asm
// NEON: Add four 32-bit floats
ldr     q0, [x0]                // load 128 bits into v0
ldr     q1, [x1]
fadd    v2.4s, v0.4s, v1.4s    // packed float add
str     q2, [x2]                // store result

// NEON: Multiply-accumulate four floats
fmla    v2.4s, v0.4s, v1.4s    // v2 += v0 * v1 (fused multiply-add)

// NEON: Integer operations
ld1     {v0.4s}, [x0]           // load 4 x int32
ld1     {v1.4s}, [x1]
add     v2.4s, v0.4s, v1.4s    // packed int32 add
mul     v3.4s, v0.4s, v1.4s    // packed int32 multiply
st1     {v2.4s}, [x2]           // store result

// NEON: Table lookup (useful for byte shuffles, AES S-box)
tbl     v2.16b, {v0.16b}, v1.16b  // table lookup: v2[i] = v0[v1[i]]
```

### 8.2 SVE (Scalable Vector Extension)

SVE, introduced in ARMv8.2-A, is vector-length agnostic (VLA). The hardware vector
length can be anything from 128 to 2048 bits in 128-bit increments, but the code does
not need to know the length at compile time. The `cntb`, `cntw`, etc. instructions
query the runtime vector length.

**Predicate registers:** p0-p15 (1 bit per byte lane). These enable per-element
masking without separate blend instructions.

```asm
// SVE: Vector add with predication (vector-length agnostic)
whilelt p0.s, xzr, x1          // create predicate: p0[i] = (i < n)
ld1w    z0.s, p0/z, [x0]       // predicated load (inactive lanes = 0)
ld1w    z1.s, p0/z, [x2]
fadd    z2.s, z0.s, z1.s       // add all active lanes
st1w    z2.s, p0, [x3]         // predicated store

// SVE: Loop idiom for processing an array of unknown length
    mov     x3, #0                  // offset = 0
    whilelt p0.s, x3, x1           // p0 = mask for valid elements
.Lsvloop:
    ld1w    z0.s, p0/z, [x0, x3, lsl #2]  // load with byte offset
    fmul    z0.s, z0.s, z1.s              // multiply by constant vector
    st1w    z0.s, p0, [x2, x3, lsl #2]    // store
    incw    x3                             // x3 += VL/32 (elements per vector)
    whilelt p0.s, x3, x1                  // update predicate
    b.first .Lsvloop                       // loop if any active lane remains
```

SVE2 (ARMv9-A) adds fixed-point arithmetic, polynomial multiply, histograms, and
cryptography instructions -- broadening SVE beyond pure HPC workloads.

---

## 9. RISC-V

RISC-V is an open-source ISA originating from UC Berkeley (2010). Its modular design
separates the base integer instruction set from optional extensions.

### 9.1 Register File

32 integer registers, x0-x31:

| Register | ABI Name | Role |
|----------|----------|------|
| x0       | zero     | Hardwired to zero (reads 0, writes discarded) |
| x1       | ra       | Return address |
| x2       | sp       | Stack pointer |
| x3       | gp       | Global pointer |
| x4       | tp       | Thread pointer |
| x5-x7    | t0-t2    | Temporaries (caller-saved) |
| x8       | s0/fp    | Saved register / frame pointer |
| x9       | s1       | Saved register (callee-saved) |
| x10-x11  | a0-a1    | Arguments / return values |
| x12-x17  | a2-a7    | Arguments |
| x18-x27  | s2-s11   | Saved registers (callee-saved) |
| x28-x31  | t3-t6    | Temporaries (caller-saved) |

**pc:** program counter, not directly accessible as a GPR. Modified by branch/jump.

### 9.2 Base ISA and Extensions

The base integer ISA defines the core: arithmetic, logic, load/store, branches. The
naming convention indicates width and extensions:

- **RV32I:** 32-bit base integer (32 registers, 32-bit addresses)
- **RV64I:** 64-bit base integer (32 registers, 64-bit addresses)
- **RV32E:** Embedded variant (16 registers only, for microcontrollers)

Standard extensions (letters appended to the base):

| Letter | Extension | Description |
|--------|-----------|-------------|
| M | Multiply/Divide | mul, mulh, div, rem |
| A | Atomics | lr (load-reserved), sc (store-conditional), amo* |
| F | Single-precision float | 32 float registers f0-f31, fadd.s, fmul.s, etc. |
| D | Double-precision float | extends F to 64-bit doubles |
| C | Compressed | 16-bit encodings of common instructions |
| V | Vector | scalable vector processing (like ARM SVE) |
| Zicsr | CSR instructions | system register access |
| Zifencei | Instruction fence | fence.i for self-modifying code |

**G = IMAFD** (general-purpose). A typical Linux-capable RISC-V core implements
RV64GC (RV64IMAFDC).

### 9.3 Instruction Formats

RISC-V uses fixed 32-bit instructions (or 16-bit for the C extension). Six formats:

```
R-type: [funct7 | rs2 | rs1 | funct3 | rd | opcode]  -- register-register
I-type: [imm[11:0]  | rs1 | funct3 | rd | opcode]     -- immediate/load
S-type: [imm[11:5] | rs2 | rs1 | funct3 | imm[4:0] | opcode]  -- store
B-type: [imm | rs2 | rs1 | funct3 | imm | opcode]     -- branch
U-type: [imm[31:12] | rd | opcode]                     -- upper immediate
J-type: [imm[20|10:1|11|19:12] | rd | opcode]          -- jump (JAL)
```

The immediate bits are scrambled across formats to keep the register fields (rs1, rs2,
rd) in fixed positions, simplifying the decode hardware.

### 9.4 RISC-V Instructions

```asm
# Arithmetic
add     a0, a1, a2          # a0 = a1 + a2
addi    a0, a1, 10          # a0 = a1 + 10
sub     a0, a1, a2          # a0 = a1 - a2
mul     a0, a1, a2          # a0 = a1 * a2 (M extension)
div     a0, a1, a2          # a0 = a1 / a2 (signed)
rem     a0, a1, a2          # a0 = a1 % a2

# Logical
and     a0, a1, a2
or      a0, a1, a2
xor     a0, a1, a2
andi    a0, a1, 0xFF        # immediate AND

# Shifts
sll     a0, a1, a2          # shift left logical
srl     a0, a1, a2          # shift right logical
sra     a0, a1, a2          # shift right arithmetic
slli    a0, a1, 4           # shift left by immediate

# Load/Store
ld      a0, 0(a1)           # load doubleword (64-bit) from [a1 + 0]
lw      a0, 4(a1)           # load word (32-bit, sign-extended to 64)
lh      a0, 0(a1)           # load halfword (sign-extended)
lb      a0, 0(a1)           # load byte (sign-extended)
lbu     a0, 0(a1)           # load byte unsigned (zero-extended)
sd      a0, 0(a1)           # store doubleword
sw      a0, 0(a1)           # store word
sh      a0, 0(a1)           # store halfword
sb      a0, 0(a1)           # store byte

# Branches
beq     a0, a1, label       # branch if a0 == a1
bne     a0, a1, label       # branch if a0 != a1
blt     a0, a1, label       # branch if a0 < a1 (signed)
bge     a0, a1, label       # branch if a0 >= a1 (signed)
bltu    a0, a1, label       # branch if less than (unsigned)
bgeu    a0, a1, label       # branch if greater or equal (unsigned)

# Jump
jal     ra, function        # jump and link: ra = pc+4, pc = function
jalr    ra, 0(a0)           # indirect jump: ra = pc+4, pc = a0+0
j       label               # pseudo-instruction for jal zero, label
ret                         # pseudo-instruction for jalr zero, 0(ra)

# Upper immediate
lui     a0, 0x12345         # a0 = 0x12345 << 12 (load upper immediate)
auipc   a0, 0x12345         # a0 = pc + (0x12345 << 12)
```

### 9.5 Privileged Architecture

Three privilege levels:

| Level | Name | Typical use |
|-------|------|-------------|
| M (Machine) | Most privileged | Firmware, bootloader, SBI |
| S (Supervisor) | OS kernel | Linux kernel |
| U (User) | Least privileged | User applications |

System call instruction: `ecall` (raises an environment call exception to the next
higher privilege level). `ebreak` triggers a breakpoint exception.

### 9.6 RISC-V Code Example

```asm
# RV64I: Sum an array of 64-bit integers
# a0 = pointer to array, a1 = element count
# Returns sum in a0
    .global sum_array
sum_array:
    li      t0, 0               # accumulator = 0
    beqz    a1, .Lend           # if count == 0, return 0
.Lloop:
    ld      t1, 0(a0)           # load element
    add     t0, t0, t1          # accumulate
    addi    a0, a0, 8           # advance pointer
    addi    a1, a1, -1          # decrement count
    bnez    a1, .Lloop          # loop if count > 0
.Lend:
    mv      a0, t0              # return value in a0
    ret
```

---

## 10. MIPS

MIPS (Microprocessor without Interlocked Pipeline Stages) was developed at Stanford by
John Hennessy (1985). It became the canonical RISC teaching architecture and powered
SGI workstations, Nintendo 64, PlayStation 1/2/PSP, and countless embedded routers
(Broadcom, Atheros).

### 10.1 Register File

32 registers, $0-$31, with conventional names:

| Register | Name | Convention |
|----------|------|-----------|
| $0 | $zero | Hardwired to zero |
| $1 | $at | Assembler temporary |
| $2-$3 | $v0-$v1 | Return values |
| $4-$7 | $a0-$a3 | Arguments |
| $8-$15 | $t0-$t7 | Temporaries (caller-saved) |
| $16-$23 | $s0-$s7 | Saved (callee-saved) |
| $24-$25 | $t8-$t9 | More temporaries |
| $26-$27 | $k0-$k1 | Kernel reserved |
| $28 | $gp | Global pointer |
| $29 | $sp | Stack pointer |
| $30 | $fp/$s8 | Frame pointer / saved |
| $31 | $ra | Return address |

Plus `hi` and `lo` registers for multiply/divide results, and the `pc`.

### 10.2 Delay Slots

MIPS has **branch delay slots**: the instruction immediately following a branch always
executes, regardless of whether the branch is taken. This was an artifact of the
original 5-stage pipeline. The assembler typically fills the delay slot with a useful
instruction or a `nop`.

```asm
# MIPS: Branch with delay slot
    beq     $t0, $t1, target    # branch if t0 == t1
    addi    $t2, $t2, 1         # THIS ALWAYS EXECUTES (delay slot)
target:
    # ...
```

Similarly, `lw` has a **load delay** on MIPS I: the loaded value is not available in
the instruction immediately following the load. Later MIPS revisions added interlocks,
making this a pipeline stall rather than a programmer-visible hazard.

### 10.3 MIPS Instructions

```asm
# Arithmetic
add     $t0, $t1, $t2      # $t0 = $t1 + $t2 (trap on overflow)
addu    $t0, $t1, $t2      # unsigned add (no trap)
addi    $t0, $t1, 100      # $t0 = $t1 + 100
sub     $t0, $t1, $t2
mult    $t1, $t2            # hi:lo = $t1 * $t2
mfhi    $t0                 # $t0 = hi
mflo    $t0                 # $t0 = lo
div     $t1, $t2            # lo = quotient, hi = remainder

# Logical
and     $t0, $t1, $t2
or      $t0, $t1, $t2
xor     $t0, $t1, $t2
nor     $t0, $t1, $t2      # NOR (NOT OR) -- MIPS has no NOT
sll     $t0, $t1, 4        # shift left logical
srl     $t0, $t1, 2        # shift right logical
sra     $t0, $t1, 2        # shift right arithmetic

# Memory
lw      $t0, 0($sp)        # load word from [sp + 0]
sw      $t0, 0($sp)        # store word to [sp + 0]
lb      $t0, 0($a0)        # load byte (sign-extended)
lbu     $t0, 0($a0)        # load byte unsigned
lh      $t0, 0($a0)        # load halfword
sh      $t0, 0($a0)        # store halfword

# Branches
beq     $t0, $t1, label    # branch if equal
bne     $t0, $t1, label    # branch if not equal
slt     $t0, $t1, $t2      # set on less than: $t0 = ($t1 < $t2) ? 1 : 0
slti    $t0, $t1, 10       # set on less than immediate

# Jump
j       label               # jump (26-bit target)
jal     function            # jump and link: $ra = pc+8
jr      $ra                 # jump register (return)
syscall                     # system call
```

### 10.4 Historical Significance

MIPS matters because it established the RISC principles that pervade modern
architecture: fixed instruction width, load/store separation, large uniform register
file, pipelined execution. Hennessy and Patterson's textbooks used MIPS as the primary
teaching ISA for decades. RISC-V is, in many ways, MIPS redesigned with the benefit of
30 years of hindsight -- and without patents.

MIPS Technologies was acquired by Wave Computing (2018), which went bankrupt.
MIPS is now largely historical; new designs choose ARM or RISC-V.

---

## 11. Instruction Encoding

### 11.1 x86: Variable-Length Encoding

An x86-64 instruction can be 1 to 15 bytes. The structure:

```
[Prefixes] [REX] [Opcode] [ModR/M] [SIB] [Displacement] [Immediate]
 0-4 bytes  0-1   1-3      0-1      0-1    0/1/2/4        0/1/2/4/8
```

**Example: `add rax, [rbx + rcx*4 + 8]`**

```
Encoding:  48 03 44 8B 08
           |  |  |  |  |
           |  |  |  |  +-- displacement = 8
           |  |  |  +----- SIB: scale=4(10), index=rcx(001), base=rbx(011)
           |  |  +-------- ModR/M: mod=01 (disp8), reg=rax(000), r/m=100 (SIB follows)
           |  +----------- opcode: 03 = ADD r64, r/m64
           +-------------- REX.W prefix (48 = 0100 1000, W=1 for 64-bit)
```

The ModR/M byte encodes up to two operands:
- **mod** (bits 7-6): addressing mode (00=indirect, 01=disp8, 10=disp32, 11=register)
- **reg** (bits 5-3): register operand or opcode extension
- **r/m** (bits 2-0): register or memory operand (100 = SIB follows, 101 = disp32/RIP)

The SIB (Scale-Index-Base) byte:
- **scale** (bits 7-6): 00=1, 01=2, 10=4, 11=8
- **index** (bits 5-3): index register (100 = none)
- **base** (bits 2-0): base register (101 = disp32 when mod=00)

Variable-length encoding yields excellent code density for common instructions (`push
rbx` is one byte: 0x53) but makes parallel decode difficult. Modern x86 CPUs use
dedicated pre-decode stages and instruction-length decoders to handle this.

### 11.2 ARM64: Fixed 32-Bit Encoding

Every AArch64 instruction is exactly 4 bytes. The top bits identify the instruction
class:

```
Bits [31:25] determine the major group:
  100x xxxx = Data processing (immediate)
  x101 xxxx = Branch, exception, system
  xx1x 0xxx = Load/store
  x1x1 xxxx = Data processing (register)
  0x11 1xxx = Data processing (SIMD/FP)
```

**Example: `add x0, x1, x2` encodes as `8B020020`**

```
1000 1011 0000 0010 0000 0000 0010 0000
|||| ||        |rs2 |      |rs1 | rd
|||| |+------- shift type = LSL
|||| +-------- sf=1 (64-bit)
|||+---------- S=0 (no flags)
||+----------- op=0 (ADD)
|+------------ 01011 = data processing (register)
```

Fixed-width encoding means the CPU can trivially identify instruction boundaries and
fetch/decode multiple instructions per cycle. The cost is lower code density compared
to x86.

### 11.3 RISC-V: Fixed 32-Bit (with 16-Bit Compressed)

RISC-V base instructions are 32 bits. The C (compressed) extension provides 16-bit
encodings of the most common instructions. The two lowest bits distinguish them:

```
Bits [1:0] = 11  --> 32-bit instruction
Bits [1:0] != 11 --> 16-bit compressed instruction
```

**Example: `add a0, a1, a2` (R-type)**

```
0000000 00110 00101 000 01010 0110011
|funct7 |rs2  |rs1  |f3 |rd   |opcode
                                0110011 = OP (integer register-register)
                          000 = ADD
0000000 = standard ADD (vs 0100000 for SUB)
```

The consistent placement of rs1, rs2, and rd fields across all formats simplifies
the register file read logic.

### 11.4 Why Encoding Matters

Variable-length (x86) vs. fixed-width (ARM, RISC-V):

| Property | Variable-length | Fixed-width |
|----------|----------------|-------------|
| Code density | Better (common ops = fewer bytes) | Worse (always 4 bytes) |
| Decode complexity | High (instruction boundary detection) | Low (trivial boundaries) |
| Superscalar fetch | Harder (need pre-decode) | Easier (known alignment) |
| Branch target alignment | Any byte | Must be 4-byte aligned |
| Instruction cache efficiency | Better (more instructions per line) | Worse |
| Decoder power consumption | Higher | Lower |

Modern x86 CPUs decode the variable-length instructions into fixed-width micro-ops
(uops) internally, effectively converting to a RISC-like internal format. AMD and Intel
invest enormous die area in the decode stage to make this fast.

---

## 12. Registers as the Programmer's View

### 12.1 Architectural vs Physical Registers

The registers visible to the programmer (architectural registers) are a software
abstraction. Internally, a modern out-of-order CPU has far more physical registers:

- **x86-64:** 16 architectural GPRs, but Intel Skylake has ~180 physical integer
  registers and ~168 physical vector registers.
- **ARM Cortex-A78:** 31 architectural GPRs, ~120+ physical registers.

**Register renaming** maps architectural registers to physical registers dynamically,
eliminating false dependencies (WAR and WAW hazards). Example:

```asm
; Without renaming, instruction 3 must wait for instruction 1
; (both write to rax), even though they are independent
mov     rax, [rdi]          ; (1) load A into rax
add     rbx, rax            ; (2) uses rax from (1)
mov     rax, [rsi]          ; (3) load B into rax  <-- WAW with (1)
add     rcx, rax            ; (4) uses rax from (3)

; With renaming: (1) writes to p47, (3) writes to p52
; Instructions (1)+(2) and (3)+(4) can execute in parallel
```

### 12.2 The Register File as Fastest Memory

The memory hierarchy in access latency:

| Level | Latency | Size (typical) |
|-------|---------|----------------|
| Registers | 0 cycles (bypass network) | 16-32 arch, ~180 physical |
| L1 cache | 4-5 cycles | 32-48 KB |
| L2 cache | 12-14 cycles | 256 KB - 1 MB |
| L3 cache | 30-50 cycles | 8-64 MB |
| Main memory (DRAM) | 100-200 cycles | 16-256 GB |

The register file is not just faster than cache -- it has zero latency when data
forwarding (bypass) is used. The result of an ALU operation is available to the next
dependent instruction in the same cycle via the bypass network, before it is even
written back to the register file.

### 12.3 Special Register Conventions Across Architectures

| Role | x86-64 | ARM64 | RISC-V | MIPS |
|------|--------|-------|--------|------|
| Stack pointer | rsp | sp (dedicated) | x2 (sp) | $29 ($sp) |
| Frame pointer | rbp | x29 (fp) | x8 (s0/fp) | $30 ($fp) |
| Link register | (stack) | x30 (lr) | x1 (ra) | $31 ($ra) |
| Zero register | (none) | xzr/wzr | x0 (zero) | $0 ($zero) |
| Return value | rax | x0 | x10 (a0) | $2 ($v0) |
| Syscall number | rax | x8 | a7 (x17) | $2 ($v0) |

x86-64 is unique in lacking a link register: `call` pushes the return address onto the
stack, and `ret` pops it. ARM64, RISC-V, and MIPS store the return address in a
register, which is faster for leaf functions that never need to touch the stack.

---

## 13. Memory Model

### 13.1 x86: Total Store Order (TSO)

x86-64 implements TSO, one of the strongest hardware memory models:

- **Loads are not reordered with other loads.**
- **Stores are not reordered with other stores.**
- **Loads may be reordered with earlier stores** (to different addresses). This is the
  only reordering visible to software.
- **Stores are never reordered with earlier loads.**

In practice, TSO means most concurrent algorithms that work on x86 do not need explicit
memory barriers. The `mfence` instruction provides a full barrier when needed (e.g., for
implementing `std::atomic` with `memory_order_seq_cst`). `lock`-prefixed instructions
(e.g., `lock xadd`) provide atomic read-modify-write with implicit full fencing.

```asm
; x86-64: Atomic increment (implicit full barrier)
lock inc qword [rdi]

; x86-64: Compare-and-swap
mov     rax, [expected]
lock cmpxchg [rdi], rcx     ; if [rdi] == rax, set [rdi] = rcx, ZF=1
                             ; else rax = [rdi], ZF=0

; Explicit memory fence (rarely needed on x86)
mfence                       ; full barrier
sfence                       ; store fence (orders stores, for NT stores)
lfence                       ; load fence (serializes loads, for Spectre)
```

### 13.2 ARM: Weakly Ordered

ARM's memory model is significantly weaker than x86. The hardware can reorder loads
and stores freely (with respect to other loads and stores) unless barriers are used.
This allows more aggressive optimization in the memory pipeline but requires the
programmer to insert explicit barriers for concurrent code.

```asm
// ARM64 memory barriers
dmb     ish                  // Data Memory Barrier (inner shareable domain)
                             // All memory accesses before the barrier are
                             // visible before any memory access after it

dmb     ishld                // Load-load and load-store barrier only
dmb     ishst                // Store-store barrier only

dsb     ish                  // Data Synchronization Barrier
                             // Like DMB, but also ensures completion (not just ordering)

isb                          // Instruction Synchronization Barrier
                             // Flushes the pipeline; needed after modifying
                             // page tables or writing instructions to memory

// ARM64 acquire/release (ARMv8.3 LDAPR, ARMv8.0 LDAR/STLR)
ldar    x0, [x1]            // load-acquire: no loads/stores after this
                             // can be reordered before it
stlr    x0, [x1]            // store-release: no loads/stores before this
                             // can be reordered after it
ldadd   x0, x1, [x2]        // atomic fetch-and-add with acquire semantics
```

The common pattern for lock-free algorithms on ARM:
- Use `ldar`/`stlr` (acquire/release) for synchronization variables.
- Use `dmb` for more complex ordering requirements.
- Forgetting barriers is a class of bug that is invisible on x86 (TSO masks it) but
  causes real failures on ARM.

### 13.3 RISC-V: RVWMO (Weak Memory Ordering)

RISC-V defines its own weak memory ordering model, RVWMO. Like ARM, most reorderings
are permitted. The `fence` instruction provides ordering:

```asm
# RISC-V fence instruction
fence   rw, rw              # full barrier (read/write before, read/write after)
fence   w, w                # store-store barrier
fence   r, r                # load-load barrier
fence   rw, w               # release fence
fence   r, rw               # acquire fence
fence.tso                   # TSO fence (only prevents store-load reordering)

# RISC-V atomic operations (A extension)
lr.d    t0, (a0)            # load-reserved doubleword
sc.d    t1, t2, (a0)        # store-conditional (t1 = 0 if success)

# Atomic memory operations
amoadd.d t0, t1, (a0)       # atomic fetch-and-add
amoswap.d t0, t1, (a0)      # atomic swap
amoor.d  t0, t1, (a0)       # atomic fetch-and-OR

# Acquire/release ordering on atomics
lr.d.aq  t0, (a0)           # load-reserved with acquire
sc.d.rl  t1, t2, (a0)       # store-conditional with release
amoadd.d.aqrl t0, t1, (a0)  # atomic add with full ordering
```

### 13.4 Why Memory Ordering Matters

On a single core, the processor maintains the illusion of sequential execution. On
multiple cores sharing memory, the hardware's reordering of loads and stores can make
one core observe another core's writes in a different order than they were issued.

A classic example -- Dekker's algorithm for mutual exclusion:

```c
// Thread 1                    // Thread 2
flag1 = 1;                     flag2 = 1;
if (flag2 == 0) {              if (flag1 == 0) {
    // enter critical section      // enter critical section
}                              }
```

On x86 (TSO), the store-load reordering can allow both threads to enter the critical
section simultaneously. An `mfence` after each store prevents this. On ARM and RISC-V,
even more reorderings are possible, requiring acquire/release or full barriers.

---

## 14. Privilege Levels

### 14.1 x86: Protection Rings

x86 defines four privilege levels (rings 0-3), encoded in the CPL (Current Privilege
Level) stored in the CS segment register:

| Ring | Name | Typical use |
|------|------|-------------|
| 0 | Kernel mode | OS kernel, drivers |
| 1 | (unused) | Originally for OS services |
| 2 | (unused) | Originally for OS extensions |
| 3 | User mode | Applications |

Modern OSes use only ring 0 (kernel) and ring 3 (user). Hardware virtualization adds
VMX root/non-root modes (Intel VT-x) orthogonal to the ring system. Ring -1 is
informal terminology for the hypervisor running in VMX root mode.

**System call mechanism (64-bit):**

```asm
; Linux x86-64 system call convention:
; syscall number in rax
; arguments in rdi, rsi, rdx, r10, r8, r9
; return value in rax
; rcx and r11 are clobbered by syscall instruction

; sys_write(1, msg, 13)
mov     rax, 1              ; syscall number for write
mov     rdi, 1              ; fd = stdout
lea     rsi, [rel msg]      ; buffer address
mov     rdx, 13             ; length
syscall                     ; enter kernel

; sys_exit(0)
mov     rax, 60             ; syscall number for exit
xor     rdi, rdi            ; exit code = 0
syscall
```

The `syscall` instruction:
1. Saves rip in rcx and rflags in r11.
2. Loads the kernel entry point from the LSTAR MSR.
3. Sets CPL to 0 (ring 0).
4. Jumps to the kernel entry point.

`sysret` reverses the process, restoring rip from rcx and rflags from r11.

### 14.2 ARM: Exception Levels

ARM defines four Exception Levels (EL0-EL3), with higher numbers meaning greater
privilege:

| Level | Name | Use |
|-------|------|-----|
| EL0 | Application | User-space processes |
| EL1 | OS Kernel | Linux, Windows, etc. |
| EL2 | Hypervisor | KVM, Xen, VMware |
| EL3 | Secure Monitor | ARM Trusted Firmware, TrustZone |

Each EL has its own set of system registers (e.g., SCTLR_EL1, TTBR0_EL1 for the
kernel's page tables). Transitions between levels occur via exceptions (interrupts,
system calls, etc.) and exception returns.

```asm
// ARM64 system call (Linux)
// syscall number in x8
// arguments in x0-x5
// return value in x0

// write(1, msg, 13)
mov     x0, #1              // fd = stdout
adrp    x1, msg             // buffer address (page)
add     x1, x1, :lo12:msg   // buffer address (offset)
mov     x2, #13             // length
mov     x8, #64             // syscall number for write (ARM64 Linux)
svc     #0                   // supervisor call -> EL0 to EL1

// exit(0)
mov     x0, #0              // exit code
mov     x8, #93             // syscall number for exit
svc     #0
```

`svc` (Supervisor Call) generates a synchronous exception, causing the processor to
enter EL1 at the vector table's synchronous exception handler.

### 14.3 RISC-V: Machine, Supervisor, User

| Mode | Abbreviation | Use |
|------|-------------|-----|
| Machine (M) | M-mode | Firmware, SBI (Supervisor Binary Interface) |
| Supervisor (S) | S-mode | OS kernel |
| User (U) | U-mode | Applications |

M-mode is always present. S-mode and U-mode are optional (embedded systems may
implement only M-mode). The Supervisor Binary Interface (SBI) provides a standard
firmware API, similar to ARM's PSCI or x86's BIOS/UEFI runtime services.

```asm
# RISC-V system call (Linux)
# syscall number in a7
# arguments in a0-a5
# return value in a0

# write(1, msg, 13)
li      a0, 1               # fd = stdout
la      a1, msg              # buffer address
li      a2, 13               # length
li      a7, 64               # syscall number for write
ecall                        # environment call -> U-mode to S-mode

# exit(0)
li      a0, 0               # exit code
li      a7, 93               # syscall number for exit
ecall
```

`ecall` generates an environment call exception. In U-mode, it traps to S-mode. In
S-mode, it traps to M-mode. The `mtvec`/`stvec` CSRs point to the exception handler.

---

## 15. Complete Examples

### 15.1 x86-64 Hello World (Linux, NASM, Intel syntax)

```asm
; hello.asm -- Linux x86-64, NASM syntax
; Assemble: nasm -f elf64 hello.asm
; Link:     ld -o hello hello.o

section .data
    msg     db  "Hello, world!", 0x0A   ; string + newline
    msglen  equ $ - msg                  ; length = current pos - start

section .text
    global _start

_start:
    ; sys_write(stdout, msg, msglen)
    mov     rax, 1              ; syscall: write
    mov     rdi, 1              ; fd: stdout
    lea     rsi, [rel msg]      ; pointer to message
    mov     rdx, msglen         ; message length
    syscall

    ; sys_exit(0)
    mov     rax, 60             ; syscall: exit
    xor     rdi, rdi            ; exit code: 0
    syscall
```

### 15.2 ARM64 Hello World (Linux, GNU as)

```asm
// hello.s -- Linux AArch64, GNU assembler
// Assemble: aarch64-linux-gnu-as -o hello.o hello.s
// Link:     aarch64-linux-gnu-ld -o hello hello.o

    .data
msg:
    .ascii  "Hello, world!\n"
    .set    msglen, . - msg

    .text
    .global _start

_start:
    // write(1, msg, msglen)
    mov     x0, #1              // fd = stdout
    adrp    x1, msg             // page address of msg
    add     x1, x1, :lo12:msg  // page offset of msg
    mov     x2, #msglen        // length
    mov     x8, #64             // syscall: write
    svc     #0

    // exit(0)
    mov     x0, #0              // exit code
    mov     x8, #93             // syscall: exit
    svc     #0
```

### 15.3 x86-64 Function: Fibonacci (System V ABI)

```asm
; uint64_t fibonacci(uint64_t n)
; Iterative computation of the nth Fibonacci number
; n in rdi, result in rax
; Uses only caller-saved registers -- no save/restore needed

    global fibonacci
fibonacci:
    cmp     rdi, 1
    jbe     .base               ; if n <= 1, return n

    xor     rax, rax            ; a = F(0) = 0
    mov     rcx, 1              ; b = F(1) = 1
    mov     rdx, rdi            ; counter = n

.loop:
    mov     rsi, rcx            ; temp = b
    add     rcx, rax            ; b = a + b
    mov     rax, rsi            ; a = temp (old b)
    dec     rdx
    jnz     .loop

    ret                         ; F(n) in rax

.base:
    mov     rax, rdi            ; return n (0 or 1)
    ret
```

### 15.4 ARM64 Function: Fibonacci (AAPCS64)

```asm
// uint64_t fibonacci(uint64_t n)
// n in x0, result in x0

    .global fibonacci
fibonacci:
    cmp     x0, #1
    b.ls    .Lbase              // if n <= 1, return n

    mov     x1, #0              // a = F(0) = 0
    mov     x2, #1              // b = F(1) = 1
    mov     x3, x0              // counter = n

.Lloop:
    mov     x4, x2              // temp = b
    add     x2, x2, x1         // b = a + b
    mov     x1, x4              // a = old b
    subs    x3, x3, #1
    b.ne    .Lloop

    mov     x0, x1              // return a (which is F(n))
    ret

.Lbase:
    ret                         // x0 already contains n (0 or 1)
```

### 15.5 SSE Vector Addition (x86-64)

```asm
; void vec4_add(const float *a, const float *b, float *result)
; rdi = a, rsi = b, rdx = result
; Adds four floats using SSE

    global vec4_add
vec4_add:
    movaps  xmm0, [rdi]        ; load 4 floats from a (must be 16-byte aligned)
    movaps  xmm1, [rsi]        ; load 4 floats from b
    addps   xmm0, xmm1         ; xmm0[i] = a[i] + b[i], i=0..3
    movaps  [rdx], xmm0        ; store result
    ret

; Unaligned version (slower on older CPUs, same speed on modern)
    global vec4_add_unaligned
vec4_add_unaligned:
    movups  xmm0, [rdi]        ; unaligned load
    movups  xmm1, [rsi]
    addps   xmm0, xmm1
    movups  [rdx], xmm0        ; unaligned store
    ret
```

### 15.6 RISC-V: GCD (Euclidean Algorithm)

```asm
# uint64_t gcd(uint64_t a, uint64_t b)
# a0 = a, a1 = b
# Returns gcd in a0

    .global gcd
gcd:
    beqz    a1, .Ldone          # if b == 0, return a
.Lloop:
    rem     t0, a0, a1          # t0 = a % b
    mv      a0, a1              # a = b
    mv      a1, t0              # b = remainder
    bnez    a1, .Lloop          # loop while b != 0
.Ldone:
    ret
```

---

## 16. Cross-Architecture Summary

### 16.1 Design Philosophy Comparison

| Aspect | x86-64 | ARM64 | RISC-V |
|--------|--------|-------|--------|
| ISA type | CISC (decoded to uops) | RISC | RISC |
| Instruction width | Variable (1-15 bytes) | Fixed (32-bit) | Fixed (32/16-bit) |
| GPR count | 16 | 31 | 31 (x0 = zero) |
| Zero register | None | xzr/wzr | x0 |
| Link register | Stack (implicit) | x30 | x1 (ra) |
| Condition codes | RFLAGS (implicit set) | PSTATE (explicit set) | None (compare-and-branch) |
| Memory model | TSO (strong) | Weak | RVWMO (weak) |
| Load/store arch | No (mem-to-mem ops) | Yes | Yes |
| Addressing complexity | Very high (SIB) | Moderate | Simple (base+offset) |
| SIMD | SSE/AVX/AVX-512 | NEON/SVE/SVE2 | V extension |
| Endianness | Little-endian | Bi-endian (LE default) | Little-endian (default) |
| License | Proprietary (Intel/AMD) | Licensed (ARM Holdings) | Open (free, no license) |

### 16.2 Syscall Comparison

| | x86-64 Linux | ARM64 Linux | RISC-V Linux |
|---|---|---|---|
| Instruction | `syscall` | `svc #0` | `ecall` |
| Number register | rax | x8 | a7 |
| Arg registers | rdi, rsi, rdx, r10, r8, r9 | x0-x5 | a0-a5 |
| Return register | rax | x0 | a0 |
| Error indicator | rax < 0 (negated errno) | x0 < 0 (negated errno) | a0 < 0 (negated errno) |
| Clobbered | rcx, r11 | (none specified) | (none specified) |

### 16.3 Calling Convention Comparison

| | System V x86-64 | AAPCS64 (ARM64) | RISC-V |
|---|---|---|---|
| Integer args | rdi,rsi,rdx,rcx,r8,r9 | x0-x7 | a0-a7 |
| Float args | xmm0-xmm7 | v0-v7 | fa0-fa7 |
| Return | rax(/rdx) | x0(/x1) | a0(/a1) |
| Callee-saved | rbx,rbp,r12-r15 | x19-x28 | s0-s11 (x8-x9,x18-x27) |
| Stack align | 16 bytes | 16 bytes | 16 bytes |
| Red zone | 128 bytes | None | None |

---

## 17. Instruction Latencies and Throughput

Understanding instruction costs is essential for performance-critical assembly. These
are representative values for a modern out-of-order core (e.g., Intel Alder Lake P-core
or ARM Cortex-X3):

| Operation | x86-64 latency | ARM64 latency | Notes |
|-----------|---------------|---------------|-------|
| Integer add/sub | 1 cycle | 1 cycle | Fully pipelined, multiple per cycle |
| Integer multiply | 3 cycles | 3 cycles | |
| Integer divide (64-bit) | 35-90 cycles | 7-12 cycles | Highly variable |
| L1 cache load | 4-5 cycles | 4 cycles | |
| Branch (predicted) | 0-1 cycles | 0-1 cycles | Misprediction: ~15-20 cycles |
| SSE/NEON add (float) | 4 cycles | 2-4 cycles | |
| SSE/NEON multiply (float) | 4 cycles | 3-4 cycles | |
| FMA (fused multiply-add) | 4 cycles | 4 cycles | |
| AVX-512 operation | 4-6 cycles | N/A | May downclock on some Intel CPUs |

Throughput (instructions per cycle) matters as much as latency. A modern x86 core can
execute 4-6 micro-ops per cycle; ARM Cortex-X4 can dispatch up to 10 operations per
cycle. The key insight: latency determines serial speed; throughput determines parallel
speed. Assembly optimization is largely about maximizing throughput by avoiding
data dependencies between consecutive instructions.

---

## 18. Assembler Directives and Sections

Assembler directives are not instructions -- they are commands to the assembler that
control output layout, data definitions, and symbol visibility.

### 18.1 NASM (x86-64)

```asm
section .text                   ; executable code
section .data                   ; initialized data
section .bss                    ; uninitialized data (zero-filled)
section .rodata                 ; read-only data

global  my_func                 ; make symbol visible to linker
extern  printf                  ; reference external symbol

align   16                      ; align next item to 16-byte boundary

db      0x41, 0x42              ; define bytes
dw      0x1234                  ; define word (16-bit)
dd      3.14                    ; define doubleword (32-bit float or int)
dq      6.28318                 ; define quadword (64-bit double or int)

times   64 db 0                 ; repeat: 64 zero bytes (like .space)

my_str  db  "hello", 0          ; null-terminated string
my_arr  dd  1, 2, 3, 4, 5      ; array of 5 int32

resb    1024                    ; reserve 1024 bytes (BSS only)
resq    16                      ; reserve 16 quadwords

%define BUFSIZE 4096            ; preprocessor constant
%macro  prologue 0              ; macro definition
    push    rbp
    mov     rbp, rsp
%endmacro
```

### 18.2 GNU as (ARM64, RISC-V)

```asm
    .text                       // executable code section
    .data                       // initialized data
    .bss                        // uninitialized data
    .rodata                     // read-only data

    .global my_func             // export symbol
    .extern printf              // import symbol
    .type   my_func, %function  // mark as function (for ELF)
    .size   my_func, . - my_func // set symbol size

    .align  4                   // align to 2^4 = 16 bytes

    .byte   0x41, 0x42          // define bytes
    .hword  0x1234              // define halfword
    .word   0x12345678          // define word (32-bit)
    .quad   0xDEADBEEFCAFEBABE  // define quadword (64-bit)
    .float  3.14                // IEEE 754 single
    .double 6.28318             // IEEE 754 double

    .ascii  "hello"             // string (no null terminator)
    .asciz  "hello"             // null-terminated string
    .string "hello"             // same as .asciz

    .space  1024                // reserve 1024 zero bytes
    .fill   256, 1, 0xFF       // fill 256 bytes with 0xFF

    .equ    BUFSIZE, 4096       // constant definition
    .set    VERSION, 3          // same as .equ

    .macro  push_pair a, b      // macro
    stp     \a, \b, [sp, #-16]!
    .endm
```

---

## References

1. Intel 64 and IA-32 Architectures Software Developer Manuals (SDM), Volumes 1-4.
   Intel Corporation. https://www.intel.com/sdm

2. AMD64 Architecture Programmer's Manual, Volumes 1-5.
   AMD. https://developer.amd.com/resources/developer-guides-manuals/

3. ARM Architecture Reference Manual for A-profile architecture (ARM DDI 0487).
   ARM Limited. https://developer.arm.com/documentation/ddi0487/

4. The RISC-V Instruction Set Manual, Volume I: Unprivileged ISA (ratified).
   RISC-V International. https://riscv.org/technical/specifications/

5. The RISC-V Instruction Set Manual, Volume II: Privileged Architecture (ratified).
   RISC-V International.

6. System V Application Binary Interface, AMD64 Architecture Processor Supplement.
   https://gitlab.com/x86-psABIs/x86-64-ABI

7. Procedure Call Standard for the Arm 64-bit Architecture (AAPCS64).
   ARM Limited. https://developer.arm.com/documentation/ihi0055/

8. Hennessy, J. L. & Patterson, D. A. (2019). Computer Organization and Design:
   The RISC-V Edition. Morgan Kaufmann.

9. Agner Fog. Instruction Tables: Lists of instruction latencies, throughputs
   and micro-operation breakdowns. https://agner.org/optimize/

10. MIPS Architecture documentation. MIPS Technologies (historical).

---

## Appendix: Updates 2025–2026

This appendix was added in April 2026 as part of a catalog-wide enrichment
pass. Between the time this document was first written and the time of the
enrichment, the instruction-set landscape shifted meaningfully in three
places. The shift has not yet reached most assembly textbooks, so it is
worth capturing here.

### 1. Intel AVX10 and APX — the x86 vector and register reboot

Intel's Instruction Set Extensions Programming Reference Revision 060
(November 2025) confirms three related ISAs that, taken together, are the
largest structural change to x86 assembly in more than a decade.

- **AVX10.1 and AVX10.2** are the converged replacement for AVX-512 on
  hybrid CPUs. The 512-bit vector path that Intel spent a decade building
  out never reached the entire client lineup — Alder Lake's E-cores did
  not support AVX-512, and Intel ended up disabling it in hybrid parts in
  early 2022 to avoid a fragmented target. AVX10 fixes this by versioning
  the ISA rather than versioning the vector width: an AVX10.2-capable CPU
  supports the full AVX-512 instruction semantics (embedded rounding, 32
  vector registers, 8 mask registers) but at a guaranteed minimum vector
  register length of 256 bits, with 512-bit optional. E-cores can implement
  the 256-bit baseline, P-cores can implement 512, and the same binary runs
  on both. This is structurally similar to Arm's SVE2, which has always
  been vector-length-agnostic.
- **APX** (Advanced Performance Extensions) doubles x86's general-purpose
  register count from 16 to 32, eliminating one of the oldest and most
  painful constraints in x86-64 code generation. Compilers will be able
  to keep roughly twice as many values in registers, reducing spill
  traffic and — in register-pressured inner loops — measurably improving
  throughput. The encoding uses a new REX2 prefix so existing binaries
  continue to decode correctly.
- **FRED** (Flexible Return and Event Delivery) — a reworking of x86's
  exception and interrupt delivery model, developed jointly by Intel and
  AMD, that replaces the 1970s-era IDT mechanism with a per-privilege
  stack model. This does not change assembly-programmer concerns directly
  but cleans up the kernel side of the interrupt path.

Intel has confirmed that Nova Lake (the generation after Arrow Lake) will
be the first consumer CPU family to ship with AVX10.2 and APX support.
As of April 2026 no Nova Lake silicon has shipped; the CPU family is
expected in late 2026 or early 2027.

For an assembly programmer, the practical consequence is that x86-64
assembly is about to get a new register file layout for the first time
since 2003. Code that hand-tunes register allocation for x86-64 will need
to be revisited. Code that is written against an intrinsics or SIMD
abstraction layer will not.

**Sources:** [Intel Unveils AVX10 and APX Instruction Sets — AnandTech](https://www.anandtech.com/show/18975/intel-unveils-avx10-and-apx-isas-unifying-avx512-for-hybrid-architectures-) · [Intel Confirms Nova Lake Will Support AVX10.2 & APX — Phoronix](https://www.phoronix.com/news/Nova-Lake-Does-AVX10.2-APX) · [Intel's new x86 instruction sets: APX and AVX10 — AnandTech Forums](https://forums.anandtech.com/threads/intels-new-x86-instruction-sets-apx-and-avx10.2613950/) · [Intel AVX10 & APX announcement — Agner Fog's CPU blog](https://www.agner.org/forum/viewtopic.php?t=115)

### 2. RISC-V hits the server market — RVA23 and CUDA-on-RISC-V

2025 was the year RISC-V stopped being an embedded story and became a
server story. The key events, in order:

- **January 2025** — SpacemiT announced the VitalStone V100, a server
  processor with up to 64 RISC-V cores. This is the first RISC-V part
  credibly positioned for server workloads rather than networking,
  microcontrollers, or low-power accelerators.
- **March 2025** — Alibaba's DAMO Academy launched the Xuantie C930, a
  server-grade core supporting the RVA23 application profile.
- **2025** — The **RVA23 profile** was ratified. RVA23 makes the Vector
  Extension (RVV 1.0), hypervisor extension, and bit-manipulation
  extensions mandatory for application processors. This is the RISC-V
  equivalent of "armv8-a is now a baseline" — it gives toolchains and
  kernels a single binary target they can optimize against.
- **Late 2025** — NVIDIA announced that the CUDA software stack will
  fully support RISC-V. This is perhaps the most significant single
  event for RISC-V in a server context, because it opens the
  accelerator-attached software ecosystem that is currently x86/Arm-only.
- **Late 2025** — Qualcomm acquired Ventana Micro Systems, the RISC-V
  server-core startup, indicating that Qualcomm intends to build
  server-class RISC-V silicon at scale rather than license a core.

For assembly programmers, the RVA23 baseline matters because it collapses
the profile-matrix that made RISC-V painful to target. Before RVA23 you
had to choose which extensions to assume; after RVA23 you can assume all
of the ones you actually care about and rely on the toolchain to accept
them. The RVV 1.0 vector path in particular is now a stable target that
compilers can optimize aggressively, which takes RISC-V from "scalar-ok,
vector-speculative" to "vector-standard" as a target for hand-written
SIMD-equivalent assembly.

**Sources:** [RISC-V International — riscv.org](https://riscv.org/) · [RISC-V — Wikipedia](https://en.wikipedia.org/wiki/RISC-V) · [RISC-V vs ARM vs x86: The 2025 Silicon Architecture Showdown](https://ts2.tech/en/risc-v-vs-arm-vs-x86-the-2025-silicon-architecture-showdown/) · [The RISC-V Revolution: How an Open-Source Architecture is Upending the Silicon Status Quo](https://markets.financialcontent.com/wral/article/tokenring-2026-1-28-the-risc-v-revolution-how-an-open-source-architecture-is-upending-the-silicon-status-quo)

### 3. SIMD everywhere — AVX10.2, RVV, and smarter compilers

A common thread through the AVX10 and RVA23 stories is that both
architectures are converging on **vector-length-agnostic SIMD** — code
that expresses "do this operation on each element of this vector" without
committing to a specific vector width. AVX10 has AVX10.2 with 256-bit and
512-bit variants. RISC-V has RVV 1.0 with runtime-determined vector
length. Arm has SVE2 with the same property.

Practitioner writing from 2025 (Ivo Balbaert, in Deep Engineering #17)
frames this as the end of the era where compilers pretended SIMD did not
exist and hand-written intrinsics were the only realistic path to vector
speed. The new compilers — Clang, GCC, and Intel's proprietary stack —
can increasingly auto-vectorize loops against the length-agnostic
variants of all three architectures, emitting the same high-level IR
regardless of the target. Hand-written assembly for SIMD inner loops is
not dead, but for the first time in decades it is no longer the default
choice for experienced numerical programmers.

The practical consequence for this document is that the chapter on
"Architectures, Instructions, and Machine Interface" has to include a
layer above the concrete instruction sets — a layer at which "a vector"
is a thing you operate on without committing to a specific hardware
register width. That layer did not exist in the main body above; it
does now.

**Source:** [Deep Engineering #17: SIMD in 2025 — AVX10.2, RVV, & smarter compilers with Ivo Balbaert — Medium](https://medium.com/deep-engineering/deep-engineering-17-simd-in-2025-avx10-2-rvv-smarter-compilers-with-ivo-balbaert-22053cd22250)

## Related College Departments

This research cross-links to the following college departments in
`.college/departments/`:

- [**coding**](../../../.college/departments/coding/DEPARTMENT.md) —
  Assembly is the coding topic that sits at the boundary of the
  Programming Fundamentals and Computing & Society wings. Understanding
  how a loop compiles to machine code is the concrete backing for the
  abstract concepts of control flow, data types, and memory.
- [**electronics**](../../../.college/departments/electronics/DEPARTMENT.md)
  — Instructions are digital circuits. The boundary between "what the
  hardware does" and "what the assembler lets you write" is where
  electronics and computer science meet. For anyone building or
  understanding physical computing hardware, assembly is the level at
  which the hardware becomes legible.
- [**engineering**](../../../.college/departments/engineering/DEPARTMENT.md)
  — Instruction-set architecture is a systems-engineering topic. AVX10,
  APX, RVA23, and SVE2 are all the result of design trade-offs between
  hardware cost, software compatibility, and workload characteristics.
  They are worked examples for engineering-design thinking.
- [**history**](../../../.college/departments/history/DEPARTMENT.md) —
  The path from the IBM 704 instruction format to APX's 32 general-purpose
  registers is a sixty-year thread worth tracing. It is also a case study
  in how backwards compatibility constraints shape design decisions
  decades after the constraints themselves have stopped being
  load-bearing.

---

*Appendix: Updates 2025–2026 and the Related College Departments section added during the Session 018 catalog enrichment pass. The body above this appendix is unchanged from the original document.*
