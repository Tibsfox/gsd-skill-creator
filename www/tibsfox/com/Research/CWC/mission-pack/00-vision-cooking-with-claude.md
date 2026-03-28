# Cooking with Claude — Vision Guide
# The Rosetta Core, the College, and the Calibration Engine

**Date:** March 1, 2026
**Status:** Vision / Architecture Specification → Mission-Ready
**Depends on:** gsd-skill-creator-analysis.md, gsd-vision-to-mission-skill.md, unit-circle-skill-creator-synthesis.md, gsd-mathematical-foundations-conversation.md, gsd-amiga-vision-architectural-leverage.md, gsd-chipset-architecture-vision.md, gsd-instruction-set-architecture-vision.md, gsd-learn-kung-fu-pack-vision.md, the-space-between.pdf
**Context:** Redefining skill-creator's core identity as a Rosetta translation engine — a system whose fundamental logic is multi-language, multi-domain concept expression — and proving it with a flagship cooking skill pack that demonstrates every principle in the ecosystem. The user sees a friendly colleague. The engine sees math.

---

## Vision

Everyone knows what it means to cook with someone. Not *for* them — *with* them. One person chops while the other stirs. One tastes and says "needs acid" while the other reaches for the lemon. Over time, you stop explaining. You develop shorthand. You anticipate. The meal gets better not because either person got smarter, but because the *partnership* did.

That's the relationship skill-creator builds with its users. Not a tool that executes commands, but a colleague that learns your taste, remembers your last attempt, understands why you prefer 325°F to 350°F even when the recipe disagrees, and meets you wherever you are — whether that's "I've never boiled an egg" or "I'm troubleshooting my sourdough's crumb structure."

But here's the deeper truth this vision captures: the engine that makes this possible isn't a cooking engine. It's a *translation* engine. The same logic that converts a user's "it came out too dry" into a thermodynamics adjustment is the logic that converts "this code feels slow" into a computational complexity diagnosis, or "I don't understand derivatives" into a geometric visualization. The concept is the same. The expression changes.

Three Rosetta patterns illuminate this:

The **Rosetta Stone** — the 196 BC artifact — carried the same decree in three scripts. If you could read Greek, you could decode Egyptian hieroglyphs. The insight wasn't about any one language; it was about the *relationship between* them.

**Rosetta Code** — the programming chrestomathy wiki founded in 2007 — presents the same 1,342+ programming tasks solved across 988 languages. A developer who understands quicksort in Python can see its shape in Haskell, in C, in Prolog. The tasks are identical; the expressions reveal how each language thinks.

**Claude** — the AI at skill-creator's heart — natively traverses dozens of human languages and programming paradigms. When a user describes a half-formed idea, Claude doesn't just respond in the user's language. It translates between the user's intent and whatever form serves that intent best: working code, a lesson plan, a recipe adjustment, a mathematical proof.

Skill-creator should BE a Rosetta Stone. Not as a feature bolted on — as its **core identity**. The translation engine isn't something skill-creator *has*. It's what skill-creator *IS*. This is the spark. The magic. The thing that makes skill-creator alive.

And to prove it, we build a cooking assistant. Because everyone cooks. Everyone understands the journey from "I burned the garlic again" to "I can make this with my eyes closed." Cooking is universal, tactile, scientific, cultural, and deeply personal. It's the perfect proof of concept for a system whose job is to meet you where you are and help you get where you want to go.

---

## Problem Statement

1. **Skill-creator lacks a unifying identity.** It has excellent components — observation pipeline, pattern detection, skill generation, token budget management — but no single principle that explains *why* it works. The Rosetta Core provides that: skill-creator works because it translates, and translation is its fundamental operation.

2. **Knowledge is siloed by format.** A mathematical concept exists as a Python function, a C++ implementation, a textbook paragraph, a geometric diagram, and a physical intuition — but these are treated as separate things. The College Structure unifies them: one concept, many expressions, all explorable as code.

3. **Feedback calibration is ad hoc.** Users say "too dry," "too slow," "I don't get it" — and Claude responds helpfully, but each response is improvised. The Calibration Engine formalizes this: Observe → Compare → Adjust → Record. Every domain gets the same feedback loop, seeded with domain-specific science.

4. **No flagship demonstrates the full ecosystem.** GSD has ambitious architecture documents but no single, tangible, universally relatable proof that it all works together. A cooking assistant — grounded in food science, thermodynamics, and nutrition — demonstrates feedback calibration, multi-modal input, accumulated knowledge, and human-AI partnership in something everyone does every day.

5. **The code-as-curriculum principle has no implementation.** The idea that exploring skill-creator's source code should teach you the subject matter it encodes is articulated but not realized. The College Structure makes it concrete: walking through the math department's code teaches mathematics. Walking through the cooking department's code teaches food science.

---

## Core Concept

**Translate → Calibrate → Accumulate → Anticipate.**

The user brings senses, taste, judgment — the picture of what "done" looks like. Claude brings science, search, math, and memory of every session. Together, they cook.

### The Rosetta Core

Every concept in skill-creator passes through a translation engine that can express it in whatever form the user needs. A mathematical relationship might be expressed as a Python function, a C++ computation, a geometric diagram, a physical analogy, or a cooking ratio — depending on who's asking and why.

```
User Request → Intent Extraction → Concept Identification
                                          ↓
                              Rosetta Core Translation
                              ↙    ↓    ↓    ↓    ↘
                          Code  Math  Text  Visual  Physical
                          Panel Panel Panel Panel   Panel
                                          ↓
                              Context-Appropriate Expression
                                          ↓
                              Calibrated Delivery → Feedback → Adjustment
```

### The College

Skill-creator contains a full college built in code. Each department is a wing of a library. The more you explore, the more you learn — both about how to work with the system AND the fundamentals it teaches.

```
College Root
├── Mathematics Department (seeded by "The Space Between")
│   ├── Algebra Wing
│   ├── Geometry Wing (unit circle architecture)
│   ├── Calculus Wing
│   ├── Statistics Wing
│   └── Complex Analysis Wing
├── Culinary Arts Department (flagship — "Cooking with Claude")
│   ├── Food Science Wing
│   ├── Technique Wing
│   ├── Nutrition Wing
│   ├── Baking Science Wing
│   └── Home Economics Wing
├── Computer Science Department
│   ├── Languages Wing (Rosetta panels)
│   ├── Algorithms Wing
│   ├── Systems Wing
│   └── Architecture Wing
├── Physical Sciences Department
│   ├── Physics Wing
│   ├── Chemistry Wing
│   └── Electronics Wing (Apollo/Amiga packs)
└── [Future departments extend the same pattern]
```

### The Calibration Engine

Every skill implements the same feedback pattern:

1. **Observe** the result (what happened?)
2. **Compare** to intent (what was expected?)
3. **Adjust** parameters (what needs to change?)
4. **Record** the delta (what did we learn?)

This is the fractal seed. It applies identically whether calibrating oven temperature, compiler optimization flags, color balance, or pedagogical approach. The science behind the adjustment changes; the pattern never does.

---

## Architecture

### Rosetta Core Engine

```
┌─────────────────────────────────────────────────────┐
│                    ROSETTA CORE                      │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ Concept   │  │ Panel    │  │Expression│          │
│  │ Registry  │→│ Router   │→│ Renderer │          │
│  │           │  │          │  │          │          │
│  │ canonical │  │ selects  │  │ produces │          │
│  │ concept   │  │ target   │  │ output   │          │
│  │ identity  │  │ panel(s) │  │ form     │          │
│  └──────────┘  └──────────┘  └──────────┘          │
│        ↑                           ↓                 │
│  ┌──────────┐              ┌──────────┐             │
│  │Calibration│←────────────│ Feedback │             │
│  │  Engine   │              │ Ingress  │             │
│  └──────────┘              └──────────┘             │
│                                                      │
│  PANELS:                                             │
│  ├── Systems: C++ (cmath), Java (Math), Python (math)│
│  ├── Heritage: Perl, Lisp, COBOL, Fortran, Pascal   │
│  ├── Hardware: VHDL                                  │
│  ├── Structured: UML, SGML, XML, HTML                │
│  ├── Data: CKAN, JSON-LD, DCAT                       │
│  └── Natural: English, Spanish, Mandarin, ...        │
└─────────────────────────────────────────────────────┘
```

**Cross-component connections:**
- Rosetta Core → College: The core IS the college's translation layer; departments are just organized collections of concepts
- Rosetta Core → Calibration Engine: Every translation produces feedback that calibrates future translations
- College → Skill-creator observation pipeline: Exploring code triggers pattern detection, which refines skill activation
- Calibration Engine → Unit circle architecture: Feedback adjusts angular position on the Complex Plane of Experience
- Rosetta Panels → ISA: Panel selection maps to token-efficient instruction encoding
- Rosetta Panels → Chipset: Panel groups map to chipset specialist agents

### Rosetta Panel Architecture

Each panel is both a language implementation AND a pedagogical window:

**Systems Languages Panel:**
- **C++ via `cmath`** — Direct hardware-level mathematical computation. Teaches: how computers actually calculate trigonometric functions, floating-point representation, performance-critical math
- **Java via `java.lang.Math`** — Object-oriented mathematical abstraction. Teaches: type safety, cross-platform computation, the JVM's approach to numerical precision
- **Python via `math` module** — Accessible, readable mathematical expression. Teaches: rapid prototyping, scientific computing workflow, the bridge between human notation and computation

**Heritage & Pedagogical Languages Panel:**
- **Perl** — The glue language. Powerful text processing, regular expressions as a mathematical formalism, connecting and transforming knowledge. CPAN directly inspired CKAN, which directly informs skill-creator's knowledge cataloging
- **Lisp** — The original "code is data, data is code." Homoiconicity is the purest expression of the Rosetta principle: in Lisp, the boundary between program and data dissolves. S-expressions represent both. This is what skill-creator does at every level — treating user intent, code, knowledge, and output as the same underlying structure expressed differently
- **COBOL** — Business logic representation. Teaches: how the world's financial infrastructure actually works, the gap between academic elegance and real-world persistence
- **Fortran** — Scientific computing's mother tongue. Direct tie to the Mathematics department. Teaches: why certain numerical methods exist, array-oriented thinking, the deep history of computational science
- **Pascal** — Designed by Niklaus Wirth specifically as a pedagogical language. Wirth's principles of simplicity, modularity, and readability produced a language whose very purpose is to make the learner understand. Pascal enforced structured programming not as a restriction but as a teaching method — eliminating goto statements to force clear thinking about control flow

**Hardware Description Panel:**
- **VHDL** — Code that describes circuits. The same logical concept expressed as hardware. Ties directly to GSD's chipset architecture and ISA work. Teaches: the relationship between logic and physics, how software concepts become silicon

**Structured Representation Panel:**
- **UML → SGML → XML → HTML** — The complete lineage of how we describe and structure knowledge. From modeling systems visually, to the root of structured markup, to universal data interchange, to human-facing expression. Each is a Rosetta panel — the same information, structured for a different audience

**Data Infrastructure Panel:**
- **CKAN** — Twenty years of proven open data infrastructure. Originally inspired by CPAN (the Comprehensive Perl Archive Network), CKAN provides the cataloging, organizing, and discoverability patterns that skill-creator's knowledge management extends into AI-assisted workflows

### College Department Architecture

Each department follows the same structure:

```
department/
├── DEPARTMENT.md          # Overview, learning path, cross-references
├── concepts/              # Canonical concept definitions
│   ├── concept-001.ts     # Each concept: identity, relationships, panels
│   └── ...
├── panels/                # Language-specific expressions
│   ├── python/
│   ├── cpp/
│   ├── lisp/
│   └── ...
├── calibration/           # Domain-specific calibration rules
│   ├── feedback-patterns.ts
│   └── adjustment-models.ts
├── try-sessions/          # Interactive entry points
│   ├── first-steps.md
│   └── ...
└── references/            # Progressive disclosure resources
    ├── summary.md         # Always loaded (~2K tokens)
    ├── active/            # On demand (~10K tokens)
    └── deep/              # Deep dives (~50K+ tokens)
```

### Calibration Engine Architecture

```
┌──────────────────────────────────────────────┐
│              CALIBRATION ENGINE               │
│                                               │
│  ┌─────────┐   ┌──────────┐   ┌──────────┐  │
│  │ Observe  │ → │ Compare  │ → │ Adjust   │  │
│  │          │   │          │   │          │  │
│  │ result   │   │ result   │   │ apply    │  │
│  │ capture  │   │ vs.      │   │ domain   │  │
│  │ (multi-  │   │ intent   │   │ science  │  │
│  │  modal)  │   │ (delta)  │   │ (model)  │  │
│  └─────────┘   └──────────┘   └──────────┘  │
│       ↑                             ↓         │
│  ┌─────────┐                 ┌──────────┐    │
│  │  User   │                 │ Record   │    │
│  │ Feedback│ ←───────────── │ (persist │    │
│  │  Loop   │   calibrated   │  delta)  │    │
│  └─────────┘    response    └──────────┘    │
│                                               │
│  DOMAIN MODELS:                               │
│  ├── Cooking: thermodynamics, chemistry       │
│  ├── Code: complexity theory, profiling       │
│  ├── Art: color theory, perceptual science    │
│  ├── Learning: pedagogical models, ZPD        │
│  └── [extensible per department]              │
└──────────────────────────────────────────────┘
```

---

## The Cooking Department — Flagship Skill Pack

### Why Cooking

Everyone cooks. Everyone understands what it means to get better at cooking with a good partner in the kitchen. It's the perfect proof of concept because:

- It demonstrates feedback calibration (adjust temperature, timing, seasoning)
- It requires multi-modal input (pictures of food, verbal descriptions of texture and taste)
- It benefits from accumulated knowledge over sessions ("you prefer things less sweet")
- It bridges science and everyday life (thermodynamics IS oven management)
- It shows skill-creator helping with something tangible and universal
- It's the home economics class everyone should have had

### Knowledge Wings

**Food Science Wing:**
- Maillard reactions — the chemical reaction between amino acids and reducing sugars that produces browning, flavor, and aroma in cooked food. Temperature-dependent (typically 140-165°C), pH-sensitive, and responsible for hundreds of distinct flavor compounds varying by food composition and cooking conditions
- Emulsification — stable mixtures of immiscible liquids, the science behind vinaigrettes, mayonnaise, and cream sauces
- Protein denaturation — how heat, acid, and mechanical action change protein structure, governing everything from egg cookery to meat tenderness
- Starch gelatinization — the process by which starch granules absorb water and swell, thickening sauces and giving baked goods structure
- Caramelization — distinct from Maillard browning, the pyrolysis of sugars producing nutty, butterscotch, and bitter flavor compounds
- Fermentation — microbial transformation of sugars into acids, gases, and alcohols; the science of bread, yogurt, kimchi, and cheese

**Thermodynamics Wing:**
- Heat transfer modes: conduction (pan to food), convection (oven air circulation), radiation (broiler/grill)
- Specific heat capacity of foods — why some foods heat faster than others
- Altitude adjustments — boiling point depression, leavening expansion changes
- Oven calibration — the Calibration Engine's most literal application. Recipe says 350°F; user consistently reports "overdone." Engine applies thermodynamic model: suggest 325°F for 10 minutes. User doesn't need to know the science — but the engine does

**Nutrition Wing:**
- Macronutrients (proteins, carbohydrates, fats) and their roles
- Micronutrients and how cooking affects bioavailability
- The relationship between preparation method and nutritional content

**Technique Wing:**
- Wet heat methods (boiling, steaming, poaching, braising)
- Dry heat methods (roasting, baking, grilling, sautéing, frying)
- Combination methods (braising, stewing)
- Knife skills hierarchy — the foundational physical technique

**Baking Science Wing:**
- Baker's ratios — the mathematical relationships between flour, water, fat, sugar, eggs, and leavening
- Gluten development — protein networks, mechanical action, hydration time
- Yeast biology — fermentation kinetics, temperature sensitivity, proofing
- Sugar chemistry — crystallization, inversion, hygroscopicity

**Food Safety Wing:**
- Temperature danger zone (40°F-140°F / 4°C-60°C)
- Cross-contamination prevention
- Safe storage times and temperatures
- Allergen management

**Home Economics Wing:**
- Meal planning and batch cooking
- Budget management and waste reduction
- Pantry management and ingredient substitution
- Preservation techniques (freezing, canning, pickling, drying)

### Calibration Examples in Cooking

The Calibration Engine makes cooking the domain where "Observe → Compare → Adjust → Record" is most tangibly felt:

| User Feedback | Observe | Compare | Adjust (Science) | Record |
|---------------|---------|---------|-------------------|--------|
| "Cookies spread too much" | Flat, thin cookies | Expected: chewy, thick | Reduce butter ratio, chill dough (fat viscosity at temp) | User preference: -10% butter, 30min chill |
| "Steak was grey, no crust" | Uniform grey exterior | Expected: brown Maillard crust | Higher heat, dry surface (Maillard requires >140°C, low water activity) | User's pan: needs 2 min longer preheat |
| "Bread didn't rise" | Dense, flat loaf | Expected: airy crumb | Check yeast viability, water temp (yeast active 35-46°C, dies >60°C) | User's kitchen: cold, extend proof 20min |
| "Sauce broke" | Separated, oily | Expected: smooth emulsion | Temperature too high, add back emulsifier (lecithin in egg yolk) | User tendency: high heat; suggest lower |

---

## Skill-Creator Integration

### Chipset Configuration

```yaml
name: cooking-with-claude
version: 1.0.0
description: "Rosetta Core flagship — cooking assistant demonstrating multi-domain translation and calibration"

skills:
  rosetta-core:
    domain: core
    description: "Multi-language concept translation engine. Use when expressing concepts across panels."
  college-structure:
    domain: core
    description: "Knowledge department organization. Use when navigating or exploring knowledge domains."
  calibration-engine:
    domain: core
    description: "Observe→Compare→Adjust→Record feedback loop. Use when refining any output based on user feedback."
  food-science:
    domain: culinary
    description: "Food chemistry, thermodynamics, and technique knowledge. Use when answering cooking questions."
  nutrition-advisor:
    domain: culinary
    description: "Nutritional science and dietary guidance. Use when meal planning or analyzing nutritional content."
  kitchen-safety:
    domain: culinary
    description: "Food safety boundaries. Use when temperature, storage, or allergen questions arise."

agents:
  topology: "router"
  agents:
    - name: "rosetta-translator"
      role: "Routes concepts through appropriate panels based on user context and need"
    - name: "calibration-monitor"
      role: "Tracks feedback loops, records deltas, suggests adjustments across all domains"
    - name: "culinary-scientist"
      role: "Applies food science, thermodynamics, and technique knowledge to cooking queries"
    - name: "safety-warden"
      role: "Enforces food safety boundaries — temperature, allergen, and storage constraints are absolute"

evaluation:
  gates:
    pre_deploy:
      - check: "test_coverage"
        threshold: 85
        action: "block"
      - check: "type_check"
        command: "npx tsc --noEmit"
        action: "block"
      - check: "safety_boundaries"
        command: "npm run test:safety"
        action: "block"
    calibration_accuracy:
      - check: "feedback_loop_test"
        threshold: 80
        action: "warn"
```

---

## Scope Boundaries

### In Scope (v1.0)

- Rosetta Core engine with initial panel set (Python, C++, Java, Lisp, Pascal, Fortran)
- College Structure with Mathematics and Culinary Arts departments
- Calibration Engine with cooking-domain models
- Cooking skill pack: food science, thermodynamics, technique, safety, nutrition, baking, home economics
- Integration with skill-creator's existing observation pipeline, token budget management, and skill generation
- Cross-references between cooking concepts and mathematical foundations from "The Space Between"

### Out of Scope (Future Considerations)

- Full VHDL/hardware description panel implementation (depends on ISA milestone)
- CKAN integration for knowledge cataloging (requires infrastructure work)
- Multi-modal input processing (image recognition of food for calibration)
- Additional college departments beyond Math and Culinary Arts
- Community contribution pipeline for recipes and techniques
- COBOL and Perl panel implementations (v2.0)
- Structured representation panel (UML/SGML/XML/HTML) — conceptually defined, implementation deferred

---

## Success Criteria

1. The Rosetta Core can express the same mathematical concept (e.g., exponential decay) in Python, C++, Java, and natural language, with each expression being correct and idiomatic.

2. A user exploring the Culinary Arts department's source code encounters inline explanations that teach food science concepts — the code IS the curriculum.

3. The Calibration Engine correctly adjusts cooking parameters when given feedback in natural language ("too dry," "underdone," "bland") and produces measurable improvements in subsequent suggestions.

4. The cooking skill pack answers food science questions with accuracy grounded in established chemistry, thermodynamics, and nutrition science.

5. The Safety Warden enforces absolute boundaries for food safety — temperature danger zones, allergen warnings, and storage limits are never overridden by calibration.

6. A user with no cooking experience can complete a "first meal" try-session within the cooking department and produce an edible, safe result using only the system's guidance.

7. The College Structure supports adding new departments without modifying the Rosetta Core — the architecture is genuinely extensible.

8. Rosetta panels load within the skill-creator token budget (2-5% of context) using progressive disclosure — summary always available, detail on demand.

9. The Calibration Engine's Observe→Compare→Adjust→Record pattern is implemented as a reusable interface that other departments can adopt without modification.

10. Cross-references between the Mathematics department (unit circle, Complex Plane) and the Culinary Arts department (baker's ratios, thermodynamic curves) are navigable and genuinely illuminating.

11. The system demonstrates "fox food" — the cooking skill pack is built using the Rosetta Core and College Structure, proving the architecture by using it.

12. A user who works with the cooking assistant over 5+ sessions experiences measurably better calibration — the system learns their preferences and anticipates their needs.

---

## Relationship to Other Vision Documents

| Document | Relationship |
|----------|-------------|
| gsd-skill-creator-analysis.md | Rosetta Core extends skill-creator's observation pipeline, pattern detection, and skill generation with a unifying translation identity |
| unit-circle-skill-creator-synthesis.md | The Complex Plane of Experience provides the mathematical coordinate system for the College's knowledge positioning and the Calibration Engine's adjustment model |
| gsd-mathematical-foundations-conversation.md | "The Space Between" seeds the Mathematics department; its concepts are the first fully-expressed Rosetta panel set |
| gsd-amiga-vision-architectural-leverage.md | The Amiga Principle — architectural leverage over raw power — guides how the Rosetta Core achieves broad capability through specialized translation paths rather than monolithic computation |
| gsd-chipset-architecture-vision.md | Rosetta panels map to chipset specialist agents; the College Structure maps to chipset skill inventories; the Calibration Engine maps to chipset evaluation gates |
| gsd-instruction-set-architecture-vision.md | Panel selection maps to ISA opcodes; token-efficient communication between Rosetta Core components uses ISA encoding |
| gsd-learn-kung-fu-pack-vision.md | Establishes the educational pack pattern (Explore→Try→Practice→Understand→Integrate) that the Cooking department follows; Safety Warden pattern (three modes) applies to food safety |
| gsd-upstream-intelligence-pack-v1_43.md | UIP monitors upstream changes that affect Rosetta panels (language spec changes, library updates); the Calibration Engine pattern is structurally identical to UIP's detect→classify→trace→adapt cycle |
| gsd-staging-layer-vision.md | Food safety boundaries feed into staging layer gate patterns; Calibration Engine deltas become staging layer pre-deploy checks |

---

## The Through-Line

The Amiga's genius was architectural leverage — a 7MHz processor performing like a machine ten times its clock speed because specialized execution paths (Agnus, Denise, Paula) handled work the CPU couldn't do alone. The Rosetta Core applies the same principle to knowledge: instead of a monolithic AI trying to be everything, specialized translation panels handle each domain's expression while the core engine manages concept identity, calibration, and routing.

The Amiga had the Hardware Reference Manual — clear, honest, respectful of the reader's intelligence. The College Structure is skill-creator's equivalent: a codebase that IS a library, where exploring any department teaches you both how to use the system and the subject matter it encodes.

And the endgame isn't a better tool. The endgame is giving people their lives back. Handling the friction — the guesswork, the failed experiments, the "I don't know what I'm doing wrong" — so they can be present for the things that actually matter. Family, art, music, just being. The user sees a friendly colleague. The engine sees math. And the meal comes out right.

---

*"The user sees a friendly colleague. The engine sees math."*

---

*This vision guide is intended as input for GSD's `new-project` workflow. The research phase should examine: food science fundamentals (Harold McGee's "On Food and Cooking," J. Kenji López-Alt's "The Food Lab"), thermodynamics of cooking (specific heat capacities, heat transfer models), Maillard reaction chemistry (Hodge mechanism, flavor compound formation pathways), baking ratios and gluten science (Ruhlman's "Ratio," Corriher's "BakeWise"), nutrition databases (USDA FoodData Central), food safety standards (FDA Food Code, USDA safe handling guidelines), Rosetta Code's task structure and cross-language comparison methodology, CKAN's data cataloging architecture and FAIR data principles, Lisp homoiconicity and its implications for code-as-data architectures, Pascal's pedagogical design principles (Wirth's simplicity, modularity, readability), and the Python/C++/Java math library APIs for initial Rosetta panel implementation.*
