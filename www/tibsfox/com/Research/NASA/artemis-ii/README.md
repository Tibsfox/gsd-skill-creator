# Artemis II — Live Mission Pack

**Mission:** Artemis II (EM-2) — First crewed flight beyond LEO since Apollo 17
**Catalog:** Mission 1.190 | Epoch 6: Artemis
**Spacecraft:** Orion CM-003 "Integrity" on SLS Block 1
**Launch:** April 1, 2026, 22:24 UTC (3:24 PM PDT)
**Duration:** ~10 days | Free-return lunar flyby
**Crew:** Wiseman, Glover, Koch, Hansen

---

## Observer Location

| Parameter | Value |
|-----------|-------|
| Location | Mukilteo, WA |
| Coordinates | 47.9063°N, 122.2816°W |
| Timezone | Pacific Time (PDT UTC-7 / PST UTC-8) |
| Weather station | KPAE (Paine Field, Snohomish County) |
| Tide station | NOAA (nearest Mukilteo) |

## Reference Clocks

- **UTC** — mission standard
- **EDT** (UTC-4) — Kennedy Space Center, launch site
- **PDT** (UTC-7) — Mukilteo, observer location

## What Makes This Different

This is a **live mission pack**. Unlike historical missions (v1.0-v1.17) where research is retrospective, Artemis II research happens in real time as the spacecraft flies. The mission pack grows daily through periodic sweeps that sample weather, scan papers, update telemetry, and sync the live tracker.

The creative track (Track 5) includes the **vehicle.js forest simulation** and the **live mission tracker** — both deployed to tibsfox.com and improving iteratively as research feeds new data, species behaviors, and visualization techniques.

## Release Cadence

```
v1.0.0  — Pre-launch baseline
v1.0.x  — Daily sweeps during mission (light, accumulative)
v1.1.0  — Post-splashdown retrospective + full mission pack assembly
```

## Track Structure

| Track | Content | Status |
|-------|---------|--------|
| Track 1 | Mission Research + Daily Logs + Wall-Clock Papers | Active |
| Track 2 | Organism Pairing | Candidates in IDEAS.md |
| Track 3 | TSPB Mathematics | Post-mission |
| Track 4 | College of Knowledge Curriculum | Post-mission |
| Track 5 | Creative Arts + vehicle.js + Tracker + Style | Active |
| Track 6 | QA + Predicted vs Actual + Retrospective | Post-mission |
| Dedication | Sophie Germain (April 1, 1776) | Selected |

## Data Sources

| Source | Endpoint | Update |
|--------|----------|--------|
| NOAA Weather | api.weather.gov/stations/KPAE | 5 min |
| JPL Horizons | ssd.jpl.nasa.gov/api/horizons.api (ID: -1024) | Post-launch |
| NOAA Tides | tidesandcurrents.noaa.gov | Daily |
| NOAA Space Weather | services.swpc.noaa.gov (Kp index) | 3 hours |
| DSN | eyes.nasa.gov/dsn/data/dsn.xml | 1 min |
| USGS River | waterservices.usgs.gov (Snohomish 12150800) | 15 min |

## Live Deployments

- Tracker: https://tibsfox.com/Research/NASA/artemis-ii/
- Research hub: https://tibsfox.com/Research/ (Live Missions section)
- Forest simulation: https://tibsfox.com/Research/forest/
