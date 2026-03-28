# DIY RF & Computing Builds

> **Domain:** Practical Electronics & RF Engineering
> **Module:** 3 -- Build Specifications for Grassroots Signal Infrastructure
> **Through-line:** *A Raspberry Pi, a software-defined radio dongle, and a rooftop antenna array can do things in 2026 that would have required a broadcast engineering degree in 1975 -- and the FCC rules that make it legal are hiding in plain sight in Title 47.* This module provides complete, FCC-compliant build specifications for four grassroots signal infrastructure projects: a low-power AM station, an SDR monitoring rig, a mesh network node, and a solar-powered weather station with mesh uplink.

---

## Table of Contents

1. [The Grassroots Infrastructure Thesis](#1-the-grassroots-infrastructure-thesis)
2. [Build 1: Low-Power AM Station (Part 15.219)](#2-build-1-low-power-am-station-part-15219)
3. [Build 2: SDR Monitoring Rig](#3-build-2-sdr-monitoring-rig)
4. [Build 3: AREDN Mesh Network Node](#4-build-3-aredn-mesh-network-node)
5. [Build 4: Solar Weather Station with Mesh Uplink](#5-build-4-solar-weather-station-with-mesh-uplink)
6. [HAM Radio Licensing Pathway](#6-ham-radio-licensing-pathway)
7. [FCC Compliance Verification](#7-fcc-compliance-verification)
8. [Power Systems for Off-Grid Deployment](#8-power-systems-for-off-grid-deployment)
9. [Integration Patterns](#9-integration-patterns)
10. [Safety Considerations](#10-safety-considerations)
11. [Cross-References](#11-cross-references)
12. [Sources](#12-sources)

---

## 1. The Grassroots Infrastructure Thesis

The premise of grassroots signal infrastructure is that the tools for building local communications networks have become affordable, accessible, and -- critically -- legal for ordinary citizens to deploy without commercial licenses. The convergence of three trends makes this possible [1]:

1. **Hardware commoditization:** RTL-SDR dongles cost approximately $25. Raspberry Pi 4B boards cost $35-55. ESP32 microcontrollers cost $3-10. Complete mesh nodes can be built for under $100.
2. **Open-source software:** GNU Radio, SDR#, GQRX, AREDN firmware, OpenWRT, and dozens of other projects provide broadcast-quality signal processing on commodity hardware.
3. **Regulatory clarity:** FCC Part 15 rules, the amateur radio licensing pathway, and LPFM provisions create well-defined legal channels for community signal infrastructure.

```
GRASSROOTS SIGNAL INFRASTRUCTURE STACK
================================================================
Layer 4: DATA SERVICES
  Weather data | Sensor networks | Emergency messaging

Layer 3: MESH NETWORKING
  AREDN (HAM) | OpenWRT mesh | LoRa/LoRaWAN

Layer 2: SIGNAL MONITORING
  SDR receive | Spectrum analysis | ADS-B tracking

Layer 1: LOCAL BROADCASTING
  Part 15 AM | Part 15 FM | LPFM (licensed)

Layer 0: POWER
  Solar panels | LiFePO4 batteries | Grid backup
================================================================
```

Each build in this module targets a specific layer of this stack. Together, they demonstrate that a small community can construct a vertically integrated signal infrastructure for under $1,000 in hardware costs, using entirely legal means.

> **FCC COMPLIANCE NOTE:** All builds in this module are designed to comply with current FCC rules. Builds 1 and 2 require no FCC license. Build 3 (AREDN mesh) operates on amateur frequencies and requires at minimum a Technician-class amateur radio license. Build 4 uses unlicensed ISM frequencies for its data uplink. Any modifications that increase power output, antenna height, or operating frequency beyond the parameters specified here may require additional FCC authorization.

---

## 2. Build 1: Low-Power AM Station (Part 15.219)

### Regulatory Basis

47 CFR Section 15.219 permits unlicensed AM transmission under the following constraints [2]:

- Maximum transmitter input power to final RF stage: **100 milliwatts** (0.1 watts)
- Maximum total antenna system length (including transmission line, antenna element, and ground lead): **3 meters** (approximately 10 feet)
- Frequency range: 510-1705 kHz
- No FCC equipment authorization required for personal builds (up to 5 units per Section 15.23)
- Content restrictions: None. Advertising is permitted.

### Bill of Materials

| Component | Specification | Est. Cost |
|-----------|--------------|-----------|
| AM transmitter kit | Hamilton Rangemaster AM-1000 or equivalent | $60-120 |
| Crystal oscillator | Frequency-specific for target AM channel | $5-15 |
| Antenna wire | 14 AWG copper, ~3 meters total | $5 |
| Ground rod | 4-foot copper-clad steel | $15 |
| Ground wire | 10 AWG copper, 6 feet | $5 |
| Audio source | 3.5mm line-level input (phone, mixer, PC) | existing |
| Power supply | 12V DC regulated, 500mA | $10-15 |
| Enclosure | Weather-resistant project box | $10 |
| **Total** | | **~$110-185** |

### Antenna System Design

The 3-meter limit is the critical constraint. A typical Part 15 AM antenna system consists of:

```
PART 15.219 ANTENNA SYSTEM (3 meters total)
================================================================

  Loading coil (optional, improves efficiency)
       |
  ┌────┴────┐
  │ Antenna │ ← Vertical wire or whip, ~1.5m
  │ element │
  └────┬────┘
       │
  Feedpoint ← Connection to transmitter output
       │
  ┌────┴────┐
  │  Ground │ ← Ground wire to rod, ~1.5m
  │  system │
  └────┬────┘
       │
  Ground rod (4 ft copper-clad, driven into earth)

  Total: antenna + feedline + ground lead <= 3 meters
================================================================
```

At AM broadcast frequencies (535-1705 kHz), wavelengths range from 560 meters to 176 meters. A 3-meter antenna is therefore 0.5% to 1.7% of a wavelength -- extraordinarily electrically short. This severe mismatch means the antenna's radiation resistance is a fraction of an ohm, and the ground system's quality dominates overall efficiency [3].

### Practical Performance

Published builds using Hamilton Rangemaster-type transmitters report:

| Terrain | Daytime Range | Nighttime Range |
|---------|--------------|-----------------|
| Suburban (average soil) | 0.25-0.75 miles | 0.1-0.3 miles |
| Rural (good soil) | 0.5-2 miles | 0.25-1 mile |
| Urban (poor soil, high noise) | 100-500 feet | 50-200 feet |

The nighttime range reduction occurs because distant AM stations produce skywave signals (reflected off the ionosphere) that raise the noise floor on the AM band significantly after sunset [3].

### Operating Guidelines

1. **Frequency selection:** Choose a frequency not occupied by local AM stations. Use the FCC AM Query tool (fcc.gov/media/radio/am-query) to find clear channels in your area.
2. **Audio quality:** Use a compressor/limiter on the audio input to maintain consistent modulation depth. Target 85-95% modulation for maximum loudness within legal power limits.
3. **Antenna optimization:** A good ground system is more important than antenna length. Add radial wires if possible (stay within 3-meter total system length).
4. **Identification:** While not legally required for Part 15, periodic station identification is good practice and builds community identity.

> **SAFETY WARNING:** AM transmitter circuits operate at RF voltages that can cause burns. The final amplifier stage, even at 100 mW, develops voltages of 20-50V at the antenna feedpoint. Use appropriate RF safety practices during construction and testing.

---

## 3. Build 2: SDR Monitoring Rig

### System Overview

A Software-Defined Radio (SDR) monitoring rig converts RF signals to digital samples for computer-based analysis. The SDR approach replaces traditional hardware receivers with software signal processing, allowing a single device to receive any frequency within its tuning range [4].

### Bill of Materials

| Component | Specification | Est. Cost |
|-----------|--------------|-----------|
| RTL-SDR Blog V4 | RTL2832U + R828D, 24-1766 MHz | $30 |
| HackRF One (optional) | 1 MHz - 6 GHz, TX capable | $300 |
| Discone antenna | Diamond D130J or homebrew, 25-1300 MHz | $80-150 |
| Coax cable | RG-6 or LMR-240, 25-50 feet | $20-40 |
| USB extension cable | Active USB 3.0, 15 feet | $15 |
| Raspberry Pi 4B (4GB) | Headless SDR server | $55 |
| MicroSD card | 32GB Class 10 | $10 |
| Weatherproof box | For outdoor Pi + SDR | $15 |
| **Total (basic)** | | **~$225-315** |
| **Total (with HackRF)** | | **~$525-615** |

### Legal Monitoring Capabilities

All reception is legal. The following signals can be monitored in the PNW without any license [4]:

| Signal Type | Frequency | Notes |
|-------------|-----------|-------|
| AM broadcast | 530-1710 kHz | Commercial AM stations |
| FM broadcast | 88-108 MHz | Commercial/public FM stations |
| Aircraft ADS-B | 1090 MHz | Aircraft position/altitude transponders |
| NOAA weather satellite (APT) | 137 MHz | Polar-orbiting weather satellite imagery |
| NOAA Weather Radio | 162.400-162.550 MHz | Automated severe weather alerts |
| Marine AIS | 161.975/162.025 MHz | Ship identification and tracking |
| HAM VHF repeaters | 144-148 MHz | Amateur radio conversations |
| HAM UHF repeaters | 420-450 MHz | Amateur radio conversations |
| Railroad communications | ~160-162 MHz | Railroad dispatch (varies) |
| Pager traffic | 929-932 MHz | POCSAG/FLEX pager signals |
| Public safety (P25) | 700/800 MHz | Police/fire/EMS digital trunked |
| FM RBDS/RDS | 57 kHz subcarrier on FM | Station ID, song titles |

### Software Stack

```
SDR SOFTWARE STACK
================================================================
APPLICATION LAYER
  ├── SDR# (Windows) — General-purpose SDR receiver
  ├── GQRX (Linux/Mac) — Qt-based SDR receiver
  ├── CubicSDR (cross-platform) — Waterfall + demod
  ├── dump1090 — ADS-B aircraft tracking
  ├── rtl_433 — ISM band sensor decoding
  ├── WXtoImg — NOAA APT satellite image decoder
  └── DSD+ — Digital voice decoder (P25, DMR)

MIDDLEWARE
  ├── GNU Radio — Signal processing framework
  ├── SoapySDR — Hardware abstraction layer
  └── rtl_tcp — Network SDR sharing server

DRIVER LAYER
  ├── librtlsdr — RTL-SDR USB driver
  ├── libhackrf — HackRF driver
  └── SoapyRemote — Network SDR client
================================================================
```

### Antenna Design: Discone

The discone antenna is the optimal wideband receive antenna for a monitoring rig. It provides approximately 2 dBi gain across a 10:1 frequency range (e.g., 100 MHz to 1 GHz for a typical 25-element design) [5].

```
DISCONE ANTENNA (side view)
================================================================

       Disc elements (8-16 radials, horizontal)
       ─────────/\─────────
              /    \
             /  Gap \  ← Feed point (coax center → disc,
            /   2mm  \    coax shield → cone)
           / ────────  \
          /              \
         /   Cone elements \
        /  (8-16 radials,   \
       /    45° downward)    \
      /                       \
     /                         \
    ────────────────────────────

    Total height: ~0.6m for 100MHz+
    Impedance: ~50 ohms (matches coax)
    Gain: ~2 dBi across 10:1 bandwidth
================================================================
```

### ADS-B Aircraft Tracking Setup

ADS-B (Automatic Dependent Surveillance-Broadcast) reception is one of the most immediately rewarding SDR applications. Commercial aircraft broadcast their position, altitude, speed, and identification on 1090 MHz using Mode S transponders [4].

Setup steps:
1. Install `dump1090-fa` on Raspberry Pi
2. Connect RTL-SDR with 1090 MHz bandpass filter
3. Mount antenna with clear sky view
4. Access web interface at `http://pi-address:8080`
5. Optional: feed data to FlightAware/FlightRadar24 for free premium accounts

Typical PNW reception range: 150-250 nautical miles with a rooftop antenna, capturing aircraft over the Puget Sound, Cascade Range, and into British Columbia/Oregon airspace.

> **Related:** [Aerial Network Infrastructure](04-aerial-network-infrastructure.md) for HAPS and aerostat platforms that complement ground-based SDR monitoring, [SGL](../SGL/page.html?doc=01-real-time-dsp-algorithms) for DSP algorithms underlying SDR demodulation

---

## 4. Build 3: AREDN Mesh Network Node

### Regulatory Basis

AREDN (Amateur Radio Emergency Data Network) nodes operate on amateur radio frequencies and **require at minimum a Technician-class amateur radio license** (FCC Part 97). AREDN uses modified commercial Wi-Fi hardware operating on:

- **2.4 GHz band (Part 97):** Wider channels (up to 20 MHz) and higher power than Part 15 Wi-Fi
- **5 GHz band (Part 97):** Extended frequency range with higher allowed power
- **900 MHz band (Part 97):** Excellent foliage penetration for PNW forest environments

### Bill of Materials

| Component | Specification | Est. Cost |
|-----------|--------------|-----------|
| Mikrotik hAP ac lite | AREDN-supported dual-band router | $50 |
| OR: Ubiquiti NanoStation M5 | 5 GHz point-to-multipoint | $80 |
| OR: GL.iNet GL-B1300 | 802.11ac, AREDN firmware | $60 |
| Ethernet cable (outdoor) | Cat6 shielded, 50 feet | $25 |
| PoE injector | 24V passive or 802.3af | $15 |
| Weatherproof enclosure | NEMA 4X rated | $20 |
| Mounting hardware | Pole mount bracket, U-bolts | $15 |
| **Total per node** | | **~$125-155** |

### Network Topology

```
AREDN MESH TOPOLOGY (minimum viable network)
================================================================

      [Node A]                          [Node B]
      Hospital ←───── RF Link ─────→ Fire Station
      2.4/5 GHz                       2.4/5 GHz
         |                               |
         |  LAN Clients:                 |  LAN Clients:
         |  - VoIP phone                 |  - VoIP phone
         |  - Web server                 |  - IP camera
         |  - File share                 |  - Weather data
         |                               |
         └──────── RF Link ──────────────┘
                      |
                 [Node C]
                 EOC / Ham Shack
                 2.4/5 GHz
                    |
                 LAN Clients:
                 - Gateway to internet
                 - Mesh status dashboard
                 - NTP time server

  Minimum 3 nodes creates self-healing mesh
  Each node routes traffic automatically via OLSR protocol
================================================================
```

AREDN uses the Optimized Link State Routing (OLSR) protocol to automatically discover neighbors, calculate routes, and re-route traffic if a node fails. The mesh is self-healing: if the direct link between Node A and Node B fails, traffic automatically routes through Node C [6].

### Deployment Considerations for PNW

The Pacific Northwest's heavy tree canopy and rainfall present specific challenges for mesh networking:

- **5 GHz signals** attenuate significantly through wet foliage. Expect 10-20 dB additional loss compared to clear-air conditions during heavy rain.
- **900 MHz signals** penetrate foliage significantly better than 2.4 or 5 GHz, making 900 MHz nodes valuable in forested PNW environments.
- **Antenna height** is critical. Mounting antennas above the tree canopy (typically 40-80 feet in PNW conifer forests) dramatically improves link quality.
- **Solar-powered nodes** must account for PNW's limited winter solar: Seattle averages 1.5-2.5 peak sun hours/day in December-January [7].

---

## 5. Build 4: Solar Weather Station with Mesh Uplink

### System Overview

A solar-powered rooftop weather station provides continuous environmental monitoring data transmitted via mesh or Wi-Fi uplink. The system generates valuable community data while demonstrating off-grid power autonomy [8].

### Bill of Materials

| Component | Specification | Est. Cost |
|-----------|--------------|-----------|
| Davis Vantage Pro2 | Professional weather sensor suite | $400-600 |
| OR: SwitchDoc Pi Weather Board | Raspberry Pi HAT + sensors | $100-150 |
| Raspberry Pi 4B (2GB) | Data logger and mesh uplink | $45 |
| Solar panel | 20W monocrystalline, 12V | $30 |
| Charge controller | PWM or MPPT, 5A | $15-35 |
| LiFePO4 battery | 12V 12Ah (EVE cells or pre-built) | $40-80 |
| Weatherproof enclosure | UV-resistant, ventilated | $25 |
| USB-C PD trigger board | 5V 3A from 12V battery | $8 |
| Mounting pole | 1.5" galvanized steel, 8-10 feet | $25 |
| **Total** | | **~$290-870** |

### Sensor Package

| Sensor | Range | Resolution | Update Rate |
|--------|-------|------------|-------------|
| Temperature | -40 to +65C | 0.1C | 2.5 sec |
| Relative humidity | 0-100% | 1% | 2.5 sec |
| Barometric pressure | 540-1100 hPa | 0.1 hPa | 1 min |
| Wind speed | 0-89 m/s | 0.4 m/s | 2.5 sec |
| Wind direction | 0-360 degrees | 1 degree | 2.5 sec |
| Rainfall | 0-999.8 mm | 0.2 mm | per tip |
| UV index | 0-16 | 0.1 | 1 min |
| Solar radiation | 0-1800 W/m2 | 1 W/m2 | 1 min |

### Power Budget

| Component | Active Power | Sleep Power | Daily Energy |
|-----------|-------------|-------------|-------------|
| Raspberry Pi 4B | 3.0 W | 0.5 W (halt) | 72 Wh |
| Davis console | 0.3 W | 0.3 W | 7.2 Wh |
| Mesh radio (if AREDN) | 5.0 W | 0.5 W | 120 Wh (reduced duty) |
| Wi-Fi uplink (if 802.11) | 0.5 W | 0.1 W | 12 Wh |
| **Total (Wi-Fi mode)** | **3.8 W** | | **~91 Wh/day** |
| **Total (mesh mode)** | **8.3 W** | | **~199 Wh/day** |

### Solar Sizing for PNW

PNW solar sizing must account for the region's notoriously cloudy winters [7]:

| Season | Peak Sun Hours/Day (Seattle) | 20W Panel Output | Margin (Wi-Fi mode) |
|--------|------------------------------|-------------------|---------------------|
| June-August | 5.5-6.5 | 110-130 Wh | +19 to +39 Wh |
| March-May | 3.5-4.5 | 70-90 Wh | -21 to -1 Wh |
| Sept-Nov | 2.0-3.5 | 40-70 Wh | -51 to -21 Wh |
| Dec-Feb | 1.5-2.5 | 30-50 Wh | -61 to -41 Wh |

A 12 Ah LiFePO4 battery at 12V stores 144 Wh, providing approximately 38 hours of autonomy in Wi-Fi mode without any solar input. For continuous year-round operation in the PNW, a 50W panel and 20 Ah battery is recommended to survive extended overcast periods in December-January.

### Data Pipeline

```
WEATHER DATA PIPELINE
================================================================
Sensors → Davis Console → Serial/USB → Raspberry Pi
                                           |
                                    Python/weewx
                                           |
                    +----------+-----------+----------+
                    |          |           |          |
              InfluxDB    Weather     MQTT       CSV
              /Grafana    Underground Broker     Archive
              (local)     (cloud)    (mesh)    (SD card)
================================================================
```

> **Related:** [BPS (Bio-Physics Sensors)](../BPS/) for expanded sensor network architectures, [SYS (Systems Administration)](../SYS/) for data infrastructure and Grafana dashboards

---

## 6. HAM Radio Licensing Pathway

### Overview

The amateur radio licensing pathway is the most powerful spectrum access available to individual PNW residents. Three progressive license classes provide increasing frequency access and operating privileges [9].

### Technician Class (Entry Level)

- **Exam:** 35 multiple-choice questions from published pool (passing: 26/35)
- **Study time:** 2-4 weeks for most people
- **Cost:** Exam fee ~$15 (ARRL VE sessions), FCC application fee $35
- **Privileges:** All amateur VHF/UHF bands (50 MHz and above), limited HF privileges on 80m, 40m, 15m, 10m (CW only on 80/40/15; all modes on 10m)
- **PNW use cases:** Local repeater operation, AREDN mesh networking, satellite communication, emergency service (ARES/RACES)

### General Class (Intermediate)

- **Exam:** 35 multiple-choice questions (passing: 26/35), must hold Technician
- **Study time:** 4-8 weeks beyond Technician material
- **Cost:** Same exam fee structure
- **Privileges:** Most HF bands (worldwide communication), all VHF/UHF
- **PNW use cases:** HF communication across the Cascades and to Alaska, long-range emergency communication, digital modes (FT8, JS8Call)

### Amateur Extra (Full Access)

- **Exam:** 50 multiple-choice questions (passing: 37/50), must hold General
- **Study time:** 6-12 weeks beyond General material
- **Cost:** Same exam fee structure
- **Privileges:** All amateur bands, all modes, all power levels (up to 1500 W PEP)
- **PNW use cases:** DX (long-distance) contesting, experimental modes, full spectrum access for research

### PNW Exam Sessions

Regular VE exam sessions are held at:

| Location | Frequency | Organization |
|----------|-----------|-------------|
| Seattle (multiple) | Monthly | ARRL VE teams, various clubs |
| Tacoma | Monthly | Tacoma Radio Club |
| Olympia | Monthly | Capital Peak Repeater Group |
| Bellevue | Monthly | Eastside VE team |
| Portland | Monthly | ARRL Oregon Section |
| Spokane | Monthly | Prior Electronics / Spokane ARC |
| Online (remote) | Continuous | ARRL, GLAARG, W5YI VE teams |

---

## 7. FCC Compliance Verification

Each build in this module requires compliance verification against specific FCC rules:

| Build | Applicable Rule | Key Limits | Verification Method |
|-------|----------------|------------|---------------------|
| AM Station | 47 CFR 15.219 | 100 mW input, 3m antenna system | Power meter at PA output, tape measure for antenna |
| SDR Rig | N/A (receive-only) | Reception is legal; no transmission | Verify no transmit capability (RTL-SDR is receive-only) |
| AREDN Mesh | 47 CFR Part 97 | Amateur license required, ID every 10 min | Valid callsign programmed, AREDN auto-ID configured |
| Weather Station | 47 CFR 15.247 | ISM band limits for Wi-Fi uplink | Commercial Wi-Fi equipment (pre-certified) |

> **FCC COMPLIANCE NOTE:** The HackRF One is transmit-capable from 1 MHz to 6 GHz. Transmission on any frequency without appropriate authorization (Part 15 compliance, amateur license, or other FCC license) is a federal violation. The HackRF should be used for receive-only monitoring unless the operator holds appropriate licenses and understands the power limits for each band.

---

## 8. Power Systems for Off-Grid Deployment

### LiFePO4 Battery Chemistry

Lithium Iron Phosphate (LiFePO4) is the preferred battery chemistry for PNW outdoor deployments due to [10]:

- **Cycle life:** 2000-5000 charge cycles (vs. 300-500 for lead-acid)
- **Temperature range:** Charges at 0-45C, discharges at -20 to 60C
- **Flat discharge curve:** Maintains ~3.2V/cell across 80% of capacity
- **Safety:** No thermal runaway risk (unlike LiPo/Li-ion)
- **Weight:** ~60% lighter than equivalent lead-acid capacity

### Solar Charge Controller Selection

For PNW conditions, an MPPT (Maximum Power Point Tracking) controller provides 15-30% more energy harvest than PWM controllers, particularly valuable during partial-cloud conditions common in the Pacific Northwest [10]:

| Controller Type | Efficiency | Cost | Best For |
|----------------|-----------|------|----------|
| PWM | 75-80% | $10-25 | Systems under 50W |
| MPPT | 94-98% | $30-100 | Systems 50W+, partial cloud |

---

## 9. Integration Patterns

### Pattern 1: Community Broadcast + Mesh

A Part 15 AM station broadcasts local content (community announcements, emergency information, cultural programming) while an AREDN mesh node at the same site provides bidirectional IP data services. The AM station serves listeners with legacy receivers; the mesh node serves devices [11].

### Pattern 2: SDR Monitoring + Weather Data

An SDR monitoring rig feeds ADS-B aircraft data, NOAA weather satellite imagery, and local signal analysis to the weather station's data pipeline. All data flows through the mesh network to a community dashboard accessible via any web browser [4].

### Pattern 3: Emergency Communications Stack

During a Cascadia Subduction Zone earthquake or other disaster that disables cellular and internet infrastructure:

```
EMERGENCY COMMUNICATIONS STACK
================================================================
Layer 4: AM broadcast → audible status updates to public
Layer 3: AREDN mesh → IP networking between EOCs, hospitals
Layer 2: SDR monitoring → situational awareness, EAS relay
Layer 1: Weather station → environmental hazard monitoring
Layer 0: Solar + battery → 72+ hours grid-independent operation
================================================================
```

---

## 10. Safety Considerations

### Electrical Safety

| Hazard | Context | Mitigation |
|--------|---------|------------|
| RF burns | AM transmitter feedpoint (20-50V RF) | Insulate antenna feedpoint, no touching during operation |
| Mains voltage | AC power supplies | Use properly rated enclosures, GFCI protection |
| Battery short | LiFePO4 cells (high discharge current) | Fuse all battery connections, use BMS |
| Lightning | Outdoor antennas | Lightning arrestor at building entry, ground all coax shields |

### Antenna Safety

- All outdoor antenna installations must comply with local building codes
- Antennas should be installed away from power lines (minimum 10 feet clearance from any utility conductor)
- Rooftop installations require appropriate fall protection
- Guy wires on tall masts must be properly tensioned and visible (flagging tape)

> **SAFETY WARNING:** Lightning strikes are a genuine hazard for elevated antenna systems in the PNW, particularly during autumn and winter thunderstorm activity. Install lightning arrestors at the point where coaxial cable enters the building, and disconnect antennas during electrical storms.

---

## 11. Cross-References

- **SGL (Signal & Light):** DSP algorithms for SDR demodulation and signal processing
- **RBH:** Regulatory history context for Part 15 and amateur radio rules
- **FCC:** Federal Communications Commission licensing and equipment authorization
- **BPS (Bio-Physics Sensors):** Sensor network architectures using ISM bands
- **LED:** Part 15 wireless control protocols for lighting
- **T55:** Microcontroller programming (ESP32, RP2040) for sensor nodes
- **SYS (Systems Administration):** Data infrastructure for weather station backends
- **PSG:** Signal propagation modeling for mesh network planning
- **K8S:** Container orchestration for distributed sensor data processing

---

## 12. Sources

1. RTL-SDR Blog. *About RTL-SDR.* rtl-sdr.com. SDR hardware capabilities and applications.
2. Federal Communications Commission. *47 CFR Part 15, Section 15.219.* AM broadcast band unlicensed operation rules.
3. REC Networks. *Part 15 AM Broadcasting FAQ.* recnet.com. Practical Part 15 AM station performance data.
4. Ossmann, Michael. *HackRF One Documentation.* greatscottgadgets.com. SDR hardware specifications and legal use guidelines.
5. ARRL. *The ARRL Antenna Book.* 24th Edition, 2019. Discone antenna design and wideband receive antenna theory.
6. AREDN Project. *Getting Started with AREDN.* arednmesh.org. Mesh network deployment, OLSR routing, node configuration.
7. National Renewable Energy Laboratory. *PVWatts Calculator.* pvwatts.nrel.gov. PNW solar insolation data and panel sizing.
8. Davis Instruments. *Vantage Pro2 Specifications.* davisinstruments.com. Weather station sensor specifications and data interfaces.
9. ARRL. *Getting Your Ham Radio License.* arrl.org/getting-licensed. License classes, exam procedures, study resources.
10. Battle Born Batteries. *LiFePO4 Battery Technology Guide.* battlebornbatteries.com. LiFePO4 chemistry, cycle life, temperature range specifications.
11. AREDN Project. *Emergency Communications Deployment Guide.* arednmesh.org. Mesh network emergency deployment patterns.
12. GNU Radio Project. *GNU Radio Documentation.* gnuradio.org. Open-source signal processing framework.
13. Federal Communications Commission. *47 CFR Part 15, Section 15.23.* Home-built devices: up to 5 units without equipment authorization.
14. ARRL. *Part 15 Radio Frequency Devices.* arrl.org/part-15-radio-frequency-devices. Practical Part 15 compliance guidance.
15. Prometheus Radio Project. *Build a Radio Station.* prometheusradio.org. Community radio advocacy and technical resources.
16. SwitchDoc Labs. *WeatherPi Solar Weather Station.* switchdoc.com. Raspberry Pi weather station integration guide.
