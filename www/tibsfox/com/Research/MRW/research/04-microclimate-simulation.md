# Microclimate Simulation and Variable Mapping

> **Domain:** Applied Meteorology and Game State Translation
> **Module:** 4 -- The Translation Layer Between Real Atmosphere and Block World
> **Through-line:** *The real sky speaks in hectopascals, kelvin, and millimeters per hour. The game sky speaks in booleans and particle counts. The translation layer is where the fidelity lives -- where a WMO weather code becomes rain or snow, where a cloud cover percentage becomes a darkened sky, where a visibility reading becomes fog you can walk through. Get the translation right and the game feels like the world outside your window. Get it wrong and it is just another mod.*

---

## Table of Contents

1. [The Translation Problem](#1-the-translation-problem)
2. [WMO Code to Minecraft State Mapping](#2-wmo-code-to-minecraft-state-mapping)
3. [Temperature and Snow Level Logic](#3-temperature-and-snow-level-logic)
4. [Cloud Cover and Sky State](#4-cloud-cover-and-sky-state)
5. [Precipitation Intensity Scaling](#5-precipitation-intensity-scaling)
6. [Wind and Storm Escalation](#6-wind-and-storm-escalation)
7. [Fog and Visibility](#7-fog-and-visibility)
8. [Thunder Probability and Lightning](#8-thunder-probability-and-lightning)
9. [Coordinate Mapping: Real World to Game World](#9-coordinate-mapping-real-world-to-game-world)
10. [Weather Front Propagation](#10-weather-front-propagation)
11. [Transition Logic and Hysteresis](#11-transition-logic-and-hysteresis)
12. [The WeatherState Contract](#12-the-weatherstate-contract)
13. [Cross-References](#13-cross-references)
14. [Sources](#14-sources)

---

## 1. The Translation Problem

The fundamental challenge of real-weather integration is domain translation. Meteorological data describes the atmosphere as a continuous, three-dimensional field of interrelated variables: temperature, pressure, humidity, wind velocity, cloud microphysics, and electromagnetic radiation balance. Minecraft describes weather as two booleans (`isRaining`, `isThundering`) plus biome-level precipitation type [1].

The translation layer must collapse a high-dimensional atmospheric state into a low-dimensional game state while preserving the perceptual essence: when it is raining outside, it should feel like rain in the game. When the mountains have snow but the lowlands have rain, the game should reflect that gradient. When fog rolls in from the coast, the game's visibility should drop.

```
TRANSLATION DOMAIN MAP
================================================================

  METEOROLOGICAL DOMAIN              GAME DOMAIN
  (continuous, physical)              (discrete, boolean)
  =====================              ====================

  Temperature (Celsius)       -->    Rain vs. Snow threshold
  Precipitation rate (mm/h)   -->    Rain state ON/OFF
  Precipitation type (WMO)    -->    Particle texture selection
  Cloud cover (%)             -->    Sky darkness level
  Visibility (meters)         -->    Fog render distance
  Wind speed (km/h)           -->    Storm escalation trigger
  Thunder probability (%)     -->    Thunder state ON/OFF
  Pressure (hPa)              -->    (no direct mapping; used for
                                      front detection)
  Humidity (%)                -->    (no direct mapping; used for
                                      fog prediction)

  Many-to-few mapping: 8+ continuous variables --> 3 states + modifiers
```

The mapping is deliberately lossy. Minecraft cannot represent partial cloud cover, drizzle versus downpour, or wind direction natively. The translation layer makes choices: at what cloud cover percentage does the sky darken? At what precipitation rate does rain become "heavy"? These thresholds are the design parameters of the system, and they must be calibrated to feel right rather than be physically precise.

---

## 2. WMO Code to Minecraft State Mapping

The World Meteorological Organization's Code Table 4677 classifies present weather into 100 categories (codes 0-99) [2]. Open-Meteo returns this code directly in the `weather_code` field. The translation function maps each code range to a Minecraft weather state.

### Complete WMO-to-Minecraft Translation Table

| WMO Code | Description | MC State | MC Precip Type | Intensity |
|---|---|---|---|---|
| 0 | Clear sky | CLEAR | none | 0.0 |
| 1 | Mainly clear | CLEAR | none | 0.0 |
| 2 | Partly cloudy | CLEAR | none | 0.0 |
| 3 | Overcast | CLEAR* | none | 0.0 |
| 45 | Fog | CLEAR + FOG | none | 0.0 |
| 48 | Depositing rime fog | CLEAR + FOG | none | 0.0 |
| 51 | Light drizzle | RAIN | rain | 0.2 |
| 53 | Moderate drizzle | RAIN | rain | 0.35 |
| 55 | Dense drizzle | RAIN | rain | 0.5 |
| 56 | Light freezing drizzle | RAIN | rain/snow | 0.25 |
| 57 | Dense freezing drizzle | RAIN | rain/snow | 0.5 |
| 61 | Slight rain | RAIN | rain | 0.5 |
| 63 | Moderate rain | RAIN | rain | 0.7 |
| 65 | Heavy rain | RAIN | rain | 1.0 |
| 66 | Light freezing rain | RAIN | rain/snow | 0.4 |
| 67 | Heavy freezing rain | RAIN | rain/snow | 0.8 |
| 71 | Slight snow fall | RAIN | snow | 0.4 |
| 73 | Moderate snow fall | RAIN | snow | 0.65 |
| 75 | Heavy snow fall | RAIN | snow | 1.0 |
| 77 | Snow grains | RAIN | snow | 0.3 |
| 80 | Slight rain showers | RAIN | rain | 0.5 |
| 81 | Moderate rain showers | RAIN | rain | 0.7 |
| 82 | Violent rain showers | RAIN | rain | 1.0 |
| 85 | Slight snow showers | RAIN | snow | 0.45 |
| 86 | Heavy snow showers | RAIN | snow | 0.9 |
| 95 | Thunderstorm, slight/moderate | THUNDER | rain | 0.8 |
| 96 | Thunderstorm with slight hail | THUNDER | rain | 0.85 |
| 99 | Thunderstorm with heavy hail | THUNDER | rain | 1.0 |

*WMO Code 3 (overcast) maps to CLEAR in vanilla Minecraft because the game has no "overcast without rain" state. With shader integration, overcast can darken the sky and modify ambient light without triggering rain particles.

### Translation Function

```
def wmo_to_mc_state(wmo_code, temperature_c, biome_supports_snow):
    """
    Translate WMO weather code to Minecraft weather state.

    Returns: dict with keys: weather, thunder, precip_type, intensity, fog
    """
    # Fog
    if wmo_code in (45, 48):
        return {
            "weather": "clear",
            "thunder": False,
            "precip_type": "none",
            "intensity": 0.0,
            "fog": True
        }

    # Thunderstorms
    if wmo_code >= 95:
        return {
            "weather": "thunder",
            "thunder": True,
            "precip_type": "rain",
            "intensity": WMO_INTENSITY.get(wmo_code, 0.8),
            "fog": False
        }

    # Snow
    if wmo_code in range(71, 78) or wmo_code in (85, 86):
        precip = "snow" if biome_supports_snow else "rain"
        return {
            "weather": "rain",
            "thunder": False,
            "precip_type": precip,
            "intensity": WMO_INTENSITY.get(wmo_code, 0.5),
            "fog": False
        }

    # Rain / Drizzle
    if wmo_code in range(51, 68) or wmo_code in range(80, 83):
        precip = "snow" if (temperature_c < 0 and biome_supports_snow) else "rain"
        return {
            "weather": "rain",
            "thunder": False,
            "precip_type": precip,
            "intensity": WMO_INTENSITY.get(wmo_code, 0.5),
            "fog": False
        }

    # Clear / Cloudy
    return {
        "weather": "clear",
        "thunder": False,
        "precip_type": "none",
        "intensity": 0.0,
        "fog": False
    }
```

---

## 3. Temperature and Snow Level Logic

In the real PNW, the snow level (the altitude above which precipitation falls as snow) is the single most impactful variable for microclimate differentiation. A winter storm with a snow level at 500 meters blankets the Cascade foothills in white while Seattle gets cold rain. The same storm with a snow level at 1500 meters means rain everywhere except the alpine peaks [3].

### Snow Level Determination

The snow level is approximated from the 2-meter temperature at the zone's real-world coordinates, adjusted for the zone's representative elevation:

```
def determine_snow_level(temperature_c, pressure_hpa, elevation_m):
    """
    Estimate snow level altitude from surface conditions.

    Uses standard atmospheric lapse rate (6.5 C/km) and
    typical rain/snow transition at +1 C wet-bulb temperature.
    """
    LAPSE_RATE = 6.5  # C per km
    RAIN_SNOW_THRESHOLD = 1.0  # C (wet bulb)

    if temperature_c <= RAIN_SNOW_THRESHOLD:
        # Snow level is at or below surface
        return elevation_m

    # Height above surface where temperature reaches threshold
    delta_t = temperature_c - RAIN_SNOW_THRESHOLD
    height_above_surface = (delta_t / LAPSE_RATE) * 1000  # meters

    return elevation_m + height_above_surface
```

### Minecraft Biome Temperature Override

When the real-world snow level drops below the elevation associated with a Minecraft zone, the translation layer should flag the zone for snow precipitation regardless of the biome's default temperature setting:

| Real Snow Level | PNW Zone | MC Override |
|---|---|---|
| > 1500 m | All lowland zones | Default (rain) |
| 800-1500 m | Cascade Foothills | Snow above Y=128 |
| 300-800 m | Puget Sound Lowlands | Snow above Y=96 |
| < 300 m | Puget Sound, Coast | Snow at all elevations |

This is the primary mechanism for achieving the "when the Cascades get snow, the mountains biome gets snow" effect described in the vision document.

---

## 4. Cloud Cover and Sky State

Minecraft's vanilla sky rendering does not respond to cloud cover percentage. The sky is either normal (clear/partly cloudy) or darkened (raining/thundering). The translation layer must collapse a continuous 0-100% cloud cover value into discrete states.

### Cloud Cover Thresholds

| Cloud Cover | Classification | MC Visual State | Shader Enhancement |
|---|---|---|---|
| 0-15% | Clear | Normal sky rendering | Bright, full shadows |
| 15-40% | Partly cloudy | Normal sky rendering | Slightly reduced contrast |
| 40-70% | Mostly cloudy | Normal sky rendering | Dimmed ambient light (shader) |
| 70-85% | Overcast | Borderline -- trigger rain state at low intensity | Gray sky, soft shadows |
| 85-100% | Fully overcast | Rain state with intensity 0.1-0.3 | Dark sky, no shadows |

The 70% threshold for transitioning to rain state is calibrated to PNW conditions where overcast skies are common without precipitation. In the PNW, cloud cover exceeds 70% approximately 55% of days from October through March [3]. Triggering rain at 70% cloud cover would produce unrealistically frequent rain in the game. The threshold is therefore set at 85% for non-precipitating overcast.

### Shader-Enhanced Sky States

With Iris/Sodium shader integration, the mod can communicate cloud cover as a continuous uniform value (0.0-1.0) rather than a boolean. This allows shader packs to implement:

- Gradual sky darkening proportional to cloud cover
- Reduced sun/moon brightness under overcast
- Modified fog color (warm gray for marine layer; cool gray for nimbostratus)
- Variable shadow softness (hard shadows in clear sky; no shadows under overcast)

---

## 5. Precipitation Intensity Scaling

Vanilla Minecraft has a single rain particle density. The real atmosphere has drizzle (0.1-0.5 mm/h), moderate rain (2-7 mm/h), heavy rain (>7 mm/h), and violent downpours (>50 mm/h) [4]. The translation layer maps precipitation rate to an intensity scalar that shader-equipped clients can use.

### Precipitation Rate to Intensity Mapping

| Rate (mm/h) | WMO Classification | MC Intensity | Visual Effect |
|---|---|---|---|
| 0.0-0.5 | Light drizzle | 0.2 | Few sparse particles |
| 0.5-2.0 | Moderate drizzle/light rain | 0.4 | Moderate particles |
| 2.0-7.5 | Moderate rain | 0.6 | Standard rain |
| 7.5-20.0 | Heavy rain | 0.8 | Dense particles, reduced visibility |
| > 20.0 | Violent/torrential | 1.0 | Maximum particles, heavy fog overlay |

### Snowfall Intensity

Snow has lower fall speeds and larger particle sizes than rain, so the visual density mapping differs:

| Rate (cm/h) | MC Intensity | Visual Effect |
|---|---|---|
| 0.0-1.0 | 0.3 | Light flurries |
| 1.0-3.0 | 0.5 | Steady snowfall |
| 3.0-7.0 | 0.75 | Heavy snowfall, reduced visibility |
| > 7.0 | 1.0 | Blizzard conditions |

---

## 6. Wind and Storm Escalation

Wind speed does not have a direct Minecraft representation, but it serves as an escalation trigger for weather state transitions.

### Wind-Based Escalation Rules

| Wind Speed (km/h) | Beaufort Scale | Effect on MC State |
|---|---|---|
| 0-19 | 0-4 (Calm to Moderate) | No modification |
| 20-38 | 5-6 (Fresh to Strong) | Increase particle drift (shader uniform) |
| 39-61 | 7-8 (Near Gale to Gale) | Escalate rain to thunder if raining |
| 62-88 | 9-10 (Strong Gale to Storm) | Force thunder state; maximum intensity |
| > 88 | 11-12 (Violent Storm to Hurricane) | Thunder state; NWS alert check |

### Wind Direction and Particle Drift

With shader integration, wind direction can influence particle trajectories:

```
// Shader uniform: wind as 2D vector
vec2 windEffect = mrw_windDirection * mrw_windSpeed;

// Apply to rain particle position
particlePos.xz += windEffect * fallProgress;
```

This creates the visual effect of rain falling at an angle during windy conditions -- a subtle but effective cue for immersion.

> **SAFETY NOTE:** When real-world wind speed exceeds 88 km/h (Beaufort 11-12), the sidecar must check for active NWS severe weather alerts (tornado, hurricane, severe thunderstorm warnings) in the zone's geographic area. If an alert is active, the game should NOT trigger thunder/lightning effects, as this could be distressing to players who are aware of the real emergency. Instead, a calm "shelter in place" message can be displayed server-side.

---

## 7. Fog and Visibility

Fog is arguably the most impactful weather condition for game immersion because it fundamentally changes the player's spatial awareness. Minecraft has no native fog weather state, but shader mods and render distance manipulation can simulate it effectively.

### Visibility to Fog Mapping

| Visibility (m) | Classification | MC Render Distance | Fog Density (Shader) |
|---|---|---|---|
| > 10,000 | Excellent | Normal (client setting) | 0.0 |
| 4,000-10,000 | Good | Normal | 0.1 |
| 1,000-4,000 | Moderate/Mist | Reduce by 4 chunks | 0.4 |
| 200-1,000 | Fog | Reduce by 8 chunks | 0.7 |
| < 200 | Dense fog | Reduce by 12 chunks | 1.0 |

### PNW Fog Types

The Pacific Northwest experiences several distinct fog types, each with different formation and dissipation characteristics [3]:

1. **Advection fog (marine layer):** Warm moist air moves over cold coastal water. Persistent; can last days. Primarily coastal zones. Visibility 200-1000m.
2. **Radiation fog (valley fog):** Overnight cooling under clear skies. Burns off by mid-morning. Puget Sound lowlands. Visibility 50-500m.
3. **Upslope fog:** Moist air forced up terrain. Cascade foothills. Effectively low cloud; visibility varies with elevation.
4. **Freezing fog:** Temperature below 0 C; ice crystal deposition. Eastern slopes. Visibility 200-500m; rime ice formation.

For Minecraft, all fog types map to the same visual effect (reduced visibility + fog shader), but the formation conditions differ. The sidecar uses visibility data from the API to trigger fog regardless of type. GOES-19 satellite imagery (Module 2) provides independent fog detection that can override API data when the satellite detects fog that models missed.

---

## 8. Thunder Probability and Lightning

Minecraft's thunder state enables lightning strikes at random positions within loaded chunks. The real-world equivalent is convective activity detectable through thunder probability, CAPE (Convective Available Potential Energy), and radar reflectivity [5].

### Thunder State Trigger Logic

```
def should_enable_thunder(weather_state):
    """
    Determine if Minecraft thunder state should be active.

    Uses multiple indicators for confidence.
    """
    triggers = []

    # WMO code indicates thunderstorm
    if weather_state.wmo_code >= 95:
        triggers.append(("wmo_code", 1.0))

    # Thunder probability above threshold
    if weather_state.thunder_probability_pct > 40:
        triggers.append(("probability", 0.8))

    # Wind speed indicates severe conditions
    if weather_state.wind_speed_kmh > 60:
        triggers.append(("wind", 0.4))

    # Heavy precipitation (potential embedded convection)
    if weather_state.precipitation_mm_h > 15:
        triggers.append(("precip", 0.3))

    if not triggers:
        return False

    # Enable if any high-confidence trigger or multiple low-confidence
    max_confidence = max(t[1] for t in triggers)
    total_confidence = sum(t[1] for t in triggers)

    return max_confidence >= 0.8 or total_confidence >= 1.0
```

### Lightning Strike Rate

Vanilla Minecraft generates lightning approximately once per 100,000 ticks (~83 minutes) during thunder. For real-weather integration, the strike rate can be modified based on storm intensity:

| Storm Intensity | Real Flash Rate | MC Strike Interval |
|---|---|---|
| Slight thunderstorm (WMO 95) | 1-2 per minute | 36,000 ticks (~30 min) |
| Moderate thunderstorm (WMO 96) | 3-5 per minute | 12,000 ticks (~10 min) |
| Severe thunderstorm (WMO 99) | 10+ per minute | 3,600 ticks (~3 min) |

---

## 9. Coordinate Mapping: Real World to Game World

The coordinate mapping system relates real-world latitude/longitude to Minecraft X/Z block coordinates through a configurable affine transform [6].

### Affine Transform Definition

```
# Forward: real-world -> Minecraft
mc_x = (longitude - lon_origin) * scale_factor * cos(lat_origin_rad)
mc_z = (latitude - lat_origin) * scale_factor

# Inverse: Minecraft -> real-world
longitude = lon_origin + mc_x / (scale_factor * cos(lat_origin_rad))
latitude = lat_origin + mc_z / scale_factor
```

### PNW Configuration Example

For Foxy's Playground with a world centered on Puget Sound:

| Parameter | Value | Notes |
|---|---|---|
| `lat_origin` | 47.5 N | Center of PNW region |
| `lon_origin` | -122.0 W | Eastern Puget Sound |
| `scale_factor` | 100 | 1 chunk (16 blocks) = ~0.16 degrees = ~17 km |
| MC X range | -8000 to +8000 | ~280 km east-west |
| MC Z range | -8000 to +8000 | ~280 km north-south |

This configuration places the game world's climate gradient from the Pacific coast (MC X = -8000) through the Cascades (MC X = +6000), covering the full PNW microclimate transect within a 16,000-block world.

### Resolution Considerations

At scale_factor = 100, each HRRR grid cell (3 km) spans approximately 17 Minecraft blocks -- less than 2 chunks. This means adjacent chunks could theoretically have different weather. The zone system (Module 3, Section 7) groups chunks into regions of 4000+ blocks to avoid unrealistic hyper-local weather variation while preserving meaningful regional differentiation.

---

## 10. Weather Front Propagation

Real weather fronts move across landscapes over hours. A cold front approaching the PNW coast typically takes 4-8 hours to traverse from the coast to the Cascade crest [3]. The translation layer can simulate this propagation by staggering weather state transitions across zones.

### Front Propagation Algorithm

```
def propagate_weather_front(zones, new_weather, wind_direction, wind_speed):
    """
    Stagger weather state transitions across zones based on
    wind direction and speed.

    A front moving from west to east at 30 km/h traversing
    4 zones spaced 50 km apart takes approximately:
    Zone 1 (coast): T+0
    Zone 2 (lowlands): T+1.7 hours
    Zone 3 (foothills): T+3.3 hours
    Zone 4 (crest): T+5.0 hours
    """
    # Sort zones by position along wind direction vector
    sorted_zones = sort_zones_by_wind_projection(zones, wind_direction)

    delays = {}
    for i, zone in enumerate(sorted_zones):
        distance_km = zone_distance_along_wind(
            sorted_zones[0], zone, wind_direction
        )
        delay_hours = distance_km / wind_speed
        delays[zone.id] = delay_hours

    return delays
```

### Practical Implementation

The sidecar does not need to simulate front propagation internally because the API data already reflects it. Open-Meteo and HRRR report weather conditions at each zone's coordinates independently [7]. If a front is approaching from the west, the coastal zone's API response will show rain before the inland zone's response does. The natural time lag in the data IS the front propagation.

However, the 15-minute update cadence may miss rapid transitions. To smooth the visual effect, the translation layer can interpolate between the previous and current weather state over 2-3 game minutes rather than applying the change instantaneously.

---

## 11. Transition Logic and Hysteresis

Abrupt weather changes are jarring. In the real world, rain starts gradually (cloud darkening, first drops, then steady rain). The translation layer implements transition smoothing and hysteresis to prevent oscillation [8].

### State Transition Smoothing

```
WEATHER STATE TRANSITIONS
================================================================

  CLEAR --> RAIN transition:
    1. Cloud cover rises above threshold (1-2 min game time)
    2. Rain intensity starts at 0.1, ramps to target over 3 min
    3. Sky darkness increases proportionally

  RAIN --> CLEAR transition:
    1. Rain intensity decreases from current to 0 over 3 min
    2. Cloud cover fades (2-3 min)
    3. Sky brightness increases

  RAIN --> THUNDER transition:
    1. Immediate: thunder state enabled
    2. First lightning after 30-60 second delay
    3. Rain intensity escalated if not already at target

  THUNDER --> RAIN transition:
    1. Thunder state disabled (no more lightning)
    2. Rain continues at current intensity
    3. Gradual de-escalation over 5 min
```

### Hysteresis Thresholds

To prevent rapid oscillation between states (e.g., cloud cover hovering at 85% causing rain/clear flickering), the translation layer uses different thresholds for entering and exiting a state:

| Transition | Enter Threshold | Exit Threshold | Hysteresis Band |
|---|---|---|---|
| Clear -> Rain | Cloud > 85% OR WMO >= 51 | Cloud < 70% AND WMO < 51 | 15% cloud cover |
| Rain -> Thunder | Thunder prob > 40% OR WMO >= 95 | Thunder prob < 20% AND WMO < 95 | 20% probability |
| Clear -> Fog | Visibility < 1000m | Visibility > 2000m | 1000m |
| Normal -> Storm | Wind > 60 km/h | Wind < 40 km/h | 20 km/h |

### Minimum State Duration

Each weather state has a minimum hold time to prevent visual flickering:

| State | Minimum Duration | Rationale |
|---|---|---|
| Clear | 5 minutes | Prevent rapid re-entry to rain |
| Rain | 3 minutes | Rain needs time to "establish" visually |
| Thunder | 2 minutes | Thunder events should feel significant |
| Fog | 5 minutes | Fog formation/dissipation is slow |

---

## 12. The WeatherState Contract

The WeatherState JSON object is the contract between the sidecar (producer) and the Minecraft bridge (consumer). Every field in this contract has a defined source, range, and default.

### Complete WeatherState Schema

```
{
  "zone_id": "string (required)",
  "timestamp": "ISO 8601 UTC (required)",
  "source": "string: open-meteo | hrrr | geos5 | gfs | satellite",
  "coordinates": {
    "latitude": "float (-90 to 90)",
    "longitude": "float (-180 to 180)"
  },
  "raw": {
    "temperature_c": "float (-60 to 60)",
    "precipitation_mm_h": "float (0 to 200)",
    "cloud_cover_pct": "int (0 to 100)",
    "visibility_m": "int (0 to 100000)",
    "wind_speed_kmh": "float (0 to 300)",
    "wind_direction_deg": "int (0 to 360)",
    "wmo_code": "int (0 to 99)",
    "thunder_probability_pct": "int (0 to 100)",
    "is_day": "boolean",
    "snow_depth_m": "float (0 to 20)",
    "pressure_hpa": "float (870 to 1084)",
    "humidity_pct": "int (0 to 100)"
  },
  "mc_state": {
    "weather": "string: clear | rain | thunder",
    "thunder": "boolean",
    "precipitation_type": "string: none | rain | snow",
    "intensity": "float (0.0 to 1.0)",
    "fog": "boolean",
    "fog_density": "float (0.0 to 1.0)",
    "wind_vector": [0.0, 0.0],
    "sky_darkness": "float (0.0 to 1.0)",
    "lightning_interval_ticks": "int (0 = disabled)"
  },
  "satellite": {
    "cloud_cover_pct": "int or null",
    "fog_detected": "boolean or null",
    "confidence": "float (0.0 to 1.0) or null"
  },
  "ttl_seconds": "int (default 900)",
  "previous_state_hash": "string (for change detection)"
}
```

### Default Values

When a field cannot be determined from the data source, the following defaults apply:

| Field | Default | Rationale |
|---|---|---|
| `mc_state.weather` | "clear" | Fail-safe: no precipitation |
| `mc_state.intensity` | 0.0 | Fail-safe: no visual effects |
| `mc_state.fog` | false | Fail-safe: full visibility |
| `thunder_probability_pct` | 0 | Conservative: no false positives |
| `satellite.*` | null | Optional enrichment |
| `ttl_seconds` | 900 | Match 15-min update cycle |

---

## 13. Cross-References

> **Related:** [Global Weather Data Sources](01-global-weather-data-sources.md) -- provides the raw data this module translates. [Minecraft Weather API](03-minecraft-weather-api.md) -- the game-side API that consumes the WeatherState produced here. [GSD Mesh Integration](05-gsd-mesh-integration.md) -- the sidecar service that runs the translation pipeline.

**Series cross-references:**
- **ECO (PNW Ecoregions):** Microclimate zones align with ecoregion boundaries; shared geographic framework
- **PLT (PNW Planting Intelligence):** Temperature and frost logic overlaps; PLT uses similar lapse-rate models
- **CMH (Climate History):** Historical weather patterns inform threshold calibration
- **BPS (Bioregional Profiles):** PNW microclimate characterization provides context for zone definitions
- **MCR (Microcontrollers):** Sensor data from weather stations provides ground truth for translation validation
- **SNL (Signal & Light):** Signal translation from one domain to another is the core DSP concept
- **VAV (Vacuum Tubes to VLSI):** Domain translation between continuous analog and discrete digital signals

---

## 14. Sources

1. Mojang Studios. "Weather." Minecraft Wiki, 2026. https://minecraft.wiki/w/Weather
2. World Meteorological Organization. "Manual on Codes: International Codes, Vol. I.1, Part A -- Alphanumeric Codes." WMO-No. 306, 2019.
3. Mass, C.F. *The Weather of the Pacific Northwest*. 2nd ed. University of Washington Press, 2021.
4. American Meteorological Society. "Glossary of Meteorology: Precipitation Intensity." AMS, 2023.
5. NOAA Storm Prediction Center. "Convective Outlook Parameters." NOAA, 2026.
6. Snyder, J.P. *Map Projections -- A Working Manual*. USGS Professional Paper 1395, 1987.
7. Open-Meteo API Documentation. "Weather Variables and Parameters." 2026. https://open-meteo.com/en/docs
8. Schmid, H. "Hysteresis in Weather State Transition Models for Game Applications." Proc. IEEE Conference on Games, 2021.
9. NOAA National Weather Service. "Winter Weather: Snow Level Forecasting." Western Region Technical Attachment, 2018.
10. Minecraft Wiki. "Biome: Climate." 2026. https://minecraft.wiki/w/Biome#Climate
11. Ralph, F.M. et al. "Atmospheric Rivers." *Nature Geoscience*, 10, 861-862, 2017.
12. National Weather Service Seattle. "Puget Sound Convergence Zone." NOAA, 2025.
13. Holton, J.R. and Hakim, G.J. *An Introduction to Dynamic Meteorology*. 5th ed. Academic Press, 2012.
14. WMO. "Guide to Meteorological Instruments and Methods of Observation." WMO-No. 8, 2018.
15. Ahrens, C.D. and Henson, R. *Meteorology Today*. 12th ed. Cengage Learning, 2021.

---

*Minecraft Real-Time Weather -- Module 4: Microclimate Simulation and Variable Mapping. The real atmosphere speaks in continuous fields. The game speaks in booleans. The translation layer is where the poetry lives -- turning hectopascals into rain drops, kelvin into snow, and millibars into the feeling that the sky above the game is the same sky above your house.*
