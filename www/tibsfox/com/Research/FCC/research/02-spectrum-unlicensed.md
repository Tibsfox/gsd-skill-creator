# Spectrum & Unlicensed Operations

> **Domain:** RF Spectrum Management and Unlicensed Device Regulation
> **Module:** 2 -- Part 2 Frequency Allocations, Part 15 Radio Frequency Devices, Part 18 ISM
> **Through-line:** *Part 15 is the most practically impactful regulation in Title 47 for technology builders. It governs every WiFi chip, every Bluetooth module, every IoT sensor, every garage door opener, and every mesh network node sold in the United States. Understanding Part 15 is not optional -- it is the compliance floor for every device that radiates RF energy without a license.*

---

## Table of Contents

1. [Part 2: The Master Frequency Allocation Table](#1-part-2-the-master-frequency-allocation-table)
2. [Allocation Categories](#2-allocation-categories)
3. [Part 15: Overview and Scope](#3-part-15-overview-and-scope)
4. [Part 15 Subpart Architecture](#4-part-15-subpart-architecture)
5. [Unlicensed Band Catalog](#5-unlicensed-band-catalog)
6. [Device Authorization Paths](#6-device-authorization-paths)
7. [Class A vs. Class B Distinction](#7-class-a-vs-class-b-distinction)
8. [Part 5: Experimental Radio Service](#8-part-5-experimental-radio-service)
9. [Part 18: ISM Equipment](#9-part-18-ism-equipment)
10. [The 6 GHz Expansion (2026)](#10-the-6-ghz-expansion-2026)
11. [Spread Spectrum and Digital Modulation Rules](#11-spread-spectrum-and-digital-modulation-rules)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. Part 2: The Master Frequency Allocation Table

Part 2 (Sections 2.1--2.1207) contains the US Table of Frequency Allocations, which is the master plan governing all radio spectrum use in the United States from 3 kHz to 300 GHz. It codifies the International Telecommunication Union (ITU) Radio Regulations as applied domestically, with modifications reflecting US-specific allocations [1].

The table is divided into two columns: federal (administered by NTIA) and non-federal (administered by FCC). A third column shows ITU Region 2 (Americas) allocations for international coordination. Footnotes -- numbered in the hundreds -- carry significant operational weight, often defining sharing conditions, power limits, and geographic restrictions.

```
FREQUENCY ALLOCATION TABLE STRUCTURE
================================================================

  Frequency Band    | Federal (NTIA)      | Non-Federal (FCC)
  -----------------------------------------------------------------
  902-928 MHz       | RADIOLOCATION (S)   | ISM / Part 15
  2400-2483.5 MHz   | (shared)            | ISM / Part 15
  5150-5250 MHz     | AERONAUTICAL (P)    | U-NII-1 (Part 15E)
  5250-5350 MHz     | RADIOLOCATION (P)   | U-NII-2A (Part 15E, DFS)
  5725-5850 MHz     | RADIOLOCATION (P)   | ISM / U-NII-3
  5925-7125 MHz     | FIXED / MOBILE      | U-NII-5/6/7/8 (2024/2026)

  (P) = Primary allocation
  (S) = Secondary allocation
  ISM = Industrial, Scientific, Medical (Part 18)
```

### Key Structural Elements

- The US Table spans 3 kHz to 300 GHz in defined band segments
- Bands are designated as Primary, Secondary, or Non-Interference allocations
- Federal and non-federal allocations are shown in separate columns
- US footnotes (format: US-NNN) carry regulatory weight equal to the allocation itself
- International footnotes (format: 5.NNN) reflect ITU coordination obligations

---

## 2. Allocation Categories

The frequency allocation system uses three priority levels that determine operational rights [1]:

**Primary:** The service has first right to the frequency. Other services must not cause harmful interference to the primary service and cannot claim protection from it.

**Secondary:** The service may operate but must not cause harmful interference to primary services and cannot claim protection from primary service interference.

**Non-Interference:** The most restrictive; the service must accept any interference from primary and secondary services and must cease operation if interference is detected.

Part 15 unlicensed devices operate under the most restrictive conditions: Section 15.5 states that "the operator of an intentional or unintentional radiator shall be required to cease operating the device upon notification by a Commission representative that the device is causing harmful interference" [2]. This is the regulatory compact that enables license-free operation -- you may transmit freely within defined power limits, but you accept all interference and must stop if you cause interference to licensed services.

---

## 3. Part 15: Overview and Scope

Part 15 is among the most practically impactful regulations in Title 47. It governs devices that radiate RF energy without an individual operator license. Nearly every consumer electronics device sold in the United States must comply with Part 15 before sale or advertisement [2].

The foundational principles of Part 15 are established in Subpart A (Sections 15.1--15.38):

- **Section 15.1:** Defines scope -- Part 15 covers intentional radiators, unintentional radiators, and incidental radiators
- **Section 15.3:** Definitions -- critical terms including "intentional radiator," "digital device," "harmful interference"
- **Section 15.5:** General conditions -- the operator must accept interference and cease operation if causing interference
- **Section 15.15:** General technical requirements -- emission limits, measurement procedures
- **Section 15.19:** Labeling requirements for Part 15 devices

> **SAFETY WARNING:** Operating an unlicensed device that exceeds Part 15 power limits creates federal interference liability regardless of intent. The FCC's Enforcement Bureau has authority to issue Notices of Apparent Liability (NAL) with fines up to $100,000 per violation under 47 U.S.C. Section 503(b). Intentional interference with licensed radio services is a federal criminal offense under 47 U.S.C. Section 333.

---

## 4. Part 15 Subpart Architecture

Part 15 has grown to eleven subparts reflecting the expanding universe of unlicensed device categories [2]:

| Subpart | Coverage | Sections | Key Devices |
|---------|----------|----------|-------------|
| A | General provisions, definitions, authorization | 15.1--15.38 | All Part 15 devices |
| B | Unintentional radiators (digital devices) | 15.101--15.125 | Computers, monitors, peripherals |
| C | Intentional radiators (transmitters) | 15.201--15.259 | WiFi, Bluetooth, Zigbee, LoRa |
| D | Unlicensed personal communications services | 15.301--15.323 | Cordless telephones (legacy) |
| E | Unlicensed National Information Infrastructure (U-NII) | 15.401--15.407 | 5 GHz / 6 GHz WiFi |
| F | Ultra-wideband (UWB) operation | 15.501--15.525 | UWB radar, positioning, AirTag |
| G | Access broadband over power line (BPL) | 15.601--15.615 | Broadband over power lines |
| H | Television band devices (white space) | 15.701--15.717 | TV white space database devices |
| I | Dedicated short-range communications (DSRC) | 15.801--15.809 | Vehicle-to-vehicle (legacy, transitioning to C-V2X) |
| J | Medical body area networks (MBANs) | 15.901--15.909 | Medical telemetry wearables |
| K | Received signal strength indicators | 15.1000--15.1009 | RSSI reporting devices |

Subparts B and C are the workhorses: Subpart B governs every computer, monitor, and peripheral device (unintentional radiators), while Subpart C governs every intentional transmitter -- WiFi routers, Bluetooth headphones, Zigbee sensors, LoRa modules, and mesh network nodes.

---

## 5. Unlicensed Band Catalog

The following table catalogs the primary unlicensed bands under Part 15, with power limits and common uses [2] [3]:

| Band | Frequency Range | Max EIRP | Subpart | Common Use |
|------|----------------|----------|---------|------------|
| ISM 900 MHz | 902--928 MHz | 1 W (FHSS), 30 dBm (digital) | C | LoRa, Zigbee, FHSS devices, Z-Wave |
| 2.4 GHz ISM | 2400--2483.5 MHz | 1 W (FHSS/DSSS), 30 dBm | C | WiFi 802.11b/g/n/ax, Bluetooth, Zigbee |
| 5 GHz U-NII-1 | 5150--5250 MHz | 200 mW (1 W with TPC) | E | Indoor WiFi 802.11a/ac/ax; indoor only |
| 5 GHz U-NII-2A | 5250--5350 MHz | 200 mW (1 W with TPC) | E | Indoor WiFi; DFS required (radar avoidance) |
| 5 GHz U-NII-2C | 5470--5725 MHz | 200 mW (1 W with TPC) | E | Indoor/outdoor WiFi; DFS required |
| 5 GHz U-NII-3 | 5725--5850 MHz | 1 W (4 W with directional antenna) | E | Outdoor WiFi; point-to-point links |
| 6 GHz U-NII-5 | 5925--6425 MHz | 30 dBm (indoor standard power) | E | WiFi 6E / WiFi 7; indoor standard power |
| 6 GHz U-NII-6 | 6425--6525 MHz | 30 dBm | E | WiFi 6E / WiFi 7 |
| 6 GHz U-NII-7 | 6525--6875 MHz | 30 dBm | E | WiFi 6E / WiFi 7 |
| 6 GHz U-NII-8 | 6875--7125 MHz | 30 dBm | E | WiFi 6E / WiFi 7 |
| 60 GHz | 57--71 GHz | 40 dBm EIRP | C | WiGig 802.11ad/ay; short-range, high-throughput |

### DFS (Dynamic Frequency Selection) Requirement

Bands U-NII-2A (5250--5350 MHz) and U-NII-2C (5470--5725 MHz) are shared with federal radar systems. Devices operating in these bands must implement DFS: continuous monitoring for radar signatures and automatic channel evacuation within defined time limits (Channel Availability Check time: 60 seconds; Channel Move Time: 10 seconds; Channel Closing Transmission Time: 200 milliseconds). DFS-required devices must also implement TPC (Transmit Power Control) [4].

---

## 6. Device Authorization Paths

Part 15 defines three paths to market for devices that radiate RF energy [2] [5]:

```
FCC DEVICE AUTHORIZATION DECISION TREE
================================================================

Does the device intentionally transmit RF energy?
|
+-- YES --> Intentional radiator (Subparts C, D, E, F, G, H, I, J)
|           Authorization: CERTIFICATION required
|           Must be tested by FCC-accredited TCB
|           Grants FCC ID (format: GRANTEE-CODE + EQUIPMENT-CODE)
|           Database searchable at fccid.io and apps.fcc.gov
|
+-- NO  --> Does it generate unintentional RF emissions?
                +-- YES: Digital device (Subpart B)
                |        Authorization: Supplier's Declaration of Conformity (SDoC)
                |        Self-certification; manufacturer retains test records
                |        No FCC ID; uses "responsible party" designation
                |
                +-- NO: Incidental radiator (non-digital)
                         Exempt from authorization
                         Still must not cause harmful interference
```

### Certification (TCB Process)

Intentional radiators must undergo testing by an FCC-accredited Telecommunications Certification Body (TCB). The TCB evaluates the device against applicable technical standards, issues a grant of equipment authorization, and assigns an FCC ID. The FCC ID is a unique alphanumeric string: the first 3-5 characters identify the grantee (manufacturer), the remaining characters identify the specific product. Every certified device is entered into the FCC Equipment Authorization Database [5].

The certification process involves several measurement categories:

| Test Category | Standard | What Is Measured |
|---------------|----------|-----------------|
| Conducted emissions | ANSI C63.10 | RF energy conducted back through power and data lines |
| Radiated emissions | ANSI C63.10 | RF energy radiated through the air at specified distances |
| Spurious emissions | Section 15.209 | Out-of-band emissions that could interfere with other services |
| Band edge compliance | Section 15.247/407 | Emissions at the edge of authorized operating bands |
| DFS compliance (5 GHz) | KDB 905462 D02 | Radar detection, channel vacate time, aggregation |
| RF exposure (SAR) | OET 65 | Specific absorption rate for portable devices near the body |

The FCC maintains a list of accredited TCBs at apps.fcc.gov/oetcf/tcb/index.cfm. Major TCBs include TUV Rheinland, UL (Underwriters Laboratories), Intertek, and Bureau Veritas. The average time from test submission to FCC ID grant is 2-4 weeks for a straightforward certification.

### Supplier's Declaration of Conformity (SDoC)

Unintentional radiators (computers, monitors, printers, peripherals) use the self-certification path. The manufacturer or importer ("responsible party") conducts or commissions testing to verify compliance with Subpart B emission limits, retains records, and declares conformity. No FCC ID is issued; the device must be labeled with the responsible party's name and a statement that it complies with Part 15 [5].

---

## 7. Class A vs. Class B Distinction

Part 15 Subpart B defines two classes of digital devices with different emission limits [2]:

**Class B:** The more stringent standard. Applies to devices marketed for use in a residential environment (home, apartment, dormitory). Examples: personal computers, tablets, smartphones, home networking equipment, consumer printers.

**Class A:** Less stringent limits. Applies to devices marketed for use in a commercial, industrial, or business environment only. Examples: server rack equipment, industrial controllers, commercial networking gear.

The distinction matters for compliance: a Class A device used in a residential setting can create interference liability for the operator. The Class A label typically includes the statement: "This equipment has been tested and found to comply with the limits for a Class A digital device... These limits are designed to provide reasonable protection against harmful interference when the equipment is operated in a commercial environment. Operation of this equipment in a residential area is likely to cause harmful interference."

| Parameter | Class A (Commercial) | Class B (Residential) |
|-----------|---------------------|----------------------|
| Conducted emissions (0.15-0.5 MHz) | 79 dBuV (quasi-peak) | 66 dBuV (quasi-peak) |
| Conducted emissions (0.5-30 MHz) | 73 dBuV (quasi-peak) | 60 dBuV (quasi-peak) |
| Radiated emissions (30-88 MHz) at 10m | 49.5 dBuV/m | 40 dBuV/m |
| Radiated emissions (88-216 MHz) at 10m | 54 dBuV/m | 43.5 dBuV/m |
| Radiated emissions (216-960 MHz) at 10m | 56.9 dBuV/m | 46 dBuV/m |
| Radiated emissions (above 960 MHz) at 10m | 60 dBuV/m | 54 dBuV/m |

---

## 8. Part 5: Experimental Radio Service

Part 5 provides a pathway for operating radio equipment outside the normal rules for purposes of experimentation, product development, and market trials [6]. Three license types exist:

- **Conventional Experimental License:** For specific experiments with defined parameters. Most common path for hardware prototyping that exceeds Part 15 limits.
- **Broadcast Experimental License:** For broadcast-related experiments.
- **Program Experimental License:** Broader scope; covers multiple experiments under a single license. Available to qualified institutions.

Part 5 is the safety valve for innovation: when a builder needs to test a device that does not yet comply with Part 15 (or any other Part), an experimental license provides legal authorization for development and testing. The application is filed through the FCC's Universal Licensing System (ULS).

---

## 9. Part 18: ISM Equipment

Part 18 covers equipment that uses RF energy for purposes other than communication: microwave ovens, RF welders, ultrasonic cleaners, medical diathermy machines, and industrial heating equipment [7].

ISM bands are internationally designated by the ITU:

| Band | Frequency | Primary ISM Use |
|------|-----------|-----------------|
| 6.78 MHz | 6.765--6.795 MHz | Industrial RF heating |
| 13.56 MHz | 13.553--13.567 MHz | RFID, NFC, industrial |
| 27.12 MHz | 26.957--27.283 MHz | Industrial, medical |
| 40.68 MHz | 40.66--40.70 MHz | Industrial |
| 915 MHz | 902--928 MHz | Microwave ovens (industrial) |
| 2.45 GHz | 2.400--2.500 GHz | Microwave ovens (consumer) |
| 5.8 GHz | 5.725--5.875 GHz | Industrial |
| 24.125 GHz | 24.0--24.25 GHz | Industrial sensors |

The overlap between ISM bands and Part 15 unlicensed bands is deliberate: the 2.4 GHz and 5.8 GHz ISM bands are the same bands where WiFi operates. ISM equipment operates on a non-interference basis from licensed users but may create interference that Part 15 devices must tolerate.

---

## 10. The 6 GHz Expansion (2026)

At the FCC's January 29, 2026 Open Meeting, the Commission voted on a Fourth Report and Order expanding unlicensed operations in the 6 GHz band (5925--7125 MHz). The order permits a new class of geofenced variable power (GVP) unlicensed devices that operate outdoors at higher power levels than previously authorized [8].

### Timeline of 6 GHz Unlicensed Access

- **April 2020:** FCC opens lower 6 GHz (U-NII-5, 5925--6425 MHz) for indoor low-power and standard-power unlicensed devices
- **October 2024:** Additional 6 GHz spectrum opened under specific conditions (very low power devices)
- **January 2026:** GVP order enables outdoor higher-power operation with AFC (Automated Frequency Coordination) protection of incumbent fixed microwave links

### GVP Device Class

GVP devices must:
- Query an Automated Frequency Coordination (AFC) system before transmitting outdoors
- Operate at power levels determined by the AFC system based on geographic location
- Reduce power or cease operation when the AFC system indicates potential interference with incumbent microwave links
- Support geolocation with accuracy sufficient for AFC coordination

This expansion is significant for WiFi 6E and WiFi 7 deployments: the full 1200 MHz of 6 GHz spectrum (5925--7125 MHz) is now available for outdoor use, dramatically expanding the available bandwidth for mesh networking and high-throughput wireless links.

---

## 11. Spread Spectrum and Digital Modulation Rules

Section 15.247 governs frequency-hopping spread spectrum (FHSS) and direct-sequence spread spectrum (DSSS) systems in the ISM bands. Section 15.407 governs U-NII devices in the 5 GHz and 6 GHz bands [2]:

### FHSS Requirements (Section 15.247)

- Minimum 75 hopping channels in the 2.4 GHz band
- Maximum dwell time: 0.4 seconds per channel
- Maximum output power: 1 W (30 dBm)
- 6 dB antenna gain limit before output power reduction required

### DSSS/OFDM Requirements (Section 15.247)

- 6 dB processing gain minimum
- Maximum output power: 1 W (30 dBm)
- For point-to-point links with directional antennas: power reduction of 1 dB for every 3 dB of antenna gain above 6 dBi
- In the 5.8 GHz band (U-NII-3): no antenna gain reduction required up to a total EIRP of 4 W

These rules are the engineering constraints for every WiFi access point, mesh node, and point-to-point wireless link deployed in the United States. The 1 W / 30 dBm limit with antenna gain offsets defines the maximum range achievable by a compliant system.

### Point-to-Point Link Budget Under Part 15

For a compliant outdoor point-to-point link at 5.8 GHz (U-NII-3), the maximum link budget is:

```
PART 15 MAXIMUM LINK BUDGET (5.8 GHz U-NII-3)
================================================================

  Transmitter output:        30 dBm (1 W)
  Antenna gain (each end):   23 dBi (parabolic dish)
  No gain reduction in U-NII-3 for fixed P2P
  Max EIRP:                  36 dBm (4 W)
  Free-space path loss (10 km): -128 dB at 5.8 GHz
  Receiver sensitivity:      -85 dBm (typical 802.11ac/ax)

  Link margin = 36 + 23 - 128 + 85 = 16 dB

  Result: ~10 km reliable link at 100+ Mbps with 16 dB margin
```

This calculation demonstrates why Part 15 U-NII-3 is the primary band for long-range outdoor mesh links. The combination of 1 W output power, no antenna gain reduction penalty, and 4 W maximum EIRP enables reliable multi-kilometer links with commercial off-the-shelf equipment.

### Part 15 Emission Limits for Unintentional Radiators

Every digital device (computer, microcontroller, embedded system) must comply with Part 15 Subpart B radiated emission limits [2]. The limits vary by frequency and device class:

| Frequency Range | Class A Limit (at 10m) | Class B Limit (at 10m) | Measurement |
|----------------|----------------------|----------------------|-------------|
| 30--88 MHz | 49.5 dBuV/m | 40 dBuV/m | Quasi-peak |
| 88--216 MHz | 54 dBuV/m | 43.5 dBuV/m | Quasi-peak |
| 216--960 MHz | 56.9 dBuV/m | 46 dBuV/m | Quasi-peak |
| Above 960 MHz | 60 dBuV/m | 54 dBuV/m | Average |

These limits apply to any digital device regardless of whether it intentionally transmits. A Raspberry Pi running a mesh node must comply with Subpart B limits for its unintentional emissions (clock harmonics, switching noise) even though its WiFi radio is separately authorized under Subpart C or E.

### FCC ID Database and Compliance Research

The FCC maintains a public Equipment Authorization Database at apps.fcc.gov/oetcf/eas/reports/GenericSearch.cfm. Every certified device's FCC ID can be searched to find [5]:

- The grantee (manufacturer) identity
- Test reports documenting compliance with applicable emission limits
- Internal and external photographs of the device
- User manual and installation instructions
- RF exposure (SAR) test results for portable devices
- The specific Part 15 subpart and rule sections the device was tested against

Third-party databases (fccid.io, fcc.report) provide enhanced search interfaces over the official data. This is a valuable research tool for identifying the Part 15 compliance basis of any commercially available wireless device.

---

## 12. Cross-References

> **Related:** [Structural Anatomy](01-structural-anatomy.md) -- the Part numbering system and FCC organizational structure within which Part 15 and Part 2 sit. [Private Radio Services](05-private-radio.md) -- Part 97 amateur radio bands that overlap with ISM/Part 15 bands, particularly at 902 MHz, 2.4 GHz, and 5.8 GHz. [Regulatory Flux](06-regulatory-flux.md) -- the 6 GHz GVP expansion and device authorization process changes.

**Series cross-references:**
- **RBH (Radio Broadcasting History):** Historical development of spectrum allocation policy
- **PSS (PNW Signal Stack):** Signal processing within Part 15 power and bandwidth constraints
- **SGL (Signal & Light):** DMX512 and LED control systems that interface with Part 15 wireless
- **WPH (Weekly Phone):** Consumer device FCC ID requirements and wireless certification
- **T55 (555 Timer):** Low-power RF timing circuits under Part 15

---

## 13. Sources

1. Federal Communications Commission. *Part 2: Frequency Allocations and Radio Treaty Matters*. 47 CFR Part 2. ecfr.gov/current/title-47/chapter-I/subchapter-A/part-2 (accessed March 2026).
2. Federal Communications Commission. *Part 15: Radio Frequency Devices*. 47 CFR Part 15. ecfr.gov/current/title-47/chapter-I/subchapter-A/part-15 (accessed March 2026).
3. FCC Office of Engineering & Technology. *Understanding the FCC Regulations for Low-Power, Non-Licensed Transmitters*. OET Bulletin 63, revised October 1993.
4. Federal Communications Commission. *U-NII Devices in the 5 GHz Band*. ET Docket No. 13-49. FCC 14-30, March 2014.
5. Federal Communications Commission. *Equipment Authorization*. fcc.gov/oet/ea (accessed March 2026).
6. Federal Communications Commission. *Part 5: Experimental Radio Service*. 47 CFR Part 5. ecfr.gov/current/title-47/chapter-I/subchapter-A/part-5.
7. Federal Communications Commission. *Part 18: Industrial, Scientific, and Medical Equipment*. 47 CFR Part 18. ecfr.gov/current/title-47/chapter-I/subchapter-A/part-18.
8. Federal Communications Commission. *6 GHz Fourth Report and Order*. FCC News Release, January 29, 2026.
9. Wi-Fi Alliance. *Wi-Fi 6E: The Next Great Chapter in Wi-Fi*. Technical paper, 2024.
10. NTIA. *Federal Spectrum Management*. ntia.gov/page/federal-spectrum-management (accessed March 2026).
11. FCC OET. *FCC Equipment Authorization System Overview*. Laboratory Division, 2025.
12. IEEE 802.11. *IEEE Standard for Information Technology -- Telecommunications and Information Exchange Between Systems*. IEEE Std 802.11-2020.
13. ITU Radio Regulations. *International Table of Frequency Allocations*. ITU-R, Edition 2020.
14. ARRL. *The ARRL Handbook for Radio Communications*. 100th ed. American Radio Relay League, 2023. (ISM/amateur band overlap reference.)
15. Nelson Mullins. *FCC Download: Monthly Updates -- January 2026*. January 15, 2026. (6 GHz GVP order analysis.)
16. Cornell Legal Information Institute. *47 CFR Part 15*. law.cornell.edu/cfr/text/47/part-15 (accessed March 2026).

---

*FCC Catalog -- Module 2: Spectrum & Unlicensed Operations. From 3 kHz to 300 GHz, the frequency allocation table is the master plan. Part 15 is the builder's gateway.*
