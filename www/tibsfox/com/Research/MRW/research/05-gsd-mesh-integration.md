# GSD Mesh Integration and Deployment Architecture

> **Domain:** Distributed Systems and Service Architecture
> **Module:** 5 -- Sidecar Service, Mesh Node Deployment, and Foxy's Playground Configuration
> **Through-line:** *The Amiga didn't try to do everything on one chip. Agnus handled DMA. Denise handled display. Paula handled I/O. The 68000 did synthesis. The weather sidecar follows the same principle: a lightweight Python service that runs alongside the Minecraft server, fetching data it didn't generate, translating it with logic it owns, and pushing state changes through a bridge it controls. Specialized execution paths, faithfully iterated.*

---

## Table of Contents

1. [The Sidecar Pattern](#1-the-sidecar-pattern)
2. [Python Service Architecture](#2-python-service-architecture)
3. [The Data Broker: Fetch, Normalize, Cache, Push](#3-the-data-broker-fetch-normalize-cache-push)
4. [Cache Design and TTL Management](#4-cache-design-and-ttl-management)
5. [RCON Bridge Implementation](#5-rcon-bridge-implementation)
6. [Fabric Mod Bridge Protocol](#6-fabric-mod-bridge-protocol)
7. [Configuration Schema](#7-configuration-schema)
8. [Deployment on GSD Mesh Nodes](#8-deployment-on-gsd-mesh-nodes)
9. [Foxy's Playground: Reference Deployment](#9-foxys-playground-reference-deployment)
10. [Monitoring, Logging, and Alerting](#10-monitoring-logging-and-alerting)
11. [Security Considerations](#11-security-considerations)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. The Sidecar Pattern

The sidecar pattern places a secondary service alongside a primary service, sharing the same host but running as an independent process [1]. For the Minecraft weather system, the sidecar model is ideal because:

1. **No server modification required.** The sidecar communicates via RCON (built into vanilla Minecraft) or a lightweight Fabric mod. The Minecraft server binary is untouched.
2. **Independent lifecycle.** The sidecar can be restarted, updated, or paused without affecting the Minecraft server.
3. **Language-appropriate.** Weather data processing (HTTP clients, JSON parsing, GRIB2 decoding) is natural in Python. Minecraft server mods are Java. The sidecar lets each component use its best language.
4. **Resource isolation.** The sidecar has its own memory footprint, CPU allocation, and failure domain.

```
SIDECAR ARCHITECTURE
================================================================

  +----------------------------------------------------+
  |  GSD Mesh Node (single host)                       |
  |                                                     |
  |  +-------------------+    +---------------------+  |
  |  | Minecraft Server  |    | Weather Sidecar     |  |
  |  | (Java, 4-8 GB)    |    | (Python, <200 MB)   |  |
  |  |                   |    |                     |  |
  |  | - World engine    |    | - Fetch scheduler   |  |
  |  | - Player mgmt     |    | - API clients       |  |
  |  | - Chunk loading   |    | - Data normalizer   |  |
  |  | - Game logic      |    | - Translation layer |  |
  |  |                   |    | - Cache manager     |  |
  |  | RCON port: 25575  |<---| - RCON bridge       |  |
  |  +-------------------+    +---------------------+  |
  |        |                         |                  |
  |        v                         v                  |
  |   Players (TCP 25565)    APIs (HTTPS outbound)     |
  +----------------------------------------------------+
```

---

## 2. Python Service Architecture

The sidecar is a single Python process with an async event loop (asyncio). Total target: less than 200 MB resident memory, less than 5% CPU utilization on a modern x86-64 host during normal operation.

### Module Structure

```
weather-sidecar/
  main.py                    # Entry point; scheduler
  config.py                  # YAML config loader
  sources/
    open_meteo.py            # Open-Meteo API client
    hrrr.py                  # NOAA HRRR GRIB2 fetcher
    geos5.py                 # NASA GEOS-5 client
    satellite.py             # GOES-19 derived data reader
  translate/
    wmo_to_mc.py             # WMO code translation
    variable_mapper.py       # Full variable mapping
    snow_level.py            # Snow level determination
    transition.py            # State transition smoothing
  broker/
    data_broker.py           # Source orchestration + fallback
    cache.py                 # WeatherState cache with TTL
  bridge/
    rcon_bridge.py           # RCON command dispatch
    fabric_bridge.py         # HTTP/WebSocket to Fabric mod
  monitor/
    health.py                # Health check endpoint
    metrics.py               # Request counters, latency
  schemas/
    weather_state.json       # JSON schema for WeatherState
    zone_config.json         # JSON schema for zone config
  tests/
    test_open_meteo.py
    test_translation.py
    test_broker.py
    test_bridge.py
    fixtures/
      mock_open_meteo.json
      mock_hrrr_response.json
```

### Dependencies

| Package | Version | Purpose |
|---|---|---|
| `aiohttp` | 3.9+ | Async HTTP client for API calls |
| `herbie-data` | 2024.x | HRRR GRIB2 access |
| `xarray` | 2024.x | GRIB2 grid data manipulation |
| `pyyaml` | 6.0+ | Configuration file parsing |
| `mcrcon` | 0.7+ | Minecraft RCON client |
| `jsonschema` | 4.x | WeatherState schema validation |
| `structlog` | 24.x | Structured logging |
| `prometheus-client` | 0.20+ | Metrics exposition (optional) |

### Memory Budget

| Component | Estimated RSS |
|---|---|
| Python interpreter | 30 MB |
| aiohttp + event loop | 15 MB |
| herbie + xarray (loaded) | 80 MB |
| WeatherState cache (8 zones) | 1 MB |
| Zone configurations | 1 MB |
| Logging buffers | 5 MB |
| **Total** | **~132 MB** |

The herbie/xarray stack is the largest single component due to GRIB2 decoding dependencies. If HRRR direct access is not needed (Open-Meteo provides HRRR data indirectly), these dependencies can be dropped, reducing the footprint to approximately 55 MB.

---

## 3. The Data Broker: Fetch, Normalize, Cache, Push

The data broker is the central orchestration component. It manages the complete pipeline from API request to Minecraft command.

### Pipeline Execution Flow

```
DATA BROKER PIPELINE -- SINGLE CYCLE
================================================================

  [Scheduler triggers: every 15 minutes]
        |
        v
  FOR EACH ZONE IN CONFIG:
    |
    +-- 1. CHECK CACHE
    |   Is there a valid (non-expired) WeatherState?
    |   YES: skip fetch, proceed to step 5
    |   NO: continue to step 2
    |
    +-- 2. FETCH (async, with fallback)
    |   Primary: Open-Meteo (timeout 10s)
    |   Fallback 1: HRRR direct (timeout 30s)
    |   Fallback 2: GFS via Open-Meteo historical (timeout 10s)
    |   All fail: serve stale cache + log warning
    |
    +-- 3. NORMALIZE
    |   Convert API response to raw fields
    |   Validate against WeatherState schema
    |   Reject invalid responses (serve stale)
    |
    +-- 4. TRANSLATE
    |   wmo_to_mc() -- primary state determination
    |   snow_level() -- rain/snow threshold
    |   cloud_cover_threshold() -- sky state
    |   wind_escalation() -- storm check
    |   fog_check() -- visibility
    |   Apply hysteresis and transition smoothing
    |
    +-- 5. CACHE
    |   Store WeatherState with TTL
    |   Compute state hash for change detection
    |
    +-- 6. COMPARE
    |   Has mc_state changed since last push?
    |   NO: no action (avoid command spam)
    |   YES: continue to step 7
    |
    +-- 7. PUSH
        RCON: /weather <state> <duration>
        Fabric: HTTP POST to mod endpoint
        Log state transition
```

### Async Implementation

```
import asyncio
import aiohttp
from broker.cache import WeatherCache
from sources.open_meteo import OpenMeteoClient
from translate.variable_mapper import translate_to_mc
from bridge.rcon_bridge import RconBridge

class DataBroker:
    def __init__(self, config):
        self.config = config
        self.cache = WeatherCache(default_ttl=900)
        self.open_meteo = OpenMeteoClient()
        self.bridge = RconBridge(config.rcon)

    async def run_cycle(self):
        """Execute one fetch-translate-push cycle for all zones."""
        async with aiohttp.ClientSession() as session:
            tasks = [
                self.process_zone(session, zone)
                for zone in self.config.zones
            ]
            results = await asyncio.gather(*tasks, return_exceptions=True)

        for zone, result in zip(self.config.zones, results):
            if isinstance(result, Exception):
                log.error("zone_failed", zone=zone.id, error=str(result))

    async def process_zone(self, session, zone):
        """Fetch, translate, cache, and push for one zone."""
        # Check cache
        cached = self.cache.get(zone.id)
        if cached and not cached.expired:
            return cached

        # Fetch with fallback
        raw = await self.fetch_with_fallback(session, zone)
        if raw is None:
            return self.cache.get_stale(zone.id)

        # Translate
        weather_state = translate_to_mc(raw, zone)

        # Cache
        self.cache.put(zone.id, weather_state)

        # Push if changed
        if self.state_changed(zone.id, weather_state):
            await self.bridge.push(zone.id, weather_state)

        return weather_state
```

---

## 4. Cache Design and TTL Management

The cache serves three purposes: rate limit compliance (avoiding redundant API calls), fault tolerance (serving stale data when fetches fail), and change detection (suppressing duplicate pushes).

### Cache Strategy

| Parameter | Value | Rationale |
|---|---|---|
| Default TTL | 900 seconds (15 min) | Matches fetch cycle |
| Stale TTL | 3600 seconds (1 hour) | Maximum age for stale data |
| Max entries per zone | 2 (current + previous) | Change detection requires comparison |
| Storage | In-memory dict | Simple; no external dependency |
| Persistence | JSON file on disk | Survives sidecar restart |

### Cache Implementation

```
import time
import json
from pathlib import Path

class WeatherCache:
    def __init__(self, default_ttl=900, stale_ttl=3600,
                 persist_path="/var/lib/weather/cache.json"):
        self.ttl = default_ttl
        self.stale_ttl = stale_ttl
        self.store = {}
        self.persist_path = Path(persist_path)
        self._load_persisted()

    def get(self, zone_id):
        entry = self.store.get(zone_id)
        if entry and (time.time() - entry["timestamp"]) < self.ttl:
            return entry["state"]
        return None

    def get_stale(self, zone_id):
        entry = self.store.get(zone_id)
        if entry and (time.time() - entry["timestamp"]) < self.stale_ttl:
            return entry["state"]
        return None  # truly expired; no data available

    def put(self, zone_id, state):
        self.store[zone_id] = {
            "state": state,
            "timestamp": time.time()
        }
        self._persist()

    def _persist(self):
        self.persist_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.persist_path, 'w') as f:
            json.dump(self.store, f)

    def _load_persisted(self):
        if self.persist_path.exists():
            with open(self.persist_path) as f:
                self.store = json.load(f)
```

---

## 5. RCON Bridge Implementation

The RCON bridge translates WeatherState objects into Minecraft `/weather` commands.

### Implementation

```
from mcrcon import MCRcon
import structlog

log = structlog.get_logger()

class RconBridge:
    def __init__(self, config):
        self.host = config.get("host", "127.0.0.1")
        self.port = config.get("port", 25575)
        self.password = config.get("password")

    async def push(self, zone_id, weather_state):
        """Push weather state to Minecraft via RCON."""
        mc = weather_state["mc_state"]
        duration_ticks = weather_state["ttl_seconds"] * 20  # 20 ticks/sec

        try:
            with MCRcon(self.host, self.password, port=self.port) as mcr:
                if mc["weather"] == "thunder":
                    resp = mcr.command(f"/weather thunder {duration_ticks}")
                elif mc["weather"] == "rain":
                    resp = mcr.command(f"/weather rain {duration_ticks}")
                else:
                    resp = mcr.command(f"/weather clear {duration_ticks}")

                log.info("rcon_push",
                    zone=zone_id,
                    weather=mc["weather"],
                    duration_ticks=duration_ticks,
                    response=resp)

        except Exception as e:
            log.error("rcon_failed", zone=zone_id, error=str(e))
            raise
```

### RCON Limitations and the Mod Bridge

RCON only supports global weather state (the entire dimension). For per-zone weather, the Fabric mod bridge (Section 6) is required. The architecture supports both: RCON for single-zone deployments, mod bridge for multi-zone deployments.

> **SAFETY NOTE:** The RCON password is stored in the sidecar configuration file. This file must have restrictive permissions (chmod 600, owned by the service user). The password must not be committed to version control.

---

## 6. Fabric Mod Bridge Protocol

For multi-zone weather, the sidecar communicates with a companion Fabric mod via a local HTTP endpoint.

### Protocol

| Endpoint | Method | Body | Response |
|---|---|---|---|
| `POST /weather/zone/{id}` | POST | WeatherState JSON | 200 OK or error |
| `GET /weather/zones` | GET | None | All zone states |
| `GET /health` | GET | None | 200 OK + status |

### Fabric Mod HTTP Server

The Fabric mod embeds a lightweight HTTP server (e.g., Javalin or a custom Netty handler) listening on localhost:

```
// Fabric mod -- weather API endpoint
@Override
public void onInitializeServer() {
    HttpServer server = HttpServer.create(
        new InetSocketAddress("127.0.0.1", 8765), 0
    );

    server.createContext("/weather/zone/", exchange -> {
        String zoneId = exchange.getRequestURI().getPath()
            .replace("/weather/zone/", "");
        String body = new String(
            exchange.getRequestBody().readAllBytes()
        );
        WeatherState state = parseWeatherState(body);
        applyZoneWeather(zoneId, state);
        exchange.sendResponseHeaders(200, 0);
        exchange.close();
    });

    server.start();
    LOGGER.info("Weather bridge listening on 127.0.0.1:8765");
}
```

### Security

The mod HTTP server binds to 127.0.0.1 only. No authentication is needed because only the local sidecar process can connect. The Fabric mod validates incoming WeatherState against the JSON schema before applying changes.

---

## 7. Configuration Schema

The sidecar is configured via a single YAML file.

### Full Configuration Schema

```
# weather-sidecar-config.yaml
service:
  name: "mrw-weather-sidecar"
  version: "1.0.0"
  log_level: "info"
  fetch_interval_seconds: 900
  cache_ttl_seconds: 900
  stale_ttl_seconds: 3600

sources:
  primary: "open-meteo"
  fallback:
    - "hrrr-direct"
    - "gfs"
  open_meteo:
    endpoint: "https://api.open-meteo.com/v1/forecast"
    daily_request_limit: 9000
    timeout_seconds: 10
  hrrr:
    enabled: true
    aws_bucket: "noaa-hrrr-bdp-pds"
    timeout_seconds: 30
  geos5:
    enabled: false  # supplementary only
    endpoint: "https://fluid.nccs.nasa.gov/cfapi/"
  satellite:
    enabled: false
    data_path: "/data/weather/satellite/latest.json"

bridge:
  type: "rcon"  # or "fabric-http"
  rcon:
    host: "127.0.0.1"
    port: 25575
    password: "${RCON_PASSWORD}"  # env var substitution
  fabric_http:
    host: "127.0.0.1"
    port: 8765

zones:
  - id: "pnw-coast"
    display_name: "Pacific Coast"
    latitude: 47.50
    longitude: -124.30
    elevation_m: 30
    mc_bounds:
      x_min: -8000
      x_max: -4000
      z_min: -8000
      z_max: 8000
    transition_radius: 500

  - id: "puget-sound"
    display_name: "Puget Sound Lowlands"
    latitude: 47.60
    longitude: -122.33
    elevation_m: 60
    mc_bounds:
      x_min: -4000
      x_max: 0
      z_min: -8000
      z_max: 8000
    transition_radius: 500

  - id: "cascade-foothills"
    display_name: "Cascade Foothills"
    latitude: 47.50
    longitude: -121.50
    elevation_m: 450
    mc_bounds:
      x_min: 0
      x_max: 4000
      z_min: -8000
      z_max: 8000
    transition_radius: 500

  - id: "cascade-crest"
    display_name: "Cascade Crest"
    latitude: 47.45
    longitude: -121.10
    elevation_m: 1500
    mc_bounds:
      x_min: 4000
      x_max: 8000
      z_min: -8000
      z_max: 8000
    transition_radius: 500

translation:
  cloud_cover_rain_threshold: 85
  cloud_cover_clear_threshold: 70
  thunder_enter_probability: 40
  thunder_exit_probability: 20
  fog_enter_visibility_m: 1000
  fog_exit_visibility_m: 2000
  wind_storm_threshold_kmh: 60
  wind_calm_threshold_kmh: 40
  transition_duration_ticks: 1200  # 1 minute ramp
  min_state_duration_seconds: 120

coordinate_mapping:
  lat_origin: 47.5
  lon_origin: -122.0
  scale_factor: 100
```

### Environment Variable Substitution

The sidecar supports `${VAR}` syntax for sensitive values like RCON passwords. The config loader substitutes environment variables at parse time, ensuring secrets are never written to disk in the config file.

---

## 8. Deployment on GSD Mesh Nodes

The weather sidecar is designed to run on the same GSD mesh node that hosts the Minecraft server. The Amiga-principle architecture assigns specialized roles to lightweight services running alongside the game server [2].

### Systemd Service Unit

```
# /etc/systemd/system/mrw-weather-sidecar.service
[Unit]
Description=MRW Weather Sidecar for Minecraft
After=network.target minecraft.service
Requires=minecraft.service

[Service]
Type=simple
User=minecraft
Group=minecraft
WorkingDirectory=/opt/weather-sidecar
ExecStart=/opt/weather-sidecar/venv/bin/python main.py \
  --config /etc/weather/config.yaml
Restart=on-failure
RestartSec=30
MemoryMax=256M
CPUQuota=10%

# Security hardening
NoNewPrivileges=true
ProtectSystem=strict
ReadWritePaths=/var/lib/weather /var/log/weather
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

### Resource Limits

| Resource | Limit | Rationale |
|---|---|---|
| Memory | 256 MB (hard limit) | 200 MB target + 28% headroom |
| CPU | 10% of one core | API polling is I/O-bound, not CPU-bound |
| Disk (cache) | 100 MB | Cache + logs |
| Network (outbound) | Unrestricted | API fetches are lightweight |
| Network (inbound) | Localhost only | RCON and mod bridge are local |

### Installation Script

```
#!/bin/bash
# install-weather-sidecar.sh

# Create service user and directories
sudo useradd -r -s /bin/nologin minecraft 2>/dev/null || true
sudo mkdir -p /opt/weather-sidecar /etc/weather /var/lib/weather /var/log/weather
sudo chown minecraft:minecraft /opt/weather-sidecar /var/lib/weather /var/log/weather

# Create Python virtual environment
cd /opt/weather-sidecar
python3 -m venv venv
./venv/bin/pip install aiohttp pyyaml mcrcon jsonschema structlog

# Optional: HRRR support (adds ~80 MB)
# ./venv/bin/pip install herbie-data xarray cfgrib

# Copy configuration template
sudo cp config.template.yaml /etc/weather/config.yaml
sudo chmod 600 /etc/weather/config.yaml
sudo chown minecraft:minecraft /etc/weather/config.yaml

# Install systemd service
sudo cp mrw-weather-sidecar.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable mrw-weather-sidecar
```

---

## 9. Foxy's Playground: Reference Deployment

Foxy's Playground is the primary deployment target for v1.0 of the weather sidecar. It is a Minecraft Java Edition server running in the Pacific Northwest, operated as part of the GSD mesh infrastructure.

### Deployment Specification

| Parameter | Value |
|---|---|
| Server type | Minecraft Java Edition (Fabric) |
| Version | 1.21.x |
| Location | Pacific Northwest, USA |
| Weather zones | 4 (Coast, Puget Sound, Foothills, Crest) |
| Update interval | 15 minutes |
| Bridge type | Fabric mod (multi-zone) |
| GOES-19 station | Optional (future enhancement) |
| Expected players | 2-20 concurrent |

### PNW Zone Map

```
FOXY'S PLAYGROUND -- WEATHER ZONE MAP
================================================================

  MC X:  -8000      -4000        0        +4000      +8000
         |           |           |           |           |
         v           v           v           v           v

  +----------+  +----------+  +----------+  +----------+
  |   COAST  |  |  PUGET   |  |  FOOT-   |  | CASCADE  |
  |          |  |  SOUND   |  |  HILLS   |  |  CREST   |
  | 47.5, -  |  | 47.6, -  |  | 47.5, -  |  | 47.45, - |
  | 124.3    |  | 122.3    |  | 121.5    |  | 121.1    |
  |          |  |          |  |          |  |          |
  | Fog,     |  | Rain,    |  | Rain to  |  | Snow,    |
  | drizzle, |  | overcast,|  | snow     |  | high     |
  | mild     |  | moderate |  | gradient |  | winds    |
  +----------+  +----------+  +----------+  +----------+

  Real-world transect: ~200 km coast to crest
  MC world transect: 16,000 blocks
  Scale: 1 chunk (16 blocks) ~ 0.2 km
```

### Expected Behavior

During a typical PNW winter storm with a snow level at 800 meters:

| Zone | Real Conditions | MC Weather |
|---|---|---|
| Coast | 8 C, drizzle, fog, visibility 800m | Rain (low intensity) + fog effect |
| Puget Sound | 5 C, moderate rain, overcast | Rain (moderate intensity) |
| Foothills | 2 C, heavy rain/snow mix | Rain transitioning to snow above Y=128 |
| Cascade Crest | -3 C, heavy snow, 40 km/h winds | Snow (high intensity), dark sky |

Four zones, four different weather conditions, all derived from the same weather front passing through at different elevations and geographic contexts. This is the core value proposition.

---

## 10. Monitoring, Logging, and Alerting

### Health Check Endpoint

The sidecar exposes a health check endpoint at `http://127.0.0.1:8766/health`:

```
{
  "status": "healthy",
  "uptime_seconds": 86400,
  "last_fetch_cycle": "2026-03-26T12:15:00Z",
  "zones": {
    "pnw-coast": {"last_update": "...", "source": "open-meteo", "stale": false},
    "puget-sound": {"last_update": "...", "source": "open-meteo", "stale": false},
    "cascade-foothills": {"last_update": "...", "source": "hrrr", "stale": false},
    "cascade-crest": {"last_update": "...", "source": "open-meteo", "stale": false}
  },
  "api_requests_today": 384,
  "api_request_limit": 9000,
  "errors_last_hour": 0
}
```

### Structured Logging

All log entries are structured JSON for machine parsing:

```
{
  "timestamp": "2026-03-26T12:15:01Z",
  "level": "info",
  "event": "fetch_cycle_complete",
  "zones_updated": 4,
  "zones_stale": 0,
  "zones_failed": 0,
  "duration_ms": 1250,
  "primary_source": "open-meteo",
  "fallback_used": false
}
```

### Alert Conditions

| Condition | Severity | Action |
|---|---|---|
| All zones serving stale data | Warning | Log; operator notification |
| API request count > 80% of daily limit | Warning | Log; reduce fetch frequency |
| RCON connection failed | Error | Retry with backoff; log |
| No successful fetch in 2 hours | Critical | Alert operator |
| Sidecar memory > 200 MB | Warning | Log; investigate leak |

---

## 11. Security Considerations

### Threat Model

| Threat | Mitigation | Priority |
|---|---|---|
| RCON password exposure | Environment variables; file permissions (600) | Critical |
| RCON port exposed to network | Bind to 127.0.0.1 only; firewall | Critical |
| Mod bridge port exposed | Bind to 127.0.0.1 only; firewall | Critical |
| API response injection | Schema validation; HTTPS only | High |
| Player IP geolocation | Admin-configured coordinates; no IP lookup | High |
| Stale data served indefinitely | Hard TTL of 1 hour; alert on staleness | Medium |
| Denial of service via API exhaustion | Local rate counter; hard stop at 9000/day | Medium |

### Player Privacy

> **SAFETY NOTE:** The sidecar NEVER queries player IP addresses, geolocates players, or uses any player-specific data. All geographic coordinates are administrator-configured in the zone config file. Per-player weather is based on the player's in-game chunk position relative to configured zone boundaries, not on any real-world location data. This is a non-negotiable design constraint.

### Configuration File Security

The config file (`/etc/weather/config.yaml`) contains the RCON password and must be:
- Owned by the service user (minecraft:minecraft)
- Permissions: 600 (read/write for owner only)
- Not committed to version control
- Referenced via template in the repository (with placeholder values)

---

## 12. Cross-References

> **Related:** [Global Weather Data Sources](01-global-weather-data-sources.md) -- the APIs the sidecar fetches from. [Minecraft Weather API](03-minecraft-weather-api.md) -- the game-side integration that receives the sidecar's output. [Microclimate Simulation](04-microclimate-simulation.md) -- the translation logic the sidecar executes.

**Series cross-references:**
- **MCR (Microcontrollers):** Sidecar pattern parallels embedded co-processor architecture
- **SPA (Space Systems):** Mission control and telemetry patterns apply to sidecar monitoring
- **BPS (Bioregional Profiles):** Zone configuration maps to bioregional boundaries
- **ECO (PNW Ecoregions):** The 4-zone PNW deployment maps to ecoregion transects
- **CMH (Climate History):** Historical data calibrates translation thresholds
- **SNL (Signal & Light):** The Amiga chip analogy: Agnus fetches, Denise renders, Paula bridges
- **VAV (Vacuum Tubes to VLSI):** Sidecar pattern as co-processor architecture in software

---

## 13. Sources

1. Burns, B. "Designing Distributed Systems: Patterns and Paradigms for Scalable, Reliable Services." O'Reilly Media, 2018.
2. GSD Skill-Creator. "Amiga Principle: Specialized Execution Paths." Internal Architecture Document, 2025.
3. Python Software Foundation. "asyncio -- Asynchronous I/O." Python 3.12 Documentation, 2026.
4. Mojang Studios. "RCON Protocol." Minecraft Wiki, 2026. https://minecraft.wiki/w/RCON
5. FabricMC. "Fabric API: Networking." 2026. https://fabricmc.net/wiki/
6. systemd. "systemd.service -- Service Unit Configuration." freedesktop.org, 2026.
7. NOAA Open Data Dissemination. "AWS HRRR Archive." 2026. https://registry.opendata.aws/noaa-hrrr-pds/
8. Open-Meteo. "API Rate Limits and Fair Use." 2026. https://open-meteo.com/en/terms
9. structlog. "Structured Logging for Python." 2026. https://www.structlog.org/
10. Prometheus. "Python Client Library." 2026. https://prometheus.io/docs/instrumenting/clientlibs/
11. Linux man-pages. "systemd.exec -- Execution Environment Configuration." 2026.
12. OWASP. "Secure Coding Practices Quick Reference Guide." 2024.
13. mcrcon. "Minecraft RCON Client for Python." GitHub, 2025.
14. Docker. "Best Practices for Dockerfiles." 2026. https://docs.docker.com/develop/develop-images/dockerfile_best-practices/
15. GSD Mesh Prototype Specification. "Node Architecture and Service Co-Location." Internal, 2025.

---

*Minecraft Real-Time Weather -- Module 5: GSD Mesh Integration and Deployment Architecture. The Amiga's secret was not one fast chip. It was four specialized chips that each did one thing perfectly and talked to each other through clean interfaces. The weather sidecar is Paula for the atmosphere: it listens to the signal, translates it faithfully, and hands the result to Denise for display.*
