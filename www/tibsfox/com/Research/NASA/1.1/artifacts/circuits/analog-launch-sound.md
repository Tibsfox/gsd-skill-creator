# DIY Analog Audio Circuit: Pioneer 0 Launch Sound Generator

## The Circuit

A purely analog audio circuit that generates the sound of a rocket launch using white noise, filters, and voltage-controlled oscillators. No digital components. No microcontroller. Just op-amps, transistors, capacitors, and resistors making the sound of fire.

**What it does:**
- Press the launch button
- A low rumble builds (ignition)
- The rumble intensifies and rises in pitch (ascent)
- A high-pitched whine appears (bearing failure)
- A loud burst of noise (explosion)
- Silence

**Total cost: ~$18-25**

---

## Block Diagram

```
[White Noise Gen] --+--> [VCF (Low Pass)] --> [VCA] --+--> [LM386 Amp] --> [Speaker]
                    |                                  |
                    +--> [VCF (Band Pass)] --> [VCA] --+
                    |                                  |
                    +--> [VCF (High Pass)] --> [VCA] --+
                                                       |
[Bearing VCO] ------> [VCA] --------------------------+

[Envelope Generator] --> controls all VCAs and VCF cutoffs
```

## Noise Source (Zener Diode)

The simplest white noise generator: a reverse-biased zener diode amplified by a transistor.

```
+9V
 |
 R1 (100KΩ)
 |
 +--[base]--+
 |     2N3904|
 |  [emitter]---> Noise Output (AC coupled via 0.1µF)
 |           |
 +--[collector]
 |
 D1 (5.1V Zener, reverse-biased)
 |
GND

The avalanche noise from the reverse-biased zener junction
produces broadband white noise. The transistor amplifies it
to a usable level (~100mV RMS).
```

## Voltage-Controlled Filter (Single-Pole)

A simple RC low-pass filter with the resistance provided by a photocell in an optocoupler (vactrols / LED+LDR). The envelope generator drives the LED, which changes the photocell resistance, sweeping the filter cutoff.

```
Noise Input --[R_fixed 1KΩ]--> +--[Photocell (LDR)]--> Output
                                |
                               C1 (0.1µF)
                                |
                               GND

Cutoff frequency: f = 1 / (2π * (R_fixed + R_LDR) * C1)
When LDR is dark (high R): low cutoff, only bass passes (rumble)
When LDR is lit (low R): high cutoff, full spectrum (roar)
The envelope LED brightness sweeps the cutoff over 77 seconds.
```

## Bearing Oscillator (Phase-Shift VCO)

A simple phase-shift oscillator whose frequency rises over time, simulating the bearing whine:

```
Three RC stages in series, feeding back to an inverting amplifier:

Out --[C 0.01µF]--+--[C 0.01µF]--+--[C 0.01µF]--+--> [Op-Amp inverting input]
                  |               |               |
                [R_var]         [R_var]         [R_var]    (photocell/vactrol)
                  |               |               |
                 GND             GND             GND

Oscillation frequency: f = 1 / (2π * R * C * √6)

With R_var = 100KΩ (dark): f ≈ 650 Hz
With R_var = 10KΩ (bright): f ≈ 6,500 Hz

The envelope generator's "bearing" channel drives these LDRs,
sweeping the frequency upward in the last 10 seconds before "failure."
```

## Envelope Generator (RC Timing)

The entire 77-second timeline is controlled by a single large RC network:

```
LAUNCH BUTTON
     |
     +--[100µF]--+--> MAIN ENVELOPE (0-77 seconds)
     |           |
     |         [1MΩ]
     |           |
     |          GND
     |
     +--[10µF]---+--> BEARING ENVELOPE (starts at ~65 seconds)
     |           |
     |         [4.7MΩ]   (long delay before bearing kicks in)
     |           |
     |          GND
     |
     +--[1µF]----+--> EXPLOSION ENVELOPE (triggers at ~77 seconds)
                 |
               [100KΩ]
                 |
                 +--> [SCR or transistor latch] --> fires all VCAs to max
```

The RC time constants:
- Main envelope: τ = 1MΩ × 100µF = 100 seconds (charges to 63% in 100s, reaches "full" around 77s)
- Bearing envelope: τ = 4.7MΩ × 10µF = 47 seconds (delayed start, rises steeply at end)
- Explosion: SCR latch fires when main envelope exceeds threshold (~7.2V at 77s)

## Output Amplifier (LM386)

```
Mixed Audio --[10µF]--> pin 3 (non-inverting input)
                        |
                     [LM386]
                        |
              pin 5 --> [220µF] --> 8Ω Speaker
                        |
                       GND

Gain: 20 (default, pins 1+8 open)
or 200 (10µF between pins 1 and 8)
```

## Parts List

| Part | Value | Qty | Cost |
|------|-------|-----|------|
| LM386 audio amplifier IC | - | 1 | $1.00 |
| TL072 dual op-amp (or LM358) | - | 1 | $0.60 |
| 2N3904 NPN transistor | - | 2 | $0.20 |
| 5.1V Zener diode | - | 1 | $0.15 |
| LED (any color, for optocoupler) | 5mm | 3 | $0.30 |
| LDR (photoresistor, CdS cell) | - | 3 | $1.50 |
| Heat-shrink tubing (for vactrol) | - | 3 | $0.45 |
| Resistors (assorted: 1K, 10K, 100K, 1M, 4.7M) | 1/4W | 15 | $0.75 |
| Capacitors (0.01µF, 0.1µF, 1µF, 10µF, 100µF, 220µF) | - | 10 | $1.50 |
| 8Ω small speaker | 2-3 inch | 1 | $2.00 |
| Pushbutton (momentary) | - | 1 | $0.25 |
| 9V battery snap | - | 1 | $0.20 |
| 9V battery | - | 1 | $3.00 |
| Breadboard (full-size) | - | 1 | $5.00 |
| Jumper wires | - | 1 set | $2.50 |
| **Total** | | | **~$19** |

## Build Instructions

1. **Build the noise source first.** Wire the zener + transistor. Connect to the speaker amp (LM386). You should hear white noise -- a steady hiss. This is the raw material.

2. **Add the low-pass filter.** Insert the RC filter between noise source and amp. Make a vactrol: wrap an LED and LDR face-to-face in heat-shrink tubing. Drive the LED with a potentiometer first. Sweep the pot -- you should hear the noise go from rumble (dark) to roar (bright).

3. **Add the bearing oscillator.** Build the phase-shift oscillator with fixed resistors first. Verify it oscillates (you'll hear a tone). Then replace the resistors with vactrol LDRs. Sweep the LED -- the pitch should rise.

4. **Build the envelope generator.** Wire the RC timing networks. Press the button. Watch the voltages rise on a multimeter. The main envelope should reach ~7V in about 77 seconds.

5. **Connect everything.** The envelope drives the vactrol LEDs. Press the button and listen: rumble → roar → whine → boom → silence.

6. **Calibrate.** Adjust the 1MΩ resistor (use a trimpot) until the explosion triggers at approximately 77 seconds. The bearing whine should start around 65 seconds.

## What You Learn

- **Analog noise generation** -- how random quantum events (zener avalanche) become usable signals
- **Voltage-controlled filtering** -- the foundation of ALL analog synthesizers (Moog, Buchla, ARP)
- **Optocouplers / vactrols** -- how light controls resistance (used in guitar amps, tremolo effects, compressors)
- **RC timing** -- the same math that governs rocket engine turbopump bearing life calculations
- **The sound of failure** -- you hear the bearing whine rise, and you know what's coming. The same instinct that a technician develops listening to rotating machinery.

## Fox Companies Connection

Audio electronics workshop. Build synthesizer modules from analog components. This circuit is a standalone module, but the noise source, filter, VCO, and VCA are the four building blocks of ALL modular synthesizers. After building the Pioneer 0 sound generator, participants have the skills to build:
- Tremolo effects for guitar ($15 kit, sell at $40)
- White noise generators for sleep machines ($10 kit, sell at $25)
- Simple synthesizer modules ($20 kit, sell at $50)

Each NASA mission adds a new analog circuit based on the mission's sound signature. By mission 50, participants can build a complete modular synth from the accumulated kit designs.
