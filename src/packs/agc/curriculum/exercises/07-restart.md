---
exercise: 7
title: "Restart Protection"
slug: restart
chapter: 9
difficulty: advanced
programSlug: restart
description: "Register restart points, trigger BAILOUT, and observe job preservation"
---

# Exercise 7: Restart Protection -- Restart

## Overview

This exercise demonstrates BAILOUT restart protection. You will create three
jobs at different restart groups (CRITICAL, IMPORTANT, DEFERRABLE), fill
the Executive to trigger a 1202 alarm, and call BAILOUT. You will observe
which jobs are preserved and which are discarded.

## Prerequisites

- Chapter 9: Failsafe (BAILOUT algorithm, restart groups, alarm codes)
- Exercise 5: Scheduler (creating Executive jobs)

## The Program

Open `programs/restart.agc`:

```agc
# Restart -- BAILOUT restart protection demonstration
SETLOC   4000

# Critical job: guidance (always preserved)
CRIT     CA     CRITID
         EXTEND
         WRITE  10
         TC     CRIT

# Important job: navigation (preserved if room)
IMPRT    CA     IMPID
         EXTEND
         WRITE  11
         TC     IMPRT

# Deferrable job: display (always discarded)
DEFER    CA     DEFID
         EXTEND
         WRITE  12
         TC     DEFER

CRITID   OCT    00100        # Critical marker
IMPID    OCT    00200        # Important marker
DEFID    OCT    00300        # Deferrable marker

# Restart addresses
CRITRST  TC     CRIT         # Critical restart: resume guidance
IMPRST   TC     IMPRT        # Important restart: resume navigation
```

## Step-by-Step Walkthrough

### Step 1: Assemble and find addresses

```typescript
import { assembleProgramSource } from './curriculum/index.js';
import {
  createExecutiveState, novac, JobState, ALARM_1202,
} from '../index.js';
import {
  RestartGroup, createRestartState, registerRestartPoint, bailout,
} from '../index.js';
import { createWaitlistState } from '../index.js';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/agc/curriculum/programs/restart.agc', 'utf-8');
const program = assembleProgramSource(source);

// Address map:
// CRIT:    0o4000
// IMPRT:   0o4004
// DEFER:   0o4010
// CRITRST: 0o4017 (approximate - count the words)
// IMPRST:  0o4020
```

### Step 2: Create 3 jobs

```typescript
let exec = createExecutiveState();
let restart = createRestartState();

// Critical: guidance at priority 0
const crit = novac(exec, 0, 0o4000);
if (!('coreSetId' in crit)) throw new Error('failed');
exec = crit.state;

// Important: navigation at priority 2
const imprt = novac(exec, 2, 0o4004);
if (!('coreSetId' in imprt)) throw new Error('failed');
exec = imprt.state;

// Deferrable: display at priority 5
const defer = novac(exec, 5, 0o4010);
if (!('coreSetId' in defer)) throw new Error('failed');
exec = defer.state;
```

### Step 3: Register restart points

```typescript
// CRITICAL: always preserved, restarts at CRITRST
restart = registerRestartPoint(restart, crit.coreSetId,
  RestartGroup.CRITICAL, 0o4017);

// IMPORTANT: preserved if room, restarts at IMPRST
restart = registerRestartPoint(restart, imprt.coreSetId,
  RestartGroup.IMPORTANT, 0o4020);

// DEFERRABLE: no restart registration needed (unregistered = DEFERRABLE)
```

### Step 4: Fill the remaining core sets

```typescript
// Make the 3 jobs RUNNABLE
exec = {
  ...exec,
  coreSets: exec.coreSets.map((cs, i) =>
    [crit.coreSetId, imprt.coreSetId, defer.coreSetId].includes(i)
      ? { ...cs, state: JobState.RUNNABLE }
      : cs
  ),
};

// Fill core sets 4-7 with dummy jobs
for (let i = 0; i < 4; i++) {
  const dummy = novac(exec, 7, 0o4010);
  if (!('coreSetId' in dummy)) throw new Error('failed to create dummy');
  exec = dummy.state;
  exec = {
    ...exec,
    coreSets: exec.coreSets.map((cs, idx) =>
      idx === dummy.coreSetId ? { ...cs, state: JobState.RUNNABLE } : cs
    ),
  };
}
```

### Step 5: Trigger the 1202

```typescript
// All 7 core sets are now occupied. Try to create one more.
const overflow = novac(exec, 3, 0o4000);
console.log('alarm' in overflow ? `Alarm: ${overflow.alarm}` : 'No alarm');
// Expected: Alarm: 1202
```

### Step 6: BAILOUT

```typescript
const result = bailout(restart, exec, createWaitlistState(), ALARM_1202);

console.log(`Preserved: ${result.preserved}`);
// Expected: [crit.coreSetId, imprt.coreSetId] (CRITICAL + IMPORTANT)

console.log(`Discarded: ${result.discarded}`);
// Expected: [defer.coreSetId, ...dummy core sets] (DEFERRABLE + unregistered)
```

### Step 7: Verify preserved jobs

```typescript
// CRITICAL job has restart address set
const critCS = result.execState.coreSets[crit.coreSetId];
console.log(`Critical restart address: ${critCS.returnAddress.toString(8)}`);
// Expected: 4017 (CRITRST)

// Deferrable job is FREE
const deferCS = result.execState.coreSets[defer.coreSetId];
console.log(`Deferrable state: ${deferCS.state}`);
// Expected: FREE
```

## Expected Output

- novac returns alarm 1202 when all core sets are full
- BAILOUT preserves CRITICAL (1 job) and IMPORTANT (1 job) -- 2 CRITICAL < 4
- BAILOUT discards DEFERRABLE and all unregistered dummy jobs
- Preserved jobs have returnAddress set to their restart addresses
- Discarded core sets are FREE

## Try It

1. **Register 5 CRITICAL jobs**: fill past the threshold of 4 CRITICAL core
   sets and observe that IMPORTANT jobs are also discarded

2. **Double BAILOUT**: after the first BAILOUT, create new jobs, fill core
   sets again, and trigger a second 1202. Check `bailoutCount` is 2.

3. **Check the Waitlist**: add Waitlist entries before BAILOUT and verify
   they are all cleared after.

## Troubleshooting

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| No alarm on novac | Not all core sets filled | Need 7 non-idle jobs |
| IMPORTANT discarded | Too many CRITICAL jobs (>= 4) | Register fewer as CRITICAL |
| Wrong restart address | RegisterRestartPoint target wrong | Check address calculation |
