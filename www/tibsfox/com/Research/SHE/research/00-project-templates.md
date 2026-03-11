# Project Templates — Smart Home Technologies & DIY Electronics

Standard templates for all 36 student projects across 6 tiers. Every project follows this structure to ensure consistency, safety coverage, and concept mapping.

---

## 1. Project Writeup Template

Every project in Module 5 follows this structure:

```
## Project [N]: [Project Name]

**Tier:** [1-6] | **Difficulty:** [Beginner/Intermediate/Advanced/Capstone]
**Estimated Time:** [hours] | **Cost:** ~$[amount]
**Prerequisites:** [Project numbers or "None"]

### Learning Objectives
After completing this project, students will be able to:
1. [Measurable outcome using action verb]
2. [Measurable outcome using action verb]
3. [Measurable outcome using action verb]

### Bill of Materials

| Component | Quantity | Specification | Est. Cost | Source |
|-----------|----------|---------------|-----------|--------|
| [Part] | [N] | [Key specs] | $[X.XX] | [Catalog ref] |

**Total Estimated Cost:** $[sum]

### Circuit Description

[Text description of the circuit connections. Pin-by-pin wiring list.
For Tier 3+ projects involving mains voltage, include NEC references.]

**Connection Table:**
| From | To | Wire/Note |
|------|----|-----------|
| [Component Pin] | [Component Pin] | [Color/gauge] |

### Firmware Overview

**Platform:** [Arduino IDE / ESPHome YAML / Python]
**Language:** [C++/Arduino / YAML / Python]
**Key Libraries:** [library names with versions]

[Description of firmware architecture: setup, loop, key functions.
For ESPHome projects, show the YAML configuration.]

**Core Logic:**
[Pseudocode or key code snippets showing the essential algorithm.
All code must compile on the specified hardware without modification.]

### Platform Integration

**Home Assistant:** [Integration method — ESPHome native API / MQTT / REST]
**Dashboard:** [Lovelace card type and configuration]
**Automation Example:** [One practical automation using this device]

### Safety Notes

[BLOCK]: [Red — Mains voltage, gas, structural safety warnings]
[GATE]: [Orange — Component rating limits, permit requirements]
[ANNOTATE]: [Yellow — Cost alternatives, optional enhancements]

[For mains voltage projects: NEC article references, de-energize protocol,
GFCI requirements, wire gauge specifications, junction box requirements]

### What You Learned

| Concept | Module | Where It Applies Next |
|---------|--------|-----------------------|
| [Concept from M1-M4] | [M1/M2/M3/M4] | [Which later project uses this] |

### Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| [What goes wrong] | [Why] | [How to fix] |
```

---

## 2. Safety Callout System

Three levels of safety callout used throughout all documents:

### BLOCK (Red) — Mandatory Stop

Used for: Mains voltage hazards, gas detection limitations, structural safety, fire risk.

Format:
```
> **SAFETY BLOCK [SC-ID]:** [Warning text]. [Specific hazard]. [Required action].
> [NEC/NFPA/UL reference]. [SRC-ID]
```

Example:
> **SAFETY BLOCK [SC-MAINS]:** This project involves 120V AC mains voltage. De-energize the circuit at the breaker before any wiring. Use 14 AWG minimum wire for 15A circuits. All connections must be inside an approved junction box with proper wire nuts or Wago connectors. GFCI protection required per NEC 210.8 for kitchens, bathrooms, garages, and outdoor locations. When in doubt, hire a licensed electrician. [SRC-NFPA, SRC-NEC-210]

### GATE (Orange) — Check Before Proceeding

Used for: Component rating verification, permit requirements, professional boundaries.

Format:
```
> **SAFETY GATE [SC-ID]:** [Condition to verify]. [What to check]. [Boundary].
> [Standard reference]. [SRC-ID]
```

Example:
> **SAFETY GATE [SC-REL]:** Before connecting any load to a relay, verify: (1) relay contact rating exceeds the load current, (2) wire gauge matches the circuit amperage, (3) flyback diode is installed across the relay coil. A 10A relay does NOT mean the wiring is rated for 10A — verify separately. [SRC-NFPA, SRC-NEC-725]

### ANNOTATE (Yellow) — Informational

Used for: Cost-saving alternatives, optional upgrades, learning context.

Format:
```
> **NOTE [ANNOTATE]:** [Information]. [Alternative approach]. [Context].
```

Example:
> **NOTE [ANNOTATE]:** The BME280 ($4) can replace the DHT22 ($3) in this project with better accuracy and the addition of barometric pressure. The I2C interface also allows multiple sensors on the same bus. Consider upgrading if building toward the weather station project (Project 24).

---

## 3. Bill of Materials (BOM) Template

### Standard BOM Fields

| Field | Required | Description |
|-------|----------|-------------|
| Component | Yes | Common name (e.g., "ESP32 DevKit v1") |
| Quantity | Yes | Number needed |
| Specification | Yes | Key electrical specs (voltage, current, interface) |
| Part Number | Recommended | Specific part (e.g., "ESP32-WROOM-32E") |
| Est. Cost | Yes | Approximate USD cost (single unit, retail) |
| Catalog Ref | Yes | Reference to 00-component-catalog.md section |
| Safety Class | If applicable | SC-MAINS, SC-BAT, SC-REL, SC-RF |

### Cost Categories by Tier

| Tier | Name | Cost Range | Power Source | Safety Level |
|------|------|-----------|--------------|-------------|
| 1 | First Steps | $3-10 | USB only | Low voltage only |
| 2 | Getting Connected | $10-15 | USB + battery | Low voltage + Wi-Fi |
| 3 | Home Automation | $12-22 | USB + mains relay | Mains switching begins |
| 4 | Intermediate | $25-45 | Mixed | CT clamps, complex circuits |
| 5 | Advanced | $25-80 | Mixed + PoE | Camera, mesh, voice |
| 6 | Capstone | $40-100 | Full system | Complete integration |

---

## 4. Circuit Diagram Description Standard

Since this is a text-based research document, circuit diagrams are described using connection tables and schematic descriptions:

### Connection Table Format

| From (Component.Pin) | To (Component.Pin) | Wire Color/Gauge | Notes |
|----------------------|-------------------|------------------|-------|
| ESP32.GPIO4 | DHT22.DATA | Green jumper | 4.7K pull-up to 3.3V |
| ESP32.3V3 | DHT22.VCC | Red jumper | Power |
| ESP32.GND | DHT22.GND | Black jumper | Common ground |

### Schematic Description Rules

1. Always specify exact GPIO pin numbers (not just "digital pin")
2. Note voltage levels at each connection point
3. Identify pull-up/pull-down resistor values and locations
4. For I2C: specify SDA/SCL pins and pull-up values (4.7K typical)
5. For SPI: specify MOSI, MISO, SCK, CS pins
6. For relay circuits: show transistor driver, flyback diode, and load connections separately
7. For mains circuits: describe low-voltage control side and high-voltage load side as separate zones

### Power Distribution Notes

Every circuit description must include:
- Power source identification (USB, battery, DC adapter, mains)
- Voltage regulation chain (e.g., 12V adapter -> LM7805 -> 5V -> AMS1117 -> 3.3V)
- Current budget (sum of all component draw vs. supply capacity)
- Decoupling capacitor placement (100 nF at each IC VCC pin)

---

## 5. Firmware Code Standard

### Arduino/C++ Projects (Tier 1-2)

```cpp
// Project [N]: [Name]
// Hardware: [Platform] + [Key components]
// Author: Student
// Prerequisites: [Previous projects]

// === Pin Definitions ===
const int SENSOR_PIN = [N];
const int ACTUATOR_PIN = [N];

// === Configuration ===
const unsigned long READ_INTERVAL = 2000; // ms

// === Global State ===
unsigned long lastRead = 0;

void setup() {
  Serial.begin(115200);
  pinMode(SENSOR_PIN, INPUT);
  pinMode(ACTUATOR_PIN, OUTPUT);
  // [Sensor/library initialization]
}

void loop() {
  if (millis() - lastRead >= READ_INTERVAL) {
    lastRead = millis();
    // [Read sensor]
    // [Process data]
    // [Drive actuator]
    // [Report to serial/network]
  }
}
```

### ESPHome YAML Projects (Tier 3+)

```yaml
# Project [N]: [Name]
# Hardware: ESP32 + [components]

esphome:
  name: project-[n]-[slug]
  platform: ESP32
  board: esp32dev

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

api:
  encryption:
    key: !secret api_key

ota:
  password: !secret ota_password

logger:

sensor:
  - platform: [sensor_type]
    # [sensor configuration]
    name: "[Friendly Name]"
    update_interval: 60s

switch:
  - platform: gpio
    pin: [GPIO_N]
    name: "[Switch Name]"
    # [additional config]
```

### Code Quality Requirements

1. All code must compile without warnings on the specified platform
2. Pin assignments must match the circuit description exactly
3. No magic numbers — use named constants
4. Non-blocking design (no `delay()` in loop for Tier 2+)
5. Error handling for sensor read failures
6. Serial output for debugging (all tiers)
7. Wi-Fi reconnection logic (Tier 2+)
8. MQTT QoS and retained message configuration documented

---

## 6. Platform Integration Template

### Home Assistant Integration

```yaml
# configuration.yaml addition (if needed)
# Most ESPHome devices are auto-discovered

# Lovelace dashboard card
type: entities
title: "[Project Name]"
entities:
  - entity: sensor.[device]_[measurement]
    name: "[Friendly Name]"
  - entity: switch.[device]_[control]
    name: "[Control Name]"
```

### Automation Template

```yaml
# automations.yaml
- alias: "[Descriptive automation name]"
  trigger:
    - platform: state
      entity_id: sensor.[trigger_entity]
      above: [threshold]
  condition:
    - condition: time
      after: "06:00:00"
      before: "23:00:00"
  action:
    - service: switch.turn_on
      target:
        entity_id: switch.[target_entity]
    - service: notify.mobile_app
      data:
        message: "[Notification text]"
```

---

## 7. "What You Learned" Mapping Template

Every project ends with a concept map connecting hands-on experience to theory:

| Concept | Module Reference | Hands-On Experience | Builds Toward |
|---------|-----------------|--------------------|--------------|
| [Theory concept] | [M1:Section] | [What you did in this project] | [Project N where this matters] |

### Concept Categories

**M1 — Electronics Foundations:**
Ohm's law, Kirchhoff's laws, AC/DC, power calculations, voltage dividers, pull-up resistors, current limiting, transistor switching, PWM, op-amp basics, decoupling, grounding

**M2 — Sensors & Actuators:**
Analog vs. digital sensors, I2C protocol, SPI protocol, 1-Wire protocol, UART, ADC conversion, signal conditioning, relay driving, servo control, stepper control, LED addressing, flyback protection

**M3 — Connectivity & Protocols:**
Wi-Fi connection management, MQTT pub/sub, MQTT topics/QoS, Matter protocol, Zigbee mesh, BLE advertising, HTTP/REST APIs, WebSocket, mDNS, TLS encryption

**M4 — Platforms & Software:**
Home Assistant entities, ESPHome YAML, OTA updates, Lovelace dashboards, automations, Node-RED flows, Docker containers, database backends, voice assistant integration

---

## 8. Tier Progression Map

```
TIER 1: First Steps (No connectivity)
  Arduino + discrete components + serial monitor
  Concepts: GPIO, analog/digital, basic circuits
  Safety: Low voltage only (5V USB)
       |
TIER 2: Getting Connected (Wi-Fi + MQTT)
  ESP32 + Wi-Fi + MQTT broker + basic HA
  Concepts: Networking, pub/sub, JSON, web servers
  Safety: Low voltage + Wi-Fi security
       |
TIER 3: Home Automation (ESPHome + relays)
  ESP32 + ESPHome + relays + HA automations
  Concepts: YAML-as-code, mains switching, PID control
  Safety: MAINS VOLTAGE BEGINS — NEC compliance required
       |
TIER 4: Intermediate Systems (Multi-device)
  Multiple ESP32s + sensors + dashboards
  Concepts: Distributed systems, CT clamps, cameras
  Safety: Current measurement, water/pump systems
       |
TIER 5: Advanced Integration (Mesh + voice + AI)
  RPi + Zigbee mesh + voice + Node-RED
  Concepts: Mesh networking, edge ML, flow programming
  Safety: Complex integrations, solar/battery systems
       |
TIER 6: Capstone (Full system design)
  Complete home automation hub from scratch
  Concepts: System architecture, PCB design, accessibility
  Safety: Full NEC compliance, network security, backup
```

---

## 9. Safety Checklist Template (Per Project)

Every project writeup must pass this checklist before publication:

### Universal Checks (All Projects)

- [ ] Power source clearly identified
- [ ] Current budget calculated (total draw vs. supply capacity)
- [ ] Correct GPIO pin assignments verified against datasheet
- [ ] Decoupling capacitors specified for all ICs
- [ ] Component voltage ratings match circuit voltages

### Mains Voltage Projects (Tier 3+) [SC-MAINS]

- [ ] De-energize protocol stated ("turn off breaker FIRST")
- [ ] Wire gauge specified (14 AWG min for 15A, 12 AWG for 20A)
- [ ] Junction box requirement stated
- [ ] GFCI requirement checked per NEC 210.8
- [ ] NEC Article 725 boundary clearly marked (low-voltage vs. line-voltage)
- [ ] "Consult a licensed electrician" statement present
- [ ] NEC reference citations included [SRC-NFPA]

### Relay/Motor Projects [SC-REL, SC-FLY]

- [ ] Flyback diode specified across every inductive load
- [ ] Transistor/MOSFET driver specified (not direct GPIO)
- [ ] Load current vs. relay contact rating verified
- [ ] Wire gauge matches load current

### Battery Projects [SC-BAT]

- [ ] Charge controller specified (TP4056 + DW01 minimum)
- [ ] Overcharge protection confirmed
- [ ] Over-discharge protection confirmed
- [ ] Thermal protection noted
- [ ] Charging precautions stated

### Wireless Projects [SC-RF]

- [ ] FCC Part 15 compliance noted
- [ ] ISM band operation confirmed
- [ ] Pre-certified modules identified (ESP32 Wi-Fi/BLE is pre-certified)
- [ ] External antenna restrictions noted (if applicable)

### Network-Connected Projects [SC-SEC]

- [ ] Unique password per device
- [ ] Encrypted communication specified (TLS/MQTT encryption/WPA3)
- [ ] VLAN recommendation for IoT devices
- [ ] OTA update mechanism documented
- [ ] Default credential warnings
