# DIY Radio Circuit: RF Preamplifier — Low-Noise Front End

## The Circuit

A single-stage common-emitter RF preamplifier using a BF199 (or 2N3904) transistor, designed to amplify weak signals at the antenna input before they reach the mixer. This is the thirteenth circuit in the progressive radio series, and it addresses the most critical problem in weak-signal reception: the first stage sets the noise figure for the entire receiver chain. A good preamplifier with 15-20 dB gain and a noise figure below 3 dB can mean the difference between hearing a signal and hearing nothing.

This is the circuit Pioneer 5's ground station engineers understood instinctively: when your signal is 10⁻¹⁹ watts, the front-end amplifier is everything.

**What it does:**
- A BF199 NPN transistor (or 2N3904) in common-emitter configuration
- Tuned input: a parallel LC tank at the antenna input provides selectivity
- Gain: ~18 dB (×8 voltage) at the design frequency
- Noise figure: ~2.5 dB (BF199) or ~4 dB (2N3904)
- Bias: voltage-divider bias with emitter degeneration for stability
- Decoupling: the emitter resistor is RF-bypassed, DC stabilized
- Output: through a coupling capacitor to the next stage (mixer or filter)

**What it teaches:** In any receiver, the first amplifier stage dominates the system noise figure. Friis's formula shows why: NF_total = NF₁ + (NF₂-1)/G₁ + (NF₃-1)/(G₁×G₂) + ... The noise of later stages is divided by the gain of the first stage. So a high-gain, low-noise first stage "drowns out" the noise contributions of everything that follows. This is why deep-space communication receivers use cryogenic preamplifiers — cooling the first-stage transistor to 15K reduces its thermal noise by a factor of 20. Pioneer 5's ground receivers at Jodrell Bank and the DSN used parametric amplifiers (early low-noise technology) to achieve noise temperatures below 100K.

**Total cost: ~$6**

---

## The Progressive Radio Chain (Series Context)

```
Radio Series Progress:
  v1.2  — Transmitter (oscillator → antenna)
  v1.3  — Receiver (antenna → detector → audio)
  v1.4  — Mixer (RF + LO → IF)
  v1.5  — IF Amplifier (IF → amplified, filtered IF)
  v1.6  — AM Detector/Demodulator
  v1.7  — Audio Amplifier + Speaker Driver
  v1.8  — Noise Blanker / Impulse Filter
  v1.9  — AGC (Automatic Gain Control)
  v1.10 — S-Meter (signal strength indicator)
  v1.11 — BFO (Beat Frequency Oscillator for CW/SSB)
  v1.12 — Antenna Tuner (L-network impedance matching)
  v1.13 — RF Preamplifier (low-noise front end)  ← YOU ARE HERE

The preamplifier sits between the antenna tuner and the mixer:
  Antenna → Tuner → PREAMP (THIS CIRCUIT) → Mixer ← LO
                                                ↓
                                          IF Amplifier
                                                ↓
                                          Detector ← BFO
                                                ↓
                                           Audio Amp → Speaker

Without preamp:
  Antenna → Mixer (NF ~10 dB) → everything sees mixer noise
  Weak signals below mixer's noise floor are lost

With preamp:
  Antenna → Preamp (NF ~2.5 dB, G ~18 dB) → Mixer
  System NF ≈ 2.5 + (10-1)/63 ≈ 2.6 dB — dramatically better
  Weak signals are now above the noise floor

Pioneer 5 ground station chain:
  26m dish → parametric preamp (NF ~1.5 dB) → mixer → IF → ...
  The parametric amplifier was the 1960 equivalent of our BF199.
  Same principle, different technology: low noise at the front end.
```

## Schematic

```
                          +9V
                           │
                           R3 (1K)
                           │
        ┌──────────────────┤
        │                  │
        │               ┌──┴──┐
        │          C3 ──┤     ├── C4 ── OUTPUT
        │         (RFC) │BF199│  (100nF)
        │               │ NPN │
        │               └──┬──┘
        │                  │
        │                  R4 (220Ω)
        │                  │
        │              ┌───┤
        │              │   │
        │             C5   R5 (1K)
        │            (10nF) │
        │              │   │
        │              GND GND
        │
   C1   │   L1
INPUT ──┤───┤├───┐
(ant) (100pF)    │
        │        │
        │      ┌─┤
        │      │ C2
        │      │(47pF)
        │      │ │
        R1     │ GND
       (47K)   │
        │      │
        ├──────┘
        │
        R2 (10K)
        │
       GND


Component Identification:
  R1 (47K)  — Base bias upper (voltage divider)
  R2 (10K)  — Base bias lower (voltage divider)
  R3 (1K)   — Collector load resistor
  R4 (220Ω) — Emitter DC stabilization
  R5 (1K)   — Additional emitter degeneration (optional)
  C1 (100pF)— Input coupling / DC block
  C2 (47pF) — Tuning capacitor (with L1 forms input tank)
  C3 (RFC)  — RF choke (or 100nF bypass)
  C4 (100nF)— Output coupling capacitor
  C5 (10nF) — Emitter RF bypass (shorts AC to ground)
  L1        — Input tuning inductor (see below)

Tuned Input:
  L1 and C2 form a parallel resonant circuit at the desired frequency.
  At resonance, impedance is maximum → maximum voltage developed →
  maximum signal to the transistor base.

  For 7 MHz:  L1 = 10.4 µH, C2 = 47 pF
  For 14 MHz: L1 = 2.6 µH, C2 = 47 pF
  For 3.5 MHz: L1 = 41.5 µH, C2 = 47 pF

  f = 1 / (2π√(LC))
```

## Arduino Code (Sketch) — Bias Point Calculator

```cpp
// RF Preamplifier — Bias Point Calculator and Monitor
// Reads the collector voltage and calculates operating point.
// Use this to verify the transistor is properly biased.

#define V_COLLECTOR A0
#define V_EMITTER   A1
#define V_SUPPLY    9.0

void setup() {
  Serial.begin(9600);
  Serial.println("BF199 RF Preamplifier — Bias Point Monitor");
  Serial.println("Connect A0 to collector, A1 to emitter (through 100K)");
  Serial.println("Supply voltage: 9V");
}

void loop() {
  float v_c = analogRead(V_COLLECTOR) * 5.0 / 1023.0;
  float v_e = analogRead(V_EMITTER) * 5.0 / 1023.0;

  // Scale for voltage divider probes (100K/100K = ×2)
  v_c *= 2.0;
  v_e *= 2.0;

  float v_ce = v_c - v_e;
  float i_c = (V_SUPPLY - v_c) / 1000.0;  // Through R3 (1K)
  float i_e = v_e / 220.0;                 // Through R4 (220Ω)

  Serial.print("Vc="); Serial.print(v_c, 2); Serial.print("V  ");
  Serial.print("Ve="); Serial.print(v_e, 2); Serial.print("V  ");
  Serial.print("Vce="); Serial.print(v_ce, 2); Serial.print("V  ");
  Serial.print("Ic="); Serial.print(i_c * 1000, 1); Serial.print("mA  ");

  // Check bias point
  if (v_ce > 2.0 && v_ce < 7.0 && i_c > 0.001 && i_c < 0.01) {
    Serial.println("BIAS OK — active region");
  } else if (v_ce < 0.3) {
    Serial.println("WARNING — saturated! Reduce R1 or increase R2");
  } else if (v_ce > 8.0) {
    Serial.println("WARNING — cutoff! Increase R1 or reduce R2");
  } else {
    Serial.println("Check bias point");
  }

  delay(500);
}
```

## Parts List

| Qty | Part                    | Cost     | Notes                                  |
|-----|-------------------------|----------|----------------------------------------|
| 1   | BF199 NPN transistor    | $0.30    | Or 2N3904 (higher noise but cheaper)   |
| 1   | 47K resistor (R1)       | $0.05    | Base bias upper                        |
| 1   | 10K resistor (R2)       | $0.05    | Base bias lower                        |
| 1   | 1K resistor (R3)        | $0.05    | Collector load                         |
| 1   | 220Ω resistor (R4)      | $0.05    | Emitter stabilization                  |
| 1   | 100pF capacitor (C1)    | $0.10    | Input coupling                         |
| 1   | 47pF capacitor (C2)     | $0.10    | Tuning (with L1)                       |
| 1   | 100nF capacitor (C4)    | $0.05    | Output coupling                        |
| 1   | 10nF capacitor (C5)     | $0.05    | Emitter bypass                         |
| 1   | Inductor (L1)           | $0.50    | Tuning — value depends on freq         |
| 1   | Breadboard (quarter)    | $1.50    | Mounting                               |
| 1   | 9V battery + clip       | $2.00    | Power supply                           |
| 1   | Jumper wire kit         | $1.50    | Connections                            |
|     |                         | **$6.30**|                                        |

## The Noise Figure Story

### Why the First Stage Matters

Friis's formula for cascaded noise figure:

```
NF_total = NF₁ + (NF₂ - 1)/G₁ + (NF₃ - 1)/(G₁ × G₂) + ...

where NF and G are in linear (not dB) units.

Example without preamp:
  Stage 1: Mixer (NF = 10 dB = 10×, G = -6 dB = 0.25×)
  Stage 2: IF amp (NF = 6 dB = 4×, G = 30 dB = 1000×)
  NF_total = 10 + (4-1)/0.25 = 10 + 12 = 22 = 13.4 dB

Example WITH preamp:
  Stage 1: Preamp (NF = 2.5 dB = 1.78×, G = 18 dB = 63×)
  Stage 2: Mixer (NF = 10 dB = 10×, G = -6 dB = 0.25×)
  Stage 3: IF amp (NF = 6 dB = 4×, G = 30 dB = 1000×)
  NF_total = 1.78 + (10-1)/63 + (4-1)/(63×0.25)
           = 1.78 + 0.14 + 0.19 = 2.11 = 3.2 dB

Improvement: 13.4 dB → 3.2 dB = 10.2 dB better sensitivity!
That's a 10× improvement in signal detection threshold.
```

### Pioneer 5's Ground Receivers

Pioneer 5's signals were received by:
- **Jodrell Bank** (UK): 76m dish, parametric amplifier, NF ~2 dB
- **DSN Goldstone** (CA): 26m dish, maser preamplifier, NF ~1.5 dB
- **Cape Canaveral**: smaller dishes for near-Earth phase

The parametric amplifiers and masers were the 1960 equivalent of our BF199 — devices engineered specifically for minimum noise at the front end. The maser (Microwave Amplification by Stimulated Emission of Radiation) achieves noise temperatures below 10K, equivalent to a noise figure below 0.15 dB. Modern deep-space receivers use HEMT (High Electron Mobility Transistor) amplifiers cooled to 15K, achieving system noise temperatures of 18-25K.

The principle hasn't changed since 1960: put the quietest amplifier first.

## Why This Matters

When Pioneer 5 was 36.2 million kilometers away, its 5-watt signal arrived at Earth's antenna with a power of approximately 10⁻¹⁹ watts. At that level, the noise generated by the receiver's own electronics could easily mask the signal. The preamplifier's job is to amplify the signal before the noise gets added — to establish the signal's presence above the thermal noise floor in the very first stage.

This is the same challenge faced by radio astronomers listening for quasars, by SETI researchers scanning for extraterrestrial signals, and by anyone trying to pull meaning from noise. The breadcrumb sponge (Halichondria panicea) is the biological preamplifier: its flagellated choanocyte cells create current that draws water through the sponge's channels, concentrating dilute nutrients. The sponge's first stage of filtration — the ostia (incurrent pores) — determines what enters the system. Everything downstream depends on what the front end captures.

First stage sets the noise floor. For Pioneer 5, for the radio, for the sponge.
