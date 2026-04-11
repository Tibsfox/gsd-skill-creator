# Binary Formats, Linking, and Tools

## PNW Research Series -- Machine Language and Machine Code

The journey from source code to running program does not end at compilation. The
machine code a compiler produces must be wrapped in a container format that the
operating system knows how to load, linked against libraries, relocated to the
correct addresses, and ultimately mapped into memory for execution. This document
covers the binary formats, linking mechanisms, and inspection tools that sit
between raw machine code and a running process.

---

## 1. ELF (Executable and Linkable Format)

ELF is the standard binary format on Linux, FreeBSD, Solaris, and most modern
Unix-like systems. It was introduced as part of the System V ABI in the late
1980s and has proven remarkably durable.

### 1.1 The ELF Header

Every ELF file begins with a fixed-size header. The first 16 bytes are the
identification array (`e_ident`):

```
Offset  Size  Field              Meaning
------  ----  -----------------  ------------------------------------
0x00    4     Magic              0x7F 'E' 'L' 'F'
0x04    1     Class              1 = 32-bit, 2 = 64-bit
0x05    1     Data               1 = little-endian, 2 = big-endian
0x06    1     Version            1 = current
0x07    1     OS/ABI             0 = System V, 3 = Linux, 6 = Solaris
0x08    1     ABI Version        Usually 0
0x09    7     Padding            Reserved, must be zero
```

A real ELF header in hex (from a compiled x86-64 binary):

```
00000000: 7f45 4c46 0201 0100 0000 0000 0000 0000  .ELF............
00000010: 0300 3e00 0100 0000 6010 0000 0000 0000  ..>.....`.......
00000020: 4000 0000 0000 0000 1037 0000 0000 0000  @........7......
00000030: 0000 0000 4000 3800 0e00 4000 2000 1f00  ....@.8...@. ...
```

Breaking down the key fields after `e_ident`:

- **0x10-0x11**: `0x0003` = `ET_DYN` (position-independent executable)
- **0x12-0x13**: `0x003e` = `EM_X86_64` (AMD x86-64)
- **0x18-0x1f**: Entry point address `0x1060`
- **0x20-0x27**: Program header table offset `0x40` (64 bytes in)
- **0x28-0x2f**: Section header table offset `0x3710`
- **0x34-0x35**: Program header entry size `0x38` (56 bytes)
- **0x36-0x37**: Number of program headers `0x0e` (14)
- **0x38-0x39**: Section header entry size `0x40` (64 bytes)
- **0x3a-0x3b**: Number of section headers `0x20` (32)

The ELF type field distinguishes between:

| Value | Name     | Meaning                                    |
|-------|----------|--------------------------------------------|
| 0     | ET_NONE  | No file type                               |
| 1     | ET_REL   | Relocatable object file (.o)               |
| 2     | ET_EXEC  | Executable (fixed addresses)               |
| 3     | ET_DYN   | Shared object or PIE executable            |
| 4     | ET_CORE  | Core dump                                  |

Modern Linux distributions compile executables as `ET_DYN` (PIE --
Position-Independent Executable) rather than `ET_EXEC` to enable ASLR.

The `readelf -h` output for this binary:

```
ELF Header:
  Magic:   7f 45 4c 46 02 01 01 00 00 00 00 00 00 00 00 00
  Class:                             ELF64
  Data:                              2's complement, little endian
  Version:                           1 (current)
  OS/ABI:                            UNIX - System V
  Type:                              DYN (Position-Independent Executable file)
  Machine:                           Advanced Micro Devices X86-64
  Entry point address:               0x1060
  Start of program headers:          64 (bytes into file)
  Start of section headers:          14096 (bytes into file)
  Size of this header:               64 (bytes)
  Size of program headers:           56 (bytes)
  Number of program headers:         14
  Size of section headers:           64 (bytes)
  Number of section headers:         32
```

### 1.2 Program Headers (Segments)

Program headers describe **segments** -- contiguous regions of the file that
the OS loader maps into memory. They answer the question: "How should this
file be loaded into the process address space?"

```
  Type           Offset             VirtAddr           PhysAddr
                 FileSiz            MemSiz              Flags  Align
  PHDR           0x0000000000000040 0x0000000000000040 0x0000000000000040
                 0x0000000000000310 0x0000000000000310  R      0x8
  INTERP         0x00000000000003a4 0x00000000000003a4 0x00000000000003a4
                 0x000000000000001c 0x000000000000001c  R      0x1
      [Requesting program interpreter: /lib64/ld-linux-x86-64.so.2]
  LOAD           0x0000000000000000 0x0000000000000000 0x0000000000000000
                 0x0000000000000650 0x0000000000000650  R      0x1000
  LOAD           0x0000000000001000 0x0000000000001000 0x0000000000001000
                 0x0000000000000191 0x0000000000000191  R E    0x1000
  LOAD           0x0000000000002000 0x0000000000002000 0x0000000000002000
                 0x000000000000018c 0x000000000000018c  R      0x1000
  LOAD           0x0000000000002db8 0x0000000000003db8 0x0000000000003db8
                 0x0000000000000268 0x0000000000000270  RW     0x1000
```

Key segment types:

- **PHDR**: The program header table itself
- **INTERP**: Path to the dynamic linker (`/lib64/ld-linux-x86-64.so.2`)
- **LOAD**: Segments that get mapped into memory. Note the permission flags:
  - `R` = read-only (ELF headers, read-only data)
  - `R E` = read + execute (code: `.text`, `.plt`, `.init`, `.fini`)
  - `R` = read-only data (`.rodata`, `.eh_frame`)
  - `RW` = read + write (`.data`, `.bss`, `.got`, `.dynamic`)
- **DYNAMIC**: The dynamic linking information
- **GNU_STACK**: Stack permissions (RW but not X -- NX bit enforced)
- **GNU_RELRO**: Read-only after relocation (GOT protection)

The fourth LOAD segment has `FileSiz` (0x268) smaller than `MemSiz` (0x270) --
the extra 8 bytes are the `.bss` section, zero-initialized at load time without
occupying space in the file.

### 1.3 Section Headers

Section headers describe **sections** -- the linker's view of the file. They
answer: "What logical parts does this file contain?"

```
  [Nr] Name              Type             Address           Offset
       Size              EntSize          Flags  Link  Info  Align
  [15] .text             PROGBITS         0000000000001060  00001060
       0000000000000121  0000000000000000  AX       0     0     16
  [17] .rodata           PROGBITS         0000000000002000  00002000
       0000000000000016  0000000000000000   A       0     0     4
  [26] .data             PROGBITS         0000000000004000  00003000
       0000000000000020  0000000000000000  WA       0     0     8
  [27] .bss              NOBITS           0000000000004020  00003020
       0000000000000008  0000000000000000  WA       0     0     4
```

Essential sections:

| Section       | Type     | Contents                                      |
|---------------|----------|-----------------------------------------------|
| `.text`       | PROGBITS | Executable machine code                       |
| `.data`       | PROGBITS | Initialized global/static variables            |
| `.bss`        | NOBITS   | Uninitialized globals (zero-filled at load)   |
| `.rodata`     | PROGBITS | Read-only data (string literals, constants)   |
| `.symtab`     | SYMTAB   | Full symbol table (for debugging/linking)     |
| `.strtab`     | STRTAB   | String table for `.symtab`                    |
| `.dynsym`     | DYNSYM   | Dynamic symbol table (needed at runtime)      |
| `.dynstr`     | STRTAB   | String table for `.dynsym`                    |
| `.rela.dyn`   | RELA     | Dynamic relocations                           |
| `.rela.plt`   | RELA     | PLT relocations (lazy binding)                |
| `.plt`        | PROGBITS | Procedure Linkage Table stubs                 |
| `.got`        | PROGBITS | Global Offset Table                           |
| `.init`       | PROGBITS | Initialization code (runs before `main`)      |
| `.fini`       | PROGBITS | Finalization code (runs after `main` returns) |
| `.debug_*`    | PROGBITS | DWARF debug information                       |
| `.eh_frame`   | PROGBITS | Exception handling / stack unwinding info      |
| `.dynamic`    | DYNAMIC  | Dynamic linking information                   |

The distinction between sections and segments is fundamental: **sections are the
linker's view** (used during linking to combine object files), while **segments
are the loader's view** (used at runtime to map memory). A stripped binary can
have its section headers removed entirely -- the kernel only needs program
headers to load it.

### 1.4 Inspection Tools

**readelf** reads ELF metadata without disassembling:

```bash
readelf -h binary      # ELF header
readelf -l binary      # Program headers (segments)
readelf -S binary      # Section headers
readelf -s binary      # Symbol table
readelf -r binary      # Relocations
readelf -d binary      # Dynamic section
readelf -n binary      # Notes (build ID, ABI tag)
```

**objdump** can disassemble and display everything:

```bash
objdump -d binary           # Disassemble executable sections
objdump -d -j .text binary  # Disassemble only .text
objdump -t binary           # Symbol table
objdump -R binary           # Dynamic relocations
objdump -x binary           # All headers
```

---

## 2. PE/COFF (Portable Executable)

PE is the executable format on Windows, derived from the Common Object File
Format (COFF) used on early Unix systems. Every Windows `.exe`, `.dll`, `.sys`,
and `.ocx` is a PE file.

### 2.1 Structure Overview

```
+---------------------------+
| DOS MZ Header             |  Legacy: "MZ" magic (0x4D5A)
| (64 bytes)                |  e_lfanew: offset to PE signature
+---------------------------+
| DOS Stub Program          |  Prints "This program cannot be run in DOS mode."
| (variable size)           |
+---------------------------+
| PE Signature              |  "PE\0\0" (0x50450000)
+---------------------------+
| COFF File Header          |  Machine type, number of sections, timestamp
| (20 bytes)                |
+---------------------------+
| Optional Header           |  Entry point, image base, section alignment,
| (PE32: 96 + data dirs)    |  subsystem, DLL characteristics, data directories
| (PE32+: 112 + data dirs)  |
+---------------------------+
| Section Table             |  Array of section headers
+---------------------------+
| Section Data              |  .text, .data, .rdata, .rsrc, .reloc ...
+---------------------------+
```

### 2.2 The DOS Header

Every PE file starts with the DOS MZ header for backward compatibility. If you
try to run a PE file on DOS, the stub prints an error message. The critical
field is `e_lfanew` at offset 0x3C, which points to the PE signature.

```
00000000: 4d5a 9000 0300 0000 0400 0000 ffff 0000  MZ..............
00000010: b800 0000 0000 0000 4000 0000 0000 0000  ........@.......
...
0000003c: 8000 0000                                 ....
```

The value at 0x3C (`0x80`) means the PE signature starts at file offset 0x80.

### 2.3 COFF Header

```
Offset  Size  Field              Meaning
------  ----  -----------------  ------------------------------------
0x00    2     Machine            0x8664 = AMD64, 0x14C = i386,
                                 0xAA64 = ARM64
0x02    2     NumberOfSections   How many section headers follow
0x04    4     TimeDateStamp      Unix timestamp of build
0x08    4     PointerToSymbolTable
0x0C    4     NumberOfSymbols
0x10    2     SizeOfOptionalHeader
0x12    2     Characteristics    Flags: executable, DLL, large-address-aware
```

### 2.4 Optional Header and Data Directories

Despite its name, the Optional Header is mandatory for executables. It contains:

- **Magic**: 0x10B (PE32) or 0x20B (PE32+, 64-bit)
- **AddressOfEntryPoint**: RVA of the first instruction to execute
- **ImageBase**: Preferred load address (usually 0x00400000 for EXEs, 0x10000000 for DLLs)
- **SectionAlignment**: Alignment of sections in memory (typically 4096 = page size)
- **FileAlignment**: Alignment of sections in the file (typically 512)
- **Subsystem**: 2 = GUI, 3 = Console, 1 = Native (driver)
- **DllCharacteristics**: ASLR, DEP/NX, integrity checks

The Data Directories (16 entries) point to important structures:

| Index | Name                   | Purpose                                |
|-------|------------------------|----------------------------------------|
| 0     | Export Table           | Functions exported by this module       |
| 1     | Import Table           | Functions imported from other DLLs      |
| 2     | Resource Table         | Icons, strings, version info, dialogs  |
| 3     | Exception Table        | Structured exception handling (x64)    |
| 4     | Certificate Table      | Authenticode digital signatures         |
| 5     | Base Relocation Table  | Fixups for ASLR                        |
| 6     | Debug Directory        | Debug info (PDB path, CodeView)        |
| 9     | TLS Table              | Thread Local Storage callbacks         |
| 11    | Bound Import Table     | Pre-resolved import timestamps         |
| 12    | IAT                    | Import Address Table                   |
| 14    | CLR Runtime Header     | .NET metadata                          |

### 2.5 Sections

| Section  | Contents                                             |
|----------|------------------------------------------------------|
| `.text`  | Executable machine code                              |
| `.data`  | Initialized read-write data                          |
| `.rdata` | Read-only data, import/export tables, debug dirs     |
| `.bss`   | Uninitialized data (virtual size > raw data size)    |
| `.rsrc`  | Resources: icons, cursors, version info, manifests   |
| `.reloc` | Base relocation entries (required for ASLR in DLLs)  |
| `.pdata` | Exception handling data (x64)                        |
| `.idata` | Import directory (often merged into `.rdata`)        |
| `.edata` | Export directory (often merged into `.rdata`)        |

### 2.6 Import Address Table (IAT)

The IAT is central to how Windows DLL loading works. For each imported function:

1. The Import Directory Table lists every DLL the executable depends on
2. Each DLL entry points to an Import Lookup Table (ILT) with function names or ordinals
3. At load time, the loader resolves each function address and writes it into the IAT
4. Code calls imported functions indirectly through the IAT: `call [IAT_entry]`

This is analogous to the GOT/PLT mechanism in ELF but uses a single-level
indirection rather than lazy binding (though delay-load DLLs can provide lazy
resolution).

### 2.7 DLL Loading

When a PE executable is loaded:

1. The loader reads the PE headers and maps sections into memory
2. If the preferred `ImageBase` is not available, it applies base relocations
3. It walks the Import Directory and loads each required DLL (recursively)
4. For each imported function, it resolves the address and patches the IAT
5. TLS callbacks are invoked
6. Execution transfers to `AddressOfEntryPoint`

Windows inspection tools: **dumpbin** (Visual Studio), **PE Explorer**, **CFF
Explorer**, **pestudio**, **Dependencies** (modern replacement for
Dependency Walker).

---

## 3. Mach-O (Mach Object)

Mach-O is the binary format on macOS, iOS, tvOS, and watchOS, inherited from
NeXTSTEP's Mach microkernel heritage.

### 3.1 Magic Numbers

Mach-O has several distinctive magic values:

| Magic        | Hex          | Meaning                                  |
|--------------|--------------|------------------------------------------|
| `MH_MAGIC`   | `0xFEEDFACE` | 32-bit Mach-O, native byte order         |
| `MH_CIGAM`   | `0xCEFAEDFE` | 32-bit Mach-O, reverse byte order        |
| `MH_MAGIC_64` | `0xFEEDFACF` | 64-bit Mach-O, native byte order         |
| `MH_CIGAM_64` | `0xCFFAEDFE` | 64-bit Mach-O, reverse byte order        |
| `FAT_MAGIC`  | `0xCAFEBABE` | Fat/universal binary                     |
| `FAT_CIGAM`  | `0xBEBAFECA` | Fat binary, reverse byte order           |

The `0xCAFEBABE` magic for fat binaries is the same magic number used by Java
`.class` files -- a coincidence that has confused many a hex editor user. The
`file` command on macOS distinguishes them by context.

The "CIGAM" variants are the byte-swapped versions of "MAGIC" (read the letters
backward), indicating the file was produced on a machine with opposite
endianness.

### 3.2 Fat/Universal Binaries

A fat binary contains multiple Mach-O binaries for different architectures
within a single file. Apple used this during multiple architecture transitions:

- PowerPC to Intel (2006)
- Intel to Apple Silicon / ARM64 (2020)

```
+---------------------------+
| Fat Header                |  magic: 0xCAFEBABE
|   nfat_arch: 2            |  number of architectures
+---------------------------+
| Fat Arch Entry [0]        |  cputype: ARM64, offset, size, align
+---------------------------+
| Fat Arch Entry [1]        |  cputype: x86_64, offset, size, align
+---------------------------+
| Mach-O for ARM64          |  Complete Mach-O binary
| (starts at aligned offset)|
+---------------------------+
| Mach-O for x86_64         |  Complete Mach-O binary
| (starts at aligned offset)|
+---------------------------+
```

### 3.3 Mach-O Structure

A single-architecture Mach-O file:

```
+---------------------------+
| Mach-O Header             |  magic, cputype, cpusubtype, filetype,
|                           |  ncmds, sizeofcmds, flags
+---------------------------+
| Load Command 0            |  LC_SEGMENT_64: __TEXT segment
+---------------------------+
| Load Command 1            |  LC_SEGMENT_64: __DATA segment
+---------------------------+
| Load Command 2            |  LC_SEGMENT_64: __LINKEDIT segment
+---------------------------+
| Load Command 3            |  LC_DYLD_INFO_ONLY: binding info
+---------------------------+
| Load Command 4            |  LC_SYMTAB: symbol table
+---------------------------+
| Load Command N            |  LC_LOAD_DYLIB: /usr/lib/libSystem.B.dylib
+---------------------------+
| __TEXT segment data        |  __text, __stubs, __stub_helper,
|                           |  __cstring, __const
+---------------------------+
| __DATA segment data        |  __la_symbol_ptr, __got, __data
+---------------------------+
| __LINKEDIT segment data    |  Symbol table, string table,
|                           |  code signature
+---------------------------+
```

Key load commands:

| Load Command       | Purpose                                          |
|---------------------|--------------------------------------------------|
| LC_SEGMENT_64      | Defines a segment with its sections              |
| LC_DYLD_INFO_ONLY  | Compressed binding/rebasing info                 |
| LC_SYMTAB          | Symbol table location and size                   |
| LC_DYSYMTAB        | Dynamic symbol table info                        |
| LC_LOAD_DYLIB      | Shared library dependency (one per library)      |
| LC_MAIN            | Entry point (offset in __TEXT)                   |
| LC_CODE_SIGNATURE  | Code signature location                          |
| LC_UUID            | Unique 128-bit binary identifier                 |
| LC_RPATH           | Runtime search path (@rpath)                     |

### 3.4 dyld (Dynamic Linker)

macOS uses `dyld` as its dynamic linker, located at
`/usr/lib/dyld`. It handles:

- Loading Mach-O images and their dependencies
- Performing rebasing (adjusting internal pointers for ASLR)
- Performing binding (resolving external symbol references)
- Running initializers (`__mod_init_func`, `+load` in Objective-C)

dyld has a shared cache (`/System/Library/dyld/dyld_shared_cache_*`) that
prelinks most system frameworks into a single memory-mapped file for fast startup.

### 3.5 Code Signing

On macOS and iOS, code signing is mandatory for execution:

- Each page of the `__TEXT` segment is hashed (SHA-256)
- The code directory (list of hashes) is itself signed
- The kernel verifies page hashes on demand (page-in time)
- `codesign -s "Developer ID" binary` signs a binary
- Notarization submits to Apple for additional checks

Inspection: `otool -l` (load commands), `otool -L` (shared libraries),
`nm` (symbols), `install_name_tool` (modify library paths).

---

## 4. Linking

Linking is the process of combining multiple object files (and libraries) into
a single executable or shared library. The linker resolves two fundamental
problems: **symbol resolution** and **relocation**.

### 4.1 Symbol Resolution

Each object file declares symbols it defines and symbols it needs:

```
Symbol table '.symtab' contains 39 entries:
   Num:    Value          Size Type    Bind   Vis      Ndx Name
    24: 0000000000004010     4 OBJECT  GLOBAL DEFAULT   26 global_var
    23: 0000000000000000     0 FUNC    GLOBAL DEFAULT  UND printf@GLIBC_2.2.5
    29: 0000000000001149    56 FUNC    GLOBAL DEFAULT   15 main
```

- **global_var** at address 0x4010 in section 26 (`.data`) -- this is a definition
- **printf** with `Ndx = UND` (undefined) -- this needs to be resolved
- **main** at address 0x1149 in section 15 (`.text`) -- this is a definition

The linker collects all symbols from all input object files and libraries. For
each undefined symbol reference, it searches for a matching definition. If a
symbol is defined in multiple files, the linker reports a "multiple definition"
error (unless one is weak).

Symbol binding types:

| Binding | Meaning                                                   |
|---------|-----------------------------------------------------------|
| LOCAL   | Visible only within the object file                       |
| GLOBAL  | Visible to all object files; must have one definition     |
| WEAK    | Like GLOBAL but can be overridden; no error if undefined  |

### 4.2 Static Linking

Static linking copies all required code into the output binary:

```bash
gcc -static -o hello hello.o    # Links statically against libc
```

Advantages: self-contained, no runtime dependencies, predictable behavior.
Disadvantages: larger binary, no shared memory between processes, must
recompile to update libraries.

Static libraries (`.a` files) are simply archives of `.o` files -- the linker
extracts only the object files containing symbols that are actually referenced.

### 4.3 Dynamic Linking

Dynamic linking defers library loading to runtime:

```bash
gcc -o hello hello.o            # Links dynamically (default)
ldd hello                       # Show dynamic dependencies
```

```
linux-vdso.so.1 (0x00007e6469450000)
libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007e6469000000)
/lib64/ld-linux-x86-64.so.2 (0x00007e6469452000)
```

The binary contains only stubs and metadata. The actual library code is loaded
and linked at runtime by the dynamic linker.

### 4.4 Linker Scripts

The linker script controls how sections from input files are combined and where
they are placed in memory. This is critical for embedded systems but even
desktop Linux uses a default linker script:

```ld
/* Simplified linker script excerpt */
SECTIONS {
    . = 0x400000;                    /* Starting address */
    .text : { *(.text) }            /* All .text sections */
    .rodata : { *(.rodata) }        /* All .rodata sections */
    . = ALIGN(0x1000);              /* Page-align */
    .data : { *(.data) }            /* All .data sections */
    .bss : { *(.bss) }              /* All .bss sections */
}
```

The `.` symbol is the "location counter" -- the current address. Linker scripts
are essential for embedded systems where code must live at specific addresses
(flash at 0x08000000, RAM at 0x20000000 on an STM32, for example).

---

## 5. Relocations

Relocations are the linker's patch instructions. When the compiler generates an
object file, it does not know the final addresses of symbols. Instead, it emits
placeholder values and relocation entries that tell the linker how to fix them up.

### 5.1 Relocation Entries

Each relocation entry contains:

- **Offset**: Where in the section to apply the fix
- **Type**: What kind of address calculation to perform
- **Symbol**: Which symbol's address to use
- **Addend**: A constant to add to the computed value

From a real object file:

```
Relocation section '.rela.text' at offset 0x200 contains 2 entries:
  Offset          Info           Type           Sym. Value    Sym. Name + Addend
00000000001d  000400000002 R_X86_64_PC32     0000000000000000 global_data - 4
000000000024  000600000004 R_X86_64_PLT32    0000000000000000 external_func - 4
```

The corresponding machine code before relocation (from the object file):

```
0000000000000013 <call_external>:
  13:   f3 0f 1e fa             endbr64
  17:   55                      push   %rbp
  18:   48 89 e5                mov    %rsp,%rbp
  1b:   8b 05 00 00 00 00       mov    0x0(%rip),%eax     # global_data
  21:   89 c7                   mov    %eax,%edi
  23:   e8 00 00 00 00          call   28 <call_external+0x15>  # external_func
  28:   5d                      pop    %rbp
  29:   c3                      ret
```

Notice the `00 00 00 00` placeholders at offsets 0x1d and 0x24. The linker will
patch these with the actual computed offsets.

### 5.2 x86-64 Relocation Types

| Type                 | Calculation              | Use                          |
|----------------------|--------------------------|------------------------------|
| R_X86_64_64          | S + A                   | Absolute 64-bit address      |
| R_X86_64_PC32        | S + A - P               | PC-relative 32-bit offset    |
| R_X86_64_PLT32       | L + A - P               | Call through PLT entry       |
| R_X86_64_GOTPCREL    | G + GOT + A - P         | Load from GOT entry          |
| R_X86_64_GOTPCRELX   | G + GOT + A - P         | Relaxable GOT load           |
| R_X86_64_32          | S + A                   | Absolute 32-bit (truncated)  |
| R_X86_64_32S         | S + A                   | Absolute 32-bit (sign-ext)   |

Where S = symbol value, A = addend, P = place (address of the relocation),
L = PLT entry address, G = GOT entry offset, GOT = GOT base address.

The `-4` addend on PC-relative relocations compensates for the fact that %rip
points to the instruction *after* the relocation site when the instruction
executes.

### 5.3 ARM64 Relocations

ARM64 (AArch64) has its own relocation types, reflecting the fixed-width 32-bit
instruction encoding:

| Type                        | Bits  | Use                               |
|-----------------------------|-------|-----------------------------------|
| R_AARCH64_ADR_PREL_PG_HI21 | 21    | Page address (ADRP instruction)   |
| R_AARCH64_ADD_ABS_LO12_NC  | 12    | Page offset (ADD instruction)     |
| R_AARCH64_CALL26            | 26    | Branch to function (BL)           |
| R_AARCH64_JUMP26            | 26    | Unconditional branch (B)          |
| R_AARCH64_LDST64_ABS_LO12  | 12    | Load/store offset                 |

ARM64 addresses are typically formed using an ADRP + ADD pair: ADRP loads the
page-aligned upper bits, ADD fills in the page offset. This splits the address
across two instructions, requiring two cooperating relocations.

### 5.4 RISC-V Relocations

RISC-V uses a particularly rich relocation model because its 32-bit instructions
encode immediates in split bit fields:

| Type                    | Use                                         |
|-------------------------|---------------------------------------------|
| R_RISCV_HI20            | Upper 20 bits (LUI instruction)             |
| R_RISCV_LO12_I          | Lower 12 bits (I-type immediate)            |
| R_RISCV_LO12_S          | Lower 12 bits (S-type immediate)            |
| R_RISCV_CALL             | Paired AUIPC + JALR                        |
| R_RISCV_BRANCH           | Branch offset (B-type)                      |
| R_RISCV_RELAX            | Hint: linker may relax this instruction pair|

RISC-V's `R_RISCV_RELAX` is notable -- it tells the linker that a multi-
instruction sequence can potentially be simplified (relaxed) to fewer
instructions if the target is close enough.

---

## 6. Dynamic Linking

Dynamic linking defers symbol resolution to runtime, allowing multiple programs
to share a single copy of library code in memory.

### 6.1 Dynamic Linkers

| OS      | Dynamic Linker                              |
|---------|---------------------------------------------|
| Linux   | `/lib64/ld-linux-x86-64.so.2` (ld.so)      |
| macOS   | `/usr/lib/dyld`                             |
| Windows | `ntdll.dll` (PE loader in kernel32/ntdll)   |
| FreeBSD | `/libexec/ld-elf.so.1`                      |
| Solaris | `/lib/ld.so.1`                              |

### 6.2 The PLT/GOT Mechanism

The Procedure Linkage Table (PLT) and Global Offset Table (GOT) enable lazy
binding -- shared library functions are resolved only when first called.

Here is the PLT for `printf` in our test binary:

```
Disassembly of section .plt:

0000000000001020 <.plt>:
    1020:   ff 35 9a 2f 00 00       push   0x2f9a(%rip)    # GOT+8
    1026:   ff 25 9c 2f 00 00       jmp    *0x2f9c(%rip)   # GOT+16 (ld.so)
    102c:   0f 1f 40 00             nopl   0x0(%rax)
    1030:   f3 0f 1e fa             endbr64
    1034:   68 00 00 00 00          push   $0x0             # relocation index
    1039:   e9 e2 ff ff ff          jmp    1020 <.plt>      # call resolver

Disassembly of section .plt.sec:

0000000000001050 <printf@plt>:
    1050:   f3 0f 1e fa             endbr64
    1054:   ff 25 76 2f 00 00       jmp    *0x2f76(%rip)   # GOT entry
    105a:   66 0f 1f 44 00 00       nopw   0x0(%rax,%rax,1)
```

The lazy binding sequence:

```
Step 1: Code calls printf@plt (address 0x1050)
        │
Step 2: PLT stub jumps through GOT entry
        │
        ├─ First call: GOT entry points back to PLT trampoline at 0x1030
        │   │
        │   Step 3: Trampoline pushes relocation index, jumps to resolver
        │   │
        │   Step 4: ld.so looks up "printf" in libc.so.6
        │   │
        │   Step 5: ld.so writes real printf address into GOT entry
        │   │
        │   Step 6: ld.so jumps to real printf
        │
        └─ Subsequent calls: GOT entry now holds real address
            │
            Direct jump to printf in libc (no resolver overhead)
```

With modern security hardening (`BIND_NOW` / full RELRO), all GOT entries are
resolved at load time and the GOT is mapped read-only, eliminating the lazy
binding optimization but preventing GOT overwrite attacks.

### 6.3 The Dynamic Section

The `.dynamic` section contains entries that the dynamic linker needs:

```
Dynamic section at offset 0x2dc8 contains 27 entries:
  Tag        Type                         Name/Value
 0x0000000000000001 (NEEDED)             Shared library: [libc.so.6]
 0x000000000000000c (INIT)               0x1000
 0x000000000000000d (FINI)               0x1184
 0x0000000000000003 (PLTGOT)             0x3fb8
 0x0000000000000005 (STRTAB)             0x490
 0x0000000000000006 (SYMTAB)             0x3e8
 0x000000000000001e (FLAGS)              BIND_NOW
 0x000000006ffffffb (FLAGS_1)            Flags: NOW PIE
```

Key entries: `NEEDED` lists required shared libraries, `PLTGOT` points to the
GOT, `INIT`/`FINI` point to initialization/finalization functions, and
`FLAGS`/`FLAGS_1` control binding behavior.

### 6.4 ASLR (Address Space Layout Randomization)

ASLR randomizes the base address at which shared libraries (and PIE
executables) are loaded, making exploitation harder:

```bash
# Run the same binary twice, note different libc addresses:
ldd /tmp/mlc-research/hello
    libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007f8a12000000)
ldd /tmp/mlc-research/hello
    libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007f3c8e200000)
```

ASLR works because position-independent code uses only relative addresses
internally. The GOT/PLT mechanism ensures external references go through an
indirection table that can be patched at any base address.

---

## 7. Loading an Executable

### 7.1 Linux: From execve() to main()

The complete path from launching a program to executing `main()`:

```
User calls execve("/path/to/hello", argv, envp)
    │
    ▼
Kernel: sys_execve()
    │
    ├─ Read first 128 bytes of file
    ├─ Check magic: 0x7F 'E' 'L' 'F' → ELF handler
    │                '#' '!'        → Script handler (shebang)
    │
    ├─ Parse ELF header and program headers
    ├─ Map LOAD segments into new address space:
    │     0x0000..0x0650  R    (ELF headers, readonly data)
    │     0x1000..0x1191  R E  (code: .text, .plt, .init, .fini)
    │     0x2000..0x218c  R    (rodata, eh_frame)
    │     0x3db8..0x4028  RW   (data, bss, got, dynamic)
    │
    ├─ Set up user stack:
    │     [top of stack]
    │     envp strings    ("PATH=/usr/bin", "HOME=/home/user", ...)
    │     argv strings    ("./hello", arg1, arg2, ...)
    │     padding / alignment
    │     auxiliary vector (AT_PHDR, AT_ENTRY, AT_BASE, AT_RANDOM, ...)
    │     NULL
    │     envp[n] pointers
    │     NULL
    │     argv[n] pointers
    │     argc (integer)
    │     [bottom of stack = initial %rsp]
    │
    ├─ If INTERP segment exists (dynamically linked):
    │     Map ld-linux-x86-64.so.2 into address space
    │     Set entry point = ld.so's entry point
    │
    └─ Transfer control to entry point
         │
         ▼
    ld.so: _dl_start()
         │
         ├─ Self-relocate (ld.so itself needs relocation)
         ├─ Parse binary's DYNAMIC section
         ├─ Load NEEDED shared libraries (depth-first):
         │     libc.so.6 → load and process its DYNAMIC section
         │     (recursive for transitive dependencies)
         ├─ Process relocations:
         │     .rela.dyn  → patch GOT entries, copy relocations
         │     .rela.plt  → set up PLT (lazy or eager binding)
         ├─ Apply RELRO: mprotect GOT pages to read-only
         ├─ Run library initializers (.init, .init_array)
         │
         └─ Jump to program's _start (entry point 0x1060)
              │
              ▼
         _start (in crt1.o):
              │
              ├─ Clear %ebp (mark end of stack frames)
              ├─ Pop argc from stack into %rsi
              ├─ Set up arguments for __libc_start_main:
              │     %rdi = pointer to main
              │     %rsi = argc
              │     %rdx = argv
              │     %rcx = __libc_csu_init
              │     %r8  = __libc_csu_fini
              │     %r9  = rtld_fini (ld.so cleanup)
              │
              └─ call __libc_start_main()
                   │
                   ├─ Set up stdio (stdin, stdout, stderr)
                   ├─ Call constructors (__libc_csu_init)
                   ├─ Call atexit handlers registration
                   ├─ Call main(argc, argv, envp)
                   │     │
                   │     └─ Your code runs here
                   │
                   └─ Call exit(return_value_from_main)
```

### 7.2 The Auxiliary Vector

The kernel passes critical information to the dynamic linker via the auxiliary
vector on the stack:

| Tag       | Value passed                                        |
|-----------|-----------------------------------------------------|
| AT_PHDR   | Address of program header table in memory            |
| AT_PHENT  | Size of each program header entry                    |
| AT_PHNUM  | Number of program header entries                     |
| AT_ENTRY  | Program entry point address                          |
| AT_BASE   | Base address where ld.so was loaded                  |
| AT_RANDOM | Address of 16 random bytes (for stack canary)        |
| AT_EXECFN | Filename of the executed program                     |
| AT_SYSINFO_EHDR | Address of vDSO (virtual dynamic shared object) |

The vDSO (`linux-vdso.so.1`) is a kernel-provided shared library mapped into
every process, allowing fast system calls (like `gettimeofday`) without a full
kernel transition.

---

## 8. Debug Information

### 8.1 DWARF

DWARF (Debugging With Attributed Record Formats) is the standard debug
information format on Unix systems. It maps machine code back to source code.

DWARF sections in an ELF binary:

| Section          | Contents                                          |
|------------------|---------------------------------------------------|
| `.debug_info`    | Type definitions, variable locations, scopes      |
| `.debug_line`    | Machine address ↔ source file:line mapping         |
| `.debug_abbrev`  | Abbreviation tables for `.debug_info` encoding    |
| `.debug_str`     | String table for debug names                      |
| `.debug_aranges` | Address ranges for compilation units              |
| `.debug_frame`   | Call frame information (stack unwinding)           |
| `.debug_loc`     | Variable location lists (register or memory)      |
| `.debug_ranges`  | Non-contiguous address ranges                     |
| `.debug_types`   | Type definitions (DWARF 4+)                       |
| `.debug_macro`   | Macro definitions                                 |

### 8.2 DWARF Debug Info Example

From our debug-compiled binary:

```
 <0><c>: Abbrev Number: 5 (DW_TAG_compile_unit)
    <d>   DW_AT_producer    : GNU C23 15.2.0 -mtune=generic -march=x86-64 -g
    <11>   DW_AT_language    : 29 (C11)
    <17>   DW_AT_name        : /tmp/mlc-research/hello.c
    <1b>   DW_AT_comp_dir    : /media/foxy/ai/GSD/dev-tools/artemis-ii
    <1f>   DW_AT_low_pc      : 0x1149
    <27>   DW_AT_high_pc     : 0x38
    <2f>   DW_AT_stmt_list   : 0
```

This tells a debugger: "The function `main` compiled from `hello.c` occupies
addresses 0x1149 through 0x1181 (0x1149 + 0x38)."

### 8.3 DWARF Line Table

The line table maps instruction addresses to source lines:

```
 Line Number Statements:
  [0x00000043]  Set column to 34
  [0x00000045]  Extended opcode 2: set Address to 0x1149
  [0x00000050]  Special opcode 9: advance Address by 0 to 0x1149 and Line by 4 to 5
  [0x00000051]  Set column to 5
  [0x00000053]  Advance PC by constant 17 to 0x115a
  [0x00000054]  Special opcode 34: advance Address by 2 to 0x115c and Line by 1 to 6
```

This encodes a state machine: "Address 0x1149 = line 5 (start of main),
address 0x115c = line 6 (the printf call)." The encoding is a compact
bytecode because a naive address-line table would be enormous.

### 8.4 How GDB Uses DWARF

When you type `break main` in GDB:

1. GDB searches `.debug_info` for a `DW_TAG_subprogram` named "main"
2. Reads `DW_AT_low_pc` to find the starting machine address (0x1149)
3. Sets a breakpoint (replaces the first byte with `int3` / 0xCC)

When you type `print argc`:

1. GDB finds the `DW_TAG_formal_parameter` named "argc" in main's scope
2. Reads `DW_AT_location` which says "at offset -4 from %rbp" (`DW_OP_fbreg -4`)
3. Reads 4 bytes from that memory location and interprets as `int`

When you type `next` (step one source line):

1. GDB consults the line table to find the address range for the current line
2. Sets a temporary breakpoint at the start of the next line
3. Continues execution

### 8.5 PDB (Program Database) on Windows

Windows uses PDB files for debug information, stored separately from the
executable. The PE file's debug directory contains a path to the PDB file
and a GUID to match them.

PDB stores similar information to DWARF -- type information, line numbers,
local variables, and source file paths -- but in a proprietary format that
Microsoft has only partially documented.

### 8.6 Split Debug Info

Debug information often dwarfs (no pun intended) the code itself. A small
program might be 16 KB stripped but 200 KB with debug info. Strategies:

- **Strip**: `strip --strip-debug binary` removes debug sections
- **Separate debug file**: `objcopy --only-keep-debug binary binary.dbg`
- **debuginfod**: HTTP server that GDB queries for debug info on demand
- **Build ID linking**: GDB finds `/usr/lib/debug/.build-id/ab/cdef1234...dbg`

---

## 9. Code Signing

Code signing uses cryptographic signatures to verify that a binary has not been
tampered with and comes from a known publisher.

### 9.1 macOS: Mandatory Code Signing

macOS requires code signatures for all executables since macOS 11 (Big Sur) on
Apple Silicon:

```bash
codesign -s "Developer ID Application: Company" --timestamp binary
codesign -v binary                  # Verify signature
codesign -d --verbose=4 binary      # Display signature details
```

Apple's code signing hashes each 4096-byte page of the `__TEXT` segment. The
kernel verifies these hashes on page fault -- a modified page causes a SIGKILL.
This is supplemented by notarization, where Apple's servers scan the binary for
malware before issuing a "ticket" that Gatekeeper checks.

### 9.2 Windows: Authenticode

Windows Authenticode signs PE files using PKCS#7:

1. Hash the PE file (excluding the signature area in the certificate data directory)
2. Sign the hash with a code signing certificate
3. Embed the signature in the PE file's Certificate Table (data directory index 4)

Windows SmartScreen uses both signature validity and reputation data to decide
whether to warn users. Unsigned or newly-signed binaries trigger warnings
regardless of actual safety.

### 9.3 Linux: IMA and dm-verity

Linux has no mandatory code signing for userspace by default, but offers:

- **IMA (Integrity Measurement Architecture)**: Measures file hashes at
  access time, can enforce policies requiring valid signatures
- **dm-verity**: Block-level integrity checking for read-only filesystems
  (used by Android and ChromeOS to protect the system partition)
- **eBPF LSM hooks**: Custom security policies that can enforce signature
  checks before `exec`

### 9.4 How Signing Works Mechanically

```
Signing:
    binary → hash(machine code sections) → digest
    digest + private_key → signature
    binary + signature + certificate → signed binary

Verification:
    signed binary → extract signature, certificate, binary content
    hash(binary content) → computed_digest
    signature + public_key → decrypted_digest
    computed_digest == decrypted_digest ? valid : tampered
    certificate → chain to trusted root CA ? trusted : untrusted
```

---

## 10. Binary Patching

Binary patching modifies machine code in an existing compiled binary, without
access to source code or recompilation.

### 10.1 Simple Patching Example

Suppose you want to change a conditional jump to always-jump. In x86-64:

```
Original:  74 0a        je  +10    (jump if equal)
Patched:   eb 0a        jmp +10    (unconditional jump)
Patched:   90 90        nop nop    (disable the jump entirely)
```

With `xxd`:

```bash
xxd binary > binary.hex           # Dump to hex
# Edit the hex file
xxd -r binary.hex > binary_patched  # Convert back
```

### 10.2 Hot-Patching

Windows uses hot-patching for system updates without rebooting. The convention:

1. Every function starts with `mov edi, edi` (2 bytes: `8b ff`) -- a deliberate NOP
2. The 5 bytes before the function are NOP padding
3. To hot-patch: write a `jmp` to the replacement function in the 5 padding bytes
4. Overwrite `mov edi, edi` with a 2-byte `jmp -5` to the long jump

```
Before:                          After:
  cc cc cc cc cc                   e9 XX XX XX XX        ; jmp replacement
  8b ff            mov edi,edi     eb f9                 ; jmp -5
  55               push ebp        55                    ; push ebp (never reached)
  8b ec            mov ebp,esp     8b ec                 ; mov ebp,esp
```

This is lock-free and atomic -- the 2-byte write is naturally atomic on x86,
so other threads either see the old code or the new code, never a torn write.

### 10.3 Tools

- **patchelf** (Linux): Modify ELF binaries -- change RPATH, interpreter path,
  add/remove NEEDED libraries
- **install_name_tool** (macOS): Modify Mach-O library paths
- **LIEF**: Cross-platform library for parsing and modifying ELF, PE, and Mach-O
- **Binary Ninja / IDA Pro / Ghidra**: Full-featured binary analysis and patching
- **radare2 / rizin**: Open-source reverse engineering framework with patching

### 10.4 Use Cases

- Fixing bugs in binaries where source code is lost
- Instrumenting binaries for profiling (inserting probes)
- CTF (Capture The Flag) challenges in security competitions
- Game modding and cheat development
- Compatibility shims for legacy software

---

## 11. Hex Editors and Binary Inspection

### 11.1 Command-Line Tools

**xxd** -- hex dump and reverse:

```bash
$ xxd -l 32 /tmp/mlc-research/hello
00000000: 7f45 4c46 0201 0100 0000 0000 0000 0000  .ELF............
00000010: 0300 3e00 0100 0000 6010 0000 0000 0000  ..>.....`.......
```

Each line: offset (hex), 16 bytes in hex (grouped by 2), ASCII representation
(non-printable = `.`).

**hexdump** -- more formatting options:

```bash
hexdump -C binary | head    # Canonical format (similar to xxd)
hexdump -e '"%08_ax: " 8/1 "%02x " "\n"' binary  # Custom format
```

**od** (octal dump) -- the original Unix tool:

```bash
od -A x -t x1z binary | head   # Hex bytes with ASCII
od -A x -t x4 binary | head    # 32-bit words
```

### 11.2 Reading a Hex Dump of Machine Code

Consider this disassembly from main():

```
0000000000001149 <main>:
    1149:   f3 0f 1e fa             endbr64
    114d:   55                      push   %rbp
    114e:   48 89 e5                mov    %rsp,%rbp
    1151:   48 83 ec 10             sub    $0x10,%rsp
    1155:   89 7d fc                mov    %edi,-0x4(%rbp)
    1158:   48 89 75 f0             mov    %rsi,-0x10(%rbp)
    115c:   48 8b 05 b5 2e 00 00    mov    0x2eb5(%rip),%rax
    1163:   48 8d 15 a9 0e 00 00    lea    0xea9(%rip),%rdx
    116a:   48 89 c6                mov    %rax,%rsi
    116d:   48 89 d7                mov    %rdx,%rdi
    1170:   b8 00 00 00 00          mov    $0x0,%eax
    1175:   e8 d6 fe ff ff          call   1050 <printf@plt>
    117a:   b8 00 00 00 00          mov    $0x0,%eax
    117f:   c9                      leave
    1180:   c3                      ret
```

The hex bytes and the assembly are two representations of the same machine code.
The relationship:

- `55` is the single-byte encoding of `push %rbp`
- `48 89 e5` is a 3-byte instruction: `48` is the REX.W prefix (64-bit
  operand), `89 e5` is `mov %rsp,%rbp`
- `e8 d6 fe ff ff` is a `call` with a 32-bit PC-relative offset. The offset
  `0xfffffed6` is -298 in two's complement. From address 0x117a (after the
  instruction): 0x117a + (-298) = 0x117a - 0x12a = 0x1050 = printf@plt
- `c3` is `ret`

### 11.3 GUI Hex Editors

- **HxD** (Windows): Fast, free, handles large files, has data inspector panel
- **010 Editor**: Programmable hex editor with "templates" that parse binary
  formats -- knows ELF, PE, ZIP, PNG, etc. and overlays colored field names
- **ImHex**: Open-source, pattern language for format parsing, data processor
  nodes, built-in disassembler
- **Hex Fiend** (macOS): Lightweight, fast, diff capability

---

## 12. Executable Packers and Protectors

### 12.1 UPX (Ultimate Packer for eXecutables)

UPX compresses executables, reducing file size while maintaining executability:

```bash
upx --best binary              # Compress
upx -d binary                  # Decompress
```

How it works:

1. Compress the `.text` and `.data` sections using NRV or LZMA
2. Replace them with a small decompressor stub + compressed data
3. At runtime, the stub decompresses into memory and jumps to the original entry

UPX supports ELF, PE, and Mach-O. Compressed binaries are typically 50-70%
smaller but have a brief decompression delay at startup.

### 12.2 Packers in Malware

Malware authors use packers to evade antivirus signature detection:

| Packer       | Techniques                                            |
|--------------|-------------------------------------------------------|
| UPX          | Basic compression (easily unpacked)                   |
| Themida       | VM-based obfuscation, anti-debug, anti-dump           |
| VMProtect    | Converts code to custom VM bytecode                   |
| ASPack       | Compression + import table rebuilding                 |
| PECompact    | Multi-layer compression                               |
| Enigma       | Licensing + code virtualization                       |

### 12.3 Anti-Analysis Techniques

Protectors go beyond compression to make reverse engineering difficult:

**Control Flow Flattening**: Replace structured control flow with a state
machine in a giant `switch` inside a `while(true)` loop. Every basic block
becomes a case, with state variable assignments replacing jumps.

```
Original:                    Flattened:
if (x > 0)                  state = 1
  a();                       while (true) {
else                           switch(state) {
  b();                           case 1: if (x>0) state=2; else state=3; break;
c();                             case 2: a(); state=4; break;
                                 case 3: b(); state=4; break;
                                 case 4: c(); return;
                               }
                             }
```

**Opaque Predicates**: Insert conditional branches where the condition always
evaluates the same way, but proving this requires complex analysis:

```asm
; y^2 - y is always even (opaque predicate: always true)
mov eax, [y]
imul eax, eax
sub eax, [y]
test eax, 1
jz real_code        ; always taken
jmp garbage_code    ; dead code that confuses disassemblers
```

**Instruction Substitution**: Replace simple instructions with equivalent
complex sequences:

```asm
; Instead of: add eax, 5
sub eax, -5                 ; equivalent

; Instead of: xor eax, eax
sub eax, eax                ; equivalent
lea eax, [0]                ; equivalent
```

**Dead Code Insertion**: Add instructions that compute values never used,
increasing the code volume a reverse engineer must analyze.

### 12.4 Unpacking

The general approach to unpacking:

1. Load the packed binary in a debugger (x64dbg, GDB, LLDB)
2. Set a breakpoint on the original entry point (OEP)
3. Run -- the packer decompresses and jumps to the OEP
4. At the OEP breakpoint, dump the process memory
5. Reconstruct the import table (the packer typically destroys it)
6. Fix the PE/ELF headers in the dump

Automated tools: **Detect It Easy** (identify the packer), **PE-sieve**
(detect in-memory modifications), **unpac.me** (online unpacking service).

---

## 13. Cross-Compilation and Multi-Architecture

### 13.1 Cross-Compiler Toolchains

A cross-compiler runs on one architecture (the host) but produces machine code
for a different architecture (the target):

```bash
# On x86-64, compile for ARM64
aarch64-linux-gnu-gcc -o hello_arm64 hello.c

# On x86-64, compile for RISC-V
riscv64-linux-gnu-gcc -o hello_riscv hello.c

# On x86-64, compile for ARM Cortex-M (bare-metal)
arm-none-eabi-gcc -mcpu=cortex-m4 -o firmware.elf main.c
```

Cross-compiler naming convention: `<target-triple>-<tool>`

```
aarch64 - linux - gnu - gcc
  │        │       │     └─ Tool (gcc, ld, objdump, ...)
  │        │       └─ C library (gnu = glibc, musl, none = bare-metal)
  │        └─ OS (linux, none, elf)
  └─ Architecture (aarch64, riscv64, arm, mips, ...)
```

### 13.2 Fat/Universal Binaries

macOS fat binaries contain multiple architectures (covered in Section 3.2).
The `lipo` tool manipulates them:

```bash
lipo -create hello_x86_64 hello_arm64 -output hello_universal
lipo -info hello_universal          # Architectures in this binary
lipo -thin arm64 hello_universal -output hello_arm64_only
```

### 13.3 Multi-Arch Containers

Docker's `buildx` enables building container images for multiple architectures:

```bash
docker buildx build --platform linux/amd64,linux/arm64,linux/arm/v7 \
    -t myimage:latest --push .
```

This works by either cross-compiling inside the build container or using QEMU
user-mode emulation.

### 13.4 QEMU User-Mode Emulation

QEMU can run individual foreign-architecture binaries by translating their
machine code at runtime:

```bash
# Run an ARM64 binary on x86-64
qemu-aarch64 -L /usr/aarch64-linux-gnu ./hello_arm64

# With binfmt_misc registered, the kernel does this transparently:
./hello_arm64    # Just works (if binfmt_misc is configured)
```

Linux's `binfmt_misc` mechanism registers QEMU as the interpreter for foreign
ELF binaries based on their `e_machine` field. The kernel sees an ARM64 ELF,
invokes `qemu-aarch64`, and QEMU translates ARM64 instructions to x86-64
instructions at runtime. This is how multi-arch Docker containers work on
x86-64 hosts.

### 13.5 Cross-Architecture Debugging

GDB supports remote debugging across architectures:

```bash
# On the target (or in QEMU):
gdbserver :1234 ./hello_arm64

# On the host:
gdb-multiarch ./hello_arm64
(gdb) target remote :1234
(gdb) break main
(gdb) continue
```

The `gdb-multiarch` binary understands all architectures and uses the DWARF
debug info to display source lines regardless of the target ISA.

---

## 14. WebAssembly as Virtual Machine Code

WebAssembly (Wasm) occupies a unique position -- it is a compilation target like
machine code, but runs in a sandboxed virtual machine rather than directly on
hardware.

### 14.1 The Wasm Binary Format

A Wasm binary (`.wasm` file) has a characteristic structure:

```
Offset  Bytes               Meaning
------  ------------------  ---------------------
0x00    00 61 73 6d         Magic: "\0asm"
0x04    01 00 00 00         Version: 1
0x08    ...                 Sections (type-length-value)
```

The magic bytes `0x00 0x61 0x73 0x6D` spell out `\0asm` in ASCII. The version
field is little-endian 1.

### 14.2 Wasm Sections

Each section has a 1-byte ID, a LEB128-encoded length, and the section data:

| ID | Name     | Contents                                           |
|----|----------|----------------------------------------------------|
| 0  | Custom   | Name section, debug info, arbitrary data           |
| 1  | Type     | Function signatures (parameter and return types)   |
| 2  | Import   | Imported functions, tables, memories, globals      |
| 3  | Function | Mapping: function index → type index               |
| 4  | Table    | Indirect function call tables (for function ptrs)  |
| 5  | Memory   | Linear memory declarations (min/max pages)         |
| 6  | Global   | Global variable declarations and initializers      |
| 7  | Export   | Exported functions, tables, memories, globals      |
| 8  | Start    | Index of function to call on instantiation         |
| 9  | Element  | Table initialization data (function references)    |
| 10 | Code     | Function bodies (locals + bytecode)                |
| 11 | Data     | Memory initialization data (like .data/.rodata)    |
| 12 | DataCount | Number of data segments (for single-pass validation) |

### 14.3 Wasm Instruction Encoding

Wasm uses a dense stack-based bytecode. Example -- a function that adds two
numbers:

```wat
;; WebAssembly Text Format (WAT)
(func $add (param $a i32) (param $b i32) (result i32)
    local.get $a
    local.get $b
    i32.add
)
```

In binary, this encodes as:

```
20 00      ;; local.get 0 ($a)
20 01      ;; local.get 1 ($b)
6a         ;; i32.add
0b         ;; end
```

Key Wasm value types:

| Type   | Encoding | Description              |
|--------|----------|--------------------------|
| `i32`  | `0x7F`   | 32-bit integer           |
| `i64`  | `0x7E`   | 64-bit integer           |
| `f32`  | `0x7D`   | 32-bit IEEE 754 float    |
| `f64`  | `0x7C`   | 64-bit IEEE 754 float    |
| `v128` | `0x7B`   | 128-bit SIMD vector      |
| `funcref` | `0x70` | Function reference      |
| `externref` | `0x6F` | External reference     |

### 14.4 How Wasm Relates to Real Machine Code

Wasm and native machine code serve the same role -- they are the lowest-level
compilation target -- but differ fundamentally in execution model:

| Aspect              | Native Machine Code              | WebAssembly                     |
|---------------------|----------------------------------|---------------------------------|
| Execution           | Direct on CPU                    | JIT-compiled or interpreted     |
| Memory safety       | None (arbitrary pointer access)  | Linear memory with bounds checks|
| Type safety         | None (bytes are bytes)           | Validated type system           |
| Control flow        | Arbitrary jumps                  | Structured (blocks, loops, if)  |
| Stack               | Implicit, programmer-managed     | Explicit operand stack + locals |
| Linking             | OS loader + dynamic linker       | Host embedder API               |
| System calls        | Direct (syscall instruction)     | Imported host functions only    |
| Code generation     | Final form                       | Intermediate (JIT to native)    |

### 14.5 Wasm in Practice

When V8 (Chrome's JS engine) or Wasmtime encounters a `.wasm` file:

1. **Validation**: Verify type safety, control flow integrity, memory access bounds
2. **Compilation**: JIT-compile Wasm bytecode to native machine code for the
   host CPU (x86-64, ARM64, etc.)
3. **Optimization**: Apply standard compiler optimizations (register allocation,
   instruction selection, dead code elimination)
4. **Execution**: Run the generated native machine code

The generated native code is real machine code -- `mov`, `add`, `call` -- but
with bounds checks inserted before memory accesses and structured control flow
enforced by the compilation strategy. Wasm achieves near-native performance
(typically within 10-20% of optimized C) because the compilation from Wasm to
machine code is straightforward -- Wasm was designed to be an efficient
compilation target.

### 14.6 WASI (WebAssembly System Interface)

WASI provides a POSIX-like system interface for Wasm, enabling server-side and
CLI use outside the browser:

```bash
# Compile C to Wasm targeting WASI
clang --target=wasm32-wasi -o hello.wasm hello.c

# Run with a Wasm runtime
wasmtime hello.wasm
wasmer hello.wasm
```

WASI modules use capability-based security -- the host grants specific
filesystem paths, environment variables, and network access. A Wasm module
cannot access anything it was not explicitly given.

---

## Summary: Format Comparison

| Feature              | ELF                    | PE/COFF                | Mach-O                 |
|----------------------|------------------------|------------------------|------------------------|
| **Platform**         | Linux, BSD, Solaris    | Windows                | macOS, iOS             |
| **Magic**            | `7F 45 4C 46`         | `4D 5A` (MZ)          | `FE ED FA CE/CF`      |
| **Dynamic linker**   | ld.so / ld-linux       | ntdll.dll              | dyld                   |
| **Lazy binding**     | PLT/GOT               | Delay-load DLLs       | Lazy symbol pointers   |
| **Shared libs**      | .so                    | .dll                   | .dylib / .framework    |
| **Debug format**     | DWARF                  | PDB                    | DWARF (in dSYM)        |
| **Code signing**     | Optional (IMA)         | Authenticode           | Mandatory (codesign)   |
| **Multi-arch**       | Separate binaries      | Separate binaries      | Fat/universal binaries |
| **ASLR support**     | PIE (ET_DYN)           | DynamicBase flag       | Enabled by default     |
| **Position-independent** | Default on modern distros | Default since VS2012 | Always               |

The binary format is the bridge between compiled machine code and the operating
system. Whether ELF on Linux, PE on Windows, or Mach-O on macOS, these formats
all solve the same problems: describe what code and data the binary contains,
where to load it in memory, what external symbols it needs, and how to patch
addresses so the code runs correctly at any base address. Understanding these
formats turns a binary from an opaque blob into a readable structure -- and
provides the foundation for debugging, reverse engineering, security analysis,
and systems programming.

---

## Addendum: WebAssembly 3.0 and the machine-code-in-the-browser story (2025–2026)

This section was added in April 2026 as part of a catalog-wide enrichment
pass. The body above focuses on the traditional binary-format trio (ELF,
PE, Mach-O) plus the classical machine-code execution model. The 2025
news in this space is not about any of those formats — they are stable,
and 2025 did not bring meaningful structural changes to any of them.
The news is about a fourth binary format that is now as widely deployed
as any of the traditional three: **WebAssembly**.

### Wasm 3.0 (September 17, 2025)

**WebAssembly 3.0** was formally released on **September 17, 2025**,
the first major-version bump since Wasm 2.0. Unlike most standards-body
version increments, Wasm 3.0 ships a real set of features that had
been in development for six to eight years and that collectively
change what Wasm is capable of expressing at the machine-code level.

The headline features:

- **64-bit address space.** Wasm memories and tables can now be
  declared with `i64` address types instead of `i32`. The practical
  effect is that the Wasm address space grows from 4 GiB (the i32
  ceiling) to a theoretical 16 exabytes. For anyone porting C, C++,
  Rust, or Go code that routinely works with >4 GiB of memory — which
  includes most scientific computing, most databases, and most large
  ML workloads — this is the change that removes the last major
  structural limitation of Wasm as a compilation target for serious
  native code.
- **Garbage-collected references (GC proposal).** Wasm 3.0 adds a
  reference-type system that is rich enough to express managed-memory
  languages without bolting on a separate heap. Host languages that
  have a GC (JavaScript, Java, Kotlin, Dart, OCaml, Scheme) can now
  compile to Wasm in a way that cooperates with the host's GC rather
  than shipping their own.
- **Exception handling.** The tag-and-throw model that had been in
  proposal for years is now part of the core spec.
- **Tail-call optimization.** Proper tail calls, which functional
  languages have needed since Wasm 1.0.
- **Multi-memory.** A Wasm module can now declare multiple
  independent memories, which unlocks patterns like shared memory
  between modules and isolation of sensitive state from the rest of
  the module.
- **Relaxed SIMD.** The SIMD feature gains a set of operations whose
  semantics are "fast" rather than "bit-exact," trading a small
  amount of cross-platform determinism for a meaningful speedup on
  common SIMD patterns.
- **Custom annotation syntax.** The Wasm text format now has a
  generic annotation syntax for attaching metadata to constructs,
  without those annotations affecting semantics. This is the
  structural move that makes tooling (profilers, debuggers, source
  mappers) much easier to build.

Together, these changes move Wasm from "a compilation target that can
run portable C/C++/Rust" to "a compilation target that can run
anything, including languages with their own GC, inside any
Wasm-capable host." The Wasm-3.0-or-later baseline is what Chromium,
Firefox, Safari, and the server runtimes (Wasmtime, Wasmer, WAMR) are
all converging on.

**Sources:** [Wasm 3.0 Completed — webassembly.org news, September 17, 2025](https://webassembly.org/news/2025-09-17-wasm-3.0/) · [Binary Format — WebAssembly 3.0 (2026-03-24) — webassembly.github.io/spec](https://webassembly.github.io/spec/core/binary/index.html) · [Conventions — WebAssembly 3.0 (2025-12-08)](https://webassembly.github.io/spec/core/binary/conventions.html) · [Introduction — WebAssembly 3.0 (Draft 2025-10-17)](https://wasm-dsl.github.io/spectec/core/intro/introduction.html)

### DWARF for Wasm

One of the quieter but load-bearing pieces of the Wasm 3.0 tooling
story is that **DWARF debug information for WebAssembly** is now a
stable pattern. DWARF sections for a Wasm binary are either embedded
directly in the `.wasm` file as custom sections (matching how DWARF
is embedded in ELF) or shipped as an external sidecar file. Either
way, the `lldb`, `gdb`, and Chrome DevTools toolchains can now
source-level-debug Wasm binaries the same way they debug native ELF
or Mach-O binaries. This is a small change in wording and a large
change in developer experience — a Rust program compiled to Wasm can
now be breakpoint-debugged in the browser with full variable
inspection.

**Source:** [DWARF for WebAssembly — yurydelendik.github.io/webassembly-dwarf](https://yurydelendik.github.io/webassembly-dwarf/)

### Wasm + eBPF — machine code in the kernel

A second 2025 thread worth noting is the growing crossover between
Wasm and **eBPF** — the Linux kernel's sandboxed bytecode format for
in-kernel programs. eBPF is machine code in a verifier-approved
virtual ISA that runs inside the kernel, and Wasm is machine code in
a verifier-approved virtual ISA that runs inside the browser (or a
server-side Wasm runtime). The two formats have independent lineages
but obvious structural similarities, and several 2025 projects
(notably `wasm-bpf` and `wasm-bpf-rs`) explore ways to use Wasm as
a distribution and tooling format for eBPF programs. The practical
result is that developers can write an eBPF program, compile it to
Wasm for distribution, and then load it into the kernel from any
Wasm-capable host language.

This matters for the machine-code story because it is the first
serious example of *verifier-compatible* machine code being used as
a portable distribution format. ELF, PE, and Mach-O all assume the
CPU will run the code as-is; Wasm and eBPF both assume a verification
pass before execution. The verifier-first model has been a fringe
position in systems programming for decades (JVM bytecode, CLR IL);
in 2025 it has become a mainstream design for new tool-chains.

**Sources:** [wasm-bpf — eunomia-bpf on GitHub](https://github.com/eunomia-bpf/wasm-bpf) · [When Wasm Meets eBPF — eunomia.dev](https://eunomia.dev/en/blogs/ebpf-wasm/) · [Wasm-bpf: Bridging WebAssembly and eBPF for Kernel Programmability — eunomia.dev](https://eunomia.dev/en/blogs/introduce-to-wasm-bpf-bpf-community/)

### What this means for the binary-format chapter

The ELF/PE/Mach-O matrix above is still the correct starting point
for understanding machine-code binary formats in 2026. What it is
missing, as of this enrichment pass, is a fourth column for Wasm —
a binary format that is as widely deployed as the traditional three
(in every major browser and in a growing server ecosystem), that
solves the same problems (describe code, describe data, describe
symbols, describe relocations), and that does so with verification
as a first-class primitive rather than as an afterthought.

A fully-updated version of the table would have a Wasm row covering
module format (`.wasm`), linker (the Wasm component model), dynamic
linker (host-provided), debug format (embedded DWARF custom section),
code signing (host-provided), multi-arch (single binary runs
everywhere), ASLR (moot — linear memory is always offset), and
position-independent code (mandatory — Wasm bytecode has no concept
of absolute addresses). That table extension is left as an open
follow-up in the research catalog.

## Related College Departments

This research cross-links to the following college departments in
`.college/departments/`:

- [**coding**](../../../.college/departments/coding/DEPARTMENT.md) —
  Machine code is the substrate of every Programming Fundamentals
  lesson about variables, control flow, and I/O. Without
  understanding what the hardware does, the higher-level abstractions
  are harder to teach.
- [**electronics**](../../../.college/departments/electronics/DEPARTMENT.md)
  — Instruction encoding is the point at which electronics and
  computer science meet. The ELF / PE / Mach-O / Wasm formats are
  all, at bottom, descriptions of what bits will go into the program
  counter.
- [**engineering**](../../../.college/departments/engineering/DEPARTMENT.md)
  — Binary formats, dynamic linkers, and loader behavior are all
  systems-engineering concerns. Wasm's verifier-first design is a
  case study in how a security constraint can reshape a format's
  architecture.
- [**history**](../../../.college/departments/history/DEPARTMENT.md)
  — The ELF format is four decades old, Mach-O is nearly as old,
  PE descends directly from COFF which descends from the 1970s,
  and Wasm is less than a decade old. Machine-code binary formats
  are an unusually long-lived artifact class.

---

*Addendum (WebAssembly 3.0 and eBPF crossover) and Related College Departments cross-link added during the Session 018 catalog enrichment pass.*
