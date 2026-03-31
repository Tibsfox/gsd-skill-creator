# DIY LED Circuit: G-Force Indicator — Mercury-Redstone 3 Acceleration Profile

## The Circuit

An Arduino/ATtiny85-based LED bar graph that displays real-time g-force level using an ADXL345 3-axis accelerometer. 10 LEDs in a vertical bar mapped to 0-12g, color-coded by severity: green (0-3g normal), yellow (3-6g launch), orange (6-9g high), red (9-12g extreme). Alan Shepard experienced 6.3g at launch and 11.6g during reentry — the highest reentry g-load in the Mercury program due to the steep ballistic trajectory.

**What it does:**
- ADXL345 accelerometer reads acceleration on all 3 axes via I2C
- Computes vector magnitude: sqrt(x^2 + y^2 + z^2)
- Maps 0-12g to 10 LED segments
- Color zones: LEDs 1-3 green (0-3g), 4-5 yellow (3-6g), 6-7 orange (6-9g), 8-10 red (9-12g)
- At rest (1g), only LED 1 is lit (green) — Earth's gravity
- Push button toggles between live mode and playback mode
- Playback mode: replays Shepard's actual g-force profile over 60 seconds
- Serial output: real-time g-force value for datalogging

**What it teaches:** Acceleration is the most physically felt aspect of spaceflight. At 1g you're standing still. At 6.3g (Shepard's launch peak), a 170-pound person feels like they weigh 1,071 pounds. At 11.6g (Shepard's reentry peak), the same person weighs 1,972 pounds — nearly a ton. Shepard described the reentry as crushing but manageable, his training in the centrifuge at Johnsville having prepared him for exactly this load. The suborbital trajectory meant a steeper reentry angle than orbital flights, producing higher peak g but for a shorter duration. Gagarin's Vostok reentry peaked at about 8g — lower because the orbital reentry angle was shallower.

**Total cost: ~$12**

---

## Schematic

```
Arduino Nano Pin Assignments:

  I2C Bus (ADXL345 Accelerometer):
    A4 (SDA) → ADXL345 SDA (with 4.7KΩ pull-up to 3.3V)
    A5 (SCL) → ADXL345 SCL (with 4.7KΩ pull-up to 3.3V)
    3.3V     → ADXL345 VCC + CS (CS HIGH = I2C mode)
    GND      → ADXL345 GND + SDO (SDO LOW = address 0x53)

  LED Bar (10 segments, vertical):
    D2  → R1  (220Ω) → Green LED 1   (0-1.2g)
    D3  → R2  (220Ω) → Green LED 2   (1.2-2.4g)
    D4  → R3  (220Ω) → Green LED 3   (2.4-3.6g)
    D5  → R4  (220Ω) → Yellow LED 4  (3.6-4.8g)
    D6  → R5  (220Ω) → Yellow LED 5  (4.8-6.0g)
    D7  → R6  (220Ω) → Orange LED 6  (6.0-7.2g)
    D8  → R7  (220Ω) → Orange LED 7  (7.2-8.4g)
    D9  → R8  (220Ω) → Red LED 8     (8.4-9.6g)
    D10 → R9  (220Ω) → Red LED 9     (9.6-10.8g)
    D11 → R10 (220Ω) → Red LED 10    (10.8-12.0g)

  Push Button:
    D12 ← Push Button (10KΩ pull-down to GND, button to 5V)

  Power:
    5V  → Arduino VCC, button rail
    3.3V → ADXL345 VCC (from Arduino 3.3V pin)
    GND → Common ground

Layout (vertical bar, viewed from front):

    [RED 10] ← 12g   Maximum (never want to be here)
    [RED  9] ← 10.8g
    [RED  8] ← 9.6g  ← Shepard reentry peak: 11.6g
    [ORG  7] ← 8.4g
    [ORG  6] ← 7.2g
    [YEL  5] ← 6.0g  ← Shepard launch peak: 6.3g
    [YEL  4] ← 4.8g
    [GRN  3] ← 3.6g
    [GRN  2] ← 2.4g
    [GRN  1] ← 1.2g  ← Standing on Earth: 1g

    [BUTTON] Toggle: LIVE / PLAYBACK
```

## Design Calculations

```
ADXL345 Configuration:
  Range: ±16g (register 0x31, value 0x0B for full resolution ±16g)
  Data rate: 100 Hz (register 0x2C, value 0x0A)
  Resolution: 3.9 mg/LSB (full resolution mode)
  I2C address: 0x53 (SDO pin grounded)

G-force calculation:
  Raw values: 10-bit to 13-bit (depending on range)
  At ±16g, full resolution: 3.9 mg per LSB
  g_x = raw_x * 0.0039
  g_y = raw_y * 0.0039
  g_z = raw_z * 0.0039
  g_total = sqrt(g_x² + g_y² + g_z²)

LED mapping:
  Each LED represents 1.2g (12g / 10 LEDs)
  LEDs lit = floor(g_total / 1.2)
  LED n is ON if g_total > n * 1.2

Shepard's g-force profile (MR-3):
  T+0 to T+60:    1g → 6.3g (launch, increasing as fuel burns)
  T+60 to T+142:  6.3g → 0g (BECO, tower jettison, coast)
  T+142 to T+442: 0g (weightlessness — 5 minutes)
  T+442 to T+460: mild (retrofire, ~1-2g)
  T+460 to T+560: 0g → 11.6g → 1g (reentry, peak at ~T+520)
  T+560 to T+928: 1g (parachute descent, splashdown)

Power budget:
  Arduino Nano: ~20 mA
  ADXL345: 0.14 mA (typical)
  LEDs (worst case 10 lit): 10 × 15 mA = 150 mA
  Total: ~170 mA — easily within USB power budget
```

## Arduino Sketch

```cpp
/*
 * G-Force Indicator — MR-3 Freedom 7 Profile
 * NASA Mission Series v1.19
 *
 * 10-segment LED bar shows g-force level.
 * Live mode: reads ADXL345 accelerometer.
 * Playback mode: replays Shepard's actual profile.
 */

#include <Wire.h>

const int LED_PINS[] = {2, 3, 4, 5, 6, 7, 8, 9, 10, 11};
const int NUM_LEDS = 10;
const int BTN_PIN = 12;
const float MAX_G = 12.0;
const float G_PER_LED = MAX_G / NUM_LEDS;

// ADXL345 registers
const int ADXL345_ADDR = 0x53;
const int REG_POWER_CTL = 0x2D;
const int REG_DATA_FORMAT = 0x31;
const int REG_BW_RATE = 0x2C;
const int REG_DATAX0 = 0x32;

bool playbackMode = false;
unsigned long playbackStart = 0;
bool lastBtnState = false;

// Shepard's g-force profile (time in seconds, g value)
// Compressed to 60 seconds for display (real flight: 928 seconds)
// Scale factor: 60/928 ≈ 0.065
struct GPoint { float time; float g; };
const GPoint PROFILE[] = {
  {0.0, 1.0},     // On pad
  {1.0, 1.5},     // Liftoff
  {4.0, 3.5},     // Accelerating
  {6.0, 6.3},     // Max launch g (T+60s real)
  {8.0, 3.0},     // BECO, thrust drops
  {9.0, 0.0},     // Weightless
  {10.0, 0.0},    // Coast start
  {28.0, 0.0},    // Coast end (5 min real)
  {29.0, 1.5},    // Retrofire
  {31.0, 0.5},    // Post-retro
  {33.0, 0.0},    // Ballistic fall
  {38.0, 4.0},    // Reentry begins
  {42.0, 8.5},    // Building
  {44.0, 11.6},   // PEAK — 11.6g
  {47.0, 6.0},    // Decreasing
  {50.0, 2.0},    // Through heating
  {52.0, 1.0},    // Drogue chute
  {55.0, 1.0},    // Main chute
  {58.0, 1.0},    // Descent
  {60.0, 3.0}     // Splashdown impact
};
const int PROFILE_LEN = 20;

void setup() {
  for (int i = 0; i < NUM_LEDS; i++) {
    pinMode(LED_PINS[i], OUTPUT);
  }
  pinMode(BTN_PIN, INPUT);

  Wire.begin();
  Serial.begin(9600);

  // Initialize ADXL345
  writeReg(REG_DATA_FORMAT, 0x0B);  // Full resolution, ±16g
  writeReg(REG_BW_RATE, 0x0A);      // 100 Hz
  writeReg(REG_POWER_CTL, 0x08);    // Measurement mode

  Serial.println("=== MR-3 G-FORCE INDICATOR ===");
  Serial.println("Freedom 7 — Alan Shepard — May 5, 1961");
  Serial.println("Press button: toggle LIVE/PLAYBACK mode");
  Serial.println("Playback: 60-second compressed flight profile");
}

void writeReg(byte reg, byte value) {
  Wire.beginTransmission(ADXL345_ADDR);
  Wire.write(reg);
  Wire.write(value);
  Wire.endTransmission();
}

float readAccel() {
  Wire.beginTransmission(ADXL345_ADDR);
  Wire.write(REG_DATAX0);
  Wire.endTransmission(false);
  Wire.requestFrom(ADXL345_ADDR, 6);

  int16_t x = Wire.read() | (Wire.read() << 8);
  int16_t y = Wire.read() | (Wire.read() << 8);
  int16_t z = Wire.read() | (Wire.read() << 8);

  float gx = x * 0.0039;
  float gy = y * 0.0039;
  float gz = z * 0.0039;

  return sqrt(gx * gx + gy * gy + gz * gz);
}

float getPlaybackG(float t) {
  // Linear interpolation between profile points
  if (t <= PROFILE[0].time) return PROFILE[0].g;
  if (t >= PROFILE[PROFILE_LEN - 1].time) return PROFILE[PROFILE_LEN - 1].g;

  for (int i = 0; i < PROFILE_LEN - 1; i++) {
    if (t >= PROFILE[i].time && t < PROFILE[i + 1].time) {
      float frac = (t - PROFILE[i].time) / (PROFILE[i + 1].time - PROFILE[i].time);
      return PROFILE[i].g + frac * (PROFILE[i + 1].g - PROFILE[i].g);
    }
  }
  return 1.0;
}

void displayG(float g) {
  int ledsLit = (int)(g / G_PER_LED);
  if (ledsLit > NUM_LEDS) ledsLit = NUM_LEDS;

  for (int i = 0; i < NUM_LEDS; i++) {
    digitalWrite(LED_PINS[i], i < ledsLit ? HIGH : LOW);
  }
}

void loop() {
  // Check mode button
  bool btnState = digitalRead(BTN_PIN) == HIGH;
  if (btnState && !lastBtnState) {
    playbackMode = !playbackMode;
    playbackStart = millis();
    Serial.print("Mode: ");
    Serial.println(playbackMode ? "PLAYBACK (60s flight)" : "LIVE (accelerometer)");
  }
  lastBtnState = btnState;

  float gForce;

  if (playbackMode) {
    float elapsed = (millis() - playbackStart) / 1000.0;
    if (elapsed > 60.0) {
      playbackStart = millis();  // Loop
      elapsed = 0.0;
    }
    gForce = getPlaybackG(elapsed);
  } else {
    gForce = readAccel();
  }

  displayG(gForce);

  // Serial output
  static unsigned long lastPrint = 0;
  if (millis() - lastPrint > 200) {
    lastPrint = millis();
    Serial.print(playbackMode ? "PLAYBACK" : "LIVE");
    Serial.print(" | g=");
    Serial.print(gForce, 1);
    Serial.print(" | LEDs=");
    Serial.print((int)(gForce / G_PER_LED));
    Serial.print("/");
    Serial.print(NUM_LEDS);

    if (gForce > 9.0) Serial.print(" *** EXTREME ***");
    else if (gForce > 6.0) Serial.print(" ** HIGH **");
    else if (gForce < 0.1) Serial.print(" [WEIGHTLESS]");
    Serial.println();
  }

  delay(20);  // 50 Hz update
}
```

## Parts List

| Qty | Part | Cost |
|-----|------|------|
| 1 | Arduino Nano (clone) | $3.50 |
| 1 | ADXL345 accelerometer breakout (I2C) | $2.50 |
| 3 | Green 3mm LEDs (0-3.6g zone) | $0.30 |
| 2 | Yellow 3mm LEDs (3.6-6.0g zone) | $0.20 |
| 2 | Orange 3mm LEDs (6.0-8.4g zone) | $0.20 |
| 3 | Red 3mm LEDs (8.4-12.0g zone) | $0.30 |
| 10 | 220Ω resistors (LED current limit) | $0.50 |
| 2 | 4.7KΩ resistors (I2C pull-up) | $0.10 |
| 1 | 10KΩ resistor (button pull-down) | $0.05 |
| 1 | Momentary push button (mode toggle) | $0.25 |
| 1 | Half-size breadboard | $2.50 |
| 1 | Jumper wire kit | $1.50 |
| -- | USB cable (Arduino power + serial) | included |
| **Total** | | **~$12** |

## The Physics of G-Force

Alan Shepard's MR-3 trajectory was a ballistic arc — up and down, like throwing a ball. The Redstone's A-7 engine pushed him to 6.3g during the powered ascent phase, as the rocket consumed fuel and became lighter while thrust remained constant (the classic "increasing acceleration" of a rocket with constant thrust and decreasing mass).

During the five minutes of weightlessness at the top of the arc, Shepard experienced true zero-g. He was falling around the top of a parabola — the capsule and everything in it falling together, producing the sensation of floating. This is the same physics behind NASA's "Vomit Comet" aircraft that fly parabolic arcs to simulate weightlessness.

The reentry g-load — 11.6g peak — was the highest in the Mercury program. Orbital flights (Glenn, Carpenter, Schirra, Cooper) reentered at shallower angles, spreading the deceleration over a longer time and producing lower peak g (around 7-8g). Shepard's suborbital trajectory came in steeper: the capsule was falling from 187.5 km altitude on a ballistic arc, not grazing the atmosphere from orbital speed. The deceleration was more violent but briefer.

The ADXL345 accelerometer in this circuit operates on the same principle as Shepard's flight instruments — a proof mass on a flexible element, deflected by acceleration. The ADXL345 uses MEMS (microelectromechanical) capacitive sensing; Mercury used strain gauge accelerometers. Same physics, sixty years of miniaturization.

---

## Classroom Extensions

1. **Mass calculation:** If you weigh 150 lbs (68 kg) at 1g, what do you weigh at 6.3g? At 11.6g? (945 lbs / 1,740 lbs)
2. **Profile analysis:** Look at the playback profile. When does weightlessness begin and end? How long does the peak reentry g last?
3. **Compare profiles:** How would an orbital reentry differ? (Longer duration, lower peak — same total velocity change, spread over more time)
4. **Accelerometer experiment:** Hold the circuit at rest (1g), then drop it briefly (0g in freefall). Why does dropping it show 0g even though gravity hasn't changed? (The accelerometer is in freefall — it and its proof mass fall together, measuring no differential force)
5. **Centrifuge training:** Shepard trained in the Johnsville centrifuge up to 12g. Why was centrifuge training essential? (The body's response to high-g — vision graying, breathing difficulty — must be experienced under controlled conditions before encountering it in flight)
