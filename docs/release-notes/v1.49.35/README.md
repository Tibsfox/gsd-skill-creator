# v1.49.35 — Voxel as Vessel, Grandmother Cedar's Complete Inventory, and the Data Source Registry

**Shipped:** 2026-03-10
**Commits:** 5 (+ merge commit)
**Files:** 50 | **Lines:** ~18,600 | **Size:** ~2.5 MB
**Branch:** dev → main
**Dedication:** For Sam — who keeps the garden growing and the data flowing. ^.^

## Summary

Three bodies of work converge in one release. A complete research atlas on encoding knowledge in Minecraft voxel worlds backed by distributed storage (VAV — 5 missions, 21 modules, 116 sources, 3 PoC experiments). A gap closure mission that completes the ECO Living Systems Taxonomy with 38 new species profiles, bringing all 32 verification tests to PASS. And an expansion of the PNW Shared Data Source Registry from 13 to 46 publicly funded datasets, covering the full breadth of the research series from satellite imagery to salmon streams.

This release brings the PNW Research Series to 15 projects (14 + shared data registry), 322+ files, and 14+ MB of research content mapping the Pacific Northwest bioregion as a living system.

## Key Features

### 1. Voxel as Vessel — Complete Research Atlas (`www/PNW/VAV/`, 37 files, ~16,000 lines)

Project #14 in the PNW Research Series. A structural discovery and its consequences: Minecraft region files and Ceph RADOS objects share the same coordinate-keyed, chunked, zlib-compressed, hierarchically typed architecture — not by analogy but by isomorphism. From this correspondence, five missions build a complete atlas for encoding, storing, governing, and transmitting knowledge through voxel worlds.

**Mission 1 — Structural Isomorphism (v1):** 7 modules mapping the territory. Ceph/RADOS architecture, RAG pipeline stages with Minecraft analogues, integration architecture (token→block, document→chunk, corpus→world), Anvil format with all 12 NBT types, PoC implementation plan, spatial embedding mapping (UMAP, PCA, Morton/Hilbert curves), integration synthesis with 7-layer scale table. 12/12 success criteria PASS, 4/4 safety-critical PASS.

**Mission 2 — Sovereign World Architecture (v2):** 7 modules defining ownership. Block palette compression with wire-format examples, texture resource pack system, PCG seed manifold, multi-server Fabric (MultiPaper, Velocity, HuskSync), sovereign world provisioning on OpenStack, edge topology with torus via 4D simplex noise, backup/DR with RBD mirroring and CephX security. 12/12 success criteria PASS.

**Mission 3 — Signal Fidelity & Data Transmission (v3):** 8 modules defining how signals survive the journey. Nyquist-palette formalization (palette size ≥ 2K for alias-free encoding), color fidelity (ICC/DNG calibration), audio fidelity (JACK, spectral restoration, IRENE), serialization benchmarks (FlatBuffers 42x decode speedup), transport taxonomy (modems→fiber→IPoAC with Pareto front), backup federation (3-2-1-1-0, Arrow Flight), zero trust firewall (NIST 800-207, CISA 5-pillar), frequency-domain unification synthesis. 12/12 success criteria PASS, 8 cumulative safety tests PASS.

**Mission 4 — Iterative Refinement:** Cross-reference audit (99 section-precise references verified), PoC validation results, mapping assessment. One honest negative result: Wiener filter on quantized embeddings showed ~1% improvement — audio-to-chunk parallel downgraded from isomorphism to analogy.

**Mission 5 — Final Documentation:** Complete overview document, expanded glossary (80+ terms), consolidated bibliography (116 sources across 3 passes), cumulative verification matrix.

**Three PoC experiments** (`www/PNW/VAV/poc/`):
- `nyquist-palette.py` — Validates palette Nyquist threshold. 27.6% F1 drop below K=30. CONFIRMED.
- `flatbuffers-nbt.py` — FlatBuffers vs NBT decode. 42x full decode, 1,111x single-block random access. CONFIRMED.
- `wiener-embeddings.py` — Wiener filter on quantized embeddings. ~1% MSE improvement. WEAK (honest negative).

**The extended isomorphism** spans all three passes: 16 rows mapping Minecraft/Anvil ↔ Ceph/RADOS ↔ RAG Pipeline ↔ Signal Domain. From block state to frequency bin, from palette size to bandwidth, from world seed to calibration profile.

### 2. ECO Gap Closure — Grandmother Cedar's Complete Inventory (9 files, ~1,500 lines)

The ECO Living Systems Taxonomy started at 189 species with 29/32 verification tests passing. This mission closes every gap.

**38 new species profiles across three modules:**

- **Flora (+10):** Indian Paintbrush, Grand Fir, Western Larch, Pacific Dogwood, Pacific Rhododendron, Cascara, Red Elderberry, Kinnikinnick, Lady Fern, Maidenhair Fern
- **Fauna-Marine (+22):** Pacific Sand Lance, Surf Smelt, Northern Anchovy, Yelloweye Rockfish (ESA-T), Canary Rockfish (ESA-T), Pacific Cod, Cabezon, Wolf-eel, Spiny Dogfish, Threespine Stickleback, Mountain Whitefish, Acorn Barnacle, Giant Acorn Barnacle, Butter Clam, Manila Clam, Lewis's Moon Snail, Purple Sea Urchin, Eccentric Sand Dollar, Opalescent Nudibranch, Blood Star, Goose Barnacle, Pacific Oyster
- **Fungi (+6):** Cauliflower Mushroom, Chicken of the Woods, Lion's Mane, Artist's Conk, Map Lichen, Pixie Cup Lichen

**Cross-module updates:** Verification matrix flipped CF-3, CF-5, CF-6 from PARTIAL→PASS. Cross-module merge updated species indices, ESA listings (added Yelloweye and Canary Rockfish), and coverage targets. Engineering optimization register updated 189→227. Final assembly document (236 lines) provides executive summary, complete species index by module/elevation/conservation status, gap closure retrospective, and bibliography.

**Final counts:** 227 species profiled (+3 community profiles), 22 ESA-listed species, 32/32 verification tests PASS, all 6 safety-critical PASS.

### 3. PNW Shared Data Source Registry — From Shoreline to Satellite (`www/PNW/data-sources.md`, 851 lines)

The shared registry expanded from 13 datasets in 5 categories to 46 datasets across 14 categories. Every dataset is publicly funded, publicly accessible, and documented with agency, coverage, resolution, format, access URL, tier rating, and project use case.

**New categories (9):**

| Category | Datasets | Key Sources |
|----------|----------|-------------|
| Species & Biodiversity | 6 | GBIF, eBird, WDFW PHS, iNaturalist, NatureServe, USDA PLANTS |
| Forest & Vegetation | 4 | USFS FIA, LANDFIRE EVT, NLCD, GAP Land Cover |
| Climate & Weather | 4 | PRISM, USDA Hardiness Zones, NOAA Climate Normals, NOAA Tides & Currents |
| Geology & Soils | 3 | USGS Geologic Maps, WA DNR Geology, NRCS SSURGO |
| Hydrology & Watersheds | 3 | NHD, USGS NWIS, StreamStats |
| Fire History | 2 | MTBS Burn Severity, NIFC Perimeters |
| Aerial & Satellite Imagery | 4 | NAIP (60cm), Landsat (30m), Sentinel-2 (10m), 3DEP LiDAR |
| Protected Lands & Conservation | 3 | PAD-US, WA State Lands, WA Natural Heritage |
| Marine & Aquatic | 3 | NOAA Charts, WA DNR Aquatic Reserves, WDFW SalmonScape |

**Data pipeline expanded** from 8 to 20 layers mapping datasets to Minecraft world generation — terrain, canopy, bedrock, soil, vegetation type, tree species, bird spawns, salmon streams, climate zones, fire history, protected areas, and land cover.

**Existing categories (5, unchanged):** Puget Sound Coastal & Terrain (3), Shoreline Photography (3), Shoreline Habitat & Substrate (5), Reference Collections (3).

## Verification

### VAV — Voxel as Vessel

| Pass | Success Criteria | Safety Tests | Result |
|------|-----------------|--------------|--------|
| v1 (Structural) | 12/12 PASS | 4/4 PASS | Complete |
| v2 (Sovereignty) | 12/12 PASS | (cumulative) | Complete |
| v3 (Signal Fidelity) | 12/12 PASS | 8/8 PASS (cumulative) | Complete |
| **Total** | **36/36 PASS** | **8/8 PASS** | **Complete** |

### ECO — Gap Closure

| Category | Count | Pass |
|----------|-------|------|
| Safety-Critical | 6 | 6 |
| Core Functionality | 12 | 12 |
| Integration | 8 | 8 |
| Edge Cases | 6 | 6 |
| **Total** | **32** | **32** |

### Data Source Registry

| Metric | Before | After |
|--------|--------|-------|
| Datasets | 13 | 46 |
| Categories | 5 | 14 |
| Pipeline layers | 8 | 20 |
| File size | ~300 lines | 851 lines |

## File Inventory

### VAV (37 new files)

| File | Lines | Domain |
|------|-------|--------|
| 00-glossary.md | 156 | 80+ terms, 6 sections |
| 01-ceph-rados-architecture.md | 369 | RADOS, CRUSH, BlueStore |
| 02-rag-pipeline-architecture.md | 354 | 7 RAG stages |
| 03-integration-architecture.md | 519 | Token→block encoding |
| 04-minecraft-anvil-nbt-format.md | 384 | Anvil, 12 NBT types |
| 05-poc-implementation-plan.md | 492 | Library choices, pipeline |
| 06-spatial-embedding-mapping.md | 448 | UMAP, PCA, Hilbert |
| 07-integration-synthesis.md | 290 | 7-layer isomorphism |
| 08-bibliography.md | 592 | 116 sources |
| 09-verification-matrix.md | 127 | v1: 32 test points |
| 10-retrospective-m1.md | 272 | Mission 1 lessons |
| 11-block-chunk-data.md | 550 | Palette, BPE, wire format |
| 12-texture-resource-packs.md | 512 | Atlas, PBR, versioning |
| 13-pcg-seed-manifold.md | 559 | LCG, noise, seed-space |
| 14-multi-server-fabric.md | 574 | MultiPaper, Velocity |
| 15-sovereign-world-openstack.md | 556 | SCS, Domain Manager |
| 16-edge-topology-lod.md | 535 | Torus, LOD, CRUSH zones |
| 17-backup-security-hotswap.md | 612 | RBD, CephX, failover |
| 18-retrospective-m2.md | 296 | Mission 2 lessons |
| 19-temporal-imaging.md | 624 | Nyquist, TSR, CUP |
| 20-color-fidelity.md | 582 | ICC, DNG, calibration |
| 21-audio-fidelity.md | 621 | JACK, IRENE, spectral |
| 22-serialization-hpc.md | 573 | FlatBuffers, InfiniBand |
| 23-transport-taxonomy.md | 1,173 | Modems→fiber, Pareto |
| 24-backup-federation.md | 1,056 | 3-2-1-1-0, Arrow Flight |
| 25-zero-trust-firewall.md | 583 | NIST 800-207, CISA |
| 26-synthesis-v3.md | 588 | Frequency unification |
| 27-retrospective-m3.md | 276 | Mission 3 lessons |
| 28-iterative-refinement-report.md | 359 | Cross-ref audit, PoC |
| 29-final-overview.md | 253 | Complete atlas summary |
| poc/nyquist-palette.py | 271 | Palette threshold PoC |
| poc/flatbuffers-nbt.py | 472 | Decode benchmark PoC |
| poc/wiener-embeddings.py | 335 | Wiener filter PoC |
| index.html | 187 | Card grid browser |
| page.html | 64 | Markdown viewer |
| style.css | 225 | VAV theme |
| mission-pack/ | 169 | Handoff documents |

### ECO (8 modified + 1 new)

| File | Change | Lines |
|------|--------|-------|
| flora-survey.md | +10 species | +300 |
| fauna-marine-aquatic.md | +22 species | +635 |
| fungi-microbiome-survey.md | +6 species | +178 |
| cross-module-merge.md | Updated indices | +86/-30 |
| verification-matrix.md | 3 PARTIAL→PASS | +24/-13 |
| README.md | Updated counts | +21/-8 |
| engineering-optimization.md | Register 189→227 | +6/-3 |
| index.html | Stats updated | +28/-12 |
| final-assembly.md | **NEW** — publication doc | 236 |

### Data Source Registry (1 modified)

| File | Change | Lines |
|------|--------|-------|
| data-sources.md | 13→46 datasets | +552 |

### Series Integration (2 modified)

| File | Change |
|------|--------|
| www/PNW/index.html | VAV card added |
| www/PNW/series.js | VAV entry in series array |

## PNW Research Series — Complete Inventory

| # | Code | Subject | Files | Status |
|---|------|---------|-------|--------|
| 1 | COL | Columbia Valley Rainforest | www/PNW/COL/ | v1.49.22 |
| 2 | CAS | Cascade Range Biodiversity | www/PNW/CAS/ | v1.49.23 |
| 3 | ECO | Living Systems Taxonomy | www/PNW/ECO/ | **v1.49.35** |
| 4 | GDN | PNW Gardening | www/PNW/GDN/ | v1.49.24 |
| 5 | BCM | Building Construction Mastery | www/PNW/BCM/ | v1.49.24 |
| 6 | SHE | Smart Home & DIY Electronics | www/PNW/SHE/ | v1.49.24 |
| 7 | AVI | Wings of the Pacific Northwest | www/PNW/AVI/ | v1.49.25 |
| 8 | MAM | Fur, Fin & Fang | www/PNW/MAM/ | v1.49.25 |
| 9 | BPS | Bio-Physics Sensing Systems | www/PNW/BPS/ | v1.49.26 |
| 10 | FFA | Furry Fandom Arts | www/PNW/FFA/ | v1.49.29 |
| 11 | TIBS | Traditions & Indigenous Knowledge | www/PNW/TIBS/ | v1.49.31 |
| 12 | LED | LED Lighting & Controllers | www/PNW/LED/ | v1.49.33 |
| 13 | SYS | Systems Administration | www/PNW/SYS/ | v1.49.33 |
| 14 | VAV | Voxel Architecture & Visualization | www/PNW/VAV/ | **v1.49.35** |
| — | — | Shared Data Source Registry | www/PNW/data-sources.md | **v1.49.35** |

**Series totals:** 14 projects + shared registry, 360+ files, 16+ MB, 1,100+ sources.

## Retrospective

### What Worked

- **VAV five-mission arc.** The three-pass structure (structural→sovereignty→signal fidelity) was discovered organically but proved to be the natural decomposition. Each pass found what the previous pass could not see. The frequency-domain metaphor unifies all three.
- **Honest PoC results.** Two PoCs confirmed predictions, one returned a weak/negative result. Reporting all three honestly — and downgrading the audio-to-chunk parallel from isomorphism to analogy — strengthens the entire atlas. A research document that only reports confirmations is suspect.
- **ECO gap closure precision.** 38 species added across three modules with zero regressions. All 6 safety-critical tests maintained. Cross-module updates propagated cleanly. The verification matrix is now 32/32 PASS with no asterisks.
- **Data source registry as infrastructure.** Moving from 13 coastal datasets to 46 across 14 categories means any future PNW research module can reference authoritative data without duplicating source documentation. The stable ID system (DS-BIO-01, DS-VEG-02, etc.) makes cross-referencing reliable.
- **Pipeline table as design document.** The expanded 20-layer pipeline table is not just a reference — it is the engineering specification for how datasets combine to generate a Minecraft world. Each row is a future build task.

### What Could Be Better

- **VAV verification matrices split across missions.** v1 has a dedicated verification-matrix.md, but v2 and v3 results live only in the final overview. A single consolidated verification document would be easier to audit.
- **Release size.** 50 files and 18,600 lines in one release is substantial. The work was done across multiple sessions and multiple independent tracks (VAV, ECO, data sources), which is appropriate, but the merge is large.
- **Data source URLs.** The registry documents access URLs based on known endpoints. Some may drift over time. The stable ID system mitigates this — update the URL once, all references stay valid — but periodic verification would be good practice.

## Lessons Learned

1. **The isomorphism is real.** When two systems designed independently for different purposes converge on the same architecture, the architecture is dictated by the problem, not the implementer. This is what makes the Minecraft/Ceph correspondence a discovery, not a construction.
2. **Negative results are results.** The Wiener filter PoC returned ~1% improvement. Reporting this honestly and downgrading the claim from isomorphism to analogy is more valuable than omitting the experiment.
3. **Gap closure is its own mission.** ECO went from 29/32 to 32/32 with a focused single-session effort. Treating gap closure as a distinct mission with its own verification — rather than folding it into "maintenance" — produces cleaner results and a cleaner commit history.
4. **Data registries compound.** 46 datasets with stable IDs and tier ratings is infrastructure that pays forward. Every future research module can cite DS-BIO-02 instead of re-documenting eBird. The registry is the shared memory of the series.
5. **The pipeline table IS the build plan.** Twenty rows mapping datasets to Minecraft world generation layers is not documentation — it is the engineering specification for the next phase of work. When the time comes to generate actual Minecraft terrain, the table tells you exactly which dataset feeds which layer.
