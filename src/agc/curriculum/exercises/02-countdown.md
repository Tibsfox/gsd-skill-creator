---
exercise: 2
title: "Timing and Display"
slug: countdown
chapter: 4
difficulty: beginner
programSlug: countdown
description: "Count from 10 down to 0, displaying each value on DSKY R1"
---

# Exercise 2: Timing and Display -- Countdown

## Overview

This exercise teaches the CCS instruction -- the AGC's multi-purpose counting
and branching tool. You will write a program that counts from 10 down to 0,
displaying each value on the DSKY R1 display.

## Prerequisites

- Chapter 3: Instruction Set (CCS 4-way branch, ones' complement)
- Chapter 4: Assembly (SETLOC, DEC, ERASE, labels)
- Exercise 1: Hello DSKY (I/O channel writes)

## The Program

Open `programs/countdown.agc`:

```agc
# Countdown -- display 10 to 0 on R1
SETLOC   4000

START    CA     TEN          # Load 10
         TS     COUNT        # Store in counter

LOOP     CA     COUNT        # Load current count
         EXTEND
         WRITE  10           # Display on R1
         CCS    COUNT        # Decrement and test
         TC     DECR         # >0: continue
         TC     HALT         # =0: done
         TC     HALT         # <0: done (safety)
         TC     HALT         # -0: done (safety)

DECR     TS     COUNT        # CCS stored diminished value in A
         TC     LOOP

HALT     TC     HALT         # Busy loop -- program complete

TEN      DEC    10
COUNT    ERASE               # Allocate 1 word of erasable
```

## Step-by-Step Walkthrough

### Step 1: Understand CCS

CCS (Count, Compare, and Skip) does three things:
1. Reads the operand from memory
2. Stores the **diminished** value in A (if positive: value-1; if negative: value+1)
3. Branches to one of four consecutive addresses based on the **original** value:

```
CCS X
  TC POSITIVE    # Original X > 0
  TC PLUSZERO    # Original X = +0
  TC NEGATIVE    # Original X < 0
  TC MINUSZERO   # Original X = -0
```

### Step 2: Trace the execution

| Iteration | COUNT (before CCS) | A (after CCS) | Branch taken |
|-----------|--------------------|---------------|--------------|
| 1 | 10 | 9 | >0: TC DECR |
| 2 | 9 | 8 | >0: TC DECR |
| ... | ... | ... | >0: TC DECR |
| 10 | 1 | 0 | >0: TC DECR |
| 11 | 0 | 0 | =0: TC HALT |

After CCS diminishes 1 to 0, the **original** value (1) is still >0, so
it takes the first branch (TC DECR). The diminished value (0) is stored in
A and then in COUNT via TS.

On the next iteration, COUNT is 0. CCS sees the original value is +0 and
takes the second branch (TC HALT).

### Step 3: Run it

```typescript
const source = readFileSync('src/agc/curriculum/programs/countdown.agc', 'utf-8');
const program = assembleProgramSource(source);
const result = runProgram(program, { maxSteps: 500 });
```

### Step 4: Examine the I/O log

```typescript
const writes = result.ioLog.filter(e => e.channel === 8 && e.type === 'write');
console.log(`Channel 10 writes: ${writes.length}`);
writes.forEach(w => console.log(`  Step ${w.step}: value ${w.value}`));
// Expected: values decreasing from 10 to 0 (or close to it)
```

## Expected Output

- The program runs for approximately 50-80 steps
- Channel 10 receives writes with decreasing values
- Halts with "TC to self (busy loop)"

## Try It

1. **Count up instead of down**: Use AD with a value of 1:
   ```agc
   LOOP     CA     COUNT
            EXTEND
            WRITE  10
            CA     COUNT
            AD     ONE
            TS     COUNT
            CS     COUNT       # Compare to max
            AD     TEN
            CCS    A           # Branch if not reached max
            TC     LOOP
            TC     HALT
   HALT     TC     HALT
   ONE      DEC    1
   ```

2. **Count by 2s**: Load 2 instead of relying on CCS diminish.

3. **Add a delay loop**: Insert a counting loop between display writes to
   slow down the countdown (see the Blinker exercise for delay loop pattern).

## Troubleshooting

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| Infinite loop | CCS branch targets wrong | Check 4-way branch order |
| Only one I/O write | Not looping back to LOOP | Check TC DECR target |
| Wrong values displayed | Storing diminished vs. original | CCS puts diminished in A |
| Program never halts | COUNT never reaches 0 | Verify TEN is DEC 10 |
