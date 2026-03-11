# ESP32 LED Control

The ESP32 combines a powerful dual-core processor, WiFi, Bluetooth, and a dedicated LED PWM peripheral (LEDC) in a single low-cost chip. This makes it the dominant platform for WiFi-connected LED projects, smart lighting, and addressable LED installations. It is also the hardware platform for [WLED](m5-wled-setup.md), the most popular open-source LED firmware.

---

## ESP32 LED-Relevant Features

| Feature | Specification | LED Relevance |
|---------|--------------|---------------|
| CPU | Dual-core Xtensa LX6, 240 MHz | Fast LED calculations, web server |
| SRAM | 520 KB | ~1700 WS2812B LEDs in RAM |
| Flash | 4-16 MB | OTA updates, web assets |
| WiFi | 802.11 b/g/n | Remote control, WLED, MQTT |
| Bluetooth | BLE 4.2 | Phone control apps |
| LEDC | 16 channels, 1-40 MHz | Hardware PWM for LED dimming |
| RMT | 8 channels | WS2812B timing (no CPU blocking) |
| DAC | 2 channels, 8-bit | Analog LED dimming |
| ADC | 18 channels, 12-bit | Light sensors, potentiometers |
| GPIO | 34 pins | Ample for LED projects |
| Deep Sleep | 10 uA | Battery-powered LED projects |

---

## LEDC Peripheral: Hardware PWM

The ESP32's LEDC (LED Control) peripheral provides 16 independent PWM channels with hardware-driven duty cycle -- no CPU involvement after configuration.

### LEDC Architecture

```
                     ESP32 LEDC Block
  +--------------------------------------------------+
  |  Timer 0 ----+---> Channel 0 ---> GPIO           |
  |              +---> Channel 1 ---> GPIO           |
  |                                                   |
  |  Timer 1 ----+---> Channel 2 ---> GPIO           |
  |              +---> Channel 3 ---> GPIO           |
  |                                                   |
  |  Timer 2 ----+---> Channel 4 ---> GPIO           |
  |              +---> Channel 5 ---> GPIO           |
  |                                                   |
  |  Timer 3 ----+---> Channel 6 ---> GPIO           |
  |              +---> Channel 7 ---> GPIO           |
  |                                                   |
  |  (High-speed group: channels 0-7)                |
  |  (Low-speed group: channels 8-15, same layout)   |
  +--------------------------------------------------+

  Each timer: configurable frequency + resolution
  Multiple channels can share a timer (same frequency)
  Each channel: independent duty cycle
```

### Resolution vs Frequency

The LEDC uses an 80 MHz APB clock. Resolution and frequency are inversely related:

```
Max frequency = 80,000,000 / 2^resolution

| Resolution | Max Frequency | Duty Steps |
|-----------|---------------|------------|
| 1 bit    | 40 MHz        | 2          |
| 8 bit    | 312.5 kHz     | 256        |
| 10 bit   | 78.125 kHz    | 1,024      |
| 12 bit   | 19.531 kHz    | 4,096      |
| 13 bit   | 9.766 kHz     | 8,192      |
| 16 bit   | 1.22 kHz      | 65,536     |
| 20 bit   | 76.3 Hz       | 1,048,576  |
```

For LED dimming, **13-bit resolution at ~10 kHz** is an excellent choice: inaudible frequency, 8192 brightness steps, and smooth gamma-corrected fading.

---

## Arduino Framework: LEDC API

Using the ESP32 Arduino core:

```cpp
#include <Arduino.h>

#define LED_PIN     2     // Built-in LED on many ESP32 boards
#define LEDC_CHANNEL 0
#define LEDC_FREQ   5000  // 5 kHz
#define LEDC_BITS   13    // 13-bit resolution (0-8191)

void setup() {
  // Configure LEDC channel
  ledcSetup(LEDC_CHANNEL, LEDC_FREQ, LEDC_BITS);

  // Attach channel to GPIO pin
  ledcAttachPin(LED_PIN, LEDC_CHANNEL);
}

void loop() {
  // Fade up
  for (int duty = 0; duty <= 8191; duty += 10) {
    ledcWrite(LEDC_CHANNEL, duty);
    delay(1);
  }
  // Fade down
  for (int duty = 8191; duty >= 0; duty -= 10) {
    ledcWrite(LEDC_CHANNEL, duty);
    delay(1);
  }
}
```

### RGB LED with Three LEDC Channels

```cpp
#define RED_PIN    25
#define GREEN_PIN  26
#define BLUE_PIN   27

#define RED_CH     0
#define GREEN_CH   1
#define BLUE_CH    2

#define PWM_FREQ   5000
#define PWM_BITS   8

// Gamma correction table (gamma = 2.2, 8-bit)
const uint8_t gamma8[256] = {
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1,  1,  1,  1,
    1,  1,  1,  1,  1,  1,  1,  1,  1,  2,  2,  2,  2,  2,  2,  2,
    2,  3,  3,  3,  3,  3,  3,  3,  4,  4,  4,  4,  4,  5,  5,  5,
    5,  6,  6,  6,  6,  7,  7,  7,  7,  8,  8,  8,  9,  9,  9, 10,
   10, 10, 11, 11, 11, 12, 12, 13, 13, 13, 14, 14, 15, 15, 16, 16,
   17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22, 23, 24, 24, 25,
   25, 26, 27, 27, 28, 29, 29, 30, 31, 32, 32, 33, 34, 35, 35, 36,
   37, 38, 39, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 50,
   51, 52, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 66, 67, 68,
   69, 70, 72, 73, 74, 75, 77, 78, 79, 81, 82, 83, 85, 86, 87, 89,
   90, 92, 93, 95, 96, 98, 99,101,102,104,105,107,109,110,112,114,
  115,117,119,120,122,124,126,127,129,131,133,135,137,138,140,142,
  144,146,148,150,152,154,156,158,160,162,164,167,169,171,173,175,
  177,180,182,184,186,189,191,193,196,198,200,203,205,208,210,213,
  215,218,220,223,225,228,231,233,236,239,241,244,247,249,252,255
};

void setup() {
  ledcSetup(RED_CH, PWM_FREQ, PWM_BITS);
  ledcSetup(GREEN_CH, PWM_FREQ, PWM_BITS);
  ledcSetup(BLUE_CH, PWM_FREQ, PWM_BITS);

  ledcAttachPin(RED_PIN, RED_CH);
  ledcAttachPin(GREEN_PIN, GREEN_CH);
  ledcAttachPin(BLUE_PIN, BLUE_CH);
}

void setColor(uint8_t r, uint8_t g, uint8_t b) {
  ledcWrite(RED_CH,   gamma8[r]);
  ledcWrite(GREEN_CH, gamma8[g]);
  ledcWrite(BLUE_CH,  gamma8[b]);
}

void loop() {
  setColor(255, 0, 0);     // Red
  delay(1000);
  setColor(0, 255, 0);     // Green
  delay(1000);
  setColor(0, 0, 255);     // Blue
  delay(1000);
  setColor(255, 200, 50);  // Warm white
  delay(1000);
}
```

---

## WiFi Web Server LED Controller

The ESP32's killer feature -- a web-based LED controller with no additional hardware:

```cpp
#include <WiFi.h>
#include <WebServer.h>

const char* ssid = "YourWiFi";
const char* password = "YourPassword";

WebServer server(80);

#define LED_PIN 2
#define LEDC_CH 0

void setup() {
  Serial.begin(115200);

  ledcSetup(LEDC_CH, 5000, 8);
  ledcAttachPin(LED_PIN, LEDC_CH);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(WiFi.localIP());

  server.on("/", []() {
    server.send(200, "text/html",
      "<html><body style='font-family:sans-serif;text-align:center;padding:2em;'>"
      "<h1>ESP32 LED Dimmer</h1>"
      "<input type='range' min='0' max='255' value='0' id='s' "
      "oninput=\"fetch('/b?v='+this.value)\">"
      "<p>Brightness: <span id='v'>0</span></p>"
      "<script>document.getElementById('s').oninput=function(){"
      "document.getElementById('v').textContent=this.value;"
      "fetch('/b?v='+this.value);}</script>"
      "</body></html>");
  });

  server.on("/b", []() {
    int val = server.arg("v").toInt();
    val = constrain(val, 0, 255);
    ledcWrite(LEDC_CH, val);
    server.send(200, "text/plain", String(val));
  });

  server.begin();
}

void loop() {
  server.handleClient();
}
```

This creates a responsive slider control accessible from any device on the WiFi network.

---

## RMT: WS2812B Without Blocking

The ESP32's RMT (Remote Control Transceiver) peripheral can generate the precise timing needed for WS2812B LEDs without blocking the CPU:

```cpp
#include <FastLED.h>

#define NUM_LEDS 300
#define DATA_PIN 5

CRGB leds[NUM_LEDS];

void setup() {
  // FastLED automatically uses RMT on ESP32
  FastLED.addLeds<WS2812B, DATA_PIN, GRB>(leds, NUM_LEDS);
  FastLED.setBrightness(50);
}

void loop() {
  // Fire effect
  for (int i = 0; i < NUM_LEDS; i++) {
    leds[i] = CHSV(random(0, 40), 255, random(100, 255));
  }
  FastLED.show();
  delay(30);
}
```

The RMT peripheral handles the nanosecond-precise WS2812B timing in hardware, freeing both CPU cores for WiFi, web serving, and animation calculations. This is a massive advantage over [Arduino](m2-arduino-led-control.md), where `strip.show()` disables interrupts and blocks the CPU.

---

## Deep Sleep with LED Wake

For battery-powered LED projects, the ESP32 can enter deep sleep (10 uA) and wake to flash LEDs:

```cpp
#include <Arduino.h>

#define LED_PIN 2
#define BUTTON_PIN 33  // RTC GPIO for wake-up
#define LEDC_CH 0

RTC_DATA_ATTR int bootCount = 0;

void setup() {
  bootCount++;

  ledcSetup(LEDC_CH, 5000, 8);
  ledcAttachPin(LED_PIN, LEDC_CH);

  // Flash LED to indicate wake-up
  for (int i = 0; i < 3; i++) {
    ledcWrite(LEDC_CH, 200);
    delay(200);
    ledcWrite(LEDC_CH, 0);
    delay(200);
  }

  // Configure wake-up source
  esp_sleep_enable_ext0_wakeup(GPIO_NUM_33, LOW);  // Wake on button press
  esp_sleep_enable_timer_wakeup(3600000000ULL);     // Or wake every hour

  // Enter deep sleep
  esp_deep_sleep_start();
}

void loop() {
  // Never reached in deep sleep mode
}
```

---

## ESP32 vs ESP8266

| Feature | ESP32 | ESP8266 |
|---------|-------|---------|
| CPU | Dual-core 240 MHz | Single-core 80-160 MHz |
| SRAM | 520 KB | 80 KB |
| GPIO | 34 | 17 (limited) |
| LEDC channels | 16 | 0 (software PWM only) |
| RMT channels | 8 | 0 |
| ADC | 18 ch, 12-bit | 1 ch, 10-bit |
| Bluetooth | BLE 4.2 | No |
| Deep sleep | 10 uA | 20 uA |
| Price | $3-8 | $2-4 |
| WLED support | Full (recommended) | Limited (legacy) |

For new LED projects, always choose ESP32. The ESP8266 is only relevant for existing WLED installations.

---

## Recommended ESP32 Boards for LED Projects

| Board | Price | LED-Relevant Features |
|-------|-------|----------------------|
| ESP32-DevKitC | $4-8 | 38 pins, USB-serial, basic |
| ESP32-WROOM-32 | $3-5 | Module for PCB integration |
| ESP32-S3 | $5-10 | USB-OTG, more GPIO, RGB LED onboard |
| QuinLED-ESP32 | $12-20 | Purpose-built for LED control (level shifters, screw terminals) |
| WT32-ETH01 | $8-12 | Ethernet + WiFi (commercial installs) |

The **QuinLED-ESP32** boards are specifically designed for LED projects with built-in level shifters, proper power filtering, and screw terminals for LED strip connections. For [WLED](m5-wled-setup.md) installations, they are the recommended hardware.

> **SAFETY WARNING:** ESP32 GPIO pins output 3.3V. Most WS2812B strips require logic HIGH above 3.5V (0.7 x VDD at 5V). Use a 74HCT125 level shifter or a 3.3V-to-5V buffer between the ESP32 and the LED strip data line. See [WS2812B Protocol](m3-ws2812b-protocol.md) for the logic level problem and solutions.

---

## MQTT Integration

For integration with Home Assistant or other IoT platforms:

```cpp
#include <WiFi.h>
#include <PubSubClient.h>

WiFiClient espClient;
PubSubClient mqtt(espClient);

#define LED_PIN 2
#define LEDC_CH 0

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String msg;
  for (int i = 0; i < length; i++) msg += (char)payload[i];

  if (String(topic) == "led/brightness") {
    int val = msg.toInt();
    ledcWrite(LEDC_CH, constrain(val, 0, 255));
  }
}

void setup() {
  WiFi.begin("SSID", "PASS");
  while (WiFi.status() != WL_CONNECTED) delay(500);

  ledcSetup(LEDC_CH, 5000, 8);
  ledcAttachPin(LED_PIN, LEDC_CH);

  mqtt.setServer("192.168.1.100", 1883);
  mqtt.setCallback(mqttCallback);
}

void loop() {
  if (!mqtt.connected()) {
    mqtt.connect("esp32-led");
    mqtt.subscribe("led/brightness");
  }
  mqtt.loop();
}
```

---

## Cross-References

- [MCU Comparison](m2-mcu-comparison.md) -- ESP32 vs Arduino vs RP2040 vs PIC vs Pi
- [WS2812B Protocol](m3-ws2812b-protocol.md) -- Protocol details and 3.3V logic level issue
- [WLED Setup](m5-wled-setup.md) -- Complete firmware solution built on ESP32
- [RP2040 PIO](m2-rp2040-pio.md) -- Alternative with PIO state machines for LED protocols
- [LED Libraries](m3-led-libraries.md) -- FastLED and NeoPixel on ESP32
- [Thermal Management](m1-thermal-management.md) -- ESP32 operating temperature considerations

---

*Sources: Espressif ESP32 Technical Reference Manual, ESP-IDF LEDC documentation, ESP32 Arduino Core documentation, QuinLED project (quinled.info), Aircoookie WLED documentation, FastLED ESP32 support notes.*
