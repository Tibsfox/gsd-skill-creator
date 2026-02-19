---
exercise: 1
title: "Your First AGC Program"
slug: hello-dsky
chapter: 4
difficulty: beginner
programSlug: hello-dsky
description: "Write a display pattern to the DSKY via channel 10"
---

# Exercise 1: Your First AGC Program -- Hello DSKY

## Overview

In this exercise, you will assemble and run the simplest possible AGC program:
one that writes a value to the DSKY display. You will learn how I/O channel
writes work and see the curriculum runner in action.

## Prerequisites

- Chapter 3: Instruction Set (CA, EXTEND, WRITE)
- Chapter 4: Assembly (SETLOC, OCT, labels)

## The Program

Open `programs/hello-dsky.agc` and examine the source:

```agc
# Hello DSKY -- display a number on R1
SETLOC   4000

HELLO    CA     DISPVAL      # Load display value into A
         EXTEND
         WRITE  10           # Write A to channel 10 (DSKY relay word 1)
DONE     TC     DONE         # Halt: loop forever

DISPVAL  OCT    12345        # Display pattern for R1
```

## Step-by-Step Walkthrough

### Step 1: Understand the program

- **Line 1**: `SETLOC 4000` -- place code at address 4000 (start of fixed memory)
- **Line 2**: `CA DISPVAL` -- load the octal value 12345 from DISPVAL into register A
- **Lines 3-4**: `EXTEND` / `WRITE 10` -- write A to I/O channel 10 (DSKY R1 display)
- **Line 5**: `TC DONE` at label DONE -- jump to itself (busy loop = halt)
- **Line 6**: `OCT 12345` -- the data to display

### Step 2: Assemble the program

```typescript
import { assembleProgramSource, runProgram } from './curriculum/index.js';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/agc/curriculum/programs/hello-dsky.agc', 'utf-8');
const program = assembleProgramSource(source);
```

### Step 3: Run it

```typescript
const result = runProgram(program, { maxSteps: 100 });
console.log(`Steps: ${result.steps}`);
console.log(`Halted: ${result.halted} (${result.haltReason})`);
```

### Step 4: Inspect the I/O log

```typescript
const ch10Writes = result.ioLog.filter(e => e.channel === 8 && e.type === 'write');
console.log(`Channel 10 writes:`, ch10Writes);
// Expected: [{step: N, channel: 8, value: 5349, type: 'write'}]
// 5349 decimal = 12345 octal
```

## Expected Output

- The program runs for approximately 4-5 steps
- It halts with reason "TC to self (busy loop)"
- The I/O log contains one WRITE to channel 10 (decimal 8) with value 0o12345

## Try It

1. **Change the display value**: modify `DISPVAL OCT 12345` to `OCT 54321`
   and re-run. Observe the different value on channel 10.

2. **Write to channel 11**: add a second WRITE to channel 11 (R2/R3 display):
   ```agc
   HELLO    CA     DISPVAL
            EXTEND
            WRITE  10
            CA     DISPVAL2
            EXTEND
            WRITE  11
   DONE     TC     DONE
   DISPVAL  OCT    12345
   DISPVAL2 OCT    67012
   ```

3. **Write to both displays**: inspect the I/O log for writes to both
   channels 10 and 11.

## Troubleshooting

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| No I/O writes in log | Forgot EXTEND before WRITE | Add EXTEND line |
| Program does not halt | No TC-to-self loop | Add `DONE TC DONE` |
| Wrong value displayed | OCT vs DEC confusion | Use OCT for channel data |
| Assembly error | Typo in label name | Check label spelling (case-sensitive) |
