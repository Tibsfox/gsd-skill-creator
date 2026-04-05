# Mission 1.32 -- Mariner 2: College of Knowledge Curriculum

## Track 4: Department Mappings, TRY Sessions, DIY Projects

**Mission:** Mariner 2 (August 27 — December 14, 1962) — First Successful Interplanetary Mission
**Primary Departments:** Planetary Science, Engineering, Communications
**Secondary Departments:** Forestry/Ecology, Mathematics, Cultural History
**Organism:** Thuja plicata (Western Red Cedar)
**Bird:** Bombycilla cedrorum (Cedar Waxwing, degree 31, Brenda Lee Eager)
**Dedication:** Amelia Earhart (July 24, 1897)

---

## Department Deposits

### Planetary Science (Primary)

**Wing:** Venus Atmospheric Physics
**Concept:** The greenhouse effect measured at planetary scale — Mariner 2's confirmation of Venus as a 460°C furnace

**Deposit:** Mariner 2's microwave radiometer settled the century-old debate about Venus's surface conditions. Two wavelength channels (13.5 mm and 19 mm) penetrated the cloud layer to measure thermal emission from the surface. The result: ~460°C (733 K), consistent with a massive CO₂ greenhouse effect, ruling out the "cool surface, hot ionosphere" model. The magnetometer's null detection of a planetary field completed the picture: Venus has no magnetic shield, leaving its atmosphere exposed to solar wind erosion. These two measurements — one of extreme heat, one of extreme absence — defined Venus as the anti-Earth.

### Engineering (Primary)

**Wing:** Interplanetary Spacecraft Design
**Concept:** The Mariner bus architecture and the art of surviving a 109-day cruise through multiple system failures

**Deposit:** Mariner 2 established the template for interplanetary spacecraft: hexagonal bus, deployable solar panels, high-gain directional antenna, instrument boom, cold gas attitude control, and cruise/encounter mission phases. The 109-day cruise tested every system beyond its design margins. JPL's real-time failure management — diagnosing problems from telemetry, devising workarounds, uploading new parameters across millions of miles — established the operational paradigm for all subsequent deep space missions.

### Forestry / Ecology (Secondary)

**Wing:** Shade-Tolerant Persistence
**Concept:** Western red cedar's survival strategy of slow growth, chemical defense, and multi-century endurance

**Deposit:** Thuja plicata represents the opposite of the pioneer species strategy. Where Douglas-fir races to the canopy, cedar waits in the shade. Where alder fixes nitrogen and dies, cedar grows slowly and lives for a millennium. The thujaplicin defense — a natural fungicide in the heartwood — means cedar persists after death in ways no other PNW tree can match. This endurance strategy parallels Mariner 2: not the fastest, not the most powerful, but the one that survived everything the journey threw at it.

---

## TRY Sessions

### TRY 1: Calculate the Venus Greenhouse Effect

**Duration:** 30 minutes | **Difficulty:** Beginner | **Department:** Planetary Science

**What You'll Learn:** How to calculate a planet's equilibrium temperature and the greenhouse warming.

```python
import numpy as np

sigma = 5.67e-8  # Stefan-Boltzmann constant

planets = [
    ("Mercury", 9127, 0.12, 440),
    ("Venus",   2601, 0.77, 733),
    ("Earth",   1361, 0.30, 288),
    ("Mars",     586, 0.25, 210),
]

print(f"{'Planet':<10} {'T_eq (K)':<10} {'T_actual':<10} {'Greenhouse'}")
for name, S, A, T_actual in planets:
    T_eq = (S * (1-A) / (4*sigma))**0.25
    print(f"{name:<10} {T_eq:<10.0f} {T_actual:<10} {T_actual - T_eq:+.0f} K")

print("\nVenus: +506 K of greenhouse warming.")
print("Earth: +33 K. Mars: -17 K (thin atmosphere can't even maintain equilibrium).")
print("Mariner 2 measured this. Everything we know about planetary climate starts here.")
```

### TRY 2: Build a Venus Temperature Model with Arduino

**Duration:** 45 minutes | **Difficulty:** Beginner-Intermediate | **Cost:** ~$15

An Arduino with a temperature sensor inside an enclosed box with a desk lamp demonstrates the greenhouse effect. Seal the box with plastic wrap (transparent to visible, opaque to IR). Measure temperature rise vs. an open control.

### TRY 3: Identify Western Red Cedar in Your Neighborhood

**Duration:** 30 minutes | **Difficulty:** Beginner | **Cost:** $0

Look for: drooping branches curving upward at tips, fibrous reddish bark peeling in strips, flat scale-like foliage in spray patterns, "J-shaped" trunk lean in exposed trees. In the PNW, western red cedar is everywhere — parks, yards, forest edges. Crush a sprig of foliage: the sharp aromatic scent is unmistakable.

---

## DIY Projects

### DIY 1: Arduino Venus Atmospheric Pressure Simulator ($25)

Build a sealed chamber with a pressure sensor that measures how increasing CO₂ concentration (from baking soda + vinegar reaction) raises temperature inside the chamber. OLED display shows temperature, pressure, and "Venus equivalent" scaling.

### DIY 2: Microwave Radiometer Concept Demo ($30)

Use an infrared thermometer pointed at various surfaces (ice, boiling water, heated metal) through different "atmospheric" layers (plastic wrap, glass, water). Demonstrate how different wavelengths penetrate different materials — the same principle Mariner 2 used to see through Venus's clouds.

### DIY 3: Plant a Western Red Cedar ($5)

A Thuja plicata seedling planted in USDA zones 5-8 will grow slowly for years, then persist for centuries. Unlike the Douglas-fir from v1.5, this tree tolerates shade — plant it under existing canopy. In 500 years, it will still be there.

---

*"Mariner 2 reached Venus on December 14, 1962 — 109 days after its twin was destroyed. It measured 460°C and no magnetic field. The greenhouse effect was confirmed. Western red cedar endures for millennia because it carries its own preservative. The Cedar Waxwing travels in quiet flocks, consuming berries with coordinated precision. Brenda Lee Eager's voice carried records that outlasted the labels that produced them. Degree thirty-one: the backup that delivers, the understory that endures, the measurement that changes everything."*
