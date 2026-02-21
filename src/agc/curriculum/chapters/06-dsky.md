---
chapter: 6
title: "DSKY: The Astronaut's Interface"
slug: dsky
prerequisites:
  - executive-waitlist
learningObjectives:
  - "Understand the DSKY display and keyboard layout"
  - "Know the VERB/NOUN command grammar"
  - "Write programs that display data on the DSKY"
estimatedMinutes: 25
archiveRefs:
  - agc-arch-003
  - agc-iface-001
  - agc-iface-002
conceptRefs:
  - agc-concept-05
  - agc-concept-06
---

# Chapter 6: DSKY -- The Astronaut's Interface

## Introduction

The DSKY (Display/Keyboard, pronounced "DIS-key") was the astronaut's only
interface to the AGC. No monitor, no mouse, no touchscreen -- just a numeric
keyboard, a few function keys, and electroluminescent digit displays that
could show six numbers plus status indicators. Every command to the AGC and
every piece of data from it passed through this single device.

Despite its constraints, the DSKY was remarkably effective. Its VERB/NOUN
grammar allowed astronauts to issue hundreds of different commands using just
a two-digit vocabulary.

## Physical Layout

The DSKY face has three sections:

### Status Annunciators (Top)

11 status lights arranged in two columns:

| Left Column | Right Column |
|-------------|--------------|
| UPLINK ACTY | TEMP |
| NO ATT | GIMBAL LOCK |
| STBY | PROG |
| KEY REL | RESTART |
| OPR ERR | TRACKER |
| | VEL |
| | ALT |

Plus one indicator light at the top center:

- **COMP ACTY** (Computer Activity) -- blinks when the AGC is computing.
  This is the light that goes out during a 1202 alarm (display job was shed).

### Numeric Displays (Middle)

Three data registers plus mode indicators:

```
  ┌─────────────────────────┐
  │  PROG   VERB   NOUN    │  ← 2-digit displays (program, verb, noun)
  ├─────────────────────────┤
  │  ±XXXXX  R1             │  ← 5-digit signed display
  │  ±XXXXX  R2             │  ← 5-digit signed display
  │  ±XXXXX  R3             │  ← 5-digit signed display
  └─────────────────────────┘
```

- **PROG**: current program number (P00-P99)
- **VERB**: current verb (V00-V99)
- **NOUN**: current noun (N00-N99)
- **R1, R2, R3**: three 5-digit signed data registers (plus/minus and 5 digits)

Each digit is displayed using electroluminescent (EL) segments, encoded as
5-bit values in the relay words sent via I/O channels.

### Keyboard (Bottom)

19 keys arranged in a grid:

```
  ┌─────┬─────┬─────┬─────┬─────┐
  │VERB │NOUN │  +  │  -  │  0  │
  ├─────┼─────┼─────┼─────┼─────┤
  │  7  │  8  │  9  │ CLR │ENTER│
  ├─────┼─────┼─────┼─────┼─────┤
  │  4  │  5  │  6  │ PRO │K REL│
  ├─────┼─────┼─────┼─────┼─────┤
  │  1  │  2  │  3  │RSET │     │
  └─────┴─────┴─────┴─────┴─────┘
```

Numeric keys (0-9), sign keys (+, -), and function keys:
- **VERB**: start entering a verb number
- **NOUN**: start entering a noun number
- **ENTER**: execute the current verb/noun command
- **CLR**: clear the current input
- **PRO**: proceed (acknowledge a flashing display)
- **KEY REL**: release keyboard to the program
- **RSET**: reset error indicators

## The VERB/NOUN Command Grammar

The DSKY uses a two-part command grammar:

- **VERB** specifies the action (display, monitor, load, execute)
- **NOUN** specifies the data (position, velocity, time, angles)

Example commands:

| Verb | Noun | Meaning |
|------|------|---------|
| V06 N43 | Display decimal | Latitude/longitude/altitude |
| V16 N43 | Monitor decimal | Continuously update lat/long/alt |
| V21 N01 | Load component 1 | Enter a value into R1 |
| V37 N00 | Change program | Enter a new program number |

To display the current time on the DSKY:
1. Press **VERB**, then **0**, then **6** (V06 = display decimal)
2. Press **NOUN**, then **3**, then **6** (N36 = mission elapsed time)
3. Press **ENTER**

R1, R2, R3 then show hours, minutes, and centiseconds.

In the simulator: `processKeyPress()` feeds keys through the VERB/NOUN state
machine. The state machine in `createDskyCommanderState()` has 11 input modes
that track the complete input sequence.

## I/O Channels

The DSKY communicates with the CPU via I/O channels:

| Channel | Direction | Purpose |
|---------|-----------|---------|
| 10 (octal) | CPU -> DSKY | Relay word 1: R1 display digits |
| 11 (octal) | CPU -> DSKY | Relay word 2: R2/R3 display, annunciators |
| 13 (octal) | CPU -> DSKY | Display enable/disable |
| 15 (octal) | DSKY -> CPU | Keyboard input (key codes) |

### Writing to the DSKY

To display data, programs write encoded digit values to channels 10 and 11.
Each write sends a **relay word** -- a 15-bit value where groups of 5 bits
encode individual digits using the EL segment encoding.

```agc
         CA     DISPVAL      # Load display value
         EXTEND
         WRITE  10           # Send to channel 10 (R1 display)
```

The `processChannel10()` function in the simulator decodes relay words into
visible digits. The encoding maps 5-bit values to the digit segments:

| Code | Digit | Segments |
|------|-------|----------|
| 0 | (blank) | none |
| 21 | 0 | all segments |
| 3 | 1 | right segments |
| 25 | 2 | top-right-mid-bot-left |
| 27 | 3 | top-right-mid-bot-right |
| ... | ... | ... |

### Reading the Keyboard

When an astronaut presses a key, the DSKY generates a **KEYRUPT1** interrupt.
The key code is placed on channel 15. The interrupt service routine reads
channel 15 to get the 5-bit key code:

```agc
         EXTEND
         READ   15           # Read channel 15 into A
         # A now contains the key code (5-bit value)
```

The PRO key is special: it does not trigger KEYRUPT1. Instead, it sets bit 14
of channel 32, which is monitored by the Executive directly.

## Writing a Number to the DSKY

Here is a complete program that displays a number on R1:

```agc
SETLOC   4000

         CA     PATTERN      # Load the relay word pattern
         EXTEND
         WRITE  10           # Write to channel 10 (R1)
DONE     TC     DONE         # Halt

PATTERN  OCT    12345        # Encoded digit pattern for R1
```

The value written to channel 10 is a relay word containing encoded digits.
The DSKY hardware decodes this into visible segments. In the simulator,
`processChannel10()` translates the relay word into a `DisplayRegister5`
showing 5 decoded digits.

## The COMP ACTY Pattern

The COMP ACTY (Computer Activity) annunciator blinks when the AGC is busy.
It is controlled by bit 14 of channel 11:

```agc
# Turn COMP ACTY on
         CA     COMPON       # Load bit pattern with bit 14 set
         EXTEND
         WRITE  11           # Write to channel 11
# ...later...
# Turn COMP ACTY off
         CA     COMPOFF      # Load bit pattern with bit 14 clear
         EXTEND
         WRITE  11

COMPON   OCT    40000        # Bit 14 set
COMPOFF  OCT    00000        # All bits clear
```

This is exactly what the Blinker exercise (Exercise 4) does: toggle COMP ACTY
on and off with a delay loop between each write.

## Key Takeaways

- The DSKY has a numeric keyboard (0-9, +, -), function keys (VERB, NOUN,
  ENTER, CLR, PRO, KEY REL, RSET), three 5-digit signed displays (R1, R2,
  R3), and 11 status annunciators
- The VERB/NOUN grammar lets astronauts issue hundreds of commands using
  two-digit codes
- Channel 10 controls R1 display, channel 11 controls R2/R3 and annunciators,
  channel 15 reads keyboard input
- Display data is encoded as relay words with 5-bit EL segment codes
- KEYRUPT1 interrupt fires on key press; PRO key uses channel 32 bit 14
- COMP ACTY annunciator (channel 11 bit 14) indicates computer activity

## Exercises Preview

Apply your DSKY knowledge in:
- **Exercise 1: Hello DSKY** -- write your first display pattern
- **Exercise 2: Countdown** -- display decreasing numbers on R1
- **Exercise 4: Blinker** -- toggle COMP ACTY on and off

## Further Reading

- `agc-arch-003`: DSKY Hardware Specification
- `agc-iface-001`: DSKY Display Interface Documentation
- `agc-iface-002`: DSKY Keyboard Interface Documentation
