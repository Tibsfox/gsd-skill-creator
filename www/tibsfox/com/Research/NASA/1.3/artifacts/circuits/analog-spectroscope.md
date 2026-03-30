# DIY Analog Circuit: Simple Spectroscope

## The Circuit

An electronic spectroscope that scans across the visible light spectrum using a diffraction grating, a white LED light source, and a phototransistor detector. The output is a voltage proportional to light intensity at each angular position — sweep the sensor and you see the spectrum as a changing voltage on a multimeter or oscilloscope. Connects directly to Robert Bunsen and Gustav Kirchhoff's foundational work in spectroscopy (1859): every element emits light at characteristic wavelengths.

**What it does:**
- A white LED illuminates a sample (or just shines into the diffraction grating)
- The diffraction grating separates light into its component wavelengths
- A phototransistor on a pivoting arm sweeps across the dispersed spectrum
- A transimpedance amplifier converts the phototransistor current to voltage
- Read the output on a multimeter, oscilloscope, or Arduino ADC
- Different light sources produce different spectral patterns:
  - White LED: broad blue peak + yellow phosphor hump
  - Sodium lamp: bright yellow doublet (589 nm — the same line Bunsen saw)
  - Red LED: narrow peak around 630 nm
  - Candle flame: broad blackbody curve with sodium yellow line from the wax

**Total cost: ~$15-18**

---

## How a Spectroscope Works

When light passes through a diffraction grating (a surface with thousands of closely-spaced parallel grooves), each wavelength diffracts at a different angle. Red light bends more than blue because its wavelength is longer. The result: a fan of colors spread out in space, just like a prism but with more uniform angular dispersion.

Bunsen and Kirchhoff's genius was to realize that the pattern of bright lines in a heated element's emission spectrum was unique — a fingerprint. Sodium always shows two bright yellow lines at 589.0 and 589.6 nm. Hydrogen shows red (656 nm), blue-green (486 nm), violet (434 nm), and deep violet (410 nm). These patterns are invariant — they don't change with temperature, pressure, or the amount of material. They are quantum mechanical signatures of the electron energy levels in each atom.

This circuit turns that principle into a measurable electrical signal.

## Block Diagram

```
[White LED] --> [Sample/Slit] --> [Diffraction Grating] --> [Phototransistor on pivot]
                                                                      |
                                                              [Transimpedance Amp]
                                                                      |
                                                              [Output Voltage]
                                                                      |
                                                     [Multimeter / Scope / Arduino]
```

## Optical Setup

```
             Slit         Grating        Detector arm
              ||           |||||||         /
  [LED] ---> || --------> ||||||||| ---->/----[phototransistor]
              ||           |||||||     /  |
              ||                    /     |
              ||                 /        pivot
              ||              /
              ||           /  <-- different wavelengths at different angles
              ||
         (razor blade
          or cardboard
          ~1mm gap)

The slit creates a narrow line source of light.
The grating disperses each wavelength to a different angle.
The phototransistor on a pivoting arm can be swept through
the dispersed spectrum to measure intensity vs. angle.

Grating: 1000 lines/mm diffraction grating film
  (available as ~$3 sheets, or salvage from a DVD)
  Angular dispersion: sin(theta) = m * lambda / d
  For m=1, d=1um:
    400nm (violet): theta = 23.6 degrees
    550nm (green):  theta = 33.4 degrees
    700nm (red):    theta = 44.4 degrees
  Total angular spread: ~21 degrees for the visible spectrum
```

## Phototransistor Detector Circuit

```
        +9V
         |
         R1 (10K) — load resistor (sets sensitivity)
         |
         +---------> Output to amplifier
         |
    [collector]
         |
    phototransistor (e.g., TEPT5700, BPW17N, or any NPN photo)
         |
    [emitter]
         |
        GND

Light falling on the phototransistor base generates current
proportional to intensity. The 10K load resistor converts
this to a voltage: V_out = 9V - (I_photo * 10K).

Brighter light → more current → lower V_out.
(Invert in the amplifier stage if desired.)

For higher sensitivity: increase R1 to 100K.
For wider dynamic range: decrease R1 to 1K.
```

## Transimpedance Amplifier (optional, improves signal)

```
              +9V
               |
          +----+----+
          |  LM358  |  (one half of dual op-amp)
          |         |
Pin(+) -->|+ IN  OUT|--+-------> Spectral Output (0-5V)
          |         |  |
Pin(-) -->|- IN     |  R_f (100K — feedback resistor)
          |         |  |
          +----+----+  |
               |       +--- back to Pin(-)
              GND

Pin(+): connected to voltage divider (4.5V reference)
Pin(-): connected to phototransistor collector

The op-amp converts phototransistor current to a voltage
with gain set by R_f. Output swings from ~0.5V (dark)
to ~4.5V (bright) — suitable for Arduino ADC input.

C_f (10pF) across R_f for stability (reduces oscillation
from stray capacitance in the phototransistor).
```

## Building the Slit

The slit is critical for spectral resolution. A wider slit gives more light but blurs the spectral lines together. A narrower slit gives sharper lines but less signal.

```
Materials: two single-edge razor blades (or two pieces of aluminum foil
on cardboard) mounted with a ~0.5-1mm gap between their edges.

Mount the slit vertically on the breadboard using tape, hot glue,
or a small binder clip standing upright. The slit should be:
  - Vertical (parallel to the grating grooves)
  - ~0.5-1mm wide (start at 1mm, narrow to 0.5mm for better resolution)
  - ~10mm tall (gives enough signal without complicating alignment)
  - 5-10 cm from the LED source
  - 5-10 cm from the diffraction grating
```

## Building the Pivot Arm

```
Materials: a stiff piece of cardboard or a popsicle stick,
a pushpin or thumbtack (pivot point), and tape.

        [phototransistor taped to end]
         |
         |  <-- cardboard arm (~15 cm long)
         |
    [pivot pin into breadboard or cardboard base]
         |
         |  (wires from phototransistor run along the arm)
         |
    [connects to detector circuit on breadboard]

Sweep the arm slowly through the spectrum.
As the phototransistor passes through each color band,
the output voltage changes.

Manual sweep: just rotate the arm by hand and read the
voltage on a multimeter. Cheap, effective, no Arduino needed.

Automated sweep (upgrade): attach a servo motor to the pivot,
sweep with Arduino, plot voltage vs. angle with Serial Plotter.
```

## Using a DVD as a Diffraction Grating

If you don't have a dedicated grating film:

```
1. Take a recordable DVD (DVD-R)
2. Carefully separate the two layers (pry apart the edge)
3. The data layer has ~1350 lines/mm (track pitch = 740 nm)
4. Cut a ~2x2 cm piece
5. Mount it in the optical path where the grating goes
6. It works nearly as well as a commercial grating

CD-R also works but has coarser spacing (~625 lines/mm,
track pitch = 1600 nm), giving less angular dispersion.
DVD-R is better for this application.
```

## What to Observe

With the circuit built and working, try these light sources:

| Light Source | What You See | Bunsen Connection |
|---|---|---|
| White LED | Broad hump (blue peak + yellow phosphor) | Continuous spectrum (like heated solid) |
| Red LED | Narrow peak at ~630 nm | Demonstrates discrete emission |
| Candle flame | Broad blackbody + faint sodium yellow | Bunsen saw this; his burner's cleaner flame revealed more |
| Sodium lamp (streetlight) | Sharp yellow doublet at 589 nm | THE line Bunsen used to demonstrate spectroscopy |
| Fluorescent tube | Mercury lines (sharp) + phosphor (broad) | Multiple emission lines from mercury vapor |
| Sunlight (indirect!) | Continuous rainbow with dark Fraunhofer lines | Kirchhoff explained these as absorption by solar atmosphere |

**Safety: NEVER look at the sun through the spectroscope. Use indirect reflected sunlight only.**

## Parts List

| Part | Value | Qty | Cost |
|------|-------|-----|------|
| Phototransistor (TEPT5700 or similar) | NPN | 1 | $0.80 |
| White LED (5mm, high brightness) | - | 1 | $0.30 |
| LM358 dual op-amp | - | 1 | $0.50 |
| Diffraction grating film (1000 lines/mm) | ~2x2 cm piece | 1 | $3.00 |
| Resistor 10K | 1/4W | 2 | $0.10 |
| Resistor 100K | 1/4W | 1 | $0.05 |
| Resistor 220R (LED current limit) | 1/4W | 1 | $0.05 |
| Capacitor 10pF ceramic | - | 1 | $0.05 |
| Capacitor 0.1uF ceramic (power bypass) | - | 1 | $0.05 |
| Single-edge razor blades (slit) | - | 2 | $1.00 |
| Popsicle stick or cardboard (pivot arm) | - | 1 | $0.10 |
| Pushpin (pivot) | - | 1 | $0.05 |
| 9V battery snap | - | 1 | $0.20 |
| 9V battery | - | 1 | $3.00 |
| Breadboard (half-size) | - | 1 | $3.50 |
| Jumper wire kit | - | 1 | $2.50 |
| **Total** | | | **~$15.25** |
| **With DVD grating instead of film** | | | **~$12.25** |

## Build Instructions

1. **Build the LED source.** Wire a white LED with a 220R current-limiting resistor to 9V. Aim it at the slit. The LED should produce a bright, even spot of light on the slit opening.

2. **Build the slit.** Mount two razor blades with a ~1mm gap. Position the slit 5-10 cm from the LED. Look through the slit — you should see a narrow vertical line of white light.

3. **Mount the diffraction grating.** Position it 5-10 cm beyond the slit, parallel to the slit. Look through the grating at the slit from the detector side — you should see a rainbow spectrum fanning out to the sides.

4. **Build the phototransistor detector.** Wire it with the 10K load resistor to 9V. Connect a multimeter to the output. Expose the phototransistor to light — voltage should change. Cover it — voltage returns to ~9V.

5. **Mount the detector on the pivot arm.** Tape the phototransistor to the end of the cardboard arm. Set the pivot pin aligned with the grating. Route the wires along the arm to the breadboard.

6. **Sweep the spectrum.** Slowly rotate the pivot arm through the dispersed spectrum. Watch the multimeter voltage change as the detector passes through violet, blue, green, yellow, orange, red. Each color band produces a different voltage level. You are seeing Bunsen's spectral lines as electrical measurements.

7. **Try different sources.** Replace the white LED with different light sources. A candle gives a broad spectrum with a sodium line. A red LED gives a narrow peak. Each source has its own signature.

## What You Learn

- **Spectroscopy fundamentals** — the same science Bunsen and Kirchhoff invented in 1859 with a prism and a gas flame. Every element has a unique spectral fingerprint. This is how we know what stars are made of without visiting them.
- **Diffraction gratings** — how periodic structures separate light by wavelength. The math: sin(theta) = m * lambda / d. Same principle used in fiber optic wavelength division multiplexing, laser tuning, and astronomical spectrographs.
- **Photodetector circuits** — converting light to electricity. The phototransistor is the simplest optical sensor. Every digital camera, every optical fiber receiver, every barcode scanner uses a variant of this circuit.
- **Transimpedance amplifiers** — converting current to voltage, the fundamental building block of every sensor interface. The op-amp circuit here is the same topology used in photodiode amplifiers on billion-dollar telescopes.
- **The Bunsen connection** — Bunsen's burner was "just" a cleaner flame. But that cleaner flame let him see spectral lines that soot had been obscuring. The simple tool enabled the foundational science. Salal is "just" a shrub. But it feeds the whole understory. Simple, ubiquitous, essential.

## Fox Companies Connection

Sixth circuit in the NASA kit series. This is the first OPTICAL circuit — the previous five were all electronic (timing, audio, LED display, radio). The spectroscope bridges electronics and optics, preparing for the imaging and sensor circuits that later missions will require. Pairs thematically with the Bunsen dedication: the circuit recreates Bunsen's experiment using commodity electronics. Workshop model: $15 per participant, no specialized equipment needed. A darkened room, ten different light sources on a table, ten spectroscopes scanning them. Each participant discovers that light has structure — that the smooth rainbow hides sharp lines of elemental identity. That discovery never gets old. Bunsen made it in 1859. Your workshop makes it today.
