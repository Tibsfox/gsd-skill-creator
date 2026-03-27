# Microcontroller Platform Comparison

Choosing the right microcontroller for an LED project depends on the number of LEDs, required features (WiFi, precision timing, web interface), budget, and your comfort level with different programming environments. This page provides a comprehensive comparison of the five platforms covered in this series.

---

## Head-to-Head Comparison Table

| Feature | Arduino Uno | PIC16F877A | Raspberry Pi 4 | ESP32 | RP2040 (Pico) |
|---------|------------|-----------|----------------|-------|---------------|
| **CPU** | ATmega328P 16MHz | PIC 4-20MHz | BCM2711 1.5GHz x4 | Xtensa LX6 240MHz x2 | Cortex-M0+ 133MHz x2 |
| **Architecture** | 8-bit AVR | 8-bit PIC | 64-bit ARM | 32-bit Xtensa | 32-bit ARM |
| **SRAM** | 2 KB | 368 bytes | 1-8 GB | 520 KB | 264 KB |
| **Flash/Storage** | 32 KB | 14 KB | microSD (GB) | 4-16 MB | 2-16 MB |
| **GPIO Pins** | 14 digital + 6 analog | 33 I/O | 26 GPIO | 34 GPIO | 26 GPIO |
| **PWM Channels** | 6 (8-bit) | 2 (10-bit) | 2 HW + software | 16 (1-20 bit) | 16 (via PWM slices) |
| **Max PWM Freq** | ~62 kHz (Timer1) | ~100 kHz (20MHz osc) | ~40 kHz (pigpio) | 40 MHz | 62.5 MHz |
| **SPI** | 1 | 1 (MSSP) | 2 | 4 | 2 + PIO |
| **I2C** | 1 (Wire) | 1 (MSSP) | 2 | 2 | 2 + PIO |
| **WiFi** | No | No | Yes | Yes | Pico W only |
| **Bluetooth** | No | No | Yes | BLE 4.2 | Pico W (BLE) |
| **USB** | Serial (FTDI/CH340) | No (ICSP only) | 4x USB-A | Serial (CP2102) | Native USB |
| **DAC** | No | No | No (use I2S) | 2 x 8-bit | No |
| **ADC** | 6 x 10-bit | 8 x 10-bit | No (use MCP3008) | 18 x 12-bit | 3 x 12-bit |
| **DMA** | No | No | Yes | Yes | 12 channels |
| **Operating Temp** | -40 to +85 C | -40 to +125 C | 0 to +85 C | -40 to +85 C | -20 to +85 C |
| **Power (active)** | ~45 mA | ~2-10 mA | ~600 mA (idle) | ~80 mA (WiFi) | ~25 mA |
| **Deep Sleep** | ~0.35 mA | ~1 uA | ~100 mA | ~10 uA | ~1.3 mA (dormant) |
| **Unit Price** | $5-25 | $2-4 | $35-80 | $3-8 | $4-6 |
| **IDE** | Arduino IDE | MPLAB X | Any Linux editor | Arduino/PlatformIO | Arduino/MicroPython |
| **Language** | C++ (Arduino) | C (XC8) | Python, C, anything | C++ (Arduino), MicroPython | C/C++, MicroPython |
| **Ecosystem** | Massive hobbyist | Professional/industrial | Full Linux | Large, growing | Growing fast |

---

## LED-Specific Capabilities

### WS2812B (Addressable, Single-Wire) Support

| Platform | Method | CPU Blocking? | Max LEDs (RAM) | Practical Rating |
|----------|--------|--------------|----------------|-----------------|
| Arduino Uno | NeoPixel/FastLED (bit-bang) | Yes, interrupts disabled | ~100 | Fair |
| PIC16F877A | Manual bit-bang | Yes | ~15 (RAM limited) | Poor |
| Raspberry Pi | rpi_ws281x (DMA) or SPI | No (DMA) but tricky | Thousands | Fair |
| ESP32 | RMT peripheral | No | ~1700 | Excellent |
| RP2040 | PIO state machines | No | ~880 | Excellent |

### APA102 (Addressable, SPI) Support

| Platform | Method | CPU Blocking? | Max Clock | Practical Rating |
|----------|--------|--------------|-----------|-----------------|
| Arduino Uno | SPI or bit-bang | Minimal (SPI DMA: no) | 8 MHz (SPI) | Good |
| PIC16F877A | MSSP SPI | No (hardware SPI) | 5 MHz | Good |
| Raspberry Pi | SPI (/dev/spidev) | No | 32 MHz | Excellent |
| ESP32 | SPI (HSPI/VSPI) | No | 40 MHz | Excellent |
| RP2040 | SPI or PIO | No | 62 MHz | Excellent |

### Analog PWM (Non-Addressable Strips)

| Platform | Channels | Resolution | Smoothness | Practical Rating |
|----------|---------|-----------|-----------|-----------------|
| Arduino Uno | 6 x 8-bit | 256 steps | Adequate | Good |
| PIC16F877A | 2 x 10-bit | 1024 steps | Good | Fair (only 2 channels) |
| Raspberry Pi | 2 HW + many software | Variable | pigpio: excellent | Good |
| ESP32 | 16 x 1-20 bit | Up to 1M steps | Excellent | Excellent |
| RP2040 | 16 (8 slices x 2) | 16-bit | Excellent | Excellent |

---

## Best Platform by Project Type

### Simple Indicator LEDs / Learning

**Winner: Arduino Uno**

- Easiest to learn, most tutorials, largest community
- `analogWrite()` works out of the box
- Libraries for everything
- Perfect for: first LED projects, status indicators, small displays

See [Arduino LED Control](m2-arduino-led-control.md).

### Commercial/Industrial Products

**Winner: PIC**

- Lowest BOM cost ($1-2 per unit in volume)
- Widest operating temperature range (-40 to +125C)
- 30+ year production commitment from Microchip
- Industrial-grade reliability
- Perfect for: manufactured products, harsh environments, cost-sensitive designs

See [PIC XC8 PWM](m2-pic-xc8-pwm.md).

### Smart Home / WiFi-Connected Lighting

**Winner: ESP32**

- Built-in WiFi and BLE
- 16 hardware PWM channels (LEDC)
- RMT peripheral for WS2812B
- WLED firmware ready-to-flash
- MQTT, Home Assistant, Alexa, Google Home integration
- Perfect for: smart lighting, room automation, addressable LED installations

See [ESP32 LED Control](m2-esp32-led.md).

### High-Density Addressable LEDs / POV Displays

**Winner: RP2040**

- PIO state machines: hardware-timed LED protocols, zero CPU blocking
- 8 independent strip outputs simultaneously
- Dual-core: one for animation, one for I/O
- DMA: fire-and-forget LED updates
- Perfect for: POV displays, LED matrices, multi-strip installations, art projects

See [RP2040 PIO](m2-rp2040-pio.md).

### Central Controller / Web Dashboard / Scheduling

**Winner: Raspberry Pi**

- Full Linux OS: web servers, databases, cron jobs, logging
- Best for I2C expansion (PCA9685: 16+ PWM channels)
- SPI for APA102 strips
- Network services: MQTT broker, Home Assistant host
- Perfect for: central lighting controller, commercial installations, data logging

See [Raspberry Pi GPIO](m2-raspberry-pi-gpio.md).

---

## Price Comparison (Typical Full Project BOM)

### Project: 60-LED RGB Strip Controller

| Component | Arduino | PIC | Raspberry Pi | ESP32 | RP2040 |
|-----------|---------|-----|-------------|-------|--------|
| MCU board | $5 | $4 (+ $35 PICkit) | $45 | $5 | $4 |
| Level shifter | $1 | $1 | $1 | $1 | $1 |
| Power supply (5V 4A) | $8 | $8 | $8 | $8 | $8 |
| LED strip (60 WS2812B) | $10 | $10 | $10 | $10 | $10 |
| Misc (wires, caps, PCB) | $3 | $3 | $3 | $3 | $3 |
| **Total** | **$27** | **$26 (+$35)** | **$67** | **$27** | **$26** |

The ESP32 and RP2040 are price-competitive with Arduino while offering dramatically better capabilities. The Raspberry Pi is significantly more expensive and only justified when you need its computing power.

---

## Decision Flowchart

```
Start: What does your LED project need?
  |
  +-- WiFi/smart home?
  |     +-- Yes --> ESP32 (or WLED firmware)
  |     +-- No
  |           |
  |           +-- Multiple strips / POV display / precise timing?
  |           |     +-- Yes --> RP2040
  |           |     +-- No
  |           |           |
  |           |           +-- Web interface / scheduling / database?
  |           |           |     +-- Yes --> Raspberry Pi
  |           |           |     +-- No
  |           |           |           |
  |           |           |           +-- Volume manufacturing?
  |           |           |           |     +-- Yes --> PIC
  |           |           |           |     +-- No --> Arduino
```

---

## Software Ecosystem Comparison

| Feature | Arduino | PIC (XC8) | Raspberry Pi | ESP32 | RP2040 |
|---------|---------|-----------|-------------|-------|--------|
| LED libraries | NeoPixel, FastLED | Manual | rpi_ws281x, pigpio | NeoPixel, FastLED | PIO programs, NeoPixel |
| WLED support | No (use ESP) | No | No (use ESP) | Yes (primary) | Partial (Pico W) |
| Home Assistant | Via ESP bridge | No | Native | Direct (MQTT/API) | Via Pico W |
| OTA updates | Manual (serial) | ICSP only | SSH/apt | WiFi OTA | UF2 USB drag-drop |
| Debug tools | Serial.print() | MPLAB debugger | Full Linux tools | Serial + WiFi | SWD, Serial, picoprobe |
| Package manager | Arduino Library Manager | Microchip MPLAB | pip, apt | PlatformIO/Arduino | pip (MicroPython) |

---

## Power Consumption Comparison

Critical for battery-powered LED projects:

| Platform | Active (no WiFi) | Active (WiFi TX) | Light Sleep | Deep Sleep |
|----------|-----------------|-------------------|-------------|------------|
| Arduino Uno | 45 mA | N/A | 15 mA (idle) | 0.35 mA (power-down) |
| PIC16F877A | 2 mA (4MHz) | N/A | 25 uA | 1 uA |
| Raspberry Pi 4 | 575 mA | 600 mA | N/A | ~100 mA (no true sleep) |
| ESP32 | 40 mA | 120-240 mA | 0.8 mA | 10 uA |
| RP2040 | 25 mA | 40 mA (Pico W) | ~3 mA | 1.3 mA (dormant) |

For battery-powered LED wearables or portable installations, ESP32 with deep sleep between updates, or PIC for ultra-low-power indicators, are the best choices.

---

## Migration Path

Many projects evolve from one platform to another:

1. **Arduino** (prototype, learn) --> **ESP32** (add WiFi, more LEDs)
2. **Arduino** (prototype) --> **RP2040** (need PIO, more RAM, faster)
3. **ESP32** (prototype) --> **PIC** (cost-reduce for manufacturing)
4. **Raspberry Pi** (central controller) + **ESP32** nodes (each room/zone)

The Arduino framework runs on ESP32 and RP2040, so code migration is relatively straightforward. PIC requires rewriting in XC8 C. Raspberry Pi uses Python, which is different from everything else but often serves as the hub in a multi-platform system.

---

## Cross-References

- [Arduino LED Control](m2-arduino-led-control.md) -- Arduino PWM, timers, and direct port manipulation
- [PIC XC8 PWM](m2-pic-xc8-pwm.md) -- PIC16F877A CCP module and register-level programming
- [Raspberry Pi GPIO](m2-raspberry-pi-gpio.md) -- pigpio, I2C expansion, web interfaces
- [ESP32 LED Control](m2-esp32-led.md) -- LEDC, WiFi, RMT for addressable LEDs
- [RP2040 PIO](m2-rp2040-pio.md) -- PIO state machines for precise LED timing
- [LED Fundamentals](m1-led-fundamentals.md) -- Understanding what you are driving

---

*Sources: ATmega328P datasheet (Microchip), PIC16F877A datasheet (Microchip), BCM2711 datasheet (Broadcom), ESP32 Technical Reference Manual (Espressif), RP2040 Datasheet (Raspberry Pi Ltd), SparkFun and Adafruit product specifications, WLED project documentation.*
