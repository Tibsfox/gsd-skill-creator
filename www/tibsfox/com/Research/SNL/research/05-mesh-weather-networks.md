# DIY Mesh Weather Networks

> **Domain:** Distributed Environmental Sensing
> **Module:** 5 -- Sensor Suites, LoRa/Meshtastic Telemetry, NOAA Integration, and Zero-Trust Observation Signing
> **Through-line:** *A single weather station is an anecdote. A mesh of calibrated stations is science.* Consumer weather stations produce data too noisy and too isolated to contribute meaningfully to atmospheric understanding. But a network of cheap, well-placed, well-calibrated nodes -- each cross-referenced against its neighbors and against NOAA reference stations -- collectively sees what no single expensive instrument can. The mesh is the instrument. The protocol that binds it must be zero-trust because the weather does not care about your reputation, only your measurements.

---

## Table of Contents

1. [The Mesh Weather Problem](#1-the-mesh-weather-problem)
2. [Standard Sensor Suite](#2-standard-sensor-suite)
3. [Sensor Calibration Against Reference Stations](#3-sensor-calibration-against-reference-stations)
4. [LoRa Radio Fundamentals](#4-lora-radio-fundamentals)
5. [Meshtastic Weather Integration](#5-meshtastic-weather-integration)
6. [Reference Node Design](#6-reference-node-design)
7. [MQTT and Home Assistant Integration](#7-mqtt-and-home-assistant-integration)
8. [NOAA NWS API Integration](#8-noaa-nws-api-integration)
9. [MeshBot Weather Alerts](#9-meshbot-weather-alerts)
10. [Zero-Trust Observation Signing](#10-zero-trust-observation-signing)
11. [Frog-Chorus Synchronization Protocol](#11-frog-chorus-synchronization-protocol)
12. [Mesh Network Topology Patterns](#12-mesh-network-topology-patterns)
13. [Field Deployment Lessons](#13-field-deployment-lessons)
14. [Cross-References](#14-cross-references)
15. [Sources](#15-sources)

---

## 1. The Mesh Weather Problem

The Pacific Northwest presents unique challenges for distributed weather sensing. Marine air masses from the Pacific collide with the Cascade Range, creating microclimates that can vary by 10+ degrees Fahrenheit over 5 miles of elevation change. NOAA's NEXRAD radar coverage has gaps in the Olympic Mountains and Cascades due to terrain blockage. Official ASOS/AWOS stations are spaced 30-80 km apart -- far too sparse to capture the valley fog, convergence zones, and precipitation gradients that define PNW weather [1][2].

A mesh of DIY weather nodes fills these gaps with hyperlocal observations that complement, not replace, the professional network. The design philosophy is the same as the Amiga Principle: each node does one thing well (measuring its immediate environment), and the mesh protocol handles coordination so no single node is burdened with orchestration.

### Why Mesh, Not Cloud

| Approach | Latency | Privacy | Resilience | Cost/Month |
|---|---|---|---|---|
| Cloud-connected (WeatherUnderground) | 5-30 seconds | Low (data sold) | Internet dependent | $0-5 (hidden in ads) |
| MQTT to local broker | < 1 second | High (local) | LAN only | $0 |
| LoRa mesh (Meshtastic) | 1-5 seconds | High (encrypted) | No internet needed | $0 |
| Hybrid (LoRa + MQTT + API) | 1-30 seconds | Configurable | Multi-path | $0 |

The hybrid approach is the sensing layer's default: LoRa for field-to-gateway, MQTT for gateway-to-dashboard, and NOAA API for calibration reference. No cloud dependency. No data sold. No single point of failure.

---

## 2. Standard Sensor Suite

The GSD weather node sensor suite is designed for comprehensive atmospheric monitoring with redundancy where possible [3][4].

### Primary Sensor Package

| Sensor | Measures | Interface | Accuracy | Price | Notes |
|---|---|---|---|---|---|
| BME280 | Pressure, humidity, temp | I2C/SPI | +/-1 hPa, +/-3% RH, +/-1 C | $3-8 | Primary atmospheric sensor |
| AHT20 | Temperature, humidity | I2C | +/-0.3 C, +/-2% RH | $2-5 | Higher accuracy than BME280 |
| GUVA-S12SD | UV index | Analog | +/-1 UV index | $2-5 | 0.1V per UV index unit |
| SDS011 | PM2.5, PM10 | UART | +/-15 ug/m3 | $15-25 | Laser scattering particulate |
| Davis anemometer | Wind speed/direction | Pulse + ADC | +/-2 mph, +/-7 degrees | $80-150 | Ultrasonic or cup+vane |
| Tipping bucket rain gauge | Precipitation | Interrupt | 0.2 mm per tip | $20-40 | Reed switch per tip |
| DS18B20 | Soil/water temperature | 1-Wire | +/-0.5 C | $1-3 | Waterproof probe version |

### Sensor Redundancy Strategy

For critical measurements, deploy redundant sensors of different types:

- **Temperature:** BME280 + AHT20 + DS18B20 (three independent sensors)
- **Humidity:** BME280 + AHT20 (two independent sensors)
- **Agreement check:** If two of three sensors agree within 1 standard deviation, the third is flagged as potentially faulty

This is the same quorum consensus principle used in BOINC distributed computing -- no single sensor is trusted alone.

---

## 3. Sensor Calibration Against Reference Stations

DIY sensors require calibration against professional reference instruments to be scientifically useful [3][5].

### Calibration Methodology

1. **Identify nearest NOAA reference station:** Use the NWS Station Metadata API to find the closest ASOS/AWOS station with known calibration history.
2. **Co-locate for 72 hours:** Place the DIY node adjacent to the reference station (or as close as access allows).
3. **Compute offset and scale:** Record simultaneous readings and compute:
   - Offset: `cal_offset = mean(reference) - mean(diy)`
   - Scale: `cal_scale = std(reference) / std(diy)`
   - Apply: `calibrated = (raw * cal_scale) + cal_offset`
4. **Ongoing drift monitoring:** Compare against NOAA API data daily. Flag nodes whose offset drifts more than 2 standard deviations from initial calibration.

### MDPI ECAS-7 Validation Study

A peer-reviewed study published in MDPI Environmental and Earth Sciences Proceedings (ECAS-7, 2025) validated this approach. An ESP8266-based meteorological station ran continuously for 696 hours (29 days) and was compared against the INIFAP reference station 13.1 km away. The study found [3]:

- **Temperature:** DIY station tracked reference within +/-0.8 C after calibration
- **Pressure:** Within +/-0.5 hPa (exceeding BME280 specification)
- **Humidity:** 5-8% divergence attributed to geographic variation (distance between stations), not instrument error
- **Conclusion:** The study explicitly validates that humidity differences between stations 13 km apart are real microclimatic variation, not measurement error -- precisely the kind of hyperlocal data that fills gaps in the NOAA network

---

## 4. LoRa Radio Fundamentals

LoRa (Long Range) is the physical layer technology that enables multi-kilometer communication between field nodes at milliwatt power levels [6][7].

### LoRa Physical Parameters

| Parameter | Typical Value | Range |
|---|---|---|
| Frequency | 915 MHz (US/Canada) | 868 MHz (EU), 915 MHz (Americas), 923 MHz (Asia) |
| Bandwidth | 125 kHz, 250 kHz, 500 kHz | Configurable per application |
| Spreading factor | SF7-SF12 | Higher SF = longer range, lower data rate |
| TX power | 14-20 dBm (25-100 mW) | FCC Part 15: max 1W EIRP at 915 MHz |
| Range (line of sight) | 5-15 km | 20+ km reported in optimal conditions |
| Range (urban) | 1-5 km | Building penetration varies |
| Data rate | 0.3-37.5 kbps | SF7/BW500 = 37.5 kbps max |
| Duty cycle | 1% (regulatory typical) | Check local regulations |

### Spreading Factor Tradeoff

| SF | Data Rate (BW125) | Sensitivity | Air Time (50 bytes) | Range | Best For |
|---|---|---|---|---|---|
| SF7 | 5.47 kbps | -123 dBm | 72 ms | 2-5 km | High-frequency telemetry |
| SF8 | 3.13 kbps | -126 dBm | 144 ms | 3-7 km | General weather data |
| SF9 | 1.76 kbps | -129 dBm | 267 ms | 5-10 km | Rural deployments |
| SF10 | 0.98 kbps | -132 dBm | 493 ms | 7-12 km | Mountain-to-valley |
| SF11 | 0.54 kbps | -134.5 dBm | 987 ms | 10-15 km | Emergency backup |
| SF12 | 0.29 kbps | -137 dBm | 1810 ms | 12-20 km | Maximum range, slow |

### LoRa Module: RFM95W

The RFM95W is the standard LoRa module for DIY nodes:

| Parameter | Value |
|---|---|
| Frequency | 915 MHz (US version) |
| TX power | +5 to +20 dBm |
| Sensitivity | -148 dBm (SF12/BW125) |
| Interface | SPI |
| Supply | 1.8-3.7V |
| TX current | 120 mA at +20 dBm |
| Sleep current | 0.2 uA |
| Price | $6-10 |

---

## 5. Meshtastic Weather Integration

Meshtastic is an open-source mesh networking firmware that runs on LoRa-equipped devices, providing encrypted, decentralized communication without any infrastructure [7][8].

### Weather Telemetry Module

Meshtastic includes a built-in weather telemetry module that reads I2C sensors and broadcasts readings to the mesh:

- **Supported sensors:** BME280, BME680, BMP280, MCP9808, INA219, INA260
- **Broadcast interval:** Configurable (default 5 minutes)
- **Packet format:** Protobuf-encoded telemetry with temperature, humidity, pressure, voltage
- **Encryption:** AES-256 channel encryption
- **Mesh routing:** Automatic multi-hop routing to reach distant nodes

### Meshtastic Weather Station Project

The Hackaday.io Meshtastic weather station project (2024) demonstrated a modified Ecowitt WS85 ultrasonic weather station feeding serial data to a Meshtastic LoRa node [8].

**Deployment results from Maui, Hawaii:**
- Withstood daily winds up to 30 mph for one month
- Only issue: minor antenna corrosion from salt air
- Weather packets transmitted reliably over 3-5 km mesh hops
- Battery lasted 14 days on 4400 mAh pack with 5-minute intervals

### RAK WisBlock Weather Platform

The RAK WisBlock system provides modular, snap-together hardware for Meshtastic weather nodes:

| Component | Part Number | Function | Price |
|---|---|---|---|
| Base board | RAK19007 | Main board with USB-C | $15 |
| Core module | RAK4631 | nRF52840 + SX1262 LoRa | $20 |
| Sensor module | RAK1906 | BME680 (temp/hum/press/gas) | $8 |
| GPS module | RAK12500 | u-blox ZED-F9P GNSS | $25 |
| Solar panel | 5.5V 80mA | Charges LiPo | $5 |
| Enclosure | IP67 | Weatherproof | $10 |
| **Total** | | | **~$83** |

---

## 6. Reference Node Design

The complete reference design for a GSD mesh weather node, integrating all components from this module and cross-referencing MCU selection from Module 1 [9].

### Bill of Materials

| Component | Specific Part | Function | Price |
|---|---|---|---|
| MCU | ESP32-S3 DevKit | WiFi + BLE + ADC + I2C/SPI | $12 |
| LoRa radio | RFM95W 915 MHz | Mesh telemetry | $8 |
| Atmospheric sensor 1 | BME280 breakout | Pressure, humidity, temp | $5 |
| Atmospheric sensor 2 | AHT20 breakout | Temp, humidity (redundant) | $3 |
| UV sensor | GUVA-S12SD | UV index (analog) | $3 |
| External ADC | ADS1115 breakout | 16-bit UV + analog sensors | $5 |
| RTC | DS3231 module | Precision timekeeping | $2 |
| Antenna | 915 MHz SMA dipole | LoRa communication | $5 |
| Solar panel | 6V 2W | Harvested power | $5 |
| Charge controller | TP4056 module | Li-ion charging | $1 |
| Battery | 18650 3000 mAh | Energy storage | $5 |
| Enclosure | IP67 junction box | Weatherproofing | $8 |
| PCB / wiring | Custom or perfboard | Interconnect | $3 |
| **Total** | | | **~$65** |

### Power Budget

Using the power analysis from Module 1:

- Average current: 3.76 mA (ESP32 + sensors + LoRa, 5-minute cycle)
- Solar harvest (PNW winter worst case): ~50 mAh/day from 2W panel
- Daily consumption: 3.76 mA * 24h = 90 mAh/day
- **Solar alone is marginal in winter.** Battery backup of 3000 mAh provides 33 days of autonomy. With a 2W panel, the system is self-sustaining from March through October and draws down the battery by ~40 mAh/day in December-January.

### Firmware Architecture

```
WEATHER NODE FIRMWARE ARCHITECTURE
================================================================

  [Main Loop] ─────────────────────────────────────────
      │                                                |
      v                                                |
  [Wake from deep sleep]                               |
      │                                                |
      v                                                |
  [Read sensors: BME280, AHT20, UV, battery V]         |
      │                                                |
      v                                                |
  [Validate readings: range check, redundancy compare] |
      │                                                |
      v                                                |
  [Sign observation packet: ed25519 signature]         |
      │                                                |
      ├──> [LoRa TX: Meshtastic weather telemetry]     |
      │                                                |
      ├──> [WiFi TX: MQTT publish to local broker]     |
      │    (if WiFi available)                         |
      │                                                |
      ├──> [SD card: local log with GPS timestamp]     |
      │    (if SD module present)                      |
      │                                                |
      v                                                |
  [Deep sleep until DS3231 alarm]  <───────────────────
```

---

## 7. MQTT and Home Assistant Integration

MQTT (Message Queuing Telemetry Transport) is the standard protocol for local IoT data aggregation. Home Assistant provides the dashboard and automation layer [10].

### MQTT Topic Structure

```
MQTT TOPIC HIERARCHY
================================================================

gsd/weather/{node_id}/temperature    → 23.4
gsd/weather/{node_id}/humidity       → 67.2
gsd/weather/{node_id}/pressure       → 1013.25
gsd/weather/{node_id}/uv_index      → 3.2
gsd/weather/{node_id}/wind_speed    → 12.4
gsd/weather/{node_id}/wind_dir      → 225
gsd/weather/{node_id}/rain_1h       → 2.4
gsd/weather/{node_id}/pm25          → 8.3
gsd/weather/{node_id}/battery       → 3.82
gsd/weather/{node_id}/rssi          → -72
gsd/weather/{node_id}/signature     → base64(ed25519_sig)
gsd/weather/{node_id}/meta          → {"lat":48.xx,"lon":-122.xx,...}
```

### Home Assistant Integration

Home Assistant auto-discovers MQTT sensors via the MQTT discovery protocol. Each weather node appears as a device with multiple entities (temperature, humidity, etc.). Dashboards, automations, and long-term history recording are built into the platform.

**Recommended deployment:**
- Raspberry Pi 4/5 running Home Assistant OS
- Mosquitto MQTT broker (built-in add-on)
- InfluxDB for long-term time series storage
- Grafana for advanced visualization

---

## 8. NOAA NWS API Integration

The NOAA National Weather Service provides a free, no-authentication-required REST API for weather data across the United States [11].

### API Endpoints

| Endpoint | URL | Returns |
|---|---|---|
| Points | `api.weather.gov/points/{lat},{lon}` | Forecast office, grid, station IDs |
| Observations | `api.weather.gov/stations/{station}/observations/latest` | Current conditions |
| Forecast | `api.weather.gov/gridpoints/{office}/{grid}/forecast` | 7-day forecast |
| Alerts | `api.weather.gov/alerts/active?point={lat},{lon}` | Active weather alerts |
| Stations | `api.weather.gov/stations?state={ST}` | Station metadata |

### Calibration Workflow

```
NOAA CALIBRATION WORKFLOW
================================================================

1. Query /points/{lat},{lon}
   → Get nearest observationStation ID

2. Query /stations/{station}/observations/latest
   → Get reference temperature, humidity, pressure, wind

3. Compare reference to local node readings:
   offset_temp = noaa_temp - node_temp
   offset_press = noaa_press - node_press

4. Apply exponential moving average to offset:
   cal_offset = 0.95 * cal_offset_prev + 0.05 * new_offset

5. Flag drift: if |new_offset - cal_offset| > 3 * sigma
   → Node may need physical recalibration or repair

6. Store calibration in node EEPROM/flash
   → Applied to all subsequent readings
```

### Data Use Agreement

NOAA data is public domain (US government work). No API key required. No rate limiting published, but courtesy limits suggest < 1 request per second. For mesh weather nodes, query the API once per hour from the gateway (not from each field node).

---

## 9. MeshBot Weather Alerts

MeshBot Weather (GitHub: oasis6212) runs on a Raspberry Pi gateway with a Meshtastic radio, providing NOAA EAS (Emergency Alert System) alerts to mesh nodes [12].

### Features

- **NOAA alert forwarding:** Monitors api.weather.gov for active alerts and broadcasts to Meshtastic mesh
- **Multi-day forecast:** Responds to mesh queries with formatted forecast text
- **Hourly conditions:** Current conditions from nearest NOAA station
- **Firewall mode:** Whitelist-only responses (prevents unauthorized mesh queries)
- **Auto-reboot:** Scheduled firmware restart for stability on 24/7 deployment

### Alert Priority Levels

| Alert Type | NOAA Code | MeshBot Action |
|---|---|---|
| Tornado Warning | TOR | Immediate broadcast, high priority |
| Flash Flood Warning | FFW | Immediate broadcast, high priority |
| Severe Thunderstorm Warning | SVR | Immediate broadcast, high priority |
| Winter Storm Warning | WSW | Broadcast at next interval |
| Heat Advisory | HT.Y | Broadcast at next interval |
| Dense Fog Advisory | FG.Y | Broadcast at next interval |
| Air Quality Alert | AQ.Y | Broadcast at next interval |

---

## 10. Zero-Trust Observation Signing

Every weather observation from a GSD mesh node must be cryptographically signed to prevent data spoofing and enable trust scoring in the co-op network [13][14].

### Signing Architecture

```
ZERO-TRUST OBSERVATION SIGNING
================================================================

Node Private Key (ed25519, generated at provisioning)
    │
    v
Observation Packet:
  {
    "node_id": "SNL-A7F3",
    "timestamp": "2026-03-26T14:30:00Z",   (GPS PPS)
    "temp_c": 12.4,
    "humidity_pct": 78.2,
    "pressure_hpa": 1015.3,
    "uv_index": 2.1,
    "cal_ref_station": "KSEA",
    "cal_offset_temp": -0.3,
    "firmware_version": "1.2.0",
    "battery_v": 3.82
  }
    │
    v
ed25519_sign(packet_json, private_key) → signature (64 bytes)
    │
    v
Transmitted: { packet_json, signature, public_key_fingerprint }
    │
    v
Receiver validates:
  1. Verify signature against known public key
  2. Check timestamp against local clock (reject if > 5 minutes stale)
  3. Range-check all values (reject physically impossible readings)
  4. Cross-check against neighbor nodes (flag outliers)
  5. Update node reputation score
```

### Key Management

- **Key generation:** ed25519 key pair generated on first boot; private key stored in flash (ESP32 eFuse for maximum security)
- **Public key distribution:** Public key fingerprint broadcast on mesh; full key available via gateway HTTPS endpoint
- **Key rotation:** Optional annual rotation with overlap period; old key remains valid for 30 days after rotation
- **Revocation:** Gateway maintains a revocation list; compromised nodes are announced to the mesh

### Reputation Scoring

Node reputation is computed from observation consistency:

| Factor | Weight | Scoring |
|---|---|---|
| Agreement with NOAA reference | 30% | Within 2 sigma of reference = full score |
| Agreement with neighbors | 25% | Within 2 sigma of neighbor median = full score |
| Temporal consistency | 20% | No impossible jumps (e.g., 20 C change in 5 minutes) |
| Uptime | 15% | Continuous reporting without gaps |
| Calibration age | 10% | Recently calibrated = full score; degrades over time |

**Reputation decay:** Nodes that stop reporting lose 5% reputation per day of silence. This prevents abandoned nodes with stale calibrations from being trusted indefinitely.

> **Related:** See [BPS](../BPS/) for field sensor trust protocols, [SYS](../SYS/) for node registration infrastructure, [K8S](../K8S/) for distributed trust computation.

---

## 11. Frog-Chorus Synchronization Protocol

Inspired by the natural synchronization of Pacific chorus frogs (Pseudacris regilla), where hundreds of individual callers self-organize into coordinated rhythms without a conductor, the frog-chorus protocol enables distributed weather nodes to synchronize their sampling times without a central coordinator [15].

### Natural Inspiration

Pacific chorus frogs synchronize their calls through a simple rule: each frog listens to its neighbors and adjusts its call timing to avoid overlap. This produces the characteristic alternating chorus patterns heard in PNW wetlands from January through July. The mathematical model is a coupled oscillator system -- the same mathematics used for firefly synchronization and wireless sensor network time synchronization.

### Protocol

1. Each node has a nominal sampling interval (e.g., 300 seconds)
2. When a node receives a neighbor's observation packet, it notes the timestamp
3. If the neighbor sampled within 30 seconds of when this node plans to sample, this node shifts its next sample by +/- 15 seconds (randomly chosen)
4. Over multiple cycles, nodes naturally spread their sampling times to avoid collisions
5. The mesh achieves temporal diversity: observations from different nodes are staggered, providing higher effective temporal resolution than any single node

### Benefit

A mesh of 10 nodes each sampling every 5 minutes, but staggered by ~30 seconds, provides an observation approximately every 30 seconds -- 10x the temporal resolution of any individual node, without increasing any node's power consumption.

---

## 12. Mesh Network Topology Patterns

### Topology Options

| Topology | Description | Range | Reliability | Complexity |
|---|---|---|---|---|
| Star | All nodes to single gateway | 1 hop max | Low (single point of failure) | Simple |
| Line/chain | Each node relays to next | Multi-hop | Medium (any break kills chain) | Medium |
| Mesh | Every node relays for every other | Multi-hop | High (multiple paths) | High |
| Hybrid star-mesh | Multiple gateways, mesh between | Multi-hop | Highest | Highest |

### Meshtastic Mesh Routing

Meshtastic implements flooding-based mesh routing:

1. When a node transmits, all nodes within radio range receive the packet
2. Each receiver checks if it has seen this packet before (by hash)
3. If not seen, the receiver rebroadcasts after a random delay (0-100 ms)
4. Packets propagate through the mesh until all nodes have received them or the hop limit is reached
5. Default hop limit: 3 (can be increased for large meshes)

### Range Planning for PNW Terrain

| Terrain | Expected Range (SF10, 915 MHz) | Notes |
|---|---|---|
| Open water (Puget Sound) | 10-20 km | Near-optimal; wave reflection helps |
| Flat agricultural valley | 5-10 km | Terrain dependent; trees attenuate |
| Forested ridge to valley | 3-8 km | Trees attenuate 5-15 dB |
| Dense urban | 1-3 km | Buildings, multipath |
| Canyon/valley floor | 0.5-2 km | Terrain blockage; may need relay |

---

## 13. Field Deployment Lessons

Lessons from real-world mesh weather deployments [8][9][16].

### Environmental Protection

- **UV degradation:** Plastic enclosures (ABS, polycarbonate) degrade in PNW UV within 1-2 years. Use UV-resistant materials or UV-stable paint.
- **Condensation:** Temperature cycling causes internal condensation. Include desiccant packets and ventilation holes (covered with Gore-Tex membrane).
- **Lightning:** Exposed antennas on ridgetops attract lightning. Install a lightning arrestor on the antenna feed line and ground the mast.
- **Wildlife:** Squirrels chew antenna cables. Bears investigate interesting boxes. Route cables in conduit. Mount equipment above bear reach (3+ meters) or in bear-resistant enclosures.

### Common Failure Modes

| Failure | Cause | Prevention |
|---|---|---|
| Battery death in winter | Insufficient solar, high sleep current | Larger battery; verify deep sleep current |
| Sensor drift | Aging, contamination, moisture | Annual recalibration; redundant sensors |
| LoRa range loss | Vegetation growth, antenna corrosion | Annual antenna inspection; trim line of sight |
| SD card corruption | Power loss during write | Use wear-leveling filesystem; flush after each write |
| WiFi credential loss | Flash corruption | Store credentials in multiple locations; fallback to LoRa |

> **SAFETY WARNING:** Field weather stations with solar panels and batteries contain stored energy. A short-circuited 18650 cell can deliver 20A and ignite combustible material. Always include a fuse between battery and circuit. Store batteries in fireproof enclosures when possible. Never leave lithium batteries charging unattended during initial deployment.

---

## 14. Cross-References

> **Related:** [BPS](../BPS/) -- field sensor deployment patterns, environmental enclosures, and multi-node coordination. [ECO](../ECO/) -- ecological monitoring applications that consume mesh weather data for habitat assessment. [SYS](../SYS/) -- gateway infrastructure including MQTT broker, NTP server, and data pipeline configuration. [SGL](../SGL/) -- signal processing algorithms for weather data analysis. [T55](../T55/) -- GPS PPS timing integration for precision-timestamped observations. [EMG](../EMG/) -- emergency alert distribution via mesh networks. [SHE](../SHE/) -- environmental shelter design for outdoor weather station enclosures. [LED](../LED/) -- POV and LED display of live weather conditions at field stations. [K8S](../K8S/) -- container orchestration for mesh weather data processing pipelines. [PSS](../PSS/) -- power system design for solar-powered field nodes. [AWF](../AWF/) -- wildfire weather monitoring applications.

---

## 15. Sources

1. NOAA NWS Seattle (2025): "Western Washington Climate Summary and Radar Coverage." weather.gov/sew
2. NOAA (2025): "MADIS -- Meteorological Assimilation Data Ingest System." madis.ncep.noaa.gov
3. MDPI ECAS-7 (2025): "Low-Cost ESP8266 Meteorological Station: 696-Hour Validation Study." Environmental and Earth Sciences Proceedings.
4. Bosch Sensortec (2024): "BME280 Combined Humidity and Pressure Sensor Datasheet." bosch-sensortec.com
5. WMO (2024): "Guide to Meteorological Instruments and Methods of Observation, WMO-No. 8." wmo.int
6. Semtech (2025): "LoRa Technology Overview." semtech.com/lora
7. Meshtastic Project (2025): "Meshtastic Documentation -- Weather Telemetry." meshtastic.org/docs/configuration/module/telemetry
8. Hackaday.io (2024): "Meshtastic Weather Station -- Ecowitt WS85 Integration." hackaday.io
9. FabAcademy 2025 / Dezséri, P.: "Mesh Weather Station with LoRa and SmartCitizen." fabacademy.org
10. Home Assistant (2025): "MQTT Integration Documentation." home-assistant.io/integrations/mqtt/
11. NOAA NWS (2025): "Weather.gov API Documentation." weather-gov.github.io/api/general-faqs.html
12. oasis6212 (2025): "MeshBot Weather -- Meshtastic Weather Bot for Raspberry Pi." github.com/oasis6212/meshbot-weather
13. Bernstein, D.J. et al. (2012): "High-Speed High-Security Signatures." ed25519.cr.yp.to
14. BOINC Project (2025): "Quorum-Based Validation for Volunteer Computing." boinc.berkeley.edu
15. Strogatz, S.H. (2003): "Sync: How Order Emerges from Chaos in the Universe, Nature, and Daily Life." Hyperion. Chapter 1: Fireflies and Frog Choruses.
16. alessandro308 (2024): "MeshWeather -- Mesh Network Arduino Weather Analysis." github.com/alessandro308/MeshWeather
17. HopeRF (2024): "RFM95W LoRa Transceiver Module Datasheet." hoperf.com
18. Eclipse Foundation (2025): "Mosquitto MQTT Broker Documentation." mosquitto.org
