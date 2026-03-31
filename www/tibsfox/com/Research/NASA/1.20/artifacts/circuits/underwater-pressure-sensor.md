# DIY Circuit: Underwater Pressure Sensor — Depth Display for Liberty Bell 7

## The Circuit

An Arduino-based depth gauge using an MPX5700AP absolute pressure sensor, calibrated for seawater density. Displays depth in meters on a 4-digit 7-segment LED display (TM1637 module). The sensor measures atmospheric pressure plus water column pressure to calculate depth from 0 to 50 meters (a scaled model of Liberty Bell 7's 4,900-meter resting depth). Three status LEDs indicate depth zones: green (surface, 0-10m), yellow (shallow, 10-30m), red (deep, 30-50m). A "depth record" feature tracks the deepest reading achieved in the current session.

**What it does:**
- MPX5700AP pressure sensor reads absolute pressure (15-700 kPa range)
- At sea level: reads ~101.3 kPa (1 atmosphere)
- Each meter of seawater adds ~10.05 kPa (seawater density 1,025 kg/m^3)
- Arduino calculates depth: d = (P_measured - P_atmosphere) / (rho * g)
- TM1637 4-digit display shows depth in meters (XX.X format)
- Green/yellow/red LEDs indicate depth zone
- Push button calibrates atmospheric pressure (zeroes the reading at surface)
- Serial output logs pressure (kPa), depth (m), and temperature (C) at 1 Hz

**What it teaches:** Pressure increases linearly with depth in an incompressible fluid. At 4,900 meters — where Liberty Bell 7 rested for 38 years — the pressure is approximately 49,350 kPa, or about 487 atmospheres. Every square centimeter of the capsule hull bore 50.3 kg of force. The capsule survived because the hatch opening equalized internal and external pressure as water flooded in during sinking — the hull was never subjected to a crushing differential. Curt Newport's 1999 recovery expedition used side-scan sonar and a remotely operated vehicle to locate and lift the capsule from this extreme depth. The MPX5700AP can only measure to about 60 meters of water depth (700 kPa), so this circuit serves as a scaled demonstration.

**Total cost: ~$14**

---

## Schematic

```
Arduino Nano Pin Assignments:

  Analog Input (Pressure Sensor):
    A0 ← MPX5700AP Vout (0.2V to 4.7V, proportional to pressure)

  I2C (optional temperature sensor for density correction):
    A4 (SDA) → DS18B20 data (with 4.7KΩ pull-up to 5V)
    A5 (SCL) → (unused for 1-Wire, but reserved)

  TM1637 4-Digit Display:
    D2 → TM1637 CLK
    D3 → TM1637 DIO

  Status LEDs:
    D5 → R1 (220Ω) → Green LED   (0-10m surface zone)
    D6 → R2 (220Ω) → Yellow LED  (10-30m shallow zone)
    D7 → R3 (220Ω) → Red LED     (30-50m deep zone)

  Push Button (calibration):
    D8 ← Push Button (10KΩ pull-down to GND, button to 5V)

  Power:
    5V → MPX5700AP Vs (pin 3), TM1637 VCC, pull-up
    GND → MPX5700AP GND (pin 2), TM1637 GND, LED cathodes

  MPX5700AP Pinout (bottom view, pins down):
    Pin 1: Vout (to Arduino A0)
    Pin 2: GND
    Pin 3: Vs (5V supply)
    Pin 4-6: NC (not connected)

  Detailed Layout:

    MPX5700AP                TM1637 Display
    ┌─────────┐              ┌───────────┐
    │ 1  2  3 │              │ CLK  DIO  │
    │ O  G  V │              │  │    │   │
    └────┬──┬─┘              └──┬────┬───┘
         │  │                   │    │
    Vout │  │ 5V                │    │
      │  │  │                   │    │
      │  │  └───── 5V rail      │    │
      │  └──────── GND rail     │    │
      │                         │    │
    [100nF] to GND (bypass)     │    │
      │                         │    │
    Arduino A0            D2 ───┘  D3 ┘
      │
    [10KΩ]──GND  (voltage divider — see calculations)
      │
    Arduino A0
```

## Design Calculations

```
Pressure-to-depth conversion:

  Hydrostatic pressure:
    P = P_atm + ρ × g × d

  Where:
    P_atm = atmospheric pressure (≈101.325 kPa at sea level)
    ρ = seawater density (1,025 kg/m³ at 15°C, 35‰ salinity)
    g = 9.80665 m/s²
    d = depth in meters

  Solving for depth:
    d = (P - P_atm) / (ρ × g)
    d = (P - P_atm) / (1025 × 9.80665)
    d = (P - P_atm) / 10,051.8 Pa/m
    d = (P - P_atm) / 10.052 kPa/m

  Liberty Bell 7 at 4,900 m:
    P = 101.3 + (10.052 × 4900)
    P = 101.3 + 49,254.8
    P = 49,356 kPa = 487.2 atmospheres = 7,158 PSI

MPX5700AP transfer function:
  Vout = Vs × (0.0012858 × P_kPa − 0.04) ± Error
  At 5V supply:
    Vout = 5 × (0.0012858 × P − 0.04)
    Vout = 0.006429 × P − 0.2

  At 101.3 kPa (sea level): Vout = 0.006429 × 101.3 − 0.2 = 0.451V
  At 700 kPa (max sensor):  Vout = 0.006429 × 700 − 0.2 = 4.30V

  Inverse (voltage to pressure):
    P = (Vout + 0.2) / 0.006429

  Arduino ADC (10-bit, 0-5V):
    ADC_value = Vout × 1023 / 5
    Vout = ADC_value × 5 / 1023

  Combined:
    P = (ADC × 5 / 1023 + 0.2) / 0.006429
    d = (P − P_atm_calibrated) / 10.052

  Maximum measurable depth:
    P_max = 700 kPa
    d_max = (700 − 101.3) / 10.052 = 59.6 m
    (So ~50m working range with margin)

  Resolution:
    ADC step = 5V / 1023 = 4.89 mV
    Pressure step = 4.89 mV / 6.429 mV/kPa = 0.76 kPa
    Depth step = 0.76 / 10.052 = 0.076 m ≈ 7.6 cm
    (Adequate for display in XX.X format)
```

## Arduino Code

```cpp
// Underwater Pressure Sensor — Liberty Bell 7 Depth Display
// NASA Mission Series v1.20

#include <TM1637Display.h>

// Pin definitions
#define PRESSURE_PIN  A0
#define TM1637_CLK    2
#define TM1637_DIO    3
#define LED_GREEN     5
#define LED_YELLOW    6
#define LED_RED       7
#define CAL_BUTTON    8

// Display
TM1637Display display(TM1637_CLK, TM1637_DIO);

// Physical constants
const float RHO_SEAWATER = 1025.0;   // kg/m^3 (15°C, 35‰ salinity)
const float G_EARTH = 9.80665;        // m/s^2
const float KPA_PER_METER = RHO_SEAWATER * G_EARTH / 1000.0;  // 10.052

// Calibration
float p_atmosphere = 101.325;  // kPa, updated on calibration
float max_depth = 0.0;         // Deepest reading this session

// Smoothing (8-sample moving average)
const int AVG_SIZE = 8;
float readings[AVG_SIZE];
int readIdx = 0;

void setup() {
  Serial.begin(9600);
  Serial.println("=== Liberty Bell 7 Depth Gauge ===");
  Serial.println("    NASA Mission Series v1.20");
  Serial.println("    Press button to calibrate at surface");
  Serial.println();

  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_YELLOW, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  pinMode(CAL_BUTTON, INPUT);

  display.setBrightness(0x0F);  // Max brightness
  display.showNumberDecEx(0, 0b01000000, true, 4, 0);  // Show 00.00

  // Initialize readings array
  for (int i = 0; i < AVG_SIZE; i++) readings[i] = 101.3;

  // Auto-calibrate at startup
  delay(500);
  calibrate();
}

float readPressure() {
  int adc = analogRead(PRESSURE_PIN);
  float voltage = adc * 5.0 / 1023.0;

  // MPX5700AP transfer function (inverse)
  float pressure = (voltage + 0.2) / 0.006429;

  // Store in ring buffer
  readings[readIdx] = pressure;
  readIdx = (readIdx + 1) % AVG_SIZE;

  // Compute average
  float sum = 0;
  for (int i = 0; i < AVG_SIZE; i++) sum += readings[i];
  return sum / AVG_SIZE;
}

void calibrate() {
  float sum = 0;
  for (int i = 0; i < 16; i++) {
    int adc = analogRead(PRESSURE_PIN);
    float voltage = adc * 5.0 / 1023.0;
    sum += (voltage + 0.2) / 0.006429;
    delay(50);
  }
  p_atmosphere = sum / 16.0;
  max_depth = 0.0;

  Serial.print("Calibrated: P_atm = ");
  Serial.print(p_atmosphere, 2);
  Serial.println(" kPa");
}

void loop() {
  // Check calibration button
  if (digitalRead(CAL_BUTTON) == HIGH) {
    calibrate();
    delay(500);  // Debounce
  }

  // Read pressure and compute depth
  float pressure = readPressure();
  float depth = (pressure - p_atmosphere) / KPA_PER_METER;
  if (depth < 0) depth = 0;  // Can't go above surface

  // Track maximum
  if (depth > max_depth) max_depth = depth;

  // Display depth (XX.X format)
  int displayVal = (int)(depth * 10);
  if (displayVal > 9999) displayVal = 9999;
  display.showNumberDecEx(displayVal, 0b01000000, false, 4, 0);

  // Status LEDs
  digitalWrite(LED_GREEN,  depth < 10.0 ? HIGH : LOW);
  digitalWrite(LED_YELLOW, depth >= 10.0 && depth < 30.0 ? HIGH : LOW);
  digitalWrite(LED_RED,    depth >= 30.0 ? HIGH : LOW);

  // Serial output
  Serial.print("P=");
  Serial.print(pressure, 1);
  Serial.print(" kPa  d=");
  Serial.print(depth, 2);
  Serial.print(" m  max=");
  Serial.print(max_depth, 2);
  Serial.print(" m");

  // Scale context
  float lb7_scale = depth / 4900.0 * 100.0;
  Serial.print("  (");
  Serial.print(lb7_scale, 3);
  Serial.println("% of Liberty Bell 7 depth)");

  delay(1000);
}
```

## Parts List

| Qty | Part | Cost |
|-----|------|------|
| 1 | Arduino Nano (or clone) | $3.00 |
| 1 | MPX5700AP pressure sensor (15-700 kPa absolute) | $5.00 |
| 1 | TM1637 4-digit 7-segment LED display module | $1.50 |
| 3 | LEDs (1 green, 1 yellow, 1 red) | $0.15 |
| 3 | 220 ohm resistors (LED current limiting) | $0.15 |
| 1 | 100 nF ceramic capacitor (sensor bypass) | $0.05 |
| 1 | 10 KΩ resistor (button pull-down) | $0.05 |
| 1 | Push button (momentary) | $0.20 |
| 1 | Small breadboard | $1.00 |
| -- | Jumper wires | $0.50 |
| **Total** | | **~$14** |

## Why Underwater Pressure Matters

Liberty Bell 7 sank to 4,900 meters — nearly 5 kilometers below the Atlantic surface. At that depth, the pressure is 487 atmospheres. Every square centimeter bears the weight of a small car. The capsule survived this crushing force because seawater flooded through the open hatch during the descent, equalizing the pressure inside and out. A sealed vessel of the same construction would have imploded.

For 38 years, Liberty Bell 7 sat on the abyssal plain in total darkness. In 1999, Curt Newport — who had spent 14 years searching — finally located it using side-scan sonar. A remotely operated vehicle attached lift cables, and the capsule was raised to the surface in a 5-hour lift operation. When it broke the surface, seawater poured from the open hatch — the same hatch that had caused the disaster.

The pressure sensor in this circuit can only measure to about 60 meters — a tiny fraction of Liberty Bell 7's depth. But the physics is the same at every depth: P = rho * g * h. The relationship is linear. The only things that change at extreme depth are the compressibility corrections (seawater density increases slightly at extreme pressure) and the fact that the pressure sensor would need to be rated for 500+ atmospheres. Such sensors exist — they are used in deep-ocean research submersibles and ROVs like the ones that found Liberty Bell 7.

The SPICE simulation (explosive-bolt-circuit.cir) models the electrical system that may have caused the hatch to blow prematurely.

---

## Classroom Extensions

1. **Pressure linearity test:** Fill a tall cylinder with water and lower the sensor. Plot pressure vs depth. Confirm the relationship is linear. Calculate the local water density from the slope.
2. **Fresh vs salt water:** Repeat with fresh water (rho = 1000 kg/m^3) and salt water (rho = 1025 kg/m^3). The depth readings will differ by about 2.5% — can your circuit detect this?
3. **Temperature compensation:** Seawater density varies with temperature (1028 kg/m^3 at 5°C, 1022 at 25°C). Add a DS18B20 temperature sensor and correct the density in software.
4. **Scale model calculation:** If this sensor maxes out at ~60m, what scale factor maps 60m to 4,900m? (About 1:82.) Build a scale model: a 60cm water column represents 4,900m.
5. **Compressibility:** At 4,900m, seawater is about 2.2% denser than at the surface due to compression. How much error does ignoring compressibility introduce in your depth calculation?
