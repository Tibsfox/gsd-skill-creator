# Photonic AI Connectivity: Scaling Energy-Efficient Systems

**Catalog:** ELE-PHO | **Cluster:** Electronics + AI & Computation + Energy
**Date:** 2026-04-05 | **Source:** Max Planck Institute Distinguished Lecture (~74 min), Prof. Keren Bergman, Columbia University
**College:** Electronics, Mathematics, Science, Business/Economics, Infrastructure

## Abstract

Prof. Keren Bergman's lecture documents the convergence of silicon photonics and AI compute scaling. The central thesis: a 100x bandwidth cliff between GPU socket internals (80-100 TB/s) and system-scale interconnects causes massive GPU idle time and energy waste. Embedded photonic interconnects using disk modulators, frequency comb lasers, and 3D EIC-on-PIC integration can eliminate this cliff, making "the world my cache" -- any GPU accessing any memory as if local.

## Key Findings

### The Bandwidth Cliff
- Inside GPU socket: 80-100 TB/s bandwidth
- Outside socket to box: drops 10x
- At system scale (100,000 boxes): drops 100x total
- While waiting for data across this bottleneck, GPUs idle, wasting energy
- AI training compute growing ~10x per year (logarithmic scale since 2018-2020)

### Huawei vs. Nvidia Case Study
- Huawei's CloudMatrix used pluggable fiber optics to beat Nvidia's copper-connected NVL72 by 2x
- With 3x inferior chips -- fiber compensated for the chip performance gap
- DeepSeek ran on this hardware
- First commercial example of photonics in the scale-up domain

### Disk vs. Ring Resonators
- Rings have two critical dimensions (inner and outer edge); disks have one (diameter)
- Disks show much less resonant frequency variation at wafer scale
- Record-small disks at ~2 micron radius, 32 Gbit/s modulation at 0.4V peak-to-peak
- Truly CMOS-compatible with advanced nodes

### Frequency Comb Technology
- Single pump laser generates many wavelength channels from silicon nitride resonator
- Kerr nonlinearity creates equally-spaced wavelength channels
- 100-300 GHz FSR; higher FSR = better conversion efficiency
- Enables dense WDM without separate laser per channel

### 3D EIC-on-PIC Integration
- Electronic IC bonded face-down on photonic IC at 25-micron pad pitch
- 80 channels demonstrated: 5 Tbit/mm^2 bandwidth density
- TX: 50 fJ/bit. RX: ~70 fJ/bit. Full link: 120 fJ/bit (record)
- Required 300mm wafer tools for alignment precision

## Key Numbers

| Metric | Value |
|--------|-------|
| Socket internal bandwidth | 80-100 TB/s |
| Socket-to-system bandwidth drop | ~100x |
| AI compute growth rate | ~10x per year |
| Grok 3 training energy | >NYC annual electricity (134M MWh) |
| Disk modulator radius | ~2 microns (record) |
| Modulation speed | 32 Gbit/s per channel |
| Drive voltage | 0.4V peak-to-peak |
| 80-channel bandwidth density | 5 Tbit/mm^2 |
| Full TX+RX energy | 120 fJ/bit (record) |
| AI workload speedup | ~3x with photonic memory |
| Nvidia photonics investments | $2B each in Coherent and Lumentum |
| Lumentum market cap growth | $1B to $50B |

## Rosetta Translation

| Hardware Concept | GSD Software Equivalent |
|---|---|
| Frequency comb (one laser, many channels) | Single orchestrator (mayor) spawning many parallel workers |
| Bandwidth density (Tbit/mm^2) | Context density -- useful information per token of context window |
| Disk resonator (selection + modulation) | Intent classifier -- routes and transforms in a single operation |
| Socket-to-system bandwidth cliff | Session boundary -- rich context within, lossy handoff across |
| Embedded photonics inside the package | Skills loaded directly into agent rather than fetched externally |

## Cross-Cluster Connections

- **TSMC COUPE:** TSMC's Co-Packaged Optics platform is the commercial implementation of Bergman's research. COUPE bonds electronic IC on photonic IC via hybrid bonding -- targeting 6.4-12.8 Tbps by 2026.
- **Energy:** Central motivation is eliminating AI energy waste. Training Grok 3 exceeded NYC annual electricity.
- **Space:** NASA DSOC (Deep Space Optical Communications) uses the same photonic principles at planetary distances. Radiation effects on silicon photonic resonators are active research.
- **Fox Companies -- FoxFiber:** THIS IS THE TALK. Bergman's research defines the technology stack FoxFiber would commercialize.

## Study Guide Topics (8)

1. The bandwidth cliff -- power cost of electrical vs. optical signaling at distance
2. Ring vs. disk resonators -- whispering gallery modes, manufacturing variation
3. Frequency comb generation -- Kerr nonlinearity in silicon nitride
4. Energy per bit budgeting -- decompose 120 fJ/bit into components
5. 3D photonic-electronic integration -- 300mm wafer alignment requirements
6. Huawei CloudMatrix case study -- fiber optics compensating for compute gap
7. Photonic memory disaggregation -- latency vs. bandwidth tradeoffs
8. Silicon photonics commercialization barriers -- laser supply chain maturation

## DIY Try Sessions (2)

1. **Bandwidth cliff simulator** -- Python simulation of AI training cluster: 8 GPUs at 80 TB/s, 72 sockets copper-connected (800 GB/s), 100K sockets via fiber (8 GB/s). Simulate distributed matrix multiply, measure idle GPU cycles, then replace copper with photonic links (8 TB/s) and compare.
2. **WDM link budget calculator** -- Spreadsheet/script computing power budget for a WDM photonic link: channels (8-128), data rate (10-32 Gbit/s), modulator loss, comb efficiency, laser wall-plug efficiency. Find optimal operating point for energy/bit vs. total bandwidth.
