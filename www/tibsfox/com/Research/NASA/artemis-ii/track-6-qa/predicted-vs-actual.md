# Predicted vs Actual — Trajectory Model Validation

*Populated post-mission using JPL Horizons data for Orion (ID: -1024).*

## Method

1. Query Horizons: `COMMAND='-1024'`, `EPHEM_TYPE=OBSERVER`, 1-hour steps, full mission duration
2. Extract geocentric distance at each timestep
3. Compare to our 30-waypoint piecewise model predictions
4. Compute error metrics: RMS, max error, phase-specific accuracy

## Expected Model Weaknesses

- HEO phase: simplified as circular, actual orbit is elliptical with specific perigee/apogee
- Lunar flyby: model uses linear interpolation, actual trajectory curves around far side
- Velocity during coast: model assumes linear interpolation, actual follows 1/r² gravity
- Post-TLI: model doesn't account for mid-course corrections

## Results

*Awaiting mission data.*
