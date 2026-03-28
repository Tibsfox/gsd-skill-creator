# Learning Pathway Architecture

> **Domain:** Educational Technology
> **Module:** 2 -- xAPI, Learning Record Stores, and Concept Dependency Graphs
> **Through-line:** *The pathway through a forest is not drawn on a map before the forest exists -- it is worn into the ground by the feet of those who walk it.* The College's learning pathways are the same: the concept dependency graph defines the terrain, the xAPI statements record the footprints, and the LRS is the ground that holds the impressions. Over time, the most-walked paths become trails. The trails become the curriculum.

---

## Table of Contents

1. [The Invisible Pathway Problem](#1-the-invisible-pathway-problem)
2. [xAPI: The Experience API](#2-xapi-the-experience-api)
3. [College xAPI Statement Vocabulary](#3-college-xapi-statement-vocabulary)
4. [Learning Record Store Architecture](#4-learning-record-store-architecture)
5. [Concept Dependency Graphs](#5-concept-dependency-graphs)
6. [The Eight-Layer Mathematical Progression](#6-the-eight-layer-mathematical-progression)
7. [Bloom's Taxonomy in the College](#7-blooms-taxonomy-in-the-college)
8. [Zone of Proximal Development Engine](#8-zone-of-proximal-development-engine)
9. [Cross-Department Pathway Bridges](#9-cross-department-pathway-bridges)
10. [Pathway Discovery and Visualization](#10-pathway-discovery-and-visualization)
11. [Privacy and Learner Data Protection](#11-privacy-and-learner-data-protection)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. The Invisible Pathway Problem

The College of Knowledge's concept dependency graph exists implicitly in the mathematical foundations established by *The Space Between* -- the eight-layer progression from Unit Circle through L-Systems, the cross-domain connections between math and cooking and music. But implicit structure is invisible structure. A new learner entering the Math Department sees concept nodes but no path. A returning learner sees where they left off but not where the path leads. The dependency graph has no machine-readable expression that an xAPI LRS can track, an adaptive system can navigate, or a human can see.

```
THE INVISIBLE PATHWAY -- WHAT LEARNERS SEE TODAY
================================================================

  Math Department
  ┌──────────────────────────────────────────────┐
  │                                              │
  │  [Unit Circle]  [Trig]  [Vectors]  [Sets]   │
  │  [Pythagorean]  [Calc]  [Category] [L-Sys]  │
  │                                              │
  │  No edges. No ordering. No "you are here."   │
  │  No "this concept requires that concept."    │
  │  No tracking of what you've already learned. │
  └──────────────────────────────────────────────┘

  WHAT LEARNERS SHOULD SEE:
  ┌──────────────────────────────────────────────┐
  │                                              │
  │  [Unit Circle] ──> [Pythagorean] ──> [Trig] │
  │       │                                 │    │
  │       └─────────────> [Vectors] ──> [Calc]   │
  │                           │                  │
  │                      [Set Theory]            │
  │                           │                  │
  │                    [Category Theory]          │
  │                           │                  │
  │                      [L-Systems]             │
  │                                              │
  │  YOU ARE HERE: [Trig]  (Bloom: Apply)        │
  │  NEXT: [Vectors] (ZPD distance: 1)          │
  └──────────────────────────────────────────────┘
```

Making pathways visible requires three infrastructure layers: a tracking standard (xAPI), a storage system (LRS), and a graph format (JSON-LD concept dependency graph). This module specifies all three.

> **Related:** [Dataset Catalog Integration](01-dataset-catalog-integration.md), [Pedagogical Verbosity Engine](03-pedagogical-verbosity-engine.md), [GSD2 Architecture](../../../Research/GSD2/index.html)

---

## 2. xAPI: The Experience API

xAPI (Experience API, also known as Tin Can API) is the IEEE-approved standard for tracking learning experiences across platforms and contexts [1]. Ratified as IEEE 9274.1.1-2023, xAPI provides a JSON-based data model for recording learning statements that follow the "Actor + Verb + Object" pattern.

### The xAPI Statement Model

Every xAPI statement is a JSON object with this core structure:

```
{
  "actor": {
    "objectType": "Agent",
    "account": {
      "homePage": "https://college.gsd",
      "name": "learner-anon-7f3a"
    }
  },
  "verb": {
    "id": "https://college.gsd/vocab/executed-code",
    "display": { "en-US": "executed code" }
  },
  "object": {
    "objectType": "Activity",
    "id": "https://college.gsd/math/exponential-decay/panel/python",
    "definition": {
      "name": { "en-US": "Exponential Decay -- Python Panel" },
      "type": "https://college.gsd/vocab/activity-types/panel-expression"
    }
  },
  "result": {
    "success": true,
    "extensions": {
      "https://college.gsd/vocab/ext/bloom-level": "Apply",
      "https://college.gsd/vocab/ext/dataset-used": "10.5281/zenodo.XXXXXXX"
    }
  },
  "timestamp": "2026-03-27T14:30:00Z"
}
```

### xAPI vs. SCORM

The critical difference between xAPI and its predecessor SCORM (Sharable Content Object Reference Model) is context independence [1]:

| Capability | SCORM | xAPI |
|---|---|---|
| Tracking scope | Single LMS session | Any context, any platform |
| Statement format | Predefined CMI data model | Open verb/object vocabulary |
| Offline support | None | Queued statements |
| Cross-system tracking | Not possible | Core design feature |
| Custom extensions | Not supported | Unlimited via IRI extensions |
| Learner identity | LMS-managed | Agent-managed (privacy option) |

For the College, this means a learner who executes a panel expression in GSD-OS, reads a gloss annotation in the web UI, queries a linked Zenodo dataset via API, and then follows a cross-department link to the Cooking Department generates four distinct xAPI statements -- all flowing to the same LRS, all building the same learner profile.

### ADL Conformance Testing

The ADL (Advanced Distributed Learning) LRS Test Suite provides 1,300 specification conformance tests and issues certificates [2]. Before deploying any LRS for the College, the implementation must pass the full ADL Test Suite. This is non-negotiable: a non-conformant LRS may silently drop statements, mishandle timestamps, or corrupt extension data, making the learning record unreliable.

---

## 3. College xAPI Statement Vocabulary

The College must define its own xAPI Profile -- a standardized set of IRI-based verb and activity type definitions that prevent vocabulary fragmentation across departments [3]. The following vocabulary covers all tracked learning interactions:

### Verb Definitions

| Verb IRI (college.gsd/vocab/) | Human Label | Triggered When | Extensions |
|---|---|---|---|
| `opened-panel` | Opened Panel | Learner opens a Rosetta Panel expression | panelFamily, bloomLevel |
| `executed-code` | Executed Code | Learner runs a code cell in a panel | panelFamily, bloomLevel, datasetUsed |
| `queried-dataset` | Queried Dataset | Learner fetches or filters a linked dataset | datasetId, queryType |
| `completed-bloom-level` | Completed Bloom Level | Learner passes a Bloom-level checkpoint | bloomLevel, conceptNode, score |
| `navigated-pathway` | Navigated Pathway | Learner follows a concept dependency link | fromConcept, toConcept, edgeType |
| `bridged-department` | Bridged Department | Learner follows a cross-department link | fromDept, toDept, bridgeConcept |
| `annotated-code` | Annotated Code | Learner adds personal notes to a panel | panelFamily, annotationTier |
| `assessed-understanding` | Self-Assessed | Learner self-rates their comprehension | bloomLevel, confidence |

### Activity Type Definitions

| Activity Type IRI | Description | Example |
|---|---|---|
| `college.gsd/vocab/activity-types/panel-expression` | A Rosetta Panel code expression | Python panel for exponential decay |
| `college.gsd/vocab/activity-types/concept-node` | A College concept node | math/exponential-decay |
| `college.gsd/vocab/activity-types/dataset-query` | A query against a linked dataset | Zenodo API search |
| `college.gsd/vocab/activity-types/bloom-checkpoint` | A Bloom-level assessment point | Apply-level fill-in-the-blank |
| `college.gsd/vocab/activity-types/department-bridge` | A cross-department concept link | Math-to-Cooking decay bridge |

### Extension Definitions

| Extension IRI | Value Type | Description |
|---|---|---|
| `college.gsd/vocab/ext/bloom-level` | string (enum) | One of: Remember, Understand, Apply, Analyze, Evaluate, Create |
| `college.gsd/vocab/ext/panel-family` | string (enum) | One of: python, cpp, java, perl, lisp, pascal, fortran |
| `college.gsd/vocab/ext/dataset-used` | string (DOI) | DOI or URI of the dataset referenced in the interaction |
| `college.gsd/vocab/ext/concept-node` | string (path) | Department-relative path to the concept node |
| `college.gsd/vocab/ext/zpd-distance` | integer | Number of prerequisite edges between current frontier and target concept |

---

## 4. Learning Record Store Architecture

The Learning Record Store (LRS) is the server that receives, stores, and serves xAPI statements via HTTP [1]. The College's LRS must support the full xAPI statement lifecycle: statement ingestion, storage, querying, and aggregation.

### LRS Schema Design

```
LRS STORAGE SCHEMA -- COLLEGE OF KNOWLEDGE
================================================================

  Statement Store (primary):
    id:           UUID          -- xAPI statement ID
    actor_hash:   SHA-256       -- anonymized learner identifier
    verb_iri:     URI           -- verb IRI from College vocabulary
    object_id:    URI           -- activity IRI
    object_type:  ENUM          -- activity type from College vocabulary
    result_json:  JSONB         -- full result object (includes extensions)
    timestamp:    TIMESTAMPTZ   -- statement timestamp (learner-provided)
    stored:       TIMESTAMPTZ   -- server receipt timestamp
    context_json: JSONB         -- context object (department, session)
    authority:    JSONB         -- statement authority (which system sent it)

  Bloom Index (materialized view):
    actor_hash:   SHA-256
    concept_node: URI
    bloom_level:  ENUM (1-6)
    achieved_at:  TIMESTAMPTZ
    panel_family: ENUM
    dataset_used: URI (nullable)
    INDEX: (actor_hash, concept_node, bloom_level)

  Pathway Progress (materialized view):
    actor_hash:   SHA-256
    department:   string
    frontier:     URI[]          -- concept nodes at the learner's current edge
    completed:    URI[]          -- concept nodes with bloom_level >= Apply
    zpd_next:     URI[]          -- recommended next concepts (ZPD distance 1-3)
    last_active:  TIMESTAMPTZ
    INDEX: (actor_hash, department)
```

### Statement Ingestion Pipeline

The LRS ingestion pipeline processes incoming xAPI statements through four stages:

1. **Validation:** Statement structure validated against xAPI specification. Verb IRI checked against College vocabulary. Extension values type-checked.
2. **Anonymization:** Actor identifier hashed using SHA-256 before storage. Original identifier never persisted. This is the default behavior -- College learners are anonymous unless they explicitly opt in to identified tracking.
3. **Indexing:** Bloom-level and pathway-progress materialized views updated asynchronously.
4. **Notification:** If the statement represents a Bloom-level completion or a pathway transition, emit an event to the notification system for real-time UI updates.

### Query Patterns

The LRS must support these query patterns efficiently:

- **Learner profile:** "What has this learner completed in the Math Department?" -- Query Bloom Index by actor_hash and department.
- **Concept popularity:** "Which concept nodes are most visited?" -- Aggregate Statement Store by object_id.
- **Pathway analysis:** "What is the most common path through the Math Department?" -- Sequence analysis on Pathway Progress.
- **Dataset usage:** "Which datasets are actually used by learners?" -- Aggregate by dataset_used extension.

> **Related:** [ACE Compute Engine](../../../Research/ACE/index.html), [PMG Pi-Mono + GSD](../../../Research/PMG/index.html)

---

## 5. Concept Dependency Graphs

The concept dependency graph is the machine-readable representation of prerequisite relationships between concept nodes. It defines the terrain that learners navigate -- which concepts must be understood before others become accessible.

### JSON-LD Graph Format

The dependency graph uses JSON-LD with a custom vocabulary extending DCAT and SKOS (Simple Knowledge Organization System) [4]:

```
{
  "@context": {
    "skos": "http://www.w3.org/2004/02/skos/core#",
    "college": "https://college.gsd/vocab/",
    "dct": "http://purl.org/dc/terms/"
  },
  "@graph": [
    {
      "@id": "college:math/unit-circle",
      "@type": "college:ConceptNode",
      "skos:prefLabel": "Unit Circle",
      "college:department": "mathematics",
      "college:layer": 1,
      "college:bloomCeiling": "Create",
      "college:requires": [],
      "college:enables": [
        "college:math/pythagorean-theorem",
        "college:math/trigonometry"
      ]
    },
    {
      "@id": "college:math/pythagorean-theorem",
      "@type": "college:ConceptNode",
      "skos:prefLabel": "Pythagorean Theorem",
      "college:department": "mathematics",
      "college:layer": 2,
      "college:bloomCeiling": "Create",
      "college:requires": ["college:math/unit-circle"],
      "college:enables": ["college:math/trigonometry"]
    }
  ]
}
```

### Graph Properties

Each concept node in the dependency graph carries these properties:

| Property | Type | Description |
|---|---|---|
| `college:department` | string | Owning department |
| `college:layer` | integer | Position in the progression (1-8 for Math) |
| `college:bloomCeiling` | BloomLevel | Highest Bloom level achievable at this concept |
| `college:requires` | URI[] | Prerequisite concept nodes (incoming edges) |
| `college:enables` | URI[] | Dependent concept nodes (outgoing edges) |
| `college:crossDept` | URI[] | Cross-department bridge targets |
| `college:datasets` | URI[] | Linked dataset references (from Module A) |

### Graph Validation Rules

The dependency graph must satisfy these structural constraints:

1. **Acyclicity:** The `requires` relation must form a directed acyclic graph (DAG). No concept can be its own prerequisite, directly or transitively.
2. **Layer ordering:** If concept A requires concept B, then A's layer must be greater than or equal to B's layer.
3. **Root existence:** Every department must have at least one concept with an empty `requires` array (an entry point).
4. **Reachability:** Every concept in a department must be reachable from at least one root node.

---

## 6. The Eight-Layer Mathematical Progression

The mathematical progression from *The Space Between* provides the canonical dependency graph for the Math Department [5]. It defines eight layers, each representing a conceptual leap that builds on the previous:

```
THE EIGHT-LAYER MATHEMATICAL PROGRESSION
================================================================

  Layer 1: UNIT CIRCLE
    The foundation. Every trigonometric function, every rotation,
    every periodic phenomenon traces back to a point moving on a
    circle of radius 1. This is where the College begins.

  Layer 2: PYTHAGOREAN THEOREM
    The relationship between the sides of a right triangle.
    Emerges naturally from the unit circle: x^2 + y^2 = 1.

  Layer 3: TRIGONOMETRY
    The functions that describe the unit circle's coordinates:
    sin, cos, tan, and their reciprocals. The bridge between
    geometry and analysis.

  Layer 4: VECTOR CALCULUS
    Extending trigonometric functions into multi-dimensional
    spaces. Gradients, divergence, curl -- the language of fields.

  Layer 5: SET THEORY
    The formalization of collections. The foundation for
    mathematical rigor: membership, union, intersection, power sets.

  Layer 6: CATEGORY THEORY
    The mathematics of mathematical structure itself.
    Functors, natural transformations, adjunctions.
    The most abstract layer before application.

  Layer 7: INFORMATION SYSTEMS THEORY
    Shannon entropy, channel capacity, error correction.
    Where mathematics meets communication.

  Layer 8: L-SYSTEMS
    Lindenmayer systems: formal grammars that generate
    fractal structures. Where mathematics meets biology.
    The final layer: mathematics generates life.
```

### Dependency Edges

The eight-layer progression defines these mandatory dependency edges:

| From | To | Edge Type | Rationale |
|---|---|---|---|
| Unit Circle | Pythagorean Theorem | requires | x^2 + y^2 = 1 is the unit circle equation |
| Unit Circle | Trigonometry | requires | Trig functions are unit circle coordinates |
| Pythagorean Theorem | Trigonometry | requires | Trig identities derive from Pythagorean theorem |
| Trigonometry | Vector Calculus | requires | Vectors use trig for direction representation |
| Vector Calculus | Set Theory | enables | Set theory formalizes the spaces vectors live in |
| Set Theory | Category Theory | requires | Category theory abstracts set-theoretic structure |
| Category Theory | Information Systems | enables | Information theory uses categorical frameworks |
| Information Systems | L-Systems | enables | L-Systems apply information-theoretic concepts to biological growth |

---

## 7. Bloom's Taxonomy in the College

Bloom's taxonomy provides the six-level cognitive ladder that the College uses to scaffold learning progression within each concept node [6]:

| Level | Name | Cognitive Action | College Expression |
|---|---|---|---|
| 1 | Remember | Recall facts and basic concepts | Read-only panel, no modification |
| 2 | Understand | Explain ideas or concepts | Panel with worked example and explanation |
| 3 | Apply | Use information in new situations | Fill-in-the-blank panel with test assertion |
| 4 | Analyze | Draw connections among ideas | Panel with data exploration scaffold |
| 5 | Evaluate | Justify a stand or decision | Comparative panels (two approaches) |
| 6 | Create | Produce new or original work | Empty panel with specification only |

### Bloom-Level Tracking in xAPI

Every panel interaction generates an xAPI statement with a `bloom-level` extension. The LRS's Bloom Index tracks the highest achieved level per concept per learner:

```
BLOOM PROGRESSION TRACKING
================================================================

  Learner: anon-7f3a
  Concept: math/exponential-decay

  Time   Action                          Bloom  Recorded
  ─────  ──────────────────────────────  ─────  ────────
  14:00  Opened Python panel (read-only)   1    Remember
  14:05  Ran worked example                2    Understand
  14:15  Completed fill-in-the-blank       3    Apply     <-- current
  14:30  Started data exploration           4    (in progress)

  Frontier: Apply (level 3)
  Next suggested: Analyze (level 4) -- data exploration scaffold
```

### Jupyter Research on Bloom Scaffolding

Research from Berkeley's Teaching and Learning with Jupyter project establishes that executable notebook environments are specifically effective at moving learners from lower Bloom levels (Remember, Understand, Apply) to upper levels (Analyze, Evaluate, Create) [7]. A study of mechanical engineering thermodynamics courses found that students completing a full CFD module in Jupyter notebooks in two days matched five weeks of traditional classroom instruction [8].

The College's Rosetta Panels are structurally equivalent to Jupyter cells: executable code with narrative context. The Bloom scaffolding research applies directly.

---

## 8. Zone of Proximal Development Engine

Vygotsky's Zone of Proximal Development (ZPD) defines the optimal learning difficulty: concepts a learner cannot yet grasp alone but can reach with appropriate scaffolding [9]. The College's dependency graph encodes ZPD implicitly through prerequisite edges.

### ZPD Distance Calculation

ZPD distance is the number of unsatisfied prerequisite edges between a learner's current frontier and a target concept:

```
ZPD DISTANCE CALCULATION
================================================================

  Learner frontier: {unit-circle: Apply, pythagorean: Understand}

  Target: trigonometry
    Requires: unit-circle (satisfied at Apply >= Apply), pythagorean (satisfied at Understand >= Remember)
    Unsatisfied prerequisites: 0
    ZPD distance: 0 (ready to attempt)

  Target: vector-calculus
    Requires: trigonometry (not yet attempted)
    ZPD distance: 1 (one prerequisite away)

  Target: category-theory
    Requires: set-theory (not attempted) <- vector-calc (not attempted) <- trig (not attempted)
    ZPD distance: 3 (three prerequisites away)
```

### Pathway Recommendation Algorithm

The ZPD engine recommends concepts using this priority ordering:

1. **ZPD distance 0, Bloom ceiling not reached:** Concepts the learner can attempt right now and has room to grow. Highest priority.
2. **ZPD distance 1:** Concepts one prerequisite edge away. The learner needs one more concept before these become accessible.
3. **ZPD distance 2-3:** Visible but not yet reachable. Shown as "upcoming" to give learners a sense of direction.
4. **ZPD distance > 3:** Hidden by default. Too far ahead to be motivating.

### Cross-Department ZPD

When a concept node has cross-department prerequisites, the ZPD calculation spans departments. The exponential decay concept in the Cooking Department (`cooking/newtons-cooling`) requires the Math Department's `math/exponential-decay` at Bloom level Apply. If the learner has not reached Apply in the Math concept, the Cooking concept shows a "bridge prerequisite" indicator with a link to the Math Department.

> **Related:** [SGM Sacred Geometry](../../../Research/SGM/index.html), [MPC Math Co-Processor](../../../Research/MPC/index.html)

---

## 9. Cross-Department Pathway Bridges

Cross-department bridges are the deep links that connect concepts across departmental boundaries. They are the College's mechanism for expressing that Fourier transforms in Math and timbre analysis in Music share a mathematical basis.

### Bridge Registration

A cross-department bridge is registered as a JSON-LD link between two concept nodes in different departments:

```
{
  "@context": {
    "college": "https://college.gsd/vocab/"
  },
  "@type": "college:DepartmentBridge",
  "college:from": "college:math/exponential-decay",
  "college:to": "college:cooking/newtons-cooling",
  "college:bridgeType": "mathematical-basis",
  "college:description": "Both concepts use N(t) = N0 * e^(-lambda*t)",
  "college:minimumBloom": "Apply",
  "college:bidirectional": true,
  "dct:created": "2026-03-27"
}
```

### Bridge Types

| Bridge Type | Description | Example |
|---|---|---|
| `mathematical-basis` | Shared mathematical foundation | Exponential decay in Math and Cooking |
| `application-of` | One concept applies the other | Fourier transform applied to timbre analysis |
| `analogy` | Structural similarity without shared math | CPAN namespace and department namespace |
| `prerequisite` | Cross-department dependency | Stats required for Physics error analysis |
| `extension` | One concept extends the other into a new domain | Set theory extended by category theory |

### Bridge Validation Rules

Cross-department bridges must satisfy:

1. Both endpoints must exist in the dependency graph.
2. The `minimumBloom` level must be achievable at both endpoints.
3. If `bidirectional` is true, both directions must be independently valid.
4. Bridge creation generates a `bridged-department` xAPI statement for audit.

---

## 10. Pathway Discovery and Visualization

The dependency graph, Bloom tracking, and ZPD engine combine to produce three visualization layers for learners:

### Department Map

A visual representation of all concept nodes in a department, with edges showing prerequisite relationships. Nodes are color-coded by Bloom level achieved (gray = not started, blue = Remember/Understand, green = Apply/Analyze, gold = Evaluate/Create).

### Progress Trail

A linear representation of the learner's path through a department, showing completed concepts, current concept, and recommended next steps. The trail is personalized -- two learners may see different recommended paths based on their different prerequisite completions.

### Bridge Map

A cross-department view showing all active bridges from the current concept. Each bridge shows the target department, target concept, bridge type, and the learner's readiness (whether prerequisites are met).

---

## 11. Privacy and Learner Data Protection

### Anonymization by Default

All learner identifiers are hashed (SHA-256) before LRS storage. The original identifier is never persisted. This is the default behavior for all College interactions [10].

### FERPA and GDPR Compliance

The LRS schema is designed for compliance with both FERPA (US) and GDPR (EU) requirements:

- **Data minimization:** Only the minimum data needed for pathway tracking is stored. No demographic data, no device fingerprints, no IP addresses.
- **Right to deletion:** The `actor_hash` field enables complete deletion of a learner's records without affecting aggregate statistics (which are computed from anonymized data).
- **Consent:** The College's xAPI tracking is opt-in. Learners who do not consent to tracking can still access all content; they simply do not receive personalized pathway recommendations.
- **Data portability:** Learners can export their complete xAPI statement history in standard JSON format.

### Trust System Integration

The College's learner data privacy aligns with the broader trust system design: trust relationships are private, owned by the participants, never aggregated without consent. The LRS stores learning records, not social graphs. Who knows whom, who trusts whom -- that belongs to a different system entirely, and the two must never be joined.

> **Related:** [GSD2 Architecture](../../../Research/GSD2/index.html), [WAL Weird Al](../../../Research/WAL/index.html)

---

## 12. Cross-References

| Topic | Appears In | Related Projects |
|---|---|---|
| xAPI specification | M2, M4, M5 | GSD2, ACE, PMG |
| Bloom's taxonomy | M2, M3, M4 | COK, WAL, SGM |
| Concept dependency graph | M2, M5 | MPC, SGM |
| Eight-layer progression | M2, M3 | MPC, COK |
| ZPD engine | M2, M4 | COK, WAL |
| LRS schema | M2, M5 | GSD2, ACE |
| Cross-department bridges | M2, M5 | COK, FEG |
| Learner privacy | M2 | GSD2, ACE |
| JSON-LD encoding | M1, M2 | FEG, SGM |
| SKOS vocabulary | M2, M5 | WAL, COK |

---

## 13. Sources

1. IEEE. (2023). *IEEE 9274.1.1-2023: Standard for Learning Technology -- xAPI*. https://xapi.com/
2. ADL Initiative. *xAPI Specification*. https://github.com/adlnet/xAPI-Spec
3. ADL Initiative. *xAPI Profiles*. https://profiles.adlnet.gov/
4. W3C. (2009). *SKOS Simple Knowledge Organization System Reference*. W3C Recommendation. https://www.w3.org/TR/skos-reference/
5. Foxglove, M.T. *The Space Between* (923 pp). https://tibsfox.com/media/The_Space_Between.pdf
6. Anderson, L.W., & Krathwohl, D.R. (Eds.). (2001). *A Taxonomy for Learning, Teaching, and Assessing: A Revision of Bloom's Taxonomy of Educational Objectives*. Longman.
7. Barba, L.A. et al. (2019). *Teaching and Learning with Jupyter*. Open handbook, George Washington University. https://jupyter4edu.github.io/jupyter-edu-book/
8. Moriyama, C. (2020). Climbing Bloom's Taxonomy with Jupyter Notebooks: Experiences in Mechanical Engineering. *Engineering Archive*. https://engrxiv.org/preprint/view/869
9. Vygotsky, L.S. (1978). *Mind in Society: The Development of Higher Psychological Processes*. Harvard University Press.
10. U.S. Department of Education. *FERPA General Guidance for Students*. https://studentprivacy.ed.gov/
11. European Parliament. (2016). *General Data Protection Regulation (GDPR)*. Regulation (EU) 2016/679.
12. ADL Initiative. *LRS Conformance Test Suite*. https://lrs.adlnet.gov/
13. Rustici Software. *xAPI.com*. https://xapi.com
14. W3C. (2020). *JSON-LD 1.1*. W3C Recommendation. https://www.w3.org/TR/json-ld11/
15. IMS Global. (2019). *Caliper Analytics Specification*. https://www.imsglobal.org/caliper (comparison reference)
16. Bakharia, A. et al. (2016). A conceptual framework linking learning design with learning analytics. *LAK '16*.
