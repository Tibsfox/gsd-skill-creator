# Structural Anatomy of Title 47

> **Domain:** Federal Telecommunications Regulation
> **Module:** 1 -- Title 47 Architecture, Organization, and Navigation
> **Through-line:** *Title 47 CFR is not a monolith. It is a layered protocol stack -- general administrative procedures at the foundation, service-specific protocols in the middle layers, and real-time amendments propagating from the Federal Register downward. Each Part is a module with a defined interface and a defined scope. Understanding the architecture is the prerequisite for navigating everything that follows.*

---

## Table of Contents

1. [Title 47 Overview](#1-title-47-overview)
2. [The Five-Chapter Structure](#2-the-five-chapter-structure)
3. [FCC Subchapter Architecture](#3-fcc-subchapter-architecture)
4. [The Five Printed Volumes](#4-the-five-printed-volumes)
5. [FCC Bureau and Office Structure](#5-fcc-bureau-and-office-structure)
6. [The Part Numbering System](#6-the-part-numbering-system)
7. [eCFR vs. GPO Published Edition](#7-ecfr-vs-gpo-published-edition)
8. [Federal Register Amendment Pipeline](#8-federal-register-amendment-pipeline)
9. [The Section Numbering Scheme](#9-the-section-numbering-scheme)
10. [Reserved and Removed Parts](#10-reserved-and-removed-parts)
11. [Title 47 as a Protocol Stack](#11-title-47-as-a-protocol-stack)
12. [Active Part Inventory](#12-active-part-inventory)
13. [Cross-References](#13-cross-references)
14. [Sources](#14-sources)

---

## 1. Title 47 Overview

Title 47 of the Code of Federal Regulations governs all telecommunications in the United States. It is the regulatory framework within which every radio transmitter, telephone network, cable system, satellite link, and broadband connection operates. The CFR as a whole comprises 50 titles; Title 47 is administered primarily by the Federal Communications Commission (FCC), with portions administered by the National Telecommunications and Information Administration (NTIA), the Office of Science and Technology Policy (OSTP), and the First Responder Network Authority (FirstNet) [1].

The CFR is codified law -- it represents the permanent rules published in the Federal Register by executive departments and agencies of the federal government. Title 47 was last amended March 19, 2026, per the eCFR [2]. The complete title spans five printed volumes and contains hundreds of active Parts organized into five chapters.

```
TITLE 47 -- TELECOMMUNICATION
Code of Federal Regulations
Last amended: March 19, 2026 (eCFR)
================================================================

  5 Chapters | 4 FCC Subchapters | ~60 Active Parts
  5 Printed Volumes | Continuously Updated via eCFR
  Primary Authority: FCC (Chapter I)
  Secondary: NTIA (Chapter III), OSTP (Chapter II), FirstNet (Chapter V)
```

The scope of Title 47 is broad: from the organizational rules of the FCC itself (Part 0) to the technical specifications for amateur radio spread spectrum transmissions (Part 97), from the Universal Service Fund that subsidizes rural broadband (Part 54) to the Emergency Alert System that interrupts broadcasts during disasters (Part 11). It is simultaneously an organizational chart, a technical specification, a licensing framework, and an enforcement code [3].

---

## 2. The Five-Chapter Structure

Title 47 is divided into five chapters, each administered by a different federal entity. Chapter I (the FCC) constitutes the vast majority of the regulatory content [1].

| Chapter | Authority | Parts | Scope |
|---------|-----------|-------|-------|
| I | Federal Communications Commission | 0--199 | All non-federal telecommunications regulation |
| II | Office of Science and Technology Policy / NSC | 200--217 | National security telecommunications policy |
| III | NTIA, Department of Commerce | 300--303 | Federal spectrum management, BEAD broadband |
| IV | NTIA + NHTSA | 400--401 | Emergency vehicle communications |
| V | First Responder Network Authority | 500+ | FirstNet public safety broadband network |

Chapter I contains four subchapters (A through D) that organize the FCC's regulatory scope by service type. Chapters II through V are significantly smaller and focused on specific federal missions. Chapter III has gained prominence since 2022 due to the NTIA's role in administering the $42.5 billion BEAD (Broadband Equity, Access, and Deployment) program [4].

### Non-FCC Title 47 Significance

The presence of NTIA, OSTP, and FirstNet in Title 47 is frequently overlooked in FCC-focused analyses. NTIA manages all federal government use of the radio spectrum -- military, scientific, and executive agencies coordinate with NTIA, not the FCC. The FCC manages non-federal spectrum. This dual-authority structure creates coordination requirements documented in Part 2 (Frequency Allocations), where the US Table of Frequency Allocations shows both federal and non-federal columns [5].

> **CAUTION: Federal vs. non-federal spectrum authority is a common source of confusion.** The FCC does not manage federal government spectrum. NTIA does. When the US Table of Frequency Allocations shows a band allocated to "Government" or "G," that band falls under NTIA authority, not FCC. Part 2 documents both columns, but only the non-federal column is within FCC regulatory scope.

---

## 3. FCC Subchapter Architecture

Chapter I (FCC) is organized into four subchapters that reflect the agency's service-oriented regulatory structure [1]:

### Subchapter A: General (Parts 0--19)

The foundation layer. Contains the FCC's organizational rules, procedural rules, frequency allocation tables, the Emergency Alert System, Part 15 (unlicensed RF devices), ISM equipment rules, and general provisions that apply across all service types.

Key Parts:
- **Part 0:** Commission organization
- **Part 1:** Practice and procedure (rulemaking, adjudicatory, enforcement)
- **Part 2:** Frequency allocations and radio treaty matters
- **Part 5:** Experimental radio service
- **Part 11:** Emergency Alert System (EAS)
- **Part 15:** Radio frequency devices (unlicensed)
- **Part 18:** Industrial, Scientific, Medical equipment

### Subchapter B: Common Carrier Services (Parts 20--69)

The commercial telecommunications layer. Governs entities that offer communications services to the public: cellular providers, satellite operators, telephone companies, broadband ISPs.

Key Parts:
- **Part 20:** Commercial mobile services
- **Part 24:** Personal Communications Services (PCS)
- **Part 25:** Satellite communications
- **Part 27:** Miscellaneous wireless (700 MHz, AWS, BRS/EBS)
- **Part 51:** Interconnection
- **Part 54:** Universal Service (E-rate, Lifeline, CAF, RHC)

### Subchapter C: Broadcast Radio Services (Parts 70--79)

The broadcast layer. AM, FM, television, cable, and auxiliary services.

Key Parts:
- **Part 73:** Radio broadcast services (AM, FM, TV)
- **Part 74:** Experimental, auxiliary, special broadcast
- **Part 76:** Multichannel video and cable television
- **Part 79:** Accessibility of video programming

### Subchapter D: Private Radio Services (Parts 80--199)

The non-common-carrier radio layer. Maritime, aviation, land mobile, personal radio, amateur radio, and fixed microwave.

Key Parts:
- **Part 80:** Maritime services
- **Part 87:** Aviation services
- **Part 90:** Private land mobile radio
- **Part 95:** Personal radio (GMRS, FRS, CB, MURS)
- **Part 97:** Amateur radio service
- **Part 101:** Fixed microwave services

---

## 4. The Five Printed Volumes

The GPO publishes Title 47 in five physical volumes, revised annually (typically October 1). This volume structure is important for physical reference and historical citation [6]:

| Volume | Parts | Coverage |
|--------|-------|----------|
| Vol. 1 | Parts 0--19 | Subchapter A: General (org, procedure, spectrum, EAS, Part 15) |
| Vol. 2 | Parts 20--39 | Subchapter B: Common Carrier (mobile, satellite, telephone accounting) |
| Vol. 3 | Parts 40--69 | Subchapter B (continued): Telco access, Universal Service, equipment |
| Vol. 4 | Parts 70--79 | Subchapter C: Broadcast Radio Services |
| Vol. 5 | Parts 80--199 | Subchapter D: Private Radio; plus Chapters II, III, IV, V |

Volume 1 is the most frequently consulted for technology builders because it contains Part 2 (the frequency allocation table) and Part 15 (the unlicensed device rules that govern every WiFi chip, Bluetooth module, and IoT sensor sold in the United States). Volume 5 is the largest because it spans both the diverse private radio services and the non-FCC chapters.

---

## 5. FCC Bureau and Office Structure

The FCC's internal organization maps directly to Part coverage areas. Understanding which bureau administers which Parts is essential for navigating rulemaking proceedings, enforcement actions, and policy guidance [7]:

| Bureau / Office | Primary Parts Administered | Domain |
|-----------------|---------------------------|--------|
| Wireline Competition Bureau | Parts 51, 52, 54, 61, 63, 64, 65, 68, 69 | Telephone, broadband, Universal Service |
| Wireless Telecommunications Bureau | Parts 20, 22, 24, 27, 90, 95, 101 | Mobile, PCS, land mobile, personal radio |
| Media Bureau | Parts 73, 74, 76, 78, 79 | AM/FM/TV broadcast, cable television |
| International Bureau | Parts 23, 25, 43 | Satellite, international carriers, ITU coordination |
| Public Safety and Homeland Security | Parts 4, 10, 11, 90 (public safety), 97 (emergency) | EAS, 911, public safety spectrum |
| Office of Engineering & Technology (OET) | Parts 2, 5, 15, 18 | Spectrum allocation, unlicensed devices, experimental |
| Consumer & Governmental Affairs | Parts 6, 7, 9, 14 | Disability access, consumer information |
| Space Bureau (est. 2023) | Part 25 (satellite) | NGSO licensing, space economy regulation |

The Space Bureau was established in 2023 as the FCC's newest organizational unit, reflecting the rapid growth of commercial space communications (Starlink, OneWeb, Kuiper). It took over satellite licensing from the International Bureau [8].

The Office of Engineering & Technology (OET) is particularly significant for hardware builders: OET administers Part 15 (the most impactful regulation for consumer electronics), manages the equipment authorization program (FCC ID / TCB process), and maintains the laboratory testing standards.

---

## 6. The Part Numbering System

Parts within each subchapter follow a hierarchical numbering scheme. Each Part is divided into subparts (lettered A, B, C, etc.), which contain individual sections (numbered decimally). The section number includes the Part number as a prefix [1]:

```
PART NUMBERING HIERARCHY
================================================================

  Part 15 (Radio Frequency Devices)
  |
  +-- Subpart A: General Provisions
  |   +-- Section 15.1: Scope of this part
  |   +-- Section 15.3: Definitions
  |   +-- Section 15.5: General conditions of operation
  |   +-- Section 15.15: General technical requirements
  |
  +-- Subpart B: Unintentional Radiators
  |   +-- Section 15.101: Equipment authorization of unintentional radiators
  |   +-- Section 15.107: Conducted limits
  |   +-- Section 15.109: Radiated emission limits
  |
  +-- Subpart C: Intentional Radiators
  |   +-- Section 15.201: Equipment authorization requirement
  |   +-- Section 15.209: Radiated emission limits; general
  |   +-- Section 15.247: FHSS and DSSS in ISM bands
  |   +-- Section 15.249: 902-928 MHz, 2400-2483.5 MHz, 5725-5875 MHz
  |
  +-- [Subparts D through K continue...]
```

The decimal numbering enables gaps for future insertions. Section 15.247 governs spread spectrum systems in ISM bands; 15.249 governs low-power devices in those same bands -- the gap between 15.247 and 15.249 is intentional, allowing future rules to be inserted without renumbering existing sections.

---

## 7. eCFR vs. GPO Published Edition

Two authoritative versions of Title 47 exist, and understanding their relationship is critical for compliance [2] [6]:

**eCFR (ecfr.gov):** The Electronic Code of Federal Regulations is continuously updated. When the FCC publishes a final rule in the Federal Register, the eCFR is amended within days. The eCFR represents the most current state of the regulations and is the preferred working reference.

**GPO Published Edition (govinfo.gov):** The Government Publishing Office revises the printed CFR annually, typically on October 1. Between annual revisions, the printed edition may lag the eCFR by months. For compliance purposes, the Federal Register is the authoritative publication of new rules; the eCFR integrates those changes into a consolidated view.

**Cornell LII (law.cornell.edu/cfr/text/47):** The Legal Information Institute maintains an annotated, cross-referenced mirror of the CFR with additional editorial notes and links to related statutes. It is a secondary source -- useful for research but not an official publication.

| Feature | eCFR | GPO Published | Cornell LII |
|---------|------|---------------|-------------|
| Update frequency | Continuous | Annual (Oct 1) | Varies |
| Authority | Official (26 USC 1505) | Official | Secondary |
| Currency | Days after Federal Register | Up to 12 months lag | Variable |
| Cross-references | Limited | None | Extensive |
| Best use | Current rule lookup | Historical citation | Research |

> **CAUTION: Never cite the GPO published edition for a rule that was amended after the last annual revision.** Use the eCFR or Federal Register citation instead. The eCFR displays the amendment date for each section.

---

## 8. Federal Register Amendment Pipeline

The Federal Register is the daily publication of the federal government, and it is the mechanism by which all CFR changes are promulgated. The FCC rulemaking process follows a well-defined pipeline [9]:

```
FCC RULEMAKING PIPELINE
================================================================

  NOTICE OF INQUIRY (NOI)
    |  "We're thinking about this topic. Tell us what you think."
    |  Not always required; used for broad exploratory proceedings.
    v
  NOTICE OF PROPOSED RULEMAKING (NPRM)
    |  "Here are specific proposed rules. Comment period opens."
    |  Published in Federal Register with FR citation and docket number.
    |  Typically 30-90 day comment period + 30-day reply comment.
    v
  COMMENTS / REPLY COMMENTS (ECFS)
    |  Filed in the Electronic Comment Filing System (ECFS).
    |  Public record; searchable at fcc.gov/ecfs.
    v
  REPORT AND ORDER (R&O)
    |  "Here are the final rules we're adopting."
    |  Published in Federal Register as final rule.
    |  Effective date specified (usually 30+ days after publication).
    v
  CFR AMENDMENT
    |  eCFR updated within days of Federal Register publication.
    |  GPO published edition updated at next annual revision.
    v
  PETITIONS FOR RECONSIDERATION (optional)
    |  30 days to petition the FCC to reconsider.
    v
  JUDICIAL REVIEW (optional)
       Filed in appropriate Circuit Court of Appeals.
       E.g., Sixth Circuit Case No. 24-3450 (net neutrality).
```

Each FCC proceeding is assigned a docket number (format: XX-NNN, e.g., "24-209") that tracks all filings in ECFS. The Federal Register citation format is: "FR volume number, page number" (e.g., "89 FR 45123").

---

## 9. The Section Numbering Scheme

Within each Part, sections follow a systematic numbering pattern that encodes organizational information [1]:

- **X.1 -- X.19:** General provisions, definitions, applicability
- **X.101 -- X.199:** First major substantive subpart (often technical standards)
- **X.201 -- X.299:** Second substantive subpart
- **Appendices:** Lettered (Appendix A, B, C, etc.), contain tables, forms, and supplementary data

The section number always begins with the Part number. Section 97.215 is in Part 97 (Amateur Radio), Subpart C (Special Operations), and addresses telecommand of space stations and model craft. Section 73.202 is in Part 73 (Broadcast Services) and contains the FM allotment table -- one of the most referenced tables in the entire title.

Some Parts have grown significantly over decades of amendment. Part 15 now has eleven subparts (A through K), reflecting the expansion of unlicensed device categories from simple garage door openers to WiFi 7 systems, ultra-wideband radar, and medical body area networks.

---

## 10. Reserved and Removed Parts

Not all Part numbers in Title 47 are active. Many are reserved for future use or have been removed during deregulatory proceedings [2]:

- **Reserved Parts:** Part numbers assigned to the numbering scheme but never populated with rules. Example: Parts 21, 28, 29, 30, 31 within Subchapter B.
- **Removed Parts:** Parts that previously contained active rules but have been eliminated. The 2025 "Delete, Delete, Delete" initiative removed portions of several Parts and eliminated over 1,000 individual rules.
- **Part 23 (International Fixed Public Radiocommunication Services):** Historically active, now largely superseded by Part 25 satellite rules and international coordination under the International Bureau.

Understanding which Parts are active, reserved, or removed is essential for compliance research. The eCFR marks reserved Parts explicitly. A builder researching "Part 30" expecting to find microwave rules will find a reserved placeholder -- the relevant microwave rules are in Part 101.

### Active Part Inventory (Chapter I)

The following table provides a snapshot of active Parts within each subchapter as of March 2026 [2]:

| Subchapter | Active Parts | Reserved/Removed Parts | Key Omissions |
|------------|-------------|----------------------|---------------|
| A (General) | 0,1,2,3,4,5,6,7,8,9,10,11,13,14,15,17,18,19 | 12,16 | Part 12 (Ship Inspections) removed |
| B (Common Carrier) | 20,22,24,25,27,32-36,42,43,51,52,54,61,63,64,65,68,69 | 21,23,26,28-31,37-41,44-50,53,55-60,62,66,67 | Many reserved for future use |
| C (Broadcast) | 73,74,76,78,79 | 70,71,72,75,77 | Compact subchapter; few active Parts |
| D (Private Radio) | 80,87,90,95,97,101 | 81-86,88,89,91-94,96,98-100,102-199 | Large numbering gaps; reserved |

The density of active Parts varies dramatically. Subchapter A has 18 active Parts in a 20-Part range. Subchapter D has only 6 active Parts in a 120-Part range, reflecting the conservative allocation of Part numbers for future expansion of private radio service categories.

---

## 11. Title 47 as a Protocol Stack

The layered structure of Title 47 mirrors the OSI network model in a regulatory context. Each layer depends on the layers below it and provides services to the layers above [1]:

```
TITLE 47 REGULATORY PROTOCOL STACK
================================================================

  Layer 5: APPLICATION
    Individual service rules, licensing, technical standards
    (Parts 15, 20, 22, 24, 25, 27, 73, 80, 87, 90, 95, 97, 101)

  Layer 4: TRANSPORT
    Service-type classification (common carrier, broadcast, private)
    (Subchapters B, C, D)

  Layer 3: NETWORK
    Spectrum allocation and frequency management
    (Part 2: Table of Frequency Allocations)

  Layer 2: DATA LINK
    General provisions, definitions, procedure, enforcement
    (Parts 0, 1, 3, 4)

  Layer 1: PHYSICAL
    Enabling legislation: Communications Act of 1934,
    Telecommunications Act of 1996, TRACED Act, RAY BAUM'S Act
```

This layered model explains why Part 2 (Frequency Allocations) is foundational to every other Part: no service-specific rule can authorize operation on a frequency that Part 2 has not allocated to that service. Part 2 is the network layer -- the routing table of the spectrum.

---

## 13. Cross-References

> **Related:** [Spectrum & Unlicensed Operations](02-spectrum-unlicensed.md) -- Part 2 frequency allocations and Part 15 device rules, the most practically impactful sections of the structural framework described here. [Regulatory Flux & Compliance](06-regulatory-flux.md) -- how the rulemaking pipeline described in Section 8 is currently operating at accelerated pace under the 2025-2026 deregulatory agenda.

**Series cross-references:**
- **RBH (Radio Broadcasting History):** Historical evolution of the FCC organizational structure
- **PSS (PNW Signal Stack):** Signal processing within the regulatory constraints mapped here
- **CBC (CBC/Radio-Canada):** Canadian broadcasting regulatory comparison (CRTC vs. FCC)
- **IBC (Indigenous Broadcasting):** Tribal spectrum provisions within FCC framework
- **SVB (Student Voice Broadcasting):** Educational broadcasting under Part 73 Subpart C

---

## 14. Sources

1. Electronic Code of Federal Regulations. *Title 47 -- Telecommunication, Chapter I*. ecfr.gov/current/title-47/chapter-I (accessed March 2026).
2. Electronic Code of Federal Regulations. *Title 47 -- Telecommunication*. ecfr.gov/current/title-47 (last amended March 19, 2026).
3. Federal Communications Commission. *Rules and Regulations for Title 47*. fcc.gov/wireless/bureau-divisions/technologies-systems-and-innovation-division/rules-regulations-title-47 (accessed March 2026).
4. National Telecommunications and Information Administration. *BEAD Program*. ntia.gov/programs-and-initiatives/broadband-usa/internet-for-all/bead-program (accessed March 2026).
5. Federal Communications Commission. *Part 2: Frequency Allocations and Radio Treaty Matters*. 47 CFR Part 2. ecfr.gov/current/title-47/chapter-I/subchapter-A/part-2.
6. U.S. Government Publishing Office. *CFR Title 47 Volumes 1-5*. govinfo.gov/app/collection/cfr/2026.
7. Federal Communications Commission. *Bureau and Office Descriptions*. fcc.gov/about/overview (accessed March 2026).
8. Federal Communications Commission. *FCC Establishes Space Bureau*. FCC News Release, April 2023.
9. Federal Communications Commission. *The FCC Rulemaking Process*. fcc.gov/about-fcc/rulemaking-process (accessed March 2026).
10. Cornell Legal Information Institute. *47 CFR Chapter I, Subchapters A-D*. law.cornell.edu/cfr/text/47 (accessed March 2026).
11. Wikipedia. *Title 47 of the Code of Federal Regulations*. (Cross-reference and historical context only.) November 2025.
12. American Planning Association. *FCC Updates Regulations on Wireless Telecommunication Infrastructure*. Planning.org, 2025.
13. Federal Communications Commission. *FCC Record, Volume 39*. Published weekly compilation of FCC decisions and actions, 2024-2025.
14. Administrative Procedure Act, 5 U.S.C. Sections 551-559. Federal rulemaking requirements applicable to FCC proceedings.
15. National Archives and Records Administration. *About the Code of Federal Regulations*. archives.gov/federal-register/cfr (accessed March 2026).

---

*FCC Catalog -- Module 1: Structural Anatomy. The architecture of American telecommunications regulation: five chapters, four subchapters, five volumes, one continuously amended code.*
