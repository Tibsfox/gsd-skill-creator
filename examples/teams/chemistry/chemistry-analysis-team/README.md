---
name: chemistry-analysis-team
type: team
category: chemistry
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/chemistry/chemistry-analysis-team/README.md
description: Full Chemistry Department investigation team for multi-domain problems spanning atomic structure, bonding, reactions, organic synthesis, analytical methods, and materials science. Lavoisier classifies the query along four dimensions and activates relevant specialists in parallel, then synthesizes their independent findings into a unified, level-appropriate response with a learning pathway from Avogadro. Use for research-level questions, graduate-level work requiring coordinated specialist input, or any problem where the chemical domain is not obvious and different perspectives may yield different insights. Not for routine stoichiometry, pure analytical work, or single-domain materials questions.
superseded_by: null
---
# Chemistry Analysis Team

Full-department multi-method investigation team for chemical problems that span domains or resist classification. Runs specialists in parallel and synthesizes their independent findings into a coherent response, analogous to how `math-investigation-team` runs multiple mathematical methods on a single problem.

## When to use this team

- **Multi-domain problems** spanning atomic structure, bonding, reactions, organic chemistry, analytical methods, and materials science -- where no single specialist covers the full scope.
- **Research-level questions** where the domain is not obvious and the problem may yield different insights from different chemical perspectives.
- **Graduate-level work** requiring coordinated input from multiple specialists (e.g., a materials problem that needs Pauling's bonding analysis, Mendeleev's periodic trends, and Franklin's materials characterization).
- **Novel problems** where the user does not know which specialist to invoke, and Lavoisier's classification is the right entry point.
- **Cross-domain synthesis** -- when understanding a chemical system requires seeing it through multiple lenses (electronic structure via Pauling, nuclear behavior via Curie-M, bulk properties via Franklin).
- **Verification of complex results** -- when a proposed mechanism needs computational cross-checks, spectroscopic validation, and pedagogical review simultaneously.

## When NOT to use this team

- **Simple stoichiometry** -- use `mendeleev` directly. The investigation team's token cost is substantial.
- **Pure synthesis planning** where the target and starting materials are clear -- use `synthesis-team`.
- **Pure analytical or lab procedure** design -- use `lab-team`.
- **Beginner-level teaching** with no research component -- use `avogadro` directly.
- **Single-domain problems** where the classification is obvious -- route to the specialist via `lavoisier` in single-agent mode.

## Composition

The team runs all seven Chemistry Department agents:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Chair / Router** | `lavoisier` | Classification, orchestration, synthesis | Opus |
| **Periodic / Inorganic specialist** | `mendeleev` | Periodic trends, inorganic chemistry, stoichiometry | Opus |
| **Nuclear specialist** | `curie-m` | Radioactivity, nuclear reactions, isotope chemistry | Sonnet |
| **Bonding specialist** | `pauling` | Chemical bonding, molecular orbital theory, electronegativity | Opus |
| **Analytical specialist** | `hodgkin` | Spectroscopy, chromatography, crystallography, analytical methods | Sonnet |
| **Materials specialist** | `franklin` | Materials chemistry, polymers, crystal structures, surface science | Sonnet |
| **Pedagogy specialist** | `avogadro` | Level-appropriate explanation, learning pathways, mole concept | Sonnet |

Three agents run on Opus (Lavoisier, Mendeleev, Pauling) because their tasks require deep reasoning about electronic structure, periodic relationships, and multi-step classification. Four run on Sonnet because their tasks are well-defined and computationally bounded.

## Orchestration flow

```
Input: user query + optional user level + optional prior ChemistrySession hash
        |
        v
+---------------------------+
| Lavoisier (Opus)          |  Phase 1: Classify the query
| Chair / Router            |          - domain (may be multi-domain)
+---------------------------+          - complexity (routine/challenging/research-level)
        |                              - type (analyze/synthesize/explain/characterize/predict)
        |                              - user level (beginner/intermediate/advanced/graduate)
        |                              - recommended agents (subset or all)
        |
        +--------+--------+--------+--------+--------+
        |        |        |        |        |        |
        v        v        v        v        v        v
   Mendeleev  Curie-M  Pauling  Hodgkin  Franklin (Avogadro
   (periodic) (nuclear) (bond)  (analyt) (mater)   waits)
        |        |        |        |        |
    Phase 2: Specialists work in parallel, reading the same
             problem but producing independent findings in
             their own framework. Each produces a Grove record.
             Lavoisier activates only the relevant subset --
             not all 5 are invoked on every query.
        |        |        |        |        |
        +--------+--------+--------+--------+
                         |
                         v
              +---------------------------+
              | Lavoisier (Opus)          |  Phase 3: Synthesize
              | Merge specialist outputs  |          - reconcile contradictions
              +---------------------------+          - rank findings by confidence
                         |                           - produce unified response
                         v
              +---------------------------+
              | Avogadro (Sonnet)         |  Phase 4: Pedagogy wrap
              | Level-appropriate output  |          - adapt to user level
              +---------------------------+          - add learning pathway
                         |                           - suggest follow-up explorations
                         v
              +---------------------------+
              | Lavoisier (Opus)          |  Phase 5: Record
              | Produce ChemistrySession |          - link all work products
              +---------------------------+          - emit Grove record
                         |
                         v
                  Final response to user
                  + ChemistrySession Grove record
```

## Synthesis rules

Lavoisier synthesizes the specialist outputs using these rules, directly analogous to the `math-investigation-team` synthesis protocol:

### Rule 1 -- Converging findings are strengthened

When two or more specialists arrive at the same conclusion independently (e.g., Pauling predicts bond angles from orbital theory and Hodgkin confirms them via crystallographic data), mark the result as high-confidence. Cross-specialist convergence is the strongest signal available.

### Rule 2 -- Diverging findings are preserved and investigated

When specialists disagree, Lavoisier does not force a reconciliation. Instead:

1. State both findings with attribution ("Pauling's orbital analysis predicts X; Franklin's materials data shows Y").
2. Check for error: re-delegate to the specialist whose result is less expected.
3. If the disagreement persists after re-checking, escalate to Mendeleev for periodic-trend adjudication or to Hodgkin for experimental verification.
4. Report the disagreement honestly to the user.

### Rule 3 -- Experimental evidence over theoretical prediction

When Hodgkin's analytical data or Franklin's materials characterization contradicts a theoretical prediction from Pauling or Mendeleev, the experimental evidence takes priority in the synthesis. The theoretical prediction becomes a hypothesis requiring revision. This reflects chemistry's empirical foundation.

### Rule 4 -- Nuclear considerations are always flagged

Curie-M's output regarding radioactivity, isotope effects, or nuclear stability is always prominently flagged regardless of the query's primary domain. Safety implications of radioactive materials are never buried in synthesis. If Curie-M identifies radiation hazards, they appear in the response summary.

### Rule 5 -- User level governs presentation, not content

All specialist findings are included in the response regardless of user level. Avogadro adapts the presentation -- simpler language, more scaffolding, worked examples for lower levels; concise technical writing for higher levels. The chemical content does not change, only the framing.

## Input contract

The team accepts:

1. **User query** (required). Natural language chemical question, problem, or request.
2. **User level** (optional). One of: `beginner`, `intermediate`, `advanced`, `graduate`. If omitted, Lavoisier infers from the query.
3. **Prior ChemistrySession hash** (optional). Grove hash for follow-up queries.

## Output contract

### Primary output: Synthesized response

A unified response that:

- Directly answers the query
- Shows work at the appropriate level of detail
- Credits the specialists involved
- Notes any unresolved disagreements or open questions
- Flags safety considerations (especially nuclear/radiation)
- Suggests follow-up explorations

### Grove record: ChemistrySession

```yaml
type: ChemistrySession
started_at: <ISO 8601>
ended_at: <ISO 8601>
query: <original user query>
classification:
  domain: multi-domain
  complexity: research-level
  type: analyze
  user_level: graduate
agents_invoked:
  - lavoisier
  - mendeleev
  - curie-m
  - pauling
  - hodgkin
  - franklin
  - avogadro
work_products:
  - <grove hash of ChemistryAnalysis>
  - <grove hash of ChemistryReaction>
  - <grove hash of ChemistrySynthesis>
  - <grove hash of ChemistryExplanation>
concept_ids:
  - <relevant college concept IDs>
user_level: graduate
```

Each specialist's output is also a standalone Grove record (ChemistryAnalysis, ChemistryReaction, ChemistrySynthesis, or ChemistryExplanation) linked from the ChemistrySession.

## Escalation paths

### Internal escalations (within the team)

- **Pauling predicts unstable compound, Mendeleev disagrees on periodic grounds:** Re-check both. Periodic trends are heuristic; orbital calculations are more specific. If Pauling provides quantitative orbital energy arguments, they take priority over periodic generalization. Report both perspectives.
- **Hodgkin's analytical data contradicts Franklin's materials model:** Re-examine experimental conditions. Sample purity, measurement conditions, and phase transitions can reconcile apparent contradictions. If the disagreement persists, escalate to Lavoisier for literature cross-reference.
- **Curie-M identifies isotope effects that change the reaction mechanism:** Re-route the revised problem to the appropriate specialist. A reaction that looked like simple organic chemistry but involves isotope labeling should go to Curie-M and Mendeleev, not just the organic pathway.

### External escalations (from other teams)

- **From synthesis-team:** When a synthesis attempt reveals the problem requires analytical characterization or nuclear considerations beyond the synthesis team's scope, escalate to chemistry-analysis-team.
- **From lab-team:** When experimental design reveals multi-domain complexity requiring bonding theory or materials science beyond the lab team's scope, escalate to chemistry-analysis-team.

### Escalation to the user

- **Open research question:** If the problem appears to be genuinely unsolved (novel compound, unexplained spectroscopic data, or uncharacterized reaction mechanism), report this honestly with all evidence gathered.
- **Outside chemistry:** If the problem requires domain expertise outside chemistry (biological systems, geological processes, engineering constraints), Lavoisier acknowledges the boundary and suggests appropriate resources.
- **Safety concerns:** If Curie-M or any specialist identifies significant safety hazards (radiation exposure, toxic intermediates, explosive combinations), these are escalated immediately and prominently.

## Token / time cost

Approximate cost per investigation:

- **Lavoisier** -- 2 Opus invocations (classify + synthesize), ~40K tokens total
- **Specialists in parallel** -- 2 Opus (Mendeleev, Pauling) + 3 Sonnet (Curie-M, Hodgkin, Franklin), ~30-60K tokens each
- **Avogadro** -- 1 Sonnet invocation, ~20K tokens
- **Total** -- 200-400K tokens, 5-15 minutes wall-clock

This cost is justified for multi-domain and research-level problems. For single-domain or routine problems, use the specialist directly or a focused team.

## Configuration

```yaml
name: chemistry-analysis-team
chair: lavoisier
specialists:
  - periodic: mendeleev
  - nuclear: curie-m
  - bonding: pauling
  - analytical: hodgkin
  - materials: franklin
pedagogy: avogadro

parallel: true
timeout_minutes: 15

# Lavoisier may skip specialists whose domain is not relevant
auto_skip: true

# Minimum number of specialists invoked (prevents trivial routing)
min_specialists: 2
```

## Invocation

```
# Full investigation
> chemistry-analysis-team: Analyze the electronic structure, bonding
  characteristics, and catalytic behavior of transition metal complexes
  in zeolite frameworks. Level: graduate.

# Multi-domain problem
> chemistry-analysis-team: Why does water expand when it freezes? I want
  the bonding explanation, the structural analysis, the thermodynamic
  reasoning, and a version I can explain to high school students.

# Follow-up
> chemistry-analysis-team: (session: grove:abc123) Now extend that analysis
  to the effect of deuterium substitution on the phase transition.
```

## Limitations

- The team is limited to the seven agents' combined expertise. Problems requiring specialized sub-disciplines (e.g., computational quantum chemistry, polymer engineering, biochemistry) are handled at the closest available level of generality.
- Parallel specialists do not communicate during Phase 2 -- convergence is measured only at the synthesis level. This preserves independence but prevents real-time collaboration.
- The team does not access external computational resources beyond what each agent's tools provide (Bash for computation, Read/Grep for reference).
- Research-level open problems may exhaust all specialists without resolution. The team reports this honestly rather than speculating.
- No wet lab access -- all analytical and materials work is theoretical or literature-based. Hodgkin and Franklin reason about experimental design but cannot execute experiments.
