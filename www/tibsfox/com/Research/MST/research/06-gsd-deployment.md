# GSD Deployment Layer

## Overview

This module specifies how the Global Telescope Mesh integrates with the GSD skill-creator ecosystem: DACP bundle structures for observation requests, skill-creator loop mapping for campaign management, HITL CAPCOM gates for quality assurance, and DoltHub federation for distributed data management.

## DACP Bundle Structure for GTM

### Observation Request Bundle

The DACP three-part bundle maps naturally to telescope observation requests:

```
GTM OBSERVATION BUNDLE
======================

Part 1: Human Intent
{
  "type": "observation_request",
  "campaign_id": "gtm-2026-yuri-global-shutter",
  "target": {
    "name": "TYC 1234-567-1",
    "ra": "12:34:56.78",
    "dec": "+12:34:56.7",
    "epoch": "J2000",
    "frame": "ICRS"
  },
  "science_case": "occultation_timing",
  "priority": "high",
  "time_constraint": {
    "earliest": "2026-04-11T23:55:00Z",
    "latest": "2026-04-12T00:05:00Z"
  }
}

Part 2: Workflow Specification
{
  "exposure": {
    "duration_sec": 30,
    "filter": "clear",
    "binning": "1x1",
    "gain": "auto"
  },
  "calibration": {
    "dark_required": true,
    "flat_required": false,
    "bias_required": false
  },
  "data_submission": {
    "format": "FITS",
    "upload_endpoint": "https://gtm.gsd-ecosystem.org/ingest",
    "submission_window_minutes": 30
  }
}

Part 3: Trigger Code
{
  "trigger": "time_based",
  "fire_at": "2026-04-12T00:00:00Z",
  "notification_channels": ["push", "websocket"],
  "auto_execute": true,
  "requires_confirmation": false
}
```

### Alert Follow-Up Bundle

When a transient alert arrives from a community broker, the DACP bundle for follow-up is dynamically generated:

```
ALERT FOLLOW-UP BUNDLE
======================

Part 1: Human Intent
{
  "type": "alert_followup",
  "alert_source": "ALeRCE",
  "alert_id": "ZTF26abcdef",
  "classification": "SN_Ia_candidate",
  "confidence": 0.87,
  "science_case": "supernova_confirmation",
  "priority": "urgent"
}

Part 2: Workflow (auto-generated from alert parameters)
Part 3: Trigger (immediate, with observer-accepts-assignment gate)
```

## Skill-Creator Integration

### Observe-Detect-Suggest Loop

The skill-creator's six-step loop maps to GTM campaign management:

| Skill-Creator Step | GTM Mapping |
|-------------------|-------------|
| **Observe** | Monitor alert streams; track telescope availability; watch weather feeds |
| **Detect** | Identify when a new alert matches available observer capabilities |
| **Suggest** | Generate observation assignment; propose target, timing, and exposure |
| **Manage** | Track observation status; handle reassignment if observer declines or weather intervenes |
| **Autoload** | Load campaign-specific skills (occultation timing, transit photometry, variable star) based on alert type |
| **Learn** | Record which observers produce highest-quality data for which science cases; optimize future assignments |

### Campaign Skill Templates

Each science method maps to a reusable skill template:

- **gtm-occultation**: Precision timing observation with GPS sync requirements
- **gtm-transit**: Extended photometric monitoring with comparison star selection
- **gtm-variable**: Standardized photometry in specified filter bands
- **gtm-comet**: Wide-field imaging with comet-rate tracking
- **gtm-satellite**: Rapid all-sky sweep for satellite brightness measurement
- **gtm-shutter**: Global Shutter protocol (once per year, maximum priority)

## HITL CAPCOM Gates

### Gate Positions

| Gate | Position | Decision | Authority |
|------|----------|----------|-----------|
| CAPCOM-1 | Post-Wave 0 | Foundation schemas validated; campaign targets approved | Mission Commander |
| CAPCOM-2 | Post-Wave 1 | Module outputs reviewed; cross-module consistency confirmed | Mission Commander |
| CAPCOM-3 | Pre-publication | Full verification matrix passed; safety tests cleared | Mission Commander + Verify Agent |
| CAPCOM-LIVE | During Global Shutter | Real-time go/no-go for event execution | Event Coordinator |

### CAPCOM-LIVE Protocol

During the annual Global Shutter event, a real-time CAPCOM gate operates:

1. **T-6h**: System health check -- all broker connections active, notification pipeline tested
2. **T-1h**: Weather assessment -- cloud cover maps overlaid on observer positions; affected observers notified of backup targets
3. **T-10m**: Final confirmation -- observer check-in count displayed; go/no-go decision
4. **T-0**: Shutter fires -- all connected telescopes execute their assigned observations
5. **T+5m**: First data receipt confirmation -- verify ingestion pipeline is processing
6. **T+30m**: Submission window closes -- report total observations received

## DoltHub Federation

### Data Model

GTM observation data federates via DoltHub -- a Git-for-data system that enables versioned, branching, merging database operations:

- **Global schema**: Shared table definitions for observations, campaigns, observers, telescopes
- **Regional instances**: Each GTM regional network maintains a local Dolt database
- **Push/pull**: Regional instances push observation data to the global repository; pull campaign assignments and alert subscriptions
- **Branching**: Campaign-specific branches allow isolated analysis before merging results into the main archive

### Schema Highlights

```
Tables:
  observations      -- FITS header metadata + quality gate results
  campaigns         -- Campaign definitions + target lists
  observers         -- Observer profiles (playa names, equipment, location)
  telescopes        -- Registered instruments (aperture, detector, protocol)
  alerts            -- Ingested alert packets from community brokers
  quality_reports   -- Per-observation quality assessment results
  mosaic_tiles      -- Global Shutter sky mosaic tile assignments
```

### Privacy Architecture

- **Observer identifiers**: Playa names only; no real-world PII in the database
- **Location precision**: Observer coordinates rounded to city-level (0.1 degree) in public datasets
- **Campaign-scoped precision**: Full GPS coordinates available to campaign coordinators only for the duration of the campaign
- **Data ownership**: Observers retain ownership of their observations; GTM receives a license to archive and redistribute for science

## GSD Ecosystem Alignment

### Fox Infrastructure Connections

| Fox Company | GTM Alignment |
|-------------|---------------|
| FoxFiber | Mesh networking between telescope nodes; GTM edge network connectivity |
| FoxCompute | Processing pipeline for sky mosaic assembly; alert broker hosting |
| Fox CapComm | CAPCOM gate coordination protocol; multi-agent event management |
| SolarFox | Remote telescope power systems; solar-powered observation stations |

### Amiga Principle Application

The GTM is the Amiga Principle at planetary scale:

- **Agnus (DMA)**: The alert broker layer -- routing data between professional detections and citizen follow-up without burdening the central coordinator
- **Denise (Display)**: The sky mosaic -- assembling thousands of individual observations into a single visual artifact
- **Paula (Audio/IO)**: The notification pipeline -- real-time push to observers, WebSocket progress tracking, live-stream aggregation
- **M68000 (CPU)**: The campaign coordinator -- making judgment calls about target priority, observer assignment, and quality assessment

> **Related:** See [01-network-architecture](01-network-architecture.md) for the protocol layer and [04-yuris-night](04-yuris-night.md) for the annual event that exercises the full deployment stack.

## Summary

The GSD deployment layer maps the skill-creator's observe-detect-suggest-manage-autoload-learn loop directly to GTM campaign management. DACP bundles encapsulate observation requests with human intent, workflow specifications, and trigger conditions. HITL CAPCOM gates ensure quality at wave boundaries, with a real-time CAPCOM-LIVE protocol for the annual Global Shutter event. DoltHub federation enables sovereign regional networks while maintaining global coordination.
