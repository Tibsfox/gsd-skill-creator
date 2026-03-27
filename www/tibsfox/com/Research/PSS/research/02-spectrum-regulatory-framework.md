# Spectrum & Regulatory Framework

> **Domain:** Telecommunications Regulation & Spectrum Policy
> **Module:** 2 -- FCC Allocation, Licensing Pathways, and the Public Spectrum Inventory
> **Through-line:** *The electromagnetic spectrum stretches from DC to 300 GHz, but only a handful of frequency bands are lawfully accessible to ordinary citizens without a license -- and the rules governing those bands are scattered across thousands of pages of federal regulation that almost nobody reads.* This module assembles the complete PNW-specific spectrum guide that has never existed in accessible form: every public-use band, every power limit, every licensing pathway, mapped to the specific geography and regulatory context of the Pacific Northwest.

---

## Table of Contents

1. [The Spectrum as Regulated Resource](#1-the-spectrum-as-regulated-resource)
2. [FCC Organizational Structure](#2-fcc-organizational-structure)
3. [The NTIA Frequency Allocation Table](#3-the-ntia-frequency-allocation-table)
4. [Part 15: Unlicensed Operation Rules](#4-part-15-unlicensed-operation-rules)
5. [Part 73: Broadcast Services](#5-part-73-broadcast-services)
6. [LPFM: Low-Power FM Licensing](#6-lpfm-low-power-fm-licensing)
7. [Part 97: Amateur Radio Service](#7-part-97-amateur-radio-service)
8. [Part 95: Personal Radio Services](#8-part-95-personal-radio-services)
9. [ISM Bands and Unlicensed Wireless](#9-ism-bands-and-unlicensed-wireless)
10. [PNW-Specific Spectrum Considerations](#10-pnw-specific-spectrum-considerations)
11. [Enforcement and Penalties](#11-enforcement-and-penalties)
12. [The Amiga Principle in Spectrum Allocation](#12-the-amiga-principle-in-spectrum-allocation)
13. [Cross-References](#13-cross-references)
14. [Sources](#14-sources)

---

## 1. The Spectrum as Regulated Resource

The electromagnetic spectrum is not a physical object that can be depleted, but it is a shared medium where simultaneous use on the same frequency in the same geographic area causes destructive interference. This makes spectrum a rivalrous resource -- one user's transmission prevents another user on the same frequency from being heard. The regulatory framework exists to manage this rivalry [1].

The United States allocates spectrum management responsibility between two agencies:

- **Federal Communications Commission (FCC):** Manages spectrum for non-federal use -- commercial, state/local government, personal, and amateur. Authority derives from the Communications Act of 1934 and amendments.
- **National Telecommunications and Information Administration (NTIA):** Manages spectrum for federal government use -- military, federal law enforcement, government research. NTIA operates under the Department of Commerce [2].

```
US SPECTRUM MANAGEMENT HIERARCHY
================================================================
         INTERNATIONAL
         +-----------+
         |   ITU     |  International Telecommunications Union
         | (Geneva)  |  Allocates spectrum globally via WRC
         +-----------+
              |
         NATIONAL
    +--------+--------+
    |                 |
+-------+        +-------+
|  FCC  |        | NTIA  |  Managed by Dept. of Commerce
| Non-  |        | Fed.  |
| Fed.  |        | Gov.  |
+-------+        +-------+
    |
+---+---+---+---+---+---+
|   |   |   |   |   |   |
P15 P73 P90 P95 P97 P101  ... (CFR Parts)
================================================================
```

The ITU, based in Geneva, coordinates spectrum allocation globally through the World Radiocommunication Conference (WRC), held every 3-4 years. ITU allocations are divided into three regions: Region 1 (Europe, Africa, Middle East), Region 2 (Americas), and Region 3 (Asia-Pacific). The United States falls in Region 2, and FCC allocations generally follow ITU Region 2 assignments but are not identical [3].

---

## 2. FCC Organizational Structure

The FCC is organized into bureaus and offices, each responsible for different aspects of spectrum management:

| Bureau | Responsibility | Key Rules |
|--------|---------------|-----------|
| Media Bureau | Broadcast TV, radio, cable, satellite | Parts 73, 74, 76 |
| Wireless Telecommunications | Mobile, fixed wireless, amateur | Parts 22, 24, 27, 90, 95, 97, 101 |
| Public Safety & Homeland Security | Emergency communications | Part 90 (public safety) |
| Office of Engineering & Technology | Equipment authorization, Part 15 | Part 15, Part 18 |
| International Bureau | Satellite, international coordination | Part 25 |

The FCC's rules are codified in Title 47 of the Code of Federal Regulations (47 CFR). Each "Part" governs a specific service or category of use. For the PNW Signal Stack, the most relevant Parts are [1]:

- **Part 15:** Unlicensed intentional and unintentional radiators
- **Part 73:** Broadcast services (AM, FM, TV, LPFM)
- **Part 90:** Private land mobile radio services (public safety)
- **Part 95:** Personal radio services (CB, GMRS, FRS, MURS)
- **Part 97:** Amateur radio service (HAM)
- **Part 101:** Fixed microwave services

---

## 3. The NTIA Frequency Allocation Table

The NTIA maintains the definitive US frequency allocation table, covering the spectrum from 9 kHz to 275 GHz. The table shows allocations for both federal (NTIA-managed) and non-federal (FCC-managed) use, with some bands allocated to both under shared arrangements [2].

### Key Allocations for PNW Signal Stack

```
PNW-RELEVANT FREQUENCY ALLOCATIONS
================================================================
FREQUENCY RANGE          ALLOCATION              ACCESS TYPE
----------------------------------------------------------------
535-1705 kHz             AM Broadcasting         Licensed (Part 73)
                                                 Unlicensed (Part 15.219)
1.8-29.7 MHz            Amateur Radio (HF)      Licensed (Part 97)
26.965-27.405 MHz        Citizens Band           License-free (Part 95)
29.7-50 MHz              Various                 Federal/non-federal shared
50-54 MHz                Amateur Radio (6m)      Licensed (Part 97)
54-88 MHz                VHF-Lo TV (Ch 2-6)      Licensed (Part 73)
88-108 MHz               FM Broadcast            Licensed (Part 73/LPFM)
                                                 Unlicensed (Part 15.239)
108-137 MHz              Aeronautical            Federal
137-138 MHz              Space research/weather  Satellite downlink
144-148 MHz              Amateur Radio (2m)      Licensed (Part 97)
150-174 MHz              Business/Public Safety  Licensed (Part 90)
162.4-162.55 MHz         NOAA Weather Radio      Federal (receive-only public)
174-216 MHz              VHF-Hi TV (Ch 7-13)     Licensed (Part 73)
220-225 MHz              Amateur / Paging        Licensed (Part 97)
420-450 MHz              Amateur Radio (70cm)    Licensed (Part 97)
462-467 MHz              GMRS/FRS               GMRS: Licensed (Part 95E)
                                                 FRS: License-free (Part 95B)
470-608 MHz              UHF TV (Ch 14-36)       Licensed (Part 73)
614-698 MHz              Cleared (incentive auction) Mobile broadband
698-806 MHz              700 MHz Band            Licensed (mobile broadband)
806-960 MHz              Public Safety/Cellular  Licensed (Parts 22, 24, 90)
902-928 MHz              ISM Band                Unlicensed (Part 15)
1240-1300 MHz            Amateur (23cm)          Licensed (Part 97)
2400-2483.5 MHz          ISM Band                Unlicensed (Part 15)
                         Also Amateur (Part 97)
5150-5850 MHz            U-NII / ISM             Unlicensed (Part 15)
                         Also Amateur (Part 97)
5925-7125 MHz            6 GHz Band (Wi-Fi 6E)   Unlicensed (Part 15)
================================================================
```

> **FCC COMPLIANCE NOTE:** This table is a summary for educational purposes. The complete NTIA allocation table spans thousands of entries with footnotes governing specific geographic restrictions, power limits, and shared-use conditions. Always consult the current 47 CFR and NTIA table before any transmission activity.

---

## 4. Part 15: Unlicensed Operation Rules

Part 15 of 47 CFR governs two categories: unintentional radiators (any electronic device that emits RF as a byproduct) and intentional radiators (devices designed to transmit RF energy). For the PNW Signal Stack, the intentional radiator rules are the gateway to grassroots broadcasting [4].

### Section 15.209: General Radiated Emission Limits

Section 15.209 establishes the baseline field strength limits for intentional radiators across the spectrum. These limits define the maximum signal strength measured at a specified distance from the device. Most unlicensed devices must comply with 15.209 unless a more specific section applies [4].

| Frequency Range | Field Strength Limit | Measurement Distance |
|----------------|---------------------|---------------------|
| 9 kHz - 490 kHz | 2400/f(kHz) uV/m | 300 meters |
| 490 kHz - 1705 kHz | 24000/f(kHz) uV/m | 30 meters |
| 1.705 - 30 MHz | 30 uV/m | 30 meters |
| 30 - 88 MHz | 100 uV/m | 3 meters |
| 88 - 216 MHz | 150 uV/m | 3 meters |
| 216 - 960 MHz | 200 uV/m | 3 meters |
| Above 960 MHz | 500 uV/m | 3 meters |

### Section 15.219: AM Broadcast Band Operations

This is the most permissive Part 15 section for broadcast-style use. It allows unlicensed AM transmission under strict constraints [4]:

- **Maximum transmitter input power to final RF stage:** 100 milliwatts (0.1 watts)
- **Maximum antenna system length:** 3 meters (approximately 10 feet), including transmission line, antenna element, and ground lead
- **Frequency range:** 510-1705 kHz (the AM broadcast band)
- **Operating hours:** No restriction
- **Content:** No restriction (advertising permitted)
- **Equipment authorization:** Up to 5 units may be built for personal use without FCC equipment authorization per Section 15.23

Practical effective coverage of a Part 15.219 AM station ranges from approximately 200 feet in urban environments with significant noise floor to approximately 1-2 miles in favorable rural/suburban terrain during daytime. Nighttime coverage is significantly reduced due to skywave interference from distant AM stations [5].

### Section 15.239: FM Broadcast Band Operations

Section 15.239 permits unlicensed FM transmission on the 88-108 MHz FM broadcast band with significantly more restrictive limits than the AM band rules [4]:

- **Maximum field strength:** 250 microvolts per meter (uV/m) measured at 3 meters from the device
- **Effective coverage:** Approximately 200 feet (60 meters) in typical conditions
- **Content:** No restriction
- **Equipment:** Many commercial "FM transmitters" marketed for car audio and similar uses operate under this section

The FM Part 15 limit is intentionally very restrictive because the FM band is densely packed with licensed stations, and even low-power interference can degrade reception of stations serving millions of listeners.

### Section 15.221: Campus Carrier Current

Section 15.221 permits broadcast on educational institution campuses using carrier current systems (signals conducted through the building's electrical wiring) or low-power transmitters. Field strength must comply with Section 15.209 at the campus perimeter. This provision historically enabled college radio stations to operate without an FCC license [4].

---

## 5. Part 73: Broadcast Services

Part 73 governs all FCC-licensed broadcast services: AM radio, FM radio, television (VHF and UHF), and LPFM. These are the highest-power, most-regulated spectrum users in the PNW [6].

### AM Broadcast (Part 73, Subpart A)

| Class | Power Range | Coverage | Typical Use |
|-------|-------------|----------|-------------|
| A | 10-50 kW | Regional (750+ miles nighttime) | Clear-channel stations |
| B | 0.25-50 kW | Metro area | Regional/metro stations |
| C | 0.25-1 kW | Local | Local community stations |
| D | 0.25-50 kW (daytime) | Varies | Daytime-only stations |

AM stations in the PNW must contend with unique propagation challenges. The Cascade Range creates significant terrain shadowing for AM signals traveling east-west, while the Puget Sound water surface provides enhanced ground-wave propagation along the north-south corridor [7].

### FM Broadcast (Part 73, Subpart B)

| Class | Max ERP | Max HAAT | Service Contour |
|-------|---------|----------|-----------------|
| A | 6 kW | 100m | ~28 km radius |
| B1 | 25 kW | 100m | ~44 km radius |
| B | 50 kW | 150m | ~65 km radius |
| C3 | 25 kW | 100m | ~39 km radius |
| C2 | 50 kW | 150m | ~52 km radius |
| C1 | 100 kW | 299m | ~80 km radius |
| C | 100 kW | 600m | ~92 km radius |

The PNW's mountainous terrain makes HAAT (Height Above Average Terrain) calculations critical. A Class C station on a 600-meter HAAT site in the Cascades can cover the entire Puget Sound lowland, while the same power station on a low-HAAT site might serve only a single city [7].

---

## 6. LPFM: Low-Power FM Licensing

Low-Power FM (LPFM) represents one of the most accessible pathways for community-controlled broadcasting in the PNW. Created by the FCC in 2000 and expanded by the Local Community Radio Act of 2010, LPFM provides two power classes [8]:

### Power Classes

| Class | ERP | Service Radius | Typical Coverage |
|-------|-----|---------------|-----------------|
| LP-10 | 10 watts | ~3.5 km (2.2 miles) | Neighborhood/campus |
| LP-100 | 100 watts | ~8 km (5 miles) | Small city/community |

### Eligibility Requirements

LPFM licenses are restricted to:
- **Non-profit educational organizations**
- **Community organizations** with demonstrated local presence
- **Churches and religious organizations** (non-commercial use)
- **Government entities** (tribal, state, local)
- **No commercial entities** may hold LPFM licenses

### Application Process

The FCC opens LPFM application windows periodically -- the most recent major window was in 2013, and the FCC opened a new NCE (Non-Commercial Educational) TV filing window in December 2024. Applicants must demonstrate:

1. Local presence within the proposed service area
2. No cross-ownership with other broadcast stations
3. Ability to comply with Part 73 technical standards
4. Programming plan serving local community needs [8]

> **FCC COMPLIANCE NOTE:** LPFM applications require engineering studies demonstrating non-interference with existing full-power and other protected stations. Prospective applicants should engage a licensed broadcast engineer for the technical portions of their application.

### PNW LPFM Stations

Washington state has approximately 30+ active LPFM stations, concentrated in the Puget Sound metro area, Spokane, and rural communities. Oregon has a similar count. These stations typically serve:

- Indigenous/tribal community programming (specific nations including Tulalip, Muckleshoot, Puyallup, Quinault)
- Multilingual community services (Spanish, Vietnamese, Somali, Mandarin)
- Hyper-local news and emergency information
- Music and cultural programming underserved by commercial formats

> **Related:** [PNW Broadcast Heritage](01-pnw-broadcast-heritage.md) for broadcast ownership context, [DIY RF & Computing Builds](03-diy-rf-computing-builds.md) for Part 15 AM station build that complements LPFM

---

## 7. Part 97: Amateur Radio Service

The Amateur Radio Service (commonly "HAM radio") provides the most technically sophisticated public-access spectrum available in the PNW. Part 97 allocates over 20 frequency bands to amateurs, from 1.8 MHz (160 meters) through 275 GHz (sub-millimeter waves) [9].

### License Classes

| Class | Exam | Privileges | Typical Use |
|-------|------|-----------|-------------|
| Technician | 35-question multiple choice | VHF/UHF (all), limited HF | Local repeaters, mesh networks, satellite |
| General | 35-question (Tech required) | Most HF bands + all VHF/UHF | Worldwide HF communication |
| Amateur Extra | 50-question (General required) | All amateur bands, all modes | Full spectrum access |

The ARRL (American Radio Relay League) administers the Volunteer Examiner (VE) program for licensing. Exams are offered regularly throughout the PNW, with sessions available in Seattle, Tacoma, Olympia, Portland, Spokane, and smaller communities [9].

### PNW Amateur Radio Infrastructure

The Pacific Northwest has one of the most active amateur radio communities in the United States, owing to the region's combination of technical industry workforce (Boeing, Microsoft, Amazon employees), mountainous terrain ideal for repeater sites, and disaster preparedness awareness (Cascadia Subduction Zone earthquake).

Key PNW repeater networks:

```
PNW AMATEUR REPEATER NETWORKS
================================================================
Network/Club          Frequencies       Coverage
----------------------------------------------------------------
Western Washington    146.82 (W7AW)     Puget Sound lowland
  Repeater Group      224.58            Cascade foothills
Seattle Auxiliary     146.96 (WA7DEM)   King County ARES/RACES
  Communications
Snohomish Co ARES     146.92 (WA7DEM)   Snohomish County
Puget Sound           443.325           UHF metro coverage
  Repeater Group
Capitol Peak          147.08 (W7PFR)    South Sound
  Repeater
Pacific NW            441.075           Digital voice (DMR/Fusion)
  Digital Network
AREDN Mesh            2.4/5 GHz        IP networking over HAM bands
================================================================
```

### AREDN: Amateur Radio Emergency Data Network

AREDN is particularly significant for the PNW Signal Stack because it demonstrates mesh networking over licensed amateur frequencies. AREDN nodes use modified commercial Wi-Fi hardware operating on amateur 2.4 GHz, 5 GHz, and 900 MHz bands with higher power and broader channels than Part 15 permits [10].

A minimum of three AREDN nodes creates a self-healing mesh topology capable of carrying IP traffic including VoIP, video, web services, and file transfer. The PNW's ARES (Amateur Radio Emergency Service) groups have deployed AREDN nodes at hospitals, emergency operations centers, and fire stations as backup communications infrastructure for Cascadia Subduction Zone disaster preparedness.

---

## 8. Part 95: Personal Radio Services

Part 95 governs several license-free and lightly-licensed personal radio services [11]:

### Citizens Band (CB) -- Part 95 Subpart D

| Parameter | Value |
|-----------|-------|
| Frequency | 26.965-27.405 MHz (40 channels) |
| Max power | 4 watts AM / 12 watts SSB |
| License | None required |
| Antenna height | Max 20 feet above existing structure or tree |
| Range | 1-10 miles terrain-dependent |

CB radio remains widely used by commercial trucking on I-5 and I-90 corridors through the PNW. Channel 19 is the informal trucker channel; Channel 9 is designated for emergency communications [11].

### GMRS -- Part 95 Subpart E

| Parameter | Value |
|-----------|-------|
| Frequency | 462/467 MHz (30 channels) |
| Max power | 50 watts on some channels; 5 watts on others |
| License | Required (no exam), $35 fee, 5-year term |
| Coverage | Covers licensee and immediate family members |
| Repeaters | GMRS repeater use permitted on designated channels |

### FRS -- Part 95 Subpart B

| Parameter | Value |
|-----------|-------|
| Frequency | 462/467 MHz (22 channels, shared with GMRS) |
| Max power | 2 watts (channels 1-7, 15-22); 0.5 watts (channels 8-14) |
| License | None required |
| Range | 0.5-2 miles typical |

### MURS -- Part 95 Subpart J

| Parameter | Value |
|-----------|-------|
| Frequency | 151.820, 151.880, 151.940, 154.570, 154.600 MHz |
| Max power | 2 watts |
| License | None required |
| Antenna | Max 20 feet above structure/tree |

---

## 9. ISM Bands and Unlicensed Wireless

The Industrial, Scientific, and Medical (ISM) bands are internationally designated for non-communication use but are also available for unlicensed communications under Part 15. These bands support the wireless technologies that form the foundation of modern mesh networking [12]:

### 902-928 MHz (900 MHz ISM)

Used for: LoRa/LoRaWAN, Z-Wave, some cordless phones, AREDN mesh (under Part 97 with amateur license). Maximum power: 1 watt conducted + 6 dBi antenna gain under Part 15.247.

### 2400-2483.5 MHz (2.4 GHz ISM)

Used for: Wi-Fi (802.11b/g/n/ax), Bluetooth, ZigBee, microwave ovens, AREDN mesh. Maximum power: 1 watt conducted + 6 dBi antenna gain (point-to-multipoint) or higher with directional antennas under specific conditions [12].

### 5150-5850 MHz (5 GHz U-NII)

Used for: Wi-Fi (802.11a/n/ac/ax), AREDN mesh. Power limits vary by sub-band:

| Sub-band | Frequency | Max Power | Use |
|----------|-----------|-----------|-----|
| U-NII-1 | 5150-5250 MHz | 200 mW (indoor only) | Wi-Fi |
| U-NII-2A | 5250-5350 MHz | 200 mW (DFS required) | Wi-Fi |
| U-NII-2C | 5470-5725 MHz | 200 mW (DFS required) | Wi-Fi |
| U-NII-3 | 5725-5850 MHz | 1 W (outdoor OK) | Wi-Fi, PtP links |

DFS (Dynamic Frequency Selection) is required on U-NII-2 bands because they are shared with weather radar. Devices must detect radar signals and vacate the channel within a specified time [12].

### 5925-7125 MHz (6 GHz Band)

Opened by the FCC in April 2020 for unlicensed use (Wi-Fi 6E / Wi-Fi 7). This 1200 MHz allocation more than doubled the available Wi-Fi spectrum. Low-power indoor devices and standard-power outdoor devices are permitted under specific AFC (Automated Frequency Coordination) requirements to protect incumbent licensed users [13].

---

## 10. PNW-Specific Spectrum Considerations

### Terrain Effects on Propagation

The Pacific Northwest's dramatic topography creates unique spectrum propagation challenges:

- **Cascade Range:** Creates a 4,000-14,000 foot wall blocking most VHF/UHF signals between the Puget Sound lowland and eastern Washington. Only HF signals (which reflect off the ionosphere) and satellite links reliably cross the range.
- **Olympic Mountains:** Block signals between the Olympic Peninsula and the Puget Sound metro area, requiring translator chains for television and repeater chains for amateur radio.
- **Puget Sound water surface:** Provides excellent ground-wave propagation for AM signals along the north-south axis. VHF signals can achieve enhanced propagation over water due to lower surface roughness.
- **Rain attenuation:** Above 10 GHz, PNW rainfall (averaging 37 inches annually in Seattle) causes measurable signal attenuation. At 28 GHz (5G mmWave), heavy rainfall can reduce signal strength by 5-10 dB/km [7].

```
PNW TERRAIN PROPAGATION EFFECTS
================================================================
                    OLYMPICS        CASCADES
                    ~~~~~~~~        ~~~~~~~~
                   /        \      /        \
  Pacific       /            \  /            \    Eastern WA
  Ocean       /    VHF/UHF    \/    VHF/UHF    \    (dry,
            /     blocked     /\    blocked      \    flat)
          /                 /    \                 \
        /    Puget Sound  /      \                  \
      /     (excellent   /        \   Passes:        \
    /      propagation) /          \  Snoqualmie,     \
  /                   /            \  Stevens,         \
/___________________/________________\ White            \
                                       (limited gaps)
================================================================
```

### Cascadia Subduction Zone Preparedness

The Cascadia Subduction Zone (CSZ) earthquake threat (estimated M9.0+, last occurred January 26, 1700) drives significant spectrum infrastructure planning in the PNW. Emergency communications plans rely heavily on:

- Amateur radio operators as backup communications for hospitals, shelters, and EOCs
- GMRS and FRS for family/neighborhood communications when cellular networks fail
- NOAA Weather Radio (162.400-162.550 MHz) for automated severe weather alerts
- EAS (Emergency Alert System) broadcast via AM/FM/TV stations [14]

> **Related:** [Aerial Network Infrastructure](04-aerial-network-infrastructure.md) for HAPS-based emergency communications, [BPS](../BPS/) for mesh sensor networks in disaster response

---

## 11. Enforcement and Penalties

The FCC's Enforcement Bureau investigates and prosecutes unlicensed operation. Penalties for operating beyond Part 15 limits without appropriate license [1]:

| Violation Type | Maximum Penalty |
|---------------|-----------------|
| First offense (individual) | $10,000 per day, max $75,000 |
| First offense (entity) | $10,000 per day, max $100,000 |
| Repeat offense | $100,000 per day, max $2,000,000 |
| Equipment seizure | FCC can seize and forfeit transmitting equipment |
| Criminal prosecution | Up to $100,000 fine and/or 1 year imprisonment |

The FCC maintains a network of monitoring stations and field offices. The Seattle FCC field office covers Washington, Oregon, Idaho, Montana, and Alaska. Complaints about interference from unlicensed operators are investigated, and the FCC uses direction-finding equipment to locate offending transmitters [15].

> **FCC COMPLIANCE NOTE:** All build specifications in this research project (see M3: DIY RF & Computing Builds) are designed to comply with current FCC rules. Any build involving transmission requires either Part 15 compliance or an appropriate FCC license. Consult a licensed broadcast engineer for commercial or community broadcast applications.

---

## 12. The Amiga Principle in Spectrum Allocation

The FCC's frequency allocation table is fundamentally a chipset specification. Each band is a specialized chip: AM broadcasting occupies its designated slice (535-1705 kHz), FM broadcasting has its slice (88-108 MHz), amateur radio has its distributed bands, and unlicensed ISM devices share their designated frequencies. Each "chip" operates at its prescribed power level with its specific modulation scheme, and together they form a communications fabric that serves millions of users simultaneously [16].

The Amiga Principle -- specialized execution paths working in concert produce outcomes that general-purpose brute force cannot match -- applies directly. A single wideband transmitter covering the entire spectrum would be illegal, inefficient, and destructive. Instead, the allocation table creates hundreds of narrow, specialized channels, each optimized for its specific purpose: AM for wide-area ground-wave coverage, FM for high-fidelity local service, UHF for television, ISM for short-range wireless, amateur for emergency backup and experimentation.

The PNW Signal Stack's contribution is to make this chipset architecture visible and accessible to the communities it serves. Most people know that their Wi-Fi router operates on 2.4 or 5 GHz but have no idea that they share those frequencies with microwave ovens, baby monitors, and amateur radio operators -- or that the rules governing their use are entirely different depending on whether you are operating under Part 15 (unlicensed), Part 97 (amateur), or Part 18 (ISM industrial) [16].

---

## 13. Cross-References

- **SGL (Signal & Light):** DSP algorithms for OFDM and modulation schemes used across spectrum
- **RBH:** Regulatory history and the Radio Act of 1927 public trust standard
- **FCC:** Federal Communications Commission organizational structure and procedures
- **BPS (Bio-Physics Sensors):** ISM band sensor networks and Part 15 compliance
- **LED:** Part 15.231 control transmitter applications for lighting systems
- **T55:** Amiga chipset architecture as spectrum allocation metaphor
- **SYS (Systems Administration):** Network infrastructure for licensed service operations
- **PSG:** Signal propagation models for coverage prediction
- **K8S:** Distributed systems parallels for shared spectrum management

---

## 14. Sources

1. Federal Communications Commission. *About the FCC.* fcc.gov/about/overview. Organizational structure and regulatory authority.
2. National Telecommunications and Information Administration. *Federal Spectrum Management.* ntia.gov/category/spectrum-management. NTIA allocation table and federal spectrum management.
3. International Telecommunication Union. *Radio Regulations.* itu.int/pub/R-REG-RR. ITU Region 2 allocations applicable to the Americas.
4. Federal Communications Commission. *Title 47 CFR Part 15: Radio Frequency Devices.* ecfr.gov. Sections 15.209, 15.219, 15.221, 15.239, 15.23.
5. REC Networks. *Part 15 FAQ: AM and FM Micro-power Broadcasting.* recnet.com. Practical coverage estimates for Part 15 operations.
6. Federal Communications Commission. *Title 47 CFR Part 73: Radio Broadcast Services.* ecfr.gov. AM, FM, TV, and LPFM broadcast rules.
7. FCC Office of Engineering and Technology. *Bulletin No. 69: Longley-Rice Methodology for Evaluating TV Coverage.* Terrain-dependent propagation modeling.
8. Federal Communications Commission. *Low Power Radio: General Information.* fcc.gov/media/radio/low-power-radio-general-information. LPFM licensing, power classes, eligibility.
9. ARRL (American Radio Relay League). *Amateur Radio Licensing.* arrl.org/getting-licensed. License classes, exam procedures, VE program.
10. AREDN Project. *Amateur Radio Emergency Data Network.* arednmesh.org. Mesh networking over amateur frequencies.
11. Federal Communications Commission. *Title 47 CFR Part 95: Personal Radio Services.* ecfr.gov. CB, GMRS, FRS, MURS rules.
12. Federal Communications Commission. *Title 47 CFR Part 15, Subpart C: Intentional Radiators.* ISM band power limits, DFS requirements, Wi-Fi rules.
13. Federal Communications Commission. *Report and Order ET Docket No. 18-295.* April 2020. 6 GHz band opening for unlicensed use.
14. Pacific Northwest Seismic Network. *Cascadia Subduction Zone.* pnsn.org. CSZ earthquake preparedness and communications planning.
15. FCC Enforcement Bureau. *Field Operations and Enforcement Actions.* fcc.gov/enforcement. Penalty schedules, equipment seizure procedures.
16. Miner, Jay et al. *Amiga Hardware Reference Manual.* Commodore-Amiga, 1985. Chipset architecture as spectrum allocation metaphor.
17. ARRL. *Part 15 Radio Frequency Devices.* arrl.org/part-15-radio-frequency-devices. Practical guidance on Part 15 operations.
18. Prometheus Radio Project. *How to Find Radio Station Licenses at the FCC.* prometheusradio.org. Community radio advocacy and licensing assistance.
