# Circuit: MA-9 Consumable Countdown LED Display

## Mission 1.25 — Mercury-Atlas 9 / Faith 7

**Cost:** ~$25
**Difficulty:** Intermediate
**Time:** 3-4 hours

---

## Overview

A physical consumable countdown display for the MA-9 mission. Five colored LED strips (one per consumable) dim progressively over the 34-hour mission timeline (time-accelerated by a potentiometer). An OLED display shows numerical values, orbit count, and mission status. The CO2 scrubber LED (red) reaches critical first and begins flashing.

## Bill of Materials

| Component | Quantity | Cost |
|-----------|----------|------|
| Arduino Nano | 1 | $8 |
| SSD1306 OLED 128x64 (I2C) | 1 | $8 |
| LED (blue) | 1 | $0.25 |
| LED (green) | 1 | $0.25 |
| LED (red) | 1 | $0.25 |
| LED (orange/amber) | 1 | $0.25 |
| LED (white) | 1 | $0.25 |
| 220Ω resistor | 5 | $0.50 |
| 10K potentiometer | 1 | $1.00 |
| Push button | 1 | $0.50 |
| Piezo buzzer | 1 | $1.00 |
| Breadboard + jumper wires | 1 set | $5.00 |
| **Total** | | **~$25** |

## Wiring

```
Arduino Nano Pinout:
  D3  → Blue LED (battery) through 220Ω
  D5  → Green LED (O2) through 220Ω
  D6  → Red LED (CO2 scrubber) through 220Ω
  D9  → Orange LED (H2O2) through 220Ω
  D10 → White LED (cooling water) through 220Ω
  D11 → Piezo buzzer
  D2  → Push button (to GND, internal pullup)
  A0  → Potentiometer wiper (other legs: 5V and GND)
  A4  → OLED SDA
  A5  → OLED SCL
  5V  → OLED VCC, potentiometer
  GND → OLED GND, LEDs cathodes, button, potentiometer, buzzer
```

## Arduino Sketch

```arduino
// faith7_consumable_countdown.ino
// MA-9 Consumable Countdown Display
// Mission 1.25 — Mercury-Atlas 9 / Faith 7

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define SCREEN_W 128
#define SCREEN_H 64
#define OLED_ADDR 0x3C
Adafruit_SSD1306 display(SCREEN_W, SCREEN_H, &Wire, -1);

// LED pins (PWM capable)
const int LED_BAT = 3;    // blue
const int LED_O2 = 5;     // green
const int LED_CO2 = 6;    // red (limiting!)
const int LED_H2O2 = 9;   // orange
const int LED_H2O = 10;   // white

const int BUZZER = 11;
const int BUTTON = 2;
const int POT = A0;

// Consumable depletion times (hours)
const float BAT_LIFE = 80.0;
const float O2_LIFE = 53.6;
const float CO2_LIFE = 45.0;    // LIMITING
const float H2O2_LIFE = 60.4;
const float H2O_LIFE = 46.6;

const float MISSION_HOURS = 34.33;

float missionTime = 0;  // hours
bool running = false;
unsigned long lastUpdate = 0;

void setup() {
  pinMode(LED_BAT, OUTPUT);
  pinMode(LED_O2, OUTPUT);
  pinMode(LED_CO2, OUTPUT);
  pinMode(LED_H2O2, OUTPUT);
  pinMode(LED_H2O, OUTPUT);
  pinMode(BUZZER, OUTPUT);
  pinMode(BUTTON, INPUT_PULLUP);

  display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR);
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(1);
  display.setCursor(10, 20);
  display.println("FAITH 7 READY");
  display.setCursor(10, 35);
  display.println("Press button to launch");
  display.display();

  // All LEDs full brightness (pre-launch)
  analogWrite(LED_BAT, 255);
  analogWrite(LED_O2, 255);
  analogWrite(LED_CO2, 255);
  analogWrite(LED_H2O2, 255);
  analogWrite(LED_H2O, 255);
}

void loop() {
  // Check button
  if (digitalRead(BUTTON) == LOW) {
    delay(200); // debounce
    running = !running;
    if (!running) missionTime = 0;
  }

  // Read speed potentiometer (1x to 1000x)
  int potVal = analogRead(POT);
  float speed = map(potVal, 0, 1023, 1, 1000);

  if (running && missionTime < MISSION_HOURS + 0.5) {
    unsigned long now = millis();
    float dt = (now - lastUpdate) / 1000.0 / 3600.0; // hours
    missionTime += dt * speed;
    lastUpdate = now;

    // Calculate remaining fractions
    float bat = max(0.0, 1.0 - missionTime / BAT_LIFE);
    float o2 = max(0.0, 1.0 - missionTime / O2_LIFE);
    float co2 = max(0.0, 1.0 - missionTime / CO2_LIFE);
    float h2o2 = max(0.0, 1.0 - missionTime / H2O2_LIFE);
    float h2o = max(0.0, 1.0 - missionTime / H2O_LIFE);

    // Set LED brightness (PWM)
    analogWrite(LED_BAT, (int)(bat * 255));
    analogWrite(LED_O2, (int)(o2 * 255));
    analogWrite(LED_H2O2, (int)(h2o2 * 255));
    analogWrite(LED_H2O, (int)(h2o * 255));

    // CO2 LED: flash when critical
    if (co2 < 0.25) {
      int flash = (millis() / 300) % 2;
      analogWrite(LED_CO2, flash ? (int)(co2 * 255) : 0);
      if ((millis() / 1000) % 3 == 0) tone(BUZZER, 1000, 100);
    } else {
      analogWrite(LED_CO2, (int)(co2 * 255));
    }

    // Update OLED
    int orbit = min(22, (int)(missionTime / 1.475)); // 88.5 min orbits
    int hours = (int)missionTime;
    int mins = (int)((missionTime - hours) * 60);

    display.clearDisplay();
    display.setTextSize(1);
    display.setCursor(0, 0);
    display.print("FAITH 7  ORBIT ");
    display.print(orbit);
    display.print("/22");

    display.setCursor(0, 10);
    display.print("MET: ");
    display.print(hours);
    display.print("h ");
    display.print(mins);
    display.print("m");

    display.setCursor(0, 22);
    display.print("BAT:");
    display.print((int)(bat*100));
    display.print("% O2:");
    display.print((int)(o2*100));
    display.print("%");

    display.setCursor(0, 32);
    display.print("CO2:");
    display.print((int)(co2*100));
    display.print("% ");
    if (co2 < 0.30) display.print("!! ");

    display.setCursor(0, 42);
    display.print("H2O2:");
    display.print((int)(h2o2*100));
    display.print("% H2O:");
    display.print((int)(h2o*100));
    display.print("%");

    display.setCursor(0, 54);
    if (missionTime >= MISSION_HOURS) {
      display.print("SPLASHDOWN 6.4km");
      // Flash all LEDs green
      for (int i = 0; i < 3; i++) {
        analogWrite(LED_O2, 255); delay(200);
        analogWrite(LED_O2, 0); delay(200);
      }
      running = false;
    } else if (missionTime > 33) {
      display.print("!! MANUAL CONTROL !!");
    } else if (missionTime > 31) {
      display.print("! ASCS FAILURE");
    } else if (missionTime > 28) {
      display.print("! 0.05g FALSE ALARM");
    } else if (missionTime > 10 && missionTime < 21) {
      display.print("ZZZ SLEEP PERIOD");
    } else {
      display.print("NOMINAL");
    }

    display.display();
  }

  lastUpdate = millis();
  delay(50);
}
```

## Connection to Mission

Each LED represents a lifeline. As you turn the potentiometer and watch the mission accelerate, the LEDs dim one by one. The red CO2 LED starts flashing first -- the same consumable that limited Cooper's actual flight. At "orbit 19," the display shows the first warning. At "orbit 22," MANUAL CONTROL appears, and the simulation ends with SPLASHDOWN at 6.4 km accuracy.

The physical dimming of the LEDs is the inverse-square law of consumables: the resources run down, the light fades, and the pilot -- Cooper, you -- must manage what remains.
