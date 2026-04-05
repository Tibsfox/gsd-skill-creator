# Circuit: AM Envelope Detector — Radio Series v1.29

## Mission 1.29 — Ranger 4 (Atlas-Agena B)

**Cost:** ~$16
**Difficulty:** Beginner-Intermediate
**Time:** 1-2 hours
**Radio series position:** v1.29 — AM detection stage (follows v1.28 IF amplifier)

---

## What It Does

An AM envelope detector strips the carrier frequency from an amplitude-modulated signal, leaving only the audio modulation. The circuit uses a single germanium diode (1N34A) as a half-wave rectifier, followed by an RC low-pass filter that smooths the rectified carrier into the audio envelope.

**Connection to Ranger 4:** This is the stage where the radio becomes audible — IF carrier in, audio out. But when there is NO modulation on the carrier (as with Ranger 4's unmodulated CW signal), the detector produces DC + silence. The student hears exactly what the DSN heard from Ranger 4: a carrier with nothing on it. The detector circuit makes the information deficit tangible — plug in a modulated AM signal and you hear music; plug in an unmodulated carrier and you hear nothing.

## Bill of Materials

| Component | Quantity | Cost |
|-----------|----------|------|
| 1N34A germanium diode | 1 | $2 |
| Capacitor 100 pF | 1 | $0.25 |
| Capacitor 0.01 µF | 1 | $0.25 |
| Resistor 10 KΩ | 1 | $0.10 |
| Resistor 100 KΩ | 1 | $0.10 |
| Crystal earpiece (high-impedance) | 1 | $5 |
| Breadboard (half-size) | 1 | $3 |
| Hookup wire | misc | $1 |
| BNC connector or clip leads | 2 | $4 |
| **Total** | | **~$16** |

## Schematic

```
IF Signal In ──┬── 1N34A ──┬── 100pF ──┬── Audio Out
               │   (diode)  │           │   (to earpiece)
               │            │    10KΩ   │
               │           GND   │     0.01µF
               │                GND     │
               │                       GND
               │
              100KΩ (DC return)
               │
              GND
```

## How It Works

1. **The 1N34A germanium diode** conducts on positive half-cycles of the IF carrier (455 kHz from v1.28's IF amplifier). Germanium is chosen over silicon because its lower forward voltage (0.2V vs 0.6V) allows detection of weaker signals.

2. **The 100 pF capacitor** (in parallel with the 10KΩ resistor) forms a low-pass filter. The RC time constant (τ = 100pF × 10KΩ = 1 µs) is chosen to:
   - Be fast enough to follow the audio modulation (up to ~5 kHz → period 200 µs >> 1 µs ✓)
   - Be slow enough to smooth the 455 kHz carrier (period 2.2 µs ≈ τ, adequate filtering)

3. **The 0.01 µF coupling capacitor** blocks DC and passes audio to the crystal earpiece.

4. **The 100 KΩ resistor** provides a DC return path for the diode.

## The Ranger 4 Experiment

1. Connect the AM detector to v1.28's IF amplifier output
2. Tune to a local AM station — you should hear audio (voice or music) through the crystal earpiece
3. Now disconnect the antenna from v1.28 and feed a PURE 455 kHz sine wave from a signal generator (or a 555 timer circuit tuned to ~455 kHz)
4. Listen: silence. The carrier is there (the diode conducts, the DC level is present), but there is no audio modulation. The earpiece produces nothing

This is what the DSN heard from Ranger 4 for 64 hours: a carrier with no modulation. The signal was present. The information was absent. The detector — whether a germanium diode in a radio or a parametric amplifier at Goldstone — can only extract information that is present in the signal. When there is no modulation, there is no data. The carrier says "I am here." The silence says "I have nothing to tell you."

## Connection to the Radio Series

| Version | Circuit | Function | Cost |
|---------|---------|----------|------|
| v1.0 | Crystal oscillator | Generate a stable RF signal | $12 |
| v1.4 | Frequency mixer | Combine signals, produce IF | $15 |
| v1.5 | IF amplifier | Amplify and filter the IF signal | $18 |
| v1.28 | IF amplifier (gain stage) | Additional IF gain | $17 |
| **v1.29** | **AM detector** | **Extract audio from AM carrier** | **$16** |
| v1.30 | [Audio amplifier — next] | Amplify detected audio | TBD |

The radio is approaching audibility. After the detector, the next stage (v1.30) will amplify the detected audio to drive a speaker. The full radio — from antenna to speaker — is being built one mission at a time, one stage at a time, the same way the Ranger program built lunar exploration capability one mission at a time.
