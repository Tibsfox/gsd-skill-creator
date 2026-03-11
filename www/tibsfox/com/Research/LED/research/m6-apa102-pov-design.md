# APA102 POV Display Design

The choice of addressable LED protocol determines whether a POV display is physically possible. The WS2812B -- the most popular addressable LED -- cannot do POV at any useful resolution. The APA102, with its SPI-clocked interface and absence of timing constraints, is the correct choice. This page presents the quantitative comparison and the engineering details for building an APA102-based POV strip.

---

## Why WS2812B Cannot Do POV

### The Timing Problem

The WS2812B uses a single-wire NZR (Non-Return-to-Zero) protocol where each bit is encoded as a specific pulse width. The protocol is entirely timing-dependent:

```
WS2812B Bit Timing:
  "0" bit:  0.4us HIGH, 0.85us LOW  = 1.25us per bit
  "1" bit:  0.8us HIGH, 0.45us LOW  = 1.25us per bit

  Per LED:  24 bits x 1.25us = 30us
  Reset:    50us minimum (280us recommended)

  150 LEDs: 150 x 30us + 50us = 4,550us = 4.55ms
```

At 1800 RPM with 360 angular pixels, the pixel time budget is 92.6 microseconds. The WS2812B needs 4,550 microseconds to update 150 LEDs -- that is **49x over budget**. Even with only 3 LEDs, the WS2812B would need 140us (30us x 3 + 50us reset), which still exceeds the 92.6us pixel budget.

The WS2812B has no clock line. The LED chips use internal PLLs to recover timing from the data stream, and the strict pulse-width requirements cannot be accelerated. You cannot "overclock" a WS2812B. For a thorough treatment of the WS2812B protocol, see [WS2812B Protocol](m3-ws2812b-protocol.md).

### Protocol Comparison Table

| Parameter | WS2812B | APA102 |
|-----------|---------|--------|
| Interface | Single-wire NZR | SPI (clock + data) |
| Clock source | Internal PLL (800 kHz fixed) | External (up to ~24 MHz) |
| Bits per LED | 24 (8G + 8R + 8B) | 32 (3'b111 + 5 brightness + 8B + 8G + 8R) |
| Time per LED | 30.0 us (fixed) | 1.33 us (at 24 MHz) |
| 150-LED update | 4,550 us | ~225 us |
| Reset requirement | 50-280 us silence | None (start frame) |
| Back-to-back frames | Must wait for reset | Immediate |
| PWM frequency | ~430 Hz (visible flicker) | ~19.2 kHz (flicker-free) |
| Color depth | 8-bit per channel | 8-bit + 5-bit global brightness |

The APA102 is **20x faster** for 150 LEDs, but more importantly, it has **no minimum timing requirements**. You can drive it as fast as your SPI peripheral supports, and begin a new frame the instant the previous one ends.

---

## APA102 Frame Structure for POV

### SPI Data Format

The APA102 SPI protocol consists of three sections:

```
Start Frame:   32 bits of zeros (0x00000000)
LED Data:      N x 32-bit LED frames
End Frame:     ceil(N/2) bits of ones (at least)

LED Frame (32 bits):
  Bits [31:29]  = 111 (constant header)
  Bits [28:24]  = Global brightness (0-31, 5 bits)
  Bits [23:16]  = Blue (0-255)
  Bits [15:8]   = Green (0-255)
  Bits [7:0]    = Red (0-255)
```

The global brightness register is a hardware PWM scaler on the APA102 die. Setting it to 15 (out of 31) halves the duty cycle of the LED's internal PWM without changing the RGB color data. This is critical for POV because it provides brightness control without sacrificing color resolution at low brightness levels.

### Update Time Calculation

For a 150-LED strip at 24 MHz SPI clock:

```
Start frame:    32 bits
LED data:       150 x 32 = 4,800 bits
End frame:      ceil(150/2) = 75 bits, padded to 96 bits (3 bytes)

Total bits:     32 + 4,800 + 96 = 4,928 bits

At 24 MHz:      4,928 / 24,000,000 = 205.3 microseconds
With overhead:  ~225 microseconds (including SPI peripheral setup)
```

### Fitting the Pixel Time Budget

At 1800 RPM with 360 angular pixels, the pixel time is 92.6us -- the 225us APA102 update does not fit. Solutions:

**Strategy 1: Reduce angular resolution**

```
180 angular pixels (2 degrees per pixel):
  Pixel time = 33.3ms / 180 = 185us
  225us update > 185us --> still tight

120 angular pixels (3 degrees per pixel):
  Pixel time = 33.3ms / 120 = 278us
  225us update < 278us --> FITS with 53us margin
```

**Strategy 2: Shorter LED strip**

```
72 LEDs at 24 MHz:
  Total bits = 32 + (72 x 32) + 48 = 2,384 bits
  Update time = 99.3us
  92.6us budget --> marginal

60 LEDs at 24 MHz:
  Total bits = 32 + (60 x 32) + 48 = 2,000 bits
  Update time = 83.3us
  92.6us budget --> FITS with 9.3us margin
```

**Strategy 3: Higher SPI clock**

Some APA102 strips tolerate clock speeds above 24 MHz, though this is outside the guaranteed specification. At 30 MHz:

```
150 LEDs at 30 MHz:
  4,928 bits / 30,000,000 = 164.3us
  With 180 angular pixels (185us budget) --> FITS
```

> **SAFETY WARNING:** High-speed SPI over long strip lengths (>0.5m) requires careful signal integrity. Use short, impedance-matched connections. Ringing on the clock line at 24+ MHz can cause data corruption manifesting as random color glitches or stuck LEDs. Keep SPI wires under 15cm and consider adding 33-ohm series termination resistors on clock and data lines.

**Strategy 4: Dual-arm design**

Two LED strips mounted 180 degrees apart. Each arm only needs to cover 180 degrees of the image, doubling the effective pixel time:

```
Dual-arm at 1800 RPM:
  Each arm covers 180 degrees per revolution
  Effective pixel time for 360 angular pixels:
    33.3ms / 180 = 185us per arm per pixel
  225us update still tight, but combine with shorter strip:
    100 LEDs at 24 MHz = 139us --> FITS with 46us margin
```

---

## Practical POV Strip Selection

### APA102 vs APA102C vs SK9822

Several LED ICs are compatible with the APA102 SPI protocol:

| LED IC | PWM Frequency | Brightness Register | Max SPI Clock | Notes |
|--------|--------------|--------------------|--------------|----|
| APA102 (original) | ~19.2 kHz | 5-bit (0-31) | ~24 MHz | Best for POV; highest PWM rate |
| APA102C | ~19.2 kHz | 5-bit (0-31) | ~24 MHz | Same die, different package |
| SK9822 | ~4.7 kHz | 5-bit (current sink) | ~15 MHz | Lower PWM; brightness is current not PWM |
| HD107S | ~27 kHz | 5-bit | ~40 MHz | Fastest; excellent for POV |

For POV, the APA102 original or HD107S is preferred. The SK9822 has a lower internal PWM frequency (4.7 kHz vs 19.2 kHz) that can create visible banding in POV applications because the LED's internal PWM cycle can beat against the rotation frequency.

### Strip Density and Radial Resolution

| Strip | LEDs/m | LED Pitch | 150mm Arm | 300mm Arm |
|-------|--------|-----------|-----------|-----------|
| 30/m | 33.3 mm | 4.5 LEDs | 9 LEDs |
| 60/m | 16.7 mm | 9 LEDs | 18 LEDs |
| 72/m | 13.9 mm | 10.8 LEDs | 21.6 LEDs |
| 144/m | 6.9 mm | 21.7 LEDs | 43.3 LEDs |

For high radial resolution, 144 LEDs/m strips provide the densest pixel packing. A 300mm arm with 144/m strip gives ~43 radial pixels per arm, or ~86 across a dual-arm diameter -- comparable to a small TFT display.

### Power Budget per Revolution

The power budget is often the limiting factor before the data rate:

```
APA102 at full white, full brightness:
  Per LED: 60 mA (20mA per channel)
  150 LEDs: 150 x 60mA = 9.0A at 5V = 45W

At global brightness 15 (half):
  Per LED: ~30 mA average
  150 LEDs: 4.5A at 5V = 22.5W
```

For a rotating assembly, this power must be delivered through slip rings or wireless coupling -- see [RP2040 POV Architecture](m6-rp2040-pov-architecture.md) for power delivery options.

---

## Color Fidelity at Speed

### The Global Brightness Advantage

The APA102's 5-bit global brightness register provides 32 levels of hardware-controlled PWM dimming independent of the 8-bit RGB color values. This yields an effective **13-bit brightness resolution** (5 global + 8 channel), which is critical for POV:

- At low brightness, 8-bit color produces visible banding (especially in gradients)
- The global brightness register allows smooth dimming without color distortion
- For POV, set global brightness to balance visibility against power consumption

### Color Rendering Comparison

```
WS2812B at 20% brightness:
  RGB(51, 51, 51) = 8-bit scaled
  Only 51 discrete levels available
  Gradient steps are visible

APA102 at 20% brightness:
  Global = 6, RGB(255, 255, 255)
  Full 256 levels of color variation
  Smooth gradients preserved
```

This means APA102 POV displays can render photographic images with correct shadow detail, while WS2812B strips (even ignoring the speed problem) would produce visible posterization at reduced brightness.

---

## Frame Buffer Architecture

### Double Buffering

POV displays require double buffering to prevent visual tearing:

```
Buffer A (front): Currently being read by SPI DMA for LED output
Buffer B (back):  Being written by the image processing core

Per-revolution swap:
  1. Revolution N begins
  2. Core 0 reads Buffer A, outputs 180-360 SPI frames
  3. Core 1 writes next image data into Buffer B
  4. Revolution N ends (index pulse detected)
  5. Swap: A becomes back, B becomes front
  6. Revolution N+1 begins with updated image
```

For a 150-LED, 180-pixel display:

```
Frame buffer size = 150 LEDs x 4 bytes x 180 columns = 108,000 bytes = 105.5 KB
Double buffer:     211 KB

RP2040 SRAM:       264 KB
Remaining:         53 KB (for stack, variables, SPI DMA descriptors)
```

This fits, but just barely. For higher resolutions, consider streaming columns from flash rather than buffering the entire frame. See [RP2040 POV Architecture](m6-rp2040-pov-architecture.md) for the memory management strategy.

### Polar Coordinate Mapping

Source images are rectangular. POV displays are radial. The conversion from Cartesian to polar coordinates must be precomputed:

```
For each angular position theta (0 to 359) and radial position r (0 to 149):
  x = r * cos(theta) + center_x
  y = r * sin(theta) + center_y

  If (x, y) falls within the source image:
    LED[r] at angle theta = source_image[x][y]
  Else:
    LED[r] at angle theta = black (0, 0, 0)
```

This mapping is computed once per image load (not per revolution) and stored as a lookup table. The LUT approach converts the per-revolution rendering to simple indexed memory reads.

---

## Timing Diagram: APA102 vs WS2812B in POV Context

```
Time -->  0       100us    200us    300us    400us    4500us
          |---------|---------|---------|---------|---------|

APA102:   [=UPDATE=]  idle    [=UPDATE=]  idle    [=UPDATE=] ...
          225us              225us              225us
          Column 0           Column 1           Column 2

WS2812B:  [=================== UPDATE ===================]
          |<-------------- 4,550 us = ONE column -------->|
          Column 0 only                                    ...

At 1800 RPM, 180 angular pixels:
  APA102 completes 180 column updates in 33.3ms   --> FULL IMAGE
  WS2812B completes 7 column updates in 33.3ms    --> 7/180 of image

The WS2812B image would have 7 visible columns with 173 dark gaps.
This is not a POV display; it is a stuttering artifact.
```

---

## Bill of Materials: POV Strip Assembly

| Component | Specification | Quantity | Est. Cost |
|-----------|--------------|----------|-----------|
| APA102 LED strip | 144 LEDs/m, 5V, IP30 | 0.3m (43 LEDs) | $8-12 |
| RP2040 board | Raspberry Pi Pico or custom | 1 | $4-6 |
| Hall effect sensor | A3144 or SS49E | 1 | $0.50 |
| Neodymium magnet | 6mm disc, frame-mounted | 1 | $0.30 |
| Decoupling caps | 100uF + 0.1uF per 10 LEDs | 5 sets | $1.50 |
| SPI termination | 33 ohm, 0402 or 0603 | 2 | $0.10 |
| Slip ring | 6-wire, 300RPM+ rated | 1 | $8-15 |
| Brushless motor | 2400+ RPM, BLDC with ESC | 1 | $15-25 |
| Power supply | 5V 10A | 1 | $12-18 |
| Protective enclosure | Polycarbonate tube/disc | 1 | $10-20 |

> **SAFETY WARNING:** Always enclose a POV display in a transparent protective shield before applying power to the motor. A bare spinning arm with LEDs and electronics at 1800+ RPM is a serious injury hazard. Polycarbonate (Lexan) is preferred over acrylic because it resists shattering on impact.

---

## Key Takeaways

- WS2812B is 49x too slow for POV at 1800 RPM / 360 pixels -- it is fundamentally incompatible
- APA102 at 24 MHz updates 150 LEDs in ~225us; fits 120-180 angular pixel budgets
- The 5-bit global brightness register preserves color fidelity at reduced brightness levels
- HD107S (40 MHz, 27 kHz PWM) is the fastest APA102-compatible LED for POV
- Double buffering a 150x180 frame consumes 211 KB of the RP2040's 264 KB SRAM
- Dual-arm designs double effective pixel time and improve image symmetry

---

## Cross-References

- [POV Physics](m6-pov-physics.md) -- Temporal integration, flicker fusion, and angular resolution math
- [RP2040 POV Architecture](m6-rp2040-pov-architecture.md) -- Dual-core system with PIO SPI and DMA
- [APA102 SPI Protocol](m3-apa102-spi.md) -- Full protocol specification and frame format
- [WS2812B Protocol](m3-ws2812b-protocol.md) -- Why NZR timing prevents POV use
- [Power Injection](m3-power-injection.md) -- Voltage drop management for long LED runs
- [Glossary](00-glossary.md) -- Definitions of terms used throughout this series

---

*Sources: APA102 datasheet (Shenzhen LED Color), SK9822 datasheet, HD107S datasheet, Tim's Blog "Demystifying the APA102," Adafruit DotStar (APA102) guide, Cornell ECE4760 POV display project documentation, FastLED library source code (clockless vs clocked driver analysis), CircuitCellar "High-Speed LED Displays."*
