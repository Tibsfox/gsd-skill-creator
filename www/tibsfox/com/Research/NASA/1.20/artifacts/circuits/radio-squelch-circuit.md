# DIY Radio Circuit: Squelch — Noise Gate for Receiver Output

## The Circuit

A squelch circuit using a rectifier peak detector, LM393 comparator, and CD4066 analog switch to gate the audio output of a receiver. When no signal is present, the receiver outputs only noise. The squelch circuit detects the absence of a coherent signal (high noise floor, no carrier) and mutes the audio path. When a signal appears above the squelch threshold, the gate opens and audio passes through. This is the twentieth circuit in the progressive radio series, following the AGC circuit from v1.19.

**What it does:**
- Takes the receiver audio output (after demodulation)
- Splits the signal into two paths: audio path and detection path
- Detection path: rectifies the high-frequency noise content above 4 kHz
- When only noise is present, the noise detector voltage is HIGH (lots of HF noise)
- When a signal is present, the detector voltage DROPS (signal replaces noise)
- LM393 comparator compares noise level to adjustable threshold (potentiometer)
- Comparator output controls CD4066 analog switch in the audio path
- No signal (noise only): switch OPEN, audio muted, LED off
- Signal present: switch CLOSED, audio passes, LED on
- Hysteresis resistor prevents rapid on/off toggling at threshold

**What it teaches:** Without squelch, a receiver tuned to an empty frequency produces a constant, fatiguing hiss. Mercury ground stations monitored multiple frequencies simultaneously. Between capsule passes overhead — which might last only a few minutes per orbit — the receivers were tuned but silent. Without squelch, operators would hear continuous noise for hours punctuated by brief signal windows. Squelch circuits made this tolerable. The same principle is used in every walkie-talkie, two-way radio, aircraft radio, and scanner. Your car's FM radio uses a more sophisticated version (stereo pilot tone detection), but the basic idea is identical: detect the absence of a wanted signal and mute the output.

**Total cost: ~$5**

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
  v1.19 — AGC Circuit (JFET voltage-controlled attenuator)
  v1.20 — Squelch Circuit (noise-gated audio mute) ← YOU ARE HERE

The squelch circuit sits AFTER the audio amplifier, just before
the speaker or headphone output:

  Antenna → Tuner → Preamp → Mixer → Crystal Filter
                                          |
                                    AGC Attenuator
                                          |
                                     IF Amplifier
                                          |
                                   Product Detector
                                          |
                                   Audio Amplifier
                                          |
                              ┌───── SQUELCH (THIS CIRCUIT) ─────┐
                              │           |                       │
                              │     [Audio In]                    │
                              │      |        |                   │
                              │  [Audio     [Noise                │
                              │   Path]      Detector]            │
                              │      |           |                │
                              │  [CD4066    [Rectifier            │
                              │   Switch]    + Filter]            │
                              │      |           |                │
                              │      |      [LM393                │
                              │      |       Comparator]          │
                              │      |           |                │
                              │      |←── Control ──→ LED         │
                              │      |                            │
                              │  [Audio Out → Speaker]            │
                              └───────────────────────────────────┘

Detection principle:
  No signal → receiver outputs broadband noise →
  high-frequency content (>4 kHz) is STRONG →
  noise detector voltage HIGH →
  comparator: noise > threshold →
  switch OPEN → audio MUTED

  Signal present → carrier + modulation →
  high-frequency noise content DROPS →
  noise detector voltage LOW →
  comparator: noise < threshold →
  switch CLOSED → audio PASSES
```

---

## Schematic

```
  Audio Input (from receiver audio amplifier)
         |
    ┌────┴────────────────────────┐
    │                              │
  [Audio Path]               [Noise Detection Path]
    │                              │
  [10KΩ]                     [100pF] DC block
    │                              │
  CD4066                      High-pass filter (>4 kHz)
  Analog Switch               [1nF] + [39KΩ] (1st order, fc ≈ 4.1 kHz)
    │                              │
    │ ←── Control pin         Rectifier
    │     from comparator     D1 (1N4148) → [10nF] peak hold
    │                              │
  [Audio Out]                 [100KΩ] discharge
    │                              │
  Speaker/                    Detected noise voltage
  Headphones                       │
                              LM393 Comparator
                                 IN- ← Noise voltage
                                 IN+ ← Threshold (from pot)
                                 OUT → CD4066 control + LED
                                   │
                              [10KΩ] pull-up to 5V (open collector)
                                   │
                              ┌────┤
                              │  [100KΩ] hysteresis to IN+
                              │    │
                              │  CD4066 Control Pin
                              │    │
                              └── [220Ω] → LED → GND

  Threshold Potentiometer:
    5V ─── [10KΩ pot] ─── GND
              │
            Wiper → LM393 IN+

  Detailed Component Layout:

    Audio In                           Audio Out
       │                                  │
     [10KΩ]                               │
       │                                  │
       ├──── CD4066 In ─── CD4066 Out ────┤
       │        │                         │
       │     Control ← LM393 OUT         Speaker
       │                  │
       │            [10KΩ] pull-up to 5V
       │                  │
       │            [100KΩ] hysteresis
       │                  │
       │            LM393 IN+
       │                  │
       │         [10KΩ pot] wiper
       │
       └──── [100pF]
                │
           [1nF]──┤──[39KΩ]──GND
                │
           D1 (1N4148)
                │
           [10nF]──GND
                │
           [100KΩ]──GND
                │
           LM393 IN-

  Power:
    5V  → LM393 VCC (pin 8), CD4066 VDD (pin 14), pull-up, pot
    GND → LM393 GND (pin 4), CD4066 VSS (pin 7), LED cathodes
```

## Design Calculations

```
High-pass noise filter:
  Purpose: extract only high-frequency noise content (above ~4 kHz)
  Voice/signal energy is concentrated below 3 kHz
  Noise has a flat spectrum — equal energy at all frequencies
  By looking only at the >4 kHz band, we detect noise without
  being fooled by the presence of audio signal

  First-order high-pass: C in series, R to ground
    fc = 1 / (2π × R × C)
    fc = 1 / (2π × 39K × 1n)
    fc = 1 / (2π × 3.9×10⁻⁵)
    fc = 4,081 Hz ≈ 4.1 kHz ✓

Rectifier peak detector:
  D1 (1N4148) charges C_hold (10nF) to peak of noise voltage
  R_discharge (100KΩ) provides slow decay
  Time constant: 100K × 10n = 1 ms
  Response: fast enough to track noise envelope (~4 kHz),
  slow enough to provide smooth DC control voltage

LM393 comparator:
  Open-collector output — needs pull-up resistor to VCC
  IN- receives noise detector voltage
  IN+ receives threshold from potentiometer
  When noise voltage (IN-) > threshold (IN+): output LOW (switch open, muted)
  When noise voltage (IN-) < threshold (IN+): output HIGH (switch closed, audio)

  This is inverted logic: MORE noise = muted, LESS noise = unmuted
  Which is exactly what squelch does.

Hysteresis:
  Without hysteresis, the comparator chatters at the threshold
  100KΩ from output to IN+ provides positive feedback:
    When output goes HIGH: pulls IN+ slightly higher →
    noise must drop further to re-trigger → prevents chatter
    Hysteresis ≈ (5V × 100K / (100K + 10K_pot)) ≈ 0.45V
    This provides about 3-4 dB of squelch hysteresis

CD4066 analog switch:
  Bilateral analog switch (works for AC audio signals)
  Control HIGH: switch closed (Ron ≈ 100Ω) — audio passes
  Control LOW: switch open (Roff > 100MΩ) — audio blocked
  Passes signals up to ~10 MHz — more than adequate for audio
  No signal distortion at audio levels

Mercury ground station context:
  Mercury stations used UHF receivers at 230 MHz
  Each station had multiple receivers for voice, telemetry, and tracking
  Between capsule passes: pure noise on all channels
  With squelch: operators heard silence, then clear voice when capsule
  came within range. The squelch "opening" was itself a tracking indicator —
  you knew the capsule was approaching when the squelch broke.
```

## Parts List

| Qty | Part | Cost |
|-----|------|------|
| 1 | LM393 dual comparator (DIP-8) | $0.30 |
| 1 | CD4066 quad analog switch (DIP-14) | $0.30 |
| 1 | 1N4148 signal diode (rectifier) | $0.05 |
| 1 | 100 pF ceramic capacitor (DC block) | $0.05 |
| 1 | 1 nF ceramic capacitor (HP filter) | $0.05 |
| 1 | 10 nF ceramic capacitor (peak hold) | $0.05 |
| 1 | 39 KΩ resistor (HP filter) | $0.05 |
| 1 | 100 KΩ resistor (detector discharge) | $0.05 |
| 1 | 100 KΩ resistor (hysteresis) | $0.05 |
| 1 | 10 KΩ resistor (audio path) | $0.05 |
| 1 | 10 KΩ resistor (pull-up) | $0.05 |
| 1 | 220 Ω resistor (LED) | $0.05 |
| 1 | 10 KΩ potentiometer (threshold) | $0.40 |
| 1 | LED (signal indicator) | $0.05 |
| 1 | Small breadboard section | $1.00 |
| -- | Jumper wires | $0.50 |
| **Total** | | **~$5** |

## Why Squelch Matters

Every two-way radio you've ever used has a squelch circuit. The PTT (push-to-talk) button on a walkie-talkie doesn't just activate the transmitter — it also tells the receiver on the other end that a signal is coming. But on the receiving side, the squelch circuit is what actually decides whether to pass audio to the speaker or stay silent.

Without squelch, radios are exhausting. Try tuning an AM radio to an empty frequency — the hiss is loud, broadband, and relentless. Now imagine monitoring that frequency for hours waiting for a 5-minute signal window. That was the reality for Mercury ground station operators. Each tracking station along the network (Cape Canaveral, Grand Bahama, Bermuda, Canary Islands, Kano, Zanzibar, Muchea, Woomera, Canton, Kauai, Point Arguello, Guaymas) was assigned specific communication windows based on the orbital trajectory. Between windows: silence (with squelch) or noise (without).

The squelch threshold is a critical setting. Set it too tight (high threshold) and weak signals are muted — you miss a faint transmission. Set it too loose (low threshold) and noise bleeds through. Mercury operators adjusted squelch based on expected signal strength at their station's range and elevation angle. As the capsule appeared over the horizon, the signal strength rose, the squelch opened, and the operator heard Grissom's voice. As the capsule dropped below the horizon, the signal faded, the squelch closed, and the next station in the network took over.

The SPICE simulation (squelch-circuit.cir) models this exact circuit and demonstrates the squelch opening and closing as signal strength varies.

---

## Classroom Extensions

1. **Squelch threshold experiment:** With a signal generator as input, slowly increase the signal amplitude. Note the exact level where squelch opens. Now decrease the signal — it should close at a slightly lower level (hysteresis). Measure the difference in dB.
2. **Noise floor measurement:** With no input signal, measure the noise detector voltage with a multimeter. This is your receiver's noise floor. A good receiver has a lower noise floor and can detect weaker signals.
3. **Tone squelch (CTCSS):** Modern radios use a sub-audible tone (67-254 Hz) encoded in the transmission to open squelch. Only receivers programmed with the matching tone will unmute. This prevents hearing other users on the same frequency. How would you modify this circuit to detect a specific tone instead of noise absence?
4. **Digital squelch:** Modern digital radios use bit-error-rate (BER) as the squelch criterion. Instead of detecting noise, they measure how many data bits are corrupted. Below a threshold BER: signal is usable, unmute. What are the advantages of this approach?
5. **The Mercury network handoff:** As Liberty Bell 7 moved across the Atlantic after launch, different ground stations took turns communicating. The handoff happened when one station's squelch closed (capsule out of range) and the next station's squelch opened (capsule coming into range). Map the MR-4 ground track and identify which stations could communicate at which times.
