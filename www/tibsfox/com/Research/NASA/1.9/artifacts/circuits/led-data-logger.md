# DIY LED Circuit: Data Logger Display

## The Circuit

An Arduino records analog sensor readings to EEPROM at regular intervals (one sample per second), then plays them back on an 8-LED bar graph at 4x accelerated speed. A button toggles between "record" mode (live sensor reading, green LED indicates recording) and "playback" mode (stored data replayed at 4x speed, amber LED indicates playback). This demonstrates the store-and-forward principle that made Explorer 3 revolutionary: record data continuously during the orbit, then play it back compressed when over a ground station.

Explorer 3 carried a miniature magnetic tape recorder designed by George Ludwig at the University of Iowa. The recorder captured Geiger counter readings throughout the entire orbit — not just the ~10% visible from ground stations. When the satellite passed over a receiving station, the tape played back at high speed, compressing an orbit's worth of data into a brief transmission. This was the technological breakthrough that confirmed the Van Allen radiation belts: for the first time, scientists had a complete radiation profile of a full orbit, including the regions of extreme intensity where the Geiger counter saturated.

**What it does:**
- In "record" mode: reads a sensor (photoresistor or potentiometer) once per second, stores values in EEPROM, displays the current reading on the 8-LED bar graph
- In "playback" mode: reads stored values from EEPROM at 4x speed (4 values per second), displays them on the bar graph — the same data, compressed in time
- A status LED indicates mode: green = recording, amber = playback
- The bar graph shows the data intensity: 1 LED = low, 8 LEDs = maximum
- After playback completes, it can loop or pause

**What it teaches:** Store-and-forward data systems, the concept of time compression in data playback, why continuous recording was necessary to confirm the radiation belts, and how Explorer 3's tape recorder solved the coverage gap that limited Explorer 1 to fragmentary data. The same store-and-forward principle appears in packet-switched networks, email, and every digital recording system.

**Total cost: ~$15**

---

## The Explorer 3 Tape Recorder

```
Explorer 3's Data System:

  RECORD (during orbit):                    PLAYBACK (over ground station):
  ┌──────────────────────┐                 ┌──────────────────────┐
  │  Geiger counter      │                 │  Tape plays back     │
  │  produces pulses     │                 │  at 4x speed         │
  │         │            │                 │         │            │
  │  Scaling circuit     │                 │  Data compressed     │
  │  counts pulses       │                 │  into burst          │
  │         │            │                 │         │            │
  │  Tape recorder       │                 │  Transmitter sends   │
  │  stores counts       │                 │  to ground station   │
  └──────────────────────┘                 └──────────────────────┘

  Explorer 1 (no tape):         Explorer 3 (with tape):
  ┌─────────────────────┐       ┌─────────────────────┐
  │ Orbit radiation:    │       │ Orbit radiation:     │
  │ ▅▇█████████████▇▅▂  │       │ ▅▇█████████████▇▅▂   │
  │                     │       │                      │
  │ Data received:      │       │ Data received:       │
  │ ▅▇_____________▇▅▂  │       │ ▅▇█████████████▇▅▂   │
  │ (gaps = no coverage)│       │ (complete coverage)  │
  └─────────────────────┘       └──────────────────────┘

  The gaps in Explorer 1's data were exactly where the
  radiation was highest. The tape recorder filled the gaps.
```

## Schematic

```
Arduino Uno
    |
    +-- A0 <-------- Sensor input
    |                 (photoresistor voltage divider: 5V—LDR—A0—10K—GND)
    |                 (or 10K potentiometer: 5V—wiper—GND, wiper to A0)
    |
    +-- D2 --------- Record/Playback button ------- GND (internal pullup)
    |
    +-- D3  --------- R(220) --- LED 1 (bar graph, lowest)
    +-- D4  --------- R(220) --- LED 2
    +-- D5  --------- R(220) --- LED 3
    +-- D6  --------- R(220) --- LED 4
    +-- D7  --------- R(220) --- LED 5
    +-- D8  --------- R(220) --- LED 6
    +-- D9  --------- R(220) --- LED 7
    +-- D10 --------- R(220) --- LED 8 (bar graph, highest)
    |
    +-- D11 --------- R(220) --- Green LED (recording indicator)
    +-- D12 --------- R(220) --- Amber/Yellow LED (playback indicator)
    |
    +-- All LED cathodes to GND
    |
    +-- Internal EEPROM (1024 bytes on ATmega328P)
        Stores up to 1024 samples (1 byte each, 0-255)
        At 1 sample/second = 17 minutes of recording
        Playback at 4x = ~4 minutes to replay

SENSOR INPUT (photoresistor):
    5V --- LDR (10K at bright) --- A0 --- 10K resistor --- GND

PHYSICAL LAYOUT:

    [REC]  [PLAY]        ← Status LEDs (green, amber)
       (D11)  (D12)

    ┌──────────────────────────────────────┐
    │ █  █  █  █  █  █  █  █              │ ← 8-LED bar graph
    │ 1  2  3  4  5  6  7  8              │   (D3-D10)
    └──────────────────────────────────────┘

    [ MODE ]              ← Toggle button (D2)

    [===SENSOR===]        ← Photoresistor or pot (A0)

    Build the bar graph as a horizontal row.
    In record mode, LEDs show live sensor reading.
    In playback mode, LEDs replay stored data at 4x speed.
```

## Arduino Code

```cpp
// Explorer 3 Data Logger Display
// Mission 1.9 — Store-and-Forward Demonstration
//
// Records sensor data to EEPROM, plays back at 4x speed.
// Demonstrates the principle that confirmed the Van Allen belts.

#include <EEPROM.h>

// Pin assignments
const int SENSOR_PIN = A0;
const int BUTTON_PIN = 2;
const int BAR_PINS[] = {3, 4, 5, 6, 7, 8, 9, 10};  // 8-LED bar graph
const int REC_LED = 11;    // Green — recording
const int PLAY_LED = 12;   // Amber — playback

// State
bool recording = true;
int writeAddr = 0;
int readAddr = 0;
unsigned long lastSample = 0;
unsigned long lastPlayback = 0;
bool lastButton = HIGH;
const int MAX_SAMPLES = 1024;  // EEPROM size on ATmega328P

void setup() {
  // Bar graph LEDs
  for (int i = 0; i < 8; i++) {
    pinMode(BAR_PINS[i], OUTPUT);
  }
  // Status LEDs
  pinMode(REC_LED, OUTPUT);
  pinMode(PLAY_LED, OUTPUT);
  // Button with internal pullup
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  // Start in record mode
  setMode(true);

  Serial.begin(9600);
  Serial.println("Explorer 3 Data Logger");
  Serial.println("Press button to toggle Record/Playback");
  Serial.println("Recording...");
}

void loop() {
  // Check button (debounced)
  bool btn = digitalRead(BUTTON_PIN);
  if (btn == LOW && lastButton == HIGH) {
    delay(50);  // Debounce
    if (digitalRead(BUTTON_PIN) == LOW) {
      toggleMode();
    }
  }
  lastButton = btn;

  unsigned long now = millis();

  if (recording) {
    // === RECORD MODE ===
    // Sample once per second
    if (now - lastSample >= 1000) {
      lastSample = now;

      // Read sensor (0-1023) and map to byte (0-255)
      int raw = analogRead(SENSOR_PIN);
      byte value = map(raw, 0, 1023, 0, 255);

      // Store in EEPROM
      if (writeAddr < MAX_SAMPLES) {
        EEPROM.update(writeAddr, value);  // update() avoids unnecessary writes
        writeAddr++;
      } else {
        // EEPROM full — stop recording
        Serial.println("EEPROM full. Switch to playback.");
      }

      // Display on bar graph
      displayBar(value);

      // Serial output
      Serial.print("REC [");
      Serial.print(writeAddr);
      Serial.print("] = ");
      Serial.println(value);
    }
  } else {
    // === PLAYBACK MODE ===
    // Play back at 4x speed (one sample every 250ms)
    if (now - lastPlayback >= 250) {
      lastPlayback = now;

      if (readAddr < writeAddr) {
        byte value = EEPROM.read(readAddr);
        readAddr++;

        // Display on bar graph
        displayBar(value);

        // Serial output
        Serial.print("PLAY [");
        Serial.print(readAddr);
        Serial.print("/");
        Serial.print(writeAddr);
        Serial.print("] = ");
        Serial.println(value);
      } else {
        // Playback complete — loop
        readAddr = 0;
        Serial.println("--- Playback complete, looping ---");
      }
    }
  }
}

void displayBar(byte value) {
  // Map 0-255 to 0-8 LEDs
  int numLeds = map(value, 0, 255, 0, 8);

  for (int i = 0; i < 8; i++) {
    digitalWrite(BAR_PINS[i], (i < numLeds) ? HIGH : LOW);
  }
}

void setMode(bool rec) {
  recording = rec;
  digitalWrite(REC_LED, rec ? HIGH : LOW);
  digitalWrite(PLAY_LED, rec ? LOW : HIGH);

  if (!rec) {
    readAddr = 0;  // Start playback from beginning
    lastPlayback = millis();
  } else {
    lastSample = millis();
  }
}

void toggleMode() {
  recording = !recording;
  setMode(recording);

  if (recording) {
    Serial.println("--- Switched to RECORD mode ---");
    // Optionally reset write address to start fresh:
    // writeAddr = 0;
  } else {
    Serial.print("--- Switched to PLAYBACK mode (");
    Serial.print(writeAddr);
    Serial.println(" samples at 4x speed) ---");
  }
}
```

## Bill of Materials

| Component | Value | Qty | Cost |
|-----------|-------|-----|------|
| Arduino Uno (or clone) | ATmega328P | 1 | $8.00 |
| LEDs (green, for bar graph) | 5mm diffused | 8 | $0.80 |
| LED (green, status) | 5mm diffused | 1 | $0.10 |
| LED (amber/yellow, status) | 5mm diffused | 1 | $0.10 |
| Resistors | 220 ohm, 1/4W | 10 | $1.00 |
| Resistor | 10K ohm, 1/4W | 1 | $0.10 |
| Photoresistor (LDR) | 10K at bright | 1 | $0.50 |
| Tactile button | 6mm | 1 | $0.10 |
| Breadboard | half-size | 1 | $3.00 |
| Jumper wires | M-M | ~20 | $1.00 |
| **Total** | | | **~$15** |

## How It Works

1. **Recording phase (1 sample/second):**
   The Arduino reads the sensor value (0-1023), maps it to a byte (0-255), and writes it to EEPROM. The bar graph shows the live reading. The green LED glows. This represents Explorer 3 recording Geiger counter data to magnetic tape during each orbit.

2. **Playback phase (4 samples/second):**
   Press the button to switch modes. The Arduino reads stored values from EEPROM at 4x the recording speed and displays them on the bar graph. The amber LED glows. This represents the satellite playing back its tape at high speed over a ground station.

3. **The demonstration:**
   - Record for 30-60 seconds while varying the sensor (wave your hand over the photoresistor, or turn the pot up and down)
   - Switch to playback — watch the same pattern replay in 1/4 the time
   - The data is the same. The time is compressed. This is exactly what Explorer 3 did.
   - Try simulating the radiation belt: slowly increase the sensor reading (entering the belt), then cover the sensor completely (saturation — zero reading), then slowly uncover it (exiting the belt). The playback will show the complete profile including the zero gap.

4. **Connection to Explorer 3:**
   - Explorer 1 could only transmit live data when visible from a ground station (~10% of orbit)
   - Explorer 3's tape recorder stored data for the entire orbit
   - The playback revealed the complete radiation profile — including the regions where the Geiger counter saturated
   - This continuous coverage was what Van Allen needed to confirm the radiation belts

## Extension Ideas

- **Add a buzzer:** Play a click sound on each LED update during playback — like Geiger counter clicks at compressed speed
- **Multiple orbits:** Record several "orbits" (cycles of the sensor), separated by markers in EEPROM. Playback shows all orbits consecutively
- **Serial plotter:** Use Arduino's Serial Plotter to visualize the recorded data as a waveform — compare record speed vs playback speed
- **Explorer 1 mode:** Add a mode where only every 10th sample is displayed (simulating the 10% ground station coverage), demonstrating the data gaps
