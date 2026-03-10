# APA102 SPI Protocol

The APA102 (also sold as DotStar by Adafruit) is an addressable LED that uses a standard two-wire SPI interface instead of the WS2812B's timing-critical single-wire protocol. This fundamental difference makes the APA102 dramatically easier to drive, interrupt-tolerant, and capable of much higher update rates -- at the cost of an additional wire and slightly higher per-LED price.

---

## Why APA102 Over WS2812B?

| Factor | WS2812B | APA102 |
|--------|---------|--------|
| Wires | 1 (data) | 2 (clock + data) |
| Protocol | NZR timing-critical | Standard SPI |
| Clock source | Embedded in data signal | Separate clock line |
| Max clock speed | 800 kHz (fixed) | Up to 24 MHz |
| Timing tolerance | +/- 150 ns | Any (clock-driven) |
| Interrupt sensitivity | Fatal | None |
| CPU blocking | Yes (unless DMA/PIO) | No (hardware SPI) |
| Brightness control | 8-bit PWM only | 5-bit global + 8-bit PWM |
| Update rate (300 LEDs) | ~107 fps | ~800 fps at 8 MHz |
| Price per LED | $0.05-0.10 | $0.15-0.30 |

The APA102's clock-driven protocol means **any microcontroller with SPI can drive it reliably**. No special peripherals needed. No interrupt concerns. No timing-critical bit-banging. This makes it the preferred choice for applications where reliability and speed matter more than per-LED cost.

---

## SPI Frame Structure

The APA102 protocol consists of a **start frame**, one **LED frame** per LED, and an **end frame**:

```
Complete APA102 Data Stream:

  [Start Frame][LED 1][LED 2][LED 3]...[LED N][End Frame]
  |  32 bits  | 32 bits each              | variable  |
```

### Start Frame

```
32 bits, all zeros:

  00000000 00000000 00000000 00000000
  |<------------- 0x00000000 ----------->|
```

The start frame synchronizes the APA102's internal logic. It must be exactly 32 zero bits.

### LED Frame (32 bits per LED)

```
  Bit 31-29    Bit 28-24       Bit 23-16    Bit 15-8     Bit 7-0
  +--------+-------------+----------+----------+----------+
  |  111   | brightness  |   Blue   |  Green   |   Red    |
  | 3 bits |   5 bits    |  8 bits  |  8 bits  |  8 bits  |
  +--------+-------------+----------+----------+----------+

  Header: Always 111 (binary) = 0xE0 OR'd with brightness
  Brightness: 0-31 (5 bits) -- global brightness multiplier
  Blue: 0-255
  Green: 0-255
  Red: 0-255

  First byte: 0xE0 | brightness = 0xE0 to 0xFF
```

### End Frame

```
End frame: at least ceil(N/2) bits of 1s, padded to full bytes.

For 60 LEDs:  ceil(60/2) = 30 bits --> 4 bytes of 0xFF
For 144 LEDs: ceil(144/2) = 72 bits --> 9 bytes of 0xFF
For 300 LEDs: ceil(300/2) = 150 bits --> 19 bytes of 0xFF

Conservative formula: ceil(N / 16) + 1 bytes of 0xFF
(Some implementations use ceil(N/2) bits; others use N/2 bytes.
Using more is always safe.)
```

### Why End Frame Matters

Each APA102 LED introduces a half-clock-cycle delay. The end frame provides extra clock pulses to push data through the chain. Without enough end frame bytes, LEDs at the end of a long strip may not latch correctly.

---

## The 5-Bit Global Brightness Register

The APA102's most distinctive feature is its **dual-brightness architecture**:

1. **5-bit global brightness** (0-31): Controls the LED driver current in 32 hardware steps
2. **8-bit per-channel PWM** (0-255): Controls each color via PWM modulation

These multiply together:

```
Effective brightness = (global / 31) * (channel_pwm / 255)

Example:
  Global = 16, Red = 200:
  Effective = (16/31) * (200/255) = 0.516 * 0.784 = 0.405 = 40.5%
```

### Why This Matters: Low-Brightness Quality

Standard 8-bit PWM has a problem at low brightness: the steps between values are large relative to the brightness. At PWM value 1, the LED is either off or at 1/255 = 0.4% brightness. There is no value between them.

The APA102 solves this with its 5-bit hardware brightness:

```
For very dim effects:
  Set global brightness = 1 (1/31 of maximum)
  Now 8-bit PWM controls the range from 0 to 1/31 = 3.2% of max
  Each step: 3.2% / 255 = 0.0126% of maximum

  That's 255 smooth steps in the lowest 3.2% of brightness range.
  Compare WS2812B: only 8 steps (0-7) cover the same range.
```

This makes the APA102 vastly superior for:

- Candlelight and flame effects
- Night lights and sleep-friendly lighting
- Ambient backlighting
- POV displays (where brightness precision affects image quality)
- Any application requiring smooth fading at low levels

---

## Clock Speed and Update Rates

The APA102 has no fixed clock speed. The data line is sampled on the rising edge of the clock, so the clock can run at any speed the wiring supports:

| Clock Speed | 60 LEDs Update Time | 300 LEDs Update Time | Max FPS (300 LEDs) |
|-------------|--------------------|-----------------------|-------------------|
| 1 MHz | 1.92 ms | 9.6 ms | 104 |
| 4 MHz | 0.48 ms | 2.4 ms | 416 |
| 8 MHz | 0.24 ms | 1.2 ms | 833 |
| 12 MHz | 0.16 ms | 0.8 ms | 1250 |
| 24 MHz | 0.08 ms | 0.4 ms | 2500 |

Compare to WS2812B at 800 kHz fixed: 300 LEDs = 9.3 ms = 107 fps.

At 8 MHz SPI, the APA102 updates **8x faster** than WS2812B. This is critical for [POV displays](m6-apa102-pov-design.md) where update rate directly determines image resolution.

### Practical Clock Speed Limits

While the APA102 datasheet claims 24 MHz, real-world limits depend on wiring:

| Wiring | Practical Max Clock |
|--------|-------------------|
| Short PCB traces (< 10cm) | 20-24 MHz |
| Short wires (< 30cm) | 12-16 MHz |
| LED strip (1-2m) | 8-12 MHz |
| LED strip (3-5m) | 4-8 MHz |
| Long runs with connectors | 2-4 MHz |

Signal integrity degrades with distance. Use the fastest clock that works reliably, with margin. For most strip installations, 8 MHz is a safe default.

---

## Implementation Examples

### Arduino SPI

```cpp
#include <SPI.h>

#define NUM_LEDS 60
#define BRIGHTNESS 16  // 0-31

struct ABGR {
  uint8_t brightness;
  uint8_t blue;
  uint8_t green;
  uint8_t red;
};

ABGR leds[NUM_LEDS];

void apa102_init() {
  SPI.begin();
  SPI.setClockDivider(SPI_CLOCK_DIV2);  // 8 MHz on 16 MHz Arduino
  for (int i = 0; i < NUM_LEDS; i++) {
    leds[i] = {BRIGHTNESS, 0, 0, 0};
  }
}

void apa102_show() {
  // Start frame
  SPI.transfer(0x00);
  SPI.transfer(0x00);
  SPI.transfer(0x00);
  SPI.transfer(0x00);

  // LED frames
  for (int i = 0; i < NUM_LEDS; i++) {
    SPI.transfer(0xE0 | (leds[i].brightness & 0x1F));
    SPI.transfer(leds[i].blue);
    SPI.transfer(leds[i].green);
    SPI.transfer(leds[i].red);
  }

  // End frame
  for (int i = 0; i < (NUM_LEDS / 16) + 1; i++) {
    SPI.transfer(0xFF);
  }
}

void set_pixel(int index, uint8_t r, uint8_t g, uint8_t b) {
  leds[index].red = r;
  leds[index].green = g;
  leds[index].blue = b;
}

void setup() {
  apa102_init();
  // Set first LED to red
  set_pixel(0, 255, 0, 0);
  apa102_show();
}

void loop() {
  // Animation here
}
```

### Python (Raspberry Pi SPI)

```python
import spidev
import time

spi = spidev.SpiDev()
spi.open(0, 0)
spi.max_speed_hz = 8000000  # 8 MHz

NUM_LEDS = 60
BRIGHTNESS = 16  # 0-31

def show(pixels):
    """pixels: list of (r, g, b) tuples."""
    data = [0x00, 0x00, 0x00, 0x00]  # Start frame

    for r, g, b in pixels:
        data.append(0xE0 | (BRIGHTNESS & 0x1F))
        data.append(b & 0xFF)
        data.append(g & 0xFF)
        data.append(r & 0xFF)

    # End frame
    end_bytes = (len(pixels) // 16) + 1
    data.extend([0xFF] * (end_bytes * 4))

    spi.xfer2(data)

# All LEDs warm white
pixels = [(255, 200, 100)] * NUM_LEDS
show(pixels)
```

### MicroPython (RP2040)

```python
from machine import Pin, SPI
import time

spi = SPI(0, baudrate=8_000_000, sck=Pin(2), mosi=Pin(3))

NUM_LEDS = 60
BRIGHTNESS = 16

def show(pixels):
    """pixels: list of (r, g, b) tuples."""
    # Start frame
    spi.write(b'\x00\x00\x00\x00')

    # LED frames
    for r, g, b in pixels:
        spi.write(bytes([0xE0 | BRIGHTNESS, b, g, r]))

    # End frame
    end_bytes = (len(pixels) // 16) + 1
    spi.write(b'\xFF' * (end_bytes * 4))

# Rainbow
pixels = []
for i in range(NUM_LEDS):
    hue = i * 256 // NUM_LEDS
    if hue < 85:
        pixels.append((hue * 3, 255 - hue * 3, 0))
    elif hue < 170:
        h = hue - 85
        pixels.append((255 - h * 3, 0, h * 3))
    else:
        h = hue - 170
        pixels.append((0, h * 3, 255 - h * 3))
show(pixels)
```

---

## APA102 vs WS2812B: When to Use Which

### Choose APA102 When:

- **POV displays** -- High update rate is critical for image resolution. See [POV Display Design](m6-apa102-pov-design.md).
- **Raspberry Pi projects** -- SPI works natively, no special libraries needed
- **Interrupt-heavy environments** -- WiFi, Bluetooth, serial, timers all running
- **Low-brightness quality** -- Candles, ambient, night lighting
- **Long strips with reliability needs** -- Clock signal is regenerated at each LED
- **High frame rate** -- Dance floors, video walls, reactive lighting

### Choose WS2812B When:

- **Budget matters** -- 2-3x cheaper per LED
- **Fewer wires** -- Single data line simplifies wiring
- **Ecosystem** -- More libraries, tutorials, and pre-built effects (WLED)
- **Standard installations** -- Room lighting, accent lighting, basic effects
- **ESP32 + WLED** -- The dominant smart lighting stack uses WS2812B

### Choose SK6812 RGBW When:

- **True white needed** -- Dedicated white channel, not mixed RGB
- **Warm/cool white mixing** -- Separate W channel for clean whites
- **Same protocol as WS2812B** -- Direct replacement, same timing and libraries

See [LED Libraries](m3-led-libraries.md) for library support across all three protocols.

---

## APA102C vs APA102

The "C" variant (APA102C) is functionally identical to the APA102 with one important difference: improved clock signal regeneration. In early APA102 batches, clock signal degradation over long chains (~500+ LEDs) could cause issues. The APA102C regenerates the clock at each LED, extending the maximum chain length.

For new projects, always buy APA102C if available. They are drop-in compatible.

---

## Power Consumption

APA102 LEDs have similar power consumption to WS2812B:

```
Per LED at full white:
  Red:   20 mA
  Green: 20 mA
  Blue:  20 mA
  Total: 60 mA at global brightness = 31

At global brightness = 16:
  Approximately 30 mA per LED at full white

60 LEDs at brightness 16, full white:
  30 mA x 60 = 1.8A at 5V = 9W
```

For power supply sizing and injection wiring, see [Power Injection](m3-power-injection.md).

---

## Cross-References

- [WS2812B Protocol](m3-ws2812b-protocol.md) -- Single-wire alternative, timing constraints
- [LED Libraries](m3-led-libraries.md) -- FastLED, Adafruit DotStar library support
- [Power Injection](m3-power-injection.md) -- Wiring for long APA102 strip runs
- [RP2040 PIO](m2-rp2040-pio.md) -- PIO-generated SPI for APA102
- [Raspberry Pi GPIO](m2-raspberry-pi-gpio.md) -- Native SPI APA102 control
- [APA102 POV Design](m6-apa102-pov-design.md) -- POV displays leveraging APA102 speed

---

*Sources: APA102/APA102C datasheet (Shenzhen LED Color Opto), Adafruit DotStar documentation, cpldcpu "Understanding the APA102 Superled" analysis, Tim's Blog APA102 end frame investigation, FastLED APA102 implementation notes, Pololu APA102-based LED strip guide.*
