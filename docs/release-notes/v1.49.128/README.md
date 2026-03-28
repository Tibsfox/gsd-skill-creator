# v1.49.128 "Mesh Telescope"

**Released:** 2026-03-28
**Code:** MST
**Series:** PNW Research Series (#128 of 167)

## Summary

The Global Telescope Mesh Network proposes connecting the world's distributed amateur and professional telescopes into a coordinated observation network, anchored to Yuri's Night as the annual convergence event. With 15,000+ Unistellar nodes, 25 Las Cumbres robotic telescopes, 7 million Rubin Observatory LSST alerts per night, and 9 community alert brokers already operational, the physical network exists -- it has simply never been switched on as a unified system. This is the Amiga Principle at planetary scale: extraordinary output through connecting existing capability via elegant architecture.

## Key Features

| Metric | Value |
|--------|-------|
| Research Modules | 6 |
| Total Lines | ~4,302 |
| Safety-Critical Tests | 5 |
| Parallel Tracks | 3 |
| Est. Tokens | ~200K |
| Color Theme | Cosmic purple / nebula blue / star gold |

### Research Modules

1. **M1: Network Architecture** -- Protocol comparison of ASCOM, INDI, and Las Cumbres OCS; bridge layer design; NASA meshNetwork assessment; FITS data format standardization
2. **M2: Telescope Fleet Mapping** -- Complete census of connected networks: Unistellar (15,000+), Las Cumbres (25 robotic), ZTF, AAVSO, Globe at Night; geographic coverage with gap analysis
3. **M3: Alert & Event Systems** -- Rubin Observatory LSST pipeline (7M alerts/night, 2-min latency), all 9 community alert brokers documented (ALeRCE, ANTARES, Fink, Lasair, Pitt-Google, AMPEL, Babamul, SCiMMA, TOM Toolkit)
4. **M4: Yuri's Night Integration** -- Global Shutter protocol (00:00 UTC April 12 simultaneous exposure), participation tiers from casual observer to campaign-assigned tracking, PNW anchor nodes at Museum of Flight and Burke Museum
5. **M5: Citizen Science Protocols** -- Occultation timing, exoplanet transit photometry, nova monitoring, comet tracking; Unistellar output: 136 asteroids, 20 exoplanet orbits refined, DART debris in Nature
6. **M6: GSD Deployment Layer** -- DACP bundle structure for observation requests, skill-creator integration, HITL CAPCOM gates, DoltHub federation for distributed data

### Cross-References

- **YNT** (Yuri's Night) -- Annual convergence event, Global Shutter protocol
- **BRC** (Black Rock City) -- Community event infrastructure, federation via DoltHub
- **PNP** (Ports & Pipes) -- Telescope protocol bridges, ASCOM/INDI integration
- **TCP** (TCP/IP Protocol) -- Alert broker networking, Apache Kafka topics
- **AVI** (Avian Survey) -- Citizen science data quality, occultation timing for wildlife corridors

## Retrospective

### What Worked
- The three-track parallel execution (network+fleet, alerts+events, citizen science) maps cleanly to the natural domain boundaries of the telescope ecosystem
- Documenting all 9 Rubin/LSST community alert brokers in one place creates a genuinely useful reference that does not exist elsewhere in consolidated form
- The Global Shutter concept (simultaneous exposure at 00:00 UTC April 12) is a compelling design for a real distributed observation event

### What Could Be Better
- Radio telescope arrays (ALMA, VLA, SKA) are mentioned but not integrated into the mesh architecture -- they operate on fundamentally different protocols and timescales
- The GSD deployment layer (M6) is necessarily speculative since no actual telescope nodes have been connected yet

## Lessons Learned

- Backyard astronomy is the oldest distributed sensor network humanity ever built -- the infrastructure exists physically across six continents, speaking incompatible protocols, waiting to be connected.
- The Unistellar network alone has contributed to peer-reviewed science published in Nature (DART mission debris tracking), demonstrating that consumer-grade equipment can produce research-grade data when properly coordinated.
- Alert broker architecture (Kafka topics, VOEvent XML, 2-minute latency from detection to distribution) is structurally identical to the event-driven microservice patterns used in modern software -- the telescope mesh is a distributed systems problem wearing an astronomy hat.

---
*Part of the v1.49.101-131 research batch -- 31 new projects in a single session.*
