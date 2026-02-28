---
chapter: 1
title: "Orientation: Meet the AGC"
slug: orientation
prerequisites: []
learningObjectives:
  - "Understand the AGC's role in Apollo missions"
  - "Know the key specifications (word size, memory, speed)"
  - "Map AGC concepts to modern computing equivalents"
estimatedMinutes: 15
archiveRefs:
  - agc-arch-001
  - agc-arch-002
conceptRefs:
  - agc-concept-01
  - agc-concept-05
---

# Chapter 1: Orientation -- Meet the AGC

## Introduction

Why study a computer from 1966? Because the Apollo Guidance Computer (AGC)
solved problems that are still hard today: real-time scheduling under resource
constraints, graceful degradation under overload, and reliable operation in
environments where failure means death. Modern systems handle billions of
operations per second, but the AGC did it with 74 kilobytes and a clock that
would make a wristwatch yawn.

This chapter introduces the AGC -- what it was, what it did, and why its
design principles still matter 60 years later.

## A Brief History

The AGC was designed by the MIT Instrumentation Laboratory (now Draper
Laboratory) beginning in 1961. It was the first computer to use integrated
circuits -- over 5,000 three-input NOR gates wired into logic modules. Every
other computer of its era used discrete transistors or vacuum tubes.

The lead software engineer was Margaret Hamilton, who coined the term "software
engineering" while working on the AGC. Her team of about 350 people wrote the
flight software that guided Apollo spacecraft to the Moon and back. The
software techniques they pioneered -- priority scheduling, restart protection,
and error recovery -- were decades ahead of their time.

The AGC flew on every Apollo mission from Apollo 7 (1968) through Apollo 17
(1972). Two AGCs were on each mission: one in the Command Module and one in the
Lunar Module. The same hardware, running different software for different
mission phases.

## Key Specifications

| Specification | AGC Value | Modern Equivalent |
|---------------|-----------|-------------------|
| Word size | 15 bits (data), 16 bits (accumulator) | 64 bits |
| Clock speed | 2.048 MHz | ~4,000 MHz |
| Memory cycle time | 11.72 microseconds (1 MCT) | ~0.3 nanoseconds |
| Erasable memory (RAM) | 2,048 words (3.8 KB) | 16+ GB |
| Fixed memory (ROM) | 36,864 words (69 KB) | 1+ TB SSD |
| Instructions | 15 basic + 18 extracode = 33 | Hundreds |
| Weight | 70 pounds (31.7 kg) | Ounces |
| Power consumption | 55 watts | Variable |
| Instructions per second | ~85,000 | Billions |

The AGC's 15-bit word size means each data value holds 5 decimal digits of
precision. That is barely enough for navigation -- which is why the Interpreter
(Chapter 7) was invented to provide double-precision arithmetic.

## The AGC's Role

The AGC was the **only** computer on the spacecraft. It was responsible for:

- **Navigation**: knowing where the spacecraft was at all times by integrating
  accelerometer data from the Inertial Measurement Unit (IMU)
- **Guidance**: computing the engine burns needed to follow the planned
  trajectory
- **Control**: sending commands to the reaction control thrusters and main
  engine
- **Display**: showing mission data to the astronauts via the DSKY
  (Display/Keyboard unit)
- **Communication**: formatting and transmitting telemetry data to Mission
  Control in Houston

All of these tasks ran simultaneously. The AGC's Executive operating system
(Chapter 5) scheduled them by priority, ensuring that guidance -- the most
critical task -- always got CPU time even when the system was overloaded.

## Comparison to Modern Systems

| Aspect | AGC | Arduino Uno | Modern Laptop |
|--------|-----|-------------|---------------|
| RAM | 3.8 KB | 2 KB | 16 GB |
| ROM | 69 KB | 32 KB | 512 GB SSD |
| Clock | 2 MHz | 16 MHz | 4 GHz |
| Word size | 15 bits | 8 bits | 64 bits |
| Weight | 70 lbs | 25 g | 4 lbs |
| Power | 55 W | 0.2 W | 65 W |
| Tasks | 7 concurrent jobs | 1 (no OS) | Thousands |

The AGC's resources are comparable to an Arduino, but it ran a real-time
operating system with priority-based multitasking. An Arduino runs a single
loop. The AGC's software sophistication far exceeded its hardware capabilities
-- a pattern that defines great systems engineering.

## What Makes the AGC Remarkable

Three things set the AGC apart from every other computer of its era:

1. **First integrated circuit computer.** The AGC proved that ICs could be
   reliable enough for safety-critical applications. This confidence helped
   launch the entire semiconductor industry.

2. **First real-time operating system for a safety-critical application.** The
   Executive scheduler, Waitlist timer, and BAILOUT restart protection form a
   complete RTOS that influenced every real-time system since.

3. **Software that saved Apollo 11.** During the lunar landing, the AGC's
   1202 program alarm triggered BAILOUT, which shed low-priority tasks and
   preserved guidance. Without this software design, the mission would have
   been aborted. (Chapter 10 tells the full story.)

## The AGC Simulator

In this curriculum, you will work with a software simulator of the AGC. The
simulator implements the complete Block II AGC architecture:

- The CPU with all 33 instructions (`stepAgc()` in our simulator)
- Bank-switched memory (`readMemory()`, `writeMemory()`, `loadFixed()`)
- The Executive scheduler (`novac()`, `scheduleNext()`, `endofjob()`)
- The Waitlist timer (`addWaitlistEntry()`, `dispatchWaitlist()`)
- BAILOUT restart protection (`registerRestartPoint()`, `bailout()`)
- The DSKY display and keyboard (`processChannel10()`, `pressKey()`)
- I/O channels connecting the CPU to spacecraft peripherals

You will write AGC assembly programs, assemble them with the curriculum
assembler, and run them on the simulator. The exercises build from simple
"Hello DSKY" programs to a capstone that reproduces the Apollo 11 1202 alarm.

## Key Takeaways

- The AGC was the only computer on Apollo spacecraft, responsible for
  navigation, guidance, control, display, and communication
- With 15-bit words, 3.8 KB RAM, and 69 KB ROM, it ran a priority-based
  real-time operating system managing 7 concurrent jobs
- Margaret Hamilton's software engineering team pioneered techniques (priority
  scheduling, restart protection, graceful degradation) that are standard today
- The AGC proved that integrated circuits could be trusted in safety-critical
  systems, helping launch the semiconductor industry
- The simulator in this curriculum implements the complete Block II AGC,
  allowing hands-on experimentation with the same architecture that flew to
  the Moon

## Exercises Preview

After completing the next few chapters, you will be ready for:
- **Exercise 1: Hello DSKY** -- write your first AGC program
- **Exercise 2: Countdown** -- use CCS for counting and display

## Further Reading

- `agc-arch-001`: AGC Block II Architecture Overview
- `agc-arch-002`: AGC Hardware Design Documentation
