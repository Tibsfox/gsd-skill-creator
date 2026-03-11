# Module 6: Safety, Standards & Security

Electrical codes, IoT security, RF compliance, battery safety, and network protection. Every safety callout across all modules traces to the standards documented here.

---

## 1. Electrical Safety — NEC Fundamentals

### 1.1 The National Electrical Code (NEC/NFPA 70)

The NEC is the United States standard for safe electrical installation, adopted by nearly all state and local jurisdictions. Updated every three years — current edition is 2023 (2026 in development). It is not a design guide; it is a minimum safety standard. [SRC-NFPA]

**Key NEC articles for smart home projects:**

| Article | Subject | Smart Home Relevance |
|---------|---------|---------------------|
| 210.8 | GFCI Protection | Required in kitchens, baths, garages, outdoors, basements, laundry rooms — anywhere moisture is present. Any smart device in these locations must be on a GFCI circuit. |
| 230.67 | Surge Protection | SPD (Surge Protective Device) now required for dwelling unit services. Protects smart devices from power surges. |
| 230.85 | Emergency Disconnect | Exterior emergency disconnect required. Relevant for solar+battery systems (Project 29). |
| 314.16 | Box Fill | Maximum conductor fill for junction boxes. Adding smart switches to existing boxes must not exceed fill limits. |
| 334 | NM Cable (Romex) | Standard residential wiring. 14 AWG for 15A, 12 AWG for 20A circuits. |
| 404.2(C) | Grounded Conductors at Switches | Neutral wire required at switch locations (since NEC 2011). Smart switches that need neutral benefit from this requirement. |
| 725 | Class 2 Circuits | **THE critical article.** Defines boundary between low-voltage (Class 2, under 24V) and line-voltage circuits. Smart home sensors operate as Class 2; relay load sides may be line-voltage. Class 2 and line-voltage wiring must be physically separated. |

### 1.2 Low-Voltage vs. Line-Voltage: NEC Article 725

This is the most important code concept for DIY smart home projects. [SRC-NFPA, SRC-NEC-725]

**Class 2 circuits (SAFE for students):**
- Maximum 24V DC (or 30V AC) per NEC Table 725.121
- Limited power (0.5-100 VA depending on source)
- All microcontroller circuits, sensor wiring, LED strips (5V/12V)
- Thermostat wiring (24V AC, Class 2)
- Low-voltage relay coils (5V DC)
- Do NOT require conduit, specific wire types, or junction boxes (though good practice)

**Line-voltage circuits (REQUIRES electrical knowledge):**
- 120V/240V AC mains power
- Relay load contacts switching mains circuits
- Hardwired smart switches replacing traditional switches
- Any conductor carrying mains potential
- MUST comply with NEC: junction boxes, wire gauge, GFCI, proper connectors

**The boundary:** A relay creates a Class 2/line-voltage boundary. The coil side (5V, controlled by microcontroller) is Class 2. The contact side (switching 120V AC) is line-voltage. These two sides MUST be physically separated — they cannot share the same raceway, cable, or enclosure section unless the enclosure is rated for both with a barrier. [SRC-NFPA]

### 1.3 GFCI Requirements (NEC 210.8)

Ground-Fault Circuit Interrupter protection detects current imbalance between hot and neutral (as little as 4-6 mA — current flowing through an unintended path, possibly a person) and trips in 4-6 milliseconds. [SRC-NFPA, SRC-NEC-210]

**Required locations (residential, NEC 2023):**
- Kitchens (all countertop receptacles)
- Bathrooms (all receptacles)
- Garages and accessory buildings
- Outdoors (all receptacles)
- Crawl spaces and unfinished basements
- Laundry areas
- Within 6 feet of a sink (any room)
- Boathouses and boat hoists

**Smart home implication:** Any smart device installed in these locations MUST be on a GFCI-protected circuit. This includes: bathroom humidity sensors, kitchen smart plugs, garage door controllers, outdoor weather stations, basement servers.

### 1.4 Box Fill Calculations (NEC 314.16)

When adding a smart switch or relay module inside an existing junction box, the total conductor fill must not exceed the box's rated volume.

**Simplified counting (14 AWG = 2 cubic inches each):**
- Each conductor entering the box: 1 count
- All ground wires combined: 1 count
- Each device yoke (switch/outlet): 2 counts
- Each cable clamp (internal): 1 count
- Total count x 2 cubic inches must not exceed box volume

**Common box sizes:** Single-gang old-work box: 20.3 cu. in. (typically holds 9 conductors at 14 AWG). If the box is already full, adding smart switch wiring may require a larger box. [SRC-NFPA, SRC-NEC-314]

### 1.5 Wire Gauge and Circuit Protection

| Wire Gauge (AWG) | Max Ampacity | Circuit Breaker | Common Use |
|------------------|-------------|----------------|-----------|
| 14 AWG | 15A | 15A | General lighting, receptacles |
| 12 AWG | 20A | 20A | Kitchen, bathroom, garage |
| 10 AWG | 30A | 30A | Dryer, large appliances |
| 8 AWG | 40A | 40A | Range |
| 6 AWG | 55A | 50A | EV charging (NEMA 14-50) |

**The rule:** Wire gauge must match or exceed the circuit breaker rating. A 15A breaker uses 14 AWG minimum. A 20A breaker uses 12 AWG minimum. Never put a larger breaker on smaller wire — the wire overheats before the breaker trips. [SRC-NFPA]

---

## 2. IoT Security Standards

### 2.1 ETSI EN 303 645

The European standard for baseline security of consumer IoT devices. Widely adopted as a reference standard globally. 13 provisions plus 5 data protection provisions. [SRC-ETSI]

**Key requirements relevant to student projects:**
1. No universal default passwords (each device must have a unique credential)
2. Implement a means to manage vulnerability reports
3. Keep software updated (OTA update capability)
4. Securely store sensitive security parameters (credentials, keys)
5. Communicate securely (encrypted connections)
6. Minimize exposed attack surfaces (disable unused services)
7. Ensure software integrity (verify firmware before installation)
8. Ensure personal data is protected
9. Make systems resilient to outages (local fallback operation)

**Student project application:** Even for learning projects, implement: unique passwords per device, encrypted communication (ESPHome API encryption, MQTT TLS), OTA updates with authentication, and disable unused network services.

### 2.2 OWASP IoT Top 10

The Open Web Application Security Project's top 10 IoT vulnerability categories. [SRC-OWASP]

| # | Vulnerability | Student Project Mitigation |
|---|--------------|---------------------------|
| I1 | Weak/guessable/hardcoded passwords | Use `!secret` in ESPHome, unique per device |
| I2 | Insecure network services | Disable telnet, unnecessary HTTP endpoints |
| I3 | Insecure ecosystem interfaces | Encrypt HA access (HTTPS), secure MQTT (TLS) |
| I4 | Lack of secure update mechanism | Use ESPHome OTA with password |
| I5 | Use of insecure/outdated components | Regular updates, monitor CVE notices |
| I6 | Insufficient privacy protection | Local-only processing, no cloud dependencies |
| I7 | Insecure data transfer/storage | MQTT with TLS, encrypted HA database |
| I8 | Lack of device management | HA device registry, firmware version tracking |
| I9 | Insecure default settings | Change all defaults, disable AP fallback in production |
| I10 | Lack of physical hardening | Secure enclosures, no exposed debug ports |

### 2.3 UL 2900 Series

UL Solutions' cybersecurity standard for network-connectable products. The UL Verified IoT Device Security Rating evaluates products against common attack vectors. While formal UL certification is beyond student projects, understanding the evaluation criteria teaches security thinking. [SRC-UL]

**Evaluated categories:**
- Software binary analysis for known vulnerabilities
- Malware and virus scanning
- Security risk assessment per ETSI EN 303 645
- Sensitivity analysis of known CVEs
- Static and dynamic code analysis

### 2.4 Network Security for Smart Home

**VLAN Segmentation:** Place all IoT devices on a separate VLAN from computers and phones. If a smart device is compromised, it cannot access personal data on the main network. Most managed switches and advanced consumer routers (UniFi, pfSense) support VLANs.

**VLAN architecture:**
```
VLAN 1 (Management):     Router, switches, access points
VLAN 10 (Trusted):       Computers, phones, tablets
VLAN 20 (IoT):           ESP32 devices, cameras, smart plugs
VLAN 30 (Guest):         Guest Wi-Fi
VLAN 40 (Servers):       Home Assistant, NAS, Mosquitto

Rules:
- IoT VLAN can reach Mosquitto (MQTT) and HA only
- IoT VLAN has no internet access (optional, prevents cloud calling)
- Trusted VLAN can reach all VLANs
- Guest VLAN has internet only, no local access
```

**Encrypted MQTT:** Mosquitto with TLS on port 8883. Generate certificates:
```bash
# CA certificate
openssl req -new -x509 -days 3650 -keyout ca.key -out ca.crt
# Server certificate
openssl req -new -keyout server.key -out server.csr
openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -out server.crt
```

**WPA3:** Use WPA3 Personal (SAE) for the IoT Wi-Fi network if hardware supports it. WPA3 provides stronger authentication and prevents offline dictionary attacks.

**Firmware update hygiene:** Schedule monthly updates for: HAOS, Mosquitto, Zigbee2MQTT, Node-RED, ESPHome device firmware. Subscribe to security advisories for each platform. [SRC-OWASP, SRC-ETSI]

---

## 3. RF Compliance

### 3.1 FCC Part 15 — Radio Frequency Devices

All radio transmitters in the US must comply with FCC Part 15 (or be specifically licensed). Smart home devices operate under Part 15 as unlicensed intentional radiators in ISM (Industrial, Scientific, Medical) bands. [SRC-FCC]

**ISM bands used in smart home:**

| Band | Frequency | Protocols | FCC Limits |
|------|-----------|-----------|-----------|
| 900 MHz ISM | 902-928 MHz | Z-Wave (908.42), LoRa (915) | 1W EIRP (frequency hopping) |
| 2.4 GHz ISM | 2.400-2.4835 GHz | Wi-Fi, BLE, Zigbee, Thread | 1W EIRP (point-to-multipoint) |
| 5 GHz U-NII | 5.150-5.825 GHz | Wi-Fi 5/6 | 1W EIRP (varies by sub-band) |

**Pre-certified modules:** The ESP32-WROOM-32E, Raspberry Pi Wi-Fi modules, CC2652, and commercial Zigbee/Z-Wave devices are FCC pre-certified. Using these modules in student projects complies with FCC requirements without additional testing. [SRC-FCC, SRC-ESP32]

**External transmitters:** If adding an external 433 MHz transmitter or LoRa module, the combination (module + antenna) must not exceed FCC limits. Default power settings on commercial modules are within limits. Do not modify antenna systems or increase transmit power beyond module defaults. [SRC-FCC]

**Duty cycle:** Some ISM bands have duty cycle limits (percentage of time transmitting). LoRa has a 1% duty cycle limit in the EU (no strict limit in US 915 MHz band, but good practice). Wi-Fi and BLE self-regulate through CSMA/CA.

### 3.2 Antenna Considerations

- Pre-certified modules include matched antennas — do not replace with higher-gain antennas
- External antenna modifications may void FCC certification
- For PCB designs: follow module manufacturer's antenna layout guidelines exactly
- Keep antenna areas clear of ground planes and other components

---

## 4. Battery Safety

### 4.1 Lithium-Ion Chemistry

Li-ion cells (18650, LiPo) store significant energy in a compact package. This makes them useful for battery-powered sensor nodes but also creates safety risks if mishandled. [SRC-ESP32]

**Hazards:**
- **Overcharge (>4.2V):** Electrolyte decomposition, gas generation, thermal runaway
- **Over-discharge (<2.5V):** Internal copper dissolution, dendrite formation, short circuit on next charge
- **Short circuit:** Rapid uncontrolled discharge (10+ amps), extreme heating
- **Physical damage:** Puncture or crush can cause internal short circuit
- **Thermal abuse:** Temperatures above 60C accelerate degradation; above 130C can trigger thermal runaway

### 4.2 Protection Circuits

> **SAFETY BLOCK [SC-BAT]:** Every lithium-ion battery circuit MUST include a charge controller with overcharge, over-discharge, and short-circuit protection. TP4056 with DW01 protection IC is the minimum acceptable protection. Never charge lithium cells without a proper controller. Never leave charging batteries unattended. Store in a fireproof container during charging. [SRC-ESP32]

**TP4056 + DW01 module:**
- TP4056: Constant-current/constant-voltage charger (CC/CV). Charges at up to 1A, terminates at 4.2V.
- DW01: Protection IC. Disconnects load at 2.4V (over-discharge), disconnects charger at 4.28V (overcharge), disconnects on short circuit (30A threshold).
- FS8205A: Dual MOSFET switch controlled by DW01. Actually disconnects the battery.

**Verification:** When purchasing TP4056 modules, verify the DW01 IC is present (8-pin chip on the PCB). Some ultra-cheap modules omit the protection circuit — these are UNSAFE for lithium batteries.

**Battery holder safety:**
- Use spring-contact holders (not soldered tabs) for replaceable cells
- Ensure correct polarity marking
- Add a fuse (1A fast-blow) in series for additional protection
- Never carry loose 18650 cells in pockets (short circuit risk from keys/coins)

---

## 5. The Six Safety Rules

These rules are referenced throughout all modules and must appear in every project involving the corresponding hazard.

### Rule 1: De-Energize Before Wiring [SC-MAINS]

Never work on circuits connected to mains power. Always disconnect power at the breaker before any wiring. Verify with a multimeter that voltage is zero. Lock out the breaker if others have access to the panel. Test your multimeter on a known-live circuit before and after to confirm the meter is working. [SRC-NFPA, SRC-ESFI]

**Projects requiring this rule:** 13, 14, 18, 19, 29, 31, 35

### Rule 2: Use Properly Rated Components [SC-REL]

A relay rated for 10A at 250VAC does not mean the wiring is rated for 10A. Wire gauge must match the circuit breaker rating: 14 AWG for 15A, 12 AWG for 20A. Verify EVERY component in the power path is rated for the load: relay contacts, wire gauge, connectors, junction box. [SRC-NFPA]

**Projects requiring this rule:** 13, 14, 18, 19, 23, 29, 35

### Rule 3: Flyback Diodes for Inductive Loads [SC-FLY]

Relay coils, solenoids, motors, and speakers are inductive loads. When current through an inductor is suddenly interrupted, the collapsing magnetic field generates a voltage spike (potentially hundreds of volts). A flyback diode (1N4007) placed across the inductor (cathode to positive) provides a safe path for this energy. Without it, the spike destroys transistors and MOSFETs. [SRC-ETUT]

**Projects requiring this rule:** 9, 13, 14, 15, 16, 18, 23 — every relay and motor project

### Rule 4: Battery Protection [SC-BAT]

Lithium batteries require charge controllers with overcharge, over-discharge, and thermal protection. TP4056 with DW01 protection IC is the minimum. Never charge without a controller. Never leave charging unattended. Store in fireproof container.

**Projects requiring this rule:** 11, 30, and any battery-powered design

### Rule 5: RF Compliance [SC-RF]

RF transmitters must comply with FCC Part 15 (ISM bands, power limits, duty cycle). The ESP32's built-in Wi-Fi and BLE are pre-certified. External 433 MHz and LoRa transmitters must operate within legal limits. Do not modify antennas or increase transmit power. [SRC-FCC]

**Projects requiring this rule:** All wireless projects (7-36)

### Rule 6: Professional Boundaries [SC-MAINS]

When in doubt, ask a licensed electrician. NEC compliance is not optional for permanent installations. A student project on a breadboard is experimental. Wiring it into a wall is construction — and construction has codes, permits, and professional licensing requirements. Know the boundary between learning and installation. [SRC-NFPA, SRC-ESFI]

**Projects requiring this rule:** 13, 14, 18, 19, 29, 31, 35

---

## 6. Safety Callout Summary

### Safety-Critical Tests

| ID | Test | Verifies | Expected |
|----|------|----------|----------|
| SC-SRC | Source quality | All claims traceable to standards bodies or datasheets | No entertainment/blog-only citations for safety claims |
| SC-NUM | Numerical attribution | Every resistance, voltage, current, frequency cited with source | All values attributable |
| SC-SAF | Mains safety | Projects involving 120V/240V AC include explicit warnings | De-energize, NEC refs, "consult electrician" |
| SC-BAT | Battery safety | Li-ion projects specify charge controller | TP4056 + DW01 minimum |
| SC-FLY | Flyback diodes | Relay/motor circuits include flyback diode in BOM and schematic | 1N4007 across every inductive load |
| SC-REL | Relay ratings | Load current and wire gauge verified against relay rating | Rating match confirmed |
| SC-RF | RF compliance | Wireless projects reference FCC Part 15 | Pre-certified modules identified |
| SC-SEC | Network security | Internet-connected projects specify encryption | TLS/WPA3, unique passwords |

### Module-to-Safety Mapping

| Module | Safety Concerns | Rules |
|--------|----------------|-------|
| M1: Electronics | Current limiting, power dissipation, mains voltage | Rules 1, 2, 3 |
| M2: Sensors/Actuators | Relay driving, flyback, motor safety, battery | Rules 2, 3, 4 |
| M3: Connectivity | Wi-Fi security, RF compliance, encrypted comms | Rules 5, 6 |
| M4: Platforms | OTA security, API encryption, network isolation | Rule 6, SC-SEC |
| M5: Projects | All above, applied to specific builds | All rules per project |
| M6: Safety | Master reference for all above | Defines all rules |

---

## 7. Standards Quick Reference

| Standard | Organization | Edition | Scope |
|----------|-------------|---------|-------|
| NFPA 70 (NEC) | NFPA | 2023 | Electrical installation safety |
| ETSI EN 303 645 | ETSI | 2020 v2.1.1 | Consumer IoT cybersecurity |
| UL 2900 | UL Solutions | Series | Network-connectable product security |
| OWASP IoT Top 10 | OWASP | 2018 | IoT vulnerability categories |
| FCC Part 15 | FCC | Current | Unlicensed radio frequency devices |
| IEEE 1584 | IEEE | 2018 | Arc-flash hazard calculations |
| IEEE 1100 | IEEE | 2005 | Powering/grounding electronic equipment |
| Matter v1.5 | CSA | Nov 2025 | Smart home interoperability |
| MQTT v5.0 | OASIS | Mar 2019 | Messaging protocol |
| Thread 1.4 | Thread Group | Current | Mesh networking |
