# DIY LED Circuit: Signal Strength vs Distance — Inverse-Square Law Demonstrator

## The Circuit

A standalone electronic circuit that visualizes the inverse-square law using 16 LEDs arranged in a bargraph. A potentiometer represents "distance from the transmitter." As you turn it (increasing distance), the LEDs dim and extinguish following the 1/r² law — showing how rapidly a signal becomes undetectable with distance. An Arduino calculates the received signal strength from Pioneer 5's 5-watt transmitter at the selected distance and drives the LED bargraph accordingly.

**What it does:**
- 16 LEDs arranged in a horizontal bargraph: bright blue (close) → dim blue → yellow → red → off
- A potentiometer (RV1) represents distance from 1,000 km to 36,200,000 km
- As distance increases, LEDs turn off from right to left following 1/r² power law
- The Arduino calculates: P_received = P_tx × G_tx × G_rx × (λ/4πd)²
- A 7-segment display or serial output shows:
  - Current distance (km and AU)
  - Received power (dBm)
  - Signal-to-noise ratio (dB)
  - Data rate achievable at current SNR
- At Pioneer 5's record distance (36.2M km), only 1-2 LEDs remain barely lit
- A "detection threshold" LED (green) indicates whether the signal is recoverable

**The lesson:** Pioneer 5 transmitted with only 5 watts — less than a nightlight. At launch, the signal was easily received. But the inverse-square law is relentless: double the distance, and the received power drops by a factor of four. At 36.2 million kilometers, the signal power at Earth's antenna was approximately 10⁻²⁰ watts — a hundred billion billion times weaker than the transmitted power. The fact that this was detected at all is a testament to antenna gain, receiver sensitivity, and the deep-space network's engineering. This circuit makes the inverse-square law visceral: you watch the signal die as you turn the knob.

**Total cost: ~$12**

---

## Hardware

```
Arduino Nano
     |
     D2  -------> LED 1  (Blue)    -- "FULL SIGNAL"    -- 220R -- GND
     D3  -------> LED 2  (Blue)    -- "STRONG"          -- 220R -- GND
     D4  -------> LED 3  (Blue)    -- "STRONG"          -- 220R -- GND
     D5  -------> LED 4  (Blue)    -- "GOOD"            -- 220R -- GND
     D6  -------> LED 5  (Blue)    -- "GOOD"            -- 220R -- GND
     D7  -------> LED 6  (Cyan)    -- "MODERATE"        -- 220R -- GND
     D8  -------> LED 7  (Cyan)    -- "MODERATE"        -- 220R -- GND
     D9  -------> LED 8  (Yellow)  -- "WEAK"            -- 220R -- GND
     D10 -------> LED 9  (Yellow)  -- "WEAK"            -- 220R -- GND
     D11 -------> LED 10 (Yellow)  -- "VERY WEAK"       -- 220R -- GND
     D12 -------> LED 11 (Orange)  -- "MARGINAL"        -- 220R -- GND
     D13 -------> LED 12 (Orange)  -- "MARGINAL"        -- 220R -- GND
     A4  -------> LED 13 (Red)     -- "THRESHOLD"       -- 220R -- GND
     A5  -------> LED 14 (Red)     -- "THRESHOLD"       -- 220R -- GND
     |
     A2  -------> LED 15 (Red)     -- "LAST PHOTON"     -- 220R -- GND
     A3  -------> LED 16 (Red)     -- "NOISE FLOOR"     -- 220R -- GND
     |
     D1  -------> LED G  (Green)   -- "SIGNAL DETECTED" -- 220R -- GND
     |
     A0  <--- RV1 (10K pot) -- DISTANCE control (logarithmic mapping)
     A1  <--- RV2 (10K pot) -- ANTENNA GAIN control

PHYSICAL LAYOUT (horizontal bargraph):

    DISTANCE: [===================|------] 8.4M km (0.056 AU)

    [B1][B2][B3][B4][B5][C6][C7][Y8][Y9][Y10][O11][O12][R13][R14][R15][R16]
     ██  ██  ██  ██  ██  ██  ▓▓  ░░   ·    ·    ·    ·    ·    ·    ·    ·

    [DISTANCE pot]                               [ANTENNA GAIN pot]
    1000 km ←————————————————————→ 36,200,000 km

    Status: [G] SIGNAL DETECTED    Power: -156 dBm    SNR: 12.3 dB
```

## Arduino Code (Sketch)

```cpp
// Pioneer 5 — Signal Strength vs Distance (Inverse-Square Law)
// Demonstrates the link budget for a 5W deep-space transmitter

#define DISTANCE_PIN  A0
#define GAIN_PIN      A1

// LED bargraph pins (16 LEDs)
const int LED_PINS[] = {2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, A4, A5, A2, A3};
const int NUM_LEDS = 16;

// Detection status LED
#define DETECT_LED 1

// Physical constants
const float C = 3.0e8;              // Speed of light (m/s)
const float FREQ = 378.2e6;         // Pioneer 5 downlink frequency (Hz)
const float LAMBDA = C / FREQ;      // Wavelength (m)
const float P_TX = 5.0;             // Transmitter power (W)
const float P_TX_DBM = 10.0 * log10(P_TX * 1000.0);  // 37 dBm
const float G_TX_DB = 3.0;          // Spacecraft antenna gain (dBi)
const float NOISE_FLOOR_DBM = -174.0 + 10.0 * log10(100.0);  // 100 Hz BW

// Distance range
const float D_MIN = 1.0e6;          // 1,000 km in meters
const float D_MAX = 3.62e10;        // 36,200,000 km in meters
const float AU = 1.496e11;          // 1 AU in meters

void setup() {
  Serial.begin(9600);
  for (int i = 0; i < NUM_LEDS; i++) {
    pinMode(LED_PINS[i], OUTPUT);
  }
  pinMode(DETECT_LED, OUTPUT);
  Serial.println("Pioneer 5 — Inverse-Square Law Link Budget");
  Serial.println("5W transmitter at 378.2 MHz");
  Serial.println("Turn distance pot to watch the signal fade...");
}

void loop() {
  // Read potentiometers
  int dist_raw = analogRead(DISTANCE_PIN);
  int gain_raw = analogRead(GAIN_PIN);

  // Logarithmic distance mapping: 1e3 km to 3.62e7 km
  // log10(1e6) = 6, log10(3.62e10) = 10.56
  float log_d = 6.0 + (dist_raw / 1023.0) * 4.56;
  float distance_m = pow(10.0, log_d);
  float distance_km = distance_m / 1000.0;
  float distance_au = distance_m / AU;

  // Receiver antenna gain: 20-60 dBi (adjustable)
  float G_RX_DB = 20.0 + (gain_raw / 1023.0) * 40.0;

  // Free-space path loss (dB): FSPL = 20log10(4πd/λ)
  float fspl_db = 20.0 * log10(4.0 * PI * distance_m / LAMBDA);

  // Link budget: P_rx = P_tx + G_tx - FSPL + G_rx
  float p_rx_dbm = P_TX_DBM + G_TX_DB - fspl_db + G_RX_DB;

  // Signal-to-noise ratio
  float snr_db = p_rx_dbm - NOISE_FLOOR_DBM;

  // Shannon capacity: C = BW × log2(1 + SNR)
  float snr_linear = pow(10.0, snr_db / 10.0);
  float data_rate = 100.0 * log(1.0 + max(0.0f, snr_linear)) / log(2.0);

  // Map received power to LED bargraph
  // Range: about -100 dBm (all LEDs on) to -200 dBm (all off)
  float led_level = constrain((-100.0 - p_rx_dbm) / 100.0, 0.0, 1.0);
  int leds_on = NUM_LEDS - (int)(led_level * NUM_LEDS);

  for (int i = 0; i < NUM_LEDS; i++) {
    if (i < leds_on) {
      // PWM dimming: closer LEDs are brighter
      int brightness = map(i, 0, leds_on, 255, 30);
      analogWrite(LED_PINS[i], brightness);
    } else {
      digitalWrite(LED_PINS[i], LOW);
    }
  }

  // Detection threshold: SNR > 3 dB
  bool detected = snr_db > 3.0;
  digitalWrite(DETECT_LED, detected ? HIGH : LOW);

  // Serial output
  Serial.print("Distance: ");
  if (distance_km >= 1e6) {
    Serial.print(distance_km / 1e6, 1);
    Serial.print("M km (");
  } else if (distance_km >= 1e3) {
    Serial.print(distance_km / 1e3, 0);
    Serial.print("K km (");
  } else {
    Serial.print(distance_km, 0);
    Serial.print(" km (");
  }
  Serial.print(distance_au, 4);
  Serial.print(" AU)  P_rx: ");
  Serial.print(p_rx_dbm, 1);
  Serial.print(" dBm  SNR: ");
  Serial.print(snr_db, 1);
  Serial.print(" dB  Rate: ");
  Serial.print(data_rate, 1);
  Serial.print(" bps  ");
  Serial.println(detected ? "DETECTED" : "LOST");

  delay(100);
}
```

## Parts List

| Qty | Part                    | Cost     | Notes                                  |
|-----|-------------------------|----------|----------------------------------------|
| 1   | Arduino Nano            | $4.00    | Any Arduino works                      |
| 5   | Blue LED (5mm)          | $0.50    | Strong signal indicators               |
| 2   | Cyan LED (5mm)          | $0.20    | Moderate signal                        |
| 3   | Yellow LED (5mm)        | $0.30    | Weak signal                            |
| 2   | Orange LED (5mm)        | $0.20    | Marginal signal                        |
| 4   | Red LED (5mm)           | $0.40    | Threshold / noise floor                |
| 1   | Green LED (5mm)         | $0.10    | Detection status                       |
| 17  | 220Ω resistor           | $0.50    | LED current limiting                   |
| 2   | 10K potentiometer       | $1.00    | Distance + antenna gain controls       |
| 1   | Breadboard (half-size)  | $2.50    | Mounting                               |
| 1   | Jumper wire kit         | $2.00    | Connections                            |
|     |                         | **$11.70** |                                      |

## The Physics

### Inverse-Square Law

Signal power follows the inverse-square law:

```
P_received = P_transmitted × (λ / 4πd)²

where:
  λ = wavelength (m)
  d = distance (m)

In decibels:
  FSPL (dB) = 20 × log₁₀(4πd/λ)
```

### Pioneer 5's Link Budget

```
Parameter                    Value
────────────────────────────────────
Transmitter power            5 W = +37 dBm
Spacecraft antenna gain      ~3 dBi (omnidirectional)
Frequency                    378.2 MHz
Wavelength                   0.793 m

At 36.2 million km:
  Free-space path loss       -236.2 dB
  Ground antenna gain        +43 dBi (26m dish)
  ─────────────────────────────────
  Received power             ≈ -153 dBm = 5 × 10⁻¹⁹ W

  Noise floor (100 Hz BW)    ≈ -154 dBm
  SNR                        ≈ 1 dB (barely detectable!)
  Data rate achievable       < 10 bps

That's 0.0000000000000000005 watts.
Five hundred attowatts.
The receiver had to pull this signal out of the cosmic noise floor.
```

### The Progressive Radio Connection

```
Radio Series Progress:
  v1.2  — Transmitter (oscillator → antenna)
  v1.3  — Receiver (antenna → detector → audio)
  v1.4  — Mixer (RF + LO → IF)
  v1.5  — IF Amplifier (IF → amplified, filtered IF)
  v1.6  — AM Detector/Demodulator
  v1.7  — Audio Amplifier + Speaker Driver
  v1.8  — Noise Blanker / Impulse Filter
  v1.9  — AGC (Automatic Gain Control)
  v1.10 — S-Meter (signal strength indicator)
  v1.11 — BFO (Beat Frequency Oscillator for CW/SSB)
  v1.12 — Antenna Tuner (L-network impedance matching)
  v1.13 — RF Preamplifier (low-noise front end)  ← COMPANION CIRCUIT

This LED circuit demonstrates WHY the RF preamplifier matters:
when the signal is this weak, every dB of gain at the front end
is the difference between detection and silence.
```

## Why This Matters

The inverse-square law is the fundamental limit of communication across distance. It's not engineering — it's geometry. Energy from a point source spreads over an expanding sphere whose surface area grows as 4πr². The energy per unit area therefore drops as 1/r². Nothing can change this — not more power, not better antennas, not cleverer encoding. All of those help, but they're fighting the same law.

Pioneer 5's 5 watts crossing 36.2 million kilometers was like hearing a whisper from the other side of the planet. The Deep Space Network's 26-meter dish antenna focused its "ear" on a tiny patch of sky, and the cryogenic receivers cooled to near absolute zero to minimize their own thermal noise. Even then, the data rate was reduced to a crawl — just a few bits per second, transmitted and retransmitted and checked and confirmed.

The breadcrumb sponge (Halichondria panicea) faces the same challenge in reverse. It filters seawater to extract nutrients — particles measured in microns, suspended in an ocean. The sponge pumps thousands of liters per day through its body, extracting the signal (food) from the noise (water). The ratio of useful to useless is vanishingly small, just like Pioneer 5's signal-to-noise ratio at 36.2 million kilometers.

Turn the knob. Watch the LEDs die. That's what distance does.
