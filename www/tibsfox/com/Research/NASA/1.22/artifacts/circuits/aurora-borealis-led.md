# DIY LED Circuit: Aurora Borealis Display — Mercury-Atlas 7 Northern Lights

## The Circuit

A 555 timer driving a CD4017 decade counter to sequentially activate ten LED channels through RC crossfade networks, simulating the shimmering curtains of the aurora borealis. Three color groups — green, blue, and purple — overlap and fade through smooth transitions, creating a continuously shifting light pattern that never looks the same twice. The circuit is named for the phenomenon that inspired Scott Carpenter to name his capsule Aurora 7: the aurora borealis, the northern lights he had watched from his childhood home in Boulder, Colorado.

**What it does:**
- 555 timer in astable mode generates a clock signal at approximately 3 Hz
- CD4017 decade counter steps through ten outputs sequentially, one active at a time
- Each output drives an LED through an RC network (10 uF capacitor, 10 KOhm discharge resistor) that creates a slow fade-out after the counter advances, so multiple LEDs overlap in brightness at any moment
- Ten LEDs arranged in three color groups:
  - Outputs 0, 1, 2, 3: green LEDs (dominant auroral color — 557.7 nm oxygen forbidden line)
  - Outputs 4, 5, 6: blue LEDs (nitrogen ion emission at lower altitudes)
  - Outputs 7, 8, 9: purple/violet LEDs (nitrogen molecular emission at the auroral base)
- The color sequence green-green-green-green-blue-blue-blue-purple-purple-purple creates a repeating curtain sweep with smooth crossfades between adjacent LEDs
- At 3 Hz clock rate, the full ten-step cycle takes ~3.3 seconds, with RC fade tails extending each LED's glow into the next step
- Continuous operation — purely analog/digital, no microcontroller

**What it teaches:** The aurora borealis occurs when charged particles from the solar wind are channeled along Earth's magnetic field lines into the polar atmosphere. At altitudes of 100-300 km, these particles collide with atmospheric gases, exciting their electrons to higher energy states. When the electrons drop back down, they emit photons at specific wavelengths determined by quantum mechanics: oxygen at 557.7 nm (green) and 630.0 nm (red), nitrogen ions at 427.8 nm (blue), and nitrogen molecules at 391.4 nm (violet). The dominant green color is produced by the oxygen forbidden line transition — a quantum-mechanically "forbidden" transition that takes 0.7 seconds to emit, which is why it only occurs at high altitudes where the atmosphere is thin enough that collisional de-excitation does not quench the excited state before it can radiate.

**Total cost: ~$7**

---

## Schematic

```
  Power: 9V battery (or USB 5V through 7805 regulator)

  Clock Generator (555 Timer — ~3 Hz):

    9V ──[R1 10KOhm]──┬──[R2 100KOhm]──┬── 555 Pin 7 (Discharge)
                       |                 |
                    555 Pin 8          [C1 2.2uF] electrolytic
                    (VCC)                |
                                        GND
                                         |
                                      555 Pin 1 (GND)

    555 Pin 2 (Trigger) ──┬── 555 Pin 6 (Threshold)
                          |
                       [C1 2.2uF] (same capacitor — junction point)
                          |
                         GND

    555 Pin 3 (Output) ── Clock out to CD4017 Pin 14 (CLK)
    555 Pin 5 (Control) ── [100nF] ── GND (bypass)
    555 Pin 4 (Reset) ── VCC (always enabled)

    Clock frequency:
      f = 1.44 / ((R1 + 2*R2) * C1)
      f = 1.44 / ((10K + 200K) * 2.2u)
      f = 1.44 / 0.462
      f = 3.12 Hz  (period = 0.32 seconds per step)

  Decade Counter (CD4017):

    Pin 16 (VDD) ── 9V
    Pin 8  (VSS) ── GND
    Pin 14 (CLK) ── 555 Pin 3 (clock input)
    Pin 13 (CLK Enable) ── GND (always enabled)
    Pin 15 (Reset) ── GND (free-running through all 10 outputs)

    Decoded outputs (active HIGH, one at a time):
      Pin 3  (Q0) ── Green LED channel 1
      Pin 2  (Q1) ── Green LED channel 2
      Pin 4  (Q2) ── Green LED channel 3
      Pin 7  (Q3) ── Green LED channel 4
      Pin 10 (Q4) ── Blue LED channel 1
      Pin 1  (Q5) ── Blue LED channel 2
      Pin 5  (Q6) ── Blue LED channel 3
      Pin 6  (Q7) ── Purple LED channel 1
      Pin 9  (Q8) ── Purple LED channel 2
      Pin 11 (Q9) ── Purple LED channel 3

  LED Crossfade Driver (repeated for each of 10 channels):

    CD4017 Output Qn
         |
    [10KOhm] (current limit / charge path)
         |
         +────────┬──── [R_led 220Ohm] ──── LED anode
         |        |                               |
      [C_fade     |                           LED cathode
       10uF]   [R_discharge                       |
         |      10KOhm]                          GND
        GND       |
                 GND

    When Qn goes HIGH (9V):
      C_fade charges through 10K, simultaneously driving current
      through R_led and the LED. LED is at full brightness.

    When Qn goes LOW (counter advances):
      C_fade discharges through R_discharge (10K) and through
      the LED path. LED fades out gradually.

    Fade time constant: tau = R_discharge * C_fade
      tau = 10K * 10u = 100 ms
      LED visibly fades over ~3*tau = 300 ms
      Since the clock period is 320 ms, the fade tail of one
      LED overlaps with the rise of the next — creating a
      smooth crossfade between adjacent channels.

  Complete LED Layout (viewed from front):

    +──────────────────────────────────────────────────────────────+
    |                                                              |
    |  [GRN] [GRN] [GRN] [GRN]  [BLU] [BLU] [BLU]  [PUR] [PUR] [PUR]  |
    |    0     1     2     3      4     5     6      7     8     9  |
    |                                                              |
    |  <── Green curtain ──>  <── Blue zone ──>  <── Violet base ──>  |
    |                                                              |
    |  Sequential activation with 100ms crossfade tails            |
    |  Full cycle: 3.2 seconds (10 steps x 320 ms)                |
    |  Overlap creates 2-3 LEDs glowing simultaneously             |
    |                                                              |
    +──────────────────────────────────────────────────────────────+

  Power:
    9V  -> 555 VCC (pin 8), CD4017 VDD (pin 16), LED supply
    GND -> 555 GND (pin 1), CD4017 VSS (pin 8), LED cathodes
```

## Design Calculations

```
555 Timer clock:
  Configuration: astable mode
  R1 = 10 KOhm (charge path, pin 7 to VCC)
  R2 = 100 KOhm (charge/discharge path, pin 7 to pins 2/6)
  C1 = 2.2 uF (electrolytic)

  t_high = 0.693 * (R1 + R2) * C1
         = 0.693 * (10K + 100K) * 2.2u
         = 0.693 * 110K * 0.0000022
         = 0.168 seconds

  t_low = 0.693 * R2 * C1
        = 0.693 * 100K * 2.2u
        = 0.152 seconds

  Total period: 0.168 + 0.152 = 0.320 seconds
  Frequency: 1 / 0.320 = 3.12 Hz

  Duty cycle: 0.168 / 0.320 = 52.5% (nearly symmetric)
  The CD4017 triggers on the rising edge, so duty cycle
  asymmetry does not affect the step timing.

CD4017 operation:
  The CD4017 is a Johnson counter with decoded outputs.
  On each rising clock edge, exactly one output goes HIGH
  and all others go LOW. The outputs advance in sequence:
  Q0 -> Q1 -> Q2 -> ... -> Q9 -> Q0 (wraps around).

  Output HIGH voltage: VDD - 0.05V = ~8.95V (CMOS rail-to-rail)
  Output LOW voltage: ~0.05V
  Output source current: up to 10 mA per pin (at VDD = 9V)

  Since we drive LEDs through the RC network, the CD4017
  output current is limited by the 10K charge resistor:
  I_peak = (9V - V_led - V_drop) / 10K = (9 - 2.1 - 0.22) / 10K
         = 0.668 mA through the charge resistor
  Additional LED current flows from C_fade discharge.

RC crossfade network:
  Each LED channel has a 10 uF capacitor and 10 KOhm
  discharge resistor creating the fade effect.

  Charge time constant (when Qn is HIGH):
    tau_charge = R_charge * C_fade = 10K * 10u = 100 ms
    Capacitor reaches 63% of final voltage in 100 ms
    Reaches 95% in 300 ms (just under one clock period)
    LED reaches near-full brightness within one step

  Discharge time constant (when Qn goes LOW):
    tau_discharge = R_discharge * C_fade = 10K * 10u = 100 ms
    Capacitor voltage decays to 37% in 100 ms
    Decays to 5% in 300 ms
    LED visibly glowing for approximately one full step
    after the counter has moved on

  Overlap effect:
    At any given moment, the current step's LED is at full
    brightness, the previous step's LED is fading out (at
    ~37% after 100 ms), and the step before that has nearly
    faded to black (~14% at 200 ms). This creates a
    "curtain" of 2-3 simultaneously lit LEDs sweeping
    across the display — mimicking the flowing sheets
    of auroral light.

LED current (steady state, Qn HIGH):
  Green LEDs (2.1V forward, diffused):
    I = (V_cap - V_led) / R_led
    V_cap reaches ~8.5V (accounting for CD4017 output drop)
    I = (8.5 - 2.1) / 220 = 29 mA (peak)
    During fade: current decreases exponentially

  Blue LEDs (3.0V forward, diffused):
    I = (8.5 - 3.0) / 220 = 25 mA (peak)

  Purple LEDs (3.2V forward, diffused):
    I = (8.5 - 3.2) / 220 = 24 mA (peak)

  Average current per LED (duty cycle = 10% active + fade tail):
    Approximately 5-8 mA average per LED
    Total average LED current: ~50-80 mA

Power consumption:
  555 timer: ~5 mA quiescent
  CD4017: ~1 mA at 3 Hz (CMOS, very low)
  LEDs (average): ~60 mA
  Total average: ~66 mA
  9V battery life: ~200 mAh / 66 mA = ~3 hours
  USB 5V supply recommended for extended display
```

## Parts List

| Qty | Part | Cost |
|-----|------|------|
| 1 | NE555 timer IC (DIP-8) | $0.30 |
| 1 | CD4017 decade counter IC (DIP-16) | $0.40 |
| 4 | Green LEDs (5mm, diffused, 525 nm) | $0.40 |
| 3 | Blue LEDs (5mm, diffused, 470 nm) | $0.30 |
| 3 | Purple/violet LEDs (5mm, diffused, 400 nm) | $0.30 |
| 1 | 2.2 uF electrolytic capacitor (555 timing) | $0.05 |
| 10 | 10 uF electrolytic capacitors (crossfade) | $0.50 |
| 1 | 100 nF ceramic capacitor (555 bypass) | $0.05 |
| 1 | 10 KOhm resistor (555 R1) | $0.05 |
| 1 | 100 KOhm resistor (555 R2) | $0.05 |
| 10 | 10 KOhm resistors (charge path, one per channel) | $0.50 |
| 10 | 10 KOhm resistors (discharge path, one per channel) | $0.50 |
| 10 | 220 Ohm resistors (LED current limit, one per channel) | $0.50 |
| 1 | Small breadboard | $1.00 |
| -- | Jumper wires | $0.50 |
| 1 | 9V battery + clip (or USB 5V supply) | $1.50 |
| **Total** | | **~$7** |

## Theory of Operation

### How the 555 + CD4017 Creates Sequential Activation

The 555 timer generates a continuous square wave at approximately 3 Hz. Each rising edge of this clock signal advances the CD4017 decade counter by one step. The CD4017 is a CMOS Johnson counter with fully decoded outputs — at any given moment, exactly one of its ten output pins is HIGH (near VDD) and all nine others are LOW (near ground). As the clock ticks, the HIGH output walks from Q0 through Q9 and then wraps back to Q0, creating a sequential scanning pattern.

This is a fundamentally different approach from the 555-only circuit used in the v1.21 orbital sunrise display. Instead of a slow analog ramp driving threshold comparators, the 555 here runs fast (3 Hz vs. 0.01 Hz) and acts purely as a digital clock. The CD4017 provides the sequencing that would otherwise require multiple comparators and reference networks. The result is a cleaner, more predictable scan pattern with exactly equal time on each step.

### How RC Networks Smooth the Transitions

If the LEDs were driven directly from the CD4017 outputs, each LED would snap on for 320 milliseconds and then snap off — a harsh, mechanical stepping pattern nothing like the aurora. The RC crossfade networks transform this digital stepping into analog flowing.

When a CD4017 output goes HIGH, current flows through the 10 KOhm charge resistor into the 10 uF capacitor and through the 220 Ohm current-limiting resistor into the LED. The capacitor charges with a time constant of 100 milliseconds, and the LED reaches near-full brightness within the 320 ms step period. When the counter advances and the output drops LOW, the capacitor begins discharging through the 10 KOhm discharge resistor. The LED continues to glow, dimming exponentially with a 100 ms time constant. After 300 milliseconds (about one clock period), the LED has faded to roughly 5% brightness — barely visible but not quite dark.

The effect is that at any instant, the current step's LED is bright, the previous step's LED is dim but visible, and perhaps the step before that still shows a faint glow. This creates a moving cluster of 2-3 simultaneously lit LEDs that sweeps across the display, mimicking the way auroral curtains flow and shimmer across the polar sky. The green-green-green-green-blue-blue-blue-purple-purple-purple color sequence ensures that the color transitions happen at the boundaries between groups, just as real auroral curtains show color gradients from green at the top (high altitude oxygen emission) through blue and into purple at the base (lower altitude nitrogen emission).

### The Aurora Borealis — Quantum Mechanics in the Sky

The aurora borealis is one of the most spectacular natural displays on Earth, and it is fundamentally a quantum-mechanical phenomenon. Charged particles from the solar wind — mostly electrons and protons with energies of 1-10 keV — are captured by Earth's magnetosphere and funneled along magnetic field lines toward the polar regions. When these particles collide with atmospheric atoms and molecules at altitudes of 100 to 300 km, they transfer energy to the bound electrons, promoting them to excited quantum states.

The dominant green color of the aurora comes from the oxygen atom's forbidden transition at 557.7 nm. This is the 1S to 1D transition of atomic oxygen — it is "forbidden" in the sense that electric dipole selection rules prohibit it. The transition can only occur through higher-order processes (magnetic dipole or electric quadrupole), which are extremely slow: the excited oxygen atom must wait approximately 0.7 seconds before it can emit the green photon. At sea level, collisions with other molecules would de-excite the atom long before 0.7 seconds elapsed. But at 100-300 km altitude, where the mean free path between collisions is measured in meters, the atom has time to radiate. This is why the green aurora appears only at high altitude — it requires the near-vacuum of the upper atmosphere to survive.

The blue and violet colors come from nitrogen, both ionic (N2+ at 427.8 nm) and molecular (N2 at 391.4 nm). These transitions are allowed and occur rapidly, so they appear at lower altitudes where collisional quenching of the slow oxygen transition has already eliminated the green emission. The result is a vertical color gradient: green above, blue in the middle, purple/violet at the base. This circuit's LED arrangement mirrors that gradient.

## Connection to Carpenter and Aurora 7

Scott Carpenter chose the name Aurora 7 for two reasons. The first was the aurora borealis — the northern lights he had watched as a child growing up in Boulder, Colorado. Boulder sits at 40 degrees north latitude, far enough south that aurora sightings are rare and spectacular, appearing only during strong geomagnetic storms when the auroral oval expands equatorward. For a boy who would grow up to be an astronaut, those rare displays of light in the night sky represented the mystery and beauty of the space above.

The second reason was the Latin meaning of aurora: dawn. Carpenter's mission was the dawn of a new phase of Mercury — a science mission rather than a pure engineering test. Glenn's MA-6 had proven the spacecraft and the man could survive. Carpenter's MA-7 was the first Mercury flight dedicated primarily to scientific observation. He carried experiments in fluid behavior in weightlessness, photographed weather patterns and the airglow layer, and deliberately investigated Glenn's "fireflies" by tapping on the capsule hull and confirming they were frost particles.

There is a remarkable wavelength coincidence that connects the aurora to another domain of science. The dominant green auroral emission at 557.7 nm falls within 40 nm of the peak emission of green fluorescent protein (GFP) at approximately 509 nm. GFP — the protein that revolutionized cell biology by allowing researchers to tag and track proteins in living cells — emits its green light through a completely different mechanism: a chemical chromophore formed by the cyclization and oxidation of three amino acids (Ser65-Tyr66-Gly67) within the protein's beta-barrel structure. Yet both produce green light in the 500-560 nm band. The oxygen forbidden line at 557.7 nm requires 0.7 seconds and the near-vacuum of space to emit. The GFP chromophore emits in nanoseconds and works at room temperature in liquid water. Same color, vastly different physics — one quantum-mechanical, one photochemical. Both beautiful.

---

## Assembly Instructions

1. **Insert the 555 timer** into the breadboard spanning the center channel. Connect pin 8 to the 9V power rail and pin 1 to the ground rail.

2. **Build the 555 astable clock.** Wire R1 (10 KOhm) from pin 8 to pin 7. Wire R2 (100 KOhm) from pin 7 to the junction of pins 2 and 6. Connect pins 2 and 6 together. Wire C1 (2.2 uF electrolytic, observe polarity: positive to pins 2/6, negative to ground). Connect pin 4 to VCC. Connect the 100 nF bypass capacitor from pin 5 to ground.

3. **Insert the CD4017** into the breadboard. Connect pin 16 to 9V, pin 8 to ground, pin 13 to ground, and pin 15 to ground.

4. **Connect the clock line.** Wire 555 pin 3 to CD4017 pin 14.

5. **Build ten identical RC crossfade driver circuits.** For each of the ten CD4017 outputs (pins 3, 2, 4, 7, 10, 1, 5, 6, 9, 11):
   - Wire a 10 KOhm resistor from the output pin to a node
   - From that node, wire a 10 uF electrolytic capacitor to ground (positive to node, negative to ground)
   - From the same node, wire a 10 KOhm discharge resistor to ground
   - From the same node, wire a 220 Ohm resistor to the LED anode
   - Connect the LED cathode to ground

6. **Install LEDs by color:**
   - Q0-Q3 (pins 3, 2, 4, 7): green LEDs
   - Q4-Q6 (pins 10, 1, 5): blue LEDs
   - Q7-Q9 (pins 6, 9, 11): purple LEDs

7. **Power up.** Connect 9V battery. The LEDs should begin scanning sequentially with smooth crossfades. If the pattern appears to jump erratically, check that CD4017 pin 13 (clock enable) is connected to ground and pin 15 (reset) is also grounded.

8. **Adjust speed** by substituting R2 with a 200 KOhm potentiometer to vary the scan rate from approximately 1.5 Hz to 6 Hz. Slower rates produce a more stately auroral flow; faster rates simulate the rapid flickering seen during geomagnetic substorms.

---

## Safety Notes

- The 9V battery is the only power source. No mains voltage involved.
- The CD4017 is a CMOS device — handle by the edges, avoid touching pins. Static discharge can damage the IC. In practice, the CD4017BE is reasonably robust, but a grounding wrist strap is good practice.
- Electrolytic capacitors are polarized. Reversing polarity can cause them to vent or fail. The positive lead is longer; the negative lead is marked with a stripe on the capacitor body.
- LEDs are polarity-sensitive. The longer lead is the anode (positive). The flat side of the LED body marks the cathode (negative). A reversed LED will not light but will not be damaged at these current levels.
- Total circuit current is under 100 mA. No heat concerns at 9V.

---

## Classroom Extensions

1. **Color temperature mapping.** Using a spectrometer or diffraction grating, measure the peak wavelength of each LED color. Compare to the actual auroral emission lines: 557.7 nm (oxygen green), 427.8 nm (nitrogen blue), 391.4 nm (nitrogen violet). How close are the LEDs to the real thing? Most green LEDs peak at 520-530 nm — shifted toward cyan compared to the auroral green.

2. **Crossfade tuning.** Replace the 10 KOhm discharge resistors with 47 KOhm. The fade time constant increases from 100 ms to 470 ms — now each LED glows for over a second after its step ends, and 4-5 LEDs overlap simultaneously. Does this look more or less like a real aurora?

3. **Auroral altitude calculation.** The green auroral line requires 0.7 seconds to emit. At what atmospheric density does the mean time between molecular collisions equal 0.7 seconds? Use the kinetic theory formula: collision time = 1 / (n * sigma * v), where n is number density, sigma is the collision cross-section (~10^-19 m^2), and v is the thermal velocity (~500 m/s at 800 K). Solve for n, then use the barometric formula to find the altitude. (Answer: approximately 120 km.)

4. **Power optimization.** Calculate the average power consumption of each LED color group. Which group draws the most power? (The green group, because it has four LEDs vs. three for the others.) If you wanted equal brightness across all colors, what resistor values would you use for each group?

5. **Geomagnetic storm simulation.** During strong solar storms, the aurora intensifies and its curtains move rapidly. Modify the circuit to add a "storm mode": a pushbutton that switches R2 from 100 KOhm to 22 KOhm, increasing the scan rate from 3 Hz to approximately 12 Hz. The LEDs will scan so fast that the crossfade tails blur together, creating a shimmering, chaotic effect — much closer to what Carpenter would have seen from orbit during a substorm.
