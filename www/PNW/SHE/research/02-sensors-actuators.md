# Module 2: Sensors, Actuators & Signal Conditioning

Complete reference catalog of every sensor and actuator type used in smart home projects, with interface specifications, example configurations, signal conditioning techniques, and PCB design basics.

---

## 1. Temperature & Humidity Sensors

### 1.1 DHT11 — The Beginner Sensor

The simplest digital temperature and humidity sensor. Single-wire digital interface makes it trivial to connect — one data wire, power, and ground. [SRC-ARD]

| Parameter | Value |
|-----------|-------|
| Temperature range | 0-50C |
| Temperature accuracy | +/-2C |
| Humidity range | 20-80% RH |
| Humidity accuracy | +/-5% RH |
| Interface | 1-wire digital (proprietary, not Dallas 1-Wire) |
| Sampling rate | 1 reading per 2 seconds (minimum) |
| Supply voltage | 3.3-5V |
| Data pin pull-up | 4.7K-10K to VCC |

**Wiring (Arduino):**
| From | To | Note |
|------|----|------|
| DHT11 VCC | Arduino 5V | Power |
| DHT11 GND | Arduino GND | Ground |
| DHT11 DATA | Arduino D2 | + 10K pull-up to 5V |

**Arduino code pattern:**
```cpp
#include <DHT.h>
DHT dht(2, DHT11);
void setup() { dht.begin(); }
void loop() {
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();
  if (isnan(temp) || isnan(hum)) return; // read failed
  // use values
  delay(2000); // minimum sampling interval
}
```

**Limitations:** Slow (2-second minimum between reads), low accuracy, narrow range. Adequate for Tier 1 learning but should be upgraded to DHT22 or BME280 for real monitoring.

**Used in:** Project 4 (Temperature Logger), Project 16 (Humidifier — paired with XIAO)

### 1.2 DHT22/AM2302 — General Purpose

Improved version of DHT11 with better accuracy and wider range. Same interface, same wiring, just change the library constant from `DHT11` to `DHT22`. [SRC-ARD]

| Parameter | Value |
|-----------|-------|
| Temperature range | -40 to 80C |
| Temperature accuracy | +/-0.5C |
| Humidity range | 0-100% RH |
| Humidity accuracy | +/-2% RH |
| Sampling rate | 1 reading per 2 seconds |
| Supply voltage | 3.3-5.5V |
| Cost | ~$3 |

**Used in:** Project 8 (MQTT Temperature Node), Project 14 (Smart Thermostat)

### 1.3 BME280 — The Weather Station Sensor

Temperature, humidity, AND barometric pressure in one package. I2C interface allows multiple sensors on the same bus. The preferred sensor for weather stations and environmental monitoring. [SRC-CUB]

| Parameter | Value |
|-----------|-------|
| Temperature | -40 to 85C, +/-1C |
| Humidity | 0-100%, +/-3% RH |
| Pressure | 300-1100 hPa, +/-1 hPa |
| Interface | I2C (default addr 0x76, alt 0x77) or SPI |
| Sampling rate | Up to 157 Hz (forced mode recommended for battery) |
| Supply voltage | 1.71-3.6V |
| Current | 3.6 uA at 1 Hz measurement |
| Cost | ~$4 (module with regulator) |

**Wiring (ESP32, I2C):**
| From | To | Note |
|------|----|------|
| BME280 VCC | ESP32 3V3 | Power (3.3V) |
| BME280 GND | ESP32 GND | Ground |
| BME280 SDA | ESP32 GPIO21 | I2C data + 4.7K pull-up to 3.3V |
| BME280 SCL | ESP32 GPIO22 | I2C clock + 4.7K pull-up to 3.3V |

**ESPHome configuration:**
```yaml
i2c:
  sda: 21
  scl: 22

sensor:
  - platform: bme280_i2c
    temperature:
      name: "Room Temperature"
      oversampling: 16x
    humidity:
      name: "Room Humidity"
    pressure:
      name: "Barometric Pressure"
    address: 0x76
    update_interval: 60s
```

**Altitude from pressure:** Using the barometric formula, altitude can be estimated from pressure. At sea level, pressure is ~1013.25 hPa. Altitude (m) = 44330 x (1 - (P/P0)^0.1903). Accuracy depends on weather conditions.

**Used in:** Project 7 (Weather Station), Project 24 (Weather Dashboard)

### 1.4 DS18B20 — The Waterproof Probe

Dallas 1-Wire temperature sensor available in a waterproof stainless steel probe form factor. Multiple sensors can share a single GPIO pin using unique 64-bit addresses. [SRC-ARD]

| Parameter | Value |
|-----------|-------|
| Temperature range | -55 to 125C |
| Accuracy | +/-0.5C (-10 to 85C) |
| Resolution | 9-12 bit configurable |
| Interface | Dallas 1-Wire |
| Parasite power | Yes (can operate from data line) |
| Supply voltage | 3.0-5.5V |
| Cost | ~$2 (waterproof probe) |

**Multiple sensors on one wire:** Each DS18B20 has a factory-programmed unique 64-bit serial number. A single GPIO pin with a 4.7K pull-up can address dozens of sensors. The DallasTemperature library handles enumeration and individual addressing.

**Used in:** Project 21 (Multi-Room Temperature Monitor — 3x DS18B20 nodes)

### 1.5 SHT31 — High Precision

The most accurate temperature and humidity sensor in this curriculum. I2C interface with two selectable addresses. [SRC-CUB]

| Parameter | Value |
|-----------|-------|
| Temperature | -40 to 125C, +/-0.3C |
| Humidity | 0-100%, +/-2% RH |
| Interface | I2C (addr 0x44 or 0x45) |
| Response time | 8 seconds (humidity) |
| Repeatability | +/-0.1C, +/-0.15% RH |
| Cost | ~$5 |

### 1.6 NTC Thermistor — The Cheapest Option

A thermistor is a resistor whose resistance changes with temperature. NTC (Negative Temperature Coefficient) types decrease in resistance as temperature rises. Combined with a voltage divider and the Steinhart-Hart equation, it provides temperature measurement for pennies. [SRC-ETUT, SRC-CUB]

**Steinhart-Hart equation:** 1/T = A + B*ln(R) + C*(ln(R))^3

Where T is temperature in Kelvin, R is thermistor resistance, and A, B, C are calibration coefficients (provided in datasheet or determined by measurement at 3 known temperatures).

**Why learn this:** Understanding the NTC thermistor teaches voltage dividers [M1:1.5], ADC conversion [M1:3.2], and mathematical calibration — all foundational concepts.

---

## 2. Motion & Presence Sensors

### 2.1 HC-SR501 — PIR Motion Sensor

Passive Infrared sensor detects changes in infrared radiation from warm bodies (humans, animals). The most common motion sensor for security and lighting automation. [SRC-HACK]

| Parameter | Value |
|-----------|-------|
| Detection range | 3-7 m (adjustable via potentiometer) |
| Detection angle | ~120 degrees |
| Output | Digital HIGH (3.3V) when motion detected |
| Delay time | 5 seconds to 5 minutes (adjustable) |
| Trigger mode | Repeatable (H) or single (L) — jumper selectable |
| Supply voltage | 5-20V (has onboard regulator) |
| Output voltage | 3.3V HIGH (compatible with ESP32 directly) |
| Cost | ~$1 |

**Wiring (ESP32):**
| From | To | Note |
|------|----|------|
| HC-SR501 VCC | ESP32 VIN (5V) | Needs 5V supply |
| HC-SR501 GND | ESP32 GND | Ground |
| HC-SR501 OUT | ESP32 GPIO13 | 3.3V output, direct connection |

**Key behavior:** After power-on, the PIR needs 30-60 seconds to stabilize (calibrate to ambient IR). During this time, ignore all output. The sensor detects CHANGES in IR — a stationary person will not re-trigger it until they move.

**Interrupt-driven detection:**
```cpp
volatile bool motionDetected = false;
void IRAM_ATTR onMotion() { motionDetected = true; }
void setup() {
  pinMode(13, INPUT);
  attachInterrupt(digitalPinToInterrupt(13), onMotion, RISING);
}
```

**Used in:** Project 10 (Motion Alert), Project 30 (Presence Detection)

### 2.2 RCWL-0516 — Microwave Doppler

Detects motion through thin walls, glass, and plastic enclosures using microwave Doppler radar at ~3.18 GHz. [SRC-HACK]

| Parameter | Value |
|-----------|-------|
| Range | 5-9 m |
| Coverage | 360 degrees (omnidirectional) |
| Output | Digital HIGH on motion |
| Through-wall | Yes (thin walls, wood, plastic) |
| Supply | 4-28V |
| Cost | ~$1 |

**Advantage over PIR:** Detects motion through enclosures, so the sensor can be hidden inside a project box. Disadvantage: sensitive to any motion (including outside walls), higher false positive rate.

### 2.3 LD2410 — 24 GHz mmWave Presence Sensor

The most advanced motion sensor in this curriculum. Uses 24 GHz FMCW radar to detect both motion AND stationary presence (detects breathing). Outputs structured data via UART including distance and energy level. [SRC-HACK]

| Parameter | Value |
|-----------|-------|
| Frequency | 24 GHz ISM band |
| Moving detection range | 0.75-6 m (configurable) |
| Stationary detection range | 0.75-6 m (configurable) |
| Distance resolution | 0.75 m gates |
| Output | UART (JSON-like protocol) + digital GPIO |
| Supply | 5V, ~80 mA |
| Cost | ~$4 |

**Why mmWave matters:** PIR sensors detect motion only — if a person sits still at a desk, the PIR goes LOW after timeout. The LD2410 detects the micro-movements of breathing and continues reporting "presence" even for a stationary person. This enables true room occupancy detection for HVAC and lighting automation.

**ESPHome configuration:**
```yaml
uart:
  tx_pin: GPIO17
  rx_pin: GPIO16
  baud_rate: 256000

ld2410:

binary_sensor:
  - platform: ld2410
    has_target:
      name: "Room Occupied"
    has_moving_target:
      name: "Motion Detected"
    has_still_target:
      name: "Stationary Presence"

sensor:
  - platform: ld2410
    moving_distance:
      name: "Moving Target Distance"
    still_distance:
      name: "Still Target Distance"
```

**Used in:** Project 30 (Presence Detection System)

### 2.4 HC-SR04 — Ultrasonic Distance

Measures distance using ultrasonic pulses (40 kHz). Sends a trigger pulse, measures echo return time, calculates distance.

| Parameter | Value |
|-----------|-------|
| Range | 2-400 cm |
| Accuracy | +/-3 mm |
| Interface | Trigger (digital out) + Echo (digital in) |
| Angle | ~15 degrees |
| Supply | 5V |
| Cost | ~$1 |

**Distance formula:** Distance (cm) = Echo pulse duration (us) / 58

> **NOTE [ANNOTATE]:** The HC-SR04 operates at 5V. On ESP32 (3.3V logic), the Trigger pin works fine (3.3V is enough to trigger), but the Echo pin returns 5V pulses. Use a voltage divider (1K + 2K) to bring the Echo signal down to 3.3V. Alternatively, use the HC-SR04P variant which operates at 3.3V.

### 2.5 VL53L0X — Laser Time-of-Flight

Precise distance measurement using a Class 1 laser (eye-safe) and time-of-flight calculation.

| Parameter | Value |
|-----------|-------|
| Range | 0-200 cm |
| Accuracy | +/-3% |
| Interface | I2C (addr 0x29, programmable) |
| Field of view | 25 degrees |
| Supply | 2.6-5.5V |
| Cost | ~$4 |

---

## 3. Light, Gas, Current & Environmental Sensors

### 3.1 Light Sensors

**LDR (Photoresistor):** The simplest analog sensor. Resistance varies from ~1K (bright) to 100K+ (dark). Connect in a voltage divider with a 10K fixed resistor to create a light-level sensor readable by ADC. Used in Project 3 (Light Level Monitor) and Project 9 (Smart Nightlight). [SRC-ETUT]

**BH1750:** Digital lux meter with I2C interface. Returns calibrated lux values (1-65535 lux) directly — no calibration needed. Used for precise light-level automation (close curtains when lux > 50000, turn on lights when lux < 100). [SRC-CUB]

**TSL2591:** Full-spectrum and IR light sensor with I2C interface. Extremely wide dynamic range (188 ulux to 88,000 lux). Returns separate visible and IR readings for more accurate daylight measurement. Used in advanced lighting automation.

### 3.2 Gas Sensors (MQ Series)

The MQ series uses heated metal-oxide semiconductor elements whose resistance changes in the presence of specific gases. [SRC-HACK]

| Sensor | Target Gas | Preheat Time | Analog Output |
|--------|-----------|-------------|--------------|
| MQ-2 | Combustible gases, smoke | 24-48 hours | Higher voltage = more gas |
| MQ-7 | Carbon monoxide | Cyclic heating required | Higher voltage = more CO |
| MQ-135 | Air quality (CO2 proxy, NH3, NOx) | 24-48 hours | Higher voltage = worse air |
| SCD40/SCD41 | True CO2 (NDIR) | None | I2C, ppm value directly |

**MQ sensor circuit:** VCC (5V) -> heater. Signal pin -> analog ADC through voltage divider. The sensor element changes resistance proportional to gas concentration.

> **SAFETY BLOCK [SC-SRC]:** MQ-series sensors are INDICATIVE ONLY. They provide relative gas concentration changes, not calibrated ppm values. They CANNOT replace UL-listed CO detectors (required by code per NFPA 720) or combustible gas detectors for life safety. A DIY gas sensor is a learning tool — life safety requires certified commercial detectors. Never rely on a student project for gas safety. [SRC-NFPA]

**SCD40/SCD41:** Uses NDIR (Non-Dispersive Infrared) technology for true CO2 measurement (400-5000 ppm, +/-50 ppm). I2C interface, no pre-heat, but costs ~$30. Used for indoor air quality monitoring where accuracy matters.

### 3.3 Current Sensors

**SCT-013-000 (100A CT Clamp):** Split-core current transformer that clamps around a single conductor to measure AC current. Non-invasive — no wire cutting required. Outputs a small AC voltage proportional to the current flowing through the conductor. [SRC-OEM, SRC-CIRCUIT]

| Parameter | Value |
|-----------|-------|
| Range | 0-100A AC |
| Output | 0-50 mA AC (with burden resistor: 0-1V AC) |
| Interface | Analog (requires rectification + filtering for DC ADC) |
| Accuracy | +/-2% (at mid-range) |
| Safety | Non-invasive clamp — never break the circuit |
| Cost | ~$8 |

**Signal conditioning chain for ESP32 ADC:**
1. CT clamp outputs AC signal centered at 0V
2. Bias resistor network (2x 10K) shifts signal to 1.65V center
3. Burden resistor (33 ohm for SCT-013-000) converts current output to voltage
4. Sample at high rate (>2000 samples per 60 Hz cycle = ~120 kHz)
5. Calculate RMS in software using the formula: Irms = sqrt(sum(samples^2) / N)

**Used in:** Projects 19 (Energy Meter), 29 (Solar Monitor), 35 (EV Charging)

> **SAFETY GATE [SC-MAINS]:** The CT clamp itself is safe — it clamps around INSULATED wire without touching any conductor. However, you must open the electrical panel to access individual conductors. This should ONLY be done by a qualified person. Never clamp around a cable (hot + neutral together) — the magnetic fields cancel and you get zero reading. Clamp around the individual HOT conductor only. [SRC-OEM, SRC-NFPA]

**ACS712 (Hall-Effect):** Inline current sensor that requires breaking the circuit and running current through the sensor. Available in 5A, 20A, and 30A versions. Simpler signal (analog DC output proportional to current) but requires physical installation in the current path. Less safe than CT clamps for mains-current measurement.

### 3.4 Water & Soil Sensors

**Capacitive soil moisture sensor:** Measures soil dielectric constant (which changes with water content). Returns analog voltage: dry = high voltage, wet = low voltage. Preferred over resistive sensors because the capacitive element doesn't corrode. [SRC-HACK]

**YF-S201 water flow sensor:** Hall-effect sensor in a pipe fitting. Outputs digital pulses proportional to flow rate. ~450 pulses per liter. Use interrupt to count pulses, calculate flow rate: flow (L/min) = pulse_frequency / 7.5.

**Used in:** Project 11 (Soil Monitor), Project 23 (Automated Watering)

---

## 4. Signal Conditioning

### 4.1 Analog-to-Digital Conversion (ADC)

Microcontrollers read analog sensors by converting continuous voltage to discrete digital numbers. [SRC-ESP32, SRC-CUB]

**Resolution:**
- Arduino (ATmega328P): 10-bit ADC, 0-1023 representing 0-5V. Resolution: 5V/1024 = 4.88 mV per step
- ESP32: 12-bit ADC, 0-4095 representing 0-3.3V. Resolution: 3.3V/4096 = 0.806 mV per step

**ESP32 ADC practical notes:**
- ADC1 (GPIO 32-39): Always available, use these for sensors
- ADC2 (GPIO 0, 2, 4, 12-15, 25-27): Unavailable when Wi-Fi active
- Non-linear at extremes (below 100 mV and above 3.1V) — use calibration
- For best results, use attenuation setting: `adc1_config_channel_atten(ADC1_CHANNEL_0, ADC_ATTEN_DB_12)` for full 0-3.3V range [SRC-ESP32]

### 4.2 Filtering and Averaging

Raw ADC readings are noisy. Apply software filters to get stable readings:

**Moving average:**
```cpp
const int SAMPLES = 10;
int readings[SAMPLES];
int readIndex = 0;
long total = 0;

int smoothedRead(int pin) {
  total -= readings[readIndex];
  readings[readIndex] = analogRead(pin);
  total += readings[readIndex];
  readIndex = (readIndex + 1) % SAMPLES;
  return total / SAMPLES;
}
```

**Exponential moving average (EMA):**
```cpp
float alpha = 0.1; // smoothing factor (0-1, lower = smoother)
float ema = 0;
float emaRead(int pin) {
  int raw = analogRead(pin);
  ema = alpha * raw + (1 - alpha) * ema;
  return ema;
}
```

**Hardware filtering:** A 100 nF capacitor from the ADC input pin to GND acts as a low-pass filter, reducing high-frequency noise. For CT clamp signals, a 10 uF capacitor provides additional smoothing.

### 4.3 Level Shifting

When connecting 5V components to 3.3V microcontrollers (ESP32), voltage levels must be matched. [SRC-ESP32]

**3.3V -> 5V (output, e.g., driving WS2812B):**
- Most 5V inputs accept 3.3V as HIGH (works for many devices)
- For strict 5V requirement: use 74HCT125 level shifter or single MOSFET level converter

**5V -> 3.3V (input, e.g., reading HC-SR04 echo):**
- Voltage divider: 1K (signal side) + 2K (GND side) = 5V x 2K/(1K+2K) = 3.33V
- Dedicated level shifter module (BSS138-based): bidirectional, best for I2C

**Bidirectional level shifting:** I2C requires bidirectional level shifting because both SDA and SCL can be driven by either the master or slave. Use BSS138 MOSFET-based modules ($0.50) or dedicated chips (TXB0108).

### 4.4 Debouncing

Mechanical buttons and switches "bounce" — the contacts make and break several times in the first few milliseconds of a press, generating multiple signal transitions. Without debouncing, a single press registers as 5-50 presses. [SRC-ARD]

**Software debouncing:**
```cpp
unsigned long lastDebounce = 0;
const unsigned long DEBOUNCE_DELAY = 50; // ms
int lastState = HIGH;
int buttonState = HIGH;

void checkButton() {
  int reading = digitalRead(BUTTON_PIN);
  if (reading != lastState) lastDebounce = millis();
  if ((millis() - lastDebounce) > DEBOUNCE_DELAY) {
    if (reading != buttonState) {
      buttonState = reading;
      if (buttonState == LOW) onButtonPress();
    }
  }
  lastState = reading;
}
```

**Hardware debouncing:** 100 nF capacitor across the button contacts + 10K pull-up. The capacitor charges/discharges slowly enough to smooth out bounce transitions. Simpler code but adds a component.

### 4.5 Amplification

Weak sensor signals (millivolt range) need amplification before ADC conversion.

**Op-amp basics:** An operational amplifier can amplify voltage signals. In non-inverting configuration: Vout = Vin x (1 + R2/R1). Common op-amps: LM358 (dual, rail-to-rail input), MCP6002 (low power, rail-to-rail). [SRC-ETUT, SRC-CUB]

**Instrumentation amplifier (INA125, AD623):** Used for bridge sensors (load cells, strain gauges, Wheatstone bridges). Provides high common-mode rejection ratio (CMRR) essential for precision measurements in noisy environments.

---

## 5. Actuator Deep Dive

### 5.1 Relay Circuits

Complete relay driving circuit design — the foundation of all home automation switching from Tier 3 onward. [SRC-ETUT, SRC-NFPA]

**Mechanical relay (SRD-05VDC-SL-C):**

The relay has two independent circuits:
1. **Coil side (low voltage):** 5V DC, ~70 mA — controlled by the microcontroller through a transistor
2. **Contact side (high voltage):** Up to 10A at 250VAC — switches the load (light, fan, appliance)

**Complete driving circuit:**
| From | To | Component | Note |
|------|----|-----------|------|
| ESP32 GPIO | 1K resistor | Resistor | Current limiting for transistor base |
| 1K resistor | 2N2222 Base | Transistor | NPN switch |
| 2N2222 Emitter | GND | Wire | Common ground |
| 2N2222 Collector | Relay coil (-) | Wire | Low side of coil |
| Relay coil (+) | 5V | Wire | Coil power |
| 1N4007 cathode | 5V | Diode | Flyback protection |
| 1N4007 anode | 2N2222 Collector | Diode | Across relay coil |

> **SAFETY BLOCK [SC-REL]:** The relay coil draws ~70 mA. ESP32 GPIO can supply only 12 mA safely (40 mA absolute max). NEVER connect a relay coil directly to a GPIO pin. The transistor provides the current amplification needed. Without the flyback diode (1N4007), the inductive spike from the coil will destroy the transistor and potentially the microcontroller. [SRC-ARD, SRC-ESP32]

**Pre-built relay modules:** Most relay modules ($2-3) include the transistor, flyback diode, and optocoupler on a PCB. A HIGH or LOW signal from the GPIO switches the relay. Check whether the module is active-HIGH or active-LOW (varies by manufacturer).

> **SAFETY BLOCK [SC-MAINS]:** When a relay switches 120V AC: (1) De-energize at breaker before wiring. (2) Use 14 AWG wire minimum for 15A circuits. (3) All connections in approved junction boxes. (4) Separate low-voltage (relay coil) and high-voltage (relay contacts) wiring per NEC 725. (5) GFCI protection required per NEC 210.8 in kitchens, bathrooms, garages, outdoors. [SRC-NFPA, SRC-NEC-725, SRC-NEC-210]

**Solid-state relay (SSR-25DA):** No mechanical contacts, no coil, no flyback diode needed. A small DC voltage (3-32V) on the control side switches the load side. Zero-crossing switching reduces electrical noise. Silent operation. Preferred for frequent switching (e.g., PID-controlled heaters).

### 5.2 Servo Motors

Servo motors rotate to a specific angle based on a PWM signal. Used for physical movement: vent controllers, door locks, sign displays, camera mounts. [SRC-ARD]

**PWM signal specification (standard servo):**
- Frequency: 50 Hz (20 ms period)
- 0 degrees: 1.0 ms pulse width
- 90 degrees: 1.5 ms pulse width
- 180 degrees: 2.0 ms pulse width

**Power considerations:**
- SG90: 100-250 mA while moving, spikes to 500 mA under load
- MG996R: 500 mA-1A while moving, spikes to 2.5A stall
- NEVER power from microcontroller — use separate 5V supply
- Add 470 uF capacitor across servo power to absorb spikes

**ESP32 servo control:**
```cpp
#include <ESP32Servo.h>
Servo myServo;
void setup() { myServo.attach(18); } // GPIO18
void loop() { myServo.write(90); } // 0-180 degrees
```

**Used in:** Project 6 (Door Sign), Project 15 (RFID Lock)

### 5.3 Stepper Motors

Stepper motors move in precise steps. No feedback needed for position control — count the steps and you know the exact position. [SRC-ARD]

**28BYJ-48 with ULN2003 driver:**
- 2048 steps per revolution (half-step mode)
- Very slow (~15 RPM max) but precise
- 5V operation, draws ~240 mA at full step
- Perfect for curtains, blinds, valve positions

**NEMA 17 with A4988/DRV8825:**
- 200 steps per revolution (1.8 degrees)
- Microstepping: 1/2, 1/4, 1/8, 1/16 step
- 12V operation, 1-2A per phase
- Higher torque and speed than 28BYJ-48

> **SAFETY GATE [SC-REL]:** Stepper motor drivers must include motor power filtering (100 uF electrolytic near the driver). A4988 has a maximum of 35V/2A — do not exceed. Motor wires carry significant current; use appropriate gauge wire.

### 5.4 LED Addressing (WS2812B/NeoPixel)

WS2812B addressable LEDs contain a controller IC inside each LED package. Each LED receives color data (24-bit RGB, 8 bits per channel) in series, processes its own data, and passes the rest to the next LED. [SRC-HACK]

**Protocol:** 800 kHz data rate, single-wire. Timing-sensitive (300-900 ns pulses). The ESP32 RMT peripheral handles this natively. Arduino NeoPixel library or FastLED library.

**Wiring:**
| From | To | Note |
|------|----|------|
| Data Out (GPIO) | 330 ohm resistor | Damping resistor (prevents ringing) |
| 330 ohm resistor | First LED DIN | Data in |
| 5V supply | LED strip VCC | Dedicated power supply |
| GND | LED strip GND + ESP32 GND | Common ground (critical!) |
| 1000 uF capacitor | Across 5V and GND at strip | Power buffer |

**Power budget:** Each WS2812B LED draws up to 60 mA at full white (20 mA per R, G, B channel). 60 LEDs/m at 1 meter = 3.6A. For strips >1 meter, inject power at both ends and every 0.5 meter to prevent voltage drop causing color shift at the end. [SRC-ESP32]

**Used in:** Project 5 (RGB Mood Lamp — basic), Project 20 (Smart LED Strip — advanced)

### 5.5 Speakers & Audio Output

**Passive buzzer:** Requires PWM signal to produce tones. Different frequencies = different pitches. Use `tone()` function on Arduino or LEDC PWM on ESP32.

**I2S DAC (MAX98357A):** Digital audio output. The ESP32 sends digital audio data over I2S protocol; the DAC converts to analog and amplifies it to drive a speaker directly. Used for notification sounds, voice feedback, and whole-house audio.

**Used in:** Project 12 (Doorbell — buzzer), Project 26 (Voice Control — I2S), Project 34 (Audio — full I2S DAC + speaker)

---

## 6. PCB Design Basics

### 6.1 When to Move from Breadboard to PCB

- **Breadboard:** Prototyping, testing, temporary setups. Contact resistance adds noise. Wires pull loose. Not suitable for permanent installation.
- **Perfboard/stripboard:** Hand-soldered permanent version of breadboard layout. Good for one-off projects.
- **Custom PCB:** Designed in KiCad or similar EDA tool, manufactured by PCB services ($2-5 for 5 boards). Professional quality, repeatable, compact. Required for Project 32 (Custom Sensor Node).

### 6.2 KiCad Workflow

1. **Schematic capture:** Draw the circuit diagram with component symbols and connections
2. **Footprint assignment:** Map each symbol to a physical component footprint (package size)
3. **Board layout:** Place components on the PCB outline and route copper traces between them
4. **Design rule check (DRC):** Verify trace widths, clearances, and connectivity
5. **Generate Gerber files:** Export manufacturing files for PCB fabrication
6. **Order fabrication:** Upload Gerbers to PCB service (JLCPCB, PCBWay, OSH Park)

**Trace width guidelines:**
| Current | Minimum Trace Width (1 oz copper) |
|---------|----------------------------------|
| <500 mA | 0.25 mm (10 mil) |
| 1A | 0.5 mm (20 mil) |
| 2A | 1.0 mm (40 mil) |
| 5A | 2.5 mm (100 mil) |

**PCB design rules for beginners:**
- Route power traces wider than signal traces
- Place decoupling capacitors as close to IC pins as possible
- Pour a ground plane on one layer for noise reduction
- Keep high-current traces (relay, motor) separate from sensitive analog traces
- Add mounting holes for standoffs
- Silkscreen labels for all connectors and test points [SRC-KICAD]

**Used in:** Project 32 (Custom PCB Sensor Node)

---

## 7. Concept Cross-Reference

| Concept | First Seen | Module Ref | Projects |
|---------|-----------|-----------|----------|
| 1-Wire protocol | Section 1.1 (DHT) | [M1:3.3] | 4, 8, 21 |
| I2C bus | Section 1.3 (BME280) | [M1:3.3] | 7, 24, 30 |
| ADC conversion | Section 4.1 | [M1:3.2] | 3, 9, 11, 19 |
| Signal filtering | Section 4.2 | [M1:3.2] | 19, 24, 29 |
| Level shifting | Section 4.3 | [M1:2.3] | HC-SR04 projects |
| Debouncing | Section 4.4 | [M1:3.4] | 2, 12, 15 |
| Relay driving | Section 5.1 | [M1:2.3, M1:2.4] | 9, 13, 14, 18 [SC-REL] |
| PWM servo control | Section 5.2 | [M1:3.2] | 6, 15 |
| LED addressing | Section 5.4 | [M1:3.3] | 5, 20 |
| CT clamp energy | Section 3.3 | [M1:1.2] | 19, 29, 35 [SC-MAINS] |
| PCB design | Section 6 | [M1:4.3] | 32 |
| Flyback protection | Section 5.1 | [M1:2.4] | All relay/motor projects [SC-FLY] |
