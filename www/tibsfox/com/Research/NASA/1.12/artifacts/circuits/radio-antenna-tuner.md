# DIY Radio Circuit: Antenna Tuner — L-Network Impedance Matching

## The Circuit

An L-network antenna tuner that matches the impedance of a random-wire antenna to the 50-ohm input of the receiver chain built in previous missions. Two components — a variable inductor (tapped coil) and a variable capacitor — form an "L" shape that transforms the antenna's complex impedance to the receiver's desired 50 ohms. This is the simplest possible matching network, and it is sufficient for the HF bands where the progressive radio operates.

This is the twelfth circuit in the progressive radio series: v1.2 built the transmitter, v1.3 the receiver, v1.4 the mixer, v1.5 the IF amplifier, v1.6-v1.11 continued the chain, and v1.12 adds the antenna tuner — the front-end impedance match that maximizes power transfer from antenna to receiver. Without a tuner, an impedance mismatch reflects energy back to the antenna instead of delivering it to the receiver.

**What it does:**
- A tapped inductor (L1) provides variable inductance by selecting taps
- A variable capacitor (C1) provides adjustable capacitance
- Together they form an L-network: one component in series, one in shunt
- The network transforms antenna impedance Z_ant to receiver impedance Z_rx = 50Ω
- An SWR indicator (LED brightness or meter deflection) shows match quality
- At resonance: maximum signal transfer, LED at minimum (null bridge)

**What it teaches:** Every antenna has an impedance that depends on its length, shape, height, and frequency. A half-wave dipole in free space is ~73 ohms (close to 50). But a random wire, an end-fed, or a mobile whip can be anything from 10 to 1000+ ohms, and often complex (with reactive components). The L-network cancels the reactive part and transforms the resistive part to 50 ohms. This is the same principle as transformer coupling, acoustic impedance matching in musical instruments, and optical antireflection coatings. Explorer 7's telemetry system used impedance matching between the spacecraft antenna and the transmitter to ensure maximum radiated power — every watt mattered when the signal had to travel 1000+ km to the ground station.

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
  v1.12 — Antenna Tuner (L-network impedance matching) ← YOU ARE HERE

The antenna tuner sits at the very front of the receiver:
  Antenna → TUNER (THIS CIRCUIT) → RF Amp → Mixer ← LO
                                                ↓
                                          IF Amplifier
                                                ↓
                                          Detector ← BFO
                                                ↓
                                           Audio Amp → Speaker

Without tuner:
  Antenna (Z=???) → Receiver (50Ω) → mismatch → reflected power → weak signal

With tuner:
  Antenna (Z=???) → L-network → Receiver (50Ω) → matched → maximum signal

Explorer 7 telemetry chain:
  Spacecraft transmitter (50Ω) → matching network → antenna (dipole)
  → 573-1073 km of space → ground antenna → tuner → receiver
  The matching network ensured maximum radiated power from a 41.5 kg satellite.
```

## Schematic

```
                          L-NETWORK CONFIGURATION

Configuration 1: LOW-Z antenna (< 50Ω)       Configuration 2: HIGH-Z antenna (> 50Ω)
  Series C, Shunt L                             Series L, Shunt C

  ANT ─── C1 (var) ──┬── to receiver (50Ω)    ANT ─── L1 (tapped) ──┬── to receiver (50Ω)
                      │                                               │
                     L1 (tapped)                                    C1 (var)
                      │                                               │
                     GND                                             GND


PRACTICAL BUILD (switch-selectable configuration):

                    SW1 (DPDT — config select)
                      ┌────A────┐
  ANT ────────────────┤         ├──────── to receiver (50Ω)
                      │    B    │
                      └────┬────┘
                           │
                    ┌──────┴──────┐
                    │             │
                  L1 (tapped    C1 (variable
                   coil)         capacitor)
                    │             │
              TAP SELECT        GND
              (rotary SW)

TAPPED INDUCTOR (L1):
  Wind 30 turns of 22 AWG enameled wire on a T68-2 toroid core.
  Taps at turns: 5, 10, 15, 20, 25, 30
  Provides inductance range: ~0.5 µH to ~8 µH

        Turn 0 ─── 5 ─── 10 ─── 15 ─── 20 ─── 25 ─── 30
                   ↓      ↓       ↓       ↓       ↓
              Rotary switch positions (1 of 6)

SWR INDICATOR (simple LED bridge):
  A Wheatstone bridge arrangement where the LED dims at match.

                 50Ω (ref)
                   ┌──┐
  RF in ──┬────────┤  ├────────┬── RF out
          │        └──┘        │
          │    R2 (50Ω)    R3 (50Ω)
          │        │           │
          └────────┤           │
                   │           │
                  LED (red)    │
                   │           │
                   └───────────┘
                        │
                       GND

  When impedance = 50Ω: bridge balanced, LED dark (good match)
  When impedance ≠ 50Ω: bridge unbalanced, LED lights (poor match)
```

## L-Network Design

```
For an L-network matching R_ant to R_load (50Ω):

Given: R_ant > R_load (high-impedance antenna case)
  Q = sqrt(R_ant/R_load - 1)
  X_series = Q × R_load        (inductive reactance in series)
  X_shunt = R_ant / Q          (capacitive reactance in shunt)

  L_series = X_series / (2π × f)
  C_shunt = 1 / (2π × f × X_shunt)

Example: Match 200Ω antenna to 50Ω at 7 MHz
  Q = sqrt(200/50 - 1) = sqrt(3) = 1.732
  X_series = 1.732 × 50 = 86.6 Ω → L = 86.6/(2π×7e6) = 1.97 µH
  X_shunt = 200/1.732 = 115.5 Ω → C = 1/(2π×7e6×115.5) = 197 pF

Example: Match 20Ω antenna to 50Ω at 7 MHz (low-Z case)
  Q = sqrt(50/20 - 1) = sqrt(1.5) = 1.225
  X_series = 1.225 × 20 = 24.5 Ω → C = 1/(2π×7e6×24.5) = 928 pF
  X_shunt = 50/1.225 = 40.8 Ω → L = 40.8/(2π×7e6) = 0.93 µH

The L-network has limited range (typically 4:1 impedance ratio).
For wider range, cascade two L-networks or use a T/Pi network.
```

## Bill of Materials

| Qty | Component | Value/Type | Purpose | Cost |
|-----|-----------|------------|---------|------|
| 1 | Toroid core | T68-2 (red) | Inductor former | $0.80 |
| 3m | Magnet wire | 22 AWG enameled | Inductor winding (30 turns) | $0.50 |
| 1 | Rotary switch | 1P6T | Inductor tap selection | $1.50 |
| 1 | Variable capacitor | 10-365 pF | Tuning capacitor (C1) | $2.50 |
| 1 | Switch | DPDT toggle | Configuration select (SW1) | $0.80 |
| 2 | Resistor | 50Ω, 1/4W | SWR bridge reference | $0.10 |
| 1 | LED, red | 3mm | SWR indicator | $0.05 |
| 1 | Resistor | 1K, 1/4W | LED current limit | $0.02 |
| 1 | BNC connector | Female, panel mount | Antenna input | $0.80 |
| 1 | BNC connector | Female, panel mount | Receiver output | $0.80 |
| 1 | Breadboard | Half-size | Assembly | $3.00 |
| | | | **Total** | **~$10.87** |

## Build Notes

1. **Wind the inductor.** Count 30 turns of enameled wire on the T68-2 toroid, tapping at turns 5, 10, 15, 20, 25, 30. Strip enamel at each tap point (scrape with a blade or use solder to burn through). This gives you 6 selectable inductance values from ~0.5 µH to ~8 µH.

2. **Wire the rotary switch.** Connect the 6 taps to the 6 positions of the rotary switch. The common goes to one side of the L-network. Clicking through the switch selects different inductance values.

3. **Add the variable capacitor.** A standard AM broadcast variable capacitor (10-365 pF) provides continuous tuning. Connect it as the second element of the L-network. The DPDT switch swaps the L and C between series and shunt positions.

4. **Build the SWR bridge.** The simple LED bridge is a qualitative indicator — it goes dim when the match is good. For quantitative SWR measurement, add a small toroidal transformer and rectifier (the Bruene coupler, a future project). For now, "LED dark = good match" is sufficient.

5. **Test with your receiver.** Connect a random wire antenna (10-20m of wire, any shape) to the antenna input. Connect the receiver chain to the output. Tune to a known signal. Adjust the tap switch and variable capacitor for maximum signal strength (loudest audio) and minimum SWR LED brightness. You have matched your antenna.

6. **The SWR concept.** Standing Wave Ratio measures the quality of an impedance match. SWR = 1.0 means perfect match (all power delivered). SWR = 2.0 means 11% reflected. SWR = 3.0 means 25% reflected. Most receivers work well up to SWR 3:1. The L-network typically achieves SWR < 1.5:1 within its matching range.

## The Engineering Lesson

Impedance matching is one of the most universal principles in engineering. It appears in:
- **Radio:** antenna tuners, transmission line matching, filter design
- **Audio:** transformer coupling between amplifier stages, speaker impedance matching
- **Optics:** antireflection coatings on lenses (matching air impedance to glass impedance)
- **Acoustics:** the middle ear bones match the impedance of air to the fluid in the cochlea
- **Mechanical:** gearboxes match the impedance of an engine to a load

The principle is always the same: maximum power transfer occurs when the source impedance equals the complex conjugate of the load impedance. Any mismatch reflects energy back to the source. The L-network is the simplest circuit that can perform this transformation — two reactive components arranged to cancel the imaginary part and transform the real part.

Explorer 7's 108 MHz telemetry transmitter used a matching network between the transmitter output stage (designed for 50 ohms) and the spacecraft dipole antenna (whose impedance depended on the satellite's orientation and the proximity of the spacecraft body). The matching network ensured that the transmitter's limited power (about 60 milliwatts) was radiated as efficiently as possible. At 573 to 1073 km altitude, with a ground station antenna of modest gain, every milliwatt mattered. The matching network was invisible — a few components on a circuit board inside a 41.5 kg satellite — but without it, the radiation budget data that launched climate science might never have reached the ground.
