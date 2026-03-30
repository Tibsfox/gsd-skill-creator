# DIY LED Circuit: Three-Stage Rocket Ignition Sequence

## The Circuit

A standalone electronic circuit that demonstrates a three-stage rocket ignition sequence using cascaded 555 timers. Three groups of LEDs light in sequence: stage 1 (green), stage 2 (yellow), stage 3 (red). But stage 3 NEVER LIGHTS — a deliberately disconnected jumper wire teaches that Pioneer 2's third stage ABL X-248 solid motor failed to ignite.

**What it does:**
- Press the launch button
- Stage 1 LEDs (3 green) light for ~4 seconds — Thor DM-18 main engine burn
- Stage 1 goes dark, Stage 2 LEDs (3 yellow) light for ~4 seconds — AJ10-40 engine burn
- Stage 2 goes dark, Stage 3 LEDs (3 red) should light — but they DON'T
- A visible gap in the jumper wire between the stage 2 timer output and the stage 3 trigger shows exactly why: the ignition signal never reached the motor
- After 6 seconds of darkness (the coast phase), all LEDs flash once briefly (reentry) then go dark

**The lesson:** The jumper wire gap IS the story. Pioneer 2's squib firing circuit had a break somewhere — a connector loosened, a wire cracked — and the signal never reached the solid motor. This circuit makes that invisible failure visible.

**Total cost: ~$13-15**

---

## Schematic

```
                      +9V
                       |
        +--------------+------------------+------------------+
        |              |                  |                  |
      R_bias         STAGE 1            STAGE 2            STAGE 3
      (10K)          TIMER              TIMER              TIMER
        |            (555 #1)           (555 #2)           (555 #3)
        |              |                  |                  |
     LAUNCH            |                  |                  |
     BUTTON            |                  |                  |
        |              |                  |                  |
       GND             |                  |                  |
                       |                  |                  |
                       v                  v                  v
                    3x GREEN           3x YELLOW          3x RED
                    LEDs               LEDs               LEDs
                    (stage 1)          (stage 2)          (stage 3)
                                                         *** DEAD ***


Cascade logic:
  LAUNCH BUTTON triggers 555 #1 (monostable, 4 seconds)
  555 #1 output (pin 3) HIGH → Stage 1 LEDs ON
  555 #1 output falling edge → triggers 555 #2 (monostable, 4 seconds)
  555 #2 output (pin 3) HIGH → Stage 2 LEDs ON
  555 #2 output falling edge → SHOULD trigger 555 #3
  BUT: the wire between 555 #2 output and 555 #3 trigger is CUT

  *** THE GAP — Pioneer 2's ignition failure made visible ***

  Stage 3 timer never receives its trigger pulse.
  Stage 3 LEDs never light.
  The rocket coasts on momentum and falls back.
```

## Detailed Schematic: 555 Timer #1 (Stage 1)

```
        +9V
         |
         +--[R1a 100K]--+--[R1b 33K]--+
         |               |             |
         |              C1a           pin 7 (discharge)
         |              47uF           |
         |               |            pin 6 (threshold)---+
         |              GND            |                   |
         |                            pin 2 (trigger) <--- trigger from button
         |                             |
         +-------- pin 8 (VCC)    555 #1
         |                             |
         |          pin 4 (reset)------+-- +9V
         |                             |
         |          pin 1 (GND) ------GND
         |                             |
         |          pin 3 (output)-----+---> to Stage 1 LEDs
         |                             |
         |                             +---> falling edge to 555 #2 trigger
         |
         +-- C_bypass (0.01uF) -- GND   (pin 5 to GND via 0.01uF)

Monostable period:
  T = 1.1 * (R1a + R1b) * C1a
  T = 1.1 * (100K + 33K) * 47uF
  T = 1.1 * 133000 * 0.000047 = 6.87 seconds

  Adjust: Use 33K + 50K trimpot for R1b to calibrate to ~4 seconds.
  Target: T = 1.1 * (100K + 22K) * 47uF = 6.3s
  (Or reduce C1a to 33uF: T = 1.1 * 133K * 33uF = 4.8s)

  Simplified: R1 = 82K, C1 = 47uF → T = 1.1 * 82K * 47uF = 4.2s
```

## 555 Timers #2 and #3

Timers #2 and #3 are identical to #1 in configuration. Each is wired in monostable mode with the same RC values for ~4 second pulses.

```
Trigger chain:
  Button press → 555 #1 trigger (pin 2, pulled low)
  555 #1 pin 3 falling edge → differentiated via 0.01uF cap → 555 #2 pin 2
  555 #2 pin 3 falling edge → differentiated via 0.01uF cap → 555 #3 pin 2

  *** BUT: the wire between the differentiator cap and 555 #3 pin 2
      is PHYSICALLY CUT — a gap in the jumper wire on the breadboard ***

Differentiator circuit (between each stage):
  555 output --[0.01uF]--+--[10K]--+9V
                          |
                          +--> next 555 trigger (pin 2)

  The capacitor passes only the edge of the signal.
  The 10K pull-up keeps pin 2 HIGH (inactive) between triggers.
  When the previous 555 output goes LOW, the cap pulls pin 2
  briefly LOW, triggering the next monostable pulse.
```

## LED Groups

```
Stage 1 (green — Thor DM-18):
  555 #1 pin 3 --+-- R4 (220R) -- LED1 (green) -- GND
                  +-- R5 (220R) -- LED2 (green) -- GND
                  +-- R6 (220R) -- LED3 (green) -- GND

Stage 2 (yellow — AJ10-40):
  555 #2 pin 3 --+-- R7 (220R) -- LED4 (yellow) -- GND
                  +-- R8 (220R) -- LED5 (yellow) -- GND
                  +-- R9 (220R) -- LED6 (yellow) -- GND

Stage 3 (red — ABL X-248):     *** THESE NEVER LIGHT ***
  555 #3 pin 3 --+-- R10 (150R) -- LED7 (red) -- GND
                  +-- R11 (150R) -- LED8 (red) -- GND
                  +-- R12 (150R) -- LED9 (red) -- GND

Note: Red LEDs use 150R resistors (lower Vf than green/yellow)
to make them BRIGHTER — if they ever light, they should be
the most visible. But they never light. The brightest LEDs
in the circuit are the ones you never see. That's the lesson.
```

## The Gap

The most important component in this circuit is the one that isn't there.

```
555 #2 output → [0.01uF cap] → [10K pull-up] → ... GAP ... → 555 #3 pin 2

On the breadboard, this looks like:
  - A wire running from the differentiator output toward 555 #3
  - The wire STOPS one row short of the connection
  - A visible gap of ~5mm on the breadboard
  - 555 #3's trigger pin is pulled high by its own 10K resistor
  - The timer sits there, wired, powered, ready — but never triggered

This is exactly what happened to Pioneer 2:
  - The X-248 motor was loaded, armed, ready
  - The squib charge was in place
  - The firing circuit had a break somewhere
  - The signal never reached the igniter
  - The motor sat there, full of fuel, inert

When you demonstrate this circuit, point to the gap.
Ask: "What would happen if I connected this wire?"
Answer: Stage 3 lights up. Pioneer 2 reaches the Moon.
One jumper wire. That's what stood between failure and success.
```

## The Fix

After demonstrating the failure, connect the jumper wire. Press the launch button again. This time, all three stages light in sequence: green, yellow, RED. The full stack works. The lesson transitions from "what went wrong" to "how we fix it."

This is what the Pioneer program did. Pioneer 2's ignition failure led to redesigned staging circuits with redundant firing paths. Later missions (Pioneer 3, 4, and the interplanetary Pioneers) never had this specific failure again. The break was found, understood, and engineered away.

## Parts List

| Part | Value | Qty | Cost |
|------|-------|-----|------|
| 555 Timer IC (NE555) | - | 3 | $0.75 |
| LED (green, 5mm) | - | 3 | $0.30 |
| LED (yellow, 5mm) | - | 3 | $0.30 |
| LED (red, 5mm) | - | 3 | $0.30 |
| Resistor 82K | 1/4W | 3 | $0.15 |
| Resistor 10K | 1/4W | 3 | $0.15 |
| Resistor 220R | 1/4W | 6 | $0.30 |
| Resistor 150R | 1/4W | 3 | $0.15 |
| Capacitor 47uF electrolytic | 16V | 3 | $0.30 |
| Capacitor 0.01uF ceramic | - | 5 | $0.25 |
| Pushbutton (momentary) | - | 1 | $0.25 |
| 9V battery snap | - | 1 | $0.20 |
| 9V battery | - | 1 | $3.00 |
| Breadboard (full-size) | - | 1 | $5.00 |
| Jumper wire kit | - | 1 | $2.50 |
| **Total** | | | **~$13.90** |

## Build Instructions

1. **Mount the three 555 timers** in a row on the breadboard, left to right. Label them Stage 1, Stage 2, Stage 3. Wire power and ground to all three. Add bypass caps (0.01uF from pin 5 to ground on each).

2. **Wire the RC timing networks.** 82K resistor and 47uF capacitor for each timer. Connect pin 6 and pin 7 together through the resistor, capacitor from the junction to ground. This sets each stage to approximately 4 seconds.

3. **Wire the LED groups.** Three green LEDs from 555 #1, three yellow from 555 #2, three red from 555 #3. Arrange them vertically: green at the bottom (stage 1), yellow in the middle (stage 2), red at the top (stage 3). This represents the rocket stack.

4. **Wire the cascade triggers.** Connect 555 #1 output through a 0.01uF differentiator cap to 555 #2 trigger. Connect 555 #2 output through a 0.01uF cap toward 555 #3 trigger — BUT LEAVE THE LAST WIRE DISCONNECTED.

5. **Wire the launch button.** Momentary pushbutton pulling 555 #1 pin 2 low through a 10K pull-up. Press = launch.

6. **Test.** Press the launch button. Green LEDs light for ~4 seconds. Yellow LEDs light for ~4 seconds. Red LEDs... nothing. Silence. Darkness. The rocket coasts and falls.

7. **The reveal.** Connect the missing jumper wire. Press launch again. Green, yellow, RED. All three stages fire. Pioneer 2 reaches the Moon — in this timeline, at least.

## What You Learn

- **Monostable 555 operation** — each timer fires once for a precise duration, then resets. This is how staging sequencers work: timed events in cascade.
- **Edge-triggered cascading** — each timer triggers the next on its falling edge. The differentiator cap converts a voltage level change into a brief trigger pulse. This is the principle behind every sequential logic circuit.
- **The ignition problem** — a solid rocket motor has exactly one chance to light. There is no restart. If the ignition signal doesn't arrive, the motor sits there inert and the mission is over. This is why redundancy in ignition circuits became standard practice after Pioneer 2.
- **Failure as teacher** — the circuit is MORE educational with the gap than without it. The working version demonstrates staging. The broken version demonstrates failure analysis. Both are essential engineering skills.
- **The power of one wire** — the entire difference between mission success and mission failure was a single electrical connection. This is true of many engineering disasters. Complexity kills, and the weakest link in a chain determines the strength of the whole chain.

## Fox Companies Connection

Fifth circuit in the NASA kit series. This circuit pairs with the Pioneer 0 countdown timer (v1.1) and the Pioneer 1 LED Van Allen belt display (v1.2) to form a three-circuit set covering the first three Pioneer missions. Each circuit teaches a different failure mode: v1.1 = timing/counting (first stage explosion), v1.2 = data visualization (trajectory shortfall), v1.3 = signal integrity (ignition failure). Workshop upgrade: mount all three circuits on a single demonstration board with a printed timeline showing Pioneer 0 → Pioneer 1 → Pioneer 2, each with its failure and its lesson. The progression from "explosion" to "almost there" to "one wire short" tells the story of how engineering learns from failure.
