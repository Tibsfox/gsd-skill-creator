---
name: synthesis-team
type: team
category: chemistry
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/chemistry/synthesis-team/README.md
description: Focused chemistry team for reaction design, synthesis planning, mechanism analysis, and retrosynthetic reasoning. Pauling leads bonding and mechanism analysis, Mendeleev provides periodic trend context and reagent selection, Franklin evaluates materials properties and product characterization, and Avogadro frames results pedagogically. Use for organic and inorganic synthesis, reaction pathway design, mechanism elucidation, and yield optimization. Not for analytical method development, nuclear chemistry, or broad multi-domain investigations.
superseded_by: null
---
# Synthesis Team

Focused four-agent team for reaction design, synthesis planning, mechanism analysis, and retrosynthetic reasoning. Pauling leads the team, applying bonding theory and orbital analysis to predict reactivity and guide synthetic strategy. This is the chemistry equivalent of `proof-workshop-team` in the math department -- a targeted team for a specific problem shape.

## When to use this team

- **Reaction design** -- planning a synthetic route from starting materials to target product, including reagent selection, conditions, and expected yields.
- **Mechanism analysis** -- determining the step-by-step electron movement in a reaction, identifying intermediates, and predicting rate-determining steps.
- **Retrosynthetic reasoning** -- working backward from a target molecule to identify viable disconnections and synthetic equivalents.
- **Yield optimization** -- analyzing why a reaction gives poor yield and proposing modifications to conditions, catalysts, or protecting group strategies.
- **Reagent selection** -- choosing between alternative reagents based on selectivity, cost, availability, and environmental considerations.
- **Product characterization planning** -- determining what physical and spectroscopic properties the product should exhibit, so the user knows what to look for.
- **Structure-reactivity relationships** -- understanding how molecular structure affects reactivity patterns across a series of compounds.

## When NOT to use this team

- **Multi-domain investigations** spanning nuclear, analytical, and materials chemistry -- use `chemistry-analysis-team`.
- **Analytical method development** or instrument selection -- use `lab-team`.
- **Nuclear chemistry or radioactivity** -- use `lab-team` (includes Curie-M) or `chemistry-analysis-team`.
- **Beginner-level explanations** with no synthesis component -- use `avogadro` directly.
- **Pure materials characterization** without a synthesis goal -- use `franklin` directly or `chemistry-analysis-team`.

## Composition

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Lead / Mechanism analyst** | `pauling` | Bonding theory, orbital analysis, mechanism prediction, selectivity | Opus |
| **Periodic / Reagent specialist** | `mendeleev` | Periodic trends, inorganic reagents, stoichiometry, oxidation states | Opus |
| **Materials / Product specialist** | `franklin` | Product properties, crystal structure prediction, polymer considerations | Sonnet |
| **Pedagogy specialist** | `avogadro` | Level-appropriate explanation, learning pathways, worked examples | Sonnet |

Two agents run on Opus (Pauling, Mendeleev) because mechanism analysis and reagent selection require deep multi-step reasoning about electronic structure. Two run on Sonnet because materials characterization and pedagogy are well-bounded tasks.

## Orchestration flow

```
Input: user query (target molecule / reaction / mechanism) + optional user level
        |
        v
+---------------------------+
| Pauling (Opus)            |  Phase 1: Analyze the synthesis problem
| Lead / Mechanism          |          - identify bond-forming/breaking events
+---------------------------+          - classify reaction type(s)
        |                              - determine electronic demands
        |                              - outline candidate mechanisms
        |
        +--------+--------+
        |        |        |
        v        v        v
   Mendeleev  Franklin  (Avogadro
   (reagents)  (product)  waits)
        |        |
    Phase 2: Parallel specialist work
             Mendeleev: reagent selection, periodic trend
             analysis, oxidation state tracking, stoichiometry.
             Franklin: product property prediction, crystal
             structure, stability assessment, characterization
             markers.
        |        |
        +--------+
             |
             v
  +---------------------------+
  | Pauling (Opus)            |  Phase 3: Synthesize route
  | Integrate specialist data |          - finalize mechanism
  +---------------------------+          - select optimal conditions
             |                           - predict selectivity and yield
             |                           - flag competing pathways
             v
  +---------------------------+
  | Avogadro (Sonnet)         |  Phase 4: Pedagogy wrap
  | Level-appropriate output  |          - explain mechanism clearly
  +---------------------------+          - add curly-arrow diagrams (text)
             |                           - suggest practice problems
             v
  +---------------------------+
  | Pauling (Opus)            |  Phase 5: Record
  | Produce Grove records     |          - ChemistryReaction for mechanism
  +---------------------------+          - ChemistrySynthesis for route
             |                           - ChemistryExplanation if teaching
             v
      Final response to user
      + Grove records
```

## Synthesis rules

Pauling synthesizes the specialist outputs using these rules:

### Rule 1 -- Orbital analysis grounds all mechanism claims

Every proposed mechanism must be traceable to orbital symmetry, electron density, or electronegativity arguments. Hand-waving ("this group is a good leaving group") is replaced with explicit reasoning ("the C-Br bond is polarized because Br has electronegativity 2.96 vs C at 2.55, making the carbon electrophilic").

### Rule 2 -- Periodic trends inform but do not override specifics

Mendeleev provides general periodic trend context (atomic radius, ionization energy, electron affinity) that frames the problem. When Pauling's specific orbital analysis for a particular compound contradicts a general periodic trend, the specific analysis takes priority. Trends are heuristics; molecular orbital calculations are precise.

### Rule 3 -- Product viability requires materials confirmation

A synthesis route is not complete until Franklin confirms the product's expected physical properties (melting point range, solubility, stability) and identifies characterization markers (expected IR absorptions, NMR shifts, crystal system). A reaction that produces an unstable or uncharacterizable product needs redesign.

### Rule 4 -- Safety is non-negotiable

If any step in a proposed synthesis involves hazardous reagents (pyrophorics, strong oxidizers, toxic gases), Pauling flags the hazard prominently and Mendeleev proposes safer alternatives where they exist. The response always includes a safety section for multi-step syntheses.

### Rule 5 -- Green chemistry preference

When two routes achieve the same product with comparable yield, prefer the route with fewer hazardous reagents, less waste, milder conditions, or better atom economy. Mendeleev tracks atom economy; Franklin evaluates solvent and waste considerations.

## Input contract

The team accepts:

1. **User query** (required). One of:
   - A target molecule (name, SMILES, or structural description) for retrosynthesis
   - A reaction (reactants + conditions) for mechanism analysis
   - A structure-reactivity question for comparative analysis
2. **User level** (optional). One of: `beginner`, `intermediate`, `advanced`, `graduate`. If omitted, Pauling infers from the query.
3. **Prior ChemistrySession hash** (optional). Grove hash for follow-up queries.

## Output contract

### Primary output: Synthesis response

A structured response containing:

- **Reaction scheme** -- reactants, conditions, products, with stoichiometry
- **Mechanism** -- step-by-step electron movement with intermediates labeled
- **Reagent justification** -- why each reagent was chosen over alternatives
- **Product characterization** -- expected physical and spectroscopic properties
- **Yield and selectivity prediction** -- estimated yield range and any selectivity issues
- **Safety notes** -- hazards, precautions, and alternatives
- **Follow-up suggestions** -- related reactions, optimization opportunities

### Grove records

The team produces one or more of:

| Record Type | When Produced | Key Fields |
|-------------|---------------|------------|
| ChemistryReaction | Always | reaction SMILES, mechanism steps, intermediates, rate-determining step, activation energy estimate |
| ChemistrySynthesis | For multi-step routes | target, route steps, reagent list, atom economy, overall yield estimate |
| ChemistryExplanation | When pedagogy phase runs | topic, target level, explanation body, prerequisites, practice problems |
| ChemistrySession | Always | session ID, queries, dispatches, work product links, timestamps |

## Escalation paths

### Internal escalations (within the team)

- **Pauling identifies competing mechanisms:** Both pathways are analyzed. Mendeleev provides thermodynamic data (bond energies, stability of intermediates) to break the tie. If both pathways remain viable, both are reported with their relative likelihood.
- **Franklin finds product instability:** The route is flagged and Pauling proposes modifications (different protecting groups, lower temperature, alternative leaving groups). If no stable route is found, report honestly.
- **Mendeleev identifies missing oxidation state data:** Flag the gap. Provide the best available estimate with explicit uncertainty bounds.

### External escalations (to other teams)

- **Analytical characterization needed:** When the synthesis is complete but the user needs detailed analytical method development (column conditions, instrument parameters), escalate to `lab-team`.
- **Nuclear or isotope involvement:** When the synthesis involves radioactive isotopes or isotope labeling, escalate to `chemistry-analysis-team` (which includes Curie-M).
- **Multi-domain complexity:** When the problem expands beyond synthesis into materials science, nuclear chemistry, or broad analytical characterization, escalate to `chemistry-analysis-team`.

### Escalation to the user

- **No viable route found:** If retrosynthetic analysis exhausts known disconnections without finding a viable route, report honestly with the closest approaches attempted and where they fail.
- **Outside chemistry scope:** If the synthesis requires biological catalysts (enzymes), geological conditions, or engineering-scale considerations beyond bench chemistry, Pauling acknowledges the boundary.

## Token / time cost

Approximate cost per synthesis analysis:

- **Pauling** -- 3 Opus invocations (analyze + synthesize + record), ~50K tokens total
- **Mendeleev** -- 1 Opus invocation, ~30K tokens
- **Franklin** -- 1 Sonnet invocation, ~20K tokens
- **Avogadro** -- 1 Sonnet invocation, ~20K tokens
- **Total** -- 120-200K tokens, 3-8 minutes wall-clock

More efficient than the full analysis team but still substantial. For simple "what reagent should I use" questions, invoke Mendeleev directly.

## Configuration

```yaml
name: synthesis-team
lead: pauling
specialists:
  - reagents: mendeleev
  - product: franklin
pedagogy: avogadro

parallel: true
timeout_minutes: 10

# Pauling may skip Franklin if no product characterization is needed
auto_skip: true

# Minimum specialists: Pauling always invokes at least Mendeleev
min_specialists: 1
```

## Invocation

```
# Retrosynthesis
> synthesis-team: Design a synthesis of ibuprofen from benzene and
  propanoic acid derivatives. Level: advanced.

# Mechanism analysis
> synthesis-team: Explain the mechanism of the Diels-Alder reaction
  between cyclopentadiene and maleic anhydride. Why is this reaction
  so fast at room temperature?

# Reagent selection
> synthesis-team: I need to reduce a ketone to a secondary alcohol
  selectively in the presence of an ester. What reagent should I use
  and why?

# Follow-up
> synthesis-team: (session: grove:def456) Now modify the route to
  improve atom economy and avoid chromium-based oxidants.
```

## Limitations

- No analytical method development -- the team designs syntheses and predicts product properties but does not develop chromatographic or spectroscopic methods.
- No nuclear chemistry -- isotope labeling and radioactive synthesis require Curie-M (available in `lab-team` or `chemistry-analysis-team`).
- No wet lab execution -- all work is theoretical. The team designs routes but cannot run reactions.
- Computational chemistry is limited to qualitative orbital arguments. Quantitative DFT or ab initio calculations require external tools not currently in the team's toolset.
- Biochemical synthesis (enzyme catalysis, fermentation, biosynthetic pathways) is outside scope. The team focuses on synthetic organic and inorganic chemistry.
