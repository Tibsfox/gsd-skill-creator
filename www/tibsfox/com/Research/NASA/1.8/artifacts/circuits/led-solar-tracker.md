# DIY LED Circuit: Solar Angle Display

## The Circuit

A semicircular array of 8 LEDs driven by an Arduino, with a photoresistor (LDR) mounted on a tilting platform that measures the angle of incoming light. As you tilt the platform (or move a light source), the LEDs display the relative solar panel efficiency at that angle, following the cosine law: P(theta) = P_max * cos(theta). The LED at 0 degrees (perpendicular to light) glows brightest. LEDs at increasing angles dim according to cos(theta). At 90 degrees (edge-on), the LEDs are dark. This is the fundamental physics that governed power generation on Vanguard 1's six Bell Labs solar cells as the satellite tumbled through its orbit.

Vanguard 1 had no attitude control. It tumbled freely, and its six solar cells — mounted on the surface of a 16.5 cm sphere — received sunlight at constantly varying angles. The total power output depended on which cells faced the Sun and at what angle. A cell facing the Sun directly produced maximum power (~1 mW). A cell at 60 degrees produced half that. A cell on the shadow side produced nothing. The satellite's total power was the sum of all six cells' contributions, each weighted by cos(theta_i) for their individual angle to the Sun.

**What it does:**
- A photoresistor on a tilting platform measures light intensity
- 8 LEDs arranged in a semicircle show efficiency at 0, 12.9, 25.7, 38.6, 51.4, 64.3, 77.1, and 90 degrees
- Each LED brightness = cos(angle) when the light source is at that angle
- An "ideal" mode shows the theoretical cosine curve for comparison
- The 0-degree LED (direct) is always brightest; the 90-degree LED (edge-on) is always dark

**What it teaches:** The cosine power law for solar panels, how satellite tumbling affects power generation, why attitude control matters for solar-powered spacecraft, and the fundamental relationship between angle of incidence and energy capture. Every solar farm, every rooftop installation, every spacecraft solar array follows this same cos(theta) law.

**Total cost: ~$12**

---

## Schematic

```
Arduino Uno
    |
    +-- A0 <-------- Photoresistor voltage divider
    |                 (10K LDR + 10K fixed resistor)
    |
    +-- A1 <-------- Potentiometer wiper (manual angle override)
    |                 (10K pot, ends to 5V and GND)
    |
    +-- D2 --------- Button ------- GND (mode toggle, internal pullup)
    |
    +-- D3  (PWM) --- R(220) --- LED 0   (0 degrees, direct)
    +-- D5  (PWM) --- R(220) --- LED 1   (12.9 degrees)
    +-- D6  (PWM) --- R(220) --- LED 2   (25.7 degrees)
    +-- D9  (PWM) --- R(220) --- LED 3   (38.6 degrees)
    +-- D10 (PWM) --- R(220) --- LED 4   (51.4 degrees)
    +-- D11 (PWM) --- R(220) --- LED 5   (64.3 degrees)
    +-- D12 --------- R(220) --- LED 6   (77.1 degrees)
    +-- D13 --------- R(220) --- LED 7   (90 degrees, edge-on)
    |
    +-- LED cathodes all to GND

PHOTORESISTOR VOLTAGE DIVIDER:
    5V --- LDR --- A0 --- 10K resistor --- GND
    (bright light = low resistance = high voltage at A0)

PHYSICAL LAYOUT (semicircle, viewed from front):

            LED 0  (0 deg)     ← BRIGHTEST (cos 0 = 1.00)
           /      \
      LED 1        LED 1       ← cos(12.9) = 0.97
     (12.9)       (12.9)
    /                    \
   LED 2              LED 2    ← cos(25.7) = 0.90
  (25.7)              (25.7)
  |                        |
  LED 3                LED 3   ← cos(38.6) = 0.78
  (38.6)              (38.6)
  |                        |
  LED 4                LED 4   ← cos(51.4) = 0.62
  (51.4)              (51.4)
   \                      /
    LED 5            LED 5     ← cos(64.3) = 0.43
   (64.3)          (64.3)
     \                /
      LED 6      LED 6        ← cos(77.1) = 0.22
     (77.1)    (77.1)
       \          /
        LED 7  LED 7          ← cos(90) = 0.00 (DARK)
       (90 deg)

    Note: Only 8 LEDs total in single semicircle.
    Diagram shows symmetry concept — build one side.

    Mount LEDs at actual angles on cardboard semicircle.
    Place photoresistor at the center, on a tilting platform.
```

## Arduino Sketch

```cpp
// Solar Angle Display — Vanguard 1 Power Law
// Mission 1.8 — Vanguard 1, March 17, 1958

const int LDR_PIN = A0;     // Photoresistor input
const int POT_PIN = A1;     // Manual angle override
const int BTN_PIN = 2;      // Mode toggle

// PWM-capable pins for LED brightness control
// D3, D5, D6, D9, D10, D11 are PWM; D12, D13 are digital only
const int LED_PINS[] = {3, 5, 6, 9, 10, 11, 12, 13};
const int NUM_LEDS = 8;

// Angles in degrees for each LED position
const float LED_ANGLES[] = {0.0, 12.86, 25.71, 38.57, 51.43, 64.29, 77.14, 90.0};

// Precomputed cos(angle) values for efficiency display
const float COS_VALUES[] = {1.000, 0.975, 0.901, 0.781, 0.624, 0.434, 0.223, 0.000};

bool ideal_mode = false;  // true = show theoretical cosine curve
bool last_btn = HIGH;

void setup() {
  for (int i = 0; i < NUM_LEDS; i++) {
    pinMode(LED_PINS[i], OUTPUT);
  }
  pinMode(BTN_PIN, INPUT_PULLUP);
  Serial.begin(9600);
}

void loop() {
  // Check mode button
  bool btn = digitalRead(BTN_PIN);
  if (btn == LOW && last_btn == HIGH) {
    ideal_mode = !ideal_mode;
    delay(50);  // debounce
  }
  last_btn = btn;

  // Read light sensor
  int ldr_val = analogRead(LDR_PIN);
  int pot_val = analogRead(POT_PIN);

  // Map LDR reading to estimated angle (0-90 degrees)
  // Higher LDR voltage = brighter light = smaller angle
  float measured_angle = map(ldr_val, 800, 200, 0, 90);
  measured_angle = constrain(measured_angle, 0, 90);

  // Manual override via potentiometer
  float manual_angle = map(pot_val, 0, 1023, 0, 90);

  // Use manual if button has been pressed, otherwise sensor
  float current_angle = ideal_mode ? manual_angle : measured_angle;

  // Calculate and display power for each LED position
  for (int i = 0; i < NUM_LEDS; i++) {
    float efficiency;

    if (ideal_mode) {
      // Theoretical mode: show pure cosine curve
      efficiency = COS_VALUES[i];
    } else {
      // Sensor mode: show measured efficiency at each angle
      // Brightness represents how much power a cell at this angle produces
      float angle_rad = LED_ANGLES[i] * 3.14159 / 180.0;
      efficiency = cos(angle_rad);

      // Dim all LEDs by the overall illumination level
      float overall = cos(current_angle * 3.14159 / 180.0);
      efficiency *= overall;
    }

    // Convert to PWM value (0-255)
    int brightness = (int)(efficiency * 255.0);
    brightness = constrain(brightness, 0, 255);

    // D12 and D13 don't support PWM — use threshold
    if (i >= 6) {
      digitalWrite(LED_PINS[i], brightness > 30 ? HIGH : LOW);
    } else {
      analogWrite(LED_PINS[i], brightness);
    }
  }

  // Serial output for monitoring
  Serial.print("Angle: ");
  Serial.print(current_angle, 1);
  Serial.print(" deg  Mode: ");
  Serial.println(ideal_mode ? "IDEAL" : "SENSOR");

  delay(50);
}
```

## Component List

| Part | Qty | Description | Est. Cost |
|------|-----|-------------|-----------|
| Arduino Uno (or Nano) | 1 | Microcontroller | $5.00 |
| LED (yellow/amber) | 8 | 5mm, diffused, solar gold color | $1.00 |
| 220-ohm resistor | 8 | 1/4W, current limiting for LEDs | $0.80 |
| Photoresistor (LDR) | 1 | 5mm, GL5528 or similar | $0.50 |
| 10K resistor | 1 | 1/4W, voltage divider for LDR | $0.05 |
| 10K potentiometer | 1 | Linear taper, manual angle override | $0.50 |
| Tactile button | 1 | Mode toggle (sensor vs ideal) | $0.20 |
| Breadboard | 1 | Half-size, 400-point | $3.00 |
| Jumper wires | ~20 | For breadboard connections | $1.00 |
| USB cable | 1 | For Arduino power and programming | $0.00 |

**Total: ~$12**

## Build Steps

### Step 1: LED semicircle
- Cut a semicircle from cardboard or stiff paper (about 15 cm radius)
- Mark 8 positions at 0, 12.9, 25.7, 38.6, 51.4, 64.3, 77.1, and 90 degrees
- Insert LEDs at each position (amber/yellow to represent solar gold)
- Label each position with its angle and cos(angle) value

### Step 2: Photoresistor platform
- Mount the LDR at the center of the semicircle
- Attach it to a tilting platform (a popsicle stick on a pivot works well)
- The platform tilts to simulate different sun angles relative to a solar panel

### Step 3: Voltage divider
- Wire the LDR in series with the 10K resistor between 5V and GND
- Connect the junction (between LDR and resistor) to Arduino A0
- When light hits the LDR directly, resistance drops, voltage at A0 rises

### Step 4: LED wiring
- Connect each LED anode through a 220-ohm resistor to its Arduino pin
- Use PWM-capable pins (D3, D5, D6, D9, D10, D11) for the first 6 LEDs
- Connect all cathodes to the GND rail

### Step 5: Controls
- Wire the 10K potentiometer: outer pins to 5V and GND, wiper to A1
- Wire the button between D2 and GND (uses internal pullup)
- The pot provides manual angle control in "ideal" mode

### Step 6: Upload and test
- Upload the sketch via Arduino IDE
- In SENSOR mode: tilt the LDR platform under a desk lamp
  - LEDs dim as the angle increases
  - At 90 degrees (edge-on), all LEDs are nearly dark
- In IDEAL mode: turn the potentiometer
  - LEDs show the pure cos(theta) curve
  - Compare with the sensor reading to see real-world deviations

## Theory: The Cosine Power Law

Solar cell output depends on the angle of incidence theta between the incoming light and the cell's surface normal:

```
P(theta) = P_max * cos(theta)

Where:
  P(theta) = power output at angle theta
  P_max    = maximum power at normal incidence (theta = 0)
  theta    = angle between light ray and surface normal

At theta = 0 (direct):   P = P_max * 1.00 = 100%
At theta = 30:           P = P_max * 0.87 = 87%
At theta = 45:           P = P_max * 0.71 = 71%
At theta = 60:           P = P_max * 0.50 = 50%
At theta = 75:           P = P_max * 0.26 = 26%
At theta = 90 (edge-on): P = P_max * 0.00 = 0%
```

This is Lambert's cosine law applied to energy collection. At angle theta, the same beam of light is spread over a larger area (by a factor of 1/cos(theta)), so the power per unit area decreases proportionally.

### Vanguard 1's Solar Cell Configuration

Vanguard 1 had 6 silicon solar cells on its 16.5 cm diameter spherical surface. The cells were arranged so that at least some would face the Sun at any orientation. Total power: ~1 mW per cell at normal incidence (1958 silicon technology, ~6% efficiency). For comparison, modern multi-junction cells achieve ~47% efficiency.

The total power available at any instant was:

```
P_total = sum(P_max_i * cos(theta_i)) for i = 1 to 6

Where theta_i is the angle between the Sun and cell i's surface normal.

Best case (one cell directly facing Sun):
  P_total ~ 1 mW (one cell) + contributions from adjacent cells

Worst case (Sun between cells):
  P_total ~ 3 cells at ~60 deg each = 3 * 0.5 mW = 1.5 mW

Average: ~1-2 mW total — enough to power the 10 mW transmitter
at reduced duty cycle. The chemical batteries provided 10 mW
continuous. When they died (June 1958), the solar cells kept
the transmitter running on a reduced schedule until May 1964.
```

## Connection to Mission 1.8

Vanguard 1 was launched on March 17, 1958, by the Naval Research Laboratory. It was the fourth artificial satellite (after Sputnik 1, Sputnik 2, and Explorer 1) and the first to use solar power. Its six Bell Labs silicon solar cells were a technology demonstration that proved photovoltaic power was viable for spacecraft — a decision that shaped every space mission since. The International Space Station's solar arrays, the James Webb Space Telescope's sunshield-mounted solar panels, every GPS satellite, every communications satellite — all trace their power heritage to Vanguard 1's six small cells.

The organism for this mission — Polypodium glycyrrhiza (licorice fern) — is itself a solar optimizer. Epiphytic ferns growing on tree branches position their fronds to capture filtered light at various angles. The fern doesn't track the Sun (it can't move), but its frond geometry maximizes light capture from multiple angles, much like Vanguard 1's spherical arrangement of solar cells ensured some cells always faced the Sun regardless of attitude.

The progressive radio series component for v1.8 (volume and tone control) also relates: a potentiometer controls signal level the same way the sun angle controls solar cell output — a variable resistance that scales the signal.
