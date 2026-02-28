---
chapter: 2
title: "Hardware: A Computer from Wire and Core"
slug: hardware
prerequisites:
  - orientation
learningObjectives:
  - "Describe core rope memory and erasable core memory"
  - "Explain bank switching and why it was necessary"
  - "Understand the physical construction of the AGC"
estimatedMinutes: 25
archiveRefs:
  - agc-arch-002
  - agc-arch-004
  - agc-arch-005
  - agc-eng-001
conceptRefs:
  - agc-concept-07
  - agc-concept-09
---

# Chapter 2: Hardware -- A Computer from Wire and Core

## Introduction

The AGC's hardware was a marvel of 1960s engineering. Every bit of memory was
stored as a magnetic field in a tiny ferrite core. Every instruction was woven
into copper wire by hand. Understanding the hardware reveals why the AGC's
software was designed the way it was -- the constraints shaped every decision.

## Core Rope Memory (Fixed / ROM)

The AGC's program memory was stored in **core rope memory** -- the most
reliable mass storage technology ever manufactured. Each bit was encoded by
threading (or not threading) a wire through a ferrite core:

- Wire passes through core: bit = 1
- Wire bypasses core: bit = 0

Workers at the Raytheon factory hand-wove the wires through the cores under
microscopes. A single module held 6,144 15-bit words and took about 8 weeks
to manufacture. The entire AGC had 6 modules for a total of **36,864 words**
(approximately 69 kilobytes) of fixed memory.

Core rope was extraordinarily reliable -- it could not be corrupted by
radiation, power loss, or vibration. Once woven, the data was permanent. This
is why AGC programs were called "ropes." When software was finalized, it was
"frozen" and sent to the factory for weaving. Late changes were extremely
expensive.

In the simulator: `loadFixed(memory, bank, data)` loads a 1024-word rope
bank into fixed memory.

## Erasable Core Memory (RAM)

The AGC's working memory used **erasable magnetic core memory**. Each bit was
a tiny toroidal ferrite core magnetized in one of two directions. Reading a
core was destructive -- the sensing current reset the core -- so every read
was followed by a write-back cycle. This is why each memory access took a
full 11.72-microsecond Memory Cycle Time (MCT).

The AGC had **2,048 words** (approximately 3.8 kilobytes) of erasable memory,
organized into 8 banks of 256 words each. Variables, counters, job state,
and temporary computation results all shared this tiny space.

In the simulator: `writeMemory()` and `readMemory()` access erasable memory
with automatic bank selection.

## Bank Switching

The AGC's instruction word is 15 bits: 3 bits for the opcode and 12 bits for
the address. A 12-bit address can only reach 4,096 locations (octal 0-7777).
But the AGC has over 38,000 words of total memory. The solution: **bank
switching**.

### Address Map

| Address Range | Size | Description |
|---------------|------|-------------|
| 0000-0017 | 16 words | Special registers (A, L, Q, Z, etc.) |
| 0020-0377 | 224 words | Unswitched erasable (always visible) |
| 0400-0777 | 256 words | EBANK-switched erasable |
| 1000-1777 | 512 words | Upper unswitched erasable |
| 2000-2777 | 1024 words | Fixed-fixed bank 02 (always visible) |
| 3000-3777 | 1024 words | Fixed-fixed bank 03 (always visible) |
| 4000-7777 | 4096 words | FBANK-switched fixed (1024-word window) |

### EBANK: Erasable Bank Register

The EBANK register (3 bits) selects which of 8 erasable banks (256 words each)
appears in the address window 0400-0777. To access erasable bank 3:

```
; Set EBANK to 3 to access bank 3's 256 words
; In practice, the assembler tracks EBANK automatically
```

### FBANK: Fixed Bank Register

The FBANK register (5 bits) selects which of 36 fixed banks (1024 words each)
appears in the address window 4000-7777. When the CPU starts, FBANK=0, so
addresses 4000-4777 map to fixed bank 0.

Programs that span multiple banks must set FBANK before jumping to code in
another bank. The `BANK` directive in assembly sets the assembler's bank
context.

### The BB Register

The BB (Both Banks) register is a composite that stores both EBANK and FBANK
in a single 15-bit word. Writing BB updates both bank registers simultaneously.
The CPU saves and restores BB during interrupts and context switches to
preserve the complete bank context.

In the simulator: `resolveAddress(addr, ebank, fbank, superbank)` performs
the full bank-switching address resolution.

## Physical Construction

The AGC was built from six main trays:

- **Tray A**: Timing generator -- produces the 2.048 MHz master clock and all
  timing signals
- **Tray B**: CPU logic -- instruction decoding, ALU, register transfers
- **Trays C-F**: Memory and I/O -- core rope modules, erasable memory, and
  peripheral interface circuits

The trays were connected by a backplane wiring harness and mounted in a
sealed case:

| Physical Property | Value |
|-------------------|-------|
| Weight | 70 lbs (31.7 kg) |
| Size | 24 x 12.5 x 6 inches |
| Power | 55 watts at 28V DC |
| Operating temp | 32-130 deg F (0-54 deg C) |

The entire computer fit in a box the size of a briefcase. Every Apollo
spacecraft carried two -- one in the Command Module and one in the Lunar
Module.

## Memory Layout Diagram

```
                    AGC Memory Map
                    ══════════════

    ┌──────────────────────────┐ 7777
    │                          │
    │   FBANK-Switched Fixed   │ ← FBANK register selects
    │   (1024-word window)     │   which of 36 banks is visible
    │                          │
    ├──────────────────────────┤ 4000
    │   Fixed-Fixed Bank 03    │ ← Always visible
    ├──────────────────────────┤ 3000
    │   Fixed-Fixed Bank 02    │ ← Always visible
    ├──────────────────────────┤ 2000
    │   Upper Unswitched       │
    │   Erasable               │
    ├──────────────────────────┤ 1000
    │   EBANK-Switched         │ ← EBANK register selects
    │   Erasable (256 words)   │   which of 8 banks is visible
    ├──────────────────────────┤ 0400
    │   Unswitched Erasable    │ ← Always visible
    ├──────────────────────────┤ 0020
    │   Registers              │
    └──────────────────────────┘ 0000
```

## Key Takeaways

- Fixed memory (core rope) was hand-woven, extraordinarily reliable, and
  held 36,864 words of program code
- Erasable memory (magnetic core) held 2,048 words of working data; each
  read was destructive and required a write-back cycle
- Bank switching was necessary because 12-bit addresses can only reach 4,096
  locations, but the AGC had 38,000+ words of memory
- EBANK selects from 8 erasable banks; FBANK selects from 36 fixed banks
- The physical AGC weighed 70 lbs, consumed 55 watts, and fit in a briefcase

## Exercises Preview

The hardware constraints you learned here will become tangible in:
- **Exercise 3: Calculator** -- work with erasable memory addressing
- **Exercise 1: Hello DSKY** -- write to I/O channels connected to hardware

## Further Reading

- `agc-arch-002`: AGC Hardware Design Documentation
- `agc-arch-004`: AGC Memory System Architecture
- `agc-arch-005`: AGC Address Space and Bank Switching
- `agc-eng-001`: AGC Manufacturing and Wiring Specifications
