# DIY Radio Circuit: AM Envelope Detector

## The Circuit

A classic germanium diode envelope detector that strips the audio signal from an AM carrier — the fifth circuit in the progressive radio series. The v1.2 transmitter generates a signal, the v1.3 receiver picks it up, the v1.4 mixer converts it to 455 kHz intermediate frequency, the v1.5 IF amplifier selects and amplifies it, and now the v1.6 envelope detector recovers the original audio from the amplified IF signal. This is where radio becomes sound.

The envelope detector is elegant in its simplicity: a diode, a resistor, and a capacitor. The diode rectifies the AM signal (passes only positive half-cycles). The RC filter smooths the rectified signal, following the slow-changing audio envelope while ignoring the fast 455 kHz carrier. What remains is the original modulating signal — voice, music, telemetry — extracted from the radio wave that carried it across distance.

**What it does:**
- Feed the output of the v1.5 IF amplifier (455 kHz AM signal) into the input
- The germanium diode (1N34A) rectifies the signal — its low forward voltage (0.2V vs 0.6V for silicon) means it can detect weak signals
- The RC filter (R=10K, C=10nF) smooths the rectified output with a time constant of 100 microseconds
- The cutoff frequency is 1/(2*pi*R*C) = 1/(2*pi*10e3*10e-9) = 1,592 Hz — passes audio, rejects carrier
- Output: the demodulated audio envelope, ready for amplification
- An AGC tap provides a DC voltage proportional to average signal strength (for the v1.6 AGC companion circuit)

**What it teaches:** Every AM radio ever built contains this circuit. From a crystal set with a cat's-whisker detector to Explorer 6's ground station at South Point, Hawaii, the principle is identical: rectify the carrier, filter out the RF, keep the audio. The germanium diode replaced the crystal detector of the 1920s but does exactly the same job. Explorer 6's telemetry was FM rather than AM, but the concept of extracting a baseband signal from a modulated carrier is universal across all analog radio.

**Total cost: ~$8**

---

## The Superheterodyne Chain (Series Context)

```
Radio Series Progress:
  v1.2 — Transmitter (oscillator → antenna)
  v1.3 — Receiver (antenna → detector → audio)
  v1.4 — Mixer (RF + LO → IF)
  v1.5 — IF Amplifier (IF → amplified, filtered IF)
  v1.6 — AM Envelope Detector (IF → audio) ← YOU ARE HERE
  v1.7 — [planned] Audio amplifier + speaker driver
  v1.8 — [planned] Full receiver integration

The complete superheterodyne signal chain:
  Antenna → RF amplifier → Mixer ← Local Oscillator
                              ↓
                        IF Amplifier (455 kHz)
                              ↓
                        Envelope Detector ← THIS CIRCUIT
                              ↓
                        Audio Amplifier → Speaker

Explorer 6 ground station (South Point, Hawaii):
  Yagi antenna → LNA → Mixer ← Synthesized LO
                           ↓
                     IF chain (455 kHz, narrow BW)
                           ↓
                     FM discriminator (not AM — but same concept)
                           ↓
                     Scan-line data → Strip-chart recorder → Image
```

## Schematic

```
                                    AGC Tap
                                      |
                                    R_agc
                                    100K
                                      |
Input ──── C_in ──── D1 ────┬──── C_agc ──── AGC Output
(from IF)  100nF    1N34A   |     10uF        (DC level)
                            |
                       ┌────┴────┐
                       |         |
                      R1        C1
                     10K       10nF
                       |         |
                       └────┬────┘
                            |
                         Output ──── C_out ──── Audio Out
                            |       100nF
                           GND

SIGNAL FLOW:

  IF Input (455 kHz AM)          Rectified Output       Smoothed Audio
       ╱╲    ╱╲                    ╱╲                    ___     ___
      ╱  ╲  ╱  ╲                  ╱  ╲                  ╱   ╲   ╱   ╲
  ───╱────╲╱────╲───  →  D1  →  ╱    ╲    →  RC  →   ╱     ╲_╱     ╲___
     ╲    ╱╲    ╱                      ╲
      ╲  ╱  ╲  ╱                        ╲
       ╲╱    ╲╱                          0

   AM modulated IF       Half-wave         Audio envelope
   (carrier + audio)     rectified         (carrier removed)
```

## RC Time Constant Selection

The RC filter must satisfy two competing requirements:

1. **Fast enough** to follow the highest audio frequency of interest (~3-4 kHz for voice)
2. **Slow enough** to reject the 455 kHz carrier

The time constant tau = R * C must satisfy:

```
1 / f_carrier  <<  tau  <<  1 / f_audio_max

1 / 455,000  <<  tau  <<  1 / 3,000
2.2 us       <<  tau  <<  333 us

Chosen: R = 10K, C = 10nF
tau = 10e3 * 10e-9 = 100 us

Carrier rejection: tau / T_carrier = 100us / 2.2us = 45x ✓
Audio tracking:    tau / T_audio   = 100us / 333us = 0.3x ✓

-3 dB cutoff: f_c = 1 / (2*pi*R*C) = 1,592 Hz
This passes voice fundamentals and low harmonics.
For wider bandwidth (music), reduce C to 4.7nF:
  f_c = 1 / (2*pi*10e3*4.7e-9) = 3,387 Hz
```

## Component List

| Part | Qty | Description | Est. Cost |
|------|-----|-------------|-----------|
| 1N34A | 1 | Germanium point-contact diode, V_f ≈ 0.2V | $1.50 |
| 10K resistor | 1 | 1/4W, detector load resistor | $0.10 |
| 10nF capacitor | 1 | Ceramic, filter capacitor (carrier bypass) | $0.10 |
| 100nF capacitor | 2 | Ceramic, input and output coupling | $0.20 |
| 100K resistor | 1 | 1/4W, AGC tap resistor | $0.10 |
| 10uF capacitor | 1 | Electrolytic, AGC filter (long time constant) | $0.20 |
| Breadboard | 1 | Small, 400-point | $3.00 |
| Jumper wires | ~8 | For breadboard connections | $1.00 |
| BNC/RCA jacks | 2 | Input and output connectors (optional) | $1.50 |

**Total: ~$8**

## Build Steps

### Step 1: Input coupling
- Place C_in (100nF) on the breadboard
- One end connects to the IF amplifier output (v1.5 circuit)
- Other end connects to the diode anode

### Step 2: Diode
- Place the 1N34A germanium diode
- **Orientation matters:** Anode (no band) toward the input, Cathode (banded end) toward the output
- The diode passes only positive half-cycles of the IF signal

### Step 3: RC filter
- From the diode cathode, connect R1 (10K) to GND
- In parallel, connect C1 (10nF) to GND
- The junction of R1 and C1 is the demodulated audio output

### Step 4: AGC tap
- From the diode cathode, connect R_agc (100K) in series with C_agc (10uF) to GND
- The junction of R_agc and C_agc provides a slowly-varying DC voltage proportional to the average signal strength
- This AGC voltage can control the gain of a preceding stage (see the companion AGC circuit: agc-circuit.cir)

### Step 5: Output coupling
- Connect C_out (100nF) from the audio output to the next stage (audio amplifier or headphones)
- The coupling capacitor blocks the DC component, passing only the AC audio signal

### Step 6: Test
- Connect the v1.5 IF amplifier output to the input
- Connect the output through a 100nF capacitor to a high-impedance earphone or oscilloscope
- You should hear the demodulated audio (if the IF amplifier is receiving an AM signal)
- On a scope, you will see the audio waveform at the output, clean of the 455 kHz carrier

## Theory of Operation

### Why germanium?

The 1N34A is a germanium point-contact diode with a forward voltage of approximately 0.2V. Silicon diodes (1N4148, etc.) have a forward voltage of 0.6V. For weak signals — which is what a radio receiver typically deals with — the lower threshold means the germanium diode can detect signals that a silicon diode would simply ignore. This is why crystal radio builders still seek out germanium diodes: they work with the tiny voltages available from a passive antenna.

Explorer 6's telemetry system had to deal with received signal levels as low as -140 dBm at apogee (42,400 km). At those levels, every fraction of a volt matters. The ground station at South Point used more sophisticated detection methods (phase-locked loops, correlation receivers), but the principle of extracting a baseband signal from a modulated carrier is the same regardless of the detector technology.

### The AGC connection

The AGC (Automatic Gain Control) tap on this circuit feeds a DC voltage proportional to the received signal strength back to a gain-control element in a preceding amplifier stage. When the signal is strong (spacecraft near perigee, 237 km), the AGC voltage is high and reduces the gain. When the signal is weak (spacecraft near apogee, 42,400 km), the AGC voltage drops and the gain increases. This prevents the receiver from being overloaded by strong signals and from losing weak ones.

Explorer 6 traversed a 237-to-42,400 km orbit range — a distance ratio of 179:1, which means the received power varied by a factor of 179^2 = 32,000:1 (45 dB). Without AGC, the receiver would have been saturated at perigee and deaf at apogee. AGC is what made continuous telemetry reception possible across such a vast dynamic range.

## Connection to Mission 1.6

Explorer 6 was the first spacecraft to return a TV image of Earth, but it was also a radiation and magnetic field observatory. Its telemetry had to carry photocell brightness data, Geiger counter readings, magnetometer vectors, and housekeeping data — all multiplexed onto a single FM carrier. The ground station at South Point, Hawaii, had to demodulate that carrier, demultiplex the data channels, and reconstruct the science. The envelope detector in this circuit is the simplest version of that process: one modulated signal in, one baseband signal out. The principle scales from a $8 breadboard circuit to a deep-space ground station. The math is the same. Only the noise budget is different.
