# Mission 1.34 -- Ranger 7: Simulation & Creative Arts Specifications

## Track 5: What to Build, Train, Visualize, and Create

**Mission:** Ranger 7 (July 28-31, 1964) -- First US Close-Up Photos of Moon, 4,308 Images
**Hardware Target:** RTX 4060 Ti (8GB VRAM), 60GB RAM, i7-6700K
**Organism:** Haemorhous cassinii (Cassin's Finch)
**Bird:** Cassin's Finch (degree 33, Larry English)
**Dedication:** John Cassin (September 6, 1813 -- January 10, 1869)

---

## A. Simulations

### A1. Python: Ranger 7 Descent Image Simulator

**What it is:** A Python simulation that generates synthetic Ranger 7 images at decreasing altitudes, showing how resolution improves linearly with decreasing altitude. Uses a fractal crater field generated from the power-law size-frequency distribution to create a realistic lunar surface, then renders "camera views" at each altitude.

**Specification:**
```python
# ranger7_descent_simulator.py
# Generate synthetic descent images showing resolution improvement
# Libraries: numpy, matplotlib, noise (perlin), PIL
# Key: crater SFD follows N(>D) = k * D^(-2)
# Render frames at altitudes: 2110, 1000, 500, 200, 100, 50, 10, 1, 0.5 km
# Each frame shows the same patch of surface at increasing resolution
# Craters appear as resolution reveals them
# Output: sequence of PNG frames + animated GIF
# Duration: 4-6 hours to implement
```

### A2. Blender: Ranger 7 Descent Animation

**What it is:** A Blender animation from Ranger 7's camera perspective, looking down at the approaching lunar surface. The surface starts as a smooth gray disk and progressively reveals craters at every scale as the camera descends. The animation compresses 17 minutes into 60 seconds.

**Specification:**
```
Scene: Camera descending toward procedurally cratered lunar surface
Timeline: 1800 frames at 30fps (60 seconds)
Surface: Displacement-mapped plane with multi-scale crater procedural
HUD overlay: altitude, resolution, frame count, mission elapsed time
Final frame: extreme close-up of surface, then cut to black (impact)
Render: Cycles GPU, 1920x1080, 128 samples denoised
Build time: 14-20 hours
```

### A3. GLSL Shader: Fractal Moon Surface

**What it is:** A real-time GLSL fragment shader that renders a procedurally generated lunar surface with craters at every scale. The viewer can zoom in continuously, and new craters appear at every zoom level — demonstrating the power-law size-frequency distribution.

**Specification:**
```glsl
// ranger7_fractal_moon.frag
// Infinite-zoom lunar surface with power-law crater distribution
// Each zoom level reveals new craters following N(>D) ~ D^(-2)
// Implemented as layered Voronoi noise with brightness modulation
// Mouse/scroll controls zoom level (altitude analog)
// Uniforms: u_time, u_resolution, u_zoom, u_center
// Performance: 60fps on RTX 4060 Ti at 1080p
// Screensaver mode: slow automatic zoom toward random surface point
```

### A4. Godot 4: Ranger Mission Planner

**What it is:** A 2D game where the player configures a Ranger spacecraft (camera resolution, data rate, trajectory) and attempts to maximize the number of useful images returned before impact. Trade-offs: higher resolution cameras produce better images but fewer total images; faster descent gives less imaging time; wider field of view gives more context but less detail.

**Specification:**
```
Gameplay: Configure spacecraft → launch → watch descent → score
Scoring: total useful pixels returned (resolution × coverage × quality)
Trade-offs mirror real Ranger engineering decisions
Includes "Ranger 1-6 mode" showing each historical failure
Build time: 12-18 hours, GDScript
```

### A5. Arduino: Descent Altimeter with Resolution Display

**What it is:** An Arduino project with an ultrasonic distance sensor and OLED display that simulates Ranger 7's descent. The sensor measures distance to a surface (table, floor), and the display shows the equivalent Ranger 7 altitude and image resolution. Moving the sensor closer demonstrates resolution improvement.

**Specification:**
```
Hardware: Arduino Nano, HC-SR04, SSD1306 OLED, LED bar graph
Mapping: 1 cm = 100 km (so 21 cm = camera activation at 2,110 km)
Display: altitude, resolution, estimated crater count visible
LED bar: image quality indicator
Cost: ~$25
Build time: 3-4 hours
```

---

## B. Machine Learning

### B1. Crater Detection Network

**What it is:** Train a CNN to detect and count craters in lunar images, starting with Ranger 7 photographs and validating against modern LROC data of the same terrain. The student learns object detection on a scientifically meaningful dataset.

```
Model: YOLO-tiny or custom CNN for circular feature detection
Training data: LROC images with manually labeled craters (public datasets)
Validation: Apply to Ranger 7 images and compare human counts
Key insight: the power-law distribution means most craters are small
  — the network must be sensitive to faint, small circles
GPU: RTX 4060 Ti, training time ~30 minutes
```

---

## C. Creative Arts

### C1. Story: "The Seventeen Minutes"

**What it is:** A short story told from the perspective of Ranger 7's camera system — the seventeen minutes between activation and impact. The camera sees the Moon resolve from blur to landscape, describes what it records, and ends at impact.

### C2. Sound Design: "Descent"

**What it is:** A 90-second audio piece mapping Ranger 7's descent to Cassin's Finch vocalizations. The finch's warbling song accelerates and intensifies as altitude decreases, with each phrase revealing new acoustic detail (mimicry elements emerging) as resolution improves. Ends with a sharp impact sound and silence.

```
Tools: SuperCollider or FAUST
Mapping: altitude → pitch (higher = closer), resolution → harmonic complexity
Duration: 90 seconds
Build time: 4-6 hours
```

### C3. Generative Art: "4,308 Frames"

**What it is:** A poster-sized generative art piece containing 4,308 small circles arranged in a spiral pattern, each circle sized proportionally to the resolution of the corresponding Ranger 7 image. The outermost circles (first frames) are large and blurry. The innermost circles (last frames) are tiny and sharp. The spiral converges to a single point: impact.

```
Tools: p5.js or Processing
Output: SVG at poster resolution (4K+)
Build time: 4-6 hours
```

---

*"Ranger 7's cameras operated for seventeen minutes and thirteen seconds. In that window, 4,308 images fell from spacecraft to Earth like a cascade of finch notes from a mountain perch — each one sharper than the last, each one revealing detail the previous one missed. The simulation track for this mission is about descent: getting closer, seeing more, resolving the blur into knowledge. Every tool — Python, Blender, GLSL, Godot, Arduino — lets the student experience the descent personally. Move the sensor closer and watch the resolution improve. Zoom the shader and watch new craters appear. The physics is the same at every scale: resolution is a function of distance, and distance is a function of persistence."*
