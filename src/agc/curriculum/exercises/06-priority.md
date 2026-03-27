---
exercise: 6
title: "Priority Preemption"
slug: priority
chapter: 5
difficulty: advanced
programSlug: priority
description: "Demonstrate high-priority guidance preempting low-priority display"
---

# Exercise 6: Priority Preemption -- Priority

## Overview

This exercise demonstrates cooperative multitasking and priority-based
preemption. A high-priority "guidance" job and a low-priority "display" job
compete for the CPU. You will observe that guidance always runs when both are
RUNNABLE, and display only runs when guidance sleeps.

## Prerequisites

- Chapter 5: Executive & Waitlist (priority scheduling, jobSleep, jobWake)
- Exercise 5: Scheduler (creating and scheduling multiple jobs)

## The Program

Open `programs/priority.agc`:

```agc
# Priority -- high-priority guidance preempts low-priority display
SETLOC   4000

# Guidance job (priority 0 -- highest)
GUIDE    CA     GCOUNT       # Load guidance iteration counter
         AD     ONE          # Increment
         TS     GCOUNT
         EXTEND
         WRITE  10           # Report iteration on channel 10
         TC     GUIDE        # Continue (cooperative -- no yield)

# Display job (priority 6 -- low)
DISPLY   CA     DCOUNT       # Load display counter
         AD     ONE
         TS     DCOUNT
         EXTEND
         WRITE  11           # Report on channel 11 (different channel)
         TC     DISPLY

ONE      DEC    1
GCOUNT   ERASE
DCOUNT   ERASE
```

## Step-by-Step Walkthrough

### Step 1: Create two jobs

```typescript
import {
  createExecutiveState, novac, scheduleNext, jobSleep, jobWake, JobState
} from '../index.js';

let exec = createExecutiveState();

// Guidance at priority 0 (highest), entry at GUIDE (0o4000)
const guide = novac(exec, 0, 0o4000);
if (!('coreSetId' in guide)) throw new Error('failed');
exec = guide.state;

// Display at priority 6 (low), entry at DISPLY (0o4007)
const display = novac(exec, 6, 0o4007);
if (!('coreSetId' in display)) throw new Error('failed');
exec = display.state;
```

### Step 2: Make both RUNNABLE and schedule

```typescript
exec = {
  ...exec,
  coreSets: exec.coreSets.map((cs, i) =>
    [guide.coreSetId, display.coreSetId].includes(i)
      ? { ...cs, state: JobState.RUNNABLE }
      : cs
  ),
};

const sched1 = scheduleNext(exec);
console.log(`Running: core set ${sched1.coreSetId}`);
// Expected: guide.coreSetId (priority 0 beats priority 6)
```

### Step 3: Sleep guidance, observe display runs

```typescript
exec = jobSleep(sched1.state, guide.coreSetId);
const sched2 = scheduleNext(exec);
console.log(`Running after sleep: core set ${sched2.coreSetId}`);
// Expected: display.coreSetId (only RUNNABLE job)
```

### Step 4: Wake guidance, observe it preempts

```typescript
exec = jobWake(sched2.state, guide.coreSetId);
const sched3 = scheduleNext(exec);
console.log(`Running after wake: core set ${sched3.coreSetId}`);
// Expected: guide.coreSetId (priority 0 wins again)
```

### Step 5: Verify I/O channels

When guidance runs, channel 10 gets writes (GCOUNT increments).
When display runs, channel 11 gets writes (DCOUNT increments).
By observing which channels have writes, you can verify which job ran.

## Expected Output

- scheduleNext always picks guidance (priority 0) when both are RUNNABLE
- Only when guidance is SLEEPING does display (priority 6) get scheduled
- Waking guidance immediately preempts display on next scheduleNext call
- Channel 10 writes = guidance iterations
- Channel 11 writes = display iterations

## Try It

1. **Add a third job**: create a "background" job at priority 7. It should
   only run when both guidance and display are sleeping.

2. **Use the Executive Monitor**: if Phase 218 is available, use
   `captureSnapshot()` to visualize core set allocation at each step.

3. **Dynamic priority change**: use `changePriority()` to promote display
   from priority 6 to priority 0. Now both jobs have equal priority --
   ties are broken by core set number (lower wins).

## Troubleshooting

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| Display runs first | Priority values reversed | Priority 0 = highest |
| Sleep has no effect | jobSleep on wrong core set | Use guide.coreSetId |
| Both jobs seem to run | scheduleNext not called between steps | Call schedule between each job |
