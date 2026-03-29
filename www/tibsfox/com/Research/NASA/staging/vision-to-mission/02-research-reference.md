# NASA Mission Series — Research Reference

**Date:** 2026-03-29
**Status:** Research Compilation
**Source Document:** 01-vision-doc.md
**Purpose:** Where the vision says "traverse the full NASA mission catalog," this reference provides the exact mission index, pipeline specifications, dataset inventory, release engineering protocols, and safety boundaries needed for autonomous execution.

---

## How to Use This Document

This reference consolidates findings from deep research conducted March 29, 2026, supplemented by six research mission packs (Parts A, D, F, G, Draftsman, and the NASA Mission History pack). Agents executing the per-mission pipeline should read the section corresponding to their Part assignment. Agents managing the release cadence should read the Release Engineering section. All agents should read the Safety Boundaries section.

**Key source organizations:**
- **NASA.gov** — Official mission histories, program pages, news releases, Artemis updates
- **NASA JPL (jpl.nasa.gov)** — Robotic mission archives, Horizons ephemeris system, mission design
- **NASA NSSDC (nssdc.gsfc.nasa.gov)** — National Space Science Data Center, master mission catalog
- **NASA PDS (pds.nasa.gov)** — Planetary Data System, science data archives
- **NASA NTRS (ntrs.nasa.gov)** — Technical Reports Server, engineering documentation
- **NASA HEASARC (heasarc.gsfc.nasa.gov)** — High Energy Astrophysics Science Archive Research Center
- **NASA Open Data Portal (data.nasa.gov)** — APIs and datasets
- **NASA Worldview (worldview.earthdata.nasa.gov)** — Earth observation imagery
- **GAO (gao.gov)** — Government Accountability Office, program audits
- **ASME, AIAA, IEEE** — Engineering standards and conference proceedings

---

## Mission Catalog Index

### Epoch 1: Origins & Early Human Spaceflight (1958–1966)

| # | Version | Mission | Date | Type | Key Significance |
|---|---------|---------|------|------|------------------|
| 1 | v1.0 | NACA → NASA Founding | 1958-10-01 | Organization | Agency creation; 8,000 employees; 3 labs; JPL transfer |
| 2 | v1.1 | Explorer 1 | 1958-01-31 | Satellite | First US satellite; Van Allen belts discovered |
| 3 | v1.2 | Pioneer Program (1-4) | 1958-1959 | Lunar probes | Early lunar attempts; lessons in trajectory design |
| 4 | v1.3 | Mercury-Redstone (uncrewed) | 1960-1961 | Test flights | Launch vehicle qualification; abort system testing |
| 5 | v1.4 | Mercury-Atlas 5 (Enos) | 1961-11-29 | Orbital test | Chimpanzee orbital flight; validated life support |
| 6 | v1.5 | Freedom 7 (Mercury-Redstone 3) | 1961-05-05 | Crewed suborbital | Shepard: first American in space, 15 min |
| 7 | v1.6 | Liberty Bell 7 (MR-4) | 1961-07-21 | Crewed suborbital | Grissom; hatch blow; capsule loss |
| 8 | v1.7 | Friendship 7 (Mercury-Atlas 6) | 1962-02-20 | Crewed orbital | Glenn: first American to orbit, 3 orbits |
| 9 | v1.8 | Aurora 7 (MA-7) | 1962-05-24 | Crewed orbital | Carpenter; science focus; off-target landing |
| 10 | v1.9 | Sigma 7 (MA-8) | 1962-10-03 | Crewed orbital | Schirra; precision engineering flight, 6 orbits |
| 11 | v1.10 | Faith 7 (MA-9) | 1963-05-15 | Crewed orbital | Cooper; final Mercury, 22 orbits, 34 hours |
| 12 | v1.11 | Ranger Program (7-9) | 1964-1965 | Lunar impact | First close-up lunar photos; impact imaging |
| 13 | v1.12 | Mariner 4 | 1964-11-28 | Mars flyby | First close-up images of Mars; no canals |
| 14 | v1.13 | Gemini 3 | 1965-03-23 | Crewed orbital | First crewed Gemini; orbital maneuver demonstrated |
| 15 | v1.14 | Gemini 4 | 1965-06-03 | Crewed orbital | Ed White: first US spacewalk (EVA 23 min) |
| 16 | v1.15 | Gemini 5 | 1965-08-21 | Crewed orbital | 8-day endurance; fuel cell test |
| 17 | v1.16 | Gemini 6A / Gemini 7 | 1965-12 | Crewed orbital | First space rendezvous; 14-day endurance |
| 18 | v1.17 | Gemini 8 | 1966-03-16 | Crewed orbital | Armstrong; first docking; thruster emergency |
| 19 | v1.18 | Gemini 9A–12 | 1966 | Crewed orbital | EVA mastery; double rendezvous; program completion |
| 20 | v1.19 | Surveyor Program (1-7) | 1966-1968 | Lunar lander | Soft lunar landings; soil analysis; Apollo site selection |
| 21 | v1.20 | Lunar Orbiter Program | 1966-1967 | Lunar orbiter | Complete lunar surface mapping for Apollo |

### Epoch 2: Apollo Era (1961–1972)

| # | Version | Mission | Date | Type | Key Significance |
|---|---------|---------|------|------|------------------|
| 22 | v1.21 | Apollo Program Overview + Saturn V | 1961-1972 | Program | $25B program; 400K people; Saturn V development |
| 23 | v1.22 | Apollo 1 | 1967-01-27 | Tragedy | Fire: Grissom, White, Chaffee killed; redesign |
| 24 | v1.23 | Apollo 7 | 1968-10-11 | Crewed LEO | First crewed Apollo; 11-day test; live TV |
| 25 | v1.24 | Apollo 8 | 1968-12-21 | Crewed lunar orbit | First humans to orbit Moon; Earthrise photo |
| 26 | v1.25 | Apollo 9 | 1969-03-03 | Crewed LEO | First crewed LM test in Earth orbit |
| 27 | v1.26 | Apollo 10 | 1969-05-18 | Crewed lunar orbit | Dress rehearsal; LM to 14.4 km of surface |
| 28 | v1.27 | Apollo 11 | 1969-07-16 | Crewed lunar landing | First Moon landing; Armstrong, Aldrin; 650M viewers |
| 29 | v1.28 | Apollo 12 | 1969-11-14 | Crewed lunar landing | Precision landing near Surveyor 3 |
| 30 | v1.29 | Apollo 13 | 1970-04-11 | Crewed (aborted) | O₂ tank explosion; lifeboat mission; successful failure |
| 31 | v1.30 | Apollo 14 | 1971-01-31 | Crewed lunar landing | Fra Mauro highlands; Shepard returns |
| 32 | v1.31 | Apollo 15 | 1971-07-26 | Crewed lunar landing | First Lunar Roving Vehicle; Hadley Rille |
| 33 | v1.32 | Apollo 16 | 1972-04-16 | Crewed lunar landing | Descartes highlands geology |
| 34 | v1.33 | Apollo 17 | 1972-12-07 | Crewed lunar landing | Last Moon landing; geologist Schmitt on surface |

### Epoch 3: Post-Apollo Interlude (1973–1980)

| # | Version | Mission | Date | Type | Key Significance |
|---|---------|---------|------|------|------------------|
| 35 | v1.34 | Skylab (all missions) | 1973-1974 | Space station | First US station; 3 crews; 28-84 day stays |
| 36 | v1.35 | Apollo-Soyuz Test Project | 1975-07 | Joint US-USSR | First international docking; détente symbol |
| 37 | v1.36 | Pioneer 10 & 11 | 1972-1979 | Outer planets | First Jupiter/Saturn flybys; asteroid belt traverse |
| 38 | v1.37 | Viking 1 & 2 | 1975-1982 | Mars lander | First successful Mars landings; biology experiments |
| 39 | v1.38 | Voyager 1 & 2 | 1977-present | Outer planets/ISM | Grand Tour; interstellar space; still transmitting |
| 40 | v1.39 | Pioneer Venus | 1978 | Venus orbiter/probe | Venus atmospheric study; surface mapping |

### Epoch 4: Space Shuttle Era (1981–2011)

| # | Version | Mission | Date | Type | Key Significance |
|---|---------|---------|------|------|------------------|
| 41 | v1.40 | STS-1 through STS-5 | 1981-1982 | Orbital test flights | First Shuttle flights; Columbia orbital tests |
| 42 | v1.41 | Early Operational Shuttle (1983-1985) | 1983-1985 | Operational | TDRS, first untethered EVA, satellite retrieval |
| 43 | v1.42 | STS-51L Challenger Disaster | 1986-01-28 | Tragedy | O-ring failure; 7 killed; Rogers Commission |
| 44 | v1.43 | Return to Flight + Magellan/Galileo | 1988-1989 | Operational | Post-Challenger; Venus radar mapper; Jupiter orbiter |
| 45 | v1.44 | Hubble Space Telescope (STS-31 + servicing) | 1990-2009 | Observatory | Deployment, mirror fix, 5 servicing missions |
| 46 | v1.45 | Shuttle-Mir Program | 1994-1998 | International | 9 Shuttle-Mir dockings; ISS precursor |
| 47 | v1.46 | ISS Assembly (Shuttle flights) | 1998-2011 | Construction | 37 dedicated ISS assembly flights |
| 48 | v1.47 | STS-107 Columbia Disaster | 2003-02-01 | Tragedy | Foam strike; 7 killed; CAIB; 29-month stand-down |
| 49 | v1.48 | Return to Flight + Final Shuttle Era | 2005-2011 | Operational | Post-Columbia; final Hubble service; STS-135 last flight |

### Epoch 5: Robotic & Deep Space Science (1990–2026)

| # | Version | Mission | Date | Type | Key Significance |
|---|---------|---------|------|------|------------------|
| 50 | v1.49 | Great Observatories (Compton, Chandra, Spitzer) | 1991-2020 | Observatories | Multi-wavelength astronomy program |
| 51 | v1.50 | Mars Pathfinder + Sojourner | 1996-1997 | Mars rover | First rover; airbag landing; "faster better cheaper" |
| 52 | v1.51 | Cassini-Huygens | 1997-2017 | Saturn orbiter | 13 years at Saturn; Enceladus geysers; Titan landing |
| 53 | v1.52 | Spirit & Opportunity (MER) | 2003-2018 | Mars rovers | Water evidence; 45.16 km driving record |
| 54 | v1.53 | Mars Reconnaissance Orbiter | 2005-present | Mars orbiter | High-res imaging; communications relay |
| 55 | v1.54 | New Horizons | 2006-present | Pluto flyby | First Pluto images; Arrokoth flyby |
| 56 | v1.55 | Curiosity (MSL) | 2011-present | Mars rover | Sky crane landing; 36+ km driven; habitable environment |
| 57 | v1.56 | MAVEN | 2013-present | Mars orbiter | Atmospheric loss study; climate history |
| 58 | v1.57 | OSIRIS-REx / OSIRIS-APEX | 2016-present | Asteroid sample return | Bennu samples returned 2023; now en route to Apophis |
| 59 | v1.58 | InSight | 2018-2022 | Mars lander | Interior structure; seismometer; first marsquakes |
| 60 | v1.59 | Parker Solar Probe | 2018-present | Solar mission | 27 encounters; 430K mph; corona observations |
| 61 | v1.60 | James Webb Space Telescope | 2021-present | IR Observatory | L2 orbit; earliest galaxies; exoplanet atmospheres |
| 62 | v1.61 | Perseverance + Ingenuity | 2020-present | Mars rover + helicopter | Sample cache; first powered Mars flight |
| 63 | v1.62 | IMAP | 2025-present | Heliophysics | Heliosphere boundary mapping from L1 |

### Epoch 6: New Human Spaceflight & Commercial Era (2000–2026)

| # | Version | Mission | Date | Type | Key Significance |
|---|---------|---------|------|------|------------------|
| 64 | v1.63 | ISS Continuous Habitation | 2000-present | Space station | 25+ years continuous human presence |
| 65 | v1.64 | Commercial Cargo (Dragon, Cygnus) | 2012-present | Resupply | SpaceX/Northrop Grumman cargo services |
| 66 | v1.65 | Commercial Crew (Dragon, Starliner) | 2020-present | Crewed transport | Ending Soyuz dependence; crew rotation |
| 67 | v1.66 | Artemis I | 2022-11 | Uncrewed lunar | Orion 25.5-day lunar flyby test |
| 68 | v1.67 | Artemis II | 2026-04 (planned) | Crewed lunar flyby | First crewed beyond-LEO since 1972 |
| 69 | v1.68 | Artemis III-V & Lunar Gateway | Planned | Crewed lunar | LEO rendezvous tests → eventual lunar landing |
| 70 | v1.69 | Dragonfly | 2028 (planned) | Titan rotorcraft | Nuclear-powered drone on Saturn's moon Titan |
| 71 | v1.70 | Mars Sample Return (concept) | TBD | Mars sample | Retrieving Perseverance's cached samples |
| 72 | v1.71 | Europa Clipper | 2024-present | Jupiter moon | Europa ocean investigation; launched Oct 2024 |
| 73 | v1.72 | Future Missions Catalog | Ongoing | Various | Nancy Grace Roman, HWO, NEO Surveyor, etc. |

*This catalog provides the baseline. Individual missions within grouped entries (e.g., "Gemini 9A-12") may be split into separate subversions during execution if the retrospective system determines they warrant individual treatment. The catalog is a living document that grows with the series.*

---

## Per-Mission Pipeline Specifications

### Part A Template Reference

Each Part A follows the template established in the NASA Mission History research pack (files_188_.zip):

**Required output artifacts:**
- Mission data record (JSON schema: name, date, crew, vehicle, objectives, outcomes)
- Historical narrative (2,000–5,000 words depending on mission significance)
- Mission timeline table (key events with dates)
- Hardware inventory table (spacecraft, instruments, launch vehicle)
- Institutional context section (budget, political mandate, predecessor/successor)
- Source bibliography (government and peer-reviewed sources only)

**Source priority:** NASA.gov > JPL > NSSDC > Smithsonian Air & Space > Encyclopaedia Britannica > Wikipedia (corroborative only)

### Part D Template Reference

Each Part D follows the Engineering Deep Dive template (files_190_.zip / nasa_partd_template.tex):

**Five Engineering Pillars (universal):**
1. Structural Engineering — loads, stress analysis, structural testing
2. Materials Science — selection rationale, properties, failure modes
3. Thermal Engineering — heat rejection, thermal protection, transient analysis
4. Mechanism Design — deployment systems, docking mechanisms, actuators
5. Manufacturing & Verification — fabrication methods, inspection, quality assurance

**Required mathematics workbook content:**
- At least one fully worked derivation per pillar using real/representative mission parameters
- TSPB eight-layer mapping (which layer does this math exercise?)
- Career pathway connection (what engineer solves this problem professionally?)

### Part F Template Reference

Each Part F follows the Mission Operations template (files_191_.zip / nasa_partf_template.tex):

**Three operational layers:**
1. Hardware Layer — spacecraft systems, subsystems, failure modes
2. Operations Layer — Mission Control consoles, telemetry, commanding
3. Human Layer — crew, CAPCOM, flight director, surgeon

**Required simulation specifications:**
- Minecraft: logistics/resource simulation (power budget, consumables, timeline)
- Blender: orbital visualization (trajectory, instrument pointing, time-lapse render)
- Unreal Engine: real-time telemetry dashboard specification (for missions warranting it)
- Arduino/Raspberry Pi: DIY telemetry display project specification

### Part G Template Reference

Each Part G follows the 8-Pass Refinement template (files_193_.zip / nasa_partg_template.tex):

**Eight passes (in order):**
1. Retrospective Harvest — read all RETRO outputs; classify findings
2. Fix and Test — implement Pass 1 findings; add tests; validate
3. Cross-Part Integration — consistency across Parts A-F
4. Integration Retrospective — lessons from Pass 3
5. Template Hardening — strengthen templates based on Passes 1-4
6. Refinement — prune, tighten, improve; remove redundancy
7. TSPB Identification — identify mathematical content for The Space Between
8. TSPB Expansion — draft new TSPB chapters from mission mathematics

### Part H Specification (NEW)

**Purpose:** Integrate publicly accessible NASA datasets and information resources.

**Target NASA Data Systems:**

| System | URL | Data Type | Integration Method |
|--------|-----|-----------|-------------------|
| JPL Horizons | ssd.jpl.nasa.gov/horizons/ | Ephemeris, orbital elements | REST API + telnet |
| PDS | pds.nasa.gov | Planetary science data | HTTP archive access |
| NTRS | ntrs.nasa.gov | Technical reports | Search API |
| HEASARC | heasarc.gsfc.nasa.gov | Astrophysics archives | TAP/VO services |
| NASA Open Data | data.nasa.gov | Multi-domain datasets | Socrata API |
| GMAT | gmatcentral.org | Mission analysis tool | Open-source download |
| OpenMCT | nasa.github.io/openmct/ | Telemetry dashboard | npm package |
| NASA WorldView | worldview.earthdata.nasa.gov | Earth imagery | GIBS API |
| SPICE Toolkit | naif.jpl.nasa.gov/naif/ | Geometry/navigation | C/Fortran/Python |
| NASA Image API | images-api.nasa.gov | Images, video, audio | REST API |
| NASA TechPort | techport.nasa.gov | Technology projects | REST API |
| NASA Exoplanet Archive | exoplanetarchive.ipac.caltech.edu | Exoplanet catalog | TAP API |

**Per-mission Part H output:**
1. **Data inventory:** Which NASA datasets contain data from this mission?
2. **Access guide:** How to query/download the relevant data (API calls, URLs, formats)
3. **Integration skill:** A SKILL.md for accessing this mission's data programmatically
4. **Sample queries:** Working examples (Python/curl) that retrieve real data
5. **Simulation data feed:** How Part E/F simulations can use real NASA data as inputs
6. **Upstream intelligence registration:** Register data sources in skill-creator's upstream monitoring

---

## Release Engineering Protocol

### Branch Setup (One-Time)

```bash
# Create nasa branch from current main
git checkout main
git pull origin main
git checkout -b nasa
git push -u origin nasa

# Set push.default=nothing (GSD discipline)
git config push.default nothing
```

### Per-Release Cycle

```
RELEASE CYCLE FOR nasa-v1.X
=============================

1. PRE-FLIGHT CHECK
   - Confirm nasa branch is synced with latest main
   - Load previous release retrospective
   - Load mission catalog entry for this version
   - Confirm all tools/skills from previous releases available

2. MISSION EXECUTION (Parts A through H)
   - Execute per-mission pipeline in wave order
   - Safety Warden active throughout
   - CAPCOM gates at Part transitions

3. RELEASE ARTIFACTS
   - Release notes: nasa-v1.X-release-notes.md
   - Retrospective: nasa-v1.X-retrospective.md
   - New/updated skills: skills/nasa/[skill-name]/SKILL.md
   - New/updated agents: chipsets/nasa/[chipset].yaml
   - Educational output: college/[department]/[module]/
   - TSPB additions: docs/TSPB/[chapter]/

4. GIT OPERATIONS
   git add -A
   git commit -m "nasa-v1.X: [Mission Name] - [one-line summary]"
   git tag nasa-v1.X
   git push origin nasa
   git push origin nasa-v1.X

5. MAIN SYNC
   git fetch origin main
   git merge origin/main --no-edit
   # Resolve conflicts if any (document in next retrospective)
   git push origin nasa

6. RETROSPECTIVE
   - Generate nasa-v1.X-retrospective.md
   - Classify lessons: [template improvement | skill improvement |
     agent improvement | process improvement | safety finding]
   - Feed forward: which lessons apply to nasa-v1.(X+1)?
```

### Release Note Template

```markdown
# nasa-v1.X Release Notes: [Mission Name]

**Date:** [YYYY-MM-DD]
**Mission:** [NASA Mission Name and Dates]
**Epoch:** [1-6]
**Pipeline Parts Completed:** [A, B, C, D, E, F, G, H]

## Mission Summary
[2-3 paragraphs: what this mission was, why it matters, what we produced]

## Deliverables
| Artifact | Path | Description |
|----------|------|-------------|
| Part A Study Guide | docs/nasa/[mission]/part-a.md | Historical record |
| Part B Science Reference | docs/nasa/[mission]/part-b.md | Science & discovery |
| ... | ... | ... |

## New Skills Developed
| Skill | Domain | Trigger | Status |
|-------|--------|---------|--------|
| [name] | [domain] | [when triggered] | new / improved |

## Lessons Applied from Previous Release
| Lesson | Source | How Applied |
|--------|--------|-------------|
| [lesson] | nasa-v1.(X-1) retrospective | [specific application] |

## Safety Warden Actions
| Action | Type | Resolution |
|--------|------|------------|
| [description] | annotate/gate/redirect | [what happened] |

## Metrics
| Metric | Value |
|--------|-------|
| Total tokens consumed | ~[N]K |
| New skills created | [N] |
| Skills improved | [N] |
| Template changes from Part G | [N] |
| TSPB sections added | [N] |
| Main sync status | clean / [N] conflicts resolved |
```

---

## Safety Boundaries

| Domain | Boundary | Type | Enforcement |
|--------|----------|------|-------------|
| Challenger disaster | Use Rogers Commission findings only; no editorializing on management blame; honor all 7 crew names | ABSOLUTE | BLOCK release |
| Columbia disaster | Use CAIB findings only; no editorializing; honor all 7 crew names | ABSOLUTE | BLOCK release |
| Apollo 1 fire | Factual reporting only; honor Grissom, White, Chaffee by name | ABSOLUTE | BLOCK release |
| Mars biosignature claims | "Potential biosignatures" language only; no confirmed life claims | ABSOLUTE | BLOCK release |
| Astronaut medical data | Published NASA standards only; no speculation on individual health | GATE | Human review |
| Budget/political arguments | Report from GAO and NASA sources; do not advocate | GATE | Human review |
| Artemis program status | Use February 2026 restructure as current state; note flux | ANNOTATE | Flag for update |
| Engineering calculations | Use published parameters or clearly mark "representative values" | GATE | Verify before release |
| Career salary data | BLS data only with date stamp | ANNOTATE | Note currency |
| International partner content | Respect agency naming conventions (ESA, JAXA, CSA, etc.) | ANNOTATE | Cross-check |
| Classified/ITAR data | Never include; NASA open data only | ABSOLUTE | BLOCK release |
| Indigenous land acknowledgment | If missions reference locations on Indigenous lands, follow OCAP/CARE | GATE | Cultural review |

---

## Source Bibliography

### Government and Agency Sources

- NASA.gov — Program histories: Mercury, Gemini, Apollo, Shuttle, Artemis, ISS
- NASA JPL — Mission catalog, Horizons system, mission design documentation
- NASA NSSDC — National Space Science Data Center master catalog
- NASA PDS — Planetary Data System archives
- NASA NTRS — Technical Reports Server
- NASA Science — Science mission pages (Parker, JWST, Perseverance, etc.)
- NASA Artemis — February 2026 restructure announcement
- GAO — Artemis program audits (GAO-25-106943, October 2024)
- ASME — Y14.5-2018 GD&T standard (Part D engineering reference)
- AIAA — Conference proceedings, technical standards

### Peer-Reviewed and Institutional Research

- Smithsonian National Air and Space Museum — Mission histories
- Encyclopaedia Britannica — Apollo program, Space Shuttle, space exploration
- EBSCO Research Starters — Mercury, Gemini academic overviews

### NASA Data Systems (Part H Integration Targets)

- JPL Horizons — ssd.jpl.nasa.gov/horizons/
- PDS — pds.nasa.gov
- HEASARC — heasarc.gsfc.nasa.gov
- NASA Open Data — data.nasa.gov
- OpenMCT — nasa.github.io/openmct/
- SPICE Toolkit — naif.jpl.nasa.gov/naif/
- NASA Image API — images-api.nasa.gov
- NASA Exoplanet Archive — exoplanetarchive.ipac.caltech.edu
