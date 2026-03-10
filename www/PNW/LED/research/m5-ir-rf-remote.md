# IR & RF Remote Control Systems

A physical remote control adds tactile, no-phone-needed interaction to any LED project. This page covers infrared (IR) receivers and the NEC protocol, 433 MHz RF modules for through-wall control, Arduino decoding libraries, and mapping remote buttons to WLED presets and custom dimmer actions.

---

## 1. Infrared Remote Control

### 1.1 How IR Remotes Work

An IR remote transmits pulses of infrared light (940 nm wavelength, invisible to the human eye) using a modulated carrier frequency. The receiver demodulates the carrier and outputs the digital pulse train to a microcontroller for decoding.

```
  IR Remote                        IR Receiver            MCU
  +----------+                     +---------+          +-----+
  | Button   |  940nm IR pulses    | TSOP    |  Digital | GPIO|
  | pressed  |---->)))  )))  ))--->| 38238   |--------->|     |
  |          |  38kHz modulated    | Demod   |  output  |     |
  +----------+                     +---------+          +-----+
                                      |   |
                                     VCC  GND
                                    (3.3V or 5V)
```

The 38 kHz carrier frequency is an industry standard. The IR LED in the remote pulses at 38 kHz when transmitting a "mark" (logical signal), and stays dark during a "space" (pause). This modulation lets the receiver distinguish the remote signal from ambient IR sources (sunlight, incandescent bulbs).

### 1.2 TSOP38238 Receiver

The TSOP38238 is the most common IR receiver module. It integrates the photodiode, bandpass filter, amplifier, demodulator, and output driver in a single 3-pin package.

| Parameter | Value |
|-----------|-------|
| Carrier frequency | 38 kHz |
| Supply voltage | 2.5V - 5.5V |
| Output | Active low (LOW during mark, HIGH during space) |
| Reception angle | +/- 45 degrees |
| Range | 10-15 meters (depends on remote LED power) |
| Package | 3-pin through-hole (OUT, GND, VCC) |

### 1.3 Wiring

```
  TSOP38238             Arduino/ESP32
  (front view:          +-----------+
   dome facing you)     |           |
                        |  GPIO 11  |<--- Pin 1 (OUT)
    +---+---+---+       |           |
    | 1 | 2 | 3 |       |  GND     |<--- Pin 2 (GND)
    +---+---+---+       |           |
    OUT GND VCC         |  5V/3.3V |<--- Pin 3 (VCC)
                        +-----------+

  Optional: 100nF ceramic capacitor between VCC and GND
  (reduces noise on long wire runs)
```

Pin 1 (OUT) connects directly to a GPIO input -- no pull-up resistor needed. The TSOP38238 has an internal pull-up and actively drives the output.

---

## 2. NEC Protocol

### 2.1 Protocol Structure

The NEC protocol is the most widely used IR encoding scheme, found in most generic LED strip remotes, TV remotes, and low-cost consumer electronics.

A complete NEC transmission consists of:

```
  |<-- Leader -->|<-- Address -->|<-- ~Address -->|<-- Command -->|<-- ~Command -->|
  |  9ms mark    |   8 bits      |   8 bits       |   8 bits      |   8 bits       |
  |  4.5ms space |               | (complement)   |               | (complement)   |

  Total: 32 bits of data (16 address + 16 command, including complements)

  Timing:
  +---------+    +--+  +--+    +--+     +--+
  |  9ms    |    |  |  |  |    |  |     |  |
  |  mark   |    |  |  |  |    |  |     |  |
  +---------+----+--+--+--+----+--+-----+--+----

  Logical 0: 562.5us mark + 562.5us space  (total 1.125ms)
  Logical 1: 562.5us mark + 1687.5us space (total 2.25ms)
```

### 2.2 Repeat Code

When a button is held down, the remote sends the full code once, then repeats with a shortened pattern every 110 ms:

```
  Repeat code: 9ms mark + 2.25ms space + 562.5us mark
  (no data bits -- just "still holding the button")
```

### 2.3 Common LED Strip Remote Codes

The generic 24-key and 44-key LED strip remotes use these typical NEC codes (address may vary by manufacturer):

| Button | NEC Code (hex) | Function |
|--------|---------------|----------|
| Brightness Up | 0x5C | Increase brightness |
| Brightness Down | 0x5D | Decrease brightness |
| OFF | 0x41 | Turn off |
| ON | 0x40 | Turn on |
| Red | 0x58 | Solid red |
| Green | 0x59 | Solid green |
| Blue | 0x45 | Solid blue |
| White | 0x44 | Solid white |
| Flash | 0x4C | Strobe effect |
| Strobe | 0x4D | Chase effect |
| Fade | 0x50 | Smooth color fade |
| Smooth | 0x51 | Gradual color cycle |

---

## 3. Arduino IR Decoding

### 3.1 IRremote Library

The Arduino IRremote library handles all the timing-critical decoding:

```
#include <IRremote.hpp>

const int IR_RECEIVE_PIN = 11;

void setup() {
  Serial.begin(115200);
  IrReceiver.begin(IR_RECEIVE_PIN, ENABLE_LED_FEEDBACK);
  Serial.println("IR Receiver ready - point remote and press buttons");
}

void loop() {
  if (IrReceiver.decode()) {
    // Print the decoded value
    Serial.print("Protocol: ");
    Serial.print(getProtocolString(IrReceiver.decodedIRData.protocol));
    Serial.print("  Address: 0x");
    Serial.print(IrReceiver.decodedIRData.address, HEX);
    Serial.print("  Command: 0x");
    Serial.print(IrReceiver.decodedIRData.command, HEX);
    Serial.print("  Raw: 0x");
    Serial.println(IrReceiver.decodedIRData.decodedRawData, HEX);

    // Check for repeat
    if (IrReceiver.decodedIRData.flags & IRDATA_FLAGS_IS_REPEAT) {
      Serial.println("  (repeat)");
    }

    IrReceiver.resume();  // Ready for next code
  }
}
```

### 3.2 Mapping Buttons to LED Actions

```
#include <IRremote.hpp>
#include <Adafruit_NeoPixel.h>

const int IR_PIN = 11;
const int LED_PIN = 6;
const int NUM_LEDS = 60;

Adafruit_NeoPixel strip(NUM_LEDS, LED_PIN, NEO_GRB + NEO_KHZ800);

uint8_t brightness = 128;
bool isOn = true;

// NEC command codes from your specific remote
// (run the decoder sketch above to find your codes)
#define CMD_ON        0x40
#define CMD_OFF       0x41
#define CMD_BRI_UP    0x5C
#define CMD_BRI_DOWN  0x5D
#define CMD_RED       0x58
#define CMD_GREEN     0x59
#define CMD_BLUE      0x45
#define CMD_WHITE     0x44

void setAllColor(uint8_t r, uint8_t g, uint8_t b) {
  for (int i = 0; i < NUM_LEDS; i++) {
    strip.setPixelColor(i, strip.Color(r, g, b));
  }
  strip.show();
}

void setup() {
  Serial.begin(115200);
  IrReceiver.begin(IR_PIN, ENABLE_LED_FEEDBACK);
  strip.begin();
  strip.setBrightness(brightness);
  setAllColor(255, 200, 150);  // Default warm white
}

void loop() {
  if (IrReceiver.decode()) {
    uint8_t cmd = IrReceiver.decodedIRData.command;

    switch (cmd) {
      case CMD_ON:
        isOn = true;
        strip.setBrightness(brightness);
        strip.show();
        break;

      case CMD_OFF:
        isOn = false;
        strip.setBrightness(0);
        strip.show();
        break;

      case CMD_BRI_UP:
        if (brightness < 240) brightness += 16;
        else brightness = 255;
        strip.setBrightness(brightness);
        strip.show();
        break;

      case CMD_BRI_DOWN:
        if (brightness > 16) brightness -= 16;
        else brightness = 1;
        strip.setBrightness(brightness);
        strip.show();
        break;

      case CMD_RED:   setAllColor(255, 0, 0); break;
      case CMD_GREEN: setAllColor(0, 255, 0); break;
      case CMD_BLUE:  setAllColor(0, 0, 255); break;
      case CMD_WHITE: setAllColor(255, 255, 255); break;
    }

    IrReceiver.resume();
  }
}
```

### 3.3 ESP32 IR Receiving

The ESP32 IRremote setup is identical except for the pin selection. The ESP32 can use any GPIO pin for IR input:

```
#include <IRremote.hpp>

const int IR_RECEIVE_PIN = 15;  // Any GPIO

void setup() {
  Serial.begin(115200);
  IrReceiver.begin(IR_RECEIVE_PIN, ENABLE_LED_FEEDBACK);
}
// ... (same decode logic as Arduino)
```

---

## 4. WLED IR Remote Integration

WLED has built-in IR remote support -- no custom code needed. It decodes NEC, RC5, and RC6 protocols and maps buttons to WLED actions.

### 4.1 Wiring for WLED

Connect the TSOP38238 to the WLED ESP board:

```
  TSOP38238           ESP8266 (WLED)
  OUT -------> GPIO4  (D2 on NodeMCU)
  GND -------> GND
  VCC -------> 3.3V
```

### 4.2 WLED IR Configuration

1. Open WLED web UI -> Config -> LED Preferences
2. Scroll to "IR GPIO" and enter the pin number (4 for GPIO4)
3. Select your remote type from the dropdown:
   - **24-key RGB remote** (most common cheap remote)
   - **44-key RGB remote** (extended color palette)
   - **21-key RGB remote**
   - **6-key** (minimal on/off/bri)
   - **JSON remote** (fully custom mapping)
4. Click Save

### 4.3 Custom IR-to-Preset Mapping (JSON Remote)

For full control, WLED's JSON remote feature maps any IR code to any WLED action. Create a file `ir.json` in the WLED filesystem:

```
{
  "0x5C": {"bri": "~16"},
  "0x5D": {"bri": "~-16"},
  "0x40": {"on": true},
  "0x41": {"on": false},
  "0x58": {"ps": 1},
  "0x59": {"ps": 2},
  "0x45": {"ps": 3},
  "0x44": {"seg": [{"col": [[255,255,255]]}]},
  "0x50": {"seg": [{"fx": 9, "sx": 128}]},
  "0x51": {"seg": [{"fx": 63, "sx": 100}]}
}
```

Upload this file via the WLED file editor (Config -> Security & Updates -> File Editor) or via curl:

```
curl -X POST http://192.168.1.60/edit \
  -F "data=@ir.json;filename=/ir.json"
```

The `~` prefix on brightness values means relative (add/subtract from current value). Without `~`, the value is absolute.

---

## 5. 433 MHz RF Remote Control

### 5.1 Why RF Instead of IR

| Feature | IR (38 kHz) | RF (433 MHz) |
|---------|-------------|--------------|
| Line of sight | Required | Not required |
| Range | 5-15m | 30-100m |
| Through walls | No | Yes |
| Interference | Immune to RF | Immune to IR |
| Cost | Very low ($0.50) | Low ($2-3) |
| Bandwidth | ~1 kbps | ~1-10 kbps |
| Common remotes | TV, LED strip | Garage, outlet, weather station |

RF is superior for installations where the controller is hidden (inside a cabinet, behind furniture, in another room). IR requires pointing the remote at the receiver.

### 5.2 433 MHz Module Types

**Transmitter (TX):** Simple ASK (amplitude shift keying) module with 3 pins: VCC, GND, DATA. Operating voltage 3-12V (higher voltage = more range). Typical part: FS1000A.

**Receiver (RX):** Superheterodyne or super-regenerative module with 4 pins: VCC, GND, DATA, DATA (two data pins are connected internally). Operating voltage 5V. Typical part: MX-RM-5V or SYN480R.

```
  433MHz Transmitter              433MHz Receiver
  (in the remote)                 (at the LED controller)
  +----------+                    +------------+
  | VCC (3-12V)                   | VCC (5V)   |
  | DATA <-- MCU TX               | DATA --> MCU RX (GPIO)
  | GND                           | DATA (duplicate)
  +----------+                    | GND        |
      |                           +------------+
   [antenna]                         [antenna]
   17.3cm wire                       17.3cm wire
   (quarter wavelength)              (quarter wavelength)
```

### 5.3 Antenna

Both TX and RX modules benefit enormously from a simple antenna -- a straight piece of wire soldered to the ANT pad:

```
Antenna length = wavelength / 4 = (300,000,000 / 433,920,000) / 4 = 17.3 cm

Solder a straight 17.3 cm wire to the ANT pad on each module.
Range improves from ~2m (no antenna) to 30-100m (with antenna).
```

---

## 6. Arduino 433 MHz Decoding

### 6.1 Learning Remote Codes

Most 433 MHz learning remotes use simple OOK (on-off keying) with fixed or rolling codes. The RCSwitch library decodes the most common protocols:

```
#include <RCSwitch.h>

RCSwitch mySwitch = RCSwitch();

void setup() {
  Serial.begin(9600);
  mySwitch.enableReceive(0);  // Interrupt 0 = pin 2 on Uno
  Serial.println("433MHz Receiver ready");
}

void loop() {
  if (mySwitch.available()) {
    unsigned long value = mySwitch.getReceivedValue();

    if (value == 0) {
      Serial.println("Unknown encoding");
    } else {
      Serial.print("Received: ");
      Serial.print(value);
      Serial.print("  /  ");
      Serial.print(value, BIN);
      Serial.print("  Protocol: ");
      Serial.print(mySwitch.getReceivedProtocol());
      Serial.print("  Bit length: ");
      Serial.println(mySwitch.getReceivedBitlength());
    }

    mySwitch.resetAvailable();
  }
}
```

### 6.2 Mapping RF Buttons to LED Actions

```
#include <RCSwitch.h>
#include <Adafruit_NeoPixel.h>

RCSwitch mySwitch = RCSwitch();
Adafruit_NeoPixel strip(60, 6, NEO_GRB + NEO_KHZ800);

// RF codes learned from your specific remote
// (run the decoder sketch above to find these)
#define RF_BTN_A  1381717
#define RF_BTN_B  1381716
#define RF_BTN_C  1381719
#define RF_BTN_D  1381718

uint8_t currentPreset = 0;

struct Preset {
  uint8_t r, g, b;
  uint8_t brightness;
  const char* name;
};

const Preset presets[] = {
  {255, 200, 150, 200, "Warm White"},
  {255, 0, 0, 180, "Red"},
  {0, 100, 255, 220, "Cool Blue"},
  {0, 255, 100, 180, "Green"},
};
const int NUM_PRESETS = sizeof(presets) / sizeof(presets[0]);

void applyPreset(int idx) {
  strip.setBrightness(presets[idx].brightness);
  for (int i = 0; i < strip.numPixels(); i++) {
    strip.setPixelColor(i,
      presets[idx].r, presets[idx].g, presets[idx].b);
  }
  strip.show();
  Serial.print("Preset: "); Serial.println(presets[idx].name);
}

void setup() {
  Serial.begin(9600);
  mySwitch.enableReceive(0);  // Pin 2 interrupt
  strip.begin();
  applyPreset(0);
}

void loop() {
  if (mySwitch.available()) {
    unsigned long code = mySwitch.getReceivedValue();
    mySwitch.resetAvailable();

    switch (code) {
      case RF_BTN_A:
        // Cycle to next preset
        currentPreset = (currentPreset + 1) % NUM_PRESETS;
        applyPreset(currentPreset);
        break;

      case RF_BTN_B:
        // Toggle on/off
        static bool isOn = true;
        isOn = !isOn;
        strip.setBrightness(isOn ? presets[currentPreset].brightness : 0);
        strip.show();
        break;

      case RF_BTN_C:
        // Brightness up
        {
          uint8_t bri = strip.getBrightness();
          strip.setBrightness(min(255, bri + 32));
          strip.show();
        }
        break;

      case RF_BTN_D:
        // Brightness down
        {
          uint8_t bri = strip.getBrightness();
          strip.setBrightness(max(1, bri - 32));
          strip.show();
        }
        break;
    }
  }
}
```

---

## 7. 433 MHz with WLED

WLED does not natively support 433 MHz RF input. Two integration paths exist:

### 7.1 Separate Arduino as RF-to-HTTP Bridge

Use a second Arduino/ESP with the RF receiver to decode button presses and send HTTP requests to WLED:

```
#include <RCSwitch.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>

const char* ssid = "YOUR_WIFI";
const char* password = "YOUR_PASSWORD";
const char* wledIp = "192.168.1.60";

RCSwitch mySwitch = RCSwitch();
WiFiClient wifi;

void sendToWLED(const char* json) {
  HTTPClient http;
  String url = "http://";
  url += wledIp;
  url += "/json/state";
  http.begin(wifi, url);
  http.addHeader("Content-Type", "application/json");
  http.POST(json);
  http.end();
}

void setup() {
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) delay(500);
  mySwitch.enableReceive(D2);  // GPIO4 on NodeMCU
}

void loop() {
  if (mySwitch.available()) {
    unsigned long code = mySwitch.getReceivedValue();
    mySwitch.resetAvailable();

    switch (code) {
      case 1381717: sendToWLED("{\"ps\":1}"); break;  // Preset 1
      case 1381716: sendToWLED("{\"ps\":2}"); break;  // Preset 2
      case 1381719: sendToWLED("{\"bri\":\"~32\"}"); break;  // Bri up
      case 1381718: sendToWLED("{\"bri\":\"~-32\"}"); break; // Bri down
    }
  }
}
```

### 7.2 MQTT Bridge

If you run an MQTT broker (Mosquitto), the RF receiver publishes button events to MQTT, and WLED subscribes:

```
# WLED MQTT config (in WLED web UI -> Config -> Sync Interfaces):
# Broker: 192.168.1.10
# Topic: wled/livingroom

# RF receiver publishes to WLED's MQTT API topic:
mosquitto_pub -t "wled/livingroom/api" -m '{"ps":1}'
```

---

## 8. Debouncing and Repeat Handling

### 8.1 IR Repeat Suppression

IR remotes send repeat codes every 110ms while a button is held. For actions like brightness adjustment, you want repeats. For toggle actions (on/off, preset change), you want to ignore repeats:

```
unsigned long lastCommandTime = 0;
const unsigned long DEBOUNCE_MS = 300;

void handleIR(uint8_t cmd, bool isRepeat) {
  unsigned long now = millis();

  // Allow repeats for brightness
  if (cmd == CMD_BRI_UP || cmd == CMD_BRI_DOWN) {
    // Process every repeat
    adjustBrightness(cmd);
    return;
  }

  // Debounce discrete actions
  if (isRepeat || (now - lastCommandTime < DEBOUNCE_MS)) {
    return;  // Ignore repeat or too-fast press
  }
  lastCommandTime = now;

  // Process the command
  switch (cmd) {
    case CMD_ON:  toggleOn(); break;
    case CMD_OFF: toggleOff(); break;
    // ...
  }
}
```

### 8.2 RF Debouncing

433 MHz modules often receive the same code 2-4 times per button press (the transmitter sends multiple copies for reliability). Add a time-based debounce:

```
unsigned long lastRFTime = 0;
unsigned long lastRFCode = 0;
const unsigned long RF_DEBOUNCE = 500;  // 500ms

void loop() {
  if (mySwitch.available()) {
    unsigned long code = mySwitch.getReceivedValue();
    unsigned long now = millis();
    mySwitch.resetAvailable();

    // Ignore if same code within debounce window
    if (code == lastRFCode && (now - lastRFTime) < RF_DEBOUNCE) {
      return;
    }
    lastRFCode = code;
    lastRFTime = now;

    // Process the code...
  }
}
```

---

## 9. Combining IR and RF

For maximum flexibility, use both IR (for direct line-of-sight control from the couch) and RF (for through-wall control from another room):

```
#include <IRremote.hpp>
#include <RCSwitch.h>
#include <Adafruit_NeoPixel.h>

// Both receivers on the same Arduino
const int IR_PIN = 11;
RCSwitch rfSwitch = RCSwitch();
Adafruit_NeoPixel strip(60, 6, NEO_GRB + NEO_KHZ800);

// Unified command handler
void handleCommand(uint8_t action) {
  switch (action) {
    case 0: /* on */     break;
    case 1: /* off */    break;
    case 2: /* bri+ */   break;
    case 3: /* bri- */   break;
    case 4: /* preset1 */ break;
    // ...
  }
}

void setup() {
  IrReceiver.begin(IR_PIN);
  rfSwitch.enableReceive(0);  // Pin 2 interrupt
  strip.begin();
}

void loop() {
  // Check IR
  if (IrReceiver.decode()) {
    uint8_t cmd = IrReceiver.decodedIRData.command;
    // Map NEC code to unified action
    if (cmd == 0x40) handleCommand(0);       // ON
    else if (cmd == 0x41) handleCommand(1);  // OFF
    else if (cmd == 0x5C) handleCommand(2);  // BRI+
    else if (cmd == 0x5D) handleCommand(3);  // BRI-
    IrReceiver.resume();
  }

  // Check RF
  if (rfSwitch.available()) {
    unsigned long code = rfSwitch.getReceivedValue();
    rfSwitch.resetAvailable();
    // Map RF code to unified action
    if (code == 1381717) handleCommand(0);      // ON
    else if (code == 1381716) handleCommand(1); // OFF
    else if (code == 1381719) handleCommand(2); // BRI+
    else if (code == 1381718) handleCommand(3); // BRI-
  }
}
```

---

## 10. Cross-References

- [WLED Firmware Setup](m5-wled-setup.md) -- WLED's built-in IR remote support and preset system
- [MOSFET-Based PWM Dimmers](m5-mosfet-pwm-dimmers.md) -- the dimmer circuit that remote buttons can control
- [Arduino LED Control & PWM](m2-arduino-led-control.md) -- GPIO, interrupts, and timer fundamentals for IR/RF decoding
- [LED Libraries: NeoPixel, FastLED, WLED](m3-led-libraries.md) -- the strip control libraries used in the code examples
- [diyHue & WLED Integration](m4-diyhue-wled.md) -- alternative control path via Hue app instead of physical remote
- [Glossary](00-glossary.md) -- NEC protocol, ASK modulation, OOK, carrier frequency definitions

---

*Sources: Vishay TSOP38238 datasheet, SB-Projects NEC Protocol reference (sbprojects.net), Ken Shirriff's IRremote library documentation (github.com/Arduino-IRremote), RCSwitch library documentation (github.com/sui77/rc-switch), WLED IR documentation (kno.wledge.me/features/infrared)*
