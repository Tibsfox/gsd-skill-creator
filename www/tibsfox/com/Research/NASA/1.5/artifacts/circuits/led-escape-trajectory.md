# DIY LED Circuit: Escape Trajectory — LEDs That Don't Come Back

## The Circuit

A standalone electronic circuit showing Pioneer 4's trajectory as an ascending sequence of 10 LEDs that reaches the top and STAYS ON. Unlike the Pioneer 1-3 circuits (v1.1-v1.4) where the LEDs scanned upward and then reversed (falling back to Earth), this circuit latches. When the sequence reaches the top LED, a latching mechanism holds it there permanently — escape velocity achieved, no falling back. The contrast with previous circuits is the point: for the first time, the light reaches the top and does not return.

**What it does:**
- Press the launch button
- LEDs light up sequentially from bottom (Earth) to top (deep space), one every ~2 seconds
- GREEN LEDs for positions 1-7 (atmosphere, inner belt, slot, outer belt)
- AMBER LED at position 8 (approaching escape threshold)
- WHITE LEDs at positions 9-10 (escape velocity achieved, heliocentric orbit)
- When the sequence reaches LED 10 (top): a latching transistor circuit holds LEDs 9-10 ON permanently
- The bottom LEDs go dark (the stages have been spent), but the top stays lit — the spacecraft has escaped
- Previous Pioneer circuits: the sequence reversed. This one does not. That is the lesson.

**The lesson:** Escape velocity means the object never comes back. Pioneer 4 achieved this threshold on March 3, 1959, after four previous missions fell short. The latching top LED is the physical representation of an orbit with positive specific energy — a hyperbola, not an ellipse. The LED stays on because Pioneer 4 is still out there.

**Total cost: ~$14**

---

## Schematic

```
                    +9V
                     |
        +------------+-------------+
        |                          |
     555 TIMER                  CD4017
     (clock gen)               DECADE COUNTER
        |                          |
     pin 3 (out) -----> pin 14 (CLK)
        |                          |
       GND                        |
          +---------+---------+---------+---------+
          |    |    |    |    |    |    |    |    |    |
         Q0   Q1   Q2   Q3   Q4   Q5   Q6   Q7   Q8   Q9
          |    |    |    |    |    |    |    |    |    |
         R1   R2   R3   R4   R5   R6   R7   R8   R9   R10
          |    |    |    |    |    |    |    |    |    |
         G1   G2   G3   G4   G5   G6   G7   A8   W9  W10
          |    |    |    |    |    |    |    |    |    |
         GND  GND  GND  GND  GND  GND  GND  GND  |    |
                                                   +----+
                                                   |
                                              LATCH CIRCUIT
                                              (see below)
                                                   |
                                                  GND

VERTICAL LAYOUT (physical board):
  W10  (WHITE) — position 10: HELIOCENTRIC ORBIT (latches ON)
  W9   (WHITE) — position 9:  ESCAPE VELOCITY (latches ON)
  A8   (AMBER) — position 8:  Escape threshold (~11,186 m/s)
  G7   (GREEN) — position 7:  Outer belt exit
  G6   (GREEN) — position 6:  Outer belt (~16,000 km)
  G5   (GREEN) — position 5:  Slot region
  G4   (GREEN) — position 4:  Inner belt (~4,000 km)
  G3   (GREEN) — position 3:  Inner belt entry
  G2   (GREEN) — position 2:  Low orbit
  G1   (GREEN) — position 1:  Launch (surface)
```

## Latching Circuit Detail

The key innovation over previous Pioneer circuits is the latch. When CD4017 output Q8 (or Q9) goes high, it triggers a latching transistor pair that holds LEDs W9 and W10 on independently of the counter.

```
Q8 or Q9 (CD4017) ----+---- 10K ----+---- Base of Q1 (2N3904)
                       |             |
                       |             +---- 100K ---+
                       |                           |
                    (trigger)                      |
                                            Collector Q1 ---+--- 470R --- W9 LED --- GND
                                                |           |
                                            10K |           +--- 470R --- W10 LED --- GND
                                                |
                                            Base Q2 (2N3904)
                                                |
                                            Emitter --- GND
                                                |
                                            Collector --- 100K --- Base Q1
                                            (positive feedback = LATCH)

Once Q1 turns on, it drives Q2, which feeds back to keep Q1 on.
The latch holds W9 and W10 permanently lit, even after the CD4017 moves past Q9.
To reset: press the RESET button (connected to CD4017 pin 15 and latch reset).
```

## The Latch vs. The Return

In previous Pioneer circuits (v1.1 through v1.4), the CD4017 was wired to either:
- Reverse direction after reaching the top (Pioneer 1, 3: fell back from altitude)
- Stop at a low position (Pioneer 2: third stage failure at 1,550 km)
- Show dual peaks with reversal (Pioneer 3's v1.4: dual belt scan, then return)

Pioneer 4's circuit is fundamentally different: the CD4017 still counts through all 10 outputs sequentially, but when it reaches the escape threshold (Q8/Q9), the latch engages and the top LEDs stay lit permanently. The counter continues and wraps around (the stages are spent, the lower LEDs go dark), but the escape LEDs persist.

This is the physical meaning of positive specific orbital energy: the trajectory is hyperbolic, and the spacecraft never returns to the starting point.

## Brightness Encoding via Resistor Values

The altitude-velocity profile is encoded in the LED current-limiting resistors:

```
TRAJECTORY (bottom to top):
  G1:  680R   → medium   (launch, rapid acceleration)
  G2:  470R   → bright   (first stage burn, maximum thrust)
  G3:  560R   → med-bright (entering inner belt)
  G4:  680R   → medium   (inner belt transit)
  G5:  1K     → dim      (slot region — quiet zone)
  G6:  680R   → medium   (outer belt transit)
  G7:  1K     → dim      (outer belt exit, thinning)
  A8:  330R   → BRIGHT   (approaching escape — the critical threshold)
  W9:  220R   → VERY BRIGHT (ESCAPE VELOCITY — latched ON)
  W10: 220R   → VERY BRIGHT (HELIOCENTRIC ORBIT — latched ON)

LED colors:
  G1-G7:  Green (5mm, 20mA, 2.1V forward voltage)
  A8:     Amber (5mm, 20mA, 2.0V forward voltage)
  W9-W10: White (5mm, 20mA, 3.0V forward voltage)
```

## Clock Timing

The 555 timer runs in astable mode with a ~2 second period:

```
555 ASTABLE:
  R_A = 33K
  R_B = 68K
  C   = 10uF

  t_high = 0.693 * (R_A + R_B) * C = 0.70s
  t_low  = 0.693 * R_B * C         = 0.47s
  Period = t_high + t_low           = 1.17s

Full sequence (10 steps): ~12 seconds from launch to escape
  Positions 1-7: ~8 seconds (atmosphere through outer belt)
  Position 8:    ~1.2 seconds (escape threshold — momentary)
  Positions 9-10: LATCHED (permanent — the spacecraft has escaped)
```

## Bill of Materials

| Qty | Component | Value/Type | Purpose | Cost |
|-----|-----------|------------|---------|------|
| 1 | NE555 | Timer IC | Clock generator | $0.30 |
| 1 | CD4017 | Decade counter | Sequential output driver | $0.40 |
| 7 | LED, green | 5mm, diffused | Trajectory positions 1-7 | $0.70 |
| 1 | LED, amber | 5mm, diffused | Escape threshold (position 8) | $0.15 |
| 2 | LED, white | 5mm, diffused | Escape + heliocentric (9-10) | $0.30 |
| 2 | 2N3904 | NPN transistor | Latch circuit | $0.20 |
| 1 | 33K resistor | 1/4W | 555 R_A | $0.02 |
| 1 | 68K resistor | 1/4W | 555 R_B | $0.02 |
| 1 | 10uF capacitor | Electrolytic | 555 timing | $0.05 |
| 1 | 100nF capacitor | Ceramic | 555 decoupling | $0.03 |
| 2 | 220R resistor | 1/4W | White LED current limit | $0.04 |
| 1 | 330R resistor | 1/4W | Amber LED current limit | $0.02 |
| 2 | 470R resistor | 1/4W | Green LED current limit (bright) | $0.04 |
| 2 | 560R resistor | 1/4W | Green LED current limit (med-bright) | $0.04 |
| 3 | 680R resistor | 1/4W | Green LED current limit (medium) | $0.06 |
| 2 | 1K resistor | 1/4W | Green LED current limit (dim) | $0.04 |
| 2 | 10K resistor | 1/4W | Latch biasing | $0.04 |
| 1 | 100K resistor | 1/4W | Latch feedback | $0.02 |
| 1 | Push button | Momentary NO | Launch button | $0.30 |
| 1 | Push button | Momentary NO | Reset button | $0.30 |
| 1 | 9V battery clip | Standard | Power | $0.50 |
| 1 | Breadboard | Half-size | Assembly | $3.00 |
| 1 | Wire kit | 22 AWG solid | Connections | $2.00 |
| | | | **Total** | **~$8.57** |

*(Add a 9V battery: ~$4-5. Total with battery: ~$13-14)*

## Build Notes

1. **Start with the 555 timer.** Verify it blinks an LED at ~1.2 second intervals before connecting the CD4017.

2. **Wire the CD4017 sequentially.** Connect Q0-Q9 to the 10 LEDs through their respective resistors. Verify the chase sequence works from bottom to top.

3. **Add the latch circuit.** Connect Q8 (or Q9) to the base of Q1 through 10K. Wire the Q1-Q2 positive feedback loop. Verify that when the counter reaches Q8, the white LEDs latch on and stay on even as the counter continues.

4. **Test the contrast.** Run the full sequence: LEDs should chase from G1 up to A8, then W9 and W10 latch on permanently. The green LEDs continue their sequence and go dark as the counter wraps. Only the white escape LEDs remain lit.

5. **The reset button** should clear both the CD4017 (pin 15) and break the latch (disconnect the feedback path momentarily). This represents "starting a new mission."

6. **Compare with previous circuits.** If you built the v1.1-v1.4 LED circuits, place them side by side. Run all sequences simultaneously. Pioneers 0-3 reverse or stop. Pioneer 4 latches at the top. Five circuits. Five missions. One escape.

## The Engineering Lesson

The latch is a one-bit memory. It stores exactly one piece of information: "escape velocity has been achieved." Once set, it cannot be cleared by the ongoing sequence — only by an explicit reset. This is precisely the physics: once a spacecraft's specific orbital energy is positive, no passive process returns it to a bound orbit. The latch is a transistor implementation of the mathematical boundary between elliptical (e < 1) and hyperbolic (e > 1) trajectories.

The previous Pioneer circuits all had negative total energy — they were bound, and their LED sequences reflected that by returning to the starting position. Pioneer 4's circuit has positive total energy. The latch makes this physically visible: the light reaches the top and stays there. The spacecraft is still orbiting the Sun. The LED should still be on.
