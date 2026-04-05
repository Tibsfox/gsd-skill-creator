# Circuit: AM Detector Stage

## Radio Receiver Series v1.30

**Estimated Cost:** $12
**Difficulty:** Beginner
**Build Time:** 1-2 hours
**Builds on:** v1.29 AM detector output

---

## Concept

A simple AM envelope detector using a 1N34A germanium diode, following the radio receiver series. This stage takes the amplified IF signal from the radio chain and strips the carrier, extracting the audio modulation. The AM detector is the simplest demodulation circuit — a diode, a capacitor, and a resistor — yet it performs the fundamental operation of communication: separating information from carrier.

The connection to Ranger 5 is direct: the spacecraft's carrier signal persisted (via the capsule's 50 mW transmitter), but the information-carrying modulation was gone. The AM detector extracts information from a carrier. Ranger 5's carrier had no information to extract.

## Parts List

| Component | Quantity | Est. Cost |
|-----------|----------|-----------|
| 1N34A germanium diode | 1 | $1.50 |
| 100pF ceramic capacitor | 1 | $0.15 |
| 1nF ceramic capacitor | 1 | $0.15 |
| 47kΩ resistor | 1 | $0.10 |
| 10kΩ potentiometer (volume) | 1 | $0.75 |
| Crystal earphone (high impedance) | 1 | $5.00 |
| Breadboard | 1 | $3.00 |
| Hookup wire | -- | $0.50 |
| **Total** | | **~$11.15** |

## Schematic

```
IF Input ──┬── 1N34A ──┬── 100pF ──┬── 10kΩ pot ── Earphone
           │    (→)    │           │
           │           │    47kΩ   │
           └───────────┴─────┴─────┴── GND
```

1. **1N34A Germanium Diode:** Half-wave rectifier. Passes positive half-cycles of the AM signal, blocks negative. Germanium is used (not silicon) because its 0.3V forward voltage allows detection of weak signals.

2. **100pF + 47kΩ:** RC low-pass filter. Time constant = 4.7 μs. Passes audio frequencies (< 5 kHz), attenuates IF carrier (455 kHz). The capacitor charges on signal peaks and discharges slowly through the resistor, tracing the envelope.

3. **10kΩ Potentiometer:** Volume control.

4. **Crystal Earphone:** High-impedance transducer (>10 kΩ) that does not load the detector. A standard 8Ω headphone would attenuate the signal; crystal earphones are essential for this passive circuit.

## Radio Series Position

| Mission | Stage | Component | Cost |
|---------|-------|-----------|------|
| v1.2 | Crystal oscillator | 108 MHz osc | $15 |
| v1.3 | Superheterodyne receiver | RF front end | $20 |
| v1.4 | Frequency mixer | Ring mixer | $15 |
| v1.5 | IF amplifier | 455 kHz amp | $18 |
| v1.29 | AM detector (intro) | Basic detector | $10 |
| **v1.30** | **AM detector (refined)** | **Envelope detector** | **$12** |

By mission 50: complete ground station receiver chain.

## The Lesson

The AM detector separates signal from carrier. This is the fundamental act of communication — the same act that Bell's telephone performed (separating speech from electrical current), that Pioneer 4's ground stations performed (separating telemetry from RF carrier), and that Ranger 5's DSN stations tried to perform (but the carrier held no signal to separate). The detector works only when there is content modulated onto the carrier. Without content, the detector produces silence. Ranger 5's carrier was content-free for 55 hours. The detector would have heard nothing.
