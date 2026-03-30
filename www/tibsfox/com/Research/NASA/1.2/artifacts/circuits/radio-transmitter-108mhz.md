# DIY Radio Circuit: Pioneer 1 VHF Beacon Simulator (108.06 MHz)

## The Circuit

A low-power VHF transmitter that demonstrates the exact radio principles Pioneer 1 used to send telemetry data back to Earth. A crystal oscillator at 27.015 MHz feeds a x4 frequency multiplier to produce 108.06 MHz -- Pioneer 1's actual downlink frequency. Phase modulation encodes a simulated telemetry signal onto the carrier, just as the real spacecraft did at 64.8 bits per second.

**What it does:**
- Power it on with a 9V battery
- A stable 27.015 MHz crystal oscillator generates the reference frequency
- The x4 multiplier selects the 4th harmonic: 27.015 x 4 = 108.06 MHz
- A buffer amplifier brings the signal to ~1 mW (Part 15 compliant)
- An optional audio input applies phase modulation to the carrier
- A 69 cm wire antenna radiates the signal
- Receive and visualize it on a $25 RTL-SDR dongle

**What it teaches:** Every spacecraft ever launched carries a radio transmitter. This is the first one in the series. Pioneer 1 is the simplest -- a crystal oscillator with a frequency multiplier. By mission 50, you will have built a complete ground station.

**Total cost: ~$15-19** (excluding RTL-SDR receiver)

---

## Why 108 MHz?

Pioneer 1 transmitted at 108.06 MHz -- right at the top of the FM broadcast band (88-108 MHz). This was not arbitrary:

- **VHF propagation:** Frequencies in the 100 MHz range pass cleanly through Earth's ionosphere. Lower frequencies (HF, below ~30 MHz) bounce off the ionosphere -- great for shortwave radio, useless for space communication. Higher frequencies (microwaves) require more precise antenna pointing. VHF was the sweet spot for 1958 technology.
- **Antenna size:** A quarter-wave antenna at 108 MHz is about 69 cm -- small enough to fit on a spacecraft, large enough to be efficient. At 10 MHz the antenna would be 7.5 meters. At 1 GHz it would be 7.5 cm but would need microwave electronics that barely existed in 1958.
- **Receiver availability:** Ground stations could use modified FM radio receivers. The tracking stations at Cape Canaveral, Jodrell Bank (UK), and Hawaii used purpose-built receivers, but the frequency choice meant commercial VHF technology could be adapted.
- **Power budget:** 300 milliwatts at 108 MHz was achievable with 1958 transistor technology. The same power at higher frequencies would have required vacuum tubes (heavier, more power-hungry).

## Block Diagram

```
[27.015 MHz Crystal] --> [Colpitts Oscillator] --> [x4 Frequency Multiplier] --> [Buffer/Amplifier] --> [Antenna]
                                                          |                              |
                                                     108.06 MHz                      ~1 mW out
                                                     (4th harmonic)                  (Part 15)
                                                          |
                              [Audio/Telemetry Input] --> [Phase Modulation]
                                       |
                               [Potentiometer]
                              or [Audio Jack]
```

## Crystal Oscillator (Colpitts Configuration)

The heart of the transmitter. A 27.015 MHz crystal sets the reference frequency with quartz-crystal stability (~50 ppm). Pioneer 1 needed this stability so the ground stations could find and lock onto the signal across 113,854 km of space.

```
        +9V
         |
         R1 (10K) -- collector load
         |
         +-------+-------> RF Output (to multiplier)
         |       |
      [collector]|
         |    2N3904
      [base]  Q1
         |
         +---||---+
         |  XTAL  |
         | 27.015 |
         |  MHz   |
         +---||---+
         |        |
        C1       C2
       100pF    220pF    <-- Colpitts capacitive divider
         |        |
         +---+----+
             |
            GND

Bias network:
  R2 (47K) from +9V to base
  R3 (10K) from base to GND
  C3 (0.01uF) bypass cap, R1 to GND
  C4 (0.01uF) power supply decoupling, +9V to GND

The Colpitts topology uses the capacitive voltage divider
(C1/C2) for feedback. The crystal operates in its series
resonant mode, providing the frequency-selective element.

Output: ~50-100 mV p-p at 27.015 MHz
```

## Why Colpitts?

The Colpitts oscillator uses capacitors for the feedback network instead of inductors. Capacitors are cheaper, smaller, and more predictable than hand-wound coils at 27 MHz. The crystal does all the frequency-setting work -- the capacitors just provide the right phase shift for oscillation. This is why crystal oscillators are so stable: the quartz crystal's resonant frequency is determined by its physical dimensions, cut at the factory to parts-per-million accuracy. Temperature changes, supply voltage drift, component aging -- none of it matters much because the crystal dominates.

Pioneer 1's transmitter used this same principle. In space, temperature swings from -150C to +120C. A crystal oscillator holds frequency through all of it. An LC oscillator would drift so far that the ground station would lose the signal.

## x4 Frequency Multiplier

The multiplier extracts the 4th harmonic from the oscillator's output. Any non-linear amplifier stage produces harmonics. The trick is selecting ONLY the one you want.

```
        +9V
         |
         L1 (hand-wound, see below)
         |
         +--+--||--+-------> 108.06 MHz Output (to buffer)
         |  |  C6   |
      [collector]   C7
         |       trimmer
      2N3904     (5-20pF)
      Q2          |
      [base]     GND
         |
    C5 (10pF) -- coupling cap from oscillator output
         |
     27.015 MHz input
         |
      [emitter]
         |
         R4 (220R)
         |
        GND

L1: Tank inductor for 108 MHz selection
  - 4 turns of 22 AWG wire on a 5mm diameter form
  - Or 4 turns air-core, 5mm ID, turns spaced 1mm apart
  - Inductance: ~60 nH

C6 (fixed): 33pF -- sets approximate tank center frequency
C7 (trimmer): 5-20pF -- fine-tunes to exactly 108.06 MHz

Tank resonant frequency: f = 1 / (2pi * sqrt(L1 * C_total))
  With L1 = 60nH, C_total = 33pF || ~10pF (trimmer) ~ 7.7pF effective
  f = 1 / (2pi * sqrt(60e-9 * 7.7e-12)) = 234 MHz

  Correction -- with C6 and C7 in parallel:
  C_total = 33 + 10 = 43pF (trimmer at mid-range)
  f = 1 / (2pi * sqrt(60e-9 * 43e-12)) = 99 MHz

  Adjust C7 trimmer upward to hit 108 MHz.
  Actual tuning: wind L1, set C7 to minimum, sweep up until
  you see maximum signal at 108 MHz on RTL-SDR.

The transistor Q2 is biased into Class C (barely conducting).
R4 sets the emitter bias low enough that the transistor only
conducts on the positive peaks of the 27 MHz input. This
hard clipping generates strong harmonics: 54 MHz (2nd),
81 MHz (3rd), 108 MHz (4th), 135 MHz (5th)...

The LC tank (L1 + C6 + C7) resonates at 108 MHz, selecting
ONLY the 4th harmonic and rejecting all others.
```

## Winding the Coil

This is the one component you make yourself. It takes 30 seconds:

1. Find a 5mm drill bit or pen barrel as a winding form
2. Take 6 inches of solid 22 AWG hookup wire (strip the insulation or use magnet wire)
3. Wind exactly 4 turns tightly around the form
4. Slide the coil off the form
5. Spread the turns slightly (~1mm gap between each)
6. Solder the leads into the breadboard

The inductance depends on the number of turns, coil diameter, and spacing. 4 turns on a 5mm form gives approximately 50-70 nH -- close enough. The trimmer capacitor C7 compensates for any variation. This is how radio has been built since the 1920s: wind a coil, add a variable capacitor, tune until you hear the station.

## Buffer Amplifier

The buffer isolates the multiplier from the antenna and provides a small amount of gain. We deliberately keep the power LOW -- this is a Part 15 device, not a broadcasting station.

```
        +9V
         |
         R5 (470R) -- limits collector current and output power
         |
         +-------+-------> to antenna (via C9 coupling cap)
         |       |
      [collector]|
         |    2N3904
      [base]  Q3
         |
    C8 (10pF) -- coupling from multiplier output
         |
    108.06 MHz input
         |
      [emitter]
         |
         R6 (100R)
         |
         +
         |
        C10 (0.01uF) -- emitter bypass
         |
        GND

Bias:
  R7 (22K) from +9V to base
  R8 (4.7K) from base to GND

Output coupling:
  C9 (10pF) from collector to antenna

Output power: ~0.5-1 mW (well within Part 15 limits)
The 470R collector resistor is deliberately large to
limit the output power. Do NOT reduce R5 below 220R
unless you have an amateur radio license.
```

## Phase Modulation Input

Pioneer 1 used phase modulation (PM) to encode telemetry data at 64.8 bits per second onto the carrier. PM is closely related to FM -- in fact, PM of a carrier produces an FM signal whose deviation is proportional to the modulating frequency.

To simulate this, we inject a low-level audio signal into the oscillator's varactor-equivalent path:

```
Audio Input (3.5mm jack or potentiometer wiper)
     |
     R9 (100K) -- limits modulation depth
     |
     C11 (0.1uF) -- AC coupling
     |
     +---> connects to junction of C1 and C2 in oscillator
           (slightly pulls the crystal frequency, creating PM)

Alternative (simpler):
     Audio --> R9 (100K) --> base of Q1 (oscillator transistor)
     This varies the transistor's junction capacitance,
     which slightly shifts the oscillator frequency.

The modulation is very subtle -- a few hundred Hz of deviation
on a 27 MHz carrier, which becomes a few kHz of deviation after
the x4 multiplier. This is enough to see on an SDR waterfall
display as a slight widening of the carrier line.

For telemetry simulation: connect a 555 timer running at ~65 Hz
(close to Pioneer 1's 64.8 bps data rate) to the modulation
input. The SDR will show the carrier modulated with a square wave
-- Pioneer 1's actual telemetry signal looked very similar.
```

## Antenna

A quarter-wave monopole for 108 MHz:

```
Wavelength at 108 MHz: lambda = c / f = 3e8 / 108e6 = 2.78 meters
Quarter wave: lambda/4 = 0.694 meters ~ 69 cm

Cut a piece of solid hookup wire to 69 cm.
Solder one end to the C9 output coupling capacitor.
Run it vertically upward from the breadboard.

The breadboard ground plane acts as the counterpoise
(ground plane of the antenna). For better performance,
run 2-3 ground wires (69 cm each) horizontally away
from the base of the antenna along the table surface.

                    69 cm wire (vertical)
                         |
                         |
                         |
        C9 ----+---------+
               |
         [breadboard ground plane]
         ===========================
         --- ground wires (horizontal, 69 cm each) ---
```

At 1 mW with a quarter-wave antenna, the signal will be receivable within a few meters -- enough for bench testing with an RTL-SDR, far below any regulatory concern.

## Full Schematic

```
                                  +9V
                                   |
   +-------------------------------+----------------------------+------------------+
   |                               |                            |                  |
   R1(10K)                       R5(470R)                     R2(47K)            C4
   |                               |                            |              (0.01uF)
   +---> RF to multiplier          +--> C9(10pF) --> ANTENNA    |                  |
   |                               |                            |                 GND
[collector]                    [collector]                      |
   Q1 (2N3904)                  Q3 (2N3904)                     +----+
[base]                         [base]                                |
   |                               |                            [base]
   +---||---+                 C8(10pF)                           Q1
   | XTAL   |                     |                                |
   | 27.015 |              108 MHz from multiplier                 R3(10K)
   |  MHz   |                                                      |
   +---||---+          x4 MULTIPLIER:                             GND
   |        |                 +9V
  C1       C2                  |
 100pF   220pF               L1 (4T, 5mm, hand-wound)
   |        |                  |
   +---+----+                  +--+--||--+
       |                       |  | C6   |
      GND                  [collector]  C7 trimmer
                               |      (5-20pF)
                            Q2 (2N3904)  |
                            [base]      GND
                               |
                          C5 (10pF)
                               |
                        27 MHz from Q1
                               |
                          [emitter]
                               |
                            R4 (220R)
                               |
                              GND

MODULATION INPUT (optional):
  Audio Jack --> R9(100K) --> C11(0.1uF) --> base of Q1
```

## Parts List

| Part | Value | Qty | Cost |
|------|-------|-----|------|
| 2N3904 NPN transistor | - | 3 | $0.30 |
| 27.015 MHz crystal (HC-49/S) | - | 1 | $1.50 |
| Trimmer capacitor | 5-20pF | 1 | $0.60 |
| Capacitor 10pF ceramic | - | 3 | $0.15 |
| Capacitor 33pF ceramic | - | 1 | $0.05 |
| Capacitor 100pF ceramic | - | 1 | $0.05 |
| Capacitor 220pF ceramic | - | 1 | $0.05 |
| Capacitor 0.01uF ceramic | - | 2 | $0.10 |
| Capacitor 0.1uF ceramic | - | 1 | $0.05 |
| Resistor 100R | 1/4W | 1 | $0.05 |
| Resistor 220R | 1/4W | 1 | $0.05 |
| Resistor 470R | 1/4W | 1 | $0.05 |
| Resistor 4.7K | 1/4W | 1 | $0.05 |
| Resistor 10K | 1/4W | 2 | $0.10 |
| Resistor 22K | 1/4W | 1 | $0.05 |
| Resistor 47K | 1/4W | 1 | $0.05 |
| Resistor 100K | 1/4W | 1 | $0.05 |
| 22 AWG solid hookup wire | ~6 inches for coil | 1 | $0.10 |
| Wire for antenna | ~69 cm | 1 | $0.10 |
| 9V battery snap | - | 1 | $0.20 |
| 9V battery | - | 1 | $3.00 |
| Breadboard (half-size) | - | 1 | $3.50 |
| Jumper wire kit | - | 1 | $2.50 |
| 3.5mm audio jack (optional, for modulation) | - | 1 | $0.50 |
| 10K potentiometer (optional, for modulation) | - | 1 | $0.80 |
| **Total** | | | **~$14 (basic) / ~$19 (with modulation)** |

## Build Instructions

1. **Build the crystal oscillator.** Wire Q1 in the Colpitts configuration with the 27.015 MHz crystal. Power it up. If you have an oscilloscope, verify a clean 27 MHz sine wave at the collector. If you don't have a scope, proceed -- you'll verify with the RTL-SDR later. The oscillator should draw about 5-10 mA from the 9V battery.

2. **Build the frequency multiplier.** Wire Q2 with the hand-wound coil L1 and the tuning capacitors C6 and C7. Feed the oscillator output through C5 to Q2's base. At this point you have 108 MHz at the collector of Q2, but it's mixed with other harmonics. The tank circuit selects 108 MHz. Leave C7 at mid-range for now.

3. **Build the buffer amplifier.** Wire Q3 with R5 (470R) as the collector load. Couple the multiplier output through C8. Connect the antenna wire to C9.

4. **Power it all up.** Connect the 9V battery. The total current draw should be 15-25 mA. If it's over 50 mA, something is wrong -- check for shorts.

5. **Tune with the RTL-SDR.** This is the moment of truth:
   - Plug in your RTL-SDR dongle
   - Open GQRX (Linux) or SDR# (Windows) or CubicSDR (any platform)
   - Tune to 108.00 MHz, set bandwidth to 1 MHz
   - Set the RTL-SDR gain to maximum
   - Place the RTL-SDR antenna within 1 meter of your circuit
   - Look for a spike on the spectrum display near 108 MHz
   - Slowly adjust trimmer C7 until the spike is at exactly 108.06 MHz
   - You are now looking at the same frequency Pioneer 1 transmitted on

6. **Add modulation (optional).** Connect an audio source to the modulation input. Watch the SDR waterfall display -- you'll see the carrier line widen as the phase modulation shifts the frequency slightly. Connect a 555 timer at ~65 Hz for an authentic Pioneer 1 telemetry simulation.

## Verifying with an RTL-SDR

The RTL-SDR (RealTek Software Defined Radio) is a $25 USB dongle originally designed for DVB-T television reception. It covers 24 MHz to 1.7 GHz -- which includes our 108 MHz signal and every NASA frequency up through S-band. One dongle, $25, and you have a ground station receiver for the entire circuit series.

**Setup:**
- **Hardware:** RTL-SDR Blog V3 or V4 dongle ($25-35), with the included telescopic antenna
- **Linux:** `sudo apt install gqrx-sdr` or `sudo apt install cubicsdr`
- **Windows:** Download SDR# from airspy.com (free)
- **macOS:** CubicSDR from cubicsdr.com (free)

**What you'll see:**
- **Spectrum view:** A sharp spike at 108.06 MHz rising above the noise floor. This is your carrier. The sharpness of the spike tells you how stable your crystal oscillator is -- a good crystal produces a needle-thin line.
- **Waterfall view:** A bright vertical line at 108.06 MHz. When you add modulation, the line widens and you can see the modulation sidebands. With a 65 Hz square wave, you'll see symmetric sidebands spaced 65 Hz apart from the carrier.
- **Audio (FM demodulation):** If you set the SDR to FM demodulation mode, you can actually HEAR the modulation tone through your computer speakers. You're hearing data that traveled from your breadboard transmitter through free space to the SDR antenna -- the same physics that carried Pioneer 1's telemetry across 113,854 km.

**Range test:** Walk the RTL-SDR antenna away from the transmitter. At 1 mW, you should receive a clean signal at 1-3 meters, a weak signal at 5-10 meters, and lose it at 15-20 meters (indoors, with walls). This is Part 15 compliant territory.

## Link Budget: Pioneer 1 vs. Your Bench

Pioneer 1 transmitted 300 mW across 113,854 km. Your circuit transmits ~1 mW across 3 meters. Same physics, different scale. Here's the math:

**Free-space path loss:**
```
FSPL (dB) = 20*log10(d) + 20*log10(f) + 20*log10(4*pi/c)

Pioneer 1:
  d = 113,854 km = 1.139 x 10^8 m
  f = 108.06 MHz = 1.0806 x 10^8 Hz
  FSPL = 20*log10(1.139e8) + 20*log10(1.0806e8) + 20*log10(4*pi/3e8)
       = 161.1 + 160.7 + (-29.5)
       = 192.3 dB

Your bench:
  d = 3 m
  f = 108.06 MHz = 1.0806 x 10^8 Hz
  FSPL = 20*log10(3) + 20*log10(1.0806e8) + 20*log10(4*pi/3e8)
       = 9.5 + 160.7 + (-29.5)
       = 140.7 dB

Difference: 192.3 - 140.7 = 51.6 dB
```

Pioneer 1's signal was 51.6 dB weaker at the receiver than your bench signal at 3 meters. That's a factor of about 145,000 in power. How did they receive it?

- **Transmitter power:** Pioneer had 300 mW (24.8 dBm) vs. your 1 mW (0 dBm). That's +24.8 dB.
- **Antenna gain:** The ground stations used large dish antennas with ~20-30 dBi gain. Your RTL-SDR antenna has ~2 dBi. That's another +20 to +28 dB.
- **Receiver sensitivity:** Professional tracking receivers had sensitivity around -140 dBm. Your RTL-SDR can hear down to about -100 dBm. That's +40 dB advantage for the ground station.

Total advantage of Pioneer's ground stations: ~85-93 dB. More than enough to overcome the 51.6 dB extra path loss. The signal at the ground station was weak but receivable. This is what link budget engineering is -- making the numbers add up before you launch.

See `mathematics.md` in this mission folder for more on the inverse-square law and how signal strength falls off with distance.

## What You Learn

- **Crystal oscillators and frequency stability** -- why spacecraft need quartz-referenced transmitters. An LC oscillator drifts. A crystal holds. When your signal has traveled 113,854 km, the ground station needs to know EXACTLY where to look. Crystal stability is the difference between communication and silence.
- **Harmonic generation and frequency multiplication** -- the most elegant trick in RF engineering. You don't build a 108 MHz oscillator (hard to stabilize). You build a rock-solid 27 MHz oscillator (easy, because 27 MHz crystals are commodity parts) and multiply. Every harmonic is a perfect integer multiple. The math is free. Pioneer 1's engineers knew this. So did every ham radio operator in the 1950s.
- **Phase modulation vs. FM vs. AM** -- Pioneer 1 used PM, not FM or AM. PM encodes data in the phase angle of the carrier. FM encodes in the frequency. AM encodes in the amplitude. PM and FM are closely related (PM of a sine wave produces FM). AM is fragile -- any noise adds directly to the signal. PM/FM are more robust because the information is in the timing, not the amplitude. This is why every spacecraft after Pioneer used phase or frequency modulation.
- **The inverse-square law at RF frequencies** -- signal power falls as 1/r^2. Double the distance, quarter the power. Pioneer 1 at 113,854 km received (300 mW / (4*pi*(1.139e8)^2)) per square meter of antenna -- about 1.8 x 10^-21 watts per square meter. That's 18 zeptowatts. The fact that this was detectable is one of the great engineering achievements of the 20th century.
- **Link budgets** -- the single most important calculation in space communication. Before you launch, you add up every gain and subtract every loss: transmitter power + antenna gains - path loss - atmospheric loss - pointing loss - receiver noise. If the number is positive, you have a link. If it's negative, you have silence. Every NASA mission starts with this calculation.
- **Hand-wound inductors** -- you will wind a coil and it will work. This connects you to 100 years of radio history. Marconi wound coils. Armstrong wound coils. Every ham radio operator since 1920 has wound coils. The physics doesn't care if the coil was wound by a machine or by your fingers. 4 turns, 5mm diameter, 108 MHz. That's all it takes.
- **FCC Part 15 and the regulatory framework** -- why power levels matter, why you can't just broadcast at any power you want, and why the electromagnetic spectrum is a shared public resource that requires coordination.

## The Progressive Radio Series

Every NASA mission carried a radio transmitter. This series builds progressively more sophisticated radio circuits as the missions advance:

| Mission | Frequency | Technique | What You Build |
|---------|-----------|-----------|----------------|
| **v1.2 Pioneer 1** | 108.06 MHz (VHF) | Crystal osc + x4 multiplier + PM | **This circuit** |
| Future: Explorer series | ~108 MHz | Improved telemetry encoding | Enhanced modulator stages |
| Future: Ranger series | ~960 MHz (UHF) | Higher frequency, more data | UHF upconversion |
| Future: Mariner series | 2.3 GHz (S-band) | DSSS, coherent transponder | S-band frequency synthesis |
| Future: Voyager class | 2.3 / 8.4 GHz (S/X) | Dual-band, PLL | Phase-locked loop synthesizer |
| Future: Deep space | Multiple bands | Digital modulation, FEC | Complete ground station |

By the time you reach mission 50, the accumulated circuits form a complete ground station: transmitter, receiver, antenna, tracking, demodulation, and data decoding. Each mission adds one new concept. The progression mirrors the actual history of space communication technology.

## Safety and Legal Notes

**FCC Part 15 Compliance:**
- This circuit is designed to operate well within FCC Part 15 limits (< 200 uV/m at 3 meters)
- At ~1 mW output power with a quarter-wave antenna, field strength at 3 meters is approximately 50-100 uV/m
- No license required for operation at these power levels
- Do NOT reduce R5 (470R) or add amplifier stages without understanding the regulatory implications

**108 MHz and the FM Broadcast Band:**
- 108 MHz is at the very top edge of the FM broadcast band (88-108 MHz)
- This circuit is NOT for broadcasting music, voice, or entertainment content
- FM broadcast requires an FCC license regardless of power level
- This is an educational/experimental device that transmits an unmodulated carrier or simple telemetry tones

**For Higher Power Experiments:**
- An amateur radio (ham) license allows operation at much higher power levels on designated frequencies
- The Technician class license covers VHF/UHF and is an excellent next step
- Amateur radio operators were instrumental in early satellite tracking (Project Moonwatch, OSCAR satellites)
- See arrl.org for licensing information

**General Safety:**
- 9V battery operation -- no shock hazard
- No high voltages in this circuit
- The RF output is far below any biological exposure concern
- Keep the circuit away from sensitive medical devices as a precaution

## Fox Companies Connection

Fourth circuit in the NASA kit series. This is the first RADIO circuit -- the previous three (v1.1 countdown timer, v1.1 launch sound generator, v1.2 LED radiation profile, v1.2 radiation counter) were all self-contained audio or visual circuits. This one reaches out through space. The signal leaves the breadboard, travels through air, and arrives at a separate receiver. That's communication. That's what spacecraft do.

The RTL-SDR dongle is the gateway drug. Once someone sees their own signal on a spectrum analyzer, they understand radio in a way that no textbook can teach. The $25 RTL-SDR becomes the test instrument for every subsequent radio circuit in the series. One purchase, dozens of experiments.

Workshop model: Transmitter kit ($15) + RTL-SDR dongle ($25) = $40 per participant. Each participant builds their own transmitter and verifies it on a shared SDR display projected on the wall. Twenty participants transmitting simultaneously on slightly different frequencies (swap crystals: 27.000, 27.015, 27.030...) creates a visible spectrum display that looks like a star field. Each dot is someone's circuit, working. That's a room full of Pioneer 1s, all talking at once.
