# Component Catalog — Smart Home Technologies & DIY Electronics

Master catalog of all components used across the 36 student projects. Organized by category with specifications, typical costs, and project references.

---

## 1. Microcontroller Platforms

### 1.1 ESP32 (ESP32-WROOM-32E)

The primary platform for this curriculum. Wi-Fi and BLE built in, dual-core at 240 MHz, 34 GPIO pins, extensive library support through Arduino framework and ESPHome.

| Specification | Value |
|--------------|-------|
| Processor | Xtensa LX6 dual-core, 240 MHz |
| Flash | 4 MB (typical modules) |
| SRAM | 520 KB |
| Wi-Fi | 802.11 b/g/n, 2.4 GHz |
| Bluetooth | BLE 4.2 (v5.0 on ESP32-C3/S3) |
| GPIO | 34 pins (some input-only: 34, 35, 36, 39) |
| ADC | 2x 12-bit SAR ADC, 18 channels |
| DAC | 2x 8-bit DAC (GPIO 25, 26) |
| PWM | 16 channels (LED PWM controller) |
| I2C | 2 buses |
| SPI | 3 interfaces (HSPI, VSPI + flash) |
| UART | 3 interfaces |
| Operating Voltage | 3.3V logic (5V tolerant on VIN with regulator) |
| Current Draw | ~80 mA (Wi-Fi active), ~10 uA (deep sleep) |
| Typical Cost | $3-8 (dev board) |
| Datasheet | SRC-ESP32 |

**Critical Notes:**
- GPIO 6-11 are connected to internal flash — do not use
- ADC2 cannot be used while Wi-Fi is active — use ADC1 channels for sensor readings
- 3.3V logic level — use level shifters for 5V sensors/actuators
- Boot mode pins (GPIO 0, 2, 12, 15) have constraints during startup [SRC-ESP32]

**Used in:** Projects 7-36 (primary platform from Tier 2 onward)

### 1.2 ESP8266 (ESP-12F / NodeMCU)

Legacy platform, still useful for simple single-sensor nodes where BLE is not needed.

| Specification | Value |
|--------------|-------|
| Processor | Xtensa LX106, 80 MHz (overclock 160) |
| Flash | 4 MB |
| SRAM | 80 KB (usable ~50 KB) |
| Wi-Fi | 802.11 b/g/n, 2.4 GHz |
| GPIO | 17 pins (many shared with functions) |
| ADC | 1x 10-bit (0-1V range) |
| Operating Voltage | 3.3V |
| Current Draw | ~70 mA (Wi-Fi active) |
| Typical Cost | $2-4 |
| Datasheet | SRC-ESP8266 |

**Used in:** Budget sensor nodes, legacy reference

### 1.3 Arduino Uno (ATmega328P)

The learning platform for electronics fundamentals. No wireless — focuses on circuit theory without network complexity.

| Specification | Value |
|--------------|-------|
| Processor | ATmega328P, 16 MHz |
| Flash | 32 KB (0.5 KB bootloader) |
| SRAM | 2 KB |
| GPIO | 20 pins (14 digital + 6 analog) |
| ADC | 6x 10-bit channels |
| PWM | 6 pins |
| Operating Voltage | 5V logic |
| Current per GPIO | 20 mA (40 mA absolute max) |
| Typical Cost | $4-12 (clone/official) |
| Datasheet | SRC-ARD |

**Critical Notes:**
- 5V logic — many modern sensors are 3.3V; may need level shifting
- Total current from all GPIO must not exceed 200 mA [SRC-ARD]
- No built-in wireless — add shields for connectivity (adds cost/complexity)

**Used in:** Projects 1-6 (Tier 1), Project 15 (RFID lock)

### 1.4 Arduino Nano (ATmega328P)

Same processor as Uno in a compact form factor. Breadboard-friendly.

| Specification | Value |
|--------------|-------|
| Form Factor | 18x45 mm, breadboard-compatible |
| GPIO | 22 pins (14 digital + 8 analog) |
| Typical Cost | $3-8 |

**Used in:** Compact Tier 1 projects, prototyping

### 1.5 Raspberry Pi 5

Full Linux computer for hub roles, camera processing, and complex integrations.

| Specification | Value |
|--------------|-------|
| Processor | Broadcom BCM2712, Quad Cortex-A76, 2.4 GHz |
| RAM | 4 GB / 8 GB LPDDR4X |
| Storage | microSD / NVMe via HAT |
| Connectivity | Wi-Fi 5, BLE 5.0, Gigabit Ethernet |
| GPIO | 40-pin header (26 GPIO) |
| USB | 2x USB 3.0, 2x USB 2.0 |
| Video | 2x micro-HDMI (4K60) |
| Power | 5V/5A USB-C (27W PD) |
| Typical Cost | $60-80 |
| Datasheet | SRC-RPI |

**Used in:** Projects 22 (camera), 25 (mirror), 26 (voice), 28 (Node-RED), 31 (home hub), 33 (AI doorbell), 34 (audio)

### 1.6 Raspberry Pi Pico (RP2040)

Microcontroller board (not Linux). Good for real-time control tasks.

| Specification | Value |
|--------------|-------|
| Processor | Dual Cortex-M0+, 133 MHz |
| Flash | 2 MB |
| SRAM | 264 KB |
| GPIO | 26 multi-function pins |
| ADC | 3x 12-bit + internal temp sensor |
| Connectivity | None (Pico W adds Wi-Fi) |
| Typical Cost | $4 (Pico), $6 (Pico W) |
| Datasheet | SRC-RPI |

### 1.7 XIAO ESP32-C3/S3

Ultra-compact ESP32 variant for space-constrained sensor nodes.

| Specification | Value |
|--------------|-------|
| Processor | RISC-V (C3) or Xtensa LX7 (S3) |
| GPIO | 11 pins |
| Size | 21x17.5 mm |
| Connectivity | Wi-Fi + BLE |
| Typical Cost | $5-7 |

**Used in:** Project 16 (humidifier), compact sensor nodes

### 1.8 ATtiny85

Minimal 8-pin microcontroller for dedicated single-task applications.

| Specification | Value |
|--------------|-------|
| Processor | AVR, 8 MHz (internal) / 20 MHz (external) |
| Flash | 8 KB |
| GPIO | 6 pins (5 usable with reset) |
| ADC | 4x 10-bit |
| Typical Cost | $1-2 |

---

## 2. Temperature & Humidity Sensors

| Sensor | Type | Interface | Accuracy | Voltage | Cost | Projects |
|--------|------|-----------|----------|---------|------|----------|
| DHT11 | Temp + Humidity | 1-wire digital | +/-2C, +/-5%RH | 3.3-5V | $1 | 4, 16 |
| DHT22/AM2302 | Temp + Humidity | 1-wire digital | +/-0.5C, +/-2%RH | 3.3-5V | $3 | 8, 14 |
| BME280 | Temp + Hum + Press | I2C / SPI | +/-1C, +/-3%RH | 3.3V | $4 | 7, 24 |
| DS18B20 | Temperature | 1-Wire (Dallas) | +/-0.5C | 3.0-5.5V | $2 | 21 |
| SHT31 | Temp + Humidity | I2C | +/-0.3C, +/-2%RH | 2.4-5.5V | $5 | Precision |
| NTC Thermistor | Temperature | Analog (divider) | Varies by calibration | Any | $0.10 | Learning |

**Selection Guide:**
- **Beginner/cheap:** DHT11 (slow 2s sampling, adequate for room temp)
- **General purpose:** DHT22 (better accuracy, still simple 1-wire interface)
- **Weather station:** BME280 (adds barometric pressure, I2C bus allows daisy-chaining)
- **Waterproof/outdoor:** DS18B20 (stainless probe, chainable on single wire)
- **High precision:** SHT31 (fastest response, most accurate, I2C)

---

## 3. Motion & Presence Sensors

| Sensor | Technology | Range | Interface | Cost | Projects |
|--------|-----------|-------|-----------|------|----------|
| HC-SR501 | Passive Infrared (PIR) | 3-7 m, 120 deg | Digital (HIGH/LOW) | $1 | 10, 30 |
| RCWL-0516 | Microwave Doppler | 5-9 m, 360 deg | Digital | $1 | Through-wall |
| LD2410 | 24 GHz mmWave | 0.2-6 m | UART (JSON) | $4 | 30 |
| HC-SR04 | Ultrasonic | 2-400 cm | Trigger/Echo (digital) | $1 | Distance |
| VL53L0X | Laser Time-of-Flight | 0-200 cm | I2C | $4 | Precision distance |

**Selection Guide:**
- **Security/lighting:** HC-SR501 PIR (cheap, reliable, motion only)
- **Occupancy (stationary):** LD2410 mmWave (detects breathing, not just movement)
- **Through-wall:** RCWL-0516 microwave (works through thin walls, plastic enclosures)
- **Distance measurement:** HC-SR04 (cheap) or VL53L0X (precise, I2C)

---

## 4. Light, Gas, Current & Environmental Sensors

### Light Sensors

| Sensor | Type | Interface | Range | Cost |
|--------|------|-----------|-------|------|
| LDR (photoresistor) | Analog | Voltage divider | Relative only | $0.10 |
| BH1750 | Digital lux meter | I2C | 1-65535 lx | $2 |
| TSL2591 | Full-spectrum + IR | I2C | 188 ulux - 88K lux | $6 |

### Gas Sensors

| Sensor | Detects | Interface | Pre-heat | Cost |
|--------|---------|-----------|----------|------|
| MQ-2 | Combustible gas, smoke | Analog | 24-48 hours | $2 |
| MQ-7 | Carbon monoxide | Analog | Requires cycling | $2 |
| MQ-135 | Air quality (CO2 proxy) | Analog | 24-48 hours | $2 |
| SCD40/SCD41 | True CO2 (NDIR) | I2C | None | $30 |

> **SAFETY [SC-SRC]:** MQ-series sensors are indicative only. They cannot replace certified CO/gas detectors for life safety. Never use DIY gas sensors as the sole detection method. Always maintain UL-listed detectors per NFPA 720. [SRC-NFPA]

### Current Sensors

| Sensor | Type | Range | Interface | Cost |
|--------|------|-------|-----------|------|
| SCT-013-000 | Split-core CT clamp | 0-100A AC | Analog (voltage output) | $8 |
| SCT-013-030 | Split-core CT clamp | 0-30A AC | Analog (current output) | $8 |
| ACS712 | Hall-effect (inline) | +/-5/20/30A | Analog | $3 |

**CT Clamp Safety:** SCT-013 clamps around existing wiring without breaking the circuit. This is the ONLY safe method for students to measure AC current — no wire cutting, no exposed conductors. [SRC-NFPA, SRC-OEM]

### Water & Soil Sensors

| Sensor | Type | Interface | Cost | Notes |
|--------|------|-----------|------|-------|
| Capacitive soil | Soil moisture | Analog | $1 | Corrosion-resistant (preferred) |
| Resistive soil | Soil moisture | Analog | $0.50 | Corrodes quickly (learning only) |
| YF-S201 | Water flow | Pulse (digital) | $4 | Hall-effect, 1-30 L/min |

---

## 5. Actuators

### 5.1 Relays

| Part | Type | Coil | Load Rating | Cost | Notes |
|------|------|------|-------------|------|-------|
| SRD-05VDC-SL-C | Mechanical | 5V, ~70 mA | 10A @ 250VAC | $1 | Standard; needs transistor driver |
| SSR-25DA | Solid-state | 3-32V DC | 25A @ 240VAC | $4 | Zero-cross, silent, no flyback needed |
| 2-channel module | Mechanical | 5V, opto-isolated | 10A @ 250VAC | $3 | Pre-built with transistor + flyback |

> **SAFETY [SC-REL]:** Never drive mechanical relay coils directly from microcontroller GPIO. The coil draws 70+ mA (GPIO max is 20-40 mA) and generates inductive kickback that destroys microcontrollers. Always use: NPN transistor (2N2222) or N-MOSFET (IRLZ44N) + 1N4007 flyback diode across the coil. [SRC-ARD, SRC-ESP32]

> **SAFETY [SC-MAINS]:** Any relay switching 120V AC loads requires: approved junction box, proper wire gauge (14 AWG min for 15A circuit), wire nuts or Wago lever connectors, strain relief, and GFCI protection if in kitchen/bath/garage/outdoor location. NEC Article 725 defines the boundary between Class 2 (safe low-voltage) and line-voltage wiring. [SRC-NFPA, SRC-NEC-725]

### 5.2 Servo Motors

| Part | Type | Torque | Angle | Signal | Cost |
|------|------|--------|-------|--------|------|
| SG90 | Micro | 1.8 kg-cm | 180 deg | 50 Hz PWM, 1-2 ms | $2 |
| MG996R | Standard | 11 kg-cm | 180 deg | 50 Hz PWM, 1-2 ms | $5 |

**Critical Notes:**
- Power servos from a separate 5V supply, NOT from the microcontroller's 5V pin
- Add a 100-470 uF capacitor across the servo power leads to absorb current spikes
- Servo signal is 3.3V compatible (works directly with ESP32)

### 5.3 Stepper Motors

| Part | Type | Steps/Rev | Driver | Voltage | Cost |
|------|------|-----------|--------|---------|------|
| 28BYJ-48 | Unipolar | 2048 (half-step) | ULN2003 | 5V | $3 (with driver) |
| NEMA 17 | Bipolar | 200 (1.8 deg) | A4988 or DRV8825 | 12V | $10 (with driver) |

### 5.4 LED Drivers & Strips

| Part | Type | Protocol | Voltage | Cost |
|------|------|----------|---------|------|
| WS2812B strip | Addressable RGB | 1-wire data (800 kHz) | 5V | $5/m |
| SK6812 strip | Addressable RGBW | 1-wire data | 5V | $7/m |
| 12V LED strip | Non-addressable | PWM via MOSFET | 12V | $3/m |
| IRLZ44N | N-MOSFET for LED/motor | Logic-level gate | Up to 55V | $0.50 |

**Power Budget:** WS2812B draws up to 60 mA per LED at full white. A 60-LED/m strip at 1 meter = 3.6A at 5V = 18W. Use an appropriately rated power supply with power injection every 0.5m for long runs. [SRC-ESP32]

### 5.5 Solenoids & Locks

| Part | Type | Voltage | Current | Cost |
|------|------|---------|---------|------|
| 12V push-pull solenoid | Linear | 12V | 300-500 mA | $4 |
| 12V solenoid lock | Door lock | 12V | 350 mA | $6 |

> **SAFETY [SC-FLY]:** All solenoids and relay coils are inductive loads. A flyback diode (1N4007) MUST be placed across the coil (cathode to positive) to absorb the voltage spike when current is switched off. Without it, the spike (often >100V) will destroy the switching transistor or MOSFET. [SRC-ETUT]

### 5.6 Displays

| Part | Type | Interface | Resolution | Cost |
|------|------|-----------|------------|------|
| 0.96" OLED | SSD1306 | I2C | 128x64 | $3 |
| 1.3" OLED | SH1106 | I2C | 128x64 | $4 |
| 2.4" TFT | ILI9341 | SPI | 320x240 | $6 |
| 16x2 LCD | HD44780 | I2C adapter | 16 chars x 2 lines | $3 |

### 5.7 Audio

| Part | Type | Interface | Cost |
|------|------|-----------|------|
| Passive buzzer | Tone generator | PWM | $0.20 |
| Active buzzer | Fixed tone | Digital HIGH | $0.30 |
| MAX98357A | I2S DAC + amplifier | I2S | $4 |
| Speaker (3W 4ohm) | Audio output | Amplifier driven | $2 |

---

## 6. Passive Components

| Component | Common Values | Purpose | Cost |
|-----------|--------------|---------|------|
| Resistors (1/4W) | 220, 330, 1K, 4.7K, 10K ohm | Current limiting, pull-up/down, voltage dividers | $0.01 |
| Ceramic capacitors | 100 nF (0.1 uF) | Decoupling (one per IC, close to VCC/GND) | $0.02 |
| Electrolytic capacitors | 10, 47, 100, 470 uF | Bulk filtering, servo spike absorption | $0.05-0.20 |
| 1N4007 diode | 1A, 1000V rectifier | Flyback protection across inductive loads | $0.02 |
| 1N5819 Schottky | 1A, 40V, low Vf | Power path protection, low-drop rectification | $0.05 |
| 2N2222 NPN transistor | 600 mA, 40V | Small load switching (relay coils, LEDs) | $0.05 |
| 2N3906 PNP transistor | 200 mA, 40V | High-side switching | $0.05 |
| IRLZ44N N-MOSFET | 47A, 55V, logic-level | LED strips, motors, high-current DC loads | $0.50 |
| LM7805 regulator | 5V, 1A linear | 12V to 5V conversion (wastes heat) | $0.30 |
| AMS1117-3.3 regulator | 3.3V, 1A linear | 5V to 3.3V for ESP32 modules | $0.20 |
| TP4056 module | Li-ion charger, 1A | Battery charging with DW01 protection | $0.50 |

---

## 7. Communication Modules

| Module | Protocol | Interface | Cost | Notes |
|--------|----------|-----------|------|-------|
| CC2652 USB dongle | Zigbee 3.0 + Thread | USB (Zigbee2MQTT) | $15 | Standard open-source coordinator |
| nRF24L01+ | 2.4 GHz proprietary | SPI | $1 | Point-to-point, not standard protocol |
| LoRa SX1276/SX1278 | LoRa (868/915 MHz) | SPI | $5 | Long range, low data rate |
| 433 MHz TX/RX | ASK/OOK modulation | Digital | $1 | Simple one-way, legacy devices |
| RC522 | RFID/NFC (13.56 MHz) | SPI | $2 | Mifare Classic, access control |
| IR LED + TSOP38238 | Infrared (38 kHz) | Digital | $0.50 | Remote control protocols |

---

## 8. Power Supplies & Regulation

| Supply | Output | Current | Use Case | Cost |
|--------|--------|---------|----------|------|
| USB charger (5V) | 5V | 1-3A | ESP32 dev boards, Pi Pico | $3-8 |
| USB-C PD (27W) | 5V/5A | 5A | Raspberry Pi 5 | $10 |
| 12V DC adapter | 12V | 2-5A | LED strips, relays, motors | $5-10 |
| Mean Well LRS-50-5 | 5V | 10A | Long LED strip installations | $12 |
| 18650 Li-ion cell | 3.7V nominal | 2000-3500 mAh | Battery-powered sensors | $3-5 |
| TP4056 + DW01 | Charger + protection | 1A charge | Battery charging (mandatory) | $0.50 |

> **SAFETY [SC-BAT]:** Lithium-ion batteries require a charge controller with overcharge, over-discharge, and short-circuit protection. TP4056 with DW01 protection IC is the minimum. Never charge Li-ion cells without a proper controller. Never exceed rated charge current. Store in fireproof container during charging. [SRC-ESP32]

---

## 9. Tools & Equipment

### Essential (Projects 1-12)

| Tool | Purpose | Cost |
|------|---------|------|
| Half-size breadboard | Prototyping without soldering | $3 |
| Jumper wire kit (M-M, M-F, F-F) | Breadboard connections | $4 |
| USB cable (micro-B or C) | Programming and power | $2 |
| Digital multimeter | Voltage, current, resistance, continuity | $15-30 |

### Intermediate (Projects 13-24)

| Tool | Purpose | Cost |
|------|---------|------|
| Soldering iron (temp-controlled) | Permanent connections | $25-50 |
| Solder (60/40 or lead-free) | Solder joints | $5 |
| Wire strippers (22-30 AWG) | Signal wire preparation | $8 |
| Heat shrink tubing assortment | Insulation, strain relief | $5 |
| Flush cutters | Lead trimming | $5 |

### Advanced (Projects 25-36)

| Tool | Purpose | Cost |
|------|---------|------|
| Oscilloscope (entry-level) | Signal debugging, I2C/SPI analysis | $50-300 |
| Logic analyzer (8-ch) | Digital protocol debugging | $10 |
| Hot air station | SMD rework, PCB assembly | $40-80 |
| 3D printer (FDL) | Enclosures, mounts | $150+ |

---

## 10. Starter Kit Recommendations

### Tier 1 Kit (~$30)

Covers Projects 1-6:
- Arduino Uno clone ($4) + USB cable ($2)
- Half-size breadboard ($3) + jumper kit ($4)
- LED assortment: red, green, yellow, RGB ($2)
- Resistor kit: 220, 330, 1K, 4.7K, 10K ($2)
- DHT11 sensor ($1), LDR x3 ($0.30), push buttons x5 ($0.50)
- SG90 servo ($2), passive buzzer ($0.20)
- Digital multimeter ($10)

### Tier 2-3 Kit (add ~$50)

Covers Projects 7-18:
- ESP32 dev board x2 ($10)
- BME280 ($4), DHT22 ($3), HC-SR501 PIR ($1)
- 5V relay module 2-channel ($3)
- 0.96" OLED display ($3)
- WS2812B strip 0.5m ($3)
- LDR, buttons, capacitors, transistors assortment ($5)
- Soldering iron + solder ($30)

### Tier 4-6 Kit (add ~$100)

Covers Projects 19-36:
- Raspberry Pi 5 4GB ($60)
- SCT-013 CT clamp ($8)
- CC2652 Zigbee dongle ($15)
- DS18B20 waterproof x3 ($6)
- LD2410 mmWave sensor ($4)
- Capacitive soil sensor x2 ($2)
- Pi Camera Module ($15)
