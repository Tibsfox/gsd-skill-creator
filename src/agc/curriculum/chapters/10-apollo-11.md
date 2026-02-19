---
chapter: 10
title: "Apollo 11: The 1202 Alarm Story"
slug: apollo-11
prerequisites:
  - failsafe
learningObjectives:
  - "Reconstruct the Apollo 11 1202 alarm sequence minute by minute"
  - "Understand the root cause (rendezvous radar stealing cycles)"
  - "Appreciate why the software design saved the mission"
estimatedMinutes: 35
archiveRefs:
  - agc-ops-001
  - agc-ops-002
  - agc-ops-003
  - agc-soft-007
conceptRefs:
  - agc-concept-01
  - agc-concept-03
  - agc-concept-04
---

# Chapter 10: Apollo 11 -- The 1202 Alarm Story

## Introduction

July 20, 1969. 4:06 PM Eastern Daylight Time. The Lunar Module Eagle is
33,500 feet above the surface of the Moon, descending at 100 feet per second.
Commander Neil Armstrong and Lunar Module Pilot Buzz Aldrin are 12 minutes
from landing. And then the computer starts throwing alarms.

This is the story of the most famous software event in history.

## The Setup

Eagle had separated from the Command Module Columbia and begun powered
descent at 102:33:05 GET (Ground Elapsed Time). P63 braking guidance was
running on the AGC, computing trajectory corrections 10 times per second.
Everything was nominal.

There was one procedural detail that would matter: the rendezvous radar was
set to **AUTO** mode. This radar, used for tracking Columbia after ascent,
was supposed to be off during landing. A checklist ambiguity left it on.

## The Root Cause

The rendezvous radar in AUTO mode generates interrupts. These **RUPT**
interrupts fire periodically as the radar tracks Columbia's transponder
signal. Each interrupt requires the CPU to:

1. Save the current context (Z, BB registers)
2. Jump to the interrupt vector
3. Execute the interrupt service routine
4. Restore context and resume the interrupted program

This costs approximately 15% of the available CPU time. Normally the AGC
budgets 85% for Executive jobs and 15% for interrupts. With the radar
running, the interrupt overhead doubles to ~30%, leaving only 70% for
Executive jobs.

## The Timeline

| GET | Event |
|-----|-------|
| 102:33:05 | P63 braking guidance starts. AGC running normally. |
| 102:38:22 | **1202 ALARM**. DSKY flashes "PROG 1202". Eagle is at 33,500 ft. |
| 102:38:26 | Houston (Steve Bales, GUIDO): "We got you... we're Go on that alarm." |
| 102:38:59 | 1202 clears. Guidance continues. DSKY updates resume. |
| 102:39:02 | **1202 ALARM** again. |
| 102:39:13 | Houston: "Roger, we got you. We're Go on that alarm." |
| 102:41:32 | **1201 ALARM** (VAC overflow). |
| 102:42:17 | **1202 ALARM** again. Eagle at 2,000 ft. |
| 102:42:19 | Houston: "Roger, 1202. We copy it." |
| 102:42:42 | **1202 ALARM** fifth and final time. |
| 102:42:58 | Armstrong takes manual control (P66). |
| 102:45:40 | **"Houston, Tranquility Base here. The Eagle has landed."** |

Five 1202 alarms and one 1201 alarm. Each time, the AGC's BAILOUT fired,
discarded low-priority jobs, preserved guidance, and recovered.

## What Happened Inside the AGC

Let's trace the first 1202 alarm at 102:38:22:

### The Cascade

1. P63 guidance is running at priority 0 (core set 1)
2. Navigation is running at priority 1 (core set 2)
3. Radar interrupt processing creates jobs for radar data (core sets 3-4)
4. DSKY display update is running at priority 5 (core set 5)
5. Telemetry formatting at priority 6 (core set 6)
6. Background housekeeping at priority 7 (core set 7)

The radar interrupts are stealing 15% of CPU time. Executive jobs take longer
to complete because they keep getting interrupted. Jobs pile up because they
are not finishing fast enough for new ones to be created.

All 7 non-idle core sets are now occupied.

### The Overflow

A Waitlist-triggered task tries to create a new job via NOVAC. But there are
no free core sets. NOVAC returns alarm code 1202.

### The Recovery

BAILOUT fires:

```
BAILOUT(1202):
  Classify jobs:
    Core set 1: P63 Guidance -> CRITICAL (registered)
    Core set 2: Navigation -> CRITICAL (registered)
    Core set 3: Radar processing -> IMPORTANT (registered)
    Core set 4: Radar buffer -> unregistered -> DEFERRABLE
    Core set 5: DSKY display -> unregistered -> DEFERRABLE
    Core set 6: Telemetry -> unregistered -> DEFERRABLE
    Core set 7: Housekeeping -> unregistered -> DEFERRABLE

  CRITICAL count: 2 (< 4, so IMPORTANT also preserved)

  Preserved: [1, 2, 3] (Guidance, Navigation, Radar)
  Discarded: [4, 5, 6, 7]

  Waitlist cleared.
  Preserved jobs set to RUNNABLE at restart addresses.
```

### The Effect

- **Guidance continues.** P63 resumes from its restart address. The engine
  keeps firing. The descent trajectory is maintained.
- **DSKY goes blank momentarily.** The display update job was discarded. For
  a few seconds, the astronauts see stale or blank data on the DSKY.
- **RESTART annunciator lights up.** The astronauts know the AGC restarted.
- **Telemetry pauses briefly.** Houston loses a few seconds of data.

Within 4 seconds, the Executive creates new display and telemetry jobs to
replace the discarded ones, and the DSKY updates resume. The astronauts see
fresh data again.

Then the radar steals more cycles, jobs pile up again, and the 1202 fires
a second time. And a third. And a fourth. And a fifth.

Each time, BAILOUT runs the same algorithm: discard the expendable, preserve
the essential, recover, continue.

## The Human Factor

At Mission Control, Steve Bales was the GUIDO (Guidance Officer). When the
1202 alarm appeared on his console, he had seconds to make a call: Go or
No Go?

Bales had studied the alarm codes. He knew that 1202 meant Executive
overflow -- the software was restarting, not failing. He knew that BAILOUT
preserved guidance. He knew the AGC would recover.

He called: **"Go."**

If he had called "No Go," the mission would have aborted. Eagle would have
fired the ascent engine and returned to orbit. There would have been no
Moon landing.

Bales' confidence came from understanding the software design. Margaret
Hamilton's team had tested overload conditions. They had specifically designed
BAILOUT for this scenario. The "nice-to-have" restart protection feature
saved the mission.

## Why It Worked

The Apollo 11 1202 alarm validates several design principles:

### 1. Priority-Based Scheduling

Guidance at priority 0 means it always runs first. Even when the radar is
stealing CPU cycles, guidance gets its time. Lower-priority jobs are the
ones that suffer.

### 2. Graceful Degradation

BAILOUT does not crash. It does not reboot. It selectively discards work,
preserving the most important tasks. The system continues at reduced
capability rather than failing entirely.

### 3. Restart Registration

CRITICAL and IMPORTANT jobs register restart addresses -- safe points where
they can resume without corrupted state. This is not accidental; it requires
deliberate design. Every CRITICAL job must identify its restart point.

### 4. Conservative Defaults

Unregistered jobs are treated as DEFERRABLE. This means any new job that
the programmer forgot to register will be safely discarded during BAILOUT
rather than accidentally preserved. The safe default is to discard.

### 5. Testing Failure Modes

Hamilton's team tested overload conditions during development. They knew
what would happen because they had deliberately triggered 1202 alarms in
simulation. The real flight was not the first time BAILOUT ran.

## The Comparison Table

| Exercise (Capstone) | Apollo 11 |
|---------------------|-----------|
| novac() returns 1202 | Program alarm at 102:38:22 GET |
| bailout() runs | AGC software restart |
| Display job discarded | DSKY goes blank momentarily |
| P63 guidance continues | Descent guidance continues |
| novac() succeeds after bailout | System recovers, ready for next cycle |
| Alarm fires again | 1202 fires 5 total times during descent |
| Armstrong lands (in exercise: program halts) | Eagle lands at Tranquility Base |

## Lessons for Modern Systems

1. **Graceful degradation is not optional in critical systems.** If your
   system can overload, decide now what gets discarded.

2. **Priority-based load shedding works.** The AGC proved it in 1969.
   Kubernetes, circuit breakers, and rate limiters all use the same pattern.

3. **Test your failure modes.** Hamilton's team simulated overload before
   Apollo 11 flew. If they hadn't, Bales could not have called "Go."

4. **The safe default is to discard.** Unregistered jobs are DEFERRABLE.
   Unknown traffic gets dropped. Unclassified work gets shed. Always err
   on the side of preserving the critical path.

5. **Design for recovery, not just prevention.** You cannot prevent every
   failure. You can design for recovery from every failure.

## Key Takeaways

- The rendezvous radar in AUTO mode stole 15% of CPU time, causing jobs to
  pile up and overflow the Executive
- The 1202 alarm fired 5 times during Apollo 11's descent; each time BAILOUT
  discarded display/telemetry jobs and preserved guidance
- GUIDO Steve Bales called "Go" because he understood the software design
- The DSKY went blank momentarily but guidance never stopped
- Design principles validated: priority scheduling, graceful degradation,
  restart registration, conservative defaults, failure mode testing
- Armstrong landed manually in P66 with 25 seconds of fuel remaining

## Exercises Preview

The capstone exercise recreates this exact scenario:
- **Exercise 8: Reproducing the 1202 Alarm** -- create the overload, trigger
  BAILOUT, verify guidance survives

## Further Reading

- `agc-ops-001`: Apollo 11 Mission Operations Documentation
- `agc-ops-002`: Apollo 11 Post-Flight Analysis
- `agc-ops-003`: Apollo Program Alarm Documentation
- `agc-soft-007`: AGC Restart Protection and BAILOUT
