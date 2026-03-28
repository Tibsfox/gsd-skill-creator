# Minecraft Weather API and Mod Architecture

> **Domain:** Game Engine Internals and Modding Frameworks
> **Module:** 3 -- Minecraft Weather State Model, Fabric/Forge APIs, and External Bridge Architecture
> **Through-line:** *Minecraft's weather engine is the simplest possible implementation of a complex system: one boolean for rain, one boolean for thunder, and a timer. The entire world -- deserts, oceans, mountains, forests -- experiences the same weather simultaneously because the engine was never designed to care about geography. Building a real-weather bridge means understanding exactly what the engine can and cannot do, then designing a mod architecture that extends the possible without fighting the fundamental.*

---

## Table of Contents

1. [Vanilla Weather State Model](#1-vanilla-weather-state-model)
2. [The Rain/Snow Differentiation Problem](#2-the-rainsnow-differentiation-problem)
3. [Existing Weather Mods Survey](#3-existing-weather-mods-survey)
4. [Fabric Mod API for Weather Control](#4-fabric-mod-api-for-weather-control)
5. [Forge Mod API Comparison](#5-forge-mod-api-comparison)
6. [Per-Player Weather: The Packet Approach](#6-per-player-weather-the-packet-approach)
7. [Biome-Region Zone Architecture](#7-biome-region-zone-architecture)
8. [RCON Bridge: The Server-Side Approach](#8-rcon-bridge-the-server-side-approach)
9. [Plugin API Bridge: Spigot/Paper](#9-plugin-api-bridge-spigotpaper)
10. [Shader Integration for Enhanced Effects](#10-shader-integration-for-enhanced-effects)
11. [Performance Considerations](#11-performance-considerations)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. Vanilla Weather State Model

Minecraft's weather system operates at the `ServerWorld` level as a finite state machine with three states and timer-driven transitions [1]. Understanding this model precisely is necessary before designing any external bridge.

### Weather States

| State | Internal Name | Visual Effect | Duration |
|---|---|---|---|
| Clear | `CLEAR` | Normal sky, full sun/moon | Random: 12,000-180,000 ticks (10 min - 2.5 hours) |
| Rain | `RAIN` (downfall) | Rain particles, dark sky, wet blocks | Random: 12,000-24,000 ticks (10-20 min) |
| Thunder | `THUNDER` | Rain + lightning, very dark | Random: 3,600-15,600 ticks (3-13 min) |

### State Machine

```
MINECRAFT WEATHER STATE MACHINE
================================================================

                  +-- timer expires --+
                  |                    |
                  v                    |
            +---------+         +---------+
            |  CLEAR  |-------->|  RAIN   |
            +---------+  timer  +---------+
                  ^                |    |
                  |                |    | random escalation
                  |                |    v
                  |                | +---------+
                  +-- timer ------+-| THUNDER |
                                    +---------+

  All transitions are timer-driven with random durations.
  No geographic input. No external data.
  Entire dimension shares one state.
```

The critical limitation: **one weather state per dimension.** The Overworld, Nether, and End each have independent weather, but within the Overworld, every loaded chunk experiences the same rain/clear/thunder state. There is no native API for "rain in chunk A but clear in chunk B" [1].

### Server-Side Weather Control

The `/weather` command and `ServerWorld.setWeather()` method allow direct state manipulation:

```
/weather clear 1000000    -- force clear for ~14 hours
/weather rain 6000        -- force rain for 5 minutes
/weather thunder 6000     -- force thunder for 5 minutes
```

The integer argument is duration in ticks (20 ticks = 1 second). The sidecar can use these commands to control the global weather state. For per-region differentiation, additional mod-level intervention is required.

---

## 2. The Rain/Snow Differentiation Problem

Minecraft determines precipitation type (rain vs. snow) at the biome level, not at the weather state level. Each biome has a `temperature` property and a `precipitation` property [1]. Precipitation falls as snow if the biome temperature at the block's Y-level is below 0.15 (on Minecraft's internal scale), and as rain otherwise.

### Biome Temperature and Precipitation

| Biome Type | Temperature | Precipitation | Downfall Type |
|---|---|---|---|
| Plains | 0.8 | true | Rain |
| Forest | 0.7 | true | Rain |
| Taiga | 0.25 | true | Snow above Y=160 |
| Snowy Taiga | -0.5 | true | Snow |
| Desert | 2.0 | false | None |
| Jungle | 0.95 | true | Rain |
| Mountains (Windswept Hills) | 0.2 | true | Snow above ~Y=120 |
| Ice Spikes | 0.0 | true | Snow |
| Ocean | 0.5 | true | Rain |
| Swamp | 0.8 | true | Rain |

### Temperature Lapse Rate

Minecraft applies a lapse rate of approximately 0.0016 per Y-level above sea level (Y=64). A biome with base temperature 0.2 transitions from rain to snow at approximately Y=95 [1]. This creates the familiar snow-capped mountain effect.

For real-weather integration, the key insight is that Minecraft already has a rudimentary "snow level" concept built into its temperature model. The real-weather bridge can exploit this by manipulating biome temperature registries via mod APIs -- lowering a biome's effective temperature when the real-world snow level drops, causing rain to transition to snow at lower elevations.

> **SAFETY NOTE:** Modifying biome temperature registries affects game mechanics beyond weather: crop growth, mob spawning, and ice formation. The weather mod must either use non-destructive overrides (reverting to defaults when the real-weather system is disabled) or operate in a dedicated "weather layer" that does not affect gameplay mechanics.

---

## 3. Existing Weather Mods Survey

Six existing implementations were surveyed to understand the current state of real-weather modding and identify architectural gaps [2][3][4][5][6][7].

### Mod Comparison Matrix

| Mod/Plugin | Loader | Granularity | Data Source | Architecture | Limitations |
|---|---|---|---|---|---|
| WeatherSync | Fabric | Global/City | Open-Meteo | Server-side; `/weather` commands | Single location; no per-biome; global state only |
| Weather Watch | Forge | Global/IP | WeatherAPI (commercial) | Server IP geolocation; closed source | Commercial API key required; no per-biome |
| RealTimeWeather | Spigot | Global/World | Multiple providers | Per-world config; admin coordinates | Global per-world; no biome differentiation |
| Real Time+Weather | Spigot | Per-player/IP | Multiple providers | IP geolocation per player | Privacy concern (player IP); commercial APIs |
| Project Atmosphere | Forge | Regional (~1000 blocks) | Internal simulation | Full atmospheric sim; 40+ cloud types | Not real-world data; uses internal model |
| geobasedWeather | Spigot | Global/City | OpenWeatherMap | Simple city config | Commercial API; city-level only |

### Architectural Gap Analysis

No existing mod simultaneously provides:
1. Per-biome-region weather differentiation with...
2. Real atmospheric model data at...
3. Sub-city resolution without...
4. Commercial API dependencies

Project Atmosphere comes closest on simulation fidelity but uses an internal physics model rather than live data. WeatherSync comes closest on data sourcing (Open-Meteo, free) but applies weather globally with no spatial differentiation. The gap this mission fills is the intersection: live external data, per-region granularity, zero commercial dependencies [2][3].

---

## 4. Fabric Mod API for Weather Control

Fabric is the lightweight mod loader targeting Minecraft Java Edition. For weather control, the relevant APIs are in the `net.minecraft.server.world` and `net.minecraft.world.level` packages [8].

### Key API Surface

```
// ServerWorld weather control (Fabric Intermediary mappings)
ServerWorld world = server.getOverworld();

// Set weather state directly
world.setWeather(
    clearDuration,    // ticks of clear weather
    rainDuration,     // ticks of rain
    isRaining,        // boolean
    isThundering      // boolean
);

// Read current state
boolean raining = world.isRaining();
boolean thundering = world.isThundering();
float rainGradient = world.getRainGradient(tickDelta);
```

### Custom Weather Packets via Fabric Networking

For per-player weather differentiation, the mod must intercept and modify weather packets sent to specific clients:

```
// Fabric server-side networking for per-player weather
ServerPlayNetworking.send(
    player,
    new CustomWeatherPayload(
        zoneId,
        isRaining,
        isThundering,
        rainIntensity,
        fogDensity
    )
);
```

This requires a companion client-side mod that interprets the custom weather payload and overrides the local rendering state. Without the client mod, players see the global weather state.

### Fabric Events for Weather Hooks

```
// Listen for weather change events
ServerWorldEvents.LOAD.register((server, world) -> {
    // Register weather tick handler
    ServerTickEvents.END_WORLD_TICK.register(w -> {
        if (w.equals(world)) {
            checkExternalWeatherUpdate(w);
        }
    });
});
```

The weather check runs every server tick (50ms). To avoid performance impact, the actual external data fetch happens asynchronously on the sidecar; the tick handler only checks a local state cache.

---

## 5. Forge Mod API Comparison

Forge provides a more extensive but heavier API surface for weather modification [9]. The key difference: Forge's event system allows intercepting weather rendering at the client level without custom networking.

### Forge Weather Events

```
@SubscribeEvent
public void onRenderWeather(RenderLevelStageEvent event) {
    if (event.getStage() == Stage.AFTER_WEATHER) {
        // Custom weather rendering per chunk position
        // Can differentiate by player location
    }
}
```

### Fabric vs. Forge for This Mission

| Feature | Fabric | Forge |
|---|---|---|
| Server-side weather control | Via `ServerWorld.setWeather()` | Via `ServerLevel.setWeather()` |
| Per-player packets | Custom networking required | Custom networking required |
| Client-side rendering hooks | Limited; needs mixin | Direct event subscription |
| Shader integration | Via Iris/Sodium | Via Optifine/Oculus |
| Performance overhead | Minimal | Moderate |
| Mod compatibility | High (lightweight) | Variable (heavier) |

The reference architecture targets Fabric because it aligns with the mission's lightweight philosophy and the RCON-first approach (Section 8) minimizes the need for deep client-side hooks.

---

## 6. Per-Player Weather: The Packet Approach

True per-player weather requires intercepting Minecraft's weather packets and sending different data to different clients based on their geographic position in the game world.

### Minecraft Weather Packets

| Packet | Direction | Content |
|---|---|---|
| `GameStateChangeS2CPacket` (ID 0x1D) | Server -> Client | Weather state change (rain start/stop) |
| `GameStateChangeS2CPacket` (reason 7) | Server -> Client | Rain level (0.0-1.0 float) |
| `GameStateChangeS2CPacket` (reason 8) | Server -> Client | Thunder level (0.0-1.0 float) |

### Per-Player Override Architecture

```
PER-PLAYER WEATHER DISPATCH
================================================================

  [Sidecar pushes zone states]
        |
        v
  [Fabric mod receives zone update]
        |
        v
  FOR EACH ONLINE PLAYER:
    1. Get player chunk position (X, Z)
    2. Look up zone for chunk position
    3. Get weather state for that zone
    4. Compare with last-sent state for this player
    5. If changed:
       - Cancel global weather packet
       - Send per-player GameStateChange packets:
         * rain_start or rain_stop
         * rain_level = zone.intensity
         * thunder_level = zone.thunder ? 1.0 : 0.0
```

### Limitations

Per-player weather has inherent visual discontinuities. A player standing on the border between two weather zones will see an abrupt transition. Project Atmosphere addresses this with a 1000-block transition radius where weather parameters interpolate [6]. The reference architecture should implement a similar transition buffer:

```
effective_rain = lerp(
    zone_a.rain_level,
    zone_b.rain_level,
    smoothstep(distance_to_boundary / transition_radius)
)
```

---

## 7. Biome-Region Zone Architecture

The zone system maps Minecraft's world coordinates to real-world geographic regions. Each zone receives independent weather data from the sidecar.

### Zone Configuration Schema

```
# zone_config.yaml -- Foxy's Playground
zones:
  - id: pnw-coast
    display_name: "Pacific Coast"
    real_coords:
      latitude: 47.50
      longitude: -124.30
    mc_bounds:
      x_min: -8000
      x_max: -4000
      z_min: -8000
      z_max: 8000
    biomes: [beach, ocean, stony_shore]
    transition_radius: 500  # blocks

  - id: puget-sound
    display_name: "Puget Sound Lowlands"
    real_coords:
      latitude: 47.60
      longitude: -122.33
    mc_bounds:
      x_min: -4000
      x_max: 0
      z_min: -8000
      z_max: 8000
    biomes: [plains, forest, swamp]
    transition_radius: 500

  - id: cascade-foothills
    display_name: "Cascade Foothills"
    real_coords:
      latitude: 47.50
      longitude: -121.50
    mc_bounds:
      x_min: 0
      x_max: 4000
      z_min: -8000
      z_max: 8000
    biomes: [forest, dark_forest, old_growth_spruce_taiga]
    transition_radius: 500

  - id: cascade-crest
    display_name: "Cascade Crest"
    real_coords:
      latitude: 47.45
      longitude: -121.10
    mc_bounds:
      x_min: 4000
      x_max: 8000
      z_min: -8000
      z_max: 8000
    biomes: [snowy_taiga, windswept_hills, frozen_peaks]
    transition_radius: 500
```

### Zone Lookup Algorithm

For a player at chunk coordinates (cx, cz), the zone lookup is a simple bounding-box test with O(n) complexity where n is the number of zones (typically 4-8). With transition radius consideration:

```
def get_weather_for_position(x, z, zones):
    primary_zone = None
    for zone in zones:
        if zone.contains(x, z):
            primary_zone = zone
            break

    if primary_zone is None:
        return default_weather  # outside all zones

    # Check if near boundary
    neighbors = find_adjacent_zones(x, z, zones, primary_zone)
    if not neighbors:
        return primary_zone.weather

    # Interpolate with nearest neighbor
    nearest = neighbors[0]
    dist = distance_to_boundary(x, z, primary_zone, nearest)
    t = smoothstep(dist / primary_zone.transition_radius)
    return interpolate_weather(primary_zone.weather, nearest.weather, t)
```

---

## 8. RCON Bridge: The Server-Side Approach

RCON (Remote Console) is Minecraft's built-in server administration protocol, available on both vanilla and modded servers [10]. For the weather sidecar, RCON provides the simplest integration path: no mod required on the server, no client-side changes.

### RCON Protocol

| Parameter | Value |
|---|---|
| Default port | 25575 |
| Protocol | TCP with length-prefixed packets |
| Authentication | Single password (plaintext over TCP) |
| Max payload | 4096 bytes |
| Latency | <10ms on localhost |

### RCON Weather Commands

```
# Python RCON client (mcrcon library)
from mcrcon import MCRcon

with MCRcon("localhost", "rcon_password", port=25575) as mcr:
    # Set weather state
    mcr.command("/weather rain 18000")    # rain for 15 minutes
    mcr.command("/weather clear 18000")   # clear for 15 minutes
    mcr.command("/weather thunder 6000")  # thunder for 5 minutes

    # Set time (for day/night sync if desired)
    mcr.command("/time set 6000")
```

### Limitations of RCON-Only Approach

- **Global only:** `/weather` commands set the entire dimension's weather state. No per-biome or per-player differentiation.
- **Binary states:** Rain is on or off; there is no native intensity control via RCON.
- **No fog control:** Fog is not a native weather state; requires shader or mod intervention.
- **Security:** RCON sends passwords in plaintext. The sidecar must connect only on localhost [10].

> **SAFETY NOTE:** RCON must be bound to localhost (127.0.0.1) only. Exposing RCON to the network allows any attacker with the password to execute arbitrary server commands. The `server.properties` configuration must set `rcon.port=25575` and ensure the server's firewall blocks external access to this port.

### When RCON Is Sufficient

For a server running a single weather zone (one real-world location mapped to the entire world), RCON provides complete functionality with zero mod dependencies. The sidecar queries Open-Meteo, translates to a rain/clear/thunder state, and sends the appropriate `/weather` command. This is the minimum viable product.

---

## 9. Plugin API Bridge: Spigot/Paper

For servers running Spigot or Paper (the most common Minecraft server implementations for plugins), the Bukkit API provides weather control and player-specific effects [11].

### Bukkit Weather API

```
// Java plugin -- weather control
World world = Bukkit.getWorld("world");
world.setStorm(true);                    // enable rain
world.setThundering(true);               // enable thunder
world.setWeatherDuration(18000);          // 15 minutes in ticks

// Per-player weather (Paper API)
player.setPlayerWeather(WeatherType.DOWNFALL);
player.setPlayerWeather(WeatherType.CLEAR);
player.resetPlayerWeather();  // return to server weather
```

Paper's `setPlayerWeather()` is the simplest path to per-player weather differentiation: no custom networking, no client mod. The server tells each client what weather to render based on the player's location in a weather zone. The limitation is that it is still binary (rain or clear) with no intensity control.

---

## 10. Shader Integration for Enhanced Effects

Vanilla Minecraft's weather rendering is limited: rain particles, darkened sky, and occasional lightning. For a convincing real-weather experience, shader integration provides fog, variable cloud cover, intensity-dependent particle density, and atmospheric scattering.

### Iris/Sodium Shader Pipeline (Fabric)

| Effect | Shader Capability | Uniform/Variable |
|---|---|---|
| Fog density | Custom fog falloff curve | `fogDensity` float |
| Sky color | Tint based on cloud cover | `cloudCover` float |
| Rain intensity | Particle density multiplier | `rainIntensity` float |
| Wind direction | Particle drift angle | `windDirection` vec2 |
| Lightning flash | Brightness spike | `lightningFlash` float |
| Snow vs. rain | Particle texture swap | `precipType` int |

### Custom Shader Uniform Pipeline

The Fabric mod can inject custom uniforms into the shader pipeline via Iris's API:

```
// Register custom weather uniforms
IrisShaderAPI.registerUniform("mrw_cloudCover", () -> {
    return currentZoneWeather.cloudCover / 100.0f;
});

IrisShaderAPI.registerUniform("mrw_fogDensity", () -> {
    return currentZoneWeather.visibility < 2000 ? 0.8f : 0.0f;
});

IrisShaderAPI.registerUniform("mrw_rainIntensity", () -> {
    return currentZoneWeather.precipIntensity;
});
```

Shader pack authors can then use these uniforms to create weather-responsive visual effects. This is the path to representing the full range of real-weather conditions -- from light coastal fog to heavy Cascade snowfall -- in a visually convincing way.

---

## 11. Performance Considerations

### Server-Side Impact

| Operation | Frequency | Cost | Mitigation |
|---|---|---|---|
| Zone lookup per player | Every 5 seconds | O(n) zones, <1ms | Cache last zone per player |
| Weather state comparison | Every 15 minutes | O(1) per zone | Only push on state change |
| RCON command dispatch | On state change | <10ms per command | Batch commands |
| Custom packet dispatch | On state change per player | ~1KB per packet | Send only diffs |

### Client-Side Impact

| Effect | FPS Impact | Mitigation |
|---|---|---|
| Standard rain particles | -5 to -15 FPS | Vanilla; unavoidable |
| Custom shader fog | -2 to -5 FPS | Optimize fog shader; LOD |
| Increased particle density | -5 to -20 FPS | Cap at vanilla maximum |
| Per-player packet processing | Negligible | <1 packet per minute |

### Memory Footprint

The weather zone system adds approximately 2-5 MB of server memory for zone configurations, cached weather states, and per-player state tracking. This is negligible compared to Minecraft's baseline server memory usage of 2-8 GB.

---

## 12. Cross-References

> **Related:** [Global Weather Data Sources](01-global-weather-data-sources.md) -- the API data that feeds the weather states this module applies. [Microclimate Simulation](04-microclimate-simulation.md) -- the translation logic that converts raw weather data into the Minecraft states documented here. [GSD Mesh Integration](05-gsd-mesh-integration.md) -- the sidecar that pushes weather updates to the Minecraft server.

**Series cross-references:**
- **MCR (Microcontrollers):** Embedded Java development patterns; resource-constrained optimization
- **VAV (Vacuum Tubes to VLSI):** Client-server packet architecture; protocol design
- **ECO (PNW Ecoregions):** Biome mapping directly corresponds to ecoregion boundaries
- **PLT (PNW Planting Intelligence):** Biome temperature registries affect crop growth; shared concern
- **SPA (Space Systems):** Client-server communication protocols parallel satellite command/telemetry

---

## 13. Sources

1. Mojang Studios. "Minecraft Java Edition: Weather." Minecraft Wiki, 2026. https://minecraft.wiki/w/Weather
2. Modrinth. "WeatherSync -- Real-Time Weather Sync for Minecraft." 2026. https://modrinth.com/mod/weathersync
3. CurseForge. "Project Atmosphere." 2026. https://www.curseforge.com/minecraft/mc-mods/project-atmosphere
4. SpigotMC. "RealWeather / RealTime Plugin." 2025. https://www.spigotmc.org/resources/realweather-realtime.101599/
5. CurseForge. "Weather Watch." 2025. https://www.curseforge.com/minecraft/mc-mods/weather-watch
6. SpigotMC. "Real Time + Weather." 2024. https://www.spigotmc.org/resources/real-time-weather.93764/
7. SpigotMC. "geobasedWeather." 2024. https://www.spigotmc.org/resources/geobasedweather.114527/
8. FabricMC. "Fabric API Reference: Server World." 2026. https://fabricmc.net/wiki/
9. MinecraftForge. "Event System Documentation." 2026. https://docs.minecraftforge.net/
10. Mojang Studios. "RCON Protocol Specification." Minecraft Wiki, 2026. https://minecraft.wiki/w/RCON
11. SpigotMC. "Bukkit API: World Weather Methods." 2026. https://hub.spigotmc.org/javadocs/bukkit/
12. Iris Shaders. "Custom Uniform API Documentation." GitHub, 2026. https://github.com/IrisShaders/Iris
13. PaperMC. "Player API: Weather Control." 2026. https://jd.papermc.io/paper/
14. Mojang Studios. "Biome Precipitation and Temperature." Minecraft Wiki, 2026. https://minecraft.wiki/w/Biome
15. Fabric Networking API. "ServerPlayNetworking Documentation." FabricMC, 2026.

---

*Minecraft Real-Time Weather -- Module 3: Minecraft Weather API and Mod Architecture. The game engine thinks weather is a coin flip. The mod architecture turns it into a conversation with the real atmosphere.*
