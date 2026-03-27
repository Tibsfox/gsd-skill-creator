# Open Science Co-op Mesh

> **Domain:** Distributed Volunteer Computing and Open Science
> **Module:** 6 -- BOINC, Folding@home, GPU Leverage, Screensaver-as-Science Architecture, and Co-op Mesh Design
> **Through-line:** *The idle cycles are already there -- burning electricity, generating heat, accomplishing nothing.* A GPU crunching protein folds while its owner sleeps is not a charitable donation -- it is an efficiency correction. The screensaver that once bounced a ball across the monitor now renders a live atmospheric pressure gradient while the GPU behind it models protein conformations for disease research. The sensing layer's open science co-op turns every idle compute node into a contributing member of a global scientific mesh, and every visualization into a window onto the work being done.

---

## Table of Contents

1. [The Open Science Opportunity](#1-the-open-science-opportunity)
2. [BOINC Platform Architecture](#2-boinc-platform-architecture)
3. [Active BOINC Projects](#3-active-boinc-projects)
4. [Folding@home](#4-folding-home)
5. [GPU-First Volunteer Computing](#5-gpu-first-volunteer-computing)
6. [Raspberry Pi ARM64 Participation](#6-raspberry-pi-arm64-participation)
7. [Screensaver-as-Science Architecture](#7-screensaver-as-science-architecture)
8. [GSD Co-op Node Design](#8-gsd-co-op-node-design)
9. [Zero-Trust Work Unit Validation](#9-zero-trust-work-unit-validation)
10. [DoltHub Federation Integration](#10-dolthub-federation-integration)
11. [Scientific Applications](#11-scientific-applications)
12. [Energy and Sustainability](#12-energy-and-sustainability)
13. [Security and Sandboxing](#13-security-and-sandboxing)
14. [Cross-References](#14-cross-references)
15. [Sources](#15-sources)

---

## 1. The Open Science Opportunity

Volunteer computing has been operational since 1996 (SETI@home). In 2025, the combined computational power of volunteer computing networks exceeds 30 PetaFLOPS daily -- more than many national supercomputing centers. This capacity is contributed by ordinary people running software on ordinary computers during idle periods. The sensing layer's open science co-op extends this model by integrating environmental sensing, live data visualization, and compute contribution into a single unified node [1][2].

### Scale of Volunteer Computing

| Platform | Science Domain | Active Hosts | Daily Compute | GPU Support |
|---|---|---|---|---|
| BOINC (total) | Multiple | 136,341 | 20.164 PetaFLOPS | Partial |
| Folding@home | Protein folding | ~200,000 | 12.9 PetaFLOPS (native) | Yes |
| Einstein@Home | Gravitational waves | ~30,000 | 2.5 PetaFLOPS | Partial |
| Rosetta@home | Protein structure | ~20,000 | 1.2 PetaFLOPS | No |
| MilkyWay@home | Galaxy modeling | ~10,000 | 0.8 PetaFLOPS | Yes (CUDA) |

### The Amiga Principle Applied

Just as the Amiga delegated specialized tasks to custom chips, a GSD co-op node delegates:
- **Sensing** to the MCU (ESP32 reading BME280, UV, particulate)
- **Communication** to the LoRa radio (Meshtastic mesh)
- **Visualization** to the GPU (live atmospheric rendering)
- **Science** to the GPU (BOINC/F@h work units when visualization is idle)
- **Orchestration** to the CPU (scheduling, data validation, mesh coordination)

No component fights the others. Each runs in its specialized lane.

---

## 2. BOINC Platform Architecture

BOINC (Berkeley Open Infrastructure for Network Computing) is the dominant platform for volunteer computing. Developed at UC Berkeley and maintained as open-source, BOINC manages the distribution, execution, and validation of scientific work units across a global network of volunteer computers [1][3].

### Architecture Overview

```
BOINC ARCHITECTURE
================================================================

[BOINC Server]                    [Volunteer Client]
  │                                  │
  ├── Project Website                ├── BOINC Manager (GUI)
  ├── Scheduler                      ├── BOINC Client (daemon)
  ├── Work Unit Generator            ├── Science Application
  ├── Validator                      ├── Sandbox Environment
  ├── Assimilator                    └── GPU Compute (optional)
  └── Database
         │
         │  Work Unit Request
         │  ────────────────>
         │
         │  Work Unit + Input Data
         │  <────────────────
         │
         │  [Client computes for hours/days]
         │
         │  Result Upload
         │  ────────────────>
         │
         │  Validation (quorum check)
         │  Credit Award
         │  <────────────────
```

### BOINC Client 8.2.8 (January 2026)

Latest client version features:
- Improved GPU detection for NVIDIA Ada Lovelace and AMD RDNA 3
- ARM64 support (native M1/M2/M3 macOS, Raspberry Pi Linux)
- Enhanced scheduling: respects battery level, thermal limits, and user preferences
- Work cache: downloads work ahead of time to minimize idle periods
- Multi-project management: distributes time across multiple science projects

### Key Statistics (2025-2026)

| Metric | Value | Source |
|---|---|---|
| Active participants | 34,236 | BOINC server stats, Jan 2026 |
| Active computers | 136,341 | BOINC server stats, Jan 2026 |
| Daily compute | 20.164 PetaFLOPS | BOINC server stats |
| Total projects | 30+ active | boincstats.com |
| Years of operation | 22 (since 2004, successor to SETI@home 1996) | UC Berkeley |

---

## 3. Active BOINC Projects

A curated selection of active BOINC projects relevant to sensing layer science [1][3].

### Project Catalog

| Project | Domain | Science | GPU | ARM64 | URL |
|---|---|---|---|---|---|
| Einstein@Home | Astrophysics | Gravitational wave, pulsar search | Partial | Yes | einsteinathome.org |
| Rosetta@home | Biology | Protein structure prediction | No | Yes | boinc.bakerlab.org |
| MilkyWay@home | Astronomy | Galaxy mass distribution | Yes (CUDA) | No | milkyway.cs.rpi.edu |
| climateprediction.net | Climate | Climate model ensemble | No | No | climateprediction.net |
| Cosmology@Home | Cosmology | CMB parameter estimation | No | No | cosmologyathome.org |
| LODA | Mathematics | Integer sequence discovery | No | Yes | boinc.loda-lang.org |
| Quake Catcher Network | Seismology | Earthquake detection via accelerometer | No | No | qcn.stanford.edu |
| LHC@home | Particle physics | Accelerator simulation | Yes (OpenCL) | No | lhcathome.cern.ch |
| Asteroids@home | Astronomy | Asteroid orbit modeling | No | Yes | asteroidsathome.net |
| World Community Grid | Multiple | Cancer, clean water, dengue | No | Yes | worldcommunitygrid.org |

### Project Selection Guide

```
BOINC PROJECT SELECTION DECISION TREE
================================================================

What hardware do you have?

  NVIDIA GPU (RTX series):
    → MilkyWay@home (CUDA, galaxy modeling)
    → LHC@home (OpenCL, particle physics)
    → Einstein@Home (CUDA + CPU, gravitational waves)

  AMD GPU:
    → LHC@home (OpenCL)
    → Limited BOINC GPU project selection for AMD

  Raspberry Pi (ARM64):
    → Rosetta@home (protein folding, CPU only)
    → Einstein@Home (CPU only, long work units)
    → World Community Grid (multiple sub-projects)
    → LODA (integer sequences, lightweight)

  CPU only (any platform):
    → climateprediction.net (climate modeling)
    → Rosetta@home
    → Cosmology@Home

  Interested in seismology?
    → Quake Catcher Network (uses laptop accelerometer!)
```

---

## 4. Folding@home

Folding@home is the world's largest distributed computing project by computational power. Unlike BOINC (which is a platform hosting many projects), Folding@home is a single project focused on protein folding and disease research [2][4].

### Scale

| Metric | Value | Date |
|---|---|---|
| Native compute | 12.9 PetaFLOPS | October 2025 |
| Peak compute (COVID-19 surge) | 2.4 ExaFLOPS | April 2020 |
| Active donors | ~200,000 | 2025 estimate |
| Scientific papers | 250+ | foldingathome.org/papers |
| Years of operation | 25 (since 2000) | Stanford University |

### Disease Research Contributions

Folding@home has contributed to understanding:
- COVID-19 spike protein dynamics (multiple Nature publications)
- Alzheimer's amyloid-beta aggregation mechanisms
- Cancer-related kinase inhibitor binding
- Ebola virus glycoprotein folding
- Huntington's disease polyglutamine expansion

### GPU Leverage

Folding@home's molecular dynamics simulations are massively parallel and GPU-accelerated:

| GPU | Estimated PPD (Points Per Day) | Relative Performance |
|---|---|---|
| RTX 4060 Ti | 3,000,000 - 5,000,000 | Excellent |
| RTX 3060 | 2,000,000 - 3,500,000 | Very good |
| RTX 2060 | 1,000,000 - 2,000,000 | Good |
| RX 6700 XT (AMD) | 1,500,000 - 2,500,000 | Good (OpenCL) |
| Raspberry Pi 5 (CPU) | 5,000 - 10,000 | Minimal but contributing |

### Installation

**Linux (including Raspberry Pi):**
```
FOLDING@HOME INSTALLATION (Debian/Ubuntu)
================================================================

# Download ARM64 client (Raspberry Pi 4/5)
wget https://download.foldingathome.org/releases/public/fah-client/\
debian-10-64bit/release/fah-client_8.3.1_arm64.deb

# Install
sudo dpkg -i fah-client_8.3.1_arm64.deb

# Configure
sudo /etc/init.d/FAHClient configure

# Start
sudo /etc/init.d/FAHClient start

# Web control interface
# Open browser to http://localhost:7396
```

---

## 5. GPU-First Volunteer Computing

Modern GPUs are 10-50x more efficient than CPUs for embarrassingly parallel scientific computations. The sensing layer's co-op node design puts GPU utilization first [4][5].

### GPU Compute Advantage by Workload

| Workload Type | CPU FLOPS | GPU FLOPS | GPU Speedup | Example Project |
|---|---|---|---|---|
| Molecular dynamics | 50 GFLOPS | 2,500 GFLOPS | 50x | Folding@home |
| FFT / signal processing | 100 GFLOPS | 2,000 GFLOPS | 20x | Einstein@Home |
| Monte Carlo simulation | 80 GFLOPS | 1,500 GFLOPS | 19x | climateprediction.net |
| N-body gravity | 60 GFLOPS | 3,000 GFLOPS | 50x | MilkyWay@home |
| Linear algebra | 150 GFLOPS | 3,000 GFLOPS | 20x | LHC@home |

*Values for RTX 4060 Ti (8 GB, 4352 CUDA cores) vs i7-6700K (4 cores)*

### CUDA vs OpenCL

| Feature | CUDA | OpenCL |
|---|---|---|
| Vendor | NVIDIA only | Cross-platform |
| Performance | Optimal (native) | 80-95% of CUDA on NVIDIA |
| Project support | Most BOINC GPU projects | Some BOINC projects, F@h |
| Debugging tools | NSight, nvprof | Limited |
| Ecosystem | Mature, well-documented | Fragmented |

**For sensing layer nodes with NVIDIA GPUs:** Use CUDA projects for maximum scientific output.
**For AMD GPUs:** Use OpenCL projects (Folding@home, LHC@home).

### Thermal and Power Management

GPU volunteer computing generates significant heat and power consumption:

| GPU State | Power Draw | Temperature | Fan Speed |
|---|---|---|---|
| Idle (desktop) | 8-15 W | 35-45 C | 0-30% |
| Visualization only | 30-60 W | 50-65 C | 30-50% |
| Light compute (BOINC) | 80-120 W | 60-75 C | 50-70% |
| Full compute (F@h) | 150-200 W | 70-85 C | 70-100% |

> **SAFETY WARNING:** Running GPU volunteer computing 24/7 increases electricity consumption by 50-150W continuously. At $0.12/kWh, this costs $4.50-$13.00 per month. Ensure adequate case ventilation. Monitor GPU temperature -- sustained operation above 85 C reduces GPU lifespan. Set temperature limits in BOINC/F@h configuration.

---

## 6. Raspberry Pi ARM64 Participation

The Raspberry Pi 4 and 5 can participate in volunteer computing despite lacking a GPU suitable for CUDA/OpenCL workloads [2][6].

### Pi as BOINC Node

| Pi Model | CPU | RAM | BOINC Performance | Power Draw | Best Project |
|---|---|---|---|---|---|
| Pi 4 (4 GB) | BCM2711, 4x A72 | 4 GB | ~8 GFLOPS | 5-7 W | Rosetta@home |
| Pi 4 (8 GB) | BCM2711, 4x A72 | 8 GB | ~8 GFLOPS | 5-7 W | World Community Grid |
| Pi 5 (8 GB) | BCM2712, 4x A76 | 8 GB | ~15 GFLOPS | 6-10 W | Einstein@Home |

### Installation on Raspberry Pi OS

```
BOINC ON RASPBERRY PI
================================================================

# Install BOINC client
sudo apt update
sudo apt install boinc-client boinc-manager

# Start client
sudo systemctl enable boinc-client
sudo systemctl start boinc-client

# Attach to project (example: Rosetta@home)
boinccmd --project_attach http://boinc.bakerlab.org YOUR_ACCOUNT_KEY

# Monitor
boinccmd --get_state
boinccmd --get_tasks
```

### Pi as Gateway + Compute Node

The ideal sensing layer role for a Raspberry Pi is as a mesh gateway that also contributes compute:

1. **Primary role:** MQTT broker, Meshtastic gateway, Home Assistant, NTP server
2. **Secondary role:** BOINC CPU contribution during idle periods
3. **BOINC scheduling:** Configure BOINC to use only 50% of CPU cores and suspend during high gateway load
4. **Power profile:** 7-10W total (gateway + BOINC), well within solar+battery budget for an indoor node

---

## 7. Screensaver-as-Science Architecture

The screensaver-as-science concept combines live environmental data visualization with volunteer computing into a single display that is both informative and productive [7].

### Architecture

```
SCREENSAVER-SCIENCE ARCHITECTURE
================================================================

  [Weather Mesh]                    [BOINC/F@h Server]
       │                                   │
       │ MQTT                              │ Work Units
       v                                   v
  ┌──────────────────────────────────────────────┐
  │              GSD CO-OP NODE                   │
  │                                               │
  │  ┌─────────────────┐  ┌────────────────────┐ │
  │  │ Visualization   │  │ Science Compute    │ │
  │  │ Engine          │  │                    │ │
  │  │                 │  │ BOINC work units   │ │
  │  │ Live pressure   │  │ F@h protein folds  │ │
  │  │ gradient map    │  │ Einstein@Home FFT  │ │
  │  │                 │  │                    │ │
  │  │ Wind vectors    │  │ GPU: 80% compute   │ │
  │  │ Temperature     │  │       20% render   │ │
  │  │ UV index        │  │                    │ │
  │  │ Rain/snow       │  │ CPU: scheduling,   │ │
  │  │                 │  │      mesh I/O      │ │
  │  └─────────────────┘  └────────────────────┘ │
  │           │                     │             │
  │           └──── Display ────────┘             │
  │                (HDMI / Screensaver)           │
  └──────────────────────────────────────────────┘
```

### Visualization Modes

| Mode | Data Source | Rendering | GPU Load |
|---|---|---|---|
| Pressure gradient | Mesh weather nodes | Smooth color field | 5-10% |
| Wind vector field | Mesh + NOAA API | Animated arrows | 10-15% |
| Temperature heatmap | Mesh weather nodes | Interpolated color grid | 5-10% |
| Precipitation radar | NOAA NEXRAD | Radar overlay on map | 10-20% |
| Protein fold progress | Folding@home client | 3D molecular visualization | 15-25% |
| Pulsar search spectrogram | Einstein@Home | Frequency-time plot | 10-15% |

### GPU Time-Sharing

The visualization engine and science compute share the GPU:

- **Display active (user present):** 20% GPU to visualization, 80% to BOINC/F@h
- **Display idle (screensaver):** 5% GPU to periodic viz update, 95% to science
- **High-priority compute:** BOINC deadline approaching -- 100% to science, freeze visualization

---

## 8. GSD Co-op Node Design

The complete reference design for a GSD co-op node that combines sensing, communication, visualization, and volunteer computing [7][8].

### Hardware Configuration

| Component | Specification | Role | Price |
|---|---|---|---|
| CPU | i7 or Ryzen 5+ (or Pi 5) | Orchestration, mesh I/O | Existing |
| GPU | RTX 3060+ (CUDA) | Science compute + visualization | Existing |
| MCU | ESP32-S3 (USB-connected) | Sensor acquisition | $12 |
| LoRa | RFM95W via ESP32 | Mesh telemetry | $8 |
| Sensors | BME280 + AHT20 + GUVA-S12SD | Atmospheric monitoring | $10 |
| Display | HDMI monitor or TV | Screensaver-science visualization | Existing |
| Network | Ethernet or WiFi | BOINC communication | Existing |

### Software Stack

```
GSD CO-OP NODE SOFTWARE STACK
================================================================

Layer 4: Visualization
  - Custom OpenGL/Vulkan screensaver rendering live weather data
  - BOINC project visualization overlays

Layer 3: Science Compute
  - BOINC client (multiple projects)
  - Folding@home client (GPU work units)
  - Scheduled: BOINC 80% time, F@h 20% time

Layer 2: Data Pipeline
  - Mosquitto MQTT broker (local)
  - InfluxDB (time-series storage)
  - Grafana (web dashboard)

Layer 1: Sensing + Communication
  - ESP32 firmware (sensor reading + LoRa TX)
  - Meshtastic (mesh routing)
  - NOAA API poller (hourly calibration)

Layer 0: Operating System
  - Linux (Ubuntu/Fedora) or Raspberry Pi OS
  - systemd services for all components
  - Watchdog timers for crash recovery
```

---

## 9. Zero-Trust Work Unit Validation

BOINC's work unit validation uses a quorum consensus model that mirrors the zero-trust observation signing used for weather data [1][3].

### BOINC Quorum Validation

1. Server sends the same work unit to N independent hosts (typically N=3)
2. Each host computes the result independently
3. Host uploads result to server
4. Server compares results:
   - If M of N results agree (within tolerance), result is accepted
   - Agreeing hosts receive credit
   - Disagreeing hosts are flagged (potential error or malicious result)
5. Tolerance is defined per project (exact match for integer problems, epsilon for floating-point)

### Applying Quorum to Weather Data

The same principle applies to mesh weather observations:

| BOINC Concept | Weather Mesh Equivalent |
|---|---|
| Work unit | Observation time window (e.g., 5-minute interval) |
| Host result | Individual node's sensor readings |
| Quorum check | Neighbor comparison (+/- 2 sigma) |
| Credit | Reputation score increase |
| Disagreement flag | Node flagged for recalibration |
| Server | Gateway or peer consensus |

### Trust Without Authority

The critical design principle: **no central server decides truth.** In BOINC, the server coordinates but the truth emerges from quorum. In the weather mesh, the gateway coordinates but the truth emerges from sensor agreement and NOAA reference comparison. If the gateway fails, nodes can still validate each other peer-to-peer using signed observation packets and local neighbor comparison.

---

## 10. DoltHub Federation Integration

DoltHub provides Git-for-data infrastructure that enables weather observation databases to be forked, modified, and merged like code repositories [9].

### DoltHub for Weather Data

Dolt is a SQL database that supports Git-style operations: branch, commit, merge, diff, push, pull. For the sensing layer:

- **Each region operates its own Dolt database** of weather observations
- **Nodes push signed observations** to their regional Dolt server
- **Regional databases federate** by pushing/pulling to DoltHub (the GitHub-equivalent for data)
- **Scientists can fork** any regional database, run analysis, and submit corrections as pull requests
- **Data provenance:** Every observation has a commit hash, author (node ID), timestamp, and signature

### Federation Architecture

```
DOLTHUB FEDERATION
================================================================

  [Node A] ──signed obs──> [Regional Dolt Server]
  [Node B] ──signed obs──>      │
  [Node C] ──signed obs──>      │
                                 │ git push
                                 v
                          [DoltHub Cloud]
                                 │
                    ┌────────────┼────────────┐
                    v            v            v
              [Region 1]  [Region 2]  [Region 3]
              Pacific NW   Cascadia    BC Coast

  Scientists:
    dolt clone tibsfox/pnw-weather
    dolt sql "SELECT * FROM observations WHERE pressure < 1000"
    # Fork, analyze, contribute corrections
```

---

## 11. Scientific Applications

The co-op mesh contributes to multiple scientific domains simultaneously [10][11].

### Atmospheric Science

- **Boundary layer profiling:** Mesh weather nodes at different elevations provide vertical temperature and humidity profiles for boundary layer research
- **Convergence zone detection:** Multiple nodes detect the Puget Sound Convergence Zone (PSCZ) by measuring wind direction convergence
- **Microclimate mapping:** Hyperlocal temperature and humidity data reveals urban heat islands, cold air drainage, and rain shadows

### Protein Folding and Disease Research

Folding@home simulations contribute to:
- Protein-drug interaction modeling for new therapeutics
- Understanding misfolding diseases (Alzheimer's, Parkinson's, prion diseases)
- Vaccine design via spike protein dynamics

### Radio Astronomy

Einstein@Home searches for continuous gravitational waves from neutron stars using data from LIGO, Virgo, and radio telescope surveys. Each work unit analyzes a small patch of parameter space -- and a volunteer's computer might be the one that discovers the next millisecond pulsar.

### Climate Modeling

climateprediction.net runs ensemble climate models with varied parameters. Each work unit is a complete climate simulation spanning decades to centuries. The ensemble approach quantifies uncertainty in climate projections -- something a single supercomputer run cannot provide.

---

## 12. Energy and Sustainability

Running volunteer computing has an energy cost. The sensing layer approach to sustainability is transparency: know what you consume, decide what it is worth [12].

### Energy Cost Analysis

| Configuration | Power Draw | Monthly kWh | Monthly Cost ($0.12/kWh) | Science Output |
|---|---|---|---|---|
| Pi 5 (BOINC CPU only) | 8 W | 5.8 kWh | $0.70 | ~15 GFLOPS |
| Desktop (CPU BOINC) | 65 W | 46.8 kWh | $5.62 | ~100 GFLOPS |
| Desktop (GPU F@h) | 200 W | 144 kWh | $17.28 | ~3,000 GFLOPS |
| Desktop (idle, no compute) | 45 W | 32.4 kWh | $3.89 | 0 |

**Net cost of GPU volunteer computing vs idle:**
- Additional power: 200W - 45W = 155W
- Additional monthly cost: 155W * 720h * $0.12 / 1000 = **$13.39**
- Science output: ~3,000 GFLOPS of protein folding computation

### Solar Offset

A 100W solar panel on the roof of a home generates approximately:
- PNW annual average: 3.5 kWh/day = 106 kWh/month
- This offsets approximately 73% of a GPU volunteer computing workload
- Net zero is achievable with a 200W panel system

> **Related:** See [PSS](../PSS/) for solar panel sizing and energy harvest calculations, [SYS](../SYS/) for power monitoring infrastructure.

---

## 13. Security and Sandboxing

Running third-party code (BOINC work units) on your computer requires security boundaries [1][13].

### BOINC Security Model

BOINC implements multiple layers of sandboxing:

1. **Code signing:** All BOINC applications are signed by the project's private key. The client verifies the signature before execution.
2. **Dedicated user account:** BOINC applications run as a low-privilege user (typically `boinc`) with no access to the host user's files.
3. **Filesystem isolation:** Work units can only read/write within their designated slot directory.
4. **Network restriction:** BOINC applications communicate only with the project server (outbound only, no listening sockets).
5. **CPU and memory limits:** The BOINC client enforces time and memory limits per work unit.

### Security Recommendations for GSD Nodes

| Recommendation | Rationale | Implementation |
|---|---|---|
| Only attach to official projects | Rogue projects could contain malware | Use boincstats.com verified project list |
| Run BOINC in a container | Isolation from host filesystem | Docker or systemd-nspawn |
| Monitor outbound traffic | Detect anomalous communication | iptables logging, Pi-hole DNS |
| Separate BOINC network | Isolate from sensing LAN | VLAN or separate WiFi network |
| No cryptocurrency mining | Against BOINC ToS; security risk | Verify project descriptions |

> **SAFETY WARNING:** Never run BOINC projects that offer financial rewards (tokens, coins, cryptocurrency). These projects have different incentive structures that attract malicious actors. Stick to established university and research institution projects.

### Folding@home Security

Folding@home uses a different model:
- Work units are encrypted in transit
- The client verifies server certificates
- No third-party code execution -- only the F@h engine runs
- Work results are validated server-side before credit

---

## 14. Cross-References

> **Related:** [SYS](../SYS/) -- systems administration for co-op node deployment, MQTT broker configuration, and fleet management. [K8S](../K8S/) -- container orchestration for multi-node co-op compute clusters. [BPS](../BPS/) -- field sensor patterns that generate the weather data consumed by the visualization engine. [ECO](../ECO/) -- ecological monitoring data sources that feed into co-op data pipelines. [SGL](../SGL/) -- signal processing algorithms used in screensaver visualization and FFT-based science computation. [T55](../T55/) -- timing infrastructure for synchronized data collection and BOINC deadline management. [LED](../LED/) -- LED visualization of compute contribution metrics. [EMG](../EMG/) -- emergency compute response (re-prioritizing BOINC during seismic events via Quake Catcher Network). [PSS](../PSS/) -- power and energy monitoring for co-op node sustainability. [GSD2](../GSD2/) -- GSD mesh architecture patterns applicable to federated science networks.

---

## 15. Sources

1. Anderson, D.P. (2020): "BOINC: A Platform for Volunteer Computing." UC Berkeley. boinc.berkeley.edu
2. Folding@home Consortium (2025): "Folding@home Statistics and Publications." foldingathome.org
3. BOINC Project (Jan 2026): "BOINC Client 8.2.8 Release Notes." boinc.berkeley.edu/wiki/Release_Notes
4. Shirts, M.R. and Pande, V.S. (2000): "Screen Savers of the World Unite!" Science 290(5498), 1903-1904.
5. NVIDIA (2025): "CUDA C++ Programming Guide v12.3." docs.nvidia.com/cuda/cuda-c-programming-guide/
6. Raspberry Pi Foundation (2025): "Raspberry Pi 5 Specifications." raspberrypi.com/products/raspberry-pi-5/
7. GSD Ecosystem (2026): "Screensaver-as-Science Architecture Specification." Internal design document.
8. GSD Ecosystem (2026): "Co-op Node Reference Design." Internal design document.
9. DoltHub (2025): "Dolt -- It's Git for Data." dolthub.com
10. Einstein@Home (2025): "Citizen Science for Gravitational Wave Astronomy." einsteinathome.org
11. climateprediction.net (2025): "The World's Largest Climate Modelling Experiment." climateprediction.net
12. US EIA (2025): "Average Retail Price of Electricity." eia.gov/electricity/monthly/
13. Anderson, D.P. (2009): "BOINC: A System for Public-Resource Computing and Storage." Proc. 5th IEEE/ACM International Workshop on Grid Computing, 4-10.
14. Stanford University (2025): "Quake-Catcher Network -- Citizen Seismology." qcn.stanford.edu
15. Khronos Group (2025): "OpenCL Specification." khronos.org/opencl/
16. BOINC Wiki (2025): "GPU Computing." boinc.berkeley.edu/wiki/GPU_computing
