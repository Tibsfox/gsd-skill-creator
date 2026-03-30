# DIY Radio Circuit: Volume and Tone Control

## The Circuit

A passive Baxandall tone control with a volume potentiometer, placed between the v1.7 audio amplifier's output and the speaker. This gives the listener control over bass, treble, and overall volume — the same controls found on every radio, stereo, and guitar amp since the 1950s. Peter Baxandall published this circuit in Wireless World magazine in 1952, and its topology has been the standard ever since. With this stage, the progressive radio receiver has user-adjustable sound quality.

The Baxandall circuit uses RC networks around a pair of potentiometers to provide independent boost/cut of bass and treble frequencies. At the flat (center) setting, the circuit passes all frequencies equally. Turning the bass pot one way boosts low frequencies; the other way cuts them. Same for treble. The elegance is in the symmetry: boost and cut are mirror images, using the same components, just by turning a knob.

**What it does:**
- Volume potentiometer: adjusts overall signal level (0 to full)
- Bass control: +/-12 dB at 100 Hz (boost or cut low frequencies)
- Treble control: +/-12 dB at 10 kHz (boost or cut high frequencies)
- Passive circuit: no active components, no power supply needed
- Insertion loss: ~6 dB at flat settings (compensated by the LM386 gain)

**What it teaches:** Frequency-dependent voltage dividers, how capacitors and resistors form filters, the concept of tone shaping, and the Baxandall feedback topology that appears in every audio system. The same RC filter principles that shape audio signals shape the RF signals in earlier stages of the radio chain.

**Total cost: ~$4**

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
  v1.8 — Volume/Tone Control (audio shaping) ← YOU ARE HERE
  v1.9 — [planned] AGC (automatic gain control)

The complete signal chain with user controls:

  Antenna → RF amp → Mixer ← Local Oscillator
                        ↓
                  IF Amplifier (455 kHz)
                        ↓
                  Envelope Detector
                        ↓
                  Audio Amplifier (LM386)
                        ↓
              ┌── Volume Control ──┐
              │   Tone Control     │  ← THIS CIRCUIT
              │   (Baxandall)      │
              └────────────────────┘
                        ↓
                     Speaker

With v1.8, you can adjust the sound to your preference.
Boost bass for warmth, cut treble to reduce static hiss,
or shape the audio however you like.
```

## Schematic

```
                  VOLUME CONTROL
Audio from    ┌────────────────────┐
LM386 output ─┤    10K Log Pot     ├─── Signal out to
  (v1.7)      │   (Wiper = output) │    tone control
              │   One end to GND   │
              └────────────────────┘

                  BAXANDALL TONE CONTROL

Signal In ───┬───── R1 ──────┬───── R2 ──────┬─── Signal Out
(from vol.)  │    10K        │     10K       │    (to speaker)
             │               │               │
             C1              │               C2
            100nF            │              10nF
             │               │               │
             ├─── BASS POT ──┤               ├─── TREBLE POT ──┤
             │   100K Lin    │               │    100K Lin      │
             │               │               │                  │
            GND             GND             GND                GND

DETAILED WIRING:

  Signal ── R1 (10K) ──┬── R2 (10K) ── Output
     In                 │                  │
                        │                  │
     Bass pot wiper ────┘                  └──── Treble pot wiper
     Bass pot CW  ── C1 (100nF) ── Signal In   Treble pot CW ── C2 (10nF) ── Output
     Bass pot CCW ── GND                         Treble pot CCW ── GND


FULL SIGNAL PATH (with v1.7):

  From v1.6      Volume    Baxandall       Speaker
  detector ──► LM386 ──► 10K pot ──► Tone ──► 8 ohm
  (~50 mV)      ×200                control
                                    Bass/Treble

Frequency Response (flat / boost bass / cut treble):

  dB │      flat               boost bass         cut treble
   6 │  ─────────────      ╱─────────────     ─────────────╲
   0 │                                                       ╲
  -6 │                     ─────────────      ─────────────   ╲──
     └──────────────────   ──────────────     ──────────────────
      20Hz  1kHz  20kHz    20Hz  1kHz  20kHz  20Hz  1kHz  20kHz
```

## Component List

| Part | Qty | Description | Est. Cost |
|------|-----|-------------|-----------|
| 10K potentiometer (log) | 1 | Audio taper, volume control | $0.50 |
| 100K potentiometer (linear) | 2 | Linear taper, bass and treble | $1.00 |
| 10K resistor | 2 | 1/4W, R1 and R2 | $0.10 |
| 100nF capacitor | 1 | Ceramic or film, bass coupling (C1) | $0.10 |
| 10nF capacitor | 1 | Ceramic, treble coupling (C2) | $0.10 |
| 3.5mm audio jack (optional) | 1 | For connecting to external speaker | $0.30 |
| Breadboard | 1 | Small, 170-point (or share with v1.7) | $0.00 |
| Jumper wires | ~15 | For breadboard connections | $0.50 |
| Knobs | 3 | For potentiometers (optional but nice) | $1.50 |

**Total: ~$4**

(If you already have a breadboard from v1.7, marginal cost is under $3.)

## Build Steps

### Step 1: Volume control
- Place the 10K log potentiometer on the breadboard
- Connect one outer pin to the LM386 output (through the existing 250uF coupling cap from v1.7)
- Connect the other outer pin to GND
- The wiper is the volume-controlled output
- **Use a logarithmic (audio) taper pot** — human hearing is logarithmic, so a log pot gives a smooth perceived volume change

### Step 2: Bass network
- Connect R1 (10K) from the volume pot wiper to the center junction
- Connect C1 (100nF) from the signal input to one outer pin of the 100K bass pot
- Connect the other outer pin of the bass pot to GND
- Connect the bass pot wiper to the center junction
- C1 sets the bass frequency: f_bass = 1/(2*pi*R*C) = 1/(2*pi*10000*100e-9) = 159 Hz

### Step 3: Treble network
- Connect R2 (10K) from the center junction to the output
- Connect C2 (10nF) from the output to one outer pin of the 100K treble pot
- Connect the other outer pin of the treble pot to GND
- Connect the treble pot wiper to the center junction
- C2 sets the treble frequency: f_treble = 1/(2*pi*R*C) = 1/(2*pi*10000*10e-9) = 1,592 Hz

### Step 4: Output to speaker
- Connect the output to the speaker (through a coupling cap if needed, or directly if the v1.7 output cap is already in the chain)
- The 8-ohm speaker from v1.7 works directly

### Step 5: Test
- Feed audio from the v1.7 LM386 output
- Set all controls to center position — sound should pass through with ~6 dB loss
- Turn bass pot: clockwise boosts low frequencies (fuller, warmer sound), counterclockwise cuts them (thinner)
- Turn treble pot: clockwise boosts high frequencies (brighter, crisper), counterclockwise cuts them (duller, less hiss)
- Volume pot controls overall level from silence to full
- When receiving radio through the full chain, use treble cut to reduce static hiss

## Theory of Operation

### The Baxandall Topology

Peter Baxandall's 1952 circuit is a passive frequency-dependent voltage divider. The key insight: at audio frequencies, a capacitor's impedance Z = 1/(2*pi*f*C) varies with frequency. A small capacitor (10nF) has high impedance at low frequencies (blocks bass) and low impedance at high frequencies (passes treble). A larger capacitor (100nF) has low impedance at frequencies where the smaller one is still blocking.

```
Bass control (C1 = 100nF):
  At 100 Hz:  Z_C1 = 1/(2*pi*100*100e-9) = 15.9 K ohm
  At 1 kHz:   Z_C1 = 1/(2*pi*1000*100e-9) = 1.59 K ohm
  At 10 kHz:  Z_C1 = 1/(2*pi*10000*100e-9) = 159 ohm

  When bass pot is at max: C1 provides a low-impedance path for
  bass frequencies to bypass R1, boosting them.
  When bass pot is at min: C1 shunts bass to ground, cutting them.

Treble control (C2 = 10nF):
  At 100 Hz:  Z_C2 = 1/(2*pi*100*10e-9) = 159 K ohm (blocks)
  At 1 kHz:   Z_C2 = 1/(2*pi*1000*10e-9) = 15.9 K ohm
  At 10 kHz:  Z_C2 = 1/(2*pi*10000*10e-9) = 1.59 K ohm (passes)

  When treble pot is at max: C2 feeds treble back to the junction,
  boosting high frequencies.
  When treble pot is at min: C2 shunts treble to ground.
```

### Why Passive?

A passive tone control (no op-amps, no transistors) has insertion loss — the signal gets smaller passing through. The v1.7 LM386 with gain of 200 provides more than enough signal to compensate. The advantage of passive: no power supply needed, no noise added, no distortion from active devices, and the circuit is stable at any setting. The disadvantage: you can only cut; the "boost" is really just less cut. But for a radio receiver where the goal is to reduce noise and shape sound, passive control is ideal.

### The Potentiometer as Variable Resistor

A potentiometer is two resistors in one package, connected at a movable wiper. As you turn the knob, one resistance increases and the other decreases, always summing to the total pot value. In the volume control, this divides the signal between the output (wiper) and ground. In the tone controls, this shifts the balance between the frequency-selective capacitor path and the direct resistor path.

This is the same principle as Vanguard 1's solar cells: the angle of the sun is the "knob," and the cell's surface normal is the "wiper." As the angle changes, the power divides between useful electricity and reflected light. The potentiometer is a resistive divider; the solar cell is a photonic divider. Both follow the same mathematical relationship — a continuous variable that scales the output between zero and maximum.

## Connection to Mission 1.8

Vanguard 1's transmitter on 108 MHz was powered by those six Bell Labs solar cells, sending a signal that was picked up by ground stations worldwide. The ground station operators adjusted their receivers' volume and tone controls to optimize the received signal — cutting treble to reduce atmospheric noise, boosting bass to pull out the low-frequency telemetry tones. The controls you are building are the same controls they used.

The progressive radio series now has eight stages:

```
v1.2 oscillator → v1.3 receiver → v1.4 mixer → v1.5 IF amp
→ v1.6 detector → v1.7 audio amp → v1.8 volume/tone → SPEAKER

Next: v1.9 will add AGC (automatic gain control) — the radio
adjusts its own gain to maintain constant output level regardless
of signal strength. This is the transition from manual control
(you adjust the knobs) to automatic control (the radio adjusts
itself). Vanguard 1 had no automatic anything — it was all
open-loop, which is why it tumbled and why its power output
varied with sun angle. AGC is the feedback loop that the early
satellites lacked.
```
