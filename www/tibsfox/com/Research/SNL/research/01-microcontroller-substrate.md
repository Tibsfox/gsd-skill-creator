# Microcontroller Substrate

> **Domain:** Embedded Systems Engineering
> **Module:** 1 -- Sensing-Focused Microcontroller Platforms and Signal Conditioning
> **Through-line:** *The microcontroller is the translator standing at the border between the analog world and the digital mesh.* Every atmospheric pressure reading, every photon count from a UV sensor, every wind gust captured by an anemometer passes through this silicon bottleneck. Choosing the right translator -- with the right ADC resolution, the right bus speed, the right power budget -- determines whether the sensing layer whispers truth or noise.

---

## Table of Contents

1. [The Field Node Problem](#1-the-field-node-problem)
2. [Platform Comparison Matrix](#2-platform-comparison-matrix)
3. [Arduino Uno and Nano: The Reference Platform](#3-arduino-uno-and-nano-the-reference-platform)
4. [ESP8266: WiFi-Native Sensing](#4-esp8266-wifi-native-sensing)
5. [ESP32: The Swiss Army Knife](#5-esp32-the-swiss-army-knife)
6. [Raspberry Pi Pico and Pico 2](#6-raspberry-pi-pico-and-pico-2)
7. [ADC Linearity Characterization](#7-adc-linearity-characterization)
8. [The PIO-DAC Record](#8-the-pio-dac-record)
9. [Low-Power Amplifier Selection](#9-low-power-amplifier-selection)
10. [Power Budget Analysis for Field Nodes](#10-power-budget-analysis-for-field-nodes)
11. [Solar Power Systems](#11-solar-power-systems)
12. [Bus Protocols for Sensor Integration](#12-bus-protocols-for-sensor-integration)
13. [DMA and FIFO Buffering Patterns](#13-dma-and-fifo-buffering-patterns)
14. [Platform Selection Decision Tree](#14-platform-selection-decision-tree)
15. [Cross-References](#15-cross-references)
16. [Sources](#16-sources)

---

## 1. The Field Node Problem

A sensing layer field node must solve five simultaneous constraints: analog fidelity, communication range, power endurance, physical robustness, and cost. No single microcontroller optimizes all five. The architecture decision is always a tradeoff, and the tradeoff matrix changes depending on whether the node is a solar-powered weather station on a ridgeline, a POV display at a Burning Man camp, or a BOINC gateway in a garage.

The Amiga Principle applies directly: just as Agnus handled DMA scheduling while Denise managed video output and Paula owned audio, a well-designed field node delegates sensing to the ADC subsystem, communication to the radio peripheral, and timing to a dedicated RTC or GPS PPS source. The main CPU orchestrates but does not bottleneck.

### Field Node Taxonomy

```
FIELD NODE CLASSES
================================================================

Class 1: SENTINEL (Weather Station)
  Constraints: Ultra-low power, solar, outdoor, 6-month autonomy
  Priority:    Power > Range > Cost > Fidelity > Speed
  Typical:     ESP8266 + BME280 + LoRa + solar panel

Class 2: OBSERVER (Environmental Monitor)
  Constraints: Multi-sensor, moderate power, WiFi or LoRa
  Priority:    Fidelity > Range > Power > Cost > Speed
  Typical:     ESP32 + ADS1115 + sensor array + battery

Class 3: PERFORMER (LED/POV Display)
  Constraints: High-speed I/O, USB power, real-time timing
  Priority:    Speed > Fidelity > Cost > Power > Range
  Typical:     Pico 2 + APA102 strip + Hall sensor

Class 4: GATEWAY (Mesh Hub)
  Constraints: Linux, storage, network bridging, always-on
  Priority:    Range > Speed > Fidelity > Cost > Power
  Typical:     Raspberry Pi 4 + LoRa HAT + MQTT broker
```

---

## 2. Platform Comparison Matrix

The following comparison captures the six primary platforms encountered in sensing layer projects. All specifications are drawn from manufacturer datasheets and characterized by independent testing [1][2][3].

| Board | MCU | ADC | Clock | WiFi | Key Feature |
|---|---|---|---|---|---|
| Arduino Uno R3 | ATmega328P | 10-bit, 6ch | 16 MHz | No | Best ADC linearity; 5V logic; vast ecosystem |
| Arduino Nano | ATmega328P | 10-bit, 8ch | 16 MHz | No | Compact breadboard form; same silicon as Uno |
| ESP8266 (NodeMCU) | Tensilica L106 | 10-bit, 1ch | 80/160 MHz | 802.11 b/g/n | Native WiFi; deep sleep <1 mA; I2C sensor bus |
| ESP32-S3 | Xtensa LX7 dual | 12-bit, 20ch | 240 MHz | WiFi + BLE 5 | I2S audio; built-in 8-bit DAC; USB OTG |
| RPi Pico (RP2040) | Dual ARM M0+ | 12-bit, 3ch | 133 MHz | No | PIO subsystem; 500 kS/s ADC; MicroPython |
| RPi Pico 2 (RP2350) | Dual ARM M33 / RISC-V | 12-bit, 3ch | 150 MHz | No | PIO-DAC 150 MS/s; ARM + RISC-V switchable |

### Cost and Sourcing

| Board | Typical Price (USD) | Primary Source | Lead Time |
|---|---|---|---|
| Arduino Uno R3 | $23-28 | arduino.cc, Adafruit, SparkFun | In stock |
| Arduino Nano | $20-24 | arduino.cc, Adafruit | In stock |
| ESP8266 NodeMCU | $3-6 | AliExpress, Amazon | 1-3 weeks |
| ESP32-S3 DevKit | $8-15 | Espressif, Adafruit, SparkFun | In stock |
| RPi Pico | $4 | Raspberry Pi, Adafruit | In stock |
| RPi Pico 2 | $5 | Raspberry Pi, Adafruit | In stock |

> **Related:** See [BPS](../BPS/) for field deployment patterns, [T55](../T55/) for timing subsystem details, [SYS](../SYS/) for gateway infrastructure architecture.

---

## 3. Arduino Uno and Nano: The Reference Platform

The ATmega328P remains the reference platform for analog sensing despite being the slowest and least capable in raw terms. Its 10-bit ADC is the most linear of all platforms tested in comparative studies [1]. The 5V logic level matches most industrial and hobbyist sensors directly, avoiding the level-shifting complexity required by 3.3V platforms.

### ATmega328P ADC Architecture

The ATmega328P uses a successive approximation register (SAR) ADC with a sample-and-hold capacitor. Key characteristics:

- **Resolution:** 10 bits (1024 steps over 0-5V = 4.88 mV per step)
- **Sample rate:** Up to 15 kSPS at full resolution (76.9 kSPS at 8-bit)
- **Multiplexer:** 6 channels (Uno) or 8 channels (Nano) via analog pins
- **Reference voltages:** AVCC (5V), internal 1.1V bandgap, external AREF
- **Linearity:** Differential nonlinearity (DNL) typically +/-0.5 LSB; integral nonlinearity (INL) +/-1 LSB [4]

### When to Choose Arduino

- pH meters, load cells, and precision analog instruments where linearity matters more than speed
- Educational and prototyping contexts where the ecosystem depth accelerates development
- Projects with 5V sensor suites that would require level shifters on 3.3V platforms
- Budget-constrained classroom deployments at scale

> **SAFETY WARNING:** The ATmega328P has no hardware watchdog timer auto-reset by default. Field nodes must enable the watchdog timer in firmware to prevent lockup in unattended deployments. A locked-up weather node reports stale data indistinguishable from valid readings.

---

## 4. ESP8266: WiFi-Native Sensing

The ESP8266 defined the era of sub-$5 WiFi microcontrollers. Its Tensilica L106 core at 80 MHz (overclockable to 160 MHz) is modest, but the integrated 802.11 b/g/n radio eliminates the need for separate communication modules. For sensing layer nodes that communicate via WiFi to a local MQTT broker or Home Assistant instance, the ESP8266 is the minimum viable platform [5].

### ESP8266 Sensor Integration

The ESP8266 has a single 10-bit ADC channel (A0) with a 0-1V input range. This limitation is overcome by using I2C-connected sensor breakouts:

- **BME280** (I2C address 0x76/0x77): pressure, humidity, temperature -- the primary atmospheric sensor
- **AHT20** (I2C address 0x38): high-accuracy temperature/humidity
- **GUVA-S12SD**: UV index via external ADC (ADS1115) since the ESP8266's single ADC channel is often consumed by battery voltage monitoring

### Deep Sleep Power Profile

| Mode | Current Draw | Duration Use Case |
|---|---|---|
| Active (WiFi TX) | 170 mA peak | Data transmission burst |
| Active (CPU only) | 15-20 mA | Sensor reading and processing |
| Modem sleep | 15 mA | CPU active, WiFi off |
| Light sleep | 0.4 mA | Timer wake, GPIO wake |
| Deep sleep | 20 uA | RTC-only, GPIO reset wake |

A field node sleeping 595 seconds and waking for 5 seconds per 10-minute cycle consumes an average of approximately 1.5 mA -- achievable on a 2000 mAh 18650 cell for over 50 days without solar [6].

### Validated Field Deployment

The MDPI ECAS-7 (2025) peer-reviewed study validated an ESP8266-based portable meteorological station running continuously for 696 hours (29 days). The prototype measured temperature, humidity, atmospheric pressure, UV index, dew point, altitude, and air density, comparing favorably to the INIFAP reference station 13.1 km away. Differences in humidity readings were attributed to local geographic variation rather than instrument error -- validating the value of hyperlocal mesh nodes [7].

---

## 5. ESP32: The Swiss Army Knife

The ESP32 family (original Xtensa LX6 dual-core, S2 single-core, S3 dual-core with AI acceleration, C3/C6 RISC-V) is the dominant platform for multi-sensor field nodes. The dual-core architecture allows one core to handle sensor acquisition via DMA while the second manages WiFi/BLE communication -- true concurrent execution without the timing conflicts that plague single-core designs [8].

### ESP32 ADC Reality Check

The ESP32's 12-bit SAR ADC has a well-documented nonlinearity problem at voltage extremes. The transfer function deviates significantly below 0.1V and above 3.1V (on a 3.3V rail). Espressif provides factory calibration data in eFuse that can be read at runtime, but even with calibration, the effective number of bits (ENOB) is approximately 9-10 in the usable range [1][9].

**Mitigation strategies:**

1. **External ADC:** Use ADS1115 (16-bit, I2C, 860 SPS) for precision measurements. The ADS1115 costs approximately $1.50 in quantity and provides differential input, programmable gain amplifier (PGA), and comparator mode.
2. **Calibration lookup table:** Store factory calibration data and apply polynomial correction. Espressif's `esp_adc_cal` API handles this automatically on ESP-IDF v4.4+.
3. **Voltage divider scaling:** Keep the measured voltage in the 0.15V-2.45V range where linearity is best (attenuation setting 11 dB).

### I2S Audio Interface

The ESP32's I2S peripheral is a critical differentiator for sensing applications that include acoustic monitoring. It supports:

- 8/16/24/32-bit sample widths
- Up to 44.1 kHz / 48 kHz sample rates with external codec
- DMA-driven: audio samples flow directly to/from memory without CPU involvement
- Compatible with PCM5102 DAC breakout for high-quality audio output
- Compatible with INMP441 MEMS microphone for acoustic sensing

### Built-in DAC

Two 8-bit DAC channels (GPIO 25 and 26) provide 0-3.3V output. Suitable for:
- Bias voltage generation for sensor conditioning
- Telephone-quality audio output (8 kHz, 8-bit)
- PWM replacement for applications needing true analog output

For higher quality, route I2S output to an external PCM5102 or MCP4725.

> **Related:** See [SGL](../SGL/) for DSP algorithm implementation on ESP32, [LED](../LED/) for LED driver integration, [EMG](../EMG/) for emergency monitoring sensor arrays.

---

## 6. Raspberry Pi Pico and Pico 2

The RP2040 (Pico) and RP2350 (Pico 2) represent a fundamentally different approach: rather than integrating radio peripherals, they invest silicon area in the Programmable I/O (PIO) subsystem -- eight independently programmable state machines that execute custom I/O protocols at deterministic timing with zero CPU involvement [10].

### PIO Architecture

Each PIO block contains four state machines sharing a 32-instruction memory. A state machine can:

- Shift data in or out at one bit per clock cycle (133 MHz on RP2040, 150 MHz on RP2350)
- Generate precise timing signals without CPU jitter
- Implement arbitrary serial protocols (WS2812, APA102, custom sensor buses)
- Drive parallel output buses for DAC interfacing

This architecture makes the Pico family uniquely suited for:

1. **POV displays** where LED update timing must be cycle-accurate
2. **High-speed DAC output** where the PIO drives parallel data to an R-2R ladder or external DAC
3. **Custom sensor protocols** where the sensor uses a non-standard serial format
4. **Logic analyzer** applications where multiple GPIO pins are sampled simultaneously at high speed

### Pico 2 (RP2350) Improvements

- Dual ARM Cortex-M33 cores (security extensions) OR dual RISC-V Hazard3 cores -- switchable at boot
- 520 KB SRAM (vs 264 KB on RP2040)
- 150 MHz clock (vs 133 MHz)
- Hardware floating-point unit (single and double precision)
- Enhanced security features: Secure Boot, ARM TrustZone

### ADC Characterization

The Pico's 12-bit ADC uses capacitor-ratio matching (not resistor ladders), which provides better on-chip precision. However, characterized nonlinearity includes:

- A small dead zone at the lowest codes (below approximately 20 mV)
- Tail-off near 3.3V reference
- Temperature coefficient of approximately 0.2 LSB/degree C

For precision work, pair with an external ADS1115 via I2C. For high-speed applications, the on-board ADC at 500 kS/s with DMA is excellent.

---

## 7. ADC Linearity Characterization

A comparative ADC linearity study across Arduino Uno, ESP32, and Raspberry Pi Pico [1] established the following hierarchy for analog sensing fidelity:

### Linearity Ranking

| Platform | DNL (LSB) | INL (LSB) | ENOB | Usable Range | Verdict |
|---|---|---|---|---|---|
| ATmega328P (Arduino) | +/-0.5 | +/-1.0 | 9.7 | 0-5V (full) | Best linearity |
| RP2040 (Pico) | +/-0.8 | +/-1.5 | 10.2 | 0.02-3.25V | Good; dead zone at extremes |
| ESP32 (Xtensa) | +/-2.0 | +/-4.0 | 8.5-9.5 | 0.15-2.45V | Requires calibration LUT |
| ADS1115 (external) | +/-0.5 | +/-0.5 | 15.2 | Differential, +/-6.144V | Reference-grade |

### Testing Methodology

The comparative study used a precision voltage reference (AD584, +/-0.05% accuracy) stepped in 100 mV increments from 0V to the ADC reference voltage. Each step was sampled 1000 times and averaged. DNL and INL were computed against an ideal linear transfer function.

**Key finding:** The ESP32's ADC nonlinearity is not random noise -- it is a deterministic function of input voltage that can be corrected with a polynomial lookup table. Espressif's factory eFuse calibration data reduces INL to approximately +/-2 LSB, but this still limits ENOB to about 10 bits in practice.

> **SAFETY WARNING:** Using ESP32 on-board ADC for safety-critical measurements (gas detection, voltage monitoring for battery protection) without external verification can lead to false readings at voltage extremes. Always use an external ADC for measurements where incorrect readings could cause harm.

---

## 8. The PIO-DAC Record

In January 2026, Anabit demonstrated the PiWave project on a Raspberry Pi Pico 2: a PIO-driven DAC achieving 150 million samples per second output. The PIO state machine drives 10, 12, or 14 bits of parallel data to an external DAC in a single clock cycle, completely bypassing the CPU [11].

### How PIO-DAC Works

```
PIO-DAC ARCHITECTURE (PiWave)
================================================================

  DMA Engine ──────> PIO FIFO ──────> PIO State Machine
                     (8 deep)          |
                                       | Parallel output
                                       | (10/12/14 bits)
                                       v
                                  ┌──────────┐
                                  │ External │
                                  │ R-2R DAC │
                                  │ or       │
                                  │ DAC IC   │
                                  └────┬─────┘
                                       │
                                       v
                                  Analog Output
                                  (150 MS/s)

  CPU is FREE during entire operation.
  DMA refills PIO FIFO automatically.
  State machine executes in exactly 1 clock cycle per sample.
```

### Applications

- **Function generator:** Arbitrary waveforms up to 75 MHz Nyquist (150 MS/s / 2)
- **Software-defined radio:** Direct digital synthesis of RF waveforms
- **Scientific instrumentation:** High-speed stimulus generation for sensor characterization
- **POV display:** Pre-computed image data streamed to LED arrays at maximum rate

This performance typically requires an FPGA. Achieving it on a $5 microcontroller board fundamentally changes the cost structure of sensing layer instrumentation.

---

## 9. Low-Power Amplifier Selection

Signal conditioning between sensors and ADC inputs requires operational amplifiers matched to the application constraints. For battery-powered field nodes, quiescent current is the primary selection criterion [12].

### Op-Amp Selection Guide

| Op-Amp | Topology | GBW | Iq | Supply | Best Use |
|---|---|---|---|---|---|
| MCP6001 | Single, rail-to-rail | 1 MHz | 100 uA | 1.8-6V | General sensor conditioning |
| OPA333 | Zero-drift, CMOS | 350 kHz | 17 uA | 1.8-5.5V | Thermocouple, strain gauge |
| INA219 | Current sense, I2C | N/A | 1 mA | 3-5.5V | Power monitoring, solar MPPT |
| INA226 | V/I/P monitor, I2C | N/A | 330 uA | 2.7-5.5V | 16-bit bus voltage + shunt |
| MAX4466 | Electret preamp | 600 kHz | 24 uA | 2.4-5.5V | MEMS/electret microphone |
| LM358 | Dual, general | 1 MHz | 500 uA | 3-32V | Non-critical, legacy designs |

### Signal Conditioning Topologies

For a weather station node reading BME280 (I2C digital -- no conditioning needed), GUVA-S12SD (analog 0-1.1V), and an anemometer (pulse counting):

1. **UV sensor path:** GUVA-S12SD output (0-1.1V for UV index 0-11) can connect directly to Pico ADC (0-3.3V range) or ESP32 with 0 dB attenuation. For amplified range, MCP6001 in non-inverting configuration with gain of 3 maps 0-1.1V to 0-3.3V.

2. **Anemometer path:** Pulse counting uses a Schmitt trigger (74HC14) to clean the signal before feeding to a GPIO interrupt pin. No op-amp needed.

3. **Soil moisture path:** Resistive soil moisture sensors produce 0-3V output. Connect via voltage divider if using Arduino (5V ADC) or direct to ESP32/Pico.

---

## 10. Power Budget Analysis for Field Nodes

Autonomous field nodes must survive on stored or harvested energy. The power budget determines deployment lifetime and constrains which platform and communication method are viable [13].

### Power Budget Worksheet: Sentinel Node (ESP8266 + BME280 + LoRa)

| Component | Active Current | Duration per Cycle | Sleep Current | Energy per Cycle |
|---|---|---|---|---|
| ESP8266 WiFi TX | 170 mA | 2 s | 20 uA | 340 mAs |
| ESP8266 CPU | 15 mA | 3 s | (included) | 45 mAs |
| BME280 forced mode | 1.8 mA | 0.05 s | 0.1 uA | 0.09 mAs |
| LoRa TX (RFM95W) | 120 mA | 0.5 s | 0.2 uA | 60 mAs |
| Total per 10-min cycle | -- | 5.55 s active | 20.3 uA sleep | 445 mAs |

**Average current:** (445 mAs / 600 s) + 20.3 uA = 0.76 mA + 0.02 mA = **0.78 mA average**

**Battery life on 3000 mAh 18650:** 3000 / 0.78 = 3846 hours = **160 days**

### Power Budget Worksheet: Observer Node (ESP32 + Multi-Sensor)

| Component | Active Current | Duration per Cycle | Sleep Current | Energy per Cycle |
|---|---|---|---|---|
| ESP32 WiFi TX | 240 mA | 3 s | 10 uA | 720 mAs |
| ESP32 CPU dual-core | 80 mA | 5 s | (included) | 400 mAs |
| ADS1115 + sensors | 2 mA | 2 s | 0.5 uA | 4 mAs |
| Total per 5-min cycle | -- | 10 s active | 10.5 uA sleep | 1124 mAs |

**Average current:** (1124 / 300) + 0.01 = **3.76 mA average**

**Battery life on 3000 mAh 18650:** 3000 / 3.76 = 798 hours = **33 days**

---

## 11. Solar Power Systems

For indefinite deployment, solar harvesting is required. The design must account for Pacific Northwest conditions: winter days with as few as 8.5 hours of daylight, heavy cloud cover reducing solar irradiance to 10-20% of rated panel output, and rain/condensation on the panel surface [14].

### Solar System Sizing

**Rule of thumb for PNW winter:** Size the solar panel to deliver 5x the average consumption, and the battery to store 3 days of operation without sun.

For the Sentinel node (0.78 mA average at 3.3V = 2.57 mW):

- **Panel:** 1W panel (6V, 167 mA rated). At 15% efficiency in winter cloud cover: 0.15W = 25 mA at 6V. Over 8.5 hours: 212 mAh at 6V = ~424 mAh at 3.3V. Daily consumption: 0.78 mA * 24h = 18.7 mAh. **Margin: 22x** -- adequate even in deep winter.
- **Battery:** 3 days * 18.7 mAh = 56 mAh minimum. A single 18650 (3000 mAh) provides massive margin.
- **Charge controller:** TP4056 Li-ion charger module ($0.50). For production: BQ25185 with MPPT.

### Solar MPPT Controllers

| Controller | MPPT | Input | Output | Price | Notes |
|---|---|---|---|---|---|
| TP4056 module | No | 4.5-5.5V | 4.2V Li-ion | $0.50 | Simplest; no MPPT; panel must be 5V |
| BQ25185 | Yes | 3.6-18V | 4.2V Li-ion | $2.50 | True MPPT; handles panel voltage variation |
| SPV1050 | Yes | 0.3-5.5V | 2.2-5.3V | $3.00 | Ultra-low input for small panels; supercap support |

---

## 12. Bus Protocols for Sensor Integration

Sensor integration in the sensing layer uses four primary bus protocols, each suited to different data rates and topologies [15].

### Protocol Comparison

| Protocol | Wires | Max Speed | Max Distance | Addressable | Typical Sensors |
|---|---|---|---|---|---|
| I2C | 2 (SDA, SCL) | 400 kHz (FM) / 3.4 MHz (HS) | ~1 m (standard) | 127 devices | BME280, ADS1115, DS3231, INA219 |
| SPI | 4 (MOSI, MISO, SCK, CS) | 20+ MHz | ~1 m | Per CS line | APA102, ADS8688, SD card |
| UART | 2 (TX, RX) | 115.2 kbps typical | ~15 m (RS-232) | Point-to-point | GPS module, SDS011 particulate, Meshtastic |
| 1-Wire | 1 (DQ + GND) | 15.4 kbps | 100+ m | 64-bit ROM | DS18B20 temperature, iButton |

### I2C Address Map for Standard Weather Node

| Address | Device | Function |
|---|---|---|
| 0x38 | AHT20 | Temperature + humidity |
| 0x48 | ADS1115 | External 16-bit ADC |
| 0x57 | DS3231 EEPROM | RTC EEPROM backup |
| 0x68 | DS3231 | Real-time clock |
| 0x76 | BME280 | Pressure + humidity + temperature |

### I2C Bus Integrity

For field nodes with cable runs over 30 cm, I2C requires:
- **Pull-up resistors:** 2.2 kohm to 10 kohm depending on bus capacitance
- **Bus capacitance limit:** 400 pF maximum for standard mode
- **Cable:** Shielded twisted pair recommended for runs over 50 cm
- **Level shifter:** Required when mixing 3.3V and 5V devices (TXS0102 bidirectional)

---

## 13. DMA and FIFO Buffering Patterns

High-throughput sensing requires decoupling the ADC sample rate from the CPU processing rate. DMA (Direct Memory Access) and FIFO (First-In First-Out) buffering are the architectural patterns that make this possible [16].

### ESP32 DMA-ADC Pattern

```
ESP32 DMA-ADC CONTINUOUS SAMPLING
================================================================

  ADC Unit 1 ──> DMA Channel ──> Circular Buffer (RAM)
                     |
                     | (interrupt on half-buffer complete)
                     v
              CPU processes first half
              while DMA fills second half
              (double-buffering)

  Result: Continuous sampling at up to 2 MSPS
          with zero CPU stall during acquisition
```

### Pico DMA-ADC Pattern

The RP2040 ADC supports DMA natively. Configuration:

1. Set ADC clock divider for desired sample rate (500 kS/s max at 48 MHz ADC clock / 96 cycles per conversion)
2. Enable ADC FIFO with threshold interrupt
3. Configure DMA channel to transfer from ADC FIFO to RAM buffer
4. Process data in ISR or main loop after DMA completion

### MQTT Publish Rate Alignment

The MQTT publish rate must match or divide the sensor sample rate. For a weather node:

- BME280: 1 sample every 10 seconds (forced mode) -- MQTT publish every 60 seconds (6 samples averaged)
- UV sensor: 1 sample per second -- MQTT publish every 60 seconds (60 samples, median filter applied)
- Anemometer: Continuous pulse counting -- MQTT publish every 60 seconds (average wind speed + gust max)

---

## 14. Platform Selection Decision Tree

```
PLATFORM SELECTION DECISION TREE
================================================================

START: What is the primary communication method?

  WiFi only? ──> Is power critical?
                  Yes ──> ESP8266 (deep sleep champion)
                  No  ──> ESP32 (more sensors, I2S audio)

  LoRa/Meshtastic? ──> ESP32 + RFM95W module
                        (or RAK WisBlock for integrated LoRa)

  USB/wired only? ──> Need high-speed I/O?
                       Yes ──> Pico 2 (PIO at 150 MHz)
                       No  ──> Arduino Nano (best ADC linearity)

  Linux required? ──> Raspberry Pi 4/5 (gateway, MQTT broker)

  Cost-critical (< $5)? ──> Pico ($4) or ESP8266 ($3-6)

  Maximum ADC precision? ──> Any platform + ADS1115 external
```

---

## 15. Cross-References

> **Related:** [BPS](../BPS/) -- field sensor deployment patterns and environmental enclosures. [T55](../T55/) -- timing subsystems including GPS PPS and NTP synchronization. [SYS](../SYS/) -- systems administration including gateway infrastructure and MQTT broker configuration. [LED](../LED/) -- LED controller selection complementary to MCU platform choice. [SGL](../SGL/) -- DSP algorithms implementable on ESP32 and Pico platforms. [SHE](../SHE/) -- environmental shelter design for outdoor node enclosures. [ECO](../ECO/) -- ecological monitoring applications for field node deployments. [EMG](../EMG/) -- emergency response sensor networks. [K8S](../K8S/) -- container orchestration for gateway fleet management. [PSS](../PSS/) -- power system sizing for solar field installations.

---

## 16. Sources

1. Dr. Monk DIY Electronics Blog (2024): "Comparative ADC Characterization across ESP32, Pico, Arduino." doctormonk.com
2. Raspberry Pi Foundation (2024): "RP2040 Datasheet." datasheets.raspberrypi.com/rp2040/rp2040-datasheet.pdf
3. Espressif Systems (2025): "ESP32-S3 Technical Reference Manual." espressif.com/sites/default/files/documentation/esp32-s3_technical_reference_manual_en.pdf
4. Microchip Technology (2020): "ATmega328P Datasheet." ww1.microchip.com/downloads/en/DeviceDoc/ATmega48A-PA-88A-PA-168A-PA-328-P-DS-DS40002061B.pdf
5. Espressif Systems (2024): "ESP8266EX Datasheet." espressif.com/sites/default/files/documentation/0a-esp8266ex_datasheet_en.pdf
6. Kolban, N. (2023): "Kolban's Book on ESP8266." leanpub.com/ESP8266_ESP32
7. MDPI ECAS-7 (2025): "Low-Cost ESP8266 Meteorological Station: 696-Hour Validation Study." Environmental and Earth Sciences Proceedings.
8. Espressif Systems (2025): "ESP-IDF Programming Guide v5.2." docs.espressif.com/projects/esp-idf/en/v5.2/
9. ESP32 ADC Calibration Application Note, Espressif (2023): docs.espressif.com/projects/esp-idf/en/latest/esp32/api-reference/peripherals/adc_calibration.html
10. Raspberry Pi Foundation (2024): "RP2350 Datasheet." datasheets.raspberrypi.com/rp2350/rp2350-datasheet.pdf
11. Hackaday (Jan 2026): "PiWave: 150 MS/s PIO-DAC on Raspberry Pi Pico 2." hackaday.com
12. Texas Instruments (2024): "Op Amp Selection Guide for Sensor Conditioning." ti.com/lit/an/sboa273a/
13. Adafruit Industries (2024): "Power Management Guide for IoT Projects." learn.adafruit.com/adafruit-power-management
14. NREL (2025): "PVWatts Calculator -- Pacific Northwest Solar Resource Data." pvwatts.nrel.gov
15. NXP Semiconductors (2021): "I2C-bus specification and user manual, UM10204 Rev 7.0." nxp.com/docs/en/user-guide/UM10204.pdf
16. Raspberry Pi Foundation (2024): "RP2040 DMA Programming Guide." raspberrypi.com/documentation/microcontrollers/rp2040.html
17. Analog Devices (2023): "ADS1115 Datasheet." analog.com/media/en/technical-documentation/data-sheets/ads1113-ads1114-ads1115.pdf
18. Adafruit Industries (2025): "Solar Charging for Wearables and IoT." learn.adafruit.com/usb-dc-and-solar-lipoly-charger
