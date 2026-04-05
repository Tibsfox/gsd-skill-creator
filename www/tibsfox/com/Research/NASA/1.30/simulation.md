# Mission 1.30 -- Ranger 5: Simulation & Creative Arts Specifications

## Track 5: What to Build, Train, Visualize, and Create

**Mission:** Ranger 5 (October 18, 1962) -- Solar Panel Failure, 725 km Lunar Miss
**Hardware Target:** RTX 4060 Ti (8GB VRAM), 60GB RAM, i7-6700K
**Organism:** Hylocomium splendens (Stair-step moss)
**Bird:** Stelgidopteryx serripennis (Northern Rough-winged Swallow, degree 29)
**Dedication:** Chuck Berry (October 18, 1926)

---

## A. Simulations -- What to Build Locally

### A1. Python: Battery Depletion + Trajectory Drift

**What it is:** A two-phase simulation showing (1) Ranger 5's battery draining in real time with system shutdowns, and (2) the unpowered trajectory drifting past the Moon at 725 km. Visualization: split screen — left shows power gauge draining with system indicators going dark one by one; right shows the trajectory curving past the Moon without correction.

**Specification:**
```python
# ranger5_lights_out.py
# Phase 1: Battery depletion (0 to 8.73 hours)
#   - Plot battery energy vs time (linear drain)
#   - At each hour, shade another system "dark"
#   - Systems: gamma-ray (dies at T+4h), radar (T+6h), camera (T+7h), comms (T+8h44m)
# Phase 2: Uncorrected trajectory (0 to 72 hours)
#   - Propagate trajectory from injection to Moon flyby
#   - Show: where correction WOULD have been (T+16h)
#   - Show: 725 km closest approach
#   - Show: continuation into heliocentric orbit
# Phase 3: Ranger Block II comparison
#   - Ranger 3: 36,793 km miss
#   - Ranger 4: 0 km (impact, dead)
#   - Ranger 5: 725 km miss, dead
#   - Overlay trajectories on same plot
```

### A2. Minecraft: The 725-km Flyby at Scale

**What it is:** A Minecraft build showing the Moon's surface at 1:10,000 scale with Ranger 5's trajectory passing 72.5 blocks above it. Build the Moon as a curved surface of gray concrete. The spacecraft is a single gold block drifting overhead — close enough to see craters, too dead to photograph them.

### A3. Blender: Lights Out Animation

**What it is:** A 120-second Blender animation. The spacecraft is illuminated, solar panels deployed, instruments active (glowing indicators). At T+75min mark (15 seconds in), the solar panels go dark. System indicators begin shutting off one by one. By 30 seconds, the spacecraft is dark. The remaining 90 seconds: the dark spacecraft drifts past the Moon in silence, close enough to see surface detail reflected on its chrome surfaces. Camera tracks with the dead spacecraft as the Moon slides past. (Cycles render, volumetric lighting for the terminator line.)

### A4. GLSL: 4-Mode Screensaver

**What it is:** Four-mode GLSL screensaver shader for XScreenSaver / GSD-OS:
1. **Stair-step moss growth** — fractal L-system generating annual steps, green on dark
2. **Battery depletion** — power gauge draining, system indicators going dark
3. **725-km flyby** — Moon surface scrolling past with distance counter
4. **Rough-winged swallow flight** — solitary bird silhouette over river, drab brown tones

### A5. Arduino: Power Failure LED Display ($15)

**What it is:** An ascending LED sequence (like v1.5's escape velocity display) that reaches partway up and then goes dark. The LEDs light up in sequence representing Ranger 5's powered flight, then at the 75-minute equivalent position, they begin shutting off from bottom to top (battery drain). When the last LED dies, a single red LED blinks slowly — the capsule's 50 mW beacon tracking signal. Eventually even that goes dark.

### A6. Godot 4: Power Budget Manager

**What it is:** An interactive simulation where the player manages Ranger 5's power budget after the solar panel failure. You have 1,000 Wh of battery power and must decide what to keep running: gamma-ray spectrometer (15W), TV camera (30W), radar altimeter (10W), telemetry (20W), attitude control (25W), command receiver (10W). Turn off systems to extend battery life. Can you keep enough running to execute the midcourse correction before power dies? (Spoiler: the power-switching fault prevents the correction regardless, but the exercise teaches power triage.)

### A7. GMAT: Ranger 5 Trajectory Reconstruction

**What it is:** Full GMAT script reproducing the Atlas-Agena B injection, the uncorrected coast to the Moon, the 725-km flyby, and the heliocentric orbit insertion. Compare with the corrected trajectory that would have impacted the Moon. Show both paths diverging from the correction point.

---

## B. Machine Learning

- **Failure mode classification:** Train a classifier on NASA mission failure reports to categorize failure modes (power, guidance, structural, thermal, software). Input: mission report text. Output: failure category and subsystem.
- **Power system anomaly detection:** Time-series anomaly detection on simulated spacecraft power telemetry. Train on nominal profiles, detect the onset of the short-circuit signature.
- **Moss desiccation prediction:** Regression model predicting moss water content from temperature and humidity time series. Input: hourly T/RH. Output: moss metabolic state (active/dormant).

---

## C. Computer Science Concepts

- **Graceful degradation:** How to design systems that shed non-essential functions under resource constraints (power, memory, bandwidth) while preserving core functionality.
- **Single-point failure analysis:** Identifying components whose individual failure causes total system loss. Fault tree analysis as a graph algorithm.
- **State preservation across power loss:** Non-volatile storage, journaling file systems, and checkpoint/restart — the computational equivalent of the moss's desiccation tolerance.

---

## D. Creative Arts

- **Data visualization:** Battery depletion timeline as a darkening color gradient — spacecraft systems going dark one by one, the visual equivalent of lights turning off in a building.
- **Sound design:** FAUST synth of the power-down sequence — instrument tones dropping out one by one until only the 50 mW beacon remains as a quiet pulse.
- **Story:** "The Steps" — a stair-step moss colony narrates fifty years of growth on a nurse log, each step a year, each year a chapter, until a drought desiccates the colony and the narrative goes silent mid-sentence. The story resumes after a rain.
