# v1.49.35 — Voxel as Vessel, Grandmother Cedar's Complete Inventory, and the Data Source Registry

**Released:** 2026-03-10
**Scope:** VAV (Voxel as Vessel) 5-mission research atlas + ECO gap closure to 32/32 PASS + PNW shared data source registry expansion from 13 to 46 datasets
**Branch:** dev → main
**Tag:** v1.49.35 (2026-03-10T08:07:28-07:00)
**Predecessor:** v1.49.34 — Shapes, Colors, Coloring Outside the Lines
**Successor:** v1.49.36
**Classification:** feature — three parallel research tracks land together in one merge
**Commits:** 5 commits + 2 merges in range `v1.49.34..v1.49.35` (tip `a0291dcb8`)
**Files changed:** 51 | **Insertions:** 18,851 | **Deletions:** 79
**Dedication:** For Sam — who keeps the garden growing and the data flowing.
**Verification:** VAV 36/36 success criteria PASS · 8/8 cumulative safety-critical PASS · ECO 32/32 tests PASS · Data Registry expanded 13 → 46 datasets · 9 → 14 categories

## Summary

**Three independent research tracks landed as one merge.** v1.49.35 is the first release in the PNW Research Series to ship three structurally distinct bodies of work in a single tagged release — the Voxel as Vessel atlas (5 missions, 37 files, ~16,000 lines), the ECO gap-closure mission that flipped Grandmother Cedar's taxonomy from 29/32 to 32/32 PASS (8 modified files plus one new 236-line final-assembly document), and the PNW Shared Data Source Registry expansion from 13 datasets in 5 categories to 46 datasets in 14 categories. The release totals 51 files, 18,851 insertions, and 79 deletions across the five feature commits plus two merge commits. None of the three tracks shares source files with the others; each track was authored in its own session and merged sequentially through dev → main. The combined merge is large by design — the work was ready, the dependencies were resolved, and the retrospective value of landing the three tracks at one stamp is higher than splitting them across three sub-patches.

**The Minecraft / Ceph isomorphism is real, not analogical.** The headline structural finding of the VAV atlas is that Minecraft region files and Ceph RADOS objects converge independently on the same architecture: coordinate-keyed, chunked, zlib-compressed, hierarchically typed. Both systems partition a conceptual space into fixed-size addressable chunks, both pack those chunks into container files keyed by spatial coordinates, both deflate the payloads with zlib at the chunk boundary, and both define a hierarchical type system at the leaf level (NBT tags on the Minecraft side, RADOS object attributes plus BlueStore metadata on the Ceph side). When two systems designed for unrelated purposes by unrelated teams arrive at the same shape, the shape is dictated by the problem, not the implementer. VAV Mission 1 develops this correspondence across 7 modules spanning RADOS architecture, RAG pipeline mapping, Anvil format specification, and spatial embedding layouts via UMAP / PCA / Morton / Hilbert curves. The extended isomorphism spans 16 rows mapping Minecraft/Anvil ↔ Ceph/RADOS ↔ RAG Pipeline ↔ Signal Domain across all three VAV passes.

**VAV ships with an honest negative result.** Mission 4's iterative-refinement pass ran three proof-of-concept experiments and publishes all three outcomes with the same rigor. The `nyquist-palette.py` experiment confirmed the predicted Nyquist threshold on block-palette size: F1 drops 27.6% when palette size K falls below 30, which is the sampling-theorem prediction for alias-free encoding. The `flatbuffers-nbt.py` experiment confirmed a 42x full-decode speedup and a 1,111x single-block random-access speedup for FlatBuffers versus NBT. The `wiener-embeddings.py` experiment returned only ~1% MSE improvement when a Wiener filter was applied to quantized embeddings — well below the predicted gain. The honest response was to downgrade the audio-to-chunk parallel from isomorphism to analogy in Mission 4's cross-reference audit. Reporting negative results at the same level of detail as positive ones is what makes the rest of the atlas credible; a research document that reports only confirmations is a suspect document.

**ECO gap closure was treated as its own mission, not maintenance.** The ECO Living Systems Taxonomy had shipped at 189 species with 29/32 verification tests passing — three CF tests (CF-3, CF-5, CF-6) were PARTIAL. v1.49.35's ECO track added 38 species profiles across three taxonomic modules: 10 flora (Indian Paintbrush, Grand Fir, Western Larch, Pacific Dogwood, Pacific Rhododendron, Cascara, Red Elderberry, Kinnikinnick, Lady Fern, Maidenhair Fern), 22 fauna-marine (Pacific Sand Lance, Surf Smelt, Northern Anchovy, Yelloweye Rockfish ESA-T, Canary Rockfish ESA-T, Pacific Cod, Cabezon, Wolf-eel, Spiny Dogfish, Threespine Stickleback, Mountain Whitefish, Acorn Barnacle, Giant Acorn Barnacle, Butter Clam, Manila Clam, Lewis's Moon Snail, Purple Sea Urchin, Eccentric Sand Dollar, Opalescent Nudibranch, Blood Star, Goose Barnacle, Pacific Oyster), and 6 fungi (Cauliflower Mushroom, Chicken of the Woods, Lion's Mane, Artist's Conk, Map Lichen, Pixie Cup Lichen). Cross-module updates flipped CF-3, CF-5, and CF-6 from PARTIAL to PASS, added Yelloweye and Canary Rockfish to the ESA-listed count (20 → 22), and produced a new final-assembly document at `www/PNW/ECO/research/final-assembly.md` with executive summary, full species index by module and elevation and conservation status, gap-closure retrospective, and bibliography. Final counts: 227 species profiled, 22 ESA-listed, 32/32 tests PASS, 6/6 safety-critical PASS. Treating gap closure as a distinct mission with its own verification — rather than folding it silently into maintenance — produces cleaner results and a cleaner commit history than either alternative.

**Data Source Registry expansion turns publication into infrastructure.** The PNW Shared Data Source Registry at `www/PNW/data-sources.md` grew from ~300 lines with 13 datasets in 5 categories to 851 lines with 46 datasets in 14 categories. Nine new categories were added: Species & Biodiversity (6 datasets — GBIF, eBird, WDFW PHS, iNaturalist, NatureServe, USDA PLANTS), Forest & Vegetation (4 — USFS FIA, LANDFIRE EVT, NLCD, GAP Land Cover), Climate & Weather (4 — PRISM, USDA Hardiness Zones, NOAA Climate Normals, NOAA Tides & Currents), Geology & Soils (3 — USGS Geologic Maps, WA DNR Geology, NRCS SSURGO), Hydrology & Watersheds (3 — NHD, USGS NWIS, StreamStats), Fire History (2 — MTBS Burn Severity, NIFC Perimeters), Aerial & Satellite Imagery (4 — NAIP at 60cm, Landsat at 30m, Sentinel-2 at 10m, 3DEP LiDAR), Protected Lands & Conservation (3 — PAD-US, WA State Lands, WA Natural Heritage), and Marine & Aquatic (3 — NOAA Charts, WA DNR Aquatic Reserves, WDFW SalmonScape). Every dataset is publicly funded, publicly accessible, and catalogued with agency, coverage, resolution, format, access URL, tier rating, and project use case. The stable ID system (DS-BIO-01, DS-VEG-02, DS-CLI-03, etc.) means any future PNW research module can cite authoritative sources without duplicating source documentation. The registry is the shared memory of the series.

**The pipeline table is the build plan, not the documentation.** The data-source expansion also doubled the pipeline-mapping table from 8 layers to 20 layers. Each row maps a dataset (or dataset family) to a Minecraft world-generation concern: terrain, canopy, bedrock, soil, vegetation type, tree species, bird spawns, salmon streams, climate zones, fire history, protected areas, land cover, marine biomes, intertidal zones, LiDAR-derived elevation, NAIP-derived texture atlases, and so on. This is not a reference document. It is the engineering specification for the next phase of VAV work, where the block palette, texture pack, and PCG seed manifold meet actual ground-truth datasets. When terrain generation begins, the table tells the engineer exactly which dataset feeds which layer, at which resolution, under which licensing tier, with which format adapter. The pipeline table IS the build plan.

**Three-pass VAV structure was discovered, not planned.** Mission 1 (Structural Isomorphism) mapped the territory: Ceph/RADOS architecture, RAG pipeline stages, integration architecture with token→block and document→chunk and corpus→world encoding, Anvil format with all 12 NBT types, PoC implementation plan, spatial embedding mapping, 7-layer scale table — 12/12 success criteria PASS, 4/4 safety-critical PASS. Mission 2 (Sovereign World Architecture) defined ownership: block palette compression, texture resource pack system, PCG seed manifold, multi-server Fabric with MultiPaper / Velocity / HuskSync, sovereign world provisioning on OpenStack, edge topology with torus via 4D simplex noise, backup / DR with RBD mirroring and CephX security — 12/12 success criteria PASS. Mission 3 (Signal Fidelity & Data Transmission) defined how signals survive transit: Nyquist-palette formalization, color fidelity via ICC and DNG calibration, audio fidelity via JACK and IRENE and spectral restoration, serialization benchmarks, transport taxonomy from modems through fiber to IPoAC with a Pareto front, backup federation with 3-2-1-1-0 and Arrow Flight, zero trust firewall via NIST 800-207 and CISA 5-pillar, frequency-domain unification — 12/12 success criteria PASS, 8/8 cumulative safety tests PASS. The three passes were not designed in advance. Each pass found what the previous pass could not see, and the frequency-domain metaphor unifies all three at the synthesis layer. Mission 4's cross-reference audit confirmed 99 section-precise references verified and 116 deduplicated sources in the consolidated bibliography. Mission 5 produced the complete overview document, 80+ term expanded glossary, consolidated bibliography, and cumulative verification matrix.

**Scope discipline held across the large merge.** A 51-file, 18,851-line merge is the largest single release in the PNW Research Series to date. The temptation with a merge of this size is to bundle every adjacent loose end into the same stamp. v1.49.35 resists that temptation: every file in the merge belongs to one of the three named tracks (VAV, ECO, Data Registry) plus the two series-integration files (`www/PNW/index.html` card addition and `www/PNW/series.js` entry). Nothing else was smuggled in. The series itself grows from 14 projects to 15 projects in this release — counting the Data Source Registry as an independently addressable research asset rather than a bookkeeping file — and series totals update to 322+ files and 14+ MB across 1,100+ sources. The merge is large because three big pieces of work finished at the same time, not because the pieces grew to fill the merge.

## Key Features

| Area | What Shipped |
|------|--------------|
| VAV Mission 1 — Structural | 7 modules mapping Ceph/RADOS ↔ Minecraft/Anvil isomorphism; 12/12 SC PASS, 4/4 safety PASS |
| VAV Mission 2 — Sovereignty | 7 modules defining block palette, texture packs, PCG seed manifolds, multi-server Fabric, OpenStack provisioning; 12/12 SC PASS |
| VAV Mission 3 — Signal Fidelity | 8 modules: Nyquist palette, ICC/DNG color, IRENE audio, FlatBuffers (42x), transport taxonomy, zero trust; 12/12 SC PASS, 8 cumulative safety PASS |
| VAV Mission 4 — Iterative Refinement | Cross-reference audit (99 verified), 3 PoC experiments (2 confirmed, 1 honest negative), Wiener mapping downgraded isomorphism → analogy |
| VAV Mission 5 — Final Documentation | Complete overview, 80+ term glossary, 116-source consolidated bibliography, cumulative verification matrix |
| VAV PoC: nyquist-palette.py | Palette Nyquist threshold confirmed — 27.6% F1 drop below K=30 (271 lines) |
| VAV PoC: flatbuffers-nbt.py | FlatBuffers vs NBT — 42x full decode, 1,111x single-block random access confirmed (472 lines) |
| VAV PoC: wiener-embeddings.py | Wiener filter on quantized embeddings — ~1% MSE, weak/negative result reported honestly (335 lines) |
| ECO gap closure — Flora | 10 new species: Indian Paintbrush, Grand Fir, Western Larch, Pacific Dogwood, Pacific Rhododendron, Cascara, Red Elderberry, Kinnikinnick, Lady Fern, Maidenhair Fern (+300 lines) |
| ECO gap closure — Fauna Marine | 22 new species including Yelloweye Rockfish ESA-T and Canary Rockfish ESA-T (+635 lines) |
| ECO gap closure — Fungi | 6 new profiles: Cauliflower, Chicken of the Woods, Lion's Mane, Artist's Conk, Map Lichen, Pixie Cup Lichen (+178 lines) |
| ECO verification flip | CF-3, CF-5, CF-6 moved from PARTIAL to PASS; 29/32 → 32/32 PASS; 6/6 safety-critical PASS maintained |
| ECO final-assembly.md | New 236-line publication document: executive summary, species index by module/elevation/conservation status, gap closure retrospective, bibliography |
| Data Source Registry expansion | 13 → 46 datasets across 14 categories; 851-line registry; 20-layer pipeline table |
| PNW series integration | VAV card added to `www/PNW/index.html`; project #14 entry added to `www/PNW/series.js` |
| Series totals | 15 projects (14 + shared registry), 322+ files, 14+ MB, 1,100+ sources |

## Retrospective

### What Worked

- **Three-pass VAV structure found the right decomposition.** Structural → Sovereignty → Signal Fidelity was discovered organically but proved to be the natural cleavage plane. Each pass saw what the previous pass could not. The frequency-domain metaphor unifies all three at the synthesis layer.
- **Honest PoC reporting.** Two confirmations plus one weak/negative result, all published at the same level of detail. Downgrading the audio-to-chunk parallel from isomorphism to analogy strengthens the entire atlas more than omitting the experiment would have.
- **ECO gap closure as a distinct mission.** Treating CF-3 / CF-5 / CF-6 PARTIAL → PASS as its own mission with its own verification produced cleaner results and a cleaner commit history than folding the work into silent maintenance.
- **Data registry as compounding infrastructure.** 46 datasets with stable IDs (DS-BIO-01, DS-VEG-02, DS-CLI-03, etc.) means every future research module can cite authoritative sources without re-documenting them. The registry is shared memory.
- **Pipeline table is the build plan.** Doubling the pipeline from 8 to 20 layers turned documentation into engineering specification — each row is a future build task with dataset, resolution, format, and licensing tier already resolved.
- **Series-integration discipline.** Only `www/PNW/index.html` and `www/PNW/series.js` were touched at the series level. Nothing else was smuggled into the merge under the three named tracks.

### What Could Be Better

- **VAV verification matrices split across missions.** Mission 1 has a dedicated `09-verification-matrix.md`, but Missions 2 and 3 results live only in `29-final-overview.md`. A single consolidated verification document would be easier to audit.
- **Release size is substantial.** 51 files, 18,851 insertions in one release. The work was done across multiple sessions on multiple independent tracks so the coupling is low, but the merge is the largest in the PNW Research Series to date.
- **Data source URLs drift risk.** The registry documents access URLs for 46 datasets. Some endpoints will drift over time. The stable DS-* ID system mitigates the blast radius (update one URL, all references stay valid), but no periodic verification cadence is defined.
- **No consolidated VAV bibliography audit tool.** The 116-source dedup was confirmed manually in Mission 4. A scripted audit would make future bibliography growth safer.

## Lessons Learned

- **The isomorphism is real.** When two systems designed independently for different purposes converge on the same architecture, the architecture is dictated by the problem, not the implementer. This is what makes the Minecraft/Ceph correspondence a discovery, not a construction.
- **Negative results are results.** The Wiener filter PoC returned only ~1% MSE improvement. Reporting this honestly and downgrading the claim from isomorphism to analogy is more valuable than omitting the experiment. A research document that reports only confirmations is a suspect document.
- **Gap closure is its own mission.** ECO went from 29/32 to 32/32 with a focused single-session effort. Treating gap closure as a distinct mission with its own verification — rather than folding it into "maintenance" — produces cleaner results and a cleaner commit history than either alternative.
- **Data registries compound.** 46 datasets with stable IDs and tier ratings is infrastructure that pays forward. Every future research module can cite DS-BIO-02 instead of re-documenting eBird. The registry is the shared memory of the series.
- **The pipeline table IS the build plan.** Twenty rows mapping datasets to Minecraft world-generation layers is not documentation — it is the engineering specification for the next phase of work. When terrain generation begins, the table tells the engineer exactly which dataset feeds which layer.
- **Three passes beat one pass.** The VAV three-pass structure was not planned. It emerged because each pass found what the previous pass could not see. A single exhaustive pass would have missed the frequency-domain synthesis that only became visible at Mission 3.
- **Sixteen-row cross-domain tables are a research primitive.** The extended VAV isomorphism maps Minecraft/Anvil ↔ Ceph/RADOS ↔ RAG Pipeline ↔ Signal Domain across 16 rows. When a table this wide lines up cleanly, the rows are not coincidences; they are the shape of the underlying problem.
- **Series integration needs exactly two edits.** Adding VAV required one card in `www/PNW/index.html` and one entry in `www/PNW/series.js`. Any more than that is scope creep; any less than that is a ghost project.
- **Publication is different from authoring.** ECO's `final-assembly.md` did not add new species data; it re-presented the existing corpus as a publishable document with executive summary, full species index, gap-closure retrospective, and bibliography. Publication is its own 236-line deliverable.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.49.34](../v1.49.34/) | Predecessor — Shapes, Colors, Coloring Outside the Lines |
| [v1.49.36](../v1.49.36/) | Successor — subsequent work on the v1.49.x line |
| [v1.49.33](../v1.49.33/) | Prior PNW release — LED Lighting & Controllers and SYS Systems Administration |
| [v1.49.31](../v1.49.31/) | Prior PNW release — TIBS Traditions & Indigenous Knowledge |
| [v1.49.29](../v1.49.29/) | Prior PNW release — FFA Furry Fandom Arts |
| [v1.49.26](../v1.49.26/) | Prior PNW release — BPS Bio-Physics Sensing Systems |
| [v1.49.25](../v1.49.25/) | Prior PNW release — AVI Wings of the Pacific Northwest and MAM Fur, Fin & Fang |
| [v1.49.24](../v1.49.24/) | Prior PNW release — GDN, BCM, SHE |
| [v1.49.23](../v1.49.23/) | Prior PNW release — CAS Cascade Range Biodiversity |
| [v1.49.22](../v1.49.22/) | Prior PNW release — COL Columbia Valley Rainforest (series origin) |
| [v1.49.32](../v1.49.32/) | Release Integrity & Agent Heartbeat — `publish-release.sh` gate that validates this README |
| [v1.0](../v1.0/) | Foundational milestone — 6-step adaptive loop whose Observe step the VAV atlas extends |
| `www/PNW/VAV/` | New Voxel as Vessel research atlas — 37 files, ~16,000 lines |
| `www/PNW/ECO/` | ECO Living Systems Taxonomy — now 32/32 PASS at 227 species |
| `www/PNW/data-sources.md` | Shared Data Source Registry — 46 datasets across 14 categories |
| `www/PNW/index.html` | PNW Research Series hub — VAV card added |
| `www/PNW/series.js` | Series array — VAV entry at project #14 |
| `www/PNW/VAV/research/08-bibliography.md` | Consolidated VAV bibliography — 116 deduplicated sources |
| `www/PNW/VAV/research/29-final-overview.md` | VAV Mission 5 final overview with cumulative verification matrix |
| `www/PNW/ECO/research/final-assembly.md` | ECO publication document — 236 lines |
| `www/PNW/VAV/poc/nyquist-palette.py` | PoC 1 — palette Nyquist threshold confirmed |
| `www/PNW/VAV/poc/flatbuffers-nbt.py` | PoC 2 — FlatBuffers vs NBT decode benchmark |
| `www/PNW/VAV/poc/wiener-embeddings.py` | PoC 3 — honest negative result on Wiener embeddings |

## Engine Position

v1.49.35 sits between v1.49.34 (Shapes, Colors, Coloring Outside the Lines) and v1.49.36 on the v1.49.x line, and is the tenth PNW Research Series release after the series launched at v1.49.22 with COL Columbia Valley Rainforest. It is the first release in the series history to ship three independent research tracks in a single tagged merge — the VAV atlas, the ECO gap-closure mission, and the Data Source Registry expansion. The release grows the PNW Research Series from 14 projects to 15 projects (counting the shared Data Source Registry as an independently addressable research asset), and lifts series totals to 322+ files, 14+ MB of research content, and 1,100+ bibliography sources. The VAV three-pass structure (Structural → Sovereignty → Signal Fidelity) establishes a decomposition pattern for future multi-pass research atlases in the series. The Data Source Registry's stable DS-* ID system becomes load-bearing infrastructure for every future PNW research module — citing DS-BIO-02 instead of re-documenting eBird is the compounding benefit. The 20-layer pipeline table transitions from documentation into engineering specification for the next phase of work where voxel-world generation meets ground-truth datasets. Downstream, every subsequent PNW release inherits the registry, the pipeline table, and the three-pass precedent.

## Cumulative Statistics

| Metric | Before v1.49.35 | After v1.49.35 |
|--------|-----------------|----------------|
| PNW projects | 14 | 15 (incl. shared registry) |
| PNW files | ~285 | 322+ |
| PNW content size | ~11.5 MB | 14+ MB |
| PNW bibliography sources | ~984 | 1,100+ |
| ECO species profiled | 189 | 227 |
| ECO ESA-listed species | 20 | 22 |
| ECO verification tests | 29/32 PASS | 32/32 PASS |
| Data Registry datasets | 13 | 46 |
| Data Registry categories | 5 | 14 |
| Data Registry pipeline layers | 8 | 20 |
| VAV modules | 0 | 29 research modules + 3 PoCs |
| VAV bibliography | 0 | 116 deduplicated sources |
| VAV cumulative success criteria | 0/0 | 36/36 PASS |
| VAV cumulative safety-critical | 0/0 | 8/8 PASS |

## Files

- `www/PNW/VAV/research/01-ceph-rados-architecture.md` — new, 369 lines, RADOS / CRUSH / BlueStore architecture
- `www/PNW/VAV/research/02-rag-pipeline-architecture.md` — new, 354 lines, 7 RAG pipeline stages
- `www/PNW/VAV/research/03-integration-architecture.md` — new, 519 lines, token → block / document → chunk / corpus → world encoding
- `www/PNW/VAV/research/04-minecraft-anvil-nbt-format.md` — new, 384 lines, Anvil format with all 12 NBT types
- `www/PNW/VAV/research/05-poc-implementation-plan.md` — new, 492 lines, library choices and pipeline
- `www/PNW/VAV/research/06-spatial-embedding-mapping.md` — new, 448 lines, UMAP / PCA / Morton / Hilbert
- `www/PNW/VAV/research/07-integration-synthesis.md` — new, 290 lines, 7-layer scale table
- `www/PNW/VAV/research/08-bibliography.md` — new, 592 lines, 116 deduplicated sources
- `www/PNW/VAV/research/09-verification-matrix.md` — new, 127 lines, Mission 1 verification (12/12 SC + 4/4 safety)
- `www/PNW/VAV/research/11-block-chunk-data.md` — new, 550 lines, block palette and wire format
- `www/PNW/VAV/research/13-pcg-seed-manifold.md` — new, 559 lines, LCG and noise seed-space
- `www/PNW/VAV/research/15-sovereign-world-openstack.md` — new, 556 lines, OpenStack provisioning
- `www/PNW/VAV/research/17-backup-security-hotswap.md` — new, 612 lines, RBD / CephX / failover
- `www/PNW/VAV/research/19-temporal-imaging.md` — new, 624 lines, Nyquist / TSR / CUP / deinterlacing
- `www/PNW/VAV/research/21-audio-fidelity.md` — new, 621 lines, JACK / IRENE / spectral restoration
- `www/PNW/VAV/research/23-transport-taxonomy.md` — new, 1,173 lines, modems → fiber → IPoAC Pareto front
- `www/PNW/VAV/research/24-backup-federation.md` — new, 1,056 lines, 3-2-1-1-0 and Arrow Flight
- `www/PNW/VAV/research/25-zero-trust-firewall.md` — new, 583 lines, NIST 800-207 and CISA 5-pillar
- `www/PNW/VAV/research/26-synthesis-v3.md` — new, 588 lines, frequency-domain unification
- `www/PNW/VAV/research/28-iterative-refinement-report.md` — new, 359 lines, cross-reference audit + 3 PoC results
- `www/PNW/VAV/research/29-final-overview.md` — new, 253 lines, complete atlas summary with v2/v3 verification matrices
- `www/PNW/VAV/poc/nyquist-palette.py` — new, 271 lines, palette Nyquist threshold PoC
- `www/PNW/VAV/poc/flatbuffers-nbt.py` — new, 472 lines, FlatBuffers vs NBT decode benchmark
- `www/PNW/VAV/poc/wiener-embeddings.py` — new, 335 lines, Wiener filter honest-negative PoC
- `www/PNW/VAV/index.html` — new, 187 lines, VAV card grid browser
- `www/PNW/VAV/page.html` — new, 64 lines, Markdown viewer
- `www/PNW/VAV/style.css` — new, 225 lines, VAV theme
- `www/PNW/ECO/research/final-assembly.md` — new, 236 lines, ECO publication document
- `www/PNW/ECO/research/flora-survey.md` — +300 lines, 10 new species
- `www/PNW/ECO/research/fauna-marine-aquatic.md` — +635 lines, 22 new species
- `www/PNW/ECO/research/fungi-microbiome-survey.md` — +178 lines, 6 new species
- `www/PNW/ECO/research/verification-matrix.md` — +24/−13 lines, 3 PARTIAL → PASS
- `www/PNW/ECO/research/cross-module-merge.md` — +86/−30 lines, updated indices and ESA counts
- `www/PNW/ECO/research/engineering-optimization.md` — +6/−3 lines, register 189 → 227
- `www/PNW/ECO/research/README.md` — +21/−8 lines, updated counts
- `www/PNW/ECO/index.html` — +28/−12 lines, stats updated
- `www/PNW/data-sources.md` — +552 lines, 13 → 46 datasets across 14 categories
- `www/PNW/index.html` — +32/−0 lines net, VAV card added
- `www/PNW/series.js` — +3 lines, VAV entry at project #14
