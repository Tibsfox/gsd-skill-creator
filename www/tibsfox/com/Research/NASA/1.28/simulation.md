# Mission 1.28 -- Ranger 3: Simulation & Creative Arts Specifications

## Track 5: What to Build, Train, Visualize, and Create

**Mission:** Ranger 3 (January 26, 1962) -- First Block II Ranger, Guidance Error, Missed Moon by 36,793 km
**Hardware Target:** RTX 4060 Ti (8GB VRAM), 60GB RAM, i7-6700K
**Organism:** Ramalina menziesii (lace lichen)
**Bird:** Tachycineta thalassina (Violet-green Swallow, degree 27, The Dynamics)
**Dedication:** Bessie Coleman (January 26, 1892)

---

## A. Simulations -- What to Build Locally

### A1. Python: Ranger 3 Trajectory Error Propagation

**What it is:** A trajectory simulator that computes Ranger 3's actual trajectory (with 375 m/s excess velocity) and compares it to the intended impact trajectory. Three visualizations: (1) Earth-Moon transfer with both trajectories overlaid, (2) closest approach geometry showing 36,793 km miss, (3) error propagation curve showing miss distance as a function of velocity error.

**Why it matters:** Ranger 3 is the textbook case of how small errors at launch become large errors at the target. The sensitivity (98 km per m/s) means that every meter per second of error costs a hundred kilometers at the Moon. This simulation makes that sensitivity tangible.

**Specification:**

```python
# ranger3_trajectory_error.py
# Trajectory error propagation simulator
#
# Phase 1: Planned vs. Actual Trajectory
#   - Compute planned impact trajectory (v = 10,880 m/s at injection)
#   - Compute actual flyby trajectory (v = 11,255 m/s at injection)
#   - Plot both in Earth-centered rotating frame
#   - Mark Moon's position at closest approach
#   - Show 36,793 km gap between actual trajectory and Moon surface
#   - Annotate midcourse correction point and its effect
#
# Phase 2: Sensitivity Analysis
#   - Sweep velocity error from -100 to +500 m/s
#   - Compute miss distance for each (positive = flyby, negative = early impact)
#   - Plot miss distance vs. velocity error
#   - Mark Ranger 3's actual error (375 m/s → 36,793 km)
#   - Shade midcourse motor's correction range (0-50 m/s)
#   - Find the velocity error that produces exactly 0 km miss (impact)
#
# Phase 3: Ranger Fleet Comparison
#   - Plot all six Ranger failures on same sensitivity chart
#   - R1: Agena restart failure (no trajectory)
#   - R2: Agena restart failure (no trajectory)
#   - R3: 375 m/s excess → 36,793 km flyby
#   - R4: Impact achieved but spacecraft dead
#   - R5: Power failure, 725 km miss
#   - R6: Impact achieved but cameras failed
#   - R7: SUCCESS — 4,316 images returned
#   - Show convergence toward target across the program
#
# Libraries: numpy, matplotlib, scipy.integrate
# Difficulty: Intermediate
# Duration: 4-6 hours
```

### A2. Minecraft: The Near-Miss Trajectory

**What it is:** A Minecraft build showing the Earth, Moon, and Ranger 3's trajectory — including the planned impact trajectory (green wool/concrete) and the actual flyby trajectory (red wool/concrete). The two trajectories diverge from a common point (injection) and end at different places: one at the Moon's surface, one 36,793 km past it.

**Specification:**

```
SCALE: 1 block = 3,000 km
  Earth: 4-block diameter sphere (blue/green wool)
  Moon: 1-block sphere at 128 blocks distance
  Planned trajectory: green concrete path from Earth to Moon surface
  Actual trajectory: red concrete path diverging past Moon

Build the gap: at the Moon, the red path passes 12 blocks from the Moon's surface
(36,793 km / 3,000 = ~12 blocks). Place signs at the gap: "36,793 km" and
"One sign. Plus instead of minus."

Build time: 2-3 hours
Difficulty: Beginner
Platform: Java Edition or Bedrock
```

### A3. Blender: Guidance Error Visualization

**What it is:** A 90-second animation showing the sign inversion's effect. Phase 1 (0-30s): the planned trajectory — spacecraft launches, arcs toward Moon, impacts. Phase 2 (30-60s): same launch, but with a red flash at the moment of sign inversion — the trajectory bends slightly, the spacecraft sails past the Moon with the gap growing visible. Phase 3 (60-90s): split-screen showing both trajectories simultaneously, with a counter showing the growing miss distance.

**Specification:**

```
Duration: 90 seconds
Resolution: 1920x1080
Renderer: Cycles (RTX 4060 Ti, ~4 hrs)
Earth: 3D sphere with surface texture
Moon: 3D sphere with crater texture
Spacecraft: Simple cone model (Ranger 3 hexagonal bus)
Trajectory: Bezier curve paths (green=planned, red=actual)
Camera: Fixed wide shot showing Earth-Moon system
Key moment: T=35s, red flash on spacecraft marks sign inversion
Annotation: Text overlay showing miss distance counter from 0 to 36,793 km
```

### A4. GLSL: 4-Mode Screensaver

**What it is:** An XScreenSaver/GSD-OS compatible GLSL shader with four modes:
1. **Lace lichen in fog** — pendant strands rendered as translucent mesh, fog particles drifting through, water droplets collecting on surfaces
2. **Ranger 3 flyby** — spacecraft model approaching Moon, passing at visible distance, continuing into deep space
3. **Sign inversion feedback** — abstract visualization of converging (green) vs. diverging (red) spiral patterns, representing negative vs. positive feedback
4. **Violet-green Swallow pursuit** — swallow flight path with real-time corrections, chasing a moving insect target

### A5. Arduino: Guidance Error Demonstrator ($15)

**What it is:** An LED strip display with a target (green LED at one end). A sequence of LEDs lights up moving toward the target (the trajectory). A switch represents the sign inversion: in the "correct" position, the LEDs converge on the target. In the "inverted" position, the LEDs diverge away from the target. A potentiometer adjusts the "midcourse correction magnitude" — even with maximum correction, the inverted trajectory still misses the target. The student sees that correction cannot overcome a fundamental sign error.

### A6. GMAT: Ranger 3 Trajectory Reconstruction

**What it is:** Full GMAT (General Mission Analysis Tool) reconstruction of Ranger 3's trajectory, including the planned impact trajectory and the actual flyby trajectory with 375 m/s excess velocity. Compute the midcourse correction opportunity window, the optimal correction direction and magnitude, and the resulting trajectory after a 34 m/s correction.

### A7. Radio: Discriminator Circuit ($20)

**What it is:** An FM discriminator circuit — the radio series v1.28. Takes the IF signal from previous missions' amplifier and extracts the audio (or data) modulation from an FM carrier. The discriminator is the component that converts frequency variations back to amplitude variations — it "reads" the modulation that the carrier picked up. The circuit consists of a tuned transformer with secondary resonances offset above and below the IF center frequency, creating a frequency-to-amplitude response curve. When the curve is centered on the carrier, the output is the demodulated signal. When the curve is offset (analogous to a sign error), the output is distorted or inverted.

---

## B. Machine Learning Opportunities

### B1. Error Detection in Guidance Telemetry

Train an anomaly detection model on simulated guidance system telemetry to detect sign inversions before they propagate into trajectory errors. The training data consists of normal-polarity pitch-rate feedback signals; the test data includes both normal and inverted-polarity signals. A simple autoencoder or LSTM model trained on the normal data should flag the inverted signals as anomalous. This is the ML version of the test procedure fix that Ranger 3's failure demanded.

### B2. Fog Prediction for Lichen Habitat Modeling

Train a time-series model (LSTM or Transformer) on PNW coastal weather data to predict fog occurrence from temperature, humidity, wind, and sea-surface temperature. Use the fog predictions to model Ramalina menziesii habitat suitability — the lichen's presence probability is a function of fog frequency. Validate against lichen survey data from the Consortium of North American Lichen Herbaria.

---

## C. Computer Science Concepts

- **Positive vs. negative feedback in software:** The sign inversion maps to software engineering anti-patterns where error handling amplifies errors instead of correcting them (e.g., retry storms, exponential backoff without jitter, cascading failures)
- **Testing polarity, not just magnitude:** Unit tests that check output values but not output signs are the software equivalent of the test procedure that cleared Ranger 3's inverted amplifier
- **Idempotency and sign safety:** Functions that produce different results depending on the sign of an input must be tested at both polarities — the function f(x) = |x| is sign-safe; f(x) = x is not

---

## D. Game Theory

**The Testing Coverage Game:** The component test team has a limited budget of test procedures. Each procedure covers one failure mode. The sign inversion was a failure mode not covered by any existing procedure. The game-theoretic question: given a finite test budget, how do you allocate procedures across failure modes to minimize expected mission loss? The answer depends on the probability distribution of failure modes and the cost of each failure. Ranger 3's sign inversion was a low-probability, high-cost failure that fell outside the test coverage. The optimal strategy includes "exploration" — testing for failure modes that have never been observed, not just the ones that have.

---

## E. Creative Arts

### E1. Story: "The Switching Amplifier" (short fiction)

A story told from the perspective of the switching amplifier that has the wrong sign. The amplifier does not know its sign is wrong — it performs exactly as its components are wired, with precision and consistency. It pushes when it receives a signal, every time. It does not know that it should be pulling. The story explores the concept of an error that is invisible to the component experiencing it — the error exists only in the relationship between the component and the system it serves. The amplifier is not broken. It is incorrectly oriented.

### E2. Audio: "Plus Instead of Minus" (FAUST synthesizer)

A FAUST DSP plugin that generates a tonal sequence converging on a target pitch (negative feedback), then at a random point inverts the feedback sign and the sequence diverges. The listener hears the convergence, the inversion, and the divergence. The moment of inversion is subtle — a single parameter flip — but the auditory result is dramatic. The synthesis uses a phase-locked loop oscillator with adjustable feedback polarity.

### E3. Audio: "Fog Capture" (FAUST generative)

A FAUST DSP plugin that simulates the soundscape of a foggy PNW coastal forest. Base layer: distant ocean surf (low-pass filtered pink noise, 100-400 Hz). Mid layer: wind through branches (bandpass noise, 800-2000 Hz, amplitude-modulated by slow LFO). Upper layer: dripping water from lichen and branches (random impulses at 2-8 kHz, Poisson-distributed, rate increases when "fog arrives" and decreases when "fog departs"). The fog arrival/departure is controlled by a slow stochastic process.

---

## F. Problem Solving

**Root Cause Analysis Pattern: The Dual-Error Trap.** Ranger 3's trajectory deviation was caused by two independent errors acting in the same direction. This is a common pattern in complex system failures — the famous "Swiss cheese model" where multiple layers of protection must all have holes aligned for an accident to occur. The problem-solving lesson: when investigating a failure, do not stop at the first cause found. Ask: is this the entire explanation, or is there a second (or third) error compounding the first? For Ranger 3, the autopilot sign inversion was found first. The guidance computer error was found later. Both were needed to produce the full 375 m/s deviation.

---

## G. GSD Self-Improvement

**New skill derived:** `polarity-verification` — a testing skill that verifies not just the magnitude but the sign/direction/polarity of outputs at interface boundaries. Applied to agent-to-agent communication: when one agent passes a correction to another, verify that the correction is being applied in the intended direction.

**Hard rule reinforced:** MCO Rule — all inter-agent data includes explicit metadata. Ranger 3's sign inversion is the same class of error as MCO's unit confusion. The defense is the same: never pass a raw number at an interface boundary. Always include the sign convention, the unit, and the reference frame.
