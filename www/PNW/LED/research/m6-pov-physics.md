# Persistence of Vision Physics

Persistence of vision (POV) is the optical phenomenon that allows a spinning strip of LEDs to produce a complete image in mid-air. Understanding the biology behind temporal integration -- and the math that follows from it -- is essential for designing POV displays that look solid, flicker-free, and bright.

---

## How Human Vision Creates the Illusion

### The Retina as an Integrator

The human retina does not operate like a digital camera taking discrete snapshots. Instead, photoreceptor cells (rods and cones) accumulate photons over a continuous **temporal integration window**. When a photon strikes a rod or cone, it triggers a photochemical cascade (the isomerization of retinal in rhodopsin for rods, or cone opsins for cones) that takes a finite time to reset. During this reset period, new photons arriving at the same receptor are effectively summed into the ongoing signal.

The critical parameters:

- **Temporal integration window:** 25-40ms for cone cells (photopic / daylight vision)
- **Rod integration window:** 100-300ms (scotopic / dark-adapted vision; this is why dark scenes look blurrier)
- **Cognitive motion detection threshold:** 10-12 frames per second -- below this, the brain perceives discrete images rather than continuous motion
- **Flicker fusion frequency (CFF):** 60-90 Hz for foveal vision under bright lighting; lower in peripheral vision

The integration window is the key to POV. If a light source passes through a position and then returns to that position within 25-40ms, the retina perceives both flashes as a single, continuous presence. The gap between flashes is invisible.

### Critical Flicker Fusion (CFF)

The **critical flicker fusion frequency** is the threshold at which a flickering light source appears steady. It depends on several factors:

| Factor | Effect on CFF |
|--------|--------------|
| Brightness | Higher brightness raises CFF (brighter = harder to fool) |
| Contrast | Higher contrast ratio raises CFF |
| Retinal location | Foveal (center) CFF ~60-90 Hz; peripheral CFF ~15-25 Hz |
| Adaptation state | Dark-adapted eyes have lower CFF (~25 Hz) |
| Stimulus size | Larger stimuli raise CFF (Ferry-Porter law) |

For POV displays, the CFF sets the minimum refresh rate. A POV display rotating at 30 revolutions per second (1800 RPM) presents each "frame" at 30 Hz -- adequate for peripheral viewing and moderate brightness, but users may perceive flicker at the center of gaze under bright conditions. Spinning faster (40-50 rev/s, 2400-3000 RPM) pushes the refresh rate above foveal CFF for most viewers.

---

## The POV Display Principle

### From Spinning LEDs to Solid Images

A POV display works by sweeping a single column of LEDs through space fast enough that the retina integrates all the columns into a single perceived image plane. The basic architecture:

```
        Rotation axis
            |
            |
    LED[0]  o  <-- Hub / motor
    LED[1]  |
    LED[2]  |     Arm sweeps 360 degrees
    LED[3]  |     per revolution
    LED[4]  |
    LED[5]  |
    LED[6]  |
    LED[7]  |
            |
         (tip)

    At 1800 RPM: one full sweep every 33ms
    Each angular position gets a unique column of pixel data
    Retina integrates all columns --> perceived flat disc of light
```

The key constraint is that one full revolution must complete within the retinal integration window (25-40ms). At 1800 RPM:

```
Revolution period = 60s / 1800 = 0.0333s = 33.3ms

33.3ms < 40ms (worst-case integration window)  --> PASS
33.3ms > 25ms (best-case integration window)   --> marginal

Conclusion: 1800 RPM works for most viewers in moderate ambient light.
For bright environments, target 2400+ RPM (25ms period).
```

### Angular Resolution and Pixel Timing

The angular resolution of a POV display is determined by how many distinct LED states can be displayed per revolution. For a target of 360 angular pixels (one pixel per degree):

```
Pixel time = revolution period / angular resolution

At 1800 RPM (33.3ms per revolution):
  Pixel time = 33.3ms / 360 = 92.6 microseconds per angular pixel

At 2400 RPM (25ms per revolution):
  Pixel time = 25ms / 360 = 69.4 microseconds per angular pixel

At 3000 RPM (20ms per revolution):
  Pixel time = 20ms / 360 = 55.6 microseconds per angular pixel
```

This pixel time is the maximum duration available to fully update the LED strip to the next column of image data. If the LED update takes longer than the pixel time, angular resolution is lost -- the image blurs.

This is why LED protocol speed is the critical bottleneck. See [APA102 POV Design](m6-apa102-pov-design.md) for the protocol timing analysis that determines which LEDs can achieve these pixel times.

---

## Worked Example: 1800 RPM POV Display

### Design Parameters

A practical POV display design with the following specifications:

```
Motor speed:        1800 RPM (30 rev/s)
Revolution period:  33.3 ms
LED strip length:   150 LEDs (radial arm)
Angular resolution: 360 pixels (1 degree per pixel)
Color depth:        24-bit RGB (8 bits per channel)
```

### Step 1: Pixel Time Budget

```
Pixel time = 33.3ms / 360 = 92.6 microseconds

This 92.6us is the TOTAL budget for:
  1. Update all 150 LEDs with new color data
  2. Wait for any protocol-required latency
  3. Process rotation sensor timing
```

### Step 2: Protocol Feasibility Check

**WS2812B (single-wire NZR protocol):**

```
Per-LED data time:  30 microseconds (24 bits x 1.25us per bit)
150 LEDs:           150 x 30us = 4,500 microseconds = 4.5ms
Reset pulse:        50 microseconds minimum

Total update time:  4,550 microseconds = 4.55ms

Pixel time budget:  92.6 microseconds

4,550us >> 92.6us   --> IMPOSSIBLE
```

The WS2812B cannot update 150 LEDs within a single pixel time. It would require 49 pixel periods to complete a single update, smearing the image across 49 degrees of rotation. The WS2812B is fundamentally incompatible with POV displays at any useful resolution. See [WS2812B Protocol](m3-ws2812b-protocol.md) for why its timing is so constrained.

**APA102 (SPI clocked protocol at 24 MHz):**

```
Per-LED data:       32 bits color + 32 bits = 32 bits at 24MHz
150 LEDs:           (32 start + 150x32 data + 8 end) bits
                    = 4,840 bits at 24MHz
                    = 201.7 microseconds

With overhead:      ~225 microseconds worst case

Pixel time budget:  92.6 microseconds
```

At the default calculation, even APA102 at 24 MHz exceeds the single-pixel budget. However, the APA102 has no minimum timing -- you can begin the next frame immediately. At reduced angular resolution (180 pixels = 2 degrees per pixel), the pixel time doubles to 185us, and APA102 fits comfortably. See [APA102 POV Design](m6-apa102-pov-design.md) for detailed optimization strategies including shorter strips and higher SPI clocks.

### Step 3: Effective Display Resolution

```
Radial resolution:   150 pixels (one per LED)
Angular resolution:  180 pixels (at 2 degrees per pixel with APA102)
Effective display:   150 x 180 = 27,000 pixels in the circular image plane

For comparison, a 150 x 150 pixel LCD = 22,500 pixels
The POV display exceeds this despite being a single spinning strip.
```

---

## History of POV Displays

### Mechanical Predecessors

The exploitation of persistence of vision long predates electronics:

- **1825 -- Thaumatrope:** A disc with images on both sides, spun on a string. The two images (e.g., a bird and a cage) fuse into one (bird inside cage). Demonstrated by John Ayrton Paris.
- **1832 -- Phenakistoscope:** Joseph Plateau's spinning disc with sequential images viewed through slots. The first device to demonstrate true apparent motion.
- **1834 -- Zoetrope:** William Horner's cylinder with image strip inside, viewed through slits. Allowed multiple simultaneous viewers.
- **1878 -- Praxinoscope:** Emile Reynaud replaced the slits with mirrors, dramatically increasing brightness and image quality.
- **1893 -- Kinetoscope:** Edison's peephole viewer, running 35mm film at 46 fps.

### Electronic POV Displays

- **1990s -- Simple POV wands:** Single-row LED arrays waved by hand, displaying scrolling text. Used 8-16 LEDs with simple microcontrollers (PIC, AVR).
- **2000s -- Motorized POV clocks:** Spinning arms displaying clock faces. Popular hobbyist projects using ATmega328 and discrete LEDs.
- **2010s -- High-density RGB POV:** APA102 strips on brushless motor mounts. Full-color image display with 100+ radial pixels. Notable projects from Cornell ECE4760 and SparkFun.
- **2020s -- Commercial holographic fans:** Products like the Hypervsn use the same POV principle with integrated brushless motors, wireless power, and WiFi content management. These are POV displays packaged as products.

---

## Physics of Rotation

### Centrifugal Force on Components

Components mounted on a spinning POV arm experience centrifugal acceleration:

```
a = omega^2 * r

Where:
  omega = angular velocity (rad/s) = RPM * 2*pi / 60
  r     = distance from rotation axis (meters)

At 1800 RPM, r = 0.15m (end of 150mm arm):
  omega = 1800 * 2 * pi / 60 = 188.5 rad/s
  a = (188.5)^2 * 0.15 = 5,327 m/s^2 = 543 G

At 3000 RPM, same radius:
  a = (314.2)^2 * 0.15 = 14,804 m/s^2 = 1,510 G
```

> **SAFETY WARNING:** A POV display arm spinning at 1800 RPM subjects components at the tip to over 500 G of centrifugal force. If any component detaches, it becomes a projectile. Always operate POV displays inside a protective enclosure, and never reach toward a spinning assembly. Ensure all solder joints and mechanical fasteners are rated for the expected forces. Test at low RPM first and increase gradually.

These forces have direct consequences for PCB design:

- Surface-mount components must be oriented so centrifugal force pushes them **into** their solder pads, not away
- Through-hole components need mechanical retention (bent leads, adhesive)
- Heavy components (connectors, large capacitors) should be placed as close to the rotation axis as possible
- The LED strip itself must be mechanically secured along its entire length

### Balancing

An unbalanced POV arm creates vibration proportional to the imbalance mass and the square of RPM. Even small imbalances at 1800+ RPM produce destructive vibration. Techniques:

- **Counterweight arm:** A second arm opposite the LED arm, weighted to match
- **Dynamic balancing:** Run at low RPM, identify the heavy side, add or remove mass
- **Symmetric design:** Two LED arms at 180 degrees, both displaying data (doubles refresh rate)

---

## Ambient Light and Brightness

### Brightness Requirements

A POV display must compete with ambient light. Since each LED is only illuminated for a fraction of the revolution at any given angular position, the **perceived brightness** is reduced by the duty cycle:

```
Perceived brightness = LED brightness x (pixel_time / revolution_period)

At 360 angular pixels:
  Duty cycle = 1/360 = 0.28%
  A 100 mcd LED appears as 0.28 mcd at any given angle

At 180 angular pixels:
  Duty cycle = 1/180 = 0.56%
  The same LED appears as 0.56 mcd
```

This is why POV displays work best in dim environments and require high-brightness LEDs. The APA102's global brightness register allows per-frame brightness scaling that can partially compensate -- see [APA102 POV Design](m6-apa102-pov-design.md) for details.

### Operating Environment Recommendations

| Environment | Ambient (lux) | Min LED Brightness | Angular Res |
|------------|---------------|-------------------|-------------|
| Dark room | <50 | Standard | 360 |
| Indoor dim | 50-200 | High-brightness | 360 |
| Indoor lit | 200-500 | Max brightness | 180 |
| Outdoor shade | 500-5000 | Impractical without enclosure | 90-120 |
| Direct sun | >5000 | Not viable for open POV | -- |

---

## Synchronization and Image Stability

### Rotation Sensing

For a stable image, the LED controller must know the arm's exact angular position at every moment. This requires a once-per-revolution reference signal:

- **Hall effect sensor:** A magnet on the frame and a Hall sensor on the arm. Clean digital pulse, no contact wear. Most common approach.
- **Reflectance sensor (IR):** An IR LED/photodiode pair on the arm, reflecting off a target on the frame. Requires Schmitt trigger debouncing to produce clean edges.
- **Optical interrupter:** A slotted sensor on the frame that the arm passes through. Similar to reflectance but more robust to ambient IR.

The controller measures the time between successive reference pulses to calculate the current RPM and therefore the correct pixel timing for the next revolution. This adaptive timing is critical -- motor speed is never perfectly constant.

See [RP2040 POV Architecture](m6-rp2040-pov-architecture.md) for the implementation of rotation sensing using PIO state machines with hardware-accurate timing.

---

## Key Takeaways

- Human retinal integration windows of 25-40ms set the maximum revolution period for POV
- At 1800 RPM (33.3ms/rev) with 360 angular pixels, each pixel window is only 92.6 microseconds
- WS2812B is fundamentally incompatible with POV -- its 4.5ms update time exceeds pixel budgets by 50x
- Components at the tip of a 150mm arm experience 500+ G at 1800 RPM; mechanical safety is paramount
- Perceived brightness drops by the duty cycle (1/360 = 0.28%), demanding high-brightness LEDs and dim environments
- Rotation sensing via Hall effect or reflectance provides the angular reference for stable images

---

## Cross-References

- [APA102 POV Design](m6-apa102-pov-design.md) -- Why APA102 SPI timing makes POV possible
- [RP2040 POV Architecture](m6-rp2040-pov-architecture.md) -- Dual-core system design for real-time POV
- [WS2812B Protocol](m3-ws2812b-protocol.md) -- The protocol timing that makes WS2812B unsuitable for POV
- [APA102 SPI Protocol](m3-apa102-spi.md) -- SPI frame structure and clock-rate details
- [LED Fundamentals](m1-led-fundamentals.md) -- LED brightness specifications and forward voltage
- [Glossary](00-glossary.md) -- Definitions of terms used throughout this series

---

*Sources: Cornell University ECE4760 POV display projects, Adafruit POV guides, SparkFun persistence of vision tutorial, Tektronix application note on LED display measurement, CircuitCellar POV display articles, Hypervsn technical documentation, Plateau (1829) "On some properties of the impressions produced by light upon the organ of sight."*
