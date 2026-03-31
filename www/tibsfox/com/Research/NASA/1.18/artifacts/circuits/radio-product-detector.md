# DIY Radio Circuit: Product Detector — Synchronous SSB/CW Demodulation

## The Circuit

A product detector using the NE602/SA612 balanced mixer as a synchronous demodulator for SSB (Single Sideband) and CW (Morse code) signals. A Beat Frequency Oscillator (BFO) provides the local oscillator input that replaces the missing carrier. This produces clean audio from SSB voice and audible tones from CW signals. This is the eighteenth circuit in the progressive radio series.

**What it does:**
- Takes IF signal (455 kHz) from the IF amplifier chain
- Mixes it with a local BFO signal at or near the IF frequency
- The difference frequency appears as audio (300-3000 Hz)
- For USB (Upper Sideband): BFO at 453.5 kHz (below IF center)
- For LSB (Lower Sideband): BFO at 456.5 kHz (above IF center)
- For CW: BFO offset by 600-800 Hz for audible beat note
- Audio output to amplifier stage
- Superior to envelope detection for SSB/CW: no distortion from missing carrier

**What it teaches:** An AM envelope detector works by following the amplitude peaks of the modulated carrier. This works because the carrier is present — the envelope shape IS the audio. But in SSB, the carrier has been suppressed to save power. Without the carrier, an envelope detector produces unintelligible garble. The product detector solves this by re-inserting the carrier locally via the BFO. The "product" in product detector refers to the mathematical multiplication of the incoming signal with the BFO — the audio is literally the product of these two signals. This is synchronous detection: the output depends on both the amplitude AND the phase relationship between the signal and the local oscillator. Mercury telemetry used product detection for the subcarrier demodulators that extracted biomedical data from the FM/PM telemetry stream.

**Total cost: ~$8**

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
  v1.18 — Product Detector (SSB/CW synchronous demod) ← YOU ARE HERE

The product detector sits between the IF stage and the audio amplifier,
replacing the AM envelope detector for SSB/CW reception:

  Antenna → Tuner → Preamp → Mixer ← LO
                                |
                          Crystal Filter
                                |
                          IF Amplifier
                                |
               ┌──── PRODUCT DETECTOR (THIS CIRCUIT) ────┐
               │              |                           │
               │    ┌─────────┴─────────┐                 │
               │    │                   │                 │
               │  [IF Input]        [BFO Input]           │
               │    │                   │                 │
               │    └───── NE602 ──────┘                  │
               │           │                              │
               │     [Audio Output]                       │
               │           │                              │
               │     Low-pass Filter                      │
               │      (3 kHz cutoff)                      │
               │           │                              │
               │      Audio Amp                           │
               └──────────────────────────────────────────┘

Why product detection is superior for SSB/CW:
  AM envelope detector: output = |signal|
  Product detector:     output = signal × BFO

  For SSB (no carrier): |signal| = garbled mess
  For SSB with product: signal × BFO = clean audio

  For CW (carrier only): |carrier| = DC (silence)
  For CW with product: carrier × BFO = audible beat note
```

---

## Schematic

```
  From IF Amplifier output (455 kHz signal)
         |
    [C_in] 100pF (DC block)
         |
         +──── NE602/SA612 Pin 1 (Input A)
         |
         |     NE602/SA612 Pin 2 (Input B) ── [C_in2] 100pF ── GND
         |     (differential input, B grounded via cap)
         |
         |     Internal balanced mixer multiplies:
         |       Output = Input × Local Oscillator
         |
         |     NE602 Pin 6 (Oscillator input) ←── BFO signal
         |     NE602 Pin 7 (Oscillator feedback)
         |     (BFO from v1.11 circuit, or internal oscillator)
         |
         |     NE602 Pin 4 (Output A)
         |         |
         |    [R_load] 1.5KΩ ── VCC
         |         |
         |    [C_couple] 0.1µF
         |         |
         +──── Audio output (difference frequency)
               |
          [Low-pass Filter]
          R_lp = 10KΩ, C_lp = 4.7nF
          f_cutoff = 1/(2π × 10K × 4.7n) ≈ 3.4 kHz
               |
          To audio amplifier (v1.7)

  NE602 Pin 5 (Output B) ── [1.5KΩ] ── VCC  (balanced, not used)
  NE602 Pin 3 (GND)
  NE602 Pin 8 (VCC) ── +6-8V via [100Ω] decoupling ── [0.1µF] ── GND

BFO Configuration (using NE602 internal oscillator):
  Pin 6 ── [10pF] ── junction
  Pin 7 ── [10pF] ── junction
                        |
                   [Crystal 455 kHz]
                        |
                       GND
                        |
                   [Trimmer Cap 5-30pF] ── Pin 6
                   (pulls crystal frequency for USB/LSB/CW selection)

Alternative: external BFO from v1.11 circuit
  Pin 6 ← [100pF] ← BFO output
  Pin 7 ← [100pF] ← GND

Detailed Component Layout:

  VCC (+6-8V)
    │
   [100Ω]
    │
   [0.1µF]──GND         BFO Crystal
    │                    455 kHz
    │                       │
  Pin 8    Pin 7──[10pF]──┤
    │        │              │
    │      ┌─┴─┐          [Trim 5-30pF]
    │      │602│            │
    │      └─┬─┘          Pin 6
    │        │
  Pin 3    Pin 4──[1.5K]──VCC
   GND       │
           [0.1µF]
             │
           [10KΩ]──┐
             │     [4.7nF]
           Audio    │
           Out     GND

  Pin 1 ← [100pF] ← IF signal (455 kHz + modulation)
  Pin 2 ← [100pF] ← GND
  Pin 5 ← [1.5KΩ] ← VCC (balanced output, unused)
```

## Design Calculations

```
Product detection mathematics:
  IF signal: A(t) × cos(ω_IF × t)
    where A(t) is the SSB audio content

  BFO: cos(ω_BFO × t)

  Product: A(t) × cos(ω_IF × t) × cos(ω_BFO × t)
         = A(t)/2 × [cos((ω_IF - ω_BFO) × t) + cos((ω_IF + ω_BFO) × t)]

  The sum frequency (ω_IF + ω_BFO ≈ 910 kHz) is filtered out.
  The difference frequency (ω_IF - ω_BFO ≈ 0-3 kHz) IS the audio.

BFO frequency settings for 455 kHz IF:
  USB reception: BFO = 453.5 kHz (1.5 kHz below center)
    Audio range: 455 - 453.5 = 1.5 kHz offset
    Passband: 300 Hz to 3 kHz → BFO at 453.2 to 452.0 kHz

  LSB reception: BFO = 456.5 kHz (1.5 kHz above center)
    Audio range: 456.5 - 455 = 1.5 kHz offset
    Passband: inverted sideband selection

  CW reception: BFO = 455.7 kHz (700 Hz offset)
    CW carrier at 455 kHz × BFO at 455.7 kHz = 700 Hz beat note
    Standard CW pitch for comfortable listening

NE602 specifications:
  Supply: 4.5-8V, typically 6V
  Current: 2.5 mA
  Conversion gain: +14 dB (signal comes out stronger!)
  Noise figure: 5 dB at 45 MHz
  Input impedance: 1.5 KΩ (pins 1-2)
  Max input: -17 dBm (about 30 mV RMS)

Audio low-pass filter:
  f_c = 1 / (2π × R × C) = 1 / (2π × 10K × 4.7nF) ≈ 3,390 Hz
  Rolls off above voice band, suppresses sum frequency and IF leakage
```

## Parts List

| Qty | Part | Cost |
|-----|------|------|
| 1 | NE602/SA612 balanced mixer IC | $2.50 |
| 1 | 455 kHz crystal (BFO) | $0.80 |
| 1 | 5-30 pF trimmer capacitor (BFO tuning) | $0.50 |
| 3 | 100 pF ceramic capacitors (coupling) | $0.15 |
| 2 | 10 pF ceramic capacitors (crystal) | $0.10 |
| 1 | 0.1 µF ceramic capacitor (output coupling) | $0.05 |
| 1 | 0.1 µF ceramic capacitor (power decoupling) | $0.05 |
| 1 | 4.7 nF ceramic capacitor (audio LPF) | $0.05 |
| 2 | 1.5 KΩ resistors (output loads) | $0.10 |
| 1 | 10 KΩ resistor (audio LPF) | $0.05 |
| 1 | 100 Ω resistor (power decoupling) | $0.05 |
| 1 | 8-pin DIP socket (for NE602) | $0.10 |
| 1 | Small breadboard section | $1.00 |
| -- | Jumper wires | $0.50 |
| **Total** | | **~$8** |

## Why Product Detection Matters

Before product detection, receiving SSB signals required a regenerative detector that was difficult to tune and prone to squealing. The NE602/SA612 made product detection accessible: a single 8-pin IC replaces what used to be a transformer-coupled balanced mixer requiring careful matching.

The mathematical elegance is the point: multiplication in the time domain produces sum and difference frequencies. This is exactly what Fourier analysis predicts. The mixer doesn't "know" about USB or LSB — it simply multiplies. The BFO frequency determines which sideband becomes the audio output. Move the BFO 3 kHz and the same circuit switches from upper to lower sideband reception.

For Mercury telemetry, the principle was identical but at different frequencies. The biomedical subcarriers (FM signals carrying heart rate, respiration, temperature) were demodulated using product detection in the ground station receivers. Each subcarrier had its own frequency offset, and a bank of product detectors — each with a different local oscillator — separated them into individual data channels.

Enos's heartbeat, transmitted from orbit, was recovered from the telemetry stream by exactly this kind of multiplication: the subcarrier signal times the local oscillator equals the biomedical data.

---

## Classroom Extensions

1. **Frequency math:** If the IF is 455 kHz and you want a 1 kHz audio tone from a CW signal at 455 kHz, where do you set the BFO? (454 kHz or 456 kHz — both work, producing 1 kHz from opposite sides)
2. **Build comparison:** Connect this product detector and the v1.6 envelope detector to the same IF chain. Switch between them while tuning across an SSB signal. The envelope detector produces garble; the product detector produces clear voice.
3. **Carrier suppression:** Why does SSB suppress the carrier? (The carrier contains 2/3 of the transmitted power but carries zero information. Removing it means all transmitter power goes into the information-carrying sideband.)
4. **Telemetry channels:** Mercury used 7 biomedical subcarriers. If each needs its own product detector, how many NE602 chips would the ground station need? (7 — one per channel)
