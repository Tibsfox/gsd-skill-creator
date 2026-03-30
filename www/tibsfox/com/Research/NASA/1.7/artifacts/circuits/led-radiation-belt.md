# DIY LED Circuit: Van Allen Belt Detector Display

## The Circuit

A linear array of 16 LEDs driven by two 74HC595 shift registers, controlled by an Arduino, simulating the radiation intensity profile of the inner Van Allen belt from Earth's surface to 3,000 km altitude. A potentiometer sets the "altitude" — slide it up and the LEDs trace the radiation profile: dim at the surface, increasingly bright as you climb into the belt, peaking at around 1,500 km (~1.24 Earth radii), then dimming again above the belt maximum. The special feature: when the simulated radiation exceeds a threshold, ALL LEDs go dark — replicating the Geiger counter saturation paradox that Explorer 1 discovered on January 31, 1958.

The saturation effect is the key lesson. James Van Allen's Geiger counter returned zero counts when passing through the most intense part of the radiation belt. Zero. Not maximum — zero. The tube's dead time (the recovery period between ionization events, approximately 100 microseconds) was longer than the interval between incoming particles. Every particle arrived while the tube was still "dead" from the previous one. The counter was not broken. It was overwhelmed. The absence of signal indicated maximum signal — the most counterintuitive result in the history of radiation detection.

**What it does:**
- 16 LEDs in a vertical column represent altitudes from 0 to 3,000 km
- Turn the potentiometer to "fly" through the belt
- LEDs brighten as radiation increases with altitude
- At the belt peak, brightness hits maximum — then EVERYTHING goes dark
- The "SATURATED" region demonstrates the dead time paradox
- A button toggles between "true radiation" mode (LEDs show actual intensity) and "Geiger counter" mode (LEDs show what the counter measured — including the zero)

**What it teaches:** Dead time, paralyzable detector models, the relationship between true count rate and measured count rate, and the scientific reasoning that turned a detector failure into a discovery. Van Allen did not have better instruments. He had better thinking.

**Total cost: ~$18**

---

## Schematic

```
Arduino Uno
    │
    ├── A0 ←──────── Potentiometer wiper (altitude control)
    │                 (10K pot, ends to 5V and GND)
    │
    ├── D2 ──── Button ──── GND (mode toggle, internal pullup)
    │
    ├── D11 (SER) ────── Pin 14 (SER) ── 74HC595 #1 (lower 8 LEDs)
    ├── D12 (SRCLK) ──── Pin 11 (SRCLK) ─┬── 74HC595 #1
    ├── D13 (RCLK) ───── Pin 12 (RCLK) ──┤
    │                                      │
    │    74HC595 #1                         │
    │    Pin 9 (QH') ──── Pin 14 (SER) ── 74HC595 #2 (upper 8 LEDs)
    │                     Pin 11 (SRCLK) ──┘   (daisy-chained clock)
    │                     Pin 12 (RCLK) ───┘   (daisy-chained latch)
    │
    │    74HC595 #1 outputs (Q0-Q7):
    │    Q0 ─── R(220Ω) ─── LED 0  (0 km)
    │    Q1 ─── R(220Ω) ─── LED 1  (200 km)
    │    Q2 ─── R(220Ω) ─── LED 2  (400 km)
    │    Q3 ─── R(220Ω) ─── LED 3  (600 km)
    │    Q4 ─── R(220Ω) ─── LED 4  (800 km)
    │    Q5 ─── R(220Ω) ─── LED 5  (1,000 km)
    │    Q6 ─── R(220Ω) ─── LED 6  (1,200 km)
    │    Q7 ─── R(220Ω) ─── LED 7  (1,400 km)
    │
    │    74HC595 #2 outputs (Q0-Q7):
    │    Q0 ─── R(220Ω) ─── LED 8  (1,600 km)
    │    Q1 ─── R(220Ω) ─── LED 9  (1,800 km)
    │    Q2 ─── R(220Ω) ─── LED 10 (2,000 km)
    │    Q3 ─── R(220Ω) ─── LED 11 (2,200 km)
    │    Q4 ─── R(220Ω) ─── LED 12 (2,400 km)
    │    Q5 ─── R(220Ω) ─── LED 13 (2,600 km)
    │    Q6 ─── R(220Ω) ─── LED 14 (2,800 km)
    │    Q7 ─── R(220Ω) ─── LED 15 (3,000 km)
    │
    └── LED anodes to shift register outputs, cathodes to GND

PHYSICAL LAYOUT (vertical, bottom = surface):

    3000 km  ○ LED 15  ─ dim (above belt peak)
    2800 km  ○ LED 14  ─ dim
    2600 km  ○ LED 13  ─ medium
    2400 km  ○ LED 12  ─ bright
    2200 km  ○ LED 11  ─ VERY BRIGHT
    2000 km  ○ LED 10  ─ ██ PEAK / SATURATED ██
    1800 km  ○ LED 9   ─ ██ PEAK / SATURATED ██
    1600 km  ○ LED 8   ─ ██ PEAK / SATURATED ██
    1400 km  ○ LED 7   ─ VERY BRIGHT
    1200 km  ○ LED 6   ─ bright
    1000 km  ○ LED 5   ─ medium
     800 km  ○ LED 4   ─ dim
     600 km  ○ LED 3   ─ very dim
     400 km  ○ LED 2   ─ barely on
     200 km  ○ LED 1   ─ off (below belt)
       0 km  ○ LED 0   ─ off (surface)

    In "Geiger counter" mode, LEDs 8-10 go DARK at peak
    radiation — showing the saturation paradox.
```

## Arduino Sketch

```cpp
// Van Allen Belt Detector Display
// Mission 1.7 — Explorer 1, January 31, 1958

const int SER_PIN   = 11;  // Serial data to shift register
const int SRCLK_PIN = 12;  // Shift register clock
const int RCLK_PIN  = 13;  // Storage register (latch) clock
const int POT_PIN   = A0;  // Altitude potentiometer
const int BTN_PIN   = 2;   // Mode toggle button

bool geiger_mode = true;  // true = Geiger counter mode (with saturation)

// Radiation intensity profile: inner Van Allen belt
// Gaussian centered at ~1,600 km altitude, sigma ~400 km
// Values 0-255 for PWM brightness
byte true_radiation[16] = {
    0,   0,   2,   8,    // 0-600 km: below belt
   20,  50, 100, 170,    // 800-1400 km: ascending into belt
  230, 255, 250, 210,    // 1600-2200 km: belt peak region
  150,  90,  40,  15     // 2400-3000 km: descending from belt
};

// Geiger counter measured rate (with saturation at peak)
// Uses paralyzable dead time model: measured goes to ZERO at peak
byte geiger_measured[16] = {
    0,   0,   2,   8,    // 0-600 km: same as true (low rate)
   20,  50,  95, 140,    // 800-1400 km: tracking but starting to lose
  100,   0,   0,  80,    // 1600-2200 km: SATURATION — zero counts!
  130,  85,  40,  15     // 2400-3000 km: recovering as rate drops
};

void setup() {
  pinMode(SER_PIN, OUTPUT);
  pinMode(SRCLK_PIN, OUTPUT);
  pinMode(RCLK_PIN, OUTPUT);
  pinMode(BTN_PIN, INPUT_PULLUP);
}

void shiftOut16(uint16_t data) {
  digitalWrite(RCLK_PIN, LOW);
  for (int i = 15; i >= 0; i--) {
    digitalWrite(SER_PIN, (data >> i) & 1);
    digitalWrite(SRCLK_PIN, HIGH);
    digitalWrite(SRCLK_PIN, LOW);
  }
  digitalWrite(RCLK_PIN, HIGH);
}

void loop() {
  // Check mode button
  static bool last_btn = HIGH;
  bool btn = digitalRead(BTN_PIN);
  if (btn == LOW && last_btn == HIGH) {
    geiger_mode = !geiger_mode;
    delay(50);  // debounce
  }
  last_btn = btn;

  // Read altitude from potentiometer
  int pot_val = analogRead(POT_PIN);

  // Select radiation profile
  byte* profile = geiger_mode ? geiger_measured : true_radiation;

  // PWM-simulate brightness using rapid on/off cycling
  // For each LED, the brightness byte sets duty cycle
  uint16_t led_bits = 0;
  unsigned long t = micros();
  byte pwm_phase = (t / 100) & 0xFF;  // ~10 kHz PWM

  for (int i = 0; i < 16; i++) {
    // Scale brightness by distance from potentiometer-selected altitude
    int alt_index = map(pot_val, 0, 1023, 0, 15);
    int distance = abs(i - alt_index);

    // Show full belt profile, with "cursor" LED at selected altitude
    byte brightness = profile[i];

    // Highlight the selected altitude LED
    if (i == alt_index) {
      brightness = 255;  // cursor position always full brightness
    }

    if (pwm_phase < brightness) {
      led_bits |= (1 << i);
    }
  }

  shiftOut16(led_bits);
  delayMicroseconds(50);
}
```

## Component List

| Part | Qty | Description | Est. Cost |
|------|-----|-------------|-----------|
| Arduino Uno (or Nano) | 1 | Microcontroller | $5.00 |
| 74HC595 | 2 | 8-bit shift register (serial-in, parallel-out) | $1.00 |
| LED (green) | 16 | 5mm, diffused, standard green | $2.00 |
| 220-ohm resistor | 16 | 1/4W, current limiting for LEDs | $1.60 |
| 10K potentiometer | 1 | Linear taper, altitude control | $1.00 |
| Tactile button | 1 | Mode toggle (true vs Geiger) | $0.20 |
| Breadboard | 1 | Full-size, 830-point | $4.00 |
| Jumper wires | ~30 | For breadboard connections | $2.00 |
| USB cable | 1 | For Arduino power and programming | $1.00 |

**Total: ~$18**

## Build Steps

### Step 1: Shift register chain
- Place both 74HC595 ICs on the breadboard
- Connect power: Pin 16 (VCC) to 5V, Pin 8 (GND) to GND on both
- Connect Pin 10 (SRCLR) to 5V on both (active-low clear — keep high)
- Connect Pin 13 (OE) to GND on both (active-low output enable — keep low)

### Step 2: Daisy-chain the registers
- Connect Arduino D11 to Pin 14 (SER) of shift register #1
- Connect Pin 9 (QH') of register #1 to Pin 14 (SER) of register #2
- Connect Arduino D12 to Pin 11 (SRCLK) of BOTH registers (parallel clock)
- Connect Arduino D13 to Pin 12 (RCLK) of BOTH registers (parallel latch)

### Step 3: LED array
- Place 16 LEDs in a vertical column on the breadboard
- Connect each LED anode (long leg) through a 220-ohm resistor to the corresponding shift register output (Q0-Q7 on each register)
- Connect all LED cathodes (short legs) to the GND rail
- Label the LEDs: bottom = 0 km (surface), top = 3,000 km

### Step 4: Altitude control
- Wire the 10K potentiometer: one outer pin to 5V, other outer to GND, wiper to Arduino A0
- Rotating the pot "flies" through the altitude range

### Step 5: Mode button
- Connect the tactile button between Arduino D2 and GND
- The sketch uses the internal pullup resistor (no external resistor needed)
- Press to toggle between "true radiation" and "Geiger counter" modes

### Step 6: Upload and test
- Upload the sketch via Arduino IDE
- Turn the potentiometer slowly — watch the LEDs trace the radiation belt profile
- In Geiger mode: LEDs in the 1,600-2,000 km range go DARK at peak radiation
- In true mode: all LEDs show the actual radiation intensity (brightest at peak)
- The contrast between modes demonstrates the saturation paradox

## Theory: The Dead Time Paradox

A Geiger-Mueller tube works by avalanche ionization. A single incoming particle ionizes the gas, which triggers a cascade of ion pairs, producing a detectable electrical pulse. After each pulse, the tube needs time to recover — the ions must clear, the electric field must re-establish. This recovery period is the **dead time** (tau), typically 100-200 microseconds.

During dead time, the tube cannot detect new particles. At low count rates, this is not a problem — the interval between particles is much longer than tau. But as the count rate increases:

```
True rate:     N_t particles per second
Dead time:     tau seconds per recovery
Fraction lost: N_t * tau (fraction of time the tube is "dead")

Paralyzable model (Explorer 1's Geiger counter):
  N_measured = N_true × exp(-N_true × tau)

This function peaks at N_true = 1/tau, then DECREASES toward zero.
At high true rates, the measured rate approaches zero.

Example with tau = 100 us:
  Peak measured rate at N_true = 1/0.0001 = 10,000 counts/sec
  At N_true = 100,000: N_m = 100,000 × exp(-10) = 4.5 counts/sec
  At N_true = 1,000,000: N_m ≈ 0 counts/sec (SATURATED)
```

Van Allen's breakthrough was recognizing that the zero readings in the telemetry were not instrument failure but instrument saturation. He proposed adding lead shielding around the Geiger counter on Explorer 3 to reduce the incoming flux — and the counter immediately registered the enormous radiation levels that had been invisible on Explorer 1. The belt was not silent. It was screaming so loudly that the detector went deaf.

## Connection to Mission 1.7

Explorer 1 was the first US satellite, launched January 31, 1958, on a Juno I rocket. It weighed 13.97 kg and orbited at 358 × 2,550 km with 33.24 degrees inclination. Its primary instrument was a Type 314 Geiger-Mueller tube designed by James Van Allen at the University of Iowa. The satellite was built by the Jet Propulsion Laboratory, the rocket by the Army Ballistic Missile Agency under Wernher von Braun. Three organizations, three cities (Pasadena, Huntsville, Iowa City), one mission.

The organism for this mission — Lobaria pulmonaria (lungwort lichen) — shares the saturation paradox in reverse. Lobaria is an indicator species for air quality: it thrives in clean air and disappears when pollution increases. Its *absence* from a forest indicates the *presence* of pollution, just as the Geiger counter's *zero* reading indicated the *presence* of maximum radiation. Both are cases where the lack of a signal carries the most information.
