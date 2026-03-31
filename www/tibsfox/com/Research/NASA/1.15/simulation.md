# Mission 1.15 -- TIROS-1: Simulation & Creative Arts Specifications

## Track 5: What to Build, Train, Visualize, and Create

**Mission:** TIROS-1 (April 1, 1960)
**Hardware Target:** RTX 4060 Ti (8GB VRAM), 60GB RAM, i7-6700K
**Organism:** Aurelia aurita (moon jellyfish)
**Bird:** Brachyramphus marmoratus (Marbled Murrelet, degree 15)
**Dedication:** Sergei Rachmaninoff (April 1, 1873)

---

## A. Simulations -- What to Build Locally

### A1. Python: TIROS-1 Image Geometry Calculator

**What it is:** A Python simulation that computes the ground footprint of TIROS-1's cameras as a function of orbital altitude, camera field of view, and viewing geometry. The student adjusts the satellite's altitude, the camera's field of view, and the look angle (angle between the camera boresight and nadir), and watches the ground footprint change in shape, size, and resolution. The simulation traces a complete camera exposure from a spinning satellite, showing how the spin creates a sweeping footprint and how the duty cycle limits observation time.

**Why it matters:** Every Earth observation satellite designed since TIROS-1 begins with this calculation: what area does the camera see, at what resolution, from what altitude? The simulation makes the tradeoffs tangible. A wider field of view sees more area but at lower resolution. Higher altitude sees more area but resolution degrades. Off-nadir viewing (looking to the side instead of straight down) increases coverage but distorts the footprint and degrades resolution at the edges. These are the fundamental tradeoffs of remote sensing, and they were first encountered with TIROS-1.

**Specification:**

```python
# tiros1_image_geometry.py
# Image geometry calculator: what does a camera see from orbit?
#
# Process:
#   1. Define TIROS-1 camera parameters (FOV, resolution, focal length)
#   2. Define orbital parameters (altitude, inclination, spin rate)
#   3. Compute ground footprint for nadir-pointing geometry
#   4. Compute footprint for off-nadir angles (spin-stabilized sweep)
#   5. Compute ground resolution at nadir and at edge of FOV
#   6. Show resolution degradation with altitude and look angle
#   7. Calculate camera duty cycle from spin geometry
#
# Parameters (user-adjustable):
#   h_km: 300-2000 (nominal 725, TIROS-1 average altitude)
#   FOV_deg: 5-120 (nominal 104, wide-angle camera)
#   n_lines: 100-2000 (nominal 500, vidicon resolution)
#   spin_rpm: 1-30 (nominal 12, TIROS-1 spin rate)
#   look_angle_deg: 0-60 (nominal 0, nadir pointing)
#
# Visualization:
#   - Plot 1: Ground footprint map
#     Earth surface (Mercator or orthographic projection)
#     Camera footprint drawn as a polygon on the surface
#     Color-coded by ground resolution (green=good, red=poor)
#     Shows how footprint stretches at edges due to obliquity
#     Labels: swath width (km), footprint area (km^2)
#
#   - Plot 2: Resolution vs altitude
#     X-axis: altitude (300-2000 km)
#     Y-axis: ground resolution (km/line)
#     Two curves: wide-angle (104 deg) and narrow-angle (12 deg)
#     TIROS-1 altitude marked with vertical line
#     Modern satellite altitudes marked for comparison:
#       Landsat (705 km), GOES (35786 km), ISS (420 km)
#
#   - Plot 3: Spin-stabilization duty cycle
#     Circular diagram showing one rotation of the satellite
#     Earth-pointing arc highlighted (where cameras see ground)
#     Space-pointing arc dimmed (wasted observation time)
#     Duty cycle percentage displayed: ~29% for TIROS-1
#     Images per orbit calculated: tape capacity (32) vs
#       theoretical max (~1190 at one per spin)
#
#   - Plot 4: Coverage buildup over one day
#     World map showing ground tracks for 14.5 orbits
#     Footprints overlaid for each orbit where camera was active
#     Shows the gaps between tracks (24.9 deg at equator)
#     Color intensity showing how many times each region is imaged
#     Latitude band limits (48.4 N/S) clearly marked
#
# Libraries: numpy, matplotlib, cartopy (optional, for map projections)
# Difficulty: Beginner-Intermediate
# Duration: 2-3 hours
```

**Key learning moments:**
1. The resolution-coverage tradeoff. In Plot 2, the student sees that TIROS-1's wide-angle camera had 3.6 km resolution at 725 km altitude, while the narrow-angle camera had 0.3 km resolution from the same altitude. But the wide-angle camera covered an area 65x larger (1,800 km swath vs 150 km swath). Meteorology needed coverage; the 3.6 km resolution was sufficient for seeing clouds (which are big). Reconnaissance would have needed the narrow-angle camera -- and indeed, the classified CORONA satellites used narrow-angle optics to achieve meter-scale resolution at the cost of coverage.
2. The spin-stabilization penalty. In Plot 3, the student sees that TIROS-1 wasted 71% of each rotation pointing at space. The tape recorder held only 32 frames per orbit (~99 minutes), but the camera could theoretically capture one frame every 5 seconds (one per spin). The tape, not the camera, was the bottleneck -- 32 frames out of a theoretical maximum of ~1,190. The satellite was starved for storage, not for photons.
3. The latitude limitation. In Plot 4, the student sees the blank zones above 48.4 N and below 48.4 S -- the polar regions that TIROS-1 could not observe. The coverage pattern shows dense observation in mid-latitudes and the tropics, with clear gaps between ground tracks that fill in over several days. The student discovers that one satellite cannot provide continuous coverage -- you need either a constellation of polar-orbiting satellites or a geostationary satellite (or both, which is the modern operational approach).

---

### A2. Python: Ground Track and Coverage Map

**What it is:** A simulation that propagates TIROS-1's orbit and plots the ground track on a world map, showing how the Earth's rotation shifts each successive track westward and how the coverage builds up over the 78-day mission. The student can adjust the orbital elements (altitude, inclination, eccentricity) and watch the ground track pattern change, discovering why sun-synchronous orbits, Walker constellations, and repeat-ground-track orbits were developed as improvements over TIROS-1's approach.

**Why it matters:** The ground track is the satellite's fingerprint on the Earth's surface -- it determines which locations are observed, how frequently, and at what local time. TIROS-1's ground track was determined by launch constraints (Cape Canaveral, Thor-Able), not by science requirements (which demanded polar, sun-synchronous coverage). The simulation lets the student explore how different orbital choices lead to radically different coverage patterns, connecting launch vehicle capability to scientific utility.

**Specification:**

```python
# tiros1_ground_track.py
# Orbital ground track and coverage simulation
#
# Process:
#   1. Define TIROS-1 orbital elements (a, e, i, RAAN, omega, M)
#   2. Propagate orbit with J2 perturbation (RAAN drift, argument
#      of perigee drift)
#   3. Compute subsatellite point (latitude, longitude) at each
#      time step
#   4. Plot ground track on world map
#   5. Overlay camera footprints (wide-angle: 1800 km swath)
#   6. Accumulate coverage over multiple orbits/days
#   7. Compare TIROS-1 coverage to sun-synchronous and polar orbits
#
# Parameters (user-adjustable):
#   a_km: 6700-7200 (nominal 7095.5, TIROS-1 semi-major axis)
#   e: 0-0.1 (nominal 0.0044)
#   i_deg: 0-100 (nominal 48.4)
#   RAAN_deg: 0-360 (nominal: computed from launch date)
#   duration_hours: 1-1872 (nominal 1872 = 78 days)
#   swath_km: 100-3000 (nominal 1800, wide-angle camera)
#
# Visualization:
#   - Plot 1: Single orbit ground track
#     World map (equirectangular projection)
#     Ground track as sinusoidal curve oscillating between +/-48.4 deg
#     Subsatellite point (red dot) moving along track
#     Camera footprint (transparent blue rectangle) around point
#     Direction of motion indicated with arrow
#
#   - Plot 2: 24-hour ground track (14.5 orbits)
#     All ground tracks overlaid, each shifted ~24.9 deg west
#     Shows the coverage pattern and gaps
#     Equatorial gaps labeled: "24.9 deg = 2,770 km gap"
#
#   - Plot 3: 78-day cumulative coverage
#     World map color-coded by number of observation opportunities
#     Blue (0-5), green (5-20), yellow (20-50), red (50+)
#     Latitude limits at +/-48.4 clearly visible
#     Coverage statistics: % of Earth surface observed at least once
#
#   - Plot 4: Comparison panel (3 orbits side by side)
#     Left: TIROS-1 (48.4 deg inclination) -- mid-latitude only
#     Center: Sun-synchronous (97.8 deg) -- global, consistent lighting
#     Right: TIROS-9 (96.4 deg) -- first near-polar TIROS
#     Same time period (24 hours) for all three
#     Visually demonstrates why polar orbits were essential
#
# Libraries: numpy, matplotlib, cartopy (optional)
# Difficulty: Intermediate
# Duration: 3-4 hours
```

**Key learning moments:**
1. The ground track regression. The student watches consecutive ground tracks shift westward by 24.9 degrees and discovers that TIROS-1 could not revisit the same location at the same time on consecutive days -- the orbit was not sun-synchronous. Each day, the satellite observed the same latitudes but at different local times, making it impossible to compare images taken on consecutive days under the same illumination conditions. This was a serious limitation that was addressed by switching to sun-synchronous orbits (TIROS-9, 1965).
2. The inclination determines everything. In Plot 4, the contrast between 48.4-degree and 97.8-degree inclination is stark. At 48.4 degrees, the satellite sees nothing above Canada or below South America. At 97.8 degrees, it covers the entire globe, including both poles. The student discovers that the difference between "limited" and "global" coverage is a single orbital parameter -- inclination -- that was constrained by the launch vehicle, not by the satellite design.
3. The J2 effect. The student can observe the RAAN drifting at -3.3 degrees per day, slowly rotating the orbital plane relative to the stars. For TIROS-1, this was a nuisance. For sun-synchronous orbits, the J2 precession is deliberately matched to the Earth's orbital motion around the Sun (approximately +0.986 degrees per day), keeping the orbital plane at a fixed angle to the Sun-Earth line. The same perturbation that was a problem for TIROS-1 became a tool for its successors.

---

### A3. Web: Cloud Pattern Viewer (Simulated Vidicon Camera)

**What it is:** An interactive web application that simulates the view from TIROS-1's vidicon camera. The student sees a simulated Earth surface with cloud patterns (generated procedurally), viewed through a circular camera viewport that spins as the satellite rotates. The image builds up line by line, mimicking the vidicon tube's raster scan. The student adjusts altitude, spin rate, and camera FOV, watching the image change in coverage and resolution. A "capture" button freezes the current frame, and the student can compare multiple frames to see how the view changes from orbit to orbit.

**Specification:**

```
WEB APPLICATION: TIROS-1 Vidicon Camera Simulator
==================================================

Technology: HTML5 Canvas + JavaScript (no frameworks)
Target: Modern browser, 1920x1080

Main view:
  CAMERA VIEWPORT (center, 60% of screen):
    Circular frame representing the vidicon tube
    Image builds up with visible raster scan lines
    (500 lines, drawn sequentially from top to bottom)
    Each line appears over ~4ms (2 seconds total for full frame)

    Scene content (procedurally generated):
    - Ocean: dark blue-gray, with subtle wave texture
    - Land: medium gray-brown (continents/coastlines)
    - Clouds: white to bright gray, multi-scale:
      * Large-scale: cyclone comma patterns (500-1500 km)
      * Mesoscale: cloud streets (50-200 km spacing)
      * Convective cells: cumulus clusters (10-50 km)
    - Noise: grain overlay simulating vidicon noise
    - Vignetting: slight darkening at edges (vidicon artifact)

    The viewport ROTATES slowly (one full rotation per 5
    seconds at 12 RPM), and the Earth scene is visible only
    when the camera points downward (29% duty cycle).
    During the remaining 71%, the viewport shows black
    (space) with scattered stars.

  ORBIT STRIP (top, 15% of screen):
    Linear strip showing the current orbit position
    Earth shown as a band of latitude
    Current position marked with a moving dot
    Camera footprint shown as a rectangle on the strip
    Day/night terminator shown
    Ground track of previous orbits shown as faded lines

  CONTROL PANEL (right, 25% of screen):
    - Altitude slider: 300-2000 km (default 725)
      As altitude increases: footprint grows, resolution degrades
    - FOV toggle: Wide (104 deg) / Narrow (12 deg)
      Wide: large footprint, coarse detail
      Narrow: small footprint, fine detail
    - Spin rate slider: 1-30 RPM (default 12)
      Faster spin = shorter Earth-viewing window per rotation
    - "CAPTURE" button: Freezes current frame in gallery
    - "NEXT ORBIT" button: Advances to next orbit crossing
    - Image counter: "Frame 1 of 22,952"
    - Resolution readout: "3.6 km/line" (updates with altitude)
    - Footprint readout: "1,800 x 1,800 km" (updates with FOV)

  CAPTURED IMAGE GALLERY (bottom, scroll):
    Thumbnails of captured frames, labeled with:
    - Frame number
    - Latitude/longitude of center
    - Resolution
    - Cloud features visible

Interactions:
  - Clicking in the viewport shows the lat/lon and ground
    resolution at that point
  - Hovering over a cloud feature shows a tooltip identifying
    the cloud type (cyclone, street, cell, cirrus shield)
  - "COMPARE" mode: place two captured frames side by side
    to show how the scene changed between orbits

Weather generation:
  Procedural cloud generation using layered Perlin noise:
  - Layer 1: large-scale (500-1500 km) for cyclones and fronts
  - Layer 2: mesoscale (50-200 km) for cloud streets and bands
  - Layer 3: convective (10-50 km) for cumulus clusters
  - Cyclone patterns: logarithmic spiral cloud bands
  - Cloud streets: parallel rows aligned with a wind direction
  - ITCZ: continuous band of convection near the equator
  - Clear zones: subtropical highs at 20-30 deg latitude

Deliverables:
  - Single HTML file, self-contained
  - < 1200 lines total
  - 30 fps minimum for smooth spin animation
  - Raster scan effect visible during frame capture
  - Realistic vidicon noise and vignetting
```

**Key learning moment:** The student experiences the frustration of spin-stabilization firsthand. The camera spins past the Earth in a blur, and only during the brief downward-pointing phase can an image be captured. Most of the time, the camera sees nothing but space. The student discovers that 22,952 images in 78 days -- roughly 294 images per day -- represents only a fraction of the theoretically possible observations. The tape recorder (32 frames per orbit x 14.5 orbits per day = 464 frames/day maximum) and the spin duty cycle (29%) together limited the actual observations. And yet, 22,952 images was enough to transform meteorology. The student learns that "enough" depends on what you're measuring: for synoptic weather patterns that change over days, 294 images per day is abundant.

---

### A4. Web: Orbital Coverage Calculator

**What it is:** An interactive calculator that computes the coverage statistics for a satellite in any circular orbit. The student enters altitude, inclination, and camera FOV, and the calculator shows: the ground track on a world map, the percentage of Earth covered per orbit, the revisit time for any given latitude, and the number of satellites needed for continuous coverage. Preset buttons allow quick comparison between TIROS-1 (one satellite, 48.4 deg, limited coverage) and modern systems (GOES geostationary, NOAA polar, Starlink LEO constellation).

**Specification:**

```
WEB APPLICATION: Orbital Coverage Calculator
=============================================

Technology: HTML5 Canvas + JavaScript (no frameworks)
Target: Modern browser, 1920x1080

Main view:
  WORLD MAP (upper 65% of screen):
    Equirectangular projection with coastlines
    Ground track drawn as sinusoidal curves
    Camera footprint swaths shaded along the track
    Color-coded by observation count:
      0 observations: dark gray
      1-5: blue
      6-20: green
      21-50: yellow
      50+: red
    Latitude limit lines at +/- inclination
    Day/night terminator (adjustable with time slider)

  STATISTICS PANEL (lower left, 20%):
    - Coverage after 1 orbit: ____%
    - Coverage after 1 day: ____%
    - Coverage after 1 week: ____%
    - Maximum revisit time at equator: ____ hours
    - Maximum revisit time at max latitude: ____ hours
    - Latitude coverage: ___N to ___S
    - Area observed per day: ___ million km^2

  CONTROL PANEL (lower right, 15%):
    Sliders:
    - Altitude: 200-36000 km (log scale)
    - Inclination: 0-100 degrees
    - Camera FOV: 5-180 degrees
    - Number of satellites: 1-100
    - Number of orbital planes: 1-20
    - Simulation duration: 1 orbit - 30 days

    Presets:
    - "TIROS-1" (725 km, 48.4 deg, 104 deg, 1 sat)
    - "NOAA Polar" (850 km, 98.7 deg, 110 deg, 2 sats)
    - "GOES" (35786 km, 0 deg, 17.4 deg, 2 sats)
    - "Starlink" (550 km, 53 deg, N/A, 1584 sats in shell 1)
    - "Full Coverage" (auto-compute: minimum satellites for
      continuous global coverage at given altitude/FOV)

  TIME CONTROLS (bottom bar):
    - Play/pause button for animated accumulation
    - Time slider: 0 to simulation duration
    - Speed control: 1x to 1000x
    - Current time display (UTC and elapsed)

Calculations:
  For each time step:
  1. Propagate orbit (Keplerian + J2 for RAAN drift)
  2. Compute subsatellite point (lat, lon)
  3. Compute camera footprint polygon on Earth surface
  4. Increment observation count for covered grid cells
  5. Update statistics

  For "Full Coverage" preset:
  - Uses Walker delta constellation formula
  - Finds minimum T (total satellites), P (planes),
    F (phase factor) for continuous coverage
  - Displays the constellation pattern

Deliverables:
  - Single HTML file, self-contained
  - < 900 lines total
  - Smooth map rendering with coastlines
  - Real-time coverage accumulation at 60 fps
  - Accurate J2-perturbed ground tracks
```

**Key learning moment:** Clicking "TIROS-1" and then "NOAA Polar" shows the dramatic difference in coverage: TIROS-1 at 48.4-degree inclination covers 75% of the Earth's surface area (the band between 48.4 N and 48.4 S); the NOAA polar satellites at 98.7 degrees cover 100%. Clicking "GOES" shows a completely different approach: one satellite, motionless over the equator, seeing an entire hemisphere continuously but from 36,000 km altitude (much lower resolution). Clicking "Full Coverage" reveals the minimum constellation for continuous global observation, and the student discovers that it takes approximately 48-66 satellites in polar orbits at 700 km to achieve sub-hour revisit -- a fact that explains the size of modern satellite constellations.

---

## B. Machine Learning -- What to Train

### B1. Cloud Type Classification from Simulated Satellite Imagery

**What it is:** Train a convolutional neural network to classify cloud types in simulated TIROS-1-resolution imagery. The training data consists of downsampled modern satellite images (degraded to 3.6-km resolution to match TIROS-1) labeled with cloud types: cumulonimbus, stratocumulus, cirrus, cumulus, stratus, clear sky. The student discovers that even at TIROS-1's crude resolution, cloud types are distinguishable -- validating the meteorologists' claim in 1960 that 3.6-km resolution was sufficient for weather analysis.

```
Model: CNN classifier (cloud type from degraded satellite imagery)

Input:
  - 64x64 pixel patches from satellite imagery
  - Degraded to 3.6 km/pixel (matching TIROS-1 resolution)
  - Source: GOES-16 ABI imagery downsampled by factor of ~14
  - Grayscale (matching TIROS-1's single visible channel)

Output: Cloud type (6 classes)
  - Cumulonimbus (deep convection, thunderstorm)
  - Stratocumulus (low, layered, with cellular structure)
  - Cirrus (high, thin, ice crystal)
  - Cumulus (fair-weather, isolated puffy clouds)
  - Stratus (uniform low layer)
  - Clear sky (ocean or land, no clouds)

Training data:
  - 50,000 labeled patches from 2020-2025 GOES-16 archive
  - Labels from ISCCP (International Satellite Cloud
    Climatology Project) cloud classification
  - Augmented with rotation, flipping, brightness jitter

Architecture:
  - 4-layer CNN: Conv(32)->Pool->Conv(64)->Pool->Conv(128)
    ->Pool->FC(256)->FC(6)
  - Alternatively: use a pre-trained ResNet-18, replace the
    last layer, fine-tune on the degraded imagery

Expected results:
  - Accuracy: ~80-85% (degraded resolution makes fine
    distinctions harder)
  - Confusion matrix: cumulonimbus and stratocumulus are
    most often confused (both are bright at 3.6 km resolution)
  - Clear sky and cirrus are easiest to classify (highest contrast)

The student learns:
  - 3.6 km resolution is sufficient for broad cloud classification
    (confirming the 1960 design choice)
  - Modern deep learning on TIROS-1-quality data achieves accuracy
    comparable to human meteorologists in 1960 (~80%)
  - The main information loss at 3.6 km is texture: convective
    cells, cloud streets, and cirrus filaments are smoothed away
  - Resolution matters most for distinguishing cloud types that
    differ primarily in texture (cumulus vs stratocumulus)

Libraries: numpy, torch, torchvision, matplotlib
GPU: Optional (small model trains on CPU in minutes)
Difficulty: Intermediate
```

---

## C. Computer Science -- The Raster Scan Algorithm

### C1. Vidicon Camera Raster Scan Simulation

The vidicon tube produces an image by scanning an electron beam across a photoconductive target in a raster pattern. This is the same scan pattern used in broadcast television, CRT monitors, and laser printers. The algorithm is fundamental to display technology.

```
ALGORITHM: Raster Scan Image Acquisition

The problem:
  Given: a 2D intensity field I(x, y) representing the scene
  Produce: a 1D signal V(t) representing the video output

  The raster scan converts a 2D image into a 1D time series
  by sweeping a sensing element (electron beam) across the
  image in a systematic pattern:

  For each line y from 0 to N_lines-1:
    For each sample x from 0 to N_samples-1:
      V(t) = I(x, y)
      t = t + dt

  The 1D signal V(t) is transmitted, and the receiver
  reconstructs the 2D image by reversing the scan:

  For each line y from 0 to N_lines-1:
    For each sample x from 0 to N_samples-1:
      I_reconstructed(x, y) = V(t)
      t = t + dt

  The transmitter and receiver must be synchronized --
  both must know when each line begins (line sync) and
  when the frame begins (frame sync). In analog TV, sync
  pulses are embedded in the video signal. In TIROS-1,
  sync was derived from the satellite's timing reference.

TIROS-1 implementation:
  - 500 active lines per frame
  - ~500 samples per line (limited by video bandwidth)
  - 2-second frame time (for tape playback)
  - Line rate: 500 lines / 2 s = 250 lines/s
  - Sample rate: 500 samples/line * 250 lines/s = 125,000 samples/s
  - Nyquist bandwidth: 62,500 Hz (~62.5 kHz)
  - Actual video bandwidth: ~100 kHz (oversampled)

Python implementation:

  import numpy as np
  import matplotlib.pyplot as plt

  def raster_scan(image, n_lines=500):
      """Convert a 2D image to a 1D video signal via raster scan.

      image: 2D numpy array (the scene)
      n_lines: number of scan lines

      Returns: 1D numpy array (the video signal)
      """
      h, w = image.shape
      # Resample to n_lines rows
      line_indices = np.linspace(0, h-1, n_lines, dtype=int)
      signal = []
      for y in line_indices:
          row = image[y, :]
          signal.extend(row)
      return np.array(signal)

  def reconstruct(signal, n_lines=500, n_samples=500):
      """Reconstruct a 2D image from a 1D video signal.

      signal: 1D numpy array (the video signal)
      n_lines: number of scan lines
      n_samples: samples per line

      Returns: 2D numpy array (the reconstructed image)
      """
      expected_length = n_lines * n_samples
      if len(signal) < expected_length:
          signal = np.pad(signal, (0, expected_length - len(signal)))
      image = signal[:expected_length].reshape(n_lines, n_samples)
      return image

  # The raster scan algorithm is O(N) in the total number of
  # pixels -- it visits each pixel exactly once, in order.
  # The algorithm's simplicity is its strength: it maps naturally
  # to hardware (the electron beam sweeps continuously) and
  # to serial transmission (the pixels are sent in order).
  #
  # Modern alternatives (progressive vs interlaced scanning,
  # JPEG's zigzag scan order, Hilbert curve scanning) improve
  # on the raster scan for specific applications, but the
  # basic left-to-right, top-to-bottom scan remains the
  # foundation of image acquisition and display.

  # The key insight: the raster scan is a space-filling curve.
  # It maps the 2D plane to a 1D line, visiting every point
  # exactly once. The choice of scan pattern determines the
  # correlation structure of the 1D signal: adjacent samples
  # in the signal correspond to adjacent pixels along the scan
  # line (high correlation), but the first sample of each line
  # is adjacent to the last sample of the previous line in the
  # signal but far apart in the image (low correlation). This
  # discontinuity at line boundaries is why raster-scanned
  # images compress better with 2D methods (JPEG) than with
  # 1D methods (run-length encoding along scan lines).
```

---

## D. Game Theory -- The Weather Observation Resource Allocation Problem

### D1. Satellite Tasking: Where to Point the Camera

TIROS-1 had a tape recorder that held 32 frames per orbit. Each orbit passed over many regions of meteorological interest. The ground controllers had to decide: which 32 images to capture from the hundreds of potential targets during each orbit? This is a resource allocation problem with imperfect information.

```
GAME THEORY: Satellite Tasking as an Allocation Problem

Players:
  - Ground controllers (the decision-makers)
  - Nature (the weather -- which regions have the most
    meteorologically interesting features)

Strategy space:
  - 32 image slots per orbit
  - ~15 minutes of Earth-viewing time per orbit (duty cycle)
  - Each image captures a 1,800 x 1,800 km area
  - The satellite passes over multiple weather systems per orbit

The controller's dilemma:
  1. Known weather systems: Pre-existing cyclones, fronts,
     and tropical disturbances tracked from earlier orbits
     and surface reports. Imaging these provides updates on
     known phenomena. Value: moderate (incremental improvement
     to existing forecasts).

  2. Discovery: Regions not recently observed where new
     weather systems may have formed. Imaging these could
     reveal previously unknown phenomena. Value: potentially
     high (a newly forming cyclone detected early), but also
     potentially zero (clear skies, nothing new).

  3. Calibration: Images of known features (coastlines,
     desert boundaries) used to verify camera pointing and
     image quality. Value: low per image, but essential for
     maintaining data quality.

The optimal strategy balances exploitation (imaging known
weather systems) with exploration (searching for new ones).
This is the classic explore-exploit tradeoff, formalized
by the multi-armed bandit problem.

For TIROS-1 with 32 frames per orbit:
  - Allocate ~20 frames to known weather systems (exploitation)
  - Allocate ~10 frames to unobserved regions (exploration)
  - Allocate ~2 frames to calibration targets

This allocation shifts based on forecast confidence:
  - High confidence in the current weather picture:
    favor exploration (less value in reimaging known systems)
  - Low confidence (e.g., after a data gap):
    favor exploitation (update knowledge of known systems)

Modern operational satellites automate this tradeoff using
scheduling algorithms that optimize a utility function
balancing temporal coverage, spatial coverage, and
meteorological priority. TIROS-1's controllers did it by
expert judgment, informed by the latest weather maps and
the satellite's predicted ground track.
```

---

## E. Creative Arts -- What to Compose, Write, and Render

### E1. GLSL Shader: "Cyclone from Orbit"

A fragment shader that renders a view of Earth from 700 km altitude, showing a procedurally generated cyclone system with comma-shaped cloud bands, spiral arms, clear eye, and the surrounding ocean and coastlines. The shader mimics the TIROS-1 aesthetic: grayscale, slight grain, vidicon vignetting, visible raster scan lines.

```
SHADER SPECIFICATION: Cyclone from Orbit (TIROS-1 Aesthetic)

Resolution: 1920x1080
Palette: Grayscale (matching TIROS-1 vidicon output)

Layers:
  1. Earth surface:
     - Ocean: dark gray (#2A2A2A), with subtle wave noise
     - Land: medium gray (#5A5A5A), with coastline edges
     - Simplified geography (no texture maps; procedural)

  2. Cloud field:
     - Cyclone: logarithmic spiral bands of white
       Center at (lat, lon), radius 500-1500 km
       Spiral arms wrapping counterclockwise (NH)
       Eye: clear center 30-50 km diameter
       Comma shape: dense cloud shield wrapping around the low
     - Background clouds: layered Perlin noise at multiple scales
     - Clear zones: subtropical highs (20-30 deg latitude)
     - ITCZ: equatorial convective band

  3. TIROS-1 camera effects:
     - Circular viewport (vidicon tube edge)
     - Raster scan lines (horizontal, 500 lines, subtle)
     - Vidicon noise: film grain overlay
     - Vignetting: darkening at edges of circular field
     - Slight blur: limited resolution (3.6 km/pixel equivalent)

  4. Animation:
     - Slow cloud rotation (cyclone spins, clouds drift)
     - Raster scan visible as a brighter line sweeping
       from top to bottom every 2 seconds
     - Occasional "line noise" artifacts (horizontal streaks)
       mimicking vidicon interference

Uniform inputs:
  u_time: float (animation time)
  u_cyclone_lat: float (cyclone center latitude, -48.4 to 48.4)
  u_cyclone_lon: float (cyclone center longitude)
  u_altitude: float (viewing altitude, 500-2000 km)

Output: grayscale image resembling a TIROS-1 photograph
```

### E2. Short Fiction: "Twenty-Two Thousand, Nine Hundred Fifty-Two"

A short story (800-1200 words) told from the perspective of a meteorologist at the Weather Bureau in Suitland, Maryland, receiving the first TIROS-1 images on April 1, 1960. The meteorologist has spent twenty years drawing weather maps by hand from surface reports and radiosonde data -- connecting the dots, inferring the patterns, arguing with colleagues about the position of fronts. The first TIROS-1 image arrives by facsimile from the ground station. For the first time, the meteorologist sees the comma cloud they have been drawing from theory. It looks exactly like their maps -- and nothing like their maps. The scale is wrong (bigger than imagined). The detail is wrong (more structure than expected). The beauty is wrong (it's not supposed to be beautiful, it's a chart). The story ends with the meteorologist pinning the image to the wall next to two decades of hand-drawn maps and realizing that their career has just split in half: before this image, and after.

### E3. Musical Connection: Rachmaninoff's Second Concerto as Weather Dynamics

A structured listening guide (500-800 words) that maps the three movements of Rachmaninoff's Piano Concerto No. 2 in C minor to the life cycle of a mid-latitude cyclone as photographed by TIROS-1:

- **Movement I (Moderato, C minor):** Genesis and intensification. The opening chords accumulate like warm air rising along a front. The first theme erupts like the cyclone reaching maturity. The development section is the storm's passage. The recapitulation is the clearing.
- **Movement II (Adagio sostenuto, E major):** The calm after the storm. The warm sector -- the zone of mild, humid air between the warm front and cold front -- where the weather is overcast but gentle. The slow melody is the stratus deck covering the warm sector, featureless but enveloping.
- **Movement III (Allegro scherzando, C minor -> C major):** The cold front passage and clearing. The tempo quickens like the wind ahead of the cold front. The key shifts from minor to major as the sky clears behind the front. The final C major chords are the post-frontal high pressure: blue sky, sharp air, the storm a memory photographed from orbit and pinned to a wall.

---

## F. Problem-Solving Methodology

### F1. The Perspective Shift: When Changing Your Viewpoint Changes Everything

TIROS-1's lesson: the same system (the atmosphere) looked completely different depending on whether you observed it from below (surface weather stations) or from above (satellite). Surface observations revealed local conditions. Satellite observations revealed global patterns. Neither was wrong; each was incomplete. The complete picture required both perspectives.

This is a general problem-solving principle: **when a problem seems intractable, change the observation point.** Debugging a distributed system? Don't look at individual logs -- look at the aggregate. Analyzing a complex algorithm? Don't trace individual executions -- look at the statistical distribution. Trying to understand a codebase? Don't read individual functions -- look at the dependency graph.

TIROS-1 didn't add new instruments. It didn't measure anything the Weather Bureau couldn't already measure. It measured the same thing -- clouds -- from a new perspective. And the new perspective revealed patterns that were invisible from the old perspective. The vortex streets were always there. The comma clouds were always there. The ITCZ was always there. Nobody could see them because nobody had climbed high enough to look.

---

## G. GSD Improvements

### G1. Observation Window Scheduling

TIROS-1's camera duty cycle problem (29% Earth-viewing time, 32-frame tape limit) maps to scheduling in agent systems. When agents have limited observation windows (rate limits, token budgets, time constraints), the scheduling algorithm must allocate observations to maximize information gain -- the same explore-exploit tradeoff that TIROS-1's ground controllers faced with 32 frames per orbit. A GSD agent scheduling system could implement a bandit-based allocation strategy: allocate most observations to known high-value targets (exploitation) while reserving a fraction for scanning new territory (exploration). The regret-bounded algorithms (UCB, Thompson sampling) provide provably efficient solutions to this allocation problem.

### G2. Spin-Stabilization as Periodic Context

TIROS-1's spin-stabilization meant the camera saw the Earth only during a periodic window of each rotation -- 29% of the time. This maps to agents operating in periodic-context environments: they receive context (see the ground) for a fraction of the time and must operate in the dark (see space) the rest. Skills that persist state across dark periods and rapidly orient during light periods would improve agent performance in bursty, intermittent workflows -- similar to how TIROS-1's camera controller captured one maximally useful image per spin rotation, knowing the next viewing window was 3.5 seconds away.

---

*"The Marbled Murrelet weighs 220 grams. It flies 80 km from the coast to reach its nesting tree. It carries a single fish -- a sand lance or anchovy, 10-15 cm long -- in its bill for the entire flight, arriving at the nest platform before dawn to avoid predation by corvids. The chick is left alone on the moss-covered branch for 24 hours until the next feeding visit. The branch is 45 meters above the ground, in an old-growth Douglas fir or Sitka spruce that has been standing for 500-800 years. The Murrelet evolved to nest there because the canopy provided what no other habitat offered: concealment from above and below, a landing platform wide enough for a seabird that evolved to land on water, and proximity to the marine food source that the bird requires. TIROS-1, spinning twelve times per minute at 725 kilometers, could not have seen the Murrelet's nest. The resolution was 3.6 kilometers per line -- the entire old-growth forest is smaller than one pixel. But TIROS-1 could see the weather that shapes the forest: the Pacific frontal systems that bring 250 centimeters of rain per year to the Olympic Peninsula, the stratus decks that keep the forest floor cool and moist through the summer, the marine layer that modulates the coastal fog the trees depend on. The satellite sees the cause. The Murrelet lives the effect. The 22,952 images TIROS-1 captured in 78 days include the weather that waters the forest that grows the tree that holds the branch that hides the chick that eats the fish that swims the sea that the satellite photographs from orbit. It is all one system, seen from different altitudes."*
