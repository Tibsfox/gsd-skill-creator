# Circuit: Dead Signal Indicator — Ranger 4 Communication Failure

## Mission 1.29 — Ranger 4 (Atlas-Agena B)

**Cost:** ~$15
**Difficulty:** Beginner
**Time:** 1-2 hours
**Concept:** A row of 8 LEDs demonstrates how a single-point failure (timer) reduces a multi-channel telemetry system to a single carrier signal

---

## What It Does

At power-on, all 8 LEDs flash in a rapid sequence — simulating the 8 telemetry channels of a functioning Ranger spacecraft (temperature, voltage, radiation counts, camera status, antenna position, propulsion status, sequencer state, carrier). After approximately 10 seconds (representing the timer failure at T+1 hour), LEDs 1-7 go dark. LED 8 (the carrier) continues blinking at a steady rate.

A potentiometer represents increasing range from Earth. As you turn it, LED 8 dims — the carrier signal attenuating as 1/r². At maximum rotation (representing 391,000 km), LED 8 goes dark. Impact. Silence.

## Bill of Materials

| Component | Quantity | Cost |
|-----------|----------|------|
| Arduino Uno (or Nano) | 1 | $8 |
| LED (assorted colors) | 8 | $1 |
| Resistor 220Ω | 8 | $0.50 |
| Potentiometer 10KΩ | 1 | $1 |
| Breadboard (half-size) | 1 | $3 |
| Jumper wires | ~15 | $1 |
| **Total** | | **~$15** |

## Wiring

```
Arduino Pin 2 → 220Ω → LED 1 (red — temperature)     → GND
Arduino Pin 3 → 220Ω → LED 2 (red — voltage)          → GND
Arduino Pin 4 → 220Ω → LED 3 (yellow — radiation)     → GND
Arduino Pin 5 → 220Ω → LED 4 (yellow — camera)        → GND
Arduino Pin 6 → 220Ω → LED 5 (green — antenna)        → GND
Arduino Pin 7 → 220Ω → LED 6 (green — propulsion)     → GND
Arduino Pin 8 → 220Ω → LED 7 (blue — sequencer)       → GND
Arduino Pin 9 → 220Ω → LED 8 (white — CARRIER)        → GND

Potentiometer: Outer pins to 5V and GND, wiper to A0
```

## Arduino Sketch

```cpp
// dead_signal_indicator.ino
// Ranger 4 Communication Failure Demonstration
// Mission 1.29 — NASA Mission Series

const int NUM_LEDS = 8;
const int ledPins[NUM_LEDS] = {2, 3, 4, 5, 6, 7, 8, 9};
const int potPin = A0;
const int CARRIER_LED = 7; // index of the carrier LED (pin 9)

bool timerFailed = false;
unsigned long startTime;
const unsigned long TIMER_FAILURE_MS = 10000; // 10 seconds = T+1hr

void setup() {
  for (int i = 0; i < NUM_LEDS; i++) {
    pinMode(ledPins[i], OUTPUT);
  }
  startTime = millis();
}

void loop() {
  unsigned long elapsed = millis() - startTime;
  
  if (!timerFailed && elapsed < TIMER_FAILURE_MS) {
    // Phase 1: Active telemetry — all 8 LEDs flash in sequence
    for (int i = 0; i < NUM_LEDS; i++) {
      digitalWrite(ledPins[i], (elapsed / 100) % NUM_LEDS == i ? HIGH : LOW);
    }
  } else {
    timerFailed = true;
    
    // Phase 2: Timer failed — only carrier LED active
    for (int i = 0; i < NUM_LEDS; i++) {
      if (i != CARRIER_LED) {
        digitalWrite(ledPins[i], LOW); // telemetry channels dark
      }
    }
    
    // Carrier LED: blink rate = steady 2 Hz
    // Brightness controlled by potentiometer (range/attenuation)
    int potValue = analogRead(potPin); // 0-1023
    int brightness = map(potValue, 0, 1023, 255, 0); // far = dim
    
    // Blink the carrier
    if ((millis() / 250) % 2 == 0) {
      analogWrite(ledPins[CARRIER_LED], brightness);
    } else {
      analogWrite(ledPins[CARRIER_LED], 0);
    }
  }
}
```

## The Lesson

Before the timer failure: eight channels of information, each carrying data about a different spacecraft system. After: one channel, carrying only "I am here." The potentiometer lets you feel the inverse-square law — as range increases, the signal fades until it vanishes. This is what the DSN heard for 64 hours: a single tone, getting fainter, saying nothing except that the spacecraft still existed. Then silence.

## Connection to Previous Circuits

- **v1.26 (Ranger 1):** Orbital decay LEDs — LEDs that slowly go dark as the spacecraft reenters
- **v1.28 (Ranger 3):** IF amplifier — the radio chain that amplifies weak signals
- **v1.29 (Ranger 4):** Dead signal indicator — the moment the signal loses all content
- **v1.30 (Ranger 5):** [next in series]

## Radio Series: AM Detector

See `radio-am-detector.md` for the companion radio circuit — the AM detector that extracts audio from an amplitude-modulated carrier. When connected to v1.28's IF amplifier output with no modulation present, it produces silence: what the DSN heard from Ranger 4.
