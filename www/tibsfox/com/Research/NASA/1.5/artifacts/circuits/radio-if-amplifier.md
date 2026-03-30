# DIY Radio Circuit: IF Amplifier at 455 kHz

## The Circuit

A single-stage common-emitter amplifier with a tuned LC collector circuit resonant at 455 kHz — the standard intermediate frequency used in AM radio receivers worldwide. This is the fourth circuit in the progressive radio series: v1.2 built the transmitter, v1.3 built the receiver, v1.4 built the frequency mixer, and v1.5 builds the IF amplifier that takes the mixer's output and amplifies it with selectivity.

The IF amplifier is the reason you can tune a radio to one station and not hear the others. The mixer produces an intermediate frequency, but it also produces images, spurious mixing products, and noise from adjacent channels. The IF amplifier selects only the desired 455 kHz signal and amplifies it by ~20 dB while rejecting everything else. This is how Pioneer 4's ground stations pulled a 180-milliwatt signal out of the cosmic background noise across 655,300 km.

**What it does:**
- Feed the output of the v1.4 mixer circuit (or any 455 kHz signal source) into the input
- The LC tank circuit in the collector resonates at 455 kHz, providing ~20 dB gain at that frequency
- Signals away from 455 kHz see much lower gain (rejected by the tank's selectivity)
- The bandwidth is approximately 6 kHz (Q of ~75), sufficient for AM voice
- Output connects to a detector/demodulator (future v1.6 circuit) or directly to headphones through a coupling capacitor

**What it teaches:** Every superheterodyne receiver — from a 1930s tabletop AM radio to the DSN receivers that tracked Pioneer 4 — uses IF amplification. The principle is the same at every scale: convert the incoming signal to a fixed intermediate frequency using a mixer, then amplify and filter at that fixed frequency. The IF stage provides the receiver's selectivity (ability to reject adjacent channels) and most of its gain. By operating at a fixed frequency, the tuned circuits can be optimized once and work for every station — the mixer does the frequency translation, and the IF amplifier does the hard work of filtering and amplification.

**Total cost: ~$16**

---

## The Superheterodyne Chain (Series Context)

```
Radio Series Progress:
  v1.2 — Transmitter (oscillator → antenna)
  v1.3 — Receiver (antenna → detector → audio)
  v1.4 — Mixer (RF + LO → IF)
  v1.5 — IF Amplifier (IF → amplified, filtered IF) ← YOU ARE HERE
  v1.6 — [planned] AM detector/demodulator
  v1.7 — [planned] Audio amplifier + speaker driver

The complete superheterodyne signal chain:
  Antenna → RF amplifier → Mixer ← Local Oscillator
                              ↓
                        IF Amplifier (455 kHz) ← THIS CIRCUIT
                              ↓
                        Detector (envelope)
                              ↓
                        Audio Amplifier → Speaker

Pioneer 4's ground station (Goldstone, Cape Canaveral):
  26m dish → LNA → Mixer ← Synthesized LO
                       ↓
                 IF chain (multiple stages, much narrower bandwidth)
                       ↓
                 Phase-locked loop detector
                       ↓
                 Telemetry decoder → Radiation data
```

## Schematic

```
                        +9V
                         |
                    L1 (inductor)
                    220 uH
                         |
                    +----+----+
                    |         |
                    C1        |
                   47 pF      |
                    |         |
                    +----+----+
                         |
                    Collector
                         |
    Input ───┐      2N3904 (NPN)
             │           |
            C_in     Emitter
            10nF         |
             │          R_E
             └──────── 100R
                  |      |
                 R_B1   C_E
                 47K    10uF ──── GND
                  |
                  +──── Base
                  |
                 R_B2
                 10K
                  |
                 GND

    Output taken from collector through coupling capacitor:

                    Collector ──── C_out (10nF) ──── Output
```

## Component Details

### The LC Tank Circuit (L1 + C1)

The resonant frequency of an LC circuit is:

```
f_resonant = 1 / (2 * pi * sqrt(L * C))

For 455 kHz:
  L1 = 220 uH (standard inductor value)
  C1 = 47 pF  (closest standard value)

  f = 1 / (2 * pi * sqrt(220e-6 * 47e-12))
  f = 1 / (2 * pi * sqrt(10.34e-15))
  f = 1 / (2 * pi * 3.216e-6)
  f = 1 / (20.21e-6)
  f ≈ 495 kHz

  To tune exactly to 455 kHz, add a small trimmer capacitor
  (5-60 pF) in parallel with C1 and adjust.

  With C1 = 47 pF + C_trim = ~8 pF → C_total ≈ 55 pF:
  f = 1 / (2 * pi * sqrt(220e-6 * 55e-12)) ≈ 457 kHz ✓
```

The Q (quality factor) of the tank determines selectivity:

```
Q = 2 * pi * f * L / R_coil

For a typical 220 uH inductor with R_coil = 8 ohms:
  Q = 2 * pi * 455000 * 220e-6 / 8
  Q ≈ 79

Bandwidth = f / Q = 455000 / 79 ≈ 5.8 kHz

This means the amplifier passes signals within ±2.9 kHz of 455 kHz
and attenuates signals outside this window. At ±10 kHz from center,
the attenuation is approximately 15 dB. At ±20 kHz, approximately 22 dB.
This is how the receiver rejects adjacent channels.
```

### The Transistor (2N3904)

```
Operating point (DC bias):
  V_CC = 9V
  R_B1 = 47K (base to V_CC)
  R_B2 = 10K (base to ground)

  V_base = V_CC * R_B2 / (R_B1 + R_B2) = 9 * 10/57 ≈ 1.58V
  V_emitter = V_base - 0.7V ≈ 0.88V
  I_C ≈ I_E = V_emitter / R_E = 0.88 / 100 = 8.8 mA

  Transconductance: g_m = I_C / V_T = 8.8e-3 / 0.026 = 338 mA/V

  Voltage gain at resonance:
  A_v = -g_m * Z_tank(at resonance)
  Z_tank ≈ Q * 2 * pi * f * L = 79 * 2 * pi * 455000 * 220e-6
  Z_tank ≈ 49.7K ohms

  But the transistor output impedance and load reduce this.
  Practical gain: ~15-25 dB at 455 kHz (20 dB typical)
```

### The Bypass Capacitor (C_E)

```
C_E (10 uF) bypasses R_E at signal frequencies:
  X_C at 455 kHz = 1 / (2 * pi * 455000 * 10e-6) = 0.035 ohms

  This effectively shorts R_E for AC signals, giving maximum gain.
  Without C_E, the gain drops to A_v = -g_m * Z_tank / (1 + g_m * R_E)
  ≈ -g_m * Z_tank / 34.8 ≈ only about 0.5 dB. The bypass is essential.
```

## Pioneer 4 Connection

Pioneer 4's ground stations used multiple cascaded IF amplifier stages to achieve the extraordinary selectivity and gain needed to detect a 180-milliwatt signal across 655,300 km. The receiver chain looked approximately like:

```
Pioneer 4 Ground Station IF Chain (simplified):
  Mixer output (10.7 MHz IF typical for that era)
    → 1st IF amp (20 dB gain, ~50 kHz BW)
    → 2nd IF amp (20 dB gain, ~10 kHz BW)
    → 3rd IF amp (20 dB gain, ~1 kHz BW)
    → Phase-locked loop (extremely narrow, ~10 Hz effective BW)

  Total IF gain: ~60 dB (1000x voltage)
  Total selectivity: ~10 Hz bandwidth at the PLL stage
  This extreme selectivity is how 180 mW was detected at 655,300 km.

Our single-stage circuit provides:
  1 stage, ~20 dB gain, ~6 kHz bandwidth
  Scale model of the principle. Same physics, different precision.
```

## Testing Procedure

1. **DC bias check (no signal).** Power on, measure:
   - V_base: should be ~1.5-1.7V
   - V_emitter: should be ~0.8-1.0V
   - V_collector: should be ~4-6V (mid-supply)
   - I_C: should be ~7-10 mA

2. **Signal injection.** Use the v1.4 mixer circuit output, or a function generator set to 455 kHz, 10 mV p-p.

3. **Measure gain at resonance.** Compare input and output amplitude at 455 kHz. Should see 10-20x voltage gain (20-26 dB).

4. **Measure selectivity.** Sweep the input frequency from 400 kHz to 510 kHz. The output should peak sharply at ~455 kHz and roll off on both sides. Plot the response curve — it should be a clear bell shape centered on 455 kHz.

5. **Tune the tank.** If the peak is not at 455 kHz, adjust the trimmer capacitor (if installed) or swap C1 for a different value. The peak should be within ±5 kHz of 455 kHz.

6. **Connect to v1.4 mixer.** Feed the mixer's IF output into this amplifier's input. The combined chain (mixer + IF amp) should show a clearly amplified, filtered 455 kHz signal. Adjacent mixing products should be visibly attenuated.

## Bill of Materials

| Qty | Component | Value/Type | Purpose | Cost |
|-----|-----------|------------|---------|------|
| 1 | 2N3904 | NPN transistor | Amplifier | $0.10 |
| 1 | Inductor | 220 uH, axial | LC tank inductance | $0.80 |
| 1 | Capacitor | 47 pF, ceramic | LC tank capacitance | $0.05 |
| 1 | Trimmer cap | 5-60 pF | Fine tuning | $0.50 |
| 2 | Capacitor | 10 nF (0.01 uF), ceramic | Input/output coupling | $0.06 |
| 1 | Capacitor | 10 uF, electrolytic | Emitter bypass | $0.05 |
| 1 | Capacitor | 100 nF, ceramic | Supply decoupling | $0.03 |
| 1 | Resistor | 47K, 1/4W | Base bias (upper) | $0.02 |
| 1 | Resistor | 10K, 1/4W | Base bias (lower) | $0.02 |
| 1 | Resistor | 100R, 1/4W | Emitter degeneration | $0.02 |
| 1 | 9V battery clip | Standard | Power | $0.50 |
| 1 | Breadboard | Half-size | Assembly | $3.00 |
| 1 | Wire kit | 22 AWG solid | Connections | $2.00 |
| | | | **Total** | **~$7.15** |

*(Add a 9V battery: ~$4-5. Oscilloscope or multimeter needed for tuning. Total with battery: ~$12-13. Add $4-5 for the v1.4 mixer input source if needed: ~$16-18 total for the combined chain.)*

## The Selectivity Lesson

The IF amplifier's LC tank is a physical implementation of a bandpass filter. It selects one frequency and rejects all others. This is the same principle at work in:

- **Pioneer 4's ground station:** selecting the 960 MHz signal from cosmic noise
- **A Douglas-fir's bark:** selecting which organisms can colonize its surface (thick bark = selective filter against fire, thin bark = transparent to colonization)
- **The Red-breasted Nuthatch's ear:** neurally tuned to its species' call frequency band, filtering conspecific calls from forest noise
- **Alexander Graham Bell's telephone:** the carbon microphone selectively transduced voice frequencies (300-3400 Hz) while rejecting DC and high-frequency noise

Every communication system includes a filter. The IF amplifier is where the radio receiver's filter lives. It is the ear of the receiver — tuned to hear one voice in a crowd.
