# Regulatory Flux & Compliance Workflow

> **Domain:** FCC Regulatory Change Management and Device Compliance
> **Module:** 6 -- 2025-2026 Regulatory Landscape, Device Authorization, NTIA/FirstNet, GSD Compliance Index
> **Through-line:** *The FCC catalog is a living document in a period of remarkable flux. More than a thousand rules deleted in a single year. Net neutrality resolved by the courts after a decade of litigation. Spectrum auction authority reauthorized by Congress. The 6 GHz band opened for outdoor unlicensed operation. Understanding the catalog means understanding both the stable architecture and the current churning surface. This module maps the flux.*

---

## Table of Contents

1. [The 2025-2026 Regulatory Landscape](#1-the-2025-2026-regulatory-landscape)
2. [Carr's "Delete, Delete, Delete" Initiative](#2-carrs-delete-delete-delete-initiative)
3. [Spectrum Auction Pipeline](#3-spectrum-auction-pipeline)
4. [Net Neutrality Resolution and Aftermath](#4-net-neutrality-resolution-and-aftermath)
5. [Device Authorization Compliance Workflow](#5-device-authorization-compliance-workflow)
6. [NTIA: Federal Spectrum and BEAD](#6-ntia-federal-spectrum-and-bead)
7. [FirstNet: Public Safety Broadband](#7-firstnet-public-safety-broadband)
8. [Pending NPRMs and Active Proceedings](#8-pending-nprms-and-active-proceedings)
9. [The IP Transition](#9-the-ip-transition)
10. [Tribal Spectrum Provisions](#10-tribal-spectrum-provisions)
11. [Robocall and AI Voice Regulation](#11-robocall-and-ai-voice-regulation)
12. [Enforcement Mechanisms](#12-enforcement-mechanisms)
13. [GSD Infrastructure Compliance Index](#13-gsd-infrastructure-compliance-index)
14. [Cross-References](#14-cross-references)
15. [Sources](#15-sources)

---

## 1. The 2025-2026 Regulatory Landscape

The FCC under Chairman Brendan Carr (confirmed January 2025) has pursued the most aggressive deregulatory agenda since the Telecommunications Act of 1996. The combination of the Sixth Circuit's net neutrality ruling, Congressional spectrum auction reauthorization, and the "Delete, Delete, Delete" initiative has fundamentally reshaped the regulatory landscape [1].

```
2025-2026 REGULATORY TIMELINE
================================================================

  Jan 2, 2025    Sixth Circuit strikes down net neutrality (Case 24-3450)
  Jan 2025       Chairman Carr confirmed; "Delete, Delete, Delete" begins
  Mar 2025       First batch of obsolete rules deleted from CFR
  Jun 2025       NTIA BEAD modification: fiber mandate removed
  Jul 2025       Spectrum auction authority reauthorized (Big Beautiful Bill)
  Sep 2025       1,000+ rules deleted milestone reached
  Oct 2025       Pending app backlog cut by 50%
  Dec 2025       Carr "Year in Review": 12 major deregulatory actions
  Jan 2026       FCC 6 GHz GVP outdoor unlicensed order
  Jan 2026       Upper C-band and AWS-3 auction proceedings initiated
  Mar 2026       eCFR Title 47 last amended March 19, 2026
```

The deregulatory direction is clear, but the stable floor remains: the basic structure of Title 47 (subchapters, Part numbering, service classifications) is unchanged. What has changed is the volume of rules within that structure, the regulatory burden on carriers and manufacturers, and the balance between federal and state authority.

---

## 2. Carr's "Delete, Delete, Delete" Initiative

Under Chairman Carr's directive, the FCC launched a systematic review of all existing rules to identify and eliminate obsolete, unnecessary, or unduly burdensome regulations [1] [2].

### Key Actions (through Q1 2026)

| Action | Date | Impact |
|--------|------|--------|
| Obsolete rules deleted | Mar-Sep 2025 | 1,000+ individual rule sections removed from CFR |
| Application backlog reduction | 2025 | Pending applications cut by 50% |
| Tower siting streamlining | Jul 2025 | Environmental/historical review burdens reduced |
| TDM/PSTN transition rules | Oct 2025 | Legacy copper network disclosure requirements waived |
| Network change disclosure | Nov 2025 | Unnecessary notification requirements eliminated |
| Broadband label review | Dec 2025 | Proposed elimination of broadband nutrition labels |
| Digital discrimination standard | Pending | "Disparate impact" standard under 8th Circuit challenge |

### Categories of Deleted Rules

The deleted rules fell into several categories:

- **Technologically obsolete:** Rules governing technologies no longer in service (analog cellular, paging, telegraphic communications)
- **Procedurally redundant:** Reporting requirements duplicated by other agencies or superseded by electronic filing
- **Legacy accounting:** Rate-of-return and cost-separation rules from the monopoly era that no longer serve a regulatory purpose
- **Superseded mandates:** Rules that duplicated state or other federal requirements

The deletions do not affect the structural architecture of Title 47 -- Parts are not renumbered, subchapters are not reorganized. Rather, sections within existing Parts are removed, leaving the Part structure intact but with fewer active rules.

---

## 3. Spectrum Auction Pipeline

Spectrum auction authority was reauthorized by Congress as part of the "Big Beautiful Bill" in July 2025, ending a period of lapsed authority that had prevented the FCC from initiating new spectrum auctions since March 2023 [3].

### Planned Auctions (2026-2027)

| Auction | Band | Frequency | Description | Timeline |
|---------|------|-----------|-------------|----------|
| Upper C-band | 3.98--4.0 GHz | Up to 180 MHz | Mid-band 5G; exceeds 100 MHz Congressional minimum | By July 2027 |
| AWS-3 | 1755-1780 / 2155-2180 MHz | 50 MHz (paired) | Federal/commercial sharing; 5G mid-band | 2026 |
| 37 GHz sharing | 37--37.6 GHz | 600 MHz | mmWave FWA and IoT sharing rules adopted | Active |
| 6 GHz GVP | 5925--7125 MHz | 1200 MHz | Expanded unlicensed (not auctioned; AFC-coordinated) | Jan 2026 order |

### Significance for Rural Broadband

The Upper C-band auction is particularly significant: 180 MHz of contiguous mid-band spectrum is ideal for 5G fixed wireless access (FWA) in rural areas. Mid-band spectrum (3-6 GHz) provides a balance of capacity and coverage that makes it the primary target for rural 5G deployments. The Congressional directive to auction at least 100 MHz of C-band spectrum by July 2027 puts a hard deadline on this proceeding.

The AWS-3 auction reopens federal spectrum for commercial sharing. The 1755-1780 MHz band is currently used by Department of Defense systems; the auction proceeds will fund federal relocation costs and provide new mid-band capacity for 5G.

---

## 4. Net Neutrality Resolution and Aftermath

The Sixth Circuit's January 2, 2025 ruling in Case No. 24-3450 resolved the net neutrality debate as a legal matter, but the policy implications continue to unfold [4]:

### Current Regulatory Status

| Aspect | Status as of March 2026 |
|--------|------------------------|
| Federal net neutrality rules | None (struck down by Sixth Circuit) |
| Broadband classification | Title I (information service) |
| State net neutrality laws | Active (CA, WA, OR, others) |
| Broadband labels | Under review; elimination proposed |
| Transparency requirements | Part 8 under review |
| Universal Service impact | Broadband excluded from USF contribution base debate ongoing |
| Congressional action | Multiple bills introduced; no movement expected before 2027 |

### Implications for GSD Infrastructure

The absence of federal net neutrality rules means:

- ISPs serving mesh network backhaul connections have no federal prohibition on throttling or blocking specific traffic types
- State-level rules vary: a mesh network spanning Washington and Oregon operates under both states' net neutrality laws
- The FCC retains authority over transparency (broadband labels) but has proposed eliminating this requirement
- Any future federal net neutrality must come from Congress, not FCC rulemaking

---

## 5. Device Authorization Compliance Workflow

The FCC's device authorization program is the regulatory gateway for every device that radiates RF energy entering the US market [5]:

```
FCC DEVICE AUTHORIZATION DECISION TREE
================================================================

Does the device intentionally transmit radio energy?
|
+-- YES --> Does it use a licensed band under Parts 22/27/90/97?
|               +-- YES: Apply for license; device still needs Part-specific
|               |        authorization (may require certification)
|               +-- NO (unlicensed, Part 15): Proceed to auth path below
|
+-- NO  --> Does it generate unintentional emissions?
                +-- YES: SDoC path (Subpart B digital devices)
                +-- NO: Exempt (no authorization needed; still must not
                         cause interference per Section 15.5)

PART 15 AUTHORIZATION PATHS:
================================================================
CERTIFICATION (required for intentional radiators):
  1. Select FCC-accredited TCB (Telecom Certification Body)
  2. Submit device for testing against applicable Part 15 standards
  3. TCB issues grant of equipment authorization
  4. FCC assigns FCC ID (format: GRANTEE + EQUIPMENT code)
  5. FCC ID database entry created (apps.fcc.gov/oetcf/eas)
  6. Device may be marketed and sold

SUPPLIER'S DECLARATION OF CONFORMITY (SDoC):
  1. Manufacturer/importer conducts or commissions testing
  2. Test results compared against Subpart B emission limits
  3. Responsible party signs declaration of conformity
  4. Records retained for inspection
  5. Device labeled with responsible party information
  6. No FCC ID; no database entry

GRANTEE CODE APPLICATION:
  - New manufacturers apply for a grantee code via FCC Form 731
  - Code is a unique 3-5 character alphanumeric identifier
  - Required before first certification application
```

### TCB (Telecommunications Certification Body) System

The FCC does not itself test equipment for certification. Instead, it accredits private testing laboratories (TCBs) that perform the evaluation. TCBs are accredited through a tiered system:

- **TCBs accredited by the FCC directly:** For US-specific rules
- **TCBs accredited under Mutual Recognition Agreements (MRAs):** Allow testing in partner countries (EU, Japan, Canada, etc.) to be accepted by the FCC

This system enables global device manufacturers to certify products for the US market without physically shipping devices to FCC facilities.

---

## 6. NTIA: Federal Spectrum and BEAD

### Chapter III: NTIA Authority

The National Telecommunications and Information Administration (NTIA) manages federal government spectrum use under Title 47, Chapter III (Parts 300-303). NTIA's authority is parallel to but distinct from the FCC's: the FCC manages non-federal spectrum, NTIA manages federal [6].

### BEAD (Broadband Equity, Access, and Deployment) Program

The BEAD program, funded by the Infrastructure Investment and Jobs Act (2021), provides $42.5 billion for broadband infrastructure deployment. As of March 2026 [7]:

| Metric | Status |
|--------|--------|
| Total funding | $42.5 billion |
| States with approved proposals | 26 (as of March 2026) |
| Technology neutrality | Required (2025 modification eliminated fiber mandate) |
| Administration | NTIA, within Department of Commerce |

### 2025 BEAD Modification

NTIA's June 2025 BEAD modification significantly altered the program's requirements:

- **Fiber prioritization eliminated:** States may choose any technology (fiber, fixed wireless, satellite) without penalty
- **Labor/employment conditions removed:** Specific workforce requirements lifted
- **Climate-resilience mandates removed:** Environmental durability requirements streamlined
- **Local coordination conditions simplified:** Reduced paperwork for subgrantee applications
- **Speed benchmarks:** 100/20 Mbps minimum for funded projects (25/3 Mbps for "underserved" threshold)

The technology-neutral modification is significant for rural deployment: it enables fixed wireless, satellite (Starlink/Kuiper), and hybrid solutions where fiber is economically impractical. This directly affects Fox Infrastructure Group planning for rural broadband in PNW terrain.

---

## 7. FirstNet: Public Safety Broadband

Chapter V of Title 47 governs the First Responder Network Authority (FirstNet), established by the Middle Class Tax Relief and Job Creation Act of 2012 [8].

### FirstNet Key Facts

| Metric | Value |
|--------|-------|
| Spectrum | Band 14: 758-768 / 788-798 MHz (10+10 MHz paired, 700 MHz) |
| Network operator | AT&T (25-year contract, awarded 2017) |
| Coverage | 99%+ US population (as of 2025) |
| Subscribers | 5.8+ million (first responders and authorized users) |
| Priority services | Preemption, priority, QoS for public safety traffic |
| Technology | LTE Band 14; 5G Band 14 deployment underway |

FirstNet provides priority and preemption for first responder traffic: during network congestion, public safety users on Band 14 receive guaranteed bandwidth while commercial traffic is deprioritized. This is a fundamentally different service model from commercial LTE/5G -- it is publicly funded spectrum with mission-critical reliability requirements.

---

## 8. Pending NPRMs and Active Proceedings

The following FCC proceedings were active as of March 2026 and affect the regulatory landscape documented in this catalog [9]:

| Docket | Subject | Status | Expected Decision |
|--------|---------|--------|-------------------|
| 24-209 | Upper C-band spectrum auction parameters | NPRM | 2026 |
| 24-210 | AWS-3 sharing framework with federal users | NPRM | 2026 |
| 23-320 | Digital discrimination (disparate impact standard) | 8th Circuit review pending | 2026 |
| 22-309 | Space Bureau NGSO constellation coordination | Further NPRM | 2026 |
| 24-212 | Broadband label elimination | Proposed | 2026 |
| 23-362 | Part 90 narrowbanding for sub-150 MHz | NPRM | 2026-2027 |
| 24-215 | TDM/PSTN transition accelerated sunset | Further NPRM | 2026 |
| 25-001 | Robocall mitigation; AI-generated voice | NOI | 2026-2027 |

### Key Pending Decisions

- **Upper C-band auction rules** will determine the most significant new spectrum allocation for 5G in the 2026-2027 timeframe
- **Digital discrimination** standard (whether "disparate impact" or "disparate treatment" applies to broadband deployment) is pending before the 8th Circuit
- **Broadband label elimination** would remove the requirement for ISPs to display standardized nutrition-label-style service disclosures
- **AI-generated voice** in robocalls is emerging as a regulatory issue; NOI exploring FCC authority under Section 227

---

## 9. The IP Transition

The FCC is actively managing the transition from legacy TDM (Time Division Multiplexing) / PSTN (Public Switched Telephone Network) infrastructure to all-IP networks [10]:

- **Copper retirement rules streamlined:** Carriers may retire copper facilities with reduced notification requirements
- **Network change disclosure simplified:** Legacy requirements for notifying customers of technology changes reduced
- **Universal Service implications:** As copper networks retire, USF-funded carriers must maintain service availability through alternative technologies
- **911/E911 transition:** IP-based 911 (NG911) requires coordination between Parts 9, 20, and 64

The IP transition has direct implications for rural telecommunications: as AT&T, Verizon, and CenturyLink/Lumen retire copper facilities, rural communities that depended on copper-based DSL or POTS service must transition to alternatives -- typically cellular, fixed wireless, or satellite. The BEAD program is intended to fund this transition.

---

## 10. Tribal Spectrum Provisions

The FCC has established several mechanisms for tribal spectrum access, though implementation has been uneven [11]:

- **Tribal Priority Filing Window:** Periodic windows allowing tribal entities priority in applying for spectrum licenses in tribal areas
- **EBS (Educational Broadband Service) tribal licenses:** Part 27 Subpart M provides priority licensing for tribes in the 2.5 GHz band
- **Lifeline enhanced support:** Part 54 provides enhanced Lifeline support ($34.25/month vs. $9.25) for qualifying tribal residents
- **BEAD tribal set-aside:** NTIA allocated specific BEAD funding for tribal broadband deployment
- **Tribal consultation requirements:** Executive Order 13175 requires FCC consultation with tribal governments on rules affecting tribal lands

The 2.5 GHz tribal priority window (2020-2022) resulted in 154 tribal licenses granted, covering 2.5 GHz spectrum across tribal lands. These licenses enable tribes to deploy their own broadband networks using fixed wireless or LTE/5G technology.

---

## 11. Robocall and AI Voice Regulation

The FCC has been actively combating robocalls and is now addressing AI-generated voice in telecommunications [9]:

### TRACED Act Implementation

The Telephone Robocall Abuse Criminal Enforcement and Deterrence (TRACED) Act of 2019 mandated:

- **STIR/SHAKEN:** All voice service providers must implement caller ID authentication on IP-based network segments
- **Call authentication database:** Robocall Mitigation Database requires providers to file mitigation plans
- **Gateway provider accountability:** International gateway providers must implement robocall mitigation for foreign-originated calls
- **Enhanced enforcement:** FCC fines of up to $10,000 per intentional robocall violation; no prior warning required

### AI-Generated Voice

In February 2024, the FCC issued a declaratory ruling that AI-generated voice calls constitute "artificial or prerecorded voice" under the Telephone Consumer Protection Act (TCPA), Section 227. This means:

- AI-generated voice robocalls require prior express consent
- Unsolicited AI voice calls are subject to the same restrictions as prerecorded message calls
- State attorneys general may enforce TCPA provisions against AI voice callers
- The FCC's January 2026 NOI explores whether additional AI-specific rules are needed

---

## 12. Enforcement Mechanisms

The FCC enforces Title 47 through several mechanisms [5]:

### Enforcement Actions

| Action | Authority | Severity |
|--------|-----------|----------|
| Citation | Section 503(b)(5) | Warning; first step for non-broadcasters |
| Notice of Apparent Liability (NAL) | Section 503(b) | Proposed fine; up to $100,000/violation |
| Forfeiture Order | Section 503(b) | Final assessed fine after NAL response |
| Consent Decree | Section 503(b) | Negotiated settlement; often includes compliance plan |
| Revocation | Section 312(a) | License revocation for willful/repeated violations |
| Injunction | Section 401(b) | Court order requiring compliance |

### Equipment Marketing Violations

The FCC's Enforcement Bureau actively pursues manufacturers and importers who market devices that do not comply with Part 15 equipment authorization requirements. Common violations include:

- Marketing intentional radiators without FCC ID certification
- Selling signal jammers (prohibited under Section 333)
- Marketing non-compliant RF devices imported from overseas
- Exceeding authorized power limits through firmware modifications

The FCC has pursued several high-profile enforcement actions against online marketplaces and importers selling non-compliant WiFi boosters, signal jammers, and modified radio equipment.

---

## 13. GSD Infrastructure Compliance Index

The following cross-reference links GSD ecosystem build scenarios to specific FCC Parts, sections, and compliance requirements [12]:

| Build Scenario | Part | Key Section(s) | Compliance Threshold | Notes |
|---------------|------|----------------|---------------------|-------|
| WiFi mesh (indoor) | 15 | 15.407 (U-NII) | Device FCC ID; 1 W EIRP max | Standard power indoor AFC |
| WiFi mesh (outdoor, 6 GHz) | 15 | 15.407 | GVP device; AFC query required | 2026 order enables outdoor |
| AREDN amateur mesh | 97 | 97.215, 97.307 | Amateur license; no encryption; ID every 10 min | No commercial traffic |
| Rural backhaul (microwave) | 101 | 101.101 et seq. | Site-specific license; frequency coordination | 18/23 GHz typical |
| Satellite terminal (Starlink) | 25 | 25.115 (blanket) | Covered by operator's blanket license | User equipment pre-authorized |
| LoRa sensor network | 15 | 15.247, 15.249 | Device FCC ID; 1 W FHSS in 902-928 MHz | DSSS or FHSS modulation |
| Emergency HF station | 97 | 97.401-97.407 | Amateur license; emergency provisions | Winlink/SHARES coordination |
| Community GMRS network | 95 | 95.1701 et seq. | GMRS license ($35); 50 W max | Repeaters authorized |
| Property radio (MURS) | 95 | 95.2701 et seq. | None; 2 W max; 5 VHF channels | Good rural range |
| Community FM station | 73 | 73.811 et seq. | LPFM construction permit + license | 100 W max; non-commercial |
| IoT gateway (BLE/WiFi) | 15 | 15.247 (2.4 GHz) | Device FCC ID | Bluetooth + WiFi combo |
| CB base station | 95 | 95.401 et seq. | None; 4 W AM / 12 W SSB | 40 channels; 27 MHz |

> **CAUTION: This index is a navigation tool, not legal advice.** Each build scenario has additional compliance requirements beyond those listed here. Consult the full text of the applicable Part and, where necessary, seek qualified legal and engineering counsel before deploying infrastructure.

---

## 14. Cross-References

> **Related:** [Structural Anatomy](01-structural-anatomy.md) -- the rulemaking pipeline and eCFR update process described in Module 1 is the mechanism through which all changes documented here propagate into law. [Spectrum & Unlicensed Operations](02-spectrum-unlicensed.md) -- the 6 GHz expansion, device authorization paths, and Part 15 power limits. [Private Radio Services](05-private-radio.md) -- the GSD compliance map entries for AREDN, GMRS, and amateur radio. [Common Carrier](03-common-carrier.md) -- the net neutrality ruling and Subchapter B implications.

**Series cross-references:**
- **RBH (Radio Broadcasting History):** Historical regulatory cycles; deregulation/reregulation patterns
- **PSS (PNW Signal Stack):** Signal infrastructure affected by spectrum allocation changes
- **WPH (Weekly Phone):** Consumer device compliance and FCC ID requirements
- **CBC (CBC/Radio-Canada):** Canadian regulatory comparison (CRTC deregulatory trends)
- **IBC (Indigenous Broadcasting):** Tribal spectrum provisions and broadcasting rights
- **SVB (Student Voice Broadcasting):** E-rate program under USF (Part 54) and BEAD interactions
- **NND (New New Deal):** Broadband infrastructure policy and BEAD program context
- **WSB (Small Business):** Small business regulatory compliance burden implications

---

## 15. Sources

1. FCC Chairman Brendan Carr. *Chairman Carr Highlights Wins Delivered in 2025*. FCC.gov, December 23, 2025.
2. FCC Chairman Brendan Carr. *New Year, New Wins*. FCC.gov Blog, January 7, 2026.
3. Truth on the Market. *Rules Down, Rockets Up: The Year Telecom Policy Hit Reset*. Jeffrey Westling, December 9, 2025.
4. Sixth Circuit Court of Appeals. *In re: Safeguarding and Securing the Open Internet Order*. Case No. 24-3450, January 2, 2025.
5. Federal Communications Commission. *Equipment Authorization*. fcc.gov/oet/ea (accessed March 2026).
6. National Telecommunications and Information Administration. *Federal Spectrum Management*. ntia.gov/page/federal-spectrum-management (accessed March 2026).
7. National Telecommunications and Information Administration. *BEAD Program*. ntia.gov/programs-and-initiatives/broadband-usa/internet-for-all/bead-program (accessed March 2026).
8. First Responder Network Authority. *About FirstNet*. firstnet.gov/about (accessed March 2026).
9. Federal Communications Commission. *Electronic Comment Filing System (ECFS)*. fcc.gov/ecfs (accessed March 2026). Active docket listings.
10. Inside Global Tech. *FCC Proposes Rule Changes to Accelerate Transition to IP Networks*. December 4, 2025.
11. Federal Communications Commission. *Tribal Initiatives*. fcc.gov/consumers/guides/tribal (accessed March 2026).
12. Electronic Code of Federal Regulations. *Title 47 -- Telecommunication*. ecfr.gov/current/title-47 (last amended March 19, 2026).
13. Nelson Mullins. *FCC Download: Monthly Updates -- January 2026*. January 15, 2026.
14. BroadbandSearch. *The Latest on Net Neutrality -- Where Are We in 2026*. February 2026.
15. American Planning Association. *FCC Updates Regulations on Wireless Telecommunication Infrastructure*. Planning.org, 2025.
16. Inside Global Tech. *Sixth Circuit Strikes Down FCC Net Neutrality Rules*. January 6, 2025.
17. Wikipedia. *Title 47 of the Code of Federal Regulations*. (Cross-reference and historical context only.) November 2025.

---

*FCC Catalog -- Module 6: Regulatory Flux & Compliance Workflow. The floor plan is being renovated in real time. Know which walls are load-bearing before you start building.*
