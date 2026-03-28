# Alert and Event Systems

## Overview

The alert pipeline connects professional detections to citizen follow-up observations. This module documents the end-to-end pathway from Rubin Observatory's LSST alert stream through community brokers to backyard telescope assignment.

## Rubin Observatory LSST Alert Pipeline

The Vera C. Rubin Observatory's Legacy Survey of Space and Time (LSST) began issuing real-time transient alerts in February 2026. The alert system is the highest-volume astronomical event stream ever built:

- **Alert volume**: Up to 7 million alerts per night during full survey operations
- **Alert latency**: <60 seconds from shutter close to alert distribution
- **Alert content**: Each alert packet contains the difference image cutout, the template image, the new image, source measurements, and a 12-month light curve history
- **Format**: Apache Avro serialization, distributed via Apache Kafka
- **Schema**: LSST Alert Schema v4.1 -- 85 fields per alert including position, photometry, shape parameters, and cross-match results

### Alert Generation Pipeline

```
LSST ALERT PIPELINE
====================

  Camera readout (3.2 Gpixel)
       |
       v
  Image differencing (template subtraction)
       |
       v
  Source detection (5-sigma threshold)
       |
       v
  Source characterization (photometry, shape, motion)
       |
       v
  Alert packet assembly (Avro serialization)
       |
       v
  Kafka distribution (7M alerts/night)
       |
       v
  Community broker ingestion
```

## Community Alert Brokers

Rubin distributes alerts to authorized community brokers, each specializing in different science cases. The GTM broker layer interfaces with all nine:

| Broker | Institution | Specialization |
|--------|-------------|----------------|
| ALeRCE | University of Chile | Machine-learning classification; light curve analysis; Chilean community |
| ANTARES | NOIRLab (Tucson) | Cross-match with multi-wavelength archives; anomaly detection |
| Fink | CNRS/IJCLab (France) | ML classification pipeline; early supernova detection |
| Lasair | Edinburgh/Oxford/Belfast | UK community; variable stars; gravitational wave crossmatch |
| Pitt-Google | University of Pittsburgh | Google Cloud infrastructure; BigQuery integration |
| AMPEL | DESY/Humboldt (Berlin) | Modular real-time analysis framework; neutrino crossmatch |
| Babamul | Caltech | ZTF heritage; internal Rubin team usage |
| SCiMMA | National Science Foundation | Multi-messenger astronomy; gravitational wave + neutrino correlation |
| TOM Toolkit | LCO | Target and Observation Manager; enables follow-up scheduling |

### Broker Selection Strategy for GTM

Not all brokers serve the GTM use case equally. Priority ranking for GTM integration:

1. **TOM Toolkit** (highest): Directly enables follow-up observation scheduling on LCO telescopes; natural GTM campaign orchestrator
2. **ALeRCE**: Real-time classification enables automatic routing of transients to appropriate observer tiers
3. **Fink**: Early supernova detection triggers time-critical follow-up campaigns
4. **ANTARES**: Cross-match results enrich GTM campaign assignments with multi-wavelength context
5. **Lasair**: Variable star specialization aligns with AAVSO observer capabilities

## Alert Routing to Backyard Telescopes

### The Alert-to-Backyard Pathway

The critical innovation of GTM is closing the loop between professional detection and citizen follow-up. The pathway:

1. **Detection**: Rubin/LSST detects a transient event (supernova candidate, asteroid, variable star outburst)
2. **Classification**: Community broker classifies the event (e.g., ALeRCE: "SN Ia candidate, confidence 0.87")
3. **GTM Routing**: GTM broker evaluates which registered telescopes can observe the target:
   - Is the target above the horizon at the observer's location?
   - Does the observer's equipment meet the minimum aperture/detector requirements?
   - Is the observer currently online and available for assignment?
4. **Assignment**: GTM sends an observation request to qualified observers via push notification
5. **Observation**: Observer accepts assignment and captures data per campaign specifications
6. **Ingestion**: GTM ingests the FITS data, validates quality gates, and archives

### Latency Budget

The scientific value of follow-up observations depends critically on response time:

| Stage | Target Latency | Current Status |
|-------|---------------|----------------|
| Rubin detection to alert | <60 seconds | Operational (2026) |
| Broker classification | <5 minutes | Operational |
| GTM routing + assignment | <2 minutes | Specification |
| Observer notification delivery | <30 seconds | Specification |
| Observer response + slew | 5-15 minutes | Variable |
| **Total: detection to observation** | **<25 minutes** | **Target** |

For slow-evolving transients (supernovae, variable star outbursts), this latency budget is generous. For fast transients (gamma-ray burst afterglows, fast radio burst optical counterparts), only Tier 1 and Tier 2 automated telescopes can respond quickly enough.

## VOEvent Protocol

VOEvent (Virtual Observatory Event) is the IVOA standard for astronomical transient notification, defined in VOEvent 2.0 (2011). Key elements:

- **XML schema**: Structured event description with Who (author), What (parameters), WhereWhen (sky coordinates + time), How (instrument), Why (classification)
- **Transport**: VOEvent Transport Protocol (VTP) over TCP, or HTTP POST
- **Registry**: Events registered with IVOA-compliant brokers for archival access
- **GTM usage**: VOEvent remains the interoperability format between GTM and legacy systems; new GTM-native events use JSON but include VOEvent export

## Multi-Messenger Astronomy Integration

GTM's alert system can integrate with non-optical event streams:

- **Gravitational waves**: LIGO/Virgo/KAGRA alerts via GCN (General Coordinates Network) trigger wide-field optical follow-up campaigns
- **Neutrino events**: IceCube realtime alerts trigger coincident optical monitoring of candidate source positions
- **Radio transients**: CHIME/FRB fast radio burst detections can trigger optical monitoring of host galaxy fields

These multi-messenger events represent the highest-priority GTM campaigns: when a gravitational wave event is detected, every available telescope in the localization region should be imaging simultaneously.

> **SAFETY: Multi-messenger event positions are published with uncertainty regions that may span hundreds of square degrees. GTM must not publish refined positions from citizen observations without coordination with the detecting experiment. Premature public release of refined coordinates could compromise ongoing professional campaigns.**

## Summary

The alert pipeline connects Rubin's 7 million nightly alerts through 9 community brokers to GTM's routing layer, which assigns follow-up observations to citizen telescopes based on location, equipment, and availability. The target latency from professional detection to citizen observation is under 25 minutes. VOEvent provides legacy interoperability while GTM-native JSON events enable real-time WebSocket push to mobile observers.
