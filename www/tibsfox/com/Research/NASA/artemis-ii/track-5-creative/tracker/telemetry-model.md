# Telemetry Model — Predicted vs Actual

*Pre-mission: trajectory model based on published parameters.*
*Post-mission: compared against JPL Horizons ID -1024 actual data.*

## Model Parameters

| Parameter | Value | Source |
|-----------|-------|--------|
| Launch UTC | 2026-04-01T22:24:00Z | NASA blog |
| HEO apogee | 70,000 km | Wikipedia/NASA |
| HEO period | ~23.5 hours | Computed (vis-viva: 23.3h) |
| TLI delta-v | ~3,150 m/s | Estimated from Orion ESM specs |
| Lunar closest approach | 6,513 km from surface | Wikipedia |
| Max distance beyond Moon | 7,600 km | Wikipedia |
| Reentry speed | 40,000 km/h (11.1 km/s) | NASA |
| Mission duration | ~10 days (~231 hours) | NASA |

## 30-Waypoint Trajectory Model

Piecewise linear interpolation between waypoints. Each waypoint: [MET seconds, distance from Earth center km, velocity km/s, g-force, phase].

Model covers: launch → MECO → orbit insertion → HEO → TLI → outbound coast → lunar flyby → return coast → entry → splashdown.

## Verification Plan (Post-Mission)

1. Query JPL Horizons for Orion (ID -1024) ephemeris at 1-hour intervals
2. Compare predicted distance vs actual distance at each hour
3. Compute RMS error across mission duration
4. Identify phases where model diverges most (likely HEO and lunar flyby)
5. Document in track-6-qa/predicted-vs-actual.md
