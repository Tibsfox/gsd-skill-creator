---
exercise: 5
title: "Executive Job Scheduling"
slug: scheduler
chapter: 5
difficulty: intermediate
programSlug: scheduler
description: "Create 3 Executive jobs at different priorities and observe scheduling order"
---

# Exercise 5: Executive Job Scheduling -- Scheduler

## Overview

This exercise demonstrates the Executive's priority-based job scheduling.
You will load a program with three job bodies into the simulator, then use
the TypeScript Executive API to create jobs at different priorities and
observe that the scheduler always picks the highest-priority (lowest number)
job first.

## Prerequisites

- Chapter 5: Executive & Waitlist (NOVAC, scheduleNext, priorities)
- Exercise 1-3: Basic AGC assembly and I/O

## The Program

Open `programs/scheduler.agc`. This program provides three job bodies that
identify themselves by writing to channel 10:

```agc
# Scheduler -- job body that identifies itself via I/O
# Three instances run at priorities 2, 4, 6
# The Executive schedules them in priority order
SETLOC   4000

JOB1     CA     ID1          # Job 1 identifies itself
         EXTEND
         WRITE  10           # Write to channel 10
         TC     JOB1         # Loop (job runs until preempted)

JOB2     CA     ID2          # Job 2
         EXTEND
         WRITE  10
         TC     JOB2

JOB3     CA     ID3          # Job 3
         EXTEND
         WRITE  10
         TC     JOB3

ID1      OCT    00001        # Job 1 marker
ID2      OCT    00002        # Job 2 marker
ID3      OCT    00003        # Job 3 marker
```

## Step-by-Step Walkthrough

### Step 1: Assemble the program

```typescript
import { assembleProgramSource, runProgram } from './curriculum/index.js';
import {
  createExecutiveState, novac, scheduleNext, JobState
} from '../index.js';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/agc/curriculum/programs/scheduler.agc', 'utf-8');
const program = assembleProgramSource(source);
```

### Step 2: Find the job entry addresses

The assembler places code at SETLOC 4000. Count the words to find each
label's address:

| Label | Address | How |
|-------|---------|-----|
| JOB1 | 0o4000 | First instruction |
| JOB2 | 0o4004 | After JOB1's 4 words (CA, EXTEND, WRITE, TC) |
| JOB3 | 0o4010 | After JOB2's 4 words |

Note: EXTEND + WRITE is 2 words (EXTEND is a separate instruction word).

### Step 3: Create Executive jobs

```typescript
let exec = createExecutiveState();

// Create 3 jobs at different priorities
const j1 = novac(exec, 2, 0o4000);  // Priority 2, entry at JOB1
if (!('coreSetId' in j1)) throw new Error('failed');
exec = j1.state;

const j2 = novac(exec, 4, 0o4004);  // Priority 4, entry at JOB2
if (!('coreSetId' in j2)) throw new Error('failed');
exec = j2.state;

const j3 = novac(exec, 6, 0o4010);  // Priority 6, entry at JOB3
if (!('coreSetId' in j3)) throw new Error('failed');
exec = j3.state;
```

### Step 4: Make jobs RUNNABLE and schedule

```typescript
// Transition DORMANT -> RUNNABLE
exec = {
  ...exec,
  coreSets: exec.coreSets.map((cs, i) =>
    [j1.coreSetId, j2.coreSetId, j3.coreSetId].includes(i)
      ? { ...cs, state: JobState.RUNNABLE }
      : cs
  ),
};

// Schedule: priority 2 should win (lowest number = highest priority)
const sched = scheduleNext(exec);
console.log(`First scheduled: core set ${sched.coreSetId}`);
// Expected: j1.coreSetId (priority 2 wins)
```

### Step 5: Run the winning job

Load the program and run it for a few steps starting at the winning job's
address. Check the I/O log for the job's identifier.

## Expected Output

- scheduleNext picks the priority 2 job (JOB1) first
- JOB1 writes OCT 00001 to channel 10
- If JOB1 sleeps and scheduleNext runs again, JOB2 (priority 4) runs next
- JOB2 writes OCT 00002 to channel 10

## Try It

1. **Add a 4th job at priority 1**: observe it preempts all others
   ```typescript
   const j4 = novac(exec, 1, someAddress);
   ```

2. **Change priorities dynamically**: use `changePriority()` to move JOB3
   from priority 6 to priority 1 and observe it gets scheduled next

3. **Observe the idle job**: if all jobs are SLEEPING, scheduleNext returns
   core set 0 (the idle job at priority 7)

## Troubleshooting

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| novac returns alarm | All core sets full | Check CORE_SET_COUNT |
| Wrong job scheduled | Jobs still DORMANT | Make RUNNABLE before scheduling |
| No I/O in log | Job not actually running | Load program + step the CPU |
