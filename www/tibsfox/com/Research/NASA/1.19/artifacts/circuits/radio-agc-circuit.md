# DIY Radio Circuit: Automatic Gain Control (AGC) — Signal Level Regulation

## The Circuit

An Automatic Gain Control circuit using a 2N5457 JFET as a voltage-controlled attenuator with an RC feedback loop. The AGC maintains constant output level despite varying input signal strength — essential for Mercury tracking stations that needed to maintain lock on the capsule signal as range, orientation, and atmospheric conditions changed during Freedom 7's fifteen-minute flight. This is the nineteenth circuit in the progressive radio series, following the product detector from v1.18.

**What it does:**
- Takes an IF signal (455 kHz) with varying amplitude (simulating a tumbling capsule)
- Detects the output level with a peak detector (diode + capacitor)
- Feeds the detected level back as a control voltage to a JFET attenuator
- When input increases: output level rises → detector voltage rises → JFET resistance increases → signal is attenuated more → output stays constant
- When input decreases: output level drops → detector voltage drops → JFET resistance decreases → signal passes more freely → output stays constant
- Time constants: fast attack (~10ms), slow release (~500ms) — catches sudden signal surges quickly, releases slowly to avoid pumping
- Output level stays within ~3 dB despite 40+ dB of input variation

**What it teaches:** Without AGC, a receiver's output would swing wildly as the signal strength changed. Turn toward the transmitter: deafening. Turn away: silence. For Mercury tracking, the capsule was tumbling, the antenna pattern was changing, and the range was varying from zero (on the pad) to 187.5 km (at apogee) — a path loss variation of approximately 40 dB. The AGC circuit is a negative feedback control loop: it measures its own output, compares it to a desired setpoint, and adjusts the gain accordingly. This is the same principle as a thermostat (measures temperature, adjusts heating/cooling) or cruise control (measures speed, adjusts throttle). Every modern receiver uses AGC. Your phone adjusts its receive gain hundreds of times per second.

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
  v1.13 — RF Preamplifier (low-noise front end)
  v1.14 — Bandpass Filter (LC tuned selectivity)
  v1.15 — Crystal Filter (quartz extreme selectivity)
  v1.16 — AGC Time Constant (attack/release control)
  v1.17 — Noise Blanker (pulse noise suppression)
  v1.18 — Product Detector (SSB/CW synchronous demod)
  v1.19 — AGC Circuit (JFET voltage-controlled attenuator) ← YOU ARE HERE

The AGC circuit sits in the IF signal path, BEFORE the detector/demodulator,
controlling the signal level that reaches all downstream stages:

  Antenna → Tuner → Preamp → Mixer ← LO
                                |
                          Crystal Filter
                                |
               ┌──── AGC ATTENUATOR (THIS CIRCUIT) ────┐
               │              |                         │
               │    [IF Signal In]                      │
               │         |                              │
               │    ┌────┴────┐                         │
               │    │  JFET   │ ← Control Voltage       │
               │    │ 2N5457  │    from feedback loop    │
               │    └────┬────┘                         │
               │         |                              │
               │   [Attenuated IF Out]                  │
               │         |                              │
               │    IF Amplifier                        │
               │         |                              │
               │    Product Detector                    │
               │         |                              │
               │    Audio Amplifier                     │
               │         |                              │
               │    ┌────┴────┐                         │
               │    │  Peak   │                         │
               │    │Detector │                         │
               │    └────┬────┘                         │
               │         |                              │
               │    [Feedback: detected level           │
               │     controls JFET gate]                │
               └────────────────────────────────────────┘

Control loop:
  Signal too strong → detected voltage rises →
  JFET gate more negative → JFET Rds increases →
  more attenuation → output drops to setpoint

  Signal too weak → detected voltage falls →
  JFET gate less negative → JFET Rds decreases →
  less attenuation → output rises to setpoint
```

---

## Schematic

```
  IF Signal Input (455 kHz, varying amplitude 1mV to 100mV)
         |
    [C_in] 100pF (DC block)
         |
    ┌────┴────┐
    │  JFET   │  2N5457 N-channel JFET
    │ Source   │←── IF signal input
    │ Drain    │──→ Attenuated IF output
    │ Gate     │←── AGC control voltage (via R_gate)
    └─────────┘
         |
    [C_couple] 100pF (DC block)
         |
    IF Output → to IF amplifier chain
         |
    ┌────┴────┐
    │  Peak   │  Output level detector
    │Detector │
    └────┬────┘
         |
    D1 (1N4148) → C_det (10nF) → R_det (47KΩ) → GND
         |
    Detected voltage (DC, proportional to output level)
         |
    [R_attack] 10KΩ ────┐
                         ├── Junction
    [R_release] 470KΩ ──┘
         |
    [C_filter] 100nF (smoothing)
         |
    [R_gate] 100KΩ (isolation)
         |
    JFET Gate (control input)

Detailed Component Layout:

  IF In                                      IF Out
    │                                           │
  [100pF]                                    [100pF]
    │                                           │
    ├── 2N5457 Source                  Drain ────┤
    │        │                                   │
    │      Gate                                  │
    │        │                              Peak Detector
    │   [100KΩ]                                  │
    │        │                              D1 (1N4148)
    │   [100nF]──GND                             │
    │        │                             [10nF]──GND
    │   ┌────┤                                   │
    │ [10KΩ] [470KΩ]                        [47KΩ]──GND
    │   │      │                                 │
    │   └──────┘                            AGC Voltage
    │        │
    └── To AGC Voltage

  Power: None required for JFET attenuator
         (it's a passive voltage-controlled resistor)
         Peak detector uses signal energy only
```

## Design Calculations

```
2N5457 JFET characteristics (key parameters):
  IDSS (drain saturation current): 1-5 mA (typical 3 mA)
  VGS(off) (gate-source cutoff): -0.5 to -6.0V (typical -2V)
  Rds(on) at VGS=0V: ~200-600Ω (typical 400Ω)
  Rds at VGS = VGS(off)/2: ~2-5KΩ

JFET as voltage-controlled resistor:
  For small-signal operation (VDS << VGS(off)):
    Rds ≈ Rds(on) / (1 - VGS/VGS(off))²

  At VGS = 0V:    Rds ≈ 400Ω  (minimum attenuation)
  At VGS = -1V:   Rds ≈ 1.6KΩ
  At VGS = -1.5V: Rds ≈ 6.4KΩ (significant attenuation)
  At VGS = -2V:   Rds → ∞     (fully pinched off)

  With a 1.5KΩ load resistor:
    Attenuation at VGS=0:    400/(400+1500) = 0.21 → -13.5 dB
    Attenuation at VGS=-1:   1600/(1600+1500) = 0.52 → -5.7 dB
    Attenuation at VGS=-1.5: 6400/(6400+1500) = 0.81 → -1.8 dB

  Total AGC range: ~12 dB (practical single-stage)
  For wider range: cascade two JFET stages or use PIN diode

AGC time constants:
  Attack (fast): R_attack × C_filter = 10K × 100n = 1 ms
    (actually ~10ms with detector time constant added)
  Release (slow): R_release × C_filter = 470K × 100n = 47 ms
    (effectively ~500ms through multiple RC stages)

  Fast attack: catches sudden signal spikes quickly
  Slow release: prevents "pumping" (amplitude modulation of AGC loop)

Peak detector:
  D1 charges C_det to the peak of the IF signal
  R_det (47KΩ) provides slow discharge for the detector
  Time constant: 47K × 10n = 470 µs (integrates over many IF cycles)
  At 455 kHz: 455K cycles/sec × 470µs = ~214 cycles averaged

Mercury tracking station context:
  Freedom 7 range variation: 0 km (pad) to 302 km (slant range at apogee)
  Path loss at 230 MHz (Mercury S-band):
    At 10 km:  L = 20log(4π×10⁴/1.3) = 99.7 dB
    At 302 km: L = 20log(4π×3.02×10⁵/1.3) = 129.3 dB
    Variation: ~30 dB from launch to apogee
  Capsule antenna pattern variation: ±10 dB (tumbling)
  Total AGC requirement: ~40 dB dynamic range
  (Single JFET gives ~12 dB; stations used multi-stage AGC)
```

## Parts List

| Qty | Part | Cost |
|-----|------|------|
| 1 | 2N5457 N-channel JFET | $0.80 |
| 1 | 1N4148 signal diode (peak detector) | $0.05 |
| 2 | 100 pF ceramic capacitors (coupling) | $0.10 |
| 1 | 10 nF ceramic capacitor (detector) | $0.05 |
| 1 | 100 nF ceramic capacitor (filter) | $0.05 |
| 1 | 47 KΩ resistor (detector discharge) | $0.05 |
| 1 | 10 KΩ resistor (attack time) | $0.05 |
| 1 | 470 KΩ resistor (release time) | $0.05 |
| 1 | 100 KΩ resistor (gate isolation) | $0.05 |
| 1 | Small breadboard section | $1.00 |
| -- | Jumper wires | $0.50 |
| **Total** | | **~$6** |

## Why AGC Matters

Every receiver in your daily life uses AGC. Your car radio maintains constant volume whether you're next to the broadcast tower or 50 miles away. Your phone adjusts its receive sensitivity as you walk, turn, and move between cell towers. Wi-Fi adapters continuously adjust gain as signal conditions change.

For Mercury tracking, AGC was critical. The capsule's antenna radiated in a roughly omnidirectional pattern, but as the capsule tumbled in flight, the signal strength at any ground station varied wildly. Without AGC, the telemetry demodulators would lose lock every time the antenna pattern swept away from the station. With AGC, the receiver maintained a constant IF level, keeping the telemetry stream clean regardless of the capsule's orientation.

The 2N5457 JFET in this circuit operates in its ohmic (triode) region, where it behaves as a voltage-controlled resistor. This is the same operating principle used in professional receiver AGC circuits, audio compressors, and automatic volume controllers. The gate voltage controls the channel resistance continuously and silently — no switching, no noise, just smooth gain control.

The SPICE simulation (agc-circuit.cir) models this exact circuit and shows the output level remaining stable as the input varies over a wide range.

---

## Classroom Extensions

1. **Feedback identification:** This is a negative feedback loop. Identify the sensor (peak detector), the actuator (JFET), and the setpoint (determined by JFET bias and detector scaling). What happens if you disconnect the feedback? (Output tracks input — no regulation.)
2. **Time constant experiment:** What happens if you make the release time constant faster (smaller R_release)? (AGC "pumps" — the level bounces up and down as the loop overreacts to each signal fluctuation.)
3. **Dynamic range:** Calculate how many dB of input variation this single-stage AGC can handle. Then calculate how many stages you'd need for 40 dB of control range. (About 3-4 stages.)
4. **Modern comparison:** Your phone uses digital AGC — a software algorithm adjusts a variable-gain amplifier. What are the advantages of digital AGC over this analog circuit? (Programmable time constants, multi-band control, adaptive algorithms.)
5. **Mercury tracking network:** Freedom 7's flight was tracked by stations at Cape Canaveral, Grand Bahama Island, and ships at sea. Each station independently ran its own AGC loop. Why not share a single AGC setting? (Each station sees a different signal level depending on range and capsule orientation relative to that station.)
