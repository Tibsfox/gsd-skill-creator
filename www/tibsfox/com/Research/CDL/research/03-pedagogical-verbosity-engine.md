# Pedagogical Verbosity Engine

> **Domain:** Literate Programming & Educational Design
> **Module:** 3 -- Three-Tier Annotations, Bloom Scaffolding, and the Literate Programming Lineage
> **Through-line:** *The spaces between the code lines are where understanding lives.* Knuth knew it when he invented literate programming in 1984. Perl knew it when it embedded POD directly in source in 1994. Jupyter knew it when it wove executable cells into narrative in 2014. The College is the next iteration: an institution built on the principle that code is the curriculum, and every space between a function call and its closing bracket is a teaching moment.

---

## Table of Contents

1. [The Verbosity Problem](#1-the-verbosity-problem)
2. [The Literate Programming Lineage](#2-the-literate-programming-lineage)
3. [Three-Tier Annotation Architecture](#3-three-tier-annotation-architecture)
4. [Bloom-Scaffolded Comment Templates](#4-bloom-scaffolded-comment-templates)
5. [Symbol-to-Code Mapping Patterns](#5-symbol-to-code-mapping-patterns)
6. [Fill-in-the-Blank Scaffolding](#6-fill-in-the-blank-scaffolding)
7. [Target Practice Patterns](#7-target-practice-patterns)
8. [Complexity Ceiling Rules](#8-complexity-ceiling-rules)
9. [Real-Data Annotation Requirements](#9-real-data-annotation-requirements)
10. [Validation and Quality Metrics](#10-validation-and-quality-metrics)
11. [Cross-References](#11-cross-references)
12. [Sources](#12-sources)

---

## 1. The Verbosity Problem

Adding more comments to code is not pedagogical progress. A thousand lines of commentary surrounding ten lines of code produces noise, not understanding. The problem is not verbosity itself but *unstructured* verbosity -- commentary without a pedagogical framework, annotations without a target audience, explanations without a cognitive objective.

The College needs a verbosity engine that produces structured, scaffolded annotations at exactly the right density for each learner's current level. A learner at Bloom's Remember level needs different annotation than a learner at Analyze. A panel expression for exponential decay in Python needs different annotation than the same concept in Fortran. The verbosity engine must be sensitive to both the learner's level and the panel's pedagogical character.

```
UNSTRUCTURED vs. STRUCTURED VERBOSITY
================================================================

  UNSTRUCTURED (noise):
    # This function calculates exponential decay
    # It takes N0 (initial value) and lambda (decay constant) and t (time)
    # It returns the value at time t
    # Exponential decay is used in physics and chemistry
    # The formula is N(t) = N0 * e^(-lambda * t)
    # We use math.exp for the exponential function
    # The result is a float
    def decay(N0, lam, t):
        return N0 * math.exp(-lam * t)

  STRUCTURED (three-tier):
    # GLANCE: Compute exponential decay N(t) = N0 * e^(-lambda*t)
    #
    # READ: Exponential decay models radioactive disintegration (physics),
    #   Newton's cooling (thermodynamics), and RC circuit discharge
    #   (electronics). The decay constant lambda = ln(2)/half_life
    #   determines how quickly the quantity approaches zero.
    #   Symbol mapping: N0 -> initial count, lam -> decay constant (1/s),
    #   t -> elapsed time (s), return -> remaining quantity.
    #
    # STUDY: [See study.md -- full literate treatment with historical
    #   context (Rutherford/Soddy 1902), dataset provenance (CERN
    #   Cs-137 record 10.5281/zenodo.XXXXXXX), and exercises at
    #   Apply/Analyze Bloom levels]
    def decay(N0, lam, t):
        return N0 * math.exp(-lam * t)
```

The structured version is not shorter -- it may actually be longer. But every word serves a specific pedagogical purpose at a specific cognitive level.

> **Related:** [Dataset Catalog Integration](01-dataset-catalog-integration.md), [Rosetta Panel Code Standards](04-rosetta-panel-code-standards.md), [WAL Weird Al](../../../Research/WAL/index.html)

---

## 2. The Literate Programming Lineage

The pedagogical verbosity engine inherits from a direct lineage of systems that recognized code and prose as co-equal expressions of the same idea.

### Knuth: CWEB (1984)

Donald Knuth's literate programming system [1] was built on a radical premise: programs are literature. CWEB wove C code and TeX documentation into a single source file, from which two outputs were extracted: the executable program (via `ctangle`) and the typeset document (via `cweave`). Knuth built TeX itself using literate programming -- a tool built to build knowledge.

The key insight from Knuth that the College inherits: **code and documentation are not separate artifacts.** They are two views of the same intellectual work. Separating them creates drift -- the documentation describes what the code used to do, not what it does now. The College's concept nodes carry their annotations as structural elements, not external addenda.

### Wall: POD (1994)

Perl's Plain Old Documentation [2] embedded curriculum directly in source code. The interpreter ignores POD sections; documentation tools ignore code sections. Same file, dual audience. Larry Wall's design decision that every CPAN module must carry its own documentation created a structural invariant: you cannot publish a Perl module without teaching material.

The College inherits POD's structural invariant: **every concept node must carry its own annotations.** A concept node without annotations is an unpublishable module. The seeding protocol (Module E) enforces this as a hard requirement.

### Jupyter (2014)

Project Jupyter made literate programming computational [3]. Code cells execute; prose cells explain. The notebook is simultaneously a document and a program. Berkeley research found that Jupyter's interleaved code-prose format specifically supports Bloom-level progression: students can inspect surrounding code without being required to touch it, and the narrative cells provide the scaffolding that moves learners from passive reading to active creation [3].

The College's Rosetta Panels are structurally equivalent to Jupyter cells. The three-tier annotation system adds what Jupyter left implicit: a formal specification of how much annotation is appropriate for each cognitive level.

### The Lineage Summary

```
LITERATE PROGRAMMING LINEAGE
================================================================

  1984  Knuth CWEB       Code + Prose = One Document
         |
  1994  Wall POD         Code + Curriculum = One Module (CPAN invariant)
         |
  2014  Jupyter          Code + Prose = Executable Notebook
         |
  2026  College Panels   Code + 3-Tier Annotation + Real Data + Bloom Scaffold
                         = Living Epistemic Node
```

---

## 3. Three-Tier Annotation Architecture

The three-tier annotation system formalizes verbosity into three distinct reader profiles, each with a specific time budget and cognitive objective.

### Tier Definitions

| Tier | Reader Speed | Cognitive Objective | Content Specification |
|---|---|---|---|
| **Glance** | 10 seconds | Orientation -- what does this code do? | One-line concept summary; function signature in plain language; primary mathematical formula stated explicitly |
| **Read** | 2-3 minutes | Comprehension -- why does this code work? | Pedagogical context; mathematical underpinning; symbol-to-code mapping; connection to adjacent concepts; historical context of the algorithm |
| **Study** | 15-30 minutes | Mastery -- how does this connect to everything else? | Full literate-programming treatment; historical lineage; dataset provenance and methodology; adjacent concept links; exercises at Bloom levels Apply and Analyze; error analysis and edge cases |

### Tier File Organization

Each concept node stores its annotations in separate files, enabling different tiers to be loaded independently:

```
concept-node/annotations/
  ├── glance.md        -- 3-5 lines per panel expression
  ├── read.md          -- 50-100 lines per panel expression
  └── study.md         -- 200-500 lines per panel expression
```

### Tier Loading Strategy

The UI loads tiers progressively based on learner behavior:

1. **Default:** Glance tier visible. Code is readable without cognitive load.
2. **Hover/click on annotation indicator:** Read tier expands inline. Learner sees mathematical context.
3. **Explicit "Study" toggle:** Study tier loads as a side panel. Full literate-programming treatment.

This progressive disclosure prevents information overload: a learner scanning panels at Bloom level Remember never encounters the Study tier unless they explicitly request it.

### Tier Density Requirements

The verbosity engine enforces minimum and maximum annotation density per tier:

| Tier | Minimum | Maximum | Unit |
|---|---|---|---|
| Glance | 1 line per function/block | 3 lines per function/block | Lines of annotation |
| Read | 5:1 annotation-to-code ratio | 15:1 ratio | Words of annotation per line of code |
| Study | 15:1 ratio | No maximum | Words per line of code |

The minimum density ensures every panel expression has pedagogical content at every tier. The maximum density (except Study) prevents annotation from overwhelming the code.

---

## 4. Bloom-Scaffolded Comment Templates

Each panel family has a comment template tailored to each Bloom level. The template specifies what annotation must be present, what code structure is required, and what learner action is expected.

### Template Structure

```
BLOOM-SCAFFOLDED TEMPLATE: Python Panel, Apply Level
================================================================

  STRUCTURE:
    - Glance annotation (required): one-line formula
    - Read annotation (required): symbol mapping + dataset source
    - Fill-in-the-blank section (required): 1-3 blanks
    - Test assertion (required): verifies filled-in code correctness
    - Dataset link (required): real data from DCAT-linked source

  EXAMPLE:
    # GLANCE: Exponential decay -- N(t) = N0 * e^(-lambda * t)
    #
    # READ: This function models quantity decrease over time.
    #   N0 = initial quantity (count or concentration)
    #   lam = decay constant = ln(2) / half_life (units: 1/time)
    #   t = elapsed time (same units as 1/lam)
    #   Data source: CERN Cs-137 Open Data (DOI: 10.5281/zenodo.XXXXXXX)

    import math

    def decay(N0, lam, t):
        return N0 * math.exp(_____)   # FILL IN: decay term

    # TEST: decay(1000, 0.023, 30.17) should be approximately 500
    #        (Cs-137 half-life = 30.17 years)
    assert abs(decay(1000, 0.023, 30.17) - 500) < 5
```

### Templates by Bloom Level

**Remember (Level 1):**
- Code: Read-only panel, no modification allowed
- Annotation: Glance tier only; formula stated explicitly
- Learner action: Read and recognize the pattern
- Assessment: "What does this function compute?" (multiple choice)

**Understand (Level 2):**
- Code: Worked example with step-by-step execution
- Annotation: Read tier; symbol-to-code mapping; intermediate values shown
- Learner action: Trace execution mentally, predict output
- Assessment: "What is the output for input X?" (free response)

**Apply (Level 3):**
- Code: Fill-in-the-blank with test assertion
- Annotation: Read tier + dataset source; real data loaded
- Learner action: Complete the blank, run the test
- Assessment: Test assertion passes (binary)

**Analyze (Level 4):**
- Code: Data exploration scaffold with multiple panels
- Annotation: Study tier; dataset methodology; comparison prompts
- Learner action: Explore data, compare results across approaches
- Assessment: "Which approach gives tighter uncertainty bounds? Why?"

**Evaluate (Level 5):**
- Code: Two complete implementations of the same concept
- Annotation: Study tier; tradeoff analysis; performance comparison
- Learner action: Evaluate tradeoffs, justify a recommendation
- Assessment: Written justification reviewed by peer or instructor

**Create (Level 6):**
- Code: Empty panel with specification only
- Annotation: Study tier with design rationale scaffold
- Learner action: Implement from scratch
- Assessment: Passes specification test suite + code review

> **Related:** [COK College of Knowledge](../../../Research/COK/index.html), [SGM Sacred Geometry](../../../Research/SGM/index.html)

---

## 5. Symbol-to-Code Mapping Patterns

Research from the Teaching and Learning with Jupyter project establishes that there must be a clear, explicit connection between mathematical symbols and their code expressions [3]. Without this mapping, learners study syntax without understanding the mathematics the syntax represents.

### Mapping Format

The symbol-to-code mapping appears in the Read tier annotation and uses a consistent format:

```
SYMBOL-TO-CODE MAPPING: Exponential Decay
================================================================

  Mathematical notation:
    N(t) = N_0 * e^(-lambda * t)

  Code mapping (Python):
    N(t)    -> decay(N0, lam, t)  -- function call = evaluation at time t
    N_0     -> N0                  -- parameter: initial quantity
    lambda  -> lam                 -- parameter: decay constant (1/s)
                                      (Note: 'lambda' is reserved in Python)
    e^(x)   -> math.exp(x)        -- stdlib exponential function
    *       -> *                   -- multiplication (direct)
    -       -> -                   -- negation (direct)

  Code mapping (Perl):
    N(t)    -> decay($N0, $lam, $t)
    N_0     -> $N0
    lambda  -> $lam
    e^(x)   -> exp($x)            -- builtin exponential
    *       -> *
    -       -> -

  Code mapping (Fortran):
    N(t)    -> decay(N0, lam, t)
    N_0     -> N0
    lambda  -> lam
    e^(x)   -> EXP(x)             -- intrinsic function (caps by convention)
    *       -> *
    -       -> -
```

### Seven-Panel Consistency Rule

When a concept appears in multiple panels, the symbol-to-code mapping must be consistent in intent if not in syntax. The variable name for the decay constant should be `lam` (or the closest equivalent) in all panels, not `decay_rate` in Python and `k` in Fortran. Consistency across panels reinforces the mathematical concept; inconsistency teaches that each panel is its own isolated world.

---

## 6. Fill-in-the-Blank Scaffolding

The fill-in-the-blank (FIB) pattern is the highest-leverage scaffolding pattern for Bloom level Apply [3]. A complete working example with some elements removed -- accompanied by a test assertion -- forces the learner to engage with the critical part of the concept without the cognitive overhead of writing the entire expression from scratch.

### FIB Design Rules

1. **Remove the conceptual core, not the boilerplate.** The blank should be the part that embodies the mathematical concept, not the import statement or function signature.
2. **One concept per blank.** Each blank should test exactly one conceptual understanding. Multiple conceptual questions require multiple blanks.
3. **Test assertion is mandatory.** The learner must receive immediate feedback. A FIB without a test is a fill-in-the-blank worksheet, not a scaffold.
4. **Hint text is optional.** If provided, hints should reference the Read tier annotation (e.g., "See symbol mapping above").
5. **Maximum 3 blanks per panel.** More than 3 blanks turns the exercise into a reconstruction task (Create level), not an application task (Apply level).

### FIB Examples Across Bloom Levels

**Apply (1 blank -- the formula):**
```
def half_life(lam):
    """Return half-life from decay constant."""
    return _____   # FILL IN: ln(2) / lam
assert abs(half_life(0.023) - 30.17) < 0.1
```

**Analyze (2 blanks -- comparison):**
```
# Compare two decay models on the same dataset
model_a = [N0 * math.exp(-lam_a * t) for t in times]
model_b = [N0 * math.exp(_____ * t) for t in times]  # FILL IN: -lam_b
residual_a = sum((m - d)**2 for m, d in zip(model_a, data))
residual_b = _____  # FILL IN: same residual computation for model_b
# Which model fits better? (lower residual = better fit)
```

---

## 7. Target Practice Patterns

Target Practice is the College's term for guided exercises that provide a specific numerical or structural target the learner must hit. Unlike FIB (which removes code), Target Practice provides complete code and asks the learner to modify parameters to achieve a specified result.

### Target Practice Design

```
TARGET PRACTICE: Exponential Decay Parameter Estimation
================================================================

  Given: Data from Cs-137 decay series (CERN Open Data)
  Target: Find the decay constant that produces a half-life of 30.17 years

  Starting code (fully functional, wrong parameter):
    lam = 0.01   # <-- ADJUST THIS
    predicted = [1000 * math.exp(-lam * t) for t in years]
    plot(years, predicted, data)

  Target criterion:
    abs(computed_half_life - 30.17) < 0.5

  Learner action:
    Adjust lam, re-run, observe plot convergence.
    Understanding emerges from the iteration.
```

### Target Practice vs. FIB

| Attribute | Fill-in-the-Blank | Target Practice |
|---|---|---|
| Code state | Incomplete (blanks) | Complete (wrong parameters) |
| Learner action | Fill in missing code | Adjust existing parameters |
| Feedback mechanism | Test assertion (pass/fail) | Numerical proximity to target |
| Bloom level | Apply (primary) | Analyze (primary) |
| Cognitive focus | "How do I express this?" | "How does this parameter affect the result?" |

---

## 8. Complexity Ceiling Rules

Research from the Jupyter pedagogy literature establishes that excessive scaffolding complexity causes learners to study the scaffolding rather than the concept [3]. The verbosity engine must enforce complexity ceilings to prevent this failure mode.

### Ceiling Definitions

| Bloom Level | Max Code Lines | Max Annotation Lines | Max Blanks | Max Panels Shown |
|---|---|---|---|---|
| Remember | 15 | 5 (Glance only) | 0 | 1 |
| Understand | 25 | 30 (Glance + Read) | 0 | 1 |
| Apply | 30 | 40 (Glance + Read) | 3 | 1 |
| Analyze | 50 | 80 (all tiers available) | 5 | 2 |
| Evaluate | 80 | 120 (all tiers) | 0 | 2-3 (comparison) |
| Create | No limit | Study tier available | 0 | 1 (empty) |

### Granularity Calibration

The verbosity engine must match scaffolding granularity to the concept's structural boundaries:

- If the critical idea is inside a for loop, show only the loop interior, not the full program.
- If the concept spans multiple functions, show the function that contains the critical expression and stub the rest.
- If the concept requires context from another module, provide a one-line import comment, not the full module source.

---

## 9. Real-Data Annotation Requirements

When a panel expression uses data from a DCAT-linked dataset (Module A), the annotation must include dataset-specific information that teaches epistemic habits:

### Required Dataset Annotations

| Annotation Element | Tier | Description |
|---|---|---|
| Dataset name and publisher | Glance | "Data: CERN Cs-137 decay series" |
| DOI or persistent identifier | Read | "DOI: 10.5281/zenodo.XXXXXXX" |
| Collection methodology | Read | "Gamma spectrometry, NaI(Tl) detector" |
| Uncertainty information | Read | "Measurement uncertainty: +/- 2%" |
| Units and conversions | Read | "Activity in Becquerels; time in years" |
| Data vintage | Glance | "Last updated: 2025-11-14" |
| License | Read | "CC-BY 4.0" |
| Full provenance chain | Study | Dataset -> instrument -> calibration -> analysis |

### Teaching Epistemic Habits

The purpose of these annotations is not bureaucratic compliance -- it is teaching learners that real data comes from real instruments operated by real people making real choices about methodology. A learner who has only ever run code on clean, synthetic data is unprepared for scholarship. Every dataset annotation is a micro-lesson in research methodology.

> **Related:** [ACE Compute Engine](../../../Research/ACE/index.html), [PMG Pi-Mono + GSD](../../../Research/PMG/index.html)

---

## 10. Validation and Quality Metrics

### Annotation Quality Checklist

Every panel expression must pass this checklist before publication:

1. Glance tier present and <= 3 lines per function
2. Read tier present with symbol-to-code mapping
3. If Bloom level >= Apply, FIB or Target Practice present
4. If dataset linked, all required dataset annotations present
5. Annotation density within min/max bounds for the tier
6. No unreferenced jargon (every technical term defined or linked)
7. Complexity ceiling not exceeded for the target Bloom level

### Verbosity Score

The verbosity engine computes a per-panel score:

```
Verbosity Score = (annotation_words / code_lines) * tier_weight * bloom_factor

Where:
  tier_weight:  Glance=0.3, Read=0.5, Study=1.0
  bloom_factor: Remember=0.5, Understand=0.8, Apply=1.0,
                Analyze=1.2, Evaluate=1.5, Create=0.5

Target range: 5.0 - 25.0
Below 5.0: under-annotated (warning)
Above 25.0: over-annotated (warning, except Study tier)
```

---

## 11. Cross-References

| Topic | Appears In | Related Projects |
|---|---|---|
| Three-tier annotations | M3, M4 | COK, WAL, SGM |
| Bloom scaffolding | M2, M3, M4 | COK, MPC |
| Literate programming | M3 | WAL, GSD2 |
| Fill-in-the-blank | M3, M4 | COK, ACE |
| Symbol-to-code mapping | M3, M4 | MPC, SGM |
| Complexity ceilings | M3, M4 | COK, PMG |
| Dataset annotations | M1, M3 | COK, FEG |
| POD lineage | M3, M5 | WAL, GSD2 |
| Jupyter research | M2, M3 | COK, ACE |
| Panel families | M3, M4 | COK, WAL |

---

## 12. Sources

1. Knuth, D.E. (1984). Literate Programming. *The Computer Journal*, 27(2), 97-111. https://doi.org/10.1093/comjnl/27.2.97
2. Wall, L. et al. *perlpod -- the Plain Old Documentation format*. https://perldoc.perl.org/perlpod
3. Barba, L.A. et al. (2019). *Teaching and Learning with Jupyter*. Open handbook, George Washington University. https://jupyter4edu.github.io/jupyter-edu-book/
4. Anderson, L.W., & Krathwohl, D.R. (Eds.). (2001). *A Taxonomy for Learning, Teaching, and Assessing: A Revision of Bloom's Taxonomy of Educational Objectives*. Longman.
5. Moriyama, C. (2020). Climbing Bloom's Taxonomy with Jupyter Notebooks: Experiences in Mechanical Engineering. *Engineering Archive*. https://engrxiv.org/preprint/view/869
6. Foxglove, M.T. *The Space Between* (923 pp). https://tibsfox.com/media/The_Space_Between.pdf
7. Wing, J.M. (2006). Computational Thinking. *Communications of the ACM*, 49(3), 33-35.
8. Knuth, D.E. (1986). *The TeXbook*. Addison-Wesley.
9. Schwill, A. (1994). Fundamental Ideas of Computer Science. *EATCS Bulletin*, 53, 274-295.
10. Biggs, J., & Tang, C. (2011). *Teaching for Quality Learning at University* (4th ed.). Open University Press.
11. IEEE. (2023). *IEEE 9274.1.1-2023: Standard for Learning Technology -- xAPI*. https://xapi.com/
12. Wiggins, G., & McTighe, J. (2005). *Understanding by Design* (2nd ed.). ASCD.
13. Norman, D.A. (1988). *The Design of Everyday Things*. Basic Books.
14. Papert, S. (1980). *Mindstorms: Children, Computers, and Powerful Ideas*. Basic Books.
15. diSessa, A.A. (2000). *Changing Minds: Computers, Learning, and Literacy*. MIT Press.
