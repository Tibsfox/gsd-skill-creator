# DIY LED Circuit: Launch Vehicle Status Board — Failure Probability Trainer

## The Circuit

A standalone electronic circuit modeling a launch vehicle's five critical stages: ignition, burnout, separation, spin-up, and orbit insertion. Five LEDs sequence through the stages when a LAUNCH button is pressed. Each stage lights green for success — except the separation stage, which randomly fails 20% of the time, lighting red instead. When separation fails, all subsequent stages also fail (red). The circuit teaches failure propagation: a single-point failure in one stage cascades to all downstream stages.

**What it does:**
- Press LAUNCH: the sequence begins with a 1-second delay between stages
- LED 1 (Ignition): always green — the Rocketdyne A-7 ignites successfully
- LED 2 (Burnout): always green — first stage burns to completion
- LED 3 (Separation): GREEN 80% of the time, RED 20% of the time
  - The Arduino reads an analog noise pin for randomness
  - Red = the spinning tub contacted the booster (Explorer 5's failure)
- LED 4 (Spin-Up): green if separation succeeded, red if it failed
- LED 5 (Orbit): green if everything succeeded, red if separation failed
- After the sequence completes, LEDs hold for 3 seconds showing the result
- Press LAUNCH again for another attempt
- A 7-segment display (or serial output) counts total launches, failures, and running failure rate

**The lesson:** Explorer 5 failed because of a mechanical clearance problem during stage separation. The spinning upper cluster contacted the booster body, inducing nutation (tumble) that prevented orbit insertion. This was a single-point failure — everything before and after separation worked correctly, but one contact event cascaded into total mission loss. The circuit demonstrates that reliability is only as strong as the weakest link, and that seemingly unlikely events (20% chance) happen with startling regularity over many trials.

**Total cost: ~$10**

---

## Hardware

```
Arduino Nano
     |
     D2 ---------> LED 1 (Green) -- "IGNITION"    -- 220R -- GND
     D3 ---------> LED 2 (Green) -- "BURNOUT"     -- 220R -- GND
     D4 ---------> LED 3 (Green) -- "SEPARATION"  -- 220R -- GND
     D5 ---------> LED 3 (Red)   -- "SEP FAIL"    -- 220R -- GND
     D6 ---------> LED 4 (Green) -- "SPIN-UP"     -- 220R -- GND
     D7 ---------> LED 4 (Red)   -- "SPIN FAIL"   -- 220R -- GND
     D8 ---------> LED 5 (Green) -- "ORBIT"       -- 220R -- GND
     D9 ---------> LED 5 (Red)   -- "NO ORBIT"    -- 220R -- GND
     |
     D10 <--- LAUNCH Button (pull-up, active LOW)
     |
     A0 <--- floating (noise source for randomness)

PHYSICAL LAYOUT (vertical, representing launch timeline):

    [LAUNCH] button at bottom

    LED 1  [G]                 IGNITION    ✓ always
    LED 2  [G]                 BURNOUT     ✓ always
    LED 3  [G/R]               SEPARATION  ✓/✗ 80/20
    LED 4  [G/R]               SPIN-UP     depends on 3
    LED 5  [G/R]               ORBIT       depends on 3

    Each stage has a green and red LED (or bicolor LED).
    Only one color lights per stage per launch.
```

## Arduino Code (Sketch)

```cpp
// Launch Vehicle Status Board — Explorer 5 Failure Trainer
// Demonstrates single-point failure propagation

#define LAUNCH_PIN   10
#define NOISE_PIN    A0

// Stage LED pins: [green, red] for each stage
// Stages 1-2 only have green (always succeed)
const int STAGE_PINS[][2] = {
  {2, -1},   // Ignition (green only)
  {3, -1},   // Burnout (green only)
  {4,  5},   // Separation (green, red)
  {6,  7},   // Spin-Up (green, red)
  {8,  9}    // Orbit (green, red)
};

const int NUM_STAGES = 5;
const int FAIL_THRESHOLD = 20;  // 20% failure probability
const int STAGE_DELAY_MS = 1000;
const int HOLD_DELAY_MS = 3000;

int total_launches = 0;
int total_failures = 0;

void setup() {
  Serial.begin(9600);
  pinMode(LAUNCH_PIN, INPUT_PULLUP);

  for (int s = 0; s < NUM_STAGES; s++) {
    if (STAGE_PINS[s][0] >= 0) pinMode(STAGE_PINS[s][0], OUTPUT);
    if (STAGE_PINS[s][1] >= 0) pinMode(STAGE_PINS[s][1], OUTPUT);
  }

  clearAll();
  Serial.println("=== LAUNCH VEHICLE STATUS BOARD ===");
  Serial.println("Explorer 5 Failure Probability Trainer");
  Serial.println("Press LAUNCH to begin sequence.");
  Serial.println("Separation fails ~20% of the time.");
  Serial.println();
}

void clearAll() {
  for (int s = 0; s < NUM_STAGES; s++) {
    if (STAGE_PINS[s][0] >= 0) digitalWrite(STAGE_PINS[s][0], LOW);
    if (STAGE_PINS[s][1] >= 0) digitalWrite(STAGE_PINS[s][1], LOW);
  }
}

void lightStage(int stage, bool success) {
  if (success && STAGE_PINS[stage][0] >= 0) {
    digitalWrite(STAGE_PINS[stage][0], HIGH);  // green
  } else if (!success && STAGE_PINS[stage][1] >= 0) {
    digitalWrite(STAGE_PINS[stage][1], HIGH);  // red
  } else if (!success && STAGE_PINS[stage][1] < 0) {
    // Stage with no red LED — just leave dark on failure
  }
}

// Generate random percentage using analog noise
int randomPercent() {
  int noise = 0;
  for (int i = 0; i < 8; i++) {
    noise = (noise << 1) | (analogRead(NOISE_PIN) & 1);
    delayMicroseconds(100);
  }
  return noise % 100;
}

void runLaunchSequence() {
  total_launches++;
  clearAll();

  Serial.print("--- Launch #");
  Serial.print(total_launches);
  Serial.println(" ---");

  bool mission_ok = true;

  for (int stage = 0; stage < NUM_STAGES; stage++) {
    delay(STAGE_DELAY_MS);

    if (stage == 2 && mission_ok) {
      // SEPARATION — the critical moment
      int roll = randomPercent();
      if (roll < FAIL_THRESHOLD) {
        // FAILURE — contact during separation
        mission_ok = false;
        total_failures++;
        lightStage(stage, false);
        Serial.println("  SEPARATION: *** CONTACT — FAILURE ***");
        Serial.print("  (rolled ");
        Serial.print(roll);
        Serial.println("% — needed >= 20%)");
      } else {
        lightStage(stage, true);
        Serial.println("  SEPARATION: OK (clean release)");
      }
    } else if (mission_ok) {
      lightStage(stage, true);
      const char* names[] = {"IGNITION", "BURNOUT", "SEPARATION",
                              "SPIN-UP", "ORBIT"};
      Serial.print("  ");
      Serial.print(names[stage]);
      Serial.println(": OK");
    } else {
      // Downstream failure — cascade
      lightStage(stage, false);
      const char* names[] = {"IGNITION", "BURNOUT", "SEPARATION",
                              "SPIN-UP", "ORBIT"};
      Serial.print("  ");
      Serial.print(names[stage]);
      Serial.println(": FAILED (cascade)");
    }
  }

  // Print statistics
  Serial.println();
  float rate = (float)total_failures / total_launches * 100.0;
  Serial.print("  Launches: ");
  Serial.print(total_launches);
  Serial.print("  Failures: ");
  Serial.print(total_failures);
  Serial.print("  Rate: ");
  Serial.print(rate, 1);
  Serial.println("%");
  Serial.print("  Expected: 20%  |  Deviation: ");
  Serial.print(abs(rate - 20.0), 1);
  Serial.println("%");
  Serial.println();

  delay(HOLD_DELAY_MS);
  clearAll();
}

void loop() {
  if (digitalRead(LAUNCH_PIN) == LOW) {
    delay(50);  // debounce
    if (digitalRead(LAUNCH_PIN) == LOW) {
      runLaunchSequence();
      while (digitalRead(LAUNCH_PIN) == LOW) delay(10);  // wait for release
    }
  }
}
```

## Bill of Materials

| Qty | Component | Value/Type | Purpose | Cost |
|-----|-----------|------------|---------|------|
| 1 | Arduino Nano | ATmega328P | Controller | $4.00 |
| 3 | LED, green | 3mm, diffused | Success indicators (stages 1-2 + status) | $0.15 |
| 5 | LED, green | 3mm, diffused | Success (stages 3-5) | $0.25 |
| 3 | LED, red | 3mm, diffused | Failure (stages 3-5) | $0.15 |
| 8 | Resistor | 220R, 1/4W | LED current limit | $0.16 |
| 1 | Push button | Momentary NO | LAUNCH trigger | $0.30 |
| 1 | Breadboard | Half-size | Assembly | $3.00 |
| 1 | Wire kit | 22 AWG solid | Connections | $2.00 |
| | | | **Total** | **~$10.01** |

## Build Notes

1. **Start simple.** Wire just the 5 green LEDs and the launch button. Upload the sketch. Press LAUNCH — you should see all 5 LEDs light in sequence, one per second. Verify the timing feels right.

2. **Add the red LEDs.** Wire the red LEDs for stages 3-5 (separation, spin-up, orbit). Now press LAUNCH multiple times. About 1 in 5 launches should show red starting at stage 3 and cascading to stages 4-5.

3. **Watch the statistics.** Open the serial monitor (9600 baud). After 10 launches, the failure rate will be rough — maybe 10% or 30%. After 50 launches, it will converge toward 20%. After 100 launches, it will be close. This is the law of large numbers in action.

4. **Modify the probability.** Change `FAIL_THRESHOLD` from 20 to other values. At 5% (typical modern launch failure rate), you might go 20 launches without seeing a failure. At 50%, every other launch fails. Explorer 5's era had roughly a 50% launch success rate across all programs.

5. **Add more failure modes.** The real Juno I had failure modes at every stage. Add a 5% ignition failure, 3% burnout failure, 10% spin-up failure. Now the cumulative success probability drops dramatically — this is why early space programs failed so often.

## The Physics

Stage separation is the most mechanically complex and failure-prone phase of any launch. The Juno I upper assembly (the "spinning tub") was a cluster of solid rocket motors arranged in a cylinder, spun up to ~450 RPM before separation to provide gyroscopic stability. Separation was achieved by firing pyrotechnic bolts and springs that pushed the spinning cluster away from the spent first stage booster.

Explorer 5's failure occurred because the spinning tub did not clear the booster cleanly. The edge of the tub contacted the booster body, applying an off-axis impulse to the spinning system. This impulse induced nutation — a wobble in the spin axis, like a coin spinning on a table that begins to tilt. Once nutation started, the upper stage rockets fired along a thrust vector that was no longer aligned with the intended trajectory. The payload achieved altitude but not orbital velocity.

The clearance between the spinning tub and the booster was measured in centimeters. A few centimeters of margin was all that separated success from failure. This is a recurring theme in rocketry: the tolerances are tight, the consequences of contact are catastrophic, and the system has no way to recover once the wrong path is taken.

## The Connection

Amanita muscaria emerges from a universal veil — a membrane that completely encloses the developing mushroom. As the fruiting body expands, the veil tears, leaving characteristic white patches on the red cap. The moment of veil-breaking is the mushroom's separation event: the protective enclosure opens, and the organism either emerges successfully or is damaged in the process. Frost, insects, or mechanical disturbance during this critical moment can deform the cap, tear the stipe, or arrest development entirely.

Explorer 5's separation event was its veil-breaking moment. The payload was enclosed within the launch vehicle, protected during ascent. At the moment of emergence — separation — contact occurred, and the mission was deformed. The mushroom's veil tears by design; the rocket's separation was supposed to be clean. Both are moments of maximum vulnerability, where the outcome depends on millimeters of clearance and milliseconds of timing.

Borges would have recognized the symmetry: in "The Garden of Forking Paths," every decision creates two realities. At the moment of separation, Explorer 5 forked into two futures — orbit and failure. We live in the timeline where the tub touched the booster. In the other timeline, Explorer 5 is mapping radiation belts. Both paths exist in the library of all possible outcomes, which is infinite, which contains every book ever written and every book never written, including the one that records the data Explorer 5 would have collected.
