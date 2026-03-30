# DIY Radio Circuit: Diode Ring Frequency Mixer

## The Circuit

A diode ring mixer using 4 x 1N4148 diodes in a ring (balanced mixer) configuration. Two inputs: RF (signal) and LO (local oscillator). Output: IF (intermediate frequency = difference and sum of RF and LO). This is the third circuit in the progressive radio series: v1.2 built the transmitter, v1.3 built the receiver, v1.4 builds the mixer — the component at the heart of every superheterodyne receiver.

For demonstration, two 555-based oscillators at different frequencies (10 kHz and 12 kHz) provide the RF and LO signals. The mixer produces 2 kHz (difference) and 22 kHz (sum). An RC low-pass filter on the output selects the 2 kHz difference frequency, which is audible through a speaker. This is the same principle used in Pioneer's ground station receivers to down-convert the 108 MHz signal to a fixed intermediate frequency for processing.

**What it does:**
- Oscillator A generates 10 kHz (the "RF signal" — representing Pioneer's 108 MHz downlink)
- Oscillator B generates 12 kHz (the "local oscillator" — the receiver's internal reference)
- The diode ring multiplies the two signals, producing 2 kHz (difference) and 22 kHz (sum)
- An RC low-pass filter passes the 2 kHz and rejects the 22 kHz
- You hear the 2 kHz tone through a speaker — a pure tone that exists in NEITHER input signal
- Adjusting either oscillator changes the output frequency: the mixer tracks the difference

**What it teaches:** Frequency mixing is the fundamental operation of all radio receivers. When Pioneer 3's 960.05 MHz signal arrived at the ground station, a mixer combined it with a local oscillator to produce a fixed IF for processing. Every cell phone, every GPS receiver, every WiFi radio, every satellite ground station uses this exact operation. The diode ring mixer is the oldest, simplest, and most elegant implementation.

**Total cost: ~$16**

---

## The Superheterodyne Principle

The v1.3 receiver introduced the superheterodyne concept. This circuit isolates the MIXER — the component that makes it work.

```
The mathematical identity behind mixing:

  cos(A) * cos(B) = 0.5 * [cos(A-B) + cos(A+B)]

When you multiply two signals at frequencies f_RF and f_LO:
  Output contains: f_LO - f_RF (difference frequency = IF)
                   f_LO + f_RF (sum frequency, filtered out)

Our demonstration:
  f_RF = 10 kHz (representing Pioneer's signal)
  f_LO = 12 kHz (representing the ground station LO)
  f_IF = 12 - 10 = 2 kHz (the difference — our audible output)
  f_sum = 12 + 10 = 22 kHz (filtered out by the low-pass)

Pioneer's ground station:
  f_RF = 960.05 MHz (Pioneer 3 downlink)
  f_LO = 960.05 + 10.7 MHz = 970.75 MHz
  f_IF = 10.7 MHz (standard IF for VHF/UHF receivers)
  f_sum = 1930.8 MHz (rejected by IF filter)

Same math. Same circuit topology. Different frequencies.
```

## Why a Diode Ring?

The diode ring mixer (also called a balanced mixer or double-balanced mixer) is used because:

1. **It suppresses the input signals at the output.** An ideal ring mixer output contains ONLY the sum and difference — not the original RF or LO. This makes filtering easier.

2. **It has no DC bias.** The ring topology cancels the DC component that a single-diode mixer would produce.

3. **It's bidirectional.** The same ring can be used as an up-converter (IF + LO = RF) or a down-converter (RF + LO = IF). Same circuit, both directions.

4. **It's passive.** No amplification, no power supply needed for the mixer itself. Just four diodes and two transformers. It works from DC to microwave.

## Block Diagram

```
                                    +---------+
  [555 #1] → 10 kHz ──→ RF IN ──→ |         | ──→ IF OUT ──→ [RC LPF] ──→ [LM386] ──→ Speaker
                                    |  DIODE  |                  ↓
  [555 #2] → 12 kHz ──→ LO IN ──→ |  RING   |              2 kHz tone
                                    |  MIXER  |             (difference)
                                    +---------+

  The 22 kHz sum is rejected by the RC low-pass filter.
  Only the 2 kHz difference passes through to the speaker.
```

## Diode Ring Mixer Circuit

```
The diode ring is four 1N4148 diodes arranged in a ring between
two transformer-coupled ports:

                    T1 (RF transformer)
     RF IN ──→ ●─────┐
                      │ secondary
               ┌──────┤
               │      │
               │      └──────┐
               │              │
          ┌────┴────┐    ┌────┴────┐
          │  D1 →   │    │  ← D2  │
          │ 1N4148  │    │ 1N4148  │
          └────┬────┘    └────┬────┘
               │              │
               ├──── IF OUT ──┤
               │              │
          ┌────┴────┐    ┌────┴────┐
          │  ← D3   │    │  D4 →  │
          │ 1N4148  │    │ 1N4148  │
          └────┬────┘    └────┬────┘
               │              │
               └──────┤      │
                      │ secondary
     LO IN ──→ ●─────┘
                    T2 (LO transformer)

Diode directions form a ring: D1→, ←D2, ←D3, D4→
(arrows show anode→cathode direction)

The LO signal switches the diode pairs on and off alternately.
When D1+D4 conduct, the RF signal passes with one polarity.
When D2+D3 conduct, the RF signal passes with inverted polarity.
This chopping action IS the multiplication.

Transformer winding:
  T1, T2: each is a small signal transformer, center-tapped secondary.
  Use miniature audio transformers (1:1 or 1:1 CT, ~$1.50 each).
  The center tap is the signal injection point.
  The two ends of the secondary connect to the diode ring.
```

## Simplified Build (Without Transformers)

For easier construction, replace the transformers with capacitor coupling:

```
                         C1 (0.01uF)
  RF IN (10 kHz) ──→ ──||──┬──────────────┬── IF OUT
                            │              │
                       ┌────┴────┐    ┌────┴────┐
                       │  D1 →   │    │  ← D2  │
                       │ 1N4148  │    │ 1N4148  │
                       └────┬────┘    └────┬────┘
                            │              │
                            ├──── GND ─────┤
                            │              │
                       ┌────┴────┐    ┌────┴────┐
                       │  ← D3   │    │  D4 →  │
                       │ 1N4148  │    │ 1N4148  │
                       └────┬────┘    └────┬────┘
                            │              │
                            └──────┬───────┘
                                   │
                         C2 (0.01uF)
  LO IN (12 kHz) ──→ ──||──┘

This simplified version works well at audio/low frequencies.
The balance won't be as good as the transformer version
(some RF/LO feedthrough to the output), but the mixing
products are clearly audible and the principle is demonstrated.
```

## 555 Oscillator A: RF Signal (10 kHz)

```
        +9V
         |
         R1a (680R)
         |
         +---[pin 7]
         |
         R2a (680R)
         |
         +---[pin 6]---[pin 2]
         |
         C1a (0.1uF)
         |
        GND

  pin 8 (VCC) → +9V
  pin 1 (GND) → GND
  pin 4 (reset) → +9V
  pin 5 (control) → 0.01uF → GND
  pin 3 (output) → RF input of mixer (through 0.01uF coupling cap)

  Frequency:
    f = 1.44 / ((R1a + 2*R2a) * C1a)
    f = 1.44 / ((680 + 1360) * 0.0000001) = 7,058 Hz

  Adjust R2a to ~620R or use a 500R trimpot + 200R series:
    f = 1.44 / ((680 + 2*500) * 0.1uF) = 8,571 Hz

  For closer to 10 kHz:
    R1a = 470R, R2a = 470R, C1a = 0.1uF
    f = 1.44 / ((470 + 940) * 0.1uF) = 10,213 Hz ← target
```

## 555 Oscillator B: Local Oscillator (12 kHz)

```
  Same circuit topology as Oscillator A.
  R1b = 470R
  R2b = 390R (slightly lower → higher frequency)
  C1b = 0.1uF

  f = 1.44 / ((470 + 780) * 0.1uF) = 11,520 Hz

  Use a 500R trimpot for R2b to calibrate exactly to 12 kHz.
  The trimpot lets you sweep the LO frequency and hear the
  IF output frequency change in real time — this is tuning
  a radio receiver.
```

## Output Filter (RC Low-Pass)

```
Mixer IF output
    |
    R_lpf (10K)
    |
    +───── output to audio amp
    |
    C_lpf (0.01uF)
    |
   GND

  Cutoff frequency:
    f_c = 1 / (2 * pi * R * C)
    f_c = 1 / (2 * 3.14159 * 10000 * 0.00000001)
    f_c = 1,592 Hz

  Wait — that's below 2 kHz. Adjust:
    C_lpf = 0.022uF:
    f_c = 1 / (2 * 3.14159 * 10000 * 0.000000022) = 723 Hz
    Too low.

    Better: R_lpf = 4.7K, C_lpf = 0.01uF:
    f_c = 1 / (2 * 3.14159 * 4700 * 0.00000001) = 3,386 Hz

  This passes 2 kHz and attenuates 22 kHz by ~16 dB (first-order).
  For steeper rolloff, add a second RC stage:

    First stage:  R = 4.7K, C = 0.01uF → f_c = 3.4 kHz
    Second stage: R = 4.7K, C = 0.01uF → f_c = 3.4 kHz

  Combined: ~32 dB attenuation at 22 kHz. The 2 kHz tone
  will be clearly dominant. The 22 kHz component (above
  human hearing for most adults anyway) is largely gone.
```

## Audio Amplifier (LM386)

```
  Same as v1.3 receiver:

  Filtered IF output
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

  pin 6 (V+) → +9V
  pin 4 (GND) → GND
  Gain: 20 (default)
```

## The Experiment

The key experiment with this circuit:

1. **Set both oscillators to the same frequency.** Turn the LO trimpot until both are at ~10 kHz. The output should be nearly silent (DC output — difference = 0 Hz). You're listening to the IF go to zero.

2. **Slowly increase the LO frequency.** As you turn the trimpot, you'll hear a tone appear in the speaker — starting from very low (sub-bass) and rising in pitch as the frequency difference increases. At 12 kHz LO, you hear 2 kHz. At 15 kHz LO, you hear 5 kHz.

3. **This is what tuning a radio does.** When the ground station operator at Goldstone adjusted the local oscillator frequency, they were doing exactly this — sweeping the LO until the IF output fell in the passband of the IF filter. When Pioneer 3's signal at 960.05 MHz met the LO at 970.75 MHz, the IF came out at exactly 10.7 MHz. The operator heard the signal "lock in" just as you hear the tone appear when the frequencies are close.

4. **Change the RF frequency instead.** Leave the LO fixed and adjust the RF trimpot. Same result — the IF changes. This simulates Doppler shift: as Pioneer 3 moved toward or away from Earth, its signal frequency shifted slightly, and the ground station's receiver tracked the change.

## Parts List

| Part | Value | Qty | Cost |
|------|-------|-----|------|
| 555 Timer IC (NE555) | - | 2 | $0.50 |
| LM386 Audio Amplifier IC | - | 1 | $1.00 |
| 1N4148 Signal Diode | - | 4 | $0.20 |
| Resistor 470R | 1/4W | 2 | $0.10 |
| Resistor 4.7K | 1/4W | 2 | $0.10 |
| Resistor 10K | 1/4W | 1 | $0.05 |
| Trimpot 500R | - | 2 | $0.80 |
| Capacitor 0.1uF ceramic | - | 2 | $0.10 |
| Capacitor 0.01uF ceramic | - | 6 | $0.30 |
| Capacitor 10uF electrolytic | 16V | 1 | $0.05 |
| Capacitor 220uF electrolytic | 16V | 1 | $0.15 |
| Potentiometer 10K log (volume) | - | 1 | $0.80 |
| 8 ohm small speaker | 2-3 inch | 1 | $2.00 |
| 9V battery snap | - | 1 | $0.20 |
| 9V battery | - | 1 | $3.00 |
| Breadboard (full-size) | - | 1 | $5.00 |
| Jumper wire kit | - | 1 | $2.50 |
| **Total** | | | **~$16.85** |

## Build Instructions

1. **Build the audio amplifier first.** Wire the LM386 with volume pot and speaker, same as v1.3. Verify it works with an audio input.

2. **Build Oscillator A (RF, 10 kHz).** Wire the first 555 with the values above. Connect its output to a test LED to verify it's oscillating (LED will appear dimly lit at 10 kHz — too fast to see flicker, but you'll see it's on).

3. **Build Oscillator B (LO, 12 kHz).** Wire the second 555. Same verification.

4. **Build the diode ring.** Wire the four 1N4148 diodes in the ring configuration. Pay attention to polarity — the ring must be wired correctly for the balanced mixer to work. Use the simplified (capacitor-coupled) version for first build.

5. **Connect RF and LO to the mixer inputs.** Through 0.01uF coupling caps to block DC.

6. **Build the low-pass filter.** Two-stage RC filter between the mixer output and the audio amp input.

7. **Power up and listen.** You should hear a clear tone at approximately 2 kHz — a pitch that exists in neither input signal. This tone was CREATED by the mixer. It is the difference frequency. It is the IF.

8. **Sweep the LO trimpot.** Listen to the output tone change pitch. You are tuning a radio receiver. When the tone matches what you expect, the mixer is "locked" to the signal. This is the superheterodyne principle, made audible.

## The Progressive Radio Series (Updated)

| Mission | Circuit | What You Build | Series Role |
|---------|---------|----------------|-------------|
| **v1.2 Pioneer 1** | VHF Transmitter | Crystal osc + x4 multiplier to 108 MHz | **TRANSMIT** |
| **v1.3 Pioneer 2** | Superheterodyne Receiver | AM superhet: mixer + IF + detector | **RECEIVE** |
| **v1.4 Pioneer 3** | Frequency Mixer | Diode ring mixer: RF + LO = IF | **MIX** |
| Future missions | Modulation/demodulation | BPSK/QPSK stages | **DATA** |
| Future missions | Antenna systems | Yagi, dish, phased array | **DIRECTIVITY** |

The mixer is the heart of the receiver. V1.3's superheterodyne receiver contained a mixer, but it was embedded in the larger circuit. V1.4 isolates it, makes it the central component, and lets you experiment with it directly. Understanding the mixer is understanding radio.

## Safety and Legal Notes

- **This circuit does not transmit.** It operates entirely at audio frequencies (10-22 kHz). No FCC license required.
- **No shock hazard** at 9V battery operation.
- **The 22 kHz sum frequency** may be audible to young listeners with excellent high-frequency hearing. This is not harmful but may be slightly annoying. The low-pass filter should attenuate it sufficiently.

## Fox Companies Connection

Ninth circuit in the NASA kit series. Isolates the mixer from v1.3's full receiver, making the frequency conversion operation the central lesson. The progressive radio series now has three circuits covering the three fundamental operations: generate a signal (v1.2), receive a signal (v1.3), convert a signal's frequency (v1.4). Workshop exercise: connect v1.2's transmitter output (attenuated) to v1.4's RF input, and use v1.4's LO to tune to the transmitted frequency. The 2 kHz output tone confirms reception. Three breadboards, one communication link, the same chain that connected Pioneer 3 to Goldstone.
