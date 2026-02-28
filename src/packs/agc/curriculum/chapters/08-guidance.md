---
chapter: 8
title: "Guidance: Navigating to the Moon"
slug: guidance
prerequisites:
  - interpreter
learningObjectives:
  - "Understand the guidance equation (acceleration = desired - actual)"
  - "Know the AGC programs that fly the lunar descent (P63, P64, P66)"
  - "Appreciate the real-time constraints of landing guidance"
estimatedMinutes: 30
archiveRefs:
  - agc-soft-008
  - agc-soft-009
  - agc-ops-001
conceptRefs:
  - agc-concept-12
  - agc-concept-13
---

# Chapter 8: Guidance -- Navigating to the Moon

## Introduction

The AGC's primary job was guidance -- computing the engine burns needed to fly
the spacecraft along its planned trajectory. During the lunar descent, the AGC
ran the guidance equation **10 times per second**, each time reading sensors,
computing corrections, and commanding the engine. This chapter explains how
that worked.

## The Fundamental Guidance Equation

At its core, guidance is a feedback loop:

```
acceleration_command = f(desired_trajectory, current_state)
```

The AGC continuously:
1. **Reads sensors** to determine current position and velocity
2. **Compares** current state to the desired trajectory
3. **Computes** the acceleration needed to correct any deviation
4. **Commands** the engine to produce that acceleration

This cycle runs at 10 Hz (every 100 milliseconds) during powered flight.
Between guidance cycles, the AGC integrates accelerometer data to maintain a
continuous estimate of position and velocity.

## Sensor Inputs

The AGC reads spacecraft sensors through I/O channels:

### Inertial Measurement Unit (IMU)

The IMU provides three-axis acceleration and attitude data. It contains:
- Three accelerometers (one per axis) measuring velocity changes
- Three gyroscopes (one per axis) measuring rotational changes
- CDU (Coupling Data Unit) angles on channels 30-32 (octal)

The AGC reads CDU angles to know the spacecraft's orientation. It reads
PIPA (Pulsed Integrating Pendulous Accelerometer) counters to measure
velocity changes from thrust.

### Landing Radar

During the final phase of lunar descent, the landing radar cross-checks
the AGC's computed altitude against direct radar measurements:

- Altitude: radar channel provides distance to lunar surface
- Velocity: Doppler shift provides descent rate

If radar altitude disagrees significantly with the computed altitude, the AGC
blends the two estimates. This is critical for safe landing.

## The Descent Programs

The lunar descent was managed by three AGC programs:

### P63: Braking Phase

P63 handles the initial braking from orbital velocity (~5,500 feet/second)
down to near zero. This is the longest phase, consuming most of the descent
fuel.

- **Priority**: 0 (highest -- nothing preempts guidance)
- **Duration**: approximately 8 minutes
- **Guidance rate**: 10 Hz (every 100ms)
- **Key computation**: optimal braking trajectory that minimizes fuel usage

P63 runs as an Executive job at priority 0, created by FINDVAC (needs the
VAC area for Interpreter double-precision calculations). The Waitlist fires
every 2 seconds to trigger the guidance recomputation cycle.

### P64: Approach Phase

P64 begins at about 7,000 feet altitude. The trajectory curves toward the
landing site, and the astronaut can see the surface through the window.

- **Redesignation**: the astronaut can move the landing point by clicking
  the hand controller. Each click shifts the target by a few hundred feet.
- **Throttle**: the engine throttles between 10% and 100% to follow the
  approach trajectory
- **Visibility**: the Lunar Module pitches up to give the commander a view
  of the landing site

### P66: Manual Phase

P66 gives the astronaut direct control of the descent rate. The AGC provides
rate-of-descent information on the DSKY while the astronaut controls
horizontal position with the hand controller.

During Apollo 11, Armstrong switched to P66 at about 400 feet altitude when
he saw the computer was targeting a boulder field. He flew manually to a
clear area and landed with 25 seconds of fuel remaining.

## Real-Time Constraints

Guidance has the hardest real-time constraints of any AGC task:

| Constraint | Value | Consequence |
|-----------|-------|-------------|
| Guidance cycle | 100 ms | Must complete before next sensor reading |
| Computation budget | ~200 ms per 2s cycle | Interpreter equations + native code |
| Priority | 0 (highest) | Cannot be preempted by any other job |
| 12-second rule | 12 seconds max | If guidance fails for 12s, abort mission |

The 12-second rule is the ultimate deadline: if the AGC loses guidance for
12 consecutive seconds during powered descent, an abort is mandatory. This
is why guidance runs at priority 0 -- nothing is allowed to prevent it from
running.

## Priority and the Executive

During descent, the Executive manages these jobs:

| Job | Priority | Type | What It Does |
|-----|----------|------|-------------|
| P63/P64/P66 guidance | 0 | FINDVAC | Compute trajectory corrections |
| Navigation | 1 | FINDVAC | Integrate state vectors |
| Autopilot | 2 | NOVAC | Send commands to RCS jets |
| Radar processing | 3 | NOVAC | Read and filter radar data |
| DSKY display | 5 | NOVAC | Update R1/R2/R3 displays |
| Telemetry | 6 | NOVAC | Format and send data to Houston |

When all jobs are RUNNABLE, the Executive schedules them in priority order:
guidance first, display last. If guidance takes longer than expected (because
of the rendezvous radar stealing cycles, as in Apollo 11), lower-priority
jobs get delayed -- and if core sets overflow, they get discarded by BAILOUT.

## Telemetry and Mission Control

The AGC does not just fly the spacecraft -- it also reports to Houston. Every
2 seconds, the AGC formats a telemetry frame containing:

- Current position and velocity (state vector)
- Guidance commands (desired vs. actual trajectory)
- System health (alarm codes, core set usage, timing margins)

This data flows through the downlink channels (channels 44-45) to the
spacecraft's S-band transmitter, then to the Deep Space Network on Earth,
then to the Real-Time Computer Complex (RTCC) at Mission Control, and
finally to the Flight Director's console.

The MC-1 dashboard in GSD-OS mirrors this pattern: structured telemetry
flowing from the Mission Engine through typed ICD channels to the Control
Surface for human oversight.

## The 10 Hz Guidance Loop

Here is the complete guidance cycle, annotated with timing:

```
T=0.000s  T3RUPT fires (Waitlist timer)
T=0.001s  Waitlist dispatches guidance task
T=0.002s  NOVAC creates P63 Interpreter job (priority 0)
T=0.003s  scheduleNext picks P63 (highest priority)
T=0.005s  Read IMU CDU angles (channels 30-32)
T=0.010s  Read PIPA accelerometer counters
T=0.020s  Interpreter: propagate state vector (DAD, DMP, DDV)
T=0.080s  Interpreter: compute guidance equation
T=0.120s  Interpreter: convert to steering commands
T=0.140s  Write engine commands to I/O channels
T=0.145s  ENDOFJOB -- return to Executive
T=0.150s  scheduleNext picks next-highest-priority job
```

The entire guidance computation fits in about 145 milliseconds -- well within
the 2-second cycle. The remaining time is available for navigation, display
updates, and other tasks.

## Key Takeaways

- Guidance is a feedback loop: read sensors, compare to desired trajectory,
  compute corrections, command the engine
- Three programs fly the descent: P63 (braking), P64 (approach), P66 (manual)
- Guidance runs at priority 0 -- the highest Executive priority, never
  preempted
- The 12-second rule: if guidance fails for 12 seconds, the mission aborts
- The IMU provides acceleration and attitude data; the landing radar provides
  altitude cross-checks
- Telemetry sends state vectors and system health to Mission Control every
  2 seconds
- The guidance cycle completes in approximately 145ms of a 2-second period

## Further Reading

- `agc-soft-008`: AGC Flight Software Systems
- `agc-soft-009`: Lunar Descent Guidance Equations
- `agc-ops-001`: Apollo 11 Mission Operations Documentation
