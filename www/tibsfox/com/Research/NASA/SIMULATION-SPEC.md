# NASA Mission Series — Simulation Artifact Specification

**Version:** 2.0.0 (expanded from v1.0 documentation-only to v2.0 runnable simulations)
**Date:** 2026-03-30
**Hardware:** RTX 4060 Ti (8GB), CUDA 12.4, Vulkan 1.4.335, 60GB RAM, i7-6700K

---

## Philosophy

The mission pack is not documentation about simulations — it IS the simulation. Every artifact is runnable. Every circuit is simulatable. Every visualization renders in real-time. The user clones the repo and runs things.

---

## Expanded Artifact Structure

```
artifacts/
├── circuits/                    # BUILD instructions (existing .md)
│   ├── *.md                     # Human-readable build guides
│   └── spice/                   # SPICE netlists (simulatable)
│       ├── *.cir                # ngspice circuit files
│       ├── *.sub                # Subcircuit models
│       └── run.sh               # Batch runner: ngspice -b *.cir
│
├── simulations/
│   ├── python/                  # Runnable Python scripts
│   │   ├── *.py                 # numpy/scipy/matplotlib
│   │   ├── requirements.txt     # Pin versions
│   │   └── README.md            # What each script does
│   │
│   ├── web/                     # Browser-based interactive HTML
│   │   ├── *.html               # Self-contained (inline JS/CSS)
│   │   └── README.md            # How to open/serve
│   │
│   ├── gl/                      # OpenGL/Vulkan real-time viewers
│   │   ├── *.frag               # Fragment shaders
│   │   ├── *.vert               # Vertex shaders
│   │   ├── *.c                  # Standalone C viewers (GLFW)
│   │   ├── Makefile             # Build with system GL/Vulkan
│   │   └── README.md
│   │
│   └── cuda/                    # GPU-accelerated computation
│       ├── *.cu                 # CUDA kernels
│       ├── *.py                 # Python + CuPy/PyCUDA wrappers
│       ├── Makefile             # nvcc build
│       └── README.md
│
├── audio/                       # FAUST .dsp synths (existing)
├── screensaver/                 # GLSL screensaver shaders (existing)
└── stories/                     # Creative fiction (existing)
```

---

## Per-Mission Simulation Requirements

### SPICE Circuits (ngspice netlists)
Every circuit described in the .md build guide gets a corresponding .cir netlist:
- Crystal oscillators, frequency multipliers, mixers, IF amplifiers
- LED driver circuits (555 + CD4017 chains)
- Geiger counter simulators
- Radio transmitter/receiver stages
- TV camera scan circuits (where applicable)
- `.tran` analysis for time-domain waveforms
- `.ac` analysis for frequency response
- Output: ASCII data files + gnuplot-compatible

### Python Simulations
Mission-specific runnable scripts:
- **Trajectory:** Orbital mechanics with real parameters (poliastro/scipy)
- **Telemetry:** Generate actual bitstreams at mission data rates
- **Signal processing:** Modulation, demodulation, noise
- **Radiation:** Van Allen belt profiles from mission data
- **TV camera:** Raster scan generation and image reconstruction
- **Circuit companion:** Verify SPICE results analytically

All scripts:
- Standalone (no framework imports beyond numpy/scipy/matplotlib)
- Generate publication-quality plots saved as PNG
- Print key numerical results to stdout
- Use REAL mission parameters (not placeholder values)

### Web Interactive (HTML/JS/Canvas)
Browser-based simulations deployed to tibsfox.com:
- **Period-authentic displays:** Green phosphor oscilloscope, strip chart recorder
- **Telemetry decoders:** Show bitstream → engineering values
- **Spectrum analyzers:** Frequency-domain visualization
- **TV camera simulators:** Raster scan building images line-by-line
- **Trajectory viewers:** 2D/3D orbital mechanics
- Self-contained HTML files (inline CSS/JS, no build step)
- Use Canvas 2D, WebGL, or Web Audio API as needed

### OpenGL/Vulkan Real-Time
Standalone compiled viewers for GPU-rendered visualizations:
- Van Allen belt cross-sections (particle trapping, slot region)
- Pioneer trajectories in 3D (Earth-Moon system)
- Radiation intensity as color/density fields
- TV camera signal as texture streaming
- Build with GLFW + libepoxy (already proven with shader-viewer)
- Vertex + fragment shader pairs
- Makefile targeting the local Vulkan SDK

### CUDA Computation (Math Coprocessor)
GPU-accelerated calculations using the existing MCP math coprocessor:
- **Fourier chip:** FFT of telemetry signals, spectral analysis
- **Statos chip:** Monte Carlo radiation belt particle simulations
- **Algebrus chip:** Orbital mechanics matrix operations
- **Vectora chip:** Batch trajectory evaluation
- **Symbex chip:** JIT-compiled mission-specific formulas
- Also standalone .cu kernels for:
  - Particle-in-cell radiation belt simulation
  - N-body trajectory propagation
  - Image reconstruction from sparse TV scan data
  - Signal correlation and matched filtering

---

## Mission-Specific Simulation Matrix

| Mission | SPICE | Python | Web | GL | CUDA |
|---------|-------|--------|-----|----|----|
| v1.0 NASA Founding | — | Agency timeline | Mycelial network viz | Armillaria shader | — |
| v1.1 Pioneer 0 | Transmitter osc | 77-sec trajectory | Launch-to-explosion scope | Exhaust/explosion | — |
| v1.2 Pioneer 1 | Crystal osc + x4 mult | 43-hr trajectory + radiation | Oscilloscope telemetry | Van Allen belt 3D | FFT of telemetry |
| v1.3 Pioneer 2 | TV camera scan circuit | TV signal generator | **TV camera raster scan** | Scan line renderer | Image reconstruction |
| v1.4 Pioneer 3 | Dual GM tube circuit | Dual-belt profile | Dual belt interactive | Dual radiation rings | Monte Carlo belt sim |
| v1.5 Pioneer 4 | Full receiver chain | Hyperbolic trajectory | Escape velocity sim | Heliocentric orbit | Trajectory propagation |

---

## Radio Circuit Progressive Series

| Mission | Component | SPICE File | Builds On |
|---------|-----------|-----------|-----------|
| v1.2 | Crystal oscillator + x4 multiplier | `oscillator-108mhz.cir` | — |
| v1.3 | Superheterodyne receiver | `superhet-receiver.cir` | — |
| v1.4 | Diode ring frequency mixer | `ring-mixer.cir` | v1.2 + v1.3 |
| v1.5 | IF amplifier (455 kHz tuned) | `if-amplifier.cir` | v1.4 |
| v1.6+ | Detector, AGC, PLL, digital mod... | — | accumulating |

By mission 50: complete ground station (transmitter + receiver + tracking).

---

## TV Camera Simulation (Pioneer 2, v1.3)

The crown jewel of the simulation expansion. Pioneer 2 carried the first TV camera on a Pioneer spacecraft. The simulation chain:

1. **SPICE:** Vidicon tube scan circuit — horizontal and vertical deflection oscillators
2. **Python:** Generate NTSC-style composite video signal with sync pulses
3. **Web (HTML):** Interactive page showing:
   - A simulated Earth image as seen from 1,550 km
   - Raster scan building the image line-by-line (period-authentic speed)
   - Signal waveform alongside the image (like a dual-trace scope)
   - "Receiver" that reconstructs from the signal with noise/artifacts
4. **GL:** Real-time scan line renderer with phosphor persistence and beam spot
5. **CUDA:** Image reconstruction from noisy, incomplete scan data

---

## GSD-OS Control Surface Integration

Each simulation artifact maps to a GSD-OS control surface:
- **Screensaver mode:** GLSL shaders run as XScreenSaver modules
- **Dashboard widget:** Web simulations embed as iframe widgets
- **Audio panel:** FAUST synths load as JACK/PipeWire sources
- **Compute panel:** CUDA kernels report to math coprocessor status
- **Circuit lab:** SPICE simulations run on demand, output to gnuplot

---

## Quality Gates

- [ ] All Python scripts run without error: `python3 script.py`
- [ ] All SPICE netlists simulate: `ngspice -b circuit.cir`
- [ ] All GLSL shaders validate: `glslangValidator *.frag`
- [ ] All web pages load in Firefox/Chrome without console errors
- [ ] All GL viewers compile: `make -C gl/`
- [ ] All CUDA kernels compile: `nvcc -o kernel kernel.cu`
- [ ] Math coprocessor tools return valid results
- [ ] Link audit: zero broken internal links in index.html

---

*"The simulation IS the artifact. If it doesn't run, it doesn't exist."*
