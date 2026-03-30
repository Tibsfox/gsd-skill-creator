# DIY LED Circuit: Van Allen Belt Radiation Profile

## The Circuit

A standalone electronic circuit that displays Pioneer 1's radiation intensity profile using 10 LEDs in a vertical line. No microcontroller needed -- pure analog/digital logic with a 555 timer and CD4017 decade counter. Each LED represents a slice of altitude from Earth's surface to 113,854 km.

**What it does:**
- Press the launch button
- 10 LEDs light up sequentially over ~90 seconds (9 seconds per step)
- Colors represent radiation intensity at each altitude band:
  - LED 1 (green): Surface to 1,000 km -- low background
  - LED 2 (yellow): 1,000 to 3,000 km -- inner belt rising
  - LED 3 (red): 3,000 to 5,000 km -- inner belt PEAK
  - LED 4 (yellow): 5,000 to 7,000 km -- inner belt falling
  - LED 5 (dim green): 7,000 to 10,000 km -- SLOT REGION (quiet)
  - LED 6 (yellow): 10,000 to 16,000 km -- outer belt rising
  - LED 7 (red): 16,000 to 22,000 km -- outer belt PEAK
  - LED 8 (yellow): 22,000 to 40,000 km -- outer belt falling
  - LED 9 (green): 40,000 to 80,000 km -- cislunar space
  - LED 10 (off/blink): 80,000 to 113,854 km -- apogee + return begins
- At LED 10: all LEDs reverse-sequence back down (return trajectory)
- Then all LEDs fade to dark (reentry and burnup)

**Total cost: ~$13-15**

---

## Schematic

```
                    +9V
                     |
                     R1 (10K)
                     |
              +------+------+
              |             |
           LAUNCH         +---+
           BUTTON         | 555 |
              |           |     |
              +--[pin 2]  | CLK |---[pin 3]---> CD4017 pin 14 (CLK)
              |           +-----+
              |              |
             GND           +---+
                           |   |
                          R2  C1
                         100K  68uF
                           |   |
                           +---+
                             |
                            GND

CD4017 Decade Counter:
  pin 16 (VDD) --> +9V
  pin 8  (VSS) --> GND
  pin 13 (EN)  --> GND (always enabled)
  pin 15 (RST) --> tied to auto-reset circuit (see below)
  pin 14 (CLK) --> 555 output

  Outputs (each drives one LED through appropriate resistor):
  pin 3  (Q0) --> R4 (470R) --> LED1 (green)    [0-1,000 km]
  pin 2  (Q1) --> R5 (470R) --> LED2 (yellow)   [1,000-3,000 km]
  pin 4  (Q2) --> R6 (330R) --> LED3 (red)      [3,000-5,000 km — INNER PEAK]
  pin 7  (Q3) --> R7 (470R) --> LED4 (yellow)   [5,000-7,000 km]
  pin 10 (Q4) --> R8 (1K)   --> LED5 (green)    [7,000-10,000 km — SLOT (dim)]
  pin 1  (Q5) --> R9 (470R) --> LED6 (yellow)   [10,000-16,000 km]
  pin 5  (Q6) --> R10(330R) --> LED7 (red)      [16,000-22,000 km — OUTER PEAK]
  pin 6  (Q7) --> R11(470R) --> LED8 (yellow)   [22,000-40,000 km]
  pin 9  (Q8) --> R12(470R) --> LED9 (green)    [40,000-80,000 km]
  pin 11 (Q9) --> R13(1K)   --> LED10 (blue)    [80,000-113,854 km — APOGEE]
```

## LED Brightness Notes

The radiation profile is encoded in the LED brightness through resistor selection:

- **Inner belt peak (LED 3):** 330R resistor = brighter, simulating intense radiation
- **Outer belt peak (LED 7):** 330R resistor = bright, slightly less than inner belt
- **Slot region (LED 5):** 1K resistor = dim, simulating the quiet gap
- **Apogee (LED 10):** 1K resistor = dim, simulating deep space quiet
- **All others:** 470R = standard brightness

This is a static representation of the profile -- no analog dimming needed. The resistor values tell the story.

## 555 Timer Configuration

The 555 runs in **astable mode** to generate clock pulses:

```
Frequency = 1.44 / ((R1 + 2*R2) * C1)

For 9-second intervals (0.111 Hz):
  R1 = 10K
  R2 = 100K (use 47K + 50K trimpot for calibration)
  C1 = 68uF electrolytic

  f = 1.44 / ((10000 + 200000) * 0.000068) = 0.101 Hz ~ 9.9 seconds
  Adjust R2 trimpot to hit exactly 9.0 seconds per step

Total sequence: 10 steps x 9 seconds = 90 seconds (outbound)
```

## Return Trajectory (Second CD4017)

To show the return path, chain a second CD4017 in reverse:

```
Q9 of first CD4017 (apogee) --> clock input of second CD4017
Second CD4017 outputs wired to LEDs 9 through 1 (in reverse order)
via diodes (1N4148) OR'd with the first counter's outputs

When Q9 of counter 1 goes high:
  - Second 555 starts (same ~9s timing)
  - LEDs 9→8→7→6→5→4→3→2→1 light in reverse sequence
  - Each LED shows the same color/brightness as the outbound pass
  - At Q9 of counter 2 (return to surface): all LEDs flash 3x then off
```

This doubles the component count but accurately represents the symmetry of Pioneer 1's trajectory: climb, apogee, fall back.

**Simplified version (single counter):** Skip the second CD4017. After Q9 lights (apogee), the counter resets and the 10 LEDs run again, but mentally represent the return trip. Total cost stays under $15.

## Parts List (Single Counter Version)

| Part | Value | Qty | Cost |
|------|-------|-----|------|
| 555 Timer IC (NE555) | - | 1 | $0.25 |
| CD4017 Decade Counter | - | 1 | $0.60 |
| LED (green, 5mm) | - | 3 | $0.30 |
| LED (yellow, 5mm) | - | 4 | $0.40 |
| LED (red, 5mm) | - | 2 | $0.20 |
| LED (blue, 5mm) | - | 1 | $0.15 |
| Resistor 330R | 1/4W | 2 | $0.10 |
| Resistor 470R | 1/4W | 6 | $0.30 |
| Resistor 1K | 1/4W | 2 | $0.10 |
| Resistor 10K | 1/4W | 1 | $0.05 |
| Resistor 47K + 50K trimpot | 1/4W | 1 | $0.40 |
| Capacitor 68uF electrolytic | 16V | 1 | $0.15 |
| Capacitor 0.01uF ceramic (555 decoupling) | - | 1 | $0.05 |
| Pushbutton (momentary) | - | 1 | $0.25 |
| 9V battery snap | - | 1 | $0.20 |
| 9V battery | - | 1 | $3.00 |
| Breadboard (half-size) | - | 1 | $3.50 |
| Jumper wire kit | - | 1 | $2.50 |
| **Total** | | | **~$12.50** |

## Build Instructions

1. **Mount the LEDs vertically.** This is a radiation altitude profile -- the LEDs should be in a vertical line on the breadboard, LED 1 at the bottom (Earth's surface), LED 10 at the top (apogee). Use a ruler to space them evenly. The vertical arrangement IS the data visualization.

2. **Wire the 555 timer.** Connect it in astable mode with the values above. Verify the pulse interval with an LED -- each blink should be ~9 seconds apart. Use the trimpot to calibrate.

3. **Connect the CD4017.** Feed the 555 output to pin 14. The outputs should light LEDs one at a time, climbing from bottom to top.

4. **Observe the profile.** When the sequence runs:
   - Green (low) -- you're near Earth, the radiation is manageable
   - Yellow rising -- you're entering the inner belt
   - RED BRIGHT -- you're in the inner belt peak. This is where Explorer 1's instruments saturated
   - Yellow falling -- emerging from the inner belt
   - Green DIM -- the slot. Pioneer 1 was the first to detect this quiet zone
   - Yellow rising -- entering the outer belt
   - RED BRIGHT -- outer belt peak. Different character, broader
   - Yellow falling -- leaving the outer belt
   - Green -- cislunar space. Quiet. Almost safe.
   - Blue DIM -- apogee. 113,854 km. One-third of the way to the Moon. This is as far as Pioneer 1 got.

5. **Label it.** Print altitude markings on a strip of paper and mount it next to the LED column. The circuit becomes a wall-mounted data visualization of the radiation environment between Earth and Moon.

## What You Learn

- **555 timer astable operation** -- the same IC from Pioneer 0's circuit, now driving a different narrative
- **Decade counter as data visualizer** -- each output represents a data bin, the LED color/brightness encodes the measurement
- **Radiation belt structure** -- by the time you've calibrated and run this circuit 10 times, you will know the Van Allen belt altitude profile from memory. Inner belt, slot, outer belt. You will know it in your hands.
- **The slot region** -- Pioneer 1 discovered this. The dim LED in the middle of the sequence is the most important LED in the circuit. It represents the gap that let satellites survive in medium Earth orbit.
- **Resistor selection as encoding** -- different resistor values create different brightnesses without any analog dimming circuitry. The BOM IS the data.

## Fox Companies Connection

Second circuit in the NASA kit series. Pairs with the Pioneer 0 countdown timer from v1.1. Together they form a two-circuit educational package: first circuit teaches timing and counting (77-second countdown), second circuit teaches data visualization (radiation profile display). Workshop upgrade: mount both circuits on a single board with shared power supply. Print a poster showing Pioneer 0's failure and Pioneer 1's radiation data side by side. The failure taught them where to look. The data taught them what they found.
