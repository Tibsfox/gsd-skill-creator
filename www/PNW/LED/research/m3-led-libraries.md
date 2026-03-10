# LED Libraries: NeoPixel, FastLED, and WLED

Addressable LED libraries abstract away the protocol timing details and provide high-level APIs for color, animation, and strip management. This page compares the three dominant options -- Adafruit NeoPixel, FastLED, and WLED -- along with coverage of SK6812 RGBW and lesser-known chipsets.

---

## Library Comparison at a Glance

| Feature | Adafruit NeoPixel | FastLED | WLED |
|---------|------------------|---------|------|
| Type | Arduino library | Arduino library | Complete firmware |
| LED protocols | WS2812B, SK6812 | 50+ chipsets | WS2812B, SK6812, APA102, + more |
| Platform | Arduino, ESP32, RP2040 | Arduino, ESP32, RP2040 | ESP32, ESP8266 |
| Color model | RGB, RGBW | RGB, HSV, palettes | RGB, HSV, palettes |
| Built-in effects | None (DIY) | Minimal helpers | 100+ effects |
| WiFi control | No | No | Yes (web UI, API, MQTT) |
| Home Assistant | Via custom code | Via custom code | Native integration |
| Memory per LED | 3 bytes (RGB), 4 (RGBW) | 3 bytes (CRGB) | 3-4 bytes + firmware overhead |
| Difficulty | Beginner | Intermediate | User (flash and configure) |
| License | MIT | MIT | MIT |

---

## Adafruit NeoPixel Library

The NeoPixel library is the simplest entry point for addressable LEDs. It prioritizes ease of use over advanced features.

### Installation

```
Arduino IDE: Sketch -> Include Library -> Manage Libraries -> Search "NeoPixel"
PlatformIO: lib_deps = adafruit/Adafruit NeoPixel
```

### Basic Usage

```cpp
#include <Adafruit_NeoPixel.h>

#define PIN        6
#define NUM_LEDS   60

// NEO_GRB: WS2812B byte order
// NEO_KHZ800: 800 kHz protocol
Adafruit_NeoPixel strip(NUM_LEDS, PIN, NEO_GRB + NEO_KHZ800);

void setup() {
  strip.begin();
  strip.setBrightness(50);  // Global brightness 0-255
  strip.show();             // Initialize to off
}

void loop() {
  // Set individual pixels
  strip.setPixelColor(0, strip.Color(255, 0, 0));    // Red
  strip.setPixelColor(1, strip.Color(0, 255, 0));    // Green
  strip.setPixelColor(2, strip.Color(0, 0, 255));    // Blue

  // Gamma-corrected color
  strip.setPixelColor(3, strip.gamma32(strip.ColorHSV(0, 255, 255)));  // Red via HSV

  strip.show();  // Push data to strip
  delay(100);
}
```

### NeoPixel Key Features

- **`strip.show()`** -- Pushes pixel buffer to LEDs. On AVR (Arduino), this **disables interrupts** for the duration of the transfer. See [WS2812B Protocol](m3-ws2812b-protocol.md) for why.
- **`strip.ColorHSV(hue, sat, val)`** -- HSV color with 16-bit hue (0-65535), 8-bit saturation, 8-bit value.
- **`strip.gamma32()`** -- Applies gamma correction to a 32-bit color value.
- **`strip.setBrightness()`** -- Global brightness limiter (destructive -- reduces resolution).
- **`strip.fill(color, first, count)`** -- Fill a range of pixels with one color.

### NeoPixel RGBW Support (SK6812)

```cpp
// SK6812 RGBW strip
Adafruit_NeoPixel strip(NUM_LEDS, PIN, NEO_GRBW + NEO_KHZ800);

void setup() {
  strip.begin();
  strip.show();
}

void loop() {
  // RGBW: four values per pixel
  strip.setPixelColor(0, strip.Color(0, 0, 0, 255));    // Pure white (W channel)
  strip.setPixelColor(1, strip.Color(255, 0, 0, 0));    // Pure red
  strip.setPixelColor(2, strip.Color(255, 100, 0, 128)); // Warm tone (R + some W)

  strip.show();
  delay(1000);
}
```

### NeoPixel Strengths and Weaknesses

| Strength | Weakness |
|----------|----------|
| Simple API, beginner-friendly | Limited chipset support |
| Official Adafruit support | No built-in effects |
| RGBW native support | No HSV color palette system |
| Gamma correction built-in | setBrightness is destructive |
| Excellent documentation | Slower than FastLED for complex animations |

---

## FastLED Library

FastLED is the power-user's choice. It supports 50+ LED chipsets, provides a rich color math library, palette system, and noise functions for complex animations.

### Installation

```
Arduino IDE: Sketch -> Include Library -> Manage Libraries -> Search "FastLED"
PlatformIO: lib_deps = fastled/FastLED
```

### Basic Usage

```cpp
#include <FastLED.h>

#define NUM_LEDS   60
#define DATA_PIN   6

CRGB leds[NUM_LEDS];

void setup() {
  FastLED.addLeds<WS2812B, DATA_PIN, GRB>(leds, NUM_LEDS);
  FastLED.setBrightness(50);
}

void loop() {
  // Direct RGB assignment
  leds[0] = CRGB::Red;
  leds[1] = CRGB::Green;
  leds[2] = CRGB(0, 0, 255);  // Blue

  // HSV assignment
  leds[3] = CHSV(0, 255, 255);    // Red via HSV
  leds[4] = CHSV(96, 255, 255);   // Green via HSV
  leds[5] = CHSV(160, 255, 255);  // Blue via HSV

  FastLED.show();
  delay(100);
}
```

### Supported LED Chipsets (Partial List)

| Chipset | Protocol | Wires | Color Depth | FastLED Template |
|---------|----------|-------|-------------|-----------------|
| WS2812B | NZR 800kHz | 1 | 8-bit RGB | `WS2812B` |
| WS2811 | NZR 400/800kHz | 1 | 8-bit RGB | `WS2811` |
| WS2813 | NZR 800kHz | 1 (+ backup) | 8-bit RGB | `WS2813` |
| WS2815 | NZR 800kHz | 1 | 8-bit RGB (12V) | `WS2815` |
| SK6812 | NZR 800kHz | 1 | 8-bit RGB | `SK6812` |
| APA102 | SPI | 2 | 5+8 bit | `APA102` |
| APA104 | NZR | 1 | 8-bit RGB | `APA104` |
| SM16703 | NZR | 1 | 8-bit RGB | `SM16703` |
| TM1809 | NZR | 1 | 8-bit RGB | `TM1809` |
| LPD8806 | SPI | 2 | 7-bit RGB | `LPD8806` |
| P9813 | SPI | 2 | 8-bit RGB | `P9813` |
| DOTSTAR | SPI | 2 | 5+8 bit | `DOTSTAR` |

### APA102 with FastLED

```cpp
#include <FastLED.h>

#define NUM_LEDS   60
#define DATA_PIN   11   // MOSI
#define CLOCK_PIN  13   // SCK

CRGB leds[NUM_LEDS];

void setup() {
  FastLED.addLeds<APA102, DATA_PIN, CLOCK_PIN, BGR>(leds, NUM_LEDS);
  FastLED.setBrightness(128);
}

void loop() {
  // APA102 works identically to WS2812B from the API perspective
  fill_rainbow(leds, NUM_LEDS, millis() / 10, 4);
  FastLED.show();
}
```

For APA102 protocol details, see [APA102 SPI Protocol](m3-apa102-spi.md).

### FastLED Color System

FastLED provides three ways to specify colors:

```cpp
// 1. Named colors (150+ predefined)
leds[0] = CRGB::Coral;
leds[1] = CRGB::DarkOrchid;
leds[2] = CRGB::LemonChiffon;

// 2. RGB values
leds[3] = CRGB(255, 128, 0);  // Orange

// 3. HSV (Hue, Saturation, Value)
// Hue: 0-255 (wraps around -- 0=red, 96=green, 160=blue)
leds[4] = CHSV(32, 255, 255);   // Orange via HSV
leds[5] = CHSV(128, 200, 128);  // Muted teal

// HSV is the fastest way to create rainbows and color cycles:
for (int i = 0; i < NUM_LEDS; i++) {
  leds[i] = CHSV((i * 256 / NUM_LEDS) + offset, 255, 255);
}
```

### Color Palettes

FastLED's palette system efficiently stores 16-entry color gradients that are interpolated to 256 entries:

```cpp
// Built-in palettes
CRGBPalette16 currentPalette = RainbowColors_p;
// Others: RainbowStripeColors_p, PartyColors_p, ForestColors_p,
//         OceanColors_p, LavaColors_p, HeatColors_p, CloudColors_p

// Custom palette
CRGBPalette16 myPalette(
  CRGB::DarkRed, CRGB::Red, CRGB::OrangeRed, CRGB::Orange,
  CRGB::Gold, CRGB::Yellow, CRGB::LemonChiffon, CRGB::White,
  CRGB::White, CRGB::LemonChiffon, CRGB::Yellow, CRGB::Gold,
  CRGB::Orange, CRGB::OrangeRed, CRGB::Red, CRGB::DarkRed
);

// Use palette
for (int i = 0; i < NUM_LEDS; i++) {
  uint8_t colorIndex = (i * 256 / NUM_LEDS) + offset;
  leds[i] = ColorFromPalette(currentPalette, colorIndex, brightness, LINEARBLEND);
}
```

### Noise Functions

FastLED includes Perlin noise for organic-looking effects:

```cpp
void loop() {
  static uint16_t noiseOffset = 0;

  for (int i = 0; i < NUM_LEDS; i++) {
    // inoise8: 8-bit Perlin noise
    uint8_t noise = inoise8(i * 30, noiseOffset);
    leds[i] = ColorFromPalette(LavaColors_p, noise, noise, LINEARBLEND);
  }
  noiseOffset += 5;

  FastLED.show();
  FastLED.delay(20);
}
```

### FastLED Power Management

FastLED can limit total power draw, preventing overloaded power supplies:

```cpp
void setup() {
  FastLED.addLeds<WS2812B, DATA_PIN, GRB>(leds, NUM_LEDS);
  // Limit to 5V, 2A maximum (10W)
  FastLED.setMaxPowerInVoltsAndMilliamps(5, 2000);
}
```

This automatically scales brightness when the calculated power draw exceeds the limit. Essential for USB-powered projects or shared power supplies.

---

## WLED Firmware

WLED is not a library -- it is a **complete firmware** for ESP32 and ESP8266 that provides a full-featured LED controller out of the box.

### WLED Features

- **100+ built-in effects** (rainbow, fire, twinkle, meteor, etc.)
- **Web UI** accessible from any browser on the local network
- **JSON API** for programmatic control
- **MQTT** for Home Assistant and other IoT platforms
- **Art-Net and sACN** for professional lighting control
- **Segment system** -- divide one strip into independent segments with different effects
- **Presets and playlists** -- save and sequence lighting scenes
- **Sync** -- multiple WLED devices synchronized
- **OTA updates** -- flash new firmware over WiFi
- **Sound reactive** (with WLED-SR fork) -- effects respond to music

### Installing WLED

```
Method 1: Web installer (easiest)
  1. Visit install.wled.me in Chrome or Edge
  2. Connect ESP32 via USB
  3. Click "Install" and follow prompts

Method 2: PlatformIO
  1. Clone https://github.com/Aircoookie/WLED
  2. Open in PlatformIO
  3. Select your ESP32 board environment
  4. Build and upload

Method 3: Binary flash
  1. Download .bin from github.com/Aircoookie/WLED/releases
  2. Flash with esptool:
     esptool.py --port /dev/ttyUSB0 write_flash 0x0 WLED_0.14.x_ESP32.bin
```

For a complete WLED setup guide with BOM and wiring, see [WLED Setup](m5-wled-setup.md).

### WLED JSON API

```python
import requests
import json

WLED_IP = "192.168.1.100"

# Set all LEDs to warm white at 50% brightness
payload = {
    "on": True,
    "bri": 128,
    "seg": [{
        "col": [[255, 200, 100]],
        "fx": 0  # Solid color
    }]
}
requests.post(f"http://{WLED_IP}/json/state", json=payload)

# Set rainbow effect
payload = {
    "seg": [{
        "fx": 9,   # Rainbow effect
        "sx": 128,  # Speed
        "ix": 200   # Intensity
    }]
}
requests.post(f"http://{WLED_IP}/json/state", json=payload)
```

### WLED + Home Assistant

```yaml
# configuration.yaml
light:
  - platform: wled
    host: 192.168.1.100
```

WLED auto-discovers via mDNS, so in most cases Home Assistant finds it automatically. See [diyHue & WLED Integration](m4-diyhue-wled.md) for advanced home automation setups.

---

## SK6812 RGBW Deep Dive

The SK6812 is a WS2812B-compatible LED with an optional dedicated white channel:

### SK6812 Variants

| Variant | Channels | Bytes per LED | Color Temp |
|---------|----------|---------------|------------|
| SK6812 RGB | 3 (R, G, B) | 3 | N/A |
| SK6812 RGBW (NW) | 4 (R, G, B, W) | 4 | 4000-4500K (neutral) |
| SK6812 RGBW (WW) | 4 (R, G, B, W) | 4 | 2700-3200K (warm) |
| SK6812 RGBW (CW) | 4 (R, G, B, W) | 4 | 5000-6500K (cool) |

### RGBW vs RGB White Comparison

```
RGB "white" (all three channels at 255):
  - Draws 60mA (3 x 20mA)
  - CRI (Color Rendering Index): ~70
  - Appears slightly blue-tinted
  - Inefficient: red + green + blue phosphors all emitting

SK6812 dedicated white (W channel at 255):
  - Draws 20mA (single LED)
  - CRI: 80-90 (depending on phosphor)
  - Clean, natural white
  - More efficient: single optimized white phosphor

For maximum white brightness, use all four channels:
  R=255, G=255, B=255, W=255 at 80mA total
```

### RGBW Color Conversion

Converting an RGB color to RGBW (extracting the white component):

```cpp
void rgbToRgbw(uint8_t r, uint8_t g, uint8_t b,
               uint8_t &ro, uint8_t &go, uint8_t &bo, uint8_t &wo) {
  // Extract the white component (minimum of RGB)
  uint8_t w = min(r, min(g, b));

  // Subtract white from RGB channels
  ro = r - w;
  go = g - w;
  bo = b - w;
  wo = w;
}

// Example: (200, 180, 150) -> R=50, G=30, B=0, W=150
// The warm tone is carried by the white channel + remaining R/G
```

---

## WS2813 and WS2815: Improved Variants

### WS2813: Backup Data Line

The WS2813 adds a backup data input. If one LED fails, the data signal bypasses it through the backup line:

```
WS2812B failure: one dead LED breaks the entire chain after it.

  MCU -> LED1 -> LED2 (dead) -> LED3 (no data) -> LED4 (no data)

WS2813 failure: data skips the dead LED.

  MCU -> LED1 -> LED2 (dead) -> LED3 (gets data via backup) -> LED4
                    ^                    |
                    |                    |
              DIN (dead)          BIN (backup from LED1)
```

### WS2815: 12V Addressable

The WS2815 runs at 12V instead of 5V, dramatically reducing voltage drop over long runs:

```
At same power (18W for 60 LEDs):
  WS2812B (5V):  3.6A current -> significant voltage drop
  WS2815 (12V):  1.5A current -> much less voltage drop

Maximum run without power injection:
  WS2812B: ~2-3 meters
  WS2815: ~5-7 meters
```

Both WS2813 and WS2815 use the same NZR protocol and work with the same libraries. See [Power Injection](m3-power-injection.md) for voltage drop calculations.

---

## Library Recommendation Decision Tree

```
What is your project?
  |
  +-- Just need LEDs to work (beginner)
  |     --> Adafruit NeoPixel
  |
  +-- Complex animations, many LED types, power management
  |     --> FastLED
  |
  +-- WiFi control, web UI, no coding needed
  |     --> WLED
  |
  +-- Production product, maximum control
  |     --> FastLED + custom code
  |
  +-- Home automation integration
        --> WLED + Home Assistant
```

---

## Cross-References

- [WS2812B Protocol](m3-ws2812b-protocol.md) -- Protocol details for the most common LED chipset
- [APA102 SPI Protocol](m3-apa102-spi.md) -- SPI-based alternative used by FastLED and WLED
- [Power Injection](m3-power-injection.md) -- Wiring for long strip runs
- [Arduino LED Control](m2-arduino-led-control.md) -- Using NeoPixel and FastLED on Arduino
- [ESP32 LED Control](m2-esp32-led.md) -- RMT peripheral and WLED platform
- [WLED Setup](m5-wled-setup.md) -- Complete WLED installation and configuration guide

---

*Sources: Adafruit NeoPixel library (github.com/adafruit/Adafruit_NeoPixel), FastLED library (github.com/FastLED/FastLED), WLED project (github.com/Aircoookie/WLED), SK6812 datasheet (Shenzhen Normand), WorldSemi WS2813/WS2815 datasheets, Adafruit NeoPixel Uberguide, QuinLED WLED hardware guide.*
