# DIY LED Circuit: Orbital Display — Mercury-Atlas 5 Flight Profile

## The Circuit

An Arduino-based LED ring display that represents MA-5's orbital path. 12 LEDs arranged in a circle show the spacecraft's position as it orbits Earth. Two full lighting cycles represent the two completed orbits, then retrofire (all blink rapidly) and reentry (LEDs go out one by one). A 13th LED in the center indicates thruster activity — it flickers increasingly as fuel depletes.

**What it does:**
- 12 LEDs in a circle: blue for orbital position, sweeping around like a clock
- Two complete clockwise cycles (2 orbits), ~10 seconds per orbit
- Orbit 1: smooth sweep, occasional center LED flicker (normal thrusters)
- Orbit 2: faster center LED flickering (thruster malfunction, fuel wasting)
- After orbit 2: all blue LEDs blink 3 times (retrofire)
- Reentry: LEDs go out counterclockwise, one by one (deorbit)
- Center LED turns red during reentry heating
- Push button to toggle between planned (3 orbit) and actual (2 orbit) profiles

**What it teaches:** Enos's flight was planned for 3 orbits but ground controllers decided to bring the capsule down after 2. The attitude control system was firing too frequently — a stuck thruster valve was consuming hydrogen peroxide fuel at an unsustainable rate. If they waited for a third orbit, there might not be enough fuel for proper reentry orientation. The increasing center LED flicker makes this visible: you can see the thruster activity accelerating, and understand why the decision was made.

**Total cost: ~$15**

---

## Schematic

```
Arduino Nano/Uno Pin Assignments:

  Orbital LEDs (12 positions, clock layout):
  Using 2x 74HC595 shift registers for 12 orbital + 1 center

  First 74HC595 (Orbital LEDs 1-8):
    Q0 → R1  (220Ω) → Blue LED 1   (12 o'clock — orbital start)
    Q1 → R2  (220Ω) → Blue LED 2   (1 o'clock)
    Q2 → R3  (220Ω) → Blue LED 3   (2 o'clock)
    Q3 → R4  (220Ω) → Blue LED 4   (3 o'clock)
    Q4 → R5  (220Ω) → Blue LED 5   (4 o'clock)
    Q5 → R6  (220Ω) → Blue LED 6   (5 o'clock)
    Q6 → R7  (220Ω) → Blue LED 7   (6 o'clock)
    Q7 → R8  (220Ω) → Blue LED 8   (7 o'clock)

  Second 74HC595 (Orbital LEDs 9-12 + center):
    Q0 → R9  (220Ω) → Blue LED 9   (8 o'clock)
    Q1 → R10 (220Ω) → Blue LED 10  (9 o'clock)
    Q2 → R11 (220Ω) → Blue LED 11  (10 o'clock)
    Q3 → R12 (220Ω) → Blue LED 12  (11 o'clock)
    Q4 → R13 (220Ω) → Green LED (thruster normal)
    Q5 → R14 (220Ω) → Red LED   (thruster alarm / reentry)
    Q6 → (unused)
    Q7 → (unused)

  Arduino Pins:
    D11 → 595 Data (SER)
    D12 → 595 Clock (SRCLK)
    D13 → 595 Latch (RCLK)
    D2  ← Push Button (10K pull-down to GND, button to 5V)

  Power:
    5V  → 595 VCC, button rail
    GND → 595 GND, LED cathodes, pull-down

Layout (circular, viewed from front):

               LED 1 (12 o'clock)
          LED 12               LED 2
       LED 11                     LED 3
       LED 10    [GRN] [RED]      LED 4
          LED 9    (center)    LED 5
               LED 8
           LED 7      LED 6

  Shift Register Chain:
    Arduino D11 (Data)  → 595 #1 SER
    Arduino D12 (Clock) → 595 #1 SRCLK + 595 #2 SRCLK
    Arduino D13 (Latch) → 595 #1 RCLK  + 595 #2 RCLK
    595 #1 QH' → 595 #2 SER  (daisy chain)
```

## Arduino Sketch

```cpp
/*
 * Orbital Display — MA-5 Enos Flight Profile
 * NASA Mission Series v1.18
 *
 * 12 LEDs in a circle show spacecraft position.
 * Two orbits, then retrofire and reentry.
 * Center LED shows thruster health.
 */

const int DATA_PIN  = 11;
const int CLOCK_PIN = 12;
const int LATCH_PIN = 13;
const int BTN_MODE  = 2;

// LED bit positions in 16-bit shift register output
// Bits 0-11: orbital LEDs (clock positions)
// Bit 12: center green (thruster normal)
// Bit 13: center red (thruster alarm / reentry)

bool threeOrbits = false;  // Toggle with button
unsigned long cycleStart = 0;

// Orbit timing
const unsigned long ORBIT_MS     = 10000;  // 10 seconds per orbit
const unsigned long RETROFIRE_MS = 2000;
const unsigned long REENTRY_MS   = 4000;

void setup() {
  pinMode(DATA_PIN, OUTPUT);
  pinMode(CLOCK_PIN, OUTPUT);
  pinMode(LATCH_PIN, OUTPUT);
  pinMode(BTN_MODE, INPUT);

  Serial.begin(9600);
  Serial.println("=== MA-5 ORBITAL DISPLAY ===");
  Serial.println("Enos — 2 orbits, Nov 29, 1961");
  Serial.println("Press button: toggle 2/3 orbit mode");

  cycleStart = millis();
}

void shiftOut16(unsigned int value) {
  digitalWrite(LATCH_PIN, LOW);
  shiftOut(DATA_PIN, CLOCK_PIN, MSBFIRST, (value >> 8) & 0xFF);
  shiftOut(DATA_PIN, CLOCK_PIN, MSBFIRST, value & 0xFF);
  digitalWrite(LATCH_PIN, HIGH);
}

void loop() {
  // Check mode button
  if (digitalRead(BTN_MODE) == HIGH) {
    delay(200);
    threeOrbits = !threeOrbits;
    cycleStart = millis();
    Serial.print("Mode: ");
    Serial.println(threeOrbits ? "3 orbits (planned)" : "2 orbits (actual)");
  }

  int numOrbits = threeOrbits ? 3 : 2;
  unsigned long totalOrbit = ORBIT_MS * numOrbits;
  unsigned long totalCycle = totalOrbit + RETROFIRE_MS + REENTRY_MS;

  unsigned long elapsed = (millis() - cycleStart) % totalCycle;
  unsigned int leds = 0;

  if (elapsed < totalOrbit) {
    // --- ORBITAL PHASE ---
    int currentOrbit = elapsed / ORBIT_MS;
    unsigned long orbitElapsed = elapsed % ORBIT_MS;
    float orbitFrac = (float)orbitElapsed / ORBIT_MS;

    // Position LED (which of 12 is lit)
    int pos = (int)(orbitFrac * 12) % 12;
    leds = (1 << pos);

    // Trail: previous LED dimmed (we can't dim, so just leave it on briefly)
    int prevPos = (pos + 11) % 12;
    if (orbitFrac * 12 - (int)(orbitFrac * 12) < 0.3) {
      leds |= (1 << prevPos);
    }

    // Thruster activity (center LED)
    bool thrusterFiring;
    if (currentOrbit == 0) {
      // First orbit: occasional normal thruster (green)
      thrusterFiring = (orbitElapsed % 2000) < 100;
      if (thrusterFiring) leds |= (1 << 12);  // Green
    } else {
      // Second orbit: increasingly frequent (transition to red)
      int interval = 800 - (orbitElapsed / 20);  // Gets faster
      if (interval < 100) interval = 100;
      thrusterFiring = ((orbitElapsed % interval) < 80);
      if (thrusterFiring) {
        if (orbitElapsed > ORBIT_MS / 2)
          leds |= (1 << 13);  // Red — alarm
        else
          leds |= (1 << 12);  // Green — still OK
      }
    }

    // Serial status
    static unsigned long lastPrint = 0;
    if (millis() - lastPrint > 1000) {
      lastPrint = millis();
      Serial.print("Orbit ");
      Serial.print(currentOrbit + 1);
      Serial.print("/");
      Serial.print(numOrbits);
      Serial.print(" Pos=");
      Serial.print(pos + 1);
      Serial.print("/12");
      if (currentOrbit > 0 && orbitElapsed > ORBIT_MS / 2)
        Serial.print(" *** THRUSTER ALARM ***");
      Serial.println();
    }
  }
  else if (elapsed < totalOrbit + RETROFIRE_MS) {
    // --- RETROFIRE ---
    // All LEDs blink rapidly
    unsigned long retroElapsed = elapsed - totalOrbit;
    bool blinkOn = (retroElapsed % 300) < 150;
    if (blinkOn) {
      leds = 0x0FFF;  // All 12 orbital LEDs
      leds |= (1 << 13);  // Red center
    }

    static bool retroPrinted = false;
    if (!retroPrinted || (elapsed - totalOrbit) < 100) {
      Serial.println(">>> RETROFIRE <<<");
      retroPrinted = true;
    }
  }
  else {
    // --- REENTRY ---
    // LEDs go out one by one (counterclockwise)
    unsigned long reentryElapsed = elapsed - totalOrbit - RETROFIRE_MS;
    float reentryFrac = (float)reentryElapsed / REENTRY_MS;
    int ledsOff = (int)(reentryFrac * 12);

    leds = 0x0FFF;  // Start with all on
    for (int i = 0; i < ledsOff; i++) {
      leds &= ~(1 << (11 - i));  // Turn off from 11 o'clock backward
    }

    // Red center during reentry heating
    if (reentryFrac < 0.7) {
      bool heatPulse = ((reentryElapsed % 200) < 100);
      if (heatPulse) leds |= (1 << 13);
    }
  }

  shiftOut16(leds);
  delay(40);  // 25 Hz update
}
```

## Parts List

| Qty | Part | Cost |
|-----|------|------|
| 1 | Arduino Nano (clone) | $3.50 |
| 2 | 74HC595 shift registers | $1.00 |
| 12 | Blue 3mm LEDs (orbital ring) | $1.20 |
| 1 | Green 3mm LED (thruster normal) | $0.10 |
| 1 | Red 3mm LED (thruster alarm) | $0.10 |
| 14 | 220Ω resistors (LED current limit) | $0.70 |
| 1 | 10KΩ resistor (pull-down) | $0.05 |
| 1 | Momentary push button (mode toggle) | $0.25 |
| 1 | Half-size breadboard | $2.50 |
| 1 | Jumper wire kit | $2.00 |
| 1 | USB cable (Arduino power + serial) | $1.00 |
| **Total** | | **~$15** |

## The MA-5 Decision

On November 29, 1961, flight controllers at Mercury Control watched Enos orbit Earth. Everything looked good through the first orbit — attitude control thrusters firing normally, life support stable, Enos performing his lever tasks correctly despite the shock malfunction.

But during the second orbit, telemetry showed a problem. One of the attitude control thrusters was firing in long pulses instead of short bursts. Hydrogen peroxide fuel was being consumed far faster than planned. The flight plan called for 3 orbits, but the fuel consumption rate threatened to leave insufficient propellant for proper retrofire orientation.

The decision: bring him home after 2 orbits, or risk running out of attitude control fuel during orbit 3 and potentially lose the ability to orient the heat shield correctly for reentry.

They chose 2 orbits. Enos came home safely. The decision was vindicated when post-flight analysis showed the thruster valve was indeed stuck in a partially open position. A third orbit would have depleted the remaining fuel.

The LED ring display makes this decision visible: watch the center LED change from calm green flickers to frantic red as the thruster problem develops. You can see why they cut the mission short.

---

## Classroom Extensions

1. **Fuel budgeting:** If total thruster fuel is 100 units, and orbit 1 used 25 (normal), orbit 2 used 45 (malfunction), how much remains? Is 30 units enough for retrofire orientation? (Retrofire needs at least 15 units)
2. **Orbital period:** MA-5's orbital period was ~88.5 minutes. How many times does the ISS orbit in one school day? (Approximately 6 orbits in 8 hours)
3. **Decision-making under uncertainty:** Discuss: what information would you want before deciding to do a third orbit? What are the consequences of being wrong either way?
4. **Compare orbits:** How does MA-5's orbit (161×237 km) compare to the ISS (408 km average)? Why was Mercury's orbit so much lower?
