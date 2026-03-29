# NASA Dataset Integration (Part H) — Component Specification

**Milestone:** NASA Mission Series
**Wave:** 2 | **Track:** B
**Model Assignment:** Sonnet
**Estimated Tokens:** ~30K
**Dependencies:** Component #0 (Shared Types), Component #2 (Mission Catalog Index)
**Produces:** `skills/nasa/dataset-integrator/SKILL.md`, API connector modules, sample query library, upstream registration entries

---

## Objective

Build Part H of the per-mission pipeline: the NASA dataset and resource integration stage. For each mission, Part H identifies which publicly accessible NASA data systems contain relevant data, creates working API connectors, provides sample queries that retrieve real data, and registers data sources in skill-creator's upstream intelligence monitoring. Done means: after Part H, a developer can programmatically access real NASA data for any completed mission using provided scripts and skills.

## Context

NASA maintains extensive public data systems. Part H connects gsd-skill-creator to these systems so that Parts C-F simulations, exercises, and tools can use real data instead of approximations. This is the "7th stage" requested in the vision — integration with publicly accessible NASA datasets for engineers and systems developing future tools.

Target data systems (from research reference):

| System | Data Type | Access Method |
|--------|-----------|---------------|
| JPL Horizons | Ephemeris, orbital elements | REST API + telnet batch |
| PDS (Planetary Data System) | Planetary science archives | HTTP archive, OPeNDAP |
| NTRS (Technical Reports Server) | Engineering documents | Search API |
| HEASARC | Astrophysics archives | TAP/VO services |
| NASA Open Data Portal | Multi-domain datasets | Socrata API |
| OpenMCT | Telemetry dashboard | npm package (open source) |
| NASA WorldView/GIBS | Earth imagery | WMTS tiles API |
| SPICE Toolkit | Geometry/navigation kernels | Python (SpiceyPy) |
| NASA Image/Video API | Media assets | REST API |
| NASA Exoplanet Archive | Exoplanet catalog | TAP API |
| TechPort | Technology projects | REST API |
| GMAT | Mission analysis | Open-source download |

Not all systems are relevant to every mission. Part H selects the relevant systems per mission.

## Technical Specification

### Per-Mission Part H Output

1. **Data Inventory** (`part-h.md` → "Available Data" section)
   - Which NASA data systems contain data from/about this mission?
   - What data types are available (ephemeris, imagery, reports, raw science)?
   - Data volume estimates and format descriptions

2. **Access Guide** (`part-h.md` → "How to Access" section)
   - Step-by-step instructions for each relevant data system
   - Authentication requirements (most NASA data is public; note any exceptions)
   - Rate limits and usage policies

3. **Integration Skill** (`skills/nasa/data-[system-name]/SKILL.md`)
   - Reusable skill for accessing this data system
   - Trigger description, domain, evaluation harness
   - One skill per data system (not per mission — skills are reused across missions)

4. **Sample Queries** (`docs/nasa/missions/[id]/data-samples/`)
   - Working Python scripts and/or curl commands
   - Each query retrieves real data for this specific mission
   - Output includes sample response (truncated for readability)

5. **Simulation Data Feed** (`part-h.md` → "Simulation Integration" section)
   - How Part E simulations can ingest real data from these sources
   - Data format conversion notes (API output → simulation input)

6. **Upstream Registration** (entry in `skills/nasa/upstream-registry.json`)
   - Register each data source for skill-creator's upstream monitoring
   - Include health check URL, expected response, check interval

### API Connector Architecture

```python
# Example: JPL Horizons connector
# skills/nasa/data-horizons/horizons_query.py

import requests

def query_horizons(target: str, start: str, stop: str, step: str = '1d'):
    """
    Query JPL Horizons for ephemeris data.
    
    Args:
        target: Horizons target ID (e.g., '499' for Mars, '-31' for Voyager 1)
        start: Start date (ISO format)
        stop: Stop date (ISO format)
        step: Step size (e.g., '1d', '1h', '10m')
    
    Returns:
        dict with ephemeris data (RA, DEC, distance, velocity)
    """
    url = "https://ssd.jpl.nasa.gov/api/horizons.api"
    params = {
        "format": "json",
        "COMMAND": f"'{target}'",
        "OBJ_DATA": "YES",
        "MAKE_EPHEM": "YES",
        "EPHEM_TYPE": "OBSERVER",
        "CENTER": "'500@399'",  # Geocentric
        "START_TIME": f"'{start}'",
        "STOP_TIME": f"'{stop}'",
        "STEP_SIZE": f"'{step}'",
        "QUANTITIES": "'1,9,20,23,24'"
    }
    response = requests.get(url, params=params)
    return response.json()
```

### Mission-to-Data-System Mapping

| Mission Type | Primary Data Systems | Secondary |
|-------------|---------------------|-----------|
| Crewed (Mercury-Apollo) | NTRS, NASA Image API | NSSDC |
| Space Station (Skylab, ISS) | NTRS, NASA Open Data | NASA Image API |
| Mars missions | PDS, Horizons, NTRS | NASA Image API |
| Outer planet missions | PDS, Horizons, SPICE | NASA Image API |
| Observatories (Hubble, JWST, Chandra) | HEASARC, Exoplanet Archive | NASA Image API |
| Solar missions (Parker) | HEASARC, Horizons | SPICE |
| Earth science | WorldView/GIBS, NASA Open Data | NTRS |

### Behavioral Requirements

- All API calls must respect rate limits (document per-system limits)
- Sample queries must work at execution time (test before including)
- No authenticated/restricted data — public access only
- All data usage respects NASA data policies (attribution required)
- Integration skills are per-data-system, not per-mission (reusable)
- If an API is temporarily unavailable, gracefully degrade (note unavailability; provide cached sample)

## Implementation Steps

1. Create `skills/nasa/dataset-integrator/SKILL.md` with per-mission routing logic
2. Build API connectors for top-priority systems: Horizons, PDS, NTRS, NASA Image API
3. Create sample query library structure
4. Implement upstream registry schema and registration logic
5. Test: query Horizons for Apollo 11 trajectory data; verify working response

## Test Cases

| Test ID | Input | Expected Output | Pass Condition |
|---------|-------|-----------------|----------------|
| DI-01 | Apollo 11 mission | Horizons query for Moon trajectory | Working Python script returns ephemeris |
| DI-02 | Perseverance mission | PDS query for Mars data | Data inventory lists available datasets |
| DI-03 | Hubble mission | HEASARC query | Working sample query for Hubble observations |
| DI-04 | API unavailable | Graceful degradation | Error noted; cached sample provided; no crash |
| DI-05 | Upstream registry | Registration entry created | Valid JSON; health check URL present |
| DI-06 | Integration skill reuse | Same Horizons skill used for Apollo and Voyager | Single SKILL.md; mission-specific queries |

## Verification Gate

- [ ] At least one API connector retrieves real data successfully
- [ ] Sample queries work at execution time
- [ ] Integration skills follow SKILL.md format with evaluation harness
- [ ] Upstream registry entries include health check URLs
- [ ] No authenticated or restricted data accessed

## Safety Boundaries

| Constraint | Boundary Type |
|-----------|---------------|
| Public access data only — no ITAR, no restricted | ABSOLUTE |
| NASA data use policies respected; attribution included | ABSOLUTE |
| Rate limits documented and respected per data system | GATE |
