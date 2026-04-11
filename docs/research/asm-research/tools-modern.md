# Assembly Language Tools and Modern Ecosystem

## Chapter Overview

Assembly language is not just a historical curiosity. It is a living, actively-used layer
of the software stack. The tools surrounding it -- assemblers, linkers, debuggers,
disassemblers, and analysis frameworks -- form a mature ecosystem that spans decades of
engineering. This chapter covers every major tool category, from the assembler that
translates mnemonics into machine code to the reverse engineering suites used to read
code that was never meant to be read.

---

## 1. Assemblers

An assembler translates assembly language source code into machine code object files.
Unlike compilers, assemblers perform a relatively direct translation: each mnemonic
corresponds to one (or occasionally a few) machine instructions. The complexity lies
in macro systems, expression evaluation, output format generation, and platform support.

### NASM -- Netwide Assembler

NASM is the most popular assembler for learning x86 and x86-64 assembly on Linux. It
uses Intel syntax, which most programmers find more readable than AT&T syntax. NASM is
open source (BSD-2-Clause), cross-platform, and outputs a wide range of object formats
including ELF, Mach-O, PE/COFF, and raw binaries.

Key characteristics:

- **Intel syntax** with explicit size specifiers (`dword`, `qword`)
- **Flat memory model** by default -- no segment assumptions
- **Powerful macro system** with `%macro`, `%define`, `%rep`, conditional assembly
- **Multi-format output**: `-f elf64`, `-f macho64`, `-f win64`, `-f bin`
- **Preprocessor** that operates before assembly, similar to C's cpp

A minimal NASM program for Linux x86-64:

```nasm
; hello.asm -- NASM, Linux x86-64
section .data
    msg db "Hello, world!", 10    ; 10 = newline
    len equ $ - msg

section .text
    global _start

_start:
    mov rax, 1          ; syscall: write
    mov rdi, 1          ; fd: stdout
    mov rsi, msg        ; buffer
    mov rdx, len        ; count
    syscall

    mov rax, 60         ; syscall: exit
    xor rdi, rdi        ; status: 0
    syscall
```

Assemble and link:

```bash
nasm -f elf64 hello.asm -o hello.o
ld hello.o -o hello
./hello
```

NASM is the recommended assembler for anyone learning x86-64 assembly. Its syntax is
clean, its documentation is thorough, and its error messages are clear.

### MASM -- Microsoft Macro Assembler

MASM is Microsoft's assembler, shipped with Visual Studio. It uses Intel syntax with
some Microsoft-specific extensions. MASM has deep Windows integration and supports
structured exception handling (SEH), INVOKE directives for calling conventions, and
PROTO declarations for function prototypes.

Key characteristics:

- **Intel syntax** with MASM-specific directives (`.code`, `.data`, `PROC`, `ENDP`)
- **INVOKE** directive handles calling convention automatically
- **ASSUME** directive for segment register tracking
- **Integrated with Visual Studio** build system
- **Windows-only** -- outputs PE/COFF objects

MASM is commonly used for Windows driver development, COM/ActiveX components, and
legacy Windows system programming. The 64-bit version (`ml64.exe`) drops some legacy
features like INVOKE but remains the standard Windows assembler.

### FASM -- Flat Assembler

FASM is notable for being self-hosting: FASM is written in assembly language and
assembles itself. Created by Tomasz Grysztar, FASM uses Intel syntax and emphasizes
minimalism and self-sufficiency.

Key characteristics:

- **Self-hosting** -- the assembler is written in its own language
- **Single-pass design** with multiple resolution passes for forward references
- **Powerful macro system** using `macro`, `struc`, and `virtual` blocks
- **Direct binary output** -- can produce executables without a linker
- **fasmg** (FASM next generation) adds a more powerful macro engine

FASM is popular in the OSDev (operating system development) community because it can
produce flat binaries, bootloader code, and complete executables without external tools.

### GAS -- GNU Assembler

GAS (GNU Assembler, invoked as `as`) is part of GNU Binutils and is the assembler
that GCC emits code for. It uses AT&T syntax by default on x86, though the `.intel_syntax`
directive can switch to Intel syntax.

Key characteristics:

- **AT&T syntax** by default: `movq %rsi, %rdi` (source, destination)
- **Multi-architecture**: x86, ARM, AARCH64, MIPS, RISC-V, PowerPC, SPARC, and more
- **Tight GCC integration** -- reads GCC's assembly output directly
- **Section directives**: `.text`, `.data`, `.bss`, `.section`
- **Pseudo-ops**: `.globl`, `.align`, `.byte`, `.long`, `.ascii`, `.asciz`
- **CFI directives** for DWARF debug info: `.cfi_startproc`, `.cfi_def_cfa_offset`

GAS is rarely used directly by humans for x86 programming because AT&T syntax is
cumbersome. However, it is indispensable for ARM and RISC-V development, where the
syntax differences from Intel are less jarring. Every `gcc -S` output is GAS-format
assembly.

### YASM

YASM is a rewrite of NASM with a modular architecture. It supports both Intel and
AT&T syntax, outputs multiple object formats, and was designed to be a drop-in NASM
replacement with better internals. YASM added features like GAS-compatible input and
DWARF2 debug information support before NASM did.

In practice, YASM's development has slowed considerably, and NASM has caught up on
most features. Projects that once preferred YASM (like FFmpeg) have largely switched
back to NASM.

### LLVM Integrated Assembler

LLVM includes an integrated assembler that runs as part of the compilation pipeline.
When Clang compiles C/C++ code, it can go directly from LLVM IR to object code without
invoking an external assembler. This integrated assembler supports both AT&T and Intel
syntax and handles inline assembly in compiled languages.

The integrated assembler is also available standalone via `llvm-mc`:

```bash
llvm-mc -triple=x86_64-linux-gnu -filetype=obj input.s -o output.o
llvm-mc -triple=aarch64-linux-gnu --disassemble input.bin
```

### armasm and Architecture-Specific Assemblers

ARM provides `armasm` as part of the ARM Compiler toolchain (Keil/DS-5). It uses
ARM's native assembly syntax with UAL (Unified Assembly Language) for code that works
in both ARM and Thumb modes. Most ARM development today uses GAS via GCC or Clang,
but `armasm` remains important for legacy projects and specific Keil MDK workflows.

Other architecture-specific assemblers include IBM's HLASM (High Level Assembler) for
z/Architecture mainframes, which maintains backward compatibility with code written
in the 1960s.

### AT&T vs Intel Syntax

The two dominant x86 assembly syntaxes differ in nearly every visual aspect:

| Feature | Intel (NASM/MASM) | AT&T (GAS) |
|---------|-------------------|-------------|
| Operand order | `dest, src` | `src, dest` |
| Register prefix | none (`rax`) | `%` (`%rax`) |
| Immediate prefix | none (`42`) | `$` (`$42`) |
| Memory reference | `[rax + rbx*4 + 8]` | `8(%rax,%rbx,4)` |
| Size specifier | `dword ptr`, `qword` | suffix: `l`, `q` (`movl`, `movq`) |
| Hex literals | `0x1A` or `1Ah` | `$0x1A` |
| Comments | `;` | `#` (or `//` on some platforms) |

The same instruction in both syntaxes:

```
; Intel: move 64-bit value from memory at [rbp-8] into rax
mov rax, [rbp - 8]

# AT&T: same instruction
movq -8(%rbp), %rax
```

Intel syntax reads more naturally to most programmers (destination = source, like
assignment). AT&T syntax's advantage is that the size suffix on the mnemonic makes
operand sizes unambiguous without separate size specifiers.

GAS supports Intel syntax via directive:

```gas
.intel_syntax noprefix
mov rax, [rbp - 8]
```

GDB can switch syntax with `set disassembly-flavor intel`.

---

## 2. Linkers

The linker combines object files (`.o` / `.obj`) into executables or shared libraries.
It resolves symbol references, performs relocations, assigns virtual addresses, and
writes the final binary in the platform's executable format.

### GNU ld

The standard GNU linker, part of Binutils. It supports ELF (Linux/BSD), PE/COFF
(Windows via MinGW), and many embedded formats. GNU ld reads linker scripts that
control memory layout, section placement, and symbol visibility.

```bash
ld -o program main.o utils.o -lc -dynamic-linker /lib64/ld-linux-x86-64.so.2
```

### gold -- Google's Linker

gold (Google ld) was written by Ian Lance Taylor at Google to address GNU ld's
performance problems on large C++ codebases. It is ELF-only and typically 2-5x faster
than GNU ld for large projects. gold is also part of Binutils and can be selected with
`-fuse-ld=gold`.

### lld -- LLVM Linker

lld is LLVM's linker, designed as a drop-in replacement for system linkers. It supports
ELF, Mach-O, PE/COFF, and WebAssembly. lld is significantly faster than GNU ld and
often faster than gold, especially on large C++ projects (Chromium, LLVM itself).

```bash
clang -fuse-ld=lld -o program main.o utils.o
```

lld achieves its speed through aggressive parallelism in symbol resolution and
relocation processing. For the Chromium project, lld reduced link times from minutes
to seconds.

### link.exe -- MSVC Linker

Microsoft's linker, part of Visual Studio. It produces PE (Portable Executable) format
binaries and supports incremental linking, whole-program optimization (LTCG), and
Profile-Guided Optimization (PGO). link.exe is the only linker that fully supports
MSVC's object file format extensions.

### Object File Formats

The linker's input and output formats define the structure of compiled programs:

**ELF (Executable and Linkable Format)** -- the standard on Linux, FreeBSD, and most
Unix-like systems. ELF files contain a header, program headers (for loading), and
section headers (for linking). The format supports both static and dynamic linking,
shared libraries (`.so`), and core dumps.

**Mach-O (Mach Object)** -- Apple's binary format, used on macOS, iOS, and all Apple
platforms. Mach-O files contain load commands that describe segments and sections.
Universal (fat) binaries can contain multiple architectures in a single file.

**PE/COFF (Portable Executable / Common Object File Format)** -- the Windows executable
format. PE files begin with an MS-DOS stub ("This program cannot be run in DOS mode"),
followed by PE headers, section headers, and an import/export table. DLLs use the same
format as EXEs with a flag difference.

### Sections

Object files and executables are divided into sections with specific purposes:

| Section | Purpose | Permissions |
|---------|---------|-------------|
| `.text` | Executable code | Read + Execute |
| `.data` | Initialized global/static data | Read + Write |
| `.bss` | Uninitialized data (zero-filled at load) | Read + Write |
| `.rodata` | Read-only constants, string literals | Read only |
| `.symtab` | Symbol table | (metadata) |
| `.strtab` | String table for symbol names | (metadata) |
| `.rel.text` | Relocation entries for `.text` | (metadata) |
| `.debug_*` | DWARF debugging information | (metadata) |
| `.plt` / `.got` | Procedure Linkage / Global Offset Table | Read (+ Execute for .plt) |

The `.bss` section is notable: it occupies no space in the file on disk but is
allocated and zero-initialized when the program loads. A program declaring `int
buffer[1000000];` as a global adds 4MB to `.bss` but zero bytes to the file.

---

## 3. Debuggers

Debuggers allow stepping through assembly instructions one at a time, examining
registers and memory, setting breakpoints on specific addresses, and inspecting
the call stack. When working at the assembly level, the debugger is your primary
interactive tool.

### GDB -- GNU Debugger

GDB is the standard debugger on Linux and most Unix-like systems. It supports
source-level debugging for C/C++/Rust/Go and raw assembly-level debugging for
any binary.

Essential GDB commands for assembly work:

```
# Start debugging
gdb ./program

# Set Intel syntax (much more readable)
(gdb) set disassembly-flavor intel

# Set breakpoint at label or address
(gdb) break _start
(gdb) break *0x401000

# Run the program
(gdb) run

# Single-step one instruction (step INTO calls)
(gdb) stepi
(gdb) si

# Step over one instruction (step OVER calls)
(gdb) nexti
(gdb) ni

# Continue execution
(gdb) continue
(gdb) c

# Disassemble current function
(gdb) disassemble
(gdb) disas

# Disassemble specific range
(gdb) disas 0x401000, 0x401050

# Print all registers
(gdb) info registers
(gdb) i r

# Print specific register
(gdb) print/x $rax
(gdb) p/x $rsp

# Examine memory
# x/[count][format][size] address
# format: x=hex, d=decimal, s=string, i=instruction
# size: b=byte, h=halfword, w=word, g=giant (8 bytes)
(gdb) x/16xb $rsp          # 16 bytes at stack pointer, hex
(gdb) x/4xg $rsp           # 4 qwords at stack pointer, hex
(gdb) x/10i $rip           # 10 instructions at instruction pointer
(gdb) x/s 0x402000         # string at address

# Print the stack
(gdb) info stack
(gdb) backtrace

# Watch a memory address for changes
(gdb) watch *0x404000

# Display expression after each stop
(gdb) display/x $rax
(gdb) display/i $rip

# Show layout with source and assembly
(gdb) layout asm
(gdb) layout regs
```

A complete GDB assembly debugging session:

```
$ gdb ./hello
GNU debugger (GDB) 14.2
(gdb) set disassembly-flavor intel
(gdb) break _start
Breakpoint 1 at 0x401000
(gdb) run
Starting program: /home/user/hello

Breakpoint 1, 0x0000000000401000 in _start ()
(gdb) disas
Dump of assembler code for function _start:
=> 0x0000000000401000 <+0>:    mov    eax,0x1
   0x0000000000401005 <+5>:    mov    edi,0x1
   0x000000000040100a <+10>:   movabs rsi,0x402000
   0x0000000000401014 <+20>:   mov    edx,0xe
   0x0000000000401019 <+25>:   syscall
   0x000000000040101b <+27>:   mov    eax,0x3c
   0x0000000000401020 <+32>:   xor    edi,edi
   0x0000000000401022 <+34>:   syscall
End of assembler dump.
(gdb) si
0x0000000000401005 in _start ()
(gdb) i r rax
rax            0x1                 1
(gdb) si
(gdb) i r rdi
rdi            0x1                 1
(gdb) x/14cb 0x402000
0x402000:  72 'H'  101 'e'  108 'l'  108 'l'  111 'o'  44 ','  32 ' '
0x402007:  119 'w'  111 'o'  114 'r'  108 'l'  100 'd'  33 '!'  10 '\n'
(gdb) c
Continuing.
Hello, world!
[Inferior 1 (process 12345) exited normally]
```

**Core dumps** are memory snapshots from crashed programs. Enable them with
`ulimit -c unlimited`, then debug with `gdb ./program core`. The core dump preserves
all register state and memory at the moment of the crash, allowing post-mortem
analysis of the exact instruction that faulted.

### LLDB -- LLVM Debugger

LLDB is LLVM's debugger, the default on macOS and increasingly used on Linux. Its
command syntax differs from GDB but covers the same capabilities:

```
(lldb) settings set target.x86-disassembly-flavor intel
(lldb) breakpoint set --name _start
(lldb) run
(lldb) thread step-inst          # stepi equivalent
(lldb) register read             # info registers
(lldb) register read rax
(lldb) memory read --size 8 --format x --count 4 $rsp
(lldb) disassemble --frame       # disassemble current function
(lldb) disassemble --start-address 0x401000 --count 20
```

### WinDbg -- Windows Debugger

WinDbg is Microsoft's debugger for Windows kernel and user-mode debugging. It uses
its own command syntax and is the only debugger that fully supports Windows kernel
debugging, crash dump analysis, and driver debugging.

```
# Break at address
bp 0x00401000

# Single step
t                    # trace (step into)
p                    # step over

# Registers
r                    # all registers
r rax                # specific register

# Disassemble
u rip                # unassemble at current instruction
u 0x401000 L10       # 10 instructions at address

# Memory
db rsp L40           # display bytes
dq rsp L8            # display qwords
da 0x402000          # display ASCII string
```

WinDbg Preview (the modern UWP version) adds a graphical interface with memory
visualization, timelines, and a TTD (Time Travel Debugging) feature that records
execution and allows stepping backward.

---

## 4. Disassemblers and Reverse Engineering

Disassemblers translate machine code back into assembly language. This is the
inverse of assembly -- and it is lossy. Variable names, comments, structure
definitions, and high-level control flow are not present in machine code. The
disassembler reconstructs what it can; the human analyst fills in the rest.

### Command-Line Tools

**objdump** (GNU Binutils) disassembles object files and executables:

```bash
# Disassemble all executable sections
objdump -d program

# Intel syntax
objdump -d -M intel program

# With source interleaving (if compiled with -g)
objdump -d -S -M intel program

# Disassemble specific section
objdump -d -j .text -M intel program

# Show all headers
objdump -x program

# Show dynamic relocations
objdump -R program
```

Sample objdump output:

```
program:     file format elf64-x86-64

Disassembly of section .text:

0000000000401000 <_start>:
  401000:       b8 01 00 00 00          mov    eax,0x1
  401005:       bf 01 00 00 00          mov    edi,0x1
  40100a:       48 be 00 20 40 00 00    movabs rsi,0x402000
  401011:       00 00 00
  401014:       ba 0e 00 00 00          mov    edx,0xe
  401019:       0f 05                   syscall
  40101b:       b8 3c 00 00 00          mov    eax,0x3c
  401020:       31 ff                   xor    edi,edi
  401022:       0f 05                   syscall
```

The left column shows addresses, the middle shows raw bytes (the actual machine code),
and the right shows the disassembled mnemonics.

**readelf** examines ELF file structure without disassembly:

```bash
readelf -h program          # ELF header (entry point, architecture)
readelf -S program          # section headers
readelf -l program          # program headers (segments)
readelf -s program          # symbol table
readelf -d program          # dynamic section (shared library deps)
readelf -r program          # relocations
readelf --notes program     # notes (build ID, GNU properties)
```

**nm** lists symbols in object files:

```bash
nm program                  # all symbols
nm -C program               # demangle C++ names
nm -D program               # dynamic symbols only
nm --defined-only program   # only defined (not external) symbols
```

Symbol types in nm output: `T` = text (code), `D` = initialized data, `B` = BSS,
`U` = undefined (external reference), `W` = weak symbol.

### IDA Pro -- Hex-Rays

IDA Pro (Interactive Disassembler Professional), created by Ilfak Guilfanov and
published by Hex-Rays, is the gold standard of binary analysis. First released in
1996, IDA pioneered interactive disassembly -- the ability to rename symbols, add
comments, define structures, and change type information while exploring a binary.

Key capabilities:

- **Recursive descent disassembly** with aggressive heuristics for code discovery
- **FLIRT** (Fast Library Identification and Recognition Technology) -- identifies
  standard library functions by signature, even in stripped binaries
- **Hex-Rays Decompiler** -- translates assembly into pseudo-C code, available for
  x86, x64, ARM32, ARM64, MIPS, and PowerPC
- **IDAPython** -- Python scripting API for automation
- **Type system** -- full C struct/enum/typedef support applied to disassembly
- **Cross-references** (xrefs) -- tracks every reference to and from every address
- **Plugin ecosystem** -- hundreds of community plugins

IDA Pro is commercial software (expensive: thousands of dollars per license). A free
version (IDA Free) provides limited non-commercial x86-64 disassembly.

### Ghidra

Ghidra is a software reverse engineering framework developed by the NSA and released
as open source in 2019. It provides capabilities comparable to IDA Pro at no cost.

Key capabilities:

- **Multi-architecture support**: x86, x64, ARM, AARCH64, MIPS, PowerPC, SPARC,
  AVR, and many more (over 30 processor families)
- **Decompiler** -- produces C-like pseudocode, comparable to Hex-Rays
- **Collaborative reverse engineering** -- Ghidra Server allows teams to work on
  the same binary simultaneously
- **Scripting** via Java and Python (Jython)
- **Version tracking** -- compare two versions of the same binary
- **Written in Java** -- runs on Windows, macOS, and Linux
- **PCode** -- intermediate representation that enables architecture-independent analysis

Ghidra's release was a watershed moment for the reverse engineering community. It
made professional-grade binary analysis tools available to students, researchers, and
security professionals who could not afford IDA Pro.

### Binary Ninja

Binary Ninja (Vector 35) is a modern binary analysis platform emphasizing API quality
and intermediate representations. It provides three levels of IL (Intermediate Language):
Lifted IL, Low Level IL (LLIL), Medium Level IL (MLIL), and High Level IL (HLIL).
This layered approach makes it particularly powerful for automated binary analysis
and vulnerability research.

### Radare2 / Rizin / Cutter

Radare2 is an open-source, command-line-first reverse engineering framework. It is
powerful but has a notoriously steep learning curve (its commands are terse, often
single-character). Rizin is a fork of Radare2 with a focus on usability improvements.
Cutter is a graphical front-end for Rizin that provides a more approachable interface.

```bash
# Radare2 session
r2 -A program              # open with automatic analysis
[0x00401000]> afl           # list all functions
[0x00401000]> pdf @ main    # print disassembly of main
[0x00401000]> VV @ main     # visual graph mode
[0x00401000]> s main        # seek to main
[0x00401000]> px 64         # print hex dump, 64 bytes
```

### Decompilation

Modern decompilers (Hex-Rays, Ghidra, Binary Ninja) attempt to reconstruct C-like
source code from machine code. The output is not the original source -- variable names
are lost, types are inferred, and control flow is reconstructed from branch instructions.
But for a skilled analyst, decompiled output is dramatically faster to read than raw
assembly.

Decompilation quality depends on: optimization level of the original compilation
(higher optimization = harder to decompile), presence of debug information, and
the decompiler's understanding of the target ABI and calling conventions.

---

## 5. Compiler Explorer (godbolt.org)

Compiler Explorer, created by Matt Godbolt in 2012, fundamentally changed how
programmers interact with assembly language. The concept is simple: paste high-level
code in the left pane, see the compiler's assembly output in the right pane, in real
time.

### What Makes It Revolutionary

Before Compiler Explorer, seeing the assembly output of a C function required:

```bash
gcc -S -O2 -o output.s input.c
# then open output.s in a text editor
# then manually correlate source lines to assembly
```

Compiler Explorer automates this entirely and adds color-coded source-to-assembly
mapping: each line of source code is color-matched to its corresponding assembly
instructions. You can see exactly which machine instructions each line of C produces.

### Features

- **Multiple compilers**: GCC, Clang, MSVC, ICC (Intel), ARM compilers, and many
  others across dozens of versions
- **Multiple languages**: C, C++, Rust, Go, D, Zig, Haskell, Swift, Fortran, Pascal,
  and more
- **Multiple architectures**: x86-64, ARM, AARCH64, MIPS, RISC-V, PowerPC, s390x,
  WebAssembly, AVR, MSP430
- **Optimization flags**: experiment with `-O0` through `-O3`, `-Os`, `-Ofast`
- **Diff mode**: compare assembly output between two compilers or two optimization levels
- **Execution**: run the compiled code and see output
- **Binary output**: view raw machine code bytes alongside assembly
- **LLVM IR**: view Clang's intermediate representation
- **Conformance view**: test code against multiple compiler versions simultaneously
- **Short links**: share specific examples via URL

### Using Compiler Explorer to Learn

The most effective way to learn assembly is not to write it from scratch but to write
C code and read the assembly output. Compiler Explorer makes this instantaneous.

Example: paste this C function:

```c
int square(int x) {
    return x * x;
}
```

With GCC 14.1 at `-O2`, the output (x86-64) is:

```asm
square:
        imul    edi, edi
        mov     eax, edi
        ret
```

Three instructions. The argument arrives in `edi` (System V AMD64 ABI), the multiply
is performed in-place, the result moves to `eax` (return value register), and the
function returns. No stack frame, no prologue/epilogue -- the compiler knows they are
unnecessary.

Change the optimization to `-O0` and the output balloons:

```asm
square:
        push    rbp
        mov     rbp, rsp
        mov     DWORD PTR [rbp-4], edi
        mov     eax, DWORD PTR [rbp-4]
        imul    eax, eax
        pop     rbp
        ret
```

Now there is a stack frame, the argument is spilled to the stack and reloaded. This
is why optimization matters -- and why `-O0` output is misleading as a representation
of what modern CPUs actually execute.

### Compiler Explorer for Side-by-Side Comparison

One of the most powerful uses is comparing how different languages compile the same
logic:

C:
```c
int abs_val(int x) {
    return x < 0 ? -x : x;
}
```

Rust:
```rust
pub fn abs_val(x: i32) -> i32 {
    if x < 0 { -x } else { x }
}
```

Both produce identical x86-64 assembly under optimization:

```asm
        mov     eax, edi
        neg     eax
        cmovs   eax, edi
        ret
```

This demonstrates that Rust's safety guarantees have zero overhead at the assembly
level for code like this. Compiler Explorer makes this visible in seconds.

Matt Godbolt's 2017 CppCon talk, "What Has My Compiler Done for Me Lately?", brought
Compiler Explorer to a much wider audience and is an excellent introduction to reading
compiler output.

---

## 6. Inline Assembly

Inline assembly allows embedding assembly instructions directly within high-level
language code. This provides access to specific machine instructions without writing
a separate assembly file.

### GCC Extended Asm

GCC's extended asm syntax is the most widely used inline assembly mechanism on
Unix-like systems:

```c
int result;
int input = 42;

asm volatile (
    "imul %[in], %[in], %[in]"    // instruction template
    : [in] "=r" (result)           // output operands
    : "0" (input)                  // input operands ("0" = same as output 0)
    : /* no clobbers */            // clobber list
);
// result == 42 * 42 == 1764
```

The four sections separated by colons:

1. **Template string**: assembly instructions with `%[name]` or `%0`/`%1` operand
   placeholders
2. **Output operands**: `"=r"(var)` means "write result to a register, store in var"
3. **Input operands**: `"r"(var)` means "load var into a register"
4. **Clobber list**: registers or memory modified by the asm that the compiler does
   not know about

**Constraint letters**:

| Constraint | Meaning |
|------------|---------|
| `r` | Any general-purpose register |
| `a` | `rax`/`eax`/`ax`/`al` |
| `b` | `rbx`/`ebx` |
| `c` | `rcx`/`ecx` |
| `d` | `rdx`/`edx` |
| `m` | Memory operand |
| `i` | Immediate integer |
| `=` | Output (write-only) |
| `+` | Input and output (read-write) |
| `&` | Early clobber (written before inputs consumed) |

**CPUID example** -- a classic use case where inline assembly is necessary because
there is no C equivalent for the CPUID instruction:

```c
#include <stdio.h>

void get_cpu_vendor(char vendor[13]) {
    unsigned int eax, ebx, ecx, edx;
    asm volatile (
        "cpuid"
        : "=a"(eax), "=b"(ebx), "=c"(ecx), "=d"(edx)
        : "a"(0)       // CPUID function 0
    );
    // Vendor string is in ebx:edx:ecx (yes, that order)
    *(unsigned int *)&vendor[0] = ebx;
    *(unsigned int *)&vendor[4] = edx;
    *(unsigned int *)&vendor[8] = ecx;
    vendor[12] = '\0';
}

int main(void) {
    char vendor[13];
    get_cpu_vendor(vendor);
    printf("CPU Vendor: %s\n", vendor);
    return 0;
}
```

**Read timestamp counter** -- accessing the TSC for high-precision timing:

```c
static inline unsigned long long rdtsc(void) {
    unsigned int lo, hi;
    asm volatile (
        "rdtsc"
        : "=a"(lo), "=d"(hi)
    );
    return ((unsigned long long)hi << 32) | lo;
}
```

### MSVC Inline Assembly

MSVC uses a different, simpler (but less powerful) syntax:

```c
// MSVC 32-bit only -- __asm is not supported in 64-bit MSVC
int square(int x) {
    __asm {
        mov eax, x
        imul eax, eax
    }
    // return value is in eax
}
```

MSVC dropped inline assembly support for 64-bit code. Microsoft's recommendation is
to use compiler intrinsics instead (e.g., `_mm_add_ps` for SSE, `__cpuid` for CPUID).

### Rust Inline Assembly

Rust stabilized the `asm!` macro in version 1.59 (February 2022):

```rust
use std::arch::asm;

fn cpuid_vendor() -> [u8; 12] {
    let mut vendor = [0u8; 12];
    let ebx: u32;
    let ecx: u32;
    let edx: u32;

    unsafe {
        asm!(
            "push rbx",        // rbx is callee-saved
            "cpuid",
            "mov {ebx:e}, ebx",
            "pop rbx",
            ebx = out(reg) ebx,
            out("ecx") ecx,
            out("edx") edx,
            in("eax") 0u32,
        );
    }

    vendor[0..4].copy_from_slice(&ebx.to_le_bytes());
    vendor[4..8].copy_from_slice(&edx.to_le_bytes());
    vendor[8..12].copy_from_slice(&ecx.to_le_bytes());
    vendor
}
```

Rust's `asm!` syntax is more explicit than GCC's: register names are used directly
instead of constraint letters, and the syntax makes the direction of data flow clearer.

### When to Use Inline Assembly

Use inline assembly for:

- **CPUID and processor identification** -- no C equivalent
- **Special instructions**: `rdtsc`, `rdrand`, `clflush`, `mfence`, `wbinvd`
- **Atomic operations** not expressible with C11 atomics
- **SIMD intrinsics** when compiler intrinsics are not available or insufficient
- **Context switching** in OS kernels (save/restore register state)
- **Constant-time cryptographic operations** where compiler optimization must be
  prevented to avoid timing side channels

### When NOT to Use Inline Assembly

In most cases, the compiler generates better code than hand-written assembly:

- **General computation**: the compiler's register allocator, instruction scheduler,
  and optimization passes produce superior code for arithmetic, loops, and data
  manipulation
- **SIMD**: use compiler intrinsics (`_mm256_add_ps`, etc.) instead -- they give the
  compiler freedom to schedule and optimize around the SIMD operations
- **Performance-critical loops**: try compiler flags (`-O3`, `-march=native`,
  `-ffast-math`) and profile before resorting to assembly
- **Portability**: inline assembly is inherently platform-specific and makes code
  unportable

The general rule: compiler intrinsics first, inline assembly only when no intrinsic
exists for the instruction you need.

---

## 7. Where Assembly Is Still Written by Hand in 2025

Assembly language is not a museum piece. Significant amounts of hand-written assembly
exist in production systems and are actively maintained. The common thread is that these
are places where the programmer needs control the compiler cannot provide.

### Bootloaders

The first code that executes when a computer powers on must be assembly. The CPU
starts in real mode (x86) or a minimal state (ARM), with no stack, no C runtime,
and often no RAM (it must be initialized by the boot code).

**GRUB Stage 1** (`boot.S`): 512 bytes of x86 real-mode assembly that fits in the MBR.
It loads Stage 1.5 or Stage 2 from disk. Every byte is precious at this stage.

**UEFI stubs**: even UEFI-based boot, which can run C code early, requires assembly
for the initial entry point and processor mode transitions.

### Kernel Entry Points

Operating system kernels contain assembly at their boundaries with hardware:

**Linux x86-64 entry** (`arch/x86/entry/entry_64.S`): handles system call entry,
interrupt handlers, and context switching. The `SYSCALL` instruction transitions from
user mode to kernel mode, and the entry code must save all user registers, switch
stacks, and set up the kernel environment -- all before any C code can run.

**Linux ARM64 entry** (`arch/arm64/kernel/entry.S`): exception vectors, system call
dispatch, interrupt handling, and EL (Exception Level) transitions.

### Context Switching

When an OS switches from one thread to another, it must save the complete register
state of the current thread and restore the saved state of the next thread. This
inherently requires assembly -- you cannot save `rsp` (the stack pointer) from C code
because C is using the stack that `rsp` points to.

Linux's x86-64 context switch is in `arch/x86/kernel/process_64.c` (the C wrapper)
calling into assembly that saves `rbx`, `rbp`, `r12-r15`, `rsp`, and the FPU/SSE state.

### Cryptographic Primitives

Cryptographic code often requires assembly for **constant-time execution**. A C
compiler may introduce branches, early exits, or variable-time instructions that
leak information through timing side channels. Hand-written assembly ensures that
execution time is independent of secret data.

**OpenSSL** contains extensive hand-written assembly for AES, SHA, ChaCha20, and
elliptic curve operations. The assembly implementations use:

- AES-NI instructions (`aesenc`, `aesdec`) for hardware-accelerated AES
- SHA-NI instructions for hardware SHA-256
- PCLMULQDQ for carry-less multiplication (GCM mode)
- Constant-time conditional moves (`cmov`) instead of branches

**libsodium** and **BoringSSL** (Google's OpenSSL fork) similarly contain hand-tuned
assembly for their core primitives.

### Codec Hot Paths

Video and audio codecs contain some of the most performance-sensitive code in
existence. A single function (like an 8x8 DCT or motion estimation) may execute
billions of times during video encoding.

**FFmpeg** contains thousands of lines of hand-written x86 SIMD assembly (using NASM)
in `libavcodec/x86/`, `libavutil/x86/`, and similar directories. These implement:

- HEVC/H.265 transforms and prediction
- VP9 loop filtering
- AAC decoding
- Pixel format conversion
- Scaling and resampling

**dav1d** (the AV1 decoder from VideoLAN) has extremely optimized assembly for ARM
NEON and x86 AVX2/AVX-512, achieving significant speedups over C implementations.

**x264** (H.264 encoder) contains hand-tuned assembly for motion estimation, DCT,
quantization, and entropy coding that represents decades of optimization work.

### Compression Libraries

**zlib-ng** (the modernized fork of zlib) includes SIMD-optimized assembly for CRC32
(using CRC32C instructions and PCLMULQDQ), Adler32, and deflate matching.

**lz4** and **zstd** include platform-specific assembly for their hot decompression
paths.

### JIT Compiler Backends

Just-In-Time compilers emit machine code at runtime. The code that generates this
machine code is essentially an assembler embedded in the JIT, and the templates it
emits are hand-crafted assembly sequences:

- **V8 TurboFan** (Chrome's JavaScript engine): code generation backends in
  `src/compiler/backend/x64/` and `src/compiler/backend/arm64/`
- **HotSpot C2** (Java): assembler classes that emit x86-64 and AArch64 instructions
- **LuaJIT**: Mike Pall's DynASM (Dynamic Assembler) preprocessor generates machine
  code from assembly templates

### Hardware Bring-Up

When a new CPU or SoC is manufactured, the first code it runs is hand-written assembly.
Board support packages (BSPs) include assembly for:

- Cache and MMU initialization
- Memory controller configuration
- Clock tree setup
- Bringing secondary CPU cores online (the SMP boot protocol)
- Power management state transitions

---

## 8. Exploit Development and Security

Assembly language is central to software security -- both offense and defense. Understanding
exploits requires reading assembly; building defenses requires understanding what
attackers see.

### Classic Buffer Overflow

The canonical vulnerability: a stack buffer overflow overwrites the return address
on the stack, redirecting execution to attacker-controlled code.

```c
// Vulnerable function
void vulnerable(char *input) {
    char buffer[64];
    strcpy(buffer, input);   // no bounds check
}
```

In assembly, the stack layout during `vulnerable` looks like:

```
High addresses
+-----------------+
| return address  |  <-- target of the overwrite
+-----------------+
| saved rbp       |
+-----------------+
| buffer[56..63]  |
| buffer[48..55]  |
| ...             |
| buffer[0..7]    |  <-- strcpy writes here and beyond
+-----------------+
Low addresses
```

An input longer than 64 bytes overwrites past the buffer, through saved `rbp`, and
into the return address. When `vulnerable` executes `ret`, the CPU pops the
attacker-controlled address into `rip` and jumps to it.

### Shellcode

Shellcode is raw machine code injected into a vulnerable process. Classic shellcode
spawns a shell:

```nasm
; Linux x86-64 execve("/bin/sh") shellcode
; Must be position-independent, no null bytes
xor    rdi, rdi
push   rdi                  ; null terminator on stack
mov    rdi, 0x68732f6e69622f ; "/bin/sh" in little-endian
push   rdi
mov    rdi, rsp             ; rdi = pointer to "/bin/sh"
xor    rsi, rsi             ; argv = NULL
xor    rdx, rdx             ; envp = NULL
mov    al, 59               ; syscall: execve
syscall
```

Modern shellcode must be more sophisticated: it must deal with ASLR, avoid null bytes
(which terminate C strings), and potentially work around DEP/NX by chaining existing
code fragments rather than executing injected data.

### Return-Oriented Programming (ROP)

ROP is the modern evolution of exploit techniques, developed to bypass DEP/NX (Data
Execution Prevention), which marks data pages as non-executable.

Instead of injecting code, the attacker chains together "gadgets" -- small sequences
of existing instructions in the program or its libraries that end with `ret`. Each
`ret` pops the next gadget address from the attacker-controlled stack.

A gadget: `pop rdi; ret` -- loads an attacker-chosen value into `rdi`, then transfers
control to the next gadget. By chaining gadgets, the attacker constructs arbitrary
computation from existing code fragments without executing any injected data.

Tools for ROP: ROPgadget, ropper, angrop (angr plugin).

### NOP Sleds

A NOP sled is a sequence of `nop` (0x90) instructions placed before shellcode. When
the exact landing address is uncertain, a large NOP sled increases the probability
that execution slides into the shellcode. Modern exploits rarely use literal NOP sleds
because ASLR makes address prediction difficult regardless of sled size.

### Defenses

**Stack canaries**: a random value placed between the buffer and the return address.
Before `ret`, the function checks that the canary is unchanged. GCC enables this
with `-fstack-protector` (the canary check is visible in assembly output as a
comparison against `%fs:0x28` on x86-64 Linux).

**ASLR (Address Space Layout Randomization)**: randomizes the base addresses of the
executable, libraries, stack, heap, and mmap regions at each execution. Attackers
cannot predict addresses for ROP gadgets.

**DEP/NX (Data Execution Prevention / No-Execute)**: marks data pages (stack, heap)
as non-executable. Prevents classic shellcode injection.

**CFI (Control-Flow Integrity)**: restricts indirect branches (calls, jumps, returns)
to valid targets. Clang's `-fsanitize=cfi` implements this at compile time.

**CET (Control-flow Enforcement Technology)**: Intel's hardware-based defense.
**Shadow Stack** maintains a separate, hardware-protected copy of return addresses.
If the software stack's return address does not match the shadow stack, the CPU faults.
**Indirect Branch Tracking (IBT)** requires indirect branch targets to begin with
`ENDBR64` instructions.

### CTF Competitions

Capture The Flag (CTF) competitions are the primary training ground for security
researchers. The **pwn** category specifically tests binary exploitation skills:
participants receive a vulnerable binary and a remote server running it, and must
exploit the vulnerability to read a flag file. This requires reading disassembly,
understanding the vulnerability, and writing an exploit -- all assembly-level skills.

Tools: pwntools (Python library), GDB with pwndbg/GEF/PEDA extensions, Ghidra.

---

## 9. Performance Optimization with Assembly

Understanding assembly is essential for performance optimization, even when you never
write a line of it. The assembly output reveals what the CPU actually executes, and
microarchitectural knowledge explains why some instruction sequences are fast and
others are slow.

### Microarchitecture Fundamentals

Modern x86-64 CPUs do not execute x86 instructions directly. They decode x86
instructions into micro-operations (uops) that execute on an out-of-order backend.
Performance depends on:

- **Pipeline depth**: Intel Golden Cove has ~20 stages; bubbles from mispredictions
  are expensive
- **Execution ports**: each uop dispatches to a specific port (e.g., Port 0 for
  integer multiply, Port 5 for shuffles on some microarchitectures). Throughput is
  limited by port contention
- **Cache lines**: 64 bytes on x86-64. Data accesses within the same cache line are
  essentially free after the first; crossing a cache line boundary may double latency
- **TLB (Translation Lookaside Buffer)**: caches virtual-to-physical address mappings.
  TLB misses trigger page table walks that cost hundreds of cycles
- **Branch prediction**: modern predictors (like TAGE in Intel CPUs) achieve >99%
  accuracy on most code, but a misprediction costs 15-20 cycles
- **Speculative execution**: the CPU executes instructions ahead of confirmed branches.
  Correct speculation is free; misprediction discards speculative work

### Profiling Tools

**perf** (Linux): hardware performance counter profiling:

```bash
# Count events for a program
perf stat ./program
# Output:
#   1,234,567,890  cycles
#     987,654,321  instructions     # IPC: 0.80
#      12,345,678  cache-misses
#       1,234,567  branch-misses

# Record samples (profile)
perf record -g ./program

# Display profile
perf report

# Top-down microarchitecture analysis (Intel)
perf stat -M TopdownL1 ./program
```

**Intel VTune Profiler**: provides microarchitecture-aware analysis including:
uop dispatch port utilization, memory hierarchy analysis, threading efficiency,
and hotspot identification with source/assembly correlation.

**AMD uProf**: AMD's equivalent profiler with support for Zen-family microarchitectures,
including IBS (Instruction-Based Sampling) for cycle-accurate attribution.

### Agner Fog's Resources

Agner Fog, a professor at the Technical University of Denmark, maintains the definitive
reference for x86 performance optimization:

1. **Optimization Manual** (180+ pages): general optimization strategies for C++ and
   assembly, covering memory access patterns, branch prediction, SIMD, and
   multithreading
2. **Instruction Tables** (300+ pages): latency and throughput for every instruction
   on every Intel and AMD microarchitecture from P5 Pentium through the latest
   generations
3. **Microarchitecture Manual** (200+ pages): detailed pipeline analysis of every
   Intel and AMD microarchitecture
4. **Calling Convention Manual**: ABI details for all major x86 platforms
5. **C++ Optimization Manual**: compiler-specific optimization techniques

These documents are available free at agner.org/optimize/ and are referenced by
virtually every x86 performance engineer.

### IACA and llvm-mca

**IACA** (Intel Architecture Code Analyzer) was an Intel tool (now deprecated but still
useful) that analyzed an assembly loop and predicted throughput and bottlenecks for
specific Intel microarchitectures.

**llvm-mca** (LLVM Machine Code Analyzer) is the actively-maintained successor.
It simulates a CPU pipeline and reports per-instruction timing:

```bash
# Create a file with assembly to analyze
cat > loop.s << 'EOF'
# LLVM-MCA-BEGIN my_loop
imul eax, ebx
add ecx, eax
inc edx
jnz .loop
# LLVM-MCA-END
EOF

# Analyze for Skylake
llvm-mca -mcpu=skylake loop.s

# Output includes:
# - Iterations per cycle (IPC)
# - Bottleneck analysis (port pressure)
# - Timeline view showing instruction flow through pipeline
# - Resource pressure per instruction
```

llvm-mca output shows which execution ports are saturated and whether the loop is
bound by data dependencies, instruction fetch, or execution resources.

---

## 10. The Compiler's Assembly Output

Reading compiler-generated assembly is the most practical assembly skill for most
programmers. You do not need to write assembly -- you need to read it to understand
what your code actually does.

### Generating Assembly Output

```bash
# GCC: generate assembly (AT&T syntax by default)
gcc -S -O2 source.c -o source.s

# GCC: Intel syntax
gcc -S -O2 -masm=intel source.c -o source.s

# GCC: with source annotations
gcc -S -O2 -fverbose-asm source.c -o source.s

# Clang: generate assembly
clang -S -O2 source.c -o source.s

# Clang: Intel syntax
clang -S -O2 -mllvm --x86-asm-syntax=intel source.c -o source.s

# Rust: generate assembly
rustc --emit asm -C opt-level=2 source.rs

# Rust: Intel syntax (default is AT&T)
rustc --emit asm -C opt-level=2 -C llvm-args=-x86-asm-syntax=intel source.rs

# Go: generate assembly (Plan 9 syntax)
go tool compile -S source.go

# From object file (already compiled)
objdump -d -M intel program.o
```

### Reading a Function Prologue and Epilogue

Most compiled functions follow a pattern:

```asm
; Prologue
my_function:
        push    rbp              ; save caller's frame pointer
        mov     rbp, rsp         ; set up our frame pointer
        sub     rsp, 32          ; allocate 32 bytes of local variables

; ... function body ...

; Epilogue
        mov     rsp, rbp         ; deallocate locals (or: leave)
        pop     rbp              ; restore caller's frame pointer
        ret                      ; return to caller
```

At higher optimization levels, the compiler often eliminates the frame pointer entirely
(called "frame pointer omission"), using `rsp` directly for all stack accesses:

```asm
; Optimized: no frame pointer
my_function:
        sub     rsp, 24          ; allocate locals + alignment

; ... function body ...

        add     rsp, 24          ; deallocate
        ret
```

GCC's `-fomit-frame-pointer` (enabled at `-O1` and above) controls this. The Linux
kernel often compiles with `-fno-omit-frame-pointer` to preserve stack traces for
debugging.

### Register Allocation

The compiler decides which variables live in which registers. The x86-64 System V
ABI provides 15 general-purpose registers (excluding `rsp`):

- **Caller-saved** (volatile): `rax`, `rcx`, `rdx`, `rsi`, `rdi`, `r8-r11` --
  the callee may freely modify these
- **Callee-saved** (non-volatile): `rbx`, `rbp`, `r12-r15` -- if the callee uses
  these, it must save and restore them

Watching register allocation in compiler output reveals how the compiler maps
variables to hardware. A function with more live variables than available registers
will "spill" values to the stack.

### Inlining

At `-O2` and above, the compiler replaces function calls with the function body
at the call site. In assembly output, an inlined function simply vanishes as a
separate entity -- its instructions appear directly in the caller.

```c
static int square(int x) { return x * x; }

int sum_of_squares(int a, int b) {
    return square(a) + square(b);
}
```

At `-O2`, `square` is inlined, and `sum_of_squares` compiles to:

```asm
sum_of_squares:
        imul    edi, edi         ; a * a
        imul    esi, esi         ; b * b
        lea     eax, [rdi+rsi]   ; a*a + b*b
        ret
```

No `call` instruction, no separate `square` function. The `lea` (Load Effective Address)
instruction is used as a three-operand addition: `eax = rdi + rsi`.

### Loop Unrolling

The compiler may replicate loop bodies to reduce branch overhead:

```c
void add_arrays(int *dst, const int *src, int n) {
    for (int i = 0; i < n; i++)
        dst[i] += src[i];
}
```

At `-O3`, the compiler may unroll this by a factor of 4 and vectorize with SSE/AVX:

```asm
; Vectorized inner loop (processes 8 ints per iteration with AVX2)
.loop:
        vmovdqu   ymm0, YMMWORD PTR [rsi+rax]
        vpaddd    ymm0, ymm0, YMMWORD PTR [rdi+rax]
        vmovdqu   YMMWORD PTR [rdi+rax], ymm0
        add       rax, 32
        cmp       rax, rcx
        jb        .loop
```

The compiler auto-vectorized the loop: instead of processing one `int` per iteration,
it processes 8 at a time using 256-bit YMM registers.

### Tail Calls

When a function's last action is calling another function, the compiler can replace
`call` + `ret` with a `jmp`:

```c
int factorial_helper(int n, int acc) {
    if (n <= 1) return acc;
    return factorial_helper(n - 1, n * acc);
}
```

```asm
factorial_helper:
        cmp     edi, 1
        jle     .return
        imul    esi, edi         ; acc *= n
        dec     edi              ; n -= 1
        jmp     factorial_helper ; tail call: jump, don't call
.return:
        mov     eax, esi
        ret
```

The recursive call becomes a loop via tail call optimization. The stack does not grow.

### The "Compiler Is Smarter Than You" Rule

For the vast majority of code, the compiler produces better assembly than a human
would write. The compiler:

- Has perfect knowledge of the target microarchitecture's instruction latencies
- Can explore millions of instruction scheduling orderings
- Applies dozens of optimization passes (constant folding, dead code elimination,
  common subexpression elimination, loop-invariant code motion, etc.)
- Knows the ABI and calling convention perfectly
- Can leverage profile-guided optimization (PGO) data

The rule breaks in specific domains: cryptographic constant-time requirements (the
compiler may optimize away timing-safe patterns), SIMD code where the compiler's
auto-vectorizer fails, and performance-critical code paths where domain-specific
knowledge (alignment guarantees, value ranges) exceeds what the compiler can infer.

---

## 11. Operating System Interface

Assembly language is the only way to directly invoke operating system services. Every
system call, from opening a file to allocating memory, ultimately happens through a
specific assembly instruction that transitions from user mode to kernel mode.

### Linux System Calls (x86-64)

On x86-64 Linux, the `syscall` instruction transfers control to the kernel:

```
Register    Purpose
rax         System call number
rdi         Argument 1
rsi         Argument 2
rdx         Argument 3
r10         Argument 4 (note: NOT rcx, which syscall clobbers)
r8          Argument 5
r9          Argument 6
rax         Return value (after syscall returns)
```

Common syscall numbers (x86-64):

| Number | Name | Purpose |
|--------|------|---------|
| 0 | read | Read from file descriptor |
| 1 | write | Write to file descriptor |
| 2 | open | Open a file |
| 3 | close | Close a file descriptor |
| 9 | mmap | Map memory |
| 11 | munmap | Unmap memory |
| 12 | brk | Change data segment size |
| 39 | getpid | Get process ID |
| 57 | fork | Create child process |
| 59 | execve | Execute a program |
| 60 | exit | Terminate process |
| 231 | exit_group | Terminate all threads |

A complete file-reading example:

```nasm
section .bss
    buffer resb 4096

section .data
    filename db "/etc/hostname", 0

section .text
    global _start

_start:
    ; open("/etc/hostname", O_RDONLY)
    mov rax, 2              ; syscall: open
    lea rdi, [rel filename] ; pathname
    xor rsi, rsi            ; flags: O_RDONLY = 0
    syscall
    mov r12, rax            ; save fd

    ; read(fd, buffer, 4096)
    mov rax, 0              ; syscall: read
    mov rdi, r12            ; fd
    lea rsi, [rel buffer]   ; buffer
    mov rdx, 4096           ; count
    syscall
    mov r13, rax            ; save bytes_read

    ; write(1, buffer, bytes_read)
    mov rax, 1              ; syscall: write
    mov rdi, 1              ; fd: stdout
    lea rsi, [rel buffer]   ; buffer
    mov rdx, r13            ; count
    syscall

    ; close(fd)
    mov rax, 3              ; syscall: close
    mov rdi, r12            ; fd
    syscall

    ; exit(0)
    mov rax, 60             ; syscall: exit
    xor rdi, rdi            ; status: 0
    syscall
```

### ARM64 System Calls

On ARM64 (AArch64) Linux, the `svc #0` instruction triggers a system call:

```
Register    Purpose
x8          System call number
x0          Argument 1
x1          Argument 2
x2          Argument 3
x3          Argument 4
x4          Argument 5
x5          Argument 6
x0          Return value (after svc returns)
```

```asm
// ARM64: write(1, msg, 14)
mov x0, #1          // fd: stdout
adr x1, msg         // buffer
mov x2, #14         // count
mov x8, #64         // syscall: write (ARM64 number is 64, not 1)
svc #0              // supervisor call

// ARM64: exit(0)
mov x0, #0          // status
mov x8, #93         // syscall: exit
svc #0
```

Note that ARM64 uses different system call numbers than x86-64. The kernel's
`include/uapi/asm-generic/unistd.h` defines the unified numbering.

### RISC-V System Calls

On RISC-V, the `ecall` instruction enters the kernel:

```
Register    Purpose
a7          System call number
a0          Argument 1
a1          Argument 2
a2          Argument 3
a3          Argument 4
a4          Argument 5
a5          Argument 6
a0          Return value
```

```asm
# RISC-V: write(1, msg, 14)
li a0, 1            # fd: stdout
la a1, msg          # buffer
li a2, 14           # count
li a7, 64           # syscall: write
ecall

# RISC-V: exit(0)
li a0, 0            # status
li a7, 93           # syscall: exit
ecall
```

RISC-V uses the same syscall numbers as ARM64 (both use the "generic" numbering).

### The vDSO

The vDSO (virtual Dynamic Shared Object) is a kernel-provided shared library mapped
into every process's address space. It allows certain system calls to execute without
the expensive user-to-kernel mode transition.

On x86-64 Linux, `gettimeofday()`, `clock_gettime()`, and `getcpu()` are implemented
in the vDSO. Instead of executing `syscall`, the C library calls a function in the
vDSO that reads kernel-maintained memory directly from user space:

```bash
# See the vDSO in a process's memory map
cat /proc/self/maps | grep vdso
# 7fff12345000-7fff12346000 r-xp ... [vdso]
```

This is important for understanding why `clock_gettime()` is fast: it never enters
the kernel. The vDSO reads a shared memory page that the kernel updates on every
timer tick.

---

## 12. Embedded and Bare-Metal

Embedded systems often require assembly at the lowest levels. Without an operating
system, there is no runtime to set up the stack, initialize memory, or handle
interrupts. The programmer must provide all of this in assembly before any C code
can execute.

### Startup Code

The first instructions a microcontroller executes after reset are typically assembly.
The reset handler must:

1. Set up the stack pointer
2. Initialize `.data` (copy from Flash to RAM)
3. Zero-fill `.bss`
4. Call `SystemInit()` (clock configuration)
5. Call `main()`

ARM Cortex-M startup (simplified):

```asm
.section .isr_vector, "a"
.word _stack_top          @ Initial stack pointer
.word Reset_Handler       @ Reset vector

.section .text
.thumb
.global Reset_Handler
Reset_Handler:
    @ Copy .data from Flash to RAM
    ldr r0, =_sdata       @ destination start (RAM)
    ldr r1, =_edata       @ destination end
    ldr r2, =_sidata      @ source (Flash)
copy_data:
    cmp r0, r1
    bge zero_bss
    ldm r2!, {r3}
    stm r0!, {r3}
    b copy_data

zero_bss:
    @ Zero-fill .bss
    ldr r0, =_sbss
    ldr r1, =_ebss
    movs r3, #0
clear_bss:
    cmp r0, r1
    bge call_main
    stm r0!, {r3}
    b clear_bss

call_main:
    bl SystemInit
    bl main
    b .                   @ halt if main returns
```

### Linker Scripts

Bare-metal systems require linker scripts to define the memory layout. The linker
script tells the linker where Flash and RAM are located and how to place sections:

```ld
/* STM32F411 linker script (simplified) */
MEMORY {
    FLASH (rx)  : ORIGIN = 0x08000000, LENGTH = 512K
    RAM   (rwx) : ORIGIN = 0x20000000, LENGTH = 128K
}

SECTIONS {
    .isr_vector : {
        . = ALIGN(4);
        KEEP(*(.isr_vector))
    } > FLASH

    .text : {
        *(.text*)
        *(.rodata*)
    } > FLASH

    _sidata = LOADADDR(.data);
    .data : {
        _sdata = .;
        *(.data*)
        _edata = .;
    } > RAM AT> FLASH      /* stored in Flash, loaded to RAM */

    .bss : {
        _sbss = .;
        *(.bss*)
        *(COMMON)
        _ebss = .;
    } > RAM

    _stack_top = ORIGIN(RAM) + LENGTH(RAM);
}
```

### Memory-Mapped I/O

On embedded systems, hardware peripherals are controlled by reading and writing
specific memory addresses. These accesses must be performed with exact sizes and
must not be optimized away by the compiler.

```c
// In C, volatile prevents optimization:
#define GPIOA_ODR (*(volatile uint32_t *)0x40020014)
GPIOA_ODR |= (1 << 5);  // Set pin PA5 high (LED on many STM32 boards)
```

In assembly, this is explicit:

```asm
ldr r0, =0x40020014      @ GPIOA ODR address
ldr r1, [r0]              @ read current value
orr r1, r1, #(1 << 5)    @ set bit 5
str r1, [r0]              @ write back
```

### Interrupt Vector Tables

ARM Cortex-M processors use a vector table in memory. Each entry is the address of
an interrupt handler. The first entry is the initial stack pointer, the second is the
reset handler, and subsequent entries handle NMI, HardFault, and peripheral interrupts.

The vector table is defined in assembly (or C with specific attributes) and placed
at address 0x00000000 or 0x08000000 (Flash base on STM32) by the linker script.

### CMSIS (Cortex Microcontroller Software Interface Standard)

ARM's CMSIS provides a standardized abstraction layer for Cortex-M processors. While
mostly C headers and intrinsics, the startup files (`startup_*.s`) are assembly and
define the vector table and reset handler for each specific chip.

### Real-Time Constraints

Hard real-time systems (motor control, audio processing, safety-critical applications)
sometimes require assembly to guarantee exact cycle counts. When you need to respond
to an interrupt within a specific number of clock cycles, the non-determinism of C
compilation (register allocation choices, instruction scheduling) can be unacceptable.

---

## 13. WebAssembly Connection

WebAssembly (Wasm) occupies an interesting position in the assembly language landscape.
It is often called a "virtual assembly language" -- but it differs from real assembly
in fundamental ways.

### What WebAssembly Is

WebAssembly is a portable, binary instruction format designed as a compilation target
for high-level languages. It runs in web browsers (Chrome, Firefox, Safari, Edge) and
standalone runtimes (Wasmtime, Wasmer, WASI). It was designed by engineers from all
major browser vendors and standardized by the W3C.

### Stack-Based vs Register-Based

Real CPUs (x86-64, ARM64, RISC-V) are register machines: operands are specified by
register names, and results go into registers. WebAssembly is a stack machine: operands
are pushed onto a virtual stack, instructions consume stack values and push results.

```wasm
;; WebAssembly: add two i32 values
(func $add (param $a i32) (param $b i32) (result i32)
  local.get $a     ;; push $a onto stack
  local.get $b     ;; push $b onto stack
  i32.add          ;; pop two values, push sum
)
```

In practice, Wasm engines (V8, SpiderMonkey) compile Wasm to native code using
register allocation, so the stack-based format is just an encoding -- the actual
execution uses registers.

### Wasm Instruction Set

WebAssembly has a small, typed instruction set:

- **Integer arithmetic**: `i32.add`, `i64.mul`, `i32.shl`, `i64.popcnt`
- **Float arithmetic**: `f32.add`, `f64.sqrt`, `f64.copysign`
- **Memory**: `i32.load`, `i64.store`, `memory.grow`
- **Control flow**: `block`, `loop`, `if/else`, `br` (branch), `br_table` (switch)
- **Call**: `call`, `call_indirect` (function pointers via tables)
- **SIMD** (extension): `v128.load`, `i32x4.add`, `f32x4.mul`

### How Wasm Relates to Real Assembly

WebAssembly is not a real ISA. Key differences:

- **No registers**: stack-based encoding (though execution is register-based)
- **Structured control flow**: no arbitrary `goto` or `jmp`. All branches are to
  structured block/loop/if targets. This makes validation O(n) and prevents certain
  classes of exploits.
- **Memory safety**: linear memory is bounds-checked. Wasm code cannot access memory
  outside its allocated region.
- **No system calls**: Wasm has no `syscall` instruction. All interaction with the
  host environment goes through imported functions.
- **Portable**: the same `.wasm` binary runs on any architecture

WebAssembly serves the same role in the browser that assembly serves on a CPU: it is
the lowest-level instruction set that higher-level languages compile to. But it was
designed from scratch for safety and portability, not for direct hardware execution.

### Wasm as a Learning Bridge

For learners, WebAssembly can serve as a gentler introduction to low-level concepts:
it has explicit types, structured control flow, and no undefined behavior. Reading
the Wasm output of a C program (via `clang --target=wasm32`) provides assembly-like
insights without the complexity of x86-64 encoding.

---

## 14. Learning Assembly in 2025

The landscape for learning assembly language has changed dramatically. The tools are
better, the resources are more accessible, and the practical motivations have shifted
from "writing programs in assembly" to "understanding what programs really do."

### The Modern Learning Path

**Step 1: Use Compiler Explorer.** Before writing any assembly, write C code on
godbolt.org and read the output. Understand what `mov`, `add`, `cmp`, `jmp`, `call`,
and `ret` do. Observe how optimization levels change the output. This is the single
most important tool for learning assembly in 2025.

**Step 2: Choose an architecture.** Start with x86-64 or ARM64. These are the
architectures you interact with daily (your laptop or phone). Do not start with
historical ISAs (6502, Z80, 8086) unless you have a specific retrocomputing interest.

**Step 3: Write small programs with NASM + Linux.** NASM's Intel syntax is the most
readable, and Linux provides the simplest syscall interface. Write:
- Hello World (write syscall)
- A program that reads input (read syscall)
- A program with a loop (sum numbers 1 to N)
- A program that calls a function (the stack and calling convention)
- A program that does string processing (memory operations)

**Step 4: Use GDB.** Single-step through your programs. Watch register values change.
Examine the stack. Set breakpoints. This is where assembly becomes concrete.

**Step 5: Read compiler output.** Go back to Compiler Explorer and study more complex
C code: loops, function calls, struct access, pointer arithmetic. Understand the
calling convention by watching how arguments arrive in registers and return values
leave in `rax`.

**Step 6: Study a real-world domain.** Pick one:
- **Reverse engineering**: install Ghidra, analyze a CTF binary
- **OS development**: write a toy bootloader
- **Performance**: profile a program with `perf`, find the hot loop, read its assembly
- **Security**: solve pwn challenges on picoCTF or pwnable.kr

### Essential References

**Patterson and Hennessy -- Computer Organization and Design** (RISC-V Edition):
the standard textbook for computer architecture, now using RISC-V as its teaching ISA.
Covers instruction set design, pipelining, memory hierarchy, and I/O. The ARM edition
is equally good for ARM-focused learners.

**Hennessy and Patterson -- Computer Architecture: A Quantitative Approach**: the
graduate-level follow-up, covering advanced microarchitecture, memory systems, and
multiprocessor design. Essential for performance optimization.

**Agner Fog's Optimization Manuals** (agner.org/optimize/): free, definitive reference
for x86 performance. More practical than any textbook for understanding real CPU
behavior.

**Intel Software Developer's Manual** (SDM): the authoritative reference for every
x86-64 instruction. Volume 2 (Instruction Set Reference) is 2,000+ pages. Not for
learning, but indispensable as a reference.

**ARM Architecture Reference Manual** (ARM ARM): the equivalent for ARM/AArch64.
Available from ARM's developer documentation.

### The Reverse Engineering Path

Many people learn assembly through reverse engineering -- reading code that was never
meant to be read. This is a powerful motivator because it is inherently puzzle-like:
you have a binary, you do not have source code, and you must figure out what it does.

The learning sequence:

1. Install Ghidra (free, cross-platform)
2. Analyze simple crackme binaries (crackmes.one has hundreds)
3. Learn to recognize common patterns: function prologues, `if/else` as `cmp`+`jcc`,
   loops as backward `jmp`, `switch` as jump tables
4. Progress to CTF challenges (picoCTF for beginners, then pwnable.kr)
5. Study malware analysis (in a safe VM) for real-world reverse engineering

### Practical Exercises

**Exercise 1**: compile `int max(int a, int b) { return a > b ? a : b; }` on
Compiler Explorer with GCC and Clang at `-O2`. Note how both use `cmov` (conditional
move) instead of a branch. Understand why: `cmov` avoids a branch misprediction.

**Exercise 2**: write a NASM program that computes Fibonacci numbers and prints them.
This exercises loops, register usage, and integer-to-string conversion (which requires
repeated division by 10).

**Exercise 3**: compile a simple linked list traversal in C. Read the assembly output.
Identify the pointer dereference pattern (`mov rax, [rax+offset]`) and the null check
(`test rax, rax; je done`).

**Exercise 4**: use `objdump -d /usr/bin/ls | head -100` to look at a real,
production binary's disassembly. Notice the PLT stubs for library calls, the GOT
references, and the function call patterns.

**Exercise 5**: run `perf stat` on a program you wrote. Observe the IPC (instructions
per cycle). Modify the program to have poor cache behavior (random memory access
patterns) and observe IPC drop and cache misses increase.

### Summary: The Tool Ecosystem

| Category | Primary Tool | Alternative |
|----------|-------------|-------------|
| Assembler | NASM | FASM, GAS, YASM |
| Linker | ld (GNU) | lld (LLVM), gold |
| Debugger | GDB | LLDB, WinDbg |
| Disassembler (CLI) | objdump | llvm-objdump |
| Disassembler (GUI) | Ghidra | IDA Pro, Binary Ninja |
| Binary analysis | readelf, nm | llvm-readobj, llvm-nm |
| Compiler output | Compiler Explorer | gcc -S, clang -S |
| Profiler | perf | VTune, uProf |
| Pipeline analysis | llvm-mca | (IACA, deprecated) |
| Exploit dev | pwntools + GDB | ROPgadget, ropper |

The assembly language ecosystem is mature, well-tooled, and actively developed. The
tools have never been more accessible. Compiler Explorer alone has done more to
democratize assembly understanding than any textbook. The barrier is not tooling --
it is taking the time to study what the machine is actually doing.

---

## Quick Reference: Essential Commands

```bash
# Assemble (NASM, ELF64)
nasm -f elf64 program.asm -o program.o

# Link (GNU ld)
ld program.o -o program

# Compile C to assembly (GCC, Intel syntax, optimized)
gcc -S -O2 -masm=intel source.c -o source.s

# Compile C to assembly (Clang)
clang -S -O2 source.c -o source.s

# Disassemble a binary (Intel syntax)
objdump -d -M intel program

# ELF file information
readelf -a program

# Symbol table
nm -C program

# Debug with GDB (Intel syntax)
gdb -ex "set disassembly-flavor intel" ./program

# Profile with perf
perf stat ./program
perf record -g ./program && perf report

# Analyze loop with llvm-mca
llvm-mca -mcpu=skylake loop.s

# Link with LLVM's fast linker
clang -fuse-ld=lld -o program *.o
```

---

*This chapter is part of the PNW Research Series -- Assembly Language project.*
*Tools and versions reflect the state of practice as of 2025.*
