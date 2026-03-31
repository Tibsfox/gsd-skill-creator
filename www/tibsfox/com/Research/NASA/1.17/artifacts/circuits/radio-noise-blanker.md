# DIY Radio Circuit: Noise Blanker — Impulse Noise Suppression

## The Circuit

A noise blanker that detects and suppresses impulse noise — the sharp clicks and pops from car ignitions, electric motors, light switches, and other electrical transients that plague AM/shortwave reception. Uses a dual-gate MOSFET or diode gate to momentarily mute the audio path when a noise pulse is detected. This is the seventeenth circuit in the progressive radio series.

**What it does:**
- Detects impulse noise pulses (duration < 1 ms, amplitude > signal)
- Gates the audio path OFF for the duration of the pulse
- Audio resumes immediately after the pulse passes
- Adjustable threshold: how strong a pulse must be to trigger blanking
- Adjustable blanking width: how long to mute (0.5-5 ms)
- LED indicator blinks with each blanked pulse
- Dramatically improves reception near ignition noise sources

**What it teaches:** Impulse noise is fundamentally different from continuous noise. A continuous noise floor (thermal noise, atmospheric static) can be reduced by narrowing bandwidth. But impulse noise — a 1-microsecond spark from a car ignition — contains energy across ALL frequencies simultaneously. No filter can remove it without also removing the signal. The noise blanker takes a different approach: instead of filtering by frequency, it filters by TIME. Detect the pulse, mute for 1 ms, resume. The human ear doesn't notice a 1 ms gap in audio, but it definitely notices a loud CRACK from ignition noise. Mercury-Redstone launches generated massive impulse noise from engine ignition, pyrotechnic firing, and relay switching — noise blanking was essential in telemetry receivers to prevent data corruption from these transients.

**Total cost: ~$7**

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
  v1.17 — Noise Blanker (pulse noise suppression)  ← YOU ARE HERE

The noise blanker sits between the IF stage and the detector:
  Antenna → Tuner → Preamp → Mixer ← LO
                                |
                          Crystal Filter
                                |
                          IF Amplifier
                                |
                    ┌───── NOISE BLANKER (THIS CIRCUIT) ─────┐
                    │           |                             │
                    │     ┌─────┴─────┐                       │
                    │     │           │                       │
                    │  [Detector]  [Noise Detector]           │
                    │     │           │                       │
                    │  Audio Amp   [Threshold]                │
                    │     │           │                       │
                    │  Speaker     [Gate Control]─── blanks──→│
                    └─────────────────────────────────────────┘

How noise blanking works:
  1. Noise detector taps the IF signal before detection
  2. Impulse noise produces a spike far above normal signal
  3. Threshold comparator detects the spike
  4. Gate control mutes the audio path for ~1 ms
  5. Pulse passes, gate reopens, audio resumes
  6. Listener hears clean audio with imperceptible gaps
```

---

## Schematic

```
  From IF Amplifier output
         |
         +───────────────────────────── To AM Detector (normal path)
         |                                     |
         |                              [Audio Gate]
         |                              (Dual-gate MOSFET or diode ring)
         |                                     |
         |                              Gate Control ──┐
         |                                             |
    [Noise Detector Path]                              |
         |                                             |
    [C_couple]                                         |
    100pF   AC-couple the IF signal                    |
         |                                             |
    [Wideband Amp]                                     |
    2N3904 common-emitter                              |
    Gain ~20 (broadband, not tuned)                    |
         |                                             |
    [Peak Detector]                                    |
    D1 (1N4148) + C2 (100pF)                           |
    Fast attack, slow decay                            |
         |                                             |
    [Threshold Comparator]                             |
    D2 (1N4148) + R_threshold (pot)                    |
    When peak > threshold → trigger                    |
         |                                             |
    [Monostable Timer]                                 |
    RC one-shot: R_blank × C_blank                     |
    Sets blanking pulse width (0.5-5 ms)               |
         |                                             |
    [Gate Driver]──────────────────────────────────────┘
    Drives the audio gate OFF during blank pulse

Detailed Schematic:

  IF Input ──┬──────────────────────────────── To Detector
             │                                     │
             │                              D3 ──►── D4
             │                              │         │
             │                         Gate Voltage   │
             │                              │         │
             │                              Audio Out
             │
        [100pF] C_couple
             │
             ├── R_bias (100K) ── VCC
             │
         B ──┤ 2N3904
             │
         E ──┤── R_E (470Ω) ── GND
             │
         C ──┤── R_C (1K) ── VCC
             │
             ├── [100pF] C_peak
             │         │
             │    D1 ──►──┤
             │             │
             │        [R_decay]
             │         10K
             │             │
             │            GND
             │
             ├──── D2 (threshold)
             │         │
             │    [POT] 50K  ← THRESHOLD ADJUST
             │         │
             │        GND
             │
             │   When peak > threshold:
             │
             ├── [R_blank] 10K ──┐
             │                    │
             │              [C_blank]
             │               0.1µF
             │                    │
             │                   GND
             │
             │   τ_blank = 10K × 0.1µF = 1 ms
             │
             └── Gate Driver → controls audio gate diodes

  LED indicator:
    Gate Driver ──[1K]── LED ── GND
    (Blinks each time a noise pulse is blanked)
```

## Design Calculations

```
Noise detection sensitivity:
  Amplifier gain = R_C / R_E = 1000 / 470 ≈ 2.1
  But impulse noise is typically 20-40 dB above signal
  Even low gain is sufficient for detection

Peak detector time constants:
  Attack: C_peak charges through D1 forward resistance (~50Ω)
  τ_attack = 50Ω × 100pF = 5 ns (virtually instantaneous)

  Decay: C_peak discharges through R_decay
  τ_decay = 10KΩ × 100pF = 1 µs
  Fast enough to reset between pulses, slow enough to catch them

Blanking pulse width:
  τ_blank = R_blank × C_blank = 10KΩ × 0.1µF = 1 ms
  Adjustable: replace R_blank with 50K pot
    Minimum: ~500 µs (short ignition pulses)
    Maximum: ~5 ms (motor brush noise trains)

Audio gate insertion loss:
  Using series diodes (D3, D4):
  Gate ON: diodes forward-biased, ~0.3 dB loss
  Gate OFF: diodes reverse-biased, >40 dB rejection
  Switching time: <1 µs (signal diodes)
```

## Parts List

| Qty | Part | Cost |
|-----|------|------|
| 1 | 2N3904 NPN transistor (noise amp) | $0.10 |
| 4 | 1N4148 signal diodes (D1-D4) | $0.20 |
| 1 | 100pF ceramic capacitor (coupling) | $0.05 |
| 1 | 100pF ceramic capacitor (peak detect) | $0.05 |
| 1 | 0.1µF ceramic capacitor (blanking timer) | $0.05 |
| 1 | 100KΩ resistor (bias) | $0.05 |
| 1 | 1KΩ resistor (collector) | $0.05 |
| 1 | 470Ω resistor (emitter) | $0.05 |
| 1 | 10KΩ resistor (peak decay) | $0.05 |
| 1 | 50KΩ potentiometer (threshold) | $0.50 |
| 1 | 10KΩ potentiometer (blanking width, optional) | $0.50 |
| 1 | 1KΩ resistor (LED) | $0.05 |
| 1 | LED (blanking indicator) | $0.10 |
| 1 | Small breadboard section | $1.00 |
| -- | Jumper wires | $0.50 |
| **Total** | | **~$7** |

## Why This Matters for MR-2

Mercury-Redstone 2 generated extreme impulse noise during its flight. The Redstone engine ignition created a burst of electromagnetic interference. The abort system firing at T+137s added another massive transient. Every pyrotechnic event — tower separation, retrorocket firing, parachute mortar — produced impulse noise that could corrupt telemetry data.

The ground station receivers at Cape Canaveral used noise blankers in their telemetry chains to prevent these transients from being interpreted as data. Without noise blanking, a single ignition spike could flip bits in the biomedical telemetry, making Ham's heart rate look like a flatline or his lever-pull data look like he'd stopped responding.

The noise blanker principle — filter by time, not by frequency — appears throughout engineering:

- **Digital error correction:** CRC detects corrupted packets; the system requests retransmission (temporal blanking at the protocol level)
- **Tetrodotoxin:** The rough-skinned newt's TTX toxin blanks sodium channels in predator neurons — a biochemical noise blanker that suppresses the "signal" (nerve impulses) in anything that tries to eat it
- **Ham's lever task:** Ham was trained to respond to light stimuli within a time window. His training was essentially noise blanking — suppress incorrect responses (noise), pass only correctly-timed responses (signal)
