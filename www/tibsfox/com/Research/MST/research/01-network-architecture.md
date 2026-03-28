# Network Architecture

## Overview

The Global Telescope Mesh Network (GTM) connects heterogeneous telescope systems into a federated observation platform. This module documents the protocol landscape, bridge layer design, and mesh topology that make planetary-scale coordination possible.

## Telescope Control Protocols

### ASCOM (Astronomy Common Object Model)

ASCOM is the dominant telescope control standard on Windows platforms, originating in 1998 from the ASCOM Initiative. It provides a COM-based interface with standardized driver APIs for telescopes, focusers, filter wheels, cameras, and dome controllers. As of ASCOM Platform 6.6 (2023), the architecture supports:

- **Alpaca**: A cross-platform REST API layer that exposes ASCOM devices over HTTP/JSON, enabling control from any language or operating system
- **Device conformance**: Standardized interface contracts (ITelescopeV3, ICameraV3) with mandatory property/method signatures
- **Discovery protocol**: UDP broadcast on port 32227 for automatic device enumeration on local networks

ASCOM Alpaca is the critical bridge technology -- it transforms a Windows-only COM ecosystem into a network-accessible REST API that any GTM node can consume.

### INDI (Instrument Neutral Distributed Interface)

INDI is the open-source alternative, dominant on Linux and macOS, maintained by the INDI Library project. Key characteristics:

- **XML-based protocol**: Device properties communicated as XML elements over TCP sockets (default port 7624)
- **Client-server architecture**: An INDI server manages device drivers; clients connect over TCP to read/write properties
- **INDI Web Manager**: REST API layer for remote driver management, enabling headless operation on Raspberry Pi or similar embedded platforms
- **Driver ecosystem**: 300+ drivers covering major telescope, camera, focuser, and filter wheel manufacturers

### Las Cumbres Observatory Control System (OCS)

The LCO OCS represents the most mature example of a fully API-driven global telescope network. It coordinates 25 robotic telescopes across 7 sites on 5 continents. The system handles:

- **Observation request API**: RESTful submission of observation parameters (target coordinates, exposure time, filter, constraints)
- **Adaptive scheduler**: Priority-weighted scheduling across all sites, accounting for weather, twilight, and mechanical constraints
- **Automated calibration**: Dark frames, flat fields, and bias frames generated per-night without human intervention
- **Science archive**: FITS files archived with full provenance metadata, accessible via TAP/ADQL queries

## Bridge Layer Design

### The GTM Broker Layer

The bridge layer sits between professional alert systems and citizen telescope networks. It translates between protocols, manages authentication, and routes observation requests.

```
BRIDGE LAYER ARCHITECTURE
==========================

  ASCOM Alpaca (REST)  ──┐
                         ├──▶ GTM Bridge API ──▶ Kafka Topic
  INDI (TCP/XML)      ──┤    (normalize)        (distribute)
                         │
  LCO OCS (REST)      ──┘

  Translation responsibilities:
  - Coordinate format normalization (J2000 epoch, ICRS frame)
  - Exposure parameter mapping (gain/ISO to ADU)
  - FITS header standardization (mandatory keywords)
  - Authentication and rate limiting per node
```

### Protocol Translation Matrix

| Source Protocol | Transport | Data Format | GTM Normalization |
|----------------|-----------|-------------|-------------------|
| ASCOM Alpaca | HTTP/REST | JSON | Direct JSON mapping |
| INDI | TCP socket | XML | XML-to-JSON transform |
| LCO OCS | HTTP/REST | JSON | Field name remapping |
| VOEvent | TCP/HTTP | XML (IVOA) | VOEvent-to-GTM alert schema |
| ZTF Alerts | Kafka | Avro | Avro deserialization + field mapping |

### Authentication and Federation

GTM uses a tiered authentication model:

1. **Public tier**: Read-only access to alert streams and sky mosaic data
2. **Observer tier**: Submit observations, receive campaign assignments (requires telescope registration)
3. **Campaign tier**: Create observation campaigns, access raw FITS data (requires data quality verification)
4. **Network tier**: Operate broker nodes, manage telescope fleet segments (institutional partners)

Federation between GTM instances follows the DoltHub pattern: each regional instance maintains a local database that can push/pull changesets to a shared schema. This enables sovereign regional networks (e.g., PNW GTM, Southern Hemisphere GTM) while maintaining global coordination for events like the Yuri's Night Global Shutter.

## Mesh Topology

### Node Classification

| Tier | Example | Count (est.) | Protocol | Data Quality |
|------|---------|-------------|----------|--------------|
| Professional | Rubin/LSST, LCO | ~50 | OCS/VOEvent | Research-grade |
| Advanced Amateur | Unistellar eQuinox | 15,000+ | ASCOM/INDI | Calibrated CCD |
| Citizen Observer | Smartphone + adapter | Millions | GTM App | Visual/basic |
| Passive Monitor | Globe at Night | 50,000+/year | Web form | Naked-eye estimate |

### Geographic Coverage Analysis

Professional telescope networks cluster at a small number of premier dark-sky sites: Cerro Pachon (Chile), Mauna Kea (Hawaii), La Palma (Canary Islands), Siding Spring (Australia). The citizen science network fills critical gaps:

- **Equatorial Africa**: Near-zero professional coverage; citizen networks in Kenya, Nigeria, and South Africa provide unique longitudinal access
- **Central Asia**: No professional sites between La Palma and Siding Spring at these latitudes; citizen observers in Turkey, Iran, and India bridge the gap
- **Interior South America**: Professional coverage concentrated on the Chilean coast; citizen networks in Brazil, Argentina, and Colombia extend inland

> **Related:** See [02-telescope-fleet](02-telescope-fleet.md) for the complete node census and [04-yuris-night](04-yuris-night.md) for geographic coverage during the Global Shutter event.

## NASA meshNetwork Assessment

NASA's Delay/Disruption Tolerant Networking (DTN) protocols, developed for deep-space communication where round-trip latencies exceed minutes, offer architectural lessons for GTM:

- **Store-and-forward**: Nodes that lose connectivity cache observations locally and sync when reconnected -- essential for remote citizen observers with intermittent internet
- **Bundle Protocol (BP)**: Encapsulates observation data with routing metadata, enabling multi-hop relay through heterogeneous network segments
- **Custody transfer**: Critical data (transient alerts, occultation timing) can request acknowledgment at each hop, ensuring delivery even through unreliable links

The DTN architecture is not proposed as the GTM transport layer -- standard TCP/IP suffices for internet-connected nodes. But the design patterns (store-and-forward, custody transfer, delay tolerance) are directly applicable to the edge network where citizen telescopes operate on mobile data connections.

## FITS Data Standard

The Flexible Image Transport System (FITS) is the universal data format for astronomical observations, defined by the FITS Standard Document (version 4.0, 2018). GTM mandates the following FITS header keywords for all ingested observations:

| Keyword | Description | Requirement |
|---------|-------------|-------------|
| DATE-OBS | UTC timestamp of exposure start | Mandatory |
| EXPTIME | Exposure duration in seconds | Mandatory |
| RA, DEC | Target coordinates (J2000, ICRS) | Mandatory |
| TELESCOP | GTM-registered telescope identifier | Mandatory |
| INSTRUME | Camera/detector identifier | Mandatory |
| FILTER | Filter designation (standard system) | Mandatory if filtered |
| OBSERVER | GTM observer identifier (playa name) | Mandatory |
| GPS-LAT, GPS-LON | Observer geographic coordinates | Recommended |
| GPS-ALT | Observer altitude (meters) | Recommended |
| IMAGETYP | Frame type: LIGHT, DARK, FLAT, BIAS | Mandatory |

> **SAFETY: GPS coordinates are observer-sensitive data. GTM aggregates to city-level resolution for public datasets. Precise coordinates are available only to campaign coordinators and only for the duration of the campaign.**

## Summary

The GTM network architecture connects three protocol ecosystems (ASCOM, INDI, LCO OCS) through a bridge layer that normalizes coordinate formats, standardizes FITS headers, and manages tiered authentication. The mesh topology leverages the geographic complementarity between professional and citizen networks -- professional sites provide depth at premier locations, while the citizen network provides breadth across continents where no professional coverage exists.
