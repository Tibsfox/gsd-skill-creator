---
chapter: 9
title: "Failsafe: When Things Go Wrong"
slug: failsafe
prerequisites:
  - executive-waitlist
learningObjectives:
  - "Understand BAILOUT restart protection and restart groups"
  - "Know the three restart groups (CRITICAL, IMPORTANT, DEFERRABLE)"
  - "Trace a BAILOUT through job preservation and discard"
estimatedMinutes: 30
archiveRefs:
  - agc-soft-006
  - agc-soft-007
  - agc-ops-003
conceptRefs:
  - agc-concept-03
  - agc-concept-04
---

# Chapter 9: Failsafe -- When Things Go Wrong

## Introduction

In safety-critical systems, "crash and reboot" is not an option. When the
AGC runs out of resources -- all core sets full, all Waitlist entries used,
too many jobs competing for too little CPU -- it cannot simply stop and
restart. Guidance must continue. Navigation must continue. The astronauts
must not die because a display update took too long.

The AGC's answer is **BAILOUT**: a controlled restart that preserves critical
work and discards everything else. It is the reason Apollo 11 landed safely.

## Restart Groups

Every Executive job belongs to one of three restart groups:

| Group | Priority | Policy | Examples |
|-------|----------|--------|----------|
| CRITICAL | 0 | Always preserved | Guidance (P63), navigation |
| IMPORTANT | 1 | Preserved if resources allow | Radar processing, autopilot |
| DEFERRABLE | 2 | Always discarded | DSKY display, telemetry, background |

Jobs register their restart group and a **restart address** -- the safe point
where execution can resume after a BAILOUT. Unregistered jobs default to
DEFERRABLE (always discarded).

```typescript
// Register guidance as CRITICAL with restart at P63RST address
restartState = registerRestartPoint(
  restartState,
  coreSetId,
  RestartGroup.CRITICAL,
  P63_RESTART_ADDRESS
);
```

The restart address is a known-safe point in the code -- a place where the
job can resume without corrupted state. For guidance, this is typically the
start of the guidance cycle (read sensors, recompute, command engine).

## The BAILOUT Algorithm

When alarm 1202 (Executive overflow) fires, BAILOUT executes this sequence:

### Step 1: Classify All Jobs

Scan core sets 1-7 (skip 0, the idle job). For each non-FREE core set:
- Look up its restart registration
- If registered: use the registered RestartGroup
- If unregistered: classify as DEFERRABLE

### Step 2: Always Preserve CRITICAL

Every CRITICAL job is marked for preservation. These are the jobs that the
spacecraft cannot function without -- guidance and navigation.

### Step 3: Conditionally Preserve IMPORTANT

Count the number of core sets used by CRITICAL jobs. If fewer than 4:
- Also preserve IMPORTANT jobs (there is room)
If 4 or more:
- Discard IMPORTANT jobs too (only CRITICAL survives)

The threshold of 4 is a design constant: if more than half the core sets are
CRITICAL, the system is in deep trouble and only the absolute essentials can
continue.

### Step 4: Discard Everything Else

For every discarded job:
- Free the core set (state -> FREE)
- Release the VAC area if one was allocated
- Remove the restart registration

### Step 5: Set Preserved Jobs to RUNNABLE

For every preserved job:
- Set state to RUNNABLE
- Set returnAddress to the restart address from the registration
- When the Executive next calls scheduleNext(), the job will resume from
  its restart point

### Step 6: Clear the Waitlist

All Waitlist entries are discarded. Timer-driven tasks must re-register
after restart. This ensures the Waitlist does not still reference jobs that
were just discarded.

### Step 7: Record the Alarm

Increment the bailoutCount and record the alarm code (1202, 1201, etc.) in
the restart state for diagnostic purposes.

```typescript
const result = bailout(restartState, execState, waitlistState, ALARM_1202);
// result.preserved = [1, 2]    -- CRITICAL + IMPORTANT core sets
// result.discarded = [3, 4, 5, 6, 7]  -- DEFERRABLE core sets freed
// result.waitlistState -- cleared
// result.restartState.bailoutCount -- incremented
```

## Alarm Codes

| Code | Name | Cause |
|------|------|-------|
| 1202 | Executive overflow | No free core sets (all 7 occupied) |
| 1201 | VAC overflow | No free VAC areas (all 5 occupied) |
| 1203 | Waitlist overflow | No free Waitlist entries (all 9 occupied) |

The 1202 alarm is the most famous -- it fired 5 times during Apollo 11's
lunar descent. Each time, BAILOUT ran, discarded display and background jobs,
and preserved guidance.

## What Happens After BAILOUT

After BAILOUT completes:

1. Discarded core sets are now FREE -- new jobs can be created
2. Preserved jobs are RUNNABLE at their restart addresses
3. The Waitlist is empty -- timer tasks must re-register
4. `scheduleNext()` picks the highest-priority preserved job
5. That job resumes from its restart address and continues working

The system is degraded but functional. Display updates may stop temporarily
(the DSKY goes blank), but guidance keeps running. The astronaut may see the
RESTART annunciator light up, but the spacecraft keeps flying.

## The Philosophy

BAILOUT embodies a design philosophy that is rare in software engineering:

> **Shed load gracefully. Preserve what matters most.**

Most software handles overload by either:
- Crashing entirely (unacceptable for safety-critical systems)
- Slowing down proportionally (unacceptable for real-time deadlines)

BAILOUT does neither. It makes a hard choice: the important stuff keeps
running, and everything else is sacrificed. Display updates are nice. Guidance
is essential. When you cannot have both, you keep guidance.

This is the same principle behind:
- **Kubernetes pod priority and preemption**: high-priority pods evict
  low-priority pods when nodes are full
- **Circuit breakers**: shed requests to protect core services
- **GSD context degradation**: shed scope when the context window fills
- **Airline oxygen masks**: secure your own mask before helping others

The AGC did it first, in 1966, with 70 pounds of hardware and 70 kilobytes
of software.

## Tracing a BAILOUT

Let's walk through a concrete example:

```
BEFORE BAILOUT:
  Core set 0: Idle (priority 7, RUNNING)
  Core set 1: P63 Guidance (priority 0, RUNNABLE, CRITICAL)
  Core set 2: Navigation (priority 1, RUNNABLE, CRITICAL)
  Core set 3: Radar (priority 3, RUNNABLE, IMPORTANT)
  Core set 4: Display (priority 5, RUNNABLE, DEFERRABLE)
  Core set 5: Telemetry (priority 6, RUNNABLE, unregistered -> DEFERRABLE)
  Core set 6: Background (priority 7, RUNNABLE, unregistered -> DEFERRABLE)
  Core set 7: Filler (priority 7, RUNNABLE, unregistered -> DEFERRABLE)

novac() called -> no free core sets -> alarm 1202

BAILOUT(1202):
  CRITICAL count: 2 (< 4, so IMPORTANT preserved too)
  Preserved: [1, 2, 3] (P63, Navigation, Radar)
  Discarded: [4, 5, 6, 7] (Display, Telemetry, Background, Filler)

AFTER BAILOUT:
  Core set 0: Idle (priority 7, RUNNING)
  Core set 1: P63 Guidance (RUNNABLE, returnAddress = P63_RESTART)
  Core set 2: Navigation (RUNNABLE, returnAddress = NAV_RESTART)
  Core set 3: Radar (RUNNABLE, returnAddress = RADAR_RESTART)
  Core set 4: FREE
  Core set 5: FREE
  Core set 6: FREE
  Core set 7: FREE

  -> 4 core sets freed, ready for new jobs
  -> Guidance continues from restart address
  -> DSKY goes blank (display job was discarded)
  -> System recovers in the next scheduling cycle
```

## Key Takeaways

- BAILOUT is the AGC's graceful degradation mechanism -- controlled restart
  under overload
- Three restart groups: CRITICAL (always preserved), IMPORTANT (if room),
  DEFERRABLE (always discarded)
- The threshold is 4: if fewer than 4 CRITICAL core sets, IMPORTANT is also
  preserved
- Unregistered jobs default to DEFERRABLE (safe default: always discarded)
- After BAILOUT: Waitlist cleared, discarded core sets freed, preserved jobs
  resume from restart addresses
- The philosophy: "shed load gracefully, preserve what matters most"
- Modern equivalents: Kubernetes pod eviction, circuit breakers, GSD context
  degradation

## Exercises Preview

Put BAILOUT to the test in:
- **Exercise 7: Restart Protection** -- register restart points and trigger
  BAILOUT
- **Exercise 8: Capstone 1202** -- reproduce the Apollo 11 alarm scenario

## Further Reading

- `agc-soft-006`: AGC Executive and Job Scheduling
- `agc-soft-007`: AGC Restart Protection and BAILOUT
- `agc-ops-003`: Apollo Program Alarm Documentation
