# DIY Radio Circuit: Squelch Circuit

## The Circuit

A noise-activated gate using a transistor comparator that mutes the audio output when no carrier signal is present. When the receiver is tuned between stations, the output is pure static — loud, annoying broadband noise. The squelch circuit detects this noise, and when the noise level exceeds a threshold (indicating no carrier), it mutes the audio path. When a station is tuned in, the carrier suppresses the noise floor, the squelch opens, and audio passes through. The result: silence between stations instead of blasting static.

The squelch circuit is the ninth stage in the progressive radio series. With the previous stages (transmitter, receiver, mixer, IF amplifier, envelope detector, audio amplifier, tone control), you have a functional radio — but one that screams static whenever you tune away from a station. The squelch is the noise gate that makes the receiver civilized. It is the electronic equivalent of closing your mouth when you have nothing to say.

**What it does:**
- Detects the noise level on the audio output using a high-pass filter and peak detector
- Compares the noise level to an adjustable threshold (squelch knob)
- When noise exceeds the threshold (no carrier): mutes the audio output
- When noise drops below threshold (carrier present): unmutes — audio passes through
- Adjustable squelch threshold: turn the knob to set how strong a signal must be to open the gate

**What it teaches:** Noise detection, threshold comparison, analog switching with transistors, the concept of noise gating, and the relationship between carrier strength and noise floor. The same principle appears in modern noise gates for audio production, voice-activated microphones (VOX), and digital squelch systems in trunked radio.

**Total cost: ~$5**

---

## The Superheterodyne Chain (Series Context)

```
Radio Series Progress:
  v1.2 — Transmitter (oscillator → antenna)
  v1.3 — Receiver (antenna → detector → audio)
  v1.4 — Mixer (RF + LO → IF)
  v1.5 — IF Amplifier (IF → amplified, filtered IF)
  v1.6 — AM Envelope Detector (IF → audio)
  v1.7 — Audio Amplifier (audio → speaker)
  v1.8 — Volume/Tone Control (audio shaping)
  v1.9 — Squelch Circuit (noise gate) ← YOU ARE HERE
  v2.0 — [planned] AGC (automatic gain control)

The squelch sits between the tone control and the speaker:

  Antenna → RF amp → Mixer ← Local Oscillator
                        ↓
                  IF Amplifier (455 kHz)
                        ↓
                  Envelope Detector
                        ↓
                  Audio Amplifier (LM386)
                        ↓
                  Tone Control (Baxandall)
                        ↓
              ┌── Squelch Circuit ──┐
              │   Noise detector   │  ← THIS CIRCUIT
              │   Threshold gate   │
              │   Audio mute       │
              └────────────────────┘
                        ↓
                     Speaker

Without squelch: tuning between stations → LOUD STATIC
With squelch: tuning between stations → silence
```

## Schematic

```
                    NOISE DETECTOR
                    (High-pass filter + peak detector)

Audio from    ┌────────────────────────────────────────────┐
tone control ─┤                                            │
  (v1.8)      │    C1            R1          D1            │
              ├──┤├──────┬──────/\/\/──┬──────►├──┬─── Noise
              │  10nF    │     10K     │   1N4148  │    level
              │          │             │           │    voltage
              │          R2            C2          │
              │         100K          100nF        │
              │          │             │           │
              │         GND           GND          │
              └────────────────────────────────────────────┘

                    THRESHOLD COMPARATOR
                    (Transistor switch)
                                                      +9V
                                                       │
              Noise level ──── R3 ──┬──── Base         R5
              voltage        10K    │     Q1          1K
                                    │    2N3904        │
              Squelch ── R4 ──┘                    Collector
              pot wiper  4.7K       │                  │
              (threshold)          Emitter             │
                                    │              Gate drive
                                   GND              voltage

                    SQUELCH POT (threshold adjust)
                    10K potentiometer
                    CW = 9V (high threshold, squelch tight)
                    CCW = GND (low threshold, squelch open)
                    Wiper → R4

                    AUDIO GATE
                    (JFET or second transistor as switch)

Audio from    ───────────┬──── Drain    ┌──── Signal out
tone control             │     Q2       │     to speaker
                         │   2N5457     │
              Gate drive ┘   (JFET)     │
              from comparator  Source ──┘

              When gate voltage HIGH: JFET conducts, audio passes
              When gate voltage LOW: JFET blocks, audio muted


FULL CIRCUIT (simplified):

                 C1        R1        D1
Audio ──┬──────┤├────────/\/\/──────►├──┬── Noise V
        │      10nF       10K    1N4148 │
        │                              C2 100nF
        │                              │
        │                             GND
        │
        │     Noise V ── R3(10K) ──┬── Q1 base (2N3904)
        │                          │
        │     Squelch ── R4(4.7K) ─┘
        │     pot wiper
        │                          Q1 emitter → GND
        │                          Q1 collector → R5(1K) → +9V
        │                                    └── Q2 gate
        │
        └─── Q2 drain (2N5457 JFET)
                    │
                  Q2 source ──── Speaker/next stage

OPERATION:
  No carrier (static): High noise → Q1 ON → Q2 gate LOW → MUTED
  Carrier present:     Low noise  → Q1 OFF → Q2 gate HIGH → AUDIO PASSES

  Squelch pot adjusts the threshold:
    - Full CW: only very strong signals open squelch
    - Full CCW: squelch always open (disabled)
    - Mid position: typical setting for normal use
```

## How It Works

1. **Noise detection (C1 + R1 + D1 + C2):**
   The high-pass filter (C1, 10nF) passes only the high-frequency components of the audio signal. Between stations, the audio is almost entirely high-frequency noise (static). When a station is tuned in, the carrier suppresses the noise floor, and the high-frequency content drops dramatically. The peak detector (D1, C2) converts this AC noise signal to a DC voltage proportional to the noise level.

2. **Threshold comparison (Q1, R3, R4):**
   The noise voltage is summed with the squelch threshold voltage (from the squelch pot) at the base of Q1. When the combined voltage exceeds ~0.6V (transistor turn-on), Q1 conducts, pulling its collector low. The squelch pot sets how much noise is needed to trigger the gate.

3. **Audio gate (Q2):**
   A JFET (2N5457) acts as a voltage-controlled switch in the audio path. When Q1 is conducting (high noise, no carrier), Q2's gate is pulled low, pinching off the JFET channel and blocking audio. When Q1 is off (low noise, carrier present), Q2's gate is pulled high through R5, and the JFET conducts, passing audio to the speaker.

4. **The result:**
   - Tune to a station: carrier suppresses noise → Q1 off → Q2 on → you hear the program
   - Tune between stations: noise is high → Q1 on → Q2 off → silence
   - The transition is nearly instantaneous — the squelch "snaps" open and closed

## Bill of Materials

| Component | Value | Qty | Cost |
|-----------|-------|-----|------|
| NPN transistor | 2N3904 | 1 | $0.10 |
| N-channel JFET | 2N5457 | 1 | $0.50 |
| Diode | 1N4148 | 1 | $0.05 |
| Capacitor | 10nF ceramic | 1 | $0.05 |
| Capacitor | 100nF ceramic | 1 | $0.05 |
| Resistor | 1K, 1/4W | 1 | $0.05 |
| Resistor | 4.7K, 1/4W | 1 | $0.05 |
| Resistor | 10K, 1/4W | 2 | $0.10 |
| Resistor | 100K, 1/4W | 1 | $0.05 |
| Potentiometer | 10K linear | 1 | $0.50 |
| Breadboard | (shared with v1.8) | — | — |
| 9V battery + clip | (shared) | — | — |
| Jumper wires | | ~10 | $0.50 |
| **Total** | (new parts only) | | **~$5** |

## Testing

1. **Without squelch (bypass):** Connect audio directly from tone control to speaker. Tune between stations — you'll hear loud static. This is what every radio sounded like before squelch.

2. **With squelch:** Insert the squelch circuit. Set the squelch pot to mid-position. Tune between stations — silence. Tune to a station — audio comes through clearly. The squelch "opens" when the carrier is strong enough.

3. **Adjusting threshold:**
   - Turn squelch pot fully CCW (minimum): squelch is disabled, you hear everything including static
   - Turn clockwise: weak stations are muted, only stronger stations get through
   - Turn fully CW: only the strongest local stations open the squelch

4. **The snap:** Listen for the characteristic "snap" as the squelch opens and closes. This is the transistor switching — a binary transition from muted to unmuted. The squelch does not fade in and out; it switches. This binary behavior is the analog precursor to digital noise gating.

## Connection to Explorer 3

The squelch circuit is a noise gate — it determines whether useful signal is present and either passes it or mutes it. Explorer 3's tape recorder solved a similar problem from the opposite direction: instead of gating out noise, it captured everything and let the scientists sort signal from noise later. The squelch is a real-time filter; the tape recorder is a store-and-forward buffer. Both address the fundamental challenge of extracting useful information from a noisy channel.

The radio series has been building toward a complete receiver. With the squelch, the receiver is now civilized — it speaks when spoken to and stays quiet when there's nothing to say.
