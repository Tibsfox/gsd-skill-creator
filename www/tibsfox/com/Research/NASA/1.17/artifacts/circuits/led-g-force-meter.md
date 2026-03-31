# DIY LED Circuit: G-Force Meter — Mercury-Redstone 2 Flight Profile

## The Circuit

An Arduino-based LED bar graph that displays the g-force profile of Ham's MR-2 flight in real time. 16 LEDs arranged vertically show instantaneous g-force level, cycling through the complete flight timeline. Green for tolerable forces, yellow for high stress, red for the 14.7g reentry peak. The abort event is visible as a sudden jump in the display.

**What it does:**
- 16 LEDs in a vertical bar: 6 green (1-3g), 5 yellow (4-8g), 5 red (9-15g)
- Arduino cycles through MR-2's actual g-force timeline (~20 seconds compressed)
- Launch phase: green LEDs light (1g → 6g)
- Abort fires: sudden jump into yellow zone (extra thrust)
- Weightlessness: all LEDs off (0g coast)
- Reentry peak: red LEDs climb to maximum (14.7g)
- Splashdown: drops back to green (1g)
- Piezo buzzer increases pitch with g-force level
- Push button to pause/resume the timeline

**What it teaches:** Ham experienced forces that would incapacitate most humans. The abort system firing at T+137s added unexpected thrust, pushing the capsule to 253 km instead of the planned 185 km. This higher trajectory meant a steeper, faster reentry and consequently higher g-forces — 14.7g peak versus the planned ~11g. The LED bar makes the difference visceral: you can see how the abort cascaded through the entire flight profile.

**Total cost: ~$14**

---

## Schematic

```
Arduino Nano/Uno Pin Assignments:

  Digital Outputs (16 LEDs via 2x 74HC595 shift registers):
    D11 → 595 Data (SER)
    D12 → 595 Clock (SRCLK)
    D13 → 595 Latch (RCLK)

  First 74HC595 (LEDs 1-8, bottom of bar):
    Q0 → R1 (220Ω) → Green LED 1   (1g)
    Q1 → R2 (220Ω) → Green LED 2   (1.5g)
    Q2 → R3 (220Ω) → Green LED 3   (2g)
    Q3 → R4 (220Ω) → Green LED 4   (2.5g)
    Q4 → R5 (220Ω) → Green LED 5   (3g)
    Q5 → R6 (220Ω) → Green LED 6   (3.5g)
    Q6 → R7 (220Ω) → Yellow LED 7  (4g)
    Q7 → R8 (220Ω) → Yellow LED 8  (5g)

  Second 74HC595 (LEDs 9-16, top of bar):
    Q0 → R9  (220Ω) → Yellow LED 9   (6g)
    Q1 → R10 (220Ω) → Yellow LED 10  (7g)
    Q2 → R11 (220Ω) → Yellow LED 11  (8g)
    Q3 → R12 (220Ω) → Red LED 12     (9g)
    Q4 → R13 (220Ω) → Red LED 13     (11g)
    Q5 → R14 (220Ω) → Red LED 14     (13g)
    Q6 → R15 (220Ω) → Red LED 15     (14g)
    Q7 → R16 (220Ω) → Red LED 16     (15g)

  Additional:
    D9  → Piezo Buzzer
    D2  ← Pause Button (10K pull-down to GND, button to 5V)

  Power:
    5V  → 595 VCC, button rail
    GND → 595 GND, LED cathodes, pull-down, buzzer GND

Layout (LED bar, bottom to top):
                     ┌────────────────────────────┐
    595 #1 Q0 ─[220Ω]─ LED(grn) ─ GND   1g       │
    595 #1 Q1 ─[220Ω]─ LED(grn) ─ GND   1.5g     │
    595 #1 Q2 ─[220Ω]─ LED(grn) ─ GND   2g       │
    595 #1 Q3 ─[220Ω]─ LED(grn) ─ GND   2.5g     │
    595 #1 Q4 ─[220Ω]─ LED(grn) ─ GND   3g       │
    595 #1 Q5 ─[220Ω]─ LED(grn) ─ GND   3.5g     │ GREEN
    595 #1 Q6 ─[220Ω]─ LED(yel) ─ GND   4g       │
    595 #1 Q7 ─[220Ω]─ LED(yel) ─ GND   5g       │ YELLOW
    595 #2 Q0 ─[220Ω]─ LED(yel) ─ GND   6g       │
    595 #2 Q1 ─[220Ω]─ LED(yel) ─ GND   7g       │
    595 #2 Q2 ─[220Ω]─ LED(yel) ─ GND   8g       │
    595 #2 Q3 ─[220Ω]─ LED(red) ─ GND   9g       │
    595 #2 Q4 ─[220Ω]─ LED(red) ─ GND   11g      │ RED
    595 #2 Q5 ─[220Ω]─ LED(red) ─ GND   13g      │
    595 #2 Q6 ─[220Ω]─ LED(red) ─ GND   14g      │
    595 #2 Q7 ─[220Ω]─ LED(red) ─ GND   15g      │
                     └────────────────────────────┘

  Shift Register Chain:
    Arduino D11 (Data)  → 595 #1 SER
    Arduino D12 (Clock) → 595 #1 SRCLK + 595 #2 SRCLK
    Arduino D13 (Latch) → 595 #1 RCLK  + 595 #2 RCLK
    595 #1 QH' → 595 #2 SER  (daisy chain)
```

## Arduino Sketch

```cpp
/*
 * G-Force Meter — MR-2 Ham Flight Profile
 * NASA Mission Series v1.17
 *
 * Displays Ham's g-force timeline on a 16-LED bar graph.
 * Shows how the abort system changed the g-force profile.
 */

const int DATA_PIN  = 11;  // 74HC595 SER
const int CLOCK_PIN = 12;  // 74HC595 SRCLK
const int LATCH_PIN = 13;  // 74HC595 RCLK
const int BUZZER    = 9;
const int BTN_PAUSE = 2;

// G-force timeline (simplified from MR-2 telemetry)
// Each entry: {time_fraction (0-1), g_force}
// 20-second compressed cycle
const float PROFILE[][2] = {
  {0.00,  1.0},   // On pad
  {0.05,  1.2},   // Liftoff
  {0.10,  2.5},   // Early ascent
  {0.15,  4.0},   // Powered flight
  {0.20,  5.5},   // Approaching max-Q
  {0.25,  6.0},   // Max thrust
  {0.28,  6.3},   // Just before abort
  {0.30,  9.0},   // ABORT FIRES — sudden jump
  {0.33,  8.0},   // Abort thrust continuing
  {0.38,  3.0},   // Burnout approaching
  {0.42,  0.5},   // Coast begins
  {0.50,  0.0},   // Weightlessness
  {0.55,  0.0},   // Apogee 253 km
  {0.60,  0.5},   // Beginning descent
  {0.65,  2.0},   // Retro-fire
  {0.70,  4.0},   // Atmosphere contact
  {0.75,  8.0},   // Reentry heating
  {0.80, 12.0},   // Heavy reentry
  {0.83, 14.7},   // PEAK — 14.7g
  {0.86, 11.0},   // Past peak
  {0.88,  6.0},   // Decelerating
  {0.91,  3.0},   // Drogue chute
  {0.94,  2.0},   // Main chute
  {0.97,  1.5},   // Descent
  {1.00,  1.0},   // Splashdown
};
const int PROFILE_LEN = 25;

const unsigned long CYCLE_MS = 20000;  // 20-second cycle
bool paused = false;
unsigned long pauseOffset = 0;

void setup() {
  pinMode(DATA_PIN, OUTPUT);
  pinMode(CLOCK_PIN, OUTPUT);
  pinMode(LATCH_PIN, OUTPUT);
  pinMode(BUZZER, OUTPUT);
  pinMode(BTN_PAUSE, INPUT);

  Serial.begin(9600);
  Serial.println("=== MR-2 G-FORCE METER ===");
  Serial.println("Ham's flight profile on 16-LED bar");
  Serial.println("Green: 1-3g | Yellow: 4-8g | Red: 9-15g");
}

float interpolateG(float t) {
  // Find surrounding profile points and interpolate
  for (int i = 0; i < PROFILE_LEN - 1; i++) {
    if (t >= PROFILE[i][0] && t <= PROFILE[i+1][0]) {
      float frac = (t - PROFILE[i][0]) / (PROFILE[i+1][0] - PROFILE[i][0]);
      return PROFILE[i][1] + frac * (PROFILE[i+1][1] - PROFILE[i][1]);
    }
  }
  return 1.0;
}

int gToLEDs(float g) {
  // Map 0-15g to 0-16 LEDs lit
  int leds = (int)(g / 15.0 * 16.0 + 0.5);
  if (leds < 0) leds = 0;
  if (leds > 16) leds = 16;
  return leds;
}

void updateBar(int numLit) {
  // Build 16-bit value: bottom LED = bit 0
  unsigned int barValue = 0;
  for (int i = 0; i < numLit; i++) {
    barValue |= (1 << i);
  }

  // Shift out to two 74HC595s (MSB first = top register first)
  digitalWrite(LATCH_PIN, LOW);
  shiftOut(DATA_PIN, CLOCK_PIN, MSBFIRST, (barValue >> 8) & 0xFF);
  shiftOut(DATA_PIN, CLOCK_PIN, MSBFIRST, barValue & 0xFF);
  digitalWrite(LATCH_PIN, HIGH);
}

void loop() {
  // Check pause button
  if (digitalRead(BTN_PAUSE) == HIGH) {
    delay(200);  // debounce
    paused = !paused;
    if (paused) {
      pauseOffset = millis();
      noTone(BUZZER);
      Serial.println("[PAUSED]");
    } else {
      Serial.println("[RESUMED]");
    }
  }

  if (paused) return;

  // Calculate current position in cycle
  float t = fmod((float)(millis() % CYCLE_MS) / CYCLE_MS, 1.0);
  float g = interpolateG(t);
  int leds = gToLEDs(g);

  updateBar(leds);

  // Buzzer: pitch proportional to g-force
  if (g > 0.5) {
    int freq = 200 + (int)(g / 15.0 * 2000);
    tone(BUZZER, freq);
  } else {
    noTone(BUZZER);  // Silence during weightlessness
  }

  // Serial output
  static unsigned long lastPrint = 0;
  if (millis() - lastPrint > 500) {
    lastPrint = millis();
    Serial.print("T=");
    Serial.print(t * 100, 0);
    Serial.print("% G=");
    Serial.print(g, 1);
    Serial.print("g LEDs=");
    Serial.print(leds);
    if (g > 12.0) Serial.print(" *** EXTREME ***");
    else if (g > 6.0) Serial.print(" ** HIGH **");
    else if (g < 0.5) Serial.print(" ~~ WEIGHTLESS ~~");
    Serial.println();
  }

  delay(50);  // 20 Hz update rate
}
```

## Parts List

| Qty | Part | Cost |
|-----|------|------|
| 1 | Arduino Nano (clone) | $3.50 |
| 2 | 74HC595 shift registers | $1.00 |
| 6 | Green 3mm LEDs | $0.60 |
| 5 | Yellow 3mm LEDs | $0.50 |
| 5 | Red 3mm LEDs | $0.50 |
| 16 | 220Ω resistors (LED current limit) | $0.80 |
| 1 | 10KΩ resistor (pull-down) | $0.05 |
| 1 | Momentary push button (pause) | $0.25 |
| 1 | Piezo buzzer (passive) | $0.50 |
| 1 | Half-size breadboard | $2.50 |
| 1 | Jumper wire kit | $2.00 |
| 1 | USB cable (Arduino power + serial) | $1.00 |
| **Total** | | **~$14** |

## The MR-2 G-Force Profile Explained

Ham the chimpanzee was trained at Holloman Air Force Base to perform lever-pull tasks in response to light stimuli. During his flight on January 31, 1961, the abort system activated at T+137 seconds due to higher-than-expected fuel consumption and cabin pressure loss. The abort added extra thrust from the escape rocket, pushing the capsule to 253 km altitude instead of the planned 185 km.

The consequences cascaded:
1. **Higher altitude** → steeper descent angle
2. **Steeper descent** → higher reentry velocity
3. **Higher velocity** → more atmospheric deceleration
4. **More deceleration** → 14.7g peak (vs ~11g planned)

Despite these forces, Ham continued performing his lever tasks throughout the flight. His reaction times were only slightly degraded compared to ground training — approximately 500 ms in flight vs 400 ms baseline. This was remarkable evidence that a primate could perform cognitive tasks under spaceflight conditions.

The g-force profile tells the whole story: a planned ascent, an unplanned intervention, and the body enduring forces that cascade from a single system decision.

---

## Classroom Extensions

1. **G-force comparison:** Research g-forces in everyday life (roller coaster: 3-5g, fighter jet: 9g, car crash: 30-60g) and mark them on the LED bar
2. **Abort analysis:** How much higher would the g-forces be at 300 km altitude? At 350 km?
3. **Human tolerance:** At what g-force level do most people lose consciousness? (Typically 5-7g sustained) Mark this on the bar
4. **Reaction time:** Have students test their reaction time under normal conditions, then while being shaken (simulated vibration) — compare to Ham's performance
