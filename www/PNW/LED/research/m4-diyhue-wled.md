# diyHue & WLED Integration

You do not need a Philips Hue bridge to use the Hue ecosystem. The diyHue project emulates a complete Hue bridge in software, letting you register ESP8266/ESP32 devices running custom firmware -- including WLED -- as Hue-compatible lights. This page covers the full architecture, setup, and integration path.

---

## 1. diyHue Architecture

### 1.1 What diyHue Does

diyHue (diyhue.org) is an open-source Python application that emulates the Philips Hue bridge HTTP API. The Hue mobile app, Alexa, Google Home, and any CLIP v1-compatible client cannot distinguish diyHue from a real bridge. It runs on a Raspberry Pi, any Linux server, or in a Docker container.

```
  [ Hue App ]        [ Alexa ]        [ Home Assistant ]
       |                 |                    |
       +--------+--------+--------------------+
                |
           HTTP / HTTPS
                |
         [ diyHue Server ]
          (emulated bridge)
           /      |      \
     Zigbee2MQTT  WLED   Custom ESP
      (via MQTT)  (HTTP)  (firmware)
       /    \       |
   ZigBee   ZigBee  WS2812B
   bulbs    sensors  strips
```

### 1.2 Supported Light Types

diyHue supports multiple backend protocols to control real hardware:

| Backend | Protocol | Hardware | Features |
|---------|----------|----------|----------|
| Native ESP | Custom HTTP | ESP8266/ESP32 | Full Hue emulation firmware |
| WLED | HTTP REST API | ESP8266/ESP32 + addressable strips | Segments, effects, presets |
| Zigbee2MQTT | MQTT | Any ZigBee light via CC2531/CC2652 dongle | Real ZigBee bulbs |
| Tasmota | HTTP | ESP8266/ESP32 + relays/dimmers | Switch and dimmer control |
| ESPHome | HTTP | ESP8266/ESP32 | Home Assistant ecosystem |
| Hyperion | HTTP | Ambilight/screen capture | Ambient TV backlighting |

### 1.3 System Requirements

- Raspberry Pi 3B+ or newer (or any Linux x86/x64 machine)
- Python 3.8+ (native install) or Docker
- Static IP address on the local network
- For ZigBee: CC2652 or CC2531 USB coordinator dongle

---

## 2. Installation

### 2.1 Docker Installation (Recommended)

Docker is the cleanest installation method. The diyHue container includes all dependencies.

```
# Pull the latest diyHue image
docker pull diyhue/core:latest

# Run with host networking (required for UPnP discovery)
docker run -d \
  --name diyHue \
  --network host \
  --restart always \
  -v /opt/diyhue/config:/opt/hue-emulator/config \
  -e MAC=AA:BB:CC:DD:EE:FF \
  -e IP=192.168.1.50 \
  diyhue/core:latest
```

The `MAC` and `IP` environment variables must match your host machine. The Hue app uses these for bridge identification. The config volume persists light definitions and scenes across container restarts.

### 2.2 Native Installation

```
# Debian/Ubuntu/Raspberry Pi OS
sudo apt update
sudo apt install -y python3 python3-pip python3-setuptools git

# Clone diyHue
git clone https://github.com/diyhue/diyHue.git /opt/diyHue
cd /opt/diyHue

# Install Python dependencies
pip3 install -r requirements.txt

# Run (foreground for initial testing)
sudo python3 BridgeEmulator/HueEmulator3.py \
  --ip 192.168.1.50 --mac AA:BB:CC:DD:EE:FF
```

### 2.3 First Pairing with Hue App

1. Open the Philips Hue app on your phone
2. Tap "Settings" -> "Hue Bridges" -> "Search"
3. The app discovers diyHue via SSDP/UPnP on the local network
4. When prompted, navigate to `http://192.168.1.50/` in a browser and click the virtual link button within 30 seconds
5. The app pairs with diyHue as if it were a real bridge

Once paired, diyHue appears in the Hue app as a standard bridge. All rooms, scenes, and automations work identically.

---

## 3. Registering ESP Lights

### 3.1 Native diyHue ESP Firmware

diyHue provides custom firmware for ESP8266 and ESP32 boards that makes them appear as real Hue lights. The firmware handles:

- HTTP endpoints matching the Hue light state API
- Color space conversion (HSB, xy, ct)
- Smooth transition animations on the ESP itself
- Auto-registration with the diyHue bridge

```
# Flash native diyHue firmware to ESP8266
# 1. Open Arduino IDE
# 2. Install ESP8266 board support
# 3. Clone https://github.com/diyhue/Lights
# 4. Open the sketch for your LED type (WS2812B, analog RGB, etc.)
# 5. Set WiFi credentials and diyHue bridge IP
# 6. Flash to ESP8266

// Key config in the firmware sketch:
const char* bridgeIp = "192.168.1.50";
const char* lightName = "Workshop Strip";
const int   lightType = 3;  // 1=Dimmable, 2=CT, 3=Extended Color
const int   pixelCount = 60;
```

After flashing, the ESP announces itself to diyHue over HTTP. The bridge auto-registers it, and the light appears in the Hue app within seconds.

### 3.2 WLED as a Hue Light

WLED's built-in Hue sync feature allows diyHue to discover and control WLED devices. This is the easiest path because WLED is already a mature firmware with hundreds of effects.

**Step 1: Flash WLED to your ESP** (see [WLED Firmware Setup](m5-wled-setup.md) for complete instructions)

**Step 2: Enable Hue sync in WLED**

1. Open WLED web UI (`http://<wled-ip>`)
2. Go to Config -> Sync Interfaces
3. Under "Hue," enter the diyHue IP address
4. Set the poll interval to 2000ms (2 seconds)
5. Enable "Receive On/Off" and "Receive Brightness"

**Step 3: Register WLED in diyHue**

In the diyHue web UI (`http://192.168.1.50`), navigate to "Lights" -> "Add Light" and enter the WLED device IP. diyHue queries the WLED JSON API and creates a virtual Hue light entry.

```
# diyHue discovers WLED via its JSON API:
# GET http://<wled-ip>/json/info
# Response includes: "ver", "leds":{"count":60,"rgbw":false}
#
# diyHue then uses:
# POST http://<wled-ip>/json/state
# Body: {"on":true,"bri":128,"seg":[{"col":[[255,180,100]]}]}
```

### 3.3 Multiple WLED Segments as Separate Hue Lights

WLED supports segments -- independent sections of the same LED strip. diyHue can register each segment as a separate Hue light, giving you per-zone control from the Hue app.

```
# WLED strip with 150 LEDs split into 3 segments:
# Segment 0: LEDs 0-49   -> "Kitchen Counter Left"
# Segment 1: LEDs 50-99  -> "Kitchen Counter Center"
# Segment 2: LEDs 100-149 -> "Kitchen Counter Right"

# Control segment 1 via WLED JSON API:
curl -X POST http://192.168.1.60/json/state \
  -H "Content-Type: application/json" \
  -d '{"seg":[{"id":1,"on":true,"bri":200,"col":[[255,200,150]]}]}'
```

---

## 4. Zigbee2MQTT Integration

For controlling real ZigBee bulbs (IKEA TRADFRI, Innr, OSRAM, etc.) without a Philips bridge, diyHue connects through Zigbee2MQTT.

### 4.1 Architecture

```
  ZigBee Devices            USB Dongle          Software Stack
  +--------------+     +----------------+     +----------------+
  | IKEA Bulb    |<--->|                |     |                |
  | OSRAM Strip  |<--->| CC2652P        |<--->| Zigbee2MQTT    |
  | Aqara Sensor |<--->| Coordinator    |     | (Node.js)      |
  +--------------+     +----------------+     +-------+--------+
                                                      |
                                                  MQTT Broker
                                                  (Mosquitto)
                                                      |
                                              +-------+--------+
                                              |    diyHue       |
                                              | (Bridge Emu)    |
                                              +----------------+
```

### 4.2 Setup Steps

```
# 1. Install Mosquitto MQTT broker
sudo apt install -y mosquitto mosquitto-clients

# 2. Install Zigbee2MQTT (follow zigbee2mqtt.io instructions)
# 3. Pair ZigBee devices by enabling permit_join
# 4. Configure diyHue to connect to MQTT:

# In diyHue config, set MQTT broker address:
# mqtt_host: "localhost"
# mqtt_port: 1883
```

Zigbee2MQTT publishes device state to MQTT topics like `zigbee2mqtt/kitchen_bulb`. diyHue subscribes to these topics and maps each device to a virtual Hue light.

---

## 5. Entertainment API

The Hue Entertainment API provides low-latency UDP streaming for synchronized light shows, screen color matching, and gaming integration. diyHue supports this protocol.

### 5.1 How It Works

Normal Hue API commands use HTTP with ~100ms round-trip latency. The Entertainment API opens a DTLS (encrypted UDP) channel and streams raw color data at up to 25 updates per second with <50ms latency.

```
  Application                 diyHue Bridge              Lights
      |                           |                        |
      |-- DTLS handshake -------->|                        |
      |<- handshake complete -----|                        |
      |                           |                        |
      |-- [R,G,B] x N lights --->|-- ZigBee/HTTP -------->|
      |-- [R,G,B] x N lights --->|-- ZigBee/HTTP -------->|
      |-- [R,G,B] x N lights --->|-- ZigBee/HTTP -------->|
      |   (25 fps stream)        |                        |
```

### 5.2 Entertainment Zone Setup

1. Create an Entertainment zone in the Hue app (or via API)
2. Assign lights and set their physical positions (relative to the screen)
3. Enable streaming mode via PUT to the group resource
4. Open DTLS connection and begin sending color frames

```
# Enable streaming mode for entertainment group 200
curl -X PUT http://192.168.1.50/api/YOUR_USERNAME/groups/200 \
  -d '{"stream":{"active":true}}'

# The Entertainment API client then connects via DTLS:
# Port 2100, using the clientkey from initial pairing
# Each frame: [protocol_header][light_id][R16][G16][B16]...
```

### 5.3 Screen Sync Applications

These applications capture screen colors and stream them to Hue/diyHue lights:

- **Hue Sync** (official Philips app, Windows/Mac)
- **HueSync-CLI** (open source, Linux)
- **Hyperion** (open source, Raspberry Pi + capture card)
- **Prismatik** (open source, Windows/Linux/Mac)

For a DIY screen sync setup, Hyperion captures HDMI input via a USB capture device, computes average color per screen region, and sends it to diyHue via the Entertainment API.

---

## 6. Home Assistant Integration

diyHue integrates with Home Assistant in two ways: as a Hue bridge (HA discovers it automatically) and as individual WLED/Zigbee devices.

### 6.1 Hue Integration (Automatic)

Home Assistant's built-in Hue integration discovers diyHue via SSDP. Add it through Configuration -> Integrations -> "Philips Hue". HA treats it exactly like a real Hue bridge.

### 6.2 WLED Integration (Direct)

HA also has a native WLED integration that provides richer control than the Hue abstraction:

- Per-segment control
- All 100+ WLED effects
- Effect speed and intensity sliders
- Preset activation
- OTA update notifications

For maximum flexibility, register WLED devices in both diyHue (for Hue app compatibility) and directly in Home Assistant (for full WLED features).

---

## 7. Custom ESP Light Firmware

For advanced users, writing custom ESP firmware that speaks the Hue light protocol directly gives full control over hardware behavior.

### 7.1 Minimal Hue Light on ESP8266

```
#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <Adafruit_NeoPixel.h>

const char* ssid = "YOUR_WIFI";
const char* password = "YOUR_PASSWORD";

ESP8266WebServer server(80);
Adafruit_NeoPixel strip(60, D2, NEO_GRB + NEO_KHZ800);

bool lightOn = true;
uint8_t brightness = 254;
uint8_t r = 255, g = 200, b = 150;

void handleState() {
  if (server.method() == HTTP_PUT) {
    String body = server.arg("plain");
    // Parse JSON and update r, g, b, brightness, lightOn
    // (Use ArduinoJson library for robust parsing)
    applyState();
    server.send(200, "application/json", "[{\"success\":{}}]");
  } else {
    String json = "{\"on\":{\"value\":" + String(lightOn ? "true":"false") +
                  "},\"bri\":{\"value\":" + String(brightness) + "}}";
    server.send(200, "application/json", json);
  }
}

void applyState() {
  if (!lightOn) {
    strip.clear();
  } else {
    float dim = brightness / 254.0;
    for (int i = 0; i < strip.numPixels(); i++) {
      strip.setPixelColor(i,
        (uint8_t)(r * dim),
        (uint8_t)(g * dim),
        (uint8_t)(b * dim));
    }
  }
  strip.show();
}

void setup() {
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) delay(500);

  strip.begin();
  strip.setBrightness(255);
  applyState();

  server.on("/state", handleState);
  server.on("/detect", [](){
    server.send(200, "application/json",
      "{\"hue\":\"bulb\",\"lights\":1,\"modelid\":\"LCT015\","
      "\"mac\":\"AA:BB:CC:DD:EE:FF\"}");
  });
  server.begin();
}

void loop() {
  server.handleClient();
}
```

The `/detect` endpoint is what diyHue queries during auto-discovery. The `modelid` tells diyHue which Hue bulb to emulate (LCT015 = Extended Color Light).

> **SAFETY WARNING:** When connecting ESP boards to LED strips, ensure the power supply voltage matches the strip specification (5V for WS2812B, 12V for many analog strips). Never power a 5V strip from a 12V supply. Always add a 1000uF electrolytic capacitor across the power input to absorb voltage spikes, and observe correct polarity.

---

## 8. Troubleshooting

### 8.1 Common Issues

| Problem | Cause | Fix |
|---------|-------|-----|
| Hue app cannot find bridge | SSDP blocked by router | Use host networking in Docker, check AP isolation |
| Lights unresponsive | ESP WiFi disconnected | Check DHCP lease, assign static IP |
| Colors look wrong | Gamut mismatch | Set correct `modelid` in ESP firmware |
| Entertainment laggy | TCP instead of UDP | Ensure DTLS port 2100 is not firewalled |
| WLED segments not separate | diyHue version too old | Update to latest diyHue release |

### 8.2 Useful Debug Commands

```
# Check diyHue is responding
curl http://192.168.1.50/api/config

# List all registered lights
curl http://192.168.1.50/api/YOUR_USERNAME/lights

# Test WLED connectivity
curl http://192.168.1.60/json/info

# Check Zigbee2MQTT MQTT messages
mosquitto_sub -t "zigbee2mqtt/#" -v
```

---

## 9. Cross-References

- [Philips Hue CLIP API](m4-philips-hue-api.md) -- the API that diyHue emulates, reference for all endpoints
- [WLED Firmware Setup](m5-wled-setup.md) -- complete guide to flashing and configuring WLED on ESP boards
- [TCS34725 Color & Ambient Sensing](m4-tcs34725-sensing.md) -- add ambient light sensing to your diyHue setup
- [ESP32 LED Control](m2-esp32-led.md) -- ESP32 as both WLED host and custom Hue light
- [WS2812B NZR Protocol](m3-ws2812b-protocol.md) -- the LED protocol WLED drives natively
- [Glossary](00-glossary.md) -- ZigBee, MQTT, SSDP, CLIP, Entertainment API definitions

---

*Sources: diyHue project documentation (diyhue.org), WLED project documentation (kno.wledge.me), Zigbee2MQTT documentation (zigbee2mqtt.io), Philips Hue Developer API, Mosquitto MQTT documentation*
