# PNW Research Series — Shared Data Source Registry

A centralized catalog of external datasets used across the PNW research series.
All sources are publicly funded, publicly accessible government or academic data.
Any module in the series can reference this registry instead of duplicating source entries.

Last updated: 2026-03-09

---

## How to Use This Registry

Reference a dataset from any research module using its ID:

```markdown
Shoreline terrain derived from the USGS 1m topobathymetric DEM [DS-TOPO-01].
```

IDs are stable — if a URL changes, update it here once and every reference stays valid.

---

## Puget Sound Coastal & Terrain

### DS-TOPO-01 — USGS CoNED Topobathymetric DEM

| Field | Value |
|-------|-------|
| **Agency** | USGS Coastal National Elevation Database (CoNED) |
| **Coverage** | Deception Pass (north) to Olympia (south), to 327m depth |
| **Resolution** | 1 meter |
| **Coordinate System** | UTM Zone 10, NAD83 2011, Geoid12B orthometric heights |
| **Temporal Range** | Topography 2005–2017, bathymetry 1887–2015 |
| **Sources Integrated** | 186 (LiDAR, hydrographic surveys, single/multi-beam acoustic) |
| **Contributing Agencies** | USGS, NOAA, USACE, Puget Sound LiDAR Consortium, WA DNR |
| **Format** | GeoTIFF |
| **License** | CC0 1.0 Universal (public domain) |
| **DOI** | 10.5066/P95N6CIT |
| **Access** | [USGS Data Release](https://www.usgs.gov/data/topobathymetric-model-puget-sound-washington-1887-2017) |
| **Tier** | Gold — Federal agency, peer-reviewed methodology |

**Minecraft use:** Primary terrain source. Elevation values → Y coordinates at 40.05 ft/block scale.

---

### DS-TOPO-02 — NOAA Puget Sound Coastal DEM

| Field | Value |
|-------|-------|
| **Agency** | NOAA National Centers for Environmental Information (NCEI) |
| **Coverage** | Puget Sound and surrounding waters |
| **Resolution** | 1/3 arc-second (~10 meters) |
| **Vertical Datum** | NAVD 88 |
| **Format** | NetCDF, GeoTIFF |
| **Access** | [NOAA NCEI](https://www.ncei.noaa.gov/access/metadata/landing-page/bin/iso?id=gov.noaa.ngdc.mgg.dem:5165) |
| **Tier** | Gold — Federal agency |

**Minecraft use:** Broader coverage at lower resolution. Good for regional terrain shaping beyond Puget Sound proper.

---

### DS-COAST-01 — USGS PS-CoSMoS Storm Modeling

| Field | Value |
|-------|-------|
| **Agency** | USGS Pacific Coastal and Marine Science Center |
| **Coverage** | Puget Sound |
| **Purpose** | Coastal storm flood modeling, sea level rise projections |
| **Access** | [USGS PS-CoSMoS](https://www.usgs.gov/centers/pcmsc/science/ps-cosmos-puget-sound-coastal-storm-modeling-system) |
| **Tier** | Gold — Federal agency |

**Minecraft use:** Future dynamic water level modeling. Storm surge scenarios.

---

## Shoreline Photography

### DS-PHOTO-01 — WA Ecology Shoreline Photo Viewer

| Field | Value |
|-------|-------|
| **Agency** | Washington State Department of Ecology |
| **Coverage** | All Puget Sound, Hood Canal, Strait of Juan de Fuca, San Juan Islands, Pacific coast, lower Columbia River |
| **Photo Series** | 5 series: 1976–77, 1992–97, 2000–02, 2006–07, 2016–17 |
| **Photo Type** | Color oblique aerials from fixed-wing aircraft, large format camera |
| **Resolution** | Scanned at 300 dpi |
| **Coverage per Photo** | ~1.5 miles of shoreline |
| **Features** | Geotagged, compare years, sequential navigation, high-res viewing |
| **Map Platform** | Bing Maps base layer |
| **Access** | [Shoreline Photo Viewer](https://apps.ecology.wa.gov/shorephotoviewer/Map/ShorelinePhotoViewer) |
| **Download** | [Photo Data Download](https://fortress.wa.gov/ecy/gispublic/DataDownload/SEA_IBM_ShorelinePhotos.htm) |
| **Tier** | Gold — State agency, systematic survey |

**Minecraft use:** Visual texture reference. Match biome colors and block choices to real shoreline appearance. Bluff geology, vegetation lines, beach width, drift logs.

---

### DS-PHOTO-02 — WA Ecology Ongoing Shoreline Survey (2023+)

| Field | Value |
|-------|-------|
| **Agency** | Washington State Department of Ecology |
| **Authorization** | Washington Legislature, 2023 |
| **Cycle** | Every 2 years |
| **Budget** | $2.2 million per biennium |
| **Methods** | Aerial photography + on-the-water 360° photography + condition assessment |
| **Coverage** | Entire Puget Sound shoreline |
| **Access** | Web-based data viewers (updated each cycle) |
| **Tier** | Gold — State agency, legislatively mandated |

**Minecraft use:** Living reference that updates. Shoreline changes over time can be reflected in world updates.

---

### DS-PHOTO-03 — Historical Aerial Photography (1931–1940)

| Field | Value |
|-------|-------|
| **Agency** | Various (archived at UW Libraries, National Archives Seattle) |
| **Coverage** | Puget Sound lowland river valleys and estuaries |
| **Format** | 7" × 9" black-and-white prints |
| **Scale** | 1:12,000 or better |
| **Period** | 1931–1940 |
| **Access** | [UW Libraries Aerial Photography Guide](https://guides.lib.uw.edu/research/maps/aerial_photography) |
| **Access** | [National Archives Seattle](https://www.archives.gov/research/cartographic/aerial-photography/aerial-photography-nara-seattle) |
| **Tier** | Gold — Federal/academic archives |

**Minecraft use:** Historical baseline. What the shoreline looked like before modern development.

---

## Shoreline Habitat & Substrate

### DS-HABITAT-01 — WA DNR Intertidal Habitat Inventory

| Field | Value |
|-------|-------|
| **Agency** | Washington Department of Natural Resources |
| **Coverage** | Washington state marine shorelines |
| **Classification** | 60 shoreline habitat classes |
| **Data Layers** | Marine/estuarine category, major substrate material |
| **Format** | GIS shapefile |
| **Access** | [WA DNR Methods (PDF)](https://dnr.wa.gov/sites/default/files/2025-03/aqr_nrsh_methods.pdf) |
| **Tier** | Gold — State agency |

**Minecraft use:** Block type selection. Substrate class (sand, gravel, cobble, mud, rock) → Minecraft block ID.

---

### DS-HABITAT-02 — PSNERP Nearshore Maps

| Field | Value |
|-------|-------|
| **Agency** | Puget Sound Nearshore Ecosystem Restoration Project (USACE + WDFW) |
| **Coverage** | Puget Sound shoreline process units and drift cells |
| **Data** | Shoreline drift cells, upland watershed areas, sediment transport |
| **Access** | [WDFW PSNERP Maps](https://wdfw.wa.gov/species-habitats/habitat-recovery/puget-sound/project-maps) |
| **Tier** | Gold — Federal + state partnership |

**Minecraft use:** Sediment dynamics. Where beaches are building vs eroding. Drift cell boundaries define shoreline character zones.

---

### DS-HABITAT-03 — Beach Strategies Geodatabase

| Field | Value |
|-------|-------|
| **Agency** | Puget Sound restoration partnership |
| **Coverage** | Puget Sound beaches |
| **Phases** | Phase 1 (2017): data compilation + geodatabase. Phase 2 (2020): analysis tools |
| **Access** | Beach Strategies ArcGIS Hub Site |
| **Reference** | [Salish Sea Wiki](https://salishsearestoration.org/wiki/Beach_Strategies_for_Nearshore_Restoration_and_Protection_in_Puget_Sound) |
| **Tier** | Silver — Multi-agency collaboration |

**Minecraft use:** Integrated beach data for restoration sites. Decision-making tool data.

---

### DS-HABITAT-04 — Feeder Bluff Mapping

| Field | Value |
|-------|-------|
| **Agency** | Washington State Department of Ecology |
| **Coverage** | Puget Sound coastal bluffs |
| **Purpose** | Map bluffs that supply sediment to beaches |
| **Access** | [WA Ecology Publication (PDF)](https://apps.ecology.wa.gov/publications/parts/1406016part1.pdf) |
| **Tier** | Gold — State agency |

**Minecraft use:** Bluff placement and material. Where bluffs rise behind beaches and what they're made of.

---

### DS-HABITAT-05 — Nearshore Benthic Habitat (Side-Scan Sonar)

| Field | Value |
|-------|-------|
| **Agency** | Research survey |
| **Coverage** | Puget Sound nearshore |
| **Methods** | Side-scan sonar + underwater video |
| **Data** | Eelgrass bed boundaries, substrate type classification |
| **Reference** | [ReadKong](https://www.readkong.com/page/nearshore-habitat-mapping-in-puget-sound-using-side-scan-1989351) |
| **Tier** | Silver — Research publication |

**Minecraft use:** Underwater vegetation placement. Where eelgrass beds exist maps to kelp/seagrass blocks.

---

## Reference Collections

### DS-REF-01 — Encyclopedia of Puget Sound Map Gallery

| Field | Value |
|-------|-------|
| **Agency** | Puget Sound Institute (UW) |
| **Coverage** | Puget Sound region |
| **Content** | Curated collection of maps across topics |
| **Access** | [EoPS Map Gallery](https://www.eopugetsound.org/maps) |
| **Tier** | Silver — Academic institution |

**Use:** Navigation aid for finding additional datasets. Index of what's been mapped.

---

### DS-REF-02 — WA Ecology Coastal Atlas

| Field | Value |
|-------|-------|
| **Agency** | Washington State Department of Ecology |
| **Coverage** | Washington state coastlines |
| **Content** | Integrated viewer: shoreline photos, data layers, coastal conditions |
| **Access** | [WA Ecology Coastal Mapping](https://ecology.wa.gov/water-shorelines/shoreline-coastal-management/coastal-research-and-engineering/coastal-mapping) |
| **Tier** | Gold — State agency |

**Use:** Integrated portal for multiple coastal data layers.

---

### DS-REF-03 — Salish Sea Wiki

| Field | Value |
|-------|-------|
| **Agency** | Community (Salish Sea restoration network) |
| **Coverage** | Salish Sea / Puget Sound region |
| **Content** | Wiki of restoration projects, research, data sources, methods |
| **Access** | [Salish Sea Wiki](https://salishsearestoration.org/) |
| **Tier** | Bronze — Community knowledge base |

**Use:** Navigation aid. Community-curated links to data, methods, and restoration projects.

---

## Data Pipeline: Datasets → Minecraft World

How these datasets combine to build walkable Puget Sound beaches:

| Layer | Dataset | Output | Minecraft Mapping |
|-------|---------|--------|-------------------|
| **Terrain shape** | DS-TOPO-01 (1m DEM) | Elevation grid | Elevation ft ÷ 40.05 = block offset from sea level (y=-41) |
| **Water depth** | DS-TOPO-01 (bathymetry) | Depth grid | Negative elevation → water blocks below y=-41 |
| **Beach material** | DS-HABITAT-01 (substrate) | Material class | Sand→sand, gravel→gravel, cobble→cobblestone, mud→clay, rock→stone |
| **Vegetation line** | DS-PHOTO-01 (aerials) | Visual reference | Grass/tree placement above high tide line |
| **Bluff geology** | DS-HABITAT-04 (feeder bluffs) | Bluff material | Clay→terracotta, sandstone→sandstone, glacial till→gravel+stone |
| **Underwater habitat** | DS-HABITAT-05 (sonar) | Benthic map | Eelgrass→kelp blocks, bare substrate→sand/gravel |
| **Sediment dynamics** | DS-HABITAT-02 (drift cells) | Transport zones | Beach width and character by zone |
| **Water level** | Tidal datums (MHW) | Tide line | MHW → y=-41 (sea level), MLLW → y=-43 (low tide) |

### Scale Reference

At 40.05 ft/block:
- A 100-foot wide beach = ~2.5 blocks wide
- A 200-foot bluff = ~5 blocks tall
- 1m DEM = ~12 data points per Minecraft block (more than enough)

### Efficient Data Pipeline (Future)

The raw datasets are large (GeoTIFF DEMs can be multiple GB). Efficient approaches:
- **Tile on demand:** Only process the area being built, not the entire Sound at once
- **Resolution matching:** Downsample 1m DEM to match 40.05 ft/block — no need for sub-block resolution
- **Cache locally:** Download once, process locally, store derived Minecraft-ready data
- **Incremental updates:** When WA Ecology releases new biennial photos, update only changed areas

We do not bulk-download for exploration. We sample to understand structure, design the pipeline, then pull only what we need when we need it. Respectful use of public infrastructure.

---

## Contributing

To add a dataset to this registry:
1. Verify it's publicly accessible (no authentication required)
2. Identify the source agency and data tier (Gold/Silver/Bronze)
3. Document format, resolution, coverage, and access URL
4. Describe the Minecraft use case if applicable
5. Assign the next available DS-ID in the appropriate category

## Tier Definitions

| Tier | Criteria | Examples |
|------|----------|---------|
| **Gold** | Federal/state agencies, peer-reviewed methodology, systematic coverage | USGS, NOAA, WA Ecology, WA DNR, WDFW |
| **Silver** | Academic institutions, multi-agency collaborations, established publishers | UW, Puget Sound Institute, research partnerships |
| **Bronze** | Community resources, wikis, educational sites | Salish Sea Wiki, Encyclopedia of Puget Sound |
