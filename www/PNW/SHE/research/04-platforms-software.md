# Module 4: Platforms & Software Integration

Home Assistant, ESPHome, Node-RED, Docker, voice assistants, and database backends. The software layer that transforms individual sensor nodes into an intelligent home automation system.

---

## 1. Home Assistant

### 1.1 What Home Assistant Is

Home Assistant is the leading open-source home automation platform. It runs on a Raspberry Pi (or any Linux/VM), connects to thousands of device types, and provides: dashboards, automations, scenes, scripts, voice control, and historical data. It is the central hub for this entire curriculum. [SRC-HA]

**Why Home Assistant over alternatives:**
- Open source — no cloud dependency, no subscription fees, full data ownership
- 2000+ integrations (ESPHome, Zigbee, Z-Wave, MQTT, commercial devices)
- Active development (monthly releases)
- Local processing by default (privacy)
- Community of 400K+ users

### 1.2 Installation Methods

| Method | Hardware | Complexity | Add-ons | Recommended For |
|--------|----------|-----------|---------|-----------------|
| HAOS (HA OS) | RPi 4/5, x86 | Low | Yes | Students, recommended |
| Container | Any Docker host | Medium | Manual | Existing Linux servers |
| Core | Any Python 3.12+ | High | No | Developers only |
| Supervised | Debian 12 | Medium | Yes | Advanced users |

**Recommended: HAOS on Raspberry Pi 5**
1. Download HAOS image from home-assistant.io
2. Flash to SD card using Balena Etcher
3. Boot RPi, wait 5-10 minutes for first setup
4. Access at http://homeassistant.local:8123
5. Create admin account
6. Configure Wi-Fi, location, units

**Hardware requirements:**
- Raspberry Pi 4 (2GB min, 4GB recommended) or Pi 5 (4GB)
- 32GB+ SD card (A2 rated) or NVMe SSD via HAT (preferred for Pi 5)
- Ethernet connection recommended (more reliable than Wi-Fi for the hub)
- USB ports for Zigbee coordinator, Z-Wave stick [SRC-HA]

### 1.3 Core Concepts

**Entities:** Every sensor reading, switch, light, or device state is an entity in Home Assistant. Entity IDs follow the pattern `domain.name`: `sensor.living_room_temperature`, `switch.bedroom_light`, `binary_sensor.front_door`.

**States:** Each entity has a current state (a string: "22.5", "on", "off", "unavailable") and optional attributes (unit, device class, last_changed). States are recorded in a history database.

**Integrations:** Plugins that connect Home Assistant to devices and services. ESPHome, MQTT, Zigbee (ZHA or Z2M), Z-Wave (Z-Wave JS), plus commercial integrations (Hue, Sonos, etc.).

**Automations:** "When X happens, if Y is true, do Z." Trigger-condition-action model with support for: state changes, time, sun position, numeric thresholds, templates, webhooks.

**Scenes:** Saved snapshots of entity states. "Movie Night" sets: living room lights to 20%, TV switch on, blinds closed. One tap restores the scene.

**Scripts:** Reusable action sequences. "Goodnight" script: lock all doors, turn off all lights, set thermostat to 18C, arm security. Can be called from automations, dashboard buttons, or voice commands.

### 1.4 Lovelace Dashboard

Home Assistant's UI framework for building custom dashboards. [SRC-HA]

**Card types used in student projects:**

| Card | Purpose | Used In |
|------|---------|---------|
| `entities` | List of entity states | All projects |
| `gauge` | Circular gauge for numeric values | Temperature, humidity |
| `history-graph` | Time series chart | Projects 19, 24 |
| `thermostat` | Climate control | Project 14 |
| `light` | Light control with brightness/color | Project 20 |
| `picture-elements` | Floor plan with overlaid entities | Project 31 |
| `conditional` | Show/hide based on state | Security projects |
| `grid` / `horizontal-stack` | Layout containers | All dashboards |

**Example dashboard YAML (weather station):**
```yaml
type: vertical-stack
cards:
  - type: horizontal-stack
    cards:
      - type: gauge
        entity: sensor.outdoor_temperature
        name: Temperature
        min: -20
        max: 50
        severity:
          green: 10
          yellow: 30
          red: 35
      - type: gauge
        entity: sensor.outdoor_humidity
        name: Humidity
        min: 0
        max: 100
  - type: history-graph
    entities:
      - entity: sensor.outdoor_temperature
      - entity: sensor.outdoor_humidity
    hours_to_show: 24
  - type: entities
    entities:
      - entity: sensor.outdoor_pressure
        name: Barometric Pressure
      - entity: sensor.outdoor_battery
        name: Battery Level
```

### 1.5 Automations

**Automation structure:**
```yaml
automation:
  - alias: "Turn on porch light at sunset"
    trigger:
      - platform: sun
        event: sunset
        offset: "-00:15:00"  # 15 min before sunset
    condition:
      - condition: state
        entity_id: binary_sensor.anyone_home
        state: "on"
    action:
      - service: light.turn_on
        target:
          entity_id: light.porch
        data:
          brightness_pct: 80
          color_temp: 370  # warm white
```

**Advanced automation patterns:**

**Hysteresis thermostat (Project 14):**
```yaml
- alias: "Heater control with hysteresis"
  trigger:
    - platform: numeric_state
      entity_id: sensor.room_temperature
      below: 20.0
  action:
    - service: switch.turn_on
      entity_id: switch.heater_relay
    - wait_for_trigger:
        - platform: numeric_state
          entity_id: sensor.room_temperature
          above: 21.5  # 1.5 degree hysteresis band
    - service: switch.turn_off
      entity_id: switch.heater_relay
```

**Motion-triggered lighting (Project 10):**
```yaml
- alias: "Hallway motion light"
  trigger:
    - platform: state
      entity_id: binary_sensor.hallway_motion
      to: "on"
  condition:
    - condition: numeric_state
      entity_id: sensor.hallway_lux
      below: 50
  action:
    - service: light.turn_on
      entity_id: light.hallway
    - delay: "00:03:00"
    - service: light.turn_off
      entity_id: light.hallway
```

---

## 2. ESPHome

### 2.1 What ESPHome Is

ESPHome generates custom firmware for ESP32/ESP8266 from YAML configuration files. Instead of writing C++ code, students declare their sensors, actuators, and automations in YAML. ESPHome compiles, uploads, and manages firmware OTA (over-the-air). [SRC-ESPH]

**Why ESPHome:**
- YAML configuration is more accessible than C++ for Tier 3+ students
- Automatic Home Assistant integration (native API, zero configuration)
- OTA updates — flash firmware over Wi-Fi, no USB cable needed after first flash
- 200+ component integrations built in
- Handles Wi-Fi reconnection, sensor filtering, and error handling automatically

### 2.2 Configuration Structure

Every ESPHome device starts with this skeleton:

```yaml
esphome:
  name: device-name        # unique name, lowercase, hyphens
  friendly_name: "Device Name"

esp32:
  board: esp32dev          # or nodemcu-32s, esp32-c3-devkitm-1, etc.

# Network
wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:
    ssid: "Device-Fallback"

# Home Assistant connection
api:
  encryption:
    key: !secret api_key

# OTA updates
ota:
  - platform: esphome
    password: !secret ota_password

# Logging
logger:
  level: DEBUG             # VERBOSE, DEBUG, INFO, WARN, ERROR

# Optional: MQTT instead of native API
# mqtt:
#   broker: 192.168.1.100
#   username: !secret mqtt_user
#   password: !secret mqtt_password
```

### 2.3 Sensor Configuration Examples

**Temperature + humidity (DHT22):**
```yaml
sensor:
  - platform: dht
    pin: GPIO4
    model: DHT22
    temperature:
      name: "Room Temperature"
      filters:
        - sliding_window_moving_average:
            window_size: 5
            send_every: 3
    humidity:
      name: "Room Humidity"
    update_interval: 30s
```

**I2C sensor (BME280):**
```yaml
i2c:
  sda: GPIO21
  scl: GPIO22

sensor:
  - platform: bme280_i2c
    address: 0x76
    temperature:
      name: "Outdoor Temperature"
      oversampling: 16x
    humidity:
      name: "Outdoor Humidity"
    pressure:
      name: "Barometric Pressure"
    update_interval: 60s
```

**Binary sensor (PIR):**
```yaml
binary_sensor:
  - platform: gpio
    pin: GPIO13
    name: "Motion Detected"
    device_class: motion
    filters:
      - delayed_off: 30s    # Keep "on" for 30s after last detection
```

**Relay switch:**
```yaml
switch:
  - platform: gpio
    pin: GPIO18
    name: "Light Relay"
    icon: "mdi:lightbulb"
    restore_mode: RESTORE_DEFAULT_OFF
```

### 2.4 ESPHome Automations (On-Device)

ESPHome can run automations directly on the ESP32, without Home Assistant. Useful for time-critical responses and fallback behavior.

```yaml
# Thermostat control entirely on-device
climate:
  - platform: thermostat
    name: "Room Thermostat"
    sensor: room_temperature
    default_preset: Home
    preset:
      - name: Home
        default_target_temperature_low: 20.0
        default_target_temperature_high: 24.0
    heat_action:
      - switch.turn_on: heater_relay
    idle_action:
      - switch.turn_off: heater_relay
    heat_deadband: 0.5     # Don't heat above setpoint + 0.5
    heat_overrun: 0.5      # Don't stop heating until setpoint - 0.5
```

### 2.5 OTA Updates

After the first USB flash, ESPHome devices receive firmware updates over Wi-Fi:

```bash
# From ESPHome CLI
esphome run device-name.yaml  # auto-detects OTA or USB

# From Home Assistant ESPHome add-on
# Click "Install" on the device page
```

> **SAFETY GATE [SC-SEC]:** Always set an OTA password. Without it, anyone on the network can flash arbitrary firmware to your devices. ESPHome's native API uses encryption — enable it with an API key. [SRC-ESPH, SRC-OWASP]

---

## 3. Node-RED

### 3.1 Visual Flow Programming

Node-RED is a flow-based programming tool built on Node.js. Students create automations by connecting visual "nodes" in a browser-based editor. Wires between nodes represent data flow. [SRC-NODERED]

**When to use Node-RED vs. Home Assistant automations:**
- Simple trigger-action automations → Home Assistant (built in, easier)
- Complex logic, data transformation, API integration → Node-RED
- Multi-step workflows with error handling → Node-RED
- Time-series data processing → Node-RED
- REST API integration with external services → Node-RED

### 3.2 Installation

```bash
# On Raspberry Pi (standalone)
bash <(curl -sL https://raw.githubusercontent.com/node-red/linux-installers/master/deb/update-nodejs-and-nodered)
sudo systemctl enable nodered

# As Home Assistant add-on
# Settings > Add-ons > Node-RED > Install
```

### 3.3 Core Node Types

| Node | Type | Purpose |
|------|------|---------|
| `inject` | Input | Trigger at intervals or on button press |
| `mqtt in` | Input | Subscribe to MQTT topic |
| `http request` | Input | Make HTTP/REST calls |
| `function` | Processing | Custom JavaScript logic |
| `switch` | Processing | Route messages by condition |
| `change` | Processing | Set, change, delete message properties |
| `mqtt out` | Output | Publish to MQTT topic |
| `http response` | Output | Reply to HTTP requests |
| `debug` | Output | Log messages to debug panel |

### 3.4 Example Flow: Temperature Alert

```json
[
  {"type":"mqtt in","topic":"home/livingroom/temperature"},
  {"type":"switch","property":"payload","rules":[{"t":"gt","v":"28"}]},
  {"type":"change","rules":[{"t":"set","p":"payload","pt":"msg","to":"Temperature alert: living room above 28C"}]},
  {"type":"mqtt out","topic":"home/notifications/alert"}
]
```

**Visual representation:**
```
[MQTT In: temp] --> [Switch: > 28] --> [Change: format msg] --> [MQTT Out: alert]
```

**Used in:** Project 28 (Node-RED Automation Hub)

---

## 4. Docker Containerization

### 4.1 Why Docker for Smart Home

Docker isolates each service (Home Assistant, Mosquitto, Node-RED, Zigbee2MQTT, databases) in its own container. Benefits: clean installation, easy updates, isolation (one broken service doesn't affect others), reproducibility. [SRC-HA]

### 4.2 Docker Compose for Smart Home Stack

```yaml
# docker-compose.yml
version: '3.8'
services:
  mosquitto:
    image: eclipse-mosquitto:2
    ports:
      - "1883:1883"
      - "8883:8883"
    volumes:
      - ./mosquitto/config:/mosquitto/config
      - ./mosquitto/data:/mosquitto/data
    restart: unless-stopped

  homeassistant:
    image: homeassistant/home-assistant:stable
    network_mode: host
    volumes:
      - ./homeassistant:/config
    restart: unless-stopped
    depends_on:
      - mosquitto

  zigbee2mqtt:
    image: koenkk/zigbee2mqtt
    volumes:
      - ./zigbee2mqtt:/app/data
    devices:
      - /dev/ttyACM0:/dev/ttyACM0  # CC2652 USB
    depends_on:
      - mosquitto

  nodered:
    image: nodered/node-red
    ports:
      - "1880:1880"
    volumes:
      - ./nodered:/data
    depends_on:
      - mosquitto

  influxdb:
    image: influxdb:2
    ports:
      - "8086:8086"
    volumes:
      - ./influxdb:/var/lib/influxdb2
```

---

## 5. Database Backends

### 5.1 Historical Data Storage

Home Assistant stores history in SQLite by default. For long-term storage and analytics, dedicated time-series databases are recommended.

**InfluxDB 2.x:** Purpose-built time-series database. Stores sensor readings with timestamps efficiently. Query with Flux language. Pairs with Grafana for visualization. Recommended for Projects 19 (Energy Meter), 24 (Weather Dashboard).

**MariaDB/PostgreSQL:** Relational database as Home Assistant recorder backend. Better performance than SQLite for large installations (100+ entities with frequent updates).

### 5.2 Grafana Dashboards

Grafana connects to InfluxDB and creates professional time-series dashboards:
- Energy consumption over time (daily, weekly, monthly)
- Temperature trends across rooms
- Solar production vs. consumption
- Historical comparisons (this week vs. last week)

---

## 6. Voice Assistant Integration

### 6.1 Local Voice Control

Voice assistants that run entirely locally — no cloud, no internet required, no privacy concerns. [SRC-HA]

**Wyoming protocol:** Home Assistant's open voice assistant framework. Components:
- **Wake word detection:** openWakeWord or Porcupine (runs on RPi)
- **Speech-to-text:** Whisper (OpenAI's local STT model, runs on RPi 5)
- **Intent recognition:** Home Assistant's built-in conversation engine
- **Text-to-speech:** Piper (local TTS, multiple voices)

**Hardware for Project 26 (Voice-Controlled Room):**
- Raspberry Pi 5 (4GB) — runs Whisper STT + Piper TTS
- USB microphone or INMP441 I2S MEMS microphone
- MAX98357A I2S amplifier + 3W speaker
- ESP32-S3 as satellite (wake word + audio streaming to RPi)

### 6.2 Rhasspy (Alternative)

Rhasspy is an earlier local voice assistant toolkit. While Home Assistant's Wyoming integration is now preferred, Rhasspy remains useful for understanding voice pipeline architecture: audio capture -> VAD (voice activity detection) -> wake word -> STT -> intent -> TTS -> audio output.

---

## 7. Concept Cross-Reference

| Concept | First Seen | Module Ref | Projects |
|---------|-----------|-----------|----------|
| HA entities/states | Section 1.3 | [M3:3.4] | All HA projects |
| Lovelace dashboards | Section 1.4 | — | 7, 14, 19, 24, 31 |
| HA automations | Section 1.5 | [M3:3] | 10, 14, 21, 23 |
| ESPHome YAML | Section 2.2 | [M2:sensors] | 13-36 |
| ESPHome OTA | Section 2.5 | [M6:2.2] | All ESPHome projects [SC-SEC] |
| ESPHome climate | Section 2.4 | [M2:5.1] | 14, 16 |
| Node-RED flows | Section 3 | [M3:3] | 28 |
| Docker compose | Section 4 | — | 31 |
| InfluxDB/Grafana | Section 5 | — | 19, 24, 29 |
| Voice assistants | Section 6 | — | 26, 31, 36 |
| MQTT integration | Section 2.3 | [M3:3] | All MQTT projects |
| API encryption | Section 2.2 | [M6:2] | All ESPHome projects [SC-SEC] |
