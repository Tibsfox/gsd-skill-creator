# LED Persistence of Vision & Display Technology

> **Domain:** Electro-Optical Engineering
> **Module:** 4 -- Psychophysics, LED Driver Protocols, POV Architectures, and Embedded Firmware
> **Through-line:** *The eye lies to the brain on purpose.* Persistence of vision isn't a bug in human perception -- it's the feature that turns flickering cave fires into steady light, movie projectors into motion, and spinning LED arrays into floating images. Every POV display is a conspiracy between physics, firmware, and neuroscience.

---

## Table of Contents

1. [Psychophysics of Persistence of Vision](#1-psychophysics-of-persistence-of-vision)
2. [Flicker Fusion and the CFF Threshold](#2-flicker-fusion-and-the-cff-threshold)
3. [POV Display Architectures](#3-pov-display-architectures)
4. [LED Driver Protocols](#4-led-driver-protocols)
5. [Inductive Power Transfer](#5-inductive-power-transfer)
6. [Rotation Detection and Synchronization](#6-rotation-detection-and-synchronization)
7. [RP2040 PIO: Hardware-Assisted LED Timing](#7-rp2040-pio-hardware-assisted-led-timing)
8. [Image Mapping and Column Timing](#8-image-mapping-and-column-timing)
9. [3D POV and Holographic Displays](#9-3d-pov-and-holographic-displays)
10. [Safety Considerations](#10-safety-considerations)
11. [Cross-References](#11-cross-references)
12. [Sources](#12-sources)

---

## 1. Psychophysics of Persistence of Vision

Persistence of vision refers to the brain's tendency to retain a visual impression for approximately 40 ms (25 Hz) after the light stimulus ceases [1]. This is not a simple retinal afterimage -- it involves multiple stages of neural processing:

### Retinal Persistence

Photoreceptor cells (rods and cones) continue generating electrical signals for several milliseconds after light stimulation ends. The photochemical cycle in rhodopsin (rod pigment) has a recovery time of approximately 30-50 ms, while cone opsins recover in 10-20 ms. This creates a graded persistence effect that varies with brightness, wavelength, and adaptation state.

### Neural Integration

The visual cortex integrates signals over a temporal window of approximately 100-200 ms. This integration smooths rapid fluctuations and enables the perception of continuous motion from discrete frames. The integration window is shorter for bright stimuli and longer for dim stimuli -- an important consideration for POV displays that operate at varying ambient light levels.

### Afterimage Duration

Positive afterimages (same brightness polarity as the original stimulus) persist for approximately:

| Stimulus Duration | Afterimage Duration | Conditions |
|---|---|---|
| < 1 ms (flash) | 100-200 ms | Dark-adapted, bright flash |
| 10 ms | 80-150 ms | Moderate brightness |
| 50 ms | 40-80 ms | Normal viewing |
| 100 ms | 30-50 ms | Well-lit environment |

The critical insight for POV design: the afterimage from a brief LED flash persists long enough for the next flash (at a different angular position) to overlap perceptually, creating the illusion of a continuous image [2].

---

## 2. Flicker Fusion and the CFF Threshold

The critical flicker frequency (CFF) is the rate above which discrete flashes appear as continuous illumination. CFF varies significantly with viewing conditions [3]:

### Ferry-Porter Law

CFF increases logarithmically with luminance:

```
CFF = a * log(L) + b
```

Where `L` is the retinal illuminance in trolands and `a` and `b` are constants that depend on stimulus size and retinal location. For a 2-degree stimulus at central fixation, typical values yield CFF ranging from 12 Hz (dim) to 75 Hz (bright).

### CFF Dependencies

| Factor | Effect on CFF | Typical Range |
|---|---|---|
| Luminance | Higher brightness = higher CFF | 12-75 Hz |
| Stimulus size | Larger area = higher CFF | 5-10 Hz increase |
| Retinal eccentricity | Peripheral vision = higher CFF | Up to 80 Hz |
| Wavelength | Green/yellow most sensitive | 50-65 Hz at moderate L |
| Age | CFF decreases with age | ~1 Hz per decade after 20 |
| Duty cycle | Lower duty = lower CFF | Significant below 50% |

### Implications for POV Displays

For a POV display to appear flicker-free, the image refresh rate must exceed the CFF for the operating conditions. At moderate brightness in normal ambient lighting, this requires at least 50-60 Hz refresh -- meaning the display arm must complete at least 50-60 full rotations per second (3,000-3,600 RPM) if displaying a full image per revolution.

In practice, most POV displays show a half-image per half-revolution (the arm sweeps both directions), effectively doubling the apparent refresh rate. At 1,000 RPM (16.7 revolutions per second), this gives 33.3 image updates per second -- sufficient for moderate brightness but visible flicker in bright conditions [4].

---

## 3. POV Display Architectures

### Rotary Propeller

The simplest POV architecture: a linear array of LEDs mounted on a spinning arm, like a propeller blade. The arm sweeps through 360 degrees, displaying one column of the image at each angular position.

```
ROTARY POV DISPLAY
================================================================

  Top view:
                    Angular position
                    determines which
                    image column to show
                         │
                         v
          ┌──────────────┼──────────────┐
          │  LED LED LED LED LED LED    │ <-- LED array
          │  N   N-1 ... 3   2   1     │     (radial)
          └──────────────┼──────────────┘
                         │
                    ┌────┴────┐
                    │  Motor  │
                    │  Shaft  │
                    └─────────┘

  Side view:
          LED LED LED LED LED LED
          │   │   │   │   │   │
          └───┴───┴───┴───┴───┘
                    │
              ┌─────┴─────┐
              │  Motor     │
              │  + Base    │
              └───────────┘
```

**Advantages:** Simple construction, single motor, good for cylindrical displays.
**Disadvantages:** Centripetal force on LEDs, vibration at high RPM, single-plane image.

### Cylindrical (Vertical Axis)

LEDs mounted on a vertical arm rotating around a vertical axis. Produces a cylindrical display surface, viewable from all horizontal angles.

### Reciprocating (Linear Oscillation)

LEDs on an arm that oscillates back and forth rather than rotating. Uses a solenoid or cam mechanism. Lower mechanical stress than rotary designs but produces rectangular rather than circular images. Suitable for clock displays and message boards.

### Flexible PCB

LEDs mounted on a flexible printed circuit board that is bent into a curved surface and rotated. This allows higher LED density than rigid PCB designs and enables conformal displays that follow curved surfaces.

---

## 4. LED Driver Protocols

### APA102 (DotStar)

Two-wire SPI protocol. Data (MOSI) and clock (SCK) lines [5]:

```
APA102 FRAME FORMAT
================================================================

  Start frame (32 bits):
    00000000 00000000 00000000 00000000

  LED frame (32 bits per LED):
    111BBBBB BBBBBBBB GGGGGGGG RRRRRRRR
    │  │              │         │
    │  │              │         └── Red   (8 bit, 0-255)
    │  │              └──────────── Green (8 bit, 0-255)
    │  │                            Blue  (8 bit, 0-255)
    │  └─────────────────────────── Global brightness (5 bit, 0-31)
    └────────────────────────────── Header "111" (3 bits)

  End frame:
    At least ceil(N/2) bits of 1s (where N = LED count)
    Conservative: 4 bytes of 0xFF per 64 LEDs
```

**Key advantage:** The separate clock line provides deterministic timing independent of data rate variations. This is critical for POV displays where timing jitter translates directly to image distortion. Clock rates up to 20 MHz are supported, giving approximately 0.16 microseconds per bit [6].

### WS2812 (NeoPixel)

Single-wire protocol with timing-encoded data [7]:

```
WS2812 BIT TIMING
================================================================

  "0" bit:                    "1" bit:
  ┌───┐                      ┌──────┐
  │   │                      │      │
  │   └───────────┐          │      └──────┐
  │  T0H   │ T0L  │          │  T1H  │ T1L │
  │ 400ns  │ 850ns│          │ 800ns │450ns│
  │ ±150ns │±150ns│          │±150ns │±150ns│

  Data order per LED: G7 G6 G5 G4 G3 G2 G1 G0
                      R7 R6 R5 R4 R3 R2 R1 R0
                      B7 B6 B5 B4 B3 B2 B1 B0

  Reset (latch): > 50 us low
```

**Critical timing constraint:** The tight tolerance (+/- 150 ns) makes bit-banging on general-purpose CPUs unreliable. Hardware peripherals (SPI, PIO, DMA-driven timers) are strongly preferred for reliable WS2812 communication.

### SK6812 (RGBW)

Extension of the WS2812 protocol adding a dedicated white LED channel. Each LED requires 32 bits (4 x 8-bit channels: G, R, B, W) instead of 24 bits. The white channel provides better color rendering and higher luminous efficacy for white light compared to mixing RGB.

### Protocol Comparison for POV Applications

| Feature | APA102 | WS2812 | SK6812 |
|---|---|---|---|
| Wires | 2 (SPI) | 1 | 1 |
| Max data rate | 20 MHz | 800 kHz | 800 kHz |
| Bits per LED | 32 | 24 | 32 |
| Time per 100 LEDs | 160 us | 3 ms | 4 ms |
| Brightness control | 5-bit global + 8-bit per channel | 8-bit per channel | 8-bit per channel |
| POV suitability | Excellent | Poor (too slow) | Poor (too slow) |

For POV displays requiring more than 30 image columns per revolution, APA102 is the only practical choice among common addressable LEDs. WS2812's 3 ms refresh time for 100 LEDs limits angular resolution to approximately 20 columns at 1,000 RPM [8].

---

## 5. Inductive Power Transfer

Inductive (wireless) power transfer eliminates the wire-tangling problem for rotating POV assemblies [9].

### Operating Principle

A transmitter coil on the stationary base generates an alternating magnetic field. A receiver coil on the rotating arm intercepts this field and induces a voltage. The coupling efficiency depends on:

- **Coil alignment:** Coaxial alignment (receiver coil concentric with transmitter) provides best coupling
- **Air gap:** Efficiency drops rapidly with increasing gap; typical gap for POV: 2-5 mm
- **Operating frequency:** Higher frequency improves coupling but increases switching losses; typical: 100-500 kHz
- **Coil quality factor:** Higher Q improves efficiency but narrows the frequency bandwidth

### Practical Implementation

```
INDUCTIVE POWER TRANSFER FOR POV
================================================================

  Stationary base:              Rotating arm:
  ┌──────────────────┐         ┌──────────────────┐
  │  DC Power Supply │         │  Rectifier +     │
  │       │          │         │  Regulator        │
  │       v          │         │       │           │
  │  ┌──────────┐   │         │  ┌──────────┐    │
  │  │  Half-   │   │  ~~~~~  │  │ Receiver │    │
  │  │  Bridge  │───│─────────│──│ Coil     │    │
  │  │  Driver  │   │ magnetic│  └──────────┘    │
  │  └──────────┘   │  field  │       │           │
  │       │          │         │       v           │
  │  Transmitter    │         │  3.3V / 5V to     │
  │  Coil           │         │  MCU + LEDs       │
  └──────────────────┘         └──────────────────┘
```

Typical inductive coupling achieves 60-80% efficiency at 5 mm gap. For a POV display consuming 5W (100 LEDs at 50 mA each), the transmitter must supply approximately 6-8W to compensate for coupling losses.

---

## 6. Rotation Detection and Synchronization

Accurate rotation detection is essential for POV image stability. The display must know its exact angular position at every moment to determine which image column to display [10].

### Hall-Effect Sensors

A Hall-effect sensor detects a magnet fixed to the stationary base as the arm rotates past it. Each detection generates a pulse that triggers a timer reset. The period between pulses gives the current rotation period.

### Reflectance Sensors

An IR emitter/detector pair aimed at a single white marker on the base. The reflected IR signal triggers when the sensor passes over the marker. Less susceptible to electromagnetic interference than Hall sensors but sensitive to ambient IR (sunlight).

### Debouncing

A Schmitt trigger between the sensor and the microcontroller prevents false triggering from electrical noise. The hysteresis window (typically 0.3-0.5V for a 3.3V system) must be wide enough to reject noise but narrow enough to avoid positional error:

```
Position error = (hysteresis delay / rotation period) * 360 degrees
```

At 1,000 RPM (60 ms period) with 10 us hysteresis delay: position error = (0.01 / 60) * 360 = 0.06 degrees -- negligible.

### Column Timing Computation

Once the rotation period T is known, the time for each image column is:

```
t_column = T / num_columns
```

For 360 columns (1-degree resolution) at 1,000 RPM:
```
t_column = 60 ms / 360 = 167 us per column
```

Each column must be loaded into the LED array and displayed within this 167 us window. With APA102 at 20 MHz SPI, 100 LEDs (3,200 bits) take 160 us -- just barely within budget. This is why APA102's SPI interface is critical for high-resolution POV displays.

---

## 7. RP2040 PIO: Hardware-Assisted LED Timing

The RP2040's Programmable I/O (PIO) state machines provide hardware-accurate LED timing independent of the main ARM cores [11].

### PIO Architecture

The RP2040 has two PIO blocks, each containing:
- 4 independent state machines
- 32-instruction shared instruction memory
- Input and output shift registers (32-bit each)
- Clock dividers (16-bit integer + 8-bit fractional)
- DMA integration for zero-CPU-overhead data transfer

### WS2812 via PIO

A PIO program for WS2812 fits in approximately 6 instructions:

```
WS2812 PIO PROGRAM (simplified)
================================================================

  .program ws2812
      pull block           ; Wait for data from FIFO
      out x, 1             ; Shift one bit into x
      jmp !x do_zero       ; If bit is 0, branch
  do_one:
      set pins, 1 [T1-1]   ; High for T1H period
      set pins, 0 [T1L-2]  ; Low for T1L period
      jmp pull_next         ; Next bit
  do_zero:
      set pins, 1 [T0H-1]  ; High for T0H period
      set pins, 0 [T0L-2]  ; Low for T0L period
  pull_next:
      ; ... loop control
```

The PIO state machine executes this at a configurable clock rate, typically 800 kHz for WS2812. The key advantage: the ARM cores are completely free to handle image computation, rotation detection, and other tasks while PIO handles the time-critical LED protocol.

### APA102 via PIO SPI

For APA102, PIO implements a simple SPI master:

```
APA102 PIO SPI (simplified)
================================================================

  .program apa102_spi
      pull block           ; Wait for 32-bit frame
      set x, 31            ; Bit counter
  bitloop:
      out pins, 1          ; Output data bit on MOSI
      set pins, 1 [1]      ; Clock high (SCK)
      set pins, 0          ; Clock low (SCK)
      jmp x-- bitloop      ; Next bit
```

With PIO running at system clock (125 MHz), the effective SPI rate can reach 62.5 MHz -- far exceeding APA102's 20 MHz maximum and providing ample margin for timing accuracy.

### Dual-Core POV Architecture

```
RP2040 POV ARCHITECTURE
================================================================

  Core 0:                          Core 1:
  ┌──────────────────────┐        ┌──────────────────────┐
  │ - Rotation sensing   │        │ - Image buffer mgmt  │
  │ - Column timing ISR  │        │ - Animation rendering │
  │ - DMA setup for PIO  │        │ - Serial/WiFi comms  │
  │ - Watchdog           │        │ - Pattern generation  │
  └──────────┬───────────┘        └──────────┬───────────┘
              │                               │
              └───────────┬───────────────────┘
                          │
                     ┌────┴────┐
                     │ PIO SM0 │ ──> APA102 data out
                     │ PIO SM1 │ ──> APA102 clock out
                     └─────────┘
                          │
                      ┌───┴───┐
                      │  DMA  │ (auto-feeds PIO from image buffer)
                      └───────┘
```

Core 0 handles time-critical rotation synchronization. Core 1 handles image rendering. PIO handles LED communication. DMA connects image buffers to PIO without CPU intervention. This is the Amiga Principle in action: each subsystem is dedicated to its task, and the interfaces between them are deterministic [12].

---

## 8. Image Mapping and Column Timing

### Polar-to-Cartesian Conversion

A rectangular source image must be converted to polar coordinates for display on a rotary POV:

```
For each angular position theta (0 to 2*pi):
  For each radial position r (0 to R_max):
    x = R_center + r * cos(theta)
    y = R_center + r * sin(theta)
    LED[r] = source_image[x][y]   (with bilinear interpolation)
```

This conversion is performed once when the image is loaded, producing a lookup table of LED values indexed by column number and LED position.

### Brightness Compensation

LEDs near the center of rotation move slower than LEDs near the periphery. If all LEDs display for the same duration, the center appears brighter (more photons per unit area). Radial brightness compensation adjusts each LED's intensity proportional to its radial distance:

```
brightness[r] = base_brightness * (r / R_max)
```

This produces a perceptually uniform image across the display radius.

---

## 9. 3D POV and Holographic Displays

### Volumetric POV

Multiple LED arrays rotating on different planes create a volumetric display. The KAIST JANUS project uses 96 tri-color LEDs per blade at 1,000 RPM, creating a 3D image viewable from all angles [13].

### Helix POV

A linear LED array tilted at an angle to the rotation axis sweeps out a helical surface. By varying LED values along the helix, a 3D cylindrical image is produced.

### Limitations and Further Research

Current POV displays are limited by:
- Brightness (short duty cycle per pixel)
- Resolution (number of LEDs * angular steps)
- Color depth (8 bits typical, limited by refresh time budget)
- Safety (rotating assemblies at high RPM)

Further research is needed in:
- High-efficiency LED phosphors for brighter short-pulse operation
- MEMS-based beam steering as an alternative to mechanical rotation
- Perception models for optimizing image quality at minimal LED count

---

## 10. Safety Considerations

> **DANGER: Rotating assemblies at 1,000+ RPM pose serious injury risk.** A POV display arm spinning at 1,000 RPM has tip speeds of approximately 15 m/s (33 mph) for a 15 cm radius arm. Contact with a spinning arm can cause lacerations, contusions, or broken bones. All POV displays must be enclosed in a transparent protective shield and equipped with motor disconnect switches accessible from outside the enclosure [14].

> **CAUTION: Photosensitive epilepsy risk.** POV displays operating below 50 Hz produce visible flicker that can trigger seizures in photosensitive individuals. The dangerous range for photosensitive epilepsy is 3-30 Hz (IEC 62471). Ensure refresh rate exceeds 50 Hz under all operating conditions, including motor startup and spindown phases [15].

### Mechanical Design Safety Checklist

- Transparent enclosure with minimum 3 mm polycarbonate or equivalent
- Dynamic balancing of rotating assembly (vibration < 0.5 mm at operating RPM)
- Motor disconnect accessible without opening enclosure
- Over-speed protection (firmware watchdog + hardware RPM limiter)
- Bearing temperature monitoring for extended operation
- Cable strain relief for all connections to rotating assembly
- Warning labels: rotating machinery hazard, strobe warning

---

## 11. Cross-References

> **Related:** [Sound Filtering & Audio](03-sound-filtering-audio.md) -- audio-reactive LED patterns consume filter output. [DMX512 & Stage Lighting](05-dmx512-stage-lighting.md) -- DMX/Art-Net control of POV displays in stage applications. [ASIC & FPGA DSP](02-asic-fpga-dsp.md) -- FPGA-based POV controllers for high LED counts.

**Series cross-references:**
- **LED (LED & Controllers):** WS2812/APA102 protocols, RP2040 PIO, POV display fundamentals
- **T55 (555 Timer):** Timing precision concepts for LED column synchronization
- **SPA (Spatial Awareness):** Spatial perception and visual psychophysics
- **EMG (Electric Motors):** Motor control for POV rotation systems
- **ARC (Shapes & Colors):** Color theory and visual composition for POV imagery

---

## 12. Sources

1. Coltheart, M. "The Persistence of Vision." Philosophical Transactions of the Royal Society of London B, vol. 290, no. 1038, pp. 57-69, 1980.
2. Holcombe, A.O. "Seeing Slow and Seeing Fast: Two Limits on Perception." Trends in Cognitive Sciences, vol. 13, no. 5, pp. 216-221, 2009.
3. De Lange, H. "Research into the Dynamic Nature of the Human Fovea-Cortex Systems." Journal of the Optical Society of America, vol. 48, no. 11, pp. 777-784, 1958.
4. Kelly, D.H. "Visual Responses to Time-Dependent Stimuli." Journal of the Optical Society of America, vol. 51, no. 4, pp. 422-429, 1961.
5. APA102 datasheet. Shenzhen LED Color Opto Electronic Co., 2014.
6. Adafruit. "Adafruit DotStar LEDs." Learning System, 2023.
7. WorldSemi. "WS2812B Intelligent Control LED Integrated Light Source." Datasheet, v5, 2019.
8. Hackaday. "The Basics of Persistence of Vision Projects." 2019.
9. Kurs, A. et al. "Wireless Power Transfer via Strongly Coupled Magnetic Resonances." Science, vol. 317, no. 5834, pp. 83-86, 2007.
10. Cornell University ECE4760. "POV Display Projects." Course materials, 2023.
11. Raspberry Pi. "RP2040 Datasheet: A microcontroller by Raspberry Pi." 2021.
12. Raspberry Pi Magazine. "POV Display with RP2040 PIO." HomeMadeGarbage, 2022.
13. Lee, J. et al. "JANUS: A Visual Entertainment Experience beyond 360-degree Video." SIGGRAPH 2014 Emerging Technologies, 2014.
14. OSHA. "Machine Guarding." 29 CFR 1910.212, Occupational Safety and Health Standards.
15. IEC 62471:2006. "Photobiological Safety of Lamps and Lamp Systems."

---

*Signal & Light -- Module 4: LED Persistence of Vision. The eye fills in the gaps. The firmware makes sure the gaps are in the right places.*
