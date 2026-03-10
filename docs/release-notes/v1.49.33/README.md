# v1.49.33 — The Systems Administrator's Handbook

**Shipped:** 2026-03-10
**Commits:** 10
**Files:** 73 changed | **Insertions:** 27,688 | **Deletions:** 55
**Branch:** dev -> main
**Dedication:** SYS module dedicated to Taos (taos.com) — the sysadmin company. They know the spaces in between.

## Summary

Two full PNW research studies — LED Lighting & Controllers and Systems Administration — plus a shared data source registry, series integration for 13 projects, release integrity tooling, and agent heartbeat monitoring. The LED study covers everything from Ohm's Law to PLC ladder logic across 5 MCU platforms. The SYS study maps sysadmin craft from boot sequence to incident response, with a working trust-based throttling server as proof of concept. Together they bring the PNW research series to 13 projects, 277 files, 13.5 MB, and 870+ cited sources.

## Key Features

### 1. LED Lighting & Controllers (`www/PNW/LED/`)

40 files, ~14,700 lines across 8 research modules:
- **M1 — LED Fundamentals:** Physics, current drivers, resistor calculations, thermal management
- **M2 — Microcontrollers:** Arduino, ESP32, Raspberry Pi, PIC/XC8, RP2040/PIO — 5 platforms compared
- **M3 — Addressable LEDs:** WS2812B protocol timing, APA102 SPI, power injection, FastLED/NeoPixel libraries
- **M4 — Smart Lighting:** Philips Hue API, DIYHue/WLED integration, TCS34725 color sensing, circadian adaptation
- **M5 — Power & Control:** MOSFET PWM dimmers, power supply selection, IR/RF remotes, WLED setup
- **M6 — POV Displays:** Physics of persistence, APA102 POV design, RP2040 architecture, image preparation
- **M7 — Measurement:** Oscilloscope basics, DIY scopes, Nyquist sampling theorem, LED signal measurement
- **M8 — Industrial:** PLC ladder logic, Modbus communication, hybrid PLC-ESP32, industrial LED panels

80+ sources, 4 safety gates. Glossary and source index included.

### 2. Systems Administration: The Spaces In Between (`www/PNW/SYS/`)

19 files, 10,550 lines. Project #13 in the PNW research series.

Through-line: every system leaves a trail. The sysadmin reads the truth and stewards the resources.

7 core modules:
- **Server Foundations** (1,086 lines) — Linux boot, processes, filesystems, systemd
- **The Network** (1,048 lines) — TCP/IP, DNS, DHCP, routing, firewalls, mesh
- **The Logs** (995 lines) — syslog, journald, access logs, structured logging, aggregation
- **Process Forensics** (1,093 lines) — CPU, memory, disk I/O, USE method, cgroups
- **Data Provenance** (1,001 lines) — timestamps, chain of custody, backup, SBOM/SLSA
- **Access & Bandwidth** (1,140 lines) — 5-tier trust model (Owner/Trusted/Known/Visitor/Unknown), anti-waste
- **Security Operations** (1,499 lines) — hardening, TLS, intrusion detection, incident response, privacy by design

Synthesis: integration doc (20 cross-module bridges), bibliography (123 sources, 3-tier reliability), verification matrix (12/12 PASS, 5/5 safety-critical PASS), 79-term glossary.

**Working proof of concept:** `www/PNW/SYS/poc/server.mjs` — trust-based throttling server, zero dependencies, terminal dashboard at `localhost:3000/_dashboard`. Real bandwidth throttling via timed chunk streaming. 5 trust tiers from 150 baud (unknown) to unlimited (owner).

### 3. Shared Data Source Registry (`www/PNW/data-sources.md`)

13 datasets cataloged with stable IDs for Puget Sound coastal mapping:
- USGS 1m topobathy DEM (186 sources, Deception Pass to Olympia)
- WA Ecology Shoreline Photo Viewer (5 series, 1976-2017)
- WA DNR 60 intertidal habitat classes
- PSNERP drift cells, feeder bluff mapping, benthic habitat sonar
- Data pipeline: DEM -> terrain, substrate -> block type, photos -> texture, tidal datum -> water level
- 3-tier reliability (Gold/Silver/Bronze)

### 4. Series Integration

PNW index updated to 13 projects:
- LED and SYS cards added with project descriptions and stats
- New Infrastructure Thread connecting SYS modules across the series
- Cross-reference matrix expanded with SYS column and filter chips
- Stats: 277 files, 13.5 MB, 870+ sources, 13 mission packs
- LED, TIBS, FFA also integrated (carried from prior commits)

### 5. Release Integrity & Process Hardening

- `scripts/publish-release.sh` — validates and publishes GitHub releases with full notes
- Agent heartbeat monitor — timestamp + poller + desktop notification for silent failures
- Wave commit marker hook validation
- LOC-per-release tracking in STATE.md
- Speculative infrastructure inventory
- TypeScript API doc generation (typedoc)

## Verification

| # | Area | Criterion | Result |
|---|------|-----------|--------|
| 1 | LED | 8 research modules with technical depth | PASS |
| 2 | LED | 5 MCU platforms documented with code examples | PASS |
| 3 | LED | 80+ sources properly attributed | PASS |
| 4 | LED | 4 safety gates (no mains wiring, proper grounding) | PASS |
| 5 | SYS | 7 core sysadmin domains documented | PASS |
| 6 | SYS | Trust-based 5-tier bandwidth model designed | PASS |
| 7 | SYS | Working PoC demonstrates trust throttling | PASS |
| 8 | SYS | Defensive-only security (no offensive techniques) | PASS |
| 9 | SYS | No real-world PII in examples | PASS |
| 10 | SYS | 123 sources attributed with reliability tiers | PASS |
| 11 | SYS | 12/12 success criteria, 5/5 safety-critical | PASS |
| 12 | Data | 13 datasets cataloged with stable IDs | PASS |
| 13 | Series | Index updated to 13 projects | PASS |
| 14 | Process | publish-release.sh validates required sections | PASS |

## File Counts by Area

| Area | Files | Lines Added |
|------|-------|-------------|
| LED research | 40 | ~14,700 |
| SYS research + PoC | 19 | 10,550 |
| Data sources | 1 | 301 |
| Series integration | 3 | 77 net |
| Release notes (prior) | 4 | 348 |
| Process tooling | 6 | ~1,712 |
| **Total** | **73** | **~27,688** |

## Retrospective

### What Worked
- **Wave-based commits for SYS.** Three clean atomic commits (module, data registry, integration) instead of one monolith. Each wave is independently reviewable and bisectable.
- **Handoff document captured everything.** Session handoff included file inventory, design decisions, Fox infrastructure company notes, and personal context. Zero information lost across sessions.
- **Filename bug caught in review.** Nav links referenced `06-access-bandwidth` but file was `06-access-and-bandwidth.md`. Caught during pre-commit review, fixed before commit. Review works.
- **PoC validates the research.** The SYS trust-based throttling server isn't just documentation — it's runnable code that demonstrates the core principle. Research + working proof.

### What Could Be Better
- **27K LOC exceeds the 15K flag.** Two full research studies in one release is large. LED and SYS were built in separate sessions but shipped together because the intermediate work (process tooling, release notes) hadn't been released yet.
- **LED integration was carried from prior session.** The LED module was built but not integrated into the series index until this release. Earlier integration would have kept releases smaller.

## Lessons Learned

1. **Integrate as you build.** Series index updates should ship with the module, not accumulate. LED, TIBS, FFA, and SYS integration all landed in this release when they could have been incremental.
2. **Working code validates research.** The SYS PoC server proves the trust-based throttling model works. A 528-line zero-dependency server is worth more than 1,000 lines of description. Build the thing you're documenting.
3. **Handoff documents are session insurance.** The SYS handoff captured 167 lines of context including Fox infrastructure company design, personal history, and philosophical threads. All of it survived the session boundary intact.
