# LED Electronics Fundamentals

An LED (Light-Emitting Diode) is a semiconductor device that converts electrical energy directly into photons. Understanding the physics behind this conversion -- and the electrical characteristics that follow from it -- is the foundation for every project in this series.

---

## Semiconductor Physics of Light Emission

### The P-N Junction

An LED is built from a **p-n junction** -- the boundary between two regions of semiconductor material doped with different impurities. The **p-type** side has excess holes (positive charge carriers), while the **n-type** side has excess electrons.

When a forward voltage is applied across the junction:

1. Electrons from the n-side are pushed toward the junction
2. Holes from the p-side are pushed toward the junction
3. At the junction, electrons and holes **recombine**
4. Each recombination event releases energy as a **photon**

The energy of the emitted photon is determined by the **bandgap** of the semiconductor material. This is the key insight: the color of the LED is determined by the chemistry of the semiconductor, not by any filter or coating.

### Bandgap Energy and Photon Wavelength

The relationship between bandgap energy and emitted wavelength follows Planck's equation:

```
E = h * c / lambda

Where:
  E      = bandgap energy (eV)
  h      = Planck's constant (6.626 x 10^-34 J*s)
  c      = speed of light (3 x 10^8 m/s)
  lambda = wavelength (nm)

Simplified:  lambda (nm) = 1240 / E (eV)
```

A larger bandgap means a shorter wavelength (bluer light) and requires a higher forward voltage. This is why blue and white LEDs need ~3.0-3.8V while red LEDs only need ~1.8-2.2V.

### Semiconductor Materials by Color

| Color | Wavelength (nm) | Bandgap (eV) | Semiconductor Material | Typical Vf |
|-------|-----------------|---------------|----------------------|------------|
| Infrared | 850-940 | 1.3-1.5 | GaAs | 1.2-1.5V |
| Red | 620-635 | 1.9-2.0 | AlGaInP | 1.8-2.2V |
| Orange | 600-620 | 2.0-2.1 | GaAsP | 1.9-2.2V |
| Yellow | 585-600 | 2.1-2.2 | GaAsP | 2.0-2.2V |
| Green | 520-535 | 2.2-2.5 | InGaN | 2.8-3.5V |
| Blue | 460-475 | 2.6-2.8 | InGaN | 3.0-3.8V |
| White | Broad spectrum | N/A (phosphor) | InGaN + YAG phosphor | 3.0-3.6V |
| UV | 365-405 | 3.1-3.4 | InGaN / AlGaN | 3.2-4.0V |

Notice the split: **red/orange/yellow** LEDs use **GaAsP** (Gallium Arsenide Phosphide) or **AlGaInP** alloys with forward voltages of 1.8-2.2V. **Green/blue/white/UV** LEDs use **InGaN** (Indium Gallium Nitride) with forward voltages of 3.0-3.8V. This is one of the most important practical facts in LED electronics -- the forward voltage depends on the color.

> **SAFETY WARNING:** UV LEDs (especially UVC at 200-280nm) emit radiation that can cause eye damage and skin burns. Always use appropriate shielding and never look directly at a UV LED in operation.

### White LEDs: Phosphor Conversion

White LEDs do not exist as a single-bandgap device. The most common approach is:

1. A **blue InGaN** die emits at ~450-460nm
2. A **YAG phosphor** (cerium-doped yttrium aluminum garnet) coating absorbs some blue photons
3. The phosphor re-emits at a broad yellow-green spectrum (~550-650nm)
4. The combination of direct blue + phosphor yellow appears white to human eyes

The color temperature (warm white ~2700K vs cool white ~6500K) is controlled by the phosphor blend. Some high-CRI white LEDs use multiple phosphors to fill in the red spectrum gap.

---

## The I-V Curve: Why LEDs Are Not Resistors

The single most important concept in LED electronics is the **exponential I-V curve**. Unlike a resistor (which has a linear relationship between voltage and current), an LED follows the Shockley diode equation:

```
I = Is * (e^(V / (n*Vt)) - 1)

Where:
  Is = reverse saturation current (~10^-20 A for LEDs)
  n  = ideality factor (1.5-2.0 for LEDs)
  Vt = thermal voltage (kT/q ~ 26mV at 25C)
```

What this means in practice:

- Below the forward voltage threshold, essentially **zero current** flows
- At the forward voltage, current begins to flow
- A **tiny increase** in voltage above Vf causes a **massive increase** in current
- A 0.1V increase above the knee can double or triple the current

This exponential behavior is why you cannot simply connect an LED to a voltage source. Even small voltage variations would cause wildly unpredictable current. This is why **current limiting** is essential -- either through a [resistor](m1-resistor-calculations.md) or a [constant-current driver](m1-current-drivers.md).

### Reading an LED Datasheet

Key parameters from a typical LED datasheet:

| Parameter | Symbol | Typical 5mm Red | Typical 5mm Blue | Unit |
|-----------|--------|-----------------|------------------|------|
| Forward Voltage | Vf | 2.0 (1.8-2.2) | 3.2 (3.0-3.6) | V |
| Forward Current (max) | If | 20 | 20 | mA |
| Reverse Voltage (max) | Vr | 5 | 5 | V |
| Luminous Intensity | Iv | 3000-8000 | 2000-5000 | mcd |
| Viewing Angle | 2*theta | 20-30 | 20-30 | degrees |
| Power Dissipation | Pd | 75 | 100 | mW |

**Industry practice:** Operate indicator LEDs at 50-70% of their rated maximum current (10-14mA instead of 20mA). This dramatically increases lifespan with minimal brightness reduction due to the logarithmic relationship between current and perceived brightness.

---

## LED Package Types

### Through-Hole (5mm, 3mm)

The classic indicator LED. Two leads -- the longer one is the anode (+), the shorter is the cathode (-). There is also a flat edge on the cathode side of the plastic lens. These are still widely used for panel indicators and hobbyist projects.

```
     ___
    /   \       Anode (+) = longer lead
   |  o  |      Cathode (-) = shorter lead, flat edge
   |     |
    \___/
    | | |       Internal structure:
    | | |         - Bond wire from top (anode post)
    | | |         - Die sits in reflector cup (cathode post)
    |   |
  Anode Cathode
  (long) (short)
```

Typical specs: 20mA max, 1.8-3.6V Vf depending on color, 20-30 degree viewing angle for standard, 100-120 degrees for diffused.

### SMD Packages (5050, 2835, 3528)

Surface-mount LEDs are the standard for LED strips, commercial lighting, and compact designs.

| Package | Size (mm) | Typical Use | LEDs/Chip | Power |
|---------|-----------|-------------|-----------|-------|
| 2835 | 2.8 x 3.5 | White strips, commercial | 1 | 0.2-1W |
| 3528 | 3.5 x 2.8 | Basic strips | 1 | 0.06-0.1W |
| 5050 | 5.0 x 5.0 | RGB strips, high brightness | 3 (R+G+B) | 0.2W per chip |
| 5630 | 5.6 x 3.0 | High-output white | 1 | 0.5W |

The **5050** package is the most common RGB LED. It contains three separate dies (red, green, blue) with independent connections, allowing any color to be mixed. A 5050 RGB strip at full white (all three channels on) draws approximately **14.4W per meter** at 12V (1.2A/m). A full 5-meter reel at maximum white output requires **60-72W** of power supply capacity.

### High-Power LEDs (1W, 3W, 10W+)

High-power LEDs operate at much higher currents: **350mA** (1W class), **700mA** (3W class), and **1A+** for larger packages. These require:

- **Active thermal management** -- heatsinks, sometimes fans (see [Thermal Management](m1-thermal-management.md))
- **Constant-current drivers** -- resistors waste too much power at these levels (see [Current Drivers](m1-current-drivers.md))
- **Optical lenses** -- to focus the emitted light into useful beam patterns

Popular high-power LED brands include Cree (XP-E2, XP-L), Lumileds (LUXEON), and Seoul Semiconductor (SSC).

> **SAFETY WARNING:** High-power LEDs (1W and above) and blue/royal-blue LEDs emit intense light that can cause retinal damage. Never stare directly into an illuminated high-power LED, even briefly. Blue-rich light (450-490nm) is particularly hazardous because the cornea and lens do not filter it, allowing it to reach and damage the retina. Always use appropriate diffusers or optics, and wear protective eyewear when testing bare high-power LED modules on the bench.

### COB (Chip-on-Board)

COB LEDs mount many small dies directly onto a substrate in a dense array, covered with a single phosphor layer. This produces a uniform light source with very high lumen density, commonly used in track lighting, downlights, and photography lighting. Typical COB modules range from 10W to 100W+.

---

## Series and Parallel LED Configurations

### Series Strings

LEDs in series share the same current. The total voltage required is the sum of all forward voltages:

```
        R
  Vs ---/\/\/--- LED1 --- LED2 --- LED3 --- GND
                 2.0V     2.0V     2.0V

  Total Vf = 3 x 2.0V = 6.0V
  Required Vs > 6.0V (plus headroom for resistor/driver)
```

Advantages: All LEDs guaranteed to carry the same current (they are in the same loop). No current matching needed.

Limitation: Total forward voltage must be less than the supply voltage. For 12V supply with red LEDs (2.0V each), maximum 5 LEDs in series. For blue LEDs (3.2V each), maximum 3 in series.

### Parallel Branches

When more LEDs are needed than can fit in a series string, use parallel branches -- but **each branch must have its own current-limiting resistor**:

```
         R1
  Vs ---/\/\/--- LED1a --- LED1b --- GND
    |    R2
    +---/\/\/--- LED2a --- LED2b --- GND
    |    R3
    +---/\/\/--- LED3a --- LED3b --- GND
```

> **SAFETY WARNING:** Never connect LEDs in parallel without individual current-limiting resistors. Manufacturing variations in forward voltage (even LEDs from the same batch can vary by 0.1-0.2V) will cause current to hog through the LED with the lowest Vf, potentially destroying it and then cascading to the next lowest.

For detailed calculations on resistor values for both configurations, see [Resistor Calculations](m1-resistor-calculations.md).

---

## Practical LED Specifications

### Common LED Strip Specifications

| Strip Type | Voltage | LEDs/m | Power/m | Lumens/m | Use Case |
|-----------|---------|--------|---------|----------|----------|
| 3528 White | 12V | 60 | 4.8W | 300-400 | Accent lighting |
| 5050 RGB | 12V | 30 | 7.2W | 150-200 | Color effects |
| 5050 RGB | 12V | 60 | 14.4W | 300-400 | Full color wash |
| 2835 White | 24V | 120 | 9.6W | 800-1000 | Task lighting |
| WS2812B | 5V | 30 | 9W | 200-300 | Addressable effects |
| WS2812B | 5V | 60 | 18W | 400-600 | Dense addressable |
| APA102 | 5V | 60 | 18W | 400-600 | High-speed addressable |

For addressable LED protocols (WS2812B, APA102), see [WS2812B Protocol](m3-ws2812b-protocol.md) and [APA102 SPI](m3-apa102-spi.md).

### Power Supply Sizing

Always size power supplies at **120% of the calculated maximum load**:

```
Example: 5m of 5050 RGB strip at 60 LEDs/m
  Power = 5m x 14.4W/m = 72W
  PSU = 72W x 1.2 = 86.4W
  Select: 100W 12V power supply (8.33A)
```

See [Current Drivers & Strip Power](m1-current-drivers.md) for detailed power supply selection.

---

## LED Failure Modes

Understanding how LEDs fail helps you design systems that last:

1. **Thermal runaway** -- As temperature rises, LED resistance decreases, drawing more current, generating more heat. Without proper thermal management, this positive feedback loop destroys the LED. See [Thermal Management](m1-thermal-management.md).

2. **Electrostatic discharge (ESD)** -- InGaN (blue/green/white) LEDs are particularly sensitive to ESD. Handle with anti-static precautions.

3. **Overcurrent** -- Exceeding rated current causes immediate or accelerated degradation. The junction temperature rises, phosphor degrades, and light output drops permanently.

4. **Reverse voltage** -- Most LEDs tolerate only 5V reverse. Higher reverse voltage causes avalanche breakdown.

5. **Lumen depreciation** -- Even properly operated LEDs lose brightness over time. The L70 rating indicates the hours until output drops to 70% of initial. Quality LEDs: 25,000-50,000 hours to L70.

---

## Key Takeaways

- LED color is determined by semiconductor bandgap energy -- red/yellow LEDs (GaAsP, 1.8-2.2V) vs blue/green/white LEDs (InGaN, 3.0-3.8V)
- The exponential I-V curve means LEDs **must** have current limiting
- Operate at 50-70% of rated max current for dramatically improved lifespan
- 5050 RGB strips draw up to 14.4W/m; always size supplies at 120%
- Series strings share current naturally; parallel branches need individual resistors

---

## Cross-References

- [Resistor Calculations](m1-resistor-calculations.md) -- Ohm's Law calculations for current limiting
- [Constant-Current Drivers](m1-current-drivers.md) -- Driver ICs and power supply sizing
- [Thermal Management](m1-thermal-management.md) -- Heatsinking, derating, and thermal runaway prevention
- [WS2812B Protocol](m3-ws2812b-protocol.md) -- Addressable LED protocol using single-wire NZR
- [MCU Comparison](m2-mcu-comparison.md) -- Choosing a microcontroller for LED projects
- [Glossary](00-glossary.md) -- Definitions of terms used throughout this series

---

*Sources: Cree LED datasheets, Lumileds LUXEON technical documentation, Osram Opto Semiconductors application notes, SparkFun LED guide, Adafruit NeoPixel Uberguide, Kingbright LED specifications.*
