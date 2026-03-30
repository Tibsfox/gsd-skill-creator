# DIY Radio Circuit: Audio Output Amplifier (LM386)

## The Circuit

An LM386-based audio power amplifier that takes the weak, demodulated audio signal from the v1.6 envelope detector and amplifies it to drive an 8-ohm loudspeaker. This is the sixth circuit in the progressive radio series, and with it, the ground station receiver chain is nearly complete. The signal path from antenna to speaker now exists: transmitter (v1.2) generates the signal, receiver (v1.3) picks it up, mixer (v1.4) converts it to 455 kHz intermediate frequency, IF amplifier (v1.5) selects and amplifies the IF, envelope detector (v1.6) recovers the audio, and now the audio amplifier (v1.7) makes it loud enough to hear from across the room.

The LM386 is one of the most successful audio amplifier ICs ever designed. Introduced by National Semiconductor in 1983, it has been in continuous production for over 40 years. It is a complete audio power amplifier in an 8-pin DIP package: just add a speaker, a coupling capacitor, and a power supply. Default voltage gain is 20 (26 dB). Adding a 10 uF capacitor between pins 1 and 8 increases gain to 200 (46 dB). That single capacitor bypasses an internal feedback resistor, and the gain jumps by a factor of 10.

**What it does:**
- Accepts the demodulated audio from the v1.6 envelope detector (~50-200 mV)
- Amplifies it by 20 (default) or 200 (with gain capacitor)
- Drives an 8-ohm speaker at up to 325 mW (enough to fill a room)
- Volume control potentiometer on the input
- Zobel network (R + C in series across the output) prevents oscillation
- Bypass capacitor on pin 7 for power supply rejection

**What it teaches:** Audio power amplification, impedance matching (high-impedance source to low-impedance speaker), gain control, bypass filtering, and stability (the Zobel network). Every portable radio, guitar practice amp, and intercom from the 1980s to today contains a circuit remarkably similar to this one.

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
  v1.7 — Audio Amplifier (audio → speaker) ← YOU ARE HERE
  v1.8 — [planned] BFO (beat frequency oscillator for CW/SSB)
  v1.9 — [planned] Full receiver integration

The complete superheterodyne signal chain:
  Antenna → RF amplifier → Mixer ← Local Oscillator
                              ↓
                        IF Amplifier (455 kHz)
                              ↓
                        Envelope Detector
                              ↓
                        Audio Amplifier ← THIS CIRCUIT
                              ↓
                           Speaker

With v1.7 complete, you can hear signals from your v1.2 transmitter
through the full superheterodyne chain. Tune the mixer's local
oscillator, and you have a working AM radio.
```

## Schematic

```
                                   +9V (battery)
                                     │
                                     │
              Volume                 │
Audio In ─── POT ─── C_in ──┐       │
(from v1.6)  10K     100nF  │       │
                             │   ┌───┴───┐
                             │   │       │
                        Pin 3│   │ LM386 │Pin 6──── C_out ──── Speaker+
                      (IN+) ─┤   │       ├────────  250uF      8 ohm
                             │   │       │                     Speaker-
                        Pin 2│   │       │Pin 5                  │
                      (IN-) ─┤   │       ├───── GND              │
                             │   │       │                       GND
                        GND ─┤   │       │Pin 7
                             │   │       ├───── C_bypass
                             │   │       │      10uF ── GND
                             │   │       │
                             │   └───┬───┘
                             │       │
                             │    Pin 1  Pin 8
                             │       │     │
                             │       └─ C_gain ─┘
                             │          10uF
                             │    (gain = 200 with cap)
                             │    (gain = 20 without)
                             │
                            GND

                    Zobel Network (across speaker):
                    Speaker+ ─── R_zobel ─── C_zobel ─── Speaker-
                                  10 ohm      47nF

LM386 Pin Assignment (8-pin DIP):
  Pin 1 ── Gain        Pin 8 ── Gain
  Pin 2 ── IN-         Pin 7 ── Bypass
  Pin 3 ── IN+         Pin 6 ── Output
  Pin 4 ── GND         Pin 5 ── Vs (+V supply)

SIGNAL FLOW:

  Audio from         Volume           LM386              Speaker
  envelope    ───►  control  ───►  amplifier  ───►   8-ohm driver
  detector          (10K pot)      (gain 200)        (325 mW max)
  ~50 mV              ↕              ×200              ╱|╲
                   0 — max           =10V pp          ╱ | ╲
                                                     ╱  |  ╲
```

## Component List

| Part | Qty | Description | Est. Cost |
|------|-----|-------------|-----------|
| LM386N-1 | 1 | Audio power amplifier IC, 8-pin DIP | $0.80 |
| 10K potentiometer | 1 | Linear taper, volume control | $0.50 |
| 100nF capacitor | 1 | Ceramic, input coupling | $0.10 |
| 10uF capacitor | 2 | Electrolytic, gain set + bypass | $0.20 |
| 250uF capacitor | 1 | Electrolytic, output coupling (220-470uF OK) | $0.30 |
| 10-ohm resistor | 1 | 1/4W, Zobel network | $0.05 |
| 47nF capacitor | 1 | Ceramic, Zobel network | $0.10 |
| 8-ohm speaker | 1 | Small, 0.25-1W (50mm diameter typical) | $1.50 |
| 8-pin DIP socket | 1 | For the LM386 (optional but recommended) | $0.15 |
| 9V battery + clip | 1 | Power supply (6-12V range works) | $1.00 |
| Breadboard | 1 | Small, 400-point (or share with v1.6) | $0.00 |
| Jumper wires | ~10 | For breadboard connections | $0.50 |

**Total: ~$5**

(If you already have a breadboard and jumper wires from v1.6, the marginal cost is under $4.)

## Build Steps

### Step 1: Power supply
- Connect the 9V battery clip to the breadboard power rails
- Red wire to the + rail, black to the - (GND) rail
- The LM386 operates from 4-12V; 9V is the sweet spot

### Step 2: LM386 IC
- Place the LM386 in the DIP socket on the breadboard (notch/dot = pin 1)
- Pin 4 (GND) to GND rail
- Pin 5 (Vs) to +9V rail
- Pin 2 (IN-) to GND (single-ended input configuration)

### Step 3: Input coupling and volume
- Wire the 10K potentiometer: one outer pin to the v1.6 envelope detector output, other outer pin to GND, wiper to C_in (100nF)
- Connect C_in (100nF) from the pot wiper to Pin 3 (IN+) of the LM386
- The pot controls volume by attenuating the input signal

### Step 4: Gain capacitor
- For maximum gain (200, needed for weak radio signals): connect a 10uF electrolytic capacitor between Pin 1 and Pin 8
- Observe polarity: positive terminal to Pin 1
- Without this capacitor, gain defaults to 20 (quieter but less noise)

### Step 5: Bypass capacitor
- Connect a 10uF electrolytic capacitor from Pin 7 to GND
- This decouples the internal bias network and improves power supply rejection
- Positive terminal to Pin 7

### Step 6: Output coupling
- Connect C_out (250uF electrolytic) from Pin 6 to the speaker positive terminal
- Positive terminal toward Pin 6 (the DC bias at Pin 6 is approximately half the supply voltage)
- Connect the speaker negative terminal to GND
- The capacitor blocks the DC bias (~4.5V) from the speaker, passing only the AC audio

### Step 7: Zobel network
- Connect a 10-ohm resistor in series with a 47nF capacitor across the speaker terminals
- This snubber network absorbs high-frequency energy and prevents the amplifier from oscillating at ultrasonic frequencies
- Without it, the LM386 may "motorboat" (low-frequency oscillation) or squeal

### Step 8: Test
- Power on with the volume at minimum
- Feed audio from the v1.6 envelope detector (or any audio source through a 100nF coupling cap)
- Slowly turn up the volume
- You should hear amplified audio from the speaker
- If using the full radio chain: tune a signal with the v1.4 mixer, and you are listening to radio through a superheterodyne receiver you built yourself

## Theory of Operation

### The LM386 internally

The LM386 contains a differential amplifier input stage, a voltage gain stage, and a push-pull output stage — the same topology as a discrete audio amplifier, miniaturized into 8 pins. The internal feedback resistor between pins 1 and 8 sets the default gain to 20. Adding the external 10uF capacitor between these pins bypasses the feedback resistor at audio frequencies, increasing the gain to 200. The capacitor acts as a short circuit for audio frequencies (Z = 1/(2*pi*f*C) = 1/(2*pi*1000*10e-6) = 16 ohms at 1 kHz) while remaining an open circuit for DC, preserving the DC bias point.

### Why 250uF output coupling?

The output coupling capacitor must pass audio frequencies (down to ~100 Hz for voice) into the low-impedance speaker (8 ohms). The -3dB cutoff frequency is:

```
f_c = 1 / (2 * pi * R_speaker * C_out)
    = 1 / (2 * pi * 8 * 250e-6)
    = 79.6 Hz

This passes the full voice band and most music fundamentals.
A smaller cap (47uF) would cut off at 423 Hz — too high for voice.
A larger cap (1000uF) would extend to 20 Hz — overkill for radio.
250uF is the practical sweet spot.
```

### Power output

With a 9V supply and an 8-ohm speaker, the theoretical maximum output power is:

```
P_max = V_supply^2 / (8 * R_load)  (Class AB)
      = 81 / 64
      = 1.27 W theoretical maximum

Practical output (LM386N-1): 325 mW at 5% THD
This is plenty loud for a desktop radio — comparable to a phone speaker.
```

## Connection to Mission 1.7

Explorer 1's telemetry transmitted cosmic ray counter data back to Earth at 108.00 MHz. The ground stations at Cape Canaveral, the Jet Propulsion Laboratory's Goldstone station, and tracking sites around the equator received this signal, demodulated it, and recorded the Geiger counter pulse data on strip charts. The final stage of every ground station receiver was an audio amplifier driving a loudspeaker or recorder — so that operators could *hear* the telemetry and know the link was alive. The sound of Explorer 1's telemetry was the sound of data about the radiation belts arriving on Earth for the first time.

This LM386 circuit is the modern equivalent of that final audio stage. The signal that started as a cosmic ray hitting a Geiger tube 2,550 km above Earth, was converted to a radio pulse, transmitted at 108 MHz, received by an antenna, mixed to 455 kHz, amplified, envelope-detected, and now — amplified one last time — comes out of a speaker as sound. The entire chain exists on your breadboard. You built a ground station.

The progressive radio series is now six stages deep:

```
v1.2 oscillator → v1.3 receiver → v1.4 mixer → v1.5 IF amp
→ v1.6 detector → v1.7 audio amp → SPEAKER

One more stage (BFO, v1.8) and you can receive CW (Morse code).
Full integration (v1.9) and you have a complete superheterodyne radio.
```
