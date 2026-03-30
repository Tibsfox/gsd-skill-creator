# DIY LED Circuit: Earth Energy Balance — Radiation Budget Trainer

## The Circuit

A standalone electronic circuit that visualizes Earth's energy balance using two banks of LEDs: yellow/white LEDs represent incoming solar radiation, and red LEDs represent outgoing thermal (infrared) radiation. A potentiometer controls "albedo" — the fraction of incoming sunlight reflected back to space — shifting the balance between energy in and energy out. An Arduino reads a photoresistor (sensing the "incoming" LEDs) and a thermistor (sensing ambient temperature as an analog for "outgoing" thermal) and displays the imbalance on a bargraph or serial output.

**What it does:**
- Two LED banks face a central sensor area:
  - LEFT bank: 5 yellow/white LEDs = incoming solar radiation (S₀ = 1361 W/m²)
  - RIGHT bank: 5 red LEDs = outgoing thermal radiation (σT⁴)
- A potentiometer (RV1) controls albedo (0.0 = black body, 1.0 = perfect mirror):
  - Turn clockwise → albedo increases → fewer yellow LEDs lit → less absorbed energy
  - Turn counter-clockwise → albedo decreases → more yellow LEDs lit → more absorbed
- A second potentiometer (RV2) controls "greenhouse strength":
  - Turn clockwise → greenhouse increases → fewer red LEDs can turn on → trapped heat
  - This demonstrates how greenhouse gases reduce outgoing radiation
- The Arduino calculates equilibrium temperature: T = ((S₀(1-α)/4) / (ε×σ))^0.25
- A 7-segment display or serial output shows the equilibrium temperature in Kelvin
- When balanced: green status LED steady. When imbalanced: status LED blinks proportionally

**The lesson:** Explorer 7 carried the first satellite instruments (Suomi-Parent bolometers) designed to measure Earth's radiation budget from space. Verner Suomi's insight was that two sensors — one black (absorbing all radiation), one white (absorbing only thermal) — could separate incoming from outgoing energy. This circuit recreates that concept: the photoresistor is the black bolometer (seeing total radiation), the thermistor is the white bolometer (responding only to thermal). The difference between what Earth receives and what it emits determines whether the planet warms or cools. Explorer 7 made the first measurement of this balance from orbit in 1959.

**Total cost: ~$15**

---

## Hardware

```
Arduino Nano
     |
     D2 ---------> LED Y1 (Yellow) -- "SOLAR 1"    -- 220R -- GND
     D3 ---------> LED Y2 (Yellow) -- "SOLAR 2"    -- 220R -- GND
     D4 ---------> LED Y3 (Yellow) -- "SOLAR 3"    -- 220R -- GND
     D5 ---------> LED Y4 (Yellow) -- "SOLAR 4"    -- 220R -- GND
     D6 ---------> LED Y5 (White)  -- "SOLAR 5"    -- 220R -- GND
     |
     D7 ---------> LED R1 (Red)    -- "THERMAL 1"  -- 220R -- GND
     D8 ---------> LED R2 (Red)    -- "THERMAL 2"  -- 220R -- GND
     D9 ---------> LED R3 (Red)    -- "THERMAL 3"  -- 220R -- GND
     D10 --------> LED R4 (Red)    -- "THERMAL 4"  -- 220R -- GND
     D11 --------> LED R5 (Red)    -- "THERMAL 5"  -- 220R -- GND
     |
     D12 --------> LED G (Green)   -- "BALANCE OK"  -- 220R -- GND
     D13 --------> LED B (Blue)    -- "IMBALANCED"  -- 220R -- GND
     |
     A0 <--- RV1 (10K pot) -- ALBEDO control (voltage divider)
     A1 <--- RV2 (10K pot) -- GREENHOUSE control (voltage divider)
     A2 <--- Photoresistor + 10K pulldown (ambient light / "solar" sensor)
     A3 <--- Thermistor (10K NTC) + 10K pulldown ("thermal" sensor)

PHYSICAL LAYOUT (horizontal, representing energy flow):

    INCOMING (LEFT)          SENSOR          OUTGOING (RIGHT)
    ===============        ========         ================
    [Y1] [Y2] [Y3]          [PHR]          [R1] [R2] [R3]
    [Y4] [Y5]              [THRM]          [R4] [R5]

    [ALBEDO pot]                           [GREENHOUSE pot]

    Status: [G] balanced    [B] imbalanced

    RV1 ←→ controls how many yellow LEDs are active
    RV2 ←→ controls how many red LEDs can respond
```

## Arduino Code (Sketch)

```cpp
// Earth Energy Balance — Explorer 7 Radiation Budget Trainer
// Demonstrates radiation balance, albedo, and greenhouse effect

#define ALBEDO_PIN    A0
#define GREENHOUSE_PIN A1
#define PHOTO_PIN     A2
#define THERM_PIN     A3

// Solar (incoming) LED pins
const int SOLAR_PINS[] = {2, 3, 4, 5, 6};
const int NUM_SOLAR = 5;

// Thermal (outgoing) LED pins
const int THERMAL_PINS[] = {7, 8, 9, 10, 11};
const int NUM_THERMAL = 5;

#define BALANCE_LED   12
#define IMBALANCE_LED 13

// Physical constants
const float S0 = 1361.0;       // Solar constant (W/m^2)
const float SIGMA = 5.67e-8;   // Stefan-Boltzmann constant
const float EARTH_RADIUS = 6.371e6;  // meters

unsigned long lastUpdate = 0;
const int UPDATE_INTERVAL = 200;  // ms

void setup() {
  Serial.begin(9600);

  for (int i = 0; i < NUM_SOLAR; i++) pinMode(SOLAR_PINS[i], OUTPUT);
  for (int i = 0; i < NUM_THERMAL; i++) pinMode(THERMAL_PINS[i], OUTPUT);
  pinMode(BALANCE_LED, OUTPUT);
  pinMode(IMBALANCE_LED, OUTPUT);

  Serial.println("=== EARTH ENERGY BALANCE ===");
  Serial.println("Explorer 7 Radiation Budget Trainer");
  Serial.println("Albedo pot: incoming solar absorption");
  Serial.println("Greenhouse pot: outgoing thermal trapping");
  Serial.println();
}

float calculateEquilibriumTemp(float albedo, float emissivity) {
  // T_eq = ((S0 * (1 - albedo)) / (4 * emissivity * sigma))^0.25
  float absorbed = S0 * (1.0 - albedo) / 4.0;
  float T4 = absorbed / (emissivity * SIGMA);
  return pow(T4, 0.25);
}

void loop() {
  if (millis() - lastUpdate < UPDATE_INTERVAL) return;
  lastUpdate = millis();

  // Read controls (0-1023 → 0.0-1.0)
  float albedo = analogRead(ALBEDO_PIN) / 1023.0;
  albedo = constrain(albedo, 0.05, 0.95);  // physical limits

  float greenhouse_raw = analogRead(GREENHOUSE_PIN) / 1023.0;
  // Greenhouse reduces effective emissivity (traps outgoing radiation)
  // Emissivity: 1.0 (no greenhouse) → ~0.6 (strong greenhouse)
  float emissivity = 1.0 - greenhouse_raw * 0.4;

  // Calculate equilibrium temperature
  float T_eq = calculateEquilibriumTemp(albedo, emissivity);
  float T_celsius = T_eq - 273.15;

  // Energy flows
  float incoming = S0 * (1.0 - albedo) / 4.0;  // W/m^2 absorbed
  float outgoing = emissivity * SIGMA * pow(T_eq, 4);  // W/m^2 emitted
  float imbalance = incoming - outgoing;  // W/m^2 net

  // Map to LED counts
  int solar_count = (int)(NUM_SOLAR * (1.0 - albedo) + 0.5);
  solar_count = constrain(solar_count, 0, NUM_SOLAR);

  int thermal_count = (int)(NUM_THERMAL * emissivity + 0.5);
  thermal_count = constrain(thermal_count, 0, NUM_THERMAL);

  // Light solar LEDs (left bank)
  for (int i = 0; i < NUM_SOLAR; i++) {
    digitalWrite(SOLAR_PINS[i], i < solar_count ? HIGH : LOW);
  }

  // Light thermal LEDs (right bank)
  for (int i = 0; i < NUM_THERMAL; i++) {
    digitalWrite(THERMAL_PINS[i], i < thermal_count ? HIGH : LOW);
  }

  // Balance indicator
  bool balanced = abs(imbalance) < 5.0;  // within 5 W/m^2
  if (balanced) {
    digitalWrite(BALANCE_LED, HIGH);
    digitalWrite(IMBALANCE_LED, LOW);
  } else {
    digitalWrite(BALANCE_LED, LOW);
    // Blink rate proportional to imbalance
    int blink_period = max(100, 1000 - (int)(abs(imbalance) * 20));
    digitalWrite(IMBALANCE_LED,
      (millis() % blink_period) < (blink_period / 2) ? HIGH : LOW);
  }

  // Serial output
  Serial.print("Albedo: ");
  Serial.print(albedo, 2);
  Serial.print("  Emissivity: ");
  Serial.print(emissivity, 2);
  Serial.print("  T_eq: ");
  Serial.print(T_eq, 1);
  Serial.print(" K (");
  Serial.print(T_celsius, 1);
  Serial.print(" C)");
  Serial.print("  In: ");
  Serial.print(incoming, 1);
  Serial.print("  Out: ");
  Serial.print(outgoing, 1);
  Serial.print(" W/m2");
  Serial.print("  Imbalance: ");
  Serial.print(imbalance, 1);
  Serial.println(balanced ? "  [BALANCED]" : "  [WARMING]");
}
```

## Bill of Materials

| Qty | Component | Value/Type | Purpose | Cost |
|-----|-----------|------------|---------|------|
| 1 | Arduino Nano | ATmega328P | Controller | $4.00 |
| 4 | LED, yellow | 3mm, diffused | Solar radiation (incoming) | $0.20 |
| 1 | LED, white | 3mm, diffused | Solar radiation (peak) | $0.10 |
| 5 | LED, red | 3mm, diffused | Thermal radiation (outgoing) | $0.25 |
| 1 | LED, green | 3mm, diffused | Balance indicator | $0.05 |
| 1 | LED, blue | 3mm, diffused | Imbalance indicator | $0.10 |
| 12 | Resistor | 220R, 1/4W | LED current limit | $0.24 |
| 2 | Potentiometer | 10K, panel mount | Albedo + greenhouse control | $1.60 |
| 1 | Photoresistor | CdS, 10K nominal | Light sensor ("solar input") | $0.30 |
| 1 | Thermistor | 10K NTC | Temperature sensor ("thermal") | $0.40 |
| 2 | Resistor | 10K, 1/4W | Pull-down for sensors | $0.04 |
| 1 | Breadboard | Half-size | Assembly | $3.00 |
| 1 | Wire kit | 22 AWG solid | Connections | $2.00 |
| | | | **Total** | **~$12.28** |

## Build Notes

1. **Start with solar only.** Wire the 5 yellow/white LEDs and the albedo pot. Upload the sketch. Turn the pot — LEDs should light from 5 (low albedo, high absorption) down to 0 (high albedo, everything reflected). Watch the serial monitor: equilibrium temperature should range from ~280K (Earth-like) down to ~200K (snowball Earth).

2. **Add thermal LEDs.** Wire the 5 red LEDs and the greenhouse pot. Now you have two banks responding to two controls. When both pots are centered, you should see 3-4 yellow and 4-5 red LEDs — approximately balanced. The serial monitor shows the energy flows.

3. **Watch the balance.** With albedo=0.30 (Earth-like) and emissivity=1.0 (no greenhouse), T_eq ≈ 255K (−18°C). This is Earth WITHOUT greenhouse gases — too cold for liquid water. Now increase greenhouse strength: emissivity drops to ~0.6, T_eq rises to ~288K (15°C). This is actual Earth. The greenhouse effect raises the temperature by ~33°C. The circuit makes this visible: same solar input, but fewer thermal LEDs can escape.

4. **Explore extremes.** Venus: albedo=0.77, extreme greenhouse (emissivity~0.01). Mars: albedo=0.25, thin greenhouse (emissivity~0.95). The serial monitor calculates equilibrium temperatures for any combination.

5. **Add the sensors.** The photoresistor and thermistor add a real-world measurement layer. Point the photoresistor at the solar LEDs — it reads the actual light output. The thermistor responds to ambient temperature. In a darkened room, turning on more yellow LEDs literally warms the thermistor slightly. This is the bolometer principle: measure radiation by measuring temperature change.

## The Physics

Earth's energy balance is the most fundamental quantity in climate science. The sun delivers approximately 1361 W/m² to Earth's cross-section (the solar constant, S₀). Of this, about 30% is reflected back to space by clouds, ice, and surface albedo (α ≈ 0.30). The remaining 70% is absorbed by the atmosphere and surface.

To maintain thermal equilibrium, Earth must radiate the same amount of energy back to space as thermal infrared radiation. The Stefan-Boltzmann law gives the radiated power: P = εσT⁴, where ε is emissivity, σ is the Stefan-Boltzmann constant, and T is temperature. Setting absorbed equal to emitted:

```
  S₀(1 - α)/4 = εσT⁴

  T_eq = ((S₀(1 - α))/(4εσ))^0.25
```

The factor of 4 accounts for the ratio of Earth's cross-sectional area (πR²) to its surface area (4πR²). With α=0.30 and ε=1.0: T_eq = 255 K = −18°C. This is the radiative equilibrium temperature WITHOUT greenhouse gases.

The actual surface temperature is ~288 K = 15°C. The 33°C difference is the greenhouse effect: certain atmospheric gases (H₂O, CO₂, CH₄, N₂O) absorb outgoing infrared radiation and re-emit it in all directions, including back toward the surface. This effectively reduces the emissivity of the planet as seen from space, requiring a higher surface temperature to radiate the same total energy.

Verner Suomi's bolometers on Explorer 7 made the first satellite measurement of this balance. The black hemisphere absorbed all incoming radiation (solar + reflected + thermal). The white hemisphere reflected visible light but absorbed thermal infrared. The difference between the two readings separated the solar component from the thermal component — exactly what this circuit does with its two LED banks and two sensors.

## The Connection

Usnea longissima — Methuselah's beard lichen — hangs in curtains from old-growth conifers in the Pacific Northwest. This pendant lichen is exquisitely sensitive to environmental change. It absorbs moisture and nutrients directly from the air, making it a biological sensor for air quality, humidity, and temperature. When conditions change — when the air warms, when pollution increases, when the forest canopy thins — Usnea longissima is among the first organisms to decline. It is Earth's own bolometer: a living sensor that measures the radiation balance through its growth rate, its color, its presence or absence.

Rudolf Virchow established the principle that disease in the whole organism can be diagnosed by examining individual cells — that the part reveals the condition of the whole. Suomi's bolometers were Virchow's cellular pathology applied to the planet: two small sensors, 41.5 kilograms of spacecraft, diagnosing Earth's fever from orbit. The photoresistor and thermistor in this circuit are the same idea at tabletop scale: small sensors measuring the energy flows that determine whether the planet warms or cools.

The balance is measured in watts per square meter. The imbalance that drives current climate change is approximately 0.87 W/m² — less than one watt over every square meter of Earth's surface. A quantity so small that it took Suomi's bolometers, and decades of successors (ERBE, CERES, SORCE), to measure it reliably. This circuit cannot measure 0.87 W/m². But it can show you what balance means, what happens when it shifts, and why the measurement matters.
