# DIY LED Circuit: Cloud Cover Indicator

## The Circuit

A hands-on electronic circuit that demonstrates how TIROS-1 observed cloud coverage using a photoresistor array. Four photoresistors represent different "cloud regions" in a grid. When light is blocked (simulating cloud cover), the corresponding LEDs change from blue (clear sky) to white (cloudy). An Arduino reads all four sensors and displays a simple cloud coverage map on a 4-LED array, with a percentage readout on a serial monitor or optional LCD.

**What it does:**
- Four photoresistors (LDRs) arranged in a 2x2 grid represent four geographic regions
- Each LDR is paired with an LED: blue = clear, white = cloud cover detected
- Cloud cover is simulated by placing paper/cards over individual sensors
- Arduino reads analog values from all four sensors at ~10 Hz
- Computes total cloud coverage percentage (0% = all clear, 100% = full overcast)
- Optional buzzer sounds an alert when coverage exceeds a threshold (storm warning)
- Serial output shows a simple ASCII map of cloud conditions
- RGB LEDs can show graduated coverage (blue→cyan→white→gray)

**What it teaches:** TIROS-1's fundamental measurement was cloud coverage — which parts of Earth were cloudy and which were clear. The satellite's cameras recorded reflected sunlight; clouds are bright (high albedo ~0.6-0.8), oceans are dark (albedo ~0.06), land is intermediate (albedo ~0.1-0.3). This circuit maps that measurement to something you can touch: block a sensor (add a cloud), and the system detects the change in reflected light. Four sensors = four pixels — a miniature TIROS-1 imaging the weather of your desk.

**Total cost: ~$12**

---

## Hardware

```
Arduino Nano
     |
     A0  <--- LDR1 (NW quadrant) + 10K pull-down --- CLOUD SENSOR 1
     A1  <--- LDR2 (NE quadrant) + 10K pull-down --- CLOUD SENSOR 2
     A2  <--- LDR3 (SW quadrant) + 10K pull-down --- CLOUD SENSOR 3
     A3  <--- LDR4 (SE quadrant) + 10K pull-down --- CLOUD SENSOR 4
     |
     D3  -------> LED1 (RGB or Blue/White) --- 220R --- GND  [NW]
     D5  -------> LED2 (RGB or Blue/White) --- 220R --- GND  [NE]
     D6  -------> LED3 (RGB or Blue/White) --- 220R --- GND  [SW]
     D9  -------> LED4 (RGB or Blue/White) --- 220R --- GND  [SE]
     |
     D10 -------> Buzzer (optional storm warning) --- GND
     |
     I2C -------> LCD 1602 (optional) --- display coverage %

SENSOR LAYOUT (top view — "map" of cloud regions):

    +-----------+-----------+
    |           |           |
    |   LDR1   |   LDR2    |
    |   (NW)   |   (NE)    |
    |   LED1   |   LED2    |
    +-----------+-----------+
    |           |           |
    |   LDR3   |   LDR4    |
    |   (SW)   |   (SE)    |
    |   LED3   |   LED4    |
    +-----------+-----------+

Each LDR faces upward. Place cards/paper over sensors to
simulate cloud cover. The LEDs below each sensor indicate
the cloud state of that "region."
```

---

## Schematic

```
         +5V
          |
         LDR1 (photoresistor, ~1K-100K depending on light)
          |
    A0 ---+
          |
         10K
          |
         GND

(Repeat for A1/LDR2, A2/LDR3, A3/LDR4)

LED circuit (per LED):
    D3 ---[220R]---[LED]--- GND

For RGB LEDs (common cathode):
    D3 (red) ---[220R]---+
    D4 (green) ---[220R]--+-- LED1 --- GND
    D5 (blue) ---[220R]---+

Optional storm buzzer:
    D10 ---[100R]---[Buzzer+]---[Buzzer-]--- GND
```

---

## Software

```cpp
// TIROS-1 Cloud Cover Indicator
// Mission 1.15 — First weather satellite
//
// Reads 4 photoresistors representing cloud regions.
// Maps light level to cloud coverage on LEDs.
// TIROS-1 saw the Earth this way: bright = clouds, dark = ocean/land.
//
// In this circuit the mapping is inverted for intuition:
//   High light on sensor = clear sky (blue LED)
//   Low light on sensor = cloud blocking sun (white LED)

const int LDR_PINS[] = {A0, A1, A2, A3};
const int LED_PINS[] = {3, 5, 6, 9};       // PWM-capable for dimming
const int BUZZER_PIN = 10;
const int NUM_SENSORS = 4;

// Calibration: measure your LDR values for "clear" and "cloudy"
// In a lit room: clear ~600-800, cloudy (covered) ~100-300
const int CLEAR_THRESHOLD = 600;
const int CLOUDY_THRESHOLD = 300;

// Cloud state for each region
int cloudLevel[4] = {0, 0, 0, 0};  // 0=clear, 255=full cloud

// Region names (like TIROS-1's weather quadrants)
const char* regionNames[] = {"NW", "NE", "SW", "SE"};

void setup() {
  Serial.begin(9600);
  for (int i = 0; i < NUM_SENSORS; i++) {
    pinMode(LED_PINS[i], OUTPUT);
  }
  pinMode(BUZZER_PIN, OUTPUT);

  Serial.println("=================================");
  Serial.println("TIROS-1 Cloud Cover Indicator");
  Serial.println("Mission 1.15 — First Weather Sat");
  Serial.println("=================================");
  Serial.println("Cover sensors to simulate clouds.");
  Serial.println();
}

void loop() {
  int totalCloud = 0;

  // Read all sensors
  for (int i = 0; i < NUM_SENSORS; i++) {
    int raw = analogRead(LDR_PINS[i]);

    // Map: high reading = bright = clear, low reading = dark = cloudy
    if (raw >= CLEAR_THRESHOLD) {
      cloudLevel[i] = 0;       // Clear
    } else if (raw <= CLOUDY_THRESHOLD) {
      cloudLevel[i] = 255;     // Full cloud cover
    } else {
      // Graduated: partial cloud cover
      cloudLevel[i] = map(raw, CLEAR_THRESHOLD, CLOUDY_THRESHOLD, 0, 255);
    }

    // Drive LED: 0=off (clear/blue ambient), 255=bright white (cloudy)
    analogWrite(LED_PINS[i], cloudLevel[i]);

    totalCloud += cloudLevel[i];
  }

  // Calculate overall cloud coverage percentage
  int coveragePercent = (totalCloud * 100) / (255 * NUM_SENSORS);

  // Print ASCII cloud map
  Serial.println("--- TIROS-1 Cloud Map ---");
  Serial.print("| ");
  Serial.print(cloudLevel[0] > 127 ? "###" : " . ");
  Serial.print(" | ");
  Serial.print(cloudLevel[1] > 127 ? "###" : " . ");
  Serial.println(" |");
  Serial.print("| ");
  Serial.print(cloudLevel[2] > 127 ? "###" : " . ");
  Serial.print(" | ");
  Serial.print(cloudLevel[3] > 127 ? "###" : " . ");
  Serial.println(" |");
  Serial.print("Coverage: ");
  Serial.print(coveragePercent);
  Serial.println("%");

  // Storm warning: >75% coverage
  if (coveragePercent > 75) {
    Serial.println("*** STORM WARNING ***");
    tone(BUZZER_PIN, 1000, 200);
  } else {
    noTone(BUZZER_PIN);
  }

  Serial.println();
  delay(500);  // Update ~2 Hz (faster than TIROS-1's camera!)
}
```

---

## Parts List

| Component | Qty | Est. Cost | Notes |
|-----------|-----|-----------|-------|
| Arduino Nano (clone) | 1 | $3.00 | Any Arduino works |
| Photoresistor (LDR) | 4 | $1.00 | GL5528 or similar |
| 10K resistor | 4 | $0.20 | Pull-down for voltage divider |
| 220 ohm resistor | 4 | $0.20 | LED current limiting |
| LED (white, 5mm) | 4 | $0.40 | Or RGB for color gradients |
| Piezo buzzer | 1 | $0.50 | Optional storm alert |
| Breadboard | 1 | $2.00 | Half-size sufficient |
| Jumper wires | ~20 | $1.00 | M-M for breadboard |
| Card/paper scraps | 4 | free | Cloud simulators |
| **Total** | | **~$8.30** | |

Optional additions:
| LCD 1602 + I2C backpack | 1 | $3.00 | Display coverage % |
| RGB LEDs (common cathode) | 4 | $1.00 | Blue→white gradient |

---

## What You Learn

1. **Photoresistor behavior:** Resistance changes with light level — the same principle as TIROS-1's vidicon camera tubes, where a photoconductive surface converts light patterns to electrical signals
2. **Analog-to-digital conversion:** The Arduino's ADC converts continuous light levels to discrete numbers — TIROS-1 performed the same conversion to transmit images as video signals
3. **Thresholding:** Converting a continuous measurement (light intensity) into a categorical decision (clear/cloudy) — the foundation of cloud classification that TIROS-1 made possible
4. **Spatial sampling:** Four sensors measure four locations simultaneously — TIROS-1's cameras sampled many spatial locations to build a complete cloud image

## Connection to TIROS-1

TIROS-1's two vidicon cameras were essentially photoresistor arrays — a photoconductive surface (antimony trisulfide) that changed conductivity based on the light pattern focused on it. An electron beam scanned the surface, reading out the light pattern as a varying electrical signal. This circuit distills that principle to its essence: a photoresistor reads light, and the system reports what it sees. Four sensors are a 2x2 pixel camera. TIROS-1's cameras had roughly 500 lines of resolution — 250,000 pixels. Scale the principle up 62,500 times and you have TIROS-1.

The cloud coverage percentage is the fundamental measurement that launched meteorological satellite observation. Before TIROS-1, weather observers on the ground estimated cloud cover by looking up. After TIROS-1, they could look down and see the entire storm system at once. This circuit lets you simulate that shift in perspective: you are TIROS-1, looking down at your cloud regions, measuring their coverage from above.
