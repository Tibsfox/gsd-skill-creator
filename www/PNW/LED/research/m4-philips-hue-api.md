# Philips Hue CLIP API

The Philips Hue system is the reference implementation for consumer smart lighting. Understanding its architecture -- from ZigBee radio to REST API -- gives you the vocabulary and patterns that every competing platform imitates. This page covers the Hue bridge hardware, CLIP v1 and v2 APIs, device discovery, and practical curl examples you can run from any terminal.

---

## 1. Hue Bridge Architecture

### 1.1 Hardware Overview

The Hue bridge is a small appliance that connects to your home router via Ethernet. Inside it runs a ZigBee coordinator radio (IEEE 802.15.4 at 2.4 GHz) and an HTTP/HTTPS web server. It acts as the translation layer between your local network and up to 50 ZigBee light devices.

```
                    Internet
                       |
                   [ Router ]
                    /      \
              Ethernet    WiFi
                /            \
         [ Hue Bridge ]    [ Phone / PC ]
          ZigBee Radio       HTTP client
           /   |   \
        Bulb  Bulb  Strip
```

The bridge is the single coordinator in the ZigBee mesh. Bulbs and accessories act as ZigBee routers (mains-powered devices relay traffic) or end devices (battery sensors). Every command from your phone goes: phone -> WiFi -> router -> Ethernet -> bridge -> ZigBee -> bulb.

### 1.2 Network Discovery

Before you can send API commands, your client application must find the bridge on the local network. Two protocols handle this:

**mDNS (Multicast DNS):** The bridge advertises itself as `_hue._tcp.local`. On Linux/macOS, use `avahi-browse -r _hue._tcp` or `dns-sd -B _hue._tcp`. The result gives you the bridge IP address.

**SSDP (UPnP):** The bridge responds to M-SEARCH requests on multicast address 239.255.255.250 port 1900. This is the same mechanism used by media servers and smart TVs.

**Philips Discovery Portal:** A GET to `https://discovery.meethue.com` returns a JSON array of bridges on your network (by external IP matching). This requires internet access but works as a fallback.

```
# mDNS discovery (Linux)
avahi-browse -r _hue._tcp

# SSDP discovery (curl)
curl -s https://discovery.meethue.com
# Returns: [{"id":"001788FFFE123456","internalipaddress":"192.168.1.100"}]
```

### 1.3 Creating an API Username

The bridge uses a press-button authentication model. You cannot interact with the API until you physically press the link button on the bridge and then POST a request within 30 seconds.

```
# Step 1: Press the link button on the bridge hardware

# Step 2: Within 30 seconds, POST to create a username
curl -X POST http://192.168.1.100/api \
  -H "Content-Type: application/json" \
  -d '{"devicetype":"my_app#my_device"}'

# Response:
# [{"success":{"username":"aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789"}}]
```

Save that username string. Every subsequent API call requires it in the URL path. The bridge stores up to 100 usernames. You can list and delete them via the config endpoint.

---

## 2. CLIP v1 REST API

CLIP v1 (Connected Lighting Interface Protocol) is the original HTTP API. It uses unencrypted HTTP on port 80. While Philips has introduced CLIP v2, the v1 API remains functional on all current bridges and is widely documented.

### 2.1 Endpoint Structure

All v1 endpoints follow this pattern:

```
http://<bridge-ip>/api/<username>/<resource>
```

| Resource | Endpoint | Description |
|----------|----------|-------------|
| Lights | `/api/{user}/lights` | All light devices |
| Single light | `/api/{user}/lights/{id}` | One light's full state |
| Light state | `/api/{user}/lights/{id}/state` | Writable state object |
| Groups | `/api/{user}/groups` | Light groups/rooms |
| Scenes | `/api/{user}/scenes` | Saved scene configurations |
| Schedules | `/api/{user}/schedules` | Timed events |
| Sensors | `/api/{user}/sensors` | Motion, light, temp sensors |
| Config | `/api/{user}/config` | Bridge configuration |

### 2.2 Light State Parameters

The `/lights/{id}/state` endpoint accepts PUT requests with these parameters:

| Parameter | Type | Range | Description |
|-----------|------|-------|-------------|
| `on` | boolean | true/false | Light on or off |
| `bri` | integer | 1-254 | Brightness (1 = minimum, 254 = maximum) |
| `hue` | integer | 0-65535 | Hue in the HSB color model (0 and 65535 are both red) |
| `sat` | integer | 0-254 | Saturation (0 = white, 254 = fully saturated color) |
| `xy` | float[2] | [0-1, 0-1] | CIE 1931 chromaticity coordinates |
| `ct` | integer | 153-500 | Color temperature in mirek (reciprocal megakelvin) |
| `alert` | string | "none"/"select"/"lselect" | Flash the light once or repeatedly |
| `effect` | string | "none"/"colorloop" | Cycle through hues continuously |
| `transitiontime` | integer | 0-65535 | Fade duration in 100ms increments (default 4 = 400ms) |

**Mirek to Kelvin conversion:** CCT in Kelvin = 1,000,000 / mirek. So `ct: 153` = 6536K (cool daylight) and `ct: 500` = 2000K (warm candlelight). The typical range is 153 (6500K) to 454 (2200K).

### 2.3 Practical curl Examples

```
# Get all lights
curl http://192.168.1.100/api/YOUR_USERNAME/lights

# Turn light 1 on at full brightness
curl -X PUT http://192.168.1.100/api/YOUR_USERNAME/lights/1/state \
  -d '{"on":true, "bri":254}'

# Set light 2 to warm white (2700K = 370 mirek)
curl -X PUT http://192.168.1.100/api/YOUR_USERNAME/lights/2/state \
  -d '{"on":true, "bri":200, "ct":370}'

# Set light 3 to deep blue via hue/sat
curl -X PUT http://192.168.1.100/api/YOUR_USERNAME/lights/3/state \
  -d '{"on":true, "bri":254, "hue":46920, "sat":254}'

# Set light 4 to red via CIE xy coordinates
curl -X PUT http://192.168.1.100/api/YOUR_USERNAME/lights/4/state \
  -d '{"on":true, "bri":254, "xy":[0.675, 0.322]}'

# Slow 3-second fade to dim warm
curl -X PUT http://192.168.1.100/api/YOUR_USERNAME/lights/1/state \
  -d '{"bri":50, "ct":454, "transitiontime":30}'

# Flash alert (single blink)
curl -X PUT http://192.168.1.100/api/YOUR_USERNAME/lights/1/state \
  -d '{"alert":"select"}'
```

### 2.4 Groups and Scenes

Groups let you control multiple lights with a single API call. The bridge pre-creates groups for each room in the Hue app. Group 0 is a special group containing all lights.

```
# List all groups
curl http://192.168.1.100/api/YOUR_USERNAME/groups

# Set all lights in group 1 to 50% brightness
curl -X PUT http://192.168.1.100/api/YOUR_USERNAME/groups/1/action \
  -d '{"on":true, "bri":127}'

# Recall a scene (apply saved states to all lights in a group)
curl -X PUT http://192.168.1.100/api/YOUR_USERNAME/groups/1/action \
  -d '{"scene":"ABC123def"}'
```

Scenes store per-light state snapshots. When you recall a scene, each light transitions to its stored brightness, color, and temperature independently. This is how the Hue app achieves multi-light ambiences.

---

## 3. CLIP v2 API

CLIP v2 is the modern API introduced with bridge firmware 1948086000 and later. It uses HTTPS (port 443) with a self-signed certificate, follows the RED (RESTful Event-Driven) architecture, and provides real-time event streaming.

### 3.1 Key Differences from v1

| Feature | CLIP v1 | CLIP v2 |
|---------|---------|---------|
| Transport | HTTP (port 80) | HTTPS (port 443) |
| Authentication | Username in URL path | `hue-application-key` header |
| Resource IDs | Integer (1, 2, 3...) | UUID (v2 format) |
| Events | Polling only | Server-Sent Events (SSE) |
| Structure | Flat endpoints | Hierarchical resource model |
| Color model | hue/sat OR xy | xy only (CIE 1931) |

### 3.2 Authentication in v2

CLIP v2 uses the same username string but passes it as an HTTP header instead of a URL path component:

```
# v2 GET request (note: -k flag for self-signed cert)
curl -k -H "hue-application-key: YOUR_USERNAME" \
  https://192.168.1.100/clip/v2/resource/light

# Creating a new application key (v2 method)
curl -k -X POST https://192.168.1.100/api \
  -d '{"devicetype":"my_app#device","generateclientkey":true}'
```

The `generateclientkey` flag returns an additional client key used for the Entertainment API (streaming color data for screen sync and gaming effects).

### 3.3 Resource Model

CLIP v2 organizes everything into typed resources with UUID identifiers:

```
/clip/v2/resource/light          # Individual lights
/clip/v2/resource/scene          # Scenes
/clip/v2/resource/room           # Rooms (replaces groups)
/clip/v2/resource/zone           # Zones (cross-room groupings)
/clip/v2/resource/bridge_home    # The bridge itself
/clip/v2/resource/device         # Physical devices
/clip/v2/resource/motion         # Motion sensors
/clip/v2/resource/temperature    # Temperature sensors
/clip/v2/resource/light_level    # Light level sensors
```

### 3.4 EventStream (Server-Sent Events)

The most significant v2 improvement is real-time event streaming. Instead of polling for state changes, you open a persistent SSE connection:

```
curl -k -N -H "hue-application-key: YOUR_USERNAME" \
  -H "Accept: text/event-stream" \
  https://192.168.1.100/eventstream/clip/v2

# Output is a continuous stream:
# id: 1678901234:0
# data: [{"creationtime":"2025-03-14T10:30:00Z","data":[{
#   "id":"abc-123","type":"light","on":{"on":true},
#   "dimming":{"brightness":80.0}}],"type":"update"}]
```

This enables reactive applications: when someone turns a light on physically, your application is notified within milliseconds. No polling delay, no wasted requests.

### 3.5 Controlling Lights in v2

```
# Get all lights
curl -k -H "hue-application-key: YOUR_USERNAME" \
  https://192.168.1.100/clip/v2/resource/light

# Turn on a specific light (use UUID from GET response)
curl -k -X PUT \
  -H "hue-application-key: YOUR_USERNAME" \
  -H "Content-Type: application/json" \
  https://192.168.1.100/clip/v2/resource/light/UUID_HERE \
  -d '{"on":{"on":true},"dimming":{"brightness":80.0}}'

# Set color temperature (v2 uses mirek in nested object)
curl -k -X PUT \
  -H "hue-application-key: YOUR_USERNAME" \
  -H "Content-Type: application/json" \
  https://192.168.1.100/clip/v2/resource/light/UUID_HERE \
  -d '{"color_temperature":{"mirek":370}}'
```

---

## 4. Sensors

Hue accessories include motion sensors, light-level sensors, and temperature sensors. These are ZigBee end devices that report to the bridge.

### 4.1 Sensor Types

| Sensor | v1 Type | v2 Resource | Range |
|--------|---------|-------------|-------|
| Motion | ZLLPresence | `motion` | presence: true/false |
| Light level | ZLLLightLevel | `light_level` | 0-83,000 lux (logarithmic) |
| Temperature | ZLLTemperature | `temperature` | -40 to +60 C (x100) |

### 4.2 Reading Sensors

```
# v1: Get all sensors
curl http://192.168.1.100/api/YOUR_USERNAME/sensors

# v2: Get light level readings
curl -k -H "hue-application-key: YOUR_USERNAME" \
  https://192.168.1.100/clip/v2/resource/light_level

# Response includes:
# "light":{"light_level":15000,"light_level_valid":true}
# light_level is 10000 * log10(lux) + 1
# So 15000 = 10^((15000-1)/10000) = ~10 lux
```

The logarithmic encoding gives fine resolution in dim conditions (where human perception is most sensitive) and coarse resolution in bright conditions. To convert back to lux: `lux = 10 ^ ((light_level - 1) / 10000)`.

---

## 5. Arduino Integration

For microcontroller projects, you can control Hue lights directly from an Arduino with WiFi capability. The ArduinoHttpClient library handles the HTTP PUT requests.

### 5.1 Compatible Boards

- **Arduino MKR WiFi 1010** -- ATSAMD21 + NINA-W102 WiFi module
- **Arduino MKR1000** -- ATSAMD21 + ATWINC1500 WiFi
- **Arduino Nano 33 IoT** -- ATSAMD21 + NINA-W102 WiFi
- **ESP32** -- built-in WiFi (use HTTPClient library instead)

### 5.2 Arduino Hue Control Sketch

```
#include <WiFiNINA.h>
#include <ArduinoHttpClient.h>

// Network config
const char* ssid = "YOUR_WIFI";
const char* pass = "YOUR_PASSWORD";

// Hue config
const char* bridgeIp = "192.168.1.100";
const int   bridgePort = 80;
const char* hueUser = "YOUR_HUE_USERNAME";
const int   lightId = 1;

WiFiClient wifi;
HttpClient http(wifi, bridgeIp, bridgePort);

void setup() {
  Serial.begin(9600);
  WiFi.begin(ssid, pass);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected to WiFi");
}

void setLightState(int brightness, int ct) {
  String path = "/api/";
  path += hueUser;
  path += "/lights/";
  path += lightId;
  path += "/state";

  String body = "{\"on\":true,\"bri\":";
  body += brightness;
  body += ",\"ct\":";
  body += ct;
  body += "}";

  http.put(path, "application/json", body);
  int status = http.responseStatusCode();
  Serial.print("PUT status: ");
  Serial.println(status);
  http.stop();
}

void loop() {
  // Warm dim in evening
  setLightState(100, 400);  // 2500K
  delay(10000);

  // Cool bright in morning
  setLightState(254, 200);  // 5000K
  delay(10000);
}
```

This pattern -- WiFi connection, HTTP PUT, JSON body -- is the foundation for all microcontroller-to-Hue integration. The [ESP32 LED Control](m2-esp32-led.md) page covers the ESP32-specific HTTPClient variant.

---

## 6. Color Spaces and Conversion

Hue lights accept color in multiple formats. Understanding which to use and how to convert between them avoids the common problem of colors looking wrong.

### 6.1 HSB (Hue, Saturation, Brightness)

The v1 API uses hue (0-65535), sat (0-254), and bri (1-254). The hue value wraps: 0 and 65535 are both red. Key color positions:

| Color | hue value | Degrees |
|-------|-----------|---------|
| Red | 0 | 0 |
| Yellow | 10923 | 60 |
| Green | 21845 | 120 |
| Cyan | 32768 | 180 |
| Blue | 43691 | 240 |
| Magenta | 54613 | 300 |
| Red (wrap) | 65535 | 360 |

Conversion: `degrees = (hue / 65535) * 360`

### 6.2 CIE 1931 xy Chromaticity

Both v1 and v2 accept CIE xy coordinates. This is the most accurate color specification because it maps to the physical color gamut of the bulb. Each Hue bulb model has a different gamut triangle:

| Gamut | Bulbs | Red xy | Green xy | Blue xy |
|-------|-------|--------|----------|---------|
| A | Original Hue | (0.704, 0.296) | (0.214, 0.709) | (0.139, 0.081) |
| B | Hue spots, strips | (0.675, 0.322) | (0.409, 0.518) | (0.167, 0.040) |
| C | Hue 3rd gen+ | (0.692, 0.308) | (0.170, 0.700) | (0.153, 0.048) |

If you send an xy coordinate outside a bulb's gamut, the bridge clamps it to the nearest point on the gamut triangle. This is why the same xy value can look different on different bulb generations.

### 6.3 Mirek / Color Temperature

For white-ambiance and color bulbs in white mode, `ct` (mirek) is the simplest parameter:

```
Kelvin = 1,000,000 / mirek
mirek  = 1,000,000 / Kelvin

Examples:
  ct=153  ->  6536K  (cool daylight)
  ct=200  ->  5000K  (neutral white)
  ct=250  ->  4000K  (cool white)
  ct=333  ->  3003K  (warm fluorescent)
  ct=370  ->  2703K  (warm white - incandescent)
  ct=454  ->  2203K  (warm candlelight)
  ct=500  ->  2000K  (ultra warm)
```

For circadian lighting automation, `ct` is the parameter to control. See [Circadian Rhythm Adaptation](m4-circadian-adaptation.md) for the full automation pipeline.

---

## 7. Error Handling

The Hue bridge returns JSON arrays with either `success` or `error` objects. Common error codes:

| Code | Meaning | Typical Cause |
|------|---------|---------------|
| 1 | Unauthorized user | Invalid or deleted username |
| 3 | Resource not available | Wrong light/group ID |
| 4 | Method not available | Using GET on a state endpoint |
| 6 | Parameter not available | Typo in parameter name |
| 7 | Invalid value | Out-of-range value for parameter |
| 101 | Link button not pressed | Creating username without physical press |
| 201 | Parameter not modifiable | Read-only attribute |
| 901 | Internal error | Bridge firmware issue |

```
# Error response example:
[{"error":{"type":7,"address":"/lights/1/state/bri",
  "description":"invalid value, 300, for parameter, bri"}}]
```

Always check the response body for error objects. A 200 HTTP status does not guarantee success -- the bridge can return 200 with an error JSON payload.

---

## 8. Rate Limits and Best Practices

The Hue bridge has limited processing power. Respect these limits to avoid dropped commands:

- **Individual light commands:** max 10 per second per light
- **Group commands:** max 1 per second (the bridge fans out to all lights in the group)
- **Total bridge throughput:** approximately 30 commands per second across all lights
- **Scene recall:** treat as a group command (1/sec max)
- **Polling interval:** if you must poll (v1), limit to 1 request per second

For smooth animations, use `transitiontime` rather than rapid individual commands. A single PUT with `{"bri":254, "transitiontime":20}` creates a 2-second fade using the bulb's internal firmware -- far smoother than 20 rapid brightness steps from your code.

---

## 9. Cross-References

- [diyHue & WLED Integration](m4-diyhue-wled.md) -- run your own Hue bridge in software, no Philips hardware needed
- [TCS34725 Color & Ambient Sensing](m4-tcs34725-sensing.md) -- measure ambient light color to feed back into Hue automation
- [Circadian Rhythm Adaptation](m4-circadian-adaptation.md) -- use the `ct` parameter to automate healthy lighting schedules
- [ESP32 LED Control](m2-esp32-led.md) -- ESP32 WiFi makes an excellent Hue API client
- [WLED Firmware Setup](m5-wled-setup.md) -- WLED can also control lights via its own JSON API
- [Glossary](00-glossary.md) -- definitions of mirek, CIE 1931, ZigBee, CLIP, and other terms

---

*Sources: Philips Hue Developer Documentation (developers.meethue.com), Hue CLIP v2 API Reference, ArduinoHttpClient library documentation, CIE 1931 Color Space specification (ISO 11664-1)*
