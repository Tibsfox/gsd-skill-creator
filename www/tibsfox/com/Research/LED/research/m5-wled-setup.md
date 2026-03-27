# WLED Firmware Setup & BOM

WLED is an open-source firmware for ESP8266 and ESP32 that turns a $3 microcontroller into a full-featured LED strip controller with over 100 effects, a web UI, JSON API, MQTT, DMX/Art-Net, segment control, presets, and Home Assistant auto-discovery. This page is a complete setup guide from bill of materials through first animation.

---

## 1. What WLED Provides

### 1.1 Feature Summary

| Feature | Description |
|---------|-------------|
| Web UI | Browser-based control panel with color picker, effects, segments |
| 100+ effects | Fire, rainbow, chase, twinkle, breathing, police, gradient, and more |
| Segments | Divide one strip into independent sections with different effects |
| Presets | Save and recall complete state configurations (16 slots, expandable) |
| JSON API | RESTful HTTP API for programmatic control |
| WebSocket | Real-time bidirectional communication |
| MQTT | Publish/subscribe integration for home automation |
| DMX / Art-Net / sACN | Professional lighting protocol support |
| IR remote | Map infrared remote buttons to actions |
| Home Assistant | Auto-discovery via mDNS, native HA integration |
| OTA updates | Flash new firmware over WiFi |
| Alexa / Google | Voice control integration |
| Multi-strip | ESP32: up to 9 parallel outputs on different GPIO pins |
| Sync | Multiple WLED units synchronize effects via UDP |

### 1.2 Supported LED Types

| LED Type | Protocol | Wires | Voltage | WLED Setting |
|----------|----------|-------|---------|-------------|
| WS2812B | Single-wire NZR | 3 (5V, Data, GND) | 5V | WS281x |
| WS2811 | Single-wire NZR | 3 | 12V | WS281x |
| SK6812 | Single-wire NZR | 4 (RGBW) | 5V | SK6812 RGBW |
| APA102 / SK9822 | SPI (Data + Clock) | 4 (5V, Data, Clock, GND) | 5V | APA102 |
| WS2801 | SPI | 4 | 5V | WS2801 |
| TM1814 | Single-wire | 4 (RGBW) | 12V | TM1814 |

See [WS2812B NZR Protocol](m3-ws2812b-protocol.md) and [APA102 SPI Protocol](m3-apa102-spi.md) for the underlying signal specifications.

---

## 2. Bill of Materials

### 2.1 Minimal Setup ($12-15)

| Component | Specification | Price | Source |
|-----------|--------------|-------|--------|
| ESP8266 NodeMCU | CH340 USB, 4MB flash | $3 | AliExpress, Amazon |
| WS2812B LED strip | 5V, 60 LED/m, 1 meter | $4 | AliExpress |
| 5V 2A USB charger | Micro-USB or USB-C | $3 | Any phone charger |
| Dupont jumper wires | 3x male-female | $0.50 | Any electronics kit |
| Resistor | 330 ohm, 1/4W | $0.05 | Any supplier |
| USB data cable | Micro-USB (not charge-only!) | $2 | Verify data pins present |

### 2.2 Recommended Setup ($25-35)

| Component | Specification | Price | Notes |
|-----------|--------------|-------|-------|
| ESP32 DevKit | CH340 or CP2102, 4MB+ flash | $6 | More GPIO, multi-strip |
| WS2812B LED strip | 5V, 60 LED/m, 5 meters (300 LEDs) | $12 | IP30 (indoor) or IP65 (silicone) |
| 5V 10A power supply | Mean Well or equivalent SMPS | $8 | Powers 300 LEDs at ~40% avg |
| Electrolytic capacitor | 1000 uF, 10V | $0.30 | Across strip power input |
| Resistor | 300-500 ohm, 1/4W | $0.05 | On data line, near ESP |
| DC barrel jack | 5.5x2.1mm, panel mount | $0.50 | Clean power connection |
| Level shifter (optional) | SN74AHCT125 or 74HCT245 | $1 | 3.3V to 5V data signal |

> **SAFETY WARNING:** The 5V 10A power supply connects to mains AC voltage internally. Purchase only a certified, enclosed power supply (UL, CE, or equivalent listing). Never open, modify, or build a mains-to-5V supply from scratch. All mains wiring (cord, plug, strain relief) must be done by a qualified person or use a pre-wired supply with an IEC inlet or integrated plug. See the power supply section below for safe selection criteria.

> **SAFETY WARNING:** Electrolytic capacitors are polarized. The negative terminal (marked with a stripe and minus signs) connects to ground. Reversed polarity will cause the capacitor to fail, potentially violently. Verify polarity with a multimeter before applying power.

### 2.3 Power Supply Sizing

Each WS2812B LED draws up to 60 mA at full white (20 mA per color channel x 3). In practice, most effects average 30-40% brightness.

| LED Count | Max Current (60mA each) | Recommended Supply | Typical Real Draw |
|-----------|------------------------|--------------------|--------------------|
| 30 | 1.8A | 5V 2A (USB) | 0.5-1A |
| 60 | 3.6A | 5V 5A | 1-2A |
| 150 | 9A | 5V 10A | 3-5A |
| 300 | 18A | 5V 20A | 6-10A |
| 600 | 36A | 5V 40A (or 2x20A) | 12-20A |

WLED includes a current limiter feature that caps total power draw. Set this to match your actual supply capacity.

---

## 3. Wiring

### 3.1 Basic Wiring Diagram

```
  5V Power Supply
  +-----------+
  | +5V   GND |
  +--+-----+--+
     |     |
     |     +----+----+
     |          |    |
     +----+     |    |
          |     |    |
  +-------+-----+---+-------+
  |  +5V   GND       Data   |
  |  (red) (white)   (green) |
  |                          |
  |      WS2812B Strip       |
  |      (arrow direction-->) |
  +-------+-----+---+-------+
          |     |    |
          |     |    +---[330 ohm]---GPIO2 (D4 on NodeMCU)
          |     |
          |     |
  +-------+-----+------+
  |  VIN/5V    GND      |
  |                     |
  |   ESP8266 NodeMCU   |
  |   (powered via USB  |
  |    for programming) |
  +---------------------+

  +---||---+
  | 1000uF |  Across +5V and GND at strip power input
  | 10V    |  (observe polarity!)
  +--------+
```

### 3.2 Important Wiring Notes

1. **Share a common ground** between the power supply, ESP board, and LED strip. Without a common ground, the data signal has no reference and the LEDs will not respond or will display random colors.

2. **Data resistor (330 ohm):** Place it as close to the first LED as practical. It damps reflections on the data line that can cause the first few LEDs to flicker or show wrong colors.

3. **Data line length:** Keep the wire from the ESP GPIO to the first LED under 1 meter. Longer runs degrade the NZR signal edges. For longer distances, use a level shifter or place the ESP at the start of the strip.

4. **Level shifting:** The ESP8266/ESP32 output 3.3V data signals. WS2812B LEDs expect 5V data (logic high threshold is 0.7 x VDD = 3.5V). Many strips work fine at 3.3V, but for reliable operation -- especially with long data lines or cold temperatures -- use a 74HCT245 or SN74AHCT125 level shifter.

5. **Power injection:** For strips longer than 2 meters (120+ LEDs), inject 5V power at multiple points along the strip to prevent voltage drop and color shift at the far end. See [Power Injection & Strip Wiring](m3-power-injection.md) for detailed injection strategies.

---

## 4. Flashing WLED

### 4.1 Web Installer (Easiest)

WLED provides a browser-based installer at `install.wled.me` that uses Web Serial API:

1. Connect the ESP to your computer via USB data cable
2. Open Chrome or Edge (Firefox does not support Web Serial)
3. Navigate to `https://install.wled.me`
4. Select the correct ESP board type (ESP8266 / ESP32)
5. Click "Install" and select the serial port
6. Wait for the flash to complete (~60 seconds)

### 4.2 Manual Flash (esptool)

```
# Install esptool
pip3 install esptool

# Download the latest WLED binary from github.com/Aircoookie/WLED/releases
# File: WLED_0.x.x_ESP8266.bin or WLED_0.x.x_ESP32.bin

# Erase flash first (ESP8266)
esptool.py --port /dev/ttyUSB0 erase_flash

# Flash WLED (ESP8266, 4MB)
esptool.py --port /dev/ttyUSB0 \
  --baud 460800 \
  write_flash -fm dout 0x0 WLED_0.14.4_ESP8266.bin

# For ESP32:
esptool.py --port /dev/ttyUSB0 \
  --baud 460800 \
  --chip esp32 \
  write_flash -z 0x10000 WLED_0.14.4_ESP32.bin
```

### 4.3 PlatformIO Build from Source

For custom builds with specific features or user modifications:

```
# Clone WLED source
git clone https://github.com/Aircoookie/WLED.git
cd WLED

# Install PlatformIO CLI
pip3 install platformio

# Build for ESP8266
pio run -e d1_mini

# Build for ESP32
pio run -e esp32dev

# Flash
pio run -e d1_mini -t upload --upload-port /dev/ttyUSB0
```

---

## 5. Initial Configuration

### 5.1 WiFi Setup

After flashing, WLED creates an access point:

1. Connect your phone/laptop to WiFi network **"WLED-AP"** (password: `wled1234`)
2. Open a browser and navigate to `4.3.2.1`
3. Enter your home WiFi SSID and password
4. Click Save and wait for reboot
5. WLED connects to your home network and the AP disappears
6. Find WLED's IP via your router's DHCP client list, or use `http://wled-<macaddr>.local`

### 5.2 LED Configuration

In the WLED web UI, go to Config -> LED Preferences:

| Setting | Value | Notes |
|---------|-------|-------|
| LED Type | WS281x | For WS2812B (most common) |
| Color Order | GRB | WS2812B standard (some strips use RGB) |
| GPIO | 2 | Default data pin (D4 on NodeMCU) |
| LED Count | 300 | Your actual strip length |
| Max Current | 5000 | mA limit matching your PSU (5A = 5000mA) |

### 5.3 Verify Operation

After saving LED config, the strip should light up with the default orange color. Use the web UI to:
- Drag the color wheel to change color
- Adjust brightness with the slider
- Select an effect from the Effects tab
- Modify effect speed and intensity

---

## 6. JSON API

WLED exposes a comprehensive JSON API for programmatic control. This is how external applications (Home Assistant, custom scripts, other MCUs) interact with WLED.

### 6.1 State Endpoint

```
# Get current state
curl http://192.168.1.60/json/state

# Response:
{
  "on": true,
  "bri": 128,
  "transition": 7,
  "ps": -1,
  "pl": -1,
  "nl": {"on": false, "dur": 60, "fade": true, "tbri": 0},
  "udpn": {"send": false, "recv": true},
  "seg": [{
    "id": 0, "start": 0, "stop": 300,
    "col": [[255, 160, 0], [0, 0, 0], [0, 0, 0]],
    "fx": 0, "sx": 128, "ix": 128,
    "pal": 0, "sel": true, "on": true
  }]
}
```

### 6.2 Controlling WLED via JSON API

```
# Turn on with solid warm white
curl -X POST http://192.168.1.60/json/state \
  -H "Content-Type: application/json" \
  -d '{"on":true,"bri":200,"seg":[{"col":[[255,200,150]]}]}'

# Set effect #9 (rainbow) at speed 180
curl -X POST http://192.168.1.60/json/state \
  -d '{"seg":[{"fx":9,"sx":180}]}'

# Set segment 0 to blue, segment 1 to red
curl -X POST http://192.168.1.60/json/state \
  -d '{"seg":[
    {"id":0,"start":0,"stop":150,"col":[[0,0,255]]},
    {"id":1,"start":150,"stop":300,"col":[[255,0,0]]}
  ]}'

# Activate preset 3
curl -X POST http://192.168.1.60/json/state \
  -d '{"ps":3}'

# Turn off with 2-second fade
curl -X POST http://192.168.1.60/json/state \
  -d '{"on":false,"transition":20}'
```

### 6.3 Info Endpoint

```
# Get device info
curl http://192.168.1.60/json/info

# Response includes:
# "ver": "0.14.4"        WLED version
# "leds": {"count":300}  LED count
# "freeheap": 24576      Free RAM (bytes)
# "uptime": 3600         Seconds since boot
# "wifi": {"rssi":-42}   WiFi signal strength
```

### 6.4 Effect List

```
# Get all available effects
curl http://192.168.1.60/json/effects

# Returns array of effect names:
# ["Solid","Blink","Breathe","Wipe","Wipe Random","Random Colors",
#  "Sweep","Dynamic","Colorloop","Rainbow","Scan","Scan Dual",
#  "Fade","Theater","Theater Rainbow","Running","Saw","Twinkle",
#  "Dissolve","Dissolve Rnd","Sparkle","Sparkle Dark","Sparkle+",
#  "Strobe","Strobe Mega","Strobe Rainbow","Multi Strobe",
#  "Blink Rainbow","Android","Chase","Chase Random","Chase Rainbow",
#  "Chase Flash","Chase Flash Rnd","Rainbow Runner","Colorful",
#  "Traffic Light","Sweep Random","Running 2","Red & Blue","Stream",
#  "Scanner","Lighthouse","Fireworks","Rain","Merry Christmas",
#  "Fire Flicker","Gradient","Loading","Police","Police All",
#  "Two Dots","Two Areas","Bouncing Balls","Sinelon","Sinelon Dual",
#  "Sinelon Rainbow","Popcorn","Drip","Plasma","Percent","Ripple",
#  "Waving","Fire 2012","Pacifica","Candle Multi","Solid Glitter",
#  "Sunrise","Phased","Twinklefox","Twinklecat","Halloween Eyes",
#  "Solid Pattern","Solid Pattern Tri","Spots","Spots Fade",
#  "Glitter","Candle","On","BPM","Juggle","Palette","Fire","Colorwaves",
#  "Bpm","Fill Noise","Noise 1","Noise 2","Noise 3","Noise 4",
#  "Colortwinkles","Lake","Meteor","Smooth Meteor","Railway",
#  "Ripple Rainbow"...]
```

---

## 7. Segment Control

Segments divide a single physical strip into independent virtual strips. Each segment has its own color, effect, speed, intensity, and palette.

### 7.1 Creating Segments

In the WLED web UI, tap the segment icon and use the "+" button to add segments. Or via the API:

```
# Split 300-LED strip into 3 equal segments
curl -X POST http://192.168.1.60/json/state \
  -d '{"seg":[
    {"id":0,"start":0,"stop":100,"on":true,"col":[[255,0,0]],"fx":0},
    {"id":1,"start":100,"stop":200,"on":true,"col":[[0,255,0]],"fx":9},
    {"id":2,"start":200,"stop":300,"on":true,"col":[[0,0,255]],"fx":44}
  ]}'
```

### 7.2 Segment Use Cases

- **Under-cabinet lighting:** Segment per cabinet section, independently dimmed
- **TV backlight:** Top, bottom, left, right segments matching screen quadrants
- **Room accent:** Different colors for different architectural features
- **Status indicator:** First 10 LEDs show a notification color, rest show ambient

---

## 8. Preset System

Presets save the complete WLED state (all segments, effects, colors, brightness) and recall it instantly.

### 8.1 Saving Presets

```
# Save current state as preset 1 with name
curl -X POST http://192.168.1.60/json/state \
  -d '{"psave":1,"n":"Evening Warm"}'

# Save preset 2
curl -X POST http://192.168.1.60/json/state \
  -d '{"psave":2,"n":"Movie Mode"}'
```

### 8.2 Preset Playlists

WLED can cycle through presets automatically:

```
# Create a playlist cycling presets 1,2,3 with 10-second duration each
curl -X POST http://192.168.1.60/json/state \
  -d '{"playlist":{"ps":[1,2,3],"dur":[100,100,100],"transition":20,"repeat":0}}'
# dur values are in 100ms units (100 = 10 seconds)
# repeat: 0 = infinite, N = repeat N times
```

---

## 9. Home Assistant Integration

### 9.1 Auto-Discovery

WLED supports mDNS and broadcasts its presence on the local network. Home Assistant's WLED integration discovers it automatically:

1. In Home Assistant, go to Configuration -> Integrations
2. WLED devices appear in the "Discovered" section
3. Click "Configure" and confirm

### 9.2 Entities Created

Home Assistant creates these entities for each WLED device:

| Entity | Type | Controls |
|--------|------|----------|
| `light.wled_name` | Light | On/off, brightness, color, effect |
| `light.wled_name_segment_0` | Light | Per-segment control |
| `select.wled_name_preset` | Select | Preset activation |
| `select.wled_name_playlist` | Select | Playlist activation |
| `number.wled_name_speed` | Number | Effect speed |
| `number.wled_name_intensity` | Number | Effect intensity |
| `sensor.wled_name_estimated_current` | Sensor | mA draw estimate |
| `update.wled_name` | Update | Firmware update available |

### 9.3 Automation Example

```
# automations.yaml: Sunset warm glow
- alias: "WLED sunset warm"
  trigger:
    platform: sun
    event: sunset
    offset: "-00:30:00"
  action:
    service: light.turn_on
    target:
      entity_id: light.wled_living_room
    data:
      brightness: 150
      rgb_color: [255, 180, 100]
      effect: "Candle Multi"
```

---

## 10. OTA Updates

WLED supports over-the-air firmware updates:

1. Download the new `.bin` file from the WLED GitHub releases page
2. Open the WLED web UI -> Config -> Security & Updates
3. Under "Manual OTA Update," click "Choose File" and select the `.bin`
4. Click "Update" and wait ~60 seconds
5. WLED reboots with the new firmware; all settings and presets are preserved

Alternatively, use the HTTP API:

```
curl -F "update=@WLED_0.15.0_ESP8266.bin" http://192.168.1.60/update
```

---

## 11. Cross-References

- [WS2812B NZR Protocol](m3-ws2812b-protocol.md) -- the signal protocol WLED generates to drive WS2812B strips
- [Power Injection & Strip Wiring](m3-power-injection.md) -- essential for strips longer than 2 meters
- [IR & RF Remote Control](m5-ir-rf-remote.md) -- add physical remote control buttons to your WLED setup
- [diyHue & WLED Integration](m4-diyhue-wled.md) -- make WLED appear as a Philips Hue light
- [MOSFET-Based PWM Dimmers](m5-mosfet-pwm-dimmers.md) -- alternative approach for analog (non-addressable) LED strips
- [ESP32 LED Control](m2-esp32-led.md) -- the ESP32 hardware platform WLED runs on
- [Glossary](00-glossary.md) -- WLED, NZR, SPI, MQTT, OTA, DMX definitions

---

*Sources: WLED project documentation (kno.wledge.me), WLED GitHub repository (github.com/Aircoookie/WLED), Aircoookie (WLED creator), Home Assistant WLED integration documentation, ESPTool documentation (docs.espressif.com), Mean Well power supply datasheets*
