---
chapter: 5
title: "Executive & Waitlist: The AGC Operating System"
slug: executive-waitlist
prerequisites:
  - assembly
learningObjectives:
  - "Understand priority-based cooperative scheduling"
  - "Know how the Waitlist handles timed tasks"
  - "Trace job creation, scheduling, and termination"
estimatedMinutes: 35
archiveRefs:
  - agc-soft-001
  - agc-soft-006
  - agc-soft-008
conceptRefs:
  - agc-concept-01
  - agc-concept-02
  - agc-concept-03
---

# Chapter 5: Executive & Waitlist -- The AGC Operating System

## Introduction

A computer that can only run one program at a time is useless on a spacecraft.
The AGC needed to simultaneously track navigation, compute guidance, manage
the DSKY display, process interrupts, and handle communication -- all with a
single CPU. The Executive and Waitlist are the AGC's answer: a real-time
operating system built from 2,000 words of code.

## The Executive: The AGC's Kernel

The Executive is the AGC's job scheduler. It manages computational tasks
through **8 core sets** numbered 0-7. Each core set stores the complete
context for one job: registers, bank settings, priority, state, and return
address.

### Core Sets

| Core Set | Purpose |
|----------|---------|
| 0 | Idle job (always exists, lowest priority) |
| 1-7 | Available for active jobs |

Core set 0 is special: it is always occupied by the idle job, which runs at
priority 7 (lowest). The idle job executes whenever no other work is available.
The remaining 7 core sets are available for real work.

In the simulator: `createExecutiveState()` initializes the Executive with
core set 0 running and core sets 1-7 free.

### Job States

Each core set is in one of five states:

```
         ┌──────────┐
         │   FREE   │ ← Core set available
         └────┬─────┘
    novac()   │
         ┌────▼─────┐
         │ DORMANT  │ ← Job created, not yet runnable
         └────┬─────┘
    makeRunnable()
         ┌────▼─────┐     jobSleep()    ┌──────────┐
         │ RUNNABLE │ ←────────────────→ │ SLEEPING │
         └────┬─────┘     jobWake()     └──────────┘
    scheduleNext()
         ┌────▼─────┐
         │ RUNNING  │ ← Actively executing on the CPU
         └────┬─────┘
    endofjob()
         ┌────▼─────┐
         │   FREE   │
         └──────────┘
```

### Priority Levels

The Executive uses priority-based scheduling with 8 levels:

| Priority | Use Case | Example |
|----------|----------|---------|
| 0 | Highest -- guidance | P63 descent guidance |
| 1 | Navigation | State vector integration |
| 2 | Critical control | Autopilot |
| 3-4 | Normal operations | Radar processing |
| 5-6 | Background | Telemetry, DSKY updates |
| 7 | Lowest -- idle | Idle loop |

**Lower number = higher priority.** Priority 0 always runs before priority 1.
This is the opposite of many modern schedulers (where higher number = higher
priority).

### Job Creation: NOVAC and FINDVAC

Two functions create new jobs:

**NOVAC** (No VAC area) creates a lightweight job:
```typescript
const result = novac(execState, priority, startAddress);
// Returns { state, coreSetId } on success
// Returns { state, alarm: 1202 } if all core sets are full
```

**FINDVAC** (Find VAC area) creates a job with a 44-word workspace:
```typescript
const result = findvac(execState, priority, startAddress);
// Returns { state, coreSetId } on success
// Returns { state, alarm: 1201 } if no VAC areas available
// Returns { state, alarm: 1202 } if no core sets available
```

NOVAC is used for simple jobs that need minimal state. FINDVAC is for complex
computations (like guidance) that need a VAC (Vector Accumulator) workspace
of 44 erasable words.

### Scheduling: scheduleNext

`scheduleNext()` selects the highest-priority RUNNABLE job:

1. Scan all core sets for RUNNABLE state
2. Select the one with the lowest priority number (highest importance)
3. Break ties by lowest core set number (deterministic)
4. Transition: selected -> RUNNING, previously RUNNING -> RUNNABLE

```typescript
const { state, coreSetId } = scheduleNext(execState);
// coreSetId is the winning job's core set
// Its state is now RUNNING
```

The AGC is **cooperatively** multitasked: a running job continues until it
voluntarily yields (via endofjob, sleep, or a Waitlist rescheduling). There
is no preemptive timer interrupt that forces context switches.

### The 1202 Alarm

When all 7 non-idle core sets are occupied and a new job is requested, NOVAC
returns alarm code **1202** -- Executive overflow. This is the alarm that fired
during Apollo 11's lunar descent. It means the AGC is overloaded: too many
tasks for the available resources.

```typescript
const result = novac(execState, 2, address);
if ('alarm' in result) {
  // alarm === 1202: no free core sets
  // This is when BAILOUT (Chapter 9) takes over
}
```

## The Waitlist: Timer-Driven Tasks

The Waitlist is the AGC's timer scheduler. It manages up to **9 entries**,
each a deferred task set to fire after a specified delay in centiseconds
(hundredths of a second).

### How the Waitlist Works

1. **Add entry**: specify a delay (in centiseconds) and a task address
2. **Time passes**: the Waitlist's clock advances with each T3RUPT (timer
   interrupt, every 10ms)
3. **Dispatch**: when an entry's delay expires, it fires and the task address
   is returned for execution
4. **One per T3RUPT**: at most one entry is dispatched per interrupt cycle

```typescript
// Add a task to fire in 100 centiseconds (1 second)
const wr = addWaitlistEntry(waitlistState, 100, taskAddress);

// Time passes...
waitlistState = advanceWaitlistTime(waitlistState, 100);

// Dispatch the expired entry
const { state, dispatched } = dispatchWaitlist(waitlistState);
if (dispatched) {
  // dispatched.taskAddress is ready to execute
}
```

### Waitlist vs Executive

| Property | Executive | Waitlist |
|----------|-----------|---------|
| Purpose | Priority scheduling | Time-delayed dispatch |
| Capacity | 8 core sets (1 idle) | 9 timer entries |
| Duration | Long-running jobs | Short tasks (<5ms) |
| Scheduling | Priority-based | Time-based |
| Overflow alarm | 1202 | 1203 |

Waitlist tasks are meant to be **short-lived** -- they execute quickly (under
5 milliseconds) and typically spawn Executive jobs for sustained work:

```
Waitlist fires -> short task runs -> novac() creates Executive job
```

This two-level architecture separates timing from computation. The Waitlist
handles "when," the Executive handles "what."

## How They Work Together

The typical AGC workflow:

1. **Interrupt arrives** (T3RUPT from the hardware timer)
2. **Waitlist dispatches** any expired entries
3. **Dispatched task** runs briefly, creates new Executive jobs via NOVAC
4. **Executive schedules** the highest-priority RUNNABLE job
5. **Selected job runs** on the CPU until it yields or completes
6. Repeat

This pattern appears throughout the AGC's flight software. Guidance
computations are triggered by Waitlist timers (firing every 2 seconds),
creating Executive jobs that run at priority 0 (highest).

## Worked Example

Let's trace job creation, scheduling, and termination:

```typescript
// Create the Executive
let exec = createExecutiveState();
// Core set 0 = idle (RUNNING, priority 7)

// Create two jobs
const j1 = novac(exec, 2, 0o4000);  // Priority 2
exec = j1.state;
const j2 = novac(exec, 5, 0o4100);  // Priority 5
exec = j2.state;

// Make them RUNNABLE (real AGC does this via Waitlist dispatch)
exec = makeRunnable(exec, j1.coreSetId);
exec = makeRunnable(exec, j2.coreSetId);

// Schedule: priority 2 wins (lower number = higher priority)
const sched = scheduleNext(exec);
// sched.coreSetId === j1.coreSetId (priority 2)

// Job 1 finishes
exec = endofjob(sched.state, j1.coreSetId);

// Schedule again: only job 2 remains
const sched2 = scheduleNext(exec);
// sched2.coreSetId === j2.coreSetId (priority 5)
```

## Key Takeaways

- The Executive manages 8 core sets (0=idle + 7 for jobs) with priority-based
  scheduling
- Priority 0 is highest (guidance); priority 7 is lowest (idle)
- NOVAC creates lightweight jobs; FINDVAC creates jobs with 44-word workspaces
- The 1202 alarm fires when all core sets are full (Executive overflow)
- The Waitlist is a 9-entry timer scheduler that dispatches tasks in
  centisecond resolution
- Waitlist tasks are short-lived and typically spawn Executive jobs
- Together, they form the AGC's real-time operating system

## Exercises Preview

The Executive and Waitlist are the foundation for:
- **Exercise 4: Blinker** -- use delay loops (conceptual Waitlist timing)
- **Exercise 5: Scheduler** -- create and schedule 3 Executive jobs
- **Exercise 6: Priority Preemption** -- observe priority-based scheduling

## Further Reading

- `agc-soft-001`: AGC Software Architecture Overview
- `agc-soft-006`: AGC Executive and Job Scheduling
- `agc-soft-008`: AGC Flight Software Systems
