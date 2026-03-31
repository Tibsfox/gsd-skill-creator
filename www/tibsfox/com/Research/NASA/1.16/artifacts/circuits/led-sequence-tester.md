# DIY LED Circuit: Launch Sequence Board — Connector Ordering Failure

## The Circuit

An Arduino-based circuit that demonstrates how Mercury-Redstone 1 failed: a race condition in the tail plug disconnection sequence. Four push buttons must be pressed in the correct order. If pressed correctly, green LEDs light up in sequence (successful launch). If pressed in the wrong order — the way MR-1 actually failed — a red LED lights and a buzzer sounds (engine shutdown on the pad).

**What it does:**
- 4 push buttons labeled A, B, C, D (representing connector pins)
- Correct sequence: A → B → C → D (control circuits disconnect last)
- Wrong sequence (MR-1 failure): any other order triggers ABORT
- Correct: green LEDs chase in sequence, final green LED holds steady
- Wrong: red LED flashes, piezo buzzer sounds, display shows "SNEAK CIRCUIT"
- Reset button to try again
- 7-segment display or serial monitor shows current state

**What it teaches:** MR-1's tail plug had two electrical connectors that were supposed to disconnect in a specific order when the rocket lifted off. The first connector was supposed to separate before the second. Due to the rocket only rising 4 inches before settling back, the connectors separated in the wrong order, creating a "sneak circuit" — an unintended electrical path that sent a premature shutdown signal. This circuit lets you experience the race condition hands-on: order matters, and the wrong sequence creates an unintended result.

**Total cost: ~$12**

---

## Schematic

```
Arduino Nano/Uno Pin Assignments:

  Digital Inputs (with 10K pull-down resistors):
    D2  ← Button A (Pad Power)      [10K to GND, button to 5V]
    D3  ← Button B (Control Bus)    [10K to GND, button to 5V]
    D4  ← Button C (Telemetry)      [10K to GND, button to 5V]
    D5  ← Button D (Umbilical)      [10K to GND, button to 5V]
    D6  ← Reset Button              [10K to GND, button to 5V]

  Digital Outputs:
    D7  → R1 (220Ω) → Green LED 1   (Step A confirmed)
    D8  → R2 (220Ω) → Green LED 2   (Step B confirmed)
    D9  → R3 (220Ω) → Green LED 3   (Step C confirmed)
    D10 → R4 (220Ω) → Green LED 4   (Step D confirmed — LAUNCH)
    D11 → R5 (220Ω) → Red LED       (ABORT — wrong sequence)
    D12 → Piezo Buzzer               (ABORT alarm)
    D13 → R6 (220Ω) → Yellow LED    (Ready/waiting for input)

  Power:
    5V  → Button common rail
    GND → LED cathodes, pull-down resistors, buzzer GND

Layout:
                       +5V
                        |
            +-----------+-----------+
            |           |           |
          [Btn A]    [Btn B]    [Btn C]    [Btn D]
            |           |           |           |
           D2          D3          D4          D5
            |           |           |           |
          [10K]      [10K]      [10K]      [10K]
            |           |           |           |
           GND         GND         GND         GND

  D7──[220Ω]──LED(grn)──GND   Step A ✓
  D8──[220Ω]──LED(grn)──GND   Step B ✓
  D9──[220Ω]──LED(grn)──GND   Step C ✓
  D10─[220Ω]──LED(grn)──GND   Step D ✓ LAUNCH
  D11─[220Ω]──LED(red)──GND   ABORT
  D12─[Buzzer]─────────GND    ABORT alarm
  D13─[220Ω]──LED(yel)──GND   Ready
```

## Arduino Sketch

```cpp
/*
 * Launch Sequence Board — MR-1 Connector Ordering Demo
 * NASA Mission Series v1.16
 *
 * Demonstrates how incorrect disconnection sequence caused
 * Mercury-Redstone 1's sneak circuit and premature shutdown.
 */

const int BTN_A = 2;      // Pad Power
const int BTN_B = 3;      // Control Bus
const int BTN_C = 4;      // Telemetry
const int BTN_D = 5;      // Umbilical
const int BTN_RESET = 6;

const int LED_STEP[] = {7, 8, 9, 10};  // Green sequence LEDs
const int LED_ABORT = 11;
const int BUZZER = 12;
const int LED_READY = 13;

// Correct sequence: A(0) → B(1) → C(2) → D(3)
const int CORRECT_SEQ[] = {0, 1, 2, 3};
const char* STEP_NAMES[] = {"PAD POWER", "CONTROL BUS", "TELEMETRY", "UMBILICAL"};

int currentStep = 0;
bool aborted = false;
bool launched = false;
unsigned long lastDebounce[4] = {0, 0, 0, 0};
const int DEBOUNCE_MS = 200;

void setup() {
  Serial.begin(9600);
  for (int i = 2; i <= 6; i++) pinMode(i, INPUT);
  for (int i = 7; i <= 13; i++) pinMode(i, OUTPUT);

  resetSequence();
  Serial.println("=== MR-1 LAUNCH SEQUENCE BOARD ===");
  Serial.println("Press buttons A-B-C-D in correct order.");
  Serial.println("Wrong order = SNEAK CIRCUIT = ABORT");
  Serial.println();
}

void loop() {
  // Check reset
  if (digitalRead(BTN_RESET) == HIGH) {
    delay(200);
    resetSequence();
    return;
  }

  if (aborted || launched) return;

  // Check each button
  for (int btn = 0; btn < 4; btn++) {
    int pin = BTN_A + btn;
    if (digitalRead(pin) == HIGH && millis() - lastDebounce[btn] > DEBOUNCE_MS) {
      lastDebounce[btn] = millis();

      if (btn == CORRECT_SEQ[currentStep]) {
        // Correct step!
        digitalWrite(LED_STEP[currentStep], HIGH);
        Serial.print("Step ");
        Serial.print(currentStep + 1);
        Serial.print(": ");
        Serial.print(STEP_NAMES[btn]);
        Serial.println(" — CORRECT");
        currentStep++;

        if (currentStep >= 4) {
          // LAUNCH SUCCESS
          launched = true;
          digitalWrite(LED_READY, LOW);
          Serial.println();
          Serial.println(">>> LAUNCH SUCCESSFUL <<<");
          Serial.println("All connectors disconnected in correct order.");
          // Chase pattern on green LEDs
          for (int i = 0; i < 5; i++) {
            for (int j = 0; j < 4; j++) {
              digitalWrite(LED_STEP[j], (i + j) % 2);
            }
            delay(150);
          }
          for (int j = 0; j < 4; j++) digitalWrite(LED_STEP[j], HIGH);
        }
      } else {
        // WRONG ORDER — SNEAK CIRCUIT!
        aborted = true;
        digitalWrite(LED_READY, LOW);
        Serial.println();
        Serial.print("!!! SNEAK CIRCUIT DETECTED !!!");
        Serial.println();
        Serial.print("Expected: ");
        Serial.print(STEP_NAMES[CORRECT_SEQ[currentStep]]);
        Serial.print(" but got: ");
        Serial.println(STEP_NAMES[btn]);
        Serial.println("Spurious shutdown signal created.");
        Serial.println("Engine cutoff. Rocket rose 4 inches.");
        Serial.println("Escape tower fired. Parachutes deployed on pad.");
        Serial.println();
        Serial.println("Press RESET to try again.");

        // Flash red + buzz
        for (int i = 0; i < 10; i++) {
          digitalWrite(LED_ABORT, HIGH);
          tone(BUZZER, 1000);
          delay(150);
          digitalWrite(LED_ABORT, LOW);
          noTone(BUZZER);
          delay(100);
        }
        digitalWrite(LED_ABORT, HIGH);  // Hold red
      }
    }
  }
}

void resetSequence() {
  currentStep = 0;
  aborted = false;
  launched = false;
  for (int i = 0; i < 4; i++) digitalWrite(LED_STEP[i], LOW);
  digitalWrite(LED_ABORT, LOW);
  noTone(BUZZER);
  digitalWrite(LED_READY, HIGH);
  Serial.println("[RESET] Ready for launch sequence...");
}
```

## Parts List

| Qty | Part | Cost |
|-----|------|------|
| 1 | Arduino Nano (clone) | $3.50 |
| 4 | Momentary push buttons (12mm) | $1.00 |
| 1 | Reset push button | $0.25 |
| 4 | Green 5mm LEDs | $0.40 |
| 1 | Red 5mm LED | $0.20 |
| 1 | Yellow 5mm LED | $0.20 |
| 6 | 220Ω resistors (LED current limit) | $0.30 |
| 5 | 10KΩ resistors (pull-down) | $0.25 |
| 1 | Piezo buzzer (passive) | $0.50 |
| 1 | Half-size breadboard | $2.50 |
| 1 | Jumper wire kit | $2.00 |
| 1 | USB cable (for Arduino power + serial) | $1.00 |
| **Total** | | **~$12** |

## The MR-1 Failure Explained

The Mercury-Redstone tail plug was an umbilical connector at the base of the rocket. When the rocket lifted off, the plug was supposed to pull free, disconnecting in a specific sequence:

1. **Ground power** disconnects first (rocket switches to internal)
2. **Control signals** disconnect second
3. **Monitoring circuits** disconnect last

On MR-1, the rocket rose only 4 inches — just enough to partially separate the connector. The pins disconnected in the wrong order, creating a "sneak circuit": an unintended path through the partially-connected plug that sent a shutdown command to the engine.

The engine obeyed the shutdown command. The rocket settled back onto the pad. The escape tower, sensing the sudden deceleration, fired its solid rocket motor and flew away. The capsule, now sitting on a dead rocket with no escape tower, sensed the barometric altitude (still at sea level) and deployed its parachutes.

The parachutes draped over the rocket. The rocket sat on the pad, fully fueled, with live pyrotechnics. Nobody could approach for 24 hours until the batteries died.

This was the most informative failure in the Mercury program. Every system worked exactly as designed — just in the wrong sequence.

---

## Classroom Extensions

1. **Race condition lab:** Have students identify all possible button orderings (4! = 24) and classify which ones produce the sneak circuit
2. **State machine diagram:** Draw the state transitions and identify the "sneak path" states
3. **Probability:** If buttons are pressed randomly, what's the probability of the correct sequence? (1/24 ≈ 4.2%)
4. **Connector design:** Discuss how the plug was redesigned with a longer first-disconnect pin to force correct ordering
