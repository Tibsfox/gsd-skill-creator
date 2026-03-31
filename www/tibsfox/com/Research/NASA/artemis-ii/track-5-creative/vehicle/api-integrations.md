# vehicle.js — API Integrations

Data feeds driving the forest simulation. All free, no API key, verified working 2026-03-31.

## Active

| API | Endpoint | Data | Update | Status |
|-----|----------|------|--------|--------|
| NOAA KPAE | api.weather.gov/stations/KPAE/observations/latest | Temp, wind, humidity, pressure, dewpoint, visibility, precip, clouds | 5 min | Active |
| NOAA Kp | services.swpc.noaa.gov/products/noaa-planetary-k-index.json | Geomagnetic activity (aurora trigger) | 30 min | Active |
| Astronomy | Computed locally | Sun/moon altitude, azimuth, phase for 47.9°N 122.3°W | 30 sec | Active |
| Moon distance | Computed locally | Anomalistic period + Kepler approximation | 1 min | Active |

## Planned (from IDEAS.md pool)

| API | Endpoint | Data | Priority |
|-----|----------|------|----------|
| NOAA Tides | tidesandcurrents.noaa.gov (Mukilteo) | High/low tide times, water level | High |
| USGS River | waterservices.usgs.gov (Snohomish 12150800) | Streamflow, gage height | Medium |
| NOAA G-Scale | services.swpc.noaa.gov/products/noaa-scales.json | Storm level G0-G5 | Low |
| USGS Earthquakes | earthquake.usgs.gov (PNW region) | Magnitude, location, depth | Low |

## CORS Notes

- NOAA weather API: CORS enabled, works from browser
- NOAA space weather: may need proxy via forest.php
- USGS APIs: generally CORS-friendly
- DSN XML (eyes.nasa.gov): CORS blocked, needs proxy
