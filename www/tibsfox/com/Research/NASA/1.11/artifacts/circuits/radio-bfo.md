# DIY Radio Circuit: Beat Frequency Oscillator — CW and SSB Reception

## The Circuit

A Beat Frequency Oscillator (BFO) that generates a local signal at 454 kHz or 456 kHz, which mixes with the 455 kHz IF signal to produce an audible beat note for receiving CW (Morse code) and SSB (Single Sideband) transmissions. Without a BFO, CW signals are silent — the receiver's AM detector cannot recover audio from an unmodulated carrier. The BFO provides the missing carrier, creating interference beats that produce the familiar Morse code "dits and dahs" in the audio range.

This is the eleventh circuit in the progressive radio series: v1.2 built the transmitter, v1.3 the receiver, v1.4 the mixer, v1.5 the IF amplifier, v1.6-v1.10 continued the chain, and v1.11 adds the BFO that unlocks CW and SSB reception — the modes used by amateur radio operators and, critically, the modes used for spacecraft telemetry tracking.

**What it does:**
- A Colpitts oscillator generates a stable signal near 455 kHz
- A fine-tuning potentiometer adjusts the frequency ±2 kHz around the IF center
- The BFO output is injected into the detector stage (before or after the IF amplifier)
- When tuned to 454 kHz, the 455 kHz IF signal produces a 1 kHz beat note
- Adjusting the BFO frequency changes the audio pitch of the beat note
- For CW: tune for a comfortable pitch (400-1000 Hz)
- For SSB: tune until voices sound natural (zero beat the suppressed carrier)
- An on/off switch enables the BFO only when needed (not used for AM reception)

**What it teaches:** The heterodyne principle is the foundation of all frequency conversion in radio. Two signals at slightly different frequencies, when combined, produce sum and difference frequencies. The difference frequency falls in the audio range and is what you hear. This is exactly how Explorer 5's ground station tracking worked — the telemetry signal from the spacecraft was received at a specific frequency, converted to IF by the mixer (v1.4), and then either AM-detected (for voice) or BFO-detected (for digital telemetry tones). The BFO turns your receiver from an AM-only box into a universal signal decoder.

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
  v1.11 — BFO (Beat Frequency Oscillator for CW/SSB) ← YOU ARE HERE

The BFO injects into the detector stage:
  Antenna → RF Amp → Mixer ← LO
                        ↓
                  IF Amplifier
                        ↓
                  ┌─────┴─────┐
                  │  Detector  │ ← BFO injection (THIS CIRCUIT)
                  └─────┬─────┘
                        ↓
                   Audio Amp → Speaker

Without BFO (AM mode):
  IF signal → detector → envelope = audio
  Works for AM broadcast, voice telemetry

With BFO (CW/SSB mode):
  IF signal + BFO → detector → beat frequency = audio
  Works for Morse code, SSB voice, digital telemetry tones

Explorer 5's tracking chain:
  108 MHz telemetry → ground receiver → IF → BFO detection
  → audio tones → strip chart recorder → mission data
  (On Aug 24, 1958: signal acquired... signal lost.)
```

## Schematic

```
                    +9V
                     |
                R1 (10K)
                     |
              ┌──────┤
              │      │
              │    ┌─┴─┐
              │    │   │ Q1 (2N3904 or equivalent)
              │    │ B │
              │    └─┬─┘
              │      │ E
              │      │
              │      ├──── C3 (100pF) ──── OUTPUT → to detector
              │      │
              │    ┌─┴─┐
              │    │   │
              │   C1   C2
              │ (470pF)(470pF)
              │    │   │
              │    ├───┘
              │    │
              │   L1 (BFO coil, ~455 kHz resonance)
              │    │     Tapped or with ferrite slug for tuning
              │    │
              │   GND
              │
              │                FINE TUNING:
              └── R2 (4.7K) ─── RV1 (10K pot) ─── GND
                                  │
                                  └── C4 (10-50pF variable)
                                       └── to C1/C2 junction

ALTERNATIVE: NE602/SA612 Active Mixer BFO
(higher stability, better isolation, slightly more complex)

              +9V ─── R3 (100R) ─── Pin 8 (Vcc)
                                      │
              IF in ── C5 (10nF) ── Pin 1 (In A)    NE602
                                    Pin 2 (In B) ── GND
              BFO in ─ C6 (100pF)─ Pin 6 (Osc E)
                                    Pin 7 (Osc B) ── L1+C1+C2
                                    Pin 4 (Out A) ── Audio out
                                    Pin 5 (Out B) ── GND via 100nF
                                    Pin 3 (GND) ─── GND

BFO ON/OFF SWITCH:
              +9V ─── SW1 (SPST) ─── to R1 (BFO power)
              When SW1 open: BFO off (AM mode)
              When SW1 closed: BFO on (CW/SSB mode)
```

## Colpitts Oscillator Design

```
The Colpitts oscillator uses a capacitive voltage divider
(C1, C2) with an inductor (L1) to set the oscillation frequency:

  f = 1 / (2π × √(L1 × Cseries))

  where Cseries = (C1 × C2) / (C1 + C2)

For 455 kHz with C1 = C2 = 470 pF:
  Cseries = (470 × 470) / (470 + 470) = 235 pF

  L1 = 1 / ((2π × 455000)² × 235e-12)
     = 1 / (8.17e12 × 235e-12)
     = 1 / 1.920
     = 0.521 mH ≈ 520 µH

  Use a 500 µH adjustable coil (slug-tuned for fine adjustment)

Fine tuning: The variable capacitor C4 (10-50 pF) in parallel
with C1 shifts the frequency by approximately ±2 kHz:
  - C4 = 10 pF → ~456.5 kHz → beat note ~1500 Hz
  - C4 = 25 pF → ~455.5 kHz → beat note ~500 Hz
  - C4 = 40 pF → ~454.5 kHz → beat note ~500 Hz (opposite side)
  - C4 = 50 pF → ~454.0 kHz → beat note ~1000 Hz (opposite side)
```

## Bill of Materials

| Qty | Component | Value/Type | Purpose | Cost |
|-----|-----------|------------|---------|------|
| 1 | 2N3904 | NPN transistor | Oscillator active device | $0.10 |
| 1 | Inductor | ~500 µH, slug-tuned | BFO tank coil | $1.50 |
| 2 | Capacitor | 470 pF, ceramic | Colpitts divider (C1, C2) | $0.06 |
| 1 | Capacitor | 100 pF, ceramic | Output coupling (C3) | $0.03 |
| 1 | Trimmer cap | 10-50 pF | Fine frequency adjust (C4) | $0.50 |
| 1 | Resistor | 10K, 1/4W | Collector load (R1) | $0.02 |
| 1 | Resistor | 4.7K, 1/4W | Bias (R2) | $0.02 |
| 1 | Potentiometer | 10K, panel mount | Fine tuning (RV1) | $0.80 |
| 1 | Switch | SPST toggle | BFO on/off | $0.50 |
| 1 | Breadboard | Half-size | Assembly | $3.00 |
| 1 | Wire kit | 22 AWG | Connections | $2.00 |
| | | | **Total** | **~$8.53** |

## Build Notes

1. **Start with the oscillator alone.** Wire the Colpitts circuit (Q1, L1, C1, C2, R1, R2). Power it up and probe the collector with an oscilloscope or frequency counter. You should see a sine wave near 455 kHz. If you don't have test equipment, connect the output through a 100 pF cap to your receiver's antenna input and tune to 455 kHz — you should hear a steady carrier.

2. **Add the fine tuning.** Install the trimmer capacitor C4. Adjust it and verify that the oscillation frequency shifts by 1-2 kHz in each direction. If using a receiver for testing, you'll hear the pitch of the received tone change as you adjust C4.

3. **Connect to your IF stage.** Inject the BFO output (through C3) into the detector stage of your receiver, after the IF amplifier but before or at the AM detector. The exact injection point depends on your receiver topology — a few picofarads of coupling is usually sufficient.

4. **Tune to CW.** Find a CW signal (amateur radio around 7.000-7.040 MHz on 40m, or a signal generator). With the BFO on, you should hear Morse code as clear tones. Adjust the BFO pitch pot for a comfortable listening pitch — most operators prefer 600-800 Hz.

5. **Try SSB.** Tune to the SSB portion of an amateur band (7.040-7.300 MHz). With the BFO on, adjust the pitch control until voices sound natural — not too high (Donald Duck) or too low (rumbling). You're replacing the suppressed carrier that SSB transmitters intentionally remove.

## The Engineering Lesson

The BFO is the simplest example of the heterodyne principle — the foundation of virtually all radio communication since Edwin Armstrong's superheterodyne receiver (1918). Two signals at frequencies f1 and f2, when combined in a nonlinear device (a mixer or detector), produce signals at f1+f2 and f1-f2. If f1 = 455,000 Hz and f2 = 454,000 Hz, the difference is 1,000 Hz — a tone you can hear.

This is not merely a useful trick. It is the principle that makes radio receivers frequency-selective, that enables single-sideband voice communication, that allows digital data to be encoded as tones, and that permitted ground stations to track Explorer 5's telemetry signal. Every satellite ever launched has been tracked using heterodyne receivers. The BFO is the last piece: the local reference that makes the incoming signal audible.

Explorer 5's ground station at Cape Canaveral received telemetry at 108 MHz. The signal was converted to 455 kHz IF by the mixer. For analog voice telemetry, the AM detector sufficed. But for the digital experiment data — encoded as specific audio tones — the BFO provided the reference needed to decode the tones precisely. On August 24, 1958, the ground station acquired Explorer 5's signal, heard it warble as the tumbling antenna rotated, and then lost it as the payload fell back to Earth. The BFO was working. The receiver was working. The oscillator, the mixer, the IF amp, the detector — all working. The only thing that failed was a spring and a clearance margin, 200 kilometers above the Atlantic.
