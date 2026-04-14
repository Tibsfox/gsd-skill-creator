---
name: astronomy-analysis-team
type: team
category: astronomy
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/astronomy/astronomy-analysis-team/README.md
description: Full Astronomy Department investigation team for multi-wing problems spanning observing, stellar physics, solar-system dynamics, and cosmology. Hubble classifies the query along four dimensions and activates relevant specialists in parallel, then synthesizes their independent findings into a unified, level-appropriate response with pedagogical framing from Tyson. Use for research-level questions, graduate-level work requiring coordinated specialist input, or any problem where the wing is not obvious and different astronomical perspectives may yield different insights. Not for routine observing, pure classification, or pure orbital calculation.
superseded_by: null
---
# Astronomy Analysis Team

Full-department multi-method investigation team for astronomical problems that span wings or resist classification. Runs specialists in parallel and synthesizes their independent findings into a coherent response, analogous to how `rca-deep-team` runs multiple analysis methods on an incident and how `math-investigation-team` handles multi-domain mathematics.

## When to use this team

- **Multi-wing problems** spanning observation, stellar physics, solar-system dynamics, and cosmology — where no single specialist covers the full scope.
- **Research-level questions** where the wing is not obvious and the problem may yield different insights from different astronomical perspectives.
- **Graduate-level work** requiring coordinated input from multiple specialists (e.g., a metal-poor halo star that needs Payne-Gaposchkin's spectroscopy, Burbidge's nucleosynthesis, and Chandrasekhar-astro's evolutionary context).
- **Novel observations** where the user does not know which specialist to invoke, and Hubble's classification is the right entry point.
- **Cross-wing synthesis** — when understanding a phenomenon requires seeing it through multiple lenses (a Cepheid variable is a distance indicator, a stellar-structure test case, an astroseismology target, and a cosmological-ladder anchor).
- **Verification of complex results** — when a claim needs observational cross-checks, spectroscopic validation, dynamical modeling, and pedagogical review simultaneously.

## When NOT to use this team

- **Simple observing requests** — use `caroline-herschel` directly. The full team's token cost is substantial.
- **Pure classification** where the spectrum is in hand — use `payne-gaposchkin` directly or `astronomy-workshop-team`.
- **Pure orbital calculations** — use `chandrasekhar-astro` directly or `astronomy-practice-team`.
- **Beginner-level teaching** with no research component — use `tyson` directly.
- **Single-wing problems** where the classification is obvious — route to the specialist via `hubble` in single-agent mode.

## Composition

The team runs all seven Astronomy Department agents:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Chair / Router** | `hubble` | Classification, orchestration, synthesis | Opus |
| **Spectroscopy specialist** | `payne-gaposchkin` | Spectral classification, composition analysis | Opus |
| **Structure & dynamics specialist** | `chandrasekhar-astro` | Stellar structure, evolution, orbital mechanics | Opus |
| **Observation specialist** | `caroline-herschel` | Observing plans, field identification, target visibility | Sonnet |
| **Dynamics & dark matter specialist** | `rubin` | Rotation curves, mass profiles, dark-matter evidence | Sonnet |
| **Nucleosynthesis specialist** | `burbidge` | Element origins, B^2FH processes, chemical evolution | Sonnet |
| **Pedagogy specialist** | `tyson` | Level-appropriate explanation, misconception correction | Sonnet |

Three agents run on Opus (Hubble, Payne-Gaposchkin, Chandrasekhar-astro) because their tasks require deep multi-step reasoning. Four run on Sonnet because their tasks are well-defined and computationally bounded.

## Orchestration flow

```
Input: user query + optional user level + optional prior AstronomySession hash
        |
        v
+---------------------------+
| Hubble (Opus)             |  Phase 1: Classify the query
| Chair / Router            |          - wing (may be multi-wing)
+---------------------------+          - complexity (routine/challenging/research-level)
        |                              - type (compute/observe/explain/classify/verify)
        |                              - user level (beginner/intermediate/advanced/graduate)
        |                              - recommended agents (subset or all)
        |
        +--------+--------+--------+--------+--------+
        |        |        |        |        |        |
        v        v        v        v        v        v
    P-Gaposchkin Chandr.  C-Hersch  Rubin  Burbidge  (Tyson
    (spectra)   (dyn.)    (obs.)  (DM)   (nucsyn.)  waits)
        |        |        |        |        |
    Phase 2: Specialists work in parallel, reading the same
             problem but producing independent findings in
             their own framework. Each produces a Grove record.
             Hubble activates only the relevant subset —
             not all 5 are invoked on every query.
        |        |        |        |        |
        +--------+--------+--------+--------+
                         |
                         v
              +---------------------------+
              | Hubble (Opus)             |  Phase 3: Synthesize
              | Merge specialist outputs  |          - reconcile contradictions
              +---------------------------+          - rank findings by confidence
                         |                           - produce unified response
                         v
              +---------------------------+
              | Tyson (Sonnet)            |  Phase 4: Pedagogy wrap
              | Level-appropriate output  |          - adapt to user level
              +---------------------------+          - add misconception correction
                         |                           - suggest follow-up observations
                         v
              +---------------------------+
              | Hubble (Opus)             |  Phase 5: Record
              | Produce AstronomySession  |          - link all work products
              +---------------------------+          - emit Grove record
                         |
                         v
                  Final response to user
                  + AstronomySession Grove record
```

## Synthesis rules

Hubble synthesizes the specialist outputs using these rules, directly analogous to the `math-investigation-team` and `rca-deep-team` synthesis protocols:

### Rule 1 — Converging findings are strengthened

When two or more specialists arrive at the same result independently (e.g., Payne-Gaposchkin classifies a star as metal-poor and Burbidge identifies pure r-process enrichment), mark the result as high-confidence. Cross-specialist convergence is the strongest signal available.

### Rule 2 — Diverging findings are preserved and investigated

When specialists disagree, Hubble does not force a reconciliation. Instead:

1. State both findings with attribution ("Payne-Gaposchkin classifies as G2V; Caroline Herschel notes the observed photometry is inconsistent with G-type").
2. Check for error: re-delegate to the specialist whose result is less expected.
3. If the disagreement persists after re-checking, escalate to the most precise specialist for the wing in question.
4. Report the disagreement honestly to the user.

### Rule 3 — Observation over theory

When Caroline Herschel or Rubin reports an observational result that conflicts with a theoretical expectation, the observation takes priority in the synthesis. Theory models are adjusted to fit confirmed observations, not the other way around.

### Rule 4 — Quantitative precision over qualitative claim

When Chandrasekhar-astro or Payne-Gaposchkin produces a quantitative result (mass, distance, abundance), that value anchors any subsequent qualitative discussion. Qualitative claims are checked against the numbers.

### Rule 5 — User level governs presentation, not content

All specialist findings are included in the response regardless of user level. Tyson adapts the presentation — simpler language, more analogies, worked observations for lower levels; concise technical writing for higher levels. The astronomical content does not change, only the framing.

## Input contract

The team accepts:

1. **User query** (required). Natural language astronomical question, problem, or request.
2. **User level** (optional). One of: `beginner`, `intermediate`, `advanced`, `graduate`. If omitted, Hubble infers from the query.
3. **Observing context** (optional). Observer latitude, longitude, date/time, equipment.
4. **Prior AstronomySession hash** (optional). Grove hash for follow-up queries.

## Output contract

### Primary output: Synthesized response

A unified response that:

- Directly answers the query
- Shows work at the appropriate level of detail
- Credits the specialists involved
- Notes any unresolved disagreements or open questions
- Suggests follow-up observations or reading

### Grove record: AstronomySession

```yaml
type: AstronomySession
started_at: <ISO 8601>
ended_at: <ISO 8601>
query: <original user query>
classification:
  wing: multi-wing
  complexity: research-level
  type: explore
  user_level: graduate
agents_invoked:
  - hubble
  - payne-gaposchkin
  - chandrasekhar-astro
  - caroline-herschel
  - rubin
  - burbidge
  - tyson
work_products:
  - <grove hash of AstronomyAnalysis>
  - <grove hash of AstronomyObservation>
  - <grove hash of AstronomyExplanation>
concept_ids:
  - <relevant college concept IDs>
user_level: graduate
```

Each specialist's output is also a standalone Grove record linked from the AstronomySession.

## Escalation paths

### Internal escalations (within the team)

- **Payne-Gaposchkin classifies a spectrum, Burbidge finds inconsistent nucleosynthesis pattern:** Re-check the classification. If the pattern is genuinely unusual, report it honestly as an anomaly.
- **Rubin reports a rotation curve that disagrees with a published model:** Re-check inclination and distance. If the disagreement survives, note it as a potential target for further observation.
- **Caroline Herschel reports the target is unobservable from the user's site:** Offer alternative targets or alternative sites.

### External escalations (from other teams)

- **From astronomy-workshop-team:** When a focused analysis reveals cross-wing complexity, escalate to the full team.
- **From astronomy-practice-team:** When a practice pipeline surfaces an observation that requires full interpretation, escalate to the full team.

### Escalation to the user

- **Open research question:** If the problem appears to be genuinely unresolved (e.g., Hubble tension, specific metal-poor star whose nucleosynthesis does not fit any standard model), report this honestly with all evidence gathered.
- **Outside astronomy:** If the problem requires domain expertise outside astronomy (particle physics for dark matter candidates, atmospheric science for seeing, geology for meteorites), Hubble acknowledges the boundary and suggests appropriate resources.

## Token / time cost

Approximate cost per investigation:

- **Hubble** — 2 Opus invocations (classify + synthesize), ~40K tokens
- **Specialists in parallel** — 2 Opus (Payne-Gaposchkin, Chandrasekhar-astro) + 3 Sonnet (Caroline Herschel, Rubin, Burbidge), ~30-60K tokens each
- **Tyson** — 1 Sonnet invocation, ~20K tokens
- **Total** — 200-400K tokens, 5-15 minutes wall-clock

This cost is justified for multi-wing and research-level problems. For single-wing or routine problems, use the specialist directly or a focused team.

## Configuration

```yaml
name: astronomy-analysis-team
chair: hubble
specialists:
  - spectroscopy: payne-gaposchkin
  - structure: chandrasekhar-astro
  - observation: caroline-herschel
  - dark_matter: rubin
  - nucleosynthesis: burbidge
pedagogy: tyson

parallel: true
timeout_minutes: 15

# Hubble may skip specialists whose wing is not relevant
auto_skip: true

# Minimum number of specialists invoked (prevents trivial routing)
min_specialists: 2
```

## Invocation

```
# Full investigation
> astronomy-analysis-team: Investigate the relationship between the period-luminosity
  relation of Cepheids, their evolutionary state, and the Hubble tension. Level: graduate.

# Multi-wing problem
> astronomy-analysis-team: A metal-poor star in the halo shows a strong r-process
  signature, unusual kinematics, and photometry inconsistent with normal subdwarfs.
  I need the spectroscopy, the nucleosynthesis, the dynamics, and an explanation
  I can share with grad students.

# Follow-up
> astronomy-analysis-team: (session: grove:abc123) Now extend that analysis to
  the rest of the stellar stream.
```

## Limitations

- The team is limited to the seven agents' combined expertise. Problems requiring specialized sub-disciplines (e.g., radio interferometry, gravitational-wave detection details, planetary formation hydrodynamics) are handled at the closest available level of generality.
- Parallel specialists do not communicate during Phase 2 — convergence is measured only at the synthesis level. This preserves independence but prevents real-time collaboration.
- The team does not access external computational resources beyond what each agent's tools provide.
- Research-level open problems may exhaust all specialists without resolution. The team reports this honestly rather than speculating.
