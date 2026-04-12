# Department Pattern — Building Domain-Expert Teams

A **department** in gsd-skill-creator is a coordinated set of skills, agents, teams, and a chipset that provides structured expertise in a knowledge domain. It is the reusable architecture for how LLM-based systems deliver domain knowledge through multi-agent collaboration, content-addressed persistence, and learning pathway integration.

The Math Department (`examples/*/math/` + `examples/chipsets/math-department/`) is the first complete instantiation of this pattern. This document explains the invariant architecture so that anyone can build a new department — Physics, Music Theory, Linguistics, Economics, or anything else — by forking the structure and replacing the domain content.

---

## The Invariant Architecture

Every department has the same structural components, regardless of domain:

```
Department
├── Skills (4-8)           ← Domain knowledge as activatable context injections
├── Agents (5-9)           ← Named specialists with input/output contracts
│   ├── Chair / Router     ← Classifies, routes, synthesizes (Opus, CAPCOM)
│   ├── Specialists (3-6)  ← Domain experts (Opus for judgment, Sonnet for structure)
│   └── Pedagogy           ← Teaching, explanation, learning paths (Sonnet)
├── Teams (2-4)            ← Pre-composed agent configurations
│   ├── Full investigation ← All agents, parallel analysis
│   ├── Focused workshop   ← Subset for depth in one area
│   └── Pipeline           ← Sequential exploration → verification → documentation
├── Chipset (1)            ← Configuration binding everything together
├── Grove Record Types     ← Domain-specific persistence
└── College Integration    ← Concept graph + learning pathways
```

### What stays the same in every department

1. **Router topology with CAPCOM chair.** One agent classifies queries, routes to specialists, and synthesizes results. This agent is the only one that talks to the user directly (the CAPCOM boundary from mission control patterns). Always Opus — routing is judgment.

2. **Named specialists with historical identities.** Each specialist is named after a historical figure whose actual contributions map to the agent's role. The names teach domain history; the user can rename them later.

3. **Pedagogy agent.** Every department has a teaching specialist who can pair with any other agent to produce level-appropriate explanations. Always Sonnet — teaching is structural.

4. **Three team shapes.** Full investigation (all agents, parallel), focused workshop (subset, depth), pipeline (sequential exploration → verification → documentation). These mirror the RCA team shapes (`rca-deep-team`, `rca-triage-team`, `postmortem-team`).

5. **Grove record types.** Every department defines domain-specific record types for persisting work products. These are content-addressed, append-only, and self-describing per the Grove format spec.

6. **College integration.** Every department maps to a college department's concept graph, enabling learning pathway tracking across sessions.

7. **Chipset configuration.** A single YAML file binds everything — skills, agents, teams, grove types, college hooks, evaluation gates, and customization flags.

### What changes per domain

| Element | Math Department | Physics Department (hypothetical) | Music Theory (hypothetical) |
|---------|----------------|-----------------------------------|----------------------------|
| **Skills** | proof-techniques, algebraic-reasoning, geometric-intuition, numerical-analysis, pattern-recognition, mathematical-modeling | classical-mechanics, electromagnetism, thermodynamics, quantum-mechanics, relativity, experimental-design | harmony, counterpoint, rhythm-meter, form-analysis, orchestration, ear-training |
| **Chair name** | Hypatia | Curie | Bach |
| **Specialists** | Euclid, Gauss, Euler, Noether, Ramanujan | Newton, Maxwell, Boltzmann, Feynman, Hubble | Rameau, Schenker, Messiaen, Coltrane |
| **Pedagogy** | Polya | Feynman (doubles as specialist) | Kodaly |
| **Grove types** | MathProof, MathConjecture, MathDerivation, MathExplanation, MathSession | PhysicsDerivation, Experiment, Measurement, PhysicsExplanation, LabSession | HarmonicAnalysis, Composition, VoiceLeading, MusicExplanation, PracticeSession |
| **College dept** | `.college/departments/math/` | `.college/departments/physics/` | `.college/departments/music/` |

---

## How to Build a New Department

### Step 1: Fork the structure

```bash
# Copy directories
cp -r examples/skills/math examples/skills/YOUR_DOMAIN
cp -r examples/agents/math examples/agents/YOUR_DOMAIN
cp -r examples/teams/math examples/teams/YOUR_DOMAIN
cp -r examples/chipsets/math-department examples/chipsets/YOUR_DOMAIN-department
```

### Step 2: Choose your historical names

Select 5-9 historical figures from your domain. Map their actual contributions to agent roles:

| Role | Selection criteria | Math example |
|------|-------------------|--------------|
| **Chair** | Known for teaching, community building, cross-tradition synthesis | Hypatia |
| **Primary specialists** | Deep expertise in one subdomain, judgment-heavy work | Euclid (proof), Noether (algebra) |
| **Computational specialists** | Prolific output, structural work | Gauss, Euler |
| **Discovery/creative** | Pattern recognition, intuition, novel approaches | Ramanujan |
| **Pedagogy** | Published on teaching methods, heuristics, accessibility | Polya |

**Diversity matters.** The Math Department spans 2,300 years, 4 continents, and multiple traditions. Your department should do the same. Historical diversity teaches the domain's real breadth.

### Step 3: Write your skills

Replace each SKILL.md's content with domain-appropriate knowledge:

- Keep the frontmatter format exactly (change `category: math` to `category: YOUR_DOMAIN`)
- Keep the section structure: overview, technique catalog, worked examples, when to use, when NOT to use, decision guidance
- Each skill is self-contained — no cross-skill dependencies
- Ground content in established sources (textbooks, papers, standards)

### Step 4: Write your agents

Replace each AGENT.md with domain-specific expertise:

- Keep the frontmatter format (update category, names, paths)
- Keep input/output contracts typed and explicit
- Keep behavioral specifications detailed (heuristics, decision trees, failure protocols)
- Keep the historical connection section — explain why this name maps to this role
- Model assignments: Opus for judgment-heavy roles, Sonnet for structural work

### Step 5: Define your Grove record types

Replace the 5 math types with domain-appropriate types:

- Every department needs at minimum: a **work product** type, an **explanation** type, and a **session** type
- Follow the Grove format spec — fields are typed, records are append-only
- Link records to college concept IDs via `concept_ids` fields

### Step 6: Map to your college department

Either use an existing `.college/departments/YOUR_DOMAIN/` or create one:

- Define wings (3-5 major topic areas)
- Define concepts within wings (4-6 per wing)
- Map agents to concepts (which agent covers which concept area)
- Map skills to concepts (which skill addresses which concepts)

### Step 7: Write your chipset

Update `chipset.yaml`:

- Replace all skill/agent/team names
- Update Grove record types
- Update college department reference
- Update evaluation gates if domain has specific requirements
- Update triggers for domain-appropriate activation patterns

### Step 8: Register and validate

- Add your category to `examples/CATEGORIES.md` (skills, agents, teams sections)
- Run cross-reference validation: all agent names in teams exist, all skill names in chipset exist, all concept IDs are valid
- Verify escalation paths between teams are bidirectional

---

## Naming Strategy

Historical names serve three purposes:

1. **Mnemonic.** "Ask Euclid" is easier to remember than "invoke proof-specialist-agent."
2. **Educational.** Users learn domain history just by using the department.
3. **Template.** Users rename the agents to their own preferences later — like the muse council uses personal names (Cedar, Hemlock, etc.) instead of historical ones.

**Selection heuristics:**

- Map actual historical contributions to agent roles (don't just pick famous names)
- Prioritize figures whose work style matches the agent's behavior
- Include non-Western traditions (mathematics didn't start in Greece and neither did physics)
- Include underrepresented voices (Noether in math, Wu in physics, etc.)
- Avoid figures whose legacy is contested or harmful
- Document the connection explicitly in each AGENT.md

---

## OOPS Alignment

The department pattern implements specific recommendations from the OOPS analysis:

| OOPS Recommendation | Department Implementation |
|---------------------|--------------------------|
| **Memory as active intelligence** (doc 05) | Grove records persist work products as queryable, content-addressed artifacts — not just session logs |
| **Trigger specificity** (doc 07) | Each skill has scoped triggers that activate reliably without over-triggering; chipset maps skill↔agent affinity |
| **Router + CAPCOM topology** (doc 06) | Hypatia routes via classification, specialists never talk to user directly |
| **Session learning loop** (doc 08) | MathSession records implement collect→analyze→pattern→propose→validate→integrate→monitor |
| **Bounded learning** (doc 07) | Skills are stable artifacts with controlled update cycles; agents have explicit behavioral contracts |

---

## Grove Integration

The department pattern is the first domain-specific extension of the Grove type system beyond core skill/agent/team types.

**Type hierarchy:**

```
bootstrap TypeRecord (built into Grove)
    ↑ typeHash
SkillSpec TypeRecord (defined by gsd-skill-creator)
    ↑ typeHash                              ↑ typeHash
skill record A                         MathProofSpec TypeRecord (defined by math department)
                                            ↑ typeHash
                                        MathProof record instance
```

This validates Grove spec design goal 1: "New record types require no format changes, no reader updates, no migrations."

**Namespace:** Each department gets its own Grove namespace (e.g., `math-department`). Records are scoped to the namespace but globally addressable by hash.

---

## College Integration

```
.college/departments/math/
├── DEPARTMENT.md          ← 5 wings, 23 concepts
├── concepts/              ← TypeScript concept definitions
├── calibration/           ← Mastery tracking
└── try-sessions/          ← Hands-on exploration sessions

Department agents ←→ College concepts:
- Agents READ concept graph to understand user's current level
- Agents WRITE concept updates after teaching interactions
- Polya generates Try Session specs linked to concepts
- MathExplanation records carry concept_ids for pathway tracking
```

---

## Lessons from the Math Department (v1.0)

1. **The RCA suite is the structural template.** The three team shapes (deep, triage, pipeline) mapped perfectly. Don't reinvent team architecture — adapt it.

2. **Historical names require research.** Choosing names that genuinely map to agent roles takes work. Hypatia as chair works because she was actually a coordinator/teacher. A lazy choice (Einstein for everything) would undermine the pattern.

3. **Six skills is a good starting number.** Enough to cover the domain space without overlap. Skills can be split later if they grow past the token budget threshold.

4. **Three Opus / four Sonnet is the right split for judgment-heavy domains.** Math requires more judgment than dev workflows. Other domains may need fewer Opus agents (e.g., a data-processing department might be 1 Opus / 6 Sonnet).

5. **Grove record types should parallel the domain's natural work products.** Mathematicians produce proofs, conjectures, derivations, and explanations. Physicists produce derivations, experiments, measurements, and explanations. The types are the domain's output vocabulary.

6. **The chipset is the integration point, not the skills or agents individually.** Don't try to make skills and agents work standalone — the chipset binds them into a coherent department. Users install a chipset, not individual skills.

7. **The fork guide is as important as the department itself.** The first department's value is partly in the artifacts and partly in the documentation of how to build the next one.
