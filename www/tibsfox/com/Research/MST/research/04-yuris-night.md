# Yuri's Night Integration

## Overview

Yuri's Night is the annual convergence event for the Global Telescope Mesh -- the one night each year when the distributed network operates as a unified planetary observatory. This module documents the event ecosystem, the Global Shutter protocol, and the PNW anchor node integration.

## Yuri's Night Event Ecosystem

### History and Scale

Yuri's Night was founded in 2001 by Loretta Hidalgo Whitesides, George Whitesides, and others to celebrate the anniversary of Yuri Gagarin's first human spaceflight on April 12, 1961 (and the first Space Shuttle launch on April 12, 1981). Growth milestones:

- **2001**: First event, 64 parties in 34 countries
- **2011**: 50th anniversary of Gagarin's flight -- 567 events in 75 countries
- **Annual steady state**: 100-350 events in 50-80 countries per year
- **Format**: Parties, lectures, stargazing events, art installations, hackathons

### Institutional Anchors

- **yurisnight.net**: Official organization, event registration, marketing coordination
- **Museum of Flight (Seattle)**: Major annual host; PNW anchor venue
- **NASA**: Multiple centers host events (Ames, JPL, Kennedy, Goddard)
- **SETI Institute**: Co-hosts events focused on astrobiology and the search for life
- **European Space Agency**: Events at ESTEC (Netherlands), ESOC (Germany)
- **Planetary Society**: Co-hosts focused on planetary exploration advocacy
- **Local astronomy clubs**: Hundreds of clubs worldwide host stargazing events

## The Global Shutter Protocol

### Concept

The Global Shutter is the signature GTM event: at 00:00 UTC on April 12, every connected telescope on Earth captures a simultaneous exposure. The combined data forms a planetary-scale snapshot of the sky -- the night sky looked at all at once.

### Technical Specification

| Parameter | Value | Notes |
|-----------|-------|-------|
| Trigger time | 00:00:00 UTC, April 12 | GPS-synchronized |
| Exposure duration | 30 seconds (standard) | Configurable per tier |
| Target | Campaign-assigned or zenith | Assigned targets for campaign observers; zenith for casual |
| Filter | No filter (clear) or V-band | V-band for photometric observers |
| Data submission window | 30 minutes post-exposure | Auto-upload for connected scopes |
| Calibration requirement | Dark frame within 1 hour | Flat/bias recommended but not required |

### Participation Tiers

**Tier 1: Campaign Observer**

Assigned a specific target, precise timing, filter requirement. Expected to produce calibrated FITS data with GPS timestamp. Receives campaign assignment 48 hours before event. Typically AAVSO-level observers or Unistellar users with science mode enabled.

**Tier 2: Data Contributor**

Captures the Global Shutter exposure and submits raw or minimally processed data. Target is zenith or self-selected. FITS format preferred but JPEG/TIFF accepted. Data contributes to the sky mosaic but not to precision science campaigns.

**Tier 3: Casual Observer**

Participates visually. Reports what they see at 00:00 UTC via the GTM app -- visible stars, sky conditions, light pollution level (Globe at Night compatible). No equipment requirement beyond eyes and an internet connection.

### Sky Mosaic Assembly

The Global Shutter data assembles into a planetary sky mosaic -- a composite image showing what the entire sky looked like at one moment in time. Processing pipeline:

1. **Ingest**: All submitted images geo-tagged with observer coordinates and timestamp
2. **Calibrate**: Apply dark/flat/bias corrections where available
3. **Plate-solve**: Determine precise sky coordinates from star patterns in each image
4. **Mosaic**: Project all images onto a single all-sky coordinate grid
5. **Composite**: Blend overlapping regions; mark gaps where no observer was present
6. **Publish**: Interactive web viewer showing the mosaic with observer attribution

The mosaic serves as both a science data product (all-sky transient search at one epoch) and a public engagement artifact (visual proof that thousands of people looked at the same sky together).

## PNW Anchor Nodes

### Museum of Flight (Seattle, WA)

- **Role**: Primary PNW venue; hosts annual Yuri's Night party + stargazing event
- **Equipment**: Rooftop observation deck; portable telescopes for public viewing
- **GTM integration**: Museum telescope registered as GTM node; public observers guided through Global Shutter participation via the GTM app
- **Capacity**: 500-1,000 attendees per event

### Burke Museum (Seattle, WA)

- **Role**: Secondary PNW venue; focus on natural history connection to astronomy
- **Integration**: Light pollution monitoring station (Globe at Night compatible); astrobiology outreach
- **Capacity**: 200-400 attendees per event

### Seattle Astronomical Society

- **Role**: Technical anchor; experienced observers with personal equipment
- **Integration**: Multiple members registered as Tier 1 campaign observers
- **Equipment**: Member telescopes ranging from 4" refractors to 16" Dobsonians; several Unistellar eVscopes

### Pacific Science Center

- **Role**: Family-friendly venue; IMAX theater for Yuri's Night documentary screening
- **Integration**: Planetarium show synchronized with Global Shutter countdown

## Event Coordination Architecture

### Timeline (April 12, Annual)

| Time (UTC) | Time (PDT) | Activity |
|------------|------------|----------|
| T-48h | Apr 10, 4pm | Campaign assignments published; targets distributed to Tier 1 observers |
| T-24h | Apr 11, 4pm | Weather forecast assessment; backup targets issued for cloud-affected regions |
| T-6h | Apr 12, 10am | GTM system check; all nodes confirm connectivity |
| T-1h | Apr 12, 3pm | Live-stream countdown begins; observer check-in via GTM app |
| T-0 | Apr 12, 4pm | **GLOBAL SHUTTER** -- simultaneous exposure |
| T+30m | Apr 12, 4:30pm | Data submission window closes; auto-upload for connected scopes |
| T+6h | Apr 12, 10pm | Preliminary sky mosaic generated; published to yurisnight-gtm.org |
| T+48h | Apr 14 | Full mosaic processed; science campaign results compiled |

### Live-Stream Aggregation

A global live-stream during the Global Shutter event shows telescope feeds from around the world, synchronized with a countdown clock. Technical requirements:

- **Video feed protocol**: WebRTC or RTMP to central aggregation server
- **Delay tolerance**: Up to 5 seconds acceptable for entertainment feed
- **Overlay**: Real-time world map showing which observers have checked in, with dots illuminating as each region's shutter fires
- **Commentary**: Narrated by rotating hosts from different time zones

## Integration with PNW Research Series

The Yuri's Night GTM event connects directly to the PNW Research Series:

- **BRC (Virtual Burning Man)**: Annual burn event model applies -- each year's Global Shutter is a "burn" with the sky as the playa
- **AVI (Wings of the PNW)**: Nocturnal bird migration monitoring during Global Shutter adds a biological observation layer
- **ECO (PNW Ecology)**: Light pollution measurements during the event feed into ecological impact assessment
- **BPS (BPS Sensors)**: Mesh networking lessons from BPS apply directly to GTM node coordination

> **Related:** See [05-citizen-science](05-citizen-science.md) for the science methods used during the Global Shutter and [06-gsd-deployment](06-gsd-deployment.md) for the GSD orchestration of the annual event.

## Summary

Yuri's Night is the natural convergence event for the Global Telescope Mesh -- an existing worldwide celebration of space exploration with institutional infrastructure already in place. The Global Shutter protocol adds a scientific dimension: one moment, every telescope, one sky. PNW anchor nodes at the Museum of Flight, Burke Museum, and Seattle Astronomical Society provide the local implementation model that scales globally through the GTM federation.
