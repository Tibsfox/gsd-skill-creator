# DIY Radio Circuit: AGC Time Constant — Attack/Release Control

## The Circuit

An AGC time constant network with diode-steered attack and release paths. Fast attack responds quickly to strong signals (preventing overload), while slow release maintains smooth gain recovery (preventing audio pumping). This is the sixteenth circuit in the progressive radio series. The AGC time constant refines the basic AGC from v1.9, adding independent control of attack and release behavior critical for real-world signal conditions with fading, QSB, and adjacent-channel interference.

**What it does:**
- Diode-steered charge/discharge paths for AGC control voltage
- Fast attack: ~1 ms time constant via low-resistance charge path
- Slow release: ~500 ms time constant via high-resistance discharge path
- Prevents "pumping" on fast-fading signals (QSB)
- Maintains quick response to sudden strong signals (adjacent-channel splatter)
- Single-pot adjustable release time (100 ms to 2 seconds)
- LED indicator shows AGC action (brightness = gain reduction)

**What it teaches:** AGC without proper time constants creates audible problems. Too-fast release causes the gain to pump up and down with the modulation envelope, making speech sound "breathy" or gargled. Too-slow attack lets strong signals clip the audio before AGC catches up. The solution is asymmetric timing: charge the AGC capacitor quickly (fast attack through a low-impedance diode path) and discharge it slowly (slow release through a high-impedance resistor path). Mercury spacecraft communication used AGC in its receivers — the Redstone's telemetry receivers needed stable gain control as the rocket's signal strength changed during ascent.

**Total cost: ~$4**

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
  v1.16 — AGC Time Constant (attack/release control)  ← YOU ARE HERE

The AGC time constant refines the basic AGC in the receiver chain:
  Antenna → Tuner → Preamp → Mixer ← LO
                                |
                          Crystal Filter
                                |
                          IF Amplifier ← AGC CONTROL VOLTAGE
                                |         ↑
                          Detector        |
                                |     AGC TIME CONSTANT (THIS CIRCUIT)
                           Audio Amp → Speaker        |
                                                    AGC Detector

Without proper time constants:
  Fast signals: AGC pumps with modulation, garbled audio
  Fading (QSB): gain hunts up and down audibly
  Strong adjacent signal: clips before AGC responds

With attack/release control:
  Strong signal arrives → fast attack (1 ms) reduces gain immediately
  Signal fades → slow release (500 ms) brings gain back smoothly
  Result: stable, comfortable listening even in difficult conditions
```

---

## Schematic

```
               From AGC Detector
               (DC proportional to signal level)
                       |
                       |
                  D1 (1N4148)
                  ──►──          FAST ATTACK PATH
                       |         R_attack = 1K
                      [1K]       τ_attack = 1K × 1µF = 1 ms
                       |
                       +────────── AGC Control Voltage Out
                       |           (to IF amplifier gain control)
                      [C1]
                      10µF        AGC storage capacitor
                       |
                      GND

               SLOW RELEASE PATH:
                       AGC Control Voltage
                       |
                      [R_release]
                      470K (or pot: 100K-2M)
                       |
                  D2 (1N4148)
                  ──►──          Release diode
                       |         (blocks during attack)
                      GND

  How it works:
    Signal INCREASES → D1 forward-biased → C1 charges through 1K → τ = 1 ms
    Signal DECREASES → D1 reverse-biased → C1 discharges through 470K → τ = 4.7 s
                       (D2 steers discharge through R_release only)

  Adjustable version (with pot):
               From AGC Detector
                       |
                  D1 (1N4148)──►──[1K]──┐
                                         |
                       ┌─────────────────+──── AGC Out
                       |                 |
                      [POT]             [C1]
                      500K              10µF
                       |                 |
                  D2 (1N4148)──►──      GND
                       |
                      GND

  LED indicator:
                AGC Out
                   |
                  [10K]
                   |
                  LED (shows gain reduction — brighter = more AGC action)
                   |
                  GND
```

## Design Calculations

```
Attack time constant:
  τ_attack = R_attack × C1
  τ_attack = 1KΩ × 1µF = 1 ms
  Full response in ~5τ = 5 ms

Release time constant (fixed):
  τ_release = R_release × C1
  τ_release = 470KΩ × 10µF = 4.7 s
  But effective release feels like ~500 ms because:
    - Diode forward voltage threshold gates the discharge
    - Gain only needs to recover ~20% to be audible

Release time constant (adjustable):
  Pot at minimum (100K): τ = 100K × 10µF = 1.0 s (fast release)
  Pot at midpoint (500K): τ = 500K × 10µF = 5.0 s (medium)
  Pot at maximum (1M):    τ = 1M × 10µF = 10 s (very slow, SSB)

Attack/Release ratio:
  τ_release / τ_attack = 470K / 1K = 470:1
  This asymmetry is the key — charge fast, discharge slow.
  Human hearing perceives rapid gain drops as natural (loud sound)
  but perceives rapid gain increases as pumping (unnatural).
```

## Parts List

| Qty | Part | Cost |
|-----|------|------|
| 2 | 1N4148 signal diodes | $0.10 |
| 1 | 1KΩ resistor (attack) | $0.05 |
| 1 | 470KΩ resistor (release, fixed version) | $0.05 |
| 1 | 500KΩ potentiometer (adjustable version) | $0.50 |
| 1 | 10µF electrolytic capacitor (AGC storage) | $0.10 |
| 1 | 1µF ceramic capacitor (optional: parallel with C1 for fast attack smoothing) | $0.05 |
| 1 | 10KΩ resistor (LED) | $0.05 |
| 1 | LED (any color — AGC indicator) | $0.10 |
| 1 | Small breadboard section | $1.00 |
| — | Jumper wires | $0.50 |
| **Total** | | **~$4** |

## Why This Matters for MR-1

The Mercury-Redstone telemetry system used AGC to maintain signal quality as the rocket ascended. During MR-1's aborted 4-inch flight, the ground station AGC never had to deal with changing signal strength — the rocket barely moved. But the AGC time constant design was critical for every subsequent mission: as the rocket climbed, signal strength dropped roughly as 1/r², requiring the AGC to smoothly increase receiver gain over a 6-minute powered flight.

The asymmetric time constant principle appears in many systems:
- **Capacitor charging** (fast) vs **discharging** (slow through high resistance)
- **Dictyostelium cAMP signaling**: cAMP pulses have fast rise (~30 seconds) and slow decay (~5 minutes), creating the oscillating waves that guide aggregation
- **Flight decision-making**: abort decisions must be fast (milliseconds), recovery decisions should be slow and deliberate (the 24-hour wait before approaching MR-1)
