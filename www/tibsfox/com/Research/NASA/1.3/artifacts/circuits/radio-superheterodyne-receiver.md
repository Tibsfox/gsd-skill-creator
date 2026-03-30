# DIY Radio Circuit: Superheterodyne AM Receiver

## The Circuit

A superheterodyne AM receiver — the companion to v1.2's VHF transmitter. Mission 1.2 built the transmitter side (crystal oscillator + x4 multiplier = 108 MHz). Mission 1.3 builds the RECEIVER side. This circuit demonstrates the same superheterodyne principle that Pioneer's ground stations at Cape Canaveral, Jodrell Bank, and Goldstone used to receive Pioneer 2's 108 MHz signal.

For accessibility and cost, this circuit receives AM broadcast band signals (530-1700 kHz) rather than VHF. The superheterodyne principle is identical at any frequency — the AM band just lets you build the receiver with cheaper components and hear real broadcast stations. The concepts translate directly to VHF, UHF, and the S-band receivers used by every subsequent NASA mission.

**What it does:**
- Tunes to AM broadcast stations using a variable capacitor
- A crystal-controlled local oscillator mixes with the incoming signal
- The mixer produces an intermediate frequency (IF) at 455 kHz
- The IF amplifier provides selectivity and gain
- An envelope detector recovers the audio
- An LM386 audio amplifier drives a speaker or headphones
- You hear AM radio stations — received, amplified, and demodulated by a circuit you built on a breadboard

**What it teaches:** Every radio receiver since 1918 (when Edwin Armstrong invented the superheterodyne) works this way. The RTL-SDR dongle from v1.2 is a superheterodyne. Every GPS receiver, every cell phone, every satellite ground station — superheterodyne. This is THE receiver architecture.

**Total cost: ~$22-25**

---

## Why Superheterodyne?

The fundamental problem of radio reception: you want to amplify and filter a signal at a specific frequency, but the frequency changes depending on which station (or spacecraft) you want to receive. Building a high-gain, narrow-bandwidth amplifier that can be tuned across a wide range is extremely difficult — the amplifier tends to oscillate, and the bandwidth changes as you tune.

Armstrong's solution (1918): don't try to amplify at the received frequency. Instead, mix the received signal with a local oscillator to produce a fixed intermediate frequency (IF). Build your high-gain, narrow-bandwidth amplifier at the IF — it never changes frequency, so it can be optimized once and left alone. Tuning is done by changing the local oscillator frequency, which is easy and stable.

```
Received signal (variable):  f_signal = 530 to 1700 kHz (AM band)
Local oscillator (tuned):    f_LO = f_signal + 455 kHz
Intermediate frequency:      f_IF = f_LO - f_signal = 455 kHz (always)

Example:
  Station at 1000 kHz: LO = 1455 kHz, IF = 1455 - 1000 = 455 kHz
  Station at 700 kHz:  LO = 1155 kHz, IF = 1155 - 700 = 455 kHz
  The IF amplifier always sees 455 kHz regardless of which station is tuned.
```

Pioneer's ground stations used the same principle at VHF:
```
Pioneer signal:              f_signal = 108.06 MHz
Ground station LO:           f_LO = 108.06 + 10.7 MHz = 118.76 MHz
                             (or f_LO = 108.06 - 10.7 = 97.36 MHz)
IF:                          f_IF = 10.7 MHz (standard VHF IF)

The IF amplifier at 10.7 MHz was where the narrow bandwidth
filtering happened — selecting Pioneer's signal and rejecting
everything else in the VHF band.
```

## Block Diagram

```
[Antenna] → [RF Tuned Circuit] → [Mixer] → [IF Filter 455kHz] → [IF Amp] → [Detector] → [Audio Amp] → [Speaker]
                                     ↑
                              [Local Oscillator]
                              (variable, tracks
                               the tuned circuit)
```

## RF Front End (Antenna + Tuned Circuit)

```
ANTENNA (1-2 meters of wire, or a ferrite bar antenna)
    |
    +---||---+
    |  C_ant  |
    | (220pF) |
    |         +--- L1 (ferrite loopstick antenna coil, ~240uH)
    |         |     or hand-wound coil on ferrite rod
    |         |
    +----+----+
         |
         C_tune (variable capacitor, ~10-365pF)
         |
        GND

The tuned circuit (L1 + C_tune) resonates at the desired station:
  f = 1 / (2pi * sqrt(L1 * C_tune))

  With L1 = 240uH:
    C = 365pF: f = 1/(2pi*sqrt(240e-6 * 365e-12)) = 538 kHz
    C = 10pF:  f = 1/(2pi*sqrt(240e-6 * 10e-12))  = 3253 kHz

  This covers the AM band (530-1700 kHz) with room to spare.
  Use a standard AM ferrite loopstick antenna assembly (~$3)
  or wind ~65 turns of 28 AWG wire on a 10mm ferrite rod.

The RF tuned circuit provides initial selectivity — it rejects
signals far from the tuned frequency but has broad bandwidth
(~50-100 kHz). The IF filter provides the fine selectivity.
```

## Local Oscillator

```
        +9V
         |
         R1 (10K)
         |
         +-------> to mixer
         |
      [collector]
         |
      2N3904 (Q1)
      [base]
         |
         +---||---+
         | L2     |
         |(osc    |
         | coil)  |
         +---||---+
         |        |
        C1       C2
       150pF    C_tune2 (ganged with C_tune, +455kHz offset)
         |        |
         +---+----+
             |
            GND

The local oscillator tracks the RF tuned circuit, always
455 kHz higher. This is achieved by "ganging" the two
variable capacitors (C_tune and C_tune2) on the same shaft
but with different coil values:

  L2 is chosen so that with C_tune2 on the same shaft,
  f_LO = f_RF + 455 kHz across the entire tuning range.

  In practice: L2 ~ 120-150uH with a trimmer to calibrate.

Standard approach: use a 2-gang variable capacitor (available
as a single component — two cap sections on one shaft, ~$4).
Section 1 = C_tune (RF). Section 2 = C_tune2 (LO).

Simplified version: use a single variable cap for the LO
and tune by ear. Less convenient but cheaper and teaches
the principle. You manually tune both the RF and LO stages
to bring the IF to exactly 455 kHz.
```

## Mixer

The mixer multiplies the RF signal with the LO signal to produce sum and difference frequencies:

```
RF signal (f_s) + LO signal (f_LO) → outputs at (f_LO + f_s) and (f_LO - f_s)

Only (f_LO - f_s) = 455 kHz passes through the IF filter.
The sum frequency is rejected by the IF filter.

Simple diode mixer:
                RF in (from tuned circuit)
                    |
                    +---||---+
                    | C3     |
                    |(0.01uF)|
                    |        +--[D1 (1N4148)]--+---> IF output
                    |        |                  |      (to IF filter)
                    |        |  LO in           |
                    |        +---||---+---------+
                    |           C4    |
                    |         (0.01uF)|
                    |                 |
                   GND               GND

The diode's nonlinearity creates the multiplication.
C3 and C4 are coupling capacitors — they pass RF/LO signals
while blocking DC.

For better performance: use a dual-gate MOSFET (BF998) or
an SA612/NE602 IC mixer (~$3). The SA612 includes both the
mixer AND the local oscillator in one 8-pin IC, simplifying
the build considerably.
```

## IF Filter and Amplifier (455 kHz)

```
IF output from mixer
    |
    +---> [455 kHz ceramic filter] ---> to IF amplifier
          (standard 3-pin component, ~$1)

The ceramic filter passes a ~6 kHz bandwidth centered on
455 kHz and rejects everything else. This is the "narrow
window" that provides station selectivity.

Without the ceramic filter: use a hand-wound IF transformer
(two coupled coils tuned to 455 kHz). Works but harder to
calibrate. The ceramic filter is the modern standard.

IF amplifier:
        +9V
         |
         R3 (1K)
         |
         +-------> to detector
         |
      [collector]
         |
      2N3904 (Q2)
      [base]
         |
    C5 (0.01uF) — coupling from IF filter
         |
    IF filter output
         |
      [emitter]
         |
         R4 (220R)
         |
         +
         |
        C6 (0.01uF) — emitter bypass (AC ground)
         |
        GND

Bias:
  R5 (100K) from +9V to base
  R6 (10K) from base to GND

Gain: ~30-40 dB at 455 kHz. For stronger stations,
this is sufficient. For weak stations, add a second
identical stage (Q3) in cascade.
```

## Envelope Detector

```
IF amp output
    |
    +--[D2 (1N4148)]--+--[R7 (10K)]--+---> Audio output
                       |              |     (to volume pot)
                      C7             C8
                    (0.01uF)       (0.001uF)
                       |              |
                      GND            GND

The diode rectifies the IF signal.
C7 smooths the IF carrier (455 kHz), leaving the audio envelope.
C8 removes any residual IF ripple.
R7 provides the discharge path for the detector capacitor.

This is the simplest AM demodulator — the same circuit used
in crystal radio sets since the 1920s. The diode follows the
peaks of the modulated IF signal, and the RC filter removes
the carrier, leaving the audio modulation.
```

## Audio Amplifier (LM386)

```
Audio from detector
    |
    [10K log pot] — volume control
    |
    +--[10uF]--> pin 3 (non-inverting input)
                  |
               [LM386]
                  |
        pin 5 --> [220uF] --> 8 ohm Speaker
                  |
                 GND

Gain: 20 (default). For more gain: 10uF cap between pins 1 and 8.

3.5mm headphone jack wired in parallel with speaker
(switched jack disconnects speaker when headphones inserted).
```

## Full Signal Path

```
[Antenna/Ferrite bar]
         |
    [L1 + C_tune] ← RF tuned circuit (selects approximate station)
         |
    [Mixer (D1)] ← mixed with Local Oscillator (Q1 + L2 + C_tune2)
         |
    [455 kHz ceramic filter] ← precise selectivity (6 kHz bandwidth)
         |
    [IF amplifier (Q2)] ← gain at fixed frequency
         |
    [Envelope detector (D2)] ← recovers audio from AM carrier
         |
    [Volume pot (10K log)]
         |
    [LM386 audio amp]
         |
    [Speaker / headphones]
```

## Parts List

| Part | Value | Qty | Cost |
|------|-------|-----|------|
| 2N3904 NPN transistor | - | 2 | $0.20 |
| 1N4148 signal diode | - | 2 | $0.10 |
| LM386 audio amplifier IC | - | 1 | $1.00 |
| 455 kHz ceramic filter | 3-pin | 1 | $1.00 |
| Ferrite loopstick antenna | AM band | 1 | $3.00 |
| 2-gang variable capacitor | ~10-365pF per section | 1 | $4.00 |
| Tuning knob | for variable cap | 1 | $0.50 |
| Capacitor 150pF ceramic | - | 1 | $0.05 |
| Capacitor 220pF ceramic | - | 1 | $0.05 |
| Capacitor 0.001uF ceramic | - | 1 | $0.05 |
| Capacitor 0.01uF ceramic | - | 4 | $0.20 |
| Capacitor 10uF electrolytic | 16V | 1 | $0.05 |
| Capacitor 220uF electrolytic | 16V | 1 | $0.15 |
| Resistor 220R | 1/4W | 1 | $0.05 |
| Resistor 1K | 1/4W | 1 | $0.05 |
| Resistor 10K | 1/4W | 3 | $0.15 |
| Resistor 100K | 1/4W | 1 | $0.05 |
| Potentiometer 10K log (volume) | - | 1 | $0.80 |
| 8 ohm small speaker | 2-3 inch | 1 | $2.00 |
| 3.5mm switched headphone jack | - | 1 | $0.50 |
| Knob for volume pot | - | 1 | $0.40 |
| 9V battery snap | - | 1 | $0.20 |
| 9V battery | - | 1 | $3.00 |
| Breadboard (full-size) | - | 1 | $5.00 |
| Jumper wire kit | - | 1 | $2.50 |
| **Total** | | | **~$25.05** |

## Build Instructions

1. **Build the audio amplifier first.** Wire the LM386 with the volume pot and speaker. Connect an audio source (phone headphone output) to verify it works. You should hear audio through the speaker. This proves the back end of the receiver is working before you add the tricky RF stages.

2. **Build the IF amplifier.** Wire Q2 with the biasing resistors and 455 kHz ceramic filter on the input. Touch the input with your finger — you should hear a faint hum or buzz as 60 Hz noise passes through the IF stage (poorly, but enough to verify gain).

3. **Build the envelope detector.** Wire D2 with the RC filter between the IF amp output and the audio amp input. The signal chain from IF input to speaker is now complete.

4. **Build the local oscillator.** Wire Q1 with the oscillator coil L2 and one section of the 2-gang variable capacitor. If you have an oscilloscope or frequency counter, verify oscillation across the range. If not, proceed — you'll verify by ear.

5. **Build the mixer.** Wire D1 with the coupling capacitors, connecting the RF input and LO input to the IF output.

6. **Connect the antenna.** Wire the ferrite loopstick antenna with the other section of the 2-gang variable capacitor. If using a wire antenna instead, wind ~20 turns of hookup wire around a ferrite rod and connect in parallel with the variable cap.

7. **Tune it up.** Slowly rotate the tuning knob. At certain positions, you should hear AM broadcast stations — music, voices, static. The signal will be faint initially; adjust the antenna orientation for best reception (ferrite loopstick antennas are directional — broadside gives best signal, end-on gives a null).

8. **Optimize.** If the IF is off-frequency (stations sound distorted or you hear two stations at once), adjust the LO coil trimmer. Peak the signal by slight adjustments. Once the IF is centered at 455 kHz, stations should sound clear.

## The Superheterodyne Principle: Pioneer's Ground Stations

Pioneer 2's 108.06 MHz signal was received by superheterodyne receivers at:
- **Cape Canaveral tracking stations** — purpose-built VHF receivers
- **Jodrell Bank Observatory (UK)** — 76-meter Lovell Telescope, outfitted with VHF feed
- **Goldstone (California)** — 26-meter dish, JPL's Deep Space Network precursor

Each receiver used the same architecture as your AM circuit, scaled to VHF:

```
Your AM receiver:              Pioneer ground station:
  RF: 530-1700 kHz             RF: 108.06 MHz
  LO: RF + 455 kHz             LO: 108.06 + 10.7 MHz
  IF: 455 kHz                  IF: 10.7 MHz
  Bandwidth: ~6 kHz            Bandwidth: ~3 kHz (narrower for weak signal)
  Antenna: ferrite bar         Antenna: 26-76 meter dish
  Sensitivity: ~100 uV         Sensitivity: ~0.01 uV (-140 dBm)

Same blocks, same principle, different scale.
The dish antenna provides 40-50 dB of gain.
The cryogenic preamplifier provides extremely low noise.
But the mixer, IF filter, and detector are the same topology.
```

The signal from Pioneer 2, 300 milliwatts from 1,550 km away, arrived at the ground station antenna at roughly -110 to -120 dBm. The superheterodyne receiver's IF filter selected that signal from among all the other signals in the VHF band, and the IF amplifier brought it up to a level where the detector could recover the telemetry modulation. Forty-five minutes of data, received by the same circuit architecture you just built on a breadboard.

## What You Learn

- **The superheterodyne principle** — the single most important invention in radio engineering. Every radio receiver you have ever used is a superheterodyne (or its digital equivalent, which still performs the same mathematical operation). Understanding this architecture unlocks every receiver design from AM radio to GPS to deep space communication.
- **Frequency mixing** — the nonlinear multiplication of two signals produces sum and difference frequencies. This is the foundation of all frequency conversion in electronics: radio, signal processing, spectrum analysis, radar. The math: cos(a) * cos(b) = 0.5 * [cos(a+b) + cos(a-b)].
- **IF filtering** — building a highly selective filter at a fixed frequency is much easier than building one that tracks a variable frequency. The ceramic filter at 455 kHz provides ~6 kHz bandwidth with steep rejection — the same filtering principle used at every IF frequency in every receiver ever built.
- **Envelope detection** — the simplest demodulator, recovering the audio from an AM signal using just a diode and capacitor. This is the same circuit as a crystal radio, and it's the same principle as the peak detector used in every AM receiver since the 1920s.
- **The progressive radio series** — v1.2 built the transmitter. v1.3 builds the receiver. Together, they form a complete communication link: one circuit generates a radio signal, the other receives it. This is the fundamental architecture of ALL radio communication, from AM broadcast to deep space telemetry.

## The Progressive Radio Series (Updated)

| Mission | Circuit | What You Build | Series Role |
|---------|---------|----------------|-------------|
| **v1.2 Pioneer 1** | VHF Transmitter | Crystal osc + x4 multiplier to 108 MHz | **TRANSMIT** |
| **v1.3 Pioneer 2** | Superheterodyne Receiver | AM superhet: mixer + IF + detector | **RECEIVE** |
| Future missions | Enhanced modulation | BPSK/QPSK modulator/demodulator stages | **DATA** |
| Future missions | Antenna systems | Yagi, dish, and phased array designs | **DIRECTIVITY** |
| Future missions | Digital demodulation | FPGA-based correlation receiver | **MODERN** |

By mission 20, the accumulated radio circuits form both halves of a complete communication system: transmission, reception, modulation, demodulation, antenna, and signal processing. The progression mirrors the actual history of space communication technology from Pioneer to Voyager to James Webb.

## Safety and Legal Notes

- **This is a receive-only circuit.** It does not transmit. No FCC license is required to receive radio signals.
- **AM broadcast reception is legal everywhere.** The stations are broadcasting specifically for you to receive them.
- **No shock hazard** at 9V battery operation.
- **Antenna safety:** Do not erect outdoor antennas near power lines.

## Fox Companies Connection

Seventh circuit in the NASA kit series. This completes the first transmit-receive pair: v1.2's VHF transmitter + v1.3's superheterodyne receiver. Together they demonstrate the complete radio communication link that every spacecraft depends on. Workshop model: half the participants build transmitters (v1.2), half build receivers (v1.3). The transmitters output at ~108 MHz, the receivers tune to AM broadcast. Then swap circuits — everyone gets to build both halves. Advanced exercise: connect the v1.2 transmitter's audio modulation to a 455 kHz crystal oscillator, and the v1.3 receiver tunes to pick it up directly (no AM band needed). Two breadboards, one link, the same physics that connected Pioneer 2 to Jodrell Bank.
