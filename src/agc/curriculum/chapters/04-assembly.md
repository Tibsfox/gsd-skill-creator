---
chapter: 4
title: "Assembly: Writing AGC Programs"
slug: assembly
prerequisites:
  - isa
learningObjectives:
  - "Write simple AGC assembly programs"
  - "Use labels, directives, and addressing modes"
  - "Assemble and run a program on the simulator"
estimatedMinutes: 30
archiveRefs:
  - agc-soft-002
  - agc-soft-003
conceptRefs: []
---

# Chapter 4: Assembly -- Writing AGC Programs

## Introduction

Knowing the instruction set is one thing. Writing programs with it is another.
This chapter teaches you the AGC assembly language -- the syntax, directives,
and conventions needed to write, assemble, and run programs on the simulator.
By the end, you will write and execute your first AGC program.

## Assembly Syntax

An AGC assembly line has up to four fields:

```
LABEL    MNEMONIC  OPERAND    # comment
```

- **LABEL** (optional): a symbolic name for this address. Labels start at
  column 1 and contain only uppercase letters and digits.
- **MNEMONIC**: the instruction or directive name (CA, TC, SETLOC, etc.)
- **OPERAND**: the argument -- either a label, a numeric literal, or a
  channel number
- **COMMENT** (optional): begins with `#` or `;` and extends to end of line

Examples:
```agc
START    CA     VALUE        # Load VALUE into A
         AD     VALUE        # Add VALUE to A (no label on this line)
LOOP     TC     LOOP         # Jump to LOOP (infinite busy wait)
```

## Directives

Directives control the assembler but do not generate instructions:

| Directive | Syntax | Purpose |
|-----------|--------|---------|
| SETLOC | `SETLOC 4000` | Set the location counter (where code goes) |
| BANK | `BANK 5` | Set the fixed bank (location counter moves) |
| OCT | `MYVAL OCT 12345` | Store an octal literal at current location |
| DEC | `COUNT DEC 10` | Store a decimal value (converted to 15-bit) |
| ERASE | `TEMP ERASE` | Allocate one word of erasable memory |
| EQUALS | `TEN EQUALS 12` | Define a symbol (TEN = octal 12 = decimal 10) |

### SETLOC

SETLOC sets the **location counter** -- the address where the next word will
be placed. Most curriculum programs start with:

```agc
SETLOC   4000
```

This places code at address 4000 (octal), which is the start of the FBANK-
switched fixed memory window. The CPU starts execution at Z=4000, so this
is where your program's first instruction should go.

### OCT and DEC

OCT stores an octal literal. DEC stores a decimal value converted to the
AGC's 15-bit ones' complement format.

```agc
FLAGS    OCT    40000        # Bit 14 set
TEN      DEC    10           # Decimal 10 = octal 12
NEG5     DEC    -5           # Ones' complement negative: 77772
```

### ERASE

ERASE allocates one word of erasable (RAM) memory. The assembler assigns the
next available erasable address:

```agc
COUNTER  ERASE               # Allocate 1 word in erasable memory
TEMP     ERASE               # Another erasable word
```

These variables are initialized to zero. You can write to them with TS and
read them with CA.

## Address References

Labels resolve to addresses. When you write `CA VALUE`, the assembler replaces
`VALUE` with the address where `VALUE` was defined:

```agc
SETLOC   4000
START    CA     TEN          # Assembles to: CA 4003 (opcode 3 | addr 4003)
         TS     RESULT       # TS stores A into RESULT's erasable address
DONE     TC     DONE         # Busy loop: TC to self
TEN      DEC    10           # At address 4003
RESULT   ERASE               # Erasable address assigned by assembler
```

The assembler handles forward references -- you can reference labels that
appear later in the source.

## Your First Program

Here is a complete AGC program that loads a constant and displays it on the
DSKY:

```agc
# Hello DSKY -- display a value on the R1 register
SETLOC   4000

HELLO    CA     DISPVAL      # Load display value into A
         EXTEND
         WRITE  10           # Write A to channel 10 (DSKY relay word 1)
DONE     TC     DONE         # Halt: busy loop forever

DISPVAL  OCT    12345        # Value to display on R1
```

This program:
1. Loads the octal value 12345 into the Accumulator (A)
2. Writes A to I/O channel 10 (the DSKY's relay word 1, which controls R1)
3. Enters a busy loop (TC to self) -- the program is complete

## How to Run on the Simulator

To assemble and run this program using the curriculum runner:

```typescript
import { assembleProgramSource, runProgram } from './curriculum/index.js';

// Your AGC assembly source code
const source = `
SETLOC   4000
HELLO    CA     DISPVAL
         EXTEND
         WRITE  10
DONE     TC     DONE
DISPVAL  OCT    12345
`;

// Step 1: Assemble source to machine code
const program = assembleProgramSource(source);

// Step 2: Run on the simulator
const result = runProgram(program, { maxSteps: 100 });

// Step 3: Inspect the result
console.log(`Steps: ${result.steps}`);
console.log(`Halted: ${result.halted} (${result.haltReason})`);
console.log(`I/O writes:`, result.ioLog);
```

The `assembleProgramSource()` function parses the source, resolves labels,
and encodes instructions into 15-bit machine code words. The `runProgram()`
function loads those words into the simulator's fixed memory and steps the
CPU until it halts.

## The EXTEND Convention

Extracode instructions (WRITE, READ, MP, etc.) must be preceded by EXTEND on
the previous line:

```agc
         EXTEND               # Sets the extracode flag
         WRITE  10            # Decoded as extracode: WRITE channel 10
```

EXTEND is consumed after one instruction. If you forget EXTEND before WRITE,
the word will be decoded as a basic instruction (likely producing wrong
behavior). Always pair EXTEND with its extracode instruction.

## Common Mistakes

| Mistake | What Happens | Fix |
|---------|-------------|-----|
| Forgot EXTEND before WRITE | Decoded as basic instruction | Add EXTEND line before WRITE |
| Using DEC for bit patterns | Wrong encoding for flags | Use OCT for bit patterns |
| Forgetting ERASE for variables | Label resolves to wrong address | Add ERASE directive |
| TC to wrong label | Jumps to unexpected location | Double-check label names |
| Missing SETLOC | Code starts at address 0 (register space) | Always start with SETLOC 4000 |

## Subroutine Calls

TC is the AGC's subroutine call instruction. It saves the return address in
the Q register, then jumps to the target:

```agc
         TC     MYSUB        # Call MYSUB, return addr saved in Q
         # ... execution continues here after MYSUB returns ...

MYSUB    CA     DATA         # Subroutine body
         EXTEND
         WRITE  10
         TC     Q            # Return: jump to address in Q
```

TC Q is the AGC's "return" -- it jumps to the address saved by the last TC.
This only works for single-level calls. Nested calls require saving Q to
erasable memory.

## Key Takeaways

- AGC assembly has labels, mnemonics, operands, and comments
- SETLOC sets where code is placed; OCT/DEC define constants; ERASE allocates
  RAM
- Labels are resolved by the assembler -- forward references are supported
- EXTEND must precede every extracode instruction (WRITE, READ, MP, etc.)
- TC saves the return address in Q; TC Q returns from a subroutine
- `assembleProgramSource()` and `runProgram()` are the curriculum runner APIs

## Exercises Preview

You are now ready for hands-on programming:
- **Exercise 1: Your First AGC Program (Hello DSKY)** -- display a value
- **Exercise 2: Timing and Display (Countdown)** -- CCS-based counting loop

## Further Reading

- `agc-soft-002`: AGC Block II Instruction Set Reference
- `agc-soft-003`: AGC Assembly Language and Programming Guide
