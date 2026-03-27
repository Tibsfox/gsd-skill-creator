# PNW Research Series — Shared Data Source Registry

A centralized catalog of external datasets used across the PNW research series.
All sources are publicly funded, publicly accessible government or academic data.
Any module in the series can reference this registry instead of duplicating source entries.

Last updated: 2026-03-10

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

## Species & Biodiversity

### DS-BIO-01 — GBIF Species Occurrences

| Field | Value |
|-------|-------|
| **Agency** | Global Biodiversity Information Facility |
| **Coverage** | Global; filterable to Pacific Northwest |
| **Content** | Species occurrence records aggregated from museums, herbaria, citizen science, government surveys |
| **Records (PNW)** | Millions — filters by bounding box, taxonomy, date, institution |
| **Format** | Darwin Core Archive (CSV + metadata), API |
| **License** | CC0, CC-BY, or CC-BY-NC per record (publisher-specified) |
| **Access** | [GBIF.org](https://www.gbif.org/) |
| **Tier** | Gold — International consortium, peer-reviewed data pipeline |

**Use:** Master occurrence index. Cross-reference species in ECO, AVI, MAM, COL modules against verified sighting locations by elevation band and ecoregion.

---

### DS-BIO-02 — eBird Observation Database

| Field | Value |
|-------|-------|
| **Agency** | Cornell Lab of Ornithology |
| **Coverage** | Global; PNW hotspots densely sampled |
| **Content** | Bird observations with species, count, location, date, observer effort |
| **Temporal** | 2002–present (growing daily) |
| **Format** | CSV download, API (eBird API 2.0) |
| **License** | CC-BY-NC for personal/research use |
| **Access** | [eBird.org](https://ebird.org/home) |
| **Status Products** | [eBird Status & Trends](https://science.ebird.org/en/status-and-trends) — modeled abundance maps |
| **Tier** | Gold — Cornell Lab, largest biodiversity citizen science project |

**Minecraft use:** Bird spawn tables by habitat and season. Abundance data maps to spawn frequency per biome zone. Directly supports AVI module species placement.

---

### DS-BIO-03 — WDFW Priority Habitats and Species (PHS)

| Field | Value |
|-------|-------|
| **Agency** | Washington Department of Fish and Wildlife |
| **Coverage** | Washington state |
| **Content** | Mapped locations of priority species and habitats (breeding sites, migration corridors, critical habitat) |
| **Species Groups** | Fish, wildlife, invertebrates — state-listed threatened/endangered/sensitive |
| **Format** | GIS shapefiles, interactive map (PHS on the Web) |
| **Access** | [WDFW PHS](https://wdfw.wa.gov/species-habitats/at-risk/phs) |
| **Sensitivity** | Some layers restricted to protect nesting sites — public layers available |
| **Tier** | Gold — State wildlife agency |

**Minecraft use:** Critical habitat zones mapped to protected biome areas. Spawn exclusion zones for sensitive species. ESA overlay for ECO module safety-critical boundaries.

---

### DS-BIO-04 — iNaturalist Observations

| Field | Value |
|-------|-------|
| **Agency** | California Academy of Sciences + National Geographic |
| **Coverage** | Global; strong PNW community |
| **Content** | Photo-verified species observations with GPS, taxonomy, community ID |
| **Quality** | Research-grade observations (2+ agreeing IDs) feed GBIF |
| **Format** | CSV export, API |
| **License** | CC0 or CC-BY per observer choice |
| **Access** | [iNaturalist.org](https://www.inaturalist.org/) |
| **Tier** | Silver — Community science, quality-controlled subset feeds Gold sources |

**Use:** Gap-filling for under-surveyed taxa (fungi, invertebrates, lichens). Photo reference for species visualization. Supports ECO fungi and COL understory modules.

---

### DS-BIO-05 — NatureServe Explorer

| Field | Value |
|-------|-------|
| **Agency** | NatureServe (network of natural heritage programs) |
| **Coverage** | North America |
| **Content** | Conservation status rankings (G-ranks, S-ranks), range maps, habitat descriptions |
| **Species** | 100,000+ species and ecosystems assessed |
| **Format** | Web interface, API |
| **Access** | [NatureServe Explorer](https://explorer.natureserve.org/) |
| **Tier** | Gold — Heritage network, standardized methodology |

**Use:** Authoritative conservation status for every profiled species. G-rank and S-rank data cross-reference ECO module ESA listings.

---

### DS-BIO-06 — USDA PLANTS Database

| Field | Value |
|-------|-------|
| **Agency** | USDA Natural Resources Conservation Service |
| **Coverage** | United States and territories |
| **Content** | Plant species profiles, distribution maps, characteristics, wetland indicator status, native/introduced status |
| **Format** | Web interface, downloadable datasets |
| **Access** | [USDA PLANTS](https://plants.usda.gov/) |
| **Tier** | Gold — Federal agency |

**Minecraft use:** Native vs introduced classification for flora placement. Wetland indicator status maps to riparian/estuary biome boundaries. Supports ECO flora and GDN gardening modules.

---

## Forest & Vegetation

### DS-VEG-01 — USFS Forest Inventory and Analysis (FIA)

| Field | Value |
|-------|-------|
| **Agency** | USDA Forest Service |
| **Coverage** | All US forestland; WA + OR plots densely sampled |
| **Content** | Tree species, diameter, height, crown, stand age, mortality, growth rates |
| **Plot Cycle** | 10-year remeasurement cycle, annual panel |
| **Format** | Downloadable database (SQLite, CSV), API (FIA DataMart) |
| **Access** | [FIA DataMart](https://apps.fs.usda.gov/fia/datamart/) |
| **Visualization** | [FIA EVALIDator](https://apps.fs.usda.gov/fiadb-api/evalidator) |
| **Tier** | Gold — Federal agency, systematic national inventory |

**Minecraft use:** Tree species composition and density by elevation band. Stand age → tree height → canopy block placement. Douglas-fir vs western red cedar vs Sitka spruce distribution drives biome-specific tree generation.

---

### DS-VEG-02 — LANDFIRE Existing Vegetation

| Field | Value |
|-------|-------|
| **Agency** | USGS + USFS (interagency) |
| **Coverage** | Contiguous US, Alaska, Hawaii |
| **Content** | Existing Vegetation Type (EVT), Cover (EVC), Height (EVH), fuel models |
| **Resolution** | 30 meters |
| **Temporal** | Updated ~every 2 years (LF 2023 latest) |
| **Format** | GeoTIFF rasters |
| **Access** | [LANDFIRE.gov](https://landfire.gov/) |
| **Tier** | Gold — Federal interagency partnership |

**Minecraft use:** Vegetation type and height rasters directly map to biome block palettes. 30m resolution = ~1 data point per Minecraft block at our scale. Primary source for automated tree and vegetation placement.

---

### DS-VEG-03 — NLCD National Land Cover Database

| Field | Value |
|-------|-------|
| **Agency** | USGS Multi-Resolution Land Characteristics Consortium |
| **Coverage** | Contiguous US |
| **Content** | Land cover classification (20 classes), impervious surface, tree canopy cover |
| **Resolution** | 30 meters |
| **Temporal** | 2001, 2004, 2006, 2008, 2011, 2013, 2016, 2019, 2021 |
| **Format** | GeoTIFF |
| **Access** | [MRLC NLCD](https://www.mrlc.gov/) |
| **Tier** | Gold — Federal consortium |

**Minecraft use:** Land cover change over 20 years. Urban/forest/water/wetland classification drives broad biome assignment before fine-grained species placement.

---

### DS-VEG-04 — GAP/PADUS Land Cover

| Field | Value |
|-------|-------|
| **Agency** | USGS Gap Analysis Project |
| **Coverage** | Contiguous US |
| **Content** | Ecological systems classification (~600 types nationally), species range models |
| **Resolution** | 30 meters |
| **Format** | GeoTIFF, GIS |
| **Access** | [USGS GAP](https://www.usgs.gov/programs/gap-analysis-project) |
| **Tier** | Gold — Federal agency |

**Minecraft use:** Fine-grained ecological system types (e.g., "North Pacific Maritime Dry-Mesic Douglas-fir–Western Hemlock Forest") map directly to ECO module elevation band communities.

---

## Climate & Weather

### DS-CLIM-01 — PRISM Climate Data

| Field | Value |
|-------|-------|
| **Agency** | PRISM Climate Group, Oregon State University |
| **Coverage** | Contiguous US |
| **Content** | Gridded temperature (min/max/mean), precipitation, dewpoint, vapor pressure deficit |
| **Resolution** | 4 km (monthly/annual), 800 m (normals) |
| **Temporal** | 1895–present (monthly); 30-year normals (1991–2020) |
| **Format** | BIL rasters, ASCII grids |
| **Access** | [PRISM Climate Group](https://prism.oregonstate.edu/) |
| **Tier** | Gold — Academic, industry-standard climate dataset |

**Minecraft use:** Temperature and precipitation by elevation drive biome assignment. Rain shadow effects (wet west slopes vs dry east slopes of Cascades) create distinct biome transitions.

---

### DS-CLIM-02 — USDA Plant Hardiness Zone Map

| Field | Value |
|-------|-------|
| **Agency** | USDA Agricultural Research Service |
| **Coverage** | United States |
| **Content** | Plant hardiness zones based on average annual minimum winter temperature |
| **Resolution** | 1/2-mile grid |
| **Zones (PNW)** | 4a (alpine) through 9b (coastal lowland) |
| **Access** | [USDA Plant Hardiness Map](https://planthardiness.ars.usda.gov/) |
| **Tier** | Gold — Federal agency |

**Minecraft use:** Gardening module (GDN) plant selection by zone. Maps growing conditions to elevation bands for realistic crop and ornamental placement.

---

### DS-CLIM-03 — NOAA Climate Normals

| Field | Value |
|-------|-------|
| **Agency** | NOAA National Centers for Environmental Information |
| **Coverage** | US weather stations (dense in western WA) |
| **Content** | 30-year averages (1991–2020): temperature, precipitation, snowfall, degree days, wind |
| **Format** | CSV, API |
| **Access** | [NOAA Climate Normals](https://www.ncei.noaa.gov/products/land-based-station/us-climate-normals) |
| **Tier** | Gold — Federal agency |

**Use:** Station-level climate data for specific locations. SeaTac, Olympia, Bellingham, Paradise (Mt. Rainier) stations define climate gradient from sea level to alpine.

---

### DS-CLIM-04 — NOAA Tides & Currents

| Field | Value |
|-------|-------|
| **Agency** | NOAA Center for Operational Oceanographic Products and Services |
| **Coverage** | US coastal waters; 15+ stations in Puget Sound |
| **Content** | Water levels, tidal predictions, currents, meteorological observations |
| **Stations (Puget Sound)** | Seattle (9447130), Tacoma (9446484), Port Townsend (9444900), Olympia (9446969), others |
| **Format** | API, CSV, web interface |
| **Access** | [NOAA Tides & Currents](https://tidesandcurrents.noaa.gov/) |
| **Tier** | Gold — Federal agency, real-time + historical |

**Minecraft use:** Tidal datum defines water surface. MHW → sea level block (y=-41). Tidal range varies across the Sound (7ft Seattle, 14ft+ Olympia) — drives dynamic water level modeling.

---

## Geology & Soils

### DS-GEO-01 — USGS National Geologic Map Database

| Field | Value |
|-------|-------|
| **Agency** | USGS |
| **Coverage** | United States |
| **Content** | Geologic maps showing rock type, age, structure, faults |
| **Access** | [USGS NGMDB](https://ngmdb.usgs.gov/mapview/) |
| **Format** | GIS, PDF maps |
| **Tier** | Gold — Federal agency |

**Minecraft use:** Bedrock and subsurface block selection. Basalt → deepslate, sandstone → sandstone, granite → granite. Fault lines map to terrain features.

---

### DS-GEO-02 — WA DNR Geologic Maps and Data

| Field | Value |
|-------|-------|
| **Agency** | Washington Department of Natural Resources, Division of Geology and Earth Resources |
| **Coverage** | Washington state |
| **Content** | State geologic maps, hazard maps (landslide, liquefaction, lahar), mineral resources |
| **Volcanic Hazards** | Lahar inundation zones for Mt. Rainier, Mt. Baker, Glacier Peak |
| **Format** | GIS shapefiles, PDF maps |
| **Access** | [WA DNR Geology](https://www.dnr.wa.gov/geology) |
| **Tier** | Gold — State agency |

**Minecraft use:** Volcanic hazard zones around Tahoma (Rainier). Lahar paths map to terrain channels. Glacial deposits (till, outwash) define lowland substrate. BCM module foundation geology.

---

### DS-GEO-03 — NRCS Web Soil Survey (SSURGO)

| Field | Value |
|-------|-------|
| **Agency** | USDA Natural Resources Conservation Service |
| **Coverage** | United States (county-level detail) |
| **Content** | Soil types, drainage class, depth to water table, parent material, land capability class |
| **Resolution** | 1:12,000 to 1:63,360 mapping scale |
| **Format** | GIS, tabular data, web interface |
| **Access** | [Web Soil Survey](https://websoilsurvey.nrcs.usda.gov/) |
| **Tier** | Gold — Federal agency, systematic national survey |

**Minecraft use:** Soil type → surface block selection. Sandy loam → sand/dirt mix, clay → clay blocks, peat → soul soil. Drainage class affects wetland placement. GDN gardening module uses soil capability for garden planning.

---

## Hydrology & Watersheds

### DS-HYDRO-01 — NHD National Hydrography Dataset

| Field | Value |
|-------|-------|
| **Agency** | USGS |
| **Coverage** | United States |
| **Content** | Surface water features: streams, rivers, lakes, ponds, canals, coastline, watershed boundaries (WBD) |
| **Resolution** | NHD High-Resolution (1:24,000), NHDPlus HR (with value-added attributes) |
| **Format** | GIS shapefiles, geodatabase |
| **Access** | [USGS NHD](https://www.usgs.gov/national-hydrography/national-hydrography-dataset) |
| **Tier** | Gold — Federal agency |

**Minecraft use:** Stream and river placement. Watershed boundaries define drainage basins. Stream order maps to river width in blocks. Every salmon-bearing stream in the ECO module traces back to NHD geometry.

---

### DS-HYDRO-02 — USGS National Water Information System (NWIS)

| Field | Value |
|-------|-------|
| **Agency** | USGS Water Resources |
| **Coverage** | United States; 200+ active gauges in WA |
| **Content** | Real-time and historical streamflow (discharge), water level, water quality, groundwater levels |
| **Temporal** | Some stations: 100+ years of daily records |
| **Format** | API, CSV, web interface |
| **Access** | [USGS NWIS](https://waterdata.usgs.gov/nwis) |
| **Tier** | Gold — Federal agency, real-time network |

**Minecraft use:** Stream discharge → water block volume and flow speed. Seasonal variation (spring snowmelt peaks) could drive dynamic water levels. Historical flood data for floodplain mapping.

---

### DS-HYDRO-03 — StreamStats

| Field | Value |
|-------|-------|
| **Agency** | USGS |
| **Coverage** | Most US states including Washington |
| **Content** | Basin characteristics, streamflow statistics, drainage area delineation for any point on a stream |
| **Format** | Web application, API |
| **Access** | [USGS StreamStats](https://streamstats.usgs.gov/) |
| **Tier** | Gold — Federal agency |

**Use:** Point-and-click watershed delineation. Get drainage area and flow statistics for any stream location without GIS expertise.

---

## Fire History

### DS-FIRE-01 — MTBS Monitoring Trends in Burn Severity

| Field | Value |
|-------|-------|
| **Agency** | USGS + USFS |
| **Coverage** | United States; all fires >1,000 acres (western) or >500 acres (eastern) |
| **Content** | Fire perimeters, burn severity maps (dNBR), pre/post-fire imagery |
| **Temporal** | 1984–present |
| **Resolution** | 30 meters (Landsat-derived) |
| **Format** | GeoTIFF, GIS shapefiles |
| **Access** | [MTBS.gov](https://www.mtbs.gov/) |
| **Tier** | Gold — Federal interagency |

**Minecraft use:** Historic fire footprints define forest age mosaic. Recent burn scars → early successional vegetation. Old burns → mature second growth. Fire severity maps to forest structure variation.

---

### DS-FIRE-02 — NIFC Wildfire Perimeters (GeoMAC Legacy)

| Field | Value |
|-------|-------|
| **Agency** | National Interagency Fire Center |
| **Coverage** | United States |
| **Content** | Wildfire perimeters, fire history, prescribed fire boundaries |
| **Temporal** | Historical through current season |
| **Format** | GIS shapefiles, web services |
| **Access** | [NIFC Open Data](https://data-nifc.opendata.arcgis.com/) |
| **Tier** | Gold — Federal interagency |

**Minecraft use:** Fire perimeter history creates the mosaic of forest ages that defines PNW landscapes. Combined with MTBS severity for block-level vegetation age assignment.

---

## Aerial & Satellite Imagery

### DS-IMG-01 — NAIP National Agriculture Imagery Program

| Field | Value |
|-------|-------|
| **Agency** | USDA Farm Service Agency |
| **Coverage** | Contiguous US, flown state-by-state |
| **Content** | Leaf-on aerial photography (4-band: RGB + NIR) |
| **Resolution** | 60 cm (0.6 meter) |
| **Cycle** | Every 2–3 years per state |
| **Format** | GeoTIFF, Cloud-Optimized GeoTIFF (COG) |
| **Access** | [NAIP on AWS](https://registry.opendata.aws/naip/) or [USGS EarthExplorer](https://earthexplorer.usgs.gov/) |
| **Tier** | Gold — Federal agency |

**Minecraft use:** Highest-resolution free aerial imagery. Individual trees visible. Color and texture reference for biome palette design. NIR band detects vegetation health.

---

### DS-IMG-02 — Landsat Collection 2

| Field | Value |
|-------|-------|
| **Agency** | USGS + NASA |
| **Coverage** | Global |
| **Content** | Multispectral imagery (visible, NIR, SWIR, thermal) |
| **Resolution** | 30 meters (multispectral), 15 m (panchromatic), 100 m (thermal) |
| **Temporal** | 1972–present (50+ year archive) |
| **Revisit** | 16 days per satellite, 8 days combined (Landsat 8+9) |
| **Format** | GeoTIFF (Collection 2, Level-2 surface reflectance) |
| **Access** | [USGS EarthExplorer](https://earthexplorer.usgs.gov/) |
| **Tier** | Gold — Federal agencies, longest continuous satellite record |

**Minecraft use:** 50-year change detection. Forest harvest and regrowth visible across decades. Seasonal vegetation indices (NDVI) drive biome color palettes by month.

---

### DS-IMG-03 — Sentinel-2 Multispectral Imagery

| Field | Value |
|-------|-------|
| **Agency** | European Space Agency (Copernicus Programme) |
| **Coverage** | Global |
| **Content** | 13-band multispectral imagery (visible, NIR, SWIR, red-edge) |
| **Resolution** | 10 meters (visible + NIR), 20 m (red-edge + SWIR), 60 m (atmospheric) |
| **Revisit** | 5 days (twin satellites) |
| **Temporal** | 2015–present |
| **Format** | JPEG2000, Cloud-Optimized GeoTIFF |
| **Access** | [Copernicus Data Space](https://dataspace.copernicus.eu/) |
| **Tier** | Gold — ESA, free and open |

**Minecraft use:** Highest-resolution free satellite imagery. Red-edge bands detect vegetation stress and species composition. 5-day revisit captures seasonal phenology for dynamic biome coloring.

---

### DS-IMG-04 — 3DEP LiDAR Point Clouds

| Field | Value |
|-------|-------|
| **Agency** | USGS 3D Elevation Program |
| **Coverage** | Expanding US coverage; western WA well-covered |
| **Content** | Classified LiDAR point clouds (ground, vegetation, buildings, water) |
| **Density** | 2–8+ points/m² (varies by collection) |
| **Format** | LAZ (compressed LAS), EPT (Entwine Point Tiles) |
| **Access** | [USGS 3DEP](https://www.usgs.gov/3d-elevation-program), [OpenTopography](https://opentopography.org/) |
| **Tier** | Gold — Federal program |

**Minecraft use:** LiDAR separates ground surface from canopy. Ground points → terrain elevation, canopy points → tree height. Sub-meter accuracy for forest structure. Supersedes DEM for areas with coverage.

---

## Protected Lands & Conservation

### DS-LAND-01 — PAD-US Protected Areas Database

| Field | Value |
|-------|-------|
| **Agency** | USGS Gap Analysis Project |
| **Coverage** | United States |
| **Content** | Boundaries and attributes for all protected lands (federal, state, local, private conservation) |
| **Categories** | National parks, forests, wilderness areas, wildlife refuges, state parks, county parks, conservation easements |
| **GAP Status** | 1 (managed for biodiversity), 2 (managed for biodiversity with some use), 3 (multiple use), 4 (no mandate) |
| **Format** | GIS geodatabase, shapefiles |
| **Access** | [USGS PAD-US](https://www.usgs.gov/programs/gap-analysis-project/science/pad-us-data-overview) |
| **Tier** | Gold — Federal agency |

**Minecraft use:** Protected area boundaries define management zones in the world. Wilderness areas → pristine biomes, managed forests → working landscape blocks. National park boundaries (Rainier, Olympic, North Cascades) are fundamental world boundaries.

---

### DS-LAND-02 — Washington State Lands and Wildlife Areas

| Field | Value |
|-------|-------|
| **Agency** | WA State Parks, WDFW, WA DNR |
| **Coverage** | Washington state |
| **Content** | State parks, wildlife areas, natural area preserves, DNR-managed forest lands |
| **Format** | GIS layers, web maps |
| **Access** | [WA State Parks](https://parks.wa.gov/), [WDFW Lands](https://wdfw.wa.gov/places-to-go/wildlife-areas) |
| **Tier** | Gold — State agencies |

**Minecraft use:** Trail systems, campground locations, wildlife viewing areas. State lands fill gaps between federal protected areas for continuous landscape coverage.

---

### DS-LAND-03 — WA DNR Natural Heritage Program

| Field | Value |
|-------|-------|
| **Agency** | Washington Department of Natural Resources |
| **Coverage** | Washington state |
| **Content** | Rare plant and ecological community locations, natural area preserves, element occurrences |
| **Sensitivity** | Location data restricted for sensitive species — summary data public |
| **Access** | [WA DNR Natural Heritage](https://www.dnr.wa.gov/natural-heritage-program) |
| **Tier** | Gold — State agency, NatureServe network member |

**Use:** Rare plant and community locations for ECO module endangered species mapping. Respects data sensitivity protocols — no GPS coordinates published for sensitive occurrences.

---

## Marine & Aquatic

### DS-MARINE-01 — NOAA Nautical Charts

| Field | Value |
|-------|-------|
| **Agency** | NOAA Office of Coast Survey |
| **Coverage** | US navigable waters; detailed Puget Sound coverage |
| **Content** | Depth soundings, navigation aids, shoreline, bottom characteristics, anchorages |
| **Format** | ENC (electronic navigational charts), RNC (raster), PDF |
| **Access** | [NOAA Chart Viewer](https://www.charts.noaa.gov/) |
| **Tier** | Gold — Federal agency |

**Minecraft use:** Depth contours for underwater terrain beyond DEM coverage. Bottom type annotations (mud, sand, gravel, rock) for seafloor block selection in deep marine zones.

---

### DS-MARINE-02 — WA DNR Aquatic Reserves

| Field | Value |
|-------|-------|
| **Agency** | Washington Department of Natural Resources |
| **Coverage** | Washington state-owned aquatic lands |
| **Content** | Aquatic reserve boundaries, management plans, habitat assessments |
| **Reserves** | Cherry Point, Cypress Island, Fidalgo Bay, Maury Island, Protection Island, Smith & Minor Islands |
| **Format** | GIS, management plan PDFs |
| **Access** | [WA DNR Aquatic Reserves](https://www.dnr.wa.gov/managed-lands/aquatic-reserves) |
| **Tier** | Gold — State agency |

**Minecraft use:** Marine protected zones with high biodiversity. Priority areas for detailed underwater biome modeling with kelp forests, eelgrass beds, and marine invertebrate placement.

---

### DS-MARINE-03 — WDFW SalmonScape

| Field | Value |
|-------|-------|
| **Agency** | Washington Department of Fish and Wildlife |
| **Coverage** | Washington state streams and rivers |
| **Content** | Salmon and steelhead distribution by species and life stage (spawning, rearing, migration) |
| **Species** | Chinook, coho, chum, pink, sockeye, steelhead, bull trout |
| **Format** | Interactive web map, GIS data |
| **Access** | [WDFW SalmonScape](https://apps.wdfw.wa.gov/salmonscape/) |
| **Tier** | Gold — State wildlife agency |

**Minecraft use:** Salmon spawn locations drive ECO module salmon nutrient pathway mapping. Stream segments tagged by species presence determine which salmon entities appear in which waterways.

---

## Data Pipeline: Datasets → Minecraft World

How these datasets combine to build walkable Puget Sound beaches:

| Layer | Dataset | Output | Minecraft Mapping |
|-------|---------|--------|-------------------|
| **Terrain shape** | DS-TOPO-01 (1m DEM) | Elevation grid | Elevation ft ÷ 40.05 = block offset from sea level (y=-41) |
| **Canopy height** | DS-IMG-04 (3DEP LiDAR) | Tree height grid | Ground + canopy → terrain blocks + tree blocks stacked |
| **Water depth** | DS-TOPO-01 (bathymetry) | Depth grid | Negative elevation → water blocks below y=-41 |
| **Beach material** | DS-HABITAT-01 (substrate) | Material class | Sand→sand, gravel→gravel, cobble→cobblestone, mud→clay, rock→stone |
| **Bedrock type** | DS-GEO-01 + DS-GEO-02 (geologic maps) | Rock class | Basalt→deepslate, sandstone→sandstone, granite→granite |
| **Soil type** | DS-GEO-03 (SSURGO) | Soil class | Sandy loam→sand/dirt, clay→clay, peat→soul soil |
| **Vegetation type** | DS-VEG-02 (LANDFIRE EVT) | Biome assignment | Ecological system type → Minecraft biome + block palette |
| **Tree species** | DS-VEG-01 (FIA) + DS-BIO-01 (GBIF) | Species mix | Dominant tree → log/leaf block type per biome zone |
| **Bird spawns** | DS-BIO-02 (eBird abundance) | Spawn tables | Species abundance × habitat = spawn probability per chunk |
| **Salmon streams** | DS-MARINE-03 (SalmonScape) | Stream overlay | Species presence by life stage → salmon entity placement |
| **Vegetation line** | DS-PHOTO-01 (aerials) | Visual reference | Grass/tree placement above high tide line |
| **Bluff geology** | DS-HABITAT-04 (feeder bluffs) | Bluff material | Clay→terracotta, sandstone→sandstone, glacial till→gravel+stone |
| **Underwater habitat** | DS-HABITAT-05 (sonar) | Benthic map | Eelgrass→kelp blocks, bare substrate→sand/gravel |
| **Sediment dynamics** | DS-HABITAT-02 (drift cells) | Transport zones | Beach width and character by zone |
| **Water level** | DS-CLIM-04 (NOAA Tides) | Tide line | MHW → y=-41 (sea level), MLLW → y=-43 (low tide) |
| **Climate zones** | DS-CLIM-01 (PRISM) | Temp/precip grid | Rain shadow + elevation → biome transition rules |
| **Fire history** | DS-FIRE-01 (MTBS) | Burn age map | Burn year → forest successional stage → tree height/density |
| **Protected areas** | DS-LAND-01 (PAD-US) | Management zones | Wilderness → pristine, managed forest → working landscape |
| **Land cover** | DS-VEG-03 (NLCD) | Cover class | Urban/forest/water/wetland → broad biome assignment |

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
