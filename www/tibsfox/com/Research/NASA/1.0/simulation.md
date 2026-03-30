# Mission 1.0 -- NASA Agency Founding: Simulation & Creative Arts Specifications

## Track 5: What to Build, Train, Visualize, and Create

**Mission:** NASA Agency Founding (October 1, 1958)
**Hardware Target:** RTX 4060 Ti (8GB VRAM), 60GB RAM, i7-6700K
**Organism:** Armillaria ostoyae (Honey Mushroom, Malheur National Forest, Oregon)

---

## A. Simulations -- What to Build Locally

### A1. Python: NACA Airfoil Generator

**What it is:** A Python tool that generates any NACA 4-digit or 5-digit airfoil profile — the series that NACA standardized and that are still used worldwide today. The student types in a 4-digit code and gets the airfoil shape, pressure distribution, and lift coefficient estimate.

**Specification:**

```python
# naca_airfoil.py
# Generate and plot any NACA 4-digit airfoil
#
# The NACA 4-digit system:
#   NACA MPXX where:
#     M = maximum camber as % of chord (0-9)
#     P = position of max camber in tenths of chord (0-9)
#     XX = maximum thickness as % of chord (01-40)
#
#   Example: NACA 2412
#     M=2 (2% camber), P=4 (at 40% chord), XX=12 (12% thick)
#
# Equations (from NACA Report 460, 1933):
#   Thickness distribution:
#     y_t = (t/0.2) * (0.2969√x - 0.1260x - 0.3516x² + 0.2843x³ - 0.1015x⁴)
#   Camber line:
#     y_c = (m/p²)(2px - x²)           for 0 ≤ x ≤ p
#     y_c = (m/(1-p)²)((1-2p) + 2px - x²)  for p ≤ x ≤ 1
#
# Outputs:
#   - Airfoil profile plot (upper and lower surface)
#   - Pressure coefficient distribution (panel method)
#   - Lift coefficient vs angle of attack (thin airfoil theory)
#   - SVG export of the airfoil shape
#   - Comparison: plot any two NACA airfoils side by side
#
# Libraries: numpy, matplotlib
# Difficulty: Intermediate
# Duration: 2-3 hours
```

**Key learning moment:** The student types "2412" and watches a wing shape appear. Then they change one digit — "4412" — and see how increasing camber changes the shape. They're doing what NACA engineers did at Langley in the 1930s, systematically varying parameters to understand flight.

**Extension:** Add the NACA 5-digit series (230XX format) and compare to modern supercritical airfoils. Show that NACA's systematic approach — change one parameter, measure the effect — is still the foundation of computational aerodynamics.

---

### A2. Python: Mycelial Network Growth Simulator

**What it is:** A simulation of Armillaria ostoyae rhizomorph growth through a forest, using agent-based modeling. The fungus spreads from a central point, finds trees, colonizes them, and uses their nutrients to grow further.

**Specification:**

```python
# armillaria_growth.py
# Agent-based model of Armillaria ostoyae network expansion
#
# Model:
#   - Grid: 500x500 cells representing 1 km² of forest
#   - Trees: randomly distributed (density: 200-400 per hectare)
#   - Rhizomorphs: extend from colonized trees at ~1 m/year
#   - Growth rules:
#     1. Rhizomorph tip advances toward nearest uncolonized tree
#     2. When rhizomorph contacts a tree, colonization begins (1-3 year delay)
#     3. Colonized tree feeds nutrients back through network
#     4. More nutrients = more rhizomorph tips = faster expansion
#   - Disturbance: random fire events clear patches, creating succession
#   - Time scale: 100-2400 years (to reach Malheur organism's age)
#
# Outputs:
#   - Animated growth visualization (network expanding over centuries)
#   - Network topology map (graph of connected trees)
#   - Growth rate vs time (should show exponential then plateau)
#   - Total area colonized vs time
#   - Network statistics: degree distribution, clustering coefficient
#
# Libraries: numpy, matplotlib, networkx
# Difficulty: Advanced
# Duration: 6-8 hours
```

**Key learning moment:** Watching the network grow slowly at first (few connections, limited resources), then accelerate as more trees are colonized and more nutrients flow through the network. The growth curve mirrors NACA's expansion: slow for decades (1915-1940), then rapid when resources increased (WWII and beyond).

---

### A3. Minecraft: Langley Wind Tunnel Complex

**What it is:** A Minecraft build of NACA's Langley Memorial Aeronautical Laboratory, including the Variable-Density Tunnel (1922), the Full-Scale Tunnel (1931), and the slotted-throat transonic tunnel.

**Specification:**

```
MINECRAFT BUILD: Langley Wind Tunnels
=======================================

Scale: 1 block = 0.5 meters (2:1 for detail)

Structures:
  Variable-Density Tunnel (1922):
    - Cylindrical pressure shell: 30 blocks diameter, 60 blocks long
    - Concrete exterior, iron interior
    - Test section: 5-foot (10 block) diameter visible through glass panes
    - Pressure gauges: item frames with custom maps
    - Model mount: armor stand with elytra (wing shape)

  Full-Scale Tunnel (1931):
    - Massive open-circuit design: 200 blocks long, 100 blocks wide
    - Double-return layout (figure-8 airflow path)
    - Test section: 60 x 30 blocks (30 x 60 feet real)
    - Propeller fans: large oak/birch blades on fence posts
    - Observation windows: glass pane walls
    - An actual aircraft model in the test section (built from colored wool)

  Slotted-Throat Transonic Tunnel:
    - Converging-diverging nozzle shape: sandstone blocks
    - Throat section with slots: alternating blocks and air gaps
    - Instrumentation room: redstone lamp consoles

  Administration Building:
    - Red brick (terracotta), 3 stories
    - Office interiors: bookcases, crafting tables (desks), lanterns
    - Conference room with a map wall (item frames)

  Hampton Roads Backdrop:
    - Flat Virginia terrain: grass and oak trees
    - Chesapeake Bay visible to the east (water)
    - Roads connecting buildings (gravel paths)

Redstone Mechanics:
  - Fan animation: observer-piston clock spins blades in the Full-Scale Tunnel
  - Pressure display: comparator circuits show "airspeed" via lamp arrays
  - Secret room: office door labeled "October 1, 1958" — inside, the same
    office with a NASA logo replacing the NACA seal (the transition)

Build time: 8-16 hours
Materials: ~5,000 blocks
```

---

### A4. Blender: NACA Cowling Animation

**What it is:** A Blender animation showing how the NACA cowling transformed radial engine performance — a 3D visualization of one of NACA's most important contributions to aviation.

**Specification:**

```
BLENDER SCENE: The NACA Cowling Effect
========================================

Animation: 45 seconds at 30fps (1,350 frames)

Scene 1 (0-15s): Exposed radial engine
  - 9-cylinder radial engine model (cylinders arranged in a star)
  - Airflow streamlines (particle system) showing turbulent flow
  - Drag coefficient displayed: Cd ≈ 0.40
  - Color: exposed metal (copper/steel materials)

Scene 2 (15-30s): Cowling slides over engine
  - NACA cowling (smooth, aerodynamic shell) morphs onto the engine
  - Airflow streamlines reorganize: turbulent → smooth laminar flow
  - Drag coefficient drops: 0.40 → 0.12 (animated counter)
  - Speed increase: visualized as the aircraft in the background accelerates
  - Color: polished aluminum material

Scene 3 (30-45s): Side-by-side comparison
  - Split screen: uncowled vs cowled
  - Airflow visualization for both
  - Text overlay: "NACA Technical Report 313 (1928)"
  - "The cowling did not just reduce drag. It proved that systematic
    research could transform aviation."

Models required:
  - 9-cylinder radial engine (simplified)
  - NACA cowling shell (revolution of NACA airfoil section)
  - Airflow particles (hair dynamics or geometry nodes)
  - Background aircraft silhouette

Render: Cycles GPU, 1920x1080, 128 samples denoised
Estimated render: 3-5 hours on RTX 4060 Ti
```

---

### A5. GLSL Shader: Mycelial Network Visualization

**What it is:** A real-time shader visualizing an underground mycelial network — glowing rhizomorphs spreading through dark soil, branching, connecting, pulsing with nutrient flow.

```glsl
// armillaria-network.frag
// Real-time mycelial network growth visualization
//
// Visual: Dark soil background, glowing golden rhizomorphs
//   spreading in organic branching patterns from a central point.
//   Nutrient pulses travel along the network as brighter waves.
//   Occasional fruiting bodies (mushrooms) appear at network nodes.
//
// Techniques:
//   - Space colonization algorithm for branching (simplified to shader)
//   - Voronoi-based branching structure
//   - Noise-displaced glow for organic appearance
//   - Traveling wave for nutrient pulse
//   - Color: golden (#C4A35A) on dark earth (#0A1F0A)
//
// Target: 60fps at 1080p, screensaver/wallpaper ready
// GSD-OS: animated desktop background showing the "hidden network"
```

---

### A6. Arduino: Wind Speed Indicator

**What it is:** An Arduino project that measures wind speed using a simple anemometer (cup or hot-wire) and displays it as both a numeric readout and a visual bar graph, mimicking the instruments at Langley's wind tunnels.

**Specification:**

```
ARDUINO PROJECT: Langley Wind Speed Indicator
===============================================

Hardware:
  - Arduino Uno R3 ($25)
  - SSD1306 OLED display 128x64 ($8)
  - Adafruit anemometer ($45) OR DIY: DC motor as generator ($3)
  - 10-segment LED bar graph ($3)
  - Voltage divider resistors 10KΩ, 20KΩ ($0.20)
  - Breadboard + jumper wires ($5)
  Total: ~$44 (with DIY anemometer) or ~$86 (with commercial)

Display Layout:
  ┌──────────────────────────┐
  │ LANGLEY WIND TUNNEL      │
  │ SPEED: 12.3 m/s          │
  │ ▓▓▓▓▓▓▓░░░░░░░░ 41%     │
  │ Re: 845,000  M: 0.036   │
  └──────────────────────────┘

  Bottom line shows Reynolds number and Mach number
  calculated from the measured wind speed — the same
  dimensionless numbers NACA engineers used every day.

Behavior:
  1. Anemometer spins, generating voltage proportional to wind speed
  2. Arduino reads analog voltage, converts to m/s
  3. OLED displays speed, Reynolds number (for a standard test model), Mach number
  4. LED bar graph shows speed as visual indication
  5. Serial output: CSV of timestamped readings for later plotting

DIY anemometer option:
  - Small DC motor (from old toy) acts as generator
  - Attach 3 ping-pong ball halves as cups to a shaft
  - Calibrate: known wind speed (car window at measured speed) vs voltage

Build time: 3-4 hours
Difficulty: Beginner-Intermediate
```

---

### A7. Godot 4: Interactive Wind Tunnel

**What it is:** A Godot 4 experience where the player places different airfoil shapes in a virtual wind tunnel and observes the airflow, pressure distribution, and lift/drag forces.

**Specification:**

```
GODOT 4 PROJECT: NACA Wind Tunnel Simulator
=============================================

Scene: Cross-section view of a wind tunnel test section
  - Airfoil shape in center (interchangeable)
  - Streamline particles flowing past the airfoil
  - Pressure color map on airfoil surface (blue=low, red=high)
  - Force arrows: lift (up) and drag (right)
  - Numeric readouts: Cl, Cd, L/D ratio

Interaction:
  - Dropdown to select airfoil: NACA 0012, 2412, 4412, 6412, 23012
  - Slider: angle of attack (-5° to 20°)
  - Slider: wind speed (10-100 m/s)
  - Toggle: streamlines vs smoke visualization
  - At high angle of attack: flow separation visible (stall)

Physics:
  - Panel method for pressure distribution (pre-computed lookup tables)
  - Particle system for streamlines (follow velocity field)
  - Thin airfoil theory for Cl at low angles
  - Stall modeled as sudden lift drop above critical angle

The student sees WHY the NACA 4-digit system works:
  changing the first digit (camber) changes the lift.
  Changing the last two digits (thickness) changes the drag.
  The systematic approach IS the innovation.

Deliverables:
  - Godot 4 project
  - Linux x86_64 export
  - HTML5/WebAssembly export (browser playable)

Build time: 10-15 hours
Difficulty: Intermediate
```

---

## B. Machine Learning

### B1. Airfoil Shape Optimization (Genetic Algorithm)

```
Model: Genetic algorithm optimizing NACA 4-digit parameters
Objective: Maximize L/D ratio for given flight conditions
Genome: [M, P, XX] (3 parameters, each 0-9 or 01-40)
Fitness: Cl/Cd computed from panel method
Population: 100 individuals, 50 generations
Crossover: single-point, mutation rate 5%

The student watches evolution rediscover the airfoil shapes
that NACA engineers found through systematic testing.
The GA arrives at similar solutions — proving that the
parameter-variation methodology was computationally sound.

Libraries: numpy, matplotlib, DEAP (evolutionary algorithms)
Duration: 3-4 hours
```

### B2. Network Growth Prediction

```
Model: Graph neural network predicting Armillaria spread
Input: Forest grid with tree locations and soil properties
Output: Predicted colonization probability per cell
Training data: Synthetic from the growth simulator (A2)
Architecture: GraphSAGE (spatial convolution over tree network)

The student learns that network growth follows patterns
that ML can detect — the same patterns that made NACA's
growth from 3 labs to NASA predictable in retrospect.
```

---

## C. Computer Science

### C1. Organizational Network Analysis

NACA's three-laboratory structure is a distributed system: Langley (aerodynamics), Ames (high-speed), Lewis (propulsion). No central command of research programs — each lab had autonomy within the "research-authorize" framework.

**Exercise:** Model NACA as a graph. Nodes = researchers/labs. Edges = collaborations, paper co-authorships, personnel transfers. Analyze: degree centrality (who connects the most?), betweenness centrality (who bridges between labs?), clustering coefficient (how tightly are labs connected internally vs across labs?).

Data source: NACA technical report authors from the NTRS database.

### C2. Parameter Space Search

The NACA 4-digit airfoil system is a 3-parameter search space (M, P, XX). NACA engineers explored this space systematically — one parameter at a time, holding others fixed.

**Exercise:** Implement three search strategies for finding the best L/D airfoil: (1) NACA's systematic parameter sweep, (2) random search, (3) gradient descent. Compare convergence rates. The student discovers that systematic search (NACA's method) is not the fastest but is the most informative — it maps the entire landscape, not just the peak.

---

## D. Game Theory

### D1. The NACA Budget Game

NACA operated with modest budgets for 43 years ($5M/year average). When Sputnik created a crisis, the budget exploded (NASA FY1959: $330M). The question: should an organization optimize for steady, quiet excellence (NACA model) or position itself for explosive growth when crisis strikes?

**Payoff matrix:**

| | Crisis Occurs | No Crisis |
|---|---|---|
| **Steady excellence** | Ready to scale (NASA founding) | Continued quiet contributions |
| **Visible ambition** | Already funded, but may have wrong capabilities | High funding, political support |

**Exercise:** Model as a repeated game. NACA "played" steady excellence for 43 rounds, then cashed in when the crisis arrived. Was this optimal? What if the crisis had never come?

---

## E. Creative Arts

### E1. GLSL Screensaver: Mycelial Network

**What it is:** A Linux-compatible screensaver showing an underground mycelial network growing, branching, and pulsing with golden light against dark earth.

```
SCREENSAVER: Hidden Network
=============================

Visual:
  - Dark earth background (#0A1F0A with noise texture)
  - Golden rhizomorphs (#C4A35A) growing from center
  - Branching pattern: Voronoi-based with noise displacement
  - Nutrient pulses: brighter golden waves traveling along network
  - Occasional fruiting body: small mushroom silhouette at nodes
  - Growth is continuous: network always expanding at edges
  - Old branches: dimmer, thicker (established network)
  - New branches: brighter, thinner (growing tips)

Technique:
  - Distance field to nearest Voronoi edge = branch proximity
  - Perlin noise displacement for organic irregularity
  - Traveling sine wave for nutrient pulse
  - Time-based growth front (expanding radius)

Color palette:
  - Soil: #0A1F0A to #1A3A1A (dark earth gradient)
  - Rhizomorph: #C4A35A core, #E8D9A8 glow
  - Fruiting body: #DAA520 (honey gold)
  - Pulse: #FFFFFF at 10% opacity traveling along branches

Target: 60fps at 1080p, XScreenSaver compatible
Also: GSD-OS animated wallpaper, standalone ShaderToy

Build time: 6-8 hours
```

### E2. Data Visualization: NACA to NASA Budget Timeline

```
VISUALIZATION: "The Hidden Network Revealed"
==============================================

Layout: Timeline (1915-1965), budget on Y axis (log scale)
  - NACA era (1915-1958): thin golden line, steady ~$5-50M/year
  - Transition (1958): vertical red line, NACA→NASA label
  - NASA era (1958-1965): explosive growth to $5.9B (1966 peak)
  - Key events annotated: WWII buildup, Sputnik, Mercury, Apollo

The visual story: 43 years of invisible growth (the mycelium),
then Sputnik (the fruiting body), then explosive visible expansion.
The golden line IS the Armillaria metaphor rendered in data.

Format: Static HTML + D3.js
Data source: NASA SP-4102 budget tables (open access)
Build time: 4-6 hours
```

### E3. Technical Illustration: NACA Cowling Cross-Section

```
ILLUSTRATION: NACA Cowling and Radial Engine
=============================================

Style: Period-accurate technical drawing (1928 NACA aesthetic)
  - Cross-section showing engine cylinders inside cowling
  - Airflow streamlines (hand-drawn style, bezier curves)
  - Annotations: cooling air inlet, exhaust path, drag reduction
  - Reference: NACA Technical Report 313

Format: SVG, Inkscape
Build time: 4-6 hours
```

### E4. Sound Design: "October 1, 1958"

```
SOUND DESIGN: "The Transition"
================================

Timeline (3 minutes):
  0:00-0:30  Wind tunnel drone (steady, industrial, Langley ambient)
             Low-frequency hum of fans, air rushing through sections
  0:30-1:00  Typewriter clicks layered over tunnel sound
             (NACA engineers writing reports, methodical, unhurried)
  1:00-1:30  Radio news broadcast filter: "...Sputnik..."
             Typewriters accelerate, new voices enter
  1:30-2:00  Transition: tunnel drone shifts pitch upward
             Old sounds fade, new sounds emerge
             A rocket engine rumble builds from subsonic
  2:00-2:30  Full rocket launch roar — overwhelming the wind tunnel
             The hidden network is now visible
  2:30-3:00  Fade to: wind tunnel drone returns, but different
             Higher pitch, more complex harmonics
             It's the same wind tunnel, but now it's NASA's

Tools: Audacity, SuperCollider
Build time: 4-6 hours
```

### E5. Generative Art: "2,385 Acres"

**What it is:** A Processing/p5.js sketch generating the Armillaria network pattern. Starting from a single point, golden tendrils spread outward using space colonization algorithm. The final image covers 2,385 virtual acres.

```
GENERATIVE ART: "2,385 Acres"
================================

Concept: Space colonization algorithm grows a branching network
from a single seed point. "Attraction points" (trees) are
randomly distributed. Branches grow toward nearest attraction
point, consuming it when reached. The network self-organizes
into an organic branching pattern.

Parameters:
  - Attraction points: 2,385 (one per acre)
  - Branch segment length: 3 pixels
  - Influence radius: 50 pixels
  - Kill distance: 10 pixels
  - Color: #C4A35A on #0A1F0A (mycelium on earth)
  - Canvas: 3840x2160 (4K print)

The finished image:
  - Golden branching network on dark ground
  - Dense center (oldest growth), sparse edges (growing front)
  - Each node was an "acre" — a tree that was reached and colonized
  - The pattern looks exactly like a real mycelial map

Output: High-res PNG, animated version (growth timelapse) as MP4
Tools: p5.js or Processing
Build time: 3-5 hours
```

---

## F. Problem Solving

### F1. Organizational Transformation Analysis

**What it is:** Apply NASA's own systems engineering framework (NASA SE Handbook) to analyze the NACA→NASA transformation as a systems engineering problem.

```
SYSTEMS ENGINEERING EXERCISE
==============================

System: NACA → NASA organizational transformation
Requirement: Create a civilian space agency capable of human spaceflight
Constraints: Existing NACA infrastructure, 8,000 employees, 3 labs,
             Cold War urgency, congressional timeline

Apply the SE V-model:
  Left side (decomposition):
    - Stakeholder needs → System requirements → Subsystem requirements
    - What did Eisenhower need? What did Congress specify?
    - How did that decompose into organizational structure?

  Right side (integration):
    - Component testing → Integration testing → System validation
    - How was NASA "tested"? (Mercury program = integration test)
    - Was the system validated? (Apollo = system validation)

The student produces a one-page SE analysis using NASA's own tools
to analyze NASA's own creation. The recursion is the lesson.
```

---

## G. GSD Self-Improvement

### G1. New Skill: Systematic Parameter Exploration

```
Skill derived from NACA's methodology:
  When exploring a design space (e.g., testing different configurations),
  use NACA's approach: vary ONE parameter at a time, hold others fixed,
  record all results systematically. This is slower than random search
  but maps the entire landscape.

GSD application: When a plan has multiple uncertain parameters,
test them individually before combining. The NACA airfoil method:
systematic, empirical, pragmatic.
```

### G2. New Skill: Hidden Network Detection

```
Skill derived from Armillaria/NACA parallel:
  When analyzing a codebase or organization, look for the
  "hidden network" — the infrastructure that exists but isn't
  visible. Dependencies that work silently. Systems that only
  become visible during crisis.

GSD application: Before modifying infrastructure code,
map the dependency network. The mycelium is invisible
until you step on a mushroom.
```
