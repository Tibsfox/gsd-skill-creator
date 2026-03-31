# DIY LED Circuit: Orbital Sunrise Display — Mercury-Atlas 6 Dawn Cycle

## The Circuit

A 555 timer-driven LED lighting sequence that simulates John Glenn's orbital sunrise cycle. Seven LEDs transition through five stages — night, dawn, daylight, dusk, and night again — repeating every ~90 seconds to represent the 88.5-minute orbital period of Friendship 7. A noise-driven "firefly" LED recreates the mysterious luminous particles Glenn reported outside his window during the dark orbital passes, which were later identified as frost flakes from the attitude control thrusters illuminated by sunlight.

**What it does:**
- 555 timer in astable mode generates a slow sawtooth ramp (~90 second period)
- Ramp voltage drives five lighting stages through transistor threshold switches:
  - Stage 1 (0-20%): Night — all LEDs off, one gold LED randomly flickers via noise circuit
  - Stage 2 (20-40%): Dawn — three amber LEDs fade on through RC-filtered PWM
  - Stage 3 (40-70%): Daylight — two white and one blue LED at full brightness
  - Stage 4 (70-80%): Dusk — white/blue LEDs off, amber LEDs fade through descending brightness
  - Stage 5 (80-100%): Night — all off, firefly LED resumes random flicker
- The "firefly" noise source uses a reverse-biased transistor junction (emitter-base breakdown) generating broadband noise, amplified and compared against a threshold to produce random on/off flicker
- Continuous cycling with no microcontroller — purely analog timing and switching

**What it teaches:** Glenn orbited Earth three times in 4 hours and 55 minutes. At orbital velocity (28,000 km/h), Friendship 7 crossed the terminator — the boundary between day and night — every 44 minutes. Each sunrise arrived suddenly. At orbital altitude (260 km), there is no gradual brightening over tens of minutes as we experience on Earth's surface. The atmosphere is a thin bright line on the horizon, then the sun appears, and within seconds the capsule transitions from total darkness to full sunlight. Glenn described the sunrises as the most beautiful sight of the mission. The "fireflies" he reported during the dark-side passes caused genuine excitement on the ground — were they a new phenomenon? Astronaut Scott Carpenter on MA-7 later confirmed they were frost particles from the capsule, knocked free by thruster firings and lit by scattered sunlight.

**Total cost: ~$8**

---

## Schematic

```
  Power: 9V battery or USB 5V (through 7805 regulator for 9V source)

  Ramp Generator (555 Timer):

    9V ──[10KΩ]──┬──[1MΩ]──┬── 555 Pin 7 (Discharge)
                 │          │
              555 Pin 8   [1000µF] electrolytic
              (VCC)        │
                          GND
                           │
                        555 Pin 1 (GND)

    555 Pin 2 (Trigger) ──┬── 555 Pin 6 (Threshold)
                          │
                       [1000µF] (same capacitor — junction)
                          │
                         GND

    555 Pin 3 (Output) ── Ramp signal out
    555 Pin 5 (Control) ── [100nF] ── GND (bypass)
    555 Pin 4 (Reset) ── VCC (always enabled)

    Ramp output charges/discharges C through R, producing
    a triangle-ish wave at ~0.011 Hz (period ≈ 90 seconds)
    t = 0.693 × (R1 + 2×R2) × C
    t = 0.693 × (10K + 2×1M) × 1000µF
    t ≈ 0.693 × 2.01M × 0.001 = 1,393 sec (too slow)

    REVISED: Use 100µF for ~90 second period:
    t = 0.693 × (10K + 2×1M) × 100µF ≈ 139 sec
    Adjust R2 to 470KΩ:
    t = 0.693 × (10K + 940K) × 100µF ≈ 65.8 sec
    Use R2 = 680KΩ:
    t = 0.693 × (10K + 1.36M) × 100µF ≈ 94.9 sec ✓

  Voltage Divider / Threshold Reference Network:

    Ramp from 555 pin 3 feeds four comparator thresholds
    via a resistor divider ladder:

    9V ──[R_a 33KΩ]──┬──[R_b 22KΩ]──┬──[R_c 22KΩ]──┬──[R_d 33KΩ]── GND
                      │               │               │
                   V_dawn ≈ 6.0V   V_day ≈ 3.9V   V_dusk ≈ 2.1V
                      │               │               │
                   LM358A IN+      LM358A IN-      LM358B IN+
                   (comparator 1)  (comparator 2)  (comparator 3)

    Comparators switch LED stages as ramp voltage crosses thresholds

  LED Driver Stages:

    Stage 1/5 — NIGHT (Firefly):
                                    9V
                                     │
    Noise Source:                  [1KΩ]
    Q1 (2N3904) E-B junction       │
    reverse-biased at 9V       Gold LED
    via [100KΩ]                    │
         │                     Q4 (2N3904) Collector
    [10nF] AC couple               │
         │                     Q4 Emitter ── GND
    [100KΩ] bias                   │
         │                     Q4 Base ←── Comparator output
    Q2 (2N3904) amplifier              (random on/off)
    gain ≈ 100                     │
         │                    Firefly active when ALL
    LM358B (comparator 4)    stage comparators are LOW
    threshold at ~2V          (ramp below dawn threshold
         │                    OR above dusk threshold)
    Random digital output

    Stage 2/4 — DAWN/DUSK (Amber LEDs):
                        9V
                         │
                      [330Ω]──Amber LED 1──┐
                      [330Ω]──Amber LED 2──┼── Q3 (2N3904) Collector
                      [330Ω]──Amber LED 3──┘       │
                                               Q3 Emitter ── GND
                                                   │
                              Q3 Base ←── [10KΩ] ←── Ramp (via RC filter)
                                                   │
                              [10µF] smoothing to GND
                              (RC filter creates fade-on/fade-off)

    Stage 3 — DAYLIGHT (White + Blue LEDs):
                        9V
                         │
                      [220Ω]──White LED 1──┐
                      [220Ω]──White LED 2──┼── Q5 (2N3904) Collector
                      [330Ω]──Blue LED 1───┘       │
                                               Q5 Emitter ── GND
                                                   │
                              Q5 Base ←── [10KΩ] ←── Daylight comparator
                              (ON when ramp is in 40-70% range)

  Complete LED Layout:

    ┌──────────────────────────────────────────────────────┐
    │                                                      │
    │   [AMB] [AMB] [AMB]   [WHT] [WHT] [BLU]   [GOLD]   │
    │     │     │     │       │     │     │        │       │
    │     └─────┼─────┘       └─────┼─────┘        │       │
    │           │                   │               │       │
    │        Dawn/Dusk           Daylight        Firefly    │
    │        (fade)              (on/off)        (random)   │
    │                                                      │
    │   Night ─── Dawn ─── Day ─── Dusk ─── Night          │
    │   0%        20%       40-70%  80%      100%          │
    │   firefly   amber     white   amber    firefly       │
    │   flicker   fade on   +blue   fade     flicker       │
    │                                                      │
    └──────────────────────────────────────────────────────┘

    Power:
      9V  → 555 VCC (pin 8), LM358 VCC (pin 8), LED supply
      GND → 555 GND (pin 1), LM358 GND (pin 4), transistor emitters
```

## Design Calculations

```
555 Timer ramp period:
  Configuration: astable mode
  R1 = 10KΩ (charge path)
  R2 = 680KΩ (charge/discharge path)
  C = 100µF (electrolytic)

  t_high = 0.693 × (R1 + R2) × C
         = 0.693 × (10K + 680K) × 100µ
         = 0.693 × 690K × 0.0001
         = 47.8 seconds

  t_low = 0.693 × R2 × C
        = 0.693 × 680K × 100µ
        = 47.1 seconds

  Total period: t_high + t_low ≈ 94.9 seconds ✓
  (Close enough to 88.5-minute orbital period scaled to 90 seconds)

  Duty cycle: 47.8 / 94.9 = 50.4% (nearly symmetric)

  Voltage ramp: capacitor charges from ~3V to ~6V (1/3 to 2/3 VCC)
  This 3V swing drives the threshold comparators

Threshold divider network:
  Purpose: create three voltage thresholds for stage transitions
  The ramp swings between 3V and 6V (555 threshold levels)

  Dawn threshold: 3.6V  (20% of ramp range above minimum)
    Ramp > 3.6V → amber LEDs begin fade-on
  Daylight threshold: 4.2V  (40% of ramp range)
    Ramp > 4.2V → white + blue LEDs on
  Dusk threshold: 5.1V  (70% of ramp range)
    Ramp > 5.1V → white + blue off, amber begins fade-off
  Night threshold: 5.4V  (80% of ramp range)
    Ramp > 5.4V → all off, firefly active

  LM358 comparators: rail-to-rail output (within ~1.5V of rails)
  Each comparator drives a transistor switch for its LED group

Amber LED fade (RC-filtered drive):
  The ramp voltage feeds Q3 base through an RC filter:
    R = 10KΩ, C = 10µF
    Time constant: 100ms (smooths the ramp for gradual fade)
  As ramp voltage crosses the dawn threshold:
    Q3 base voltage rises slowly → collector current increases
    → LED brightness increases gradually → simulates dawn
  During dusk: reverse process as ramp falls past threshold

Noise source (firefly generator):
  Q1 (2N3904) emitter-base junction reverse-biased:
    BV_ebo ≈ 6V for 2N3904
    At 9V through 100KΩ: junction avalanches
    Produces broadband noise: ~1-100 kHz
    Noise amplitude: ~5-50 mV RMS

  Q2 amplifier:
    Common-emitter, gain ≈ 100 (set by Rc/Re)
    Amplifies noise to ~0.5-5V swings
    AC coupled through 10nF to block DC bias

  LM358B as comparator:
    Threshold at ~2V (set by divider)
    Noise exceeds 2V randomly → output goes HIGH
    Random duty cycle: ~20-40% (depends on noise amplitude)
    Result: gold LED flickers randomly, mimicking the
    "fireflies" Glenn observed

  The noise is truly random (avalanche breakdown is a quantum
  process), so the flicker pattern never repeats — just like
  the frost particles Glenn saw.

LED current calculations:
  Amber LEDs (2V forward, 20mA): R = (9-2-0.2)/0.02 = 340Ω → 330Ω
  White LEDs (3.2V forward, 20mA): R = (9-3.2-0.2)/0.02 = 280Ω → 220Ω (slightly brighter)
  Blue LED (3.0V forward, 20mA): R = (9-3.0-0.2)/0.02 = 290Ω → 330Ω
  Gold LED (2V forward, 15mA): R = (9-2-0.2)/0.015 = 453Ω → 470Ω

Power consumption:
  555 timer: ~5mA quiescent
  LM358: ~1mA
  LEDs (max, daylight stage): 3 × 20mA = 60mA
  Total peak: ~70mA
  Average (weighted by duty cycle): ~30mA
  9V battery life: ~200mAh / 30mA ≈ 6.7 hours ≈ ~250 orbital sunrise cycles
```

## Parts List

| Qty | Part | Cost |
|-----|------|------|
| 1 | NE555 timer IC (DIP-8) | $0.30 |
| 1 | LM358 dual op-amp (DIP-8) | $0.30 |
| 4 | 2N3904 NPN transistors (Q2, Q3, Q4, Q5) | $0.40 |
| 1 | 2N3904 NPN transistor (Q1, noise source — can use same part) | $0.10 |
| 3 | Amber LEDs (5mm, diffused) | $0.30 |
| 2 | White LEDs (5mm, diffused) | $0.20 |
| 1 | Blue LED (5mm, diffused) | $0.10 |
| 1 | Gold/warm-white LED (5mm, diffused — firefly) | $0.10 |
| 1 | 100 µF electrolytic capacitor (timer) | $0.10 |
| 1 | 10 µF electrolytic capacitor (fade filter) | $0.05 |
| 1 | 10 nF ceramic capacitor (noise coupling) | $0.05 |
| 1 | 100 nF ceramic capacitor (555 bypass) | $0.05 |
| 1 | 10 KΩ resistor (555 R1) | $0.05 |
| 1 | 680 KΩ resistor (555 R2) | $0.05 |
| 1 | 100 KΩ resistor (noise source bias) | $0.05 |
| 1 | 100 KΩ resistor (noise amplifier load) | $0.05 |
| 3 | 330 Ω resistors (amber + blue LED current limit) | $0.15 |
| 2 | 220 Ω resistors (white LED current limit) | $0.10 |
| 1 | 470 Ω resistor (gold LED current limit) | $0.05 |
| 2 | 10 KΩ resistors (transistor base drive) | $0.10 |
| 1 | 33 KΩ resistor (divider) | $0.05 |
| 2 | 22 KΩ resistors (divider) | $0.10 |
| 1 | 33 KΩ resistor (divider) | $0.05 |
| 1 | Small breadboard | $1.00 |
| -- | Jumper wires | $0.50 |
| 1 | 9V battery + clip (or USB 5V supply) | $1.50 |
| **Total** | | **~$8** |

## Theory of Operation

The circuit has two independent systems: the orbital cycle generator and the firefly noise generator. Together they create a continuous, repeating light show that represents what Glenn saw through Friendship 7's window.

**The Ramp Generator.** The 555 timer runs in astable mode with a large timing capacitor (100 µF) and high-value resistors to produce a very slow oscillation. The capacitor voltage ramps between 1/3 VCC (3V) and 2/3 VCC (6V) in a roughly linear fashion, taking about 48 seconds for each charge and discharge half-cycle. This capacitor voltage IS the "orbital position" — low voltage represents the dark side, high voltage represents the sunlit side, and the transitions represent the terminator crossings.

**The Threshold Network.** A resistor divider creates fixed reference voltages at 3.6V, 4.2V, and 5.1V. As the ramp sweeps upward, it crosses these thresholds in sequence, triggering the LM358 comparators. Each comparator switches a transistor that drives a group of LEDs. The sequence — dark, amber-fade, white+blue, amber-fade, dark — plays out over each 95-second cycle.

**The Amber Fade.** Rather than switching the amber LEDs abruptly on and off, the ramp voltage feeds the transistor base through an RC filter (10 KΩ / 10 µF). This smooths the transition, causing the amber LEDs to gradually brighten during "dawn" and gradually dim during "dusk." The effect simulates the thin bright arc of atmosphere Glenn described appearing on the horizon moments before sunrise.

**The Daylight Stage.** When the ramp crosses the daylight threshold, the white and blue LEDs switch on at full brightness. White represents the direct sunlight flooding the capsule. Blue represents the Earth's atmosphere seen from above — Glenn described the limb of the Earth as an intense blue-white arc. The daylight stage occupies 30% of the cycle, matching the roughly 55-minute sunlit portion of the 88.5-minute orbit (62% — compressed here for visual drama since the transitions are the interesting part).

**The Firefly Generator.** This is the most interesting subcircuit. A 2N3904 transistor is wired backwards — the emitter-base junction is reverse-biased until it enters avalanche breakdown. At breakdown (approximately 6-7V for the 2N3904), the junction generates broadband noise caused by quantum-mechanical avalanche multiplication. This noise is AC-coupled through a 10 nF capacitor, amplified by a second transistor stage, and fed to a comparator. The comparator's threshold is set so that the noise signal randomly exceeds it, producing an irregular digital output. This drives the gold "firefly" LED with a random flicker pattern that never repeats.

The firefly LED is active only during the night stages (when all other LEDs are off), gated by the stage comparators. This matches Glenn's observation: the luminous particles were visible only against the black sky of the dark side. In daylight they would have been invisible against the bright capsule and Earth.

**Why 90 seconds?** The real orbital period was 88 minutes and 29 seconds. At that rate, you would watch approximately 16 sunrises per day. A 90-second cycle compresses one orbit into a watchable demonstration — fast enough to see the full sequence, slow enough to appreciate each transition. Glenn completed three orbits. Leave the circuit running for 4 minutes and 45 seconds to see all three of his sunrises.

## Connection to Glenn

John Glenn launched from Cape Canaveral at 9:47 AM EST on February 20, 1962. He was 40 years old. The Atlas rocket that carried him had a failure rate of nearly 50% — the astronauts called it "the missile that never worked." But on that morning, it worked.

As Friendship 7 climbed into orbit, Glenn became the first American to see sunset from space. The sun dropped below the horizon in seconds, not minutes. The sky went from blue to black in a razor-thin transition. And then the stars appeared — not the soft twinkling points visible from Earth, but hard, steady, brilliant lights in every direction.

During his first dark-side pass, Glenn noticed something outside the window. Luminous particles, glowing yellowish-green, drifting slowly past the capsule. Thousands of them, like fireflies on a summer evening. "I am in a big mass of some very small particles that are brilliantly lit up like they're luminescent," he radioed to ground control. "They're all around the capsule." The particles moved slowly relative to the capsule, tumbling and swirling. They appeared at every sunrise transition and disappeared in full daylight.

Were they alive? Were they some unknown atmospheric phenomenon? The mystery generated enormous public interest. On the next Mercury mission (MA-7, Aurora 7), Scott Carpenter deliberately banged on the capsule hull and watched frost particles break free and float alongside — mystery solved. The "fireflies" were ice crystals from the capsule's own cooling system, released by thermal expansion at the terminator crossing and illuminated by scattered sunlight at just the right angle.

Each 90-second cycle of this circuit represents one of Glenn's orbits. He saw three sunrises in less than five hours. Every one of them was, by his own account, the most beautiful thing he had ever seen. The gold LED flickering randomly in the dark phase is a small tribute to the moment when a test pilot, crammed into a capsule the size of a phone booth, traveling at 17,500 miles per hour, looked out his window and saw fireflies.

---

## Classroom Extensions

1. **Timing measurement:** Using a stopwatch, measure the actual cycle period. Compare it to the calculated 94.9 seconds. The difference is caused by electrolytic capacitor tolerance (which can be ±20%). How would you trim the period with a potentiometer in place of R2?
2. **Noise characterization:** Connect the noise generator output (before the comparator) to an oscilloscope. Measure the noise amplitude and observe the random waveform. Calculate the approximate bandwidth by finding the frequency where the noise power drops by 3 dB.
3. **Sunrise rate:** At orbital velocity (7.8 km/s) and altitude (260 km), calculate the angular rate at which the sun rises above the horizon. How many degrees per second? (Compare to surface sunrise rate of ~0.25 degrees per minute.)
4. **Power budget:** Measure the current draw in each stage (night, dawn, daylight, dusk). Calculate the average power consumption weighted by the fraction of time spent in each stage. How long will a 9V battery last?
5. **Scale the orbit:** Glenn's orbital altitude was 260 km. His orbital velocity was 7.8 km/s. The orbital circumference was 2 x pi x (6,371 + 260) = 41,676 km. At 7.8 km/s, one orbit takes 41,676 / 7.8 = 5,343 seconds = 89.1 minutes. Our circuit compresses this by a factor of 5,343 / 95 = 56.2x. What would the LED display look like at real-time speed?
