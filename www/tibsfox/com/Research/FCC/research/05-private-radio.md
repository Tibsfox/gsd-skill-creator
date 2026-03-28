# Private Radio Services

> **Domain:** Non-Common-Carrier Radio Services
> **Module:** 5 -- Subchapter D: Parts 80-199, Private Radio Services
> **Through-line:** *Subchapter D is where the builders, the experimenters, and the emergency responders live. Part 97 -- amateur radio -- is the only Part in the entire CFR that explicitly permits experimentation, including spread spectrum operation and digital mesh networking. Part 95 puts two-way radio in the hands of anyone who wants it, license-free. Part 90 is the backbone of public safety radio. Part 80 keeps ships from running into each other. This is the subchapter where the radio spectrum serves people directly, not through corporate intermediaries.*

---

## Table of Contents

1. [Subchapter D Overview](#1-subchapter-d-overview)
2. [Part 97: Amateur Radio Service](#2-part-97-amateur-radio-service)
3. [AREDN Mesh Networking Under Part 97](#3-aredn-mesh-networking-under-part-97)
4. [Amateur Frequency Allocations](#4-amateur-frequency-allocations)
5. [Part 95: Personal Radio Services](#5-part-95-personal-radio-services)
6. [Part 90: Land Mobile Radio Services](#6-part-90-land-mobile-radio-services)
7. [Part 80: Maritime Services](#7-part-80-maritime-services)
8. [Part 87: Aviation Services](#8-part-87-aviation-services)
9. [Part 101: Fixed Microwave Services](#9-part-101-fixed-microwave-services)
10. [Amateur Radio Emergency Communications](#10-amateur-radio-emergency-communications)
11. [GSD Infrastructure Compliance Map](#11-gsd-infrastructure-compliance-map)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. Subchapter D Overview

Subchapter D (Parts 80--199) governs private radio services -- radio systems that are not offered to the public as common carrier services. These include maritime safety communications, aviation radio, public safety land mobile radio, personal two-way radio services, amateur radio, and fixed point-to-point microwave links [1].

| Part | Title | Scope |
|------|-------|-------|
| 80 | Stations in the Maritime Services | Ship, coastal, survival craft radio |
| 87 | Aviation Services | Aeronautical stations, ELTs, radar |
| 90 | Private Land Mobile Radio Services | Public safety, industrial, land transportation |
| 95 | Personal Radio Services | GMRS, FRS, CB, MURS, LPRS |
| 97 | Amateur Radio Service | Licensed experimentation, emergency comms |
| 101 | Fixed Microwave Services | Point-to-point links, common carrier micro |

The Wireless Telecommunications Bureau administers Parts 90, 95, and 101. The Public Safety and Homeland Security Bureau co-administers Part 90 (public safety provisions) and Part 97 (emergency communications). The International Bureau has jurisdiction over Parts 80 and 87 to the extent they implement international maritime and aviation treaty obligations [2].

---

## 2. Part 97: Amateur Radio Service

Part 97 is uniquely builder-friendly within the CFR. It is the only Part that explicitly permits experimentation as a primary purpose of the service. The five purposes of amateur radio, defined in Section 97.1, are [3]:

1. **Recognition and enhancement of the value of the amateur service** to the public as a voluntary noncommercial communication service, particularly with respect to providing emergency communications
2. **Continuation and extension of the amateur's proven ability** to contribute to the advancement of the radio art
3. **Encouragement and improvement of the amateur service** through rules which provide for advancing skills in both the communication and technical phases of the art
4. **Expansion of the existing reservoir** within the amateur radio service of trained operators, technicians, and electronics experts
5. **Continuation and extension of the amateur's unique ability** to enhance international goodwill

### License Classes

| Class | Exam | Privileges | Typical Use |
|-------|------|-----------|-------------|
| Technician | Element 2 (35 questions) | All amateur bands above 30 MHz; limited HF | VHF/UHF, local repeaters, AREDN mesh |
| General | Elements 2+3 (35 questions) | Most HF bands + all Technician privileges | HF digital modes, worldwide communication |
| Amateur Extra | Elements 2+3+4 (50 questions) | All amateur bands and modes | Full HF access, experimental operations |

As of 2025, there are approximately 770,000 licensed amateur radio operators in the United States, administered through the FCC's Universal Licensing System (ULS) [4].

### Key Regulatory Provisions

- **Section 97.113(a):** Prohibits communication for compensation or hire (the "no pecuniary interest" rule). This is the fundamental constraint that separates amateur from commercial radio. Amateur stations may not be used for business purposes.
- **Section 97.113(b):** Exceptions for emergency communications and specific authorized activities
- **Section 97.115:** Third-party traffic rules -- an amateur may transmit messages for a third party, but the controlling operator remains responsible for compliance
- **Section 97.215:** Spread spectrum transmissions authorized for amateur stations
- **Section 97.307:** Emission standards -- Part 97 allows digital modes not explicitly listed in the rules, provided they comply with bandwidth limits and the station identification requirement
- **Section 97.311:** SS (spread spectrum) emission type authorized on all amateur bands above 222 MHz

---

## 3. AREDN Mesh Networking Under Part 97

The Amateur Radio Emergency Data Network (AREDN) operates under Part 97 using commercial 802.11 WiFi hardware that has been reflashed with AREDN firmware and configured to operate on amateur radio frequencies [5].

### How AREDN Works

AREDN nodes use modified Ubiquiti, MikroTik, or TP-Link hardware running open-source firmware that:

1. Tunes the radio to amateur bands (typically 2.4 GHz, 3.4 GHz, or 5.8 GHz allocations that overlap with or are adjacent to commercial WiFi bands)
2. Increases channel bandwidth where permitted (10 MHz or 20 MHz channels)
3. Implements mesh routing (OLSR protocol) for automatic multi-hop networking
4. Enables TCP/IP services (web servers, VoIP, video, file sharing) over the amateur mesh

### Legal Authority

AREDN operates under several Part 97 provisions:

- **Section 97.215:** Authorizes spread spectrum transmissions, which encompasses the OFDM modulation used by 802.11 hardware
- **Section 97.307(f):** Sets bandwidth limits but does not restrict specific digital modulation types
- **Section 97.113:** All traffic must be non-commercial; no encryption of message content (Section 97.113(a)(4) permits encryption of control signals only)
- **Section 97.119:** Station identification required (call sign transmitted at least every 10 minutes and at end of communication)

### AREDN-Relevant Amateur Bands

| Band | Frequency | Overlap | AREDN Capability |
|------|-----------|---------|-----------------|
| 33 cm | 902--928 MHz | Full overlap with Part 15 ISM | Mesh-capable; shared with unlicensed |
| 23 cm | 1240--1300 MHz | No commercial overlap | High-throughput mesh links |
| 13 cm | 2300--2450 MHz | Overlaps 2.4 GHz ISM | Standard WiFi hardware usable |
| 9 cm | 3300--3500 MHz | Adjacent to CBRS | Emerging AREDN capability |
| 6 cm | 5650--5925 MHz | Overlaps 5.8 GHz U-NII-3/ISM | Primary AREDN band; long-range links |

> **CAUTION: AREDN is amateur radio.** All AREDN transmissions must comply with Part 97. This means: no encryption of message content, no commercial traffic, station identification required, controlling operator must hold an amateur license. Using AREDN for business internet access, encrypted VPN tunnels, or any commercial purpose violates Section 97.113.

---

## 4. Amateur Frequency Allocations

Part 97 allocates spectrum across the radio spectrum from 1.8 MHz (160 meters) to 275 GHz. Key allocations relevant to data and digital operations [3]:

| Band | Frequency | Primary Digital/Data Use |
|------|-----------|------------------------|
| 160 meters | 1.800--2.000 MHz | Limited data; CW, digital modes |
| 80 meters | 3.500--4.000 MHz | Regional digital (FT8, JS8Call, Winlink) |
| 40 meters | 7.000--7.300 MHz | Worldwide digital (FT8, JS8Call); long-range data |
| 20 meters | 14.000--14.350 MHz | Primary worldwide digital/data band |
| 2 meters | 144--148 MHz | Packet radio, APRS, FM repeaters |
| 70 cm | 420--450 MHz | Packet radio, D-STAR, broadband amateur |
| 33 cm | 902--928 MHz | AREDN mesh, overlaps ISM |
| 23 cm | 1240--1300 MHz | Microwave data links, AREDN |
| 13 cm | 2300--2450 MHz | AREDN WiFi mesh, overlaps 2.4 GHz ISM |
| 6 cm | 5650--5925 MHz | AREDN, overlaps 5.8 GHz WiFi |
| 3 cm | 10.0--10.5 GHz | Microwave experimentation |

### APRS (Automatic Packet Reporting System)

APRS operates primarily on 144.390 MHz (2 meters) and provides real-time position reporting, weather data, messaging, and telemetry over a shared channel using AX.25 packet radio. APRS is the de facto standard for amateur radio location tracking and is widely used for emergency communications, severe weather spotting, and event coordination [6].

### Winlink

Winlink is an amateur radio email system that operates over HF, VHF, and UHF bands, providing email connectivity independent of the internet. Winlink is designated by FEMA as an auxiliary communications resource for emergency management [7].

---

## 5. Part 95: Personal Radio Services

Part 95 covers consumer radio services designed for personal, recreational, and business use with minimal or no licensing requirements [8]:

| Service | Subpart | Frequency | License | Max Power | Key Features |
|---------|---------|-----------|---------|-----------|-------------|
| FRS (Family Radio) | B | 462/467 MHz | None | 2 W (ch 1-7, 15-22), 0.5 W (ch 8-14) | Integrated antenna required; 22 channels |
| GMRS (General Mobile) | E | 462/467 MHz | ULS license ($35, 10 yr) | 50 W (base/mobile), 5 W (repeater input) | Removable antennas; repeaters allowed |
| MURS (Multi-Use Radio) | J | 151/154 MHz VHF | None | 2 W | 5 channels; good rural propagation |
| CB (Citizens Band) | D | 26.965--27.405 MHz | None | 4 W AM / 12 W SSB | 40 channels; no license since 1983 |
| LPRS (Low Power Radio) | G | 216--217 MHz | None | 100 mW | Auditory assistance, health monitoring |
| MedRadio | I | 401--406 MHz | None | Various | Medical implant telemetry |

### FRS vs. GMRS

FRS and GMRS share the same frequency channels (462/467 MHz UHF) but differ in licensing, power limits, and equipment requirements:

- **FRS:** No license required. Maximum 2 W on channels 1-7 and 15-22; 0.5 W on channels 8-14. Integrated (non-removable) antenna required. No repeater use.
- **GMRS:** License required ($35 application fee, 10-year term, covers the licensee's immediate family). Up to 50 W on base/mobile stations. External antennas permitted. Repeater use authorized on designated channels.

GMRS has become increasingly popular for rural property communications, outdoor recreation, and community emergency preparedness. The 2017 FRS/GMRS reform (Report and Order in WT Docket No. 10-119) simplified the service by increasing FRS power limits and eliminating individual licensing for FRS [9].

### FRS/GMRS Channel Plan

The shared FRS/GMRS channel plan allocates 22 channels in the 462/467 MHz UHF band [8]:

| Channels | Frequency Range | FRS Power | GMRS Power | Notes |
|----------|----------------|-----------|------------|-------|
| 1--7 | 462.5625--462.7125 MHz | 2 W | 5 W (15 W repeater capable) | Shared FRS/GMRS main channels |
| 8--14 | 467.5625--467.7125 MHz | 0.5 W | 0.5 W | Shared; GMRS repeater input |
| 15--22 | 462.5500--462.7250 MHz | 2 W | 50 W | GMRS primary; high-power capable |

Channels 15-22 are the most useful for GMRS operators: 50 W mobile/base stations with high-gain antennas can achieve 10-30 mile range depending on terrain. GMRS repeaters on channels 15R-22R (paired with channels 15-22) extend coverage further, particularly in mountainous terrain where direct line-of-sight is limited.

### CB Radio (Citizens Band)

Citizens Band radio, operating at 27 MHz (11 meters), remains the most widely used license-free radio service despite its age. CB is governed by Part 95 Subpart D [8]:

- 40 channels, 26.965--27.405 MHz
- AM mode: 4 watts maximum output power
- SSB (Single Sideband) mode: 12 watts PEP
- No license required (eliminated in 1983)
- External antennas permitted (critical for range)
- Propagation: primarily ground wave (15-30 miles typical); occasional skip propagation via ionospheric reflection (hundreds of miles, unpredictable)

CB radio's 27 MHz frequency provides good propagation characteristics for mobile and base station use. The 11-meter band experiences periodic "skip" conditions (solar-cycle dependent) that enable long-range communication -- which is technically a violation of the Part 95 prohibition on communications over 155.3 miles, though enforcement is minimal.

### MURS for Rural Communications

MURS (Multi-Use Radio Service) operates on five VHF frequencies in the 150 MHz range. VHF propagation provides better range in open terrain and light vegetation than UHF (FRS/GMRS), making MURS particularly useful for rural property communications, farming, and ranching. No license is required; maximum power is 2 W [8].

---

## 6. Part 90: Land Mobile Radio Services

Part 90 governs private land mobile radio, which includes public safety radio systems, industrial radio, and land transportation radio [10].

### Public Safety Radio

Part 90 is the regulatory home of public safety radio -- the communication systems used by law enforcement, fire departments, and emergency medical services. Key provisions:

- **700/800 MHz public safety spectrum:** P25 digital trunked radio systems
- **Narrowbanding mandate:** All Part 90 licensees in the 150--512 MHz bands must use 12.5 kHz or narrower channels (completed 2013)
- **800 MHz rebanding:** Completed relocation of public safety channels away from commercial cellular spectrum to eliminate interference
- **Interoperability:** Part 90 Subpart S establishes interoperability requirements for public safety licensees

### P25 Digital Radio

Project 25 (P25) is the digital radio standard for public safety, defined in TIA-102 series standards and implemented under Part 90 authority:

| Phase | Capability | Channel Width | Modulation |
|-------|------------|---------------|------------|
| Phase 1 | FDMA digital voice/data | 12.5 kHz | C4FM or CQPSK |
| Phase 2 | TDMA digital voice/data | 12.5 kHz (2 timeslots) | H-DQPSK |

P25 provides encrypted voice, over-the-air rekeying (OTAR), emergency alert features, and interoperability between agencies. The P25 Compliance Assessment Program (CAP) ensures equipment interoperability.

---

## 7. Part 80: Maritime Services

Part 80 governs all maritime radio services, implementing international obligations under the International Convention for the Safety of Life at Sea (SOLAS) and the ITU Radio Regulations [11].

### Critical Safety Frequencies

| Frequency | Channel | Purpose |
|-----------|---------|---------|
| 156.800 MHz | VHF Channel 16 | International distress, safety, and calling |
| 156.525 MHz | VHF Channel 70 | Digital Selective Calling (DSC) distress |
| 2182 kHz | MF | Medium frequency distress and calling |
| 406 MHz | EPIRB | Emergency Position Indicating Radio Beacon |
| 121.5 MHz | ELT/EPIRB | Emergency locator (aviation/maritime) |

> **SAFETY WARNING:** VHF Channel 16 (156.800 MHz) is the international distress frequency. All ships required to carry radio must maintain a listening watch on Channel 16. Transmitting on Channel 16 for non-emergency purposes or interfering with distress communications is a federal criminal offense under 47 U.S.C. Section 325 and international law (SOLAS Convention).

### GMDSS (Global Maritime Distress and Safety System)

Part 80 implements the GMDSS, which provides automated distress alerting and communications for vessels at sea:

- **Sea Area A1:** Within range of VHF coast stations (DSC on Channel 70)
- **Sea Area A2:** Within range of MF coast stations (DSC on 2187.5 kHz)
- **Sea Area A3:** Within Inmarsat coverage (satellite communications)
- **Sea Area A4:** Polar regions beyond Inmarsat coverage (HF radio)

---

## 8. Part 87: Aviation Services

Part 87 governs aeronautical radio services, coordinated with the Federal Aviation Administration (FAA). Aviation radio is one of the most strictly regulated radio services because of its direct safety-of-life implications [12].

### Key Aviation Frequencies

| Frequency | Purpose |
|-----------|---------|
| 121.500 MHz | Emergency/distress (international) |
| 118.000--136.975 MHz | Air traffic control (VHF voice) |
| 243.000 MHz | Military emergency |
| 1090 MHz | ADS-B transponder (Mode S extended squitter) |
| 978 MHz | ADS-B (UAT -- Universal Access Transceiver) |

ADS-B (Automatic Dependent Surveillance-Broadcast) is now mandatory for most US airspace under FAA regulation, but the radio equipment requirements are defined in Part 87 in coordination with FAA Technical Standard Orders (TSOs).

---

## 9. Part 101: Fixed Microwave Services

Part 101 governs fixed point-to-point microwave links used for communications backhaul, broadcasting relay, and private network connections [13].

### Frequency Bands

Part 101 authorizes operation in numerous bands from 928 MHz to 95 GHz:

| Band | Typical Use | Path Length |
|------|-------------|-------------|
| 6 GHz (5925--6875 MHz) | Long-haul backbone; incumbent in 6 GHz unlicensed band | 20--50 km |
| 11 GHz | Medium-haul backhaul | 10--30 km |
| 18 GHz | Short/medium-haul backhaul | 5--15 km |
| 23 GHz | Short-haul backhaul | 3--10 km |
| 70/80 GHz (E-band) | High-capacity short-haul | 1--5 km |

Part 101 microwave links are the incumbent users in the 6 GHz band that Part 15 unlicensed devices (WiFi 6E/7) must coordinate with through the AFC (Automated Frequency Coordination) system. The protection of these existing links is the primary constraint on 6 GHz unlicensed outdoor power levels.

### Rural Backhaul Applications

Part 101 fixed microwave is a critical technology for rural broadband backhaul, connecting remote cell towers and fixed wireless access points to fiber networks. The Carr FCC has streamlined Part 101 licensing to reduce deployment barriers in rural areas.

### E-band (70/80 GHz) for High-Capacity Links

The E-band (71-76 GHz / 81-86 GHz) offers 10 GHz of spectrum with a light-licensing regime under Part 101 [13]:

- **Light licensing:** Register-and-operate model (no frequency coordination required)
- **High capacity:** Multi-gigabit throughput per link
- **Short range:** Typically 1-3 km due to rain attenuation
- **Narrow beams:** 0.3-degree beamwidth with 1-foot dish; minimal interference
- **Cost:** Equipment cost declining rapidly; competitive with fiber for short runs

E-band is increasingly used for 5G backhaul in both urban and suburban deployments. Its light-licensing model is a regulatory innovation that reduces deployment friction compared to traditional Part 101 licensing.

---

## 10. Amateur Radio Emergency Communications

Part 97 contains specific provisions for emergency communications that are directly relevant to disaster preparedness and GSD infrastructure resilience [3]:

### Emergency Provisions (Sections 97.401--97.407)

- **Section 97.401:** When normal communication facilities are disrupted, amateur stations may provide emergency communications
- **Section 97.403:** Safety of life and property communications -- an amateur station may be used to transmit information necessary for the immediate safety of human life or protection of property when normal channels are unavailable
- **Section 97.405:** Station in distress -- no FCC regulation prevents the use of any means of radiocommunication in distress situations

### ARES and RACES

Two organized emergency communication networks operate under Part 97 authority:

- **ARES (Amateur Radio Emergency Service):** Organized under the ARRL; volunteers register with local ARES groups and participate in regular training and nets. ARES is activated by local emergency management agencies.
- **RACES (Radio Amateur Civil Emergency Service):** Organized under local/state civil defense agencies. RACES operations are governed by Section 97.407, which authorizes specific frequencies and modes during declared civil defense emergencies.

### Winlink and SHARES

- **Winlink:** Amateur radio email system providing internet-independent email via HF, VHF, and UHF radio. Designated by FEMA as an auxiliary communications resource.
- **SHARES (Shared Resources HF Radio Program):** Federal HF radio network that coordinates with amateur stations during national emergencies. Operated by CISA (Cybersecurity and Infrastructure Security Agency).

---

## 11. GSD Infrastructure Compliance Map

The following table maps GSD ecosystem deployment scenarios to applicable FCC Parts and key compliance thresholds [3] [8] [10]:

| Deployment Scenario | Primary Part(s) | Key Constraints | License Required? |
|--------------------|-----------------|-----------------|-------------------|
| WiFi mesh node (indoor) | Part 15, Subpart E | 1 W EIRP max; FCC ID required on device | No (device must be certified) |
| WiFi mesh node (outdoor, 2.4/5 GHz) | Part 15, Subparts C/E | Power limits per band; DFS on 5 GHz U-NII-2 | No (device certification) |
| WiFi mesh node (outdoor, 6 GHz) | Part 15, Subpart E | AFC coordination required; GVP device class | No (device certification + AFC) |
| AREDN mesh node (amateur band) | Part 97 | No encryption; no commercial traffic; license required | Yes (amateur license) |
| GMRS repeater network | Part 95, Subpart E | 50 W max; ULS license; 462/467 MHz only | Yes ($35 GMRS license) |
| Point-to-point backhaul (licensed) | Part 101 | Frequency coordination; site-specific license | Yes (ULS license) |
| Satellite ground station (Starlink) | Part 25 | Blanket earth station authorization | No (covered by operator's license) |
| LoRa IoT sensor network | Part 15, Subpart C | 902-928 MHz; 1 W FHSS; FCC ID on device | No (device certification) |
| Emergency HF radio (amateur) | Part 97 | License required; emergency traffic authorized | Yes (amateur license) |
| Rural property two-way radio | Part 95 (MURS or FRS) | 2 W max; specific channels only | No (FRS/MURS) |
| Community FM broadcast | Part 73, Subpart G (LPFM) | FCC construction permit and license; 100W max | Yes (LPFM license) |
| Public safety radio system | Part 90 | P25 digital; narrowband; frequency coordination | Yes (site-specific) |

---

## 12. Cross-References

> **Related:** [Spectrum & Unlicensed Operations](02-spectrum-unlicensed.md) -- Part 15 bands that overlap with amateur bands at 902 MHz, 2.4 GHz, and 5.8 GHz; the regulatory boundary between unlicensed and amateur operation. [Common Carrier](03-common-carrier.md) -- Part 25 satellite (Subchapter B) and its interaction with Part 87 aviation and Part 80 maritime safety coordination. [Regulatory Flux](06-regulatory-flux.md) -- the compliance workflow, device authorization process, and pending regulatory changes affecting private radio services.

**Series cross-references:**
- **RBH (Radio Broadcasting History):** Evolution of amateur radio regulation and personal radio services
- **PSS (PNW Signal Stack):** Signal processing in amateur and personal radio contexts
- **WPH (Weekly Phone):** Consumer radio devices and their regulatory requirements
- **CMH (Computational Mesh):** AREDN mesh topology and routing under Part 97 constraints
- **SHE (Smart Home Energy):** IoT sensor networks under Part 15 within the private radio spectrum context
- **KPZ (KPLZ Seattle):** FM translator provisions (Part 74) extending broadcast coverage

---

## 13. Sources

1. Electronic Code of Federal Regulations. *Title 47, Chapter I, Subchapter D*. ecfr.gov/current/title-47/chapter-I/subchapter-D (accessed March 2026).
2. Federal Communications Commission. *Bureau and Office Descriptions*. fcc.gov/about/overview (accessed March 2026).
3. Federal Communications Commission. *Part 97: Amateur Radio Service*. 47 CFR Part 97. ecfr.gov/current/title-47/chapter-I/subchapter-D/part-97.
4. Federal Communications Commission. *Universal Licensing System (ULS) License Counts*. fcc.gov/uls (accessed March 2026).
5. Amateur Radio Emergency Data Network. *AREDN Documentation*. arednmesh.org (accessed March 2026).
6. APRS Working Group. *Automatic Packet Reporting System*. aprs.org (accessed March 2026).
7. Winlink Development Team. *Winlink Global Radio Email*. winlink.org (accessed March 2026).
8. Federal Communications Commission. *Part 95: Personal Radio Services*. 47 CFR Part 95. ecfr.gov/current/title-47/chapter-I/subchapter-D/part-95.
9. Federal Communications Commission. *FRS/GMRS Reform*. Report and Order, WT Docket No. 10-119, 2017.
10. Federal Communications Commission. *Part 90: Private Land Mobile Radio Services*. 47 CFR Part 90.
11. Federal Communications Commission. *Part 80: Stations in the Maritime Services*. 47 CFR Part 80.
12. Federal Communications Commission. *Part 87: Aviation Services*. 47 CFR Part 87.
13. Federal Communications Commission. *Part 101: Fixed Microwave Services*. 47 CFR Part 101.
14. ARRL. *The ARRL Handbook for Radio Communications*. 100th ed. American Radio Relay League, 2023.
15. TIA. *Project 25 (P25) Digital Radio Standards*. TIA-102 series. Telecommunications Industry Association.
16. International Maritime Organization. *SOLAS Convention*. Chapter IV: Radiocommunications. IMO, 2020 amendments.
17. Federal Aviation Administration. *ADS-B Technical Standard Order*. TSO-C166b, TSO-C154c. FAA, 2020.

---

*FCC Catalog -- Module 5: Private Radio Services. From the amateur experimenter's bench to the ship's bridge to the backcountry two-way radio -- the regulatory framework for non-common-carrier radio, where builders and operators work directly with the spectrum.*
