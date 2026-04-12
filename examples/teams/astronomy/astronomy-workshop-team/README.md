---
name: astronomy-workshop-team
type: team
category: astronomy
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/astronomy/astronomy-workshop-team/README.md
description: Focused four-agent workshop team for stellar astrophysics problems that need spectroscopic classification, structural/evolutionary modeling, and nucleosynthetic interpretation in one pass. Payne-Gaposchkin leads classification and composition, Chandrasekhar-astro handles structure and evolution, Burbidge interprets nucleosynthesis, and Tyson delivers the result at the user's level. Use for stellar classification deep-dives, abundance analyses, evolutionary assessments, and any stellar-physics problem where the answer is in the star itself rather than its environment. Not for observational planning, galactic dynamics, or cosmological questions.
superseded_by: null
---
# Astronomy Workshop Team

A focused four-agent team for stellar astrophysics problems that need full treatment inside the star itself — classification, structure, composition, evolution, and nucleosynthesis. This team mirrors the `proof-workshop-team` and `consulting-team` patterns: a focused expertise team optimized for a specific class of problem rather than broad investigation.

## When to use this team

- **Stellar classification deep-dives** — a spectrum arrives and the question is "what is this star, and what does its composition tell us?"
- **Abundance analyses** — full elemental patterns requiring Saha-Boltzmann reasoning and nucleosynthetic interpretation together.
- **Evolutionary assessments** — taking a star's current parameters and tracing where it came from and where it is going.
- **Unusual-star investigations** — peculiar spectra, anomalous abundances, carbon-enhanced metal-poor stars, Barium stars, R Coronae Borealis stars, chemically peculiar objects.
- **Binary-system stellar physics** — mass-transfer products, blue stragglers, post-common-envelope objects.
- **Population assignment** — using abundance patterns plus structure to place a star in galactic context.
- **Stellar target preparation** — turning a catalog position into a full physical picture before observation.

## When NOT to use this team

- **Observing planning** — use `caroline-herschel` directly; this team does not handle equipment, visibility, or site planning.
- **Cosmological questions** — use `hubble` directly or `astronomy-analysis-team`; this team does not handle redshift surveys or distance-ladder work.
- **Dark matter and galaxy dynamics** — use `rubin` directly; this team is about individual stars, not galactic systems.
- **Pure pedagogy** — use `tyson` directly.
- **Solar-system orbital problems** — use `chandrasekhar-astro` directly or `astronomy-practice-team`.

## Composition

The team runs four agents:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Spectroscopy lead** | `payne-gaposchkin` | Classification, composition analysis | Opus |
| **Structure & evolution** | `chandrasekhar-astro` | Interior models, evolutionary tracks | Opus |
| **Nucleosynthesis** | `burbidge` | B^2FH processes, chemical history | Sonnet |
| **Pedagogy** | `tyson` | Level-appropriate synthesis | Sonnet |

Payne-Gaposchkin typically leads because classification and composition come first. Chandrasekhar-astro builds a structural model consistent with the classification. Burbidge interprets the composition in a broader context. Tyson produces the user-facing output.

Note: Hubble is NOT in this team. The workshop is entered directly from Hubble's routing; Hubble classifies and dispatches, then the workshop handles the stellar problem without the full router loop.

## Orchestration flow

```
Input: spectrum or stellar parameters
        |
        v
+---------------------------+
| Payne-Gaposchkin (Opus)   |  Phase 1: Classify and measure
| Spectroscopy lead         |          - MK type and luminosity class
+---------------------------+          - radial velocity
        |                              - equivalent widths
        |                              - abundance derivation
        v
+---------------------------+
| Chandrasekhar-astro (Opus)|  Phase 2: Structure and evolution
| Interior modeler          |          - stellar parameters (T, log g, M, R)
+---------------------------+          - evolutionary state
        |                              - age estimate
        |                              - predicted endpoint
        v
+---------------------------+
| Burbidge (Sonnet)         |  Phase 3: Nucleosynthesis interpretation
| Chemical evolution reader |          - site identification
+---------------------------+          - population assignment
        |                              - enrichment history
        v
+---------------------------+
| Tyson (Sonnet)            |  Phase 4: Level-appropriate wrap
| Pedagogy                  |          - adapt to user level
+---------------------------+          - explain with analogies
        |                              - flag open questions
        v
         Final response to user
         + linked Grove records
```

## Why this sequence

- **Classification first.** You cannot model a star without knowing its type; you cannot derive abundances without a model atmosphere that depends on T_eff and log g; you cannot interpret a composition until you have it. Payne-Gaposchkin anchors everything.
- **Structure second.** Chandrasekhar-astro converts observables to physical parameters. This gives you mass, age, and phase — the context in which the composition must be interpreted.
- **Nucleosynthesis third.** With classification and structure fixed, Burbidge can interpret the abundance pattern as a history rather than just a list of numbers.
- **Pedagogy last.** Tyson gets the fully reconciled picture and adapts it to the user.

## Synthesis rules

### Rule 1 — Classification anchors everything downstream

If Payne-Gaposchkin cannot classify the spectrum confidently, downstream agents work with reduced confidence. Uncertainty on type propagates to uncertainty on everything else.

### Rule 2 — Structure must be consistent with classification

Chandrasekhar-astro builds a model with inputs that match Payne-Gaposchkin's classification. If the stellar parameters cannot be reconciled (e.g., the spectrum says G2V but the inferred gravity places the star on the subgiant branch), flag the inconsistency and re-check.

### Rule 3 — Nucleosynthesis must be consistent with evolution

Burbidge's interpretation must be compatible with the star's evolutionary state. An AGB-like s-process signature on a main-sequence dwarf is suspicious — either the classification is wrong, or the star is a binary that accreted material from a companion (Barium star).

### Rule 4 — Pedagogy preserves accuracy

Tyson's final text does not oversimplify to the point of wrongness. If the science requires a difficult concept, Tyson introduces it rather than skipping it.

## Input contract

The team accepts:

1. **Spectrum or parameters** (required). Either a calibrated 1D spectrum, a parameter set (T_eff, log g, [Fe/H]), or a description of observed features.
2. **User level** (required). One of: `beginner`, `intermediate`, `advanced`, `graduate`.
3. **Source information** (optional). Instrument, S/N, prior classifications.
4. **Specific question** (optional). If the user has a specific angle ("is this a first-ascent giant?"), the team focuses on that.

## Output contract

### Primary output: Complete stellar picture

A unified result that includes:

- MK classification with confidence
- Derived stellar parameters (M, R, T_eff, L, log g, age)
- Full abundance pattern with uncertainties
- Evolutionary state and predicted endpoint
- Nucleosynthetic interpretation and population assignment
- Level-appropriate explanation

### Grove records

Each phase produces its own record:

- **AstronomyAnalysis (classification)** — Payne-Gaposchkin's MK type and abundance table
- **AstronomyAnalysis (structure)** — Chandrasekhar-astro's model
- **AstronomyAnalysis (nucleosynthesis)** — Burbidge's interpretation
- **AstronomyExplanation** — Tyson's user-facing text

All records are linked from a parent AstronomySession record (which Hubble emits when the workshop is invoked from the router flow).

## Escalation paths

### Internal escalations

- **Payne-Gaposchkin fails to classify** — Halt. Request higher S/N or additional data.
- **Chandrasekhar-astro finds inconsistent structure** — Back to Payne-Gaposchkin for re-check.
- **Burbidge finds anomalous nucleosynthesis** — Escalate to astronomy-analysis-team for full context.

### External escalations

- **Problem turns out to need observational planning** — Escalate to include caroline-herschel.
- **Problem turns out to involve galactic dynamics** — Escalate to astronomy-analysis-team (full team).
- **Problem is cosmological** — Escalate to astronomy-analysis-team.

## Token / time cost

Approximate cost:

- Payne-Gaposchkin (Opus): ~40-60K tokens
- Chandrasekhar-astro (Opus): ~30-50K tokens
- Burbidge (Sonnet): ~20-30K tokens
- Tyson (Sonnet): ~20K tokens
- **Total:** 110-160K tokens, 3-8 minutes wall-clock

Cheaper than the full analysis team but still substantial. For routine classification (just "what type is this star?") use Payne-Gaposchkin directly.

## Configuration

```yaml
name: astronomy-workshop-team
lead: payne-gaposchkin
specialists:
  - classification: payne-gaposchkin
  - structure: chandrasekhar-astro
  - nucleosynthesis: burbidge
pedagogy: tyson

parallel: false  # sequential pipeline
timeout_minutes: 10

# Classification must succeed before downstream agents run
requires_anchor_success: true
```

## Invocation

```
# Full stellar deep-dive
> astronomy-workshop-team: Here is a high-resolution spectrum of HD 122563, a
  metal-poor halo star. Give me the complete picture — classification,
  abundance pattern, evolutionary state, nucleosynthetic interpretation, and
  population assignment. Level: advanced.

# Evolutionary assessment from parameters
> astronomy-workshop-team: T_eff = 4400, log g = 1.5, [Fe/H] = -2.6, [alpha/Fe] = +0.3.
  What stage of evolution is this star in, and what does its composition tell us? Level: graduate.

# Follow-up deep analysis
> astronomy-workshop-team: (session: grove:abc123) Focus specifically on the
  r-process signatures and their implications for the enrichment site.
```

## Limitations

- The team does not handle observations (no equipment, no visibility, no site). Use `caroline-herschel` for that.
- The team does not handle galaxy-scale problems. Stellar physics only.
- Classification quality caps the analysis. Poor spectra give poor answers, and the team will say so.
- Non-LTE and 3D effects are flagged but not always corrected; for high-precision work additional tools may be needed.
- Interpretation of stars outside standard tracks (e.g., white dwarf atmospheres with strange composition) may require escalating beyond this team.
