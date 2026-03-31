# vehicle.js — API Integrations

Data feeds driving the forest simulation. All free, no API key, verified working 2026-03-31.

## Active

| API | Endpoint | Data | Update | Status |
|-----|----------|------|--------|--------|
| NOAA KPAE | api.weather.gov/stations/KPAE/observations/latest | Temp, wind, humidity, pressure, dewpoint, visibility, precip, clouds | 5 min | Active |
| NOAA Kp | services.swpc.noaa.gov/products/noaa-planetary-k-index.json | Geomagnetic activity (aurora trigger) | 30 min | Active |
| Astronomy | Computed locally | Sun/moon altitude, azimuth, phase for 47.9°N 122.3°W | 30 sec | Active |
| Moon distance | Computed locally | Anomalistic period + Kepler approximation | 1 min | Active |

## Verified Ready (from IDEAS.md pool)

| API | Endpoint | Data | Priority |
|-----|----------|------|----------|
| NOAA Tides (Everett) | tidesandcurrents.noaa.gov station=9447659 | High/low tide times, water level | High |

Verified 2026-03-31: returns 4 tide events/day (2 high, 2 low) in metric. Today: H 3.37m @ 4:51AM, L 0.77m @ 10:59AM, H 3.01m @ 5:04PM, L 0.72m @ 10:57PM. Mixed semidiurnal pattern (unequal highs/lows) — classic Puget Sound.

Local beaches affected: Mukilteo Lighthouse Beach, Picnic Point, Meadowdale Beach, Possession Point. Low tide exposes tidal flats with invertebrates, shorebirds, and intertidal ecology.

## Planned
| USGS River | waterservices.usgs.gov (Snohomish 12150800) | Streamflow, gage height | Medium |
| NOAA G-Scale | services.swpc.noaa.gov/products/noaa-scales.json | Storm level G0-G5 | Low |
| USGS Earthquakes | earthquake.usgs.gov (PNW region) | Magnitude, location, depth | Low |

## CORS Notes

- NOAA weather API: CORS enabled, works from browser
- NOAA space weather: may need proxy via forest.php
- USGS APIs: generally CORS-friendly
- DSN XML (eyes.nasa.gov): CORS blocked, needs proxy
