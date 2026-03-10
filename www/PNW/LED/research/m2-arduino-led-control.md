# Arduino LED Control & PWM

The Arduino is the most accessible entry point for microcontroller-based LED control. This page covers the built-in `analogWrite()` PWM, timer reconfiguration for custom frequencies, direct port manipulation for performance-critical applications, and practical code examples for both simple dimming and addressable LED strips.

---

## PWM Basics with analogWrite()

Arduino's `analogWrite()` function generates a PWM signal on designated pins. The duty cycle is set with an 8-bit value (0-255), where 0 = always off and 255 = always on.

```cpp
// Basic LED dimming with analogWrite()
const int LED_PIN = 9;  // Must be a PWM-capable pin (~)

void setup() {
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  // Fade up
  for (int brightness = 0; brightness <= 255; brightness++) {
    analogWrite(LED_PIN, brightness);
    delay(5);
  }
  // Fade down
  for (int brightness = 255; brightness >= 0; brightness--) {
    analogWrite(LED_PIN, brightness);
    delay(5);
  }
}
```

### PWM Frequencies by Pin (Arduino Uno/Nano)

The default PWM frequencies depend on which timer drives the pin:

| Pins | Timer | Default Frequency | Notes |
|------|-------|-------------------|-------|
| 5, 6 | Timer0 | ~980 Hz | Also drives millis()/delay() |
| 9, 10 | Timer1 | ~490 Hz | 16-bit timer, most configurable |
| 3, 11 | Timer2 | ~490 Hz | 8-bit timer |

The default frequencies (~490 Hz and ~980 Hz) are adequate for basic LED dimming but can produce visible flicker, especially in peripheral vision or on camera. For flicker-free operation, increase the frequency to at least 1 kHz, preferably 2-5 kHz.

> **SAFETY WARNING:** Modifying Timer0 prescaler changes the timing of `millis()`, `delay()`, and `micros()`. This will break any time-dependent code. Prefer modifying Timer1 or Timer2 for LED PWM.

---

## Timer1 Reconfiguration for Custom PWM Frequency

Timer1 is a 16-bit timer on the ATmega328P (Arduino Uno/Nano), offering the most flexibility for custom PWM:

```cpp
// Configure Timer1 for fast PWM at a specific frequency
// Output on Pin 9 (OC1A) and/or Pin 10 (OC1B)

void setupPWM(uint16_t frequency) {
  // Disable interrupts during timer configuration
  cli();

  // Clear Timer1 control registers
  TCCR1A = 0;
  TCCR1B = 0;
  TCNT1 = 0;

  // Calculate ICR1 (TOP) value for desired frequency
  // f_PWM = f_clk / (prescaler * (ICR1 + 1))
  // ICR1 = (f_clk / (prescaler * f_PWM)) - 1

  uint16_t prescaler = 1;  // No prescaling for high frequencies
  uint16_t top = (16000000UL / (prescaler * frequency)) - 1;

  // Fast PWM, ICR1 as TOP (Mode 14)
  TCCR1A = (1 << COM1A1) | (1 << WGM11);           // Non-inverting on OC1A (pin 9)
  TCCR1B = (1 << WGM13) | (1 << WGM12) | (1 << CS10); // Prescaler = 1

  ICR1 = top;        // Set TOP (determines frequency)
  OCR1A = top / 2;   // 50% duty cycle initially

  // Re-enable interrupts
  sei();
}

void setDuty(uint16_t duty) {
  // duty: 0 to ICR1
  OCR1A = duty;
}

void setup() {
  pinMode(9, OUTPUT);
  setupPWM(25000);  // 25 kHz -- well above audible range
}

void loop() {
  // Smooth fade using 16-bit resolution
  for (uint16_t i = 0; i <= ICR1; i += 10) {
    setDuty(i);
    delay(1);
  }
  for (uint16_t i = ICR1; i > 0; i -= 10) {
    setDuty(i);
    delay(1);
  }
}
```

### Frequency and Resolution Tradeoffs

With a 16 MHz clock and prescaler = 1:

| Target Frequency | ICR1 (TOP) | Resolution (bits) | Effective Steps |
|-----------------|------------|-------------------|----------------|
| 1 kHz | 15999 | 14 bits | 16,000 |
| 5 kHz | 3199 | 12 bits | 3,200 |
| 25 kHz | 639 | ~10 bits | 640 |
| 50 kHz | 319 | ~9 bits | 320 |
| 100 kHz | 159 | ~7.5 bits | 160 |

Higher PWM frequency reduces resolution. For LED dimming, 10 bits (1024 steps) is more than enough for smooth fading, so 25 kHz is an excellent choice -- inaudible and high-resolution.

---

## Gamma Correction for Perceived Brightness

Human perception of brightness is logarithmic, not linear. A linear PWM ramp (0 to 255) appears to jump quickly from off to bright, then barely change at the top. Gamma correction compensates:

```cpp
// Gamma correction lookup table (gamma = 2.2)
// Maps perceived brightness (0-255) to PWM value (0-255)
const uint8_t PROGMEM gamma8[] = {
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1,  1,  1,  1,
    1,  1,  1,  1,  1,  1,  1,  1,  1,  2,  2,  2,  2,  2,  2,  2,
    2,  3,  3,  3,  3,  3,  3,  3,  4,  4,  4,  4,  4,  5,  5,  5,
    5,  6,  6,  6,  6,  7,  7,  7,  7,  8,  8,  8,  9,  9,  9, 10,
   10, 10, 11, 11, 11, 12, 12, 13, 13, 13, 14, 14, 15, 15, 16, 16,
   17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22, 23, 24, 24, 25,
   25, 26, 27, 27, 28, 29, 29, 30, 31, 32, 32, 33, 34, 35, 35, 36,
   37, 38, 39, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 50,
   51, 52, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 66, 67, 68,
   69, 70, 72, 73, 74, 75, 77, 78, 79, 81, 82, 83, 85, 86, 87, 89,
   90, 92, 93, 95, 96, 98, 99,101,102,104,105,107,109,110,112,114,
  115,117,119,120,122,124,126,127,129,131,133,135,137,138,140,142,
  144,146,148,150,152,154,156,158,160,162,164,167,169,171,173,175,
  177,180,182,184,186,189,191,193,196,198,200,203,205,208,210,213,
  215,218,220,223,225,228,231,233,236,239,241,244,247,249,252,255
};

void setLED(uint8_t pin, uint8_t perceived_brightness) {
  uint8_t pwm = pgm_read_byte(&gamma8[perceived_brightness]);
  analogWrite(pin, pwm);
}
```

This table is generated with: `pwm = round(255 * (i/255)^2.2)` for i in 0..255.

---

## Direct Port Manipulation

`digitalWrite()` takes about 4-5 microseconds per call due to pin lookup and safety checks. Direct port manipulation is **4-8x faster**, essential for bit-banging LED protocols:

```cpp
// Arduino Uno pin mapping to ports:
// Pins 0-7:   PORTD (PD0-PD7)
// Pins 8-13:  PORTB (PB0-PB5)
// Pins A0-A5: PORTC (PC0-PC5)

// Example: Toggle pin 13 (PB5) using direct port manipulation
void setup() {
  DDRB |= (1 << PB5);  // Set PB5 as output (same as pinMode(13, OUTPUT))
}

void loop() {
  PORTB |= (1 << PB5);   // Set PB5 HIGH (~125ns)
  delayMicroseconds(1);
  PORTB &= ~(1 << PB5);  // Set PB5 LOW  (~125ns)
  delayMicroseconds(1);
}
```

### Speed Comparison

| Operation | Time | Relative Speed |
|-----------|------|---------------|
| `digitalWrite(13, HIGH)` | ~4.5 us | 1x (baseline) |
| `PORTB \|= (1 << PB5)` | ~125 ns | 36x faster |
| `analogWrite(9, 128)` | ~6 us | N/A |

Direct port manipulation is essential for protocols like the WS2812B, where bit timing must be accurate to within 150 nanoseconds. See [WS2812B Protocol](m3-ws2812b-protocol.md) for details.

### Driving Multiple Pins Simultaneously

One advantage of port manipulation: you can set multiple pins in a single clock cycle:

```cpp
// Set pins 8, 9, 10, 11 all HIGH simultaneously
PORTB |= 0x0F;  // Bits 0-3 of PORTB

// Set pins 8, 9 HIGH and 10, 11 LOW simultaneously
PORTB = (PORTB & 0xF0) | 0x03;
```

---

## WS2812B Control with Arduino

For addressable LED strips, libraries handle the precise timing. Here is a complete example using the Adafruit NeoPixel library:

```cpp
#include <Adafruit_NeoPixel.h>

#define LED_PIN    6
#define LED_COUNT  60

Adafruit_NeoPixel strip(LED_COUNT, LED_PIN, NEO_GRB + NEO_KHZ800);

void setup() {
  strip.begin();
  strip.setBrightness(50);  // 0-255, applied to all pixels
  strip.show();             // Initialize all pixels to off
}

void loop() {
  rainbowCycle(10);
}

// Rainbow that cycles across the entire strip
void rainbowCycle(uint8_t wait) {
  for (long firstPixel = 0; firstPixel < 256 * 5; firstPixel++) {
    for (int i = 0; i < strip.numPixels(); i++) {
      // Distribute colors evenly across pixels
      uint16_t hue = (i * 65536L / strip.numPixels()) + (firstPixel * 256);
      strip.setPixelColor(i, strip.gamma32(strip.ColorHSV(hue)));
    }
    strip.show();
    delay(wait);
  }
}
```

For a detailed comparison of NeoPixel vs FastLED vs WLED, see [LED Libraries](m3-led-libraries.md).

---

## RGB LED Dimming (Non-Addressable)

For non-addressable RGB LEDs or strips, use three PWM channels:

```cpp
const int RED_PIN   = 9;   // Timer1
const int GREEN_PIN = 10;  // Timer1
const int BLUE_PIN  = 11;  // Timer2

void setup() {
  pinMode(RED_PIN, OUTPUT);
  pinMode(GREEN_PIN, OUTPUT);
  pinMode(BLUE_PIN, OUTPUT);
}

void setColor(uint8_t r, uint8_t g, uint8_t b) {
  // Apply gamma correction for each channel
  analogWrite(RED_PIN,   pgm_read_byte(&gamma8[r]));
  analogWrite(GREEN_PIN, pgm_read_byte(&gamma8[g]));
  analogWrite(BLUE_PIN,  pgm_read_byte(&gamma8[b]));
}

void loop() {
  setColor(255, 0, 0);    // Red
  delay(1000);
  setColor(0, 255, 0);    // Green
  delay(1000);
  setColor(0, 0, 255);    // Blue
  delay(1000);
  setColor(255, 165, 0);  // Orange
  delay(1000);
  setColor(128, 0, 128);  // Purple
  delay(1000);
  setColor(255, 255, 255); // White
  delay(1000);
}
```

For driving higher-power RGB strips (which draw more current than a GPIO pin can provide), use MOSFETs as switches. See [MOSFET PWM Dimmers](m5-mosfet-pwm-dimmers.md).

---

## Serial-Controlled LED Brightness

A practical project -- control LED brightness from a computer or phone via serial:

```cpp
const int LED_PIN = 9;

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  Serial.println("Send 0-255 to set brightness");
}

void loop() {
  if (Serial.available()) {
    int value = Serial.parseInt();
    if (value >= 0 && value <= 255) {
      analogWrite(LED_PIN, value);
      Serial.print("Brightness set to: ");
      Serial.println(value);
    }
  }
}
```

---

## Arduino Limitations for LED Projects

| Limitation | Impact | Solution |
|-----------|--------|----------|
| 6 PWM pins only (Uno) | Max 2 RGB channels | Use PCA9685 I2C PWM driver |
| 8-bit PWM resolution | Only 256 brightness levels | Timer1 custom config (up to 16-bit) |
| 16 MHz clock | Tight for WS2812B timing | Use libraries (NeoPixel, FastLED) |
| No WiFi/BLE | No wireless control | Add ESP-01 module, or use [ESP32](m2-esp32-led.md) |
| 2KB SRAM | ~100 WS2812B LEDs max | Use Arduino Mega (8KB) or [RP2040](m2-rp2040-pio.md) |
| No DMA | CPU blocked during strip.show() | [RP2040 PIO](m2-rp2040-pio.md) or ESP32 RMT |

For a full comparison of all microcontroller platforms, see [MCU Comparison](m2-mcu-comparison.md).

---

## Recommended Arduino Boards for LED Projects

| Board | MCU | SRAM | PWM Pins | Best For |
|-------|-----|------|----------|----------|
| Arduino Uno | ATmega328P | 2KB | 6 | Learning, small projects |
| Arduino Nano | ATmega328P | 2KB | 6 | Breadboard prototyping |
| Arduino Mega 2560 | ATmega2560 | 8KB | 15 | Large LED matrices |
| Arduino Nano Every | ATmega4809 | 6KB | 5 | Compact, more RAM |
| Arduino Nano 33 IoT | SAMD21 | 32KB | 12 | WiFi LED projects |

---

## Cross-References

- [MCU Comparison](m2-mcu-comparison.md) -- Arduino vs ESP32 vs RP2040 vs PIC vs Raspberry Pi
- [WS2812B Protocol](m3-ws2812b-protocol.md) -- The protocol behind addressable LED strips
- [LED Libraries](m3-led-libraries.md) -- NeoPixel, FastLED, and WLED library comparison
- [MOSFET PWM Dimmers](m5-mosfet-pwm-dimmers.md) -- Driving high-power strips from Arduino
- [Resistor Calculations](m1-resistor-calculations.md) -- Calculating current-limiting resistors for GPIO-driven LEDs
- [ESP32 LED Control](m2-esp32-led.md) -- WiFi-enabled alternative with more PWM channels

---

*Sources: Arduino.cc reference documentation, ATmega328P datasheet (Microchip), Adafruit NeoPixel Uberguide, SparkFun Arduino PWM tutorial, Nick Gammon's timer and interrupt reference.*
