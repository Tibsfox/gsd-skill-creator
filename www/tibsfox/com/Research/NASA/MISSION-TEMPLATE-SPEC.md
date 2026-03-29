# NASA Mission Series — Full Mission Template Specification

**Version:** 1.0.0
**Date:** 2026-03-29
**Author:** Miles Tiberius Foxglove
**Location:** Mukilteo, WA
**Engine:** gsd-skill-creator / Rosetta Stone Translation Engine
**Rendered:** tibsfox.com/Research/NASA/
**Repository:** github.com/Tibsfox/gsd-skill-creator (nasa branch)

---

## Overview

Each NASA mission in the catalog (v1.0 through v1.592+) produces a complete mission pack containing outputs from 6 tracks — 5 parallel deep research tracks plus 1 sequential QA gate. Every mission also receives a dedication to a notable person born near the wall-clock date of the release, and a pairing with a non-animal organism from the natural world.

The mission pack is the atomic unit of the NASA series. It is self-contained, batteries-included, and immediately usable by anyone who clones the repository.

---

## Mission Pack Directory Structure

```
www/tibsfox/com/Research/NASA/1.x/
│
├── index.html                    # Styled landing page (browsable at tibsfox.com)
├── README.md                     # Mission overview, quick reference
│
├── track-1-mission/              # TRACK 1: NASA Mission Research
│   ├── research.md               # Deep research (3-5K words, sourced)
│   ├── science.md                # Scientific findings and instruments
│   ├── engineering.md            # Hardware, systems, engineering analysis
│   ├── operations.md             # CAPCOM, telemetry, crew operations
│   ├── timeline.json             # Mission event timeline (machine-readable)
│   └── sources.json              # All citations and references
│
├── track-2-organism/             # TRACK 2: Organism Pairing
│   ├── organism.md               # Deep organism research (2-3K words)
│   ├── resonance.md              # Resonance axes connecting mission + organism
│   └── taxonomy.json             # Species data, location, measurements
│
├── track-3-mathematics/          # TRACK 3: TSPB Mathematics
│   ├── mathematics.md            # Mathematical concepts from this mission
│   ├── worked-examples.md        # Worked examples with real mission parameters
│   ├── tspb-deposits.json        # What gets deposited into The Space Between
│   └── formulas.tex              # LaTeX source for mathematical content
│
├── track-4-curriculum/           # TRACK 4: College of Knowledge
│   ├── curriculum.md             # Department mappings, wing assignments
│   ├── try-session.json          # TRY Session specification (hands-on exercise)
│   ├── diy-project.json          # DIY at-home project specification
│   ├── department-deposits.json  # What gets deposited into which departments
│   └── rosetta-connections.md    # Cross-department translation mappings
│
├── track-5-simulation/           # TRACK 5: Simulation + ML + Creative Arts
│   ├── simulation.md             # What to build on each platform
│   ├── ml-models.md              # ML training opportunities from mission data
│   ├── cs-concepts.md            # Computer science lessons
│   ├── game-theory.md            # Game-theoretic problems and trade-offs
│   ├── creative-arts.md          # Artistic output specifications
│   ├── problem-solving.md        # Engineering methodology patterns
│   ├── gsd-improvements.md       # Skills, agents, chipsets for gsd-skill-creator
│   └── specs/                    # Platform-specific build specs
│       ├── python-notebook.md    # Python simulation specification
│       ├── minecraft-build.md    # Minecraft world/structure specification
│       ├── blender-scene.md      # Blender animation/model specification
│       ├── glsl-shader.md        # GLSL shader specification
│       ├── arduino-project.md    # Arduino hardware project specification
│       └── gmat-script.md        # GMAT mission analysis specification
│
├── track-6-qa/                   # TRACK 6: QA + Verification + Sync
│   ├── verification.md           # QA results, test outcomes
│   ├── tests/                    # Automated tests (Vitest)
│   │   ├── data-integrity.test.ts
│   │   ├── links.test.ts
│   │   ├── math-verification.test.ts
│   │   └── cross-references.test.ts
│   ├── sync-log.md               # Main branch sync record
│   └── checklist.md              # Pre-release verification checklist
│
├── dedication/                   # Release Dedication
│   ├── dedication.md             # Notable person profile + connection to mission
│   └── portrait.json             # Structured data about the honoree
│
├── knowledge-nodes.json          # 8-10 theory concepts (College of Knowledge)
├── data-sources.json             # Open dataset links for this mission
├── organism-pairing.json         # Structured organism data + resonance summary
└── retrospective.md              # Lessons learned, carry-forward items
```

---

## Track Specifications

### Track 1: NASA Mission Research (Parts A-H)

**Purpose:** Establish the complete historical, scientific, engineering, and operational record for this mission.

**Pipeline:**
```
A (History) → B (Science) → C (Education) ─┐
                            D (Engineering) ─┤ Parallel
                            E (Simulation)  ─┤
                            F (Operations)  ─┘
                                    ↓
                            G (8-Pass Refinement + TSPB)
                                    ↓
                            H (NASA Dataset Integration)
```

**research.md requirements:**
- 3,000-5,000 words minimum
- Sourced from NASA.gov, JPL, NSSDC, NTRS
- Timeline with exact dates/times (UTC)
- Crew names and roles (if crewed)
- Full instrument/payload inventory
- Orbital parameters or trajectory details
- Cost data where publicly available
- Notable firsts and records
- Failure analysis (for failed/partial missions)
- Program context (predecessor/successor missions)
- Safety Warden review for disaster narratives (Apollo 1, Challenger, Columbia)

**sources.json format:**
```json
{
  "primary": [
    {"title": "...", "url": "...", "type": "nasa-official", "accessed": "2026-03-29"}
  ],
  "secondary": [...],
  "datasets": [
    {"name": "...", "url": "...", "format": "FITS|PDS|CSV|JSON", "size": "~X MB"}
  ]
}
```

---

### Track 2: Organism Pairing (Non-Animal Parallel)

**Purpose:** Pair each mission with a non-animal organism whose characteristics mirror something essential about the mission.

**Rules:**
- NO animals (birds, mammals, fish, insects, reptiles excluded — covered by 360 engine)
- Allowed: fungi, plants, trees, algae, lichens, mosses, bacteria, archaea, protists, slime molds, coral, sponges, diatoms, phytoplankton, seagrass, ferns, bryophytes, liverworts
- Pacific Northwest species preferred (83% PNW target)
- Each organism used ONCE across entire catalog
- Pairing must have genuine resonance, not forced metaphor

**Reserved pairings (do not reassign):**

| Mission | Organism | Resonance |
|---------|----------|-----------|
| 1.0 NASA Founding | Armillaria ostoyae (honey mushroom) | Hidden network, 2,400 yrs |
| 1.67 Apollo 4 / Saturn V | Hyperion (coast redwood, 380 ft) | Tallest matches tallest |
| 1.74 Apollo 11 | General Sherman (giant sequoia) | THE singular superlative |
| 1.81/1.84 Pioneer 10+11 | Methuselah (bristlecone pine) | Ancient endurance at the edge |
| 1.93/1.94 Voyager 1+2 | Posidonia oceanica (Neptune grass) | Oldest living, still signaling |
| 1.115 Challenger STS-51-L | Rafflesia arnoldii (largest flower) | Beautiful, devastating, brief |
| 1.119 Hubble + 1.178 JWST | Sequoiadendron giganteum | Generational succession (Foxy's tree) |
| 1.135/1.142 ISS | Pando (quaking aspen clone) | One organism, many stems |
| 1.148 Opportunity | Welwitschia mirabilis | 2 leaves for 1,000 yrs, persistence |
| 1.66 Apollo 1 | Prototaxites (extinct fungal columns) | The thing that came before |

**Resonance axes to explore:**
1. Scale resonance — organism size/mass matches mission scope
2. Temporal resonance — lifespan/age matches mission duration or legacy
3. Adaptation resonance — survival strategy matches engineering challenge
4. Network resonance — ecosystem connection matches program connection
5. Discovery resonance — what organism teaches parallels what mission revealed

**organism.md requirements:**
- 2,000-3,000 words minimum
- Scientific name, common name, family
- Location/habitat (specific site if possible)
- Key measurements (size, mass, age, range)
- Discovery history
- Ecological role
- Resonance axes woven through the narrative (not bolted on at end)
- PNW connection explicit where applicable

---

### Track 3: TSPB Mathematics (The Space Between)

**Purpose:** Extract mathematical content from each mission and deposit it into The Space Between textbook.

**The 8 TSPB Layers:**

| Layer | Subject | Key Content |
|-------|---------|-------------|
| 1 | Unit Circle | Periodic phenomena, Euler's formula, phasors |
| 2 | Pythagorean Theorem | Distance, inverse-square law, cosmic distance ladder |
| 3 | Trigonometry | Angles, waves, navigation, camera geometry |
| 4 | Vector Calculus | Orbital mechanics, drag, gravity assists, 3-body problem |
| 5 | Set Theory | Classification, taxonomy, database architecture |
| 6 | Category Theory | Transformations, functors, coordinate frames, FITS |
| 7 | Information Systems Theory | Shannon, signal-to-noise, error correction, encoding |
| 8 | L-Systems | Growth, recursion, fractals, biological modeling |

**Format:** McNeese-Hoag (1959) three-element: **Tables / Formulas / Worked Examples**

**mathematics.md requirements:**
- Identify PRIMARY TSPB layer (1-8)
- Identify SECONDARY layers (1-3 additional)
- Name the specific mathematical concept
- Provide at least one worked example using REAL mission parameters
- Include Python verification code
- Specify which TSPB section receives the deposit (e.g., "4.3 Worked Examples")
- One-sentence resonance statement connecting math to mission significance

**tspb-deposits.json format:**
```json
{
  "mission": "1.x",
  "primary_layer": 4,
  "secondary_layers": [3, 2],
  "concept": "Tsiolkovsky rocket equation",
  "formula_latex": "\\Delta v = I_{sp} \\cdot g_0 \\cdot \\ln\\left(\\frac{m_0}{m_f}\\right)",
  "worked_example": {
    "description": "Apollo 11 TLI burn",
    "parameters": {"Isp": 421, "g0": 9.81, "m0": 137000, "mf": 66900},
    "result": {"delta_v_ms": 2960},
    "python": "import numpy as np\ndv = 421 * 9.81 * np.log(137000/66900)\nprint(f'Delta-v: {dv:.0f} m/s')"
  },
  "tspb_section": "4.3",
  "resonance": "The TLI burn that sent humans to the Moon was a 347-second application of the rocket equation."
}
```

---

### Track 4: College of Knowledge Curriculum

**Purpose:** Route knowledge from each mission into the College department structure.

**Department Architecture: 360 Departments on the Unit Circle**
- Starting base: 44 existing departments
- Expand to 360 as missions reveal knowledge gaps
- Organized on the unit circle with balanced energy distribution
- Dynamic — departments shift position as knowledge accumulates
- No one gets left behind — start from "what is 0, what is 1"

**The pedagogical chain:**
```
What is a 0? What is a 1? (counting)
    ↓
Why are they different? (logic, philosophy)
    ↓
What's between them? (fractions, Cantor sets, fractals)
    ↓
What's beyond them? (infinity, continuity, the universe)
    ↓
How do we see what's hidden? (lensing, instruments, creative insight)
    ↓
How do we share what we find? (communication, community, business)
```

**curriculum.md requirements:**
- Identify PRIMARY departments (top 3)
- Identify SECONDARY departments (2-4 additional)
- Specific curriculum deposits: department → wing → concept
- At least one TRY Session specification
- At least one DIY at-home project specification
- Cross-department connections via Rosetta Stone
- Community business pathway (how this knowledge enables local enterprise)

**try-session.json format:**
```json
{
  "mission": "1.x",
  "title": "Track the ISS with a Homemade Antenna",
  "department": "electronics",
  "wing": "Radio and Communication",
  "difficulty": "intermediate",
  "duration_hours": 3,
  "materials": ["RTL-SDR dongle ($25)", "wire antenna", "laptop"],
  "data_source": "Space-Track TLE data",
  "learning_objectives": ["orbital mechanics basics", "radio propagation", "signal processing"],
  "community_business_connection": "Local radio/electronics repair and education service"
}
```

**diy-project.json format:**
```json
{
  "mission": "1.x",
  "title": "Arduino Mars Weather Station",
  "department": "engineering",
  "wing": "Prototyping and Testing",
  "difficulty": "beginner",
  "estimated_cost_usd": 45,
  "materials": ["Arduino Uno", "BME280 sensor", "OLED display", "breadboard"],
  "data_source": "InSight/MEDA Mars weather data from PDS",
  "builds_toward": "Home environmental monitoring business"
}
```

---

### Track 5: Simulation + ML + Creative Arts

**Purpose:** Map each mission to practical applications in simulation, machine learning, computer science, game theory, creative arts, problem solving, and gsd-skill-creator self-improvement.

**Hardware target:** RTX 4060 Ti (8GB VRAM), 60GB RAM, i7-6700K

**7 Sub-tracks per mission:**

**A. Simulation** — what to build locally
- Python: orbital mechanics, data analysis (poliastro, astropy, scipy)
- Minecraft: terrain, spacecraft, mission environments (WorldPainter, datapacks)
- Blender: animations, 3D models, visualizations (bpy scripting)
- Godot 4: game engine, interactive simulations, 3D physics (GDScript/C#)
- GLSL: shaders for atmospheres, re-entry, radiation, planetary surfaces
- Arduino: telemetry displays, instrument simulators, tracking hardware
- GMAT: mission trajectory recreation and analysis

**B. Machine Learning** — what to train/analyze
- Image classification (terrain, galaxies, craters, minerals)
- Time series (telemetry, orbital decay, atmospheric data)
- Anomaly detection (failure prediction, instrument saturation)
- NLP (mission transcripts, communication patterns)
- Reinforcement learning (landing, navigation, resource allocation)
- Transfer learning from NASA's own ML applications

**C. Computer Science** — what concepts this mission teaches
- Real-time systems, fault tolerance, distributed systems
- Error correction, data compression, protocol design
- Algorithm design, database architecture, type safety

**D. Game Theory** — what trade-offs and optimizations
- Resource allocation (power, fuel, bandwidth, mass)
- Multi-agent coordination (mission control, crew, spacecraft)
- Risk/reward optimization, Nash equilibria, mechanism design

**E. Creative Arts** — what to create
- Data visualization as art
- Sound design (telemetry → audio, mission soundscapes)
- Interactive storytelling (web experiences, games)
- Generative art (shaders, procedural generation)
- Technical illustration (engineering drawings, exploded views)

**F. Problem Solving** — what engineering methodology
- Root cause analysis (failure investigations)
- Design trade studies (competing requirements)
- Constraint satisfaction (launch windows, landing sites)
- Systems engineering (NASA SE handbook patterns)

**G. GSD Self-Improvement** — what the mission teaches our system
- New skills derived from mission patterns
- New agent roles or team topologies
- Chipset configurations exercised
- DACP protocol extensions
- Hard rules (safety-critical patterns)

**Output metrics from 30-mission pilot:**
- 66 skills identified
- 24 agent roles derived
- 14 chipset configurations
- 3 hard rules (Challenger, Columbia, MCO)

---

### Track 6: QA + Verification + Sync (Sequential)

**Purpose:** Verify all content, run automated tests, sync with main branch.

**Runs AFTER tracks 1-5 complete for a mission. BLOCKS release.**

**Verification checklist:**

- [ ] All markdown files render correctly
- [ ] All internal links resolve
- [ ] All external URLs are valid (automated link check)
- [ ] All cross-references between tracks are consistent
- [ ] Mathematical formulas are correct (validate-formulas.py)
- [ ] Organism data is accurate (species name, location, measurements verified)
- [ ] Mission data matches authoritative sources (dates, crew, parameters)
- [ ] Curriculum mappings point to real College departments and concepts
- [ ] Simulation specs are buildable on specified hardware
- [ ] Knowledge nodes are well-formed JSON
- [ ] Data sources are accessible (public zero-trust only)
- [ ] Dedication person is accurately described
- [ ] Retrospective includes carry-forward items
- [ ] No .planning/ files in commit

**Automated tests (Vitest):**
```typescript
// data-integrity.test.ts
// - Validates JSON schemas for all structured files
// - Checks CSV catalog entry exists for this mission version
// - Verifies organism is unique (not used by any other mission)

// links.test.ts
// - Checks all markdown links resolve
// - Verifies data source URLs return 200
// - Confirms cross-track references are valid

// math-verification.test.ts
// - Runs Python verification code from TSPB deposits
// - Checks formula LaTeX compiles
// - Validates worked example arithmetic

// cross-references.test.ts
// - Verifies mission version matches catalog
// - Checks organism pairing is registered
// - Confirms department deposits target real departments
```

**Branch sync:**
```bash
# After QA passes, sync from main
git fetch origin main
git merge origin/main --no-edit
# Resolve any conflicts (document in sync-log.md)
# Verify build still passes after merge
npm run build && npm test
```

**Test accumulation:** Each mission's QA adds tests that verify all prior missions still pass. By mission 100, the test suite covers 100 missions. By mission 592, it's a comprehensive integrity check for the entire catalog.

---

## Dedication System

**For each release:**
1. Note the wall-clock date/time when work begins on the mission
2. Search for notable people born around that date (same day, same week, or same month)
3. Choose the person whose life and work resonates most with the mission's themes
4. Write a dedication connecting their story to the mission

**dedication.md requirements:**
- Person's full name, birth date, birthplace
- Brief biography (500-1,000 words)
- Their notable contribution to the world
- The resonance connection to this NASA mission
- How their work exemplifies the values of the project

**portrait.json format:**
```json
{
  "name": "...",
  "birth_date": "YYYY-MM-DD",
  "birthplace": "...",
  "field": "...",
  "contribution": "...",
  "resonance": "...",
  "release_date": "2026-03-29",
  "mission": "1.0"
}
```

**The person doesn't need to be famous. They need to be notable.** A teacher, an inventor, an artist, a community builder, a scientist, a craftsperson. People who made things better for others.

---

## Versioning

```
1.x              Mission identity (locked to catalog, chronological)
1.x.y            Mission pack subversions (Parts A-H pipeline stages)
1.x.y.z          Deeper trees (decided per mission during execution)
1.x.y.z.w        As deep as needed for complex missions
```

**Branch strategy:**
- `nasa` branch created from `main`
- 360 engine runs on `dev` → merges to `main` as v1.49.155-v1.49.494
- `nasa` branch syncs FROM `main` at every Track 6 QA checkpoint
- When 360 engine completes, `nasa` versions take over on `main`

**Mapping to main release branch:**
```
nasa v1.0-1.592  →  v1.49.x (or v1.50.x at milestone boundary)
```

---

## Data Architecture

**Local-first caching, 2TB budget:**

```
www/tibsfox/com/Research/NASA/data/    (gitignored)
├── common/                            # Shared across missions
│   ├── spice/                         # SPICE kernels
│   ├── catalogs/                      # Star catalogs, asteroid DBs
│   ├── models/                        # Gravity, atmospheric models
│   └── textures/                      # Planetary surface textures
├── cache/                             # API response cache (TTL-managed)
│   ├── horizons/
│   ├── mast/
│   ├── pds/
│   └── openapi/
└── missions/                          # Per-mission cached data
    └── 1.x/
        ├── imagery/
        ├── telemetry/
        ├── trajectory/
        └── samples/
```

**What we commit (the product):**
- Framework code, MCP servers, fetch scripts, parsers
- Example code for every simulation platform
- College curriculum, TRY sessions, DIY specs
- Rosetta Stone translations
- Research docs, mission packs, knowledge nodes
- Rendered HTML at www/tibsfox/com/Research/NASA/

**What we gitignore (rebuildable):**
- Cached FITS files, DEMs, PDS volumes
- API response caches
- Pre-processed large artifacts
- `npm run nasa:data:fetch` rebuilds everything

**Access policy:** Public zero-trust data only. API keys via tibsfox@tibsfox.com. Special access deferred until Fox Companies have business licenses.

---

## MCP Servers (Planned)

| Server | Data Source | Key Tools |
|--------|-----------|-----------|
| nasa-horizons-mcp | JPL Horizons | ephemeris_query, body_search, orbit_elements |
| nasa-pds-mcp | Planetary Data System | search_products, download_volume, parse_label |
| nasa-mast-mcp | MAST (Hubble/JWST/TESS) | search_observations, download_fits, preview |
| nasa-images-mcp | NASA Image Library | search_media, get_asset, browse |
| nasa-ntrs-mcp | Technical Reports | search_reports, get_document |
| nasa-earthdata-mcp | Earth Observing System | search_granules, get_layer |
| nasa-openapi-mcp | api.nasa.gov | apod, mars_photos, neo, donki, epic |
| nasa-spice-mcp | SPICE toolkit | load_kernel, compute_position, transform |
| nasa-helio-mcp | CDAWEB/SDO/SOHO | solar_wind, magnetometer, flare_catalog |

All servers cache to local disk. Cache-first architecture.

---

## Quality Standards

### Three Hard Rules (from mission research)

1. **Challenger Rule** — Any agent reporting a safety concern gets automatic escalation to user. No agent can override another agent's safety call.

2. **Columbia Rule** — Any request for independent verification is granted. "It's probably fine" is not a valid reason to deny verification.

3. **MCO Rule** — All inter-agent data includes explicit metadata (type, unit, format, valid range). No raw numbers at interface boundaries.

### Content Standards

- **Accuracy:** All facts verified against authoritative sources (NASA.gov, NSSDC, JPL)
- **Verbosity:** Documents are verbose and standalone — reader learns the full story without external research
- **Sources:** Every claim has a citation. Every dataset has a URL
- **Safety:** Disaster narratives use official investigation findings only (Rogers Commission, CAIB). No editorializing. Honor crew names
- **Biosignature language:** "Potential biosignatures" only — no confirmed life claims
- **Batteries included:** Someone cloning the repo gets everything they need

---

## Community Business Pathway

Each mission pack includes guidance toward community-level economic participation:

```
Learn (College of Knowledge)
    ↓
Practice (TRY Sessions + DIY Projects)
    ↓
Create (home-based local business)
    ↓
Contribute (community benefit)
```

**Examples from mission content:**
- Electronics (Explorer 1 Geiger counter → home electronics repair business)
- Data science (Kepler transit detection → local data analysis consulting)
- 3D modeling (JWST Blender models → custom 3D printing service)
- Education (Apollo curriculum → STEM tutoring business)
- Environmental monitoring (Landsat + Arduino → local environmental service)
- Creative arts (Hubble imagery → data visualization studio)

**Fox Companies IP:** The knowledge infrastructure that enables community-level economic participation. Not selling data — selling understanding, translation, and pathways.

---

## Catalog Statistics

| Metric | Value |
|--------|-------|
| Total missions | ~592 (552 + audit additions) |
| Epochs | 6 (1958-2040s) |
| Shuttle missions | 135 (all accounted for) |
| Organism pairings | 1:1 (unique per mission) |
| TSPB layers exercised | All 8 |
| College departments | 44 → 360 (expanding) |
| Skills generated (pilot) | 66 |
| Agent roles derived (pilot) | 24 |
| Chipsets configured (pilot) | 14 |
| Hard rules | 3 |
| Open data sources | 40+ |
| MCP servers planned | 9 |
| Simulation platforms | 6 (Python, Minecraft, Blender, GLSL, Arduino, GMAT) |

---

## Execution Cadence

```
For each mission v1.x:
│
├─ Note wall-clock date/time
├─ Find dedication honoree (born near this date)
│
├─┬─ Track 1: Mission Research ──────────┐
├─┤─ Track 2: Organism Pairing ──────────┤
├─┤─ Track 3: TSPB Mathematics ──────────┤  PARALLEL
├─┤─ Track 4: College Curriculum ────────┤
├─┴─ Track 5: Simulation/ML/Arts ────────┘
│
├──── Track 6: QA + Verification ──── SEQUENTIAL (gate)
│     ├── Automated tests pass
│     ├── All links valid
│     ├── Math verified
│     ├── Sync from main
│     └── PASS → proceed  |  FAIL → fix
│
├──── Write retrospective.md
├──── Commit + tag (nasa-v1.x)
├──── Release notes (verbose)
└──── Next mission (v1.x+1)
```

**Estimated per mission:** ~110-175K tokens across ~3-5 sessions
**Estimated total series:** ~592 missions, ~10-15M tokens, months of wall-clock time

---

## The Through-Line

*"Start with shapes. Start with circles and triangles. Start with the unit circle, because it contains within its elegant simplicity the seeds of all of trigonometry, which contains the seeds of harmonic analysis, which describes how waves behave, which describes how everything behaves because at a fundamental level the universe is made of waves."*

The NASA mission catalog is the curriculum. The organism pairings connect it to the living world. The mathematics grounds it in The Space Between. The College routes it to 360 departments of human knowledge. The simulations make it tangible. The dedications make it personal. The community business pathways make it practical. The Fox Companies make it sustainable.

What is the difference between a 0 and a 1? Start there. The rest follows.

---

*"The spaces between the missions are where the meaning lives."*
