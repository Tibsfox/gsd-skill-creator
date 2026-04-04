# Research Queue: Compute Architecture, Energy Storage, and Photonic Interconnects

Three-video synthesis covering memory-centric computing, battery energy storage parameters, and photonic connectivity for AI systems. Processed 2026-04-03.

---

## Video 25: Memory-Centric Computing — Enabling Fundamentally Efficient Computers

**Speaker:** Professor Onur Mutlu (ETH Zurich, formerly Carnegie Mellon)
**Venue:** Georgia Tech ECE Seminar | **Duration:** ~1h13m
**Core thesis:** Modern computing is processor-centric and fundamentally bottlenecked by data movement. The solution is memory-centric architecture where computation happens close to or inside memory.

### The Data Movement Problem

- Computing today is bottlenecked by data, not computation. AI/ML, genomics, astronomy, and all important workloads are data-intensive with exploding dataset sizes.
- Google 2015 data: across all data center workloads, processors spend ~50% of time stalled waiting for memory. Processors execute useful instructions only 10-20% of the time.
- Energy cost: a simple 32-bit integer add is ~20 picojoules; a DRAM access is ~60x more expensive. Data movement dominates energy consumption.
- Characterization studies show >62% of total system energy in mobile ML workloads (TensorFlow inference, Chrome browsing) is spent on data movement, not computation.
- For LSTMs and transducers, the vast majority of energy goes to moving data through cache hierarchy and interconnect to the processor.
- Systems add enormous complexity (multi-level caches, out-of-order execution, multithreading, prefetching) to tolerate memory latency. This complexity itself wastes energy with diminishing returns.

### Two Approaches to Processing-in-Memory (PIM)

**1. Processing Near Memory (PNM) — shorter term, already happening:**
- Place logic layers physically close to memory arrays using 3D stacking (HBM, hybrid bonding, monolithic 3D).
- Tesseract system: array of simple cores in logic layer beneath 3D-stacked memory. Graph processing mapped via message-passing distributed model. Achieved ~10x performance improvement over conventional architectures; later work pushed to 100x.
- Real industry adoption: Samsung, SK Hynix, Alibaba have built DRAM chips with near-bank processing for ML inference and recommendation systems.
- CXL interfaces enabling computation offloading to memory-side processing units.
- AquaBolt (Samsung), UPMEM, and others ship commercial PNM products.
- Heterogeneous accelerator design: different near-memory engines for different layer types (fully-connected vs. attention layers), improving both performance and energy.

**2. Processing Using Memory (PUM) — longer term, higher potential:**
- Exploit analog operational properties of memory cells themselves to perform computation.
- **RowClone:** Copy a 4KB page inside DRAM by violating back-to-back activate timing parameters. Latency drops from ~1000ns to ~90ns; energy from ~50 microjoules to near-zero. Verified on real commodity DRAM chips.
- **Ambit:** Concurrently activate three rows to perform bitwise majority function natively in DRAM sense amplifiers. Majority + NOT = functionally complete (any Boolean function). Demonstrated AND, OR, NAND, NOR with >90% success rates on off-the-shelf DRAM chips.
- True random number generation by exploiting metastability of sense amplifiers when timing parameters are violated.
- **SIMDRAM:** Fine-grained DRAM modification enabling 512-bit vector operations per mat. Full compiler pass (LLVM-based) for auto-vectorization. Orders of magnitude performance and energy improvements on regular/vectorizable workloads.
- All compute happens at massive parallelism: millions of cells operating simultaneously across DRAM subarrays.

### Memory Technology Scaling Challenges

- **RowHammer:** Repeatedly activating a DRAM row disturbs adjacent rows, causing bit flips. The activation threshold has dropped ~100x over 10 years (2012-2022) as cells shrink.
- **RowPress:** Simply holding a row active for extended time leaks charge to neighbors. Changes the disturbance threshold randomly and unpredictably.
- **Variable Read Disturbance:** Disturbance thresholds change over time due to aging. Newly discovered effect.
- These issues demand intelligent memory controllers (already adopted: per-row activation counting in industry DRAM, first public paper at ISSCC 2023).
- The same infrastructure built for RowHammer defense (activation counting, metadata tracking inside DRAM) can be extended for in-memory computation.

### Adoption and Open Challenges

- Virtual memory support for PIM is "one of the hardest issues in computer architecture" — coherence, synchronization, address translation across heterogeneous compute substrates.
- Compiler and programming model support needed. Pure compiler approaches work but capture fewer opportunities than programmer-assisted approaches.
- Security implications: RowClone creates covert/side channels with higher bandwidth than external observation. DRAM-based computation on encrypted data (homomorphic encryption) is a frontier.
- Almost all infrastructure and tools are open-sourced.

### Relevance to Our Chipset Model

- Direct validation of our memory-centric architecture direction. The processor/memory dichotomy is the fundamental bottleneck.
- SIMDRAM's LLVM compiler pass for auto-vectorization to memory arrays maps to how our chipset could expose PIM primitives.
- The heterogeneous near-memory accelerator approach (different engines for different layer families) aligns with our multi-chip, task-specific architecture.
- RowHammer/RowPress issues are real security concerns for any system doing PIM on commodity DRAM.

---

## Video 27: 10 Key BESS Parameters Every Engineer Should Know

**Speaker:** BESS engineering instructor (from a 4-week BESS Boot Camp course)
**Duration:** ~25m
**Core thesis:** Battery Energy Storage Systems have 10 fundamental parameters that determine project viability, sizing, and operational strategy.

### The 10 Parameters

**1. Energy Capacity (kWh / MWh)**
- Total energy the battery system can store. Analogous to water tank volume.
- Real example: Hornsdale Power Reserve (Australia) = 194 MWh total capacity.
- Determines project scale. Cannot store infinite energy; hard physical limit per chemistry.

**2. Power Rating (kW / MW)**
- Maximum instantaneous power the battery can deliver. Analogous to pipe diameter on a water tank.
- Hornsdale: 150 MW power rating.
- Always distinct from energy capacity. Projects specify both: e.g., "150 MW / 194 MWh" or "125 kW / 250 kWh."

**3. Duration (hours)**
- How long the battery can supply power at rated output. Duration = Energy Capacity / Power Rating.
- Example: Kilokari BESS = 20 MW / 40 MWh = 2-hour duration.
- Critical classification: <4 hours = short duration storage; >=4 hours (some say >=8) = long duration storage. Different applications for each.

**4. Round-Trip Efficiency (RTE)**
- Ratio of energy out to energy in, expressed as percentage. Losses occur in both charging and discharging.
- **DC-to-DC efficiency** (battery cells only): typically ~95%. This is what manufacturers advertise.
- **AC-to-AC efficiency** (full system, point-of-interconnection to POI): includes transformer losses, switch gear, power conversion system (PCS: AC<->DC), cable losses, auxiliary power. Realistic grid-scale RTE: 80-86%.
- The metric utilities actually care about. Critical for project economics.

**5. Depth of Discharge (DOD)**
- How much of total capacity can actually be used. Deep discharge stresses batteries and shortens life.
- Lithium-ion: typically 80-90% DOD. Lead-acid: ~50%.
- If DOD is 90% and you need 100 kWh at POI, you must install ~111 kWh (overbuild by ~10%).
- Varies by battery chemistry. Must check manufacturer specs before project finalization.

**6. Cycle Life**
- One cycle = one full charge + one full discharge (to DOD). Half charge + half discharge = 0.5 cycle.
- Every cycle degrades battery capacity (same as phone batteries losing capacity over years).
- Typical BESS cycle life: ~8,000 cycles. After that, capacity degraded to the point of being unsuitable for primary application (may be usable for secondary functions).
- Calculate annual cycles: (cycles/day) x 365 x project lifetime = required cycle life.

**7. C-Rate**
- Rate at which battery charges/discharges relative to capacity.
- 1C = full charge/discharge in 1 hour. 2C = 30 minutes. 0.5C = 2 hours. 0.25C = 4 hours.
- Higher C-rate = higher current = more heat = more battery stress = faster degradation.
- Utility-scale projects typically rated 0.5C or 0.25C (gentle, long-life operation). Power-heavy applications (e.g., heavy machinery) need higher C-rates.

**8. Calendar Degradation**
- Capacity loss over time even without cycling. Batteries degrade just sitting idle.
- Lithium-ion: typically 1-2% capacity loss per year from calendar aging alone.
- Affected by ambient temperature, storage SOC level, and chemistry.
- Must be factored into project lifetime sizing alongside cycle degradation.

**9. State of Charge (SOC)**
- Real-time percentage of remaining energy. Like a phone battery indicator.
- Energy management systems use SOC to enforce operational limits: e.g., don't charge above 90% SOC, don't discharge below 20% SOC (to protect battery health and enforce DOD limits).

**10. State of Health (SOH)**
- Overall battery condition relative to original capacity. Starts at 100% (beginning of life, BOL).
- Degrades due to cycling, calendar aging, C-rate abuse, temperature exposure.
- Manufacturer defines end-of-life SOH (e.g., 70%). Below that threshold, battery should not be used for primary application.
- Critical for calculating overbuild requirements and project lifetime economics.

### Sizing Relationships

All 10 parameters interact:
- Need X kWh at POI? Account for RTE losses (divide by ~0.85), DOD limits (divide by ~0.9), and SOH degradation over lifetime.
- Higher C-rate = shorter life = more frequent replacement = higher lifecycle cost.
- Calendar degradation + cycle degradation compound over time.

### Relevance to Our Energy Research

- Provides the parameter vocabulary for evaluating any BESS project in our Infrastructure/Energy Rosetta clusters.
- The AC-to-AC round-trip efficiency framing (full system, not just cells) is the honest metric for grid infrastructure evaluation.
- Duration classification (short vs. long) maps directly to grid application types we track in weather/grid research.
- Overbuild calculations (DOD + SOH + RTE cascading) are essential for any cost modeling we do.

---

## Video 32: Scaling Energy-Efficient AI with Photonic Connectivity

**Speaker:** Professor Keren Bergman (Columbia University, Director of Columbia Nano Initiative)
**Venue:** Distinguished Lecture Series (European institute) | **Duration:** ~1h14m
**Core thesis:** AI compute scaling is energy-unsustainable with electrical interconnects. Silicon photonic integrated circuits with wavelength-division multiplexing can eliminate the 100x bandwidth cliff between in-socket and system-scale communication.

### The AI Energy Crisis

- AI training compute is growing ~10x per year over the last decade. This is unprecedented in technology history.
- Training Grok 3 alone consumed more energy than the entire New York City metro area's annual consumption (~134 million MWh).
- Energy consumption is growing on a logarithmic scale with no sign of slowing. Nuclear power, new energy sources actively being pursued by data center operators.
- The root cause: GPUs are power-hungry, but the dominant waste comes from inter-GPU communication, not computation itself.

### The Bandwidth Cliff

- Inside a GPU socket (including HBM): terabytes/second of bandwidth. Tremendous capability.
- Going outside the socket (copper interconnects between GPUs): bandwidth drops by ~10x.
- Going to system scale (20,000-100,000 GPUs): bandwidth drops by ~100x from in-socket levels.
- This 100x drop means GPUs sit idle waiting for data from remote memory, wasting enormous energy. "Drinking data through a tiny straw."
- The Nvidia NVL72 uses copper to connect 72 GPUs. That's the scaling limit of copper. Cannot go much further.

### The Huawei/DeepSeek Proof Point

- Huawei Cloud Matrix system: took 3x inferior chips (US export-restricted H-series) and connected them with linear pluggable fiber optics instead of copper.
- Result: achieved 2x the performance of the NVL72 using 3x weaker individual chips. The interconnect won.
- First commercial system using fiber optics inside the scale-up domain (GPU-to-GPU within a system, not rack-to-rack).
- DeepSeek was trained on this system. The algorithm gets credit, but the interconnect architecture underneath was transformative.

### Nvidia's Silicon Photonics Move

- March 2025 (pre-OFC conference): Nvidia announced silicon photonic integrated circuits fabricated at TSMC (65nm mature node for photonics, 6nm for electronics).
- Using micro-ring resonators (not Mach-Zehnder interferometers) because rings are the only way to achieve required bandwidth density and energy efficiency inside the socket.
- TSMC doing photonics is a game-changer. The ecosystem is now real.
- Startups: Celestial AI, Lightmatter, Ayar Labs (Nvidia invested $2B+) all racing in this space.

### Columbia's Comb Laser + Disk Modulator Architecture

**Frequency Comb Lasers (with Lipson and Gaeta labs):**
- Silicon nitride resonator chip generates 80+ wavelength channels from a single pump laser.
- Free spectral range (FSR) designs at 100, 200, 300 GHz. Higher FSR = better pump-to-comb conversion efficiency = lower energy per bit.
- Working toward integrating comb + silicon photonic transceiver on single chip (silicon nitride is part of CMOS process).

**Disk Micro-Ring Modulators:**
- Whispering gallery mode disk resonators instead of traditional ring resonators.
- Each disk is resonant at one specific wavelength: simultaneous wavelength demultiplexing + modulation in one device.
- Record-small disk sizes (~3.5 micron radius). 32 Gbit/s at only 0.4V peak-to-peak (advanced-CMOS-compatible voltage).
- Thermal isolation via undercut air pockets beneath disks: ~5x improvement in tuning efficiency, path to 20x.
- Disk fabrication variation is much tighter than ring variation (fewer sensitive edges), reducing thermal tuning energy.

**Key Metrics:**
- Bandwidth density: the critical metric. How much bandwidth per mm of chip perimeter (the most precious real estate).
- Achieved ~5 terabit/s per mm in 3D-integrated photonic/electronic chip.
- TX energy: 50 femtojoules/bit (entire transmitter). RX: ~70 fJ/bit. Full link including laser: ~300 fJ/bit.
- These numbers are 10-100x better than pluggable optics and competitive with the research frontier.

**3D Integration Demonstration:**
- Electronic IC (28nm CMOS) flip-chip bonded on top of photonic IC. 80 channels on-chip.
- 25-micron pad pitch. Required 300mm wafer-scale tools (AIM Photonics foundry in Albany, NY).
- Achieved 5+ Tbit/s per mm bandwidth density at 50 fJ/bit TX.

### Photonics-Enabled Memory Architecture

- Current GPUs are memory-capacity-limited: can only access HBM within the package.
- With photonic interconnects, memory is no longer package-limited. Can optically connect to memory banks at arbitrary distance with near-in-socket bandwidth.
- "The world is my cache" — any memory in the system is accessible at near-local bandwidth and energy cost.
- Eliminates the 100x bandwidth cliff entirely. Simulations show 3-5x speedup on memory-bound workloads, directly translating to proportional energy savings.

### Fabrication Infrastructure

- AIM Photonics (Albany, NY): US manufacturing institute, 300mm silicon photonic fabrication. Research-grade but with commercial-quality 300mm tools.
- Full-reticle runs (not just MPW): enables wafer-scale characterization, variation studies, and wafer-scale packaging.
- Custom 300mm wafer-scale probber for automated optical + electrical testing.
- TSMC 65nm for photonics is mature and sufficient: photonic waveguide dimensions (~1.3-1.5 microns) don't need advanced nodes. What matters is tool precision for uniformity, not feature size.

### What's Missing for Commercialization

- Multi-wavelength laser sources at scale and cost. Coherent (formerly II-VI/Finisar) stock went from $1B to $50B on laser demand.
- Wall-plug efficiency of pump lasers (~25% today; needs ~50% to halve link energy).
- Full ecosystem integration (photonics + electronics + packaging + thermal management).
- Nvidia is investing billions but commercial integrated photonic interconnects don't exist at scale yet. "The ecosystem is not there" but is rapidly developing.

### Relevance to Future Compute Architectures

- Directly validates and extends the memory-centric computing thesis from Video 25: even if you solve the memory-compute distance problem within a chip, the inter-chip bandwidth cliff is equally devastating. Photonics solves both.
- The 100x bandwidth cliff is the reason AI energy consumption is unsustainable. Photonics is the only path to eliminating it.
- Comb laser + ring modulator architecture is a masterclass in co-design across physics, devices, circuits, and systems.
- For our chipset model: any multi-chip architecture will hit the bandwidth cliff without photonic interconnects. This is the interconnect technology our architecture needs to plan for.

---

## Cross-Video Synthesis

### The Three Bottlenecks (and How They Connect)

| Layer | Bottleneck | Video | Solution Direction |
|-------|-----------|-------|--------------------|
| Within chip | Data movement processor<->memory | 25 | Processing-in/near-memory (PIM/PNM) |
| Between chips | Bandwidth cliff (100x drop) | 32 | Silicon photonic interconnects |
| Grid infrastructure | Energy storage economics | 27 | Proper BESS parameter engineering |

These three videos describe a single stack: compute architecture (25) needs photonic interconnects (32) to scale, and the entire data center energy budget depends on grid storage (27) to be sustainable.

### Key Takeaways for Our Work

1. **Memory is not storage; memory is compute.** Mutlu's work shows DRAM cells already perform Boolean operations. Our chipset architecture should treat memory arrays as compute substrates, not passive stores.

2. **The interconnect is the architecture.** Bergman's proof (Huawei beating Nvidia with weaker chips + better interconnect) demonstrates that communication topology dominates over raw compute capability. Our multi-chip model must plan for photonic interconnects as a first-class architectural concern.

3. **Energy efficiency is measured at the system boundary.** The BESS video's AC-to-AC efficiency framing applies universally: measure at the point of interconnection, not at the component level. A GPU's FLOPS/watt means nothing if it wastes 80% of energy waiting for data.

4. **Open infrastructure enables research velocity.** Both Mutlu (DRAM testing infra, FPGA boards, LLVM compiler passes) and Bergman (AIM Photonics full-reticle runs, wafer-scale probber) emphasize open/accessible infrastructure as the accelerant. Our open-source approach aligns.

5. **Heterogeneity is inevitable.** Different memory layers need different compute approaches (PNM for bandwidth-heavy, PUM for bitwise-parallel). Different interconnects serve different scales (electrical in-package, photonic inter-package). Different storage durations serve different grid applications. Uniformity is the enemy of efficiency.
