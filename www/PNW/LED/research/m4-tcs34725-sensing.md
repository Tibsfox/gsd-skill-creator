# TCS34725 Color & Ambient Sensing

The TCS34725 is a digital color sensor that measures red, green, blue, and clear light intensity via I2C. It provides the raw data needed for ambient light color temperature measurement, lux calculation, and closed-loop color feedback. This page covers wiring, register-level details, Arduino and Raspberry Pi code, and practical calibration for circadian lighting systems.

---

## 1. Sensor Overview

### 1.1 Key Specifications

| Parameter | Value |
|-----------|-------|
| Manufacturer | ams (formerly TAOS / Texas Advanced Optoelectronic Solutions) |
| Interface | I2C (address 0x29, fixed) |
| Channels | 4: Red, Green, Blue, Clear (unfiltered) |
| ADC resolution | 16-bit per channel (0-65535) |
| Dynamic range | 3,800,000:1 |
| Gain settings | 1x, 4x, 16x, 60x |
| Integration time | 2.4 ms to 614.4 ms (configurable) |
| Supply voltage | 3.0V to 3.6V (breakout boards include 3.3V regulator) |
| IR blocking filter | Integrated, minimizes IR contamination of visible light readings |
| Package | 6-pin FN (2.0 x 2.2 x 1.0 mm) |

The integrated IR blocking filter is what distinguishes the TCS34725 from cheaper sensors like the TCS3200. Without IR filtering, warm light sources (incandescent, candles) produce inflated red channel readings, making CCT calculations unreliable.

### 1.2 How It Works

The sensor uses an array of photodiodes with color filters (red, green, blue) and one unfiltered (clear) channel. Photons striking each photodiode generate current proportional to light intensity in that wavelength band. An integrating ADC accumulates charge over a configurable integration period, then latches the 16-bit result into a register.

```
  Incoming Light
       |
       v
  +----+----+----+----+
  | IR Block Filter   |  <-- Removes near-infrared
  +----+----+----+----+
       |
  +----+----+----+----+
  | R  | G  | B  | Clr|  <-- 4 photodiode arrays
  +----+----+----+----+
       |    |    |    |
  +----+----+----+----+
  | 16-bit Integrating |  <-- Charge accumulation
  | ADC (per channel)  |
  +----+----+----+----+
       |
  +----+----+
  | I2C     |  <-- Digital readout
  | Interface|
  +---------+
```

---

## 2. Wiring

### 2.1 Arduino Wiring (5V boards via breakout)

Most TCS34725 breakout boards (Adafruit #1334, generic clones) include a 3.3V voltage regulator and I2C level shifters, making them safe to connect directly to 5V Arduino boards.

```
  Arduino Uno/Nano          TCS34725 Breakout
  +--------------+          +---------------+
  |          5V  |--------->| VIN           |
  |         GND  |--------->| GND           |
  |          A4  |<-------->| SDA           |
  |          A5  |--------->| SCL           |
  |              |          | LED  (opt)    |---> LED illuminator
  |              |          | INT  (opt)    |---> Interrupt output
  +--------------+          +---------------+

  Pull-ups: Most breakout boards include 10K pull-ups on SDA/SCL.
  If using bare IC: add external 4.7K pull-ups to 3.3V.
```

### 2.2 Raspberry Pi Wiring (3.3V native)

The Raspberry Pi GPIO runs at 3.3V natively, matching the TCS34725 directly. No level shifting needed.

```
  Raspberry Pi              TCS34725 Breakout
  +------------------+      +---------------+
  |  Pin 1 (3.3V)    |----->| VIN (or 3V3)  |
  |  Pin 6 (GND)     |----->| GND           |
  |  Pin 3 (GPIO2/SDA)|<--->| SDA           |
  |  Pin 5 (GPIO3/SCL)|---->| SCL           |
  +------------------+      +---------------+

  Enable I2C: sudo raspi-config -> Interface Options -> I2C -> Enable
  Verify: i2cdetect -y 1  (should show device at address 0x29)
```

### 2.3 ESP32 Wiring

```
  ESP32 DevKit             TCS34725 Breakout
  +--------------+         +---------------+
  |         3V3  |-------->| VIN           |
  |         GND  |-------->| GND           |
  |      GPIO21  |<------->| SDA           |
  |      GPIO22  |-------->| SCL           |
  +--------------+         +---------------+

  Default I2C pins on ESP32: SDA=GPIO21, SCL=GPIO22
  Can be remapped to any GPIO pair using Wire.begin(sda, scl)
```

---

## 3. I2C Registers

### 3.1 Register Map

The TCS34725 uses 8-bit register addresses. Set the command bit (0x80) when writing the register address. For multi-byte reads, set the auto-increment bit (0xA0).

| Register | Address | Description |
|----------|---------|-------------|
| ENABLE | 0x00 | Power on, ADC enable, wait enable, interrupt enable |
| ATIME | 0x01 | Integration time (2.4ms per count, 0xFF=2.4ms, 0x00=700ms) |
| WTIME | 0x03 | Wait time between cycles |
| AILTL/AILTH | 0x04-0x05 | Clear channel low interrupt threshold |
| AIHTL/AIHTH | 0x06-0x07 | Clear channel high interrupt threshold |
| PERS | 0x0C | Interrupt persistence filter |
| CONFIG | 0x0D | Wait time configuration |
| CONTROL | 0x0F | Gain control (1x, 4x, 16x, 60x) |
| ID | 0x12 | Device ID (0x44 for TCS34725, 0x4D for TCS34727) |
| STATUS | 0x13 | ADC valid flag, interrupt flag |
| CDATAL/CDATAH | 0x14-0x15 | Clear channel data (16-bit) |
| RDATAL/RDATAH | 0x16-0x17 | Red channel data (16-bit) |
| GDATAL/GDATAH | 0x18-0x19 | Green channel data (16-bit) |
| BDATAL/BDATAH | 0x1A-0x1B | Blue channel data (16-bit) |

### 3.2 Integration Time

Integration time controls how long the ADC accumulates charge. Longer times give higher resolution and better signal-to-noise ratio but slower updates.

| ATIME Value | Integration Time | Max Count | Use Case |
|-------------|-----------------|-----------|----------|
| 0xFF | 2.4 ms | 1024 | Bright sunlight |
| 0xF6 | 24 ms | 10240 | Indoor ambient |
| 0xD5 | 101 ms | 43008 | General purpose |
| 0xC0 | 154 ms | 65535 | Low light |
| 0x00 | 700 ms | 65535 | Very low light (saturates easily) |

Formula: `integration_time_ms = (256 - ATIME) * 2.4`

### 3.3 Gain Control

| CONTROL Value | Gain | Use Case |
|--------------|------|----------|
| 0x00 | 1x | Bright environments (direct sunlight) |
| 0x01 | 4x | Normal indoor lighting |
| 0x02 | 16x | Dim indoor / dusk |
| 0x03 | 60x | Very dim environments |

Higher gain amplifies the photodiode current before ADC conversion. Use higher gain in dim conditions rather than extremely long integration times to maintain responsiveness.

---

## 4. Arduino Code

### 4.1 Using the Adafruit Library

The Adafruit TCS34725 library handles register access, gain, integration time, and provides lux and CCT calculations.

```
#include <Wire.h>
#include <Adafruit_TCS34725.h>

// Initialize with integration time and gain
Adafruit_TCS34725 tcs = Adafruit_TCS34725(
  TCS34725_INTEGRATIONTIME_154MS,  // 154ms integration
  TCS34725_GAIN_4X                  // 4x gain
);

void setup() {
  Serial.begin(9600);

  if (!tcs.begin()) {
    Serial.println("TCS34725 not found at address 0x29");
    Serial.println("Check wiring and I2C pull-ups");
    while (1);  // Halt
  }

  Serial.println("TCS34725 found. Reading RGBC values...");
}

void loop() {
  uint16_t r, g, b, c;

  tcs.getRawData(&r, &g, &b, &c);

  // Compute color temperature and lux
  uint16_t colorTemp = tcs.calculateColorTemperature_dn40(r, g, b, c);
  uint16_t lux = tcs.calculateLux(r, g, b);

  Serial.print("R: "); Serial.print(r);
  Serial.print("  G: "); Serial.print(g);
  Serial.print("  B: "); Serial.print(b);
  Serial.print("  C: "); Serial.print(c);
  Serial.print("  CCT: "); Serial.print(colorTemp); Serial.print("K");
  Serial.print("  Lux: "); Serial.println(lux);

  delay(1000);
}
```

### 4.2 Manual Register Access (No Library)

For understanding what the library does under the hood:

```
#include <Wire.h>

#define TCS34725_ADDR   0x29
#define TCS34725_ENABLE 0x00
#define TCS34725_ATIME  0x01
#define TCS34725_CONTROL 0x0F
#define TCS34725_ID     0x12
#define TCS34725_CDATAL 0x14
#define TCS34725_COMMAND_BIT 0x80

void writeRegister(uint8_t reg, uint8_t value) {
  Wire.beginTransmission(TCS34725_ADDR);
  Wire.write(TCS34725_COMMAND_BIT | reg);
  Wire.write(value);
  Wire.endTransmission();
}

uint8_t readRegister(uint8_t reg) {
  Wire.beginTransmission(TCS34725_ADDR);
  Wire.write(TCS34725_COMMAND_BIT | reg);
  Wire.endTransmission();
  Wire.requestFrom(TCS34725_ADDR, (uint8_t)1);
  return Wire.read();
}

uint16_t readWord(uint8_t reg) {
  Wire.beginTransmission(TCS34725_ADDR);
  Wire.write(TCS34725_COMMAND_BIT | 0x20 | reg);  // Auto-increment
  Wire.endTransmission();
  Wire.requestFrom(TCS34725_ADDR, (uint8_t)2);
  uint16_t low = Wire.read();
  uint16_t high = Wire.read();
  return (high << 8) | low;
}

void setup() {
  Serial.begin(9600);
  Wire.begin();

  // Verify chip ID
  uint8_t id = readRegister(TCS34725_ID);
  Serial.print("Chip ID: 0x"); Serial.println(id, HEX);
  // Expected: 0x44 (TCS34725) or 0x4D (TCS34727)

  // Set integration time: 154ms (0xC0)
  writeRegister(TCS34725_ATIME, 0xC0);

  // Set gain: 4x (0x01)
  writeRegister(TCS34725_CONTROL, 0x01);

  // Power on + ADC enable
  writeRegister(TCS34725_ENABLE, 0x01);  // PON
  delay(3);  // 2.4ms power-on delay
  writeRegister(TCS34725_ENABLE, 0x03);  // PON + AEN
}

void loop() {
  delay(154);  // Wait for integration cycle

  uint16_t c = readWord(TCS34725_CDATAL);
  uint16_t r = readWord(TCS34725_CDATAL + 2);
  uint16_t g = readWord(TCS34725_CDATAL + 4);
  uint16_t b = readWord(TCS34725_CDATAL + 6);

  Serial.print("R:"); Serial.print(r);
  Serial.print(" G:"); Serial.print(g);
  Serial.print(" B:"); Serial.print(b);
  Serial.print(" C:"); Serial.println(c);
}
```

---

## 5. Raspberry Pi Code (Python)

### 5.1 Using the Adafruit CircuitPython Library

```
import time
import board
import adafruit_tcs34725

# Initialize I2C and sensor
i2c = board.I2C()
sensor = adafruit_tcs34725.TCS34725(i2c)

# Configure
sensor.integration_time = 154  # milliseconds
sensor.gain = 4                # 1, 4, 16, or 60

print("TCS34725 Color Sensor — Reading RGBC")
print("-" * 50)

while True:
    r, g, b, c = sensor.color_raw

    # Calculate color temperature (McCamy's approximation)
    if r == 0 or g == 0:
        cct = 0
    else:
        # Chromaticity coordinates
        x = (-0.14282 * r + 1.54924 * g + (-0.95641) * b) / (r + g + b)
        y = (-0.32466 * r + 1.57837 * g + (-0.73191) * b) / (r + g + b)
        n = (x - 0.3320) / (0.1858 - y) if (0.1858 - y) != 0 else 0
        cct = 449 * n**3 + 3525 * n**2 + 6823.3 * n + 5520.33

    # Calculate lux (from Adafruit library approach)
    lux = (-0.32466 * r + 1.57837 * g + (-0.73191) * b) if c > 0 else 0

    # Use library's built-in properties
    temp_k = sensor.color_temperature  # CCT in Kelvin
    lux_val = sensor.lux               # Illuminance in lux

    print(f"R:{r:5d}  G:{g:5d}  B:{b:5d}  C:{c:5d}  "
          f"CCT:{temp_k:5.0f}K  Lux:{lux_val:7.1f}")

    time.sleep(1)
```

### 5.2 Installation

```
# Install CircuitPython libraries
pip3 install adafruit-circuitpython-tcs34725

# Or for raw I2C access without the library:
pip3 install smbus2

# Verify I2C device is detected
i2cdetect -y 1
# Should show "29" at address 0x29
```

---

## 6. Lux Calculation

### 6.1 Theory

Lux measures illuminance -- the luminous flux per unit area as perceived by the human eye. The clear channel approximates total visible light, but a proper lux value weights the RGB channels to match the CIE photopic luminosity function (how the human eye responds to wavelength).

The Adafruit library uses the DN40 algorithm (from the ams application note):

```
Lux = (-0.32466 * R + 1.57837 * G + (-0.73191) * B)
```

This formula weights green most heavily because human vision peaks at ~555 nm (green). The negative red and blue coefficients compensate for spectral overlap between the photodiode filters.

### 6.2 Practical Lux Values

| Environment | Lux Range |
|------------|-----------|
| Direct sunlight | 32,000 - 100,000 |
| Overcast day | 1,000 - 10,000 |
| Office lighting | 300 - 500 |
| Living room | 100 - 300 |
| Hallway / corridor | 50 - 100 |
| Dim room | 10 - 50 |
| Full moon outdoors | 0.1 - 0.3 |

### 6.3 Auto-Ranging

To cover the full 3,800,000:1 dynamic range, implement auto-ranging that adjusts gain and integration time based on the clear channel reading:

```
void autoRange(Adafruit_TCS34725 &tcs) {
  uint16_t r, g, b, c;
  tcs.getRawData(&r, &g, &b, &c);

  if (c > 60000) {
    // Saturating — reduce gain or integration time
    tcs.setGain(TCS34725_GAIN_1X);
    tcs.setIntegrationTime(TCS34725_INTEGRATIONTIME_24MS);
  } else if (c < 100) {
    // Too dim — increase gain and integration time
    tcs.setGain(TCS34725_GAIN_60X);
    tcs.setIntegrationTime(TCS34725_INTEGRATIONTIME_614MS);
  } else if (c < 1000) {
    tcs.setGain(TCS34725_GAIN_16X);
    tcs.setIntegrationTime(TCS34725_INTEGRATIONTIME_154MS);
  } else {
    tcs.setGain(TCS34725_GAIN_4X);
    tcs.setIntegrationTime(TCS34725_INTEGRATIONTIME_154MS);
  }
}
```

---

## 7. Color Temperature (CCT) Calculation

### 7.1 McCamy's Approximation

The standard algorithm for computing correlated color temperature from RGB sensor data uses McCamy's formula after converting to CIE chromaticity coordinates:

```
Step 1: Normalize RGB to chromaticity
  X = (-0.14282 * R) + (1.54924 * G) + (-0.95641 * B)
  Y = (-0.32466 * R) + (1.57837 * G) + (-0.73191 * B)
  Z = (-0.68202 * R) + (0.77073 * G) + (0.56332 * B)

Step 2: CIE chromaticity coordinates
  x = X / (X + Y + Z)
  y = Y / (X + Y + Z)

Step 3: McCamy's CCT formula
  n = (x - 0.3320) / (0.1858 - y)
  CCT = 449 * n^3 + 3525 * n^2 + 6823.3 * n + 5520.33
```

This gives CCT in Kelvin. For the Hue bridge `ct` parameter: `mirek = 1,000,000 / CCT`.

### 7.2 DN40 Algorithm (Improved)

The Adafruit library's `calculateColorTemperature_dn40()` function uses the ams DN40 application note algorithm, which is more accurate than McCamy's approximation for the TCS34725's specific spectral response curves. It compensates for the IR filter characteristics and inter-channel crosstalk.

Use `calculateColorTemperature_dn40()` (not the deprecated `calculateColorTemperature()`) for best accuracy:

```
uint16_t cct = tcs.calculateColorTemperature_dn40(r, g, b, c);
// Note: uses the clear channel (c) as well for better accuracy
```

---

## 8. Comparison: TCS34725 vs APDS9960

The APDS-9960 (used on Adafruit #3595 and SparkFun) combines color sensing with proximity and gesture detection. How does it compare for ambient light measurement?

| Feature | TCS34725 | APDS-9960 |
|---------|----------|-----------|
| Color channels | RGBC (16-bit) | RGBC (16-bit) |
| IR blocking filter | Yes (integrated) | No |
| Gain settings | 1x, 4x, 16x, 60x | 1x, 4x, 16x, 64x |
| Dynamic range | 3,800,000:1 | 1,000,000:1 |
| Proximity sensor | No | Yes (up to 25 cm) |
| Gesture detection | No | Yes (U/D/L/R) |
| I2C address | 0x29 | 0x39 |
| Best for | Dedicated color/CCT | Multi-function (color + gesture) |

**Recommendation:** For circadian lighting where CCT accuracy matters, the TCS34725's IR blocking filter is a significant advantage. The APDS-9960 is better suited for interactive projects that need gesture input alongside rough color sensing.

---

## 9. Mounting and Practical Considerations

### 9.1 Sensor Placement

- Point the sensor toward the window or primary light source for outdoor CCT tracking
- Mount at desk height (not ceiling) for workplace illumination measurement
- Avoid direct sunlight on the sensor -- the clear channel saturates above ~65000 lux at 1x gain
- Use a white diffuser cap (translucent HDPE or a ping-pong ball half) to widen the acceptance angle and average room light

### 9.2 LED Illuminator

The breakout board includes a white LED for illuminating objects for close-range color measurement (paint swatches, fabric). For ambient light sensing, **turn this LED off** -- it contaminates the reading:

```
// Adafruit library: disable onboard LED
// Connect LED pin to a GPIO and drive it LOW
// Or simply do not connect the LED pin
```

### 9.3 Sampling Rate

At 154ms integration time, the maximum useful sampling rate is about 6 readings per second. For circadian adaptation, 1 reading per 30 seconds is sufficient -- CCT changes slowly with the sun's position. Averaging 10 readings reduces noise:

```
uint32_t avgR = 0, avgG = 0, avgB = 0, avgC = 0;
for (int i = 0; i < 10; i++) {
  uint16_t r, g, b, c;
  tcs.getRawData(&r, &g, &b, &c);
  avgR += r; avgG += g; avgB += b; avgC += c;
  delay(160);
}
avgR /= 10; avgG /= 10; avgB /= 10; avgC /= 10;
```

---

## 10. Cross-References

- [Circadian Rhythm Adaptation](m4-circadian-adaptation.md) -- use TCS34725 CCT readings to automate Hue light color temperature
- [Philips Hue CLIP API](m4-philips-hue-api.md) -- the `ct` parameter (mirek) that receives the sensor-computed CCT
- [Arduino LED Control & PWM](m2-arduino-led-control.md) -- Arduino I2C and sensor integration fundamentals
- [ESP32 LED Control](m2-esp32-led.md) -- ESP32 I2C wiring and WiFi for sensor-to-cloud pipelines
- [Raspberry Pi GPIO](m2-raspberry-pi-gpio.md) -- Pi I2C bus configuration and Python sensor libraries
- [Glossary](00-glossary.md) -- CCT, lux, mirek, I2C, CIE chromaticity definitions

---

*Sources: ams TCS34725 datasheet (ams.com), ams DN40 application note, Adafruit TCS34725 library documentation, Adafruit CircuitPython TCS34725 library, CIE 15:2004 Technical Report on Colorimetry, McCamy (1992) "Correlated Color Temperature"*
