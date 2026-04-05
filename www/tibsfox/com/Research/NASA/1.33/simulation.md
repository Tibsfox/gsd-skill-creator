# Mission 1.33 -- Ranger 6: Simulation & Creative Arts Specifications

## Track 5: What to Build, Train, Visualize, and Create

**Mission:** Ranger 6 (January 30, 1964) -- Perfect Trajectory, Dead Cameras
**Hardware Target:** RTX 4060 Ti (8GB VRAM), 60GB RAM, i7-6700K
**Organism:** Thuja plicata (Western Red Cedar)
**Bird:** Bombycilla garrulus (Bohemian Waxwing, degree 32, Luther Rabb)
**Dedication:** Mary Jackson (April 9, 1921)

---

## A. Simulations -- What to Build Locally

### A1. Python: Ranger 6 Trajectory + Paschen Breakdown Visualizer

**What it is:** A two-panel simulation. Panel 1: Ranger 6's trajectory from Earth to Moon, with the camera death event marked at T+107s and the blind transit animated across 65.5 hours. Panel 2: the Paschen breakdown curve with the ascent pressure profile overlaid, showing the moment when camera voltage exceeds breakdown voltage.

**Specification:**

```python
# ranger6_trajectory_paschen.py
#
# Panel 1: Trajectory
#   - Earth at origin, Moon at 384,400 km
#   - Ranger 6 trajectory arc (parking orbit → TLI → transit → impact)
#   - RED marker at T+107s: "CAMERAS KILLED"
#   - GREY trajectory from T+107s to impact: "FLYING BLIND"
#   - GREEN impact at Moon: "PERFECT HIT — 32 km accuracy"
#   - Show camera activation attempt at T-13 min (fails)
#   - Overlay Rangers 3-5 trajectories (misses) for comparison
#
# Panel 2: Paschen Curve
#   - Plot V_breakdown vs pressure (log-log)
#   - Mark Paschen minimum
#   - Horizontal line at V_camera = 10,000 V
#   - Vertical band at 60-110 km altitude pressure range
#   - RED zone where V_camera > V_breakdown: "ARC ZONE"
#   - Animate altitude/pressure as spacecraft ascends
#   - Flash RED when pressure enters Paschen minimum
#
# Libraries: numpy, matplotlib, matplotlib.animation
# Difficulty: Intermediate
# Duration: 4-6 hours
```

### A2. Python: Ranger Program Convergence Analyzer

**What it is:** A comprehensive visualization of all nine Ranger missions showing the convergence from six failures to three successes. Charts targeting accuracy, camera performance, and the institutional learning curve.

**Specification:**

```python
# ranger_program_convergence.py
#
# Chart 1: Timeline of Rangers 1-9
#   - Horizontal axis: time (1961-1965)
#   - Each mission as a vertical bar or icon
#   - Color: RED (failure), YELLOW (partial), GREEN (success)
#   - Rangers 1-6: RED, Ranger 7-9: GREEN
#
# Chart 2: Targeting accuracy over time
#   - Rangers 1-2: did not reach Moon (infinity miss)
#   - Ranger 3: 36,800 km miss
#   - Ranger 4: hit Moon (uncontrolled)
#   - Ranger 5: 725 km miss
#   - Ranger 6: 32 km miss (BEST)
#   - Ranger 7: 15 km from target
#   - Rangers 8-9: improving further
#
# Chart 3: Images returned
#   - Rangers 1-6: 0 (bar chart, all zero)
#   - Ranger 7: 4,316
#   - Ranger 8: 7,137
#   - Ranger 9: 5,814
#   - The wall of zeros, then the breakthrough
#
# Libraries: numpy, matplotlib
# Difficulty: Beginner-Intermediate
# Duration: 2-3 hours
```

### A3. Web: Interactive Paschen Curve Explorer

**What it is:** A browser-based interactive tool where the user adjusts pressure and gap distance with sliders and sees whether a given voltage will arc. The Ranger 6 camera conditions are pre-loaded as a default scenario.

**Specification:**

```
WEB SIMULATION: Paschen Curve Explorer
========================================
- Canvas showing V_breakdown curve (log-log)
- Sliders: pressure (0.001 to 1000 torr), gap (0.01 to 10 cm), voltage (100 to 50000 V)
- Real-time marker on curve showing current p*d value
- Color indicator: GREEN (safe) / RED (arc!)
- Preset button: "Ranger 6 Camera" loads V=10000, d=0.5, p=1 torr
- Preset button: "Sea Level" loads p=760, d=0.5, V=10000
- Preset button: "Hard Vacuum" loads p=0.00001, d=0.5, V=10000
- Shows V_breakdown at current conditions
- Shows margin: how far above or below breakdown
- HTML/CSS/JS, no external dependencies
```

---

## B. Creative Artifacts

### B1. FAUST Audio: Camera Death Transient

**What it is:** A FAUST DSP plugin that sonifies the Ranger 6 camera failure. Three phases: (1) clean ascending tone representing the Atlas launch (0-107s, compressed to 30s), (2) a violent electrical arc burst at staging, (3) 60 seconds of silence with a faint carrier tone — the blind transit, ending in an impact thud with no imaging chirp. The absence IS the sound.

### B2. FAUST Audio: Bohemian Waxwing Flock

**What it is:** A FAUST generative audio plugin producing the thin, high-pitched trilling calls of a Bohemian Waxwing flock. Individual calls at 5-8 kHz, overlapping in rapid succession to create the characteristic buzzing murmur of a feeding flock. Doppler shifts as virtual birds move through the stereo field.

### B3. Circuit: EMC Shielding Demonstrator

**What it is:** A simple circuit that demonstrates electromagnetic coupling and shielding. An unshielded wire picks up transient interference from a relay coil (simulating the Atlas staging transient). A shielded wire, running the same path, rejects the transient. LED indicators show the interference: LED 1 (unshielded) flickers during relay firing; LED 2 (shielded) stays steady.

**Budget:** $12

### B4. Circuit: Paschen Arc Demonstrator

**What it is:** A piezoelectric igniter (from a gas grill lighter) with adjustable electrode gap, mounted in a jar with a hand pump for partial evacuation. At sea level pressure, the piezo cannot arc across a 1-cm gap. At reduced pressure (Paschen minimum), the arc jumps easily. At near-vacuum (difficult to achieve but illustrative), arcing stops again. The U-shaped Paschen curve, demonstrated physically.

**Budget:** $8

### B5. GLSL Screensaver: 4-Mode (Cedar / Ranger 6 / Paschen Arc / Waxwing Flock)

**What it is:** A GLSL fragment shader with four modes cycling on timer:

1. **Cedar Cathedral:** Looking up through a western red cedar canopy — flat spray foliage, drooping branches, filtered light, slow rain
2. **Ranger 6 Transit:** A spacecraft moving through starfield toward a growing Moon. RED flash at T+107s. Then silent, grey transit. Impact flash with no camera data overlay
3. **Paschen Arc:** Abstract visualization of the Paschen breakdown — pressure field, voltage field, and the cascading ionization arc rendered as branching lightning
4. **Waxwing Flock:** Hundreds of small birds (silhouettes) swarming around a mountain ash tree, stripping berries, then departing in a wave

### B6. Story: "The Blind Transit"

**What it is:** A short story told from the perspective of Ranger 6 — a spacecraft that knows it is flying to the Moon with dead cameras. The narrative spans the 65.5-hour transit, the spacecraft's awareness that its instruments are silent, and the final impact that completes the trajectory without completing the mission. The story explores what it means to arrive perfectly at a destination you cannot see.

---

## C. What to Build -- Extended

### C1. Minecraft: Ranger 6 Impact Site

Build the Mare Tranquillitatis impact site with the target zone marked. Place a Ranger 6 spacecraft model (aluminium blocks) descending toward the Moon surface. Six cameras (glass panes) shown as cracked/dark — the dead eyes. The impact crater surrounded by a bullseye of targets showing the 32-km accuracy.

### C2. Blender: Camera Failure Animation

90-second Cycles render. Atlas launch → staging → brief electrical flash → shroud jettison → three-day transit (time-lapse with moon growing) → camera activation command (red warning) → impact. The cameras are rendered as glassy lenses that crack and go dark at T+107s and remain dark for the rest of the animation.

### C3. Godot 4: EMC Challenge Game

Interactive game where the player must route wiring through a spacecraft, choosing shielding levels and isolation methods. Pyrotechnic events create electromagnetic transients. If the camera bus picks up the transient during Paschen minimum, the cameras die. The player must balance mass budget against shielding effectiveness. Historical Ranger 6 configuration fails; the player must redesign for Ranger 7.

### C4. GMAT: Ranger 6 Trajectory Reconstruction

Full trajectory reconstruction from Atlas launch through parking orbit, translunar injection, midcourse correction, and lunar impact. Compare with Rangers 3 (missed by 36,800 km) and 5 (missed by 725 km) to show the navigation improvement across the program.

---

## D. Radio Series Contribution

### D1. Radio: LC Filter Stage ($15)

A simple LC low-pass filter at the boundary between the power bus and sensitive electronics. Demonstrates the principle of transient suppression that was missing on Ranger 6 and added for Ranger 7. Connects to the radio series by adding a power supply filter stage to the growing receiver chain.
