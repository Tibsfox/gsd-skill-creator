# Circuit: Analog Smoothing Filter — The Physical Overbar

## Mission 1.31 — Mariner 1 (Atlas-Agena B)

**Cost:** ~$12
**Difficulty:** Beginner
**Time:** 1-2 hours
**Purpose:** Demonstrate the smoothing function that was missing from Mariner 1's guidance code

---

## What This Circuit Does

This is an RC low-pass filter — the analog equivalent of the overbar (vinculum) that was omitted from Mariner 1's guidance equations. A noisy input signal passes through the filter, and the output is smooth. The filter IS the overbar — a physical circuit that does what the missing software was supposed to do.

When Mariner 1's guidance computer processed raw radar data without smoothing, it responded to noise as if it were real trajectory deviations. This circuit shows what the smoothing would have done: remove the noise, pass the real signal.

---

## Bill of Materials

| Component | Value | Cost | Notes |
|-----------|-------|------|-------|
| Resistor R1 | 10 kΩ | $0.10 | 1/4W, 5% |
| Capacitor C1 | 100 nF | $0.10 | Ceramic disc |
| Resistor R2 | 47 kΩ | $0.10 | Second stage |
| Capacitor C2 | 47 nF | $0.10 | Second stage |
| 555 Timer IC | NE555 | $0.50 | Noise generator |
| Resistor R3 | 100 kΩ | $0.10 | 555 timing |
| Capacitor C3 | 10 nF | $0.10 | 555 timing |
| LED (red) | 3mm | $0.10 | Raw signal indicator |
| LED (green) | 3mm | $0.10 | Filtered signal indicator |
| Resistors | 330Ω x2 | $0.10 | LED current limiting |
| Breadboard | half-size | $3.00 | |
| 9V battery + clip | | $3.00 | |
| Jumper wires | assorted | $2.00 | |
| **Total** | | **~$10** | |

---

## Schematic

```
9V Battery
    |
    +--[R3 100kΩ]--+--[C3 10nF]--GND     (555 Timer oscillator)
    |               |
    |          NE555 Timer
    |          Pin 3 (Output) = noisy square wave
    |               |
    |    RAW OUTPUT ●--[330Ω]--LED(red)--GND
    |               |
    |          [R1 10kΩ]
    |               |
    |          +----+----[C1 100nF]--GND    (First RC stage)
    |          |
    |     [R2 47kΩ]
    |          |
    |     +----+----[C2 47nF]---GND         (Second RC stage)
    |          |
    |  FILTERED ●--[330Ω]--LED(green)--GND
    |
   GND
```

---

## How It Works

**The 555 generates a noisy signal** — a square wave with timing jitter from component tolerances, simulating the noisy radar data that Mariner 1's guidance computer received.

**The RC filter smooths it** — each RC stage attenuates high-frequency components. The two-stage filter provides a -40 dB/decade rolloff. The cutoff frequency is:

```
f_c = 1 / (2 * π * R * C)

Stage 1: f_c = 1 / (2π * 10kΩ * 100nF) = 159 Hz
Stage 2: f_c = 1 / (2π * 47kΩ * 47nF) = 72 Hz
```

**The LEDs show the difference:**
- **Red LED (raw):** Flickers erratically — this is what Mariner 1's guidance saw
- **Green LED (filtered):** Glows steadily — this is what the guidance SHOULD have seen

---

## The Lesson

The red LED is Mariner 1. The green LED is Mariner 2 (with corrected software). The difference between them is the RC filter — a few cents of resistor and capacitor that represent the overbar omitted from the guidance equations.

The most expensive hyphen in history could have been prevented by the mathematical equivalent of a 10¢ resistor and a 10¢ capacitor. The smoothing function is simple. Its absence is catastrophic.

---

## Extension: Add a Switch

Add a SPDT switch between the 555 output and the LEDs:
- Position A: signal goes directly to both LEDs (unfiltered = Mariner 1)
- Position B: signal goes through the filter first (filtered = Mariner 2)

Toggle the switch and watch the red LED's behavior change. This is the "overbar switch" — the physical representation of the missing symbol.
