# Artemis II Tracker — Changelog

## v1.0.0 (2026-03-30)

Initial deployment. Mission clock, telemetry dashboard, trajectory visualization, live data feeds.

- 6-cell telemetry: distance, velocity, light delay, Moon distance, altitude, g-force
- Mission clock: DD:HH:MM:SS with UTC/EDT/PDT
- Phase detection: prelaunch → launch → orbit → heo → tli → outbound → lunar → return → entry → complete
- Trajectory: 30-waypoint piecewise model with sqrt-scale canvas rendering
- Weather: NOAA KXMR (KSC) for launch conditions
- Moon: synodic + anomalistic period calculation
- DSN: XML feed polling for Orion tracking
- Data feed: tibsfox.com/api/artemis-ii/status.json with fallback to computed model
- Crew, vehicle, mission profile, science payload info cards

## v1.0.1 (2026-03-31)

Trajectory visualization rewrite for scientific rigor.

- Replaced arbitrary Bezier curves with waypoint-based path rendering
- Added sqrt distance scaling with explicit "not to scale" notation
- Added Van Allen belt indicators around Earth
- Added day markers (D1-D9, SP) along trajectory path
- Muted Earth color (was oversaturated blue)
- Proper Earth/Moon size ratio (Moon = 27% Earth radius)
- Added 100,000 km scale bar with tick marks
- Reduced Earth and Moon sizes relative to canvas (was too large)
- Cleaner label placement and opacity hierarchy
