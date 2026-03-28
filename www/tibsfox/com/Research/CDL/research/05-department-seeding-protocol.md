# Department Seeding Protocol

> **Domain:** Knowledge Infrastructure Lifecycle
> **Module:** 5 -- New Department Onboarding, Cross-Department Registration, and Stale-Link Detection
> **Through-line:** *CPAN taught the world that a module without documentation is an unpublishable module. The College teaches the same lesson at the department scale: a concept node without a dataset link, a cross-department bridge, and a Bloom-scaffolded code example at every tier is an incomplete thought. The seeding protocol is the checklist that ensures completeness.*

---

## Table of Contents

1. [The Seeding Problem](#1-the-seeding-problem)
2. [CPAN as the Existence Proof](#2-cpan-as-the-existence-proof)
3. [Department Lifecycle](#3-department-lifecycle)
4. [The Seeding Checklist](#4-the-seeding-checklist)
5. [Concept-to-Dataset Mapping Workflow](#5-concept-to-dataset-mapping-workflow)
6. [Cross-Department Link Registration API](#6-cross-department-link-registration-api)
7. [Department Birth xAPI Statements](#7-department-birth-xapi-statements)
8. [Stale-Link Detection Skill](#8-stale-link-detection-skill)
9. [Quality Gates and CAPCOM Review](#9-quality-gates-and-capcom-review)
10. [Pilot Departments: Math and Cooking](#10-pilot-departments-math-and-cooking)
11. [Cross-References](#11-cross-references)
12. [Sources](#12-sources)

---

## 1. The Seeding Problem

Creating a new College department is not a single action -- it is a lifecycle that begins with concept identification and does not end until every concept node is deep-linked, annotated, and connected. Without a formal protocol, departments are created with varying levels of completeness: some have rich annotations but no dataset links; others have dataset links but no cross-department bridges; still others have panel expressions but no Bloom scaffolding.

The seeding protocol standardizes the department creation lifecycle into a checklist that ensures every required element is present before the department is published. It is the College's equivalent of CPAN's module submission requirements: structural invariants that guarantee minimum quality.

```
THE SEEDING PROBLEM -- INCONSISTENT DEPARTMENT QUALITY
================================================================

  Math Department (well-seeded):
  ┌──────────────────────────────────────┐
  │ unit-circle                          │
  │  ├── 7 panels (all 7 families)       │
  │  ├── DCAT link (Zenodo)              │
  │  ├── Cross-dept bridge (Music)       │
  │  ├── 3-tier annotations              │
  │  ├── Bloom scaffolding (all 6)       │
  │  └── xAPI hooks active               │
  └──────────────────────────────────────┘

  Cooking Department (under-seeded):
  ┌──────────────────────────────────────┐
  │ newtons-cooling                      │
  │  ├── 2 panels (Python, Perl only)    │
  │  ├── No dataset link                 │  <-- gap
  │  ├── No cross-dept bridge            │  <-- gap
  │  ├── Glance annotation only          │  <-- gap
  │  ├── No Bloom scaffolding            │  <-- gap
  │  └── No xAPI hooks                   │  <-- gap
  └──────────────────────────────────────┘

  Seeding protocol ensures BOTH reach minimum quality bar.
```

> **Related:** [Dataset Catalog Integration](01-dataset-catalog-integration.md), [Cross-Department Pathway Bridges](02-learning-pathway-architecture.md), [COK College of Knowledge](../../../Research/COK/index.html)

---

## 2. CPAN as the Existence Proof

CPAN (Comprehensive Perl Archive Network) has operated since 1995 as the definitive existence proof that a community-maintained knowledge repository can enforce structural invariants at scale [1]:

- **220,000+ modules** with mandatory POD documentation
- **14,500+ contributors** following shared namespace conventions
- **Automated testing** via CPAN Testers (1 billion test reports)
- **Dependency resolution** with explicit prerequisite declarations
- **Mirror network** providing global availability

The structural invariants CPAN enforces:

| CPAN Invariant | College Equivalent |
|---|---|---|
| Every module has a `NAME` POD section | Every concept node has a Glance annotation |
| Every module has a `SYNOPSIS` | Every concept has at least one panel expression |
| Every module declares `PREREQ_PM` | Every concept declares `requires` edges |
| Every module has a test suite | Every concept has Bloom-level test assertions |
| Every distribution has a `META.yml` | Every concept has a JSON-LD metadata block |
| PAUSE enforces namespace ownership | Department registry enforces concept ownership |

CKAN adapted CPAN's patterns for open data in 2006 [2], and the College adapts them again for educational concept nodes in 2026. The lineage is direct: CPAN -> CKAN -> College.

---

## 3. Department Lifecycle

A College department progresses through five lifecycle stages:

```
DEPARTMENT LIFECYCLE
================================================================

  1. PROPOSED
     │  Department concept identified
     │  Initial concept list drafted
     │  No files created yet
     │
  2. SCAFFOLDED
     │  Directory structure created
     │  Concept nodes stubbed (empty panels)
     │  Dependency graph drafted
     │  Dataset candidates identified
     │
  3. SEEDED
     │  All checklist items satisfied (see Section 4)
     │  Minimum viable annotations present
     │  At least one dataset link per concept
     │  At least one cross-department bridge
     │
  4. PUBLISHED
     │  Department visible in College UI
     │  xAPI tracking active
     │  Learners can access all content
     │  Freshness tracking scheduled
     │
  5. MAINTAINED
        Stale-link detection running
        Bloom coverage expanding
        New concept nodes added via seeding protocol
        Community contributions accepted
```

### Stage Transitions

| From | To | Gate | Approval |
|---|---|---|---|
| Proposed | Scaffolded | Concept list reviewed | Automated |
| Scaffolded | Seeded | Full checklist satisfied | Automated + CAPCOM |
| Seeded | Published | CAPCOM review complete | Human (CAPCOM) |
| Published | Maintained | 30 days without stale-link alerts | Automated |

---

## 4. The Seeding Checklist

The seeding checklist is the core deliverable of this module. It defines every element that must be present before a department can transition from Scaffolded to Seeded status.

### Mandatory Elements (BLOCK if missing)

| # | Element | Verification | Notes |
|---|---|---|---|
| S-01 | Department metadata (JSON-LD) | Automated: schema validation | Name, description, owner, creation date |
| S-02 | Concept dependency graph | Automated: DAG validation | Acyclic, all concepts reachable from root |
| S-03 | At least one root concept (no prerequisites) | Automated: graph check | Entry point for new learners |
| S-04 | Glance annotation for every concept | Automated: file exists check | Maximum 3 lines per function |
| S-05 | Read annotation for every concept | Automated: file exists check | Symbol-to-code mapping present |
| S-06 | At least 2 panel families per concept | Automated: directory check | Python required; second is department choice |
| S-07 | At least one DCAT dataset link per concept | Automated: JSON-LD validation | Must have valid DOI or URI |
| S-08 | Dataset license verification passed | Automated: license check | CC-BY or equivalent only |
| S-09 | At least one cross-department bridge | Automated: bridge registry check | Bidirectional preferred |
| S-10 | Bloom level Apply example for at least one concept | Automated: FIB exists check | Fill-in-the-blank with test assertion |
| S-11 | xAPI hooks present for all tracked interactions | Automated: hook exists check | opened-panel and executed-code minimum |
| S-12 | No Indigenous datasets without OCAP verification | Manual: CAPCOM review | Absolute constraint |

### Recommended Elements (LOG if missing)

| # | Element | Verification | Notes |
|---|---|---|---|
| R-01 | Study annotation for flagship concept | Manual | Full literate-programming treatment |
| R-02 | All 7 panel families for flagship concept | Automated | Cross-panel consistency verified |
| R-03 | Bloom scaffolding at all 6 levels for flagship | Automated | Remember through Create |
| R-04 | Target Practice exercise for at least one concept | Automated | Analyze-level guided exercise |
| R-05 | Department-specific xAPI profile extensions | Manual | Custom verbs beyond base vocabulary |

---

## 5. Concept-to-Dataset Mapping Workflow

The concept-to-dataset mapping workflow is the process by which each concept node is connected to relevant open datasets. It runs during the Scaffolded stage and must complete before the Seeded transition.

### Workflow Steps

```
CONCEPT-TO-DATASET MAPPING WORKFLOW
================================================================

  Step 1: ENUMERATE CONCEPTS
    Read the dependency graph.
    List all concept nodes that require dataset links.
    Output: concept_list.json

  Step 2: KEYWORD EXTRACTION
    For each concept, extract searchable keywords from:
    - Concept name and description
    - Mathematical formula terms
    - Cross-department bridge descriptions
    Output: concept_keywords.json

  Step 3: DATASET SEARCH
    For each keyword set, search:
    - CKAN (data.gov, data.europa.eu)
    - Zenodo (via REST API)
    - Domain portals (USDA, CERN, NIST per department)
    Output: candidate_datasets.json (ranked by relevance)

  Step 4: DATASET EVALUATION
    For each candidate, verify:
    - License is CC-BY or equivalent
    - Data format is parseable by at least one panel
    - Data vintage < 3 years (freshness)
    - Publisher is a recognized institution
    - No Indigenous data sovereignty concerns
    Output: approved_datasets.json

  Step 5: LINK CREATION
    For each approved dataset-concept pair:
    - Generate JSON-LD DatasetLink
    - Store in concept_node/datasets/refs.ts
    - Initialize version tracking record
    Output: dataset links committed to concept nodes

  Step 6: VERIFICATION
    Run automated checks:
    - All concepts have at least one link
    - All links have valid JSON-LD
    - All licenses verified
    - No broken URLs (HTTP HEAD check)
    Output: mapping_report.json
```

### Department-Specific Dataset Sources

| Department | Primary Sources | Secondary Sources |
|---|---|---|
| Mathematics | Zenodo, arXiv datasets, NIST StRD | OEIS (integer sequences), Papers With Code |
| Physics | CERN Open Data, NIST reference data | NASA datasets, LIGO Open Science |
| Cooking | USDA FoodData Central | WHO nutrition data, FAO food databases |
| Music | Zenodo MIR datasets | MusicBrainz, IMSLP (public domain scores) |
| Computer Science | Papers With Code, MLCommons | UCI ML Repository, Kaggle Datasets |
| Ecology | USGS BISON, iNaturalist, GBIF | NOAA, EPA, NatureServe |
| Statistics | NIST StRD, WHO health data | World Bank Open Data, Eurostat |

---

## 6. Cross-Department Link Registration API

The cross-department link registration API is the mechanism by which departments declare and validate connections between their concept nodes.

### API Specification

```
CROSS-DEPARTMENT LINK REGISTRATION API
================================================================

  POST /api/v1/bridges
  Content-Type: application/ld+json

  Request Body:
  {
    "@context": { "college": "https://college.gsd/vocab/" },
    "@type": "college:DepartmentBridge",
    "college:from": "college:math/exponential-decay",
    "college:to": "college:cooking/newtons-cooling",
    "college:bridgeType": "mathematical-basis",
    "college:description": "Both use N(t) = N0 * e^(-lambda*t)",
    "college:minimumBloom": "Apply",
    "college:bidirectional": true
  }

  Response (201 Created):
  {
    "@id": "college:bridge/math-cooking-decay-001",
    "college:status": "pending-validation",
    "college:validationChecks": [
      { "check": "from-exists", "status": "passed" },
      { "check": "to-exists", "status": "passed" },
      { "check": "bloom-achievable-both", "status": "passed" },
      { "check": "no-duplicate", "status": "passed" }
    ]
  }

  GET /api/v1/bridges?from=math/*
  Returns: All bridges originating from Math department

  GET /api/v1/bridges?type=mathematical-basis
  Returns: All mathematical-basis bridges across all departments

  DELETE /api/v1/bridges/{bridge-id}
  Requires: CAPCOM authorization
  Action: Archives bridge (does not delete; preserves audit trail)
```

### Validation Rules

The API validates each bridge registration against these rules:

1. **Endpoint existence:** Both `from` and `to` concept nodes must exist in their respective department dependency graphs.
2. **Bloom achievability:** The `minimumBloom` level must be achievable at both endpoints (i.e., both concepts must have panel expressions at that Bloom level or higher).
3. **No duplicates:** A bridge between the same two concepts with the same type cannot be registered twice.
4. **Bidirectional validity:** If `bidirectional` is true, both directions must independently satisfy all validation rules.
5. **Bridge type validity:** The `bridgeType` must be one of the registered types (mathematical-basis, application-of, analogy, prerequisite, extension).

### Bridge Type Taxonomy

| Type | Description | Direction | Example |
|---|---|---|---|
| `mathematical-basis` | Shared mathematical foundation | Bidirectional | Math decay <-> Cooking cooling |
| `application-of` | One concept applies the other | Directional | Stats distribution -> Physics error analysis |
| `analogy` | Structural similarity | Bidirectional | CPAN namespace <-> Department namespace |
| `prerequisite` | Cross-department dependency | Directional | Math trig -> Music frequency analysis |
| `extension` | Extends into new domain | Directional | Math set theory -> CS type theory |

---

## 7. Department Birth xAPI Statements

When a department transitions through lifecycle stages, the system emits xAPI statements that create an audit trail:

### Birth Statement Vocabulary

| Event | Verb IRI | Object | Extensions |
|---|---|---|---|
| Department proposed | `college.gsd/vocab/proposed-department` | Department ID | conceptCount, proposer |
| Department scaffolded | `college.gsd/vocab/scaffolded-department` | Department ID | graphEdges, panelCount |
| Department seeded | `college.gsd/vocab/seeded-department` | Department ID | checklistScore, datasetCount |
| Department published | `college.gsd/vocab/published-department` | Department ID | bloomCoverage, bridgeCount |
| Concept node added | `college.gsd/vocab/added-concept` | Concept Node ID | department, layer, panelCount |
| Bridge registered | `college.gsd/vocab/registered-bridge` | Bridge ID | fromDept, toDept, type |

These statements enable longitudinal analysis of department growth: how quickly do departments move from proposed to published? Which departments have the richest bridge networks? Which concepts attract the most dataset links?

---

## 8. Stale-Link Detection Skill

The stale-link detection skill is a scheduled GSD observation loop task that monitors all active dataset links for staleness.

### Detection Logic

```
STALE-LINK DETECTION -- OBSERVATION LOOP
================================================================

  Schedule: Weekly (configurable)

  For each active DatasetLink in all published departments:

    1. HTTP HEAD to dcat:accessURL
       ├── 200: Continue to step 2
       ├── 301/302: Update URL, flag "moved"
       ├── 404: Flag "broken", escalate to CAPCOM
       └── 429/5xx: Retry with backoff (max 3 retries)

    2. Compare dct:modified with stored DatasetVersion.lastModified
       ├── Same: Dataset unchanged, mark "fresh"
       ├── Different: Flag "updated", trigger re-validation
       └── Missing: Flag "no-timestamp", log warning

    3. Compare dct:license with stored DatasetVersion.licenseId
       ├── Same: License unchanged
       ├── Different: Flag "license-changed", escalate to CAPCOM
       └── Missing: Flag "no-license", escalate to CAPCOM

    4. Update DatasetVersion record
       ├── lastChecked = now()
       ├── httpStatus = response status
       ├── status = computed status (fresh/review/stale/broken)
       └── Emit xAPI statement if status changed

  Output for each changed link:
    xAPI statement with verb "flagged-stale" or "flagged-broken"
    CAPCOM notification if escalation required
    Concept node UI warning if learner-facing
```

### Threshold Configuration

| Parameter | Default | Description |
|---|---|---|
| `check_interval` | 7 days | How often to check each link |
| `stale_threshold` | 365 days | Max age before flagging "review" |
| `retry_count` | 3 | Max retries for transient failures |
| `retry_backoff` | 60 seconds | Initial backoff between retries |
| `broken_threshold` | 3 consecutive failures | When to escalate from "stale" to "broken" |

### Repair Escalation Path

When a stale or broken link is detected, the repair follows a three-stage escalation:

1. **Automated repair (for moved links):** If the URL returns 301/302, update the `dcat:accessURL` automatically and mark as "repaired."
2. **CAPCOM review (for updated or license-changed links):** The human reviewer verifies that the updated dataset is still appropriate for the concept node.
3. **Concept quarantine (for broken links with no alternative):** If no replacement dataset can be found, the concept node's real-data panels are disabled and fall back to embedded sample data, with a visible "data source unavailable" banner.

> **Related:** [GSD2 Architecture](../../../Research/GSD2/index.html), [ACE Compute Engine](../../../Research/ACE/index.html)

---

## 9. Quality Gates and CAPCOM Review

### CAPCOM Gate: Scaffolded to Seeded

Before a department transitions from Scaffolded to Seeded, the CAPCOM gate reviews:

1. All mandatory checklist items (S-01 through S-12) satisfied
2. No Indigenous data sovereignty concerns flagged
3. Dataset licenses verified manually (automated check confirmed by human)
4. Cross-department bridges reviewed for accuracy (the mathematical basis is actually shared, not just superficially similar)
5. At least one flagship concept has Study-tier annotation reviewed for pedagogical quality

### CAPCOM Gate: Seeded to Published

Before a department becomes visible to learners:

1. All xAPI hooks tested (fire correctly on interaction)
2. Freshness tracking initialized for all dataset links
3. At least one end-to-end learner pathway tested (root to leaf)
4. Panel code executes correctly with real data (not just sample data)
5. Bloom scaffolding verified at levels Remember, Apply, and Analyze minimum

---

## 10. Pilot Departments: Math and Cooking

The deep linking specification uses two pilot departments to demonstrate the full protocol.

### Math Department Pilot

The Math Department's eight-layer progression provides the canonical test case:

- **8 concept nodes** (Unit Circle through L-Systems)
- **Flagship concept:** Exponential decay (cross-department anchor)
- **Primary datasets:** Zenodo computational benchmarks, NIST StRD, CERN decay data
- **Cross-department bridges:** Math->Cooking (decay/cooling), Math->Music (Fourier/timbre), Math->Physics (all layers)
- **Target:** All 7 panel families for exponential decay, all 6 Bloom levels

### Cooking Department Pilot

The Cooking Department demonstrates deep linking in a non-STEM context:

- **Core concepts:** Newton's cooling, Maillard reaction kinetics, fermentation rate
- **Primary datasets:** USDA FoodData Central nutritional data, FAO food safety thresholds
- **Cross-department bridges:** Cooking->Math (cooling/decay), Cooking->Chemistry (Maillard), Cooking->Biology (fermentation)
- **Target:** Python + Perl panels for Newton's cooling, Bloom levels Remember through Apply

### Pilot Execution Sequence

```
PILOT SEEDING SEQUENCE
================================================================

  Week 1: Math Department
    Day 1-2: Scaffold structure, draft dependency graph
    Day 3-4: Dataset search and evaluation (Zenodo, NIST, CERN)
    Day 5: Link creation and verification
    Day 6: Panel expressions (7 panels for exponential decay)
    Day 7: Bloom scaffolding and annotation

  Week 2: Cooking Department
    Day 1-2: Scaffold structure, draft dependency graph
    Day 3-4: Dataset search (USDA, FAO)
    Day 5: Link creation and verification
    Day 6: Panel expressions (Python + Perl for Newton's cooling)
    Day 7: Cross-department bridge registration (Math <-> Cooking)

  Week 3: Integration Verification
    Day 1: End-to-end pathway testing (Math root to leaf)
    Day 2: Cross-department bridge traversal testing
    Day 3: xAPI statement verification (all hooks fire)
    Day 4: Freshness tracking initialization
    Day 5: CAPCOM review and publication
```

---

## 11. Cross-References

| Topic | Appears In | Related Projects |
|---|---|---|
| CPAN lineage | M5 | WAL, GSD2 |
| Department lifecycle | M5 | COK, FEG |
| Seeding checklist | M5 | COK, WAL |
| Dataset mapping workflow | M1, M5 | COK, FEG |
| Bridge registration API | M2, M5 | COK, FEG, SGM |
| Stale-link detection | M1, M5 | GSD2, ACE |
| CAPCOM gates | M5 | GSD2, PMG |
| Math pilot | M2, M4, M5 | MPC, SGM, COK |
| Cooking pilot | M4, M5 | COK, WAL |
| xAPI birth statements | M2, M5 | GSD2, ACE |

---

## 12. Sources

1. CPAN. *Comprehensive Perl Archive Network*. https://www.cpan.org
2. CKAN Project. *CKAN Open Source Data Portal Platform*. https://ckan.org
3. W3C. (2020). *Data Catalog Vocabulary (DCAT) -- Version 2*. https://www.w3.org/TR/vocab-dcat-2/
4. IEEE. (2023). *IEEE 9274.1.1-2023: Standard for Learning Technology -- xAPI*. https://xapi.com/
5. ADL Initiative. *xAPI Specification*. https://github.com/adlnet/xAPI-Spec
6. First Nations Information Governance Centre. *OCAP Principles*. https://fnigc.ca/ocap-training/
7. resources.data.gov. *DCAT-US Schema v1.1*. https://resources.data.gov/resources/dcat-us/
8. schema.org. *Dataset type specification*. https://schema.org/Dataset
9. USDA Agricultural Research Service. *FoodData Central*. https://fdc.nal.usda.gov
10. CERN. *CERN Open Data Portal*. https://opendata.cern.ch
11. Zenodo / CERN. *Open Research Data Repository*. https://zenodo.org
12. NIST. *Statistical Reference Datasets*. https://www.itl.nist.gov/div898/strd/
13. Foxglove, M.T. *The Space Between* (923 pp). https://tibsfox.com/media/The_Space_Between.pdf
14. Barba, L.A. et al. (2019). *Teaching and Learning with Jupyter*. https://jupyter4edu.github.io/jupyter-edu-book/
15. Farber, M., & Lamprecht, D. (2021). The data set knowledge graph. *Quantitative Science Studies*, 2(4), 1324-1355.
16. OpenAIRE. *European Open Science Infrastructure*. https://openaire.eu
