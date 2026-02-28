---
chapter: 3
title: "Instruction Set: The AGC's Vocabulary"
slug: isa
prerequisites:
  - hardware
learningObjectives:
  - "Read and understand AGC instruction encoding"
  - "Know the 15 basic and 18 extracode instructions"
  - "Understand ones' complement arithmetic"
estimatedMinutes: 30
archiveRefs:
  - agc-soft-001
  - agc-soft-002
  - agc-arch-005
conceptRefs:
  - agc-concept-08
---

# Chapter 3: Instruction Set -- The AGC's Vocabulary

## Introduction

Every computer has a vocabulary -- a set of primitive operations it can
perform. The AGC's vocabulary is remarkably small: 15 basic instructions and
18 extracode instructions. With just 33 operations, the AGC navigated
spacecraft to the Moon.

This chapter covers the instruction word format, the complete instruction set,
and the ones' complement arithmetic that underpins every calculation.

## Instruction Word Format

Each AGC instruction word is 15 bits:

```
  Bit:  14  13  12  11  10  9  8  7  6  5  4  3  2  1  0
       ┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐
       │  opcode  │              address (12 bits)                    │
       └───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘
       └──3 bits──┘└─────────────── 12 bits ─────────────────────────┘
```

The 3-bit opcode gives 8 possible values (0-7). The 12-bit address field
specifies the operand location. For **quarter-code** instructions (opcodes 2
and 5), bits 11-10 extend the opcode, leaving only 10 bits for the address.

In the simulator: `decode(instructionWord, extracode)` parses a 15-bit word
into a `DecodedInstruction` with mnemonic, opcode, and address.

## The 15 Basic Instructions

| Opcode | Mnemonic | Full Name | Operation |
|--------|----------|-----------|-----------|
| 0 | TC | Transfer Control | Jump to address, save return in Q |
| 1/E | CCS | Count Compare Skip | Decrement and 4-way branch |
| 1/F | TCF | Transfer Control Fixed | Jump to fixed-memory address |
| 2/QC0 | DAS | Double Add to Storage | 30-bit add to memory pair |
| 2/QC1 | LXCH | L Exchange | Swap L register with memory |
| 2/QC2 | INCR | Increment | Add 1 to memory word |
| 2/QC3 | ADS | Add to Storage | Add A to memory |
| 3 | CA | Clear and Add | Load memory word into A |
| 4 | CS | Clear and Subtract | Load complement into A |
| 5/QC0 | INDEX | Index | Add operand to next instruction |
| 5/QC1 | DXCH | Double Exchange | Swap A,L with memory pair |
| 5/QC2 | TS | Transfer to Storage | Store A in memory |
| 5/QC3 | XCH | Exchange | Swap A with memory |
| 6 | AD | Add | Add memory word to A |
| 7 | MASK | Mask | AND memory word with A |

Key notations: "E" = erasable address, "F" = fixed address, "QC" = quarter-code.

### Special Instructions (Encoded as TC Variants)

| Address | Mnemonic | Operation |
|---------|----------|-----------|
| TC 3 | RELINT | Release interrupt inhibit |
| TC 4 | INHINT | Inhibit interrupts |
| TC 6 | EXTEND | Next instruction is extracode |

### The EXTEND Prefix

Extracode instructions share opcodes with basic instructions. The EXTEND
instruction (TC 6) tells the decoder that the **next** instruction should be
decoded from the extracode table instead of the basic table. EXTEND is
consumed after one instruction -- it does not persist.

## The 18 Extracode Instructions

After EXTEND, the same opcode values decode differently:

| Opcode | Mnemonic | Operation |
|--------|----------|-----------|
| 0 | READ | Read I/O channel into A |
| 0 | WRITE | Write A to I/O channel |
| 0 | RAND | Read-AND channel with A |
| 0 | WAND | Write-AND channel with A |
| 0 | ROR | Read-OR channel with A |
| 0 | WOR | Write-OR channel with A |
| 0 | RXOR | Read-XOR channel with A |
| 1/E | DV | Divide |
| 1/F | BZF | Branch Zero Fixed |
| 2/QC0 | MSU | Modular Subtract |
| 2/QC1 | QXCH | Q Exchange |
| 2/QC2 | AUG | Augment |
| 2/QC3 | DIM | Diminish |
| 3 | DCA | Double Clear and Add |
| 4 | DCS | Double Clear and Subtract |
| 6/E | SU | Subtract |
| 6/F | BZMF | Branch Zero or Minus Fixed |
| 7 | MP | Multiply |

I/O instructions (READ, WRITE, RAND, etc.) use a subcode in bits 11-9 and
a 9-bit channel number in bits 8-0. This is how the CPU communicates with
spacecraft peripherals including the DSKY, IMU, and radar.

## Ones' Complement Arithmetic

The AGC uses **ones' complement** representation, not the two's complement
used by modern CPUs. The key differences:

| Property | Ones' Complement | Two's Complement |
|----------|------------------|------------------|
| Positive zero | 00000 (octal) | 00000 |
| Negative zero | 77777 (octal) | (no separate -0) |
| Max positive | 37777 (+16383) | 37777 (+16383) |
| Max negative | 40000 (-16383) | 40000 (-16384) |
| Negation | Invert all bits | Invert + add 1 |

In ones' complement:
- **Positive zero** = 00000 (all bits clear)
- **Negative zero** = 77777 (all bits set)
- Both zeros are valid and test as "zero"
- **Negation** is simply inverting all 15 bits
- **Overflow** is detected via the 16th bit (overflow bit in the Accumulator)

Addition uses **end-around carry**: if the 16th bit overflows, it wraps back
and adds to bit 0. This happens in the ALU automatically.

In the simulator: `onesAdd()`, `onesSub()`, `onesNegate()` perform ones'
complement operations. `overflow()` checks for overflow.

## Special Registers

The AGC has several special-purpose registers at addresses 0-17:

| Address | Name | Purpose |
|---------|------|---------|
| 0 | A | Accumulator (16 bits with overflow) |
| 1 | L | Lower accumulator (for double-precision) |
| 2 | Q | Return address (saved by TC) |
| 3 | Z | Program counter (next instruction to execute) |
| 4 | EBANK | Erasable bank selector (3 bits) |
| 5 | FBANK | Fixed bank selector (5 bits) |
| 6 | BB | Both banks (EBANK + FBANK composite) |
| 9 | CYR | Cycle Right (edit register) |
| 10 | SR | Shift Right (edit register) |
| 11 | CYL | Cycle Left (edit register) |
| 12 | EDOP | Edit Opcode (edit register) |

The edit registers (CYR, SR, CYL, EDOP) are special: writing a value to them
stores a **transformed** version. Writing to CYR stores the value with all
bits cycled right by one position. This was the AGC's only barrel-shifter --
shifts were done by writing to these registers.

## Worked Example: Adding Two Numbers

Let's trace through adding 25 + 37 and storing the result:

```agc
         CA     OPERAND1     # Load 25 into A
         AD     OPERAND2     # Add 37 to A -> A = 62
         TS     RESULT       # Store 62 in RESULT
         TC     HALT         # Done
HALT     TC     HALT
OPERAND1 DEC    25
OPERAND2 DEC    37
RESULT   ERASE
```

Step by step:
1. **CA OPERAND1**: Reads memory at OPERAND1 (value 25), clears A, loads 25
2. **AD OPERAND2**: Reads memory at OPERAND2 (value 37), adds to A: 25+37=62
3. **TS RESULT**: Stores A (62) into erasable memory at RESULT
4. **TC HALT**: Jumps to HALT (saves return address in Q)
5. **TC HALT** at HALT: Jumps to itself -- busy loop, program complete

This is exactly the Calculator exercise (Exercise 3). You will assemble and
run this program on the simulator.

## CCS: The AGC's Swiss Army Knife

CCS (Count, Compare, and Skip) is the AGC's most powerful branching
instruction. It performs three operations:

1. **Read** the memory operand
2. **Diminish**: if positive, subtract 1; if negative, add 1; if zero, leave
3. **Store** the diminished value back in A
4. **Branch** to one of four addresses based on the original value:

```
         CCS    VALUE
         TC     POSITIVE     # VALUE > 0
         TC     PLUSZERO     # VALUE = +0
         TC     NEGATIVE     # VALUE < 0
         TC     MINUSZERO    # VALUE = -0
```

CCS is how the AGC implements loops, conditionals, and counting. The Countdown
exercise (Exercise 2) uses CCS to count from 10 down to 0.

## Key Takeaways

- AGC instructions are 15 bits: 3-bit opcode + 12-bit address
- 15 basic instructions + 18 extracode instructions (preceded by EXTEND)
- Ones' complement arithmetic has two zeros (+0 and -0) and uses end-around
  carry for addition
- CCS provides 4-way branching based on sign and zero testing
- I/O instructions (READ, WRITE, etc.) connect the CPU to spacecraft hardware
  via numbered channels

## Exercises Preview

This chapter's knowledge is directly applied in:
- **Exercise 3: Calculator** -- use CA, AD, TS for arithmetic
- **Exercise 1: Hello DSKY** -- use WRITE to send data to the DSKY

## Further Reading

- `agc-soft-001`: AGC Software Architecture Overview
- `agc-soft-002`: AGC Block II Instruction Set Reference
- `agc-arch-005`: AGC Address Space and Bank Switching
