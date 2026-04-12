---
name: lab-team
type: team
category: chemistry
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/chemistry/lab-team/README.md
description: Focused chemistry team for experimental design, analytical method development, lab procedures, and safety protocols. Hodgkin leads analytical method selection and data interpretation, Curie-M handles nuclear and radiation chemistry, Lavoisier provides safety oversight and hazard classification, and Avogadro frames results pedagogically. Use for designing experiments, selecting analytical instruments, interpreting spectra, planning lab workflows, and any problem involving radioactive materials. Not for synthesis route planning, bonding theory, or broad multi-domain investigations.
superseded_by: null
---
# Lab Team

Focused four-agent team for experimental design, analytical method development, lab procedures, and safety protocols. Hodgkin leads the team, applying crystallographic and spectroscopic expertise to design experiments and interpret analytical data. This is the chemistry equivalent of `discovery-team` in the math department -- a targeted team for a specific problem shape that combines creative exploration with rigorous methodology.

## When to use this team

- **Analytical method development** -- selecting the right instrument, optimizing conditions, and validating methods for a given analyte or sample matrix.
- **Spectral interpretation** -- analyzing IR, NMR, UV-Vis, mass spectrometry, or X-ray diffraction data to determine molecular structure or composition.
- **Experimental design** -- planning a series of experiments with appropriate controls, variables, and statistical power to answer a specific chemical question.
- **Lab procedure development** -- writing step-by-step protocols for synthesis, purification, or analysis with safety considerations built in.
- **Nuclear and radiation chemistry** -- any problem involving radioactive materials, isotope handling, decay calculations, or radiation safety.
- **Quality control and assurance** -- designing QC workflows, calibration schedules, and acceptance criteria for chemical measurements.
- **Safety assessment** -- evaluating hazards for a proposed experiment, identifying SDS requirements, and designing appropriate controls.
- **Chromatographic separation** -- choosing column chemistry, mobile phase composition, and gradient programs for HPLC, GC, or ion chromatography.

## When NOT to use this team

- **Synthesis route planning** -- use `synthesis-team`. The lab team designs experiments, not synthetic routes.
- **Bonding theory or mechanism analysis** -- use `synthesis-team` (led by Pauling) or `pauling` directly.
- **Broad multi-domain investigations** -- use `chemistry-analysis-team`.
- **Pure periodic trend or inorganic questions** -- use `mendeleev` directly.
- **Beginner-level teaching** with no lab component -- use `avogadro` directly.

## Composition

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Lead / Analytical specialist** | `hodgkin` | Spectroscopy, chromatography, crystallography, method validation | Sonnet |
| **Nuclear specialist** | `curie-m` | Radioactivity, isotope chemistry, nuclear reactions, radiation safety | Sonnet |
| **Safety / Classification** | `lavoisier` | Hazard classification, safety protocols, chemical taxonomy, regulatory compliance | Opus |
| **Pedagogy specialist** | `avogadro` | Level-appropriate explanation, learning pathways, lab technique instruction | Sonnet |

One agent runs on Opus (Lavoisier) because safety classification and regulatory compliance require deep reasoning about edge cases and liability. Three run on Sonnet because analytical methods, nuclear calculations, and pedagogy are well-defined and computationally bounded.

## Orchestration flow

```
Input: user query (experiment / analysis / procedure / safety) + optional user level
        |
        v
+---------------------------+
| Hodgkin (Sonnet)          |  Phase 1: Assess the analytical problem
| Lead / Analytical         |          - identify target analyte(s)
+---------------------------+          - classify sample matrix
        |                              - determine required precision/accuracy
        |                              - evaluate instrument availability
        |
        +--------+--------+
        |        |        |
        v        v        v
    Curie-M  Lavoisier (Avogadro
    (nuclear) (safety)   waits)
        |        |
    Phase 2: Parallel specialist work
             Curie-M: radiation considerations, isotope
             effects, decay corrections, shielding needs.
             Lavoisier: hazard classification, SDS review,
             PPE requirements, waste disposal protocols,
             regulatory compliance checks.
        |        |
        +--------+
             |
             v
  +---------------------------+
  | Hodgkin (Sonnet)          |  Phase 3: Design experiment / method
  | Integrate safety + nuclear|          - finalize instrument selection
  +---------------------------+          - write step-by-step protocol
             |                           - define QC checkpoints
             |                           - specify data analysis approach
             v
  +---------------------------+
  | Lavoisier (Opus)          |  Phase 3b: Safety review
  | Final safety sign-off     |          - verify all hazards addressed
  +---------------------------+          - confirm waste disposal plan
             |                           - check regulatory compliance
             v
  +---------------------------+
  | Avogadro (Sonnet)         |  Phase 4: Pedagogy wrap
  | Level-appropriate output  |          - explain techniques clearly
  +---------------------------+          - add practical tips
             |                           - suggest skill-building exercises
             v
  +---------------------------+
  | Hodgkin (Sonnet)          |  Phase 5: Record
  | Produce Grove records     |          - ChemistryAnalysis for method
  +---------------------------+          - ChemistrySession for audit trail
             |
             v
      Final response to user
      + Grove records
```

## Synthesis rules

Hodgkin synthesizes the specialist outputs using these rules:

### Rule 1 -- Safety gates are blocking

Lavoisier's safety assessment is a blocking gate. If Lavoisier identifies an unmitigated hazard, the experimental protocol is not finalized until the hazard is addressed. No experiment proceeds without a complete safety section. This is non-negotiable and overrides efficiency, cost, or convenience considerations.

### Rule 2 -- Nuclear considerations dominate when present

When Curie-M identifies radioactive materials, isotope effects, or radiation exposure concerns, these considerations restructure the entire experimental protocol. Shielding, dosimetry, decay corrections, and waste handling for radioactive materials are not addenda -- they are primary design constraints that shape every other decision.

### Rule 3 -- Method validation before data interpretation

Hodgkin never interprets analytical data from an unvalidated method. If the user provides data without method context, Hodgkin first assesses the method's likely limitations (detection limits, interferences, precision) before drawing structural conclusions. Analytical results without method context are treated as provisional.

### Rule 4 -- Instrument selection follows the analyte

The choice of analytical instrument is driven by the analyte and the question being asked, not by instrument availability or familiarity. If the optimal instrument for a problem is XRD but the user mentions only having FTIR, Hodgkin recommends XRD first, then provides the best FTIR-based alternative with explicit limitations noted.

### Rule 5 -- Practical constraints are acknowledged, not hidden

Real lab work involves budget, time, instrument access, and skill constraints. When Avogadro frames the response, practical considerations (how long the analysis takes, what skill level is needed, approximate cost of consumables) are included alongside the technical content. Theory divorced from practice is incomplete pedagogy.

## Input contract

The team accepts:

1. **User query** (required). One of:
   - An analytical problem (identify compound X, measure concentration of Y, determine structure of Z)
   - An experimental design request (how to test hypothesis H, what controls to include)
   - A lab procedure request (step-by-step protocol for technique T)
   - Spectral data for interpretation (peaks, shifts, patterns)
   - A safety assessment request (hazards of procedure P, SDS analysis)
2. **User level** (optional). One of: `beginner`, `intermediate`, `advanced`, `graduate`. If omitted, Hodgkin infers from the query.
3. **Prior ChemistrySession hash** (optional). Grove hash for follow-up queries.

## Output contract

### Primary output: Experimental / analytical response

A structured response containing:

- **Method selection** -- chosen instrument(s) and technique(s) with justification
- **Protocol** -- step-by-step procedure with time estimates and checkpoints
- **Safety section** -- hazards, PPE, waste disposal, emergency procedures
- **Nuclear section** (if applicable) -- radiation safety, shielding, dosimetry, decay corrections
- **Expected results** -- what the data should look like if the experiment succeeds
- **Data analysis plan** -- how to process and interpret the raw data
- **QC criteria** -- acceptance criteria for calibration, blanks, and replicates
- **Follow-up suggestions** -- complementary analyses, optimization opportunities

### Grove records

The team produces one or more of:

| Record Type | When Produced | Key Fields |
|-------------|---------------|------------|
| ChemistryAnalysis | Always | technique, instrument parameters, analyte, matrix, detection limit, precision, validation status |
| ChemistryReaction | For nuclear reactions | isotope, decay mode, half-life, energy, shielding requirements |
| ChemistryExplanation | When pedagogy phase runs | topic, target level, explanation body, prerequisites, practical tips |
| ChemistrySession | Always | session ID, queries, dispatches, work product links, timestamps |

## Escalation paths

### Internal escalations (within the team)

- **Hodgkin identifies interfering species in the sample matrix:** Lavoisier classifies the interferents and Curie-M checks for radioactive isotopes. If the interference is chemical, Hodgkin redesigns the method (different column, different wavelength, matrix modification). If the interference is radiological, Curie-M redesigns the handling protocol.
- **Curie-M identifies short-lived isotope requiring rapid analysis:** The entire experimental timeline is restructured around the half-life. Hodgkin selects the fastest viable analytical technique. Lavoisier ensures the compressed timeline does not compromise safety.
- **Lavoisier flags regulatory non-compliance:** The protocol is revised before finalization. Hodgkin and Curie-M propose compliant alternatives. If no compliant alternative exists, report the regulatory barrier honestly.

### External escalations (to other teams)

- **Synthesis route needed:** When the analytical problem requires synthesizing a reference standard or derivatizing the analyte, escalate to `synthesis-team`.
- **Bonding theory needed:** When spectral interpretation requires detailed orbital analysis (e.g., explaining unusual NMR shifts via ring current effects), escalate to `chemistry-analysis-team` (which includes Pauling).
- **Multi-domain complexity:** When the problem expands beyond analytical and nuclear chemistry into materials science or broad synthetic chemistry, escalate to `chemistry-analysis-team`.

### Escalation to the user

- **Instrument not available:** If the optimal analytical method requires an instrument the user does not have access to, Hodgkin suggests the best alternative with explicit limitations and recommends external analytical service providers as a fallback.
- **Safety risk too high:** If Lavoisier determines that no safe protocol can be designed for the requested experiment with available resources (e.g., handling highly radioactive materials without proper hot cell facilities), the team reports this honestly and does not provide an unsafe protocol.
- **Outside chemistry scope:** If the problem requires biological sample handling (tissue preparation, cell culture), geological fieldwork, or engineering-scale process design, Hodgkin acknowledges the boundary.

## Token / time cost

Approximate cost per lab design:

- **Hodgkin** -- 3 Sonnet invocations (assess + design + record), ~40K tokens total
- **Curie-M** -- 1 Sonnet invocation, ~20K tokens
- **Lavoisier** -- 1 Opus invocation (safety review), ~30K tokens
- **Avogadro** -- 1 Sonnet invocation, ~20K tokens
- **Total** -- 100-180K tokens, 3-8 minutes wall-clock

More efficient than the full analysis team. For simple "what instrument should I use" questions, invoke Hodgkin directly.

## Configuration

```yaml
name: lab-team
lead: hodgkin
specialists:
  - nuclear: curie-m
  - safety: lavoisier
pedagogy: avogadro

parallel: true
timeout_minutes: 10

# Hodgkin may skip Curie-M if no nuclear considerations are present
auto_skip: true

# Minimum specialists: Hodgkin always invokes Lavoisier (safety is mandatory)
min_specialists: 1
```

## Invocation

```
# Analytical method development
> lab-team: Design an HPLC method to separate and quantify a mixture of
  caffeine, theobromine, and theophylline in chocolate samples. I have
  access to a C18 column and UV detector. Level: intermediate.

# Spectral interpretation
> lab-team: Here is an IR spectrum with strong absorptions at 3300 (broad),
  1710 (sharp), and 1050 cm-1. The molecular formula is C3H6O3. What is
  the structure?

# Nuclear chemistry
> lab-team: Design an experiment to measure the half-life of a short-lived
  isotope using a Geiger-Mueller counter. What safety precautions do I need?
  Level: advanced.

# Safety assessment
> lab-team: I want to run a Grignard reaction using magnesium turnings and
  bromobenzene in dry THF. What are the safety concerns and what PPE do I
  need?

# Follow-up
> lab-team: (session: grove:ghi789) The HPLC method gave poor resolution
  between caffeine and theobromine. How should I modify the gradient?
```

## Limitations

- No synthesis route design -- the team designs experiments and analytical methods, not synthetic routes. For synthesis, use `synthesis-team`.
- No bonding theory -- the team interprets spectra empirically and by reference to known patterns, not by deep orbital analysis. For orbital-level explanation, escalate to `chemistry-analysis-team`.
- No wet lab execution -- all work is theoretical protocol design. The team cannot run experiments, collect data, or troubleshoot instrument hardware.
- Nuclear calculations are limited to standard decay equations and shielding estimates. Complex nuclear reactor calculations or particle physics are outside scope.
- Regulatory advice is general guidance, not legal counsel. Lavoisier flags likely regulatory considerations but does not replace a certified safety officer or regulatory compliance specialist.
