# Common Carrier & Wireless Services

> **Domain:** Commercial Telecommunications Regulation
> **Module:** 3 -- Subchapter B: Parts 20-69, Common Carrier Services
> **Through-line:** *Subchapter B is where the money is. Every cellular call, every broadband subscription, every satellite downlink, every telephone interconnection agreement -- all of it runs through Parts 20 through 69. The January 2025 Sixth Circuit ruling that ended federal net neutrality reshaped this entire subchapter's regulatory landscape. Understanding Subchapter B means understanding the legal framework within which every commercial ISP, cellular carrier, and satellite operator in the United States now exists.*

---

## Table of Contents

1. [Subchapter B Overview](#1-subchapter-b-overview)
2. [Part 20: Commercial Mobile Radio Services](#2-part-20-commercial-mobile-radio-services)
3. [Part 22: Public Mobile Services](#3-part-22-public-mobile-services)
4. [Part 24: Personal Communications Services](#4-part-24-personal-communications-services)
5. [Part 25: Satellite Communications](#5-part-25-satellite-communications)
6. [Part 27: Miscellaneous Wireless Communications](#6-part-27-miscellaneous-wireless-communications)
7. [Part 54: Universal Service](#7-part-54-universal-service)
8. [Parts 51 and 52: Interconnection and Numbering](#8-parts-51-and-52-interconnection-and-numbering)
9. [Net Neutrality: The Sixth Circuit Resolution](#9-net-neutrality-the-sixth-circuit-resolution)
10. [Parts 32-36: Telephone Company Accounting](#10-parts-32-36-telephone-company-accounting)
11. [Parts 64 and 68: Consumer Protection and Equipment](#11-parts-64-and-68-consumer-protection-and-equipment)
12. [Part 69: Access Charges](#12-part-69-access-charges)
13. [Cross-References](#13-cross-references)
14. [Sources](#14-sources)

---

## 1. Subchapter B Overview

Subchapter B (Parts 20--69) governs "common carriers" -- entities that offer communications services to the public for hire. This is the regulatory home of every cellular provider, satellite operator, telephone company, and broadband ISP in the United States [1].

| Part | Title | Scope |
|------|-------|-------|
| 20 | Commercial Mobile Services | CMRS/PMRS distinction; signal boosters |
| 22 | Public Mobile Services | Cellular carriers, paging, rural radio |
| 24 | Personal Communications Services | Licensed PCS bands (1900 MHz) |
| 25 | Satellite Communications | GEO and NGSO; Space Bureau |
| 26 | General Wireless Communications | Broadband PCS (reserved/merged) |
| 27 | Miscellaneous Wireless | 700 MHz, AWS, BRS/EBS, 3.45 GHz |
| 32--36 | Telephone Accounting & Separations | GAAP-based telco accounting; rate regulation |
| 42 | Preservation of Records | Carrier record retention requirements |
| 43 | Reports of Communication Common Carriers | Annual reporting |
| 51 | Interconnection | Local loop unbundling; UNE obligations |
| 52 | Numbering | NANP administration; number portability |
| 54 | Universal Service | E-rate, Lifeline, CAF, Rural Health Care |
| 61 | Tariffs | Common carrier rate filing (largely deregulated) |
| 63 | Extension of Lines and Discontinuance | Service area changes, foreign ownership |
| 64 | Miscellaneous Rules | CPNI, PIRATE Act, subscriber protections |
| 65 | Interstate Rate of Return | Price cap/rate-of-return regulation |
| 68 | Connection of Terminal Equipment | CPE standards (customer premises equipment) |
| 69 | Access Charges | Interstate carrier access charge structure |

The Wireline Competition Bureau administers the majority of these Parts; the Wireless Telecommunications Bureau handles Parts 20, 22, 24, and 27; the International Bureau handles Part 25 (now shared with the Space Bureau); and the Consumer & Governmental Affairs Bureau handles some Part 64 provisions [2].

---

## 2. Part 20: Commercial Mobile Radio Services

Part 20 establishes the regulatory framework for commercial mobile radio services (CMRS) -- the legal category that covers cellular carriers (AT&T, Verizon, T-Mobile), mobile virtual network operators (MVNOs), and signal booster manufacturers [3].

### CMRS vs. PMRS

The critical distinction in Part 20 is between CMRS (Commercial Mobile Radio Service) and PMRS (Private Mobile Radio Service):

- **CMRS:** Service offered to the public on a for-profit basis. Subject to common carrier regulation (Title II of the Communications Act). Includes cellular, PCS, and broadband mobile services.
- **PMRS:** Private radio systems not offered to the public. Regulated under Part 90 (Subchapter D), not subject to common carrier obligations.

This distinction has significant implications for mesh networking: a community mesh network that does not offer service to the public for profit may qualify as PMRS rather than CMRS, avoiding the common carrier regulatory obligations that apply to commercial ISPs.

### Signal Booster Rules

Part 20 Subpart K (Sections 20.21--20.22) governs signal boosters -- devices that amplify cellular signals for coverage extension. The 2014 signal booster reform established two categories:

- **Consumer boosters:** Fixed or mobile, sold to individuals. Must meet specific gain, power, and anti-oscillation requirements. Must be registered with carrier.
- **Industrial boosters:** Higher power, managed by carrier-authorized technicians. Used for in-building coverage systems in large venues.

---

## 3. Part 22: Public Mobile Services

Part 22 governs the original cellular telephone service as well as paging services and rural radio telephone service [4]. While much of the original 800 MHz cellular spectrum is now governed by Part 24 or Part 27 auction rules, Part 22 remains the regulatory home for:

- Legacy cellular (Cellular A and B bands, 824--849 / 869--894 MHz)
- Paging services (VHF and UHF paging bands)
- Rural radiotelephone service
- Offshore radio service

Part 22 is historically significant: it established the regulatory framework for the first commercial cellular networks in the 1980s. The original cellular license structure (two licenses per market -- the "A" wireline and "B" non-wireline carriers) defined the competitive landscape for a generation.

---

## 4. Part 24: Personal Communications Services

Part 24 governs the PCS (Personal Communications Services) bands centered around 1900 MHz, which were the first spectrum bands auctioned by the FCC (1994-1996) [5].

Key PCS allocations:
- **A Block:** 1850--1865 / 1930--1945 MHz (15+15 MHz)
- **B Block:** 1870--1885 / 1950--1965 MHz (15+15 MHz)
- **C Block:** 1895--1910 / 1975--1990 MHz (15+15 MHz)
- **D Block:** 1865--1870 / 1945--1950 MHz (5+5 MHz)
- **E Block:** 1885--1890 / 1965--1970 MHz (5+5 MHz)
- **F Block:** 1890--1895 / 1970--1975 MHz (5+5 MHz)

PCS spectrum remains a critical component of 4G LTE and 5G NR deployments. The 1900 MHz band provides a balance of coverage (building penetration) and capacity that makes it one of the most valuable spectrum holdings in the United States.

### PCS and the Spectrum Auction Model

The PCS auctions established the FCC's competitive bidding model for spectrum allocation, replacing the previous comparative hearing and lottery processes. Key design elements that became standard for all subsequent spectrum auctions [5]:

- **Geographic area licensing:** Spectrum licensed by Basic Trading Areas (BTAs) and Major Trading Areas (MTAs), not individual station sites
- **Buildout requirements:** Licensees must meet coverage benchmarks or forfeit spectrum
- **Band plan design:** Paired spectrum (separate uplink/downlink frequencies) for FDD systems
- **Installment payments:** Small business provisions allowing deferred payment
- **Anti-windfall provisions:** Restrictions on resale of spectrum won at auction prices

The PCS auction model raised over $20 billion in its initial rounds and has since been used for all FCC spectrum auctions, including the 700 MHz, AWS, and C-band auctions. Total FCC auction revenue through 2025 exceeds $230 billion.

---

## 5. Part 25: Satellite Communications

Part 25 governs earth station and space station licensing, the regulatory framework for every satellite communications system operating in or from the United States [6].

### Space Bureau (Established 2023)

The FCC's Space Bureau now administers Part 25, reflecting the rapid growth of commercial space communications. The Space Bureau took over satellite licensing from the International Bureau in 2023 to better manage the surge in non-geostationary orbit (NGSO) constellation applications [7].

### Key Part 25 Provisions

| Subpart | Scope | Key Provisions |
|---------|-------|----------------|
| A | General | Definitions, license terms, interference coordination |
| B | Applications and Licenses | Filing requirements, orbital slots, coordination |
| C | Technical Standards | EIRP limits, interference thresholds, band plans |
| D | Technical Operations | Station keeping, spectrum sharing, reporting |

### NGSO Constellations

The regulatory landscape for NGSO constellations (SpaceX Starlink, Amazon Kuiper, OneWeb) has been streamlined under the Carr FCC:

- Streamlined Part 25 licensing for NGSO earth stations
- Reduced barriers to entry for ground station deployment
- Spectrum sharing coordination between NGSO systems governed by ITU coordination procedures codified in Part 25
- Blanket-license earth station authorizations (single license covers multiple terminals deployed by end users)

For rural infrastructure builders, Part 25 is directly relevant: Starlink terminals operate under FCC blanket earth station authorizations, and any ground station deployment must comply with Part 25 coordination requirements, particularly in bands shared with terrestrial services.

### Direct-to-Device Satellite

An emerging regulatory frontier in Part 25 is direct-to-device (D2D) satellite service, where satellites communicate directly with unmodified smartphones. SpaceX/T-Mobile and AST SpaceMobile have received FCC authorizations for D2D testing and limited commercial deployment. The regulatory framework requires:

- Coordination between satellite operators and terrestrial carriers to manage interference
- Power flux density limits at the earth's surface to protect terrestrial services
- Spectrum sharing agreements between NGSO satellite operators and existing Part 27 licensees
- Emergency SOS messaging authorization (approved for several operators as of 2025)

D2D satellite is significant for rural coverage: it enables basic connectivity (text, SOS, potentially voice) in areas with zero terrestrial cell coverage, using existing consumer handsets.

---

## 6. Part 27: Miscellaneous Wireless Communications

Part 27 has become a catch-all for newly auctioned spectrum bands that do not fit neatly into Parts 22 or 24. It governs some of the most commercially valuable spectrum in the United States [8]:

| Band | Frequency | Part 27 Provisions | Use |
|------|-----------|-------------------|-----|
| 700 MHz | 698--806 MHz | Subpart F/G/H/I | LTE, 5G NR low-band |
| AWS-1 | 1710--1755 / 2110--2155 MHz | Subpart L | LTE mid-band |
| AWS-3 | 1755--1780 / 2155--2180 MHz | Subpart M | 5G; 2026 auction pending |
| BRS/EBS | 2496--2690 MHz | Subpart M | Fixed wireless, educational broadband |
| 3.45 GHz | 3450--3550 MHz | Subpart O | 5G mid-band; shared with DoD |
| 3.7 GHz (C-band) | 3700--3980 MHz | Subpart P | 5G mid-band |

The 700 MHz band is particularly significant for rural broadband: its propagation characteristics (long range, good building penetration) make it the primary low-band spectrum for LTE and 5G coverage in rural areas. T-Mobile's 600 MHz holdings (technically under Part 27 as well) serve a similar role.

---

## 7. Part 54: Universal Service

Part 54 governs the Universal Service Fund (USF), one of the most significant telecommunications subsidy programs in the United States. The USF redistributes approximately $8 billion annually from carrier contributions to four programs [9]:

### USF Programs

| Program | Annual Budget | Purpose | Administered By |
|---------|---------------|---------|-----------------|
| E-rate | ~$4.7 billion | Schools and libraries broadband | USAC |
| Lifeline | ~$1.5 billion | Low-income telephone and broadband | USAC |
| Connect America Fund (CAF) / ACAM | ~$4.5 billion | Rural carrier broadband buildout | USAC |
| Rural Health Care (RHC) | ~$600 million | Healthcare facility connectivity | USAC |

The USF is administered by the Universal Service Administrative Company (USAC) under FCC oversight. Carriers contribute to the USF based on interstate and international revenue; the contribution factor is recalculated quarterly.

### E-rate Program Detail

The E-rate program (formally the Schools and Libraries Universal Service Support Mechanism) is the largest USF program by expenditure. It provides discounts of 20-90% on telecommunications services and internet access for eligible schools and libraries, with the discount rate determined by the applicant's poverty level and urban/rural status [9].

E-rate funding is organized into two categories:

| Category | Coverage | Examples | Annual Cap |
|----------|----------|----------|------------|
| Category 1 | Broadband connectivity to buildings | Fiber, wireless ISP, cellular hotspots | ~$4.2 billion |
| Category 2 | Internal connections and managed WiFi | Switches, access points, cabling, maintenance | ~$1.0 billion |

The E-rate program has been the primary driver of school broadband connectivity in the United States, connecting over 150,000 schools and libraries. The FCC expanded E-rate in 2024 to include WiFi hotspot lending programs under an Emergency Connectivity Fund extension.

### Connect America Fund (CAF) / ACAM

The Connect America Fund and its Alternative Connect America Model (ACAM) provide support to rural telephone carriers for broadband deployment. ACAM carriers commit to specific broadband speed buildout targets in exchange for fixed annual support:

- **ACAM I:** 10/1 Mbps speed target; original deployment obligations
- **ACAM II:** 25/3 Mbps speed target; enhanced support for upgraded commitments
- **ACAM III (2024):** 100/20 Mbps speed target; highest tier of support; fiber or fiber-equivalent required
- **Enhanced ACAM:** Extended program through 2038; $16.7 billion authorized

### Fifth Circuit Challenge

The USF contribution mechanism faces a constitutional challenge. The Fifth Circuit Court of Appeals ruled in 2024 that the USF's funding structure may violate the nondelegation doctrine (the FCC delegates rate-setting to USAC, which is a private corporation). This case (Consumers' Research v. FCC) was appealed to the Supreme Court; a ruling is expected in the 2025-2026 term. If the USF is struck down, the impact on rural broadband, school connectivity, and healthcare telehealth would be substantial [10].

---

## 8. Parts 51 and 52: Interconnection and Numbering

### Part 51: Interconnection

Part 51 implements Section 251 of the Telecommunications Act of 1996, which requires incumbent local exchange carriers (ILECs) to interconnect with competing carriers and provide unbundled network elements (UNEs) [11].

Key provisions:
- **Section 251(c) obligations:** ILECs must negotiate interconnection agreements, provide unbundled loops, allow resale
- **TELRIC pricing:** Total Element Long-Run Incremental Cost methodology for UNE pricing
- **Number portability:** Local number portability between carriers

Part 51 was the engine of local telephone competition in the late 1990s and early 2000s. Its relevance has diminished as the market has shifted to wireless and broadband, but interconnection obligations remain important for competitive carriers.

### Part 52: Numbering

Part 52 governs the North American Numbering Plan (NANP) and number portability [12]:

- NANP administration (area code assignments, NPA relief planning)
- Local number portability (LNP) between wireline and wireless carriers
- Toll-free numbering
- IP-based numbering issues (STIR/SHAKEN caller ID authentication)

The STIR/SHAKEN caller ID authentication framework (Section 64.6300 et seq.) was mandated by the TRACED Act of 2019 to combat robocalling. All voice service providers in the US must implement STIR/SHAKEN on IP-based network segments.

---

## 9. Net Neutrality: The Sixth Circuit Resolution

On January 2, 2025, the U.S. Court of Appeals for the Sixth Circuit struck down the FCC's 2024 Safeguarding and Securing the Open Internet Order in its entirety. The court held that broadband internet access is an "information service" under the Communications Act, not a "telecommunications service," and that the FCC therefore lacks statutory authority to impose common carrier (Title II) regulation on broadband providers [13].

### Key Legal Findings

- **Classification:** Broadband internet access is an "information service" under Title I of the Communications Act, not a "telecommunications service" under Title II
- **FCC authority:** The FCC lacks statutory authority to reclassify broadband as a Title II service; the major questions doctrine applies
- **Impact:** No federal rules against throttling, blocking, or paid prioritization
- **Precedent:** Effectively reversed the FCC's 2015 Open Internet Order (upheld by the D.C. Circuit in 2016) and its 2024 reinstatement attempt

### Regulatory Consequences

| Area | Pre-Ruling Status | Post-Ruling Status |
|------|-------------------|-------------------|
| Broadband classification | Title II (telecom service) | Title I (information service) |
| No-blocking rule | Enforced | No federal rule |
| No-throttling rule | Enforced | No federal rule |
| No paid prioritization | Enforced | No federal rule |
| Transparency / broadband labels | Required | Under review; elimination proposed |
| State net neutrality laws | Preempted (debated) | Enforceable (CA SB 822, WA, OR) |

### State-Level Rules

With federal net neutrality eliminated, state laws now provide the primary regulatory framework:

- **California SB 822:** Comprehensive net neutrality law; no blocking, throttling, or paid prioritization; applies to ISPs serving California customers
- **Washington HB 2282:** Similar protections to SB 822
- **Oregon HB 4155:** Net neutrality protections for state-contracted ISPs
- Several additional states have executive orders or pending legislation

> **CAUTION: The net neutrality legal landscape is fragmented.** Federal law no longer provides net neutrality protections. State laws vary and may conflict. ISPs operating across state lines face a patchwork of requirements. Future federal net neutrality requires Congressional action, not FCC rulemaking.

---

## 10. Parts 32-36: Telephone Company Accounting

Parts 32 through 36 govern the accounting and cost-separation rules for telephone companies [14]. These are artifacts of the regulated monopoly era when local and long-distance carriers were rate-regulated:

- **Part 32:** Uniform System of Accounts (GAAP-based)
- **Part 33:** Affiliated transactions
- **Part 34:** Cable television cross-subsidy rules
- **Part 35:** Accounting for carriers with 250,000 or fewer subscriber lines
- **Part 36:** Jurisdictional separations procedures (allocating costs between interstate and intrastate)

These Parts have been progressively deregulated. The Carr FCC has proposed further streamlining of legacy accounting requirements as part of the transition from TDM/PSTN networks to all-IP infrastructure.

---

## 11. Parts 64 and 68: Consumer Protection and Equipment

### Part 64: Miscellaneous Rules

Part 64 contains a diverse collection of rules including [15]:

- **CPNI (Customer Proprietary Network Information):** Sections 64.2001--64.2011. Carriers must protect customer usage data; data breach notification requirements
- **PIRATE Act enforcement:** Enhanced penalties for pirate radio operations
- **Payphone compensation:** Per-call compensation for payphone-originated calls
- **STIR/SHAKEN:** Sections 64.6300 et seq. Caller ID authentication requirements
- **Robocall mitigation:** Sections 64.1200. TCPA implementation rules

### Part 68: Connection of Terminal Equipment

Part 68 governs the connection of customer premises equipment (CPE) to the public switched telephone network [16]. It establishes technical standards that equipment must meet to connect without harming the network. Part 68 was significantly deregulated in 2000 when the FCC shifted from FCC-administered to industry-administered standards (TIA-968 / ACTA).

---

## 12. Part 69: Access Charges

Part 69 establishes the access charge system by which long-distance carriers compensate local carriers for originating and terminating interstate calls [1]. While the relevance of per-minute access charges has declined dramatically in the VoIP/cellular era, Part 69 remains significant because:

- **Intercarrier compensation reform:** The FCC's 2011 ICC Reform Order (FCC 11-161) established a glide path to reduce terminating access charges toward zero, with bill-and-keep as the end state
- **Universal Service interaction:** Access charge revenues historically cross-subsidized rural service; as access charges decline, USF support (Part 54) must compensate
- **VoIP regulatory arbitrage:** VoIP providers' access charge obligations remain contested; the Title I classification of broadband (post-Sixth Circuit) further complicates this

### Broadband as Title I: Regulatory Implications

The Sixth Circuit's classification of broadband as a Title I "information service" has cascading effects throughout Subchapter B [4]:

| Regulatory Area | Title II (Before) | Title I (After) |
|-----------------|-------------------|-----------------|
| Interconnection obligations | Section 251 applies | Section 251 does not apply |
| CPNI protections | Part 64 applies | FTC jurisdiction (not FCC) |
| Universal Service contributions | Could be required | Cannot be required (debated) |
| Disability access | Section 255 applies | Uncertain applicability |
| Rate regulation | Possible under Title II | Not available under Title I |
| Pole attachment rates | Telecom rate applies | Cable rate applies |

The Title I classification is particularly relevant for broadband-dependent services: if broadband providers are not common carriers, they have no obligation to interconnect, no requirement to contribute to Universal Service, and limited FCC oversight of their business practices. State attorneys general and the FTC, rather than the FCC, become the primary consumer protection authorities.

---

## 13. Cross-References

> **Related:** [Structural Anatomy](01-structural-anatomy.md) -- the organizational framework within which Subchapter B sits. [Broadcast Services](04-broadcast-services.md) -- Subchapter C, the adjacent service-type chapter. [Regulatory Flux](06-regulatory-flux.md) -- the net neutrality ruling's ongoing implications and the Carr deregulatory agenda affecting multiple Subchapter B Parts.

**Series cross-references:**
- **CBC (CBC/Radio-Canada):** Canadian telecommunications regulatory comparison (CRTC common carrier equivalents)
- **IBC (Indigenous Broadcasting):** Tribal telecommunications provisions within USF
- **SVB (Student Voice Broadcasting):** E-rate program under Part 54
- **PSS (PNW Signal Stack):** Wireless spectrum used by commercial carriers
- **KPZ (KPLZ Seattle):** Broadcast regulation intersection with common carrier rules
- **C89 (C89.5 FM):** Noncommercial broadcasting under Subchapter C, adjacent to Subchapter B

---

## 14. Sources

1. Electronic Code of Federal Regulations. *Title 47, Chapter I, Subchapter B*. ecfr.gov/current/title-47/chapter-I/subchapter-B (accessed March 2026).
2. Federal Communications Commission. *Bureau and Office Descriptions*. fcc.gov/about/overview (accessed March 2026).
3. Federal Communications Commission. *Part 20: Commercial Mobile Services*. 47 CFR Part 20. ecfr.gov/current/title-47/chapter-I/subchapter-B/part-20.
4. Federal Communications Commission. *Part 22: Public Mobile Services*. 47 CFR Part 22.
5. Federal Communications Commission. *Part 24: Personal Communications Services*. 47 CFR Part 24.
6. Federal Communications Commission. *Part 25: Satellite Communications*. 47 CFR Part 25.
7. Federal Communications Commission. *FCC Establishes Space Bureau*. FCC News Release, April 2023.
8. Federal Communications Commission. *Part 27: Miscellaneous Wireless Communications Services*. 47 CFR Part 27.
9. Federal Communications Commission. *Universal Service*. fcc.gov/general/universal-service (accessed March 2026).
10. Fifth Circuit Court of Appeals. *Consumers' Research v. FCC*. Case No. 22-60008, 2024.
11. Federal Communications Commission. *Part 51: Interconnection*. 47 CFR Part 51.
12. Federal Communications Commission. *Part 52: Numbering*. 47 CFR Part 52.
13. Sixth Circuit Court of Appeals. *In re: Safeguarding and Securing the Open Internet Order*. Case No. 24-3450, January 2, 2025.
14. Federal Communications Commission. *Parts 32-36: Telephone Accounting*. 47 CFR Parts 32-36.
15. Federal Communications Commission. *Part 64: Miscellaneous Rules Relating to Common Carriers*. 47 CFR Part 64.
16. Federal Communications Commission. *Part 68: Connection of Terminal Equipment*. 47 CFR Part 68.
17. Inside Global Tech. *Sixth Circuit Strikes Down FCC Net Neutrality Rules*. January 6, 2025.
18. BroadbandSearch. *The Latest on Net Neutrality -- Where Are We in 2026*. February 2026.

---

*FCC Catalog -- Module 3: Common Carrier & Wireless Services. The commercial telecommunications layer: from cellular to satellite to broadband, all governed by Subchapter B and reshaped by the January 2025 net neutrality ruling.*
