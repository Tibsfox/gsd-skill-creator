---
exercise: 4
title: "Waitlist Timer Tasks"
slug: blinker
chapter: 5
difficulty: intermediate
programSlug: blinker
description: "Toggle the COMP ACTY annunciator on and off with delay loops"
---

# Exercise 4: Waitlist Timer Tasks -- Blinker

## Overview

This exercise demonstrates the concept of timed, repeated actions. The
program toggles the COMP ACTY annunciator on and off by writing alternating
values to channel 11, with a busy-wait delay between each toggle. The
exercise guide explains how the real AGC would use Waitlist entries instead
of busy-wait loops.

## Prerequisites

- Chapter 5: Executive & Waitlist (Waitlist concept, timer tasks)
- Chapter 6: DSKY (channel 11, annunciators, COMP ACTY)
- Exercise 1: Hello DSKY (I/O channel writes)

## The Program

Open `programs/blinker.agc`:

```agc
# Blinker -- toggle COMP ACTY indicator
SETLOC   4000

BLINK    CA     ON           # Load ON pattern
         EXTEND
         WRITE  11           # Channel 11: relay word 2 (COMP ACTY)
         TC     DELAY        # Busy-wait delay
         CA     OFF          # Load OFF pattern
         EXTEND
         WRITE  11
         TC     DELAY
         TC     BLINK        # Loop forever

DELAY    CA     DELCNT       # Simple delay loop
         TS     TEMP
DLLOOP   CCS    TEMP         # Decrement until zero
         TC     CONT
         TC     DLDONE       # =0: done
         TC     DLDONE
         TC     DLDONE
CONT     TS     TEMP         # CCS stored diminished value in A
         TC     DLLOOP
DLDONE   TC     Q            # Return (Q holds return address from TC DELAY)

ON       OCT    40000        # Bit 14 set -- COMP ACTY on
OFF      OCT    00000        # All bits clear -- COMP ACTY off
DELCNT   DEC    500          # Delay loop iterations
TEMP     ERASE
```

## Step-by-Step Walkthrough

### Step 1: The toggle pattern

The program alternates between two channel 11 writes:
- **ON**: OCT 40000 (bit 14 set) -- turns COMP ACTY on
- **OFF**: OCT 00000 (all clear) -- turns COMP ACTY off

Channel 11 controls the DSKY relay word 2, which includes the 11 status
annunciators. Bit 14 corresponds to the COMP ACTY light.

### Step 2: The subroutine call

`TC DELAY` is a subroutine call. TC saves the return address in Q, then jumps
to DELAY. The DELAY subroutine counts down from DELCNT (500) to zero using
CCS. When done, `TC Q` returns to the instruction after the TC DELAY call.

This is the AGC's calling convention:
- **TC target**: saves return address in Q, jumps to target
- **TC Q**: jumps to the address in Q (returns to caller)

### Step 3: The delay loop

```
DELAY    CA     DELCNT       # Load 500 into A
         TS     TEMP         # Store in temporary variable
DLLOOP   CCS    TEMP         # Decrement TEMP; branch on result
         TC     CONT         # TEMP was > 0: continue loop
         TC     DLDONE       # TEMP was +0: done
         TC     DLDONE       # TEMP was < 0: done (safety)
         TC     DLDONE       # TEMP was -0: done (safety)
CONT     TS     TEMP         # Store diminished value back
         TC     DLLOOP       # Loop
```

This counts from 500 down to 0, consuming CPU cycles. Each iteration takes
about 5 MCTs (58 microseconds). 500 iterations is about 29 milliseconds of
delay.

### Step 4: Run with limited steps

```typescript
const source = readFileSync('src/agc/curriculum/programs/blinker.agc', 'utf-8');
const program = assembleProgramSource(source);
// Use enough steps to see at least 2 blink cycles
const result = runProgram(program, { maxSteps: 10000 });

const ch11Writes = result.ioLog.filter(e => e.channel === 9 && e.type === 'write');
console.log(`Channel 11 writes: ${ch11Writes.length}`);
ch11Writes.forEach(w => console.log(`  Step ${w.step}: value ${w.value.toString(8)}`));
// Expected: alternating 40000 and 00000
```

### Step 5: Real AGC vs. busy-wait

In the real AGC, this pattern would use the Waitlist instead of busy-waiting:

```typescript
// Real AGC approach (TypeScript, not assembly):
// 1. Waitlist entry fires after 50 centiseconds (500ms)
// 2. Dispatched task creates a NOVAC job
// 3. Job writes ON/OFF to channel 11
// 4. Job adds a new Waitlist entry for the next toggle
// 5. Job ends (ENDOFJOB)
```

Busy-waiting wastes CPU cycles that other jobs need. The Waitlist approach
frees the CPU between toggles, allowing guidance and other critical tasks
to run. In a real mission, busy-waiting for 500 iterations would never be
acceptable -- but for a learning exercise, it demonstrates the pattern.

## Expected Output

- The program runs until maxSteps (it loops forever)
- Channel 11 receives alternating writes of OCT 40000 and OCT 00000
- Each pair of writes is separated by the delay loop

## Try It

1. **Change blink speed**: modify `DELCNT DEC 500` to `DEC 100` for faster
   blinking (shorter delay) or `DEC 2000` for slower blinking.

2. **Blink multiple annunciators**: write patterns with multiple bits set:
   ```agc
   ON       OCT    40200        # COMP ACTY + TRACKER
   ```

3. **Add a counter display**: write a counter value to channel 10 each time
   the toggle happens:
   ```agc
   BLINK    CA     BCOUNT
            EXTEND
            WRITE  10           # Show toggle count on R1
            CA     BCOUNT
            AD     ONE
            TS     BCOUNT
            CA     ON
            EXTEND
            WRITE  11
            # ...rest of blink cycle
   ONE      DEC    1
   BCOUNT   ERASE
   ```

## Troubleshooting

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| Only one I/O write | maxSteps too low | Increase maxSteps |
| Delay loop is infinite | CCS branch targets wrong | Check 4-way branch order |
| TC Q goes to wrong place | Nested TC call overwrites Q | Save Q before nested TC |
| All writes are same value | ON and OFF are same | Check OCT values |
