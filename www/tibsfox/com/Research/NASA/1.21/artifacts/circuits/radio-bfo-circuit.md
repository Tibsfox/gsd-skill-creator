# DIY Radio Circuit: Beat Frequency Oscillator (BFO) — Carrier Reinsertion for CW/SSB

## The Circuit

A Colpitts oscillator generating a stable signal at 455 kHz (standard IF frequency) with fine-tuning capability of plus or minus 2 kHz, followed by a buffer amplifier to isolate the oscillator from load variations. The BFO injects a local carrier into the product detector (v1.18) to make CW (Morse code) and SSB (single sideband) signals audible. Without a BFO, these signals produce no audio output — they are literally silent in a conventional AM receiver. This is the twenty-first circuit in the progressive radio series, following the squelch circuit from v1.20.

**What it does:**
- Colpitts oscillator produces a continuous sine wave at ~455 kHz
- Variable capacitor (5-20 pF) allows the operator to shift frequency by approximately plus or minus 2 kHz, setting the audio pitch of received CW signals
- Buffer amplifier (common-collector) provides ~100 mVpp output into high impedance without pulling the oscillator frequency
- Output feeds into the product detector (v1.18) as the reinserted carrier
- For CW: BFO offset from IF by 400-1000 Hz produces a clear audio tone
- For SSB: BFO set exactly on the suppressed carrier frequency restores intelligible speech

**What it teaches:** In AM radio, the carrier is transmitted alongside the sidebands — the receiver can demodulate audio with a simple diode detector. But CW and SSB strip the carrier before transmission. CW transmits only the carrier itself (toggled on and off for Morse code) — without a second carrier to beat against, a CW signal produces a DC shift in the detector, which is inaudible. SSB transmits only one sideband — without the carrier, the sideband frequencies are not shifted back to their original audio positions, producing garbled speech. The BFO supplies the missing carrier locally. Mercury's ground stations used precision oscillators for exactly this purpose: demodulating the FM/FM multiplexed telemetry subcarriers that carried Glenn's biomedical data, environmental readings, and spacecraft systems status on 228.2 MHz.

**Total cost: ~$5**

---

## The Progressive Radio Chain (Series Context)

```
Radio Series Progress:
  v1.2  — Transmitter (oscillator -> antenna)
  v1.3  — Receiver (antenna -> detector -> audio)
  v1.4  — Mixer (RF + LO -> IF)
  v1.5  — IF Amplifier (IF -> amplified, filtered IF)
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
  v1.20 — Squelch Circuit (noise-gated audio mute)
  v1.21 — BFO (Colpitts oscillator + buffer, CW/SSB carrier) <- YOU ARE HERE

The BFO injects into the product detector, providing the
carrier reference needed for CW and SSB demodulation:

  Antenna -> Tuner -> Preamp -> Mixer <- LO
                                  |
                            Crystal Filter
                                  |
                           AGC Attenuator
                                  |
                            IF Amplifier
                                  |
                   +---- PRODUCT DETECTOR ----+
                   |          |               |
                   |    [IF Signal]            |
                   |          |               |
                   |    [Balanced Mixer]       |
                   |       |      |           |
                   |  [IF In]  [BFO In]       |
                   |              |           |
                   |     +--- BFO (THIS) ---+ |
                   |     | Colpitts Osc     | |
                   |     | 455 kHz +/- 2kHz | |
                   |     | + Buffer Amp     | |
                   |     +-----------------+  |
                   |          |               |
                   |    [Audio Output]        |
                   |          |               |
                   +---- Squelch -> Amp ------+
                                  |
                               Speaker

How beat frequency detection works:

  CW signal at IF (455.000 kHz):
    BFO at 455.700 kHz
    Beat = |455.700 - 455.000| = 0.700 kHz = 700 Hz
    Result: 700 Hz audio tone (pleasant CW note)
    Operator adjusts BFO to set preferred pitch

  SSB signal (upper sideband, suppressed carrier at 455.000 kHz):
    Voice frequencies 300-3000 Hz appear as 455.300-458.000 kHz
    BFO set to exactly 455.000 kHz
    Beat for each component:
      |455.300 - 455.000| = 300 Hz  (lowest voice)
      |456.000 - 455.000| = 1000 Hz (mid voice)
      |458.000 - 455.000| = 3000 Hz (highest voice)
    Result: original voice spectrum restored
    If BFO is off by even 50 Hz: all voice frequencies
    shift by 50 Hz, producing "chipmunk" or "bass" effect
```

---

## Schematic

```
  Colpitts Oscillator (Q1 — 2N3904):

    9V
     |
    [R1 47KOhm] bias
     |
     +------+---- Q1 Collector
     |      |
    [R2     |
    10KOhm] |
     |      |
    GND   [RFC] 1mH RF choke (AC isolation from supply)
            |
           9V

    Q1 Base ---- [R3 10KOhm] ---- [R4 47KOhm] ---- GND
                   |
                [C_bypass 100nF] ---- GND
                   (RF bypass on base bias)

    Q1 Emitter
       |
    +--+--+
    |     |
   [C1]  [C2]
   68pF  68pF
    |     |
    |     +---- Tap (feedback to base via 10pF)
    |     |
    +--+--+
       |
      [L1] 455 kHz IF transformer (primary winding)
       |           (~500 uH, with slug-tuned core)
      GND

    Frequency determined by L and series combination of C1, C2:
      C_total = (C1 x C2) / (C1 + C2) = (68 x 68) / (68 + 68) = 34 pF

    Variable capacitor (C_var, 5-20 pF) in parallel with L1:
      C_effective = C_total + C_var
      At C_var = 5 pF:  C_eff = 39 pF -> f = 1/(2*pi*sqrt(500u * 39p)) = 1,139 kHz
      (Need to adjust L for 455 kHz — see calculations below)

    CORRECTED for 455 kHz:
      f = 1 / (2*pi*sqrt(L*C))
      455K = 1 / (2*pi*sqrt(L * 39p))
      L = 1 / ((2*pi*455K)^2 * 39p)
      L = 1 / (8.17e12 * 3.9e-11)
      L = 1 / 0.3186
      L = 3.14 mH (use slug-tuned 455 kHz IF transformer)

    Standard 455 kHz IF transformers are designed for this range.
    The slug-tuned core provides fine adjustment to center on 455 kHz.
    C_var provides operator-accessible pitch control.

  Variable Capacitor Pitch Control:

    C_var (5-20 pF) in parallel with the tank circuit:
      At C_var = 5 pF:   f ≈ 457 kHz (+2 kHz)
      At C_var = 12 pF:  f ≈ 455 kHz (center)
      At C_var = 20 pF:  f ≈ 453 kHz (-2 kHz)

    Operator turns the knob to shift BFO frequency,
    which changes the audio pitch of CW signals and
    fine-tunes SSB voice intelligibility.

  Buffer Amplifier (Q2 — 2N3904):

    Q1 Collector
         |
      [C_couple 100pF] (DC block)
         |
    Q2 Base
         |
    [R5 100KOhm] to GND (bias)
         |
    Q2 Collector ---- 9V
    Q2 Emitter
         |
    [R6 1KOhm] (sets output impedance)
         |
    [C_out 100pF] (DC block)
         |
    OUTPUT (~100 mVpp into high impedance)
         |
    To product detector BFO input (v1.18)

  Complete Component Layout:

    9V Rail
     |
    [47KOhm]--+--[RFC 1mH]--- 9V
               |
            Q1 (2N3904) Colpitts oscillator
          C|   |B         |E
          |  [10K]--+      |
        [10pF]    [100nF]  +--[68pF]--+--[C_var]--+
          |        |       |          |            |
         GND      GND   [68pF]    [IF XFMR       |
                           |       455kHz]        |
                           +----+----+            |
                                |                 |
                               GND               GND
            Q1 Collector
                 |
              [100pF]
                 |
            Q2 (2N3904) Buffer
          C|   |B    |E
          |  [100K]  [1K]
         9V    |      |
              GND  [100pF]
                      |
                   OUTPUT --> To Product Detector

  Power:
    9V  -> Q1 collector (via RFC), Q2 collector, bias resistors
    GND -> Tank circuit, bias dividers, emitter return
```

## Design Calculations

```
Colpitts oscillator frequency:
  The Colpitts topology uses a capacitive voltage divider (C1, C2)
  across an inductor to sustain oscillation.

  Resonant frequency:
    f = 1 / (2 * pi * sqrt(L * C_series))

  Where:
    C_series = (C1 * C2) / (C1 + C2) + C_var
    C1 = 68 pF, C2 = 68 pF, C_var = 5-20 pF

    At C_var = 12 pF (center):
      C_total = 34 + 12 = 46 pF

    Required L for 455 kHz:
      L = 1 / ((2*pi*f)^2 * C)
      L = 1 / ((2*pi*455000)^2 * 46e-12)
      L = 1 / (8.17e12 * 4.6e-11)
      L = 1 / 0.376
      L = 2.66 mH

    Standard 455 kHz IF transformer: typically 2.5-3.5 mH
    Slug-tuned core adjusts inductance to hit exact center frequency
    This is why IF transformers have a tuning slug — factory
    alignment sets the exact frequency for each radio.

  Tuning range with C_var:
    At C_var = 5 pF:  C_total = 39 pF
      f = 1 / (2*pi*sqrt(2.66m * 39p)) = 457.1 kHz
    At C_var = 20 pF: C_total = 54 pF
      f = 1 / (2*pi*sqrt(2.66m * 54p)) = 452.6 kHz

    Tuning range: 452.6 to 457.1 kHz = +/- 2.25 kHz from center
    This maps to CW audio pitch range of ~225 Hz to ~2250 Hz
    Sweet spot for CW: 600-800 Hz offset

Colpitts feedback condition:
  For oscillation to sustain, the loop gain must be >= 1.
  Voltage feedback ratio: C1/C2 = 68/68 = 1 (equal division)
  Transistor must provide gain >= C2/C1 = 1
  With beta > 100 for 2N3904, this is easily satisfied.
  Equal capacitors give symmetric feedback — good for stability.

Frequency stability:
  The Colpitts is inherently more stable than a Hartley oscillator
  because capacitors have lower temperature coefficients than inductors.
  NP0/C0G ceramic capacitors for C1 and C2: tempco < 30 ppm/°C
  At 455 kHz: 30 ppm = 13.65 Hz/°C drift
  Over a 20°C ambient range: ~273 Hz drift
  Acceptable for CW (pitch shifts slightly) and SSB (barely noticeable)

  For higher stability: use silvered-mica capacitors (5 ppm/°C)
  or replace the LC tank with a crystal (0.5 ppm/°C)

Buffer amplifier:
  Common-collector (emitter follower) configuration:
    Voltage gain: ~0.95 (slightly less than 1)
    Input impedance: very high (beta * R_emitter ≈ 100K)
    Output impedance: R_emitter || (R_source/beta) ≈ 1K

  Purpose: isolate oscillator from load
    Without buffer: connecting the BFO output to the product
    detector changes the load on the tank circuit, pulling
    the oscillator frequency. The buffer presents a constant
    high-impedance load to the oscillator regardless of what
    is connected to the output.

  Output level:
    Oscillator amplitude at collector: ~1-2 Vpp
    After coupling capacitor and emitter follower: ~100-200 mVpp
    Into the product detector: this is the correct injection level
    Too much BFO injection overloads the detector
    Too little: weak audio output with poor signal-to-noise

Mercury telemetry system context:
  Glenn's telemetry on 228.2 MHz used FM/FM multiplexing:
    Each data channel was a subcarrier at a specific frequency:
      Channel 1:  400 Hz   (ECG)
      Channel 2:  560 Hz   (respiration)
      Channel 3:  730 Hz   (body temperature)
      Channel 4:  960 Hz   (suit pressure)
      Channel 5:  1300 Hz  (cabin pressure)
      Channel 6:  1700 Hz  (O2 partial pressure)
      Channel 7:  2300 Hz  (coolant quantity)
      Channel 8:  3000 Hz  (inverter temperature)
      Channel 9:  3900 Hz  (DC bus voltage)
      Channel 10: 5400 Hz  (attitude gyro)
      Channels 11-16: higher frequencies for spacecraft systems

  Each subcarrier was frequency-modulated by its sensor data,
  then all subcarriers were combined and FM-modulated onto 228.2 MHz.
  Ground stations reversed the process:
    1. FM demodulate the 228.2 MHz carrier -> composite subcarrier audio
    2. Bandpass filter each subcarrier
    3. FM demodulate each subcarrier -> original sensor data

  The ground station receivers used precision local oscillators
  (functionally equivalent to BFOs) for each demodulation stage.
  Frequency accuracy was critical: a 50 Hz error in the subcarrier
  filter center frequency would shift the demodulated data by 50 Hz,
  introducing errors in the biomedical readings.

  Glenn's voice was on a separate channel: AM on 296.9 MHz.
  UHF voice required no BFO — the carrier was present in the
  AM signal. But the telemetry chain required precise frequency
  references at every stage.
```

## Parts List

| Qty | Part | Cost |
|-----|------|------|
| 2 | 2N3904 NPN transistors (oscillator + buffer) | $0.20 |
| 2 | 68 pF ceramic capacitors (C0G/NP0, Colpitts divider) | $0.10 |
| 1 | 5-20 pF variable capacitor (trimmer or panel-mount) | $0.50 |
| 1 | 10 pF ceramic capacitor (feedback) | $0.05 |
| 2 | 100 pF ceramic capacitors (coupling) | $0.10 |
| 1 | 100 nF ceramic capacitor (bypass) | $0.05 |
| 1 | 455 kHz IF transformer (slug-tuned, standard type) | $0.80 |
| 1 | 1 mH RF choke (collector feed) | $0.20 |
| 2 | 47 KOhm resistors (bias) | $0.10 |
| 2 | 10 KOhm resistors (bias) | $0.10 |
| 1 | 100 KOhm resistor (buffer bias) | $0.05 |
| 1 | 1 KOhm resistor (emitter) | $0.05 |
| 1 | Small breadboard section | $1.00 |
| -- | Jumper wires | $0.50 |
| **Total** | | **~$5** |

## Theory of Operation

### How Beat Frequencies Work

When two signals of different frequencies are multiplied together (or combined in a nonlinear device), they produce sum and difference frequencies. If you have a signal at 455,000 Hz and a BFO at 455,700 Hz, the difference is 700 Hz — an audible tone. This is the "beat" frequency, the same phenomenon that piano tuners use when they strike two strings and listen for the "wah-wah-wah" of the beat note slowing down as the strings approach the same pitch.

The mathematical basis: cos(A) x cos(B) = 0.5 x [cos(A-B) + cos(A+B)]. The product detector (v1.18) performs this multiplication. The sum frequency (910,700 Hz) is far above audio and gets filtered out by the audio amplifier's bandwidth. The difference frequency (700 Hz) passes through and drives the speaker.

### Why CW Needs a BFO

A CW (continuous wave) transmitter sends a carrier that is keyed on and off to form Morse code. At the receiver, after mixing to the IF frequency, the CW signal is a 455 kHz carrier toggling on and off. If you put this through an AM detector (a simple diode), the output is a DC voltage that steps between zero and some positive value — inaudible. There is no audio frequency present. The signal exists only at 455 kHz, which is ultrasonic.

The BFO creates the audio frequency that is absent from the signal. By injecting a carrier at 455.7 kHz into the product detector alongside the 455.0 kHz CW signal, the detector outputs a 700 Hz tone whenever the CW carrier is present and silence when it is absent. Dits and dahs become audible tones. The operator adjusts the BFO frequency to set whatever pitch they find most comfortable — typically 600-800 Hz for fatigue-free copy over long sessions.

### Why SSB Needs a BFO

Single sideband goes a step further. Not only is the carrier suppressed (to save transmitter power), but one of the two sidebands is also removed (to save bandwidth). What remains is a single sideband containing the voice frequencies, shifted up by the carrier frequency. At the IF, an SSB signal from a voice saying a 1000 Hz tone would appear as a signal at 456,000 Hz (upper sideband). Without the carrier at 455,000 Hz to beat against, this signal produces nothing intelligible through a conventional detector.

The BFO supplies the missing carrier. Set to 455,000 Hz, it enters the product detector. The 456,000 Hz sideband beats against the 455,000 Hz BFO to produce a 1,000 Hz audio tone — the original voice frequency is restored. Every frequency component in the sideband is simultaneously shifted back to its correct audio position. If the BFO is off by even 50 Hz (set to 455,050 instead of 455,000), every audio frequency shifts by 50 Hz. A 1000 Hz voice component becomes 950 Hz. Across the full voice band, this 50 Hz shift makes the speaker sound unnatural — the "Donald Duck" effect familiar to any ham radio operator who has slightly mistuned an SSB signal.

### The Colpitts Topology

The Colpitts oscillator was chosen for this BFO because it offers superior frequency stability compared to the Hartley topology. In a Colpitts circuit, the frequency-determining elements are the inductor and two capacitors in a voltage-divider arrangement. Capacitors have lower temperature coefficients than inductors, so the oscillator frequency drifts less with ambient temperature changes. This matters for a BFO: a 50 Hz drift in BFO frequency shifts the audio pitch of a CW signal by 50 Hz and can make an SSB voice unintelligible.

The two 68 pF capacitors form a 1:1 voltage divider, feeding back a fraction of the output signal to sustain oscillation. The variable capacitor in parallel with the inductor shifts the resonant frequency by a few kHz, giving the operator a "pitch" control knob. The slug-tuned IF transformer allows factory alignment to center the tuning range on 455 kHz.

### Integration with the Receiver Chain

The BFO output connects to the product detector (v1.18) as the "local oscillator" input. The product detector multiplies the IF signal by the BFO signal, producing sum and difference frequencies. A low-pass filter after the detector removes the sum component (910 kHz), passing only the audio-frequency difference to the audio amplifier (v1.7) and then through the squelch circuit (v1.20) to the speaker.

The buffer amplifier is essential. Without it, connecting the BFO to the product detector loads the oscillator tank circuit, shifting its frequency. Worse, signal energy from the IF strip can leak back into the oscillator, causing it to lock onto the incoming signal rather than running freely. The emitter-follower buffer presents a high impedance to the oscillator (~100 KOhm) and a low impedance to the product detector (~1 KOhm), providing isolation in both directions.

## Connection to Glenn

Mercury-Atlas 6 carried the most complex telemetry system yet flown on an American spacecraft. Every heartbeat, every breath, every temperature reading from Glenn's suit, cabin, and spacecraft systems was encoded as a frequency-modulated subcarrier, multiplexed with sixteen other channels, and transmitted to the ground at 228.2 MHz. The ground stations at Cape Canaveral, Bermuda, the Canary Islands, Kano, Zanzibar, Muchea, Woomera, Canton, Kauai, Point Arguello, Guaymas, Corpus Christi, and Eglin had to demodulate each subcarrier with precision oscillators whose frequency accuracy determined the accuracy of every reading.

Glenn's voice rode a separate AM channel at 296.9 MHz — the carrier was present, no BFO needed. But the telemetry was the heartbeat of the mission, and it required exact frequency references at every demodulation stage. When the flight surgeon at the Cape watched Glenn's ECG trace scrolling across the strip chart recorder, the fidelity of that trace depended on a chain of oscillators and demodulators maintaining frequency accuracy to within a few hertz across thousands of miles of radio path.

The Segment 51 indicator — a telemetry readout that erroneously suggested Friendship 7's heat shield might be loose — triggered one of the most dramatic decisions in spaceflight history. Mission Control instructed Glenn to leave his retrorocket package attached during reentry instead of jettisoning it as planned, hoping the straps would hold the heat shield in place. The indicator was wrong. The heat shield was fine. But the decision was made based on telemetry data decoded by ground station equipment whose frequency references were functionally identical to the simple Colpitts BFO in this circuit. Every data point that Mission Control used to make life-or-death decisions passed through oscillators like this one.

---

## Progressive Radio Series — Full Status

| Mission | Circuit | What It Does | Status |
|---------|---------|-------------|--------|
| v1.2 | Crystal Oscillator / Transmitter | Generates RF signal for transmission | Complete |
| v1.3 | Superheterodyne Receiver | Converts RF to IF for selective reception | Complete |
| v1.4 | Ring Mixer | Combines RF + LO to produce IF | Complete |
| v1.5 | IF Amplifier | Amplifies and filters IF signal | Complete |
| v1.6 | AM Detector/Demodulator | Extracts audio from AM signal | Complete |
| v1.7 | Audio Amplifier + Speaker | Drives speaker from detected audio | Complete |
| v1.8 | Noise Blanker / Impulse Filter | Suppresses pulse noise (ignition, etc.) | Complete |
| v1.9 | AGC (Automatic Gain Control) | Maintains constant output level | Complete |
| v1.10 | S-Meter | Displays signal strength | Complete |
| v1.11 | BFO (initial) | Beat frequency oscillator basics | Complete |
| v1.12 | Antenna Tuner | L-network impedance matching | Complete |
| v1.13 | RF Preamplifier | Low-noise front-end amplification | Complete |
| v1.14 | Bandpass Filter | LC tuned selectivity | Complete |
| v1.15 | Crystal Filter | Quartz extreme selectivity | Complete |
| v1.16 | AGC Time Constant | Attack/release control | Complete |
| v1.17 | Noise Blanker | Pulse noise suppression (advanced) | Complete |
| v1.18 | Product Detector | Synchronous demodulation for SSB/CW | Complete |
| v1.19 | AGC Circuit | JFET voltage-controlled attenuator | Complete |
| v1.20 | Squelch Circuit | Noise-gated audio mute | Complete |
| v1.21 | BFO (Colpitts + buffer) | Carrier reinsertion for CW/SSB | **This Circuit** |
| v1.22+ | TBD | Frequency counter, VFO, PLL, and more | Planned |

The receiver chain is now nearly complete. We have every major subsystem of a communications-grade superheterodyne receiver: antenna tuning, preamplification, mixing, IF filtering, IF amplification, AGC, detection (both AM and SSB/CW), audio amplification, squelch, and now a proper BFO with buffer for CW and SSB reception. What remains are refinements: a frequency counter for digital readout, a VFO (variable frequency oscillator) to replace the crystal-locked local oscillator, and a PLL (phase-locked loop) for frequency synthesis.

---

## Classroom Extensions

1. **Pitch control experiment:** Tune in a CW signal (or simulate one with a signal generator at 455 kHz). Adjust the variable capacitor and listen to the audio pitch change. Measure the audio frequency with a frequency counter or smartphone app. Plot BFO offset vs. audio pitch — it should be perfectly linear.
2. **SSB intelligibility test:** Generate a test tone at 456 kHz (simulating a 1 kHz USB signal with suppressed carrier at 455 kHz). With the BFO off, observe the product detector output — no audio. Turn the BFO on at 455 kHz — the 1 kHz tone appears. Detune the BFO by 100 Hz — the tone shifts to 1100 Hz. This is why SSB tuning is so critical.
3. **Frequency stability measurement:** Monitor the BFO output frequency over 30 minutes with a frequency counter. Note the drift as the circuit warms up. Calculate the drift in ppm per degree C. How does this compare to a crystal oscillator?
4. **Buffer loading test:** Measure the BFO frequency with and without a load on the output. Without the buffer, connect a 10K resistor directly to the oscillator — note the frequency shift (pulling). With the buffer, connect the same 10K load to the buffer output — the oscillator frequency should not shift measurably.
5. **Mercury telemetry decode:** Glenn's telemetry used subcarrier frequencies from 400 Hz to 5400 Hz. If each subcarrier has a deviation of plus or minus 7.5% of its center frequency, what is the minimum frequency accuracy required for the demodulation oscillator to keep errors below 1% of the data range? (Answer: better than 0.25% of subcarrier frequency, or 1 Hz for the 400 Hz ECG channel.)
