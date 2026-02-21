---
chapter: 7
title: "Interpreter: Double-Precision on Single-Precision Hardware"
slug: interpreter
prerequisites:
  - dsky
learningObjectives:
  - "Understand why double-precision was needed for navigation"
  - "Know how the Interpreter extends the 15-bit AGC to 28-bit precision"
  - "Trace an Interpreter instruction through the virtual machine"
estimatedMinutes: 30
archiveRefs:
  - agc-soft-004
  - agc-soft-005
  - agc-soft-008
conceptRefs:
  - agc-concept-11
  - agc-concept-08
---

# Chapter 7: Interpreter -- Double-Precision on Single-Precision Hardware

## Introduction

Navigation requires precision. To land on the Moon with one-mile accuracy
from 240,000 miles away, the AGC needed many significant digits in its
calculations. But 15-bit words provide only about 5 digits of precision.
The solution was the Interpreter -- a virtual machine running on top of the
native CPU that provides 28-bit double-precision arithmetic.

## Why Double-Precision?

Consider the problem: the Moon is about 240,000 miles from Earth. The AGC
needed to compute trajectory corrections to within about 1 mile of accuracy.
That requires a relative precision of 1/240,000, or roughly 6 significant
digits.

A 15-bit ones' complement word represents values from -16,383 to +16,383 --
about 4.5 decimal digits. That is barely enough for simple counting and
totally inadequate for navigation.

Double-precision uses two 15-bit words together, giving 28 usable bits
(the sign bits overlap) -- about 8.4 decimal digits. This is sufficient for
lunar navigation.

| Precision | Bits | Decimal Digits | Range |
|-----------|------|----------------|-------|
| Single (1 word) | 15 | ~4.5 | +/- 16,383 |
| Double (2 words) | 28 | ~8.4 | +/- 268,435,455 |

## The Interpreter: A Virtual Machine

The Interpreter is not hardware -- it is a program. It is an Executive job
(running at high priority) that reads "pseudocode" from fixed memory and
dispatches to subroutines that perform double-precision operations.

Each Interpreter instruction consists of **two words**:
1. **Opcode word**: identifies the operation (e.g., DAD, DMP, DDV)
2. **Operand word**: the address of the double-precision operand pair

The Interpreter reads these word pairs from memory and dispatches to the
appropriate subroutine. Each subroutine:
1. Loads two 15-bit words from the operand address (the DP value)
2. Performs the operation (add, multiply, divide, etc.)
3. Stores the result in the "MPAC" (Multiple-Precision Accumulator)
4. Advances the Interpreter's program counter to the next instruction pair

### Key Interpreter Operations

| Mnemonic | Operation | Description |
|----------|-----------|-------------|
| DAD | DP Add | Add double-precision operand to MPAC |
| DSU | DP Subtract | Subtract DP operand from MPAC |
| DMP | DP Multiply | Multiply MPAC by DP operand |
| DDV | DP Divide | Divide MPAC by DP operand |
| VXSC | Vector x Scalar | Multiply a 3D vector by a scalar |
| VXV | Vector Cross | Cross product of two 3D vectors |
| DOT | Dot Product | Dot product of two 3D vectors |
| UNIT | Unit Vector | Normalize a vector to unit length |
| ASIN | Arc Sine | Inverse sine for angle calculations |
| ACOS | Arc Cosine | Inverse cosine for angle calculations |

### The MPAC

The MPAC (Multiple-Precision Accumulator) is the Interpreter's workspace --
a set of erasable memory words that hold the current computation state. It
is conceptually equivalent to the CPU's A register but for double-precision
values.

The MPAC is stored in a VAC area (44 words) allocated by FINDVAC when the
Interpreter job is created. This is why guidance computations use FINDVAC
instead of NOVAC -- they need the VAC workspace.

## How It Works

The Interpreter is itself an Executive job. Here is the lifecycle:

1. **Create**: FINDVAC creates the Interpreter job with a VAC area
2. **Initialize**: Set the Interpreter PC to the start of the pseudocode
3. **Fetch**: Read the next two words (opcode + operand address)
4. **Decode**: Look up the opcode in the Interpreter dispatch table
5. **Execute**: Call the subroutine (e.g., DAD, DMP)
6. **Loop**: Advance the Interpreter PC and repeat from step 3
7. **Terminate**: When the pseudocode says EXIT, the Interpreter returns
   control to the Executive

The pseudocode lives in fixed memory alongside native AGC code. The
Interpreter reads it sequentially, much like a modern bytecode VM reads
.class files or WASM modules.

## Performance Cost

The Interpreter is approximately **10x slower** than native instructions.
A native CA + AD takes about 24 microseconds (2 MCTs). A DAD (double add)
takes about 240 microseconds (20+ MCTs) because it involves multiple native
instructions: two word loads, carry propagation, end-around carry for both
halves, and result storage.

This is an acceptable tradeoff. Navigation equations run every 2 seconds
and need about 200 milliseconds of computation. The remaining 1.8 seconds
are available for other tasks. The precision is essential; the speed cost is
budgeted.

| Operation | Native MCTs | Interpreter MCTs | Slowdown |
|-----------|-------------|------------------|----------|
| Add | 2 | ~20 | 10x |
| Multiply | 3 | ~40 | 13x |
| Divide | 6 | ~80 | 13x |
| Vector op | N/A | ~120 | N/A |

## Comparison to Modern Virtual Machines

The Interpreter is conceptually identical to a modern virtual machine:

| AGC Interpreter | Modern Equivalent |
|----------------|-------------------|
| Pseudocode in fixed memory | Bytecode in .class or .wasm files |
| Interpreter dispatch loop | JVM interpreter or WASM runtime |
| MPAC (workspace) | JVM operand stack |
| VAC area | Stack frame / activation record |
| EXIT instruction | Method return |
| FINDVAC allocation | Stack allocation |

The key insight: when hardware lacks a capability you need, build a software
layer that provides it. The AGC's hardware could not do double-precision math,
so the Interpreter does it in software. Java's hardware cannot run bytecode,
so the JVM does it in software. WASM's hardware cannot run portable code, so
the runtime does it in software. Same pattern, 50 years apart.

## Navigation's Use of the Interpreter

The AGC's guidance equations are almost entirely written in Interpreter
pseudocode:

- **State vector propagation**: integrate acceleration over time to update
  position and velocity (6 DP values)
- **Guidance equation**: compute the desired acceleration vector
- **Steering commands**: convert acceleration to engine gimbal angles
- **Landing radar processing**: convert radar returns to altitude and velocity

These computations require trigonometry (sine, cosine, arcsine), vector
operations (cross product, dot product, unit vector), and high-precision
arithmetic. All impossible with native 15-bit instructions alone.

## Key Takeaways

- Navigation requires 8+ decimal digits of precision; 15-bit words provide
  only ~4.5 digits
- The Interpreter is a software virtual machine that provides 28-bit
  double-precision arithmetic
- Interpreter instructions are two-word pairs (opcode + operand) stored in
  fixed memory
- The MPAC is the Interpreter's accumulator, stored in a VAC area
- Performance cost is approximately 10x compared to native instructions
- The Interpreter is conceptually identical to JVM, WASM, or any bytecode VM
- Nearly all AGC guidance equations are written in Interpreter pseudocode

## Further Reading

- `agc-soft-004`: AGC Interpreter Architecture
- `agc-soft-005`: AGC Interpreter Instruction Set
- `agc-soft-008`: AGC Flight Software Systems
