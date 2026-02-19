---
exercise: 8
title: "Reproducing the 1202 Alarm"
slug: capstone-1202
chapter: 10
difficulty: advanced
programSlug: capstone
description: "Reproduce the Apollo 11 1202 alarm: overload, BAILOUT, guidance preserved, recovery"
---

# Exercise 8: Reproducing the 1202 Alarm -- Capstone

## Overview

This is the capstone exercise of the AGC curriculum. You will reproduce the
Apollo 11 1202 alarm scenario end-to-end: create the overload condition that
triggered the alarm, call BAILOUT, and verify that guidance continues while
display and background tasks are discarded -- exactly as happened on
July 20, 1969.

## Prerequisites

- Chapter 10: Apollo 11 (the full 1202 alarm story)
- Chapter 9: Failsafe (BAILOUT algorithm)
- Exercise 7: Restart Protection (using BAILOUT)

## The Program

Open `programs/capstone.agc`:

```agc
# Capstone -- Apollo 11 1202 alarm reproduction
# Reproduces the overload that triggered BAILOUT during lunar descent
SETLOC   4000

# P63 Guidance (CRITICAL -- priority 0)
P63      CA     GDATA
         AD     DELTA
         TS     GDATA
         EXTEND
         WRITE  10           # Output guidance command to channel 10
         TC     P63

# Rendezvous Radar (IMPORTANT -- priority 2)
RADAR    EXTEND
         READ   33           # Read radar channel
         CA     RCOUNT
         AD     ONE
         TS     RCOUNT
         TC     RADAR

# Display Update (DEFERRABLE -- no restart point)
DSKYUP   CA     DDATA
         EXTEND
         WRITE  11           # Channel 11: DSKY relay word 2
         CA     DDATA
         AD     ONE
         TS     DDATA
         TC     DSKYUP

# Background Task (DEFERRABLE -- no restart point)
BKGND    CA     BCOUNT
         AD     ONE
         TS     BCOUNT
         TC     BKGND

# Filler jobs -- represent the accumulation of tasks
FILL1    TC     FILL1
FILL2    TC     FILL2
FILL3    TC     FILL3

# Constants and variables
ONE      DEC    1
DELTA    DEC    5
GDATA    ERASE
RCOUNT   ERASE
DDATA    ERASE
BCOUNT   ERASE

# Restart addresses
P63RST   TC     P63
RADRST   TC     RADAR
```

## Step-by-Step Walkthrough

### Step 1: Set Up the Scenario

```typescript
import { assembleProgramSource } from './curriculum/index.js';
import {
  createExecutiveState, novac, JobState, ALARM_1202,
  createAgcState, loadFixed,
} from '../index.js';
import {
  RestartGroup, createRestartState, registerRestartPoint, bailout,
} from '../index.js';
import { createWaitlistState } from '../index.js';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/agc/curriculum/programs/capstone.agc', 'utf-8');
const program = assembleProgramSource(source);

let exec = createExecutiveState();
let restart = createRestartState();
let waitlist = createWaitlistState();
```

### Step 2: Create the Initial Jobs

Find the label addresses by counting words from SETLOC 4000:

| Label | Address | Job Type |
|-------|---------|----------|
| P63 | 0o4000 | Guidance (CRITICAL, priority 0) |
| RADAR | 0o4006 | Radar (IMPORTANT, priority 2) |
| DSKYUP | 0o4014 | Display (DEFERRABLE, priority 5) |
| BKGND | 0o4023 | Background (DEFERRABLE, priority 6) |
| FILL1 | 0o4030 | Filler (priority 3) |
| FILL2 | 0o4031 | Filler (priority 4) |
| FILL3 | 0o4032 | Filler (priority 7) |
| P63RST | 0o4041 | P63 restart address |
| RADRST | 0o4042 | Radar restart address |

```typescript
// P63 Guidance -- CRITICAL, priority 0
const p63 = novac(exec, 0, 0o4000);
if (!('coreSetId' in p63)) throw new Error('failed');
exec = p63.state;
restart = registerRestartPoint(restart, p63.coreSetId,
  RestartGroup.CRITICAL, 0o4041);  // P63RST

// Radar -- IMPORTANT, priority 2
const radar = novac(exec, 2, 0o4006);
if (!('coreSetId' in radar)) throw new Error('failed');
exec = radar.state;
restart = registerRestartPoint(restart, radar.coreSetId,
  RestartGroup.IMPORTANT, 0o4042);  // RADRST

// Display -- DEFERRABLE, priority 5 (no restart point)
const display = novac(exec, 5, 0o4014);
if (!('coreSetId' in display)) throw new Error('failed');
exec = display.state;

// Background -- DEFERRABLE, priority 6 (no restart point)
const bkgnd = novac(exec, 6, 0o4023);
if (!('coreSetId' in bkgnd)) throw new Error('failed');
exec = bkgnd.state;

// Make all RUNNABLE
exec = {
  ...exec,
  coreSets: exec.coreSets.map((cs, i) =>
    [p63.coreSetId, radar.coreSetId, display.coreSetId, bkgnd.coreSetId].includes(i)
      ? { ...cs, state: JobState.RUNNABLE }
      : cs
  ),
};
```

### Step 3: Fill the Executive

```typescript
// Create 3 filler jobs at priorities 3, 4, 7 (no restart points)
const fillerAddrs = [0o4030, 0o4031, 0o4032];
const fillerPriorities = [3, 4, 7];
const fillerIds: number[] = [];

for (let i = 0; i < 3; i++) {
  const filler = novac(exec, fillerPriorities[i], fillerAddrs[i]);
  if (!('coreSetId' in filler)) throw new Error('failed to create filler');
  exec = filler.state;
  fillerIds.push(filler.coreSetId);
  exec = {
    ...exec,
    coreSets: exec.coreSets.map((cs, idx) =>
      idx === filler.coreSetId ? { ...cs, state: JobState.RUNNABLE } : cs
    ),
  };
}

// All 7 non-idle core sets are now occupied
console.log('Core sets filled:',
  exec.coreSets.filter(cs => cs.state !== JobState.FREE).length);
// Expected: 8 (7 jobs + 1 idle)
```

### Step 4: Trigger the 1202

```typescript
// This is the moment: attempt to create one more job
const overflow = novac(exec, 3, 0o4000);
console.log('alarm' in overflow ? `ALARM: ${overflow.alarm}` : 'No alarm');
// Expected: ALARM: 1202
//
// This is what happened on Apollo 11 at 102:38:22 GET.
// All core sets were full. The Executive had overflowed.
```

### Step 5: BAILOUT

```typescript
const result = bailout(restart, exec, waitlist, ALARM_1202);

console.log(`Preserved: ${result.preserved.length} core sets`);
console.log(`Discarded: ${result.discarded.length} core sets`);
// Expected: Preserved: 2 (P63 + Radar)
// Expected: Discarded: 5 (Display + Background + 3 fillers)
```

### Step 6: Verify Recovery

```typescript
// Attempt novac again -- should succeed (core sets freed by BAILOUT)
const recovery = novac(result.execState, 2, 0o4000);
console.log('alarm' in recovery ? `Alarm: ${recovery.alarm}` : 'Recovery: success');
// Expected: Recovery: success

// P63 guidance has restart address pointing to P63RST
const p63CS = result.execState.coreSets[p63.coreSetId];
console.log(`P63 restart address: ${p63CS.returnAddress.toString(8)}`);
// Expected: 4041 (P63RST)

// Display core set is FREE
const displayCS = result.execState.coreSets[display.coreSetId];
console.log(`Display state: ${displayCS.state}`);
// Expected: FREE
```

### Step 7: Reflect

You just reproduced the most famous software event in history.

The 1202 alarm fired because the rendezvous radar was stealing CPU time,
causing jobs to pile up until the Executive overflowed. But the AGC did not
crash. BAILOUT discarded the display updates and background tasks, preserving
guidance and navigation. Neil Armstrong never lost steering. Margaret
Hamilton's team designed for exactly this scenario.

| Exercise | Apollo 11 |
|----------|-----------|
| novac() returns 1202 | Program alarm at 102:38:22 GET |
| bailout() runs | AGC software restart |
| Display job discarded | DSKY goes blank momentarily |
| P63 guidance continues | Descent guidance continues |
| novac() succeeds | System recovers, ready for next cycle |

The DSKY went blank for a few seconds (the display job was shed), but
guidance never stopped. Houston called "Go." Armstrong landed manually with
25 seconds of fuel remaining.

**"Houston, Tranquility Base here. The Eagle has landed."**

## Expected Output

- 4 initial jobs + 3 fillers = 7 non-idle core sets (all occupied)
- novac() returns alarm 1202 (Executive overflow)
- BAILOUT preserves 2 core sets (P63 CRITICAL + Radar IMPORTANT)
- BAILOUT discards 5 core sets (Display, Background, 3 fillers)
- After BAILOUT: novac() succeeds (core sets freed)
- P63 has returnAddress = P63RST
- Display core set is FREE

## Troubleshooting

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| No 1202 alarm | Not all core sets filled | Need 7 non-idle jobs total |
| Radar discarded | Classified as DEFERRABLE | Register as IMPORTANT |
| Too many preserved | CRITICAL count >= 4 | Only 1 CRITICAL job |
| novac still fails after BAILOUT | Using old exec state | Use result.execState |
