# Mission 1.23 -- Mercury-Atlas 7 / Aurora 7: Simulation & Creative Arts

## Track 5: What to Build, Train, Visualize, and Create

**Mission:** Mercury-Atlas 7 / Aurora 7 (May 24, 1962) — SEQUENCE BREAKER
**Hardware Target:** RTX 4060 Ti (8GB VRAM), 60GB RAM, i7-6700K
**Organism:** Oplopanax horridus (Devil's Club)
**Bird (SPS):** Colaptes auratus cafer (Red-shafted Flicker — Drumming)
**Dedication:** Booker T. Washington (April 5, 1856)

---

## A. Simulations

### A1. Python: Retrofire Error Propagation Simulator

**What it is:** A Python simulation of Mercury-Atlas 7's reentry trajectory, showing how yaw error and timing delay propagate into splashdown overshoot. Interactive sliders for yaw angle (0-45°) and timing delay (0-10 s). Real-time visualization of the reentry trajectory on a map projection, with the planned and actual splashdown points.

**Libraries:** numpy, matplotlib, scipy
**Difficulty:** Intermediate
**Duration:** 4-6 hours

### A2. Minecraft: Aurora 7 Three-Orbit Path with Overshoot Landing

**What it is:** A Minecraft build showing Earth at the center, the three-orbit path as a colored block spiral, and two splashdown points: the planned zone (green) and the actual landing (red, 402 blocks away at appropriate scale). A redstone circuit demonstrates fuel depletion — a hopper chain draining items that represent fuel percentage.

**Build time:** 4-6 hours
**Scale:** 1 block = 1 km for the landing zone area

### A3. Blender: Firefly Particle Simulation

**What it is:** A Blender animation showing the hull-tap experiment from Carpenter's perspective. The spacecraft interior, a hand tapping the hull, and particles erupting from the exterior surface — catching sunlight at orbital dawn, glowing as they drift away. Uses Blender particle systems for the ice crystal simulation.

**Duration:** 60 seconds
**Render:** Cycles GPU, 1920x1080
**Build time:** 10-14 hours

### A4. GLSL Shader: Devil's Club Spine Growth Pattern

**What it is:** A procedural GLSL shader generating devil's club morphology — stems with fractal spine distributions, large palmate leaves, and berry clusters. Uses L-system branching rules to generate the plant structure in real time.

**Performance:** 60fps on RTX 4060 Ti at 1080p
**Build time:** 6-8 hours

### A5. Arduino: Fuel Depletion Display with Overshoot Warning ($25)

**What it is:** An OLED display + LED bar + buzzer simulating Aurora 7's fuel consumption over three orbits. A button press "performs a science observation," depleting fuel. When fuel drops below critical thresholds, warnings escalate. At retrofire time, the remaining fuel determines the displayed overshoot distance.

**Build time:** 3-4 hours

### A6. Godot 4: The Carpenter Dilemma — Fuel vs. Science Game

**What it is:** A Godot 4 game where the player is Carpenter. Each orbit presents observation opportunities (fireflies, terrain features, balloon behavior). Each observation costs fuel. The player must decide: observe and spend fuel, or skip and conserve. At retrofire, the remaining fuel determines the yaw precision achievable. Low fuel = high yaw error = large overshoot. The game makes the trade-off visceral.

**Scoring:**
- Science score: based on observations completed
- Landing score: based on splashdown proximity to target
- The optimal strategy requires balancing both
- Carpenter's actual choices are shown for comparison

**Build time:** 12-16 hours
**GDScript, no C#**

### A7. GMAT: Mercury-Atlas 7 Three-Orbit Trajectory + Retrofire Analysis

**What it is:** A GMAT script reconstructing Aurora 7's three-orbit trajectory using actual launch date/time, orbital elements, and the retrofire parameters. Compares nominal retrofire (0° yaw, 0s delay) with actual (25° yaw, 3s delay). Outputs planned vs. actual splashdown coordinates.

**Build time:** 6-8 hours
**Difficulty:** Advanced

---

## B. Machine Learning

### B1. Fuel Consumption Prediction from Pilot Activity Logs

Train a model to predict fuel consumption rate from pilot activity type (attitude maneuver, photography, instrument reading, station-keeping). Training data: all six Mercury orbital flights. The model learns that "science observation" activities consume fuel at 2-3x the rate of "station-keeping." Applied to Carpenter's activity timeline, it predicts the fuel crisis before orbit two ends.

### B2. Reentry Footprint Prediction from Retrofire Parameters

Train a regression model to predict splashdown coordinates from retrofire parameters (timing, attitude, delta-v). Training data: 10,000 simulated retrofires with varying errors. The model learns the sensitivity surface — the mapping from small input errors to large position errors at shallow entry angles.

---

## C. Computer Science: Resource-Constrained Scheduling

Aurora 7's fuel crisis is a real-time scheduling problem with resource constraints:

```
Given:
  - A set of tasks (observations, attitude maneuvers, system checks)
  - Each task has a fuel cost and a science value
  - A fixed total fuel budget
  - A mandatory end-of-mission task (retrofire) with minimum fuel requirement

Find:
  - The subset of tasks that maximizes total science value
  - Subject to: fuel_consumed ≤ fuel_total - fuel_retrofire_minimum

This is a variant of the 0/1 knapsack problem.
```

**Exercise:** Implement the knapsack solver for Carpenter's observation list. Show that the optimal solution includes the firefly investigation (high science value, moderate fuel cost) but excludes some of the lower-value terrain photography (moderate science value, high fuel cost due to attitude changes). Compare the optimal solution to Carpenter's actual choices.

---

## D. Game Theory: The Kraft-Carpenter Disagreement

**Payoff matrix:**

| | Carpenter conserves fuel | Carpenter does science |
|---|---|---|
| **Mission succeeds** | Nominal landing + no science (boring success) | Nominal landing + science (ideal — impossible given fuel constraints) |
| **Mission has issues** | Margin absorbs errors (safe) | Overshoot probable (AURORA 7 actual) |

The game-theoretic insight: Kraft and Carpenter were playing different games. Kraft was playing a minimax game — minimizing the maximum possible loss (pilot death). Carpenter was playing a maximin game — maximizing the minimum guaranteed gain (scientific return). Both strategies are rational. They produce different decisions when the resource is constrained.

---

## E. Creative Arts

### E1. Devil's Club Botanical Illustration (Generative Art)

A detailed botanical illustration of Oplopanax horridus: stem cross-section showing spine distribution, leaf detail at multiple scales, berry cluster, and root system. The illustration transitions from realistic botanical art at the center to abstract fractal spine patterns at the edges — the L-system math of the spine distribution becoming visible. Gold highlights on the inner bark (the medicine) contrast with the aggressive spine armature.

**Output:** SVG + PNG at 4K
**Tools:** p5.js or Processing
**Build time:** 6-8 hours

### E2. Red-shafted Flicker Drumming — Sound Design

**What it is:** A sound design piece mapping the flicker's 25-beat-per-second drumming to Aurora 7's mission timeline.

- Pre-launch: single slow taps (heartbeat rate)
- Launch: accelerating taps
- Orbit 1-2: drumming at full rate on resonant metal (science observations)
- Fuel warning: drumming becomes erratic, off-rhythm
- Retrofire: drumming stops. Three sharp impacts (retrorocket fires)
- Reentry: silence, then wind noise, then splash
- Recovery: a single clear flicker drum, far away

**Tools:** FAUST or SuperCollider
**Duration:** 90 seconds
**Build time:** 4-6 hours

### E3. "402 Kilometers" — Five-Panel Visual Narrative

Panel 1: Launch — Atlas rising from LC-14, Carpenter inside
Panel 2: The Fireflies — ice crystals blooming from a hull tap, golden in orbital dawn
Panel 3: The Fuel Gauge — a dial showing 25%, red zone, Kraft's face at the console
Panel 4: Retrofire — three retro-rockets firing, the spacecraft yawed 25° (visible)
Panel 5: 402 km — the life raft, alone in the Atlantic, the sky above, the capsule bobbing

**Output:** SVG + PNG at 4K, landscape format
**Build time:** 8-12 hours

---

## F. Problem Solving: The Root Cause Chain

Aurora 7's overshoot has a root cause chain:

```
Horizon scanner malfunction
  → Manual attitude reference required
    → Less precise alignment for retrofire
      → 25° yaw error during burn
        → Reduced retrograde delta-v (cos 25° = 0.91)
          → Shallower reentry angle
            → Extended reentry range
              → 402 km overshoot

But also:

Scientific curiosity during orbits 1-2
  → Unscheduled attitude maneuvers
    → Excessive fuel consumption
      → Insufficient fuel for precise retrofire alignment
        → Degraded ability to correct for horizon scanner failure
          → 25° yaw persisted through burn
            → 402 km overshoot
```

Both chains lead to the same outcome. Both are real. The overshoot had two root causes operating simultaneously: a hardware failure (horizon scanner) and a resource depletion (fuel). Either alone might have been manageable. Together, they were 402 km.

---

## G. GSD Self-Improvement

**Skills derived from this mission:**
- `fuel-budget-awareness` — track resource consumption against plan in real time, alert when consumption exceeds threshold
- `competing-objectives-resolver` — when two valid objectives compete for the same resource, surface the trade-off explicitly rather than allowing one to silently consume the other's allocation
- `sensitivity-analysis` — identify operating points where small input errors produce large output errors, and maintain extra margin near those points

**Agent roles derived:**
- `resource-guardian` — an agent whose sole function is monitoring resource consumption and raising alerts when thresholds are crossed (Kraft's role)
- `opportunity-evaluator` — an agent whose function is assessing the value of unplanned opportunities against their resource cost (Carpenter's role)

**Hard rules reinforced:**
- **Challenger Rule:** Carpenter's curiosity was not a safety concern — no one objected on safety grounds during the mission. The Challenger Rule would not have been triggered. But the fuel consumption created a condition where a subsequent hardware failure (horizon scanner) had amplified consequences. The lesson: depleted margins amplify the impact of subsequent failures.

---

*"The flicker drums 25 times per second because that is the rate that identifies it as a flicker. Faster would be a different species. Slower would be a different species. The rate is the identity. Carpenter flew his mission at the rate that identified him as a scientist. Faster would have been reckless. Slower would have been a different pilot. The rate was the mission. The cost was 402 kilometers."*
