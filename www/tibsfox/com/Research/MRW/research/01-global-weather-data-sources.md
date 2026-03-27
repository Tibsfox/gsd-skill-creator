# Global Weather Data Sources

> **Domain:** Meteorological APIs and Open Data
> **Module:** 1 -- Real-Time Weather Data Acquisition for Game Integration
> **Through-line:** *The atmosphere updates itself every fifteen minutes. Seven national weather services model it independently. The data is free, authoritative, and sub-kilometer in resolution. The only thing missing is someone willing to read it and translate it into something a game engine can understand.*

---

## Table of Contents

1. [The Data Landscape](#1-the-data-landscape)
2. [Open-Meteo: The Universal Free API](#2-open-meteo-the-universal-free-api)
3. [NOAA HRRR: Convection-Resolving Precision](#3-noaa-hrrr-convection-resolving-precision)
4. [NASA GEOS-5 CFAPI: Global Atmospheric Composition](#4-nasa-geos-5-cfapi-global-atmospheric-composition)
5. [NOAA GFS: Global Baseline Fallback](#5-noaa-gfs-global-baseline-fallback)
6. [Data Source Comparison Matrix](#6-data-source-comparison-matrix)
7. [API Response Schemas and Normalization](#7-api-response-schemas-and-normalization)
8. [WMO Weather Code Standard](#8-wmo-weather-code-standard)
9. [Rate Limits, Licensing, and Fair Use](#9-rate-limits-licensing-and-fair-use)
10. [The Fetch Pipeline: From HTTP to WeatherState](#10-the-fetch-pipeline-from-http-to-weatherstate)
11. [Error Handling and Fallback Chains](#11-error-handling-and-fallback-chains)
12. [PNW-Specific Data Considerations](#12-pnw-specific-data-considerations)
13. [Cross-References](#13-cross-references)
14. [Sources](#14-sources)

---

## 1. The Data Landscape

The modern meteorological data ecosystem is one of the most successful examples of open government data in existence. NOAA alone publishes over 100 TB of weather data annually through its Open Data Dissemination program, and every byte of it is in the public domain [1]. The European Centre for Medium-Range Weather Forecasts (ECMWF), the German Weather Service (DWD), Meteo-France, and four other national services contribute independent models. Open-Meteo aggregates all of them into a single API endpoint that requires no authentication [2].

For Minecraft weather integration, the relevant question is not whether the data exists -- it is how to select the right source for the right geographic resolution and update cadence. A server in the Pacific Northwest needs sub-3km resolution to distinguish between marine fog on the coast and snow in the Cascades, conditions that can differ by 2000+ meters of elevation within 100 km of horizontal distance [3].

```
METEOROLOGICAL DATA ECOSYSTEM -- GAME INTEGRATION VIEW
================================================================

  GLOBAL MODELS (coarse, long-range)
  +---------------------------------+
  | ECMWF IFS    | 9 km    | 10-day |
  | NOAA GFS     | 13 km   | 16-day |
  | NASA GEOS-5  | ~30 km  | NRT    |
  +---------------------------------+
           |
           v
  REGIONAL MODELS (fine, short-range)
  +---------------------------------+
  | NOAA HRRR    | 3 km    | 18h   |
  | DWD ICON-D2  | 2 km    | 2-day |
  | MF AROME     | 1.3 km  | 2-day |
  | EC GEM HRDPS | 2.5 km  | 2-day |
  +---------------------------------+
           |
           v
  AGGREGATOR (unified access)
  +---------------------------------+
  | Open-Meteo   | 1-2 km  | 7-day |
  | Free, no key, CC BY 4.0 data   |
  +---------------------------------+
           |
           v
  GAME TRANSLATION LAYER
  +---------------------------------+
  | WeatherState JSON schema        |
  | Per-zone, per-biome mapping     |
  | 15-minute update cadence        |
  +---------------------------------+
```

The hierarchy is deliberate. Global models provide fallback when regional models are unavailable. Regional models provide the microclimate resolution that makes per-biome weather differentiation possible. And the aggregator provides a unified access point that eliminates the need to maintain seven different API clients.

---

## 2. Open-Meteo: The Universal Free API

Open-Meteo is an open-source weather forecasting API that aggregates data from seven national weather services into a single endpoint, processing over 2 TB of raw meteorological data daily [2]. For Minecraft weather integration, it serves as the primary data source for most regions because it combines the highest accessible resolution with zero authentication requirements.

### Core API Specification

| Parameter | Value |
|---|---|
| Endpoint | `https://api.open-meteo.com/v1/forecast` |
| Resolution (Europe/US) | 1-2 km (regional models) |
| Resolution (global) | 11 km (GFS/ECMWF) |
| Forecast horizon | 7-day hourly; 16-day with global models |
| 15-minute data | Available via `minutely_15=` parameter |
| 15-min coverage | NOAA HRRR (North America), DWD ICON-D2 + MF AROME (Central Europe) |
| Rate limit | 10,000 requests/day (free tier); no hard limit for fair use |
| Historical data | 80+ years (ERA5 reanalysis), 10 km resolution |
| License | CC BY 4.0 (data); AGPLv3 (code) |
| Self-hosting | Docker or Ubuntu packages; full source available |
| GeoDNS routing | Requests routed to EU/NA servers; sub-10ms typical response |

### Request Format

A minimal request for Minecraft-relevant weather variables at a PNW coordinate:

```
GET https://api.open-meteo.com/v1/forecast
  ?latitude=47.6062
  &longitude=-122.3321
  &current=temperature_2m,precipitation,rain,snowfall,
           cloud_cover,wind_speed_10m,weather_code,
           is_day,visibility
  &minutely_15=precipitation,weather_code,
               wind_speed_10m,temperature_2m
  &timezone=America/Los_Angeles
```

The `weather_code` field returns WMO Standard Code 4677, a numerical classification used by all national weather services [4]. This is the primary variable for Minecraft weather state translation because it encodes precipitation type, intensity, and atmospheric phenomena into a single integer. See Section 8 for the full WMO code mapping.

### Response Variables Relevant to Minecraft

| Variable | Unit | Minecraft Use |
|---|---|---|
| `temperature_2m` | Celsius | Rain vs. snow threshold; biome temperature override |
| `precipitation` | mm | Precipitation intensity; particle density |
| `rain` | mm | Rain confirmation; intensity scaling |
| `snowfall` | cm | Snow confirmation; snow layer depth proxy |
| `cloud_cover` | % | Sky color; overcast threshold |
| `wind_speed_10m` | km/h | Storm escalation; particle drift |
| `wind_direction_10m` | degrees | Weather front propagation direction |
| `weather_code` | WMO 4677 | Primary state classifier |
| `is_day` | boolean | Day/night cycle sync |
| `snow_depth` | m | Persistent snow layer indicator |
| `visibility` | m | Fog render distance |
| `thunder_probability` | % | Thunder state trigger (where available) |

### 15-Minute Data: The HRRR Sub-Hourly Feed

Open-Meteo's `minutely_15` parameter exposes NOAA HRRR sub-hourly forecasts for North America and DWD ICON-D2 for Central Europe [2]. This is the finest temporal resolution available through a free API and matches the target update cadence for the Minecraft weather sidecar. For a PNW server, this means weather state can change every 15 minutes based on actual HRRR model output, not interpolated hourly data.

> **SAFETY NOTE:** Open-Meteo's fair-use policy allows 10,000 requests per day without an API key. For a Minecraft server querying 8 weather zones every 15 minutes, the daily request count is 8 * 96 = 768 -- well within limits. However, aggressive polling or multiple instances on the same IP could trigger rate limiting. The sidecar must implement exponential backoff on HTTP 429 responses [2].

---

## 3. NOAA HRRR: Convection-Resolving Precision

The High-Resolution Rapid Refresh (HRRR) is NOAA's flagship real-time atmospheric model, running at 3 km horizontal resolution with hourly updates across the Continental United States and Alaska [5]. HRRR's distinguishing feature for Minecraft weather integration is its convection-allowing physics: the model resolves individual storm cells, fog layers, mountain snow bands, and coastal gap winds without parameterization [6].

### Model Specifications

| Parameter | Value |
|---|---|
| Resolution | 3 km (CONUS + Alaska) |
| Update frequency | Every hour; sub-hourly at 15-min intervals |
| Forecast horizon | 18h standard; 48h at 00/06/12/18 UTC |
| Data format | GRIB2 |
| AWS archive | `s3://noaa-hrrr-bdp-pds/` (free, public) |
| Azure archive | Microsoft Planetary Computer (free) |
| Python library | `herbie` package (Brian Blaylock) [7] |
| Latency | Files available ~3 hours after initialization |
| Domain | Continental US + Alaska |
| Radar assimilation | Every 15 minutes over 1-hour window |

### Why HRRR Matters for PNW Microclimates

The Pacific Northwest presents one of the most challenging microclimate environments in North America. Within a 200 km transect from the Pacific coast to the Cascade crest, conditions can range from maritime fog at sea level to 100+ km/h wind gusts at ridge tops to clear cold continental air in the rain shadow [3]. HRRR's 3 km grid spacing resolves the major terrain features that drive this differentiation:

- **Coastal fog banks** that form when marine air meets cold upwelling zones
- **Convergence zones** where two air masses collide over Puget Sound
- **Orographic precipitation** where moist air is forced upward by the Cascades
- **Rain shadow** on the eastern slopes where precipitation drops sharply
- **Gap winds** that channel through river valleys at high velocity

At 3 km resolution, HRRR places approximately 67 grid cells across the 200 km coast-to-crest transect. This is sufficient to differentiate at least 4-6 distinct microclimate zones for Minecraft biome mapping.

### GRIB2 Data Access with Herbie

The `herbie` Python package provides convenient access to HRRR GRIB2 files on AWS and Azure [7]. A typical fetch for the surface weather variables needed for Minecraft integration:

```
from herbie import Herbie

H = Herbie("2026-03-26 12:00", model="hrrr", product="sfc")

# Fetch 2-meter temperature
ds_temp = H.xarray(":TMP:2 m above")

# Fetch total precipitation
ds_precip = H.xarray(":APCP:surface")

# Fetch visibility
ds_vis = H.xarray(":VIS:surface")

# Fetch categorical weather types
ds_rain = H.xarray(":CRAIN:surface")   # rain yes/no
ds_snow = H.xarray(":CSNOW:surface")   # snow yes/no
ds_frzr = H.xarray(":CFRZR:surface")   # freezing rain
ds_icep = H.xarray(":CICEP:surface")   # ice pellets
```

Each GRIB2 field is a 2D grid at 3 km resolution. Point extraction uses latitude/longitude lookup via `xarray` coordinate selection, returning the value at the nearest grid cell. For Minecraft zone mapping, the sidecar extracts values at the center coordinate of each configured weather zone.

### Data Latency and Freshness

HRRR model output becomes available approximately 50-90 minutes after the forecast initialization time (T+0) for the first forecast hours, with later hours following progressively [5]. For the Minecraft sidecar, the practical approach is to fetch the T+0 or T+1 analysis fields (closest to current conditions) from the most recent available cycle. The `herbie` package handles cycle discovery automatically.

---

## 4. NASA GEOS-5 CFAPI: Global Atmospheric Composition

NASA's Global Modeling and Assimilation Office (GMAO) operates GEOS-5, a global atmospheric model that provides near-real-time assimilation products on a 0.3 x 0.25 degree grid (~30 km resolution) [8]. The GEOS-CF (Composition Forecast) API allows point queries by latitude and longitude, returning both meteorological and atmospheric composition data.

### Key Characteristics

| Parameter | Value |
|---|---|
| Resolution | ~30 km (0.3 x 0.25 degrees) |
| Coverage | Global |
| Update frequency | Near-real-time |
| Access | CFAPI REST endpoint (NASA GMAO) |
| Authentication | None required |
| Data format | JSON (via API); NetCDF4 (bulk) |
| Complementary API | NASA POWER (0.5 x 0.5 degree, solar + met) |

### Role in the Pipeline

GEOS-5 serves as a **global fallback** for locations outside HRRR coverage and as a supplementary source for atmospheric composition data (aerosol optical depth, dust loading) that could inform visibility and sky color calculations. However, its ~30 km resolution is too coarse for PNW microclimate differentiation [8].

> **SAFETY NOTE:** GEOS-5 forecast products are designated as experimental and for research purposes only by NASA GMAO [8]. The sidecar must flag GEOS-5 data as supplementary and never use it as the sole source for weather state decisions in production.

### NASA POWER API

The NASA POWER (Prediction of Worldwide Energy Resources) project provides a complementary meteorological API with global coverage dating to 1981 [9]. While designed for solar energy applications, its surface meteorological parameters (temperature, humidity, wind, precipitation) overlap with Minecraft weather needs. Endpoint: `https://power.larc.nasa.gov/api/temporal/daily`.

---

## 5. NOAA GFS: Global Baseline Fallback

The Global Forecast System (GFS) is NOAA's global weather model, running four times daily at 13 km resolution with forecast horizons extending to 16 days [10]. For the Minecraft weather pipeline, GFS serves as the outermost fallback ring: when Open-Meteo is unreachable, HRRR is unavailable, and GEOS-5 is delayed, GFS data on AWS provides a guaranteed baseline.

### Specifications

| Parameter | Value |
|---|---|
| Resolution | 13 km (0.25 degrees) |
| Coverage | Global |
| Update frequency | Every 6 hours (00/06/12/18 UTC) |
| Forecast horizon | 16 days |
| Data format | GRIB2 |
| AWS archive | `s3://noaa-gfs-bdp-pds/` |
| Latency | ~4 hours after init time |

GFS resolution is adequate for broad weather type classification (rain/snow/clear) but insufficient for PNW microclimate differentiation. A 13 km grid cell spanning the Olympic Rain Shadow could blend marine precipitation with rain shadow clear sky into a single averaged value.

---

## 6. Data Source Comparison Matrix

| Source | Resolution | Coverage | Update Rate | Auth | Cost | Best Use |
|---|---|---|---|---|---|---|
| Open-Meteo | 1-2 km | Global | 1 hour (15 min NA) | None | Free | Primary for all regions |
| NOAA HRRR | 3 km | CONUS/AK | 1 hour (15 min ingest) | None | Free | Primary for North America |
| NASA GEOS-5 | ~30 km | Global | Near-RT | None | Free | Global fallback |
| NOAA GFS | 13 km | Global | 6 hours | None | Free | Long-range fallback |
| GOES-19 SDR | 1 km/channel | Americas | Continuous | N/A | Hardware cost | Local enrichment |

The priority chain for the sidecar fetcher: Open-Meteo (primary) -> HRRR direct (validation/enrichment) -> GFS (fallback) -> GEOS-5 (supplementary). If Open-Meteo returns a valid response, the HRRR and GFS layers are used only for cross-validation.

---

## 7. API Response Schemas and Normalization

Each data source returns weather information in a different format. The normalization layer translates all responses into a unified `WeatherState` schema that the Minecraft bridge can consume.

### WeatherState Schema (Target)

```
{
  "zone_id": "pnw-coast",
  "timestamp": "2026-03-26T12:00:00Z",
  "source": "open-meteo",
  "source_model": "hrrr_conus15min",
  "coordinates": {
    "latitude": 47.6062,
    "longitude": -122.3321
  },
  "temperature_c": 8.2,
  "precipitation_mm_h": 2.4,
  "precipitation_type": "rain",
  "cloud_cover_pct": 85,
  "visibility_m": 4500,
  "wind_speed_kmh": 18.5,
  "wind_direction_deg": 215,
  "wmo_code": 61,
  "thunder_probability_pct": 5,
  "is_day": true,
  "snow_depth_m": 0.0,
  "pressure_hpa": 1013.2,
  "humidity_pct": 78,
  "mc_state": {
    "weather": "rain",
    "thunder": false,
    "precipitation_type": "rain",
    "intensity": 0.6,
    "fog": false
  },
  "ttl_seconds": 900
}
```

The `mc_state` sub-object is the fully translated Minecraft weather state, computed by the translation layer (Module 4). The parent fields preserve the raw meteorological data for logging and debugging.

### Open-Meteo Response Normalization

Open-Meteo returns JSON with `current` and `minutely_15` sections. The normalizer extracts the most recent 15-minute data point (if available) or falls back to the `current` snapshot. Key translation: Open-Meteo's `weather_code` maps directly to WMO 4677 [4].

### HRRR GRIB2 Normalization

HRRR data arrives as GRIB2 binary grids. The normalizer uses `herbie` + `xarray` to extract point values at configured coordinates, then maps HRRR's categorical precipitation fields (`CRAIN`, `CSNOW`, `CFRZR`, `CICEP`) to WMO-equivalent codes. Temperature, visibility, and wind fields map directly.

---

## 8. WMO Weather Code Standard

The World Meteorological Organization's Code Table 4677 is the international standard for present weather classification [4]. Open-Meteo returns this code directly; HRRR and GEOS-5 output must be translated to WMO equivalents.

### Code Ranges Relevant to Minecraft

| WMO Code Range | Description | Minecraft Mapping |
|---|---|---|
| 0-3 | Clear to partly cloudy | CLEAR state; cloud_cover for sky color |
| 45-48 | Fog (depositing rime or not) | FOG effect; reduce render distance |
| 51-57 | Drizzle (light to freezing) | RAIN state; low particle density |
| 61-67 | Rain (slight to freezing) | RAIN state; scale particle density to intensity |
| 71-77 | Snow (slight to heavy grains) | SNOW state; biome must support snow precipitation |
| 80-82 | Rain showers | RAIN state; intermittent flag for transition logic |
| 85-86 | Snow showers | SNOW state; intermittent flag |
| 95-99 | Thunderstorms | THUNDER state; lightning strike rate from intensity |

### Intensity Mapping

WMO codes encode intensity within their ranges. For rain: code 61 = slight, 63 = moderate, 65 = heavy [4]. The Minecraft translation maps these to particle density multipliers:

| WMO Code | Intensity | MC Particle Density | MC Rain Level |
|---|---|---|---|
| 51 | Slight drizzle | 0.2 | light |
| 53 | Moderate drizzle | 0.35 | light |
| 61 | Slight rain | 0.5 | moderate |
| 63 | Moderate rain | 0.7 | moderate |
| 65 | Heavy rain | 1.0 | heavy |
| 80 | Slight rain shower | 0.5 | moderate |
| 82 | Violent rain shower | 1.0 | heavy |
| 95 | Thunderstorm, slight/moderate | 0.8 + thunder | heavy + thunder |
| 99 | Thunderstorm with hail | 1.0 + thunder | heavy + thunder |

---

## 9. Rate Limits, Licensing, and Fair Use

### License Summary

| Source | Data License | Code License | Commercial Use | Attribution Required |
|---|---|---|---|---|
| Open-Meteo | CC BY 4.0 | AGPLv3 | Requires commercial plan | Yes (source model) |
| NOAA HRRR | US Public Domain | N/A | Unrestricted | No (courtesy) |
| NASA GEOS-5 | US Public Domain | N/A | Unrestricted | No (courtesy) |
| NOAA GFS | US Public Domain | N/A | Unrestricted | No (courtesy) |

All primary data sources are free for the Minecraft weather sidecar use case. Open-Meteo's non-commercial tier covers personal/educational server operation. NOAA and NASA data is US public domain with no restrictions [1].

### Rate Limit Compliance

The sidecar must enforce rate limits locally rather than relying on server-side rejection:

- **Open-Meteo:** Maximum 10,000 requests/day on free tier. Budget: 768 requests/day for 8 zones at 15-min intervals. Safety margin: 13x under limit [2].
- **NOAA HRRR (AWS):** No API rate limit; S3 GET requests are metered by AWS but NOAA covers the cost through the NODD program [1].
- **NASA GEOS-5:** No published rate limit; NASA GMAO requests courtesy use and research-only designation [8].

> **SAFETY NOTE:** The sidecar must implement a local request counter and hard-stop at 9,000 requests/day to Open-Meteo, leaving headroom for retry logic. Exceeding fair-use limits risks IP-level blocking, which would degrade service for all zones simultaneously.

---

## 10. The Fetch Pipeline: From HTTP to WeatherState

The complete data acquisition pipeline runs as a single Python coroutine on the sidecar, executing every 15 minutes:

```
FETCH PIPELINE -- SIDECAR SCHEDULER
================================================================

  [Timer fires: 15-min interval]
        |
        v
  FOR EACH CONFIGURED ZONE:
    1. Check cache: if TTL valid, skip fetch
        |
        v
    2. Query Open-Meteo (primary)
       - latitude, longitude from zone config
       - request minutely_15 + current
       - timeout: 10 seconds
        |
        +-- SUCCESS --> normalize to WeatherState
        |
        +-- FAIL --> fall back to HRRR direct
                     |
                     +-- SUCCESS --> normalize
                     |
                     +-- FAIL --> fall back to GFS
                                  |
                                  +-- SUCCESS --> normalize
                                  |
                                  +-- FAIL --> serve stale cache
                                               (log warning)
        |
        v
    3. Store WeatherState in cache (TTL = 900s)
        |
        v
    4. Compare with previous state
       - If state changed: push to Minecraft bridge
       - If unchanged: no action (avoid command spam)
```

The fallback chain ensures the sidecar always has weather data to serve. The worst case is serving stale cached data, which degrades to "weather updates are delayed" rather than "weather is broken."

---

## 11. Error Handling and Fallback Chains

### Failure Modes

| Failure | Detection | Recovery | Max Downtime |
|---|---|---|---|
| Open-Meteo timeout | HTTP timeout (10s) | Fall back to HRRR | 10 seconds |
| Open-Meteo 429 (rate limit) | HTTP status code | Exponential backoff; HRRR fallback | 15 minutes (next cycle) |
| HRRR file not yet available | S3 404 | Use previous cycle; fall back to GFS | 1 hour (next HRRR cycle) |
| GEOS-5 API error | HTTP error | Skip supplementary data | No impact (supplementary) |
| Network outage | All fetches fail | Serve stale cache | Cache TTL (1 hour max) |
| Invalid response data | Schema validation | Reject; serve stale cache | 15 minutes (next cycle) |

### Exponential Backoff Implementation

```
backoff_seconds = min(base_delay * (2 ** retry_count), max_delay)
# base_delay = 30 seconds
# max_delay = 900 seconds (15 minutes, aligns with fetch cycle)
# max_retries = 5 per cycle
```

After 5 failed retries, the fetcher yields to the next scheduled cycle rather than continuing to hammer a failing endpoint.

---

## 12. PNW-Specific Data Considerations

The Pacific Northwest presents unique challenges for weather data integration that deserve specific treatment.

### Microclimate Gradient: Coast to Cascades

The 200 km transect from the Pacific coast to the Cascade crest traverses at least five distinct microclimate zones [3]:

1. **Outer Coast** -- Maritime influence; fog, drizzle, mild temperatures year-round
2. **Puget Sound Lowlands** -- Convergence zone; rain shadow from Olympics; moderate precipitation
3. **Western Cascade Foothills** -- Increasing precipitation; transition from rain to snow with elevation
4. **Cascade Crest** -- Heavy orographic precipitation; 100+ inches of snow per winter; high winds
5. **Eastern Slopes** -- Rain shadow; semi-arid; dramatic temperature swings

HRRR at 3 km resolution places approximately 67 grid cells across this transect, sufficient to differentiate all five zones. Open-Meteo with HRRR sub-hourly data provides the temporal resolution to track weather fronts moving through the gradient.

### The Puget Sound Convergence Zone

A recurring mesoscale weather feature where airflow splits around the Olympic Mountains and reconverges over central Puget Sound, producing a localized band of enhanced precipitation [11]. The convergence zone can produce heavy rain or snow in a narrow band while areas 20 km north and south remain dry. HRRR resolves this feature; GFS and GEOS-5 do not.

For Minecraft mapping, the convergence zone demonstrates why per-biome weather differentiation matters: a single "Seattle weather" query misrepresents conditions for any biome mapped to areas north or south of the convergence band.

### Atmospheric River Events

The PNW experiences periodic atmospheric river (AR) events where narrow corridors of intense moisture transport from the subtropical Pacific make landfall along the coast [12]. AR events can deliver 100-200 mm of precipitation in 24-48 hours and are the primary driver of flooding in western Washington. HRRR's convection-resolving physics captures AR structure; the Minecraft translation should map AR events to maximum precipitation intensity with sustained heavy rain and potential thunder.

### Snow Level: The Critical Variable

In the PNW, the boundary between rain and snow (the snow level) can vary from sea level to 3000+ meters within a single storm [3]. HRRR provides freezing level data that the translation layer uses to override biome precipitation type. When the snow level drops to 500 meters, lowland biomes mapped to Puget Sound should switch from rain to snow -- even if the biome is not normally a "snowy" biome in Minecraft's classification.

---

## 13. Cross-References

> **Related:** [DIY Satellite Reception](02-diy-satellite-reception.md) -- GOES-19 imagery provides visual confirmation of cloud cover and storm structure from the data sources documented here. [Microclimate Simulation](04-microclimate-simulation.md) -- translates the raw API data documented here into Minecraft weather states. [GSD Mesh Integration](05-gsd-mesh-integration.md) -- the sidecar service that runs the fetch pipeline described in Section 10.

**Series cross-references:**
- **MCR (Microcontrollers):** Weather station hardware feeding local sensor data as ground truth
- **VAV (Vacuum Tubes to VLSI):** The signal processing chain from sensor to digital weather product
- **ECO (PNW Ecoregions):** The five microclimate zones in Section 12 map directly to ECO's ecoregion boundaries
- **PLT (PNW Planting Intelligence):** Weather data sources are shared; PLT uses historical data for frost dates
- **SPA (Space Systems):** GOES-19 is part of the same satellite infrastructure documented in SPA
- **CMH (Climate History):** Historical weather patterns provide context for real-time data interpretation
- **BPS (Bioregional Profiles):** PNW microclimate profiles are derived from the same NOAA/NASA data

---

## 14. Sources

1. NOAA Open Data Dissemination (NODD). "Cloud-Hosted Open Data." U.S. Department of Commerce, 2026. https://www.noaa.gov/open-data-dissemination
2. Zippenfenig, P. "Open-Meteo.com Free Weather Forecast API." Open-Meteo GitHub, 2023-2026. https://open-meteo.com/
3. Mass, C.F. *The Weather of the Pacific Northwest*. 2nd ed. University of Washington Press, 2021.
4. World Meteorological Organization. "Manual on Codes: International Codes, Vol. I.1, Part A -- Alphanumeric Codes." WMO-No. 306, 2019.
5. Dowell, D. et al. "The High-Resolution Rapid Refresh (HRRR): An Hourly Updating Convection-Allowing Forecast Model." *Weather and Forecasting*, NOAA IR, 2022.
6. Benjamin, S. et al. "A North American Hourly Assimilation and Model Forecast Cycle: The Rapid Refresh." *Monthly Weather Review*, 144, 1669-1694, 2016.
7. Blaylock, B.K. "Herbie: Retrieve Numerical Weather Prediction Model Data." GitHub, 2021-2026. https://github.com/blaylockbk/Herbie
8. NASA GMAO. "GEOS-CF Data Access." Goddard Space Flight Center, 2026. https://gmao.gsfc.nasa.gov/
9. NASA POWER Project. "Prediction of Worldwide Energy Resources: Daily API." Langley Research Center, 2026. https://power.larc.nasa.gov/
10. NOAA/NCEP. "Global Forecast System (GFS)." Environmental Modeling Center, 2026. https://www.emc.ncep.noaa.gov/emc/pages/numerical_forecast_systems/gfs.php
11. Mass, C.F., Albright, M., and Brettman, K. "The Puget Sound Convergence Zone." *Bulletin of the American Meteorological Society*, 67(8), 997-1012, 1986.
12. Ralph, F.M., Dettinger, M.D., Cairns, M.M., Galarneau, T.J., and Eylander, J. "Defining 'Atmospheric River': How the Glossary of Meteorology Helped Resolve a Debate." *Bulletin of the American Meteorological Society*, 99(4), 837-839, 2018.
13. NOAA NCEP. "HRRR Model Documentation." NOAA Earth System Research Laboratories, 2022. https://rapidrefresh.noaa.gov/hrrr/
14. Microsoft Planetary Computer. "NOAA HRRR Data Catalog." 2026. https://planetarycomputer.microsoft.com/dataset/noaa-hrrr
15. Open-Meteo API Documentation. "Weather Variables and Parameters." 2026. https://open-meteo.com/en/docs
16. ECMWF. "IFS Documentation -- Cy49r1." European Centre for Medium-Range Weather Forecasts, 2025.
17. National Weather Service. "WMO Code Tables." NOAA, 2019.

---

*Minecraft Real-Time Weather -- Module 1: Global Weather Data Sources. The atmosphere is already being modeled at 3 km resolution, updated every hour, and published for free. The game just needs to learn how to read.*
