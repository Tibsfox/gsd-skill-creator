# Source Index — Smart Home Technologies & DIY Electronics

All technical claims in this research series trace to one of the authoritative sources below. Source IDs are used throughout all modules for citation.

---

## Standards Bodies & Government Agencies

| ID | Organization | Document / Resource | Domain |
|----|-------------|---------------------|--------|
| SRC-NFPA | National Fire Protection Association | *NFPA 70: National Electrical Code (NEC)*, 2023 edition | Electrical installation safety |
| SRC-NEC-725 | NFPA | NEC Article 725: Class 1, Class 2, and Class 3 Remote-Control, Signaling, and Power-Limited Circuits | Low-voltage vs. line-voltage boundary |
| SRC-NEC-210 | NFPA | NEC Article 210.8: GFCI Protection Requirements (2023 expansion) | Ground-fault protection |
| SRC-NEC-314 | NFPA | NEC Article 314.16: Box Fill Calculations | Junction box conductor fill |
| SRC-NEC-230 | NFPA | NEC Article 230.67/230.85: SPD and Emergency Disconnect | Surge protection, emergency shutoff |
| SRC-UL | UL Solutions | *UL 2900 Series: Software Cybersecurity for Network-Connectable Products* | IoT device security certification |
| SRC-UL-IOT | UL Solutions | *UL Verified IoT Device Security Rating* | Consumer IoT security rating |
| SRC-IEEE-1584 | IEEE | *IEEE 1584: Guide for Performing Arc-Flash Hazard Calculations* | Electrical safety standards |
| SRC-IEEE-1100 | IEEE | *IEEE 1100: Recommended Practice for Powering and Grounding Electronic Equipment* | Power quality, grounding |
| SRC-ETSI | ETSI | *EN 303 645: Cyber Security for Consumer Internet of Things* | European IoT baseline security |
| SRC-FCC | Federal Communications Commission | *47 CFR Part 15: Radio Frequency Devices* | RF emission compliance |
| SRC-ESFI | Electrical Safety Foundation International | *The National Electrical Code* educational resources | Consumer electrical safety |

## Protocol Specifications & Alliances

| ID | Organization | Document / Resource | Domain |
|----|-------------|---------------------|--------|
| SRC-CSA | Connectivity Standards Alliance | *Matter Specification v1.5*, November 2025 | Smart home interoperability standard |
| SRC-THREAD | Thread Group | *Thread 1.4 Specification* | Low-power mesh networking (802.15.4) |
| SRC-ZWAVE | Z-Wave Alliance | *Z-Wave Protocol Specification* | Sub-GHz mesh protocol (908.42 MHz NA) |
| SRC-ZIGBEE | Zigbee Alliance / CSA | *Zigbee 3.0 Specification* (IEEE 802.15.4) | 2.4 GHz mesh networking |
| SRC-MQTT | OASIS | *MQTT Version 5.0*, March 2019 | Publish/subscribe messaging protocol |
| SRC-OWASP | OWASP Foundation | *IoT Top 10* vulnerability categories | IoT security guidelines |
| SRC-BLE | Bluetooth SIG | *Bluetooth Core Specification v5.4* | Low Energy wireless communication |

## Open-Source Platforms & Documentation

| ID | Organization | Document / Resource | Domain |
|----|-------------|---------------------|--------|
| SRC-HA | Home Assistant | *Official Documentation* — home-assistant.io/docs/ | Open-source home automation platform |
| SRC-ESPH | ESPHome | *Official Documentation* — esphome.io/ | ESP32/ESP8266 firmware framework |
| SRC-ESP32 | Espressif Systems | *ESP32 Technical Reference Manual* | Microcontroller hardware reference |
| SRC-ESP8266 | Espressif Systems | *ESP8266 Technical Reference* | Legacy Wi-Fi microcontroller |
| SRC-RPI | Raspberry Pi Foundation | *Raspberry Pi Documentation* — raspberrypi.com/documentation/ | Single-board computer platform |
| SRC-ARD | Arduino | *Arduino Reference* — arduino.cc/reference/ | Microcontroller learning platform |
| SRC-NODERED | OpenJS Foundation | *Node-RED Documentation* — nodered.org/docs/ | Visual flow-based programming |
| SRC-OEM | Open Energy Monitor | *Learn: Electricity Monitoring* — learn.openenergymonitor.org/ | Energy monitoring reference designs |
| SRC-CIRCUIT | CircuitSetup | *Split Single Phase Energy Meter* — circuitsetup.us/ | ATM90E32 energy metering reference |
| SRC-MOSQ | Eclipse Foundation | *Eclipse Mosquitto* — mosquitto.org/ | Open-source MQTT broker |

## Educational Resources

| ID | Organization | Document / Resource | Domain |
|----|-------------|---------------------|--------|
| SRC-ETUT | Electronics Tutorials | *Basic Electronics Tutorials* — electronics-tutorials.ws/ | Foundational circuit theory |
| SRC-CUB | University of Colorado Boulder | *ECEA 5340: Sensors and Sensor Circuit Design* (Coursera) | Sensor circuit design course |
| SRC-CMU | Carnegie Mellon University | *24-251: Electronics for Sensing and Actuation* | Sensing and actuation course |
| SRC-HACK | Hackster.io | *Community Hardware Projects* — hackster.io/ | Community project reference |
| SRC-INST | Instructables | *DIY Electronics and Smart Home Projects* — instructables.com/ | Community project reference |
| SRC-KICAD | KiCad | *KiCad EDA Documentation* — docs.kicad.org/ | Open-source PCB design tool |

## Component Datasheets (Referenced by Part Number)

| Part | Manufacturer | Key Specs | Used In |
|------|-------------|-----------|---------|
| ESP32-WROOM-32E | Espressif | Dual-core 240 MHz, Wi-Fi + BLE, 34 GPIO | Projects 7-36 |
| ESP8266 (ESP-12F) | Espressif | Single 80 MHz, Wi-Fi, 17 GPIO | Legacy/budget projects |
| ATmega328P | Microchip | 16 MHz, 20 GPIO, 5V logic | Projects 1-6 (Arduino) |
| RP2040 | Raspberry Pi | Dual Cortex-M0+, 133 MHz, 26 GPIO | Pi Pico projects |
| DHT11 | Aosong | Temp +/-2C, Humidity +/-5%, 1-wire | Projects 4, 8 |
| DHT22/AM2302 | Aosong | Temp +/-0.5C, Humidity +/-2%, 1-wire | Projects 14, 16 |
| BME280 | Bosch | Temp/Hum/Press, I2C/SPI, +/-1C | Projects 7, 24 |
| DS18B20 | Maxim/Analog | Temp +/-0.5C, 1-Wire, waterproof | Projects 21 |
| SHT31 | Sensirion | Temp +/-0.3C, Hum +/-2%, I2C | Precision applications |
| HC-SR501 | Generic | PIR, 3-7m range, digital output | Projects 10, 30 |
| LD2410 | HiLink | 24 GHz mmWave, presence + motion, UART | Project 30 |
| SCT-013-000 | YHDC | 100A CT clamp, analog output | Projects 19, 29, 35 |
| ACS712 | Allegro | Hall-effect current, inline, +/-5/20/30A | Inline measurement |
| BH1750 | ROHM | I2C lux meter, 1-65535 lx | Light-level automation |
| MQ-2 | Winsen | Combustible gas, analog, requires pre-heat | Gas safety projects |
| SRD-05VDC-SL-C | Songle | 5V coil, 10A 250VAC contacts, SPDT | Projects 9, 13, 14, 18 |
| SSR-25DA | Fotek-style | 3-32V DC control, 25A 240VAC load | High-frequency switching |
| SG90 | TowerPro | Micro servo, 180 deg, 1.8 kg-cm | Projects 6, 15 |
| WS2812B | WorldSemi | Addressable RGB, 5V, 1-wire data | Project 20 |
| 28BYJ-48 | Generic | 5V stepper, ULN2003 driver, 2048 steps | Curtain/blind projects |
| ATM90E32 | Microchip | 3-phase energy metering IC, SPI | Projects 19, 29, 35 |
| TP4056 | NanJing Top Power | Li-ion charger, 1A, with DW01 protection | Battery projects |
| CC2652 | Texas Instruments | Zigbee 3.0 + Thread coordinator, USB | Project 27, 31 |
| IRLZ44N | Infineon | Logic-level N-MOSFET, 55V/47A, Rds 22mOhm | LED/motor switching |
| 1N4007 | Generic | Rectifier diode, 1A 1000V | Flyback protection |
| 1N5819 | Generic | Schottky diode, 1A 40V, low Vf | Power path protection |

---

## Safety Source Requirements

All safety callouts in this research series must trace to one of these source categories:

- **Electrical safety**: SRC-NFPA, SRC-NEC-*, SRC-IEEE-*, SRC-ESFI
- **IoT/cyber security**: SRC-ETSI, SRC-UL, SRC-OWASP
- **RF compliance**: SRC-FCC
- **Battery safety**: Component datasheets (TP4056, DW01)
- **Platform security**: SRC-HA, SRC-ESPH (OTA, API encryption docs)

No safety claim may cite community sources (SRC-HACK, SRC-INST) as primary authority. Community sources may illustrate techniques but safety boundaries come from standards bodies only.
