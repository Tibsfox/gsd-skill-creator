# DIY Radio Circuit: AM Detector / Demodulator

## The Circuit

A simple envelope detector that extracts audio from an amplitude-modulated signal — the sixth circuit in the progressive radio series. The IF amplifier from v1.5 provides an amplified 455 kHz signal containing AM audio. This detector circuit rectifies the IF signal with a germanium diode and filters it with an RC low-pass to recover the audio envelope.

This is the detector stage that the DSN's receivers use in principle — after mixing and IF amplification, the telemetry signal must be demodulated to extract the data. Mariner 2's 960 MHz carrier, frequency-modulated with 8.33 bits/second telemetry, was demodulated at Goldstone using a phase-locked loop detector. This circuit demonstrates the simpler AM detection principle.

**Radio Series Progress:**
```
v1.2 — Transmitter (oscillator → antenna)
v1.3 — Receiver (antenna → detector → audio)
v1.4 — Mixer (RF + LO → IF)
v1.5 — IF Amplifier (455 kHz tuned amplifier)
v1.32 — AM Detector (envelope demodulator) ← YOU ARE HERE
```

**What it does:**
- Input: amplified 455 kHz AM signal from v1.5 IF amplifier
- Germanium diode (1N34A) rectifies the signal
- RC filter (10 nF + 10 kΩ) smooths the half-wave rectified output
- Output: audio signal (300 Hz — 3 kHz) suitable for headphones

**Total cost: ~$8**

---

## Schematic

```
  IF Input ────[1N34A]────┬────── Audio Output
  (455 kHz AM)     diode  │
                         [10nF]
                          │
                        [10K]
                          │
                         GND
```

## Key Learning Moment

The student connects the v1.5 IF amplifier output to this detector and hears, for the first time, intelligible audio recovered from a radio signal through the complete superheterodyne chain: antenna → mixer → IF amplifier → detector. This is the same signal processing pipeline (at different frequencies and with different modulation) that Goldstone used to extract Mariner 2's telemetry from the cosmic background.
