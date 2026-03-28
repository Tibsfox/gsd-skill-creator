# Data Visualization & Sonification

> **Domain:** Gravitational Wave Data Rendering
> **Module:** 5 -- GWOSC Pipelines, OpenGL Spectrograms, Sonification, and the Cosmic Oscilloscope
> **Through-line:** *The gravitational wave from GW150914 displaced LIGO's mirrors by 10^-18 meters -- a distance 1,000 times smaller than a proton's diameter. No human can see that. No instrument can display it at native scale. But a Q-transform renders the chirp as a bright diagonal streak on a spectrogram, a frequency shift places it in the sweet spot of human hearing, and a GLSL shader maps the energy to a scrolling 3D terrain of light and color. The visualization IS the instrument. Without it, the detection is a number. With it, spacetime rings and you hear it.*

---

## Table of Contents

1. [GWOSC: The Open Data Portal](#1-gwosc-the-open-data-portal)
2. [Data Access APIs](#2-data-access-apis)
3. [Sonification: Hearing Gravitational Waves](#3-sonification-hearing-gravitational-waves)
4. [Spectrograms as Visual Art](#4-spectrograms-as-visual-art)
5. [OpenGL Screensaver Architecture](#5-opengl-screensaver-architecture)
6. [GLSL Shader Design](#6-glsl-shader-design)
7. [The Spacetime Mesh](#7-the-spacetime-mesh)
8. [Minecraft Data Bridge](#8-minecraft-data-bridge)
9. [GraceDB Alert Integration](#9-gracedb-alert-integration)
10. [The Integration Pipeline](#10-the-integration-pipeline)
11. [Prior Art and Influences](#11-prior-art-and-influences)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. GWOSC: The Open Data Portal

The Gravitational Wave Open Science Center (GWOSC, gwosc.org) is the official public data release platform for the LIGO, Virgo, and KAGRA collaborations. All strain data from confirmed observing runs is released through GWOSC under a Creative Commons CC-BY-4.0 license, making gravitational wave data freely available to anyone [1].

### Data Products

| Product | Format | Sample Rate | Typical Size |
|---------|--------|-------------|-------------|
| Strain data (full) | GWF, HDF5 | 16384 Hz | ~2 GB/hour/detector |
| Strain data (downsampled) | GWF, HDF5 | 4096 Hz | ~500 MB/hour/detector |
| Event strain (centered) | HDF5 | 4096 Hz | ~1 MB per 32-second window |
| Auxiliary channels | GWF | Various | ~100 GB/hour (1000+ channels) |
| Sky maps | FITS (HEALPix) | N/A | ~1 MB per event |
| Parameter estimation posteriors | HDF5 | N/A | ~100 MB per event |

### Data Release Timeline

GWOSC data is not released in real time. Strain data undergoes calibration, noise subtraction, and quality control before public release:

- O1 data: released ~6 months after run end
- O2 data: released ~6 months after run end
- O3 data: released in segments (O3a ~18 months after collection)
- O4a data: released August 2025

However, GraceDB event alerts are near-real-time (within minutes). This creates two operating modes for any visualization pipeline:
1. **Alert mode:** Receive real-time event notifications; display metadata until strain data becomes available
2. **Archive mode:** Cycle through confirmed GWTC events using publicly released strain data [2]

### GWOSC Channel Naming

Strain data channels follow the convention:

```
{IFO}:GWOSC-{RATE}_{RELEASE}_STRAIN

Examples:
  H1:GWOSC-4KHZ_R1_STRAIN     Hanford, 4 kHz, Release 1
  L1:GWOSC-16KHZ_R1_STRAIN    Livingston, 16 kHz, Release 1
  V1:GWOSC-4KHZ_R1_STRAIN     Virgo, 4 kHz, Release 1
```

---

## 2. Data Access APIs

### GWpy TimeSeries.fetch_open_data()

The primary programmatic interface. Fetches strain data directly from the GWOSC REST API:

```
from gwpy.timeseries import TimeSeries

# Fetch 32 seconds of H1 data around GW150914
gps = 1126259462.4
strain = TimeSeries.fetch_open_data('H1', gps - 16, gps + 16)

# Returns: TimeSeries at 4096 Hz
# Data source: GWOSC CDN (cached, 5-minute TTL)
```

### GWOSC REST API

Direct HTTP access for programmatic queries:

```
GWOSC REST API ENDPOINTS
================================================================

  Base URL: https://gwosc.org/api

  /timeline/                  List observing segments
  /eventapi/json/GWTC-3/     Query event catalog (GWTC-3)
  /eventapi/json/allevents/   All events across all catalogs
  /catalog/GWTC-3/GW150914/  Event metadata (masses, distance, etc.)

  Strain data download:
  /archive/data/S6/           List available datasets
  /timeline/show/O4a/H1/     H1 science segments for O4a
```

### GraceDB REST API

For real-time alert data:

```
GRACEDB API ENDPOINTS
================================================================

  Base URL: https://gracedb.ligo.org/api/

  /superevents/               List superevents
  /superevents/{id}/          Event detail
  /superevents/{id}/files/    Sky maps, VOEvents
  /superevents/{id}/logs/     Analysis logs

  Event fields: superevent_id, t_0, far, labels,
                preferred_event, gw_events
```

### Key Events for Visualization Development

| Event | GPS Time | Type | Duration in Band | Visualization Notes |
|-------|----------|------|-------------------|---------------------|
| GW150914 | 1126259462 | BBH | 0.2 s | Canonical test case; short chirp |
| GW170817 | 1187008882 | BNS | 100 s | Best screensaver demo; long dramatic sweep |
| GW190521 | 1242442967 | BBH | Very short | Intermediate mass; high-frequency |
| GW231123 | O4b period | BBH | Short | Highest mass; dramatic low-frequency |
| GW250114 | O4b period | BBH | Short | Three harmonics; unique waveform |

> **SAFETY WARNING:** All visualizations of LIGO data MUST include proper attribution: "Data from the LIGO/Virgo/KAGRA Collaboration via the Gravitational Wave Open Science Center (gwosc.org)." Failure to attribute is a violation of the GWOSC data usage policy [3].

---

## 3. Sonification: Hearing Gravitational Waves

### The Frequency Problem

Gravitational wave chirps from compact binary mergers occupy the frequency range 20-500 Hz -- technically within the human hearing range (20-20,000 Hz), but at the very bottom. At 35 Hz, the signal is felt more than heard (subwoofer territory). The chirp duration for a BBH merger like GW150914 is only 0.2 seconds -- too fast to perceive the frequency sweep without slowing down or frequency-shifting [4].

### The Standard Sonification Recipe

GWOSC uses the following approach for its published sonification files:

```
SONIFICATION PIPELINE
================================================================

  Input: whitened, bandpassed strain h(t)
       |
  [Frequency shift: +400 Hz]
       |   Chirp at 35-250 Hz -> 435-650 Hz
       |   Moves signal to perceptual sweet spot
       |
  [Amplitude scaling: 4x]
       |   Compensates for human ear's
       |   reduced sensitivity at low frequencies
       |
  [Sample rate: 44100 Hz]
       |   Standard audio sample rate
       |
  [WAV export]
       |
  Output: audio file (0.2 s for BBH, 30 s for BNS)
```

For GW150914, the sonified output is the iconic 0.2-second "chirp" -- a quick upward sweep ending in a sharp pop. For GW170817, the sonification produces a 30-second rising tone from a low rumble to a sharp whistle that terminates abruptly at merger [5].

### System Sounds Project

The System Sounds project (Matt Russo and Andrew Santaguida, system-sounds.com) has produced sonifications of all 90+ GWTC-3 detections played in sequence -- a "symphony of spacetime" that illustrates the variety of chirp durations, frequencies, and amplitudes across the catalog. Each event is distinguishable by its mass ratio (affecting the frequency sweep rate) and chirp mass (affecting the starting frequency) [6].

### Sounds of Spacetime

The Sounds of Spacetime project (soundsofspacetime.org) provides interactive sonification tools and educational resources. Their web-based interface allows users to adjust frequency shift, amplitude scaling, and playback speed for any GWTC event [7].

### Implementation in Python

```
import numpy as np
from scipy.io import wavfile
from gwpy.timeseries import TimeSeries

# Fetch and process GW150914
strain = TimeSeries.fetch_open_data('H1', 1126259446, 1126259478)
white = strain.whiten(4, 2).bandpass(35, 350)

# Frequency shift +400 Hz (multiply by complex exponential)
t = np.arange(len(white)) / white.sample_rate.value
shifted = white.value * np.cos(2 * np.pi * 400 * t)

# Normalize and amplify
audio = shifted / np.max(np.abs(shifted)) * 0.8 * 4

# Export as WAV
wavfile.write('gw150914_sonified.wav', 44100,
              (audio * 32767).astype(np.int16))
```

---

## 4. Spectrograms as Visual Art

### The Q-Transform Spectrogram

The Q-transform spectrogram is the standard visualization for gravitational wave data. Its variable time-frequency resolution makes chirp signals appear as clean, bright diagonal tracks against a uniform noise background [8].

### Color Mapping

The raw Q-transform output is a 2D array of normalized energy values. The color map transforms these values into visual output:

| Color Map | Character | Best For |
|-----------|-----------|----------|
| Viridis | Perceptually uniform, colorblind-safe | Scientific publication |
| Thermal (hot) | White-yellow-red-black | Maximum visual contrast |
| Inferno | Dark-purple-red-yellow | Dramatic presentation |
| Custom (cosmic) | Black-purple-blue-gold | LIGO aesthetic |

For the cosmic oscilloscope screensaver, a custom palette mapping from deep space black through cosmic purple (#311B92) through detector blue (#0277BD) to signal gold (#F9A825) creates an aesthetic that visually connects the physics to the display [9].

### 3D Terrain Spectrograms

Extending the spectrogram into 3D by mapping energy to height creates a dramatic visualization where chirp signals appear as mountain ridges rising from a flat noise floor. This approach was demonstrated in a 2020 IEEE VR paper that rendered gravitational wave data as a virtual landscape environment using OpenGL vertex and geometry shaders [10].

```
3D SPECTROGRAM GEOMETRY
================================================================

  For each pixel (i, j) in the 2D Q-transform:

    x_i = time_index * dx        (scrolling axis)
    y_j = frequency_index * dy   (frequency axis)
    z_ij = E(i,j) * scale        (energy -> height)

  The mesh is a regular grid of vertices:
    - Columns: time steps (e.g., 1024 columns)
    - Rows: frequency bins (e.g., 256 rows)
    - Total vertices: 262,144

  Scrolling: each new time column is appended at the front;
  the oldest column is discarded. The VBO is updated per frame.

  Color: mapped from E(i,j) via fragment shader lookup
  into the palette texture (1D texture, 256 entries)
```

---

## 5. OpenGL Screensaver Architecture

### Design Goals

The cosmic oscilloscope screensaver renders a scrolling 3D Q-transform spectrogram driven by real LIGO data:

- **60 fps** minimum on mid-range GPU (GTX 1060 equivalent)
- **Data-driven:** Display updates from the GWpy processing pipeline via shared memory
- **Ambient:** Operates unattended; cycles through archived events in the absence of new alerts
- **Two modes:** Archive mode (cycling GWTC events) and Featured mode (triggered by GraceDB alert)

### Technology Stack

| Component | Technology | Role |
|-----------|-----------|------|
| Window / context | GLFW (C/C++) or PyOpenGL | OpenGL context creation, event loop |
| Rendering | OpenGL 3.3+ Core Profile | VBO mesh rendering |
| Shaders | GLSL 330 | Vertex displacement, color mapping |
| Data pipeline | Python (GWpy, numpy) | Strain processing, Q-transform |
| IPC | `multiprocessing.shared_memory` | Data transfer between Python and renderer |
| Audio | sounddevice / PyAudio | Optional sonification output |

### Frame Loop

```
SCREENSAVER FRAME LOOP
================================================================

  [Init]
    Create GLFW window (fullscreen or windowed)
    Compile GLSL shaders
    Allocate VBO mesh (1024 x 256 vertices)
    Attach shared memory segment for data input
    Start Python data pipeline in subprocess

  [Per Frame]
    1. Check shared memory for new Q-transform column
    2. If new data: shift VBO, insert new column at front
    3. Update uniforms: time, strain amplitude, palette index
    4. Render pass 1: spectrogram mesh (vertex + fragment shader)
    5. Render pass 2: spacetime background mesh
    6. Render pass 3: HUD overlay (event name, strain scale, time)
    7. glfwSwapBuffers()

  Target: 60 fps
  Data update rate: ~4 Hz (one Q-transform column per 0.25 seconds)
  VBO update: partial (only 1 column per frame = 256 vertices)
```

---

## 6. GLSL Shader Design

### Vertex Shader: Spectrogram Terrain

The vertex shader maps Q-transform energy to vertical displacement:

```
SPECTROGRAM VERTEX SHADER (spectrogram.vert)
================================================================

  #version 330 core

  layout(location = 0) in vec3 position;   // (time, freq, 0)
  layout(location = 1) in float energy;     // normalized Q-transform

  uniform mat4 projection;
  uniform mat4 view;
  uniform mat4 model;
  uniform float heightScale;

  out float v_energy;
  out vec3 v_position;

  void main() {
      vec3 displaced = position;
      displaced.z = energy * heightScale;   // energy -> height

      v_energy = energy;
      v_position = displaced;

      gl_Position = projection * view * model * vec4(displaced, 1.0);
  }
```

### Fragment Shader: Energy to Color

The fragment shader maps normalized energy to the cosmic palette:

```
SPECTROGRAM FRAGMENT SHADER (spectrogram.frag)
================================================================

  #version 330 core

  in float v_energy;
  in vec3 v_position;

  uniform sampler1D palette;     // 256-entry color lookup
  uniform float energyMin;       // log10 scale minimum
  uniform float energyMax;       // log10 scale maximum

  out vec4 fragColor;

  void main() {
      // Log-scale energy for visual dynamic range
      float logE = log(max(v_energy, 0.001));
      float normalized = (logE - energyMin) / (energyMax - energyMin);
      normalized = clamp(normalized, 0.0, 1.0);

      fragColor = texture(palette, normalized);
  }
```

### The Cosmic Palette

The palette texture maps normalized energy [0, 1] to the spacetime color scheme:

```
COSMIC PALETTE
================================================================

  Energy     Color                    Hex       Interpretation
  -----------------------------------------------------------
  0.0        Deep space black         #0A0520   Noise floor
  0.1        Cosmic purple (dark)     #1A0E5A   Faint structure
  0.25       Cosmic purple            #311B92   Low-energy signal
  0.4        Deep violet              #4A148C   Moderate energy
  0.55       Detector blue (dark)     #01579B   Rising signal
  0.7        Detector blue            #0277BD   Strong signal
  0.85       Signal gold (muted)      #F9A825   High energy
  1.0        Signal gold (bright)     #FFD54F   Peak chirp
```

---

## 7. The Spacetime Mesh

A second mesh renders the "rubber sheet" spacetime visualization behind the spectrogram terrain. This mesh distorts in response to the current strain amplitude, producing the physics-explainer visual of spacetime being warped by a passing gravitational wave [11].

### Displacement Function

The vertex shader applies a Gaussian-modulated sinusoidal distortion:

```
z(x, y, t) = h(t) * A * exp(-(x^2 + y^2) / (2*sigma^2))
                   * cos(k*sqrt(x^2 + y^2) - omega*t)
```

Where:
- `h(t)` is the current strain amplitude (from the processing pipeline)
- `A` is a visual scale factor (~10^18 to convert 10^-21 strain to visible displacement)
- `sigma` controls the spatial falloff radius
- `k` is the visual wavenumber (controls ripple spacing)
- `omega` is the visual angular frequency (controls ripple animation speed)

At noise floor, `h(t) ~ 0` and the mesh is flat. At a chirp peak, `h(t) ~ 10^-21` and the mesh undulates visibly after amplification by the scale factor [12].

```
SPACETIME MESH VERTEX SHADER (spacetime.vert)
================================================================

  #version 330 core

  layout(location = 0) in vec3 position;    // (x, y, 0)

  uniform mat4 projection;
  uniform mat4 view;
  uniform mat4 model;
  uniform float strain;        // current h(t), pre-scaled
  uniform float time;          // animation time

  out vec3 v_normal;

  void main() {
      float r = length(position.xy);
      float gaussian = exp(-r*r / 50.0);
      float wave = cos(0.5 * r - 2.0 * time);
      float z = strain * 1000.0 * gaussian * wave;

      vec3 displaced = vec3(position.xy, z);

      // Approximate normal for lighting
      float dzdx = -strain * 1000.0 * gaussian *
                   (position.x/25.0 * wave - 0.5*position.x/r * sin(0.5*r - 2.0*time));
      v_normal = normalize(vec3(-dzdx, 0.0, 1.0));

      gl_Position = projection * view * model * vec4(displaced, 1.0);
  }
```

---

## 8. Minecraft Data Bridge

### Concept

The Minecraft data bridge maps gravitational wave strain data to a voxel terrain in Minecraft Java Edition. Players can walk alongside a gravitational wave as it builds and chirps -- a spatial, embodied experience of time-series data [13].

### RCON Protocol

Minecraft Java Edition's RCON (Remote Console) protocol enables external programs to issue server commands over TCP:

```
MINECRAFT RCON ARCHITECTURE
================================================================

  [Python bridge process]
       |
       | TCP connection (port 25575)
       | RCON protocol (authenticate + command)
       |
  [Minecraft Server]
       |
       | /setblock, /fill commands
       |
  [Game World]
       |
  [Player experience]

  Rate limit: ~20 commands/second via RCON
  /fill command: updates 16x16 slice in one command
  /setblock: single block placement

  Python library: mcrcon (pip install mcrcon)
```

### Block Palette

The strain value at each time step is normalized to [0, 1] and quantized into 8 levels:

| Level | Strain Range | Block | Visual |
|-------|-------------|-------|--------|
| 0 | Noise floor | Air / Smooth Stone | Flat / invisible |
| 1 | < 0.1 | Obsidian | Near-black, dense |
| 2 | 0.1-0.25 | Blackstone | Dark gray |
| 3 | 0.25-0.4 | Amethyst Block | Purple, muted |
| 4 | 0.4-0.55 | Purple Stained Glass | Translucent purple |
| 5 | 0.55-0.7 | Crying Obsidian | Glowing purple |
| 6 | 0.7-0.85 | Sea Lantern | White glow |
| 7 | Peak chirp | End Rod / Beacon | Maximum brightness |

The palette maps naturally to the cosmic purple / deep space aesthetic. The progression from obsidian through amethyst to sea lantern creates a visual experience of "spacetime warming up" as the chirp builds [14].

### World Architecture

```
MINECRAFT GRAVITATIONAL WAVE WORLD
================================================================

  Superflat world preset (no terrain features)

  Z-axis: time (scrolling forward)
  X-axis: frequency bins (16 blocks wide)
  Y-axis: strain amplitude (16 blocks tall)

  Corridor: 64 blocks long x 16 blocks wide x 16 blocks tall
  Each Z-slice: one time step (0.25 seconds)
  Scroll rate: 4 slices per second

  Player position: Z=32 (always at "present" moment)
  Behind player: past signal (fading to obsidian)
  Ahead of player: future signal (building to chirp)

  Note block layer: beneath terrain
  - 8 pitches mapped to 8 strain levels
  - Triggered by redstone from command blocks
  - Audible chirp synchronized with visual
```

### Note Block Audio

Minecraft note blocks produce pitches from F#3 to F#5 (2 octaves). By placing note blocks beneath the terrain and triggering them with command blocks synchronized to the data stream, the gravitational wave chirp becomes audible in-game. The 8 strain levels map to 8 ascending pitches [15].

---

## 9. GraceDB Alert Integration

### Alert Consumer

The alert consumer runs as a separate process, subscribing to the IGWN alert stream via Kafka:

```
ALERT CONSUMER ARCHITECTURE
================================================================

  [igwn-alert subscribe]
       |
       | Kafka consumer (topic: igwn.gwalert)
       |
  [Parse alert JSON]
       |
       +---> superevent_id
       +---> alert_type (PRELIMINARY, INITIAL, UPDATE, RETRACTION)
       +---> gps_time
       +---> far (false alarm rate)
       +---> classification (BBH/BNS/NSBH probabilities)
       +---> sky_map_url
       |
  [Event classifier]
       |
       +---> RETRACTION: immediately remove from featured queue
       +---> LOW_SIGNIFICANCE (far > 1/year): mark as candidate
       +---> BNS/NSBH: high priority (potential EM counterpart)
       +---> BBH: standard priority
       |
  [Featured event trigger]
       |
       +---> Switch both renderers to featured mode
       +---> Display event metadata overlay
       +---> Queue strain data fetch (when available)
```

> **SAFETY WARNING:** The alert consumer MUST handle RETRACTION alerts. A retracted event must be removed from the featured display immediately (within 5 seconds). Displaying a retracted event as a confirmed detection is misleading and violates LIGO data usage guidelines [16].

### Mode Switching

The integration pipeline operates in two modes:

1. **Archive mode (default):** Cycles through a playlist of confirmed GWTC events, displaying each for a configurable duration (e.g., 60 seconds per event). The playlist prioritizes visually dramatic events: GW170817 (30-second BNS chirp), GW150914 (canonical BBH), GW190521 (IMBH).

2. **Featured mode (alert-triggered):** On receiving a PRELIMINARY alert for a significant event (FAR < 1/year), the pipeline switches to featured mode. The spectrogram displays the event metadata (name, type, estimated masses, distance). When strain data becomes available (potentially months later for archival data), the full Q-transform visualization replaces the metadata overlay [17].

---

## 10. The Integration Pipeline

### Shared Memory Bus

The data pipeline (Python) and renderer (OpenGL) communicate through shared memory:

```
SHARED MEMORY BUS ARCHITECTURE
================================================================

  [Python data pipeline]
       |
       | multiprocessing.shared_memory
       | or named pipe (/tmp/gw_spectrogram)
       |
  [Shared buffer]
       |
       | Format: raw float32 array
       | Shape: (n_freq_bins,) per column
       | Header: {event_id, gps_time, column_index, mode}
       |
  [OpenGL renderer]  +  [Minecraft bridge]
       |                       |
  (reads new columns)    (reads new columns)
  (updates VBO)          (issues RCON commands)
```

### Data Flow

```
FULL INTEGRATION PIPELINE
================================================================

  [GraceDB Alert]                     [GWOSC Archive]
       |                                   |
  [Alert Consumer]                    [GWOSC Client]
       |                                   |
       v                                   v
  [Event Queue] <---------------------- [Cache Manager]
       |                                5-min TTL
       v                                LRU cache
  [GWpy Pipeline]
       |
  +----+----+
  |         |
  [Whitening]  [Bandpass]
  |         |
  +----+----+
       |
  [Q-Transform]
       |
  [Shared Memory Bus]
       |
  +----+----+----+
  |         |    |
  [OpenGL]  [MC] [Audio]
  60 fps    4 Hz  44.1 kHz
```

### Cache Strategy

- **Pre-warm:** GW150914 and GW170817 strain windows cached at startup
- **Q-transform cache:** Computed Q-transforms cached separately (expensive computation, reused across renderers)
- **GWOSC CDN:** Respects HTTP caching headers; use `requests-cache` with SQLite backend for local persistence
- **Cache key format:** `{ifo}:{gps_start}:{gps_end}:{sample_rate}`

---

## 11. Prior Art and Influences

### Existing LIGO Visualizations

| Project | Type | Notes |
|---------|------|-------|
| GWOSC Audio Files | WAV sonifications | Published for all major events |
| System Sounds | Sonification art | All GWTC detections in sequence |
| Sounds of Spacetime | Interactive web | User-adjustable sonification |
| Chirp (iOS app) | Mobile | Real-time GW alert visualization |
| Gravitational Wave Playground | Jupyter | GWOSC tutorial notebooks |
| IEEE VR 2020 paper | VR/OpenGL | 3D line grid spacetime visualization |

### What Does Not Exist

No existing project combines:
1. Real LIGO data (not simulated) with
2. A screensaver/ambient display that
3. Renders Q-transform spectrograms as 3D terrain with
4. GLSL shaders and
5. A Minecraft data bridge

The cosmic oscilloscope fills this gap [18].

### Influences from the GSD Ecosystem

- **DAA (Deep Audio Analysis):** FFT, spectrogram, and cross-correlation pipelines directly inform the signal processing layer
- **SGL (Signal & Light):** DSP algorithms, adaptive filtering, and shader architectures provide the rendering foundation
- **BRC (Virtual Black Rock City):** RCON Minecraft bridge architecture established the data-in-Minecraft pattern
- **BPS (Bioacoustic & Physical Sensors):** Sensor data visualization and time-series rendering patterns
- **MPC (Math Co-Processor):** FFT and matrix computation for Q-transform performance

> **Related:** [SGL: DSP Algorithms](../SGL/research/01-real-time-dsp-algorithms.md) | [DAA: Deep Audio Analysis](../DAA/) | [BPS: Physical Sensors](../BPS/)

---

## 12. Cross-References

- **[LIGO Hanford & Interferometry](01-ligo-hanford-interferometry.md)** -- Detector noise that the processing pipeline must handle
- **[GW150914 Discovery](02-first-detection-gw150914.md)** -- The canonical event for testing the visualization pipeline
- **[Chirp Signal Analysis](03-chirp-signal-analysis.md)** -- Q-transform, whitening, and matched filtering details
- **[Multi-Messenger Astronomy](04-multi-messenger-astronomy.md)** -- GraceDB alerts and event classification
- **DAA (Deep Audio Analysis)** -- FFT fundamentals, spectrogram rendering, audio processing
- **SGL (Signal & Light)** -- DSP algorithms, FPGA/ASIC implementation, LED/display technology
- **BPS (Bioacoustic & Physical Sensors)** -- Sensor data pipelines, time-series visualization
- **MPC (Math Co-Processor)** -- GPU-accelerated FFT, matrix operations for real-time processing
- **GRD (Gradient Methods)** -- Optimization algorithms for Q-transform parameter selection
- **BHK (Black Hole Kinematics)** -- Source physics that determines the waveform morphology
- **FQC (Foundations of Quantum Computing)** -- Quantum noise that limits the raw data quality
- **PSS** -- Astronomical observation, data from space and ground-based observatories

---

## 13. Sources

1. Gravitational Wave Open Science Center. "About GWOSC." gwosc.org/about
2. LVK Collaboration. (2025). "Open Data from LIGO, Virgo, and KAGRA through the First Part of the Fourth Observing Run." arXiv:2508.18079.
3. GWOSC. "Data Use and Citation Policy." gwosc.org/about/#cite
4. GWOSC. "Audio Files of Gravitational Wave Events." gwosc.org/audio
5. LIGO Laboratory. "Gravitational Waves -- As Sound." ligo.caltech.edu/video/ligo20160211v2
6. System Sounds. "Gravitational Wave Sonifications." system-sounds.com/gravitational-waves
7. Sounds of Spacetime. soundsofspacetime.org
8. Macleod, D.M. et al. (2021). "GWpy: A Python package for gravitational-wave astrophysics." *SoftwareX*, 13, 100657.
9. Abbott, B.P. et al. (2016). "Observation of Gravitational Waves from a Binary Black Hole Merger." *PRL*, 116, 061102. Figure 1 (original spectrogram).
10. Venumadhav, T. et al. (2020). "Immersive and Interactive Visualization of Gravitational Waves." *IEEE VRW 2020*.
11. Millhouse, M. et al. (2024). "Visualization of time-frequency structures in gravitational wave signals." arXiv:2402.16533.
12. Saulson, P.R. (2017). *Fundamentals of Interferometric Gravitational Wave Detectors*. 2nd ed. World Scientific. Chapter 1 (spacetime deformation geometry).
13. Virtual Black Rock City. "Minecraft Data Bridge Architecture." www/PNW/BRC/ (GSD ecosystem internal reference).
14. Minecraft Wiki. "Block." minecraft.wiki/Block (block properties and light emission values).
15. Minecraft Wiki. "Note Block." minecraft.wiki/Note_Block (pitch mapping and redstone integration).
16. LIGO/Virgo/KAGRA Public Alert User Guide. emfollow.docs.ligo.org/userguide. Section on retractions.
17. IGWN Observing Run Plans. observing.docs.ligo.org/plan -- alert distribution procedures.
18. GWpy Documentation. gwpy.github.io/docs/stable -- tutorials and API reference.
19. PyCBC Documentation. pycbc.org -- matched filtering and detection pipeline.
20. GWOSC Tutorials. gwosc.org/tutorials -- Jupyter notebooks for data access.
21. igwn-alert Documentation. igwn-alert.readthedocs.io -- Kafka consumer for GW alerts.
22. ligo.skymap Documentation. lscsoft.docs.ligo.org/ligo.skymap -- HEALPix sky map tools.
