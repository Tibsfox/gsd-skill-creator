# Telescope Fleet Mapping

## Overview

This module provides a complete census of connected and connectable telescope networks, their geographic distribution, protocol capabilities, and data quality characteristics. The fleet map is the foundation for GTM campaign planning and gap analysis.

## Professional Networks

### Vera C. Rubin Observatory / LSST

- **Location**: Cerro Pachon, Chile (altitude 2,663m)
- **Aperture**: 8.4m primary mirror (6.7m effective)
- **Camera**: 3.2 gigapixel LSST Camera -- largest digital camera ever built
- **Survey cadence**: Full southern sky every 3 nights
- **Alert rate**: Up to 7 million transient alerts per night (as of February 2026)
- **Alert latency**: <60 seconds from image capture to alert distribution
- **Data products**: FITS images, difference images, source catalogs, alert packets (Avro format)
- **Access**: Alert stream via community brokers (ALeRCE, ANTARES, Fink, Lasair, Pitt-Google, AMPEL, Babamul, SCiMMA)

### Las Cumbres Observatory (LCO)

- **Sites**: 7 sites on 5 continents (Haleakala, McDonald, CTIO, SAAO, Siding Spring, Tenerife, Ali)
- **Telescopes**: 25 robotic telescopes (2x 2.0m, 13x 1.0m, 10x 0.4m)
- **Control system**: Open-source Observatory Control System (OCS)
- **Scheduling**: Adaptive priority-weighted scheduler with weather awareness
- **Access**: Public observation request API; education allocation available
- **Unique capability**: 24/7 longitudinal coverage -- at least one site is always dark

### Zwicky Transient Facility (ZTF)

- **Location**: Palomar Observatory, California
- **Aperture**: 1.2m Samuel Oschin Telescope
- **Camera**: 47 square degree field of view (largest survey camera in northern hemisphere)
- **Survey**: Northern sky every 2 nights in g and r bands
- **Alert rate**: ~300,000 alerts per night
- **Access**: Public alert stream via Kafka; archived data via IRSA

## Citizen Science Networks

### Unistellar Network

The largest connected citizen telescope network, with documented science output:

- **Fleet size**: 15,000+ Wi-Fi-enabled telescopes across 6 continents
- **Models**: eVscope (114mm), eVscope 2 (114mm, enhanced sensor), eQuinox (114mm, no eyepiece)
- **Connectivity**: Wi-Fi to smartphone app; cloud sync for observation data
- **Documented science output**:
  - 136 asteroids detected via occultation timing
  - 20 exoplanet orbits refined via transit photometry
  - DART mission debris tracking published in *Nature* (2023) -- citizen astronomers on Reunion Island and Kenya captured post-impact debris evolution
  - 26-hour continuous exoplanet transit coverage with 26 observers spanning multiple time zones
  - Comet K1 three-fragment disintegration captured by distributed observers (November 2024)

### AAVSO (American Association of Variable Star Observers)

- **Founded**: 1911 -- over a century of continuous operation
- **Database**: 40+ million observations in the International Variable Star Index
- **Active observers**: ~2,000 reporting annually from 40+ countries
- **Specialization**: Variable star photometry, nova/supernova monitoring, exoplanet transits
- **Data quality**: Standardized photometric systems; peer review of submissions
- **GTM integration**: High priority -- AAVSO observers represent the most experienced citizen science cohort

### Globe at Night

- **Focus**: Light pollution monitoring via naked-eye star visibility
- **Participation**: 50,000+ reports per annual campaign (10 campaigns per year)
- **Method**: Compare visible star patterns against reference charts; report limiting magnitude
- **Data product**: Global light pollution map with year-over-year trend analysis
- **GTM relevance**: Site quality assessment for campaign planning; identifies dark-sky locations suitable for precision observations

## Fleet Summary Table

| Network | Nodes | Aperture Range | Protocol | Data Format | Geographic Spread |
|---------|-------|---------------|----------|-------------|-------------------|
| Rubin/LSST | 1 | 8.4m | VOEvent/Kafka | Avro/FITS | Southern hemisphere |
| LCO | 25 | 0.4-2.0m | OCS REST | FITS | 5 continents |
| ZTF | 1 | 1.2m | Kafka | Avro/FITS | Northern hemisphere |
| Unistellar | 15,000+ | 114mm | Cloud API | JPEG/FITS | 6 continents |
| AAVSO | ~2,000 active | Various | Web/VPhot | FITS/CSV | 40+ countries |
| Globe at Night | 50,000+/yr | Naked eye | Web form | CSV | Global |
| iTelescope.Net | 20+ | 0.1-0.7m | Web portal | FITS | 4 sites |
| Slooh | 10+ | 0.1-0.5m | Web/API | JPEG/FITS | 3 sites |

## Geographic Gap Analysis

### Coverage Strengths

- **Southern hemisphere professional**: Rubin (Chile), LCO-CTIO (Chile), LCO-SAAO (South Africa), LCO-Siding Spring (Australia) provide excellent professional coverage
- **Northern hemisphere survey**: ZTF (California) + LCO sites (Haleakala, McDonald, Tenerife) cover most of the northern sky
- **Urban areas**: Unistellar's enhanced vision technology works in light-polluted environments, making the citizen network effectively unlimited in siting

### Coverage Gaps

- **Equatorial Africa**: Only citizen observers between SAAO (latitude -33) and Tenerife (latitude +28). Kenya, Nigeria, Tanzania, and Ethiopia are critical GTM recruitment zones
- **Central/South Asia**: No professional network nodes between Tenerife and Siding Spring at these latitudes. India, Pakistan, and Iran have active amateur communities but no GTM integration yet
- **Pacific Ocean**: Vast longitudinal gap between Hawaii and Australia. French Polynesia, Fiji, and New Zealand amateur communities could close this gap
- **Arctic/Antarctic**: No coverage above latitude 65N or below 55S. Not prioritized for GTM v1.0 due to limited observation windows

## Equipment Tier Classification

### Tier 1: Research-Grade

Institutions with calibrated CCD/CMOS detectors, precision tracking, automated calibration pipelines, and archival-quality FITS output. Examples: LCO, iTelescope.Net.

### Tier 2: Advanced Amateur

Connected telescopes with electronic detectors capable of producing calibrated FITS data. GPS timestamping available. Examples: Unistellar eVscope/eQuinox, AAVSO equipped observers.

### Tier 3: Basic Amateur

Telescopes with visual or smartphone-camera capability. Can contribute to visual campaigns (meteor counts, bright transient reports) but not precision photometry. Examples: Dobsonian visual observers, smartphone-attached telescopes.

### Tier 4: Passive Reporter

Naked-eye observers contributing to light pollution surveys or bright event confirmation. Examples: Globe at Night participants, Yuri's Night casual observers.

> **Related:** See [05-citizen-science](05-citizen-science.md) for the science methods accessible at each tier and [01-network-architecture](01-network-architecture.md) for protocol requirements per tier.

## Summary

The global telescope fleet comprises approximately 15,000+ connected citizen instruments, 50+ professional/semi-professional robotic telescopes, and millions of potential casual observers. Geographic coverage is strongest in the Americas, Europe, and Australasia, with critical gaps in equatorial Africa, Central/South Asia, and the Pacific. The Unistellar network represents the single largest recruitment opportunity for GTM due to its existing Wi-Fi connectivity and documented science output.
