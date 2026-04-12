---
name: science-investigation-team
type: team
category: science
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/science/science-investigation-team/README.md
description: Full Science Department investigation team for multi-domain problems spanning methodology, experimental design, data analysis, communication, and the nature of science. Darwin classifies the query along four dimensions and activates relevant specialists in parallel, then synthesizes their independent findings into a unified, level-appropriate response with a learning pathway from Pestalozzi. Use for research-level questions, graduate-level work requiring coordinated specialist input, or any problem where the domain is not obvious and different scientific perspectives may yield different insights. Not for routine experimental design, pure communication tasks, or pure methodological evaluation.
superseded_by: null
---
# Science Investigation Team

Full-department multi-method investigation team for scientific inquiry problems that span domains or resist classification. Runs specialists in parallel and synthesizes their independent findings into a coherent response.

## When to use this team

- **Multi-domain problems** spanning methodology, experimental design, data analysis, and communication -- where no single specialist covers the full scope.
- **Research-level questions** where the domain is not obvious and the problem may yield different insights from different scientific perspectives.
- **Graduate-level work** requiring coordinated input from multiple specialists (e.g., designing a study that involves field observation, controlled experiments, precise measurement, and public reporting).
- **Novel problems** where the user does not know which specialist to invoke, and Darwin's classification is the right entry point.
- **Cross-domain synthesis** -- when understanding a scientific question requires seeing it through multiple lenses (methodology via Feynman-S, experimental design via McClintock, measurement via Wu, field context via Goodall).
- **Evaluation of complex claims** -- when a claim touches methodology, data quality, communication accuracy, and historical context simultaneously.

## When NOT to use this team

- **Simple experimental design** -- use `mcclintock` directly. The investigation team's token cost is substantial.
- **Pure communication requests** where the domain is clear -- use `communication-team`.
- **Pure methodological evaluation** -- use `feynman-s` directly.
- **Beginner-level teaching** with no research component -- use `pestalozzi` directly.
- **Single-domain problems** where the classification is obvious -- route to the specialist via `darwin` in single-agent mode.

## Composition

The team runs all seven Science Department agents:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Chair / Router** | `darwin` | Classification, orchestration, synthesis | Opus |
| **Experimental design** | `mcclintock` | Controlled experiments, pattern recognition in data | Opus |
| **Communication** | `sagan` | Science communication, narrative, public understanding | Sonnet |
| **Field research** | `goodall` | Field observation, longitudinal studies, ecological systems | Opus |
| **Methodology** | `feynman-s` | Epistemology, methodological evaluation, demarcation | Sonnet |
| **Precision / rigor** | `wu` | Measurement protocols, error analysis, quantitative rigor | Sonnet |
| **Pedagogy** | `pestalozzi` | Level-appropriate learning activities, head-heart-hand | Sonnet |

Three agents run on Opus (Darwin, McClintock, Goodall) because their tasks require deep reasoning -- classification and synthesis, experimental design with confound analysis, and longitudinal field study design. Four run on Sonnet because their tasks are well-defined and bounded.

## Orchestration flow

```
Input: user query + optional user level + optional prior ScienceSession hash
        |
        v
+---------------------------+
| Darwin (Opus)             |  Phase 1: Classify the query
| Chair / Router            |          - domain (may be multi-domain)
+---------------------------+          - complexity (routine/challenging/research-level)
        |                              - type (design/analyze/explain/investigate/evaluate/communicate)
        |                              - user level (beginner/intermediate/advanced/graduate)
        |                              - recommended agents (subset or all)
        |
        +--------+--------+--------+--------+--------+
        |        |        |        |        |        |
        v        v        v        v        v        v
  McClintock   Sagan   Goodall  Feynman-S   Wu   (Pestalozzi
  (exp.dsgn)  (comm)   (field)  (method)  (rigor)  waits)
        |        |        |        |        |
    Phase 2: Specialists work in parallel, reading the same
             problem but producing independent findings in
             their own framework. Each produces a Grove record.
             Darwin activates only the relevant subset --
             not all 5 are invoked on every query.
        |        |        |        |        |
        +--------+--------+--------+--------+
                         |
                         v
              +---------------------------+
              | Darwin (Opus)             |  Phase 3: Synthesize
              | Merge specialist outputs  |          - reconcile contradictions
              +---------------------------+          - rank findings by confidence
                         |                           - produce unified response
                         v
              +---------------------------+
              | Pestalozzi (Sonnet)       |  Phase 4: Pedagogy wrap
              | Level-appropriate output  |          - adapt to user level
              +---------------------------+          - add learning pathway
                         |                           - suggest follow-up investigations
                         v
              +---------------------------+
              | Darwin (Opus)             |  Phase 5: Record
              | Produce ScienceSession   |          - link all work products
              +---------------------------+          - emit Grove record
                         |
                         v
                  Final response to user
                  + ScienceSession Grove record
```

## Synthesis rules

Darwin synthesizes the specialist outputs using these rules:

### Rule 1 -- Converging findings are strengthened

When two or more specialists arrive at the same assessment independently (e.g., McClintock identifies a confound and Feynman-S flags the same issue as a methodological flaw), mark the finding as high-confidence. Cross-specialist convergence is the strongest signal available.

### Rule 2 -- Diverging findings are preserved and investigated

When specialists disagree, Darwin does not force a reconciliation. Instead:

1. State both findings with attribution ("McClintock's experimental analysis suggests X; Goodall's field perspective suggests Y").
2. Check for error: re-delegate to the specialist whose result is less expected.
3. If the disagreement persists after re-checking, escalate to Feynman-S for epistemological adjudication.
4. Report the disagreement honestly to the user.

### Rule 3 -- Method over opinion

When Feynman-S identifies a methodological issue that another specialist's output depends on, the methodological critique takes priority. A beautifully designed experiment (McClintock) built on a flawed premise (Feynman-S) must address the premise first.

### Rule 4 -- Observation before theory

Goodall's observational findings are reported as observations, not as confirmed theories. If Goodall identifies a field pattern and McClintock proposes an experimental test, the pattern is labeled "observed, pending experimental confirmation" -- not "established."

### Rule 5 -- User level governs presentation, not content

All specialist findings are included in the response regardless of user level. Pestalozzi adapts the presentation -- simpler language, more scaffolding, hands-on activities for lower levels; concise technical writing for higher levels. The scientific content does not change, only the framing.

## Input contract

The team accepts:

1. **User query** (required). Natural language question about scientific inquiry, methodology, or a multi-domain science problem.
2. **User level** (optional). One of: `beginner`, `intermediate`, `advanced`, `graduate`. If omitted, Darwin infers from the query.
3. **Prior ScienceSession hash** (optional). Grove hash for follow-up queries.

## Output contract

### Primary output: Synthesized response

A unified response that:

- Directly addresses the query
- Shows reasoning at the appropriate level of detail
- Credits the specialists involved
- Notes any unresolved disagreements or open questions
- Suggests follow-up investigations

### Grove record: ScienceSession

```yaml
type: ScienceSession
started_at: <ISO 8601>
ended_at: <ISO 8601>
query: <original user query>
classification:
  domain: multi-domain
  complexity: research-level
  type: investigate
  user_level: graduate
agents_invoked:
  - darwin
  - mcclintock
  - goodall
  - feynman-s
  - wu
  - sagan
  - pestalozzi
work_products:
  - <grove hash of ScientificInvestigation>
  - <grove hash of ExperimentalDesign>
  - <grove hash of ScienceReport>
  - <grove hash of ScienceExplanation>
concept_ids:
  - <relevant college concept IDs>
user_level: graduate
```

Each specialist's output is also a standalone Grove record linked from the ScienceSession.

## Escalation paths

### Internal escalations (within the team)

- **McClintock designs experiment, Feynman-S identifies methodological flaw:** The flaw is addressed before the design is finalized. This is a feature, not a conflict.
- **Goodall's field observation contradicts McClintock's laboratory expectation:** Both findings are reported. A new experiment or observation may be suggested to resolve the discrepancy.
- **Wu determines measurements are insufficiently precise for the question:** The team adjusts the experimental design or acknowledges the limitation honestly.

### External escalations (from other teams)

- **From lab-design-team:** When a laboratory experiment reveals questions that require field observation or methodological critique beyond the lab team's scope.
- **From communication-team:** When a communication task reveals that the underlying science needs investigation or the methodology needs evaluation.

### Escalation to the user

- **Outside science:** If the problem requires domain expertise outside scientific inquiry (specific physics content, specific chemistry reactions), Darwin acknowledges the boundary and suggests the appropriate department.
- **Ethical questions:** If the investigation raises ethical issues that science alone cannot resolve, Darwin flags them and separates the scientific from the ethical dimensions.

## Token / time cost

Approximate cost per investigation:

- **Darwin** -- 2 Opus invocations (classify + synthesize), ~40K tokens total
- **Specialists in parallel** -- 2 Opus (McClintock, Goodall) + 3 Sonnet (Sagan, Feynman-S, Wu), ~30-60K tokens each
- **Pestalozzi** -- 1 Sonnet invocation, ~20K tokens
- **Total** -- 200-400K tokens, 5-15 minutes wall-clock

This cost is justified for multi-domain and research-level problems. For single-domain or routine problems, use the specialist directly or a focused team.

## Configuration

```yaml
name: science-investigation-team
chair: darwin
specialists:
  - experimental-design: mcclintock
  - communication: sagan
  - field-research: goodall
  - methodology: feynman-s
  - precision: wu
pedagogy: pestalozzi

parallel: true
timeout_minutes: 15

# Darwin may skip specialists whose domain is not relevant
auto_skip: true

# Minimum number of specialists invoked (prevents trivial routing)
min_specialists: 2
```

## Invocation

```
# Full investigation
> science-investigation-team: Evaluate the claim that a new study has "proven" that
  a particular diet cures cancer. Assess the methodology, the data, the communication,
  and the historical context.

# Multi-domain problem
> science-investigation-team: Design a complete research program to study the effect
  of urbanization on pollinator populations, including field observation, controlled
  experiments, measurement protocols, and a public communication plan.

# Follow-up
> science-investigation-team: (session: grove:abc123) Now critique the methodology
  of the three studies cited in that cancer diet claim.
```

## Limitations

- The team is limited to the seven agents' combined expertise. Problems requiring domain-specific scientific knowledge (e.g., organic chemistry synthesis, quantum mechanics calculations) are handled at the inquiry-methodology level, not the content level.
- Parallel specialists do not communicate during Phase 2 -- convergence is measured only at the synthesis level.
- The team does not access external computational resources beyond what each agent's tools provide.
- Genuinely novel scientific problems may exhaust all specialists without resolution. The team reports this honestly rather than speculating.
