# Bio-Physics Sensing — Data Schema

## Physics Phenomenon Page Schema

Each physics phenomenon page follows this structure:

| Field | Required | Description |
|-------|----------|-------------|
| Title | Yes | Phenomenon name (e.g., "Sonar — Echo-Delay Ranging") |
| Physics Domain | Yes | Category: Acoustic, Electromagnetic, Electrostatic, Mechanical |
| Governing Equation(s) | Yes | Mathematical expression with variables defined |
| Units | Yes | SI units for all quantities |
| Engineering Implementation | Yes | How humans implement this (e.g., Navy sonar array) |
| Biological Implementation(s) | Yes | Species that use this physics, with mechanism detail |
| PNW Cross-Reference | Yes | Pacific Northwest species or system link |
| Signal Processing Analogue | Recommended | Corresponding DSP/engineering concept |
| Interrelationships | Recommended | Links to related physics phenomena pages |
| Primary Sources | Yes | Peer-reviewed or government agency citations |

## Species Page Schema

Each PNW species page follows this structure:

| Field | Required | Description |
|-------|----------|-------------|
| Common Name | Yes | Standard common name |
| Scientific Name | Yes | Binomial nomenclature, italicized |
| Conservation Status | Yes | ESA listing, IUCN status, state status |
| Sensing Modality | Yes | Primary sensing physics (e.g., biosonar, magnetoreception) |
| Physics Mechanism | Yes | Detailed mechanism description with physics equations |
| Signal Processing Chain | Yes | source → propagation → transducer → conditioning → extraction → action |
| Habitat / Range | Yes | PNW-specific geographic context |
| Trophic Role | Recommended | Ecological position and connections |
| Conservation Physics | Recommended | How physics knowledge aids conservation (e.g., noise impact on orca sonar) |
| Cross-Links | Yes | Links to phenomenon pages and other species pages |
| Primary Sources | Yes | NOAA, USGS, peer-reviewed citations |

## Interrelationships Map Schema

The cross-reference atlas maps every phenomenon to every biological implementation:

| Column | Description |
|--------|-------------|
| Physics Phenomenon | Row identifier |
| Acoustic Bio | Biological acoustic implementation(s) |
| EM Bio | Biological electromagnetic implementation(s) |
| Signal Processing | Engineering analogue |
| PNW Species | Pacific Northwest species using this physics |
| Related Phenomena | Links to connected physics pages |

## File Naming Convention

- Physics pages: `01-sonar-echo-delay.md`, `02-doppler-effect.md`, etc.
- Species pages: `pnw-01-southern-resident-orca.md`, `pnw-02-pacific-salmon.md`, etc.
- Synthesis: `06-interrelationships-atlas.md`
- Support: `00-data-schema.md`, `00-source-index.md`, `07-gpu-pipeline.md`
