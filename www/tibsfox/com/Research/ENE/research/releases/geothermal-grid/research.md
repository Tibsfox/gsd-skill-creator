# Geothermal Heating & Grid Intelligence

**Catalog:** ENE-GEO | **Cluster:** Energy + Infrastructure
**Date:** 2026-04-04 | **Source:** Synapse/Hardware to Save a Planet
**College:** Engineering, Environmental, Economics, Physics, Data Science

## Abstract

Two talks from the Hardware to Save a Planet podcast documented the convergence of residential geothermal heating (Dandelion Energy, spun from Google X) and intelligent grid management (SPAN smart panel). The central insight: the US electrical grid operates at only 42% average utilization because it was sized for theoretical worst-case using analog planning math. Digital real-time management eliminates the need for grid upgrades, enabling 100% home electrification without new infrastructure.

## Key Findings

### Grid Over-Sizing = Ghost Tokens
The most powerful cross-domain connection of Session 7:
- **Electrical grid:** 42% utilization. 98% of 200A homes have 80A unused 100% of time.
- **AI context window:** 50-70K ghost tokens before first message. Tool definitions consume 50% of 200K window.
- **Both solutions:** Replace analog worst-case provisioning with digital real-time management.

### Geothermal Advantage
- Ground temperature: constant ~55F year-round
- Air-source heat pump at 0F: falls back to resistance heating (most expensive, grid-stressful)
- Ground-source at 55F: never needs resistance heating backup
- Geothermal cuts heating/cooling load in half
- Enables 100% electric (eventually 100% renewable) operation

### SPAN Smart Panel
- Digital behind-the-meter load management
- Defers loads for ~6-minute windows, imperceptible to homeowner
- Peak load events happen <1% of the year, last ~6 minutes each
- No grid infrastructure upgrade needed

### Wave Energy
- US EIA: wave power could supply up to 66% of US energy needs
- Existing coastal breakwaters are untapped deployment surface
- Eco Wave Power: operating in Israel and LA, expanding to Taiwan, India, Portugal

### Hydrogen
- Green hydrogen target: $5/kg (current: $15-20/kg)
- Diesel backup generators: limited to ~50 hours/year, extremely dirty
- Hydrogen as direct drop-in replacement for backup power

## Key Numbers

| Metric | Value |
|--------|-------|
| US grid utilization | ~42% average |
| 200A homes with 80A unused | 98% of the time |
| Peak load control events needed | <1% of year |
| Control event duration | ~6 minutes |
| Wave energy potential | Up to 66% of US needs |
| Green H2 target/current price | $5 vs $15-20/kg |
| Dandelion installs | 3,000+ |
| Opower thermostat savings | ~15% (70→73F in summer) |

## Rosetta Translation

| Energy Concept | AI Computing Analog |
|---------------|-------------------|
| Grid over-sizing (42% utilization) | Ghost tokens (50-70K before first message) |
| SPAN digital load management | Progressive skill loading (94% savings) |
| 6-minute load deferral | Deferred tool loading (load on first use) |
| Ground-source constant 55F | Local inference (constant, reliable, no network) |
| Air-source fighting 0F | Remote API (variable latency, unreliable) |
| Hydrogen backup | Fallback model (expensive, used rarely) |
| Wave energy (untapped breakwaters) | Existing codebase patterns (untapped optimization) |
| Opower normative comparison | Agent performance benchmarking |

## Study Guide Topics (8)

1. Grid utilization statistics and demand diversity
2. PEM fuel cell subsystem dependencies
3. Behind-the-meter vs grid-side demand response
4. Hydrogen cost curve ($5/kg target)
5. Wave energy resource assessment (kW/m of wave front)
6. Backup generator emissions regulations
7. Energy storage modality comparison (Li-ion vs H2 vs pumped hydro)
8. AI compute power demand at data center level (PUE, kW/rack)

## DIY Try Sessions (3)

1. **Home load audit** — Clamp meter 24hr recording, calculate peak coincidence
2. **Wave energy toy model** — Floating platform + syringe piston + DC motor
3. **Ground temperature logger** — Sensors at 1/3/6 ft depth over 4-8 weeks
