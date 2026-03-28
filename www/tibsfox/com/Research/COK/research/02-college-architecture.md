# College Architecture

> **Domain:** Curriculum Infrastructure
> **Module:** 2 -- Department Structure, Rosetta Panels, and the .college/ Directory
> **Through-line:** *Skill-creator is not a tool that has a translation capability. It is a translation engine. The Rosetta Core -- the ability to take a concept and express it in any language, any medium, any form the learner needs -- is the spark that makes the whole system alive. Everything else is projection.*

---

## Table of Contents

1. [The Rosetta Core Identity](#1-the-rosetta-core-identity)
2. [The Seven Rosetta Panels](#2-the-seven-rosetta-panels)
3. [Complex Plane Routing Logic](#3-complex-plane-routing-logic)
4. [The CPAN Lineage](#4-the-cpan-lineage)
5. [Three-Tier Knowledge Organization](#5-three-tier-knowledge-organization)
6. [Department / Wing / Concept Hierarchy](#6-department-wing-concept-hierarchy)
7. [The .college/ Directory Schema](#7-the-college-directory-schema)
8. [Department Registration and Discovery](#8-department-registration-and-discovery)
9. [Fascicle Lifecycle Model](#9-fascicle-lifecycle-model)
10. [Mathematics Department: The Reference Seed](#10-mathematics-department-the-reference-seed)
11. [Knuth Difficulty Rails](#11-knuth-difficulty-rails)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. The Rosetta Core Identity

The fundamental insight from the Cooking with Claude session was architectural, not culinary: skill-creator should not *have* a translation capability -- it should *be* a translation engine. This is the distinction between a feature and an identity. The Rosetta Core is what makes the system alive [1].

Three historical Rosetta patterns confirm the architectural validity:

- **The Rosetta Stone** (196 BCE): Same message in three scripts. If you can read one, you decode the others. The key principle: comparative expression reveals structure.
- **Rosetta Code** (2007-present): Same programming tasks in hundreds of languages side by side. Demonstrates that concept-invariant, language-variant expression is learnable at scale.
- **Claude** (AI): Natively works across dozens of human and programming languages simultaneously. The translation engine already exists -- the College gives it a home [2].

The Rosetta Core is the bus that connects every chip in the College's Amiga-inspired architecture. Without it, departments are filing cabinets. With it, they are resonating chambers that amplify each other's signal.

---

## 2. The Seven Rosetta Panels

Seven panel families, organized by epistemic distance from machine hardware:

| Family | Languages | Pedagogical Focus |
|--------|-----------|------------------|
| Systems | Python, C++, Java | Direct computation; standard library access; performance-visible |
| Bridge | Perl | Designed by a linguist; regex as first-class syntax; CPAN ecosystem as knowledge catalog model; text/NLP concepts |
| Heritage | Lisp, Fortran, Pascal | Foundational paradigms; Lisp homoiconicity (code = data); Fortran for scientific computing; Pascal designed for pedagogy |
| Hardware | VHDL | Concepts expressed as circuits; ties to GSD chipset architecture |
| Data Infrastructure | CKAN, XML, SGML, UML | Knowledge cataloging, structured markup, modeling lineage |
| Mathematical | LaTeX, APL | Formal notation; symbol density; typesetting connection to *The Space Between* |
| Natural Language | Markdown, POD | Literate programming; code as curriculum |

The Perl bridge panel is uniquely positioned on the Complex Plane: it spans systems and heritage families. Designed by a trained linguist (Larry Wall), Perl's syntax encodes Huffman coding (common operations are concise), context sensitivity, and TMTOWTDI ("There's More Than One Way To Do It") -- the Rosetta principle expressed as language philosophy [3].

Each panel family has a TypeScript interface contract:

```
// panel.ts -- Rosetta Panel interface
interface RosettaPanel {
  family: PanelFamily;
  language: string;
  express(concept: RosettaConcept): PanelExpression;
  validate(expression: PanelExpression): ValidationResult;
  difficulty(concept: RosettaConcept): KnuthRating;
}

type PanelFamily =
  | 'systems'
  | 'bridge'
  | 'heritage'
  | 'hardware'
  | 'data-infra'
  | 'mathematical'
  | 'natural-language';
```

All seven panels implement this contract. The interface is the shared type that prevents cross-panel drift [4].

---

## 3. Complex Plane Routing Logic

Panel selection follows the concept's position on the Complex Plane of Experience. The routing algorithm maps angular position to panel priority:

| Concept Position | Primary Panel | Secondary Panel | Rationale |
|-----------------|--------------|----------------|-----------|
| Concrete + Logical (Q1) | Systems (Python, C++, Java) | Hardware (VHDL) | Direct computation, measurable output |
| Concrete + Creative (Q2) | Natural Language (Markdown) | Systems (Python) | Experiential expression, prototyping |
| Abstract + Creative (Q3) | Heritage (Lisp) | Mathematical (LaTeX) | Code-as-data, formal notation |
| Abstract + Logical (Q4) | Heritage (Fortran) | Mathematical (APL) | Scientific computing, symbol density |
| Text / NLP domain | Bridge (Perl) | Natural Language | Linguistic structure, regex, text processing |
| Hardware / structural | Hardware (VHDL) | Systems (C++) | Circuit-level expression |
| Knowledge organization | Data Infrastructure | Natural Language | Catalog and markup |

The routing algorithm computes a priority vector for all seven families based on the concept's (theta, r) position, then sorts by priority. The primary panel gets the first expression attempt; secondary panels provide comparative depth [5].

```
PANEL ROUTING -- ANGULAR POSITION MAP
================================================================

                  90 deg (Concrete)
                       |
      Markdown/POD     |     Python/C++/Java
      (Nat. Lang.)     |     (Systems)
                       |
  180 deg ─────────────+───────────── 0 deg (Logic)
  (Creative)           |
                       |
      Lisp/LaTeX       |     Fortran/APL
      (Heritage/Math)  |     (Heritage/Math)
                       |
                  270 deg (Abstract)

  Perl (Bridge) overlays the full plane -- activated by
  text/NLP domain tag regardless of angular position.
```

---

## 4. The CPAN Lineage

The College Structure did not emerge from a vacuum. Its direct intellectual ancestor is CPAN (1995), which established the architectural patterns governing every major knowledge ecosystem since:

| CPAN Component | College Equivalent | Principle |
|---------------|-------------------|-----------|
| PAUSE upload server | Contribution Pipeline | Human-reviewed ingestion with namespace protection |
| CPAN Index | Concept Registry | Canonical mapping of names to locations |
| Module namespaces | Department/Wing/Concept hierarchy | Hierarchical knowledge organization |
| META.yml | RosettaConcept metadata | Structured metadata: dependencies, version, description |
| CPAN Testers | Calibration Engine gates | Automated cross-environment quality assurance |
| Mirror network | Progressive disclosure tiers | Distributed, cached copies at multiple fidelity levels |
| BackPAN (archive) | Delta Store | Complete history retained, nothing truly deleted |
| Developer releases | Observation pipeline (draft) | Tentative knowledge that doesn't pollute the index |
| perldoc viewer | College Loader's explore() | Browse knowledge without modifying it |
| POD embedded docs | Code-as-curriculum | Documentation lives with the code it describes |
| Dependency resolution | Concept prerequisite loading | Load what you need, resolve chains automatically |

CPAN's 220,000+ modules demonstrate the ecosystem architecture at knowledge scale: developer releases (pre-fascicle) to indexed releases (fascicle) to stable distributions (volume). This maps exactly to the College's knowledge lifecycle [6].

CKAN (Comprehensive Knowledge Archive Network) provides 20 years of proven open data infrastructure: catalog-based discovery, metadata standards, namespace coordination, permission grants enabling collaboration without chaos. Its architecture is the direct model for the `.college/` discovery index [7].

---

## 5. Three-Tier Knowledge Organization

The College Structure inherited the "cookbook" three-tier pattern from Numerical Recipes (Press et al., 1992) and refined it for executable knowledge:

| Tier | Name | Contents |
|------|------|----------|
| Tier 1 | Pedagogical Annotation | Why this concept matters; connections to other concepts; historical context |
| Tier 2 | Panel Expressions | 7 Rosetta panel implementations (one per family) |
| Tier 3 | Calibration Profiles | Known good parameters; feedback-refined defaults; edge case handling |

Every concept node in the College carries all three tiers. Tier 1 is human-readable context. Tier 2 is machine-executable expression. Tier 3 is the feedback loop that connects them -- the Observe-Compare-Adjust-Record pattern that makes the concept alive [8].

This three-tier structure is self-similar: it appears at every scale. A Department has pedagogical annotations (why this field matters), panel expressions (how the department's core concepts map to languages), and calibration profiles (what difficulty level to start at). A Wing within a department has the same three tiers. A single concept node has the same three tiers. Fractal architecture [9].

---

## 6. Department / Wing / Concept Hierarchy

The College's knowledge hierarchy has three levels:

```
DEPARTMENT (e.g., Mathematics)
  ├── WING (e.g., Trigonometry)
  │     ├── CONCEPT NODE (e.g., Unit Circle)
  │     │     ├── Tier 1: Pedagogical Annotation
  │     │     ├── Tier 2: 7 Panel Expressions
  │     │     └── Tier 3: Calibration Profile
  │     ├── CONCEPT NODE (e.g., Fourier Transform)
  │     └── CONCEPT NODE (e.g., Sine/Cosine)
  ├── WING (e.g., Algebra)
  ├── WING (e.g., Calculus)
  ├── WING (e.g., Statistics)
  ├── WING (e.g., Complex Analysis)
  └── WING (e.g., Geometry)
```

Each level has a (theta, r) position on the Complex Plane. The Department's position is the centroid of its Wings. Each Wing's position is the centroid of its Concept Nodes. This ensures hierarchical consistency: a Mathematics Department at theta = 5.5 (Abstract + Logical quadrant) will have Wings whose positions cluster around that angle [10].

---

## 7. The .college/ Directory Schema

The `.college/` directory sits at the root of the gsd-skill-creator repository and contains the complete College Structure:

```
.college/
  ├── core/
  │     ├── rosetta/           <- Translation engine (THE SPARK)
  │     ├── calibration/       <- Observe-Compare-Adjust-Record pattern
  │     └── panels/            <- 7 language families
  │          ├── systems/      <- Python, C++, Java
  │          ├── bridge/       <- Perl
  │          ├── heritage/     <- Lisp, Fortran, Pascal
  │          ├── hardware/     <- VHDL
  │          ├── data-infra/   <- CKAN/SGML/XML family
  │          ├── mathematical/ <- LaTeX, APL
  │          └── natural-lang/ <- Markdown, POD
  │
  ├── departments/
  │     ├── mathematics/       <- Seeded: "The Space Between" (923pp)
  │     ├── culinary-arts/     <- Seeded: "Cooking with Claude"
  │     ├── mind-body/         <- Seeded: Kung Fu / Tai Chi packs
  │     ├── computer-science/  <- IS the Rosetta Core (self-seeding)
  │     ├── music-audio/       <- Seeded: Deep Audio Analyzer mission
  │     ├── literature/        <- Seeded: "The Hundred Voices" (733pp)
  │     ├── philosophy/        <- Seeded: "The Quark and the Compiler"
  │     ├── natural-sciences/  <- Seeded: PNW Taxonomy / Foxfire Heritage
  │     └── economics-work/    <- Seeded: Wasteland / Fox Infrastructure
  │
  └── fractal-engine/          <- Generative grammar for new departments
       ├── seed-ingestor.ts
       ├── panel-generator.ts
       ├── calibration-installer.ts
       └── department-scaffold.ts
```

Every Department directory contains a `department.json` file (see Section 8) and a `wings/` subdirectory. Every Wing directory contains a `wing.json` file and a `concepts/` subdirectory. The structure is recursively self-similar [11].

---

## 8. Department Registration and Discovery

Each department registers with the discovery index via a typed JSON file:

```
// department.json -- registration metadata
{
  "id": "mathematics",
  "name": "Mathematics Department",
  "version": "0.1.0",
  "lifecycle": "fascicle",
  "seed_texts": ["The Space Between (923pp)"],
  "wings": ["algebra", "geometry", "calculus", "statistics",
            "complex-analysis", "trigonometry"],
  "panels_implemented": 7,
  "concept_nodes": 0,
  "calibration_loops": 0,
  "cross_dept_links": [],
  "plane_position": { "theta": 5.5, "r": 0.8 },
  "rosetta_entry_point": "./core/index.ts"
}
```

The discovery index is a flat JSON array of all registered department.json references, validated at build time by TypeScript type-checking. Zero errors is a hard gate for Wave 3 publication [12].

---

## 9. Fascicle Lifecycle Model

Knuth's fascicle publication model for TAOCP Volume 4 provides the lifecycle pattern for College Departments. Chapters released as standalone 128-page paperbacks before collection into hardcover volumes. This maps exactly to the College's knowledge lifecycle:

```
// lifecycle.ts
export enum DepartmentLifecycle {
  SEED         = 'seed',          // Primary text identified, not yet ingested
  PRE_FASCICLE = 'pre-fascicle',  // Concept graph extracted, panels not populated
  FASCICLE     = 'fascicle',      // 1+ wings complete with full 7-panel expression
  VOLUME       = 'volume'         // All wings complete; calibration loops active
}
```

A Department begins as a SEED -- a primary text has been identified (e.g., *The Space Between* for Mathematics). It advances to PRE_FASCICLE when the seed ingestor extracts its concept graph. It becomes a FASCICLE when at least one Wing has full 7-panel expression. It reaches VOLUME when all Wings are complete and calibration loops are active [13].

---

## 10. Mathematics Department: The Reference Seed

The Mathematics Department is the first fully seeded department, serving as the reference implementation for all subsequent departments. Its seed text is *The Space Between* (923 pages, Miles Tiberius Foxglove).

### Wing Catalog

| Wing | Seed Concept | Plane Position | Cross-Dept Links |
|------|-------------|----------------|-----------------|
| Algebra | Complex numbers | theta=5.8, r=0.7 | Philosophy (logic structures), CS (type theory) |
| Geometry | Unit circle | theta=5.5, r=0.9 | Mind-Body (rotation), Music (wave), Architecture |
| Calculus | Exponential decay | theta=5.3, r=0.8 | Culinary (cooling), Ecology (population), Physics |
| Statistics | Normal distribution | theta=0.3, r=0.7 | Calibration engine (error modeling), Economics |
| Complex Analysis | Mandelbrot set | theta=5.0, r=0.6 | Fractal engine (self-similarity), Visual arts |
| Trigonometry | Fourier transform | theta=5.5, r=0.85 | Music (harmonics), Physics, Signal processing |

The unit circle is the department's seed crystal: maximally cross-panel (expressible in Python with `math.sin`, in C++ with `cmath`, in Fortran with `DSIN`, in Lisp as recursive series expansion, in VHDL as CORDIC algorithm, in APL as the circle operator, in LaTeX as diagram) and maximally cross-department (appears in music as wave function, in culinary arts as oven temperature oscillation, in martial arts as rotation mechanics) [14].

---

## 11. Knuth Difficulty Rails

Knuth's TAOCP exercise difficulty system provides the precision progressive disclosure model:

| Rating | Meaning | College Application |
|--------|---------|-------------------|
| 00 | Extremely easy | Vocabulary introduction; single-panel orientation |
| 10 | Simple, one minute | Single-concept, one-panel expression |
| 20 | Average, 15-20 min | Cross-panel comparison; two or three families |
| 30 | Moderately hard | Full 7-panel expression; calibration loop active |
| 40 | Quite difficult | Cross-department links; synthesis required |
| 50 | Open research | Novel concept integration; fractal expansion trigger |

The difficulty rating maps directly to radius on the Complex Plane. Rating 00 concepts sit near the origin (r ~ 0.1). Rating 50 concepts sit on or beyond the unit circle (r >= 1.0). This geometric interpretation means difficulty is not an arbitrary label -- it is a measurable distance from the center of the plane [15].

---

## 12. Cross-References

> **Related:** [Complex Plane Foundations](01-complex-plane-foundations.md) -- The mathematical coordinate system that drives panel routing. [Deep Linking Engine](03-deep-linking-engine.md) -- Cross-department concept pointers use architecture metadata. [Retrospective and Lessons Learned](05-retrospective-lessons-learned.md) -- Friction-to-pattern registry documents architectural evolution.

**Cross-project references:**

| Topic | Appears In | Related Projects |
|-------|-----------|-----------------|
| Rosetta Core translation | M2, M3, M6 | WAL (Rosetta 7-cluster), GSD2 (skill architecture) |
| CPAN architecture | M2, M5 | WAL (Perl bridge), ACE (package management) |
| Panel interface contracts | M2, M4, M6 | MPC (math panels), SGM (signal panels) |
| Department registration | M2, M4 | GSD2, BNY (agent registration patterns) |
| Knuth difficulty scale | M2, M5 | OTM (complexity metrics), MPC |
| .college/ directory | M2, M5, M6 | GSD2 (repo structure), WAL (Rosetta framework) |

---

## 13. Sources

1. Tibsfox (2026). *cooking-with-claude-compiled-session.md.* GSD Skill-Creator Project. College Structure specification and Rosetta Core identity insight.
2. Parkinson, R.B. (1999). *Cracking Codes: The Rosetta Stone and Decipherment.* British Museum Press.
3. Wall, L., Christiansen, T., and Orwant, J. (2000). *Programming Perl.* 3rd ed. O'Reilly. Language design as linguistic principle.
4. Tibsfox (2026). *College of Knowledge Mission Package (college_of_knowledge.tex).* Panel interface TypeScript contract specification.
5. Foxglove, M.T. (Tibsfox). *The Space Between.* 923 pp. Complex Plane routing logic (Chapter 8).
6. Manley, J. and Christiansen, T. (1995-present). CPAN (Comprehensive Perl Archive Network). https://www.cpan.org. 220,000+ modules; ecosystem architecture precedent.
7. CKAN Project (2006-present). https://ckan.org. Open data infrastructure architecture.
8. Press, W.H. et al. (1992). *Numerical Recipes in C: The Art of Scientific Computing.* Cambridge University Press. Three-tier knowledge organization pattern.
9. Mandelbrot, B.B. (1982). *The Fractal Geometry of Nature.* W.H. Freeman. Self-similarity as architectural principle.
10. Tibsfox (2026). *gsd-mathematical-foundations-conversation.md.* Hierarchical knowledge organization via plane coordinates.
11. Tibsfox (2026). *College of Knowledge Mission Package (college_of_knowledge.tex).* Directory schema specification.
12. Tibsfox (2026). *gsd-skill-creator-analysis.md.* TypeScript type-checking as validation gate.
13. Knuth, D.E. (2005-present). *The Art of Computer Programming, Vol. 4: Combinatorial Algorithms.* Fascicle publication model.
14. Tibsfox (2026). *unit-circle-skill-creator-synthesis.md.* Unit circle as maximally cross-panel seed crystal.
15. Knuth, D.E. (1997). *The Art of Computer Programming, Vol. 1.* 3rd ed. Addison-Wesley. Exercise difficulty rating system (00-50).
16. Rosetta Code (2007-present). https://rosettacode.org. Multi-language task expression wiki.
