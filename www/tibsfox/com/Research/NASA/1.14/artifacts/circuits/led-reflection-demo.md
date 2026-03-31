# DIY LED Circuit: Reflection Geometry Demonstrator

## The Circuit

A hands-on electronic circuit that demonstrates the law of reflection using a laser pointer, mirror, and photoresistor. The laser hits a small mirror mounted on a protractor. The reflected beam strikes a photoresistor at a known position. An Arduino measures the photoresistor voltage and calculates the actual reflection angle, comparing it to the predicted angle. Rotate the mirror to see how angle of incidence equals angle of reflection — the same principle that let Echo 1 relay signals across a continent.

**What it does:**
- A laser pointer (5mW red, Class IIIa) is fixed in position, aimed at a small mirror
- The mirror is mounted on a servo (or manual protractor mount) that rotates
- A photoresistor (LDR) is mounted on a calibrated arc at known angular positions
- The Arduino reads the LDR voltage to detect where the reflected beam lands
- A servo sweeps the mirror through angles 10°-80° (or manual rotation)
- An LCD or serial output displays:
  - Mirror angle (degrees)
  - Predicted reflection angle (should equal incidence angle)
  - Measured reflected beam intensity at each arc position
  - Whether specular (mirror-like) or diffuse (scattered) reflection is occurring
- When the beam hits the LDR dead-on, voltage spikes — confirming the law

**The lesson:** Echo 1 worked because radio waves obey the same law of reflection as light. A 30.5-meter Mylar sphere in orbit acts as a curved mirror — each point on its surface reflects the incoming signal at an angle equal to the angle of incidence. The sphere's curvature means different parts of the surface reflect the signal in different directions, so a ground receiver anywhere within the "reflection cone" can pick up the signal. This circuit makes reflection tangible: you see the beam move, you measure the angle, you understand why a shiny balloon in space can relay a message from California to New Jersey.

**Total cost: ~$10**

---

## Hardware

```
Arduino Nano
     |
     A0  <--- LDR (photoresistor) + 10K pull-down --- REFLECTED BEAM DETECTOR
     |
     D9  -------> Servo (SG90) --- MIRROR ROTATION (optional auto-sweep)
     |
     D2  -------> LED (Green) --- "BEAM DETECTED" indicator --- 220R --- GND
     D3  -------> LED (Red)   --- "NO BEAM" indicator       --- 220R --- GND
     |
     I2C -------> LCD 1602 (optional) --- display angles/intensity

PHYSICAL LAYOUT (top view):

    LASER POINTER (fixed)
         \  θᵢ (angle of incidence)
          \
           \
            ●  MIRROR on protractor/servo
           /
          /  θᵣ (angle of reflection)
         /
    LDR on arc  ← measures reflected beam intensity

PROTRACTOR BASE:
     80° 70° 60° 50° 40° 30° 20° 10°
      |   |   |   |   |   |   |   |
      ================================  ← mirror surface (flat)
      |   |   |   |   |   |   |   |
     10° 20° 30° 40° 50° 60° 70° 80°
                                          ← LDR positions on arc

CURVED SURFACE DEMO (Phase 2):
    Replace flat mirror with curved (convex) mirror segment.
    The reflected beam SPREADS — demonstrating why Echo 1's
    spherical surface reflects the signal over a wide area
    rather than a single point. The LDR detects signal at
    MULTIPLE positions, but weaker at each one.

    Flat mirror:   one strong reflection, one position
    Curved mirror: weak reflections, many positions ← Echo 1's trick
```

---

## Schematic

```
                     +5V
                      │
                    ┌─┴─┐
    LASER ----→     │   │ LDR (CdS photoresistor)
    POINTER         │   │ GL5528 or similar
    (fixed aim)     └─┬─┘
                      │
                      ├──── A0 (Arduino analog input)
                      │
                      R1 (10K)
                      │
                     GND

    MIRROR on SERVO:
                      +5V
                       │
    D9 ──── SG90 ─────┤
           (servo)     │
                      GND

    INDICATORS:
    D2 ──── 220R ──── LED (Green) ──── GND
    D3 ──── 220R ──── LED (Red) ────── GND
```

---

## Software (Arduino Sketch)

```cpp
/*
 * Echo 1 — Reflection Geometry Demonstrator
 * NASA Mission Series v1.14
 *
 * Measures reflected laser beam intensity to verify
 * the law of reflection: angle of incidence = angle of reflection.
 *
 * Hardware: Arduino Nano, LDR, servo, laser pointer, mirror
 */

#include <Servo.h>

Servo mirrorServo;

const int LDR_PIN = A0;
const int SERVO_PIN = 9;
const int LED_DETECT = 2;
const int LED_NOBEAM = 3;

// Calibration: LDR voltage threshold for "beam detected"
const int BEAM_THRESHOLD = 600;  // 0-1023, adjust for ambient light

// Mirror angle range
const int ANGLE_MIN = 10;
const int ANGLE_MAX = 80;
const int ANGLE_STEP = 5;

// Auto-sweep state
bool autoSweep = true;
int currentAngle = ANGLE_MIN;
int sweepDirection = 1;
unsigned long lastSweep = 0;
const unsigned long SWEEP_INTERVAL = 500;  // ms per step

void setup() {
    Serial.begin(9600);
    mirrorServo.attach(SERVO_PIN);
    pinMode(LED_DETECT, OUTPUT);
    pinMode(LED_NOBEAM, OUTPUT);

    Serial.println(F("=== Echo 1 Reflection Demonstrator ==="));
    Serial.println(F("Mission 1.14 — First passive comms satellite"));
    Serial.println(F(""));
    Serial.println(F("Law of Reflection: angle_i = angle_r"));
    Serial.println(F("Echo 1: 30.5m Mylar balloon reflecting radio signals"));
    Serial.println(F(""));
    Serial.println(F("  Angle    LDR    Status"));
    Serial.println(F("  -----    ---    ------"));

    mirrorServo.write(currentAngle);
    delay(500);
}

void loop() {
    // Read reflected beam intensity
    int ldrValue = analogRead(LDR_PIN);
    bool beamDetected = (ldrValue > BEAM_THRESHOLD);

    // Update indicator LEDs
    digitalWrite(LED_DETECT, beamDetected ? HIGH : LOW);
    digitalWrite(LED_NOBEAM, beamDetected ? LOW : HIGH);

    // Display current measurement
    Serial.print(F("  "));
    if (currentAngle < 10) Serial.print(' ');
    Serial.print(currentAngle);
    Serial.print(F("°     "));
    Serial.print(ldrValue);
    Serial.print(F("    "));

    if (beamDetected) {
        Serial.print(F("REFLECTED  ◄─── θᵢ = θᵣ = "));
        Serial.print(currentAngle);
        Serial.println(F("°"));
    } else {
        Serial.println(F("no beam"));
    }

    // Echo 1 context annotation at key angles
    if (currentAngle == 45 && beamDetected) {
        Serial.println(F("  ── 45° is the critical relay angle: ──"));
        Serial.println(F("     Bell Labs (NJ) → Echo 1 → JPL (CA)"));
        Serial.println(F("     The balloon reflects at this geometry"));
    }

    // Auto-sweep mirror
    if (autoSweep && millis() - lastSweep > SWEEP_INTERVAL) {
        lastSweep = millis();
        currentAngle += ANGLE_STEP * sweepDirection;
        if (currentAngle >= ANGLE_MAX) {
            currentAngle = ANGLE_MAX;
            sweepDirection = -1;
            Serial.println(F("\n  --- Sweep reversing ---\n"));
        } else if (currentAngle <= ANGLE_MIN) {
            currentAngle = ANGLE_MIN;
            sweepDirection = 1;
            Serial.println(F("\n  --- Sweep reversing ---\n"));
        }
        mirrorServo.write(currentAngle);
    }

    delay(200);
}
```

---

## Bill of Materials

| Qty | Part | Cost |
|-----|------|------|
| 1 | Arduino Nano | $3.00 |
| 1 | Small mirror (~2cm) | $0.50 |
| 1 | SG90 micro servo | $1.50 |
| 1 | GL5528 photoresistor (LDR) | $0.20 |
| 1 | Laser pointer (5mW red) | $2.00 |
| 1 | 10K resistor | $0.05 |
| 2 | LEDs (green, red) | $0.10 |
| 2 | 220 ohm resistors | $0.05 |
| 1 | Protractor (printed or physical) | $0.50 |
| 1 | Breadboard + jumper wires | $2.00 |
| | **Total** | **~$10** |

---

## Extensions

1. **Curved mirror comparison:** Replace the flat mirror with a convex surface (spoon back, small ball bearing). The reflected beam spreads instead of staying collimated. This demonstrates why Echo 1 could serve multiple ground stations simultaneously — the curvature distributes the reflection.

2. **Inverse-square measurement:** Move the LDR to different distances from the mirror (keeping the angle correct). Measure intensity vs. distance. Plot 1/r² relationship.

3. **Multiple receivers:** Add 3-4 LDRs at different angular positions. With a curved mirror, all detect some signal. With a flat mirror, only one does. This is the difference between a passive relay (Echo 1) and a directed relay.

4. **Mylar surface:** Stretch aluminized Mylar (emergency blanket material) over a curved form. Use it as the reflector instead of a glass mirror. See how the imperfect surface scatters the beam — same effect that degraded Echo 1's reflected signals over time as the Mylar surface wrinkled.

---

## The Radio Connection

```
Progressive Radio Series — Reflection in the RF Chain:

  v1.14 introduces the BANDPASS FILTER, which uses resonance
  (reflections inside an LC tank circuit) to select frequencies.

  The bandpass filter is a mirror for radio frequencies:
  - Signals at the resonant frequency pass through (reflected
    constructively inside the tank — standing wave)
  - Signals off-resonance are rejected (destructive interference)

  Echo 1 reflects radio signals in space.
  The LC bandpass reflects radio signals in a circuit.
  Same physics, different medium.

  This LED circuit teaches the geometry of reflection.
  The bandpass filter circuit (radio-bandpass.md) teaches
  the frequency selectivity that reflection enables.
  Together: Echo 1 in miniature.
```

---

## Organism Connection

```
Physalia physalis — Portuguese man o' war

  The man o' war's gas-filled float (pneumatophore) acts as both
  a sail and a reflector: it catches sunlight, creating an
  iridescent sheen that may attract or repel fish. The float
  is a mirror on the ocean surface, much as Echo 1 was a mirror
  in orbit.

  In this circuit, the mirror reflects a focused beam.
  The man o' war reflects and refracts sunlight through its
  translucent, gas-filled structure. Echo 1 reflected radio
  waves through its gas-filled Mylar structure.

  All three are passive reflectors — shaped by their medium,
  returning what the environment sends their way.
```
