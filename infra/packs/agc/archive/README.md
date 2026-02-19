# AGC Documentation Archive

Master catalog of Apollo Guidance Computer documentation for educational study and downstream agent consumption.

## Overview

This archive indexes 210 unique documents spanning the full lifecycle of the Apollo Guidance Computer -- from hardware design through flight operations. Documents are sourced from four primary archives and organized into eight functional categories.

The catalog serves as the foundation for the AGC educational pack. Downstream phases (207 AGC Study, 213-214 Simulator, 221 Curriculum) consume this catalog to reference source material with stable document IDs.

## Sources

| Source | Count | Base URL | Description |
|--------|-------|----------|-------------|
| **Virtual AGC** | 160 | https://www.ibiblio.org/apollo/ | Primary source. Ronald Burkey's comprehensive preservation project with 1,000+ scanned documents, recovered source code, and simulators. |
| **Other** | 24 | various | klabs.org (Eldon Hall schematics), Springer (O'Brien book), GitHub (source code repos), Wikipedia, community sites. |
| **NASA NTRS** | 16 | https://ntrs.nasa.gov/ | NASA Technical Reports Server. Apollo Experience Reports, reliability studies, GNC hardware overviews. |
| **Internet Archive** | 10 | https://archive.org/ | Scanned MIT Instrumentation Laboratory documents -- program listings, engineering drawings, flowcharts. |

## Categories

| Category | Count | Description |
|----------|-------|-------------|
| **architecture** | 28 | AGC hardware design: Block I/II architecture, logic modules, memory organization, NOR gate logic, reliability analysis. |
| **software** | 38 | Source code listings, GSOPs (guidance equations, operational modes, autopilot), flowcharts, interpreter docs, program descriptions. |
| **educational** | 30 | Modern analysis, tutorials, Wikipedia articles, community resources, experience report indexes, simulator projects. |
| **management** | 28 | Tindallgrams (1,100+ memos), project status reports, configuration management, schedule tracking, software change control. |
| **operations** | 26 | Mission reports, flight plans, crew procedures, training materials, padloads, reference cards, post-flight analysis. |
| **interface** | 22 | I/O channels, DSKY interface, IMU/optics/radar interfaces, engine control, CM-LM data link, ground support equipment. |
| **testing** | 20 | Acceptance tests, software verification, anomaly reports, environmental testing, integration test plans, experience reports. |
| **engineering_drawings** | 18 | Electrical schematics, mechanical drawings, aperture card scans from NARA, module/tray layouts, core rope drawings. |

## Relevance Ratings

| Rating | Count | Meaning |
|--------|-------|---------|
| `essential` | 23 | Must-read for understanding the AGC. Start here. |
| `important` | 55 | Significantly deepens understanding. Read after essentials. |
| `supplementary` | 68 | Useful additional context for specific topics. |
| `reference` | 64 | Specialized reference material for deep research. |

## Schema Reference

Each catalog entry has the following fields:

```yaml
- id: "agc-{category}-{number}"   # Stable identifier (e.g., agc-arch-001)
  title: "Document Title"          # Full document title
  author: "Author or Organization" # Primary author(s)
  date: "YYYY or YYYY-MM-DD"      # Publication date (approximate if uncertain)
  source: "virtual_agc|internet_archive|nasa_ntrs|other"  # Source archive
  source_url: "https://..."        # Direct URL to document or index page
  format: "pdf|html|text|scan"     # Document format
  relevance: "essential|important|supplementary|reference"  # Study priority
  description: "..."               # 1-2 sentence description of contents and significance
  tags: [...]                      # Searchable keywords
  doc_number: "..."                # Original document number (R-700, E-2052, etc.)
  missions: [...]                  # Applicable Apollo missions, or ["all"]
```

### Field Details

- **id**: Unique, stable identifier. Format: `agc-{category_prefix}-{3-digit-number}`. Category prefixes: `arch`, `soft`, `ops`, `draw`, `iface`, `test`, `mgmt`, `edu`.
- **source_url**: Direct link where possible. For Virtual AGC items without individual PDF URLs, links to the document library index page.
- **format**: `pdf` = downloadable PDF, `html` = web page, `text` = plain text, `scan` = scanned page images (often on Internet Archive).
- **missions**: Array of applicable missions. Use `["all"]` for documents spanning the entire program. Specific missions use lowercase: `["apollo-11"]`, `["apollo-7-through-17"]`.

## Usage

### For Study Agents (Phase 207)

```yaml
# Load catalog and filter by relevance
catalog = load("infra/packs/agc/archive/catalog.yaml")
essentials = [doc for doc in all_docs if doc.relevance == "essential"]
# Use reading-paths.yaml for curated study sequences
```

### For Simulator Agents (Phases 213-214)

```yaml
# Find technical references for a specific subsystem
software_docs = catalog.documents.software
gsop_docs = [doc for doc in software_docs if "gsop" in doc.tags]
# Cross-reference with cross-references.yaml for related documents
```

### For Curriculum Agents (Phase 221)

```yaml
# Build learning paths from catalog + reading-paths.yaml
paths = load("infra/packs/agc/archive/reading-paths.yaml")
quick_start = paths.paths.quick_start  # 10 essential docs
deep_dive = paths.paths.deep_dive      # 50 docs in 8 sections
```

## Maintenance

### Adding New Documents

1. Choose the appropriate category
2. Generate the next sequential ID: `agc-{prefix}-{next_number}`
3. Fill all required fields (id, title, author, date, source, source_url, format, relevance, description, tags, doc_number, missions)
4. Update `metadata.total_documents` and the relevant source/category counts
5. If the document relates to existing entries, add cross-references in `cross-references.yaml`

### Verifying URLs

Source URLs should be periodically checked. Priority:
1. `essential` documents (23 entries) -- must always be accessible
2. `important` documents (55 entries) -- check monthly
3. Others -- check quarterly

Virtual AGC (ibiblio.org) URLs are the most stable. Internet Archive URLs are permanent by design. NASA NTRS citation pages are stable; direct PDF links may change.

## Related Files

| File | Purpose |
|------|---------|
| `catalog.yaml` | Master document catalog (this file documents it) |
| `reading-paths.yaml` | Curated learning sequences: Quick Start (10), Deep Dive (50), Complete Study |
| `cross-references.yaml` | Inter-document relationship map |
| `mirror-config.yaml` | Download/mirror configuration for representative documents |
