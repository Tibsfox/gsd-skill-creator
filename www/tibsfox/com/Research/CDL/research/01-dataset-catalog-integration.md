# Dataset Catalog Integration

> **Domain:** Knowledge Infrastructure
> **Module:** 1 -- DCAT, Schema.org, and Open Data Portal Adapters
> **Through-line:** *A concept node without a dataset link is a library book with the bibliography ripped out.* The W3C's Data Catalog Vocabulary gives every dataset a machine-readable identity. Schema.org makes that identity discoverable through search. CKAN makes it queryable through APIs. Together, they turn the College of Knowledge from a static curriculum into a living connection to the scholarship that never stops.

---

## Table of Contents

1. [The Dataset Linking Problem](#1-the-dataset-linking-problem)
2. [DCAT: The W3C Data Catalog Vocabulary](#2-dcat-the-w3c-data-catalog-vocabulary)
3. [DCAT-US: The Federal Implementation](#3-dcat-us-the-federal-implementation)
4. [Schema.org/Dataset and Google Dataset Search](#4-schemaorgdataset-and-google-dataset-search)
5. [JSON-LD Encoding Patterns](#5-json-ld-encoding-patterns)
6. [CKAN: The Open Data Infrastructure](#6-ckan-the-open-data-infrastructure)
7. [Domain Portal Adapters](#7-domain-portal-adapters)
8. [The Dataset Knowledge Graph (DSKG)](#8-the-dataset-knowledge-graph-dskg)
9. [Dataset Freshness and Version Tracking](#9-dataset-freshness-and-version-tracking)
10. [College Concept Node Integration Pattern](#10-college-concept-node-integration-pattern)
11. [Implementation Considerations](#11-implementation-considerations)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. The Dataset Linking Problem

The College of Knowledge operates on a foundational premise: code is the curriculum. A concept node in the Math Department does not merely describe exponential decay -- it provides executable Rosetta Panel expressions that compute decay curves, fit parameters, and visualize results. But when those expressions operate on fabricated data -- synthetic arrays of temperature readings that never came from a thermometer, made-up particle counts that never came from a detector -- the teaching stops at the classroom wall.

Real research datasets carry epistemological freight that no synthetic data can replicate. A measurement from CERN's Open Data Portal arrives with uncertainty bounds, calibration metadata, collection timestamps, and instrument specifications. A nutritional dataset from USDA FoodData Central carries methodology descriptions, sample sizes, and analytical method codes. These are not decorations -- they are the connective tissue between a concept and the scholarship that validates it.

```
THE DATASET LINKING PROBLEM -- BEFORE AND AFTER
================================================================

  BEFORE (Static Concept Node):
  ┌────────────────────────────────┐
  │  exponential-decay.ts          │
  │  ├── panel: Python             │
  │  │   data = [100, 82, 67, 55]  │  <-- fabricated data
  │  │   # "some measurements"     │  <-- no provenance
  │  └── panel: Perl               │
  │      @data = (100, 82, 67, 55) │  <-- same fake numbers
  └────────────────────────────────┘

  AFTER (Deep-Linked Concept Node):
  ┌────────────────────────────────────────────────┐
  │  exponential-decay.ts                          │
  │  ├── datasetLink:                              │
  │  │   ├── dcat:Dataset                          │
  │  │   │   ├── title: "Cs-137 Decay Series"     │
  │  │   │   ├── publisher: "CERN Open Data"       │
  │  │   │   ├── modified: "2025-11-14"            │
  │  │   │   └── distribution:                     │
  │  │   │       └── accessURL: https://...        │
  │  │   └── schema:Dataset (JSON-LD)              │
  │  │       └── Google Dataset Search indexable    │
  │  ├── panel: Python                             │
  │  │   data = fetch_dcat("10.5281/zenodo....")   │  <-- real data
  │  │   # Cs-137 half-life: 30.17 years [NNDC]   │  <-- attributed
  │  └── panel: Perl                               │
  │      @data = dcat_fetch("10.5281/zenodo....")   │
  │      # POD: Source, uncertainty, units          │
  └────────────────────────────────────────────────┘
```

The technical challenge is standards-based interoperability. The W3C, schema.org, and CKAN communities have spent two decades building the vocabulary, and the College's job is to use it correctly -- not reinvent it.

> **Related:** [Learning Pathway Architecture](02-learning-pathway-architecture.md), [Pedagogical Verbosity Engine](03-pedagogical-verbosity-engine.md), [COK College of Knowledge](../../../Research/COK/index.html), [GSD2 Architecture](../../../Research/GSD2/index.html)

---

## 2. DCAT: The W3C Data Catalog Vocabulary

DCAT (Data Catalog Vocabulary) is the W3C Recommendation for describing datasets and data catalogs in RDF [1]. Published as a W3C Recommendation in 2014 (DCAT 1.0) and substantially revised in 2020 (DCAT 2.0, W3C Recommendation 2020-02-04), it provides the authoritative vocabulary for machine-readable dataset metadata across the open data ecosystem.

### Core DCAT Types

DCAT defines three primary classes that form the backbone of any dataset description:

- **`dcat:Catalog`** -- A curated collection of metadata about resources. In College terms, this is the department-level container: the Math Department's dataset catalog aggregates all datasets referenced by Math concept nodes.
- **`dcat:Dataset`** -- A collection of data, published or curated by a single agent. This is the primary link target for a concept node: "this concept uses data from this dataset."
- **`dcat:Distribution`** -- A specific available form of a dataset. A single dataset may have CSV, JSON, and Parquet distributions. The concept node links to the dataset; the panel code links to the specific distribution format it can parse.

### DCAT Property Hierarchy

The DCAT 2.0 specification organizes properties into inheritance chains. Both `dcat:Catalog` and `dcat:Dataset` inherit from `dcat:Resource`, which itself inherits from `dcat:CatalogRecord`. The key properties for College integration [1]:

| Property | Domain | Range | College Use |
|---|---|---|---|
| `dct:title` | Resource | rdfs:Literal | Display name in concept node UI |
| `dct:description` | Resource | rdfs:Literal | Gloss-tier annotation source |
| `dct:publisher` | Resource | foaf:Agent | Attribution in panel comments |
| `dct:modified` | Resource | rdfs:Literal | Freshness tracking trigger |
| `dcat:distribution` | Dataset | Distribution | Panel code access point |
| `dcat:accessURL` | Distribution | rdfs:Resource | Actual data fetch endpoint |
| `dcat:downloadURL` | Distribution | rdfs:Resource | Direct download (preferred) |
| `dct:license` | Distribution | dct:LicenseDocument | License verification gate |
| `dcat:mediaType` | Distribution | dct:MediaType | Panel parser selection |

### DCAT Versioning: 1.0 to 2.0

DCAT 2.0 introduced several properties critical to the College's use case that were absent in 1.0:

- **`dcat:DataService`** -- Describes an API endpoint, not just a downloadable file. This enables the College to link to CKAN API endpoints and Zenodo REST APIs directly, rather than only to static file downloads.
- **`dcat:endpointURL`** -- The base URL of a DataService. This is the CKAN `/api/3/action/` root or the Zenodo REST API base.
- **`dcat:servesDataset`** -- Links a DataService to the datasets it provides access to, enabling discovery of all datasets available through a single API.
- **`dcat:temporalResolution`** and **`dcat:spatialResolution`** -- Enable concept nodes to specify the granularity of linked datasets, critical for matching real data to pedagogical requirements.

> **Related:** [FEG Federation Graph](../../../Research/FEG/index.html), [MPC Math Co-Processor](../../../Research/MPC/index.html)

---

## 3. DCAT-US: The Federal Implementation

DCAT-US Schema v1.1 (formerly Project Open Data Metadata Schema) is the United States federal government's implementation of DCAT, maintained at resources.data.gov [2]. It is the metadata standard behind data.gov's 300,000+ dataset catalog and provides the most extensively tested DCAT field mapping in production.

### Three-Tier Metadata Architecture

DCAT-US specifies three tiers of metadata fields, each with explicit requirements:

**Required Fields (must be present for catalog inclusion):**
- `title` -- Human-readable dataset name
- `description` -- Human-readable description
- `contactPoint` -- Maintainer contact (vCard format)
- `publisher` -- Organization responsible for the dataset
- `identifier` -- Unique dataset identifier (must be URI)
- `accessLevel` -- public, restricted-public, or non-public
- `bureauCode` -- Federal agency code (US-specific)

**Required-if-Applicable Fields (conditional on context):**
- `spatial` -- Geographic coverage (GeoJSON or text)
- `temporal` -- Temporal coverage (ISO 8601 interval)
- `dataQuality` -- Whether the dataset meets agency quality standards
- `accrualPeriodicity` -- Update frequency (ISO 8601 duration)

**Expanded Fields (recommended for enhanced discoverability):**
- `describedBy` -- URL to the dataset's data dictionary
- `landingPage` -- URL to the dataset's web landing page
- `references` -- URLs to related documents
- `theme` -- Topic categories from a controlled vocabulary

### Cross-Standard Field Mapping

DCAT-US provides explicit field equivalence tables mapping to Schema.org, CKAN, and DCAT 1.0 [2]. This mapping is the translation layer the College needs:

| DCAT-US Field | Schema.org Equivalent | CKAN Equivalent |
|---|---|---|
| title | schema:name | title |
| description | schema:description | notes |
| contactPoint | schema:contactPoint | maintainer |
| publisher | schema:publisher | organization |
| identifier | schema:identifier | id |
| accessLevel | (no direct equivalent) | private (boolean) |
| license | schema:license | license_id |
| spatial | schema:spatialCoverage | spatial |
| temporal | schema:temporalCoverage | (extras field) |
| modified | schema:dateModified | metadata_modified |

This mapping means a single College `DatasetLink` type can be populated from any of the three sources -- DCAT-US catalog, schema.org markup on a web page, or CKAN API response -- using a deterministic translation function.

---

## 4. Schema.org/Dataset and Google Dataset Search

Schema.org's `Dataset` type was originally derived from DCAT and is now the primary mechanism by which Google Dataset Search discovers and indexes open research data [3]. As of 2022, over 44% of websites include JSON-LD schema.org markup, and Google's Dataset Search specifically harvests `schema.org/Dataset` annotations from web pages [4].

### The Google Dataset Search Pipeline

Google Dataset Search operates on a three-stage pipeline:

1. **Crawl:** Google's web crawler discovers pages containing `<script type="application/ld+json">` blocks with `@type: "Dataset"`.
2. **Parse:** The JSON-LD payload is extracted and validated against schema.org/Dataset property definitions.
3. **Index:** Valid dataset descriptions are added to the Dataset Search index, searchable at datasetsearch.research.google.com.

This pipeline means College concept nodes that embed valid JSON-LD `Dataset` references in their HTML output become discoverable through Google Dataset Search without any additional work. The concept node's web rendering is simultaneously its discovery mechanism.

### Required Schema.org/Dataset Properties

Google's documentation specifies minimum requirements for Dataset Search inclusion [3]:

- `name` -- Dataset title (maps to DCAT `dct:title`)
- `description` -- Free-text description (minimum 50 characters recommended)
- `url` -- Canonical URL of the dataset landing page

**Recommended properties for enhanced visibility:**

- `creator` -- Person or Organization that created the dataset
- `citation` -- Scholarly article or publication describing the dataset
- `license` -- Creative Commons or equivalent license URL
- `temporalCoverage` -- ISO 8601 date range
- `spatialCoverage` -- GeoShape or Place describing geographic extent
- `variableMeasured` -- PropertyValue or text describing measured variables
- `measurementTechnique` -- Description of the measurement methodology
- `isBasedOn` -- URL of a related dataset or publication

### The Discoverability Advantage

The practical consequence for the College: every concept node that includes a JSON-LD `schema.org/Dataset` reference becomes a gateway. A researcher searching Google Dataset Search for "exponential decay measurement data" may discover the College's Math Department concept node -- not as a dataset, but as a pedagogically rich context for that dataset. The concept node teaches; the dataset link connects; the search engine discovers. Three layers of value from one JSON-LD block.

> **Related:** [ACE Compute Engine](../../../Research/ACE/index.html), [SGM Sacred Geometry](../../../Research/SGM/index.html)

---

## 5. JSON-LD Encoding Patterns

JSON-LD (JavaScript Object Notation for Linked Data) is the W3C Recommendation for encoding RDF as JSON [5]. It is the default serialization format for both DCAT metadata in web contexts and schema.org structured data. For the College, JSON-LD serves dual duty: it is both the internal representation of dataset links in concept nodes and the external representation that makes those links discoverable.

### College DatasetLink JSON-LD Template

The following JSON-LD template defines a College concept node's dataset link. It combines DCAT and schema.org vocabularies to satisfy both machine-readable catalog requirements and Google Dataset Search indexing:

```
{
  "@context": {
    "schema": "https://schema.org/",
    "dcat": "http://www.w3.org/ns/dcat#",
    "dct": "http://purl.org/dc/terms/",
    "college": "https://college.gsd/vocab/"
  },
  "@type": ["schema:Dataset", "dcat:Dataset"],
  "schema:name": "Cesium-137 Gamma Decay Series",
  "dct:title": "Cesium-137 Gamma Decay Series",
  "schema:description": "Gamma ray energy spectrum measurements...",
  "dct:description": "Gamma ray energy spectrum measurements...",
  "schema:creator": {
    "@type": "schema:Organization",
    "schema:name": "CERN Open Data"
  },
  "dct:publisher": {
    "@type": "foaf:Organization",
    "foaf:name": "CERN Open Data"
  },
  "schema:license": "https://creativecommons.org/licenses/by/4.0/",
  "dct:license": "https://creativecommons.org/licenses/by/4.0/",
  "dcat:distribution": {
    "@type": "dcat:Distribution",
    "dcat:accessURL": "https://opendata.cern.ch/record/...",
    "dcat:downloadURL": "https://opendata.cern.ch/record/.../files/data.csv",
    "dcat:mediaType": "text/csv",
    "dct:format": "CSV"
  },
  "college:conceptNode": "math/exponential-decay",
  "college:bloomLevel": "Apply",
  "college:panelFamily": ["python", "perl", "fortran"],
  "dct:modified": "2025-11-14"
}
```

### Dual-Vocabulary Strategy

The template deliberately duplicates properties across DCAT and schema.org vocabularies (e.g., `dct:title` and `schema:name` carry the same value). This is intentional: DCAT consumers (data catalogs, SPARQL endpoints) read the DCAT properties; schema.org consumers (Google Dataset Search, web crawlers) read the schema.org properties. The duplication cost is a few hundred bytes per dataset link; the interoperability benefit is universal discoverability.

### JSON-LD Compaction and Expansion

JSON-LD supports two transformations critical for College infrastructure [5]:

- **Compaction:** Reduces a verbose JSON-LD document to its shortest form using a context document. Used when storing dataset links in concept node files to minimize file size.
- **Expansion:** Restores a compacted document to its fully explicit form with complete IRIs. Used when validating dataset links against DCAT and schema.org specifications.

The College's dataset link pipeline should store compacted JSON-LD in concept node files and expand on demand for validation and catalog generation.

---

## 6. CKAN: The Open Data Infrastructure

CKAN (Comprehensive Knowledge Archive Network) is the open-source data management system that powers data.gov, data.europa.eu, and hundreds of national and regional open data portals worldwide [6]. Born from CPAN's 1995 architecture for Perl module distribution, CKAN adapted the namespace, metadata, and mirror patterns for open data cataloging beginning in 2006.

### CKAN Action API

CKAN exposes a RESTful JSON API at `/api/3/action/` with endpoints for dataset discovery and retrieval:

```
CKAN ACTION API -- KEY ENDPOINTS
================================================================

  Discovery:
    GET /api/3/action/package_list
      Returns: list of all dataset IDs in the catalog
      Use: enumerate available datasets for a department

    GET /api/3/action/package_search?q=exponential+decay&rows=10
      Returns: paginated search results with full metadata
      Use: find datasets matching a concept node's topic

  Retrieval:
    GET /api/3/action/package_show?id=cesium-137-decay
      Returns: full dataset metadata (DCAT-compatible)
      Use: populate a DatasetLink from catalog metadata

    GET /api/3/action/resource_show?id=<resource-id>
      Returns: metadata for a specific distribution
      Use: get download URL and format for panel code

  Organization:
    GET /api/3/action/organization_show?id=cern
      Returns: publishing organization metadata
      Use: populate publisher field in DatasetLink
```

### CKAN-to-DCAT Mapping

CKAN metadata fields map directly to DCAT as documented in DCAT-US v1.1 [2]. The mapping is one-to-one for the fields the College needs:

| CKAN Field | DCAT Property | Notes |
|---|---|---|
| title | dct:title | Direct mapping |
| notes | dct:description | CKAN uses "notes" for description |
| organization.title | dct:publisher | Nested in organization object |
| metadata_modified | dct:modified | ISO 8601 timestamp |
| license_id | dct:license | CKAN license registry ID |
| resources[].url | dcat:accessURL | Per-resource (distribution) |
| resources[].format | dcat:mediaType | Format string, not MIME type |

### Primary CKAN Instances for College Integration

The College's dataset linking should target these production CKAN instances, each representing a distinct domain of scholarship:

- **data.gov** (US federal) -- 300,000+ datasets; DCAT-US compliant; covers every federal agency
- **data.europa.eu** (European) -- 1.6M+ datasets; DCAT-AP (Application Profile for Europe) metadata
- **datahub.io** -- Curated datasets across domains; Frictionless Data Package format
- **Zenodo** (CERN) -- Research data repository; REST API; CC-BY by default; DOI assignment
- **OpenAIRE** -- 146M publication links; European research output aggregator

---

## 7. Domain Portal Adapters

Beyond CKAN, several domain-specific data portals serve as primary dataset sources for College departments. Each portal exposes a distinct API pattern that the College needs a dedicated adapter to consume.

### Zenodo REST API (Research Data)

Zenodo, operated by CERN, is the European Commission's recommended repository for research data [7]. Its REST API provides:

```
ZENODO REST API -- COLLEGE INTEGRATION PATTERN
================================================================

  Search:
    GET https://zenodo.org/api/records?q=exponential+decay&type=dataset
    Returns: JSON array of record metadata (DCAT-compatible)

  Record Metadata:
    GET https://zenodo.org/api/records/{id}
    Returns: {
      "doi": "10.5281/zenodo.XXXXXXX",
      "metadata": {
        "title": "...",
        "description": "...",
        "creators": [...],
        "license": { "id": "cc-by-4.0" },
        "publication_date": "2025-..."
      },
      "files": [
        { "key": "data.csv", "size": 12345, "links": { "self": "https://..." } }
      ]
    }

  College Adapter Mapping:
    zenodo.metadata.title       -> dct:title
    zenodo.doi                  -> dct:identifier
    zenodo.metadata.creators    -> dct:creator
    zenodo.metadata.license.id  -> dct:license
    zenodo.files[].links.self   -> dcat:downloadURL
    zenodo.metadata.publication_date -> dct:issued
```

### USDA FoodData Central (Cooking Department)

FoodData Central provides the nutritional and food science data the Cooking Department needs [8]. Its API uses a different pattern -- API key authentication and typed search:

```
FOODDATA CENTRAL API -- COLLEGE INTEGRATION PATTERN
================================================================

  Search:
    GET https://api.nal.usda.gov/fdc/v1/foods/search
    Params: query, dataType, pageSize, api_key
    DataTypes: Foundation, SR Legacy, Survey (FNDDS), Branded

  Nutrient Data:
    GET https://api.nal.usda.gov/fdc/v1/food/{fdcId}
    Returns: full nutrient profile with analytical methods

  College Adapter Mapping:
    fdc.description          -> dct:title
    fdc.dataType             -> college:datasetType
    fdc.foodNutrients[]      -> college:measurements
    fdc.publicationDate      -> dct:issued
    "USDA ARS"               -> dct:publisher (constant)
```

### CERN Open Data Portal (Physics Department)

The CERN Open Data Portal provides particle physics datasets for the Math and Physics curriculum [9]:

```
CERN OPEN DATA -- COLLEGE INTEGRATION PATTERN
================================================================

  Search:
    GET https://opendata.cern.ch/api/records?q=decay&type=dataset
    Returns: MARC21-based metadata (requires transformation)

  Record:
    GET https://opendata.cern.ch/api/records/{recid}
    Returns: record with files array and experiment metadata

  College Adapter Mapping:
    record.metadata.title         -> dct:title
    record.metadata.doi           -> dct:identifier
    record.metadata.experiment    -> college:experimentSource
    record.files[].uri            -> dcat:downloadURL
    "CERN"                        -> dct:publisher (constant)
```

### NIST Statistical Reference Datasets

The National Institute of Standards and Technology maintains reference datasets specifically designed for validating statistical algorithms [10]. These datasets have certified correct answers, making them ideal for the College's Bloom-level Apply and Analyze exercises:

- **StRD Linear Regression** -- Datasets with certified coefficients for least-squares fitting
- **StRD Nonlinear Regression** -- Datasets with certified parameters for nonlinear models
- **StRD Univariate Summary Statistics** -- Datasets with certified mean, std deviation, etc.

The NIST datasets do not have a REST API; they are static files at `https://www.itl.nist.gov/div898/strd/`. The College adapter for NIST datasets should use direct URL construction with dataset name parameters.

> **Related:** [WAL Weird Al / Rosetta Stone](../../../Research/WAL/index.html), [COK College of Knowledge](../../../Research/COK/index.html)

---

## 8. The Dataset Knowledge Graph (DSKG)

The Dataset Knowledge Graph (DSKG) at `http://dskg.org` represents the state of the art in linked dataset metadata infrastructure [11]. Built by Farber and Lamprecht (2021), the DSKG is a SPARQL-queryable RDF knowledge graph containing metadata from 2,208 datasets with 813,551 links to scientific publications, cross-linked via ORCID for author disambiguation.

### DSKG Architecture

The DSKG demonstrates three patterns directly applicable to the College:

1. **Cross-linking via persistent identifiers:** Every dataset in the DSKG is linked to publications via DOI and to authors via ORCID. The College should adopt the same pattern: every `DatasetLink` must include a DOI or equivalent persistent identifier, and every dataset citation must include author ORCID where available.

2. **Vocabulary alignment:** The DSKG maps its metadata to DCAT, enabling interoperability with any DCAT-consuming tool. The College's `DatasetLink` type already uses DCAT vocabulary, making DSKG integration structurally free.

3. **Federated source aggregation:** The DSKG aggregates metadata from OpenAIRE and Wikidata, demonstrating that a knowledge graph can span multiple upstream sources without duplicating data. The College's department catalogs should aggregate dataset links from multiple portals (CKAN, Zenodo, domain portals) using the same federated pattern.

### SPARQL Integration

The DSKG SPARQL endpoint enables queries like "find all datasets cited by publications about exponential decay." This query pattern would allow the College to automatically discover relevant datasets for a concept node based on the concept's keywords and related publications -- a machine-driven version of the manual dataset curation that the seeding protocol requires.

---

## 9. Dataset Freshness and Version Tracking

A dataset link becomes stale when the linked resource has changed in ways that affect the concept node's teaching content. The freshness tracking system must detect three categories of change:

### Staleness Detection Categories

| Category | Detection Method | Threshold | Action |
|---|---|---|---|
| **Availability** | HTTP HEAD request returns non-200 | Immediate | Flag stale; escalate to CAPCOM |
| **Content update** | `dct:modified` timestamp exceeds threshold | 365 days (configurable) | Flag review; suggest re-validation |
| **Schema change** | Distribution format or field names changed | Any breaking change | Flag broken; block panel execution |
| **License change** | `dct:license` value changed | Any change | Flag review; verify compliance |

### Version Tracking Pattern

The College should maintain a `DatasetVersion` record for each active dataset link:

```
DatasetVersion Schema:
  datasetId:      string    -- DCAT identifier (DOI or URI)
  lastChecked:    ISO8601   -- timestamp of most recent freshness check
  lastModified:   ISO8601   -- dct:modified value from last check
  httpStatus:     number    -- last HEAD request status code
  contentHash:    string    -- SHA-256 of distribution file (optional)
  licenseId:      string    -- dct:license value from last check
  schemaVersion:  string    -- detected format version (if applicable)
  status:         enum      -- fresh | review | stale | broken
```

The stale-link detection skill should run on a configurable schedule (default: weekly) and emit xAPI `flagged-stale` statements for any dataset link whose status changes from `fresh` to any other value.

---

## 10. College Concept Node Integration Pattern

The integration of dataset links into concept nodes follows a layered pattern that respects the separation between concept content (teaching material) and dataset references (external scholarship connections).

### Concept Node File Structure

```
concept-node/
  ├── concept.ts           -- Concept definition and metadata
  ├── panels/
  │   ├── python.ts        -- Python panel expression
  │   ├── perl.ts          -- Perl panel expression
  │   ├── cpp.ts           -- C++ panel expression
  │   └── ...
  ├── datasets/
  │   ├── refs.ts          -- DatasetLink[] array (JSON-LD compacted)
  │   └── versions.ts      -- DatasetVersion[] array (freshness state)
  ├── pathway.ts           -- Dependency graph edges (Module B)
  └── annotations/
      ├── glance.md        -- Glance-tier annotation (Module C)
      ├── read.md          -- Read-tier annotation (Module C)
      └── study.md         -- Study-tier annotation (Module C)
```

### DatasetLink TypeScript Interface

```
interface DatasetLink {
  "@context": DCATContext;
  "@type": ["schema:Dataset", "dcat:Dataset"];
  "dct:title": string;
  "schema:name": string;
  "dct:description": string;
  "dct:publisher": DCATAgent;
  "dct:identifier": string;           // DOI or URI
  "dct:license": string;              // License URL
  "dct:modified": string;             // ISO 8601
  "dcat:distribution": DCATDistribution[];
  "college:conceptNode": string;       // Concept node path
  "college:bloomLevel": BloomLevel[];  // Applicable Bloom levels
  "college:panelFamily": PanelFamily[];// Which panels use this data
}
```

### Dataset Resolution at Panel Execution

When a learner executes a panel expression, the panel code resolves its dataset reference through a three-step pipeline:

1. **Lookup:** Read `datasets/refs.ts` to find the `DatasetLink` for the panel's data requirement.
2. **Freshness check:** Read `datasets/versions.ts` to verify the link is in `fresh` or `review` status. If `stale` or `broken`, display a warning banner with the data vintage date.
3. **Fetch:** Use the `dcat:downloadURL` from the distribution to retrieve the data. Cache locally with a TTL matching the dataset's `accrualPeriodicity`.

This three-step pipeline ensures that learners always see the provenance of their data and are never silently served stale results.

---

## 11. Implementation Considerations

### License Verification Gate

Every dataset link must pass a license verification gate before inclusion in a concept node. The gate checks:

1. The `dct:license` field is populated (reject if missing).
2. The license URL resolves to a recognized open license (CC-BY, CC-BY-SA, CC0, ODC-BY, OGL).
3. The license permits redistribution and modification (required for College use).

Datasets with restricted or non-commercial licenses may be linked as external references (display-only) but must not have their data embedded in panel expressions.

### Indigenous Data Sovereignty

No Indigenous community datasets may be linked without explicit OCAP (Ownership, Control, Access, Possession) compliance verification [12]. This is an absolute constraint, not a best-effort guideline. The dataset linking system must include an `indigenousDataFlag` field that, when set to `true`, requires manual CAPCOM gate approval before the link becomes active.

### Caching Strategy

The College's caching strategy for dataset content:

- **Metadata cache:** Dataset metadata (DCAT properties) cached for 24 hours.
- **Content cache:** Dataset files cached for the duration specified by `accrualPeriodicity` (or 7 days if not specified).
- **Freshness cache:** Version tracking results cached for 1 hour (to prevent excessive HEAD requests).

---

## 12. Cross-References

| Topic | Appears In | Related Projects |
|---|---|---|
| DCAT vocabulary | M1, M5 | COK, FEG, GSD2 |
| Schema.org/Dataset | M1, M4 | WAL, ACE |
| CKAN API patterns | M1, M5 | COK, PMG |
| JSON-LD encoding | M1, M3, M4 | SGM, MPC |
| Zenodo REST API | M1, M4 | COK, FEG |
| Dataset freshness | M1, M5 | GSD2, ACE |
| License verification | M1, M5 | COK, WAL |
| DSKG knowledge graph | M1, M2 | FEG, MPC |
| Concept node structure | M1, M2, M3, M4, M5 | COK, WAL, SGM |
| CERN Open Data | M1, M4 | MPC, GSD2 |

---

## 13. Sources

1. W3C. (2020). *Data Catalog Vocabulary (DCAT) -- Version 2*. W3C Recommendation. https://www.w3.org/TR/vocab-dcat-2/
2. resources.data.gov. *DCAT-US Schema v1.1 (Project Open Data Metadata Schema)*. https://resources.data.gov/resources/dcat-us/
3. Google Developers. *Dataset structured data*. https://developers.google.com/search/docs/data-types/dataset
4. schema.org. *Dataset type specification*. https://schema.org/Dataset
5. W3C. (2020). *JSON-LD 1.1*. W3C Recommendation. https://www.w3.org/TR/json-ld11/
6. CKAN Project. *CKAN Open Source Data Portal Platform*. https://ckan.org
7. Zenodo / CERN. *Open Research Data Repository*. https://zenodo.org
8. USDA Agricultural Research Service. *FoodData Central*. https://fdc.nal.usda.gov
9. CERN. *CERN Open Data Portal*. https://opendata.cern.ch
10. NIST. *Statistical Reference Datasets*. https://www.itl.nist.gov/div898/strd/
11. Farber, M., & Lamprecht, D. (2021). The data set knowledge graph: Creating a linked open data source for data sets. *Quantitative Science Studies*, 2(4), 1324--1355.
12. First Nations Information Governance Centre. *OCAP Principles*. https://fnigc.ca/ocap-training/
13. OpenAIRE. *European Open Science Infrastructure*. https://openaire.eu
14. IEEE. (2023). *IEEE 9274.1.1-2023: Standard for Learning Technology -- xAPI*. https://xapi.com/
15. data.gov. *U.S. Government Open Data*. https://data.gov
16. data.europa.eu. *The Official Portal for European Data*. https://data.europa.eu
