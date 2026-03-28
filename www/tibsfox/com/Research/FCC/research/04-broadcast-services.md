# Broadcast Radio Services

> **Domain:** Over-the-Air Broadcasting Regulation
> **Module:** 4 -- Subchapter C: Parts 73-79, Broadcast Radio Services
> **Through-line:** *Broadcasting is the original mass medium -- spectrum allocated to a single transmitter reaching millions of receivers simultaneously. Part 73 is where the AM dial, the FM dial, and the TV channel lineup live as regulatory constructs. The allotment tables that determine which frequencies serve which communities are among the most carefully maintained data structures in all of federal regulation. Every station you tune to exists because someone navigated this Part.*

---

## Table of Contents

1. [Subchapter C Overview](#1-subchapter-c-overview)
2. [Part 73: Radio Broadcast Services](#2-part-73-radio-broadcast-services)
3. [AM Broadcasting (Subpart A)](#3-am-broadcasting-subpart-a)
4. [FM Broadcasting (Subpart B)](#4-fm-broadcasting-subpart-b)
5. [Noncommercial Educational FM (Subpart C)](#5-noncommercial-educational-fm-subpart-c)
6. [Television Broadcasting (Subpart E)](#6-television-broadcasting-subpart-e)
7. [The ATSC 3.0 Transition](#7-the-atsc-30-transition)
8. [Part 74: Auxiliary and Special Broadcast](#8-part-74-auxiliary-and-special-broadcast)
9. [Part 76: Cable Television](#9-part-76-cable-television)
10. [Part 79: Accessibility](#10-part-79-accessibility)
11. [Part 78: Cable Television Relay Service](#11-part-78-cable-television-relay-service)
12. [Broadcast Licensing and Ownership](#12-broadcast-licensing-and-ownership)
13. [Cross-References](#13-cross-references)
14. [Sources](#14-sources)

---

## 1. Subchapter C Overview

Subchapter C (Parts 70--79) governs broadcast radio services -- the one-to-many transmission systems that deliver audio and video content over the air to the general public [1]:

| Part | Title | Scope |
|------|-------|-------|
| 73 | Radio Broadcast Services | AM, FM, TV broadcast stations |
| 74 | Experimental Radio, Auxiliary, Special Broadcast | LPTV, translators, boosters, remote pickup |
| 76 | Multichannel Video and Cable Television | Cable systems, MVPDs, must-carry |
| 78 | Cable Television Relay Service | Microwave relay for cable headends |
| 79 | Accessibility of Video Programming | Closed captioning, audio description |

Part 73 is the dominant regulation in this subchapter -- it contains the allotment tables, technical standards, and licensing rules for every AM, FM, and television broadcast station in the United States. The Media Bureau of the FCC administers all of Subchapter C [2].

Subchapter C is notable for its stability. While Subchapter B (Common Carrier) has been reshaped by net neutrality litigation and technological convergence, the fundamental structure of broadcast regulation has remained relatively constant since the Telecommunications Act of 1996. The major current development is the ATSC 3.0 transition, which is introducing IP-based, OFDM-modulated digital television broadcasting.

---

## 2. Part 73: Radio Broadcast Services

Part 73 is the foundational broadcast regulation. It is organized into subparts corresponding to each broadcast service [1]:

| Subpart | Service | Key Provisions |
|---------|---------|----------------|
| A | AM Broadcast | Clear, regional, local channels; 535--1705 kHz |
| B | FM Broadcast | 88--108 MHz allotment table (Section 73.202); class system |
| C | Noncommercial Educational FM | Reserved spectrum 88--92 MHz; licensing priority |
| E | Television Broadcast | Channel allotment table (Section 73.603); ATSC 3.0 |
| F | International Broadcast Stations | Shortwave; ITU coordination |
| G | Low Power FM (LPFM) | 100 watts or less; community radio; no translator protection |
| H | Class A Television | Full-power status for qualifying LPTV stations |

Each subpart contains the technical standards (antenna height, power limits, radiation patterns), licensing requirements, and operating rules specific to its service type.

---

## 3. AM Broadcasting (Subpart A)

AM (Amplitude Modulation) broadcasting operates in the Medium Frequency (MF) band from 535 to 1705 kHz. The AM allocation scheme is based on three channel types that determine coverage characteristics [3]:

### Channel Classifications

| Channel Type | Description | Coverage | Stations |
|-------------|-------------|----------|----------|
| Clear | Assigned to one or two dominant stations per channel; wide-area nighttime coverage | Up to 750 miles at night | ~60 stations |
| Regional | Multiple stations per channel; moderate coverage | 100-200 miles daytime | ~1,000+ stations |
| Local | Many stations per channel; limited coverage | 25-50 miles | ~2,500+ stations |

AM propagation varies dramatically between day and night. During the day, AM signals follow the ground wave and attenuate predictably with distance. At night, the ionosphere reflects AM signals (skywave propagation), dramatically extending range but also creating interference between stations that are separated by hundreds of miles during the day. This is why many AM stations must reduce power or change directional patterns at sunset.

### Key Sections

- **Section 73.14:** AM broadcast definitions
- **Section 73.21-73.37:** AM station classes and power limits
- **Section 73.150-73.190:** AM antenna systems (directional arrays, proof of performance)
- **Section 73.1560:** Operating power tolerances

### AM Revitalization

The FCC's AM Revitalization proceeding (MB Docket No. 13-249) has introduced several measures to support the struggling AM band, including allowing AM stations to establish FM translators for improved coverage and sound quality [4].

---

## 4. FM Broadcasting (Subpart B)

FM (Frequency Modulation) broadcasting operates in the VHF band from 88 to 108 MHz. The FM allocation system is one of the most carefully engineered structures in the entire CFR [5].

### The FM Allotment Table (Section 73.202)

Section 73.202 contains the Table of Allotments -- a community-by-community listing of FM channel assignments across the United States. Each allotment specifies:

- The community of license
- The channel number (201-300, corresponding to 88.1-107.9 MHz in 200 kHz steps)
- The station class (determining power and antenna height limits)

The allotment table is a spatial allocation algorithm: each channel assignment must satisfy minimum distance separation requirements to protect existing stations from co-channel and adjacent-channel interference.

### FM Station Classes

| Class | Max ERP | Max HAAT | Service Area | Band Segment |
|-------|---------|----------|-------------|--------------|
| A | 6 kW | 100m | Local | 92.1-107.9 MHz |
| B1 | 25 kW | 100m | Regional | 92.1-107.9 MHz |
| B | 50 kW | 150m | Regional | 92.1-107.9 MHz |
| C3 | 25 kW | 100m | Extended | 92.1-107.9 MHz |
| C2 | 50 kW | 150m | Extended | 92.1-107.9 MHz |
| C1 | 100 kW | 299m | Wide-area | 92.1-107.9 MHz |
| C | 100 kW | 600m | Maximum | 92.1-107.9 MHz |
| D | 10 W | 30m | Educational | 88.1-91.9 MHz |

ERP = Effective Radiated Power. HAAT = Height Above Average Terrain.

Class C stations (100 kW at 600m HAAT) are the "blowtorch" stations -- their coverage can extend 100+ miles. These are typically located on mountain peaks or tall tower structures and serve as the primary FM signal source for large geographic areas.

### FM Contour Protection

The FM allotment system protects stations from interference using contour overlap methodology [5]:

```
FM INTERFERENCE PROTECTION MODEL
================================================================

  Station A: 100 kW ERP at 300m HAAT
    60 dBu contour (City Grade): ~30 km radius
    54 dBu contour (Suburban):   ~45 km radius
    Principal community contour: Must cover community of license

  Station B (co-channel): Must not have 60 dBu contour
    overlapping Station A's 60 dBu contour

  Station C (first-adjacent, +/- 200 kHz):
    Reduced separation requirements; moderate overlap permitted

  Station D (second-adjacent, +/- 400 kHz):
    Minimal separation; significant overlap tolerated
```

The minimum distance separations defined in Section 73.207 vary by class combination. For two Class C stations on the same channel, the minimum separation is 290 km. For a Class C and a Class A on the same channel, it is 224 km. These separations ensure that the population within each station's service area receives adequate signal quality.

### HD Radio (IBOC)

HD Radio (In-Band On-Channel digital broadcasting) was authorized by the FCC in 2002 for FM and 2005 for AM:

- FM HD Radio uses hybrid analog-digital OFDM sidebands adjacent to the analog FM signal
- Up to three multicast channels per station (HD1 = main, HD2 and HD3 = supplementary)
- Digital signal provides CD-quality audio (96 kbps AAC per channel)
- Artist/title metadata transmitted via Program Associated Data (PAD)
- FM HD Radio operates at -20 dBc to -14 dBc relative to the analog carrier (power levels increased in 2010)

### Key FM Sections

- **Section 73.201:** FM channel designations (channels 201-300)
- **Section 73.202:** Table of Allotments
- **Section 73.207:** Minimum distance separation
- **Section 73.211:** Effective radiated power calculations
- **Section 73.310:** FM technical definitions
- **Section 73.322:** FM stereophonic transmission standards

---

## 5. Noncommercial Educational FM (Subpart C)

The 88.1--91.9 MHz portion of the FM band (channels 201--220) is reserved exclusively for noncommercial educational (NCE) broadcasting [6]. This reservation, established in 1945, is one of the most significant spectrum policy decisions in US broadcasting history.

### NCE Characteristics

- **No commercial advertising** permitted (underwriting announcements allowed with restrictions)
- **Public, educational, and religious** broadcasters eligible
- **CPB funding eligibility** for stations meeting Corporation for Public Broadcasting criteria
- **Class D stations:** 10 watts or less, protected only from full-power stations (not from other NCE applications)
- **Licensing priority:** Educational institutions receive preference in comparative proceedings

Major NCE networks include NPR (National Public Radio), PBS (Public Broadcasting Service) member stations, university radio stations, and community radio stations. The reserved band is heavily utilized; new NCE channel allotments are increasingly scarce in urban areas.

---

## 6. Television Broadcasting (Subpart E)

Television broadcasting in the United States transitioned from analog (NTSC) to digital (ATSC) on June 12, 2009, one of the largest technology transitions in broadcast history [7].

### TV Channel Allocations

| Band | Channels | Frequency | Notes |
|------|----------|-----------|-------|
| VHF Low | 2--6 | 54--88 MHz | Long range; large antennas |
| VHF High | 7--13 | 174--216 MHz | Medium range |
| UHF | 14--36 | 470--608 MHz | Post-incentive auction allocation |

The television channel allotment table (Section 73.603) assigns channels to communities in a manner similar to FM, but with additional complexity due to the larger channel bandwidth (6 MHz per channel vs. 200 kHz for FM) and the multiple propagation characteristics across VHF and UHF bands.

### Incentive Auction (2016-2017)

The FCC's broadcast incentive auction (Auction 1000) reclaimed UHF channels 38--51 (614--698 MHz) from broadcast use and repurposed them for mobile broadband (the 600 MHz band, now used by T-Mobile for 5G). This was a spectrum reallocation of historic scale: broadcast television was permanently reduced from channels 2--51 to channels 2--36. Existing stations on channels above 36 were "repacked" to lower channels [8].

---

## 7. The ATSC 3.0 Transition

ATSC 3.0 ("NextGen TV") is the next-generation digital television standard being deployed in the United States. Unlike the mandatory analog-to-digital transition of 2009, the ATSC 3.0 transition is voluntary and market-driven [9].

### ATSC 3.0 Technical Features

| Feature | ATSC 1.0 (Current) | ATSC 3.0 (NextGen) |
|---------|--------------------|--------------------|
| Modulation | 8-VSB | OFDM (Orthogonal Frequency Division Multiplexing) |
| Resolution | Up to 1080i | Up to 2160p (4K UHD) |
| Audio | AC-3 (Dolby Digital) | AC-4 (Dolby AC-4), MPEG-H |
| Transport | MPEG-2 Transport Stream | IP-based (ROUTE/DASH) |
| Internet | None | Built-in broadband return path |
| Emergency alerts | EAS | Advanced Emergency Alerting (geo-targeting) |
| Mobile reception | Poor | Designed for mobile/portable |

### Regulatory Framework

The FCC authorized voluntary ATSC 3.0 deployment in November 2017 (MB Docket No. 16-142). Key rules:

- Stations may convert to ATSC 3.0 but must continue providing ATSC 1.0 simulcast service
- ATSC 3.0 signals may be broadcast on the station's own channel or via channel-sharing arrangements
- The ATSC 1.0 simulcast requirement ensures no viewer loses access during the transition
- No mandatory transition date has been set

ATSC 3.0 is significant for the GSD ecosystem because its IP-based transport layer enables interactive applications, datacasting (one-to-many IP data delivery over broadcast spectrum), and targeted advertising -- capabilities that blur the line between broadcasting and broadband.

---

## 8. Part 74: Auxiliary and Special Broadcast

Part 74 governs supplementary broadcast services that support or extend the primary broadcast services of Part 73 [10]:

| Subpart | Service | Purpose |
|---------|---------|---------|
| A | Experimental Broadcast | Testing new broadcast technologies |
| D | Remote Pickup Broadcast | Field audio/video backhaul to studios |
| E | Aural Broadcast STL/ICR | Studio-transmitter links, intercity relay |
| F | Television Broadcast Auxiliary | ENG (electronic news gathering), STL |
| G | Low Power TV (LPTV) | Low-power community television |
| H | Television Translator Stations | Signal retransmission for coverage fill |
| K | FM Translator and Booster Stations | FM signal extension |
| L | FM Broadcast Translator / Booster | Digital FM translators |

### LPTV and Translators

Low Power Television (LPTV) stations and TV/FM translators serve critical coverage extension roles, particularly in rural and mountainous terrain where full-power stations cannot reach all communities. LPTV stations operate at a maximum of 3 kW (VHF) or 15 kW (UHF) ERP, compared to full-power stations that may operate at 1,000 kW (1 MW) UHF ERP.

FM translators have become particularly important for AM revitalization: the FCC now permits AM stations to operate FM translators that rebroadcast their AM signal on the FM band, providing improved audio quality and coverage.

---

## 9. Part 76: Cable Television

Part 76 governs multichannel video programming distributors (MVPDs), primarily cable television systems [11].

### Key Part 76 Provisions

- **Must-carry (Section 76.55--76.70):** Cable systems must carry local broadcast stations that request carriage. This is the regulatory mechanism that ensures broadcast TV stations remain available on cable systems.
- **Retransmission consent (Section 76.64):** Broadcast stations may alternatively negotiate carriage agreements (retransmission consent) with cable systems, typically involving per-subscriber fees.
- **Technical standards (Subpart K):** Signal quality requirements for cable systems.
- **Consumer protection:** Program access rules, billing practices, customer service standards.

### Deregulatory Trends

Part 76 has been progressively deregulated:

- Rate regulation of cable services was largely eliminated by the Telecommunications Act of 1996
- Program access rules (preventing vertically integrated programmers from withholding content from competitors) have been allowed to sunset
- The Carr FCC has proposed further streamlining of cable television rules as the market shifts toward streaming/OTT services

---

## 10. Part 79: Accessibility

Part 79 implements the accessibility requirements of the Communications Act and the Twenty-First Century Communications and Video Accessibility Act (CVAA) [12]:

- **Closed captioning (Sections 79.1--79.4):** All non-exempt programming must be captioned; quality standards for accuracy, synchronicity, completeness, and placement
- **Audio description (Section 79.3):** Video description of visual content for blind/visually impaired viewers; required on top-rated broadcast and cable networks
- **Emergency information accessibility (Section 79.2):** Emergency crawls and alerts must be accessible
- **Apparatus requirements:** TV receivers and set-top boxes must support caption display and audio description pass-through

Part 79 has been strengthened repeatedly. The FCC issued an order in 2024 requiring improved closed captioning quality standards, including accuracy benchmarks and complaint procedures.

---

## 11. Part 78: Cable Television Relay Service

Part 78 governs the Cable Television Relay Service (CARS), which provides microwave relay facilities for transmitting signals to cable television systems [1]. CARS stations operate in the 12.7--13.2 GHz band and are used to deliver programming to cable headends where fiber is not available.

Key provisions:
- **Section 78.1--78.9:** General definitions and eligibility (must be associated with a cable system)
- **Section 78.11--78.33:** Licensing procedures and technical standards
- **Frequency coordination:** Required with other fixed microwave users in the 12 GHz band

CARS has diminished in importance as fiber connections to cable headends have replaced microwave links, but the service remains active in rural areas where headend-to-headend microwave relay is the only available backhaul technology.

---

## 12. Broadcast Licensing and Ownership

Part 73 contains detailed licensing and ownership provisions that shape the structure of the American broadcasting industry [1]:

### Licensing Process

Broadcasting licenses are issued for renewable 8-year terms. The licensing process includes:

1. **Construction Permit (CP):** Authorization to build a broadcast station; must be applied for before construction begins
2. **Program Test Authority:** Authorization to begin test transmissions before full license grant
3. **License Grant:** Full operating authority, renewable at the end of each 8-year term
4. **Renewal:** Comparative renewal process; existing licensees have a reasonable expectation of renewal if they have served the public interest

### Ownership Limits

The FCC maintains media ownership rules under Part 73 to promote diversity and localism [14]:

| Rule | Limit | Status |
|------|-------|--------|
| Local radio | Up to 8 stations per market (varies by market size) | Active |
| Local TV | Up to 2 stations per market (only 1 in top-4 rated) | Active |
| National TV | Stations reaching up to 39% of US TV households | Active |
| Newspaper/broadcast cross-ownership | Eliminated 2017 (Prometheus v. FCC, 3rd Circuit) | Eliminated |
| Radio/TV cross-ownership | Modified; relaxed under 2017 Reconsideration Order | Modified |

### Low Power FM (LPFM) -- Subpart G

LPFM stations were authorized by the Local Community Radio Act of 2010 and operate under Part 73 Subpart G [1]:

- Maximum power: 100 watts ERP
- **Non-commercial** operation only
- Must be locally owned and operated (no national networks)
- No ownership by entities that own other broadcast stations
- Distance separation from full-power FM stations required
- LPFM stations do not receive interference protection from FM translators

LPFM has enabled hundreds of community radio stations across the United States, particularly in underserved communities. These stations serve hyper-local programming needs that full-power stations cannot address.

### Emergency Alert System (EAS) Integration

While the Emergency Alert System is governed by Part 11 (Subchapter A), broadcast stations are the primary distribution mechanism for EAS alerts [7]. All broadcast stations must:

- Maintain EAS receiving and transmission equipment
- Monitor designated EAS sources
- Transmit Presidential alerts without delay
- File EAS test result reports with the FCC

The ATSC 3.0 transition introduces advanced emergency alerting capabilities including geo-targeted alerts (alerts sent only to viewers in the affected area) and rich media alerts (maps, evacuation routes, photographs).

---

## 13. Cross-References

> **Related:** [Structural Anatomy](01-structural-anatomy.md) -- the Media Bureau and Subchapter C organizational context. [Common Carrier](03-common-carrier.md) -- Subchapter B, the adjacent commercial services chapter; the broadcast/broadband convergence through ATSC 3.0. [Regulatory Flux](06-regulatory-flux.md) -- Part 76 deregulation under the Carr FCC and ATSC 3.0 proceedings.

**Series cross-references:**
- **RBH (Radio Broadcasting History):** Historical development of AM, FM, and TV broadcasting regulation
- **CBC (CBC/Radio-Canada):** Canadian broadcasting regulation comparison (CRTC Broadcasting Act vs. FCC Part 73)
- **IBC (Indigenous Broadcasting):** Tribal broadcasting and NCE spectrum access
- **KPZ (KPLZ Seattle):** Specific FM station operating under Part 73 Subpart B
- **C89 (C89.5 FM):** Noncommercial educational FM under Part 73 Subpart C
- **SVB (Student Voice Broadcasting):** Student-operated broadcasting under NCE provisions
- **DAA (Deep Audio):** Audio processing standards in broadcast chain

---

## 14. Sources

1. Electronic Code of Federal Regulations. *Title 47, Chapter I, Subchapter C*. ecfr.gov/current/title-47/chapter-I/subchapter-C (accessed March 2026).
2. Federal Communications Commission. *Media Bureau*. fcc.gov/media (accessed March 2026).
3. Federal Communications Commission. *Part 73 Subpart A: AM Broadcast Stations*. 47 CFR Part 73 Subpart A.
4. Federal Communications Commission. *AM Revitalization*. MB Docket No. 13-249.
5. Federal Communications Commission. *Part 73 Subpart B: FM Broadcast Stations*. 47 CFR Part 73 Subpart B.
6. Federal Communications Commission. *Part 73 Subpart C: Noncommercial Educational FM Broadcast Stations*. 47 CFR Part 73 Subpart C.
7. Federal Communications Commission. *The Digital TV Transition*. fcc.gov/general/digital-television (accessed March 2026).
8. Federal Communications Commission. *Broadcast Incentive Auction*. Auction 1000. fcc.gov/auction/1000 (completed 2017).
9. Federal Communications Commission. *ATSC 3.0 ("Next Gen TV")*. MB Docket No. 16-142.
10. Federal Communications Commission. *Part 74: Experimental Radio, Auxiliary, Special Broadcast*. 47 CFR Part 74.
11. Federal Communications Commission. *Part 76: Multichannel Video and Cable Television Service*. 47 CFR Part 76.
12. Federal Communications Commission. *Part 79: Accessibility of Video Programming*. 47 CFR Part 79.
13. ATSC. *ATSC 3.0 Standard*. atsc.org/standards (accessed March 2026).
14. Cornell Legal Information Institute. *47 CFR Part 73*. law.cornell.edu/cfr/text/47/part-73 (accessed March 2026).
15. Corporation for Public Broadcasting. *CPB Funding Guidelines*. cpb.org (accessed March 2026).
16. National Association of Broadcasters. *State of the Broadcast Industry 2025*. nab.org (accessed March 2026).

---

*FCC Catalog -- Module 4: Broadcast Radio Services. From the AM clear channel to the FM allotment table to the ATSC 3.0 IP transport layer -- the regulatory architecture of American broadcasting.*
