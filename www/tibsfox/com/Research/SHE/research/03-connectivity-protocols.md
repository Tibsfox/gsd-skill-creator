# Module 3: Connectivity & Protocols

Complete mapping of smart home communication protocols, from physical radio layers to application-level messaging. Every wireless device in a smart home speaks at least one of these protocols — understanding the stack is what separates a user from a builder.

---

## 1. Protocol Comparison Matrix

The definitive comparison table for choosing the right protocol for each project.

| Protocol | Frequency | Range | Data Rate | Mesh | Power | Security | License | Best For |
|----------|-----------|-------|-----------|------|-------|----------|---------|----------|
| Wi-Fi (802.11n) | 2.4/5 GHz | 50 m indoor | 54-600 Mbps | No | High (~80-240 mA) | WPA3 | Open | High-bandwidth, always-powered |
| BLE 5.0 | 2.4 GHz | 30 m | 2 Mbps | Yes (BLE Mesh) | Very Low (~10-15 mA TX) | AES-CCM | Open | Wearables, beacons, proximity |
| Zigbee 3.0 | 2.4 GHz | 10-30 m | 250 kbps | Yes (self-healing) | Low (~30 mA TX) | AES-128 | CSA cert | Sensors, switches, large mesh |
| Z-Wave (700) | 908.42 MHz (NA) | 30 m | 100 kbps | Yes (source-routed) | Low | S2 (AES-128) | Z-Wave Alliance | Retrofits, lower interference |
| Thread 1.4 | 2.4 GHz | 10-30 m | 250 kbps | Yes (self-healing) | Low | DTLS 1.3 | Open (BSD) | Matter transport, IP-native |
| Matter 1.5 | Over IP | Via transport | Via transport | Via Thread | Via transport | Per-session CASE | CSA cert | Interoperability standard |
| LoRa | 868/915 MHz | 2-15 km | 0.3-50 kbps | No (star via gateway) | Very Low | AES-128 (LoRaWAN) | ISM band | Long-range, low-power sensors |
| 433 MHz RF | 433 MHz | 100 m | ~4 kbps | No | Very Low | None (add own) | ISM band | Legacy remotes, simple triggers |
| IR (Infrared) | 38 kHz carrier | 5-10 m (line of sight) | 1-2 kbps | No | Negligible | None | Open | Remote control emulation |
| MQTT | Over TCP/IP | Network-dependent | Network-dependent | N/A | N/A (software) | TLS optional | OASIS open | Message routing backbone |

[SRC-CSA, SRC-THREAD, SRC-ZWAVE, SRC-ZIGBEE, SRC-BLE, SRC-MQTT]

---

## 2. Wi-Fi (IEEE 802.11)

### 2.1 Protocol Overview

Wi-Fi provides the highest bandwidth and simplest connectivity for smart home devices — every home already has a Wi-Fi router. The ESP32's built-in Wi-Fi makes it the natural first wireless protocol for students.

**Advantages:**
- Existing infrastructure — no additional hardware needed
- High bandwidth for cameras, audio, dashboards
- Direct IP connectivity (HTTP, MQTT, WebSocket)
- Mature security (WPA3, TLS)

**Disadvantages:**
- High power consumption (not suitable for battery devices)
- No mesh networking (each device connects directly to router)
- Router device limits (typical consumer routers: 32-64 devices)
- 2.4 GHz band is congested in apartments

### 2.2 ESP32 Wi-Fi Configuration

**Arduino framework:**
```cpp
#include <WiFi.h>
void setup() {
  WiFi.begin("SSID", "password");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
  Serial.println(WiFi.localIP());
}
```

**ESPHome (recommended for Tier 3+):**
```yaml
wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:  # fallback access point
    ssid: "Device-Fallback"
    password: !secret ap_password
```

**Reconnection handling:** Wi-Fi connections drop. Robust firmware must handle disconnection and reconnection gracefully without blocking sensor readings or actuator control. ESPHome handles this automatically. For Arduino: check `WiFi.status()` periodically and call `WiFi.reconnect()` if disconnected.

> **SAFETY GATE [SC-SEC]:** Always use WPA2 or WPA3 encryption. Never use open networks or WEP. Use unique passwords. Consider a dedicated IoT VLAN to isolate smart home devices from computers and phones. [SRC-OWASP, SRC-ETSI]

---

## 3. MQTT — The Backbone Protocol

### 3.1 Publish/Subscribe Model

MQTT (Message Queuing Telemetry Transport) is the de facto standard for DIY smart home communication. Unlike HTTP (request/response), MQTT uses a publish/subscribe model where devices don't communicate directly — they all talk through a central broker. [SRC-MQTT]

**Architecture:**
```
[ESP32 Sensor] --publish--> home/livingroom/temperature
                                     |
                              [MQTT BROKER]
                           (Eclipse Mosquitto)
                                     |
[Home Assistant] <--subscribe-- home/livingroom/temperature
[Node-RED]       <--subscribe-- home/+/temperature
[Phone App]      <--subscribe-- home/#
```

**Why MQTT wins for smart home:**
1. Lightweight — runs on ESP8266 with 50KB RAM
2. Decoupled — devices don't need to know about each other
3. Reliable — QoS levels handle unreliable networks
4. Persistent — retained messages provide last-known state
5. Flexible — topic hierarchies support any device taxonomy

### 3.2 Topics and Hierarchy

MQTT topics are hierarchical strings separated by `/`. They form the addressing system for your smart home.

**Recommended topic structure:**
```
home/{room}/{device}/{measurement}

Examples:
home/livingroom/thermostat/temperature    -> "22.5"
home/livingroom/thermostat/humidity       -> "45"
home/livingroom/thermostat/setpoint       -> "21.0"
home/bedroom/light/state                  -> "ON"
home/bedroom/light/brightness             -> "75"
home/garage/door/state                    -> "closed"
home/outdoor/weather/pressure             -> "1013.2"
```

**Wildcards (for subscriptions only):**
- `+` matches one level: `home/+/temperature` matches all rooms' temperature
- `#` matches all remaining levels: `home/#` matches everything in the home
- Never use wildcards in publish topics

### 3.3 Quality of Service (QoS)

| QoS Level | Name | Guarantee | Use Case |
|-----------|------|-----------|----------|
| 0 | At most once | Fire and forget, no acknowledgment | Temperature readings (periodic, loss is ok) |
| 1 | At least once | Acknowledged, may deliver duplicates | Switch commands (important, idempotent) |
| 2 | Exactly once | Four-step handshake, guaranteed once | Payment/critical events (rarely needed in smart home) |

**Recommendation:** QoS 0 for sensor telemetry (published every 30-60 seconds, one lost reading doesn't matter). QoS 1 for commands (light on/off, door lock/unlock). QoS 2 is almost never needed in smart home — the overhead isn't worth it. [SRC-MQTT]

### 3.4 Retained Messages and Last Will

**Retained messages:** When a message is published with the `retain` flag, the broker stores the last value. New subscribers immediately receive the current state. This solves the "I just connected, what's the current temperature?" problem. Use retained messages for all state topics (temperature, switch state, door state). [SRC-MQTT]

**Last Will and Testament (LWT):** When a device connects, it registers a "will" message with the broker. If the device disconnects unexpectedly (crash, power loss, network failure), the broker publishes the will message on its behalf. Use for availability tracking:

```
Connect with will: topic="home/sensor1/status", payload="offline", retain=true
On connect: publish "online" to "home/sensor1/status", retain=true
On unexpected disconnect: broker publishes "offline" automatically
```

Home Assistant uses LWT to show device availability in dashboards.

### 3.5 Mosquitto Broker Setup

Eclipse Mosquitto is the standard open-source MQTT broker. Install on a Raspberry Pi or any Linux system. [SRC-MOSQ]

**Installation (Raspberry Pi / Ubuntu):**
```bash
sudo apt install mosquitto mosquitto-clients
sudo systemctl enable mosquitto
```

**Secured configuration (/etc/mosquitto/mosquitto.conf):**
```
listener 1883 localhost          # unencrypted, local only
listener 8883                    # TLS encrypted, external
certfile /etc/mosquitto/certs/server.crt
keyfile /etc/mosquitto/certs/server.key
cafile /etc/mosquitto/certs/ca.crt
allow_anonymous false
password_file /etc/mosquitto/passwd
```

> **SAFETY GATE [SC-SEC]:** Never run Mosquitto with `allow_anonymous true` on a network-accessible port. At minimum: password authentication. For external access: TLS encryption (port 8883) is mandatory. MQTT messages are plaintext — without TLS, anyone on the network can read sensor data and send commands. [SRC-MQTT, SRC-OWASP]

### 3.6 MQTT on ESP32

**Arduino PubSubClient:**
```cpp
#include <WiFi.h>
#include <PubSubClient.h>

WiFiClient espClient;
PubSubClient mqtt(espClient);

void callback(char* topic, byte* payload, unsigned int length) {
  // Handle incoming messages
}

void setup() {
  WiFi.begin(ssid, password);
  mqtt.setServer("192.168.1.100", 1883);
  mqtt.setCallback(callback);
}

void reconnect() {
  while (!mqtt.connected()) {
    if (mqtt.connect("sensor1", "user", "pass",
        "home/sensor1/status", 1, true, "offline")) {
      mqtt.publish("home/sensor1/status", "online", true);
      mqtt.subscribe("home/sensor1/command");
    } else {
      delay(5000);
    }
  }
}

void loop() {
  if (!mqtt.connected()) reconnect();
  mqtt.loop();
  // Publish sensor data periodically
  mqtt.publish("home/livingroom/temp", String(temperature).c_str());
}
```

**ESPHome MQTT (alternative to native API):**
```yaml
mqtt:
  broker: 192.168.1.100
  username: !secret mqtt_user
  password: !secret mqtt_password
  discovery: true  # Home Assistant auto-discovery
```

**Used in:** Projects 8 (MQTT Temp Node), 14 (Thermostat), 21 (Multi-Room), 28 (Node-RED Hub), 31 (Complete Hub)

---

## 4. Matter Protocol

### 4.1 What Matter Changes

Matter is the unifying application-layer standard developed by the Connectivity Standards Alliance (Apple, Google, Amazon, Samsung). It eliminates the "which ecosystem?" question by providing a single protocol that works with all major platforms simultaneously. [SRC-CSA]

**Key principles:**
1. **Local-first:** No cloud dependency. Devices communicate directly on the local network.
2. **Multi-admin:** A single device can be controlled by Apple Home, Google Home, and Alexa simultaneously.
3. **IP-based:** Runs over Wi-Fi, Thread, and Ethernet — standard IP networking.
4. **Open standard:** Specification is open (CSA membership required for certification, but implementation is free).

### 4.2 Protocol Stack

```
APPLICATION:   Matter (clusters, attributes, commands)
                        |
SESSION:       CASE (Certificate-Authenticated Session Establishment)
                        |
TRANSPORT:     MRP (Message Reliability Protocol) over UDP
                        |
NETWORK:       IPv6 (link-local or ULA)
                        |
PHYSICAL:      Wi-Fi  |  Thread  |  Ethernet
               802.11    802.15.4    802.3
```

**What this teaches students:** Protocol layering. A Matter light bulb communicates over Thread (physical) using IPv6 (network) with Matter's cluster library (application). Building a Matter-compatible device with an ESP32 teaches all three layers simultaneously. [SRC-CSA]

### 4.3 Matter v1.5 (November 2025)

Version 1.5 added support for: cameras, soil moisture sensors, energy management, and robot vacuums. The specification continues to expand device type coverage. [SRC-CSA]

**Device types supported:** Lights, switches, plugs, thermostats, door locks, window coverings, sensors (temperature, humidity, occupancy, contact, light, flow, pressure, soil moisture), cameras, EV chargers, energy management.

### 4.4 Thread Border Router

Thread is the preferred transport for battery-powered Matter devices. Thread creates a mesh network using IEEE 802.15.4 radios. A Thread Border Router bridges the Thread mesh to the Wi-Fi/Ethernet network. [SRC-THREAD]

**Thread network roles:**
- **Leader:** Manages the network, distributes addresses (elected automatically)
- **Router:** Forwards messages, extends the mesh (mains-powered devices)
- **End Device (SED):** Battery-powered, sleeps most of the time, wakes to poll parent
- **Border Router:** Bridges Thread mesh to IP network (Apple TV, HomePod, Google Hub)

### 4.5 Building a Matter Device

ESP32-C6 and ESP32-H2 have built-in IEEE 802.15.4 radios for Thread. The ESP-Matter SDK provides the framework for building Matter-certified devices. [SRC-ESP32, SRC-CSA]

This is advanced territory (Tier 5-6) but demonstrates the complete protocol stack that commercial products use.

---

## 5. Zigbee (IEEE 802.15.4)

### 5.1 Mesh Networking

Zigbee creates a self-healing mesh network at 2.4 GHz. Each mains-powered device acts as a router, extending coverage. Battery-powered devices act as end devices, communicating through their parent router. [SRC-ZIGBEE]

**Network roles:**
- **Coordinator:** One per network, manages the mesh (CC2652 USB stick)
- **Router:** Mains-powered devices, forwards messages, extends range
- **End Device:** Battery sensors, sleep-capable, low power

**Advantages over Wi-Fi:**
- True mesh networking — no single point of failure
- Lower power than Wi-Fi (months on a coin cell for end devices)
- Doesn't burden Wi-Fi router with hundreds of devices
- Better for large deployments (100+ devices)

**Disadvantages:**
- Requires coordinator hardware ($15 USB stick)
- Lower bandwidth (250 kbps — sensors only, no video)
- 2.4 GHz — competes with Wi-Fi for spectrum
- Device pairing can be finicky

### 5.2 Zigbee2MQTT

The standard open-source bridge between Zigbee devices and MQTT. Runs on a Raspberry Pi with a CC2652 USB coordinator. Supports 2000+ commercial Zigbee devices. [SRC-HACK]

**Architecture:**
```
[Zigbee Devices] <-> [CC2652 USB] <-> [Zigbee2MQTT] <-> [Mosquitto] <-> [Home Assistant]
```

**Used in:** Project 27 (Zigbee Mesh Network), Project 31 (Complete Home Hub)

---

## 6. Z-Wave

### 6.1 Sub-GHz Advantage

Z-Wave operates at 908.42 MHz (North America), 868.42 MHz (Europe). This sub-GHz frequency provides: better wall penetration, lower interference with Wi-Fi, longer range per hop. [SRC-ZWAVE]

**Trade-offs vs. Zigbee:**
- Better range and penetration (lower frequency)
- Less interference (separate band from Wi-Fi)
- Lower device variety (proprietary certification)
- Higher device cost (certification fee)
- Source-routed mesh (coordinator plans routes, unlike Zigbee's distributed routing)

### 6.2 Z-Wave Security (S2)

Z-Wave S2 security framework provides: AES-128 encryption, secure key exchange during inclusion, three security classes (Access Control, Authenticated, Unauthenticated). S2 is mandatory for all Z-Wave 700+ series devices. [SRC-ZWAVE]

---

## 7. Bluetooth Low Energy (BLE)

### 7.1 Overview

BLE is designed for short-range, low-power communication. Unlike classic Bluetooth (audio streaming), BLE uses a client/server model with GATT (Generic Attribute Profile) services and characteristics. [SRC-BLE]

**ESP32 BLE capabilities:**
- Advertise as a BLE peripheral (sensor beacon)
- Scan for BLE devices (presence detection)
- GATT server (expose sensor data as characteristics)
- GATT client (read data from BLE sensors)
- BLE Mesh (experimental)

### 7.2 Smart Home BLE Applications

- **Presence detection:** Scan for known BLE beacons (phone, watch, tile tracker) to detect room occupancy. ESP32 scans for BLE advertisements and reports RSSI (signal strength) to estimate proximity.
- **Commissioning:** Matter uses BLE for initial device setup before transitioning to Wi-Fi or Thread.
- **Local control:** BLE provides direct device control without Wi-Fi infrastructure.

**Used in:** Project 30 (BLE presence tracking component)

---

## 8. LoRa (Long Range)

### 8.1 Protocol Characteristics

LoRa uses chirp spread spectrum modulation on sub-GHz bands (868/915 MHz) to achieve extremely long range (2-15 km line-of-sight) at very low data rates (0.3-50 kbps). [SRC-FCC]

**Smart home applications:**
- Remote weather stations beyond Wi-Fi range
- Garden/greenhouse sensors at property edge
- Mailbox notifications
- Irrigation system control for large properties

**LoRa vs. LoRaWAN:** LoRa is the physical modulation. LoRaWAN is a network protocol built on top (star topology with gateways, device classes, AES-128 security). For student projects, point-to-point LoRa is simpler — two ESP32 modules with SX1276 radios.

> **SAFETY GATE [SC-RF]:** LoRa modules transmit at up to 20 dBm (100 mW) on ISM bands. FCC Part 15 limits apply: 915 MHz band allows up to 1W EIRP for frequency-hopping systems. Student projects should use default power settings and duty cycle limits. [SRC-FCC]

### 8.2 Hardware

**SX1276/SX1278 module:** SPI interface to ESP32. $5 for a module with antenna. Range depends on antenna, terrain, and spreading factor (higher SF = longer range, lower data rate).

---

## 9. 433 MHz RF

Simple amplitude-shift keying (ASK) or on-off keying (OOK) modulation. Extremely cheap ($1 for TX+RX pair). No addressing, no encryption, no error correction. [SRC-FCC]

**Smart home applications:**
- Receiving signals from legacy 433 MHz remote controls and weather stations
- Simple one-way triggers (doorbell, mailbox sensor)
- Replaying captured codes to control legacy RF outlets

**Limitations:** One-way communication (separate TX and RX modules), no acknowledgment, no encryption, easily interfered with. Use only for non-critical applications or legacy device integration.

**Used in:** Legacy device integration, learning about RF basics

---

## 10. Infrared (IR)

Line-of-sight communication using modulated infrared light (38 kHz carrier typical). Every TV remote control uses IR. [SRC-ARD]

**Smart home applications:**
- Universal remote control — learn and replay IR codes for TVs, AC units, fans
- IR blaster — ESP32 with IR LED can control any IR-compatible device
- Integration with Home Assistant — control "dumb" appliances from smart automations

**Hardware:** IR LED (transmit), TSOP38238 (receive/demodulate). Total cost: $0.50.

**Used in:** Project 17 (IR Remote Hub)

---

## 11. Practical Exercises

### 11.1 Setting Up an MQTT Broker

**Exercise:** Install Mosquitto on Raspberry Pi, create users, test pub/sub from command line.

```bash
# Install
sudo apt install mosquitto mosquitto-clients

# Create user
sudo mosquitto_passwd -c /etc/mosquitto/passwd student

# Test (two terminal windows)
# Window 1 - Subscribe:
mosquitto_sub -h localhost -u student -P password -t "test/#"

# Window 2 - Publish:
mosquitto_pub -h localhost -u student -P password -t "test/hello" -m "world"
```

### 11.2 Joining a Zigbee Mesh

**Exercise:** Flash CC2652, install Zigbee2MQTT, pair a commercial Zigbee device.

1. Flash CC2652 USB stick with latest coordinator firmware
2. Install Zigbee2MQTT on RPi alongside Mosquitto
3. Put a Zigbee device in pairing mode
4. Watch Zigbee2MQTT logs as the device joins
5. Observe MQTT messages as the device reports state

### 11.3 Commissioning a Matter Device

**Exercise:** Build a Matter light on ESP32-C3, commission via mobile app.

This exercise demonstrates the full Matter stack: BLE commissioning, Wi-Fi provisioning, and CASE session establishment.

---

## 12. Protocol Selection Decision Tree

```
START: What are you connecting?
  |
  +-- Battery-powered sensor?
  |     +-- Long range (>100m)? --> LoRa
  |     +-- Mesh needed? --> Zigbee (end device) or Thread
  |     +-- Simple, cheap? --> 433 MHz or BLE beacon
  |
  +-- Mains-powered sensor/switch?
  |     +-- Need mesh? --> Zigbee (router) or Thread
  |     +-- Camera/audio? --> Wi-Fi (bandwidth needed)
  |     +-- Simple on/off? --> Wi-Fi + MQTT or Zigbee
  |
  +-- Hub/gateway?
  |     +-- Central automation --> Wi-Fi + MQTT (Home Assistant)
  |     +-- Zigbee coordinator --> CC2652 + Zigbee2MQTT
  |     +-- Thread border router --> Apple TV / Google Hub / RPi
  |
  +-- Legacy device?
  |     +-- IR remote? --> IR blaster (ESP32 + IR LED)
  |     +-- RF remote? --> 433 MHz receiver/transmitter
  |     +-- No radio? --> Smart plug with power monitoring
  |
  +-- Multiple ecosystems?
        +-- Apple + Google + Alexa --> Matter (Thread or Wi-Fi)
```

---

## 13. Concept Cross-Reference

| Concept | First Seen | Module Ref | Projects |
|---------|-----------|-----------|----------|
| MQTT pub/sub | Section 3 | [M4:1.1] | 8, 14, 21, 28, 31 |
| MQTT QoS | Section 3.3 | [M6:2.2] | All MQTT projects |
| MQTT security (TLS) | Section 3.5 | [M6:2.2] | All MQTT projects [SC-SEC] |
| Wi-Fi reconnection | Section 2.2 | [M1:3.2] | All Wi-Fi projects |
| Zigbee mesh | Section 5 | [M4:1.3] | 27, 31 |
| Thread/Matter | Section 4 | [M4:1.4] | 31 (advanced) |
| LoRa modulation | Section 8 | [M1:3.3] | Remote sensors |
| IR protocols | Section 10 | [M1:3.3] | 17 |
| Protocol layering | Section 4.2 | [M1:3.3] | Understanding stack |
| Network security | Section 3.5 | [M6:2] | All connected projects [SC-SEC] |
| RF compliance | Section 8.1 | [M6:3] | All wireless projects [SC-RF] |
