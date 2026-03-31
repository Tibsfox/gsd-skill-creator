# DIY Radio Circuit: Crystal Ladder Filter — Quartz Selectivity

## The Circuit

A crystal ladder filter using two or three quartz crystals to create an extremely narrow IF passband. Quartz crystals have quality factors (Q) of 10,000 to 100,000 — two orders of magnitude higher than LC filters. A ladder network of crystals creates a passband as narrow as 2-3 kHz at 455 kHz IF, with shape factors approaching 1.5:1 (compared to 10:1 for typical LC filters). This is the fifteenth circuit in the progressive radio series. The crystal filter replaces or supplements the LC bandpass filter from v1.14, providing selectivity that no LC circuit can match.

**What it does:**
- Two or three matched quartz crystals at 455 kHz in a ladder topology
- Series crystals in the signal path, shunt capacitors to ground
- Creates an extremely narrow passband (~3 kHz at -3dB)
- Shape factor ~1.5:1 (-60dB/-3dB bandwidth ratio) — nearly rectangular
- Ultimate rejection >60 dB (vs ~40 dB for double-tuned LC)
- Insertion loss ~3-6 dB (acceptable for IF stage)
- Fixed frequency — not tunable (designed for a specific IF)

**What it teaches:** Crystal filters achieve selectivity that seems impossible with LC circuits. A quartz crystal's mechanical resonance has a Q of 20,000+ — the electrical equivalent of a pendulum that swings for hours after a single push. The narrow passband extracts one signal from a crowded band, rejecting signals only a few kHz away. This is the key technology that enabled radio receivers to separate thousands of stations packed into the radio spectrum. TIROS-1's telemetry receivers used crystal-controlled oscillators for frequency stability — the same piezoelectric principle.

**Total cost: ~$10**

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
  v1.15 — Crystal Filter (quartz extreme selectivity)  ← YOU ARE HERE

The crystal filter replaces the LC bandpass in the IF chain:
  Antenna → Tuner → Preamp → Mixer ← LO
                                |
                          CRYSTAL FILTER (THIS CIRCUIT)
                                |
                          IF Amplifier
                                |
                          Detector ← BFO
                                |
                           Audio Amp → Speaker

Without crystal filter:
  LC bandpass gives ~50 kHz bandwidth — fine for AM broadcast.
  But for SSB or CW, adjacent signals 3-5 kHz away bleed through.

With crystal filter:
  3 kHz passband — one SSB signal fits perfectly.
  Adjacent signals 5 kHz away are attenuated 60+ dB.
  CW signals can use even narrower filters (500 Hz) with more crystals.
```

---

## The Quartz Crystal

```
QUARTZ CRYSTAL — Electrical Model (Butterworth-Van Dyke):

              Lm         Cm        Rm
    ───┤├──┤ ├──┤├──┤├──┤├──
    ───┤├──                    ── Series arm (motional)
         │                    │
         ├────┤├──────────────┤   Co (parallel/holder capacitance)
         │                    │
         └────────────────────┘

  Lm  = motional inductance  (~30 mH for 455 kHz crystal)
  Cm  = motional capacitance (~4 fF — femtofarads!)
  Rm  = motional resistance  (~15 ohms — very low)
  Co  = holder capacitance   (~5 pF)

  Q = (2*pi*f*Lm) / Rm = ~25,000 at 455 kHz

  Two resonant frequencies:
    fs = series resonance = 1/(2*pi*sqrt(Lm*Cm)) ≈ 455.000 kHz
    fp = parallel resonance = fs * sqrt(1 + Cm/Co) ≈ 455.500 kHz

  The gap between fs and fp (~500 Hz) is the "pulling range" —
  the crystal's useful tuning window.

Why quartz? The piezoelectric effect converts mechanical vibration
to electrical oscillation and back. The crystal physically vibrates
at its resonant frequency with extremely low loss. Nothing else in
electronics achieves this Q at this size and cost.
```

---

## Crystal Ladder Filter Topology

```
LADDER FILTER — 2-crystal version:

  INPUT           Y1              Y2            OUTPUT
    ──────┤├──●──┤├──●──┤├──●──┤├──●──┤├────
              │              │              │
             Cs1            Cs2           RL
              │              │              │
             GND            GND           GND

  Y1, Y2 = 455 kHz quartz crystals (matched within ±50 Hz)
  Cs1, Cs2 = shunt capacitors (~100-220 pF) — set bandwidth
  RL = termination impedance (~500-2000 ohms)

How it works:
  1. At the series resonance frequency (fs), each crystal is a
     low-impedance path — signal passes through.
  2. Away from fs, the crystal impedance rises sharply — signal
     is shunted to ground through Cs.
  3. The combination creates a narrow passband around fs.
  4. Bandwidth is controlled by Cs: smaller Cs = narrower bandwidth.

  Cs = 100 pF → BW ≈ 3.0 kHz (good for SSB)
  Cs = 47 pF  → BW ≈ 1.5 kHz (good for CW)
  Cs = 220 pF → BW ≈ 5.0 kHz (good for AM)


3-CRYSTAL VERSION (steeper skirts):

  INPUT    Y1         Y2         Y3      OUTPUT
    ──●──┤├──●──┤├──●──┤├──●──┤├──●──┤├──●──
      │         │         │         │         │
     Rs        Cs1       Cs2       Cs3       RL
      │         │         │         │         │
     GND       GND       GND       GND      GND

  Rs = source impedance (matches crystal impedance ~500 ohm)
  Each additional crystal adds ~20 dB/decade to the skirt rolloff.
  3 crystals → shape factor ≈ 1.5:1 (nearly rectangular passband)
```

---

## Schematic

```
         Vs (455 kHz signal source)
          |
         Rs (500 ohm source impedance)
          |
    IN ---+
          |
         [Y1] (455.000 kHz crystal, series)
          |
          +--- Cs1 (100 pF) --- GND
          |
         [Y2] (455.000 kHz crystal, series, matched to Y1)
          |
          +--- Cs2 (100 pF) --- GND
          |
   OUT ---+
          |
         RL (1K ohm load)
          |
         GND

For 3-crystal version, add:
         [Y3] after Cs2, with Cs3 (100 pF) to GND before RL.
```

---

## Parts List

| Component | Qty | Est. Cost | Notes |
|-----------|-----|-----------|-------|
| 455 kHz crystal | 2-3 | $3.00-4.50 | HC-49S package, matched |
| 100 pF ceramic capacitor | 2-3 | $0.30 | NPO/C0G preferred |
| 1K ohm resistor | 1 | $0.05 | Load termination |
| 500 ohm resistor | 1 | $0.05 | Source termination |
| Breadboard | 1 | $2.00 | Half-size sufficient |
| Jumper wires | ~10 | $0.50 | M-M for breadboard |
| **Total** | | **~$6-8** | |

Optional for testing:
| Signal generator | 1 | (tool) | Sweep 450-460 kHz |
| Oscilloscope | 1 | (tool) | Measure passband shape |
| Frequency counter | 1 | (tool) | Verify crystal frequencies |

---

## Crystal Matching

Crystals labeled "455 kHz" vary by ±100 Hz or more between units. For a ladder filter, all crystals must be matched within ±50 Hz. To match:

1. Build a simple Pierce oscillator with each crystal
2. Measure the oscillation frequency with a counter
3. Group crystals by frequency — use the closest-matched set
4. Buy 5-6 crystals and select the best 2-3

Alternatively, buy matched crystal sets from filter crystal suppliers (Epson, Fox Electronics). Some amateur radio suppliers sell pre-matched sets.

---

## What You Learn

1. **Piezoelectric resonance:** Quartz crystals convert electrical energy to mechanical vibration with almost zero loss — Q factors of 20,000+ that no LC circuit can approach
2. **Ladder filter topology:** How series resonators and shunt capacitors create a bandpass response — the same topology used in SAW filters, ceramic filters, and MEMS resonators
3. **Shape factor:** The ratio of -60 dB bandwidth to -3 dB bandwidth measures how "rectangular" the passband is — crystal filters approach the ideal (1:1) that LC filters cannot
4. **Frequency standards:** The same crystal oscillator principle that makes this filter work also provides the frequency stability for every clock, computer, and communication system in the world

## Connection to TIROS-1

TIROS-1 used crystal-controlled oscillators for its telemetry transmitters (108 MHz and 235 MHz). The crystals ensured that the satellite's transmitted frequency was stable enough for the ground station receivers to track. Without the frequency stability of quartz, the ground station's narrow-band receiver would lose the signal as the satellite's oscillator drifted. This crystal filter demonstrates the same principle from the receiver's perspective: a narrow, stable passband that locks onto exactly one signal and rejects everything else. Crystal frequency control on the transmitter, crystal frequency selection on the receiver — two sides of the same quartz coin.
